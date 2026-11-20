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
  var imgs = {};
  function src(p, w){ return p.base + '-bw-' + w + '.webp'; }   // black and white only; color on request
  /* the print's file: the 1600 px one once it is shown large (sharp on any screen), else the 640 px one */
  function img(p, big){ var u = src(p, big ? 1600 : 640); if (!imgs[u]){ var im = new Image(); im.decoding = 'async'; im.src = u; imgs[u] = im; } return imgs[u]; }
  function bigOn(s){ return s.w * K * dpr > 640; }
  function best(s){ var b = img(s.p, bigOn(s)); if (b.complete && b.naturalWidth) return b; var a = imgs[src(s.p, 640)]; return a && a.complete && a.naturalWidth ? a : b; }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function when(d){ if (!d) return ''; var b = d.split('-'); return MONTHS[+b[1] - 1] + ' ' + b[0]; }
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  /* each print's place, live: its time and weather now (city centres, never where the photo was taken) */
  var PLACES = { 'Bologna': [44.49, 11.34], 'Siena': [43.32, 11.33], 'Abruzzo': [42.35, 13.40], 'Vasto, Abruzzo': [42.11, 14.71], 'Florence': [43.77, 11.25], 'Sorrento': [40.63, 14.37],
    'Portland': [45.52, -122.68], 'Oregon Coast': [44.63, -124.05], 'Central Oregon': [44.06, -121.31], 'Seattle': [47.61, -122.33], 'Denver': [39.74, -104.99], 'Maryhill, Washington': [45.68, -120.82] };
  var PWX = {};
  function nowAt(place){ var w = PWX[place]; return w ? I.timeIn(w.tz) + ', ' + w.tempF + '°F, ' + I.WORDS[w.kind] : ''; }
  function setupGallery(){
    /* hung in the order of _data/gallery.yml: five series, each opened by its own title wall */
    var data = JSON.parse(document.getElementById('photoData').textContent), x = 760, cur = 0;
    data.forEach(function(p){
      if (p.si !== cur){ cur = p.si; signs.push({ x: x, t: p.series, n: ROMAN[p.si] || p.si, c: p.sn }); x += 520; }
      var box = p.w >= p.h ? [600, 600 * p.h / p.w] : [410 * p.w / p.h, 410];
      if (box[1] > 410){ box = [box[0] * 410 / box[1], 410]; }
      stops.push({ p: p, x: x, w: box[0], h: box[1], cy: 252, stand: x - box[0] / 2 - 80, act: 'stand',
        label: (p.place || 'Untitled') + (p.date ? ', ' + when(p.date) : ''), series: p.series + ' · ' + p.k + ' of ' + p.sn });
      x += Math.max(820, box[0] + 360);
    });
    END = x + 400;
    stops.forEach(function(s){ s.look = { x: s.x, y: s.cy }; });
    var seen = {}, list = []; stops.forEach(function(s){ var pl = s.p.place; if (PLACES[pl] && !seen[pl]){ seen[pl] = 1; list.push({ key: pl, lat: PLACES[pl][0], lon: PLACES[pl][1] }); } });
    if (list.length) I.wxAt(list).then(function(w){ PWX = w || {}; });
  }
  function drawGallery(lo, hi, wk){
    var P = COL.paper, T = I.T;
    /* wall, ceiling, floor */
    S([[lo, 18], [hi, 18]], 2.2); S([[lo, FLOOR], [hi, FLOOR]], 2.6); S([[lo, FLOOR - 14], [hi, FLOOR - 14]], 1.4, .6);
    for (var b = Math.floor(lo / 90) * 90; b < hi; b += 90) Ln(b, FLOOR + 6, b - 40, FLOOR + 60, 1.2, .35);
    H(lo, FLOOR + 4, hi - lo, 70, 16, .1);
    /* entrance and exit */
    if (lo < 400){ R(60, 200, 150, FLOOR - 200, 2.4, P); Ln(135, 210, 135, FLOOR, 1.6); R(70, 170, 130, 24, 1.8, P); TX('← THE ROOM', 135, 187, 12, 'center', MONO); }
    if (hi > END - 300){ R(END - 220, 200, 150, FLOOR - 200, 2.4, P); R(END - 230, 170, 170, 24, 1.8, P); TX('BACK TO THE CV →', END - 145, 187, 11, 'center', MONO); }
    /* year signs, painted on the wall */
    /* the entrance wall: what the show is */
    if (lo < 900){ ctx.fillStyle = COL.ink; ctx.textAlign = 'left'; ctx.font = '500 13px ' + MONO; ctx.fillText('PHOTOGRAPHS', 300, 190);
      ctx.font = '800 54px "Bricolage Grotesque",sans-serif'; ctx.fillText('Rick Mathews', 296, 246);
      ctx.font = '400 19px Literata,serif'; ctx.fillStyle = COL.soft; ctx.fillText(stops.length + ' prints in ' + signs.length + ' series, black and white.', 300, 286); ctx.fillText('Walk on. Click a print to look closer.', 300, 314); ctx.fillStyle = COL.ink; Ln(300, 336, 420, 336, 2.4); }
    /* each series opens with its title, painted on the wall */
    signs.forEach(function(s){ if (s.x < lo - 400 || s.x > hi + 400) return; var cx = s.x + 170;
      WASH(cx, 236, 150, 70, COL.sun, .26, 50 + s.n.length); ctx.fillStyle = COL.ink; ctx.textAlign = 'center';
      ctx.font = '500 14px ' + MONO; ctx.fillText('SERIES ' + s.n, cx, 178); TX(s.t, cx, 252, 66, 'center'); Ln(cx - 90, 280, cx + 90, 280, 2.2);
      ctx.font = '12px ' + MONO; ctx.fillStyle = COL.soft; ctx.fillText(s.c + (s.c === 1 ? ' print' : ' prints'), cx, 304); ctx.fillStyle = COL.ink; });
    /* benches */
    for (var bx = 1100; bx < END; bx += 2100){ if (bx < lo - 200 || bx > hi + 200) continue; R(bx - 80, FLOOR - 46, 160, 12, 2, P); Ln(bx - 64, FLOOR - 34, bx - 64, FLOOR, 2); Ln(bx + 64, FLOOR - 34, bx + 64, FLOOR, 2); }
    /* the prints */
    stops.forEach(function(s, i){
      if (s.x + s.w < lo - 60 || s.x - s.w > hi + 60) return;
      var here = wk.i === i, hov = hoverI === i, x0 = s.x - s.w / 2, y0 = s.cy - s.h / 2;
      /* the light over it */
      ctx.save(); ctx.globalAlpha = here || hov ? .42 : .16; ctx.fillStyle = COL.sun; ctx.beginPath(); ctx.moveTo(s.x - 14, 30); ctx.lineTo(x0 - 20, y0 + s.h + 30); ctx.lineTo(x0 + s.w + 20, y0 + s.h + 30); ctx.lineTo(s.x + 14, 30); ctx.closePath(); ctx.fill(); ctx.restore();
      Ln(s.x, 18, s.x, 24, 1.4); S([[s.x - 10, 24], [s.x - 6, 32], [s.x + 6, 32], [s.x + 10, 24]], 1.6);
      /* frame, mat, photo */
      ctx.fillStyle = P; ctx.fillRect(x0 - 16, y0 - 16, s.w + 32, s.h + 32);
      var im = best(s); if (im.complete && im.naturalWidth){ ctx.drawImage(im, x0, y0, s.w, s.h); } else { ctx.fillStyle = COL.tint; ctx.fillRect(x0, y0, s.w, s.h); }
      R(x0 - 16, y0 - 16, s.w + 32, s.h + 32, here || hov ? 3.2 : 2.6, null); R(x0, y0, s.w, s.h, 1.4, null);
      if (here || hov) R(x0 - 22, y0 - 22, s.w + 44, s.h + 44, 1.2, null);
      /* the wall label */
      var narrow = cw < 700, lx = narrow ? s.x - 75 : x0 + s.w + 34, ly = narrow ? y0 + s.h + 26 : s.cy + s.h / 2 - 98;
      s.lx = lx; s.ly = ly; R(lx, ly, 150, 72, 1.4, P); Ln(lx + 9, ly + 47, lx + 141, ly + 47, .8, .4);
      ctx.fillStyle = COL.ink; ctx.textAlign = 'left'; ctx.font = '600 13px ' + MONO; fitText(s.p.place || 'Untitled', lx + 9, ly + 20, 134);
      ctx.font = '12px ' + MONO; ctx.fillStyle = COL.soft; fitText(when(s.p.date) || 'Undated', lx + 9, ly + 38, 134); ctx.fillStyle = COL.ink;
      ctx.font = '11px ' + MONO; ctx.fillStyle = COL.soft; fitText(s.series, lx + 9, ly + 62, 134); ctx.fillStyle = COL.ink;
      var pw = PWX[s.p.place]; if (pw && !narrow){ R(lx, ly + 76, 150, 22, 1.1, COL.tint); ctx.font = '10.5px ' + MONO; ctx.fillStyle = COL.ink; fitText('Now ' + I.timeIn(pw.tz) + ' · ' + pw.tempF + '°F', lx + 8, ly + 91, 136); }
    });
  }
  function fitText(t, x, y, w){ while (ctx.measureText(t).width > w && t.length > 4) t = t.slice(0, -2) + '…'; ctx.fillText(t, x, y); }

  /* ================= the library: the notes, cover-out on display shelves between bookcases ================= */
  function setupLibrary(){
    var data = JSON.parse(document.getElementById('bookData').textContent), x = 640;
    data.forEach(function(b){ stops.push({ b: b, x: x, w: 190, h: 250, cy: 268, stand: x - 175, act: 'stand', label: b.title, url: b.url }); x += 760; });
    END = x + 300; stops.forEach(function(s){ s.look = { x: s.x, y: s.cy }; });
  }
  var SPINE = ['sky', 'rose', 'leaf', 'sun', 'tint'];
  function bookcase(x0, w, seed){
    var P = COL.paper; R(x0, 70, w, FLOOR - 70, 2.4, P);
    for (var sh = 0; sh < 5; sh++){ var y = 90 + sh * 88, bx = x0 + 10, n = seed + sh * 7;
      S([[x0, y + 80], [x0 + w, y + 80]], 2);
      while (bx < x0 + w - 16){ var bw = 9 + (n * 37) % 11, bh = 56 + (n * 53) % 22, tilt = (n % 9 === 0); n++;
        if (tilt){ S([[bx, y + 80], [bx + bh * .3, y + 80 - bh], [bx + bh * .3 + bw, y + 80 - bh], [bx + bw, y + 80], [bx, y + 80]], 1.4); bx += bw + 18; continue; }
        R(bx, y + 80 - bh, bw, bh, 1.4, COL[SPINE[n % 5]]); Ln(bx + 2, y + 86 - bh, bx + bw - 2, y + 86 - bh, .8, .6); bx += bw + 2; } }
  }
  function wrapCover(t, x0, y0, w, lh, max){ var words = t.split(' '), line = '', yy = y0, n = 0; ctx.textAlign = 'left';
    for (var i = 0; i < words.length; i++){ var test = line ? line + ' ' + words[i] : words[i]; if (ctx.measureText(test).width > w && line){ ctx.fillText(line, x0, yy); line = words[i]; yy += lh; if (++n >= max - 1){ break; } } else line = test; }
    ctx.fillText(line, x0, yy); }
  function drawLibrary(lo, hi, wk){
    var P = COL.paper;
    S([[lo, 40], [hi, 40]], 2.2); S([[lo, FLOOR], [hi, FLOOR]], 2.6);
    for (var fb = Math.floor(lo / 60) * 60; fb < hi; fb += 60) Ln(fb, FLOOR, fb, FLOOR + 70, 1, .25); H(lo, FLOOR + 4, hi - lo, 70, 16, .08);
    /* bookcases between the displays, a window onto the real sky now and then */
    for (var bc = Math.floor((lo - 300) / 760) * 760 + 190; bc < hi + 300; bc += 760){ if (bc < 400 || bc > END - 260) continue; bookcase(bc - 130, 260, (bc / 760) | 0); }
    if (lo < 400){ R(40, 200, 150, FLOOR - 200, 2.4, P); Ln(115, 210, 115, FLOOR, 1.6); R(40, 170, 150, 24, 1.8, P); TX('← THE ROOM', 115, 187, 12, 'center', MONO); }
    if (hi > END - 300){ R(END - 220, 200, 150, FLOOR - 200, 2.4, P); R(END - 230, 170, 170, 24, 1.8, P); TX('BACK TO THE CV →', END - 145, 187, 11, 'center', MONO); }
    stops.forEach(function(s, i){
      if (s.x + 200 < lo || s.x - 200 > hi) return;
      var here = wk.i === i, hov = hoverI === i, x0 = s.x - s.w / 2, y0 = s.cy - s.h / 2, b = s.b;
      /* the lamp and the display shelf */
      ctx.save(); ctx.globalAlpha = here || hov ? .45 : .18; ctx.fillStyle = COL.sun; ctx.beginPath(); ctx.moveTo(s.x - 12, 50); ctx.lineTo(x0 - 26, y0 + s.h + 24); ctx.lineTo(x0 + s.w + 26, y0 + s.h + 24); ctx.lineTo(s.x + 12, 50); ctx.closePath(); ctx.fill(); ctx.restore();
      Ln(s.x, 40, s.x, 50, 1.6); S([[s.x - 12, 50], [s.x - 8, 60], [s.x + 8, 60], [s.x + 12, 50]], 1.6);
      R(x0 - 30, y0 + s.h + 4, s.w + 60, 12, 2, P); Ln(x0 - 14, y0 + s.h + 16, x0 - 14, FLOOR, 2); Ln(x0 + s.w + 14, y0 + s.h + 16, x0 + s.w + 14, FLOOR, 2);
      /* the book, cover out: its line's bullet, title and year */
      ctx.fillStyle = COL.ink; ctx.globalAlpha = .12; ctx.fillRect(x0 + 6, y0 + 6, s.w, s.h); ctx.globalAlpha = 1;
      R(x0, y0, s.w, s.h, here || hov ? 3.2 : 2.6, P); WASH(s.x, y0 + 40, s.w * .45, 26, b.color, .35, 300 + i); Ln(x0 + 12, y0, x0 + 12, y0 + s.h, 1.2, .5);
      ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(x0 + 44, y0 + 40, 18, 0, 6.3); ctx.fill(); O(x0 + 44, y0 + 40, 18, 2, null);
      ctx.fillStyle = b.text || '#fff'; ctx.font = '800 19px "Bricolage Grotesque",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.route, x0 + 44, y0 + 47);
      ctx.fillStyle = COL.ink; ctx.font = '800 17px "Bricolage Grotesque",sans-serif'; wrapCover(b.title, x0 + 22, y0 + 92, s.w - 38, 21, 6);
      ctx.font = '11px ' + MONO; ctx.fillStyle = COL.soft; ctx.textAlign = 'left'; ctx.fillText(b.year + ' · ' + b.status.toLowerCase(), x0 + 22, y0 + s.h - 16); ctx.fillStyle = COL.ink;
      if (here || hov) R(x0 - 8, y0 - 8, s.w + 16, s.h + 16, 1.2, null);
    });
  }

  /* ---------- build ---------- */
  if (scene === 'gallery') setupGallery(); else if (scene === 'library') setupLibrary(); else return;
  if (!stops.length) return;
  stops.forEach(function(s, i){ s.at = IN + i * (WALK + DWELL) + DWELL / 2; });
  var PX = 3.2;   // page pixels per scroll unit
  function setLen(){ spacer.style.height = Math.round(totalLen() * PX + innerHeight) + 'px'; }

  /* the clickable layer: one Open button for the lit stop, plus a hit area over every stop on screen */
  var openBtn = document.createElement('button'); openBtn.type = 'button'; openBtn.className = 'obj now'; openBtn.innerHTML = '<span class="l"></span><span class="go" aria-hidden="true">' + (scene === 'library' ? 'Read' : 'Open') + '</span>'; hot.appendChild(openBtn);
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
  addEventListener('pageshow', function(e){ if (e.persisted){ zoomGoal = 0; zoomK = 0; zoomTo = null; openAfter = -1; } });
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
    if (scene === 'library' && still()){ location.href = s.url; }
  }
  var openAfter = -1;
  /* the photo viewer */
  var lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap'), lbI = 0;
  function showPhoto(i){ lbI = (i + stops.length) % stops.length; var s = stops[lbI]; lbImg.src = src(s.p, 1600); lbImg.alt = 'Photo: ' + s.label;
    var lw = nowAt(s.p.place); lbCap.textContent = s.series + ' · ' + s.label + (lw ? ' · there now: ' + lw : ''); new Image().src = src(stops[(lbI + 1) % stops.length].p, 1600);
    var ask = document.getElementById('lbColor'); if (ask) ask.dataset.prefill = 'Could I see your photo "' + s.label + '" in color?'; }
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
  var askC = document.getElementById('lbColor'); if (askC) askC.addEventListener('click', function(){ var ta = document.querySelector('#contactDlg textarea'); if (ta) ta.value = askC.dataset.prefill + ' '; });

  /* ---------- frame ---------- */
  var last = 0, labelEl = openBtn.querySelector('.l');
  function frame(now){
    if (I.plain()) { requestAnimationFrame(frame); return; }
    I.tick(now); size();
    u = still() ? ut : lerp(u, ut, .16); if (Math.abs(u - ut) < .3) u = ut;
    var wk = walkerAt(u), cur = wk.i >= 0 ? wk.i : wk.near; curI = cur;
    var s = stops[cur], goal = wk.i >= 0 ? s.x : lerp(stops[Math.max(0, wk.near - 1)].x, s.x, wk.w || 0);
    if (u < IN) goal = lerp(cw < 700 ? 430 : 640, stops[0].x, ease(u / IN));
    camX = goal;
    if (cw < 700) camX = goal - 40;
    zoomK = still() ? zoomGoal : lerp(zoomK, zoomGoal, .14); if (Math.abs(zoomK - zoomGoal) < .01){ zoomK = zoomGoal; if (zoomGoal === 0) zoomTo = null; }
    if (openAfter >= 0 && zoomK > .9){ var oi = openAfter; openAfter = -1; if (scene === 'library') location.href = stops[oi].url; else { showPhoto(oi); lb.showModal(); } }
    /* draw */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, cw, ch);
    I.use(ctx);
    var p0 = toScreen(0, 0), p1 = toScreen(1, 1), sc = p1[0] - p0[0];
    ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * p0[0], dpr * p0[1]);
    var lo = camX - cw / 2 / K - 100, hi = camX + cw / 2 / K + 100; if (lo < -400) lo = -400;
    if (scene === 'library') drawLibrary(lo, hi, wk); else { for (var pre = Math.max(0, cur - 1); pre <= Math.min(stops.length - 1, cur + 2); pre++) img(stops[pre].p, bigOn(stops[pre])); drawGallery(lo, hi, wk); }   /* the next prints load ahead of time */
    /* the figure, to scale */
    var look = hoverI >= 0 ? stops[hoverI].look : (wk.i >= 0 ? s.look : null);
    var f = { x: 0, y: 0, mode: wk.mode, ph: wk.ph, face: wk.face, look: look ? { x: (look.x - wk.x) / ZOOM, y: (look.y - FLOOR) / ZOOM } : null, smile: wk.i >= 0 };
    ctx.save(); ctx.translate(wk.x, FLOOR); ctx.scale(ZOOM, ZOOM); I.pen(1 / ZOOM); FIG(f); I.pen(1); ctx.restore();
    /* the hot layer */
    var vis = zoomGoal === 0;
    stops.forEach(function(t, i){ var a = toScreen(t.x - t.w / 2 - 16, t.cy - t.h / 2 - 16), b = toScreen(t.x + t.w / 2 + 16, t.cy + t.h / 2 + 16), on = vis && b[0] > 0 && a[0] < cw;
      var h = hits[i]; h.style.left = a[0] + 'px'; h.style.top = a[1] + 'px'; h.style.width = (b[0] - a[0]) + 'px'; h.style.height = (b[1] - a[1]) + 'px'; h.style.visibility = on ? 'visible' : 'hidden'; });
    /* the Open label sits under the print's wall label, as in a gallery, never over the print */
    var top = s.lx != null ? toScreen(s.lx + 75, s.ly + (cw < 700 ? 72 : 98) + 54) : toScreen(s.x, s.cy - s.h / 2 - 22);
    var lt = scene === 'gallery' ? 'Look closer' : s.label; if (labelEl.textContent !== lt) labelEl.textContent = lt;
    openBtn.style.left = Math.max(openBtn.offsetWidth / 2 + 8, Math.min(cw - openBtn.offsetWidth / 2 - 8, top[0])) + 'px'; openBtn.style.top = Math.max(topH + openBtn.offsetHeight + 8, top[1]) + 'px';
    openBtn.style.visibility = vis && wk.i >= 0 ? 'visible' : 'hidden'; openBtn.setAttribute('aria-label', 'Open ' + s.label);
    if (countEl){ var t2 = (cur + 1) + ' / ' + stops.length; if (countEl.textContent !== t2) countEl.textContent = t2; }
    var sl = document.getElementById('stripSky'); if (sl){ var t3 = scene === 'gallery' && s.p && nowAt(s.p.place) ? s.p.place + ' now · ' + nowAt(s.p.place) : skyLine(); if (sl.textContent !== t3) sl.textContent = t3; }
    requestAnimationFrame(frame);
  }
  size(); setLen(); addEventListener('resize', function(){ size(); setLen(); });
  var h0 = parseInt((location.hash || '').slice(1), 10); if (h0 > 0) go(h0 - 1, true); else readScroll();
  requestAnimationFrame(frame);
  window.InkStrip = { go: go, open: open, stops: stops };
})();
