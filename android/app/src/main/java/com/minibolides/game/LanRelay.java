package com.minibolides.game;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Jeu en Wi-Fi sans serveur : le téléphone hôte fait lui-même le relais du salon, avec exactement le même protocole
 * WebSocket que le serveur en ligne (voir server/…/Application.kt). Le jeu de l'hôte s'y connecte en 127.0.0.1,
 * les invités par l'adresse du téléphone sur le Wi-Fi. Petit serveur WebSocket (RFC 6455) sans bibliothèque.
 */
final class LanRelay {
    static final int MAX_PLAYERS = 4;
    private static final String GUID = "258EAFA5-E914-47DA-95CA-C5AB0B11DC85";
    private static final int MAX_FRAME = 8 * 1024;

    private final ServerSocket server;
    private final Map<String, Peer> peers = new LinkedHashMap<>();
    private Peer host;
    private boolean open = true;
    private int nextGuest = 1;
    private volatile boolean closed;

    LanRelay() throws IOException {
        server = new ServerSocket();
        server.setReuseAddress(true);
        server.bind(new InetSocketAddress((InetAddress) null, 0));
        Thread t = new Thread(this::acceptLoop, "lan-accept");
        t.setDaemon(true);
        t.start();
    }

    int port() { return server.getLocalPort(); }

    void close() {
        closed = true;
        try { server.close(); } catch (IOException ignored) { }
        List<Peer> all;
        synchronized (this) { all = new ArrayList<>(peers.values()); peers.clear(); }
        for (Peer p : all) p.close();
    }

    private void acceptLoop() {
        while (!closed) {
            try {
                Socket s = server.accept();
                s.setTcpNoDelay(true);
                Thread t = new Thread(() -> serve(s), "lan-peer");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                if (closed) return;
            }
        }
    }

    // ---------- Un téléphone

    private final class Peer {
        final Socket socket;
        final OutputStream out;
        final LinkedBlockingQueue<byte[]> queue = new LinkedBlockingQueue<>(256);
        String id;
        volatile boolean gone;

        Peer(Socket socket) throws IOException { this.socket = socket; this.out = socket.getOutputStream(); }

        void send(String text) { if (!gone) queue.offer(frame(0x1, text.getBytes(StandardCharsets.UTF_8))); }

        void closeWith(String reason) {
            byte[] r = reason.getBytes(StandardCharsets.UTF_8), body = new byte[2 + r.length];
            body[0] = 0x03; body[1] = (byte) 0xE8;   // 1000 : fermeture normale
            System.arraycopy(r, 0, body, 2, r.length);
            queue.offer(frame(0x8, body));
            queue.offer(new byte[0]);                // fin de l'écrivain
        }

        void close() {
            gone = true;
            queue.offer(new byte[0]);
            try { socket.close(); } catch (IOException ignored) { }
        }

        void writeLoop() {
            try {
                while (true) {
                    byte[] b = queue.poll(15, TimeUnit.SECONDS);
                    if (b == null) b = frame(0x9, new byte[0]);   // ping : garde la connexion vivante
                    if (b.length == 0) break;
                    out.write(b);
                    out.flush();
                }
            } catch (Exception ignored) { }
            try { socket.close(); } catch (IOException ignored) { }
        }
    }

    private void serve(Socket s) {
        Peer p = null;
        try {
            s.setSoTimeout(10_000);
            InputStream in = s.getInputStream();
            if (!handshake(in, s.getOutputStream())) { s.close(); return; }
            s.setSoTimeout(45_000);   // l'écrivain envoie un ping toutes les 15 s : le pong suffit à garder la lecture vivante
            p = new Peer(s);
            Thread w = new Thread(p::writeLoop, "lan-write");
            w.setDaemon(true);
            w.start();
            boolean local = s.getInetAddress().isLoopbackAddress();
            while (true) {
                String text = readText(in, p);
                if (text == null) break;
                JSONObject m;
                try { m = new JSONObject(text); } catch (Exception e) { continue; }
                if (!onMessage(p, m, local)) break;
            }
        } catch (IOException e) {
            // Connexion perdue sur le Wi-Fi : pas de délai de grâce, la place est rendue tout de suite.
        }
        if (p == null) { try { s.close(); } catch (IOException ignored) { } return; }
        leave(p, false);
        p.gone = true;
        p.queue.offer(new byte[0]);   // l'écrivain envoie ce qui reste (fermeture), puis ferme la connexion
    }

    /** Traite un message ; false = fermer la connexion. */
    private boolean onMessage(Peer p, JSONObject m, boolean local) {
        String t = m.optString("t");
        if (p.id == null) {
            switch (t) {
                case "create": {
                    synchronized (this) {
                        if (!local || host != null) { refuse(p, "bad_request"); return false; }
                        p.id = "h"; host = p; peers.put(p.id, p);
                    }
                    p.send(control("created", "code", "WIFI", "peer", "h", "token", ""));
                    return true;
                }
                case "join": {
                    List<Peer> others;
                    synchronized (this) {
                        if (host == null) { refuse(p, "room_not_found"); return false; }
                        if (!open) { refuse(p, "room_locked"); return false; }
                        if (peers.size() >= MAX_PLAYERS) { refuse(p, "room_full"); return false; }
                        p.id = "p" + nextGuest++;
                        others = new ArrayList<>(peers.values());
                        peers.put(p.id, p);
                    }
                    JSONArray ids = new JSONArray();
                    for (Peer o : others) { ids.put(o.id); o.send(control("peer_joined", "id", p.id)); }
                    try {
                        JSONObject j = new JSONObject().put("t", "joined").put("code", "WIFI").put("peer", p.id).put("token", "").put("host", "h").put("peers", ids);
                        p.send(j.toString());
                    } catch (Exception ignored) { }
                    return true;
                }
                default:
                    refuse(p, t.equals("resume") ? "token_invalid" : "bad_request");
                    return false;
            }
        }
        boolean isHost = p == host;
        switch (t) {
            case "all": case "to": {
                Object msg = m.opt("m");
                if (msg == null) return true;
                String frame = "{\"t\":\"from\",\"id\":\"" + p.id + "\",\"m\":" + msg + "}";
                String to = t.equals("to") ? m.optString("id") : null;
                List<Peer> targets = new ArrayList<>();
                synchronized (this) {
                    for (Peer o : peers.values()) if (o != p && (to == null || o.id.equals(to))) targets.add(o);
                }
                for (Peer o : targets) o.send(frame);
                return true;
            }
            case "lock": if (isHost) synchronized (this) { open = false; } return true;
            case "open": if (isHost) synchronized (this) { open = true; } return true;
            case "kick": {
                if (!isHost) return true;
                Peer k;
                synchronized (this) { k = peers.get(m.optString("id")); }
                if (k != null && k != host) { k.send(control("kicked")); leave(k, true); k.closeWith("kicked"); }
                return true;
            }
            case "leave":
                leave(p, true);
                p.closeWith("left");
                return false;
            default:
                return true;
        }
    }

    private void leave(Peer p, boolean voluntary) {
        List<Peer> others;
        boolean wasHost;
        synchronized (this) {
            if (p.id == null || peers.remove(p.id) == null) return;
            wasHost = p == host;
            others = new ArrayList<>(peers.values());
            if (wasHost) { peers.clear(); host = null; }
        }
        for (Peer o : others) {
            if (wasHost) { o.send(control("room_closed")); o.closeWith("room_closed"); }
            else o.send(control("peer_left", "id", p.id));
        }
    }

    private void refuse(Peer p, String reason) {
        p.send(control("error", "reason", reason));
        p.closeWith(reason);
    }

    private static String control(String type, String... kv) {
        try {
            JSONObject o = new JSONObject().put("t", type);
            for (int i = 0; i + 1 < kv.length; i += 2) o.put(kv[i], kv[i + 1]);
            return o.toString();
        } catch (Exception e) { return "{\"t\":\"" + type + "\"}"; }
    }

    // ---------- WebSocket (RFC 6455), le strict nécessaire

    private static boolean handshake(InputStream in, OutputStream out) throws IOException {
        ByteArrayOutputStream head = new ByteArrayOutputStream();
        int b, state = 0;
        while ((b = in.read()) >= 0) {
            head.write(b);
            if (head.size() > 8192) return false;
            state = (b == '\r' && (state == 0 || state == 2)) ? state + 1 : (b == '\n' && (state == 1 || state == 3)) ? state + 1 : 0;
            if (state == 4) break;
        }
        if (state != 4) return false;
        String key = null;
        for (String line : head.toString("ISO-8859-1").split("\r\n")) {
            int c = line.indexOf(':');
            if (c > 0 && line.substring(0, c).trim().equalsIgnoreCase("Sec-WebSocket-Key")) key = line.substring(c + 1).trim();
        }
        if (key == null) {
            out.write("HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".getBytes(StandardCharsets.ISO_8859_1));
            return false;
        }
        String accept;
        try {
            accept = android.util.Base64.encodeToString(MessageDigest.getInstance("SHA-1").digest((key + GUID).getBytes(StandardCharsets.ISO_8859_1)), android.util.Base64.NO_WRAP);
        } catch (Exception e) { return false; }
        out.write(("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
        out.flush();
        return true;
    }

    /** Prochain message texte complet, ou null à la fermeture. Répond aux pings. */
    private static String readText(InputStream in, Peer p) throws IOException {
        ByteArrayOutputStream msg = new ByteArrayOutputStream();
        while (true) {
            int b0 = in.read(), b1 = in.read();
            if (b0 < 0 || b1 < 0) return null;
            boolean fin = (b0 & 0x80) != 0, masked = (b1 & 0x80) != 0;
            int op = b0 & 0x0F;
            long len = b1 & 0x7F;
            if (len == 126) len = (readByte(in) << 8) | readByte(in);
            else if (len == 127) { len = 0; for (int i = 0; i < 8; i++) len = (len << 8) | readByte(in); }
            if (len > MAX_FRAME || msg.size() + len > MAX_FRAME) return null;
            byte[] mask = new byte[4];
            if (masked) readFully(in, mask);
            byte[] data = new byte[(int) len];
            readFully(in, data);
            if (masked) for (int i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
            if (op == 0x8) return null;
            if (op == 0x9) { p.queue.offer(frame(0xA, data)); continue; }
            if (op == 0xA) continue;
            if (op == 0x1 || op == 0x0) {
                msg.write(data, 0, data.length);
                if (fin) return msg.toString("UTF-8");
            }
        }
    }

    private static int readByte(InputStream in) throws IOException {
        int b = in.read();
        if (b < 0) throw new IOException("fin");
        return b;
    }

    private static void readFully(InputStream in, byte[] b) throws IOException {
        int off = 0;
        while (off < b.length) {
            int n = in.read(b, off, b.length - off);
            if (n < 0) throw new IOException("fin");
            off += n;
        }
    }

    private static byte[] frame(int op, byte[] data) {
        int n = data.length, h = n < 126 ? 2 : n < 65536 ? 4 : 10;
        byte[] f = new byte[h + n];
        f[0] = (byte) (0x80 | op);
        if (n < 126) f[1] = (byte) n;
        else if (n < 65536) { f[1] = 126; f[2] = (byte) (n >> 8); f[3] = (byte) n; }
        else { f[1] = 127; for (int i = 0; i < 8; i++) f[9 - i] = (byte) ((long) n >> (8 * i)); }
        System.arraycopy(data, 0, f, h, n);
        return f;
    }
}
