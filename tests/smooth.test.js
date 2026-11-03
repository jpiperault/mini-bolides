// Fluidité : le mouvement affiché doit être régulier à toute cadence d'écran, sans à-coup de position ni de cap.
const MB = require('../js/data.js');
const load = (f) => new Function('window', 'module', 'require', require('fs').readFileSync(require('path').join(__dirname, '../js', f), 'utf8'))({ MB }, {}, require);
load('track.js'); load('sim.js');
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };

function run(hz, jitter) {
  const race = new MB.Race({ trackId: 'bol', carCount: 6, seed: 7, diff: 'normal', sens: 1 });
  const p = race.player, o = {};
  let t = 0, seed = 11, raw = [], smooth = [], real = [], prev = null, maxTurn = 0, lastH = null;
  while (t < 45 && !race.playerFinished) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const dt = (1 / hz) * (1 + jitter * (seed / 4294967296 - 0.5));
    t += dt;
    race.step(dt, MB.botInput(race));
    MB.pose(p, race.alpha, o);
    if (prev && p.v > 25) {
      raw.push(Math.hypot(p.x - prev.rx, p.z - prev.rz) / dt);
      smooth.push(Math.hypot(o.x - prev.x, o.z - prev.z) / dt);
      real.push(p.v);
    }
    if (lastH !== null) maxTurn = Math.max(maxTurn, Math.abs(MB.angleDiff(o.h, lastH)) / dt);
    lastH = o.h;
    prev = { rx: p.x, rz: p.z, x: o.x, z: o.z };
  }
  const cv = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length) / m; };
  return { raw: cv(raw), smooth: cv(smooth), real: cv(real), maxTurn };
}

for (const hz of [60, 90, 120]) for (const j of [0, 0.15]) {
  const r = run(hz, j);
  console.log(`     ${hz} Hz, gigue ${j * 100}% : irrégularité ${(r.raw * 100).toFixed(1)}% sans lissage, ${(r.smooth * 100).toFixed(1)}% avec`);
  // Les turbos et les chocs font varier la vitesse pour de bon : seul l'excès par rapport à la vraie vitesse serait une saccade.
  check(r.smooth - r.real < 0.02, `${hz} Hz gigue ${j} : mouvement affiché régulier`);
  check(r.maxTurn < 9, `${hz} Hz gigue ${j} : pas de saut de cap (${r.maxTurn.toFixed(1)} rad/s au plus)`);
}

// Remise dans l'axe : le cap revient sans téléportation.
{
  const race = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3, assist: false }), p = race.player;
  for (let i = 0; i < 300; i++) race.step(1 / 60, { steer: 0 });
  p.h += 2.6; p.wrong = 0.99;
  let worst = 0, last = p.h, fixed = false;
  for (let i = 0; i < 200; i++) {
    race.step(1 / 60, { steer: 0 });
    worst = Math.max(worst, Math.abs(MB.angleDiff(p.h, last))); last = p.h;
    if (race.events.some((e) => e.t === 'rescue')) fixed = true;
    race.events.length = 0;
  }
  check(fixed && worst < 0.3, `remise dans l'axe progressive (${worst.toFixed(2)} rad par pas au plus, secours ${fixed ? 'déclenché' : 'non déclenché'})`);
}

// Choc : deux voitures qui se chevauchent ne sont plus écartées d'un coup.
{
  const race = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3 }), [a, b] = race.cars;
  b.x = a.x + 1; b.z = a.z; race.clock = 1; race.state = 'run';
  const x0 = b.x;
  race._collide();
  check(Math.abs(b.x - x0) < 0.8, `séparation douce (${Math.abs(b.x - x0).toFixed(2)} par pas)`);
}
// Direction : un appui bref répond tout de suite, un doigt posé en ligne droite ne jette pas la voiture.
{
  const launch = () => {
    const race = new MB.Race({ trackId: 'bol', carCount: 1, seed: 3 }), t = race.track, c = race.player;
    let best = 0, low = Infinity;
    for (let i = 0; i < t.count; i++) { let m = 0; for (let k = 0; k < 40; k++) m = Math.max(m, t.curv[(i + k) % t.count]); if (m < low) { low = m; best = i; } }
    Object.assign(c, { x: t.px[best], z: t.pz[best], h: Math.atan2(t.tz[best], t.tx[best]), idx: best, lastIdx: best, v: c.spec.vmax * 0.95 });
    race.clock = 0; race.state = 'run';
    return race;
  };
  let race = launch(), c = race.player, h0 = c.h;
  for (let i = 0; i < 4; i++) race.step(1 / 60, { steer: 1 });
  for (let i = 0; i < 30; i++) race.step(1 / 60, { steer: 0 });
  const tap = Math.abs(MB.angleDiff(c.h, h0));
  check(tap > 0.05, `appui de 60 ms : ${(tap * 57.3).toFixed(1)} degrés`);
  race = launch(); c = race.player; h0 = c.h;
  for (let i = 0; i < 24; i++) race.step(1 / 60, { steer: 1 });
  const held = Math.abs(MB.angleDiff(c.h, h0));
  check(held < 0.4, `doigt posé 0,4 s en ligne droite : ${(held * 57.3).toFixed(0)} degrés`);
}
// Volant au doigt : seul le glissement compte, où que le pouce soit posé.
{
  const W = 400, pad = new MB.TouchPad();
  let same = true;
  for (let x = 40; x < W - 40; x += 13) {
    pad.clear(); pad.down(1, x, W);
    if (pad.side() !== 0) same = false;
    pad.move(1, x - 30); if (!(pad.side() < -0.5)) same = false;
    pad.move(1, x + 30); if (!(pad.side() > 0.5)) same = false;
  }
  check(same, 'posé n\'importe où : glisser à gauche va à gauche, à droite va à droite');
  pad.clear(); pad.down(1, 350, W); pad.move(1, 300);
  check(pad.side() < -0.9, 'pouce à droite qui glisse à gauche : tourne à gauche');
  pad.clear(); pad.down(1, 50, W); pad.move(1, 100);
  check(pad.side() > 0.9, 'pouce à gauche qui glisse à droite : tourne à droite');
  pad.clear(); pad.down(1, 50, W); pad.move(1, 300); pad.move(1, 240);
  check(pad.side() < -0.2, 'grand geste puis retour : la direction répond aussitôt');
  pad.clear(); pad.down(1, 200, W); pad.move(1, 203);
  check(pad.side() === 0, 'petit tremblement du pouce : rien');
  pad.clear(); pad.down(1, 50, W); pad.move(1, 110); pad.down(2, 350, W); pad.move(2, 300);
  check(pad.side() < -0.9, 'deux pouces : le dernier posé décide');
  pad.up(2); check(pad.side() > 0.9, 'on relâche le second : le premier reprend');
}
// Doigt levé, voiture de travers : l'aide la ramène sans attendre le mur
function assistBack() {
  const race = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3, diff: 'normal', sens: 1, assist: true });
  for (let i = 0; i < 60 * 5; i++) race.step(1 / 60, { steer: 0 });
  const c = race.player, t = race.track, road = () => Math.atan2(t.tz[c.idx], t.tx[c.idx]);
  Object.assign(c, { lat: 0, h: road() + 0.7, steer: 0 });
  const a = Math.abs(MB.angleDiff(road(), c.h));
  for (let k = 0; k < 30; k++) race.step(1 / 60, { steer: 0 });
  return a - Math.abs(MB.angleDiff(road(), c.h));
}
check(assistBack() > 0.45, `doigt levé de travers : ${assistBack().toFixed(2)} rad repris en 0,5 s`);
// Même sans Volant magique, la voiture de travers est reprise doigt levé
function backNoAssist() {
  const race = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3, diff: 'normal', sens: 1, assist: false });
  for (let i = 0; i < 60 * 5; i++) race.step(1 / 60, { steer: 0 });
  const c = race.player, t = race.track, road = () => Math.atan2(t.tz[c.idx], t.tx[c.idx]);
  Object.assign(c, { lat: 0, h: road() + 0.7, steer: 0 });
  const a = Math.abs(MB.angleDiff(road(), c.h));
  for (let k = 0; k < 30; k++) race.step(1 / 60, { steer: 0 });
  return a - Math.abs(MB.angleDiff(road(), c.h));
}
check(backNoAssist() > 0.3, `doigt levé de travers, sans Volant magique : ${backNoAssist().toFixed(2)} rad repris en 0,5 s`);
// Doigt à fond pour revenir sur une route droite : le braquage ne retombe pas tant que la voiture reste bien de travers
function fullWhenLate() {
  const race = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3, diff: 'normal', sens: 1, assist: false });
  for (let i = 0; i < 60 * 5; i++) race.step(1 / 60, { steer: 0 });
  const c = race.player, t = race.track, road = () => Math.atan2(t.tz[(c.idx + 9) % t.count], t.tx[(c.idx + 9) % t.count]);
  let low = 1; c.steer = 1;
  for (let k = 0; k < 20; k++) { Object.assign(c, { h: road() - 0.65, lat: 0 }); race.step(1 / 60, { steer: 1 }); low = Math.min(low, Math.abs(c.steer)); }
  return low;
}
check(fullWhenLate() > 0.95, 'doigt à fond et voiture de travers : braquage conservé');

// Mur : le journal montrait des chocs à 25-55° et des rebonds d'un bord à l'autre
function wallHit(fingerAway) {
  const race = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3, diff: 'normal', sens: 1.18 });
  for (let i = 0; i < 60 * 5; i++) race.step(1 / 60, { steer: 0 });
  const c = race.player, t = race.track; let i = 0, run = 0;
  for (let k = 0; k < t.count * 2 && run < 45; k++) { i = k % t.count; run = t.curv[i] < 0.004 ? run + 1 : 0; }
  i = (i - 40 + t.count) % t.count;
  const lat = t.width / 2 - 2, road = Math.atan2(t.tz[i], t.tx[i]);
  Object.assign(c, { x: t.px[i] - t.tz[i] * lat, z: t.pz[i] + t.tx[i] * lat, idx: i, lastIdx: i, lat, h: road + 0.8, v: c.spec.vmax, steer: 0, dk: 0 });
  const v0 = c.v; let minV = v0, maxOff = 0, touched = false;
  for (let k = 0; k < 90; k++) {
    race.step(1 / 60, { steer: touched && fingerAway ? -1 : 0 }); if (c.onWall) touched = true;
    minV = Math.min(minV, c.v);
    if (touched && !c.onWall) maxOff = Math.max(maxOff, Math.abs(MB.angleDiff(Math.atan2(t.tz[c.idx], t.tx[c.idx]), c.h)));
  }
  return { touched, kept: minV / v0, maxOff };
}
const w = wallHit(false), wb = wallHit(true);
check(w.touched && w.kept > 0.7, `choc à 45° : ${Math.round(w.kept * 100)} % de la vitesse gardée`);
check(wb.maxOff < 0.62, `doigt à l'opposé après le mur : cap limité à ${wb.maxOff.toFixed(2)} rad`);

console.log(fails ? `${fails} FAIL` : '0 FAIL');
process.exit(fails ? 1 : 0);
