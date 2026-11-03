// Journal de partie : course complète au bot, taille raisonnable, JSON valide, seuls les événements du joueur.
const fs = require('fs'), path = require('path');
const MB = require('../js/data.js');
const load = (f) => new Function('window', fs.readFileSync(path.join(__dirname, '../js', f), 'utf8'))({ MB });
load('track.js'); load('sim.js'); load('journal.js');
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };

const race = new MB.Race({ trackId: 'bol', carCount: 6, seed: 7, diff: 'normal', sens: 1 });
const j = new MB.Journal(race, { track: 'bol' });
for (let i = 0; i < 60 * 300 && !race.playerFinished; i++) {
  const ctl = MB.botInput(race);
  race.step(1 / 60, ctl); j.frame(i === 900 ? 0.2 : 1 / 60); j.graphics({ pr: 1.5, ombres: true, appels: 80, triangles: 50000 });
  if (j.wantSnap()) j.snap('data:image/jpeg;base64,AAAA', 'course');
  if (race.ticked) j.sample(ctl, { x: 0 });
  j.note(race.events); race.events.length = 0;
}
const text = JSON.stringify(j.end({ fin: 'arrivée' })), d = JSON.parse(text);
check(race.playerFinished, 'course terminée');
const gaps = d.rows.slice(1).map((r, i) => r[0] - d.rows[i][0]);
check(gaps.every((g) => g > 0.04 && g < 0.09), `une ligne toutes les 50 ms (max ${Math.max(...gaps).toFixed(3)} s)`);
check(d.rows[0].length === d.columns.length, 'colonnes alignées');
check(text.length < 400 * 1024, `taille ${Math.round(text.length / 1024)} Ko pour ${race.clock.toFixed(0)} s`);
check(d.events.some((e) => e.t === 'lap') && d.events.every((e) => e.t !== 'coin'), 'tours notés, pièces ignorées');
check(d.events.every((e) => e.car === undefined || e.car === race.player.id), 'seulement le joueur');
const g = d.graphique;
check(g.secondes.length > race.clock - 3 && g.secondes[0].length === g.colonnes.length, `une ligne graphique par seconde (${g.secondes.length})`);
check(g.images_lentes.length === 1 && g.images_lentes[0][1] === 200, 'image lente notée');
check(g.captures.length >= 4 && g.captures.length <= 8, `captures régulières (${g.captures.length})`);
process.exit(fails ? 1 : 0);
