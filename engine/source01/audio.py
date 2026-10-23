#!/usr/bin/env python3
"""SOURCE01 — bruitages seuls (sans musique, sans voix), calés sur cues.js.
Usage : python3 engine/source01/audio.py sortie.wav"""
import json, os, re, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR, DUR = 48000, 18.8
HERE = os.path.dirname(os.path.abspath(__file__))
CUES = json.loads(re.search(r'window\.CUES\s*=\s*(\[.*\])', open(os.path.join(HERE, 'cues.js'), encoding='utf-8').read(), re.S).group(1))
rng = np.random.default_rng(2610)
NO_MUSIC = True
def _opt(k):
    return sys.argv[sys.argv.index(k) + 1] if k in sys.argv else None
WARPF, VOICEF = _opt('--warp'), _opt('--voice')
WARP = None
if WARPF:
    m = re.search(r'window\.WARP\s*=\s*(\[.*?\]);\s*window\.VDUR\s*=\s*([\d.]+)', open(WARPF, encoding='utf-8').read(), re.S)
    WARP = np.array(json.loads(m.group(1))); DUR = float(m.group(2))
U = (lambda t: float(np.interp(t, WARP[:, 1], WARP[:, 0]))) if WARP is not None else (lambda t: t)
OUTF = sys.argv[1]
N = int(SR * (DUR + 1.5))
BUS = {k: np.zeros((N, 2)) for k in ('drum', 'bass', 'keys', 'sfx', 'amb')}


def tt(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))


def filt(x, kind, f, order=2):
    if kind == 'bp':
        sos = butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'bandpass', output='sos')
    else:
        sos = butter(order, f / (SR / 2), kind, output='sos')
    return sosfilt(sos, x, axis=0)


def add(*a):
    n = max(len(x) for x in a); o = np.zeros(n)
    for x in a: o[:len(x)] += x
    return o


def env(d, a=0.005, r=None, curve=4.0):
    x = tt(d)
    e = np.minimum(1, x / max(a, 1e-4))
    if r is None: r = d
    return e * np.exp(-curve * x / r)


def place(bus, sig, t0, g=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    if n <= 0: return
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    if sig.ndim == 1:
        BUS[bus][i:i + n, 0] += sig[:n] * g * l
        BUS[bus][i:i + n, 1] += sig[:n] * g * r
    else:
        BUS[bus][i:i + n] += sig[:n] * g


def sweep(f0, f1, d, curve=1.0, phase=0.0):
    x = tt(d); f = f0 + (f1 - f0) * (x / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


# ———— instruments ————
def kick(g=1.0):
    d = 0.42; x = tt(d)
    f = 48 + 120 * np.exp(-x * 32)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7.5)
    s = add(s, filt(noise(0.01), 'hp', 1500) * 0.35)
    return np.tanh(s * 1.6) * g


def snare(g=1.0):
    d = 0.26
    n = filt(noise(d), 'bp', (1200, 7500)) * env(d, 0.001, 0.12, 3)
    tone = np.sin(2 * np.pi * 185 * tt(d)) * env(d, 0.001, 0.05, 3)
    clap = np.zeros(int(SR * d))
    for o in (0.0, 0.011, 0.022):
        i = int(o * SR); b = filt(noise(0.03), 'bp', (900, 3500)) * env(0.03, 0.0005, 0.01, 3)
        clap[i:i + len(b)] += b
    return add(n * 0.8, tone * 0.5, clap * 0.9) * g


def hat(g=1.0, open_=False):
    d = 0.22 if open_ else 0.05
    return filt(noise(d), 'hp', 7000) * env(d, 0.0005, d * 0.5, 4) * g


def bass808(freq, d=0.5, g=1.0):
    x = tt(d)
    f = freq * (1 + 0.5 * np.exp(-x * 40))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.2) * np.minimum(1, x / 0.003)
    return np.tanh(s * 2.2) * 0.7 * g


def stab(freqs, d=0.45, g=1.0):
    x = tt(d); s = np.zeros_like(x)
    for f in freqs:
        for det in (-0.004, 0.0, 0.005):
            s += 2 * ((x * f * (1 + det)) % 1) - 1
    s = filt(s / (len(freqs) * 3), 'lp', 2400) * env(d, 0.004, d * 0.6, 3)
    return s * g


def crowd_noise(d, g=1.0):
    n = noise(d)
    a = filt(n, 'bp', (280, 1100)) * 0.8 + filt(noise(d), 'bp', (900, 2600)) * 0.35
    m = filt(np.abs(noise(d)), 'lp', 3.0); m = 0.6 + 2.2 * m / (np.abs(m).max() + 1e-9)
    e = np.minimum(1, tt(d) / 0.4) * np.minimum(1, (d - tt(d)) / 0.5)
    return a * m * e * g


# ———— bruitages ————
def sfx(k, t, d, g):
    if k == 'paste':
        x = tt(d); n = filt(noise(d), 'bp', (700, 5200))
        am = 0.6 + 0.4 * np.sin(2 * np.pi * 34 * x + rng.uniform(0, 6))
        e = np.sin(np.pi * np.clip(x / d, 0, 1)) ** 0.7
        place('sfx', n * am * e * 0.55 * g, t)
        place('sfx', filt(noise(0.08), 'lp', 400) * env(0.08, 0.002, 0.03) * 1.3 * g, t + d * 0.85)
    elif k == 'stamp':
        place('sfx', add(np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt(0.5) * 3) + 30) / SR) * env(0.5, 0.001, 0.22, 3) * 1.4,
                      filt(noise(0.05), 'bp', (300, 1400)) * env(0.05, 0.0005, 0.02) * 1.6) * g, t - 0.005)
        place('sfx', filt(noise(0.6), 'lp', 1200) * env(0.6, 0.002, 0.25) * 0.35 * g, t)
    elif k == 'slap':
        place('sfx', add(filt(noise(0.08), 'bp', (900, 4200)) * env(0.08, 0.0005, 0.025) * 1.0,
                      np.sin(2 * np.pi * 120 * tt(0.12)) * env(0.12, 0.001, 0.05) * 0.6) * g, t)
    elif k == 'spraytick':
        for u in np.arange(0, d, 0.075):
            place('sfx', filt(noise(0.07), 'hp', 3500) * env(0.07, 0.003, 0.05, 2.5) * 0.45 * g, t + u, pan=rng.uniform(-0.4, 0.4))
    elif k == 'spray':
        for j in range(3):  # bille de la bombe
            place('sfx', filt(noise(0.02), 'bp', (2500, 6000)) * env(0.02, 0.0005, 0.008) * 0.7, t - 0.32 + j * 0.09)
        x = tt(d); fl = 0.75 + 0.25 * np.sin(2 * np.pi * 9 * x)
        e = np.minimum(1, x / 0.03) * np.minimum(1, (d - x) / 0.06)
        place('sfx', filt(noise(d), 'hp', 3200) * fl * e * 0.42 * g, t, pan=-0.1)
    elif k == 'hit':
        place('sfx', (np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-tt(1.2) * 9)) / SR) * env(1.2, 0.001, 0.6, 3) * 1.5), t, g)
        place('sfx', filt(noise(1.0), 'lp', 7000) * env(1.0, 0.001, 0.45, 3) * 0.55, t, g)
        r = filt(noise(0.6), 'bp', (500, 6000)) * np.linspace(0, 1, int(0.6 * SR)) ** 3 * 0.35
        place('sfx', r, t - 0.6, g)
    elif k == 'crowd':
        place('amb', crowd_noise(d, 0.32 * g), t)
    elif k == 'whoosh':
        x = tt(d); n = noise(d); out = np.zeros_like(n)
        for j, (a, b) in enumerate([(200, 900), (600, 2500), (1500, 5000)]):
            w = np.sin(np.pi * np.clip(x / d, 0, 1)) ** (2 + j)
            out += filt(n, 'bp', (a, b)) * w
        place('sfx', out * 0.5 * g, t)
    elif k == 'thump':
        place('sfx', add(np.sin(2 * np.pi * np.cumsum(55 + 60 * np.exp(-tt(0.3) * 20)) / SR) * env(0.3, 0.001, 0.12, 3) * 1.2,
                      filt(noise(0.1), 'bp', (200, 900)) * env(0.1, 0.001, 0.04) * 0.9) * g, t)
    elif k == 'typing':
        n = max(2, int(d / 0.055))
        for j in range(n):
            u = j * d / n + rng.uniform(-0.008, 0.008)
            place('sfx', filt(noise(0.012), 'bp', (1800, 5200)) * env(0.012, 0.0003, 0.004) * 0.8 * g, t + u, pan=rng.uniform(-0.3, 0.3))
            place('sfx', np.sin(2 * np.pi * 380 * tt(0.02)) * env(0.02, 0.0005, 0.008) * 0.25 * g, t + u)
    elif k == 'sweep':
        x = tt(d)
        s = sum(np.sin(2 * np.pi * np.cumsum(f0 * (1 + x / d * 1.5)) / SR) for f0 in (440, 660, 880)) / 3
        place('sfx', add(s * np.sin(np.pi * x / d) * 0.18 * g, filt(noise(d), 'bp', (2000, 8000)) * (x / d) ** 2 * 0.3 * g), t)
    elif k == 'rip':
        x = tt(d); n = filt(noise(d), 'bp', (1300, 7000))
        cr = (rng.random(len(x)) < 0.012).astype(float) * rng.uniform(0.5, 1.5, len(x))
        cr = filt(cr, 'bp', (1500, 6000)) * 6
        am = np.abs(filt(noise(d), 'lp', 40)); am /= am.max() + 1e-9
        e = np.minimum(1, x / 0.02) * np.exp(-1.2 * x / d)
        place('sfx', (n * (0.3 + am) + cr) * e * 0.55 * g, t)
    elif k == 'ticks':
        u = 0.0
        while u < d:
            rate = 40 - 32 * (u / d) ** 0.7
            place('sfx', filt(noise(0.006), 'bp', (2500, 6500)) * env(0.006, 0.0002, 0.002) * 0.6 * g, t + u, pan=0.15)
            u += 1.0 / rate
    elif k == 'slam':
        place('sfx', add(np.sin(2 * np.pi * np.cumsum(46 + 80 * np.exp(-tt(0.32) * 18)) / SR) * env(0.32, 0.001, 0.14, 3) * 1.1,
                      filt(noise(0.09), 'bp', (250, 3200)) * env(0.09, 0.0005, 0.03) * 0.8,
                      filt(noise(0.02), 'hp', 4000) * env(0.02, 0.0002, 0.006) * 0.5) * g, t - 0.004)
    elif k == 'clack':
        place('sfx', add(np.sin(2 * np.pi * 150 * tt(0.15)) * env(0.15, 0.001, 0.05) * 0.7,
                      filt(noise(0.03), 'bp', (1500, 5000)) * env(0.03, 0.0005, 0.008) * 0.9) * g, t)
    elif k == 'march':
        for u in np.arange(0, d, 0.5):
            place('amb', add(np.sin(2 * np.pi * 70 * tt(0.15)) * env(0.15, 0.002, 0.06) * 0.5,
                          filt(noise(0.12), 'bp', (150, 700)) * env(0.12, 0.002, 0.05) * 0.5) * g, t + u)
            for j in range(9):
                place('amb', filt(noise(0.03), 'bp', (800, 3200)) * env(0.03, 0.0005, 0.01) * 0.12 * g, t + u + 0.25 + rng.uniform(-0.015, 0.015), pan=rng.uniform(-0.7, 0.7))
        place('amb', crowd_noise(d, 0.25 * g), t)
    elif k == 'rewind':
        x = tt(d); f = 1200 + 900 * np.sin(2 * np.pi * 7 * x) + 1800 * (x / d)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12 + filt(noise(d), 'bp', (1500, 6000)) * 0.25
        place('sfx', s * np.minimum(1, x / 0.05) * np.minimum(1, (d - x) / 0.05) * g, t)
    elif k == 'fuse':
        x = tt(d); cr = (rng.random(len(x)) < 0.02).astype(float) * rng.uniform(0.3, 1.5, len(x))
        s = filt(cr, 'bp', (1200, 8000)) * 5 + filt(noise(d), 'hp', 4000) * 0.25
        place('sfx', s * np.minimum(1, x / 0.05) * np.minimum(1, (d - x) / 0.1) * 0.5 * g, t)
    elif k == 'pop':
        for j in range(6):
            place('sfx', add(filt(noise(0.05), 'bp', (500, 1600)) * env(0.05, 0.0005, 0.02) * 0.8 * g,
                  np.sin(2 * np.pi * 220 * tt(0.05)) * env(0.05, 0.0005, 0.02) * 0.3 * g), t + j * 0.05, pan=rng.uniform(-0.5, 0.5))
    elif k == 'stretch':
        x = tt(0.35); s = np.sin(2 * np.pi * np.cumsum(140 + 420 * (x / 0.35) ** 0.5 + 18 * np.sin(2 * np.pi * 22 * x)) / SR)
        place('sfx', np.tanh(s * 2) * env(0.35, 0.005, 0.25, 2) * 0.35 * g, t)
    elif k == 'shred':
        x = tt(d); saw = 2 * ((x * 110) % 1) - 1
        s = filt(saw, 'bp', (150, 3000)) * 0.35 + filt(noise(d), 'bp', (2000, 8000)) * 0.35
        place('sfx', s * (0.7 + 0.3 * np.sin(2 * np.pi * 31 * x)) * np.minimum(1, x / 0.03) * np.minimum(1, (d - x) / 0.15) * g, t)
    elif k == 'thud':
        place('sfx', add(np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-tt(0.6) * 12)) / SR) * env(0.6, 0.001, 0.3, 3) * 1.5,
                      filt(noise(0.5), 'lp', 700) * env(0.5, 0.002, 0.2) * 0.6) * g, t)
    elif k == 'zip':
        u = 0.0
        while u < d:
            rate = 18 + 60 * (u / d)
            place('sfx', filt(noise(0.008), 'bp', (2000, 6000)) * env(0.008, 0.0002, 0.003) * 0.5 * g, t + u, pan=-0.3 + 0.6 * u / d)
            u += 1.0 / rate
        place('sfx', filt(noise(0.06), 'bp', (800, 3000)) * env(0.06, 0.0005, 0.02) * 0.9 * g, t + d)
    elif k == 'aim':
        x = tt(d); s = np.sin(2 * np.pi * np.cumsum(900 + 600 * (x / d)) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * x))
        place('sfx', s * np.minimum(1, x / 0.05) * 0.09 * g, t)
    elif k == 'lock':
        b = np.sin(2 * np.pi * 1760 * tt(0.09)) * env(0.09, 0.002, 0.08, 1.5)
        place('sfx', b * 0.28 * g, t); place('sfx', b * 0.28 * g, t + 0.11)
        sfx('hit', t, 0, g * 0.85)
    elif k == 'pull':
        x = tt(d); n = noise(d)
        s = filt(n, 'bp', (150, 1500)) * np.sin(np.pi * x / d) ** 1.5 * 0.6
        pad = sum(np.sin(2 * np.pi * f * x) for f in (146.8, 174.6, 220.0, 293.7)) / 4
        place('sfx', (s + (0 if NO_MUSIC else pad * 0.18 * np.sin(np.pi * x / d))) * g, t)
    elif k == 'marker':
        x = tt(d); sq = np.sin(2 * np.pi * np.cumsum(1900 + 500 * np.sin(2 * np.pi * 6 * x)) / SR) * 0.05
        n = filt(noise(d), 'bp', (1500, 6000)) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 11 * x)))
        place('sfx', (n * 0.35 + sq) * np.minimum(1, x / 0.02) * np.minimum(1, (d - x) / 0.04) * g, t, pan=0.2)
    elif k == 'flutter':
        x = tt(d); am = (np.sin(2 * np.pi * (14 - 6 * x / d) * x) > 0.2).astype(float)
        am = filt(am, 'lp', 300); n = filt(noise(d), 'bp', (600, 4500))
        place('sfx', n * am * np.sin(np.pi * np.clip(x / d, 0, 1)) * 0.45 * g, t, pan=0.3)
    elif k == 'end':
        place('keys', stab((146.8, 174.6, 220.0, 293.7), 1.4, 0.35), t - 0.45)
        place('drum', kick(0.9), t - 0.45)



for c in CUES:
    sfx(c['k'], c['t'], c.get('d', 0.3), c.get('g', 1.0))

# ambiance de rue très basse sur toute la durée (pas de blanc numérique)
x = tt(DUR + 1)
room = filt(noise(DUR + 1), 'bp', (120, 900)) * 0.5 + filt(noise(DUR + 1), 'bp', (1500, 5000)) * 0.08
room *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.13 * x)
for u in (2.1, 7.9, 12.8, 16.2):  # passages lointains
    w = np.exp(-((x - u) / 0.9) ** 2)
    room += filt(noise(DUR + 1), 'bp', (200, 1200)) * w * 0.6
place('amb', room * 0.06, 0)

T = np.arange(N) / SR
mix = BUS['sfx'] * 1.0 + BUS['amb'] * 0.8
ir = noise(1.0) * np.exp(-np.arange(int(1.0 * SR)) / SR * 6.0)
irr = noise(1.0) * np.exp(-np.arange(int(1.0 * SR)) / SR * 6.0)
wet = np.stack([fftconvolve(BUS['sfx'][:, 0], ir)[:N], fftconvolve(BUS['sfx'][:, 1], irr)[:N]], 1)
mix += filt(wet, 'hp', 300) * 0.012
mix = filt(mix, 'hp', 32)
mix = mix[:int(DUR * SR)]
mix *= np.minimum(1, (DUR - T[:len(mix)]) / 0.4)[:, None]
pk = np.abs(mix).max()
mix = np.tanh(mix / pk * 1.3) / np.tanh(1.3) * 0.89
wavfile.write(OUTF, SR, (mix * 32767).astype(np.int16))
print('écrit', OUTF, f'{len(mix) / SR:.2f} s')
