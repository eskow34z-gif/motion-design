/* MANIF01 — « La rue a de la mémoire » : 11 affiches collées les unes sur les autres, puis le mur. */
'use strict';
const Q = new URLSearchParams(location.search);
const TILE_MODE = Q.has('tile');
const stage = document.getElementById('stage'), cam = document.getElementById('cam'), flashEl = document.getElementById('flash'), vign = document.getElementById('vign');
const SCENES = [];

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
function slamS(t, t0, from = 1.7, d = 0.07) {
  // tombe de haut (grand → 1) puis petit rebond
  if (t < t0 - d) return null;
  if (t < t0) return lerp(from, 1, E.in3(P(t, t0 - d, t0)));
  return 1 - 0.045 * Math.exp(-(t - t0) * 14) * Math.cos((t - t0) * 40);
}
function setSlam(e, t, t0, rot = 0, from = 1.7, d = 0.07, x = 0, y = 0) {
  const s = slamS(t, t0, from, d);
  if (s === null) { op(e, 0); return; }
  op(e, t < t0 - d * 0.6 ? 0.5 : 1);
  tf(e, x, y, rot, s);
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

/* ═══════════ S1 · 0–3 s · Créteil, un lycée dit STOP ═══════════ */
function buildS1() {
  const A = poster('s1', { bg: COL.paper, tex: 'paper', h: 2900, z: 1 });
  const pa = makePaste(-24, 11), R = rng(101);
  svgEl(A.c, 1080, 900, `<path d="${halftone(1080, 900, 20, (x, y) => Math.max(0, 1 - Math.hypot(1080 - x, y) / 820))}" fill="${COL.ink}"/>`, { left: '0px', top: '0px' });
  svgEl(A.c, 1080, 1080, [0, 1, 2, 3].map(k => `<circle cx="540" cy="540" r="${220 + k * 120}" fill="none" stroke="${COL.ink}" stroke-width="${10 - k * 2}" stroke-opacity="${(0.15 - k * 0.03).toFixed(2)}"/>`).join(''), { left: '0px', top: '610px' });
  const waves = svgEl(A.c, 1080, 1920, [0, 1, 2].map(k => `<circle cx="540" cy="1150" r="10" fill="none" stroke="${k === 1 ? COL.ink : COL.red}" stroke-width="${14 - k * 3}"/>`).join(''), { left: '0px', top: '0px' });
  const wc = [...waves.querySelectorAll('circle')];
  const st = el('div', 'worn', A.c, { left: '80px', top: '236px', width: '610px', height: '118px', boxSizing: 'border-box', border: `7px solid ${COL.red}`, borderRadius: '6px', font: '700 58px/1 MONO', color: COL.red, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 50%' }, 'MI-SEPT.&nbsp;2026');
  const cr = letters(A.c, 'CRÉTEIL', { left: '48px', top: '352px', font: '900 310px/1 BSS', color: COL.ink, letterSpacing: '-0.01em' });
  const strip = el('div', '', A.c, { left: '132px', top: '760px', width: '820px', height: '150px', transformOrigin: '50% 50%' });
  svgEl(strip, 820, 150, `<path d="${tornRect(820, 150, 14, 22, 5)}" fill="${COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.2))' });
  el('div', '', strip, { position: 'absolute', left: '0px', top: '32px', width: '820px', textAlign: 'center', font: '84px/1 ELITE', color: COL.ink }, 'UN LYCÉE DIT');
  const tp = [tape(strip, -46, -16, 150, 46, -14), tape(strip, 716, 104, 150, 46, -9)];
  const stop = el('div', '', A.c, { left: '40px', top: '930px', font: '400px/1 SPRAY', color: COL.red, transformOrigin: '50% 50%', letterSpacing: '-0.04em' }, 'STOP');
  const drips = dripsSvg(A.c, [[150, 170, 14, 0], [310, 90, 10, 0.12], [455, 240, 16, 0.05], [600, 120, 11, 0.2], [760, 200, 14, 0.08], [905, 80, 10, 0.25]], COL.red, 1255);
  const cw = el('div', 'grp', A.c, { height: '2900px' });
  const back = crowd(cw, { w: 1080, h: 520, n: 15, seed: 9, col: '#3B3530', sc: 0.72, top: 0.36, y: 1330, plac: ['GRÈVE', 'AVENIR', 'PROFS !', 'MOYENS'], placCol: [COL.paper, COL.red], pr: 0.32 });
  const front = crowd(cw, { w: 1080, h: 520, n: 11, seed: 5, col: COL.ink, y: 1400, plac: ['PROFS ?', 'MOYENS !', 'AVENIR', 'ON EST LÀ', 'STOP'], placCol: [COL.light, COL.red, COL.light], pr: 0.45 });
  el('div', '', cw, { left: '0px', top: '1912px', width: '1080px', height: '1000px', background: COL.ink });
  // particules : brume d'encre des lettres, brume rouge de STOP, éclats du tampon
  cr.spans.forEach((s, i) => { const r = rectOf(s); burst(A.parts, R, { t: 0.45 + i * 0.075, x: r.x + r.w / 2, y: r.y + r.h * 0.5, rx: r.w * 0.9, ry: r.h * 0.7, n: 70, v0: 10, v1: 90, k: 9, r0: 0.6, r1: 2.6, col: COL.ink, a: 0.45 }); });
  sprayMist(A.parts, R, { t0: 1.45, t1: 1.95, x0: 60, x1: 1040, y0: 1010, y1: 1320, n: 1500, col: COL.red, spread: 70, yspread: 90 });
  burst(A.parts, R, { t: 0.25, x: 366, y: 295, rx: 520, ry: 110, n: 60, v0: 60, v1: 380, k: 8, r0: 1, r1: 5, col: COL.red, a: 0.8 });
  burst(A.parts, R, { t: 1.97, x: 540, y: 1150, rx: 900, ry: 300, n: 90, v0: 300, v1: 1400, k: 6, r0: 1.2, r1: 7, col: COL.red, a: 0.9 });
  return {
    upd(t) {
      show(A.wrap, t < 5.86); if (t >= 5.86) return;
      pasteUpd(A, pa, t, -0.16, 0.42);
      const pan = -820 * E.io3(P(t, 3.0, 3.55)) - 40 * Math.max(0, t - 3.55);
      tf(A.wrap, 0, pan, 0, 1.035 - 0.035 * E.out3(P(t, 0, 3)));
      // tampon
      const ps = P(t, 0.17, 0.25);
      op(st, ps > 0 ? 1 : 0); tf(st, 0, 0, lerp(-16, -4, ps), t < 0.25 ? lerp(2.5, 1, E.in2(ps)) : 1 - 0.05 * Math.exp(-(t - 0.25) * 16));
      // CRÉTEIL au pochoir, lettre par lettre, avec décalage de repérage rouge
      cr.spans.forEach((s, i) => {
        const a = t - (0.45 + i * 0.075);
        s.style.opacity = a < 0 ? 0 : a < 0.034 ? 0.5 : 1;
        const m = 1 - E.out3(P(a, 0, 0.5));
        s.style.transform = `translate(${jit(t, i * 3, 0.8).toFixed(1)}px,${(-12 * (1 - E.out3(P(a, 0, 0.12)))).toFixed(1)}px)`;
        s.style.textShadow = `${(10 * m + 2.5 + jit(t, i, 1)).toFixed(1)}px ${(7 * m + 2 + jit(t, i + 9, 1)).toFixed(1)}px 0 rgba(232,41,28,${(0.75 * m + 0.28).toFixed(2)})`;
      });
      // bande collée
      const as = t - 1.1, sp = spring(as, 2.6, 0.5);
      op(strip, as > 0 ? 1 : 0); tf(strip, 0, -60 * (1 - sp), lerp(-9, -1.5, sp), 1 + 0.28 * (1 - sp));
      tp.forEach((e, i) => { const a = t - 1.24 - i * 0.06; op(e, a > 0 ? 1 : 0); e.style.transform = `rotate(${i ? -9 : -14}deg) scale(${(1 + 0.4 * (1 - E.out3(P(a, 0, 0.12)))).toFixed(3)})`; });
      // STOP bombé
      sprayReveal(stop, P(t, 1.45, 1.95), 96);
      const ah = t - 1.97;
      tf(stop, 0, 0, -5, 1 + (ah > 0 ? 0.09 * Math.exp(-ah * 11) : 0));
      wc.forEach((c, k) => { const a = ah - k * 0.09; if (a < 0) { c.setAttribute('r', 0); return; } c.setAttribute('r', (120 + 1500 * E.out2(P(a, 0, 1.0))).toFixed(1)); c.setAttribute('stroke-opacity', (0.75 * (1 - P(a, 0, 1.0))).toFixed(3)); });
      drips(t, 2.0);
      // la foule se lève
      tf(cw, 0, 560 * (1 - E.out3(P(t, 1.62, 2.35))));
      const en = 1 + 1.6 * Math.exp(-Math.max(0, t - 1.97) * 3) * (t > 1.97 ? 1 : 0);
      front.update(t, en); back.update(t * 0.92 + 3, en * 0.8);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S2 · 3–5,5 s · les pancartes ═══════════ */
function buildS2() {
  const L = el('div', 'grp', cam, { zIndex: 2 });
  function placard(o) {
    const w = el('div', '', L, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', transformOrigin: `${o.w / 2}px ${o.h + 260}px` });
    el('div', '', w, { position: 'absolute', left: (o.w / 2 - 17) + 'px', top: (o.h - 30) + 'px', width: '34px', height: '1600px', background: 'linear-gradient(90deg,#9C7A45,#D2B27A 45%,#9C7A45)', boxShadow: '0 0 12px rgba(0,0,0,.35)' });
    el('div', '', w, { position: 'absolute', left: (o.w / 2 - 48) + 'px', top: (o.h + 140) + 'px', width: '96px', height: '118px', borderRadius: '34px', background: COL.ink, boxShadow: '0 0 0 4px rgba(238,231,215,.08)' });
    const b = el('div', '', w, { position: 'absolute', left: '0px', top: '0px', width: o.w + 'px', height: o.h + 'px', background: o.bg, border: `7px solid ${COL.ink}`, boxSizing: 'border-box', borderRadius: '8px', boxShadow: '0 28px 44px rgba(0,0,0,.5)', overflow: 'hidden' });
    el('div', 'tex tex-paper', b);
    const inner = el('div', '', b, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', font: o.font, color: o.col, textAlign: 'center' }, o.html);
    return { w, inner, o };
  }
  const P1 = placard({ x: 110, y: 250, w: 900, h: 430, bg: COL.light, font: '118px/1 MARK', col: COL.ink, html: 'PROFS PAS<br>REMPLACÉS', t: 3.05, rot: -6, sg: -1, ph: 0 });
  const P2 = placard({ x: 95, y: 735, w: 900, h: 440, bg: COL.red, font: '128px/1 MARK', col: COL.light, html: 'CLASSES<br>BLINDÉES', t: 3.75, rot: 5, sg: 1, ph: 2 });
  const P3 = placard({ x: 80, y: 1195, w: 920, h: 410, bg: COL.ink, font: `900 132px/1 ANY`, col: COL.light, html: '<div style="font-stretch:82%;letter-spacing:-0.02em">PARCOURSUP</div><div class="wait" style="display:flex;align-items:center;gap:22px;margin-top:26px;font:700 38px/1 MONO;letter-spacing:.06em;color:#EEE7D7"><svg width="64" height="64" viewBox="0 0 64 64" style="position:static"><circle cx="32" cy="32" r="24" fill="none" stroke="rgba(238,231,215,.25)" stroke-width="8"/><path class="spin" d="M32 8 A24 24 0 0 1 56 32" fill="none" stroke="#E8291C" stroke-width="8" stroke-linecap="round"/></svg><span class="dots">EN ATTENTE</span></div>', t: 4.5, rot: -3, sg: -1, ph: 4 });
  const spin = P3.inner.querySelector('.spin'), dots = P3.inner.querySelector('.dots');
  // les élèves serrés dans la classe : petites têtes qui débordent
  const heads = svgEl(P2.inner.parentNode, 900, 440, Array.from({ length: 34 }, (_, i) => { const R = rng(i + 70); return `<circle cx="${(30 + (i % 17) * 50 + R() * 10).toFixed(0)}" cy="${(i < 17 ? 398 : 430) + R() * 6}" r="${17 + R() * 5}" fill="${COL.ink}"/>`; }).join(''), { left: '0px', top: '0px' });
  const hs = [...heads.querySelectorAll('circle')];
  return {
    upd(t) {
      show(L, t >= 3.0 && t < 5.86); if (!(t >= 3.0 && t < 5.86)) return;
      for (const { w, o } of [P1, P2, P3]) {
        const a = t - o.t;
        if (a < 0) { op(w, 0); continue; }
        op(w, 1);
        const y = 1700 * (1 - spring(a, 1.9, 0.52));
        const r = o.rot + 8 * (1 - spring(a, 1.4, 0.3)) * o.sg + Math.sin(t * 2.3 + o.ph) * 1.6 * clamp(a * 2);
        tf(w, 0, y + Math.sin(t * 2.3 + o.ph) * 6 * clamp(a * 2), r);
      }
      spin.setAttribute('transform', `rotate(${(t * 420) % 360} 32 32)`);
      dots.textContent = 'EN ATTENTE' + '.'.repeat(1 + (on12(t) >> 2) % 3);
      hs.forEach((c, i) => c.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * 7 + i)) * 7).toFixed(1)})`));
    },
  };
}

/* ═══════════ S3 · 5,5–8 s · la carte, 1 lycée sur 3 ═══════════ */
function buildS3() {
  const A = poster('s3', { bg: COL.ink, tex: 'ink', z: 3 });
  const pa = makePaste(78, 23), R = rng(303);
  const title = typer(A.c, 'DEUX SEMAINES APRÈS', { left: '0px', top: '168px', width: '1080px', textAlign: 'center', font: '64px/1 ELITE', color: COL.light });
  const mc = el('canvas', '', A.c, { left: '0px', top: '0px' }); mc.width = W; mc.height = H;
  const mx = mc.getContext('2d');
  const S = 87.7, x0 = 105, y0 = 285, kx = 0.688;
  const pr = (lon, lat) => [x0 + (lon + 4.8) * kx * S, y0 + (51.1 - lat) * S];
  const FR = FRANCE.map(([a, b]) => pr(a, b)), CO = CORSE.map(([a, b]) => pr(a, b));
  const [cx, cy] = pr(2.46, 48.79);
  const dots = [], g = 19;
  for (let y = y0 - 10; y < y0 + 900; y += g) {
    const row = Math.round((y - y0) / g);
    for (let x = x0 - 20; x < x0 + 920; x += g) {
      const xx = x + (row % 2) * g / 2;
      if (inPoly(xx, y, FR) || inPoly(xx, y, CO)) { const d = Math.hypot(xx - cx, y - cy); dots.push({ x: xx, y, d, sel: d < 14 || hash(Math.round(xx), Math.round(y)) < 0.31 }); }
    }
  }
  const lab = el('div', '', A.c, { left: (cx + 26) + 'px', top: (cy - 52) + 'px', font: '700 28px/1 MONO', color: COL.light, letterSpacing: '0.06em' }, 'CRÉTEIL');
  svgEl(A.c, 1080, 520, `<path d="${halftone(1080, 520, 22, (x, y) => (y / 520) * 0.55)}" fill="${COL.paper}" fill-opacity=".12"/>`, { left: '0px', top: '1400px' });
  const l1 = typer(A.c, 'PRÈS D’UN LYCÉE', { left: '0px', top: '1218px', width: '1080px', textAlign: 'center', font: '74px/1 ELITE', color: COL.light });
  const sur3 = el('div', '', A.c, { left: '0px', top: '1292px', width: '1080px', textAlign: 'center', font: '900 350px/1 BSS', color: COL.red, transformOrigin: '50% 55%' }, 'SUR 3');
  burst(A.parts, R, { t: 7.0, x: 540, y: 1470, rx: 700, ry: 200, n: 70, v0: 200, v1: 1200, k: 6, r0: 1, r1: 6, col: COL.red, a: 0.85 });
  return {
    upd(t) {
      show(A.wrap, t >= 5.5 && t < 8.36); if (!(t >= 5.5 && t < 8.36)) return;
      pasteUpd(A, pa, t, 5.5, 0.32);
      title.set(P(t, 5.62, 6.1), t);
      mx.clearRect(0, 0, W, H);
      const buckets = { p: [], w: [], r: [] };
      for (const d of dots) {
        const a = t - (5.66 + d.d / 1700);
        if (a < 0) continue;
        let r = 6.0 * E.outBack(P(a, 0, 0.22)), k = 'p';
        const ah = t - (6.05 + d.d / 1050);
        if (ah >= 0 && ah < 0.24) { r += 5 * (1 - ah / 0.24); k = 'w'; }
        else if (ah >= 0.24 && d.sel) { r = 7.4; k = 'r'; }
        buckets[k].push(d.x, d.y, r);
      }
      for (const [k, c, al] of [['p', COL.paper, 0.42], ['w', '#FFFFFF', 0.95], ['r', COL.red, 1]]) {
        const b = buckets[k]; mx.globalAlpha = al; mx.fillStyle = c; mx.beginPath();
        for (let i = 0; i < b.length; i += 3) { mx.moveTo(b[i] + b[i + 2], b[i + 1]); mx.arc(b[i], b[i + 1], b[i + 2], 0, 6.2832); }
        mx.fill();
      }
      const Rw = (t - 6.05) * 1050;
      if (Rw > 0 && Rw < 1150) {
        mx.globalAlpha = 0.85 * (1 - Rw / 1150); mx.strokeStyle = COL.red; mx.lineWidth = 8; mx.beginPath(); mx.arc(cx, cy, Rw, 0, 6.2832); mx.stroke();
        mx.globalAlpha = 0.35 * (1 - Rw / 1150); mx.lineWidth = 3; mx.beginPath(); mx.arc(cx, cy, Math.max(1, Rw - 90), 0, 6.2832); mx.stroke();
      }
      if (t > 5.72) {
        const ph = ((t - 5.72) % 0.55) / 0.55;
        mx.globalAlpha = 1 - ph; mx.strokeStyle = COL.red; mx.lineWidth = 4; mx.beginPath(); mx.arc(cx, cy, 14 + 52 * ph, 0, 6.2832); mx.stroke();
        mx.globalAlpha = 1; mx.fillStyle = COL.red; mx.beginPath(); mx.arc(cx, cy, 13 * E.outBack(P(t, 5.72, 5.9)), 0, 6.2832); mx.fill();
      }
      mx.globalAlpha = 1;
      op(lab, P(t, 5.78, 5.84));
      l1.set(P(t, 6.6, 6.95), t);
      setSlam(sur3, t, 7.0, 0, 1.9, 0.08);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S4 · 8–11 s · 17 octobre, + d'un demi-million (construit deux fois pour la déchirure) ═══════════ */
const TEAR = (() => { const R = rng(4711), pts = []; for (let i = 0; i <= 52; i++) { const u = i / 52; pts.push([lerp(790, 270, u) + (R() - 0.5) * 50 + Math.sin(u * 17) * 14, lerp(-60, 1980, u)]); } return pts; })();
const tearStr = TEAR.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',');
const CLIP_L = `polygon(-120px -120px,${tearStr},-120px 2040px)`, CLIP_R = `polygon(1200px -120px,${tearStr},1200px 2040px)`;
function buildS4(id, z) {
  const A = poster(id, { bg: COL.paper, tex: 'paper', z });
  const pa = makePaste(200, 41), R = rng(404);
  svgEl(A.c, 1080, 560, `<path d="${halftone(1080, 560, 18, (x, y) => Math.max(0, 0.7 - Math.hypot(1080 - x, y) / 700))}" fill="${COL.ink}" fill-opacity=".85"/>`, { left: '0px', top: '0px' });
  const cal = el('div', '', A.c, { left: '100px', top: '150px', width: '330px', height: '360px', transformOrigin: '50% 0%' });
  function calPage(n) {
    const p = el('div', '', cal, { position: 'absolute', left: '0px', top: '0px', width: '330px', height: '360px', background: COL.light, borderRadius: '4px', boxShadow: '6px 12px 22px rgba(0,0,0,.28)', overflow: 'hidden', transformOrigin: '0% 0%' });
    el('div', '', p, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '86px', background: COL.red, font: '700 40px/86px MONO', color: COL.light, textAlign: 'center', letterSpacing: '0.1em' }, 'OCTOBRE');
    el('div', '', p, { position: 'absolute', left: '0px', top: '96px', width: '100%', textAlign: 'center', font: '900 250px/1 BSS', color: COL.ink }, n);
    el('div', 'tex tex-paper', p);
    return p;
  }
  calPage('17'); const p16 = calPage('16');
  svgEl(cal, 330, 40, Array.from({ length: 7 }, (_, i) => `<rect x="${18 + i * 44}" y="0" width="12" height="36" rx="6" fill="${COL.ink}"/>`).join(''), { left: '0px', top: '-16px' });
  const plus = typer(A.c, 'PLUS D’UN', { left: '470px', top: '200px', font: '70px/1 ELITE', color: COL.ink });
  const demi = el('div', '', A.c, { left: '462px', top: '284px', font: '900 132px/0.86 ANY', color: COL.ink, letterSpacing: '-0.03em', transformOrigin: '0% 50%' }, 'DEMI-');
  const mil = el('div', '', A.c, { left: '462px', top: '398px', font: '900 132px/0.86 ANY', color: COL.ink, letterSpacing: '-0.03em', transformOrigin: '0% 50%' }, 'MILLION');
  const G = el('div', 'grp', A.c);
  const blk = el('div', '', G, { left: '-80px', top: '540px', width: '1240px', height: '1500px', transform: 'rotate(3deg)', transformOrigin: '50% 0%' });
  svgEl(blk, 1240, 1500, `<path d="${tornRect(1240, 1500, 22, 26, 44)}" fill="${COL.ink}"/><path d="${halftone(1240, 1500, 22, (x, y) => Math.max(0, 0.5 - y / 1500))}" fill="${COL.paper}" fill-opacity=".16"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 -10px 18px rgba(0,0,0,.35))' });
  const oc = { w: 128, h: 206, gap: 8, space: 30, fs: 200, rad: 10 };
  const c1 = odometer(G, '### ###', Object.assign({ cell: COL.light, col: COL.ink }, oc)); Object.assign(c1.box.style, { left: '121px', top: '770px' });
  const c2 = odometer(G, '### ###', Object.assign({ cell: COL.red, col: COL.light }, oc)); Object.assign(c2.box.style, { left: '121px', top: '1095px' });
  const lb1 = typer(G, 'SELON L’INTÉRIEUR', { left: '125px', top: '995px', font: '700 34px/1 MONO', color: COL.paper, letterSpacing: '0.04em' });
  const lb2 = typer(G, 'SELON LES ORGANISATEURS', { left: '125px', top: '1320px', font: '700 34px/1 MONO', color: COL.red, letterSpacing: '0.04em' });
  const rue = el('div', '', G, { left: '118px', top: '1392px', font: '900 128px/1 ANY', color: COL.paper, letterSpacing: '-0.02em' }, 'DANS LA RUE');
  const band = el('div', 'grp', G, { width: '2160px' });
  const cfg = { w: 1080, h: 420, n: 12, seed: 31, col: COL.red, y: 1600, plac: ['TOUS ENSEMBLE', 'VIE CHÈRE', 'NOS LYCÉES', 'AVENIR'], placCol: [COL.light, COL.paper], pr: 0.5, top: 0.42 };
  const cA = crowd(band, cfg), cB = crowd(band, Object.assign({}, cfg, { x: 1080 }));
  const fib = svgEl(A.c, 1080, 1920, `<polyline points="${TEAR.map(p => p.join(',')).join(' ')}" fill="none" stroke="${COL.light}" stroke-width="16" stroke-linejoin="round"/>`, { left: '0px', top: '0px' });
  burst(A.parts, R, { t: 8.42, x: 260, y: 360, rx: 300, ry: 300, n: 40, v0: 40, v1: 240, k: 3, g: 300, r0: 1, r1: 3, col: COL.paper, a: 0.8, life: 1.2 });
  return {
    A,
    upd(t) {
      pasteUpd(A, pa, t, 8.0, 0.3);
      const ac = t - 8.02;
      tf(cal, 0, -580 * (1 - spring(ac, 2.1, 0.45)), -5);
      const pt = P(t, 8.42, 8.9);
      show(p16, pt < 1); tf(p16, -60 * pt, 820 * E.in2(pt), -78 * E.in2(pt)); op(p16, 1 - P(t, 8.75, 8.9));
      plus.set(P(t, 8.38, 8.6), t);
      for (const [e, t0] of [[demi, 8.62], [mil, 8.76]]) { const p = P(t, t0, t0 + 0.28); op(e, P(t, t0 - 0.01, t0)); e.style.fontStretch = lerp(150, 100, E.outExpo(p)).toFixed(1) + '%'; }
      tf(G, 0, 1450 * (1 - E.outExpo(P(t, 8.45, 8.86))));
      c1.set(550000 * E.out5(P(t, 8.8, 9.75)));
      c2.set(800000 * E.out5(P(t, 9.5, 10.45)));
      lb1.set(P(t, 9.72, 10.02), t); lb2.set(P(t, 10.42, 10.78), t);
      tf(rue, -1300 * (1 - E.outExpo(P(t, 10.45, 10.8))), 0);
      tf(band, -((t * 150) % 1080), 0);
      cA.update(t, 1.3); cB.update(t, 1.3);
      show(fib, t >= 10.99);
      A.parts.draw(t);
    },
  };
}
function buildS4pair() {
  const a = buildS4('s4', 5), b = buildS4('s4b', 5);
  return {
    upd(t) {
      const va = t >= 8.0 && t < 11.62, vb = t >= 10.99 && t < 11.52;
      show(a.A.wrap, va); show(b.A.wrap, vb);
      if (va) {
        a.upd(t);
        if (t >= 10.99) { a.A.p.style.clipPath = CLIP_L; }
        const pl = E.in2(P(t, 11.12, 11.6));
        a.A.wrap.style.transformOrigin = '0px 1920px';
        a.A.wrap.style.transform = `translate(${(-1050 * pl).toFixed(1)}px,${(420 * pl).toFixed(1)}px) rotate(${(-20 * pl - 0.8 * P(t, 10.9, 11.1)).toFixed(2)}deg)`;
        a.A.wrap.style.filter = t >= 10.99 ? 'drop-shadow(0 28px 40px rgba(0,0,0,.5))' : 'none';
      }
      if (vb) {
        b.upd(t);
        b.A.p.style.clipPath = CLIP_R;
        const pr = E.in2(P(t, 11.0, 11.5));
        b.A.wrap.style.transformOrigin = '1080px 0px';
        b.A.wrap.style.transform = `translate(${(1150 * pr).toFixed(1)}px,${(-560 * pr).toFixed(1)}px) rotate(${(26 * pr + 1.2 * P(t, 10.95, 11.05)).toFixed(2)}deg)`;
        b.A.wrap.style.filter = 'drop-shadow(0 28px 40px rgba(0,0,0,.5))';
      }
    },
  };
}

/* ═══════════ S5 · 11–13 s · c'est pas nouveau (sous l'affiche arrachée) ═══════════ */
function buildS5() {
  const A = poster('s5', { bg: COL.old, tex: 'old', z: 4 });
  el('div', '', A.c, { left: '-80px', top: '110px', font: '900 250px/0.9 BSS', color: COL.red, opacity: 0.11, transform: 'rotate(-8deg)', whiteSpace: 'nowrap' }, 'GRÈVE<br>GÉNÉRALE');
  el('div', '', A.c, { left: '40px', top: '1560px', font: '900 190px/1 ANY', color: COL.ink, opacity: 0.07, transform: 'rotate(5deg)', whiteSpace: 'nowrap', fontStretch: '70%' }, 'NON À LA LOI');
  svgEl(A.c, 1080, 700, `<path d="${halftone(1080, 700, 24, (x, y) => Math.max(0, 0.6 - Math.hypot(x, 700 - y) / 900))}" fill="${COL.ink}" fill-opacity=".5"/>`, { left: '0px', top: '1220px' });
  const l1 = typer(A.c, 'MAIS LA JEUNESSE', { left: '0px', top: '1000px', width: '1080px', textAlign: 'center', font: '76px/1 ELITE', color: COL.ink });
  const l2 = typer(A.c, 'DANS LA RUE…', { left: '0px', top: '1092px', width: '1080px', textAlign: 'center', font: '76px/1 ELITE', color: COL.ink });
  const c1 = el('div', '', A.c, { left: '0px', top: '1212px', width: '1080px', textAlign: 'center', font: '900 156px/1 ANY', color: COL.red, letterSpacing: '-0.03em', transformOrigin: '50% 50%' }, 'C’EST PAS');
  const c2 = el('div', '', A.c, { left: '0px', top: '1366px', width: '1080px', textAlign: 'center', font: '900 156px/1 ANY', color: COL.red, letterSpacing: '-0.03em', transformOrigin: '50% 50%' }, 'NOUVEAU.');
  return {
    upd(t) {
      show(A.wrap, t >= 10.95 && t < 13.36); if (!(t >= 10.95 && t < 13.36)) return;
      A.wr.style.opacity = 0.3;
      l1.set(P(t, 11.45, 11.85), t); l2.set(P(t, 11.85, 12.12), t);
      setSlam(c1, t, 12.2, -2, 1.6, 0.06); setSlam(c2, t, 12.32, -2, 1.6, 0.06);
      const rw = P(t, 12.3, 12.95) * (1 - P(t, 12.85, 12.95));
      A.c.style.transform = `translate(${jit(t * 2, 5, 5 * rw).toFixed(1)}px,0)`;
    },
  };
}

/* ═══════════ S6 · 13–15 s · 1968, la mèche ═══════════ */
function buildS6() {
  const A = poster('s6', { bg: COL.red, tex: 'paper', z: 6 });
  const pa = makePaste(-90, 61), R = rng(606);
  svgEl(A.c, 1080, 900, `<path d="${halftone(1080, 900, 22, (x, y) => Math.max(0, 0.85 - Math.hypot(x, y) / 950))}" fill="${COL.ink}" fill-opacity=".8"/>`, { left: '0px', top: '0px' });
  const ink = letters(A.c, 'MAI', { left: '0px', top: '330px', width: '1080px', textAlign: 'center', font: '900 600px/1 BSS', color: COL.ink, opacity: 0.9 });
  const mai = letters(A.c, 'MAI', { left: '0px', top: '330px', width: '1080px', textAlign: 'center', font: '900 600px/1 BSS', color: COL.light });
  const LINES = ['LES ÉTUDIANTS', 'ALLUMENT', 'LA MÈCHE'];
  const ls = LINES.map((s, i) => letters(A.c, s, { left: '0px', top: (1000 + i * 112) + 'px', width: '1080px', textAlign: 'center', font: '900 108px/1 ANY', fontStretch: '82%', color: COL.ink, letterSpacing: '-0.01em' }));
  const all = ls.flatMap(l => l.spans), N = all.length;
  const FZ = 'M -40 1478 C 180 1398, 330 1568, 560 1480 S 900 1398, 1120 1472';
  const fz = svgEl(A.c, 1080, 1920, `<path d="${FZ}" fill="none" stroke="${COL.kraft}" stroke-width="10" stroke-dasharray="16 5" stroke-linecap="round"/><path class="burnt" d="${FZ}" fill="none" stroke="#24150C" stroke-width="12" stroke-linecap="round"/>`, { left: '0px', top: '0px' });
  const burnt = fz.querySelector('.burnt'), path = fz.querySelector('path'), L = path.getTotalLength();
  const glow = el('div', '', A.c, { left: '0px', top: '0px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle,#FFFBE0 0%,#FFD45A 18%,rgba(255,140,30,.55) 40%,rgba(255,90,0,0) 70%)', mixBlendMode: 'screen' });
  const pf = t => E.io2(P(t, 13.4, 14.35));
  const litT = all.map((_, i) => { for (let ts = 13.4; ts < 14.6; ts += 0.005) if (pf(ts) * 1.06 >= (i + 0.5) / N) return ts; return 14.6; });
  for (let ts = 13.4; ts < 14.36; ts += 1 / 60) { const q = path.getPointAtLength(pf(ts) * L); burst(A.parts, R, { t: ts, x: q.x, y: q.y, n: 5, v0: 160, v1: 700, dir: -Math.PI / 2, cone: 2.8, k: 1.5, g: 1700, r0: 1.4, r1: 2.2, col: ['#FFD86B', '#FFF3B0', '#FF9A2E'], sh: 's', len: 24, life: 0.55, fin: 0.5, flick: true }); }
  mai.spans.forEach((s, i) => { const r = rectOf(s); burst(A.parts, R, { t: 13.15 + i * 0.08, x: r.x + r.w / 2, y: r.y + r.h * 0.55, rx: r.w, ry: r.h * 0.6, n: 120, v0: 10, v1: 90, k: 9, r0: 0.7, r1: 3, col: COL.light, a: 0.4 }); });
  // pavés
  let pv = ''; const pav = [];
  for (let j = 0; j < 3; j++) { const n = 7 - (j % 2), wd = 150 + j * 10, hh = 78 + j * 8, y = 1660 + j * 92; for (let i = 0; i < n; i++) { const x = -40 + i * (wd + 14) + (j % 2) * 80; pv += `<g class="pv"><path d="M${x + 10},${y} L${x + wd - 10},${y} L${x + wd},${y + hh} L${x},${y + hh}Z" fill="${COL.ink}" stroke="rgba(238,231,215,.3)" stroke-width="3"/><path d="M${x + 12},${y + 4} L${x + wd - 12},${y + 4}" stroke="rgba(238,231,215,.45)" stroke-width="4"/></g>`; pav.push([x + wd / 2, y + hh / 2]); } }
  const pavS = svgEl(A.c, 1080, 1920, pv, { left: '0px', top: '0px' });
  const pgs = [...pavS.querySelectorAll('g.pv')], POP = [2, 8, 10, 15, 4, 17];
  const graf = typer(A.c, 'SOUS LES PAVÉS, LA PLAGE', { left: '70px', top: '1560px', font: '50px/1 MARK', color: COL.light, transform: 'rotate(-4deg)' });
  return {
    upd(t) {
      show(A.wrap, t >= 13.0 && t < 15.36); if (!(t >= 13.0 && t < 15.36)) return;
      pasteUpd(A, pa, t, 13.0, 0.3);
      mai.spans.forEach((s, i) => { const a = t - (13.15 + i * 0.08); const v = a < 0 ? 0 : a < 0.034 ? 0.5 : 1; s.style.opacity = v; ink.spans[i].style.opacity = v; ink.spans[i].style.transform = `translate(${(9 + jit(t, i, 2)).toFixed(1)}px,${(7 + jit(t, i + 4, 2)).toFixed(1)}px)`; });
      const f = pf(t), q = path.getPointAtLength(f * L);
      burnt.setAttribute('stroke-dasharray', `${(f * L).toFixed(1)} ${L.toFixed(0)}`);
      const burning = t > 13.38 && t < 14.4;
      show(glow, burning); if (burning) tf(glow, q.x - 75, q.y - 75, 0, 0.85 + 0.3 * hash(on12(t * 2), 3));
      all.forEach((s, i) => {
        const a = t - litT[i];
        if (a < 0) { s.style.color = 'rgba(20,18,16,.42)'; s.style.textShadow = 'none'; }
        else { s.style.color = COL.light; s.style.textShadow = a < 0.2 ? `0 0 ${(26 * (1 - a / 0.2)).toFixed(1)}px #FFD45A, 0 0 6px #FFF3B0` : 'none'; }
      });
      pgs.forEach((g2, i) => { const k = POP.indexOf(i); if (k < 0) return; const a = t - (14.45 + k * 0.05); const j = a > 0 && a < 0.42 ? Math.sin(Math.PI * a / 0.42) : 0; const [px, py] = pav[i]; g2.setAttribute('transform', `translate(0 ${(-110 * j).toFixed(1)}) rotate(${(j * (k % 2 ? 14 : -12)).toFixed(1)} ${px} ${py})`); });
      graf.set(P(t, 14.45, 14.9), t);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S7 · 15–17,5 s · 1986, retirée ═══════════ */
function buildS7() {
  const A = poster('s7', { bg: COL.old, tex: 'old', z: 7 });
  const pa = makePaste(180, 71), R = rng(707);
  svgEl(A.c, 90, 1920, `<path d="${tornRect(90, 1960, 26, 30, 9)}" fill="${COL.red}"/>`, { left: '-40px', top: '-20px' });
  svgEl(A.c, 1080, 800, `<path d="${halftone(1080, 800, 22, (x, y) => Math.max(0, 0.55 - Math.hypot(1080 - x, 800 - y) / 900))}" fill="${COL.ink}" fill-opacity=".35"/>`, { left: '0px', top: '1120px' });
  const card = el('div', '', A.c, { left: '110px', top: '470px', width: '860px', height: '480px', background: COL.light, boxShadow: '4px 16px 28px rgba(60,30,0,.3)', transformOrigin: '50% 50%' });
  el('div', 'tex tex-paper', card);
  const h1 = typer(card, 'PROJET DE LOI DEVAQUET', { position: 'absolute', left: '50px', top: '52px', font: '54px/1 ELITE', color: COL.ink });
  const rule = el('div', '', card, { position: 'absolute', left: '50px', top: '128px', width: '760px', height: '4px', background: COL.ink, transformOrigin: '0 50%' });
  const b1 = typer(card, 'Sélection à l’entrée\nde la fac ?', { position: 'absolute', left: '50px', top: '178px', font: '78px/1.18 ELITE', color: COL.ink });
  tape(card, 40, -22, 170, 50, -8); tape(card, 670, -18, 170, 50, 9);
  const stamp = el('div', 'worn', A.c, { left: '130px', top: '1000px', width: '820px', height: '250px', boxSizing: 'border-box', border: `12px solid ${COL.red}`, borderRadius: '16px', transformOrigin: '50% 50%' });
  el('div', '', stamp, { position: 'absolute', left: '10px', top: '10px', right: '10px', bottom: '10px', border: `4px solid ${COL.red}`, borderRadius: '8px' });
  el('div', '', stamp, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 196px/1 BSS', color: COL.red, letterSpacing: '0.06em', paddingTop: '6px', boxSizing: 'border-box' }, 'RETIRÉE');
  const c86 = crowd(A.c, { w: 1080, h: 440, n: 13, seed: 86, col: '#3A2C1C', y: 1520, top: 0.5, plac: ['RETRAIT !', 'NON !', 'RETRAIT', 'NON À LA SÉLECTION'], placCol: [COL.light, COL.old], pr: 0.5 });
  svgEl(A.c, 1080, 440, `<path d="${halftone(1080, 440, 16, (x, y) => 0.25 + 0.5 * (y / 440))}" fill="${COL.old}" fill-opacity=".22"/>`, { left: '0px', top: '1520px' });
  const date = typer(A.c, '8 DÉCEMBRE 1986', { left: '0px', top: '1292px', width: '1080px', textAlign: 'center', font: '700 46px/1 MONO', color: COL.ink, letterSpacing: '0.08em' });
  burst(A.parts, R, { t: 16.5, x: 540, y: 1125, rx: 700, ry: 160, n: 150, v0: 400, v1: 2600, k: 7, r0: 1.5, r1: 12, col: COL.red, a: 0.95 });
  burst(A.parts, R, { t: 16.5, x: 540, y: 1125, rx: 800, ry: 200, n: 70, v0: 100, v1: 500, k: 2.5, g: -40, r0: 1, r1: 3, col: COL.light, a: 0.7, life: 1.3 });
  return {
    upd(t) {
      show(A.wrap, t >= 15.0 && t < 17.86); if (!(t >= 15.0 && t < 17.86)) return;
      pasteUpd(A, pa, t, 15.0, 0.3);
      tf(card, -1300 * (1 - E.outExpo(P(t, 15.22, 15.56))), 0, 2);
      h1.set(P(t, 15.5, 15.92), t);
      rule.style.transform = `scaleX(${E.out3(P(t, 15.9, 16.03)).toFixed(3)})`;
      b1.set(P(t, 16.0, 16.42), t);
      setSlam(stamp, t, 16.5, -11 - 9 * (1 - P(t, 16.38, 16.5)), 2.8, 0.1);
      date.set(P(t, 16.85, 17.2), t);
      c86.update(t, 1 + 1.4 * Math.exp(-Math.max(0, t - 16.5) * 2.5) * (t > 16.5 ? 1 : 0));
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S8 · 17,5–20 s · 2006, le CPE voté… puis enterré ═══════════ */
function buildS8() {
  const A = poster('s8', { bg: COL.light, tex: 'paper', z: 9 });
  const B = poster('s8b', { bg: '#1B1511', tex: 'ink', z: 8 });
  const pa = makePaste(90, 81), R = rng(808);
  svgEl(A.c, 1080, 700, `<path d="${halftone(1080, 700, 20, (x, y) => Math.max(0, 0.7 - Math.hypot(x, 700 - y) / 800))}" fill="${COL.ink}" fill-opacity=".85"/>`, { left: '0px', top: '1220px' });
  const cpe = el('div', '', A.c, { left: '0px', top: '380px', width: '1080px', textAlign: 'center', font: '900 410px/1 ANY', color: COL.ink, letterSpacing: '-0.02em', transformOrigin: '50% 60%' }, 'CPE');
  const sub = typer(A.c, 'CONTRAT PREMIÈRE EMBAUCHE', { left: '0px', top: '845px', width: '1080px', textAlign: 'center', font: '700 38px/1 MONO', color: COL.ink, letterSpacing: '0.08em' });
  const vote = el('div', 'worn', A.c, { left: '250px', top: '975px', width: '580px', height: '210px', boxSizing: 'border-box', border: `10px solid ${COL.ink}`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 170px/1 BSS', color: COL.ink, letterSpacing: '0.06em', paddingTop: '8px', transformOrigin: '50% 50%' }, 'VOTÉ');
  const cuts = svgEl(A.c, 1080, 1920, Array.from({ length: 11 }, (_, i) => `<line x1="${(i + 1) * 90}" y1="0" x2="${(i + 1) * 90}" y2="0" stroke="${COL.ink}" stroke-width="3" stroke-opacity=".7"/>`).join(''), { left: '0px', top: '0px' });
  const cl = [...cuts.querySelectorAll('line')];
  burst(A.parts, R, { t: 18.25, x: 540, y: 1080, rx: 520, ry: 150, n: 110, v0: 300, v1: 2000, k: 7, r0: 1.2, r1: 9, col: COL.ink, a: 0.9 });
  // bandes du broyeur (image de l'affiche capturée juste avant la coupe)
  const strips = el('div', 'grp', cam, { zIndex: 9 });
  const SR = rng(818), sdat = [];
  for (let i = 0; i < 12; i++) {
    const s = el('div', '', strips, { left: (i * 90) + 'px', top: '0px', width: '90px', height: '1920px', backgroundImage: 'url(tiles/s8shred.png)', backgroundSize: '1080px 1920px', backgroundPosition: `${-i * 90}px 0px`, boxShadow: '0 0 14px rgba(0,0,0,.45)', transformOrigin: '50% 0%' });
    sdat.push({ s, d: SR() * 0.13 + Math.abs(i - 5.5) * 0.012, r: (SR() - 0.5) * 34, dx: (SR() - 0.5) * 120 });
  }
  // terre : PUIS ENTERRÉ
  svgEl(B.c, 1080, 900, `<path d="${halftone(1080, 900, 18, (x, y) => (y / 900) * 0.8)}" fill="#6B4A2E" fill-opacity=".55"/>`, { left: '0px', top: '1020px' });
  const puis = el('div', '', B.c, { left: '0px', top: '790px', width: '1080px', textAlign: 'center', font: '86px/1 ELITE', color: COL.light, transformOrigin: '50% 50%' }, '… PUIS');
  const ent = el('div', '', B.c, { left: '0px', top: '890px', width: '1080px', textAlign: 'center', font: '900 176px/1 ANY', fontStretch: '86%', color: COL.light, letterSpacing: '-0.02em', transformOrigin: '50% 50%' }, 'ENTERRÉ.');
  burst(B.parts, R, { t: 19.15, x: 540, y: 1100, rx: 900, ry: 80, n: 90, v0: 150, v1: 700, dir: -Math.PI / 2, cone: 2.2, k: 2, g: 1500, r0: 1.5, r1: 5, col: ['#6B4A2E', '#3A281A', COL.paper], a: 0.9, life: 1.2 });
  return {
    upd(t, o) {
      const sh = !o.tile && t >= 18.72;
      show(A.wrap, t >= 17.5 && t < (o.tile ? 20.3 : 18.72));
      show(strips, sh && t < 20.3);
      show(B.wrap, t >= 18.55 && t < 20.31);
      if (t >= 17.5 && t < 18.72) {
        pasteUpd(A, pa, t, 17.5, 0.28);
        const a = t - 17.62;
        op(cpe, a >= -0.01 ? 1 : 0);
        cpe.style.fontStretch = clamp(lerp(50, 108, spring(a, 1.7, 0.42)), 50, 150).toFixed(1) + '%';
        sub.set(P(t, 17.9, 18.2), t);
        setSlam(vote, t, 18.25, -8, 2.6, 0.09);
        cl.forEach((c, i) => c.setAttribute('y2', (1920 * E.in2(P(t, 18.55 + i * 0.01, 18.67 + i * 0.01))).toFixed(0)));
        A.parts.draw(t);
      }
      if (sh && t < 20.3) for (const q of sdat) { const a = Math.max(0, t - (18.72 + q.d)); tf(q.s, q.dx * a, 0.5 * 5600 * a * a + 30 * a, q.r * E.in2(P(a, 0, 0.55))); }
      if (t >= 18.55 && t < 20.31) { setSlam(puis, t, 19.05, 0, 1.5, 0.06); setSlam(ent, t, 19.15, -2, 1.7, 0.07); B.parts.draw(t); B.wr.style.opacity = 0.15; }
    },
  };
}

/* ═══════════ S9 · 20–21,5 s · 2019, grève pour le climat ═══════════ */
function buildS9() {
  const A = poster('s9', { bg: COL.ink, tex: 'paper', z: 10 });
  const pa = makePaste(0, 91);
  const PAL = ['#08306B', '#08519C', '#2171B5', '#4292C6', '#6BAED6', '#9ECAE1', '#C6DBEF', '#DEEBF7', '#FEE0D2', '#FCBBA1', '#FC9272', '#FB6A4A', '#EF3B2C', '#CB181D', '#A50F15', '#67000D'];
  const bars = Array.from({ length: 30 }, (_, i) => { const v = clamp(i / 29 + (hash(i, 77) - 0.5) * 0.28); return el('div', '', A.c, { left: (i * 36) + 'px', top: '0px', width: '37px', height: '1920px', background: PAL[Math.round(v * (PAL.length - 1))] }); });
  const T1 = el('div', '', A.c, { left: '0px', top: '300px', width: '1080px', textAlign: 'center', font: '900 236px/1 ANY', color: COL.light, letterSpacing: '-0.03em', textShadow: `12px 12px 0 ${COL.ink}`, transformOrigin: '50% 50%' }, 'GRÈVE');
  const T2 = el('div', '', A.c, { left: '0px', top: '545px', width: '1080px', textAlign: 'center', font: '900 120px/1 ANY', color: COL.light, textShadow: `8px 8px 0 ${COL.ink}`, transformOrigin: '50% 50%' }, 'POUR LE');
  const T3 = el('div', '', A.c, { left: '0px', top: '665px', width: '1080px', textAlign: 'center', font: '900 236px/1 ANY', color: COL.light, letterSpacing: '-0.03em', textShadow: `12px 12px 0 ${COL.ink}`, transformOrigin: '50% 50%' }, 'CLIMAT');
  const pw = el('div', '', A.c, { left: '160px', top: '1130px', width: '760px', height: '280px', transformOrigin: '380px 1100px' });
  el('div', '', pw, { position: 'absolute', left: '363px', top: '250px', width: '34px', height: '900px', background: 'linear-gradient(90deg,#9C7A45,#D2B27A 45%,#9C7A45)' });
  el('div', '', pw, { position: 'absolute', left: '332px', top: '420px', width: '96px', height: '118px', borderRadius: '34px', background: COL.ink });
  const bd = el('div', '', pw, { position: 'absolute', left: '0px', top: '0px', width: '760px', height: '280px', background: COL.light, border: `7px solid ${COL.ink}`, boxSizing: 'border-box', borderRadius: '8px', boxShadow: '0 24px 40px rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '72px/1 MARK', color: COL.ink, overflow: 'hidden', whiteSpace: 'nowrap' }, 'PAS DE PLANÈTE B');
  el('div', 'tex tex-paper', bd);
  return {
    upd(t) {
      show(A.wrap, t >= 20.0 && t < 21.86); if (!(t >= 20.0 && t < 21.86)) return;
      pasteUpd(A, pa, t, 20.0, 0.26);
      bars.forEach((b, i) => { b.style.transform = `translateY(${(-1920 * (1 - E.out3(P(t, 20.02 + i * 0.011, 20.3 + i * 0.011)))).toFixed(1)}px)`; });
      setSlam(T1, t, 20.35, -2, 1.6, 0.06); setSlam(T2, t, 20.45, -2, 1.6, 0.06); setSlam(T3, t, 20.55, -2, 1.6, 0.06);
      const a = t - 20.5;
      op(pw, a > 0 ? 1 : 0); tf(pw, 0, 1400 * (1 - spring(a, 1.9, 0.5)) + Math.sin(t * 2.6) * 6, 4 + Math.sin(t * 2.6 + 1) * 1.8);
    },
  };
}

/* ═══════════ S10 · 21,5–25,5 s · 40 ans après, la sélection dans le viseur ═══════════ */
function buildS10() {
  const A = poster('s10', { bg: COL.paper, tex: 'paper', z: 11 });
  const pa = makePaste(225, 101), R = rng(1010);
  svgEl(A.c, 1080, 760, `<path d="${halftone(1080, 760, 20, (x, y) => Math.max(0, 0.6 - Math.hypot(x - 1080, 760 - y) / 900))}" fill="${COL.ink}" fill-opacity=".7"/>`, { left: '0px', top: '1160px' });
  const GA = el('div', 'grp', A.c);
  function chip(x, y, rot, bg, tex, txt, col) { const c = el('div', '', GA, { left: x + 'px', top: y + 'px', width: '330px', height: '190px', background: bg, boxShadow: '3px 10px 18px rgba(0,0,0,.25)', transformOrigin: '50% 50%' }); el('div', 'tex tex-' + tex, c); el('div', '', c, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 168px/1 BSS', color: col, paddingTop: '6px', boxSizing: 'border-box' }, txt); return { c, rot }; }
  const ch1 = chip(90, 470, -4, COL.old, 'old', '1986', COL.ink), ch2 = chip(660, 470, 3, COL.light, 'paper', '2026', COL.red);
  const cse = el('div', '', GA, { left: '120px', top: '690px', width: '120px', height: '120px', borderRadius: '22px', background: COL.ink, boxShadow: 'inset 0 0 0 6px #2B2622, 0 8px 16px rgba(0,0,0,.3)' });
  let tk = ''; for (let y = 0; y <= 40; y++) { const x = 8 + y * 15.5, l = y % 10 === 0 ? 34 : y % 5 === 0 ? 22 : 12; tk += `<rect x="${x - 1.5}" y="0" width="3" height="${l}" fill="${COL.light}"/>`; if (y % 10 === 0) tk += `<text x="${x + 6}" y="62" font-family="MONO" font-weight="700" font-size="22" fill="${COL.light}">${y}</text>`; }
  const band = el('div', '', GA, { left: '226px', top: '712px', width: '0px', height: '76px', background: COL.red, overflow: 'hidden', boxShadow: '0 6px 10px rgba(0,0,0,.25)' });
  svgEl(band, 650, 76, tk, { left: '0px', top: '0px' });
  const big = el('div', '', GA, { left: '0px', top: '815px', width: '1080px', textAlign: 'center', font: '900 440px/1 BSS', color: COL.ink, transformOrigin: '50% 50%' }, '0');
  const ans = el('div', '', GA, { left: '0px', top: '1255px', width: '1080px', textAlign: 'center', font: '900 128px/1 ANY', fontStretch: '86%', color: COL.red, letterSpacing: '-0.02em', transformOrigin: '50% 50%' }, 'ANS APRÈS');
  const la = el('div', '', A.c, { left: '0px', top: '712px', width: '1080px', textAlign: 'center', font: '90px/1 ELITE', color: COL.ink, transformOrigin: '50% 50%' }, 'LA');
  const sel = el('div', '', A.c, { left: '0px', top: '815px', width: '1080px', textAlign: 'center', font: '900 182px/1 ANY', fontStretch: '72%', color: COL.ink, letterSpacing: '-0.01em', transformOrigin: '50% 50%' }, 'SÉLECTION');
  const pcs = typer(A.c, '(PARCOURSUP)', { left: '0px', top: '1050px', width: '1080px', textAlign: 'center', font: '700 46px/1 MONO', color: COL.red, letterSpacing: '0.1em' });
  const vis = typer(A.c, 'ENCORE DANS LE VISEUR', { left: '0px', top: '1440px', width: '1080px', textAlign: 'center', font: '68px/1 ELITE', color: COL.ink });
  let tks = ''; for (let a = 0; a < 360; a += 10) { const r0 = a % 90 === 0 ? 352 : 378, r1 = 400, rd = a * Math.PI / 180; tks += `<line x1="${(420 + Math.cos(rd) * r0).toFixed(1)}" y1="${(420 + Math.sin(rd) * r0).toFixed(1)}" x2="${(420 + Math.cos(rd) * r1).toFixed(1)}" y2="${(420 + Math.sin(rd) * r1).toFixed(1)}" stroke-width="${a % 90 === 0 ? 7 : 3}"/>`; }
  const ch = svgEl(A.c, 840, 840, `<g class="cg" stroke="${COL.ink}" fill="none"><circle cx="420" cy="420" r="404" stroke-width="7"/><g class="rot"><circle cx="420" cy="420" r="336" stroke-width="4" stroke-dasharray="20 12"/></g>${tks}</g>`, { left: '120px', top: '492px', transformOrigin: '420px 420px' });
  const cg = ch.querySelector('.cg'), rot = ch.querySelector('.rot');
  const br = svgEl(A.c, 1080, 1920, [[0, 0], [1, 0], [0, 1], [1, 1]].map(([sx, sy]) => `<path class="b" data-sx="${sx}" data-sy="${sy}" d="M0,${sy ? -70 : 70} L0,0 L${sx ? -110 : 110},0" fill="none" stroke="${COL.red}" stroke-width="12" stroke-linecap="square"/>`).join(''), { left: '0px', top: '0px' });
  const bs = [...br.querySelectorAll('.b')];
  burst(A.parts, R, { t: 24.02, x: 540, y: 912, rx: 600, ry: 160, n: 60, v0: 300, v1: 1300, k: 6, r0: 1, r1: 5, col: COL.red, a: 0.8 });
  return {
    upd(t, o) {
      const vis_ = t >= 21.5 && (o.tile ? t <= 25.51 : t < 25.5);
      show(A.wrap, vis_); if (!vis_) return;
      pasteUpd(A, pa, t, 21.5, 0.3);
      for (const [c, t0] of [[ch1, 21.95], [ch2, 22.05]]) { const a = t - t0, s = spring(a, 2.4, 0.5); op(c.c, a > 0 ? 1 : 0); tf(c.c, 0, 0, c.rot + 6 * (1 - s), 1 + 0.35 * (1 - s)); }
      op(cse, P(t, 22.08, 22.14)); tf(cse, 0, 0, 0, E.outBack(P(t, 22.08, 22.2)));
      const pt = E.io3(P(t, 22.15, 22.75));
      band.style.width = (650 * pt).toFixed(1) + 'px';
      big.textContent = String(Math.round(40 * pt));
      op(big, P(t, 22.1, 22.16)); tf(big, 0, 0, 0, 1 + 0.06 * Math.exp(-Math.max(0, t - 22.75) * 10) * (t > 22.75 ? 1 : 0));
      setSlam(ans, t, 22.8, -2, 1.6, 0.06);
      const pe = E.in3(P(t, 23.08, 23.38)); tf(GA, 0, -1600 * pe, -7 * pe);
      setSlam(la, t, 23.35, 0, 1.5, 0.06); setSlam(sel, t, 23.42, 0, 1.6, 0.07);
      const pc = E.out5(P(t, 23.45, 24.0)), wob = 1 - P(t, 23.7, 24.0);
      op(ch, P(t, 23.45, 23.6));
      tf(ch, Math.sin(t * 9) * 26 * wob, Math.cos(t * 7) * 18 * wob, lerp(140, 0, pc), lerp(2.6, 1, pc));
      rot.setAttribute('transform', `rotate(${(t * 40) % 360} 420 420)`);
      const locked = t >= 24.02;
      cg.setAttribute('stroke', locked ? COL.red : COL.ink);
      const off = lerp(110, 0, E.outBack(P(t, 24.0, 24.12), 2.4)), bx0 = 80, bx1 = 1000, by0 = 770, by1 = 1130;
      bs.forEach(b => { const sx = +b.dataset.sx, sy = +b.dataset.sy; const x = (sx ? bx1 + off : bx0 - off), y = (sy ? by1 + off * 0.6 : by0 - off * 0.6); b.setAttribute('transform', `translate(${x} ${y})`); b.setAttribute('stroke-opacity', P(t, 23.9, 24.0).toFixed(2)); });
      pcs.set(P(t, 24.35, 24.62), t); vis.set(P(t, 24.15, 24.68), t);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S11 · 25,5–30 s · le mur, ET TOI ? ═══════════ */
function buildWall() {
  const Wl = el('div', '', cam, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', zIndex: 20 });
  const G = el('div', '', Wl, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', transformOrigin: '540px 960px' });
  const bg = el('div', '', G, { position: 'absolute', left: '-6000px', top: '-8000px', width: '13080px', height: '17920px', background: COL.wall });
  el('div', 'tex tex-ink', bg, { opacity: 0.8 });
  const names = ['s8w', 's1', 's6', 's3', 's4', 's9', 's5', 's2', 's8w', 's2', 's7', 's4', 's9', 's6'];
  const R = rng(2026); let k = 0; const imgs = [];
  for (let r = -1; r <= 1; r++) for (let c = -2; c <= 2; c++) {
    const center = r === 0 && c === 0, n = center ? 's10' : names[k++];
    const d = el('div', '', G, { position: 'absolute', left: (c * 1250 + (center ? 0 : (R() - 0.5) * 120)) + 'px', top: (r * 2110 + (center ? 0 : (R() - 0.5) * 120)) + 'px', width: '1080px', height: '1920px', transform: `rotate(${center ? 0 : ((R() - 0.5) * 7).toFixed(2)}deg)`, boxShadow: '0 40px 90px rgba(0,0,0,.65)' });
    const im = el('img', '', d, { width: '1080px', height: '1920px', display: 'block' }); im.src = 'tiles/' + n + '.png'; imgs.push(im);
    if (!center) { tape(d, 380, -40, 320, 96, (R() - 0.5) * 16); if (R() < 0.6) tape(d, 760, 1840, 320, 96, (R() - 0.5) * 16); }
  }
  const veil = el('div', '', Wl, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', background: '#000', opacity: 0 });
  const cv = el('canvas', '', Wl, { position: 'absolute', left: '0px', top: '0px' }); cv.width = W; cv.height = H;
  const parts = new Parts(cv), PR = rng(3030);
  const et = el('div', '', Wl, { position: 'absolute', left: '70px', top: '540px', font: '300px/1 SPRAY', color: COL.fluo, transformOrigin: '50% 50%' }, 'ET');
  const toi = el('div', '', Wl, { position: 'absolute', left: '28px', top: '800px', font: '340px/1 SPRAY', color: COL.fluo, transformOrigin: '50% 50%', whiteSpace: 'nowrap' }, 'TOI ?');
  const drips = dripsSvg(Wl, [[120, 120, 12, 0], [300, 190, 14, 0.1], [520, 90, 10, 0.18], [700, 160, 13, 0.06], [880, 100, 11, 0.22]], COL.fluo, 1140);
  sprayMist(parts, PR, { t0: 26.95, t1: 27.25, x0: 80, x1: 520, y0: 600, y1: 830, n: 700, col: COL.fluo, spread: 70, yspread: 80 });
  sprayMist(parts, PR, { t0: 27.25, t1: 27.7, x0: 40, x1: 1050, y0: 860, y1: 1140, n: 1300, col: COL.fluo, spread: 70, yspread: 90 });
  const sk = el('div', '', Wl, { position: 'absolute', left: '150px', top: '1370px', width: '780px', height: '150px', borderRadius: '75px', background: COL.light, border: `6px solid ${COL.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 66px/1 ANY', color: COL.ink, letterSpacing: '-0.01em', boxShadow: '0 18px 34px rgba(0,0,0,.5)', transformOrigin: '50% 50%' }, 'T’EN PENSES QUOI ?');
  return {
    imgs,
    upd(t, o) {
      const v = !o.tile && t >= 25.5;
      show(Wl, v); if (!v) return;
      const pp = E.io3(P(t, 25.5, 26.95));
      tf(G, 70 * pp, 0, -3.5 * pp, lerp(1, 0.3, pp) * (1 - 0.05 * P(t, 26.95, 30)));
      op(veil, 0.5 * P(t, 26.55, 27.0));
      sprayReveal(et, P(t, 26.95, 27.25), 96); sprayReveal(toi, P(t, 27.25, 27.7), 96);
      tf(et, 0, 0, -4); tf(toi, 0, 0, -4, 1 + (t > 27.7 ? 0.05 * Math.exp(-(t - 27.7) * 9) : 0));
      drips(t, 27.65);
      const a = t - 28.1, s = spring(a, 2.2, 0.45);
      op(sk, a > 0 ? 1 : 0); tf(sk, 0, 0, lerp(-12, -4, s) + Math.sin(t * 2) * 0.6 * clamp(a), 1 + 0.4 * (1 - s));
      parts.draw(t);
    },
  };
}

/* ═══════════ odomètre des années (fil rouge 11,5–25,5 s) ═══════════ */
function buildOdo() {
  const box = el('div', '', cam, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '300px', zIndex: 30, transformOrigin: '540px 0px' });
  el('div', '', box, { position: 'absolute', left: '159px', top: '0px', width: '762px', height: '290px', background: '#1A1714', borderRadius: '22px', boxShadow: '0 18px 36px rgba(0,0,0,.45), inset 0 0 0 4px rgba(238,231,215,.12)' });
  for (const [x, y] of [[178, 14], [890, 14], [178, 264], [890, 264]]) el('div', '', box, { position: 'absolute', left: x + 'px', top: y + 'px', width: '12px', height: '12px', borderRadius: '6px', background: '#5A524A' });
  const od = odometer(box, '####', { w: 170, h: 250, gap: 14, space: 0, fs: 262, cell: '#0E0D0C', col: COL.paper, rad: 12 });
  Object.assign(od.box.style, { left: '179px', top: '20px' });
  const STEPS = [[12.3, 12.95, 1968, E.io3], [15.05, 15.45, 1986, E.out3], [17.55, 17.95, 2006, E.out3], [20.05, 20.4, 2019, E.out3], [21.55, 22.0, 2026, E.out3]];
  const val = t => { let v = 2026, prev = 2026; for (const [a, b, to, e] of STEPS) { if (t < a) break; v = lerp(prev, to, e(P(t, a, b))); prev = to; } return v; };
  return {
    upd(t, o) {
      const v = t >= 11.45 && t < 25.5 && !(o.noOdo) || (o.tile && t >= 11.45 && t <= 25.51 && !o.noOdo);
      show(box, v); if (!v) return;
      od.set(val(t));
      const a = t - 11.45, s = spring(a, 2.0, 0.5), pm = E.io3(P(t, 12.95, 13.3));
      const y = lerp(lerp(-420, 430, s), 96, pm), sc = lerp(1, 0.6, pm);
      const kick = STEPS.reduce((k, [a0]) => k + (t > a0 && t < a0 + 0.4 ? 0.04 * Math.sin(Math.PI * (t - a0) / 0.4) : 0), 0);
      tf(box, 0, y, 0, sc * (1 + kick));
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
  const f = 1 - P(t, 25.0, 25.5);
  x += 6 * Math.sin(t * 0.9) * f; y += 5 * Math.sin(t * 0.63 + 1) * f; r += 0.25 * Math.sin(t * 0.5) * f;
  return { x, y, s, r };
}
function flashAt(t) { for (const c of CUES) if (c.fl) { const a = t - c.t; if (a >= 0 && a < 0.1) return [c.fl[0], c.fl[1] * (1 - a / 0.1)]; } return null; }

let READY = false;
async function main() {
  await document.fonts.load('900 100px BSS'); await document.fonts.load('900 100px ANY'); await document.fonts.load('100px ELITE');
  await document.fonts.load('100px MARK'); await document.fonts.load('100px SPRAY'); await document.fonts.load('700 100px MONO');
  await document.fonts.ready;
  SCENES.push(buildS1(), buildS2(), buildS3(), buildS4pair(), buildS5(), buildS6(), buildS7(), buildS8(), buildS9(), buildS10());
  const wall = buildWall(); SCENES.push(wall); SCENES.push(buildOdo());
  if (!TILE_MODE) await Promise.all(wall.imgs.map(im => im.decode().catch(() => {})));
  window.renderAt = (t, o = {}) => {
    const c = o.tile ? { x: 0, y: 0, s: 1, r: 0 } : camAt(t);
    cam.style.transform = `translate(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px) rotate(${c.r.toFixed(3)}deg) scale(${c.s.toFixed(4)})`;
    const f = o.tile ? null : flashAt(t);
    flashEl.style.background = f ? f[0] : 'transparent'; flashEl.style.opacity = f ? f[1].toFixed(3) : 0;
    show(vign, !o.tile);
    for (const s of SCENES) s.upd(t, o);
  };
  window.__dur = DUR; window.__fps = FPS;
  // version voix : le temps vidéo est déformé pour caler l'animation sur la prise (warp.js, généré par voice.py)
  if (window.WARP && !TILE_MODE) {
    const Wp = window.WARP, base = window.renderAt;
    const warp = u => { if (u <= Wp[0][0]) return Wp[0][1]; for (let i = 1; i < Wp.length; i++) if (u <= Wp[i][0]) { const [a0, b0] = Wp[i - 1], [a1, b1] = Wp[i]; return b0 + (b1 - b0) * (u - a0) / (a1 - a0); } return Wp[Wp.length - 1][1]; };
    window.renderAt = (u, o = {}) => base(o.tile ? u : warp(u), o);
    window.__dur = window.VDUR;
  }
  window.renderAt(0);
  window.__ready = true;
}
main();
