# MANIF01 — « La rue a de la mémoire »

Motion design 9:16, 30 s, 30 i/s. Sujet : la mobilisation lycéenne de l'automne 2026 replacée dans la lignée des mobilisations de la jeunesse (1968, 1986, 2006, 2019). Public 15–25 ans.

Direction artistique « affiche de rue » validée dans Figma : fichier *MANIF — La rue a de la mémoire (styleframes)* (planche typo/couleurs + 4 images clés).

## Principe
Chaque scène est une affiche collée au balai sur la précédente. Le fil rouge est un compteur mécanique d'années (11,5–25,5 s). À la fin, la caméra recule et révèle le mur : toutes les affiches de la vidéo, capturées pendant le rendu (`tiles/`).

## Fichiers
| Fichier | Rôle |
|---|---|
| `scene.html`, `core.js`, `scenes.js` | Scène déterministe `renderAt(t)` |
| `cues.js` | Repères communs : sons, secousses de caméra, flashs |
| `make_textures.py` | Papier frais, papier ancien, affiche noire, plis de colle, usure de tampon |
| `shoot_tiles.py` | Capture des affiches finies pour le mur et le broyeur du CPE |
| `audio.py` | Rythmique 120 BPM + bruitages synthétisés, calés sur `cues.js` |
| `build.sh` | Chaîne complète → MP4 à −14 LUFS |

## Rendu
```bash
engine/manif01/build.sh outputs/MANIF01-la-rue-a-de-la-memoire-AAAA-MM-JJ.mp4
```
Planche de contrôle : `python3 engine/render.py --html engine/manif01/scene.html --cpu --frames 2,7,11.2,16.6,24.1,28 --sheet /tmp/sheet.jpg` (lancer `shoot_tiles.py` d'abord pour que le mur et le broyeur aient leurs images).

## Voix off (à faire quand les crédits ElevenLabs sont rechargés)
Texte prévu pour « Léo » (ElevenLabs, eleven_v4), ci-dessous. Les temps de la scène ont été posés sur une grille de 0,5 s ; avec la voix, recaler chaque scène sur le premier mot de sa phrase (transcription Scribe, comme TD07) et baisser la rythmique d'environ 10 dB sous la voix.

> Mi-septembre, Créteil. Un lycée dit stop. Profs pas remplacés, classes blindées, Parcoursup. Deux semaines après : près d'un lycée sur trois. Le dix-sept octobre : plus d'un demi-million dans la rue. Mais la jeunesse dans la rue… c'est pas nouveau. Soixante-huit : les étudiants allument la mèche. Quatre-vingt-six : la sélection à la fac ? Retirée. Deux mille six : le CPE, voté… puis enterré. Deux mille dix-neuf : grève pour le climat. Et deux mille vingt-six ? Quarante ans après, la sélection est encore dans le viseur. Et toi… t'en penses quoi ?

## Faits affichés (vérifiés le 18/10/2026)
- Départ d'un lycée de Créteil mi-septembre 2026.
- Près de 30 % des lycées touchés par des actions au 1er octobre (Le Monde, cité par Webdo) → « près d'un lycée sur 3 ».
- 17 octobre : 550 000 selon le ministère de l'Intérieur, 800 000 selon les organisateurs (France 24) → les deux chiffres affichés avec leur source.
- Loi Devaquet (sélection à l'entrée de l'université) retirée le 8 décembre 1986.
- CPE adopté puis retiré en avril 2006.
- 2019 : grèves de la jeunesse pour le climat.
Illustratif : carte en points (répartition aléatoire, pas une carte réelle des lycées mobilisés), pancartes, foules, mur d'affiches.
