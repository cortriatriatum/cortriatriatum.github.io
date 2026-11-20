/* Home page scene: a full-screen live drawing of a Portland street, from the current weather and time of day.
   Every object in it is a way in, with a tag you can click (and the same choices as buttons beside it):
     the subway stairs -> /ride/, the lit window -> /room/, each line of the directory board -> that section,
     the coffee cart -> the contact form.
   The figure reacts to the weather, looks at your cursor, and turns to whatever you point at. Choosing plays a
   short beat (a walk, or a zoom into the board) unless the visitor asks for reduced motion.
   Nothing is drawn in Plain mode. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, COL = I.COL;
  var MONO = '"JetBrains Mono",monospace';
  var stage = document.getElementById('stage'), live = document.getElementById('live'), cap = document.getElementById('liveNow'), hot = document.getElementById('hot');
  if (!live) return;
  var lctx = live.getContext('2d');
  var G = 468, WX = null, target = null, act = null, dpr = 1, cw = 0, ch = 0, s = 1, Z = 1, FSX = 0, FSY = 0, restX = 0, restY = 0, onScreen = true;
  var FX = 520, FY = 346;
  var DIR = ['Notes', 'Research', 'Route', 'Education', 'Work & Service', 'Awards', 'Dev', 'Contact'];
  var DIR_IDS = ['notes', 'research', 'route', 'training', 'work', 'awards', 'dev', 'contact'];
  var OBJ = { room: { x: 318, y: 332, tag: [318, 222] }, read: { x: 520, y: 346, tag: [520, 284] }, ride: { x: 676, y: 410, tag: [676, 342] }, coffee: { x: 819, y: 430, tag: [819, 360] } };

  function isNight(){ if (WX && typeof WX.day === 'boolean' && Date.now() - WX.at < 3 * 3600e3) return !WX.day; var h = I.pdxHour(); return h < 6.5 || h >= 19.5; }
  function caption(){ if (!cap) return; var p = ['Portland, Oregon', I.pdxTime()]; if (WX){ p.push(WX.tempF + '°F'); p.push(I.WORDS[WX.kind]); } cap.textContent = p.join(' · '); }
  function load(){ I.weather().then(function(w){ WX = w; caption(); }); }
  load(); caption(); setInterval(function(){ load(); caption(); }, 60000);

  /* ---------- the ways in: tags over the scene, and the same choices as buttons ---------- */
  var tags = [];
  function tag(k, label, href, cls){
    var a = document.createElement(href ? 'a' : 'button'); a.className = 'tag-in ' + (cls || ''); a.textContent = label; a.dataset.go = k;
    if (href) a.href = href; else a.type = 'button';
    hot.appendChild(a); tags.push({ el: a, k: k }); return a;
  }
  if (hot){
    tag('room', 'Walk into the room', hot.dataset.room);
    tag('read', 'Directory', null, 'dir-head');
    tag('ride', 'Take the stairs down', hot.dataset.ride);
    tag('coffee', 'Grab a coffee', null);
    DIR.forEach(function(n, j){ var b = document.createElement('a'); b.className = 'dir-line'; b.href = '#' + DIR_IDS[j]; b.dataset.go = 'read'; b.dataset.sec = DIR_IDS[j]; b.setAttribute('aria-label', 'Directory: ' + n); hot.appendChild(b); tags.push({ el: b, k: 'line', j: j }); });
  }
  function choose(k, el, e){
    if (k === 'plain') return;
    var quick = I.plain() || I.reduce.matches;
    if (k === 'coffee'){ if (e) e.preventDefault(); act = quick ? null : { k: k, t: performance.now(), dur: 420 }; if (window.InkSite) window.InkSite.openContact(); setTimeout(function(){ if (act && act.k === 'coffee') act = null; }, 4000); return; }
    if (k === 'read'){
      var sec = (el && el.dataset.sec) || 'main', go = function(){ var t = document.getElementById(sec); if (t) t.scrollIntoView({ behavior: quick ? 'auto' : 'smooth' }); history.replaceState(null, '', '#' + sec); };
      if (e) e.preventDefault();
      if (quick) return go();
      act = { k: k, t: performance.now(), dur: 520 }; setTimeout(go, 470); setTimeout(function(){ act = null; }, 1600);
      return;
    }
    if ((k === 'ride' || k === 'room') && el && el.href){
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button)) return;
      if (quick) return;
      if (e) e.preventDefault(); act = { k: k, t: performance.now(), dur: 380 }; setTimeout(function(){ location.href = el.href; }, 380);
    }
  }
  document.querySelectorAll('[data-go]').forEach(function(el){
    var k = el.dataset.go;
    el.addEventListener('pointerenter', function(){ target = el.classList.contains('dir-line') ? 'line' : k; }); el.addEventListener('pointerleave', function(){ target = null; });
    el.addEventListener('focus', function(){ target = el.classList.contains('dir-line') ? 'line' : k; }); el.addEventListener('blur', function(){ target = null; });
    el.addEventListener('click', function(e){ choose(k, el, e); });
  });

  /* ---------- camera ---------- */
  function size(){
    dpr = Math.min(2, devicePixelRatio || 1); cw = live.clientWidth; ch = live.clientHeight;
    if (live.width !== Math.round(cw * dpr) || live.height !== Math.round(ch * dpr)){ live.width = Math.round(cw * dpr); live.height = Math.round(ch * dpr); }
    var portrait = ch > cw * 1.05;
    s = portrait ? Math.max(cw / 1000, Math.min(cw / 640, ch * .46 / 560)) : Math.min(cw / 1080, ch / 600);
    var cx = portrait ? 545 : 520, rx = portrait ? cw / 2 : cw / 2 + Math.min(cw * .13, 190), gy = ch * (portrait ? .9 : .86);
    restX = rx + (FX - cx) * s; restY = gy + (FY - G) * s;
    var e = 0;
    if (act && act.k === 'read') e = ease(cl((performance.now() - act.t) / act.dur, 0, 1));
    var zMax = cl(.85 * Math.min(cw, ch * 1.15) / (108 * s), 3, 16);
    Z = Math.pow(zMax, e); FSX = lerp(restX, cw / 2, e); FSY = lerp(restY, ch / 2, e);
    return cw > 0;
  }
  function toScreen(wx, wy){ var sx = s * Z; return [FSX + (wx - FX) * sx, FSY + (wy - FY) * sx]; }
  function placeTags(){
    var hide = Z > 1.05;
    tags.forEach(function(t){
      var el = t.el;
      if (t.k === 'line'){ var a = toScreen(468, 319 + t.j * 8.2), b = toScreen(572, 327.2 + t.j * 8.2); el.style.left = a[0] + 'px'; el.style.top = a[1] + 'px'; el.style.width = (b[0] - a[0]) + 'px'; el.style.height = Math.max(8, b[1] - a[1]) + 'px'; el.style.visibility = hide ? 'hidden' : 'visible'; return; }
      var o = OBJ[t.k], p = toScreen(o.tag[0], o.tag[1]);
      var half = (el.offsetWidth || 120) / 2, x = Math.max(half + 6, Math.min(cw - half - 6, p[0]));
      el.style.left = x + 'px'; el.style.top = p[1] + 'px';
      el.style.visibility = (hide || p[0] < -20 || p[0] > cw + 20) ? 'hidden' : 'visible';
    });
  }
  function layer(depth){ var sx = s * (1 + (Z - 1) * depth); lctx.setTransform(dpr * sx, 0, 0, dpr * sx, dpr * (FSX - FX * sx), dpr * (FSY - FY * sx)); }
  function screen(){ lctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function glow(k){ var on = target === k || (act && act.k === k) || (k === 'read' && target === 'line'); if (on){ var o = OBJ[k]; WASH(o.x, o.y, k === 'ride' ? 90 : 70, k === 'ride' ? 80 : 70, COL.pop, .2, 40); } }

  function draw(look){
    var kind = WX ? WX.kind : 'cloudy', night = isNight(), h = I.pdxHour(), T = I.T, still = I.reduce.matches;
    var wet = kind === 'drizzle' || kind === 'rain' || kind === 'storm', cold = WX ? WX.tempF <= 40 : false, warm = WX ? WX.tempF >= 80 : false;
    var windy = WX ? Math.min(1, WX.wind / 25) : .2, dusk = !night && ((h >= 6.5 && h < 8) || (h >= 17 && h < 19.5)), i, k;
    layer(.04);
    if (night) WASH(500, 150, 1500, 520, COL.night, .3, 1);
    else if (kind === 'storm') WASH(500, 150, 1500, 480, COL.night, .26, 2);
    else WASH(500, 150, 1500, 480, COL.sky, (wet || kind === 'cloudy' || kind === 'fog') ? .13 : .22, 3);
    if (dusk) WASH(500, 330, 1200, 110, COL.rose, .2, 5);
    if (night){
      for (i = 0; i < 40; i++){ var sx = (i * 137) % 1600 - 300, sy = (i * 71) % 330 - 60, tw = still ? 1 : .5 + .5 * Math.sin(T * 2 + i);
        if (kind === 'clear' || kind === 'partly' || i % 3 === 0){ Ln(sx - 3, sy, sx + 3, sy, 1.2, tw); Ln(sx, sy - 3, sx, sy + 3, 1.2, tw); } }
      WASH(820, 96, 46, 46, COL.sun, .28, 6); O(820, 96, 30, 2.2, COL.paper); O(810, 88, 4, 1.2); O(828, 104, 3, 1.2);
    } else if (kind === 'clear' || kind === 'partly'){
      var sunY = dusk ? 290 : 96; WASH(820, sunY, 70, 70, COL.sun, .42, 7); O(820, sunY, 32, 2.4, COL.paper);
      for (var r = 0; r < 12; r++){ var a = r / 12 * 6.283 + (still ? 0 : T * .15); Ln(820 + Math.cos(a) * 44, sunY + Math.sin(a) * 44, 820 + Math.cos(a) * 60, sunY + Math.sin(a) * 60, 2); }
    }
    layer(.12);
    var nc = { clear: 0, partly: 2, cloudy: 6, fog: 3, drizzle: 5, rain: 6, snow: 5, storm: 6 }[kind] || 2;
    for (k = 0; k < nc; k++){
      var cx = ((k * 283 + (still ? 0 : T * (6 + windy * 14))) % 1700) - 450, cy = 60 + (k % 3) * 46, cs = 1 + (k % 2) * .5;
      lctx.fillStyle = COL.paper; lctx.beginPath(); lctx.ellipse(cx + 62 * cs, cy - 10 * cs, 64 * cs, 18 * cs, 0, 0, 6.3); lctx.fill();
      S([[cx, cy], [cx + 18 * cs, cy - 16 * cs], [cx + 48 * cs, cy - 22 * cs], [cx + 74 * cs, cy - 10 * cs], [cx + 98 * cs, cy - 16 * cs], [cx + 124 * cs, cy], [cx, cy]], 1.8);
      if (kind === 'storm' || kind === 'rain') H(cx + 10 * cs, cy - 14 * cs, 100 * cs, 12 * cs, 7, .35);
    }
    layer(.22);
    if ((kind === 'clear' || kind === 'partly') && !night){ S([[640, 300], [770, 140], [900, 300]], 2.4, .8); S([[722, 196], [740, 210], [756, 196], [772, 210], [788, 194], [806, 206]], 1.6, .75); }
    layer(.36);
    S([[-600, 330], [-300, 306], [-20, 326], [80, 300], [180, 316], [280, 290], [380, 312], [470, 302]], 1.8, .7);
    for (var t = -10; t < 9; t++){ var tx = 20 + t * 50, ty = 318 - ((t + 30) % 3) * 8; S([[tx, ty], [tx - 8, ty + 18], [tx + 8, ty + 18], [tx, ty]], 1.4, .7); }
    layer(.5);
    [[700, 230], [740, 190], [780, 250], [816, 168], [856, 220], [896, 200], [936, 245], [976, 215], [1016, 262], [1056, 236], [1096, 270]].forEach(function(b, n){
      R(b[0], b[1], 36, 390 - b[1], 1.6, COL.paper);
      for (var wy = b[1] + 14; wy < 370; wy += 22){ if (night && ((n * 7 + wy) % 3 === 0)){ lctx.fillStyle = COL.sun; lctx.globalAlpha = .7; lctx.fillRect(b[0] + 8, wy, 8, 9); lctx.fillRect(b[0] + 20, wy, 8, 9); lctx.globalAlpha = 1; } else Ln(b[0] + 8, wy + 4, b[0] + 28, wy + 4, 1, .4); }
    });
    S([[816, 168], [834, 138], [852, 168]], 1.8);
    layer(.7);
    WASH(500, 404, 1400, 26, COL.sky, .3, 8);
    for (var w = 0; w < 22; w++){ var wx = ((w * 97 + (still ? 0 : T * 10)) % 1800) - 400; S([[wx, 406 + (w % 3) * 6], [wx + 10, 403 + (w % 3) * 6], [wx + 20, 406 + (w % 3) * 6]], 1.2, .6); }
    S([[-400, 388], [1400, 388]], 2); S([[900, 388], [1020, 318], [1140, 388]], 2.2);
    for (var hb = 916; hb < 1140; hb += 20){ var yy = 388 - Math.max(0, 70 - Math.abs(hb - 1020) * .62); Ln(hb, yy, hb, 388, 1, .6); }
    if (kind === 'fog'){ for (var f = 0; f < 6; f++){ var fx = ((f * 300 + (still ? 0 : T * 8)) % 1800) - 400; WASH(fx, 250 + f * 30, 300, 26, COL.paper, .8, 10 + f); } }
    layer(1);
    glow('room'); glow('ride'); glow('read'); glow('coffee');
    S([[-1600, G], [2600, G]], 2.6); H(-1600, G + 4, 4200, 900, 12, .16);
    if (night) WASH(176, 300, 70, 120, COL.sun, .3, 11);
    S([[150, G], [150, 250], [166, 236], [186, 238]], 2.4); O(188, 248, 9, 1.8, night ? COL.sun : COL.paper);
    R(240, 236, 160, G - 236, 2.4, COL.paper); S([[232, 236], [408, 236]], 2.6);
    for (i = 0; i < 2; i++) for (k = 0; k < 2; k++){ if (i === 1 && k === 0) continue; R(256 + k * 80, 252 + i * 76, 48, 40, 1.6, COL.paper); Ln(280 + k * 80, 252 + i * 76, 280 + k * 80, 292 + i * 76, 1.2, .6); }
    WASH(318, 334, 54, 42, COL.sun, night ? .5 : .32, 12);
    R(284, 304, 68, 56, 2.2, null); Ln(318, 304, 318, 360, 1.4, .7);
    S([[296, 352], [298, 330], [312, 330]], 1.6); O(330, 334, 5, 1.4); Ln(326, 342, 344, 352, 1.4);
    var dOpen = (act && act.k === 'room') ? 10 : 0;
    R(298, G - 72, 40, 72, 2, COL.paper); if (dOpen){ lctx.fillStyle = COL.ink; lctx.globalAlpha = .25; lctx.fillRect(298, G - 72, dOpen, 72); lctx.globalAlpha = 1; } O(332, G - 36, 2.5, 1.2);
    R(286, G - 92, 64, 16, 1.8, COL.paper); TX('ROOM', 318, G - 79, 12, 'center', MONO);
    R(160, 432, 70, 9, 2, COL.paper); Ln(166, 441, 166, G, 2); Ln(224, 441, 224, G, 2); S([[160, 412], [230, 412]], 2); Ln(163, 412, 163, 432, 1.6); Ln(227, 412, 227, 432, 1.6);
    Ln(478, G, 478, 392, 2.2); Ln(562, G, 562, 392, 2.2);
    R(466, 300, 108, 92, 2.4, COL.paper); R(466, 300, 108, 16, 2, COL.ink);
    lctx.fillStyle = COL.paper; lctx.font = '700 9px ' + MONO; lctx.textAlign = 'center'; lctx.fillText('DIRECTORY', 520, 311.5);
    DIR.forEach(function(n, j){
      var hl = tags.some(function(tg){ return tg.k === 'line' && tg.j === j && (tg.el === document.activeElement || tg.el.matches(':hover')); });
      if (hl){ lctx.fillStyle = COL.sun; lctx.globalAlpha = .6; lctx.fillRect(469, 319.5 + j * 8.2, 102, 8); lctx.globalAlpha = 1; }
      lctx.fillStyle = COL.ink; lctx.font = '6.4px ' + MONO; lctx.textAlign = 'left'; lctx.fillText((j + 1) + '  ' + n, 474, 326 + j * 8.2);
    });
    S([[604, G], [604, 380], [748, 380], [748, G]], 2.4); S([[596, 380], [756, 380]], 3);
    R(624, 388, 104, 24, 2, COL.paper); TX('SUBWAY', 676, 406, 18);
    O(612, 362, 9, 2, COL.leaf); O(740, 362, 9, 2, COL.leaf); Ln(612, 371, 612, 380, 2); Ln(740, 371, 740, 380, 2);
    lctx.fillStyle = COL.ink; lctx.globalAlpha = .08; lctx.fillRect(620, 420, 112, G - 420); lctx.globalAlpha = 1;
    for (i = 0; i < 4; i++){ var sy2 = 426 + i * 11; Ln(626 + i * 3, sy2, 726 - i * 3, sy2, 1.6, .9 - i * .15); }
    R(764, 404, 110, 58, 2.2, COL.paper); S([[756, 404], [819, 376], [882, 404]], 2); TX('COFFEE', 819, 438, 17); O(782, 468, 9, 2, COL.paper); O(858, 468, 9, 2, COL.paper);
    if (!still){ var st = (T * .5) % 1; S([[834, 372 - st * 20], [840, 362 - st * 20], [834, 352 - st * 20]], 1.2, 1 - st); }
    if (kind === 'snow'){ WASH(500, G + 4, 1400, 10, COL.paper, .9, 13); O(420, G - 18, 18, 2, COL.paper); O(420, G - 46, 13, 2, COL.paper); O(420, G - 66, 9, 1.8, COL.paper); Ln(422, G - 66, 432, G - 64, 2); }
    if (wet){ for (var pd = 0; pd < 3; pd++){ var px = 420 + pd * 150, rp = still ? .5 : (T * .8 + pd * .3) % 1; lctx.strokeStyle = COL.ink; lctx.globalAlpha = (1 - rp) * .6; lctx.lineWidth = 1.2; lctx.beginPath(); lctx.ellipse(px, G + 8, 8 + rp * 26, 2 + rp * 4, 0, 0, 6.3); lctx.stroke(); lctx.globalAlpha = 1; } }
    if (kind === 'storm' && !still && (T % 7) < .22) S([[1000, -40], [980, 40], [1006, 38], [970, 130]], 3);
    var fig = { x: 446, y: G, face: 1, look: look, wind: windy, breath: cold };
    if (wet){ var u = still ? .3 : (T / 9) % 2, e = u < 1 ? ease(u) : ease(2 - u); fig.x = lerp(430, 590, e); fig.face = u < 1 ? 1 : -1; fig.mode = (e > .98 || e < .02) ? 'stand' : 'walk'; fig.ph = T * 6; fig.umbrella = true; }
    else if (kind === 'snow'){ fig.x = 452; fig.mode = 'shiver'; }
    else if (night){ fig.x = 196; fig.y = 432; fig.mode = 'sit'; fig.seat = 0; fig.mug = true; fig.look = look || { x: 820, y: 96 }; fig.smile = true; }
    else if (kind === 'clear' || kind === 'partly'){ fig.x = 190; fig.y = 432; fig.mode = 'read'; fig.seat = 0; fig.shades = true; fig.hot = warm; if (look) fig.mode = 'sit'; }
    else if (kind === 'fog'){ fig.mode = 'scratch'; fig.face = -1; }
    else { fig.mode = 'stand'; fig.mug = true; fig.look = look || { x: 600, y: 80 }; }
    var want = (act && act.k) || (target === 'line' ? 'read' : target);
    if (want && OBJ[want]){
      var o = OBJ[want]; fig.look = { x: o.x, y: o.y }; fig.surprise = !act; fig.smile = !!act;
      if (fig.mode !== 'walk'){ fig.y = G; fig.x = Math.max(fig.x, 400); fig.mode = 'point'; fig.face = o.x < fig.x ? -1 : 1; fig.mug = false; fig.shades = false; }
      if (act && act.k !== 'read'){ var lt = Math.min(1, (performance.now() - act.t) / act.dur); fig.mode = 'walk'; fig.ph = lt * 10; fig.x = lerp(fig.x, o.x, ease(lt) * .7); fig.face = o.x < fig.x ? -1 : 1; fig.sq = lt < .25 ? .06 : 0; fig.umbrella = false;
        if (act.k === 'coffee' && lt >= 1){ fig.mode = 'stand'; fig.mug = true; fig.smile = true; } }
    } else if (look && fig.mode !== 'walk') fig.smile = true;
    FIG(fig);
    screen();
    var rainN = { drizzle: 90, rain: 190, storm: 240 }[kind] || 0, slant = 4 + windy * 10;
    for (var d = 0; d < rainN; d++){ var qx = Math.abs((Math.sin(d * 12.9) * 43758.5) % 1), qy = Math.abs((Math.sin(d * 78.2) * 24634.6) % 1);
      var rx = qx * (cw + 60) - 30, ry = ((qy * (ch + 40) + (still ? 0 : T * (kind === 'drizzle' ? 300 : 560) * (.85 + qx * .3))) % (ch + 40)) - 30;
      Ln(rx, ry, rx - slant, ry + (kind === 'drizzle' ? 10 : 18), 1.1, .5); }
    if (kind === 'snow'){ for (var n = 0; n < 130; n++){ var hx = Math.abs((Math.sin(n * 91.7) * 43758.5) % 1), hy = Math.abs((Math.sin(n * 37.3) * 24634.6) % 1), sp = 26 + hx * 34;
      var fx2 = ((hx * cw + (still ? 0 : Math.sin(T * .8 + n) * 14 + T * windy * 20)) % cw + cw) % cw, fy = ((hy * (ch + 20) + (still ? 0 : T * sp)) % (ch + 20)) - 20; O(fx2, fy, 1.8 + hy * 1.6, 1, COL.paper); } }
    if (act && act.k === 'read'){ var pe = cl((performance.now() - act.t - act.dur * .6) / (act.dur * .5), 0, 1); if (pe > 0){ lctx.fillStyle = COL.paper; lctx.globalAlpha = pe; lctx.fillRect(0, 0, cw, ch); lctx.globalAlpha = 1; } }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ onScreen = es[0].isIntersecting; }).observe(stage);
  var running = false;
  function frame(now){
    if (I.plain()){ running = false; return; }
    I.tick(now);
    if (onScreen && size()){
      placeTags();
      I.use(lctx); screen(); lctx.fillStyle = COL.paper; lctx.fillRect(0, 0, cw, ch);
      var m = I.lookIn(live, 0, 0, 0, 0, 1), look = null;
      if (m){ var sx = s * Z; look = { x: FX + (m.x - FSX) / sx, y: FY + (m.y - FSY) / sx }; }
      draw(look);
    }
    requestAnimationFrame(frame);
  }
  function start(){ if (!running && !I.plain()){ running = true; requestAnimationFrame(frame); } }
  document.addEventListener('plainchange', start);
  start();
})();
