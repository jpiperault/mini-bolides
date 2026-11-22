// Carrosseries lissées par sections successives (loft), sans aucun modèle externe.
(function (MB) {
  const T = THREE;
  const N = 72, K = 15;                                         // stations le long de la voiture, points par demi-section

  const SHAPES = {
    bolide: { x: [-2.35, 2.35], axle: [-1.42, 1.5], bottom: 0.3, spoiler: 'lip',
      roof: [[-2.35, 0.86], [-1.75, 0.96], [-1.05, 1.28], [-0.35, 1.47], [0.25, 1.43], [1.0, 1.03], [1.65, 0.9], [2.35, 0.68]],
      belt: [[-2.35, 0.84], [-1.2, 0.92], [0, 0.93], [1.0, 0.92], [2.35, 0.66]],
      width: [[-2.35, 0.84], [-1.5, 1.04], [-0.3, 0.98], [0.5, 0.98], [1.5, 1.03], [2.35, 0.8]], glass: [-1.25, 0.82] },
    coupe: { x: [-2.15, 2.2], axle: [-1.3, 1.36], bottom: 0.34, spoiler: 'roof',
      roof: [[-2.15, 0.95], [-1.95, 1.3], [-1.55, 1.55], [-0.5, 1.62], [0.15, 1.54], [0.95, 1.1], [1.6, 0.98], [2.2, 0.76]],
      belt: [[-2.15, 0.94], [-1.1, 1.02], [1.0, 1.0], [2.2, 0.74]],
      width: [[-2.15, 0.84], [-1.4, 1.03], [0, 0.98], [1.4, 1.02], [2.2, 0.8]], glass: [-1.75, 0.8] },
    formule: { x: [-2.5, 2.6], axle: [-1.5, 1.62], bottom: 0.24, spoiler: 'wing',
      roof: [[-2.5, 0.78], [-1.6, 0.92], [-0.95, 1.12], [-0.35, 1.26], [0.2, 1.18], [0.95, 0.82], [1.7, 0.72], [2.6, 0.5]],
      belt: [[-2.5, 0.76], [-1.3, 0.82], [0, 0.78], [1.0, 0.76], [2.6, 0.48]],
      width: [[-2.5, 0.88], [-1.5, 1.12], [-0.3, 0.98], [0.5, 0.98], [1.6, 1.08], [2.6, 0.82]], glass: [-1.0, 0.82] },
    citadine: { x: [-1.75, 1.85], axle: [-1.1, 1.18], bottom: 0.34, spoiler: 'none',
      roof: [[-1.75, 1.0], [-1.6, 1.45], [-1.1, 1.68], [-0.1, 1.72], [0.4, 1.6], [1.0, 1.18], [1.5, 1.04], [1.85, 0.8]],
      belt: [[-1.75, 0.98], [0, 1.04], [1.0, 1.02], [1.85, 0.78]],
      width: [[-1.75, 0.8], [-1.0, 0.98], [0, 0.95], [1.0, 0.98], [1.85, 0.78]], glass: [-1.45, 0.85] },
    muscle: { x: [-2.45, 2.55], axle: [-1.5, 1.62], bottom: 0.32, spoiler: 'lip',
      roof: [[-2.45, 0.98], [-1.9, 1.02], [-1.0, 1.28], [-0.4, 1.46], [0.2, 1.44], [0.85, 1.08], [1.7, 1.02], [2.55, 0.86]],
      belt: [[-2.45, 0.96], [-1.0, 0.98], [1.0, 1.0], [2.55, 0.84]],
      width: [[-2.45, 0.96], [-1.5, 1.08], [0, 1.02], [1.5, 1.08], [2.55, 0.92]], glass: [-1.15, 0.72] },
    gt: { x: [-2.55, 2.65], axle: [-1.55, 1.7], bottom: 0.28, spoiler: 'none',
      roof: [[-2.55, 0.82], [-1.9, 0.98], [-1.1, 1.26], [-0.5, 1.42], [0.1, 1.4], [0.75, 1.0], [1.6, 0.9], [2.65, 0.62]],
      belt: [[-2.55, 0.8], [-1.2, 0.9], [0, 0.9], [1.0, 0.88], [2.65, 0.6]],
      width: [[-2.55, 0.84], [-1.5, 1.06], [0, 0.98], [1.6, 1.04], [2.65, 0.78]], glass: [-1.2, 0.7] },
    van: { x: [-2.3, 2.25], axle: [-1.4, 1.4], bottom: 0.42, spoiler: 'none',
      roof: [[-2.3, 1.3], [-2.25, 2.0], [-1.8, 2.16], [0.2, 2.16], [0.75, 1.95], [1.35, 1.4], [1.85, 1.24], [2.25, 1.02]],
      belt: [[-2.3, 1.28], [0, 1.34], [1.2, 1.3], [2.25, 1.0]],
      width: [[-2.3, 1.02], [-1.5, 1.06], [0, 1.04], [1.5, 1.06], [2.25, 0.92]], glass: [-0.35, 1.05] },
    camion: { x: [-2.4, 2.3], axle: [-1.42, 1.42], bottom: 0.46, spoiler: 'none',
      roof: [[-2.4, 1.18], [-2.3, 1.72], [-1.7, 1.86], [-0.3, 1.88], [0.45, 1.8], [1.05, 1.34], [1.75, 1.2], [2.3, 1.0]],
      belt: [[-2.4, 1.16], [-1, 1.22], [1.0, 1.2], [2.3, 0.98]],
      width: [[-2.4, 0.94], [-1.5, 1.08], [0, 1.04], [1.5, 1.08], [2.3, 0.92]], glass: [-2.05, 0.92] },
    // wheels : rayon des roues [arrière, avant] ; zw : demi-voie ; extra : pièces ajoutées à la caisse.
    bulle: { x: [-2.0, 2.0], axle: [-1.25, 1.3], bottom: 0.36, spoiler: 'none',
      roof: [[-2.0, 0.9], [-1.85, 1.25], [-1.4, 1.62], [-0.6, 1.86], [0.2, 1.82], [0.9, 1.42], [1.5, 1.08], [2.0, 0.82]],
      belt: [[-2.0, 0.9], [0, 1.0], [1.2, 0.98], [2.0, 0.8]],
      width: [[-2.0, 0.82], [-1.25, 1.06], [0, 0.94], [1.3, 1.06], [2.0, 0.8]], glass: [-1.3, 0.75] },
    buggy: { x: [-1.9, 2.0], axle: [-1.2, 1.3], bottom: 0.62, spoiler: 'none', wheels: [0.6, 0.56], zw: 1.12, extra: ['rollbar', 'lights'],
      roof: [[-1.9, 1.0], [-1.4, 1.08], [-0.8, 1.22], [0.2, 1.22], [0.9, 1.04], [2.0, 0.86]],
      belt: [[-1.9, 0.98], [0, 1.02], [2.0, 0.84]],
      width: [[-1.9, 0.66], [-1.0, 0.8], [0, 0.78], [1.0, 0.76], [2.0, 0.58]], glass: [-0.6, 0.6] },
    pickup: { x: [-2.5, 2.4], axle: [-1.55, 1.5], bottom: 0.5, spoiler: 'none', wheels: [0.52, 0.52], zw: 1.0, extra: ['bed'],
      roof: [[-2.5, 1.24], [-0.6, 1.26], [-0.42, 1.86], [0.35, 1.9], [0.85, 1.42], [1.6, 1.26], [2.4, 1.06]],
      belt: [[-2.5, 1.22], [0, 1.26], [1.2, 1.24], [2.4, 1.02]],
      width: [[-2.5, 1.0], [-1.5, 1.06], [0, 1.04], [1.5, 1.06], [2.4, 0.94]], glass: [-0.5, 0.75] },
    jeep: { x: [-2.1, 2.15], axle: [-1.3, 1.35], bottom: 0.56, spoiler: 'none', wheels: [0.56, 0.56], zw: 1.04, extra: ['spare', 'bullbar'],
      roof: [[-2.1, 1.36], [-2.05, 1.98], [-1.6, 2.04], [0.25, 2.04], [0.5, 1.62], [0.75, 1.42], [2.15, 1.32]],
      belt: [[-2.1, 1.34], [0, 1.38], [2.15, 1.3]],
      width: [[-2.1, 1.0], [0, 1.02], [2.15, 0.98]], glass: [-1.7, 0.55] },
    cale: { x: [-2.5, 2.7], axle: [-1.55, 1.7], bottom: 0.24, spoiler: 'wing',
      roof: [[-2.5, 0.86], [-1.7, 0.96], [-0.9, 1.16], [-0.2, 1.22], [0.5, 0.98], [1.4, 0.7], [2.7, 0.4]],
      belt: [[-2.5, 0.84], [-1.0, 0.86], [0.5, 0.76], [2.7, 0.38]],
      width: [[-2.5, 0.9], [-1.5, 1.14], [0, 1.0], [1.6, 1.06], [2.7, 0.84]], glass: [-0.95, 0.55] },
    dragster: { x: [-2.3, 2.9], axle: [-1.45, 2.2], bottom: 0.3, spoiler: 'wing', wingY: 1.7, wheels: [0.68, 0.36], zw: 1.06, extra: ['blower'],
      roof: [[-2.3, 0.96], [-1.7, 1.06], [-1.0, 1.36], [-0.5, 1.42], [0.0, 1.1], [1.0, 0.72], [2.9, 0.5]],
      belt: [[-2.3, 0.92], [-1.0, 0.95], [0, 0.8], [2.9, 0.48]],
      width: [[-2.3, 0.8], [-1.4, 0.92], [-0.3, 0.8], [1.0, 0.6], [2.9, 0.48]], glass: [-1.3, -0.1] },
  };

  const lin = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
      const f = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
    }
    return pts[pts.length - 1][1];
  };
  const smooth = (a, passes) => {
    for (let p = 0; p < passes; p++) {
      const b = a.slice();
      for (let i = 1; i < a.length - 1; i++) a[i] = (b[i - 1] + 2 * b[i] + b[i + 1]) / 4;
    }
    return a;
  };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function crPoint(p, f) {                                       // Catmull-Rom le long des points de contrôle de section
    const n = p.length - 1, s = Math.min(f * n, n - 1e-4), i = Math.floor(s), t = s - i;
    const a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], d = p[Math.min(i + 2, n)];
    const q = (k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t * t * t);
    return [q(0), q(1)];
  }

  // Autocollants peints sur la carrosserie, sous les vitres. u : long de la voiture (avant à droite), v : du dessous (0)
  // au milieu du toit (1), le même dessin sert aux deux flancs. ink : blanc sur peinture foncée, noir sur peinture claire.
  function drawDeco(g, deco, W, H, V, ink, hex) {
    const r = (hex >> 16) & 255, gg = (hex >> 8) & 255, b = hex & 255, light = r * 0.3 + gg * 0.59 + b * 0.11 > 150;
    const fg = ink || (light ? '#1b1b22' : '#ffffff');
    g.save();
    if (deco === 'bandes') {                                     // deux bandes de course, du capot au coffre
      g.fillStyle = fg; g.fillRect(0, V(0.885), W, V(0.05)); g.fillRect(0, V(0.955), W, V(0.03));
    } else if (deco === 'damier') {                              // damier sous la ceinture de caisse
      const s = 13, y0 = V(0.4);
      for (let x = 0, i = 0; x < W; x += s, i++) for (let k = 0; k < 2; k++) { g.fillStyle = (i + k) % 2 ? fg : (light ? '#ffffff' : '#1b1b22'); g.fillRect(x, y0 + k * s, s, s); }
    } else if (deco === 'flammes') {                             // flammes qui partent du nez vers l'arrière
      const lay = [['#ffd23f', 1], ['#ff8a1f', 0.74], ['#e5352b', 0.48]];   // jaune dehors, rouge au cœur, cerné de noir
      g.strokeStyle = '#1b1b22'; g.lineWidth = 4; g.lineJoin = 'round';
      for (const [cl, k] of lay) {
        g.fillStyle = cl; g.beginPath(); g.moveTo(W, V(0.26));
        const tips = [[0.42, 0.3], [0.62, 0.4], [0.3, 0.5], [0.55, 0.6], [0.36, 0.7], [0.6, 0.86], [0.5, 1]];
        for (const [u, v] of tips) { const x = W - (W - W * u) * k; g.quadraticCurveTo(W - (W - x) * 0.35, V(v - 0.06), x, V(v)); g.quadraticCurveTo(W - (W - x) * 0.4, V(v + 0.03), W - (W - x) * 0.25, V(Math.min(1, v + 0.06))); }
        g.lineTo(W, V(1)); g.closePath(); if (k === 1) g.stroke(); g.fill();
      }
    } else if (deco === 'eclair') {                              // éclair le long du flanc
      g.fillStyle = '#ffd23f'; g.strokeStyle = '#1b1b22'; g.lineWidth = 3; g.beginPath();
      const p = [[0.08, 0.5], [0.44, 0.56], [0.41, 0.44], [0.94, 0.5], [0.56, 0.3], [0.59, 0.42], [0.08, 0.5]];
      p.forEach(([u, v], i) => (i ? g.lineTo(u * W, V(v)) : g.moveTo(u * W, V(v)))); g.fill(); g.stroke();
    } else if (deco === 'pois') {                                // gros pois
      g.fillStyle = fg;
      for (let i = 0; i < 9; i++) for (let k = 0; k < 4; k++) { g.beginPath(); g.arc((i + (k % 2) * 0.5 + 0.25) * W / 9, V(0.3 + k * 0.19), 9, 0, 7); g.fill(); }
    } else if (deco === 'etoiles') {                             // étoiles semées
      const star = (x, y, R) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? R * 0.45 : R; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); };
      g.fillStyle = '#ffd23f';
      for (let i = 0; i < 7; i++) star((i + 0.5) * W / 7, V(i % 2 ? 0.36 : 0.5), 13);
      g.fillStyle = fg; for (let i = 0; i < 5; i++) star((i + 0.9) * W / 5.6, V(0.92), 9);
    } else if (deco === 'numero') {                              // grand rond blanc sur la portière
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(W * 0.5, V(0.42), 26, 0, 7); g.fill();
    }
    g.restore();
  }

  // Peinture vernie sous forte lumière : une teinte vive pâlit (le rouge tire sur l'orangé). On la pose plus dense et plus saturée.
  const _hsl = { h: 0, s: 0, l: 0 }, _dc = new T.Color();
  function deep(hex) { _dc.setHex(hex).getHSL(_hsl); return _dc.setHSL(_hsl.h, Math.min(1, _hsl.s * 1.18), _hsl.l * (1 - 0.2 * _hsl.s)).getHex(); }
  function paintTexture(sp, hex, xs, deco) {
    const RA = MB.REEL && MB.REEL.A, W = RA ? 1024 : 512, H = RA ? 512 : 256, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), col = '#' + (MB.REEL && MB.REEL.A ? deep(hex) : hex).toString(16).padStart(6, '0');
    g.fillStyle = col; g.fillRect(0, 0, W, H);
    const U = (x) => { let i = 0; while (i < N && xs[i] < x) i++; return (i / N) * W; };
    const V = (v) => v * H;
    const dark = '#0a1018';
    if (deco) drawDeco(g, deco, W, H, V, null, hex);
    g.fillStyle = '#17181d'; g.fillRect(0, V(0), W, V(0.24));   // bas de caisse
    const [ga, gb] = sp.glass, ctrl = 7;                         // indices des points de contrôle dans la section
    const belt = 4 / ctrl, upper = 5.45 / ctrl;
    const mid = (ga + gb) / 2 - 0.05;
    // vitres latérales (avec montant central), pare-brise et lunette sur le dessus
    const panes = (x) => {
      x.beginPath();
      x.moveTo(U(ga + 0.28), V(belt + 0.015)); x.lineTo(U(mid - 0.05), V(belt + 0.015)); x.lineTo(U(mid - 0.05), V(upper)); x.lineTo(U(ga + 0.58), V(upper)); x.closePath();
      x.moveTo(U(mid + 0.05), V(belt + 0.015)); x.lineTo(U(gb - 0.02), V(belt + 0.015)); x.lineTo(U(gb - 0.4), V(upper)); x.lineTo(U(mid + 0.05), V(upper)); x.closePath();
      x.rect(U(gb - 0.42), V(upper + 0.02), U(gb + 0.12) - U(gb - 0.42), H);
      x.rect(U(ga + 0.02), V(upper + 0.02), U(ga + 0.56) - U(ga + 0.02), H);
    };
    if (!RA) {
      g.fillStyle = dark; panes(g); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(U(mid - 0.72), V(0.26)); g.lineTo(U(mid - 0.72), V(belt)); g.moveTo(U(mid + 0.56), V(0.26)); g.lineTo(U(mid + 0.56), V(belt)); g.stroke();
      const tex = new T.CanvasTexture(c);
      tex.flipY = false; tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
      return tex;
    }
    // Maquette « miniature métal » : ouvrants gravés, joints de vitre en caoutchouc, vitres réellement percées.
    const bc = document.createElement('canvas'); bc.width = W; bc.height = H;
    const bg = bc.getContext('2d'); bg.fillStyle = '#fff'; bg.fillRect(0, 0, W, H);
    const shut = (x) => {
      x.beginPath();
      const d0 = U(mid - 0.78), d1 = U(mid + 0.6), s0 = V(0.27);
      x.moveTo(d0, V(belt)); x.lineTo(d0, s0 + 14); x.quadraticCurveTo(d0, s0, d0 + 14, s0); x.lineTo(d1 - 14, s0); x.quadraticCurveTo(d1, s0, d1, s0 + 14); x.lineTo(d1, V(belt));   // portière
      x.moveTo(U(gb + 0.3), V(0.7)); x.lineTo(U(gb + 0.3), H);                    // capot
      x.moveTo(U(gb + 0.3), V(0.7)); x.lineTo(U(sp.x[1] - 0.45), V(0.74));
      x.moveTo(U(ga - 0.12), V(0.7)); x.lineTo(U(ga - 0.12), H);                  // coffre
      x.moveTo(U(ga - 0.12), V(0.7)); x.lineTo(U(sp.x[0] + 0.3), V(0.72));
      x.moveTo(U(ga - 0.5) + 9, V(0.47)); x.arc(U(ga - 0.5), V(0.47), 9, 0, 7);   // trappe à essence
    };
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 2.2; g.lineCap = 'round'; shut(g); g.stroke();
    bg.strokeStyle = '#000'; bg.lineWidth = 4; bg.lineCap = 'round'; bg.filter = 'blur(1px)'; shut(bg); bg.stroke(); bg.filter = 'none';
    g.strokeStyle = '#0b0c0f'; g.lineWidth = 9; g.lineJoin = 'round'; panes(g); g.stroke();   // joints
    bg.strokeStyle = '#555'; bg.lineWidth = 9; bg.lineJoin = 'round'; panes(bg); bg.stroke();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; panes(g); g.fill(); g.globalCompositeOperation = 'source-over';
    const gc = document.createElement('canvas'); gc.width = W / 2; gc.height = H / 2;
    const gg = gc.getContext('2d'); gg.scale(0.5, 0.5);
    gg.fillStyle = 'rgba(30,48,56,.6)'; panes(gg); gg.fill();
    gg.globalCompositeOperation = 'source-atop';                                  // bandeau pare-soleil en haut du pare-brise
    const sun = gg.createLinearGradient(U(gb - 0.42), 0, U(gb - 0.2), 0); sun.addColorStop(0, 'rgba(8,14,18,.75)'); sun.addColorStop(1, 'rgba(8,14,18,0)');
    gg.fillStyle = sun; gg.fillRect(U(gb - 0.42), V(upper + 0.02), U(gb - 0.2) - U(gb - 0.42), H);
    const mk = (cv, srgb) => { const t = new T.CanvasTexture(cv); t.flipY = false; if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
    const tex = mk(c, true);
    tex.userData = { glass: mk(gc, true), bump: mk(bc, false) };
    return tex;
  }

  function buildBody(sp, hex, env) {
    const [x0, x1] = sp.x, cap = 0.26;
    const xs = [], roof = [], belt = [], width = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = x0 + (x1 - x0) * (0.5 - 0.5 * Math.cos(Math.PI * u));
      xs.push(x); roof.push(lin(sp.roof, x)); belt.push(lin(sp.belt, x)); width.push(lin(sp.width, x));
    }
    smooth(roof, 22); smooth(belt, 18); smooth(width, 26);
    const rows = 2 * K + 1, pos = new Float32Array((N + 1) * rows * 3), uv = new Float32Array((N + 1) * rows * 2), col = new Float32Array((N + 1) * rows * 3), idx = [];
    for (let i = 0; i <= N; i++) {
      const x = xs[i], e = Math.min(x - x0, x1 - x);
      const f = e < cap ? Math.sqrt(Math.max(1 - ((cap - e) / cap) ** 2, 0)) : 1;   // extrémités arrondies
      const w = width[i] * (0.3 + 0.7 * f), y0 = sp.bottom, midY = (y0 + belt[i]) / 2;
      const b = midY + (belt[i] - midY) * (0.35 + 0.65 * f), r = Math.max(b, midY + (roof[i] - midY) * (0.35 + 0.65 * f)), d = midY + (y0 - midY) * (0.35 + 0.65 * f);
      const h = r - b;
      const ring = [[0, d], [0.84 * w, d], [0.99 * w, d + 0.13], [w, (d + b) / 2 + 0.05], [0.96 * w, b], [0.8 * w, b + h * 0.72], [0.48 * w, r - 0.008], [0, r]];
      for (let k = 0; k < rows; k++) {
        const m = k - K, p = crPoint(ring, Math.abs(m) / K);
        let z = p[0] * Math.sign(m), vs = 1;
        for (let ai = 0; ai < 2; ai++) {                          // passages de roue creusés dans la caisse
          const ax = sp.axle[ai], wr = sp.wheels ? sp.wheels[ai] : 0.46, k = wr / 0.46;
          const dist = Math.hypot(x - ax, p[1] - wr), s = (1 - sstep(0.52 * k, 0.63 * k, dist)) * (1 - sstep(0.46, 0.57, Math.abs(m) / K));
          if (s > 0) { z = Math.sign(z) * (Math.abs(z) - 0.2 * s); vs = Math.min(vs, 1 - s * 0.97); }
        }
        const a = (i * rows + k);
        pos.set([x, p[1], z], a * 3);
        uv.set([i / N, Math.abs(m) / K], a * 2);
        col.set([vs, vs, vs], a * 3);
        if (i < N && k < rows - 1) { const q = a + rows; idx.push(a, q, a + 1, a + 1, q, q + 1); }
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const RA = MB.REEL && MB.REEL.A, tex0 = paintTexture(sp, hex, xs);
    const mat = RA
      ? new T.MeshPhysicalMaterial({ map: tex0, bumpMap: tex0.userData.bump, bumpScale: 0.012, metalness: 0.3, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.03, vertexColors: true, envMap: env, envMapIntensity: 0.7, alphaTest: 0.5, color: 0xb4b4b4 })
      : new T.MeshStandardMaterial({ map: tex0, metalness: 0.45, roughness: 0.24, vertexColors: true, envMap: env, envMapIntensity: 1.1, side: T.DoubleSide });
    mat.userData.lin = true;
    const m = new T.Mesh(g, mat);
    m.castShadow = true;
    let inner = null, glass = null;
    if (RA) {                                                    // envers sombre de la tôle + vitres teintées sur la même forme
      inner = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex0, color: 0x050506, roughness: 0.9, side: T.BackSide, alphaTest: 0.5 }));
      inner.material.userData.lin = true;
      glass = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex0.userData.glass, transparent: true, depthWrite: false, roughness: 0.02, metalness: 0, envMap: env, envMapIntensity: 2.2 }));
      glass.material.userData.lin = true; glass.renderOrder = 2;
      m.add(inner, glass);
    }
    m.repaint = (deco) => {
      const old = mat.map; mat.map = paintTexture(sp, hex, xs, deco); mat.needsUpdate = true;
      if (RA) { mat.bumpMap = mat.map.userData.bump; inner.material.map = mat.map; glass.material.map = mat.map.userData.glass; old.userData.glass.dispose(); old.userData.bump.dispose(); }
      old.dispose();
    };
    return { mesh: m, at: (x) => { const i = xs.findIndex((v) => v >= x); return { belt: belt[i], roof: roof[i], w: width[i] }; } };
  }

  // Fusionne des géométries déjà positionnées : une roue ne coûte qu'un appel de dessin par matière.
  function merge(geos) {
    const pos = [], nor = [];
    for (const g of geos) {
      const n = g.index ? g.toNonIndexed() : g;
      pos.push(...n.attributes.position.array); nor.push(...n.attributes.normal.array);
    }
    const m = new T.BufferGeometry();
    m.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3));
    m.setAttribute('normal', new T.BufferAttribute(new Float32Array(nor), 3));
    return m;
  }

  const mid2 = (sp) => (sp.glass[0] + sp.glass[1]) / 2 - 0.05;
  const wheelGeo = {};
  function wheelGeometry(r, side) {
    const key = r + ':' + side + (MB.REEL && MB.REEL.A ? 'A' : '');
    if (wheelGeo[key]) return wheelGeo[key];
    const W = 0.27, R = r * 0.62;
    const prof = [[0, -W], [r * 0.66, -W], [r * 0.93, -W], [r, -W * 0.6], [r, W * 0.6], [r * 0.93, W], [r * 0.66, W], [r * 0.62, W * 0.5]];
    const tyre = new T.LatheGeometry(prof.map((p) => new T.Vector2(p[0], p[1])), 22); tyre.rotateX(Math.PI / 2);
    if (side < 0) tyre.rotateX(Math.PI);                         // flanc fermé côté voiture : sinon il cachait la jante sur tout un côté
    const s = new T.Shape();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      s[i ? 'lineTo' : 'moveTo'](Math.cos(a - 0.14) * R * 0.28, Math.sin(a - 0.14) * R * 0.28);
      s.lineTo(Math.cos(a - 0.1) * R, Math.sin(a - 0.1) * R); s.lineTo(Math.cos(a + 0.1) * R, Math.sin(a + 0.1) * R);
      s.lineTo(Math.cos(a + 0.14) * R * 0.28, Math.sin(a + 0.14) * R * 0.28);
    }
    s.closePath();
    const spokes = new T.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }); spokes.translate(0, 0, side * (W - 0.08) - 0.025);
    const rim = new T.TorusGeometry(R, 0.026, 6, 22); rim.translate(0, 0, side * (W - 0.04));
    const disc = new T.CircleGeometry(R * 0.96, 18); disc.translate(0, 0, side * (W - 0.14));
    if (side < 0) disc.rotateY(Math.PI);
    if (MB.REEL && MB.REEL.A) {                                  // jante creusée : moyeu, écrous, disque de frein derrière les branches
      disc.translate(0, 0, side * -0.09);
      const parts = [spokes, rim], cyl = (rr, d, x, y, z) => { const c = new T.CylinderGeometry(rr, rr, d, 10); c.rotateX(Math.PI / 2); c.translate(x, y, z); return c; };
      parts.push(cyl(R * 0.2, 0.07, 0, 0, side * (W - 0.035)));
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.63; parts.push(cyl(0.022, 0.05, Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3, side * (W - 0.03))); }
      const lip = new T.TorusGeometry(R * 1.03, 0.02, 6, 26); lip.translate(0, 0, side * (W - 0.01)); parts.push(lip);
      const barrel = new T.CylinderGeometry(R * 1.02, R * 1.02, 0.2, 24, 1, true); barrel.rotateX(Math.PI / 2); barrel.translate(0, 0, side * (W - 0.12));
      const brake = new T.RingGeometry(R * 0.32, R * 0.84, 28); brake.translate(0, 0, side * (W - 0.17)); if (side < 0) brake.rotateY(Math.PI);
      const cal = new T.BoxGeometry(R * 0.5, R * 0.36, 0.07); cal.translate(R * 0.6, R * 0.2, side * (W - 0.15));
      return (wheelGeo[key] = { tyre, metal: merge(parts), disc, barrel, brake, cal });
    }
    return (wheelGeo[key] = { tyre, metal: merge([spokes, rim]), disc });
  }

  // Pneu : sculptures en relief sur la bande de roulement, marquage moulé sur le flanc.
  let tyreTex = null;
  function tyreTextures() {
    if (tyreTex) return tyreTex;
    const W = 512, H = 256, mk = (draw, srgb) => { const c = document.createElement('canvas'); c.width = W; c.height = H; draw(c.getContext('2d')); const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; };
    const v = (k) => (k / 7) * H, text = (x, col) => { x.fillStyle = col; for (const y of [v(1.55), v(5.45)]) { x.fillRect(0, y - 9, W, 2.5); x.fillRect(0, y + 7, W, 2.5); for (let i = 0; i < 24; i++) x.fillRect(i * (W / 24) + 4, y - 3, i % 4 ? 9 : 15, 6); } };
    const map = mk((x) => { x.fillStyle = '#1b1b1f'; x.fillRect(0, 0, W, H); x.fillStyle = '#121215'; x.fillRect(0, v(2.5), W, v(4.5) - v(2.5)); text(x, '#3a3a40'); }, true);
    const bump = mk((x) => {
      x.fillStyle = '#999'; x.fillRect(0, 0, W, H); text(x, '#fff');
      x.fillStyle = '#000';
      for (const y of [v(3.25), v(3.75)]) x.fillRect(0, y - 3, W, 6);                                   // rainures
      for (let i = 0; i < 64; i++) { x.save(); x.translate(i * 8, 0); x.scale(0.5, 1); x.beginPath(); x.moveTo(0, v(2.3)); x.lineTo(5, v(2.3)); x.lineTo(11, v(3.2)); x.lineTo(6, v(3.2)); x.fill(); x.beginPath(); x.moveTo(6, v(3.8)); x.lineTo(11, v(3.8)); x.lineTo(5, v(4.7)); x.lineTo(0, v(4.7)); x.fill(); x.restore(); }
    }, false);
    return (tyreTex = { map, bump });
  }

  function wheel(r, side, mats) {
    const g = wheelGeometry(r, side), w = new T.Group(), tyre = new T.Mesh(g.tyre, mats.tyre), spin = new T.Group();
    tyre.castShadow = true;
    spin.add(new T.Mesh(g.metal, mats.metal), new T.Mesh(g.disc, mats.disc));
    if (g.barrel) { spin.add(new T.Mesh(g.barrel, mats.barrel), new T.Mesh(g.brake, mats.brake)); w.add(new T.Mesh(g.cal, mats.cal)); }
    w.add(tyre, spin);
    return w;
  }

  MB.buildCarHD = function (shape, hex, env) {
    const sp = SHAPES[shape], g = new T.Group(), body = new T.Group();
    const b = buildBody(sp, hex, env);
    body.add(b.mesh);
    const [x0, x1] = sp.x, R = 0.46;
    const dark = new T.MeshStandardMaterial({ color: 0x101114, roughness: 0.55, envMap: env });
    const paint = new T.MeshStandardMaterial({ color: hex, metalness: 0.45, roughness: 0.24, envMap: env });
    const red = new T.MeshStandardMaterial({ color: 0xc10f12, emissive: 0xff1a12, emissiveIntensity: 1.1, roughness: 0.25 });
    const lamp = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c4, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.15, envMap: env });
    const rear = b.at(x0 + 0.14), front = b.at(x1 - 0.14), sph = new T.SphereGeometry(1, 16, 10);
    const RA = MB.REEL && MB.REEL.A;
    const chromeA = RA && new T.MeshStandardMaterial({ color: 0xe6e9ee, metalness: 1, roughness: 0.1, envMap: env, envMapIntensity: 1.4 });
    const lensA = RA && new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, roughness: 0.02, envMap: env, envMapIntensity: 3.5 });
    if (RA) {
      Object.assign(red, { color: new T.Color(0x9c0b0e), emissiveIntensity: 0.5, roughness: 0.1, envMap: env, envMapIntensity: 1.6 });
      paint.metalness = 0.3; paint.roughness = 0.4; paint.envMapIntensity = 1.0;
    }
    for (const s of [-1, 1]) {
      const tl = new T.Mesh(sph, red); tl.scale.set(0.07, 0.085, 0.27); tl.position.set(x0 + 0.1, rear.belt - 0.13, s * rear.w * 0.56); body.add(tl);
      const hl = new T.Mesh(sph, RA ? chromeA : lamp); hl.scale.set(0.2, 0.065, 0.24); hl.position.set(x1 - 0.26, front.belt - 0.03, s * front.w * 0.62); hl.rotation.y = s * -0.35; body.add(hl);
      if (RA) {                                                  // phare : cuvelage chromé, deux ampoules, glace transparente
        for (const k of [-0.09, 0.08]) { const bu = new T.Mesh(sph, lamp); bu.scale.set(0.05, 0.045, 0.06); bu.position.set(hl.position.x + 0.12 + (k > 0 ? s * -0.0 : 0), hl.position.y + 0.02, hl.position.z + k); body.add(bu); }
        const le = new T.Mesh(sph, lensA); le.scale.set(0.225, 0.08, 0.265); le.position.copy(hl.position); le.position.x += 0.012; le.rotation.y = hl.rotation.y; le.renderOrder = 2; body.add(le);
        const at = b.at(mid2(sp) + 0.25), hd = new T.Mesh(new T.BoxGeometry(0.26, 0.035, 0.035), chromeA); hd.position.set(mid2(sp) + 0.25, at.belt - 0.09, s * (at.w + 0.0)); body.add(hd);   // poignée
      }
      const mir = new T.Mesh(sph, paint), gx = sp.glass[1] - 0.3; mir.scale.set(0.09, 0.07, 0.13);
      const ga = b.at(gx); mir.position.set(gx, ga.belt + 0.05, s * (ga.w + 0.1)); body.add(mir);
      const ex = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.22, 12), new T.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.95, roughness: 0.25, envMap: env }));
      ex.rotation.z = Math.PI / 2; ex.position.set(x0 + 0.02, sp.bottom + 0.1, s * 0.46); body.add(ex);
    }
    const plate = new T.Mesh(new T.BoxGeometry(0.03, 0.14, 0.5), new T.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 }));
    plate.position.set(x0 + 0.015, rear.belt - 0.3, 0); body.add(plate);
    const grille = new T.Mesh(new T.BoxGeometry(0.06, 0.15, front.w * 1.1), dark); grille.position.set(x1 - 0.1, sp.bottom + 0.19, 0); body.add(grille);
    const splitter = new T.Mesh(new T.BoxGeometry(0.42, 0.05, front.w * 1.6), dark); splitter.position.set(x1 - 0.32, sp.bottom + 0.02, 0); body.add(splitter);
    if (RA) {
      const pt = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 36; const x = c.getContext('2d'); x.fillStyle = '#f4f3ec'; x.fillRect(0, 0, 128, 36); x.fillStyle = '#1d3f9a'; x.fillRect(0, 0, 12, 36); x.fillStyle = '#16171b'; x.font = '700 24px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MB-042', 70, 19); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; })();
      const pm = new T.MeshStandardMaterial({ map: pt, roughness: 0.45 }), pg = new T.PlaneGeometry(0.5, 0.14);
      const pr = new T.Mesh(pg, pm); pr.rotation.y = -Math.PI / 2; pr.position.set(x0 - 0.002, rear.belt - 0.3, 0); body.add(pr);
      const pf = new T.Mesh(pg, pm); pf.rotation.y = Math.PI / 2; pf.position.set(x1 - 0.045, sp.bottom + 0.19, 0); body.add(pf);
      const gt = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#0a0a0c'; x.fillRect(0, 0, 64, 32); x.fillStyle = '#8d9299'; for (let i = 0; i < 4; i++) x.fillRect(0, 3 + i * 8, 64, 2.5); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; })();
      grille.material = new T.MeshStandardMaterial({ map: gt, roughness: 0.4, metalness: 0.6, envMap: env });
      // Habitacle : baquet sombre, planche de bord, deux sièges avec appuie-tête, volant.
      const [ga, gb] = sp.glass, cx = (ga + gb) / 2, cab = b.at(cx), fl = cab.belt - 0.34, len = gb - ga - 0.5;
      const trim = new T.MeshStandardMaterial({ color: 0x1a1b20, roughness: 0.85 }), seatM = new T.MeshStandardMaterial({ color: 0x8f7755, roughness: 0.62 });
      const tub = new T.Mesh(new T.BoxGeometry(len, 0.06, cab.w * 1.7), trim); tub.position.set(cx + 0.05, fl, 0); body.add(tub);
      const dash = new T.Mesh(new T.BoxGeometry(0.34, 0.26, cab.w * 1.66), trim); dash.position.set(gb - 0.42, cab.belt - 0.1, 0); body.add(dash);
      const shelf = new T.Mesh(new T.BoxGeometry(0.5, 0.05, cab.w * 1.6), trim); shelf.position.set(ga + 0.5, cab.belt - 0.03, 0); body.add(shelf);
      const round = (w, h, d) => { const q = new T.SphereGeometry(0.5, 12, 8); q.scale(w, h, d); return q; };
      for (const s of [-1, 1]) {
        const z = s * cab.w * 0.43, sx = cx - 0.12;
        const cu = new T.Mesh(round(0.52, 0.2, 0.5), seatM); cu.position.set(sx + 0.16, fl + 0.12, z); body.add(cu);
        const bk = new T.Mesh(round(0.2, 0.62, 0.5), seatM); bk.position.set(sx - 0.12, fl + 0.38, z); bk.rotation.z = 0.22; body.add(bk);
        const hr = new T.Mesh(round(0.14, 0.18, 0.3), seatM); hr.position.set(sx - 0.2, Math.min(fl + 0.74, cab.roof - 0.14), z); body.add(hr);
      }
      const sw = new T.Mesh(new T.TorusGeometry(0.15, 0.025, 6, 18), trim); sw.rotation.y = Math.PI / 2; sw.rotation.z = 0; sw.position.set(gb - 0.62, cab.belt + 0.0, cab.w * 0.43); sw.rotateX(0.35); body.add(sw);
      const mirG = new T.Mesh(new T.BoxGeometry(0.02, 0.07, 0.2), chromeA); mirG.position.set(gb - 0.5, cab.roof - 0.1, 0); body.add(mirG);
    }
    if (sp.spoiler === 'lip') {
      const lipM = new T.Mesh(new T.BoxGeometry(0.24, 0.05, 1.4), paint); lipM.position.set(x0 + 0.26, rear.belt + 0.09, 0); lipM.rotation.z = 0.2; body.add(lipM);
    } else if (sp.spoiler === 'roof') {
      const lipM = new T.Mesh(new T.BoxGeometry(0.42, 0.05, 1.26), paint); lipM.position.set(x0 + 0.12, 1.55, 0); lipM.rotation.z = 0.14; body.add(lipM);
    } else if (sp.spoiler === 'wing') {
      const wing = new T.Mesh(new T.BoxGeometry(0.44, 0.05, 2.0), paint); wing.position.set(x0 + 0.18, sp.wingY || 1.2, 0); wing.rotation.z = 0.12; wing.castShadow = true; body.add(wing);
      for (const s of [-1, 1]) { const wy = sp.wingY || 1.2, p = new T.Mesh(new T.BoxGeometry(0.2, wy - 0.78, 0.04), dark); p.position.set(x0 + 0.24, (wy + 0.78) / 2 - 0.02, s * 0.62); body.add(p); }
    }
    const chrome = new T.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.95, roughness: 0.25, envMap: env });
    const bar = (len, ax, px, py, pz, rx, rz) => { const m = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, len, 10), ax ? chrome : dark); m.position.set(px, py, pz); m.rotation.set(rx || 0, 0, rz || 0); m.castShadow = true; body.add(m); };
    for (const e of sp.extra || []) {
      if (e === 'rollbar') {                                     // arceau du buggy
        const at = b.at(-0.7), top = at.roof + 0.55;
        for (const s of [-1, 1]) bar(top - at.belt, true, -0.7, (top + at.belt) / 2, s * 0.62);
        bar(1.24, true, -0.7, top, 0, Math.PI / 2);
        for (const s of [-1, 1]) bar(0.9, true, -1.05, top - 0.3, s * 0.62, 0, -0.85);
      } else if (e === 'lights') {                               // rampe de phares sur l'arceau
        for (const s of [-1, 0, 1]) { const l = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.08, 14), lamp); l.rotation.z = Math.PI / 2; l.position.set(-0.62, b.at(-0.7).roof + 0.62, s * 0.36); body.add(l); }
      } else if (e === 'bed') {                                  // benne du pick-up, creuse et sombre
        const at = b.at(-1.5), bed = new T.Mesh(new T.BoxGeometry(1.75, 0.04, at.w * 1.7), dark);
        bed.position.set(-1.55, at.roof + 0.01, 0); body.add(bed);
        for (const s of [-1, 1]) { const r = new T.Mesh(new T.BoxGeometry(1.85, 0.16, 0.08), paint); r.position.set(-1.55, at.roof + 0.08, s * at.w * 0.9); body.add(r); }
        const gate = new T.Mesh(new T.BoxGeometry(0.08, 0.16, at.w * 1.8), paint); gate.position.set(x0 + 0.05, at.roof + 0.08, 0); body.add(gate);
      } else if (e === 'spare') {                                // roue de secours accrochée derrière
        const sw = wheel(0.42, 1, { tyre: new T.MeshStandardMaterial({ color: 0x17171b, roughness: 0.82 }), metal: chrome, disc: dark });
        sw.rotation.y = Math.PI / 2; sw.position.set(x0 - 0.22, 1.25, 0); body.add(sw);
      } else if (e === 'bullbar') {                              // pare-buffle
        bar(1.5, true, x1 + 0.12, sp.bottom + 0.45, 0, Math.PI / 2);
        for (const s of [-1, 1]) bar(0.62, true, x1 + 0.1, sp.bottom + 0.3, s * 0.5);
      } else if (e === 'blower') {                               // compresseur qui sort du capot
        const bx = new T.Mesh(new T.BoxGeometry(0.62, 0.34, 0.5), chrome); bx.position.set(0.75, b.at(0.75).roof + 0.15, 0); bx.castShadow = true; body.add(bx);
        const sc = new T.Mesh(new T.BoxGeometry(0.4, 0.2, 0.56), dark); sc.position.set(0.8, b.at(0.75).roof + 0.4, 0); body.add(sc);
      }
    }
    g.add(body);
    g.repaint = b.mesh.repaint;
    g.body = body; g.wheels = []; g.paint = paint; g.top = new T.Box3().setFromObject(b.mesh).max.y; g.roofX = (sp.glass[0] + sp.glass[1]) / 2;
    const zw = sp.zw || 0.96, wheelMats = {
      tyre: new T.MeshStandardMaterial({ color: 0x17171b, roughness: 0.82, envMap: env }),
      metal: new T.MeshStandardMaterial({ color: 0xcfd3da, metalness: 0.9, roughness: 0.28, envMap: env, envMapIntensity: 1.3 }),
      disc: new T.MeshStandardMaterial({ color: 0x24252b, metalness: 0.4, roughness: 0.6 }),
    };
    if (RA) {
      const tt = tyreTextures();
      Object.assign(wheelMats.tyre, { map: tt.map, bumpMap: tt.bump, bumpScale: 0.012, roughness: 0.8 }); wheelMats.tyre.color.setHex(0xffffff);
      Object.assign(wheelMats.metal, { metalness: 0.55, roughness: 0.3, envMapIntensity: 1.4 }); wheelMats.metal.color.setHex(0xe2e6ec);   // alliage peint : reste clair côté ombre
      wheelMats.barrel = new T.MeshStandardMaterial({ color: 0x55585f, metalness: 0.9, roughness: 0.4, envMap: env, side: T.BackSide });
      wheelMats.brake = new T.MeshStandardMaterial({ color: 0x9a9da3, metalness: 1, roughness: 0.34, envMap: env });
      wheelMats.cal = new T.MeshStandardMaterial({ color: 0xd8a51d, roughness: 0.4, envMap: env });
    }
    for (const a of [1, 0]) for (const s of [1, -1]) {
      const r = sp.wheels ? sp.wheels[a] : R, w = wheel(r, s, wheelMats); w.position.set(sp.axle[a], r, s * zw); g.add(w);
      g.wheels.push(w); w.front = a === 1; w.k = 0.62 * r / R;    // une grande roue tourne moins vite
    }
    g.rimMat = wheelMats.metal;
    return g;
  };

  // Style choisi au garage : couleur des jantes et numéro de course sur le toit.
  MB.styleCar = function (g, look) {
    if (!look) return;
    const rim = look.rim && MB.LOOKS.rim.find((r) => r.id === look.rim);
    if (rim) g.rimMat.color.setHex(rim.hex);
    if (look.deco && g.repaint) g.repaint(look.deco);
    if (look.num) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill();
      x.fillStyle = '#1b1b22'; x.font = '900 76px Arial Black, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(look.num, 64, 70);
      const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
      const m = new T.Mesh(new T.CircleGeometry(0.34, 32), new T.MeshStandardMaterial({ map: tex, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); m.position.set(g.roofX, g.top + 0.012, 0);
      g.body.add(m);
    }
  };
})(window.MB = window.MB || {});
