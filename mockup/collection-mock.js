// Maquette « jouets cachés + trophées à paliers » : injecté dans le jeu par une page de capture, rien n'est branché.
(function () {
  const T = window.THREE, R = MB.R;
  const paint = (c, rough = 0.35) => R.lam(c, { roughness: rough });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); return m; };

  // 11 jouets, un par circuit (hauteur ~1).
  const TOYS = {
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
  };
  const ORDER = ['canard', 'robot', 'toupie', 'de', 'yoyo', 'avion', 'bateau', 'crayon', 'sifflet', 'voiture', 'ours'];

  function glow() {
    const tex = R.canvas(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 2, 64, 64, 64); r.addColorStop(0, 'rgba(255,240,170,.95)'); r.addColorStop(0.4, 'rgba(255,214,90,.45)'); r.addColorStop(1, 'rgba(255,214,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
    return new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  }

  // Jouet caché posé au bord de la piste, devant le joueur : il flotte, tourne et brille.
  MB.mockToy = function (kind, ahead, side, size = 2.4, up = 0.9) {
    const v = MB.debug.view(), race = MB.debug.race(), t = race.track, p = race.player, i = (p.idx + ahead) % t.count;
    const lat = side === 'p' ? p.lat : side * (t.width / 2 - 1.8), x = t.px[i] - t.tz[i] * lat, z = t.pz[i] + t.tx[i] * lat;
    R.lam.env = v._env({});
    const g = new T.Group(), toy = TOYS[kind](); toy.scale.setScalar(size); g.add(toy);
    const halo = glow(); halo.scale.set(size * 1.6, size * 1.6, 1); halo.position.y = size * 0.6; g.add(halo);
    const ringM = new T.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.7 });
    const ring = mesh(new T.TorusGeometry(size * 0.75, 0.06, 8, 40), ringM, 0, 0.1); ring.rotation.x = Math.PI / 2; g.add(ring);
    for (let k = 0; k < 7; k++) { const sp = glow(); sp.scale.set(0.5, 0.5, 1); sp.position.set(Math.cos(k * 0.9) * size * 0.7, size * (0.3 + (k % 3) * 0.35), Math.sin(k * 0.9) * size * 0.7); g.add(sp); }
    v._linear(g); R.lam.env = null;
    g.position.set(x, up, z); toy.rotation.y = -Math.atan2(t.tz[i], t.tx[i]) + 2.2;
    v.scene.add(g);
    return g;
  };

  // Étagère des jouets sous celle des trophées, et paliers bronze / argent / or sur les socles.
  MB.mockRoom = function (found, tiers) {
    const v = MB.debug.view(), r = v.troom, s = r.s, SP = 3.3, n = MB.TROPHIES.length;
    R.lam.env = r.env;
    const wood = R.lam(0x8a5530, { roughness: 0.45 });
    s.add(mesh(new T.BoxGeometry(n * SP + 30, 0.28, 2.6), wood, (n - 1) * SP / 2, -2.3, 0.2));
    s.add(mesh(new T.BoxGeometry(n * SP + 30, 0.06, 0.06), R.lam(0xf2c14e, { metalness: 1, roughness: 0.22 }), (n - 1) * SP / 2, -2.16, 1.5));
    const sil = new T.MeshStandardMaterial({ color: 0x3a3d4a, roughness: 0.85 });
    [...ORDER.filter((k) => found.includes(k)), ...ORDER.filter((k) => !found.includes(k))].forEach((k, i) => {
      const toy = TOYS[k](); toy.scale.setScalar(1.25);
      if (!found.includes(k)) toy.traverse((o) => { if (o.isMesh) o.material = sil; });
      toy.position.set(r.sel * SP + (i - 2) * 1.6, -2.16, 0.4); toy.rotation.y = 0.5;
      s.add(toy);
    });
    const col = { bronze: 0xc7804a, argent: 0xdfe4ea, or: 0xf2c14e };
    r.items.forEach((it) => {
      const tier = tiers[it.id]; if (!tier) return;
      const band = mesh(new T.BoxGeometry(2.36, 0.1, 2.16), R.lam(col[tier], { metalness: 1, roughness: 0.25 }), 0, 0.46); it.base.add(band);
      const lit = tier === 'or' ? 3 : tier === 'argent' ? 2 : 1;
      for (let k = 0; k < 3; k++) { const st = mesh(new T.SphereGeometry(0.09, 10, 8), k < lit ? R.lam(col[tier], { metalness: 1, roughness: 0.2, emissive: col[tier], emissiveIntensity: 0.25 }) : R.lam(0x55565e), -0.4 + k * 0.4, 0.25, 1.1); it.base.add(st); }
    });
    v._linear(s); R.lam.env = null;
  };
})();
