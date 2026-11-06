// Simulation de course : logique pure, testable sous Node. y n'existe pas ici, tout se passe dans le plan XZ.
// Cap h : direction (cos h, sin h), un cap croissant tourne à droite vu du dessus.
(function (MB) {
  const TAU = Math.PI * 2;
  const DT = 1 / 60;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const angleDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const TOY_R = 2.2;   // rayon de ramassage d'un jouet caché : il faut passer dessus, pas à côté
  const STEER_BASE = 0.5, STEER_LOOK = 9, WALL_OFF = 0.2, ASSIST_BACK = 0.8, NEUTRAL_BACK = 0.22, DRIFT_ARM = 0.3, DRIFT_L1 = 0.35, DRIFT_L2 = 0.8, DUEL_GAP = 30;
  const CAR_R = 2.3, COIN_R = 3.4, RAMP_H = 1.6, RAMP_N = 5;
  // Contacts avec les objets au sol : la voiture est une gélule (axe ±CAR_AXIS, rayon CAR_SIDE) qui suit
  // sa carrosserie (~4,9 m sur 2,3 m), et non plus un point au centre : le nez ou le flanc comptent aussi.
  const CAR_AXIS = 1.3, CAR_SIDE = 1.15, BOX_HALF = 1.2, HONEY_R = 3.3, HONEY_DIP = 0.7;
  const bodyDist = (c, x, z) => {
    const dx = x - c.x, dz = z - c.z, ch = Math.cos(c.h), sh = Math.sin(c.h);
    const along = dx * ch + dz * sh, lat = -dx * sh + dz * ch, a = Math.max(-CAR_AXIS, Math.min(CAR_AXIS, along));
    return Math.hypot(along - a, lat);
  };

  class Race {
    constructor(opts) {
      const def = opts.def || MB.TRACKS.find((t) => t.id === opts.trackId);   // def : variante (sens inverse, pluie)
      this.track = opts.track || MB.buildTrack(def);
      const d = MB.DIFFS[opts.diff || 'facile'];
      this.diff = Object.assign({}, d, { skill: d.skill * (1 + 0.035 * (opts.power || 0)) });  // les rivaux progressent un peu avec toi
      this.laps = opts.laps || MB.CONFIG.laps;
      this.assist = opts.assist !== false;
      this.sens = opts.sens || 1;
      this.grip = this.track.def.grip || 1;
      this.random = rng(opts.seed || 1);
      this.state = 'countdown';
      this.clock = -3.2;
      this.events = [];
      this.syrups = [];
      this.marbles = [];
      this.cars = [];
      this.boxes = [];
      this.coins = [];
      this.coinCount = 0;
      this.playerFinished = false;
      this.alpha = 0;
      this.solo = !!opts.solo;                                 // contre-la-montre : seul en piste, sans boîtes
      this.toys = (opts.toys || []).map((y) => ({ id: y.id, dup: !!y.dup, x: y.x, z: y.z, taken: false }));   // jouets cachés (nouveaux ou doublons)
      this._grid(opts);
      this._pickups();
      this._save();
    }

    _grid(opts) {
      const t = this.track, playerCar = opts.carSpec || MB.CARS.find((c) => c.id === opts.carId) || MB.CARS[0];
      const n = opts.solo ? 1 : opts.carCount || MB.CONFIG.carCount;
      const rivals = MB.RIVAL_CARS.map((id) => MB.CARS.find((c) => c.id === id));
      for (let g = 0; g < n; g++) {
        const isPlayer = g === n - 1;                         // le joueur part dernier : doubler, c'est le plaisir du jeu
        const spec = isPlayer ? playerCar : rivals[g % rivals.length];
        const back = 8 + g * 6;
        const i = (t.count - Math.round(back / t.ds)) % t.count;
        const lat = (g % 2 ? 1 : -1) * 3.4;
        const c = {
          id: g, isPlayer, spec, name: isPlayer ? 'P' : MB.RIVALS[g % MB.RIVALS.length],
          x: t.px[i] - t.tz[i] * lat, z: t.pz[i] + t.tx[i] * lat, h: Math.atan2(t.tz[i], t.tx[i]), v: 0,
          idx: i, prog: -back, lat, steer: 0, slip: 0, held: 0, heldDir: 0, drifting: false, driftDir: 0, charge: 0,
          boost: 0, boostPow: 1, spin: 0, shield: 0, magnet: 0, sticky: 0, piggy: 0, item: null, itemDelay: 0, finished: false, time: 0, wrong: 0,
          aiLane: lat * 0.6, aiLaneT: 0, onWall: false, y: 0, vy: 0, ry: 0, sc: null, sci: 0, dk: 0, fix: 0, ff: 0,
          style: isPlayer ? null : MB.RIVAL_STYLES[g % MB.RIVAL_STYLES.length],
        };
        // Champion du circuit : un peu plus vif, et il ferme la porte.
        if (!isPlayer && opts.champ === g) { c.champ = true; c.style = Object.assign({}, c.style, { pace: c.style.pace * MB.CHAMP_PACE, block: true }); }
        this.cars.push(c);
        if (isPlayer) this.player = c;
      }
      this.ranked = this.cars.slice();
    }

    _pickups() {
      const t = this.track, at = (s, lat) => {
        const i = t.at(s % 1);
        return { x: t.px[i] - t.tz[i] * lat, z: t.pz[i] + t.tx[i] * lat };
      };
      // Rangées de boîtes : jamais sur la grille ni juste après la ligne (le départ a été déplacé sur la portion la plus droite).
      const CLEAR_AHEAD = 45, CLEAR_BEHIND = 25;
      const rows = [];
      for (const s of this.solo ? [] : [0.2, 0.36, 0.52, 0.8]) {
        let i = t.at(s % 1);
        if (i < CLEAR_AHEAD || i > t.count - CLEAR_BEHIND) i = CLEAR_AHEAD;
        while (rows.some((r) => Math.abs(r - i) < 22)) i += 22;             // pas deux rangées collées
        rows.push(i);
        for (const lat of [-4.5, 0, 4.5]) this.boxes.push({ x: t.px[i] - t.tz[i] * lat, z: t.pz[i] + t.tx[i] * lat, wait: 0, idx: i });
      }
      for (const s of [0.07, 0.33, 0.44, 0.66, 0.9]) for (let k = 0; k < 6; k++) {
        const lat = Math.sin(k * 0.9 + s * 20) * 4.5;
        const q = at(s + k * 0.0075, lat);
        this.coins.push(Object.assign(q, { taken: false, again: k % 2 === 0, hx: q.x, hz: q.z }));   // une pièce sur deux revient à chaque tour
      }
      for (const p of t.shortcuts) for (let k = 0; k < 5; k++) {           // une traînée de pièces montre l'entrée
        const i = (p.a - 20 + k * 4 + t.count) % t.count, lat = p.side * (k + 1) * 0.9;
        this.coins.push({ x: t.px[i] - t.tz[i] * lat, z: t.pz[i] + t.tx[i] * lat, taken: false });
      }
      for (const p of t.shortcuts) for (let k = 0; k < 5; k++) {           // récompense le risque du raccourci
        const i = Math.round(((k + 3) / 9) * (p.count - 1));
        this.coins.push({ x: p.px[i], z: p.pz[i], taken: false });
      }
    }

    position(c) { return this.ranked.indexOf(c) + 1; }
    lap(c) { return clamp(Math.floor(c.prog / this.track.length) + 1, 1, this.laps); }

    step(dt, input) {
      this.acc = (this.acc || 0) + Math.min(dt, 0.1);
      this.ticked = 0;
      while (this.acc >= DT) { this.acc -= DT; this.ticked++; this._save(); this._tick(input); }
      this.alpha = this.acc / DT;
    }

    // État du pas précédent : l'affichage glisse entre les deux, quelle que soit la cadence de l'écran.
    _save() {
      for (const c of this.cars) { c.ox = c.x; c.oz = c.z; c.oh = c.h; c.oslip = c.slip; c.olift = Math.max(c.y, c.ry); }
    }

    _tick(input) {
      if (this.state === 'done') return;
      const before = this.clock;
      this.clock += DT;
      if (this.clock < 0) {
        if (Math.ceil(before) !== Math.ceil(this.clock)) this.events.push({ t: 'count', n: -Math.floor(this.clock) });
        return;
      }
      if (before < 0) { this.state = 'run'; this.events.push({ t: 'go' }); }
      for (const c of this.cars) {
        if (c.finished) { this._cruise(c); continue; }
        const ctl = c.isPlayer ? input : this._ai(c);
        this._drive(c, ctl);
      }
      this._collide();
      this._pick();
      this._marbles();
      this.ranked = this.cars.slice().sort((a, b) => {
        if (a.finished && b.finished) return a.time - b.time;
        if (a.finished !== b.finished) return a.finished ? -1 : 1;
        return b.prog - a.prog;
      });
      if (this.playerFinished) this._finishAll();
    }

    // Rival sur le raccourci : il suit son axe, contourne les plots et ralentit dans les courbes de la branche.
    _aiBranch(c) {
      const p = c.sc, look = Math.round((8 + c.v * 0.35) / p.ds), i = Math.min(c.sci + look, p.count - 1), aim = MB.branchAim(p, c.sci, i, c.aiSlip || 0);
      let bend = 0;
      for (let k = 0; k < 14; k++) { const j = Math.min(c.sci + k, p.count - 2); bend = Math.max(bend, Math.abs(angleDiff(Math.atan2(p.tz[j + 1], p.tx[j + 1]), Math.atan2(p.tz[j], p.tx[j]))) / p.ds); }
      const cornerV = Math.max((c.spec.turn * 1.25) / Math.max(bend, 1e-3), c.spec.vmax * 0.74);
      if (c.item) { c.itemDelay -= DT; if (c.itemDelay <= 0) this._useItem(c); }
      return { steer: clamp(angleDiff(Math.atan2(aim[1] - c.z, aim[0] - c.x), c.h) * 3.2, -1, 1), limit: Math.min(cornerV, c.spec.vmax * this.diff.skill * c.style.pace), ai: true };
    }

    _ai(c) {
      const t = this.track, p = this.player;
      if (c.sc) return this._aiBranch(c);
      const look = Math.round((10 + c.v * 0.42) / t.ds);
      const i = (c.idx + look) % t.count;
      c.aiLaneT -= DT;
      const st = c.style;
      if (c.aiLaneT <= 0) { c.aiLaneT = st.lane[0] + this.random() * st.lane[1]; c.aiLane = (this.random() - 0.5) * (t.width - 8); }
      if (st.block && !p.sc && c.prog - p.prog > 7 && c.prog - p.prog < 16) { c.aiLane = clamp(p.lat, -4.8, 4.8); c.aiLaneT = 0.5; }   // ferme la porte
      for (const o of this.cars) {                            // contourne la voiture juste devant
        const gapAhead = o.prog - c.prog;
        if (o !== c && !o.sc && gapAhead > 0 && gapAhead < 11 && Math.abs(o.lat - c.lat) < 4.2) { c.aiLane = clamp(o.lat + (o.lat > 0 ? -5 : 5), -4.8, 4.8); c.aiLaneT = 0.8; }
      }
      // À hauteur du joueur, on s'écarte au lieu de frotter ; coincé contre le bord, on lève un peu le pied pour le laisser filer.
      c.yieldT = Math.max(0, (c.yieldT || 0) - DT);
      const side = p.prog - c.prog;
      if (!p.sc && side > -11 && side < 7 && Math.abs(p.lat - c.lat) < 5.2) {
        const away = Math.sign(c.lat - p.lat) || (p.lat > 0 ? -1 : 1), lane = p.lat + away * 5.6;
        if (Math.abs(lane) <= 4.8) { c.aiLane = lane; c.aiLaneT = 0.6; } else { c.aiLane = clamp(p.lat - away * 5.6, -4.8, 4.8); c.aiLaneT = 0.6; if (side > -2) c.yieldT = 0.5; }
      }
      // Raccourci : à l'approche, chaque rival décide une fois par passage, selon son caractère et le niveau ;
      // s'il y va, il se colle au bord pour entrer, comme le joueur doit le faire.
      for (const q of t.shortcuts) {
        const to = (q.a - c.idx + t.count) % t.count, into = (c.idx - q.a + t.count) % t.count;
        if (to > 55 && to <= 65 && c.scLap !== this.lap(c) * 100 + q.a) { c.scLap = this.lap(c) * 100 + q.a; c.scWant = this.random() < this.diff.sc * st.sc ? q : null; }
        if (c.scWant === q && (to <= 55 || into < q.door)) { c.aiLane = q.side * 7; c.aiLaneT = 0.3; }
        else if (c.scWant === q && into >= q.door && into < 60) c.scWant = null;   // entrée manquée
      }
      const j = c.scWant ? (c.idx + Math.round(look * 0.45)) % t.count : i;   // vers une entrée, il vise plus près pour serrer le bord
      const tx = t.px[j] - t.tz[j] * c.aiLane, tz = t.pz[j] + t.tx[j] * c.aiLane;
      const want = Math.atan2(tz - c.z, tx - c.x);
      const steer = clamp(angleDiff(want, c.h) * 3.2, -1, 1);
      let maxCurv = 0;
      for (let k = 0; k < 16; k++) { const m = t.curv[(c.idx + k) % t.count]; if (m > maxCurv) maxCurv = m; }
      const cornerV = Math.max((c.spec.turn * 1.25) / Math.max(maxCurv, 1e-3), c.spec.vmax * 0.74);
      const gap = (p.prog - c.prog) / 120;                    // >0 : le joueur est devant
      const band = gap > 0 ? Math.min(gap, 1) * this.diff.catchUp : Math.max(gap, -1) * this.diff.slowDown;
      // Le premier des rivaux ne lâche pas un joueur en tête : il revient au contact sans jamais le dépasser par magie.
      const best = this.ranked.find((o) => !o.isPlayer), lead = p.prog - c.prog;
      const duel = c === best && lead > DUEL_GAP ? Math.min((lead - DUEL_GAP) / 30, 1) * this.diff.duel : 0;
      if (c.item) {
        c.itemDelay -= DT;
        if (c.itemDelay <= 0) this._useItem(c);
      }
      const late = c.prog > t.length * (this.laps - 1) ? st.late : 0;   // certains gardent des forces pour le dernier tour
      const give = c.yieldT > 0 ? 0.95 : 1;
      return { steer, limit: give * Math.min(cornerV * (1 + duel), c.spec.vmax * (this.diff.skill * st.pace + band + late + duel)), ai: true };
    }

    _drive(c, ctl) {
      const t = this.track, s = c.spec, isP = c.isPlayer;
      const inSteer = c.spin > 0 || c.fix > 0 ? 0 : (ctl && ctl.steer) || 0;
      // Devant un raccourci, le doigt qui part de son côté vise la bifurcation : le braquage se juge sur elle, pas sur
      // la route principale qui continue tout droit (sinon l'anti-dépassement coupait le volant au dernier moment).
      c.branch = null;
      if (isP && !c.sc && inSteer) for (const q of t.shortcuts) {
        const into = (c.idx - q.a + t.count) % t.count;
        if (Math.sign(inSteer) === q.side && c.lat * q.side > q.edge - 1.5 && (into < q.door + 4 || into > t.count - 20)) c.branch = q;
      }
      if (isP) {
        // Le doigt répond tout de suite ; au-delà, le braquage n'augmente que si la route le demande :
        // pas d'attente au départ, et un doigt posé ne jette pas la voiture dans le mur en ligne droite.
        const past = -angleDiff(this._dirAt(c, 8), c.h) * Math.sign(inSteer);
        c.past = past;                                         // de combien on a déjà dépassé l'axe du virage
        const bend = angleDiff(this._dirAt(c, STEER_LOOK), this._dirAt(c, 0)), inward = Math.sign(bend) === Math.sign(inSteer);
        const need = inward ? (Math.abs(bend) / (STEER_LOOK * t.ds)) * c.v / (s.turn * this.grip * this.sens) : 0;
        // Voiture de travers et doigt qui la ramène : tout le braquage reste disponible, même si la route se redresse.
        const late = sstep(0.3, 0.55, -past) * 0.5;
        const want = inSteer * clamp(STEER_BASE + need + late, STEER_BASE, 1) * (1 - sstep(0.42, 0.82, past));
        const a = Math.abs(c.steer), same = want !== 0 && Math.sign(want) === Math.sign(c.steer || want);
        const rate = !same ? (inSteer ? 12 : 7) : Math.abs(want) < a ? 3 : a < STEER_BASE ? 12 : 2.6;
        c.steer += clamp(want - c.steer, -rate * DT, rate * DT);
      } else c.steer += clamp(inSteer - c.steer, -9 * DT, 9 * DT);
      if (isP && ctl && ctl.item && c.item) { this._useItem(c); }

      if (isP) this._driftLogic(c, inSteer);
      let target = (ctl && ctl.limit) || s.vmax;
      // Un virage pris au braquage fait lever le pied ; le drift garde l'élan : c'est lui qui paie.
      // Pneus collants : on braque sans lever le pied.
      if (isP && !c.sc && !(c.sticky > 0)) target *= 1 - (0.3 - 0.22 * c.dk) * c.steer * c.steer;
      else if (!(c.sticky > 0)) target *= 1 - 0.07 * Math.abs(c.steer);
      if (c.boost > 0) { c.boost -= DT; target = Math.max(target, s.vmax) * c.boostPow; }
      if (c.magnet > 0) {
        c.magnet -= DT;
        const r = this.position(c);
        if (r > 1) target = Math.max(target, s.vmax) * 1.28;
      }
      if (c.shield > 0) c.shield -= DT;
      if (c.sticky > 0) c.sticky -= DT;
      if (c.piggy > 0) c.piggy -= DT;
      if (c.spin > 0) { c.spin -= DT; target *= 0.35; }
      target = Math.min(target, s.vmax * 1.48);                 // turbos cumulés : ça pousse, ça ne s'emballe pas
      const low = c.v < target * 0.8 ? 1.7 : 1;                 // après un choc on repart franchement au lieu de se traîner
      const rate = target > c.v ? (c.boost > 0 ? 3.2 : 0.8 * low) * s.accel : c.boost > 0 ? 2.2 : 1.9;
      c.v += (target - c.v) * rate * DT;
      if (c.v < target && c.v < 7) c.v += 14 * DT * s.accel;

      c.dk += clamp((c.drifting ? 1 : 0) - c.dk, -2.5 * DT, 2.5 * DT);   // le drift prend et lâche progressivement
      const turn = s.turn * this.grip * Math.min(1, c.v / 12) * (ctl && ctl.ai ? 1.25 : 1 + 0.15 * c.dk) * (isP ? this.sens : 1) * (c.y > 0 ? 0.4 : 1);
      c.h += c.steer * turn * DT;

      const dir = this._dirAt(c, 0);
      const off = angleDiff(dir, c.h);
      // Volant magique : sans doigt posé, la voiture suit la route sur sa file, sans retard qui la ferait tirer.
      // Les vrais virages restent au joueur : l'aide ne couvre que les grandes courbes.
      if (isP) {
        // doigt levé alors que la voiture est déjà de travers : on la ramène franchement au lieu de la laisser filer au mur
        // petit écart laissé par le dernier coup de volant : sans ce rappel doux (~0,1 rad), la voiture traversait la route
        // en deux secondes et le joueur rattrapait trop tard
        const back = ASSIST_BACK * sstep(0.2, 0.6, Math.abs(off)) + (this.assist ? 0.4 : 0) + NEUTRAL_BACK * (1 - sstep(0.2, 0.6, Math.abs(off)));
        if (inSteer === 0) c.h += clamp(off * 2.6, -back, back) * (1 - Math.abs(c.steer)) * DT;
      }
      // Les lignes droites courbent un peu, presque toujours du côté où tourne le circuit : sans ce suivi léger, la voiture
      // filait vers l'extérieur et semblait tirer d'un côté. Dès que la route tourne vraiment (au-delà de ~0,2 rad/s),
      // le suivi plafonne à 0,25 rad/s : à 0,45 la voiture bouclait le Bol seule, à 0 chaque courbe demandait le doigt
      // à fond et le pilotage devenait pénible. Le Volant magique, lui, suit aussi les courbes.
      if (isP) {
        const road = (angleDiff(this._dirAt(c, 6), dir) / (6 * t.ds)) * c.v;
        const want = this.assist ? clamp(road, -0.7, 0.7) : road + (clamp(road, -0.25, 0.25) - road) * sstep(0.18, 0.32, Math.abs(road));
        c.ff += (want - c.ff) * Math.min(1, 8 * DT);
        c.h += c.ff * (1 - Math.abs(c.steer)) * DT;
      }

      // Juste après un mur, la voiture ne repart pas en travers vers le mur d'en face.
      if (isP && c.guard > 0 && !(c.fix > 0)) {
        c.guard -= DT;
        if (Math.abs(off) > WALL_OFF) c.h += clamp((Math.abs(off) - WALL_OFF) * Math.sign(off) * 7, -2.5, 2.5) * DT;
      }

      c.wrong = Math.abs(off) > 1.9 ? c.wrong + DT : 0;
      if (c.wrong > 1) { c.fix = 0.5; c.wrong = 0; this.events.push({ t: 'rescue', car: c.id }); }
      if (c.fix > 0) { c.fix -= DT; c.h += clamp(off * Math.min(1, 6 * DT), -0.2, 0.2); c.v -= c.v * 1.4 * DT; }   // remise dans l'axe sans téléportation

      c.x += Math.cos(c.h) * c.v * DT;
      c.z += Math.sin(c.h) * c.v * DT;
      this._contain(c);
      this._progress(c);
      this._air(c);
      const slipTarget = c.drifting ? c.driftDir * 0.26 : c.steer * 0.1;
      c.slip += (slipTarget - c.slip) * Math.min(1, 8 * DT);
    }

    // Direction de la route devant la voiture, sur le circuit ou sur le raccourci emprunté.
    _dirAt(c, ahead) {
      const p = c.sc, t = this.track, q = c.branch;
      if (p) { const i = Math.min(c.sci + ahead, p.count - 1); return Math.atan2(p.tz[i], p.tx[i]); }
      if (q) { const i = Math.min(MB.projectPath(q, c.x, c.z, 0).i + ahead, q.count - 1); return Math.atan2(q.tz[i], q.tx[i]); }
      const i = (MB.projectTrack(t, c.x, c.z, c.idx).i + ahead) % t.count;
      return Math.atan2(t.tz[i], t.tx[i]);
    }

    _air(c) {
      if (c.y <= 0) return;
      c.y += c.vy * DT; c.vy -= 34 * DT;
      if (c.y > 0) return;
      c.y = 0; c.vy = 0;
      if (!c.isPlayer) return;
      if (c.boost < 0.4) { c.boost = 0.4; c.boostPow = 1.12; }  // bien atterrir donne un petit coup de fouet
      this.events.push({ t: 'land' });
    }

    _driftLogic(c, steer) {
      const dir = Math.abs(steer) > 0.55 ? Math.sign(steer) : 0;   // il faut vraiment braquer pour drifter
      if (c.drifting) {
        if (dir !== c.driftDir || c.past > 0.85) {
          if (c.charge >= DRIFT_L1) {
            const big = c.charge >= DRIFT_L2;
            c.boost = (big ? 1.1 : 0.55) * c.spec.driftBonus;
            c.boostPow = big ? 1.24 : 1.14;
            this.events.push({ t: 'boost', car: c.id, big });
          }
          c.drifting = false; c.charge = 0; c.held = 0; c.heldDir = dir;
        } else {
          const prev = c.charge;
          c.charge += DT;
          if (prev < DRIFT_L1 && c.charge >= DRIFT_L1) this.events.push({ t: 'charge', lvl: 1 });
          if (prev < DRIFT_L2 && c.charge >= DRIFT_L2) this.events.push({ t: 'charge', lvl: 2 });
        }
        return;
      }
      if (dir !== 0 && dir === c.heldDir) {
        c.held += DT;
        const bend = angleDiff(this._dirAt(c, 14), this._dirAt(c, 0));
        // On ne part en drift que dans un vrai virage, du côté où il tourne.
        if (c.held > DRIFT_ARM && c.v > c.spec.vmax * 0.55 && Math.sign(bend) === dir && Math.abs(bend) > 0.22) {
          c.drifting = true; c.driftDir = dir; c.charge = 0;
          this.events.push({ t: 'drift' });
        }
      } else { c.heldDir = dir; c.held = 0; }
    }

    _contain(c) {
      const t = this.track;
      let pr, p = c.sc;
      if (p) {
        pr = MB.projectPath(p, c.x, c.z, c.sci);
        c.sci = pr.i; c.lat = pr.lat; c.onWall = false;
        c.idx = Math.round(p.a + ((p.b - p.a) * pr.i) / (p.count - 1));
        const backward = Math.cos(c.h) * p.tx[pr.i] + Math.sin(c.h) * p.tz[pr.i] < 0;
        for (const o of p.obst) {                                       // plots du raccourci : on rebondit dessus et on part en toupie
          const d = bodyDist(c, o.x, o.z), min = o.r + CAR_SIDE;
          if (c.y > 0.8 || d >= min) continue;
          const nx = c.x - o.x, nz = c.z - o.z, nl = Math.hypot(nx, nz) || 1;
          c.x += (nx / nl) * (min - d); c.z += (nz / nl) * (min - d);
          if (c.bumpT > this.clock) continue;
          c.bumpT = this.clock + 1;
          if (c.shield > 0) { c.shield = 0; this.events.push({ t: 'pop', car: c.id, x: c.x, z: c.z }); continue; }
          c.spin = 0.6; c.drifting = false; c.charge = 0; c.v *= 0.7; c.aiSlip = 0;
          this.events.push({ t: 'plot', car: c.id, x: o.x, z: o.z });
          if (c.isPlayer) this.events.push({ t: 'spin', why: 'plot' });
        }
        if (pr.i >= p.pad && pr.i <= p.padEnd + 3 && c.padT !== p.a + this.lap(c) * 1000) {   // la dalle turbo de sortie, une fois par passage
          c.padT = p.a + this.lap(c) * 1000;
          if (c.boost < 0.7) { c.boost = 0.7; c.boostPow = 1.15; }
          if (c.isPlayer) this.events.push({ t: 'pad' });
        }
        if (pr.i >= p.count - 2 || (pr.i <= 0 && backward)) { c.sc = null; p = null; }
        // Dans la bouche de la bifurcation, revenir vers le circuit n'est pas un mur : on y retourne simplement.
        else if (!(c.scEase > 0) && pr.lat * p.side < -(p.width / 2 - CAR_R * 0.6) && (pr.i < p.mouth || pr.i > p.count - 1 - p.tail)
          && Math.abs(MB.projectTrack(t, c.x, c.z, c.idx).lat) <= t.width / 2 - CAR_R * 0.6) { c.sc = null; p = null; }
      }
      if (!p) {
        pr = MB.projectTrack(t, c.x, c.z, c.idx);
        c.idx = pr.i; c.lat = pr.lat; c.onWall = false;
        if (c.isPlayer || c.scWant) for (const q of t.shortcuts) {
          const into = (pr.i - q.a + t.count) % t.count;
          if ((into >= q.door && into < t.count - 6) || pr.lat * q.side < q.edge || (!c.isPlayer && c.scWant !== q)) continue;   // le mur s'ouvre un peu avant a
          // Il faut longer le bord pour entrer : la trajectoire normale, même large, reste sur le circuit.
          // La voiture glisse alors en douceur sur la branche (scEase) au lieu d'être poussée comme contre un mur.
          const sp = MB.projectPath(q, c.x, c.z, into > t.count / 2 ? 0 : Math.min(into, q.count - 1)), on = Math.abs(sp.lat) <= q.width / 2 - CAR_R * 0.6;
          if (sp.i < q.count / 2) {
            const fresh = !c.scSeen || this.clock - c.scSeen > 3;
            c.sc = q; c.sci = sp.i; c.lat = sp.lat; c.scSeen = this.clock; c.scEase = on ? 0 : 0.6; c.scWant = null;
            if (!c.isPlayer) c.aiSlip = this.random() < this.diff.plot ? 1 + this.random() * 2 : 0;   // parfois un rival rate son slalom
            if (fresh) this.events.push(c.isPlayer ? { t: 'shortcut' } : { t: 'rivalShortcut', car: c.id });
            return;
          }
        }
      }
      const path = p || t, lim = path.width / 2 - CAR_R * 0.6;
      if (p && c.scEase > 0) {
        c.scEase -= DT;
        if (Math.abs(pr.lat) <= lim) { c.scEase = 0; return; }
        const sign = Math.sign(pr.lat), step = Math.min(Math.abs(pr.lat) - lim, 9 * DT);
        c.x -= -p.tz[pr.i] * sign * step; c.z -= p.tx[pr.i] * sign * step; c.lat -= sign * step;
        return;
      }
      if (Math.abs(pr.lat) <= lim) return;
      const sign = Math.sign(pr.lat), i = pr.i, push = Math.abs(pr.lat) - lim;
      c.x -= -path.tz[i] * sign * push;
      c.z -= path.tx[i] * sign * push;
      c.lat = sign * lim; c.onWall = true;
      // Le mur guide au lieu d'arrêter : on perd un peu de vitesse et le cap se redresse.
      const dir = Math.atan2(path.tz[i], path.tx[i]), off = angleDiff(dir, c.h);
      if (!(c.fix > 0)) c.h += c.isPlayer ? clamp(off * 9, -3.5, 3.5) * DT : clamp(off * 4, -2, 2) * DT;   // pendant une remise dans l'axe, elle seule tourne la voiture
      if (c.isPlayer) c.guard = 1.2;
      const rub = (c.isPlayer ? 0.2 + Math.abs(Math.sin(off)) * 0.8 : 0.25 + Math.abs(Math.sin(off)) * 1.6) * (c.sticky > 0 ? 0.5 : 1);
      if (c.v > c.spec.vmax * (c.isPlayer ? 0.7 : 0.62)) c.v -= c.v * rub * DT;
      if (c.isPlayer && Math.abs(off) > 0.25 && !c.scrape) { this.events.push({ t: 'wall' }); c.scrape = 0.4; }
      if (c.drifting) { c.charge *= 1 - 2 * DT; }
    }

    _progress(c) {
      const t = this.track;
      let d = c.idx - (c.lastIdx === undefined ? c.idx : c.lastIdx);
      if (d > t.count / 2) d -= t.count; else if (d < -t.count / 2) d += t.count;
      const prev = c.lastIdx === undefined ? c.idx : c.lastIdx;
      c.lastIdx = c.idx;
      c.ry = 0;
      if (!c.sc) for (const j of t.jumps) {
        const before = (j - c.idx + t.count) % t.count;
        if (before <= RAMP_N) {                                // la voiture monte sur la rampe, sans marches
          const left = (t.px[j] - c.x) * t.tx[j] + (t.pz[j] - c.z) * t.tz[j];
          c.ry = RAMP_H * (1 - clamp(left / (RAMP_N * t.ds), 0, 1));
        }
        if (c.y <= 0 && d > 0 && (j - prev + t.count) % t.count <= d && c.v > 12) {
          c.y = RAMP_H; c.vy = 7 + c.v * 0.2;
          if (c.isPlayer) this.events.push({ t: 'jump' });
        }
      }
      const lapBefore = Math.floor(c.prog / t.length);
      c.prog += d * t.ds;
      if (c.scrape) c.scrape = Math.max(0, c.scrape - DT);
      const lapNow = Math.floor(c.prog / t.length);
      if (c.isPlayer && lapNow > lapBefore && lapNow >= (this.bestLapSeen || 0) && lapNow > 0 && lapNow < this.laps) {
        this.bestLapSeen = lapNow + 1;
        this.events.push({ t: 'lap', n: lapNow + 1 });
      }
      if (c.isPlayer && lapNow > lapBefore && lapNow > 0) {
        const lt = this.clock - (this.lapStart || 0);
        this.lapStart = this.clock;
        if (!this.bestLap || lt < this.bestLap) this.bestLap = lt;
        for (const k of this.coins) if (k.again && k.taken) { k.taken = false; k.x = k.hx; k.z = k.hz; }
      }
      if (c.prog >= this.laps * t.length && !c.finished) {
        c.finished = true; c.time = this.clock; c.drifting = false;
        if (c.isPlayer) this.playerFinished = true;
      }
    }

    _cruise(c) {
      const t = this.track;
      c.v += (22 - c.v) * DT;
      const i = (c.idx + 6) % t.count, want = Math.atan2(t.pz[i] - c.z, t.px[i] - c.x);
      c.h += clamp(angleDiff(want, c.h) * 3, -1.4, 1.4) * DT;
      c.x += Math.cos(c.h) * c.v * DT;
      c.z += Math.sin(c.h) * c.v * DT;
      this._contain(c);
      this._progress(c);
      this._air(c);
      c.slip *= 0.9;
    }

    _finishAll() {
      // À l'arrivée du joueur, les rivaux restants reçoivent un temps estimé d'après leur retard.
      if (this.finishWait === undefined) this.finishWait = 1.8;   // assez pour voir les suivants arriver, pas assez pour s'impatienter
      this.finishWait -= DT;
      if (this.finishWait > 0) return;
      for (const c of this.cars) if (!c.finished) {
        c.finished = true;
        c.time = this.clock + (this.laps * this.track.length - c.prog) / Math.max(c.v, 18);
      }
      this.ranked = this.cars.slice().sort((a, b) => a.time - b.time);
      this.state = 'done';
      this.events.push({ t: 'finish' });
    }

    _collide() {
      const cs = this.cars;
      for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i], b = cs[j], dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz, min = CAR_R * 2;
        if (d2 >= min * min || d2 === 0 || Math.abs(a.y - b.y) > 2) continue;
        const d = Math.sqrt(d2), o = (0.3 * (min - d)) / d, ma = a.spec.mass, mb = b.spec.mass, sum = ma + mb;
        let ax = -dx * o * (mb / sum), az = -dz * o * (mb / sum), bx = dx * o * (ma / sum), bz = dz * o * (ma / sum);
        // Une voiture collée au mur ne peut pas reculer dans le mur : c'est l'autre qui s'écarte de toute la poussée.
        // Sinon le voisin l'enfonce et le mur la renvoie à chaque pas, comme une force qui l'aspire vers le bord.
        let w = this._wallPush(a, ax, az); if (w) { ax -= w[0]; az -= w[1]; bx -= w[0]; bz -= w[1]; }
        w = this._wallPush(b, bx, bz); if (w) { bx -= w[0]; bz -= w[1]; ax -= w[0]; az -= w[1]; }
        a.x += ax; a.z += az; b.x += bx; b.z += bz;
        const rear = a.prog < b.prog ? a : b;                  // celui qui percute perd un peu de vitesse
        rear.v *= 0.999;                                       // ~6 %/s au contact : avant 14 %/s, on se sentait aspiré par la voiture de devant
        // Petit décalage latéral : deux voitures se frottent et se dépassent au lieu de rester en file (pas vers un mur tout proche).
        // Le joueur n'est jamais déporté par ce décalage : c'est le rival qui s'écarte, de l'autre côté.
        const front = rear === a ? b : a, side = rear.lat >= front.lat ? 1 : -1, mover = rear.isPlayer ? front : rear, sgn = rear.isPlayer ? -side : side;
        const path = mover.sc || this.track, k = mover.sc ? mover.sci : mover.idx;
        if (!mover.isPlayer && sgn * mover.lat < path.width / 2 - CAR_R * 0.6 - 1.2) { mover.x += -path.tz[k] * sgn * 5 * DT; mover.z += path.tx[k] * sgn * 5 * DT; }
        if (a.isPlayer || b.isPlayer) { if (!this.bumpT || this.clock - this.bumpT > 0.4) { this.bumpT = this.clock; this.events.push({ t: 'bump' }); } }
      }
    }

    // Part d'un déplacement (mx, mz) qui enfoncerait la voiture dans le mur le plus proche, ou null.
    _wallPush(c, mx, mz) {
      const path = c.sc || this.track, i = c.sc ? c.sci : c.idx, lim = path.width / 2 - CAR_R * 0.6;
      if (Math.abs(c.lat) < lim - 0.6) return null;
      const s = Math.sign(c.lat), nx = -path.tz[i] * s, nz = path.tx[i] * s, out = mx * nx + mz * nz;
      return out > 0 ? [nx * out, nz * out] : null;
    }

    _rollItem(c) {
      const n = this.cars.length, r = this.position(c) - 1, band = r < n / 3 ? 0 : r < (2 * n) / 3 ? 1 : 2;
      const keys = Object.keys(MB.ITEM_ODDS);
      const calm = !c.isPlayer && c.prog < this.track.length;   // pas de miel de rival au premier tour : le peloton se forme d'abord
      const odds = (k) => ((calm && k === 'sirop') || (k === 'tirelire' && !c.isPlayer) ? 0 : MB.ITEM_ODDS[k][band]);
      let sum = 0; for (const k of keys) sum += odds(k);
      let x = this.random() * sum;
      for (const k of keys) { x -= odds(k); if (x <= 0) return k; }
      return keys[0];
    }

    _useItem(c) {
      if (c.item === 'ressort' && c.y > 0) return;             // déjà en l'air : il reste en réserve
      const it = c.item; c.item = null;
      if (it === 'sirop') {
        this.syrups.push({ x: c.x - Math.cos(c.h) * 6, z: c.z - Math.sin(c.h) * 6, life: 18, owner: c.id });
      } else if (it === 'elastique') { c.boost = 2.4; c.boostPow = 1.46; } else if (it === 'aimant') { c.magnet = 3; } else if (it === 'bulle') { c.shield = 7; } else if (it === 'collant') { c.sticky = 4; } else if (it === 'tirelire') { c.piggy = 8; } else if (it === 'recharge') {
        c.boost = Math.max(c.boost, 1.1); c.boostPow = 1.24;          // le super turbo d'un drift complet, d'un coup
        if (c.drifting) c.charge = MB.DRIFT.L2;
      } else if (it === 'bille') {
        const v = Math.max(c.v, 20) + 26;                         // lancée devant, elle rebondit sur les bordures
        this.marbles.push({ x: c.x + Math.cos(c.h) * 3.5, z: c.z + Math.sin(c.h) * 3.5, h: c.h, v, life: 4.5, owner: c.id, idx: c.idx, roll: 0 });
      } else if (it === 'ressort') {
        c.y = 0.05; c.vy = 11;
        if (c.isPlayer) this.events.push({ t: 'jump' });
      }
      this.events.push({ t: 'item', item: it, car: c.id });
    }

    _pick() {
      for (const b of this.boxes) {
        if (b.wait > 0) { b.wait -= DT; continue; }
        for (const c of this.cars) {
          if (bodyDist(c, b.x, b.z) < BOX_HALF + CAR_SIDE) {
            b.wait = c.isPlayer ? 2.5 : 1;                      // les rivaux en tête ne vident pas la piste devant le joueur
            if (!c.item && !c.finished) {
              c.item = this._rollItem(c);
              c.itemDelay = c.style ? c.style.item[0] + this.random() * c.style.item[1] : 0;
              if (c.isPlayer) this.events.push({ t: 'gotItem', item: c.item });
            }
            break;
          }
        }
      }
      const p = this.player;
      for (const k of this.coins) {
        if (k.taken) continue;
        if (p.magnet > 0) {                                    // l'aimant attire vraiment les pièces proches
          const mx = p.x - k.x, mz = p.z - k.z, md = Math.hypot(mx, mz);
          if (md < 22) { const pull = Math.min(1, (70 * DT) / md); k.x += mx * pull; k.z += mz * pull; }
        }
        const dx = p.x - k.x, dz = p.z - k.z;
        if (dx * dx + dz * dz < COIN_R * COIN_R) { k.taken = true; this.coinCount += p.piggy > 0 ? 2 : 1; this.events.push({ t: 'coin' }); }
      }
      for (const y of this.toys) {
        if (y.taken || p.y > 1.5) continue;
        const dx = p.x - y.x, dz = p.z - y.z;
        if (dx * dx + dz * dz < TOY_R * TOY_R) { y.taken = true; this.events.push({ t: 'toy', id: y.id, dup: y.dup }); }
      }
      for (let i = this.syrups.length - 1; i >= 0; i--) {
        const s = this.syrups[i];
        s.life -= DT;
        if (s.life <= 0) { this.syrups.splice(i, 1); continue; }
        for (const c of this.cars) {
          if (c.y < 0.6 && bodyDist(c, s.x, s.z) < HONEY_R + CAR_SIDE - HONEY_DIP) {   // une roue dans la flaque suffit ; en l'air, on passe au-dessus
            if (c.shield > 0) { c.shield = 0; this.events.push({ t: 'pop', car: c.id, x: c.x, z: c.z }); } else {
              c.spin = 0.6; c.drifting = false; c.charge = 0; c.v *= 0.85;   // le miel colle, sans ruiner la course
              this.events.push({ t: 'splat', car: c.id, x: c.x, z: c.z });
              if (c.isPlayer) this.events.push({ t: 'spin' });
            }
            this.syrups.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  MB.MARBLE_R = 1.1;                                                 // rayon de la bille dessinée
  // Billes : elles roulent tout droit, rebondissent sur les murs du circuit et font tourner la voiture touchée.
  Race.prototype._marbles = function () {
    const t = this.track, lim = t.width / 2 - 0.7;
    for (let i = this.marbles.length - 1; i >= 0; i--) {
      const m = this.marbles[i];
      m.life -= DT; m.v *= 1 - 0.12 * DT; m.roll += m.v * DT;
      if (m.life <= 0) { this.marbles.splice(i, 1); continue; }
      m.x += Math.cos(m.h) * m.v * DT; m.z += Math.sin(m.h) * m.v * DT;
      const pr = MB.projectTrack(t, m.x, m.z, m.idx); m.idx = pr.i;
      if (Math.abs(pr.lat) > lim) {                                   // rebond : symétrique par rapport à l'axe de la piste
        const dir = Math.atan2(t.tz[pr.i], t.tx[pr.i]), s = Math.sign(pr.lat);
        m.h = 2 * dir - m.h; m.v *= 0.92;
        m.x -= -t.tz[pr.i] * s * (Math.abs(pr.lat) - lim); m.z -= t.tx[pr.i] * s * (Math.abs(pr.lat) - lim);
        if (this.player && Math.hypot(m.x - this.player.x, m.z - this.player.z) < 60) this.events.push({ t: 'marbleBounce' });
      }
      for (const c of this.cars) {
        if (c.y > 0.8 || c.finished || bodyDist(c, m.x, m.z) > MB.MARBLE_R + CAR_SIDE) continue;
        if (c.id === m.owner) {                                           // sa propre bille revenue d'un rebond : elle ricoche sur la carrosserie
          const nx = m.x - c.x, nz = m.z - c.z, nl = Math.hypot(nx, nz) || 1, vx = Math.cos(m.h) * m.v - Math.cos(c.h) * c.v, vz = Math.sin(m.h) * m.v - Math.sin(c.h) * c.v;
          if (vx * nx + vz * nz < 0) { const away = Math.atan2(nz, nx); m.h = away; m.v = Math.max(m.v * 0.7, c.v + 8); if (c.isPlayer) this.events.push({ t: 'marbleBounce' }); }
          continue;
        }
        if (c.shield > 0) { c.shield = 0; this.events.push({ t: 'pop', car: c.id, x: c.x, z: c.z }); }
        else {
          c.spin = 0.6; c.drifting = false; c.charge = 0; c.v *= 0.8;
          this.events.push({ t: 'marbleHit', car: c.id, x: c.x, z: c.z, by: m.owner });
          if (c.isPlayer) this.events.push({ t: 'spin', why: 'bille' });
        }
        this.marbles.splice(i, 1);
        break;
      }
    }
  };

  // Pilote automatique pour les tests : se comporte comme un doigt qui tient gauche/droite.
  // opts.shortcut : vise les raccourcis.
  // Point visé dans un raccourci : l'axe, décalé du côté libre du prochain plot (slip = erreur du pilote, en points).
  MB.branchAim = function (p, sci, i, slip) {
    let lat = 0;
    for (const o of p.obst) if (o.q + 2 >= sci && o.q - sci < 22) { lat = -Math.sign(o.lat) * 2.6; if (slip) lat = -Math.sign(o.lat) * 0.4; break; }
    return [p.px[i] - p.tz[i] * lat, p.pz[i] + p.tx[i] * lat];
  };

  MB.botInput = function (race, opts) {
    const c = race.player, t = race.track, look = Math.round((10 + c.v * 0.42) / t.ds);
    if (c.sc) {
      const p = c.sc, a = MB.branchAim(p, c.sci, Math.min(c.sci + Math.round(look * 0.6), p.count - 1), 0), d = angleDiff(Math.atan2(a[1] - c.z, a[0] - c.x), c.h);
      return { steer: Math.abs(d) < 0.09 ? 0 : Math.sign(d), item: !!c.item };
    }
    const i = (c.idx + look) % t.count;
    let lane = 0;
    for (const o of race.cars) if (o !== c && o.prog > c.prog && o.prog - c.prog < 14 && Math.abs(o.lat - c.lat) < 4.2) lane = o.lat > 0 ? -4.5 : 4.5;
    if (opts && opts.shortcut) for (const q of t.shortcuts) {
      const to = (q.a - c.idx + t.count) % t.count;           // comme un joueur : doigt tenu vers l'entrée
      if ((to < 25 || (c.idx - q.a + t.count) % t.count < q.win) && c.lat * q.side < 6.5) return { steer: q.side, item: !!c.item };
    }
    const d = angleDiff(Math.atan2(t.pz[i] + t.tx[i] * lane - c.z, t.px[i] - t.tz[i] * lane - c.x), c.h);
    return { steer: Math.abs(d) < 0.09 ? 0 : Math.sign(d), item: !!c.item };
  };

  // Volant au doigt : on pose le pouce où on veut, c'est le glissement qui dirige, jamais la moitié d'écran.
  // Le point neutre suit le doigt à distance fixe : revenir en arrière répond aussitôt, même après un grand geste.
  const THUMB_R = 46, THUMB_DEAD = 5;
  MB.TouchPad = class {
    constructor() { this.f = new Map(); }
    down(id, x, w) {
      this.f.delete(id);
      this.f.set(id, { a: x, x });
    }
    move(id, x) {
      const q = this.f.get(id);
      if (!q) return;
      q.x = x;
      if (x - q.a > THUMB_R) q.a = x - THUMB_R; else if (q.a - x > THUMB_R) q.a = x + THUMB_R;
    }
    up(id) { this.f.delete(id); }
    clear() { this.f.clear(); }
    finger() { let q = null; for (const v of this.f.values()) q = v; return q; }   // le dernier doigt posé décide
    side() {
      const q = this.finger();
      if (!q) return 0;
      const d = q.x - q.a, m = Math.abs(d);
      return m <= THUMB_DEAD ? 0 : (Math.sign(d) * (m - THUMB_DEAD)) / (THUMB_R - THUMB_DEAD);
    }
  };

  // Pose affichée d'une voiture à une fraction alpha du pas en cours.
  MB.pose = function (c, alpha, o) {
    o.x = c.ox + (c.x - c.ox) * alpha;
    o.z = c.oz + (c.z - c.oz) * alpha;
    o.h = c.oh + angleDiff(c.h, c.oh) * alpha;
    o.slip = c.oslip + (c.slip - c.oslip) * alpha;
    o.lift = c.olift + (Math.max(c.y, c.ry) - c.olift) * alpha;
    return o;
  };

  MB.DRIFT = { L1: DRIFT_L1, L2: DRIFT_L2 };
  MB.Race = Race;
  MB.angleDiff = angleDiff;
})(typeof window !== 'undefined' ? (window.MB = window.MB || {}) : module.exports);
