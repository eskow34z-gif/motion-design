#!/usr/bin/env python3
"""Bande son TD03 « ÉTAL » : film de marque, 72 BPM, feutré, aucune voix, aucun impact agressif.
Piano-feutre, nappe chaude, quelques sons concrets très discrets.
Réutilise les générateurs de audio_theme01.py. Usage : python3 engine/audio_theme_td03.py sortie.wav"""
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_theme01.py'), encoding='utf-8').read()
head = src[:src.index('# ---------- 1. Nappe grave')].replace('DUR = 18.6', 'DUR = 28.0')
tail = src[src.index('# ---------- Réverbération'):] \
    .replace('[0, 0.05, 17.9, 18.6]', '[0, 0.3, 27.1, 28.0]') \
    .replace('theme01.wav', 'theme_td03.wav') \
    .replace('np.tanh(L / m * 1.35) / np.tanh(1.35)', 'np.tanh(L / m * 1.10) / np.tanh(1.10)') \
    .replace('np.tanh(R / m * 1.35) / np.tanh(1.35)', 'np.tanh(R / m * 1.10) / np.tanh(1.10)') \
    .replace('peak = 0.89', 'peak = 0.80')

mid = r'''
def decay(sig, tau):
    return sig * np.exp(-(np.arange(len(sig)) / SR) / tau)


def felt(f, d=3.2, g=1.0):
    """Piano feutré : fondamentale douce, peu d'harmoniques, attaque amortie."""
    x = np.zeros(int(SR * d))
    for m, a, dm in ((1, 1.0, 1.0), (2, 0.16, 1.5), (3, 0.055, 2.2), (4.1, 0.02, 3.0)):
        x += a * sine(f * m, d) * np.exp(-(np.arange(int(SR * d)) / SR) / (d * 0.30 / dm))
    att = np.minimum(1, (np.arange(int(SR * d)) / SR) / 0.012)
    body = lp(x * att, 2600)
    th = lp(noise(0.05), 1400) * np.exp(-tt(0.05) / 0.012) * 0.10   # bruit de marteau
    body[:len(th)] += th
    return body * g


def pulse(f=180, d=0.5):
    return lp(noise(d), f) * np.exp(-tt(d) / 0.06)


# ---------- 1. Nappe chaude ----------
pad_t = tt(DUR)
pad = (sine(65.4, DUR) * 0.5 + sine(98.0, DUR) * 0.3
       + sine(130.8, DUR) * 0.2 + sine(196.0, DUR, 0.6) * 0.09)
pad *= 0.68 + 0.32 * np.sin(2 * np.pi * 0.055 * pad_t)
env = np.interp(pad_t,
                [0, 1.2, 4.6, 5.2, 8.2, 10.1, 11.6, 15.4, 19.6, 20.9, 23.5, 25.7, 27.0, 28.0],
                [0, 0.34, 0.36, 0.24, 0.20, 0.30, 0.40, 0.40, 0.42, 0.52, 0.44, 0.50, 0.40, 0.0])
place(lp(pad, 620) * env * 0.52, 0, 1.0)
air = lp(noise(DUR), 360) * np.interp(pad_t, [0, 0.8, 26.5, 28.0], [0, 0.05, 0.05, 0])
place(air, 0, 0.45)

# souffle de pièce : très léger, donne le volume du lieu
room = band(noise(DUR), 180, 1400) * np.interp(pad_t, [0, 1.0, 10.0, 11.0], [0, 0.030, 0.030, 0])
place(room, 0, 0.5, 0, 0.2)

# ---------- 2. Motif de piano feutré, 72 BPM ----------
Bq = 60.0 / 72.0
MOTIF = [
    (0.55, 329.63, 0.26), (0.55 + Bq, 392.00, 0.20), (0.55 + 2 * Bq, 261.63, 0.22),
    (2.85, 440.00, 0.22), (2.85 + Bq, 392.00, 0.17),
    (5.30, 293.66, 0.22), (5.30 + Bq, 349.23, 0.18), (5.30 + 2 * Bq, 261.63, 0.20),
    (7.95, 246.94, 0.21), (8.75, 220.00, 0.19),
    (10.35, 329.63, 0.26), (10.35 + Bq, 392.00, 0.22), (10.35 + 2 * Bq, 523.25, 0.21),
    (12.95, 440.00, 0.21), (13.75, 392.00, 0.18),
    (15.65, 329.63, 0.24), (15.65 + Bq, 440.00, 0.20), (15.65 + 2 * Bq, 523.25, 0.19),
    (18.10, 392.00, 0.20),
    (19.85, 392.00, 0.26), (19.85 + Bq, 523.25, 0.24), (19.85 + 2 * Bq, 659.25, 0.22),
    (22.15, 587.33, 0.20),
    (23.80, 329.63, 0.24), (23.80 + Bq, 392.00, 0.22), (23.80 + 2 * Bq, 523.25, 0.20),
]
for t, f, g in MOTIF:
    place(felt(f, 3.4, g), t, 1.0, np.interp(f, [220, 660], [-0.22, 0.22]), 0.42)

# basses tenues, une par scène
for t, f, g in [(0.4, 65.41, 0.26), (5.1, 58.27, 0.22), (10.2, 65.41, 0.26),
                (15.5, 73.42, 0.24), (19.7, 87.31, 0.28), (23.6, 65.41, 0.28)]:
    place(decay(sine(f, 5.0) + sine(f * 2, 5.0) * 0.3, 1.9), t, g, 0, 0.18)

# ---------- 3. Scène 1 : la boutique ouvre, rien ne sonne ----------
place(pulse(240, 0.5), 1.05, 0.10, -0.25, 0.3)                 # la tasse qu'on pose
place(decay(sine(520, 0.5), 0.07), 1.05, 0.045, -0.25, 0.3)
place(pulse(170, 0.6), 1.95, 0.085, 0.1, 0.3)                  # le téléphone qu'on pose
# (aucune sonnerie : c'est le sujet de la scène)

# ---------- 4. Scène 2 : la recherche ----------
for j in range(13):                                            # frappe très douce
    place(click(0.015, 2100 + 260 * np.random.default_rng(j).random()), 6.50 + j * 0.072,
          0.030, -0.2 + 0.03 * j, 0.1)
for i, t in enumerate([7.62, 7.84, 8.06]):                     # les résultats qui se posent
    place(pulse(300, 0.4), t, 0.065, -0.1 + 0.1 * i, 0.26)
place(decay(sine(110, 2.2) + sine(164.8, 2.2) * 0.5, 0.85), 8.55, 0.17, 0, 0.3)   # le vide
place(lp(noise(1.0), 700) * np.exp(-tt(1.0) / 0.3), 8.55, 0.06, 0, 0.25)

# ---------- 5. Scène 3 : l'écran s'allume ----------
place(sweep_noise(1.3, 300, 3400, 0.5, 0.5), 10.85, 0.085, 0, 0.3)   # le portable qu'on ouvre
place(sweep_noise(1.0, 1800, 6400, 0.35, 0.45), 11.80, 0.075, 0.1, 0.35)
for f, dt in zip([523.25, 659.25, 783.99], [0, 0.06, 0.12]):
    place(felt(f, 2.4, 0.11), 11.85 + dt, 1.0, 0.05, 0.45)

# ---------- 6. Scène 4 : le formulaire ----------
for ts, te in [(16.55, 16.95), (17.05, 17.45), (17.55, 17.90)]:
    k = max(1, int((te - ts) / 0.062))
    for j in range(k):
        place(click(0.014, 2300), ts + j * 0.062, 0.026, 0.0, 0.1)
for t in [16.95, 17.45, 17.90]:
    place(decay(sine(880, 0.3), 0.055), t, 0.055, 0.12, 0.3)
place(pulse(220, 0.45), 18.22, 0.085, 0, 0.26)                       # l'envoi
for f, dt in zip([523.25, 783.99], [0, 0.08]):                       # accusé de réception
    place(felt(f, 2.6, 0.15), 18.50 + dt, 1.0, 0, 0.5)

# ---------- 7. Scène 5 : la fiche se remplit, le téléphone s'anime ----------
for t in [20.90, 21.12]:                                             # deux vibrations courtes
    v = decay(sine(62, 0.26) * (0.6 + 0.4 * np.sin(2 * np.pi * 42 * tt(0.26))), 0.085)
    place(v, t, 0.20, 0, 0.1)
    place(lp(noise(0.2), 320) * np.exp(-tt(0.2) / 0.05), t, 0.07)
for i in range(5):                                                   # les étoiles
    place(decay(sine(1046.5 * (1.06 ** i), 0.4), 0.065), 21.40 + i * 0.09,
          0.05, -0.2 + 0.1 * i, 0.4)

# ---------- 8. Scène 6 : l'encart et le logo ----------
place(sweep_noise(1.0, 260, 2600, 0.45, 0.5), 24.00, 0.085, 0, 0.3)  # la carte qu'on pose
place(pulse(260, 0.5), 24.05, 0.075, 0, 0.3)
for i in range(4):
    place(decay(sine([587.33, 659.25, 783.99, 880.0][i], 0.5), 0.08),
          24.55 + i * 0.13, 0.045, -0.18 + 0.12 * i, 0.35)
place(decay(sine(240, 0.5), 0.05), 24.92, 0.05, 0.1, 0.25)           # le prix barré

LOGO = 25.75
for f, dt in zip([130.81, 196.0, 261.63, 392.0, 523.25], [0, 0.05, 0.10, 0.15, 0.20]):
    place(felt(f, 4.2, 0.20), LOGO + dt, 1.0, 0, 0.60)
place(sweep_noise(1.4, 2000, 7200, 0.4, 0.5), LOGO + 0.35, 0.065, 0.12, 0.38)
place(decay(sine(65.41, 3.4) + sine(98.0, 3.4) * 0.5, 1.5), LOGO, 0.26, 0, 0.25)
'''
exec(compile(head + mid + tail, 'audio_theme_td03', 'exec'))
