// Interface, sauvegarde, audio et boucle principale.
(function (MB) {
  const $ = (id) => document.getElementById(id);
  const lang = (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  const L = (o) => (typeof o === 'string' ? o : o[lang]);
  const S = {
    play: ['Championnat', 'Championship'], jouer: ['JOUER', 'PLAY'], today: ["Aujourd'hui", 'Today'], otherMode: ['Autre mode', 'Other mode'], modesT: ['Choisis un mode', 'Pick a mode'], tabHome: ['Accueil', 'Home'], tabTracks: ['Circuits', 'Tracks'],
    weekShort: ['Semaine', 'Week'], dayShort: ['j', 'd'], chalShort: ['Défi du jour', 'Daily'], doneShort: ['Réussi', 'Done'], missShort: ['Missions', 'Missions'], missChestGo: ['Ouvre le coffre !', 'Open the chest!'], missBye: ['À demain !', 'See you tomorrow!'],
    raceN: ['course', 'race'], ofN: ['sur', 'of'], swipeCar: ['glisse pour changer', 'swipe to change'], mCup: ['Championnat', 'Championship'], mCupD: ['Des coupes de 3 courses, aux points', 'Cups of 3 races, on points'], mRaceD: ['Un circuit au choix contre 5 rivaux', 'Any track against 5 rivals'],
    mChronoD: ['Seul contre ton fantôme', 'Alone against your ghost'], mDuoD: ['Écran partagé, sur le même téléphone', 'Split screen, on the same phone'], mMulti: ['À plusieurs', 'Multiplayer'], mMultiD: ['En ligne ou en Wi-Fi, jusqu\'à 4 téléphones', 'Online or over Wi-Fi, up to 4 phones'], chalAgain: ['Déjà réussi aujourd\'hui. Reviens demain !', 'Already done today. Come back tomorrow!'], cupsTitle: ['Championnat', 'Championship'], shop: ['Boutique', 'Shop'],
    stars: ['étoiles', 'stars'], locked: ['étoiles requises', 'stars needed'], unlocked: ['Nouvelle coupe débloquée !', 'New cup unlocked!'], cupCcHelp: ['Chaque cylindrée a ses médailles. Choisis-la puis touche une coupe.', 'Each class has its own medals. Pick one, then tap a cup.'], goal: ['3e étoile : gagne avec 20 pièces', '3rd star: win with 20 coins'],
    chal: ['Défi du jour', 'Daily challenge'], edTitle: ['Atelier', 'Workshop'], edSub: ['dessine ton propre circuit', 'draw your own track'], edSlot: ['Circuit', 'Track'], edHelp: ['Touche pour ajouter un point, glisse pour le déplacer. Touche un point pour le choisir.', 'Tap to add a point, drag to move it. Tap a point to select it.'], edOk: ['Circuit prêt !', 'Track ready!'], edCross: ['Deux bouts de route se touchent : écarte-les.', 'Two parts of the road touch: move them apart.'], edTight: ['Virage trop serré : arrondis-le.', 'Corner too tight: round it off.'], edFull: ['18 points maximum', '18 points max'], edDecor: ['Décor', 'Scenery'], edDel: ['🗑 Retirer le point', '🗑 Remove point'], edReset: ['↺ Recommencer', '↺ Start over'], edGo: ['🏁 Essayer', '🏁 Try it'], week: ['Défi de la semaine', 'Weekly challenge'], weekWin: ['gagne', 'win'], weekDone: ['réussi ! Nouveau défi lundi', 'done! New challenge on Monday'], weekWon: ['🗓️ Défi de la semaine réussi !', '🗓️ Weekly challenge done!'], weekFail: ['Défi de la semaine manqué', 'Weekly challenge failed'], golden: ['devient doré !', 'turns golden!'], days: ['jours', 'days'], day: ['jour', 'day'], chalDone: ['réussi, reviens demain !', 'done, back tomorrow!'], chalWin: ['Défi réussi', 'Challenge done'], chalFail: ['Défi manqué', 'Challenge failed'],
    close: ['Fermer', 'Close'], miss: ['Missions du jour', 'Daily missions'], missChest: ['Ouvrir le coffre', 'Open the chest'], missLock: ['Finis les 3 missions pour ouvrir le coffre', 'Finish all 3 missions to open the chest'],
    missOpened: ['Coffre ouvert ! Nouvelles missions demain', 'Chest opened! New missions tomorrow'], missReady: ['Coffre des missions prêt !', 'Mission chest ready!'], missChestT: ['coffre à la clé', 'chest to win'],
    missGo: ['Coffre prêt, viens l\'ouvrir !', 'Chest ready, come and open it!'], missTomorrow: ['à demain pour de nouvelles', 'new ones tomorrow'],
    notifQ: ['Un petit rappel ?', 'A little reminder?'], notifTxt: ['Une seule notification par jour, quand ton cadeau et tes nouvelles missions sont prêts. Jamais de spam.', 'Just one notification a day, when your gift and new missions are ready. Never spam.'],
    notifYes: ['Oui, rappelle-moi', 'Yes, remind me'], notifNo: ['Non merci', 'No thanks'], notif: ['Rappel quotidien', 'Daily reminder'], notifHelp: ['Une notification par jour, cadeau et missions', 'One notification a day: gift and missions'],
    notifBlocked: ['Bloquées par le téléphone : autorise les notifications de Mini Bolides dans les réglages Android', 'Blocked by the phone: allow Mini Bolides notifications in Android settings'],
    dailyT: ['Cadeau du jour', 'Daily gift'], dailyTake: ['Récupérer', 'Collect'], dailyAd: ['Récupérer × 2 (pub)', 'Collect × 2 (ad)'], day: ['Jour', 'Day'],
    shortcut: ['RACCOURCI !', 'SHORTCUT!'], cancel: ['Annuler', 'Cancel'], owned: ['Acheté', 'Owned'], restore: ['Restaurer mes achats', 'Restore purchases'],
    demoNote: ['Version de test : pubs et achats sont simulés, aucun paiement.', 'Test build: ads and purchases are simulated, no payment.'], demoBuy: ['Achat de test : aucun paiement réel.', 'Test purchase: no real payment.'], demoYes: ['Confirmer le test', 'Confirm test'], demoReset: ['Annuler mes achats de test', 'Reset test purchases'],
    adTitle: ['Pub de test', 'Test ad'], adBody: ['Ici s\'affichera une vraie pub.', 'A real ad will appear here.'], adClose: ['Fermer', 'Close'], lockedPaint: ['Peinture de la Collection Prestige', 'Prestige Collection paint'], free: ['Course libre', 'Quick race'], garage: ['Garage', 'Garage'], settings: ['Réglages', 'Settings'],
    pause: ['Pause', 'Paused'], resume: ['Reprendre', 'Resume'], restart: ['Recommencer', 'Restart'], quit: ['Quitter', 'Quit'],
    next: ['Course suivante', 'Next race'], again: ['Rejouer', 'Race again'], home: ['Menu', 'Menu'], lap: ['Tour', 'Lap'],
    pos: ['Arrivée', 'Result'], coins: ['pièces', 'coins'], best: ['Meilleur tour', 'Best lap'], cup: ['Classement', 'Standings'],
    you: ['Toi', 'You'], choose: ['Choisis un circuit', 'Pick a track'], buy: ['Acheter', 'Buy'], use: ['Choisir', 'Select'], used: ['En piste', 'Selected'],
    diff: ['Cylindrée', 'Engine class'], ccOpen: ['débloqué ! Choisis-le au-dessus du bouton COURSE', 'unlocked! Pick it above the RACE button'], newTag: ['NOUVEAU', 'NEW'], ccHelp: ['Plus de cylindrée : tout le monde va plus vite (100 cc +15 %, 150 cc +32 %) et les rivaux sont plus forts. Gagne 3 courses pour ouvrir la suivante. Le contre-la-montre se court toujours en 50 cc.', 'Bigger engines: everyone is faster (100cc +15%, 150cc +32%) and rivals are tougher. Win 3 races to unlock the next class. Time trial is always 50cc.'], report: ['📸 Signaler un souci', '📸 Report a problem'], loading: ['Préparation du circuit…', 'Getting the track ready…'], skip: ['Touche l\'écran pour passer', 'Tap to skip'], modeRace: ['🏁 Course', '🏁 Race'], modeChrono: ['⏱ Contre-la-montre', '⏱ Time trial'], modeDuo: ['👥 À deux', '👥 Two players'], duoWin: ['Joueur {n} gagne !', 'Player {n} wins!'], duoP: ['Joueur', 'Player'], duoAgain: ['Revanche !', 'Rematch!'], duoHelp: ['À deux sur le même téléphone, posé à plat entre vous : chacun dirige avec son pouce sur sa moitié d\'écran.', 'Two players, one phone laid flat between you: each steers with a thumb on their half of the screen.'],
    record: ['Nouveau record !', 'New record!'], ghostHelp: ['Bats ton fantôme : ton meilleur tour lancé (dès le 2e tour).', 'Beat your ghost: your best flying lap (from lap 2).'], varHelp: ['🌙 🌧️ 🔄 : modes ouverts dès une étoile en Normal. Chaque mode rapporte ses étoiles.', '🌙 🌧️ 🔄: modes open with one star in Normal. Each mode earns its own stars.'], tagline: ['COURSE DE PETITES VOITURES', 'TOY CAR RACING'], worldOpen: ['Nouveau monde :', 'New world:'], worldNeed: ['Encore', 'Still'], worldNeed2: ['étoiles pour ouvrir ce monde. Chaque mode de chaque circuit en rapporte.', 'stars to open this world. Every mode of every track earns them.'], pickTrack: ['Choisis un circuit', 'Pick a track'], run: ['COURIR', 'RACE'], normal: ['Normal', 'Normal'], lapTimes: ['Tours', 'Laps'], sound: ['Son', 'Sound'], music: ['Musique', 'Music'], vib: ['Vibrations', 'Vibration'], gfx: ['Rendu réaliste', 'Realistic rendering'], gfxHelp: ['Reflets, matières photo, flou d\'objectif. Se coupe seul si le téléphone peine.', 'Reflections, photo materials, lens blur. Turns itself off if the phone struggles.'], assist: ['Volant magique', 'Magic wheel'],
    assistHelp: ['Sans doigt posé, la voiture se recale seule.', 'With no finger down, the car straightens itself.'],
    back: ['Retour', 'Back'], how: ['Pose le pouce où tu veux et glisse à gauche ou à droite pour tourner. Braque fort pour drifter, relâche pour le turbo !', 'Put your thumb anywhere and slide left or right to steer. Steer hard to drift, release for turbo!'],
    won: ['Coupe gagnée !', 'Cup won!'], podium: ['Sur le podium !', 'On the podium!'], tryagain: ['Presque ! Encore une ?', 'So close! One more?'],
    double: ['Doubler les gains (pub)', 'Double rewards (ad)'], paint: ['Peinture', 'Paint'], racePlus: ['Prime de course', 'Race prize'], cupPlus: ['Prime de coupe', 'Cup prize'],
    sSpeed: ['Vitesse', 'Speed'], sAccel: ['Accélération', 'Acceleration'], sTurn: ['Maniabilité', 'Handling'], sDrift: ['Drift', 'Drift'],
    tabCar: ['Voiture', 'Car'], tabUp: ['Évolutions', 'Upgrades'], tabPaint: ['Peinture', 'Paint'], tabStyle: ['Style', 'Style'], lookNum: ['Numéro sur le toit', 'Roof number'], lookRim: ['Jantes', 'Rims'], lookTrail: ['Flamme du turbo', 'Turbo flame'], lookDeco: ['Autocollants', 'Decals'], champTick: ['défend ce circuit · finis 3 fois devant pour sa figurine', 'defends this track · finish ahead 3 times for their figurine'],
    champWon: ['garde son circuit… revanche !', 'keeps the track… rematch!'], champBeat: ['derrière toi ! Figurine', 'behind you! Figurine'], figGot: ['Figurine gagnée :', 'Figurine won:'],
    lookHelp: ['Acheté une fois, il va sur toutes tes voitures.', 'Bought once, it fits all your cars.'], trophies: ['Trophées', 'Trophies'], toyHint: ['🔍 Un jouet est caché sur ce circuit', '🔍 A toy is hidden on this track'], toyFound: ['Jouet trouvé !', 'Toy found!'], toyDup: ['Doublon :', 'Duplicate:'], toys: ['Jouets', 'Toys'], trophy: ['Trophée', 'Trophy'], sens: ['Sensibilité de la direction', 'Steering sensitivity'],
    buyFirst: ['Achète cette voiture pour la faire évoluer.', 'Buy this car to upgrade it.'], max: ['Max', 'Max'], need: ['Pièces insuffisantes', 'Not enough coins'],
    earned: ['Les évolutions se gagnent avec tes pièces de course.', 'Upgrades are paid with coins earned in races.'],
    credits: ['Modèles maison.', 'Home-made models.'],
  };
  const t = (k) => S[k][lang === 'fr' ? 0 : 1];
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;

  // ---------- Sauvegarde ----------
  const KEY = 'minibolides.save.v1';
  const defaults = () => ({ coins: 0, cars: ['bolide'], paints: ['tomate', 'citron', 'menthe', 'myrtille'], car: 'bolide', paint: 'tomate',
    best: {}, medals: {}, stars: {}, cups: {}, owned: [], daily: { last: null, streak: 0 }, chal: null, races: 0, sinceAd: 0, seen: false, ghosts: {}, tuto: {}, looks: ['num:', 'rim:chrome', 'trail:feu', 'deco:'], look: { num: '', rim: 'chrome', trail: 'feu', deco: '' }, troph: {}, tot: { coins: 0, turbos: 0, marbles: 0, wins: 0 }, trophT: {}, toys: {}, toyHint: {}, toyStart: null, toyAt: {}, dupDone: {}, figs: {}, figWins: {}, cupCc: null, weekWon: null, goldToys: {}, custom: [], edSlot: 0, ccOk: null, ccWins: {}, scTracks: {}, tracksRaced: {}, sound: true, music: true, vib: true, assist: true, diff: 'facile', sens: 'normal', ups: {}, carPaint: {}, miss: null, notif: null });
  let save = defaults();
  try { save = Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* stockage indisponible : partie sans sauvegarde */ }
  if (!save.looks.includes('deco:')) save.looks.push('deco:');
  if (save.look.deco === undefined) save.look.deco = '';
  if (!save.ccOk) {                                           // cylindrées : on garde ouvert ce que le joueur utilisait déjà
    const keys = Object.keys(MB.DIFFS), cur = keys.indexOf(save.diff);
    save.ccOk = {}; keys.forEach((k, i) => { if (i <= Math.max(0, cur) || (i === 1 && (save.tot.wins || 0) >= 3)) save.ccOk[k] = 1; });
  }
  if (!save.cupCc) {                                          // médailles de coupe par cylindrée : les anciennes vont à la cylindrée en cours
    save.cupCc = {};
    for (const id of Object.keys(save.cups || {})) if (save.cups[id]) save.cupCc[id] = { [save.diff || 'facile']: save.cups[id] };
  }
  if (save.tot.wins === undefined) save.tot.wins = save.troph.win ? 1 : 0;   // victoires comptées depuis les paliers de trophées
  if (!save.v4) {                                             // anciennes médailles : 1er = 2 étoiles, podium = 1 étoile
    for (const id of Object.keys(save.medals)) if (id !== 'cup') save.stars[id] = save.medals[id] === 3 ? 2 : 1;
    if (save.medals.cup) save.cups.cuisine = save.medals.cup;
    save.v4 = true;
  }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* idem */ } };

  // ---------- Monétisation : simulée tant que FEATURES.demo est à true, sinon confiée au pont Android ----------
  const bridge = window.AndroidBridge;
  const owns = (id) => save.owned.includes(id);
  function runAd(minimum, done) {
    let left = minimum;
    $('adScreen').hidden = false; $('adClose').hidden = true; $('adCount').textContent = left;
    adDone = (ok) => { adDone = null; clearInterval(tick); $('adScreen').hidden = true; done(ok); };
    const tick = setInterval(() => {
      left--; $('adCount').textContent = Math.max(left, 0);
      if (left <= 0) { clearInterval(tick); $('adClose').hidden = false; }
    }, 1000);
  }
  let adDone = null, confirmDone = null;
  function grant(id) {
    if (!owns(id)) save.owned.push(id);
    if (id === 'prestige') for (const p of MB.PAINTS) if (p.premium && !save.paints.includes(p.id)) save.paints.push(p.id);
    persist();
  }
  MB.monet = {
    adsAvailable: () => MB.FEATURES.ads && (MB.FEATURES.demo || !!(bridge && bridge.adsReady && bridge.adsReady())),
    showRewarded(placement, done) {
      if (!this.adsAvailable()) return done(false);
      if (MB.FEATURES.demo) return runAd(5, done);
      window.mbOnAd = done; bridge.showRewarded(placement);
    },
    // Pub entre deux courses : jamais pendant une course, ni pour les nouveaux joueurs, ni après le Pack Sans pub.
    between(done) {
      const r = MB.AD_RULES;
      if (!this.adsAvailable() || owns('noads') || save.races < r.graceRaces || save.sinceAd < r.everyRaces) return done();
      save.sinceAd = 0; persist();
      if (MB.FEATURES.demo) return runAd(3, () => done());
      window.mbOnAd = () => done(); bridge.showInterstitial();
    },
    buy(offer, done) {
      if (!MB.FEATURES.premium) return done(false);
      const end = (ok) => { if (ok) grant(offer.id); done(ok); };
      if (MB.FEATURES.demo) { $('confirmT').textContent = `${L(offer.name)} · ${offer.price}`; $('confirm').hidden = false; confirmDone = end; return; }
      window.mbOnPurchase = (id, ok) => end(ok); bridge.buy(offer.id);
    },
    restore() { if (!MB.FEATURES.demo && bridge && bridge.restorePurchases) { window.mbOnRestored = (ids) => { ids.split(',').filter(Boolean).forEach(grant); renderShop(); }; bridge.restorePurchases(); } },
  };

  // ---------- Audio : bruitages CC0 de Kenney (js/sfx-data.js), moteur et dérapage synthétisés ----------
  // Un son pas encore décodé (ou indécodable) retombe sur le bip synthétique d'avant.
  const SFX = {
    count: ['pepSound3', 0.5], go: ['highUp', 0.6], coin: ['glass_001', 0.45], lap: ['confirmation_001', 0.7],
    charge1: ['twoTone1', 0.35], charge2: ['threeTone1', 0.4], jump: ['phaseJump1', 0.45], land: ['impactSoft_heavy_000', 0.7],
    boost: ['phaserUp3', 0.5], shortcut: ['zapThreeToneUp', 0.45], wall: [['impactPlate_light_000', 'impactPlate_light_001', 'impactPlate_light_002'], 0.55],
    bump: [['impactSoft_medium_000', 'impactSoft_medium_001', 'impactSoft_medium_002'], 0.6], spin: ['lowDown', 0.5], item: ['powerUp2', 0.5],
    use: ['powerUp7', 0.5], elastique: ['phaserUp6', 0.6], pop: ['drop_002', 0.7], tap: ['click_002', 0.6], buy: ['confirmation_003', 0.7],
    upgrade: ['powerUp1', 0.5], finish: ['jingles_PIZZI07', 0.6],
  };
  const Sound = {
    ctx: null, buf: {}, fails: [], played: 0, beeps: 0,
    init() {
      if (this.ctx || !(save.sound || save.music)) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.fails.push('pas de Web Audio'); return; }
      try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { this.fails.push('contexte : ' + e.message); return; }
      const master = this.ctx.createGain(); master.gain.value = 0.5; master.connect(this.ctx.destination); this.master = master;
      for (const [name, b64] of Object.entries(MB.SFX_DATA || {})) {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try { this.ctx.decodeAudioData(bytes.buffer, (b) => { this.buf[name] = b; }, (e) => { this.fails.push(`${name} : ${e && e.message}`); }); } catch (e) { this.fails.push(`${name} : ${e.message}`); }
      }
      this.motor = MB.Synth.engine(this.ctx, master); this.tires = MB.Synth.skid(this.ctx, master);   // js/audio.js
      this.tunes = MB.Synth.music(this.ctx, master); this.tunes.volume(0.65);
      this.rivalBus = this.ctx.createGain(); this.rivalBus.gain.value = 0; this.rivalBus.connect(master); this.rivalMotor = MB.Synth.engine(this.ctx, this.rivalBus);
      if (this.style) this.song(this.style);
      if (this.wantRain) this.rain(true);
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || !save.sound) return;
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, n);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, n + dur);
      g.gain.setValueAtTime(vol || 0.16, n); g.gain.exponentialRampToValueAtTime(0.001, n + dur);
      o.connect(g); g.connect(this.master); o.start(n); o.stop(n + dur);
    },
    // Le navigateur peut suspendre le son (démarrage sans geste, retour d'arrière-plan) : tout toucher le relance.
    wake() { if (this.ctx && this.ctx.state !== 'running' && (save.sound || save.music)) this.ctx.resume().catch(() => {}); },
    // Musique : style d'ambiance (js/audio.js STYLES) ou null ; retenu même si le son n'est pas encore prêt.
    song(style) { this.style = style; if (this.tunes) { this.tunes.play(save.music ? style : null); this.tunes.tempo(1); } },
    diag() {
      const c = this.ctx;
      return { actif: !!save.sound, etat: c ? c.state : 'aucun', frequence: c ? c.sampleRate : 0, sons: `${Object.keys(this.buf).length}/${Object.keys(MB.SFX_DATA || {}).length}`, joues: this.played, bips: this.beeps, erreurs: this.fails.slice(0, 5) };
    },
    // Joue un bruitage nommé (SFX) ; sinon le bip de secours fourni. Légère variation de hauteur pour ne pas lasser.
    play(key, fallback, vary = 0.06) {
      if (!this.ctx || !save.sound) return;
      const [names, vol] = SFX[key], name = Array.isArray(names) ? names[Math.floor(Math.random() * names.length)] : names, b = this.buf[name];
      if (!b) { if (fallback) { this.beeps++; this.beep(...fallback); } return; }
      this.played++;
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = b; src.playbackRate.value = 1 + (Math.random() * 2 - 1) * vary; g.gain.value = vol;
      src.connect(g); g.connect(this.master); src.start();
    },
    // Moteur : la charge est forte loin de la vitesse de pointe (la voiture accélère toute seule).
    // Les réglages audio partent au plus 30 fois par seconde : chaque appel coûte au fil principal et au fil audio.
    due(k, live) {
      const t = this.ctx.currentTime, w = this.when || (this.when = {});
      if (live === w[k + 'l'] && t - (w[k] || 0) < 1 / 30) return false;
      w[k] = t; w[k + 'l'] = live; return true;
    },
    engine(on, ratio, boost) {
      if (!this.motor) return;
      const live = on && save.sound;
      if (!this.due('m', live)) return;
      this.motor.set(live, ratio, boost, live ? Math.min(1, Math.max(0, (1 - ratio) * 3)) : 0);
      if (!live) { this.tires.set(0, 0); if (this.rivalBus) this.rivalBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1); }
    },
    // Pneus : crissement en drift, et un peu quand la voiture glisse fort sans drifter.
    draft(k) {
      if (!this.ctx || (!this.wind && !k)) return;
      if (!this.wind) this.wind = MB.Synth.draft(this.ctx, this.master);
      if (this.due('d', k > 0)) this.wind.set(save.sound ? k : 0);
    },
    skid(amount, ratio) { if (this.tires && save.sound && this.due('s', amount > 0)) this.tires.set(amount, ratio); },
    // Moteur du rival le plus proche : plus fort quand il est près, plus aigu quand il se rapproche (Doppler exagéré, c'est un jouet).
    rain(on) {
      if (!this.ctx) { this.wantRain = on; return; }
      if (!this.drops) this.drops = MB.Synth.rain(this.ctx, this.master);
      this.drops.set(on && save.sound);
    },
    rival(c, d, closing) {
      if (!this.rivalMotor) return;
      const t = this.ctx.currentTime, on = !!c && save.sound && d < 38;
      if (!this.due('r', on)) return;
      this.rivalBus.gain.setTargetAtTime(on ? Math.pow(1 - d / 38, 2) * 0.55 : 0, t, 0.08);
      if (on) this.rivalMotor.set(true, c.v / c.spec.vmax, c.boost > 0, 0.4, undefined, 1 + Math.max(-0.22, Math.min(0.22, closing / 60)));
    },
    horn(vol, high) { if (this.ctx && save.sound) MB.Synth.horn(this.ctx, this.master, vol, high); },
    fanfare(big) { if (this.ctx && save.sound) MB.Synth.fanfare(this.ctx, this.master, big); },
  };
  const buzz = (ms) => { if (save.vib && bridge && bridge.vibrate) bridge.vibrate(ms); };

  // ---------- État ----------
  let view, race = null, phase = 'menu', paused = false, cup = null, chal = null, week = null, raceCc = 'facile', stat = null, shopFrom = 'home', slowT = 0, finFx = false, lastPos = 6, tickT = 0, trackCache = {}, currentTrack = null, lastT = 0, pendingCoins = 0;
  const input = { steer: 0, item: false, keyL: false, keyR: false }, input2 = { steer: 0, item: false };
  const auto = location.hash.indexOf('auto') >= 0;
  // Variantes : 'nuit' (décor de nuit, phares), 'pluie' (gouttes, route mouillée, un peu moins d'adhérence), 'inverse' (sens inverse).
  const VARIANTS = { nuit: { icon: '🌙', name: ['Nuit', 'Night'] }, pluie: { icon: '🌧️', name: ['Pluie', 'Rain'] }, inverse: { icon: '🔄', name: ['Sens inverse', 'Reverse'] } };
  // Circuits de l'atelier : « perso0 » à « perso2 », décor du monde choisi, sans étoiles ni jouets.
  const isCustom = (id) => /^perso\d$/.test(id || '');
  const customDef = (slot) => {
    const c = save.custom[slot], w = MB.WORLDS.find((x) => x.id === (c && c.world)) || MB.WORLDS[0], base = MB.TRACKS.find((d) => d.id === w.tracks[0]);
    return { id: 'perso' + slot, name: { fr: `Mon circuit ${slot + 1}`, en: `My track ${slot + 1}` }, mood: base.mood, seed: 200 + slot, pts: c ? c.pts : MB.EDIT_DEFAULT };
  };
  const trackDef = (id) => (isCustom(id) ? customDef(+id.slice(5)) : MB.TRACKS.find((d) => d.id === id));
  const getTrack = (id, v) => {
    const k = v ? `${id}@${v}` : id;
    if (trackCache[k]) return trackCache[k];
    let def = trackDef(id);
    if (v === 'inverse') def = MB.reverseDef(def);
    if (v === 'pluie') def = Object.assign({}, def, { grip: (def.grip || 1) * 0.93 });
    const t = MB.buildTrack(def); t.variant = v || null;
    return (trackCache[k] = t);
  };
  let currentVariant = null;
  const trackKey = () => (currentVariant ? `${currentTrack}@${currentVariant}` : currentTrack);
  const trackLabel = () => L(trackDef(currentTrack).name) + (currentVariant ? ` · ${VARIANTS[currentVariant].icon} ${VARIANTS[currentVariant].name[lang === 'fr' ? 0 : 1]}` : '');
  const carPaint = (id) => save.carPaint[id] || (id === save.car ? save.paint : MB.PAINTS[MB.CARS.findIndex((c) => c.id === id) % 4].id);
  const carHex = (id) => (MB.PAINTS.find((p) => p.id === carPaint(id)) || MB.PAINTS[0]).hex;
  const paintHex = () => carHex(save.car);
  const today = () => (MB.debug && MB.debug.today) || MB.dayKey(new Date());
  const starTotal = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
  const openCups = () => MB.CUPS.filter((c) => MB.cupUnlocked(c, starTotal()));
  // Un monde reste ouvert si on y a déjà couru (par exemple via une coupe).
  const worldOpen = (w) => starTotal() >= w.stars || w.tracks.some((id) => save.tracksRaced[id] || save.stars[id]);
  const openWorlds = () => MB.WORLDS.filter(worldOpen);
  const openTracks = () => openWorlds().flatMap((w) => w.tracks);
  // Jouets à chercher : ceux sortis à ce jour et pas encore trouvés, chacun caché sur un circuit ouvert choisi à sa sortie
  // (le moins chargé), qu'il garde jusqu'à ce qu'on le trouve.
  function toyHunt() {
    if (!save.toyStart) { save.toyStart = today(); persist(); }
    const n = MB.toysReleased(save.toyStart, today()), open = openTracks(), out = [];
    for (const y of MB.TOYS.slice(0, n)) {
      if (save.toys[y.id]) continue;
      if (!save.toyAt[y.id] || !open.includes(save.toyAt[y.id])) {
        const load = (id) => Object.values(save.toyAt).filter((v) => v === id).length;
        save.toyAt[y.id] = open.slice().sort((a, b) => load(a) - load(b) || MB.hash(y.id + a) - MB.hash(y.id + b))[0];
        persist();
      }
      out.push({ id: y.id, track: save.toyAt[y.id] });
    }
    return out;
  }
  // Jouets posés sur ce circuit pour cette course : les nouveaux à leur cachette fixe, plus un doublon du jour.
  function toysFor(trackId, track) {
    const spots = track.toySpots, out = [], used = new Set();
    if (!spots.length) return out;
    const at = (key) => { let k = MB.hash(key) % spots.length; while (used.has(k) && used.size < spots.length) k = (k + 1) % spots.length; used.add(k); return spots[k]; };
    for (const h of toyHunt()) if (h.track === trackId) { const p = at(h.id); out.push({ id: h.id, x: p.x, z: p.z }); }
    const found = Object.keys(save.toys), dk = `${today()}|${trackId}`;
    if (found.length && !save.dupDone[dk]) { const id = found[MB.hash(dk) % found.length], p = at(dk); out.push({ id, x: p.x, z: p.z, dup: true }); }
    return out;
  }
  const starText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  const challenge = () => MB.dailyChallenge(today(), openTracks());
  const weekly = () => MB.weeklyChallenge(today(), openTracks(), save.ccOk);
  const weekLine = (w) => `${L(MB.TRACKS.find((d) => d.id === w.track).name)}${w.variant ? ' ' + VARIANTS[w.variant].icon : ''} · ${L(MB.DIFFS[w.cc].label)} · ${t('weekWin')} ${L(w.rule.text)}`;
  const placeSuf = (p) => (lang === 'fr' ? (p === 1 ? 'er' : 'e') : ['st', 'nd', 'rd'][p - 1] || 'th');
  const carSpec = () => MB.CARS.find((c) => c.id === save.car) || MB.CARS[0];

  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== id; });
    $('pause').hidden = true;
    $('coinbar').hidden = !['home', 'garage', 'tracks', 'cups', 'shop'].includes(id);
    const tabbed = ['home', 'garage', 'tracks', 'cups', 'shop', 'trophies'].includes(id), cur = id === 'cups' ? 'tracks' : id;
    $('tabs').hidden = !tabbed; $('modes').hidden = true; $('brief').hidden = true;
    document.body.classList.toggle('tabbed', tabbed); document.body.classList.toggle('athome', id === 'home');
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === cur));
    $('coinval').textContent = save.coins;
  }
  function menu() {
    if (race) view.track = null;                              // la scène de course contient encore les voitures
    closeJournal({ fin: 'abandon' });
    phase = 'menu'; race = null; cup = null;
    Sound.engine(false, 0); Sound.draft(0); Sound.song('menu'); Sound.rain(false);
    view.showcase(getTrack(MB.TRACKS[0].id), carSpec().shape, paintHex(), save.look);
    chal = null; week = null;
    const wk = weekly(), wWon = save.weekWon === wk.week, left = MB.weekDaysLeft(today()), coin = '<i class="dot"></i>';
    $('weekBtn').className = 'hcard' + (wWon ? ' done' : '');
    $('weekBtn').innerHTML = `<em>${t('weekShort')} · ${wWon ? '✓' : `${left} ${t('dayShort')}`}</em><strong>${L(MB.TRACKS.find((d) => d.id === wk.track).name)}${wk.variant ? ' ' + VARIANTS[wk.variant].icon : ''}</strong><small>${wWon ? t('doneShort') : `${coin}+${MB.WEEK_COINS} 🌟`}</small>`;
    const c = challenge(), won = save.chal === today();
    $('chalBtn').className = 'hcard' + (won ? ' done' : '');
    $('chalBtn').innerHTML = `<em>${t('chalShort')}</em><strong>${L(c.text)}</strong><small>${won ? '✓ ' + t('doneShort') : `${coin}+${MB.CHALLENGE_COINS}`}</small>`;
    renderMissBtn();
    planReminder();
    $('shopBtn').hidden = !MB.FEATURES.premium;
    const np = nextPlay(), nn = np.def.tracks.length;
    $('playSub').textContent = `${L(np.def.name)} · ${np.i || save.cupRun ? `${t('raceN')} ${np.i + 1} ${t('ofN')} ${nn}` : L(MB.DIFFS[np.diff].label)}`;
    homeCar(0);
    show('home');
    if (save.daily.last !== today()) renderDaily();
    else if (save.notif === null && save.races >= 2 && bridge && bridge.remind) $('notifAsk').hidden = false;   // proposé une fois, après deux courses
  }

  // Bouton JOUER : la coupe en cours (elle survit à un retour au menu), sinon la prochaine coupe à gagner dans la cylindrée choisie.
  function nextPlay() {
    const r = save.cupRun, open = openCups();
    if (r) {
      const def = open.find((c) => c.id === r.id);
      if (def && save.ccOk[r.diff] && r.i < def.tracks.length) return { def, diff: r.diff, i: r.i, pts: r.pts.slice() };
      save.cupRun = null;
    }
    return { def: open.find((c) => cupMedal(c.id, save.diff) < 3) || open[0], diff: save.diff, i: 0, pts: [0, 0, 0, 0, 0, 0] };
  }
  const keepCup = () => { save.cupRun = cup ? { id: cup.def.id, diff: cup.diff, i: cup.i, pts: cup.pts.slice() } : null; persist(); };
  // Accueil : on passe d'une voiture possédée à l'autre sans ouvrir le garage.
  function homeCar(step) {
    const own = MB.CARS.filter((c) => save.cars.includes(c.id));
    if (step && own.length > 1) {
      save.car = own[(own.findIndex((c) => c.id === save.car) + step + own.length) % own.length].id; persist();
      view.showcase(getTrack(MB.TRACKS[0].id), carSpec().shape, paintHex(), save.look);
    }
    $('hCarName').textContent = L(carSpec().name);
    $('hCarSub').textContent = L(carSpec().tag) + (own.length > 1 ? ` · ${t('swipeCar')}` : '');
    document.querySelectorAll('.harrow').forEach((b) => { b.hidden = own.length < 2; });
  }
  function renderModes() {
    const row = (m, ic, name, desc) => `<button class="row" data-hmode="${m}"><b>${ic}</b><span>${name}<small>${desc}</small></span></button>`;
    $('modeList').innerHTML = row('cups', '🏆', t('mCup'), t('mCupD')) + row('race', '🏁', t('free'), t('mRaceD')) + row('chrono', '⏱', t('modeChrono').replace(/^\S+\s/, ''), t('mChronoD')) + row('duo', '👥', t('modeDuo').replace(/^\S+\s/, ''), t('mDuoD')) + (MB.FEATURES.multi ? row('multi', '🌐', t('mMulti'), t('mMultiD')) : '');
    $('modes').hidden = false;
  }
  // Défi du jour ou de la semaine : la carte de l'accueil est petite, la règle complète s'affiche avant de partir.
  let briefKind = null;
  function renderBrief(kind) {
    briefKind = kind;
    if (kind === 'week') {
      const w = weekly(), wWon = save.weekWon === w.week, left = MB.weekDaysLeft(today());
      $('briefT').textContent = `🗓️ ${t('week')}`; $('briefTxt').textContent = weekLine(w);
      $('briefSub').textContent = wWon ? `✅ ${t('week')} ${t('weekDone')}` : `+${MB.WEEK_COINS} 🪙 + 🌟 · ${left} ${t(left > 1 ? 'days' : 'day')}`;
      $('briefGo').hidden = false;
    } else {
      const c = challenge(), won = save.chal === today();
      $('briefT').textContent = `🎯 ${t('chal')}`; $('briefTxt').textContent = `${L(MB.TRACKS.find((d) => d.id === c.track).name)} · ${L(c.text)}`;
      $('briefSub').textContent = won ? `✅ ${t('chalAgain')}` : `+${MB.CHALLENGE_COINS} 🪙`;
      $('briefGo').hidden = won;
    }
    $('brief').hidden = false;
  }

  // ---------- Missions du jour ----------
  function missions() {
    if (!save.miss || save.miss.day !== today()) {
      const sc = openTracks().some((id) => (MB.TRACKS.find((d) => d.id === id).shortcuts || []).length);
      save.miss = { day: today(), list: MB.dailyMissions(today(), sc).map((m) => ({ kind: m.def.kind, n: m.n, coins: m.coins, p: 0 })), chest: false };
      persist();
    }
    return save.miss;
  }
  const missDef = (m) => MB.MISSIONS.find((d) => d.kind === m.kind);
  const missText = (m) => MB.missionText({ def: missDef(m), n: m.n }, lang);
  const missDone = () => missions().list.filter((m) => m.p >= m.n).length;
  // Après une course terminée : chaque mission avance, et sa récompense tombe dès qu'elle est remplie.
  function missionsAfter(r) {
    const ms = missions(), notes = [];
    for (const m of ms.list) {
      if (m.p >= m.n) continue;
      m.p = Math.min(m.n, m.p + (r[m.kind] || 0));
      if (m.p >= m.n) { save.coins += m.coins; notes.push(`✅ ${missText(m)} +${m.coins} 🪙`); }
    }
    if (notes.length && !ms.chest && missDone() === 3) notes.push(`🎁 ${t('missReady')}`);
    return notes;
  }
  function renderMissBtn() {
    const ms = missions(), n = missDone(), ready = n === 3 && !ms.chest;
const cur = ms.list.find((m) => m.p < m.n);
    $('missHome').className = 'hcard' + (ready ? ' ready' : ms.chest ? ' done' : '');
    $('missHome').innerHTML = `<em>${t('missShort')} ${n}/3</em><strong>${ms.chest ? t('missBye') : ready ? '🎁 ' + t('missChestGo') : missText(cur)}</strong>${cur ? `<div class="bar"><i style="width:${Math.round((cur.p / cur.n) * 100)}%"></i></div>` : `<small>${ms.chest ? '✓ ' + t('doneShort') : ''}</small>`}`;
  }
  function renderMissions() {
    const ms = missions(), ready = missDone() === 3 && !ms.chest;
    $('missList').innerHTML = ms.list.map((m) => `<div class="miss ${m.p >= m.n ? 'on' : ''}"><b>${m.p >= m.n ? '✅' : missDef(m).icon}</b><span>${missText(m)}<i style="--p:${Math.round((m.p / m.n) * 100)}%"></i><small>${m.p} / ${m.n}</small></span><em>+${m.coins} 🪙</em></div>`).join('');
    $('missChestBtn').disabled = !ready;
    $('missChestBtn').textContent = ms.chest ? t('missOpened') : `🎁 ${t('missChest')}`;
    $('missChestMsg').textContent = ms.chest ? '' : ready ? '' : t('missLock');
    $('missions').hidden = false;
  }
  function openChest() {
    const ms = missions();
    if (ms.chest || missDone() < 3) return;
    const gain = MB.chestCoins(today());
    ms.chest = true; save.coins += gain; save.tot.chests = (save.tot.chests || 0) + 1; persist();
    trophiesAfter({}).forEach((n) => toast(n));
    $('coinval').textContent = save.coins;
    renderMissions(); renderMissBtn();
    $('missChestMsg').textContent = `+${gain} ${t('coins')} !`;
    Sound.play('buy', [880, 0.3, 'triangle', 0.16, 1320], 0); buzz(60);
  }

  // ---------- Rappel quotidien (Android) ----------
  // Une seule notification programmée, toujours remplacée : demain, à l'heure où l'on joue d'habitude (entre 10 h et 20 h).
  function planReminder() {
    if (!bridge || !bridge.remind) return;
    if (!save.notif) { bridge.remindOff(); return; }
    const now = new Date(), at = new Date(now);
    at.setDate(now.getDate() + 1); at.setHours(Math.min(20, Math.max(10, now.getHours())), 0, 0, 0);
    const key = MB.dayKey(at), day = MB.nextStreak(save.daily.last, key, save.daily.streak), gift = MB.DAILY_REWARDS[day - 1];
    const fr = lang === 'fr', text = day > 1
      ? (fr ? `🎁 Jour ${day} de ta série : ${gift} pièces t'attendent. Et 3 nouvelles missions !` : `🎁 Day ${day} of your streak: ${gift} coins are waiting. Plus 3 new missions!`)
      : (fr ? `🎁 Ton cadeau du jour et 3 nouvelles missions t'attendent au garage.` : `🎁 Your daily gift and 3 new missions are waiting in the garage.`);
    const newToy = save.toyStart && MB.toysReleased(save.toyStart, key) > MB.toysReleased(save.toyStart, today());
    bridge.remind(at.getTime(), 'Mini Bolides', newToy ? (fr ? `🧸 Un nouveau jouet est caché sur un circuit ! ${text}` : `🧸 A new toy is hidden on a track! ${text}`) : text);
  }
  function setNotif(on) {
    save.notif = on; persist();
    if (on && bridge && bridge.askNotif) bridge.askNotif();
    planReminder();
  }
  window.mbOnNotif = (ok) => { if (!$('settings').hidden) renderSettings(); if (!ok) toast(t('notifBlocked')); };

  function renderDaily() {
    const next = MB.nextStreak(save.daily.last, today(), save.daily.streak);
    $('dailyDays').innerHTML = MB.DAILY_REWARDS.map((c, i) => `<div class="${i + 1 < next ? 'done' : i + 1 === next ? 'now' : ''}">${t('day')} ${i + 1}<br>${c}</div>`).join('');
    $('dailyMsg').textContent = `+${MB.DAILY_REWARDS[next - 1]} ${t('coins')}`;
    $('dailyAd').hidden = !MB.monet.adsAvailable();
    $('daily').hidden = false;
  }
  function takeDaily(mult) {
    const next = MB.nextStreak(save.daily.last, today(), save.daily.streak);
    save.daily = { last: today(), streak: next };
    save.coins += MB.DAILY_REWARDS[next - 1] * mult;
    persist();
    $('daily').hidden = true; $('coinval').textContent = save.coins;
    planReminder();
    if (save.notif === null && save.races >= 2 && bridge && bridge.remind) $('notifAsk').hidden = false;
  }

  // ---------- Course ----------
  // Versions de test seulement : la version Play ne possède ni l'autorisation réseau, ni journalOn à true
  const journalOn = !!(bridge && bridge.journalOn && bridge.journalOn());
  let journal = null;
  function closeJournal(outcome) {
    if (!journal) return;
    const j = journal; journal = null;
    j.audio = Sound.diag();
    try { bridge.sendJournal(JSON.stringify(j.end(outcome))); } catch (e) { /* un journal perdu ne doit jamais gêner la partie */ }
  }
  // Bandeau de diagnostic des versions de test : sans lui, un envoi raté ne se voit pas sur le téléphone
  MB.REEL.note = (text) => { if (journal) journal.error(text); };
  window.mbJournal = (text) => {
    let el = $('journalNote');
    if (!el) { el = document.createElement('div'); el.id = 'journalNote'; el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:99;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.8);color:#fff;font:13px sans-serif;text-align:center;pointer-events:none'; document.body.appendChild(el); }
    el.textContent = text; el.hidden = false;
    clearTimeout(window.mbJournal.t); window.mbJournal.t = setTimeout(() => { el.hidden = true; }, 8000);
  };
  if (journalOn) {
    window.addEventListener('error', (e) => { if (journal) journal.error(`${e.message} ${(e.filename || '').split('/').pop()}:${e.lineno}`); });
    window.addEventListener('unhandledrejection', (e) => { if (journal) journal.error(`promesse : ${e.reason}`); });
    $('gl').addEventListener('webglcontextlost', () => { if (journal) journal.error('contexte WebGL perdu'); });
  }
  // Copie du journal en cours, sans le fermer : appli mise en arrière-plan (elle peut être tuée ensuite) ou souci signalé.
  function copyJournal(why) {
    if (!journal || journal.copied === why) return;
    journal.copied = why; journal.audio = Sound.diag();
    try { bridge.sendJournal(JSON.stringify(journal.end({ fin: why, rang: race && race.position(race.player) }))); } catch (e) { /* jamais gênant pour la partie */ }
  }
  const snapJournal = (label) => { if (journal && !view.onSnap) { const j = journal; view.onSnap = (url) => j.snap(url, label); } };
  const MOOD_MUSIC = { matin: 'cuisine', midi: 'cuisine', minuit: 'cuisine', sable: 'plage', foret: 'foret', neige: 'neige', ville: 'ville', chambre: 'chambre', bain: 'plage', grenier: 'chambre' };
  // Départ demandé par le joueur : écran « Préparation du circuit » affiché d'abord (deux images), puis construction
  // et image de chauffe ; le compte à rebours part ensuite sans à-coup.
  // Course en réseau (js/multi.js) : réglages imposés par l'hôte, puis done() une fois la course prête à partir.
  let netCfg = null, netDone = null;
  function startNetRace(cfg, done) {
    cup = null; chal = null; week = null; netCfg = cfg; netDone = done;
    startRace(cfg.track, null);
  }
  function startRace(trackId, variant) {
    $('loading').hidden = false;
    if (!netDone) netCfg = null;                               // course ordinaire : plus de réglages réseau
    const go = () => requestAnimationFrame(() => requestAnimationFrame(() => { buildRace(trackId, variant); $('loading').hidden = true; const d = netDone; netDone = null; if (d) d(); }));
    view.preload(getTrack(trackId, cup || chal ? null : variant || null)).then(go, go);   // photos des matières du monde, avant de construire
  }
  function buildRace(trackId, variant) {
    const t0 = performance.now();
    closeJournal({ fin: 'recommencée' });
    releaseFingers();
    currentVariant = cup || chal ? null : variant || null;
    const track = getTrack(trackId, currentVariant);
    Sound.song(MOOD_MUSIC[track.def.mood] || 'cuisine');
    Sound.rain(currentVariant === 'pluie');
    currentTrack = trackId;
    view.clearShowcase();
    view.world(track);
    const spec = MB.effectiveCar(save.car, save.ups[save.car]);
    const net = netCfg;
    const solo = trackMode === 'chrono' && !cup && !chal && !week && !net;
    const duo = trackMode === 'duo' && !cup && !chal && !week && !net;
    raceCc = net ? net.diff : cup ? cup.diff : week ? week.cc : save.diff;
    race = new MB.Race({ trackId, def: track.def, track, carSpec: spec, power: spec.power, sens: MB.SENS[save.sens].k, diff: raceCc, assist: save.assist, seed: net ? net.seed : (Date.now() & 0xffff) + 1, solo, toys: auto || net || isCustom(trackId) ? [] : toysFor(trackId, track), champ: solo || net ? null : MB.champOf(trackId), cc: solo ? 1 : undefined, duo, carSpec2: spec, net: net ? net.net : null });   // contre-la-montre toujours en 50 cc : records comparables
    race.track = track;
    if (journalOn && !auto) {
      journal = new MB.Journal(race, { version: bridge.appVersion(), track: trackId, car: save.car, ups: save.ups[save.car], diff: save.diff, sens: save.sens, assist: save.assist, lang, w: innerWidth, h: innerHeight, dpr: devicePixelRatio, ua: navigator.userAgent, date: new Date().toISOString() });
      journal.gpu = view.gpuInfo();
    }
    const p2hex = paintHex() === 0x2f62d9 ? 0xe5352b : 0x2f62d9;   // joueur 2 : bleu (rouge si le joueur 1 est déjà bleu)
    const palette = MB.PAINTS.map((p) => p.hex).filter((h) => h !== paintHex() && h !== 0xd9dee6 && !(duo && h === p2hex));
    view.bindRace(race, { player: paintHex(), player2: p2hex, rivals: palette, look: save.look });
    $('hud').classList.toggle('duo', duo); $('hud2').hidden = !duo;
    $('itemBtn2').className = 'empty'; $('itemBtn2').textContent = ''; input2.item = false;
    drawMap(track);
    ghost = solo ? { best: save.ghosts[trackKey()] || null, hadGhost: !!save.ghosts[trackKey()], lapStart: 0, seg: 0, pts: [], laps: [], next: 0, record: false } : null;
    view.setGhost(ghost && ghost.best ? ghost.best.shape : null, ghost && ghost.best ? ghost.best.hex : 0);
    $('posPill').hidden = solo;
    pendingCoins = 0;
    rec = []; recT = -99; replay = null;
    stat = { boosts: 0, walls: 0, l2: 0, sc: 0, marbles: 0, items: 0, lastLapPos: 0, lap1Pos: 0, ledAll: true, maxDrift: 0, driftT: null }; slowT = 0; timeK = 1; finFx = false; lastPos = race.cars.length; tickT = 0;
    phase = 'race'; paused = false;
    show('hud');
    $('hint').textContent = chal ? `${t('chal')} : ${L(chal.text)}` : week ? `${t('week')} : ${t('weekWin')} ${L(week.rule.text)}` : t('how');
    $('hint').hidden = save.seen && !chal && !week;
    $('ticker').className = '';
    $('itemBtn').className = 'empty'; $('itemBtn').textContent = '';
    updateHud(true);
    Sound.init();
    view.warm();                                               // première image (ombres, textures) avant le 3-2-1
    skipGap = true;                                            // le temps de chargement n'est pas une image lente
    if (journal) journal.meta.chargement_ms = Math.round(performance.now() - t0);
  }

  function drawMap(tr) {
    const c = $('map'), g = c.getContext('2d'), R = c.width;
    let a = 1e9, b = -1e9, d = 1e9, e = -1e9;
    for (let i = 0; i < tr.count; i++) { a = Math.min(a, tr.px[i]); b = Math.max(b, tr.px[i]); d = Math.min(d, tr.pz[i]); e = Math.max(e, tr.pz[i]); }
    const s = (R - 16) / Math.max(b - a, e - d), ox = (R - (b - a) * s) / 2 - a * s, oz = (R - (e - d) * s) / 2 - d * s;
    map.proj = (x, z) => [x * s + ox, z * s + oz];
    const off = document.createElement('canvas'); off.width = off.height = R;
    const o = off.getContext('2d');
    o.lineWidth = 7; o.lineJoin = 'round'; o.strokeStyle = 'rgba(255,255,255,.92)'; o.beginPath();
    for (let i = 0; i < tr.count; i += 2) { const p = map.proj(tr.px[i], tr.pz[i]); i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1]); }
    o.closePath(); o.stroke();
    o.lineWidth = 3; o.strokeStyle = '#4d5060'; o.stroke();
    for (const p of tr.shortcuts) {
      o.beginPath();                                           // tracé comme le circuit : une branche de la même route
      for (let i = 0; i < p.count; i += 2) { const q = map.proj(p.px[i], p.pz[i]); i ? o.lineTo(q[0], q[1]) : o.moveTo(q[0], q[1]); }
      o.lineWidth = 6; o.strokeStyle = 'rgba(255,255,255,.92)'; o.stroke();
      o.lineWidth = 2.5; o.strokeStyle = '#4d5060'; o.stroke();
    }
    map.bg = off; map.g = g;
  }
  function map() {}

  const hudText = {};
  let frameDt = 1 / 60, timeK = 1;
  let hudDrift = false, hudSpeed = -1, mapFrame = 0;
  function setText(id, v) { if (hudText[id] !== v) { hudText[id] = v; $(id).textContent = v; } }

  function updateHud(force) {
    const p = race.player;
    const pos = race.position(p);
    if (race.duo) {
      const q = race.player2, qp = race.position(q);
      setText('posVal2', qp); setText('posSuf2', placeSuf(qp)); setText('lapVal2', `${race.lap(q)}/${race.laps}`); setText('coinsVal2', q.coins);
    }
    setText('posVal', pos);
    setText('posSuf', placeSuf(pos));
    setText('lapVal', `${race.lap(p)}/${race.laps}`);
    setText('timeVal', fmt(Math.max(race.clock, 0)));
    setText('coinsVal', race.coinCount);
    if (p.drifting || hudDrift) $('driftBar').style.transform = `scaleX(${Math.min(p.charge / MB.DRIFT.L2, 1)})`;
    hudDrift = p.drifting;
    if (p.drifting) { if (stat.driftT === null) stat.driftT = race.clock; stat.maxDrift = Math.max(stat.maxDrift, race.clock - stat.driftT); } else stat.driftT = null;   // plus long drift sans lâcher
    const dc = p.drifting ? (p.charge >= MB.DRIFT.L2 ? 'on l2' : p.charge >= MB.DRIFT.L1 ? 'on l1' : 'on') : '';
    if ($('driftWrap').className !== dc) $('driftWrap').className = dc;
    const fast = p.v / p.spec.vmax, wind = p.boost > 0 || p.magnet > 0 ? Math.min(0.5 + p.boost * 0.3, 1) : p.draft > 0 ? 0.25 + p.draft * 0.25 : fast > 0.86 ? 0.16 : 0;
    const sp = view.calm ? 0 : Math.round(wind * 12) / 12;
    if (sp !== hudSpeed) { hudSpeed = sp; $('speed').style.opacity = sp; }
    // Un rival qui te double le fait savoir, sans bavarder toute la course.
    if (pos > lastPos && race.clock > tickT && race.clock > 4) {
      const rival = race.ranked[pos - 2];
      if (rival && !rival.isPlayer) { $('ticker').textContent = `${rival.name} : ${L(MB.RIVAL_LINES[rival.id % MB.RIVAL_LINES.length])}`; $('ticker').className = 'on'; tickT = race.clock + 9; setTimeout(() => { $('ticker').className = ''; }, 2200); }
    }
    // Rival dépassé : coup de klaxon et petite bulle au-dessus de sa voiture.
    if (pos < lastPos && race.clock > 4 && !race.solo && race.clock > honkT) {
      const loser = race.ranked[pos];
      if (loser && !loser.isPlayer) {
        honkT = race.clock + 2.5;
        view.say(loser.id, L(MB.RIVAL_SULK[(loser.id + Math.floor(race.clock)) % MB.RIVAL_SULK.length]));
        Sound.horn(0.07, loser.id % 2 === 0);
      }
    }
    lastPos = pos;
    if ((mapFrame = (mapFrame + 1) % 3) && !force) return;     // la mini-carte n'a pas besoin de 60 images par seconde
    const g = map.g, R = g.canvas.width;
    g.clearRect(0, 0, R, R); g.drawImage(map.bg, 0, 0);
    for (const c of race.cars) {
      const q = map.proj(c.x, c.z);
      g.fillStyle = c.isPlayer ? '#ffd23f' : '#e5352b';
      g.strokeStyle = '#fff'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(q[0], q[1], c.isPlayer ? 6 : 4, 0, 7); g.fill(); g.stroke();
    }
  }

  function flash(text, cls) {
    const el = $('flash');
    el.textContent = text; el.className = ''; void el.offsetWidth; el.className = 'show ' + (cls || '');
  }

  function flash2(text, cls) {
    const el = $('flash2');
    el.textContent = text; el.className = ''; void el.offsetWidth; el.className = 'show ' + (cls || '');
  }
  // À deux : ce qui arrive au joueur 2 s'affiche dans sa moitié d'écran (en haut, retournée).
  function duoEvent(e) {
    const q = race.player2, it = e.item && MB.ITEMS[e.item];
    switch (e.t) {
      case 'lap': flash2(`${t('lap')} ${e.n}/${race.laps}`); Sound.play('lap', [660, 0.22, 'triangle', 0.18, 990], 0); break;
      case 'coin': Sound.play('coin', [1320, 0.09, 'triangle', 0.14, 1760]); break;
      case 'gotItem': { const b = $('itemBtn2'); b.className = 'full'; b.textContent = it.icon; flash2(`${it.icon} ${L(it.name)}`); break; }
      case 'item': if (e.car === q.id) { const b = $('itemBtn2'); b.className = 'empty'; b.textContent = ''; flash2(`${it.icon} ${L(it.name)} !`, 'boost'); } break;
      case 'boost': if (e.car === q.id) flash2(e.big ? 'SUPER TURBO !' : 'TURBO !', 'boost'); break;
      case 'spin': flash2(lang === 'fr' ? 'Oups !' : 'Oops!'); break;
      case 'shortcut': flash2(t('shortcut'), 'boost'); break;
      case 'draftKick': case 'pad': flash2(lang === 'fr' ? 'TURBO !' : 'BOOST!', 'boost'); break;
      case 'humanDone': flash2(`${race.position(q)}${placeSuf(race.position(q))} !`, 'big'); break;
      case 'count': flash2(String(e.n), 'big'); break;
      case 'go': flash2('GO !', 'big'); break;
    }
  }

  function handleEvents() {
    if (journal) journal.note(race.events);
    for (const e of race.events) {
      if (race.duo) {
        if (e.pn === 2) { duoEvent(e); continue; }
        if ((e.t === 'count' && e.n >= 1 && e.n <= 3) || e.t === 'go' || ((e.t === 'boost' || e.t === 'item') && e.car === race.player2.id)) duoEvent(e);
        if ((e.t === 'boost' || e.t === 'item') && e.car === race.player2.id) continue;
      }
      switch (e.t) {
        case 'count': if (e.n >= 1 && e.n <= 3) { flash(String(e.n), 'big'); Sound.play('count', [440, 0.14, 'square', 0.14], 0); } break;
        case 'go': if (journal) { const a = Sound.diag(); window.mbJournal(`Son : ${a.actif ? 'activé' : 'coupé'}, ${a.etat}, ${a.sons} sons${a.erreurs.length ? ' · ' + a.erreurs[0] : ''}`); }
          flash('GO !', 'big'); Sound.play('go', [880, 0.4, 'square', 0.18], 0); $('hint').hidden = true; if (!save.seen) { save.seen = true; persist(); }
          { const ch = race.cars.find((c) => c.champ), r0 = race;    // le champion du circuit se présente
            if (ch && !save.figs[ch.id]) setTimeout(() => { if (race === r0) { $('ticker').textContent = `👑 ${ch.name} ${t('champTick')} · ${save.figWins[ch.id] || 0}/${MB.FIG_WINS}`; $('ticker').className = 'on'; tickT = race.clock + 6; setTimeout(() => { $('ticker').className = ''; }, 3200); } }, 500); }
          { const fresh = race.toys.find((y) => !y.dup);                 // deux courses de suite, on prévient qu'un nouveau jouet attend ici
            if (fresh && (save.toyHint[fresh.id] || 0) < 2) {
              save.toyHint[fresh.id] = (save.toyHint[fresh.id] || 0) + 1; persist();
              const r0 = race; setTimeout(() => { if (race === r0 && !fresh.taken) flash(t('toyHint')); }, 1600);
            } }
          break;
        case 'toy': {
          const y = MB.TOYS.find((q) => q.id === e.id);
          if (!y) break;
          view.toyFx(e.id); buzz(60);
          if (e.dup) {                                                    // doublon : quelques pièces, une fois par jour sur ce circuit
            save.dupDone = { [`${today()}|${currentTrack}`]: 1, ...Object.fromEntries(Object.entries(save.dupDone).filter(([k]) => k.startsWith(today()))) };
            save.coins += MB.TOY_DUP_COINS; persist();
            Sound.play('coin', [1320, 0.09, 'triangle', 0.14, 1760]);
            flash(`${y.icon} ${t('toyDup')} ${L(y.name)} · +${MB.TOY_DUP_COINS} 🪙`);
            break;
          }
          save.toys[y.id] = Date.now(); delete save.toyAt[y.id]; save.coins += MB.TOY_COINS; persist();
          Sound.play('upgrade', [660, 0.2, 'triangle', 0.16, 1180], 0);
          const tn = trophiesAfter({});
          flash(`${y.icon} ${t('toyFound')} ${L(y.name)} · ${Object.keys(save.toys).length}/${MB.TOYS.length} · +${MB.TOY_COINS} 🪙`);
          if (tn.length) setTimeout(() => flash(tn[0]), 2200);
          break;
        }
        case 'coin': Sound.play('coin', [1320, 0.09, 'triangle', 0.14, 1760]); view.coinFx(); break;
        case 'lap': flash(`${t('lap')} ${e.n}/${race.laps}`); Sound.play('lap', [660, 0.22, 'triangle', 0.18, 990], 0); view.lapFx(); { const lp = race.position(race.player); if (e.n === 2) stat.lap1Pos = lp; if (lp !== 1) stat.ledAll = false; } if (e.n === race.laps) { stat.lastLapPos = race.position(race.player); if (Sound.tunes) Sound.tunes.tempo(1.07); } break;   // dernier tour : la musique presse
        case 'charge': Sound.play(e.lvl === 2 ? 'charge2' : 'charge1', [e.lvl === 2 ? 990 : 660, 0.1, 'triangle', 0.12], 0); buzz(12); break;
        case 'jump': Sound.play('jump', [320, 0.3, 'triangle', 0.14, 760]); break;
        case 'land': Sound.play('land', [120, 0.14, 'square', 0.1]); buzz(16); break;
        case 'draftFull': Sound.play('charge1', [660, 0.1, 'triangle', 0.12], 0); buzz(10); coach('draft'); break;
        case 'draftKick': stat.drafts = (stat.drafts || 0) + 1; flash(lang === 'fr' ? 'ASPIRATION !' : 'SLIPSTREAM!', 'boost'); Sound.play('boost', [180, 0.5, 'sawtooth', 0.14, 700]); buzz(25); break;
        case 'pad': flash('TURBO !', 'boost'); Sound.play('boost', [180, 0.5, 'sawtooth', 0.14, 700]); buzz(30); break;
        case 'shortcut': stat.sc++; save.scTracks[currentTrack] = 1; flash(t('shortcut'), 'boost'); Sound.play('shortcut', [520, 0.25, 'triangle', 0.15, 1040], 0); break;
        case 'boost': if (e.car === race.player.id) { stat.boosts++; if (e.big) stat.l2++; flash(e.big ? 'SUPER TURBO !' : 'TURBO !', 'boost'); Sound.play('boost', [180, 0.5, 'sawtooth', 0.14, 700]); buzz(30); } break;
        case 'wall': stat.walls++; Sound.play('wall', [110, 0.12, 'square', 0.08], 0.12); buzz(12); view.shake(0.5); break;
        case 'bump': Sound.play('bump', [150, 0.08, 'square', 0.08], 0.12); buzz(8); break;
        case 'spin': flash(e.why === 'bille' ? (lang === 'fr' ? 'Bille dans les roues !' : 'Marble hit!') : lang === 'fr' ? 'Ça colle !' : 'Sticky!'); Sound.play('spin', [300, 0.5, 'sawtooth', 0.12, 80], 0); buzz(70); view.shake(1.2); break;
        case 'gotItem': { coach('item'); const b = $('itemBtn'); b.className = 'full'; b.textContent = MB.ITEMS[e.item].icon; flash(`${MB.ITEMS[e.item].icon} ${L(MB.ITEMS[e.item].name)}`); view.pickup(); Sound.play('item', [1100, 0.16, 'triangle', 0.1, 1480], 0); buzz(16); break; }
        case 'item': view.itemFx(e.car, e.item);
          if (e.car === race.player.id) {
            stat.items++;
            const b = $('itemBtn'); b.className = 'empty'; b.textContent = '';
            flash(`${MB.ITEMS[e.item].icon} ${L(MB.ITEMS[e.item].name)} !`, 'boost');
            if (e.item === 'elastique') { Sound.play('elastique', [120, 0.7, 'sawtooth', 0.18, 980], 0); buzz(45); view.shake(0.6); }
            else if (e.item === 'recharge') { Sound.play('boost', [180, 0.5, 'sawtooth', 0.14, 700]); buzz(35); view.shake(0.4); }
            else Sound.play('use', [520, 0.25, 'triangle', 0.16, 1040]);
          } break;
        case 'splat': view.splat(e.x, e.z); break;
        case 'plot': if (e.car === race.player.id) { flash(lang === 'fr' ? 'Aïe, le plot !' : 'Ouch, the post!'); Sound.play('bump', [110, 0.12, 'square', 0.12], 0.1); buzz(40); view.shake(0.5); } break;
        case 'marbleHit': view.splat(e.x, e.z, 0x3f8fe0); if (e.by === race.player.id && e.car !== race.player.id) { stat.marbles++; flash(lang === 'fr' ? 'Touché !' : 'Hit!', 'boost'); Sound.play('bump', [150, 0.08, 'square', 0.08], 0.12); buzz(20); } break;
        case 'marbleBounce': if (!marbleT || race.clock - marbleT > 0.15) { marbleT = race.clock; Sound.play('tap', [900, 0.04, 'triangle', 0.06]); } break;
        case 'pop': view.pop(e.x, e.z); if (e.car === race.player.id) { flash(lang === 'fr' ? 'Bulle éclatée, sauvé !' : 'Bubble burst, saved!', 'boost'); Sound.play('pop', [900, 0.18, 'sine', 0.16, 240]); buzz(30); } break;
        case 'humanDone': { const q = race.position(race.player); flash(`${q}${placeSuf(q)} !`, 'big'); break; }
        case 'finish': startReplay(); break;
      }
    }
    race.events.length = 0;
  }

  // ---------- Première course guidée : chaque conseil une seule fois, au moment où il sert ----------
  const COACH = {
    steer: ['👆 Glisse le pouce à gauche ou à droite pour tourner', '👆 Slide your thumb left or right to steer'],
    drift: ['↪️ Virage ! Braque fort et garde : tu drifts', '↪️ Corner! Steer hard and hold to drift'],
    release: ['🔥 Relâche maintenant : TURBO !', '🔥 Release now: TURBO!'],
    item: ['🎁 Touche le bouton en bas pour utiliser ton bonus', '🎁 Tap the button below to use your bonus'],
    draft: ['💨 Dans l\'aspiration ! Déboîte pour doubler avec un coup de fouet', '💨 In the slipstream! Pull out to overtake with a kick'],
    draftNear: ['💨 Reste dans sa file : l\'aspiration se charge', '💨 Stay in its line: the slipstream is charging'],
    champ: ['👑 La voiture couronnée est le champion du circuit. Finis 3 fois devant elle pour gagner sa figurine !', '👑 The crowned car is this track\'s champion. Beat it 3 times to win its figurine!'],
    cc_normal: ['🚀 100 cc : tout le monde va plus vite. Lâche le doigt un peu avant les virages serrés.', '🚀 100cc: everyone is faster. Lift your thumb a bit before tight corners.'],
    cc_expert: ['🔥 150 cc : ça va très vite ! Le drift devient ton meilleur ami.', '🔥 150cc: it\'s very fast! Drifting is your best friend.'],
    shortcut: ['»» Longe le bord aux chevrons : raccourci ! Gare aux plots.', '»» Hug the edge at the yellow arrows: shortcut! Mind the posts.'],
  };
  let coachT = null;
  function coach(key) {
    if (!race || race.solo || race.duo || race.net || save.tuto[key]) return;
    save.tuto[key] = 1; persist();
    const el = $('coach'); el.textContent = COACH[key][lang === 'fr' ? 0 : 1]; el.className = 'on';
    clearTimeout(coachT); coachT = setTimeout(() => { el.className = ''; }, COACH[key][0].length > 60 ? 5200 : 3400);
  }
  function coachWatch() {
    const p = race.player, t = race.track;
    if (race.state !== 'run') return;
    // Nouveautés : chacune expliquée une fois, la première fois qu'on la rencontre (même après le tutoriel).
    if (!race.solo && race.clock > 2.5 && race.clock < 3 && race.cc > 1) coach(race.cc > 1.25 ? 'cc_expert' : 'cc_normal');
    if (race.clock > 9 && race.clock < 9.5 && race.cars.some((c) => c.champ)) coach('champ');
    if (p.draft > 0.5 && p.draftT < 0.6) coach('draftNear');
    if (save.tuto.done) return;
    if (race.clock > 0.3) coach('steer');
    if (race.clock > 4 && !save.tuto.drift) { let m = 0; for (let k = 8; k < 26; k++) m = Math.max(m, t.curv[(p.idx + k) % t.count]); if (m > 0.045) coach('drift'); }
    if (p.drifting && p.charge >= MB.DRIFT.L1) coach('release');
    if (!save.tuto.shortcut) for (const q of t.shortcuts) { const d = (q.a - p.idx + t.count) % t.count; if (d > 6 && d < 32 && !p.sc) coach('shortcut'); }
    if (Object.keys(COACH).every((k) => save.tuto[k] || (k === 'shortcut' && !t.shortcuts.length))) { save.tuto.done = save.races >= 1; }
  }

  // ---------- Ralenti de l'arrivée ----------
  // Les poses de toutes les voitures sont gardées 9 s (30 par seconde) ; à la fin, on rejoue le passage de la ligne
  // au ralenti, vu du bord de la piste. Arrivée serrée : arrêt sur image « photo-finish ».
  let rec = [], recT = -99, replay = null;
  const REC_DT = 1 / 30, REC_KEEP = 9;
  function recordFrame() {
    if (race.clock - recT < REC_DT) return;
    recT = race.clock;
    const f = [race.clock];
    for (const c of race.cars) f.push(c.x, c.z, c.h, c.slip, Math.max(c.y, c.ry || 0));
    rec.push(f);
    while (rec.length && rec[0][0] < race.clock - REC_KEEP) rec.shift();
  }
  function startReplay() {
    if (race.duo || race.net) return finishRace();
    const p = race.player, tc = p.time;
    if (!rec.length || !(tc > rec[0][0] + 1)) return finishRace();
    const close = !race.solo && race.cars.some((c) => !c.isPlayer && c.finished && Math.abs(c.time - tc) < 0.3 && c.time < tc + 0.3);
    replay = { t: Math.max(rec[0][0], tc - 1.5), end: Math.min(rec[rec.length - 1][0], tc + 0.5), cross: tc, close, froze: 0 };
    phase = 'replay';
    Sound.engine(false, 0); Sound.draft(0); Sound.skid(0, 0);
    $('replayLabel').textContent = close ? '📸 PHOTO-FINISH' : (lang === 'fr' ? '🎬 RALENTI' : '🎬 REPLAY');
    show('replay');
  }
  function endReplay() {
    if (phase !== 'replay') return;
    replay = null; $('flashWhite').className = '';
    finishRace();
  }
  function replayStep(dt) {
    const r = replay;
    if (r.close && !r.froze && r.t >= r.cross) {            // déclic d'appareil photo : éclair blanc qui s'efface
      r.froze = 1.3; $('flashWhite').className = 'on'; setTimeout(() => { $('flashWhite').className = ''; }, 80);
      Sound.play('tap', [1200, 0.08, 'square', 0.1]);
    }
    if (r.froze > 0) { r.froze -= dt; if (r.froze <= 0) r.froze = -1; }
    else r.t += dt * 0.5;
    if (r.t >= r.end) return endReplay();
    let i = rec.findIndex((f) => f[0] > r.t);
    if (i <= 0) i = 1;
    const a = rec[i - 1], b = rec[i], u = Math.max(0, Math.min(1, (r.t - a[0]) / (b[0] - a[0] || 1)));
    view.replay(a, b, u, race.player.id, r.close, dt);
  }

  // ---------- Contre-la-montre : enregistrement du tour et fantôme ----------
  let ghost = null;
  const GHOST_DT = 0.1;
  function ghostStep() {
    const p = race.player, ls = race.lapStart || 0;
    if (ls !== ghost.lapStart) {                               // un tour vient de se terminer
      const lt = ls - ghost.lapStart, flying = ghost.seg >= 1;
      ghost.laps.push(lt);
      if (flying) {
        const prev = ghost.best;
        if (!prev || lt < prev.t) {
          ghost.best = { t: lt, shape: p.spec.shape, hex: paintHex(), pts: ghost.pts.map((v, i) => (i % 3 === 2 ? Math.round(v * 1000) / 1000 : Math.round(v * 100) / 100)) };
          save.ghosts[trackKey()] = ghost.best; persist(); ghost.record = true;
          flash(prev ? `${t('record')} −${(prev.t - lt).toFixed(2)} s` : `${t('record')} ${fmt(lt)}`, 'boost');
          if (!view.ghostCar) view.setGhost(p.spec.shape, paintHex());
        } else flash(`${fmt(lt)}  +${(lt - prev.t).toFixed(2)} s`);
      }
      ghost.lapStart = ls; ghost.seg++; ghost.pts = []; ghost.next = 0;
    }
    const tt = race.clock - ghost.lapStart;
    while (ghost.next <= tt && race.state === 'run') { ghost.pts.push(p.x, p.z, p.h); ghost.next += GHOST_DT; }
    // Le fantôme roule à partir du 2e tour, sur le meilleur tour lancé.
    const b = ghost.best, f = tt / GHOST_DT, i = Math.floor(f), n = b ? b.pts.length / 3 : 0;
    if (!b || ghost.seg < 1 || i + 1 >= n || race.playerFinished) return view.ghostAt(0, 0, 0, false);
    const u = f - i, q = b.pts, a = i * 3, c = a + 3;
    view.ghostAt(q[a] + (q[c] - q[a]) * u, q[a + 1] + (q[c + 1] - q[a + 1]) * u, q[a + 2] + MB.angleDiff(q[c + 2], q[a + 2]) * u, true);
  }

  // ---------- Cylindrées ----------
  // Chaque victoire compte pour la cylindrée courante ; assez de victoires ouvrent la suivante.
  const CC = Object.keys(MB.DIFFS);
  const ccNext = (k) => CC[CC.indexOf(k) + 1];
  function ccAfter(pos) {
    if (pos !== 1) return [];
    const k = raceCc, n = (save.ccWins[k] = (save.ccWins[k] || 0) + 1), nx = ccNext(k);
    if (!nx || save.ccOk[nx] || n < MB.DIFFS[nx].unlock) return [];
    save.ccOk[nx] = 1; save.ccNew = nx;
    return [`🔓 ${L(MB.DIFFS[nx].label)} ${t('ccOpen')}`];
  }
  const cupMedal = (id, k) => (save.cupCc[id] || {})[k] || 0;
  const cupWins = () => MB.CUPS.reduce((a, c) => a + CC.filter((k) => cupMedal(c.id, k) === 3).length, 0);
  function ccButtons() {
    return CC.map((k, i) => {
      const open = !!save.ccOk[k], prev = CC[i - 1], need = MB.DIFFS[k].unlock, got = prev ? Math.min(need, save.ccWins[prev] || 0) : 0;
      const nw = save.ccNew === k ? `<em class="new">${t('newTag')}</em>` : '';
      return `<button data-diff="${k}" class="${save.diff === k ? 'sel' : ''}" ${open ? '' : 'disabled'}>${nw}${open ? '' : '🔒 '}${L(MB.DIFFS[k].label)}${open ? '' : `<small>${got}/${need} 🏆</small>`}</button>`;
    }).join('');
  }

  // ---------- Rivaux champions et figurines ----------
  // Battre le champion du circuit (finir devant lui) le rapproche de sa figurine.
  function champAfter(pos) {
    const ch = race.cars.find((c) => c.champ);
    if (!ch || save.figs[ch.id]) return [];
    if (race.position(ch) < pos) return [`👑 ${ch.name} ${t('champWon')}`];
    const n = (save.figWins[ch.id] = (save.figWins[ch.id] || 0) + 1), fig = MB.FIGS.find((f) => f.rival === ch.id);
    if (n < MB.FIG_WINS) return [`👑 ${ch.name} ${t('champBeat')} ${n}/${MB.FIG_WINS}`];
    save.figs[ch.id] = Date.now(); save.coins += MB.FIG_COINS;
    return [`${fig.icon} ${t('figGot')} ${ch.name}, ${L(fig.title)} ! +${MB.FIG_COINS} 🪙`];
  }

  // ---------- Trophées ----------
  // Met à jour les totaux, débloque ce qui est atteint, crédite les pièces ; renvoie les lignes à afficher.
  function trophiesAfter(r, earned) {
    if (r.done) { save.tot.coins += earned; save.tot.turbos += stat.boosts; save.tot.marbles += stat.marbles; save.tracksRaced[currentTrack] = 1; if (!r.solo && r.pos === 1) save.tot.wins++; }
    const out = [];
    for (const tr of MB.TROPHIES) {
      if (!save.troph[tr.id]) {
        if (!tr.ok(r, save)) continue;
        save.troph[tr.id] = Date.now();
        const tier = MB.trophyTier(tr, save), gain = tr.coins * tier;
        save.trophT[tr.id] = tier; save.coins += gain;
        out.push(`${tr.icon} ${t('trophy')}${tr.tiers ? ' ' + L(MB.TIER_NAMES[tier - 1]) : ''} : ${L(tr.name)} +${gain} 🪙`);
        continue;
      }
      // Palier supérieur atteint : argent puis or, chacun récompensé à son tour.
      const was = save.trophT[tr.id] || 1, tier = MB.trophyTier(tr, save);
      if (tier <= was) continue;
      let gain = 0; for (let k = was + 1; k <= tier; k++) gain += tr.coins * k;
      save.trophT[tr.id] = tier; save.coins += gain;
      out.push(`${tr.icon} ${t('trophy')} ${L(MB.TIER_NAMES[tier - 1])} : ${L(tr.name)} +${gain} 🪙`);
    }
    if (out.length) { persist(); Sound.play('upgrade', [660, 0.2, 'triangle', 0.16, 1180], 0); }
    return out;
  }
  function toast(text) { window.mbJournal ? window.mbJournal(text) : flash(text); }
  // Salle des trophées : à l'ouverture, on regarde le dernier trophée gagné.
  let tIdx = -1;
  function renderTrophies() {
    const got = MB.TROPHIES.filter((x) => save.troph[x.id]);
    $('trophyCount').textContent = `${got.length} / ${MB.TROPHIES.length} · 🧸 ${Object.keys(save.toys).length} / ${MB.TOYS.length} · 👑 ${Object.keys(save.figs).length} / ${MB.FIGS.length}`;
    if (tIdx < 0) {
      const last = got.reduce((a, x) => (!a || (+save.troph[x.id] || 0) > (+save.troph[a.id] || 0) ? x : a), null);
      tIdx = last ? MB.TROPHIES.indexOf(last) : 0;
    }
    const tiers = {};
    for (const x of MB.TROPHIES) tiers[x.id] = MB.trophyTier(x, save);
    toyHunt();
    view.showTrophies({ tiers, paliers: MB.TROPHIES.filter((x) => x.tiers).map((x) => x.id), toys: Object.keys(save.toys), released: MB.toysReleased(save.toyStart, today()), figs: Object.keys(save.figs).map(Number), gold: Object.keys(save.goldToys) }, tIdx);
    show('trophies');
    trophyCard();
  }
  function trophyCard() {
    const x = MB.TROPHIES[tIdx], when = save.troph[x.id], tier = MB.trophyTier(x, save), fr = lang === 'fr';
    $('tName').textContent = `${when ? (x.tiers ? ['🥉', '🥈', '🥇'][tier - 1] : x.icon) + ' ' : ''}${L(x.name)}`;
    $('tDesc').textContent = L(x.desc);
    // Trophée à paliers : palier atteint, total, et barre vers le palier suivant.
    const bar = $('tBar');
    if (x.tiers && when) {
      const n = x.count(save), next = x.tiers[tier], prev = x.tiers[tier - 1];
      $('tDesc').textContent = `${fr ? 'Palier' : ''} ${L(MB.TIER_NAMES[tier - 1])}${fr ? '' : ' tier'} · ${n.toLocaleString(fr ? 'fr-FR' : 'en-GB')} ${L(x.unit)}`;
      bar.hidden = !next;
      if (next) bar.firstChild.style.width = `${Math.round((100 * (n - prev)) / (next - prev))}%`;
      if (next) { $('tState').textContent = `${['🥈', '🥇'][tier - 1]} ${L(MB.TIER_NAMES[tier])} ${fr ? 'à' : 'at'} ${next.toLocaleString(fr ? 'fr-FR' : 'en-GB')} ${L(x.unit)} · +${x.coins * (tier + 1)} 🪙`; $('tState').className = 'tstate'; }
      else { $('tState').textContent = fr ? '🥇 Palier or atteint !' : '🥇 Gold tier reached!'; $('tState').className = 'tstate on'; }
      $('tChips').innerHTML = chipsHtml();
      return;
    }
    bar.hidden = true;
    const date = +when > 1e12 ? new Date(+when).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' }) : '';
    $('tState').textContent = when ? (lang === 'fr' ? `✓ Gagné${date ? ' le ' + date : ''} · +${x.coins} 🪙` : `✓ Won${date ? ' on ' + date : ''} · +${x.coins} 🪙`) : (lang === 'fr' ? `🔒 À gagner · +${x.coins} 🪙` : `🔒 To win · +${x.coins} 🪙`);
    $('tState').className = `tstate${when ? ' on' : ''}`;
    $('tChips').innerHTML = chipsHtml();
  }
  const chipsHtml = () => MB.TROPHIES.map((y, i) => `<button data-tsel="${i}" class="${save.troph[y.id] ? 'on' : ''}${i === tIdx ? ' sel' : ''}" aria-label="${L(y.name)}">${save.troph[y.id] ? y.icon : '🔒'}</button>`).join('');
  function trophyGo(i) {
    tIdx = (i + MB.TROPHIES.length) % MB.TROPHIES.length;
    view.selectTrophy(tIdx); trophyCard();
    Sound.play('tap', [660, 0.05, 'triangle', 0.06]);
  }

  function finishSolo() {
    const p = race.player, id = currentTrack;
    closeJournal({ fin: 'arrivée', mode: 'contre-la-montre', temps: p.time, meilleur_tour: race.bestLap, pieces: race.coinCount, murs: stat.walls });
    phase = 'result';
    Sound.engine(false, 0); Sound.draft(0);
    pendingCoins = race.coinCount; save.coins += pendingCoins; save.races++; save.sinceAd++;
    const key = trackKey();
    if (race.bestLap && (!save.best[key] || race.bestLap < save.best[key])) save.best[key] = race.bestLap;
    const tnotes = trophiesAfter({ done: true, solo: true, coins: race.coinCount, l2: stat.l2, ghostBeat: ghost.record && ghost.hadGhost, maxDrift: stat.maxDrift }, pendingCoins);
    tnotes.push(...missionsAfter({ races: 1, boosts: stat.boosts, l2: stat.l2, coins: race.coinCount, sc: stat.sc, items: stat.items, clean: stat.walls <= 2 ? 1 : 0 }));
    persist();
    $('resTitle').textContent = `⏱ ${fmt(p.time)}`;
    $('resTrack').textContent = trackLabel();
    $('resStars').textContent = ghost.record ? `👻 ${t('record')}` : '';
    $('resNote').textContent = tnotes.join(' · '); $('resNote').hidden = !tnotes.length;
    const best = Math.min(...ghost.laps.slice(1));
    $('resRows').innerHTML = ghost.laps.map((lt, i) => `<li class="${i > 0 && lt === best ? 'me' : ''}"><b>${i + 1}</b><span>${t('lap')} ${i + 1}${i === 0 ? (lang === 'fr' ? ' (départ arrêté)' : ' (standing start)') : ''}</span><em>${fmt(lt)}</em></li>`).join('');
    $('resCoins').textContent = `+${pendingCoins} ${t('coins')}  ·  👻 ${save.ghosts[key] ? fmt(save.ghosts[key].t) : '-'}`;
    $('resDouble').hidden = true;
    $('resNext').textContent = t('again');
    show('result');
    buzz(40);
  }

  // À deux : classement des deux joueurs, sans pièces ni étoiles (c'est pour le plaisir de la revanche).
  function finishDuo() {
    phase = 'result';
    Sound.engine(false, 0); Sound.draft(0);
    closeJournal({ fin: 'duo' });
    const a = race.position(race.player), b = race.position(race.player2), win = a < b ? 1 : 2;
    pendingCoins = 0;
    $('resTitle').textContent = `${win === 1 ? '🔴' : '🔵'} ${t('duoWin').replace('{n}', win)}`;
    $('resTrack').textContent = trackLabel();
    $('resStars').textContent = '';
    $('resNote').hidden = true;
    const who = (c) => (c.pn === 1 ? `🔴 ${t('duoP')} 1` : c.pn === 2 ? `🔵 ${t('duoP')} 2` : c.name);
    $('resRows').innerHTML = race.ranked.map((c, i) => `<li class="${c.isPlayer ? 'me' : ''}"><b>${i + 1}</b><span>${who(c)}</span><em>${fmt(c.time)}</em></li>`).join('');
    $('resCoins').textContent = `🪙 ${race.player.coins} – ${race.player2.coins} 🪙`;
    $('resDouble').hidden = true;
    $('resNext').textContent = t('duoAgain');
    show('result');
    buzz(40);
  }

  // En réseau : classement publié par l'hôte, pièces ramassées gagnées, rien d'autre (ni étoiles ni trophées).
  function finishNet() {
    phase = 'result';
    Sound.engine(false, 0); Sound.draft(0);
    const pos = race.position(race.player);
    closeJournal({ fin: 'réseau', rang: pos, temps: race.player.time });
    pendingCoins = race.coinCount;
    save.coins += pendingCoins; save.races++; persist();
    netBanner('');
    $('resTitle').textContent = race.player.dnf ? '—' : `${pos}${placeSuf(pos)}`;
    $('resTrack').textContent = trackLabel();
    $('resStars').textContent = '';
    $('resNote').hidden = true;
    $('resRows').innerHTML = multi.resultRows(race);
    $('resCoins').textContent = `+${pendingCoins} ${t('coins')}`;
    $('resDouble').hidden = true;
    $('resNext').textContent = multi.againLabel();
    show('result');
    buzz(40);
  }
  // Quitter la course sans revenir à l'accueil (retour au salon du jeu à plusieurs).
  function netIdle() {
    if (race) view.track = null;
    closeJournal({ fin: 'abandon' });
    phase = 'menu'; race = null; cup = null; chal = null; week = null; netCfg = null; paused = false;
    Sound.engine(false, 0); Sound.draft(0); Sound.song('menu'); Sound.rain(false);
    view.showcase(getTrack(MB.TRACKS[0].id), carSpec().shape, paintHex(), save.look);
  }
  let netHint = '';
  function netBanner(text) { if (text === netHint) return; netHint = text; $('hint').textContent = text; $('hint').hidden = !text; }
  let multi = null;
  function finishRace() {
    if (race.net) return finishNet();
    if (race.duo) return finishDuo();
    if (race.solo) return finishSolo();
    const p = race.player, pos = race.position(p), id = currentTrack;
    closeJournal({ fin: 'arrivée', rang: pos, temps: p.time, meilleur_tour: race.bestLap, pieces: race.coinCount, murs: stat.walls, turbos: stat.boosts });
    phase = 'result';
    Sound.engine(false, 0); Sound.draft(0);
    const opened = openCups().length, gain = MB.DIFFS[save.diff].gain;
    const prize = Math.round(MB.RACE_COINS[pos - 1] * gain);
    pendingCoins = prize + race.coinCount;
    save.coins += pendingCoins;
    const key = trackKey();
    if (race.bestLap && (!save.best[key] || race.bestLap < save.best[key])) save.best[key] = race.bestLap;
    const stars = MB.starsFor(pos, race.coinCount);
    const worldsBefore = openWorlds().length;
    if (!isCustom(id) && stars > (save.stars[key] || 0)) save.stars[key] = stars;   // chaque mode (normal, nuit, pluie, inverse) a ses étoiles
    if (cup) race.ranked.forEach((c, i) => { cup.pts[c.id] += MB.POINTS[i]; });
    save.races++; save.sinceAd++;
    const notes = [];
    if (chal) {
      const met = MB.challengeMet(chal, { pos, coins: race.coinCount, boosts: stat.boosts, walls: stat.walls });
      if (met && save.chal !== today()) { save.chal = today(); save.coins += MB.CHALLENGE_COINS; }
      notes.push(met ? `${t('chalWin')} ! +${MB.CHALLENGE_COINS} 🪙` : t('chalFail'));
    }
    if (week) {
      const met = MB.weeklyMet(week, { pos, coins: race.coinCount, boosts: stat.boosts, walls: stat.walls, items: stat.items, ledAll: stat.ledAll });
      if (met && save.weekWon !== week.week) {
        save.weekWon = week.week; save.coins += MB.WEEK_COINS;
        const y = MB.TOYS.find((q) => save.toys[q.id] && !save.goldToys[q.id]);
        if (y) save.goldToys[y.id] = week.week;
        notes.push(`${t('weekWon')} +${MB.WEEK_COINS} 🪙${y ? ` · 🌟 ${L(y.name)} ${t('golden')}` : ''}`);
      } else notes.push(met ? t('weekWon') : `${t('weekFail')} (${L(week.rule.text)})`);
    }
    if (openCups().length > opened) notes.push(t('unlocked'));
    if (openWorlds().length > worldsBefore) notes.push(`${t('worldOpen')} ${openWorlds().slice(worldsBefore).map((w) => w.icon + ' ' + L(w.name)).join(', ')} !`);
    notes.push(...champAfter(pos));
    notes.push(...ccAfter(pos));
    const second = race.ranked[1], gap = pos === 1 && second && second.time ? second.time - p.time : 99;
    notes.push(...trophiesAfter({ done: true, solo: false, pos, walls: stat.walls, l2: stat.l2, coins: race.coinCount, lastLapPos: stat.lastLapPos, diff: save.diff, variant: currentVariant, gap, lap1Pos: stat.lap1Pos, ledAll: stat.ledAll, maxDrift: stat.maxDrift }, pendingCoins));
    notes.push(...missionsAfter({ races: 1, boosts: stat.boosts, l2: stat.l2, coins: race.coinCount, podium: pos <= 3 ? 1 : 0, win: pos === 1 ? 1 : 0, sc: stat.sc, items: stat.items, clean: stat.walls <= 2 ? 1 : 0 }));
    persist();

    $('resTitle').textContent = `${pos}${placeSuf(pos)}`;
    $('resTrack').textContent = trackLabel();
    $('resStars').textContent = starText(stars);
    $('resNote').textContent = notes.join(' · '); $('resNote').hidden = !notes.length;
    $('resRows').innerHTML = race.ranked.map((c, i) => `<li class="${c.isPlayer ? 'me' : ''}"><b>${i + 1}</b><span>${c.isPlayer ? t('you') : c.name}</span><em>${fmt(c.time)}</em></li>`).join('');
    $('resCoins').textContent = `+${pendingCoins} ${t('coins')}  ·  ${t('best')} ${save.best[id] ? fmt(save.best[id]) : '-'}`;
    $('resDouble').hidden = !MB.monet.adsAvailable();
    $('resNext').textContent = cup ? t('next') : t('again');
    if (cup && cup.i === cup.def.tracks.length - 1) $('resNext').textContent = t('cup');
    show('result');
    buzz(40);
  }

  function nextAfterResult() {
    if (!cup) return startRace(currentTrack, currentVariant);
    if (cup.i < cup.def.tracks.length - 1) { cup.i++; keepCup(); return startRace(cup.def.tracks[cup.i]); }
    const names = MB.RIVALS.slice(0, 5).concat(t('you'));
    const table = names.map((n, i) => ({ n, pts: cup.pts[i], me: i === 5 })).sort((a, b) => b.pts - a.pts);
    const rank = table.findIndex((r) => r.me), def = cup.def;
    const k = cup.diff, had = cupMedal(def.id, k);
    let prize = Math.round((def.prizes[rank] || 0) * MB.DIFFS[k].gain);
    if (rank === 0 && had !== 3) prize += def.first;  // grosse prime : la première victoire dans chaque cylindrée
    if (rank === 0) trophiesAfter({ cupWin: true }, 0).forEach((n) => toast(n));
    save.coins += prize;
    if (rank < 3 && 3 - rank > had) (save.cupCc[def.id] = save.cupCc[def.id] || {})[k] = 3 - rank;
    persist();
    $('cupTitle').textContent = rank === 0 ? t('won') : rank < 3 ? t('podium') : t('tryagain');
    $('cupTrophy').textContent = ['🏆', '🥈', '🥉'][rank] || '🍪';
    $('cupRows').innerHTML = table.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${i + 1}</b><span>${r.n}</span><em>${r.pts} pts</em></li>`).join('');
    $('cupCoins').textContent = prize ? `${t('cupPlus')} : +${prize} ${t('coins')}` : '';
    cup = null; keepCup();
    show('cupEnd');
  }

  function setPaused(v) {
    if (phase !== 'race') return;
    paused = v;
    releaseFingers();
    $('pause').hidden = !v;
    $('reportBtn').hidden = !journal;
    if (v) Sound.engine(false, 0); Sound.draft(0);
  }

  // ---------- Écrans ----------
  let trackMode = 'race', skipGap = false, marbleT = 0, honkT = 0;
  // Course libre : un monde par page dans un carrousel, ses circuits en liste, 4 modes par circuit.
  let selTrack = null, selVar = null, worldIdx = -1;
  const MODES = [[null, '☀️']].concat(Object.keys(VARIANTS).map((v) => [v, VARIANTS[v].icon]));
  const modeName = (v) => (v ? VARIANTS[v].name[lang === 'fr' ? 0 : 1] : t('normal'));
  const keyOf = (id, v) => (v ? `${id}@${v}` : id);
  const varOpen = (id) => (save.stars[id] || 0) >= 1;
  const mapCache = {};
  function trackMap(id) {
    if (mapCache[id]) return mapCache[id];
    const tr = getTrack(id), xs = [], zs = [];
    for (let i = 0; i < tr.count; i++) { xs.push(tr.px[i]); zs.push(tr.pz[i]); }
    const x0 = Math.min(...xs), z0 = Math.min(...zs), k = 88 / Math.max(Math.max(...xs) - x0, Math.max(...zs) - z0);
    const ox = (100 - (Math.max(...xs) - x0) * k) / 2, oz = (100 - (Math.max(...zs) - z0) * k) / 2;
    const pt = (x, z) => `${(ox + (x - x0) * k).toFixed(1)} ${(oz + (z - z0) * k).toFixed(1)}`;
    const step = Math.max(1, Math.floor(tr.count / 70));
    let d = '';
    for (let i = 0; i < tr.count; i += step) d += (i ? 'L' : 'M') + pt(tr.px[i], tr.pz[i]);
    let sc = '';
    for (const q of tr.shortcuts || []) for (let i = 0; i < q.count; i += 3) sc += (i ? 'L' : 'M') + pt(q.px[i], q.pz[i]);
    return (mapCache[id] = `<svg viewBox="0 0 100 100"><path d="${d}Z" fill="none" stroke="rgba(43,34,48,.3)" stroke-width="13" stroke-linejoin="round"/><path d="${d}Z" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>`
      + (sc ? `<path d="${sc}" fill="none" stroke="#ffd23f" stroke-width="4" stroke-dasharray="3 3" stroke-linecap="round"/>` : '')
      + `<circle cx="${pt(tr.px[0], tr.pz[0]).split(' ')[0]}" cy="${pt(tr.px[0], tr.pz[0]).split(' ')[1]}" r="6" fill="#e5352b" stroke="#fff" stroke-width="1.5"/></svg>`);
  }
  // Position de défilement qui centre la page du monde i.
  const wLeft = (i) => { const r = $('wrail'), c = r.children[i]; return c.offsetLeft - (r.clientWidth - c.offsetWidth) / 2; };
  // Ligne du champion dans la liste des circuits : son nom et la progression vers sa figurine.
  function champLine(id) {
    const r = MB.champOf(id);
    if (r === null) return '';
    const done = !!save.figs[r];
    return `<small class="wchamp ${done ? 'done' : ''}">👑 ${MB.RIVALS[r]} ${done ? '✓' : `${save.figWins[r] || 0}/${MB.FIG_WINS}`}</small>`;
  }
  function renderTracks() {
    const chrono = trackMode === 'chrono', total = starTotal(), worlds = MB.WORLDS;
    if (!selTrack || !openTracks().includes(selTrack)) { selTrack = openTracks().includes(currentTrack) ? currentTrack : openTracks()[0]; selVar = null; }
    if (selVar && !varOpen(selTrack)) selVar = null;
    if (worldIdx < 0) worldIdx = worlds.findIndex((w) => w.tracks.includes(selTrack));
    const grad = (c) => `linear-gradient(160deg,${c[0]},${c[1]})`;
    const page = (w) => {
      const open = worldOpen(w), got = w.tracks.reduce((a, id) => a + MODES.reduce((b, [v]) => b + (save.stars[keyOf(id, v)] || 0), 0), 0), max = w.tracks.length * 12;
      const hero = `<div class="whero" style="background:${grad(w.col)}"><b class="wem">${open ? w.icon : '🔒'}</b><h3>${L(w.name)}</h3>
        <small>${w.tracks.length} ${lang === 'fr' ? 'circuit' : 'track'}${w.tracks.length > 1 ? 's' : ''} · 4 modes</small>
        <em>${open ? `${got} / ${max} ★` : `🔒 ${total} / ${w.stars} ★`}</em><u><i style="width:${Math.round(100 * Math.min(1, open ? got / max : total / w.stars))}%"></i></u></div>`;
      if (!open) return `<div class="wpage">${hero}<div class="wlock"><b>${t('worldNeed')} ${w.stars - total} ★</b>${t('worldNeed2')}</div></div>`;
      const hunt = toyHunt().map((h) => h.track);              // 🧸 : un nouveau jouet est caché sur ce circuit (on ne dit pas où)
      return `<div class="wpage">${hero}${w.tracks.map((id) => {
        const def = MB.TRACKS.find((d) => d.id === id), vo = varOpen(id), sel = id === selTrack;
        const badge = MODES.map(([v, ic]) => {
          const k = keyOf(id, v), lock = v && !vo, n = save.stars[k] || 0;
          return chrono ? `<span class="${save.ghosts[k] ? 'done' : ''}">${lock ? '🔒' : ic} ${save.ghosts[k] ? '👻' : '–'}</span>` : `<span class="${n ? 'done' : ''}">${lock ? '🔒' : ic} ${n}★</span>`;
        }).join('');
        const modes = MODES.map(([v, ic]) => {
          const k = keyOf(id, v), lock = v && !vo, rec = chrono ? (save.ghosts[k] ? fmt(save.ghosts[k].t) : '–') : (save.best[k] ? fmt(save.best[k]) : '–');
          return `<button data-pick="${id}" data-pvar="${v || ''}" class="${sel && v === selVar ? 'sel' : ''}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : ic}<small>${lock ? '1★ ' + t('normal') : rec}</small></button>`;
        }).join('');
        return `<div class="wline ${sel ? 'open' : ''}"><button class="whead" data-pick="${id}"><span class="wthumb" style="background:${grad(w.col)}">${trackMap(id)}</span>
          <span class="wnm">${L(def.name)}${hunt.includes(id) ? ' <i class="wtoy">🧸</i>' : ''}${champLine(id)}<span class="wbadges">${badge}</span></span></button>${sel ? `<div class="wmodes">${modes}</div>` : ''}</div>`;
      }).join('')}</div>`;
    };
    $('trackList').innerHTML = `<div class="seg">${['race', 'chrono', 'duo'].map((m) => `<button data-mode="${m}" class="${trackMode === m ? 'sel' : ''}">${t(m === 'race' ? 'modeRace' : m === 'duo' ? 'modeDuo' : 'modeChrono')}</button>`).join('')}</div>`
      + `<div class="wchips">${worlds.map((w, i) => `<button data-world="${i}" class="${i === worldIdx ? 'sel' : ''} ${worldOpen(w) ? '' : 'lock'}" style="background:${grad(w.col)}" aria-label="${L(w.name)}">${w.icon}</button>`).join('')}</div>`
      + `<div class="wrail" id="wrail">${worlds.map(page).join('')}</div>`
      + `<div class="wdots">${worlds.map((w, i) => `<i class="${i === worldIdx ? 'sel' : ''}"></i>`).join('')}</div>`
      + (chrono ? '' : `<div class="seg ccseg">${ccButtons()}</div>`)
      + `<button class="btn primary wgo" data-track="${selTrack}" data-variant="${selVar || ''}">${t('run')}<small>${L(MB.TRACKS.find((d) => d.id === selTrack).name)} · ${MODES.find(([v]) => v === selVar)[1]} ${modeName(selVar)}${chrono ? '' : ' · ' + L(MB.DIFFS[save.diff].label)}</small></button>`
      + `<p class="small">${chrono ? t('ghostHelp') : trackMode === 'duo' ? t('duoHelp') : t('goal')} ${trackMode === 'duo' ? '' : t('varHelp')}</p>`
      + `<button class="btn edbtn" data-go="editor">✏️ ${t('edTitle')}<small>${t('edSub')}</small></button>`;
    show('tracks');
    const rail = $('wrail');
    rail.scrollLeft = wLeft(worldIdx);
    let tm = 0;
    rail.onscroll = () => { clearTimeout(tm); tm = setTimeout(() => {
      const i = Math.max(0, Math.min(worlds.length - 1, Math.round(rail.scrollLeft / (rail.children[1].offsetLeft - rail.children[0].offsetLeft))));
      if (i !== worldIdx) pickWorld(i, false);
    }, 80); };
  }
  // Changer de monde choisit aussi son premier circuit : le bouton COURSE lance toujours ce qu'on voit.
  function pickWorld(i, smooth) {
    worldIdx = i;
    const w = MB.WORLDS[i];
    if (worldOpen(w) && !w.tracks.includes(selTrack)) { selTrack = w.tracks.find((id) => openTracks().includes(id)) || selTrack; selVar = null; renderTracks(); }
    if (smooth) $('wrail').scrollTo({ left: wLeft(i), behavior: 'smooth' });
    document.querySelectorAll('.wchips button').forEach((b, k) => b.classList.toggle('sel', k === i));
    document.querySelectorAll('.wdots i').forEach((b, k) => b.classList.toggle('sel', k === i));
    const go = document.querySelector('.wgo'); if (go) go.disabled = !worldOpen(w);
  }

  // ---------- Atelier de circuits ----------
  let editor = null;
  function renderEditor() {
    const slot = save.edSlot || 0, c = save.custom[slot] || { pts: MB.EDIT_DEFAULT, world: 'cuisine' };
    const worlds = openWorlds(), w = MB.WORLDS.find((x) => x.id === c.world) || worlds[0];
    $('edSlots').innerHTML = [0, 1, 2].map((i) => `<button data-edslot="${i}" class="${i === slot ? 'sel' : ''}">${t('edSlot')} ${i + 1}${save.custom[i] ? '' : ' ✨'}</button>`).join('');
    $('edWorlds').innerHTML = worlds.map((x) => `<button data-edworld="${x.id}" class="${x.id === w.id ? 'sel' : ''}">${x.icon}</button>`).join('');
    show('editor');
    if (!editor) editor = new MB.Editor($('edCanvas'), edChanged);
    editor.set(c.pts, w.col[1]);
  }
  function edSave() {
    const slot = save.edSlot || 0, old = save.custom[slot] || { world: 'cuisine' };
    save.custom[slot] = { pts: editor.pts.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]), world: old.world };
    for (const k of Object.keys(trackCache)) if (isCustom(k.split('@')[0])) delete trackCache[k];
    persist();
  }
  function edChanged(st) {
    if (st.full) return flash(t('edFull'));
    const c = st.check;
    $('edMsg').textContent = c.ok ? `✅ ${t('edOk')}` : c.cross ? `🟥 ${t('edCross')}` : `🟧 ${t('edTight')}`;
    $('edMsg').className = 'small edmsg' + (c.ok ? ' ok' : '');
    $('edGo').disabled = !c.ok;
    $('edDel').disabled = editor.sel < 0 || st.pts.length <= 5;
    if (c.ok) edSave();
  }

  function renderCups() {
    const total = starTotal(), icons = ['', '🥉', '🥈', '🏆'];
    $('cupTotal').textContent = `${total} / ${MB.TRACKS.length * 3} ★  ·  🏆 ${cupWins()} / ${MB.CUPS.length * CC.length}`;
    $('cupList').innerHTML = MB.CUPS.map((c) => {
      const open = MB.cupUnlocked(c, total), got = c.tracks.reduce((a, id) => a + (save.stars[id] || 0), 0);
      const slots = CC.map((k) => {
        const m = cupMedal(c.id, k), lock = !save.ccOk[k];
        return `<i class="${k === save.diff ? 'cur' : ''}${m ? ' got' : ''}"><b>${lock ? '🔒' : icons[m] || '·'}</b><small>${L(MB.DIFFS[k].label).replace(/\s?cc/, '')}</small></i>`;
      }).join('');
      return `<button class="cup" data-cup="${c.id}" ${open ? '' : 'disabled'}><b class="ic">${open ? c.icon : '🔒'}</b><span>${L(c.name)}<small>${open ? `${got} / ${c.tracks.length * 3} ★` : `${c.stars} ${t('locked')}`}</small></span><em class="slots">${slots}</em></button>`;
    }).join('') + `<p class="small">${t('cupCcHelp')}</p><div class="seg ccseg">${ccButtons()}</div><p class="small">${t('goal')}</p>`;
    show('cups');
  }

  function renderShop() {
    $('shopList').innerHTML = MB.OFFERS.map((o) => `<div class="offer"><b>${o.icon} ${L(o.name)}</b><p>${L(o.desc)}</p>${owns(o.id) ? `<button class="btn" disabled>✓ ${t('owned')}</button>` : `<button class="btn primary" data-offer="${o.id}">${o.price}</button>`}</div>`).join('')
      + (MB.FEATURES.demo ? `<p class="demo">${t('demoNote')}</p>` : `<button class="btn tiny" data-go="restore">${t('restore')}</button>`);
    show('shop');
  }

  let gIdx = 0, gTab = 'car';
  function renderGarage() {
    const base = MB.CARS[gIdx], own = save.cars.includes(base.id), levels = save.ups[base.id] || {};
    const spec = MB.effectiveCar(base.id, levels);
    view.showGarage(base.shape, carHex(base.id), save.look);
    $('gName').textContent = base.name;
    $('gCount').textContent = `${gIdx + 1}/${MB.CARS.length}`;
    $('gTabs').innerHTML = [['car', 'tabCar'], ['up', 'tabUp'], ['paint', 'tabPaint'], ['style', 'tabStyle']].map(([k, l]) => `<button data-gtab="${k}" class="${gTab === k ? 'sel' : ''}">${t(l)}</button>`).join('');
    let html = '';
    if (gTab === 'car') {
      const bar = (v, b) => `<u style="width:${Math.min(100, Math.round(b * 100))}%"></u><u class="plus" style="width:${Math.max(0, Math.round((v - b) * 100))}%"></u>`;
      const r = (st, lo, hi) => bar((spec[st] - lo) / (hi - lo), (base[st] - lo) / (hi - lo));
      html = `<p class="tag">${L(base.tag)}</p><dl>
        <dt>${t('sSpeed')}</dt><dd>${r('vmax', 33, 43)}</dd><dt>${t('sAccel')}</dt><dd>${r('accel', 0.6, 1.8)}</dd>
        <dt>${t('sTurn')}</dt><dd>${r('turn', 1.05, 1.65)}</dd><dt>${t('sDrift')}</dt><dd>${r('driftBonus', 0.6, 1.9)}</dd></dl>`;
      if (!own) html += `<button class="btn primary" data-gbuy="1" ${save.coins < base.price ? 'disabled' : ''}>${save.coins < base.price ? `${t('need')} · ` : `${t('buy')} · `}${base.price} 🪙</button>`;
      else if (save.car === base.id) html += `<button class="btn" disabled>✓ ${t('used')}</button>`;
      else html += `<button class="btn primary" data-gpick="1">${t('use')}</button>`;
    } else if (gTab === 'up') {
      html = !own ? `<p class="tag">${t('buyFirst')}</p>` : Object.keys(MB.UPGRADES).map((k) => {
        const u = MB.UPGRADES[k], lvl = levels[k] || 0, cost = MB.UP_COST[lvl], pips = Array.from({ length: MB.UP_MAX }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
        return `<div class="up"><div><b>${L(u.name)}</b><small>${L(u.desc)}</small><span class="pips">${pips}</span></div>${lvl >= MB.UP_MAX ? `<em>${t('max')}</em>` : `<button data-up="${k}" ${save.coins < cost ? 'disabled' : ''}>${cost} 🪙</button>`}</div>`;
      }).join('') + `<p class="small">${t('earned')}</p>`;
    } else if (gTab === 'style') {
      const row = (kind, label) => `<p class="tag">${t(label)}</p><div class="looks">${MB.LOOKS[kind].map((o) => {
        const have = save.looks.includes(`${kind}:${o.id}`), sel = save.look[kind] === o.id;
        const face = kind === 'num' ? (o.id || '—') : kind === 'deco' ? `<b class="deco">${o.icon}</b>` : `<span style="background:#${o.hex.toString(16).padStart(6, '0')}"></span>`;
        return `<button class="look ${sel ? 'sel' : ''}" data-look="${kind}:${o.id}" ${!have && save.coins < o.price ? 'disabled' : ''}>${face}<small>${have ? (sel ? '✓' : '') : `${o.price} 🪙`}</small></button>`;
      }).join('')}</div>`;
      html = row('deco', 'lookDeco') + row('num', 'lookNum') + row('rim', 'lookRim') + row('trail', 'lookTrail') + `<p class="small">${t('lookHelp')}</p>`;
    } else {
      html = !own ? `<p class="tag">${t('buyFirst')}</p>` : `<div class="swatches">${MB.PAINTS.filter((p) => !p.premium || MB.FEATURES.premium).map((p) => {
        const have = save.paints.includes(p.id);
        return `<button class="swatch ${p.id === carPaint(base.id) ? 'sel' : ''}" data-paint="${p.id}" ${!have && save.coins < p.price ? 'disabled' : ''} style="background:#${p.hex.toString(16).padStart(6, '0')}" aria-label="${L(p.name)}">${have ? '' : p.premium ? '🔒' : `<small>${p.price}</small>`}</button>`;
      }).join('')}</div>`;
    }
    $('gPanel').innerHTML = html;
    show('garage');
  }

  function renderSettings() {
    $('setList').innerHTML = `
      <div class="seg" role="group" aria-label="${t('diff')}"><span>${t('diff')}</span>${ccButtons()}</div>
      <p class="small">${t('ccHelp')}</p>
      <div class="seg" role="group" aria-label="${t('sens')}"><span>${t('sens')}</span>${Object.keys(MB.SENS).map((k) => `<button data-sens="${k}" class="${save.sens === k ? 'sel' : ''}">${L(MB.SENS[k].label)}</button>`).join('')}</div>
      <button class="row" data-toggle="assist"><span>${t('assist')}<br><small>${t('assistHelp')}</small></span><i>${save.assist ? 'ON' : 'OFF'}</i></button>
      <button class="row" data-toggle="sound"><span>${t('sound')}</span><i>${save.sound ? 'ON' : 'OFF'}</i></button>
      <button class="row" data-toggle="music"><span>${t('music')}</span><i>${save.music ? 'ON' : 'OFF'}</i></button>
      <button class="row" data-go="gfxToggle"><span>${t('gfx')}<br><small>${t('gfxHelp')}</small></span><i>${MB.REEL.pref() ? 'ON' : 'OFF'}</i></button>
      <button class="row" data-toggle="vib"><span>${t('vib')}</span><i>${save.vib ? 'ON' : 'OFF'}</i></button>
      ${bridge && bridge.remind ? `<button class="row" data-go="notifToggle"><span>${t('notif')}<br><small>${save.notif && !bridge.notifAllowed() ? t('notifBlocked') : t('notifHelp')}</small></span><i>${save.notif ? 'ON' : 'OFF'}</i></button>` : ''}
      ${MB.FEATURES.demo ? `<button class="btn tiny" data-go="demoReset">${t('demoReset')}</button>` : ''}
      <p class="small">${t('credits')} v0.4</p>`;
    show('settings');
  }

  // Depuis l'écran de résultat, une pub peut s'intercaler avant la suite.
  function leave(next) { return phase === 'result' ? MB.monet.between(next) : next(); }

  function onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    Sound.init();
    if (Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();
    Sound.play('tap', [620, 0.05, 'triangle', 0.08]);
    const d = b.dataset;
    if (d.go === 'home' && multi && multi.active()) { multi.quit(); return menu(); }
    if (d.go === 'home') return leave(menu);
    if (d.mp || d.mptrack || d.mpcc || d.mplan) return multi.click(d);
    if (d.go === 'cups') return renderCups();
    if (d.cup) { cup = { def: MB.CUPS.find((c) => c.id === d.cup), diff: save.diff, i: 0, pts: [0, 0, 0, 0, 0, 0] }; chal = null; week = null; keepCup(); return startRace(cup.def.tracks[0]); }
    if (d.go === 'missions') return renderMissions();
    if (d.go === 'missClose') { $('missions').hidden = true; return; }
    if (d.go === 'chest') return openChest();
    if (d.go === 'notifYes') { $('notifAsk').hidden = true; return setNotif(true); }
    if (d.go === 'notifNo') { $('notifAsk').hidden = true; return setNotif(false); }
    if (d.go === 'notifToggle') { setNotif(!save.notif); return renderSettings(); }
    if (d.go === 'editor') return renderEditor();
    if (d.edslot) { save.edSlot = +d.edslot; persist(); return renderEditor(); }
    if (d.edworld) { const s0 = save.edSlot || 0; edSave(); save.custom[s0].world = d.edworld; persist(); for (const k of Object.keys(trackCache)) if (isCustom(k.split('@')[0])) delete trackCache[k]; return renderEditor(); }
    if (d.ed === 'del') { editor.remove(); return; }
    if (d.ed === 'reset') { editor.set(MB.EDIT_DEFAULT); return; }
    if (d.ed === 'go') { if (!editor.check.ok) return; edSave(); chal = null; week = null; cup = null; return startRace('perso' + (save.edSlot || 0), null); }
    if (d.go === 'weekly') return renderBrief('week');
    if (d.go === 'challenge') return renderBrief('chal');
    if (d.go === 'briefClose') { $('brief').hidden = true; return; }
    if (d.go === 'briefGo') {
      $('brief').hidden = true;
      if (briefKind === 'week') { week = weekly(); chal = null; cup = null; return startRace(week.track, week.variant); }
      if (save.chal === today()) return;
      chal = challenge(); cup = null; week = null;
      return startRace(chal.track);
    }
    if (d.go === 'play') { cup = nextPlay(); chal = null; week = null; keepCup(); return startRace(cup.def.tracks[cup.i]); }
    if (d.go === 'modes') return renderModes();
    if (d.go === 'modesClose') { $('modes').hidden = true; return; }
    if (d.hmode) { $('modes').hidden = true; if (d.hmode === 'cups') return renderCups(); if (d.hmode === 'multi') return multi.home(); trackMode = d.hmode; return renderTracks(); }
    if (d.hstep) return homeCar(+d.hstep);
    if (d.go === 'dailyTake') return takeDaily(1);
    if (d.go === 'dailyDouble') return MB.monet.showRewarded('daily', (ok) => takeDaily(ok ? 2 : 1));
    if (d.go === 'adClose') { if (adDone) adDone(true); return; }
    if (d.go === 'shop') { shopFrom = 'home'; return renderShop(); }
    if (d.go === 'shopback') return shopFrom === 'garage' ? renderGarage() : menu();
    if (d.go === 'restore') return MB.monet.restore();
    if (d.offer) return MB.monet.buy(MB.OFFERS.find((o) => o.id === d.offer), () => renderShop());
    if (d.go === 'confirmYes' || d.go === 'confirmNo') { $('confirm').hidden = true; const f = confirmDone; confirmDone = null; if (f) f(d.go === 'confirmYes'); return; }
    if (d.go === 'demoReset') { save.owned = []; save.paints = save.paints.filter((id) => !MB.PAINTS.find((p) => p.id === id).premium); for (const k of Object.keys(save.carPaint)) if (MB.PAINTS.find((p) => p.id === save.carPaint[k]).premium) delete save.carPaint[k]; persist(); return renderSettings(); }
    if (d.go === 'tracks') return renderTracks();
    if (d.go === 'garage') { gIdx = Math.max(0, MB.CARS.findIndex((c) => c.id === save.car)); gTab = 'car'; return renderGarage(); }
    if (d.go === 'settings') return renderSettings();
    if (d.go === 'gfxToggle') { MB.REEL.setPref(!MB.REEL.pref()); view.regfx(); return renderSettings(); }
    if (d.go === 'pause') return setPaused(true);
    if (d.go === 'resume') return setPaused(false);
    if (d.go === 'skipReplay') return endReplay();
    if (d.go === 'report') { snapJournal('signalé'); setTimeout(() => { if (journal) journal.copied = null; copyJournal('signalé'); }, 250); return; }
    if (d.go === 'restart') { if (cup) cup.pts = cup.pts.slice(); return startRace(currentTrack, currentVariant); }
    if (d.go === 'next' && race && race.net) { netIdle(); return multi.afterRace(); }
    if (d.go === 'next') return leave(nextAfterResult);
    if (d.go === 'double') return MB.monet.showRewarded('double', (ok) => { if (ok) { save.coins += pendingCoins; persist(); $('resDouble').hidden = true; } });
    if (d.mode) { trackMode = d.mode; return renderTracks(); }
    if (d.track) { chal = null; week = null; return startRace(d.track, d.variant || null); }
    if (d.pick) { if (d.pick !== selTrack) selVar = null; selTrack = d.pick; if (d.pvar !== undefined) selVar = d.pvar || null; return renderTracks(); }
    if (d.world) { pickWorld(+d.world, true); return; }
    if (d.gstep) { gIdx = (gIdx + +d.gstep + MB.CARS.length) % MB.CARS.length; return renderGarage(); }
    if (d.gtab) { gTab = d.gtab; return renderGarage(); }
    if (d.look !== undefined) {
      const [kind, id] = d.look.split(':'), o = MB.LOOKS[kind].find((x) => x.id === id), k = `${kind}:${id}`;
      if (!save.looks.includes(k)) { if (save.coins < o.price) return; save.coins -= o.price; save.looks.push(k); Sound.play('buy', [880, 0.3, 'triangle', 0.16, 1320], 0); }
      save.look[kind] = id; persist(); $('coinval').textContent = save.coins; return renderGarage();
    }
    if (d.go === 'trophies') { tIdx = -1; return renderTrophies(); }
    if (d.tstep) return trophyGo(tIdx + +d.tstep);
    if (d.tsel !== undefined) return trophyGo(+d.tsel);
    if (d.gbuy) {
      const c = MB.CARS[gIdx];
      if (save.coins >= c.price) { save.coins -= c.price; save.cars.push(c.id); save.car = c.id; save.carPaint[c.id] = carPaint(c.id); Sound.play('buy', [880, 0.3, 'triangle', 0.16, 1320], 0); persist(); trophiesAfter({}).forEach((n) => toast(n)); }
      return renderGarage();
    }
    if (d.gpick) { save.car = MB.CARS[gIdx].id; persist(); return renderGarage(); }
    if (d.up) {
      const c = MB.CARS[gIdx], ups = save.ups[c.id] || (save.ups[c.id] = {}), lvl = ups[d.up] || 0;
      if (lvl < MB.UP_MAX && save.coins >= MB.UP_COST[lvl]) { save.coins -= MB.UP_COST[lvl]; ups[d.up] = lvl + 1; Sound.play('upgrade', [660, 0.2, 'triangle', 0.16, 1180], 0); buzz(25); persist(); trophiesAfter({}).forEach((n) => toast(n)); }
      return renderGarage();
    }
    if (d.paint) {
      const p = MB.PAINTS.find((x) => x.id === d.paint), id = MB.CARS[gIdx].id;
      if (p.premium && !save.paints.includes(p.id)) { shopFrom = 'garage'; return renderShop(); }
      if (!save.paints.includes(p.id) && save.coins >= p.price) { save.coins -= p.price; save.paints.push(p.id); }
      if (save.paints.includes(p.id)) save.carPaint[id] = p.id;
      persist(); return renderGarage();
    }
    if (d.sens) { save.sens = d.sens; persist(); return renderSettings(); }
    if (d.diff) { if (!save.ccOk[d.diff]) return; save.diff = d.diff; if (save.ccNew === d.diff) save.ccNew = null; persist(); return b.closest('#trackList') ? renderTracks() : b.closest('#cupList') ? renderCups() : renderSettings(); }
    if (d.toggle) { save[d.toggle] = !save[d.toggle]; persist(); if (d.toggle === 'sound' || d.toggle === 'music') { Sound.init(); Sound.song(Sound.style); } return renderSettings(); }
  }

  // ---------- Commandes ----------
  const pad = new MB.TouchPad(), pad2 = new MB.TouchPad();   // pad2 : joueur 2, en haut, écran retourné
  let releaseFingers = () => {};
  function bindInput() {
    const hud = $('hud');
    const refresh = () => {
      input.steer = pad.side();
      const q = pad.finger(), th = $('thumb');
      th.hidden = !q;
      if (q) { th.style.transform = `translateX(${q.a}px)`; th.firstChild.style.transform = `translateX(${q.x - q.a}px)`; }
    };
    const refresh2 = () => {
      input2.steer = pad2.side();
      const q = pad2.finger(), th = $('thumb2');
      th.hidden = !q;
      if (q) { th.style.transform = `translateX(${q.a}px)`; th.firstChild.style.transform = `translateX(${q.x - q.a}px)`; }
    };
    releaseFingers = () => { pad.clear(); pad2.clear(); refresh(); refresh2(); };
    refresh();
    hud.addEventListener('pointerdown', (e) => {
      if (e.target === $('touch2') || e.target === $('itemBtn2')) {   // joueur 2 : sa moitié est retournée, gauche et droite aussi
        e.preventDefault();
        if (e.target === $('itemBtn2')) input2.item = true;
        pad2.down(e.pointerId, window.innerWidth - e.clientX, window.innerWidth);
        try { e.target.setPointerCapture(e.pointerId); } catch (x) { /* rien */ }
        return refresh2();
      }
      if (e.target !== $('touch') && e.target !== $('itemBtn')) return;   // pause et menus gardent leurs appuis
      e.preventDefault();
      if (e.target === $('itemBtn')) input.item = true;        // le bouton d'objet ne vole pas le doigt : il dirige aussi
      pad.down(e.pointerId, e.clientX, window.innerWidth);
      try { e.target.setPointerCapture(e.pointerId); } catch (x) { /* rien */ }
      refresh();
    });
    const up = (e) => { pad.up(e.pointerId); pad2.up(e.pointerId); refresh(); refresh2(); };
    hud.addEventListener('pointerup', up);
    hud.addEventListener('pointercancel', up);
    hud.addEventListener('lostpointercapture', up);
    hud.addEventListener('pointermove', (e) => {
      if (pad2.f.has(e.pointerId)) { pad2.move(e.pointerId, window.innerWidth - e.clientX); return refresh2(); }
      pad.move(e.pointerId, e.clientX); refresh();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') input.keyL = true;
      if (e.key === 'ArrowRight') input.keyR = true;
      if (e.key === ' ') input.item = true;
      if (e.key === 'Escape') setPaused(!paused);
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') input.keyL = false;
      if (e.key === 'ArrowRight') input.keyR = false;
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('visibilitychange', () => { if (document.hidden) { setPaused(true); copyJournal('appli quittée'); } else Sound.wake(); });
    document.addEventListener('pointerdown', () => { Sound.init(); Sound.wake(); }, true);
  }

  let stillN = 0;
  function loop(now) {
    if (MB.REEL.still) { stillN++; MB.REEL.skip = stillN < MB.REEL.still; if (stillN > MB.REEL.still + 1) { console.log('MAQ pret'); document.title = 'pret'; return; } }
    requestAnimationFrame(loop);
    const tLoop = performance.now();                           // journal : temps de calcul et de dessin de chaque image
    if (Sound.tunes) Sound.tunes.tick();
    if (skipGap) { skipGap = false; lastT = now; }             // première image après un chargement : écart ignoré
    const gap = Math.max(0, (now - lastT) / 1000 || 0), raw = Math.min(gap, 0.1);   // gap : vrai temps entre deux images, pour le journal
    lastT = now;
    frameDt = raw > 0.05 ? raw : frameDt + (raw - frameDt) * 0.25;    // gomme le tremblement de l'horloge, pas les vrais à-coups
    const dt = MB.REEL.still ? 1 / 30 : frameDt;
    if (phase === 'race' && race) {
      if (!paused || race.net) {                               // en réseau, la course continue derrière le menu de pause
        const keys = (input.keyR ? 1 : 0) - (input.keyL ? 1 : 0);
        let ctl = { steer: keys || input.steer, item: input.item };
        let ctl2 = { steer: pad2.side(), item: input2.item };
        if (auto) { ctl = MB.botInput(race); if (race.duo) ctl2 = MB.botInput(race, { car: race.player2 }); }
        // Ralenti sur la ligne : la fin de course se savoure, puis tout reprend.
        if (race.playerFinished) {
          if (!finFx) { finFx = true; slowT = race.net ? 0 : 1.6; snapJournal('arrivée'); const pos = race.solo ? (ghost.record ? 1 : 4) : race.position(race.player); Sound.song(null); if (pos <= 3) { view.confetti(); Sound.fanfare(pos === 1); } else Sound.play('finish', null, 0); }
          slowT -= dt;
        }
        timeK += ((slowT > 0 ? 0.35 : 1) - timeK) * Math.min(1, dt * 5);
        race.step(dt * timeK, ctl, ctl2);
        if (race.net) multi.tick();
        recordFrame();
        coachWatch();
        if (ghost && race.solo) ghostStep();
        if (journal) {
          journal.frame(Math.min(gap, 2));
          if (race.ticked) journal.sample(ctl, pad.finger());
          journal.graphics(view.stats());
          if (journal.wantSnap()) snapJournal('course');
          if (race.events.some((e) => e.t === 'spin')) snapJournal('tête-à-queue');
        }
        if (race.ticked) { input.item = false; input2.item = false; }                   // écran 120 Hz : un appui ne doit pas tomber entre deux pas
        handleEvents();
        if (phase === 'race') {
          updateHud();
          const p = race.player;
          Sound.engine(race.state === 'run' && !paused, p.v / p.spec.vmax, p.boost > 0);
          let near = null, nd = 1e9, cl = 0;
          for (const c of race.cars) if (!c.isPlayer) { const d = Math.hypot(c.x - p.x, c.z - p.z); if (d < nd) { nd = d; near = c; } }
          if (near) { const dx = (near.x - p.x) / nd, dz = (near.z - p.z) / nd; cl = -(dx * (Math.cos(near.h) * near.v - Math.cos(p.h) * p.v) + dz * (Math.sin(near.h) * near.v - Math.sin(p.h) * p.v)); }
          Sound.rival(race.state === 'run' && !paused ? near : null, nd, cl);
          Sound.draft(race.state === 'run' && !paused ? Math.min(1, (p.draftT || 0) / 1) * (p.draft > 0 ? 1 : 0) : 0);
          Sound.skid(race.state === 'run' && !paused && !(p.y > 0.05) ? (p.drifting ? 0.75 + Math.min(p.charge / MB.DRIFT.L2, 1) * 0.25 : Math.max(0, Math.abs(p.slip) - 0.14) * 3) : 0, p.v / p.spec.vmax);
        }
      }
      const tDraw = performance.now();
      if (race) view.frameRace(paused ? 0 : dt, race.alpha);
      if (journal) journal.cost(tDraw - tLoop, performance.now() - tDraw);
    } else if (phase === 'replay' && replay) {
      replayStep(dt);
    } else if (phase === 'result' && race) {
      race.acc = 0; view.frameRace(dt, 1);
    } else {
      view.frameMenu(dt);
    }
  }

  // Appelés par l'activité Android.
  window.mcPause = () => setPaused(true);
  window.mcBack = () => {
    if (phase === 'race') { setPaused(!paused); return true; }
    if (adDone) return true;
    if (!$('confirm').hidden) { $('confirm').hidden = true; confirmDone = null; return true; }
    if (!$('daily').hidden) { $('daily').hidden = true; return true; }
    if (!$('missions').hidden) { $('missions').hidden = true; return true; }
    if (!$('modes').hidden) { $('modes').hidden = true; return true; }
    if (!$('brief').hidden) { $('brief').hidden = true; return true; }
    if (!$('notifAsk').hidden) { $('notifAsk').hidden = true; setNotif(false); return true; }
    if (multi && multi.active()) multi.quit();                // retour depuis le salon ou son classement : on quitte le salon
    if (phase === 'result') { menu(); return true; }
    if (!$('home').hidden) return false;
    menu(); return true;
  };

  function applyTexts() {
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.documentElement.lang = lang;
  }

  async function boot() {
    applyTexts();
    view = new MB.View($('gl'));
    multi = MB.makeMulti({ $, t, L, lang, save, persist, show, fmt, paintHex, openTracks, race: () => race, startNetRace, backToMenu: menu, banner: netBanner,
      defaultTrack: () => (openTracks().includes(currentTrack) ? currentTrack : openTracks()[0]) });
    document.addEventListener('click', onClick);
    bindInput();
    const drag = $('gDrag');
    let dragX = null;
    drag.addEventListener('pointerdown', (e) => { dragX = e.clientX; try { drag.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } });
    drag.addEventListener('pointermove', (e) => { if (dragX !== null) { view.spinGarage(e.clientX - dragX); dragX = e.clientX; } });
    drag.addEventListener('pointerup', () => { dragX = null; });
    drag.addEventListener('pointercancel', () => { dragX = null; });
    // Accueil : un glissement horizontal sur la voiture passe à la suivante.
    let hX = null;
    $('hDrag').addEventListener('pointerdown', (e) => { hX = e.target.closest('button') ? null : e.clientX; });
    document.addEventListener('pointerup', (e) => { if (hX === null) return; const dx = e.clientX - hX; hX = null; if (!$('home').hidden && Math.abs(dx) > 40) homeCar(dx < 0 ? 1 : -1); });
    document.addEventListener('pointercancel', () => { hX = null; });
    // Salle des trophées : on glisse pour passer d'un trophée à l'autre.
    const tDrag = $('tDrag');
    let tX = null;
    tDrag.addEventListener('pointerdown', (e) => { tX = e.clientX; try { tDrag.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } });
    tDrag.addEventListener('pointermove', (e) => { if (tX !== null) view.dragTrophies(e.clientX - tX); });
    const tUp = (e) => {
      if (tX === null) return;
      const dx = e.clientX - tX; tX = null; view.dragTrophies(0);
      if (Math.abs(dx) > 40) trophyGo(tIdx + (dx < 0 ? 1 : -1));
    };
    tDrag.addEventListener('pointerup', tUp);
    tDrag.addEventListener('pointercancel', () => { tX = null; view.dragTrophies(0); });
    MB.debug = { go: (k) => { if (k === 'garage') renderGarage(); if (k === 'gup') { gTab = 'up'; renderGarage(); } if (k === 'gstyle') { gTab = 'style'; renderGarage(); } if (k === 'settings') renderSettings(); if (k === 'tracks') renderTracks(); if (k === 'cups') renderCups(); if (k === 'editor') renderEditor(); if (k === 'shop') renderShop(); if (k === 'trophies') { tIdx = -1; renderTrophies(); } if (k === 'finish') { race.player.prog = race.laps * race.track.length - 2; } },
      race: () => race, sound: () => Sound, finishNow: () => { while (race.state !== 'done') { race.step(1 / 60, MB.botInput(race)); recordFrame(); } race.events = []; startReplay(); }, start: buildRace, save: () => save, menu, setSave: (o) => Object.assign(save, o), view: () => view };
    menu();
    const m = location.hash.match(/race=(\w+)/);
    if (location.hash.indexOf('chrono') >= 0) trackMode = 'chrono';     // tests : contre-la-montre
    if (location.hash.indexOf('duo') >= 0) trackMode = 'duo';           // tests : à deux
    const vm = location.hash.match(/v=(\w+)/);                       // tests : variante (nuit, pluie, inverse)
    if (m) { $('daily').hidden = true; $('notifAsk').hidden = true; await view.preload(getTrack(m[1], vm && vm[1])); buildRace(m[1], vm && vm[1]); }
    const ff = location.hash.match(/ff=(\d+)/);                // tests : avance la course sans rendu
    if (ff && race) { MB.REEL.reseed(777); for (let i = 0; i < +ff[1] * 60; i++) race.step(1 / 60, MB.botInput(race)); }
    const sc = location.hash.match(/screen=(\w+)/);
    if (sc) MB.debug.go(sc[1]);
    MB.REEL.reseed(4242);
    requestAnimationFrame(loop);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
})(window.MB = window.MB || {});
