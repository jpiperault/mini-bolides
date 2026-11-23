package com.minibolides.game;

import android.content.Context;
import android.os.Build;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;

/**
 * Plantage de l'appli : écrit dans un fichier (files/plantages), puis envoyé au démarrage suivant en POST JSON à
 * crash_url avec l'en-tête X-Hangar-Key: crash_key (lus dans la configuration à distance). Aucune donnée personnelle :
 * version de l'appli, modèle et version d'Android, pile d'appels.
 */
final class CrashReport {
    private static final int MAX_KEPT = 10;

    private CrashReport() {}

    static File dir(Context c) { return new File(c.getFilesDir(), "plantages"); }

    static void install(Context context) {
        Context app = context.getApplicationContext();
        Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            try { write(app, thread, error); } catch (Throwable ignored) { /* ne jamais masquer le plantage d'origine */ }
            if (previous != null) previous.uncaughtException(thread, error);
            else System.exit(2);
        });
    }

    static void write(Context c, Thread thread, Throwable error) throws Exception {
        StringWriter sw = new StringWriter();
        error.printStackTrace(new PrintWriter(sw));
        JSONObject o = new JSONObject();
        o.put("app", BuildConfig.APPLICATION_ID);
        o.put("version_code", BuildConfig.VERSION_CODE);
        o.put("version_name", BuildConfig.VERSION_NAME);
        o.put("android", Build.VERSION.SDK_INT);
        o.put("device", Build.MANUFACTURER + " " + Build.MODEL);
        o.put("time", System.currentTimeMillis());
        o.put("thread", thread.getName());
        o.put("exception", error.getClass().getName());
        o.put("stack", sw.toString());
        File d = dir(c);
        d.mkdirs();
        File tmp = new File(d, System.currentTimeMillis() + ".json.tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(o.toString().getBytes(StandardCharsets.UTF_8)); out.getFD().sync(); }
        tmp.renameTo(new File(d, tmp.getName().replace(".tmp", "")));
    }

    /** Envoie les plantages en attente (fil d'arrière-plan). Gardés tant que l'envoi échoue, 10 au plus. */
    static void sendPending(Context c, String url, String key) {
        File[] files = dir(c).listFiles((f, n) -> n.endsWith(".json"));
        if (files == null || files.length == 0) return;
        Arrays.sort(files);
        for (int i = 0; i < files.length - MAX_KEPT; i++) files[i].delete();
        if (url == null || url.isEmpty()) return;
        for (File f : files) {
            if (!f.exists()) continue;
            HttpURLConnection h = null;
            try {
                byte[] body = Files.readAllBytes(f.toPath());
                h = (HttpURLConnection) new URL(url).openConnection();
                h.setConnectTimeout(5000); h.setReadTimeout(5000); h.setDoOutput(true); h.setFixedLengthStreamingMode(body.length);
                h.setRequestProperty("Content-Type", "application/json");
                if (key != null && !key.isEmpty()) h.setRequestProperty("X-Hangar-Key", key);
                try (OutputStream out = h.getOutputStream()) { out.write(body); }
                int code = h.getResponseCode();
                if (code >= 200 && code < 300) f.delete();
                else if (code >= 400 && code < 500) f.delete();   // refusé pour de bon : inutile de réessayer
                else return;
            } catch (Exception e) {
                return;   // pas de réseau : nouvel essai au prochain démarrage
            } finally { if (h != null) h.disconnect(); }
        }
    }
}
