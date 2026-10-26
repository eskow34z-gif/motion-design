/* RESEAUX01 — repères partagés par la scène (caméra, flash) et les bruitages (audio.py lit ce tableau).
   Temps de l'animation (avant calage sur la voix). Intensité « dosée » :
   secousses ≤ 8 px sauf deux moments forts (NON à 3,10 s, CENSURÉ à 12,60 s) à 14 px, un seul flash (0,08), zoom ≤ 2 %.
   k = bruitage ; d = durée ; sh = secousse (px) ; pu = coup de zoom ; fl = flash [couleur, opacité] ; g = gain. */
window.CUES = [
  {"t": 0.00, "k": "paste", "d": 0.30},
  {"t": 0.18, "k": "whoosh", "d": 0.35},
  {"t": 0.42, "k": "slap", "sh": 4, "pu": 0.008},
  {"t": 1.00, "k": "stamp", "sh": 8, "pu": 0.015, "g": 0.85},
  {"t": 1.75, "k": "slam", "sh": 5, "pu": 0.01},
  {"t": 2.38, "k": "typing", "d": 0.32},
  {"t": 2.72, "k": "spray", "d": 0.38},
  {"t": 3.10, "k": "hit", "sh": 14, "pu": 0.02, "g": 0.8},

  {"t": 3.50, "k": "paste", "d": 0.30},
  {"t": 3.70, "k": "typing", "d": 0.35},
  {"t": 4.20, "k": "slam", "sh": 5, "pu": 0.01},
  {"t": 4.55, "k": "pop", "d": 0.3, "g": 0.7},
  {"t": 5.05, "k": "zip", "d": 0.4},
  {"t": 5.50, "k": "typing", "d": 0.25},
  {"t": 5.90, "k": "slam", "sh": 8, "pu": 0.018},

  {"t": 7.00, "k": "paste", "d": 0.30},
  {"t": 7.25, "k": "slam", "sh": 4, "pu": 0.008},
  {"t": 7.45, "k": "pop", "d": 0.3, "g": 0.5},
  {"t": 7.90, "k": "sweep", "d": 1.5, "g": 0.8},
  {"t": 8.70, "k": "typing", "d": 0.5},
  {"t": 9.95, "k": "aim", "d": 0.3},
  {"t": 10.20, "k": "slam", "sh": 8, "pu": 0.02},

  {"t": 11.00, "k": "paste", "d": 0.30},
  {"t": 11.20, "k": "whoosh", "d": 0.3},
  {"t": 11.45, "k": "typing", "d": 0.7},
  {"t": 12.60, "k": "stamp", "sh": 14, "pu": 0.02, "fl": ["#E8291C", 0.08], "g": 1.0},
  {"t": 12.90, "k": "typing", "d": 0.45},
  {"t": 13.60, "k": "slap", "sh": 5, "pu": 0.01},
  {"t": 14.20, "k": "slap", "sh": 6, "pu": 0.012},

  {"t": 15.00, "k": "rip", "d": 0.45, "sh": 6, "pu": 0.01},
  {"t": 15.25, "k": "typing", "d": 0.3},
  {"t": 15.70, "k": "stretch", "sh": 6, "pu": 0.012},
  {"t": 16.15, "k": "slap", "sh": 3},
  {"t": 16.45, "k": "thump", "sh": 6, "pu": 0.01},

  {"t": 17.00, "k": "paste", "d": 0.28},
  {"t": 17.15, "k": "ticks", "d": 0.5},
  {"t": 17.65, "k": "stamp", "sh": 8, "pu": 0.015, "g": 0.8},
  {"t": 17.95, "k": "slap", "sh": 3},
  {"t": 18.10, "k": "slap", "sh": 3},
  {"t": 18.25, "k": "slap", "sh": 3},
  {"t": 19.05, "k": "whoosh", "d": 0.35},
  {"t": 19.20, "k": "ticks", "d": 0.6},
  {"t": 19.80, "k": "clack", "sh": 6, "pu": 0.012},
  {"t": 20.00, "k": "slam", "sh": 6, "pu": 0.012},
  {"t": 20.45, "k": "typing", "d": 0.3},

  {"t": 21.00, "k": "paste", "d": 0.30},
  {"t": 21.20, "k": "typing", "d": 0.5},
  {"t": 21.90, "k": "slam", "sh": 5, "pu": 0.01},
  {"t": 22.15, "k": "slam", "sh": 7, "pu": 0.015},
  {"t": 22.60, "k": "slap", "sh": 3},
  {"t": 22.80, "k": "slap", "sh": 3},
  {"t": 23.00, "k": "slap", "sh": 3},
  {"t": 23.50, "k": "typing", "d": 0.55},
  {"t": 24.35, "k": "stamp", "sh": 8, "pu": 0.016, "g": 0.85},

  {"t": 25.00, "k": "pull", "d": 1.4},
  {"t": 26.45, "k": "spray", "d": 0.4},
  {"t": 26.95, "k": "slap", "sh": 3},
  {"t": 27.15, "k": "spray", "d": 0.45},
  {"t": 27.60, "k": "slam", "sh": 6, "pu": 0.012},
  {"t": 28.30, "k": "slap", "sh": 5, "pu": 0.012},
  {"t": 29.95, "k": "end", "d": 0.05}
];
