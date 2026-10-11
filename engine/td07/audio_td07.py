#!/usr/bin/env python3
"""TD07 « On t'entend » : bruitages discrets (pas de musique : un son TikTok sera posé par-dessus).
Les temps viennent de voice.json (prise retenue) + OFF, comme dans scene.html.
Usage : python3 engine/td07/audio_td07.py sortie_bruitages.wav"""
import json, os, sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR, DUR, OFF = 48000, 22.6, 0.15
HERE = os.path.dirname(os.path.abspath(__file__))
WT = [OFF + s for _, s in json.load(open(os.path.join(HERE, 'voice.json')))['words']]
w = lambda i: WT[i]
CUT = [0, w(7) - 0.22, w(15) - 0.2, w(29) - 0.2, w(39) - 0.2, w(61) - 0.2, 20.0]

rng = np.random.default_rng(7)
out = np.zeros((int(SR * (DUR + 1)), 2))


def tt(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))


def filt(x, kind, f, order=2):
    sos = butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'bandpass', output='sos') if kind == 'bp' \
        else butter(order, f / (SR / 2), kind, output='sos')
    return sosfilt(sos, x)


def place(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(out) - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i:i + n, 0] += sig[:n] * gain * l * 1.414
    out[i:i + n, 1] += sig[:n] * gain * r * 1.414


def sweep(f0, f1, d, curve=1.0):
    x = tt(d); f = f0 + (f1 - f0) * (x / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def whoosh(d=0.34, lo=500, hi=5000):
    x = tt(d); return filt(noise(d), 'bp', (lo, hi)) * np.sin(np.pi * x / d) ** 2


def pop(f0=600, f1=1100, d=0.06):
    x = tt(d); return sweep(f0, f1, d) * np.exp(-x / 0.016) * np.minimum(1, x / 0.002)


def tick(a=1.0):
    return filt(noise(0.006), 'highpass', 3000) * np.exp(-tt(0.006) / 0.0012) * a


def thud(a=1.0, f0=70):
    d = 0.2; x = tt(d)
    s = np.sin(2 * np.pi * np.cumsum(f0 + 90 * np.exp(-x / 0.02)) / SR) * np.exp(-x / 0.06)
    k = filt(noise(0.03), 'bp', (300, 2500)) * np.exp(-tt(0.03) / 0.006)
    s[:len(k)] += k * 0.5
    return s * a


def slap():
    d = 0.16; x = tt(d)
    s = filt(noise(d), 'bp', (700, 6000)) * np.exp(-x / 0.025)
    s[:len(x)] += thud(0.6)[:len(x)] * 0.7
    return s


def impact(big=0.6):
    d = 0.5; x = tt(d)
    body = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-x / 0.05)) / SR) * np.exp(-x / (0.12 + 0.12 * big))
    c = filt(noise(0.012), 'highpass', 2500) * np.exp(-tt(0.012) / 0.002)
    body[:len(c)] += c * 0.3
    return body * (0.7 + 0.5 * big)


def boing(f0=220, f1=760, d=0.18):
    x = tt(d); return sweep(f0, f1, d, 0.7) * np.exp(-x / 0.08) * np.minimum(1, x / 0.004)


def deflate(d=0.32):
    x = tt(d)
    f = 1300 * np.exp(-x / 0.12) + 160
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - x / d) * 0.6
    return s + filt(noise(d), 'bp', (800, 3000)) * (1 - x / d) * 0.25


def click():
    d = 0.05; x = tt(d)
    s = np.sin(2 * np.pi * 3200 * x) * np.exp(-x / 0.01) * 0.5 + np.sin(2 * np.pi * 900 * x) * np.exp(-x / 0.015) * 0.5
    k = filt(noise(0.004), 'highpass', 4000) * np.exp(-tt(0.004) / 0.001)
    s[:len(k)] += k
    return s


def chime(fs=(1318.5, 1975.5, 2637), d=1.1):
    x = tt(d)
    return sum(np.sin(2 * np.pi * f * x) * np.exp(-x / (0.35 / (1 + i * 0.6))) / (1 + i) for i, f in enumerate(fs)) * np.minimum(1, x / 0.003)


def sparkle(d=0.7, n=14):
    s = np.zeros(int(SR * d))
    for _ in range(n):
        f = rng.uniform(2500, 6000); i = int(rng.uniform(0, d - 0.12) * SR)
        g = np.sin(2 * np.pi * f * tt(0.1)) * np.exp(-tt(0.1) / 0.03) * rng.uniform(0.3, 1)
        s[i:i + len(g)] += g[:len(s) - i]
    return s


def wind(d=0.9):
    x = tt(d)
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 3 * x)
    return filt(noise(d), 'bp', (600, 2400)) * np.sin(np.pi * x / d) ** 1.5 * lfo


# ---------- transitions ----------
for c in CUT[1:]:
    place(whoosh(0.42, 400, 5500), c - 0.1, 0.32)

# ---------- S1 : la main qui s'étire, l'horloge qui s'emballe ----------
for k in range(18):
    place(tick(0.8), 0.05 + k * 0.085, 0.10, pan=-0.5)
place(sweep(180, 620, 1.2, 0.6) * np.sin(np.pi * tt(1.2) / 1.2) ** 0.5 * 0.5, 0.12, 0.10, pan=0.3)

# ---------- S2 : chaise, bureau, post-it, virevoltant ----------
place(thud(0.8), CUT[1] + 0.2, 0.30)
place(thud(0.6, 60), CUT[1] + 0.12, 0.25)
place(slap(), w(10), 0.42)
place(impact(0.4), w(14), 0.30)
place(wind(0.95), w(14) - 0.12, 0.22)
for k in range(3):
    place(tick(1.0), w(14) + 0.05 + k * 0.25, 0.10, pan=-0.6 + k * 0.6)

# ---------- S3 : cartes, « 10 », la carte qui s'envole ----------
for i in range(10):
    place(pop(700 + i * 40, 1100 + i * 40, 0.05), CUT[2] + 0.2 + i * 0.045, 0.10, pan=-0.6 + (i % 5) * 0.3)
place(impact(0.6), w(26), 0.32)
place(boing(), w(28) - 0.08, 0.22, pan=0.2)
place(whoosh(0.5, 1200, 7000), w(28) + 0.1, 0.22, pan=0.5)

# ---------- S4 : râler, le doigt, le bouton muet ----------
place(pop(500, 900, 0.08), w(32), 0.30)
for k in range(3):
    place(pop(900 + k * 200, 1300 + k * 200, 0.05), w(32) + 0.06 + k * 0.07, 0.14)
place(whoosh(0.45, 300, 3000), w(33) - 0.1, 0.24, pan=0.5)
place(pop(400, 700, 0.07), w(35) - 0.08, 0.20, pan=0.5)
place(click(), w(38), 0.40, pan=0.4)
place(thud(0.5), w(38), 0.22)
place(deflate(), w(38) + 0.03, 0.22, pan=-0.2)

# ---------- S5 : les mains, les parachutes, le compteur ----------
for k in range(12):
    place(whoosh(0.18, 900, 5000), w(45) - 0.35 + k * 0.06, 0.08, pan=-0.8 + k * 0.14)
place(whoosh(0.8, 250, 2200), w(53) - 0.1, 0.22)
for k in range(10):
    place(tick(0.9) + 0, w(55) + k * 0.034, 0.12)
    place(pop(1200 + k * 90, 1300 + k * 90, 0.03), w(55) + k * 0.034, 0.05)
place(impact(0.7), w(55), 0.30)

# ---------- S6 : « Oui ? », confettis ----------
place(pop(500, 1000, 0.1), w(62) + 0.3, 0.34, pan=-0.4)
place(slap() * 0.5 + 0, w(67) - 0.01, 0.22)
place(sparkle(0.8, 18), w(67), 0.16)

# ---------- S7 : logo ----------
place(impact(0.5), 20.3, 0.28)
place(chime(), 20.32, 0.12)
place(sparkle(0.6, 8), 20.45, 0.10)

mix = out[:int(SR * DUR)]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 10 ** (-3 / 20) / max(1e-6, np.abs(mix).max())
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'td07_sfx.wav', SR, (mix * 32767).astype(np.int16))
print('ok', len(mix) / SR, 's')
