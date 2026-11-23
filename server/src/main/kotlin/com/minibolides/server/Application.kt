package com.minibolides.server

import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.install
import io.ktor.server.plugins.forwardedheaders.XForwardedHeaders
import io.ktor.server.plugins.origin
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.websocket.DefaultWebSocketServerSession
import io.ktor.server.websocket.WebSockets
import io.ktor.server.websocket.pingPeriod
import io.ktor.server.websocket.timeout
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import io.ktor.websocket.readText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.ClosedReceiveChannelException
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import org.slf4j.LoggerFactory
import kotlin.time.Duration.Companion.seconds

/** Version de l'API ; une évolution incompatible passerait par /api/v2/, jamais en modifiant celle-ci. */
const val API_VERSION = 1
/** Version du serveur, la même que le tag de l'image. */
const val SERVER_VERSION = "1.0.0"
private const val MAX_FRAME = 8 * 1024L

class Deps(
    val storage: Storage,
    val registry: RoomRegistry,
    val adminEmail: String?,
    val limits: RateLimits = RateLimits(),
)

private val log = LoggerFactory.getLogger("api")

fun Application.module(deps: Deps) {
    // Cloudflare → Caddy → conteneur : schéma et hôte d'origine dans X-Forwarded-Proto et Host.
    install(XForwardedHeaders)
    install(WebSockets) {
        pingPeriod = 15.seconds // garde la connexion vivante derrière Cloudflare (coupure à 100 s d'inactivité)
        timeout = 30.seconds
        maxFrameSize = MAX_FRAME
        masking = false
    }
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            log.error("erreur {} sur {}", cause.javaClass.simpleName, call.request.local.uri.substringBefore('?'))
            call.respondText("erreur interne", status = HttpStatusCode.InternalServerError)
        }
    }

    routing {
        get("/") {
            call.respondText("Mini Bolides : serveur du jeu en ligne\n")
        }

        // Contrôle de santé de Hangar : 200 si la base répond, 503 sinon (réponse en moins d'une seconde).
        get("/health") {
            if (deps.storage.healthy()) call.respondText("ok")
            else call.respondText("base de données indisponible", status = HttpStatusCode.ServiceUnavailable)
        }

        get("/api/v1/info") {
            val wsScheme = if (call.request.origin.scheme == "https") "wss" else "ws"
            val body = JsonObject(
                mapOf(
                    "api" to JsonPrimitive(API_VERSION),
                    "server" to JsonPrimitive(SERVER_VERSION),
                    "maxPlayers" to JsonPrimitive(RoomRegistry.MAX_PLAYERS),
                    "wsUrl" to JsonPrimitive("$wsScheme://${hostOf(call)}/api/v1/rooms/ws"),
                    "contact" to JsonPrimitive(deps.adminEmail),
                ),
            )
            call.respondText(body.toString(), ContentType.Application.Json)
        }

        /** Vérifier un code avant d'entrer (affiche « salon introuvable » sans ouvrir de WebSocket). */
        get("/api/v1/rooms/{code}") {
            if (!deps.limits.allowJoin(clientIp(call))) {
                call.respondText("""{"error":"rate_limited"}""", ContentType.Application.Json, HttpStatusCode.TooManyRequests)
                return@get
            }
            val room = deps.registry.peek(call.parameters["code"].orEmpty())
            val body = if (room == null) """{"exists":false}"""
            else """{"exists":true,"open":${room.open},"players":${room.peers.size},"max":${RoomRegistry.MAX_PLAYERS}}"""
            call.respondText(body, ContentType.Application.Json)
        }

        webSocket("/api/v1/rooms/ws") { relay(deps, clientIp(call)) }
    }
}

/** Adresse publique telle que vue par le téléphone (Host transmis par Caddy). */
private fun hostOf(call: ApplicationCall): String {
    val o = call.request.origin
    val defaultPort = if (o.scheme == "https") 443 else 80
    return if (o.serverPort == defaultPort || o.serverPort <= 0) o.serverHost else "${o.serverHost}:${o.serverPort}"
}

/** IP réelle du visiteur (X-Real-IP posé par Caddy) : sert uniquement aux limites de débit, jamais journalisée. */
private fun clientIp(call: ApplicationCall): String =
    call.request.headers["X-Real-IP"]?.takeIf { it.isNotBlank() } ?: call.request.origin.remoteAddress

private suspend fun DefaultWebSocketServerSession.refuse(reason: String) {
    send(Frame.Text(RoomRegistry.control("error", "reason" to reason)))
    close(CloseReason(CloseReason.Codes.NORMAL, reason))
}

private fun idList(ids: List<String>) = ids.joinToString(",", "[", "]") { "\"$it\"" }

/**
 * Protocole (une trame JSON par message), le même que le relais Wi-Fi du téléphone hôte :
 * - premier message : `{"t":"create"}`, `{"t":"join","code":"ABCD"}` ou `{"t":"resume","token":"…"}` ;
 * - puis, de tout joueur : `{"t":"all","m":{…}}` (à tous les autres), `{"t":"to","id":"p1","m":{…}}`,
 *   avec `"v":1` pour un message volatile (position), et `{"t":"leave"}` ;
 * - de l'hôte seulement : `{"t":"lock","track":"bol","cc":2}` (départ), `{"t":"open"}`, `{"t":"kick","id":"p1"}` ;
 * - du serveur : `created` (code, peer, token), `joined` (code, peer, token, host, peers), `resumed`,
 *   `peer_joined`, `peer_left`, `from` (id, m), `room_closed`, `kicked`, `error` (reason).
 * Le contenu `m` est un message du jeu, relayé tel quel.
 */
private suspend fun DefaultWebSocketServerSession.relay(deps: Deps, ip: String) {
    val registry = deps.registry
    val first = withTimeoutOrNull(10_000) { (incoming.receiveCatching().getOrNull() as? Frame.Text)?.readText() }
    val hello = first?.let(::parse) ?: return refuse("bad_request")

    val peer: Peer = when (hello.str("t")) {
        "create" -> {
            if (!deps.limits.allowCreate(ip)) return refuse("rate_limited")
            val (host, token) = registry.create() ?: return refuse("server_full")
            host.push(RoomRegistry.control("created", "code" to host.room.code, "peer" to host.id, "token" to token))
            host
        }
        "join" -> {
            if (!deps.limits.allowJoin(ip)) return refuse("rate_limited")
            when (val r = registry.join(hello.str("code").orEmpty())) {
                is JoinResult.Refused -> return refuse(r.reason)
                is JoinResult.Joined -> {
                    val p = r.peer
                    p.push("""{"t":"joined","code":"${p.room.code}","peer":"${p.id}","token":"${r.token}","host":"${RoomRegistry.HOST_ID}","peers":${idList(registry.others(p))}}""")
                    p
                }
            }
        }
        "resume" -> {
            if (!deps.limits.allowJoin(ip)) return refuse("rate_limited")
            val p = registry.resume(hello.str("token").orEmpty()) ?: return refuse("token_invalid")
            send(Frame.Text("""{"t":"resumed","peer":"${p.id}","peers":${idList(registry.others(p))}}"""))
            p
        }
        else -> return refuse("bad_request")
    }

    val connection = this
    (registry.attach(peer, connection) as? DefaultWebSocketServerSession)?.let { old ->
        runCatching { old.close(CloseReason(CloseReason.Codes.NORMAL, "replaced")) }
    }
    val writer = launch { deliver(peer) }
    val budget = FrameBudget()
    try {
        while (isActive) {
            val frame = incoming.receive()
            if (frame !is Frame.Text) continue
            if (!budget.take()) {
                close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "rate_limited"))
                break
            }
            val msg = parse(frame.readText()) ?: continue
            val volatile = (msg["v"] as? JsonPrimitive)?.intOrNull == 1
            when (msg.str("t")) {
                "all" -> msg["m"]?.let { registry.relay(peer, null, it.toString(), volatile) }
                "to" -> msg["m"]?.let { m -> msg.str("id")?.let { registry.relay(peer, it, m.toString(), volatile) } }
                "lock" -> if (peer.isHost) registry.setOpen(peer, false, msg.str("track"), (msg["cc"] as? JsonPrimitive)?.intOrNull)
                "open" -> if (peer.isHost) registry.setOpen(peer, true)
                "kick" -> if (peer.isHost) msg.str("id")?.let { registry.kick(peer, it) }
                "leave" -> {
                    registry.leave(peer)
                    break
                }
            }
        }
    } catch (_: ClosedReceiveChannelException) {
        // Connexion fermée par le téléphone ou le réseau.
    } finally {
        registry.detached(peer, connection)
        if (peer.removed) withTimeoutOrNull(1_000) { writer.join() }
        writer.cancel()
    }
}

/** Envoie au téléphone les messages de sa file, dans l'ordre ; s'arrête sur une demande de fermeture. */
private suspend fun DefaultWebSocketServerSession.deliver(peer: Peer) {
    while (true) {
        val out = peer.pending ?: peer.outbox.receive()
        peer.pending = out
        try {
            when (out) {
                is Out.Text -> send(Frame.Text(out.json))
                is Out.Close -> {
                    peer.pending = null
                    close(CloseReason(if (out.reason == "server_restart") CloseReason.Codes.GOING_AWAY else CloseReason.Codes.NORMAL, out.reason))
                    return
                }
            }
        } catch (e: Exception) {
            return // connexion perdue : le message reste en attente pour la prochaine connexion
        }
        peer.pending = null
    }
}

private val json = Json { ignoreUnknownKeys = true }

private fun parse(text: String): JsonObject? = runCatching { json.parseToJsonElement(text) as? JsonObject }.getOrNull()

private fun JsonObject.str(key: String): String? = (this[key] as? JsonPrimitive)?.contentOrNull

/** Au plus 60 messages par seconde et par téléphone (la course en envoie une vingtaine : positions des voitures). */
private class FrameBudget(private val perSecond: Int = 60) {
    private var windowStart = System.currentTimeMillis()
    private var count = 0

    fun take(): Boolean {
        val now = System.currentTimeMillis()
        if (now - windowStart >= 1_000) {
            windowStart = now
            count = 0
        }
        return ++count <= perSecond
    }
}

/** Fermeture régulière des salons oubliés. */
fun CoroutineScope.launchHousekeeping(registry: RoomRegistry, limits: RateLimits) = launch {
    while (isActive) {
        delay(60_000)
        registry.expireOld(RoomRegistry.MAX_ROOM_AGE)
        limits.cleanup()
    }
}
