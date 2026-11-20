/* The gallery: a walk along one long ink drawing, driven by the page's own scroll (food recs have their own walk,
   pod.js). The page sets <body data-scene="gallery">. The figure walks to each stop in turn and
   stands at it; the stop you are at lights up and opens with a click, Enter, or the Open button. Next and Back
   (or the arrow keys) step stop by stop. The sky is Portland's real weather and time of day.
   Plain mode and no-JS show the page's own list instead (the .plain-view block). */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, COL = I.COL;
  var MONO = '"JetBrains Mono",monospace';
  var cv = document.getElementById('strip'); if (!cv) return;
  var ctx = cv.getContext('2d'), scene = document.body.dataset.scene, hot = document.getElementById('stripHot');
  var still = function(){ return I.reduce.matches; };
  var WX = null; I.weather().then(function(w){ WX = w; });
  function night(){ var a = I.sunAlt(new Date()); return a < -4; }

  /* ---------- the walk: stops along the strip ---------- */
  var FLOOR = 540, ZOOM = 1.9;         // the figure is drawn ZOOM times its vignette size, so it is to scale with the prints
  var WALK = 70, DWELL = 120, IN = 80;  // scroll units (px) per stop
  var stops = [], signs = [], END = 0;
  function walkerAt(p){
    if (p < IN) return { x: lerp(stops[0].stand - 260, stops[0].stand, ease(p / IN)), mode: 'walk', ph: p * .15, face: 1, i: -1, near: 0 };
    p -= IN;
    for (var i = 0; i < stops.length; i++){
      var a = i ? stops[i - 1].stand : stops[0].stand;
      if (p < WALK && i){ var w = ease(p / WALK), x = lerp(a, stops[i].stand, w); return { x: x, mode: 'walk', ph: x * .03, face: 1, i: -1, near: i, w: w }; }
      if (i) p -= WALK;
      if (p < DWELL) return { x: stops[i].stand, mode: stops[i].act || 'stand', face: stops[i].face || 1, i: i, near: i };
      p -= DWELL;
    }
    var L = stops[stops.length - 1]; return { x: L.stand, mode: 'wave', face: -1, i: stops.length - 1, near: stops.length - 1 };
  }
  function totalLen(){ return IN + stops.length * DWELL + (stops.length - 1) * WALK + 40; }

  /* ---------- sizing: the scene is 600 units tall, at least 560 units wide on screen ---------- */
  var navEl = document.querySelector('.nav'), topEl = document.querySelector('.strip-top'), topH = 110;
  var cw = 0, ch = 0, K = 1, dpr = 1, spacer = document.getElementById('stripLen'), barEl = document.querySelector('.strip-bar');
  function size(){
    dpr = Math.min(2, window.devicePixelRatio || 1); cw = innerWidth; ch = innerHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var nb = navEl ? navEl.getBoundingClientRect().bottom : 60; if (topEl) topEl.style.top = (nb + 8) + 'px'; topH = topEl ? topEl.getBoundingClientRect().bottom : nb;
    var avail = ch - 90 - Math.max(60, topH - 20); K = Math.min(avail / 600, cw / 560); if (K > 1.6) K = 1.6;
  }
  var camX = 0, camGoal = 0, zoomK = 0, zoomGoal = 0, zoomTo = null;
  function oy(){ var t = Math.max(60, topH - 20), avail = ch - 80 - t; return t + Math.max(0, (avail - 600 * K) * .5); }
  /* the camera: centred on camX; while opening a print it flies into the frame until the print fills the screen */
  function view(){ var z = 1 + zoomK * zoomBy(), q = zoomTo ? zoomK : 0;
    return { z: z, cx: zoomTo ? lerp(camX, zoomTo.x, q) : camX, cy: zoomTo ? lerp(300, zoomTo.y, q) : 300, sy: lerp(oy() + 300 * K, ch / 2, q) }; }
  function toScreen(x, y){ var v = view(); return [cw / 2 + (x - v.cx) * K * v.z, v.sy + (y - v.cy) * K * v.z]; }
  function zoomBy(){ return zoomTo ? Math.max(1, Math.min(cw / (zoomTo.w * K), (ch - 80) / (zoomTo.h * K)) * .92 - 1) : 0; }

  /* ---------- the sky through a window: Portland's weather now ---------- */
  function skyIn(x, y, w, h, seed){
    var kind = WX ? WX.kind : 'cloudy', nt = night(), T = I.T;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    WASH(x + w / 2, y + h / 2, w * .6, h * .6, nt ? COL.night : COL.sky, nt ? .5 : .32, seed);
    if (nt){ for (var s = 0; s < 6; s++){ var sx = x + ((s * 53 + seed * 7) % w), sy = y + ((s * 29 + seed) % h); Ln(sx - 2, sy, sx + 2, sy, 1, .8); Ln(sx, sy - 2, sx, sy + 2, 1, .8); } }
    else if (kind === 'clear' || kind === 'partly'){ O(x + w * .7, y + h * .38, 12, 1.8, COL.sun); }
    var nc = { clear: 0, partly: 1, cloudy: 3, fog: 2, drizzle: 3, rain: 3, snow: 2, storm: 3 }[kind] || 1;
    for (var k = 0; k < nc; k++){ var cx = x + ((k * 97 + seed * 31 + (still() ? 0 : T * 6)) % (w + 120)) - 60, cy = y + 16 + (k % 2) * 18; ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.ellipse(cx + 26, cy, 28, 9, 0, 0, 6.3); ctx.fill(); S([[cx, cy + 4], [cx + 10, cy - 6], [cx + 30, cy - 10], [cx + 52, cy + 4], [cx, cy + 4]], 1.4); }
    if (kind === 'drizzle' || kind === 'rain' || kind === 'storm'){ var n = kind === 'drizzle' ? 8 : 16; for (var r = 0; r < n; r++){ var rx = x + ((r * 37 + seed * 11) % w), ry = y + (((r * 23) + (still() ? 0 : T * 160)) % h); Ln(rx, ry, rx - 3, ry + 9, 1, .6); } }
    if (kind === 'snow'){ for (var f = 0; f < 12; f++){ var fx = x + ((f * 41 + seed * 3) % w), fy = y + (((f * 31) + (still() ? 0 : T * 30)) % h); O(fx, fy, 1.6, 1, COL.paper); } }
    if (kind === 'fog') WASH(x + w / 2, y + h * .6, w * .7, h * .3, COL.paper, .8, seed + 3);
    ctx.restore(); R(x, y, w, h, 2.2, null); Ln(x + w / 2, y, x + w / 2, y + h, 1.4);
  }
  function skyLine(){ var kind = WX ? WX.kind : null; if (!WX) return 'Portland'; return 'Portland · ' + WX.tempF + '°F · ' + I.WORDS[kind]; }

  /* ================= the gallery ================= */
  var imgs = {}, mode = 'c';
  try { if (localStorage.getItem('photoMode') === 'bw') mode = 'bw'; } catch (e) {}
  function src(p, w){ var kind = (mode === 'bw' || p.bwonly) ? 'bw' : 'c'; return p.base + '-' + kind + '-' + w + '.webp'; }
  function img(p){ var u = src(p, 640); if (!imgs[u]){ var im = new Image(); im.decoding = 'async'; im.src = u; imgs[u] = im; } return imgs[u]; }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function when(d){ if (!d) return ''; var b = d.split('-'); return MONTHS[+b[1] - 1] + ' ' + b[0]; }
  function setupGallery(){
    var data = JSON.parse(document.getElementById('photoData').textContent), x = 520, year = null;
    data.sort(function(a, b){ return a.o - b.o; });
    data.forEach(function(p, i){
      var y = (p.date || '').slice(0, 4) || 'Undated';
      if (y !== year){ year = y; signs.push({ x: x, t: y }); x += 460; }
      var box = p.w >= p.h ? [280, 280 * p.h / p.w] : [230 * p.w / p.h, 230];
      if (box[1] > 230){ box = [box[0] * 230 / box[1], 230]; }
      stops.push({ p: p, x: x, w: box[0], h: box[1], cy: 250, stand: x - box[0] / 2 - 70, act: 'stand', label: (p.place || 'Photo') + (p.date ? ', ' + when(p.date) : '') });
      x += Math.max(500, box[0] + 300);
    });
    END = x + 400;
    stops.forEach(function(s){ s.look = { x: s.x, y: s.cy }; });
  }
  function drawGallery(lo, hi, wk){
    var P = COL.paper, T = I.T;
    /* wall, ceiling, floor */
    S([[lo, 40], [hi, 40]], 2.2); S([[lo, FLOOR], [hi, FLOOR]], 2.6); S([[lo, FLOOR - 14], [hi, FLOOR - 14]], 1.4, .6);
    for (var b = Math.floor(lo / 90) * 90; b < hi; b += 90) Ln(b, FLOOR + 6, b - 40, FLOOR + 60, 1.2, .35);
    H(lo, FLOOR + 4, hi - lo, 70, 16, .1);
    /* high windows every 1400 units: the real sky */
    for (var wx = Math.floor(lo / 1400) * 1400 + 180; wx < hi; wx += 1400) skyIn(wx, 54, 150, 60, (wx / 1400) | 0);
    /* entrance and exit */
    if (lo < 400){ R(60, 200, 150, FLOOR - 200, 2.4, P); Ln(135, 210, 135, FLOOR, 1.6); R(70, 170, 130, 24, 1.8, P); TX('← THE ROOM', 135, 187, 12, 'center', MONO); }
    if (hi > END - 300){ R(END - 220, 200, 150, FLOOR - 200, 2.4, P); R(END - 230, 170, 170, 24, 1.8, P); TX('BACK TO THE WALK →', END - 145, 187, 11, 'center', MONO); }
    /* year signs, painted on the wall */
    signs.forEach(function(s){ if (s.x < lo - 300 || s.x > hi + 300) return; WASH(s.x + 120, 220, 90, 46, COL.sun, .28, 50); TX(s.t, s.x + 120, 236, 64, 'center'); Ln(s.x + 50, 262, s.x + 190, 262, 2); });
    /* benches */
    for (var bx = 1100; bx < END; bx += 2100){ if (bx < lo - 200 || bx > hi + 200) continue; R(bx - 80, FLOOR - 46, 160, 12, 2, P); Ln(bx - 64, FLOOR - 34, bx - 64, FLOOR, 2); Ln(bx + 64, FLOOR - 34, bx + 64, FLOOR, 2); }
    /* the prints */
    stops.forEach(function(s, i){
      if (s.x + s.w < lo - 60 || s.x - s.w > hi + 60) return;
      var here = wk.i === i, hov = hoverI === i, x0 = s.x - s.w / 2, y0 = s.cy - s.h / 2;
      /* the light over it */
      ctx.save(); ctx.globalAlpha = here || hov ? .5 : .22; ctx.fillStyle = COL.sun; ctx.beginPath(); ctx.moveTo(s.x - 14, 44); ctx.lineTo(x0 - 20, y0 + s.h + 30); ctx.lineTo(x0 + s.w + 20, y0 + s.h + 30); ctx.lineTo(s.x + 14, 44); ctx.closePath(); ctx.fill(); ctx.restore();
      S([[s.x - 10, 42], [s.x - 6, 54], [s.x + 6, 54], [s.x + 10, 42]], 1.6);
      /* frame, mat, photo */
      ctx.fillStyle = P; ctx.fillRect(x0 - 16, y0 - 16, s.w + 32, s.h + 32);
      var im = img(s.p); if (im.complete && im.naturalWidth){ ctx.drawImage(im, x0, y0, s.w, s.h); } else { H(x0, y0, s.w, s.h, 10, .15); }
      R(x0 - 16, y0 - 16, s.w + 32, s.h + 32, here || hov ? 3.2 : 2.6, null); R(x0, y0, s.w, s.h, 1.4, null);
      if (here || hov) R(x0 - 22, y0 - 22, s.w + 44, s.h + 44, 1.2, null);
      /* the wall label */
      var narrow = cw < 700, lx = narrow ? s.x - 75 : x0 + s.w + 34, ly = narrow ? y0 + s.h + 30 : s.cy + s.h / 2 - 50;
      R(lx, ly, 150, 50, 1.4, P);
      ctx.fillStyle = COL.ink; ctx.textAlign = 'left'; ctx.font = '600 13px ' + MONO; fitText(s.p.place || 'Untitled', lx + 9, ly + 20, 134);
      ctx.font = '12px ' + MONO; ctx.fillStyle = COL.soft; fitText(when(s.p.date) || 'Undated', lx + 9, ly + 38, 134); ctx.fillStyle = COL.ink;
    });
  }
  function fitText(t, x, y, w){ while (ctx.measureText(t).width > w && t.length > 4) t = t.slice(0, -2) + '…'; ctx.fillText(t, x, y); }

  /* ---------- build ---------- */
  if (scene !== 'gallery') return;
  setupGallery();
  if (!stops.length) return;
  stops.forEach(function(s, i){ s.at = IN + i * (WALK + DWELL) + DWELL / 2; });
  var PX = 3.2;   // page pixels per scroll unit
  function setLen(){ spacer.style.height = Math.round(totalLen() * PX + innerHeight) + 'px'; }

  /* the clickable layer: one Open button for the lit stop, plus a hit area over every stop on screen */
  var openBtn = document.createElement('button'); openBtn.type = 'button'; openBtn.className = 'obj now'; openBtn.innerHTML = '<span class="l"></span><span class="go" aria-hidden="true">Open</span>'; hot.appendChild(openBtn);
  var hits = stops.map(function(s, i){ var b = document.createElement('button'); b.type = 'button'; b.className = 'hit'; b.setAttribute('aria-label', 'Open ' + s.label); b.tabIndex = -1; hot.appendChild(b);
    b.addEventListener('mouseenter', function(){ hoverI = i; }); b.addEventListener('mouseleave', function(){ if (hoverI === i) hoverI = -1; }); b.addEventListener('click', function(){ open(i); }); return b; });
  var hoverI = -1, curI = 0;
  openBtn.addEventListener('click', function(){ open(curI); });

  /* the list, for keyboards and screen readers: every stop in order */
  var list = document.getElementById('stripList');
  if (list) stops.forEach(function(s, i){ var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.textContent = s.label; b.addEventListener('click', function(){ go(i, true); open(i); }); li.appendChild(b); list.appendChild(li); });

  /* ---------- moving ---------- */
  var u = 0, ut = 0;
  function readScroll(){ ut = cl(scrollY / PX, 0, totalLen()); }
  addEventListener('scroll', readScroll, { passive: true });
  function go(i, now){ i = cl(i, 0, stops.length - 1); var y = stops[i].at * PX; scrollTo({ top: y, behavior: now || still() ? 'auto' : 'smooth' }); if (now){ ut = u = stops[i].at; } }
  var nextB = document.getElementById('stripNext'), prevB = document.getElementById('stripPrev'), countEl = document.getElementById('stripCount');
  if (nextB) nextB.addEventListener('click', function(){ var w = walkerAt(ut); go(w.i >= 0 ? w.i + 1 : w.near); });
  if (prevB) prevB.addEventListener('click', function(){ var w = walkerAt(ut); go(w.i >= 0 ? w.i - 1 : w.near - 1); });
  addEventListener('keydown', function(e){ if (document.querySelector('dialog[open]') || /input|textarea/i.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown'){ e.preventDefault(); nextB.click(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp'){ e.preventDefault(); prevB.click(); }
    else if (e.key === 'Enter' && e.target === document.body){ open(curI); } });

  /* ---------- open: the gallery zooms into the print (the portal), the pod opens the cart's menu ---------- */
  var lb = document.getElementById('lb');
  function open(i){
    var s = stops[i]; if (!s) return;
    zoomTo = { x: s.x, y: s.cy, w: s.w + 32, h: s.h + 32 }; zoomGoal = 1; openAfter = i; if (still()){ zoomK = 1; }
  }
  var openAfter = -1;
  /* the photo viewer */
  var lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap'), lbI = 0;
  function showPhoto(i){ lbI = (i + stops.length) % stops.length; var s = stops[lbI]; lbImg.src = src(s.p, 1600); lbImg.alt = 'Photo: ' + s.label;
    lbCap.textContent = s.label + (s.p.bwonly && mode === 'c' ? ' · shot in black and white' : '') + ' · ' + (lbI + 1) + ' / ' + stops.length; new Image().src = src(stops[(lbI + 1) % stops.length].p, 1600); }
  if (lb){
    document.getElementById('lbX').addEventListener('click', function(){ lb.close(); });
    document.getElementById('lbPrev').addEventListener('click', function(){ showPhoto(lbI - 1); });
    document.getElementById('lbNext').addEventListener('click', function(){ showPhoto(lbI + 1); });
    lb.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight'){ showPhoto(lbI + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft'){ showPhoto(lbI - 1); e.preventDefault(); } });
    lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('stage')) lb.close(); });
    var x0 = null; lb.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function(e){ if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) showPhoto(lbI + (d < 0 ? 1 : -1)); x0 = null; });
    lb.addEventListener('close', function(){ lbImg.removeAttribute('src'); if (lbI !== curI) go(lbI, true); zoomGoal = 0; openBtn.focus(); });
  }
  document.querySelectorAll('.mode button').forEach(function(m){ m.setAttribute('aria-pressed', String(m.dataset.mode === mode));
    m.addEventListener('click', function(){ mode = m.dataset.mode; try { localStorage.setItem('photoMode', mode); } catch (e) {} document.querySelectorAll('.mode button').forEach(function(o){ o.setAttribute('aria-pressed', String(o.dataset.mode === mode)); }); if (lb && lb.open) showPhoto(lbI); }); });

  /* ---------- frame ---------- */
  var last = 0, labelEl = openBtn.querySelector('.l');
  function frame(now){
    if (I.plain()) { requestAnimationFrame(frame); return; }
    I.tick(now); size();
    u = still() ? ut : lerp(u, ut, .16); if (Math.abs(u - ut) < .3) u = ut;
    var wk = walkerAt(u), cur = wk.i >= 0 ? wk.i : wk.near; curI = cur;
    var s = stops[cur], goal = wk.i >= 0 ? s.x : lerp(stops[Math.max(0, wk.near - 1)].x, s.x, wk.w || 0);
    if (u < IN) goal = lerp(stops[0].x - 300, stops[0].x, ease(u / IN));
    camX = goal;
    if (cw < 700) camX = goal - 40;
    zoomK = still() ? zoomGoal : lerp(zoomK, zoomGoal, .14); if (Math.abs(zoomK - zoomGoal) < .01){ zoomK = zoomGoal; if (zoomGoal === 0) zoomTo = null; }
    if (openAfter >= 0 && zoomK > .9){ var oi = openAfter; openAfter = -1; showPhoto(oi); lb.showModal(); }
    /* draw */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, cw, ch);
    I.use(ctx);
    var p0 = toScreen(0, 0), p1 = toScreen(1, 1), sc = p1[0] - p0[0];
    ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * p0[0], dpr * p0[1]);
    var lo = camX - cw / 2 / K - 100, hi = camX + cw / 2 / K + 100; if (lo < -400) lo = -400;
    drawGallery(lo, hi, wk);
    /* the figure, to scale */
    var look = hoverI >= 0 ? stops[hoverI].look : (wk.i >= 0 ? s.look : null);
    var f = { x: 0, y: 0, mode: wk.mode, ph: wk.ph, face: wk.face, look: look ? { x: (look.x - wk.x) / ZOOM, y: (look.y - FLOOR) / ZOOM } : null, smile: wk.i >= 0 };
    ctx.save(); ctx.translate(wk.x, FLOOR); ctx.scale(ZOOM, ZOOM); I.pen(1 / ZOOM); FIG(f); I.pen(1); ctx.restore();
    /* the hot layer */
    var vis = zoomGoal === 0;
    stops.forEach(function(t, i){ var a = toScreen(t.x - t.w / 2 - 16, t.cy - t.h / 2 - 16), b = toScreen(t.x + t.w / 2 + 16, t.cy + t.h / 2 + 16), on = vis && b[0] > 0 && a[0] < cw;
      var h = hits[i]; h.style.left = a[0] + 'px'; h.style.top = a[1] + 'px'; h.style.width = (b[0] - a[0]) + 'px'; h.style.height = (b[1] - a[1]) + 'px'; h.style.visibility = on ? 'visible' : 'hidden'; });
    var top = toScreen(s.x, s.cy - s.h / 2 - 22);
    if (labelEl.textContent !== s.label) labelEl.textContent = s.label;
    openBtn.style.left = Math.max(openBtn.offsetWidth / 2 + 8, Math.min(cw - openBtn.offsetWidth / 2 - 8, top[0])) + 'px'; openBtn.style.top = Math.max(70 + openBtn.offsetHeight, top[1]) + 'px';
    openBtn.style.visibility = vis && wk.i >= 0 ? 'visible' : 'hidden'; openBtn.setAttribute('aria-label', 'Open ' + s.label);
    if (countEl){ var t2 = (cur + 1) + ' / ' + stops.length; if (countEl.textContent !== t2) countEl.textContent = t2; }
    var sl = document.getElementById('stripSky'); if (sl){ var t3 = skyLine(); if (sl.textContent !== t3) sl.textContent = t3; }
    requestAnimationFrame(frame);
  }
  size(); setLen(); addEventListener('resize', function(){ size(); setLen(); });
  var h0 = parseInt((location.hash || '').slice(1), 10); if (h0 > 0) go(h0 - 1, true); else readScroll();
  requestAnimationFrame(frame);
  window.InkStrip = { go: go, open: open, stops: stops };
})();
