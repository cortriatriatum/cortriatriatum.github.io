/* The home page world: one ink drawing of a loop through Portland that makes physical sense.
   Forward (scroll down, swipe up, the Next button, or the arrow keys):
     1 Street at South Waterfront (start): the intro, the directory board, the food cart, the station stairs.
     2 The room, inside the station: you come down the stairs into it; its objects are the sections.
     3 The platform: you walk out of the room's far door, the train comes in, you board.
     4 The train: the notes are the ad cards over the windows. It runs to Marquam Hill.
     5 Marquam Hill station: off the train and into the elevator, which climbs to OHSU.
     6 The OHSU lab: Research at the microscope, Education on the wall.
     7 The Aerial Tram down Marquam Hill, which lands on the street where you started.
   Backward runs it in reverse. Where you go through a door, stairs or an elevator, the page washes to paper
   and back. In the room and the lab you walk past each object in turn: the one you are at lights up, its label
   pops up, and the panel on the left shows what is in it. Next and Previous step object by object there, and
   stop by stop elsewhere; the stop list on the right jumps. Plain mode goes to /directory/. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, COL = I.COL;
  var MONO = '"JetBrains Mono",monospace';
  var cv = document.getElementById('world'); if (!cv) return;
  var ctx = cv.getContext('2d'), hot = document.getElementById('hot'), loopNav = document.getElementById('loopNav');
  var still = function(){ return I.reduce.matches; };
  var DIRECTORY = (hot && hot.dataset.directory) || '/directory/';

  /* ---------- the loop ---------- */
  /* The room and the lab are walked through object by object: a short way in, a dwell at each object
     (WALK units walking to it, DWELL units standing at it), then out the far door. Each object's own
     scroll position is filled in below as hs.at. The other stops are drawn against fixed ranges (d). */
  var WALK = 60, DWELL = 110, IN = 100, OUT = 150;
  var ROOM_HOTS = [
    { id: 'notes', label: 'Notebook · Notes', r: [270, 392, 130, 46], stand: 330, act: 'write', lookY: 420 },
    { id: 'dev', label: 'Laptop · Dev', r: [440, 376, 80, 62], stand: 470, act: 'point', lookY: 400 },
    { id: 'awards', label: 'Shelf · Awards', r: [560, 150, 210, 110], stand: 600, act: 'point', lookY: 200 },
    { id: 'contact', label: 'Mailbox · Contact', r: [760, 420, 90, 90], stand: 690, act: 'point', lookY: 460 },
    { id: 'work', label: 'Coat rack · Work & Service', r: [850, 200, 130, 410], stand: 1005, face: -1, act: 'point', lookY: 300 }
  ];
  var LAB_HOTS = [
    { id: 'research', label: 'Microscope · Research', r: [430, 280, 160, 160], stand: 430, act: 'peer' },
    { id: 'training', row: 2, label: 'BE · City College of New York', r: [610, 110, 70, 90], stand: 620, act: 'point', lookY: 150 },
    { id: 'training', row: 1, label: 'PhD · OHSU', r: [700, 96, 80, 104], stand: 720, act: 'point', lookY: 140 },
    { id: 'training', row: 0, label: 'MD · in progress', r: [800, 110, 70, 90], stand: 820, act: 'point', lookY: 150 }
  ];
  function walkLen(list){ return IN + list.length * (WALK + DWELL) + OUT; }
  var ZONES = [
    { id: 'street', n: 500, d: 0, at: 230, label: 'Street', next: 'Down to the station' },
    { id: 'room', n: walkLen(ROOM_HOTS), hots: ROOM_HOTS, label: 'The room', next: 'To the platform' },
    { id: 'platform', n: 500, d: 1150, at: 180, label: 'Platform', next: 'Board the train' },
    { id: 'train', n: 850, d: 1650, at: 150, label: 'Train', next: 'Off at Marquam Hill' },
    { id: 'hill', n: 450, d: 2500, at: 140, label: 'Marquam Hill', next: 'Elevator up to OHSU' },
    { id: 'lab', n: walkLen(LAB_HOTS), hots: LAB_HOTS, label: 'OHSU lab', next: 'Aerial Tram down' },
    { id: 'tram', n: 700, d: 3600, at: 300, label: 'Aerial Tram', next: 'Back to the street' }
  ];
  var LEN = 0, SEAMS = [];
  ZONES.forEach(function(z){ z.a = LEN; z.b = LEN += z.n;
    if (z.hots){ z.hots.forEach(function(hs, i){ hs.at = z.a + IN + i * (WALK + DWELL) + WALK + DWELL / 2; hs.zone = z.id; }); z.stop = z.hots[0].at; }
    else z.stop = z.a + z.at; });
  SEAMS = [ZONES[1].a, ZONES[2].a, ZONES[4].a, ZONES[5].a];   // stairs, a door, off the train, the elevator
  var Z = {}; ZONES.forEach(function(z){ Z[z.id] = z; });
  /* the drawing position for the fixed-range stops: street 0–500, platform 1150–1650, train 1650–2500,
     Marquam Hill 2500–2950, tram 3600–4300 */
  function dx(x){ var z = zoneAt(x); return z.hots ? x : z.d + (x - z.a); }
  var HASH = {}; ZONES.forEach(function(z){ HASH[z.id] = z.stop; });
  HASH.notes = HASH.train; HASH.research = LAB_HOTS[0].at; HASH.subway = HASH.room;
  var u = HASH.street, ut = u;
  function wrap(x){ return ((x % LEN) + LEN) % LEN; }
  function zoneAt(x){ x = wrap(x); for (var i = 0; i < ZONES.length; i++) if (x >= ZONES[i].a && x < ZONES[i].b) return ZONES[i]; return ZONES[0]; }
  function goTo(stop, instant){ var cur = wrap(ut), d = stop - cur; if (d > LEN / 2) d -= LEN; if (d < -LEN / 2) d += LEN; ut += d; if (instant || still()) u = ut; }
  function goForward(stop){ var cur = wrap(ut), d = stop - cur; if (d <= 0) d += LEN; ut += d; if (still()) u = ut; }
  function goBack(stop){ var cur = wrap(ut), d = stop - cur; if (d >= 0) d -= LEN; ut += d; if (still()) u = ut; }
  var h0 = (location.hash || '').slice(1); if (HASH[h0] != null) u = ut = HASH[h0];
  function seg(x, a, b){ return cl((x - a) / (b - a), 0, 1); }

  /* ---------- input ---------- */
  var panel = document.getElementById('panel');
  function scrollsInside(t, dy){
    for (var el = t; el && el !== document.body; el = el.parentElement){
      if (el.nodeType !== 1) continue; var cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
      if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
    }
    return false;
  }
  function blocked(){ return I.plain() || document.querySelector('dialog[open]') || (panel && panel.classList.contains('open') && innerWidth < 900); }
  addEventListener('wheel', function(e){ if (blocked() || scrollsInside(e.target, e.deltaY)) return; e.preventDefault(); var d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY; ut += cl(d, -150, 150) * .8; }, { passive: false });
  var ty = null;
  addEventListener('touchstart', function(e){ ty = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchmove', function(e){ if (ty == null || blocked()) return; var y = e.touches[0].clientY, dy = ty - y; if (scrollsInside(e.target, dy)){ ty = y; return; } e.preventDefault(); ut += dy * 1.6; ty = y; }, { passive: false });
  addEventListener('keydown', function(e){
    if (blocked() || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var k = e.key;
    if (k === 'ArrowDown') ut += 70; else if (k === 'ArrowUp') ut -= 70;
    else if (k === 'PageDown' || k === 'ArrowRight') goNext(); else if (k === 'PageUp' || k === 'ArrowLeft') goPrev();
    else return;
    e.preventDefault();
  });
  function zoneIndex(x){ return ZONES.indexOf(zoneAt(x)); }
  function stopsOf(z){ return z.hots ? z.hots.map(function(h){ return h.at; }) : [z.stop]; }
  function goNext(){ var i = zoneIndex(ut), x = wrap(ut), z = ZONES[i], st = stopsOf(z).filter(function(a){ return a > x + 20; }); goForward(st.length ? st[0] : ZONES[(i + 1) % ZONES.length].stop); }
  function goPrev(){ var i = zoneIndex(ut), x = wrap(ut), z = ZONES[i], st = stopsOf(z).filter(function(a){ return a < x - 20; }), p = ZONES[(i - 1 + ZONES.length) % ZONES.length], ps = stopsOf(p);
    goBack(st.length ? st[st.length - 1] : ps[ps.length - 1]); }
  /* where the Next button goes from here, in words */
  function nextWords(x){ var z = zoneAt(x), h = z.hots && z.hots.filter(function(a){ return a.at > x + 20; })[0]; return h ? h.label : z.next; }
  function prevWords(x){ var i = ZONES.indexOf(zoneAt(x)), z = ZONES[i], h = z.hots && z.hots.filter(function(a){ return a.at < x - 20; }).pop(); if (h) return h.label;
    var p = ZONES[(i - 1 + ZONES.length) % ZONES.length]; return p.hots ? p.hots[p.hots.length - 1].label : p.label; }

  /* ---------- the stop list, and Next / Previous ---------- */
  if (loopNav) ZONES.forEach(function(z){ var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.dataset.z = z.id; b.innerHTML = '<span class="dot"></span><span class="lb"></span>'; b.querySelector('.lb').textContent = z.label; b.setAttribute('aria-label', z.label); b.addEventListener('click', function(){ goTo(z.stop); }); li.appendChild(b); loopNav.appendChild(li); });
  var nextBtn = document.getElementById('goNext'), prevBtn = document.getElementById('goPrev');
  if (nextBtn) nextBtn.addEventListener('click', goNext);
  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  document.querySelectorAll('[data-goto-zone]').forEach(function(el){ el.addEventListener('click', function(e){ var z = el.dataset.gotoZone; if (HASH[z] != null){ e.preventDefault(); goTo(HASH[z]); } }); });

  /* ---------- weather, light ---------- */
  var WX = null, cap = document.getElementById('liveNow');
  function night(){ return I.phase() === 'night'; }
  function caption(){ if (!cap) return; var p = ['Portland, Oregon', I.pdxTime()]; if (WX){ p.push(WX.tempF + '°F'); p.push(I.WORDS[WX.kind]); } var sl = I.sunLine(); if (sl) p.push(sl); cap.textContent = p.join(' · '); }
  function load(){ I.weather().then(function(w){ WX = w; caption(); }); }
  load(); caption(); setInterval(function(){ load(); caption(); }, 60000);

  /* ---------- world layout (bands, top to bottom) ---------- */
  var K = 1000 / 1200;                         // interiors are drawn 1200 wide, shown 1000 wide
  var LAB_Y = 40, SY = 1500, G = SY + 468, ROOM_Y = 2300, PB = 3200, DS = 4400;
  var PLAT = PB + 470, RT = PB + 600, RF = PB + 940, DSG = DS + 470;
  var TRAM_A = { x: 860, y: 720 }, TOWER = { x: 612, y: 934 }, TRAM_B = { x: 110, y: 1890 };
  function cabin(p){ var k = .22; if (p < k){ var q = p / k; return { x: lerp(TRAM_A.x, TOWER.x, q), y: lerp(TRAM_A.y, TOWER.y, q) + 52 }; } var r = (p - k) / (1 - k); return { x: lerp(TOWER.x, TRAM_B.x, r), y: lerp(TOWER.y, TRAM_B.y, r) + 52 - r * 40 }; }
  var dpr = 1, cw = 0, ch = 0, s = 1, camX = 0, camTop = 0, vh = 600, vw = 1000, WL = -400, WR = 1400, reserveK = 1;

  function camFor(x){
    var nw = cw <= 900, F = function(w, n){ return nw ? n : w; }, z = zoneAt(x).id, f = null, top, fx = 500, t, c; x = dx(x);
    var streetTop = G - vh * F(.82, .5), roomTop = ROOM_Y + 300 - vh * F(.5, .36), labTop = LAB_Y + 260 - vh * F(.5, .36);
    if (z === 'street'){ top = streetTop; fx = 520; if (x > 380){ t = seg(x, 380, 495); f = { x: lerp(350, 746, ease(t)), y: G, mode: 'walk', ph: t * 12, face: 1 }; } }
    else if (z === 'room'){ top = roomTop; fx = walker('room', x).x * K; }
    else if (z === 'platform'){ t = seg(x, 1150, 1650); top = PLAT - vh * F(.66, .44); fx = 420;
      var w = seg(t, .04, .3); f = { x: lerp(60, 420, ease(w)), y: PLAT, mode: w > 0 && w < 1 ? 'walk' : 'stand', ph: w * 14, face: 1 };
      if (t > .3 && t < .7){ f.look = { x: 900, y: PLAT - 80 }; f.surprise = t > .45; }
      if (t > .8){ var k = seg(t, .8, .96); f.mode = 'walk'; f.x = lerp(420, 245, k); f.face = -1; f.ph = k * 6; f.alpha = 1 - seg(t, .92, 1); } }
    else if (z === 'train'){ top = (RT + RF) / 2 - vh * F(.5, .36); fx = 400; }
    else if (z === 'hill'){ t = seg(x, 2500, 2950); top = DSG - vh * F(.7, .46); fx = 500;
      var w2 = seg(t, .08, .7); f = { x: lerp(240, 800, ease(w2)), y: DSG, mode: w2 > 0 && w2 < 1 ? 'walk' : 'stand', ph: w2 * 22, face: 1, look: { x: 800, y: DSG - 150 } }; if (t > .8) f.alpha = 0; }
    else if (z === 'lab'){ top = labTop; fx = walker('lab', x).x * K; }
    else { t = seg(x, 3620, 4120); c = cabin(ease(t)); top = lerp(c.y - vh * F(.5, .34), streetTop, ease(seg(x, 4120, 4300))); fx = lerp(c.x, 520, seg(x, 4120, 4300)); f = { tram: c }; }
    return { top: top, fig: f, fx: fx };
  }
  function size(x){
    dpr = Math.min(2, devicePixelRatio || 1); cw = innerWidth; ch = innerHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var wide = cw > 900, z = zoneAt(x).id, interior = z === 'room' || z === 'lab';
    reserveK = lerp(reserveK, wide ? 1 : 0, .12);
    var reserve = wide ? Math.min(450, cw * .34) * reserveK : 0;
    s = wide ? Math.min((cw - reserve) / 1000, ch / 560) : Math.min(cw / 600, ch / 760);
    if (interior && wide) s = Math.min((cw - reserve) / 1020, ch / 600);
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
  function tiles(x, y, w, h){ var yy, xx, r; for (yy = y; yy < y + h; yy += 22) Ln(x, yy, x + w, yy, 1, .13); for (yy = y, r = 0; yy < y + h; yy += 22, r++) for (xx = x + (r % 2 ? 22 : 0); xx < x + w; xx += 44) Ln(xx, yy, xx, Math.min(yy + 22, y + h), 1, .13); }
  function sky(y0, y1){ var ph = I.phase(); WASH(500, (y0 + y1) / 2, 1500, (y1 - y0) / 2 + 200, ph === 'night' ? COL.night : COL.sky, ph === 'night' ? .3 : .2, 1); if (ph === 'golden' || ph === 'dusk' || ph === 'dawn') WASH(500, y1 - 80, 1300, 140, COL.rose, .22, 2); }

  /* ---------- interiors share a hero and labeled hotspots ---------- */
  var hover = null, active = null, here = null;
  /* where the walker is in an interior, from the scroll position alone */
  function walker(zid, x){
    var z = Z[zid], L = z.hots, p = x - z.a, x0 = zid === 'room' ? 150 : 200, i, a, w;
    if (p < IN) return { x: lerp(zid === 'room' ? 40 : 50, x0, seg(p, 0, IN)), mode: p < IN - 2 ? 'walk' : 'stand', ph: p * .14, face: 1, out: 0 };
    p -= IN;
    for (i = 0; i < L.length; i++){
      a = i ? L[i - 1].stand : x0;
      if (p < WALK){ w = ease(p / WALK); return { x: lerp(a, L[i].stand, w), mode: 'walk', ph: (lerp(a, L[i].stand, w)) * .05, face: L[i].stand >= a ? 1 : -1, near: L[i], out: 0 }; }
      p -= WALK;
      if (p < DWELL) return { x: L[i].stand, mode: L[i].act, face: L[i].face || 1, at: L[i], near: L[i], out: 0 };
      p -= DWELL;
    }
    w = seg(p, 0, OUT); a = L[L.length - 1].stand;
    return { x: lerp(a, 1120, ease(w)), mode: 'walk', ph: lerp(a, 1120, ease(w)) * .05, face: 1, out: seg(w, .25, .7), alpha: 1 - seg(w, .85, 1) };
  }
  function interiorY(z){ return z === 'room' ? ROOM_Y : LAB_Y; }
  function interiorFigure(wk){
    var P2 = 610, h = hover || wk.at, look = null;
    if (h) look = { x: h.r[0] + h.r[2] / 2, y: h.lookY || h.r[1] + h.r[3] / 2 };
    var f = { x: wk.x, y: P2, face: wk.face, mode: wk.mode, ph: wk.ph, look: look, smile: !!wk.at, surprise: !!hover && hover !== wk.at, alpha: wk.alpha };
    if (f.mode === 'write'){ f.mode = 'stand'; f.look = { x: 335, y: 420 }; }
    if (f.mode === 'peer'){ f.mode = 'stand'; f.lean = 6; f.look = { x: 510, y: 300 }; }
    if (f.alpha === 0) return;
    /* interiors are drawn closer: the same figure, scaled up about its feet */
    var ZM = 2.25; ctx.save(); ctx.translate(f.x, P2); ctx.scale(ZM, ZM); ctx.translate(-f.x, -P2);
    if (f.look) f.look = { x: f.x + (f.look.x - f.x) / ZM, y: P2 + (f.look.y - P2) / ZM };
    var pen = I.pen || function(){}; pen(1.25 / ZM); FIG(f); pen(1); ctx.restore();
  }
  function interiorShell(){
    WASH(600, 330, 660, 330, COL.tint, .9, 30);
    S([[-200, 610], [1400, 610]], 2.6); H(-200, 614, 1600, 60, 12, .18); S([[-200, 40], [1400, 40]], 2.2);
    [here, hover].forEach(function(h, j){ if (h && (j === 0 || h !== here)) WASH(h.r[0] + h.r[2] / 2, h.r[1] + h.r[3] / 2, h.r[2] * .62 + 8, h.r[3] * .56 + 8, COL.pop, j ? .14 : .24, 40 + j); });
  }
  function door(x, label, open){ var P = COL.paper; R(x, 180, 120, 430, 2.4, P); if (open){ ctx.fillStyle = COL.ink; ctx.globalAlpha = .7; ctx.fillRect(x, 180, open * 60, 430); ctx.globalAlpha = 1; } O(x + 22, 400, 6, 1.8, COL.sun); R(x + 4, 146, 112, 26, 1.8, P); TX(label, x + 60, 165, 12, 'center', MONO); }

  /* ================= 2 · the room, inside the station ================= */
  function drawRoom(x){
    var T = I.T, P = COL.paper, wk = walker('room', x), out = wk.out;
    ctx.save(); ctx.translate(0, ROOM_Y); ctx.scale(K, K);
    interiorShell();
    /* stairs down from the street on the left; the door to the platform on the right */
    S([[-40, 200], [40, 200], [40, 260], [90, 260], [90, 320], [140, 320], [140, 380], [190, 380], [190, 610]], 2.2); R(-30, 150, 150, 26, 1.8, P); TX('↑ STREET', 45, 169, 13, 'center', MONO);
    door(1060, 'PLATFORM →', out);
    /* a window onto the platform: trains go by */
    WASH(470, 140, 160, 70, COL.night, .18, 31); R(330, 70, 260, 150, 2.4, null); Ln(460, 70, 460, 220, 1.6);
    ctx.save(); ctx.beginPath(); ctx.rect(332, 72, 256, 146); ctx.clip(); tiles(332, 72, 256, 146);
    var tp = still() ? .5 : (T * .12) % 1.6; R(332 + tp * 600 - 300, 120, 240, 80, 2, COL.paper); for (var w = 0; w < 4; w++) R(332 + tp * 600 - 290 + w * 58, 134, 40, 26, 1.4, COL.sun); ctx.restore();
    /* the desk: notebook and laptop */
    WASH(420, 440, 220, 40, COL.sun, .22, 32);
    R(240, 436, 340, 14, 2.4, P); Ln(260, 450, 260, 610, 2.2); Ln(560, 450, 560, 610, 2.2);
    S([[280, 436], [290, 412], [380, 412], [386, 436]], 2.2); Ln(333, 414, 333, 436, 1.4, .6); for (var i = 0; i < 4; i++) Ln(290 + i * 9, 420 + i * 3, 320 + i * 6, 420 + i * 3, 1, .5);
    R(446, 428, 70, 8, 2, P); ctx.fillStyle = P; ctx.fillRect(454, 386, 54, 42); S([[452, 428], [456, 384], [510, 384], [510, 428]], 2.2);
    for (var k = 0; k < 3; k++){ var ww = still() ? 20 : 10 + ((T * 30 + k * 13) % 30); Ln(462, 396 + k * 9, 462 + ww, 396 + k * 9, 1.2, .7); }
    S([[250, 436], [252, 350], [290, 320]], 2); S([[280, 308], [306, 330], [320, 312], [292, 296], [280, 308]], 2); WASH(302, 360, 40, 50, COL.sun, .25, 33);
    /* the shelf of awards */
    ctx.save(); ctx.translate(-40, 0);
    R(600, 236, 210, 10, 2, P); Ln(620, 246, 628, 262, 1.6); Ln(790, 246, 782, 262, 1.6);
    S([[628, 236], [624, 206], [650, 206], [646, 236]], 2); O(637, 200, 10, 1.8, COL.sun); S([[670, 236], [670, 196], [700, 196], [700, 236]], 1.8); S([[722, 236], [730, 186], [750, 186], [758, 236]], 1.8); O(740, 176, 7, 1.6, COL.sun); R(770, 206, 30, 30, 1.6, COL.rose);
    ctx.restore();
    /* the mailbox */
    ctx.save(); ctx.translate(60, 0);
    Ln(745, 610, 745, 500, 2.4); R(700, 430, 90, 70, 2.2, P); S([[700, 446], [745, 424], [790, 446]], 2); R(728, 460, 34, 6, 1.4); TX('MAIL', 745, 492, 12, 'center', MONO);
    ctx.restore();
    /* the coat rack with badges */
    S([[935, 610], [935, 220]], 2.6); S([[905, 610], [935, 580], [965, 610]], 2.2); S([[935, 236], [905, 224]], 2); S([[935, 236], [965, 224]], 2);
    S([[935, 250], [900, 262], [892, 340], [915, 420], [955, 420], [978, 340], [970, 262], [935, 250]], 2.2); WASH(935, 330, 40, 80, COL.leaf, .25, 34);
    [[950, 300, 'OHSU'], [912, 330, 'EPIC'], [948, 366, 'CCNY']].forEach(function(b){ S([[b[0] + 10, b[1] - 26], [b[0] + 10, b[1]]], 1.2, .7); R(b[0], b[1], 22, 28, 1.6, P); TX(b[2], b[0] + 11, b[1] + 18, 7, 'center', MONO); });
    /* the figure: comes down the stairs, walks past each thing, out the far door */
    interiorFigure(wk);
    ctx.restore();
  }

  /* ================= 6 · the OHSU lab ================= */
  function drawLab(x){
    var P = COL.paper, wk = walker('lab', x), out = wk.out;
    ctx.save(); ctx.translate(0, LAB_Y); ctx.scale(K, K);
    interiorShell();
    /* the elevator you arrive by, and the way out to the tram */
    R(-20, 180, 140, 430, 2.4, P); Ln(50, 190, 50, 600, 1.8); R(4, 146, 102, 26, 1.8, P); TX('ELEVATOR', 55, 165, 12, 'center', MONO);
    door(1060, 'AERIAL TRAM →', out);
    /* a window onto Portland, with the tram cables */
    var nt = night(); WASH(225, 220, 110, 100, nt ? COL.night : COL.sky, .3, 35); R(120, 110, 210, 210, 2.4, null); Ln(225, 110, 225, 320, 1.6);
    ctx.save(); ctx.beginPath(); ctx.rect(122, 112, 206, 206); ctx.clip(); for (var b = 0; b < 6; b++) R(132 + b * 32, 240 - (b * 23) % 70, 22, 90, 1.2, P); Ln(122, 180, 328, 140, 1.2, .8); Ln(122, 186, 328, 146, 1.2, .8); ctx.restore();
    if (WX) TX('Portland · ' + WX.tempF + '°F', 225, 346, 16);
    /* the bench: microscope, flasks, a rack of tubes */
    WASH(560, 440, 260, 40, COL.leaf, .22, 36);
    R(380, 436, 440, 14, 2.4, P); Ln(400, 450, 400, 610, 2.2); Ln(800, 450, 800, 610, 2.2);
    R(456, 422, 90, 14, 2, P); S([[526, 422], [526, 350], [502, 322]], 2.4); R(492, 300, 22, 40, 2, P); S([[502, 300], [492, 276]], 2.2); R(478, 380, 60, 8, 1.8, P); O(534, 368, 7, 1.6, P);
    S([[620, 436], [626, 396], [626, 376], [636, 376], [636, 396], [648, 436], [620, 436]], 2); WASH(634, 420, 16, 12, COL.rose, .6, 37);
    S([[680, 436], [684, 380], [700, 380], [704, 436]], 2); WASH(692, 420, 12, 14, COL.sky, .6, 38);
    R(730, 410, 70, 26, 1.8, P); for (var tt = 0; tt < 5; tt++) Ln(740 + tt * 12, 410, 740 + tt * 12, 392, 2);
    /* the wall of diplomas: BE and PhD framed, the MD frame still waiting */
    R(610, 110, 70, 90, 2.2, P); R(618, 118, 54, 74, 1.2); O(645, 180, 6, 1.2, COL.rose); TX('BE', 645, 150, 15);
    R(700, 96, 80, 104, 2.2, P); R(708, 104, 64, 88, 1.2); O(740, 180, 6, 1.2, COL.rose); TX('PhD', 740, 142, 15);
    R(800, 110, 70, 90, 2.2, P); ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.4; ctx.strokeRect(808, 118, 54, 74); ctx.restore(); TX('MD', 835, 150, 15); TX('in progress', 835, 172, 11);
    interiorFigure(wk);
    ctx.restore();
  }

  /* ================= 7 · the Aerial Tram down Marquam Hill ================= */
  function drawTram(cp){
    var T = I.T, c = cabin(cp);
    sky(640, 1960);
    var hill = [[1100, 680], [980, 720], [900, 750], [760, 840], [640, 960], [540, 1100], [460, 1270], [400, 1430]];
    function hillPath(){ ctx.beginPath(); ctx.moveTo(hill[0][0], hill[0][1]); hill.forEach(function(q){ ctx.lineTo(q[0], q[1]); }); ctx.lineTo(1400, 1430); ctx.lineTo(1400, 680); ctx.closePath(); }
    ctx.fillStyle = COL.paper; hillPath(); ctx.fill(); S(hill, 2.2, .9);
    ctx.save(); hillPath(); ctx.clip(); H(380, 680, 1040, 760, 18, .12); ctx.restore();
    WASH(800, 1440, 700, 30, COL.paper, .9, 36);
    for (var t = 0; t < 11; t++){ var py = 790 + t * 58, px = lerp(900, 430, (py - 750) / 680) + 40 + (t * 53) % 160; if (py < 1400){ S([[px, py], [px - 10, py + 24], [px + 10, py + 24], [px, py]], 1.6, .8); Ln(px, py + 24, px, py + 30, 1.4, .8); } }
    R(800, 680, 150, 70, 2.4, COL.paper); R(820, 640, 110, 40, 2, COL.paper); TX('OHSU', 875, 667, 16, 'center', MONO);
    for (var w = 0; w < 4; w++) R(812 + w * 34, 698, 20, 22, 1.4, night() ? COL.sun : null);
    S([[590, 1010], [606, 940], [618, 940], [634, 1010]], 2.4); Ln(596, 985, 628, 985, 1.4); R(588, 930, 48, 12, 2, COL.paper);
    S([[TRAM_A.x, TRAM_A.y + 8], [TOWER.x, TOWER.y], [TRAM_B.x, TRAM_B.y - 8]], 1.4); S([[TRAM_A.x, TRAM_A.y + 16], [TOWER.x, TOWER.y + 8], [TRAM_B.x, TRAM_B.y]], 1.4);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.sin(T * 1.3) * (still() ? 0 : .025));
    Ln(0, -36, 0, -8, 2); O(0, -38, 5, 1.6, COL.paper);
    ctx.fillStyle = COL.paper; ctx.fillRect(-46, -8, 92, 58); S([[-40, -8], [40, -8], [46, 0], [46, 50], [-46, 50], [-46, 0], [-40, -8]], 2.4);
    R(-36, 2, 72, 24, 1.8, COL.sky); TX('TRAM', 0, 44, 11, 'center', MONO);
    O(-8, 16, 8, 1.8, COL.paper); S([[-16, 12], [-13, 5], [-8, 3], [-3, 5], [0, 12]], 1.6); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(-6, 16, 1.4, 0, 6.3); ctx.arc(-2, 16, 1.4, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  /* ================= 1 · the street at South Waterfront ================= */
  var DIR = ['Research', 'Notes', 'Education', 'Work & Service', 'Awards', 'Dev', 'Food recs', 'Contact'];
  var DIR_IDS = ['research', 'notes', 'education', 'work', 'awards', 'dev', 'food', 'contact'];
  var streetTarget = null, streetAct = null, dirLines = [];
  var BX = 410, BY = 230, BW = 220, BH = 190, LH = 18;            // the directory board, big enough to read
  function drawStreet(){
    var kind = WX ? WX.kind : 'cloudy', nt = night(), T = I.T, i, k;
    var wet = kind === 'drizzle' || kind === 'rain' || kind === 'storm', windy = WX ? Math.min(1, WX.wind / 25) : .2;
    var par = function(depth){ return (camTop - (G - vh * (cw <= 900 ? .5 : .82))) * (1 - depth) * .5; };
    ctx.save(); ctx.translate(0, SY);
    ctx.save(); ctx.translate(0, par(.05));
    if (nt){ for (i = 0; i < 40; i++){ var sx = (i * 137) % 1600 - 300, sy = (i * 71) % 330 - 60, tw = still() ? 1 : .5 + .5 * Math.sin(T * 2 + i); if (kind === 'clear' || kind === 'partly' || i % 3 === 0){ Ln(sx - 3, sy, sx + 3, sy, 1.2, tw); Ln(sx, sy - 3, sx, sy + 3, 1.2, tw); } } WASH(860, 96, 46, 46, COL.sun, .28, 6); O(860, 96, 30, 2.2, COL.paper); }
    else if (kind === 'clear' || kind === 'partly'){ var alt = cl(I.sunAlt(new Date()), 0, 30), sunY = lerp(300, 80, alt / 30); WASH(860, sunY, 70, 70, COL.sun, .42, 7); O(860, sunY, 32, 2.4, COL.paper); for (var r = 0; r < 12; r++){ var a = r / 12 * 6.283 + (still() ? 0 : T * .15); Ln(860 + Math.cos(a) * 44, sunY + Math.sin(a) * 44, 860 + Math.cos(a) * 60, sunY + Math.sin(a) * 60, 2); } }
    var nc = { clear: 0, partly: 2, cloudy: 6, fog: 3, drizzle: 5, rain: 6, snow: 5, storm: 6 }[kind] || 2;
    for (k = 0; k < nc; k++){ var cx = ((k * 283 + (still() ? 0 : T * (6 + windy * 14))) % 1700) - 450, cy = 60 + (k % 3) * 46, cs = 1 + (k % 2) * .5; ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.ellipse(cx + 62 * cs, cy - 10 * cs, 64 * cs, 18 * cs, 0, 0, 6.3); ctx.fill(); S([[cx, cy], [cx + 18 * cs, cy - 16 * cs], [cx + 48 * cs, cy - 22 * cs], [cx + 74 * cs, cy - 10 * cs], [cx + 98 * cs, cy - 16 * cs], [cx + 124 * cs, cy], [cx, cy]], 1.8); if (kind === 'storm' || kind === 'rain') H(cx + 10 * cs, cy - 14 * cs, 100 * cs, 12 * cs, 7, .35); }
    ctx.restore();
    ctx.save(); ctx.translate(0, par(.2)); if ((kind === 'clear' || kind === 'partly') && !nt){ S([[660, 300], [790, 140], [920, 300]], 2.4, .8); S([[742, 196], [760, 210], [776, 196], [792, 210], [808, 194], [826, 206]], 1.6, .75); } ctx.restore();
    ctx.save(); ctx.translate(0, par(.55));
    [[700, 236], [742, 200], [866, 226], [906, 206], [948, 248], [990, 222], [1034, 262]].forEach(function(b, n){ R(b[0], b[1], 36, 392 - b[1], 1.6, COL.paper); for (var wy = b[1] + 14; wy < 372; wy += 22){ if (nt && ((n * 7 + wy) % 3 === 0)){ ctx.fillStyle = COL.sun; ctx.globalAlpha = .7; ctx.fillRect(b[0] + 8, wy, 8, 9); ctx.fillRect(b[0] + 20, wy, 8, 9); ctx.globalAlpha = 1; } else Ln(b[0] + 8, wy + 4, b[0] + 28, wy + 4, 1, .4); } });
    WASH(804, 270, 26, 110, COL.rose, .5, 9); R(786, 150, 38, 242, 2, null); for (var bp = 168; bp < 380; bp += 20) Ln(792, bp, 818, bp, 1, .5);
    R(828, 128, 32, 264, 2, COL.paper); S([[828, 128], [844, 108], [860, 128]], 1.8); for (var wf = 146; wf < 380; wf += 18) Ln(834, wf, 854, wf, 1, .45);
    ctx.restore();
    ctx.save(); ctx.translate(0, par(.75)); WASH(500, 404, 1400, 26, COL.sky, .3, 8);
    for (var wv = 0; wv < 22; wv++){ var wx = ((wv * 97 + (still() ? 0 : T * 10)) % 1800) - 400; S([[wx, 406 + (wv % 3) * 6], [wx + 10, 403 + (wv % 3) * 6], [wx + 20, 406 + (wv % 3) * 6]], 1.2, .6); }
    S([[-400, 388], [1400, 388]], 2);
    if (kind === 'fog'){ for (var fg = 0; fg < 6; fg++){ var fx = ((fg * 300 + (still() ? 0 : T * 8)) % 1800) - 400; WASH(fx, 250 + fg * 30, 300, 26, COL.paper, .8, 10 + fg); } }
    ctx.restore();
    var GL = 468, on = function(k2){ return streetTarget === k2 || streetAct === k2; };
    S([[-1600, GL], [2600, GL]], 2.6); H(-1600, GL + 4, 4200, 300, 12, .16);
    if (on('tram')) WASH(115, 420, 90, 60, COL.pop, .2, 41);
    if (on('directory')) WASH(BX + BW / 2, BY + BH / 2, BW * .62, BH * .6, COL.pop, .16, 42);
    if (on('station')) WASH(746, 420, 90, 70, COL.pop, .2, 43);
    if (on('food')) WASH(891, 432, 70, 50, COL.pop, .2, 44);
    /* the Aerial Tram's lower terminal */
    R(40, 380, 150, 88, 2.2, COL.paper); S([[30, 380], [200, 380]], 2.6); TX('AERIAL TRAM', 115, 410, 13, 'center', MONO); R(70, 424, 30, 44, 1.6, COL.paper); R(130, 424, 30, 44, 1.6, COL.paper);
    Ln(110, 380, 360, 120, 1.4, .8); Ln(110, 388, 360, 128, 1.4, .8);
    if (nt) WASH(276, 300, 60, 110, COL.sun, .3, 11);
    S([[266, GL], [266, 250], [280, 236], [298, 238]], 2.4); O(300, 248, 9, 1.8, nt ? COL.sun : COL.paper);
    /* the directory board */
    Ln(BX + 24, GL, BX + 24, BY + BH, 2.6); Ln(BX + BW - 24, GL, BX + BW - 24, BY + BH, 2.6);
    R(BX, BY, BW, BH, 2.8, COL.paper); R(BX, BY, BW, 26, 2, COL.ink);
    ctx.fillStyle = COL.paper; ctx.font = '700 14px ' + MONO; ctx.textAlign = 'center'; ctx.fillText('DIRECTORY', BX + BW / 2, BY + 18);
    DIR.forEach(function(n, j){ var y0 = BY + 32 + j * LH, hl = dirLines[j] && (dirLines[j].matches(':hover') || dirLines[j] === document.activeElement);
      if (hl){ ctx.fillStyle = COL.sun; ctx.globalAlpha = .6; ctx.fillRect(BX + 4, y0, BW - 8, LH - 2); ctx.globalAlpha = 1; }
      ctx.fillStyle = COL.ink; ctx.font = '12.5px ' + MONO; ctx.textAlign = 'left'; ctx.fillText((j + 1) + '  ' + n, BX + 14, y0 + 13); ctx.textAlign = 'right'; ctx.fillText('→', BX + BW - 12, y0 + 13); });
    /* the station entrance */
    S([[690, GL], [690, 380], [802, 380], [802, GL]], 2.4); S([[682, 380], [810, 380]], 3);
    R(696, 388, 100, 22, 2, COL.paper); TX('STATION', 746, 405, 15);
    O(698, 362, 9, 2, COL.leaf); O(794, 362, 9, 2, COL.leaf); Ln(698, 371, 698, 380, 2); Ln(794, 371, 794, 380, 2);
    ctx.fillStyle = COL.ink; ctx.globalAlpha = .08; ctx.fillRect(706, 418, 80, GL - 418); ctx.globalAlpha = 1;
    for (i = 0; i < 4; i++){ var sy2 = 426 + i * 11; Ln(710 + i * 3, sy2, 782 - i * 3, sy2, 1.6, .9 - i * .15); }
    /* the food cart */
    R(836, 404, 110, 58, 2.2, COL.paper); S([[828, 404], [891, 376], [954, 404]], 2); TX('FOOD RECS', 891, 438, 13, 'center', MONO); O(854, 468, 9, 2, COL.paper); O(930, 468, 9, 2, COL.paper);
    if (!still()){ var stm = (T * .5) % 1; S([[906, 372 - stm * 20], [912, 362 - stm * 20], [906, 352 - stm * 20]], 1.2, 1 - stm); }
    if (kind === 'snow'){ WASH(500, GL + 4, 1400, 10, COL.paper, .9, 13); O(360, GL - 18, 18, 2, COL.paper); O(360, GL - 46, 13, 2, COL.paper); O(360, GL - 66, 9, 1.8, COL.paper); }
    if (wet){ for (var pd = 0; pd < 3; pd++){ var px2 = 360 + pd * 170, rp = still() ? .5 : (T * .8 + pd * .3) % 1; ctx.strokeStyle = COL.ink; ctx.globalAlpha = (1 - rp) * .6; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(px2, GL + 8, 8 + rp * 26, 2 + rp * 4, 0, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; } }
    ctx.restore();
  }
  function streetFigure(look){
    var kind = WX ? WX.kind : 'cloudy', wet = kind === 'drizzle' || kind === 'rain' || kind === 'storm';
    var fig = { x: 350, y: G, face: 1, look: look, wind: WX ? Math.min(1, WX.wind / 25) : .2, breath: WX ? WX.tempF <= 40 : false };
    if (wet){ fig.mode = 'stand'; fig.umbrella = true; }
    else if (kind === 'snow') fig.mode = 'shiver';
    else if (night()){ fig.mode = 'stand'; fig.mug = true; fig.smile = true; }
    else if (kind === 'clear' || kind === 'partly'){ fig.mode = 'stand'; fig.shades = true; fig.smile = true; }
    else { fig.mode = 'stand'; fig.mug = true; }
    var tgt = { tram: [115, SY + 420], directory: [BX + BW / 2, SY + BY + 90], station: [746, SY + 420], food: [891, SY + 432] }[streetAct || streetTarget];
    if (tgt){ fig.look = { x: tgt[0], y: tgt[1] }; fig.surprise = !streetAct; fig.mode = 'point'; fig.face = tgt[0] < fig.x ? -1 : 1; fig.mug = false; fig.umbrella = false; }
    if (look && fig.mode === 'stand') fig.smile = true;
    return fig;
  }

  /* ================= 3 · the platform, 4 · the train, 5 · Marquam Hill ================= */
  function drawPlatform(x){
    var t = x >= 1650 ? 1 : seg(x, 1150, 1650), tx = t < .3 ? 1400 : lerp(1400, 30, ease(seg(t, .3, .62))), doorOpen = t > .66;
    ctx.save(); ctx.translate(0, PB);
    S([[WL, 170], [WR, 170]], 2.2); tiles(WL, 180, WR - WL, 150);
    for (var cx = Math.floor(WL / 340) * 340 + 60; cx < WR; cx += 340){ S([[cx, 170], [cx, 470]], 2.4); S([[cx + 14, 170], [cx + 14, 470]], 1.6); }
    R(-20, 260, 110, 210, 2.2, COL.paper); R(-14, 232, 98, 22, 1.8, COL.paper); TX('← ROOM', 35, 248, 12, 'center', MONO);
    Ln(330, 170, 330, 200, 1.6); Ln(570, 170, 570, 200, 1.6); R(300, 200, 300, 40, 2.2, COL.paper); TX('TO MARQUAM HILL', 450, 227, 20, 'center', MONO);
    if (tx < WR + 40){ var ty = 320, tw = 640, i;
      if (!doorOpen && tx > -20 && tx < 1300) for (i = 0; i < 6; i++) Ln(tx + tw + 20 + i * 12, ty + 30 + i * 18, tx + tw + 80 + i * 20, ty + 30 + i * 18, 1.4, .6);
      WASH(tx + tw / 2, ty + 80, tw / 2 + 10, 70, COL.leaf, .26, 15); ctx.fillStyle = COL.paper; ctx.globalAlpha = .6; ctx.fillRect(tx, ty, tw, 150); ctx.globalAlpha = 1;
      S([[tx + 20, ty], [tx + tw - 20, ty], [tx + tw, ty + 20], [tx + tw, ty + 150], [tx, ty + 150], [tx, ty + 20], [tx + 20, ty]], 2.6);
      for (i = 0; i < 5; i++) R(tx + 40 + i * 120, ty + 26, 70, 44, 2, COL.paper);
      [170, 410].forEach(function(d){ var g = doorOpen ? 18 : 0; R(tx + d - g, ty + 16, 30, 130, 2, COL.paper); R(tx + d + 30 + g, ty + 16, 30, 130, 2, COL.paper); });
      TX('MARQUAM HILL', tx + tw - 90, ty + 58, 13, 'center', MONO); }
    S([[WL, 470], [WR, 470]], 3); for (var k = Math.floor(WL / 24) * 24; k < WR; k += 24) Ln(k, 473, k + 12, 473, 2, .8); H(WL, 476, WR - WL, 120, 14, .16);
    ctx.restore();
  }
  function wrapText(str, x, y, w, lh){ var words = str.split(' '), line = '', yy = y, n = 0; for (var i = 0; i < words.length; i++){ var test = line ? line + ' ' + words[i] : words[i]; if (ctx.measureText(test).width > w && line){ ctx.fillText(line, x, yy); line = words[i]; yy += lh; if (++n > 2) return; } else line = test; } ctx.fillText(line, x, yy); }
  function drawTrain(x){
    var T = I.T, t = x >= 2500 ? 1 : seg(x, 1650, 2500), riding = x >= 1650 && x < 2500, sway = riding && !still() ? Math.sin(T * 2.4) : 0, top = RT, fl = RF;
    ctx.save(); ctx.translate(sway * 1.5, 0);
    H(WL, top - 30, WR - WL, fl - top + 90, 22, .12);
    ctx.fillStyle = COL.paper; ctx.fillRect(20, top, 760, fl - top + 30); S([[20, top + 30], [60, top], [740, top], [780, top + 30], [780, fl + 30], [20, fl + 30], [20, top + 30]], 2.6);
    /* the notes are the ad cards above the windows */
    (cards || []).forEach(function(cd, i){ var cx = 56 + i * 178, hl = cd.el.matches(':hover') || cd.el === document.activeElement; R(cx, top + 16, 166, 62, 2, hl ? COL.sun : COL.paper); O(cx + 16, top + 47, 11, 1.6, cd.color); ctx.fillStyle = COL.ink; ctx.font = '700 11px ' + MONO; ctx.textAlign = 'center'; ctx.fillText(cd.route, cx + 16, top + 51); ctx.font = '600 10px ' + MONO; ctx.textAlign = 'left'; wrapText(cd.title, cx + 34, top + 32, 126, 12); });
    /* the tunnel outside, then Marquam Hill's platform */
    var wins = [[70, top + 100, 180, 140], [310, top + 100, 180, 140], [550, top + 100, 180, 140]];
    ctx.save(); ctx.beginPath(); wins.forEach(function(w){ ctx.rect(w[0], w[1], w[2], w[3]); }); ctx.clip();
    ctx.fillStyle = COL.ink; ctx.globalAlpha = .12; ctx.fillRect(60, top + 90, 700, 160); ctx.globalAlpha = 1;
    var speed = Math.sin(Math.min(1, t) * Math.PI); for (var l = 0; l < 14; l++){ var lx = ((l * 97 - (still() ? 0 : T * 900 * speed)) % 900 + 900) % 900; Ln(lx, top + 150, lx + 20 + speed * 50, top + 150, 2, .5); }
    if (t > .85){ var a = seg(t, .85, 1); ctx.globalAlpha = a; ctx.fillStyle = COL.paper; ctx.fillRect(60, top + 90, 700, 160); tiles(60, top + 90, 700, 160); R(300, top + 130, 200, 30, 2, COL.paper); TX('MARQUAM HILL', 400, top + 151, 15, 'center', MONO); ctx.globalAlpha = 1; }
    ctx.restore(); wins.forEach(function(w){ R(w[0], w[1], w[2], w[3], 2.4); });
    R(60, fl - 58, 680, 22, 2.2, COL.paper); S([[270, top + 80], [270, fl]], 2); S([[530, top + 80], [530, fl]], 2); S([[20, fl], [780, fl]], 2.4);
    /* the line map over the doors: two stops */
    var ry = top + 262; S([[200, ry], [600, ry]], 3, 1, COL.pop); O(200, ry, 7, 2, t < .5 ? COL.ink : COL.paper); O(600, ry, 7, 2, t >= .5 ? COL.ink : COL.paper); TX('South Waterfront', 200, ry + 24, 13); TX('Marquam Hill', 600, ry + 24, 13);
    ctx.restore();
    if (riding) FIG({ x: 400 + sway * 2, y: fl - 34, mode: 'sit', seat: 22, look: { x: 400, y: top + 40 }, smile: true, face: 1 });
  }
  function drawHill(x){
    var t = seg(x, 2500, 2950), closing = seg(t, .72, .9);
    ctx.save(); ctx.translate(0, DS);
    S([[WL, 170], [WR, 170]], 2.2); tiles(WL, 180, WR - WL, 290);
    Ln(230, 170, 230, 200, 1.6); Ln(570, 170, 570, 200, 1.6); R(200, 200, 400, 46, 2.4, COL.paper); TX('MARQUAM HILL', 400, 232, 26, 'center', MONO);
    var tx = lerp(-120, -900, ease(seg(t, .2, .7))); S([[tx, 320], [tx + 640, 320], [tx + 640, 470], [tx, 470], [tx, 320]], 2.4);
    R(700, 210, 200, 260, 2.6, COL.paper); var g = (1 - closing) * 60; R(800 - g - 60, 230, 60, 240, 2, COL.paper); R(800 + g, 230, 60, 240, 2, COL.paper);
    if (g > 2){ ctx.fillStyle = COL.ink; ctx.globalAlpha = .14; ctx.fillRect(800 - g, 230, g * 2, 240); ctx.globalAlpha = 1; }
    R(722, 176, 156, 26, 1.8, COL.paper); TX('ELEVATOR · OHSU ▲', 800, 194, 12, 'center', MONO);
    if (closing > 0){ var floor = Math.round(lerp(-26, 0, seg(t, .82, 1))); TX(floor < 0 ? 'floor ' + floor : 'OHSU', 800, 222, 13, 'center', MONO); }
    S([[WL, 470], [WR, 470]], 3); H(WL, 476, WR - WL, 120, 14, .16);
    ctx.restore();
  }

  /* ---------- tags (verbs, on the things you can use) ---------- */
  var tags = [], cards = [];
  function tag(k, label, wx, wy, zone, onClick){
    var el = document.createElement('button'); el.className = 'tag-in'; el.type = 'button'; el.textContent = label;
    hot.appendChild(el); tags.push({ el: el, k: k, x: wx, y: wy, zone: zone });
    el.addEventListener('pointerenter', function(){ streetTarget = k; }); el.addEventListener('pointerleave', function(){ streetTarget = null; });
    el.addEventListener('focus', function(){ streetTarget = k; }); el.addEventListener('blur', function(){ streetTarget = null; });
    if (onClick) el.addEventListener('click', onClick);
    return el;
  }
  if (hot){
    tag('tram', 'Aerial Tram up to OHSU ↑', 115, SY + 372, 'street', function(){ streetAct = 'tram'; goBack(HASH.lab); setTimeout(function(){ streetAct = null; }, 900); });
    tag('station', 'Down to the station ↓', 746, SY + 304, 'street', function(){ streetAct = 'station'; goForward(HASH.room); setTimeout(function(){ streetAct = null; }, 900); });
    tag('food', 'Coffee & food recs', 891, SY + 366, 'street', function(){ streetAct = 'food'; openPanel('food'); setTimeout(function(){ streetAct = null; }, 1200); });
    tags[tags.length - 1].el.classList.add('wide-only');
    tag('roomout', 'To the platform →', 1120 * K, ROOM_Y + 140 * K, 'room', function(){ goForward(HASH.platform); });
    tag('roomup', '↑ Back up to the street', 45 * K + 40, ROOM_Y + 140 * K, 'room', function(){ goBack(HASH.street); });
    tag('board', 'Board the train', 300, PB + 300, 'platform', function(){ goForward(HASH.train); });
    tag('elevator', 'Elevator up to OHSU ↑', 800, DS + 160, 'hill', function(){ goForward(HASH.lab); });
    tag('labout', 'Aerial Tram down →', 1120 * K, LAB_Y + 140 * K, 'lab', function(){ goForward(HASH.tram); });
    tag('labback', '↓ Elevator back down', 55 * K + 50, LAB_Y + 140 * K, 'lab', function(){ goBack(HASH.hill); });
    DIR.forEach(function(n, j){ var a = document.createElement('a'); a.className = 'dir-line'; a.href = DIRECTORY + '#' + DIR_IDS[j]; a.setAttribute('aria-label', 'Directory: ' + n); hot.appendChild(a); dirLines.push(a);
      a.addEventListener('pointerenter', function(){ streetTarget = 'directory'; }); a.addEventListener('pointerleave', function(){ streetTarget = null; }); });
    [ROOM_HOTS, LAB_HOTS].forEach(function(list){ list.forEach(function(hs){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'obj'; b.setAttribute('aria-label', 'Open ' + hs.label);
      b.innerHTML = '<span class="mk" aria-hidden="true"></span><span class="l"></span><span class="go" aria-hidden="true">Open</span>'; b.querySelector('.l').textContent = hs.label; hs.btn = b; hot.appendChild(b);
      b.addEventListener('mouseenter', function(){ hover = hs; }); b.addEventListener('mouseleave', function(){ if (hover === hs) hover = null; });
      b.addEventListener('focus', function(){ hover = hs; }); b.addEventListener('blur', function(){ if (hover === hs) hover = null; });
      b.addEventListener('click', function(){ openHot(hs); });
    }); });
    cards = [].map.call(document.querySelectorAll('#noteCards a'), function(a){ var el = a.cloneNode(false); el.className = 'card-hot'; el.setAttribute('aria-label', 'Note: ' + a.dataset.title); hot.appendChild(el); return { el: el, title: a.dataset.title, route: a.dataset.route, color: a.dataset.color }; });
  }
  /* keep labels clear of the top bar, the bottom bar, the left panel and each other */
  var navEl = document.querySelector('.nav'), barEl = document.querySelector('.journey');
  function box(el){ return el.getBoundingClientRect(); }
  function meet(a, b){ return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top); }
  function unclash(zid){
    var navB = navEl ? box(navEl).bottom : 60, barT = barEl ? box(barEl).top : ch, zp = document.querySelector('.zp.on'), zr = zp && innerWidth > 900 ? box(zp) : null;
    var live = tags.filter(function(t){ return t.el.style.visibility === 'visible'; }).map(function(t){ return t.el; });
    live.forEach(function(el){ var r = box(el); if (r.top < navB + 6) el.style.top = (parseFloat(el.style.top) + navB + 6 - r.top) + 'px'; });
    function clearPanel(el){ var r = box(el); if (zr && meet(r, zr)) el.style.left = (parseFloat(el.style.left) + zr.right + 10 - r.left) + 'px'; }
    live.forEach(clearPanel);
    var objs = (zid === 'room' ? ROOM_HOTS : zid === 'lab' ? LAB_HOTS : []).map(function(h){ return h.btn; });
    objs.forEach(function(b){ var r = box(b); if (r.left < 0 || r.right > cw || r.bottom > barT || (zr && meet(r, zr) && !b.classList.contains('now'))) b.style.visibility = 'hidden'; });
    var now = objs.filter(function(b){ return b.classList.contains('now'); })[0];
    if (now){ clearPanel(now); var nr = box(now);
      live.forEach(function(el){ var r = box(el); if (meet(nr, r)){ now.style.top = (parseFloat(now.style.top) + r.bottom - nr.top + nr.height + 6) + 'px'; nr = box(now); } });
      if (nr.left < 6) now.style.left = (parseFloat(now.style.left) + 6 - nr.left) + 'px'; else if (nr.right > cw - 6) now.style.left = (parseFloat(now.style.left) - (nr.right - cw + 6)) + 'px';
      nr = box(now); objs.forEach(function(b){ if (b !== now && meet(box(b), nr)) b.style.visibility = 'hidden'; }); }
    objs.forEach(function(b){ if (b.style.visibility === 'hidden') return; var r = box(b); live.forEach(function(el){ if (b !== now && meet(r, box(el))) b.style.visibility = 'hidden'; }); });
  }
  /* walk to an object and open what is in it */
  function openHot(hs){ active = hs; goTo(hs.at); openPanel(hs.id, hs.row); }
  function placeTags(zid){
    tags.forEach(function(t){ var p = toScreen(t.x, t.y), on = t.zone === zid && p[1] > 50 && p[1] < ch + 10;
      var half = (t.el.offsetWidth || 120) / 2; t.el.style.left = Math.max(half + 6, Math.min(cw - half - 6, p[0])) + 'px'; t.el.style.top = p[1] + 'px'; t.el.style.visibility = on ? 'visible' : 'hidden'; });
    dirLines.forEach(function(a, j){ var p = toScreen(BX + 4, SY + BY + 32 + j * LH), q = toScreen(BX + BW - 4, SY + BY + 30 + (j + 1) * LH); a.style.left = p[0] + 'px'; a.style.top = p[1] + 'px'; a.style.width = (q[0] - p[0]) + 'px'; a.style.height = (q[1] - p[1]) + 'px'; a.style.visibility = zid === 'street' ? 'visible' : 'hidden'; });
    [['room', ROOM_HOTS], ['lab', LAB_HOTS]].forEach(function(pair){ var y0 = interiorY(pair[0]); pair[1].forEach(function(hs){
      var p = toScreen((hs.r[0] + hs.r[2] / 2) * K, y0 + hs.r[1] * K); hs.btn.style.left = p[0] + 'px'; hs.btn.style.top = p[1] + 'px'; hs.btn.style.visibility = zid === pair[0] ? 'visible' : 'hidden';
      hs.btn.classList.toggle('now', hs === here); }); });
    unclash(zid);
    cards.forEach(function(cd, i){ var a = toScreen(56 + i * 178, RT + 16), b = toScreen(222 + i * 178, RT + 78); cd.el.style.left = a[0] + 'px'; cd.el.style.top = a[1] + 'px'; cd.el.style.width = (b[0] - a[0]) + 'px'; cd.el.style.height = (b[1] - a[1]) + 'px'; cd.el.style.visibility = zid === 'train' ? 'visible' : 'hidden'; });
  }

  /* ---------- panels ---------- */
  var zonePanels = [].slice.call(document.querySelectorAll('[data-zone-panel]'));
  var panelClose = document.getElementById('panelClose');
  function openPanel(id, row){ if (!panel) return; var sec0 = null;
    panel.querySelectorAll('section[data-c]').forEach(function(sec){ sec.hidden = sec.dataset.c !== id; if (!sec.hidden) sec0 = sec; }); panel.classList.add('open'); panel.scrollTop = 0;
    panel.querySelectorAll('.lit').forEach(function(el){ el.classList.remove('lit'); });
    var h = sec0 && sec0.querySelector('h2'); if (h){ h.setAttribute('tabindex', '-1'); setTimeout(function(){ h.focus({ preventScroll: true }); }, 60); }
    var li = row != null && sec0 && sec0.querySelectorAll('.rows')[0]; li = li && li.children[row];
    if (li){ li.classList.add('lit'); setTimeout(function(){ li.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' }); }, 340); } }
  function closePanel(){ if (!panel) return; panel.classList.remove('open'); active = null; }
  /* the left-hand panel in the room and the lab: every object in walking order, the one you are at lit,
     with the first few things in it */
  function fillPass(){
    document.querySelectorAll('[data-pass]').forEach(function(ol){ var z = Z[ol.dataset.pass]; if (!z) return;
      z.hots.forEach(function(hs, i){
        var li = document.createElement('li'), b = document.createElement('button'), sec = panel && panel.querySelector('section[data-c="' + hs.id + '"]'), bits = [];
        b.type = 'button'; b.innerHTML = '<span class="n"></span><span class="l"></span><span class="go">Open</span>'; b.querySelector('.n').textContent = i + 1; b.querySelector('.l').textContent = hs.label;
        b.addEventListener('click', function(){ openHot(hs); }); li.appendChild(b);
        if (sec){
          if (hs.row != null){ var r = sec.querySelectorAll('.rows')[0].children[hs.row]; if (r) bits = [r.querySelector('.t'), r.querySelector('.s')]; }
          else bits = [].slice.call(sec.querySelectorAll('.rows .t, .ideas .data-title>a, .build b, .links a.key'), 0, 3);
          var pv = document.createElement('div'); pv.className = 'pv';
          bits.forEach(function(el){ if (!el) return; var d = document.createElement('span'); d.textContent = el.textContent.replace(/\s+/g, ' ').trim(); pv.appendChild(d); });
          if (pv.childNodes.length) li.appendChild(pv);
        }
        hs.row2 = li; ol.appendChild(li);
      }); });
  }
  fillPass();
  if (panelClose) panelClose.addEventListener('click', closePanel);
  addEventListener('keydown', function(e){ if (e.key === 'Escape' && panel && panel.classList.contains('open') && !document.querySelector('dialog[open]')) closePanel(); });
  document.querySelectorAll('[data-open-panel]').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); openPanel(b.dataset.openPanel); }); });

  /* ---------- frame ---------- */
  var last = 0, curZone = null, hashTimer = null;
  var nextLabel = document.getElementById('nextLabel'), prevLabel = document.getElementById('prevLabel');
  function frame(now){
    if (I.plain()){ location.replace(DIRECTORY); return; }
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    I.tick(now);
    u = still() ? ut : lerp(u, ut, .14); if (Math.abs(u - ut) < .3) u = ut;
    var x = wrap(u), c = size(x), zone = zoneAt(x), zid = zone.id, X = dx(x);
    var wasHere = here; here = zone.hots ? walker(zid, x).at || null : null;
    if (here !== wasHere){ [ROOM_HOTS, LAB_HOTS].forEach(function(l){ l.forEach(function(hs){ if (hs.row2){ hs.row2.classList.toggle('here', hs === here); if (hs === here) hs.row2.setAttribute('aria-current', 'step'); else hs.row2.removeAttribute('aria-current'); } }); }); }
    var nw = nextWords(ut), pw = prevWords(ut); if (nextLabel && nextLabel.textContent !== nw) nextLabel.textContent = nw; if (prevLabel && prevLabel.textContent !== pw) prevLabel.textContent = pw;
    I.use(ctx); screen(); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, cw, ch); world();
    if (zid === 'room') drawRoom(x);
    else if (zid === 'lab') drawLab(x);
    else if (zid === 'hill') drawHill(X);
    else if (zid === 'platform' || zid === 'train'){ if (X < 1720 && vis(PB, PB + 600)) drawPlatform(X); if (vis(RT - 40, RF + 60)) drawTrain(X); }
    else { if (zid === 'tram' || vis(600, 1990)) drawTram(zid === 'tram' ? ease(seg(X, 3620, 4120)) : 1); if (vis(1300, 2100)) drawStreet(); }
    var f = c.fig;
    if (zid === 'street' && !f){ var mm = I.lookIn(cv, 0, 0, 0, 0, 1); f = streetFigure(mm ? { x: camX + mm.x / s, y: camTop + mm.y / s } : null); }
    if (f && !f.tram && f.alpha !== 0) FIG(f);
    screen();
    if (zid === 'street' || zid === 'tram'){
      var kind = WX ? WX.kind : '', T = I.T, slant = 4 + (WX ? Math.min(1, WX.wind / 25) : .2) * 10, rainN = { drizzle: 90, rain: 190, storm: 240 }[kind] || 0;
      for (var d = 0; d < rainN; d++){ var qx = Math.abs((Math.sin(d * 12.9) * 43758.5) % 1), qy = Math.abs((Math.sin(d * 78.2) * 24634.6) % 1), rx = qx * (cw + 60) - 30, ry = ((qy * (ch + 40) + (still() ? 0 : T * (kind === 'drizzle' ? 300 : 560) * (.85 + qx * .3))) % (ch + 40)) - 30; Ln(rx, ry, rx - slant, ry + (kind === 'drizzle' ? 10 : 18), 1.1, .5); }
      if (kind === 'snow') for (var n = 0; n < 130; n++){ var hx = Math.abs((Math.sin(n * 91.7) * 43758.5) % 1), hy = Math.abs((Math.sin(n * 37.3) * 24634.6) % 1), sp = 26 + hx * 34, fx2 = ((hx * cw + (still() ? 0 : Math.sin(T * .8 + n) * 14)) % cw + cw) % cw, fy = ((hy * (ch + 20) + (still() ? 0 : T * sp)) % (ch + 20)) - 20; O(fx2, fy, 1.8 + hy * 1.6, 1, COL.paper); }
    }
    var wipe = 0; SEAMS.forEach(function(sm){ wipe = Math.max(wipe, 1 - Math.abs(x - sm) / 60); });
    if (wipe > 0){ ctx.fillStyle = COL.paper; ctx.globalAlpha = ease(cl(wipe, 0, 1)); ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1; }
    placeTags(zid);
    zonePanels.forEach(function(p){ var on = p.dataset.zonePanel.split(' ').indexOf(zid) > -1; p.classList.toggle('on', on); p.setAttribute('aria-hidden', String(!on)); p.inert = !on; });
    if (zone !== curZone){
      curZone = zone; var i = ZONES.indexOf(zone);
      if (loopNav) loopNav.querySelectorAll('button').forEach(function(b){ var here = b.dataset.z === zid; b.classList.toggle('here', here); if (here) b.setAttribute('aria-current', 'location'); else b.removeAttribute('aria-current'); });
      clearTimeout(hashTimer); hashTimer = setTimeout(function(){ try { history.replaceState(null, '', zid === 'street' ? location.pathname : '#' + zid); } catch (e) {} }, 600);
      if (active && zid !== 'room' && zid !== 'lab') closePanel();
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('plainchange', function(){ if (I.plain()) location.replace(DIRECTORY); });
  if (I.plain()) location.replace(DIRECTORY); else requestAnimationFrame(frame);
  window.InkWorld = { goTo: goTo, openPanel: openPanel, stops: HASH, next: goNext, prev: goPrev, hotStops: ROOM_HOTS.concat(LAB_HOTS).map(function(h){ return [h.label, h.at]; }) };
})();
