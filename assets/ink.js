/* Ink: the hand-drawn line engine shared by the home page, /ride/ and /room/.
   Every line is drawn live with a slight wobble that redraws 8 times a second ("line boil"), like
   hand-drawn animation. Colors come from the page's CSS tokens, so both themes work.
   The character (FIG) has a big head and eyes for appeal, eyes that follow a look target, squash and
   stretch, and a scarf that follows through. Ink.weather() fetches Portland's current weather once per
   15 minutes (Open-Meteo, no key) and caches it. Nothing here runs in Plain mode or draws motion when the
   visitor asks for reduced motion. */
(function(){
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var COL = {};
  function readColors(){
    var cs = getComputedStyle(root);
    ['paper','ink','soft','rule','tint','sky','sun','rose','leaf','pop','night'].forEach(function(k){ COL[k] = cs.getPropertyValue('--' + k).trim(); });
  }
  readColors();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors); } catch (e) {}
  new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  var C = null, boil = 0, seedN = 0, T = 2;
  function rnd(n){ var x = Math.sin(n * 12.9898 + boil * 78.233) * 43758.5453; return x - Math.floor(x); }
  function J(){ return (rnd(++seedN) - .5) * 2; }
  function S(pts, w, a, col){
    if (pts.length < 2) return;
    C.globalAlpha = a == null ? 1 : a; C.lineWidth = w || 2.2; C.strokeStyle = col || COL.ink; C.beginPath();
    for (var i = 0; i < pts.length - 1; i++){
      var x1 = pts[i][0], y1 = pts[i][1], x2 = pts[i+1][0], y2 = pts[i+1][1];
      var n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 14));
      for (var k = (i ? 1 : 0); k <= n; k++){
        var t = k / n, m = (k && k < n) ? 1 : .5;
        var x = x1 + (x2 - x1) * t + J() * m, y = y1 + (y2 - y1) * t + J() * m;
        if (i === 0 && k === 0) C.moveTo(x, y); else C.lineTo(x, y);
      }
    }
    C.stroke(); C.globalAlpha = 1;
  }
  function Ln(x1, y1, x2, y2, w, a, col){ S([[x1, y1], [x2, y2]], w, a, col); }
  function O(cx, cy, r, w, fill, a){
    var n = Math.max(10, Math.round(r * 1.1)), a0 = rnd(++seedN) * 6.28, p = [];
    for (var i = 0; i <= n + 1; i++){ var an = a0 + i / n * 6.42, rr = r + J() * .35; p.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]); }
    if (fill){ C.fillStyle = fill; C.beginPath(); C.arc(cx, cy, r, 0, 6.283); C.fill(); }
    S(p, w || 2, a);
  }
  function R(x, y, w, h, lw, fill){ if (fill){ C.fillStyle = fill; C.fillRect(x, y, w, h); } S([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y - 1]], lw || 2); }
  function H(x, y, w, h, gap, a){ C.save(); C.beginPath(); C.rect(x, y, w, h); C.clip(); for (var i = -h; i < w; i += gap || 9) Ln(x + i, y + h, x + i + h, y, 1, a == null ? .5 : a); C.restore(); }
  function TX(s, x, y, sz, al, font){ C.fillStyle = COL.ink; C.font = (sz || 22) + 'px ' + (font || '"Patrick Hand","Comic Sans MS",cursive'); C.textAlign = al || 'center'; C.fillText(s, x, y); }
  /* loose watercolor: three translucent, irregular blobs */
  function WASH(x, y, rx, ry, col, a, seed){
    if (!col) return; C.save(); C.fillStyle = col;
    for (var l = 0; l < 3; l++){
      C.globalAlpha = (a || .28) * (l ? .55 : 1); C.beginPath();
      for (var i = 0; i <= 14; i++){
        var an = i / 14 * 6.283, wob = 1 + .13 * Math.sin(an * 3 + seed + l * 1.7) + .07 * Math.sin(an * 5 + seed * 2.3);
        var px = x + Math.cos(an) * rx * wob * (1 - l * .08), py = y + Math.sin(an) * ry * wob * (1 - l * .08);
        if (i) C.lineTo(px, py); else C.moveTo(px, py);
      }
      C.closePath(); C.fill();
    }
    C.restore();
  }
  function ease(t){ return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function cl(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function back(t){ var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  /* ---------- the character ---------- */
  function FIG(f){
    var fc = f.face || 1, x = f.x, y = f.y, m = f.mode || 'stand', P = COL.paper, sq = f.sq || 0, still = reduce.matches;
    C.save(); C.translate(x, y); C.scale(1 + sq * .6, 1 - sq); C.translate(-x, -y);
    if (f.alpha != null) C.globalAlpha = f.alpha;
    var jx = 0, hipY = y - 40, lean = f.lean || 0, bob = 0;
    if (m === 'shiver' && !still) jx = Math.sin(T * 55) * 1.2;
    if (m === 'walk') bob = -Math.abs(Math.sin(f.ph)) * 3.5;
    var seated = (m === 'sit' || m === 'write' || m === 'peer' || m === 'read');
    if (seated) hipY = y - (f.seat || 22);
    var br = still ? 0 : Math.sin(T * 2.3) * 1.1;
    var hx = x + jx, hy = hipY + bob, nx = hx + lean * fc, ny = hy - 26 + br * .4;
    var hcx = nx + fc, hcy = ny - 20;
    if (m === 'write' || m === 'read'){ hcx += fc * 5; hcy += 4; }
    if (m === 'peer'){ hcx += fc * 12; hcy += 6; }
    if (!seated){ var ga = C.globalAlpha; C.fillStyle = COL.ink; C.globalAlpha = ga * .1; C.beginPath(); C.ellipse(x, y + 2, 20, 3.5, 0, 0, 6.3); C.fill(); C.globalAlpha = ga; }
    var s, th, k;
    for (s = 0; s < 2; s++){
      if (m === 'walk'){ var p = f.ph + (s ? Math.PI : 0); th = Math.sin(p) * .55; k = Math.max(0, -Math.cos(p)) * .8; }
      else if (seated){ th = 1.4; k = 1.4 - (s ? .15 : 0); }
      else if (m === 'shiver'){ th = s ? .1 : -.1; k = -.25; }
      else if (m === 'crouch'){ th = s ? .5 : -.2; k = 1; }
      else { th = s ? .08 : -.08; k = 0; }
      var kx = hx + Math.sin(th) * 19 * fc, ky = hy + Math.cos(th) * 19, fx = kx + Math.sin(th - k) * 21 * fc, fy = ky + Math.cos(th - k) * 21;
      S([[hx, hy], [kx, ky], [fx, fy], [fx + 6 * fc, fy + .5]], 2.4);
    }
    S([[hx, hy], [(hx + nx) / 2 + fc * 1.5, (hy + ny) / 2], [nx, ny]], 2.6);
    var sw = still ? 0 : Math.sin(T * 6 + (f.ph || 0)) * (4 + (f.wind || 0) * 4), wind = m === 'walk' ? 1 : .35 + (f.wind || 0) * .65;
    S([[nx - 3 * fc, ny + 2], [nx - 15 * fc * wind, ny + 6 + sw], [nx - 25 * fc * wind, ny + 3 - sw]], 2.3);
    S([[nx + 3 * fc, ny + 1], [nx + 5 * fc, ny + 11]], 2);
    var sy = ny + 5;
    for (s = 0; s < 2; s++){
      var ex, ey, wx, wy;
      if (m === 'walk'){ var a = Math.sin(f.ph + (s ? 0 : Math.PI)) * .65; ex = nx + Math.sin(a) * 15 * fc; ey = sy + Math.cos(a) * 15; wx = ex + Math.sin(a + .35) * 14 * fc; wy = ey + Math.cos(a + .35) * 14; if (f.umbrella && s){ ex = nx + 9 * fc; ey = sy + 2; wx = nx + 12 * fc; wy = sy - 12; } }
      else if (f.umbrella && s){ ex = nx + 9 * fc; ey = sy + 2; wx = nx + 12 * fc; wy = sy - 12; }
      else if (m === 'shiver'){ ex = nx + (s ? 11 : 8) * fc; ey = sy + 11; wx = nx - (s ? 6 : 3) * fc; wy = sy + 3; }
      else if (m === 'write'){ if (s){ ex = nx + 14 * fc; ey = sy + 12; wx = nx + 26 * fc + (still ? 0 : Math.sin(T * 14) * 2.5); wy = sy + 17; } else { ex = nx + 10 * fc; ey = sy + 14; wx = nx + 20 * fc; wy = sy + 21; } }
      else if (m === 'read'){ ex = nx + 12 * fc; ey = sy + 13; wx = nx + 22 * fc; wy = sy + 6 + (s ? 0 : 6); }
      else if (m === 'peer'){ ex = nx + 14 * fc; ey = sy + 10; wx = nx + (s ? 26 : 22) * fc; wy = sy + (s ? 4 : 14); }
      else if (m === 'scratch' && s){ ex = nx + 14 * fc; ey = sy - 7; wx = hcx + 7 * fc; wy = hcy - 10 + (still ? 0 : Math.sin(T * 18) * 2); }
      else if (m === 'wave' && s){ ex = nx + 15 * fc; ey = sy - 13; wx = nx + 21 * fc + (still ? 0 : Math.sin(T * 10) * 7); wy = sy - 31; }
      else if (m === 'carry'){ ex = nx + 12 * fc; ey = sy + 12; wx = nx + 22 * fc; wy = sy + 4; }
      else if (m === 'throw' && s){ var an2 = lerp(-2.4, .9, f.k || 0); ex = nx + Math.cos(an2) * 14 * fc; ey = sy + Math.sin(an2) * 14; wx = ex + Math.cos(an2 - .3) * 14 * fc; wy = ey + Math.sin(an2 - .3) * 14; }
      else if (m === 'point' && s){ ex = nx + 14 * fc; ey = sy - 3; wx = nx + 28 * fc; wy = sy - 10; }
      else if (f.mug && s){ ex = nx + 10 * fc; ey = sy + 12; wx = nx + 14 * fc; wy = sy + 2; }
      else if (seated){ ex = nx + (s ? 9 : 6) * fc; ey = sy + 13; wx = nx + (s ? 21 : 18) * fc; wy = sy + 20; }
      else { ex = nx + (s ? 4 : -2) * fc; ey = sy + 15; wx = ex + (s ? 3 : 1) * fc; wy = ey + 14; }
      S([[nx, sy], [ex, ey], [wx, wy]], 2.2);
      if (s && f.hold) f.hold(wx, wy);
      if (s && f.umbrella){ // canopy over the head
        var ux = wx, uy = wy - 46; Ln(wx, wy + 6, ux, uy, 2);
        C.fillStyle = COL.paper; C.beginPath(); C.moveTo(ux - 42, uy + 12); C.quadraticCurveTo(ux, uy - 30, ux + 42, uy + 12); C.closePath(); C.fill();
        S([[ux - 42, uy + 12], [ux - 28, uy - 8], [ux, uy - 16], [ux + 28, uy - 8], [ux + 42, uy + 12]], 2.4);
        S([[ux - 42, uy + 12], [ux - 28, uy + 6], [ux - 14, uy + 12], [ux, uy + 6], [ux + 14, uy + 12], [ux + 28, uy + 6], [ux + 42, uy + 12]], 1.8);
        S([[wx, wy + 6], [wx - 3 * fc, wy + 10]], 2);
      }
      if (s && f.mug && !f.umbrella){ R(wx - 5, wy - 9, 10, 11, 1.6, COL.paper); if (!still){ var st = (T * .7) % 1; S([[wx, wy - 12 - st * 8], [wx + 3, wy - 18 - st * 8], [wx - 1, wy - 24 - st * 8]], 1.1, 1 - st); } }
      if (s && m === 'read'){ R(wx - 2, wy - 12, 16, 12, 1.6, COL.paper); Ln(wx + 6, wy - 12, wx + 6, wy, 1.2); }
    }
    O(hcx, hcy, 16, 2.4, P);
    S([[hcx - 16, hcy - 4], [hcx - 12, hcy - 15], [hcx, hcy - 20], [hcx + 12, hcy - 15], [hcx + 16, hcy - 4]], 2.4); Ln(hcx - 16, hcy - 4, hcx + 16, hcy - 4, 2);
    O(hcx - 3 * fc, hcy - 23, 3.6, 1.8, P);
    var dx = fc * 1.2, dy = .4, lk = f.look;
    if (lk){ var vx = lk.x - hcx, vy = lk.y - hcy, d = Math.hypot(vx, vy) || 1; dx = vx / d * 2.2; dy = vy / d * 1.8; }
    if (m === 'write' || m === 'peer' || m === 'read'){ dx = fc * 1.6; dy = 1.6; }
    var e1 = hcx + fc * 2 - 3, e2 = hcx + fc * 2 + 5, eY = hcy + 3, blink = !still && (T % 3.6) < .12;
    [e1, e2].forEach(function(ex){
      if (f.shades){ C.fillStyle = COL.ink; C.beginPath(); C.ellipse(ex, eY, 4.4, 3.6, 0, 0, 6.3); C.fill(); }
      else if (blink) Ln(ex - 3, eY, ex + 3, eY, 1.8);
      else { C.fillStyle = P; C.beginPath(); C.ellipse(ex, eY, 3.6, 4.4, 0, 0, 6.3); C.fill(); C.lineWidth = 1.3; C.strokeStyle = COL.ink; C.stroke(); C.fillStyle = COL.ink; C.beginPath(); C.arc(ex + dx * .7, eY + dy * .8, 1.8, 0, 6.3); C.fill(); }
    });
    if (f.shades) Ln(e1 + 4, eY - 1, e2 - 4, eY - 1, 1.6);
    var brow = f.surprise ? -4 : 0;
    Ln(e1 - 3, eY - 7 + brow, e1 + 3, eY - 8 + brow, 1.5); Ln(e2 - 3, eY - 8 + brow, e2 + 3, eY - 7 + brow, 1.5);
    var mx = hcx + fc * 2 + 1, my = hcy + 10;
    if (m === 'shiver'){ S([[mx - 5, my], [mx - 2.5, my - 1.5], [mx, my], [mx + 2.5, my - 1.5], [mx + 5, my]], 1.4); }
    else if (f.smile || m === 'wave'){ S([[mx - 4, my - 1], [mx, my + 2.5], [mx + 4, my - 1]], 1.6); }
    else if (f.surprise){ O(mx, my + 1, 2.4, 1.4); }
    else Ln(mx - 3, my + 1, mx + 3, my + 1, 1.5);
    if (f.breath && !still){ var b = (T * .9) % 1; O(hcx + fc * (24 + b * 14), hcy + 8 - b * 9, 2.5 + b * 5, 1.2, null, 1 - b); }
    if (f.hot){ var dd = still ? .4 : (T * .6) % 1; S([[hcx - fc * 18, hcy - 6 + dd * 14], [hcx - fc * 20, hcy - 1 + dd * 14], [hcx - fc * 18, hcy + 2 + dd * 14]], 1.4, 1 - dd); }
    if (m === 'scratch') TX('?', hcx + fc * 28, hcy - 24 + (still ? 0 : Math.sin(T * 3) * 2), 28);
    C.restore();
  }

  /* ---------- pointer, for eyes that follow you ---------- */
  var mouse = { x: -9999, y: -9999, t: -1e9 };
  addEventListener('pointermove', function(e){ mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); }, { passive: true });
  function lookIn(cv, vw, vh, ox, oy, sc){ // cursor in a canvas's world units, if it moved in the last 2.5 s
    if (performance.now() - mouse.t > 2500) return null;
    var r = cv.getBoundingClientRect();
    if (sc) return { x: (mouse.x - r.left - ox) / sc, y: (mouse.y - r.top - oy) / sc };
    return { x: (mouse.x - r.left) / r.width * vw, y: (mouse.y - r.top) / r.height * vh };
  }

  /* ---------- Portland weather, cached for 15 minutes ---------- */
  var WX_URL = 'https://api.open-meteo.com/v1/forecast?latitude=45.52&longitude=-122.68&current=temperature_2m,weather_code,is_day,wind_speed_10m,cloud_cover&timezone=America%2FLos_Angeles&temperature_unit=fahrenheit&wind_speed_unit=mph';
  var wxPromise = null;
  function classify(code){
    if (code === 0) return 'clear';
    if (code === 1 || code === 2) return 'partly';
    if (code === 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'cloudy';
  }
  var WORDS = { clear: 'clear skies', partly: 'partly cloudy', cloudy: 'overcast', fog: 'fog', drizzle: 'drizzle', rain: 'rain', snow: 'snow', storm: 'thunderstorms' };
  function weather(){
    if (wxPromise) return wxPromise;
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('pdx-wx') || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.at < 15 * 60 * 1000) return (wxPromise = Promise.resolve(cached));
    wxPromise = fetch(WX_URL).then(function(r){ if (!r.ok) throw new Error('weather ' + r.status); return r.json(); }).then(function(j){
      var c = j.current || {};
      var w = { at: Date.now(), kind: classify(c.weather_code), code: c.weather_code, tempF: Math.round(c.temperature_2m), day: c.is_day === 1, wind: c.wind_speed_10m || 0, cloud: c.cloud_cover || 0 };
      try { localStorage.setItem('pdx-wx', JSON.stringify(w)); } catch (e) {}
      return w;
    }).catch(function(){ return cached || null; });
    return wxPromise;
  }
  function pdxHour(){ // Portland's local hour, as a decimal
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var h = 0, mi = 0; parts.forEach(function(p){ if (p.type === 'hour') h = +p.value % 24; if (p.type === 'minute') mi = +p.value; });
      return h + mi / 60;
    } catch (e) { return new Date().getHours(); }
  }
  function pdxTime(){ try { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' }).format(new Date()).toLowerCase(); } catch (e) { return ''; } }

  /* ---------- the sun over Portland (NOAA approximation), and the page tone it sets ---------- */
  var LAT = 45.5152, LON = -122.6784, RAD = Math.PI / 180;
  function sunAlt(d){ // solar altitude in degrees at time d
    var jd = d.getTime() / 864e5 + 2440587.5, n = jd - 2451545, L = (280.46 + .9856474 * n) % 360, g = (357.528 + .9856003 * n) % 360;
    var lam = L + 1.915 * Math.sin(g * RAD) + .02 * Math.sin(2 * g * RAD), eps = 23.439 - 4e-7 * n;
    var dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lam * RAD));
    var ra = Math.atan2(Math.cos(eps * RAD) * Math.sin(lam * RAD), Math.cos(lam * RAD)) / RAD;
    var gmst = (18.697374558 + 24.06570982441908 * n) % 24, lst = (gmst * 15 + LON) % 360, ha = (lst - ra) * RAD;
    return Math.asin(Math.sin(LAT * RAD) * Math.sin(dec) + Math.cos(LAT * RAD) * Math.cos(dec) * Math.cos(ha)) / RAD;
  }
  function crossing(rising){ // today's sunrise or sunset in Portland, found by bisection on a 10-minute scan
    var now = new Date(), day = new Date(now.getTime()); day.setUTCHours(12 + 8, 0, 0, 0); // about local noon
    var t0 = day.getTime() + (rising ? -12 : 0) * 3600e3, prev = sunAlt(new Date(t0));
    for (var k = 1; k <= 72; k++){ var t = t0 + k * 600e3, a = sunAlt(new Date(t)); if ((rising && prev < -.83 && a >= -.83) || (!rising && prev >= -.83 && a < -.83)){ var lo = t - 600e3, hi = t; for (var j = 0; j < 12; j++){ var mid = (lo + hi) / 2, am = sunAlt(new Date(mid)); if ((am >= -.83) === rising) hi = mid; else lo = mid; } return new Date((lo + hi) / 2); } prev = a; }
    return null;
  }
  function phase(){ var a = sunAlt(new Date()), up = sunAlt(new Date(Date.now() + 1800e3)) > a;
    if (a < -6) return 'night'; if (a < 1) return up ? 'dawn' : 'dusk'; if (a < 9) return up ? 'morning' : 'golden'; return 'day'; }
  function fmt(d){ try { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' }).format(d).toLowerCase(); } catch (e) { return ''; } }
  function sunLine(){ var p = phase(), r = crossing(true), st = crossing(false);
    if (p === 'night' || p === 'dawn') return r ? 'sunrise ' + fmt(r) : ''; return st ? 'sunset ' + fmt(st) : ''; }
  function setTone(){ root.setAttribute('data-sky', phase()); readColors(); }
  setTone(); setInterval(setTone, 5 * 60 * 1000);

  /* ---------- frame clock ---------- */
  function tick(now){ T = reduce.matches ? 2 : now / 1000; boil = reduce.matches ? 0 : Math.floor(now / 125); }
  function use(ctx){ C = ctx; seedN = 0; C.lineCap = 'round'; C.lineJoin = 'round'; }
  function plain(){ return root.classList.contains('plain'); }
  /* size a canvas to its box and set a world transform that fits vw x vh */
  function fit(cv, ctx, vw, vh){
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return false;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr * w / vw, 0, 0, dpr * h / vh, 0, 0); ctx.clearRect(0, 0, vw, vh);
    return true;
  }

  window.Ink = {
    S: S, Ln: Ln, O: O, R: R, H: H, TX: TX, WASH: WASH, FIG: FIG,
    ease: ease, cl: cl, lerp: lerp, back: back,
    COL: COL, reduce: reduce, mouse: mouse, lookIn: lookIn,
    weather: weather, WORDS: WORDS, pdxHour: pdxHour, pdxTime: pdxTime, sunAlt: sunAlt, phase: phase, sunLine: sunLine,
    tick: tick, use: use, plain: plain, fit: fit,
    get T(){ return T; }, get ctx(){ return C; }
  };
})();
