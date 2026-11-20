/* The home page world: one continuous ink drawing that loops.
   Scroll down from the Portland street: stairs, the mezzanine (Notes), the platform (Research), the train ride
   (New Delhi by air to New York, then Madison, then Portland), arrival at Portland · Now, and a door that leads
   into the room. Scroll up from the street: the OHSU Aerial Tram climbs Marquam Hill into the same room.
   So it is a loop: room -> tram -> street -> subway -> door -> room.
   Your scroll (wheel, touch, keys) moves a virtual camera; nothing on the page itself scrolls. Every object you
   can use has a tag. The room's objects open the same panel as before. The loop indicator on the right jumps to
   any stop. Plain mode sends you to /directory/, the whole site on one page. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, COL = I.COL;
  var MONO = '"JetBrains Mono",monospace';
  var cv = document.getElementById('world'); if (!cv) return;
  var ctx = cv.getContext('2d'), hot = document.getElementById('hot'), loopNav = document.getElementById('loopNav');
  var still = function(){ return I.reduce.matches; };

  /* ---------- the loop: virtual position v in [0, LEN) ---------- */
  /* The loop is a day's commute, in order. Scrolling forward:
     street (South Waterfront) -> subway stairs -> mezzanine (Notes) -> platform (Research) -> the ride ->
     Portland, now (Contact) -> escalator up to TriMet -> streetcar along the Willamette back to South Waterfront ->
     Aerial Tram up to OHSU -> the hallway -> the room -> out its door -> the tram back down to the street. */
  var LEN = 6700;
  var ZONES = [
    { id: 'street', a: 0, b: 520, stop: 260, label: 'Street' },
    { id: 'notes', a: 520, b: 1130, stop: 980, label: 'Notes' },
    { id: 'research', a: 1130, b: 1720, stop: 1560, label: 'Research' },
    { id: 'ride', a: 1720, b: 2920, stop: 1830, label: 'Ride' },
    { id: 'portland', a: 2920, b: 3500, stop: 3120, label: 'Portland' },
    { id: 'streetcar', a: 3500, b: 4250, stop: 3720, label: 'Streetcar' },
    { id: 'tram', a: 4250, b: 4950, stop: 4560, label: 'Tram up' },
    { id: 'hall', a: 4950, b: 5350, stop: 5120, label: 'OHSU' },
    { id: 'room', a: 5350, b: 6050, stop: 5650, label: 'Room' },
    { id: 'tramdown', a: 6050, b: 6700, stop: 6300, label: 'Tram down' }
  ];
  var u = 260, ut = 260;                       // unwrapped position (current, target)
  function wrap(x){ return ((x % LEN) + LEN) % LEN; }
  function zoneAt(x){ x = wrap(x); for (var i = 0; i < ZONES.length; i++) if (x >= ZONES[i].a && x < ZONES[i].b) return ZONES[i]; return ZONES[0]; }
  function goTo(stop, instant){ var cur = wrap(ut), d = stop - cur; if (d > LEN / 2) d -= LEN; if (d < -LEN / 2) d += LEN; ut += d; if (instant || still()) u = ut; }
  var HASH = { street: 260, subway: 700, notes: 980, research: 1560, ride: 1830, portland: 3120, streetcar: 3720, tram: 4560, hall: 5120, room: 5650, tramdown: 6300 };
  var h0 = (location.hash || '').slice(1); if (HASH[h0] != null){ u = ut = HASH[h0]; }

  /* ---------- input: wheel, touch, keys; panels that scroll keep their own scrolling ---------- */
  function scrollsInside(t, dy){
    for (var el = t; el && el !== document.body; el = el.parentElement){
      if (el.nodeType !== 1) continue;
      var cs = getComputedStyle(el); if (!/(auto|scroll)/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
      if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
    }
    return false;
  }
  function blocked(){ return I.plain() || document.querySelector('dialog[open]') || (panel && panel.classList.contains('open') && innerWidth < 860); }
  addEventListener('wheel', function(e){ if (blocked() || scrollsInside(e.target, e.deltaY)) return; e.preventDefault(); var d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY; ut += cl(d, -160, 160) * .9; }, { passive: false });
  var ty = null;
  addEventListener('touchstart', function(e){ ty = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchmove', function(e){ if (ty == null || blocked()) return; var y = e.touches[0].clientY, dy = ty - y; if (scrollsInside(e.target, dy)) { ty = y; return; } e.preventDefault(); ut += dy * 1.7; ty = y; }, { passive: false });
  addEventListener('keydown', function(e){
    if (blocked() || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName) && e.key === ' ') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var k = e.key, step = innerHeight * .6;
    if (k === 'ArrowDown') ut += 80; else if (k === 'ArrowUp') ut -= 80;
    else if (k === 'PageDown' || (k === ' ' && !e.shiftKey)) ut += step; else if (k === 'PageUp' || (k === ' ' && e.shiftKey)) ut -= step;
    else return;
    e.preventDefault();
  });

  /* ---------- the loop indicator ---------- */
  if (loopNav){
    ZONES.forEach(function(z){ var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.dataset.z = z.id; b.innerHTML = '<span class="dot"></span><span class="lb"></span>'; b.querySelector('.lb').textContent = z.label; b.addEventListener('click', function(){ goTo(z.stop); }); li.appendChild(b); loopNav.appendChild(li); });
  }
  document.querySelectorAll('[data-goto-zone]').forEach(function(el){ el.addEventListener('click', function(e){ var z = el.dataset.gotoZone; if (HASH[z] != null){ e.preventDefault(); goTo(HASH[z]); } }); });

  /* ---------- weather and light ---------- */
  var WX = null, cap = document.getElementById('liveNow');
  function night(){ var p = I.phase(); return p === 'night'; }
  function caption(){ if (!cap) return; var p = ['Portland, Oregon', I.pdxTime()]; if (WX){ p.push(WX.tempF + '°F'); p.push(I.WORDS[WX.kind]); } var sl = I.sunLine(); if (sl) p.push(sl); cap.textContent = p.join(' · '); }
  function load(){ I.weather().then(function(w){ WX = w; caption(); }); }
  load(); caption(); setInterval(function(){ load(); caption(); }, 60000);

  /* ---------- camera ---------- */
  var dpr = 1, cw = 0, ch = 0, s = 1, camX = 0, camTop = 0, vh = 600, vw = 1000, WL = -400, WR = 1400;
  var SY = 1500, RY = 1568, ROOMK = 1000 / 1200, ROOMY = 40;      // band offsets
  var G = SY + 468, MEZZ = RY + 760, PLAT = RY + 1130, RT = RY + 1260, RF = RY + 1600, NOW = RY + 2020;
  var TRAM_A = { x: 860, y: 720 }, TRAM_B = { x: 110, y: 1890 };
  function seg(x, a, b){ return cl((x - a) / (b - a), 0, 1); }
  var TOWER = { x: 612, y: 934 };
  function cabin(p){ var k = .22; if (p < k){ var q = p / k; return { x: lerp(TRAM_A.x, TOWER.x, q), y: lerp(TRAM_A.y, TOWER.y, q) + 52 }; } var r = (p - k) / (1 - k); return { x: lerp(TOWER.x, TRAM_B.x, r), y: lerp(TOWER.y, TRAM_B.y, r) + 52 - r * 40 }; }
  var SC = 5000, GS = SC + 468, HY = -900, HF = HY + 500;        // the streetcar and hallway scenes
  function camFor(x){ // world y at the top of the screen, and the figure, for loop position x
    var nw = cw <= 900, F = function(wide, narrow){ return nw ? narrow : wide; };
    var f = { x: 446, y: G, mode: 'stand', face: 1, ph: 0 }, top, fx = 500, z = zoneAt(x).id, t, c;
    var streetTop = G - vh * F(.84, .5), roomTop = 300 - vh * F(.5, .34);
    if (z === 'street'){ top = streetTop; fx = 520; f = null;
      if (x > 400){ t = seg(x, 400, 520); f = { x: lerp(446, 640, ease(t)), y: G, mode: 'walk', ph: t * 10, face: 1 }; } }
    else if (z === 'notes'){ t = seg(x, 520, 870); var st = stairPos(600, G, 780, MEZZ, 12, ease(t));
      if (t < 1){ f = { x: st.x, y: st.y, ph: st.ph, mode: 'walk', face: 1 }; top = Math.max(Math.min(st.y - vh * F(.62, .4), MEZZ - vh * F(.64, .42)), streetTop); }
      else { t = seg(x, 870, 1130); if (t < .5) f = { x: lerp(770, 330, ease(t * 2)), y: MEZZ, face: -1, mode: 'walk', ph: t * 20 }; else f = { x: 330, y: MEZZ, face: -1, mode: 'scratch', look: { x: 300, y: MEZZ - 160 } }; top = MEZZ - vh * F(.64, .42); }
      fx = f.x; }
    else if (z === 'research'){ t = seg(x, 1130, 1330);
      if (t < 1){ var s2 = stairPos(110, MEZZ, 330, PLAT, 12, ease(t)); f = { x: s2.x, y: s2.y, ph: s2.ph, mode: 'walk', face: 1 }; top = lerp(MEZZ - vh * F(.64, .42), PLAT - vh * F(.64, .42), ease(t)); }
      else { t = seg(x, 1330, 1720); f = { x: 420, y: PLAT, mode: 'shiver', face: 1, breath: true }; top = PLAT - vh * F(.64, .42);
        if (t > .35 && t < .75){ f.surprise = true; f.look = { x: 700, y: PLAT - 80 }; }
        if (t > .82){ var k = seg(t, .82, .98); f.mode = 'walk'; f.x = lerp(420, 245, k); f.face = -1; f.ph = k * 6; f.alpha = 1 - seg(t, .94, 1); } }
      fx = 420; }
    else if (z === 'ride'){ top = (RT + RF) / 2 - vh * F(.5, .34) + 10; f = null; fx = 400; }
    else if (z === 'portland'){ t = seg(x, 2920, 3460);
      top = lerp((RT + RF) / 2 - vh * F(.5, .34) + 10, NOW - vh * F(.72, .46), ease(seg(t, 0, .3)));
      if (t < .55){ var w = seg(t, .08, .55); f = { x: lerp(260, 760, ease(w)), y: NOW, mode: w > 0 && w < 1 ? 'walk' : 'stand', ph: w * 18, face: 1, smile: true }; }
      else { var e = ease(seg(t, .55, 1)); f = { x: lerp(760, 960, e), y: lerp(NOW, NOW - 290, e), mode: 'stand', face: 1, smile: true, look: { x: 1000, y: NOW - 400 } }; top = lerp(NOW - vh * F(.72, .46), NOW - 290 - vh * F(.6, .4), e); }
      fx = f.x; }
    else if (z === 'streetcar'){ top = GS - vh * F(.84, .5); fx = 500; f = null;
      if (x > 4080){ t = seg(x, 4080, 4230); f = { x: lerp(330, 120, ease(t)), y: GS, mode: 'walk', ph: t * 10, face: -1 }; fx = 400; } }
    else if (z === 'tram'){ c = cabin(1 - ease(seg(x, 4300, 4900))); top = c.y - vh * F(.5, .34); f = { tram: c }; fx = c.x; }
    else if (z === 'hall'){ t = seg(x, 5000, 5300); top = HF - vh * F(.72, .48); f = { x: lerp(110, 880, ease(t)), y: HF, mode: t > 0 && t < 1 ? 'walk' : 'stand', ph: t * 24, face: 1 }; fx = f.x; }
    else if (z === 'room'){ top = roomTop; f = null; fx = 500; }
    else { t = seg(x, 6100, 6560); c = cabin(ease(t)); top = lerp(c.y - vh * F(.5, .34), streetTop, ease(seg(x, 6540, 6700))); f = { tram: c }; fx = lerp(c.x, 520, seg(x, 6540, 6700)); }
    return { top: top, fig: f, fx: fx, zone: z };
  }
  /* Where the journey changes vehicle or goes through a door, the page washes to paper and back. */
  var SEAMS = [3500, 4250, 4950, 5350, 6050];
  function wipeAt(x){ var a = 0; SEAMS.forEach(function(c){ a = Math.max(a, 1 - Math.abs(x - c) / 70); }); return cl(a, 0, 1); }
  function stairPos(x0, y0, x1, y1, n, t){ var s0 = t * n, i = Math.floor(Math.min(s0, n - .001)), f = s0 - i, dx = (x1 - x0) / n, dy = (y1 - y0) / n; return { x: x0 + dx * (i + f), y: y0 + dy * i + dy * cl((f - .45) * 3, 0, 1), ph: s0 * Math.PI }; }
  var reserveK = 1;
  function size(x){
    dpr = Math.min(2, devicePixelRatio || 1); cw = innerWidth; ch = innerHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var wide = cw > 900, z = zoneAt(x).id;
    reserveK = lerp(reserveK, (z === 'room' || !wide) ? 0 : 1, .12);
    var reserve = wide ? Math.min(470, cw * .36) * reserveK : 0;
    s = wide ? Math.min((cw - reserve) / 1000, ch / 560) : Math.min(cw / 600, ch / 760);
    vw = cw / s; vh = ch / s;
    var c = camFor(x); camTop = c.top;
    camX = wide ? -(reserve / s) - Math.max(0, (vw - reserve / s - 1000) / 2) : (vw >= 1080 ? (1000 - vw) / 2 : cl(c.fx - vw / 2, -40, 1040 - vw));
    WL = camX - 30; WR = camX + vw + 30;
    return c;
  }
  function world(){ ctx.setTransform(dpr * s, 0, 0, dpr * s, -camX * dpr * s, -camTop * dpr * s); }
  function screen(){ ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function toScreen(wx, wy){ return [(wx - camX) * s, (wy - camTop) * s]; }
  function vis(a, b){ return b > camTop - 60 && a < camTop + vh + 60; }

  /* ---------- drawing helpers ---------- */
  function tiles(x, y, w, h){ var yy, xx, r; for (yy = y; yy < y + h; yy += 22) Ln(x, yy, x + w, yy, 1, .13); for (yy = y, r = 0; yy < y + h; yy += 22, r++) for (xx = x + (r % 2 ? 22 : 0); xx < x + w; xx += 44) Ln(xx, yy, xx, Math.min(yy + 22, y + h), 1, .13); }
  function earth(y0, y1){ H(WL, y0, WR - WL, y1 - y0, 14, .16); }
  function stairs(x0, y0, x1, y1, n){
    var p = [[x0, y0]], dx = (x1 - x0) / n, dy = (y1 - y0) / n, i;
    for (i = 0; i < n; i++){ var xx = x0 + dx * i, yy = y0 + dy * i; p.push([xx + dx, yy]); p.push([xx + dx, yy + dy]); }
    ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.moveTo(x0, y0); p.forEach(function(q){ ctx.lineTo(q[0], q[1]); }); ctx.lineTo(x0, y1); ctx.closePath(); ctx.fill();
    S(p, 2.2); S([[x0, y0 - 44], [x1, y1 - 44]], 1.8); for (i = 0; i <= n; i += 3) Ln(x0 + dx * i, y0 + dy * i - 44, x0 + dx * i, y0 + dy * i, 1.2, .8);
  }
  function sky(y0, y1){
    var ph = I.phase(), col = ph === 'night' ? COL.night : COL.sky, a = ph === 'night' ? .3 : (ph === 'golden' || ph === 'dusk' || ph === 'dawn') ? .18 : .2;
    WASH(500, (y0 + y1) / 2, 1500, (y1 - y0) / 2 + 200, col, a, 1);
    if (ph === 'golden' || ph === 'dusk' || ph === 'dawn') WASH(500, y1 - 80, 1300, 140, COL.rose, .22, 2);
  }

  /* ================= the room (top of the loop) ================= */
  var RW = 1200, FLOOR = 610;
  var HOTS = [
    { id: 'notes', label: 'Notebook', r: [280, 392, 112, 46], stand: 330, act: 'write' },
    { id: 'dev', label: 'Laptop', r: [396, 376, 72, 62], stand: 410, act: 'point', lookY: 400 },
    { id: 'research', label: 'Microscope', r: [474, 290, 96, 146], stand: 470, act: 'peer' },
    { id: 'training', label: 'Diplomas', r: [350, 96, 250, 150], stand: 470, act: 'point', lookY: 160 },
    { id: 'awards', label: 'Awards shelf', r: [640, 150, 170, 110], stand: 720, act: 'point', lookY: 200 },
    { id: 'route', label: 'Suitcase', r: [650, 470, 160, 140], stand: 620, act: 'crouch' },
    { id: 'work', label: 'Coat rack', r: [880, 200, 110, 410], stand: 860, act: 'point', lookY: 300 },
    { id: 'contact', label: 'Door', r: [1020, 170, 140, 440], stand: 990, act: 'wave' }
  ];
  var hero = { x: 150, face: 1, mode: 'stand', ph: 0, target: null, act: null, sq: 0, antic: 0 }, roomHover = null, roomActive = null;
  function roomToWorld(x, y){ return [x * ROOMK, y * ROOMK + ROOMY]; }
  function stepHero(dt){
    if (hero.antic > 0){ hero.antic -= dt; hero.sq = Math.sin((1 - hero.antic / .18) * Math.PI) * .08; hero.mode = 'crouch'; return; }
    hero.sq *= .8;
    if (hero.target != null && Math.abs(hero.target - hero.x) > 2){ var dir = Math.sign(hero.target - hero.x); hero.face = dir; hero.x += dir * Math.min(Math.abs(hero.target - hero.x), (still() ? 1e4 : 300) * dt); hero.ph += dt * 11; hero.mode = 'walk'; if (Math.abs(hero.target - hero.x) <= 2){ hero.x = hero.target; hero.sq = -.06; } }
    else { hero.mode = hero.act || 'stand'; if (hero.act) hero.face = 1; }
  }
  function windowView(){
    var T = I.T, kind = WX ? WX.kind : 'cloudy', nt = night();
    WASH(160, 210, 100, 96, nt ? COL.night : COL.sky, nt ? .4 : .3, 31); R(60, 110, 200, 200, 2.4, null); Ln(160, 110, 160, 310, 1.8); Ln(60, 210, 260, 210, 1.8);
    ctx.save(); ctx.beginPath(); ctx.rect(62, 112, 196, 196); ctx.clip();
    if ((kind === 'clear' || kind === 'partly') && !nt){ S([[70, 300], [150, 190], [230, 300]], 2); S([[126, 224], [138, 232], [150, 222], [162, 232], [174, 224]], 1.4); O(226, 140, 14, 2, COL.sun); }
    if (nt){ O(220, 140, 12, 2, COL.paper); for (var q = 0; q < 8; q++){ var sx = 70 + (q * 37) % 180, sy = 120 + (q * 23) % 70; Ln(sx - 2, sy, sx + 2, sy, 1); Ln(sx, sy - 2, sx, sy + 2, 1); } }
    Ln(62, 250, 258, 200, 1.4, .7); Ln(62, 256, 258, 206, 1.4, .7); // the tram cables go past the window
    var tp = (T * .03) % 1; R(62 + tp * 196 - 12, 250 - tp * 50 + 4, 24, 16, 1.4, COL.paper);
    var nr = { drizzle: 12, rain: 24, storm: 30 }[kind] || 0;
    for (var i = 0; i < nr; i++){ var rx = 62 + (i * 53) % 196, ry = 112 + ((i * 37 + (still() ? i * 11 : T * 160)) % 196); Ln(rx, ry, rx - 3, ry + 10, 1, .55); }
    if (kind === 'snow'){ for (var n = 0; n < 24; n++){ var fx = 62 + (n * 41 + (still() ? 0 : Math.sin(T + n) * 6)) % 196, fy = 112 + ((n * 29 + (still() ? n * 5 : T * 30)) % 196); O(fx, fy, 1.6, 1, COL.paper); } }
    ctx.restore(); R(52, 310, 216, 10, 2, COL.paper);
    if (WX) TX('Portland · ' + WX.tempF + '°F', 160, 340, 17);
  }
  function drawRoom(){
    var T = I.T, P = COL.paper, hl = roomHover || roomActive;
    ctx.save(); ctx.translate(0, ROOMY); ctx.scale(ROOMK, ROOMK);
    WASH(600, 300, 640, 340, COL.tint, .9, 30);
    S([[-200, FLOOR], [RW + 200, FLOOR]], 2.6); H(-200, FLOOR + 4, RW + 400, 60, 12, .18);
    S([[-200, 40], [RW + 200, 40]], 2.2);
    if (hl) WASH(hl.r[0] + hl.r[2] / 2, hl.r[1] + hl.r[3] / 2, hl.r[2] * .62, hl.r[3] * .56, COL.pop, .16, 40);
    windowView();
    /* diplomas: BE and PhD framed; the MD frame waits for its degree */
    R(360, 110, 70, 90, 2.2, P); ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.4; ctx.strokeRect(368, 118, 54, 74); ctx.restore(); TX('MD', 395, 150, 15); TX('in progress', 395, 172, 11);
    R(450, 96, 80, 104, 2.2, P); R(458, 104, 64, 88, 1.2); O(490, 180, 6, 1.2, COL.rose); TX('PhD', 490, 142, 15);
    R(550, 116, 60, 80, 2.2, P); R(558, 124, 44, 64, 1.2); O(580, 176, 6, 1.2, COL.rose); TX('BE', 580, 150, 15);
    R(640, 236, 170, 10, 2, P); Ln(660, 246, 668, 262, 1.6); Ln(790, 246, 782, 262, 1.6);
    S([[668, 236], [664, 206], [690, 206], [686, 236]], 2); O(677, 200, 10, 1.8, COL.sun); S([[700, 236], [700, 196], [730, 196], [730, 236]], 1.8); S([[742, 236], [750, 186], [770, 186], [778, 236]], 1.8); O(760, 176, 7, 1.6, COL.sun);
    WASH(450, 440, 220, 40, COL.sun, .22, 32);
    R(240, 436, 400, 14, 2.4, P); Ln(260, 450, 260, FLOOR, 2.2); Ln(620, 450, 620, FLOOR, 2.2); R(540, 450, 80, 70, 1.8, P); Ln(550, 485, 610, 485, 1.4);
    S([[290, 436], [300, 412], [386, 412], [392, 436]], 2.2); Ln(341, 414, 341, 436, 1.4, .6); for (var i = 0; i < 4; i++) Ln(300 + i * 9, 420 + i * 3, 330 + i * 6, 420 + i * 3, 1, .5);
    R(398, 428, 66, 8, 2, P); ctx.fillStyle = P; ctx.fillRect(406, 386, 52, 42); S([[404, 428], [408, 384], [460, 384], [460, 428]], 2.2);
    for (var k = 0; k < 3; k++){ var w = still() ? 20 : 10 + ((T * 30 + k * 13) % 30); Ln(414, 396 + k * 9, 414 + w, 396 + k * 9, 1.2, .7); }
    R(476, 422, 90, 14, 2, P); S([[546, 422], [546, 350], [522, 322]], 2.4); R(512, 300, 22, 40, 2, P); S([[522, 300], [512, 276]], 2.2); R(498, 380, 60, 8, 1.8, P); O(554, 368, 7, 1.6, P);
    S([[260, 436], [262, 350], [300, 320]], 2); S([[290, 308], [316, 330], [330, 312], [302, 296], [290, 308]], 2); WASH(312, 360, 40, 50, COL.sun, .25, 33);
    R(660, 500, 140, 104, 2.4, P); S([[710, 500], [712, 482], [748, 482], [750, 500]], 2.2); Ln(660, 540, 800, 540, 1.4, .6);
    O(690, 522, 11, 1.4, COL.sun); TX('DEL', 690, 526, 10, 'center', MONO); R(718, 552, 44, 22, 1.4, COL.sky); TX('NYC', 740, 567, 10, 'center', MONO);
    O(780, 580, 11, 1.4, COL.leaf); TX('PDX', 780, 584, 10, 'center', MONO); R(670, 566, 36, 18, 1.4, COL.rose); TX('MSN', 688, 579, 9, 'center', MONO);
    S([[935, FLOOR], [935, 220]], 2.6); S([[905, FLOOR], [935, 580], [965, FLOOR]], 2.2); S([[935, 236], [905, 224]], 2); S([[935, 236], [965, 224]], 2);
    S([[935, 250], [900, 262], [892, 340], [915, 420], [955, 420], [978, 340], [970, 262], [935, 250]], 2.2); WASH(935, 330, 40, 80, COL.leaf, .25, 34);
    [[950, 300, 'OHSU'], [912, 330, 'EPIC'], [948, 366, 'CCNY']].forEach(function(b){ S([[b[0] + 10, b[1] - 26], [b[0] + 10, b[1]]], 1.2, .7); R(b[0], b[1], 22, 28, 1.6, P); TX(b[2], b[0] + 11, b[1] + 18, 7, 'center', MONO); });
    var open = hl && hl.id === 'contact' ? 8 : 0;
    R(1030, 180, 120, FLOOR - 180, 2.4, P); S([[1030 + open, 186], [1144, 182], [1144, FLOOR - 2], [1030 + open, FLOOR - 2]], 2); O(1052 + open, 400, 6, 1.8, COL.sun); R(1070, 330, 44, 10, 1.8, P); TX('mail', 1092, 322, 13);
    S([[200, FLOOR], [192, 560], [228, 560], [220, FLOOR]], 2.2); for (var j = 0; j < 5; j++){ var a = -2.4 + j * .4 + (still() ? 0 : Math.sin(T * 1.2 + j) * .04); S([[210, 560], [210 + Math.cos(a) * 40, 560 + Math.sin(a) * 46]], 1.8); }
    WASH(210, 530, 34, 36, COL.leaf, .3, 35);
    /* the figure in the room */
    var look = null;
    if (roomHover) look = { x: roomHover.r[0] + roomHover.r[2] / 2, y: roomHover.r[1] + roomHover.r[3] / 2 };
    else if (roomActive) look = { x: roomActive.r[0] + roomActive.r[2] / 2, y: roomActive.lookY || roomActive.r[1] + roomActive.r[3] / 2 };
    var f = { x: hero.x, y: FLOOR, face: hero.face, mode: hero.mode, ph: hero.ph, sq: hero.sq, look: look, smile: !!roomActive && hero.mode !== 'walk', surprise: !!roomHover && hero.mode === 'stand' };
    if (f.mode === 'write'){ f.mode = 'stand'; f.look = { x: 340, y: 420 }; }
    if (f.mode === 'peer'){ f.mode = 'stand'; f.lean = 6; f.look = { x: 522, y: 300 }; }
    var Z = 2.25; ctx.save(); ctx.translate(f.x, FLOOR); ctx.scale(Z, Z); ctx.translate(-f.x, -FLOOR);
    if (f.look) f.look = { x: f.x + (f.look.x - f.x) / Z, y: FLOOR + (f.look.y - FLOOR) / Z };
    FIG(f); ctx.restore();
    ctx.restore();
  }

  /* ================= the tram down Marquam Hill ================= */
  function drawTram(cp){
    var T = I.T, c = cabin(cp);
    sky(640, 1960);
    /* Marquam Hill, with OHSU at the top and firs down its side; the hill ends above the street */
    var hill = [[1100, 680], [980, 720], [900, 750], [760, 840], [640, 960], [540, 1100], [460, 1270], [400, 1430]];
    ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.moveTo(hill[0][0], hill[0][1]); hill.forEach(function(q){ ctx.lineTo(q[0], q[1]); }); ctx.lineTo(1400, 1430); ctx.lineTo(1400, 680); ctx.closePath(); ctx.fill();
    S(hill, 2.2, .9);
    ctx.save(); ctx.beginPath(); ctx.moveTo(hill[0][0], hill[0][1]); hill.forEach(function(q){ ctx.lineTo(q[0], q[1]); }); ctx.lineTo(1400, 1430); ctx.lineTo(1400, 680); ctx.closePath(); ctx.clip(); H(380, 680, 1040, 760, 18, .12); ctx.restore();
    WASH(800, 1440, 700, 30, COL.paper, .9, 36);
    for (var t = 0; t < 11; t++){ var py = 790 + t * 58, px = lerp(900, 430, (py - 750) / 680) + 40 + (t * 53) % 160; if (py < 1400){ S([[px, py], [px - 10, py + 24], [px + 10, py + 24], [px, py]], 1.6, .8); Ln(px, py + 24, px, py + 30, 1.4, .8); } }
    /* the upper terminal, on the hospital */
    R(800, 680, 150, 70, 2.4, COL.paper); R(820, 640, 110, 40, 2, COL.paper); TX('OHSU', 875, 667, 16, 'center', MONO);
    for (var w = 0; w < 4; w++) R(812 + w * 34, 698, 20, 22, 1.4, night() ? COL.sun : null);
    /* the tower on the hillside, and the cables over it down to the river */
    S([[590, 1010], [606, 940], [618, 940], [634, 1010]], 2.4); Ln(596, 985, 628, 985, 1.4); R(588, 930, 48, 12, 2, COL.paper);
    S([[TRAM_A.x, TRAM_A.y + 8], [612, 934], [TRAM_B.x, TRAM_B.y - 8]], 1.4); S([[TRAM_A.x, TRAM_A.y + 16], [612, 942], [TRAM_B.x, TRAM_B.y]], 1.4);
    /* the cabin, with him in it */
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.sin(T * 1.3) * (still() ? 0 : .025));
    Ln(0, -36, 0, -8, 2); O(0, -38, 5, 1.6, COL.paper);
    ctx.fillStyle = COL.paper; ctx.fillRect(-46, -8, 92, 58); S([[-40, -8], [40, -8], [46, 0], [46, 50], [-46, 50], [-46, 0], [-40, -8]], 2.4);
    R(-36, 2, 72, 24, 1.8, COL.sky); TX('TRAM', 0, 44, 11, 'center', MONO);
    O(-8, 16, 8, 1.8, COL.paper); S([[-16, 12], [-13, 5], [-8, 3], [-3, 5], [0, 12]], 1.6); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(-6, 16, 1.4, 0, 6.3); ctx.arc(-2, 16, 1.4, 0, 6.3); ctx.fill();
    ctx.restore();
    /* the South Waterfront terminal at the bottom, on the street */
    R(40, 1880, 150, 88, 2.2, COL.paper); S([[30, 1880], [200, 1880]], 2.6); TX('TRAM', 115, 1912, 16, 'center', MONO);
  }

  /* ================= the Portland street ================= */
  var DIR = ['Research', 'Notes', 'Education', 'Work & Service', 'Awards', 'Dev', 'Contact'];
  var DIR_IDS = ['research', 'notes', 'education', 'work', 'awards', 'dev', 'contact'];
  var streetTarget = null, streetAct = null;
  function drawStreet(){
    var kind = WX ? WX.kind : 'cloudy', nt = night(), T = I.T, ph = I.phase(), i, k;
    var wet = kind === 'drizzle' || kind === 'rain' || kind === 'storm', windy = WX ? Math.min(1, WX.wind / 25) : .2;
    var par = function(depth){ return (camTop - (G - vh * (cw <= 900 ? .5 : .84))) * (1 - depth) * .5; };
    ctx.save(); ctx.translate(0, SY);
    /* sun or moon by the real sun over Portland */
    ctx.save(); ctx.translate(0, par(.05));
    if (nt){ for (i = 0; i < 40; i++){ var sx = (i * 137) % 1600 - 300, sy = (i * 71) % 330 - 60, tw = still() ? 1 : .5 + .5 * Math.sin(T * 2 + i); if (kind === 'clear' || kind === 'partly' || i % 3 === 0){ Ln(sx - 3, sy, sx + 3, sy, 1.2, tw); Ln(sx, sy - 3, sx, sy + 3, 1.2, tw); } }
      WASH(820, 96, 46, 46, COL.sun, .28, 6); O(820, 96, 30, 2.2, COL.paper); O(810, 88, 4, 1.2); O(828, 104, 3, 1.2); }
    else if (kind === 'clear' || kind === 'partly'){ var alt = cl(I.sunAlt(new Date()), 0, 30), sunY = lerp(300, 80, alt / 30); WASH(820, sunY, 70, 70, COL.sun, .42, 7); O(820, sunY, 32, 2.4, COL.paper);
      for (var r = 0; r < 12; r++){ var a = r / 12 * 6.283 + (still() ? 0 : T * .15); Ln(820 + Math.cos(a) * 44, sunY + Math.sin(a) * 44, 820 + Math.cos(a) * 60, sunY + Math.sin(a) * 60, 2); } }
    var nc = { clear: 0, partly: 2, cloudy: 6, fog: 3, drizzle: 5, rain: 6, snow: 5, storm: 6 }[kind] || 2;
    for (k = 0; k < nc; k++){ var cx = ((k * 283 + (still() ? 0 : T * (6 + windy * 14))) % 1700) - 450, cy = 60 + (k % 3) * 46, cs = 1 + (k % 2) * .5;
      ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.ellipse(cx + 62 * cs, cy - 10 * cs, 64 * cs, 18 * cs, 0, 0, 6.3); ctx.fill();
      S([[cx, cy], [cx + 18 * cs, cy - 16 * cs], [cx + 48 * cs, cy - 22 * cs], [cx + 74 * cs, cy - 10 * cs], [cx + 98 * cs, cy - 16 * cs], [cx + 124 * cs, cy], [cx, cy]], 1.8);
      if (kind === 'storm' || kind === 'rain') H(cx + 10 * cs, cy - 14 * cs, 100 * cs, 12 * cs, 7, .35); }
    ctx.restore();
    /* Mt. Hood, only when you can see it */
    ctx.save(); ctx.translate(0, par(.2));
    if ((kind === 'clear' || kind === 'partly') && !nt){ S([[640, 300], [770, 140], [900, 300]], 2.4, .8); S([[722, 196], [740, 210], [756, 196], [772, 210], [788, 194], [806, 206]], 1.6, .75); }
    ctx.restore();
    /* the West Hills, then downtown: Big Pink, the tallest tower, and the rest */
    ctx.save(); ctx.translate(0, par(.4));
    S([[-600, 330], [-300, 306], [-20, 326], [80, 300], [180, 316], [280, 290], [380, 312], [470, 302]], 1.8, .7);
    for (var t = -10; t < 9; t++){ var tx = 20 + t * 50, ty = 318 - ((t + 30) % 3) * 8; S([[tx, ty], [tx - 8, ty + 18], [tx + 8, ty + 18], [tx, ty]], 1.4, .7); }
    ctx.restore();
    ctx.save(); ctx.translate(0, par(.55));
    [[700, 236], [742, 200], [866, 226], [906, 206], [948, 248], [990, 222], [1034, 262], [1074, 240]].forEach(function(b, n){
      R(b[0], b[1], 36, 392 - b[1], 1.6, COL.paper);
      for (var wy = b[1] + 14; wy < 372; wy += 22){ if (nt && ((n * 7 + wy) % 3 === 0)){ ctx.fillStyle = COL.sun; ctx.globalAlpha = .7; ctx.fillRect(b[0] + 8, wy, 8, 9); ctx.fillRect(b[0] + 20, wy, 8, 9); ctx.globalAlpha = 1; } else Ln(b[0] + 8, wy + 4, b[0] + 28, wy + 4, 1, .4); }
    });
    WASH(804, 270, 26, 110, COL.rose, .5, 9); R(786, 150, 38, 242, 2, null); for (var bp = 168; bp < 380; bp += 20) Ln(792, bp, 818, bp, 1, .5); // Big Pink
    R(828, 128, 32, 264, 2, COL.paper); S([[828, 128], [844, 108], [860, 128]], 1.8); for (var wf = 146; wf < 380; wf += 18) Ln(834, wf, 854, wf, 1, .45); // the tallest one
    ctx.restore();
    /* the Willamette and the Fremont Bridge's arch */
    ctx.save(); ctx.translate(0, par(.75));
    WASH(500, 404, 1400, 26, COL.sky, .3, 8);
    for (var wv = 0; wv < 22; wv++){ var wx = ((wv * 97 + (still() ? 0 : T * 10)) % 1800) - 400; S([[wx, 406 + (wv % 3) * 6], [wx + 10, 403 + (wv % 3) * 6], [wx + 20, 406 + (wv % 3) * 6]], 1.2, .6); }
    S([[-400, 388], [1400, 388]], 2); S([[880, 388], [960, 336], [1040, 322], [1120, 336], [1200, 388]], 2.4); S([[880, 360], [1200, 360]], 1.8);
    for (var hb = 900; hb < 1200; hb += 18){ var yy = 360 - Math.max(0, 38 - Math.abs(hb - 1040) * .28); Ln(hb, yy, hb, 360, 1, .6); }
    if (kind === 'fog'){ for (var fg = 0; fg < 6; fg++){ var fx = ((fg * 300 + (still() ? 0 : T * 8)) % 1800) - 400; WASH(fx, 250 + fg * 30, 300, 26, COL.paper, .8, 10 + fg); } }
    ctx.restore();
    /* the street */
    var GL = 468, hl = function(k2){ return streetTarget === k2 || (streetAct && streetAct === k2); };
    S([[-1600, GL], [2600, GL]], 2.6);
    if (hl('room')) WASH(115, 420, 90, 60, COL.pop, .2, 41);
    if (hl('directory')) WASH(520, 360, 100, 100, COL.pop, .2, 42);
    if (hl('subway')) WASH(676, 420, 96, 70, COL.pop, .2, 43);
    if (hl('coffee')) WASH(819, 432, 70, 50, COL.pop, .2, 44);
    /* the tram's lower terminal, where the climb to the room starts */
    R(40, 380, 150, 88, 2.2, COL.paper); S([[30, 380], [200, 380]], 2.6); TX('TRAM', 115, 412, 16, 'center', MONO); R(70, 424, 30, 44, 1.6, COL.paper); R(130, 424, 30, 44, 1.6, COL.paper);
    Ln(110, 380, 360, 120, 1.4, .8); Ln(110, 388, 360, 128, 1.4, .8);
    if (nt) WASH(236, 300, 60, 110, COL.sun, .3, 11);
    S([[226, GL], [226, 250], [240, 236], [258, 238]], 2.4); O(260, 248, 9, 1.8, nt ? COL.sun : COL.paper);
    /* food carts */
    R(300, 404, 90, 56, 2, COL.paper); S([[294, 404], [345, 384], [396, 404]], 1.8); TX('TACOS', 345, 438, 14); O(316, 466, 7, 1.6, COL.paper); O(374, 466, 7, 1.6, COL.paper);
    /* the directory board, big enough to read */
    Ln(462, GL, 462, 400, 2.4); Ln(578, GL, 578, 400, 2.4);
    R(440, 272, 160, 128, 2.6, COL.paper); R(440, 272, 160, 22, 2, COL.ink);
    ctx.fillStyle = COL.paper; ctx.font = '700 12px ' + MONO; ctx.textAlign = 'center'; ctx.fillText('DIRECTORY', 520, 287.5);
    DIR.forEach(function(n, j){
      var on = dirLines[j] && (dirLines[j].matches(':hover') || dirLines[j] === document.activeElement);
      if (on){ ctx.fillStyle = COL.sun; ctx.globalAlpha = .6; ctx.fillRect(444, 299 + j * 14, 152, 13); ctx.globalAlpha = 1; }
      ctx.fillStyle = COL.ink; ctx.font = '9.5px ' + MONO; ctx.textAlign = 'left'; ctx.fillText((j + 1) + '  ' + n, 452, 309 + j * 14);
    });
    /* the subway entrance */
    S([[620, GL], [620, 380], [732, 380], [732, GL]], 2.4); S([[612, 380], [740, 380]], 3);
    R(632, 388, 88, 22, 2, COL.paper); TX('SUBWAY', 676, 405, 16);
    O(628, 362, 9, 2, COL.leaf); O(724, 362, 9, 2, COL.leaf); Ln(628, 371, 628, 380, 2); Ln(724, 371, 724, 380, 2);
    ctx.fillStyle = COL.ink; ctx.globalAlpha = .08; ctx.fillRect(636, 418, 80, GL - 418); ctx.globalAlpha = 1;
    for (i = 0; i < 4; i++){ var sy2 = 426 + i * 11; Ln(640 + i * 3, sy2, 712 - i * 3, sy2, 1.6, .9 - i * .15); }
    /* the coffee cart */
    R(764, 404, 110, 58, 2.2, COL.paper); S([[756, 404], [819, 376], [882, 404]], 2); TX('COFFEE', 819, 438, 17); O(782, 468, 9, 2, COL.paper); O(858, 468, 9, 2, COL.paper);
    if (!still()){ var stm = (T * .5) % 1; S([[834, 372 - stm * 20], [840, 362 - stm * 20], [834, 352 - stm * 20]], 1.2, 1 - stm); }
    if (kind === 'snow'){ WASH(500, GL + 4, 1400, 10, COL.paper, .9, 13); O(420, GL - 18, 18, 2, COL.paper); O(420, GL - 46, 13, 2, COL.paper); O(420, GL - 66, 9, 1.8, COL.paper); }
    if (wet){ for (var pd = 0; pd < 3; pd++){ var px2 = 420 + pd * 150, rp = still() ? .5 : (T * .8 + pd * .3) % 1; ctx.strokeStyle = COL.ink; ctx.globalAlpha = (1 - rp) * .6; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(px2, GL + 8, 8 + rp * 26, 2 + rp * 4, 0, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; } }
    if (kind === 'storm' && !still() && (T % 7) < .22) S([[1000, -40], [980, 40], [1006, 38], [970, 130]], 3);
    ctx.restore();
  }
  function streetFigure(look){
    var kind = WX ? WX.kind : 'cloudy', T = I.T, wet = kind === 'drizzle' || kind === 'rain' || kind === 'storm';
    var fig = { x: 410, y: G, face: 1, look: look, wind: WX ? Math.min(1, WX.wind / 25) : .2, breath: WX ? WX.tempF <= 40 : false };
    if (wet){ var uu = still() ? .3 : (T / 9) % 2, e = uu < 1 ? ease(uu) : ease(2 - uu); fig.x = lerp(400, 600, e); fig.face = uu < 1 ? 1 : -1; fig.mode = (e > .98 || e < .02) ? 'stand' : 'walk'; fig.ph = T * 6; fig.umbrella = true; }
    else if (kind === 'snow') fig.mode = 'shiver';
    else if (night()){ fig.mode = 'stand'; fig.mug = true; fig.look = look || { x: 820, y: SY + 96 }; fig.smile = true; }
    else if (kind === 'clear' || kind === 'partly'){ fig.mode = 'stand'; fig.shades = true; fig.smile = true; }
    else if (kind === 'fog'){ fig.mode = 'scratch'; fig.face = -1; }
    else { fig.mode = 'stand'; fig.mug = true; }
    var T2 = { room: [115, SY + 420], directory: [520, SY + 340], subway: [676, SY + 420], coffee: [819, SY + 432] }[streetAct || streetTarget];
    if (T2){ fig.look = { x: T2[0], y: T2[1] }; fig.surprise = !streetAct; if (fig.mode !== 'walk'){ fig.mode = 'point'; fig.face = T2[0] < fig.x ? -1 : 1; fig.mug = false; fig.umbrella = false; } }
    if (look && fig.mode === 'stand') fig.smile = true;
    return fig;
  }

  /* ================= the subway: mezzanine, platform, the ride, arrival ================= */
  function drawMezz(){
    var T = I.T; ctx.save(); ctx.translate(0, RY);
    S([[WL, 470], [560, 470]], 2.2); S([[WL, 760], [WR, 760]], 2.6); earth(763, 830); ctx.fillStyle = COL.paper; ctx.fillRect(95, 763, 250, 70);
    earth(403, 470); ctx.fillStyle = COL.paper; ctx.fillRect(585, 403, 220, 70);
    tiles(Math.max(WL, -600), 480, 560 - Math.max(WL, -600), 280);
    WASH(300, 605, 170, 95, COL.sun, .2, 14); R(150, 520, 300, 170, 2.4, COL.paper); TX('N  —  notes in progress', 300, 550, 22);
    var st = [[190, 650], [260, 610], [330, 630], [410, 585]]; S(st, 5, 1, COL.pop); st.forEach(function(p, i){ O(p[0], p[1], 8, 2, COL.paper); TX(String(i + 1), p[0], p[1] - 14, 18); });
    for (var i = 0; i < 3; i++){ var tx = 580 + i * 60; R(tx, 704, 16, 56, 2, COL.paper); S([[tx + 16, 724], [tx + 36, 718]], 2.2); }
    var cx = -120, cy = 560; O(cx, cy, 30, 2.2, COL.paper); var mm = T / 60 * 6.283; Ln(cx, cy, cx + Math.sin(mm) * 22, cy - Math.cos(mm) * 22, 1.8); Ln(cx, cy, cx + Math.sin(mm / 12) * 14, cy - Math.cos(mm / 12) * 14, 2.6);
    stairs(600, 400, 780, 760, 12);
    ctx.restore();
  }
  function drawPlat(x){
    ctx.save(); ctx.translate(0, RY);
    var t = x >= 1720 ? 1 : seg(x, 1330, 1720), tx = t < .35 ? 1400 : lerp(1400, 30, ease(seg(t, .35, .7))), door = t > .74;
    S([[WL, 830], [WR, 830]], 2.2); tiles(WL, 840, WR - WL, 150);
    for (var cx = Math.floor(WL / 340) * 340 + 60; cx < WR; cx += 340){ S([[cx, 830], [cx, 1130]], 2.4); S([[cx + 14, 830], [cx + 14, 1130]], 1.6); }
    Ln(330, 830, 330, 860, 1.6); Ln(470, 830, 470, 860, 1.6); R(300, 860, 200, 36, 2.2, COL.paper); TX('RESEARCH  ↓', 400, 886, 22);
    if (tx < WR + 40){ var ty = 980, tw = 640, i;
      if (!door && tx > -20 && tx < 1300) for (i = 0; i < 6; i++) Ln(tx + tw + 20 + i * 12, ty + 30 + i * 18, tx + tw + 80 + i * 20, ty + 30 + i * 18, 1.4, .6);
      WASH(tx + tw / 2, ty + 80, tw / 2 + 10, 70, COL.rose, .3, 15); ctx.fillStyle = COL.paper; ctx.globalAlpha = .55; ctx.fillRect(tx, ty, tw, 150); ctx.globalAlpha = 1;
      S([[tx + 20, ty], [tx + tw - 20, ty], [tx + tw, ty + 20], [tx + tw, ty + 150], [tx, ty + 150], [tx, ty + 20], [tx + 20, ty]], 2.6);
      for (i = 0; i < 5; i++) R(tx + 40 + i * 120, ty + 26, 70, 44, 2, COL.paper);
      [170, 410].forEach(function(d){ var g = door ? 18 : 0; R(tx + d - g, ty + 16, 30, 130, 2, COL.paper); R(tx + d + 30 + g, ty + 16, 30, 130, 2, COL.paper); });
      O(tx + tw - 40, ty + 52, 17, 2, COL.paper); TX('N', tx + tw - 40, ty + 60, 24); }
    S([[WL, 1130], [WR, 1130]], 3); for (var k = Math.floor(WL / 24) * 24; k < WR; k += 24) Ln(k, 1133, k + 12, 1133, 2, .8); earth(1136, 1220);
    stairs(110, 760, 330, 1130, 12);
    ctx.restore();
  }
  /* the route, in order. New Delhi to New York was a flight. */
  var STOPS = [['New Delhi', 'city'], ['flight', 'air'], ['Long Island', 'city'], ['Manhattan', 'city'], ['Madison', 'city'], ['Portland', 'city']];
  function city(n, x, b){
    var T = I.T; ctx.save(); ctx.translate(x, b);
    if (n === 'New Delhi'){ WASH(0, -80, 90, 80, COL.sun, .3, 21); R(-60, -150, 120, 18, 2); S([[-50, 0], [-50, -132], [50, -132], [50, 0]], 2.4); S([[-24, 0], [-24, -70], [-14, -92], [0, -98], [14, -92], [24, -70], [24, 0]], 2.2); var k = Math.sin(T * 2) * 6; S([[110, -170 + k], [124, -150 + k], [110, -130 + k], [96, -150 + k], [110, -170 + k]], 1.8); }
    else if (n === 'flight'){ WASH(0, -90, 200, 80, COL.sky, .35, 27);
      for (var c = 0; c < 4; c++){ var cx = -180 + c * 110 - ((T * 40) % 110), cy = -150 + (c % 2) * 50; S([[cx, cy], [cx + 18, cy - 14], [cx + 44, cy - 18], [cx + 70, cy - 6], [cx + 92, cy], [cx, cy]], 1.6, .8); }
      S([[-60, -96], [50, -96], [70, -88], [50, -80], [-60, -80], [-70, -88], [-60, -96]], 2.4); S([[-10, -96], [10, -126], [24, -126], [14, -96]], 2); S([[-10, -80], [12, -54], [26, -54], [14, -80]], 2); S([[-58, -96], [-66, -112], [-54, -112], [-46, -96]], 1.8);
      for (var wnd = 0; wnd < 5; wnd++) O(-34 + wnd * 14, -89, 2.2, 1.1);
      ctx.restore(); TX('New Delhi → New York, by air', x, b + 40, 20); return; }
    else if (n === 'Long Island'){ WASH(0, -60, 150, 70, COL.rose, .26, 23); [[-140, 0], [-70, 0]].forEach(function(p){ S([[p[0], 0], [p[0], -40], [p[0] + 25, -64], [p[0] + 50, -40], [p[0] + 50, 0]], 2); R(p[0] + 18, -24, 14, 24, 1.4); }); R(10, -90, 130, 90, 2.2, COL.paper); for (var w = 0; w < 4; w++) R(22 + w * 30, -70, 16, 18, 1.4); Ln(75, -90, 75, -130, 1.8); S([[75, -130], [100, -122], [75, -114]], 1.6); TX('high school', 75, -100, 13); }
    else if (n === 'Manhattan'){ WASH(-20, -120, 170, 120, COL.sky, .28, 24); [[-160, -120], [-120, -190], [-80, -140], [-40, -240], [0, -170], [40, -210], [80, -130], [120, -180]].forEach(function(p){ S([[p[0], 0], [p[0], p[1]], [p[0] + 36, p[1]], [p[0] + 36, 0]], 2); for (var wy = p[1] + 14; wy < -10; wy += 22) Ln(p[0] + 8, wy, p[0] + 28, wy, 1, .5); }); S([[120, -180], [120, -196], [148, -196], [148, -180]], 1.8); S([[118, -196], [134, -210], [150, -196]], 1.8); R(-150, -30, 70, 22, 1.8, COL.paper); TX('135 St', -115, -14, 14); }
    else if (n === 'Madison'){ WASH(0, -80, 120, 80, COL.rose, .28, 25); S([[-90, 0], [-90, -60], [90, -60], [90, 0]], 2.2); S([[-40, -60], [-40, -100], [40, -100], [40, -60]], 2); S([[-38, -100], [-30, -130], [-14, -148], [0, -152], [14, -148], [30, -130], [38, -100]], 2.2); Ln(0, -152, 0, -176, 1.8); }
    else { WASH(-40, -80, 170, 90, COL.leaf, .28, 26); S([[-170, 0], [-70, -170], [30, 0]], 2.4); S([[-102, -116], [-88, -104], [-76, -116], [-62, -106], [-48, -116]], 1.6); for (var i = 0; i < 4; i++) S([[80, -30 - i * 30], [60, -i * 30], [100, -i * 30], [80, -30 - i * 30]], 1.8); S([[110, 0], [150, -60], [200, -70], [250, -60], [290, 0]], 2); }
    ctx.restore(); TX(n, x, b + 40, 24);
  }
  function drawRide(x){
    var T = I.T, t = x >= 2920 ? 1 : ease(seg(x, 1750, 2890)), inRide = x >= 1720 && x < 2920, sway = inRide && !still() ? Math.sin(T * 2.4) : 0;
    ctx.save(); ctx.translate(sway * 1.5, RY);
    var top = 1260, fl = 1600;
    H(WL, top - 30, WR - WL, fl - top + 90, 22, .12);
    ctx.fillStyle = COL.paper; ctx.fillRect(20, top, 760, fl - top + 30); S([[20, top + 30], [60, top], [740, top], [780, top + 30], [780, fl + 30], [20, fl + 30], [20, top + 30]], 2.6);
    var wins = [[70, top + 60, 180, 150], [310, top + 60, 180, 150], [550, top + 60, 180, 150]];
    ctx.save(); ctx.beginPath(); wins.forEach(function(w){ ctx.rect(w[0], w[1], w[2], w[3]); }); ctx.clip();
    var span = 780, off = -t * span * (STOPS.length - 1) + 400;
    STOPS.forEach(function(st, i){ var cx = off + i * span; if (cx > -300 && cx < 1100) city(st[0], cx, top + 190); });
    ctx.restore(); wins.forEach(function(w){ R(w[0], w[1], w[2], w[3], 2.4); });
    for (var i = 0; i < 6; i++){ var hx = 110 + i * 120, a = sway * .25; Ln(hx, top + 18, hx + Math.sin(a) * 24, top + 40, 1.4); O(hx + Math.sin(a) * 30, top + 48, 8, 1.6); }
    R(60, fl - 58, 680, 22, 2.2, COL.paper); S([[270, top + 10], [270, fl]], 2); S([[530, top + 10], [530, fl]], 2); S([[20, fl], [780, fl]], 2.4);
    /* the route strip over the doors: a dashed arc where it was a flight */
    var rx0 = 150, rx1 = 650, ry = top + 236, last = STOPS.length - 1, pos = function(i){ return rx0 + (rx1 - rx0) * i / last; };
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pos(0), ry); ctx.quadraticCurveTo(pos(1), ry - 34, pos(2), ry); ctx.stroke(); ctx.restore();
    S([[pos(2), ry], [rx1, ry]], 3, 1, COL.pop);
    STOPS.forEach(function(st, i){ if (st[1] === 'air'){ TX('✈', pos(i), ry - 22, 16); return; } var here = Math.round(t * last) === i; O(pos(i), ry, 6, 2, here ? COL.ink : COL.paper); TX(st[0], pos(i), ry + (i % 2 ? 44 : 28), 14); });
    ctx.restore();
    if (inRide){ var fig = { x: 400 + sway * 2, y: RF - 34, mode: 'sit', seat: 22, look: { x: 400, y: RT + 150 }, smile: true, face: 1 }; FIG(fig); }
  }
  function drawNow(x){
    ctx.save(); ctx.translate(0, RY);
    earth(1660, 1790); S([[WL, 1790], [WR, 1790]], 2.2); tiles(WL, 1800, 760 - WL, 200);
    WASH(400, 1850, 200, 40, COL.sun, .3, 16); Ln(230, 1790, 230, 1824, 1.6); Ln(570, 1790, 570, 1824, 1.6); R(200, 1824, 400, 52, 2.4, COL.paper); TX('PORTLAND · NOW', 400, 1862, 30);
    /* the escalator up to the street and TriMet */
    ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.moveTo(760, 2020); ctx.lineTo(980, 1730); ctx.lineTo(1040, 1730); ctx.lineTo(1040, 2020); ctx.closePath(); ctx.fill();
    S([[740, 2020], [760, 2020], [980, 1730], [1060, 1730]], 2.4); S([[740, 1974], [760, 1974], [980, 1684], [1060, 1684]], 1.8);
    var T = I.T; for (var k = 0; k < 12; k++){ var q = ((k / 12) + (still() ? 0 : T * .08)) % 1, ex = lerp(760, 980, q), ey = lerp(2020, 1730, q); Ln(ex, ey, ex + 18, ey, 1.4, .7); }
    R(830, 1640, 150, 40, 2.2, COL.paper); TX('↑ TRIMET', 905, 1667, 18, 'center', MONO);
    S([[WL, 2020], [WR, 2020]], 3); earth(2024, 2300);
    ctx.restore();
  }

  /* ================= TriMet: the streetcar along the Willamette, back to South Waterfront ================= */
  function drawStreetcar(x){
    var T = I.T, p = seg(x, 3560, 4080), go = ease(p), off = -go * 1900, nt = night();
    ctx.save(); ctx.translate(0, SC);
    sky(-200, 470);
    if (nt){ WASH(820, 96, 46, 46, COL.sun, .28, 6); O(820, 96, 30, 2.2, COL.paper); }
    /* the far bank slides past: downtown, then the bridges, then South Waterfront's towers */
    ctx.save(); ctx.translate(off * .35, 0);
    for (var b = 0; b < 26; b++){ var bx = -200 + b * 90, bh = 90 + ((b * 37) % 120); R(bx, 330 - bh, 50, bh, 1.4, COL.paper); for (var wy = 330 - bh + 12; wy < 322; wy += 18) Ln(bx + 8, wy, bx + 42, wy, 1, .35); }
    ctx.restore();
    ctx.save(); ctx.translate(off * .6, 0);
    WASH(1000, 360, 2600, 26, COL.sky, .32, 17);
    for (var wv = 0; wv < 40; wv++){ var wx = -300 + wv * 80; S([[wx, 362 + (wv % 3) * 6], [wx + 10, 359 + (wv % 3) * 6], [wx + 20, 362 + (wv % 3) * 6]], 1.2, .6); }
    /* a cable-stayed bridge over the river */
    var tb = 1250; S([[tb - 300, 340], [tb + 300, 340]], 2.4); S([[tb - 60, 340], [tb - 60, 180]], 2.6); S([[tb + 60, 340], [tb + 60, 180]], 2.6);
    for (var c2 = 0; c2 < 6; c2++){ Ln(tb - 60, 190 + c2 * 8, tb - 260 + c2 * 30, 340, 1, .7); Ln(tb + 60, 190 + c2 * 8, tb + 260 - c2 * 30, 340, 1, .7); }
    ctx.restore();
    /* poles and the overhead wire, close by */
    S([[WL, 250], [WR, 250]], 1.4, .8);
    for (var pl = 0; pl < 20; pl++){ var px = ((pl * 240 + off) % 2400 + 2400) % 2400 - 400; Ln(px, 250, px, 468, 2, .9); Ln(px, 256, px + 30, 256, 1.6); }
    /* the platform at South Waterfront, under the tram */
    var arrive = seg(p, .7, 1), sx = lerp(1300, 60, ease(arrive));
    if (arrive > 0){ R(sx, 380, 300, 20, 2, COL.paper); Ln(sx + 20, 400, sx + 20, 468, 2); Ln(sx + 280, 400, sx + 280, 468, 2); R(sx + 40, 330, 220, 30, 2, COL.paper); TX('SOUTH WATERFRONT · AERIAL TRAM', sx + 150, 351, 12, 'center', MONO); Ln(sx + 40, 300, sx + 250, 200, 1.4, .8); Ln(sx + 40, 308, sx + 250, 208, 1.4, .8); }
    /* the rails and the streetcar */
    S([[WL, 468], [WR, 468]], 2.6); for (var tie = 0; tie < 40; tie++){ var tx2 = ((tie * 40 + off) % 1600 + 1600) % 1600 - 300; Ln(tx2, 470, tx2 + 14, 476, 1.6, .6); } H(WL, 478, WR - WL, 80, 12, .16);
    var bob = still() ? 0 : Math.sin(T * 9) * (p > 0 && p < 1 ? .8 : 0);
    ctx.save(); ctx.translate(0, bob);
    WASH(500, 400, 230, 60, COL.leaf, .3, 18);
    ctx.fillStyle = COL.paper; ctx.fillRect(280, 336, 440, 122);
    S([[300, 336], [700, 336], [722, 360], [722, 458], [278, 458], [278, 360], [300, 336]], 2.6);
    S([[470, 336], [480, 290], [520, 290], [530, 336]], 1.8); Ln(500, 290, 520, 252, 1.6);
    for (var wn = 0; wn < 5; wn++) R(300 + wn * 82, 352, 60, 42, 1.8, COL.paper);
    R(612, 352, 40, 96, 1.8, COL.paper); TX('TRIMET', 400, 434, 15, 'center', MONO);
    if (x <= 4080){ O(342, 374, 9, 1.8, COL.paper); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(345, 374, 1.5, 0, 6.3); ctx.arc(349, 374, 1.5, 0, 6.3); ctx.fill(); S([[332, 370], [334, 363], [342, 361], [350, 363], [352, 370]], 1.6); }
    O(330, 462, 10, 2, COL.paper); O(670, 462, 10, 2, COL.paper);
    ctx.restore();
    ctx.restore();
  }

  /* ================= OHSU: the sky bridge from the tram to the room ================= */
  function drawHall(x){
    var T = I.T, open = cl((x - 5240) / 60, 0, 1);
    ctx.save(); ctx.translate(0, HY);
    WASH(500, 250, 700, 260, COL.tint, .9, 37);
    S([[WL, 180], [WR, 180]], 2.4); S([[WL, 500], [WR, 500]], 2.6); H(WL, 504, WR - WL, 80, 12, .16);
    /* windows onto Portland, with the tram cables outside */
    for (var w = 0; w < 4; w++){ var wx = 150 + w * 170; WASH(wx + 70, 320, 70, 80, I.phase() === 'night' ? COL.night : COL.sky, .3, 38 + w); R(wx, 230, 140, 180, 2.2, null);
      ctx.save(); ctx.beginPath(); ctx.rect(wx + 2, 232, 136, 176); ctx.clip();
      for (var b = 0; b < 5; b++) R(wx + 10 + b * 26, 340 - (b * 17) % 60, 18, 80, 1.2, COL.paper);
      Ln(wx, 300 + w * 10, wx + 140, 270 + w * 10, 1.2, .7); ctx.restore(); }
    /* where you came from, and where you are going */
    R(20, 300, 80, 200, 2.2, COL.paper); R(24, 270, 72, 24, 1.8, COL.paper); TX('← TRAM', 60, 287, 12, 'center', MONO);
    R(880, 300, 100, 200, 2.4, COL.paper); if (open){ ctx.fillStyle = COL.ink; ctx.globalAlpha = .7; ctx.fillRect(880, 300, open * 40, 200); ctx.globalAlpha = 1; } O(966, 400, 5, 1.6, COL.sun);
    R(888, 266, 84, 24, 1.8, COL.paper); TX('ROOM', 930, 283, 13, 'center', MONO);
    ctx.restore();
  }

  /* ---------- tags over the scene, and the room's buttons ---------- */
  var tags = [], dirLines = [];
  function tag(k, label, wx, wy, href, zone){
    var el = document.createElement(href ? 'a' : 'button'); el.className = 'tag-in'; el.textContent = label; if (href) el.href = href; else el.type = 'button';
    el.dataset.k = k; hot.appendChild(el); var t = { el: el, k: k, x: wx, y: wy, zone: zone }; tags.push(t);
    el.addEventListener('pointerenter', function(){ streetTarget = k; }); el.addEventListener('pointerleave', function(){ streetTarget = null; });
    el.addEventListener('focus', function(){ streetTarget = k; }); el.addEventListener('blur', function(){ streetTarget = null; });
    return el;
  }
  var DIRECTORY = (hot && hot.dataset.directory) || '/directory/';
  if (hot){
    tag('room', 'Tram up to the room ↑', 115, SY + 372, null, 'street').addEventListener('click', function(){ streetAct = 'room'; goTo(HASH.room); setTimeout(function(){ streetAct = null; }, 900); });
    tag('directory', 'Directory', 520, SY + 262, DIRECTORY, 'street');
    tag('subway', 'Down to the subway ↓', 676, SY + 350, null, 'street').addEventListener('click', function(){ streetAct = 'subway'; goTo(HASH.notes); setTimeout(function(){ streetAct = null; }, 900); });
    tag('coffee', 'Grab a coffee', 819, SY + 366, null, 'street').addEventListener('click', function(){ streetAct = 'coffee'; openPanel('coffee'); setTimeout(function(){ streetAct = null; }, 1200); });
    tag('escalator', 'Up to TriMet ↑', 905, RY + 1630, null, 'portland').addEventListener('click', function(){ goTo(HASH.streetcar); });
    tag('doorout', 'Out the door →', 1090 * ROOMK, 150 * ROOMK + ROOMY, null, 'room').addEventListener('click', function(){ goTo(HASH.tramdown); });
    tag('roomdoor', 'Into the room →', 930, HY + 250, null, 'hall').addEventListener('click', function(){ goTo(HASH.room); });

    DIR.forEach(function(n, j){ var a = document.createElement('a'); a.className = 'dir-line'; a.href = DIRECTORY + '#' + DIR_IDS[j]; a.setAttribute('aria-label', 'Directory: ' + n); hot.appendChild(a); dirLines.push(a);
      a.addEventListener('pointerenter', function(){ streetTarget = 'directory'; }); a.addEventListener('pointerleave', function(){ streetTarget = null; }); });
    HOTS.forEach(function(hs){ var b = document.createElement('button'); b.type = 'button'; b.className = 'hot'; b.setAttribute('aria-label', 'Open ' + hs.label); hs.btn = b; hot.appendChild(b);
      b.addEventListener('mouseenter', function(){ roomHover = hs; }); b.addEventListener('mouseleave', function(){ if (roomHover === hs) roomHover = null; });
      b.addEventListener('focus', function(){ roomHover = hs; }); b.addEventListener('blur', function(){ if (roomHover === hs) roomHover = null; });
      b.addEventListener('click', function(){ roomGo(hs); }); });
  }
  function placeTags(zone){
    tags.forEach(function(t){ var p = toScreen(t.x, t.y), on = t.zone === zone.id && p[1] > 40 && p[1] < ch + 20 && !I.plain();
      var half = (t.el.offsetWidth || 120) / 2; t.el.style.left = Math.max(half + 6, Math.min(cw - half - 6, p[0])) + 'px'; t.el.style.top = p[1] + 'px'; t.el.style.visibility = on ? 'visible' : 'hidden'; });
    dirLines.forEach(function(a, j){ var p = toScreen(444, SY + 299 + j * 14), q = toScreen(596, SY + 312 + j * 14); a.style.left = p[0] + 'px'; a.style.top = p[1] + 'px'; a.style.width = (q[0] - p[0]) + 'px'; a.style.height = (q[1] - p[1]) + 'px'; a.style.visibility = zone.id === 'street' ? 'visible' : 'hidden'; });
    HOTS.forEach(function(hs){ var a = roomToWorld(hs.r[0], hs.r[1]), b = roomToWorld(hs.r[0] + hs.r[2], hs.r[1] + hs.r[3]), p = toScreen(a[0], a[1]), q = toScreen(b[0], b[1]);
      hs.btn.style.left = p[0] + 'px'; hs.btn.style.top = p[1] + 'px'; hs.btn.style.width = (q[0] - p[0]) + 'px'; hs.btn.style.height = (q[1] - p[1]) + 'px'; hs.btn.style.visibility = zone.id === 'room' ? 'visible' : 'hidden'; });
  }

  /* ---------- panels: one per stop, and the room's detail panel ---------- */
  var zonePanels = [].slice.call(document.querySelectorAll('[data-zone-panel]'));
  var panel = document.getElementById('panel'), panelClose = document.getElementById('panelClose');
  function openPanel(id){
    if (!panel) return;
    panel.querySelectorAll('section[data-c]').forEach(function(sec){ sec.hidden = sec.dataset.c !== id; });
    panel.classList.add('open'); panel.scrollTop = 0;
    var h = panel.querySelector('section:not([hidden]) h2'); if (h){ h.setAttribute('tabindex', '-1'); setTimeout(function(){ h.focus({ preventScroll: true }); }, 60); }
  }
  function closePanel(){ if (!panel) return; panel.classList.remove('open'); roomActive = null; hero.act = null; }
  if (panelClose) panelClose.addEventListener('click', closePanel);
  addEventListener('keydown', function(e){ if (e.key === 'Escape' && panel && panel.classList.contains('open') && !document.querySelector('dialog[open]')) closePanel(); });
  function roomGo(hs){ roomActive = hs; hero.target = hs.stand; hero.act = hs.act; hero.antic = still() ? 0 : .18; openPanel(hs.id); }
  document.querySelectorAll('[data-open-panel]').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); openPanel(b.dataset.openPanel); }); });

  /* ---------- frame ---------- */
  var last = 0, curZone = null, hashTimer = null;
  function frame(now){
    if (I.plain()){ location.replace(DIRECTORY); return; }
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    I.tick(now); stepHero(dt);
    var xr = wrap(u);
    if (xr >= 5350 && xr < 5450 && !roomActive){ hero.x = lerp(-60, 150, ease(seg(xr, 5360, 5450))); hero.mode = xr < 5450 ? 'walk' : 'stand'; hero.ph = xr * .1; hero.face = 1; hero.target = null; }
    if (xr >= 5880 && xr < 6050){ if (roomActive) closePanel(); hero.target = null; hero.x = lerp(150, 1120, ease(seg(xr, 5880, 6020))); hero.mode = 'walk'; hero.ph = xr * .1; hero.face = 1; }
    u = still() ? ut : lerp(u, ut, .14); if (Math.abs(u - ut) < .3) u = ut;
    var x = wrap(u), c = size(x), zone = zoneAt(x);
    I.use(ctx); screen(); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, cw, ch);
    world();
    var zid = zone.id;
    if (zid === 'room') drawRoom();
    else if (zid === 'hall') drawHall(x);
    else if (zid === 'streetcar') drawStreetcar(x);
    else {
      if (zid === 'tram' || zid === 'tramdown' || (zid === 'street' && vis(500, 1990))) drawTram(zid === 'tram' ? 1 - ease(seg(x, 4300, 4900)) : zid === 'tramdown' ? ease(seg(x, 6100, 6560)) : 1);
      if (vis(1300, 2100)) drawStreet();
      if (vis(1950, 2900)) drawMezz();
      if (vis(2300, 2830)) drawPlat(x);
      if (vis(2800, 3240)) drawRide(x);
      if (vis(3200, 3900)) drawNow(x);
    }
    var f = c.fig;
    if (zid === 'street' && !f){ var mm = I.lookIn(cv, 0, 0, 0, 0, 1); f = streetFigure(mm ? { x: camX + mm.x / s, y: camTop + mm.y / s } : null); }
    if (f && !f.tram && f.alpha !== 0) FIG(f);
    /* weather in front, across the screen, outdoors only */
    screen();
    if (zone.id === 'street' || zone.id === 'tram' || zone.id === 'tramdown' || zone.id === 'streetcar'){
      var kind = WX ? WX.kind : '', T = I.T, slant = 4 + (WX ? Math.min(1, WX.wind / 25) : .2) * 10, rainN = { drizzle: 90, rain: 190, storm: 240 }[kind] || 0;
      for (var d = 0; d < rainN; d++){ var qx = Math.abs((Math.sin(d * 12.9) * 43758.5) % 1), qy = Math.abs((Math.sin(d * 78.2) * 24634.6) % 1), rx = qx * (cw + 60) - 30, ry = ((qy * (ch + 40) + (still() ? 0 : T * (kind === 'drizzle' ? 300 : 560) * (.85 + qx * .3))) % (ch + 40)) - 30; Ln(rx, ry, rx - slant, ry + (kind === 'drizzle' ? 10 : 18), 1.1, .5); }
      if (kind === 'snow') for (var n = 0; n < 130; n++){ var hx = Math.abs((Math.sin(n * 91.7) * 43758.5) % 1), hy = Math.abs((Math.sin(n * 37.3) * 24634.6) % 1), sp = 26 + hx * 34, fx2 = ((hx * cw + (still() ? 0 : Math.sin(T * .8 + n) * 14)) % cw + cw) % cw, fy = ((hy * (ch + 20) + (still() ? 0 : T * sp)) % (ch + 20)) - 20; O(fx2, fy, 1.8 + hy * 1.6, 1, COL.paper); }
    }
    /* the seam of the loop: the door at the bottom of the subway opens into the room at the top */
    var wipe = wipeAt(x);
    if (wipe > 0){ ctx.fillStyle = COL.paper; ctx.globalAlpha = ease(wipe); ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1; }
    placeTags(zone);
    zonePanels.forEach(function(p){ var on = p.dataset.zonePanel.split(' ').indexOf(zone.id) > -1; p.classList.toggle('on', on); p.setAttribute('aria-hidden', String(!on)); p.inert = !on; });
    if (zone !== curZone){
      curZone = zone;
      if (loopNav) loopNav.querySelectorAll('button').forEach(function(b){ var here = b.dataset.z === zone.id; b.classList.toggle('here', here); if (here) b.setAttribute('aria-current', 'location'); else b.removeAttribute('aria-current'); });
      clearTimeout(hashTimer); hashTimer = setTimeout(function(){ try { history.replaceState(null, '', zone.id === 'street' ? location.pathname : '#' + zone.id); } catch (e) {} }, 600);
      if (zone.id !== 'room' && panel && panel.classList.contains('open') && roomActive) closePanel();
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('plainchange', function(){ if (I.plain()) location.replace(DIRECTORY); });
  if (I.plain()) location.replace(DIRECTORY); else requestAnimationFrame(frame);
  window.InkWorld = { goTo: goTo, openPanel: openPanel, stops: HASH };
})();
