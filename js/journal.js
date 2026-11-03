// Journal de partie : uniquement dans les versions de test (voir AndroidBridge.journalOn). Une ligne toutes les 50 ms,
// assez fine pour relire un coup de volant, assez légère pour tenir sous 400 Ko sur une course de trois minutes.
// Partie graphique : une ligne par seconde (images/s, pire image, résolution, ombres, appels de dessin), les images
// lentes, les erreurs, et quelques captures d'écran réduites pour voir ce que voyait le joueur.
(function (MB) {
  const STEP = 0.05, MAX_ROWS = 12000, SLOW_MS = 50, MAX_SLOW = 200, MAX_ERR = 30;
  const SNAP_FIRST = 3, SNAP_EVERY = 10, MAX_SNAPS = 8;
  const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
  const SKIP = { count: 1, coin: 1 };

  class Journal {
    constructor(race, meta) {
      this.race = race; this.meta = meta; this.rows = []; this.events = []; this.next = -99;
      this.ms = 0; this.frames = 0; this.worst = 0;
      this.gfx = []; this.slow = []; this.errors = []; this.snaps = []; this.gpu = null;
      this.sec = { at: null, frames: 0, ms: 0, worst: 0, calc: 0, draw: 0, n: 0 }; this.nextSnap = SNAP_FIRST; this.skipNext = false;
    }
    // skip : l'image précédente a servi à une capture, son temps ne dit rien du jeu
    frame(dt) {
      const ms = dt * 1000;
      if (this.skipNext) { this.skipNext = false; return; }
      this.frames++; this.ms += ms; if (ms > this.worst) this.worst = ms;
      const s = this.sec; s.frames++; s.ms += ms; if (ms > s.worst) s.worst = ms;
      if (ms > SLOW_MS && this.slow.length < MAX_SLOW) this.slow.push([r2(this.race.clock), Math.round(ms)]);
    }
    // Temps passé dans l'image : calcul (simulation, interface) et dessin (animations du décor + envoi à la carte graphique).
    cost(calc, draw) { const s = this.sec; s.calc += calc; s.draw += draw; s.n++; }
    // Une fois par seconde de course, l'état du rendu (view.stats()).
    graphics(stats) {
      const s = this.sec, t = this.race.clock;
      if (s.at === null) { s.at = t; return; }
      if (t - s.at < 1) return;
      this.gfx.push([Math.round(t), s.ms ? Math.round(s.frames * 1000 / s.ms) : 0, Math.round(s.worst), r2(stats.pr), stats.ombres ? 1 : 0, stats.appels, stats.triangles,
        s.n ? r2(s.calc / s.n) : 0, s.n ? r2(s.draw / s.n) : 0]);
      s.at = t; s.frames = 0; s.ms = 0; s.worst = 0; s.calc = 0; s.draw = 0; s.n = 0;
    }
    wantSnap() {
      const r = this.race;
      if (this.snaps.length >= MAX_SNAPS || r.clock < this.nextSnap || r.state !== 'run' || r.playerFinished) return false;
      this.nextSnap = r.clock + SNAP_EVERY;
      return true;
    }
    snap(url, label) {
      if (!url || this.snaps.length >= MAX_SNAPS + 1) return;
      this.snaps.push({ at: r2(this.race.clock), quoi: label || 'course', img: url });
      this.skipNext = true;
    }
    error(text) { if (this.errors.length < MAX_ERR) this.errors.push({ at: r2(this.race.clock), texte: String(text).slice(0, 300) }); }
    sample(ctl, finger) {
      const r = this.race, c = r.player;
      if (r.clock < this.next || this.rows.length >= MAX_ROWS) return;
      this.next = r.clock + STEP - 1e-6;
      const flags = (c.drifting ? 1 : 0) | (c.onWall ? 2 : 0) | (c.boost > 0 ? 4 : 0) | (c.y > 0.05 ? 8 : 0) | (c.spin > 0 ? 16 : 0) | (c.fix > 0 ? 32 : 0) | (finger ? 64 : 0);
      let ahead = null, behind = null;
      for (const o of r.cars) {
        if (o === c) continue;
        const d = o.prog - c.prog;
        if (d >= 0 && (ahead === null || d < ahead)) ahead = d;
        if (d < 0 && (behind === null || -d < behind)) behind = -d;
      }
      this.rows.push([r2(r.clock), r2(ctl.steer), r2(c.steer), r2(c.x), r2(c.z), r3(c.h), r2(c.v), r2(c.lat), c.idx, r.position(c), flags, ahead === null ? null : Math.round(ahead), behind === null ? null : Math.round(behind)]);
    }
    note(events) {
      const r = this.race, c = r.player;
      for (const e of events) {
        if (SKIP[e.t] || (e.car !== undefined && e.car !== c.id)) continue;
        this.events.push({ ...e, at: r2(r.clock), x: r2(c.x), z: r2(c.z), v: r2(c.v), idx: c.idx, steer: r2(c.steer) });
      }
    }
    end(outcome) {
      return {
        v: 2, meta: this.meta, outcome, audio: this.audio || null,
        columns: ['t', 'doigt', 'braquage', 'x', 'z', 'cap', 'vitesse', 'lat', 'idx', 'rang', 'etat', 'ecart_devant', 'ecart_derriere'],
        flags: { drift: 1, mur: 2, turbo: 4, air: 8, tete_a_queue: 16, remise: 32, doigt_pose: 64 },
        fps: this.ms ? Math.round(this.frames * 1000 / this.ms) : 0, pire_image_ms: Math.round(this.worst),
        rows: this.rows, events: this.events,
        graphique: {
          gpu: this.gpu,
          colonnes: ['t', 'images_s', 'pire_ms', 'resolution', 'ombres', 'appels', 'triangles', 'calcul_ms', 'dessin_ms'],
          secondes: this.gfx, images_lentes: this.slow, erreurs: this.errors, captures: this.snaps,
        },
      };
    }
  }
  MB.Journal = Journal;
})(typeof window !== 'undefined' ? (window.MB = window.MB || {}) : module.exports);
