// Atelier de circuits : le joueur pose et déplace des points au doigt, la route lissée se dessine en direct.
// Points sur la grille 0..100 des circuits du jeu ; MB.buildTrack fait le reste (lissage, longueur, départ).
(function (MB) {
  const MAX_PTS = 18, MIN_PTS = 5, HIT = 8;
  MB.EDIT_DEFAULT = [[20, 25], [50, 15], [80, 25], [88, 50], [80, 75], [50, 85], [20, 75], [12, 50]];

  // Distance d'un point au segment ab, sur la grille.
  const segDist = (p, a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1;
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l));
    return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dz);
  };

  class Editor {
    constructor(canvas, onChange) {
      this.cv = canvas; this.g = canvas.getContext('2d'); this.onChange = onChange;
      this.pts = MB.EDIT_DEFAULT.map((p) => p.slice()); this.sel = -1; this.drag = -1; this.moved = false;
      this.col = '#8a8f9c';
      canvas.addEventListener('pointerdown', (e) => this.down(e));
      canvas.addEventListener('pointermove', (e) => this.move(e));
      for (const k of ['pointerup', 'pointercancel']) canvas.addEventListener(k, (e) => this.up(e));
    }
    set(pts, col) { this.pts = pts.map((p) => p.slice()); this.sel = -1; if (col) this.col = col; this.update(); }
    // Coordonnées grille (0..100, avec une marge autour) du doigt.
    grid(e) {
      const r = this.cv.getBoundingClientRect();
      return [Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 110 - 5)), Math.max(2, Math.min(98, ((e.clientY - r.top) / r.height) * 110 - 5))];
    }
    near(p) {
      let best = -1, bd = HIT;
      this.pts.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    down(e) {
      e.preventDefault(); this.cv.setPointerCapture(e.pointerId);
      const p = this.grid(e), i = this.near(p);
      this.moved = false;
      if (i >= 0) { this.drag = i; return; }
      if (this.pts.length >= MAX_PTS) { this.onChange && this.onChange({ full: true }); return; }
      // Nouveau point : glissé dans le segment le plus proche, pour ne pas croiser la boucle.
      let k = 0, bd = 1e9;
      this.pts.forEach((a, j) => { const d = segDist(p, a, this.pts[(j + 1) % this.pts.length]); if (d < bd) { bd = d; k = j; } });
      this.pts.splice(k + 1, 0, p); this.sel = k + 1; this.drag = k + 1; this.moved = true;
      this.update();
    }
    move(e) {
      if (this.drag < 0) return;
      const p = this.grid(e), q = this.pts[this.drag];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.6 && !this.moved) return;
      this.moved = true; this.pts[this.drag] = p; this.sel = this.drag;
      this.draw();
    }
    up() {
      if (this.drag < 0) return;
      if (!this.moved) this.sel = this.sel === this.drag ? -1 : this.drag;   // simple toucher : choisit le point
      this.drag = -1; this.update();
    }
    remove() {
      if (this.sel < 0 || this.pts.length <= MIN_PTS) return false;
      this.pts.splice(this.sel, 1); this.sel = -1; this.update(); return true;
    }
    // Recalcule la route et sa validité, puis prévient l'écran.
    update() {
      this.draw();
      this.onChange && this.onChange({ check: this.check, pts: this.pts });
    }
    draw() {
      const cv = this.cv, g = this.g, dpr = window.devicePixelRatio || 1, W = cv.clientWidth;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr); }
      const k = (W * dpr) / 110, X = (v) => (v + 5) * k;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#efe6d6'; g.fillRect(0, 0, cv.width, cv.height);
      g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 1;
      for (let v = 0; v <= 100; v += 10) { g.beginPath(); g.moveTo(X(v), X(0)); g.lineTo(X(v), X(100)); g.moveTo(X(0), X(v)); g.lineTo(X(100), X(v)); g.stroke(); }
      const t = MB.buildTrack({ id: 'edit', pts: this.pts, mood: 'matin', seed: 1 });
      const c = (this.check = MB.checkTrack(t)); this.track = t;
      const gx = (i) => X(t.px[i] / t.scale + 50), gz = (i) => X(t.pz[i] / t.scale + 50), w = (t.width / t.scale) * k;
      const path = () => { g.beginPath(); for (let i = 0; i <= t.count; i++) { const j = i % t.count; i ? g.lineTo(gx(j), gz(j)) : g.moveTo(gx(j), gz(j)); } };
      g.lineJoin = 'round'; g.lineCap = 'round';
      path(); g.strokeStyle = '#ffffff'; g.lineWidth = w + 5 * dpr; g.stroke();
      path(); g.strokeStyle = '#4a4d57'; g.lineWidth = w; g.stroke();
      // Parties fautives en rouge (trop proches) ou orange (virage trop serré).
      for (let i = 0; i < t.count; i += 2) if (c.bad[i]) {
        g.beginPath(); g.moveTo(gx(i), gz(i)); g.lineTo(gx((i + 2) % t.count), gz((i + 2) % t.count));
        g.strokeStyle = c.bad[i] === 1 ? '#e8453c' : '#f39a1e'; g.lineWidth = w; g.stroke();
      }
      path(); g.setLineDash([4 * dpr, 6 * dpr]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5 * dpr; g.stroke(); g.setLineDash([]);
      // Ligne de départ (damier) et flèche du sens de course.
      g.save(); g.translate(gx(0), gz(0)); g.rotate(Math.atan2(t.tz[0], t.tx[0]));
      const sq = w / 6;
      for (let m = 0; m < 6; m++) for (let r = 0; r < 2; r++) { g.fillStyle = (m + r) % 2 ? '#fff' : '#222'; g.fillRect(r * sq - sq, -w / 2 + m * sq, sq, sq); }
      g.restore();
      const ai = 14, ax = gx(ai), az = gz(ai), ang = Math.atan2(t.tz[ai], t.tx[ai]);
      g.save(); g.translate(ax, az); g.rotate(ang); g.fillStyle = '#ffd34d';
      g.beginPath(); g.moveTo(7 * dpr, 0); g.lineTo(-5 * dpr, -5 * dpr); g.lineTo(-5 * dpr, 5 * dpr); g.closePath(); g.fill(); g.restore();
      // Points de contrôle, numérotés ; le point choisi est entouré.
      g.font = `700 ${10 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      this.pts.forEach((p, i) => {
        g.beginPath(); g.arc(X(p[0]), X(p[1]), (i === this.sel ? 11 : 8) * dpr, 0, Math.PI * 2);
        g.fillStyle = i === this.sel ? '#ffd34d' : this.col; g.fill();
        g.lineWidth = 2 * dpr; g.strokeStyle = '#fff'; g.stroke();
        g.fillStyle = i === this.sel ? '#222' : '#fff'; g.fillText(String(i + 1), X(p[0]), X(p[1]) + 0.5);
      });
    }
  }
  MB.Editor = Editor;
})(typeof window !== 'undefined' ? (window.MB = window.MB || {}) : module.exports);
