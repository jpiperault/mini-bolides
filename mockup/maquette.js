// Maquettes à valider avant développement : personnages (#perso) et décors supplémentaires (#decor).
(function () {
  const T = THREE, { lam, roundBox, canvas } = MB.R;
  const W = innerWidth, H = innerHeight, r = new T.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
  r.setSize(W, H); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping;
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  const s = new T.Scene(); s.background = new T.Color(0xf3ece2);
  s.add(new T.HemisphereLight(0xfff6ea, 0xb99b80, 0.75));
  const sun = new T.DirectionalLight(0xffffff, 1.5); sun.position.set(30, 60, 50); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 }); sun.shadow.radius = 4; s.add(sun);
  const ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: 0xe9dcc8, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  const cam = new T.PerspectiveCamera(30, W / H, 1, 600);
  const labels = [];
  let cams = null;
  const label = (x, y, z, html, panel) => labels.push({ v: new T.Vector3(x, y, z), html, panel });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); return m; };

  // ---------- Personnages ----------
  const SKIN = [0xffd7b0, 0xe8b48a, 0xb07a52, 0x7a4e32];
  const capsule = (rad, len, seg = 18) => {
    const p = [];
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; p.push(new T.Vector2(Math.sin(a) * rad, -len - Math.cos(a) * rad)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; p.push(new T.Vector2(Math.cos(a) * rad, Math.sin(a) * rad)); }
    return new T.LatheGeometry(p, seg);                                // membre suspendu à son articulation (y = 0)
  };
  // Visage : yeux, sourire, joues. big = grands yeux brillants.
  function face(head, rad, big) {
    const black = lam(0x1d1b22, { roughness: 0.25 }), white = lam(0xffffff, { roughness: 0.2 });
    for (const k of [-1, 1]) {
      if (big) {
        const e = mesh(new T.SphereGeometry(rad * 0.22, 20, 14), white, k * rad * 0.36, rad * 0.08, rad * 0.86); e.scale.set(1, 1.15, 0.5); head.add(e);
        head.add(mesh(new T.SphereGeometry(rad * 0.14, 16, 12), black, k * rad * 0.36, rad * 0.06, rad * 0.95));
        head.add(mesh(new T.SphereGeometry(rad * 0.05, 8, 6), white, k * rad * 0.36 + rad * 0.05, rad * 0.13, rad * 1.02));
      } else head.add(mesh(new T.SphereGeometry(rad * 0.1, 14, 10), black, k * rad * 0.32, rad * 0.12, rad * 0.93));
      const j = mesh(new T.SphereGeometry(rad * 0.15, 14, 10), lam(0xff8f8f, { roughness: 0.8 }), k * rad * 0.55, -rad * 0.18, rad * 0.78); j.scale.z = 0.35; head.add(j);
    }
    const smile = mesh(new T.TorusGeometry(rad * 0.24, rad * 0.045, 8, 20, Math.PI), lam(0x7a2a2a), 0, -rad * 0.2, rad * 0.94);
    smile.rotation.z = Math.PI; head.add(smile);
  }
  const limb = (geo, mat, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); g.add(new T.Mesh(geo, mat)); return g; };

  // A : jouet articulé (bras, mains en pince, jambes, chaussures, cheveux moulés).
  function styleA(c) {
    const g = new T.Group(), skin = lam(c.skin), shirt = lam(c.shirt, { roughness: 0.4 }), pants = lam(c.pants, { roughness: 0.4 }), shoe = lam(0x2b2d35, { roughness: 0.4 }), hair = lam(c.hair, { roughness: 0.35 });
    g.legs = [-1, 1].map((k) => { const l = limb(roundBox(0.62, 1.7, 0.68, 0.2), pants, k * 0.35, 1.95, 0); l.children[0].position.y = -0.85; l.add(mesh(roundBox(0.66, 0.34, 1, 0.15), shoe, 0, -1.78, 0.16)); g.add(l); return l; });
    g.add(mesh(roundBox(1.42, 0.5, 0.76, 0.2), pants, 0, 2.05, 0));
    g.add(mesh(roundBox(1.44, 1.6, 0.8, 0.32), shirt, 0, 3.05, 0));
    g.arms = [-1, 1].map((k) => {
      const a = limb(roundBox(0.42, 1.3, 0.48, 0.19), shirt, k * 0.9, 3.65, 0); a.children[0].position.y = -0.55;
      const hand = mesh(new T.TorusGeometry(0.2, 0.1, 10, 18, Math.PI * 1.5), skin, 0, -1.38, 0.05); hand.rotation.set(Math.PI / 2, 0, Math.PI * 0.25 + Math.PI / 2); a.add(hand);
      g.add(a); return a;
    });
    g.add(mesh(new T.CylinderGeometry(0.22, 0.26, 0.3, 16), skin, 0, 3.95, 0));
    const head = new T.Group(); head.position.y = 4.55; g.add(head);
    head.add(mesh(new T.SphereGeometry(0.64, 32, 24), skin));
    const cap = mesh(new T.SphereGeometry(0.69, 32, 16, 0, Math.PI * 2, 0, 1.55), hair, 0, 0.06, -0.04); cap.rotation.x = -0.35; head.add(cap);
    face(head, 0.64, false);
    g.k = 1; return g;
  }
  // B : pantin en bois verni (articulations en boules, coudes et genoux).
  function styleB(c) {
    const g = new T.Group(), wood = lam(0xe2b483, { roughness: 0.3 }), shirt = lam(c.shirt, { roughness: 0.35 }), shoe = lam(c.pants, { roughness: 0.35 });
    const ball = (rd) => new T.SphereGeometry(rd, 16, 12), stick = (rd, len) => capsule(rd, len, 14);
    g.legs = [-1, 1].map((k) => {
      const l = limb(stick(0.2, 0.85), wood, k * 0.32, 2.05, 0);
      const knee = new T.Group(); knee.position.y = -1.05; l.add(knee); l.knee = knee;
      knee.add(mesh(ball(0.21), wood)); const shin = new T.Mesh(stick(0.18, 0.75), wood); knee.add(shin);
      const f = mesh(ball(0.3), shoe, 0, -0.98, 0.18); f.scale.set(0.95, 0.55, 1.5); knee.add(f);
      g.add(l); return l;
    });
    const hip = mesh(ball(0.55), wood, 0, 2.15, 0); hip.scale.set(1.2, 0.6, 0.8); g.add(hip);
    const torso = mesh(ball(0.75), shirt, 0, 3.05, 0); torso.scale.set(0.95, 1.15, 0.7); g.add(torso);
    g.arms = [-1, 1].map((k) => {
      const a = limb(stick(0.16, 0.7), wood, k * 0.82, 3.65, 0); a.add(mesh(ball(0.22), wood));
      const el = new T.Group(); el.position.y = -0.88; a.add(el); a.elbow = el;
      el.add(mesh(ball(0.17), wood)); el.add(new T.Mesh(stick(0.14, 0.62), wood));
      el.add(mesh(ball(0.25), wood, 0, -0.85, 0.02)); el.add(mesh(ball(0.1), wood, k * -0.18, -0.72, 0.14));
      g.add(a); return a;
    });
    g.add(mesh(new T.CylinderGeometry(0.15, 0.18, 0.4, 12), wood, 0, 4.05, 0));
    const head = new T.Group(); head.position.y = 4.65; g.add(head);
    const hd = mesh(ball(0.62), wood); hd.scale.y = 1.12; head.add(hd);
    const bonnet = mesh(new T.SphereGeometry(0.66, 28, 14, 0, Math.PI * 2, 0, 1.3), lam(c.hair, { roughness: 0.8 }), 0, 0.12, 0); head.add(bonnet);
    head.add(mesh(ball(0.18), lam(0xffffff, { roughness: 0.9 }), 0, 0.78, 0));
    face(head, 0.62, false);
    g.k = 2; return g;
  }
  // C : figurine ronde (grosse tête, petits bras et jambes, moufles, grands yeux).
  function styleC(c) {
    const g = new T.Group(), skin = lam(c.skin, { roughness: 0.6 }), shirt = lam(c.shirt, { roughness: 0.55 }), shoe = lam(c.pants, { roughness: 0.4 });
    g.legs = [-1, 1].map((k) => { const l = limb(capsule(0.3, 0.38), lam(0x3b4a6b, { roughness: 0.6 }), k * 0.42, 1.12, 0); const f = mesh(new T.SphereGeometry(0.42, 20, 14), shoe, 0, -0.66, 0.16); f.scale.set(0.95, 0.6, 1.3); l.add(f); g.add(l); return l; });
    const body = mesh(new T.SphereGeometry(0.95, 32, 24), shirt, 0, 1.78, 0); body.scale.set(1, 1.08, 0.88); g.add(body);
    g.arms = [-1, 1].map((k) => {
      const a = limb(capsule(0.24, 0.5), shirt, k * 0.86, 2.25, 0);
      a.add(mesh(new T.SphereGeometry(0.3, 18, 14), skin, 0, -0.78, 0.02)); a.add(mesh(new T.SphereGeometry(0.13, 12, 8), skin, k * -0.22, -0.66, 0.12));
      g.add(a); return a;
    });
    const head = new T.Group(); head.position.y = 3.55; g.add(head);
    head.add(mesh(new T.SphereGeometry(1.05, 36, 28), skin));
    const cap = mesh(new T.SphereGeometry(1.1, 36, 16, 0, Math.PI * 2, 0, 1.25), lam(c.hair, { roughness: 0.55 }), 0, 0.05, -0.06); cap.rotation.x = -0.3; head.add(cap);
    face(head, 1.05, true);
    g.k = 3; return g;
  }
  // Poses : repos, joie (saut, bras levés, genou levé), coucou (une main qui salue).
  function pose(g, p) {
    const [L, R] = g.arms, [LL, RL] = g.legs;
    if (p === 'repos') { L.rotation.z = -0.12; R.rotation.z = 0.12; }
    if (p === 'joie') {
      L.rotation.z = -2.6; R.rotation.z = 2.6; L.rotation.x = R.rotation.x = -0.2;
      LL.rotation.x = -0.75; if (LL.knee) LL.knee.rotation.x = 1.2;
      if (L.elbow) { L.elbow.rotation.z = 0.5; R.elbow.rotation.z = -0.5; }
      g.position.y = 0.7;
    }
    if (p === 'coucou') {
      R.rotation.z = 2.5; R.rotation.y = -0.3; if (R.elbow) R.elbow.rotation.z = -0.7;
      L.rotation.z = -0.15; g.rotation.z = -0.05; RL.rotation.x = 0.15; LL.rotation.x = -0.1;
    }
  }

  function personnages() {
    document.getElementById('h').textContent = 'Personnages : 3 styles × 3 poses';
    const styles = [[styleA, 'A · Jouet articulé', 'mains en pince, cheveux moulés'], [styleB, 'B · Pantin en bois', 'coudes et genoux en boules'], [styleC, 'C · Figurine ronde', 'grosse tête, grands yeux, moufles']];
    const poses = ['repos', 'joie', 'coucou'], cols = [[0xe5352b, 0x2f62d9, 0x5a3a1f], [0x25b98a, 0x3a3f55, 0x1b1b22], [0xf7c52d, 0xe5352b, 0xc97a2a]];
    styles.forEach(([fn, name, sub], si) => poses.forEach((p, pi) => {
      const c = cols[(si + pi) % 3], g = fn({ shirt: c[0], pants: c[1], hair: c[2], skin: SKIN[(si * 3 + pi) % 4] });
      pose(g, p);
      const x = (si - 1) * 19 + (pi - 1) * 5.6, z = 0;
      g.position.x = x; g.position.z = z; g.rotation.y = -0.15;
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      s.add(g);
      if (pi === 1) label(x, 7.6, 0, `<b>${name}</b>${sub}`, si);
      label(x, -0.3, 2.2, p, si);
    }));
    // Une voiture du jeu à côté du pantin, pour l'échelle.
    const car = new T.Group(), body = mesh(roundBox(2.6, 1.2, 5.6, 0.5), lam(0xe5352b, { roughness: 0.25 }), 0, 1.1, 0); car.add(body);
    car.add(mesh(roundBox(2.2, 0.9, 2.6, 0.45), lam(0x9fd3ff, { roughness: 0.1 }), 0, 2, -0.3));
    for (const [x, z] of [[-1.3, 1.8], [1.3, 1.8], [-1.3, -1.8], [1.3, -1.8]]) { const w = mesh(new T.CylinderGeometry(0.6, 0.6, 0.5, 24), lam(0x1b1b22), x, 0.6, z); w.rotation.z = Math.PI / 2; car.add(w); }
    car.position.set(19 + 0.5, 0, -7); car.rotation.y = 1.45; car.traverse((o) => { if (o.isMesh) o.castShadow = true; }); s.add(car);
    
    cams = [-1, 0, 1].map((k) => { const c = new T.PerspectiveCamera(31, (W / 3) / H, 1, 300); c.position.set(k * 19, 8, 35); c.lookAt(k * 19, 3.2, 0); return c; });
  }

  // ---------- Décors supplémentaires ----------
  const D = {
    tribune() {
      const g = new T.Group(), cols = [0xe5352b, 0x2f8fd8, 0xf7c52d];
      for (let i = 0; i < 3; i++) {
        const m = lam(cols[i], { roughness: 0.3 }), b = mesh(roundBox(14, 1.6, 2.6, 0.25), m, 0, 0.8 + i * 1.6, -i * 2.6); g.add(b);
        for (let k = 0; k < 7; k++) g.add(mesh(new T.CylinderGeometry(0.42, 0.42, 0.35, 20), m, -6 + k * 2, 1.75 + i * 1.6, -i * 2.6));
        if (i) g.add(mesh(roundBox(14, 1.6 * i, 2.6, 0.25), m, 0, 0.8 * i, -i * 2.6));
      }
      return g;
    },
    arche() {
      const g = new T.Group(), cols = [0xe5352b, 0xffffff, 0x2f62d9, 0xf7c52d];
      for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI, b = mesh(new T.SphereGeometry(0.95, 20, 14), lam(cols[i % 4], { roughness: 0.15 }), Math.cos(a) * 7, Math.sin(a) * 7 + 0.6, 0); b.scale.y = 1.15; g.add(b); }
      return g;
    },
    salieres() {
      const g = new T.Group();
      [[0xffffff, -2.2], [0x2b2d35, 2.2]].forEach(([c, x]) => {
        const body = new T.Mesh(new T.LatheGeometry([[0, 0], [1.6, 0], [1.7, 0.4], [1.4, 3], [1.5, 4.5], [0, 4.5]].map(([a, b]) => new T.Vector2(a, b)), 40), lam(c, { roughness: 0.2 })); body.position.x = x; g.add(body);
        const top = mesh(new T.SphereGeometry(1.5, 32, 16, 0, 6.3, 0, 1.5), new T.MeshStandardMaterial({ color: 0xd6dbe2, metalness: 0.9, roughness: 0.25 }), x, 4.5, 0); g.add(top);
      });
      return g;
    },
    crepes() {
      const g = new T.Group();
      for (let i = 0; i < 6; i++) { const c = mesh(new T.CylinderGeometry(4 - (i % 2) * 0.15, 4, 0.55, 48), lam(0xe9b56a, { roughness: 0.6 }), 0, 0.3 + i * 0.6, 0); g.add(c); g.add(mesh(new T.TorusGeometry(3.9, 0.28, 10, 48), lam(0xd29a50), 0, 0.3 + i * 0.6, 0)); }
      g.children.filter((o) => o.geometry.type === 'TorusGeometry').forEach((o) => { o.rotation.x = Math.PI / 2; });
      const sirop = new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 0.2, 48), lam(0x8a3f12, { roughness: 0.05 })); sirop.position.y = 3.75; g.add(sirop);
      g.add(mesh(roundBox(1.6, 1, 1.6, 0.3), lam(0xfff1a8), 0.4, 4.3, 0.2));
      return g;
    },
    cubes() {
      const g = new T.Group(), L = [['A', '#e5352b'], ['B', '#2f8fd8'], ['C', '#25b98a']];
      L.forEach(([t, c], i) => {
        const tex = canvas(128, 128, (x, w, h) => { x.fillStyle = '#fff6e8'; x.fillRect(0, 0, w, h); x.fillStyle = c; x.font = '900 96px Arial Black, Arial'; x.textAlign = 'center'; x.fillText(t, w / 2, 100); });
        const b = mesh(roundBox(3.4, 3.4, 3.4, 0.45), lam(0xffffff, { map: tex, roughness: 0.4 }), i === 2 ? 0 : (i - 0.5) * 3.7, i === 2 ? 5.1 : 1.7, 0); b.rotation.y = i * 0.3 - 0.2; g.add(b);
      });
      return g;
    },
    parasol() {
      const g = new T.Group(), stripes = canvas(256, 32, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : '#e5352b'; x.fillRect((i * w) / 8, 0, w / 8, h); } });
      g.add(mesh(new T.CylinderGeometry(0.15, 0.15, 7, 12), lam(0xf2f2f2), 0, 3.5, 0));
      const top = mesh(new T.ConeGeometry(5, 1.6, 8, 1, true), lam(0xffffff, { map: stripes, side: T.DoubleSide }), 0, 7, 0); g.add(top);
      const towel = canvas(64, 128, (x, w, h) => { for (let i = 0; i < 6; i++) { x.fillStyle = ['#2f8fd8', '#fff', '#f7c52d'][i % 3]; x.fillRect(0, (i * h) / 6, w, h / 6); } });
      g.add(mesh(roundBox(3.6, 0.15, 6.5, 0.07), lam(0xffffff, { map: towel }), 2.6, 0.08, 1.5));
      return g;
    },
    canard() {
      const g = new T.Group(), y = lam(0xf7c52d, { roughness: 0.2 });
      const ring = mesh(new T.TorusGeometry(2.6, 1.2, 24, 48), y, 0, 1.2, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
      g.add(mesh(new T.SphereGeometry(1.25, 28, 20), y, 0, 3.3, 2.6));
      const bec = mesh(new T.SphereGeometry(0.6, 20, 12), lam(0xf07a2a), 0, 3.1, 3.8); bec.scale.set(1.2, 0.45, 1.1); g.add(bec);
      for (const k of [-1, 1]) g.add(mesh(new T.SphereGeometry(0.18, 10, 8), lam(0x1b1b22), k * 0.55, 3.7, 3.65));
      return g;
    },
    etoile() {
      const sh = new T.Shape();
      for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 1.6 : 4.2; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      const g = new T.Group(), m = mesh(new T.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 5 }), lam(0xf07a50, { roughness: 0.5 }), 0, 0.5, 0);
      m.rotation.x = -Math.PI / 2; g.add(m);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2; for (const d of [1.4, 2.4]) g.add(mesh(new T.SphereGeometry(0.22, 10, 8), lam(0xffd9b0), Math.cos(a) * d, 1.4, -Math.sin(a) * d)); }
      return g;
    },
    souche() {
      const g = new T.Group(), rings = canvas(128, 128, (x) => { x.fillStyle = '#d9b07a'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#a97a44'; x.lineWidth = 3; for (let r = 8; r < 64; r += 9) { x.beginPath(); x.arc(64, 64, r, 0, 7); x.stroke(); } });
      g.add(mesh(new T.CylinderGeometry(3, 3.6, 3.2, 40), [lam(0x7a5233, { roughness: 0.9 }), lam(0xffffff, { map: rings }), lam(0x7a5233)], 0, 1.6, 0));
      const shell = mesh(new T.TorusGeometry(0.75, 0.45, 16, 32), lam(0xc98a3e, { roughness: 0.3 }), 0.4, 4.15, 0); g.add(shell);
      const corps = mesh(new T.SphereGeometry(0.45, 16, 12), lam(0xbfd88a, { roughness: 0.3 }), 0.4, 3.45, 0); corps.scale.set(1, 0.6, 3.4); g.add(corps);
      for (const k of [-1, 1]) { const ant = mesh(new T.CylinderGeometry(0.05, 0.05, 0.9, 6), lam(0xbfd88a), 0.4 + k * 0.18, 3.95, 1.45); ant.rotation.x = 0.4; g.add(ant); g.add(mesh(new T.SphereGeometry(0.11, 8, 6), lam(0x1b1b22), 0.4 + k * 0.18, 4.4, 1.6)); }
      return g;
    },
    marguerites() {
      const g = new T.Group();
      [[0, 0, 5.5], [-2.4, 1, 4], [2.2, -0.6, 4.5]].forEach(([x, z, h]) => {
        g.add(mesh(new T.CylinderGeometry(0.14, 0.18, h, 8), lam(0x4d9a3a), x, h / 2, z));
        g.add(mesh(new T.SphereGeometry(0.55, 18, 12), lam(0xf7c52d, { roughness: 0.6 }), x, h, z + 0.15));
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, p = mesh(new T.SphereGeometry(0.5, 12, 8), lam(0xffffff, { roughness: 0.6 }), x + Math.cos(a) * 1, h + Math.sin(a) * 1, z); p.scale.set(Math.abs(Math.cos(a)) * 1.2 + 0.45, Math.abs(Math.sin(a)) * 1.2 + 0.45, 0.25); g.add(p); }
      });
      return g;
    },
    coccinelle() {
      const g = new T.Group(), b = mesh(new T.SphereGeometry(2.4, 36, 18, 0, 6.3, 0, 1.6), lam(0xe5352b, { roughness: 0.15 }), 0, 0, 0); b.scale.z = 1.25; g.add(b);
      g.add(mesh(new T.SphereGeometry(1.1, 24, 16), lam(0x1b1b22, { roughness: 0.3 }), 0, 0.5, 2.7));
      for (const [x, z] of [[1, 0.6], [-1, 0.6], [1.3, -1.2], [-1.3, -1.2], [0, -2.2]]) { const d = mesh(new T.SphereGeometry(0.45, 14, 10), lam(0x1b1b22), x, Math.sqrt(Math.max(0, 5.76 - x * x - (z / 1.25) ** 2)) - 0.1, z); d.scale.y = 0.35; g.add(d); }
      return g;
    },
    igloo() {
      const blocks = canvas(256, 128, (x, w, h) => { x.fillStyle = '#f4f9ff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#bcd3ea'; x.lineWidth = 3; for (let r = 0; r < 6; r++) { x.beginPath(); x.moveTo(0, r * 21); x.lineTo(w, r * 21); x.stroke(); for (let c = 0; c < 10; c++) { const xx = c * 26 + (r % 2) * 13; x.beginPath(); x.moveTo(xx, r * 21); x.lineTo(xx, r * 21 + 21); x.stroke(); } } });
      const g = new T.Group(), m = lam(0xffffff, { map: blocks, roughness: 0.7 });
      g.add(mesh(new T.SphereGeometry(4.5, 48, 24, 0, 6.3, 0, Math.PI / 2), m));
      const tun = mesh(new T.CylinderGeometry(1.7, 1.7, 3, 32, 1, false, -Math.PI / 2, Math.PI), m, 0, 0, 4.2); tun.rotation.x = -Math.PI / 2; g.add(tun);
      const porte = mesh(new T.CircleGeometry(1.35, 32, 0, Math.PI), lam(0x3b4a6b), 0, 0.02, 5.72); g.add(porte);
      return g;
    },
    luge() {
      const g = new T.Group(), red = lam(0xe5352b, { roughness: 0.2 });
      for (let i = 0; i < 4; i++) g.add(mesh(roundBox(3, 0.25, 1.1, 0.1), lam(0xc98a4e, { roughness: 0.4 }), 0, 1.4, -2.1 + i * 1.3));
      for (const k of [-1, 1]) {
        g.add(mesh(roundBox(0.25, 0.25, 6.4, 0.1), red, k * 1.25, 0.15, 0));
        const nez = mesh(new T.TorusGeometry(0.75, 0.13, 10, 20, Math.PI), red, k * 1.25, 0.9, 3.2); nez.rotation.y = Math.PI / 2; nez.rotation.z = -Math.PI / 2; g.add(nez);
        for (const z of [-2, 0, 2]) g.add(mesh(new T.CylinderGeometry(0.1, 0.1, 1.3, 8), red, k * 1.25, 0.8, z));
      }
      return g;
    },
    feu() {
      const g = new T.Group();
      g.add(mesh(new T.CylinderGeometry(0.25, 0.3, 8, 16), lam(0x3a3f55), 0, 4, 0));
      g.add(mesh(roundBox(1.9, 4.6, 1.5, 0.45), lam(0x22242c, { roughness: 0.3 }), 0, 9.6, 0));
      [[0xff3b30, 11.1], [0xffb02e, 9.6], [0x2bd46a, 8.1]].forEach(([c, y], i) => g.add(mesh(new T.SphereGeometry(0.55, 24, 16), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i === 2 ? 1.4 : 0.15 }), 0, y, 0.6)));
      return g;
    },
    bus() {
      const g = new T.Group(), win = canvas(256, 64, (x, w, h) => { x.fillStyle = '#f7c52d'; x.fillRect(0, 0, w, h); x.fillStyle = '#9fd3ff'; for (let i = 0; i < 6; i++) x.fillRect(10 + i * 41, 8, 32, 30); x.fillStyle = '#2b2d35'; x.fillRect(0, 50, w, 5); });
      const y = lam(0xf7c52d, { roughness: 0.3 });
      g.add(mesh(roundBox(3.4, 3.4, 9, 0.8), [lam(0xffffff, { map: win }), lam(0xffffff, { map: win }), y, y, y, y], 0, 2.4, 0));
      for (const [x, z] of [[-1.6, 2.8], [1.6, 2.8], [-1.6, -2.8], [1.6, -2.8]]) { const w = mesh(new T.CylinderGeometry(0.85, 0.85, 0.6, 28), lam(0x1b1b22), x, 0.85, z); w.rotation.z = Math.PI / 2; g.add(w); }
      g.add(mesh(roundBox(3, 0.6, 0.3, 0.2), lam(0xfff6c8, { emissive: 0x665500 }), 0, 1.7, 4.55));
      return g;
    },
  };

  function decors() {
    document.getElementById('h').textContent = 'Décors supplémentaires (sur la planche, chaque objet est remis à la même taille)';
    const list = [
      ['tribune', 'tous', 'Tribune en briques'], ['arche', 'tous', 'Arche de ballons'], ['salieres', 'cuisine', 'Salière et poivrière'], ['crepes', 'cuisine', 'Pile de crêpes'], ['cubes', 'cuisine', 'Cubes ABC'],
      ['parasol', 'plage', 'Parasol et serviette'], ['canard', 'plage', 'Bouée canard'], ['etoile', 'plage', 'Étoile de mer'], ['souche', 'forêt', 'Souche et escargot'], ['marguerites', 'forêt', 'Marguerites'],
      ['coccinelle', 'forêt', 'Coccinelle'], ['igloo', 'neige', 'Igloo'], ['luge', 'neige', 'Luge'], ['feu', 'ville', 'Feu tricolore'], ['bus', 'ville', 'Bus jouet'],
    ];
    const CW = 13.5, CD = 20;
    list.forEach(([k, amb, name], i) => {
      const g = D[k](), box = new T.Box3().setFromObject(g), size = box.getSize(new T.Vector3()), sc = 8.5 / Math.max(size.x, size.z, size.y * 0.9);
      g.scale.setScalar(sc);
      const col = i % 5, row = Math.floor(i / 5), x = (col - 2) * CW, z = (row - 1) * CD;
      g.position.set(x, 0, z); g.rotation.y = -0.35;
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      s.add(g);
      label(x, 0, z + 6.2, `<b>${amb}</b>${name}`);
    });
    cam.fov = 34; cam.updateProjectionMatrix();
    cam.position.set(0, 66, 66); cam.lookAt(0, 0, 3);
  }

  (location.hash.indexOf('decor') >= 0 ? decors : personnages)();
  s.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) if (m.color && !m.userData.lin) { m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); m.userData.lin = true; } if (o.isMesh) o.receiveShadow = true; });
  const box = document.getElementById('l');
  const pw = cams ? W / 3 : W;
  if (cams) { r.setScissorTest(true); cams.forEach((c, i) => { r.setViewport(i * pw, 0, pw, H); r.setScissor(i * pw, 0, pw, H); r.render(s, c); }); }
  else r.render(s, cam);
  for (const l of labels) {
    const c = cams ? cams[l.panel] : cam, p = l.v.clone().project(c), d = document.createElement('div');
    d.style.left = ((cams ? l.panel : 0) * pw + ((p.x + 1) / 2) * pw) + 'px'; d.style.top = ((1 - p.y) / 2) * H + 'px'; d.innerHTML = l.html; box.appendChild(d);
  }
})();
