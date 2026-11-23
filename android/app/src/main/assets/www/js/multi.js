// Jeu en réseau : en ligne (serveur Hangar) ou en Wi-Fi (le téléphone hôte fait le relais, même protocole).
// Le téléphone qui crée le salon arbitre : circuit, cylindrée, rivaux, départ et classement. Chaque téléphone calcule
// sa propre voiture et envoie sa position aux autres ; les voitures des autres joueurs se traversent (fantômes).
(function (MB) {
  const NET_HZ = 20, READY_WAIT = 9, FINISH_WAIT = 30, MAX_CARS = 6, RESUME_TRIES = 5;

  // ---------- Liaison WebSocket ----------
  // Messages du serveur (ou du relais Wi-Fi) remis tels quels à on(m) ; reprise automatique après une coupure en ligne.
  class Link {
    constructor(url, hello, on) { this.url = url; this.hello = hello; this.on = on; this.token = null; this.left = false; this.tries = 0; this.open(); }
    open() {
      let ws;
      try { ws = new WebSocket(this.url); } catch (e) { return this.on({ t: 'closed', reason: 'no_network' }); }
      this.ws = ws;
      ws.onopen = () => { this.tries = 0; ws.send(JSON.stringify(this.token ? { t: 'resume', token: this.token } : this.hello)); };
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.token) this.token = m.token;
        if (m.t === 'error' && m.reason === 'token_invalid') this.token = null;
        this.on(m);
      };
      ws.onclose = (ev) => {
        if (this.ws !== ws || this.left) return;
        // Coupure réseau pendant une partie en ligne : on retente avec le jeton (la place est gardée 30 s).
        const final = ['room_closed', 'kicked', 'left', 'expired', 'timeout'].includes(ev.reason);
        if (this.token && !final && this.tries < RESUME_TRIES) { this.tries++; this.on({ t: 'reconnecting' }); setTimeout(() => { if (!this.left) this.open(); }, 800 * this.tries); return; }
        this.on({ t: 'closed', reason: ev.reason || (this.everOpen ? 'lost' : 'no_network') });
      };
      ws.addEventListener('open', () => { this.everOpen = true; });
    }
    raw(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
    all(m, vol) { this.raw(vol ? { t: 'all', v: 1, m } : { t: 'all', m }); }
    to(id, m) { this.raw({ t: 'to', id, m }); }
    close() { this.left = true; try { this.raw({ t: 'leave' }); this.ws.close(); } catch (e) { /* déjà fermée */ } }
  }
  MB.NetLink = Link;

  // ---------- Salon ----------
  // api : fonctions du jeu (game.js) dont le salon a besoin.
  MB.makeMulti = function (api) {
    const { $, t, L, save, persist } = api;
    const bridge = window.AndroidBridge;
    const TX = {
      title: ['Jouer à plusieurs', 'Multiplayer'], online: ['🌐 En ligne', '🌐 Online'], onlineD: ['Avec des amis, où qu\'ils soient (Wi-Fi ou 4G)', 'With friends anywhere (Wi-Fi or mobile data)'],
      wifi: ['📶 Wi-Fi', '📶 Wi-Fi'], wifiD: ['Sur le même Wi-Fi, sans internet', 'On the same Wi-Fi, no internet needed'],
      create: ['Créer un salon', 'Create a room'], join: ['Rejoindre', 'Join'], code: ['Code du salon', 'Room code'], name: ['Ton nom de pilote', 'Your driver name'],
      scanning: ['Recherche des salons Wi-Fi…', 'Looking for Wi-Fi rooms…'], none: ['Aucun salon pour l\'instant. Demande à l\'hôte de créer le sien.', 'No room yet. Ask the host to create one.'],
      byIp: ['Ou l\'adresse affichée chez l\'hôte', 'Or the address shown on the host'], lobby: ['Salon', 'Room'], players: ['Pilotes', 'Drivers'],
      host: ['hôte', 'host'], you: ['toi', 'you'], track: ['Circuit', 'Track'], cc: ['Cylindrée', 'Engine class'],
      rivals: ['Compléter avec des rivaux', 'Fill up with rivals'], rivalsD: ['Les places libres (6 voitures) sont prises par l\'ordinateur', 'Empty slots (6 cars) go to computer rivals'],
      start: ['DÉPART !', 'START!'], needTwo: ['Il faut au moins 2 pilotes (ou des rivaux)', 'You need at least 2 drivers (or rivals)'], wait: ['L\'hôte choisit le circuit et donne le départ', 'The host picks the track and starts the race'],
      quit: ['Quitter le salon', 'Leave the room'], connecting: ['Connexion…', 'Connecting…'], reconnecting: ['Connexion perdue, nouvel essai…', 'Connection lost, retrying…'],
      waitOthers: ['En attente des autres pilotes…', 'Waiting for the other drivers…'], waitStart: ['Les autres pilotes arrivent…', 'Other drivers are getting ready…'],
      again: ['Retour au salon', 'Back to the room'], dnf: ['abandon', 'out'], shareCode: ['Donne ce code à tes amis', 'Give this code to your friends'],
      wifiShare: ['Les autres le voient dans « Wi-Fi » s\'ils sont sur le même réseau', 'Others see it under “Wi-Fi” if they are on the same network'],
      e_room_not_found: ['Salon introuvable : vérifie le code', 'Room not found: check the code'], e_room_locked: ['Course en cours dans ce salon, réessaie à la fin', 'A race is on in this room, try again after it'],
      e_room_full: ['Salon complet (4 pilotes)', 'Room full (4 drivers)'], e_server_full: ['Serveur complet, réessaie plus tard', 'Server full, try again later'], e_rate_limited: ['Trop d\'essais, attends une minute', 'Too many tries, wait a minute'],
      e_no_network: ['Pas de connexion au serveur', 'Cannot reach the server'], e_lost: ['Connexion perdue', 'Connection lost'], e_room_closed: ['L\'hôte a fermé le salon', 'The host closed the room'],
      e_kicked: ['Tu as été retiré du salon', 'You were removed from the room'], e_server_restart: ['Le serveur redémarre, recrée le salon dans un instant', 'The server is restarting, create the room again in a moment'],
      e_update: ['Mets à jour Mini Bolides pour jouer en ligne', 'Update Mini Bolides to play online'], e_wifi: ['Impossible d\'ouvrir le salon Wi-Fi', 'Could not open the Wi-Fi room'],
      e_old: ['Un pilote a une version différente du jeu : mettez-vous tous à jour', 'A driver has a different game version: everyone should update'],
      e_off: ['Le jeu en ligne est en pause pour le moment', 'Online play is paused for now'],
    };
    const tx = (k) => (TX[k] ? TX[k][api.lang === 'fr' ? 0 : 1] : k);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PROTO = 1;                                           // version des messages du jeu ; un écart refuse le départ
    let S = null;                                              // session en cours
    let lanRooms = {};

    const remote = () => { try { return JSON.parse((bridge && bridge.remoteConfig && bridge.remoteConfig()) || '{}'); } catch (e) { return {}; } };
    // Hors Android (copie web, essais) : adresse de secours, ou ?server=… pour viser un serveur de test.
    const serverUrl = () => (bridge && bridge.serverUrl ? bridge.serverUrl() : (typeof location !== 'undefined' && new URLSearchParams(location.search).get('server')) || 'https://mini-bolides.piperault.fr/');
    const wsUrl = () => serverUrl().replace(/^http/, 'ws').replace(/\/?$/, '/') + 'api/v1/rooms/ws';
    const myName = () => (save.netName || '').trim().slice(0, 14) || (api.lang === 'fr' ? 'Pilote' : 'Driver');
    const me = () => ({ name: myName(), car: save.car, hex: api.paintHex(), look: save.look, proto: PROTO });

    // ---------- Écran d'accueil du jeu à plusieurs ----------
    function home(msg) {
      if (S) end();
      const cfg = remote(), vc = bridge && bridge.versionCode ? bridge.versionCode() : 0;
      const offline = cfg.flags && cfg.flags.online === false, old = cfg.min_version_code && vc && vc < cfg.min_version_code;
      $('mpBody').innerHTML = `<h2>${tx('title')}</h2>`
        + (msg ? `<p class="mpmsg">${esc(msg)}</p>` : '')
        + (cfg.message ? `<p class="small">${esc(cfg.message)}</p>` : '')
        + `<label class="mpl">${tx('name')}<input id="mpName" maxlength="14" value="${esc(save.netName || '')}" placeholder="${esc(myName())}" autocomplete="off"></label>`
        + `<div class="mpbox"><h3>${tx('online')}</h3><p class="small">${tx('onlineD')}</p>`
        + (offline ? `<p class="mpmsg">${tx('e_off')}</p>` : old ? `<p class="mpmsg">${tx('e_update')}</p>` : `<button class="btn primary" data-mp="create">${tx('create')}</button>
            <div class="mprow"><input id="mpCode" maxlength="4" placeholder="${tx('code')}" autocomplete="off" autocapitalize="characters"><button class="btn" data-mp="join">${tx('join')}</button></div>`)
        + `</div>`
        + (bridge && bridge.lanHost ? `<div class="mpbox"><h3>${tx('wifi')}</h3><p class="small">${tx('wifiD')}</p><button class="btn" data-mp="lanCreate">${tx('create')}</button>
            <div id="mpLan"><p class="small">${tx('scanning')}</p></div>
            <div class="mprow"><input id="mpIp" placeholder="${tx('byIp')}" inputmode="decimal" autocomplete="off"><button class="btn" data-mp="lanIp">${tx('join')}</button></div></div>` : '')
        + `<button class="btn" data-mp="close">${t('close')}</button>`;
      api.show('multi');
      if (bridge && bridge.lanScan) { lanRooms = {}; bridge.lanScan(); }
    }
    window.mbLanFound = (name, host, port, lost) => {
      if (lost) delete lanRooms[name]; else lanRooms[name] = { host, port };
      const box = $('mpLan'); if (!box) return;
      const names = Object.keys(lanRooms);
      box.innerHTML = names.length ? names.map((n) => `<button class="row" data-mplan="${esc(n)}"><b>📶</b><span>${esc(n)}</span><i>${tx('join')} ›</i></button>`).join('') : `<p class="small">${tx('scanning')} ${tx('none')}</p>`;
    };
    const keepName = () => { const el = $('mpName'); if (el) { save.netName = el.value.trim().slice(0, 14); persist(); } };

    // ---------- Session ----------
    function begin(mode, url, hello) {
      keepName();
      if (bridge && bridge.lanScanStop) bridge.lanScanStop();
      S = { mode, host: hello.t === 'create', me: null, code: '', players: {}, settings: { track: api.defaultTrack(), diff: 'facile', rivals: false }, phase: 'connecting', ready: {}, sendT: 0 };
      S.link = new Link(url, hello, onServer);
      lobby();
    }
    function end() {
      if (!S) return;
      const s = S; S = null;
      s.link.close();
      if (s.lan && bridge && bridge.lanStop) bridge.lanStop();
    }
    function fail(reason) {
      const was = S; end();
      if (was && (was.phase === 'race' || was.phase === 'result')) api.backToMenu();
      home(tx('e_' + reason) !== 'e_' + reason ? tx('e_' + reason) : tx('e_lost'));
    }

    function onServer(m) {
      if (!S) return;
      switch (m.t) {
        case 'created': S.me = m.peer; S.code = m.code; S.phase = 'lobby'; S.players[S.me] = me(); lobby(); break;
        case 'joined': S.me = m.peer; S.code = m.code; S.phase = 'lobby'; S.link.to('h', Object.assign({ k: 'hi' }, me())); lobby(); break;
        case 'resumed': S.reconnecting = false; if (!S.host) S.link.to('h', Object.assign({ k: 'hi' }, me())); lobby(); break;
        case 'reconnecting': S.reconnecting = true; lobby(); break;
        case 'peer_joined': break;                             // il se présente avec « hi »
        case 'peer_left': peerLeft(m.id); break;
        case 'from': onGame(m.id, m.m || {}); break;
        case 'room_closed': case 'kicked': fail(m.t); break;
        case 'error': fail(m.reason); break;
        case 'closed': fail(m.reason === 'server_restart' ? 'server_restart' : m.reason === 'room_closed' || m.reason === 'kicked' ? m.reason : S.me ? 'lost' : 'no_network'); break;
      }
    }

    // Messages du jeu (champ k), relayés par le serveur.
    function onGame(from, m) {
      const race = api.race();
      switch (m.k) {
        case 'hi':                                             // (hôte) un pilote se présente
          if (!S.host) return;
          S.players[from] = { name: String(m.name || '?').slice(0, 14), car: MB.CARS.some((c) => c.id === m.car) ? m.car : 'bolide', hex: +m.hex || 0x2f62d9, look: m.look || {}, proto: m.proto };
          shareLobby(); lobby(); break;
        case 'lobby':                                          // (invités) état du salon
          if (S.host || from !== 'h') return;
          S.players = m.players || {}; S.settings = m.settings || S.settings;
          if (S.phase === 'lobby' || S.phase === 'connecting') { S.phase = 'lobby'; lobby(); }
          break;
        case 'start':                                          // (invités) départ : on construit la même course
          if (S.host || from !== 'h') return;
          startRace(m); break;
        case 'ready': if (S.host) { S.ready[from] = true; maybeGo(); } break;
        case 'go':                                             // l'hôte n'a pas attendu (téléphone lent) : départ dès que la course est prête
          if (S.host) return;
          S.go = true; if (race && race.net && S.built) race.hold = false; break;
        case 'st': if (race && race.net && Array.isArray(m.c)) for (const s of m.c) race.netPush(s); break;
        case 'res':                                            // (invités) classement final
          if (S.host || from !== 'h' || !race || !race.net) return;
          race.netFinish(m.rows || []); break;
      }
    }

    function peerLeft(id) {
      if (!S) return;
      delete S.players[id];
      const race = api.race();
      if (race && race.net) { const c = race.cars.find((q) => q.netId === id); if (c && !c.finished) { c.finished = true; c.time = 1e9; c.dnf = true; c.gone = true; } }
      if (S.host) { shareLobby(); if (S.phase === 'race') maybeGo(); }
      if (S.phase === 'lobby') lobby();
    }

    const shareLobby = () => { if (S && S.host) S.link.all({ k: 'lobby', players: S.players, settings: S.settings }); };

    // ---------- Écran du salon ----------
    function lobby() {
      if (!S || (S.phase !== 'lobby' && S.phase !== 'connecting')) return;
      const st = S.settings, ids = Object.keys(S.players), track = MB.TRACKS.find((d) => d.id === st.track) || MB.TRACKS[0];
      const code = S.mode === 'lan' ? `📶 ${esc(S.ip || 'Wi-Fi')}` : esc(S.code || '····');
      let h = `<h2>${tx('lobby')} <b class="mpcode">${code}</b></h2>`;
      if (S.phase === 'connecting') h += `<p class="small">${tx('connecting')}</p>`;
      if (S.reconnecting) h += `<p class="mpmsg">${tx('reconnecting')}</p>`;
      if (S.host && S.phase === 'lobby') h += `<p class="small">${S.mode === 'lan' ? tx('wifiShare') : tx('shareCode')}</p>`;
      h += `<h3>${tx('players')} · ${ids.length}/4</h3>` + ids.map((id) => {
        const p = S.players[id], car = MB.CARS.find((c) => c.id === p.car);
        return `<div class="row mpp"><b style="color:#${(+p.hex || 0).toString(16).padStart(6, '0')}">●</b><span>${esc(p.name)}${id === S.me ? ` <i>(${tx('you')})</i>` : ''}${id === 'h' ? ` <i>· ${tx('host')}</i>` : ''}<small>${car ? esc(L(car.name)) : ''}</small></span></div>`;
      }).join('');
      if (S.host) {
        const open = api.openTracks();
        h += `<h3>${tx('track')}</h3><div class="seg mptr">${open.map((id) => `<button data-mptrack="${id}" class="${id === st.track ? 'sel' : ''}">${esc(L(MB.TRACKS.find((d) => d.id === id).name))}</button>`).join('')}</div>`
          + `<h3>${tx('cc')}</h3><div class="seg">${Object.keys(MB.DIFFS).map((k) => `<button data-mpcc="${k}" class="${k === st.diff ? 'sel' : ''}" ${save.ccOk[k] ? '' : 'disabled'}>${esc(L(MB.DIFFS[k].label))}</button>`).join('')}</div>`
          + `<button class="row" data-mp="rivals"><b>${st.rivals ? '☑' : '☐'}</b><span>${tx('rivals')}<small>${tx('rivalsD')}</small></span></button>`;
        const can = ids.length >= 2 || st.rivals;
        h += `<button class="btn primary" data-mp="start" ${can && S.phase === 'lobby' ? '' : 'disabled'}>${tx('start')}</button>` + (can ? '' : `<p class="small">${tx('needTwo')}</p>`);
      } else if (S.phase === 'lobby') {
        h += `<p class="reward">${esc(L(track.name))} · ${esc(L(MB.DIFFS[st.diff] ? MB.DIFFS[st.diff].label : MB.DIFFS.facile.label))}${st.rivals ? ' · 🤖' : ''}</p><p class="small">${tx('wait')}</p>`;
      }
      h += `<button class="btn" data-mp="quit">${tx('quit')}</button>`;
      $('mpBody').innerHTML = h;
      api.show('multi');
    }

    // ---------- Départ ----------
    function hostStart() {
      const ids = Object.keys(S.players);
      if (ids.some((id) => S.players[id].proto !== PROTO)) return lobbyMsg(tx('e_old'));
      const seed = (Date.now() & 0xffff) + 1, rnd = ((x) => () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296)(seed);
      const humans = ids.slice().sort(() => rnd() - 0.5).map((id) => Object.assign({ id, kind: 'human' }, S.players[id]));
      const nAi = S.settings.rivals ? Math.max(0, MAX_CARS - humans.length) : 0;
      // Les rivaux partent devant (comme hors ligne), les pilotes derrière.
      const ai = []; for (let g = 0; g < nAi; g++) ai.push({ id: 'ai' + g, kind: 'ai', car: MB.RIVAL_CARS[g % MB.RIVAL_CARS.length], name: MB.RIVALS[g % MB.RIVALS.length] });
      const msg = { k: 'start', seed, track: S.settings.track, diff: S.settings.diff, grid: ai.concat(humans) };
      S.link.raw({ t: 'lock', track: msg.track, cc: Object.keys(MB.DIFFS).indexOf(msg.diff) + 1 });
      S.link.all(msg);
      startRace(msg);
    }
    function lobbyMsg(text) { lobby(); const b = $('mpBody'); if (b) b.insertAdjacentHTML('afterbegin', `<p class="mpmsg">${esc(text)}</p>`); }

    function startRace(m) {
      if (!MB.TRACKS.some((d) => d.id === m.track) || !MB.DIFFS[m.diff]) return;
      S.phase = 'race'; S.ready = {}; S.go = false; S.built = false; S.firstFin = null; S.resSent = false; S.startedAt = performance.now();
      api.startNetRace({ track: m.track, diff: m.diff, seed: m.seed, net: { me: S.me, host: S.host, grid: m.grid } }, () => {
        // Course construite (le chargement prend plus ou moins longtemps selon le téléphone) : on attend tout le monde.
        if (!S) return;
        S.built = true;
        api.banner(tx('waitStart'));
        if (S.host) { S.ready[S.me] = true; maybeGo(); } else if (S.go) { const r = api.race(); if (r && r.net) r.hold = false; } else S.link.to('h', { k: 'ready' });
      });
    }
    // (hôte) Tous prêts, ou délai écoulé : top départ pour tout le monde au même moment.
    function maybeGo() {
      const race = api.race();
      if (!S || !S.host || !race || !race.net || !race.hold) return;
      const humans = race.cars.filter((c) => c.human && !c.gone), all = humans.every((c) => S.ready[c.netId]);
      if (all || (performance.now() - S.startedAt) / 1000 > READY_WAIT) { S.link.all({ k: 'go' }); race.hold = false; }
    }

    // ---------- Pendant la course (appelé à chaque image par game.js) ----------
    function tick() {
      const race = api.race();
      if (!S || !race || !race.net) return;
      if (race.hold) { if (S.host) maybeGo(); return; }
      api.banner(race.hold ? tx('waitStart') : '');
      const now = performance.now();
      if (now - S.sendT >= 1000 / NET_HZ) {                    // ma voiture, et chez l'hôte les rivaux de l'ordinateur
        S.sendT = now;
        const mine = race.cars.filter((c) => !c.remote && (c.isPlayer || S.host));
        S.link.all({ k: 'st', c: mine.map((c) => race.netState(c)) }, true);
      }
      if (race.player.finished && race.state !== 'done') api.banner(tx('waitOthers'));
      if (!S.host || race.state === 'done' || S.resSent) return;
      // (hôte) Fin : tous les pilotes arrivés (ou partis), ou 30 s après le premier arrivé.
      const humans = race.cars.filter((c) => c.human);
      if (humans.some((c) => c.finished) && S.firstFin == null) S.firstFin = race.clock;
      if (humans.every((c) => c.finished) || (S.firstFin != null && race.clock - S.firstFin > FINISH_WAIT)) {
        const rows = race.cars.map((c) => ({ id: c.netId, time: c.dnf || (c.human && !c.finished) ? null : Math.round(race.etaOf(c) * 1000) / 1000 }))
          .sort((a, b) => (a.time == null ? 1e9 : a.time) - (b.time == null ? 1e9 : b.time));
        S.resSent = true;
        S.link.all({ k: 'res', rows });
        race.netFinish(rows);
      }
    }

    // Classement affiché à l'arrivée (rendu par game.js).
    function resultRows(race) {
      return race.ranked.map((c, i) => `<li class="${c.isPlayer ? 'me' : ''}"><b>${i + 1}</b><span>${c.human ? '👤 ' : ''}${esc(c.isPlayer ? `${c.name || myName()} (${tx('you')})` : c.name)}</span><em>${c.dnf ? tx('dnf') : api.fmt(c.time)}</em></li>`).join('');
    }
    function afterRace() {
      if (!S) return api.backToMenu();
      S.phase = 'lobby';
      if (S.host) { S.link.raw({ t: 'open' }); shareLobby(); }
      lobby();
    }

    // ---------- Boutons ----------
    function click(d) {
      if (d.mp === 'close') { if (bridge && bridge.lanScanStop) bridge.lanScanStop(); return api.backToMenu(); }
      if (d.mp === 'create') return begin('online', wsUrl(), { t: 'create' });
      if (d.mp === 'join') {
        const code = ($('mpCode').value || '').trim().toUpperCase();
        if (!/^[A-Z]{4}$/.test(code)) return home(tx('e_room_not_found'));
        return begin('online', wsUrl(), { t: 'join', code });
      }
      if (d.mp === 'lanCreate') {
        keepName();
        const port = bridge.lanHost(`${myName()} · Mini Bolides`);
        if (port < 0) return home(tx('e_wifi'));
        begin('lan', `ws://127.0.0.1:${port}/`, { t: 'create' });
        S.lan = true; S.ip = bridge.localIp() ? `${bridge.localIp()}:${port}` : 'Wi-Fi';
        return lobby();
      }
      if (d.mplan) { const r = lanRooms[d.mplan]; if (r) return begin('lan', `ws://${r.host}:${r.port}/`, { t: 'join', code: 'WIFI' }); return; }
      if (d.mp === 'lanIp') {
        const v = ($('mpIp').value || '').trim(), mm = v.match(/^(\d{1,3}(?:\.\d{1,3}){3}):(\d{2,5})$/);
        if (!mm) return home(tx('e_room_not_found'));
        return begin('lan', `ws://${mm[1]}:${mm[2]}/`, { t: 'join', code: 'WIFI' });
      }
      if (!S) return;
      if (d.mp === 'quit') { end(); return home(); }
      if (d.mptrack && S.host) { S.settings.track = d.mptrack; shareLobby(); return lobby(); }
      if (d.mpcc && S.host && save.ccOk[d.mpcc]) { S.settings.diff = d.mpcc; shareLobby(); return lobby(); }
      if (d.mp === 'rivals' && S.host) { S.settings.rivals = !S.settings.rivals; shareLobby(); return lobby(); }
      if (d.mp === 'start' && S.host && S.phase === 'lobby') return hostStart();
    }

    MB.multiState = () => S && { mode: S.mode, phase: S.phase, me: S.me, code: S.code, host: S.host, players: Object.keys(S.players), ws: S.link.ws && S.link.ws.readyState, url: S.link.url };   // essais
    return { home, click, tick, resultRows, afterRace, quit: () => { end(); }, active: () => !!S, againLabel: () => tx('again') };
  };
})(typeof window !== 'undefined' ? (window.MB = window.MB || {}) : module.exports);
