package com.minibolides.server

import org.slf4j.LoggerFactory
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/**
 * /data, seul dossier persistant (sauvegardé chaque nuit par Hangar, pendant que le serveur tourne).
 * Le serveur n'y garde que sa documentation : tout l'état utile est dans PostgreSQL ou en mémoire (salons).
 */
object DataDir {
    private val log = LoggerFactory.getLogger("data")

    const val README = "LISEZMOI.txt"

    val readme = """
        |Mini Bolides : dossier /data du serveur du jeu en ligne
        |=======================================================
        |
        |Ce dossier est le seul conservé entre deux déploiements ; Hangar le sauvegarde chaque nuit avec la base.
        |
        |Contenu :
        |- $README : ce fichier. Réécrit à chaque démarrage s'il manque ou s'il a changé.
        |
        |Rien d'autre n'est rangé ici :
        |- les salons en cours vivent en mémoire et se ferment à chaque redéploiement ;
        |- les statistiques anonymes (salons ouverts, courses par circuit et cylindrée) sont dans PostgreSQL ;
        |- les secrets viennent des variables d'environnement saisies dans Hangar (SESSION_SECRET…).
        |
        |Restauration : remettre la base et ce dossier suffit ; tout ce qui manque ici se recrée tout seul au démarrage.
        |""".trimMargin()

    /** Écrit la documentation (fichier temporaire puis renommage : jamais de fichier à moitié écrit dans une sauvegarde). */
    fun prepare(dir: String) {
        try {
            val root = File(dir)
            if (!root.isDirectory) {
                log.warn("dossier de données {} absent : documentation non écrite", dir)
                return
            }
            val target = File(root, README)
            if (target.isFile && target.readText() == readme) return
            writeAtomically(target, readme)
            log.info("documentation écrite dans {}", README)
        } catch (e: Exception) {
            // Jamais bloquant : le jeu en ligne n'a pas besoin de /data.
            log.warn("documentation de {} non écrite ({})", dir, e.javaClass.simpleName)
        }
    }

    fun writeAtomically(target: File, text: String) {
        val tmp = File(target.parentFile, target.name + ".tmp")
        tmp.writeText(text)
        Files.move(tmp.toPath(), target.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE)
    }
}
