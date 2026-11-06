// Salle des trophées : une longue étagère en bois, un trophée 3D par succès sur son socle, un projecteur sur celui
// qu'on regarde. Les trophées pas encore gagnés sont des silhouettes mates. On glisse d'un trophée à l'autre.
(function () {
  const T = window.THREE, R = MB.R, SPACING = 3.3;

  const gold = () => R.lam(0xf2c14e, { metalness: 1, roughness: 0.22 });
  const silver = () => R.lam(0xdfe4ea, { metalness: 1, roughness: 0.2 });
  const paint = (c, rough = 0.3) => R.lam(c, { roughness: rough });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); return m; };

  // Coupe : pied, tige, vasque, deux anses. k : taille.
  function cup(k, mat) {
    const g = new T.Group();
    g.add(R.lathe([[0, 0], [0.62, 0], [0.62, 0.16], [0.4, 0.22], [0.16, 0.34], [0.12, 0.8], [0.22, 0.95], [0.62, 1.12], [0.78, 1.6], [0.8, 2.05], [0.74, 2.05], [0.7, 1.62], [0.55, 1.2], [0, 1.1]].map(([x, y]) => [x * k, y * k]), mat));
    for (const s of [-1, 1]) { const h = mesh(new T.TorusGeometry(0.3 * k, 0.06 * k, 8, 20, Math.PI * 1.2), mat, s * 0.8 * k, 1.62 * k); h.rotation.z = s > 0 ? -Math.PI * 0.6 : Math.PI * 1.6; g.add(h); }
    return g;
  }
  function star(r, depth, mat) {
    const s = new T.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: r * 0.08, bevelSegments: 3 });
    geo.center();
    return new T.Mesh(geo, mat);
  }
  const plinth = (mat) => mesh(new T.CylinderGeometry(0.55, 0.65, 0.3, 28), mat || gold(), 0, 0.15);

  // Un modèle par trophée (hauteur ~2,4).
  const MODELS = {
    first() {                                             // drapeau à damier
      const g = new T.Group(); g.add(plinth());
      g.add(mesh(new T.CylinderGeometry(0.06, 0.06, 2.6, 10), silver(), -0.5, 1.6));
      const tex = R.canvas(128, 96, (c) => { for (let x = 0; x < 8; x++) for (let y = 0; y < 6; y++) { c.fillStyle = (x + y) % 2 ? '#111' : '#fff'; c.fillRect(x * 16, y * 16, 16, 16); } });
      const geo = new T.PlaneGeometry(1.4, 1, 14, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) + 0.7) * 4) * 0.1 * (p.getX(i) + 0.7));
      geo.computeVertexNormals();
      g.add(mesh(geo, R.lam(0xffffff, { map: tex, side: T.DoubleSide, roughness: 0.6 }), 0.22, 2.4));
      return g;
    },
    win() {                                               // médaille d'or sur ruban
      const g = new T.Group(); g.add(plinth(R.lam(0x2b2d35, { roughness: 0.4 })));
      for (const s of [-1, 1]) { const r = mesh(new T.BoxGeometry(0.34, 1.3, 0.05), paint(s < 0 ? 0x2f62d9 : 0xe5352b, 0.5), s * 0.2, 2.0, -0.05); r.rotation.z = s * 0.32; g.add(r); }
      const d = mesh(new T.CylinderGeometry(0.62, 0.62, 0.14, 40), gold(), 0, 1.15); d.rotation.x = Math.PI / 2; g.add(d);
      const one = star(0.3, 0.06, R.lam(0xffe9a8, { metalness: 1, roughness: 0.3 })); one.position.set(0, 1.15, 0.1); g.add(one);
      return g;
    },
    clean() {                                             // savon et bulles
      const g = new T.Group(); g.add(plinth());
      const s = mesh(R.roundBox(1.4, 0.55, 0.9, 0.24), paint(0xff9cc8, 0.2), 0, 0.6); s.rotation.y = 0.3; g.add(s);
      const bub = R.lam(0xd8f4ff, { transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2 });
      for (const [x, y, r] of [[-0.2, 1.3, 0.3], [0.35, 1.7, 0.22], [-0.05, 2.15, 0.17], [0.3, 2.45, 0.1]]) g.add(mesh(new T.SphereGeometry(r, 20, 14), bub, x, y));
      return g;
    },
    turbo5() {                                            // flamme
      const g = new T.Group(); g.add(plinth());
      [[0xe5352b, 0.62, 2.1], [0xff8a1e, 0.46, 1.7], [0xffd23f, 0.28, 1.25]].forEach(([c, r, h], i) => {
        const f = R.lathe([[0, 0], [r, h * 0.18], [r * 0.9, h * 0.45], [r * 0.45, h * 0.78], [0, h]], R.lam(c, { emissive: c, emissiveIntensity: 0.35, roughness: 0.4 }));
        f.position.set(0, 0.3, i * 0.3); f.scale.z = 0.8; g.add(f);   // les flammes intérieures dépassent devant
      });
      return g;
    },
    drift50() {                                           // tornade
      const g = new T.Group(); g.add(plinth());
      for (let i = 0; i < 7; i++) { const t = mesh(new T.TorusGeometry(0.16 + i * 0.1, 0.07 + i * 0.012, 8, 28), paint(i % 2 ? 0xbfe3ff : 0xffffff, 0.35), Math.sin(i * 0.9) * 0.12, 0.45 + i * 0.3); t.rotation.x = Math.PI / 2; g.add(t); }
      return g;
    },
    shortcuts() {                                         // boussole
      const g = new T.Group(); g.add(plinth());
      const c = new T.Group();
      const d = mesh(new T.CylinderGeometry(0.85, 0.85, 0.22, 40), gold()); d.rotation.x = Math.PI / 2; c.add(d);
      const face = mesh(new T.CircleGeometry(0.72, 40), paint(0xfff6e0, 0.5), 0, 0, 0.12); c.add(face);
      const nd = (col, s) => { const n = new T.Mesh(new T.ConeGeometry(0.12, 0.6, 4), paint(col)); n.position.set(0, s * 0.3, 0.16); if (s < 0) n.rotation.z = Math.PI; return n; };
      c.add(nd(0xe5352b, 1), nd(0x3b3e47, -1));
      c.position.y = 1.3; c.rotation.x = -0.2; g.add(c);
      return g;
    },
    coins40() {                                           // pile de pièces
      const g = new T.Group(), m = gold(), geo = new T.CylinderGeometry(0.5, 0.5, 0.14, 30);
      for (let i = 0; i < 9; i++) g.add(mesh(geo, m, Math.sin(i * 1.7) * 0.07, 0.08 + i * 0.15, Math.cos(i * 1.3) * 0.07));
      const up = mesh(geo, m, 0.75, 0.5); up.rotation.x = Math.PI / 2; up.rotation.y = 0.5; g.add(up);
      const top = mesh(geo, m, -0.1, 1.55); top.rotation.z = 0.5; g.add(top);
      return g;
    },
    rich() {                                              // sac de pièces
      const g = new T.Group();
      const bag = mesh(R.lump(0.85, 0.05, 3, 4), paint(0xa8743c, 0.75), 0, 0.85); bag.scale.y = 1.05; g.add(bag);
      g.add(mesh(new T.CylinderGeometry(0.28, 0.4, 0.3, 16), paint(0x96652f, 0.75), 0, 1.75));
      const tie = mesh(new T.TorusGeometry(0.3, 0.06, 8, 20), paint(0xe5352b), 0, 1.68); tie.rotation.x = Math.PI / 2; g.add(tie);
      g.add(mesh(new T.ConeGeometry(0.42, 0.5, 14), paint(0xa8743c, 0.75), 0, 2.05));
      const coin = new T.CylinderGeometry(0.28, 0.28, 0.08, 24), m = gold();
      for (const [x, z, r] of [[0.8, 0.5, 0.3], [-0.85, 0.4, -0.2], [0.3, 0.85, 0.1]]) { const c = mesh(coin, m, x, 0.05, z); c.rotation.z = r; g.add(c); }
      const sym = mesh(new T.TorusGeometry(0.2, 0.05, 8, 20), gold(), 0, 1.0, 0.82); g.add(sym);
      return g;
    },
    bowling() {                                           // grosse bille
      const g = new T.Group(), ring = mesh(new T.TorusGeometry(0.45, 0.1, 10, 28), gold(), 0, 0.12); ring.rotation.x = Math.PI / 2; g.add(ring);
      const tex = R.canvas(256, 128, (c, W, H) => { c.fillStyle = '#2f62d9'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8fd0ff'; c.lineWidth = 14; c.beginPath(); for (let x = 0; x <= W; x += 4) c.lineTo(x, H / 2 + Math.sin(x / 20) * 30); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= W; x += 4) c.lineTo(x, H / 2 + Math.sin(x / 20 + 1) * 30); c.stroke(); });
      g.add(mesh(new T.SphereGeometry(0.95, 36, 24), R.lam(0xffffff, { map: tex, roughness: 0.06, metalness: 0.1 }), 0, 1.2));
      return g;
    },
    comeback() {                                          // fusée
      const g = new T.Group(); g.add(plinth());
      const r = new T.Group();
      r.add(R.lathe([[0, 0], [0.32, 0.05], [0.42, 0.5], [0.42, 1.3], [0.3, 1.8], [0, 2.1]], paint(0xf6f2ea, 0.25)));
      r.add(R.lathe([[0, 1.62], [0.37, 1.62], [0.3, 1.8], [0, 2.1]], paint(0xe5352b, 0.25)));
      const win = mesh(new T.SphereGeometry(0.14, 16, 12), R.lam(0x7fd0ff, { roughness: 0.05 }), 0, 1.15, 0.36); win.scale.z = 0.5; r.add(win);
      for (let i = 0; i < 3; i++) { const f = mesh(new T.BoxGeometry(0.06, 0.5, 0.36), paint(0xe5352b), 0, 0.3, 0); f.geometry.translate(0, 0, 0.5); f.rotation.y = (i * Math.PI * 2) / 3; r.add(f); }
      const fl = mesh(new T.ConeGeometry(0.22, 0.45, 14), R.lam(0xffb23c, { emissive: 0xff8a1e, emissiveIntensity: 0.6 }), 0, -0.12); fl.rotation.x = Math.PI; r.add(fl);
      r.position.y = 0.55; r.rotation.z = -0.15; g.add(r);
      return g;
    },
    ghost() {                                             // petit fantôme
      const g = new T.Group(); g.add(plinth(silver()));
      const pr = [[0, 2.2], [0.35, 2.12], [0.58, 1.85], [0.66, 1.4], [0.68, 0.7]];
      for (let i = 0; i <= 8; i++) pr.push([0.68 + Math.sin(i * 1.6) * 0.06, 0.7 - i * 0.03]);
      pr.push([0, 0.5]);
      const b = R.lathe(pr, R.lam(0xffffff, { transparent: true, opacity: 0.88, roughness: 0.3, emissive: 0xcfe0ff, emissiveIntensity: 0.15 })); b.position.y = 0.05; g.add(b);
      for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.1, 12, 10), paint(0x1b1d24, 0.2), s * 0.22, 1.7, 0.58));
      g.add(mesh(new T.SphereGeometry(0.09, 12, 10), paint(0x1b1d24, 0.2), 0, 1.4, 0.62));
      return g;
    },
    tour() {                                              // petite maison
      const g = new T.Group(); g.add(plinth());
      g.add(mesh(R.roundBox(1.3, 1, 1.1, 0.05), paint(0xfff1d6, 0.5), 0, 0.82));
      const roof = mesh(new T.CylinderGeometry(0.01, 1.05, 0.8, 4), paint(0xe5352b, 0.4), 0, 1.72); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.95; g.add(roof);
      g.add(mesh(new T.BoxGeometry(0.3, 0.5, 0.05), paint(0x8a5c34), 0, 0.6, 0.56));
      for (const s of [-1, 1]) g.add(mesh(new T.BoxGeometry(0.26, 0.26, 0.05), R.lam(0x8fd0ff, { roughness: 0.1 }), s * 0.38, 1.0, 0.56));
      g.add(mesh(new T.BoxGeometry(0.2, 0.5, 0.2), paint(0xb04a3a), 0.35, 2.0, 0));
      return g;
    },
    cup() {                                               // grande coupe
      const g = new T.Group(), m = gold();
      g.add(mesh(R.roundBox(1.2, 0.36, 1.2, 0.08), R.lam(0x2b2d35, { roughness: 0.35 }), 0, 0.18));
      const c = cup(1.15, m); c.position.y = 0.36; g.add(c);
      const s = star(0.26, 0.05, R.lam(0xffffff, { metalness: 0.6, roughness: 0.2 })); s.position.set(0, 2.0, 0.88); s.rotation.x = -0.25; g.add(s);
      return g;
    },
    stars() {                                             // étoile d'or
      const g = new T.Group(); g.add(plinth(R.lam(0x2b2d35, { roughness: 0.4 })));
      g.add(mesh(new T.CylinderGeometry(0.05, 0.05, 0.6, 8), gold(), 0, 0.55));
      const s = star(0.95, 0.3, gold()); s.position.y = 1.65; g.add(s);
      return g;
    },
    expert() {                                            // volant d'or
      const g = new T.Group(); g.add(plinth(R.lam(0x2b2d35, { roughness: 0.4 })));
      g.add(mesh(new T.CylinderGeometry(0.07, 0.07, 0.8, 10), silver(), 0, 0.65));
      const w = new T.Group(), m = gold();
      w.add(mesh(new T.TorusGeometry(0.8, 0.12, 12, 40), m));
      for (let i = 0; i < 3; i++) { const sp = mesh(new T.BoxGeometry(0.12, 0.8, 0.08), m); sp.geometry.translate(0, -0.4, 0); sp.rotation.z = (i * Math.PI * 2) / 3; w.add(sp); }
      const hub = mesh(new T.CylinderGeometry(0.24, 0.24, 0.16, 24), R.lam(0x2b2d35, { roughness: 0.3 })); hub.rotation.x = Math.PI / 2; w.add(hub);
      w.position.y = 1.9; g.add(w);
      return g;
    },
    toys() {                                              // coffre à jouets qui déborde
      const g = new T.Group();
      g.add(mesh(R.roundBox(1.7, 0.9, 1.1, 0.08), paint(0x2f8fd8, 0.4), 0, 0.45));
      for (const [x, c] of [[-0.55, 0xffd23f], [0, 0xe5352b], [0.55, 0x48b58a]]) g.add(mesh(new T.BoxGeometry(0.4, 0.3, 0.04), paint(c, 0.4), x, 0.5, 0.56));
      const lid = mesh(R.roundBox(1.74, 0.16, 1.14, 0.06), paint(0x2a70c9, 0.4), 0, 1.25, -0.55); lid.geometry.translate(0, 0, 0.57); lid.rotation.x = -1.1; g.add(lid);
      const duck = MB.TOY_MODELS.canard(); duck.scale.setScalar(0.8); duck.position.set(-0.35, 0.65, 0.05); g.add(duck);
      const ball = mesh(new T.SphereGeometry(0.28, 18, 14), paint(0xe5352b, 0.2), 0.45, 1.05, 0.1); g.add(ball);
      const bear = MB.TOY_MODELS.ours(); bear.scale.setScalar(0.7); bear.position.set(0.1, 0.7, -0.2); g.add(bear);
      return g;
    },
    night() {                                             // chouette sur un croissant de lune
      const g = new T.Group(); g.add(plinth(R.lam(0x1c2350, { roughness: 0.4 })));
      const moon = mesh(new T.TorusGeometry(0.7, 0.24, 14, 40, Math.PI * 1.15), R.lam(0xfff1b0, { emissive: 0xffe27a, emissiveIntensity: 0.35, roughness: 0.4 }), 0, 1.15); moon.rotation.z = Math.PI * 0.95; g.add(moon);
      const owl = new T.Group(), brown = paint(0x8a5c34, 0.6);
      owl.add(mesh(new T.SphereGeometry(0.34, 20, 16), brown, 0, 0, 0)); owl.children[0].scale.y = 1.15;
      owl.add(mesh(new T.SphereGeometry(0.22, 16, 12), paint(0xd8b48a, 0.6), 0, -0.05, 0.18));
      for (const s of [-1, 1]) {
        owl.add(mesh(new T.SphereGeometry(0.11, 14, 10), paint(0xffffff, 0.3), s * 0.13, 0.15, 0.27));
        owl.add(mesh(new T.SphereGeometry(0.05, 10, 8), paint(0x1b1d24, 0.2), s * 0.13, 0.15, 0.37));
        const ear = mesh(new T.ConeGeometry(0.07, 0.18, 8), brown, s * 0.2, 0.42, 0); ear.rotation.z = -s * 0.3; owl.add(ear);
      }
      const beak = mesh(new T.ConeGeometry(0.04, 0.1, 8), paint(0xffb23c), 0, 0.04, 0.33); beak.rotation.x = Math.PI; owl.add(beak);
      owl.position.set(0.15, 0.85, 0.1); g.add(owl);
      return g;
    },
    rain() {                                              // parapluie et gouttes
      const g = new T.Group(); g.add(plinth());
      g.add(mesh(new T.CylinderGeometry(0.04, 0.04, 1.8, 8), silver(), 0, 1.15));
      const hook = mesh(new T.TorusGeometry(0.15, 0.04, 8, 16, Math.PI), silver(), 0.15, 0.27); hook.rotation.z = Math.PI; g.add(hook);
      const top = new T.Mesh(new T.ConeGeometry(1.05, 0.55, 8, 1, true), R.lam(0xe5352b, { roughness: 0.35, side: T.DoubleSide })); top.position.y = 2.15; g.add(top);
      for (let i = 0; i < 8; i += 2) { const p = mesh(new T.ConeGeometry(1.06, 0.55, 8, 1, true, (i * Math.PI) / 4, Math.PI / 4), R.lam(0xffffff, { roughness: 0.35, side: T.DoubleSide }), 0, 2.15); g.add(p); }
      const drop = R.lam(0x7fd0ff, { roughness: 0.05, transparent: true, opacity: 0.85 });
      for (const [x, y] of [[-0.9, 1.4], [0.85, 1.1], [-0.6, 0.8]]) { const d = mesh(new T.SphereGeometry(0.09, 12, 10), drop, x, y); d.scale.y = 1.4; g.add(d); }
      return g;
    },
    reverse() {                                           // panneau demi-tour
      const g = new T.Group(); g.add(plinth());
      g.add(mesh(new T.CylinderGeometry(0.05, 0.05, 1.2, 8), silver(), 0, 0.8));
      const sign = mesh(new T.CylinderGeometry(0.75, 0.75, 0.1, 36), paint(0x2f62d9, 0.35), 0, 1.75); sign.rotation.x = Math.PI / 2; g.add(sign);
      const arrow = mesh(new T.TorusGeometry(0.32, 0.08, 10, 30, Math.PI), paint(0xffffff, 0.3), 0, 1.8, 0.07); g.add(arrow);
      g.add(mesh(new T.BoxGeometry(0.16, 0.36, 0.06), paint(0xffffff, 0.3), 0.32, 1.64, 0.07));
      const tip = mesh(new T.ConeGeometry(0.17, 0.26, 3), paint(0xffffff, 0.3), -0.32, 1.66, 0.07); tip.rotation.z = Math.PI; g.add(tip);
      return g;
    },
    photo() {                                             // appareil photo
      const g = new T.Group(); g.add(plinth());
      const body = new T.Group();
      body.add(mesh(R.roundBox(1.4, 0.85, 0.5, 0.1), paint(0x2b2d35, 0.4)));
      body.add(mesh(new T.BoxGeometry(1.42, 0.28, 0.52), paint(0xc8cdd6, 0.3), 0, 0.2));
      const lens = mesh(new T.CylinderGeometry(0.32, 0.36, 0.35, 28), R.lam(0x1b1d24, { metalness: 0.6, roughness: 0.3 }), 0, -0.05, 0.4); lens.rotation.x = Math.PI / 2; body.add(lens);
      body.add(mesh(new T.CircleGeometry(0.22, 24), R.lam(0x3f6fd8, { roughness: 0.05, metalness: 0.3 }), 0, -0.05, 0.58));
      body.add(mesh(new T.BoxGeometry(0.28, 0.16, 0.06), R.lam(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.5 }), 0.45, 0.28, 0.27));
      body.add(mesh(new T.CylinderGeometry(0.1, 0.1, 0.1, 14), paint(0xe5352b), -0.45, 0.48, 0));
      body.position.y = 1.0; body.rotation.x = -0.1; g.add(body);
      return g;
    },
    rocket() {                                            // feu de départ
      const g = new T.Group(); g.add(plinth());
      g.add(mesh(new T.CylinderGeometry(0.06, 0.06, 0.5, 8), silver(), 0, 0.5));
      g.add(mesh(R.roundBox(0.62, 1.7, 0.45, 0.1), paint(0x2b2d35, 0.4), 0, 1.6));
      [[0xe5352b, 0.25], [0xffb23c, 0.25], [0x3fd46a, 1]].forEach(([c, e], i) => {
        g.add(mesh(new T.SphereGeometry(0.2, 18, 12), R.lam(c, { emissive: c, emissiveIntensity: e, roughness: 0.2 }), 0, 2.1 - i * 0.5, 0.2));
        const visor = mesh(new T.CylinderGeometry(0.25, 0.25, 0.2, 18, 1, true, -Math.PI / 2, Math.PI), R.lam(0x1b1d24, { side: T.DoubleSide }), 0, 2.22 - i * 0.5, 0.28); visor.rotation.z = Math.PI / 2; visor.rotation.y = Math.PI / 2; g.add(visor);
      });
      return g;
    },
    drift() {                                             // pneu fumant
      const g = new T.Group(); g.add(plinth());
      const tyre = mesh(new T.TorusGeometry(0.6, 0.28, 16, 36), paint(0x1b1d24, 0.8), 0, 1.2); g.add(tyre);
      const rim = mesh(new T.CylinderGeometry(0.38, 0.38, 0.3, 24), R.lam(0xdfe4ea, { metalness: 1, roughness: 0.2 }), 0, 1.2); rim.rotation.x = Math.PI / 2; g.add(rim);
      for (let i = 0; i < 5; i++) { const sp = mesh(new T.BoxGeometry(0.08, 0.36, 0.32), gold(), 0, 1.2); sp.rotation.z = (i * Math.PI * 2) / 5; g.add(sp); }
      const smoke = R.lam(0xf0f0f0, { transparent: true, opacity: 0.75, roughness: 1 });
      for (const [x, y, r] of [[-0.75, 0.55, 0.3], [-1.0, 0.85, 0.24], [-0.95, 1.2, 0.18], [0.8, 0.5, 0.26]]) g.add(mesh(R.lump(r, 0.08, x * 3, 3), smoke, x, y, -0.1));
      return g;
    },
    garage() {                                            // porte-clés et clé de voiture
      const g = new T.Group(); g.add(plinth());
      const ring = mesh(new T.TorusGeometry(0.42, 0.06, 10, 32), silver(), 0, 2.0); g.add(ring);
      const key = new T.Group();
      key.add(mesh(R.roundBox(0.55, 0.75, 0.2, 0.12), paint(0xe5352b, 0.3), 0, 0, 0));
      key.add(mesh(new T.BoxGeometry(0.16, 0.8, 0.06), silver(), 0, -0.75, 0));
      for (const y of [-0.85, -1.0]) key.add(mesh(new T.BoxGeometry(0.12, 0.06, 0.06), silver(), 0.12, y, 0));
      key.add(mesh(new T.CircleGeometry(0.12, 18), R.lam(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.2 }), 0, 0.12, 0.11));
      key.position.set(0, 1.55, 0); key.rotation.z = 0.15; g.add(key);
      const tag = mesh(R.roundBox(0.4, 0.5, 0.06, 0.1), gold(), 0.45, 1.5, 0.05); tag.rotation.z = -0.3; g.add(tag);
      return g;
    },
    tuned() {                                             // clé à molette
      const g = new T.Group(); g.add(plinth());
      const w = new T.Group(), m = R.lam(0xdfe4ea, { metalness: 1, roughness: 0.25 });
      w.add(mesh(R.roundBox(0.28, 1.6, 0.14, 0.06), m, 0, 0, 0));
      const head = mesh(new T.TorusGeometry(0.32, 0.13, 10, 24, Math.PI * 1.45), m, 0, 0.95, 0); head.rotation.z = -Math.PI * 0.22; w.add(head);
      w.add(mesh(new T.BoxGeometry(0.2, 0.6, 0.16), paint(0xe5352b, 0.35), 0, -0.45, 0));
      w.position.y = 1.35; w.rotation.z = 0.35; g.add(w);
      return g;
    },
    streak() {                                            // calendrier, 7 jours cochés
      const g = new T.Group(); g.add(plinth());
      const c = new T.Group();
      c.add(mesh(R.roundBox(1.3, 1.3, 0.12, 0.06), paint(0xfffaf0, 0.6)));
      c.add(mesh(new T.BoxGeometry(1.3, 0.32, 0.14), paint(0xe5352b, 0.4), 0, 0.5, 0.01));
      for (const s of [-1, 1]) { const r = mesh(new T.TorusGeometry(0.07, 0.025, 6, 14), silver(), s * 0.35, 0.68, 0); r.rotation.y = Math.PI / 2; c.add(r); }
      for (let i = 0; i < 9; i++) { const x = -0.38 + (i % 3) * 0.38, y = 0.18 - Math.floor(i / 3) * 0.3; c.add(mesh(new T.BoxGeometry(0.28, 0.22, 0.02), paint(i < 7 ? 0x48b58a : 0xe8e0d0, 0.5), x, y, 0.07)); }
      c.position.y = 1.25; c.rotation.x = -0.12; g.add(c);
      return g;
    },
    chests() {                                            // coffre au trésor ouvert
      const g = new T.Group();
      const wood = paint(0x8a5530, 0.6), m = gold();
      g.add(mesh(R.roundBox(1.5, 0.75, 1.0, 0.06), wood, 0, 0.38));
      for (const x of [-0.55, 0.55]) g.add(mesh(new T.BoxGeometry(0.1, 0.78, 1.04), m, x, 0.38));
      const lid = mesh(R.roundBox(1.5, 0.22, 1.0, 0.08), wood, 0, 0.78, -0.5); lid.geometry.translate(0, 0, 0.5); lid.rotation.x = -1.9; g.add(lid);   // couvercle rabattu en arrière
      const band = mesh(new T.BoxGeometry(1.52, 0.06, 0.1), m, 0, 0.78, -0.5); band.geometry.translate(0, 0.12, 0.95); band.rotation.x = -1.9; g.add(band);
      const coin = new T.CylinderGeometry(0.16, 0.16, 0.05, 18);
      for (let i = 0; i < 14; i++) { const c = mesh(coin, m, -0.5 + (i % 5) * 0.25, 0.8 + Math.floor(i / 5) * 0.08, -0.25 + ((i * 7) % 5) * 0.12); c.rotation.set(i * 0.4, 0, i * 0.7); g.add(c); }
      g.add(mesh(new T.OctahedronGeometry(0.16), R.lam(0x4fe3ff, { roughness: 0.05, metalness: 0.3 }), 0.25, 1.05, 0.05));
      return g;
    },
    figs() {                                              // trois figurines de champions sur un socle doré
      const g = new T.Group(); g.add(plinth());
      [[0, -0.55], [2, 0], [4, 0.55]].forEach(([r, x], i) => { const f = MB.FIG_MODELS[r](); f.scale.setScalar(i === 1 ? 1.1 : 0.9); f.position.set(x, 0.28, i === 1 ? 0.12 : -0.12); g.add(f); });
      return g;
    },
    leader() {                                            // couronne
      const g = new T.Group(); g.add(plinth(R.lam(0x6a2a8a, { roughness: 0.6 })));
      const c = new T.Group(), m = gold();
      c.add(mesh(new T.CylinderGeometry(0.7, 0.62, 0.45, 40, 1, true), Object.assign(m, { side: T.DoubleSide })));
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3, sp = mesh(new T.ConeGeometry(0.18, 0.5, 4), gold(), Math.cos(a) * 0.66, 0.45, Math.sin(a) * 0.66); c.add(sp);
        c.add(mesh(new T.SphereGeometry(0.07, 10, 8), gold(), Math.cos(a) * 0.66, 0.72, Math.sin(a) * 0.66));
        c.add(mesh(new T.SphereGeometry(0.08, 12, 10), R.lam([0xe5352b, 0x2f8fd8, 0x3fd46a][i % 3], { roughness: 0.05 }), Math.cos(a + 0.5) * 0.69, 0, Math.sin(a + 0.5) * 0.69));
      }
      c.position.y = 1.0; c.rotation.x = 0.15; g.add(c);
      return g;
    },
  };

  // Jouets cachés, un par circuit (hauteur ~1) : sur la piste et sur l'étagère du bas.
  MB.TOY_MODELS = {
    canard() { const g = new T.Group(), y = paint(0xffd23f, 0.25); g.add(mesh(R.lump(0.42, 0.03, 2, 3), y, 0, 0.38)); g.children[0].scale.set(1.2, 0.8, 0.9); g.add(mesh(new T.SphereGeometry(0.26, 18, 14), y, 0.3, 0.78)); const b = mesh(new T.ConeGeometry(0.1, 0.22, 10), paint(0xff8a1e), 0.58, 0.74); b.rotation.z = -Math.PI / 2; g.add(b); for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.04, 8, 6), paint(0x1b1d24), 0.42, 0.86, s * 0.13)); return g; },
    robot() { const g = new T.Group(), m = R.lam(0xc8cdd6, { metalness: 0.7, roughness: 0.3 }); g.add(mesh(R.roundBox(0.5, 0.5, 0.36, 0.06), m, 0, 0.45)); g.add(mesh(R.roundBox(0.38, 0.3, 0.32, 0.06), m, 0, 0.88)); for (const s of [-1, 1]) { g.add(mesh(new T.SphereGeometry(0.05, 8, 6), R.lam(0x4fe3ff, { emissive: 0x4fe3ff, emissiveIntensity: 0.8 }), s * 0.09, 0.9, 0.17)); g.add(mesh(new T.BoxGeometry(0.1, 0.2, 0.1), paint(0xe5352b), s * 0.12, 0.1, 0)); g.add(mesh(new T.BoxGeometry(0.08, 0.32, 0.08), m, s * 0.32, 0.45, 0)); } g.add(mesh(new T.CylinderGeometry(0.015, 0.015, 0.2, 6), m, 0, 1.12)); g.add(mesh(new T.SphereGeometry(0.045, 8, 6), paint(0xe5352b), 0, 1.23)); return g; },
    toupie() { const g = new T.Group(); g.add(R.lathe([[0, 0], [0.05, 0.05], [0.45, 0.45], [0.5, 0.55], [0.3, 0.68], [0.05, 0.7], [0.05, 0.95], [0, 0.95]], paint(0x9b6ad6, 0.2))); const band = mesh(new T.TorusGeometry(0.47, 0.04, 8, 32), paint(0xffd23f), 0, 0.5); band.rotation.x = Math.PI / 2; g.add(band); return g; },
    de() { const g = new T.Group(), d = mesh(R.roundBox(0.7, 0.7, 0.7, 0.12), paint(0xfff6e8, 0.3), 0, 0.4); d.rotation.set(0.3, 0.6, 0); g.add(d); const dot = new T.SphereGeometry(0.06, 8, 6), k = paint(0xe5352b); for (const [x, y] of [[0, 0], [-0.18, -0.18], [0.18, 0.18]]) d.add(mesh(dot, k, x, y, 0.35)); for (const [x, z] of [[-0.15, -0.15], [0.15, 0.15]]) d.add(mesh(dot, k, x, 0.35, z)); return g; },
    yoyo() { const g = new T.Group(); for (const s of [-1, 1]) { const h = mesh(new T.CylinderGeometry(0.4, 0.4, 0.14, 28), paint(s < 0 ? 0x2f8fd8 : 0x48b58a, 0.2), 0, 0.5, s * 0.1); h.rotation.x = Math.PI / 2; g.add(h); } const ax = mesh(new T.CylinderGeometry(0.08, 0.08, 0.1, 12), paint(0xffffff), 0, 0.5); ax.rotation.x = Math.PI / 2; g.add(ax); g.add(mesh(new T.CylinderGeometry(0.01, 0.01, 0.5, 4), paint(0xffffff), 0, 0.85)); return g; },
    avion() { const g = new T.Group(), r = paint(0xe5352b, 0.3); const f = mesh(new T.CylinderGeometry(0.12, 0.08, 0.9, 14), r, 0, 0.5); f.rotation.z = Math.PI / 2; g.add(f); g.add(mesh(new T.BoxGeometry(0.22, 0.04, 1.0), paint(0xffd23f), 0.05, 0.5)); g.add(mesh(new T.BoxGeometry(0.12, 0.04, 0.4), paint(0xffd23f), -0.4, 0.55)); g.add(mesh(new T.BoxGeometry(0.12, 0.22, 0.03), r, -0.42, 0.66)); const p = mesh(new T.BoxGeometry(0.03, 0.4, 0.06), paint(0x3b3e47), 0.47, 0.5); g.add(p); return g; },
    bateau() { const g = new T.Group(), w = paint(0xffffff, 0.6); const hull = mesh(new T.CylinderGeometry(0.5, 0.25, 0.3, 4, 1), w, 0, 0.2); hull.rotation.y = Math.PI / 4; hull.scale.z = 0.5; g.add(hull); const sail = mesh(new T.ConeGeometry(0.3, 0.6, 4), w, 0, 0.62); sail.rotation.y = Math.PI / 4; sail.scale.z = 0.3; g.add(sail); return g; },
    crayon() { const g = new T.Group(); const b = mesh(new T.CylinderGeometry(0.11, 0.11, 0.9, 6), paint(0x48b58a, 0.4), 0, 0.12); b.rotation.z = Math.PI / 2 - 0.25; b.position.y = 0.3; g.add(b); const tip = mesh(new T.ConeGeometry(0.11, 0.25, 6), paint(0xf2d3a0, 0.6), 0.55, 0.42); tip.rotation.z = -Math.PI / 2 - 0.25; g.add(tip); return g; },
    sifflet() { const g = new T.Group(), m = R.lam(0xdfe4ea, { metalness: 1, roughness: 0.2 }); const c = mesh(new T.CylinderGeometry(0.3, 0.3, 0.3, 24), m, 0, 0.32); c.rotation.x = Math.PI / 2; g.add(c); g.add(mesh(new T.BoxGeometry(0.5, 0.18, 0.3), m, 0.3, 0.5)); const ring = mesh(new T.TorusGeometry(0.1, 0.025, 6, 16), m, -0.25, 0.6); g.add(ring); return g; },
    voiture() { const g = new T.Group(); g.add(mesh(R.roundBox(0.9, 0.25, 0.45, 0.08), paint(0x2f62d9, 0.2), 0, 0.28)); g.add(mesh(R.roundBox(0.45, 0.2, 0.4, 0.08), R.lam(0x8fd0ff, { roughness: 0.05 }), -0.05, 0.48)); for (const x of [-0.28, 0.28]) for (const z of [-0.22, 0.22]) { const w = mesh(new T.CylinderGeometry(0.12, 0.12, 0.08, 14), paint(0x1b1d24), x, 0.13, z); w.rotation.x = Math.PI / 2; g.add(w); } return g; },
    ours() { const g = new T.Group(), b = paint(0xc98a4e, 0.8); g.add(mesh(new T.SphereGeometry(0.33, 18, 14), b, 0, 0.35)); g.add(mesh(new T.SphereGeometry(0.25, 18, 14), b, 0, 0.82)); for (const s of [-1, 1]) { g.add(mesh(new T.SphereGeometry(0.09, 10, 8), b, s * 0.18, 1.02)); g.add(mesh(new T.SphereGeometry(0.1, 10, 8), b, s * 0.3, 0.45, 0.1)); } g.add(mesh(new T.SphereGeometry(0.09, 10, 8), paint(0xf2d3a0), 0, 0.78, 0.22)); return g; },
    balle() {
      const tex = R.canvas(128, 64, (c, W, H) => { ['#e5352b', '#ffd23f', '#2f8fd8', '#48b58a'].forEach((col, i) => { c.fillStyle = col; c.fillRect((i * W) / 4, 0, W / 4, H); }); c.fillStyle = '#fff'; c.fillRect(0, H / 2 - 4, W, 8); });
      const g = new T.Group(); g.add(mesh(new T.SphereGeometry(0.45, 24, 16), R.lam(0xffffff, { map: tex, roughness: 0.15 }), 0, 0.45)); return g;
    },
    tambour() {
      const g = new T.Group(); g.add(mesh(new T.CylinderGeometry(0.42, 0.42, 0.5, 24), paint(0xe5352b, 0.3), 0, 0.3));
      for (const y of [0.05, 0.55]) { const r = mesh(new T.TorusGeometry(0.43, 0.04, 8, 28), paint(0xffd23f), 0, y); r.rotation.x = Math.PI / 2; g.add(r); }
      g.add(mesh(new T.CylinderGeometry(0.4, 0.4, 0.02, 24), paint(0xfff6e8, 0.6), 0, 0.56));
      for (const s of [-1, 1]) { const b = mesh(new T.CylinderGeometry(0.025, 0.025, 0.6, 8), paint(0x8a5c34), s * 0.2, 0.8, 0.1); b.rotation.z = s * 0.8; g.add(b); g.add(mesh(new T.SphereGeometry(0.06, 10, 8), paint(0xffffff), s * 0.42, 0.98, 0.1)); }
      return g;
    },
    trompette() {
      const g = new T.Group(), m = R.lam(0xf2c14e, { metalness: 1, roughness: 0.22 });
      const tube = mesh(new T.CylinderGeometry(0.06, 0.06, 0.9, 12), m, 0, 0.4); tube.rotation.z = Math.PI / 2; g.add(tube);
      const bell = R.lathe([[0.06, 0], [0.1, 0.15], [0.18, 0.28], [0.3, 0.36], [0.29, 0.37]], m); bell.rotation.z = -Math.PI / 2; bell.position.set(0.45, 0.4, 0); g.add(bell);
      for (let i = 0; i < 3; i++) g.add(mesh(new T.CylinderGeometry(0.035, 0.035, 0.22, 8), m, -0.1 + i * 0.12, 0.55));
      const loop = mesh(new T.TorusGeometry(0.14, 0.04, 8, 20), m, -0.05, 0.27); g.add(loop);
      return g;
    },
    cerfvolant() {
      const g = new T.Group(), sh = new T.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.35, 0); sh.lineTo(0, -0.45); sh.lineTo(-0.35, 0); sh.closePath();
      const tex = R.canvas(64, 64, (c) => { c.fillStyle = '#e5352b'; c.fillRect(0, 0, 32, 32); c.fillRect(32, 32, 32, 32); c.fillStyle = '#ffd23f'; c.fillRect(32, 0, 32, 32); c.fillRect(0, 32, 32, 32); });
      const geo = new T.ShapeGeometry(sh); geo.computeBoundingBox(); const uv = geo.attributes.uv, p = geo.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.35) / 0.7, (p.getY(i) + 0.45) / 1);
      const k = mesh(geo, R.lam(0xffffff, { map: tex, side: T.DoubleSide, roughness: 0.6 }), 0, 0.75); k.rotation.z = 0.3; g.add(k);
      for (let i = 0; i < 4; i++) g.add(mesh(new T.BoxGeometry(0.1, 0.05, 0.02), paint([0x2f8fd8, 0x48b58a][i % 2]), -0.15 - i * 0.05, 0.25 - i * 0.07));
      return g;
    },
    matriochka() {
      const g = new T.Group(); g.add(R.lathe([[0, 0], [0.32, 0], [0.38, 0.25], [0.3, 0.5], [0.22, 0.62], [0.26, 0.78], [0.18, 0.95], [0, 1.0]], paint(0xe5352b, 0.25)));
      const face = mesh(new T.SphereGeometry(0.17, 16, 12), paint(0xffe3c8, 0.5), 0, 0.78, 0.12); face.scale.z = 0.6; g.add(face);
      g.add(mesh(new T.SphereGeometry(0.14, 14, 10), paint(0xffd23f, 0.4), 0, 0.28, 0.3)); for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.025, 8, 6), paint(0x1b1d24), s * 0.06, 0.8, 0.22));
      return g;
    },
    culbuto() {
      const g = new T.Group(); g.add(mesh(new T.SphereGeometry(0.42, 20, 16), paint(0x48b58a, 0.25), 0, 0.42)); g.add(mesh(new T.SphereGeometry(0.26, 18, 14), paint(0xffe3c8, 0.5), 0, 0.95));
      const hat = mesh(new T.ConeGeometry(0.2, 0.35, 16), paint(0xe5352b, 0.3), 0, 1.3); g.add(hat); g.add(mesh(new T.SphereGeometry(0.05, 8, 6), paint(0xffffff), 0, 1.48));
      for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.035, 8, 6), paint(0x1b1d24), s * 0.09, 1.0, 0.23)); return g;
    },
    brique() {
      const g = new T.Group(), c = paint(0xe5352b, 0.25); g.add(mesh(R.roundBox(0.9, 0.38, 0.45, 0.04), c, 0, 0.19));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.add(mesh(new T.CylinderGeometry(0.075, 0.075, 0.1, 14), c, -0.33 + i * 0.22, 0.42, -0.11 + j * 0.22)); return g;
    },
    loco() {
      const g = new T.Group(); g.add(mesh(R.roundBox(0.9, 0.3, 0.45, 0.05), paint(0x2f62d9, 0.3), 0, 0.3));
      const boiler = mesh(new T.CylinderGeometry(0.2, 0.2, 0.55, 18), paint(0xe5352b, 0.3), 0.15, 0.6); boiler.rotation.z = Math.PI / 2; g.add(boiler);
      g.add(mesh(R.roundBox(0.32, 0.45, 0.45, 0.05), paint(0x2f62d9, 0.3), -0.28, 0.7)); g.add(mesh(new T.CylinderGeometry(0.07, 0.1, 0.25, 12), paint(0x1b1d24), 0.32, 0.88));
      for (const x of [-0.3, 0, 0.3]) for (const z of [-0.23, 0.23]) { const w = mesh(new T.CylinderGeometry(0.12, 0.12, 0.06, 16), paint(0xffd23f), x, 0.14, z); w.rotation.x = Math.PI / 2; g.add(w); }
      return g;
    },
    camion() {
      const g = new T.Group(); g.add(mesh(R.roundBox(0.32, 0.38, 0.45, 0.06), paint(0xffb23c, 0.3), 0.36, 0.38));
      const bed = mesh(R.roundBox(0.6, 0.3, 0.48, 0.04), paint(0xe5352b, 0.3), -0.15, 0.48); bed.rotation.z = 0.25; g.add(bed);
      g.add(mesh(new T.BoxGeometry(0.95, 0.08, 0.36), paint(0x3b3e47), 0, 0.22));
      for (const x of [-0.3, 0.36]) for (const z of [-0.22, 0.22]) { const w = mesh(new T.CylinderGeometry(0.13, 0.13, 0.08, 14), paint(0x1b1d24, 0.8), x, 0.13, z); w.rotation.x = Math.PI / 2; g.add(w); }
      return g;
    },
    helico() {
      const g = new T.Group(); const b = mesh(new T.SphereGeometry(0.32, 20, 14), paint(0x48b58a, 0.25), 0, 0.55); b.scale.set(1.3, 1, 1); g.add(b);
      g.add(mesh(new T.SphereGeometry(0.2, 14, 10), R.lam(0x8fd0ff, { roughness: 0.05 }), 0.22, 0.6, 0));
      const tail = mesh(new T.CylinderGeometry(0.04, 0.08, 0.6, 10), paint(0x48b58a, 0.25), -0.6, 0.62); tail.rotation.z = Math.PI / 2; g.add(tail);
      g.add(mesh(new T.BoxGeometry(1.3, 0.03, 0.1), paint(0x3b3e47), 0, 0.92)); g.add(mesh(new T.BoxGeometry(0.1, 0.03, 1.3), paint(0x3b3e47), 0, 0.92));
      for (const z of [-0.2, 0.2]) g.add(mesh(new T.BoxGeometry(0.8, 0.04, 0.04), paint(0x3b3e47), 0, 0.15, z));
      return g;
    },
    sousmarin() {
      const g = new T.Group(), y = paint(0xffd23f, 0.25); const b = mesh(new T.SphereGeometry(0.3, 20, 14), y, 0, 0.4); b.scale.set(1.8, 1, 1); g.add(b);
      g.add(mesh(R.roundBox(0.3, 0.3, 0.22, 0.06), y, 0.05, 0.75)); g.add(mesh(new T.CylinderGeometry(0.03, 0.03, 0.25, 8), paint(0x3b3e47), 0.1, 1.0));
      for (const x of [-0.25, 0.05, 0.35]) { const w = mesh(new T.CircleGeometry(0.07, 14), R.lam(0x7fd0ff, { roughness: 0.05 }), x, 0.45, 0.29); g.add(w); }
      const prop = mesh(new T.BoxGeometry(0.04, 0.3, 0.06), paint(0xe5352b), -0.6, 0.4); g.add(prop); return g;
    },
    ballon() {
      const g = new T.Group(); const b = mesh(new T.SphereGeometry(0.38, 20, 16), paint(0xff6fa8, 0.12), 0, 0.95); b.scale.y = 1.2; g.add(b);
      g.add(mesh(new T.ConeGeometry(0.06, 0.08, 10), paint(0xff6fa8, 0.12), 0, 0.47)); g.add(mesh(new T.CylinderGeometry(0.008, 0.008, 0.45, 4), paint(0xffffff), 0, 0.22)); return g;
    },
    xylo() {
      const g = new T.Group(); const cols = [0xe5352b, 0xff8a1e, 0xffd23f, 0x48b58a, 0x2f8fd8, 0x9b6ad6];
      for (const z of [-0.2, 0.2]) { const r = mesh(new T.BoxGeometry(0.95, 0.08, 0.06), paint(0x8a5c34), 0, 0.12, z); r.rotation.y = z > 0 ? 0.08 : -0.08; g.add(r); }
      cols.forEach((c, i) => g.add(mesh(R.roundBox(0.13, 0.06, 0.55 - i * 0.05, 0.02), paint(c, 0.25), -0.38 + i * 0.15, 0.2)));
      const st = mesh(new T.CylinderGeometry(0.02, 0.02, 0.5, 6), paint(0x8a5c34), 0.1, 0.38, 0.25); st.rotation.z = 1.2; g.add(st); g.add(mesh(new T.SphereGeometry(0.06, 10, 8), paint(0xe5352b), -0.12, 0.47, 0.25)); return g;
    },
    seau() {
      const g = new T.Group(); g.add(R.lathe([[0, 0], [0.3, 0], [0.4, 0.6], [0.36, 0.6], [0.27, 0.05], [0, 0.05]], paint(0x2f8fd8, 0.3)));
      const h = mesh(new T.TorusGeometry(0.38, 0.02, 6, 20, Math.PI), paint(0xffffff), 0, 0.6); g.add(h);
      const sp = mesh(new T.BoxGeometry(0.12, 0.6, 0.03), paint(0xffd23f), 0.45, 0.35, 0.1); sp.rotation.z = -0.3; g.add(sp); return g;
    },
    etoilemer() {
      const g = new T.Group(), sh = new T.Shape();
      for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.18 : 0.48; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const geo = new T.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3 }); geo.center();
      const s = mesh(geo, paint(0xff8a5c, 0.6), 0, 0.5); s.rotation.x = -0.4; g.add(s); return g;
    },
    pingouin() {
      const g = new T.Group(); const b = mesh(new T.SphereGeometry(0.32, 18, 14), paint(0x1b1d24, 0.5), 0, 0.42); b.scale.y = 1.3; g.add(b);
      const belly = mesh(new T.SphereGeometry(0.25, 16, 12), paint(0xffffff, 0.5), 0, 0.38, 0.12); belly.scale.y = 1.25; g.add(belly);
      g.add(mesh(new T.SphereGeometry(0.22, 16, 12), paint(0x1b1d24, 0.5), 0, 0.86)); const bk = mesh(new T.ConeGeometry(0.06, 0.14, 8), paint(0xffb23c), 0, 0.84, 0.24); bk.rotation.x = Math.PI / 2; g.add(bk);
      for (const s of [-1, 1]) { g.add(mesh(new T.SphereGeometry(0.04, 8, 6), paint(0xffffff), s * 0.08, 0.92, 0.18)); g.add(mesh(new T.BoxGeometry(0.14, 0.04, 0.2), paint(0xffb23c), s * 0.12, 0.02, 0.08)); }
      return g;
    },
    bonhomme() {
      const g = new T.Group(), w = paint(0xffffff, 0.7); g.add(mesh(new T.SphereGeometry(0.36, 18, 14), w, 0, 0.34)); g.add(mesh(new T.SphereGeometry(0.25, 18, 14), w, 0, 0.85));
      const n = mesh(new T.ConeGeometry(0.05, 0.22, 10), paint(0xff8a1e), 0, 0.85, 0.3); n.rotation.x = Math.PI / 2; g.add(n);
      g.add(mesh(new T.CylinderGeometry(0.2, 0.2, 0.06, 18), paint(0x1b1d24), 0, 1.06)); g.add(mesh(new T.CylinderGeometry(0.14, 0.14, 0.24, 18), paint(0x1b1d24), 0, 1.2));
      const sc = mesh(new T.TorusGeometry(0.2, 0.05, 8, 20), paint(0xe5352b), 0, 0.66); sc.rotation.x = Math.PI / 2; g.add(sc); return g;
    },
    grenouille() {
      const g = new T.Group(), c = paint(0x48b58a, 0.3); const b = mesh(new T.SphereGeometry(0.36, 18, 14), c, 0, 0.3); b.scale.set(1.1, 0.7, 1); g.add(b);
      for (const s of [-1, 1]) { g.add(mesh(new T.SphereGeometry(0.12, 14, 10), c, s * 0.16, 0.56, 0.12)); g.add(mesh(new T.SphereGeometry(0.06, 10, 8), paint(0x1b1d24), s * 0.16, 0.6, 0.22)); g.add(mesh(new T.SphereGeometry(0.1, 10, 8), c, s * 0.33, 0.1, 0.12)); }
      return g;
    },
    coccinelle() {
      const g = new T.Group(); const b = mesh(new T.SphereGeometry(0.4, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), paint(0xe5352b, 0.2), 0, 0.1); g.add(b);
      g.add(mesh(new T.SphereGeometry(0.17, 14, 10), paint(0x1b1d24, 0.3), 0.4, 0.15)); g.add(mesh(new T.BoxGeometry(0.02, 0.32, 0.8), paint(0x1b1d24), 0, 0.3));
      for (const [x, z] of [[-0.15, 0.2], [0.12, -0.22], [-0.05, -0.2], [0.15, 0.18], [-0.25, -0.05]]) g.add(mesh(new T.SphereGeometry(0.07, 10, 8), paint(0x1b1d24), x, 0.42 - Math.hypot(x, z) * 0.45, z));
      return g;
    },
    moulin() {
      const g = new T.Group(); g.add(mesh(new T.CylinderGeometry(0.03, 0.03, 1.0, 8), paint(0xffffff), 0, 0.5));
      const w = new T.Group(); [0xe5352b, 0xffd23f, 0x2f8fd8, 0x48b58a].forEach((c, i) => { const v = new T.Mesh(new T.ConeGeometry(0.22, 0.4, 3), R.lam(c, { roughness: 0.4, side: T.DoubleSide })); v.position.set(0, 0.2, 0); v.scale.z = 0.15; const h = new T.Group(); h.add(v); h.rotation.z = (i * Math.PI) / 2; w.add(h); });
      w.position.set(0, 1.0, 0.04); g.add(w); g.add(mesh(new T.SphereGeometry(0.05, 10, 8), paint(0xffd23f), 0, 1.0, 0.06)); return g;
    },
    fusee() {
      const g = new T.Group(); g.add(R.lathe([[0, 0.1], [0.2, 0.12], [0.24, 0.4], [0.22, 0.8], [0.12, 1.05], [0, 1.15]], paint(0xffffff, 0.25)));
      g.add(R.lathe([[0, 0.85], [0.19, 0.85], [0.12, 1.05], [0, 1.15]], paint(0x2f8fd8, 0.25))); g.add(mesh(new T.CircleGeometry(0.07, 14), R.lam(0x7fd0ff, { roughness: 0.05 }), 0, 0.62, 0.235));
      for (let i = 0; i < 3; i++) { const f = mesh(new T.BoxGeometry(0.04, 0.28, 0.2), paint(0x2f8fd8), 0, 0.22, 0); f.geometry.translate(0, 0, 0.28); f.rotation.y = (i * Math.PI * 2) / 3; g.add(f); }
      return g;
    },
    dino() {
      const g = new T.Group(), c = paint(0x6fbf5a, 0.4); const b = mesh(new T.SphereGeometry(0.3, 18, 14), c, 0, 0.42); b.scale.set(1.5, 1, 0.9); g.add(b);
      const neck = mesh(new T.CylinderGeometry(0.09, 0.14, 0.5, 12), c, 0.38, 0.75); neck.rotation.z = -0.5; g.add(neck); g.add(mesh(new T.SphereGeometry(0.15, 14, 10), c, 0.55, 1.0));
      const tail = mesh(new T.ConeGeometry(0.14, 0.6, 12), c, -0.6, 0.38); tail.rotation.z = Math.PI / 2 + 0.3; g.add(tail);
      for (const x of [-0.2, 0.2]) for (const z of [-0.14, 0.14]) g.add(mesh(new T.CylinderGeometry(0.07, 0.08, 0.25, 10), c, x, 0.12, z));
      for (let i = 0; i < 4; i++) g.add(mesh(new T.ConeGeometry(0.06, 0.14, 4), paint(0xffb23c), -0.3 + i * 0.18, 0.72, 0));
      g.add(mesh(new T.SphereGeometry(0.03, 8, 6), paint(0x1b1d24), 0.62, 1.04, 0.1)); return g;
    },
  };

  // Figurines des rivaux champions (hauteur ~1,7), sur un petit socle doré.
  const eyes = (g, y, z, dx = 0.1, r = 0.05) => { for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(r, 10, 8), paint(0x1b1d24, 0.2), s * dx, y, z)); };
  const figBase = (g) => { g.add(mesh(new T.CylinderGeometry(0.55, 0.6, 0.16, 28), R.lam(0x22232a, { roughness: 0.35 }), 0, 0.08)); const rim = mesh(new T.TorusGeometry(0.56, 0.03, 6, 28), gold(), 0, 0.16); rim.rotation.x = Math.PI / 2; g.add(rim); return g; };
  MB.FIG_MODELS = [
    function loulou() {                                    // loup gris, écharpe rouge
      const g = figBase(new T.Group()), fur = paint(0x8b8f9c, 0.8), pale = paint(0xe9e4dc, 0.8);
      const b = mesh(R.lump(0.36, 0.03, 4, 3), fur, 0, 0.62); b.scale.set(1, 1.25, 0.9); g.add(b);
      const belly = mesh(new T.SphereGeometry(0.22, 16, 12), pale, 0, 0.6, 0.2); belly.scale.set(1, 1.3, 0.5); g.add(belly);
      g.add(mesh(new T.SphereGeometry(0.3, 18, 14), fur, 0, 1.2));
      const sn = mesh(new T.ConeGeometry(0.13, 0.32, 12), pale, 0, 1.14, 0.34); sn.rotation.x = Math.PI / 2; g.add(sn);
      g.add(mesh(new T.SphereGeometry(0.05, 8, 6), paint(0x1b1d24), 0, 1.15, 0.5));
      for (const s of [-1, 1]) { const e = mesh(new T.ConeGeometry(0.09, 0.26, 4), fur, s * 0.16, 1.5, 0); e.rotation.z = -s * 0.25; g.add(e); }
      eyes(g, 1.27, 0.25, 0.1);
      const sc = mesh(new T.TorusGeometry(0.22, 0.06, 8, 20), paint(0xe5352b, 0.5), 0, 0.95); sc.rotation.x = Math.PI / 2; g.add(sc);
      const tail = mesh(new T.ConeGeometry(0.12, 0.5, 10), fur, 0, 0.5, -0.4); tail.rotation.x = -1.1; g.add(tail);
      return g;
    },
    function zebulon() {                                   // diable à ressort, bonnet de bouffon
      const g = figBase(new T.Group());
      for (let i = 0; i < 6; i++) { const t = mesh(new T.TorusGeometry(0.22, 0.045, 8, 20), R.lam(0xcfd3da, { metalness: 0.9, roughness: 0.25 }), 0, 0.26 + i * 0.12); t.rotation.x = Math.PI / 2 + (i % 2 ? 0.12 : -0.12); g.add(t); }
      g.add(mesh(new T.SphereGeometry(0.34, 20, 16), paint(0xffe0c2, 0.6), 0, 1.15));
      const smile = mesh(new T.TorusGeometry(0.14, 0.025, 6, 16, Math.PI), paint(0xe5352b), 0, 1.06, 0.31); smile.rotation.z = Math.PI; g.add(smile);
      g.add(mesh(new T.SphereGeometry(0.07, 10, 8), paint(0xe5352b), 0, 1.15, 0.34));
      eyes(g, 1.24, 0.3, 0.12);
      for (const s of [-1, 1]) { const h = mesh(new T.ConeGeometry(0.16, 0.5, 12), paint(s < 0 ? 0xe5352b : 0xffd23f, 0.4), s * 0.2, 1.55, 0); h.rotation.z = -s * 0.8; g.add(h); g.add(mesh(new T.SphereGeometry(0.07, 10, 8), gold(), s * 0.42, 1.68, 0)); }
      return g;
    },
    function mamie() {                                     // grand-mère pilote : robe violette, chignon, lunettes
      const g = figBase(new T.Group());
      g.add(R.lathe([[0, 0.16], [0.4, 0.16], [0.34, 0.5], [0.24, 0.85], [0.18, 0.95], [0, 0.95]], paint(0x8a4fd0, 0.6)));
      for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.07, 8, 6), paint(0xffe0c2), s * 0.3, 0.62, 0.12));
      g.add(mesh(new T.SphereGeometry(0.27, 18, 14), paint(0xffe0c2, 0.6), 0, 1.18));
      const hair = mesh(new T.SphereGeometry(0.29, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), paint(0xeeeeee, 0.9), 0, 1.2, -0.03); g.add(hair);
      g.add(mesh(new T.SphereGeometry(0.15, 14, 10), paint(0xeeeeee, 0.9), 0, 1.47, -0.12));
      for (const s of [-1, 1]) { const l = mesh(new T.TorusGeometry(0.075, 0.016, 6, 16), R.lam(0xd4a537, { metalness: 1, roughness: 0.3 }), s * 0.1, 1.2, 0.25); g.add(l); }
      eyes(g, 1.2, 0.25, 0.1, 0.03);
      const col = mesh(new T.TorusGeometry(0.2, 0.05, 8, 20), paint(0xff8fb5, 0.5), 0, 0.95); col.rotation.x = Math.PI / 2; g.add(col);
      return g;
    },
    function biscotte() {                                  // biscotte dorée, croûte, petits bras
      const g = figBase(new T.Group()), crust = paint(0xb8742f, 0.8);
      const b = mesh(R.roundBox(0.8, 1.0, 0.22, 0.1), paint(0xf0c27a, 0.85), 0, 0.85); g.add(b);
      const edge = mesh(R.roundBox(0.88, 1.08, 0.18, 0.1), crust, 0, 0.85, -0.03); g.add(edge);
      for (let i = 0; i < 8; i++) g.add(mesh(new T.SphereGeometry(0.03, 6, 4), crust, -0.25 + (i % 4) * 0.17, 0.5 + Math.floor(i / 4) * 0.62, 0.12));
      eyes(g, 1.0, 0.12, 0.14, 0.055);
      const smile = mesh(new T.TorusGeometry(0.12, 0.022, 6, 16, Math.PI), paint(0x6a3410), 0, 0.86, 0.12); smile.rotation.z = Math.PI; g.add(smile);
      for (const s of [-1, 1]) { const a = mesh(new T.CylinderGeometry(0.035, 0.035, 0.36, 6), crust, s * 0.52, 0.82, 0); a.rotation.z = s * 0.9; g.add(a); g.add(mesh(new T.CylinderGeometry(0.04, 0.04, 0.22, 6), crust, s * 0.2, 0.26, 0)); }
      return g;
    },
    function max() {                                       // raton masqué, queue rayée, casquette
      const g = figBase(new T.Group()), fur = paint(0x8a7f74, 0.8), dark = paint(0x2a2730, 0.6);
      const b = mesh(R.lump(0.34, 0.03, 6, 3), fur, 0, 0.6); b.scale.set(1, 1.2, 0.9); g.add(b);
      g.add(mesh(new T.SphereGeometry(0.31, 18, 14), fur, 0, 1.16));
      const mask = mesh(new T.CylinderGeometry(0.315, 0.315, 0.13, 20, 1, true), dark, 0, 1.2); mask.material.side = T.DoubleSide; g.add(mask);
      for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.06, 10, 8), paint(0xffffff, 0.3), s * 0.11, 1.2, 0.29));
      g.add(mesh(new T.SphereGeometry(0.1, 12, 10), paint(0xe9e4dc, 0.8), 0, 1.08, 0.27));
      g.add(mesh(new T.SphereGeometry(0.04, 8, 6), dark, 0, 1.11, 0.36));
      for (const s of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.09, 10, 8), fur, s * 0.2, 1.43, 0));
      g.add(mesh(new T.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), paint(0x2f62d9, 0.5), 0, 1.3, -0.02));
      const peak = mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 16, 1, false, -Math.PI / 2, Math.PI), paint(0x2f62d9, 0.5), 0, 1.31, 0.2); g.add(peak);
      for (let i = 0; i < 5; i++) { const t = mesh(new T.CylinderGeometry(0.1 - i * 0.008, 0.11 - i * 0.008, 0.12, 10), i % 2 ? dark : fur, 0, 0.35 + i * 0.1, -0.38 - i * 0.04); t.rotation.x = -0.5; g.add(t); }
      return g;
    },
  ];

  // Jouet pas encore sorti : petit paquet cadeau fermé.
  function giftBox() {
    const g = new T.Group();
    g.add(mesh(R.roundBox(0.6, 0.5, 0.6, 0.05), paint(0x9b8fb0, 0.6), 0, 0.25));
    g.add(mesh(new T.BoxGeometry(0.62, 0.52, 0.1), paint(0xd8cfe6, 0.5), 0, 0.25)); g.add(mesh(new T.BoxGeometry(0.1, 0.52, 0.62), paint(0xd8cfe6, 0.5), 0, 0.25));
    for (const s of [-1, 1]) { const b = mesh(new T.TorusGeometry(0.1, 0.035, 6, 14), paint(0xd8cfe6, 0.5), s * 0.09, 0.55); b.rotation.y = Math.PI / 2; g.add(b); }
    return g;
  }

  // Trophée pas encore gagné : même forme, en silhouette mate et sombre.
  function silhouette(root) {
    const m = new T.MeshStandardMaterial({ color: 0x3a3d4a, roughness: 0.85, metalness: 0 });
    root.traverse((o) => { if (o.isMesh) o.material = m; });
  }

  // Reflets chauds et clairs : l'environnement des circuits, sombre en bas, rendait l'or brun.
  function roomEnv(view) {
    const sc = new T.Scene(), c = document.createElement('canvas'); c.width = 16; c.height = 256;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#fffaf0'); gr.addColorStop(0.5, '#f3d7a8'); gr.addColorStop(1, '#8a5a3a');
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
    const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
    sc.add(new T.Mesh(new T.SphereGeometry(50, 24, 16), new T.MeshBasicMaterial({ map: tx, side: T.BackSide })));
    for (const [x, y, z] of [[20, 30, 10], [-18, 24, 20], [4, 20, 30], [0, 10, -30]]) {
      const l = new T.Mesh(new T.BoxGeometry(16, 3, 8), new T.MeshBasicMaterial({ color: new T.Color(5, 4.6, 4) })); l.position.set(x, y, z); l.lookAt(0, 0, 0); sc.add(l);
    }
    const pm = new T.PMREMGenerator(view.r), rt = pm.fromScene(sc, 0.02);
    pm.dispose();
    return rt.texture;
  }

  function room(view) {
    const s = new T.Scene(), env = roomEnv(view);
    s.background = new T.Color(0x2a1d22);
    s.fog = new T.Fog(0x2a1d22, 22, 46);
    R.lam.env = env;
    s.add(new T.HemisphereLight(0xffe8d0, 0x3a2830, 0.5));
    const key = new T.DirectionalLight(0xfff0dc, 0.7); key.position.set(4, 10, 9); s.add(key);
    const spot = new T.SpotLight(0xfff2d8, 2.6, 22, 0.42, 0.55, 1.2); spot.position.set(0, 9, 4); s.add(spot, spot.target);

    // Mur : velours bordeaux à motifs, boiserie en bas.
    const wallTex = R.canvas(512, 512, (g, W, H) => {
      g.fillStyle = '#5a2232'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,200,150,.07)';
      for (let x = 0; x < W; x += 64) for (let y = 0; y < H; y += 64) { const o = (y / 64) % 2 ? 32 : 0; g.beginPath(); g.moveTo(x + o + 32, y + 8); g.lineTo(x + o + 52, y + 32); g.lineTo(x + o + 32, y + 56); g.lineTo(x + o + 12, y + 32); g.fill(); }
    });
    wallTex.wrapS = wallTex.wrapT = T.RepeatWrapping; wallTex.repeat.set(16, 3);
    const n = MB.TROPHIES.length, len = n * SPACING + 30;
    s.add(mesh(new T.PlaneGeometry(len, 16), R.lam(0xffffff, { map: wallTex, roughness: 0.95 }), (n - 1) * SPACING / 2, 6, -2.2));
    const wood = R.lam(0x8a5530, { roughness: 0.45 }), dark = R.lam(0x5c3820, { roughness: 0.5 });
    s.add(mesh(new T.BoxGeometry(len, 5, 0.3), dark, (n - 1) * SPACING / 2, -3.1, -2));
    // Étagère : planche, chant doré, consoles.
    s.add(mesh(new T.BoxGeometry(len, 0.35, 3.4), wood, (n - 1) * SPACING / 2, -0.18, -0.5));
    s.add(mesh(new T.BoxGeometry(len, 0.08, 0.08), gold(), (n - 1) * SPACING / 2, -0.02, 1.22));
    for (let i = -1; i <= n; i += 2) { const b = mesh(new T.BoxGeometry(0.3, 1.2, 1.6), dark, i * SPACING + SPACING / 2, -0.9, -1.2); s.add(b); }
    // Halo au mur derrière le trophée regardé.
    const halo = mesh(new T.PlaneGeometry(7, 7), new T.MeshBasicMaterial({ map: R.canvas(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(255,214,150,.55)'); r.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false }), 0, 2.4, -2.15);
    s.add(halo);

    const items = MB.TROPHIES.map((tr, i) => {
      const base = new T.Group();
      base.add(mesh(R.roundBox(2.3, 0.5, 2.1, 0.12), R.lam(0x22232a, { roughness: 0.35 }), 0, 0.25));
      base.add(mesh(new T.BoxGeometry(1.1, 0.26, 0.04), gold(), 0, 0.25, 1.06));
      const turn = new T.Group(); turn.position.y = 0.5; base.add(turn);
      base.position.set(i * SPACING, 0, 0);
      s.add(base);
      return { id: tr.id, base, turn, model: null, got: null, tier: 0, deco: null };
    });
    // Étagère du bas : les jouets cachés, sous les trophées du milieu.
    s.add(mesh(new T.BoxGeometry(len, 0.28, 2.6), wood, (n - 1) * SPACING / 2, -2.3, 0.2));
    s.add(mesh(new T.BoxGeometry(len, 0.06, 0.06), gold(), (n - 1) * SPACING / 2, -2.16, 1.5));
    const toySp = ((n - 1) * SPACING) / (MB.TOYS.length - 1);
    const toys = MB.TOYS.map((y, i) => {
      const g = new T.Group(); g.position.set(i * toySp, -2.16, 0.4); s.add(g);
      return { id: y.id, g, model: null, got: null };
    });
    // Vitrine des champions : une planche au-dessus des trophées, qui suit le regard, avec les 5 figurines.
    const figShelf = new T.Group(); figShelf.position.set(0, 3.95, -1.5); s.add(figShelf);
    figShelf.add(mesh(new T.BoxGeometry(6.6, 0.16, 1.1), wood, 0, -0.08, 0));
    figShelf.add(mesh(new T.BoxGeometry(6.6, 0.05, 0.05), gold(), 0, 0.0, 0.55));
    const figs = MB.FIGS.map((f, i) => { const g = new T.Group(); g.position.set((i - 2) * 1.3, 0, 0.1); figShelf.add(g); return { rival: f.rival, g, model: null, got: null }; });
    view._linear(s);
    R.lam.env = null;
    return { s, env, spot, halo, items, toys, figShelf, figs, sel: 0, camX: 0, t: 0, spin: 0, drag: 0 };
  }

  Object.assign(MB.View.prototype, {
    // st : { tiers: palier de chaque trophée (0 : pas gagné), paliers: trophées qui en ont, toys: jouets trouvés } ; sel : index affiché.
    showTrophies(st, sel) {
      if (!this.troom) this.troom = room(this);
      const r = this.troom;
      this.mode = 'troph';
      R.lam.env = r.env;
      for (const it of r.items) {
        const tier = st.tiers[it.id] || 0, has = tier > 0;
        if (!it.model || it.got !== has) {
          if (it.model) it.turn.remove(it.model);
          const m = MODELS[it.id] ? MODELS[it.id]() : MODELS.cup();
          if (!has) silhouette(m);
          this._linear(m);
          it.turn.add(m); it.model = m; it.got = has;
        }
        // Palier : liseré du socle et trois billes, allumées une par palier (bronze, argent, or).
        if (it.tier !== tier && st.paliers.includes(it.id)) {
          if (it.deco) it.base.remove(it.deco);
          const d = new T.Group(), col = [0x55565e, 0xc7804a, 0xdfe4ea, 0xf2c14e][tier];
          if (tier) d.add(mesh(new T.BoxGeometry(2.36, 0.1, 2.16), R.lam(col, { metalness: 1, roughness: 0.25 }), 0, 0.46));
          for (let k = 0; k < 3; k++) d.add(mesh(new T.SphereGeometry(0.09, 10, 8), k < tier ? R.lam(col, { metalness: 1, roughness: 0.2, emissive: col, emissiveIntensity: 0.25 }) : R.lam(0x55565e), -0.4 + k * 0.4, 0.25, 1.1));
          this._linear(d); it.base.add(d); it.deco = d; it.tier = tier;
        }
      }
      r.toys.forEach((y, i) => {
        // Trouvé : en couleurs ; sorti mais pas trouvé : silhouette ; pas encore sorti : paquet cadeau fermé.
        const has = st.toys.includes(y.id), state = has ? ((st.gold || []).includes(y.id) ? 'gold' : 'got') : i < st.released ? 'hunt' : 'soon';
        if (y.model && y.got === state) return;
        if (y.model) y.g.remove(y.model);
        const m = state === 'soon' ? giftBox() : MB.TOY_MODELS[y.id](); m.scale.setScalar(state === 'soon' ? 1 : 1.15); m.rotation.y = 0.5;
        if (state === 'hunt') silhouette(m);
        if (state === 'gold') { const gm = R.lam(0xf2c14e, { metalness: 1, roughness: 0.22, emissive: 0x6a4a00, emissiveIntensity: 0.25 }); m.traverse((o) => { if (o.isMesh) o.material = gm; }); }
        this._linear(m);
        y.g.add(m); y.model = m; y.got = state;
      });
      for (const f of r.figs) {                             // figurine gagnée en couleurs, sinon silhouette
        const has = (st.figs || []).includes(f.rival);
        if (f.model && f.got === has) continue;
        if (f.model) f.g.remove(f.model);
        const m = MB.FIG_MODELS[f.rival](); m.scale.setScalar(0.66);
        if (!has) silhouette(m);
        this._linear(m); f.g.add(m); f.model = m; f.got = has;
      }
      R.lam.env = null;
      this.selectTrophy(sel, true);
    },
    selectTrophy(i, now) {
      const r = this.troom; if (!r) return;
      r.sel = i; r.spin = 0;
      if (now) r.camX = i * SPACING;
    },
    dragTrophies(dx) { if (this.troom) this.troom.drag = dx; },
    frameTrophies(dt) {
      const r = this.troom, k = 1 - Math.exp(-dt * 6);
      r.t += dt;
      const target = r.sel * SPACING - r.drag * 0.02;
      r.camX += (target - r.camX) * k;
      r.items.forEach((it, i) => {
        const on = i === r.sel, sc = it.turn.scale.x + ((on ? 1.2 : 0.85) - it.turn.scale.x) * k;
        it.turn.scale.setScalar(sc);
        if (on) { r.spin += dt * 0.7; it.turn.rotation.y = Math.sin(r.spin) * 0.7; it.turn.position.y = 0.5 + Math.sin(r.t * 2) * 0.05; }
        else { it.turn.rotation.y *= 1 - k; it.turn.position.y = 0.5; }
      });
      const x = r.sel * SPACING;
      r.spot.position.set(x + 1.5, 9, 5); r.spot.target.position.set(x, 1.4, 0); r.spot.target.updateMatrixWorld();
      r.halo.position.x += (x - r.halo.position.x) * k;
      r.figShelf.position.x = r.camX;
      for (const f of r.figs) if (f.got) f.model.rotation.y = Math.sin(r.t * 0.7 + f.rival) * 0.35;
      for (const y of r.toys) if (y.got === 'got') y.model.rotation.y = 0.5 + Math.sin(r.t * 0.8 + y.g.position.x) * 0.4;
      const fit = Math.max(1, 0.62 / this.cam.aspect);
      this.cam.fov = 40; this.cam.updateProjectionMatrix();
      this.cam.position.set(r.camX, 3.6 + Math.sin(r.t * 0.4) * 0.1, 14 * fit);
      this.cam.lookAt(r.camX, -0.2, 0);                     // le trophée reste au-dessus de la carte du bas
      this.r.render(r.s, this.cam);
    },
  });
})();
