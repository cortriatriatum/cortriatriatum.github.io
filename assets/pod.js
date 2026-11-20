/* Food recs as a walk through the cities: one street per city, drawn from its real landmarks, with that city's
   live weather and daylight. Every place on the list is its own spot on the street: a cart, a café, a bakery,
   a bar, a pizzeria, a noodle shop or a storefront, with its name on the sign. Between cities you go down into
   the subway and come up in the next one.
   Scroll (or swipe) walks. The spot you are at lights up; its label opens it on Google Maps. Back and Next go
   city to city; the arrow keys step spot to spot. The list on the left is the current city's spots.
   The places come from the page's own lists (_includes/ink/food.html). Plain mode shows those lists instead. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, COL = I.COL;
  var MONO = '"JetBrains Mono",monospace';
  var cv = document.getElementById('strip'); if (!cv) return;
  var ctx = cv.getContext('2d'), hot = document.getElementById('stripHot');
  var still = function(){ return I.reduce.matches; };

  /* ---------- the cities ---------- */
  var CITY = {
    'Portland, OR':  { short: 'Portland', sign: 'PORTLAND, OR', look: 'pdx', ll: [45.52, -122.68], bul: 'P', col: '#0039A6' },
    'New York, NY':  { short: 'New York', sign: 'NEW YORK, NY', look: 'nyc', ll: [40.73, -73.99], bul: 'N', col: '#FCCC0A' },
    'Portland, ME':  { short: 'Portland, Maine', sign: 'PORTLAND, ME', look: 'me', ll: [43.66, -70.26], bul: 'M', col: '#EE352E' },
    'Florence, Italy': { short: 'Florence', sign: 'FIRENZE', look: 'fi', ll: [43.77, 11.25], bul: 'F', col: '#FF6319' },
    'Abruzzo, Italy':  { short: 'Abruzzo', sign: 'ABRUZZO', look: 'ab', ll: [42.35, 13.40], bul: 'A', col: '#6CBE45' },
    'Vancouver, BC':   { short: 'Vancouver', sign: 'VANCOUVER, BC', look: 'van', ll: [49.28, -123.12], bul: 'V', col: '#00933C' },
    'Elsewhere in Oregon and Washington': { short: 'Oregon and Washington', sign: 'OREGON · WASHINGTON', look: 'nw', ll: [45.71, -121.52], bul: 'W', col: '#A626AA' }
  };
  /* what to draw for each place, from its name */
  function kindOf(name, look){
    var n = name.toLowerCase();
    if (/coffee|caf[eé]|espresso|chai|tea\b/.test(n)) return 'cafe';
    if (/bak|bagel|bialy|patisser|pasticcer|bread|baguette|doughnut|donut|biscott|sourdough|focacc|honor/.test(n)) return 'bakery';
    if (/pizz|apizza/.test(n)) return 'pizza';
    if (/wine|bar\b|lodge|distill|legion|bellwether|inn\b|cave|stammtisch|tavern|pub\b/.test(n)) return 'bar';
    if (/noodle|ramen|sushi|thai|phuket|yaowarat|rangoon|korean|toji|momofuku|baka|wu-rons|kati|chennai|masala|india|desi|apna|gado|mirisata|eem/.test(n)) return 'noodle';
    if (/gelato|ice cream|licks|leeuwen/.test(n)) return 'ice';
    if (/market|marketplace|fish|meat|pickles|foods|store|shop\b|deli/.test(n)) return 'market';
    if (/taco|taqueria|birri|burrito|campesino|tacones|bbq|window|tickler|grind|mac'd/.test(n)) return 'cart';
    if (/lincoln center/.test(n)) return 'hall';
    return look === 'pdx' ? 'cart' : 'store';
  }

  /* ---------- live weather and daylight in every city, one request, cached 15 minutes ---------- */
  var WX = {};
  (function(){
    var names = Object.keys(CITY), key = 'pod-wx', cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.at < 15 * 60e3){ WX = cached.wx; return; }
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + names.map(function(n){ return CITY[n].ll[0]; }).join(',') + '&longitude=' + names.map(function(n){ return CITY[n].ll[1]; }).join(',') + '&current=temperature_2m,weather_code,is_day,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto';
    fetch(url).then(function(r){ return r.json(); }).then(function(j){ var arr = Array.isArray(j) ? j : [j];
      arr.forEach(function(o, i){ var c = o.current || {}; WX[names[i]] = { kind: classify(c.weather_code), tempF: Math.round(c.temperature_2m), day: c.is_day === 1, wind: c.wind_speed_10m || 0 }; });
      try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), wx: WX })); } catch (e) {} }).catch(function(){});
  })();
  function classify(code){ if (code === 0) return 'clear'; if (code === 1 || code === 2) return 'partly'; if (code === 3) return 'cloudy'; if (code === 45 || code === 48) return 'fog'; if (code >= 51 && code <= 57) return 'drizzle'; if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'; if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'; if (code >= 95) return 'storm'; return 'cloudy'; }
  function wxOf(c){ return WX[c.name] || null; }
  function nightIn(c){ var w = wxOf(c); return w ? !w.day : false; }

  /* ---------- lay out the street ---------- */
  var FLOOR = 540, GAP = 224, GATE = 660, ZOOM = 1.9, STAND = 112;
  var cities = [], spots = [], x = 0;
  [].slice.call(document.querySelectorAll('#cartPanel [data-city-list]')).forEach(function(ul, ci){
    var name = ul.getAttribute('aria-label'), c = CITY[name] || { short: name, sign: name.toUpperCase(), look: 'nw', ll: [45.5, -122.7], bul: name[0], col: '#808183' };
    var city = { name: name, c: c, a: x, list: ul, i: ci, spots: [] };
    x += GATE;
    [].slice.call(ul.children).forEach(function(li, j){
      var a = li.querySelector('a'), shut = li.classList.contains('closed'), maybe = !shut && !!li.querySelector('.ft.shut');
      var sp = { name: a.textContent.trim(), href: a.href, vegan: !!li.querySelector('.ft.vegan'), closed: shut, maybe: maybe, city: city, j: j, x: x, li: li };
      sp.kind = kindOf(sp.name, c.look); spots.push(sp); city.spots.push(sp);
      x += GAP + (c.look === 'pdx' && j % 12 === 11 ? 260 : 0);   // in Portland, a crosswalk between pods
    });
    city.b = x + 260; x = city.b; cities.push(city);
  });
  var END = x + 300;
  if (!spots.length) return;

  /* ---------- scroll: one page pixel per 1.25 units; the figure walks with it ---------- */
  var PX = 1.25, spacer = document.getElementById('stripLen');
  function setLen(){ spacer.style.height = Math.round(END * PX + innerHeight) + 'px'; }
  var u = 0, ut = 0, last = 0, face = 1;
  function readScroll(){ ut = cl(scrollY / PX, 0, END); }
  addEventListener('scroll', readScroll, { passive: true });
  function figX(v){ return cl(v, 120, END - 160); }
  function spotAt(v){ var fx = figX(v), best = null, bd = 1e9; spots.forEach(function(s){ var d = Math.abs(s.x - STAND - fx); if (d < bd){ bd = d; best = s; } }); return bd < GAP / 2 ? best : null; }
  function cityAt(v){ var fx = figX(v); for (var i = cities.length - 1; i >= 0; i--) if (fx >= cities[i].a) return cities[i]; return cities[0]; }
  /* a far jump (another city) cuts there with a quick fade, like going through a door; a near one walks */
  var fade = 0;
  function goX(wx, now){ var y = wx * PX, far = Math.abs(wx - u) > 900; if (far && !now && !still()) fade = 1; scrollTo({ top: y, behavior: now || far || still() ? 'auto' : 'smooth' }); if (now || far){ ut = u = y / PX; } }
  function goSpot(s, now){ goX(s.x - STAND, now); }
  function goCity(c, now){ goX(c.a + 200, now); }

  /* ---------- sizing ---------- */
  var navEl = document.querySelector('.nav'), topEl = document.querySelector('.strip-top'), sideEl = document.getElementById('podSide');
  var cw = 0, ch = 0, K = 1, dpr = 1, topH = 110, camX = 0;
  function size(){
    dpr = Math.min(2, window.devicePixelRatio || 1); cw = innerWidth; ch = innerHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var nb = navEl ? navEl.getBoundingClientRect().bottom : 60; if (topEl) topEl.style.top = (nb + 8) + 'px'; topH = topEl ? topEl.getBoundingClientRect().bottom : nb;
    if (sideEl && innerWidth > 900) sideEl.style.top = (topH + 10) + 'px'; else if (sideEl) sideEl.style.top = '';
    var avail = ch - 90 - Math.max(60, topH - 20); K = Math.min(avail / 600, cw / 520); if (K > 1.5) K = 1.5;
  }
  function oy(){ var t = Math.max(60, topH - 20), avail = ch - 80 - t; return t + Math.max(0, (avail - 600 * K) * .5); }
  function sideW(){ return sideEl && innerWidth > 900 && !document.documentElement.classList.contains('side-off') ? sideEl.getBoundingClientRect().right : 0; }
  function toScreen(wx, wy){ var left = sideW(), mid = left + (cw - left) / 2; return [mid + (wx - camX) * K, oy() + wy * K]; }

  /* ---------- drawing helpers ---------- */
  function fitText(t, x0, y0, w, al){ ctx.textAlign = al || 'center'; while (ctx.measureText(t).width > w && t.length > 4) t = t.slice(0, -2) + '…'; ctx.fillText(t, x0, y0); }
  function sky(c, lo, hi){
    var w = wxOf(c), kind = w ? w.kind : 'cloudy', nt = nightIn(c), T = I.T, P = COL.paper;
    if (nt){ ctx.fillStyle = COL.night; ctx.globalAlpha = .14; ctx.fillRect(lo, -400, hi - lo, FLOOR + 400); ctx.globalAlpha = 1;
      for (var s = 0; s < 26; s++){ var sx = lo + ((s * 137 + c.i * 41) % Math.max(1, hi - lo)), sy = 40 + (s * 53) % 150; Ln(sx - 3, sy, sx + 3, sy, 1.1, .7); Ln(sx, sy - 3, sx, sy + 3, 1.1, .7); }
      O(lo + (hi - lo) * .78, 90, 20, 2, P); }
    else if (kind === 'clear' || kind === 'partly'){ var sxp = lo + (hi - lo) * .78; WASH(sxp, 90, 48, 48, COL.sun, .4, 60 + c.i); O(sxp, 90, 24, 2.2, P); for (var r = 0; r < 10; r++){ var an = r / 10 * 6.283 + (still() ? 0 : T * .15); Ln(sxp + Math.cos(an) * 34, 90 + Math.sin(an) * 34, sxp + Math.cos(an) * 46, 90 + Math.sin(an) * 46, 1.8); } }
    var nc = { clear: 0, partly: 2, cloudy: 6, fog: 3, drizzle: 5, rain: 6, snow: 5, storm: 6 }[kind] || 2;
    for (var k = 0; k < nc; k++){ var cx = lo + ((k * 331 + c.i * 97 + (still() ? 0 : T * (6 + (w ? Math.min(1, w.wind / 25) : .2) * 14))) % (hi - lo + 300)) - 150, cy = 60 + (k % 3) * 34; ctx.fillStyle = P; ctx.beginPath(); ctx.ellipse(cx + 50, cy, 56, 15, 0, 0, 6.3); ctx.fill(); S([[cx, cy + 6], [cx + 20, cy - 10], [cx + 56, cy - 16], [cx + 100, cy + 6], [cx, cy + 6]], 1.6); if (kind === 'storm' || kind === 'rain') H(cx + 8, cy - 10, 90, 12, 7, .3); }
    return { kind: kind, nt: nt };
  }
  function weatherFront(c, lo, hi, kw){
    var T = I.T, kind = kw.kind;
    if (kind === 'drizzle' || kind === 'rain' || kind === 'storm'){ var n = kind === 'drizzle' ? 40 : 90; for (var i = 0; i < n; i++){ var rx = lo + ((i * 97 + c.i * 13) % Math.max(1, hi - lo)), ry = ((i * 61 + (still() ? 0 : T * 420)) % (FLOOR + 40)) - 20; Ln(rx, ry, rx - 4, ry + 12, 1, .45); } }
    if (kind === 'snow'){ for (var f = 0; f < 50; f++){ var fx = lo + ((f * 89 + c.i * 7) % Math.max(1, hi - lo)) + (still() ? 0 : Math.sin(T + f) * 8), fy = ((f * 47 + (still() ? 0 : T * 40)) % (FLOOR + 20)); O(fx, fy, 2, 1, COL.paper); } }
    if (kind === 'fog'){ for (var g = 0; g < 5; g++) WASH(lo + ((g * 300 + (still() ? 0 : T * 8)) % Math.max(1, hi - lo)), 300 + g * 40, 260, 24, COL.paper, .75, 90 + g); }
  }
  /* the landmarks behind each street, drawn a little slower than the street (parallax) */
  function backdrop(c, lo, hi, nt){
    var P = COL.paper, look = c.c.look, par = (camX - c.a) * .45, base = c.a + par;
    ctx.save(); ctx.beginPath(); ctx.rect(c.a - 40, -400, c.b - c.a + 80, FLOOR + 400); ctx.clip();
    function win(x0, y0, w0, h0, n){ if (nt && n % 3 === 0){ ctx.fillStyle = COL.sun; ctx.globalAlpha = .75; ctx.fillRect(x0, y0, w0, h0); ctx.globalAlpha = 1; } R(x0, y0, w0, h0, 1, null); }
    for (var bx = Math.floor((lo - base) / 1400) * 1400; bx < hi - base + 1400; bx += 1400){ var X = base + bx, n = 0;
      if (look === 'pdx'){ /* Big Pink, the Fremont Bridge, firs, Mount Hood on a clear day */
        [[0, 300, 50], [60, 250, 36], [104, 320, 46], [420, 280, 40], [470, 330, 30]].forEach(function(t){ R(X + t[0], t[1], t[2], 460 - t[1], 1.4, P); for (var wy = t[1] + 12; wy < 450; wy += 18) win(X + t[0] + 6, wy, t[2] - 12, 6, ++n); });
        R(X + 170, 170, 46, 290, 1.8, P); WASH(X + 193, 300, 22, 130, COL.rose, .5, 61); for (var wp = 186; wp < 450; wp += 16) Ln(X + 176, wp, X + 210, wp, 1, .35); TX('Big Pink', X + 193, 162, 13);
        S([[X + 600, 460], [X + 640, 400], [X + 760, 360], [X + 880, 400], [X + 920, 460]], 2); S([[X + 580, 420], [X + 940, 420]], 2); for (var hb = 640; hb <= 880; hb += 30) Ln(X + hb, 420, X + hb, 400 - Math.sin((hb - 600) / 320 * Math.PI) * 40 + 20, 1, .6); TX('Fremont Bridge', X + 760, 350, 12);
        if (!nt) S([[X + 1000, 400], [X + 1100, 280], [X + 1200, 400]], 2, .55); S([[X + 1072, 312], [X + 1100, 290], [X + 1128, 312]], 1.4, .55);
        for (var tr = 0; tr < 4; tr++){ var tx = X + 1240 + tr * 36; S([[tx, 460], [tx - 16, 460], [tx, 400], [tx + 16, 460], [tx, 460]], 1.6); }
      } else if (look === 'nyc'){ /* brownstones with stoops and fire escapes, water towers, the Empire State Building far off */
        S([[X + 900, 460], [X + 900, 160], [X + 916, 120], [X + 932, 120], [X + 948, 160], [X + 948, 460]], 1.8, .6); Ln(X + 924, 120, X + 924, 70, 1.6, .6); TX('Empire State', X + 924, 60, 12);
        for (var b = 0; b < 6; b++){ var hx = X + b * 150, top = 230 + (b % 3) * 20; R(hx, top, 140, 460 - top, 2, P); WASH(hx + 70, 340, 60, 100, COL.rose, .18, 70 + b);
          for (var fl = top + 20; fl < 420; fl += 46){ win(hx + 18, fl, 24, 30, ++n); win(hx + 58, fl, 24, 30, ++n); win(hx + 98, fl, 24, 30, ++n); }
          S([[hx + 4, top - 10], [hx + 136, top - 10]], 2.4); if (b % 2){ R(hx + 50, top - 52, 36, 32, 1.6, P); S([[hx + 46, top - 52], [hx + 68, top - 72], [hx + 90, top - 52]], 1.6); Ln(hx + 56, top - 20, hx + 54, top - 10, 1.4); Ln(hx + 80, top - 20, hx + 82, top - 10, 1.4); }
          for (var fe = top + 46; fe < 400; fe += 46){ S([[hx + 92, fe + 32], [hx + 132, fe + 32]], 1.4); Ln(hx + 96, fe + 32, hx + 128, fe, 1, .6); } }
      } else if (look === 'me'){ /* brick Old Port buildings, the harbor, Portland Head Light */
        for (var m = 0; m < 5; m++){ var mx = X + m * 170, mt = 280 + (m % 2) * 30; R(mx, mt, 160, 460 - mt, 2, P); WASH(mx + 80, 380, 70, 70, COL.rose, .26, 80 + m); for (var by = mt + 10; by < 450; by += 10) Ln(mx + 2, by, mx + 158, by, .8, .18); for (var mw = mt + 20; mw < 420; mw += 40){ win(mx + 22, mw, 26, 26, ++n); win(mx + 66, mw, 26, 26, ++n); win(mx + 110, mw, 26, 26, ++n); } }
        WASH(X + 1100, 440, 250, 22, COL.sky, .4, 85); for (var wv = 0; wv < 8; wv++) S([[X + 900 + wv * 50, 444], [X + 912 + wv * 50, 438], [X + 924 + wv * 50, 444]], 1.2, .6);
        S([[X + 1180, 430], [X + 1190, 300], [X + 1210, 300], [X + 1220, 430]], 2); R(X + 1184, 282, 32, 18, 1.6, nt ? COL.sun : P); S([[X + 1180, 282], [X + 1200, 266], [X + 1220, 282]], 1.6); TX('Portland Head Light', X + 1200, 254, 12);
      } else if (look === 'fi'){ /* the Duomo and Giotto's bell tower over terracotta roofs, the Ponte Vecchio */
        ctx.fillStyle = P; ctx.beginPath(); ctx.ellipse(X + 400, 300, 90, 80, 0, Math.PI, 0); ctx.fill(); S([[X + 310, 300], [X + 330, 250], [X + 370, 224], [X + 400, 220], [X + 430, 224], [X + 470, 250], [X + 490, 300]], 2.2); WASH(X + 400, 268, 80, 40, COL.rose, .45, 90); for (var rb = 330; rb <= 470; rb += 28) S([[X + rb, 300], [X + 400 + (rb - 400) * .3, 226]], 1, .5); R(X + 392, 196, 16, 26, 1.6, P); S([[X + 300, 300], [X + 500, 300]], 2);
        R(X + 300, 300, 200, 160, 2, P); for (var dw = 312; dw < 490; dw += 28) S([[X + dw, 360], [X + dw, 330], [X + dw + 12, 322], [X + dw + 24, 330], [X + dw + 24, 360]], 1.2, .6);
        R(X + 560, 170, 40, 290, 2, P); for (var gt = 190; gt < 450; gt += 50) R(X + 568, gt, 24, 30, 1.2, null); S([[X + 556, 170], [X + 604, 170]], 2.4); TX('Duomo', X + 400, 186, 13); TX('Giotto’s tower', X + 580, 160, 12);
        for (var rf = 0; rf < 7; rf++){ var rx2 = X + 660 + rf * 90; R(rx2, 360, 80, 100, 1.6, P); S([[rx2 - 6, 360], [rx2 + 40, 340], [rx2 + 86, 360]], 1.8); WASH(rx2 + 40, 352, 40, 8, COL.rose, .5, 91 + rf); }
        S([[X + 1300, 430], [X + 1300, 380], [X + 1560, 380], [X + 1560, 430]], 2); for (var pv = 0; pv < 3; pv++) S([[X + 1310 + pv * 84, 430], [X + 1330 + pv * 84, 400], [X + 1370 + pv * 84, 400], [X + 1390 + pv * 84, 430]], 1.6); TX('Ponte Vecchio', X + 1430, 370, 12);
      } else if (look === 'ab'){ /* a hill town of stone under the Gran Sasso, the castle on the ridge */
        S([[X - 100, 460], [X + 200, 200], [X + 300, 240], [X + 420, 150], [X + 560, 260], [X + 800, 460]], 2.2); WASH(X + 420, 200, 70, 40, COL.paper, .9, 93); TX('Gran Sasso', X + 420, 130, 12);
        R(X + 260, 236, 50, 40, 1.8, P); R(X + 300, 220, 22, 56, 1.8, P); TX('Rocca Calascio', X + 290, 210, 11);
        for (var h2 = 0; h2 < 9; h2++){ var hx2 = X + 820 + (h2 % 5) * 100, hy2 = 360 - Math.floor(h2 / 5) * 70 - (h2 % 2) * 14; R(hx2, hy2, 84, 460 - hy2, 1.8, P); H(hx2 + 2, hy2 + 2, 80, 40, 9, .12); win(hx2 + 30, hy2 + 20, 20, 24, ++n); S([[hx2 - 4, hy2], [hx2 + 42, hy2 - 18], [hx2 + 88, hy2]], 1.6); }
      } else if (look === 'van'){ /* glass towers, the North Shore mountains, the Lions Gate Bridge over the water */
        S([[X - 50, 400], [X + 150, 220], [X + 300, 300], [X + 460, 200], [X + 700, 400]], 2, .7); WASH(X + 460, 220, 40, 20, COL.paper, .9, 95);
        WASH(X + 500, 440, 500, 22, COL.sky, .4, 96); S([[X + 800, 420], [X + 1300, 420]], 2); R(X + 900, 330, 12, 90, 1.6, P); R(X + 1200, 330, 12, 90, 1.6, P); S([[X + 800, 410], [X + 906, 334], [X + 1050, 400], [X + 1206, 334], [X + 1300, 410]], 1.4); TX('Lions Gate Bridge', X + 1050, 320, 12);
        [[0, 200, 50], [70, 160, 44], [130, 240, 40], [190, 180, 46], [600, 220, 44], [660, 170, 38]].forEach(function(t){ R(X + t[0], t[1], t[2], 460 - t[1], 1.6, P); WASH(X + t[0] + t[2] / 2, 330, t[2] / 2, 90, COL.sky, .25, 97 + t[0]); for (var g2 = t[1] + 10; g2 < 450; g2 += 14) Ln(X + t[0] + 4, g2, X + t[0] + t[2] - 4, g2, .8, nt ? .9 : .3, nt && (g2 / 14 | 0) % 3 === 0 ? COL.sun : null); });
      } else { /* the Northwest: firs and the Columbia River Gorge */
        S([[X - 100, 460], [X + 80, 260], [X + 260, 290], [X + 420, 240], [X + 620, 460]], 2.2); WASH(X + 520, 446, 300, 18, COL.sky, .4, 98); TX('Columbia River Gorge', X + 260, 230, 12);
        for (var ft = 0; ft < 14; ft++){ var fx2 = X + 660 + ft * 52, fh = 80 + (ft * 37) % 60; S([[fx2, 460], [fx2 - 22, 460], [fx2, 460 - fh], [fx2 + 22, 460], [fx2, 460]], 1.6); WASH(fx2, 460 - fh / 2, 14, fh / 2, COL.leaf, .3, 99 + ft); }
      }
    }
    ctx.restore();
  }
  /* the ground of each street: gravel and string lights in Portland's pods; sidewalks, cobbles or boardwalk elsewhere */
  function ground(c, lo, hi, nt){
    var a = Math.max(lo, c.a - 40), b = Math.min(hi, c.b + 40), look = c.c.look;
    S([[a, FLOOR], [b, FLOOR]], 2.6); H(a, FLOOR + 4, b - a, 80, 14, .14);
    if (look === 'fi' || look === 'ab'){ for (var cb = Math.floor(a / 22) * 22; cb < b; cb += 22){ S([[cb, FLOOR + 10], [cb + 16, FLOOR + 10]], 1, .45); S([[cb + 11, FLOOR + 22], [cb + 27, FLOOR + 22]], 1, .45); } }
    else if (look === 'pdx' || look === 'nw'){ for (var g = Math.floor(a / 26) * 26; g < b; g += 26) O(g + (g * 7) % 13, FLOOR + 14 + (g * 3) % 30, 1.4, 1, null, .4); }
    else { S([[a, FLOOR + 14], [b, FLOOR + 14]], 1.2, .5); for (var sw = Math.floor(a / 90) * 90; sw < b; sw += 90) Ln(sw, FLOOR, sw - 10, FLOOR + 14, 1, .4); }
  }
  function stringLights(from, to, nt){ var pts = []; for (var j = 0; j <= 12; j++){ var t = j / 12; pts.push([from + t * (to - from), 214 + Math.sin(t * Math.PI) * 30]); } S(pts, 1.2, .8);
    for (var bl = 1; bl < 12; bl++){ var bt = bl / 12, bx = from + bt * (to - from), by = 220 + Math.sin(bt * Math.PI) * 30; if (nt) WASH(bx, by + 4, 10, 10, COL.sun, .7, bl); O(bx, by + 4, 3.5, 1.2, nt ? COL.sun : COL.paper); } }
  /* the gate into each city: its sign and the subway steps up from the last city */
  function gate(c, lo, hi, nt){
    var x0 = c.a, P = COL.paper; if (x0 + GATE < lo || x0 > hi) return;
    if (c.i > 0){ /* coming up out of the subway */ S([[x0 + 30, FLOOR], [x0 + 30, 420], [x0 + 170, 420], [x0 + 170, FLOOR]], 2.2); S([[x0 + 22, 420], [x0 + 178, 420]], 2.6); O(x0 + 40, 404, 9, 1.8, COL.leaf); O(x0 + 160, 404, 9, 1.8, COL.leaf); for (var st = 0; st < 4; st++) Ln(x0 + 44 + st * 3, 446 + st * 22, x0 + 156 - st * 3, 446 + st * 22, 1.4, .8 - st * .15); }
    R(x0 + 230, 300, 260, 64, 2.6, P); WASH(x0 + 360, 332, 120, 26, c.c.col, .22, 100 + c.i); bullet(x0 + 262, 332, 20, c.c.bul, c.c.col);
    ctx.fillStyle = COL.ink; ctx.font = '700 17px ' + MONO; fitText(c.c.sign, x0 + 376, 330, 196); ctx.font = '11px ' + MONO; fitText(c.spots.length + (c.spots.length === 1 ? ' spot' : ' spots'), x0 + 376, 350, 196);
    Ln(x0 + 260, 364, x0 + 260, FLOOR, 2.2); Ln(x0 + 460, 364, x0 + 460, FLOOR, 2.2);
  }
  /* the way down at the end of each street: the subway to the next city, with its route bullet */
  function exitTo(c, lo, hi){
    var nx = cities[c.i + 1], x0 = c.b - 250, P = COL.paper; if (x0 + 300 < lo || x0 > hi) return;
    if (!nx){ R(x0 + 20, 300, 200, 44, 2, P); ctx.fillStyle = COL.ink; ctx.font = '700 12px ' + MONO; fitText('BACK TO THE STREET →', x0 + 120, 327, 180); Ln(x0 + 40, 344, x0 + 40, FLOOR, 2.2); Ln(x0 + 200, 344, x0 + 200, FLOOR, 2.2); return; }
    S([[x0 + 40, FLOOR], [x0 + 40, 420], [x0 + 200, 420], [x0 + 200, FLOOR]], 2.2); S([[x0 + 32, 420], [x0 + 208, 420]], 2.6); O(x0 + 50, 404, 9, 1.8, COL.leaf); O(x0 + 190, 404, 9, 1.8, COL.leaf);
    R(x0 + 46, 428, 148, 26, 1.8, P); bullet(x0 + 62, 441, 10, nx.c.bul, nx.c.col); ctx.fillStyle = COL.ink; ctx.font = '700 10px ' + MONO; fitText('TO ' + nx.c.short.toUpperCase(), x0 + 128, 445, 108);
    ctx.fillStyle = COL.ink; ctx.globalAlpha = .1; ctx.fillRect(x0 + 50, 458, 140, FLOOR - 458); ctx.globalAlpha = 1;
  }
  function bullet(x0, y0, r, t, col){ ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0, y0, r, 0, 6.3); ctx.fill(); O(x0, y0, r, 1.8, null); ctx.fillStyle = (col === '#FCCC0A' || col === '#6CBE45') ? COL.ink : '#fff'; ctx.font = '800 ' + Math.round(r * 1.1) + 'px "Bricolage Grotesque",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t, x0, y0 + r * .4); }

  /* ---------- one spot ---------- */
  var ACOL = ['sun', 'rose', 'leaf', 'sky'];
  function spot(s, lit, nt){
    var P = COL.paper, x0 = s.x, y = FLOOR, k = s.kind, col = COL[ACOL[(s.j + s.city.i) % 4]], look = s.city.c.look, signY, signW = 150;
    if (lit) WASH(x0, y - 90, 100, 100, COL.sun, .26, 200 + s.j);
    ctx.save(); if (s.closed) ctx.globalAlpha = .55;
    if (k === 'cart'){ R(x0 - 74, y - 132, 148, 100, 2.2, P); R(x0 - 54, y - 112, 92, 40, 1.6, nt ? COL.sun : null); R(x0 - 62, y - 72, 116, 6, 1.6, P);
      for (var a = 0; a < 6; a++){ var ax = x0 - 80 + a * 26.7; S([[ax, y - 140], [ax + 13, y - 128], [ax + 26.7, y - 140]], 1.6); } WASH(x0, y - 136, 76, 8, col, .55, 210 + s.j); S([[x0 - 80, y - 140], [x0 + 80, y - 140]], 1.8);
      O(x0 - 44, y - 18, 13, 2, P); O(x0 + 44, y - 18, 13, 2, P); signY = y - 176; }
    else if (k === 'ice'){ R(x0 - 50, y - 100, 100, 70, 2.2, P); Ln(x0, y - 100, x0, y - 200, 1.8); S([[x0 - 70, y - 186], [x0, y - 214], [x0 + 70, y - 186], [x0 - 70, y - 186]], 2); WASH(x0, y - 196, 60, 12, col, .5, 220 + s.j);
      S([[x0 - 12, y - 64], [x0, y - 40], [x0 + 12, y - 64]], 1.6); O(x0, y - 70, 10, 1.6, COL.rose); O(x0 - 40, y - 18, 12, 2, P); O(x0 + 40, y - 18, 12, 2, P); signY = y - 240; }
    else if (k === 'hall'){ R(x0 - 84, y - 230, 168, 230, 2.4, P); for (var cc = -64; cc <= 64; cc += 32) R(x0 + cc - 6, y - 196, 12, 196, 1.4, nt ? COL.sun : null); S([[x0 - 92, y - 230], [x0 + 92, y - 230]], 2.6); signY = y - 266; }
    else { /* a storefront: café, bakery, pizzeria, bar, noodle shop, market, or plain */
      var top = look === 'nyc' ? y - 210 : look === 'fi' || look === 'ab' ? y - 200 : y - 190;
      R(x0 - 78, top, 156, y - top, 2.2, P);
      if (look === 'fi' || look === 'ab') H(x0 - 76, top + 2, 152, 40, 10, .1);
      if (look === 'me') for (var br = top + 10; br < y; br += 10) Ln(x0 - 76, br, x0 + 76, br, .8, .18);
      R(x0 - 62, top + 70, 80, y - top - 86, 1.8, nt ? COL.sun : null); R(x0 + 28, top + 70, 34, y - top - 70, 1.8, P); O(x0 + 34, y - 54, 2, 1.2, COL.ink);
      if (look === 'fi' || look === 'ab'){ R(x0 - 50, top + 16, 20, 28, 1.4, null); R(x0 + 30, top + 16, 20, 28, 1.4, null); Ln(x0 - 40, top + 16, x0 - 40, top + 44, 1, .5); Ln(x0 + 40, top + 16, x0 + 40, top + 44, 1, .5); }
      /* awning */
      S([[x0 - 84, top + 52], [x0 + 84, top + 52], [x0 + 72, top + 70], [x0 - 72, top + 70], [x0 - 84, top + 52]], 1.8); WASH(x0, top + 61, 76, 8, col, .55, 230 + s.j);
      /* a picture of what they serve, in the window */
      var wx = x0 - 22, wy = top + 104;
      if (k === 'cafe'){ S([[wx - 12, wy - 8], [wx - 10, wy + 10], [wx + 10, wy + 10], [wx + 12, wy - 8], [wx - 12, wy - 8]], 1.8); S([[wx + 12, wy - 4], [wx + 18, wy], [wx + 12, wy + 4]], 1.4); if (!still()) S([[wx - 4, wy - 14 - (I.T * 8) % 6], [wx, wy - 20 - (I.T * 8) % 6], [wx - 4, wy - 26 - (I.T * 8) % 6]], 1, .6); }
      else if (k === 'bakery'){ S([[wx - 18, wy + 6], [wx - 12, wy - 8], [wx + 12, wy - 8], [wx + 18, wy + 6], [wx - 18, wy + 6]], 1.8, 1, null); for (var sc = -8; sc <= 8; sc += 8) Ln(wx + sc - 3, wy - 4, wx + sc + 3, wy + 2, 1.2); }
      else if (k === 'pizza'){ O(wx, wy, 16, 1.8, COL.sun); O(wx - 6, wy - 4, 3, 1, COL.rose); O(wx + 6, wy + 2, 3, 1, COL.rose); O(wx, wy + 8, 3, 1, COL.rose); }
      else if (k === 'bar'){ S([[wx - 14, wy - 12], [wx + 2, wy - 12], [wx - 6, wy + 2], [wx - 14, wy - 12]], 1.6); Ln(wx - 6, wy + 2, wx - 6, wy + 12, 1.4); Ln(wx - 12, wy + 12, wx, wy + 12, 1.4); S([[wx + 8, wy - 14], [wx + 8, wy + 12], [wx + 18, wy + 12], [wx + 18, wy - 14]], 1.4); }
      else if (k === 'noodle'){ S([[wx - 16, wy - 2], [wx - 12, wy + 10], [wx + 12, wy + 10], [wx + 16, wy - 2], [wx - 16, wy - 2]], 1.8); Ln(wx + 2, wy - 16, wx + 10, wy - 2, 1.2); Ln(wx + 6, wy - 16, wx + 12, wy - 2, 1.2); O(x0 - 70, top + 84, 7, 1.4, COL.rose); O(x0 + 70, top + 84, 7, 1.4, COL.rose); }
      else if (k === 'market'){ for (var cr = 0; cr < 3; cr++){ R(wx - 18 + cr * 13, wy - 2, 12, 12, 1.2, null); O(wx - 12 + cr * 13, wy - 6, 4, 1, [COL.rose, COL.leaf, COL.sun][cr]); } }
      else { S([[wx - 14, wy + 4], [wx + 14, wy + 4]], 1.8); S([[wx - 12, wy + 4], [wx - 8, wy - 8], [wx + 8, wy - 8], [wx + 12, wy + 4]], 1.6); Ln(wx, wy - 8, wx, wy - 12, 1.4); }
      if (look === 'pdx' && s.j % 12 < 6) { /* in the pods, string lights from the cart roofs */ }
      signY = top - 36;
    }
    /* the sign with its name */
    R(x0 - signW / 2, signY, signW, 28, lit ? 2.8 : 2, nt ? COL.sun : P); ctx.fillStyle = COL.ink; ctx.font = '700 11px ' + MONO; fitText(s.name, x0, signY + 18, signW - 14);
    if (k === 'cart' || k === 'ice'){ Ln(x0 - signW / 2 + 16, signY + 28, x0 - signW / 2 + 16, signY + 36, 1.4); Ln(x0 + signW / 2 - 16, signY + 28, x0 + signW / 2 - 16, signY + 36, 1.4); }
    ctx.restore();
    if (s.vegan){ O(x0 + signW / 2 - 4, signY - 2, 11, 1.6, COL.leaf); S([[x0 + signW / 2 - 9, signY], [x0 + signW / 2 - 4, signY - 7], [x0 + signW / 2 + 1, signY]], 1.2); }
    if (s.closed || s.maybe){ ctx.save(); ctx.translate(x0, signY + 52); ctx.rotate(-.12); R(-46, -12, 92, 22, 2, COL.paper); ctx.fillStyle = COL.ink; ctx.font = '700 11px ' + MONO; ctx.textAlign = 'center'; ctx.fillText(s.closed ? 'CLOSED' : 'MAY BE CLOSED', 0, 3); ctx.restore(); }
  }

  /* ---------- the clickable layer and the list ---------- */
  var openA = document.createElement('a'); openA.className = 'obj now'; openA.target = '_blank'; openA.rel = 'noopener'; openA.innerHTML = '<span class="l"></span><span class="go" aria-hidden="true">Maps ↗</span>'; hot.appendChild(openA);
  var labelEl = openA.querySelector('.l'), hoverS = null;
  var hits = spots.map(function(s){ var a = document.createElement('a'); a.className = 'hit'; a.href = s.href; a.target = '_blank'; a.rel = 'noopener'; a.tabIndex = -1; a.setAttribute('aria-label', s.name + ', ' + s.city.c.short + ': open on Google Maps');
    a.addEventListener('mouseenter', function(){ hoverS = s; }); a.addEventListener('mouseleave', function(){ if (hoverS === s) hoverS = null; }); hot.appendChild(a); return a; });
  /* the side list: the current city's spots; picking one walks you there */
  var sideList = document.getElementById('podList'), sideH = document.getElementById('podCity'), sideK = document.getElementById('podMeta'), shownCity = null;
  function fillSide(c){
    if (!sideList || shownCity === c) return; shownCity = c; sideList.textContent = '';
    if (sideH) sideH.textContent = c.c.short === c.name ? c.name : c.name;
    c.spots.forEach(function(s){ var li = document.createElement('li'), b = document.createElement('button'), m = document.createElement('a');
      b.type = 'button'; b.textContent = s.name; b.addEventListener('click', function(){ goSpot(s); if (innerWidth <= 900) closeSide(); });
      m.href = s.href; m.target = '_blank'; m.rel = 'noopener'; m.className = 'mp'; m.textContent = 'Maps ↗'; m.setAttribute('aria-label', s.name + ' on Google Maps');
      li.appendChild(b); if (s.vegan){ var v = document.createElement('b'); v.className = 'ft vegan'; v.textContent = 'Vegan'; li.appendChild(v); } if (s.closed || s.maybe){ var z = document.createElement('b'); z.className = 'ft shut'; z.textContent = s.closed ? 'Closed' : 'May have closed'; li.appendChild(z); if (s.closed) li.classList.add('closed'); }
      li.appendChild(m); s.row = li; sideList.appendChild(li); });
  }
  var listBtn = document.getElementById('podListBtn');
  function closeSide(){ document.documentElement.classList.remove('side-open'); if (listBtn) listBtn.setAttribute('aria-expanded', 'false'); }
  if (listBtn) listBtn.addEventListener('click', function(){ var on = !document.documentElement.classList.contains('side-open'); document.documentElement.classList.toggle('side-open', on); listBtn.setAttribute('aria-expanded', String(on)); });
  addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSide(); });

  /* ---------- Back / Next: city to city; arrow keys: spot to spot ---------- */
  var nextB = document.getElementById('stripNext'), prevB = document.getElementById('stripPrev'), nextL = document.getElementById('nextCity'), prevL = document.getElementById('prevCity'), countEl = document.getElementById('stripCount');
  if (nextB) nextB.addEventListener('click', function(){ var c = cityAt(ut), n = cities[c.i + 1]; if (n) goCity(n); else location.href = nextB.dataset.end; });
  if (prevB) prevB.addEventListener('click', function(){ var c = cityAt(ut), p = cities[c.i - 1]; if (figX(ut) > c.a + 400) goCity(c); else if (p) goCity(p); else location.href = prevB.dataset.end; });
  addEventListener('keydown', function(e){ if (document.querySelector('dialog[open]') || /input|textarea/i.test(e.target.tagName || '')) return;
    var cur = spotAt(ut), i = cur ? spots.indexOf(cur) : -1, fx = figX(ut);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); var n = i >= 0 ? spots[i + 1] : spots.find(function(s){ return s.x - STAND > fx; }); if (n) goSpot(n); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); var p = i >= 0 ? spots[i - 1] : spots.slice().reverse().find(function(s){ return s.x - STAND < fx; }); if (p) goSpot(p); } });

  /* ---------- frame ---------- */
  var skyEl = document.getElementById('stripSky');
  function frame(now){
    if (I.plain()){ requestAnimationFrame(frame); return; }
    I.tick(now); size();
    var prev = u; u = still() ? ut : lerp(u, ut, .14); if (Math.abs(u - ut) < .3) u = ut;
    var fx = figX(u), moving = Math.abs(u - prev) > .15; if (u - prev > .15) face = 1; else if (prev - u > .15) face = -1;
    camX = fx + (cw - sideW()) * .12 / K;
    var c = cityAt(u), sp = spotAt(u), lit = hoverS || sp;
    fillSide(c);
    /* draw */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, cw, ch);
    I.use(ctx);
    var p0 = toScreen(0, 0); ctx.setTransform(dpr * K, 0, 0, dpr * K, dpr * p0[0], dpr * p0[1]);
    var lo = camX - (cw / 2 + 200) / K, hi = camX + (cw / 2 + 200) / K;
    cities.forEach(function(ci){
      if (ci.b + 300 < lo || ci.a - 300 > hi) return;
      ctx.save(); ctx.beginPath(); ctx.rect(ci.a, -600, (ci.i === cities.length - 1 ? END + 400 : ci.b) - ci.a, 1400); ctx.clip();
      var kw = sky(ci, Math.max(lo, ci.a), Math.min(hi, ci.b));
      backdrop(ci, lo, hi, kw.nt); ground(ci, lo, hi, kw.nt);
      if (ci.c.look === 'pdx'){ for (var pod = 0; pod * 12 < ci.spots.length; pod++){ var s0 = ci.spots[pod * 12], s1 = ci.spots[Math.min(ci.spots.length - 1, pod * 12 + 11)]; if (s1.x + 100 < lo || s0.x - 100 > hi) continue; stringLights(s0.x - 90, s1.x + 90, kw.nt); Ln(s0.x - 96, FLOOR, s0.x - 96, 206, 2.2); Ln(s1.x + 96, FLOOR, s1.x + 96, 206, 2.2); if (pod){ var cwx = s0.x - 225; for (var z = 0; z < 6; z++) R(cwx - 60 + z * 22, FLOOR + 6, 12, 50, 1, COL.paper); R(cwx - 20, 300, 60, 18, 1.4, COL.paper); TX('WALK', cwx + 10, 313, 10, 'center', MONO); Ln(cwx + 10, 318, cwx + 10, FLOOR, 1.6); } } }
      gate(ci, lo, hi, kw.nt);
      ci.spots.forEach(function(s){ if (s.x + 110 < lo || s.x - 110 > hi) return; spot(s, s === lit, kw.nt); });
      exitTo(ci, lo, hi);
      weatherFront(ci, lo, hi, kw);
      ctx.restore();
    });
    /* the figure, to scale, with an umbrella in the rain and a cup in the cold */
    var w = wxOf(c), wet = w && (w.kind === 'rain' || w.kind === 'drizzle' || w.kind === 'storm');
    var f = { x: 0, y: 0, mode: moving ? 'walk' : (sp ? 'point' : 'stand'), ph: fx * .035, face: moving ? face : 1, smile: !!sp, umbrella: wet, mug: !wet && !moving && !sp && w && w.tempF < 50, breath: w && w.tempF <= 40, wind: w ? Math.min(1, w.wind / 25) : .2 };
    if (w && w.kind === 'snow' && !moving && !sp) f.mode = 'shiver';
    if (sp && !moving) f.look = { x: (sp.x - fx) / ZOOM, y: -170 / ZOOM };
    ctx.save(); ctx.translate(fx, FLOOR); ctx.scale(ZOOM, ZOOM); I.pen(1 / ZOOM); FIG(f); I.pen(1); ctx.restore();
    /* the hot layer */
    spots.forEach(function(s, i){ var a = toScreen(s.x - 84, FLOOR - 250), b = toScreen(s.x + 84, FLOOR), h = hits[i], on = b[0] > sideW() && a[0] < cw;
      h.style.left = a[0] + 'px'; h.style.top = a[1] + 'px'; h.style.width = (b[0] - a[0]) + 'px'; h.style.height = (b[1] - a[1]) + 'px'; h.style.visibility = on ? 'visible' : 'hidden'; });
    if (lit){ var top = toScreen(lit.x, FLOOR - (lit.kind === 'hall' ? 270 : lit.kind === 'ice' ? 246 : lit.kind === 'cart' ? 182 : lit.city.c.look === 'nyc' ? 252 : 232));
      var t = lit.name + (lit.vegan ? ' · vegan' : '') + (lit.closed ? ' · closed' : lit.maybe ? ' · may have closed' : '');
      if (labelEl.textContent !== t) labelEl.textContent = t; openA.href = lit.href; openA.setAttribute('aria-label', lit.name + ': open on Google Maps');
      var half = openA.offsetWidth / 2; openA.style.left = Math.max(sideW() + half + 8, Math.min(cw - half - 8, top[0])) + 'px'; openA.style.top = Math.max(topH + openA.offsetHeight + 6, top[1]) + 'px'; openA.style.visibility = 'visible';
    } else openA.style.visibility = 'hidden';
    shownCity && shownCity.spots.forEach(function(s){ if (s.row){ var on = s === sp; if (s.row.classList.contains('here') !== on){ s.row.classList.toggle('here', on); if (on && innerWidth > 900) s.row.scrollIntoView({ block: 'nearest' }); } } });
    if (countEl){ var t2 = c.c.short + (sp ? ' · ' + (sp.j + 1) + ' of ' + c.spots.length : ' · ' + c.spots.length + (c.spots.length === 1 ? ' spot' : ' spots')); if (countEl.textContent !== t2) countEl.textContent = t2; }
    var nx = cities[c.i + 1], pv = cities[c.i - 1]; if (nextL){ var nt2 = nx ? nx.c.short : 'The street'; if (nextL.textContent !== nt2) nextL.textContent = nt2; } if (prevL){ var pt = figX(ut) > c.a + 400 ? 'Start of ' + c.c.short : pv ? pv.c.short : 'The street'; if (prevL.textContent !== pt) prevL.textContent = pt; }
    if (skyEl){ var t3 = c.c.short + (w ? ' now · ' + w.tempF + '°F · ' + I.WORDS[w.kind] + (w.day ? '' : ' · night') : ''); if (skyEl.textContent !== t3) skyEl.textContent = t3; }
    if (sideK){ var t4 = c.spots.length + (c.spots.length === 1 ? ' spot' : ' spots') + (w ? ' · ' + w.tempF + '°F, ' + I.WORDS[w.kind] : ''); if (sideK.textContent !== t4) sideK.textContent = t4; }
    if (fade > 0){ ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = Math.min(1, fade * 1.4); ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1; fade = Math.max(0, fade - .06); }
    requestAnimationFrame(frame);
  }
  size(); setLen(); addEventListener('resize', function(){ size(); setLen(); });
  var hc = decodeURIComponent((location.hash || '').slice(1)), start = cities.find(function(ci){ return ci.c.look === hc; });
  if (start) goCity(start, true); else readScroll();
  requestAnimationFrame(frame);
  window.InkPod = { cities: cities, spots: spots, goCity: goCity, goSpot: goSpot };
})();
