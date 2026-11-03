#!/usr/bin/env python3
"""Embarque les sons de sfx/*.ogg dans js/sfx-data.js (base64) : la WebView charge le jeu en file://, où fetch est refusé."""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
files = sorted((root / 'sfx').glob('*.ogg'))
lines = [f"  {f.stem}: '{base64.b64encode(f.read_bytes()).decode()}'," for f in files]
src = ("// Généré par tools/build-sfx.py : sons CC0 de Kenney (kenney.nl), voir sfx/LICENCE-Kenney-CC0.txt.\n"
       "(function (MB) {\n MB.SFX_DATA = {\n" + "\n".join(lines) + "\n };\n})(window.MB = window.MB || {});\n")
(root / 'js' / 'sfx-data.js').write_text(src)
print(len(files), 'sons,', len(src) // 1024, 'Ko')
