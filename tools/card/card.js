/* Draws img/share.jpg with the site's ink engine (assets/ink.js) under Node.
   Needs @napi-rs/canvas and the four Google fonts in ./fonts (not in the repo). Usage: node card.js <repo> <out.jpg> */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const repo = process.argv[2], out = process.argv[3], F = path.join(__dirname, 'fonts');
GlobalFonts.registerFromPath(path.join(F, 'Bricolage_Grotesque_wght_800.ttf'), 'BG800');
GlobalFonts.registerFromPath(path.join(F, 'Bricolage_Grotesque_wght_600.ttf'), 'BG600');
GlobalFonts.registerFromPath(path.join(F, 'Literata_wght_400.ttf'), 'Literata');
GlobalFonts.registerFromPath(path.join(F, 'Patrick_Hand.ttf'), 'Patrick Hand');
GlobalFonts.registerFromPath(path.join(F, 'JetBrains_Mono_wght_500.ttf'), 'JetBrains Mono');
GlobalFonts.registerFromPath(path.join(F, 'JetBrains_Mono_wght_700.ttf'), 'JBM700');
const TOK = { paper: '#FFFFFF', ink: '#121212', soft: '#66665F', rule: '#E6E6E0', tint: '#F4F4EF', sky: '#8FB7DB', sun: '#F3C653', rose: '#EBA7A2', leaf: '#9FCBA8', pop: '#E2552E', night: '#2E4A6B' };
const root = { classList: { contains: () => false }, setAttribute() {}, getAttribute() { return null; } };
const sandbox = { window: {}, document: { documentElement: root }, getComputedStyle: () => ({ getPropertyValue: k => TOK[k.slice(2)] || '' }),
  matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} }, addEventListener() {}, performance: { now: () => 0 }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, Intl, Date, Math, JSON };
sandbox.window = sandbox; vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(repo, 'assets/ink.js'), 'utf8'), sandbox);
const I = sandbox.Ink, W = 1200, Hh = 630, cv = createCanvas(W, Hh), ctx = cv.getContext('2d');
(async () => {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, Hh); I.use(ctx); I.tick(2000);
  const { S, R, O, Ln, TX, WASH, H, COL } = I, mono = '"JetBrains Mono"';
  /* sky */
  WASH(1040, 88, 60, 60, COL.sun, .42, 7); O(1040, 88, 30, 2.4, COL.paper);
  for (let r = 0; r < 12; r++){ const a = r / 12 * 6.283; Ln(1040 + Math.cos(a) * 42, 88 + Math.sin(a) * 42, 1040 + Math.cos(a) * 56, 88 + Math.sin(a) * 56, 2); }
  [[700, 62], [300, 40]].forEach(c => { ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.ellipse(c[0] + 60, c[1], 64, 17, 0, 0, 6.3); ctx.fill(); S([[c[0], c[1] + 8], [c[0] + 22, c[1] - 10], [c[0] + 60, c[1] - 18], [c[0] + 98, c[1] - 6], [c[0] + 124, c[1] + 8], [c[0], c[1] + 8]], 1.8); });
  /* the street along the bottom: tram terminal and cable, Big Pink, the station */
  const GL = 572;
  Ln(92, 470, -10, 418, 1.4, .8); Ln(92, 478, -10, 426, 1.4, .8);
  R(30, 470, 124, GL - 470, 2.2, COL.paper); TX('AERIAL TRAM', 92, 498, 13, 'center', mono);
  [[770, 470, 40], [818, 440, 34], [1130, 460, 44], [1178, 492, 30]].forEach(b => { R(b[0], b[1], b[2], GL - b[1], 1.6, COL.paper); for (let y = b[1] + 14; y < GL - 8; y += 20) Ln(b[0] + 6, y, b[0] + b[2] - 6, y, 1, .4); });
  R(866, 392, 44, GL - 392, 2, COL.paper); WASH(888, 480, 22, 90, COL.rose, .5, 9); for (let y = 408; y < GL - 8; y += 16) Ln(872, y, 904, y, 1, .35);
  S([[940, GL], [940, 492], [1070, 492], [1070, GL]], 2.4); R(946, 500, 118, 22, 2, COL.paper); TX('STATION', 1005, 517, 15, 'center', mono); O(948, 476, 8, 1.8, COL.leaf); O(1062, 476, 8, 1.8, COL.leaf);
  S([[0, GL], [W, GL]], 2.6); H(0, GL + 4, W, 60, 12, .16);
  /* the headshot in an inked ring */
  const img = await loadImage(fs.readFileSync(path.join(repo, 'img/rick-1.webp')));
  WASH(220, 236, 150, 146, COL.rose, .3, 3);
  ctx.save(); ctx.beginPath(); ctx.arc(220, 236, 124, 0, 6.3); ctx.clip(); ctx.drawImage(img, 96, 112, 248, 248); ctx.restore();
  O(220, 236, 126, 3, null);
  /* name, role, address */
  ctx.fillStyle = COL.ink; ctx.textAlign = 'left';
  ctx.font = '78px BG800'; ctx.fillText('Rick Mathews, PhD', 400, 198);
  ctx.font = '30px Literata'; ctx.fillText('Physician-Scientist in Training', 404, 252); ctx.fillText('MD/PhD · Oregon Health & Science University', 404, 292);
  /* the four notes as inked route bullets */
  [['R', '#FCCC0A', '#121212'], ['A', '#0039A6', '#fff'], ['M', '#FF6319', '#fff'], ['S', '#808183', '#fff']].forEach((b, i) => { const x = 422 + i * 44, y = 352;
    ctx.fillStyle = b[1]; ctx.beginPath(); ctx.arc(x, y, 17, 0, 6.3); ctx.fill(); O(x, y, 17, 2.2, null); ctx.fillStyle = b[2]; ctx.font = '19px BG800'; ctx.textAlign = 'center'; ctx.fillText(b[0], x, y + 7); });
  ctx.fillStyle = COL.soft; ctx.textAlign = 'left'; ctx.font = '23px "JetBrains Mono"'; ctx.fillText('cortriatriatum.github.io', 608, 360);
  /* the figure, waving hello */
  ctx.save(); ctx.translate(700, GL); ctx.scale(1.55, 1.55); I.pen(1 / 1.55); I.FIG({ x: 0, y: 0, mode: 'wave', face: -1, smile: true, look: { x: -90, y: -70 } }); I.pen(1); ctx.restore();
  fs.writeFileSync(out, await cv.encode('jpeg', 88));
  console.log('wrote', out);
})();
