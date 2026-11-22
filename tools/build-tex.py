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
    'bois': ('oak_veneer_01', 'dnr', 1024, 512),
    'route': ('clean_asphalt', 'dnr', 1024, 1024, 2),      # grain très fin : ni réduction ni forte compression
    'sable': ('sand_01', 'dnr', 1024, 512),
    'neige': ('snow_02', 'dnr', 1024, 512),
    'mousse': ('leaves_forest_ground', 'dnr', 1024, 512),
    'plancher': ('wood_floor_worn', 'dnr', 1024, 512),
    'tapis': ('dirty_carpet', 'n', 0, 512),
}
MAPS = {'d': 'diff', 'n': 'nor_gl', 'r': 'rough'}
# Fonds : panoramas 360° (HDRI Poly Haven en JPEG), moitié haute seulement, floutés comme l'arrière-plan d'une photo de maquette.
PANO_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/{a}.jpg'
PANOS = {
    'cuisine': 'studio_country_hall', 'plage': 'spiaggia_di_mondello', 'neige': 'snowy_forest_path_01', 'foret': 'forest_slope',
    'ville': 'shanghai_bund', 'chambre': 'relax_inn_seaview_suite', 'bain': 'bathroom', 'grenier': 'industrial_wooden_attic',
}
PW, PH, KEEP = 2048, 1024, 0.62      # on garde du zénith jusqu'à 22° sous l'horizon


def fetch(asset, m):
    f = CACHE / f'{asset}_{m}.jpg'
    if not f.exists() or f.stat().st_size < 2000:
        req = urllib.request.Request(URL.format(a=asset, m=m), headers={'User-Agent': 'tex-build'})
        f.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return f


def shrink(src, size, q, gray):
    vf = f'scale={size}:{size}:flags=lanczos' + (',format=gray' if gray else '')
    return subprocess.run(['ffmpeg', '-v', 'error', '-i', str(src), '-vf', vf, '-q:v', str(q), '-f', 'mjpeg', '-'], check=True, capture_output=True).stdout


def pano(name, asset):
    f = CACHE / f'pano_{asset}.jpg'
    if not f.exists() or f.stat().st_size < 2000:
        req = urllib.request.Request(PANO_URL.format(a=asset), headers={'User-Agent': 'tex-build'})
        f.write_bytes(urllib.request.urlopen(req, timeout=300).read())
    h = int(PH * KEEP) // 2 * 2
    vf = f'scale={PW}:{PH}:flags=lanczos,crop={PW}:{h}:0:0,gblur=sigma=2.2'
    jpg = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-vf', vf, '-q:v', '4', '-f', 'mjpeg', '-'], check=True, capture_output=True).stdout
    # Couleur moyenne juste sous l'horizon (le sol réel du lieu) : le brouillard du jeu la reprend pour fondre le sol dans la photo.
    band = f'scale={PW}:{PH},crop={PW}:{PH // 24}:0:{PH // 2 + PH // 100},scale=1:1:flags=area'
    rgb = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-vf', band, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], check=True, capture_output=True).stdout
    js = f"/* {asset} — Poly Haven, CC0 */(window.MB=window.MB||{{}}).TEX=MB.TEX||{{}};MB.TEX.pano_{name}={{d:'data:image/jpeg;base64,{base64.b64encode(jpg).decode()}',fog:'#{rgb[:3].hex()}'}};\n"
    (OUT / f'pano_{name}.js').write_text(js)
    print(f'pano_{name:9s} {asset:26s} {len(js) // 1024:5d} Ko  horizon #{rgb[:3].hex()}')
    return len(js)


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
    if 'nopano' not in sys.argv:
        for name, asset in PANOS.items():
            total += pano(name, asset)
    print(f'total {total // 1024} Ko')


if __name__ == '__main__':
    sys.exit(main())
