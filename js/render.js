// Rendu three.js : tout est procédural (aucun modèle externe), la qualité descend seule si le téléphone peine.
(function (MB) {
  const T = THREE;
  const CUISINE = ['bol', 'boite', 'tasse', 'salieres', 'assiette', 'grillepain', 'crepes', 'brique', 'pot', 'cubes', 'pomme', 'tartine', 'couvert', 'tasse', 'pomme', 'assiette', 'pot', 'crepes', 'couvert'];
  const PROP_REACH = 300;
  const bubV = new T.Vector3(), sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const MOODS = {
    matin: { sky: 0xffe6c4, fog: [260, 720], hemi: [0xfff4e0, 0xb98f62, 0.74], sun: [0xfff0d0, 0.42], ground: 'bois', exposure: 1, life: 'cuisine', verge: '60,32,14', hills: ['cuisine', '#d8c2a2', '#b48e68'] },
    midi: { sky: 0xcfe8fb, fog: [280, 760], hemi: [0xffffff, 0xc9a9a0, 0.76], sun: [0xffffff, 0.4], ground: 'vichy', exposure: 1, life: 'cuisine', verge: '90,40,40', hills: ['cuisine', '#b9cfe2', '#c99e96'] },
    minuit: { sky: 0x141b3c, fog: [170, 560], hemi: [0x8ea4ff, 0x2a2340, 0.72], sun: [0xbfd0ff, 0.5], ground: 'nuit', exposure: 1, night: true, life: 'cuisine', verge: '0,0,0', hills: ['cuisine', '#2a3466', '#1c2350'] },
    sable: { sky: 0xffd9a0, fog: [260, 740], hemi: [0xfff3d2, 0xc99a5c, 0.8], sun: [0xfff0c8, 0.46], ground: 'sable', road: '#8a6a44', kerb: ['#2f8fd8', '#fff6e0'], track: '#c9a56c', life: 'plage', verge: '150,110,60', hills: ['dunes', '#a9c9d8', '#e0bf84'],
      back: ['#8ed0f2', '#ffe8bd', '#f1cd8e'], glow: ['rgba(255,255,255,.9)', 'rgba(70,160,200,.5)'], props: ['seau', 'chateau', 'parasol', 'ballon', 'canard', 'pelle', 'etoile', 'coquille', 'seau', 'parasol', 'coquille', 'ballon', 'etoile', 'caillou'] },
    neige: { sky: 0xdcecfa, fog: [220, 660], hemi: [0xf4faff, 0xa8c4e0, 0.84], sun: [0xeaf4ff, 0.4], ground: 'neige', road: '#7a93ad', kerb: ['#3f8fe0', '#ffffff'], track: '#d6e6f2', snow: true, life: 'neige', verge: '255,255,255', hills: ['monts', '#c6dbef', '#4f7e6c'],
      back: ['#b7d5ee', '#e8f3fc', '#cfe2f2'], glow: ['rgba(255,255,255,.95)', 'rgba(150,190,230,.5)'], props: ['sapin', 'bonhomme', 'igloo', 'glacon', 'luge', 'batonnet', 'sapin', 'pot', 'glacon', 'bonhomme', 'luge'] },
    foret: { sky: 0xcfe6b8, fog: [200, 620], hemi: [0xf4ffe0, 0x6c8a4a, 0.78], sun: [0xfff4cc, 0.44], ground: 'herbe', road: '#7a5a3c', kerb: ['#e0a030', '#fff4d8'], track: '#8c6c4a', life: 'foret', verge: '150,200,90', hills: ['collines', '#9fc48c', '#467636'],
      back: ['#a5d8e8', '#dcecb0', '#88ad62'], glow: ['rgba(255,250,210,.9)', 'rgba(60,110,60,.5)'], props: ['arbre', 'champignon', 'marguerites', 'souche', 'caillou', 'arbre', 'coccinelle', 'gland', 'champignon', 'marguerites', 'arbre', 'feuille'] },
    ville: { sky: 0x1b1f42, fog: [190, 600], hemi: [0xa8b0ff, 0x352c50, 0.8], sun: [0xc8d4ff, 0.5], ground: 'ville', road: '#2b2d3a', kerb: ['#ff4fa3', '#ffffff'], track: '#6a6f88', night: true, life: 'ville', verge: '120,126,150', hills: ['skyline', '#2c3163', '#1b1e40'],
      back: ['#0d1030', '#2a2358', '#4b2f6e'], glow: ['rgba(255,120,190,.5)', 'rgba(70,200,230,.4)'], props: ['immeuble', 'feu', 'immeuble', 'lampadaire', 'bus', 'immeuble', 'plot', 'feu', 'lampadaire', 'immeuble', 'bus', 'plot'] },
    chambre: { sky: 0xf6e7f2, fog: [240, 700], hemi: [0xfff6fb, 0xb8a3c9, 0.8], sun: [0xfff2e6, 0.42], ground: 'tapis', road: '#5d6a8c', kerb: ['#ffb23c', '#ffffff'], track: '#9aa6c8', life: 'chambre', verge: '60,50,90', hills: ['chambre', '#e7cfe0', '#c9a7d6'],
      back: ['#f9e6f1', '#fff4f9', '#efd7ea'], glow: ['rgba(255,255,255,.95)', 'rgba(255,200,120,.45)'], props: ['peluche', 'crayons', 'tour', 'livres', 'toupie', 'cubes', 'ballon', 'peluche', 'crayons', 'toupie', 'tour', 'livres'] },
  };

  function canvas(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    t.encoding = T.sRGBEncoding;
    return t;
  }

  function groundTexture(kind) {
    return canvas(512, 512, (g, w, h) => {
      if (kind === 'vichy') {
        g.fillStyle = '#fff6ee'; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(214,58,58,.5)';
        for (let i = 0; i < 4; i++) { g.fillRect(i * 128, 0, 64, h); g.fillRect(0, i * 128, w, 64); }
        return;
      }
      if (kind === 'tapis') {                                       // tapis de chambre : laine bleue, pois de couleur
        g.fillStyle = '#8fb8de'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 7000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        const cols = ['#ffd23f', '#ff8fb5', '#ffffff', '#7fd6a8'];
        for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { g.fillStyle = cols[(i + k) % 4]; g.beginPath(); g.arc(64 + i * 128 + (k % 2) * 64, 64 + k * 128, 18, 0, 7); g.fill(); }
        return;
      }
      if (kind === 'sable' || kind === 'neige' || kind === 'herbe') {
        const base = { sable: '#ecd29a', neige: '#f3f8fd', herbe: '#6f9c4d' }[kind], fleck = { sable: '150,105,50', neige: '150,185,220', herbe: '40,80,30' }[kind];
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${fleck},${Math.random() * 0.22})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3); }
        g.strokeStyle = `rgba(${fleck},.2)`; g.lineWidth = 4;
        for (let y = 20; y < h; y += 58) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin((x / w) * 6.283) * 12); g.stroke(); }
        return;
      }
      if (kind === 'ville') {
        g.fillStyle = '#3a4058'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#23263a'; g.fillRect(0, 196, w, 120); g.fillRect(196, 0, 120, h);
        g.fillStyle = '#ffe07a';
        for (let i = 0; i < 12; i++) { g.fillRect(i * 44, 252, 24, 7); g.fillRect(252, i * 44, 7, 24); }
        g.fillStyle = '#4f7a58'; g.fillRect(36, 36, 120, 120); g.fillStyle = '#566080'; g.fillRect(356, 356, 120, 120);
        return;
      }
      const night = kind === 'nuit';
      const tones = night ? ['#3a2a22', '#33241d', '#402e25', '#2e201a'] : ['#a8703f', '#9c6537', '#b27a48', '#a06a3b'];
      for (let i = 0; i < 4; i++) {
        g.fillStyle = tones[i]; g.fillRect(i * 128, 0, 128, h);
        for (let k = 0; k < 70; k++) {
          const x = i * 128 + Math.random() * 128, sway = 6 + Math.random() * 14;
          g.strokeStyle = `rgba(${night ? '0,0,0' : '60,28,10'},${0.05 + Math.random() * 0.14})`;
          g.lineWidth = 0.6 + Math.random() * 1.6;
          g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + sway, 170, x - sway, 340, x, h); g.stroke();
        }
        g.fillStyle = 'rgba(30,14,6,.7)'; g.fillRect(i * 128, 0, 2.5, h);
      }
    });
  }

  const roadTexture = (base) => canvas(256, 512, (g, w, h) => {
    g.fillStyle = base || '#34363b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const l = 30 + Math.random() * 60;
      g.fillStyle = `rgba(${l},${l},${l + 4},.55)`; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
    }
    const tr = g.createLinearGradient(0, 0, w, 0);          // gomme sombre sur la trajectoire
    tr.addColorStop(0.2, 'rgba(0,0,0,0)'); tr.addColorStop(0.36, 'rgba(0,0,0,.2)'); tr.addColorStop(0.5, 'rgba(0,0,0,.04)'); tr.addColorStop(0.64, 'rgba(0,0,0,.2)'); tr.addColorStop(0.8, 'rgba(0,0,0,0)');
    g.fillStyle = tr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(245,245,240,.9)'; g.fillRect(8, 0, 6, h); g.fillRect(w - 14, 0, 6, h);
    g.fillRect(w / 2 - 3, 0, 6, h * 0.45);
  });
  const stripeTexture = (a, b) => canvas(8, 64, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h / 2);
    g.fillStyle = b; g.fillRect(0, h / 2, w, h / 2);
  });

  // Profil extrudé le long du circuit : prof = [[décalage latéral, hauteur], ...].
  function strip(t, prof, repeat, mat, skip) {
    const m = prof.length, n = t.open ? t.count : t.count + 1, pos = new Float32Array(n * m * 3), uv = new Float32Array(n * m * 2), idx = [];
    for (let k = 0; k < n; k++) {
      const i = k % t.count, nx = -t.tz[i], nz = t.tx[i], v = Math.round((t.length / repeat)) * (k / t.count);
      for (let j = 0; j < m; j++) {
        const [o, y] = prof[j], q = k * m + j;
        pos.set([t.px[i] + nx * o, y, t.pz[i] + nz * o], q * 3);
        uv.set([j / (m - 1), v], q * 2);
        if (j < m - 1 && k < n - 1 && !(skip && (skip[i] || skip[(k + 1) % t.count]))) idx.push(q, q + 1, q + m, q + 1, q + m + 1, q + m);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return new T.Mesh(g, mat);
  }
  // Ruban le long du circuit. a et b : décalages latéraux, ya et yb : hauteurs.
  const ribbon = (t, a, b, ya, yb, repeat, mat, skip) => strip(t, [[a, ya], [b, yb]], repeat, mat, skip);
  // Mur en boudin de caoutchouc, centré sur la position du mur de la simulation.
  const WALL = [[-0.28, 0], [-0.28, 0.95], [-0.22, 1.25], [-0.1, 1.42], [0, 1.46], [0.1, 1.42], [0.22, 1.25], [0.28, 0.95], [0.28, 0]];
  const wallStrip = (t, at, mat, skip) => strip(t, WALL.map(([o, y]) => [at + Math.sign(at) * o, y]), 7, mat, skip);

  // ---------- Géométries lisses ----------
  // Pavé aux arêtes arrondies : chaque sommet est ramené sur une sphère de rayon r autour du pavé intérieur.
  const BOX_FACES = [[2, -1, 1, -1], [2, 1, 1, -1], [0, 1, 2, 1], [0, 1, 2, -1], [0, 1, 1, -1], [0, -1, 1, -1]];   // axe u, sens, axe v, sens (ordre de BoxGeometry)
  function roundBox(w, h, d, r, k = 3) {
    const n = 2 * k + 1, g = new T.BoxGeometry(1, 1, 1, n, n, n), p = g.attributes.position, nm = g.attributes.normal, uv = g.attributes.uv;
    const half = [w / 2, h / 2, d / 2], per = (n + 1) * (n + 1), v = [0, 0, 0], c = [0, 0, 0], f = [0, 0, 0];
    r = Math.min(r, w / 2, h / 2, d / 2) * 0.999;
    for (let i = 0; i < p.count; i++) {
      v[0] = p.getX(i); v[1] = p.getY(i); v[2] = p.getZ(i);
      let l = 0;
      for (let a = 0; a < 3; a++) {
        const j = Math.round((v[a] + 0.5) * n), H = half[a];
        const u = j <= k ? -H + r * (j / k) : H - r * ((n - j) / k), inner = Math.max(r - H, Math.min(H - r, u));
        f[a] = (u + H) / (2 * H); c[a] = u - inner; v[a] = inner; l += c[a] * c[a];
      }
      l = Math.sqrt(l) || 1;
      p.setXYZ(i, v[0] + (c[0] / l) * r, v[1] + (c[1] / l) * r, v[2] + (c[2] / l) * r);
      nm.setXYZ(i, c[0] / l, c[1] / l, c[2] / l);
      const [au, su, av, sv] = BOX_FACES[Math.floor(i / per)];
      uv.setXY(i, su > 0 ? f[au] : 1 - f[au], sv < 0 ? f[av] : 1 - f[av]);
    }
    return g;
  }
  // Normales moyennées entre sommets confondus : plus de facettes ni de couture.
  function smoothNormals(g) {
    g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, acc = new Map();
    const key = (i) => `${p.getX(i).toFixed(2)},${p.getY(i).toFixed(2)},${p.getZ(i).toFixed(2)}`;
    for (let i = 0; i < p.count; i++) { const k = key(i), a = acc.get(k) || [0, 0, 0]; a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); acc.set(k, a); }
    for (let i = 0; i < p.count; i++) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
    return g;
  }
  // Boule bosselée lisse (feuillage, galets).
  function lump(r, amp, seed, detail = 5) {
    const g = new T.IcosahedronGeometry(1, detail), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = r * (1 + amp * (Math.sin(x * 3.1 + seed) * Math.sin(y * 2.7 + seed * 1.7) + 0.6 * Math.sin(z * 4.3 - seed * 0.9) * Math.sin(x * 2.2 + y * 1.3)));
      p.setXYZ(i, x * k, y * k, z * k);
    }
    return smoothNormals(g);
  }
  // Fusion de géométries (positions, normales, uv), pour dessiner un petit personnage en un seul appel.
  // Une géométrie avec userData.tint donne sa couleur à ses sommets (matériau en vertexColors).
  function merge(list) {
    let nv = 0, tinted = false;
    const pos = [], nor = [], uv = [], idx = [], col = [];
    for (const g0 of list) {
      const g = g0.index ? g0 : g0.setIndex([...Array(g0.attributes.position.count).keys()]);
      const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, tc = new T.Color(g0.userData.tint !== undefined ? g0.userData.tint : 0xffffff).convertSRGBToLinear();
      if (g0.userData.tint !== undefined) tinted = true;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); col.push(tc.r, tc.g, tc.b); }
      for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + nv);
      nv += p.count;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    if (tinted) g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }

  // ---------- Décor : objets de cuisine géants ----------
  const lam = (color, extra) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.55 }, lam.env ? { envMap: lam.env } : {}, extra));
  const shiny = (color) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.22, metalness: 0.02, envMapIntensity: 0.75 }, lam.env ? { envMap: lam.env } : {}));
  function lathe(profile, mat) {
    return new T.Mesh(new T.LatheGeometry(profile.map((p) => new T.Vector2(p[0], p[1])), 48), Object.assign(mat, { side: T.DoubleSide }));
  }
  const metal = () => new T.MeshStandardMaterial(Object.assign({ color: 0xd6dbe2, metalness: 0.9, roughness: 0.25 }, lam.env ? { envMap: lam.env } : {}));
  // Objet modelé à petite échelle, agrandi k fois et tourné ; r : rayon d'encombrement au sol.
  function big(inner, k, rot, r) { const g = new T.Group(); inner.scale.setScalar(k); g.add(inner); g.rotation.y = rot; g.r = r; return g; }
  function labelTexture(bg, text, sub, ink) {
    const t = canvas(256, 340, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.arc(w / 2, h * 0.68, 90, 0, 7); g.fill();
      g.fillStyle = ink; g.textAlign = 'center';
      g.font = '900 44px Arial Black, Arial'; g.fillText(text, w / 2, 76);
      g.font = '900 34px Arial Black, Arial'; g.fillText(sub, w / 2, 120);
    });
    return t;
  }

  const PROPS = {
    assiette(c) {
      const g = new T.Group(), m = lathe([[0, 1], [20, 1], [30, 3], [38, 6], [38.5, 7], [30, 4.5], [20, 2.4], [0, 2.4]], shiny(c.plate));
      g.add(m); g.r = 39; g.flat = true; return g;
    },
    tasse(c) {
      const g = new T.Group();
      g.add(lathe([[0, 0], [16, 0], [18, 3], [19, 34], [17.5, 34], [16.5, 6], [0, 6]], shiny(c.cup)));
      const café = new T.Mesh(new T.CircleGeometry(17.2, 48), lam(0x3b2214)); café.rotation.x = -Math.PI / 2; café.position.y = 29; g.add(café);
      const anse = new T.Mesh(new T.TorusGeometry(9, 2.2, 16, 36), shiny(c.cup)); anse.position.set(24, 18, 0); g.add(anse);
      g.rotation.y = c.rot; g.r = 26; g.top = 30; return g;
    },
    bol(c) {
      const g = new T.Group();
      g.add(lathe([[0, 0], [12, 0], [22, 8], [28, 22], [28.5, 24], [26, 22], [0, 12]], shiny(c.cup)));
      const lait = new T.Mesh(new T.CircleGeometry(25, 48), lam(0xfff8ee)); lait.rotation.x = -Math.PI / 2; lait.position.y = 19; g.add(lait);
      const cg = new T.TorusGeometry(2.2, 1, 10, 16);
      for (let i = 0; i < 16; i++) {
        const a = i * 2.4, r = 3 + i * 1.25, p = new T.Mesh(cg, lam(0xe7a53f));
        p.position.set(Math.cos(a) * r, 19.6, Math.sin(a) * r); p.rotation.x = 1.4; g.add(p);
      }
      g.r = 29; g.top = 21; return g;
    },
    pomme(c) {
      const g = new T.Group(), s = new T.Mesh(new T.SphereGeometry(13, 36, 24), shiny(c.fruit));
      s.scale.y = 0.9; s.position.y = 11.5; g.add(s);
      const q = new T.Mesh(new T.CylinderGeometry(0.6, 0.9, 6, 12), lam(0x5a3a1f)); q.position.y = 24; q.rotation.z = 0.2; g.add(q);
      const f = new T.Mesh(new T.SphereGeometry(3, 16, 10), lam(0x4d9a3a)); f.scale.set(1.4, 0.25, 0.7); f.position.set(3, 24.5, 0); f.rotation.z = 0.4; g.add(f);
      g.r = 13.5; return g;
    },
    boite(c) {
      const g = new T.Group(), side = lam(c.box), face = new T.MeshLambertMaterial({ map: labelTexture('#' + c.box.toString(16).padStart(6, '0'), c.label[0], c.label[1], '#fff') });
      const b = new T.Mesh(roundBox(46, 66, 16, 2.6), [side, side, side, side, face, face]);
      b.position.y = 33; g.add(b); g.rotation.y = c.rot; g.r = 26; return g;
    },
    brique(c) {
      const g = new T.Group(), side = lam(0xf2f5fa), face = new T.MeshLambertMaterial({ map: labelTexture('#3f8fe0', 'LAIT', 'MEUH', '#fff') });
      const b = new T.Mesh(roundBox(22, 48, 22, 2.2), [face, face, side, side, face, face]);
      b.position.y = 24; g.add(b);
      const toit = new T.Mesh(roundBox(21, 3, 21, 1.4), side); toit.position.y = 49; g.add(toit);
      const bec = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 3, 24), lam(0x3f8fe0)); bec.position.set(4, 51.5, 4); g.add(bec);
      g.rotation.y = c.rot; g.r = 17; return g;
    },
    pot(c) {
      const g = new T.Group();
      g.add(lathe([[0, 0], [13, 0], [14, 2], [14, 22], [11, 25], [11, 28], [0, 28]], lam(c.jam)));
      const couvercle = new T.Mesh(new T.CylinderGeometry(12.5, 12.5, 4.4, 48), lam(0xd9403a)); couvercle.position.y = 30; g.add(couvercle);
      const bord = new T.Mesh(new T.TorusGeometry(12.5, 1.1, 10, 48), lam(0xd9403a)); bord.rotation.x = Math.PI / 2; bord.position.y = 32.2; g.add(bord);
      g.r = 15; g.top = 33; return g;
    },
    tartine() {
      const g = new T.Group(), s = new T.Shape();
      s.moveTo(-14, -15); s.lineTo(14, -15); s.lineTo(14, 8); s.bezierCurveTo(19, 16, 8, 19, 0, 17); s.bezierCurveTo(-8, 19, -19, 16, -14, 8); s.closePath();
      const m = new T.Mesh(new T.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 4, curveSegments: 24 }), lam(0xd9a05b));
      m.rotation.x = -Math.PI / 2; m.position.y = 1.2; g.add(m);
      const b = new T.Mesh(new T.ShapeGeometry(s, 24), lam(0xf6e39a)); b.rotation.x = -Math.PI / 2; b.position.y = 4.1; b.scale.set(0.82, 0.82, 1); g.add(b);
      g.rotation.y = Math.random() * 6; g.r = 20; g.flat = true; return g;
    },
    // Grille-pain chromé : une tartine en jaillit de temps en temps (voir life.js).
    grillepain(c) {
      const g = new T.Group(), chrome = new T.MeshStandardMaterial(Object.assign({ color: 0xdfe4ea, metalness: 0.85, roughness: 0.2 }, lam.env ? { envMap: lam.env } : {}));
      const b = new T.Mesh(roundBox(44, 28, 24, 7), chrome); b.position.y = 14; g.add(b);
      const pied = new T.Mesh(roundBox(46, 2.4, 26, 1), lam(0x2b2d35)); pied.position.y = 1.2; g.add(pied);
      for (const x of [-9, 9]) { const f = new T.Mesh(roundBox(15, 1.2, 4.2, 0.6), lam(0x15161b)); f.position.set(x, 28.1, 0); g.add(f); }
      const levier = new T.Mesh(roundBox(3, 3, 6, 1.2), lam(0xe5352b)); levier.position.set(23.5, 18, 0); g.add(levier);
      g.toast = new T.Group();
      for (const x of [-9, 9]) { const t = new T.Mesh(roundBox(13, 15, 3, 1.4), lam(0xd9a05b)); t.position.set(x, 23, 0); g.toast.add(t); }
      g.add(g.toast);
      g.rotation.y = c.rot; g.r = 26; return g;
    },
    seau(c) {
      const g = new T.Group(), col = [0xe5352b, 0x2f8fd8, 0xf7c52d][Math.floor(c.rot) % 3];
      g.add(lathe([[0, 0], [13, 0], [18, 30], [17, 30], [12, 2], [0, 2]], shiny(col)));
      const anse = new T.Mesh(new T.TorusGeometry(17.5, 0.8, 10, 40, Math.PI), lam(0xffffff)); anse.position.y = 30; g.add(anse);
      g.rotation.y = c.rot; g.r = 19; return g;
    },
    chateau() {
      const g = new T.Group(), m = lam(0xe2bf7c), toit = lam(0xd89a4a);
      const base = new T.Mesh(roundBox(44, 18, 44, 3), m); base.position.y = 9; g.add(base);
      for (const [x, z] of [[-20, -20], [20, -20], [-20, 20], [20, 20]]) {
        const t = new T.Mesh(new T.CylinderGeometry(8, 10, 32, 32), m); t.position.set(x, 16, z); g.add(t);
        const c = new T.Mesh(new T.ConeGeometry(10, 12, 32), toit); c.position.set(x, 38, z); g.add(c);
      }
      const d = new T.Mesh(new T.BoxGeometry(0.8, 9, 6), lam(0xe5352b)); d.position.set(0, 26, 0); g.add(d);
      const mat = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 12, 8), lam(0xffffff)); mat.position.set(0, 23, -3); g.add(mat);
      g.r = 32; return g;
    },
    ballon() {
      const c = canvas(128, 64, (x, w, h) => { ['#e5352b', '#fff', '#2f8fd8', '#fff', '#f7c52d', '#fff'].forEach((f, i) => { x.fillStyle = f; x.fillRect((i * w) / 6, 0, w / 6, h); }); });
      const g = new T.Group(), s = new T.Mesh(new T.SphereGeometry(15, 40, 26), new T.MeshStandardMaterial({ map: c, roughness: 0.3 }));
      s.position.y = 14.5; s.rotation.z = 0.5; g.add(s); g.r = 16; g.ball = s; return g;
    },
    pelle(c) {
      const g = new T.Group(), m = shiny(0x25b98a);
      const manche = new T.Mesh(roundBox(4, 2, 52, 0.9), m); manche.position.y = 1.2; g.add(manche);
      const tete = new T.Mesh(roundBox(18, 2.5, 22, 1.2), m); tete.position.set(0, 1.4, 34); g.add(tete);
      g.rotation.y = c.rot; g.r = 42; g.flat = true; return g;
    },
    coquille(c) {
      const g = new T.Group(), s = new T.Mesh(new T.SphereGeometry(10, 32, 14, 0, 6.3, 0, 1.5), lam(0xf6c9b4, { roughness: 0.35 })); s.scale.set(1, 0.6, 1); g.add(s);
      const rib = lam(0xe9a98f);
      for (let i = 0; i < 7; i++) { const r = new T.Mesh(new T.TorusGeometry(10, 0.45, 8, 24, 1.5), rib); r.rotation.set(0, i * 0.45 - 1.35, Math.PI / 2); r.scale.set(0.6, 1, 1); g.add(r); }
      g.rotation.y = c.rot; g.r = 11; return g;
    },
    caillou(c) {
      const g = new T.Group(), s = new T.Mesh(lump(11, 0.14, c.rot * 3), lam(0x9a968e, { roughness: 0.75 })); s.scale.y = 0.62; s.position.y = 5; s.rotation.y = c.rot; g.add(s);
      g.r = 12; return g;
    },
    sapin() {
      const g = new T.Group(), tr = new T.Mesh(new T.CylinderGeometry(2.4, 3, 10, 20), lam(0x6a4426)); tr.position.y = 5; g.add(tr);
      [[17, 22, 18], [13, 19, 31], [9, 15, 43]].forEach(([r, h, y]) => { const c = new T.Mesh(new T.ConeGeometry(r, h, 32), lam(0x2c6d4c)); c.position.y = y; g.add(c); const n = new T.Mesh(new T.ConeGeometry(r * 0.55, h * 0.45, 32), lam(0xffffff)); n.position.y = y + h * 0.3; g.add(n); });
      g.r = 18; return g;
    },
    // Bonhomme de neige : la tête et les bras bougent (life.js), d'où les sous-groupes.
    bonhomme() {
      const g = new T.Group(), n = lam(0xffffff, { roughness: 0.8 }), coal = lam(0x1d1f26);
      [[12, 11], [9, 26]].forEach(([r, y]) => { const s = new T.Mesh(new T.SphereGeometry(r, 32, 22), n); s.position.y = y; g.add(s); });
      for (const y of [22, 27, 32]) { const b = new T.Mesh(new T.SphereGeometry(1, 12, 8), coal); b.position.set(0, y, Math.sqrt(81 - (y - 26) ** 2) - 0.2); g.add(b); }
      const echarpe = new T.Mesh(new T.TorusGeometry(6.4, 1.6, 12, 32), lam(0xe5352b)); echarpe.rotation.x = Math.PI / 2; echarpe.position.y = 33.5; g.add(echarpe);
      const head = new T.Group(); head.position.y = 37; g.add(head);
      head.add(new T.Mesh(new T.SphereGeometry(6.5, 32, 22), n));
      const nez = new T.Mesh(new T.ConeGeometry(1.3, 7, 16), lam(0xf08a2a)); nez.rotation.x = Math.PI / 2; nez.position.set(0, 1, 8.5); head.add(nez);
      for (const x of [-2.3, 2.3]) { const e = new T.Mesh(new T.SphereGeometry(0.9, 12, 8), coal); e.position.set(x, 2.8, 5.6); head.add(e); }
      const chap = new T.Mesh(new T.CylinderGeometry(4.2, 4.2, 6, 32), coal); chap.position.y = 7.6; head.add(chap);
      const bord = new T.Mesh(new T.CylinderGeometry(6.6, 6.6, 0.8, 32), coal); bord.position.y = 4.8; head.add(bord);
      g.head = head; g.arms = [];
      for (const k of [-1, 1]) {
        const a = new T.Group(); a.position.set(k * 8, 27, 0); g.add(a);
        const br = new T.Mesh(new T.CylinderGeometry(0.5, 0.7, 13, 8), lam(0x6a4426)); br.rotation.z = -k * 1.1; br.position.set(k * 5.4, 2.6, 0); a.add(br);
        a.k = k; g.arms.push(a);
      }
      g.rotation.y = Math.random() * 6; g.r = 13; return g;
    },
    glacon(c) {
      const g = new T.Group(), s = new T.Mesh(roundBox(20, 20, 20, 3.5), new T.MeshStandardMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.72, roughness: 0.1, metalness: 0.05, envMap: lam.env }));
      s.position.y = 10; s.rotation.y = c.rot; g.add(s); g.r = 15; return g;
    },
    batonnet(c) {
      const g = new T.Group(), col = [0xf0639a, 0xf7c52d, 0x25b98a][Math.floor(c.rot) % 3];
      const b = new T.Mesh(roundBox(14, 3.5, 30, 1.7), shiny(col)); b.position.set(0, 2, 8); g.add(b);
      const s = new T.Mesh(roundBox(3, 1.4, 16, 0.65), lam(0xd9b98a)); s.position.set(0, 1, -14); g.add(s);
      g.rotation.y = c.rot; g.r = 26; g.flat = true; return g;
    },
    arbre(c) {
      const g = new T.Group(), tr = new T.Mesh(new T.CylinderGeometry(4, 6, 34, 24), lam(0x6d4a2c, { roughness: 0.8 })); tr.position.y = 17; g.add(tr);
      const greens = [0x4d8f3f, 0x3c7a3a, 0x63a34a];
      [[0, 42, 0, 19], [11, 36, 5, 13], [-10, 37, -6, 14]].forEach(([x, y, z, r], i) => { const s = new T.Mesh(lump(r, 0.09, c.rot * 5 + i * 2), lam(greens[i], { roughness: 0.7 })); s.position.set(x, y, z); g.add(s); });
      g.rotation.y = c.rot; g.r = 22; return g;
    },
    champignon() {
      const g = new T.Group(), p = new T.Mesh(new T.CylinderGeometry(4, 5, 14, 24), lam(0xf4ecd8)); p.position.y = 7; g.add(p);
      const c = new T.Mesh(new T.SphereGeometry(14, 40, 16, 0, 6.3, 0, 1.57), lam(0xd8322e, { roughness: 0.35 })); c.position.y = 13; c.scale.y = 0.8; g.add(c);
      const dessous = new T.Mesh(new T.CircleGeometry(14, 40), lam(0xf4ecd8)); dessous.rotation.x = Math.PI / 2; dessous.position.y = 13; g.add(dessous);
      for (let i = 0; i < 6; i++) { const a = i * 1.05, d = new T.Mesh(new T.SphereGeometry(2, 16, 10), lam(0xffffff)); d.scale.y = 0.5; d.position.set(Math.cos(a) * 9, 21.8, Math.sin(a) * 9); g.add(d); }
      g.r = 15; return g;
    },
    gland() {
      const g = new T.Group(), n = new T.Mesh(new T.SphereGeometry(8, 32, 22), lam(0xb07a34, { roughness: 0.35 })); n.scale.y = 1.25; n.position.y = 9; g.add(n);
      const c = new T.Mesh(new T.SphereGeometry(8.6, 32, 12, 0, 6.3, 0, 1.4), lam(0x6d4a2c, { roughness: 0.9 })); c.position.y = 12; g.add(c);
      const q = new T.Mesh(new T.CylinderGeometry(0.8, 1.1, 4, 12), lam(0x5a3a1f)); q.position.y = 21; g.add(q);
      g.r = 10; return g;
    },
    feuille(c) {
      const g = new T.Group(), s = new T.Shape();
      s.moveTo(0, -24); s.bezierCurveTo(18, -10, 16, 14, 0, 26); s.bezierCurveTo(-16, 14, -18, -10, 0, -24);
      const m = new T.Mesh(new T.ShapeGeometry(s, 24), lam(0xd9862e, { side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = 0.4; g.add(m);
      const n = new T.Mesh(new T.PlaneGeometry(0.8, 46), lam(0xa85f1c, { side: T.DoubleSide })); n.rotation.x = -Math.PI / 2; n.position.y = 0.5; g.add(n);
      g.rotation.y = c.rot; g.r = 26; g.flat = true; return g;
    },
    // Immeuble : sa texture garde son canevas pour que les fenêtres s'allument (life.js).
    immeuble(c) {
      const g = new T.Group(), h = 45 + (c.rot * 13) % 55, cols = ['#2b3050', '#3b2d55', '#26404f'], bg = cols[Math.floor(c.rot) % 3];
      const tex = canvas(128, 256, (x, w, H) => {
        x.fillStyle = bg; x.fillRect(0, 0, w, H);
        for (let i = 0; i < 6; i++) for (let k = 0; k < 11; k++) { x.fillStyle = Math.random() < 0.55 ? '#ffd98a' : Math.random() < 0.3 ? '#7fe4ff' : '#161a30'; x.fillRect(8 + i * 19, 8 + k * 22, 12, 14); }
      });
      const b = new T.Mesh(roundBox(30, h, 30, 2.2), new T.MeshBasicMaterial({ map: tex })); b.position.y = h / 2; g.add(b);
      const toit = new T.Mesh(roundBox(31, 1.6, 31, 0.8), lam(0x1a1d33)); toit.position.y = h + 0.6; g.add(toit);
      g.rotation.y = c.rot; g.r = 24; g.h = h; g.win = tex; return g;
    },
    lampadaire() {
      const g = new T.Group(), p = new T.Mesh(new T.CylinderGeometry(0.9, 1.2, 34, 16), lam(0x3a3f55)); p.position.y = 17; g.add(p);
      const l = new T.Mesh(new T.SphereGeometry(3.4, 24, 16), new T.MeshBasicMaterial({ color: 0xffe9a8 })); l.position.y = 36; g.add(l);
      const capot = new T.Mesh(new T.SphereGeometry(3.9, 24, 8, 0, 6.3, 0, 1.2), lam(0x3a3f55)); capot.position.y = 36.4; g.add(capot);
      g.r = 5; return g;
    },
    plot() {
      const g = new T.Group(), c = new T.Mesh(new T.ConeGeometry(6, 18, 28), lam(0xf07a2a)); c.position.y = 9; g.add(c);
      const b = new T.Mesh(new T.CylinderGeometry(3.6, 4.2, 3, 28), lam(0xffffff)); b.position.y = 9; g.add(b);
      const s = new T.Mesh(roundBox(15, 1.6, 15, 0.7), lam(0xf07a2a)); s.position.y = 0.8; g.add(s);
      g.r = 8; return g;
    },
    couvert(c) {
      const g = new T.Group(), s = new T.Shape();
      s.moveTo(-3, -60); s.lineTo(3, -60); s.lineTo(2, 8); s.lineTo(7, 20); s.lineTo(7, 52); s.lineTo(4, 52); s.lineTo(4, 26); s.lineTo(1.5, 26); s.lineTo(1.5, 54); s.lineTo(-1.5, 54); s.lineTo(-1.5, 26); s.lineTo(-4, 26); s.lineTo(-4, 52); s.lineTo(-7, 52); s.lineTo(-7, 20); s.lineTo(-2, 8);
      s.closePath();
      const m = new T.Mesh(new T.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.35, bevelSegments: 3 }), shiny(0xc4cad4));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.6; g.add(m);
      g.rotation.y = c.rot; g.r = 56; g.flat = true; return g;
    },

    // ---------- Chambre d'enfant ----------
    peluche(c) {
      const g = new T.Group(), fur = lam(0xb07a4a, { roughness: 0.95 }), light = lam(0xe8c79c, { roughness: 0.95 }), dark = lam(0x2a1d16, { roughness: 0.4 });
      const corps = new T.Mesh(new T.SphereGeometry(4, 28, 20), fur); corps.scale.set(1, 1.15, 0.9); corps.position.y = 4.6; g.add(corps);
      const ventre = new T.Mesh(new T.SphereGeometry(2.6, 24, 16), light); ventre.scale.set(1, 1.1, 0.5); ventre.position.set(0, 4.4, 2.6); g.add(ventre);
      const tete = new T.Mesh(new T.SphereGeometry(3, 28, 20), fur); tete.position.y = 10.4; g.add(tete);
      const museau = new T.Mesh(new T.SphereGeometry(1.2, 20, 14), light); museau.scale.set(1.1, 0.8, 0.8); museau.position.set(0, 9.9, 2.6); g.add(museau);
      const nez = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), dark); nez.position.set(0, 10.2, 3.5); g.add(nez);
      for (const k of [-1, 1]) {
        const o = new T.Mesh(new T.SphereGeometry(1.1, 18, 12), fur); o.position.set(k * 2.2, 12.9, -0.2); g.add(o);
        const oi = new T.Mesh(new T.SphereGeometry(0.6, 14, 10), light); oi.position.set(k * 2.2, 12.9, 0.5); oi.scale.z = 0.4; g.add(oi);
        const oe = new T.Mesh(new T.SphereGeometry(0.35, 12, 8), dark); oe.position.set(k * 1.05, 11, 2.6); g.add(oe);
        const bras = new T.Mesh(new T.SphereGeometry(1.3, 18, 12), fur); bras.scale.set(0.8, 1.7, 0.8); bras.position.set(k * 3.8, 5.6, 0.8); bras.rotation.z = k * 0.5; g.add(bras);
        const jambe = new T.Mesh(new T.SphereGeometry(1.6, 18, 12), fur); jambe.scale.set(0.9, 0.8, 1.4); jambe.position.set(k * 2.2, 1.3, 1.6); g.add(jambe);
        const pied = new T.Mesh(new T.SphereGeometry(0.95, 14, 10), light); pied.scale.z = 0.35; pied.position.set(k * 2.2, 1.4, 3.6); g.add(pied);
      }
      const noeud = new T.Mesh(new T.TorusGeometry(0.9, 0.35, 10, 20), lam(0xe5352b)); noeud.position.set(0, 8.2, 2.2); g.add(noeud);
      return big(g, 2.4, c.rot, 14);
    },
    crayons(c) {
      const g = new T.Group(), cols = [0xe5352b, 0x2f8fd8, 0x25b98a, 0xf7c52d, 0x8a5cd6];
      cols.forEach((col, i) => {
        const p = new T.Group(); p.position.set((i - 2) * 1.05, 0.5, (i % 2) * 0.8); p.rotation.y = (i - 2) * 0.08; g.add(p);
        const b = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 9, 6), lam(col, { roughness: 0.4 })); b.rotation.x = Math.PI / 2; p.add(b);
        const bois = new T.Mesh(new T.ConeGeometry(0.5, 1.4, 6), lam(0xf0c99a)); bois.rotation.x = Math.PI / 2; bois.position.z = 5.2; p.add(bois);
        const mine = new T.Mesh(new T.ConeGeometry(0.18, 0.5, 6), lam(col)); mine.rotation.x = Math.PI / 2; mine.position.z = 6.05; p.add(mine);
      });
      const o = big(g, 4, c.rot, 22); o.flat = true; return o;
    },
    tour(c) {
      const g = new T.Group(), cols = [0xe5352b, 0x2f8fd8, 0xf7c52d, 0x25b98a, 0xff8a1e];
      for (let i = 0; i < 5; i++) {
        const m = lam(cols[(i + Math.floor(c.rot)) % 5], { roughness: 0.25 }), b = new T.Mesh(roundBox(4, 1.6, 2, 0.15), m); b.position.set(i % 2 ? 0.5 : -0.3, 0.8 + i * 1.6, 0); b.rotation.y = i * 0.15; g.add(b);
        for (const x of [-1.2, 0, 1.2]) for (const z of [-0.5, 0.5]) { const s = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.25, 14), m); s.position.set(b.position.x + x, 1.72 + i * 1.6, z); g.add(s); }
      }
      return big(g, 5, c.rot, 14);
    },
    livres(c) {
      const g = new T.Group(), cols = [0x2f62d9, 0xe5352b, 0x25b98a, 0xf7c52d];
      for (let i = 0; i < 4; i++) {
        const w = 6.4 - i * 0.5, b = new T.Mesh(roundBox(w, 1, w * 0.72, 0.12), [lam(cols[i]), lam(cols[i]), lam(cols[i]), lam(cols[i]), lam(0xfff6e0), lam(cols[i])]);
        b.position.set((i % 2) * 0.4, 0.5 + i * 1.02, 0); b.rotation.y = i * 0.18 - 0.2; g.add(b);
      }
      return big(g, 5, c.rot, 20);
    },
    // Toupie : elle tourne sur sa pointe (life.js).
    toupie(c) {
      const g = new T.Group(), spin = new T.Group(); g.add(spin);
      const corps = lathe([[0, 0], [0.35, 0.4], [2.6, 2.4], [2.8, 2.9], [2.2, 3.4], [0.6, 3.7], [0.4, 4.6], [0, 4.7]], lam([0xe5352b, 0x2f8fd8, 0x25b98a][Math.floor(c.rot) % 3], { roughness: 0.25 }));
      spin.add(corps);
      const band = new T.Mesh(new T.TorusGeometry(2.75, 0.18, 10, 40), lam(0xffd23f)); band.rotation.x = Math.PI / 2; band.position.y = 2.75; spin.add(band);
      spin.rotation.z = 0.08;
      const o = big(g, 3.2, c.rot, 10); o.spin = spin; return o;
    },

    // ---------- Décors ajoutés en v0.9.1 : modelés petits, puis agrandis à l'échelle des autres objets ----------
    salieres(c) {
      const g = new T.Group();
      [[0xffffff, -2.2], [0x2b2d35, 2.2]].forEach(([col, x]) => {
        const b = lathe([[0, 0], [1.6, 0], [1.7, 0.4], [1.4, 3], [1.5, 4.5], [0, 4.5]], lam(col, { roughness: 0.2 })); b.position.x = x; g.add(b);
        const top = new T.Mesh(new T.SphereGeometry(1.5, 32, 16, 0, 6.3, 0, 1.5), metal()); top.position.set(x, 4.5, 0); g.add(top);
      });
      return big(g, 8, c.rot, 32);
    },
    crepes(c) {
      const g = new T.Group();
      for (let i = 0; i < 6; i++) {
        const y = 0.3 + i * 0.6, p = new T.Mesh(new T.CylinderGeometry(4 - (i % 2) * 0.15, 4, 0.55, 48), lam(0xe9b56a, { roughness: 0.6 })); p.position.y = y; g.add(p);
        const bord = new T.Mesh(new T.TorusGeometry(3.9, 0.28, 10, 48), lam(0xd29a50)); bord.rotation.x = Math.PI / 2; bord.position.y = y; g.add(bord);
      }
      const sirop = new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 0.2, 48), lam(0x8a3f12, { roughness: 0.05 })); sirop.position.y = 3.75; g.add(sirop);
      const beurre = new T.Mesh(roundBox(1.6, 1, 1.6, 0.3), lam(0xfff1a8)); beurre.position.set(0.4, 4.3, 0.2); g.add(beurre);
      return big(g, 6, c.rot, 26);
    },
    cubes(c) {
      const g = new T.Group();
      [['A', '#e5352b'], ['B', '#2f8fd8'], ['C', '#25b98a']].forEach(([t, col], i) => {
        const tex = canvas(128, 128, (x, w) => { x.fillStyle = '#fff6e8'; x.fillRect(0, 0, w, w); x.fillStyle = col; x.font = '900 96px Arial Black, Arial'; x.textAlign = 'center'; x.fillText(t, w / 2, 100); });
        const b = new T.Mesh(roundBox(3.4, 3.4, 3.4, 0.45), lam(0xffffff, { map: tex, roughness: 0.4 }));
        b.position.set(i === 2 ? 0 : (i - 0.5) * 3.7, i === 2 ? 5.1 : 1.7, 0); b.rotation.y = i * 0.3 - 0.2; g.add(b);
      });
      return big(g, 6, c.rot, 27);
    },
    parasol(c) {
      const g = new T.Group(), stripes = canvas(256, 32, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : '#e5352b'; x.fillRect((i * w) / 8, 0, w / 8, h); } });
      const mat = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 7, 12), lam(0xf2f2f2)); mat.position.y = 3.5; g.add(mat);
      const top = new T.Mesh(new T.ConeGeometry(5, 1.6, 32, 1, true), lam(0xffffff, { map: stripes, side: T.DoubleSide })); top.position.y = 7; g.add(top);
      const towel = canvas(64, 128, (x, w, h) => { for (let i = 0; i < 6; i++) { x.fillStyle = ['#2f8fd8', '#fff', '#f7c52d'][i % 3]; x.fillRect(0, (i * h) / 6, w, h / 6); } });
      const t = new T.Mesh(roundBox(3.6, 0.15, 6.5, 0.07), lam(0xffffff, { map: towel })); t.position.set(2.6, 0.08, 1.5); g.add(t);
      return big(g, 5, c.rot, 27);
    },
    canard(c) {
      const g = new T.Group(), y = lam(0xf7c52d, { roughness: 0.2 });
      const ring = new T.Mesh(new T.TorusGeometry(2.6, 1.2, 24, 48), y); ring.rotation.x = Math.PI / 2; ring.position.y = 1.2; g.add(ring);
      const tete = new T.Mesh(new T.SphereGeometry(1.25, 28, 20), y); tete.position.set(0, 3.3, 2.6); g.add(tete);
      const bec = new T.Mesh(new T.SphereGeometry(0.6, 20, 12), lam(0xf07a2a)); bec.scale.set(1.2, 0.45, 1.1); bec.position.set(0, 3.1, 3.8); g.add(bec);
      for (const k of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.18, 10, 8), lam(0x1b1b22)); e.position.set(k * 0.55, 3.7, 3.65); g.add(e); }
      return big(g, 5, c.rot, 21);
    },
    etoile(c) {
      const sh = new T.Shape();
      for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 1.6 : 4.2; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      const g = new T.Group(), m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 5 }), lam(0xf07a50, { roughness: 0.5 }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.5; g.add(m);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2; for (const d of [1.4, 2.4]) { const p = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), lam(0xffd9b0)); p.position.set(Math.cos(a) * d, 1.4, -Math.sin(a) * d); g.add(p); } }
      const o = big(g, 4, c.rot, 18); o.flat = true; return o;
    },
    souche(c) {
      const g = new T.Group(), rings = canvas(128, 128, (x) => { x.fillStyle = '#d9b07a'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#a97a44'; x.lineWidth = 3; for (let r = 8; r < 64; r += 9) { x.beginPath(); x.arc(64, 64, r, 0, 7); x.stroke(); } });
      const bark = lam(0x7a5233, { roughness: 0.9 }), tr = new T.Mesh(new T.CylinderGeometry(3, 3.6, 3.2, 40), [bark, lam(0xffffff, { map: rings }), bark]); tr.position.y = 1.6; g.add(tr);
      // Escargot sur le dessus : il s'étire et avance doucement (life.js).
      const snail = new T.Group(); snail.position.set(0.4, 3.2, 0); g.add(snail);
      const shell = new T.Mesh(new T.TorusGeometry(0.75, 0.45, 16, 32), lam(0xc98a3e, { roughness: 0.3 })); shell.position.y = 0.95; shell.rotation.y = Math.PI / 2; snail.add(shell);
      const corps = new T.Mesh(new T.SphereGeometry(0.45, 16, 12), lam(0xbfd88a, { roughness: 0.3 })); corps.scale.set(1, 0.6, 3.4); corps.position.y = 0.25; snail.add(corps);
      for (const k of [-1, 1]) {
        const ant = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.9, 6), lam(0xbfd88a)); ant.position.set(k * 0.18, 0.75, 1.45); ant.rotation.x = 0.4; snail.add(ant);
        const oe = new T.Mesh(new T.SphereGeometry(0.11, 8, 6), lam(0x1b1b22)); oe.position.set(k * 0.18, 1.2, 1.6); snail.add(oe);
      }
      const o = big(g, 6, c.rot, 22); o.snail = snail; o.top = 20; return o;
    },
    marguerites(c) {
      const g = new T.Group(), heads = [];
      [[0, 0, 5.5], [-2.4, 1, 4], [2.2, -0.6, 4.5]].forEach(([x, z, h]) => {
        const f = new T.Group(); f.position.set(x, 0, z); g.add(f);
        const tige = new T.Mesh(new T.CylinderGeometry(0.14, 0.18, h, 8), lam(0x4d9a3a)); tige.position.y = h / 2; f.add(tige);
        const coeur = new T.Mesh(new T.SphereGeometry(0.55, 18, 12), lam(0xf7c52d, { roughness: 0.6 })); coeur.position.set(0, h, 0.15); f.add(coeur);
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, p = new T.Mesh(new T.SphereGeometry(0.5, 12, 8), lam(0xffffff, { roughness: 0.6 })); p.scale.set(Math.abs(Math.cos(a)) * 1.2 + 0.45, Math.abs(Math.sin(a)) * 1.2 + 0.45, 0.25); p.position.set(Math.cos(a), h + Math.sin(a), 0); f.add(p); }
        heads.push(f);
      });
      const o = big(g, 6, c.rot, 18); o.stems = heads; return o;
    },
    coccinelle(c) {
      const g = new T.Group(), b = new T.Mesh(new T.SphereGeometry(2.4, 36, 18, 0, 6.3, 0, 1.6), lam(0xe5352b, { roughness: 0.15 })); b.scale.z = 1.25; g.add(b);
      const tete = new T.Mesh(new T.SphereGeometry(1.1, 24, 16), lam(0x1b1b22, { roughness: 0.3 })); tete.position.set(0, 0.5, 2.7); g.add(tete);
      for (const [x, z] of [[1, 0.6], [-1, 0.6], [1.3, -1.2], [-1.3, -1.2], [0, -2.2]]) { const d = new T.Mesh(new T.SphereGeometry(0.45, 14, 10), lam(0x1b1b22)); d.scale.y = 0.35; d.position.set(x, Math.sqrt(Math.max(0, 5.76 - x * x - (z / 1.25) ** 2)) - 0.1, z); g.add(d); }
      const o = big(g, 5, c.rot, 15); o.bug = g; return o;
    },
    igloo(c) {
      const blocks = canvas(256, 128, (x, w, h) => { x.fillStyle = '#f4f9ff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#bcd3ea'; x.lineWidth = 3; for (let r = 0; r < 6; r++) { x.beginPath(); x.moveTo(0, r * 21); x.lineTo(w, r * 21); x.stroke(); for (let k = 0; k < 10; k++) { const xx = k * 26 + (r % 2) * 13; x.beginPath(); x.moveTo(xx, r * 21); x.lineTo(xx, r * 21 + 21); x.stroke(); } } });
      const g = new T.Group(), m = lam(0xffffff, { map: blocks, roughness: 0.7 });
      g.add(new T.Mesh(new T.SphereGeometry(4.5, 48, 24, 0, 6.3, 0, Math.PI / 2), m));
      const tun = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 3, 32, 1, false, -Math.PI / 2, Math.PI), m); tun.rotation.x = -Math.PI / 2; tun.position.z = 4.2; g.add(tun);
      const porte = new T.Mesh(new T.CircleGeometry(1.35, 32, 0, Math.PI), lam(0x3b4a6b)); porte.position.set(0, 0.02, 5.72); g.add(porte);
      return big(g, 6, c.rot, 32);
    },
    luge(c) {
      const g = new T.Group(), red = lam(0xe5352b, { roughness: 0.2 });
      for (let i = 0; i < 4; i++) { const p = new T.Mesh(roundBox(3, 0.25, 1.1, 0.1), lam(0xc98a4e, { roughness: 0.4 })); p.position.set(0, 1.4, -2.1 + i * 1.3); g.add(p); }
      for (const k of [-1, 1]) {
        const patin = new T.Mesh(roundBox(0.25, 0.25, 6.4, 0.1), red); patin.position.set(k * 1.25, 0.15, 0); g.add(patin);
        const nez = new T.Mesh(new T.TorusGeometry(0.75, 0.13, 10, 20, Math.PI), red); nez.rotation.set(0, Math.PI / 2, -Math.PI / 2); nez.position.set(k * 1.25, 0.9, 3.2); g.add(nez);
        for (const z of [-2, 0, 2]) { const m = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 1.3, 8), red); m.position.set(k * 1.25, 0.8, z); g.add(m); }
      }
      return big(g, 4, c.rot, 15);
    },
    // Feu tricolore : il passe au vert, à l'orange puis au rouge (life.js).
    feu(c) {
      const g = new T.Group();
      const mat = new T.Mesh(new T.CylinderGeometry(0.25, 0.3, 8, 16), lam(0x3a3f55)); mat.position.y = 4; g.add(mat);
      const boite = new T.Mesh(roundBox(1.9, 4.6, 1.5, 0.45), lam(0x22242c, { roughness: 0.3 })); boite.position.y = 9.6; g.add(boite);
      const lights = [[0xff3b30, 11.1], [0xffb02e, 9.6], [0x2bd46a, 8.1]].map(([col, y]) => {
        const m = new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.12, roughness: 0.3 }), l = new T.Mesh(new T.SphereGeometry(0.55, 24, 16), m);
        l.position.set(0, y, 0.6); g.add(l); return m;
      });
      const o = big(g, 3.2, c.rot, 6); o.lights = lights; return o;
    },
    bus(c) {
      const win = canvas(256, 64, (x, w) => { x.fillStyle = '#f7c52d'; x.fillRect(0, 0, w, 64); x.fillStyle = '#9fd3ff'; for (let i = 0; i < 6; i++) x.fillRect(10 + i * 41, 8, 32, 30); x.fillStyle = '#2b2d35'; x.fillRect(0, 50, w, 5); });
      const g = new T.Group(), y = lam(0xf7c52d, { roughness: 0.3 }), side = lam(0xffffff, { map: win, roughness: 0.3 });
      const b = new T.Mesh(roundBox(3.4, 3.4, 9, 0.8), [side, side, y, y, y, y]); b.position.y = 2.4; g.add(b);
      for (const [x, z] of [[-1.6, 2.8], [1.6, 2.8], [-1.6, -2.8], [1.6, -2.8]]) { const w = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.6, 28), lam(0x1b1b22)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.85, z); g.add(w); }
      const phares = new T.Mesh(roundBox(3, 0.6, 0.3, 0.2), lam(0xfff6c8, { emissive: 0x665500 })); phares.position.set(0, 1.7, 4.55); g.add(phares);
      return big(g, 4, c.rot, 20);
    },
  };

  // Fusionne les morceaux immobiles d'un objet qui partagent la même matière : moins d'appels de dessin.
  // Les parties animées (life.js) et les matières multiples restent intactes.
  const ANIM_KEYS = ['toast', 'ball', 'head', 'snail', 'bug', 'spin'], ANIM_LISTS = ['arms', 'stems'];
  function matKey(m) {
    return [m.type, m.color && m.color.getHexString(), m.roughness, m.metalness, m.map ? m.map.uuid : '', m.transparent, m.opacity, m.side, m.vertexColors, m.emissive && m.emissive.getHexString()].join('|');
  }
  function bake(g) {
    const skip = new Set();
    for (const k of ANIM_KEYS) if (g[k]) skip.add(g[k]);
    for (const k of ANIM_LISTS) if (g[k]) for (const o of g[k]) skip.add(o);
    const lightMats = new Set(g.lights || []);
    g.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(g.matrixWorld).invert(), groups = new Map();
    const walk = (o) => {
      if (skip.has(o)) return;
      if (o.isMesh && !Array.isArray(o.material) && !lightMats.has(o.material)) {
        const k = matKey(o.material);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(o);
      }
      for (const c of o.children) walk(c);
    };
    for (const c of g.children) walk(c);
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const geos = list.map((o) => { const geo = o.geometry.index ? o.geometry.clone() : o.geometry.toNonIndexed(); geo.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return geo; });
      const m = new T.Mesh(merge(geos), list[0].material);
      for (const o of list) o.parent.remove(o);
      g.add(m);
    }
  }

  // Décor semé autour du circuit, en évitant la piste, les raccourcis et ce qui est déjà posé (placed).
  function scatter(scene, t, def, seed, placed) {
    let s = seed * 7919;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s % 100000) / 100000; };
    const pal = { plate: 0xfffdf8, cup: [0x3f8fe0, 0xf6b23c, 0xef6a6a, 0x48b58a][seed % 4], fruit: [0xd8322e, 0x8cc63f, 0xf2b632][seed % 3], box: [0xe14b3a, 0x2a70c9, 0xe88a1e][seed % 3], jam: 0x8d1f3f,
      label: [['CROC', 'FLOCONS'], ['MIEL', 'POPS'], ['ZOU', 'MUESLI']][seed % 3] };
    const kinds = MOODS[def.mood].props || CUISINE;
    const props = [];
    let n = 0;
    for (let tries = 0; tries < 900 && n < 34; tries++) {
      const kind = kinds[n % kinds.length];
      const g = PROPS[kind](Object.assign({ rot: rnd() * 6.28 }, pal));
      const inField = n < 14, span = inField ? 150 : 300;
      const x = (rnd() - 0.5) * span * 2, z = (rnd() - 0.5) * span * 2;
      if (Math.hypot(x, z) > PROP_REACH) continue;                     // au-delà : mer, collines lointaines
      const d = MB.trackDistance(t, x, z);
      if (d < t.width / 2 + g.r + 7) continue;
      if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + g.r + 3)) continue;
      bake(g);
      g.position.set(x, 0, z);
      scene.add(g);
      placed.push({ x, z, r: g.r });
      props.push({ kind, g, x, z, r: g.r });
      n++;
    }
    return props;
  }

  const blobTex = () => canvas(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    r.addColorStop(0, 'rgba(0,0,0,.7)'); r.addColorStop(0.7, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });
  const puffTex = () => canvas(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    r.addColorStop(0, 'rgba(255,255,255,.95)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });

  const WIND_N = 34;
  const honeyTex = () => canvas(256, 256, (g, W) => {
    const c = W / 2, lobes = [];
    for (let i = 0; i < 9; i++) lobes.push(0.74 + 0.17 * Math.sin(i * 2.4) + 0.08 * Math.cos(i * 5.1));
    const blob = (k) => {
      g.beginPath();
      for (let a = 0; a <= 72; a++) {
        const t = (a / 72) * Math.PI * 2, u = (a / 72) * 9, i = Math.floor(u) % 9, f = u - Math.floor(u), e = f * f * (3 - 2 * f);
        const r = (lobes[i] * (1 - e) + lobes[(i + 1) % 9] * e) * c * k;
        const x = c + Math.cos(t) * r, y = c + Math.sin(t) * r;
        a ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
    };
    g.fillStyle = 'rgba(60,28,0,.42)'; blob(1.07); g.fill();                 // ombre portée sur la piste
    const gr = g.createRadialGradient(c, c, 8, c, c, c * 0.95);
    gr.addColorStop(0, '#ffdc62'); gr.addColorStop(0.45, '#fbb125'); gr.addColorStop(0.8, '#de7c0c'); gr.addColorStop(1, '#a4530a');
    g.fillStyle = gr; blob(1); g.fill();
    g.strokeStyle = 'rgba(255,226,130,.75)'; g.lineWidth = 5; blob(0.88); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.85)';                                    // reflets humides
    g.beginPath(); g.ellipse(c - 42, c - 46, 34, 11, -0.6, 0, 7); g.fill();
    g.beginPath(); g.ellipse(c + 34, c + 30, 15, 6, -0.5, 0, 7); g.fill();
    g.beginPath(); g.arc(c - 8, c - 74, 6, 0, 7); g.fill();
    g.fillStyle = '#f0a01c';                                                  // gouttes tombées autour
    for (const [x, y, r] of [[28, 60, 9], [226, 92, 7], [206, 222, 10], [44, 206, 6]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  });

  // Silhouettes de l'horizon (deux couronnes autour du circuit) : elles donnent de la profondeur derrière le décor.
  // Les fréquences sont entières pour que la bande se raccorde sur elle-même.
  function hillsTexture(kind, col, near, seed) {
    let sd = seed * 104729 + (near ? 7 : 3);
    const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd % 100000) / 100000; };
    const t = canvas(1024, 256, (g, W, H) => {
      g.fillStyle = col;
      const thrice = (f) => { for (const o of [-W, 0, W]) f(o); };
      const wave = (base, amps) => {
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) { let y = base; for (const [a, f, ph] of amps) y -= a * Math.sin((x / W) * Math.PI * 2 * f + ph); g.lineTo(x, y); }
        g.lineTo(W, H); g.closePath(); g.fill();
      };
      const rrect = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.lineTo(x + w, H); g.lineTo(x, H); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); };
      if (kind === 'dunes') {
        if (near) wave(214, [[16, 3, seed], [7, 8, seed * 2]]);
        else { wave(178, [[34, 2, seed], [14, 5, seed * 3]]); g.fillStyle = 'rgba(255,255,255,.25)'; wave(214, [[6, 11, seed]]); }
      } else if (kind === 'collines') {
        if (!near) wave(160, [[34, 2, seed], [16, 5, seed * 2]]);
        else {
          wave(236, [[4, 13, seed]]);
          for (let x = 0; x < W; x += 22 + rnd() * 26) {
            const r = 16 + rnd() * 18, y = 228 - r * 0.9;
            thrice((o) => { g.beginPath(); g.arc(x + o, y, r, 0, 7); g.arc(x + o + r * 0.6, y + r * 0.35, r * 0.7, 0, 7); g.fill(); });
          }
        }
      } else if (kind === 'monts') {
        if (!near) {
          for (let x = 0; x < W; x += 90 + rnd() * 110) {
            const h = 70 + rnd() * 80, b = h * (1 + rnd() * 0.6), top = 238 - h;
            thrice((o) => {
              g.fillStyle = col; g.beginPath(); g.moveTo(x + o - b, 240); g.quadraticCurveTo(x + o, top - 18, x + o + b, 240); g.fill();
              g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.moveTo(x + o - b * 0.32, top + h * 0.3); g.quadraticCurveTo(x + o, top - 12, x + o + b * 0.32, top + h * 0.3);
              g.quadraticCurveTo(x + o, top + h * 0.22, x + o - b * 0.32, top + h * 0.3); g.fill();
            });
          }
        } else {
          wave(238, [[3, 9, seed]]);
          for (let x = 0; x < W; x += 12 + rnd() * 18) {
            const h = 34 + rnd() * 46, b = h * 0.32;
            thrice((o) => {
              g.fillStyle = col; g.beginPath(); g.moveTo(x + o - b, 240); g.lineTo(x + o, 240 - h); g.lineTo(x + o + b, 240); g.fill();
              g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(x + o - b * 0.3, 240 - h * 0.7); g.lineTo(x + o, 240 - h); g.lineTo(x + o + b * 0.3, 240 - h * 0.7); g.fill();
            });
          }
        }
      } else if (kind === 'skyline') {
        for (let x = 0; x < W; x += 26 + rnd() * 40) {
          const w = 24 + rnd() * 44, h = (near ? 50 : 80) + rnd() * (near ? 70 : 110), y = 244 - h, lit = rnd();
          thrice((o) => {
            g.fillStyle = col; rrect(x + o, y, w, h, 3);
            g.fillStyle = `rgba(255,217,138,${near ? 0.7 : 0.45})`;
            for (let wy = y + 6; wy < 238; wy += 9) for (let wx = x + o + 4; wx < x + o + w - 5; wx += 8) if (Math.sin(wx * 12.9 + wy * 78.2 + lit * 40) > 0.25) g.fillRect(wx, wy, 3.5, 4);
          });
        }
      } else if (kind === 'chambre') {                             // chambre : lit, armoire, bureau et lampe, coffre et étagères
        if (!near) for (let x = 0; x < W; x += 170 + rnd() * 120) {
          const k = rnd();
          thrice((o) => {
            if (k < 0.35) { rrect(x + o, 170, 160, 74, 12); rrect(x + o, 120, 26, 124, 8); }                 // lit et tête de lit
            else if (k < 0.7) { rrect(x + o, 70, 90, 174, 8); }                                                 // armoire
            else { g.fillRect(x + o, 168, 120, 10); g.fillRect(x + o + 8, 178, 8, 66); g.fillRect(x + o + 104, 178, 8, 66); g.fillRect(x + o + 80, 120, 6, 48); g.beginPath(); g.ellipse(x + o + 83, 118, 22, 12, 0, Math.PI, 0); g.fill(); }
          });
        } else for (let x = 0; x < W; x += 60 + rnd() * 80) {
          const k = rnd(), w2 = 40 + rnd() * 50, h2 = 30 + rnd() * 50;
          thrice((o) => { if (k < 0.5) rrect(x + o, 244 - h2, w2, h2, 6); else { g.beginPath(); g.arc(x + o + 20, 226, 18, 0, 7); g.fill(); } });
        }
      } else {                                                      // cuisine : bocaux, bouteilles, bouilloire sur le plan de travail
        if (!near) for (let x = 0; x < W; x += 140 + rnd() * 120) { const w = 110 + rnd() * 110, h = 90 + rnd() * 80; thrice((o) => rrect(x + o, 244 - h, w, h, 14)); }
        else {
          for (let x = 0; x < W; x += 40 + rnd() * 60) {
            const k = rnd(), w = 26 + rnd() * 34, h = 40 + rnd() * 70;
            thrice((o) => {
              if (k < 0.4) { rrect(x + o, 244 - h, w, h, 8); g.fillRect(x + o + 3, 244 - h - 8, w - 6, 10); }        // bocal et couvercle
              else if (k < 0.75) { rrect(x + o, 244 - h, w * 0.6, h, 6); g.fillRect(x + o + w * 0.18, 244 - h - 26, w * 0.24, 30); }   // bouteille
              else { g.beginPath(); g.ellipse(x + o + w / 2, 244, w * 0.8, h * 0.8, 0, Math.PI, 0); g.fill(); g.fillRect(x + o + w / 2 - 4, 244 - h * 0.8 - 8, 8, 10); }   // bouilloire
            });
          }
        }
      }
    });
    t.wrapT = T.ClampToEdgeWrapping;
    return t;
  }

  // Ambiance d'une variante : nuit (sombre, bleutée, phares) ou pluie (gris, brume plus proche, gouttes).
  function variantMood(m, v) {
    if (v === 'nuit') return Object.assign({}, m, { sky: 0x10142e, fog: [150, 520], hemi: [0x7f90d8, 0x1d1a30, 0.55], sun: [0xaab8ff, 0.3], night: true, nightVariant: true,
      back: ['#070a1c', '#141a3a', '#1e2450'], glow: ['rgba(255,220,150,.35)', 'rgba(80,110,200,.35)'], hills: m.hills && [m.hills[0], '#1c2248', '#11152f'], snow: false });
    if (v === 'pluie') return Object.assign({}, m, { sky: 0x98a5b3, fog: [110, 460], hemi: [0xc9d3dd, 0x5a6470, 0.72], sun: [0xd0dae6, 0.2], rain: true, snow: false,
      back: ['#7f8c99', '#a9b4bf', '#8a95a1'], glow: ['rgba(255,255,255,.3)', 'rgba(120,140,160,.3)'], hills: m.hills && [m.hills[0], '#8792a0', '#6d7886'] });
    return m;
  }

  const clampPitch = (v) => (v > 0.22 ? 0.22 : v < -0.22 ? -0.22 : v);
  const QUALITY_KEY = 'minibolides.lowq';
  const lowQuality = () => { try { return localStorage.getItem(QUALITY_KEY) === '1'; } catch (e) { return false; } };
  const rememberLow = () => { try { localStorage.setItem(QUALITY_KEY, '1'); } catch (e) { /* stockage indisponible */ } };

  class View {
    constructor(el) {
      this.r = new T.WebGLRenderer({ canvas: el, antialias: true, powerPreference: 'high-performance' });
      this.calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.shakeA = 0;
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      this.r.setPixelRatio(this.pixelRatio);
      this.r.outputEncoding = T.sRGBEncoding;
      this.r.toneMapping = T.ACESFilmicToneMapping;
      this.r.toneMappingExposure = 1.05;
      this.shadows = !lowQuality();
      this.lite = !this.shadows;                               // décor animé allégé sur les téléphones modestes
      this.r.shadowMap.enabled = this.shadows;
      this.r.shadowMap.type = T.PCFShadowMap;                    // PCF simple : bien moins de lectures par pixel que la version douce
      this.cam = new T.PerspectiveCamera(64, 1, 1, 900);
      this.camH = 0; this.fov = 64; this.t = 0; this.pose = {}; this.finA = 0;
      this.frames = 0; this.fpsT = 0;
      this.blob = blobTex(); this.puff = puffTex();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.r.setSize(w, h, false);
      this.cam.aspect = w / h;
      this.cam.updateProjectionMatrix();
    }

    // Qualité adaptative : si le téléphone peine, on baisse la résolution une fois pour toutes.
    _adapt(dt) {
      this.frames++; this.fpsT += dt;
      if (this.fpsT < 2.5) return;
      const fps = this.frames / this.fpsT;
      this.frames = 0; this.fpsT = 0;
      this.fps = fps;
      if (fps >= 50) return;
      if (this.pixelRatio > 1) { this.pixelRatio = Math.max(1, this.pixelRatio - 0.35); this.r.setPixelRatio(this.pixelRatio); this.resize(); return; }
      if (this.shadows) {                                     // dernier recours, mémorisé pour les prochains lancements
        this.shadows = false;                                 // recompiler fige l'image : on attend la prochaine course
        this.lite = true;
        this.dropShadows = true;
        rememberLow();
      }
    }

    _applyShadows() {
      this.dropShadows = false;
      this.sun.castShadow = false;
      this.r.shadowMap.enabled = false;
      this.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); });
    }

    // Ciel de studio converti en carte de reflets : c'est lui qui donne l'aspect "vraie carrosserie".
    _env(mood) {
      const sc = new T.Scene(), c = document.createElement('canvas'); c.width = 16; c.height = 256;
      const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256), night = !!mood.night;
      gr.addColorStop(0, night ? '#39487e' : '#ffffff'); gr.addColorStop(0.46, night ? '#1a2148' : '#dfeafa');
      gr.addColorStop(0.52, night ? '#0b0c18' : '#6b5238'); gr.addColorStop(1, night ? '#060710' : '#3b2a1c');
      g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
      const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
      sc.add(new T.Mesh(new T.SphereGeometry(50, 24, 16), new T.MeshBasicMaterial({ map: tx, side: T.BackSide })));
      for (const [x, z] of [[20, 10], [-16, 22], [6, -26]]) {                 // boîtes lumineuses : reflets nets sur la peinture
        const l = new T.Mesh(new T.BoxGeometry(18, 2, 7), new T.MeshBasicMaterial({ color: new T.Color(6, 6, 6) })); l.position.set(x, 30, z); l.lookAt(0, 0, 0); sc.add(l);
      }
      const pm = new T.PMREMGenerator(this.r), rt = pm.fromScene(sc, 0.03);
      pm.dispose();
      return rt.texture;
    }

    // Les couleurs hexadécimales sont définies en sRGB : on les passe une seule fois en linéaire.
    _linear(root) {
      root.traverse((o) => {
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of ms) if (m.color && !m.userData.lin) { m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); m.userData.lin = true; }
        if (o.isMesh) o.receiveShadow = true;
      });
    }

    dispose() {
      if (!this.scene) return;
      this.scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of ms) { if (m.map && m.map !== this.blob && m.map !== this.puff) m.map.dispose(); m.dispose(); }
      });
      if (this.scene.background && this.scene.background.dispose) this.scene.background.dispose();
      if (lam.env) { lam.env.dispose(); lam.env = null; }
      this.scene = null;
    }

    world(track) {
      this.dispose();
      this.shop = null; this.shopKey = null;
      this.pads = [];
      const mood = variantMood(MOODS[track.def.mood], track.variant), s = (this.scene = new T.Scene());
      this.mood = mood;
      // Mur de cuisine flou en arrière-plan, avec la lueur d'une fenêtre.
      s.background = canvas(512, 512, (g, W, H) => {
        const night = !!mood.night, sky = g.createLinearGradient(0, 0, 0, H), b = mood.back || (night ? ['#0b1024', '#1b2346', '#2a2f55'] : ['#efe3d0', '#fff3df', '#e9d3b4']);
        const glow = mood.glow || (night ? ['rgba(255,190,110,.55)', 'rgba(70,90,160,.5)'] : ['rgba(255,255,255,.95)', 'rgba(160,190,150,.5)']);
        sky.addColorStop(0, b[0]); sky.addColorStop(0.55, b[1]); sky.addColorStop(1, b[2]);
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        // Lueurs en dégradé radial : le flou de canvas (filter) n'est pas fiable sur le téléphone et laissait des rectangles à bords nets.
        const halo = (cx, cy, rx, ry, col) => {
          g.save(); g.translate(cx, cy); g.scale(rx, ry);
          const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
          gr.addColorStop(0, col); gr.addColorStop(0.45, col.replace(/[\d.]+\)$/, (a) => parseFloat(a) * 0.55 + ')')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
          g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
        };
        halo(W * 0.74, H * 0.33, W * 0.26, H * 0.3, glow[0]);
        halo(W * 0.2, H * 0.39, W * 0.2, H * 0.22, glow[1]);
      });
      s.fog = new T.Fog(mood.sky, mood.fog[0], mood.fog[1]);
      lam.env = this._env(mood);
      s.add(new T.HemisphereLight(mood.hemi[0], mood.hemi[1], mood.hemi[2] * 0.75));
      const sun = new T.DirectionalLight(mood.sun[0], mood.sun[1] * 2.6); s.add(sun, sun.target);
      sun.castShadow = this.shadows; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006; sun.shadow.radius = 3;
      Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 320 });
      this.sun = sun;

      const gt = groundTexture(mood.ground); gt.repeat.set(9, 9);
      const ground = new T.Mesh(new T.PlaneGeometry(1800, 1800), new T.MeshStandardMaterial({ map: gt, roughness: 0.45, envMap: lam.env, envMapIntensity: 0.55 }));
      ground.rotation.x = -Math.PI / 2; s.add(ground);

      // Horizon : deux couronnes de silhouettes que le brouillard estompe (lointaine puis proche).
      let far = 0;
      for (let i = 0; i < track.count; i++) far = Math.max(far, Math.hypot(track.px[i], track.pz[i]));
      this.horizon = Math.min(Math.max(far + 260, 420), 540);
      // Arrière-plan peint sur trois plans (ciel, lointain, second plan) ; #decor=1 garde les anciennes silhouettes unies.
      if (MB.backdrop && !/decor=1/.test(location.hash)) MB.backdrop(s, mood, track, this.horizon);
      else if (mood.hills) mood.hills.slice(1).forEach((col, k) => {
        const tex = hillsTexture(mood.hills[0], col, k === 1, track.def.seed), r = this.horizon + (k ? 0 : 110), H = k ? 120 : 170;
        tex.repeat.set(k ? 4 : 3, 1);
        const ring = new T.Mesh(new T.CylinderGeometry(r, r, H, 160, 1, true), new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.BackSide, depthWrite: false }));
        ring.position.y = H / 2 - 3; ring.renderOrder = k - 2; s.add(ring);
      });

      const w = track.width / 2;
      const road = roadTexture(mood.road);
      // Pluie : route mouillée, plus sombre et brillante (le ciel s'y reflète).
      s.add(ribbon(track, -w, w, 0.14, 0.14, 12, new T.MeshStandardMaterial(mood.rain ? { map: road, color: 0xaab2bd, roughness: 0.28, metalness: 0.15, envMap: lam.env, envMapIntensity: 1.4 } : { map: road, roughness: 0.82 })));
      const kc = mood.kerb || ['#e5352b', '#ffffff'], kerb = stripeTexture(kc[0], kc[1]);
      const wallMat = new T.MeshLambertMaterial({ map: kerb, side: T.DoubleSide }), gapL = track.wallGap[-1], gapR = track.wallGap[1];
      s.add(ribbon(track, -w - 1.5, -w, 0.2, 0.2, 7, new T.MeshLambertMaterial({ map: kerb }), gapL));
      s.add(ribbon(track, w, w + 1.5, 0.2, 0.2, 7, new T.MeshLambertMaterial({ map: kerb }), gapR));
      s.add(wallStrip(track, -w - 1.5, wallMat, gapL));
      s.add(wallStrip(track, w + 1.5, wallMat, gapR));
      // Bas-côté : une bande douce entre le mur et le sol, au lieu d'une coupure nette.
      const vergeTex = canvas(64, 4, (g, W, H) => {
        const gr = g.createLinearGradient(0, 0, W, 0);
        gr.addColorStop(0, `rgba(${mood.verge},.5)`); gr.addColorStop(0.35, `rgba(${mood.verge},.26)`); gr.addColorStop(1, `rgba(${mood.verge},0)`);
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      });
      vergeTex.wrapS = T.ClampToEdgeWrapping;
      const verge = new T.MeshLambertMaterial({ map: vergeTex, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      s.add(ribbon(track, -w - 1.7, -w - 9, 0.03, 0.03, 40, verge), ribbon(track, w + 1.7, w + 9, 0.03, 0.03, 40, verge));

      // Raccourcis : même route et mêmes bordures que le circuit, posée juste sous lui pour que la bifurcation se fonde.
      const branchRoad = new T.MeshStandardMaterial({ map: road, roughness: 0.82, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
      for (const p of track.shortcuts) {
        const hw = p.width / 2;
        s.add(ribbon(p, -hw, hw, 0.13, 0.13, 12, branchRoad));
        for (const k of [-1, 1]) {
          const hole = p.wallHole[k], a = k * hw, b = k * (hw + 1);
          s.add(ribbon(p, Math.min(a, b), Math.max(a, b), 0.2, 0.2, 7, new T.MeshLambertMaterial({ map: kerb }), hole));
          s.add(wallStrip(p, b, wallMat, hole));
          s.add(ribbon(p, b + k * 0.2, b + k * 7.5, 0.03, 0.03, 40, verge, hole));
        }
        // Dalle turbo de sortie : flèches orange qui défilent, la poussée se voit avant de se sentir.
        const padTex = canvas(128, 128, (g, W, H) => {
          g.fillStyle = '#ff7a1a'; g.fillRect(0, 0, W, H);
          g.strokeStyle = '#ffe14d'; g.lineWidth = 18; g.lineJoin = 'miter';
          g.lineWidth = 26; g.beginPath(); g.moveTo(10, 104); g.lineTo(W / 2, 30); g.lineTo(W - 10, 104); g.stroke();
        });
        padTex.wrapS = padTex.wrapT = T.RepeatWrapping;
        const pe = p.padEnd + 1, pad = { open: true, count: pe - p.pad, length: (pe - p.pad) * p.ds, px: p.px.slice(p.pad, pe), pz: p.pz.slice(p.pad, pe), tx: p.tx.slice(p.pad, pe), tz: p.tz.slice(p.pad, pe) };
        const padMesh = ribbon(pad, -hw + 1, hw - 1, 0.19, 0.19, 7, new T.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.92 }));
        this.pads.push(padTex);
        s.add(padMesh);
        const i = (p.a - 26 + track.count) % track.count, sign = new T.Sprite(new T.SpriteMaterial({ map: canvas(256, 128, (g, W, H) => {
          g.fillStyle = '#ffd23f'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2b2230'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
          g.fillStyle = '#2b2230'; g.font = '900 96px Arial Black, Arial'; g.textAlign = 'center'; g.fillText(p.side > 0 ? '»»' : '««', W / 2, 100);
        }) }));
        // Porte d'entrée : deux poteaux rayés au bord, le passage est entre eux, contre le mur.
        const postMat = new T.MeshLambertMaterial({ map: stripeTexture('#ffd23f', '#2b2230') });
        for (const k of [0, p.door]) {
          const m = (p.a + k + track.count) % track.count, post = new T.Mesh(new T.CylinderGeometry(0.55, 0.65, 5, 12), postMat);
          post.position.set(track.px[m] - track.tz[m] * p.side * (w + 1.2), 2.5, track.pz[m] + track.tx[m] * p.side * (w + 1.2));
          post.castShadow = true; s.add(post);
        }
        // Plots en slalom dans le raccourci : gros bidons rayés rouge et blanc, coiffés de jaune.
        const plotMat = new T.MeshLambertMaterial({ map: stripeTexture('#e5352b', '#fff6e6') }), capMat = new T.MeshLambertMaterial({ color: 0xffd23f });
        for (const o of p.obst) {
          const body = new T.Mesh(new T.CylinderGeometry(o.r * 0.92, o.r, 2.4, 20), plotMat), cap = new T.Mesh(new T.SphereGeometry(o.r * 0.92, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
          body.position.set(o.x, 1.2, o.z); cap.position.set(o.x, 2.4, o.z); body.castShadow = cap.castShadow = true; s.add(body, cap);
        }
        sign.scale.set(12, 6, 1);
        sign.position.set(track.px[i] - track.tz[i] * p.side * (w + 7), 8, track.pz[i] + track.tx[i] * p.side * (w + 7));
        s.add(sign);
        // Chevrons au sol : ils glissent vers le côté du raccourci jusqu'à son entrée.
        const chevron = new T.MeshBasicMaterial({ transparent: true, map: canvas(128, 128, (g, W, H) => {
          g.strokeStyle = '#ffd23f'; g.lineWidth = 22; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(14, H - 22); g.lineTo(W / 2, 26); g.lineTo(W - 14, H - 22); g.stroke();
        }) });
        for (let k = 0; k < 6; k++) {
          const q = (p.a - 22 + k * 5 + track.count) % track.count, lat = p.side * (0.8 + k * 0.7), c = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), chevron), turn = -p.side * 0.28;
          c.rotation.x = -Math.PI / 2;
          c.rotation.z = -Math.atan2(track.tz[q], track.tx[q]) - Math.PI / 2 + turn;
          c.position.set(track.px[q] - track.tz[q] * lat, 0.22, track.pz[q] + track.tx[q] * lat);
          s.add(c);
        }
      }

      // Tremplins : plan incliné qui se termine exactement au point de décollage de la simulation.
      const rampTex = canvas(128, 128, (g, W, H) => {
        g.fillStyle = '#ffd23f'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e5352b'; g.lineWidth = 16;
        for (let y = -20; y < H + 40; y += 44) { g.beginPath(); g.moveTo(0, y + 30); g.lineTo(W / 2, y); g.lineTo(W, y + 30); g.stroke(); }
      });
      rampTex.wrapS = rampTex.wrapT = T.RepeatWrapping; rampTex.repeat.set(3, 1);
      const rampMat = new T.MeshStandardMaterial({ map: rampTex, roughness: 0.6 });
      for (const j of track.jumps) {
        const q = new T.Group(), plank = new T.Mesh(new T.BoxGeometry(track.width, 0.35, 10.2), rampMat), m = (j - 2.5 + track.count) % track.count, mi = Math.floor(m);
        q.position.set(track.px[mi], 0.8, track.pz[mi]);
        q.rotation.y = Math.atan2(track.tx[mi], track.tz[mi]);
        plank.rotation.x = -Math.atan2(1.6, 10);
        q.add(plank); s.add(q);
      }

      const check = canvas(64, 16, (g) => {
        for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 4, y * 4, 4, 4); }
      });
      const line = new T.Mesh(new T.PlaneGeometry(track.width, 4), new T.MeshLambertMaterial({ map: check }));
      line.rotation.x = -Math.PI / 2;
      line.rotation.z = -Math.atan2(track.tz[0], track.tx[0]) + Math.PI / 2;
      line.position.set(track.px[0], 0.2, track.pz[0]);
      s.add(line);
      // Portique de départ en pailles
      const nx = -track.tz[0], nz = track.tx[0], pole = new T.CylinderGeometry(0.5, 0.5, 15, 8), poleM = lam(0xffffff);
      this.poles = [-1, 1].map((k) => {
        const p = new T.Mesh(pole, poleM); p.position.set(track.px[0] + nx * k * (w + 2.5), 7.5, track.pz[0] + nz * k * (w + 2.5)); s.add(p);
        return p;
      });
      const banner = new T.Mesh(new T.PlaneGeometry(track.width + 5, 3), new T.MeshBasicMaterial({ side: T.DoubleSide, map: canvas(512, 64, (g, W, H) => {
        g.fillStyle = '#e5352b'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '900 40px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('MINI BOLIDES', W / 2, 47);
      }) }));
      banner.position.set(track.px[0], 14, track.pz[0]);
      banner.rotation.y = Math.atan2(-nz, nx);
      s.add(banner);

      const placed = [];
      this.life = MB.Life ? new MB.Life(this, s, track, mood, placed) : null;   // personnages et bêtes, placés avant le décor
      const before = s.children.length;
      const props = scatter(s, track, track.def, track.def.seed, placed);
      for (const g of s.children.slice(before)) g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      // Ombre douce sous chaque objet : il est posé, il ne flotte plus, même loin de l'ombre portée du soleil.
      const blobMat = new T.MeshBasicMaterial({ map: this.blob, transparent: true, depthWrite: false, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
      const blobGeo = new T.PlaneGeometry(1, 1); blobGeo.rotateX(-Math.PI / 2);
      for (const p of props) if (!p.g.flat) { const b = new T.Mesh(blobGeo, blobMat); b.scale.set(p.r * 2.3, 1, p.r * 2.3); b.position.set(p.x, 0.05, p.z); s.add(b); }
      if (this.life) this.life.props(props);
      s.fog.color.convertSRGBToLinear();
      this._linear(s);
      // Seuls le sol, la piste et les voitures reçoivent les ombres : les objets du décor n'en calculent plus pixel par pixel.
      for (const p of props) p.g.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
      this.track = track;
      this.carMeshes = []; this.boxes = []; this.coins = []; this.syrups = []; this.toyG = null;
      this._fx();
      this._weather(mood);
    }

    // Neige : un seul nuage de points qui suit le joueur, peu coûteux même sur petit téléphone.
    _weather(mood) {
      this.snow = null; this.rain = null;
      if (mood.rain) {                                         // pluie : traits fins qui tombent en biais autour du joueur
        const n = 420, pos = new Float32Array(n * 6);
        for (let i = 0; i < n; i++) { const x = (Math.random() - 0.5) * 80, y = Math.random() * 30, z = (Math.random() - 0.5) * 80; pos.set([x, y, z, x + 0.25, y + 1.6, z + 0.12], i * 6); }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
        this.rain = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xd8e6f5, transparent: true, opacity: 0.45, depthWrite: false }));
        this.rain.frustumCulled = false; this.scene.add(this.rain);
      }
      if (!mood.snow) return;
      const n = 320, pos = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i += 3) { pos[i] = (Math.random() - 0.5) * 90; pos[i + 1] = Math.random() * 40; pos[i + 2] = (Math.random() - 0.5) * 90; }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      this.snow = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 0.42, transparent: true, opacity: 0.85, depthWrite: false }));
      this.scene.add(this.snow);
    }

    shake(a) { if (!this.calm) this.shakeA = Math.max(this.shakeA, a * 0.3); }

    confetti() {
      const p = this.race.player, cols = [0xe5352b, 0xffd23f, 0x25b98a, 0x2f62d9, 0xf0639a];
      for (let i = 0; i < 30; i++) this._puff(p.x + (Math.random() - 0.5) * 16, 2 + Math.random() * 7, p.z + (Math.random() - 0.5) * 16, cols[i % 5], 1.5, 1.2);
      this.lapFx(true);
    }

    // Pluie de confettis sous le portique à chaque tour bouclé.
    lapFx(big) { if (this.life) this.life.burst(big ? 150 : 80); }

    _skid(x, z, h) {
      const m = this.skidM, o = this.skidO;
      o.position.set(x, 0.19, z); o.rotation.set(-Math.PI / 2, 0, -h); o.updateMatrix();
      m.setMatrixAt(this.skidN = (this.skidN + 1) % m.count, o.matrix);
      m.instanceMatrix.needsUpdate = true;
    }

    _fx() {
      this.puffs = [];
      this.skidM = new T.InstancedMesh(new T.PlaneGeometry(1.9, 0.5), new T.MeshBasicMaterial({ color: 0x15151a, transparent: true, opacity: 0.34, depthWrite: false }), 220);
      this.skidO = new T.Object3D(); this.skidN = 0;
      this.skidO.scale.set(0, 0, 0); this.skidO.updateMatrix();
      for (let i = 0; i < 220; i++) this.skidM.setMatrixAt(i, this.skidO.matrix);
      this.skidO.scale.set(1, 1, 1);
      this.skidM.frustumCulled = false; this.scene.add(this.skidM);
      for (let i = 0; i < 52; i++) {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: this.puff, transparent: true, depthWrite: false, opacity: 0 }));
        sp.visible = false; this.scene.add(sp);
        this.puffs.push({ sp, life: 0, max: 1, vy: 0, grow: 0 });
      }
      this.nextPuff = 0;
      this.boxGeo = new T.BoxGeometry(2.2, 2.2, 2.2);
      this.boxMat = new T.MeshLambertMaterial({ transparent: true, opacity: 0.9, map: canvas(128, 128, (g, w, h) => {
        const r = g.createLinearGradient(0, 0, w, h); r.addColorStop(0, '#ffd23f'); r.addColorStop(1, '#ff7f50');
        g.fillStyle = r; g.fillRect(0, 0, w, h);
        g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(5, 5, w - 10, h - 10);
        g.fillStyle = '#fff'; g.font = '900 86px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('?', w / 2, 96);
      }) });
      this.coinGeo = new T.CylinderGeometry(1.15, 1.15, 0.28, 16); this.coinGeo.rotateZ(Math.PI / 2);
      this.coinMat = new T.MeshStandardMaterial({ color: 0xffc62e, emissive: 0x6a4300, metalness: 0.85, roughness: 0.25, envMap: lam.env, envMapIntensity: 1.5 });
      this.marbleGeo = new T.SphereGeometry(1.1, 24, 16); this.marbleMeshes = [];
      this.marbleMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85, envMap: lam.env, envMapIntensity: 1.6, map: canvas(64, 32, (g, W, H) => { g.fillStyle = '#3f8fe0'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(W * 0.3, H * 0.5, 9, 14, 0.4, 0, 7); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(W * 0.75, H * 0.5, 6, 12, -0.4, 0, 7); g.fill(); }) });
      this.honeyTex = honeyTex(); this.honeyTex.encoding = T.sRGBEncoding;
      this.honeyGeo = new T.PlaneGeometry(10.5, 10.5);
      this.honeyMat = new T.MeshBasicMaterial({ map: this.honeyTex, transparent: true, depthWrite: false, toneMapped: false });
      this.domeGeo = new T.SphereGeometry(1, 14, 7);
      this.domeMat = new T.MeshStandardMaterial({ color: 0xd97a08, transparent: true, opacity: 0.3, depthWrite: false, roughness: 0.08, envMap: lam.env, envMapIntensity: 1.4 });
      this.jarMat = new T.SpriteMaterial({ map: canvas(96, 96, (g) => { g.font = '76px sans-serif'; g.textAlign = 'center'; g.fillText('🍯', 48, 76); }), transparent: true, depthWrite: false });
      // Vent de vitesse : de fines stries le long du décor, invisibles à petite allure.
      this.windM = new T.InstancedMesh(new T.BoxGeometry(1, 0.05, 0.05), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false }), WIND_N);
      this.windM.frustumCulled = false; this.windM.visible = false; this.scene.add(this.windM);
      this.wind = []; for (let i = 0; i < WIND_N; i++) this.wind.push({ x: 0, y: 0, z: 0, on: false });
      this.windO = new T.Object3D();
      this.flameMat = new T.SpriteMaterial({ map: this.puff, color: 0xff5a00, opacity: 0.8, transparent: true, depthWrite: false, depthTest: true, blending: T.AdditiveBlending, fog: false, toneMapped: false });
      this.ring = new T.Mesh(new T.RingGeometry(0.82, 1, 44), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, fog: false }));
      this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; this.ringT = 0; this.scene.add(this.ring);
      const mag = new T.Group();
      [0xe5352b, 0x2f8bff].forEach((col, i) => { const r = new T.Mesh(new T.TorusGeometry(3.7 + i * 0.5, 0.16, 8, 40), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); r.rotation.x = Math.PI / 2; r.position.y = 0.9 + i * 0.9; mag.add(r); });
      this.magnetRing = mag; mag.visible = false; this.scene.add(mag);
      const bubble = new T.SphereGeometry(3.5, 16, 12), bm = new T.MeshPhongMaterial({ color: 0x8fe8ff, emissive: 0x2a8fd0, emissiveIntensity: 0.9, transparent: true, opacity: 0.2, blending: T.AdditiveBlending, shininess: 140, depthWrite: false });
      this.bubble = new T.Mesh(bubble, bm); this.bubble.visible = false; this.scene.add(this.bubble);
    }

    bindRace(race, paints) {
      for (const c of race.cars) {
        const hex = c.isPlayer ? paints.player : paints.rivals[c.id % paints.rivals.length];
        const m = MB.buildCarHD(c.spec.shape, hex, lam.env);
        if (c.isPlayer) MB.styleCar(m, paints.look);
        const sh = new T.Mesh(new T.PlaneGeometry(7.4, 4.4), new T.MeshBasicMaterial({ map: this.blob, transparent: true, depthWrite: false }));
        sh.rotation.x = -Math.PI / 2; sh.position.y = 0.24;
        this.scene.add(m, sh);
        this.carMeshes.push({ m, sh, c });
      }
      for (const b of race.boxes) {
        const m = new T.Mesh(this.boxGeo, this.boxMat); m.position.set(b.x, 2.6, b.z); this.scene.add(m); this.boxes.push({ m, b });
      }
      for (const k of race.coins) {
        const m = new T.Mesh(this.coinGeo, this.coinMat); m.position.set(k.x, 1.7, k.z); this.scene.add(m); this.coins.push({ m, k });
      }
      // Jouet caché pas encore trouvé : il flotte, tourne et brille pour qu'on le repère de loin.
      this.toyG = null;
      const toyDef = race.toy && MB.TOYS.find((y) => y.track === this.track.def.id);
      if (toyDef && MB.TOY_MODELS) {
        const g = new T.Group(), toy = MB.TOY_MODELS[toyDef.id](); toy.scale.setScalar(3); g.add(toy); g.toy = toy;
        const halo = new T.Sprite(this.toyHaloMat || (this.toyHaloMat = new T.SpriteMaterial({ map: canvas(128, 128, (c) => { const r = c.createRadialGradient(64, 64, 2, 64, 64, 64); r.addColorStop(0, 'rgba(255,240,170,.95)'); r.addColorStop(0.4, 'rgba(255,214,90,.45)'); r.addColorStop(1, 'rgba(255,214,90,0)'); c.fillStyle = r; c.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false })));
        halo.scale.set(6, 6, 1); halo.position.y = 1.6; g.add(halo);
        const ring = new T.Mesh(new T.TorusGeometry(2.2, 0.1, 8, 40), new T.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.8 })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.4; g.add(ring);
        this._linear(g);
        g.position.set(race.toy.x, 0.6, race.toy.z); this.scene.add(g); this.toyG = g;
      }
      // De nuit, les phares du joueur éclairent la route devant lui.
      this.headlight = null;
      if (this.mood && this.mood.nightVariant) {
        const l = new T.SpotLight(0xfff0cc, 3.2, 70, 0.5, 0.55, 1.1); this.scene.add(l, l.target); this.headlight = l;
      }
      for (const e of this.carMeshes) { this._linear(e.m); e.pitch = 0; e.sq = 0; e.sqV = 0; e.air = false; e.fxT = 0; e.body0 = e.m.body.position.y; e.snap = 0; e.s0 = e.m.scale.x; e.trail = e.c.isPlayer && paints.look && paints.look.trail ? (MB.LOOKS.trail.find((q) => q.id === paints.look.trail) || MB.LOOKS.trail[0]).hex : 0xff5a00;
        e.flame = new T.Sprite(e.trail === 0xff5a00 ? this.flameMat : Object.assign(this.flameMat.clone(), { color: new T.Color(e.trail) })); e.flame.visible = false; this.scene.add(e.flame); }
      this.race = race;
      const p = race.player;
      this.camH = p.h;
      this.focX = p.x; this.focZ = p.z; this.camLift = 0;
      this.camBack = 13.6; this.camUp = 7.2; this.camAhead = 11; this.finA = 0;
      this.fov = 62; this.frames = 0; this.fpsT = 0;
      for (const w of this.wind) w.on = false;
      while (this.syrups.length < 2) this.syrups.push(this._honey());
      if (this.dropShadows) this._applyShadows();
      this.r.compile(this.scene, this.cam);                    // sinon chaque nouvel effet fige une image en pleine course
    }

    // Flaque de miel : nappe brillante, bosse translucide et pot qui flotte pour qu'on la reconnaisse de loin.
    _honey() {
      const g = new T.Group(), m = new T.Mesh(this.honeyGeo, this.honeyMat);
      m.rotation.x = -Math.PI / 2; m.position.y = 0.27; g.add(m);
      g.dome = new T.Mesh(this.domeGeo, this.domeMat); g.dome.scale.set(3.3, 0.2, 3.3); g.dome.position.y = 0.26; g.add(g.dome);
      g.jar = new T.Sprite(this.jarMat); g.jar.scale.set(3, 3, 1); g.add(g.jar);
      g.visible = false; this.scene.add(g);
      return g;
    }

    _ringFx(x, z, color, size) {
      this.ring.position.set(x, 0.4, z); this.ring.material.color.setHex(color); this.ring.visible = true; this.ringT = 0.45; this.ringS = size;
    }

    pickup() { const p = this.race.player; this._ringFx(p.x, p.z, 0xffd23f, 11); for (let i = 0; i < 7; i++) this._burst(p, 0xffd23f, 2.2, 0.5, 4); }

    _burst(c, color, size, life, spread) { this._puff(c.x + (Math.random() - 0.5) * spread, 1 + Math.random() * 3, c.z + (Math.random() - 0.5) * spread, color, size, life); }

    coinFx() { const p = this.race.player; this._puff(p.x, 2.4, p.z, 0xffe27a, 1.4, 0.22); }
    toyFx() {
      const p = this.race.player; this._ringFx(p.x, p.z, 0xffd23f, 14);
      for (let i = 0; i < 12; i++) this._burst(p, i % 2 ? 0xffd23f : 0xffffff, 2.4, 0.7, 6);
      if (this.toyG) this.toyG.visible = false;
    }

    itemFx(id, item) {
      const e = this.carMeshes.find((q) => q.c.id === id), c = e.c, col = item === 'elastique' ? 0xff8a1e : item === 'aimant' ? 0x2f8bff : item === 'bulle' ? 0x8fe8ff : item === 'ressort' ? 0x7ee05a : item === 'collant' ? 0x35c29a : item === 'tirelire' ? 0xff8fc0 : item === 'recharge' ? 0xffe14d : item === 'bille' ? 0x3f8fe0 : 0xf2a51c;
      this._ringFx(c.x, c.z, col, c.isPlayer ? 14 : 9);
      if (item === 'elastique') e.snap = 1;
      for (let i = 0; i < 8; i++) this._burst(c, col, 2.4, 0.5, 5);
    }

    splat(x, z, col) {
      const a = col || 0xf2a51c, b = col ? 0xffffff : 0xffd97a;
      this._ringFx(x, z, a, 10);
      for (let i = 0; i < 14; i++) this._puff(x + (Math.random() - 0.5) * 7, 0.8 + Math.random() * 3.5, z + (Math.random() - 0.5) * 7, i % 3 ? a : b, 1.6 + Math.random() * 1.8, 0.7);
    }

    pop(x, z) {
      this._ringFx(x, z, 0x8fe8ff, 13);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; this._puff(x + Math.cos(a) * 4, 1.8, z + Math.sin(a) * 4, 0xbff2ff, 1.6, 0.4); }
    }

    // Stries posées dans le décor de part et d'autre de la route : la vitesse les étire.
    _windFx(P, ratio, hot) {
      const on = !this.calm && ratio > 0.6, m = this.windM;
      m.visible = on;
      if (!on) return;
      const ch = Math.cos(P.h), sh = Math.sin(P.h), len = 2 + (ratio - 0.6) * 30 * (hot ? 1.5 : 1), O = this.windO;
      m.material.opacity = Math.min(0.5, (ratio - 0.6) * (hot ? 1.8 : 1.1)) * (this.mood && this.mood.night && !hot ? 0.35 : 1);
      m.material.color.setHex(hot ? 0xffd27a : 0xffffff);
      for (let i = 0; i < WIND_N; i++) {
        const w = this.wind[i], dx = w.x - P.x, dz = w.z - P.z, f = dx * ch + dz * sh;
        if (!w.on || f < -6 || f > 120) {
          const side = (i % 2 ? 1 : -1) * (11 + Math.random() * 15), d = 45 + Math.random() * 70;
          w.x = P.x + ch * d - sh * side; w.z = P.z + sh * d + ch * side; w.y = 1 + Math.random() * 9; w.on = true;
        }
        O.position.set(w.x, w.y, w.z); O.rotation.set(0, -P.h, 0); O.scale.set(len, 1, 1); O.updateMatrix();
        m.setMatrixAt(i, O.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }

    _puff(x, y, z, color, size, life) {
      const q = this.puffs[this.nextPuff = (this.nextPuff + 1) % this.puffs.length];
      q.sp.position.set(x, y, z); q.sp.visible = true; q.life = q.max = life; q.grow = size;
      q.sp.scale.set(size * 0.4, size * 0.4, 1);
      q.sp.material.color.setHex(color);
      if (this.mood && this.mood.night && color === 0xffffff) q.sp.material.color.setHex(0x59607a);   // la nuit, la fumée blanche ne doit pas briller comme un phare
    }

    _updateCars(dt, alpha) {
      const r = this.race, P = this.pose, soft = 1 - Math.exp(-dt * 10);
      const sdt = Math.min(dt, 0.033);
      for (const e of this.carMeshes) {
        const c = e.c, m = e.m;
        MB.pose(c, alpha, P);
        m.position.set(P.x, 0.2 + P.lift, P.z);
        const left = c.spin > 0 ? Math.min(c.spin, 1) : 0;     // tête-à-queue : deux tours qui ralentissent, sans saut d'angle
        const spin = left ? (1 - left * left) * Math.PI * 4 : 0;
        m.rotation.y = -P.h - P.slip - spin;
        m.body.rotation.x = P.slip * 0.28;
        const pitch = (c.boost > 0 ? 0.05 : 0) + (c.y > 0 ? clampPitch(c.vy * 0.016) : 0);
        e.pitch += (pitch - e.pitch) * soft;
        m.body.rotation.z = e.pitch;
        // Suspension : la voiture s'écrase un peu à l'atterrissage puis revient sans rebond sec.
        const air = c.y > 0;
        if (e.air && !air) e.sqV = -7;
        e.air = air;
        e.sqV += (-e.sq * 170 - e.sqV * 15) * sdt; e.sq += e.sqV * sdt;
        m.body.position.y = e.body0 + e.sq;
        e.snap = Math.max(0, e.snap - dt * 2.2);               // élastique : la voiture s'étire au départ
        const st = e.snap * e.snap;
        m.scale.set(e.s0 * (1 + 0.5 * st), e.s0 * (1 - 0.12 * st), e.s0 * (1 - 0.2 * st));
        e.flame.visible = c.boost > 0;
        if (c.boost > 0) {
          const fl = (c.boostPow > 1.25 ? 3.2 : 2.3) * (0.85 + 0.25 * Math.sin(this.t * 46 + c.id * 2));
          e.flame.position.set(P.x - Math.cos(P.h) * 3.6, 0.8 + P.lift, P.z - Math.sin(P.h) * 3.6); e.flame.scale.set(fl, fl, 1);
        }
        for (const w of m.wheels) {
          w.children[0].rotation.z = w.children[1].rotation.z -= c.v * dt / (w.k || 0.62);
          if (w.front) w.rotation.y = -c.steer * 0.4;
        }
        e.sh.position.x = P.x; e.sh.position.z = P.z; e.sh.rotation.z = -P.h - P.slip;
        if (e.bub) {
          e.bubT -= dt; e.bub.visible = e.bubT > 0;
          if (e.bub.visible) {
            e.bub.position.set(P.x, 6.2 + P.lift + (1.8 - e.bubT < 0.2 ? (1.8 - e.bubT) * 5 - 1 : 0), P.z);
            // Taille bornée à l'écran : un rival qui vient d'être doublé passe souvent tout près de la caméra,
            // et la bulle remplissait alors un tiers de l'écran. Trop près ou à moitié hors champ : on ne l'affiche pas.
            const d = e.bub.position.distanceTo(this.cam.position), view = 2 * d * Math.tan((this.cam.fov * Math.PI) / 360) * this.cam.aspect;
            const k = Math.min(1, (0.34 * view) / 8), ndc = bubV.copy(e.bub.position).project(this.cam);
            e.bub.scale.set(8 * k, 4 * k, 1);
            const fade = sstep(5, 8, d) * (1 - sstep(0.6, 0.78, Math.abs(ndc.x))) * (ndc.z < 1 ? 1 : 0);
            e.bub.material.opacity = Math.min(1, e.bubT * 3) * fade; e.bub.visible = fade > 0.02;
          }
        }
        const ss = Math.max(0.45, 1 - P.lift * 0.11); e.sh.scale.set(ss, ss, 1);
        // Fumée et traces à cadence fixe : même rendu à 60 ou 120 Hz, et moins de surdessin.
        e.fxT += dt;
        if (e.fxT >= 0.05) {
          e.fxT %= 0.05;
          const bx = P.x - Math.cos(P.h) * 2.4, bz = P.z - Math.sin(P.h) * 2.4;
          if (c.drifting) {
            const col = c.charge >= MB.DRIFT.L2 ? 0xff9a2e : c.charge >= MB.DRIFT.L1 ? 0x4fc3ff : 0xffffff, nx = -Math.sin(P.h) * 1.15, nz = Math.cos(P.h) * 1.15;
            for (const k of [-1, 1]) {
              if (Math.random() < 0.75) this._puff(bx + nx * k, 0.6, bz + nz * k, col, 3.6, 0.5);
              this._skid(bx + nx * k, bz + nz * k, P.h + P.slip);
            }
          }
          if (c.boost > 0) { this._puff(bx, 0.9, bz, e.trail === 0xff5a00 ? 0xffb03a : e.trail, 2.8, 0.26); if (Math.random() < 0.6) this._puff(bx, 0.9, bz, 0xffffff, 1.6, 0.16); }
          if (c.spin > 0 && Math.random() < 0.4) this._puff(P.x, 1.2, P.z, 0xc47a22, 2.8, 0.4);
        }
        if (c.isPlayer) {
          this.bubble.visible = c.shield > 0;
          if (c.shield > 0) {
            this.bubble.position.set(P.x, 1.8, P.z);
            const bs = 1 + Math.sin(this.t * 5) * 0.04; this.bubble.scale.set(bs, bs, bs);
            this.bubble.material.opacity = c.shield < 1.6 && Math.sin(this.t * 18) > 0 ? 0.06 : 0.2;   // clignote avant de s'éteindre
          }
          const ring = c.magnet > 0 || c.sticky > 0 || c.piggy > 0;
          this.magnetRing.visible = ring;
          if (ring) this.magnetRing.children.forEach((m, i) => m.material.color.setHex(c.magnet > 0 ? (i ? 0x2f8bff : 0xe5352b) : c.sticky > 0 ? 0x35c29a : 0xff8fc0));
          if (ring) { this.magnetRing.position.set(P.x, 0, P.z); this.magnetRing.rotation.y = this.t * 4; const ms = 1 + Math.sin(this.t * 9) * 0.09; this.magnetRing.scale.set(ms, 1, ms); }
        }
      }
      for (const b of this.boxes) {
        b.m.visible = b.b.wait <= 0;
        b.m.rotation.y = this.t * 1.6; b.m.rotation.x = this.t * 0.8;
      }
      if (this.toyG && this.toyG.visible) {
        if (this.race.toy.taken) this.toyG.visible = false;
        else { this.toyG.toy.rotation.y += dt * 1.6; this.toyG.position.y = 0.6 + Math.sin(this.t * 3) * 0.25; }
      }
      for (const k of this.coins) {
        k.m.visible = !k.k.taken;
        if (k.m.visible) k.m.position.set(k.k.x, 1.7, k.k.z);   // suit l'aimant et revient à sa place au tour suivant
        k.m.rotation.y = this.t * 3;
      }
      // Billes : verre bleu qui roule (position prolongée entre deux pas de simulation).
      while (this.marbleMeshes.length < r.marbles.length) {
        const m = new T.Mesh(this.marbleGeo, this.marbleMat); m.castShadow = true; this.scene.add(m); this.marbleMeshes.push(m);
      }
      this.marbleMeshes.forEach((m, i) => {
        const b = r.marbles[i];
        m.visible = !!b;
        if (!b) return;
        const ahead = b.v * (1 / 60) * alpha;
        m.position.set(b.x + Math.cos(b.h) * ahead, 1.1, b.z + Math.sin(b.h) * ahead);
        m.rotation.set(0, -b.h, 0); m.rotateZ(-b.roll / 1.1);
      });
      while (this.syrups.length < Math.max(r.syrups.length, 2)) this.syrups.push(this._honey());
      this.syrups.forEach((m, i) => {
        const s = r.syrups[i];
        m.visible = !!s;
        if (!s) return;
        m.position.set(s.x, 0, s.z);
        m.jar.position.y = 3.4 + Math.sin(this.t * 3 + i) * 0.35;
        m.dome.scale.y = 0.2 + Math.sin(this.t * 2.2 + i) * 0.03;  // le miel respire un peu, on voit qu'il est épais
      });
      if (this.ringT > 0) {
        this.ringT -= dt;
        const f = Math.max(this.ringT / 0.45, 0), sz = 2 + this.ringS * (1 - f);
        this.ring.scale.set(sz, sz, 1); this.ring.material.opacity = f * 0.85;
        if (this.ringT <= 0) this.ring.visible = false;
      }
      for (const q of this.puffs) {
        if (q.life <= 0) continue;
        q.life -= dt;
        const f = Math.max(q.life / q.max, 0), sz = q.grow * (1.4 - f);
        q.sp.scale.set(sz, sz, 1);
        q.sp.position.y += dt * 1.5;
        q.sp.material.rotation += dt;
        q.sp.material.opacity = f * 0.75;
        if (q.life <= 0) q.sp.visible = false;
      }
    }

    frameRace(dt, alpha) {
      this.t += dt; this.inReplay = false;
      if (this.poles && !this.poles[0].visible) for (const p of this.poles) p.visible = true;
      this._updateCars(dt, alpha);
      const p = this.race.player, P = MB.pose(p, alpha, this.pose), finished = p.finished;
      const ease = (k) => 1 - Math.exp(-dt * k);
      this._sun(P.x, P.z);
      // La caméra regarde entre le cap et la route : les petites corrections au doigt ne la balancent plus.
      const aim = P.h + MB.angleDiff(this.race._dirAt(p, 6), P.h) * 0.35;
      this.camH += MB.angleDiff(aim, this.camH) * ease(4.6);
      // Elle suit un point souple, en avance de son propre retard : à vitesse stable la distance ne change pas,
      // et un choc ou un mur amortissent au lieu de secouer tout l'écran.
      const lead = p.v / 12, ch = Math.cos(P.h), sh = Math.sin(P.h), kf = ease(12);
      this.focX += (P.x + ch * lead - this.focX) * kf;
      this.focZ += (P.z + sh * lead - this.focZ) * kf;
      const kc = ease(2.6), ratio = p.v / p.spec.vmax;
      this.camBack += ((finished ? 13 : p.boost > 0 ? (p.boostPow > 1.25 ? 17.5 : 16) : 13.6 + ratio * 0.6) - this.camBack) * kc;
      this.camUp += ((finished ? 5.5 : 7.2) - this.camUp) * kc;
      this.camAhead += ((finished ? 0 : 11) - this.camAhead) * kc;
      if (finished) this.finA += dt * 0.7;                     // à l'arrivée, elle tourne autour du vainqueur
      this.camLift += (P.lift * 0.35 - this.camLift) * ease(6);
      this.shakeA = Math.max(0, this.shakeA - dt * 0.9);
      const sk = this.shakeA, sx = sk ? Math.sin(this.t * 47) * sk : 0, sy = sk ? Math.sin(this.t * 61 + 1) * sk : 0;
      const a = this.camH + this.finA, cx = Math.cos(this.camH), cz = Math.sin(this.camH);
      this.cam.position.set(this.focX - Math.cos(a) * this.camBack + sx, this.camUp + this.camLift + sy, this.focZ - Math.sin(a) * this.camBack + sx);
      this.cam.lookAt(this.focX + cx * this.camAhead, 1.2 + this.camLift, this.focZ + cz * this.camAhead);
      if (this.rain) {
        this.rain.position.set(P.x, 0, P.z);
        const a = this.rain.geometry.attributes.position.array, fall = dt * 38;
        for (let i = 0; i < a.length; i += 6) { a[i + 1] -= fall; a[i + 4] -= fall; a[i] -= fall * 0.15; a[i + 3] -= fall * 0.15; if (a[i + 1] < 0) { a[i + 1] += 30; a[i + 4] += 30; a[i] += 4.5; a[i + 3] += 4.5; } }
        this.rain.geometry.attributes.position.needsUpdate = true;
      }
      if (this.headlight) {
        const hp = MB.pose(this.race.player, alpha, this._hp || (this._hp = {}));
        this.headlight.position.set(hp.x - Math.cos(hp.h) * 0.5, 2.6, hp.z - Math.sin(hp.h) * 0.5);
        this.headlight.target.position.set(hp.x + Math.cos(hp.h) * 30, 0, hp.z + Math.sin(hp.h) * 30);
      }
      if (this.snow) {
        this.snow.position.set(P.x, 0, P.z);
        const a = this.snow.geometry.attributes.position;
        for (let i = 1; i < a.array.length; i += 3) { a.array[i] -= dt * 7; if (a.array[i] < 0) a.array[i] += 40; }
        a.needsUpdate = true;
      }
      const want = p.boost > 0 ? (p.boostPow > 1.25 ? (this.calm ? 72 : 82) : 76) : 55 + ratio * ratio * 16;   // l'objectif s'ouvre nettement avec la vitesse : c'est lui qui la fait sentir
      this.fov += (want - this.fov) * ease(3);
      if (Math.abs(this.cam.fov - this.fov) > 0.01) { this.cam.fov = this.fov; this.cam.updateProjectionMatrix(); }
      this._windFx(P, finished ? 0 : ratio, p.boost > 0);
      for (const tx of this.pads || []) tx.offset.y -= dt * 1.6;      // les flèches de la dalle turbo avancent
      if (this.life) this.life.update(dt, this.t, P, this.race.cars, this.lite);
      this._adapt(dt);
      this.r.render(this.scene, this.cam);
      if (this.onSnap) { const cb = this.onSnap; this.onSnap = null; cb(this.snapshot()); }
    }

    // Ralenti de l'arrivée : poses enregistrées (a, b, interpolées par u), caméra posée au bord de la piste près de la ligne.
    replay(a, b, u, pid, close, dt) {
      const t = this.track, w = t.width / 2, lerp = (k) => a[k] + (b[k] - a[k]) * u;
      let px = 0, pz = 0;
      this.carMeshes.forEach((e, i) => {
        const o = 1 + i * 5, x = lerp(o), z = lerp(o + 1), h = a[o + 2] + MB.angleDiff(b[o + 2], a[o + 2]) * u, slip = lerp(o + 3), lift = lerp(o + 4);
        const moved = e.rx === undefined ? 0 : Math.hypot(x - e.rx, z - e.rz); e.rx = x; e.rz = z;
        e.m.position.set(x, 0.2 + lift, z); e.m.rotation.y = -h - slip;
        for (const wh of e.m.wheels) wh.children[0].rotation.z = wh.children[1].rotation.z -= moved / (wh.k || 0.62);
        e.sh.position.x = x; e.sh.position.z = z; e.sh.rotation.z = -h - slip;
        e.flame.visible = false; if (e.bub) e.bub.visible = false;
        if (e.c.id === pid) { px = x; pz = z; }
      });
      // Côté opposé à la tribune du départ, pour que les supporters ne masquent pas la voiture.
      const f = this.life && this.life.dbg.foule, near = f && Math.hypot(f.x - t.px[0], f.z - t.pz[0]) < 45;
      const flip = near && f.nx * -t.tz[0] + f.nz * t.tx[0] > 0 ? -1 : 1;
      const nx = -t.tz[0] * flip, nz = t.tx[0] * flip, along = close ? 0 : -9, side = w + (close ? 7 : 11);
      const cx = t.px[0] + t.tx[0] * along + nx * side, cz = t.pz[0] + t.tz[0] * along + nz * side;
      if (this.rpX === undefined || !this.inReplay) { this.rpX = px; this.rpZ = pz; this.inReplay = true; }
      const k = 1 - Math.exp(-dt * 6); this.rpX += (px - this.rpX) * k; this.rpZ += (pz - this.rpZ) * k;
      // Le photo-finish regarde le long de la ligne : le poteau du portique, sur cet axe, aurait rempli l'écran.
      for (const p of this.poles || []) p.visible = !close;
      this.cam.position.set(cx, close ? 5 : 3.6, cz);   // assez haut pour voir par-dessus la bordure du premier plan
      this.cam.lookAt(close ? t.px[0] : this.rpX, close ? 0.6 : 1.2, close ? t.pz[0] : this.rpZ);
      const fov = close ? 34 : 42; if (this.cam.fov !== fov) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
      if (this.life) this.life.update(dt, (this.t += dt), { x: px, z: pz }, this.race.cars, this.lite);
      this.windM.visible = false;
      this._sun(px, pz);
      this.r.render(this.scene, this.cam);
    }

    // Bulle de texte au-dessus d'une voiture (rival dépassé), 1,8 s.
    say(id, text) {
      const e = this.carMeshes.find((q) => q.c.id === id);
      if (!e) return;
      if (!e.bub) {
        const c = document.createElement('canvas'); c.width = 256; c.height = 128;
        const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
        e.bub = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
        e.bub.scale.set(8, 4, 1); e.bub.renderOrder = 5; this.scene.add(e.bub); e.bubC = c;
      }
      const g = e.bubC.getContext('2d');
      g.clearRect(0, 0, 256, 128);
      g.fillStyle = '#fff'; g.strokeStyle = '#2b2230'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(30, 10); g.arcTo(246, 10, 246, 90, 22); g.arcTo(246, 90, 10, 90, 22); g.lineTo(150, 90); g.lineTo(118, 122); g.lineTo(112, 90); g.arcTo(10, 90, 10, 10, 22); g.arcTo(10, 10, 246, 10, 22); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#2b2230'; g.font = '900 38px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = 38; while (g.measureText(text).width > 220 && fs > 18) { fs -= 2; g.font = `900 ${fs}px Arial Black, Arial`; }
      g.fillText(text, 128, 51);
      e.bub.material.map.needsUpdate = true; e.bubT = 1.8;
    }

    // Fantôme du contre-la-montre : la voiture du record, transparente, sans ombre.
    setGhost(shape, hex) {
      if (this.ghostCar) { this.scene.remove(this.ghostCar); this.ghostCar = null; }
      if (!shape) return;
      const m = MB.buildCarHD(shape, hex, lam.env);
      m.traverse((o) => {
        if (!o.material) return;
        const fade = (x) => { const c = x.clone(); c.transparent = true; c.opacity = 0.38; c.depthWrite = false; return c; };
        o.material = Array.isArray(o.material) ? o.material.map(fade) : fade(o.material);
        o.castShadow = false;
      });
      this._linear(m);
      m.visible = false; this.scene.add(m); this.ghostCar = m;
    }
    ghostAt(x, z, h, on) {
      const m = this.ghostCar;
      if (!m) return;
      m.visible = on;
      if (on) { m.position.set(x, 0.2, z); m.rotation.y = -h; }
    }

    // Image de chauffe juste après la construction : compile les ombres et envoie les textures à la carte graphique.
    warm() { if (this.race) this.frameRace(0, 1); }

    // Journal de test : capture réduite prise juste après le rendu, tant que l'image est encore dans le tampon.
    snapshot(w = 360) {
      try {
        const src = this.r.domElement, k = w / src.width;
        const c = this.snapCanvas || (this.snapCanvas = document.createElement('canvas'));
        c.width = w; c.height = Math.round(src.height * k);
        c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.6);
      } catch (e) { return null; }
    }

    stats() {
      const i = this.r.info.render;
      return { pr: this.pixelRatio, ombres: this.r.shadowMap.enabled, appels: i.calls, triangles: i.triangles };
    }

    gpuInfo() {
      try {
        const gl = this.r.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          carte: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          marque: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          webgl2: this.r.capabilities.isWebGL2, texture_max: this.r.capabilities.maxTextureSize,
          tampon: [this.r.domElement.width, this.r.domElement.height],
        };
      } catch (e) { return null; }
    }

    _sun(x, z) {
      this.sun.target.position.set(x, 0, z);
      this.sun.position.set(x + 90, 170, z + 60);
    }

    // ---------- Garage : une scène à part, conservée entre les visites ----------
    _garageScene() {
      const s = new T.Scene(), env = this._env(MOODS.midi);
      s.background = new T.Color(0x23252c);
      lam.env = env;
      s.add(new T.HemisphereLight(0xffffff, 0x4a4a55, 0.42));
      const key = new T.DirectionalLight(0xfff4e2, 1.7); key.position.set(9, 19, 8); key.target.position.set(0, 0, 0); s.add(key, key.target);
      key.castShadow = this.shadows; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006; key.shadow.radius = 4;
      Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 });

      const tiles = canvas(512, 512, (g, W, H) => {
        g.fillStyle = '#5a5e68'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 2600; i++) { const l = 70 + Math.random() * 45; g.fillStyle = `rgba(${l},${l},${l + 6},.5)`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
        g.strokeStyle = 'rgba(20,22,28,.75)'; g.lineWidth = 5; g.strokeRect(0, 0, W, H);
      });
      tiles.repeat.set(9, 9);
      const floor = new T.Mesh(new T.PlaneGeometry(48, 48), new T.MeshStandardMaterial({ map: tiles, roughness: 0.34, metalness: 0.1, envMap: env, envMapIntensity: 0.8 }));
      floor.rotation.x = -Math.PI / 2; s.add(floor);

      // Mur de fond : panneau perforé et outils accrochés.
      const peg = canvas(1024, 512, (g, W, H) => {
        g.fillStyle = '#b98a58'; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(50,28,12,.55)';
        for (let x = 12; x < W; x += 24) for (let y = 12; y < H; y += 24) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
        g.fillStyle = '#e5352b'; g.fillRect(250, 34, 524, 96);
        g.fillStyle = '#fff'; g.font = '900 52px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('MINI BOLIDES', W / 2, 102);
        g.strokeStyle = '#2b2d35'; g.fillStyle = '#2b2d35'; g.lineCap = 'round';
        const key2 = (x, h) => { g.lineWidth = 15; g.beginPath(); g.moveTo(x, 190); g.lineTo(x, 190 + h); g.stroke(); g.lineWidth = 9; g.beginPath(); g.arc(x, 180, 17, 0.7, 5.6); g.stroke(); };
        [120, 165, 205, 240, 830, 870, 905].forEach((x, i) => key2(x, 80 + (i % 4) * 26));
        g.fillStyle = '#d9a514'; g.fillRect(300, 190, 26, 110); g.fillStyle = '#2b2d35'; g.fillRect(308, 300, 10, 90);       // tournevis
        g.fillStyle = '#25b98a'; g.fillRect(360, 190, 26, 96); g.fillStyle = '#2b2d35'; g.fillRect(368, 286, 10, 110);
        g.fillStyle = '#7b4a24'; g.fillRect(660, 196, 24, 180); g.fillStyle = '#343640'; g.fillRect(620, 180, 104, 44);    // marteau
      });
      peg.wrapS = peg.wrapT = T.ClampToEdgeWrapping;
      const wall = new T.Mesh(new T.PlaneGeometry(21, 13), new T.MeshStandardMaterial({ map: peg, roughness: 0.75 }));
      wall.position.set(0, 6.5, -11); s.add(wall);
      const side = lam(0xd8d2c6);
      for (const k of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(40, 18), side); w.position.set(k * 10.5, 9, 6); w.rotation.y = -k * Math.PI / 2; s.add(w); }
      const ceil = new T.Mesh(new T.PlaneGeometry(40, 40), lam(0x34363f)); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 13, 4); s.add(ceil);
      const tube = new T.BoxGeometry(11, 0.25, 0.5), tubeM = new T.MeshBasicMaterial({ color: 0xffffff });
      for (const z of [-3, 4]) { const n = new T.Mesh(tube, tubeM); n.position.set(0, 12.8, z); s.add(n); }

      // Établi, servante rouge, pneus, bidons.
      const bench = new T.Group(), wood = lam(0x8a5c34), steel = lam(0x3b3e47, { metalness: 0.6, roughness: 0.4 });
      const top = new T.Mesh(new T.BoxGeometry(9, 0.3, 2.4), wood); top.position.y = 3; bench.add(top);
      for (const x of [-4.2, 4.2]) { const l = new T.Mesh(new T.BoxGeometry(0.3, 3, 2.2), steel); l.position.set(x, 1.5, 0); bench.add(l); }
      const can = new T.CylinderGeometry(0.42, 0.42, 1.2, 14);
      [[-3, 0xe5352b], [-2.1, 0x2f62d9], [-1.2, 0xf7c52d]].forEach(([x, c]) => { const m = new T.Mesh(can, lam(c, { roughness: 0.3 })); m.position.set(x, 3.75, 0.1); bench.add(m); });
      bench.position.set(-5.8, 0, -9.3); s.add(bench);
      const cart = new T.Group(), body = new T.Mesh(new T.BoxGeometry(3.4, 3.8, 2), lam(0xd42a22, { roughness: 0.28 })); body.position.y = 2.2; cart.add(body);
      for (let i = 0; i < 4; i++) { const h = new T.Mesh(new T.BoxGeometry(2.6, 0.1, 0.1), lam(0xdfe3e8, { metalness: 0.8, roughness: 0.3 })); h.position.set(0, 0.9 + i * 0.85, 1.05); cart.add(h); }
      cart.position.set(6.8, 0, -9); cart.rotation.y = -0.3; s.add(cart);
      const tyre = new T.TorusGeometry(1.25, 0.58, 10, 22), rub = lam(0x17171b, { roughness: 0.85 });
      for (let i = 0; i < 4; i++) { const t = new T.Mesh(tyre, rub); t.rotation.x = Math.PI / 2; t.position.set(8.2, 0.6 + i * 1.12, -6); s.add(t); }

      // Plateau tournant.
      const table = new T.Group();
      const disc = new T.Mesh(new T.CylinderGeometry(3.9, 4.1, 0.3, 48), new T.MeshStandardMaterial({ color: 0x2d2f37, metalness: 0.75, roughness: 0.33, envMap: env }));
      disc.position.y = 0.15; table.add(disc);
      const ring = new T.Mesh(new T.TorusGeometry(3.9, 0.06, 8, 64), new T.MeshBasicMaterial({ color: 0xffd23f })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.31; table.add(ring);
      s.add(table);
      this._linear(s);
      s.traverse((o) => { if (o.isMesh && o !== floor && o !== wall && o !== ceil && o.geometry.type !== 'PlaneGeometry') o.castShadow = this.shadows; });
      lam.env = null;
      return { s, env, table, car: null, key: '', spin: 0.6 };
    }

    showGarage(shape, hex, look) {
      if (!this.gar) this.gar = this._garageScene();
      const g = this.gar, k = shape + hex + JSON.stringify(look || {});
      this.mode = 'garage';
      if (g.key === k) return;
      if (g.car) {
        g.table.remove(g.car);
        g.car.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      }
      const m = MB.buildCarHD(shape, hex, g.env), sh = new T.Mesh(new T.PlaneGeometry(7.4, 4.4), new T.MeshBasicMaterial({ map: this.blob, transparent: true, depthWrite: false }));
      MB.styleCar(m, look);
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.04; m.add(sh);
      m.position.y = 0.3;
      this._linear(m);
      g.table.add(m); g.car = m; g.key = k;
    }

    spinGarage(dx) { if (this.gar) { this.gar.spin += dx * 0.012; this.gar.hold = 1.4; } }

    frameGarage(dt) {
      const g = this.gar;
      if (g.hold > 0) g.hold -= dt; else g.spin += dt * 0.32;
      g.table.rotation.y = g.spin;
      this.cam.fov = 44; this.cam.updateProjectionMatrix();
      const fit = Math.max(1, 0.6 / this.cam.aspect);         // recule en portrait pour garder toute la voiture
      this.cam.position.set(0, 4.6, 14 * fit);
      this.cam.lookAt(0, -1.2, -2);                            // la voiture reste au-dessus du panneau de menu
      this.r.render(g.s, this.cam);
    }

    // Voiture sur la ligne de départ, vue tournante, pour les menus.
    showcase(track, shape, hex, look) {
      if (!this.scene || this.track !== track) this.world(track);
      this.mode = 'track';
      const key = shape + hex + JSON.stringify(look || {});
      if (this.shop && this.shopKey === key) return;
      if (this.shop) this.scene.remove(this.shop);
      const m = MB.buildCarHD(shape, hex, lam.env);
      MB.styleCar(m, look);
      const sh = new T.Mesh(new T.PlaneGeometry(7.4, 4.4), new T.MeshBasicMaterial({ map: this.blob, transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.04;
      m.add(sh);
      const g = new T.Group(); g.add(m);
      this._linear(m);
      const i = Math.round(track.count * 0.03);
      g.position.set(track.px[i], 0.2, track.pz[i]);
      g.rotation.y = -Math.atan2(track.tz[i], track.tx[i]);
      this.scene.add(g);
      this.shop = g; this.shopKey = key;
    }

    frameMenu(dt) {
      if (this.mode === 'garage') return this.frameGarage(dt);
      if (this.mode === 'troph') return this.frameTrophies(dt);
      if (!this.shop) return;
      this.t += dt;
      const a = 0.55 + this.t * 0.28, o = this.shop.position;
      this._sun(o.x, o.z);
      if (this.life) this.life.update(dt, this.t, o, null, this.lite);
      this.cam.fov = 40; this.cam.updateProjectionMatrix();
      this.cam.position.set(o.x + Math.cos(a) * 15, 5, o.z + Math.sin(a) * 15);
      this.cam.lookAt(o.x, -1.6, o.z);                        // la voiture reste au-dessus du panneau de menu
      this.r.render(this.scene, this.cam);
    }

    clearShowcase() { this.shop = null; this.shopKey = null; }
  }

  MB.View = View;
  MB.R = { canvas, lam, shiny, lathe, roundBox, lump, merge, smoothNormals, PROP_REACH };
})(window.MB = window.MB || {});
