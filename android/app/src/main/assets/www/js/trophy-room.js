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
  };

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
      return { id: tr.id, base, turn, model: null, got: null };
    });
    view._linear(s);
    R.lam.env = null;
    return { s, env, spot, halo, items, sel: 0, camX: 0, t: 0, spin: 0, drag: 0 };
  }

  Object.assign(MB.View.prototype, {
    // got : identifiants des trophées gagnés ; sel : index affiché.
    showTrophies(got, sel) {
      if (!this.troom) this.troom = room(this);
      const r = this.troom;
      this.mode = 'troph';
      R.lam.env = r.env;
      for (const it of r.items) {
        const has = got.includes(it.id);
        if (it.model && it.got === has) continue;
        if (it.model) it.turn.remove(it.model);
        const m = MODELS[it.id] ? MODELS[it.id]() : MODELS.cup();
        if (!has) silhouette(m);
        this._linear(m);
        it.turn.add(m); it.model = m; it.got = has;
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
      const fit = Math.max(1, 0.62 / this.cam.aspect);
      this.cam.fov = 40; this.cam.updateProjectionMatrix();
      this.cam.position.set(r.camX, 3.6 + Math.sin(r.t * 0.4) * 0.1, 14 * fit);
      this.cam.lookAt(r.camX, -0.2, 0);                     // le trophée reste au-dessus de la carte du bas
      this.r.render(r.s, this.cam);
    },
  });
})();
