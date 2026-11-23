package com.minibolides.game;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Pont exposé au jeu sous le nom window.AndroidBridge.
 *
 * Vibrations : opérationnelles.
 * Pubs (AdMob) et achats (Play Billing) : simulés dans le jeu tant que MB.FEATURES.demo est à true.
 * Pour la vraie version : ajouter les dépendances, implémenter les méthodes ci-dessous, appeler sur le
 * thread UI window.mbOnAd(true|false), window.mbOnPurchase(id, true|false) et window.mbOnRestored("id1,id2"),
 * puis passer MB.FEATURES.demo à false dans js/data.js.
 */
public class AndroidBridge {
    private static final String JOURNAL_URL = "http://192.168.91.48:8791/journal";
    private static final int MAX_PENDING = 30;
    private volatile String lastError = "";
    private static final ExecutorService JOURNAL = Executors.newSingleThreadExecutor();

    private final Context context;
    private final WebView web;

    private LanRelay lan;
    private LanFinder finder;

    public AndroidBridge(Context context, WebView web) {
        this.context = context;
        this.web = web;
        // Configuration à distance arrivée après le chargement du jeu : il la reçoit aussitôt.
        Remote.setOnChange(() -> web.post(() -> web.evaluateJavascript("window.mbRemote&&mbRemote(" + JSONObject.quote(Remote.config(context)) + ")", null)));
    }

    // ---------- Jeu en ligne et en Wi-Fi

    /** Adresse du serveur du jeu en ligne (apps.json mémorisé, sinon adresse de secours), terminée par « / ». */
    @JavascriptInterface
    public String serverUrl() { return Remote.serverUrl(context); }

    /** Dernière configuration à distance mémorisée (JSON : min_version_code, recommended_version_code, flags, message). */
    @JavascriptInterface
    public String remoteConfig() { return Remote.config(context); }

    @JavascriptInterface
    public int versionCode() { return BuildConfig.VERSION_CODE; }

    /** Ouvre un salon Wi-Fi sur ce téléphone et l'annonce sous [name] ; renvoie le port du relais (-1 en cas d'échec). */
    @JavascriptInterface
    public synchronized int lanHost(String name) {
        lanStop();
        try { lan = new LanRelay(); } catch (Exception e) { return -1; }
        finder().announce(name == null || name.isEmpty() ? "Mini Bolides" : name, lan.port());
        return lan.port();
    }

    @JavascriptInterface
    public synchronized void lanStop() {
        if (finder != null) finder.stopAnnounce();
        if (lan != null) { lan.close(); lan = null; }
    }

    /** Cherche les salons Wi-Fi : chacun arrive dans window.mbLanFound(nom, adresse, port, perdu). */
    @JavascriptInterface
    public synchronized void lanScan() {
        finder().scan((name, host, port, lost) -> web.post(() -> web.evaluateJavascript(
                "window.mbLanFound&&mbLanFound(" + JSONObject.quote(name) + "," + JSONObject.quote(host) + "," + port + "," + lost + ")", null)));
    }

    @JavascriptInterface
    public synchronized void lanScanStop() { if (finder != null) finder.stopScan(); }

    /** Adresse du téléphone sur le Wi-Fi, affichée par l'hôte pour une saisie à la main. */
    @JavascriptInterface
    public String localIp() { return LanFinder.localIp(); }

    private LanFinder finder() { if (finder == null) finder = new LanFinder(context); return finder; }

    @JavascriptInterface
    public void vibrate(int ms) {
        Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null || !v.hasVibrator()) return;
        v.vibrate(VibrationEffect.createOneShot(Math.max(5, Math.min(ms, 400)), VibrationEffect.DEFAULT_AMPLITUDE));
    }

    /** Journal des parties : versions de test uniquement. */
    @JavascriptInterface
    public boolean journalOn() { return (context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0; }

    @JavascriptInterface
    public String appVersion() {
        try { return context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName; }
        catch (Exception e) { return "?"; }
    }

    /** Garde le journal sur le téléphone, puis l'envoie : hors du réseau local, il attend la partie suivante. */
    @JavascriptInterface
    public void sendJournal(String json) {
        if (!journalOn()) return;
        JOURNAL.execute(() -> {
            File dir = new File(context.getFilesDir(), "journaux");
            dir.mkdirs();
            try (FileOutputStream out = new FileOutputStream(new File(dir, System.currentTimeMillis() + ".json"))) {
                out.write(json.getBytes(StandardCharsets.UTF_8));
            } catch (IOException e) { return; }
            File[] pending = dir.listFiles();
            if (pending == null) return;
            Arrays.sort(pending);
            for (int i = 0; i < pending.length - MAX_PENDING; i++) pending[i].delete();
            for (File f : pending) if (f.exists() && !upload(f)) { report("Journal en attente, envoi impossible : " + lastError); return; }
            report("Journal envoyé au serveur");
        });
    }

    private void report(String text) {
        web.post(() -> web.evaluateJavascript("window.mbJournal&&mbJournal(" + JSONObject.quote(text) + ")", null));
    }

    private boolean upload(File f) {
        HttpURLConnection c = null;
        try {
            byte[] body = Files.readAllBytes(f.toPath());
            c = (HttpURLConnection) new URL(JOURNAL_URL).openConnection();
            c.setConnectTimeout(3000); c.setReadTimeout(5000); c.setDoOutput(true); c.setFixedLengthStreamingMode(body.length);
            c.setRequestProperty("Content-Type", "application/json");
            try (OutputStream out = c.getOutputStream()) { out.write(body); }
            int code = c.getResponseCode();
            if (code != 200) { lastError = "réponse " + code; return false; }
            f.delete();
            return true;
        } catch (IOException e) { lastError = e.getClass().getSimpleName() + " " + e.getMessage(); return false; }
        finally { if (c != null) c.disconnect(); }
    }

    /** Rappel quotidien : at en millisecondes (heure locale déjà calculée par le jeu), texte déjà traduit. */
    @JavascriptInterface
    public void remind(double at, String title, String text) { Reminder.schedule(context, (long) at, title, text); }

    @JavascriptInterface
    public void remindOff() { Reminder.cancel(context); }

    @JavascriptInterface
    public boolean notifAllowed() { return Reminder.allowed(context); }

    /** Demande la permission (Android 13+) ; la réponse arrive dans window.mbOnNotif(true|false). */
    @JavascriptInterface
    public void askNotif() {
        if (Build.VERSION.SDK_INT >= 33 && context instanceof Activity && !Reminder.allowed(context)) {
            ((Activity) context).runOnUiThread(() -> ((Activity) context).requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, MainActivity.ASK_NOTIF));
        } else {
            boolean ok = Reminder.allowed(context);
            web.post(() -> web.evaluateJavascript("window.mbOnNotif&&mbOnNotif(" + ok + ")", null));
        }
    }

    @JavascriptInterface
    public boolean adsReady() { return false; }

    @JavascriptInterface
    public void showRewarded(String placement) { }

    @JavascriptInterface
    public void showInterstitial() { }

    @JavascriptInterface
    public void buy(String offerId) { }

    @JavascriptInterface
    public void restorePurchases() { }
}
