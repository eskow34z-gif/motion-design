#!/usr/bin/env python3
"""Bande son TD05 « SIGNATURE V2 » — Tech&Dev, 25,5 s, stéréo 48 kHz, synthétisée de zéro, aucune voix.

Cinématique qui monte : départ feutré (drone, silhouettes), pulsation, groove des services,
tension, DROP à l'accélération (16 s), climax à l'implosion (18,35 s), silence de marque, CTA.
Tous les temps sont ceux de engine/theme-td05.html. Usage : python3 engine/audio_theme_td05.py sortie.wav
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 25.5
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
VL = np.zeros(N); VR = np.zeros(N)          # envoi réverbération
DK = np.zeros(N)                             # enveloppe du kick (compression latérale)
rng = np.random.default_rng(11)

B = 0.5
S0, SD = 7.0, 1.5
def S(i): return S0 + SD * i
ACC, CONV, IMPL, LOGO2, BRAND, CTA = 16.0, 17.55, 18.35, 18.40, 20.0, 23.0


# ------------------------------------------------------------------ outils
def tt(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))
def sos(kind, f, order=2):
    if kind == 'bp':
        return signal.butter(order, [f[0] / (SR / 2), min(f[1], SR / 2 - 100) / (SR / 2)], 'bandpass', output='sos')
    return signal.butter(order, min(f, SR / 2 - 100) / (SR / 2), kind, output='sos')
def lp(x, f, o=2): return signal.sosfilt(sos('low', f, o), x)
def hp(x, f, o=2): return signal.sosfilt(sos('high', f, o), x)
def bp(x, a, b, o=2): return signal.sosfilt(sos('bp', (a, b), o), x)
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, t, g=1.0, pan=0.0, rev=0.0, duck=True):
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


def pan_sweep(sig, p0, p1, t, g, rev=0.0):
    pans = np.linspace(p0, p1, len(sig))
    place_st(sig * np.cos((pans + 1) * np.pi / 4), sig * np.sin((pans + 1) * np.pi / 4), t, g, rev)


def env_ar(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


def sweep_noise(d, f0, f1, width=0.35, curve=1.0):
    x = noise(d)
    f, tf, Z = signal.stft(x, SR, nperseg=1024)
    p = np.clip(tf / d, 0, 1) ** curve
    fc = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * p)
    lf = np.log(np.maximum(f, 1.0))[:, None]
    w = np.exp(-((lf - np.log(fc)[None, :]) ** 2) / (2 * width ** 2))
    _, y = signal.istft(Z * w, SR, nperseg=1024)
    y = y[:len(x)]
    if len(y) < len(x):
        y = np.pad(y, (0, len(x) - len(y)))
    return y / (np.max(np.abs(y)) + 1e-9)


# ------------------------------------------------------------------ instruments
def kick(punch=1.0, d=0.5, f_end=48):
    t = tt(d)
    f = f_end + 130 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.19)
    cl = hp(noise(0.012), 2500) * np.exp(-tt(0.012) / 0.002)
    body[:len(cl)] += cl * 0.3
    return np.tanh(body * 2.2 * punch) * 0.85


def kick_at(t, g, punch=1.0, d=0.5):
    place(kick(punch, d), t, g)
    i = int(round(t * SR)); n = min(int(0.22 * SR), N - i)
    if n > 0:
        DK[i:i + n] = np.maximum(DK[i:i + n], g * np.exp(-np.arange(n) / SR / 0.09))


def clap(d=0.25):
    t = tt(d)
    n = bp(noise(d), 900, 5200)
    e = np.zeros(len(t))
    for k, o in enumerate((0.0, 0.011, 0.022)):
        i = int(o * SR); e[i:] += np.exp(-(t[:len(t) - i]) / (0.012 if k < 2 else 0.07)) * (0.7 if k < 2 else 1.0)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.04) * 0.4
    return (n * e + body) * 0.8


def hat(d=0.05, soft=1.0):
    return hp(noise(d), 8000, 4) * np.exp(-tt(d) / (0.010 * soft))


def click(f=3200, d=0.025):
    x = bp(noise(d), f * 0.6, min(f * 1.6, 20000)) * np.exp(-tt(d) / 0.0035)
    return x + np.sin(2 * np.pi * (f / 4) * tt(d)) * np.exp(-tt(d) / 0.006) * 0.4


def blip(f, d=0.09, tau=0.025):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * np.exp(-t / tau) * np.minimum(1, t / 0.002)


def pluck(f, d=0.6, tau=0.16, bright=2500):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * k * t + k) / k ** 1.2 for k in range(1, 9))
    fe = bright * (0.25 + 0.75 * np.exp(-t / 0.08))
    y = np.zeros_like(x); s1 = s2 = 0.0
    a = 1 - np.exp(-2 * np.pi * fe / SR)
    for i in range(len(x)):                      # passe-bas à coupure variable
        s1 += a[i] * (x[i] - s1); s2 += a[i] * (s1 - s2); y[i] = s2
    return y * np.exp(-t / tau) * np.minimum(1, t / 0.003)


def chime(f, d=1.6, tau=0.55):
    t = tt(d)
    parts = [(1.0, 1.0, 1.0), (2.0, 0.45, 0.6), (3.01, 0.22, 0.4), (4.2, 0.12, 0.25)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (tau * td)) for r, a, td in parts) * np.minimum(1, t / 0.002)


def metal(f0=420, d=2.2, tau=0.9, bright=1.0):
    t = tt(d)
    ratios = [1.0, 2.76, 5.40, 8.93, 13.34, 17.0]
    amps = [1.0, 0.7, 0.45, 0.3, 0.18 * bright, 0.1 * bright]
    taus = [1.0, 0.75, 0.5, 0.35, 0.22, 0.15]
    x = np.zeros(len(t))
    for r, a, td in zip(ratios, amps, taus):
        x += a * np.sin(2 * np.pi * f0 * r * (1 + rng.uniform(-0.004, 0.004)) * t + rng.uniform(0, 6.28)) * np.exp(-t / (tau * td))
    att = bp(noise(0.03), 2500, 9000) * np.exp(-tt(0.03) / 0.006)
    x[:len(att)] += att * 0.8
    return x * np.minimum(1, t / 0.001)


def boom(f0=58, f1=31, d=2.4, tau=0.7, drive=2.4):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau)
    hit = lp(noise(0.12), 900) * np.exp(-tt(0.12) / 0.03)
    x[:len(hit)] += hit * 0.5
    return np.tanh(x * drive) * 0.8


def whoosh(d, f0=300, f1=3500, peak=0.7, curve=1.0):
    x = sweep_noise(d, f0, f1, 0.45, curve)
    t = np.linspace(0, 1, len(x))
    e = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) / (1 - peak + 1e-6) * 4))
    return x * e


def scan(d, f0, f1, am=34):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * am * t))
    x += 0.35 * sweep_noise(d, f0 * 1.5, f1 * 1.5, 0.25)
    return x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.8


def glitch(d=0.12, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros(int(SR * d)); i = 0
    while i < len(out):
        n = int(SR * r.uniform(0.006, 0.02))
        f = r.choice([900, 1400, 2200, 3100, 4600])
        g = np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * 0.4 + r.standard_normal(n) * 0.2
        g = np.round(g * 6) / 6
        out[i:i + n] += g[:len(out) - i] * r.uniform(0.3, 1.0)
        i += n + int(SR * r.uniform(0.0, 0.01))
    return hp(out, 600) * np.exp(-tt(d) / (d * 0.6))


def saws(f, d, voices=5, det=0.012, n=14):
    t = tt(d); x = np.zeros(len(t))
    for v in range(voices):
        fv = f * (1 + det * (v - (voices - 1) / 2) / ((voices - 1) / 2 + 1e-9))
        x += sum(np.sin(2 * np.pi * fv * k * t + v * 1.7 + k) / k for k in range(1, n + 1))
    return x / voices


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


def riser(d, f0=200, f1=7500, pitch0=110, pitch1=440):
    t = tt(d)
    nz = sweep_noise(d, f0, f1, 0.5, 1.4) * (t / d) ** 2.2
    f = pitch0 * (pitch1 / pitch0) ** ((t / d) ** 1.4)
    sw = lp(sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 8)), 2400) * (t / d) ** 2
    return nz + 0.35 * sw


def rev_cym(d):
    t = tt(d)
    return hp(noise(d), 5000, 2) * (t / d) ** 3


# ================================================================== PARTITION (la mineur)
m = midi
# ---------- nappes
PADS = [
    (0.0, 3.3, [55.0, m(40), m(45)], 480, [0, 0.9, 1.0, 0.0]),
    (3.0, 7.2, [m(45), m(52), m(59), m(60)], 700, [0, 0.55, 0.8, 0]),
    (7.0, 10.1, [m(45), m(48), m(52), m(55)], 900, [0, 0.75, 0.75, 0]),
    (10.0, 13.1, [m(41), m(48), m(52), m(57)], 950, [0, 0.75, 0.75, 0]),
    (13.0, 14.6, [m(48), m(55), m(60), m(64)], 1900, [0, 0.9, 0.9, 0]),        # scène claire : filtre ouvert
    (14.5, 16.05, [m(40), m(47), m(52), m(55)], 1100, [0, 0.8, 1.0, 0]),
    (16.0, 18.4, [m(45), m(52), m(57), m(60)], 1500, [0, 0.8, 1.0, 0]),
    (18.35, 20.25, [m(41), m(48), m(52), m(57)], 1200, [0, 1.0, 0.85, 0]),
    (19.95, 23.2, [m(45), m(52), m(55), m(59), m(60)], 650, [0, 0.9, 0.8, 0]),
    (22.95, 25.5, [m(48), m(52), m(55), m(59)], 760, [0, 0.8, 0.6, 0]),
]
PADL = np.zeros(N); PADR = np.zeros(N)
for t0, t1, fr, cut, e in PADS:
    d = t1 - t0
    pl, pr = pad_chord(fr, d, cut)
    tl = np.linspace(0, d, len(pl))
    ev = np.interp(tl, [0, min(0.35, d * 0.25), d - min(0.35, d * 0.25), d], e)
    i = int(t0 * SR); n = min(len(pl), N - i)
    PADL[i:i + n] += pl[:n] * ev[:n]; PADR[i:i + n] += pr[:n] * ev[:n]

air = lp(hp(noise(DUR), 2500), 9000)
air *= np.interp(np.arange(N) / SR, [0, 1.0, 19.9, 20.1, 23.0, 25.5], [0, 0.007, 0.009, 0.004, 0.006, 0])
L += air; R += np.roll(air, 300)

# ---------- 1. Ouverture 0–3,3 s : silhouettes, scan, plongée
_sw = tt(3.3)
place(np.sin(2 * np.pi * 41.2 * _sw) * np.sin(np.pi * np.clip(_sw / 3.3, 0, 1)) ** 1.4 * (1 + 0.3 * np.sin(2 * np.pi * 82.4 * _sw)), 0.0, 0.17)
place(click(5200, 0.02), 0.02, 0.10, -0.6, 0.6)                               # le tout premier son
pan_sweep(scan(0.6, 3000, 7000, 60), -0.9, 0.9, 0.04, 0.07, 0.4)            # trait de lumière
for k, (tt0, f) in enumerate([(0.12, 1200), (0.34, 1500), (0.58, 1800)]):    # arêtes qui s'allument
    pan_sweep(sweep_noise(0.5, f, f * 3, 0.25) * np.sin(np.linspace(0, np.pi, int(SR * 0.5))) ** 2, 0.7, -0.2, tt0, 0.035, 0.6)
place(whoosh(0.6, 120, 2400, 0.9, 1.3), 0.92, 0.26, 0, 0.5)                 # recul rapide
place(scan(0.6, 2600, 900, 28), 0.95, 0.04, 0.15, 0.3)                       # scan de la face
place(metal(392, 2.6, 1.1, 0.8), 1.48, 0.17, 0, 0.6)                         # impact métallique
place(boom(66, 34, 1.4, 0.4), 1.48, 0.32)
for tw, gg in [(1.50, 0.55), (1.625, 0.55), (2.00, 0.65), (2.50, 0.85)]:
    place(click(3000), tw, 0.20 * gg / 0.5, 0, 0.2)
    kick_at(tw, 0.08 * gg / 0.5, 0.6, 0.3)
place(pluck(m(76), 0.9, 0.25, 3000), 2.50, 0.07, 0.2, 0.5)
place(sweep_noise(0.3, 3000, 9000, 0.3) * np.sin(np.linspace(0, np.pi, int(SR * 0.3))), 2.52, 0.03, 0.3, 0.4)   # reflet sur AUTREMENT.
place(whoosh(0.5, 250, 6000, 0.9, 1.4), 2.78, 0.34, 0, 0.3)                  # plongée dans le D
place(boom(70, 30, 1.8, 0.5), 3.29, 0.44)
place(metal(196, 1.8, 0.6, 0.5), 3.29, 0.07, 0, 0.5)

# ---------- 2. Positionnement 3,3–7 s : la pulsation s'installe
for k in range(8):                                                           # lettres TECH&DEV
    place(blip(m(64 + [0, 2, 3, 5, 7, 8, 10, 12][k]) * 2, 0.08, 0.02), 3.32 + k * 0.045 + 0.25, 0.03, -0.7 + 0.2 * k, 0.5)
    place(click(4200, 0.015), 3.32 + k * 0.045 + 0.25, 0.04, -0.7 + 0.2 * k, 0.2)
place(sweep_noise(0.9, 6000, 1200, 0.3) * np.linspace(0, 1, int(SR * 0.9)) ** 2, 3.0, 0.05, 0, 0.5)
place(metal(523, 1.8, 0.6, 0.6), 3.95, 0.07, 0, 0.6)
for tc in (3.25, 3.4, 3.85, 3.9, 3.95, 4.0):
    place(click(4800, 0.02), tc, 0.05, rng.uniform(-0.6, 0.6), 0.3)
place(whoosh(0.45, 600, 2600, 0.8), 4.28, 0.07, 0, 0.3)                     # le mot-symbole remonte
for tl_, f in [(4.50, m(45)), (4.75, m(48)), (5.00, m(52))]:
    place(click(2600), tl_, 0.12, 0, 0.2); place(pluck(f, 0.7, 0.18, 1600), tl_, 0.09, 0, 0.3)
place(boom(74, 40, 0.8, 0.22), 5.18, 0.28); place(clap(), 5.18, 0.10, 0, 0.6)   # PROS.
place(chime(m(88), 1.8, 0.6), 5.5, 0.05, 0.25, 0.7)
place(sweep_noise(0.45, 2000, 7000, 0.3) * np.sin(np.linspace(0, np.pi, int(SR * 0.45))), 5.5, 0.04, 0.2, 0.4)
for n in range(7, 14):                                                       # pulsation qui monte
    t = n * B
    kick_at(t, 0.15 + 0.04 * (n - 7), 0.7, 0.4)
    if t >= 5.0:
        place(hat(0.04, 0.7), t + 0.25, 0.035, 0.3)
arp = [m(57), m(64), m(69), m(72), m(76), m(72), m(69), m(64)]
for k in range(int((6.5 - 3.5) / 0.125)):                                    # arpège en doubles croches, filtre qui s'ouvre
    t = 3.5 + k * 0.125
    place(pluck(arp[k % 8], 0.3, 0.07, 700 + 2600 * (t - 3.5) / 3.0), t, 0.028, 0.35 if k % 2 else -0.35, 0.3)
place(rev_cym(0.6), 6.42, 0.07, 0, 0.3)
place(sweep_noise(0.32, 5000, 400, 0.35) * np.linspace(1, 0, int(SR * 0.32)) ** 0.5, 6.5, 0.12, 0, 0.3)   # compression en une ligne
place(click(3600, 0.03), 7.0, 0.16, 0, 0.3)

# ---------- 3. Services 7–16 s : groove
ROOTS = [m(33), m(33), m(29), m(29), m(36), m(28)]
for i in range(6):
    t0 = S(i)
    if i != 4:
        place(whoosh(0.3, 500, 4500, 0.85, 1.3), t0 - 0.27, 0.13, [-0.3, 0.3][i % 2], 0.3)
    place(boom(74, 40, 0.9, 0.22), t0, 0.28)
    place(metal(330 + 40 * i, 1.2, 0.45, 0.6), t0, 0.045, 0, 0.5)
    place(pluck(m([69, 72, 76, 74, 79, 81][i]), 0.9, 0.22, 3000), t0 + 0.04, 0.06, 0.15, 0.6)
    for k in range(6):
        tb = t0 + k * 0.25
        f = midi(ROOTS[i] + (12 if k % 3 == 2 else 0))
        bs = lp(saws(f, 0.24, 3, 0.006, 8), 520) * env_ar(int(SR * 0.24), 0.004, 0.1)
        place(bs, tb, 0.22 if k % 2 == 0 else 0.15)
for n in range(14, 32):
    t = n * B
    kick_at(t, 0.34, 0.95 if n % 2 == 0 else 0.8)
    if n % 2 == 1:
        place(clap(), t, 0.075, 0, 0.5)
for n in range(28, 64):
    t = n * 0.25
    if t >= ACC:
        break
    place(hat(0.05, 1.0 if n % 2 else 0.6), t, 0.075 if n % 2 else 0.04, 0.35 if n % 4 < 2 else -0.35)
# S1 SITES WEB
for k in range(5): place(click(4400, 0.02), 7.12 + k * 0.065, 0.05, -0.4 + 0.2 * k, 0.2)
for k in range(4): place(blip(m(76 + 2 * k), 0.08, 0.02), 7.40 + k * 0.05, 0.022, 0.3, 0.4)
place(click(2400, 0.03), 7.66, 0.16, -0.2, 0.2); place(blip(m(84), 0.15, 0.04), 7.67, 0.05, -0.2, 0.5)
for k in range(6): place(click(5200, 0.015), 7.74 + k * 0.05, 0.035, rng.uniform(-0.5, 0.5), 0.2)
place(whoosh(0.4, 300, 6500, 0.92, 1.6), 8.12, 0.24, 0, 0.3)
# S2 portable
place(whoosh(0.42, 2500, 300, 0.2, 0.8), 8.48, 0.12, 0, 0.3)                 # recul
hinge = lp(noise(0.5), 600) * env_ar(int(SR * 0.5), 0.15, 0.12) * 0.6
place(hinge, 8.56, 0.10, 0, 0.2)
place(boom(90, 60, 0.5, 0.08, 1.4), 8.82, 0.14); place(click(1600, 0.04), 8.82, 0.12, 0, 0.3)   # l'écran se cale
place(chime(m(81), 1.0, 0.25), 8.80, 0.04, 0, 0.6)                           # allumage
for k in range(8): place(blip(rng.choice([1760, 2093, 2349, 2637]), 0.05, 0.012), 8.84 + k * 0.035, 0.024, rng.uniform(-0.7, 0.7), 0.3)
place(scan(0.42, 900, 2600, 52), 9.12, 0.05, 0, 0.3)
place(glitch(0.08, 3), 9.36, 0.028, 0.5)
place(chime(m(84), 1.4, 0.4), 9.6, 0.06, 0.4, 0.6); place(chime(m(88), 1.4, 0.4), 9.68, 0.05, 0.4, 0.6); place(click(3000), 9.6, 0.12, 0.4, 0.2)
place(whoosh(0.36, 300, 6500, 0.92, 1.6), 9.65, 0.2, 0, 0.3)
# S3 réseau
for k in range(16):
    place(blip(m([69, 72, 76, 79, 81, 84][k % 6] + 12 * (k // 8)), 0.09, 0.02), 10.06 + k * 0.05, 0.026, np.sin(k * 1.7) * 0.75, 0.5)
f = m(57) * 2 ** (tt(0.7) / 0.7 * 1.0)
place(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, int(SR * 0.7))) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * tt(0.7))), 10.42, 0.04, 0, 0.6)   # le chemin bleu
place(whoosh(0.3, 5000, 400, 0.95, 0.8), 11.2, 0.14, 0, 0.3)               # effondrement vers le cœur
# S4 automatisation
for k in range(4): place(click(3800, 0.02), 11.54 + k * 0.05, 0.08, [-0.6, -0.2, 0.2, 0.6][k], 0.2)
place(click(2600), 11.9, 0.14, 0, 0.2); place(whoosh(0.2, 800, 3500, 0.9), 11.92, 0.08, 0, 0.2)
burble = np.concatenate([blip(rng.choice([1047, 1319, 1568, 2093, 2637]), 0.03, 0.008) for _ in range(10)])
place(burble, 12.1, 0.035, 0, 0.4)
place(boom(60, 40, 0.6, 0.15, 1.6), 12.1, 0.12)                              # le cœur IA s'allume
for k, p in enumerate([-0.6, 0, 0.6]):
    place(blip(m(81 + [0, 4, 7][k]), 0.12, 0.03), 12.30 + k * 0.03, 0.035, p, 0.4)
    place(click(4000, 0.02), 12.54 + k * 0.03, 0.08, p, 0.2)
for k in range(3): place(blip(m(88 + [0, 4, 7][k]), 0.06, 0.015), 12.64 + k * 0.03, 0.025, [-0.6, 0, 0.6][k], 0.4)
# S5 design (clair) : ouverture lumineuse
place(sweep_noise(0.6, 600, 9000, 0.5, 0.8) * np.sin(np.linspace(0, np.pi, int(SR * 0.6))) ** 1.5, 12.82, 0.10, 0, 0.6)
place(chime(m(93), 1.8, 0.6), 12.98, 0.04, 0, 0.8)
paper = lp(noise(0.08), 2500) * np.exp(-tt(0.08) / 0.018)
place(paper, 13.02, 0.2, -0.1, 0.3); place(boom(110, 80, 0.3, 0.05, 1.2), 13.02, 0.1)
for k in range(5): place(blip(m([72, 74, 76, 79, 81][k]), 0.1, 0.025), 13.34 + k * 0.04, 0.032, -0.5 + 0.25 * k, 0.5)
place(whoosh(0.28, 900, 3500, 0.8), 13.36, 0.07, 0.5, 0.3); place(paper, 13.48, 0.14, 0.5, 0.3)
place(whoosh(0.3, 700, 3000, 0.8), 13.6, 0.08, -0.5, 0.3); place(paper, 13.74, 0.15, -0.3, 0.3)
place(whoosh(0.34, 300, 2200, 0.85), 13.98, 0.08, 0, 0.2); place(click(3600), 14.3, 0.12, 0, 0.2)
place(whoosh(0.22, 3000, 300, 0.2, 0.8), 14.36, 0.12, 0, 0.3)                # le noir redescend
# S6 bouclier : tension avant le drop
place(whoosh(0.55, 200, 2500, 0.6), 14.46, 0.16, 0.4, 0.4)                    # le bouclier pivote
place(click(2200, 0.03), 14.72, 0.08, 0, 0.3)
clack = click(1800, 0.04) * 1.2
place(clack, 15.27, 0.26, 0, 0.3); place(click(3500, 0.03), 15.29, 0.12, 0, 0.3)
place(metal(262, 2.6, 1.0, 0.9), 15.32, 0.16, 0, 0.7)
place(boom(84, 34, 1.2, 0.35), 15.32, 0.40)
place(riser(0.66, 400, 9000, 220, 660), 15.34, 0.12, 0, 0.4)
place(rev_cym(0.66), 15.34, 0.10, 0, 0.3)

# ---------- 4. DROP — accélération 16–18,35 s
place(boom(60, 28, 2.0, 0.6, 3.0), ACC, 0.55)
place(metal(165, 2.0, 0.8, 0.8), ACC, 0.10, 0, 0.6)
stab_l, stab_r = pad_chord([m(57), m(64), m(69), m(72)], 0.9, 3200, 0.008)
place_st(stab_l * env_ar(len(stab_l), 0.005, 0.25), stab_r * env_ar(len(stab_r), 0.005, 0.25), ACC, 0.10, 0.5)
reese = lp(saws(midi(33), IMPL - ACC, 5, 0.014, 10), 380) * (0.8 + 0.2 * np.sin(2 * np.pi * 2 * tt(IMPL - ACC)))
place(np.tanh(reese * 1.8) * np.minimum(1, tt(IMPL - ACC) / 0.02), ACC, 0.13)
place(riser(IMPL - ACC - 0.05, 200, 9000, 110, 440), ACC, 0.13, 0, 0.4)
beats, tb, step = [], ACC, 0.5
while tb < IMPL - 0.1:
    beats.append(tb); tb += step; step = max(0.125, step * 0.86)
for k, tb in enumerate(beats):
    kick_at(tb, 0.36 + 0.08 * k / len(beats), 1.0, 0.35)
    if k % 2 == 1:
        place(clap(), tb, 0.06 + 0.04 * k / len(beats), 0, 0.4)
for n in range(128, 147):
    t = n * 0.125
    if t >= IMPL - 0.1:
        break
    place(hat(0.035, 0.7), t, 0.045 + 0.03 * (t - ACC) / 2.3, 0.3 if n % 2 else -0.3)
for k, tp in enumerate([16.19, 16.81, 17.20, 17.48]):                        # fragments qui frôlent la caméra
    pan = [-0.7, 0.7, -0.7, 0.7][k]
    w = whoosh(0.32, 500, 4500, 0.75, 1.2)
    pan_sweep(w, pan * 0.3, pan, tp - 0.24, 0.12, 0.2)
    place(glitch(0.06, 30 + k), tp - 0.05, 0.03, pan, 0.2)
suck = whoosh(0.8, 6000, 180, 0.97, 0.8)
place(suck, IMPL - 0.8, 0.26, 0, 0.3)

# ---------- 5. Implosion + logo
place(boom(64, 24, 3.2, 1.0, 3.2), IMPL, 0.68)
place(metal(220, 3.4, 1.7, 1.0), IMPL, 0.21, 0, 0.9)
place(metal(587, 2.4, 1.1, 0.7), IMPL + 0.01, 0.075, 0.3, 0.9)
place(lp(noise(0.5), 3000) * np.exp(-tt(0.5) / 0.08), IMPL, 0.17, 0, 0.6)
place(sweep_noise(1.4, 7000, 2500, 0.35) * np.exp(-tt(1.4) / 0.45), IMPL + 0.05, 0.05, 0, 0.8)
for n in range(0, 3):
    kick_at(18.85 + n * 0.5, 0.13, 0.6, 0.4)
for tw in (18.78, 19.04):
    place(click(2800), tw, 0.12, 0, 0.3); place(pluck(m(64) * 2, 0.6, 0.15, 1800), tw, 0.04, 0, 0.4)
place(sweep_noise(0.4, 3000, 9000, 0.3) * np.sin(np.linspace(0, np.pi, int(SR * 0.4))), 19.3, 0.03, 0, 0.4)   # reflet sur SOLUTIONS.
place(whoosh(0.35, 3000, 400, 0.15), 19.72, 0.06, 0, 0.3)

# ---------- 6. Image de marque 20–23 s : ralentissement soudain
place(boom(46, 30, 2.5, 1.0), BRAND, 0.22)
place(chime(m(81), 2.4, 0.9), 20.55, 0.04, -0.2, 0.9); place(chime(m(88), 2.4, 0.9), 20.67, 0.03, 0.2, 0.9)
for k in range(4):
    place(blip(m([76, 79, 81, 84][k]), 0.14, 0.04), 21.2 + k * 0.13, 0.022, -0.45 + 0.3 * k, 0.7)
place(sweep_noise(0.6, 800, 6000, 0.35, 1.5) * np.linspace(0, 1, int(SR * 0.6)) ** 2, 22.42, 0.07, 0, 0.4)

# ---------- 7. Appel à l'action
place(click(3200, 0.03), CTA, 0.18, 0, 0.3); place(boom(74, 40, 0.9, 0.25), CTA, 0.3)
place(click(2600), 23.06, 0.13, 0, 0.3); place(pluck(m(60), 0.8, 0.2), 23.06, 0.06, -0.1, 0.4)
place(metal(440, 2.0, 0.8, 0.7), 23.38, 0.09, 0.1, 0.8); place(chime(m(88), 1.8, 0.6), 23.38, 0.05, 0.1, 0.8)
place(boom(66, 36, 1.0, 0.3), 23.38, 0.30)
place(sweep_noise(0.38, 1500, 6000, 0.3) * np.sin(np.linspace(0, np.pi, int(SR * 0.38))), 23.72, 0.035, 0, 0.4)
for k in range(3): place(click(4200 + 300 * k, 0.02), 23.84 + 0.05 * k, 0.07, -0.3 + 0.3 * k, 0.3)
place(click(4600, 0.02), 24.02, 0.07, 0.2, 0.3)
for n in range(47, 50):
    kick_at(n * B, 0.12, 0.6, 0.4)
place(metal(330, 3.0, 1.3, 0.8), 24.56, 0.12, 0, 0.9)
place(chime(m(81), 2.8, 1.0), 24.56, 0.045, -0.15, 1.0); place(chime(m(88), 2.8, 1.0), 24.6, 0.03, 0.15, 1.0)
place(boom(54, 30, 1.6, 0.6), 24.56, 0.26)

# ================================================================== MIXAGE
# nappes compressées par le kick (respiration du groove)
duck = 1 - 0.55 * np.clip(DK / (DK.max() + 1e-9) * 1.4, 0, 1)
L += PADL * 0.06 * duck; R += PADR * 0.06 * duck
VL += PADL * 0.06 * 0.5; VR += PADR * 0.06 * 0.5

ir_n = int(SR * 2.6)
irt = np.arange(ir_n) / SR
irL = lp(rng.standard_normal(ir_n), 6500) * np.exp(-irt / 0.62)
irR = lp(rng.standard_normal(ir_n), 6500) * np.exp(-irt / 0.62)
irL[:int(0.012 * SR)] = 0; irR[:int(0.017 * SR)] = 0
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
wetL = signal.fftconvolve(VL, irL)[:N]; wetR = signal.fftconvolve(VR, irR)[:N]
outL = L + 0.4 * hp(wetL, 180); outR = R + 0.4 * hp(wetR, 180)

eq = signal.firwin2(4097, [0, 40, 80, 150, 600, 1500, 3000, 6000, 12000, SR / 2],
                    [0.45, 0.5, 0.72, 1.0, 1.0, 1.25, 1.7, 1.8, 1.6, 1.0], fs=SR)
outL = signal.fftconvolve(outL, eq)[2048:2048 + N]; outR = signal.fftconvolve(outR, eq)[2048:2048 + N]
fade = np.interp(np.arange(N) / SR, [0, 0.005, 25.0, 25.5], [0, 1, 1, 0])
outL *= fade; outR *= fade
outL = hp(outL, 22, 2); outR = hp(outR, 22, 2)


def soft(x, drive=1.25):
    return np.tanh(x * drive) / np.tanh(drive)
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
outL /= peak; outR /= peak
outL = soft(outL); outR = soft(outR)
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
outL *= 10 ** (-1 / 20) / peak; outR *= 10 ** (-1 / 20) / peak

rms = 20 * np.log10(np.sqrt(np.mean((outL ** 2 + outR ** 2) / 2)) + 1e-12)
pk = 20 * np.log10(max(np.max(np.abs(outL)), np.max(np.abs(outR))))
print(f'crête {pk:.2f} dBFS, RMS {rms:.1f} dBFS')
out = sys.argv[1] if len(sys.argv) > 1 else 'theme_td05.wav'
wavfile.write(out, SR, (np.stack([outL, outR], 1) * 32767).astype(np.int16))
print('écrit :', out)
