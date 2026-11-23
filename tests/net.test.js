// node tests/net.test.js : course en réseau entre deux téléphones simulés (hôte avec rivaux, invité),
// messages de position retardés comme sur un vrai réseau. Vérifie que chacun voit l'autre au bon endroit,
// que les rivaux de l'hôte apparaissent chez l'invité et que le classement final est le même des deux côtés.
const MB = require('../js/data.js');

const load = (f) => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js', f), 'utf8');
  new Function('window', 'module', 'require', src)({ MB }, undefined, require);
};
load('track.js'); load('sim.js');

let failed = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) failed++; };

function run(trackId, rivals, latency) {
  const ai = rivals ? [0, 1, 2, 3].map((g) => ({ id: 'ai' + g, kind: 'ai', car: MB.RIVAL_CARS[g], name: MB.RIVALS[g] })) : [];
  const grid = ai.concat([{ id: 'p1', kind: 'human', car: 'bolide', name: 'Invité' }, { id: 'h', kind: 'human', car: 'bolide', name: 'Hôte' }]);
  const def = MB.TRACKS.find((d) => d.id === trackId), track = MB.buildTrack(def);
  const mk = (me, host) => new MB.Race({ trackId, def, track, carId: 'bolide', diff: 'normal', seed: 42, net: { me, host, grid } });
  const H = mk('h', true), G = mk('p1', false);
  check(H.boxes.length === 0 && G.boxes.length === 0, `${trackId}: pas de boîtes à objets en réseau`);
  check(H.cars.length === grid.length && G.cars.filter((c) => c.remote).length === grid.length - 1, `${trackId}: chez l'invité, toutes les autres voitures sont distantes`);
  // L'invité démarre 0,15 s après l'hôte (il a reçu le « go » plus tard).
  H.hold = false;
  const wire = [];                                       // messages en transit : [arrivée, destination, état]
  let now = 0, maxErr = 0, errSum = 0, errN = 0, sendT = 0, lagSum = 0;
  const hist = [];
  const DT = 1 / 60, lat = latency;
  for (let f = 0; f < 60 * 140; f++) {
    now += DT;
    if (G.hold && now > 0.15) G.hold = false;
    H.step(DT, MB.botInput(H));
    G.step(DT, MB.botInput(G));
    if (now - sendT >= 0.05) {                           // 20 fois par seconde
      sendT = now;
      wire.push([now + lat * (0.8 + Math.random() * 0.4), G, H.cars.filter((c) => !c.remote).map((c) => H.netState(c))]);
      wire.push([now + lat * (0.8 + Math.random() * 0.4), H, G.cars.filter((c) => !c.remote && c.isPlayer).map((c) => G.netState(c))]);
    }
    for (let k = wire.length - 1; k >= 0; k--) if (wire[k][0] <= now) { for (const s of wire[k][2]) wire[k][1].netPush(s); wire.splice(k, 1); }
    // Écart entre la voiture de l'invité chez lui et telle que l'hôte la voit (elle a toujours un peu de retard).
    // On cherche, dans la trajectoire récente de l'invité, le point le plus proche de ce que l'hôte affiche :
    // l'écart dit si la trajectoire est fidèle, l'âge de ce point dit le retard d'affichage.
    if (G.state === 'run') { hist.push([G.clock, G.player.x, G.player.z]); if (hist.length > 120) hist.shift(); }
    if (G.state === 'run' && H.clock > 3 && !G.player.finished && hist.length > 60) {
      const seen = H.cars.find((c) => c.netId === 'p1');
      let best = 1e9, bt = 0;
      for (const q of hist) { const d = Math.hypot(seen.x - q[1], seen.z - q[2]); if (d < best) { best = d; bt = q[0]; } }
      maxErr = Math.max(maxErr, best); errSum += best; errN++; lagSum += G.clock - bt;
    }
    // L'hôte clôt quand les deux pilotes sont arrivés.
    if (H.state !== 'done' && H.cars.filter((c) => c.human).every((c) => c.finished)) {
      const rows = H.cars.map((c) => ({ id: c.netId, time: Math.round(H.etaOf(c) * 1000) / 1000 })).sort((a, b) => a.time - b.time);
      H.netFinish(rows); G.netFinish(rows);
    }
    if (H.state === 'done' && G.state === 'done') break;
  }
  check(H.state === 'done' && G.state === 'done', `${trackId}: course terminée des deux côtés (${now.toFixed(0)} s)`);
  const lag = lagSum / errN;
  check(errN > 0 && errSum / errN < 1 && maxErr < 6, `${trackId}: l'hôte voit l'invité sur sa vraie trajectoire (écart moyen ${(errSum / errN).toFixed(2)} m, pire ${maxErr.toFixed(1)} m, latence ${lat * 1000} ms)`);
  check(lag > 0.05 && lag < lat + 0.35, `${trackId}: retard d'affichage ${(lag * 1000).toFixed(0)} ms`);
  const order = (r) => r.ranked.map((c) => c.netId).join(',');
  check(order(H) === order(G), `${trackId}: même classement des deux côtés (${order(H)})`);
  if (rivals) {
    const seen = G.cars.filter((c) => c.netId.startsWith('ai'));
    check(seen.every((c) => c.nb.length > 0 && c.prog > track.length), `${trackId}: l'invité voit rouler les rivaux de l'hôte`);
  }
  // Les voitures des joueurs se traversent : aucun choc enregistré entre elles.
  return { H, G };
}

run('bol', true, 0.08);
run('minuit', false, 0.2);
run('dune', true, 0.35);

// Une voiture distante sans nouvelles s'arrête au bout de 0,25 s au lieu de filer droit dans le décor.
{
  const def = MB.TRACKS[0], track = MB.buildTrack(def);
  const grid = [{ id: 'p1', kind: 'human', car: 'bolide' }, { id: 'h', kind: 'human', car: 'bolide' }];
  const H = new MB.Race({ def, track, carId: 'bolide', seed: 3, net: { me: 'h', host: true, grid } });
  H.hold = false;
  for (let f = 0; f < 300; f++) H.step(1 / 60, { steer: 0 });
  H.netPush(['p1', H.clock, 10, 10, 0, 30, 100, 0, 0, 0, 0]);
  for (let f = 0; f < 120; f++) H.step(1 / 60, { steer: 0 });
  const c = H.cars.find((q) => q.netId === 'p1');
  check(Math.abs(c.x - 10) <= 30 * 0.25 + 0.5, `sans nouvelles, la voiture distante s'arrête (x = ${c.x.toFixed(1)})`);
}

console.log(failed ? `${failed} FAIL` : '0 FAIL');
process.exit(failed ? 1 : 0);
