// Sons synthétisés (Web Audio) : moteur à rapports de boîte, crissement des pneus, fanfare de victoire et applaudissements.
// Tout est calculé ici, sans fichier : aucune question de licence.
(function (MB) {
  const noiseBuf = (ctx) => {
    if (ctx._noise) return ctx._noise;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (ctx._noise = b);
  };
  const noise = (ctx) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); s.loop = true; return s; };
  const osc = (ctx, type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; };
  const gain = (ctx, v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filter = (ctx, type, f, q) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; };
  const note = (n) => 440 * Math.pow(2, (n - 69) / 12);          // numéro MIDI → Hz

  // Rapports de boîte : le régime monte dans chaque rapport puis retombe au passage du suivant.
  const GEARS = [0, 0.22, 0.45, 0.68, 0.88, 1.01];
  function rpm(ratio) {
    let g = 0;
    while (g < GEARS.length - 2 && ratio > GEARS[g + 1]) g++;
    const u = (ratio - GEARS[g]) / (GEARS[g + 1] - GEARS[g]);
    return { gear: g, rpm: 0.28 + 0.72 * Math.max(0, Math.min(1, u)) };
  }

  // Moteur : dents de scie et carré à l'octave basse, saturés, avec un battement d'allumage et un souffle filtré.
  function engine(ctx, out) {
    const vol = gain(ctx, 0), lp = filter(ctx, 'lowpass', 600, 2.2), am = gain(ctx, 0.7), sh = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 255) * 2 - 1; curve[i] = Math.tanh(x * 3.2); }
    sh.curve = curve;
    const o1 = osc(ctx, 'sawtooth', 60), o2 = osc(ctx, 'square', 30), o3 = osc(ctx, 'sawtooth', 120), g1 = gain(ctx, 0.5), g2 = gain(ctx, 0.45), g3 = gain(ctx, 0.18);
    o3.detune.value = 9;
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    for (const g of [g1, g2, g3]) g.connect(sh);
    const lfo = osc(ctx, 'square', 30), depth = gain(ctx, 0.3);          // battement des cylindres
    lfo.connect(depth); depth.connect(am.gain);
    const n = noise(ctx), bp = filter(ctx, 'bandpass', 240, 1.2), ng = gain(ctx, 0.25);
    n.connect(bp); bp.connect(ng); ng.connect(lp);
    sh.connect(am); am.connect(lp); lp.connect(vol); vol.connect(out);
    for (const o of [o1, o2, o3, lfo, n]) o.start();
    let last = 0;
    return {
      // on : moteur audible ; ratio : vitesse / vitesse max ; boost : turbo en cours ; load : charge (accélération) ;
      // at : instant audio (par défaut maintenant, sert aux rendus hors ligne)
      // bend : multiplie la hauteur (effet Doppler d'un rival qui passe)
      set(on, ratio, boost, load, at, bend = 1) {
        const t = at === undefined ? ctx.currentTime : at, r = rpm(Math.max(0, ratio)), k = 0.04;
        const f = (34 + r.rpm * 92 + (boost ? 14 : 0)) * bend;
        o1.frequency.setTargetAtTime(f, t, k); o2.frequency.setTargetAtTime(f / 2, t, k); o3.frequency.setTargetAtTime(f * 2, t, k);
        lfo.frequency.setTargetAtTime(f / 2, t, k); bp.frequency.setTargetAtTime(f * 4, t, k);
        lp.frequency.setTargetAtTime(380 + r.rpm * 1500 + (boost ? 900 : 0) + load * 300, t, 0.06);
        vol.gain.setTargetAtTime(on ? 0.34 + load * 0.12 + (boost ? 0.1 : 0) : 0, t, on ? 0.05 : 0.12);
        if (on && r.gear !== last && r.gear > last) vol.gain.setValueAtTime(0.18, t);   // petit trou au passage de rapport
        last = r.gear;
      },
    };
  }

  // Pneus : bruit filtré très résonant et sifflement qui vibre, dosés par l'intensité de la glisse.
  function skid(ctx, out) {
    const vol = gain(ctx, 0), n = noise(ctx), bp = filter(ctx, 'bandpass', 2200, 9), bp2 = filter(ctx, 'bandpass', 3400, 12), ng = gain(ctx, 5);
    n.connect(bp); n.connect(bp2); bp.connect(ng); bp2.connect(ng); ng.connect(vol);
    const o = osc(ctx, 'triangle', 1150), og = gain(ctx, 0.3), wob = osc(ctx, 'sine', 17), wd = gain(ctx, 70);
    wob.connect(wd); wd.connect(o.frequency); o.connect(og); og.connect(vol);
    vol.connect(out);
    for (const s of [n, o, wob]) s.start();
    return {
      set(amount, ratio, at) {
        const t = at === undefined ? ctx.currentTime : at, a = Math.max(0, Math.min(1, amount));
        vol.gain.setTargetAtTime(a * (0.14 + ratio * 0.11), t, a > 0 ? 0.03 : 0.09);
        o.frequency.setTargetAtTime(950 + ratio * 400 + Math.random() * 60, t, 0.05);
        bp.frequency.setTargetAtTime(1900 + ratio * 700, t, 0.05);
      },
    };
  }

  // Pluie : souffle aigu filtré et quelques gouttes qui claquent.
  function rain(ctx, out) {
    const vol = gain(ctx, 0), n = noise(ctx), hp = filter(ctx, 'highpass', 1400, 0.5), lp = filter(ctx, 'lowpass', 7000, 0.5);
    n.connect(hp); hp.connect(lp); lp.connect(vol); vol.connect(out); n.start();
    let on = false, timer = null;
    const drop = () => {
      if (!on) return;
      const t = ctx.currentTime, o = osc(ctx, 'sine', 1800 + Math.random() * 2600), g = gain(ctx, 0);
      g.gain.setValueAtTime(0.025, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
      o.frequency.exponentialRampToValueAtTime(500, t + 0.05); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.06);
      timer = setTimeout(drop, 40 + Math.random() * 160);
    };
    return { set(v) { on = v; vol.gain.setTargetAtTime(v ? 0.12 : 0, ctx.currentTime, 0.4); clearTimeout(timer); if (v) drop(); } };
  }

  // Klaxon de jouet : deux notes carrées à la tierce, « pouet-pouet ».
  function horn(ctx, out, vol, high) {
    const t0 = ctx.currentTime + 0.01, base = high ? 523 : 392;
    for (const [dt, len] of [[0, 0.12], [0.17, 0.2]]) for (const f of [base, base * 1.26]) {
      const o = osc(ctx, 'square', f), g = gain(ctx, 0), lp = filter(ctx, 'lowpass', 1700, 1);
      g.gain.setValueAtTime(0, t0 + dt); g.gain.linearRampToValueAtTime(vol, t0 + dt + 0.01); g.gain.setValueAtTime(vol, t0 + dt + len - 0.02); g.gain.linearRampToValueAtTime(0, t0 + dt + len);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t0 + dt); o.stop(t0 + dt + len + 0.02);
    }
  }

  // Cuivre : deux dents de scie légèrement désaccordées, filtre qui s'ouvre à l'attaque.
  function brass(ctx, out, n, t0, dur, vol) {
    const f = note(n), g = gain(ctx, 0), lp = filter(ctx, 'lowpass', 500, 1.5);
    const vib = osc(ctx, 'sine', 5.5), vd = gain(ctx, f * 0.006); vib.connect(vd); vib.start(t0 + 0.15); vib.stop(t0 + dur + 0.3);
    for (const d of [-7, 7]) { const o = osc(ctx, 'sawtooth', f); o.detune.value = d; vd.connect(o.frequency); o.connect(lp); o.start(t0); o.stop(t0 + dur + 0.3); }
    lp.connect(g); g.connect(out);
    lp.frequency.setValueAtTime(500, t0); lp.frequency.linearRampToValueAtTime(3200, t0 + 0.04); lp.frequency.exponentialRampToValueAtTime(1600, t0 + 0.25);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.025); g.gain.setValueAtTime(vol * 0.85, t0 + Math.max(0.03, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur + 0.25);
  }
  function kick(ctx, out, t0, vol) {
    const o = osc(ctx, 'sine', 130), g = gain(ctx, 0);
    o.frequency.setValueAtTime(130, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.2);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.4);
  }
  function hiss(ctx, out, t0, dur, type, f, vol, q) {
    const n = noise(ctx), b = filter(ctx, type, f, q || 0.8), g = gain(ctx, 0);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    n.connect(b); b.connect(g); g.connect(out); n.start(t0, Math.random()); n.stop(t0 + dur + 0.05);
  }
  // Foule : des centaines de claquements de mains et une clameur, qui montent puis s'éteignent.
  function crowd(ctx, out, t0, dur, vol) {
    const claps = Math.round(dur * 70);
    for (let i = 0; i < claps; i++) {
      const u = Math.random(), t = t0 + u * dur, env = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u * 0.75);
      hiss(ctx, out, t, 0.03 + Math.random() * 0.03, 'bandpass', 1100 + Math.random() * 1600, vol * env * (0.5 + Math.random() * 0.5), 1.4);
    }
    const n = noise(ctx), b = filter(ctx, 'bandpass', 700, 0.6), g = gain(ctx, 0);   // clameur
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.35, t0 + 0.4); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    n.connect(b); b.connect(g); g.connect(out); n.start(t0); n.stop(t0 + dur + 0.1);
  }

  // Fanfare de victoire (composition originale). big : première place, sinon une version courte pour le podium.
  function fanfare(ctx, out, big) {
    const t0 = ctx.currentTime + 0.05, v = 0.11;
    [55, 60, 64, 67].forEach((n, i) => brass(ctx, out, n, t0 + i * 0.11, 0.1, v));            // montée sol-do-mi-sol
    kick(ctx, out, t0 + 0.46, 0.5);
    [60, 64, 67, 72].forEach((n) => brass(ctx, out, n, t0 + 0.46, big ? 0.42 : 1, v * 0.8));  // accord de do
    hiss(ctx, out, t0 + 0.46, 0.9, 'highpass', 6000, 0.12);
    if (big) {
      [65, 69, 72].forEach((n) => brass(ctx, out, n, t0 + 0.98, 0.22, v * 0.8));               // fa
      [67, 71, 74].forEach((n) => brass(ctx, out, n, t0 + 1.22, 0.16, v * 0.8));               // sol
      for (let i = 0; i < 10; i++) hiss(ctx, out, t0 + 0.95 + i * 0.04, 0.05, 'bandpass', 2500, 0.05 + i * 0.012, 1);   // roulement
      kick(ctx, out, t0 + 1.42, 0.6);
      [48, 60, 64, 67, 72, 76].forEach((n) => brass(ctx, out, n, t0 + 1.42, 1.5, v * 0.7));   // do final, long
      hiss(ctx, out, t0 + 1.42, 2, 'highpass', 5500, 0.18);                                    // cymbale
      crowd(ctx, out, t0 + 1.2, 4, 0.7);
    } else crowd(ctx, out, t0 + 0.6, 2.4, 0.5);
  }

  // ---------- Musique de fond : séquenceur maison, compositions générées (graine fixe) par ambiance ----------
  // Chaque style : tempo, tonalité (note MIDI de la tonique), mode, grille d'accords (degrés), timbre de la mélodie.
  const STYLES = {
    cuisine: { bpm: 112, key: 60, minor: false, prog: [0, 5, 3, 4], lead: 'pluck', swing: 0.12, seed: 3 },
    plage: { bpm: 120, key: 65, minor: false, prog: [0, 3, 4, 3], lead: 'steel', swing: 0.08, seed: 7 },
    foret: { bpm: 104, key: 67, minor: false, prog: [0, 4, 5, 3], lead: 'flute', swing: 0.1, seed: 11 },
    neige: { bpm: 132, key: 62, minor: false, prog: [0, 3, 0, 4], lead: 'bell', swing: 0, seed: 5, bells: true },
    ville: { bpm: 118, key: 57, minor: true, prog: [0, 5, 2, 6], lead: 'saw', swing: 0, seed: 13 },
    chambre: { bpm: 110, key: 64, minor: false, prog: [0, 3, 5, 4], lead: 'bell', swing: 0.1, seed: 17 },
    menu: { bpm: 94, key: 63, minor: false, prog: [0, 5, 3, 4], lead: 'pluck', swing: 0.14, seed: 2, calm: true },
  };
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  const deg = (st, d) => { const sc = st.minor ? MIN : MAJ, o = Math.floor(d / 7); return st.key + sc[((d % 7) + 7) % 7] + 12 * o; };
  const chord = (st, root) => [deg(st, root), deg(st, root + 2), deg(st, root + 4)];

  // Mélodie : motif de deux mesures (croches) sur les notes des accords, repris et varié : A A' B A.
  function compose(st) {
    let s = st.seed * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const motif = () => {
      const out = [];
      let d = 7 + Math.floor(rnd() * 3);
      for (let bar = 0; bar < 2; bar++) for (let k = 0; k < 8; k++) {
        if (rnd() < (k % 2 ? 0.45 : 0.15)) { out.push(null); continue; }
        const root = st.prog[bar % st.prog.length], tones = [root, root + 2, root + 4, root + 7];
        if (k % 2 === 0) { const tgt = tones[Math.floor(rnd() * 4)] + 7; d = Math.abs(tgt - d) < 4 ? tgt : d + Math.sign(tgt - d) * 2; }
        else d += rnd() < 0.5 ? 1 : -1;
        d = Math.max(5, Math.min(14, d));
        out.push({ d, len: rnd() < 0.25 && k % 2 === 0 ? 2 : 1 });
      }
      return out;
    };
    const A = motif(), B = motif(), A2 = A.map((n, i) => (i > 11 && n ? { d: n.d + (i % 2 ? 1 : 2), len: n.len } : n));
    return [...A, ...A2, ...B, ...A];                                   // 8 mesures
  }

  function music(ctx, out) {
    const bus = gain(ctx, 0); bus.connect(out);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(bus);
    let st = null, mel = null, step = 0, next = 0, speed = 1, vol = 0;
    const tone = (type, f, t, dur, v, attack, lpf, dest) => {
      const o = osc(ctx, type, f), g = gain(ctx, 0), lp = filter(ctx, 'lowpass', lpf || 3000, 0.7);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (attack || 0.008)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(lp); lp.connect(g); g.connect(dest || comp); o.start(t); o.stop(t + dur + 0.05);
      return o;
    };
    const lead = (n, t, dur) => {
      const f = note(n), k = st.lead;
      if (k === 'bell') { tone('sine', f, t, 0.9, 0.09, 0.004); tone('sine', f * 2.76, t, 0.35, 0.03, 0.002); }
      else if (k === 'steel') { tone('sine', f, t, 0.5, 0.1, 0.004); tone('triangle', f * 2, t, 0.2, 0.04, 0.003); }
      else if (k === 'flute') { const o = tone('sine', f, t, dur + 0.15, 0.08, 0.05); const v = osc(ctx, 'sine', 5), vd = gain(ctx, f * 0.008); v.connect(vd); vd.connect(o.frequency); v.start(t); v.stop(t + dur + 0.2); tone('triangle', f * 2, t, dur, 0.015, 0.05); }
      else if (k === 'saw') tone('sawtooth', f, t, dur + 0.1, 0.05, 0.01, 1800);
      else tone('triangle', f, t, 0.3, 0.1, 0.004, 2500);
    };
    const kick = (t, v) => { const o = osc(ctx, 'sine', 120), g = gain(ctx, 0); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g); g.connect(comp); o.start(t); o.stop(t + 0.3); };
    const hit = (t, type, f, dur, v, q) => { const n = noise(ctx), b = filter(ctx, type, f, q || 0.7), g = gain(ctx, 0); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); n.connect(b); b.connect(g); g.connect(comp); n.start(t, Math.random()); n.stop(t + dur + 0.02); };

    // Une croche : batterie, basse, accords, mélodie.
    function eighth(t, i) {
      const bar = Math.floor(i / 8) % 8, k = i % 8, root = st.prog[bar % st.prog.length], spb = 60 / (st.bpm * speed), e = spb / 2;
      const calm = st.calm;
      if (k === 0 || k === 4 || (!calm && k === 6 && bar % 2)) kick(t, calm ? 0.35 : 0.55);
      if (k === 2 || k === 6) { hit(t, 'bandpass', 1800, 0.14, calm ? 0.06 : 0.16, 0.9); if (!calm) tone('triangle', 190, t, 0.08, 0.06); }
      hit(t, 'highpass', st.bells ? 6500 : 8000, k % 2 ? 0.03 : 0.05, (calm ? 0.025 : 0.05) * (k % 2 ? 0.7 : 1));
      if (st.bells && k % 2) hit(t, 'bandpass', 7000, 0.06, 0.05, 6);                          // grelots
      const bassN = deg(st, root) - 24 + (k === 3 || k === 7 ? 7 : 0);
      if (k !== 1 && k !== 5) tone(st.minor ? 'sawtooth' : 'triangle', note(bassN), t, e * 0.9, calm ? 0.12 : 0.18, 0.005, 600);
      if (k === 2 || k === 6 || (k === 0 && bar % 4 === 0)) for (const n of chord(st, root)) tone('square', note(n), t, e * 0.8, 0.018, 0.005, 1600);   // accords en contretemps
      const m = mel[i % mel.length];
      if (m && !(calm && bar % 2)) lead(deg(st, m.d), t, e * m.len);
    }

    return {
      // style : clé de STYLES, ou null pour arrêter (fondu).
      play(style) {
        const t = ctx.currentTime;
        if (!style) { bus.gain.setTargetAtTime(0, t, 0.3); st = null; return; }
        if (!st || st !== STYLES[style]) { st = STYLES[style]; mel = compose(st); step = 0; next = t + 0.1; }
        bus.gain.setTargetAtTime(vol, t, 0.4);
      },
      volume(v) { vol = v; if (st) bus.gain.setTargetAtTime(v, ctx.currentTime, 0.3); },
      tempo(k) { speed = k; },
      // À appeler souvent (chaque image) : programme les croches des 0,25 s à venir.
      tick() {
        if (!st) return;
        const now = ctx.currentTime;
        if (next < now - 0.3) next = now + 0.05;                          // reprise après une pause : on ne rattrape pas
        while (next < now + 0.25) {
          const e = 30 / (st.bpm * speed), sw = step % 2 ? e * st.swing : 0;
          eighth(next + sw, step);
          next += e; step++;
        }
      },
      // Rendu hors ligne : programme n croches d'un coup.
      prerender(style, n) { st = STYLES[style]; mel = compose(st); vol = 1; bus.gain.value = 1; for (let i = 0; i < n; i++) { const e = 30 / st.bpm; eighth(0.05 + i * e + (i % 2 ? e * st.swing : 0), i); } },
    };
  }

  MB.Synth = { engine, skid, fanfare, horn, rain, rpm, music, STYLES };
})(typeof window !== 'undefined' ? (window.MB = window.MB || {}) : module.exports);
