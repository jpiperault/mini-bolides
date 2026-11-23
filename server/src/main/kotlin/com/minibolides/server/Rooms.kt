package com.minibolides.server

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.slf4j.LoggerFactory
import java.security.SecureRandom
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Date

/** Ce qu'une connexion doit envoyer à son téléphone : une trame texte, ou la fermeture. */
sealed interface Out {
    data class Text(val json: String) : Out
    data class Close(val reason: String) : Out
}

/** Un téléphone du salon. Sa file d'envoi survit aux coupures : les messages importants attendent sa reconnexion. */
class Peer(val id: String, val room: Room, val isHost: Boolean) {
    val outbox = Channel<Out>(OUTBOX_SIZE)
    /** Connexion WebSocket actuelle (null pendant une coupure). */
    var connection: Any? = null
    var graceJob: Job? = null
    var removed = false
    /** Message sorti de la file mais pas parti (connexion coupée pendant l'envoi) : renvoyé en premier. */
    @Volatile var pending: Out? = null

    fun push(json: String) {
        outbox.trySend(Out.Text(json))
    }

    companion object {
        const val OUTBOX_SIZE = 256
    }
}

class Room(val code: String, val nonce: String, val createdAt: Instant) {
    val peers = LinkedHashMap<String, Peer>()
    lateinit var host: Peer
    /** Ouvert aux arrivées (fermé pendant une course). */
    var open = true
    var nextGuest = 1
    var statsId: Long? = null
    var peakPlayers = 1
    var racesStarted = 0
}

data class LiveSnapshot(val rooms: Int, val racing: Int, val players: Int, val reconnecting: Int, val maxRooms: Int)

sealed interface JoinResult {
    data class Joined(val peer: Peer, val token: String) : JoinResult
    data class Refused(val reason: String) : JoinResult
}

/**
 * Salons en mémoire. Le serveur ne connaît pas les règles de la course : il relaie les messages entre les téléphones
 * d'un même salon, exactement comme le téléphone hôte en Wi-Fi. L'hôte (celui qui a créé le salon) arbitre :
 * il choisit le circuit, donne le départ et publie le classement ; s'il part, le salon ferme.
 */
class RoomRegistry(
    private val scope: CoroutineScope,
    private val storage: Storage,
    secret: String,
    private val maxRooms: Int,
    private val graceMs: Long,
    private val now: () -> Instant = Instant::now,
) {
    private val log = LoggerFactory.getLogger("rooms")
    private val mutex = Mutex()
    private val rooms = HashMap<String, Room>()
    private val random = SecureRandom()
    private val algorithm = Algorithm.HMAC256(secret)
    private val verifier = JWT.require(algorithm).withIssuer(ISSUER).build()

    suspend fun count(): Int = mutex.withLock { rooms.size }

    suspend fun snapshot(): LiveSnapshot = mutex.withLock {
        val peers = rooms.values.flatMap { it.peers.values }
        LiveSnapshot(rooms.size, rooms.values.count { !it.open }, peers.size, peers.count { it.connection == null }, maxRooms)
    }

    suspend fun peek(code: String): Room? = mutex.withLock { rooms[code.trim().uppercase()] }

    /** Nouveau salon dont l'appelant est l'hôte ; null si le serveur est plein. */
    suspend fun create(): Pair<Peer, String>? = mutex.withLock {
        if (rooms.size >= maxRooms) return@withLock null
        var code: String
        do code = newCode() while (code in rooms)
        val room = Room(code, newNonce(), now())
        val host = Peer(HOST_ID, room, isHost = true)
        room.host = host
        room.peers[host.id] = host
        rooms[code] = room
        log.info("salon ouvert ({} actifs)", rooms.size)
        scope.launch { room.statsId = storage.roomOpened() }
        host to token(host)
    }

    suspend fun join(code: String): JoinResult = mutex.withLock {
        val room = rooms[code.trim().uppercase()] ?: return@withLock JoinResult.Refused("room_not_found")
        if (!room.open) return@withLock JoinResult.Refused("room_locked")
        if (room.peers.size >= MAX_PLAYERS) return@withLock JoinResult.Refused("room_full")
        val peer = Peer("p${room.nextGuest++}", room, isHost = false)
        room.peers.values.forEach { it.push(control("peer_joined", "id" to peer.id)) }
        room.peers[peer.id] = peer
        room.peakPlayers = maxOf(room.peakPlayers, room.peers.size)
        saveStats(room, closed = false)
        JoinResult.Joined(peer, token(peer))
    }

    /** Identifiants des autres joueurs du salon (pour le message `joined`). */
    suspend fun others(peer: Peer): List<String> = mutex.withLock { peer.room.peers.keys.filter { it != peer.id } }

    /** Reconnexion après une coupure, avec le jeton remis à l'arrivée. */
    suspend fun resume(token: String): Peer? = mutex.withLock {
        val jwt = runCatching { verifier.verify(token) }.getOrNull() ?: return@withLock null
        val room = rooms[jwt.getClaim("r").asString()] ?: return@withLock null
        if (room.nonce != jwt.getClaim("n").asString()) return@withLock null
        room.peers[jwt.getClaim("p").asString()]?.takeIf { !it.removed }
    }

    /** La connexion [connection] devient celle du joueur ; renvoie l'ancienne, à fermer. */
    suspend fun attach(peer: Peer, connection: Any): Any? = mutex.withLock {
        peer.graceJob?.cancel()
        peer.graceJob = null
        val old = peer.connection
        peer.connection = connection
        old
    }

    /** Connexion perdue : on garde la place du joueur pendant le délai de grâce. */
    suspend fun detached(peer: Peer, connection: Any) = mutex.withLock {
        if (peer.removed || peer.connection !== connection) return@withLock
        peer.connection = null
        peer.graceJob = scope.launch {
            delay(graceMs)
            mutex.withLock { if (peer.connection == null) removeLocked(peer, "timeout") }
        }
    }

    /** Départ volontaire (bouton Quitter) : pas de délai de grâce. */
    suspend fun leave(peer: Peer) = mutex.withLock { removeLocked(peer, "left") }

    /**
     * Message du jeu [message] (JSON) de [from] vers [to] (null : tous les autres). Un message « volatile »
     * (position d'une voiture, vite périmée) n'est pas gardé pour un téléphone en cours de reconnexion.
     */
    suspend fun relay(from: Peer, to: String?, message: String, volatile: Boolean) = mutex.withLock {
        if (from.removed) return@withLock
        val frame = """{"t":"from","id":"${from.id}","m":$message}"""
        val targets = if (to == null) from.room.peers.values.filter { it !== from } else listOfNotNull(from.room.peers[to]?.takeIf { it !== from })
        for (p in targets) if (!volatile || p.connection != null) p.push(frame)
    }

    /** Départ d'une course (l'hôte ferme le salon aux arrivées) ou retour au salon (réouvert). */
    suspend fun setOpen(host: Peer, open: Boolean, track: String? = null, cc: Int? = null) = mutex.withLock {
        val room = host.room
        if (room.open && !open) {
            room.racesStarted++
            if (track != null && TRACK_ID.matches(track)) {
                val players = room.peers.size
                scope.launch { storage.raceStarted(LocalDate.now(ZoneOffset.UTC), track, (cc ?: 1).coerceIn(1, 3), players) }
            }
        }
        room.open = open
        saveStats(room, closed = false)
    }

    suspend fun kick(host: Peer, id: String) = mutex.withLock {
        val peer = host.room.peers[id]?.takeIf { !it.isHost } ?: return@withLock
        peer.push(control("kicked"))
        removeLocked(peer, "kicked")
    }

    /** Salons oubliés (téléphone de l'hôte dans un tiroir…) : fermés au bout de [maxAge]. */
    suspend fun expireOld(maxAge: Duration) = mutex.withLock {
        val limit = now().minus(maxAge)
        rooms.values.filter { it.createdAt < limit }.forEach { removeLocked(it.host, "expired") }
    }

    /** Arrêt du serveur : chaque téléphone est prévenu avant la fermeture. */
    suspend fun shutdown() = mutex.withLock {
        rooms.values.flatMap { it.peers.values }.forEach { it.outbox.trySend(Out.Close("server_restart")) }
    }

    private fun removeLocked(peer: Peer, reason: String) {
        if (peer.removed) return
        peer.removed = true
        peer.graceJob?.cancel()
        val room = peer.room
        room.peers.remove(peer.id)
        peer.outbox.trySend(Out.Close(reason))
        if (peer.isHost) {
            // L'hôte arbitre la course : sans lui, le salon s'arrête.
            room.peers.values.forEach { g ->
                g.removed = true
                g.graceJob?.cancel()
                g.push(control("room_closed"))
                g.outbox.trySend(Out.Close("room_closed"))
            }
            room.peers.clear()
            rooms.remove(room.code)
            val minutes = Duration.between(room.createdAt, now()).toMinutes()
            log.info("salon fermé ({}) après {} min, {} joueurs max, {} course(s) ; {} actifs",
                reason, minutes, room.peakPlayers, room.racesStarted, rooms.size)
            saveStats(room, closed = true)
        } else {
            room.peers.values.forEach { it.push(control("peer_left", "id" to peer.id)) }
        }
    }

    private fun saveStats(room: Room, closed: Boolean) {
        val peak = room.peakPlayers
        val races = room.racesStarted
        scope.launch {
            // La ligne est créée de façon asynchrone à l'ouverture : on lui laisse un instant.
            var id = room.statsId
            var tries = 0
            while (id == null && tries++ < 20) {
                delay(100)
                id = room.statsId
            }
            if (id != null) storage.roomUpdated(id, peak, races, closed)
        }
    }

    private fun token(peer: Peer): String = JWT.create()
        .withIssuer(ISSUER)
        .withClaim("r", peer.room.code)
        .withClaim("n", peer.room.nonce)
        .withClaim("p", peer.id)
        .withExpiresAt(Date.from(now().plus(MAX_ROOM_AGE)))
        .sign(algorithm)

    private fun newCode(): String = buildString { repeat(CODE_LENGTH) { append(CODE_ALPHABET[random.nextInt(CODE_ALPHABET.length)]) } }

    private fun newNonce(): String = ByteArray(8).also(random::nextBytes).joinToString("") { "%02x".format(it) }

    companion object {
        /** Joueurs humains par salon (la grille de départ en compte 6 avec les rivaux de l'ordinateur). */
        const val MAX_PLAYERS = 4
        const val HOST_ID = "h"
        const val CODE_LENGTH = 4
        /** Sans I ni O, pour ne pas les confondre avec 1 et 0 en dictant le code. */
        const val CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"
        val MAX_ROOM_AGE: Duration = Duration.ofHours(6)
        private const val ISSUER = "minibolides"
        private val TRACK_ID = Regex("^[a-z0-9_-]{1,24}$")

        fun control(type: String, vararg fields: Pair<String, String>): String =
            buildString {
                append("""{"t":"$type"""")
                fields.forEach { (k, v) -> append(""","$k":"${v.replace("\\", "\\\\").replace("\"", "\\\"")}"""") }
                append('}')
            }
    }
}
