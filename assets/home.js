/* Home page drawings.
   The stage: a full-screen live drawing of a Portland street, from the current weather and time of day.
   Three objects in it are the ways in: the subway stairs (/ride/), the lit window of the room (/room/), and the
   station directory board (read here). Scrolling moves the camera into the scene, nearer layers faster than far
   ones, until the directory board fills the screen and becomes the page.
   Below it, one small looping drawing per section. Only drawings on screen are drawn; none in Plain mode;
   reduced motion gets still frames and no camera move. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, back = I.back, COL = I.COL;
  var MONO = '"JetBrains Mono",monospace';

  /* ================= the stage ================= */
  var stage = document.getElementById('stage'), live = document.getElementById('live'), cap = document.getElementById('liveNow');
  var lctx = live ? live.getContext('2d') : null;
  var G = 468, WX = null, target = null, leaving = null, dpr = 1, cw = 0, ch = 0, s = 1, Z = 1, P = 0, FSX = 0, FSY = 0;
  var FX = 520, FY = 346;                       // the directory board: where the camera goes
  var OBJ = { room: { x: 318, y: 330 }, read: { x: 520, y: 346 }, ride: { x: 676, y: 400 }, plain: { x: 520, y: 346 } };
  function isNight(){ if (WX && typeof WX.day === 'boolean' && Date.now() - WX.at < 3 * 3600e3) return !WX.day; var h = I.pdxHour(); return h < 6.5 || h >= 19.5; }
  function caption(){
    if (!cap) return;
    var parts = ['Portland, Oregon', I.pdxTime()];
    if (WX){ parts.push(WX.tempF + '°F'); parts.push(I.WORDS[WX.kind]); }
    cap.textContent = parts.join(' · ');
  }
  function load(){ I.weather().then(function(w){ WX = w; caption(); }); }
  load(); caption(); setInterval(function(){ load(); caption(); }, 60000);

  /* choices: hovering one points the figure at its object; choosing Ride or Room plays a short beat first */
  document.querySelectorAll('[data-go]').forEach(function(el){
    var k = el.getAttribute('data-go');
    el.addEventListener('pointerenter', function(){ target = k; }); el.addEventListener('pointerleave', function(){ if (target === k) target = null; });
    el.addEventListener('focus', function(){ target = k; }); el.addEventListener('blur', function(){ if (target === k) target = null; });
    if (k === 'ride' || k === 'room') el.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button || I.plain() || I.reduce.matches) return;
      e.preventDefault(); leaving = { k: k, t: performance.now(), href: el.href }; target = k;
      setTimeout(function(){ location.href = el.href; }, 380);
    });
  });

  function layer(depth){ var sx = s * (1 + (Z - 1) * depth); lctx.setTransform(dpr * sx, 0, 0, dpr * sx, dpr * (FSX - FX * sx), dpr * (FSY - FY * sx)); }
  function screen(){ lctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function glow(k){ if (target === k || (leaving && leaving.k === k)){ var o = OBJ[k]; WASH(o.x, o.y, k === 'ride' ? 90 : 70, k === 'ride' ? 80 : 70, COL.pop, .2, 40); } }

  function drawStage(look){
    var kind = WX ? WX.kind : 'cloudy', night = isNight(), h = I.pdxHour(), T = I.T, still = I.reduce.matches;
    var wet = kind === 'drizzle' || kind === 'rain' || kind === 'storm', cold = WX ? WX.tempF <= 40 : false, hot = WX ? WX.tempF >= 80 : false;
    var windy = WX ? Math.min(1, WX.wind / 25) : .2, dusk = !night && ((h >= 6.5 && h < 8) || (h >= 17 && h < 19.5)), i, k;
    /* sky, sun or moon, stars: farthest */
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
    /* clouds */
    layer(.12);
    var nc = { clear: 0, partly: 2, cloudy: 6, fog: 3, drizzle: 5, rain: 6, snow: 5, storm: 6 }[kind] || 2;
    for (k = 0; k < nc; k++){
      var cx = ((k * 283 + (still ? 0 : T * (6 + windy * 14))) % 1700) - 450, cy = 60 + (k % 3) * 46, cs = 1 + (k % 2) * .5;
      lctx.fillStyle = COL.paper; lctx.beginPath(); lctx.ellipse(cx + 62 * cs, cy - 10 * cs, 64 * cs, 18 * cs, 0, 0, 6.3); lctx.fill();
      S([[cx, cy], [cx + 18 * cs, cy - 16 * cs], [cx + 48 * cs, cy - 22 * cs], [cx + 74 * cs, cy - 10 * cs], [cx + 98 * cs, cy - 16 * cs], [cx + 124 * cs, cy], [cx, cy]], 1.8);
      if (kind === 'storm' || kind === 'rain') H(cx + 10 * cs, cy - 14 * cs, 100 * cs, 12 * cs, 7, .35);
    }
    /* Mt. Hood, only when it is actually visible */
    layer(.22);
    if ((kind === 'clear' || kind === 'partly') && !night){ S([[640, 300], [770, 140], [900, 300]], 2.4, .8); S([[722, 196], [740, 210], [756, 196], [772, 210], [788, 194], [806, 206]], 1.6, .75); }
    /* West Hills and firs */
    layer(.36);
    S([[-600, 330], [-300, 306], [-20, 326], [80, 300], [180, 316], [280, 290], [380, 312], [470, 302]], 1.8, .7);
    for (var t = -10; t < 9; t++){ var tx = 20 + t * 50, ty = 318 - ((t + 30) % 3) * 8; S([[tx, ty], [tx - 8, ty + 18], [tx + 8, ty + 18], [tx, ty]], 1.4, .7); }
    /* skyline */
    layer(.5);
    [[700, 230], [740, 190], [780, 250], [816, 168], [856, 220], [896, 200], [936, 245], [976, 215], [1016, 262], [1056, 236], [1096, 270]].forEach(function(b, n){
      R(b[0], b[1], 36, 390 - b[1], 1.6, COL.paper);
      for (var wy = b[1] + 14; wy < 370; wy += 22){ if (night && ((n * 7 + wy) % 3 === 0)){ lctx.fillStyle = COL.sun; lctx.globalAlpha = .7; lctx.fillRect(b[0] + 8, wy, 8, 9); lctx.fillRect(b[0] + 20, wy, 8, 9); lctx.globalAlpha = 1; } else Ln(b[0] + 8, wy + 4, b[0] + 28, wy + 4, 1, .4); }
    });
    S([[816, 168], [834, 138], [852, 168]], 1.8);
    /* the river and a bridge */
    layer(.7);
    WASH(500, 404, 1400, 26, COL.sky, .3, 8);
    for (var w = 0; w < 22; w++){ var wx = ((w * 97 + (still ? 0 : T * 10)) % 1800) - 400; S([[wx, 406 + (w % 3) * 6], [wx + 10, 403 + (w % 3) * 6], [wx + 20, 406 + (w % 3) * 6]], 1.2, .6); }
    S([[-400, 388], [1400, 388]], 2); S([[760, 388], [900, 310], [1040, 388]], 2.2);
    for (var hb = 776; hb < 1040; hb += 20){ var yy = 388 - Math.max(0, 78 - Math.abs(hb - 900) * .6); Ln(hb, yy, hb, 388, 1, .6); }
    if (kind === 'fog'){ for (var f = 0; f < 6; f++){ var fx = ((f * 300 + (still ? 0 : T * 8)) % 1800) - 400; WASH(fx, 250 + f * 30, 300, 26, COL.paper, .8, 10 + f); } }
    /* the street: nearest */
    layer(1);
    glow('room'); glow('ride'); glow('read');
    S([[-1600, G], [2600, G]], 2.6); H(-1600, G + 4, 4200, 900, 12, .16);
    /* lamp */
    if (night) WASH(176, 300, 70, 120, COL.sun, .3, 11);
    S([[150, G], [150, 250], [166, 236], [186, 238]], 2.4); O(188, 248, 9, 1.8, night ? COL.sun : COL.paper);
    /* the building with the room: the lit window is the way in */
    R(240, 236, 160, G - 236, 2.4, COL.paper); S([[232, 236], [408, 236]], 2.6);
    for (i = 0; i < 2; i++) for (k = 0; k < 2; k++){ if (i === 1 && k === 0) continue; R(256 + k * 80, 252 + i * 76, 48, 40, 1.6, COL.paper); Ln(280 + k * 80, 252 + i * 76, 280 + k * 80, 292 + i * 76, 1.2, .6); }
    WASH(318, 334, 54, 42, COL.sun, night ? .5 : .32, 12);
    R(284, 304, 68, 56, 2.2, null); Ln(318, 304, 318, 360, 1.4, .7);
    S([[296, 352], [298, 330], [312, 330]], 1.6); O(330, 334, 5, 1.4); Ln(326, 342, 344, 352, 1.4);
    R(298, G - 72, 40, 72, 2, COL.paper); O(332, G - 36, 2.5, 1.2);
    R(286, G - 92, 64, 16, 1.8, COL.paper); TX('ROOM', 318, G - 79, 12, 'center', MONO);
    /* bench */
    R(160, 432, 70, 9, 2, COL.paper); Ln(166, 441, 166, G, 2); Ln(224, 441, 224, G, 2); S([[160, 412], [230, 412]], 2); Ln(163, 412, 163, 432, 1.6); Ln(227, 412, 227, 432, 1.6);
    /* the directory board: read it here */
    Ln(478, G, 478, 392, 2.2); Ln(562, G, 562, 392, 2.2);
    R(466, 300, 108, 92, 2.4, COL.paper); R(466, 300, 108, 16, 2, COL.ink);
    lctx.fillStyle = COL.paper; lctx.font = '700 9px ' + MONO; lctx.textAlign = 'center'; lctx.fillText('DIRECTORY', 520, 311.5);
    ['Notes', 'Research', 'Route', 'Education', 'Work & Service', 'Awards', 'Dev', 'Contact'].forEach(function(n, j){ lctx.fillStyle = COL.ink; lctx.font = '6.4px ' + MONO; lctx.textAlign = 'left'; lctx.fillText((j + 1) + '  ' + n, 474, 326 + j * 8.2); });
    /* the subway entrance: take the stairs down */
    S([[604, G], [604, 380], [748, 380], [748, G]], 2.4); S([[596, 380], [756, 380]], 3);
    R(624, 388, 104, 24, 2, COL.paper); TX('SUBWAY', 676, 406, 18);
    O(612, 362, 9, 2, COL.leaf); O(740, 362, 9, 2, COL.leaf); Ln(612, 371, 612, 380, 2); Ln(740, 371, 740, 380, 2);
    lctx.fillStyle = COL.ink; lctx.globalAlpha = .08; lctx.fillRect(620, 420, 112, G - 420); lctx.globalAlpha = 1;
    for (i = 0; i < 4; i++){ var sy2 = 426 + i * 11; Ln(626 + i * 3, sy2, 726 - i * 3, sy2, 1.6, .9 - i * .15); }
    /* coffee cart */
    R(800, 404, 120, 58, 2.2, COL.paper); S([[792, 404], [860, 376], [928, 404]], 2); TX('COFFEE', 860, 438, 18); O(820, 468, 9, 2, COL.paper); O(900, 468, 9, 2, COL.paper);
    if (!still){ var st = (T * .5) % 1; S([[874, 372 - st * 20], [880, 362 - st * 20], [874, 352 - st * 20]], 1.2, 1 - st); }
    if (kind === 'snow'){ WASH(500, G + 4, 1400, 10, COL.paper, .9, 13); O(420, G - 18, 18, 2, COL.paper); O(420, G - 46, 13, 2, COL.paper); O(420, G - 66, 9, 1.8, COL.paper); Ln(422, G - 66, 432, G - 64, 2); }
    if (wet){ for (var pd = 0; pd < 3; pd++){ var px = 420 + pd * 150, rp = still ? .5 : (T * .8 + pd * .3) % 1; lctx.strokeStyle = COL.ink; lctx.globalAlpha = (1 - rp) * .6; lctx.lineWidth = 1.2; lctx.beginPath(); lctx.ellipse(px, G + 8, 8 + rp * 26, 2 + rp * 4, 0, 0, 6.3); lctx.stroke(); lctx.globalAlpha = 1; } }
    if (kind === 'storm' && !still && (T % 7) < .22) S([[1000, -40], [980, 40], [1006, 38], [970, 130]], 3);
    /* the figure: reacts to the weather, to your cursor, and to the choice you point at */
    var fig = { x: 446, y: G, face: 1, look: look, wind: windy, breath: cold };
    if (wet){ var u = still ? .3 : (T / 9) % 2, e = u < 1 ? ease(u) : ease(2 - u); fig.x = lerp(430, 590, e); fig.face = u < 1 ? 1 : -1; fig.mode = (e > .98 || e < .02) ? 'stand' : 'walk'; fig.ph = T * 6; fig.umbrella = true; }
    else if (kind === 'snow'){ fig.x = 452; fig.mode = 'shiver'; }
    else if (night){ fig.x = 196; fig.y = 432; fig.mode = 'sit'; fig.seat = 0; fig.mug = true; fig.look = look || { x: 820, y: 96 }; fig.smile = true; }
    else if (kind === 'clear' || kind === 'partly'){ fig.x = 190; fig.y = 432; fig.mode = 'read'; fig.seat = 0; fig.shades = true; fig.hot = hot; if (look) fig.mode = 'sit'; }
    else if (kind === 'fog'){ fig.mode = 'scratch'; fig.face = -1; }
    else { fig.mode = 'stand'; fig.mug = true; fig.look = look || { x: 600, y: 80 }; }
    var want = target || (P > .03 ? 'read' : null);
    if (want){
      var o = OBJ[want]; fig.look = { x: o.x, y: o.y }; fig.surprise = !leaving; fig.smile = !!leaving;
      if (fig.mode !== 'walk'){ fig.y = G; fig.x = Math.max(fig.x, 400); fig.mode = 'point'; fig.face = o.x < fig.x ? -1 : 1; fig.mug = false; fig.shades = false; }
      if (leaving){ var lt = Math.min(1, (performance.now() - leaving.t) / 380); fig.mode = 'walk'; fig.ph = lt * 10; fig.x = lerp(fig.x, o.x, ease(lt) * .6); fig.face = o.x < fig.x ? -1 : 1; fig.sq = lt < .25 ? .06 : 0; }
    } else if (look && fig.mode !== 'walk') fig.smile = true;
    FIG(fig);
    /* weather in front of everything, across the whole screen */
    screen();
    var rainN = { drizzle: 90, rain: 190, storm: 240 }[kind] || 0, slant = 4 + windy * 10;
    for (var d = 0; d < rainN; d++){ var qx = Math.abs((Math.sin(d * 12.9) * 43758.5) % 1), qy = Math.abs((Math.sin(d * 78.2) * 24634.6) % 1);
      var rx = qx * (cw + 60) - 30, ry = ((qy * (ch + 40) + (still ? 0 : T * (kind === 'drizzle' ? 300 : 560) * (.85 + qx * .3))) % (ch + 40)) - 30, len = kind === 'drizzle' ? 10 : 18;
      Ln(rx, ry, rx - slant, ry + len, 1.1, .5); }
    if (kind === 'snow'){ for (var n = 0; n < 130; n++){ var hx = Math.abs((Math.sin(n * 91.7) * 43758.5) % 1), hy = Math.abs((Math.sin(n * 37.3) * 24634.6) % 1), sp = 26 + hx * 34;
      var fx2 = ((hx * cw + (still ? 0 : Math.sin(T * .8 + n) * 14 + T * windy * 20)) % cw + cw) % cw, fy = ((hy * (ch + 20) + (still ? 0 : T * sp)) % (ch + 20)) - 20; O(fx2, fy, 1.8 + hy * 1.6, 1, COL.paper); } }
    /* the last stretch of the scroll: the board's paper becomes the page */
    if (P > .74){ lctx.fillStyle = COL.paper; lctx.globalAlpha = Math.min(1, (P - .74) / .16); lctx.fillRect(0, 0, cw, ch); lctx.globalAlpha = 1; }
  }
  function sizeStage(){
    dpr = Math.min(2, devicePixelRatio || 1); cw = live.clientWidth; ch = live.clientHeight;
    if (live.width !== Math.round(cw * dpr) || live.height !== Math.round(ch * dpr)){ live.width = Math.round(cw * dpr); live.height = Math.round(ch * dpr); }
    var portrait = ch > cw * 1.05;
    /* the street rests just above the choice cards; on phones the scene is cropped around the three ways in */
    var cards = document.querySelector('.choices'), cardTop = cards ? cards.getBoundingClientRect().top - live.getBoundingClientRect().top : ch * .78;
    s = portrait ? Math.max(cw / 1000, Math.min(cw / 520, ch * .48 / 560)) : Math.min(cw / 1080, ch / 600);
    var rx = cw / 2 + (portrait ? 0 : Math.min(cw * .12, 170)), gy = Math.min(ch * .82, Math.max(ch * .5, cardTop - 18));
    var restX = rx + (FX - 500) * s, restY = gy + (FY - G) * s;
    var r = stage.getBoundingClientRect(), span = Math.max(1, r.height - ch);
    P = I.reduce.matches ? 0 : cl(-r.top / span, 0, 1);
    var e = ease(cl(P / .8, 0, 1)), zMax = cl(.85 * Math.min(cw, ch * 1.15) / (108 * s), 3, 16);
    Z = Math.pow(zMax, e);                 // geometric, so each bit of scroll moves you in by the same feel
    FSX = lerp(restX, cw / 2, e); FSY = lerp(restY, ch / 2, e);
    var ov = document.getElementById('stageUi'); if (ov){ var op = cl(1 - P * 4, 0, 1); ov.style.opacity = op; ov.style.visibility = op < .02 ? 'hidden' : 'visible'; }
    return cw > 0;
  }

  /* ================= section drawings (300 x 200) ================= */
  function books(x, y){ var lab = ['BE', 'PhD', 'MD']; for (var i = 0; i < 3; i++){ var bw = 86 - i * 8, bx = x - bw / 2 + (i % 2 ? 4 : -3); R(bx, y - 14 * (i + 1), bw, 14, 2, COL.paper); TX(lab[i], x + (i % 2 ? 4 : -3), y - 14 * i - 3, 11, 'center', MONO); } }
  var VIG = {
    study: function(T, lk, hov){
      WASH(150, 150, 105, 40, COL.sun, .32, 1); WASH(222, 70, 40, 30, COL.sky, .25, 2);
      books(150, 176);
      var f = { x: 146, y: 134, mode: 'write', face: 1, seat: 2, look: lk, smile: !!lk };
      if (lk || hov){ f.mode = 'sit'; f.look = lk || { x: 300, y: 60 }; }
      R(170, 138, 30, 4, 1.6, COL.paper); FIG(f); S([[0, 176], [300, 176]], 2);
    },
    toss: function(T, lk, hov){
      var u = T % 5.2;
      WASH(70, 160, 60, 24, COL.rose, .28, 3);
      R(30, 128, 80, 6, 2, COL.paper); Ln(36, 134, 36, 176, 2); Ln(104, 134, 104, 176, 2);
      S([[200, 176], [204, 140], [246, 140], [250, 176], [200, 176]], 2.2); H(205, 146, 40, 28, 7, .35); TX('drafts', 225, 194, 14);
      var f = { x: 62, y: 176, mode: 'write', face: 1, seat: 44, look: lk }, ball = null;
      if (u > 2.2 && u < 2.8){ f.mode = 'sit'; ball = { x: 96, y: 120 }; }
      if (u >= 2.8 && u < 3.25){ f.mode = 'throw'; f.k = 0; f.sq = .05; ball = { x: 56, y: 108 }; }
      if (u >= 3.25 && u < 3.45){ var k = ease((u - 3.25) / .2); f.mode = 'throw'; f.k = k; ball = { x: lerp(56, 92, k), y: lerp(108, 100, k) }; }
      if (u >= 3.45 && u < 4.25){ var k2 = (u - 3.45) / .8; f.mode = 'sit'; f.look = { x: 225, y: 140 }; ball = { x: lerp(92, 225, k2), y: 100 - Math.sin(k2 * Math.PI) * 70 + k2 * 40 }; }
      if (u >= 4.25){ f.mode = 'sit'; f.smile = true; f.look = lk || { x: 300, y: 40 }; }
      if (hov && u < 2.2){ f.mode = 'sit'; f.look = lk; f.smile = true; }
      FIG(f); if (ball) O(ball.x, ball.y, 6, 1.6, COL.paper);
      S([[0, 176], [300, 176]], 2);
    },
    scope: function(T, lk, hov){
      var u = T % 6;
      WASH(190, 120, 70, 50, COL.leaf, .26, 4);
      R(150, 168, 70, 8, 2, COL.paper); S([[200, 168], [200, 120], [186, 104]], 2.4); R(178, 92, 14, 26, 2, COL.paper); S([[184, 92], [178, 74]], 2.2);
      R(170, 140, 40, 6, 1.8, COL.paper); O(205, 130, 5, 1.6, COL.paper);
      var up = u > 3.4 && u < 5.4;
      var f = { x: 130, y: 176, mode: up ? 'sit' : 'peer', face: 1, seat: 28, look: up ? (lk || { x: 120, y: 40 }) : null, surprise: up && u < 3.8, smile: up && u >= 3.8 };
      FIG(f);
      if (up){ var k = back(cl((u - 3.4) / .4, 0, 1)), c = I.ctx; c.save(); c.translate(88, 48); c.scale(k, k);
        S([[-40, 8], [-34, -18], [0, -26], [36, -16], [44, 8], [20, 24], [-10, 26], [-40, 8]], 1.8); O(-30, 30, 4, 1.4); O(-38, 40, 2.5, 1.2);
        S([[-10, -6], [-14, -14], [-6, -16], [0, -10], [6, -16], [14, -14], [10, -6], [0, 6], [-10, -6]], 1.8); S([[0, -10], [2, -20], [12, -20], [14, -12]], 1.6);
        c.restore(); }
      S([[0, 176], [300, 176]], 2);
    },
    train: function(T, lk, hov){
      var stops = [['New Delhi', 22], ['Long Island', 92], ['Manhattan', 152], ['Madison', 212], ['Portland', 274]];
      WASH(150, 96, 135, 22, COL.sky, .22, 5);
      S([[22, 96], [274, 96]], 4);
      stops.forEach(function(st, i){ O(st[1], 96, 6, 2, COL.paper); TX(st[0], st[1], i % 2 ? 122 : 80, 12.5); });
      var L = 8, u = I.reduce.matches ? .9 : (T % L) / L, k = ease(cl(u * 1.15, 0, 1)), tx = lerp(22, 274, k), c = I.ctx;
      c.save(); c.translate(tx, 96);
      R(-22, -13, 44, 20, 2.2, COL.paper); R(-16, -9, 11, 8, 1.5, COL.paper); R(4, -9, 11, 8, 1.5, COL.paper); O(-10, -5, 3, 1.2);
      for (var i = 0; i < 3; i++){ var p = (T * 1.2 + i * .33) % 1; if (k < 1) O(-28 - p * 26, -16 - p * 12, 2 + p * 4, 1.1, null, 1 - p); }
      c.restore();
      if (k >= 1) FIG({ x: 262, y: 186, mode: 'wave', face: -1, look: lk || { x: 150, y: 150 } });
    },
    carry: function(T, lk, hov){
      var u = T % 6, go = u < 3, k = go ? ease(u / 3) : ease((u - 3) / 3), x = go ? lerp(50, 240, k) : lerp(240, 50, k), fc = go ? 1 : -1;
      WASH(150, 160, 120, 22, COL.sun, .24, 6);
      var vel = Math.sin(k * Math.PI) * (go ? 1 : -1);
      var f = { x: x, y: 176, mode: 'carry', face: fc, ph: u * 10, look: lk };
      f.hold = function(wx, wy){ for (var i = 0; i < 3; i++){ var lag = I.reduce.matches ? 0 : -vel * (i * 2.2) * Math.sin(T * 8 + i) * .6, bx = wx + fc * 2 + lag - 14, by = wy - 14 - i * 18; R(bx, by, 28, 18, 2, COL.paper); Ln(bx + 6, by + 9, bx + 22, by + 9, 1, .6); } };
      if (k > .97 || k < .03){ f.mode = 'stand'; f.hold = null; }
      FIG(f);
      if (f.mode === 'stand'){ for (var i = 0; i < 3; i++) R(x + fc * 22 - 14, 158 - i * 18, 28, 18, 2, COL.paper); }
      S([[0, 176], [300, 176]], 2);
    },
    mail: function(T, lk, hov){
      var u = T % 6;
      WASH(200, 130, 60, 48, COL.rose, .26, 7);
      S([[214, 176], [214, 130]], 2.4); R(186, 96, 56, 36, 2.2, COL.paper); S([[186, 104], [214, 92], [242, 104]], 2);
      var fl = u > 2.6 ? back(cl((u - 2.6) / .35, 0, 1)) : 0;
      S([[244, 118], [250, 118], [250, 118 - fl * 22], [262, 118 - fl * 22], [262, 124 - fl * 16]], 2);
      var x = u < 2 ? lerp(40, 150, ease(u / 2)) : 150;
      var f = { x: x, y: 176, mode: u < 2 ? 'walk' : u < 2.6 ? 'point' : 'wave', ph: u * 9, face: 1, look: u > 2.6 ? (lk || { x: 20, y: 60 }) : { x: 214, y: 110 }, smile: u > 2.6 };
      if (u >= 2 && u < 2.6){ var k = (u - 2) / .6; R(lerp(176, 196, k), lerp(110, 104, k), 16, 10, 1.6, COL.paper); }
      FIG(f); S([[0, 176], [300, 176]], 2);
    }
  };

  var vigs = [].map.call(document.querySelectorAll('canvas[data-vig]'), function(cv){ return { cv: cv, ctx: cv.getContext('2d'), name: cv.dataset.vig, on: false, hov: false }; });
  var stageOn = true;
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.target === stage){ stageOn = e.isIntersecting; return; } var v = vigs.find(function(v){ return v.cv === e.target; }); if (v) v.on = e.isIntersecting; }); }, { rootMargin: '80px' });
    vigs.forEach(function(v){ io.observe(v.cv); }); if (stage) io.observe(stage);
  } else vigs.forEach(function(v){ v.on = true; });
  vigs.forEach(function(v){ v.cv.addEventListener('pointerenter', function(){ v.hov = true; }); v.cv.addEventListener('pointerleave', function(){ v.hov = false; }); });

  var running = false;
  function frame(now){
    if (I.plain()){ running = false; return; }
    I.tick(now);
    if (live && stageOn && sizeStage()){ I.use(lctx); screen(); lctx.fillStyle = COL.paper; lctx.fillRect(0, 0, cw, ch);
      var m = I.lookIn(live, 0, 0, 0, 0, 1), look = null;
      if (m){ var sx = s * Z; look = { x: FX + (m.x - FSX) / sx, y: FY + (m.y - FSY) / sx }; }
      drawStage(look); }
    vigs.forEach(function(v){ if (v.on && VIG[v.name] && I.fit(v.cv, v.ctx, 300, 200)){ I.use(v.ctx); VIG[v.name](I.T, I.lookIn(v.cv, 300, 200), v.hov); } });
    requestAnimationFrame(frame);
  }
  function start(){ if (!running && !I.plain()){ running = true; requestAnimationFrame(frame); } }
  document.addEventListener('plainchange', start);
  start();
})();
