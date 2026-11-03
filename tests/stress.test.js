// node tests/stress.test.js : beaucoup de graines, recherche de voitures bloquées.
const MB = require('../js/data.js');
const load = (f) => new Function('window', 'module', 'require', require('fs').readFileSync(require('path').join(__dirname, '../js', f), 'utf8'))({ MB }, undefined, require);
load('track.js'); load('sim.js');
let bad = 0, runs = 0, worst = 0;
for (const def of MB.TRACKS) for (const car of MB.CARS) for (const diff of Object.keys(MB.DIFFS)) for (let seed = 1; seed <= (+process.argv[2] || 40); seed++) {
  const r = new MB.Race({ trackId: def.id, carId: car.id, diff, seed: seed * 977 });
  let n = 0;
  while (r.state !== 'done' && n++ < 60 * 220) { r.step(1 / 60, MB.botInput(r)); r.events.length = 0; }
  runs++;
  if (r.state !== 'done') { bad++; if (bad < 6) console.log('BLOQUÉ', def.id, car.id, diff, seed * 977, 'prog', r.player.prog | 0, 'v', r.player.v.toFixed(1), 'spin', r.player.spin.toFixed(2), 'lat', r.player.lat.toFixed(1), 'idx', r.player.idx); } else worst = Math.max(worst, r.player.time);
}
console.log(`${runs} courses, ${bad} bloquées, pire temps ${worst.toFixed(1)} s`);
process.exit(bad ? 1 : 0);
