// Arrière-plan peint (maquette) : trois couronnes autour du circuit — ciel (nuages ou étoiles), lointain (le « monde
// géant » : mur de cuisine, mer, montagnes, ville…) et second plan (objets colorés détaillés). Tout est peint sur des
// textures : quelques triangles seulement, le coût reste celui de trois anneaux.
(function () {
  const T = window.THREE;
  const W = 2048, H = 512;

  let haze = null;   // [couleur du ciel, opacité] : la brume est peinte, plus légère que le brouillard de la scène
  function paint(draw) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    draw(g);
    if (haze && haze[1] > 0) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = haze[0]; g.globalAlpha = haze[1]; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    const t = new T.CanvasTexture(c);
    t.wrapS = T.RepeatWrapping; t.wrapT = T.ClampToEdgeWrapping; t.anisotropy = 4; t.encoding = T.sRGBEncoding;
    return t;
  }

  function kit(g, seed) {
    let sd = (seed * 104729 + 17) % 2147483647 || 1;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd % 100000) / 100000; };
    // Chaque motif est dessiné trois fois (décalé d'une largeur) pour que la bande se raccorde sur elle-même.
    const thrice = (f) => { for (const o of [-W, 0, W]) f(o); };
    const rr = (x, y, w, h, r, fill) => {
      g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); }
    };
    const circ = (x, y, r, fill) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); };
    const wave = (base, amps, fill, ph = 0) => {
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) { let y = base; for (const [a, f, p] of amps) y -= a * Math.sin((x / W) * Math.PI * 2 * f + p + ph); g.lineTo(x, y); }
      g.lineTo(W, H); g.closePath(); g.fillStyle = fill; g.fill();
    };
    const vgrad = (y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
    return { rnd, thrice, rr, circ, wave, vgrad };
  }

  // La nuit : on assombrit tout ce qui est peint, puis on rallume les fenêtres et les lampes par-dessus.
  function nightOver(g, lights) {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(14,18,52,.68)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    if (lights) lights();
  }

  // ---------- Ciel ----------
  // Pièces de la maison : pas de ciel, le haut du mur et le plafond (la bande basse est cachée par le lointain).
  const INDOOR = { cuisine: 1, chambre: 1, bain: 1 };
  function indoor(g, k, kind, night) {
    const wall = { cuisine: ['#efdcbf', '#f2e3cb'], chambre: ['#efd2e2', '#f3dbe8'], bain: ['#8fc6d8', '#a9d4e2'] }[kind];
    const ceil = { cuisine: ['#d9c3a0', '#f3e8d6'], chambre: ['#b9c9ef', '#e4ecfb'], bain: ['#9cc2cf', '#cfe3ea'] }[kind];
    g.fillStyle = k.vgrad(0, 190, ceil); g.fillRect(0, 0, W, 190);
    g.fillStyle = k.vgrad(190, H, wall); g.fillRect(0, 190, W, H - 190);
    g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 196, W, 6);
    const lamps = [];
    if (kind === 'cuisine') {
      for (let x = 0; x < W; x += 256) { g.fillStyle = '#b98b5e'; g.fillRect(x, 0, 46, 176); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + 36, 0, 10, 176); }   // poutres
      g.fillStyle = '#c9a77f'; g.fillRect(0, 176, W, 20);   // corniche
      g.strokeStyle = 'rgba(160,130,95,.3)'; g.lineWidth = 2; for (let y = 230; y < H; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      for (let x = 180; x < W; x += 512) {   // suspensions
        g.fillStyle = '#4a3424'; g.fillRect(x - 2, 0, 4, 250);
        g.fillStyle = '#e8564a'; g.beginPath(); g.moveTo(x - 60, 330); g.lineTo(x + 60, 330); g.lineTo(x + 26, 250); g.lineTo(x - 26, 250); g.fill();
        g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x - 20, 256, 8, 70);
        lamps.push([x, 336]); k.circ(x, 334, 14, '#fff3c8');
      }
      for (let x = 420; x < W; x += 512) { g.fillStyle = '#8d6440'; g.fillRect(x, 300, 150, 10); for (let i = 0; i < 4; i++) k.rr(x + 10 + i * 36, 250 + (i % 2) * 10, 28, 50 - (i % 2) * 10, 6, ['#f2b632', '#3f8fe0', '#d8483d', '#ffffff'][i]); }   // étagère à bocaux
    } else if (kind === 'chambre') {
      for (let i = 0; i < 60; i++) { const x = k.rnd() * W, y = 10 + k.rnd() * 160; star(g, x, y, 5 + k.rnd() * 6, 'rgba(255,240,160,.85)'); }   // étoiles collées au plafond
      g.fillStyle = '#d9b7cc'; g.fillRect(0, 186, W, 12);
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let x = 0; x < W; x += 48) g.fillRect(x, 198, 20, H - 198);
      // Guirlande de fanions.
      for (let x0 = 0; x0 < W; x0 += 512) {
        g.strokeStyle = '#8a6a8a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, 230); g.quadraticCurveTo(x0 + 256, 330, x0 + 512, 230); g.stroke();
        for (let i = 1; i < 12; i++) { const t = i / 12, x = x0 + t * 512, y = 230 + 100 * 2 * t * (1 - t) * 1; g.fillStyle = ['#e14b3a', '#f2b632', '#48b58a', '#2a70c9', '#9b6ad6'][i % 5]; g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x + 14, y); g.lineTo(x, y + 34); g.fill(); }
      }
      for (let x = 300; x < W; x += 1024) {   // mobile suspendu
        g.strokeStyle = '#8a6a8a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 120); g.moveTo(x - 80, 120); g.lineTo(x + 80, 120); g.stroke();
        for (const [dx, c] of [[-80, '#f2b632'], [0, '#ff8fb5'], [80, '#7fd0ff']]) { g.beginPath(); g.moveTo(x + dx, 120); g.lineTo(x + dx, 160); g.stroke(); star(g, x + dx, 176, 16, c); }
      }
    } else {
      // Faïence jusqu'au plafond, frise, plafonnier rond et buée.
      g.fillStyle = '#5f97ab'; g.fillRect(0, 210, W, H - 210);   // joints
      for (let y = 210; y < H; y += 40) for (let x = 0; x < W; x += 40) { const n = (x / 40 + y / 40) % 9; g.fillStyle = n === 0 ? '#2f8fb8' : n === 4 ? '#ffd23f' : (x / 40 + y / 40) % 2 ? '#a9d8e8' : '#c4e6f0'; g.fillRect(x + 2, y + 2, 36, 36); }
      g.fillStyle = '#1f6f94'; g.fillRect(0, 196, W, 16); g.fillStyle = '#ffffff'; for (let x = 6; x < W; x += 24) g.fillRect(x, 201, 10, 6);
      for (let x = 400; x < W; x += 1024) { k.circ(x, 60, 70, '#ffffff'); k.circ(x, 60, 56, '#fff9e6'); lamps.push([x, 60]); }
      g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(k.rnd() * W, 140 + k.rnd() * 200, 120 + k.rnd() * 160, 26, 0, 0, 7); g.fill(); }   // buée
      for (let i = 0; i < 40; i++) { const x = k.rnd() * W, y = 220 + k.rnd() * 260, r = 5 + k.rnd() * 12; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); k.circ(x - r * 0.35, y - r * 0.35, r * 0.25, 'rgba(255,255,255,.9)'); }   // bulles qui montent
    }
    if (night) nightOver(g, () => { for (const [x, y] of lamps) { const gr = g.createRadialGradient(x, y, 4, x, y, 150); gr.addColorStop(0, 'rgba(255,230,160,.85)'); gr.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = gr; g.fillRect(x - 150, y - 150, 300, 300); } });
  }
  function star(g, x, y, r, c) {
    g.fillStyle = c; g.beginPath();
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? r * 0.45 : r; i ? g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : g.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    g.fill();
  }

  function sky(kind, night, seed) {
    return paint((g) => {
      const k = kit(g, seed + 5);
      if (INDOOR[kind]) return indoor(g, k, kind, night);
      if (kind === 'sousbois') {
        // Voûte des feuilles : ciel clair qui perce entre des grappes de feuillage pendantes et quelques branches.
        g.fillStyle = k.vgrad(0, H, ['#e9f2c4', '#cfe2a4', '#a9c48a']); g.fillRect(0, 0, W, H);
        for (let i = 0; i < 6; i++) { const x = k.rnd() * W; g.fillStyle = 'rgba(255,250,215,.35)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 70, 0); g.lineTo(x + 230, H); g.lineTo(x + 140, H); g.fill(); }   // rayons
        k.thrice((o) => {
          g.strokeStyle = '#3d2c1c'; g.lineCap = 'round';
          for (let x = 80; x < W; x += 340) { g.lineWidth = 16; g.beginPath(); g.moveTo(x + o, -10); g.quadraticCurveTo(x + o + 90, 90, x + o + 220, 120); g.stroke(); g.lineWidth = 8; g.beginPath(); g.moveTo(x + o + 120, 80); g.quadraticCurveTo(x + o + 140, 140, x + o + 110, 190); g.stroke(); }
          for (let x = 0; x < W; x += 120) {                       // grappes : denses en haut, qui pendent en lobes irréguliers
            const cx = x + o + ((x * 37) % 60), drop = 70 + ((x * 53) % 150);
            for (let n = 0; n < 34; n++) {
              const t = n / 34, y = -20 + t * drop + ((n * 29) % 20), r = 46 - t * 26 + ((n * 7) % 10), dx = ((n * 71) % 130) - 65;
              k.circ(cx + dx * (1 - t * 0.5), y, r, ['#1d3d1d', '#29512a', '#356634', '#447a3c'][(n + x) % 4]);
            }
          }
        });
        for (let i = 0; i < 90; i++) k.circ(k.rnd() * W, k.rnd() * 160, 2 + k.rnd() * 5, `rgba(150,200,90,${0.4 + k.rnd() * 0.4})`);   // feuilles éclairées
        if (night) nightOver(g);
        return;
      }
      if (night) {
        for (let i = 0; i < 420; i++) { const x = k.rnd() * W, y = k.rnd() * 330, r = k.rnd() < 0.08 ? 2.2 : 1 + k.rnd(); k.circ(x, y, r, `rgba(255,255,240,${0.4 + k.rnd() * 0.6})`); }
        k.circ(W * 0.3, 110, 46, 'rgba(255,250,220,.95)'); k.circ(W * 0.3 + 18, 98, 40, 'rgba(20,26,70,1)');   // croissant de lune
        return;
      }
      if (kind === 'grenier') {                                   // charpente : chevrons sombres et lucarne de lumière
        g.fillStyle = k.vgrad(0, H, ['#5c4330', '#7a5a3e', '#9a7752']); g.fillRect(0, 0, W, H);
        for (let x = 0; x < W; x += 128) { g.fillStyle = '#4a3424'; g.fillRect(x, 0, 30, H); g.fillStyle = 'rgba(255,220,160,.12)'; g.fillRect(x + 4, 0, 6, H); }
        g.fillStyle = '#3c2a1c'; g.fillRect(0, 300, W, 26);
        for (let x = 300; x < W; x += 1024) { k.rr(x, 120, 150, 110, 8, '#3c2a1c'); g.fillStyle = k.vgrad(126, 224, ['#bfe3ff', '#fff2cf']); g.fillRect(x + 10, 130, 130, 90); g.fillStyle = '#3c2a1c'; g.fillRect(x + 72, 130, 6, 90); }
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5;
        for (const cx of [140, 900, 1500]) { for (let a = 0; a < 7; a++) { g.beginPath(); g.moveTo(cx, 330); g.lineTo(cx + Math.cos(a * 0.45) * 90, 330 + Math.sin(a * 0.45) * 90); g.stroke(); } for (let r = 20; r < 90; r += 18) { g.beginPath(); g.arc(cx, 330, r, 0, 2.7); g.stroke(); } }   // toiles d'araignée
        if (night) nightOver(g);
        return;
      }
      // Nuages ronds, en ligne de base plate, plus petits et plus pâles en montant (plus loin).
      for (let i = 0; i < 26; i++) {
        const x = k.rnd() * W, y = 150 + k.rnd() * 220, s = 0.5 + (y / 370) * 0.9, a = 0.55 + (y / 370) * 0.4;
        k.thrice((o) => {
          g.fillStyle = `rgba(255,255,255,${a})`;
          g.beginPath();
          for (const [dx, dy, r] of [[0, 0, 30], [34, -14, 38], [76, -4, 30], [104, 6, 22], [-24, 8, 22]]) { g.moveTo(x + o + dx * s + r * s, y + dy * s); g.arc(x + o + dx * s, y + dy * s, r * s, 0, 7); }
          g.fill();
          g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x + o - 30 * s, y + 4 * s, 150 * s, 26 * s);
          g.fillStyle = 'rgba(150,170,200,.18)'; g.fillRect(x + o - 30 * s, y + 22 * s, 150 * s, 8 * s);
        });
      }
      if (kind === 'skyline') return;
      // Quelques oiseaux en « v ».
      g.strokeStyle = 'rgba(70,80,100,.55)'; g.lineWidth = 3;
      for (let i = 0; i < 9; i++) { const x = k.rnd() * W, y = 120 + k.rnd() * 160; g.beginPath(); g.moveTo(x - 10, y - 5); g.quadraticCurveTo(x - 4, y - 8, x, y); g.quadraticCurveTo(x + 4, y - 8, x + 10, y - 5); g.stroke(); }
    });
  }

  // ---------- Lointain : le monde géant autour du jouet ----------
  function far(kind, night, seed) {
    return paint((g) => {
      const k = kit(g, seed), base = 500;
      if (kind === 'cuisine') {
        // Mur carrelé, placards hauts, fenêtres avec rideaux, étagère à casseroles.
        g.fillStyle = k.vgrad(170, base, ['#f2e3cb', '#e6d2b2']); g.fillRect(0, 170, W, base - 170);
        g.strokeStyle = 'rgba(160,130,95,.35)'; g.lineWidth = 2;
        for (let y = 180; y < base; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        for (let x = 0; x < W; x += 34) { g.beginPath(); g.moveTo(x, 170); g.lineTo(x, base); g.stroke(); }
        for (let x = 40; x < W; x += 512) {
          k.rr(x, 60, 300, 120, 10, '#b98b5e'); k.rr(x + 8, 68, 138, 104, 6, '#c99d6f'); k.rr(x + 154, 68, 138, 104, 6, '#c99d6f');
          k.circ(x + 136, 120, 5, '#f4d9a8'); k.circ(x + 164, 120, 5, '#f4d9a8');
          // fenêtre : ciel, croisillon, rideaux à carreaux
          const wx = x + 330, wy = 200;
          k.rr(wx, wy, 150, 170, 6, '#ffffff'); g.fillStyle = k.vgrad(wy, wy + 160, ['#9fd3f5', '#d8efff']); g.fillRect(wx + 8, wy + 8, 134, 154);
          k.circ(wx + 40, wy + 120, 26, '#7fbf6a'); k.circ(wx + 100, wy + 130, 34, '#6aae58');
          g.fillStyle = '#ffffff'; g.fillRect(wx + 72, wy + 8, 6, 154); g.fillRect(wx + 8, wy + 80, 134, 6);
          for (const cx of [wx - 18, wx + 132]) { k.rr(cx, wy - 10, 36, 196, 12, '#e8564a'); g.fillStyle = 'rgba(255,255,255,.45)'; for (let yy = wy - 6; yy < wy + 180; yy += 20) g.fillRect(cx + 4, yy, 28, 8); }
          // étagère et casseroles suspendues
          g.fillStyle = '#8d6440'; g.fillRect(x + 30, 260, 260, 10);
          for (let i = 0; i < 4; i++) { const px = x + 60 + i * 62, r = 18 + (i % 2) * 8; g.fillStyle = '#5b5f69'; g.fillRect(px - 1, 270, 3, 18); k.circ(px, 288 + r, r, ['#3f8fe0', '#d8483d', '#f2b632', '#48b58a'][(i + x) % 4]); }
          // horloge
          k.circ(x + 440, 110, 34, '#ffffff'); g.strokeStyle = '#5a3d26'; g.lineWidth = 5; g.beginPath(); g.arc(x + 440, 110, 34, 0, 7); g.stroke();
          g.lineWidth = 4; g.beginPath(); g.moveTo(x + 440, 110); g.lineTo(x + 440, 86); g.moveTo(x + 440, 110); g.lineTo(x + 458, 116); g.stroke();
        }
        g.fillStyle = '#c9a77f'; g.fillRect(0, base - 18, W, 18);   // dosseret du plan de travail
        if (night) nightOver(g, () => { for (let x = 40; x < W; x += 512) { g.fillStyle = 'rgba(40,60,140,.9)'; g.fillRect(x + 338, 208, 134, 154); k.circ(x + 380, 250, 14, 'rgba(255,248,210,.9)'); } });
        return;
      }
      if (kind === 'dunes') {
        // Mer, voiliers, phare et île au loin.
        g.fillStyle = k.vgrad(330, base, ['#5fb4dc', '#2f86c0']); g.fillRect(0, 330, W, base - 330);
        g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 70; i++) g.fillRect(k.rnd() * W, 340 + k.rnd() * 150, 20 + k.rnd() * 30, 3);
        for (const [ix, iw] of [[300, 260], [1300, 340]]) { g.fillStyle = '#7fb27a'; g.beginPath(); g.ellipse(ix, 334, iw / 2, 38, 0, Math.PI, 0); g.fill(); }
        g.fillStyle = '#ffffff'; g.fillRect(1310, 210, 26, 124); g.fillStyle = '#e04b3b'; for (let y = 230; y < 330; y += 36) g.fillRect(1310, y, 26, 16);
        g.fillStyle = '#333a46'; g.fillRect(1304, 196, 38, 16); k.circ(1323, 192, 10, '#ffe27a');
        for (let i = 0; i < 6; i++) {
          const x = 120 + i * 330 + k.rnd() * 120, y = 360 + k.rnd() * 70, s = 0.7 + (y - 360) / 140;
          g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x, y - 70 * s); g.lineTo(x, y - 6 * s); g.lineTo(x + 40 * s, y - 6 * s); g.closePath(); g.fill();
          g.fillStyle = ['#e04b3b', '#f2b632', '#3f8fe0'][i % 3]; g.beginPath(); g.moveTo(x - 3, y - 60 * s); g.lineTo(x - 3, y - 6 * s); g.lineTo(x - 30 * s, y - 6 * s); g.closePath(); g.fill();
          k.rr(x - 34 * s, y - 4 * s, 80 * s, 14 * s, 6 * s, '#8a5a34');
        }
        if (night) nightOver(g, () => { k.circ(1323, 192, 16, 'rgba(255,240,170,1)'); });
        return;
      }
      if (kind === 'sousbois') {
        // Troncs géants dans une brume verte ; les plus proches sont plus sombres, avec mousse et racines.
        g.fillStyle = k.vgrad(250, base, ['rgba(170,200,140,0)', 'rgba(150,185,120,.9)', '#6f9a52']); g.fillRect(0, 250, W, base - 250);
        const trunk = (x, w, col, moss) => {
          g.fillStyle = col; g.fillRect(x, 0, w, base - 6);
          g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x + w * 0.7, 0, w * 0.3, base - 6);
          g.strokeStyle = 'rgba(20,12,6,.25)'; g.lineWidth = 2; for (let j = 1; j < 5; j++) { const xx = x + (j * w) / 5; g.beginPath(); g.moveTo(xx, 0); g.bezierCurveTo(xx + 4, 150, xx - 4, 300, xx, base); g.stroke(); }
          g.fillStyle = col; g.beginPath(); g.ellipse(x + w / 2, base - 6, w * 0.9, 14, 0, Math.PI, 0); g.fill();   // pied évasé
          if (moss) for (let j = 0; j < 3; j++) { g.fillStyle = '#7fae4a'; g.beginPath(); g.ellipse(x + k.rnd() * w, 150 + k.rnd() * 300, 8 + k.rnd() * 8, 5, 0, 0, 7); g.fill(); }
        };
        for (let x = 0; x < W; x += 60 + k.rnd() * 70) trunk(x, 18 + k.rnd() * 18, '#8a9a76', false);
        g.fillStyle = 'rgba(190,215,165,.45)'; g.fillRect(0, 0, W, base);
        for (let x = 30; x < W; x += 150 + k.rnd() * 140) trunk(x, 34 + k.rnd() * 30, ['#5e5040', '#6a5a46', '#544636'][Math.floor(k.rnd() * 3)], true);
        k.wave(base - 18, [[6, 13, seed]], '#5b8a3e');
        if (night) nightOver(g);
        return;
      }
      if (kind === 'monts') {
        // Chaîne de montagnes enneigées sur deux plans, avec glaciers bleus.
        for (const [lay, col, top, n] of [[0, '#a8c3e0', 140, 7], [1, '#7f9fc4', 210, 10]]) {
          for (let i = 0; i < n; i++) {
            const x = (i + k.rnd() * 0.6) * (W / n), h = base - top - k.rnd() * 60, b = h * (0.8 + k.rnd() * 0.5), tp = base - h;
            k.thrice((o) => {
              g.fillStyle = col; g.beginPath(); g.moveTo(x + o - b, base); g.lineTo(x + o - b * 0.15, tp + 8); g.quadraticCurveTo(x + o, tp - 6, x + o + b * 0.15, tp + 8); g.lineTo(x + o + b, base); g.fill();
              g.fillStyle = lay ? '#f6fbff' : '#eaf3ff'; g.beginPath(); g.moveTo(x + o - b * 0.38, tp + h * 0.36); g.lineTo(x + o - b * 0.15, tp + 8); g.quadraticCurveTo(x + o, tp - 6, x + o + b * 0.15, tp + 8);
              g.lineTo(x + o + b * 0.38, tp + h * 0.36); g.lineTo(x + o + b * 0.2, tp + h * 0.28); g.lineTo(x + o + b * 0.05, tp + h * 0.4); g.lineTo(x + o - b * 0.14, tp + h * 0.27); g.closePath(); g.fill();
            });
          }
        }
        k.wave(base - 20, [[6, 9, seed]], '#eef6ff');
        if (night) nightOver(g);
        return;
      }
      if (kind === 'skyline') {
        // Gratte-ciel lointains en dégradé, grande roue et antennes clignotantes.
        for (let x = 0; x < W; x += 30 + k.rnd() * 50) {
          const w = 40 + k.rnd() * 60, h = 140 + k.rnd() * 220, y = base - h, col = ['#2a2f63', '#323a74', '#262a58'][Math.floor(k.rnd() * 3)];
          g.fillStyle = col; g.fillRect(x, y, w, h);
          if (k.rnd() < 0.3) { g.fillRect(x + w / 2 - 2, y - 40, 4, 40); k.circ(x + w / 2, y - 42, 5, '#ff4b5c'); }
          for (let wy = y + 10; wy < base - 8; wy += 14) for (let wx = x + 6; wx < x + w - 8; wx += 11) if (k.rnd() < 0.45) { g.fillStyle = k.rnd() < 0.8 ? 'rgba(255,214,130,.85)' : 'rgba(140,220,255,.85)'; g.fillRect(wx, wy, 5, 7); }
        }
        const fx = 1400, fy = 250;
        g.strokeStyle = 'rgba(255,110,190,.9)'; g.lineWidth = 4; g.beginPath(); g.arc(fx, fy, 120, 0, 7); g.stroke();
        for (let a = 0; a < 12; a++) { const an = (a * Math.PI) / 6; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(an) * 120, fy + Math.sin(an) * 120); g.stroke(); k.circ(fx + Math.cos(an) * 120, fy + Math.sin(an) * 120, 8, ['#ffd25e', '#5ee0ff', '#ff6fa8'][a % 3]); }
        g.fillStyle = '#3a3f7a'; g.beginPath(); g.moveTo(fx - 70, base); g.lineTo(fx, fy); g.lineTo(fx + 70, base); g.fill();
        return;
      }
      if (kind === 'bain') {
        // Mur carrelé bleu et blanc, miroir, lavabo, baignoire géante avec rideau de douche à poissons.
        g.fillStyle = '#5f97ab'; g.fillRect(0, 140, W, base - 140);
        for (let y = 140; y < base; y += 40) for (let x = 0; x < W; x += 40) { const n = (x / 40 + y / 40) % 7; g.fillStyle = n === 0 ? '#2f8fb8' : (x / 40 + y / 40) % 2 ? '#a9d8e8' : '#c4e6f0'; g.fillRect(x + 2, y + 2, 36, 36); }
        g.fillStyle = '#5aa9c9'; g.fillRect(0, 300, W, 14);
        for (let x = 30; x < W; x += 680) {
          k.rr(x, 160, 170, 120, 14, '#cfd8de'); g.fillStyle = k.vgrad(168, 272, ['#d8f1fb', '#a9d6ea']); k.rr(x + 8, 168, 154, 104, 10); g.fill();
          g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(x + 30, 260); g.lineTo(x + 70, 178); g.lineTo(x + 90, 178); g.lineTo(x + 50, 260); g.fill();   // reflet du miroir
          k.rr(x + 20, 330, 130, 34, 16, '#ffffff'); g.fillStyle = '#c9d2d8'; g.fillRect(x + 76, 364, 18, base - 364);   // lavabo
          g.fillStyle = '#b8c2c9'; g.fillRect(x + 80, 312, 10, 20); k.circ(x + 85, 312, 8, '#dfe5ea');
          k.rr(x + 260, 300, 380, base - 300, 40, '#ffffff'); g.fillStyle = 'rgba(120,170,200,.25)'; g.fillRect(x + 280, 320, 340, 10);   // baignoire
          g.fillStyle = '#d8dee3'; g.fillRect(x + 300, 120, 300, 8);
          for (let i = 0; i < 12; i++) { const cx = x + 300 + i * 25; k.rr(cx, 128, 24, 172, 6, i % 2 ? '#ffd23f' : '#ffe680'); }
          for (let i = 0; i < 6; i++) { const fx = x + 316 + i * 48, fy = 170 + (i % 3) * 40; g.fillStyle = ['#ff7a5c', '#3f8fe0', '#48b58a'][i % 3]; g.beginPath(); g.ellipse(fx, fy, 14, 8, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(fx + 12, fy); g.lineTo(fx + 22, fy - 7); g.lineTo(fx + 22, fy + 7); g.fill(); }
        }
        if (night) nightOver(g);
        return;
      }
      if (kind === 'grenier') {
        // Vieux meubles empilés dans la pénombre : armoire, cheval à bascule, piles de cartons, draps sur les chaises.
        g.fillStyle = k.vgrad(150, base, ['#8a6a4a', '#6a4f36']); g.fillRect(0, 150, W, base - 150);
        for (let x = 0; x < W; x += 64) { g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(x, 150, 3, base - 150); }
        for (let x = 20; x < W; x += 512) {
          k.rr(x, 200, 140, base - 200, 8, '#5a3c24'); k.rr(x + 10, 214, 56, 200, 4, '#6b4a2e'); k.rr(x + 74, 214, 56, 200, 4, '#6b4a2e'); k.circ(x + 62, 320, 5, '#d4a537'); k.circ(x + 78, 320, 5, '#d4a537');   // armoire
          let y = base; for (let i = 0; i < 4; i++) { const w = 110 - i * 12; k.rr(x + 170 + i * 6, y - 60, w, 60, 3, ['#c9a06a', '#b88c58', '#d8b47e'][i % 3]); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 170 + i * 6 + w / 2 - 6, y - 60, 12, 60); y -= 60; }   // cartons
          g.fillStyle = '#f1ece2'; g.beginPath(); g.moveTo(x + 320, base); g.quadraticCurveTo(x + 330, 300, x + 380, 290); g.quadraticCurveTo(x + 440, 300, x + 450, base); g.fill();   // drap sur une chaise
          g.strokeStyle = '#8a3b2a'; g.lineWidth = 8; g.beginPath(); g.arc(x + 440, base - 10, 70, Math.PI * 1.1, Math.PI * 1.9); g.stroke();   // cheval à bascule
          k.rr(x + 400, 360, 90, 50, 22, '#d9c4a0'); k.circ(x + 492, 352, 22, '#d9c4a0'); g.fillStyle = '#5a3c24'; g.fillRect(x + 486, 330, 26, 10);
        }
        if (night) nightOver(g);
        return;
      }
      // chambre : papier peint à rayures, fenêtre au ciel étoilé ou bleu, affiches, étagère de livres
      g.fillStyle = '#f3dbe8'; g.fillRect(0, 120, W, base - 120);
      g.fillStyle = 'rgba(255,255,255,.55)'; for (let x = 0; x < W; x += 48) g.fillRect(x, 120, 20, base - 120);
      g.fillStyle = 'rgba(200,150,190,.35)'; for (let x = 24; x < W; x += 96) for (let y = 150; y < base - 30; y += 60) { g.beginPath(); g.arc(x + 10, y, 6, 0, 7); g.fill(); }
      for (let x = 60; x < W; x += 680) {
        k.rr(x, 170, 190, 200, 8, '#ffffff'); g.fillStyle = k.vgrad(178, 362, ['#a7d8ff', '#e3f3ff']); g.fillRect(x + 10, 180, 170, 180);
        k.circ(x + 130, 230, 22, '#ffe27a'); g.fillStyle = '#ffffff'; g.fillRect(x + 92, 180, 6, 180); g.fillRect(x + 10, 266, 170, 6);
        k.rr(x - 30, 150, 50, 240, 16, '#8bc6ff'); k.rr(x + 170, 150, 50, 240, 16, '#8bc6ff');
        k.rr(x + 300, 180, 110, 150, 4, '#ffd36a'); k.circ(x + 355, 240, 32, '#ff7a5c'); g.fillStyle = '#ffffff'; g.fillRect(x + 320, 292, 70, 10);   // affiche
        g.fillStyle = '#b07a52'; g.fillRect(x + 450, 300, 180, 12);
        for (let i = 0; i < 9; i++) { const bh = 40 + k.rnd() * 30; g.fillStyle = ['#e14b3a', '#2a70c9', '#48b58a', '#f2b632', '#9b6ad6'][i % 5]; g.fillRect(x + 456 + i * 19, 300 - bh, 16, bh); }
      }
      g.fillStyle = '#d9b7cc'; g.fillRect(0, base - 26, W, 26);   // plinthe
      if (night) nightOver(g, () => { for (let x = 60; x < W; x += 680) { g.fillStyle = '#1b2252'; g.fillRect(x + 10, 180, 170, 180); for (let i = 0; i < 12; i++) k.circ(x + 20 + k.rnd() * 150, 190 + k.rnd() * 160, 1.6, '#fff8d8'); } });
    });
  }

  // ---------- Second plan : objets du monde, en couleurs, posés sur le sol ----------
  function mid(kind, night, seed) {
    return paint((g) => {
      const k = kit(g, seed + 11), base = 500;
      const shade = (x, y, w, h) => { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + w * 0.72, y, w * 0.28, h); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + w * 0.1, y + 6, w * 0.1, h - 12); };
      if (kind === 'cuisine') {
        for (let x = 10; x < W; ) {
          const t = Math.floor(k.rnd() * 6);
          if (t === 0) { const w = 70, h = 110; k.rr(x, base - h, w, h, 12, 'rgba(210,235,240,.85)'); k.rr(x + 6, base - h * 0.75, w - 12, h * 0.72, 8, ['#e14b3a', '#f2b632', '#8d1f3f'][Math.floor(k.rnd() * 3)]); k.rr(x - 3, base - h - 14, w + 6, 18, 6, ['#d8483d', '#3f8fe0', '#48b58a'][Math.floor(k.rnd() * 3)]); k.rr(x + 14, base - h * 0.55, w - 28, 26, 4, '#fff7e6'); x += w + 30; }
          else if (t === 1) { const w = 34, h = 190; k.rr(x, base - h + 50, w, h - 50, 10, ['#3c8a4a', '#c99528', '#6db3d6'][Math.floor(k.rnd() * 3)]); g.fillRect(x + 11, base - h, 12, 56); k.rr(x + 9, base - h - 8, 16, 12, 3, '#d8483d'); k.rr(x + 4, base - 110, w - 8, 44, 4, '#fff7e6'); shade(x, base - h + 50, w, h - 50); x += w + 34; }
          else if (t === 2) { const w = 140, h = 100; k.rr(x, base - h, w, h, 18, '#c8cdd6'); shade(x, base - h, w, h); g.fillStyle = '#2e3138'; g.fillRect(x + 22, base - h - 6, 40, 10); g.fillRect(x + 78, base - h - 6, 40, 10); k.rr(x + 30, base - 46, 22, 10, 4, '#2e3138'); x += w + 40; }   // grille-pain
          else if (t === 3) { const w = 90, h = 170; k.rr(x, base - h, w, h, 6, ['#e88a1e', '#2a70c9', '#e14b3a'][Math.floor(k.rnd() * 3)]); k.circ(x + 45, base - h + 70, 28, '#ffe27a'); k.rr(x + 10, base - 50, 70, 30, 4, '#ffffff'); shade(x, base - h, w, h); x += w + 36; }   // boîte de céréales
          else if (t === 4) { g.fillStyle = '#d8483d'; g.beginPath(); g.ellipse(x + 70, base, 70, 90, 0, Math.PI, 0); g.fill(); g.fillStyle = '#2e3138'; g.fillRect(x + 50, base - 104, 40, 12); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(x + 40, base - 50, 12, 28, 0.3, 0, 7); g.fill(); x += 180; }   // bouilloire
          else { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + 80, base - 20, 80, 30, 0, 0, Math.PI); g.fill(); for (const [dx, dy, r, c] of [[40, -40, 26, '#d8322e'], [84, -52, 30, '#f2b632'], [120, -36, 24, '#8cc63f'], [70, -24, 22, '#ff8a3c']]) k.circ(x + dx, base + dy, r, c); x += 190; }   // corbeille de fruits
        }
        if (night) nightOver(g);
        return;
      }
      if (kind === 'dunes') {
        k.wave(base - 30, [[14, 3, seed], [6, 9, seed]], '#ecd29a');
        for (let x = 20; x < W; ) {
          const t = Math.floor(k.rnd() * 3);
          if (t === 0) { g.fillStyle = '#ffffff'; g.fillRect(x + 58, base - 170, 5, 150); const cols = ['#e04b3b', '#ffffff']; for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % 2]; g.beginPath(); g.moveTo(x + 60, base - 200); g.lineTo(x + i * 20, base - 160); g.lineTo(x + i * 20 + 20, base - 160); g.fill(); } x += 170; }   // parasol
          else if (t === 1) { const c = ['#3f8fe0', '#f2b632', '#48b58a', '#e86aa0'][Math.floor(k.rnd() * 4)]; k.rr(x, base - 120, 80, 100, 4, '#ffffff'); for (let i = 0; i < 4; i++) { g.fillStyle = c; g.fillRect(x + i * 20, base - 120, 10, 100); } g.fillStyle = '#c4473b'; g.beginPath(); g.moveTo(x - 10, base - 118); g.lineTo(x + 40, base - 160); g.lineTo(x + 90, base - 118); g.fill(); k.rr(x + 28, base - 70, 24, 50, 3, '#6b4a2e'); x += 130; }   // cabine de plage
          else { g.strokeStyle = '#8a5a34'; g.lineWidth = 10; g.beginPath(); g.moveTo(x + 40, base - 20); g.quadraticCurveTo(x + 30, base - 120, x + 60, base - 200); g.stroke(); for (let a = 0; a < 6; a++) { const an = -Math.PI + a * 0.55; g.fillStyle = '#3f9a4f'; g.beginPath(); g.ellipse(x + 60 + Math.cos(an) * 40, base - 200 + Math.sin(an) * 18 + 16, 46, 12, an + Math.PI / 2 + 1.4, 0, 7); g.fill(); } x += 150; }   // palmier
        }
        if (night) nightOver(g);
        return;
      }
      if (kind === 'sousbois') {
        // Fougères, champignons géants, souches moussues et pieds de troncs.
        k.wave(base - 20, [[8, 9, seed]], '#4f7f37');
        for (let x = 0; x < W; ) {
          const t = Math.floor(k.rnd() * 4);
          if (t === 0) { for (let a = -3; a <= 3; a++) { const len = 90 - Math.abs(a) * 10; g.strokeStyle = '#3f7a32'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 70, base); g.quadraticCurveTo(x + 70 + a * 16, base - len, x + 70 + a * 30, base - len * 0.7); g.stroke(); for (let q = 1; q < 8; q++) { const u = q / 8, px = x + 70 + a * 30 * u, py = base - len * Math.sin(u * 2.4) * 0.95; g.fillStyle = ['#4f9a3e', '#5aa848', '#468a36'][q % 3]; g.beginPath(); g.ellipse(px, py, 10 * (1 - u * 0.5), 3.5, a * 0.35 + 0.5, 0, 7); g.fill(); } } x += 150; }   // fougère
          else if (t === 1) { const c = ['#d8382e', '#e0782e', '#c9a46a'][Math.floor(k.rnd() * 3)]; k.rr(x + 34, base - 90, 28, 90, 10, '#f4ead6'); g.fillStyle = c; g.beginPath(); g.ellipse(x + 48, base - 90, 62, 42, 0, Math.PI, 0); g.fill(); if (c !== '#c9a46a') for (let i = 0; i < 5; i++) k.circ(x + 14 + i * 17, base - 104 - (i % 2) * 16, 6, '#ffffff'); x += 140; }   // champignon
          else if (t === 2) { k.rr(x, base - 70, 120, 70, 10, '#7a5233'); g.fillStyle = '#d9b07a'; g.beginPath(); g.ellipse(x + 60, base - 70, 60, 14, 0, 0, 7); g.fill(); g.fillStyle = '#7fae4a'; g.beginPath(); g.ellipse(x + 30, base - 40, 22, 10, 0, 0, 7); g.fill(); x += 160; }   // souche
          else { g.fillStyle = '#4a3a2a'; g.fillRect(x + 20, 0, 80, base); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 76, 0, 24, base); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x + 60, base - 40); g.quadraticCurveTo(x + 60 + d * 60, base - 16, x + 60 + d * 90, base); g.lineTo(x + 60 + d * 30, base); g.fill(); } g.fillStyle = '#7fae4a'; g.beginPath(); g.ellipse(x + 40, base - 140, 16, 9, 0, 0, 7); g.fill(); x += 170; }   // pied de grand arbre
        }
        if (night) nightOver(g);
        return;
      }
      if (kind === 'monts') {
        k.wave(base - 20, [[6, 9, seed]], '#f4f9ff');
        for (let x = 0; x < W; ) {
          const t = Math.floor(k.rnd() * 4);
          if (t < 2) { const h = 120 + k.rnd() * 90; g.fillStyle = '#6b4a2e'; g.fillRect(x + 26, base - 24, 10, 24); for (let i = 0; i < 4; i++) { const w2 = 60 - i * 12, y2 = base - 20 - i * h / 4.5; g.fillStyle = '#3f7a62'; g.beginPath(); g.moveTo(x + 31 - w2 / 2 - 4, y2); g.lineTo(x + 31, y2 - h / 3); g.lineTo(x + 31 + w2 / 2 + 4, y2); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x + 31 - w2 / 4, y2 - h / 6); g.lineTo(x + 31, y2 - h / 3); g.lineTo(x + 31 + w2 / 4, y2 - h / 6); g.fill(); } x += 80; }   // sapin enneigé
          else if (t === 2) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + 70, base, 70, 66, 0, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(140,170,210,.6)'; g.lineWidth = 2; for (let y = base - 20; y > base - 66; y -= 16) { g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + 134, y); g.stroke(); } k.rr(x + 52, base - 34, 36, 34, 14, '#5a7aa0'); x += 170; }   // igloo
          else { const c = ['#ff6fa8', '#ffb23c', '#7fd0ff'][Math.floor(k.rnd() * 3)]; k.rr(x + 10, base - 150, 50, 110, 22, c); g.fillStyle = '#e8d4a8'; g.fillRect(x + 30, base - 44, 10, 44); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 18, base - 140, 8, 80); x += 90; }   // glace à l'eau
        }
        if (night) nightOver(g);
        return;
      }
      if (kind === 'skyline') {
        for (let x = 0; x < W; ) {
          const w = 70 + k.rnd() * 90, h = 120 + k.rnd() * 160, y = base - h, col = ['#3d3570', '#45407f', '#2f3a6e'][Math.floor(k.rnd() * 3)];
          g.fillStyle = col; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + w * 0.75, y, w * 0.25, h);
          for (let wy = y + 12; wy < base - 10; wy += 18) for (let wx = x + 8; wx < x + w - 12; wx += 15) if (k.rnd() < 0.55) { g.fillStyle = 'rgba(255,214,130,.95)'; g.fillRect(wx, wy, 8, 10); }
          if (k.rnd() < 0.45) { const nc = ['#ff4fa3', '#4fe3ff', '#ffe14f'][Math.floor(k.rnd() * 3)]; k.rr(x + 10, y + 14, w - 20, 26, 6, nc); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + 18, y + 24, w - 36, 6); }   // enseigne lumineuse
          if (k.rnd() < 0.25) { g.fillStyle = '#5a5f8a'; g.fillRect(x + w / 2 - 18, y - 40, 36, 30); g.fillRect(x + w / 2 - 14, y - 10, 4, 10); g.fillRect(x + w / 2 + 10, y - 10, 4, 10); }   // château d'eau
          x += w + 10 + k.rnd() * 30;
        }
        return;
      }
      if (kind === 'bain') {                                       // flacons, gobelets à brosses à dents, canards, éponges
        for (let x = 10; x < W; ) {
          const t = Math.floor(k.rnd() * 4), c = ['#ff8fb5', '#7fd0ff', '#8be0b0', '#ffd23f', '#b48ef0'][Math.floor(k.rnd() * 5)];
          if (t === 0) { k.rr(x, base - 150, 60, 150, 18, c); k.rr(x + 18, base - 176, 24, 30, 6, '#ffffff'); k.rr(x + 8, base - 110, 44, 46, 6, 'rgba(255,255,255,.75)'); shade(x, base - 150, 60, 150); x += 100; }
          else if (t === 1) { k.rr(x, base - 90, 56, 90, 10, 'rgba(200,235,250,.9)'); for (let i = 0; i < 2; i++) { g.fillStyle = ['#3f8fe0', '#e14b3a'][i]; g.fillRect(x + 16 + i * 18, base - 160, 8, 90); g.fillStyle = '#ffffff'; g.fillRect(x + 12 + i * 18, base - 172, 16, 18); } x += 96; }
          else if (t === 2) { g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(x + 50, base - 34, 50, 34, 0, 0, 7); g.fill(); k.circ(x + 84, base - 76, 26, '#ffd23f'); g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(x + 106, base - 80); g.lineTo(x + 128, base - 72); g.lineTo(x + 106, base - 66); g.fill(); k.circ(x + 90, base - 82, 4, '#1b1d24'); x += 150; }
          else { k.rr(x, base - 46, 110, 46, 8, '#ffd23f'); k.rr(x, base - 60, 110, 18, 6, '#48b58a'); for (let i = 0; i < 6; i++) k.circ(x + 14 + i * 16, base - 22 - (i % 2) * 10, 4, 'rgba(160,110,0,.4)'); x += 140; }
        }
        if (night) nightOver(g);
        return;
      }
      if (kind === 'grenier') {                                    // malles, valises, lampe, globe, pile de livres
        for (let x = 10; x < W; ) {
          const t = Math.floor(k.rnd() * 4);
          if (t === 0) { k.rr(x, base - 90, 150, 90, 8, '#7a4a2a'); g.fillStyle = '#5a3420'; g.beginPath(); g.ellipse(x + 75, base - 90, 75, 24, 0, Math.PI, 0); g.fill(); g.fillStyle = '#c9a06a'; g.fillRect(x + 20, base - 112, 10, 112); g.fillRect(x + 120, base - 112, 10, 112); k.rr(x + 64, base - 70, 22, 18, 3, '#d4a537'); x += 190; }
          else if (t === 1) { const c = ['#2f62a8', '#a83a2f', '#3c7a4a'][Math.floor(k.rnd() * 3)]; let y = base; for (let i = 0; i < 3; i++) { k.rr(x + i * 6, y - 40, 120 - i * 12, 40, 6, c); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + i * 6 + 20, y - 30, 20, 20); y -= 42; } x += 150; }
          else if (t === 2) { g.fillStyle = '#5a3c24'; g.fillRect(x + 40, base - 150, 8, 150); k.rr(x + 20, base - 12, 48, 12, 4, '#5a3c24'); g.fillStyle = '#e8c87a'; g.beginPath(); g.moveTo(x + 10, base - 150); g.lineTo(x + 30, base - 200); g.lineTo(x + 58, base - 200); g.lineTo(x + 78, base - 150); g.fill(); g.fillStyle = 'rgba(255,230,150,.35)'; g.beginPath(); g.moveTo(x + 14, base - 150); g.lineTo(x - 20, base); g.lineTo(x + 108, base); g.lineTo(x + 74, base - 150); g.fill(); x += 120; }
          else { k.circ(x + 50, base - 90, 46, '#3f8fe0'); g.fillStyle = '#48b58a'; g.beginPath(); g.ellipse(x + 40, base - 100, 20, 28, 0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 70, base - 74, 14, 18, -0.3, 0, 7); g.fill(); g.strokeStyle = '#d4a537'; g.lineWidth = 5; g.beginPath(); g.arc(x + 50, base - 90, 54, 1.2, 5.0); g.stroke(); g.fillStyle = '#5a3c24'; g.fillRect(x + 44, base - 36, 12, 36); x += 130; }
        }
        if (night) nightOver(g);
        return;
      }
      // chambre : château fort, fusée, tour de cubes, piles de livres, petit train
      for (let x = 10; x < W; ) {
        const t = Math.floor(k.rnd() * 5);
        if (t === 0) { const c = '#c9b5e8'; g.fillStyle = c; g.fillRect(x, base - 110, 160, 110); for (const tx of [0, 120]) { g.fillRect(x + tx, base - 170, 40, 170); g.fillStyle = '#e14b3a'; g.beginPath(); g.moveTo(x + tx - 4, base - 170); g.lineTo(x + tx + 20, base - 214); g.lineTo(x + tx + 44, base - 170); g.fill(); g.fillStyle = c; } for (let i = 0; i < 8; i++) g.fillRect(x + 40 + i * 10, base - 122, 6, 12); k.rr(x + 60, base - 60, 40, 60, 18, '#6b4a2e'); x += 200; }
        else if (t === 1) { k.rr(x + 20, base - 200, 50, 170, 24, '#f6f2ea'); g.fillStyle = '#e14b3a'; g.beginPath(); g.moveTo(x + 20, base - 170); g.quadraticCurveTo(x + 45, base - 250, x + 70, base - 170); g.fill(); k.circ(x + 45, base - 130, 13, '#7fd0ff'); g.fillStyle = '#e14b3a'; g.beginPath(); g.moveTo(x + 20, base - 70); g.lineTo(x, base - 20); g.lineTo(x + 20, base - 30); g.fill(); g.beginPath(); g.moveTo(x + 70, base - 70); g.lineTo(x + 90, base - 20); g.lineTo(x + 70, base - 30); g.fill(); x += 130; }   // fusée
        else if (t === 2) { let y = base; for (let i = 0; i < 4; i++) { const s = 64 - i * 6; k.rr(x + i * 4, y - s, s, s, 6, ['#e14b3a', '#2a70c9', '#f2b632', '#48b58a'][(i + x) % 4]); k.rr(x + i * 4 + 12, y - s + 12, s - 24, s - 24, 4, 'rgba(255,255,255,.45)'); y -= s; } x += 110; }   // tour de cubes
        else if (t === 3) { let y = base; for (let i = 0; i < 5; i++) { const w = 110 - (i % 2) * 14, h = 18 + k.rnd() * 8; k.rr(x + (i % 2) * 7, y - h, w, h, 3, ['#9b6ad6', '#48b58a', '#e88a1e', '#2a70c9', '#e14b3a'][i]); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(x + (i % 2) * 7 + w - 10, y - h + 3, 6, h - 6); y -= h; } x += 150; }   // livres
        else { for (let i = 0; i < 3; i++) { const c = ['#e14b3a', '#2a70c9', '#f2b632'][i]; k.rr(x + i * 70, base - 70, 62, 50, 6, c); k.circ(x + i * 70 + 14, base - 16, 12, '#333a46'); k.circ(x + i * 70 + 48, base - 16, 12, '#333a46'); } g.fillStyle = '#e14b3a'; g.fillRect(x + 14, base - 110, 26, 40); x += 240; }   // petit train
      }
      if (night) nightOver(g);
    });
  }

  // Pose les trois couronnes, hors brouillard : il délavait tout ; une brume peinte, plus forte au loin, garde la profondeur.
  MB.backdrop = function (scene, mood, track, horizon) {
    const kind = mood.hills ? mood.hills[0] : 'cuisine', night = !!mood.night, seed = track.def.seed || 1;
    const skyCol = '#' + new T.Color(mood.sky).getHexString();
    haze = mood.rain ? ['#6d7886', 0.55] : null; const tSky = sky(kind, night, seed);   // sous la pluie, nuages gris
    haze = [skyCol, night ? 0.12 : 0.3]; const tFar = far(kind, night, seed);
    haze = [skyCol, night ? 0.05 : 0.12]; const tMid = mid(kind, night, seed);
    haze = null;
    const rings = [
      { tex: tSky, r: horizon + 200, h: 300, y: 40, rep: 2, order: -4 },
      { tex: tFar, r: horizon + 90, h: 150, y: -4, rep: 3, order: -3 },
      { tex: tMid, r: horizon - 60, h: 80, y: -3, rep: 4, order: -2 },
    ];
    for (const o of rings) {
      o.tex.repeat.set(o.rep, 1);
      const m = new T.Mesh(new T.CylinderGeometry(o.r, o.r, o.h, 160, 1, true), new T.MeshBasicMaterial({ map: o.tex, transparent: true, side: T.BackSide, depthWrite: false, fog: false }));
      m.position.y = o.h / 2 + o.y; m.renderOrder = o.order; scene.add(m);
    }
  };
})();
