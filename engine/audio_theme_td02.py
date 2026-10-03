#!/usr/bin/env python3
"""Bande son TD02 « KINÉTIQUE » : 120 BPM, synthétisée de zéro, aucune voix.
Kick / sub / charleston sur la grille, impacts sur les slams, montée vers le prix, signature finale.
Réutilise les générateurs de audio_theme01.py. Usage : python3 engine/audio_theme_td02.py sortie.wav"""
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_theme01.py'), encoding='utf-8').read()
head = src[:src.index('# ---------- 1. Nappe grave')].replace('DUR = 18.6', 'DUR = 25.5')
tail = src[src.index('# ---------- Réverbération'):] \
    .replace('[0, 0.05, 17.9, 18.6]', '[0, 0.05, 24.9, 25.5]') \
    .replace('theme01.wav', 'theme_td02.wav')

mid = r'''
B = 0.5                       # 120 BPM
def bt(n):
    return n * B


def decay(sig, tau):          # enveloppe calée sur la longueur réelle du signal
    return sig * np.exp(-(np.arange(len(sig)) / SR) / tau)


def kick(punch=1.0, d=0.9):
    f = 46 + 110 * np.exp(-np.arange(int(SR * d)) / SR / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-np.arange(int(SR * d)) / SR / 0.22)
    cl = lp(noise(0.05), 2600) * np.exp(-tt(0.05) / 0.008)
    out = body * punch
    out[:len(cl)] += cl * 0.5 * punch
    return out


def hat(d=0.06, f=7000, soft=1.0):
    return hp(noise(d), f) * np.exp(-tt(d) / (0.011 * soft))


def sub(f0, d, tau):
    return decay(sine(f0, d), tau)


HERO = 13.60
LOGO = 22.80

# ---------- 1. Nappe harmonique ----------
pad_t = tt(DUR)
pad = (sine(55, DUR) * 0.5 + sine(82.4, DUR) * 0.3
       + sine(110.0, DUR) * 0.2 + sine(138.6, DUR, 0.8) * 0.12)
pad *= 0.62 + 0.38 * np.sin(2 * np.pi * 0.09 * pad_t)
env = np.interp(pad_t,
                [0, 0.2, 2.0, 3.4, 4.5, 8.5, 10.2, 11.5, 13.0, 13.42, 13.58, 13.75,
                 16.5, 18.6, 21.0, 22.6, 23.0, 24.2, 25.5],
                [0, 0.30, 0.34, 0.40, 0.34, 0.38, 0.42, 0.40, 0.46, 0.08, 0.02, 0.56,
                 0.40, 0.42, 0.46, 0.30, 0.52, 0.42, 0.0])
place(lp(pad, 760) * env * 0.5, 0, 1.0)
air = lp(noise(DUR), 430) * np.interp(pad_t, [0, 0.3, 24.0, 25.5], [0, 0.055, 0.055, 0])
place(air, 0, 0.5)

# ---------- 2. Grille rythmique ----------
# le kick entre au premier mot, s'arrête pendant le silence d'avant le prix,
# repart plus fort après l'impact, et s'efface sous le logo
for n in range(0, 52):
    t = bt(n)
    if t >= 24.6:
        break
    if 12.95 <= t < 13.6:                       # respiration avant le prix
        continue
    if t < 0.2:
        continue
    strong = (n % 4 == 0)
    g = 0.30 if t < 4.5 else (0.42 if t < 13 else 0.50)
    if t >= 22.6:
        g *= max(0.0, 1 - (t - 22.6) / 1.8)     # on s'efface sous le logo
    place(kick(1.0 if strong else 0.72), t, g, 0, 0.06)
    if t >= 4.5:
        place(sub(44, 0.5, 0.13), t, 0.16 * (g / 0.42), 0, 0.05)

for n in range(0, 104):                          # croches : charleston
    t = bt(n / 2)
    if t < 4.4 or t >= 22.8:
        continue
    if 12.95 <= t < 13.6:
        continue
    off = (n % 2 == 1)
    place(hat(0.05, 7600 if off else 6200, 1.3 if off else 1.0), t,
          0.085 if off else 0.13, 0.22 if off else -0.16, 0.12)

# ---------- 3. Accroche : trois mots, trois impacts ----------
def slam(t, force=1.0, pan=0.0, bright=1.0):
    place(kick(1.25 * force, 1.1), t, 0.40 * force, pan, 0.14)
    place(sub(38, 1.6, 0.34), t, 0.26 * force, pan, 0.12)
    place(lp(noise(0.5), 2400) * np.exp(-tt(0.5) / 0.075), t, 0.17 * force, pan, 0.22)
    place(sweep_noise(0.5, 1800 * bright, 7000 * bright, 0.18, 0.4), t, 0.11 * force, pan, 0.28)


slam(0.20, 0.85)
slam(bt(1.9), 0.9, 0.0, 1.2)
place(sweep_noise(0.7, 300, 3200, 0.4, 0.42), 2.02, 0.20, -0.2, 0.18)   # transition
slam(bt(5.1), 1.15, 0.0, 0.7)                                           # « trouve pas »
place(decay(sine(58, 1.8) + sine(81, 1.8) * 0.7, 0.55), bt(5.1), 0.17, 0, 0.3)
place(sweep_noise(0.8, 260, 4800, 0.52, 0.45), 3.50, 0.26, 0.25, 0.16)  # « on règle ça »
place(click(0.04, 2000), 3.56, 0.18)

# ---------- 4. Services : une note par chip, gamme montante ----------
SVC_T = [4.55, 5.00, 5.40, 5.75, 6.05, 6.30, 6.50, 6.65]
NOTES = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0]
for i, (t, f) in enumerate(zip(SVC_T, NOTES)):
    place(bell(f, 0.8, ((1, 1), (2, 0.22), (3, 0.07))), t, 0.15, -0.3 + 0.085 * i, 0.34)
    place(click(0.02, 3200 + 120 * i), t, 0.07, -0.3 + 0.085 * i)
d = 0.9                                                                  # envol des chips
place(sweep_noise(d, 500, 8000, 0.8, 0.5) * np.linspace(0, 1, int(SR * d)) ** 1.4, 7.95, 0.20, 0, 0.26)
slam(8.65, 0.8)
slam(bt(18.2), 1.0, 0.0, 1.1)                                            # « interlocuteur »

# ---------- 5. Objection prix ----------
place(sweep_noise(0.7, 240, 2000, 0.45, 0.42), 10.22, 0.16, -0.2, 0.2)
place(decay(sine(74, 1.2), 0.3), 10.25, 0.12, 0, 0.2)
slam(bt(22.0), 1.3, 0.0, 0.6)                                            # « NON. »
place(decay(sine(49, 2.2), 0.8), bt(22.0), 0.30, 0, 0.2)

# ---------- 6. Pluie de prix puis aspiration ----------
for i, t in enumerate([11.70, 11.90, 12.10, 12.30, 12.50, 12.70, 12.90]):
    place(click(0.025, 2400 + 220 * i), t, 0.17, -0.35 + 0.12 * i)
    place(bell(523.25 * (1.06 ** i), 0.55, ((1, 1), (2, 0.2))), t, 0.10, -0.35 + 0.12 * i, 0.3)
d = 0.62                                                                  # aspiration vers le centre
sf = np.linspace(1500, 190, int(SR * d))
place(np.sin(2 * np.pi * np.cumsum(sf) / SR) * np.linspace(1, 0.2, int(SR * d)) * 0.13, 13.05, 1.0, 0, 0.2)
place(sweep_noise(d, 6000, 500, 0.4, 0.5), 13.05, 0.19, 0, 0.2)

# ---------- 7. Le prix : montée, silence, impact ----------
d = 1.3
rf = np.linspace(100, 820, int(SR * d))
place(np.sin(2 * np.pi * np.cumsum(rf) / SR) * np.linspace(0, 1, int(SR * d)) ** 2.4 * 0.15, 12.30, 1.0, 0, 0.1)
place(sweep_noise(d, 700, 9000, 0.96, 0.55) * np.linspace(0, 1, int(SR * d)) ** 1.6, 12.30, 0.16, 0, 0.12)
# (12,95 -> 13,58 : la grille se tait)
slam(HERO, 1.45, 0.0, 1.3)
place(decay(sine(41, 3.0), 1.1), HERO, 0.32, 0, 0.2)
for f, dt in zip([523.25, 659.25, 783.99, 1046.5, 1318.5], [0, 0.04, 0.08, 0.12, 0.16]):
    place(bell(f, 2.6, ((1, 1), (2, 0.2), (3, 0.06), (4.2, 0.03))), HERO + dt, 0.16, 0, 0.58)
place(sweep_noise(1.6, 2400, 12000, 0.28, 0.5), HERO + 0.04, 0.11, 0, 0.36)
place(click(0.03, 1800), HERO + 0.62, 0.17)                               # le prix barré
for i in range(4):                                                        # les quatre éléments du pack
    place(bell([587.33, 659.25, 783.99, 880.0][i], 0.7, ((1, 1), (2, 0.22))),
          HERO + 1.05 + i * 0.17, 0.13, -0.24 + 0.16 * i, 0.3)
    place(click(0.02, 3000 + 150 * i), HERO + 1.05 + i * 0.17, 0.06)

# ---------- 8. Preuves : trois frappes ----------
slam(16.70, 0.95, 0.0, 1.25)
slam(17.95, 1.0, 0.0, 1.1)
place(sweep_noise(0.55, 400, 5200, 0.45, 0.42), 18.92, 0.22, -0.28, 0.2)  # balayage « engagement »
slam(19.70, 1.0, 0.0, 0.95)
place(bell(392.0, 1.4, ((1, 1), (2, 0.22), (3, 0.07))), 20.20, 0.12, 0, 0.4)
slam(21.20, 1.1, 0.0, 1.15)                                               # « écris-nous »

# ---------- 9. Logo ----------
place(sweep_noise(1.0, 240, 3600, 0.4, 0.45), 22.70, 0.22, 0, 0.22)
place(decay(sine(55, 2.6) + sine(82.4, 2.6) * 0.6, 1.0), LOGO, 0.24, 0, 0.22)
for f, dt in zip([261.63, 392.0, 523.25, 783.99], [0, 0.055, 0.11, 0.165]):
    place(bell(f, 3.0, ((1, 1), (2, 0.26), (3, 0.09), (5.4, 0.03))), LOGO + 0.4 + dt, 0.165, 0, 0.62)
place(sweep_noise(1.1, 2800, 9800, 0.42, 0.45), LOGO + 0.5, 0.12, 0.15, 0.35)
'''
exec(compile(head + mid + tail, 'audio_theme_td02', 'exec'))
