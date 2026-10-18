/* MANIF01 — outils : temps, courbes, aléatoire déterministe, DOM, particules, odomètre, foule, trames, déchirures. */
'use strict';
const W = 1080, H = 1920, FPS = 30, DUR = 30.0;
const COL = { paper: '#EEE7D7', ink: '#141210', red: '#E8291C', fluo: '#E6FF3A', old: '#E2D0A0', light: '#F7F2E6', blue: '#2B4C7E', wall: '#2A2622', kraft: '#C9A86A' };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: p => p,
  out2: p => 1 - (1 - p) * (1 - p),
  out3: p => 1 - Math.pow(1 - p, 3),
  out5: p => 1 - Math.pow(1 - p, 5),
  in2: p => p * p,
  in3: p => p * p * p,
  io2: p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
  io3: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  outBack: (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
  outExpo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  inExpo: p => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
};
/* ressort amorti : 0 → 1 avec dépassement, a = secondes depuis le départ */
function spring(a, f = 2.4, z = 0.42) {
  if (a <= 0) return 0;
  const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * a) * (Math.cos(wd * a) + (z * w / wd) * Math.sin(wd * a));
}
/* aléatoire déterministe */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let r = Math.imul(s ^ (s >>> 15), 1 | s); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
const hash = (a, b = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/* tremblé « à 12 images/s » (fait main) */
const on12 = t => Math.floor(t * 12);
const jit = (t, seed, amp) => (hash(on12(t), seed) - 0.5) * 2 * amp;

/* DOM */
function el(tag, cls, parent, css, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) Object.assign(e.style, css);
  if (html !== undefined) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
function svgEl(parent, w, h, body, css) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.innerHTML = body;
  Object.assign(s.style, { position: 'absolute', overflow: 'visible' }, css || {});
  parent.appendChild(s);
  return s;
}
function tf(e, x = 0, y = 0, r = 0, s = 1, sy) {
  e.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)},${(sy === undefined ? s : sy).toFixed(4)})`;
}
const show = (e, v) => { e.style.display = v ? '' : 'none'; };
const op = (e, v) => { e.style.opacity = clamp(v).toFixed(3); };

/* lettres séparées pour les animations lettre à lettre */
function letters(parent, text, css) {
  const box = el('div', 'lt', parent, css);
  const spans = [];
  for (const ch of text) {
    const s = el('span', '', box, { display: 'inline-block', whiteSpace: 'pre' }, ch === ' ' ? '&nbsp;' : ch);
    spans.push(s);
  }
  return { box, spans };
}
/* machine à écrire : texte tronqué + curseur */
function typer(parent, text, css) {
  const e = el('div', 'typer', parent, css);
  return { e, set(p, t) {
    const n = Math.floor(clamp(p) * text.length + 0.0001);
    const caret = p > 0 && p < 1.15 && (on12(t) % 4 < 2) ? '<span style="opacity:.85">▌</span>' : '';
    e.innerHTML = text.slice(0, n).replace(/\n/g, '<br>') + caret;
  } };
}

/* trame de points (demi-ton) : un seul path SVG */
function halftone(w, h, g, fn) {
  let d = '';
  for (let y = g / 2; y < h; y += g) {
    const row = Math.round(y / g);
    for (let x = g / 2 + (row % 2) * g / 2; x < w; x += g) {
      const r = fn(x, y) * g * 0.5;
      if (r > 0.6) d += `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r.toFixed(1)},${r.toFixed(1)} 0 1,0 ${(2 * r).toFixed(1)},0a${r.toFixed(1)},${r.toFixed(1)} 0 1,0 ${(-2 * r).toFixed(1)},0`;
    }
  }
  return d;
}
/* bord déchiré (rectangle) */
function tornRect(w, h, amp, step, seed) {
  const R = rng(seed);
  let d = `M0,${R() * amp}`;
  for (let x = step; x <= w; x += step) d += `L${x},${R() * amp}`;
  for (let y = step; y <= h; y += step) d += `L${w - R() * amp * 0.6},${y}`;
  for (let x = w; x >= 0; x -= step) d += `L${x},${h - R() * amp}`;
  for (let y = h; y >= 0; y -= step) d += `L${R() * amp * 0.6},${y}`;
  return d + 'Z';
}

/* Collage au balai : polygone de révélation dont le bord est irrégulier. ang en degrés = sens du balayage. */
function makePaste(ang, seed) {
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const cs = [[0, 0], [W, 0], [W, H], [0, H]];
  const us = cs.map(([x, y]) => x * dx + y * dy), vs = cs.map(([x, y]) => x * nx + y * ny);
  const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs) - 80, v1 = Math.max(...vs) + 80;
  const R = rng(seed), N = 46, jag = [];
  for (let i = 0; i <= N; i++) jag.push((R() - 0.5) * 46 + Math.sin(i * 0.9 + seed) * 22 + (R() < 0.12 ? (R() - 0.5) * 70 : 0));
  const pt = (u, v) => `${(u * dx + v * nx).toFixed(1)}px ${(u * dy + v * ny).toFixed(1)}px`;
  return {
    clip(p) {
      if (p >= 1) return 'none';
      const s = lerp(u0 - 90, u1 + 90, p);
      const pts = [pt(u0 - 400, v0 - 400)];
      for (let i = 0; i <= N; i++) { const v = lerp(v0, v1, i / N); pts.push(pt(s + jag[i] * (0.6 + 0.4 * Math.sin(p * 3 + i)), v)); }
      pts.push(pt(u0 - 400, v1 + 400));
      return `polygon(${pts.join(',')})`;
    },
    /* bande humide juste derrière le bord */
    band(p, wd = 110) {
      if (p <= 0 || p >= 1) return 'polygon(0 0,0 0,0 0)';
      const s = lerp(u0 - 90, u1 + 90, p);
      const a1 = [], a2 = [];
      for (let i = 0; i <= N; i++) { const v = lerp(v0, v1, i / N), j = jag[i] * (0.6 + 0.4 * Math.sin(p * 3 + i)); a1.push(pt(s + j, v)); a2.unshift(pt(s + j - wd, v)); }
      return `polygon(${a1.concat(a2).join(',')})`;
    },
  };
}

/* ———————————— particules ———————————— */
/* chaque affiche a son canvas ; une particule = trajectoire analytique (traînée + gravité) */
class Parts {
  constructor(canvas) { this.c = canvas; this.x = canvas.getContext('2d'); this.L = []; }
  add(o) { this.L.push(Object.assign({ k: 3, g: 0, r: 2, a: 1, life: 1, sh: 'c', until: 1e9, fin: 0.25, rot: 0, vr: 0, len: 10 }, o)); }
  pos(q, a) {
    const k = Math.max(q.k, 1e-3), ek = Math.exp(-k * a), gk = q.g / k;
    return [q.x + q.vx * (1 - ek) / k, q.y + gk * a + (q.vy - gk) * (1 - ek) / k, q.vx * ek, gk + (q.vy - gk) * ek];
  }
  draw(t) {
    const x = this.x; x.clearRect(0, 0, W, H);
    for (const q of this.L) {
      const a = t - q.t0;
      if (a < 0 || a > q.life || t > q.until) continue;
      const [px, py, vx, vy] = this.pos(q, a);
      let al = q.a;
      if (q.fin) al *= clamp(a / 0.04) * clamp((q.life - a) / (q.life * q.fin));
      if (q.flick) al *= 0.55 + 0.45 * hash(on12(t) + q.t0 * 1000, q.x | 0);
      if (al <= 0.003) continue;
      x.globalAlpha = al; x.fillStyle = q.col; x.strokeStyle = q.col;
      if (q.sh === 'c') { x.beginPath(); x.arc(px, py, q.r, 0, 6.2832); x.fill(); }
      else if (q.sh === 's') { const sp = Math.hypot(vx, vy) + 1e-6, L = Math.min(q.len, sp * 0.035 + 2); x.lineWidth = q.r; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py); x.lineTo(px - vx / sp * L, py - vy / sp * L); x.stroke(); }
      else if (q.sh === 'r') { x.save(); x.translate(px, py); x.rotate(q.rot + q.vr * a); x.fillRect(-q.r, -q.r * 0.6, q.r * 2, q.r * 1.2); x.restore(); }
    }
    x.globalAlpha = 1;
  }
}
/* nuage de bombe le long d'un bord qui avance (ex. révélation de STOP) */
function sprayMist(parts, R, o) {
  // o: {t0,t1,x0,x1,y0,y1,col,n,until,spread}
  for (let i = 0; i < o.n; i++) {
    const u = R(), t = lerp(o.t0, o.t1, u), x = lerp(o.x0, o.x1, u) + (R() - 0.5) * (o.spread || 60);
    const y = lerp(o.y0, o.y1, R()) + (R() - 0.5) * (o.yspread || 80);
    const ang = R() * 6.283, sp = 40 + R() * 260;
    parts.add({ t0: t, life: 999, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.7, k: 7 + R() * 5, r: 0.7 + R() * R() * 4, col: o.col, a: 0.12 + R() * 0.55, fin: 0, until: o.until });
  }
}
function burst(parts, R, o) {
  // éclaboussures / étincelles / poussière autour d'un point
  for (let i = 0; i < o.n; i++) {
    const ang = (o.dir !== undefined ? o.dir + (R() - 0.5) * (o.cone || 6.283) : R() * 6.283), sp = o.v0 + R() * o.v1;
    parts.add({ t0: o.t + R() * (o.dt || 0), life: o.life ? o.life * (0.5 + R()) : 999, x: o.x + (R() - 0.5) * (o.rx || 0), y: o.y + (R() - 0.5) * (o.ry || 0),
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * (o.sq || 1), k: o.k || 6, g: o.g || 0, r: o.r0 + R() * R() * o.r1, col: Array.isArray(o.col) ? o.col[Math.floor(R() * o.col.length)] : o.col,
      a: o.a !== undefined ? o.a * (0.5 + 0.5 * R()) : 1, sh: o.sh || 'c', len: o.len || 14, fin: o.fin !== undefined ? o.fin : (o.life ? 0.4 : 0), until: o.until || 1e9, flick: o.flick, rot: R() * 6, vr: (R() - 0.5) * 20 });
  }
}

/* ———————————— odomètre (rouleaux de chiffres) ———————————— */
/* pattern : '####' ou '### ###' ; set(v) avec v continu, retenues mécaniques réalistes */
function odometer(parent, pattern, o) {
  const box = el('div', 'odo', parent, { position: 'absolute', display: 'flex', gap: o.gap + 'px', left: '0px', top: '0px' });
  const cells = [];
  for (const ch of pattern) {
    if (ch === ' ') { el('div', '', box, { width: o.space + 'px' }); continue; }
    const c = el('div', 'odo-cell', box, { width: o.w + 'px', height: o.h + 'px', background: o.cell, borderRadius: o.rad + 'px', overflow: 'hidden', position: 'relative', boxShadow: o.shadow || 'none' });
    const strip = el('div', '', c, { position: 'absolute', left: 0, top: 0, width: '100%' });
    for (let d = 0; d <= 10; d++) el('div', '', strip, { height: o.h + 'px', lineHeight: o.h + 'px', textAlign: 'center', font: `900 ${o.fs}px BSS`, color: o.col }, String(d % 10));
    el('div', '', c, { position: 'absolute', left: 0, right: 0, top: (o.h / 2 - 2) + 'px', height: '4px', background: 'rgba(0,0,0,.32)' });
    el('div', '', c, { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,0) 26%,rgba(0,0,0,0) 74%,rgba(0,0,0,.38))' });
    cells.push({ c, strip });
  }
  const n = cells.length;
  return {
    box, cells,
    set(v) {
      for (let i = 0; i < n; i++) {
        const k = n - 1 - i, p10 = Math.pow(10, k);
        let pos;
        if (k === 0) pos = v;
        else { const r = ((v % p10) + p10) % p10; pos = Math.floor(v / p10) + clamp(r - (p10 - 1)); }
        const m = ((pos % 10) + 10) % 10;
        cells[i].strip.style.transform = `translateY(${(-m * o.h).toFixed(2)}px)`;
      }
    },
  };
}

/* ———————————— foule en silhouettes ———————————— */
function crowd(parent, o) {
  // o: {w,h,n,seed,col,plac:[mots], placCol:[], scale, y}
  const R = rng(o.seed);
  const s = svgEl(parent, o.w, o.h, '', { left: (o.x || 0) + 'px', top: (o.y || 0) + 'px' });
  const people = [];
  let body = '';
  for (let i = 0; i < o.n; i++) {
    const x = (i + 0.5) * o.w / o.n + (R() - 0.5) * o.w / o.n * 0.6;
    const sc = (o.sc || 1) * (0.85 + R() * 0.3);
    const hr = 30 * sc, top = o.h * (o.top || 0.42) + (R() - 0.5) * o.h * 0.18;
    const sw = hr * 2.45;
    let g = `<g class="pp">`;
    // bras levé tenant une pancarte
    const plac = o.plac && R() < (o.pr || 0.45);
    let pl = '';
    if (plac) {
      const pw = (120 + R() * 70) * sc, ph = (78 + R() * 34) * sc, px = x + (R() - 0.5) * 30 * sc, py = top - (150 + R() * 70) * sc;
      const word = o.plac[Math.floor(R() * o.plac.length)], pc = o.placCol[Math.floor(R() * o.placCol.length)];
      const tc = pc === COL.red || pc === COL.ink ? COL.light : COL.ink;
      const rot = (R() - 0.5) * 14;
      pl = `<g transform="rotate(${rot.toFixed(1)} ${px.toFixed(1)} ${(py + ph).toFixed(1)})"><rect x="${(px - 3.5 * sc).toFixed(1)}" y="${(py + ph - 4).toFixed(1)}" width="${(7 * sc).toFixed(1)}" height="${(top - py - ph + 70 * sc).toFixed(1)}" fill="${COL.kraft}"/>`
        + `<rect x="${(px - pw / 2).toFixed(1)}" y="${py.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" fill="${pc}" stroke="${COL.ink}" stroke-width="${(3 * sc).toFixed(1)}"/>`
        + `<text x="${px.toFixed(1)}" y="${(py + ph / 2 + 9 * sc).toFixed(1)}" text-anchor="middle" font-family="MARK" font-size="${(Math.min(26, 190 / word.length) * sc * 1.25).toFixed(1)}" fill="${tc}">${word}</text></g>`;
      g += `<path d="M${x + sw * 0.35},${top + hr * 1.6} L${px + 8 * sc},${top - 40 * sc}" stroke="${o.col}" stroke-width="${(16 * sc).toFixed(1)}" stroke-linecap="round"/>`;
    } else if (R() < (o.fist || 0.18)) {
      // poing levé
      const fx = x + (R() < 0.5 ? -1 : 1) * sw * 0.5, fy = top - 95 * sc;
      g += `<path d="M${x + (fx > x ? 1 : -1) * sw * 0.35},${top + hr * 1.6} L${fx},${fy + 20 * sc}" stroke="${o.col}" stroke-width="${(16 * sc).toFixed(1)}" stroke-linecap="round"/><rect x="${(fx - 13 * sc).toFixed(1)}" y="${(fy - 8 * sc).toFixed(1)}" width="${(26 * sc).toFixed(1)}" height="${(28 * sc).toFixed(1)}" rx="${(8 * sc).toFixed(1)}" fill="${o.col}"/>`;
    }
    g += `<circle cx="${x.toFixed(1)}" cy="${top.toFixed(1)}" r="${hr.toFixed(1)}" fill="${o.col}"/>`;
    g += `<path d="M${x - sw},${o.h + 10} L${x - sw},${top + hr * 2.1} Q${x - sw},${top + hr * 1.05} ${x - sw * 0.45},${top + hr * 1.02} L${x + sw * 0.45},${top + hr * 1.02} Q${x + sw},${top + hr * 1.05} ${x + sw},${top + hr * 2.1} L${x + sw},${o.h + 10}Z" fill="${o.col}"/>`;
    g += pl + `</g>`;
    body += g;
    people.push({ ph: R() * 6.28, f: 1.6 + R() * 1.2, amp: (6 + R() * 10) * sc });
  }
  s.innerHTML = body;
  const gs = [...s.querySelectorAll('g.pp')];
  return {
    svg: s,
    update(t, energy = 1) {
      gs.forEach((g, i) => {
        const p = people[i];
        const b = Math.abs(Math.sin(t * p.f * Math.PI + p.ph)) * p.amp * energy;
        g.setAttribute('transform', `translate(0 ${(-b).toFixed(1)})`);
      });
    },
  };
}

/* projection simplifiée de la France métropolitaine (lon, lat) */
const FRANCE = [[2.37,51.05],[1.85,50.95],[1.6,50.7],[1.55,50.2],[1.08,49.93],[0.1,49.5],[-0.4,49.33],[-1.25,49.65],[-1.62,49.65],[-1.95,49.7],[-1.6,49.2],[-1.5,48.65],[-2.0,48.65],[-2.75,48.55],[-3.45,48.82],[-4.5,48.4],[-4.73,48.04],[-4.35,47.8],[-3.37,47.7],[-3.1,47.5],[-2.2,47.25],[-2.05,46.95],[-1.78,46.5],[-1.15,46.15],[-1.05,45.6],[-1.25,44.65],[-1.55,43.48],[-1.78,43.37],[-1.25,43.05],[-0.5,42.8],[0.7,42.85],[1.5,42.5],[2.5,42.4],[3.17,42.44],[3.05,42.7],[3.1,43.15],[3.7,43.4],[3.95,43.55],[4.6,43.4],[5.35,43.3],[5.93,43.1],[6.65,43.25],[7.27,43.7],[7.5,43.78],[7.0,44.2],[6.95,44.85],[7.0,45.3],[6.85,45.85],[6.1,46.2],[6.1,46.55],[6.95,47.4],[7.55,47.58],[7.8,48.6],[8.2,48.97],[7.0,49.15],[6.37,49.47],[5.8,49.55],[4.85,50.15],[4.15,50.0],[3.15,50.8],[2.6,51.07]];
const CORSE = [[8.55,42.38],[8.65,41.85],[9.1,41.4],[9.55,42.1],[9.45,42.98],[9.3,43.0],[8.75,42.55]];
function inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
