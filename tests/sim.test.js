// node tests/sim.test.js : vérifie que chaque circuit est valide et se finit dans la durée visée.
const MB = require('../js/data.js');

const load = (f) => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js', f), 'utf8');
  new Function('window', 'module', 'require', src)({ MB }, undefined, require);
};
load('track.js'); load('sim.js');

let failed = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) failed++; };

for (const def of MB.TRACKS) {
  const t = MB.buildTrack(def);
  let minGap = Infinity, maxCurv = 0;
  for (let i = 0; i < t.count; i += 2) {
    maxCurv = Math.max(maxCurv, t.curv[i]);
    for (let j = i + 40; j < t.count - 40 + i && j < t.count; j += 2) {
      const d = Math.hypot(t.px[i] - t.px[j], t.pz[i] - t.pz[j]);
      if (d < minGap) minGap = d;
    }
  }
  check(minGap > t.width + 6, `${def.id}: écart entre tronçons ${minGap.toFixed(1)} (largeur ${t.width})`);
  check(maxCurv < 0.105, `${def.id}: rayon mini ${(1 / maxCurv).toFixed(1)}`);

  for (const p of t.shortcuts) {
    let clear = Infinity, sum = 0;
    for (let q = Math.round(p.count * 0.3); q < p.count * 0.7; q++) for (let i = 0; i < t.count; i += 2) clear = Math.min(clear, Math.hypot(p.px[q] - t.px[i], p.pz[q] - t.pz[i]));
    const main = (p.b - p.a) * t.ds;
    check(clear > t.width / 2 + p.width / 2 && p.length < main * 0.9 && p.win >= 4, `${def.id}: raccourci ${p.length.toFixed(0)} m contre ${main} m, écart ${clear.toFixed(1)}, entrée ${p.win}`);
    // Le raccourci (son axe et ses bordures) ne doit croiser aucun mur affiché du circuit : sinon on le traverse.
    const cut = (A, B, C, D) => { const sd = (P, Q, R) => (Q[0] - P[0]) * (R[1] - P[1]) - (Q[1] - P[1]) * (R[0] - P[0]); return sd(A, B, C) * sd(A, B, D) < 0 && sd(C, D, A) * sd(C, D, B) < 0; };
    const line = (path, off, skip) => { const out = []; for (let i = 0; i < (path.open ? path.count - 1 : path.count); i++) { const j = (i + 1) % path.count; if (skip && (skip[i] || skip[j])) continue; out.push([[path.px[i] - path.tz[i] * off, path.pz[i] + path.tx[i] * off], [path.px[j] - path.tz[j] * off, path.pz[j] + path.tx[j] * off]]); } return out; };
    const mainWalls = [...line(t, -(t.width / 2 + 1.5), t.wallGap[-1]), ...line(t, t.width / 2 + 1.5, t.wallGap[1])];
    const branch = [...line(p, 0), ...line(p, -(p.width / 2 + 1), p.wallHole[-1]), ...line(p, p.width / 2 + 1, p.wallHole[1])];
    let hits = 0;
    for (const [A, B] of mainWalls) for (const [C, D] of branch) if (cut(A, B, C, D)) hits++;
    check(hits === 0, `${def.id}: le raccourci ne traverse aucun mur du circuit (${hits} croisements)`);
    // La dalle turbo reste sur la partie propre au raccourci : elle ne déborde pas sur la route normale.
    let over = 0;
    for (let q = p.pad; q <= p.padEnd; q++) for (const off of [-(p.width / 2 - 1), p.width / 2 - 1]) {
      const x = p.px[q] - p.tz[q] * off, z = p.pz[q] + p.tx[q] * off;
      for (let i = 0; i < t.count; i++) if (Math.hypot(x - t.px[i], z - t.pz[i]) < t.width / 2) { over++; break; }
    }
    check(over === 0, `${def.id}: dalle turbo hors du circuit normal (${over} point(s) dessus)`);
    let taken = 0, pads = 0, res = 0, gain = 0, natural = false;                          // sur plusieurs courses : une seule dépend trop du trafic
    for (const seed of [7, 131, 262, 393, 524]) {
      const fast = new MB.Race({ trackId: def.id, carId: 'bolide', diff: 'facile', seed }), slow = new MB.Race({ trackId: def.id, carId: 'bolide', diff: 'facile', seed });
      let n = 0;
      while (fast.state !== 'done' && n++ < 60 * 400) { fast.step(1 / 60, MB.botInput(fast, { shortcut: true })); for (const e of fast.events) { if (e.t === 'shortcut') taken++; if (e.t === 'pad') pads++; if (e.t === 'rescue' && e.car === fast.player.id) res++; } fast.events.length = 0; }
      n = 0;
      while (slow.state !== 'done' && n++ < 60 * 400) { slow.step(1 / 60, MB.botInput(slow)); if (slow.events.some((e) => e.t === 'shortcut')) natural = true; slow.events.length = 0; }
      gain += slow.player.time - fast.player.time;
    }
    check(pads === taken, `${def.id}: dalle turbo déclenchée à chaque passage (${pads}/${taken})`);
    check(taken >= 8 && res === 0 && gain > 0 && gain / 5 < 8, `${def.id}: raccourci pris ${taken}/15, ${res} remise(s), gain moyen ${(gain / 5).toFixed(1)} s`);
    // Il faut longer le bord pour entrer : la trajectoire normale ne s'y engage jamais par hasard.
    check(!natural, `${def.id}: la trajectoire normale reste sur le circuit`);
    // Des rivaux l'empruntent aussi (en Normal, sur quelques courses).
    let rivals = 0, plots = 0;
    for (const seed of [11, 22, 33, 44]) {
      const r = new MB.Race({ trackId: def.id, carId: 'bolide', diff: 'normal', seed });
      let n = 0;
      while (r.state !== 'done' && n++ < 60 * 400) { r.step(1 / 60, MB.botInput(r)); rivals += r.events.filter((e) => e.t === 'rivalShortcut').length; plots += r.events.filter((e) => e.t === 'plot').length; r.events.length = 0; }
    }
    check(rivals >= 2, `${def.id}: raccourci pris ${rivals} fois par les rivaux sur 4 courses`);
    // Le péril : deux plots en slalom ; les rivaux s'y font parfois piéger, sans y rester coincés.
    check(p.obst.length === 2 && plots >= 1 && plots <= rivals, `${def.id}: plots touchés ${plots} fois par les rivaux pour ${rivals} passages`);
  }
  if (t.jumps.length) {
    const r = new MB.Race({ trackId: def.id, carId: 'bolide', diff: 'facile', seed: 7 });
    let n = 0, jumps = 0, lands = 0;
    while (r.state !== 'done' && n++ < 60 * 400) { r.step(1 / 60, MB.botInput(r)); for (const e of r.events) { if (e.t === 'jump') jumps++; if (e.t === 'land') lands++; } r.events.length = 0; }
    check(jumps >= t.jumps.length && lands === jumps, `${def.id}: ${jumps} sauts, ${lands} atterrissages`);
  }
  const run = (label, inputFn, diff, carId) => {
    const r = new MB.Race({ trackId: def.id, carId, diff, seed: 7 });
    let n = 0;
    while (r.state !== 'done' && n++ < 60 * 400) { r.step(1 / 60, inputFn(r)); r.events.length = 0; }
    const p = r.player, pos = r.position(p);
    console.log(`     ${def.id} ${label}/${diff}/${carId}: ${r.state} t=${p.time.toFixed(1)}s pos=${pos} pièces=${r.coinCount} tour=${(r.bestLap || 0).toFixed(1)}`);
    return { r, p, pos };
  };
  for (const diff of ['facile', 'normal', 'expert']) {
    const a = run('bot', MB.botInput, diff, 'bolide');
    check(a.r.state === 'done', `${def.id}/${diff}: course terminée`);
    if (diff === 'facile') check(a.pos <= 2, `${def.id}: un bon pilote gagne en facile`);
    if (diff === 'facile') check(a.p.time > 55 && a.p.time < 100, `${def.id}: durée ${a.p.time.toFixed(1)} s`);
  }
  const idle = run('sans-doigt', () => ({ steer: 0 }), 'facile', 'bolide');
  check(idle.r.state === 'done', `${def.id}: finit même sans toucher (mur + assistance)`);
  // Doigt qui reste posé : ne doit jamais partir en tête-à-queue.
  const holdRun = (label, fn) => {
    const r = new MB.Race({ trackId: def.id, carId: 'bolide', diff: 'facile', seed: 7 });
    let n = 0, rescues = 0, worst = 0;
    while (r.state !== 'done' && n++ < 60 * 400) {
      r.step(1 / 60, fn(r, n));
      for (const e of r.events) if (e.t === 'rescue' && e.car === r.player.id) rescues++;
      r.events.length = 0;
      const p = r.player;
      if (r.state === 'run' && !p.finished) worst = Math.max(worst, Math.abs(MB.angleDiff(r._dirAt(p, 0), p.h)));
    }
    check(r.state === 'done' && rescues === 0 && worst < 1.7, `${def.id}: ${label} : ${rescues} remise(s) en piste, écart max ${worst.toFixed(2)} rad, ${r.player.time.toFixed(0)} s`);
  };
  holdRun('doigt bloqué à droite', () => ({ steer: 1 }));
  holdRun('doigt bloqué à gauche', () => ({ steer: -1 }));
  holdRun('longs appuis alternés', (r, n) => ({ steer: Math.floor(n / 110) % 2 ? 1 : -1 }));
  for (const c of MB.CARS) run('bot', MB.botInput, 'normal', c.id);
}
// Variante « sens inverse » : chaque circuit reste valide, ses raccourcis ne traversent aucun mur et la course se termine.
for (const d0 of MB.TRACKS) {
  const def = MB.reverseDef(d0), t = MB.buildTrack(def);
  const cut = (A, B, C, D) => { const sd = (P, Q, R) => (Q[0] - P[0]) * (R[1] - P[1]) - (Q[1] - P[1]) * (R[0] - P[0]); return sd(A, B, C) * sd(A, B, D) < 0 && sd(C, D, A) * sd(C, D, B) < 0; };
  const line = (path, off, skip) => { const out = []; for (let i = 0; i < (path.open ? path.count - 1 : path.count); i++) { const j = (i + 1) % path.count; if (skip && (skip[i] || skip[j])) continue; out.push([[path.px[i] - path.tz[i] * off, path.pz[i] + path.tx[i] * off], [path.px[j] - path.tz[j] * off, path.pz[j] + path.tx[j] * off]]); } return out; };
  let hits = 0;
  for (const p of t.shortcuts) { const mw = [...line(t, -(t.width / 2 + 1.5), t.wallGap[-1]), ...line(t, t.width / 2 + 1.5, t.wallGap[1])], br = [...line(p, 0), ...line(p, -(p.width / 2 + 1), p.wallHole[-1]), ...line(p, p.width / 2 + 1, p.wallHole[1])]; for (const [A, B] of mw) for (const [C, D] of br) if (cut(A, B, C, D)) hits++; }
  const r = new MB.Race({ trackId: d0.id, def, track: t, carSpec: MB.CARS[0], power: 1, sens: 1, diff: 'normal', assist: false, seed: 5 });
  for (let i = 0; i < 60 * 150 && r.state !== 'done'; i++) r.step(1 / 60, MB.botInput(r));
  check(hits === 0 && r.state === 'done', `${d0.id} en sens inverse : ${hits} croisement(s), course ${r.state === 'done' ? 'finie en ' + r.player.time.toFixed(1) + ' s' : 'non finie'}`);
}
check(MB.starsFor(1, 25) === 3 && MB.starsFor(1, 5) === 2 && MB.starsFor(3, 30) === 1 && MB.starsFor(4, 30) === 0, 'étoiles');
check(MB.nextStreak('2026-12-31', '2027-01-01', 3) === 4 && MB.nextStreak('2026-10-01', '2026-10-05', 5) === 1 && MB.nextStreak(null, '2026-10-05', 0) === 1 && MB.nextStreak('2026-10-04', '2026-10-05', 7) === 1, 'série quotidienne');
const ids = MB.TRACKS.map((d) => d.id), seen = new Set();
for (let d = 1; d <= 28; d++) { const k = `2026-11-${String(d).padStart(2, '0')}`, c = MB.dailyChallenge(k, ids); seen.add(c.kind + c.track); check(ids.includes(c.track) && c.text.fr && JSON.stringify(c) === JSON.stringify(MB.dailyChallenge(k, ids)), `défi ${k}: ${c.text.fr} sur ${c.track}`); }
check(seen.size > 8, `défis variés (${seen.size})`);
check(MB.CUPS.every((c) => c.tracks.every((id) => ids.includes(id))) && MB.CUPS.every((c, i) => !i || c.stars > MB.CUPS[i - 1].stars), 'coupes cohérentes');
// v0.8 : le meilleur rival revient sur un joueur en tête, l'aimant ne tombe plus sur le leader, les turbos sont à portée d'un virage
{
  const r = new MB.Race({ trackId: 'bol', carCount: 6, seed: 3, diff: 'expert' });
  for (let i = 0; i < 60 * 6; i++) r.step(1 / 60, MB.botInput(r));
  r.player.prog = Math.max(...r.cars.map((c) => c.prog)) + 200;
  const best = r.ranked.find((c) => !c.isPlayer), other = r.ranked.filter((c) => !c.isPlayer)[1];
  const limits = (c) => { const d = r.diff.duel, on = r._ai(c).limit; r.diff = { ...r.diff, duel: 0 }; const off = r._ai(c).limit; r.diff = { ...r.diff, duel: d }; return [on, off]; };
  const [on, off] = limits(best), [on2, off2] = limits(other);
  console.log(`     meilleur rival ${off.toFixed(1)} -> ${on.toFixed(1)}`);
  check(on > off, 'le meilleur rival accélère quand le joueur s\'échappe');
  check(on2 === off2, 'les autres rivaux gardent leur allure');
}
check(MB.ITEM_ODDS.aimant[0] === 0, 'pas d\'aimant pour la tête de course');
check(MB.DRIFT.L1 < 0.5 && MB.DRIFT.L2 <= 1, 'turbos atteignables dans un virage');
// Nouveaux bonus : ressort au-dessus du miel, pneus collants sans perte en virage, tirelire qui double les pièces
{
  const r = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3 }), p = r.player;
  for (let i = 0; i < 60 * 5; i++) r.step(1 / 60, { steer: 0 });
  p.item = 'ressort'; r.step(1 / 60, { steer: 0, item: true });
  check(p.y > 0 && p.item === null, 'le ressort fait sauter');
  for (let i = 0; i < 12; i++) r.step(1 / 60, { steer: 0 });
  r.syrups.push({ x: p.x + Math.cos(p.h) * 1.5, z: p.z + Math.sin(p.h) * 1.5, life: 18, owner: 0 });
  r.step(1 / 60, { steer: 0 });
  check(p.y >= 0.6 && p.spin === 0 && r.syrups.length === 1, 'en l\'air, le miel ne colle pas');
  p.item = 'ressort'; r.step(1 / 60, { steer: 0, item: true });
  check(p.item === 'ressort', 'le ressort attend qu\'on soit au sol');
  p.item = null; r.syrups.length = 0;
  for (let i = 0; i < 90; i++) r.step(1 / 60, { steer: 0 });
  check(p.y === 0, 'retour au sol');

  const speed = (sticky) => {
    const q = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3, assist: false }), c = q.player;
    for (let i = 0; i < 60 * 5; i++) q.step(1 / 60, MB.botInput(q));
    let low = 99; c.sticky = sticky ? 99 : 0; c.dk = 0;
    for (let i = 0; i < 60; i++) { c.steer = 1; q.step(1 / 60, { steer: 0 }); low = Math.min(low, c.v); c.h = Math.atan2(q.track.tz[c.idx], q.track.tx[c.idx]); }
    return low;
  };
  check(speed(true) > speed(false), `pneus collants : ${speed(true).toFixed(1)} au lieu de ${speed(false).toFixed(1)} en braquant`);

  const q = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3 }), c = q.player;
  c.piggy = 8; q.coins[0].x = c.x; q.coins[0].z = c.z; q._pick();
  check(q.coinCount === 2, 'la tirelire compte double');
  const rolled = new Set(); const rv = q.cars.find((o) => !o.isPlayer); for (let i = 0; i < 400; i++) rolled.add(q._rollItem(rv));
  check(!rolled.has('tirelire') && !rolled.has('sirop'), 'pas de tirelire pour les rivaux, pas de miel au premier tour');

  const w = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3 });
  for (const k of w.coins) k.taken = true;
  for (let i = 0; i < 60 * 150 && w.lap(w.player) < 2; i++) w.step(1 / 60, MB.botInput(w));
  const back = w.coins.filter((k) => !k.taken).length;
  check(back === 15, `pièces revenues au 2e tour : ${back}`);
}
{
  // Coincé entre un rival qui serre et le mur : le joueur reste au bord, sans être enfoncé puis renvoyé à chaque pas.
  const w = new MB.Race({ trackId: 'bol', carCount: 2, seed: 3 }), t = w.track, p = w.player, r = w.cars[1];
  while (w.state !== 'run') w._tick({ steer: 0 });
  const i0 = (p.idx + 30) % t.count, lim = t.width / 2 - 2.3 * 0.6;
  const put = (c, lat) => { c.x = t.px[i0] - t.tz[i0] * lat; c.z = t.pz[i0] + t.tx[i0] * lat; c.h = Math.atan2(t.tz[i0], t.tx[i0]); c.idx = c.lastIdx = i0; c.lat = lat; c.v = 30; };
  put(p, lim); put(r, lim - 3.5);
  const ai = w._ai.bind(w);
  w._ai = (c) => Object.assign(ai(c), { steer: Math.max(-1, Math.min(1, Math.atan2(Math.sin(Math.atan2(p.z - c.z, p.x - c.x) - c.h), Math.cos(Math.atan2(p.z - c.z, p.x - c.x) - c.h)) * 3)) });
  let over = 0;
  for (let k = 0; k < 40; k++) { w._tick({ steer: 0.3 }); over = Math.max(over, Math.abs(MB.projectTrack(t, p.x, p.z, p.idx).lat) - lim); }
  check(over < 0.05, `coincé contre le mur par un rival : enfoncé de ${Math.max(0, over).toFixed(2)} m au plus`);
}
{
  // Missions du jour : trois types différents, une par palier, stables pour la journée, sans raccourci s'il n'y en a pas.
  let ok = true, noSc = true, kinds = new Set();
  for (let d = 1; d <= 60; d++) {
    const key = `2026-12-${String((d % 28) + 1).padStart(2, '0')}`, a = MB.dailyMissions(key, true), b = MB.dailyMissions(key, true);
    if (new Set(a.map((m) => m.def.kind)).size !== 3 || a.map((m) => m.def.kind + m.n).join() !== b.map((m) => m.def.kind + m.n).join() || a.some((m, i) => m.coins !== MB.MISSION_COINS[i])) ok = false;
    if (MB.dailyMissions(key, false).some((m) => m.def.kind === 'sc')) noSc = false;
    a.forEach((m) => kinds.add(m.def.kind));
  }
  check(ok && noSc && kinds.size >= 7, `missions du jour : 3 types distincts et stables, ${kinds.size} types tirés, pas de raccourci sans circuit à raccourci`);
  check(/^Fais 1 super turbo$/.test(MB.missionText({ def: MB.MISSIONS.find((m) => m.kind === 'l2'), n: 1 }, 'fr')), 'mission au singulier sans « s »');
}
{
  // Jouets cachés : au moins 4 cachettes par circuit (aussi en sens inverse), toujours au bord de la route ou dans un raccourci,
  // jamais au milieu ; on ramasse un jouet en passant dessus, une seule fois ; 33 jouets, sortis au rythme prévu.
  let bad = [], few = [];
  for (const def of MB.TRACKS) for (const d of [def, MB.reverseDef(def)]) {
    const t = MB.buildTrack(d);
    if (t.toySpots.length < 4) few.push(def.id);
    for (const sp of t.toySpots) { const dist = MB.trackDistance(t, sp.x, sp.z); if (sp.kind === 'raccourci' ? dist > 3 : dist < t.width / 2 - 3 || dist > t.width / 2 - 0.5) bad.push(`${def.id}:${sp.kind}:${dist.toFixed(1)}`); }
  }
  check(!bad.length && !few.length, `cachettes de jouets au bord de la route${bad.length ? ' : ' + bad.join(' ') : ''}${few.length ? ', trop peu : ' + few.join(' ') : ''}`);
  const w = new MB.Race({ trackId: 'bol', carCount: 1, solo: true, seed: 2, toys: [{ id: 'canard', x: 0, z: 0 }, { id: 'de', x: 1e4, z: 0, dup: true }] }), t = w.track, p = w.player;
  while (w.state !== 'run') w._tick({ steer: 0 });
  const i = (p.idx + 40) % t.count; w.toys[0].x = t.px[i] - t.tz[i] * p.lat; w.toys[0].z = t.pz[i] + t.tx[i] * p.lat;
  let n = 0;
  for (let k = 0; k < 300; k++) { w._tick({ steer: 0 }); n += w.events.filter((e) => e.t === 'toy' && e.id === 'canard').length; w.events.length = 0; }
  check(w.toys[0].taken && n === 1 && !w.toys[1].taken && new MB.Race({ trackId: 'bol', carCount: 1, solo: true }).toys.length === 0, `jouet ramassé une seule fois en roulant dessus (${n}), l'autre laissé en place`);
  const r = (d) => MB.toysReleased('2026-11-01', d);
  check(MB.TOYS.length === 33 && new Set(MB.TOYS.map((y) => y.id)).size === 33 && r('2026-11-01') === 3 && r('2026-11-02') === 3 && r('2026-11-03') === 4 && r('2027-06-01') === 33, `33 jouets, sortie : ${r('2026-11-01')} puis ${r('2026-11-03')} au 3e jour`);
}
{
  // Paliers des trophées : bronze au déblocage, argent puis or quand le total grandit.
  const tr = MB.TROPHIES.find((x) => x.id === 'win'), s = { troph: { win: 1 }, tot: { wins: 1 }, stars: {} };
  const a = MB.trophyTier(tr, s); s.tot.wins = 12; const b = MB.trophyTier(tr, s); s.tot.wins = 60; const c = MB.trophyTier(tr, s);
  check(a === 1 && b === 2 && c === 3 && MB.trophyTier(tr, { troph: {}, tot: { wins: 99 } }) === 0, `paliers : ${a} ${b} ${c}`);
}
process.exit(failed ? 1 : 0);
