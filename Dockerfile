# syntax=docker/dockerfile:1
# Serveur du jeu en ligne (dossier server/). Construit pour linux/amd64 (serveur Hangar).

# --- Build : fat jar Ktor (les tests du serveur passent avant)
FROM gradle:8-jdk21 AS build
WORKDIR /src
COPY server/settings.gradle.kts server/build.gradle.kts ./
# Couche à part pour les dépendances : reconstruite seulement si les fichiers Gradle changent.
RUN gradle dependencies --no-daemon -q > /dev/null
COPY server/src ./src
RUN gradle test buildFatJar --no-daemon -q

# --- Exécution : JRE seul, utilisateur non-root
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build --chmod=444 /src/build/libs/mini-bolides-server.jar /app/server.jar
# /data est le seul dossier persistant ; Hangar le donne à l'utilisateur ci-dessous à chaque déploiement.
RUN mkdir -p /data && chown 10001:10001 /data
USER 10001:10001
EXPOSE 8080
# Mémoire : 75 % de la limite du conteneur (384 Mo) pour le tas, sans -Xmx fixe.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:MaxDirectMemorySize=32m", "-Xss512k", "-XX:+UseSerialGC", "-XX:+ExitOnOutOfMemoryError", "-jar", "/app/server.jar"]
