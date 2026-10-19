#!/usr/bin/env python3
"""MANIF02 — son : voix + son d'origine de la vidéo (suit les arrêts sur image) + bruitages synthétisés, sans musique.
Tout est calé sur timing.js (repères communs avec la scène).
Usage : python3 audio.py sortie.wav [--voice voix_calee.wav]"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
TL = json.loads(re.search(r'window\.TL\s*=\s*(\{.*\});', open(os.path.join(HERE, 'timing.js'), encoding='utf-8').read(), re.S).group(1))
DUR = TL['dur']
OUTF = sys.argv[1]
VOICEF = sys.argv[sys.argv.index('--voice') + 1] if '--voice' in sys.argv else None
N = int(SR * (DUR + 1.0))
rng = np.random.default_rng(2026)
SFX = np.zeros((N, 2)); CLIP = np.zeros((N, 2))


def tt(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))
def add(*a):
    n = max(len(x) for x in a); o = np.zeros(n)
    for x in a: o[:len(x)] += x
    return o
def filt(x, kind, f, order=2):
    sos = butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'bandpass', output='sos') if kind == 'bp' else butter(order, f / (SR / 2), kind, output='sos')
    return sosfilt(sos, x, axis=0)
def env(d, a=0.005, r=None, curve=4.0):
    x = tt(d); e = np.minimum(1, x / max(a, 1e-4))
    return e * np.exp(-curve * x / (r or d))
def place(buf, sig, t0, g=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    if n <= 0: return
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    if sig.ndim == 1: buf[i:i + n, 0] += sig[:n] * g * l; buf[i:i + n, 1] += sig[:n] * g * r
    else: buf[i:i + n] += sig[:n] * g


def sfx(k, t, d):
    if k == 'paste':
        x = tt(d); n = filt(noise(d), 'bp', (700, 5200)); am = 0.6 + 0.4 * np.sin(2 * np.pi * 34 * x + rng.uniform(0, 6))
        place(SFX, n * am * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 0.7 * 0.5, t)
        place(SFX, filt(noise(0.08), 'lp', 400) * env(0.08, 0.002, 0.03) * 1.2, t + d * 0.85)
    elif k == 'slap':
        place(SFX, add(filt(noise(0.08), 'bp', (900, 4200)) * env(0.08, 0.0005, 0.025), np.sin(2 * np.pi * 120 * tt(0.12)) * env(0.12, 0.001, 0.05) * 0.6), t)
    elif k == 'stamp':
        place(SFX, add(np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt(0.45) * 3) + 30) / SR) * env(0.45, 0.001, 0.2, 3) * 1.3,
                       filt(noise(0.05), 'bp', (300, 1400)) * env(0.05, 0.0005, 0.02) * 1.5), t - 0.005)
    elif k == 'slam':
        place(SFX, add(np.sin(2 * np.pi * np.cumsum(46 + 80 * np.exp(-tt(0.3) * 18)) / SR) * env(0.3, 0.001, 0.13, 3) * 0.9,
                       filt(noise(0.08), 'bp', (250, 3200)) * env(0.08, 0.0005, 0.03) * 0.7), t - 0.004)
    elif k == 'typing':
        n = max(2, int(d / 0.06))
        for j in range(n):
            u = j * d / n + rng.uniform(-0.008, 0.008)
            place(SFX, filt(noise(0.012), 'bp', (1800, 5200)) * env(0.012, 0.0003, 0.004) * 0.7, t + u, pan=rng.uniform(-0.3, 0.3))
            place(SFX, np.sin(2 * np.pi * 380 * tt(0.02)) * env(0.02, 0.0005, 0.008) * 0.2, t + u)
    elif k == 'spray':
        for j in range(3): place(SFX, filt(noise(0.02), 'bp', (2500, 6000)) * env(0.02, 0.0005, 0.008) * 0.6, t - 0.3 + j * 0.09)
        x = tt(d); e = np.minimum(1, x / 0.03) * np.minimum(1, (d - x) / 0.06)
        place(SFX, filt(noise(d), 'hp', 3200) * (0.75 + 0.25 * np.sin(2 * np.pi * 9 * x)) * e * 0.38, t, pan=-0.1)
    elif k == 'hit':
        place(SFX, np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-tt(1.0) * 9)) / SR) * env(1.0, 0.001, 0.5, 3) * 1.2, t)
        place(SFX, filt(noise(0.8), 'lp', 6000) * env(0.8, 0.001, 0.35, 3) * 0.4, t)
    elif k == 'whoosh':
        x = tt(d); n = noise(d); o = np.zeros_like(n)
        for j, (a, b) in enumerate([(200, 900), (600, 2500), (1500, 5000)]): o += filt(n, 'bp', (a, b)) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** (2 + j)
        place(SFX, o * 0.35, t)
    elif k == 'rip':
        x = tt(d); n = filt(noise(d), 'bp', (1300, 7000)); cr = filt((rng.random(len(x)) < 0.012) * rng.uniform(0.5, 1.5, len(x)), 'bp', (1500, 6000)) * 6
        am = np.abs(filt(noise(d), 'lp', 40)); am /= am.max() + 1e-9
        place(SFX, (n * (0.3 + am) + cr) * np.minimum(1, x / 0.02) * np.exp(-1.2 * x / d) * 0.45, t)
    elif k == 'clack':
        place(SFX, add(np.sin(2 * np.pi * 150 * tt(0.15)) * env(0.15, 0.001, 0.05) * 0.7, filt(noise(0.03), 'bp', (1500, 5000)) * env(0.03, 0.0005, 0.008) * 0.9), t)
    elif k == 'rewind':
        x = tt(d); f = 1400 + 900 * np.sin(2 * np.pi * 9 * x) + 2200 * (x / d)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.1 + filt(noise(d), 'bp', (1500, 6000)) * 0.22
        place(SFX, s * np.minimum(1, x / 0.04) * np.minimum(1, (d - x) / 0.04), t)
    elif k == 'marker':
        x = tt(d); sp = np.sin(np.pi * np.clip(x / d, 0, 1)) ** 0.6 * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * x))
        sq = np.sin(2 * np.pi * np.cumsum(1700 + 250 * np.sin(2 * np.pi * 5 * x)) / SR) * 0.05
        place(SFX, (filt(noise(d), 'bp', (2200, 6500)) * 0.3 + sq) * sp, t, pan=0.15)
    elif k == 'pull':
        x = tt(d); place(SFX, filt(noise(d), 'bp', (150, 1500)) * np.sin(np.pi * x / d) ** 1.5 * 0.5, t)
    elif k == 'end':
        place(SFX, add(np.sin(2 * np.pi * np.cumsum(45 + 40 * np.exp(-tt(0.5) * 10)) / SR) * env(0.5, 0.001, 0.25, 3) * 0.8,
                       filt(noise(0.3), 'lp', 900) * env(0.3, 0.002, 0.12) * 0.4), t)


for k, t, d, sh, pu in TL['cues']:
    sfx(k, t, d)

# son d'origine de la vidéo, suivant la carte du clip
tmp = tempfile.mkdtemp(); cw = os.path.join(tmp, 'clip.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(HERE, 'src', 'clip.mp4'), '-vn', '-ac', '2', '-ar', str(SR), cw], check=True)
_, ca = wavfile.read(cw); ca = ca.astype(float) / 32768
def src(a, b): return ca[max(0, int(a * SR)):max(0, int(b * SR))]
for t0, t1, s0, s1 in TL['clip']:
    d = t1 - t0
    if d <= 0.01: continue
    if s1 > s0 + 1e-3:                                   # lecture normale
        seg = src(s0, s1).copy(); f = min(len(seg) // 4, int(0.012 * SR))
        if f > 0: seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
        place(CLIP, seg, t0)
    elif s1 < s0 - 1e-3:                                 # rembobinage : son à l'envers, accéléré
        seg = src(s1, s0)[::-1]; idx = np.linspace(0, len(seg) - 1, int(d * SR)).astype(int)
        place(CLIP, filt(seg[idx], 'hp', 400) * 0.6 * np.sin(np.pi * np.linspace(0, 1, len(idx)))[:, None], t0)
    else:                                                # arrêt sur image : la bande ralentit et s'arrête
        if t0 < 0.5: continue
        tail = src(max(0, s0 - 0.25), s0)
        if len(tail) < 100: continue
        L = int(0.4 * SR); rate = np.linspace(1, 0.05, L); pos = np.clip(np.cumsum(rate) * (len(tail) / (0.25 * SR)), 0, len(tail) - 1)
        st = np.stack([np.interp(pos, np.arange(len(tail)), tail[:, ch]) for ch in (0, 1)], 1) * np.linspace(1, 0, L)[:, None] ** 1.5
        place(CLIP, filt(st, 'lp', 2500) * 0.8, t0)

act = lambda z: np.sqrt(np.mean(z[np.abs(z) > 0.01] ** 2)) if np.any(np.abs(z) > 0.01) else 1e-3
if VOICEF:
    _, vx = wavfile.read(VOICEF); vx = vx.astype(float) / 32768
    if vx.ndim > 1: vx = vx.mean(1)
    V = np.zeros((N, 2)); n = min(len(vx), N); V[:n, 0] = vx[:n]; V[:n, 1] = vx[:n]
    ref = act(V[:, 0])
else:
    V = np.zeros((N, 2)); ref = 0.1
gs = ref / act(SFX[:, 0]) * 10 ** (-9 / 20)
gc = ref / act(CLIP[:, 0]) * 10 ** (-12 / 20)
print(f'bruitages {20 * np.log10(gs):+.1f} dB, son d’origine {20 * np.log10(gc):+.1f} dB')
mix = V + SFX * gs + CLIP * gc
mix = filt(mix, 'hp', 35)[:int(DUR * SR)]
T = np.arange(len(mix)) / SR
mix *= np.minimum(1, (DUR - T) / 0.3)[:, None]
pk = np.abs(mix).max(); mix = np.tanh(mix / pk * 1.2) / np.tanh(1.2) * 0.89
wavfile.write(OUTF, SR, (mix * 32767).astype(np.int16))
print('écrit', OUTF, f'{len(mix) / SR:.2f} s', 'avec voix' if VOICEF else 'sans voix')
