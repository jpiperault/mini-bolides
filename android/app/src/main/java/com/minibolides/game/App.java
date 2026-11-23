package com.minibolides.game;

import android.app.Application;

/** Démarrage de l'appli : rapports de plantage, puis adresse du serveur et configuration à distance (en arrière-plan). */
public class App extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        CrashReport.install(this);
        Remote.refresh(this);
    }
}
