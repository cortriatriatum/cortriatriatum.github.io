/* Small looping ink drawings (300 x 200 world units) for any page: <canvas class="vig" data-vig="name">.
   Only drawings on screen are drawn; none in Plain mode; reduced motion gets still frames.
   On hover the figure stops and looks at you. */
(function(){
  'use strict';
  var I = window.Ink; if (!I) return;
  var S = I.S, Ln = I.Ln, O = I.O, R = I.R, H = I.H, TX = I.TX, WASH = I.WASH, FIG = I.FIG, ease = I.ease, cl = I.cl, lerp = I.lerp, back = I.back, COL = I.COL;
  var MONO = '"JetBrains Mono",monospace';
  /* ================= section drawings (300 x 200) ================= */
  function books(x, y){ var lab = ['BE', 'PhD', 'MD']; for (var i = 0; i < 3; i++){ var bw = 86 - i * 8, bx = x - bw / 2 + (i % 2 ? 4 : -3); R(bx, y - 14 * (i + 1), bw, 14, 2, COL.paper); TX(lab[i], x + (i % 2 ? 4 : -3), y - 14 * i - 3, 11, 'center', MONO); } }
  var VIG = {
    lost: function(T, lk, hov){
      WASH(170, 110, 90, 60, COL.rose, .26, 8);
      Ln(170, 176, 170, 70, 2.4); R(110, 44, 120, 40, 2.4, COL.paper); TX('NOT IN SERVICE', 170, 70, 15, 'center', MONO);
      var f = { x: 92, y: 176, mode: hov || lk ? 'wave' : 'scratch', face: 1, look: lk || { x: 170, y: 60 }, smile: !!(hov || lk) };
      FIG(f); S([[0, 176], [300, 176]], 2);
    },
    desk: function(T, lk, hov){
      WASH(150, 140, 110, 44, COL.sun, .26, 9);
      R(150, 132, 120, 8, 2, COL.paper); Ln(160, 140, 160, 176, 2); Ln(260, 140, 260, 176, 2);
      R(196, 118, 40, 14, 1.8, COL.paper); for (var i = 0; i < 3; i++) Ln(200, 122 + i * 3, 228, 122 + i * 3, 1, .5);
      S([[262, 132], [262, 92], [244, 80]], 2); S([[236, 70], [252, 84], [262, 74], [246, 62], [236, 70]], 1.8); WASH(250, 100, 26, 30, COL.sun, .3, 10);
      R(118, 150, 34, 6, 1.8, COL.paper); Ln(122, 156, 122, 176, 1.8); Ln(148, 156, 148, 176, 1.8);
      var f = { x: 140, y: 176, mode: lk || hov ? 'sit' : 'write', face: 1, seat: 26, look: lk, smile: !!lk };
      FIG(f); S([[0, 176], [300, 176]], 2);
    },
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
    /* Notes: writing at a little table; now and then an idea lights up over the page */
    notebook: function(T, lk, hov){
      var u = T % 6;
      WASH(170, 140, 90, 40, COL.sun, .26, 11);
      R(130, 140, 120, 8, 2, COL.paper); Ln(140, 148, 140, 176, 2); Ln(240, 148, 240, 176, 2);
      S([[150, 140], [156, 124], [206, 124], [210, 140]], 2); Ln(180, 125, 180, 140, 1.2, .6);
      var lines = I.reduce.matches ? 4 : Math.floor(u * 1.4) % 5;
      for (var i = 0; i < lines; i++) Ln(158 + i * 2, 128 + i * 3, 176, 128 + i * 3, 1, .55);
      R(92, 150, 30, 6, 1.8, COL.paper); Ln(96, 156, 96, 176, 1.8); Ln(118, 156, 118, 176, 1.8);
      var idea = u > 4 && u < 5.6;
      var f = { x: 110, y: 176, mode: idea || hov ? 'sit' : 'write', face: 1, seat: 20, look: idea ? { x: 180, y: 60 } : lk, smile: idea || !!lk };
      FIG(f);
      if (idea){ var k = back(cl((u - 4) / .3, 0, 1)), c = I.ctx; c.save(); c.translate(180, 64); c.scale(k, k);
        O(0, 0, 14, 2, COL.sun); Ln(-5, 16, 5, 16, 1.6); Ln(-4, 21, 4, 21, 1.6);
        for (var r = 0; r < 6; r++){ var a = r / 6 * 6.283; Ln(Math.cos(a) * 20, Math.sin(a) * 20, Math.cos(a) * 27, Math.sin(a) * 27, 1.4); }
        c.restore(); }
      S([[0, 176], [300, 176]], 2);
    },
    /* Work & Service: walks in, hangs the coat with its badges on the rack, waves */
    coat: function(T, lk, hov){
      var u = T % 6;
      WASH(210, 110, 50, 70, COL.leaf, .26, 12);
      S([[210, 176], [210, 40]], 2.4); S([[186, 176], [210, 160], [234, 176]], 2); S([[210, 52], [190, 44]], 1.8); S([[210, 52], [230, 44]], 1.8);
      var hung = u >= 1.8, x = u < 1.2 ? lerp(30, 140, ease(u / 1.2)) : 140;
      function coat(cx, cy){ S([[cx, cy], [cx - 22, cy + 8], [cx - 28, cy + 60], [cx - 14, cy + 100], [cx + 14, cy + 100], [cx + 28, cy + 60], [cx + 22, cy + 8], [cx, cy]], 2, 1, null);
        [[-16, 40, 'OHSU'], [4, 62, 'CCNY']].forEach(function(b){ R(cx + b[0], cy + b[1], 18, 22, 1.4, COL.paper); TX(b[2], cx + b[0] + 9, cy + b[1] + 14, 5.5, 'center', MONO); }); }
      if (hung) coat(210, 56);
      var f = { x: x, y: 176, mode: u < 1.2 ? 'walk' : u < 1.8 ? 'point' : 'wave', ph: u * 9, face: 1, look: hung ? (lk || { x: 20, y: 60 }) : { x: 210, y: 60 }, smile: hung };
      if (hov && hung){ f.look = lk; }
      FIG(f);
      if (!hung){ var k = u < 1.2 ? 0 : (u - 1.2) / .6; if (k > 0){ var c = I.ctx; c.save(); c.translate(lerp(186, 210, k), lerp(90, 56, k)); c.scale(.6, .6); coat(0, 0); c.restore(); } }
      S([[0, 176], [300, 176]], 2);
    },
    /* Awards: a shelf of cups and medals; one shines when the figure looks up */
    shelf: function(T, lk, hov){
      var u = T % 5, c = I.ctx;
      WASH(205, 56, 95, 34, COL.sun, .3, 13);
      c.save(); c.translate(30, -20);
      R(80, 98, 190, 8, 2, COL.paper); Ln(100, 106, 106, 120, 1.6); Ln(250, 106, 244, 120, 1.6);
      S([[104, 98], [100, 70], [126, 70], [122, 98]], 2); O(113, 64, 9, 1.8, COL.sun);
      S([[146, 98], [146, 60], [176, 60], [176, 98]], 1.8); TX('2nd', 161, 84, 9, 'center', MONO);
      S([[196, 98], [204, 54], [224, 54], [232, 98]], 1.8); O(214, 46, 7, 1.6, COL.sun);
      R(244, 70, 22, 28, 1.6, COL.rose);
      var shine = u > 1.4 && u < 3.6;
      if (shine){ var k = Math.sin(cl((u - 1.4) / 2.2, 0, 1) * Math.PI); for (var r = 0; r < 8; r++){ var a = r / 8 * 6.283; Ln(214 + Math.cos(a) * 14, 46 + Math.sin(a) * 14, 214 + Math.cos(a) * (14 + 10 * k), 46 + Math.sin(a) * (14 + 10 * k), 1.4, k); } }
      c.restore();
      var f = { x: 70, y: 176, mode: shine ? 'point' : 'stand', face: 1, look: shine ? { x: 244, y: 26 } : (lk || { x: 200, y: 50 }), smile: shine || !!lk, surprise: shine && u < 1.7 };
      FIG(f); S([[0, 176], [300, 176]], 2);
    },
    /* Dev: typing at a laptop; the code on the screen grows, then a green check */
    laptop: function(T, lk, hov){
      var u = T % 6;
      WASH(190, 130, 80, 40, COL.sky, .26, 14);
      R(120, 140, 150, 8, 2, COL.paper); Ln(132, 148, 132, 176, 2); Ln(258, 148, 258, 176, 2);
      R(170, 132, 70, 8, 2, COL.paper); I.ctx.fillStyle = COL.paper; I.ctx.fillRect(176, 92, 58, 40); S([[174, 132], [178, 90], [234, 90], [236, 132]], 2.2);
      var done = u > 4.2, n = I.reduce.matches ? 4 : Math.min(4, Math.floor(u * 1.1));
      for (var k = 0; k < n; k++) Ln(184 + (k % 2) * 6, 100 + k * 7, 184 + (k % 2) * 6 + 14 + (k * 7) % 18, 100 + k * 7, 1.2, .7);
      if (done){ S([[196, 112], [203, 120], [218, 102]], 2.6, 1, COL.leaf); }
      R(76, 150, 30, 6, 1.8, COL.paper); Ln(80, 156, 80, 176, 1.8); Ln(102, 156, 102, 176, 1.8);
      var f = { x: 96, y: 176, mode: done || hov ? 'sit' : 'write', face: 1, seat: 20, look: done ? (lk || { x: 40, y: 50 }) : lk, smile: done || !!lk };
      FIG(f); S([[0, 176], [300, 176]], 2);
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


  var vigs = [].map.call(document.querySelectorAll('canvas[data-vig]'), function(cv){ return { cv: cv, ctx: cv.getContext('2d'), name: cv.dataset.vig, on: false, hov: false, still: cv.hasAttribute('data-still') }; });
  if (!vigs.length) return;
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ var v = vigs.find(function(v){ return v.cv === e.target; }); if (v) v.on = e.isIntersecting; }); }, { rootMargin: '80px' });
    vigs.forEach(function(v){ io.observe(v.cv); });
  } else vigs.forEach(function(v){ v.on = true; });
  vigs.forEach(function(v){ v.cv.addEventListener('pointerenter', function(){ v.hov = true; }); v.cv.addEventListener('pointerleave', function(){ v.hov = false; }); });
  var running = false;
  function frame(now){
    if (I.plain()){ running = false; return; }
    I.tick(now);
    vigs.forEach(function(v){ if (v.still && v.drawn) return; if (v.on && VIG[v.name] && I.fit(v.cv, v.ctx, 300, 200)){ I.use(v.ctx); if (v.still) I.tick(2000); VIG[v.name](v.still ? 2 : I.T, v.still ? null : I.lookIn(v.cv, 300, 200), v.still ? false : v.hov); if (v.still){ v.drawn = true; I.tick(now); } } });
    requestAnimationFrame(frame);
  }
  function start(){ if (!running && !I.plain()){ running = true; requestAnimationFrame(frame); } }
  document.addEventListener('plainchange', start);
  start();
})();
