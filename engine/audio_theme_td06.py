#!/usr/bin/env python3
"""TD06 « Blocus des lycées » : bruitages seuls (aucune musique), calés sur la voix off.

Les temps reprennent la table RAW de theme-td06.html (prise 2, accélérée de SPD, décalée de OFF).
Usage : python3 engine/audio_theme_td06.py sortie_bruitages.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 30.2
OFF, SPD = 0.10, 1.2
RAW = dict(plus=0, quatre=0.48, lycees=1.04, fermes=1.48, le_meme=2.24, jour=2.72, etnon=3.52, cest=4.293,
           vacances=4.8, tout=5.76, creteil=6.32, le21=7.04, vingt21=7.2, sept=7.6, dix=8.56, cesttoute=9.76,
           france=10.4, profs=11.2, rempl=11.84, bat=12.72, bout=13.52, etmeme=14.16, desrats=15.04, rats=15.2,
           dans=15.467, couloirs=15.76, selon=16.32, en=17.52, vc=18.44, pres=19.24, dixpc=19.64, cours=20.24,
           saute=20.827, lereve=21.6, sauf=22.693, bac=23.2, lui=23.56, ne=24.28, saute2=24.4, pas=24.72,
           gouv=25.28, promet=26.0, reponses=26.32, dici=26.76, fin=27.12, octobre=27.4, ona=28.16, rappel=28.6,
           nous=29.44, bloque=30.08, rien=30.44, debloque=31.12, site=31.76, pc=32.56, tech=33.36)


def T(k):
    return OFF + RAW[k] / SPD


rng = np.random.default_rng(6)
out = np.zeros((int(SR * DUR) + SR, 2))


def tt(d):
    return np.arange(int(SR * d)) / SR


def noise(d):
    return rng.standard_normal(int(SR * d))


def filt(x, kind, f, order=2):
    if kind == 'bp':
        sos = butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'bandpass', output='sos')
    else:
        sos = butter(order, f / (SR / 2), kind, output='sos')
    return sosfilt(sos, x)


def place(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i < 0:
        sig = sig[-i:]; i = 0
    n = min(len(sig), len(out) - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i:i + n, 0] += sig[:n] * gain * l * 1.414
    out[i:i + n, 1] += sig[:n] * gain * r * 1.414


def sweep(f0, f1, d, curve=1.0):
    x = tt(d)
    f = f0 + (f1 - f0) * (x / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ---------------- générateurs ----------------
def impact(big=1.0):
    d = 0.55 + 0.35 * big
    x = tt(d)
    f = 34 + 70 * np.exp(-x / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / (0.16 + 0.14 * big))
    click = filt(noise(0.012), 'highpass', 2500) * np.exp(-tt(0.012) / 0.002)
    thump = filt(noise(0.12), 'lowpass', 500) * np.exp(-tt(0.12) / 0.03)
    s = body * (0.9 + 0.3 * big)
    s[:len(thump)] += thump * 0.6
    s[:len(click)] += click * 0.35
    return s


def whoosh(d=0.32, lo=500, hi=5000, rev=False):
    x = tt(d)
    env = np.sin(np.pi * x / d) ** 2
    if rev:
        env = (x / d) ** 2.2
    return filt(noise(d), 'bp', (lo, hi)) * env


def pop(f0=700, f1=1300, d=0.05):
    return sweep(f0, f1, d) * np.exp(-tt(d) / 0.014)


def tick(a=1.0):
    return filt(noise(0.006), 'highpass', 3000) * np.exp(-tt(0.006) / 0.0012) * a


def buzz(f=170, d=0.085):
    x = tt(d)
    s = sum(np.sin(2 * np.pi * f * k * x) / k for k in (1, 3, 5, 7))
    return filt(s, 'lowpass', 1800) * np.minimum(1, x / 0.004) * np.exp(-x / 0.05)


def squeak(d=0.07):
    x = tt(d)
    f = 2900 + 700 * np.sin(np.pi * x / d) + 120 * np.sin(2 * np.pi * 38 * x)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / d) ** 1.5


def boing(f0=240, f1=900, d=0.16):
    x = tt(d)
    return sweep(f0, f1, d, 0.7) * np.exp(-x / 0.07) * np.minimum(1, x / 0.004)


def crack():
    d = 0.32
    s = filt(noise(d), 'highpass', 1800) * np.exp(-tt(d) / 0.05)
    for _ in range(26):                                  # éclats secs
        i = int(rng.uniform(0, 0.24) * SR)
        g = filt(noise(0.004), 'highpass', 2500) * rng.uniform(0.3, 1.0)
        s[i:i + len(g)] += g[:len(s) - i]
    return s


def ding():
    d = 1.2
    x = tt(d)
    s = (np.sin(2 * np.pi * 1318.5 * x) * np.exp(-x / 0.35) + 0.6 * np.sin(2 * np.pi * 1975.5 * x) * np.exp(-x / 0.25)
         + 0.25 * np.sin(2 * np.pi * 2637 * x) * np.exp(-x / 0.12))
    return s * np.minimum(1, x / 0.003)


def thud(a=1.0):
    d = 0.18
    x = tt(d)
    f = 70 + 90 * np.exp(-x / 0.02)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.05)
    k = filt(noise(0.03), 'bp', (300, 2500)) * np.exp(-tt(0.03) / 0.006)
    s[:len(k)] += k * 0.5
    return s * a


def metal_click():
    d = 0.06
    x = tt(d)
    s = np.sin(2 * np.pi * 3300 * x) * np.exp(-x / 0.012) * 0.6 + np.sin(2 * np.pi * 5100 * x) * np.exp(-x / 0.006) * 0.3
    k = filt(noise(0.004), 'highpass', 4000) * np.exp(-tt(0.004) / 0.001)
    s[:len(k)] += k
    return s


def air(d, lo=200, hi=2200, att=0.4):
    x = tt(d)
    env = np.minimum(1, x / att) * np.minimum(1, (d - x) / 0.25)
    return filt(noise(d), 'bp', (lo, hi)) * np.clip(env, 0, 1)


def scribble(d=0.38):
    x = tt(d)
    mod = 0.55 + 0.45 * np.sin(2 * np.pi * 13 * x) ** 2
    return filt(noise(d), 'bp', (1500, 6000)) * mod * np.sin(np.pi * x / d) ** 0.6


def rumble(d=0.9):
    x = tt(d)
    return filt(noise(d), 'lowpass', 160) * np.exp(-x / 0.35) * np.minimum(1, x / 0.01)


# ---------------- 1. accroche ----------------
place(whoosh(0.22, 800, 6000), 0.0, 0.18)
place(impact(1.0), T('quatre'), 0.95)
for k in range(26):                                      # les 400 cases qui s'allument
    place(tick(0.6), T('quatre') + 0.02 + k * 0.012, 0.22, pan=np.sin(k) * 0.6)
place(impact(0.4), T('lycees'), 0.5)
place(impact(0.55), T('fermes'), 0.6)
for k in range(18):                                      # … puis se ferment
    place(tick(0.8), T('fermes') + 0.02 + k * 0.013, 0.2, pan=np.cos(k) * 0.6)
place(whoosh(0.3, 600, 4000), T('le_meme') - 0.12, 0.2)

# ---------------- 1b. mode vacances ----------------
place(whoosh(0.3, 400, 5000), T('etnon') - 0.16, 0.32)
place(pop(900, 1400), T('etnon') + 0.17, 0.3)
place(tick(1.0), T('vacances'), 0.7); place(tick(0.8), T('vacances') + 0.03, 0.6)
place(impact(0.35), T('vacances'), 0.45)

# ---------------- 2. Créteil + carte ----------------
place(whoosh(0.3, 500, 5000), 4.72, 0.3)
place(buzz(160), 4.99, 0.22); place(buzz(160), 5.12, 0.18)
for t0 in (5.08, 5.38, 5.66, T('le21')):
    for k in range(9):
        place(tick(rng.uniform(0.5, 1.0)), t0 + k * 0.026, 0.28, pan=0.2)
place(impact(0.5), T('creteil'), 0.55)
place(impact(0.35), T('vingt21'), 0.42)
place(whoosh(0.34, 300, 3000, rev=True), 7.08, 0.35)
place(pop(1600, 900, 0.06), 7.42, 0.35)
place(air(1.35, 800, 7000, att=1.1), 7.45, 0.12)        # la vague qui traverse la carte
place(impact(0.6), T('france'), 0.65)

# ---------------- 3. griefs ----------------
place(whoosh(0.28, 500, 5000), 9.24, 0.3)
place(buzz(120, 0.12), T('profs'), 0.3); place(buzz(120, 0.12), T('profs') + 0.16, 0.25)
place(filt(noise(0.12), 'bp', (1000, 6000)) * np.exp(-tt(0.12) / 0.03), T('profs'), 0.25)
for k in range(10):
    place(tick(rng.uniform(0.5, 1.0)), T('rempl') + k * 0.03, 0.26)
place(whoosh(0.26, 600, 5000), 10.50, 0.28)
place(impact(0.5), T('bat'), 0.55)
place(impact(0.45), T('bout'), 0.5)
place(crack(), T('bout') + 0.12, 0.42)
place(thud(0.8), T('bout') + 0.14, 0.4)
place(whoosh(0.26, 600, 5000), 11.70, 0.26)
place(impact(0.45), T('desrats'), 0.5)
for k in range(16):                                      # galop de rat
    place(tick(0.7), 12.72 + k * 0.026, 0.16, pan=-0.6 + k * 0.05)
for k in range(13):
    place(tick(0.7), 13.45 + k * 0.026, 0.16, pan=0.1 + k * 0.06)
place(squeak(), 13.16, 0.10, pan=0.05); place(squeak(0.05), 13.38, 0.08, pan=0.05)
place(pop(1100, 1500, 0.04), T('selon'), 0.18)

# ---------------- 4. la statistique ----------------
place(whoosh(0.3, 400, 5000), 14.52, 0.3)
place(impact(0.55), T('en'), 0.55)
for k in range(12):
    place(tick(0.6), T('en') + 0.22 + k * 0.03, 0.18, pan=-0.5 + k * 0.09)
place(whoosh(0.22, 800, 6000), 15.92, 0.18)
place(impact(1.0), T('dixpc'), 0.9)
for j in range(4):
    place(boing(), T('saute') + j * 0.07, 0.28, pan=(-0.5, 0.4, 0.6, -0.2)[j])
place(air(0.85, 300, 2600, att=0.35), T('lereve') - 0.05, 0.28)
place(whoosh(0.26, 500, 5000), 18.86, 0.26)
place(impact(0.5), T('bac'), 0.55)
place(pop(500, 800, 0.06), T('bac') + 0.1, 0.25)
for k in range(3):
    place(thud(0.35), T('ne') - 0.02 + k * 0.035, 0.35)
place(boing(300, 650, 0.12), T('saute2'), 0.22)
place(impact(0.6), T('saute2'), 0.55)
place(thud(1.0), 20.62, 0.75); place(impact(0.4), 20.62, 0.45)
place(metal_click(), 20.62, 0.25, pan=-0.4); place(metal_click(), 20.67, 0.25, pan=0.4)
place(pop(800, 1200), T('pas'), 0.22)

# ---------------- 5. gouvernement ----------------
place(whoosh(0.28, 500, 5000), 21.00, 0.28)
place(pop(600, 1000, 0.06), T('gouv') + 0.18, 0.25)
for k in range(0, 31, 2):
    place(tick(0.5), T('gouv') + 0.3 + k * 0.012, 0.14)
place(impact(0.4), T('fin'), 0.45)
place(scribble(), T('fin'), 0.2)
place(whoosh(0.2, 800, 5000), T('rappel') - 0.14, 0.2)
place(ding(), T('rappel') + 0.02, 0.32)

# ---------------- 6. mur, effondrement, logo ----------------
place(whoosh(0.28, 400, 4000), 24.36, 0.26)
order = sorted([(4 - ri) * 4 + k for ri, row in enumerate([3, 4, 3, 4, 3]) for k in range(row)])
for o in order:
    place(thud(0.55), T('nous') + 0.04 + o * 0.036, 0.3, pan=rng.uniform(-0.5, 0.5))
place(impact(0.45), T('bloque'), 0.5)
place(impact(0.9), T('debloque'), 0.85)
place(rumble(1.0), T('debloque'), 0.55)
for k in range(20):
    place(thud(rng.uniform(0.3, 0.7)), T('debloque') + 0.12 + rng.uniform(0, 0.75), 0.22, pan=rng.uniform(-0.8, 0.8))
place(metal_click(), T('debloque') + 0.34, 0.35)
place(pop(700, 1100, 0.05), T('site') - 0.04, 0.3)
place(pop(800, 1250, 0.05), T('pc') - 0.04, 0.3)
place(whoosh(0.4, 300, 6000, rev=True), 27.55, 0.38)
place(impact(1.0), 27.95, 0.85)
place(air(1.6, 4000, 12000, att=0.5), 28.0, 0.07)

# ---------------- sortie ----------------
mix = out[:int(SR * DUR)]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)                  # écrêtage doux
mix *= 10 ** (-3 / 20) / max(1e-6, np.abs(mix).max())    # crête à −3 dBFS (le niveau final se règle au mixage)
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'td06_sfx.wav', SR, (mix * 32767).astype(np.int16))
print('ok', mix.shape[0] / SR, 's')
