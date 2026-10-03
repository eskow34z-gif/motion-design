#!/usr/bin/env python3
"""Bande son du thème 01, synthétisée de zéro (numpy/scipy), calée sur theme01.html.
Usage : python3 engine/audio_theme01.py sortie.wav
Les temps ci-dessous doivent rester alignés avec la timeline de theme01.html."""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
DUR = 18.6
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)
REV = np.zeros(N)  # envoi réverbération (mono)


def tt(d):
    return np.arange(int(SR * d)) / SR


def place(sig, t0, gain=1.0, pan=0.0, rev=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    s = sig[: N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(s)] += s * l
    R[i:i + len(s)] += s * r
    if rev:
        REV[i:i + len(s)] += s * rev


def band(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return sosfilt(sos, x)


def hp(x, f):
    return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)


def lp(x, f):
    return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)


def noise(d):
    return rng.standard_normal(int(SR * d))


def sweep_noise(d, f0, f1, peak=0.5, width=0.5):
    """Souffle de bruit filtré dont la fréquence glisse de f0 à f1, enveloppe en cloche."""
    n = int(SR * d)
    x = noise(d)
    out = np.zeros(n)
    blocks = 40
    bl = n // blocks
    for b in range(blocks):
        f = f0 * (f1 / f0) ** (b / (blocks - 1))
        seg = x[b * bl:(b + 1) * bl + 400]
        y = band(seg, max(40, f * 0.6), min(SR / 2 - 100, f * 1.5))
        out[b * bl:b * bl + bl] = y[:bl]
    t = np.linspace(0, 1, n)
    env = np.exp(-((t - peak) / width) ** 2 * 3.0)
    return out * env


def decay(sig, tau):
    return sig * np.exp(-tt(len(sig) / SR) / tau)


def sine(f, d, ph=0.0):
    return np.sin(2 * np.pi * f * tt(d) + ph)


def click(d=0.03, f=1800):
    x = sine(f, d) * np.exp(-tt(d) / 0.006)
    return x + hp(noise(d), 3000) * np.exp(-tt(d) / 0.002) * 0.5


def bell(f, d=1.6, parts=((1, 1), (2.76, 0.4), (5.4, 0.15), (1.5, 0.25))):
    x = np.zeros(int(SR * d))
    for m, a in parts:
        x += a * sine(f * m, d) * np.exp(-tt(d) / (d * 0.28 / np.sqrt(m)))
    return x * np.minimum(1, tt(d) / 0.004)


# ---------- 1. Nappe grave ----------
pad_t = tt(DUR)
pad = (sine(55, DUR) * 0.55 + sine(82.4, DUR) * 0.35 + sine(110.5, DUR) * 0.22 + sine(164.8, DUR, 1.0) * 0.1)
pad *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * pad_t)
env = np.interp(pad_t, [0, 2.4, 3.2, 12.9, 13.0, 13.7, 14.4, 16.8, 17.4, 18.0, 18.6],
                [0, 0.55, 0.28, 0.30, 0.04, 0.04, 0.26, 0.34, 0.50, 0.30, 0.0])
place(lp(pad, 700) * env * 0.5, 0, 1.0)

# ---------- 2. Intro ----------
place(sweep_noise(1.0, 2500, 9000, 0.55, 0.45), 0.9, 0.14, 0.2, 0.3)          # reflet métal
place(click(0.04, 1500), 1.72, 0.30)                                           # tick wordmark
place(band(noise(0.7), 500, 2500) * np.exp(-tt(0.7) / 0.25), 1.72, 0.12, 0, 0.2)  # souffle
place(sweep_noise(0.9, 250, 3800, 0.65, 0.45), 2.3, 0.26, 0.0, 0.15)           # vol du logo
place(sine(180, 0.9) * np.linspace(0, 1, int(SR * 0.9)) ** 2 * 0.05, 2.3, 1.0)

# ---------- 3. Réveil de l'UI : ticks en stagger ----------
for i, t in enumerate([2.55, 2.62, 2.70, 2.78, 2.88, 3.02, 3.10, 3.18, 3.26]):
    f = 1700 + 140 * i
    place(sine(f, 0.05) * np.exp(-tt(0.05) / 0.012), t, 0.10, -0.4 + 0.1 * i)

# ---------- 4. Focus A8 ----------
place(sweep_noise(1.1, 220, 2400, 0.6, 0.5), 4.5, 0.16, 0, 0.1)
place(click(0.05, 2200), 5.9, 0.07)                                            # arrivée du curseur
place(click(0.05, 1300), 6.05, 0.42)                                           # CLICK
place(decay(sine(95, 0.3), 0.08), 6.05, 0.35)

# ---------- 5. Whip vers l'analyse ----------
place(sweep_noise(1.2, 160, 5200, 0.55, 0.42), 6.2, 0.34, 0.0, 0.1)
place(decay(sine(70, 0.5), 0.15), 7.1, 0.12)

# ---------- 6. Saisie + validation des champs ----------
for ts, te in [(7.45, 7.95), (8.0, 8.3), (8.35, 8.65), (8.7, 8.95), (9.05, 9.3), (9.8, 10.0)]:
    k = max(1, int((te - ts) / 0.045))
    for j in range(k):
        place(click(0.02, 3000 + 400 * rng.random()), ts + j * 0.045, 0.045, rng.uniform(-0.3, 0.3))
pent = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]
for f, t in zip(pent, [8.0, 8.4, 8.75, 9.1, 9.45, 9.8, 10.15]):
    place(bell(f, 0.9, ((1, 1), (2, 0.25), (3, 0.08))), t, 0.17, 0.0, 0.35)

# ---------- 7. Comète ----------
place(sweep_noise(0.9, 400, 6500, 0.75, 0.45), 10.45, 0.24, 0.3, 0.15)
place(sine(220, 0.9) * np.linspace(0, 1, int(SR * 0.9)) ** 2 * np.sin(np.linspace(0, 40, int(SR * 0.9))) * 0.05, 10.45, 1.0)

# ---------- 8. Score : montée de tension ----------
d = 1.7
rise_f = np.linspace(110, 520, int(SR * d))
rise = np.sin(2 * np.pi * np.cumsum(rise_f) / SR) * np.linspace(0, 1, int(SR * d)) ** 2.2
place(rise * 0.16, 11.3, 1.0, 0, 0.1)
place(sweep_noise(d, 600, 7500, 0.95, 0.6) * np.linspace(0, 1, int(SR * d)) ** 1.5, 11.3, 0.2, 0, 0.1)
for t, f in zip([12.2, 12.45, 12.7], [880, 988, 1175]):
    place(click(0.04, f), t, 0.34, 0.15)
    place(decay(sine(f, 0.12), 0.03), t, 0.10)

# ---------- 9. Impact sur 87 ----------
n_k = int(SR * 0.9)
kf = 38 + 90 * np.exp(-tt(0.9) / 0.07)
kick = np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-tt(0.9) / 0.22)
burst = lp(noise(0.7), 2400) * np.exp(-tt(0.7) / 0.14)
place(kick, 13.05, 0.78, 0, 0.30)
place(burst, 13.05, 0.30, 0, 0.35)
place(hp(noise(0.25), 5000) * np.exp(-tt(0.25) / 0.05), 13.05, 0.10, 0, 0.3)

# ---------- 10. Récompense ----------
place(bell(880, 2.0), 13.7, 0.22, -0.2, 0.55)
place(bell(1318.5, 2.0), 13.85, 0.17, 0.2, 0.55)
place(bell(1760, 1.6, ((1, 1), (2.76, 0.3))), 13.98, 0.09, 0.0, 0.55)

# ---------- 11. Outro ----------
place(sweep_noise(1.6, 200, 2200, 0.7, 0.5), 15.4, 0.08, 0, 0.2)
place(decay(sine(61, 1.6), 0.5) * np.minimum(1, tt(1.6) / 0.01), 16.9, 0.5, 0, 0.2)
place(sweep_noise(0.9, 3000, 9000, 0.5, 0.4), 17.3, 0.07, 0.2, 0.3)
for f, dt in zip([523.25, 659.25, 783.99, 1046.5], [0, 0.07, 0.14, 0.21]):
    place(bell(f, 2.0, ((1, 1), (2, 0.2), (3, 0.06))), 16.95 + dt, 0.12, 0, 0.6)

# ---------- Réverbération ----------
ir_t = tt(1.6)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.42)
ir = lp(ir, 5500)
ir /= np.sqrt(np.sum(ir ** 2))
wet = fftconvolve(REV, ir)[:N]
L += wet * 0.55
R += np.roll(wet, 311) * 0.55

# ---------- Master ----------
fade = np.interp(np.arange(N) / SR, [0, 0.05, 17.9, 18.6], [0, 1, 1, 0])
L *= fade
R *= fade
m = np.max(np.abs([L, R]))
L, R = np.tanh(L / m * 1.35) / np.tanh(1.35), np.tanh(R / m * 1.35) / np.tanh(1.35)
peak = 0.89
L, R = L * peak, R * peak
out = np.stack([L, R], axis=1)
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'theme01.wav', SR, (out * 32767).astype(np.int16))
rms = np.sqrt(np.mean(out ** 2))
print(f'durée {DUR}s  crête {np.max(np.abs(out)):.2f}  RMS {20 * np.log10(rms):.1f} dBFS')
# crête par seconde (vérification de la dynamique)
sec = [f'{np.max(np.abs(out[int(s * SR):int((s + 1) * SR)])):.2f}' for s in range(int(DUR))]
print('crête/seconde:', ' '.join(sec))
