# Déployer le serveur de « Mini Bolides » sur Hangar

Le serveur (`server/`, Kotlin + Ktor) fait tourner le **jeu en ligne**. Il crée des salons de 2 à 4 pilotes, identifiés par un code de 4 lettres, et relaie par WebSocket les messages de la course entre les téléphones du salon : départ, position des voitures une vingtaine de fois par seconde, classement. Le téléphone qui a créé le salon arbitre la course, comme en Wi-Fi, où ce téléphone fait lui-même le relais avec le même protocole.

La base PostgreSQL ne garde que des statistiques anonymes : salons ouverts et nombre de courses par jour, circuit et cylindrée. Elle ne stocke ni pseudo, ni adresse IP, ni identifiant de téléphone.

## Valeurs à saisir dans Hangar (Nouvelle application)

| Champ | Valeur |
|---|---|
| Type | Backend d'appli mobile |
| Nom | Mini Bolides |
| Identifiant | mini-bolides |
| Adresse | Sous-domaine `mini-bolides` (https://mini-bolides.piperault.fr/) |
| Source | Image Docker `ghcr.io/jpiperault/mini-bolides` (publique) |
| Version | tag publié, par exemple `1.0.0` |
| Port interne | 8080 |
| Adresse de santé | `/health` |
| RAM max (Mo) | 384 |
| Base PostgreSQL | oui |
| Client mobile : package Android | `com.minibolides.game` |

Pour la découverte du serveur par l'appli, `https://apps.piperault.fr/.well-known/apps.json` doit contenir `"com.minibolides.game": "https://mini-bolides.piperault.fr/"`.

## Variables d'environnement

| Clé | Obligatoire | Rôle | Comment la générer |
|---|---|---|---|
| `DATABASE_URL` | oui | Connexion PostgreSQL (`postgresql://utilisateur:mot_de_passe@postgres:5432/base`) | **Injectée par Hangar, ne pas la saisir.** |
| `SESSION_SECRET` | oui | Signature des sessions : le jeton remis à chaque pilote d'un salon, qui lui permet de reprendre sa place après une coupure réseau. 32 caractères au moins. | `openssl rand -hex 32` |
| `ADMIN_EMAIL` | non | Adresse de l'administrateur, renvoyée comme contact par `GET /api/v1/info`. Elle est donc publique. | ton adresse de contact |
| `MAX_ROOMS` | non | Nombre maximal de salons ouverts en même temps (300 par défaut). | entier |
| `RECONNECT_GRACE_SECONDS` | non | Durée pendant laquelle la place d'un pilote déconnecté est gardée (30 s par défaut). | entier |

Si `DATABASE_URL` ou `SESSION_SECRET` manque ou est invalide, le conteneur s'arrête aussitôt avec un message qui nomme la variable, par exemple `démarrage impossible : Variable d'environnement obligatoire manquante : SESSION_SECRET`. Hangar remet alors la version précédente.

Changer `SESSION_SECRET` empêche seulement de reprendre les salons en cours. Ces salons sont de toute façon perdus à chaque redéploiement, car ils vivent en mémoire.

## Mettre à jour

Le dépôt dédié `jpiperault/mini-bolides` contient le dossier `mini-bolides` du monorepo. Le workflow `.github/workflows/docker.yml` publie l'image à chaque tag `v*`.

```bash
git tag v1.2.0 && git push --tags
```

1. Attendre la fin de l'Action GitHub « Image Docker » (onglet Actions du dépôt). Elle publie `ghcr.io/jpiperault/mini-bolides:1.2.0`, le tag sans le `v`, pour linux/amd64. Elle ne publie jamais `latest`.
2. Dans Hangar, bloc **Version** : saisir `1.2.0`, puis **Déployer**.
3. En cas de problème : **Revenir à…** la version précédente.

Un déploiement ferme les salons en cours : les pilotes voient « Le serveur redémarre » et recréent un salon. Mieux vaut donc déployer quand personne ne joue.

Après la première publication, vérifie que le paquet est bien **public** (GitHub › Packages › mini-bolides › Package settings › Change visibility). GitHub crée souvent un nouveau paquet en privé, et Hangar ne pourrait alors pas le télécharger sans identifiants.

## Compatibilité avec les anciennes versions de l'appli

- L'API est sous `/api/v1/`. Une évolution incompatible passerait par `/api/v2/` sans toucher à la v1.
- Le contenu des messages de la course (`m`) est relayé tel quel. Le serveur ne dépend donc pas des règles du jeu, et une nouvelle version de l'appli n'impose pas de nouvelle version du serveur.
- Les messages du jeu portent une version (`proto`). Si deux pilotes d'un salon ont des versions incompatibles, l'hôte refuse le départ et demande la mise à jour.
- La configuration à distance (`apps/com.minibolides.game.json`) peut afficher un message, couper le jeu en ligne (`"flags": {"online": false}`) ou exiger une version minimale (`min_version_code`).

## Sauvegardes et restauration

Tout l'état durable est dans PostgreSQL : les tables `room_stats` et `race_stats`, plus l'historique des migrations Flyway. Les salons en cours ne sont pas sauvegardés : ils vivent en mémoire et se recréent à la demande.

Contenu de `/data` :

| Fichier | Rôle | S'il manque |
|---|---|---|
| `LISEZMOI.txt` | Explique ce que contient ce dossier. | Réécrit au démarrage (fichier temporaire, puis renommage). |

Le serveur n'écrit rien d'autre dans `/data` : aucun secret (ils viennent des variables d'environnement), aucune base SQLite. Après une restauration, la base et `/data` sont remis tels quels, et l'appli redémarre dans sa version actuelle. Au démarrage, les migrations amènent la base restaurée, quelle que soit sa version, au schéma actuel.

## Migrations

Les fichiers `server/src/main/resources/db/migration/V<n>__nom.sql` sont appliqués au démarrage par Flyway, dans l'ordre. Elles sont idempotentes et uniquement additives : on ne supprime ni ne renomme jamais une table ou une colonne. Elles n'utilisent aucun nom de base ou d'utilisateur en dur, ni aucune extension qui exige un super-utilisateur. Si la base n'est pas encore prête, le serveur démarre quand même : il retente les migrations toutes les 5 s et `/health` répond 503 en attendant.

## Contrôle de santé

`GET /health` répond `200 ok` si la base répond, et `503` sinon, en moins d'une seconde dans les deux cas, sans authentification. Pendant une panne de base, les salons continuent de marcher : le jeu en ligne n'a pas besoin de la base.

## Test local

```bash
docker compose -f docker-compose.local.yml up --build
```

```bash
curl -i http://127.0.0.1:8080/health
```

Ce fichier reproduit le serveur : PostgreSQL 17, `DATABASE_URL` au même format, `./.data` monté sur `/data`, 384 Mo de mémoire, port publié sur 127.0.0.1 seulement. Comme Hangar, donne `.data` à l'utilisateur de l'image une fois : `sudo chown 10001:10001 .data`.

Le jeu peut viser ce serveur depuis un navigateur : `index.html?server=http://127.0.0.1:8080/`.

Les tests du serveur tournent pendant `docker build`, à l'étape de build. Les tests du jeu en réseau se lancent avec `node tests/net.test.js`.
