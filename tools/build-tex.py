#!/usr/bin/env python3
"""Photos de matières (Poly Haven, CC0) → js/tex/<nom>.js en base64.

file:// interdit de lire une image pour WebGL : chaque matière est un petit script
chargé à la demande (MB.TEX.<nom> = {d: couleur, n: relief, r: rugosité}).
Les originaux sont gardés dans tex-cache/ (hors git). Il faut ffmpeg.
"""
import base64, pathlib, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE, OUT = ROOT / 'tex-cache', ROOT / 'js' / 'tex'
URL = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{a}/{a}_{m}_1k.jpg'
# nom du jeu → (matière Poly Haven, cartes voulues, taille couleur, taille relief[, qualité JPEG imposée])
SETS = {
    'bois': ('wood_table_001', 'dnr', 1024, 512),
    'route': ('clean_asphalt', 'dnr', 1024, 1024, 2),      # grain très fin : ni réduction ni forte compression
    'sable': ('sand_01', 'dnr', 1024, 512),
    'neige': ('snow_02', 'dnr', 1024, 512),
    'mousse': ('leaves_forest_ground', 'dnr', 1024, 512),
    'plancher': ('wood_floor_worn', 'dnr', 1024, 512),
    'tapis': ('dirty_carpet', 'n', 0, 512),
}
MAPS = {'d': 'diff', 'n': 'nor_gl', 'r': 'rough'}


def fetch(asset, m):
    f = CACHE / f'{asset}_{m}.jpg'
    if not f.exists() or f.stat().st_size < 2000:
        req = urllib.request.Request(URL.format(a=asset, m=m), headers={'User-Agent': 'tex-build'})
        f.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return f


def shrink(src, size, q, gray):
    vf = f'scale={size}:{size}:flags=lanczos' + (',format=gray' if gray else '')
    return subprocess.run(['ffmpeg', '-v', 'error', '-i', str(src), '-vf', vf, '-q:v', str(q), '-f', 'mjpeg', '-'], check=True, capture_output=True).stdout


def main():
    CACHE.mkdir(exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, (asset, maps, sd, sn, *fq) in SETS.items():
        parts = []
        for k in maps:
            jpg = shrink(fetch(asset, MAPS[k]), sd if k == 'd' else sn, fq[0] if fq else 5 if k == 'd' else 4 if k == 'n' else 7, k == 'r')
            parts.append(f"{k}:'data:image/jpeg;base64,{base64.b64encode(jpg).decode()}'")
        js = f"/* {asset} — Poly Haven, CC0 */(window.MB=window.MB||{{}}).TEX=MB.TEX||{{}};MB.TEX.{name}={{{','.join(parts)}}};\n"
        (OUT / f'{name}.js').write_text(js)
        total += len(js)
        print(f'{name:9s} {asset:22s} {len(js) // 1024:5d} Ko')
    print(f'total {total // 1024} Ko')


if __name__ == '__main__':
    sys.exit(main())
