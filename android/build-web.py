#!/usr/bin/env python3
"""Copie le jeu (../index.html et ../js) dans les assets Android ; three.js et les polices y sont déjà."""
import pathlib, shutil
here = pathlib.Path(__file__).resolve().parent
www = here / 'app/src/main/assets/www'
shutil.copy(here.parent / 'index.html', www / 'index.html')
if (www / 'js').exists():
    shutil.rmtree(www / 'js')
shutil.copytree(here.parent / 'js', www / 'js')
print('écrit', www)
