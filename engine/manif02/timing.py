#!/usr/bin/env python3
"""MANIF02 : temps de chaque morceau de phrase → timing.js (repères de la scène, carte du clip, durée).
Sans voix : durées estimées (syllabes).  Avec voix : la prise est découpée sur ses silences, alignée sur le texte
(programmation dynamique sur les durées), remontée avec des respirations bornées, et écrite en WAV.
Usage : python3 timing.py --nominal
        python3 timing.py prise.mp3 voix_calee.wav [--tempo 1.0]"""
import json, os, re, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
# (texte, syllabes, ligne)
PH = [("Dix-sept octobre,", 4, 0), ("place de la Bastille.", 5, 0), ("Charge des forces de l'ordre.", 6, 0), ("C'est légal, ça ?", 4, 0),
      ("Charger pour disperser :", 6, 1), ("oui, après deux sommations.", 7, 1), ("Ou sans, si les policiers sont attaqués.", 11, 1),
      ("Filmer ?", 2, 2), ("Légal.", 2, 2), ("La police ne peut pas t'en empêcher.", 10, 2), ("Et les journalistes peuvent rester,", 9, 2),
      ("même après l'ordre de dispersion.", 9, 2),
      ("Interpeller :", 4, 3), ("légal,", 2, 3), ("si la force reste nécessaire et proportionnée.", 13, 3),
      ("Alors, légal ou pas ?", 6, 4), ("Impossible à dire :", 5, 4), ("on ne voit pas ce qui s'est passé avant.", 11, 4),
      ("C'est à l'IGPN et à la justice de trancher.", 15, 4),
      ("Par contre, rester après les sommations,", 11, 5), ("c'est un délit.", 4, 5), ("Jusqu'à un an de prison.", 7, 5),
      ("Et toi,", 2, 6), ("t'en penses quoi ?", 3, 6)]
M = len(PH)
LEAD = 0.32


def gap_after(k, natural=None):
    """respiration après le morceau k (indices 0..M-2)."""
    if k == 21: return 1.15                      # avant « Et toi » : le recul sur le mur
    if k == 18: return 0.55                      # avant l'affiche du délit
    if PH[k + 1][2] != PH[k][2]:                 # changement de ligne
        return 0.45 if natural is None else float(np.clip(natural, 0.36, 0.6))
    return 0.18 if natural is None else float(np.clip(natural, 0.08, 0.3))


def nominal():
    rate, t, out = 6.8, LEAD, []
    for k, (_, syl, _) in enumerate(PH):
        d = syl / rate + 0.12
        out.append([t, t + d]); t += d
        if k < M - 1: t += gap_after(k)
    return out


def from_voice(src, dst, tempo):
    from scipy.io import wavfile
    tmp = tempfile.mkdtemp(); wav = os.path.join(tmp, 'v.wav')
    af = f'atempo={tempo}' if abs(tempo - 1) > 1e-3 else 'anull'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', str(SR), '-af', af, wav], check=True)
    _, x = wavfile.read(wav); x = x.astype(np.float32) / 32768
    dur = len(x) / SR
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-32dB:d=0.035', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', log)]
    en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', log)]
    segs, cur = [], 0.0
    for s, e in zip(st, en + [dur] * (len(st) - len(en))):
        if s - cur > 0.04: segs.append([cur, s])
        cur = e
    if dur - cur > 0.04: segs.append([cur, dur])
    # trop peu de segments : couper les plus longs à leur point le plus calme
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
    while len(segs) < M:
        i = max(range(len(segs)), key=lambda j: segs[j][1] - segs[j][0])
        a, b = segs[i]; ia, ib = int((a + 0.3 * (b - a)) * SR), int((a + 0.7 * (b - a)) * SR)
        c = (ia + int(np.argmin(env[ia:ib]))) / SR
        segs[i:i + 1] = [[a, c - 0.01], [c + 0.01, b]]
    N = len(segs)
    speech = sum(b - a for a, b in segs)
    syl = np.array([p[1] for p in PH], float)
    A0 = 0.15                                   # durée fixe par morceau (les mots courts sont appuyés)
    exp = A0 + (speech - M * A0) / syl.sum() * syl
    gaps = [segs[i + 1][0] - segs[i][1] for i in range(N - 1)]
    # DP : regrouper N segments en M morceaux (monotone), coût = écart de durée − bonus de silence aux frontières
    INF = 1e18
    cost = np.full((M + 1, N + 1), INF); back = np.zeros((M + 1, N + 1), int); cost[0, 0] = 0
    for k in range(1, M + 1):
        for j in range(k, N - (M - k) + 1):
            for i in range(k - 1, j):
                if cost[k - 1, i] >= INF: continue
                d = sum(segs[q][1] - segs[q][0] for q in range(i, j))
                c = (d - exp[k - 1]) ** 2 / max(exp[k - 1], 0.3) - (1.2 * min(gaps[j - 1], 0.6) if j < N else 0)
                if cost[k - 1, i] + c < cost[k, j]: cost[k, j] = cost[k - 1, i] + c; back[k, j] = i
    groups, j = [], N
    for k in range(M, 0, -1):
        i = back[k, j]; groups.append((i, j)); j = i
    groups.reverse()
    ph_src = [[segs[i][0], segs[j - 1][1]] for i, j in groups]
    # remontage avec respirations bornées
    PA, PB, out, y, t = 0.04, 0.08, [], [np.zeros(int(LEAD * SR), np.float32)], LEAD
    for k, (a, b) in enumerate(ph_src):
        nxt = ph_src[k + 1][0] if k < M - 1 else dur
        prv = ph_src[k - 1][1] if k else 0.0
        a0, b0 = max(prv, a - PA), min(nxt - 0.01, b + PB)
        piece = x[int(a0 * SR):int(b0 * SR)].copy()
        f = int(0.012 * SR); piece[:f] *= np.linspace(0, 1, f); piece[-f:] *= np.linspace(1, 0, f)
        out.append([round(t + (a - a0), 3), round(t + (b - a0), 3)])
        y.append(piece); t += len(piece) / SR
        if k < M - 1:
            g = gap_after(k, ph_src[k + 1][0] - b)
            y.append(np.zeros(int(g * SR), np.float32)); t += g
    v = np.concatenate(y)
    wavfile.write(dst, SR, (np.clip(v, -1, 1) * 32767).astype(np.int16))
    print(f'prise : {dur:.2f} s, {N} segments → {M} morceaux ; voix calée {len(v) / SR:.2f} s')
    for (txt, _, _), (a, b) in zip(PH, out): print(f'  {a:6.2f}-{b:6.2f}  {txt}')
    return out


def keys(ph):
    p = lambda i: ph[i - 1]
    s = lambda i: p(i)[0]
    e = lambda i: p(i)[1]
    L = lambda i: e(i) - s(i)
    K = {}
    K['label'] = 0.1
    K['cest'] = s(4); K['tag0'] = s(4) + 0.12; K['tag1'] = max(e(4) - 0.05, s(4) + 0.45); K['tagHit'] = K['tag1']
    K['rw0'] = s(5) - 0.05; K['rw1'] = K['rw0'] + 0.42; K['fz1'] = K['rw1']
    K['c1head'] = K['fz1'] + 0.3; K['c1sub0'] = K['fz1'] + 0.12; K['c1circle'] = K['fz1'] + 0.42
    K['c1stamp'] = s(6); K['c1t1'] = [s(6) + 0.1, e(6)]; K['c1t2'] = [s(7), e(7)]; K['c1src'] = e(7) - 0.2
    K['uf1'] = e(7) + 0.12
    K['fz2'] = max(K['uf1'] + 0.55, s(9) - 0.15)
    K['c2stamp'] = max(s(9) + 0.05, K['fz2'] + 0.18); K['c2t1'] = [s(10), e(10)]; K['c2note'] = e(10) - 0.1
    K['c2circle'] = s(11) - 0.1; K['c2t2'] = [s(11) + 0.1, e(12)]; K['c2src'] = e(12) - 0.1
    K['uf2'] = e(12) + 0.12
    K['fz3'] = max(K['uf2'] + 0.55, s(14) - 0.12)
    K['c3stamp'] = max(s(14) + 0.03, K['fz3'] + 0.18); K['c3circle'] = e(14); K['c3t'] = [s(15), e(15)]; K['c3src'] = e(15) - 0.1
    K['uf3'] = e(15) + 0.12
    K['q0'] = s(16) + 0.05
    K['fz4'] = max(K['uf3'] + 0.7, s(17) - 0.1)
    K['c4stamp'] = max(s(17) + 0.05, K['fz4'] + 0.2); K['c4q'] = s(18); K['c4t1'] = [s(18), e(18)]; K['c4t2'] = [s(19), e(19)]
    K['pst'] = s(20) - 0.05; K['ann'] = [s(20) + 0.1, s(20) + 0.6 * L(20)]; K['tu'] = s(20) + 0.62 * L(20); K['restes'] = K['tu'] + 0.12
    K['delit'] = s(21) + 0.02; K['an'] = s(22) + 0.05; K['prison'] = s(22) + 0.5 * L(22); K['src'] = e(22) - 0.1
    K['wall0'] = e(22) + 0.3; K['wall1'] = s(23) - 0.05
    K['toi0'] = s(23) - 0.05; K['toi1'] = s(23) + 0.5; K['sticker'] = s(24) + 0.1
    dur = round(e(24) + 1.25, 3)
    clip = [[0, K['rw0'], 0, K['rw0']],
            [K['rw0'], K['rw1'], K['rw0'], 1.0],
            [K['rw1'], K['uf1'], 1.0, 1.0],
            [K['uf1'], K['fz2'], 7.9 - (K['fz2'] - K['uf1']), 7.9],
            [K['fz2'], K['uf2'], 7.9, 7.9],
            [K['uf2'], K['fz3'], 10.6 - (K['fz3'] - K['uf2']), 10.6],
            [K['fz3'], K['uf3'], 10.6, 10.6],
            [K['uf3'], K['fz4'], 21.2 - (K['fz4'] - K['uf3']), 21.2],
            [K['fz4'], dur, 21.2, 21.2]]
    # fenêtres d'arrêt sur image (photo réduite + carte)
    freezes = [[K['fz1'], K['uf1'], 1], [K['fz2'], K['uf2'], 2], [K['fz3'], K['uf3'], 3], [K['fz4'], K['pst'] + 0.4, 4]]
    # repères communs scène / son : (type, temps, durée, secousse px, coup de zoom) — intensité « dosée »
    C = []
    def cue(k, t, d=0.3, sh=0, pu=0): C.append([k, round(t, 3), round(d, 3), sh, pu])
    cue('slap', K['label'], sh=3); cue('stamp', s(1) + 0.05, sh=4, pu=0.01); cue('typing', s(2), L(2))
    cue('typing', K['cest'], 0.3); cue('spray', K['tag0'], K['tag1'] - K['tag0']); cue('hit', K['tagHit'], 0.6, 14, 0.02)
    for n, (f0, f1) in enumerate([(K['fz1'], K['uf1']), (K['fz2'], K['uf2']), (K['fz3'], K['uf3']), (K['fz4'], None)], 1):
        cue('clack', f0, sh=4); cue('whoosh', f0 + 0.03, 0.38); cue('paste', f0 + 0.05, 0.28); cue('slam', f0 + 0.1 if n > 1 else K['c1head'], sh=4, pu=0.01)
        if f1 is not None: cue('rip', f1, 0.3); cue('whoosh', f1 + 0.02, 0.36)
    cue('rewind', K['rw0'], 0.42)
    cue('typing', K['c1sub0'], 0.3); cue('marker', K['c1circle'], 0.45); cue('stamp', K['c1stamp'], sh=6, pu=0.015)
    cue('typing', K['c1t1'][0], K['c1t1'][1] - K['c1t1'][0]); cue('typing', K['c1t2'][0], K['c1t2'][1] - K['c1t2'][0]); cue('typing', K['c1src'], 0.3)
    cue('stamp', K['c2stamp'], sh=6, pu=0.015); cue('typing', K['c2t1'][0], K['c2t1'][1] - K['c2t1'][0]); cue('typing', K['c2note'], 0.3)
    cue('marker', K['c2circle'], 0.45); cue('slam', K['c2circle'] + 0.1, sh=3); cue('typing', K['c2t2'][0], K['c2t2'][1] - K['c2t2'][0]); cue('typing', K['c2src'], 0.3)
    cue('stamp', K['c3stamp'], sh=6, pu=0.015); cue('marker', K['c3circle'], 0.45); cue('typing', K['c3t'][0], K['c3t'][1] - K['c3t'][0]); cue('typing', K['c3src'], 0.3)
    cue('slam', K['q0'], sh=4, pu=0.01)
    cue('stamp', K['c4stamp'], 0.5, 14, 0.02); cue('marker', K['c4q'], 0.6); cue('typing', K['c4t1'][0], K['c4t1'][1] - K['c4t1'][0]); cue('typing', K['c4t2'][0], K['c4t2'][1] - K['c4t2'][0])
    cue('paste', K['pst'], 0.3); cue('typing', K['ann'][0], K['ann'][1] - K['ann'][0]); cue('slam', K['tu'], sh=4); cue('slam', K['restes'], sh=5, pu=0.01)
    cue('stamp', K['delit'], sh=8, pu=0.015); cue('slam', K['an'], sh=6, pu=0.01); cue('slam', K['prison'], sh=4); cue('typing', K['src'], 0.35)
    cue('pull', K['wall0'], K['wall1'] - K['wall0']); cue('spray', K['toi0'], K['toi1'] - K['toi0']); cue('hit', K['toi1'], 0.5, 6, 0.01)
    cue('slap', K['sticker'], sh=5, pu=0.01); cue('end', dur - 0.6, 0.05)
    C.sort(key=lambda c: c[1])
    rnd = lambda v: [rnd(a) for a in v] if isinstance(v, list) else (round(v, 3) if isinstance(v, float) else v)
    return {'ph': rnd(ph), 'K': {k: rnd(v) for k, v in K.items()}, 'clip': rnd(clip), 'freezes': rnd(freezes), 'cues': C, 'dur': dur,
            'text': [p[0] for p in PH]}


if __name__ == '__main__':
    if '--nominal' in sys.argv:
        ph = nominal()
    else:
        tempo = float(sys.argv[sys.argv.index('--tempo') + 1]) if '--tempo' in sys.argv else 1.0
        ph = from_voice(sys.argv[1], sys.argv[2], tempo)
    TL = keys(ph)
    with open(os.path.join(HERE, 'timing.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Généré par timing.py — ne pas modifier à la main. */\nwindow.TL = ' + json.dumps(TL, ensure_ascii=False) + ';\n')
    print(f"timing.js écrit : durée {TL['dur']:.2f} s")
