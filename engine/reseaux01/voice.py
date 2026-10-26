#!/usr/bin/env python3
"""RESEAUX01 : cale une prise de voix (ElevenLabs ou enregistrement téléphone) sur l'animation.
1. nettoie et resserre légèrement la prise (TEMPO, hauteur conservée) ;
2. repère les silences, puis place chaque morceau de phrase du texte sur la prise :
   frontière attendue au prorata des syllabes, aimantée au silence le plus proche (ordre conservé) ;
3. remonte la prise avec des respirations choisies (pauses longues là où l'image a besoin de temps) ;
4. écrit warp.js (temps vidéo → temps de l'animation), caps.js (sous-titres) et voice.json (contrôle).
Usage : python3 engine/reseaux01/voice.py prise.mp3 voix_calee.wav [--tempo 1.08] [--map vo/prise.json]"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
src, out = sys.argv[1], sys.argv[2]
TEMPO = float(sys.argv[sys.argv.index('--tempo') + 1]) if '--tempo' in sys.argv else 1.08

# morceaux de phrase : (texte, temps d'animation au début, [(fraction du morceau, temps d'animation), …])
PH = [
    ('Ton compte devait être fermé', 0.15, [(0.86, 1.0)]),
    ('le premier janvier.', 1.55, []),
    ('Spoiler : non.', 2.38, [(0.62, 2.95)]),
    ('Cet été, la France vote', 3.62, [(0.84, 4.2)]),
    ('l’interdiction des réseaux', 4.5, [(0.5, 5.05)]),
    ('avant quinze ans.', 5.45, [(0.45, 5.9)]),
    ('Et pour trouver les moins de quinze,', 7.0, []),
    ('tout le monde aurait dû prouver son âge.', 7.8, [(0.36, 8.7)]),
    ('Même toi.', 9.95, [(0.25, 10.2)]),
    ('Mais le quatorze août,', 11.1, []),
    ('le Conseil constitutionnel censure la loi.', 11.9, [(0.74, 12.6)]),
    ('Trop large,', 13.55, []),
    ('et sans garanties pour ta vie privée.', 14.1, []),
    ('Sauf que le gouvernement', 15.2, []),
    ('a déjà un nouveau texte.', 15.45, [(0.55, 15.7)]),
    ('Avant quinze ans :', 17.05, []),
    ('interdit sur les réseaux les plus addictifs.', 17.6, [(0.78, 18.15)]),
    ('Dès treize ans :', 19.15, [(0.4, 19.5)]),
    ('possible, avec l’accord des parents.', 19.95, [(0.72, 20.45)]),
    ('Et la question qui fâche :', 21.15, []),
    ('comment ils vont vérifier ton âge ?', 21.85, [(0.5, 22.15)]),
    ('Le texte ne le dit toujours pas.', 23.4, [(0.8, 24.35)]),
    ('Protection…', 26.4, []),
    ('ou flicage ?', 26.92, [(0.5, 27.3)]),
    ('Dis-le en commentaire.', 28.2, []),
]
END_ANIM = 30.0
# respiration avant chaque morceau (s), sinon défaut selon la ponctuation
BEFORE = {1: 0.05, 2: 0.24, 3: 0.4, 4: 0.06, 5: 0.1, 6: 0.42, 7: 0.08, 8: 0.24, 9: 0.48, 10: 0.1, 11: 0.28, 12: 0.1,
          13: 0.5, 14: 0.06, 15: 0.38, 16: 0.16, 17: 0.34, 18: 0.14, 19: 0.46, 20: 0.14, 21: 0.28, 22: 1.0, 23: 0.22, 24: 0.42}
TAIL = 1.1
LEAD = 0.12

def syl(s):
    return max(1, len(re.findall(r'[aeiouyàâäéèêëîïôöùûüœ]+', s.lower())))

tmp = tempfile.mkdtemp()
fast = os.path.join(tmp, 'fast.wav')
af = f'highpass=f=70,afftdn=nf=-30,atempo={TEMPO}' if TEMPO != 1 else 'highpass=f=70,afftdn=nf=-30'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', str(SR), '-af', af, fast], check=True)
sr, x = wavfile.read(fast); x = x.astype(np.float32) / 32768
dur = len(x) / SR
# silences : seuil relatif au niveau de la prise
rms = lambda z: np.sqrt(np.mean(z ** 2) + 1e-12)
fr = int(0.01 * SR); env = np.array([rms(x[i:i + fr]) for i in range(0, len(x) - fr, fr)])
thr = max(10 ** (-42 / 20), np.percentile(env, 92) * 10 ** (-30 / 20))
speech = env > thr
segs, i = [], 0
while i < len(speech):
    if speech[i]:
        j = i
        while j < len(speech) and speech[j]: j += 1
        segs.append([i * 0.01, j * 0.01]); i = j
    else: i += 1
# fusionne les trous < 90 ms (consonnes, plosives)
m = []
for s in segs:
    if m and s[0] - m[-1][1] < 0.09: m[-1][1] = s[1]
    else: m.append(s)
segs = [s for s in m if s[1] - s[0] > 0.04]
gaps = [(segs[k][1], segs[k + 1][0]) for k in range(len(segs) - 1)]
# temps de parole cumulé → temps réel
sp_len = [s[1] - s[0] for s in segs]; SP = sum(sp_len)
def sp2real(v):
    acc = 0.0
    for (a, b), L in zip(segs, sp_len):
        if v <= acc + L: return a + (v - acc)
        acc += L
    return segs[-1][1]
w = [syl(p[0]) for p in PH]; cw = np.cumsum(w) / sum(w)
MAPF = sys.argv[sys.argv.index('--map') + 1] if '--map' in sys.argv else None
if MAPF:
    # segments vérifiés à la main : [début, fin, [morceaux]] en temps de la prise d'origine (ramenés au tempo)
    MP = json.load(open(MAPF, encoding='utf-8'))
    pieces, bounds = [], []
    for si, (a0, b0, ids) in enumerate(MP['segments']):
        a0, b0 = a0 / TEMPO, b0 / TEMPO
        ws = [w[i] for i in ids]; c = a0
        for j, i in enumerate(ids):
            e = b0 if j == len(ids) - 1 else c + (b0 - a0) * ws[j] / sum(ws)
            if pieces: bounds.append((pieces[-1][1], c, j == 0))
            pieces.append([c, e]); c = e
    gaps = [b for b in bounds if b[2]]
else:
    # frontières : attendue au prorata, aimantée au silence le plus proche s'il est assez près
    bounds, used = [], set()
    for k in range(len(PH) - 1):
        tgt = sp2real(cw[k] * SP)
        lo = bounds[-1][1] if bounds else segs[0][0]
        best, bd = None, 0.6
        for gi, (ga, gb) in enumerate(gaps):
            if gi in used or ga <= lo: continue
            d = abs((ga + gb) / 2 - tgt)
            if d < bd: best, bd = gi, d
        if best is not None:
            used.add(best); bounds.append((gaps[best][0], gaps[best][1], True))
        else:
            bounds.append((tgt, tgt, False))
    # morceaux bruts [début, fin]
    pieces = []
    st = segs[0][0]
    for (a, b, real) in bounds:
        pieces.append([st, a]); st = b
    pieces.append([st, segs[-1][1]])
print('silences :', len(gaps), '; frontières sur un silence :', sum(1 for b in bounds if b[2]), '/', len(bounds))
# remontage avec respirations choisies
PAD = 0.03
y = [np.zeros(int(LEAD * SR), np.float32)]; pos = LEAD; T = []
for k, (a, b) in enumerate(pieces):
    if k > 0:
        g = BEFORE.get(k, 0.2)
        if not bounds[k - 1][2]: g = 0.0   # pas de silence dans la prise : on n'en invente pas
        y.append(np.zeros(int(g * SR), np.float32)); pos += g
    a0, b0 = max(0, a - PAD), min(dur, b + PAD)
    piece = x[int(a0 * SR):int(b0 * SR)].copy()
    f = int(0.01 * SR)
    if len(piece) > 2 * f: piece[:f] *= np.linspace(0, 1, f); piece[-f:] *= np.linspace(1, 0, f)
    T.append([round(pos + PAD, 3), round(pos + len(piece) / SR - PAD, 3)])
    y.append(piece); pos += len(piece) / SR
y.append(np.zeros(int(TAIL * SR), np.float32)); pos += TAIL
v = np.concatenate(y); VDUR = round(len(v) / SR, 3)
wavfile.write(out, SR, (np.clip(v, -1, 1) * 32767).astype(np.int16))
# repères temps vidéo → temps animation
A = [(0.0, 0.0)]
for k, (txt, t0, kws) in enumerate(PH):
    s0, e0 = T[k]
    A.append((s0, t0))
    for fr_, ta in kws: A.append((s0 + fr_ * (e0 - s0), ta))
A.append((VDUR, END_ANIM))
A2 = [A[0]]
for p in A[1:]:
    if p[0] > A2[-1][0] + 0.02 and p[1] > A2[-1][1] + 0.02: A2.append(p)
    else: print('repère ignoré (non croissant) :', p)
slopes = [round((d1 - d0) / (t1 - t0), 2) for (t0, d0), (t1, d1) in zip(A2, A2[1:])]
# sous-titres : un morceau par bande, coupé en deux s'il est trop long
caps = []
for k, (txt, _, _) in enumerate(PH):
    s0, e0 = T[k]
    end = T[k + 1][0] - 0.02 if k + 1 < len(T) else e0 + 0.9
    if len(txt) > 30:
        mid = len(txt) / 2; cut = min((i for i, c in enumerate(txt) if c == ' '), key=lambda i: abs(i - mid))
        a, b = txt[:cut], txt[cut + 1:]; tm = s0 + (e0 - s0) * len(a) / len(txt)
        caps += [[round(s0 - 0.04, 3), round(tm, 3), a], [round(tm, 3), round(end, 3), b]]
    else:
        caps.append([round(s0 - 0.04, 3), round(end, 3), txt])
with open(os.path.join(HERE, 'warp.js'), 'w', encoding='utf-8') as fh:
    fh.write("/* Généré par voice.py : temps vidéo → temps de l'animation, calé sur la voix. */\n")
    fh.write('window.WARP = ' + json.dumps([[round(a, 3), round(b, 3)] for a, b in A2]) + ';\nwindow.VDUR = ' + str(VDUR) + ';\n')
with open(os.path.join(HERE, 'caps.js'), 'w', encoding='utf-8') as fh:
    fh.write('/* Généré par voice.py : sous-titres [début, fin, texte] en temps vidéo. */\nwindow.CAPS = ' + json.dumps(caps, ensure_ascii=False) + ';\n')
json.dump({'tempo': TEMPO, 'dur': VDUR, 'morceaux': [{'texte': p[0], 'debut': a, 'fin': b, 'silence_reel_avant': (bool(bounds[k - 1][2]) if k else None)} for k, (p, (a, b)) in enumerate(zip(PH, T))]},
          open(os.path.join(HERE, 'voice.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'voix calée : {VDUR:.2f} s ; vitesses de l\'animation (min {min(slopes)}, max {max(slopes)})')
