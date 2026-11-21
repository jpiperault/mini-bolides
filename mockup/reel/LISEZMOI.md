# Maquette « rendu réaliste » (2026-11-21)

- `planche.html` : images avant/après (Cuisine, voiture rouge) montrées avant de développer.
- `reel.js` + `reel.patch` : le code de la maquette tel qu'il était, sur la v0.9.49. Depuis la v0.10.0 il est dans le jeu
  (js/reel.js, js/car-hd.js, js/render.js, photos dans js/tex/ produites par tools/build-tex.py).
- Hash de test du jeu : `#reel=ABCD` (A voitures, B lumière, C matières, D objectif ; `#reel=0` = ancien rendu), `&tex=code`,
  `&still=45` (image figée), `&cam=front|rear|mat` (gros plan). Exemple : `#race=bol&ff=5&auto&still=45&cam=front`.
