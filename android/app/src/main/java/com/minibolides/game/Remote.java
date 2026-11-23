package com.minibolides.game;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Adresse du serveur et configuration à distance, lues au démarrage en arrière-plan (5 s au plus chacune) :
 * - https://apps.piperault.fr/.well-known/apps.json → entrée APPLICATION_ID = adresse du serveur, mémorisée ;
 * - https://apps.piperault.fr/.well-known/apps/<package>.json → min_version_code, recommended_version_code,
 *   flags, message, crash_url, crash_key, mémorisée.
 * Sans réseau, la dernière valeur mémorisée sert, et à défaut BuildConfig.DEFAULT_BASE_URL.
 */
final class Remote {
    static final String PREFS = "remote";
    private static final int TIMEOUT_MS = 5000;
    private static volatile Runnable onChange;

    private Remote() {}

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static String serverUrl(Context c) {
        String u = prefs(c).getString("server_url", null);
        return u != null && (u.startsWith("https://") || u.startsWith("http://")) ? u : BuildConfig.DEFAULT_BASE_URL;
    }

    static String config(Context c) { return prefs(c).getString("config", "{}"); }

    static void setOnChange(Runnable r) { onChange = r; }

    static void refresh(Context context) {
        Context c = context.getApplicationContext();
        Thread t = new Thread(() -> {
            try {
                JSONObject apps = new JSONObject(get(BuildConfig.APPS_URL + "apps.json"));
                String url = apps.optString(BuildConfig.APPLICATION_ID, "");
                if (url.startsWith("https://") || url.startsWith("http://")) {
                    if (!url.endsWith("/")) url += "/";
                    prefs(c).edit().putString("server_url", url).apply();
                }
            } catch (Exception ignored) { /* hors ligne : adresse mémorisée ou de secours */ }
            try {
                JSONObject cfg = new JSONObject(get(BuildConfig.APPS_URL + "apps/" + BuildConfig.APPLICATION_ID + ".json"));
                prefs(c).edit().putString("config", cfg.toString()).apply();
            } catch (Exception ignored) { /* dernière configuration mémorisée */ }
            Runnable r = onChange;
            if (r != null) r.run();
            try {
                JSONObject cfg = new JSONObject(config(c));
                CrashReport.sendPending(c, cfg.optString("crash_url", ""), cfg.optString("crash_key", ""));
            } catch (Exception ignored) { }
        }, "remote");
        t.setDaemon(true);
        t.start();
    }

    private static String get(String url) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
        try {
            h.setConnectTimeout(TIMEOUT_MS); h.setReadTimeout(TIMEOUT_MS);
            h.setRequestProperty("Accept", "application/json");
            if (h.getResponseCode() != 200) throw new Exception("réponse " + h.getResponseCode());
            try (InputStream in = h.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] b = new byte[4096];
                int n, total = 0;
                while ((n = in.read(b)) > 0) { total += n; if (total > 256 * 1024) throw new Exception("trop gros"); out.write(b, 0, n); }
                return out.toString(StandardCharsets.UTF_8.name());
            }
        } finally { h.disconnect(); }
    }
}
