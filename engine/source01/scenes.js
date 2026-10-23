/* SOURCE01 — « La Source · Tout est dispo » : 6 affiches collées les unes sur les autres, puis le mur.
   Standard AFFICHE (MANIF01), intensité « dosée », bruitages seuls. Réutilise engine/manif01/core.js. */
'use strict';
const SDUR = 18.8;
const Q = new URLSearchParams(location.search);
const TILE_MODE = Q.has('tile');
const stage = document.getElementById('stage'), cam = document.getElementById('cam'), flashEl = document.getElementById('flash'), vign = document.getElementById('vign');
const SCENES = [];
const SLAM0 = 1.35; // échelle de départ des slams (dosé)

/* ———— outils communs (repris de MANIF01) ———— */
function poster(id, o) {
  const h = o.h || H;
  const wrap = el('div', '', o.parent || cam, { position: 'absolute', left: '0px', top: '0px', width: W + 'px', height: h + 'px', zIndex: o.z, transformOrigin: '540px 960px' });
  const p = el('div', 'poster', wrap, { background: o.bg, height: h + 'px' });
  p.id = id;
  const c = el('div', 'content', p);
  const cv = el('canvas', 'fxc', p); cv.width = W; cv.height = H;
  const parts = new Parts(cv);
  if (o.tex) el('div', 'tex tex-' + o.tex, p);
  const wr = el('div', 'wr', p);
  const wet = el('div', 'wet', p);
  return { wrap, p, c, cv, parts, wr, wet };
}
function pasteUpd(A, pa, t, t0, d) {
  const p = E.io2(P(t, t0, t0 + d));
  A.p.style.clipPath = pa.clip(p);
  show(A.wet, p > 0 && p < 1);
  if (p > 0 && p < 1) A.wet.style.clipPath = pa.band(p);
  A.wr.style.opacity = (0.2 + 0.42 * (1 - P(t, t0 + d, t0 + d + 1.0))).toFixed(3);
}
function slamS(t, t0, from = SLAM0, d = 0.07) {
  if (t < t0 - d) return null;
  if (t < t0) return lerp(from, 1, E.in3(P(t, t0 - d, t0)));
  return 1 - 0.035 * Math.exp(-(t - t0) * 14) * Math.cos((t - t0) * 40);
}
function setSlam(e, t, t0, rot = 0, from = SLAM0, d = 0.07, x = 0, y = 0) {
  const s = slamS(t, t0, from, d);
  if (s === null) { op(e, 0); return; }
  op(e, t < t0 - d * 0.6 ? 0.5 : 1);
  tf(e, x + jit(t, 7, 0.6), y + jit(t, 8, 0.6), rot, s);
}
function rectOf(e) { const a = e.getBoundingClientRect(), b = stage.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; }
function sprayReveal(e, p, ang = 95) {
  if (p >= 1) { e.style.webkitMaskImage = 'none'; return; }
  const pc = lerp(-9, 101, p);
  e.style.webkitMaskImage = `linear-gradient(${ang}deg, #000 ${pc.toFixed(1)}%, rgba(0,0,0,0) ${(pc + 8).toFixed(1)}%)`;
}
function dripsSvg(parent, list, col, top) {
  const s = svgEl(parent, 1080, 420, list.map(([x, l, w]) => `<rect x="${x}" y="0" width="${w}" height="0" rx="${w / 2}" fill="${col}"/><circle cx="${x + w / 2}" cy="0" r="0" fill="${col}"/>`).join(''), { left: '0px', top: top + 'px' });
  const rs = [...s.querySelectorAll('rect')], cs = [...s.querySelectorAll('circle')];
  return (t, t0) => list.forEach(([x, l, w, dl], i) => {
    const p = E.out3(P(t, t0 + dl, t0 + dl + 0.85)), h = l * p;
    rs[i].setAttribute('height', h.toFixed(1)); cs[i].setAttribute('cy', h.toFixed(1)); cs[i].setAttribute('r', (w * 0.85 * Math.min(1, p * 4)).toFixed(1));
  });
}
function tape(parent, x, y, w, h, r) { return el('div', 'tape', parent, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', transform: `rotate(${r}deg)` }); }
/* tampon encreur usé (le motif « DISPO » de la marque) */
function stamp(parent, txt, o) {
  const e = el('div', 'worn', parent, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', boxSizing: 'border-box', border: `${o.bw}px solid ${o.col || COL.red}`, borderRadius: (o.rad || 10) + 'px', font: `900 ${o.fs}px/1 BSS`, color: o.col || COL.red, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 50%', paddingTop: (o.pt || 0) + 'px' }, txt);
  op(e, 0);
  return e;
}
/* bande de papier déchirée collée au scotch */
function strip(parent, o) {
  const s = el('div', '', parent, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', transformOrigin: '50% 50%' });
  svgEl(s, o.w, o.h, `<path d="${tornRect(o.w, o.h, 14, 22, o.seed || 5)}" fill="${o.bg || COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.22))' });
  el('div', '', s, { position: 'absolute', left: '0px', top: '0px', width: o.w + 'px', height: o.h + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: o.font, color: o.col || COL.ink, textAlign: 'center', whiteSpace: 'nowrap' }, o.html);
  const tp = [tape(s, -46, -16, 150, 46, -14), tape(s, o.w - 104, o.h - 46, 150, 46, -9)];
  return { s, tp };
}
function stripUpd(S, t, t0, r0 = -9, r1 = -1.5) {
  const a = t - t0, sp = spring(a, 2.4, 0.48);
  op(S.s, a > 0 ? 1 : 0); tf(S.s, 0, -50 * (1 - sp), lerp(r0, r1, sp), 1 + 0.22 * (1 - sp));
  S.tp.forEach((e, i) => { const b = t - t0 - 0.14 - i * 0.06; op(e, b > 0 ? 1 : 0); e.style.transform = `rotate(${i ? -9 : -14}deg) scale(${(1 + 0.35 * (1 - E.out3(P(b, 0, 0.12)))).toFixed(3)})`; });
}
/* lettres au pochoir avec décalage de repérage rouge */
function stencilUpd(L, t, t0, step, shadow = 'rgba(232,41,28,') {
  L.spans.forEach((s, i) => {
    const a = t - (t0 + i * step);
    s.style.opacity = a < 0 ? 0 : a < 0.034 ? 0.5 : 1;
    const m = 1 - E.out3(P(a, 0, 0.5));
    s.style.transform = `translate(${jit(t, i * 3, 0.7).toFixed(1)}px,${(-10 * (1 - E.out3(P(a, 0, 0.12)))).toFixed(1)}px)`;
    s.style.textShadow = `${(8 * m + 2.5 + jit(t, i, 0.8)).toFixed(1)}px ${(6 * m + 2 + jit(t, i + 9, 0.8)).toFixed(1)}px 0 ${shadow}${(0.7 * m + 0.3).toFixed(2)})`;
  });
}
/* trame de points dans une forme SVG (test de remplissage par le canvas) */
function halftoneIn(d, w, h, g, fn) {
  const ctx = document.createElement('canvas').getContext('2d'), p2 = new Path2D(d);
  return halftone(w, h, g, (x, y) => (ctx.isPointInPath(p2, x, y) ? fn(x, y) : 0));
}

/* ═══════════ S1 · 0–2,9 s · T'AS CHERCHÉ PARTOUT ? — tout est épuisé ═══════════ */
function buildS1() {
  const A = poster('s1', { bg: COL.paper, tex: 'paper', z: 1 });
  const pa = makePaste(-24, 11), R = rng(101);
  svgEl(A.c, 1080, 820, `<path d="${halftone(1080, 820, 20, (x, y) => Math.max(0, 1 - Math.hypot(1080 - x, y) / 760))}" fill="${COL.ink}"/>`, { left: '0px', top: '0px' });
  const tas = el('div', '', A.c, { left: '72px', top: '200px', font: '900 230px/1 ANY', color: COL.ink, transformOrigin: '20% 60%', whiteSpace: 'nowrap' }, 'T’AS');
  const ch = el('div', '', A.c, { left: '64px', top: '430px', font: '900 205px/1 ANY', color: COL.ink, whiteSpace: 'nowrap', transformOrigin: '0% 50%' }, 'CHERCHÉ');
  const pt = el('div', '', A.c, { left: '56px', top: '660px', font: '900 260px/1 BSS', color: COL.red, whiteSpace: 'nowrap', transformOrigin: '40% 50%', letterSpacing: '-0.01em' }, 'PARTOUT ?');
  // trois petites annonces scotchées, toutes épuisées
  const ADS = [
    { x: 46, y: 1190, r: -5, a: 'SNEAKERS', b: 'taille 42', st: 'ÉPUISÉ', ts: 1.35 },
    { x: 392, y: 1250, r: 3, a: 'CITADINE', b: 'faible km', st: 'VENDU', ts: 1.60 },
    { x: 728, y: 1185, r: -2, a: 'ÉCOUTEURS', b: 'lot de 10', st: 'RUPTURE', ts: 1.85 },
  ];
  const tickets = ADS.map((o, k) => {
    const d = el('div', '', A.c, { left: o.x + 'px', top: o.y + 'px', width: '306px', height: '420px', transform: `rotate(${o.r}deg)` });
    svgEl(d, 306, 420, `<path d="${tornRect(306, 420, 9, 18, 40 + k)}" fill="${COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.25))' });
    el('div', 'tex tex-paper', d, { opacity: 0.6 });
    el('div', '', d, { left: '0px', top: '44px', width: '306px', textAlign: 'center', font: '44px/1 ELITE', color: COL.ink }, 'VDS');
    el('div', '', d, { left: '0px', top: '104px', width: '306px', textAlign: 'center', font: `900 ${o.a.length > 8 ? 62 : 70}px/1 BSS`, color: COL.ink, letterSpacing: '0.02em' }, o.a);
    el('div', '', d, { left: '0px', top: '196px', width: '306px', textAlign: 'center', font: '40px/1 MARK', color: COL.ink }, o.b);
    // lignes de griffonnage au feutre
    svgEl(d, 306, 420, [0, 1, 2].map(j => `<path d="M48,${276 + j * 34} q30,-8 60,0 t60,0 t60,0 t40,-2" fill="none" stroke="${COL.ink}" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>`).join(''), { left: '0px', top: '0px' });
    tape(d, 98, -22, 120, 42, (R() - 0.5) * 14);
    const s = stamp(d, o.st, { x: 10, y: 262, w: 286, h: 112, fs: o.st.length > 6 ? 76 : 86, bw: 8, pt: 4 });
    return { d, s, o };
  });
  tickets.forEach(({ o }) => burst(A.parts, R, { t: o.ts, x: o.x + 153, y: o.y + 210, rx: 260, ry: 90, n: 22, v0: 40, v1: 220, k: 8, r0: 1, r1: 4, col: COL.red, a: 0.75 }));
  return {
    upd(t) {
      show(A.wrap, t < 3.32); if (t >= 3.32) return;
      pasteUpd(A, pa, t, -0.16, 0.4);
      tf(A.wrap, 0, 0, 0, 1.02 - 0.02 * E.out3(P(t, 0, 2.9)));
      setSlam(tas, t, 0.28, -2);
      // CHERCHÉ s'étire en largeur (Anybody variable)
      const pc = E.out3(P(t, 0.45, 0.85));
      op(ch, t > 0.45 ? 1 : 0); ch.style.fontStretch = lerp(52, 100, pc).toFixed(1) + '%';
      tf(ch, jit(t, 3, 0.6), jit(t, 4, 0.6), 0, 1, 1 + 0.08 * (1 - pc));
      setSlam(pt, t, 0.95, -3);
      tickets.forEach(({ s, o }) => setSlam(s, t, o.ts, -13 + (o.r * 0.5)));
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S2 · 2,9–5,4 s · LA SOURCE — tout est dispo (moment fort) ═══════════ */
function buildS2() {
  const A = poster('s2', { bg: COL.ink, tex: 'ink', z: 2 });
  const pa = makePaste(24, 23), R = rng(202);
  svgEl(A.c, 1080, 700, `<path d="${halftone(1080, 700, 22, (x, y) => Math.max(0, 1 - Math.hypot(x, 700 - y) / 720) * 0.85)}" fill="${COL.red}"/>`, { left: '0px', top: '1220px' });
  const la = typer(A.c, 'LA', { left: '84px', top: '300px', font: '130px/1 ELITE', color: COL.paper });
  const src = letters(A.c, 'SOURCE', { left: '66px', top: '430px', font: '900 318px/1 BSS', color: COL.paper, letterSpacing: '0.005em' });
  const S = strip(A.c, { x: 110, y: 840, w: 860, h: 150, font: '84px/1 ELITE', html: 'TOUT EST DISPO', seed: 7 });
  const canal = typer(A.c, 'CANAL TELEGRAM', { left: '0px', top: '1062px', width: '1080px', textAlign: 'center', font: '700 50px/1 MONO', color: COL.paper, letterSpacing: '0.12em' });
  const st = stamp(A.c, 'DISPO', { x: 150, y: 1190, w: 780, h: 300, fs: 250, bw: 15, pt: 8, rad: 16 });
  src.spans.forEach((s, i) => { const r = rectOf(s); burst(A.parts, R, { t: 3.4 + i * 0.07, x: r.x + r.w / 2, y: r.y + r.h * 0.5, rx: r.w * 0.9, ry: r.h * 0.6, n: 30, v0: 10, v1: 80, k: 9, r0: 0.6, r1: 2.2, col: COL.paper, a: 0.3 }); });
  burst(A.parts, R, { t: 4.5, x: 540, y: 1340, rx: 700, ry: 260, n: 55, v0: 200, v1: 900, k: 6, r0: 1.2, r1: 6, col: COL.red, a: 0.85 });
  return {
    upd(t) {
      const v = t >= 2.9 && t < 5.84; show(A.wrap, v); if (!v) return;
      pasteUpd(A, pa, t, 2.9, 0.4);
      la.set(P(t, 3.2, 3.36), t);
      stencilUpd(src, t, 3.4, 0.07);
      stripUpd(S, t, 3.95);
      canal.set(P(t, 4.08, 4.38), t);
      setSlam(st, t, 4.5, -7, SLAM0, 0.08);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S3 · 5,4–8 s · VÉHICULES à bon prix ═══════════ */
const CAR = 'M40,300 L40,240 Q45,205 90,195 L250,180 Q330,110 420,95 L640,92 Q720,95 790,170 L900,190 Q955,200 965,240 L968,300 Q968,318 950,320 L860,320 A85,85 0 0,0 690,320 L330,320 A85,85 0 0,0 160,320 L60,320 Q40,318 40,300 Z';
function buildS3() {
  const A = poster('s3', { bg: COL.paper, tex: 'paper', z: 3 });
  const pa = makePaste(-20, 31), R = rng(303);
  const ti = el('div', '', A.c, { left: '0px', top: '230px', width: '1080px', textAlign: 'center', font: '900 165px/1 ANY', color: COL.ink, whiteSpace: 'nowrap', transformOrigin: '50% 60%' }, 'VÉHICULES');
  // route : bande d'encre + ombre tramée
  el('div', '', A.c, { left: '0px', top: '1030px', width: '1080px', height: '16px', background: COL.ink });
  svgEl(A.c, 1080, 140, `<path d="${halftone(1080, 140, 14, (x, y) => Math.max(0, 1 - Math.abs(x - 540) / 520) * Math.max(0, 1 - y / 140) * 0.9)}" fill="${COL.ink}"/>`, { left: '0px', top: '1046px' });
  // la voiture : trame de points dans la silhouette, repérage rouge décalé
  const car = el('div', '', A.c, { left: '50px', top: '650px', width: '1000px', height: '420px' });
  const shade = (x, y) => 0.38 + 0.55 * clamp((y - 90) / 230);
  svgEl(car, 1000, 420, `<path d="${halftoneIn(CAR, 1000, 420, 13, shade)}" fill="${COL.red}" fill-opacity=".75" transform="translate(7 5)"/>`
    + `<path d="${halftoneIn(CAR, 1000, 420, 13, shade)}" fill="${COL.ink}"/>`
    + `<path d="${CAR}" fill="none" stroke="${COL.ink}" stroke-width="8" stroke-linejoin="round"/>`
    + `<path d="M290,182 Q345,130 425,118 L520,116 L520,182 Z M548,116 L630,116 Q690,120 742,182 L548,182 Z" fill="${COL.light}" stroke="${COL.ink}" stroke-width="7" stroke-linejoin="round"/>`
    + `<path d="M560,212 L610,212" stroke="${COL.ink}" stroke-width="8" stroke-linecap="round"/>`, { left: '0px', top: '0px' });
  const wheels = [245, 775].map(cx => {
    const g = svgEl(car, 1000, 420, `<circle cx="${cx}" cy="320" r="70" fill="${COL.ink}"/><circle cx="${cx}" cy="320" r="36" fill="${COL.light}"/><g class="sp">${[0, 1, 2, 3, 4].map(k => `<rect x="${cx - 4}" y="${320 - 34}" width="8" height="34" fill="${COL.ink}" transform="rotate(${k * 72} ${cx} 320)"/>`).join('')}</g><circle cx="${cx}" cy="320" r="9" fill="${COL.ink}"/>`, { left: '0px', top: '0px' });
    return { g: g.querySelector('.sp'), cx };
  });
  // traînées de vitesse au feutre derrière la voiture
  const lines = svgEl(A.c, 1080, 420, [[120, 150, 360], [170, 230, 300], [60, 290, 420], [210, 345, 240]].map(([x, y, w]) => `<path d="M${x},${y} L${x + w},${y}" stroke="${COL.ink}" stroke-width="12" stroke-linecap="round"/>`).join(''), { left: '0px', top: '650px' });
  const ls = [...lines.querySelectorAll('path')];
  const S = strip(A.c, { x: 140, y: 1190, w: 800, h: 210, font: '128px/1 MARK', html: 'À BON PRIX', seed: 13 });
  const st = stamp(A.c, 'DISPO', { x: 630, y: 520, w: 380, h: 150, fs: 122, bw: 10, pt: 6 });
  burst(A.parts, R, { t: 6.5, x: 220, y: 1028, rx: 160, ry: 10, n: 40, v0: 60, v1: 340, dir: Math.PI * 1.1, cone: 1.2, k: 6, g: 600, r0: 1, r1: 4, col: COL.ink, a: 0.6, life: 0.9 });
  return {
    upd(t) {
      const v = t >= 5.4 && t < 8.44; show(A.wrap, v); if (!v) return;
      pasteUpd(A, pa, t, 5.4, 0.4);
      setSlam(ti, t, 5.85, 0);
      const pc = E.outExpo(P(t, 6.0, 6.55));
      const x = lerp(-1250, 0, pc) + 6 * Math.exp(-Math.max(0, t - 6.55) * 7) * Math.sin(Math.max(0, t - 6.55) * 30);
      const lean = (1 - pc) * -2.2;
      car.style.transform = `translate(${x.toFixed(1)}px,${(jit(t, 2, 0.5)).toFixed(1)}px) rotate(${lean.toFixed(2)}deg)`;
      const ang = (x + 1250) / 70 * 57.3;
      wheels.forEach(w => w.g.setAttribute('transform', `rotate(${ang.toFixed(1)} ${w.cx} 320)`));
      const lp = P(t, 6.05, 6.5), lf = 1 - P(t, 6.55, 6.85);
      ls.forEach((p, i) => { op(p, lp > i * 0.08 ? lf : 0); p.setAttribute('transform', `translate(${(x + 40 * i * (1 - pc)).toFixed(1)} 0)`); });
      stripUpd(S, t, 6.75, 8, -3.5);
      setSlam(st, t, 7.25, 9);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S4 · 8–10,6 s · COMMANDES EN GROS — les cartons s'empilent ═══════════ */
function buildS4() {
  const A = poster('s4', { bg: COL.paper, tex: 'paper', z: 4 });
  const pa = makePaste(20, 41), R = rng(404);
  svgEl(A.c, 1080, 900, `<path d="${halftone(1080, 900, 20, (x, y) => Math.max(0, 1 - Math.hypot(x, 900 - y) / 820) * 0.7)}" fill="${COL.ink}"/>`, { left: '0px', top: '1020px' });
  const t1 = el('div', '', A.c, { left: '62px', top: '190px', font: '900 138px/1 ANY', color: COL.ink, whiteSpace: 'nowrap', transformOrigin: '30% 60%' }, 'COMMANDES');
  const t2 = el('div', '', A.c, { left: '52px', top: '350px', font: '900 300px/1 BSS', color: COL.red, whiteSpace: 'nowrap', transformOrigin: '30% 60%' }, 'EN GROS');
  const BOX = [
    { x: 215, y: 1430, w: 650, h: 340, r: 0, lab: 'SNEAKERS', tl: 8.95 },
    { x: 250, y: 1112, w: 580, h: 318, r: 1.8, lab: 'FRINGUES', tl: 9.30 },
    { x: 300, y: 822, w: 490, h: 290, r: -2.6, lab: 'ÉCOUTEURS', tl: 9.65 },
  ];
  const boxes = BOX.map((o, k) => {
    const b = el('div', '', A.c, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', transformOrigin: '50% 100%', zIndex: 2 + k });
    const face = el('div', '', b, { position: 'absolute', inset: '0px', background: COL.kraft, border: `6px solid ${COL.ink}`, boxSizing: 'border-box', boxShadow: '0 18px 26px rgba(0,0,0,.32)', overflow: 'hidden' });
    svgEl(face, o.w, o.h, `<path d="${halftone(o.w, o.h, 12, (x, y) => 0.18 + 0.35 * (y / o.h))}" fill="#7A5A2A" fill-opacity=".45"/>`, { left: '0px', top: '0px' });
    el('div', 'tex tex-paper', face, { opacity: 0.9 });
    el('div', '', face, { left: '0px', top: '0px', width: '100%', height: '36px', background: 'rgba(20,18,16,.16)' });
    el('div', '', face, { left: (o.w / 2 - 46) + 'px', top: '0px', width: '92px', height: '100%', background: 'rgba(247,242,230,.55)' });
    el('div', 'worn', face, { left: '0px', top: (o.h / 2 - 48) + 'px', width: '100%', textAlign: 'center', font: `900 ${o.lab.length > 8 ? 104 : 112}px/1 BSS`, color: COL.ink, letterSpacing: '0.06em' }, o.lab);
    // flèches « haut » au pochoir
    svgEl(face, 90, 70, `<path d="M12,62 L12,24 L2,24 L20,4 L38,24 L28,24 L28,62Z M54,62 L54,24 L44,24 L62,4 L80,24 L70,24 L70,62Z" fill="${COL.ink}" fill-opacity=".8"/>`, { left: (o.w - 120) + 'px', top: (o.h - 92) + 'px' });
    burst(A.parts, R, { t: o.tl, x: o.x + o.w / 2, y: o.y + o.h, rx: o.w, ry: 8, n: 26, v0: 80, v1: 360, dir: -Math.PI / 2, cone: 2.6, k: 7, g: 900, r0: 1, r1: 3.5, col: [COL.ink, COL.kraft], a: 0.65, life: 0.8 });
    return { b, o };
  });
  return {
    upd(t) {
      const v = t >= 8.0 && t < 11.04; show(A.wrap, v); if (!v) return;
      pasteUpd(A, pa, t, 8.0, 0.4);
      setSlam(t1, t, 8.45, -1.5);
      setSlam(t2, t, 8.65, -2.5);
      boxes.forEach(({ b, o }) => {
        const a = t - o.tl;
        if (a < 0) {
          const p = P(t, o.tl - 0.3, o.tl);
          op(b, p > 0 ? 1 : 0);
          tf(b, 0, -1700 * (1 - E.in2(p)), o.r * 3 * (1 - p), 1);
        } else {
          op(b, 1);
          const sq = 0.07 * Math.exp(-a * 11) * Math.cos(a * 32);
          tf(b, 0, 0, o.r, 1 + sq * 0.6, 1 - sq);
        }
      });
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S5 · 10,6–13,2 s · PLANS REVENTE + FICHES IMMO (annonce à languettes) ═══════════ */
function buildS5() {
  const A = poster('s5', { bg: COL.light, tex: 'paper', z: 5 });
  const pa = makePaste(-26, 53), R = rng(505);
  const t1 = el('div', '', A.c, { left: '70px', top: '170px', font: '900 150px/1 ANY', color: COL.ink, whiteSpace: 'nowrap', transformOrigin: '20% 60%' }, 'PLANS');
  const t2 = el('div', '', A.c, { left: '58px', top: '322px', font: '900 270px/1 BSS', color: COL.ink, whiteSpace: 'nowrap', transformOrigin: '30% 60%' }, 'REVENTE');
  const ul = svgEl(A.c, 1080, 120, `<path d="M70,60 C260,30 520,82 760,46 S960,40 1010,30" fill="none" stroke="${COL.red}" stroke-width="20" stroke-linecap="round"/>`, { left: '0px', top: '570px' });
  const ulp = ul.querySelector('path'); const ulL = 1000;
  ulp.setAttribute('stroke-dasharray', ulL); ulp.setAttribute('stroke-dashoffset', ulL);
  // l'annonce à languettes
  const fl = el('div', '', A.c, { left: '130px', top: '720px', width: '820px', height: '1060px', transform: 'rotate(-2deg)', transformOrigin: '50% 0%' });
  svgEl(fl, 820, 1060, `<path d="${tornRect(820, 800, 8, 20, 61)}" fill="${COL.paper}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 14px 16px rgba(0,0,0,.25))' });
  el('div', 'tex tex-paper', fl, { height: '800px' });
  tape(fl, 330, -24, 170, 50, -4);
  // pictogramme maison au feutre
  svgEl(fl, 220, 200, `<path d="M20,98 L110,22 L200,98 M42,82 L42,184 L178,184 L178,82 M90,184 L90,124 L130,124 L130,184" fill="none" stroke="${COL.ink}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/><rect x="146" y="38" width="20" height="40" fill="${COL.ink}"/>`, { left: '300px', top: '70px' });
  el('div', '', fl, { left: '0px', top: '300px', width: '820px', textAlign: 'center', font: '900 150px/1 BSS', color: COL.ink, letterSpacing: '0.02em' }, 'FICHES <span style="color:#E8291C">IMMO</span>');
  const ty = typer(fl, 'à voir sur La Source', { left: '0px', top: '486px', width: '820px', textAlign: 'center', font: '54px/1 ELITE', color: COL.ink });
  // pointillés de découpe + languettes
  const TAB = { n: 8, w: 820 / 8, h: 250, y: 560 };
  svgEl(fl, 820, 20, `<path d="M10,10 L810,10" stroke="${COL.ink}" stroke-width="3" stroke-dasharray="12 12" stroke-opacity=".5"/>`, { left: '0px', top: (TAB.y - 10) + 'px' });
  const tabs = [];
  for (let i = 0; i < TAB.n; i++) {
    const tb = el('div', '', fl, { left: (i * TAB.w) + 'px', top: TAB.y + 'px', width: TAB.w + 'px', height: TAB.h + 'px', background: COL.paper, boxSizing: 'border-box', borderLeft: i ? `3px dashed rgba(20,18,16,.45)` : 'none', transformOrigin: '50% 0%', boxShadow: '0 8px 10px rgba(0,0,0,.12)' });
    el('div', 'tex tex-paper', tb);
    el('div', '', tb, { left: '50%', top: '50%', font: '700 30px/1 MONO', color: COL.ink, whiteSpace: 'nowrap', transform: 'translate(-50%,-50%) rotate(90deg)', letterSpacing: '0.06em' }, 'LA SOURCE');
    tabs.push(tb);
  }
  const TORN = 5, tornTab = tabs[TORN];
  // trou laissé par la languette arrachée
  const hole = el('div', '', fl, { left: (TORN * TAB.w) + 'px', top: TAB.y + 'px', width: TAB.w + 'px', height: '16px', background: COL.paper, zIndex: 0 });
  return {
    upd(t) {
      const v = t >= 10.6 && t < 13.64; show(A.wrap, v); if (!v) return;
      pasteUpd(A, pa, t, 10.6, 0.4);
      setSlam(t1, t, 11.05, -1.5);
      setSlam(t2, t, 11.2, -1);
      ulp.setAttribute('stroke-dashoffset', (ulL * (1 - E.out3(P(t, 11.35, 11.62)))).toFixed(1));
      ty.set(P(t, 11.65, 12.05), t);
      // la languette tremble, se détache, tombe en tournant
      const a = t - 12.3;
      show(hole, a > 0);
      if (a < 0) {
        const w = P(t, 12.08, 12.3);
        tornTab.style.transform = `rotate(${(Math.sin(t * 70) * 3 * w).toFixed(2)}deg) translateY(${(10 * w).toFixed(1)}px)`;
      } else {
        const y = 10 + 60 * a + 1900 * a * a, x = 140 * a, r = 25 * a + 260 * a * a;
        tornTab.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`;
      }
      tornTab.style.zIndex = 5;
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S6 · 13,2–15,3 s · ÉCRIS-MOI EN PRIVÉ — l'avion en papier ═══════════ */
function buildS6() {
  const A = poster('s6', { bg: COL.ink, tex: 'ink', z: 6 });
  const pa = makePaste(22, 67), R = rng(606);
  svgEl(A.c, 1080, 760, `<path d="${halftone(1080, 760, 22, (x, y) => Math.max(0, 1 - Math.hypot(1080 - x, 760 - y) / 760) * 0.8)}" fill="${COL.red}"/>`, { left: '0px', top: '1160px' });
  const ty = typer(A.c, 'UNE DEMANDE ?', { left: '86px', top: '330px', font: '86px/1 ELITE', color: COL.paper });
  const t1 = el('div', '', A.c, { left: '66px', top: '470px', font: '900 176px/1 ANY', fontStretch: '92%', color: COL.paper, whiteSpace: 'nowrap', transformOrigin: '30% 60%' }, 'ÉCRIS-MOI');
  const t2 = el('div', '', A.c, { left: '56px', top: '680px', font: '900 268px/1 BSS', color: COL.red, whiteSpace: 'nowrap', transformOrigin: '30% 60%' }, 'EN PRIVÉ');
  // trajectoire de l'avion (Bézier cubique) + traînée en pointillés
  const B = [[-220, 1780], [300, 1180], [760, 1860], [1340, 1120]];
  const bz = (p) => { const q = 1 - p; return [0, 1].map(k => q * q * q * B[0][k] + 3 * q * q * p * B[1][k] + 3 * q * p * p * B[2][k] + p * p * p * B[3][k]); };
  const trail = svgEl(A.c, 1080, 1920, `<path d="" fill="none" stroke="${COL.paper}" stroke-width="8" stroke-linecap="round" stroke-dasharray="20 26" stroke-opacity=".85"/>`, { left: '0px', top: '0px' });
  const tp = trail.querySelector('path');
  const plane = svgEl(A.c, 260, 180, `<path d="M0,64 L250,0 L92,96 Z" fill="${COL.light}"/><path d="M92,96 L250,0 L124,150 Z" fill="#D8CDB4"/><path d="M92,96 L112,176 L124,150 Z" fill="#A89878"/><path d="M0,64 L250,0 L92,96 L124,150" fill="none" stroke="${COL.ink}" stroke-width="3" stroke-linejoin="round" stroke-opacity=".5"/>`, { left: '0px', top: '0px', transformOrigin: '125px 90px' });
  return {
    upd(t) {
      const v = t >= 13.2 && t < 15.3 || (TILE_MODE && t >= 13.2 && t <= 15.31); show(A.wrap, v); if (!v) return;
      pasteUpd(A, pa, t, 13.2, 0.4);
      ty.set(P(t, 13.6, 13.95), t);
      setSlam(t1, t, 14.05, -1.5);
      setSlam(t2, t, 14.25, -2.5);
      const p = E.io2(P(t, 14.4, 15.2));
      const [x, y] = bz(p), [x2, y2] = bz(Math.min(1, p + 0.01));
      const ang = Math.atan2(y2 - y, x2 - x) * 57.3;
      show(plane, p > 0 && p < 1);
      tf(plane, x - 125, y - 90, ang + 10 + Math.sin(t * 9) * 3, 1);
      let d = '';
      if (p > 0) { const n = 60; for (let i = 0; i <= n; i++) { const [px, py] = bz(p * i / n); d += (i ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1); } }
      tp.setAttribute('d', d);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S7 · 15,3–18,8 s · le mur, REJOINS LA SOURCE ═══════════ */
function buildWall() {
  const Wl = el('div', '', cam, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', zIndex: 20 });
  const G = el('div', '', Wl, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', transformOrigin: '540px 960px' });
  const bg = el('div', '', G, { position: 'absolute', left: '-6000px', top: '-8000px', width: '13080px', height: '17920px', background: COL.wall });
  el('div', 'tex tex-ink', bg, { opacity: 0.8 });
  const names = ['s3', 's1', 's5', 's2', 's4', 's1', 's3', 's2', 's5', 's4', 's2', 's3', 's1', 's4'];
  const R = rng(2026); let k = 0; const imgs = [];
  for (let r = -1; r <= 1; r++) for (let c = -2; c <= 2; c++) {
    const center = r === 0 && c === 0, n = center ? 's6' : names[k++];
    const d = el('div', '', G, { position: 'absolute', left: (c * 1250 + (center ? 0 : (R() - 0.5) * 120)) + 'px', top: (r * 2110 + (center ? 0 : (R() - 0.5) * 120)) + 'px', width: '1080px', height: '1920px', transform: `rotate(${center ? 0 : ((R() - 0.5) * 7).toFixed(2)}deg)`, boxShadow: '0 40px 90px rgba(0,0,0,.65)' });
    const im = el('img', '', d, { width: '1080px', height: '1920px', display: 'block' }); im.src = 'tiles/' + n + '.png'; imgs.push(im);
    if (!center) { tape(d, 380, -40, 320, 96, (R() - 0.5) * 16); if (R() < 0.6) tape(d, 760, 1840, 320, 96, (R() - 0.5) * 16); }
  }
  const veil = el('div', '', Wl, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', background: '#000', opacity: 0 });
  const cv = el('canvas', '', Wl, { position: 'absolute', left: '0px', top: '0px' }); cv.width = W; cv.height = H;
  const parts = new Parts(cv), PR = rng(3030);
  const rj = el('div', '', Wl, { position: 'absolute', left: '0px', top: '520px', width: '1080px', textAlign: 'center', font: '205px/1 SPRAY', color: COL.fluo, transformOrigin: '50% 50%', whiteSpace: 'nowrap' }, 'REJOINS');
  const drips = dripsSvg(Wl, [[150, 70, 12, 0], [330, 110, 14, 0.08], [560, 55, 10, 0.16], [740, 95, 13, 0.05], [905, 60, 11, 0.2]], COL.fluo, 735);
  sprayMist(parts, PR, { t0: 16.5, t1: 16.85, x0: 60, x1: 1020, y0: 540, y1: 730, n: 900, col: COL.fluo, spread: 70, yspread: 80 });
  const ls = el('div', '', Wl, { position: 'absolute', left: '0px', top: '880px', width: '1080px', textAlign: 'center', font: '900 236px/1 BSS', color: COL.light, whiteSpace: 'nowrap', transformOrigin: '50% 50%', textShadow: `9px 7px 0 ${COL.red}` }, 'LA SOURCE');
  const sk = el('div', '', Wl, { position: 'absolute', left: '80px', top: '1240px', width: '920px', height: '250px', borderRadius: '34px', background: COL.light, border: `7px solid ${COL.ink}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px', boxShadow: '0 18px 34px rgba(0,0,0,.5)', transformOrigin: '50% 50%' },
    `<div style="font:900 74px/1 ANY;font-stretch:96%;color:${COL.ink};letter-spacing:-0.01em">TOUT EST DISPO</div><div style="font:700 37px/1 MONO;color:${COL.ink};letter-spacing:.01em">t.me/lasoucetoutestdisponibleoff</div>`);
  return {
    imgs,
    upd(t, o) {
      const v = !o.tile && t >= 15.3;
      show(Wl, v); if (!v) return;
      const pp = E.io3(P(t, 15.3, 16.5));
      tf(G, -60 * pp, 30 * pp, 3 * pp, lerp(1, 0.3, pp) * (1 - 0.04 * P(t, 16.5, SDUR)));
      op(veil, 0.55 * P(t, 16.1, 16.5));
      sprayReveal(rj, P(t, 16.5, 16.85), 96);
      tf(rj, 0, 0, -4, 1 + (t > 16.85 ? 0.04 * Math.exp(-(t - 16.85) * 9) : 0));
      drips(t, 16.8);
      setSlam(ls, t, 16.85, -2, SLAM0, 0.08);
      const a = t - 17.15, s = spring(a, 2.2, 0.47);
      op(sk, a > 0 ? 1 : 0); tf(sk, 0, 0, lerp(-10, -2.5, s) + Math.sin(t * 2) * 0.5 * clamp(a), 1 + 0.32 * (1 - s));
      parts.draw(t);
    },
  };
}

/* ═══════════ caméra, flash, rendu ═══════════ */
function camAt(t) {
  let x = 0, y = 0, s = 1, r = 0;
  for (const c of CUES) {
    if (!c.sh && !c.pu) continue;
    const a = t - c.t; if (a < 0 || a > 1.4) continue;
    const e = Math.exp(-a * 11), sh = c.sh || 0;
    x += sh * e * Math.sin(a * 2 * Math.PI * 17 + c.t * 7);
    y += sh * e * 0.8 * Math.cos(a * 2 * Math.PI * 13 + c.t * 3);
    r += sh * 0.022 * e * Math.sin(a * 2 * Math.PI * 9 + c.t);
    s += (c.pu || 0) * Math.exp(-a * 9) * clamp(a / 0.03);
  }
  const f = 1 - P(t, 14.9, 15.4);
  x += 5 * Math.sin(t * 0.9) * f; y += 4 * Math.sin(t * 0.63 + 1) * f; r += 0.2 * Math.sin(t * 0.5) * f;
  return { x, y, s, r };
}
function flashAt(t) { for (const c of CUES) if (c.fl) { const a = t - c.t; if (a >= 0 && a < 0.1) return [c.fl[0], c.fl[1] * (1 - a / 0.1)]; } return null; }

async function main() {
  await document.fonts.load('900 100px BSS'); await document.fonts.load('900 100px ANY'); await document.fonts.load('100px ELITE');
  await document.fonts.load('100px MARK'); await document.fonts.load('100px SPRAY'); await document.fonts.load('700 100px MONO');
  await document.fonts.ready;
  SCENES.push(buildS1(), buildS2(), buildS3(), buildS4(), buildS5(), buildS6());
  const wall = buildWall(); SCENES.push(wall);
  if (!TILE_MODE) await Promise.all(wall.imgs.map(im => im.decode().catch(() => {})));
  window.renderAt = (t, o = {}) => {
    const c = o.tile ? { x: 0, y: 0, s: 1, r: 0 } : camAt(t);
    cam.style.transform = `translate(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px) rotate(${c.r.toFixed(3)}deg) scale(${c.s.toFixed(4)})`;
    const f = o.tile ? null : flashAt(t);
    flashEl.style.background = f ? f[0] : 'transparent'; flashEl.style.opacity = f ? f[1].toFixed(3) : 0;
    show(vign, !o.tile);
    for (const s of SCENES) s.upd(t, o);
  };
  window.__dur = SDUR; window.__fps = FPS;
  window.renderAt(0);
  window.__ready = true;
}
main();
