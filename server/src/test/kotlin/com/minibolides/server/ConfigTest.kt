package com.minibolides.server

import java.io.File
import java.nio.file.Files
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ConfigTest {
    private val ok = mapOf(
        "DATABASE_URL" to "postgresql://bolides:p%40ss@postgres:5432/bolides",
        "SESSION_SECRET" to "s".repeat(64),
    )

    @Test
    fun readsTheEnvironment() {
        val c = Config.fromEnv(ok + ("ADMIN_EMAIL" to "admin@example.org"))
        assertEquals("jdbc:postgresql://postgres:5432/bolides", c.db.jdbcUrl)
        assertEquals("bolides", c.db.user)
        assertEquals("p@ss", c.db.password)
        assertEquals("admin@example.org", c.adminEmail)
        assertEquals("/data", c.dataDir)
    }

    @Test
    fun missingVariablesAreNamed() {
        val e1 = assertFailsWith<ConfigException> { Config.fromEnv(ok - "SESSION_SECRET") }
        assertTrue("SESSION_SECRET" in e1.message!!)
        val e2 = assertFailsWith<ConfigException> { Config.fromEnv(ok - "DATABASE_URL") }
        assertTrue("DATABASE_URL" in e2.message!!)
        assertFailsWith<ConfigException> { Config.fromEnv(ok + ("SESSION_SECRET" to "court")) }
        assertFailsWith<ConfigException> { Config.fromEnv(ok + ("DATABASE_URL" to "mysql://x/y")) }
        assertFailsWith<ConfigException> { Config.fromEnv(ok + ("ADMIN_EMAIL" to "pas-une-adresse")) }
    }

    @Test
    fun readmeIsWrittenAtomically() {
        val dir = Files.createTempDirectory("data").toFile()
        DataDir.prepare(dir.path)
        val f = File(dir, DataDir.README)
        assertEquals(DataDir.readme, f.readText())
        assertTrue(!File(dir, DataDir.README + ".tmp").exists())
        DataDir.prepare(dir.path) // deuxième démarrage : rien ne change
        assertEquals(DataDir.readme, f.readText())
    }
}
