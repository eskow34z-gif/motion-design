#!/usr/bin/env python3
"""Bande son du thème 02 (Sniper). Reprend les fonctions de audio_theme01.py puis place les événements de theme02.html.
Usage : python3 engine/audio_theme02.py sortie.wav"""
import sys, re, os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_theme01.py'), encoding='utf-8').read()
head = src[:src.index('# ---------- 1. Nappe grave')]
tail = src[src.index('# ---------- Réverbération'):]
head = head.replace('DUR = 18.6', 'DUR = 16.8')
mid = r'''
pad_t = tt(DUR)
pad = (sine(55, DUR) * 0.55 + sine(82.4, DUR) * 0.35 + sine(110.5, DUR) * 0.22)
pad *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * pad_t)
env = np.interp(pad_t, [0, 2.4, 3.2, 9.7, 9.95, 10.1, 10.6, 13.4, 14.4, 15.4, 16.2, 16.8],
                [0, 0.55, 0.28, 0.34, 0.02, 0.30, 0.30, 0.26, 0.34, 0.50, 0.30, 0.0])
place(lp(pad, 700) * env * 0.5, 0, 1.0)
# intro
place(sweep_noise(1.0, 2500, 9000, 0.55, 0.45), 0.9, 0.14, 0.2, 0.3)
place(click(0.04, 1500), 1.72, 0.30)
place(sweep_noise(0.9, 250, 3800, 0.65, 0.45), 2.3, 0.26, 0.0, 0.15)
for i, t in enumerate([2.55, 2.62, 2.70, 2.78, 2.88, 3.02, 3.10, 3.18, 3.26]):
    place(sine(1700 + 140 * i, 0.05) * np.exp(-tt(0.05) / 0.012), t, 0.10, -0.4 + 0.1 * i)
# focus + pings sonar
place(sweep_noise(1.0, 220, 2400, 0.6, 0.5), 4.5, 0.14, 0, 0.1)
for t in [5.2, 5.7, 6.2]:
    place(decay(sine(1480, 0.9), 0.25) * np.minimum(1, tt(0.9) / 0.003), t, 0.20, 0.0, 0.6)
    place(decay(sine(740, 0.9), 0.3), t, 0.10, 0.0, 0.5)
# scan
place(sweep_noise(1.6, 300, 6000, 0.6, 0.5), 6.5, 0.22, 0.0, 0.15)
for t, f in zip([6.6, 6.95, 7.3, 7.65], [988, 1175, 1319, 1568]):
    place(click(0.04, f), t, 0.30, 0.0, 0.2)
# tension -> silence -> lock
d = 1.2
rf = np.linspace(120, 900, int(SR * d))
rise = np.sin(2 * np.pi * np.cumsum(rf) / SR) * np.linspace(0, 1, int(SR * d)) ** 2.2
place(rise * 0.15, 8.6, 1.0, 0, 0.1)
place(sweep_noise(1.2, 600, 8000, 0.95, 0.6) * np.linspace(0, 1, int(SR * d)) ** 1.5, 8.6, 0.2, 0, 0.1)
for i, t in enumerate(np.arange(9.2, 9.8, 0.1)):
    place(click(0.03, 1200 + 150 * i), t, 0.18)
place(click(0.05, 2600), 10.0, 0.45)
n_k = int(SR * 0.9)
kf = 38 + 90 * np.exp(-tt(0.9) / 0.07)
place(np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-tt(0.9) / 0.22), 10.05, 0.78, 0, 0.30)
place(lp(noise(0.7), 2400) * np.exp(-tt(0.7) / 0.14), 10.05, 0.30, 0, 0.35)
for j in range(17):
    place(click(0.02, 3200 + 60 * j), 10.05 + j * 0.05, 0.05, 0.0)
place(bell(880, 2.0), 10.95, 0.22, -0.2, 0.55)
place(bell(1318.5, 2.0), 11.1, 0.17, 0.2, 0.55)
place(bell(1760, 1.6, ((1, 1), (2.76, 0.3))), 11.23, 0.09, 0.0, 0.55)
place(click(0.05, 2200), 11.9, 0.07)
place(click(0.05, 1300), 12.5, 0.42)
place(decay(sine(95, 0.3), 0.08), 12.5, 0.35)
# outro
place(sweep_noise(1.6, 200, 2200, 0.7, 0.5), 13.4, 0.08, 0, 0.2)
place(decay(sine(61, 1.6), 0.5) * np.minimum(1, tt(1.6) / 0.01), 14.9, 0.5, 0, 0.2)
place(sweep_noise(0.9, 3000, 9000, 0.5, 0.4), 15.7, 0.07, 0.2, 0.3)
for f, dt in zip([523.25, 659.25, 783.99, 1046.5], [0, 0.07, 0.14, 0.21]):
    place(bell(f, 2.0, ((1, 1), (2, 0.2), (3, 0.06))), 14.95 + dt, 0.12, 0, 0.6)

'''
tail = tail.replace('[0, 0.05, 17.9, 18.6]', '[0, 0.05, 16.1, 16.8]').replace("theme01.wav", "theme02.wav")
open('/tmp/_a2.py', 'w', encoding='utf-8').write(head + mid + tail)
exec(compile(head + mid + tail, 'audio_theme02', 'exec'))
