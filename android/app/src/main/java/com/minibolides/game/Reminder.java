package com.minibolides.game;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

/**
 * Rappel quotidien, une seule notification à la fois : le jeu la reprogramme pour le lendemain à chaque visite
 * (texte déjà traduit). Sans visite, rien d'autre n'est envoyé. Reprogrammée après un redémarrage du téléphone.
 */
public class Reminder extends BroadcastReceiver {
    private static final String PREFS = "rappel", CHANNEL = "rappel", FIRE = "com.minibolides.game.RAPPEL";

    static void schedule(Context c, long at, String title, String text) {
        c.getSharedPreferences(PREFS, 0).edit().putLong("at", at).putString("title", title).putString("text", text).apply();
        arm(c, at);
    }

    static void cancel(Context c) {
        c.getSharedPreferences(PREFS, 0).edit().clear().apply();
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(pending(c));
    }

    static boolean allowed(Context c) {
        if (Build.VERSION.SDK_INT >= 33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.areNotificationsEnabled();
    }

    private static PendingIntent pending(Context c) {
        Intent i = new Intent(c, Reminder.class).setAction(FIRE);
        return PendingIntent.getBroadcast(c, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // Alarme inexacte : quelques minutes d'écart ne comptent pas, et elle ne demande aucune permission spéciale.
    private static void arm(Context c, long at) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(c));
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        SharedPreferences p = c.getSharedPreferences(PREFS, 0);
        long at = p.getLong("at", 0);
        if (at == 0) return;
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            if (at > System.currentTimeMillis()) arm(c, at);
            return;
        }
        if (!FIRE.equals(intent.getAction())) return;
        p.edit().putLong("at", 0).apply();
        if (!allowed(c)) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel(CHANNEL, c.getString(R.string.notif_channel), NotificationManager.IMPORTANCE_DEFAULT));
        PendingIntent open = PendingIntent.getActivity(c, 2, new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String text = p.getString("text", "");
        Notification n = new Notification.Builder(c, CHANNEL)
                .setSmallIcon(R.drawable.ic_notif)
                .setColor(0xFFE5352B)
                .setContentTitle(p.getString("title", c.getString(R.string.app_name)))
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(open)
                .setAutoCancel(true)
                .build();
        nm.notify(1, n);
    }
}
