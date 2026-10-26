#!/usr/bin/env python3
"""Textures de la vidéo MANIF01 (papier encollé, papier ancien, affiche noire, plis de colle).
Usage : python3 engine/manif01/make_textures.py  → écrit engine/manif01/tex/*.png"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'tex')
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920
rng = np.random.default_rng(1968)


def lowfreq(sigma, amp=1.0):
    n = gaussian_filter(rng.standard_normal((H, W)), sigma)
    n /= (np.abs(n).max() + 1e-9)
    return n * amp


def fibers(count, length, width, val):
    """Fibres de papier : courts traits orientés au hasard."""
    img = np.zeros((H, W))
    for _ in range(count):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        a = rng.uniform(0, np.pi)
        L = rng.uniform(length * 0.4, length)
        for s in np.linspace(0, L, int(L)):
            xi, yi = int(x + np.cos(a) * s), int(y + np.sin(a) * s)
            if 0 <= xi < W and 0 <= yi < H:
                img[yi, xi] = val * rng.uniform(0.4, 1)
    return gaussian_filter(img, width)


def save(arr, name, mode='L'):
    a = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(a, mode).save(os.path.join(OUT, name), optimize=True)
    print('écrit', name, a.shape)


# 1. papier frais (multiply) : blanc + fibres + nuages très légers
p = 255 - 9 * (lowfreq(60) + 1) - 5 * (lowfreq(8) + 1)
p -= fibers(2600, 26, 0.6, 26)
p -= np.abs(rng.standard_normal((H, W))) * 4
save(p, 'paper.png')

# 2. papier ancien (multiply, teinté) : taches, rousseurs, bords plus sombres
yy, xx = np.mgrid[0:H, 0:W]
edge = np.minimum.reduce([xx, W - xx, yy, H - yy]) / 160.0
edge = np.clip(edge, 0, 1) ** 0.5
base = 238 - 20 * (lowfreq(90) + 1) - 10 * (lowfreq(20) + 1) - (1 - edge) * 46
fox = np.zeros((H, W))
for _ in range(90):
    cx, cy, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(2, 16)
    fox += np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)) * rng.uniform(10, 40)
base -= fox
base -= fibers(1800, 30, 0.7, 30)
r_ = base; g_ = base * 0.965 - 4; b_ = base * 0.86 - 10
save(np.dstack([r_, g_, b_]), 'old.png', 'RGB')

# 3. affiche noire (screen) : poussières, rayures, voile
k = np.zeros((H, W))
k += np.clip(lowfreq(70) * 18, 0, None)
for _ in range(9000):
    x, y = int(rng.uniform(0, W)), int(rng.uniform(0, H))
    k[y, x] += rng.uniform(40, 160)
k = gaussian_filter(k, 0.7) * 1.6
for _ in range(60):  # rayures
    x0, y0 = rng.uniform(0, W), rng.uniform(0, H)
    a = rng.uniform(-0.4, 0.4) + np.pi / 2 * rng.integers(0, 2)
    L = rng.uniform(40, 260)
    for s in np.linspace(0, L, int(L)):
        xi, yi = int(x0 + np.cos(a) * s), int(y0 + np.sin(a) * s)
        if 0 <= xi < W and 0 <= yi < H:
            k[yi, xi] += 55
save(k, 'ink.png')

# 4. plis de colle (overlay, gris moyen 128) : longues bulles et plis diagonaux
wr = np.zeros((H, W))
for _ in range(26):
    x0 = rng.uniform(-300, W + 300)
    ang = rng.uniform(0.9, 1.3)
    d = (xx - x0) * np.cos(ang) - yy * np.sin(ang) * 0.35
    wid = rng.uniform(4, 18)
    wr += np.exp(-(d ** 2) / (2 * wid ** 2)) * rng.uniform(-1, 1) * 30 * (0.5 + 0.5 * np.sin(yy / rng.uniform(80, 300) + rng.uniform(0, 6)))
wr = gaussian_filter(wr, 1.5) + lowfreq(40) * 10
save(128 + wr, 'wrinkle.png')

# 5. usure de tampon (masque alpha) : encre qui n'a pas pris, en petites lacunes
Wm, Hm = 900, 320
a = np.ones((Hm, Wm)) * 255
n1 = gaussian_filter(rng.standard_normal((Hm, Wm)), 1.2)
n2 = gaussian_filter(rng.standard_normal((Hm, Wm)), 6)
a[(n1 + n2 * 0.9) > 0.55] = 0
a[(n1 > 0.75)] = 40
a = gaussian_filter(a, 0.6)
img = np.dstack([np.full((Hm, Wm), 255), np.full((Hm, Wm), 255), np.full((Hm, Wm), 255), a])
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'wear.png'), optimize=True)
print('écrit wear.png')
