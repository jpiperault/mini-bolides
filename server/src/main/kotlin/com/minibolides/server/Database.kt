package com.minibolides.server

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.flywaydb.core.Flyway
import org.slf4j.LoggerFactory
import java.time.LocalDate

/** Ce dont le reste du serveur a besoin côté base (remplaçable dans les tests). */
interface Storage {
    /** La base répond et les migrations sont passées. */
    suspend fun healthy(): Boolean

    /** Nouveau salon : identifiant de sa ligne de statistiques, ou null si la base est indisponible. */
    suspend fun roomOpened(): Long?

    suspend fun roomUpdated(id: Long, peakPlayers: Int, racesStarted: Int, closed: Boolean)

    /** Une course en ligne vient de partir (totaux du jour par circuit et cylindrée). */
    suspend fun raceStarted(day: LocalDate, track: String, cc: Int, players: Int) {}

    fun close() {}
}

/**
 * PostgreSQL via HikariCP. Le serveur démarre même si la base est absente : les migrations sont retentées en
 * arrière-plan et /health répond 503 tant que la base n'est pas joignable. Les salons, eux, n'en dépendent pas.
 */
class PostgresStorage(private val config: DbConfig) : Storage {
    private val log = LoggerFactory.getLogger("db")
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @Volatile private var migrated = false

    private val pool = HikariDataSource(
        HikariConfig().apply {
            jdbcUrl = config.jdbcUrl
            username = config.user
            password = config.password
            maximumPoolSize = 4
            minimumIdle = 0
            connectionTimeout = 250 // /health doit répondre en moins d'une seconde, même base arrêtée
            validationTimeout = 250
            initializationFailTimeout = -1 // ne pas échouer au démarrage si la base n'est pas encore là
            poolName = "db"
        },
    )

    fun startMigrations() {
        scope.launch {
            var attempt = 0
            while (!migrated) {
                attempt++
                try {
                    val flyway = Flyway.configure()
                        .dataSource(pool)
                        .validateMigrationNaming(true)
                        .failOnMissingLocations(true)
                        .load()
                    val result = flyway.migrate()
                    migrated = true
                    log.info("migrations ok, {} appliquée(s), schéma en version {}", result.migrationsExecuted, flyway.info().current()?.version ?: "-")
                } catch (e: Exception) {
                    if (attempt == 1 || attempt % 12 == 0) log.warn("base indisponible pour les migrations, nouvel essai dans 5 s ({})", e.javaClass.simpleName)
                    delay(5_000)
                }
            }
        }
    }

    override suspend fun healthy(): Boolean {
        if (!migrated) return false
        return withTimeoutOrNull(700) {
            withContext(Dispatchers.IO) {
                runCatching { pool.connection.use { it.isValid(1) } }.getOrDefault(false)
            }
        } ?: false
    }

    override suspend fun roomOpened(): Long? = query {
        pool.connection.use { c ->
            c.prepareStatement("INSERT INTO room_stats DEFAULT VALUES RETURNING id").use { st ->
                st.executeQuery().use { rs -> if (rs.next()) rs.getLong(1) else null }
            }
        }
    }

    override suspend fun roomUpdated(id: Long, peakPlayers: Int, racesStarted: Int, closed: Boolean) {
        query {
            pool.connection.use { c ->
                c.prepareStatement(
                    "UPDATE room_stats SET peak_players = ?, races_started = ?, " +
                        "closed_at = CASE WHEN ? THEN now() ELSE closed_at END WHERE id = ?",
                ).use { st ->
                    st.setInt(1, peakPlayers)
                    st.setInt(2, racesStarted)
                    st.setBoolean(3, closed)
                    st.setLong(4, id)
                    st.executeUpdate()
                }
            }
        }
    }

    override suspend fun raceStarted(day: LocalDate, track: String, cc: Int, players: Int) {
        query {
            pool.connection.use { c ->
                c.prepareStatement(
                    "INSERT INTO race_stats (day, track, cc, races, players) VALUES (?, ?, ?, 1, ?) " +
                        "ON CONFLICT (day, track, cc) DO UPDATE SET races = race_stats.races + 1, players = race_stats.players + EXCLUDED.players",
                ).use { st ->
                    st.setObject(1, day)
                    st.setString(2, track)
                    st.setInt(3, cc)
                    st.setInt(4, players)
                    st.executeUpdate()
                }
            }
        }
    }

    /** Requête hors du fil des salons ; null (et un avertissement) si la base est indisponible. */
    private suspend fun <T> query(block: () -> T?): T? {
        if (!migrated) return null
        return withContext(Dispatchers.IO) {
            try {
                block()
            } catch (e: Exception) {
                log.warn("requête impossible ({})", e.javaClass.simpleName)
                null
            }
        }
    }

    override fun close() {
        scope.cancel()
        pool.close()
    }
}
