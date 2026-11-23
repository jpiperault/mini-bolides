package com.minibolides.server

import java.util.concurrent.ConcurrentHashMap

/**
 * Limites par adresse IP, en mémoire : création de salons (anti-abus) et tentatives d'entrée (empêche de deviner
 * les codes en masse). Les adresses ne sont gardées que le temps de la fenêtre et ne sont jamais journalisées.
 */
class RateLimits(
    private val createsPerMinute: Int = 10,
    private val joinsPerMinute: Int = 30,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    private val creates = ConcurrentHashMap<String, Window>()
    private val joins = ConcurrentHashMap<String, Window>()

    private class Window(var start: Long, var count: Int)

    fun allowCreate(ip: String) = allow(creates, ip, createsPerMinute)

    fun allowJoin(ip: String) = allow(joins, ip, joinsPerMinute)

    private fun allow(map: ConcurrentHashMap<String, Window>, ip: String, max: Int, windowMs: Long = 60_000): Boolean {
        val now = clock()
        val w = map.computeIfAbsent(ip) { Window(now, 0) }
        synchronized(w) {
            if (now - w.start >= windowMs) {
                w.start = now
                w.count = 0
            }
            return ++w.count <= max
        }
    }

    fun cleanup() {
        val limit = clock() - 60_000
        creates.values.removeIf { it.start < limit }
        joins.values.removeIf { it.start < limit }
    }
}
