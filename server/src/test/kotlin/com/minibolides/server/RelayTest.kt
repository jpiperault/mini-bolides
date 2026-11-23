package com.minibolides.server

import io.ktor.client.plugins.websocket.DefaultClientWebSocketSession
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.webSocketSession
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

private class FakeStorage(var ok: Boolean = true) : Storage {
    val races = mutableListOf<String>()
    override suspend fun healthy() = ok
    override suspend fun roomOpened(): Long? = 1
    override suspend fun roomUpdated(id: Long, peakPlayers: Int, racesStarted: Int, closed: Boolean) {}
    override suspend fun raceStarted(day: LocalDate, track: String, cc: Int, players: Int) {
        races += "$track/$cc/$players"
    }
}

class RelayTest {
    private fun setup(storage: Storage = FakeStorage(), graceMs: Long = 60_000): Deps {
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
        return Deps(storage, RoomRegistry(scope, storage, "x".repeat(64), maxRooms = 10, graceMs = graceMs), "admin@example.org")
    }

    private fun ApplicationTestBuilder.app(deps: Deps) {
        application { module(deps) }
    }

    private suspend fun DefaultClientWebSocketSession.next(): JsonObject = withTimeout(5_000) {
        while (true) {
            val f = incoming.receive()
            if (f is Frame.Text) return@withTimeout Json.parseToJsonElement(f.readText()).jsonObject
        }
        @Suppress("UNREACHABLE_CODE") error("")
    }

    private suspend fun DefaultClientWebSocketSession.nothing(ms: Long = 300): JsonObject? =
        withTimeoutOrNull(ms) { next() }

    private fun JsonObject.s(k: String) = this[k]!!.jsonPrimitive.content

    private suspend fun DefaultClientWebSocketSession.say(text: String) = send(Frame.Text(text))

    private fun ApplicationTestBuilder.ws() = createClient { install(WebSockets) }

    @Test
    fun healthFollowsTheDatabase() = testApplication {
        val storage = FakeStorage()
        app(setup(storage))
        assertEquals(HttpStatusCode.OK, client.get("/health").status)
        assertEquals("ok", client.get("/health").bodyAsText())
        storage.ok = false
        assertEquals(HttpStatusCode.ServiceUnavailable, client.get("/health").status)
        storage.ok = true
        assertEquals(HttpStatusCode.OK, client.get("/health").status)
    }

    @Test
    fun infoBuildsUrlFromForwardedHeaders() = testApplication {
        app(setup())
        val body = client.get("/api/v1/info") {
            header("X-Forwarded-Proto", "https")
            header("X-Forwarded-Host", "mini-bolides.example.org")
            header("Host", "mini-bolides.example.org")
        }.bodyAsText()
        assertTrue("\"wsUrl\":\"wss://mini-bolides.example.org/api/v1/rooms/ws\"" in body, body)
        assertTrue("\"api\":1" in body)
    }

    @Test
    fun raceMessagesReachEveryoneElse() = testApplication {
        val storage = FakeStorage()
        app(setup(storage))
        val c = ws()
        val host = c.webSocketSession("/api/v1/rooms/ws")
        host.say("""{"t":"create"}""")
        val created = host.next()
        assertEquals("created", created.s("t"))
        val code = created.s("code")
        assertEquals(4, code.length)

        val a = c.webSocketSession("/api/v1/rooms/ws")
        a.say("""{"t":"join","code":"${code.lowercase()}"}""")
        val ja = a.next()
        assertEquals("joined", ja.s("t"))
        assertEquals("p1", ja.s("peer"))
        assertEquals(listOf("h"), ja["peers"]!!.jsonArray.map { it.jsonPrimitive.content })
        assertEquals("peer_joined", host.next().s("t"))

        val b = c.webSocketSession("/api/v1/rooms/ws")
        b.say("""{"t":"join","code":"$code"}""")
        assertEquals(listOf("h", "p1"), b.next()["peers"]!!.jsonArray.map { it.jsonPrimitive.content })
        assertEquals("p2", host.next().s("id"))
        assertEquals("p2", a.next().s("id"))

        // Une position envoyée par un invité arrive à l'hôte et à l'autre invité, pas à lui-même.
        a.say("""{"t":"all","v":1,"m":{"k":"st","x":1.5}}""")
        val atHost = host.next()
        assertEquals("from", atHost.s("t"))
        assertEquals("p1", atHost.s("id"))
        assertEquals("st", atHost["m"]!!.jsonObject.s("k"))
        assertEquals("p1", b.next().s("id"))
        assertNull(a.nothing())

        // Message à un seul joueur.
        host.say("""{"t":"to","id":"p2","m":{"k":"hi"}}""")
        assertEquals("hi", b.next()["m"]!!.jsonObject.s("k"))
        assertNull(a.nothing())

        // Départ : le salon se ferme aux arrivées, la course est comptée.
        host.say("""{"t":"lock","track":"bol","cc":2}""")
        delay(200)
        val late = c.webSocketSession("/api/v1/rooms/ws")
        late.say("""{"t":"join","code":"$code"}""")
        assertEquals("room_locked", late.next().s("reason"))
        assertEquals(listOf("bol/2/3"), storage.races)

        // Un invité qui part : les autres sont prévenus.
        b.say("""{"t":"leave"}""")
        assertEquals("p2", host.next().s("id"))
        assertEquals("peer_left", a.next().s("t"))

        // L'hôte qui part ferme le salon.
        host.say("""{"t":"leave"}""")
        assertEquals("room_closed", a.next().s("t"))
    }

    @Test
    fun guestsCannotLockOrKick() = testApplication {
        app(setup())
        val c = ws()
        val host = c.webSocketSession("/api/v1/rooms/ws")
        host.say("""{"t":"create"}""")
        val code = host.next().s("code")
        val a = c.webSocketSession("/api/v1/rooms/ws")
        a.say("""{"t":"join","code":"$code"}""")
        a.next(); host.next()
        a.say("""{"t":"lock"}""")
        a.say("""{"t":"kick","id":"h"}""")
        delay(200)
        val b = c.webSocketSession("/api/v1/rooms/ws")
        b.say("""{"t":"join","code":"$code"}""")
        assertEquals("joined", b.next().s("t"))
    }

    @Test
    fun resumeKeepsThePlace() = testApplication {
        app(setup())
        val c = ws()
        val host = c.webSocketSession("/api/v1/rooms/ws")
        host.say("""{"t":"create"}""")
        val code = host.next().s("code")
        val a = c.webSocketSession("/api/v1/rooms/ws")
        a.say("""{"t":"join","code":"$code"}""")
        val token = a.next().s("token")
        host.next()
        a.cancel()
        delay(300)
        // Pendant la coupure, les positions ne sont pas gardées, les messages importants si.
        host.say("""{"t":"all","v":1,"m":{"k":"st"}}""")
        host.say("""{"t":"all","m":{"k":"start"}}""")
        delay(200)
        val again = c.webSocketSession("/api/v1/rooms/ws")
        again.say("""{"t":"resume","token":"$token"}""")
        assertEquals("resumed", again.next().s("t"))
        assertEquals("start", again.next()["m"]!!.jsonObject.s("k"))
        assertNull(again.nothing())
    }

    @Test
    fun unknownRoomAndBadToken() = testApplication {
        app(setup())
        val c = ws()
        val a = c.webSocketSession("/api/v1/rooms/ws")
        a.say("""{"t":"join","code":"ZZZZ"}""")
        assertEquals("room_not_found", a.next().s("reason"))
        val b = c.webSocketSession("/api/v1/rooms/ws")
        b.say("""{"t":"resume","token":"faux"}""")
        assertEquals("token_invalid", b.next().s("reason"))
        assertEquals("""{"exists":false}""", client.get("/api/v1/rooms/ZZZZ").bodyAsText())
    }
}
