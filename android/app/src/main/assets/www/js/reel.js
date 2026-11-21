// Rendu réaliste : A voitures « miniature métal », B lumière et reflets du vrai décor, C matières (photos CC0 Poly Haven),
// D objectif photo. Réglage « Rendu réaliste » (localStorage) ; tests : #reel=ABCD (ou #reel=0), &tex=code, &still=N, &cam=front|rear|mat.
(function (MB) {
  const T = THREE, hash = location.hash, m = hash.match(/reel=(\w*)/);
  const R = (MB.REEL = { img: {} });
  const get = (k) => { try { return localStorage.getItem('minibolides.' + k); } catch (e) { return null; } };
  const put = (k, v) => { try { if (v == null) localStorage.removeItem('minibolides.' + k); else localStorage.setItem('minibolides.' + k, v); } catch (e) { /* stockage indisponible */ } };
  R.pref = () => get('gfx') !== '0';
  R.apply = () => {
    const on = R.pref() && get('lowq') !== '1';                 // téléphone déjà jugé trop juste : ancien rendu
    for (const k of 'ABCD') R[k] = m ? m[1].toUpperCase().indexOf(k) >= 0 : on;
    if (!m && get('nopost') === '1') R.D = false;
    R.photo = R.C && !/tex=code/.test(hash);
  };
  R.setPref = (v) => { put('gfx', v ? null : '0'); if (v) { put('nopost', null); put('lowq', null); } R.apply(); };
  R.dropPost = (why) => { R.D = false; put('nopost', '1'); if (R.note) R.note('Objectif photo coupé : ' + why); };
  R.apply();
  const st = hash.match(/still=(\d+)/);
  R.still = st ? +st[1] : 0;
  R.close = (hash.match(/cam=(\w+)/) || [])[1] || null;

  // Captures reproductibles : même hasard d'un lancement à l'autre.
  let seed = 12345;
  R.reseed = (s) => { seed = s || 12345; };
  if (R.still) Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // ---------- Photos de matières : un script par matière (js/tex/, base64 car file:// interdit de les lire autrement), chargé à la demande ----------
  R.GROUND = { bois: 'bois', nuit: 'bois', sable: 'sable', neige: 'neige', mousse: 'mousse', plancher: 'plancher', ville: 'tapis', tapis: 'tapis', vichy: 'tapis' };
  const sets = {};
  R.set = (n) => sets[n] || (sets[n] = new Promise((ok) => {
    const s = document.createElement('script'), done = () => { clearTimeout(to); if (!R.img[n]) delete sets[n]; ok(R.img[n] || null); }, to = setTimeout(done, 6000);
    s.src = 'js/tex/' + n + '.js'; s.onerror = done;
    s.onload = () => {
      const src = (MB.TEX || {})[n], o = {};
      if (!src) return done();
      Promise.all(Object.keys(src).map((k) => new Promise((r) => { const i = new Image(); i.onload = () => { o[k] = i; r(); }; i.onerror = r; i.src = src[k]; }))).then(() => { R.img[n] = o; delete MB.TEX[n]; done(); });
    };
    document.head.appendChild(s);
  }));
  // Matières d'un monde : la route et son sol. On ne garde en mémoire que le sol du dernier monde visité.
  R.load = (ground) => {
    if (!R.photo) return Promise.resolve();
    const g = R.GROUND[ground];
    for (const k of Object.keys(R.img)) if (k !== 'route' && k !== g) { delete R.img[k]; delete sets[k]; }
    return Promise.all([R.set('route'), g ? R.set(g) : null]);
  };
  R.has = (ground) => !!R.img.route && (!R.GROUND[ground] || !!R.img[R.GROUND[ground]]);
  const tex = (c, srgb) => { const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; if (srgb) t.encoding = T.sRGBEncoding; return t; };
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // Image répétée nx × ny fois dans un canevas w × h.
  R.tile = (img, w, h, nx, ny) => { const c = cv(w, h), g = c.getContext('2d'); for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) g.drawImage(img, (i * w) / nx, (j * h) / ny, w / nx + 1, h / ny + 1); return c; };

  // Photo d'asphalte ramenée à la couleur de route du monde : on garde le grain (écart à la moyenne), on change la teinte.
  R.tint = (img, hex) => {
    const c = cv(img.width, img.height), g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    if (!hex) { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#74777e'; g.fillRect(0, 0, c.width, c.height); return c; }   // asphalte gris d'origine
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, col = new T.Color(hex);
    let mean = 0; for (let i = 0; i < p.length; i += 64) mean += p[i + 1];
    mean /= p.length / 64;
    const kr = (col.r * 255 * 0.78) / mean, kg = (col.g * 255 * 0.78) / mean, kb = (col.b * 255 * 0.78) / mean;
    for (let i = 0; i < p.length; i += 4) { const l = mean + (p[i + 1] - mean) * 0.6; p[i] = l * kr; p[i + 1] = l * kg; p[i + 2] = l * kb; }   // grain adouci : il ressort trop sur une route claire
    g.putImageData(d, 0, 0);
    return c;
  };

  // Relief tiré de la luminance d'une texture dessinée (bois, grain) : version « par le code » du lot C.
  R.bumpFrom = (srcTex, gain) => {
    const s = srcTex.image, c = cv(s.width, s.height), g = c.getContext('2d');
    g.filter = 'grayscale(1) contrast(' + (gain || 1.6) + ')'; g.drawImage(s, 0, 0);
    const t = tex(c, false); t.repeat.copy(srcTex.repeat); return t;
  };
  // Grain fin répétable (asphalte, plastique moulé).
  R.grain = (size, n, lo, hi, dot) => {
    const c = cv(size, size), g = c.getContext('2d');
    g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < n; i++) { const l = Math.floor(lo + Math.random() * (hi - lo)), r = dot * (0.5 + Math.random()); g.fillStyle = `rgb(${l},${l},${l})`; g.beginPath(); g.arc(Math.random() * size, Math.random() * size, r, 0, 7); g.fill(); }
    return c;
  };

  // ---------- Lot B : reflets du vrai décor ----------
  R.captureEnv = (r, scene, x, y, z, night) => {
    const half = !!(r.capabilities.isWebGL2 && r.extensions.get('EXT_color_buffer_float'));
    const rt = new T.WebGLCubeRenderTarget(256, { format: T.RGBAFormat, type: half ? T.HalfFloatType : T.UnsignedByteType, generateMipmaps: false });
    const cam = new T.CubeCamera(1, 1500, rt); cam.position.set(x, y, z);
    // Sources lumineuses vues seulement par les reflets : la fenêtre et deux plafonniers.
    const lights = new T.Group(), k = night ? 2.5 : 1;
    const box = (w, h, px, py, pz, v) => { const l = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(v * 1.0, v * 0.97, v * 0.9), side: T.DoubleSide, fog: false })); l.position.set(x + px, py, z + pz); l.lookAt(x, y, z); lights.add(l); };
    box(70, 44, 260, 150, 170, 5 / k); box(50, 16, -120, 200, 60, 3.5 / k); box(50, 16, 40, 210, -150, 3 / k);
    scene.add(lights);
    const tm = r.toneMapping; r.toneMapping = T.NoToneMapping;
    cam.update(r, scene);
    r.toneMapping = tm; scene.remove(lights);
    lights.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    const pm = new T.PMREMGenerator(r), env = pm.fromCubemap(rt.texture).texture;
    pm.dispose(); rt.dispose();
    scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((q) => { q.needsUpdate = true; }); });
    return env;
  };

  // ---------- Lot D : objectif photo (profondeur de champ, halo, vignettage, étalonnage) ----------
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  class Post {
    constructor(r) {
      this.r = r; this.cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.scene = new T.Scene();
      this.quad = new T.Mesh(new T.PlaneGeometry(2, 2), null); this.quad.frustumCulled = false; this.scene.add(this.quad);
      const mat = (fs, u) => new T.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false, toneMapped: false });
      this.bright = mat('varying vec2 vUv; uniform sampler2D t; uniform vec2 px; void main(){ vec3 c = vec3(0.0); for (int i = 0; i < 4; i++) { vec2 o = vec2(i < 2 ? -1.0 : 1.0, (i == 0 || i == 2) ? -1.0 : 1.0) * px; c += texture2D(t, vUv + o).rgb; } c *= 0.25; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(0.9, 1.0, l), 1.0); }', { t: { value: null }, px: { value: new T.Vector2() } });
      this.blur = mat('varying vec2 vUv; uniform sampler2D t; uniform vec2 d; void main(){ vec3 c = texture2D(t, vUv).rgb * 0.227; c += (texture2D(t, vUv + d * 1.385).rgb + texture2D(t, vUv - d * 1.385).rgb) * 0.316; c += (texture2D(t, vUv + d * 3.231).rgb + texture2D(t, vUv - d * 3.231).rgb) * 0.0703; gl_FragColor = vec4(c, 1.0); }', { t: { value: null }, d: { value: new T.Vector2() } });
      // Flou de mise au point : disque de 22 prises, pondérées par leur propre flou pour que le net ne bave pas sur le flou.
      this.dof = mat(`varying vec2 vUv; uniform sampler2D t; uniform sampler2D zb; uniform vec2 px; uniform float near; uniform float far; uniform float focus; uniform float maxR;
        float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
        float coc(vec2 uv){ float z = lin(texture2D(zb, uv).x); float c = (z - focus) / z; return clamp(c > 0.0 ? (c - 0.28) * 1.25 : (-c - 0.55) * 0.4, 0.0, 1.0); }
        void main(){ float c0 = coc(vUv); vec4 acc = vec4(texture2D(t, vUv).rgb, 1.0);
          if (c0 > 0.01) { float a = 0.0; for (int i = 1; i <= 22; i++) { a += 2.39996; float rr = sqrt(float(i) / 22.0) * c0 * maxR; vec2 uv = vUv + vec2(cos(a), sin(a)) * rr * px; float w = 0.15 + coc(uv); acc += vec4(texture2D(t, uv).rgb * w, w); } }
          gl_FragColor = vec4(acc.rgb / acc.a, 1.0); }`, { t: { value: null }, zb: { value: null }, px: { value: new T.Vector2() }, near: { value: 1 }, far: { value: 900 }, focus: { value: 14 }, maxR: { value: 9 } });
      this.final = mat(`varying vec2 vUv; uniform sampler2D t; uniform sampler2D bloom; uniform float time;
        void main(){ vec3 c = texture2D(t, vUv).rgb + texture2D(bloom, vUv).rgb * 0.32;
          float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, 1.08);            // saturation
          c = (c - 0.5) * 1.06 + 0.5; c *= vec3(1.02, 1.0, 0.965);                             // contraste, ton chaud
          vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 0.42;                                     // vignettage
          float n = fract(sin(dot(vUv * 913.0 + time, vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.018;
          gl_FragColor = vec4(c, 1.0); }`, { t: { value: null }, bloom: { value: null }, time: { value: 0 } });
    }
    size(w, h) {
      if (this.w === w && this.h === h) return;
      this.w = w; this.h = h;
      for (const k of ['main', 'a', 'b', 'c']) if (this[k]) this[k].dispose();
      const gl2 = this.r.capabilities.isWebGL2;
      this.main = gl2 ? new T.WebGLMultisampleRenderTarget(w, h, { format: T.RGBAFormat }) : new T.WebGLRenderTarget(w, h, { format: T.RGBAFormat });
      if (gl2) this.main.samples = 4;
      this.main.texture.encoding = T.sRGBEncoding;                 // l'image sort déjà étalonnée pour l'écran
      this.main.depthTexture = new T.DepthTexture(w, h); this.main.depthTexture.type = T.UnsignedIntType;
      const o = { format: T.RGBAFormat, depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter };
      this.a = new T.WebGLRenderTarget(w, h, o);
      this.b = new T.WebGLRenderTarget(w >> 2, h >> 2, o); this.c = new T.WebGLRenderTarget(w >> 2, h >> 2, o);
    }
    pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.scene, this.cam); }
    render(scene, cam, focus) {
      const r = this.r, s = r.getDrawingBufferSize(new T.Vector2());
      this.size(s.x, s.y);
      r.setRenderTarget(this.main); r.render(scene, cam);
      const sh = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false;
      const u = this.dof.uniforms; u.t.value = this.main.texture; u.zb.value = this.main.depthTexture; u.px.value.set(1 / this.w, 1 / this.h); u.near.value = cam.near; u.far.value = cam.far; u.focus.value = focus; u.maxR.value = this.h / (R.close ? 90 : 240);
      this.pass(this.dof, this.a);
      this.bright.uniforms.t.value = this.a.texture; this.bright.uniforms.px.value.set(1 / this.w, 1 / this.h); this.pass(this.bright, this.b);
      for (let i = 0; i < 2; i++) {
        this.blur.uniforms.t.value = this.b.texture; this.blur.uniforms.d.value.set((1 + i) * 4 / this.w, 0); this.pass(this.blur, this.c);
        this.blur.uniforms.t.value = this.c.texture; this.blur.uniforms.d.value.set(0, (1 + i) * 4 / this.h); this.pass(this.blur, this.b);
      }
      const f = this.final.uniforms; f.t.value = this.a.texture; f.bloom.value = this.b.texture; f.time.value = (f.time.value + 0.37) % 10;
      this.pass(this.final, null);
      r.shadowMap.autoUpdate = sh;
    }
  }
  R.Post = Post;
})(window.MB = window.MB || {});
