/* /room/: one drawn room. Click an object and the details open at once while the figure walks over.
   Each object has a real button over it (and a plain list below the room) for keyboards and screen readers.
   The window shows Portland's live weather. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, cl = I.cl, COL = I.COL;
  var room = document.getElementById('room'), cv = document.getElementById('roomCv'), ctx = cv.getContext('2d');
  var panel = document.getElementById('panel'), list = document.getElementById('list');
  var RW = 1200, RH = 680, FLOOR = 610, WX = null;
  I.weather().then(function(w){ WX = w; });
  var HOT = [
    { id: 'notes', label: 'Notebook', r: [280, 392, 112, 46], stand: 330, act: 'write' },
    { id: 'dev', label: 'Laptop', r: [396, 376, 72, 62], stand: 410, act: 'point', lookY: 400 },
    { id: 'research', label: 'Microscope', r: [474, 290, 96, 146], stand: 470, act: 'peer' },
    { id: 'training', label: 'Diplomas', r: [350, 96, 250, 150], stand: 470, act: 'point', lookY: 160 },
    { id: 'awards', label: 'Awards shelf', r: [640, 150, 170, 110], stand: 720, act: 'point', lookY: 200 },
    { id: 'route', label: 'Suitcase', r: [650, 470, 160, 140], stand: 620, act: 'crouch' },
    { id: 'work', label: 'Coat rack', r: [880, 200, 110, 410], stand: 860, act: 'point', lookY: 300 },
    { id: 'contact', label: 'Door', r: [1020, 170, 140, 440], stand: 990, act: 'wave' }
  ];
  var hero = { x: 150, face: 1, mode: 'stand', ph: 0, target: null, act: null, sq: 0, antic: 0 };
  var hover = null, active = null, sc = 1, ox = 0, oy = 0, last = 0;
  HOT.forEach(function(h){
    var b = document.createElement('button'); b.className = 'hot'; b.type = 'button'; b.setAttribute('aria-label', 'Open ' + h.label);
    b.addEventListener('mouseenter', function(){ hover = h; }); b.addEventListener('mouseleave', function(){ if (hover === h) hover = null; });
    b.addEventListener('focus', function(){ hover = h; }); b.addEventListener('blur', function(){ if (hover === h) hover = null; });
    b.addEventListener('click', function(){ go(h); }); h.btn = b; room.appendChild(b);
    var l = document.createElement('button'); l.type = 'button'; l.textContent = h.label; l.setAttribute('aria-pressed', 'false'); l.addEventListener('click', function(){ go(h); }); h.lb = l; list.appendChild(l);
  });
  function place(){ var w = room.clientWidth, h = room.clientHeight; sc = Math.min(w / RW, h / RH); ox = (w - RW * sc) / 2; oy = (h - RH * sc) / 2;
    HOT.forEach(function(o){ o.btn.style.left = (ox + o.r[0] * sc) + 'px'; o.btn.style.top = (oy + o.r[1] * sc) + 'px'; o.btn.style.width = (o.r[2] * sc) + 'px'; o.btn.style.height = (o.r[3] * sc) + 'px'; }); }
  function go(h){
    active = h; hero.target = h.stand; hero.act = h.act; hero.antic = I.reduce.matches ? 0 : .18;
    HOT.forEach(function(o){ o.lb.setAttribute('aria-pressed', String(o === h)); });
    panel.querySelectorAll('section').forEach(function(s){ s.hidden = s.dataset.c !== h.id; });
    panel.classList.add('open'); panel.scrollTop = 0;
    var head = panel.querySelector('section:not([hidden]) h2'); if (head){ head.setAttribute('tabindex', '-1'); setTimeout(function(){ head.focus({ preventScroll: true }); }, 50); }
  }
  function closePanel(){ panel.classList.remove('open'); if (active && active.btn) active.btn.focus(); active = null; hero.act = null; HOT.forEach(function(o){ o.lb.setAttribute('aria-pressed', 'false'); }); }
  document.getElementById('close').addEventListener('click', closePanel);
  addEventListener('keydown', function(e){ if (e.key === 'Escape' && panel.classList.contains('open') && !document.querySelector('dialog[open]')) closePanel(); });
  addEventListener('resize', place);

  function step(dt){
    if (hero.antic > 0){ hero.antic -= dt; hero.sq = Math.sin((1 - hero.antic / .18) * Math.PI) * .08; hero.mode = 'crouch'; return; }
    hero.sq *= .8;
    if (hero.target != null && Math.abs(hero.target - hero.x) > 2){
      var dir = Math.sign(hero.target - hero.x), sp = I.reduce.matches ? 1e4 : 300; hero.face = dir;
      hero.x += dir * Math.min(Math.abs(hero.target - hero.x), sp * dt); hero.ph += dt * 11; hero.mode = 'walk';
      if (Math.abs(hero.target - hero.x) <= 2){ hero.x = hero.target; hero.sq = -.06; }
    } else { hero.mode = hero.act || 'stand'; if (hero.act) hero.face = 1; }
  }
  function windowView(){
    var T = I.T, still = I.reduce.matches, kind = WX ? WX.kind : 'cloudy', h = I.pdxHour();
    var night = WX && Date.now() - WX.at < 3 * 3600e3 ? !WX.day : (h < 6.5 || h >= 19.5), c = I.ctx;
    WASH(160, 210, 100, 96, night ? COL.night : COL.sky, night ? .4 : .3, 31); R(60, 110, 200, 200, 2.4, null); Ln(160, 110, 160, 310, 1.8); Ln(60, 210, 260, 210, 1.8);
    c.save(); c.beginPath(); c.rect(62, 112, 196, 196); c.clip();
    if ((kind === 'clear' || kind === 'partly') && !night){ S([[70, 300], [150, 190], [230, 300]], 2); S([[126, 224], [138, 232], [150, 222], [162, 232], [174, 224]], 1.4); O(226, 140, 14, 2, COL.sun); }
    if (night){ O(220, 140, 12, 2, COL.paper); for (var s = 0; s < 8; s++){ var sx = 70 + (s * 37) % 180, sy = 120 + (s * 23) % 70; Ln(sx - 2, sy, sx + 2, sy, 1); Ln(sx, sy - 2, sx, sy + 2, 1); } }
    if (kind === 'cloudy' || kind === 'drizzle' || kind === 'rain' || kind === 'storm' || kind === 'partly'){ var cx = 80 + ((still ? 0 : T * 8) % 160); S([[cx, 150], [cx + 16, 136], [cx + 40, 132], [cx + 60, 146], [cx, 150]], 1.6); }
    if (kind === 'fog'){ WASH(160, 220, 110, 30, COL.paper, .8, 33); WASH(160, 260, 110, 24, COL.paper, .8, 34); }
    var nRain = { drizzle: 12, rain: 24, storm: 30 }[kind] || 0;
    for (var i = 0; i < nRain; i++){ var rx = 62 + (i * 53) % 196, ry = 112 + ((i * 37 + (still ? i * 11 : T * 160)) % 196); Ln(rx, ry, rx - 3, ry + 10, 1, .55); }
    if (kind === 'snow'){ for (var n = 0; n < 24; n++){ var fx = 62 + (n * 41 + (still ? 0 : Math.sin(T + n) * 6)) % 196, fy = 112 + ((n * 29 + (still ? n * 5 : T * 30)) % 196); O(fx, fy, 1.6, 1, COL.paper); } }
    c.restore(); R(52, 310, 216, 10, 2, COL.paper);
    if (WX) TX('Portland · ' + WX.tempF + '°F', 160, 340, 17);
  }
  function drawRoom(hl){
    var T = I.T, P = COL.paper;
    S([[0, FLOOR], [RW, FLOOR]], 2.6); H(0, FLOOR + 4, RW, RH - FLOOR, 12, .18);
    windowView();
    [[360, 110, 70, 90], [450, 96, 80, 104], [550, 116, 60, 80]].forEach(function(d){ R(d[0], d[1], d[2], d[3], 2.2, P); R(d[0] + 8, d[1] + 8, d[2] - 16, d[3] - 16, 1.2); O(d[0] + d[2] / 2, d[1] + d[3] - 20, 6, 1.2, COL.rose); });
    TX('MD', 395, 150, 15); TX('PhD', 490, 142, 15); TX('BE', 580, 150, 15);
    R(640, 236, 170, 10, 2, P); Ln(660, 246, 668, 262, 1.6); Ln(790, 246, 782, 262, 1.6);
    S([[668, 236], [664, 206], [690, 206], [686, 236]], 2); O(677, 200, 10, 1.8, COL.sun); S([[700, 236], [700, 196], [730, 196], [730, 236]], 1.8); S([[742, 236], [750, 186], [770, 186], [778, 236]], 1.8); O(760, 176, 7, 1.6, COL.sun);
    WASH(450, 440, 220, 40, COL.sun, .22, 32);
    R(240, 436, 400, 14, 2.4, P); Ln(260, 450, 260, FLOOR, 2.2); Ln(620, 450, 620, FLOOR, 2.2); R(540, 450, 80, 70, 1.8, P); Ln(550, 485, 610, 485, 1.4);
    S([[290, 436], [300, 412], [386, 412], [392, 436]], 2.2); Ln(341, 414, 341, 436, 1.4, .6); for (var i = 0; i < 4; i++) Ln(300 + i * 9, 420 + i * 3, 330 + i * 6, 420 + i * 3, 1, .5);
    R(398, 428, 66, 8, 2, P); var c = I.ctx; c.fillStyle = P; c.fillRect(406, 386, 52, 42); S([[404, 428], [408, 384], [460, 384], [460, 428]], 2.2);
    if (!I.reduce.matches){ for (var k = 0; k < 3; k++){ var w = 10 + ((T * 30 + k * 13) % 30); Ln(414, 396 + k * 9, 414 + w, 396 + k * 9, 1.2, .7); } } else { Ln(414, 396, 440, 396, 1.2, .7); Ln(414, 405, 432, 405, 1.2, .7); }
    R(476, 422, 90, 14, 2, P); S([[546, 422], [546, 350], [522, 322]], 2.4); R(512, 300, 22, 40, 2, P); S([[522, 300], [512, 276]], 2.2); R(498, 380, 60, 8, 1.8, P); O(554, 368, 7, 1.6, P);
    S([[260, 436], [262, 350], [300, 320]], 2); S([[290, 308], [316, 330], [330, 312], [302, 296], [290, 308]], 2); WASH(312, 360, 40, 50, COL.sun, .25, 33);
    R(660, 500, 140, 104, 2.4, P); S([[710, 500], [712, 482], [748, 482], [750, 500]], 2.2); Ln(660, 540, 800, 540, 1.4, .6);
    var mono = '"JetBrains Mono",monospace';
    O(690, 522, 11, 1.4, COL.sun); TX('DEL', 690, 526, 10, 'center', mono); R(718, 552, 44, 22, 1.4, COL.sky); TX('NYC', 740, 567, 10, 'center', mono);
    O(780, 580, 11, 1.4, COL.leaf); TX('PDX', 780, 584, 10, 'center', mono); R(670, 566, 36, 18, 1.4, COL.rose); TX('MSN', 688, 579, 9, 'center', mono);
    S([[935, FLOOR], [935, 220]], 2.6); S([[905, FLOOR], [935, 580], [965, FLOOR]], 2.2); S([[935, 236], [905, 224]], 2); S([[935, 236], [965, 224]], 2);
    S([[935, 250], [900, 262], [892, 340], [915, 420], [955, 420], [978, 340], [970, 262], [935, 250]], 2.2); WASH(935, 330, 40, 80, COL.leaf, .25, 34);
    [[950, 300, 'OHSU'], [912, 330, 'EPIC'], [948, 366, 'CCNY']].forEach(function(b){ S([[b[0] + 10, b[1] - 26], [b[0] + 10, b[1]]], 1.2, .7); R(b[0], b[1], 22, 28, 1.6, P); TX(b[2], b[0] + 11, b[1] + 18, 7, 'center', mono); });
    var open = hl && hl.id === 'contact' ? 8 : 0;
    R(1030, 180, 120, FLOOR - 180, 2.4, P); S([[1030 + open, 186], [1144, 182], [1144, FLOOR - 2], [1030 + open, FLOOR - 2]], 2); O(1052 + open, 400, 6, 1.8, COL.sun); R(1070, 330, 44, 10, 1.8, P); TX('mail', 1092, 322, 13);
    S([[200, FLOOR], [192, 560], [228, 560], [220, FLOOR]], 2.2); for (var j = 0; j < 5; j++){ var a = -2.4 + j * .4 + (I.reduce.matches ? 0 : Math.sin(T * 1.2 + j) * .04); S([[210, 560], [210 + Math.cos(a) * 40, 560 + Math.sin(a) * 46]], 1.8); }
    WASH(210, 530, 34, 36, COL.leaf, .3, 35);
  }
  function draw(now){
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now; step(dt);
    var dpr = Math.min(2, devicePixelRatio || 1), w = room.clientWidth, h = room.clientHeight;
    if (!w) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); place(); }
    I.use(ctx); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
    var hl = hover || active;
    if (hl) WASH(hl.r[0] + hl.r[2] / 2, hl.r[1] + hl.r[3] / 2, hl.r[2] * .62, hl.r[3] * .56, COL.pop, .16, 40);
    drawRoom(hl);
    if (hover){ var lx = cl(hover.r[0] + hover.r[2] / 2, 80, RW - 80), ly = Math.max(34, hover.r[1] - 16);
      ctx.font = '22px "Patrick Hand","Comic Sans MS",cursive'; var tw = ctx.measureText(hover.label).width + 22;
      ctx.fillStyle = COL.ink; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx - tw / 2, ly - 26, tw, 32, 10); else ctx.rect(lx - tw / 2, ly - 26, tw, 32); ctx.fill();
      ctx.fillStyle = COL.paper; ctx.textAlign = 'center'; ctx.fillText(hover.label, lx, ly - 3); }
    var look = null;
    if (hover) look = { x: hover.r[0] + hover.r[2] / 2, y: hover.r[1] + hover.r[3] / 2 };
    else { var m = I.lookIn(cv, 0, 0, ox, oy, sc); if (m) look = m; else if (active) look = { x: active.r[0] + active.r[2] / 2, y: active.lookY || active.r[1] + active.r[3] / 2 }; }
    var f = { x: hero.x, y: FLOOR, face: hero.face, mode: hero.mode, ph: hero.ph, sq: hero.sq, look: look, smile: !!active && hero.mode !== 'walk', surprise: !!hover && hero.mode === 'stand' };
    if (f.mode === 'write'){ f.mode = 'stand'; f.look = { x: 340, y: 420 }; }
    if (f.mode === 'peer'){ f.mode = 'stand'; f.lean = 6; f.look = { x: 522, y: 300 }; }
    if (f.mode === 'point' && active) f.look = { x: active.r[0] + active.r[2] / 2, y: active.lookY || active.r[1] };
    var Z = 2.25;
    ctx.save(); ctx.translate(f.x, FLOOR); ctx.scale(Z, Z); ctx.translate(-f.x, -FLOOR);
    if (f.look) f.look = { x: f.x + (f.look.x - f.x) / Z, y: FLOOR + (f.look.y - FLOOR) / Z };
    FIG(f); ctx.restore();
  }
  var running = false;
  function frame(now){ if (I.plain()){ running = false; return; } I.tick(now); draw(now); requestAnimationFrame(frame); }
  function start(){ if (!running && !I.plain()){ running = true; last = performance.now(); requestAnimationFrame(function(n){ place(); frame(n); }); } }
  document.addEventListener('plainchange', start);
  start();
})();
