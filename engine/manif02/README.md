# MANIF02 — Réaction : charge place de la Bastille (17 octobre 2026)

Première vidéo au format « réaction » du standard AFFICHE (`../../AFFICHE-MOTION-SYSTEM.md`), intensité dosée.
Images clés dans Figma : page « MANIF02 — Réaction Bastille » du fichier « MANIF — La rue a de la mémoire (styleframes) ».

## Principe
La vidéo TikTok (26,4 s) est un tirage photo collé au mur. Elle joue en grand, puis se fige 4 fois en sérigraphie (bichromie encre/papier + trame) : le tirage se réduit en haut, un cercle au feutre désigne la scène, une carte verdict se colle dessous.

| Arrêt | Image source | Verdict |
|---|---|---|
| 1 | 1,0 s, ligne de police face aux photographes | CHARGER pour disperser : LÉGAL SI… 2 sommations, ou sans si attaqués (art. 431-3 CP, L211-9 CSI) |
| 2 | 7,9 s, casque « PRESSE » | FILMER : LÉGAL ; journalistes peuvent rester après l'ordre de dispersion (CE, 10 juin 2021) |
| 3 | 10,6 s, interpellation contre les Vélib | INTERPELLER : LÉGAL SI… force nécessaire et proportionnée (R434-18 CSI) |
| 4 | 21,2 s, personne au sol entourée | LÉGAL OU PAS ? IMPOSSIBLE À DIRE : on ne voit pas ce qui précède → IGPN, justice |

Puis affiche rouge : rester après les sommations = délit, jusqu'à 1 an et 15 000 € (art. 431-4 CP). Fin : mur avec le tirage, les 4 cartes et l'affiche, « ET TOI ? ».

## Fichiers
| Fichier | Rôle |
|---|---|
| `timing.py` | Aligne la prise sur les 24 morceaux du texte (silences fins + programmation dynamique), la remonte (×1,1, respirations bornées) et écrit `timing.js` : temps des morceaux, repères, carte du clip, arrêts, liste des bruitages/secousses |
| `scene.html`, `scenes.js` | Scène `renderAt(t)` (asynchrone : charge l'image du clip à afficher) ; réutilise `../manif01/core.js` et ses textures |
| `audio.py` | Voix + son d'origine (qui ralentit et s'arrête à chaque arrêt, s'inverse au rembobinage) + bruitages synthétisés, sans musique |
| `shoot_tiles.py` | Capture tirage, cartes et affiche sur fond transparent pour le mur final |
| `build.sh` | Chaîne complète : `engine/manif02/build.sh prise.mp3 sortie.mp4 1.1` (ou `-` à la place de la prise pour un aperçu sans voix) |

La vidéo source (`src/clip.mp4`) et ses images (`clip/`) ne sont pas versionnées : la vidéo appartient à un autre compte TikTok et le dépôt est public. Pour reconstruire, remettre la vidéo dans `src/clip.mp4`.
