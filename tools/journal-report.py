#!/usr/bin/env python3
"""Résume un journal : python3 tools/journal-report.py [fichier], le dernier reçu par défaut."""
import json, pathlib, sys

DIR = pathlib.Path(__file__).resolve().parent.parent / 'journaux'
path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else max(DIR.glob('*.json'))
d = json.loads(path.read_text(encoding='utf-8'))
m, rows, ev = d['meta'], d['rows'], d['events']
T, IN, V, FL = 0, 1, 6, 10
print(path.name, '|', m.get('track'), m.get('car'), m.get('diff'), 'sens', m.get('sens'), 'zones' if m.get('zones') else 'glissement', '| version', m.get('version'))
print('issue :', d['outcome'], '|', d['fps'], 'i/s, pire image', d['pire_image_ms'], 'ms |', len(rows), 'lignes')
run = [r for r in rows if r[T] >= 0]
if run:
    held = sum(1 for r in run if r[FL] & 64) / len(run)
    print(f"vitesse moyenne {sum(r[V] for r in run) / len(run):.1f} | doigt posé {held:.0%} | doigt à fond {sum(1 for r in run if abs(r[IN]) > .95) / len(run):.0%} | drift {sum(1 for r in run if r[FL] & 1) / len(run):.0%}")
    flips = sum(1 for a, b in zip(run, run[1:]) if a[IN] * b[IN] < 0 and abs(a[IN] - b[IN]) > .6)
    print('changements de sens francs :', flips, f'({flips / max(run[-1][T] / 60, .01):.0f} par minute)')
count = {}
for e in ev:
    count[e['t']] = count.get(e['t'], 0) + 1
print('événements :', count)
for e in ev:
    if e['t'] in ('wall', 'spin', 'rescue'):
        before = [r for r in run if e['at'] - 1.5 <= r[T] <= e['at']]
        print(f"  {e['at']:6.1f} s {e['t']:6} v={e['v']:.0f} doigt:", ' '.join(f"{r[IN]:+.1f}" for r in before[::5]))
if d.get('meta', {}).get('chargement_ms') is not None:
    print('chargement du circuit :', d['meta']['chargement_ms'], 'ms')
if d.get('audio'):
    print('audio :', d['audio'])
g = d.get('graphique')
if g:
    print('graphique :', g.get('gpu'))
    sec = g.get('secondes') or []
    if sec:
        fps = [r[1] for r in sec]
        low = [r for r in sec if r[1] < 45]
        print(f"  images/s mini {min(fps)}, médiane {sorted(fps)[len(fps) // 2]} | secondes sous 45 i/s : {len(low)}/{len(sec)}", ''.join(f' {r[0]}s:{r[1]}' for r in low[:12]))
        if sec and len(sec[0]) > 8:
            calc = sorted(r[7] for r in sec); draw = sorted(r[8] for r in sec)
            print(f"  temps par image : calcul médian {calc[len(calc) // 2]} ms (max {calc[-1]}), dessin médian {draw[len(draw) // 2]} ms (max {draw[-1]})")
        print(f"  résolution {sec[0][3]} -> {sec[-1][3]} | ombres {'oui' if sec[0][4] else 'non'} -> {'oui' if sec[-1][4] else 'non'} | appels de dessin max {max(r[5] for r in sec)} | triangles max {max(r[6] for r in sec)}")
    slow = g.get('images_lentes') or []
    print(f"  images lentes (>50 ms) : {len(slow)}", ' '.join(f'{t}s:{ms}ms' for t, ms in sorted(slow, key=lambda x: -x[1])[:10]))
    for e in g.get('erreurs') or []:
        print(f"  ERREUR {e['at']} s : {e['texte']}")
    for c in g.get('captures') or []:
        img = c.get('img', '')
        print(f"  capture {c['at']:6.1f} s {c.get('quoi')} : {DIR / img if not img.startswith('data:') else '(non extraite)'}")
