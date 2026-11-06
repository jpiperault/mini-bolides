// Données du jeu : aucune dépendance, chargé aussi par les tests Node.
(function (MB) {
  // demo : pubs et achats simulés, sans SDK ni paiement. À passer à false avant toute mise en ligne sur Play.
  MB.FEATURES = { premium: true, ads: true, demo: true };

  // Boutique : confort et cosmétique uniquement, jamais de pièces ni d'évolutions contre de l'argent réel.
  MB.OFFERS = [
    { id: 'noads', icon: '🚫', price: '2,99 €', name: { fr: 'Pack Sans pub', en: 'No Ads Pack' },
      desc: { fr: 'Plus aucune pub entre les courses. Les pubs à la demande restent facultatives.', en: 'No more ads between races. Optional reward ads stay available.' } },
    { id: 'prestige', icon: '✨', price: '1,99 €', name: { fr: 'Collection Prestige', en: 'Prestige Collection' },
      desc: { fr: '5 peintures exclusives pour toutes tes voitures.', en: '5 exclusive paints for all your cars.' } },
  ];
  MB.AD_RULES = { everyRaces: 3, graceRaces: 5 };          // pas de pub entre les courses pendant les premières parties

  MB.CONFIG = { laps: 3, carCount: 6, trackLength: 860, trackWidth: 15, ds: 2 };

  // Styles de conduite : aucune voiture n'est "meilleure", chacune échange une force contre une faiblesse.
  MB.CARS = [
    { id: 'bolide', name: 'Le Bolide', tag: { fr: 'Équilibrée', en: 'Balanced' }, price: 0, shape: 'bolide',
      vmax: 37, accel: 1.05, turn: 1.32, driftBonus: 1.0, mass: 1.0 },
    { id: 'savon', name: 'La Savonnette', tag: { fr: 'Reine du drift', en: 'Drift queen' }, price: 300, shape: 'coupe',
      vmax: 36, accel: 0.95, turn: 1.42, driftBonus: 1.35, mass: 0.9 },
    { id: 'tortue', name: 'La Tortue', tag: { fr: 'Ronde et collée à la route', en: 'Round and grippy' }, price: 400, shape: 'bulle',
      vmax: 35.4, accel: 1.08, turn: 1.44, driftBonus: 1.15, mass: 1.05 },
    { id: 'puce', name: 'La Puce', tag: { fr: 'Minuscule et nerveuse', en: 'Tiny and nimble' }, price: 500, shape: 'citadine',
      vmax: 35, accel: 1.2, turn: 1.46, driftBonus: 1.05, mass: 0.8 },
    { id: 'criquet', name: 'Le Criquet', tag: { fr: 'Buggy sauteur', en: 'Bouncy buggy' }, price: 650, shape: 'buggy',
      vmax: 35.6, accel: 1.25, turn: 1.38, driftBonus: 1.25, mass: 0.85 },
    { id: 'tata', name: 'Le Fourgon de Tata', tag: { fr: 'Lourd mais turbo', en: 'Heavy but turbocharged' }, price: 800, shape: 'van',
      vmax: 34.8, accel: 1.3, turn: 1.2, driftBonus: 1.2, mass: 1.7 },
    { id: 'eclair', name: "L'Éclair", tag: { fr: 'Pointe de vitesse', en: 'Top speed' }, price: 1100, shape: 'formule',
      vmax: 39.5, accel: 0.9, turn: 1.22, driftBonus: 0.9, mass: 0.85 },
    { id: 'papy', name: 'Le Pick-up de Papy', tag: { fr: 'Pousse tout le monde', en: 'Shoves everyone aside' }, price: 1300, shape: 'pickup',
      vmax: 36, accel: 1.15, turn: 1.24, driftBonus: 1.15, mass: 1.65 },
    { id: 'pepere', name: 'Le Pépère', tag: { fr: 'Costaud, accélère fort', en: 'Tough, quick off the line' }, price: 1500, shape: 'camion',
      vmax: 35.5, accel: 1.35, turn: 1.28, driftBonus: 1.0, mass: 1.5 },
    { id: 'yeti', name: 'Le Yéti', tag: { fr: 'Tout-terrain robuste', en: 'Rugged off-roader' }, price: 1800, shape: 'jeep',
      vmax: 36.6, accel: 1.22, turn: 1.3, driftBonus: 1.05, mass: 1.4 },
    { id: 'tonton', name: 'Le Tonton', tag: { fr: 'Gros moteur, gros caractère', en: 'Big engine, big attitude' }, price: 2200, shape: 'muscle',
      vmax: 38.5, accel: 1.25, turn: 1.16, driftBonus: 1.1, mass: 1.3 },
    { id: 'comtesse', name: 'La Comtesse', tag: { fr: 'Élégante et rapide', en: 'Elegant and fast' }, price: 3200, shape: 'gt',
      vmax: 38.5, accel: 1.02, turn: 1.3, driftBonus: 0.95, mass: 1.0 },
    { id: 'requin', name: 'Le Requin', tag: { fr: 'Fend l\'air, vire serré', en: 'Slices air, turns tight' }, price: 4200, shape: 'cale',
      vmax: 39.8, accel: 1.05, turn: 1.3, driftBonus: 1.0, mass: 0.9 },
    { id: 'dragster', name: 'Le Dragster', tag: { fr: 'Fusée en ligne droite', en: 'Rocket on the straights' }, price: 5200, shape: 'dragster',
      vmax: 40.0, accel: 1.18, turn: 1.12, driftBonus: 0.85, mass: 1.1 },
  ];

  // Évolutions achetées uniquement avec les pièces gagnées en course, jamais avec de l'argent réel.
  MB.UPGRADES = {
    moteur: { name: { fr: 'Moteur', en: 'Engine' }, desc: { fr: '+ de vitesse de pointe', en: 'Higher top speed' }, stat: 'vmax', step: 0.013 },
    boite: { name: { fr: 'Boîte de vitesses', en: 'Gearbox' }, desc: { fr: '+ d\'accélération', en: 'Faster acceleration' }, stat: 'accel', step: 0.06 },
    pneus: { name: { fr: 'Pneus', en: 'Tyres' }, desc: { fr: '+ de tenue de route', en: 'Better grip' }, stat: 'turn', step: 0.02 },
    turbo: { name: { fr: 'Turbo', en: 'Turbo' }, desc: { fr: 'Turbo de drift plus long', en: 'Longer drift boost' }, stat: 'driftBonus', step: 0.07 },
  };
  MB.UP_MAX = 5;
  MB.UP_COST = [100, 200, 350, 550, 800];

  MB.effectiveCar = function (id, levels) {
    const base = MB.CARS.find((c) => c.id === id) || MB.CARS[0], car = Object.assign({}, base), ups = levels || {};
    let sum = 0;
    for (const k of Object.keys(MB.UPGRADES)) {
      const u = MB.UPGRADES[k], lvl = ups[k] || 0;
      car[u.stat] = base[u.stat] * (1 + u.step * lvl);
      sum += lvl;
    }
    car.power = sum / (MB.UP_MAX * Object.keys(MB.UPGRADES).length);
    return car;
  };

  MB.SENS = {
    doux: { label: { fr: 'Douce', en: 'Soft' }, k: 0.82 },
    normal: { label: { fr: 'Normale', en: 'Normal' }, k: 1 },
    vif: { label: { fr: 'Vive', en: 'Sharp' }, k: 1.18 },
  };

  MB.PAINTS = [
    { id: 'tomate', name: { fr: 'Tomate', en: 'Tomato' }, hex: 0xe5352b, price: 0 },
    { id: 'citron', name: { fr: 'Citron', en: 'Lemon' }, hex: 0xf7c52d, price: 0 },
    { id: 'menthe', name: { fr: 'Menthe', en: 'Mint' }, hex: 0x25b98a, price: 0 },
    { id: 'myrtille', name: { fr: 'Myrtille', en: 'Blueberry' }, hex: 0x2f62d9, price: 0 },
    { id: 'reglisse', name: { fr: 'Réglisse', en: 'Liquorice' }, hex: 0x2a2730, price: 150 },
    { id: 'fraise', name: { fr: 'Fraise', en: 'Strawberry' }, hex: 0xf0639a, price: 150 },
    { id: 'chrome', name: { fr: 'Chrome', en: 'Chrome' }, hex: 0xd9dee6, price: 0, premium: true },
    { id: 'or', name: { fr: 'Or', en: 'Gold' }, hex: 0xd4a537, price: 0, premium: true },
    { id: 'nacre', name: { fr: 'Nacre', en: 'Pearl' }, hex: 0xf3efe6, price: 0, premium: true },
    { id: 'lagon', name: { fr: 'Lagon', en: 'Lagoon' }, hex: 0x19e3c2, price: 0, premium: true },
    { id: 'aurore', name: { fr: 'Aurore', en: 'Aurora' }, hex: 0x8a3ffc, price: 0, premium: true },
  ];

  MB.RIVAL_CARS = ['bolide', 'savon', 'puce', 'tata', 'eclair', 'pepere'];   // voitures des rivaux : leur niveau ne bouge pas quand le garage s'agrandit
  MB.RIVAL_DECO = ['bandes', 'eclair', 'pois', 'damier', 'flammes', 'etoiles'];   // chaque rival a ses autocollants : on le reconnaît de loin
  MB.RIVALS = ['Loulou', 'Zébulon', 'Mamie Turbo', 'Biscotte', 'Max la Menace', 'Praline'];
  // Caractères : pace = allure, lane = délai entre changements de file, block = ferme la porte, late = finit fort, item = délai avant d'utiliser un objet.
  MB.RIVAL_STYLES = [
    { pace: 1, lane: [1.6, 2], block: true, late: 0, item: [1, 2], sc: 1.4 },
    { pace: 0.99, lane: [0.7, 1], block: false, late: 0, item: [0.3, 1], sc: 0.6 },
    { pace: 0.975, lane: [3, 3], block: false, late: 0.035, item: [2, 3], sc: 1 },
    { pace: 0.985, lane: [4, 4], block: false, late: 0, item: [4, 4], sc: 0.8 },
    { pace: 1.01, lane: [2, 2], block: true, late: 0.01, item: [0.2, 0.6], sc: 1.2 },
    { pace: 1, lane: [2, 3], block: false, late: 0, item: [1, 3], sc: 1 },
  ];
  // Style des voitures (onglet Style du garage) : payé en pièces une fois, utilisable sur toutes les voitures.
  MB.LOOKS = {
    num: [{ id: '', label: '—', price: 0 }, { id: '7', price: 120 }, { id: '13', price: 120 }, { id: '21', price: 120 }, { id: '42', price: 150 }, { id: '77', price: 150 }, { id: '99', price: 180 }],
    rim: [{ id: 'chrome', hex: 0xcfd3da, price: 0 }, { id: 'noir', hex: 0x2a2b30, price: 150 }, { id: 'rouge', hex: 0xe5352b, price: 150 }, { id: 'bleu', hex: 0x2f8fd8, price: 150 }, { id: 'or', hex: 0xf2c14e, price: 250 }],
    // Autocollants peints sur la carrosserie (js/car-hd.js drawDeco).
    deco: [{ id: '', icon: '—', price: 0 }, { id: 'bandes', icon: '🏁', price: 200, name: { fr: 'Bandes', en: 'Stripes' } }, { id: 'damier', icon: '🏴', price: 250, name: { fr: 'Damier', en: 'Checkers' } },
      { id: 'flammes', icon: '🔥', price: 350, name: { fr: 'Flammes', en: 'Flames' } }, { id: 'eclair', icon: '⚡', price: 300, name: { fr: 'Éclair', en: 'Lightning' } },
      { id: 'pois', icon: '🔴', price: 200, name: { fr: 'Pois', en: 'Polka dots' } }, { id: 'etoiles', icon: '⭐', price: 300, name: { fr: 'Étoiles', en: 'Stars' } }],
    trail: [{ id: 'feu', hex: 0xff5a00, price: 0 }, { id: 'bleu', hex: 0x2f9bff, price: 220 }, { id: 'rose', hex: 0xff4fa3, price: 220 }, { id: 'vert', hex: 0x36e07a, price: 220 }, { id: 'or', hex: 0xffd23f, price: 300 }],
  };

  // Trophées : vérifiés à l'arrivée (r : résumé de la course, s : sauvegarde), récompensés une seule fois.
  // Ceux qui ont des paliers (tiers) se gagnent d'abord en bronze, puis passent argent et or quand le total (count) grandit ;
  // chaque palier rapporte coins × son rang.
  MB.TROPHIES = [
    { id: 'first', icon: '🏁', coins: 50, tiers: [1, 25, 100], count: (s) => s.races, unit: { fr: 'courses', en: 'races' }, name: { fr: 'Première ligne', en: 'First finish' }, desc: { fr: 'Termine une course', en: 'Finish a race' }, ok: (r) => r.done },
    { id: 'win', icon: '🥇', coins: 100, tiers: [1, 10, 50], count: (s) => s.tot.wins || 0, unit: { fr: 'victoires', en: 'wins' }, name: { fr: 'Champion du tapis', en: 'Top of the rug' }, desc: { fr: 'Gagne une course', en: 'Win a race' }, ok: (r) => !r.solo && r.pos === 1 },
    { id: 'clean', icon: '🧼', coins: 150, name: { fr: 'Sans une rayure', en: 'Not a scratch' }, desc: { fr: 'Finis une course sans toucher un mur', en: 'Finish without touching a wall' }, ok: (r) => !r.solo && r.walls === 0 },
    { id: 'turbo5', icon: '🔥', coins: 120, name: { fr: 'Pied au plancher', en: 'Pedal to the metal' }, desc: { fr: '5 super turbos dans une course', en: '5 super turbos in one race' }, ok: (r) => r.l2 >= 5 },
    { id: 'drift50', icon: '🌪️', coins: 200, tiers: [50, 200, 1000], count: (s) => s.tot.turbos, unit: { fr: 'turbos', en: 'turbos' }, name: { fr: 'Roi du drift', en: 'Drift king' }, desc: { fr: '50 turbos de drift au total', en: '50 drift turbos in total' }, ok: (r, s) => s.tot.turbos >= 50 },
    { id: 'shortcuts', icon: '»»', coins: 200, name: { fr: 'Explorateur', en: 'Explorer' }, desc: { fr: 'Prends le raccourci des 4 circuits qui en ont', en: 'Take the shortcut on all 4 tracks that have one' }, ok: (r, s) => Object.keys(s.scTracks).length >= 4 },
    { id: 'coins40', icon: '🪙', coins: 120, name: { fr: 'Poches pleines', en: 'Full pockets' }, desc: { fr: '40 pièces dans une course', en: '40 coins in one race' }, ok: (r) => r.coins >= 40 },
    { id: 'rich', icon: '💰', coins: 300, tiers: [3000, 10000, 30000], count: (s) => s.tot.coins, unit: { fr: 'pièces', en: 'coins' }, name: { fr: 'Petite fortune', en: 'Small fortune' }, desc: { fr: 'Gagne 3 000 pièces au total', en: 'Earn 3,000 coins in total' }, ok: (r, s) => s.tot.coins >= 3000 },
    { id: 'bowling', icon: '🔵', coins: 150, tiers: [3, 15, 50], count: (s) => s.tot.marbles, unit: { fr: 'rivaux touchés', en: 'rivals hit' }, name: { fr: 'Strike !', en: 'Strike!' }, desc: { fr: 'Touche 3 rivaux avec des billes', en: 'Hit 3 rivals with marbles' }, ok: (r, s) => s.tot.marbles >= 3 },
    { id: 'comeback', icon: '🚀', coins: 200, name: { fr: 'Remontada', en: 'Comeback' }, desc: { fr: 'Dernier au début du dernier tour, sur le podium à l\'arrivée', en: 'Last on the final lap, on the podium at the end' }, ok: (r) => !r.solo && r.lastLapPos >= 6 && r.pos <= 3 },
    { id: 'ghost', icon: '👻', coins: 150, name: { fr: 'Chasseur de fantôme', en: 'Ghostbuster' }, desc: { fr: 'Bats ton fantôme en contre-la-montre', en: 'Beat your ghost in time trial' }, ok: (r) => r.ghostBeat },
    { id: 'tour', icon: '🗺️', coins: 250, name: { fr: 'Tour de la maison', en: 'House tour' }, desc: { fr: 'Roule sur tous les circuits', en: 'Race on every track' }, ok: (r, s) => Object.keys(s.tracksRaced).length >= MB.TRACKS.length },
    { id: 'cup', icon: '🏆', coins: 300, name: { fr: 'Coupe en or', en: 'Golden cup' }, desc: { fr: 'Gagne une coupe', en: 'Win a cup' }, ok: (r) => r.cupWin },
    { id: 'stars', icon: '⭐', coins: 300, tiers: [20, 50, 100], count: (s) => Object.values(s.stars).reduce((a, b) => a + b, 0), unit: { fr: 'étoiles', en: 'stars' }, name: { fr: 'Collectionneur', en: 'Collector' }, desc: { fr: 'Réunis 20 étoiles', en: 'Collect 20 stars' }, ok: (r, s) => Object.values(s.stars).reduce((a, b) => a + b, 0) >= 20 },
    { id: 'expert', icon: '🛞', coins: 300, name: { fr: 'Pilote expert', en: 'Expert driver' }, desc: { fr: 'Gagne une course en 150 cc', en: 'Win a race in 150cc' }, ok: (r) => !r.solo && r.pos === 1 && r.diff === 'expert' },
    // Deuxième vague (v0.9.35) : modes, exploits de course, collection et fidélité.
    { id: 'toys', icon: '🧸', coins: 400, name: { fr: 'Grand collectionneur', en: 'Toy hoarder' }, desc: { fr: 'Trouve tous les jouets cachés', en: 'Find every hidden toy' }, ok: (r, s) => Object.keys(s.toys || {}).length >= MB.TOYS.length },
    { id: 'night', icon: '🦉', coins: 150, name: { fr: 'Oiseau de nuit', en: 'Night owl' }, desc: { fr: 'Gagne une course de nuit', en: 'Win a night race' }, ok: (r) => r.done && !r.solo && r.pos === 1 && r.variant === 'nuit' },
    { id: 'rain', icon: '☂️', coins: 150, name: { fr: 'Sous la pluie', en: 'Singing in the rain' }, desc: { fr: 'Gagne une course sous la pluie', en: 'Win a race in the rain' }, ok: (r) => r.done && !r.solo && r.pos === 1 && r.variant === 'pluie' },
    { id: 'reverse', icon: '🔄', coins: 150, name: { fr: 'À l\'envers', en: 'Wrong way round' }, desc: { fr: 'Gagne une course en sens inverse', en: 'Win a reverse race' }, ok: (r) => r.done && !r.solo && r.pos === 1 && r.variant === 'inverse' },
    { id: 'photo', icon: '📸', coins: 200, name: { fr: 'Photo-finish', en: 'Photo finish' }, desc: { fr: 'Gagne avec moins de 0,3 s d\'avance', en: 'Win by less than 0.3 s' }, ok: (r) => r.done && !r.solo && r.pos === 1 && r.gap < 0.3 },
    { id: 'rocket', icon: '🚦', coins: 150, name: { fr: 'Fusée au départ', en: 'Rocket start' }, desc: { fr: 'Sois premier dès la fin du 1er tour', en: 'Lead at the end of lap 1' }, ok: (r) => r.done && !r.solo && r.lap1Pos === 1 },
    { id: 'drift', icon: '💨', coins: 200, name: { fr: 'Drift interminable', en: 'Endless drift' }, desc: { fr: 'Drifte 2,5 s sans lâcher', en: 'Drift for 2.5 s without letting go' }, ok: (r) => r.maxDrift >= 2.5 },
    { id: 'garage', icon: '🔑', coins: 250, name: { fr: 'Collection de voitures', en: 'Car collector' }, desc: { fr: 'Possède 5 voitures', en: 'Own 5 cars' }, ok: (r, s) => s.cars.length >= 5 },
    { id: 'tuned', icon: '🔧', coins: 250, name: { fr: 'Moteur gonflé', en: 'Fully tuned' }, desc: { fr: 'Améliore une voiture au maximum', en: 'Max out every upgrade on one car' }, ok: (r, s) => Object.values(s.ups).some((u) => Object.keys(MB.UPGRADES).every((k) => (u[k] || 0) >= MB.UP_MAX)) },
    { id: 'streak', icon: '📅', coins: 200, name: { fr: 'Fidèle au volant', en: 'Regular racer' }, desc: { fr: 'Joue 7 jours de suite', en: 'Play 7 days in a row' }, ok: (r, s) => s.daily.streak >= 7 },
    { id: 'chests', icon: '🎁', coins: 250, name: { fr: 'Chasseur de coffres', en: 'Chest hunter' }, desc: { fr: 'Ouvre 10 coffres de missions', en: 'Open 10 mission chests' }, ok: (r, s) => (s.tot.chests || 0) >= 10 },
    { id: 'figs', icon: '🗿', coins: 400, name: { fr: 'Tous les champions', en: 'Champion slayer' }, desc: { fr: 'Gagne les 5 figurines de rivaux', en: 'Win all 5 rival figurines' }, ok: (r, s) => Object.keys(s.figs || {}).length >= MB.FIGS.length },
    { id: 'leader', icon: '👑', coins: 300, name: { fr: 'Roi de la course', en: 'Wire to wire' }, desc: { fr: 'En tête à chaque passage de ligne et à l\'arrivée', en: 'Lead at every lap and at the finish' }, ok: (r) => r.done && !r.solo && r.pos === 1 && r.ledAll && r.lap1Pos === 1 },
  ];

  // Jouets cachés : 33 à collectionner. Un nouveau sort tous les 2 jours (3 dès le début), caché sur un circuit ouvert
  // jusqu'à ce qu'on le trouve. Les jouets déjà trouvés reviennent en doublons (une fois par jour et par circuit).
  MB.TOY_COINS = 100;
  MB.TOY_DUP_COINS = 20;
  MB.TOY_EVERY = 2;   // jours entre deux nouveaux jouets
  MB.TOYS = [
    { id: 'canard', icon: '🦆', name: { fr: 'Canard de bain', en: 'Rubber duck' } },
    { id: 'yoyo', icon: '🪀', name: { fr: 'Yoyo', en: 'Yo-yo' } },
    { id: 'robot', icon: '🤖', name: { fr: 'Robot', en: 'Robot' } },
    { id: 'bateau', icon: '⛵', name: { fr: 'Bateau en papier', en: 'Paper boat' } },
    { id: 'toupie', icon: '🌀', name: { fr: 'Toupie', en: 'Spinning top' } },
    { id: 'avion', icon: '✈️', name: { fr: 'Petit avion', en: 'Toy plane' } },
    { id: 'ours', icon: '🧸', name: { fr: 'Ourson', en: 'Teddy' } },
    { id: 'sifflet', icon: '📯', name: { fr: 'Sifflet', en: 'Whistle' } },
    { id: 'voiture', icon: '🚙', name: { fr: 'Petite voiture', en: 'Toy car' } },
    { id: 'crayon', icon: '✏️', name: { fr: 'Crayon', en: 'Crayon' } },
    { id: 'de', icon: '🎲', name: { fr: 'Dé', en: 'Die' } },
    { id: 'balle', icon: '⚽', name: { fr: 'Balle rebondissante', en: 'Bouncy ball' } },
    { id: 'tambour', icon: '🥁', name: { fr: 'Tambour', en: 'Drum' } },
    { id: 'trompette', icon: '🎺', name: { fr: 'Trompette', en: 'Trumpet' } },
    { id: 'cerfvolant', icon: '🪁', name: { fr: 'Cerf-volant', en: 'Kite' } },
    { id: 'matriochka', icon: '🪆', name: { fr: 'Poupée russe', en: 'Nesting doll' } },
    { id: 'culbuto', icon: '🥚', name: { fr: 'Culbuto', en: 'Roly-poly' } },
    { id: 'brique', icon: '🧱', name: { fr: 'Brique de construction', en: 'Building brick' } },
    { id: 'loco', icon: '🚂', name: { fr: 'Locomotive', en: 'Toy engine' } },
    { id: 'camion', icon: '🚚', name: { fr: 'Camion-benne', en: 'Dump truck' } },
    { id: 'helico', icon: '🚁', name: { fr: 'Hélicoptère', en: 'Helicopter' } },
    { id: 'sousmarin', icon: '🟡', name: { fr: 'Sous-marin', en: 'Submarine' } },
    { id: 'ballon', icon: '🎈', name: { fr: 'Ballon', en: 'Balloon' } },
    { id: 'xylo', icon: '🎹', name: { fr: 'Xylophone', en: 'Xylophone' } },
    { id: 'seau', icon: '🪣', name: { fr: 'Seau de plage', en: 'Sand bucket' } },
    { id: 'etoilemer', icon: '⭐', name: { fr: 'Étoile de mer', en: 'Starfish' } },
    { id: 'pingouin', icon: '🐧', name: { fr: 'Pingouin', en: 'Penguin' } },
    { id: 'bonhomme', icon: '⛄', name: { fr: 'Bonhomme de neige', en: 'Snowman' } },
    { id: 'grenouille', icon: '🐸', name: { fr: 'Grenouille', en: 'Frog' } },
    { id: 'coccinelle', icon: '🐞', name: { fr: 'Coccinelle', en: 'Ladybird' } },
    { id: 'moulin', icon: '🎡', name: { fr: 'Moulin à vent', en: 'Pinwheel' } },
    { id: 'fusee', icon: '🚀', name: { fr: 'Fusée', en: 'Rocket' } },
    { id: 'dino', icon: '🦕', name: { fr: 'Dinosaure', en: 'Dinosaur' } },
  ];
  MB.dayNum = (k) => { const p = k.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); };
  // Petit hachage stable (FNV-1a) : mêmes cachettes pour un même jouet, mêmes doublons pour un même jour.
  MB.hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // Nombre de jouets sortis depuis le jour de départ du joueur.
  MB.toysReleased = (startKey, todayKey) => Math.min(MB.TOYS.length, 3 + Math.floor(Math.max(0, MB.dayNum(todayKey) - MB.dayNum(startKey)) / MB.TOY_EVERY));

  MB.TIER_NAMES = [{ fr: 'Bronze', en: 'Bronze' }, { fr: 'Argent', en: 'Silver' }, { fr: 'Or', en: 'Gold' }];
  // Palier atteint d'un trophée (0 : pas gagné ; 1 à 3 pour bronze, argent, or ; 1 pour un trophée sans paliers).
  MB.trophyTier = (tr, s) => {
    if (!s.troph[tr.id]) return 0;
    if (!tr.tiers) return 1;
    const n = tr.count(s);
    return Math.max(1, tr.tiers.filter((x) => n >= x).length);
  };

  // Rivaux champions : sur chaque circuit, un des rivaux défend son terrain (couronne, un peu plus rapide, il ferme la porte).
  // Le battre FIG_WINS fois sur ses circuits fait gagner sa figurine, posée dans la salle des trophées.
  MB.FIG_WINS = 3;
  MB.FIG_COINS = 300;
  MB.CHAMP_PACE = 1.035;
  MB.CHAMPS = { bol: 0, sentier: 0, bain: 0, tartine: 1, banquise: 1, ville: 1, dune: 2, chateau: 2, coffre: 2, doudou: 3, glacier: 3, grenier: 3, minuit: 4 };
  MB.FIGS = [
    { rival: 0, icon: '🐺', title: { fr: 'le loup des circuits', en: 'the track wolf' } },
    { rival: 1, icon: '🤡', title: { fr: 'le diable à ressort', en: 'the jack-in-the-box' } },
    { rival: 2, icon: '👵', title: { fr: 'la grand-mère pilote', en: 'the racing granny' } },
    { rival: 3, icon: '🍞', title: { fr: 'la biscotte qui file', en: 'the speedy rusk' } },
    { rival: 4, icon: '🦝', title: { fr: 'le bandit masqué', en: 'the masked bandit' } },
  ];
  MB.champOf = (trackId) => (MB.CHAMPS[trackId] === undefined ? null : MB.CHAMPS[trackId]);

  // Ce que dit un rival qu'on vient de dépasser.
  MB.RIVAL_SULK = [
    { fr: 'Hé !', en: 'Hey!' }, { fr: 'Grrr…', en: 'Grrr…' }, { fr: 'Pas juste !', en: 'Not fair!' },
    { fr: 'Revanche !', en: 'Rematch!' }, { fr: 'Oh non !', en: 'Oh no!' }, { fr: 'Attends-moi !', en: 'Wait for me!' },
  ];
  MB.RIVAL_LINES = [
    { fr: 'Pousse-toi !', en: 'Out of my way!' }, { fr: 'Youpiii !', en: 'Wheee!' }, { fr: 'Place aux anciens !', en: 'Respect your elders!' },
    { fr: 'Pardon, je passe…', en: 'Excuse me, passing…' }, { fr: 'Trop lent !', en: 'Too slow!' }, { fr: 'Coucou !', en: 'Peekaboo!' },
  ];

  // Points de contrôle sur une grille 0..100, remis à l'échelle à trackLength.
  MB.TRACKS = [
    { id: 'bol', name: { fr: 'Le Tour du Bol', en: 'Round the Bowl' }, mood: 'matin', seed: 11,
      pts: [[20, 20], [50, 12], [80, 20], [90, 45], [78, 62], [60, 58], [48, 68], [55, 85], [35, 92], [14, 80], [10, 50]] },
    { id: 'tartine', name: { fr: 'Le S de la Tartine', en: 'Toast Esses' }, mood: 'midi', seed: 23,
      pts: [[15, 15], [45, 10], [60, 22], [85, 12], [93, 35], [72, 45], [90, 62], [88, 88], [60, 90], [52, 68], [35, 62], [30, 88], [10, 85], [8, 55], [25, 40]] },
    { id: 'minuit', name: { fr: "L'Épingle de Minuit", en: 'Midnight Hairpin' }, mood: 'minuit', seed: 37,
      pts: [[10, 10], [50, 4], [90, 6], [98, 22], [66, 32], [58, 44], [94, 50], [98, 68], [66, 64], [58, 80], [94, 88], [80, 100], [30, 98], [14, 78], [36, 66], [30, 42], [8, 44]] },
    { id: 'dune', name: { fr: 'La Dune du Bac à Sable', en: 'Sandbox Dune' }, mood: 'sable', seed: 41,
      jumps: [0.36, 0.85], shortcuts: [[0.242, 0.535, 1]],
      pts: [[38, 58], [25, 56], [23, 48], [17, 31], [32, 24], [37, 12], [60, 16], [71, 17], [66, 43], [76, 45], [75, 59], [67, 66], [64, 83], [53, 80], [33, 77]] },
    { id: 'sentier', name: { fr: 'Le Sentier des Fourmis', en: 'Ant Trail' }, mood: 'foret', seed: 53,
      jumps: [0.35, 0.74],
      pts: [[74, 20], [77, 35], [82, 48], [80, 55], [87, 68], [67, 69], [51, 68], [37, 70], [32, 63], [15, 60], [17, 50], [15, 40], [37, 37], [42, 27], [53, 27]] },
    { id: 'chateau', name: { fr: 'Le Château de Sable', en: 'Sandcastle' }, mood: 'sable', seed: 62,
      jumps: [0.62, 0.76], shortcuts: [[0.121, 0.414, 1]],
      pts: [[52, 88], [42, 68], [32, 64], [18, 55], [22, 43], [23, 28], [41, 24], [58, 8], [67, 22], [77, 40], [76, 48], [77, 69], [64, 68]] },
    { id: 'banquise', name: { fr: 'La Banquise du Congélo', en: 'Freezer Floe' }, mood: 'neige', seed: 71, grip: 0.94,
      jumps: [0.66], shortcuts: [[0.7, 0.96, 1]],
      pts: [[85, 36], [72, 56], [71, 62], [65, 79], [53, 88], [45, 93], [43, 68], [29, 65], [17, 61], [26, 48], [35, 38], [40, 31], [44, 22], [58, 15], [65, 13], [76, 29]] },
    { id: 'glacier', name: { fr: 'Le Glacier Vanille', en: 'Vanilla Glacier' }, mood: 'neige', seed: 83, grip: 0.94,
      jumps: [0.49, 0.8], shortcuts: [[0.307, 0.6, 1, 4.4, 6]],
      pts: [[30, 58], [24, 43], [19, 31], [35, 23], [39, 17], [54, 29], [69, 15], [81, 24], [83, 41], [82, 51], [70, 68], [69, 76], [61, 93], [49, 91], [31, 87], [38, 63]] },
    { id: 'ville', name: { fr: 'Le Tapis de Ville', en: 'Playmat City' }, mood: 'ville', seed: 97,
      jumps: [0.52, 0.63],
      pts: [[17, 34], [31, 29], [44, 24], [61, 31], [85, 29], [86, 42], [86, 50], [93, 62], [65, 64], [57, 68], [46, 71], [33, 74], [12, 64], [23, 55], [8, 44]] },
    { id: 'doudou', name: { fr: 'La Course du Doudou', en: 'Teddy Dash' }, mood: 'chambre', seed: 109,
      jumps: [0.18], shortcuts: [[0.52, 0.82, 1]],
      pts: [[20, 30], [45, 15], [70, 22], [88, 40], [80, 62], [62, 58], [50, 75], [30, 88], [12, 70], [10, 48]] },
    { id: 'coffre', name: { fr: 'Le Coffre à Jouets', en: 'Toy Box Twister' }, mood: 'chambre', seed: 113,
      jumps: [0.3],
      pts: [[15, 20], [50, 12], [85, 18], [92, 40], [70, 50], [88, 70], [75, 90], [45, 85], [40, 60], [20, 70], [8, 45]] },
    // v0.9.39 : la salle de bain (raccourci au-dessus de la bonde) et le grenier (deux tremplins sur les cartons).
    { id: 'bain', name: { fr: 'Le Grand Bain', en: 'Bathtub Bay' }, mood: 'bain', seed: 127,
      jumps: [0.36], shortcuts: [[0.56, 0.77, -1, 6, 8]],
      pts: [[15, 30], [40, 15], [70, 14], [88, 28], [90, 55], [78, 78], [55, 88], [47, 58], [30, 84], [12, 70], [8, 48]] },
    { id: 'grenier', name: { fr: 'Le Grenier de Papi', en: 'Grandpa\'s Attic' }, mood: 'grenier', seed: 131,
      jumps: [0.3, 0.68],
      pts: [[10, 15], [40, 10], [52, 28], [70, 12], [92, 20], [90, 45], [70, 50], [88, 70], [80, 92], [50, 88], [38, 70], [22, 90], [8, 70], [20, 45]] },
  ];

  // Championnat : les étoiles gagnées sur les circuits ouvrent les coupes suivantes.
  MB.CUPS = [
    { id: 'cuisine', icon: '🥣', name: { fr: 'Coupe de la Cuisine', en: 'Kitchen Cup' }, stars: 0, tracks: ['bol', 'tartine', 'minuit'], prizes: [400, 250, 120], first: 500 },
    { id: 'grandair', icon: '🏖️', name: { fr: 'Coupe du Grand Air', en: 'Great Outdoors Cup' }, stars: 6, tracks: ['dune', 'sentier', 'chateau'], prizes: [600, 380, 180], first: 800 },
    { id: 'givre', icon: '❄️', name: { fr: 'Coupe du Givre', en: 'Frost Cup' }, stars: 13, tracks: ['banquise', 'glacier', 'ville'], prizes: [800, 500, 240], first: 1200 },
    { id: 'chambre', icon: '🧸', name: { fr: 'Coupe de la Chambre', en: 'Bedroom Cup' }, stars: 16, tracks: ['doudou', 'coffre', 'ville'], prizes: [700, 450, 210], first: 1000 },
    { id: 'champions', icon: '👑', name: { fr: 'Coupe des Champions', en: 'Champions Cup' }, stars: 20, tracks: ['minuit', 'chateau', 'glacier', 'ville'], prizes: [1200, 750, 360], first: 2000 },
    { id: 'combles', icon: '🛁', name: { fr: 'Coupe de la Maison', en: 'House Cup' }, stars: 24, tracks: ['bain', 'grenier', 'coffre'], prizes: [1000, 620, 300], first: 1600 },
  ];
  MB.cupUnlocked = (cup, stars) => stars >= cup.stars;

  // Mondes de la course libre : un monde s'ouvre avec les étoiles (tous modes confondus).
  MB.WORLDS = [
    { id: 'cuisine', icon: '🍳', name: { fr: 'Cuisine', en: 'Kitchen' }, stars: 0, tracks: ['bol', 'tartine', 'minuit'], col: ['#ffb36b', '#e5652b'] },
    { id: 'plage', icon: '🏖️', name: { fr: 'Plage', en: 'Beach' }, stars: 5, tracks: ['dune', 'chateau'], col: ['#ffc95c', '#ef8f3a'] },
    { id: 'foret', icon: '🌿', name: { fr: 'Forêt', en: 'Forest' }, stars: 10, tracks: ['sentier'], col: ['#7fc26a', '#3c8a4a'] },
    { id: 'neige', icon: '❄️', name: { fr: 'Neige', en: 'Snow' }, stars: 15, tracks: ['banquise', 'glacier'], col: ['#8cc6f0', '#4c84c9'] },
    { id: 'ville', icon: '🏙️', name: { fr: 'Ville', en: 'City' }, stars: 21, tracks: ['ville'], col: ['#5b4bb0', '#241f55'] },
    { id: 'chambre', icon: '🧸', name: { fr: 'Chambre', en: 'Bedroom' }, stars: 27, tracks: ['doudou', 'coffre'], col: ['#f29cc9', '#b45d9a'] },
    { id: 'bain', icon: '🛁', name: { fr: 'Salle de bain', en: 'Bathroom' }, stars: 30, tracks: ['bain'], col: ['#7fd6e8', '#2f8fb8'] },
    { id: 'grenier', icon: '📦', name: { fr: 'Grenier', en: 'Attic' }, stars: 34, tracks: ['grenier'], col: ['#c9a06a', '#6b4a2e'] },
  ];

  // ★ podium, ★★ victoire, ★★★ victoire avec au moins 20 pièces ramassées.
  MB.STAR_COINS = 20;
  MB.starsFor = (pos, coins) => (pos === 1 ? (coins >= MB.STAR_COINS ? 3 : 2) : pos <= 3 ? 1 : 0);

  MB.DAILY_REWARDS = [50, 75, 100, 125, 150, 200, 400];
  MB.dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayNum = (k) => { const p = k.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); };
  // Jour consécutif : la série avance et reboucle après 7 jours. Jour manqué : elle repart de 1, sans autre pénalité.
  MB.nextStreak = (last, today, streak) => (last && dayNum(today) - dayNum(last) === 1 ? (streak % MB.DAILY_REWARDS.length) + 1 : 1);

  // Défi du jour : déterminé par la date, le même pour toute la journée.
  MB.CHALLENGE_COINS = 250;
  const CHALLENGES = [
    { kind: 'pos', n: 1, text: { fr: 'Gagne la course', en: 'Win the race' } },
    { kind: 'pos', n: 3, text: { fr: 'Finis sur le podium', en: 'Finish on the podium' } },
    { kind: 'coins', n: 15, text: { fr: 'Ramasse 15 pièces', en: 'Collect 15 coins' } },
    { kind: 'coins', n: 22, text: { fr: 'Ramasse 22 pièces', en: 'Collect 22 coins' } },
    { kind: 'boosts', n: 3, text: { fr: 'Déclenche 3 turbos de drift', en: 'Trigger 3 drift boosts' } },
    { kind: 'boosts', n: 6, text: { fr: 'Déclenche 6 turbos de drift', en: 'Trigger 6 drift boosts' } },
    { kind: 'walls', n: 2, text: { fr: 'Touche les murs 2 fois au plus', en: 'Hit the walls twice at most' } },
  ];
  MB.dailyChallenge = (key, trackIds) => {
    const n = dayNum(key), h = (n * 2654435761) >>> 0;
    return Object.assign({ track: trackIds[h % trackIds.length] }, CHALLENGES[(h >>> 8) % CHALLENGES.length]);
  };
  // Missions du jour : trois par jour (facile, moyenne, difficile), cumulées sur toutes les courses de la journée.
  // {n} est remplacé par l'objectif, {s} par « s » au pluriel. Les trois finies ouvrent le coffre.
  MB.MISSION_COINS = [60, 100, 150];
  MB.MISSIONS = [
    { kind: 'races', icon: '🏁', n: [2, 3, 5], text: { fr: 'Termine {n} courses', en: 'Finish {n} races' } },
    { kind: 'boosts', icon: '🔥', n: [5, 9, 14], text: { fr: 'Déclenche {n} turbos de drift', en: 'Trigger {n} drift boosts' } },
    { kind: 'l2', icon: '💜', n: [1, 2, 4], text: { fr: 'Fais {n} super turbo{s}', en: 'Pull off {n} super boost{s}' } },
    { kind: 'coins', icon: '🪙', n: [25, 45, 70], text: { fr: 'Ramasse {n} pièces en course', en: 'Pick up {n} coins on track' } },
    { kind: 'podium', icon: '🥉', n: [1, 2, 3], text: { fr: 'Monte {n} fois sur le podium', en: 'Finish on the podium {n} time{s}' } },
    { kind: 'win', icon: '🏆', n: [1, 1, 2], text: { fr: 'Gagne {n} course{s}', en: 'Win {n} race{s}' } },
    { kind: 'sc', icon: '»', n: [1, 2, 3], text: { fr: 'Prends {n} raccourci{s}', en: 'Take {n} shortcut{s}' } },
    { kind: 'items', icon: '🎁', n: [3, 6, 10], text: { fr: 'Utilise {n} objets', en: 'Use {n} items' } },
    { kind: 'clean', icon: '✨', n: [1, 1, 2], text: { fr: 'Finis {n} course{s} en touchant 2 murs au plus', en: 'Finish {n} race{s} hitting 2 walls at most' } },
  ];
  MB.missionText = (m, lang) => m.def.text[lang].replace('{n}', m.n).replace('{s}', m.n > 1 ? 's' : '');
  MB.dailyMissions = (key, shortcuts) => {                     // sans circuit à raccourci ouvert, pas de mission raccourci
    let h = (dayNum(key) * 2246822519) >>> 0;
    const pool = MB.MISSIONS.filter((m) => shortcuts || m.kind !== 'sc'), out = [];
    for (let tier = 0; tier < 3; tier++) {
      h = (Math.imul(h ^ (h >>> 15), 2654435761) + tier) >>> 0;
      const def = pool.splice(h % pool.length, 1)[0];
      out.push({ def, n: def.n[tier], coins: MB.MISSION_COINS[tier] });
    }
    return out;
  };
  MB.chestCoins = (key) => 250 + ((dayNum(key) * 7919) % 5) * 50;   // 250 à 450, la surprise du coffre

  MB.challengeMet =(c, r) => (c.kind === 'pos' ? r.pos <= c.n : c.kind === 'coins' ? r.coins >= c.n : c.kind === 'boosts' ? r.boosts >= c.n : r.walls <= c.n);

  MB.POINTS = [10, 7, 5, 3, 2, 1];
  MB.RACE_COINS = [100, 70, 50, 30, 20, 10];

  // Cylindrées (clés historiques facile/normal/expert gardées pour les sauvegardes) : cc = vitesse de toutes les voitures,
  // unlock = victoires à remporter dans la cylindrée précédente pour ouvrir celle-ci.
  // skill = fraction de la vitesse max des rivaux ; le rattrapage reste doux pour que gagner ait du sens.
  MB.DIFFS = {
    facile: { label: { fr: '50 cc', en: '50cc' }, cc: 1, skill: 0.86, catchUp: 0.08, slowDown: 0.11, duel: 0.05, gain: 1, sc: 0.2, plot: 0.35 },
    normal: { label: { fr: '100 cc', en: '100cc' }, cc: 1.15, unlock: 3, skill: 0.99, catchUp: 0.1, slowDown: 0.06, duel: 0.12, gain: 1.25, sc: 0.35, plot: 0.2 },
    expert: { label: { fr: '150 cc', en: '150cc' }, cc: 1.32, unlock: 3, skill: 1.08, catchUp: 0.12, slowDown: 0.02, duel: 0.32, gain: 1.6, sc: 0.5, plot: 0.08 },
  };

  MB.ITEMS = {
    sirop: { icon: '🍯', name: { fr: 'Flaque de miel', en: 'Honey puddle' } },
    elastique: { icon: '🚀', name: { fr: 'Élastique turbo', en: 'Rubber-band turbo' } },
    aimant: { icon: '🧲', name: { fr: 'Aimant', en: 'Magnet' } },
    bulle: { icon: '🫧', name: { fr: 'Bulle', en: 'Bubble' } },
    ressort: { icon: '🌀', name: { fr: 'Ressort', en: 'Spring' } },
    collant: { icon: '🛞', name: { fr: 'Pneus collants', en: 'Sticky tyres' } },
    tirelire: { icon: '🐷', name: { fr: 'Tirelire', en: 'Piggy bank' } },
    recharge: { icon: '⚡', name: { fr: 'Recharge éclair', en: 'Lightning charge' } },
    bille: { icon: '🔵', name: { fr: 'Bille', en: 'Marble' } },
  };
  // Pondération [tête, milieu, queue] : les derniers reçoivent plus d'accélération, sans objet punitif.
  MB.ITEM_ODDS = {
    sirop: [5, 3, 1], bulle: [3, 2, 1], aimant: [0, 3, 4], elastique: [1, 3, 5], ressort: [3, 3, 2], collant: [2, 3, 3], tirelire: [4, 1, 0], recharge: [1, 3, 4], bille: [3, 3, 2],
  };
})(typeof window !== 'undefined' ? (window.MB = window.MB || {}) : module.exports);
