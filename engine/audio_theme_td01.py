#!/usr/bin/env python3
"""Bande son du thème Tech&Dev TD01, synthétisée de zéro (aucune musique existante, aucune voix).
Réutilise les générateurs de audio_theme01.py. Les temps suivent theme-td01.html.
Usage : python3 engine/audio_theme_td01.py sortie.wav"""
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_theme01.py'), encoding='utf-8').read()
head = src[:src.index('# ---------- 1. Nappe grave')].replace('DUR = 18.6', 'DUR = 27.0')
tail = src[src.index('# ---------- Réverbération'):] \
    .replace('[0, 0.05, 17.9, 18.6]', '[0, 0.05, 26.35, 27.0]') \
    .replace('theme01.wav', 'theme_td01.wav')

mid = r'''
HERO = 14.95


def decay(sig, tau):           # version robuste : l'enveloppe suit la longueur réelle du signal
    return sig * np.exp(-(np.arange(len(sig)) / SR) / tau)

# ---------- 1. Nappe : accord ouvert (confiance, pas de tension) ----------
pad_t = tt(DUR)
pad = (sine(55, DUR) * 0.55 + sine(82.4, DUR) * 0.34
       + sine(110.0, DUR) * 0.22 + sine(164.8, DUR, 1.0) * 0.11)
pad *= 0.62 + 0.38 * np.sin(2 * np.pi * 0.085 * pad_t)
env = np.interp(pad_t,
                [0, 2.4, 3.3, 7.0, 7.6, 11.9, 12.8, 14.35, 14.58, 14.92, 15.05,
                 17.4, 19.6, 22.6, 23.6, 24.8, 25.4, 26.2, 27.0],
                [0, 0.52, 0.26, 0.26, 0.34, 0.34, 0.30, 0.34, 0.05, 0.02, 0.52,
                 0.34, 0.36, 0.40, 0.46, 0.30, 0.50, 0.38, 0.0])
place(lp(pad, 700) * env * 0.5, 0, 1.0)

# souffle d'air continu, très bas, qui tient l'espace
air = lp(noise(DUR), 420) * np.interp(pad_t, [0, 2.4, 24.9, 27.0], [0, 0.05, 0.05, 0])
place(air, 0, 0.5)

# pulsation sub discrète pendant le corps de la vidéo
for t in np.arange(7.6, 22.9, 0.8):
    if 14.55 < t < 14.95:
        continue
    place(decay(sine(48, 0.4), 0.09) * np.minimum(1, tt(0.4) / 0.004), t, 0.17, 0.0, 0.05)

# ---------- 2. Intro : révélation du logo ----------
place(sweep_noise(1.0, 2500, 9000, 0.55, 0.45), 0.95, 0.15, 0.2, 0.30)   # reflet sur le métal
place(click(0.04, 1500), 1.72, 0.28)                                      # pose du wordmark
place(band(noise(0.7), 500, 2500) * np.exp(-tt(0.7) / 0.25), 1.72, 0.11, 0, 0.2)
place(bell(329.63, 1.8, ((1, 1), (2, 0.3), (3, 0.1), (4, 0.05))), 1.74, 0.13, 0, 0.45)
place(sweep_noise(0.95, 250, 3800, 0.65, 0.45), 2.35, 0.26, 0.0, 0.15)    # vol vers la barre de nav
place(sine(180, 0.9) * np.linspace(0, 1, int(SR * 0.9)) ** 2 * 0.05, 2.35, 1.0)

# ---------- 3. Réveil du site : faisceau + entrées ----------
place(sweep_noise(1.2, 320, 4200, 0.45, 0.4), 2.4, 0.22, 0, 0.12)
for i, t in enumerate([2.52, 2.60, 2.68, 2.78, 2.90, 3.04, 3.14, 3.24, 3.34]):
    place(sine(1680 + 150 * i, 0.05) * np.exp(-tt(0.05) / 0.012), t, 0.095, -0.4 + 0.1 * i)
for i, t in enumerate([3.55, 3.72, 3.89]):                                # les trois lignes du titre
    place(decay(sine(392 * (1 + 0.12 * i), 0.5), 0.1) * np.minimum(1, tt(0.5) / 0.003), t, 0.15, 0, 0.3)
place(click(0.04, 2100), 4.25, 0.07)
for t, pn in [(4.62, -0.18), (4.74, 0.18)]:                               # les deux boutons
    place(decay(sine(240, 0.3), 0.07) * np.minimum(1, tt(0.3) / 0.003), t, 0.20, pn, 0.2)
    place(click(0.025, 2600), t, 0.07, pn)

# ---------- 4. Whip vers les services ----------
place(sweep_noise(1.25, 170, 5400, 0.55, 0.42), 6.95, 0.36, 0.25, 0.12)
place(decay(sine(72, 0.5), 0.15), 7.55, 0.13)
place(sweep_noise(0.9, 300, 3600, 0.5, 0.4), 7.95, 0.14, 0, 0.1)

# ---------- 5. Onglets et cartes ----------
for i, t in enumerate([8.55, 8.65, 8.75]):                                # les trois cartes
    place(decay(sine(196, 0.4), 0.09) * np.minimum(1, tt(0.4) / 0.003), t, 0.17, -0.3 + 0.3 * i, 0.22)
for i, t in enumerate([8.78, 9.98]):                                      # changements d'onglet
    place(click(0.03, 1900 + 300 * i), t, 0.22)
    place(sweep_noise(0.45, 600, 2600, 0.4, 0.4), t, 0.15, 0.1, 0.12)
    place(decay(sine(523.25 * (1 + 0.26 * i), 0.5), 0.1), t + 0.03, 0.11, 0, 0.3)

# ---------- 6. Comète : services -> tarifs ----------
d = 0.85
cf = np.linspace(260, 1500, int(SR * d))
place(np.sin(2 * np.pi * np.cumsum(cf) / SR) * np.linspace(0, 1, int(SR * d)) ** 2 * 0.12, 11.95, 1.0, 0, 0.2)
place(sweep_noise(0.95, 400, 6800, 0.72, 0.45), 11.95, 0.28, 0.3, 0.18)
place(decay(sine(66, 0.6), 0.16), 12.70, 0.16)
place(sweep_noise(1.1, 330, 4200, 0.45, 0.4), 12.30, 0.20, 0, 0.12)

# ---------- 7. La carte du pack : la liste se coche ----------
place(decay(sine(220, 0.5), 0.11) * np.minimum(1, tt(0.5) / 0.003), 13.55, 0.18, 0, 0.25)
for i, f in enumerate([523.25, 587.33, 659.25, 783.99]):
    place(bell(f, 0.8, ((1, 1), (2, 0.24), (3, 0.07))), 14.0 + i * 0.14, 0.15, -0.2 + 0.13 * i, 0.33)
    place(click(0.02, 3400), 14.0 + i * 0.14, 0.05)

# ---------- 8. Moment héroïque : montée, silence, impact ----------
d = 1.1
rf = np.linspace(110, 760, int(SR * d))
place(np.sin(2 * np.pi * np.cumsum(rf) / SR) * np.linspace(0, 1, int(SR * d)) ** 2.3 * 0.15, 13.75, 1.0, 0, 0.1)
place(sweep_noise(d, 700, 8200, 0.95, 0.55) * np.linspace(0, 1, int(SR * d)) ** 1.6, 13.75, 0.17, 0, 0.1)
# (14.58 -> 14.92 : silence, la nappe tombe)
kf = 42 + 96 * np.exp(-tt(1.3) / 0.075)
place(np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-tt(1.3) / 0.33), HERO, 0.92, 0, 0.26)   # impact grave
place(lp(noise(0.8), 2000) * np.exp(-tt(0.8) / 0.14), HERO, 0.26, 0, 0.30)
place(decay(sine(55, 2.6), 1.0), HERO, 0.30, 0, 0.18)
for f, dt in zip([523.25, 659.25, 783.99, 1046.5, 1318.5], [0, 0.045, 0.09, 0.135, 0.18]):
    place(bell(f, 2.4, ((1, 1), (2, 0.22), (3, 0.07), (4.2, 0.03))), HERO + dt, 0.165, 0, 0.55)
place(sweep_noise(1.5, 2200, 11000, 0.3, 0.5), HERO + 0.05, 0.11, 0, 0.35)                   # paillettes
place(click(0.035, 1700), HERO + 0.42, 0.26)                                                  # badge −46%
place(decay(sine(392, 0.6), 0.13) * np.minimum(1, tt(0.6) / 0.003), HERO + 0.42, 0.17, 0.15, 0.3)

# ---------- 9. Cascade des colonnes de tarifs ----------
place(sweep_noise(1.0, 280, 3400, 0.5, 0.42), 17.3, 0.17, 0, 0.12)
for i in range(3):
    t0 = 17.35 + i * 0.16
    place(decay(sine(174.6 * (1 + 0.1 * i), 0.45), 0.1) * np.minimum(1, tt(0.45) / 0.003), t0, 0.15, -0.3 + 0.3 * i, 0.2)
    for j in range(7 if i < 2 else 5):
        place(click(0.018, 2600 + 90 * j), t0 + 0.25 + j * 0.075, 0.055, -0.3 + 0.3 * i)

# ---------- 10. Whip vers le contact, saisie, envoi ----------
place(sweep_noise(1.2, 180, 5200, 0.55, 0.42), 19.45, 0.33, -0.25, 0.12)
place(decay(sine(70, 0.5), 0.15), 20.0, 0.12)
for ts, te in [(19.95, 20.45), (20.60, 21.15), (21.55, 22.05)]:
    for j in range(max(1, int((te - ts) / 0.042))):
        place(click(0.02, 3000 + 400 * rng.random()), ts + j * 0.042, 0.042, rng.uniform(-0.3, 0.3))
for f, t in zip([523.25, 659.25, 783.99, 880.0], [20.55, 21.25, 21.42, 22.12]):
    place(bell(f, 0.9, ((1, 1), (2, 0.25), (3, 0.08))), t, 0.16, 0.0, 0.33)
place(click(0.05, 1200), 22.30, 0.40)                                                         # appui sur le bouton
place(decay(sine(88, 0.55), 0.13), 22.30, 0.30, 0, 0.2)
place(sweep_noise(1.3, 500, 7000, 0.25, 0.5), 22.32, 0.17, 0, 0.3)                             # onde
for f, t, pn in [(1046.5, 22.50, -0.15), (1318.5, 22.62, 0.15)]:                               # les deux badges
    place(bell(f, 1.5, ((1, 1), (2, 0.2), (3, 0.06))), t, 0.17, pn, 0.5)

# ---------- 11. Assemblage et extinction ----------
d = 1.25
af = np.linspace(130, 620, int(SR * d))
place(np.sin(2 * np.pi * np.cumsum(af) / SR) * np.linspace(0, 1, int(SR * d)) ** 2 * 0.13, 23.45, 1.0, 0, 0.18)
place(sweep_noise(1.3, 600, 7600, 0.9, 0.55), 23.45, 0.16, 0, 0.22)
for i in range(4):
    place(click(0.03, 1500 + 260 * i), 23.6 + i * 0.12, 0.13, -0.3 + 0.2 * i, 0.25)
place(decay(sine(49, 2.8), 0.95), 24.75, 0.34, 0, 0.25)                                        # extinction
place(lp(noise(1.0), 1400) * np.exp(-tt(1.0) / 0.22), 24.75, 0.16, 0, 0.3)

# ---------- 12. Outro : signature sonore du logo ----------
for f, dt in zip([261.63, 392.0, 523.25, 783.99], [0, 0.06, 0.12, 0.18]):
    place(bell(f, 3.0, ((1, 1), (2, 0.26), (3, 0.09), (5.4, 0.03))), 25.35 + dt, 0.17, 0, 0.6)
place(sweep_noise(1.2, 2600, 9500, 0.4, 0.45), 26.0, 0.12, 0.15, 0.35)                         # reflet final
place(decay(sine(55, 2.0) + sine(82.4, 2.0) * 0.6, 0.85), 25.35, 0.22, 0, 0.2)
'''
exec(compile(head + mid + tail, 'audio_theme_td01', 'exec'))
