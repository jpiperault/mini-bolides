// Vie du décor : petites animations par ambiance. Rien ne bouge sur la piste, tout reste bon marché
// (maillages instanciés, mises à jour limitées à ce qui est proche) et s'allège quand le téléphone peine (lite).
(function (MB) {
  const T = THREE;
  const lin = (hex) => new T.Color(hex).convertSRGBToLinear();
  const near = (x, z, P, d) => Math.abs(x - P.x) < d && Math.abs(z - P.z) < d;

  class Life {
    constructor(view, s, t, mood, placed) {
      this.view = view; this.s = s; this.t = t; this.mood = mood; this.placed = placed; this.parts = []; this.dbg = {};   // dbg : où regarder chaque animation (vues de contrôle)
      this.w = t.width / 2; this.R = MB.R;
      this.rng = t.def.seed * 48271;
      this._crowd();
      this._arch();
      this._confetti();
      const k = mood.life;
      if (k === 'plage') { this._sea(); this._crabs(); this._gulls(); }
      if (k === 'foret') { this._ants(); this._butterflies(); }
      if (k === 'neige') this._penguins();
      if (k === 'chambre') this._train();
    }
    rnd() { this.rng = (this.rng * 16807) % 2147483647; return (this.rng % 100000) / 100000; }

    // Point au bord du circuit : index i, côté side, à lat du centre, décalé de along dans le sens de la course.
    spot(i, side, lat, along = 0) {
      const t = this.t, n = t.count, j = ((i % n) + n) % n, nx = -t.tz[j], nz = t.tx[j];
      return { x: t.px[j] + nx * side * lat + t.tx[j] * along, z: t.pz[j] + nz * side * lat + t.tz[j] * along, tx: t.tx[j], tz: t.tz[j], nx: nx * side, nz: nz * side };
    }
    free(x, z, min, r) {
      if (Math.hypot(x, z) > this.R.PROP_REACH) return false;
      if (MB.trackDistance(this.t, x, z) < min) return false;
      return !this.placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r);
    }
    // Cherche un emplacement libre autour de la fraction f du circuit ; test(i, side) vérifie toute l'empreinte.
    find(f, test) {
      const n = this.t.count;
      for (let d = 0; d < 0.5; d += 0.02) for (const sg of [1, -1]) for (const side of [1, -1]) {
        const i = Math.floor((((f + sg * d) % 1) + 1) % 1 * n);
        if (test(i, side)) return { i, side };
      }
      return null;
    }
    add(fn) { this.parts.push(fn); }
    update(dt, time, P, cars, lite) { for (const p of this.parts) p(dt, time, P, cars, lite); }

    // ---------- Partout : spectateurs, drapeaux, confettis ----------
    _crowd() {
      const t = this.t, w = this.w, figs = [], lam = this.R.lam, merge = this.R.merge, rb = this.R.roundBox;
      const tint = (geo, hex) => { geo.userData.tint = hex; return geo; };

      // Une ou deux tribunes à deux gradins en briques, avec un nombre de supporters tiré au hasard.
      const TIERS = [{ lat: 5.2, h: 1.2 }, { lat: 8, h: 2.4 }], ALONG = [-4, 0, 4], stands = [];
      const foot = [];
      for (const l of [4, 6.5, 9.2]) for (const a of [-6, -2, 2, 6]) foot.push([l, a]);
      foot.push([6, 8.5]);
      const nStands = this.rnd() < 0.5 ? 1 : 2;
      for (const f0 of [0.035, 0.45 + this.rnd() * 0.2].slice(0, nStands)) {
        const fits = (i, side) => foot.every(([l, a]) => { const p = this.spot(i, side, w + l, a); return this.free(p.x, p.z, w + 3.4, 2); });
        const at = this.find(f0, fits);
        if (!at) continue;
        const g = { tiers: [], ...this.spot(at.i, at.side, w + 6.5) }, yaw = Math.atan2(-g.nx, -g.nz), slots = [];
        TIERS.forEach((tr, k) => {
          const c = this.spot(at.i, at.side, w + tr.lat); g.tiers.push({ x: c.x, z: c.z, yaw: Math.atan2(c.tx, c.tz), k });
          for (const a of ALONG) { const p = this.spot(at.i, at.side, w + tr.lat, a); slots.push({ x: p.x, z: p.z, y: tr.h }); }
        });
        for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(this.rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
        const n = 3 + Math.floor(this.rnd() * 4);                     // de 3 à 6 supporters
        for (const p of slots.slice(0, n)) figs.push({ ...p, mode: 'stand', yaw, yaw0: yaw, ph: this.rnd() * 6.28, wave: this.rnd() < 0.4 });
        for (const [l, a] of foot) { const p = this.spot(at.i, at.side, w + l, a); this.placed.push({ x: p.x, z: p.z, r: 2.4 }); }
        g.flag = this.spot(at.i, at.side, w + 6, 8.5);
        stands.push(g); this.dbg.foule = this.dbg.foule || g;
      }
      if (stands.length) {
        const brick = (h) => {
          const parts = [rb(13, h, 2.8, 0.25).translate(0, h / 2, 0)];
          for (let k = 0; k < 6; k++) parts.push(new T.CylinderGeometry(0.55, 0.55, 0.4, 20).translate(-5.4 + k * 2.16, h + 0.2, 0));
          return merge(parts);
        };
        const bricks = TIERS.map((tr) => new T.InstancedMesh(brick(tr.h), lam(0xffffff, { roughness: 0.3 }), stands.length));
        const BC = [0xe5352b, 0x2f8fd8, 0xf7c52d, 0x25b98a], O = new T.Object3D();
        stands.forEach((g, gi) => g.tiers.forEach((tr) => {
          O.position.set(tr.x, 0, tr.z); O.rotation.set(0, tr.yaw + Math.PI / 2, 0); O.updateMatrix();
          bricks[tr.k].setMatrixAt(gi, O.matrix); bricks[tr.k].setColorAt(gi, lin(BC[(gi * 2 + tr.k + t.def.seed) % 4]));
        }));
        for (const m of bricks) { m.castShadow = true; m.material.userData.lin = true; this.s.add(m); }
        // Drapeaux : tissu qui ondule, même vent pour tous.
        const kc = this.mood.kerb || ['#e5352b', '#ffffff'], cloth = this.R.canvas(64, 40, (c, W, H) => {
          c.fillStyle = kc[0]; c.fillRect(0, 0, W, H); c.fillStyle = kc[1];
          c.beginPath(); c.moveTo(0, 0); c.lineTo(W, H / 2); c.lineTo(0, H); c.fill();
        });
        const flagMat = new T.MeshLambertMaterial({ map: cloth, side: T.DoubleSide }), poleGeo = new T.CylinderGeometry(0.16, 0.2, 10, 10), poleMat = lam(0xf2f2f2, { roughness: 0.3 });
        for (const g of stands) {
          const pole = new T.Mesh(poleGeo, poleMat); pole.position.set(g.flag.x, 5, g.flag.z); pole.castShadow = true; this.s.add(pole);
          const geo = new T.PlaneGeometry(4.6, 2.8, 12, 3); geo.translate(2.3, 0, 0);
          const f = new T.Mesh(geo, flagMat); f.position.set(g.flag.x, 8.4, g.flag.z); f.rotation.y = 0.7; this.s.add(f);
          g.cloth = { f, base: Float32Array.from(geo.attributes.position.array), ph: this.rnd() * 6.28 };
        }
      }

      // Promeneurs : ils se baladent hors de la piste, s'arrêtent, regardent, et applaudissent quand une voiture passe.
      for (let k = 0, tries = 0; k < 9 && tries < 400; tries++) {
        const i = Math.floor(this.rnd() * t.count), side = this.rnd() < 0.5 ? 1 : -1, p = this.spot(i, side, w + 6 + this.rnd() * 26);
        if (!this.free(p.x, p.z, w + 5, 3)) continue;
        const yaw = this.rnd() * 6.28;
        figs.push({ x: p.x, z: p.z, y: 0, mode: 'idle', wait: this.rnd() * 3, yaw, yaw0: yaw, ph: this.rnd() * 6.28, wave: this.rnd() < 0.5, step: 0, walker: true });
        this.placed.push({ x: p.x, z: p.z, r: 3, walker: true });
        k++;
      }
      this.dbg.promeneur = figs.find((f) => f.walker);
      if (!figs.length) return;

      // Jouet articulé : bassin, buste, tête et cheveux moulés, bras à mains en pince, jambes et chaussures.
      // Une partie rigide = un maillage instancié ; le visage est fusionné en couleurs par sommet.
      const HY = 4.55, HR = 0.64, fp = [];
      for (const k of [-1, 1]) {
        fp.push(tint(new T.SphereGeometry(HR * 0.1, 8, 6).translate(k * HR * 0.32, HY + HR * 0.12, HR * 0.93), 0x1d1b22));
        fp.push(tint(new T.SphereGeometry(HR * 0.15, 8, 5).scale(1, 1, 0.35).translate(k * HR * 0.55, HY - HR * 0.18, HR * 0.78), 0xff8f8f));
      }
      fp.push(tint(new T.TorusGeometry(HR * 0.24, HR * 0.045, 4, 8, Math.PI).rotateZ(Math.PI).translate(0, HY - HR * 0.2, HR * 0.94), 0x7a2a2a));
      const hand = new T.TorusGeometry(0.2, 0.1, 6, 10, Math.PI * 1.5).rotateZ(Math.PI * 0.75).rotateX(Math.PI / 2).translate(0, -1.38, 0.05);
      const N = figs.length, mk = (geo, mat, count, shadow) => { const m = new T.InstancedMesh(geo, mat, count); m.castShadow = !!shadow; m.frustumCulled = false; m.material.userData.lin = true; this.s.add(m); return m; };
      const P = {
        hips: mk(rb(1.42, 0.5, 0.76, 0.2, 2).translate(0, 2.05, 0), lam(0xffffff, { roughness: 0.4 }), N),
        torso: mk(rb(1.44, 1.6, 0.8, 0.32, 2).translate(0, 3.05, 0), lam(0xffffff, { roughness: 0.4 }), N, true),
        head: mk(merge([new T.SphereGeometry(HR, 18, 12).translate(0, HY, 0), new T.CylinderGeometry(0.22, 0.26, 0.3, 10).translate(0, 3.95, 0)]), lam(0xffffff, { roughness: 0.5 }), N, true),
        hair: mk(new T.SphereGeometry(0.69, 18, 7, 0, Math.PI * 2, 0, 1.55).rotateX(-0.35).translate(0, HY + 0.06, -0.04), lam(0xffffff, { roughness: 0.35 }), N),
        face: mk(merge(fp), lam(0xffffff, { roughness: 0.3, vertexColors: true }), N),
        arm: mk(rb(0.42, 1.3, 0.48, 0.19, 2).translate(0, -0.55, 0), lam(0xffffff, { roughness: 0.4 }), N * 2),
        hand: mk(hand, lam(0xffffff, { roughness: 0.5 }), N * 2),
        leg: mk(rb(0.62, 1.7, 0.68, 0.2, 2).translate(0, -0.85, 0), lam(0xffffff, { roughness: 0.4 }), N * 2, true),
        shoe: mk(rb(0.66, 0.34, 1, 0.15, 1).translate(0, -1.78, 0.16), lam(0x2b2d35, { roughness: 0.4 }), N * 2),
      };
      P.shoe.material.color.convertSRGBToLinear();                     // seule pièce sans couleur par figurine
      const shirts = [0xe5352b, 0x2f8fd8, 0xf7c52d, 0x25b98a, 0xf0639a, 0xff8a1e, 0x8a5cd6], skins = [0xffd7b0, 0xe8b48a, 0xb07a52, 0x7a4e32, 0xffe3c8];
      const hairs = [0x5a3a1f, 0x1b1b22, 0xe0a030, 0xc9502a, 0x7a4e32], pants = [0x3b4a6b, 0x2f62d9, 0x4a3b2b, 0x25806a, 0xe5352b];
      figs.forEach((f, q) => {
        const sd = t.def.seed;                                         // pas premiers avec chaque liste : voisins tous différents
        f.col = { torso: lin(shirts[(q * 3 + sd) % 7]), head: lin(skins[(q * 3 + sd) % 5]), hair: lin(hairs[(q * 2 + sd) % 5]), hips: lin(pants[(q * 3 + sd) % 5]) };
        f.col.arm = f.col.torso; f.col.hand = f.col.head; f.col.leg = f.col.hips;
      });
      const ONE = ['hips', 'torso', 'head', 'hair', 'face'], TWO = ['arm', 'hand', 'leg', 'shoe'];
      // Seules les figurines dans le champ sont dessinées, rangées en tête des maillages instanciés.
      let shown = -1;
      const live = [];
      const paint = (live) => {
        live.forEach((f, i) => {
          for (const k of ONE) if (f.col[k]) P[k].setColorAt(i, f.col[k]);
          for (const k of TWO) if (f.col[k]) { P[k].setColorAt(i * 2, f.col[k]); P[k].setColorAt(i * 2 + 1, f.col[k]); }
        });
        for (const k in P) { if (P[k].instanceColor) P[k].instanceColor.needsUpdate = true; P[k].count = ONE.includes(k) ? live.length : live.length * 2; }
      };

      // Nouvelle destination : un point libre, joignable sans traverser la piste ni un objet du décor.
      const clear = (x0, z0, x1, z1) => {
        const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 3);
        for (let i = 1; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n;
          if (Math.hypot(x, z) > this.R.PROP_REACH || MB.trackDistance(t, x, z) < w + 4) return false;
          if (this.placed.some((p) => !p.walker && Math.hypot(p.x - x, p.z - z) < p.r + 1.5)) return false;
        }
        return true;
      };
      const pick = (f) => {
        for (let k = 0; k < 8; k++) {
          const a = Math.random() * 6.28, d = 8 + Math.random() * 24, x = f.x + Math.cos(a) * d, z = f.z + Math.sin(a) * d;
          if (clear(f.x, f.z, x, z)) { f.tx = x; f.tz = z; f.mode = 'walk'; return; }
        }
        f.wait = 1 + Math.random() * 2;
      };

      const FR = new T.Frustum(), PM = new T.Matrix4(), SP = new T.Sphere();
      const M = new T.Matrix4(), A = new T.Matrix4(), B = new T.Matrix4(), E = new T.Euler(), S = new T.Vector3(1.05, 1.05, 1.05), Q = new T.Quaternion(), V = new T.Vector3();
      const limb = (mesh, idx, x, y, rx, rz) => { A.makeTranslation(x, y, 0); B.makeRotationFromEuler(E.set(rx, 0, rz)); A.multiply(B); A.premultiply(M); mesh.setMatrixAt(idx, A); };
      this.add((dt, time, P0, cars) => {
        const cam = this.view.cam;
        cam.updateMatrixWorld(); PM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); FR.setFromProjectionMatrix(PM);
        for (const f of figs) {
          // Une voiture qui passe : ils s'arrêtent et sautent bras levés (plus longtemps pour le joueur).
          if (cars) for (const c of cars) if (Math.abs(c.x - f.x) < 22 && Math.abs(c.z - f.z) < 22) f.cheer = c.isPlayer ? 2.2 : Math.max(f.cheer || 0, 1);
          f.cheer = Math.max(0, (f.cheer || 0) - dt);
          if (f.walker && !f.cheer) {
            if (f.mode === 'walk') {
              const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz), sp = 2.4 * dt;
              if (d < 0.5) { f.mode = 'idle'; f.wait = 1.5 + Math.random() * 4; f.yaw0 = f.yaw; }
              else { f.x += (dx / d) * Math.min(sp, d); f.z += (dz / d) * Math.min(sp, d); f.step += dt * 7; f.yaw0 = Math.atan2(dx, dz); }
            } else if ((f.wait -= dt) <= 0) pick(f);
          }
        }
        live.length = 0; let key = 0;                            // aucun tableau ni texte créé à chaque image
        for (let i = 0; i < figs.length; i++) { const f = figs[i]; if (near(f.x, f.z, P0, 260) && FR.intersectsSphere(SP.set(V.set(f.x, 3, f.z), 4))) { live.push(f); key += 2 ** i; } }
        if (key !== shown) { shown = key; paint(live); }
        live.forEach((f, q) => {
          const look = near(f.x, f.z, P0, 70) && f.mode !== 'walk', want = look || f.cheer ? Math.atan2(P0.x - f.x, P0.z - f.z) : f.yaw0;
          f.yaw += MB.angleDiff(want, f.yaw) * Math.min(1, dt * (f.mode === 'walk' ? 8 : 5));
          const cheer = f.cheer > 0, walk = f.mode === 'walk' && !cheer, u = time * 9 + f.ph;
          const hop = cheer ? Math.abs(Math.sin(u)) * 1.4 * Math.min(1, f.cheer) : walk ? Math.abs(Math.sin(f.step)) * 0.12 : 0;
          E.set(0, f.yaw, cheer ? Math.sin(time * 15 + f.ph) * 0.08 : walk ? Math.sin(f.step) * 0.05 : Math.sin(time * 1.4 + f.ph) * 0.03, 'YXZ');
          M.compose(V.set(f.x, f.y + hop, f.z), Q.setFromEuler(E), S);
          for (const k of ONE) P[k].setMatrixAt(q, M);
          for (const [i, k] of [[0, -1], [1, 1]]) {
            let rz = k * 0.1, rx = 0, leg = 0;
            if (cheer) { rz = k * (2.5 + Math.sin(time * 14 + f.ph + k) * 0.25); leg = -0.6 * Math.max(0, Math.sin(u + k * 1.6)); }
            else if (walk) { rx = Math.sin(f.step) * 0.55 * k; leg = -Math.sin(f.step) * 0.5 * k; }
            else if (look && f.wave && k > 0) { rz = 2.4 + Math.sin(time * 10 + f.ph) * 0.4; rx = -0.2; }
            limb(P.arm, q * 2 + i, k * 0.9, 3.65, rx, rz); limb(P.hand, q * 2 + i, k * 0.9, 3.65, rx, rz);
            limb(P.leg, q * 2 + i, k * 0.35, 1.95, leg, 0); limb(P.shoe, q * 2 + i, k * 0.35, 1.95, leg, 0);
          }
        });
        for (const k in P) P[k].instanceMatrix.needsUpdate = true;
        for (const g of stands) {
          if (!near(g.x, g.z, P0, 260)) continue;
          const c = g.cloth, a = c.f.geometry.attributes.position;
          for (let i = 0; i < a.count; i++) {
            const x = c.base[i * 3], y = c.base[i * 3 + 1], k = x / 4.6;
            a.setXYZ(i, x - k * 0.25, y - k * 0.25 + Math.sin(x * 1.1 - time * 6 + c.ph) * 0.08, Math.sin(x * 1.5 - time * 7 + c.ph) * 0.42 * k);
          }
          a.needsUpdate = true;
          if ((c.tick = (c.tick || 0) + 1) % 4 === 0) c.f.geometry.computeVertexNormals();   // l'éclairage du tissu suit, une image sur quatre
        }
      });
    }

    // Arche de ballons au-dessus de la piste, loin des tremplins et des raccourcis ; les ballons se balancent.
    _arch() {
      const t = this.t, w = this.w, n = t.count, R = w + 3;
      const ok = (i) => {
        if (Math.min(i, n - i) < 40) return false;
        if (t.jumps.some((j) => Math.abs(((i - j + n * 1.5) % n) - n / 2) < 22)) return false;
        if (t.shortcuts.some((p) => { const d = (x) => Math.abs(((i - x + n * 1.5) % n) - n / 2); return d(p.a) < 30 || d(p.b) < 30; })) return false;
        return [-1, 1].every((s) => { const p = this.spot(i, s, R); return MB.trackDistance(t, p.x, p.z) > R - 1 && !this.placed.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < q.r + 2); });
      };
      let at = -1;
      for (const f of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) { const i = Math.floor(f * n); if (ok(i)) { at = i; break; } }
      if (at < 0) return;
      const N = 23, m = new T.InstancedMesh(new T.SphereGeometry(1.15, 20, 14).scale(1, 1.15, 1), this.R.lam(0xffffff, { roughness: 0.15 }), N), cols = [0xe5352b, 0xffffff, 0x2f62d9, 0xf7c52d];
      for (let i = 0; i < N; i++) m.setColorAt(i, lin(cols[i % 4]));
      m.castShadow = true; m.material.userData.lin = true; m.frustumCulled = false; this.s.add(m);
      const c = this.spot(at, 1, 0), O = new T.Object3D();
      for (const s of [-1, 1]) { const p = this.spot(at, s, R); this.placed.push({ x: p.x, z: p.z, r: 3 }); }
      this.dbg.arche = c;
      this.add((dt, time, P) => {
        if (!near(c.x, c.z, P, 320)) return;
        for (let i = 0; i < N; i++) {
          const a = (i / (N - 1)) * Math.PI, sw = Math.sin(time * 1.6 + i * 0.7) * 0.25 * Math.sin(a);
          O.position.set(c.x + c.nx * Math.cos(a) * R + c.tx * sw, 0.9 + Math.sin(a) * R, c.z + c.nz * Math.cos(a) * R + c.tz * sw);
          const k = 1 + Math.sin(time * 2.2 + i) * 0.03; O.scale.set(k, k, k); O.updateMatrix(); m.setMatrixAt(i, O.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
      });
    }

    _confetti() {
      const N = 160, geo = new T.PlaneGeometry(0.55, 0.34), m = new T.InstancedMesh(geo, new T.MeshBasicMaterial({ side: T.DoubleSide }), N);
      const cols = [0xe5352b, 0xffd23f, 0x25b98a, 0x2f62d9, 0xf0639a, 0xffffff];
      const bits = [], O = new T.Object3D(), t = this.t;
      O.scale.set(0, 0, 0); O.updateMatrix();
      for (let i = 0; i < N; i++) { m.setMatrixAt(i, O.matrix); m.setColorAt(i, lin(cols[i % cols.length])); bits.push({ life: 0 }); }
      m.material.userData.lin = true; m.frustumCulled = false; this.s.add(m);
      let next = 0, live = 0;
      const nx = -t.tz[0], nz = t.tx[0];
      this.burst = (n) => {
        for (let k = 0; k < n; k++) {
          const b = bits[next = (next + 1) % N], l = (Math.random() - 0.5) * (t.width + 4);
          Object.assign(b, { x: t.px[0] + nx * l, y: 13.5, z: t.pz[0] + nz * l, vx: (Math.random() - 0.5) * 7, vy: 1 + Math.random() * 6, vz: (Math.random() - 0.5) * 7,
            rx: Math.random() * 6, ry: Math.random() * 6, sx: 4 + Math.random() * 8, sy: 3 + Math.random() * 7, life: 3.2 + Math.random() * 1.2 });
        }
        live = 5;
      };
      this.add((dt) => {
        if (live <= 0) return;
        live -= dt;
        for (let i = 0; i < N; i++) {
          const b = bits[i];
          if (b.life <= 0) continue;
          b.life -= dt;
          if (b.y > 0.3) {
            b.vy = Math.max(b.vy - 9 * dt, -3.2); b.vx *= 1 - dt * 1.5; b.vz *= 1 - dt * 1.5;          // le papier plane en tombant
            b.x += (b.vx + Math.sin(b.rx * 2) * 1.2) * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.rx += b.sx * dt; b.ry += b.sy * dt;
          } else { b.y = 0.3; b.rx = Math.PI / 2; }
          const k = b.life > 0 ? Math.min(1, b.life * 2) : 0;
          O.position.set(b.x, b.y, b.z); O.rotation.set(b.rx, b.ry, 0); O.scale.set(k, k, k); O.updateMatrix();
          m.setMatrixAt(i, O.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
      });
    }

    // ---------- Objets du décor qui bougent ----------
    props(list) {
      const by = (k) => list.filter((p) => p.kind === k), life = this.mood.life;
      for (const p of list) if (!this.dbg[p.kind]) this.dbg[p.kind] = p;
      this._garden(by('marguerites'), by('coccinelle'), by('souche'));
      this._lights(by('feu'));
      if (life === 'cuisine') { this._steam([...by('tasse'), ...by('bol')]); this._toasters(by('grillepain')); this._flies(by('pot').slice(0, 2)); }
      if (life === 'plage') this._balls(by('ballon'));
      if (life === 'foret') this._leaves([...by('arbre'), ...by('tronc')]);
      if (life === 'bain') this._float([...by('canard'), ...by('bateau'), ...by('mousse'), ...by('savon'), ...by('eponge')]);
      if (life === 'neige') { this._snowmen(by('bonhomme')); this._sparkles(by('glacon')); }
      if (life === 'chambre') this._tops(by('toupie'));
      if (life === 'ville') { this._windows(by('immeuble')); this._neons(by('immeuble').slice(0, 5)); this._fireflies(by('lampadaire')); }
    }

    // Fleurs qui se balancent, coccinelle qui fait sa ronde, escargot qui fait le tour de sa souche.
    _garden(flowers, bugs, stumps) {
      if (!flowers.length && !bugs.length && !stumps.length) return;
      this.add((dt, time, P) => {
        for (const p of flowers) { if (!near(p.x, p.z, P, 260)) continue; p.g.stems.forEach((f, i) => { f.rotation.z = Math.sin(time * 1.3 + i * 1.7 + p.x) * 0.07; f.rotation.x = Math.cos(time * 1.1 + i) * 0.05; }); }
        for (const p of bugs) {
          if (!near(p.x, p.z, P, 260)) continue;
          const a = time * 0.25 + p.x;
          p.g.bug.position.set(Math.cos(a) * 6, Math.abs(Math.sin(time * 9)) * 0.15, Math.sin(a) * 6);
          p.g.bug.rotation.y = -a;                                          // tangente au cercle, tête en avant
        }
        for (const p of stumps) {
          if (!near(p.x, p.z, P, 220)) continue;
          const a = time * 0.12 + p.z, sn = p.g.snail;
          sn.position.set(Math.cos(a) * 1.7, 3.2, Math.sin(a) * 1.7); sn.rotation.y = -a; sn.scale.z = 1 + Math.sin(time * 2.5) * 0.08;
        }
      });
    }

    // Feux tricolores : vert, orange, rouge, chacun à son rythme.
    _lights(list) {
      if (!list.length) return;
      this.add((dt, time) => {
        list.forEach((p, i) => {
          const c = (time + i * 3.7) % 10, on = c < 4.5 ? 2 : c < 6 ? 1 : 0;
          p.g.lights.forEach((m, k) => { m.emissiveIntensity = k === on ? 1.6 : 0.1; });
        });
      });
    }

    _steam(cups) {
      const puffs = [];
      for (const c of cups) for (let k = 0; k < 3; k++) {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: this.view.puff, transparent: true, depthWrite: false, opacity: 0, color: this.mood.night ? 0xc8d4ff : 0xffffff }));
        sp.visible = false; this.s.add(sp); puffs.push({ sp, c, k, ph: Math.random() });
      }
      this.add((dt, time, P, cars, lite) => {
        for (const p of puffs) {
          const on = !lite && near(p.c.x, p.c.z, P, 280);
          p.sp.visible = on;
          if (!on) continue;
          const u = (time * 0.36 + p.k / 3 + p.ph) % 1, s = 6 + u * 16;
          p.sp.position.set(p.c.x + Math.sin(u * 5 + p.ph * 6) * 3.5 * u, p.c.g.top + 2 + u * 28, p.c.z + Math.cos(u * 4 + p.ph * 6) * 2 * u);
          p.sp.scale.set(s, s, 1);
          p.sp.material.opacity = Math.sin(u * Math.PI) * 0.34;
          p.sp.material.rotation = u * 2 + p.ph * 6;
        }
      });
    }

    _toasters(list) {
      const st = list.map((p) => ({ p, y: 0, vy: 0, wait: 2 + Math.random() * 4 }));
      this.add((dt) => {
        for (const s of st) {
          if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) s.vy = 52; continue; }
          s.vy -= 80 * dt; s.y += s.vy * dt;
          if (s.y <= 0) { s.y = 0; s.vy = 0; s.wait = 4 + Math.random() * 4; }
          s.p.g.toast.position.y = s.y;
          s.p.g.toast.rotation.x = s.y > 0 ? s.y * 0.03 : 0;
        }
      });
    }

    _flies(pots) {
      const lam = this.R.lam, wingMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false });
      const flies = pots.map((p, i) => {
        const g = new T.Group(), b = new T.Mesh(new T.SphereGeometry(1.3, 16, 12), lam(0x22242c, { roughness: 0.3 })); b.scale.z = 1.4; g.add(b);
        for (const x of [-0.7, 0.7]) { const e = new T.Mesh(new T.SphereGeometry(0.55, 12, 8), lam(0xa31d1d, { roughness: 0.2 })); e.position.set(x, 0.4, 1.4); g.add(e); }
        g.wings = [-1, 1].map((k) => { const w = new T.Group(), m = new T.Mesh(new T.CircleGeometry(1.4, 16), wingMat); m.scale.y = 0.55; m.rotation.x = -Math.PI / 2; m.position.x = k * 1.4; w.add(m); w.position.y = 0.9; g.add(w); return w; });
        this.s.add(g);
        return { g, p, ph: i * 2.3 };
      });
      const prev = new T.Vector3();
      this.add((dt, time, P) => {
        for (const f of flies) {
          if (!near(f.p.x, f.p.z, P, 260)) continue;
          const u = time + f.ph;
          prev.copy(f.g.position);
          f.g.position.set(f.p.x + Math.cos(u * 1.7) * 12, f.p.g.top + 9 + Math.sin(u * 3.1) * 4, f.p.z + Math.sin(u * 2.3) * 10);
          f.g.rotation.y = Math.atan2(f.g.position.x - prev.x, f.g.position.z - prev.z);
          const a = Math.sin(time * 70) * 0.7;
          f.g.wings[0].rotation.z = a; f.g.wings[1].rotation.z = -a;
        }
      });
    }

    _balls(list) {
      this.add((dt, time, P) => {
        for (const p of list) {
          if (!near(p.x, p.z, P, 300)) continue;
          const u = Math.abs(Math.sin(time * 2.2 + p.x)), h = u * 9, sq = Math.max(0, 1 - h / 1.6);
          p.g.ball.position.y = 14.5 + h - sq * 2;
          p.g.ball.scale.set(1 + sq * 0.14, 1 - sq * 0.16, 1 + sq * 0.14);
          p.g.ball.rotation.y = time * 0.8;
        }
      });
    }

    // ---------- Plage ----------
    _sea() {
      let far = 0;
      for (let i = 0; i < this.t.count; i++) far = Math.max(far, Math.hypot(this.t.px[i], this.t.pz[i]));
      const r0 = Math.max(this.R.PROP_REACH + 32, far + 60), lam = this.R.lam;
      const ring = (a, b, mat, y) => { const m = new T.Mesh(new T.RingGeometry(a, b, 256, 1), mat); m.rotation.x = -Math.PI / 2; m.position.y = y; this.s.add(m); return m; };
      ring(r0, 1100, new T.MeshStandardMaterial({ color: 0x3aa6d8, roughness: 0.15, metalness: 0.1, envMap: lam.env, envMapIntensity: 0.9 }), 0.2);
      ring(r0 - 16, r0, new T.MeshBasicMaterial({ color: 0xa8814f, transparent: true, opacity: 0.4, depthWrite: false }), 0.1);
      const foam = ring(r0 - 3, r0 + 3, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }), 0.26);
      // La vague monte et redescend sur le sable mouillé.
      this.add((dt, time) => {
        const k = 1 - (0.5 + 0.5 * Math.sin(time * 0.8)) * 10 / r0;
        foam.scale.set(k, k, 1);
        foam.material.opacity = 0.45 + 0.4 * Math.max(0, Math.sin(time * 0.8 + 0.6));
      });
    }

    _crabs() {
      const lam = this.R.lam, w = this.w, red = lam(0xe2452e, { roughness: 0.35 }), white = lam(0xffffff), black = lam(0x15151a);
      const crabs = [];
      for (const f of [0.3, 0.75]) {
        const at = this.find(f, (i, side) => [-10, 0, 10].every((a) => { const p = this.spot(i, side, w + 9, a); return this.free(p.x, p.z, w + 5.5, 4); }));
        if (!at) continue;
        const p = this.spot(at.i, at.side, w + 9);
        for (const a of [-10, 0, 10]) { const q = this.spot(at.i, at.side, w + 9, a); this.placed.push({ x: q.x, z: q.z, r: 4 }); }
        const g = new T.Group(), b = new T.Group(); g.add(b);
        const body = new T.Mesh(new T.SphereGeometry(2, 28, 18), red); body.scale.set(1.15, 0.55, 0.85); body.position.y = 1.5; b.add(body);
        for (const k of [-1, 1]) {
          const st = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1.1, 8), red); st.position.set(k * 0.6, 2.4, 1.1); b.add(st);
          const e = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), white); e.position.set(k * 0.6, 3, 1.1); b.add(e);
          const pu = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), black); pu.position.set(k * 0.6, 3.05, 1.45); b.add(pu);
          const claw = new T.Mesh(new T.SphereGeometry(0.85, 16, 12), red); claw.scale.set(1, 0.7, 1.3); claw.position.set(k * 2.4, 1.5, 1.6); b.add(claw);
          for (let l = 0; l < 3; l++) { const leg = new T.Mesh(new T.CylinderGeometry(0.14, 0.1, 2.2, 6), red); leg.position.set(k * 2.3, 0.75, -0.6 + l * 0.6); leg.rotation.z = k * 0.9; b.add(leg); }
          b[k < 0 ? 'clawL' : 'clawR'] = claw;
        }
        g.position.set(p.x, 0, p.z);
        g.rotation.y = Math.atan2(-p.tz, p.tx);                       // l'axe x du crabe suit le bord : il marche de côté
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        this.s.add(g);
        crabs.push({ g, b, p, ph: Math.random() * 6 }); this.dbg.crabe = p;
      }
      this.add((dt, time, P) => {
        for (const c of crabs) {
          if (!near(c.p.x, c.p.z, P, 220)) continue;
          const u = time * 0.45 + c.ph, a = Math.sin(u) * 9;
          c.g.position.set(c.p.x + c.p.tx * a, 0, c.p.z + c.p.tz * a);
          c.b.position.y = Math.abs(Math.sin(time * 14 + c.ph)) * 0.18;
          c.b.rotation.z = Math.sin(time * 14 + c.ph) * 0.05;
          const snap = 1 + Math.max(0, Math.sin(time * 5 + c.ph)) * 0.18;
          c.b.clawL.scale.set(snap, 0.7, 1.3); c.b.clawR.scale.set(2 - snap, 0.7, 1.3);
        }
      });
    }

    _gulls() {
      const lam = this.R.lam, white = lam(0xffffff, { roughness: 0.6 }), wingMat = new T.MeshLambertMaterial({ side: T.DoubleSide, map: this.R.canvas(64, 16, (c, W, H) => {
        const gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#d7dde3'); gr.addColorStop(1, '#3a3f48'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      }) });
      const gulls = [];
      for (let i = 0; i < 3; i++) {
        const g = new T.Group(), b = new T.Mesh(new T.SphereGeometry(1.2, 18, 12), white); b.scale.set(0.9, 0.85, 2.5); g.add(b);
        const h = new T.Mesh(new T.SphereGeometry(0.85, 16, 12), white); h.position.set(0, 0.5, 2.6); g.add(h);
        const bec = new T.Mesh(new T.ConeGeometry(0.3, 1.3, 10), lam(0xf7c52d)); bec.rotation.x = Math.PI / 2; bec.position.set(0, 0.4, 3.8); g.add(bec);
        g.wings = [-1, 1].map((k) => {
          const w = new T.Group(), geo = new T.PlaneGeometry(6.5, 2, 4, 1); geo.rotateX(-Math.PI / 2); geo.translate(k * 3.25, 0, 0);
          if (k < 0) { const uv = geo.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, 1 - uv.getX(j)); }
          w.add(new T.Mesh(geo, wingMat)); w.position.y = 0.4; g.add(w); return w;
        });
        this.s.add(g); this.dbg.mouette = g.position;
        gulls.push({ g, r: 60 + i * 28, y: 34 + i * 7, w: (i % 2 ? -1 : 1) * (0.28 + i * 0.05), ph: i * 2.1, cx: this.t.px[Math.floor(this.t.count * i / 3)] * 0.5, cz: this.t.pz[Math.floor(this.t.count * i / 3)] * 0.5 });
      }
      this.add((dt, time) => {
        for (const q of gulls) {
          const a = time * q.w + q.ph, g = q.g;
          g.position.set(q.cx + Math.cos(a) * q.r, q.y + Math.sin(time * 0.7 + q.ph) * 3, q.cz + Math.sin(a) * q.r);
          g.rotation.set(0, Math.atan2(-Math.sin(a) * q.w, Math.cos(a) * q.w), q.w > 0 ? -0.25 : 0.25, 'YXZ');
          const glide = Math.sin(time * 0.5 + q.ph) > 0.2, f = glide ? 0.08 * Math.sin(time * 2) : Math.sin(time * 6 + q.ph) * 0.5;
          g.wings[0].rotation.z = -f; g.wings[1].rotation.z = f;
        }
      });
    }

    // ---------- Forêt ----------
    _ants() {
      const t = this.t, w = this.w, L = 70, lat = w + 3.4;
      const at = this.find(0.12, (i, side) => { for (let k = 0; k <= L; k += 3) { const p = this.spot(i + k, side, lat); if (!this.free(p.x, p.z, lat - 0.6, 1.5)) return false; } return true; });
      if (!at) return;
      // Fourmi lisse : abdomen, thorax et tête d'un seul tour, six pattes.
      const prof = [[0, 0], [0.35, 0.1], [0.58, 0.45], [0.52, 0.85], [0.2, 1.08], [0.3, 1.3], [0.2, 1.55], [0.32, 1.72], [0.4, 1.96], [0.3, 2.22], [0, 2.32]];
      const parts = [new T.LatheGeometry(prof.map(([x, y]) => new T.Vector2(x, y)), 16).rotateX(Math.PI / 2)];
      for (const z of [1.15, 1.38, 1.6]) parts.push(new T.CylinderGeometry(0.06, 0.06, 1.9, 5).rotateZ(Math.PI / 2).translate(0, -0.15, z));
      for (const k of [-1, 1]) parts.push(new T.CylinderGeometry(0.04, 0.04, 0.9, 4).rotateX(0.9).rotateZ(k * 0.5).translate(k * 0.2, 0.3, 2.55));
      const ant = this.R.merge(parts); ant.translate(0, 0.62, 0);
      const leaf = new T.CircleGeometry(0.75, 10); leaf.scale(0.7, 1, 1); leaf.rotateY(Math.PI / 2); leaf.translate(0, 1.95, 1.4);
      const N = 40, every = 4, mA = new T.InstancedMesh(ant, this.R.lam(0x3a1e12, { roughness: 0.3 }), N);
      const mL = new T.InstancedMesh(leaf, new T.MeshLambertMaterial({ color: 0x6fbf3a, side: T.DoubleSide }), Math.ceil(N / every));
      for (const m of [mA, mL]) { m.frustumCulled = false; this.s.add(m); }
      mA.castShadow = true;
      for (let k = 0; k <= L; k += 4) { const p = this.spot(at.i + k, at.side, lat); this.placed.push({ x: p.x, z: p.z, r: 2 }); }
      const O = new T.Object3D(), len = L * t.ds;
      // Trajet des fourmis calculé une fois : point sur l'axe de leur file et normale vers l'extérieur.
      const PX = [], PZ = [], NX = [], NZ = [];
      for (let k = 0; k <= L + 1; k++) { const p = this.spot(at.i + k, at.side, lat); PX.push(p.x); PZ.push(p.z); NX.push(p.nx); NZ.push(p.nz); }
      const wig = Array.from({ length: N }, (_, a) => Math.sin(a * 2.7) * 0.5), mid = this.spot(at.i + L / 2, at.side, lat);
      this.dbg.fourmis = this.spot(at.i + 10, at.side, lat);
      this.add((dt, time, P) => {
        if (!near(mid.x, mid.z, P, 300)) return;
        for (let a = 0; a < N; a++) {
          const s = (time * 2.6 + a * (len / N) + (a % 3) * 0.4) % len, f = s / t.ds, i = Math.floor(f), u = f - i;
          const w = wig[a], x0 = PX[i] + NX[i] * w, z0 = PZ[i] + NZ[i] * w, x1 = PX[i + 1] + NX[i + 1] * w, z1 = PZ[i + 1] + NZ[i + 1] * w;
          O.position.set(x0 + (x1 - x0) * u, Math.abs(Math.sin(time * 16 + a)) * 0.08, z0 + (z1 - z0) * u);
          O.rotation.set(0, Math.atan2(x1 - x0, z1 - z0) + Math.sin(time * 8 + a) * 0.12, 0);
          O.updateMatrix();
          mA.setMatrixAt(a, O.matrix);
          if (a % every === 0) mL.setMatrixAt(a / every, O.matrix);
        }
        mA.instanceMatrix.needsUpdate = mL.instanceMatrix.needsUpdate = true;
      });
    }

    _butterflies() {
      const w = this.w, kinds = [['#ff8a1e', '#2b2230'], ['#3f8fe0', '#bfe6ff'], ['#ffd23f', '#e5352b'], ['#f0639a', '#ffffff']];
      const mats = kinds.map(([a, b]) => new T.MeshBasicMaterial({ side: T.DoubleSide, transparent: true, alphaTest: 0.4, depthWrite: true, map: this.R.canvas(64, 64, (c) => {
        c.fillStyle = a; c.beginPath(); c.ellipse(30, 22, 28, 20, -0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(26, 48, 18, 14, 0.4, 0, 7); c.fill();
        c.fillStyle = b; for (const [x, y, r] of [[40, 18, 6], [22, 26, 4], [26, 48, 5]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      }) }));
      const flies = [];
      for (let i = 0; i < 7; i++) {
        const at = this.find(i / 7 + 0.05, (j, side) => { const p = this.spot(j, side, w + 13); return this.free(p.x, p.z, w + 10, 3); });
        if (!at) continue;
        const p = this.spot(at.i, at.side, w + 13), g = new T.Group();
        const body = new T.Mesh(new T.CylinderGeometry(0.16, 0.12, 1.8, 8), this.R.lam(0x2b2230)); body.rotation.x = Math.PI / 2; g.add(body);
        g.wings = [-1, 1].map((k) => {
          const geo = new T.PlaneGeometry(2.4, 2.4); geo.rotateX(-Math.PI / 2); geo.translate(k * 1.2, 0, 0);
          if (k > 0) { const uv = geo.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, 1 - uv.getX(j)); }
          const m = new T.Mesh(geo, mats[i % mats.length]), wg = new T.Group(); wg.add(m); g.add(wg); return wg;
        });
        this.s.add(g);
        flies.push({ g, p, ph: i * 1.7 }); this.dbg.papillon = g.position;
      }
      const prev = new T.Vector3();
      this.add((dt, time, P) => {
        for (const b of flies) {
          if (!near(b.p.x, b.p.z, P, 200)) continue;
          const u = time + b.ph;
          prev.copy(b.g.position);
          b.g.position.set(b.p.x + Math.sin(u * 0.7) * 6, 4 + Math.sin(u * 1.9) * 1.8, b.p.z + Math.cos(u * 0.53) * 6);
          b.g.rotation.y = Math.atan2(b.g.position.x - prev.x, b.g.position.z - prev.z);
          const a = Math.sin(time * 15 + b.ph) * 1.05;
          b.g.wings[0].rotation.z = a; b.g.wings[1].rotation.z = -a;
        }
      });
    }

    // Bain : ce qui flotte se balance doucement sur l'eau.
    _float(list) {
      if (!list.length) return;
      list.forEach((p, i) => { p.ph = i * 1.7; p.y0 = p.g.position.y; p.rz = p.g.rotation.z; });
      this.add((dt, time, P, cars, lite) => {
        if (lite) return;
        for (const p of list) if (near(p.x, p.z, P, 220)) { p.g.position.y = p.y0 - 0.4 + Math.sin(time * 1.3 + p.ph) * 0.5; p.g.rotation.z = p.rz + Math.sin(time * 0.9 + p.ph) * 0.06; }
      });
    }
    _leaves(trees) {
      if (!trees.length) return;
      const s = new T.Shape(); s.moveTo(0, -1); s.bezierCurveTo(0.8, -0.4, 0.7, 0.6, 0, 1.1); s.bezierCurveTo(-0.7, 0.6, -0.8, -0.4, 0, -1);
      const geo = new T.ShapeGeometry(s, 6); geo.scale(1.6, 1.6, 1);
      const N = 36, m = new T.InstancedMesh(geo, new T.MeshLambertMaterial({ side: T.DoubleSide }), N), cols = [0xe0902a, 0xf2c13a, 0xc9502a, 0x7fb04a];
      const L = [], O = new T.Object3D();
      O.scale.set(0, 0, 0); O.updateMatrix();
      for (let i = 0; i < N; i++) { m.setColorAt(i, lin(cols[i % 4])); m.setMatrixAt(i, O.matrix); L.push({ life: -Math.random() * 6 }); }
      m.material.userData.lin = true; m.frustumCulled = false; this.s.add(m);
      this.add((dt, time, P, cars, lite) => {
        m.visible = !lite;
        if (lite) return;
        for (let i = 0; i < N; i++) {
          const l = L[i];
          if (l.life <= 0) {
            l.life += dt;
            if (l.life <= 0) continue;
            const close = trees.filter((tr) => near(tr.x, tr.z, P, 200)), tr = close.length ? close[Math.floor(Math.random() * close.length)] : null;
            if (!tr) { l.life = -1; continue; }
            Object.assign(l, { x: tr.x + (Math.random() - 0.5) * 30, y: (tr.g.top || 34) + Math.random() * 10, z: tr.z + (Math.random() - 0.5) * 30, vy: 2.4 + Math.random() * 1.6, ph: Math.random() * 6, life: 30, rest: 2 });
          }
          if (l.y > 0.3) { l.y -= l.vy * dt; l.x += Math.sin(time * 1.6 + l.ph) * 3 * dt; l.z += Math.cos(time * 1.3 + l.ph) * 2 * dt; }
          else { l.y = 0.3; l.rest -= dt; if (l.rest <= 0) { l.life = -Math.random() * 3; O.scale.set(0, 0, 0); O.updateMatrix(); m.setMatrixAt(i, O.matrix); continue; } }
          O.position.set(l.x, l.y, l.z);
          O.rotation.set(l.y > 0.3 ? Math.sin(time * 2.4 + l.ph) * 0.9 : -Math.PI / 2, l.ph + time * 0.6, l.y > 0.3 ? Math.cos(time * 2 + l.ph) * 0.6 : 0);
          const k = l.y > 0.3 ? 1 : Math.min(1, l.rest * 2); O.scale.set(k, k, k);
          O.updateMatrix(); m.setMatrixAt(i, O.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
      });
    }

    // ---------- Neige ----------
    _penguins() {
      const lam = this.R.lam, w = this.w, black = lam(0x1f2330, { roughness: 0.35 }), white = lam(0xffffff, { roughness: 0.5 }), orange = lam(0xf39a1e);
      const birds = [];
      for (const f of [0.22, 0.68]) {
        const at = this.find(f, (i, side) => [0, 10, 20, 30].every((a) => { const p = this.spot(i, side, w + 10, a); return this.free(p.x, p.z, w + 6.5, 4); }));
        if (!at) continue;
        const p = this.spot(at.i, at.side, w + 10);
        for (const a of [0, 10, 20, 30]) { const q = this.spot(at.i, at.side, w + 10, a); this.placed.push({ x: q.x, z: q.z, r: 4 }); }
        const g = new T.Group(), b = new T.Group(); g.add(b);
        b.add(new T.Mesh(new T.LatheGeometry([[0, 0], [1.6, 0.1], [2.2, 1.2], [2.3, 2.8], [1.9, 4.4], [1.5, 5.4], [1.05, 6.2], [0, 6.5]].map(([x, y]) => new T.Vector2(x, y)), 32), black));
        const ventre = new T.Mesh(new T.SphereGeometry(2, 28, 20), white); ventre.scale.set(0.85, 1.3, 0.55); ventre.position.set(0, 2.7, 1.05); b.add(ventre);
        const bec = new T.Mesh(new T.ConeGeometry(0.38, 1.3, 14), orange); bec.rotation.x = Math.PI / 2; bec.position.set(0, 5.3, 1.65); b.add(bec);
        for (const k of [-1, 1]) {
          const e = new T.Mesh(new T.SphereGeometry(0.34, 12, 10), white); e.position.set(k * 0.55, 5.75, 1.05); b.add(e);
          const pu = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), black); pu.position.set(k * 0.55, 5.78, 1.35); b.add(pu);
          const pied = new T.Mesh(new T.SphereGeometry(0.7, 14, 8), orange); pied.scale.set(1, 0.3, 1.4); pied.position.set(k * 0.8, 0.15, 0.8); b.add(pied);
          const aile = new T.Mesh(new T.SphereGeometry(1, 16, 12), black); aile.scale.set(0.28, 1.5, 0.75); aile.position.set(k * 2.15, 3.2, 0); aile.rotation.z = k * 0.2; b.add(aile);
          b[k < 0 ? 'wl' : 'wr'] = aile;
        }
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        g.position.set(p.x, 0, p.z); this.s.add(g);
        birds.push({ g, b, p, ph: birds.length * 5.5 }); this.dbg.pingouin = g.position;
      }
      // Cycle de 14 s : se dandine, plonge sur le ventre, glisse 30 m, se relève, fait demi-tour, et recommence.
      const ease = (u) => 1 - (1 - u) * (1 - u);
      this.add((dt, time, P) => {
        for (const q of birds) {
          if (!near(q.p.x, q.p.z, P, 240)) continue;
          const c = (time + q.ph) % 14, back = c >= 7, u = back ? c - 7 : c;
          const slide = u < 3 ? 0 : u < 6.4 ? ease((u - 3) / 3.4) : 1, s = back ? 30 * (1 - slide) : 30 * slide;
          const lie = u < 2.5 ? 0 : u < 3 ? (u - 2.5) / 0.5 : u < 6.4 ? 1 : Math.max(0, 1 - (u - 6.4) / 0.6);
          const turn = u < 1.8 ? 0 : Math.min(1, (u - 1.8) / 0.7);
          // Le cap passe de l'ancienne direction à la nouvelle pendant le dandinement.
          const hd = Math.atan2(q.p.tx, q.p.tz), from = back ? hd : hd + Math.PI, to = back ? hd + Math.PI : hd;
          q.g.rotation.y = from + MB.angleDiff(to, from) * turn;
          q.g.position.set(q.p.x + q.p.tx * s, 0, q.p.z + q.p.tz * s);
          q.b.rotation.x = lie * 1.42;
          q.b.position.y = lie * 1.9;
          q.b.rotation.z = lie ? 0 : Math.sin(time * 7 + q.ph) * 0.13;
          const flap = lie ? 1.1 : 0.2 + Math.max(0, Math.sin(time * 7 + q.ph)) * 0.35;
          q.b.wl.rotation.z = -flap; q.b.wr.rotation.z = flap;
        }
      });
    }

    _snowmen(list) {
      this.add((dt, time, P, cars) => {
        for (const p of list) {
          if (!near(p.x, p.z, P, 260)) continue;
          const g = p.g, close = near(p.x, p.z, P, 110), wav = close && cars ? 1 : 0;
          const want = close ? MB.angleDiff(Math.atan2(P.x - p.x, P.z - p.z), g.rotation.y) : Math.sin(time * 0.4 + p.x) * 0.6;
          const lim = Math.max(-1.3, Math.min(1.3, want));
          g.head.rotation.y += (lim - g.head.rotation.y) * Math.min(1, dt * 3);
          for (const a of g.arms) a.rotation.z = a.k * (wav ? 0.25 + Math.sin(time * 9 + a.k) * 0.35 : Math.sin(time * 0.8 + p.z) * 0.05);
        }
      });
    }

    _sparkles(ice) {
      const star = this.R.canvas(64, 64, (c) => {
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(200,235,255,.6)'); g.addColorStop(1, 'rgba(200,235,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, 64, 64); c.fillStyle = '#fff'; c.fillRect(30, 2, 4, 60); c.fillRect(2, 30, 60, 4);
      });
      const N = 10, sp = [];
      for (let i = 0; i < N; i++) {
        const s = new T.Sprite(new T.SpriteMaterial({ map: star, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
        s.visible = false; this.s.add(s); sp.push({ s, life: -Math.random() });
      }
      const w = this.w;
      this.add((dt, time, P, cars, lite) => {
        for (const q of sp) {
          q.life -= dt;
          if (q.life < -0.4) {
            if (lite) { q.s.visible = false; continue; }
            const close = ice.filter((p) => near(p.x, p.z, P, 140));
            let x, y, z;
            if (close.length && Math.random() < 0.6) { const p = close[Math.floor(Math.random() * close.length)]; x = p.x + (Math.random() - 0.5) * 18; y = 4 + Math.random() * 16; z = p.z + (Math.random() - 0.5) * 18; }
            else { x = P.x + (Math.random() - 0.5) * 120; z = P.z + (Math.random() - 0.5) * 120; y = 0.6; if (MB.trackDistance(this.t, x, z) < w + 3) continue; }
            q.s.position.set(x, y, z); q.life = 0.7; q.s.visible = true;
          }
          if (q.life > 0) { const k = Math.sin((q.life / 0.7) * Math.PI) * (q.s.position.y > 1 ? 3.2 : 2.4); q.s.scale.set(k, k, 1); q.s.material.rotation = q.life * 3; }
          else q.s.visible = false;
        }
      });
    }

    // ---------- Chambre ----------
    _tops(list) {
      this.add((dt, time, P) => {
        for (const p of list) {
          if (!near(p.x, p.z, P, 260)) continue;
          p.g.spin.rotation.y += dt * 9;
          p.g.spin.rotation.z = 0.08 + Math.sin(time * 1.3 + p.x) * 0.05;                   // elle tangue un peu
        }
      });
    }
    // Petit train en bois sur un ovale de rails, à l'écart de la piste.
    _train() {
      const w = this.w, R = 16, lam = this.R.lam;
      const at = this.find(0.5, (i, side) => { for (let a = 0; a < 6.28; a += 0.5) { const c = this.spot(i, side, w + 6 + R * 1.6); if (!this.free(c.x + Math.cos(a) * R * 1.4, c.z + Math.sin(a) * R, w + 4, 4)) return false; } return true; });
      if (!at) return;
      const c = this.spot(at.i, at.side, w + 6 + R * 1.6);
      this.placed.push({ x: c.x, z: c.z, r: R * 1.5 });
      const rail = new T.Mesh(new T.TorusGeometry(1, 0.012, 6, 120), lam(0x8a5c34));
      rail.rotation.x = Math.PI / 2; rail.scale.set(R * 1.4, R, 1); rail.position.set(c.x, 0.3, c.z); this.s.add(rail);
      const rail2 = rail.clone(); rail2.scale.set(R * 1.4 + 1.6, R + 1.6, 1); this.s.add(rail2);
      const carts = [], cols = [0xe5352b, 0x2f8fd8, 0xf7c52d, 0x25b98a];
      for (let k = 0; k < 4; k++) {
        const g = new T.Group(), body = new T.Mesh(this.R.roundBox(3.6, 2, 2.2, 0.35), lam(cols[k], { roughness: 0.3 })); body.position.y = 1.6; g.add(body);
        if (k === 0) { const ch = new T.Mesh(new T.CylinderGeometry(0.5, 0.6, 1.6, 14), lam(0x2b2d35)); ch.position.set(1, 3.2, 0); g.add(ch); const cab = new T.Mesh(this.R.roundBox(1.6, 1.6, 2.2, 0.3), lam(0xe5352b)); cab.position.set(-1, 3.2, 0); g.add(cab); }
        for (const x of [-1.1, 1.1]) for (const z of [-1.15, 1.15]) { const wh = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.3, 16), lam(0x2b2d35)); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.6, z); g.add(wh); }
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        this.s.add(g); carts.push(g);
      }
      this.dbg.train = c; this.dbg.wagons = carts;
      this.add((dt, time, P) => {
        if (!near(c.x, c.z, P, 300)) return;
        carts.forEach((g, k) => {
          const a = time * 0.35 - k * 0.27, x = c.x + Math.cos(a) * (R * 1.4 + 0.8), z = c.z + Math.sin(a) * (R + 0.8);
          g.position.set(x, Math.abs(Math.sin(time * 9 + k)) * 0.05, z);
          g.rotation.y = Math.atan2(-Math.cos(a) * (R + 0.8), -Math.sin(a) * (R * 1.4 + 0.8));
        });
        if (Math.random() < dt * 1.5) this.view._puff(carts[0].position.x, 4.5, carts[0].position.z, 0xffffff, 2.2, 0.9);   // fumée de la loco
      });
    }

    // ---------- Ville ----------
    _windows(list) {
      const lit = ['#ffd98a', '#ffd98a', '#7fe4ff', '#ffb36b'];
      let wait = 0;
      this.add((dt, time, P) => {
        wait -= dt;
        if (wait > 0 || !list.length) return;
        wait = 0.22;
        const close = list.filter((p) => near(p.x, p.z, P, 260));
        if (!close.length) return;
        const p = close[Math.floor(Math.random() * close.length)], c = p.g.win.image.getContext('2d'), i = Math.floor(Math.random() * 6), k = Math.floor(Math.random() * 11);
        c.fillStyle = Math.random() < 0.45 ? '#161a30' : lit[Math.floor(Math.random() * lit.length)];   // tirage au sort : pas de relecture de pixels
        c.fillRect(8 + i * 19, 8 + k * 22, 12, 14);
        p.g.win.needsUpdate = true;
      });
    }

    _neons(list) {
      const words = [['PIZZA', '#ff4fa3'], ['CAFÉ', '#4fe3ff'], ['★ JOUETS', '#ffd23f'], ['HÔTEL', '#7cff6b'], ['CINÉ', '#ff8a1e']];
      const signs = list.map((p, i) => {
        const [txt, col] = words[i % words.length];
        const tex = this.R.canvas(256, 96, (c, W, H) => {
          c.fillStyle = 'rgba(10,10,30,.55)'; c.fillRect(6, 10, W - 12, H - 20);
          c.font = '900 52px Arial Black, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = col; c.fillText(txt, W / 2, H / 2 + 2); c.shadowBlur = 0; c.fillStyle = '#fff'; c.globalAlpha = 0.55; c.fillText(txt, W / 2, H / 2 + 2);
        });
        const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
        s.scale.set(26, 9.75, 1); s.position.set(p.x, p.g.h + 8, p.z); this.s.add(s);
        return { s, off: 0, ph: i };
      });
      this.add((dt) => {
        for (const n of signs) {
          if (n.off > 0) { n.off -= dt; n.s.material.opacity = Math.random() < 0.5 ? 0.15 : 1; if (n.off <= 0) n.s.material.opacity = 1; }
          else if (Math.random() < dt * 0.3) n.off = 0.3 + Math.random() * 0.5;     // grésillement de temps en temps
        }
      });
    }

    _fireflies(lamps) {
      if (!lamps.length) return;
      const per = 7, N = lamps.length * per, pos = new Float32Array(N * 3), geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const glow = this.R.canvas(32, 32, (c) => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(230,255,140,.8)'); g.addColorStop(1, 'rgba(230,255,140,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); });
      const pts = new T.Points(geo, new T.PointsMaterial({ map: glow, color: 0xe4ff8a, size: 1.6, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
      pts.frustumCulled = false; this.s.add(pts);
      this.add((dt, time, P, cars, lite) => {
        pts.visible = !lite;
        if (lite) return;
        for (let i = 0; i < N; i++) {
          const l = lamps[Math.floor(i / per)], a = time * (0.5 + (i % 3) * 0.25) * (i % 2 ? 1 : -1) + i * 1.9, r = 5 + Math.sin(time * 0.7 + i) * 2.5;
          pos[i * 3] = l.x + Math.cos(a) * r; pos[i * 3 + 1] = 31 + Math.sin(time * 1.3 + i * 2.1) * 4; pos[i * 3 + 2] = l.z + Math.sin(a) * r;
        }
        geo.attributes.position.needsUpdate = true;
      });
    }
  }

  MB.Life = Life;
})(window.MB = window.MB || {});
