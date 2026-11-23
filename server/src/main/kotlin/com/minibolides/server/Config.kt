package com.minibolides.server

import java.net.URI
import java.net.URLDecoder

/** Variable d'environnement obligatoire absente ou invalide : le serveur refuse de démarrer. */
class ConfigException(message: String) : Exception(message)

/** Connexion JDBC tirée de DATABASE_URL (URI libpq fournie par Hangar). */
data class DbConfig(val jdbcUrl: String, val user: String?, val password: String?)

/** Toute la configuration vient de l'environnement : aucun secret ni domaine dans le code ou l'image. */
data class Config(
    val db: DbConfig,
    val sessionSecret: String,
    val adminEmail: String?,
    val dataDir: String,
    val maxRooms: Int,
    val graceSeconds: Long,
) {
    companion object {
        const val PORT = 8080

        fun fromEnv(env: Map<String, String> = System.getenv()): Config {
            fun required(key: String): String =
                env[key]?.takeIf { it.isNotBlank() }
                    ?: throw ConfigException("Variable d'environnement obligatoire manquante : $key")

            val secret = required("SESSION_SECRET")
            if (secret.length < 32) throw ConfigException("SESSION_SECRET doit faire au moins 32 caractères (openssl rand -hex 32)")
            val email = env["ADMIN_EMAIL"]?.trim()?.takeIf { it.isNotEmpty() }
            if (email != null && !email.contains('@')) throw ConfigException("ADMIN_EMAIL invalide : adresse e-mail attendue")
            return Config(
                db = parseDatabaseUrl(required("DATABASE_URL")),
                sessionSecret = secret,
                adminEmail = email,
                dataDir = env["DATA_DIR"]?.takeIf { it.isNotBlank() } ?: "/data",
                maxRooms = env["MAX_ROOMS"]?.toIntOrNull()?.takeIf { it > 0 } ?: 300,
                graceSeconds = env["RECONNECT_GRACE_SECONDS"]?.toLongOrNull()?.takeIf { it > 0 } ?: 30,
            )
        }

        /**
         * `postgresql://user:mdp@hôte:5432/base?options` → `jdbc:postgresql://hôte:5432/base?options`,
         * l'utilisateur et le mot de passe étant passés à part (et décodés : ils peuvent contenir des %xx).
         */
        fun parseDatabaseUrl(url: String): DbConfig {
            val uri = runCatching { URI(url) }.getOrNull()
            if (uri == null || (uri.scheme != "postgresql" && uri.scheme != "postgres") || uri.host == null) {
                throw ConfigException("DATABASE_URL invalide : format attendu postgresql://utilisateur:mot_de_passe@hôte:5432/base")
            }
            val path = uri.rawPath?.trimStart('/').orEmpty()
            if (path.isEmpty()) throw ConfigException("DATABASE_URL invalide : nom de base manquant")
            val port = if (uri.port > 0) uri.port else 5432
            val query = uri.rawQuery?.let { "?$it" }.orEmpty()
            val info = uri.rawUserInfo
            fun decode(s: String) = URLDecoder.decode(s, Charsets.UTF_8)
            return DbConfig(
                jdbcUrl = "jdbc:postgresql://${uri.host}:$port/$path$query",
                user = info?.substringBefore(':')?.let(::decode),
                password = info?.takeIf { ':' in it }?.substringAfter(':')?.let(::decode),
            )
        }
    }
}
