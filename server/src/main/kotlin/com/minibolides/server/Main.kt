package com.minibolides.server

import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeoutOrNull
import org.slf4j.LoggerFactory
import kotlin.system.exitProcess

fun main() {
    val log = LoggerFactory.getLogger("main")
    val config = try {
        Config.fromEnv()
    } catch (e: ConfigException) {
        // Message clair sur la sortie standard et code d'erreur : Hangar garde la version précédente.
        log.error("démarrage impossible : {}", e.message)
        exitProcess(1)
    }

    DataDir.prepare(config.dataDir)
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    val storage = PostgresStorage(config.db).also { it.startMigrations() }
    val limits = RateLimits()
    val registry = RoomRegistry(scope, storage, config.sessionSecret, config.maxRooms, config.graceSeconds * 1_000)
    scope.launchHousekeeping(registry, limits)

    val server = embeddedServer(Netty, port = Config.PORT, host = "0.0.0.0") {
        module(Deps(storage, registry, config.adminEmail, limits))
    }

    // SIGTERM (arrêt ou nouveau déploiement) : prévenir les téléphones, puis s'arrêter bien avant les 10 s de Docker.
    Runtime.getRuntime().addShutdownHook(
        Thread {
            log.info("arrêt demandé")
            runBlocking { withTimeoutOrNull(1_000) { registry.shutdown() } }
            server.stop(gracePeriodMillis = 500, timeoutMillis = 3_000)
            scope.cancel()
            storage.close()
            log.info("arrêté")
        },
    )

    log.info("écoute sur 0.0.0.0:{} (version {})", Config.PORT, SERVER_VERSION)
    server.start(wait = true)
}
