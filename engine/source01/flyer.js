/* SOURCE01 — flyer 1080×1920 (même identité que la vidéo). Statique : renderAt ne fait rien. */
'use strict';
const stage = document.getElementById('stage'), cam = document.getElementById('cam');
const CAR = 'M40,300 L40,240 Q45,205 90,195 L250,180 Q330,110 420,95 L640,92 Q720,95 790,170 L900,190 Q955,200 965,240 L968,300 Q968,318 950,320 L860,320 A85,85 0 0,0 690,320 L330,320 A85,85 0 0,0 160,320 L60,320 Q40,318 40,300 Z';
function halftoneIn(d, w, h, g, fn) { const ctx = document.createElement('canvas').getContext('2d'), p2 = new Path2D(d); return halftone(w, h, g, (x, y) => (ctx.isPointInPath(p2, x, y) ? fn(x, y) : 0)); }
function tape(parent, x, y, w, h, r) { return el('div', 'tape', parent, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', transform: `rotate(${r}deg)` }); }
function stamp(parent, txt, o) {
  return el('div', 'worn', parent, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', boxSizing: 'border-box', border: `${o.bw}px solid ${o.col || COL.red}`, borderRadius: '12px', font: `900 ${o.fs}px/1 BSS`, color: o.col || COL.red, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: (o.pt || 0) + 'px', transform: `rotate(${o.r}deg)` }, txt);
}

function build() {
  const P = el('div', 'poster', cam, { background: COL.paper });
  const c = el('div', 'content', P);
  // trames décoratives
  svgEl(c, 1080, 760, `<path d="${halftone(1080, 760, 20, (x, y) => Math.max(0, 1 - Math.hypot(1080 - x, y) / 720))}" fill="${COL.ink}"/>`, { left: '0px', top: '0px' });
  // ——— titre ———
  el('div', '', c, { left: '84px', top: '150px', font: '120px/1 ELITE', color: COL.ink }, 'LA');
  const src = el('div', '', c, { left: '62px', top: '262px', font: '900 318px/1 BSS', color: COL.ink, whiteSpace: 'nowrap', textShadow: `7px 5px 0 rgba(232,41,28,.85)` }, 'SOURCE');
  const st = el('div', '', c, { left: '110px', top: '640px', width: '860px', height: '146px', transform: 'rotate(-2deg)' });
  svgEl(st, 860, 146, `<path d="${tornRect(860, 146, 14, 22, 7)}" fill="${COL.ink}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.25))' });
  el('div', '', st, { left: '0px', top: '0px', width: '860px', height: '146px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '84px/1 ELITE', color: COL.paper }, 'TOUT EST DISPO');
  tape(st, -46, -16, 150, 46, -14); tape(st, 756, 100, 150, 46, -9);

  // ——— les 4 offres : petites affiches scotchées ———
  const OFF = [
    { x: 64, y: 860, r: -3, t: 'VÉHICULES', s: 'à bon prix', ic: 'car' },
    { x: 556, y: 880, r: 2.5, t: 'EN GROS', s: 'commandes', ic: 'box' },
    { x: 70, y: 1238, r: 2, t: 'REVENTE', s: 'plans', ic: 'up' },
    { x: 560, y: 1226, r: -2.5, t: 'IMMO', s: 'fiches', ic: 'house' },
  ];
  OFF.forEach((o, k) => {
    const d = el('div', '', c, { left: o.x + 'px', top: o.y + 'px', width: '450px', height: '330px', transform: `rotate(${o.r}deg)` });
    svgEl(d, 450, 330, `<path d="${tornRect(450, 330, 9, 18, 80 + k)}" fill="${COL.light}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 12px 14px rgba(0,0,0,.25))' });
    el('div', 'tex tex-paper', d, { opacity: 0.55 });
    tape(d, 160, -22, 130, 44, (k % 2 ? 6 : -7));
    let icon = '';
    if (o.ic === 'car') {
      const sc = 0.3;
      icon = `<g transform="translate(78 30) scale(${sc})"><path d="${halftoneIn(CAR, 1000, 420, 15, (x, y) => 0.45 + 0.5 * clamp((y - 90) / 230))}" fill="${COL.red}"/><path d="${CAR}" fill="none" stroke="${COL.ink}" stroke-width="16" stroke-linejoin="round"/><circle cx="245" cy="320" r="70" fill="${COL.ink}"/><circle cx="775" cy="320" r="70" fill="${COL.ink}"/><circle cx="245" cy="320" r="30" fill="${COL.light}"/><circle cx="775" cy="320" r="30" fill="${COL.light}"/></g>`;
    } else if (o.ic === 'box') {
      icon = `<g transform="translate(150 22)"><rect x="0" y="40" width="150" height="100" fill="${COL.kraft}" stroke="${COL.ink}" stroke-width="7"/><rect x="58" y="40" width="34" height="100" fill="${COL.light}" fill-opacity=".6"/><rect x="22" y="0" width="106" height="42" fill="${COL.kraft}" stroke="${COL.ink}" stroke-width="7"/><rect x="58" y="0" width="34" height="42" fill="${COL.light}" fill-opacity=".6"/></g>`;
    } else if (o.ic === 'up') {
      icon = `<path d="M120,140 L180,96 L228,118 L300,46" fill="none" stroke="${COL.red}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M262,40 L310,38 L306,86" fill="none" stroke="${COL.red}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M110,160 L330,160" stroke="${COL.ink}" stroke-width="8" stroke-linecap="round"/>`;
    } else {
      icon = `<g transform="translate(150 20) scale(.7)"><path d="M20,98 L110,22 L200,98 M42,82 L42,184 L178,184 L178,82 M90,184 L90,124 L130,124 L130,184" fill="none" stroke="${COL.ink}" stroke-width="15" stroke-linejoin="round" stroke-linecap="round"/><rect x="146" y="38" width="20" height="40" fill="${COL.ink}"/></g>`;
    }
    svgEl(d, 450, 180, icon, { left: '0px', top: '20px' });
    el('div', '', d, { left: '0px', top: '200px', width: '450px', textAlign: 'center', font: '42px/1 MARK', color: COL.ink }, o.s);
    el('div', '', d, { left: '0px', top: '248px', width: '450px', textAlign: 'center', font: `900 ${o.t.length > 7 ? 74 : 82}px/1 BSS`, color: k % 2 ? COL.red : COL.ink, letterSpacing: '0.03em' }, o.t);
  });

  // ——— bandeau contacts (affiche noire collée en bas) ———
  const band = el('div', '', c, { left: '0px', top: '1596px', width: '1080px', height: '324px' });
  svgEl(band, 1080, 360, `<path d="M0,26 ${Array.from({ length: 37 }, (_, i) => `L${i * 30},${(14 + 18 * hash(i, 9)).toFixed(1)}`).join(' ')} L1080,22 L1080,360 L0,360 Z" fill="${COL.ink}"/>`, { left: '0px', top: '0px', filter: 'drop-shadow(0 -8px 12px rgba(0,0,0,.25))' });
  el('div', 'tex tex-ink', band, { opacity: 0.9 });
  const rows = [['TELEGRAM', 't.me/lasourcetoutestdisponibleoff', 33], ['SNAPCHAT', 'la.source206', 50], ['WHATSAPP', '06 35 09 74 66', 50]];
  rows.forEach(([lab, val, fs], i) => {
    const y = 62 + i * 80;
    el('div', '', band, { left: '84px', top: (y + 12) + 'px', width: '210px', height: '44px', background: COL.red, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 26px/1 MONO', color: COL.light, letterSpacing: '0.1em', transform: `rotate(${i % 2 ? 1 : -1}deg)` }, lab);
    el('div', '', band, { left: '320px', top: (y + (50 - fs) / 2 + 8) + 'px', font: `700 ${fs}px/1 MONO`, color: COL.paper, whiteSpace: 'nowrap', letterSpacing: fs > 40 ? '0.04em' : '0' }, val);
  });
  // tampon DISPO qui chevauche le haut du bandeau
  stamp(c, 'DISPO', { x: 620, y: 104, w: 380, h: 146, fs: 116, bw: 10, pt: 6, r: 8 });
  el('div', 'wr', P, { opacity: 0.32 });
}

(async () => {
  await document.fonts.load('900 100px BSS'); await document.fonts.load('900 100px ANY'); await document.fonts.load('100px ELITE');
  await document.fonts.load('100px MARK'); await document.fonts.load('700 100px MONO');
  await document.fonts.ready;
  build();
  window.renderAt = () => {};
  window.__dur = 1; window.__fps = 1;
  window.__ready = true;
})();
