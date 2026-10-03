#!/usr/bin/env python3
"""Bande son du thème 03 (anti-arnaque) : tension, impact grave, aucun carillon de réussite.
Réutilise les fonctions de audio_theme01.py. Usage : python3 engine/audio_theme03.py sortie.wav"""
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_theme01.py'), encoding='utf-8').read()
head = src[:src.index('# ---------- 1. Nappe grave')].replace('DUR = 18.6', 'DUR = 17.8')
tail = src[src.index('# ---------- Réverbération'):].replace('[0, 0.05, 17.9, 18.6]', '[0, 0.05, 17.1, 17.8]').replace('theme01.wav', 'theme03.wav')
mid = r'''
pad_t = tt(DUR)
pad = (sine(55, DUR) * 0.55 + sine(77.8, DUR) * 0.35 + sine(110.5, DUR) * 0.2)   # tritone grave
pad *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.09 * pad_t)
env = np.interp(pad_t, [0, 2.4, 3.2, 8.4, 10.45, 10.95, 11.2, 12.6, 14.9, 15.8, 16.6, 17.8],
                [0, 0.55, 0.28, 0.32, 0.38, 0.03, 0.40, 0.30, 0.34, 0.50, 0.40, 0.0])
place(lp(pad, 700) * env * 0.5, 0, 1.0)
place(sweep_noise(1.0, 2500, 9000, 0.55, 0.45), 0.9, 0.14, 0.2, 0.3)
place(click(0.04, 1500), 1.72, 0.30)
place(sweep_noise(0.9, 250, 3800, 0.65, 0.45), 2.3, 0.26, 0.0, 0.15)
for i, t in enumerate([2.55, 2.62, 2.70, 2.82, 2.95, 3.08, 3.20]):
    place(sine(1700 + 160 * i, 0.05) * np.exp(-tt(0.05) / 0.012), t, 0.10, -0.4 + 0.12 * i)
place(sweep_noise(1.3, 220, 2400, 0.6, 0.5), 3.9, 0.12, 0, 0.1)
for ts, te in [(5.0, 5.5), (5.55, 5.8), (5.85, 6.1), (6.15, 6.4), (6.45, 6.7), (6.8, 7.05)]:
    for j in range(max(1, int((te - ts) / 0.045))):
        place(click(0.02, 3000 + 400 * rng.random()), ts + j * 0.045, 0.045, rng.uniform(-0.3, 0.3))
for t in [5.55, 5.9, 6.2, 6.5, 6.8, 7.15]:      # validations : tic sourd, pas de carillon
    place(decay(sine(330, 0.2), 0.05) * np.minimum(1, tt(0.2) / 0.003), t, 0.16, 0.0, 0.2)
place(sweep_noise(1.0, 400, 6500, 0.75, 0.45), 7.5, 0.24, 0.3, 0.15)
d = 1.5
rf = np.linspace(90, 700, int(SR * d))
rise = np.sin(2 * np.pi * np.cumsum(rf) / SR) * np.linspace(0, 1, int(SR * d)) ** 2.2
place(rise * 0.16, 8.9, 1.0, 0, 0.1)
place(sweep_noise(d, 600, 7500, 0.95, 0.6) * np.linspace(0, 1, int(SR * d)) ** 1.5, 8.9, 0.2, 0, 0.1)
for t in np.arange(10.45, 10.95, 0.1):
    place(click(0.03, 700), t, 0.12)
kf = 36 + 90 * np.exp(-tt(1.2) / 0.08)
place(np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-tt(1.2) / 0.35), 11.0, 0.9, 0, 0.30)   # impact grave
place(lp(noise(0.9), 1800) * np.exp(-tt(0.9) / 0.18), 11.0, 0.35, 0, 0.35)
place(decay(sine(41, 2.5), 0.9), 11.0, 0.30, 0, 0.2)
place(decay(sine(58, 2.0) + sine(82, 2.0) * 0.8, 0.7), 11.05, 0.12, 0, 0.5)               # intervalle dissonant
for t in [13.4, 13.6, 13.8, 14.0]:
    place(decay(sine(110, 0.5), 0.12) * np.minimum(1, tt(0.5) / 0.003), t, 0.34, 0.0, 0.3)
    place(lp(noise(0.2), 900) * np.exp(-tt(0.2) / 0.04), t, 0.14)
place(sweep_noise(1.6, 200, 2200, 0.7, 0.5), 14.9, 0.08, 0, 0.2)
place(decay(sine(61, 1.6), 0.5) * np.minimum(1, tt(1.6) / 0.01), 16.0, 0.5, 0, 0.2)
place(sweep_noise(0.9, 3000, 9000, 0.5, 0.4), 16.8, 0.07, 0.2, 0.3)
for f, dt in zip([523.25, 659.25, 783.99, 1046.5], [0, 0.07, 0.14, 0.21]):
    place(bell(f, 2.0, ((1, 1), (2, 0.2), (3, 0.06))), 16.05 + dt, 0.12, 0, 0.6)
'''
exec(compile(head + mid + tail, 'audio_theme03', 'exec'))
