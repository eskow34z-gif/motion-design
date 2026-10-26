/* RESEAUX01 — « Ton compte devait être fermé » : 7 affiches collées les unes sur les autres, puis le mur.
   Standard AFFICHE, intensité dosée. Outils repris de MANIF01 (core.js). Zone de sûreté TikTok/Reels :
   textes clés entre y = 160 et y = 1330, sous-titres en bande collée à y ≈ 1370, rien d'important à droite de x = 940 sous y = 900. */
'use strict';
const Q = new URLSearchParams(location.search);
const TILE_MODE = Q.has('tile');
const stage = document.getElementById('stage'), cam = document.getElementById('cam'), flashEl = document.getElementById('flash'), vign = document.getElementById('vign');
const SCENES = [];

/* ——— outils repris de MANIF01 ——— */
function poster(id, o) {
  const wrap = el('div', '', o.parent || cam, { position: 'absolute', left: '0px', top: '0px', width: W + 'px', height: H + 'px', zIndex: o.z, transformOrigin: '540px 960px' });
  const p = el('div', 'poster', wrap, { background: o.bg });
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
  // l'affiche se pose et respire (1,03 → 1)
  tf(A.wrap, 0, 0, 0, 1 + 0.03 * (1 - E.out3(P(t, t0 + d * 0.6, t0 + d + 0.9))));
}
/* slam dosé : départ à 1,35 */
function slamS(t, t0, from = 1.35, d = 0.07) {
  if (t < t0 - d) return null;
  if (t < t0) return lerp(from, 1, E.in3(P(t, t0 - d, t0)));
  return 1 - 0.035 * Math.exp(-(t - t0) * 14) * Math.cos((t - t0) * 40);
}
function setSlam(e, t, t0, rot = 0, from = 1.35, d = 0.07, x = 0, y = 0) {
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
/* bande de papier déchirée avec texte, posée au ressort */
function strip(parent, o) {
  const g = el('div', '', parent, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', transformOrigin: '50% 50%' });
  svgEl(g, o.w, o.h, `<path d="${tornRect(o.w, o.h, 12, 22, o.seed || 3)}" fill="${o.bg}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.22))' });
  const tx = el('div', '', g, { position: 'absolute', left: '0px', top: '0px', width: o.w + 'px', height: o.h + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: o.font, color: o.col, whiteSpace: 'nowrap', textAlign: 'center' }, o.html);
  const tp = o.tape === false ? [] : [tape(g, -36, -14, 120, 40, -12), tape(g, o.w - 84, o.h - 26, 120, 40, -8)];
  return { g, tx, tp, o };
}
function stripUpd(s, t, t0, fromY = -50) {
  const a = t - t0, sp = spring(a, 2.6, 0.5);
  op(s.g, a > 0 ? 1 : 0); tf(s.g, 0, fromY * (1 - sp), lerp((s.o.rot || 0) - 7, s.o.rot || 0, sp), 1 + 0.22 * (1 - sp));
  s.tp.forEach((e, i) => { const b = a - 0.12 - i * 0.05; op(e, b > 0 ? 1 : 0); e.style.transform = `rotate(${i ? -8 : -12}deg) scale(${(1 + 0.35 * (1 - E.out3(P(b, 0, 0.12)))).toFixed(3)})`; });
}
/* tampon encreur usé (texte dans un double cadre) */
function stampBox(parent, o) {
  const s = el('div', 'worn', parent, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', boxSizing: 'border-box', border: `${o.b || 10}px solid ${o.col}`, borderRadius: '14px', transformOrigin: '50% 50%' });
  el('div', '', s, { position: 'absolute', left: '8px', top: '8px', right: '8px', bottom: '8px', border: `4px solid ${o.col}`, borderRadius: '8px' });
  el('div', '', s, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: o.font, color: o.col, letterSpacing: '0.05em', paddingTop: '6px', boxSizing: 'border-box', whiteSpace: 'nowrap' }, o.txt);
  return s;
}
/* tête + épaules en silhouette */
const HEAD = (cx, cy, s, col) => `<circle cx="${cx}" cy="${cy}" r="${30 * s}" fill="${col}"/><path d="M${cx - 62 * s},${cy + 118 * s} L${cx - 62 * s},${cy + 78 * s} Q${cx - 62 * s},${cy + 38 * s} ${cx - 24 * s},${cy + 36 * s} L${cx + 24 * s},${cy + 36 * s} Q${cx + 62 * s},${cy + 38 * s} ${cx + 62 * s},${cy + 78 * s} L${cx + 62 * s},${cy + 118 * s}Z" fill="${col}"/>`;
/* icônes d'applis génériques (aucune marque) dans une boîte de 180 */
const GLYPH = {
  heart: c => `<path d="M90 142 C30 100 26 52 58 46 C76 42 88 56 90 66 C92 56 104 42 122 46 C154 52 150 100 90 142Z" fill="${c}"/>`,
  play: c => `<path d="M72 52 L132 90 L72 128Z" fill="${c}"/>`,
  cam: c => `<rect x="38" y="62" width="104" height="72" rx="16" fill="none" stroke="${c}" stroke-width="12"/><circle cx="90" cy="98" r="20" fill="none" stroke="${c}" stroke-width="12"/><rect x="66" y="46" width="40" height="18" rx="5" fill="${c}"/>`,
  chat: c => `<path d="M44 48 H136 Q148 48 148 60 V108 Q148 120 136 120 H92 L64 144 V120 H44 Q32 120 32 108 V60 Q32 48 44 48Z" fill="${c}"/>`,
};

/* ═══════════ S1 · 0–3,5 s · « Ton compte devait être fermé le 1er janvier. Spoiler : non. » ═══════════ */
function buildS1() {
  const A = poster('s1', { bg: COL.paper, tex: 'paper', z: 1 });
  const pa = makePaste(-24, 12), R = rng(111);
  svgEl(A.c, 1080, 900, `<path d="${halftone(1080, 900, 20, (x, y) => Math.max(0, 0.9 - Math.hypot(1080 - x, y) / 760))}" fill="${COL.ink}" fill-opacity=".9"/>`, { left: '0px', top: '0px' });
  svgEl(A.c, 1080, 760, `<path d="${halftone(1080, 760, 22, (x, y) => Math.max(0, 0.55 - Math.hypot(x, 760 - y) / 900))}" fill="${COL.ink}" fill-opacity=".45"/>`, { left: '0px', top: '1160px' });
  // téléphone générique : profil inventé
  const ph = el('div', '', A.c, { left: '90px', top: '300px', width: '520px', height: '980px', transformOrigin: '50% 50%' });
  el('div', '', ph, { position: 'absolute', left: '0px', top: '0px', width: '520px', height: '980px', borderRadius: '64px', background: COL.ink, boxShadow: '10px 26px 40px rgba(0,0,0,.35)' });
  const scr = el('div', '', ph, { position: 'absolute', left: '22px', top: '22px', width: '476px', height: '936px', borderRadius: '46px', background: COL.light, overflow: 'hidden' });
  el('div', 'tex tex-paper', scr);
  el('div', '', scr, { position: 'absolute', left: '188px', top: '18px', width: '100px', height: '26px', borderRadius: '13px', background: COL.ink });
  svgEl(scr, 476, 936, `<circle cx="96" cy="150" r="58" fill="none" stroke="${COL.ink}" stroke-width="6"/><path d="${halftone(116, 116, 9, (x, y) => Math.max(0, 1 - Math.hypot(x - 58, y - 58) / 58))}" transform="translate(38 92)" fill="${COL.ink}"/>`
    + [0, 1, 2].map(k => `<rect x="${186 + k * 98}" y="122" width="72" height="22" rx="4" fill="${COL.ink}"/><rect x="${186 + k * 98}" y="156" width="72" height="12" rx="3" fill="${COL.ink}" fill-opacity=".35"/>`).join('')
    + `<rect x="38" y="236" width="400" height="56" rx="12" fill="${COL.ink}"/>`
    + Array.from({ length: 9 }, (_, i) => { const x = 38 + (i % 3) * 136, y = 318 + Math.floor(i / 3) * 136; return `<rect x="${x}" y="${y}" width="128" height="128" fill="${COL.ink}" fill-opacity="${(0.12 + 0.1 * (i % 4)).toFixed(2)}"/><path d="${halftone(128, 128, 12, (a, b) => 0.25 + 0.6 * hash(i, Math.round(a / 20) + Math.round(b / 20) * 7))}" transform="translate(${x} ${y})" fill="${COL.ink}" fill-opacity=".55"/>`; }).join(''), { left: '0px', top: '0px' });
  el('div', '', scr, { position: 'absolute', left: '0px', top: '242px', width: '476px', textAlign: 'center', font: '700 32px/44px MONO', color: COL.light, letterSpacing: '0.06em' }, '@TOI');
  // tampon COMPTE FERMÉ sur l'écran
  const st = stampBox(A.c, { x: 70, y: 620, w: 590, h: 270, col: COL.red, b: 11, font: '900 96px/0.9 BSS', txt: '<div style="text-align:center;line-height:.9">COMPTE<br>FERMÉ</div>' });
  // page de calendrier
  const cal = el('div', '', A.c, { left: '660px', top: '200px', width: '330px', height: '380px', transformOrigin: '50% 0%' });
  const cp = el('div', '', cal, { position: 'absolute', left: '0px', top: '0px', width: '330px', height: '380px', background: COL.light, borderRadius: '4px', boxShadow: '6px 12px 22px rgba(0,0,0,.3)', overflow: 'hidden' });
  el('div', '', cp, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '86px', background: COL.red, font: '700 40px/86px MONO', color: COL.light, textAlign: 'center', letterSpacing: '0.1em' }, 'JANVIER');
  el('div', '', cp, { position: 'absolute', left: '0px', top: '92px', width: '100%', textAlign: 'center', font: '900 240px/1 BSS', color: COL.ink }, '1<span style="font-size:110px;vertical-align:top;position:relative;top:22px">ER</span>');
  el('div', 'tex tex-paper', cp);
  svgEl(cal, 330, 40, Array.from({ length: 7 }, (_, i) => `<rect x="${18 + i * 44}" y="0" width="12" height="36" rx="6" fill="${COL.ink}"/>`).join(''), { left: '0px', top: '-16px' });
  const spo = typer(A.c, 'SPOILER :', { left: '640px', top: '690px', font: '70px/1 ELITE', color: COL.ink });
  const non = el('div', '', A.c, { left: '560px', top: '780px', font: '250px/1 SPRAY', color: COL.red, transformOrigin: '50% 50%', letterSpacing: '-0.04em' }, 'NON');
  const drips = dripsSvg(A.c, [[600, 140, 14, 0], [700, 80, 10, 0.12], [800, 190, 15, 0.05], [905, 100, 11, 0.2]], COL.red, 1085);
  sprayMist(A.parts, R, { t0: 2.72, t1: 3.08, x0: 560, x1: 1030, y0: 820, y1: 1080, n: 900, col: COL.red, spread: 60, yspread: 80 });
  burst(A.parts, R, { t: 1.0, x: 365, y: 755, rx: 560, ry: 200, n: 40, v0: 60, v1: 340, k: 8, r0: 1, r1: 4, col: COL.red, a: 0.75 });
  return {
    upd(t) {
      show(A.wrap, t < 3.86); if (t >= 3.86) return;
      pasteUpd(A, pa, t, -0.12, 0.38);
      const a = t - 0.18, sp = spring(a, 2.0, 0.5);
      op(ph, a > 0 ? 1 : 0); tf(ph, -700 * (1 - E.outExpo(P(t, 0.18, 0.5))), 0, lerp(-9, -3, sp));
      // tampon
      const ps = P(t, 0.92, 1.0);
      op(st, ps > 0 ? 1 : 0); tf(st, 0, 0, lerp(-20, -11, ps), t < 1.0 ? lerp(1.35, 1, E.in2(ps)) : 1 - 0.04 * Math.exp(-(t - 1.0) * 16));
      // calendrier
      tf(cal, 0, -620 * (1 - spring(t - 1.62, 2.1, 0.5)), 5);
      // spoiler : non
      spo.set(P(t, 2.38, 2.68), t);
      sprayReveal(non, P(t, 2.72, 3.08), 96);
      const ah = t - 3.1; tf(non, 0, 0, -6, 1 + (ah > 0 ? 0.06 * Math.exp(-ah * 11) : 0));
      drips(t, 3.1);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S2 · 3,5–7 s · « Cet été, la France vote l'interdiction des réseaux avant 15 ans. » ═══════════ */
function buildS2() {
  const A = poster('s2', { bg: COL.ink, tex: 'ink', z: 2 });
  const pa = makePaste(90, 22), R = rng(222);
  svgEl(A.c, 1080, 700, `<path d="${halftone(1080, 700, 22, (x, y) => (y / 700) * 0.5)}" fill="${COL.paper}" fill-opacity=".12"/>`, { left: '0px', top: '1220px' });
  const ete = typer(A.c, 'CET ÉTÉ,', { left: '0px', top: '200px', width: '1080px', textAlign: 'center', font: '78px/1 ELITE', color: COL.light });
  const date = typer(A.c, '21 JUILLET 2026', { left: '0px', top: '296px', width: '1080px', textAlign: 'center', font: '700 36px/1 MONO', color: COL.red, letterSpacing: '0.12em' });
  const vote = el('div', '', A.c, { left: '0px', top: '360px', width: '1080px', textAlign: 'center', font: '900 128px/1 ANY', color: COL.light, letterSpacing: '-0.02em', transformOrigin: '50% 50%' }, 'LA FRANCE VOTE');
  const ic = [];
  ['heart', 'play', 'cam', 'chat'].forEach((g, i) => {
    const b = el('div', '', A.c, { left: (96 + i * 228) + 'px', top: '560px', width: '180px', height: '180px', transformOrigin: '50% 50%' });
    el('div', '', b, { position: 'absolute', left: '0px', top: '0px', width: '180px', height: '180px', borderRadius: '44px', background: i % 2 ? COL.light : COL.paper, boxShadow: '0 14px 22px rgba(0,0,0,.45)' });
    svgEl(b, 180, 180, GLYPH[g](COL.ink), { left: '0px', top: '0px' });
    const sl = svgEl(b, 180, 180, `<circle cx="90" cy="90" r="96" fill="none" stroke="${COL.red}" stroke-width="18"/><line x1="22" y1="158" x2="158" y2="22" stroke="${COL.red}" stroke-width="18" stroke-linecap="round"/>`, { left: '0px', top: '0px' });
    ic.push({ b, sl });
  });
  const av = typer(A.c, 'AVANT', { left: '0px', top: '830px', width: '1080px', textAlign: 'center', font: '86px/1 ELITE', color: COL.light });
  const q15 = el('div', '', A.c, { left: '0px', top: '900px', width: '1080px', textAlign: 'center', font: '900 380px/1 BSS', color: COL.red, transformOrigin: '50% 55%' }, '15 ANS');
  burst(A.parts, R, { t: 5.9, x: 540, y: 1090, rx: 760, ry: 220, n: 60, v0: 200, v1: 1000, k: 6, r0: 1, r1: 5, col: COL.red, a: 0.8 });
  return {
    upd(t) {
      show(A.wrap, t >= 3.5 && t < 7.36); if (!(t >= 3.5 && t < 7.36)) return;
      pasteUpd(A, pa, t, 3.5, 0.3);
      ete.set(P(t, 3.7, 3.98), t); date.set(P(t, 3.92, 4.15), t);
      op(vote, P(t, 4.19, 4.2)); vote.style.fontStretch = lerp(150, 92, E.outExpo(P(t, 4.2, 4.5))).toFixed(1) + '%';
      ic.forEach(({ b, sl }, i) => {
        const a = t - (4.55 + i * 0.07), s = spring(a, 2.8, 0.5);
        op(b, a > 0 ? 1 : 0); tf(b, 0, 60 * (1 - s), (i % 2 ? 4 : -4) * (1 - s), 0.6 + 0.4 * s);
        const c = t - (5.05 + i * 0.09);
        op(sl, c > 0 ? 1 : 0); tf(sl, 0, 0, 0, c > 0 ? 1 + 0.25 * Math.exp(-c * 14) : 1);
        b.style.filter = c > 0 ? 'saturate(.6) brightness(.82)' : 'none';
      });
      av.set(P(t, 5.5, 5.72), t);
      setSlam(q15, t, 5.9, -2);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S3 · 7–11 s · « … tout le monde aurait dû prouver son âge. Même toi. » ═══════════ */
function buildS3() {
  const A = poster('s3', { bg: COL.paper, tex: 'paper', z: 3 });
  const pa = makePaste(200, 33), R = rng(333);
  const t1 = el('div', '', A.c, { left: '0px', top: '170px', width: '1080px', textAlign: 'center', font: '900 132px/1 ANY', fontStretch: '78%', color: COL.ink, letterSpacing: '-0.02em', transformOrigin: '50% 50%' }, 'TOUT LE MONDE');
  // grille de têtes
  const cols = 5, rows = 4, cw = 188, chh = 168, gx = 70, gy = 340;
  const heads = [];
  let body = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cx = gx + cw / 2 + c * cw, cy = gy + 42 + r * chh, center = r === 1 && c === 2;
    body += `<g class="hd" data-i="${heads.length}">${HEAD(cx, cy, 0.95, center ? COL.ink : '#3B3530')}</g>`;
    heads.push({ cx, cy, center, age: center ? '?' : String(13 + Math.floor(hash(r, c + 9) * 40)) });
  }
  const gs = svgEl(A.c, 1080, 1100, body, { left: '0px', top: '0px' });
  const hg = [...gs.querySelectorAll('.hd')];
  const tags = heads.map(h => el('div', '', A.c, { left: (h.cx + 22) + 'px', top: (h.cy - 44) + 'px', width: '74px', height: '34px', background: COL.light, border: `3px solid ${COL.ink}`, boxSizing: 'border-box', font: '700 20px/28px MONO', color: COL.ink, textAlign: 'center' }, h.age + '✓'));
  const scan = el('div', '', A.c, { left: '40px', top: '0px', width: '1000px', height: '10px', background: COL.red, boxShadow: `0 0 0 3px rgba(232,41,28,.25), 0 -40px 50px rgba(232,41,28,.18)` });
  const pr = typer(A.c, 'AURAIT DÛ PROUVER SON ÂGE', { left: '0px', top: '1036px', width: '1080px', textAlign: 'center', font: '62px/1 ELITE', color: COL.ink });
  const me = el('div', '', A.c, { left: '0px', top: '1140px', width: '1080px', textAlign: 'center', font: '900 168px/1 ANY', fontStretch: '88%', color: COL.red, letterSpacing: '-0.03em', transformOrigin: '50% 50%' }, 'MÊME TOI.');
  const C = heads.find(h => h.center);
  const br = svgEl(A.c, 1080, 1100, [[0, 0], [1, 0], [0, 1], [1, 1]].map(([sx, sy]) => `<path class="b" data-sx="${sx}" data-sy="${sy}" d="M0,${sy ? -46 : 46} L0,0 L${sx ? -60 : 60},0" fill="none" stroke="${COL.red}" stroke-width="11" stroke-linecap="square"/>`).join(''), { left: '0px', top: '0px' });
  const bs = [...br.querySelectorAll('.b')];
  return {
    upd(t) {
      show(A.wrap, t >= 7.0 && t < 11.36); if (!(t >= 7.0 && t < 11.36)) return;
      pasteUpd(A, pa, t, 7.0, 0.3);
      setSlam(t1, t, 7.85, -1.5);
      const sy = lerp(gy - 10, gy + rows * chh + 10, E.io2(P(t, 7.95, 9.4)));
      show(scan, t > 7.93 && t < 9.5); scan.style.transform = `translateY(${sy.toFixed(1)}px)`;
      hg.forEach((g, i) => {
        const h = heads[i], a = t - (7.2 + (i % cols) * 0.035 + Math.floor(i / cols) * 0.05);
        const s = E.outBack(P(a, 0, 0.25));
        const dim = h.center ? 1 : 1 - 0.7 * E.out3(P(t, 9.95, 10.2));
        g.setAttribute('transform', `translate(${h.cx} ${h.cy + 40}) scale(${s.toFixed(3)}) translate(${-h.cx} ${-h.cy - 40})`);
        g.setAttribute('opacity', dim.toFixed(2));
        const scanned = sy > h.cy + 60 && t > 7.9;
        const tg = tags[i];
        op(tg, scanned && !h.center ? dim : 0);
        if (h.center) { op(tg, 0); }
        else tf(tg, 0, 0, (hash(i, 3) - 0.5) * 8, scanned ? 1 + 0.2 * Math.exp(-(t - 7.9) * 4) * 0 : 1);
      });
      pr.set(P(t, 8.7, 9.25), t);
      setSlam(me, t, 10.2, -2);
      // viseur sur la tête du centre
      const off = lerp(70, 0, E.outBack(P(t, 9.95, 10.1), 2.2));
      const x0 = C.cx - 95, x1 = C.cx + 95, y0 = C.cy - 50, y1 = C.cy + 150;
      bs.forEach(b => { const sx = +b.dataset.sx, sy2 = +b.dataset.sy; b.setAttribute('transform', `translate(${sx ? x1 + off : x0 - off} ${sy2 ? y1 + off : y0 - off})`); b.setAttribute('stroke-opacity', P(t, 9.95, 10.0).toFixed(2)); });
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S4 · 11–15 s · « Mais le 14 août, le Conseil constitutionnel censure la loi. » ═══════════ */
function buildS4() {
  const A = poster('s4', { bg: COL.old, tex: 'old', z: 5 });
  const pa = makePaste(-90, 44), R = rng(444);
  svgEl(A.c, 90, 1920, `<path d="${tornRect(90, 1960, 26, 30, 9)}" fill="${COL.red}"/>`, { left: '-40px', top: '-20px' });
  svgEl(A.c, 1080, 700, `<path d="${halftone(1080, 700, 22, (x, y) => Math.max(0, 0.5 - Math.hypot(1080 - x, 700 - y) / 900))}" fill="${COL.ink}" fill-opacity=".35"/>`, { left: '0px', top: '1220px' });
  const card = el('div', '', A.c, { left: '100px', top: '210px', width: '880px', height: '470px', background: COL.light, boxShadow: '4px 16px 28px rgba(60,30,0,.3)', transformOrigin: '50% 50%' });
  el('div', 'tex tex-paper', card);
  const h1 = typer(card, 'LOI DU 21 JUILLET 2026', { position: 'absolute', left: '50px', top: '50px', font: '56px/1 ELITE', color: COL.ink });
  const rule = el('div', '', card, { position: 'absolute', left: '50px', top: '126px', width: '780px', height: '4px', background: COL.ink, transformOrigin: '0 50%' });
  const b1 = typer(card, 'Article 1 : réseaux sociaux\ninterdits aux moins\nde 15 ans', { position: 'absolute', left: '50px', top: '170px', font: '62px/1.2 ELITE', color: COL.ink });
  tape(card, 40, -22, 170, 50, -8); tape(card, 690, -18, 170, 50, 9);
  const stamp = stampBox(A.c, { x: 140, y: 560, w: 800, h: 240, col: COL.red, b: 12, font: '900 190px/1 BSS', txt: 'CENSURÉ' });
  const who = typer(A.c, '14 AOÛT 2026\nCONSEIL CONSTITUTIONNEL', { left: '0px', top: '850px', width: '1080px', textAlign: 'center', font: '700 40px/1.35 MONO', color: COL.ink, letterSpacing: '0.06em' });
  const s1 = strip(A.c, { x: 150, y: 990, w: 780, h: 130, bg: COL.light, font: '78px/1 MARK', col: COL.ink, html: 'TROP LARGE', rot: -3, seed: 7 });
  const s2 = strip(A.c, { x: 70, y: 1140, w: 940, h: 140, bg: COL.red, font: '60px/1 MARK', col: COL.light, html: 'VIE PRIVÉE SANS GARANTIES', rot: 2, seed: 8 });
  const src = el('div', '', A.c, { left: '0px', top: '1300px', width: '1080px', textAlign: 'center', font: '700 26px/1 MONO', color: COL.ink, letterSpacing: '0.08em', opacity: 0 }, 'DÉCISION N° 2026-911 DC');
  burst(A.parts, R, { t: 12.6, x: 540, y: 680, rx: 700, ry: 160, n: 110, v0: 300, v1: 1800, k: 7, r0: 1.4, r1: 9, col: COL.red, a: 0.9 });
  return {
    A,
    upd(t) {
      show(A.wrap, t >= 11.0 && t < 15.5); if (!(t >= 11.0 && t < 15.5)) return;
      pasteUpd(A, pa, t, 11.0, 0.3);
      tf(card, -1300 * (1 - E.outExpo(P(t, 11.2, 11.52))), 0, 1.5);
      h1.set(P(t, 11.45, 11.8), t);
      rule.style.transform = `scaleX(${E.out3(P(t, 11.8, 11.92)).toFixed(3)})`;
      b1.set(P(t, 11.9, 12.4), t);
      setSlam(stamp, t, 12.6, -10 - 6 * (1 - P(t, 12.5, 12.6)), 1.35, 0.09);
      who.set(P(t, 12.9, 13.35), t);
      stripUpd(s1, t, 13.6); stripUpd(s2, t, 14.2);
      op(src, P(t, 14.4, 14.55));
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S5 · 15–17 s · « Sauf que le gouvernement a déjà un nouveau texte. » (l'affiche CENSURÉ est arrachée) ═══════════ */
const TEAR = (() => { const R = rng(5150), pts = []; for (let i = 0; i <= 52; i++) { const u = i / 52; pts.push([lerp(760, 300, u) + (R() - 0.5) * 50 + Math.sin(u * 17) * 14, lerp(-60, 1980, u)]); } return pts; })();
const tearStr = TEAR.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',');
const CLIP_L = `polygon(-120px -120px,${tearStr},-120px 2040px)`;
function buildS5() {
  const A = poster('s5', { bg: COL.red, tex: 'paper', z: 4 });
  svgEl(A.c, 1080, 900, `<path d="${halftone(1080, 900, 22, (x, y) => Math.max(0, 0.8 - Math.hypot(x, y) / 950))}" fill="${COL.ink}" fill-opacity=".7"/>`, { left: '0px', top: '0px' });
  const sq = typer(A.c, 'SAUF QUE…', { left: '0px', top: '260px', width: '1080px', textAlign: 'center', font: '80px/1 ELITE', color: COL.light });
  const nv = el('div', '', A.c, { left: '0px', top: '380px', width: '1080px', textAlign: 'center', font: '900 200px/0.9 ANY', color: COL.light, letterSpacing: '-0.03em', textShadow: `10px 10px 0 ${COL.ink}` }, 'NOUVEAU');
  const tx = el('div', '', A.c, { left: '0px', top: '590px', width: '1080px', textAlign: 'center', font: '900 230px/0.9 ANY', color: COL.light, letterSpacing: '-0.03em', textShadow: `10px 10px 0 ${COL.ink}` }, 'TEXTE');
  const pj = strip(A.c, { x: 170, y: 850, w: 740, h: 100, bg: COL.light, font: '700 38px/1 MONO', col: COL.ink, html: 'PROJET ENVOYÉ À L’UE · 14.09.2026', rot: -2, seed: 12 });
  const badge = el('div', '', A.c, { left: '250px', top: '1000px', width: '580px', height: '210px', borderRadius: '105px', background: COL.ink, border: `6px solid ${COL.light}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 74px/0.95 ANY', fontStretch: '84%', color: COL.light, textAlign: 'center', boxShadow: '0 18px 30px rgba(0,0,0,.4)', transformOrigin: '50% 50%' }, 'PAS ENCORE<br>VOTÉ');
  return {
    A,
    upd(t) {
      show(A.wrap, t >= 14.9 && t < 17.36); if (!(t >= 14.9 && t < 17.36)) return;
      A.wr.style.opacity = 0.25;
      sq.set(P(t, 15.25, 15.5), t);
      for (const [e, t0] of [[nv, 15.7], [tx, 15.8]]) { const p = P(t, t0, t0 + 0.3); op(e, P(t, t0 - 0.01, t0)); e.style.fontStretch = lerp(130, 80, E.outExpo(p)).toFixed(1) + '%'; }
      stripUpd(pj, t, 16.15);
      const a = t - 16.45, s = spring(a, 2.2, 0.45);
      op(badge, a > 0 ? 1 : 0); tf(badge, 0, 0, lerp(-14, 5, s), 1 + 0.35 * (1 - s));
    },
  };
}
/* arrachage de l'affiche CENSURÉ (moitié gauche reste, moitié droite part) */
function buildRip(s4) {
  return {
    upd(t) {
      if (t < 14.98 || t >= 15.5) { s4.A.p.style.filter = 'none'; return; }
      const p = E.in2(P(t, 15.0, 15.45));
      s4.A.p.style.clipPath = CLIP_L;
      s4.A.wrap.style.transformOrigin = '0px 1920px';
      s4.A.wrap.style.transform = `translate(${(-1100 * p).toFixed(1)}px,${(380 * p).toFixed(1)}px) rotate(${(-18 * p).toFixed(2)}deg)`;
      s4.A.p.style.filter = 'drop-shadow(0 28px 40px rgba(0,0,0,.5))';
    },
  };
}

/* ═══════════ S6 · 17–21 s · « Avant 15 ans : interdit sur les plus addictifs. Dès 13 ans : avec l'accord des parents. » ═══════════ */
function buildS6() {
  const A = poster('s6', { bg: COL.paper, tex: 'paper', z: 6 });
  const pa = makePaste(0, 66), R = rng(666);
  svgEl(A.c, 1080, 700, `<path d="${halftone(1080, 700, 20, (x, y) => Math.max(0, 0.6 - Math.hypot(x, 700 - y) / 900))}" fill="${COL.ink}" fill-opacity=".6"/>`, { left: '0px', top: '1220px' });
  // compteur d'âge (fil rouge mécanique)
  const lab = el('div', '', A.c, { left: '90px', top: '270px', width: '420px', font: '84px/1 ELITE', color: COL.ink });
  const box = el('div', '', A.c, { left: '420px', top: '150px', width: '580px', height: '330px' });
  el('div', '', box, { position: 'absolute', left: '0px', top: '0px', width: '580px', height: '330px', background: '#1A1714', borderRadius: '22px', boxShadow: '0 18px 36px rgba(0,0,0,.4), inset 0 0 0 4px rgba(238,231,215,.12)' });
  const od = odometer(box, '##', { w: 190, h: 270, gap: 14, space: 0, fs: 280, cell: '#0E0D0C', col: COL.paper, rad: 12 });
  Object.assign(od.box.style, { left: '22px', top: '30px' });
  el('div', '', box, { position: 'absolute', left: '450px', top: '206px', font: '900 84px/1 BSS', color: COL.red }, 'ANS');
  // ce qui est visé : fonctions addictives
  const feats = ['SCROLL INFINI', 'AUTOPLAY', 'LIVES'].map((s, i) => strip(A.c, { x: 110 + (i % 2) * 70, y: 560 + i * 132, w: 760, h: 112, bg: COL.light, font: '68px/1 MARK', col: COL.ink, html: s, rot: i % 2 ? 2 : -2, seed: 20 + i, tape: false }));
  const lines = feats.map(f => svgEl(f.g, 760, 112, `<line x1="40" y1="60" x2="720" y2="52" stroke="${COL.red}" stroke-width="14" stroke-linecap="round" stroke-dasharray="700" stroke-dashoffset="700"/>`, { left: '0px', top: '0px' }).querySelector('line'));
  const inter = stampBox(A.c, { x: 150, y: 960, w: 780, h: 220, col: COL.red, b: 11, font: '900 170px/1 BSS', txt: 'INTERDIT' });
  // 13–15 ans : accord des parents
  const card = el('div', '', A.c, { left: '90px', top: '600px', width: '900px', height: '330px', background: COL.light, boxShadow: '4px 16px 28px rgba(0,0,0,.25)', transformOrigin: '50% 50%' });
  el('div', 'tex tex-paper', card);
  el('div', '', card, { position: 'absolute', left: '60px', top: '96px', width: '140px', height: '140px', border: `9px solid ${COL.ink}`, boxSizing: 'border-box', borderRadius: '10px' });
  const tick = svgEl(card, 220, 220, `<path d="M18 120 L78 178 L196 22" fill="none" stroke="${COL.red}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="330" stroke-dashoffset="330"/>`, { left: '40px', top: '40px' }).querySelector('path');
  el('div', '', card, { position: 'absolute', left: '250px', top: '78px', font: '900 92px/0.95 ANY', fontStretch: '82%', color: COL.ink, letterSpacing: '-0.02em' }, 'ACCORD DES<br>PARENTS');
  tape(card, 60, -22, 170, 50, -7); tape(card, 700, 300, 170, 50, 6);
  const pos = el('div', '', A.c, { left: '0px', top: '990px', width: '1080px', textAlign: 'center', font: '900 190px/1 ANY', fontStretch: '86%', color: COL.red, letterSpacing: '-0.03em', transformOrigin: '50% 50%' }, 'POSSIBLE');
  burst(A.parts, R, { t: 17.65, x: 540, y: 1070, rx: 700, ry: 150, n: 70, v0: 200, v1: 1200, k: 7, r0: 1, r1: 6, col: COL.red, a: 0.85 });
  return {
    upd(t) {
      show(A.wrap, t >= 17.0 && t < 21.36); if (!(t >= 17.0 && t < 21.36)) return;
      pasteUpd(A, pa, t, 17.0, 0.28);
      const first = t < 19.2;
      lab.innerHTML = first ? 'AVANT' : 'DÈS';
      tf(lab, 0, 0, 0, t > 19.2 ? 1 + 0.2 * Math.exp(-(t - 19.2) * 10) : 1);
      od.set(t < 19.2 ? lerp(0, 15, E.out5(P(t, 17.1, 17.6))) : lerp(15, 13, E.io3(P(t, 19.2, 19.75))));
      tf(box, 0, -500 * (1 - spring(t - 17.05, 2.0, 0.5)));
      const out = E.in3(P(t, 19.0, 19.3));
      feats.forEach((f, i) => { stripUpd(f, t, 17.95 + i * 0.15, 0); if (t > 19.0) tf(f.g, -1300 * out, 0, (f.o.rot) - 6 * out); lines[i].setAttribute('stroke-dashoffset', (700 * (1 - E.out3(P(t, 18.05 + i * 0.15, 18.22 + i * 0.15)))).toFixed(0)); });
      setSlam(inter, t, 17.65, -8);
      if (t >= 19.0) { op(inter, 1 - P(t, 19.2, 19.3)); tf(inter, -1300 * out, 0, -8 - 6 * out); }
      const a = t - 19.8, s = spring(a, 2.4, 0.5);
      op(card, a > 0 ? 1 : 0); tf(card, 0, 0, lerp(-6, -1.5, s), 1 + 0.3 * (1 - s));
      tick.setAttribute('stroke-dashoffset', (330 * (1 - E.out3(P(t, 20.45, 20.7)))).toFixed(0));
      setSlam(pos, t, 20.0, -2);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S7 · 21–25 s · « Comment ils vont vérifier ton âge ? Le texte ne le dit toujours pas. » ═══════════ */
function buildS7() {
  const A = poster('s7', { bg: COL.ink, tex: 'ink', z: 7 });
  const pa = makePaste(-155, 77), R = rng(777);
  svgEl(A.c, 1080, 700, `<path d="${halftone(1080, 700, 22, (x, y) => (y / 700) * 0.45)}" fill="${COL.paper}" fill-opacity=".1"/>`, { left: '0px', top: '1220px' });
  const qq = typer(A.c, 'LA QUESTION QUI FÂCHE :', { left: '0px', top: '180px', width: '1080px', textAlign: 'center', font: '60px/1 ELITE', color: COL.paper });
  const c1 = el('div', '', A.c, { left: '0px', top: '270px', width: '1080px', textAlign: 'center', font: '900 124px/1 ANY', fontStretch: '86%', color: COL.light, letterSpacing: '-0.02em', transformOrigin: '50% 50%' }, 'COMMENT ILS');
  const c2 = el('div', '', A.c, { left: '0px', top: '392px', width: '1080px', textAlign: 'center', font: '900 112px/1 ANY', fontStretch: '78%', color: COL.red, letterSpacing: '-0.02em', transformOrigin: '50% 50%' }, 'VÉRIFIENT TON ÂGE ?');
  const opts = ['PIÈCE D’IDENTITÉ ?', 'SCAN DU VISAGE ?', 'APPLI D’IDENTITÉ ?'].map((s, i) => strip(A.c, { x: 130 + (i % 2) * 60, y: 570 + i * 124, w: 760, h: 104, bg: i === 1 ? COL.paper : COL.light, font: '58px/1 ELITE', col: COL.ink, html: s, rot: i % 2 ? 2.5 : -2, seed: 40 + i, tape: false }));
  const form = el('div', '', A.c, { left: '90px', top: '960px', width: '900px', height: '210px', background: COL.light, transformOrigin: '50% 50%', boxShadow: '0 14px 26px rgba(0,0,0,.4)' });
  el('div', 'tex tex-paper', form);
  const fl = typer(form, 'MÉTHODE PRÉVUE PAR LE TEXTE :', { position: 'absolute', left: '40px', top: '36px', font: '50px/1 ELITE', color: COL.ink });
  const caret = el('div', '', form, { position: 'absolute', left: '40px', top: '112px', width: '28px', height: '58px', background: COL.ink });
  el('div', '', form, { position: 'absolute', left: '40px', top: '178px', width: '820px', height: '3px', background: COL.ink, opacity: 0.4 });
  const np = stampBox(A.c, { x: 270, y: 1040, w: 720, h: 190, col: COL.red, b: 10, font: '900 128px/1 BSS', txt: 'PAS PRÉCISÉ' });
  return {
    upd(t) {
      show(A.wrap, t >= 21.0 && t < 25.36); if (!(t >= 21.0 && t < 25.36)) return;
      pasteUpd(A, pa, t, 21.0, 0.3);
      qq.set(P(t, 21.2, 21.7), t);
      setSlam(c1, t, 21.9, -1.5); setSlam(c2, t, 22.15, -1.5);
      opts.forEach((o, i) => stripUpd(o, t, 22.6 + i * 0.2, i % 2 ? 50 : -50));
      const a = t - 23.35, s = spring(a, 2.4, 0.5);
      op(form, a > 0 ? 1 : 0); tf(form, 0, 80 * (1 - s), lerp(3, 0.5, s));
      fl.set(P(t, 23.5, 24.05), t);
      show(caret, t > 24.05 && on12(t) % 6 < 3);
      setSlam(np, t, 24.35, -8);
      A.parts.draw(t);
    },
  };
}

/* ═══════════ S8 · 25–30 s · le mur, PROTECTION OU FLICAGE ? ═══════════ */
function buildWall() {
  const Wl = el('div', '', cam, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', zIndex: 20 });
  const G = el('div', '', Wl, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', transformOrigin: '540px 960px' });
  const bg = el('div', '', G, { position: 'absolute', left: '-6000px', top: '-8000px', width: '13080px', height: '17920px', background: COL.wall });
  el('div', 'tex tex-ink', bg, { opacity: 0.8 });
  const names = ['s4', 's1', 's6', 's3', 's2', 's5', 's1', 's6', 's2', 's3', 's5', 's4', 's6', 's1'];
  const R = rng(2027); let k = 0; const imgs = [];
  for (let r = -1; r <= 1; r++) for (let c = -2; c <= 2; c++) {
    const center = r === 0 && c === 0, n = center ? 's7' : names[k++];
    const d = el('div', '', G, { position: 'absolute', left: (c * 1250 + (center ? 0 : (R() - 0.5) * 120)) + 'px', top: (r * 2110 + (center ? 0 : (R() - 0.5) * 120)) + 'px', width: '1080px', height: '1920px', transform: `rotate(${center ? 0 : ((R() - 0.5) * 7).toFixed(2)}deg)`, boxShadow: '0 40px 90px rgba(0,0,0,.65)' });
    const im = el('img', '', d, { width: '1080px', height: '1920px', display: 'block' }); im.src = 'tiles/' + n + '.png'; imgs.push(im);
    if (!center) { tape(d, 380, -40, 320, 96, (R() - 0.5) * 16); if (R() < 0.6) tape(d, 760, 1840, 320, 96, (R() - 0.5) * 16); }
  }
  const veil = el('div', '', Wl, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', background: '#000', opacity: 0 });
  const cv = el('canvas', '', Wl, { position: 'absolute', left: '0px', top: '0px' }); cv.width = W; cv.height = H;
  const parts = new Parts(cv), PR = rng(3131);
  const pro = el('div', '', Wl, { position: 'absolute', left: '0px', top: '470px', width: '1080px', textAlign: 'center', font: '132px/1 SPRAY', color: COL.fluo, transformOrigin: '50% 50%', whiteSpace: 'nowrap', letterSpacing: '-0.04em' }, 'PROTECTION');
  const ou = el('div', '', Wl, { position: 'absolute', left: '0px', top: '690px', width: '1080px', textAlign: 'center', font: '96px/1 MARK', color: COL.light, transformOrigin: '50% 50%' }, 'ou');
  const fli = el('div', '', Wl, { position: 'absolute', left: '0px', top: '800px', width: '1080px', textAlign: 'center', font: '172px/1 SPRAY', color: COL.fluo, transformOrigin: '50% 50%', whiteSpace: 'nowrap', letterSpacing: '-0.04em' }, 'FLICAGE ?');
  const drips = dripsSvg(Wl, [[150, 110, 12, 0], [330, 170, 14, 0.1], [560, 90, 10, 0.18], [760, 150, 13, 0.06], [900, 100, 11, 0.22]], COL.fluo, 1040);
  sprayMist(parts, PR, { t0: 26.45, t1: 26.85, x0: 80, x1: 1000, y0: 500, y1: 660, n: 900, col: COL.fluo, spread: 60, yspread: 70 });
  sprayMist(parts, PR, { t0: 27.15, t1: 27.6, x0: 40, x1: 1040, y0: 830, y1: 1040, n: 1200, col: COL.fluo, spread: 70, yspread: 80 });
  const sk = el('div', '', Wl, { position: 'absolute', left: '120px', top: '1150px', width: '840px', height: '150px', borderRadius: '75px', background: COL.light, border: `6px solid ${COL.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 64px/1 ANY', fontStretch: '90%', color: COL.ink, letterSpacing: '-0.01em', boxShadow: '0 18px 34px rgba(0,0,0,.5)', transformOrigin: '50% 50%', whiteSpace: 'nowrap' }, 'DIS-LE EN COMMENTAIRE');
  return {
    imgs,
    upd(t, o) {
      const v = !o.tile && t >= 25.0;
      show(Wl, v); if (!v) return;
      const pp = E.io3(P(t, 25.0, 26.4));
      tf(G, 60 * pp, 0, -3 * pp, lerp(1, 0.3, pp) * (1 - 0.04 * P(t, 26.4, 30)));
      op(veil, 0.52 * P(t, 26.0, 26.45));
      sprayReveal(pro, P(t, 26.45, 26.85), 96); tf(pro, 0, 0, -3);
      const ao = t - 26.95; op(ou, ao > 0 ? 1 : 0); tf(ou, 0, 0, -4, ao > 0 ? 1 + 0.3 * Math.exp(-ao * 12) : 1);
      sprayReveal(fli, P(t, 27.15, 27.6), 96); tf(fli, 0, 0, -3, 1 + (t > 27.6 ? 0.04 * Math.exp(-(t - 27.6) * 9) : 0));
      drips(t, 27.55);
      const a = t - 28.3, s = spring(a, 2.2, 0.45);
      op(sk, a > 0 ? 1 : 0); tf(sk, 0, 0, lerp(-10, -3, s) + Math.sin(t * 2) * 0.5 * clamp(a), 1 + 0.35 * (1 - s));
      parts.draw(t);
    },
  };
}

/* ═══════════ sous-titres : bande collée, en temps vidéo (CAPS écrit par voice.py) ═══════════ */
function buildCaps() {
  const layer = el('div', '', stage, { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '1920px', zIndex: 50, pointerEvents: 'none' });
  const g = el('div', '', layer, { position: 'absolute', left: '60px', top: '1360px', width: '960px', height: '96px', transformOrigin: '50% 50%' });
  const bgS = svgEl(g, 960, 96, '', { left: '0px', top: '0px', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.35))' });
  const box = el('div', '', g, { position: 'absolute', left: '0px', top: '0px', width: '960px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
  const tx = el('span', '', box, { font: '46px/1 ELITE', color: COL.ink, whiteSpace: 'nowrap' });
  const cache = {};
  let cur = -1;
  return {
    upd(u) {
      const C = window.CAPS || [];
      let i = -1;
      for (let k = 0; k < C.length; k++) if (u >= C[k][0] && u < C[k][1]) { i = k; break; }
      show(g, i >= 0 && !TILE_MODE); if (i < 0) return;
      if (i !== cur) {
        cur = i; tx.textContent = C[i][2];
        const w = Math.min(980, tx.getBoundingClientRect().width + 70);
        if (!cache[i]) cache[i] = tornRect(w, 96, 9, 20, 300 + i);
        bgS.setAttribute('width', w); bgS.setAttribute('viewBox', `0 0 ${w} 96`); bgS.style.left = ((960 - w) / 2) + 'px';
        bgS.innerHTML = `<path d="${cache[i]}" fill="${COL.light}"/>`;
      }
      const a = u - C[i][0];
      tf(g, 0, 0, (hash(i, 5) - 0.5) * 2.4, 1 + 0.06 * Math.exp(-a * 18));
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
    r += sh * 0.02 * e * Math.sin(a * 2 * Math.PI * 9 + c.t);
    s += (c.pu || 0) * Math.exp(-a * 9) * clamp(a / 0.03);
  }
  const f = 1 - P(t, 24.6, 25.0);
  x += 5 * Math.sin(t * 0.9) * f; y += 4 * Math.sin(t * 0.63 + 1) * f; r += 0.2 * Math.sin(t * 0.5) * f;
  return { x, y, s, r };
}
function flashAt(t) { for (const c of CUES) if (c.fl) { const a = t - c.t; if (a >= 0 && a < 0.1) return [c.fl[0], c.fl[1] * (1 - a / 0.1)]; } return null; }

async function main() {
  await document.fonts.load('900 100px BSS'); await document.fonts.load('900 100px ANY'); await document.fonts.load('100px ELITE');
  await document.fonts.load('100px MARK'); await document.fonts.load('100px SPRAY'); await document.fonts.load('700 100px MONO');
  await document.fonts.ready;
  const s4 = buildS4();
  SCENES.push(buildS1(), buildS2(), buildS3(), s4, buildS5(), buildRip(s4), buildS6(), buildS7());
  const wall = buildWall(); SCENES.push(wall);
  const caps = buildCaps();
  if (!TILE_MODE) await Promise.all(wall.imgs.map(im => im.decode().catch(() => {})));
  const base = (t, o = {}) => {
    const c = o.tile ? { x: 0, y: 0, s: 1, r: 0 } : camAt(t);
    cam.style.transform = `translate(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px) rotate(${c.r.toFixed(3)}deg) scale(${c.s.toFixed(4)})`;
    const f = o.tile ? null : flashAt(t);
    flashEl.style.background = f ? f[0] : 'transparent'; flashEl.style.opacity = f ? f[1].toFixed(3) : 0;
    show(vign, !o.tile);
    for (const s of SCENES) s.upd(t, o);
  };
  window.__dur = DUR; window.__fps = FPS;
  // version voix : temps vidéo → temps de l'animation (warp.js, généré par voice.py) ; sous-titres en temps vidéo
  const Wp = window.WARP;
  const warp = u => { if (!Wp || TILE_MODE) return u; if (u <= Wp[0][0]) return Wp[0][1]; for (let i = 1; i < Wp.length; i++) if (u <= Wp[i][0]) { const [a0, b0] = Wp[i - 1], [a1, b1] = Wp[i]; return b0 + (b1 - b0) * (u - a0) / (a1 - a0); } return Wp[Wp.length - 1][1]; };
  window.renderAt = (u, o = {}) => { base(o.tile ? u : warp(u), o); caps.upd(u); };
  if (Wp && !TILE_MODE) window.__dur = window.VDUR;
  window.renderAt(0);
  window.__ready = true;
}
main();
