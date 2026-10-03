/* Flux Master Motion System V1.0 — bibliothèque de mouvement
   Tout est fonction pure du temps t : le rendu est déterministe (seek image par image). */

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));

/* Courbes (tokens/motion-tokens.json) */
const E = {};
function initEases() {
  gsap.registerPlugin(CustomEase);
  E.enter = CustomEase.create('fm_enter', '0.16,1,0.3,1');
  E.exit = CustomEase.create('fm_exit', '0.55,0,1,0.45');
  E.cam = CustomEase.create('fm_cam', '0.65,0,0.35,1');
  E.whip = CustomEase.create('fm_whip', '0.83,0,0.17,1');
  E.lin = (p) => p;
}

/* Springs [k, c, masse]. reward : masse 0.6 pour un overshoot ~12-14 % */
const SPR = { snap: [420, 30, 1], soft: [180, 20, 1], reward: [380, 16, 0.6] };
function spring(name, t) {
  if (t <= 0) return 0;
  const [k, c, m] = SPR[name];
  const w0 = Math.sqrt(k / m);
  const z = c / (2 * Math.sqrt(k * m));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

/* Caméra look-at : keyframes {t,cx,cy,z,rx,ry,e} ; e = courbe d'arrivée du segment */
function camAt(KF, t) {
  let i = 0;
  while (i < KF.length - 2 && t >= KF[i + 1].t) i++;
  const a = KF[i], b = KF[i + 1];
  const p = E[b.e || 'lin'](prog(t, a.t, b.t));
  return {
    cx: lerp(a.cx, b.cx, p),
    cy: lerp(a.cy, b.cy, p),
    z: a.z * Math.pow(b.z / a.z, p),
    rx: lerp(a.rx, b.rx, p),
    ry: lerp(a.ry, b.ry, p),
  };
}

function hex2rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(a, b, p) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], p))},${Math.round(lerp(A[1], B[1], p))},${Math.round(lerp(A[2], B[2], p))})`;
}

/* Fond : route en perspective + traînées lumineuses (motif propriétaire) */
function makeBG(canvas) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const streaks = Array.from({ length: 22 }, () => ({
    lane: lerp(-1.5, 1.5, rnd()), speed: 0.18 + rnd() * 0.5, phase: rnd(),
    red: rnd() < 0.28, len: 0.1 + rnd() * 0.16,
  }));
  const vx = W / 2, vy = 700;
  const pos = (lane, q) => {
    const y = vy + (H - vy) * Math.pow(q, 2.2);
    return [vx + lane * (y - vy) * 0.9, y];
  };
  return function draw(t, glow) {
    g.fillStyle = '#04070c';
    g.fillRect(0, 0, W, H);
    let rg = g.createRadialGradient(vx, 820, 40, vx, 820, 1150);
    rg.addColorStop(0, 'rgba(20,36,58,.95)');
    rg.addColorStop(1, 'rgba(4,7,12,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    rg = g.createRadialGradient(vx, vy, 10, vx, vy, 520);
    rg.addColorStop(0, `rgba(0,201,107,${0.10 + 0.22 * glow})`);
    rg.addColorStop(1, 'rgba(0,201,107,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    // bords de route + lignes de voie
    g.lineWidth = 1.5;
    for (const lane of [-1.5, -0.75, 0, 0.75, 1.5]) {
      const a = pos(lane, 0.001), b = pos(lane, 1);
      const gr = g.createLinearGradient(0, vy, 0, H);
      gr.addColorStop(0, 'rgba(120,170,210,0)');
      gr.addColorStop(1, `rgba(120,170,210,${lane === 0 ? 0.05 : 0.14})`);
      g.strokeStyle = gr;
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    // tirets centraux qui défilent
    for (let k = 0; k < 16; k++) {
      const q = ((t * 0.35 + k / 16) % 1);
      const q2 = Math.min(1, q + 0.035);
      for (const lane of [-0.375, 0.375]) {
        const a = pos(lane, q), b = pos(lane, q2);
        g.strokeStyle = `rgba(160,200,230,${0.05 + 0.25 * q})`;
        g.lineWidth = 1 + 5 * q;
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      }
    }
    // traînées (sillage)
    for (const st of streaks) {
      const q = (t * st.speed * (0.6 + 0.8 * glow) + st.phase) % 1;
      const q0 = Math.max(0.001, q - st.len);
      const a = pos(st.lane, q0), b = pos(st.lane, q);
      const col = st.red ? '255,59,78' : '0,201,107';
      const al = (0.08 + 0.75 * glow) * (0.2 + 0.8 * q);
      const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
      gr.addColorStop(0, `rgba(${col},0)`);
      gr.addColorStop(1, `rgba(${col},${al})`);
      g.strokeStyle = gr;
      g.lineWidth = 1 + 6 * q;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
  };
}
