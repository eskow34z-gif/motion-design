#!/usr/bin/env python3
"""Bande son TD04 « SIGNATURE » — Tech&Dev, 25,5 s, stéréo 48 kHz, synthétisée de zéro, aucune voix.

Tech / électronique / cinématique, 120 BPM, la mineur. L'énergie monte par paliers :
drone → pulsation → groove des services → montée de l'accélération → impact → silence de marque → CTA.
Chaque événement visuel de engine/theme-td04.html a son son, aux mêmes temps.
Usage : python3 engine/audio_theme_td04.py sortie.wav
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 25.5
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
VL = np.zeros(N)   # envoi réverbération
VR = np.zeros(N)
rng = np.random.default_rng(7)

B = 0.5                      # 120 BPM
S0, SD = 7.0, 1.5
def S(i): return S0 + SD * i
ACC, CONV, IMPL, BRAND, CTA = 16.0, 17.55, 18.35, 20.0, 23.0


# ------------------------------------------------------------------ outils
def tt(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))
def sos(kind, f, order=2):
    if kind == 'bp':
        return signal.butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'bandpass', output='sos')
    return signal.butter(order, f / (SR / 2), kind, output='sos')
def lp(x, f, o=2): return signal.sosfilt(sos('low', f, o), x)
def hp(x, f, o=2): return signal.sosfilt(sos('high', f, o), x)
def bp(x, a, b, o=2): return signal.sosfilt(sos('bp', (a, b), o), x)
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, t, g=1.0, pan=0.0, rev=0.0):
    i = int(round(t * SR))
    if i >= N or len(sig) == 0:
        return
    if i < 0:
        sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    s = sig[:n] * g
    a = (pan + 1) * np.pi / 4
    gl, gr = np.cos(a), np.sin(a)
    L[i:i + n] += s * gl; R[i:i + n] += s * gr
    if rev:
        VL[i:i + n] += s * gl * rev; VR[i:i + n] += s * gr * rev


def place_st(sl, sr, t, g=1.0, rev=0.0):
    i = int(round(t * SR)); n = min(len(sl), N - i)
    if n <= 0:
        return
    L[i:i + n] += sl[:n] * g; R[i:i + n] += sr[:n] * g
    if rev:
        VL[i:i + n] += sl[:n] * g * rev; VR[i:i + n] += sr[:n] * g * rev


def env_ar(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


def sweep_noise(d, f0, f1, width=0.35, curve=1.0, seed=None):
    """Bruit filtré dont la bande se déplace de f0 à f1 (STFT) — whooshes, montées, balayages."""
    x = noise(d)
    f, tf, Z = signal.stft(x, SR, nperseg=1024)
    p = np.clip(tf / d, 0, 1) ** curve
    fc = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * p)
    lf = np.log(np.maximum(f, 1.0))[:, None]
    w = np.exp(-((lf - np.log(fc)[None, :]) ** 2) / (2 * width ** 2))
    _, y = signal.istft(Z * w, SR, nperseg=1024)
    y = y[:len(x)]
    return y / (np.max(np.abs(y)) + 1e-9)


# ------------------------------------------------------------------ sons
def kick(punch=1.0, d=0.55):
    t = tt(d)
    f = 44 + 120 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    cl = hp(noise(0.012), 2500) * np.exp(-tt(0.012) / 0.002)
    body[:len(cl)] += cl * 0.25
    return np.tanh(body * 2.0 * punch) * 0.85


def hat(d=0.05, soft=1.0):
    return hp(noise(d), 8000, 4) * np.exp(-tt(d) / (0.010 * soft))


def click(f=3200, d=0.025):
    x = bp(noise(d), f * 0.6, min(f * 1.6, 20000)) * np.exp(-tt(d) / 0.0035)
    b = np.sin(2 * np.pi * (f / 4) * tt(d)) * np.exp(-tt(d) / 0.006) * 0.4
    return (x + b)


def blip(f, d=0.09, tau=0.025):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * np.exp(-t / tau) * np.minimum(1, t / 0.002)


def pluck(f, d=0.6, tau=0.16, bright=2500):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 for k in range(1, 7))
    return lp(x * np.exp(-t / tau) * np.minimum(1, t / 0.003), bright)


def chime(f, d=1.6, tau=0.55):
    t = tt(d)
    parts = [(1.0, 1.0, 1.0), (2.0, 0.45, 0.6), (3.01, 0.22, 0.4), (4.2, 0.12, 0.25)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (tau * td)) for r, a, td in parts) * np.minimum(1, t / 0.002)


def metal(f0=420, d=2.2, tau=0.9, bright=1.0):
    """Impact métallique : partiels inharmoniques + grain d'attaque."""
    t = tt(d)
    ratios = [1.0, 2.76, 5.40, 8.93, 13.34, 17.0]
    amps = [1.0, 0.7, 0.45, 0.3, 0.18 * bright, 0.1 * bright]
    taus = [1.0, 0.75, 0.5, 0.35, 0.22, 0.15]
    x = np.zeros(len(t))
    for r, a, td in zip(ratios, amps, taus):
        det = 1 + rng.uniform(-0.004, 0.004)
        x += a * np.sin(2 * np.pi * f0 * r * det * t + rng.uniform(0, 6.28)) * np.exp(-t / (tau * td))
    att = bp(noise(0.03), 2500, 9000) * np.exp(-tt(0.03) / 0.006)
    x[:len(att)] += att * 0.8
    return x * np.minimum(1, t / 0.001)


def boom(f0=58, f1=31, d=2.4, tau=0.7):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau)
    hit = lp(noise(0.12), 900) * np.exp(-tt(0.12) / 0.03)
    x[:len(hit)] += hit * 0.5
    return np.tanh(x * 2.4) * 0.8


def whoosh(d, f0=300, f1=3500, peak=0.7, curve=1.0):
    x = sweep_noise(d, f0, f1, 0.45, curve)
    t = np.linspace(0, 1, len(x))
    e = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) / (1 - peak) * 4))
    return x * e


def scan(d, f0, f1, am=34):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * am * t))
    x += 0.35 * sweep_noise(d, f0 * 1.5, f1 * 1.5, 0.25)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.8
    return x * e


def glitch(d=0.12, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros(int(SR * d)); i = 0
    while i < len(out):
        n = int(SR * r.uniform(0.006, 0.02))
        f = r.choice([900, 1400, 2200, 3100, 4600])
        g = np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * 0.4 + r.standard_normal(n) * 0.2
        g = np.round(g * 6) / 6                 # bitcrush
        out[i:i + n] += g[:len(out) - i] * r.uniform(0.3, 1.0)
        i += n + int(SR * r.uniform(0.0, 0.01))
    return hp(out, 600) * np.exp(-tt(d) / (d * 0.6))


def saw(f, d, n=10):
    t = tt(d)
    return sum(np.sin(2 * np.pi * f * k * t + k) / k for k in range(1, n + 1))


def pad_chord(freqs, d, cutoff=900, det=0.004):
    t = tt(d)
    yl = np.zeros(len(t)); yr = np.zeros(len(t))
    for f in freqs:
        for k, dt in enumerate((-det, 0, det)):
            v = sum(np.sin(2 * np.pi * f * (1 + dt) * h * t + h * k) / h ** 1.6 for h in range(1, 6))
            pan = (k - 1) * 0.6
            yl += v * np.cos((pan + 1) * np.pi / 4); yr += v * np.sin((pan + 1) * np.pi / 4)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.17 * t)
    return lp(yl, cutoff) * lfo, lp(yr, cutoff) * lfo


# ================================================================== PARTITION
A = {'A1': 55.0, 'E2': midi(40), 'A2': 110.0, 'C3': midi(48), 'E3': midi(52), 'G3': midi(55), 'A3': 220.0, 'B3': midi(59),
     'C4': midi(60), 'D4': midi(62), 'E4': midi(64), 'F3': midi(53), 'F2': midi(41), 'G2': midi(43), 'D3': midi(50), 'C2': midi(36)}

# ---------- 1. Nappes harmoniques (avec fondus enchaînés)
PADS = [
    (0.0, 3.2, [A['A1'], A['E2'], A['A2']], 520, [0, 0.9, 1.0, 0.0]),
    (3.0, 7.2, [A['A2'], A['E3'], A['B3'], A['C4']], 760, [0, 0.5, 0.75, 0]),
    (7.0, 8.6, [A['A2'], A['C3'], A['E3'], A['G3']], 900, [0, 0.8, 0.8, 0]),
    (8.5, 10.1, [A['F2'], A['C3'], A['E3'], A['A3']], 900, [0, 0.8, 0.8, 0]),
    (10.0, 11.6, [A['C2'], A['G3'], A['C4'], A['E4'] / 2], 900, [0, 0.8, 0.8, 0]),
    (11.5, 13.1, [A['G2'], A['D3'], A['G3'], A['B3']], 900, [0, 0.8, 0.8, 0]),
    (13.0, 14.6, [A['A2'], A['C3'], A['E3'], A['G3']], 950, [0, 0.8, 0.8, 0]),
    (14.5, 16.1, [A['E2'], A['B3'] / 2, A['E3'], A['G3']], 950, [0, 0.8, 0.85, 0]),
    (16.0, 18.4, [A['A2'], A['E3'], A['A3'], A['C4']], 1300, [0, 0.7, 1.0, 0]),
    (18.35, 20.3, [A['F2'], A['C3'], A['E3'], A['A3']], 1100, [0, 1.0, 0.8, 0]),
    (19.9, 23.2, [A['A2'], A['E3'], A['G3'], A['B3'], A['C4']], 700, [0, 0.85, 0.75, 0]),
    (22.95, 25.5, [A['C3'], A['E3'], A['G3'], A['B3']], 800, [0, 0.8, 0.6, 0]),
]
for t0, t1, fr, cut, e in PADS:
    d = t1 - t0
    pl, pr = pad_chord(fr, d, cut)
    tl = np.linspace(0, d, len(pl))
    ev = np.interp(tl, [0, min(0.35, d * 0.25), d - min(0.35, d * 0.25), d], e)
    place_st(pl * ev, pr * ev, t0, 0.055, rev=0.5)

# souffle d'air continu (texture)
air = lp(hp(noise(DUR), 2500), 9000)
air *= np.interp(np.arange(N) / SR, [0, 1.0, 19.9, 20.1, 23.0, 25.5], [0, 0.008, 0.010, 0.004, 0.006, 0])
L += air; R += np.roll(air, 300)

# ---------- 2. Ouverture 0–3 s
_sw = tt(3.0)
place(np.sin(2 * np.pi * 41.2 * _sw) * np.sin(np.pi * np.clip(_sw / 3.0, 0, 1)) ** 1.5 * (1 + 0.3 * np.sin(2 * np.pi * 82.4 * _sw)), 0.0, 0.16)  # sub très léger, qui monte
place(sweep_noise(0.9, 200, 900, 0.5) * np.sin(np.linspace(0, np.pi, int(SR * 0.9))), 0.0, 0.05, 0, 0.6)   # reflet bleu
# ligne lumineuse : balayage panoramique gauche → droite
ln = scan(1.43, 2400, 5200, 48)
half = len(ln) // 2
pans = np.linspace(-0.9, 0.9, len(ln))
place_st(ln * np.cos((pans + 1) * np.pi / 4), ln * np.sin((pans + 1) * np.pi / 4), 0.12, 0.05, rev=0.4)
place(whoosh(0.75, 120, 1800, 0.92, 1.2), 0.52, 0.24, 0, 0.5)              # whoosh profond
place(scan(0.7, 3400, 1300, 30), 0.55, 0.035, 0.1, 0.3)                     # scan du logo
place(metal(392, 2.4, 1.0, 0.8), 1.25, 0.16, 0, 0.6)                        # petit impact métallique
place(boom(70, 36, 1.2, 0.35), 1.25, 0.30)
for tw, gg in [(1.50, 0.5), (1.625, 0.5), (2.00, 0.6), (2.50, 0.75)]:      # mots
    place(click(3000), tw, 0.20 * gg / 0.5, 0, 0.2)
    place(kick(0.6, 0.3), tw, 0.10 * gg / 0.5)
place(pluck(A['E4'], 0.9, 0.25), 2.50, 0.06, 0.2, 0.5)
# plongée dans le logo
place(whoosh(0.48, 250, 5200, 0.88, 1.3), 2.82, 0.30, 0, 0.3)
place(boom(64, 30, 1.6, 0.45), 3.27, 0.42)
place(metal(196, 1.6, 0.6, 0.5), 3.27, 0.07, 0, 0.5)

# ---------- 3. Positionnement 3–7 s
for tc, f in [(3.10, 2600), (3.22, 2900), (3.30, 3300), (3.62, 4200), (3.67, 4200), (3.72, 4200), (3.77, 4200),
              (3.75, 5200), (3.81, 5200), (3.87, 5200), (3.93, 5200)]:
    place(click(f, 0.02), tc, 0.07, rng.uniform(-0.6, 0.6), 0.3)
for k, tn in enumerate([3.90, 3.95, 4.00, 4.05]):
    place(blip(midi(81 + [0, 3, 7, 10][k]), 0.12, 0.03), tn, 0.03, [-0.6, 0.6, -0.4, 0.4][k], 0.5)
place(sweep_noise(0.8, 5000, 1200, 0.3) * np.linspace(0, 1, int(SR * 0.8)) ** 2, 3.15, 0.06, 0, 0.5)  # lettres qui se resserrent
place(metal(523, 1.6, 0.6, 0.6), 3.95, 0.07, 0, 0.6)
for t0, d, p0, p1 in [(4.35, 1.2, -0.8, 0.8), (4.75, 1.2, 0.8, -0.8), (5.15, 1.1, -0.7, -0.7), (5.35, 1.1, 0.7, 0.7)]:
    z = scan(d, 1800, 4200, 60)
    pans = np.linspace(p0, p1, len(z))
    place_st(z * np.cos((pans + 1) * np.pi / 4), z * np.sin((pans + 1) * np.pi / 4), t0, 0.022, rev=0.3)
for tl_, f in [(4.30, A['A2']), (4.50, A['C3']), (4.75, A['E3']), (5.00, A['G3'])]:
    place(click(2600), tl_, 0.12, 0, 0.2)
    place(pluck(f, 0.7, 0.18, 1400), tl_, 0.09, 0, 0.3)
place(chime(midi(88), 1.8, 0.6), 5.45, 0.05, 0.25, 0.7)                      # PROS
place(sweep_noise(0.45, 2000, 7000, 0.3) * np.sin(np.linspace(0, np.pi, int(SR * 0.45))), 5.45, 0.04, 0.2, 0.4)
# pulsation discrète
for n in range(6, 14):
    t = n * B
    place(kick(0.55, 0.4), t, (0.16 if n % 2 == 0 else 0.10) * (1 + 0.5 * (t > 5.0)))
    if t >= 5.0:
        place(hat(0.04, 0.7), t + 0.25, 0.035, 0.3)
place(whoosh(0.5, 400, 3000, 0.9, 1.4), 6.52, 0.16, 0, 0.3)                 # morphing vers le navigateur

# ---------- 4. Services 7–16 s
ROOTS = [55.0, midi(41), midi(36), midi(43), 55.0, midi(40)]
for i in range(6):
    t0 = S(i)
    place(whoosh(0.32, 500, 4200, 0.85, 1.3), t0 - 0.28, 0.13, [-0.3, 0.3][i % 2], 0.3)
    place(boom(72, 40, 0.9, 0.22), t0, 0.30)
    place(metal(330 + 40 * i, 1.2, 0.45, 0.6), t0, 0.05, 0, 0.5)
    place(pluck(midi([69, 72, 76, 74, 79, 81][i]), 0.9, 0.22), t0 + 0.04, 0.07, 0.15, 0.6)
    # basse en croches, accent sur les temps
    for k in range(6):
        tb = t0 + k * 0.25
        f = ROOTS[i] * (2 if k % 3 == 2 else 1)
        bs = lp(sum(np.sin(2 * np.pi * f * h * tt(0.24)) / h ** 1.5 for h in (1, 2, 3)), 420) * env_ar(int(SR * 0.24), 0.004, 0.09)
        place(bs, tb, 0.20 if k % 2 == 0 else 0.13)
for n in range(14, 32):                                            # kick sur les temps
    place(kick(0.9 if n % 2 == 0 else 0.75), n * B, 0.34)
for n in range(28, 64):                                            # charleston en croches
    t = n * 0.25
    if t >= ACC:
        break
    place(hat(0.05, 1.0 if n % 2 else 0.6), t, 0.075 if n % 2 else 0.04, 0.35 if n % 4 < 2 else -0.35)

# S1 SITES WEB
for k in range(5): place(click(4400, 0.02), 7.14 + k * 0.065, 0.05, -0.4 + 0.2 * k, 0.2)
for k in range(4): place(blip(midi(76 + 2 * k), 0.08, 0.02), 7.42 + k * 0.05, 0.022, 0.3, 0.4)
place(click(2400, 0.03), 7.68, 0.16, -0.2, 0.2); place(blip(midi(84), 0.15, 0.04), 7.69, 0.05, -0.2, 0.5)  # bouton
for k in range(6): place(click(5200, 0.015), 7.76 + k * 0.045, 0.035, rng.uniform(-0.5, 0.5), 0.2)
place(whoosh(0.4, 300, 6000, 0.9, 1.6), 8.12, 0.22, 0, 0.3)                 # zoom dans l'interface
# S2 INFORMATIQUE & SUPPORT
for k in range(8): place(blip(rng.choice([1760, 2093, 2349, 2637]), 0.05, 0.012), 8.6 + k * 0.035, 0.025, rng.uniform(-0.7, 0.7), 0.3)
place(scan(0.43, 900, 2600, 52), 8.95, 0.05, 0, 0.3)                         # balayage maintenance
place(glitch(0.08, 3), 9.2, 0.03, 0.5)
place(chime(midi(84), 1.4, 0.4), 9.45, 0.06, 0.4, 0.6); place(chime(midi(88), 1.4, 0.4), 9.53, 0.05, 0.4, 0.6)
place(click(3000), 9.45, 0.12, 0.4, 0.2)
# S3 RÉSEAUX
for k in range(12):
    tn = 10.33 + k * 0.05
    place(blip(midi([69, 72, 76, 79, 81, 84][k % 6] + 12 * (k // 6)), 0.09, 0.02), tn, 0.03, np.sin(k * 1.7) * 0.7, 0.5)
place(sweep_noise(1.0, 3000, 8000, 0.3) * np.sin(np.linspace(0, np.pi, int(SR * 1.0))), 10.4, 0.025, 0, 0.6)
# S4 AUTOMATISATION & IA
place(click(2600), 11.88, 0.14, 0, 0.2)
place(whoosh(0.2, 800, 3500, 0.9), 11.94, 0.08, 0, 0.2)
burble = np.concatenate([blip(rng.choice([1047, 1319, 1568, 2093, 2637]), 0.03, 0.008) for _ in range(9)])
place(burble, 12.12, 0.035, 0, 0.4)
for k, p in enumerate([-0.6, 0, 0.6]):
    place(blip(midi(81 + [0, 4, 7][k]), 0.12, 0.03), 12.30 + k * 0.03, 0.035, p, 0.4)
    place(click(4000, 0.02), 12.50 + k * 0.03, 0.08, p, 0.2)
for k in range(3): place(blip(midi(88 + [0, 4, 7][k]), 0.06, 0.015), 12.64 + k * 0.03, 0.025, [-0.6, 0, 0.6][k], 0.4)
# S5 DESIGN GRAPHIQUE
place(sweep_noise(0.4, 1500, 5000, 0.35) * np.sin(np.linspace(0, np.pi, int(SR * 0.4))), 13.0, 0.04, -0.3, 0.4)
for k in range(6): place(blip(midi([72, 74, 76, 79, 81, 84][k]), 0.1, 0.025), 13.36 + k * 0.035, 0.035, -0.6 + 0.24 * k, 0.5)
place(whoosh(0.3, 600, 3000, 0.7), 13.6, 0.08, 0, 0.3)
place(whoosh(0.35, 300, 2000, 0.85), 13.98, 0.07, 0, 0.2); place(click(3600), 14.30, 0.12, 0, 0.2)
# S6 CYBERSÉCURITÉ
for k in range(9): place(click(3800 + 300 * (k % 3), 0.015), 14.52 + k * 0.022, 0.05, (k % 3 - 1) * 0.5, 0.2)
place(scan(0.48, 500, 1500, 20), 14.7, 0.05, 0, 0.4)                         # tracé du bouclier
clack = click(1800, 0.04) * 1.2; clack2 = click(3500, 0.03)
place(clack, 15.29, 0.24, 0, 0.3); place(clack2, 15.31, 0.12, 0, 0.3)       # cadenas
place(metal(262, 2.6, 1.0, 0.9), 15.32, 0.15, 0, 0.7)                         # PROTÉGER.
place(boom(80, 34, 1.4, 0.4), 15.32, 0.4)
place(glitch(0.1, 9), 15.88, 0.06, 0)
place(whoosh(0.18, 600, 6000, 0.95, 1.5), 15.84, 0.12, 0, 0.2)

# ---------- 5. Accélération 16–18,35 s
place(boom(66, 34, 1.0, 0.3), ACC, 0.36)
rl = 2.3
ris = sweep_noise(rl, 200, 7500, 0.5, 1.4) * np.linspace(0, 1, int(SR * rl)) ** 2.4
place(ris, ACC, 0.16, 0, 0.4)
tr = tt(rl); f = 110 * 2 ** (tr / rl)                                      # glissando
sw = lp(sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 8)), 1800) * (tr / rl) ** 2
place(sw, ACC, 0.05, 0, 0.3)
for k, tf in enumerate([16.00, 16.34, 16.64, 16.90, 17.10, 17.26, 17.38]):  # fragments
    place(glitch(0.07, 20 + k), tf, 0.05, [-0.5, 0.5, -0.5, 0.5, 0, 0.3, 0][k], 0.2)
    place(whoosh(0.22, 700, 4000, 0.4), tf, 0.06, [-0.5, 0.5, -0.5, 0.5, 0, 0.3, 0][k], 0.2)
beats, tb, step = [], ACC, 0.5
while tb < IMPL - 0.12:
    beats.append(tb); tb += step; step = max(0.125, step * 0.86)
for k, tb in enumerate(beats):
    place(kick(0.8 + 0.2 * k / len(beats), 0.35), tb, 0.30 + 0.1 * k / len(beats))
for n in range(64, 94):
    t = n * 0.125 + 0.0
    if t >= IMPL - 0.1:
        break
    place(hat(0.035, 0.7), t, 0.03 + 0.03 * (t - ACC) / 2.3, 0.3 if n % 2 else -0.3)
suck = whoosh(0.8, 5000, 200, 0.97, 0.8)                                    # aspiration vers le centre
place(suck, IMPL - 0.8, 0.22, 0, 0.3)

# ---------- 6. Impact + logo
place(boom(62, 26, 3.0, 0.95), IMPL, 0.62)
place(metal(220, 3.2, 1.6, 1.0), IMPL, 0.20, 0, 0.9)
place(metal(587, 2.4, 1.1, 0.7), IMPL + 0.01, 0.07, 0.3, 0.9)
place(lp(noise(0.5), 3000) * np.exp(-tt(0.5) / 0.08), IMPL, 0.16, 0, 0.6)
place(sweep_noise(1.2, 6000, 2500, 0.35) * np.exp(-tt(1.2) / 0.4), IMPL + 0.05, 0.05, 0, 0.8)  # scintillement
for n in range(0, 3):
    place(kick(0.6, 0.4), 18.85 + n * 0.5, 0.12)
for tw in (18.78, 19.06):
    place(click(2800), tw, 0.12, 0, 0.3); place(pluck(A['E3'] * 2, 0.6, 0.15, 1800), tw, 0.04, 0, 0.4)
place(whoosh(0.35, 3000, 400, 0.15), 19.72, 0.06, 0, 0.3)

# ---------- 7. Image de marque 20–23 s : ralentissement soudain
place(boom(46, 30, 2.5, 1.0), BRAND, 0.22)
place(chime(midi(81), 2.4, 0.9), 20.5, 0.04, -0.2, 0.9)
place(chime(midi(88), 2.4, 0.9), 20.62, 0.03, 0.2, 0.9)
for k in range(4):
    place(blip(midi([76, 79, 81, 84][k]), 0.14, 0.04), 21.2 + k * 0.13, 0.022, -0.45 + 0.3 * k, 0.7)
place(sweep_noise(0.6, 800, 6000, 0.35, 1.5) * np.linspace(0, 1, int(SR * 0.6)) ** 2, 22.42, 0.07, 0, 0.4)

# ---------- 8. Appel à l'action
place(click(3200, 0.03), CTA, 0.18, 0, 0.3); place(boom(74, 40, 0.9, 0.25), CTA, 0.3)
place(click(2600), 23.06, 0.13, 0, 0.3); place(pluck(A['C4'], 0.8, 0.2), 23.06, 0.06, -0.1, 0.4)
place(metal(440, 2.0, 0.8, 0.7), 23.38, 0.09, 0.1, 0.8); place(chime(midi(88), 1.8, 0.6), 23.38, 0.05, 0.1, 0.8)
place(boom(66, 36, 1.0, 0.3), 23.38, 0.28)
place(sweep_noise(0.38, 1500, 6000, 0.3) * np.sin(np.linspace(0, np.pi, int(SR * 0.38))), 23.72, 0.035, 0, 0.4)
place(click(4200, 0.02), 23.84, 0.08, -0.2, 0.3); place(click(4600, 0.02), 23.98, 0.07, 0.2, 0.3)
for n in range(47, 50):
    place(kick(0.6, 0.4), n * B, 0.12)
place(metal(330, 3.0, 1.3, 0.8), 24.58, 0.12, 0, 0.9)                        # dernier impact, très léger
place(chime(midi(81), 2.8, 1.0), 24.58, 0.045, -0.15, 1.0); place(chime(midi(88), 2.8, 1.0), 24.62, 0.03, 0.15, 1.0)
place(boom(54, 30, 1.6, 0.6), 24.58, 0.26)

# ================================================================== MIXAGE
# compression latérale (sidechain) des nappes sous le kick : appliquée globalement aux graves lents
# réverbération : IR stéréo synthétique, 2,6 s
ir_n = int(SR * 2.6)
irt = np.arange(ir_n) / SR
irL = lp(rng.standard_normal(ir_n), 6500) * np.exp(-irt / 0.62)
irR = lp(rng.standard_normal(ir_n), 6500) * np.exp(-irt / 0.62)
irL[:int(0.012 * SR)] = 0; irR[:int(0.017 * SR)] = 0
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
wetL = signal.fftconvolve(VL, irL)[:N]; wetR = signal.fftconvolve(VR, irR)[:N]
outL = L + 0.42 * hp(wetL, 180); outR = R + 0.42 * hp(wetR, 180)

# égalisation pour les haut-parleurs de téléphone (phase linéaire) : moins de sub, plus de présence
eq = signal.firwin2(4097, [0, 40, 80, 150, 600, 1500, 3000, 6000, 12000, SR / 2],
                    [0.45, 0.5, 0.72, 1.0, 1.0, 1.25, 1.7, 1.8, 1.6, 1.0], fs=SR)
outL = signal.fftconvolve(outL, eq)[2048:2048 + N]; outR = signal.fftconvolve(outR, eq)[2048:2048 + N]

# fondu final + sécurité en tête
tfull = np.arange(N) / SR
fade = np.interp(tfull, [0, 0.01, 25.0, 25.5], [0, 1, 1, 0])
outL *= fade; outR *= fade
outL = hp(outL, 22, 2); outR = hp(outR, 22, 2)

# saturation douce + normalisation crête −1 dBFS
def soft(x, drive=1.15):
    return np.tanh(x * drive) / np.tanh(drive)
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
outL /= peak; outR /= peak
outL = soft(outL * 0.98); outR = soft(outR * 0.98)
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
target = 10 ** (-1 / 20)
outL *= target / peak; outR *= target / peak

rms = 20 * np.log10(np.sqrt(np.mean((outL ** 2 + outR ** 2) / 2)) + 1e-12)
pk = 20 * np.log10(max(np.max(np.abs(outL)), np.max(np.abs(outR))))
print(f'crête {pk:.2f} dBFS, RMS {rms:.1f} dBFS')
out = sys.argv[1] if len(sys.argv) > 1 else 'theme_td04.wav'
wavfile.write(out, SR, (np.stack([outL, outR], 1) * 32767).astype(np.int16))
print('écrit :', out)
