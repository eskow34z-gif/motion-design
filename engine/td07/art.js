/* TD07 « On t'entend » — bibliothèque d'illustration pop flat.
   Chaque fonction renvoie une chaîne SVG. Les mêmes fonctions servent :
   - aux images clés (Figma, via figma.createNodeFromSvg),
   - à l'animation (paramètres pilotés par le temps).
   Aucune police ici : les textes sont posés à part (Bricolage Grotesque). */

const C = {
  paper: '#FFF4E2', ink: '#241A45', ink2: '#3B2F6B', white: '#FFFFFF',
  yellow: '#FFE234', yellowD: '#F5CB0F', yellowL: '#FFF08A',
  pink: '#FF5DAA', pinkD: '#E63F8E', pinkL: '#FFA6D0',
  green: '#3BE89A', greenD: '#1FC77D', greenL: '#A5F5CF',
  blue: '#4DA3FF', blueD: '#2C84F2', blueL: '#A9D2FF',
  orange: '#FF8A3D', orangeD: '#EB6C1F',
  violet: '#9B7BFF', violetD: '#7E5BF2', violetL: '#CBB9FF',
  skin: '#8D5A3B', skinD: '#71442A', cheek: '#D06A5E',
};
const SKINS = [['#8D5A3B', '#71442A'], ['#E9B48A', '#D29672'], ['#5C3A24', '#472B19'], ['#C98D62', '#AE7448'], ['#F3C9A5', '#DDAD86']];

const f1 = (n) => (Math.round(n * 10) / 10).toString();
const P = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)},${f1(y)}`).join(' ');

/* ---------- formes de base ---------- */
/* forme avec ombre portée franche (style sticker) */
function stick(shape, dx = 10, dy = 12, sh = C.ink) {
  return `<g transform="translate(${dx},${dy})" fill="${sh}" stroke="${sh}">${shape.replace(/fill="[^"]*"/g, '').replace(/stroke="[^"]*"/g, '')}</g>${shape}`;
}
function star4(x, y, r, col, rot = 0) {
  const k = r * 0.28;
  return `<path transform="translate(${f1(x)},${f1(y)}) rotate(${rot})" d="M0,${-r} C${k},${-k} ${k},${-k} ${r},0 C${k},${k} ${k},${k} 0,${r} C${-k},${k} ${-k},${k} ${-r},0 C${-k},${-k} ${-k},${-k} 0,${-r} Z" fill="${col}"/>`;
}
function dots(x0, y0, w, h, gap, r, col, op = 1) {
  let s = `<g data-dots="${x0},${y0},${w},${h},${gap},${r},${col},${op}" fill="${col}" opacity="${op}">`;
  for (let y = y0; y < y0 + h; y += gap)
    for (let x = x0 + ((Math.round((y - y0) / gap) % 2) * gap) / 2; x < x0 + w; x += gap)
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>`;
  return s + '</g>';
}
function squiggle(x, y, len, amp, n, col, w = 10, rot = 0) {
  let d = `M0,0`;
  const step = len / n;
  for (let i = 0; i < n; i++) d += ` q${f1(step / 2)},${i % 2 ? amp : -amp} ${f1(step)},0`;
  return `<path transform="translate(${x},${y}) rotate(${rot})" d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
/* trait de surligneur derrière un mot (bords irréguliers) */
function highlighter(x, y, w, h, col, p = 1, seed = 1) {
  const ww = w * p;
  if (ww < 2) return '';
  const j = (i) => Math.sin(seed * 9.1 + i * 2.7) * h * 0.06;
  const d = `M${f1(x)},${f1(y + j(1))} L${f1(x + ww)},${f1(y + j(2) - h * 0.04)} ` +
    `Q${f1(x + ww + h * 0.18)},${f1(y + h * 0.5)} ${f1(x + ww - h * 0.02)},${f1(y + h + j(3))} ` +
    `L${f1(x + h * 0.05)},${f1(y + h + j(4) + h * 0.03)} Q${f1(x - h * 0.16)},${f1(y + h * 0.5)} ${f1(x)},${f1(y + j(1))} Z`;
  return `<path d="${d}" fill="${col}"/>`;
}

/* ---------- personnage : lycéen ---------- */
/* Repère : (0,0) = milieu des épaules. Le buste descend jusqu'à y≈300.
   o.arm  : null | {hx, hy, bend}  bras droit levé vers (hx, hy) en coordonnées locales
   o.mouth: 'neutral' | 'open' | 'shout' | 'smile' | 'flat' | 'o'
   o.brows: angle des sourcils (positif = fâché) ; o.look : décalage des pupilles [dx, dy] ; o.blink 0..1 */
function hand(x, y, rot, s, skin, skinD, open = 1) {
  const fh = [40, 50, 48, 40].map((h) => h * (0.55 + 0.45 * open));
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})">
    <rect x="-31" y="-18" width="62" height="60" rx="26" fill="${skin}"/>
    ${[-27, -12, 3, 18].map((fx, i) => `<rect x="${fx}" y="${-12 - fh[i]}" width="14" height="${fh[i] + 16}" rx="7" fill="${skin}"/>`).join('')}
    <rect x="-52" y="0" width="34" height="15" rx="7.5" fill="${skin}" transform="rotate(-38 -30 8)"/>
    <path d="M-16,22 Q0,30 16,22" stroke="${skinD}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}
function kid(o = {}) {
  const x = o.x || 0, y = o.y || 0, s = o.s || 1;
  const hood = o.hood || C.pink, hoodD = o.hoodD || C.pinkD;
  const [skin, skinD] = o.skinPair || [C.skin, C.skinD];
  const hair = o.hair || C.ink;
  const lk = o.look || [0, 0], bl = o.blink || 0, br = o.brows || 0;
  const mouth = o.mouth || 'neutral';
  const tilt = o.tilt || 0;
  let m = '';
  if (mouth === 'neutral') m = `<path d="M-16,-96 Q0,-88 16,-96" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  if (mouth === 'flat') m = `<path d="M-15,-93 L15,-93" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>`;
  if (mouth === 'smile') m = `<path d="M-30,-102 Q0,-64 30,-102 Z" fill="${C.ink}"/><path d="M-16,-80 Q0,-72 16,-80 Q0,-86 -16,-80Z" fill="${C.pink}"/>`;
  if (mouth === 'open') m = `<ellipse cx="0" cy="-90" rx="16" ry="18" fill="${C.ink}"/><ellipse cx="0" cy="-82" rx="9" ry="6" fill="${C.pink}"/>`;
  if (mouth === 'shout') m = `<path d="M-30,-108 Q0,-112 30,-108 Q26,-62 0,-60 Q-26,-62 -30,-108Z" fill="${C.ink}"/><ellipse cx="0" cy="-72" rx="15" ry="8" fill="${C.pink}"/>`;
  if (mouth === 'o') m = `<ellipse cx="0" cy="-92" rx="10" ry="12" fill="${C.ink}"/>`;
  const eyeRy = 14 * (1 - 0.9 * bl);
  const eye = (ex) => `<ellipse cx="${ex + lk[0]}" cy="${-140 + lk[1]}" rx="10.5" ry="${f1(eyeRy)}" fill="${C.ink}"/>` +
    (bl < 0.5 ? `<circle cx="${ex + lk[0] + 3.5}" cy="${-145 + lk[1]}" r="3.6" fill="#fff"/>` : '');
  const curls = [[-72, -214], [-38, -240], [0, -249], [38, -240], [72, -214], [-88, -180], [88, -180], [-56, -232], [56, -232]];
  /* bras gauche posé (côté spectateur : gauche) */
  const restArm = o.rest === false ? '' : o.rest === 'down'
    ? `<path d="M-112,24 C-136,110 -142,200 -136,290" stroke="${hoodD}" stroke-width="50" fill="none" stroke-linecap="round"/>` +
      (o.arm ? '' : `<path d="M112,24 C136,110 142,200 136,290" stroke="${hoodD}" stroke-width="50" fill="none" stroke-linecap="round"/>`)
    : `<path d="M-108,30 C-150,110 -140,168 -64,176" stroke="${hood}" stroke-width="50" fill="none" stroke-linecap="round"/>
     <circle cx="-44" cy="178" r="27" fill="${skin}"/>`;
  /* bras droit levé : tube élastique + main */
  let arm = '';
  if (o.arm) {
    const { hx, hy } = o.arm, bend = o.arm.bend || 0;
    const sx = 104, sy = 18;
    const c1x = sx + 40 + bend, c1y = sy + (hy - sy) * 0.33;
    const c2x = hx - bend * 0.6, c2y = sy + (hy - sy) * 0.72;
    const ang = Math.atan2(hy - c2y, hx - c2x) * 180 / Math.PI + 90;
    arm = `<path d="M${sx},${sy} C${f1(c1x)},${f1(c1y)} ${f1(c2x)},${f1(c2y)} ${f1(hx)},${f1(hy + 34)}" stroke="${hood}" stroke-width="50" fill="none" stroke-linecap="round"/>
      <path d="M${f1(hx - 22)},${f1(hy + 40)} L${f1(hx + 22)},${f1(hy + 40)}" stroke="${hoodD}" stroke-width="16" stroke-linecap="round"/>
      ${hand(hx, hy, ang * 0.25, 1, skin, skinD, o.arm.open == null ? 1 : o.arm.open)}`;
  }
  if (o.headOnly) return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})">${HEADPART()}</g>`;
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})">
    ${o.rest === 'down' ? restArm : ''}
    ${arm}
    <path d="M-122,-8 C-122,-50 -60,-64 0,-64 C60,-64 122,-50 122,-8 L152,310 L-152,310 Z" fill="${hood}"/>
    <path d="M-60,150 L60,150 Q66,150 66,158 L66,214 L-66,214 L-66,158 Q-66,150 -60,150Z" fill="${hoodD}"/>
    <g transform="rotate(${tilt} 0 -40)">
      <rect x="-25" y="-80" width="50" height="44" rx="12" fill="${skinD}"/>
      <path d="M-74,-60 C-62,-14 62,-14 74,-60 C42,-36 -42,-36 -74,-60Z" fill="${hoodD}"/>
      <path d="M-18,-34 L-21,22 M18,-34 L21,22" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
      <circle cx="-21" cy="26" r="6" fill="#fff"/><circle cx="21" cy="26" r="6" fill="#fff"/>
      <circle cx="-90" cy="-140" r="18" fill="${skinD}"/><circle cx="90" cy="-140" r="18" fill="${skinD}"/>
      <ellipse cx="0" cy="-146" rx="90" ry="98" fill="${skin}"/>
      <path d="M-90,-150 C-98,-252 98,-252 90,-150 C72,-188 34,-198 0,-194 C-34,-198 -72,-188 -90,-150Z" fill="${hair}"/>
      ${curls.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="27" fill="${hair}"/>`).join('')}
      <circle cx="-54" cy="-108" r="14" fill="${C.cheek}" opacity=".45"/><circle cx="54" cy="-108" r="14" fill="${C.cheek}" opacity=".45"/>
      ${eye(-31)}${eye(31)}
      ${o.glasses ? `<g fill="none" stroke="${C.ink}" stroke-width="6"><circle cx="-31" cy="-140" r="25"/><circle cx="31" cy="-140" r="25"/><path d="M-6,-142 Q0,-148 6,-142"/></g>` : ''}
      <path d="M-48,${-170 - br * 0.3} L-15,${-172 + br * 0.5}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      <path d="M48,${-170 - br * 0.3} L15,${-172 + br * 0.5}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      <path d="M-7,-118 Q0,-110 7,-118" stroke="${skinD}" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${m}
    </g>
    ${o.rest === 'down' ? '' : restArm}
  </g>`;
  function HEADPART() {
    return `<g transform="rotate(${tilt} 0 -146)">
      <circle cx="-90" cy="-140" r="18" fill="${skinD}"/><circle cx="90" cy="-140" r="18" fill="${skinD}"/>
      <ellipse cx="0" cy="-146" rx="90" ry="98" fill="${skin}"/>
      <path d="M-90,-150 C-98,-252 98,-252 90,-150 C72,-188 34,-198 0,-194 C-34,-198 -72,-188 -90,-150Z" fill="${hair}"/>
      ${(o.bun ? [[0, -262]] : []).map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="44" fill="${hair}"/>`).join('')}
      <circle cx="-54" cy="-108" r="14" fill="${C.cheek}" opacity=".45"/><circle cx="54" cy="-108" r="14" fill="${C.cheek}" opacity=".45"/>
      ${eye(-31)}${eye(31)}
      ${o.glasses ? `<g fill="none" stroke="${C.ink}" stroke-width="6"><circle cx="-31" cy="-140" r="25"/><circle cx="31" cy="-140" r="25"/><path d="M-6,-142 Q0,-148 6,-142"/></g>` : ''}
      <path d="M-48,${-170 - br * 0.3} L-15,${-172 + br * 0.5}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      <path d="M48,${-170 - br * 0.3} L15,${-172 + br * 0.5}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      <path d="M-7,-118 Q0,-110 7,-118" stroke="${skinD}" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${m}
    </g>`;
  }
}
/* main qui agrippe un bord (doigts visibles) */
function grip(x, y, rot, s, skin, skinD) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})">
    ${[0, 1, 2, 3].map((i) => `<rect x="${-6}" y="${-50 + i * 26}" width="54" height="22" rx="11" fill="${skin}"/>`).join('')}
    <rect x="-40" y="-56" width="46" height="110" rx="20" fill="${skin}"/>
    ${[0, 1, 2].map((i) => `<path d="M30,${-30 + i * 26} L44,${-30 + i * 26}" stroke="${skinD}" stroke-width="4" stroke-linecap="round"/>`).join('')}
  </g>`;
}

/* ---------- mobilier ---------- */
function desk(x, y, w, col, colD, top = C.white) {
  return `<g transform="translate(${x},${y})">
    ${stick(`<rect x="${-w / 2}" y="0" width="${w}" height="44" rx="16" fill="${top}"/>`, 0, 12)}
    <rect x="${-w / 2 + 26}" y="44" width="${w - 52}" height="420" rx="10" fill="${col}"/>
    <rect x="${-w / 2 + 26}" y="44" width="${w - 52}" height="22" fill="${colD}"/>
  </g>`;
}
function notebook(x, y, rot = -6) {
  return `<g transform="translate(${x},${y}) rotate(${rot})">
    <rect x="-80" y="-14" width="160" height="30" rx="6" fill="${C.ink}"/>
    <rect x="-78" y="-22" width="156" height="30" rx="5" fill="${C.yellow}"/>
    <path d="M-60,-12 L60,-12 M-60,-2 L40,-2" stroke="${C.yellowD}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}
function chair(x, y, col, colD) {
  return `<g transform="translate(${x},${y})">
    <rect x="-120" y="-250" width="240" height="250" rx="44" fill="${col}"/>
    <rect x="-96" y="-226" width="192" height="40" rx="20" fill="${colD}" opacity=".5"/>
    <rect x="-150" y="-20" width="300" height="50" rx="22" fill="${colD}"/>
  </g>`;
}
function stickyNote(x, y, rot, label = 'ABSENT') {
  return `<g transform="translate(${x},${y}) rotate(${rot})">
    ${stick(`<path d="M-100,-90 L100,-90 L100,62 L66,96 L-100,96 Z" fill="${C.yellow}"/>`, 8, 10)}
    <path d="M66,96 L66,62 L100,62 Z" fill="${C.yellowD}"/>
    <rect x="-30" y="-104" width="60" height="26" rx="4" fill="${C.pinkL}" opacity=".9" transform="rotate(-4)"/>
    <g data-text="${label}"></g>
  </g>`;
}
function tumbleweed(x, y, r, rot = 0, seed = 3) {
  let d = '';
  for (let i = 0; i < 9; i++) {
    const a = seed * 1.7 + i * 0.73, b = a + 2.2 + Math.sin(i * seed) * 0.6;
    d += `M${f1(Math.cos(a) * r)},${f1(Math.sin(a) * r)} Q${f1(Math.cos(a + 1.3) * r * 0.2)},${f1(Math.sin(a + 1.3) * r * 0.2)} ${f1(Math.cos(b) * r)},${f1(Math.sin(b) * r)} `;
  }
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})">
    <circle r="${r}" fill="#E7B76A"/>
    <path d="${d}" stroke="#B9822F" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle r="${r}" fill="none" stroke="#B9822F" stroke-width="6" stroke-dasharray="26 18"/>
  </g>`;
}
function dust(x, y, s = 1, op = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})" fill="#FFFFFF" opacity="${op}">
    <circle cx="0" cy="0" r="22"/><circle cx="26" cy="-8" r="16"/><circle cx="-24" cy="-6" r="14"/></g>`;
}

/* ---------- objets ---------- */
function clock(x, y, r, a1, a2) {
  return `<g transform="translate(${x},${y})">
    ${stick(`<circle r="${r}" fill="${C.white}"/>`, 8, 10)}
    <circle r="${r}" fill="none" stroke="${C.ink}" stroke-width="10"/>
    ${[0, 90, 180, 270].map((a) => `<rect x="-4" y="${-r + 14}" width="8" height="16" rx="4" fill="${C.ink}" transform="rotate(${a})"/>`).join('')}
    <rect x="-5" y="${-r * 0.5}" width="10" height="${r * 0.5}" rx="5" fill="${C.ink}" transform="rotate(${a1})"/>
    <rect x="-4" y="${-r * 0.74}" width="8" height="${r * 0.74}" rx="4" fill="${C.pink}" transform="rotate(${a2})"/>
    <circle r="9" fill="${C.ink}"/>
  </g>`;
}
function leaf(x, y, s, rot, col, colD) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})">
    <path d="M0,-40 C30,-24 30,24 0,40 C-30,24 -30,-24 0,-40Z" fill="${col}"/>
    <path d="M0,-34 L0,46" stroke="${colD}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}
function card(x, y, w, h, tab, rot = 0) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})">
    ${stick(`<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="${C.white}"/>`, 6, 8)}
    <rect x="${-w / 2}" y="${-h / 2}" width="22" height="${h}" rx="11" fill="${tab}"/>
    <rect x="${-w / 2 + 40}" y="${-h / 2 + 22}" width="${w * 0.5}" height="14" rx="7" fill="${C.ink}" opacity=".85"/>
    <rect x="${-w / 2 + 40}" y="${-h / 2 + 48}" width="${w * 0.3}" height="12" rx="6" fill="${C.ink}" opacity=".25"/>
  </g>`;
}
function slot(x, y, w, h) {
  return `<rect x="${f1(x - w / 2)}" y="${f1(y - h / 2)}" width="${w}" height="${h}" rx="18" fill="none" stroke="${C.ink}" stroke-width="5" stroke-dasharray="16 12" opacity=".55"/>`;
}
function plane(x, y, s, rot) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})">
    <path d="M-90,8 L110,-44 L-30,60 Z" fill="${C.ink}" transform="translate(6,8)"/>
    <path d="M-90,8 L110,-44 L-30,60 Z" fill="${C.white}"/>
    <path d="M-30,60 L110,-44 L-6,26 Z" fill="${C.blueL}"/>
    <path d="M-90,8 L110,-44 L-20,22 Z" fill="#EEF4FF"/>
  </g>`;
}
function trail(pts, col, w = 6) {
  return `<path d="${P(pts)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-dasharray="2 22"/>`;
}
function bubble(x, y, w, h, tail = 'bl', col = C.white, sq = 1) {
  const hw = w / 2, hh = h / 2;
  const tl = tail === 'bl' ? `M${-hw * 0.45},${hh - 4} L${-hw * 0.62},${hh + 70} L${-hw * 0.12},${hh - 4}Z`
    : tail === 'br' ? `M${hw * 0.12},${hh - 4} L${hw * 0.62},${hh + 70} L${hw * 0.45},${hh - 4}Z`
      : `M${-hw * 0.2},${hh - 4} L${0},${hh + 70} L${hw * 0.2},${hh - 4}Z`;
  const body = `<g><rect x="${-hw}" y="${-hh}" width="${w}" height="${h}" rx="${Math.min(hh, 70)}" fill="${col}"/><path d="${tl}" fill="${col}"/></g>`;
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(sq)},${f1(2 - sq)})">${stick(body, 10, 12)}</g>`;
}
function muteButton(x, y, r, pressed = 0) {
  const dy = 14 * pressed;
  return `<g transform="translate(${x},${y})">
    <circle cx="10" cy="14" r="${r}" fill="${C.ink}"/>
    <circle cx="${10 * pressed}" cy="${dy}" r="${r}" fill="${C.pink}"/>
    <g transform="translate(${10 * pressed},${dy}) scale(${r / 70})" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-40,-14 L-22,-14 L0,-34 L0,34 L-22,14 L-40,14 Z" fill="#fff"/>
      <path d="M16,-18 L44,18 M44,-18 L16,18"/>
    </g>
  </g>`;
}
function finger(x, y, rot, s, skin = C.skinPair || '#E9B48A', skinD = '#D29672', sleeve = C.blue) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})">
    <rect x="-70" y="-760" width="140" height="520" rx="40" fill="${sleeve}"/>
    <rect x="-78" y="-300" width="156" height="60" rx="26" fill="${C.ink}" opacity=".18"/>
    <rect x="-64" y="-262" width="128" height="170" rx="56" fill="${skin}"/>
    <rect x="-26" y="-150" width="56" height="170" rx="28" fill="${skin}"/>
    <rect x="-14" y="-6" width="34" height="20" rx="10" fill="${skinD}" opacity=".7"/>
    <path d="M-30,-120 Q-6,-112 -2,-90" stroke="${skinD}" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>`;
}
function bang(x, y, s, rot, col = C.ink) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})" fill="${col}">
    <rect x="-11" y="-60" width="22" height="70" rx="11"/><circle cx="0" cy="34" r="12"/></g>`;
}
function raisedHand(x, y, h, sleeve, sleeveD, skinPair, rot = 0, wave = 0) {
  const [sk, skD] = skinPair;
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot + wave)})">
    <rect x="-34" y="0" width="68" height="${h}" rx="30" fill="${sleeve}"/>
    <rect x="-38" y="0" width="76" height="26" rx="13" fill="${sleeveD}"/>
    ${hand(0, -40, 0, 1.05, sk, skD, 1)}
  </g>`;
}
function parachute(x, y, s, sway, colA, colB, skinPair) {
  const [sk] = skinPair;
  const stripes = [colA, colB, colA, colB, colA];
  let canopy = '';
  for (let i = 0; i < 5; i++) {
    const a0 = Math.PI + (i / 5) * Math.PI, a1 = Math.PI + ((i + 1) / 5) * Math.PI;
    canopy += `<path d="M0,0 L${f1(Math.cos(a0) * 170)},${f1(Math.sin(a0) * 120)} A170,120 0 0 1 ${f1(Math.cos(a1) * 170)},${f1(Math.sin(a1) * 120)} Z" fill="${stripes[i]}"/>`;
  }
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(sway)}) scale(${s})">
    <g transform="translate(8,10)"><path d="M-170,0 A170,120 0 0 1 170,0 Q85,26 0,0 Q-85,26 -170,0Z" fill="${C.ink}"/></g>
    <clipPath id="cp${Math.round(x)}${Math.round(y)}"><path d="M-170,0 A170,120 0 0 1 170,0 Q85,26 0,0 Q-85,26 -170,0Z"/></clipPath>
    <g clip-path="url(#cp${Math.round(x)}${Math.round(y)})">${canopy}<rect x="-180" y="-4" width="360" height="40" fill="${colA}"/></g>
    <path d="M-165,4 L-26,196 M-60,16 L-12,196 M60,16 L12,196 M165,4 L26,196" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-34" y="196" width="68" height="96" rx="24" fill="${C.ink2}"/>
    <path d="M-2,200 L0,262" stroke="${C.white}" stroke-width="6"/>
    <circle cx="0" cy="168" r="34" fill="${sk}"/>
    <path d="M-30,156 C-30,124 30,124 30,156 C14,146 -14,146 -30,156Z" fill="${C.ink}"/>
    <circle cx="-11" cy="168" r="4.5" fill="${C.ink}"/><circle cx="11" cy="168" r="4.5" fill="${C.ink}"/>
    <path d="M-9,182 Q0,190 9,182" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="30" y="250" width="58" height="44" rx="8" fill="${C.orange}"/><rect x="48" y="240" width="22" height="14" rx="5" fill="none" stroke="${C.orangeD}" stroke-width="5"/>
  </g>`;
}
function confetti(seed, n, cols, x0, y0, w, h, t = 0) {
  let s = seed, out = '';
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w, y = y0 + r() * h + t * (60 + r() * 80), rot = r() * 360 + t * 200 * (r() - 0.5);
    const c = cols[Math.floor(r() * cols.length)], k = r();
    out += k < 0.4 ? `<rect x="${f1(x)}" y="${f1(y)}" width="22" height="12" rx="3" fill="${c}" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"/>`
      : k < 0.7 ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="${c}"/>`
        : star4(x, y, 16, c, rot);
  }
  return out;
}

/* ---------- logo Tech&Dev (vectorisé depuis assets/td/mark.png) ---------- */
function logoPaths(outline, s) {
  const path = (shapes) => shapes.map((sh) => P(sh.pts.map(([x, y]) => [x * s, y * s])) + 'Z').join(' ');
  return { T: path(outline.T), D: path(outline.D), w: outline.w * s, h: outline.h * s };
}
function logo(outline, x, y, w) {
  const s = w / outline.w, L = logoPaths(outline, s);
  return `<g transform="translate(${f1(x - L.w / 2)},${f1(y - L.h / 2)})">
    <defs>
      <linearGradient id="lgT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F6FA"/><stop offset=".55" stop-color="#C9CFDA"/><stop offset="1" stop-color="#9AA3B4"/></linearGradient>
      <linearGradient id="lgD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FD6FF"/><stop offset=".5" stop-color="#2E8CFF"/><stop offset="1" stop-color="#1F63F0"/></linearGradient>
    </defs>
    <path d="${L.T}" fill="${C.ink}" fill-rule="evenodd" transform="translate(8,10)"/>
    <path d="${L.D}" fill="${C.ink}" fill-rule="evenodd" transform="translate(8,10)"/>
    <path d="${L.T}" fill="url(#lgT)" fill-rule="evenodd"/>
    <path d="${L.D}" fill="url(#lgD)" fill-rule="evenodd"/>
  </g>`;
}

if (typeof module !== 'undefined') module.exports = { C, SKINS, f1, P, stick, star4, dots, squiggle, highlighter, hand, kid, desk, notebook, chair, stickyNote, tumbleweed, dust, clock, leaf, card, slot, plane, trail, bubble, muteButton, finger, bang, raisedHand, parachute, confetti, logo, grip };
