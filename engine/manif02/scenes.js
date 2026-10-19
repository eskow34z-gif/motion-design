/* MANIF02 — réaction à une charge place de la Bastille (17 octobre 2026). Système AFFICHE, intensité « dosée ».
   La vidéo est un tirage photo collé au mur ; elle se fige en sérigraphie sur 4 arrêts, chacun avec sa carte verdict. */
'use strict';
const Q = new URLSearchParams(location.search);
const TILE = Q.has('tile');
const K = TL.K, PHT = TL.ph;
const ps = i => PHT[i - 1][0], pe = i => PHT[i - 1][1];
const stage = document.getElementById('stage'), cam = document.getElementById('cam'), vign = document.getElementById('vign');
const IW = 855, IH = 1520, PW = 903, PH_ = 1568;          // image et tirage (bord papier 24 px)
const NFR = 792;

/* ——— temps source de la vidéo ——— */
function srcAt(t) {
  for (const [t0, t1, s0, s1] of TL.clip) if (t < t1) { const p = clamp((t - t0) / Math.max(1e-6, t1 - t0)); return s0 + (s1 - s0) * (s1 < s0 ? E.io2(p) : p); }
  const l = TL.clip[TL.clip.length - 1]; return l[3];
}
const frozenAt = t => TL.clip.some(([t0, t1, s0, s1]) => t >= t0 && t < t1 && s0 === s1 && t0 > 0.5);
const cache = new Map(), order = [];
function frame(i) {
  i = Math.max(1, Math.min(NFR, i));
  if (cache.has(i)) return cache.get(i);
  const im = new Image(); im.src = `clip/${String(i).padStart(4, '0')}.jpg`;
  const pr = im.decode().then(() => im, () => im);
  cache.set(i, pr); order.push(i); if (order.length > 40) cache.delete(order.shift());
  return pr;
}

/* ——— outils ——— */
function slamS(t, t0, from = 1.35, d = 0.07) {
  if (t < t0 - d) return null;
  if (t < t0) return lerp(from, 1, E.in3(P(t, t0 - d, t0)));
  return 1 - 0.03 * Math.exp(-(t - t0) * 14) * Math.cos((t - t0) * 40);
}
function setSlam(e, t, t0, rot = 0, from = 1.35, x = 0, y = 0) { const s = slamS(t, t0, from); if (s === null) { op(e, 0); return; } op(e, 1); tf(e, x, y, rot, s); }
function boxPaste(w, h, ang, seed) {
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const cs = [[0, 0], [w, 0], [w, h], [0, h]], us = cs.map(([x, y]) => x * dx + y * dy), vs = cs.map(([x, y]) => x * nx + y * ny);
  const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs) - 60, v1 = Math.max(...vs) + 60;
  const R = rng(seed), N = 30, jag = []; for (let i = 0; i <= N; i++) jag.push((R() - 0.5) * 34 + Math.sin(i * 0.9 + seed) * 14);
  const pt = (u, v) => `${(u * dx + v * nx).toFixed(1)}px ${(u * dy + v * ny).toFixed(1)}px`;
  return {
    clip(p) { if (p >= 1) return 'none'; const s = lerp(u0 - 60, u1 + 60, p), q = [pt(u0 - 300, v0 - 300)]; for (let i = 0; i <= N; i++) q.push(pt(s + jag[i], lerp(v0, v1, i / N))); q.push(pt(u0 - 300, v1 + 300)); return `polygon(${q.join(',')})`; },
    band(p, wd = 90) { if (p <= 0 || p >= 1) return 'polygon(0 0,0 0,0 0)'; const s = lerp(u0 - 60, u1 + 60, p), a1 = [], a2 = []; for (let i = 0; i <= N; i++) { const v = lerp(v0, v1, i / N); a1.push(pt(s + jag[i], v)); a2.unshift(pt(s + jag[i] - wd, v)); } return `polygon(${a1.concat(a2).join(',')})`; },
  };
}
/* trait de feutre : ellipse irrégulière de 1,12 tour */
function markerPath(cx, cy, rx, ry, seed) {
  const R = rng(seed), a0 = -2.2 + R() * 0.6, ph1 = R() * 6, ph2 = R() * 6; let d = '';
  for (let i = 0; i <= 90; i++) { const u = i / 90, a = a0 + u * Math.PI * 2 * 1.12, k = 1 + 0.045 * Math.sin(a * 2 + ph1) + 0.03 * Math.sin(a * 3 + ph2) + 0.05 * u;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rx * k).toFixed(1) + ' ' + (cy + Math.sin(a) * ry * k).toFixed(1); }
  return d;
}
function drawStroke(path, len, t, t0, d) { const p = E.out2(P(t, t0, t0 + d)); path.style.strokeDasharray = `${len} ${len}`; path.style.strokeDashoffset = (len * (1 - p)).toFixed(1); path.style.opacity = p > 0 ? 1 : 0; }
const tapeAt = (parent, x, y, w, h, r) => el('div', 'tape', parent, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', transform: `rotate(${r}deg)` });

/* ═══════════ décor : le mur ═══════════ */
const ROOT = el('div', 'abs', cam, { width: '1080px', height: '1920px' });

/* ═══════════ le tirage photo ═══════════ */
const PR = el('div', 'abs', ROOT, { width: PW + 'px', height: PH_ + 'px', background: COL.light, boxShadow: '6px 18px 40px rgba(0,0,0,.55)', transformOrigin: `${PW / 2}px 0px`, zIndex: 2 });
el('div', 'tex tex-paper', PR);
const IMG = el('div', 'abs', PR, { left: '24px', top: '24px', width: IW + 'px', height: IH + 'px', overflow: 'hidden', background: '#111' });
const cvC = el('canvas', 'abs', IMG, { width: IW + 'px', height: IH + 'px', filter: 'contrast(1.06) saturate(.86)' }); cvC.width = 900; cvC.height = 1600;
const DUO = el('div', 'abs', IMG, { width: IW + 'px', height: IH + 'px' });
const cvD = el('canvas', 'abs', DUO, { width: IW + 'px', height: IH + 'px', filter: 'url(#duo) contrast(1.05)' }); cvD.width = 900; cvD.height = 1600;
el('div', 'dots', DUO, { opacity: 0.32 });
el('div', 'tex tex-paper', IMG, { opacity: 0.55 });
const MK = svgEl(IMG, IW, IH, '', { left: '0px', top: '0px' });
const credit = el('div', 'abs', PR, { left: '26px', top: (PH_ - 21) + 'px', font: '700 17px/1 MONO', color: COL.ink, opacity: 0.72, letterSpacing: '.18em' }, 'VIDÉO : TIKTOK');
tapeAt(PR, 360, -24, 180, 50, -5); tapeAt(PR, 700, PH_ - 30, 170, 48, 7);
// bande collée sur la légende d'origine
const LAB = el('div', 'abs', IMG, { left: '78px', top: '276px', width: '700px', height: '136px', transformOrigin: '50% 50%' });
svgEl(LAB, 700, 136, `<path d="${tornRect(700, 136, 10, 20, 17)}" fill="${COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.28))' });
const labD = el('div', 'abs', LAB, { left: '0px', top: '12px', width: '700px', textAlign: 'center', font: '900 74px/1 BSS', color: COL.red, letterSpacing: '.04em' }, '17 OCTOBRE');
const labP = typer(LAB, 'PLACE DE LA BASTILLE', { position: 'absolute', left: '0px', top: '92px', width: '700px', textAlign: 'center', font: '700 30px/1 MONO', color: COL.ink, letterSpacing: '.1em' });
tapeAt(LAB, -30, 40, 90, 34, -70); tapeAt(LAB, 640, 50, 90, 34, 74);

/* annotations au feutre, dans le repère de l'image */
function mark(cx, cy, rx, ry, seed) {
  MK.insertAdjacentHTML('beforeend', `<path d="${markerPath(cx, cy, rx, ry, seed)}" fill="none" stroke="${COL.red}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`);
  const p = MK.lastElementChild; return { p, len: p.getTotalLength() + 2 };
}
const M1 = mark(470, 714, 365, 225, 3), M2 = mark(616, 699, 200, 150, 5), M3 = mark(560, 1000, 265, 330, 7), M4 = mark(487, 975, 220, 170, 9);
MK.insertAdjacentHTML('beforeend', `<path d="M 440 640 C 330 655, 220 650, 95 640 M 95 640 l 46 -32 M 95 640 l 44 34" fill="none" stroke="${COL.red}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`);
const ARW = { p: MK.lastElementChild }; ARW.len = ARW.p.getTotalLength() + 2;
const avant = el('div', 'abs', IMG, { left: '70px', top: '492px', font: '96px/1 MARK', color: COL.red, transform: 'rotate(-6deg)', textShadow: '0 2px 0 rgba(0,0,0,.25)' }, 'AVANT ?');

function printState(t) {
  let s = 0;
  for (const [f0, f1] of TL.freezes) s = Math.max(s, E.io3(P(t, f0 + 0.03, f0 + 0.41)) * (1 - E.io3(P(t, f1, f1 + 0.36))));
  return s;
}

/* ═══════════ couche « accroche » sur le mur ═══════════ */
const HOOK = el('div', 'abs', ROOT, { width: '1080px', height: '1920px', zIndex: 3 });
const cestStrip = el('div', 'abs', HOOK, { left: '96px', top: '1388px', width: '330px', height: '104px', transformOrigin: '50% 50%' });
svgEl(cestStrip, 330, 104, `<path d="${tornRect(330, 104, 9, 18, 23)}" fill="${COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.3))' });
const cestT = typer(cestStrip, 'C’EST', { position: 'absolute', left: '0px', top: '20px', width: '330px', textAlign: 'center', font: '72px/1 ELITE', color: COL.ink });
const tag = el('div', 'abs', HOOK, { left: '40px', top: '1470px', font: '250px/1 SPRAY', color: COL.red, transformOrigin: '50% 50%', whiteSpace: 'nowrap' }, 'LÉGAL ?');
const hookCv = el('canvas', 'abs', HOOK); hookCv.width = 1080; hookCv.height = 1920;
const hookParts = new Parts(hookCv), HR = rng(202);
sprayMist(hookParts, HR, { t0: K.tag0, t1: K.tag1, x0: 60, x1: 1020, y0: 1540, y1: 1720, n: 650, col: COL.red, spread: 60, yspread: 80 });
const hookDrips = (() => {
  const L = [[150, 120, 12, 0], [380, 70, 9, 0.12], [610, 150, 13, 0.05], [860, 90, 10, 0.2]];
  const s = svgEl(HOOK, 1080, 300, L.map(([x, l, w]) => `<rect x="${x}" y="0" width="${w}" height="0" rx="${w / 2}" fill="${COL.red}"/>`).join(''), { left: '0px', top: '1735px' });
  const rs = [...s.querySelectorAll('rect')];
  return t => L.forEach(([x, l, w, dl], i) => rs[i].setAttribute('height', (l * E.out3(P(t, K.tag1 + dl, K.tag1 + dl + 0.8))).toFixed(1)));
})();
// bande « LÉGAL OU PAS ? » posée sur la vidéo qui joue
const qStrip = el('div', 'abs', HOOK, { left: '70px', top: '1420px', width: '940px', height: '190px', transformOrigin: '50% 50%' });
svgEl(qStrip, 940, 190, `<path d="${tornRect(940, 190, 12, 22, 29)}" fill="${COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.32))' });
el('div', 'abs', qStrip, { left: '0px', top: '44px', width: '940px', textAlign: 'center', font: '900 100px/1 ANY', color: COL.ink, letterSpacing: '-.02em', whiteSpace: 'nowrap' }, 'LÉGAL OU PAS ?');
tapeAt(qStrip, -20, 60, 100, 38, -75); tapeAt(qStrip, 870, 70, 100, 38, 72);

/* ═══════════ cartes verdict ═══════════ */
function card(o) {
  const w = 960, h = o.h;
  const wrap = el('div', 'abs', ROOT, { left: '60px', top: o.y + 'px', width: w + 'px', height: h + 'px', zIndex: 5, transformOrigin: '50% 0%' });
  const c = el('div', 'card', wrap, { left: '0px', top: '0px', width: w + 'px', height: h + 'px' });
  const inner = el('div', 'inner', c);
  el('div', 'tex tex-paper', inner);
  const wr = el('div', 'wr', inner), wet = el('div', 'wet', inner);
  tapeAt(c, 70, -22, 170, 48, -8); tapeAt(c, 730, -18, 170, 48, 7);
  const pa = boxPaste(w, h, o.ang, o.seed);
  return {
    wrap, c, inner, o, pa,
    upd(t, tileMode) {
      const t0 = o.t0, t1 = o.t1;
      const vis = tileMode ? true : (t >= t0 - 0.01 && t < t1 + 0.32);
      show(wrap, vis); if (!vis) return false;
      const p = tileMode ? 1 : E.io2(P(t, t0, t0 + 0.28));
      c.style.clipPath = pa.clip(p);
      show(wet, p > 0 && p < 1); if (p > 0 && p < 1) wet.style.clipPath = pa.band(p);
      wr.style.opacity = tileMode ? 0.2 : (0.18 + 0.35 * (1 - P(t, t0 + 0.28, t0 + 1.1))).toFixed(3);
      const out = tileMode ? 0 : E.in3(P(t, t1, t1 + 0.3));
      tf(wrap, 40 * out, 1150 * out, o.rot + 9 * out);
      return true;
    },
  };
}
const head = (C, txt, size, x = 48, y = 34) => el('div', 'abs', C.inner, { left: x + 'px', top: y + 'px', font: `900 ${size}px/1 ANY`, color: COL.ink, letterSpacing: '-.02em', transformOrigin: '0% 60%', whiteSpace: 'nowrap' }, txt);
const stampEl = (C, txt, x, y, w, h, fs, r) => { const s = el('div', 'stamp worn', C.inner, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', fontSize: fs + 'px', whiteSpace: 'nowrap' }, txt); s.dataset.r = r; return s; };
const body = (C, txt, x, y, fs = 48) => typer(C.inner, txt, { position: 'absolute', left: x + 'px', top: y + 'px', font: `${fs}px/1.2 ELITE`, color: COL.ink });
const srcLine = (C, txt, y) => { el('div', 'abs', C.inner, { left: '48px', top: y + 'px', width: '864px', height: '3px', background: 'rgba(20,18,16,.45)' }); return typer(C.inner, txt, { position: 'absolute', left: '48px', top: (y + 22) + 'px', font: '700 23px/1 MONO', color: COL.ink, opacity: 0.75, letterSpacing: '.1em' }); };

const C1 = card({ y: 1150, h: 600, ang: 200, seed: 31, rot: -1.2, t0: K.fz1 + 0.05, t1: K.uf1 });
const C1h = head(C1, 'CHARGER', 116), C1sub = typer(C1.inner, 'POUR DISPERSER', { position: 'absolute', left: '500px', top: '204px', font: '700 30px/1 MONO', color: COL.ink, letterSpacing: '.1em' });
const C1s = stampEl(C1, 'LÉGAL SI…', 48, 172, 420, 122, 84, -5);
const C1a = body(C1, 'après 2 sommations.', 50, 330), C1b = body(C1, 'ou sans, s’ils sont attaqués.', 50, 392);
const C1src = srcLine(C1, 'ART. 431-3 CODE PÉNAL · L211-9 CSI', 498);

const C2 = card({ y: 1128, h: 740, ang: 160, seed: 37, rot: 1.0, t0: K.fz2 + 0.05, t1: K.uf2 });
const C2h = head(C2, 'FILMER', 116), C2s = stampEl(C2, 'LÉGAL', 48, 168, 300, 122, 100, -4);
const C2n = typer(C2.inner, '(sauf unités spéciales :\n GIGN, BRI…)', { position: 'absolute', left: '400px', top: '186px', font: '700 24px/1.35 MONO', color: COL.ink, opacity: 0.8 });
const C2a = body(C2, 'La police ne peut pas\nt’en empêcher.', 50, 320);
const C2j = el('div', 'abs', C2.inner, { left: '48px', top: '462px', font: '900 52px/1 ANY', color: COL.red, letterSpacing: '-.01em', transformOrigin: '0% 60%' }, 'JOURNALISTES :');
const C2b = body(C2, 'peuvent rester, même après\nl’ordre de dispersion.', 50, 528);
const C2src = srcLine(C2, 'CONSEIL D’ÉTAT, 10 JUIN 2021', 656);

const C3 = card({ y: 1150, h: 560, ang: 210, seed: 41, rot: -1.0, t0: K.fz3 + 0.05, t1: K.uf3 });
const C3h = head(C3, 'INTERPELLER', 108), C3s = stampEl(C3, 'LÉGAL SI…', 48, 166, 420, 122, 84, -6);
const C3a = body(C3, 'la force reste nécessaire\net proportionnée.', 50, 318);
const C3src = srcLine(C3, 'ART. R434-18 CODE DE LA SÉCURITÉ INTÉRIEURE', 462);

const C4 = card({ y: 1140, h: 640, ang: 180, seed: 43, rot: 1.2, t0: K.fz4 + 0.05, t1: 99 });
const C4h = head(C4, 'LÉGAL OU PAS ?', 92), C4s = stampEl(C4, 'IMPOSSIBLE À DIRE', 40, 150, 880, 132, 98, -3);
const C4a = body(C4, 'On ne voit pas ce qui\ns’est passé avant.', 50, 324);
const C4b = body(C4, '→ à l’IGPN et à la justice\n   de trancher.', 50, 472);

/* ═══════════ affiche : rester après les sommations ═══════════ */
const PO = el('div', 'abs', ROOT, { width: '1080px', height: '1920px', zIndex: 8, background: COL.red, overflow: 'hidden' });
const POc = el('div', 'abs', PO, { width: '1080px', height: '1920px' });
svgEl(POc, 1080, 900, `<path d="${halftone(1080, 900, 22, (x, y) => Math.max(0, 0.8 - Math.hypot(x, y) / 950))}" fill="${COL.ink}" fill-opacity=".72"/>`, { left: '0px', top: '0px' });
const ann = el('div', 'abs', POc, { left: '120px', top: '246px', width: '840px', height: '220px', transform: 'rotate(-2deg)' });
svgEl(ann, 840, 220, `<path d="${tornRect(840, 220, 12, 22, 51)}" fill="${COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.3))' });
const annT = typer(ann, 'PREMIÈRE SOMMATION…\nDERNIÈRE SOMMATION…', { position: 'absolute', left: '46px', top: '40px', font: '58px/1.25 ELITE', color: COL.ink });
const tu = el('div', 'abs', POc, { left: '78px', top: '552px', font: '900 150px/1 ANY', color: COL.light, letterSpacing: '-.03em', transformOrigin: '0% 60%' }, 'TU');
const restes = el('div', 'abs', POc, { left: '70px', top: '690px', font: '900 200px/1 ANY', color: COL.light, letterSpacing: '-.03em', transformOrigin: '0% 60%', whiteSpace: 'nowrap' }, 'RESTES ?');
const delit = el('div', 'abs', POc, { left: '180px', top: '1000px', width: '720px', height: '250px', background: COL.light, borderRadius: '16px', boxShadow: '0 14px 30px rgba(0,0,0,.35)', transformOrigin: '50% 50%' });
el('div', 'abs worn', delit, { left: '20px', top: '20px', width: '680px', height: '210px', boxSizing: 'border-box', border: `8px solid ${COL.ink}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 182px/1 BSS', color: COL.ink, letterSpacing: '.04em', paddingTop: '8px' }, '= DÉLIT');
const an = el('div', 'abs', POc, { left: '0px', top: '1318px', width: '1080px', textAlign: 'center', font: '900 190px/1 BSS', color: COL.ink, transformOrigin: '50% 60%' }, 'JUSQU’À 1 AN');
const prison = el('div', 'abs', POc, { left: '0px', top: '1520px', width: '1080px', textAlign: 'center', font: '900 110px/1 ANY', color: COL.ink, letterSpacing: '-.02em', transformOrigin: '50% 60%' }, 'DE PRISON');
const poSrc = typer(POc, '+ 15 000 € D’AMENDE · ART. 431-4 CODE PÉNAL', { position: 'absolute', left: '0px', top: '1690px', width: '1080px', textAlign: 'center', font: '700 28px/1 MONO', color: COL.light, letterSpacing: '.1em' });
el('div', 'tex tex-paper', PO);
const poWr = el('div', 'wr', PO), poWet = el('div', 'wet', PO);
const poPa = boxPaste(1080, 1920, -90, 61);

/* ═══════════ le mur final ═══════════ */
const WALL = el('div', 'abs', cam, { width: '1080px', height: '1920px', zIndex: 20 });
const WG = el('div', 'abs', WALL, { width: '1080px', height: '1920px', transformOrigin: '0px 0px' });
const wbg = el('div', 'abs', WG, { left: '-5000px', top: '-6000px', width: '12000px', height: '16000px', background: COL.wall });
el('div', 'tex tex-ink', wbg, { opacity: 0.8 });
const TILES = { print: [-430, 820, -4, 0.85], c1: [1560, 120, 3, 0.95], c2: [1540, 880, -2, 0.95], c3: [1570, 1640, 2, 0.95], c4: [500, 2380, -2.5, 0.95] };
const tileImgs = [];
for (const [name, [cx, cy, r, s]] of Object.entries(TILES)) {
  const im = el('img', 'abs', WG, { transformOrigin: '50% 50%' }); im.src = `tiles/${name}.png`; tileImgs.push(im);
  im.onload = () => { im.style.left = (cx - im.naturalWidth / 2) + 'px'; im.style.top = (cy - im.naturalHeight / 2) + 'px'; im.style.transform = `rotate(${r}deg) scale(${s})`; };
}
const poTile = el('img', 'abs', WG, { left: '0px', top: '0px', width: '1080px', height: '1920px', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }); poTile.src = 'tiles/poster.png'; tileImgs.push(poTile);
tapeAt(WG, 400, -40, 300, 90, -4);
const veil = el('div', 'abs', WALL, { width: '1080px', height: '1920px', background: '#000', opacity: 0 });
const wcv = el('canvas', 'abs', WALL); wcv.width = 1080; wcv.height = 1920;
const wParts = new Parts(wcv), WR = rng(3131);
const et = el('div', 'abs', WALL, { left: '90px', top: '520px', font: '290px/1 SPRAY', color: COL.fluo, transformOrigin: '50% 50%' }, 'ET');
const toi = el('div', 'abs', WALL, { left: '40px', top: '780px', font: '330px/1 SPRAY', color: COL.fluo, transformOrigin: '50% 50%', whiteSpace: 'nowrap' }, 'TOI ?');
const tMid = (K.toi0 + K.toi1) / 2;
sprayMist(wParts, WR, { t0: K.toi0, t1: tMid, x0: 90, x1: 520, y0: 580, y1: 800, n: 380, col: COL.fluo, spread: 60, yspread: 70 });
sprayMist(wParts, WR, { t0: tMid, t1: K.toi1, x0: 40, x1: 1040, y0: 840, y1: 1100, n: 700, col: COL.fluo, spread: 60, yspread: 80 });
const sk = el('div', 'abs', WALL, { left: '150px', top: '1350px', width: '780px', height: '150px', borderRadius: '75px', background: COL.light, border: `6px solid ${COL.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 66px/1 ANY', color: COL.ink, boxShadow: '0 18px 34px rgba(0,0,0,.5)', transformOrigin: '50% 50%' }, 'T’EN PENSES QUOI ?');

/* ═══════════ caméra (intensité dosée) ═══════════ */
function camAt(t) {
  let x = 0, y = 0, s = 1, r = 0;
  for (const [k, t0, d, sh, pu] of TL.cues) {
    if (!sh && !pu) continue; const a = t - t0; if (a < 0 || a > 1.2) continue;
    const e = Math.exp(-a * 12);
    x += sh * e * Math.sin(a * 2 * Math.PI * 15 + t0 * 7); y += sh * e * 0.8 * Math.cos(a * 2 * Math.PI * 12 + t0 * 3); r += sh * 0.015 * e * Math.sin(a * 2 * Math.PI * 8 + t0);
    s += pu * Math.exp(-a * 9) * clamp(a / 0.03);
  }
  const f = 1 - P(t, K.wall0, K.wall0 + 0.4);
  x += 4 * Math.sin(t * 0.8) * f; y += 3 * Math.sin(t * 0.57 + 1) * f; r += 0.18 * Math.sin(t * 0.45) * f;
  return { x, y, s, r };
}

/* ═══════════ rendu d'une image ═══════════ */
let lastFrame = -1;
async function renderAt(t, o = {}) {
  const tileMode = !!o.only;
  document.body.classList.toggle('tile', tileMode); document.documentElement.classList.toggle('tile', tileMode);
  const c = (o.tile || tileMode) ? { x: 0, y: 0, s: 1, r: 0 } : camAt(t);
  cam.style.transform = `translate(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px) rotate(${c.r.toFixed(3)}deg) scale(${c.s.toFixed(4)})`;
  show(vign, !(o.tile || tileMode));
  show(document.getElementById('wallbg'), !tileMode);
  const only = n => !tileMode || o.only === n;

  // vidéo
  const S = srcAt(t), fi = Math.round(S * 30) + 1;
  if (fi !== lastFrame) {
    const im = await frame(fi);
    cvC.getContext('2d').drawImage(im, 0, 0, 900, 1600);
    cvD.getContext('2d').drawImage(im, 0, 0, 900, 1600);
    lastFrame = fi;
    for (let k = 1; k <= 3; k++) frame(Math.round(srcAt(t + k / 30) * 30) + 1);
  }
  const frozen = frozenAt(t) || o.only === 'print';
  let fz0 = -1; for (const [f0, f1] of TL.freezes) if (t >= f0 && t < f1) fz0 = f0;
  show(DUO, frozen);
  if (frozen) DUO.style.clipPath = (o.only === 'print') ? 'none' : `inset(0 ${(100 * (1 - E.out3(P(t, fz0, fz0 + 0.16)))).toFixed(1)}% 0 0)`;

  // tirage
  const st = (o.only === 'print') ? 0 : printState(t);
  const wob = (o.tile || tileMode) ? 0 : 0.3 * Math.sin(t * 0.7);
  const cx = lerp(539.5, 540, st), cy = lerp(176, 66, st), sc = lerp(1, 0.655, st), rr = lerp(-0.8 + wob, 2.2, st);
  tf(PR, cx - PW / 2, cy, rr, sc);
  show(PR, only('print') && (tileMode || t < K.pst + 0.32));
  // bande 17 OCTOBRE
  const ls = spring(t - K.label + 0.25, 2.6, 0.5);
  tf(LAB, 0, -30 * (1 - ls), lerp(-6, -1.5, ls), 1 + 0.2 * (1 - ls));
  const sd = slamS(t, ps(1) + 0.05); op(labD, sd === null ? 0 : 1); if (sd !== null) tf(labD, 0, 0, 0, sd);
  labP.set(t > pe(2) + 0.35 ? 1.2 : P(t, ps(2), pe(2)), t);
  // feutre
  const mk = (m, t0, d, on) => { if (!on) { m.p.style.opacity = 0; return; } drawStroke(m.p, m.len, t, t0, d); };
  const inF = n => { const f = TL.freezes[n - 1]; return t >= f[0] && t < f[1]; };
  mk(M1, K.c1circle, 0.45, inF(1)); mk(M2, K.c2circle, 0.45, inF(2)); mk(M3, K.c3circle, 0.45, inF(3));
  mk(M4, K.c4q - 0.05, 0.4, inF(4) || o.only === 'print'); mk(ARW, K.c4q + 0.25, 0.35, inF(4) || o.only === 'print');
  if (o.only === 'print') { M4.p.style.strokeDashoffset = 0; ARW.p.style.strokeDashoffset = 0; M4.p.style.opacity = 1; ARW.p.style.opacity = 1; }
  const av = (o.only === 'print') ? 1 : (inF(4) ? P(t, K.c4q + 0.05, K.c4q + 0.4) : 0);
  avant.style.clipPath = `inset(0 ${(100 * (1 - av)).toFixed(1)}% 0 0)`; show(avant, av > 0);

  // accroche
  const hookOn = !tileMode && t < K.fz1 + 0.45;
  show(HOOK, !tileMode && (hookOn || (t >= K.q0 - 0.1 && t < K.fz4 + 0.4)));
  show(cestStrip, hookOn); show(tag, hookOn); show(hookCv, hookOn);
  if (hookOn) {
    const a = spring(t - K.cest + 0.1, 2.6, 0.5); op(cestStrip, t >= K.cest - 0.1 ? 1 : 0); tf(cestStrip, 0, -40 * (1 - a), -3, 1 + 0.25 * (1 - a));
    cestT.set(t > K.cest + 0.65 ? 1.2 : P(t, K.cest, K.cest + 0.3), t);
    const pv = P(t, K.tag0, K.tag1); const pc = lerp(-9, 101, pv);
    tag.style.webkitMaskImage = pv >= 1 ? 'none' : `linear-gradient(96deg,#000 ${pc.toFixed(1)}%,rgba(0,0,0,0) ${(pc + 8).toFixed(1)}%)`;
    tf(tag, 0, 0, -4, 1 + (t > K.tagHit ? 0.04 * Math.exp(-(t - K.tagHit) * 10) : 0));
    hookDrips(t); hookParts.draw(t);
  } else hookDrips(0);
  const qOn = !tileMode && t >= K.q0 - 0.1 && t < K.fz4 + 0.4;
  show(qStrip, qOn); if (qOn) { const a = spring(t - K.q0 + 0.06, 2.6, 0.5); op(qStrip, t >= K.q0 - 0.06 ? 1 : 0); tf(qStrip, 0, -50 * (1 - a), lerp(-7, -2, a), 1 + 0.18 * (1 - a)); }

  // cartes
  const cardStamp = (s, t0) => { const v = slamS(t, t0, 1.6, 0.08); if (v === null && !tileMode) { op(s, 0); return; } op(s, 1); tf(s, 0, 0, +s.dataset.r, tileMode ? 1 : v); };
  const hd = (e, t0) => { if (tileMode) { op(e, 1); tf(e, 0, 0, 0, 1); return; } setSlam(e, t, t0); };
  const ty = (ty_, a, b) => ty_.set(tileMode || t > b + 0.35 ? 1.2 : P(t, a, b), t);
  if (only('c1') && C1.upd(t, tileMode)) { hd(C1h, K.c1head); ty(C1sub, K.c1sub0, K.c1sub0 + 0.3); cardStamp(C1s, K.c1stamp); ty(C1a, ...K.c1t1); ty(C1b, ...K.c1t2); ty(C1src, K.c1src, K.c1src + 0.3); }
  else if (tileMode) show(C1.wrap, false);
  if (only('c2') && C2.upd(t, tileMode)) { hd(C2h, K.fz2 + 0.1); cardStamp(C2s, K.c2stamp); ty(C2a, ...K.c2t1); ty(C2n, K.c2note, K.c2note + 0.3); hd(C2j, K.c2circle + 0.1); ty(C2b, ...K.c2t2); ty(C2src, K.c2src, K.c2src + 0.3); }
  else if (tileMode) show(C2.wrap, false);
  if (only('c3') && C3.upd(t, tileMode)) { hd(C3h, K.fz3 + 0.1); cardStamp(C3s, K.c3stamp); ty(C3a, ...K.c3t); ty(C3src, K.c3src, K.c3src + 0.3); }
  else if (tileMode) show(C3.wrap, false);
  const c4vis = only('c4') && (tileMode || t < K.pst + 0.32);
  if (c4vis && C4.upd(t, tileMode)) { hd(C4h, K.fz4 + 0.1); cardStamp(C4s, K.c4stamp); ty(C4a, ...K.c4t1); ty(C4b, ...K.c4t2); }
  else show(C4.wrap, false);

  // affiche du délit
  const poOn = only('poster') && (tileMode || (t >= K.pst - 0.01 && t < K.wall0 + 0.05));
  show(PO, poOn);
  if (poOn) {
    const p = tileMode ? 1 : E.io2(P(t, K.pst, K.pst + 0.3));
    PO.style.clipPath = poPa.clip(p); show(poWet, p > 0 && p < 1); if (p > 0 && p < 1) poWet.style.clipPath = poPa.band(p);
    poWr.style.opacity = tileMode ? 0.18 : (0.18 + 0.32 * (1 - P(t, K.pst + 0.3, K.pst + 1.1))).toFixed(3);
    ty(annT, ...K.ann);
    hd(tu, K.tu); hd(restes, K.restes);
    const dv = slamS(t, K.delit, 1.5, 0.08); if (tileMode) { op(delit, 1); tf(delit, 0, 0, -6, 1); } else if (dv === null) op(delit, 0); else { op(delit, 1); tf(delit, 0, 0, -6, dv); }
    hd(an, K.an); hd(prison, K.prison); ty(poSrc, K.src, K.src + 0.35);
  }

  // mur final
  const wOn = !o.tile && !tileMode && t >= K.wall0;
  show(WALL, wOn); show(ROOT, !wOn || t < K.wall0 + 0.02);
  if (wOn) {
    const pp = E.io3(P(t, K.wall0, K.wall1));
    const s = lerp(1, 0.38, pp) * (1 - 0.03 * P(t, K.wall1, TL.dur)), ccx = lerp(540, 560, pp), ccy = lerp(960, 1150, pp);
    WG.style.transform = `translate(540px,960px) scale(${s.toFixed(4)}) translate(${(-ccx).toFixed(1)}px,${(-ccy).toFixed(1)}px) rotate(${(-2 * pp).toFixed(2)}deg)`;
    op(veil, 0.45 * P(t, K.wall1 - 0.3, K.wall1 + 0.1));
    for (const [e, a, b] of [[et, K.toi0, tMid], [toi, tMid, K.toi1]]) { const pv = P(t, a, b), pc = lerp(-9, 101, pv); e.style.webkitMaskImage = pv >= 1 ? 'none' : `linear-gradient(96deg,#000 ${pc.toFixed(1)}%,rgba(0,0,0,0) ${(pc + 8).toFixed(1)}%)`; tf(e, 0, 0, -4); }
    const a = t - K.sticker, ss = spring(a, 2.2, 0.45); op(sk, a > 0 ? 1 : 0); tf(sk, 0, 0, lerp(-10, -4, ss), 1 + 0.3 * (1 - ss));
    wParts.draw(t);
  }
}

/* ═══════════ démarrage ═══════════ */
async function main() {
  for (const f of ['900 100px BSS', '900 100px ANY', '100px ELITE', '100px MARK', '100px SPRAY', '700 100px MONO']) await document.fonts.load(f);
  await document.fonts.ready;
  if (!TILE) await Promise.all(tileImgs.map(im => im.decode().catch(() => {})));
  window.renderAt = renderAt;
  window.__dur = TL.dur; window.__fps = 30;
  window.TILE_EL = { print: PR, c1: C1.wrap, c2: C2.wrap, c3: C3.wrap, c4: C4.wrap, poster: PO };
  window.TILE_TIMES = { print: K.c4t2[1] + 0.2, c1: K.uf1 - 0.02, c2: K.uf2 - 0.02, c3: K.uf3 - 0.02, c4: K.pst - 0.02, poster: K.wall0 - 0.02 };
  await renderAt(0);
  window.__ready = true;
}
main();
