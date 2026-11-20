/* /ride/: a full-screen ink-and-watercolor descent into a station, then a train ride from New Delhi to now.
   The scroll position directs the film: scroll back and the figure walks back up. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, COL = I.COL;
  var cv = document.getElementById('film'), ctx = cv.getContext('2d');
  var chs = [].slice.call(document.querySelectorAll('.ch')), sceneEl = document.getElementById('scene'), dots = document.getElementById('dots');
  chs.forEach(function(c, i){ var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Scene ' + (i + 1) + ': ' + c.dataset.name); b.addEventListener('click', function(){ c.scrollIntoView({ behavior: I.reduce.matches ? 'auto' : 'smooth' }); }); dots.appendChild(b); });

  var GROUND = 400, MEZZ = 760, PLAT = 1130, RT = 1260, RF = 1600, NOW = 2020, BW = 800;
  var WL = -400, WR = 1200, camY = 0, camX = 0, first = true;
  function c(){ return I.ctx; }
  function stairs(x0, y0, x1, y1, n){
    var p = [[x0, y0]], dx = (x1 - x0) / n, dy = (y1 - y0) / n, i;
    for (i = 0; i < n; i++){ var x = x0 + dx * i, y = y0 + dy * i; p.push([x + dx, y]); p.push([x + dx, y + dy]); }
    c().fillStyle = COL.paper; c().beginPath(); c().moveTo(x0, y0); p.forEach(function(q){ c().lineTo(q[0], q[1]); }); c().lineTo(x0, y1); c().closePath(); c().fill();
    S(p, 2.2); S([[x0, y0 - 44], [x1, y1 - 44]], 1.8); for (i = 0; i <= n; i += 3) Ln(x0 + dx * i, y0 + dy * i - 44, x0 + dx * i, y0 + dy * i, 1.2, .8);
    c().save(); c().beginPath(); c().moveTo(x0, y0); p.forEach(function(q){ c().lineTo(q[0], q[1]); }); c().lineTo(x0, y1); c().closePath(); c().clip();
    for (i = -400; i < 400; i += 10) Ln(Math.min(x0, x1) + i, y1, Math.min(x0, x1) + i + 400, y1 - 400, 1, .3);
    c().restore();
  }
  function stairPos(x0, y0, x1, y1, n, t){ var s = t * n, i = Math.floor(Math.min(s, n - .001)), f = s - i, dx = (x1 - x0) / n, dy = (y1 - y0) / n; return { x: x0 + dx * (i + f), y: y0 + dy * i + dy * cl((f - .45) * 3, 0, 1), ph: s * Math.PI }; }
  function tiles(x, y, w, h){ var yy, xx, r; for (yy = y; yy < y + h; yy += 22) Ln(x, yy, x + w, yy, 1, .13); for (yy = y, r = 0; yy < y + h; yy += 22, r++) for (xx = x + (r % 2 ? 22 : 0); xx < x + w; xx += 44) Ln(xx, yy, xx, Math.min(yy + 22, y + h), 1, .13); }
  function earth(y0, y1){ H(WL, y0, WR - WL, y1 - y0, 14, .16); }
  function street(){
    var T = I.T, still = I.reduce.matches;
    WASH(400, 170, 700, 190, COL.sky, .2, 11); WASH(680, 90, 60, 50, COL.sun, .25, 12); O(680, 90, 24, 2, COL.paper);
    for (var k = 0; k < 3; k++){ var cx = ((k * 420 + (still ? 0 : T * 12)) % 1400) - 300, cy = 70 + k * 34; S([[cx, cy], [cx + 20, cy - 16], [cx + 50, cy - 20], [cx + 76, cy - 8], [cx + 100, cy - 14], [cx + 124, cy], [cx, cy]], 1.5, .6); }
    for (var i = 0; i < 60; i++){ var x = WL + ((i * 173) % Math.max(800, WR - WL)), y = ((i * 61 + (still ? i * 9 : T * 260)) % 430) - 30; if (y < GROUND - 8) Ln(x, y, x - 5, y + 13, 1, .45); }
    S([[WL, GROUND], [WR, GROUND]], 2.6); earth(GROUND + 3, 470); c().fillStyle = COL.paper; c().fillRect(585, GROUND + 3, 220, 70);
    R(20, 170, 120, 230, 1.6, COL.paper); for (var r = 0; r < 5; r++) for (var q = 0; q < 3; q++) R(38 + q * 34, 192 + r * 40, 18, 24, 1.2, r === 2 && q === 1 ? COL.sun : null);
    WASH(342, 300, 60, 110, COL.sun, .22, 13); S([[300, GROUND], [300, 210], [318, 196], [340, 198]], 2.4); O(342, 208, 8, 1.8, COL.sun);
    S([[540, GROUND], [540, 270], [720, 270], [720, GROUND]], 2.4); S([[528, 270], [732, 270]], 3); R(572, 282, 116, 30, 2, COL.paper); TX('SUBWAY', 630, 305, 24);
    O(552, 250, 10, 2, COL.leaf); O(708, 250, 10, 2, COL.leaf); Ln(552, 260, 552, 270, 2); Ln(708, 260, 708, 270, 2);
  }
  function mezz(){
    var T = I.T;
    S([[WL, 470], [560, 470]], 2.2); S([[WL, MEZZ], [WR, MEZZ]], 2.6); earth(MEZZ + 3, 830); c().fillStyle = COL.paper; c().fillRect(95, MEZZ + 3, 250, 70);
    tiles(Math.max(WL, -600), 480, 560 - Math.max(WL, -600), MEZZ - 480);
    WASH(300, 605, 170, 95, COL.sun, .2, 14); R(150, 520, 300, 170, 2.4, COL.paper); TX('N  —  notes in progress', 300, 550, 22);
    var st = [[190, 650], [260, 610], [330, 630], [410, 585]]; S(st, 5, 1, COL.pop); st.forEach(function(p, i){ O(p[0], p[1], 8, 2, COL.paper); TX(String(i + 1), p[0], p[1] - 14, 18); });
    for (var i = 0; i < 3; i++){ var tx = 580 + i * 60; R(tx, MEZZ - 56, 16, 56, 2, COL.paper); S([[tx + 16, MEZZ - 36], [tx + 36, MEZZ - 42]], 2.2); }
    var cx = -120, cy = 560; O(cx, cy, 30, 2.2, COL.paper); var mm = T / 60 * 6.283; Ln(cx, cy, cx + Math.sin(mm) * 22, cy - Math.cos(mm) * 22, 1.8); Ln(cx, cy, cx + Math.sin(mm / 12) * 14, cy - Math.cos(mm / 12) * 14, 2.6);
  }
  function plat(tx, door){
    S([[WL, 830], [WR, 830]], 2.2); tiles(WL, 840, WR - WL, 150);
    for (var cx = Math.floor(WL / 340) * 340 + 60; cx < WR; cx += 340){ S([[cx, 830], [cx, PLAT]], 2.4); S([[cx + 14, 830], [cx + 14, PLAT]], 1.6); }
    Ln(330, 830, 330, 860, 1.6); Ln(470, 830, 470, 860, 1.6); R(300, 860, 200, 36, 2.2, COL.paper); TX('RESEARCH  ↓', 400, 886, 22);
    if (tx < WR + 40){
      var ty = PLAT - 150, tw = 640, i;
      if (!door && tx > -20) for (i = 0; i < 6; i++) Ln(tx + tw + 20 + i * 12, ty + 30 + i * 18, tx + tw + 80 + i * 20, ty + 30 + i * 18, 1.4, .6);
      WASH(tx + tw / 2, ty + 80, tw / 2 + 10, 70, COL.rose, .3, 15); c().fillStyle = COL.paper; c().globalAlpha = .5; c().fillRect(tx, ty, tw, 150); c().globalAlpha = 1;
      S([[tx + 20, ty], [tx + tw - 20, ty], [tx + tw, ty + 20], [tx + tw, ty + 150], [tx, ty + 150], [tx, ty + 20], [tx + 20, ty]], 2.6);
      for (i = 0; i < 5; i++) R(tx + 40 + i * 120, ty + 26, 70, 44, 2, COL.paper);
      [170, 410].forEach(function(d){ var g = door ? 18 : 0; R(tx + d - g, ty + 16, 30, 130, 2, COL.paper); R(tx + d + 30 + g, ty + 16, 30, 130, 2, COL.paper); });
      O(tx + tw - 40, ty + 52, 17, 2, COL.paper); TX('R', tx + tw - 40, ty + 60, 26);
    }
    S([[WL, PLAT], [WR, PLAT]], 3); for (var k = Math.floor(WL / 24) * 24; k < WR; k += 24) Ln(k, PLAT + 3, k + 12, PLAT + 3, 2, .8); earth(PLAT + 6, RT - 40);
  }
  function city(n, x, b){
    var T = I.T; c().save(); c().translate(x, b);
    if (n === 'New Delhi'){ WASH(0, -80, 90, 80, COL.sun, .3, 21); R(-60, -150, 120, 18, 2); S([[-50, 0], [-50, -132], [50, -132], [50, 0]], 2.4); S([[-24, 0], [-24, -70], [-14, -92], [0, -98], [14, -92], [24, -70], [24, 0]], 2.2); var k = Math.sin(T * 2) * 6; S([[110, -170 + k], [124, -150 + k], [110, -130 + k], [96, -150 + k], [110, -170 + k]], 1.8); S([[110, -130 + k], [100, -100], [115, -70], [104, -40]], 1.1, .7); }
    else if (n === 'Long Island'){ WASH(0, -60, 150, 70, COL.rose, .26, 23); [[-140, 0], [-70, 0]].forEach(function(p){ S([[p[0], 0], [p[0], -40], [p[0] + 25, -64], [p[0] + 50, -40], [p[0] + 50, 0]], 2); R(p[0] + 18, -24, 14, 24, 1.4); }); R(10, -90, 130, 90, 2.2, COL.paper); for (var w = 0; w < 4; w++) R(22 + w * 30, -70, 16, 18, 1.4); Ln(75, -90, 75, -130, 1.8); S([[75, -130], [100, -122], [75, -114]], 1.6); TX('high school', 75, -100, 13); }
    else if (n === 'Manhattan'){ WASH(-20, -120, 170, 120, COL.sky, .28, 24); [[-160, -120], [-120, -190], [-80, -140], [-40, -240], [0, -170], [40, -210], [80, -130], [120, -180]].forEach(function(p){ var bx = p[0], h = p[1]; S([[bx, 0], [bx, h], [bx + 36, h], [bx + 36, 0]], 2); for (var wy = h + 14; wy < -10; wy += 22) Ln(bx + 8, wy, bx + 28, wy, 1, .5); }); S([[120, -180], [120, -196], [148, -196], [148, -180]], 1.8); S([[118, -196], [134, -210], [150, -196]], 1.8); R(-150, -30, 70, 22, 1.8, COL.paper); TX('135 St', -115, -14, 14); }
    else if (n === 'Madison'){ WASH(0, -80, 120, 80, COL.rose, .28, 25); S([[-90, 0], [-90, -60], [90, -60], [90, 0]], 2.2); S([[-40, -60], [-40, -100], [40, -100], [40, -60]], 2); S([[-38, -100], [-30, -130], [-14, -148], [0, -152], [14, -148], [30, -130], [38, -100]], 2.2); Ln(0, -152, 0, -176, 1.8); }
    else { WASH(-40, -80, 170, 90, COL.leaf, .28, 26); S([[-170, 0], [-70, -170], [30, 0]], 2.4); S([[-102, -116], [-88, -104], [-76, -116], [-62, -106], [-48, -116]], 1.6); for (var i = 0; i < 4; i++) S([[80, -30 - i * 30], [60, -i * 30], [100, -i * 30], [80, -30 - i * 30]], 1.8); S([[110, 0], [150, -60], [200, -70], [250, -60], [290, 0]], 2); }
    c().restore(); TX(n, x, b + 40, 24);
  }
  var CITIES = ['New Delhi', 'Long Island', 'Manhattan', 'Madison', 'Portland'];
  function ride(t, sway){
    H(WL, RT - 30, WR - WL, RF - RT + 90, 22, .12);
    c().fillStyle = COL.paper; c().fillRect(20, RT, 760, RF - RT + 30); S([[20, RT + 30], [60, RT], [740, RT], [780, RT + 30], [780, RF + 30], [20, RF + 30], [20, RT + 30]], 2.6);
    var wins = [[70, RT + 60, 180, 150], [310, RT + 60, 180, 150], [550, RT + 60, 180, 150]];
    c().save(); c().beginPath(); wins.forEach(function(w){ c().rect(w[0], w[1], w[2], w[3]); }); c().clip();
    var span = 780, off = -t * span * (CITIES.length - 1) + 400;
    CITIES.forEach(function(n, i){ var cx = off + i * span; if (cx > -300 && cx < 1100) city(n, cx, RT + 190); });
    c().restore(); wins.forEach(function(w){ R(w[0], w[1], w[2], w[3], 2.4); });
    for (var i = 0; i < 6; i++){ var hx = 110 + i * 120, a = sway * .25; Ln(hx, RT + 18, hx + Math.sin(a) * 24, RT + 40, 1.4); O(hx + Math.sin(a) * 30, RT + 48, 8, 1.6); }
    R(60, RF - 58, 680, 22, 2.2, COL.paper); S([[270, RT + 10], [270, RF]], 2); S([[530, RT + 10], [530, RF]], 2); S([[20, RF], [780, RF]], 2.4);
    var rx0 = 160, rx1 = 640, ry = RT + 236, last = CITIES.length - 1; S([[rx0, ry], [rx1, ry]], 3, 1, COL.pop);
    CITIES.forEach(function(n, i){ var px = rx0 + (rx1 - rx0) * i / last, here = Math.round(t * last) === i, yy = ry; O(px, yy, 6, 2, here ? COL.ink : COL.paper); TX(n, px, yy + (i % 2 ? 44 : 28), 14); });
  }
  function now(){ earth(RF + 60, NOW - 240); S([[WL, NOW - 230], [WR, NOW - 230]], 2.2); tiles(WL, NOW - 220, WR - WL, 200);
    WASH(400, NOW - 170, 200, 40, COL.sun, .3, 16); Ln(250, NOW - 230, 250, NOW - 196, 1.6); Ln(550, NOW - 230, 550, NOW - 196, 1.6); R(220, NOW - 196, 360, 52, 2.4, COL.paper); TX('NOW', 400, NOW - 158, 36);
    S([[WL, NOW], [WR, NOW]], 3); earth(NOW + 4, NOW + 400);
  }
  function where(){ var mid = innerHeight * .5, idx = 0, t = 0; chs.forEach(function(ch, i){ var r = ch.getBoundingClientRect(); if (r.top < mid){ idx = i; t = cl((mid - r.top) / r.height, 0, 1); } }); return { idx: idx, t: t }; }
  function draw(){
    var dpr = Math.min(2, devicePixelRatio || 1), cw = innerWidth, ch = innerHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var wide = cw > 860, reserve = wide ? Math.min(480, cw * .36) : 0, sc = wide ? Math.min((cw - reserve) / BW, ch / 470) : Math.min(cw / 520, ch / 700), vw = cw / sc, vh = ch / sc;
    var w = where(), idx = w.idx, t = w.t, T = I.T;
    var f = { x: 120, y: GROUND, mode: 'shiver', face: 1, ph: 0, breath: true }, camT = 0, tx = 1400, door = false, rideT = 0, fx = 400, fy = wide ? .68 : .48, u, p;
    if (idx === 0){ if (t < .3) f.mode = 'shiver'; else { u = ease((t - .3) / .7); f.x = lerp(120, 600, u); f.mode = u < 1 ? 'walk' : 'stand'; f.ph = u * 22; f.breath = false; } camT = f.y - vh * fy; fx = f.x; }
    else if (idx === 1){ p = stairPos(600, GROUND, 780, MEZZ, 12, ease(t)); f = { x: p.x, y: p.y, ph: p.ph, mode: t < 1 ? 'walk' : 'stand', face: 1 }; camT = f.y - vh * (fy - .06); fx = f.x - 60; }
    else if (idx === 2){ if (t < .45){ u = ease(t / .45); f = { x: lerp(770, 330, u), y: MEZZ, face: -1, mode: 'walk', ph: u * 20 }; } else if (t < .8) f = { x: 330, y: MEZZ, face: -1, mode: 'scratch', look: { x: 300, y: 600 } }; else { u = ease((t - .8) / .2); f = { x: lerp(330, 110, u), y: MEZZ, face: -1, mode: 'walk', ph: u * 10 }; } camT = MEZZ - vh * fy; fx = f.x; }
    else if (idx === 3){
      if (t < .3){ p = stairPos(110, MEZZ, 330, PLAT, 12, ease(t / .3)); f = { x: p.x, y: p.y, ph: p.ph, mode: 'walk', face: 1 }; }
      else if (t < .45){ u = ease((t - .3) / .15); f = { x: lerp(330, 420, u), y: PLAT, mode: 'walk', ph: u * 6, face: 1 }; }
      else f = { x: 420, y: PLAT, mode: 'shiver', face: 1, breath: true };
      tx = t < .6 ? 1400 : lerp(1400, 30, ease(cl((t - .6) / .25, 0, 1))); door = t > .86;
      if (t > .6 && t < .86){ f.surprise = true; f.look = { x: tx + 300, y: PLAT - 80 }; }
      if (t > .9){ u = cl((t - .9) / .08, 0, 1); f.mode = 'walk'; f.x = lerp(420, tx + 215, u); f.ph = u * 6; f.alpha = 1 - cl((t - .96) / .04, 0, 1); }
      camT = lerp(Math.min(f.y, PLAT) - vh * fy, PLAT - vh * fy, cl(t * 3, 0, 1)); fx = f.x;
    }
    else if (idx === 4){ rideT = ease(t); f = { x: 400, y: RF - 34, mode: 'sit', seat: 22, look: { x: 400, y: RT + 150 }, smile: true, face: 1 }; camT = (RT + RF) / 2 - vh / 2 + 10; fx = 400; }
    else { u = ease(cl(t / .4, 0, 1)); f = { x: lerp(140, 300, u), y: NOW, mode: u < 1 ? 'walk' : 'wave', ph: u * 10, smile: true, face: 1 }; camT = lerp((RT + RF) / 2 - vh / 2 + 10, NOW - vh * fy, ease(cl(t * 2.5, 0, 1))); fx = f.x + 80; }
    var cxT = wide ? -(reserve / sc) - Math.max(0, (vw - reserve / sc - BW) / 2) : (vw >= BW + 80 ? (BW - vw) / 2 : cl(fx - vw / 2, -40, BW + 40 - vw));
    camT = cl(camT, -60, NOW + 120 - vh); var k = (I.reduce.matches || first) ? 1 : .12; first = false;
    camY = lerp(camY, camT, k); camX = lerp(camX, cxT, k); WL = camX - 30; WR = camX + vw + 30;
    I.use(ctx); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, cw, ch);
    ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -camX * dpr * sc, -camY * dpr * sc);
    var vis = function(a, b){ return b > camY - 40 && a < camY + vh + 40; };
    if (vis(0, GROUND + 80)) street();
    if (vis(GROUND, MEZZ + 80)){ mezz(); stairs(600, GROUND, 780, MEZZ, 12); }
    if (vis(MEZZ, RT)){ plat(tx, door); stairs(110, MEZZ, 330, PLAT, 12); }
    var sway = I.reduce.matches ? 0 : Math.sin(T * 2.4);
    if (vis(RT - 40, RF + 60)){ ctx.save(); if (idx === 4) ctx.translate(sway * 1.5, 0); ride(idx === 4 ? rideT : (idx > 4 ? 1 : 0), idx === 4 ? sway : 0); ctx.restore(); }
    if (vis(RF, NOW + 400)) now();
    if (f.alpha !== 0){ ctx.save(); if (idx === 4){ ctx.translate(sway * 1.5, 0); f.x += sway * 2; } FIG(f); ctx.restore(); }
    sceneEl.textContent = 'Scene ' + (idx + 1) + ' · ' + chs[idx].dataset.name;
    [].forEach.call(dots.children, function(b, i){ b.classList.toggle('on', i === idx); });
  }
  var running = false;
  function frame(nowMs){ if (I.plain()){ running = false; return; } I.tick(nowMs); draw(); requestAnimationFrame(frame); }
  function start(){ if (!running && !I.plain()){ running = true; first = true; requestAnimationFrame(frame); } }
  document.addEventListener('plainchange', start);
  start();
})();
