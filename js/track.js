// Géométrie du circuit : boucle Catmull-Rom rééchantillonnée à pas constant. Sans dépendance à three.js.
(function (MB) {
  const cfg = () => MB.CONFIG || require('./data.js').CONFIG;
  const SC_LAT = 3.5, SC_WIDTH = 11;

  function catmull(a, b, c, d, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
  }

  MB.buildTrack = function (def) {
    const { trackLength, trackWidth, ds } = cfg();
    const n = def.pts.length, raw = [];
    for (let i = 0; i < n; i++) {
      const p0 = def.pts[(i + n - 1) % n], p1 = def.pts[i], p2 = def.pts[(i + 1) % n], p3 = def.pts[(i + 2) % n];
      for (let k = 0; k < 40; k++) {
        const t = k / 40;
        raw.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t)]);
      }
    }
    let rawLen = 0;
    const seg = raw.map((p, i) => {
      const q = raw[(i + 1) % raw.length], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      rawLen += d; return d;
    });
    const scale = trackLength / rawLen, cx = 50, cz = 50;
    const count = Math.round(trackLength / ds), step = rawLen / count;
    const px = new Float32Array(count), pz = new Float32Array(count);
    let idx = 0, acc = 0;
    for (let i = 0; i < count; i++) {
      const target = i * step;
      while (acc + seg[idx] < target) { acc += seg[idx]; idx = (idx + 1) % raw.length; }
      const f = (target - acc) / seg[idx], a = raw[idx], b = raw[(idx + 1) % raw.length];
      px[i] = (a[0] + (b[0] - a[0]) * f - cx) * scale;
      pz[i] = (a[1] + (b[1] - a[1]) * f - cz) * scale;
    }
    // Lissage circulaire : gomme les virages trop serrés nés des points de contrôle.
    for (let pass = 0; pass < 70; pass++) {
      const ax = px.slice(), az = pz.slice();
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count, h = (i + count - 1) % count;
        px[i] = (ax[h] + 2 * ax[i] + ax[j]) / 4;
        pz[i] = (az[h] + 2 * az[i] + az[j]) / 4;
      }
    }
    const tx = new Float32Array(count), tz = new Float32Array(count), curv = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count, h = (i + count - 1) % count;
      const dx = px[j] - px[h], dz = pz[j] - pz[h], l = Math.hypot(dx, dz) || 1;
      tx[i] = dx / l; tz[i] = dz / l;
    }
    for (let i = 0; i < count; i++) {
      const a = (i + count - 3) % count, b = (i + 3) % count;
      const c = tx[a] * tz[b] - tz[a] * tx[b], d = tx[a] * tx[b] + tz[a] * tz[b];
      curv[i] = Math.abs(Math.atan2(c, d)) / (6 * ds);
    }
    // Le départ se place sur la portion la plus droite : la grille et les premiers mètres ne tombent jamais dans un virage.
    const shift = startShift(def, count, curv);
    if (shift) for (const a of [px, pz, tx, tz, curv]) { const c = a.slice(); for (let i = 0; i < count; i++) a[i] = c[(i + shift) % count]; }
    const t = { def, count, ds, length: count * ds, width: trackWidth, px, pz, tx, tz, curv };
    t.at = (s) => (Math.round(s * count) - shift + count * 2) % count;   // position relative du tracé dessiné -> indice depuis le départ
    t.jumps = (def.jumps || []).map(t.at);
    t.wallGap = { '-1': new Uint8Array(count), 1: new Uint8Array(count) };
    t.shortcuts = (def.shortcuts || []).map((d) => buildShortcut(t, d));
    return t;
  };

  // Fenêtre grille + premier élan, hors tremplins et raccourcis.
  function startShift(def, count, curv) {
    const behind = 20, ahead = 22, gap = 6, busy = new Uint8Array(count);
    const mark = (a, b) => { for (let i = a - ahead - gap; i <= b + behind + gap; i++) busy[(i + count) % count] = 1; };
    for (const s of def.jumps || []) mark(Math.round(s * count), Math.round(s * count));
    for (const d of def.shortcuts || []) mark(Math.round(d[0] * count), Math.round(d[1] * count));
    let best = 0, score = Infinity;
    for (let o = 0; o < count; o++) {
      if (busy[o]) continue;
      let m = 0;
      for (let k = -behind; k <= ahead; k++) m = Math.max(m, curv[(o + k + count) % count]);
      if (m < score) { score = m; best = o; }
    }
    return best;
  }

  // Raccourci : courbe de Hermite à pas constant qui quitte le circuit en a et le rejoint en b, du côté side (+1 = droite).
  function buildShortcut(t, d) {
    const a = t.at(d[0]), b = t.at(d[1]), side = d[2], off = SC_LAT * side;
    const p0 = [t.px[a] - t.tz[a] * off, t.pz[a] + t.tx[a] * off], p1 = [t.px[b] - t.tz[b] * off, t.pz[b] + t.tx[b] * off];
    const k = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 0.9, raw = [];
    for (let i = 0; i <= 400; i++) {
      const u = i / 400, u2 = u * u, u3 = u2 * u, h1 = 2 * u3 - 3 * u2 + 1, h2 = u3 - 2 * u2 + u, h3 = -2 * u3 + 3 * u2, h4 = u3 - u2;
      raw.push([h1 * p0[0] + h2 * k * t.tx[a] + h3 * p1[0] + h4 * k * t.tx[b], h1 * p0[1] + h2 * k * t.tz[a] + h3 * p1[1] + h4 * k * t.tz[b]]);
    }
    let len = 0;
    const seg = raw.slice(1).map((p, i) => { const l = Math.hypot(p[0] - raw[i][0], p[1] - raw[i][1]); len += l; return l; });
    const count = Math.round(len / t.ds) + 1, px = new Float32Array(count), pz = new Float32Array(count), tx = new Float32Array(count), tz = new Float32Array(count);
    let idx = 0, acc = 0;
    for (let i = 0; i < count; i++) {
      const target = (i * len) / (count - 1);
      while (idx < seg.length - 1 && acc + seg[idx] < target) { acc += seg[idx]; idx++; }
      const f = Math.min((target - acc) / seg[idx], 1);
      px[i] = raw[idx][0] + (raw[idx + 1][0] - raw[idx][0]) * f;
      pz[i] = raw[idx][1] + (raw[idx + 1][1] - raw[idx][1]) * f;
    }
    for (let i = 0; i < count; i++) {
      const j = Math.min(i + 1, count - 1), h = Math.max(i - 1, 0), dx = px[j] - px[h], dz = pz[j] - pz[h], l = Math.hypot(dx, dz) || 1;
      tx[i] = dx / l; tz[i] = dz / l;
    }
    const sc = { open: true, a, b, side, count, ds: t.ds, length: len, width: SC_WIDTH, px, pz, tx, tz, win: 0 };
    // Le mur s'ouvre là où le raccourci touche le bord ; on peut y entrer tout au long de la première ouverture.
    const edge = t.width / 2 + 1.5, gap = t.wallGap[side], reach = SC_WIDTH / 2 + 2;
    for (let i = a - 6; i <= b + 6; i++) {
      const m = (i + t.count) % t.count, wx = t.px[m] - t.tz[m] * side * edge, wz = t.pz[m] + t.tx[m] * side * edge;
      for (let q = 0; q < count; q += 2) if (Math.hypot(px[q] - wx, pz[q] - wz) < reach) { gap[m] = 1; if (i >= a && i - a < 40 && i - a === sc.win) sc.win++; break; }
    }
    // Bordures du raccourci, côté par côté : absentes tant qu'elles tomberaient sur la piste, elles prolongent
    // ensuite celles du circuit et dessinent une vraie bifurcation.
    sc.wallHole = { '-1': new Uint8Array(count), 1: new Uint8Array(count) };
    for (const k of [-1, 1]) for (let q = 0; q < count; q++) {
      const off = k * (SC_WIDTH / 2 + 1), wx = px[q] - tz[q] * off, wz = pz[q] + tx[q] * off;
      for (let i = 0; i < t.count; i += 2) if (Math.hypot(t.px[i] - wx, t.pz[i] - wz) < edge) { sc.wallHole[k][q] = 1; break; }
    }
    // Bouche d'entrée et de sortie : là où le bord intérieur du raccourci est encore sur la piste.
    const inner = sc.wallHole[-side];
    sc.mouth = 0; while (sc.mouth < count && inner[sc.mouth]) sc.mouth++;
    sc.tail = 0; while (sc.tail < count && inner[count - 1 - sc.tail]) sc.tail++;
    sc.door = Math.min(sc.win, 6);                            // porte d'entrée étroite (~12 m) : on la vise, on n'y tombe pas
    sc.pad = Math.max(1, count - 9);                          // dalle turbo des derniers mètres : la sortie relance la voiture
    return sc;
  }

  // Projection locale autour du dernier indice connu : évite de sauter sur un tronçon voisin.
  MB.projectTrack = function (t, x, z, hint) {
    let best = hint, bd = Infinity;
    for (let k = -14; k <= 14; k++) {
      const i = (hint + k + t.count) % t.count, dx = x - t.px[i], dz = z - t.pz[i], d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    const dx = x - t.px[best], dz = z - t.pz[best];
    return { i: best, along: dx * t.tx[best] + dz * t.tz[best], lat: -dx * t.tz[best] + dz * t.tx[best] };
  };

  // Même projection sur un raccourci, qui n'est pas une boucle.
  MB.projectPath = function (p, x, z, hint) {
    let best = hint, bd = Infinity;
    for (let i = Math.max(hint - 14, 0), e = Math.min(hint + 14, p.count - 1); i <= e; i++) {
      const dx = x - p.px[i], dz = z - p.pz[i], d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    const dx = x - p.px[best], dz = z - p.pz[best];
    return { i: best, along: dx * p.tx[best] + dz * p.tz[best], lat: -dx * p.tz[best] + dz * p.tx[best] };
  };

  // Variante « sens inverse » : même courbe parcourue à l'envers depuis le même premier point ;
  // une position relative s devient 1 - s, et un raccourci change de côté.
  MB.reverseDef = function (def) {
    const flip = (s) => (1 - s) % 1;
    return Object.assign({}, def, {
      pts: [def.pts[0], ...def.pts.slice(1).reverse()],
      jumps: (def.jumps || []).map(flip),
      shortcuts: (def.shortcuts || []).map(([a, b, side]) => [flip(b), flip(a) || 1, -side]),
    });
  };

  // Distance minimale à l'axe du circuit (placement du décor).
  MB.trackDistance = function (t, x, z) {
    let bd = Infinity;
    for (let i = 0; i < t.count; i += 2) {
      const dx = x - t.px[i], dz = z - t.pz[i], d = dx * dx + dz * dz;
      if (d < bd) bd = d;
    }
    for (const p of t.shortcuts) for (let i = 0; i < p.count; i += 2) {
      const dx = x - p.px[i], dz = z - p.pz[i], d = dx * dx + dz * dz;
      if (d < bd) bd = d;
    }
    return Math.sqrt(bd);
  };
})(typeof window !== 'undefined' ? (window.MB = window.MB || {}) : module.exports);
