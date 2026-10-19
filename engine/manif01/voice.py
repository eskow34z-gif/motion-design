#!/usr/bin/env python3
"""MANIF01 : cale une prise de voix sur l'animation.
1. accélère légèrement la prise (×1,1, hauteur conservée) ;
2. la découpe en 27 segments (silences > 0,12 s), un par morceau de phrase du texte ;
3. la remonte avec des respirations choisies (pauses dramatiques aux transitions) ;
4. écrit la correspondance temps vidéo → temps de l'animation (warp.js) et la voix calée (WAV).
Usage : python3 engine/manif01/voice.py prise.mp3 voix_calee.wav"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
SR, TEMPO = 48000, 1.1
src, out = sys.argv[1], sys.argv[2]
tmp = tempfile.mkdtemp()
fast = os.path.join(tmp, 'fast.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', str(SR), '-af', f'atempo={TEMPO}', fast], check=True)
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', fast, '-af', 'silencedetect=noise=-38dB:d=0.11', '-f', 'null', '-'], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
sr, x = wavfile.read(fast); x = x.astype(np.float32) / 32768
dur = len(x) / SR
# segments de parole = entre les silences
segs, cur = [], 0.0
for s, e in zip(starts, ends + [dur] * (len(starts) - len(ends))):
    if s - cur > 0.08: segs.append([cur, s])
    cur = e
if dur - cur > 0.08: segs.append([cur, dur])
TEXT = ['Mi-septembre,', 'Créteil.', 'Un lycée dit stop.', 'Profs pas remplacés,', 'classes blindées,', 'Parcoursup.',
        'Deux semaines après :', 'près d’un lycée sur trois.', 'Le dix-sept octobre :', 'plus d’un demi-million dans la rue.',
        'Mais la jeunesse dans la rue…', 'c’est pas nouveau.', 'Soixante-huit :', 'les étudiants allument la mèche.',
        'Quatre-vingt-six :', 'la sélection à la fac ?', 'Retirée.', 'Deux mille six :', 'le CPE, voté…', 'puis enterré.',
        'Deux mille dix-neuf :', 'grève pour le climat.', 'Et deux mille vingt-six ?', 'Quarante ans après,',
        'la sélection est encore dans le viseur.', 'Et toi…', 't’en penses quoi ?']
if len(segs) != len(TEXT):
    sys.exit(f'{len(segs)} segments trouvés, {len(TEXT)} attendus : prise à vérifier ({segs})')
LINE = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 10, 10]
# respiration après chaque ligne (s) : pauses longues là où l'image a besoin de temps
AFTER = [0.45, 0.3, 0.5, 0.75, 0.62, 0.42, 0.34, 0.3, 0.36, 1.65, 1.6]
INTRA = {15: 0.28, 18: 0.3, 25: 0.34}   # pauses internes gardées : « la fac ? | Retirée », « voté… | puis », « Et toi… | t'en »
LEAD = 0.12
PAD = 0.035
y, pos, T = [], LEAD, []
y.append(np.zeros(int(LEAD * SR), np.float32))
for i, (a, b) in enumerate(segs):
    a0, b0 = max(0, a - PAD), min(dur, b + PAD)
    piece = x[int(a0 * SR):int(b0 * SR)].copy()
    f = int(0.012 * SR); piece[:f] *= np.linspace(0, 1, f); piece[-f:] *= np.linspace(1, 0, f)
    T.append([round(pos + PAD, 3), round(pos + len(piece) / SR - PAD, 3)])
    y.append(piece); pos += len(piece) / SR
    if i < len(segs) - 1:
        if LINE[i + 1] != LINE[i]: gap = AFTER[LINE[i]]
        else: gap = INTRA.get(i, min(0.2, max(0.1, segs[i + 1][0] - b)))
        y.append(np.zeros(int(gap * SR), np.float32)); pos += gap
tail = AFTER[-1]
y.append(np.zeros(int(tail * SR), np.float32)); pos += tail
v = np.concatenate(y)
VDUR = round(len(v) / SR, 3)
wavfile.write(out, SR, (np.clip(v, -1, 1) * 32767).astype(np.int16))

s = lambda i: T[i - 1][0]
e = lambda i: T[i - 1][1]
L = lambda i: e(i) - s(i)
# repères : (temps vidéo, temps de l'animation)
A = [(0.0, 0.0), (s(1), 0.17), (s(2), 0.45), (s(3), 1.10), (s(3) + 0.75 * L(3), 1.97),
     (s(4), 3.10), (s(5), 3.80), (s(6), 4.55),
     (s(7), 5.65), (s(8), 6.60), (s(8) + 0.8 * L(8), 7.0),
     (s(9), 8.05), (s(10), 8.55), (e(10) - 0.12, 10.45),
     (s(11), 11.40), (s(12), 12.18),
     (s(13), 12.98), (s(14), 13.42), (e(14), 14.40),
     (s(15), 15.05), (s(16), 15.98), (s(17), 16.47),
     (s(18), 17.55), (s(19), 17.95), (s(19) + 0.62 * L(19), 18.22), (s(20), 18.98), (s(20) + 0.3 * L(20), 19.15),
     (s(21), 20.05), (s(22), 20.38), (e(22), 21.0),
     (s(23), 21.55), (s(24), 22.15), (s(25), 23.32), (s(25) + 0.8 * L(25), 24.02), (e(25), 24.35), (e(25) + 0.75, 25.5),
     (s(26), 27.0), (s(27), 27.95), (VDUR, 30.0)]
for (t0, d0), (t1, d1) in zip(A, A[1:]):
    assert t1 > t0 and d1 > d0, ((t0, d0), (t1, d1))
slopes = [round((d1 - d0) / (t1 - t0), 2) for (t0, d0), (t1, d1) in zip(A, A[1:])]
with open(os.path.join(HERE, 'warp.js'), 'w', encoding='utf-8') as fh:
    fh.write('/* Généré par voice.py : temps vidéo → temps de l\'animation, calé sur la voix. */\n')
    fh.write('window.WARP = ' + json.dumps([[round(a, 3), round(b, 3)] for a, b in A]) + ';\nwindow.VDUR = ' + str(VDUR) + ';\n')
json.dump({'tempo': TEMPO, 'dur': VDUR, 'segments': [{'texte': w, 'debut': a, 'fin': b} for w, (a, b) in zip(TEXT, T)]},
          open(os.path.join(HERE, 'voice.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'voix calée : {VDUR:.2f} s, {len(segs)} segments ; vitesses de l\'animation (min {min(slopes)}, max {max(slopes)}) :', slopes)
