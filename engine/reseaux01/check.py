#!/usr/bin/env python3
"""Contrôle du MP4 final : planche d'images extraites + niveau sonore autour de chaque repère fort.
Usage : python3 engine/manif01/check.py video.mp4 planche.jpg"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw

vid, sheet = sys.argv[1], sys.argv[2]
TS = [0.1, 1.2, 2.05, 3.5, 4.8, 6.4, 7.1, 8.7, 9.9, 11.25, 12.5, 13.6, 14.6, 16.55, 18.4, 19.0, 19.4, 20.8, 22.6, 23.7, 24.1, 25.8, 27.6, 29.9]
tmp = tempfile.mkdtemp()
tiles = []
for t in TS:
    p = os.path.join(tmp, f'{t:05.2f}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', vid, '-frames:v', '1', p], check=True)
    tiles.append((t, p))
cols, tw, th = 8, 270, 480
rows = (len(tiles) + cols - 1) // cols
im = Image.new('RGB', (cols * tw, rows * (th + 20)), (16, 16, 16))
d = ImageDraw.Draw(im)
for i, (t, p) in enumerate(tiles):
    x, y = (i % cols) * tw, (i // cols) * (th + 20)
    im.paste(Image.open(p).convert('RGB').resize((tw, th)), (x, y + 20))
    d.text((x + 4, y + 4), f'{t:.2f}s', fill=(255, 255, 255))
im.save(sheet, quality=88)

# son : énergie juste avant / juste après les repères d'impact
wav = os.path.join(tmp, 'a.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-ac', '1', '-ar', '48000', wav], check=True)
from scipy.io import wavfile
sr, a = wavfile.read(wav); a = a.astype(float) / 32768
cues = json.loads(re.search(r'window\.CUES\s*=\s*(\[.*\])', open(os.path.join(os.path.dirname(__file__), 'cues.js'), encoding='utf-8').read(), re.S).group(1))
db = lambda s: 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9)
for c in cues:
    if c['k'] in ('hit', 'stamp', 'lock', 'thud', 'slam') :
        i = int(c['t'] * sr)
        print(f"{c['t']:6.2f} {c['k']:6s} avant {db(a[i - 4800:i - 480]):6.1f} dB  après {db(a[i:i + 4800]):6.1f} dB")
