package com.minibolides.game;

import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.ArrayDeque;
import java.util.Collections;

/**
 * Salons en Wi-Fi : l'hôte s'annonce sur le réseau local (NSD / mDNS, service _minibolides._tcp), les invités
 * listent les salons annoncés. En secours, l'invité peut saisir l'adresse affichée par l'hôte.
 */
final class LanFinder {
    static final String TYPE = "_minibolides._tcp.";

    private final NsdManager nsd;
    private NsdManager.RegistrationListener reg;
    private NsdManager.DiscoveryListener disc;
    private final ArrayDeque<NsdServiceInfo> toResolve = new ArrayDeque<>();
    private boolean resolving;

    LanFinder(Context c) { nsd = (NsdManager) c.getSystemService(Context.NSD_SERVICE); }

    void announce(String name, int port) {
        stopAnnounce();
        NsdServiceInfo info = new NsdServiceInfo();
        info.setServiceName(name);
        info.setServiceType(TYPE);
        info.setPort(port);
        reg = new NsdManager.RegistrationListener() {
            public void onServiceRegistered(NsdServiceInfo s) { }
            public void onRegistrationFailed(NsdServiceInfo s, int e) { }
            public void onServiceUnregistered(NsdServiceInfo s) { }
            public void onUnregistrationFailed(NsdServiceInfo s, int e) { }
        };
        try { nsd.registerService(info, NsdManager.PROTOCOL_DNS_SD, reg); } catch (Exception e) { reg = null; }
    }

    void stopAnnounce() {
        if (reg != null) { try { nsd.unregisterService(reg); } catch (Exception ignored) { } reg = null; }
    }

    /** found(nom, adresse, port, perdu) pour chaque salon vu ou disparu. */
    interface Found { void on(String name, String host, int port, boolean lost); }

    void scan(Found found) {
        stopScan();
        disc = new NsdManager.DiscoveryListener() {
            public void onDiscoveryStarted(String t) { }
            public void onDiscoveryStopped(String t) { }
            public void onStartDiscoveryFailed(String t, int e) { }
            public void onStopDiscoveryFailed(String t, int e) { }
            public void onServiceFound(NsdServiceInfo s) { synchronized (toResolve) { toResolve.add(s); } next(found); }
            public void onServiceLost(NsdServiceInfo s) { found.on(s.getServiceName(), "", 0, true); }
        };
        try { nsd.discoverServices(TYPE, NsdManager.PROTOCOL_DNS_SD, disc); } catch (Exception e) { disc = null; }
    }

    /** Une seule résolution à la fois (limite de NsdManager). */
    @SuppressWarnings("deprecation")
    private void next(Found found) {
        NsdServiceInfo s;
        synchronized (toResolve) {
            if (resolving || toResolve.isEmpty()) return;
            resolving = true;
            s = toResolve.poll();
        }
        try {
            nsd.resolveService(s, new NsdManager.ResolveListener() {
                public void onResolveFailed(NsdServiceInfo i, int e) { done(); }
                public void onServiceResolved(NsdServiceInfo i) {
                    InetAddress a = i.getHost();
                    if (a instanceof Inet4Address) found.on(i.getServiceName(), a.getHostAddress(), i.getPort(), false);
                    done();
                }
                private void done() { synchronized (toResolve) { resolving = false; } next(found); }
            });
        } catch (Exception e) { synchronized (toResolve) { resolving = false; } }
    }

    void stopScan() {
        if (disc != null) { try { nsd.stopServiceDiscovery(disc); } catch (Exception ignored) { } disc = null; }
        synchronized (toResolve) { toResolve.clear(); resolving = false; }
    }

    /** Adresse IPv4 du téléphone sur le réseau local (à afficher par l'hôte), ou "". */
    static String localIp() {
        try {
            for (NetworkInterface n : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!n.isUp() || n.isLoopback()) continue;
                for (InetAddress a : Collections.list(n.getInetAddresses())) {
                    if (a instanceof Inet4Address && a.isSiteLocalAddress()) return a.getHostAddress();
                }
            }
        } catch (Exception ignored) { }
        return "";
    }
}
