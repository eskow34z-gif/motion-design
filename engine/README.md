# Moteur de rendu Flux Master

Une scène est une page HTML qui expose `renderAt(t)` : tout est fonction pure du temps, donc le rendu est déterministe (image par image). `render.py` pilote Chrome, capture chaque image et encode avec ffmpeg.

## Fichiers
| Fichier | Rôle |
|---|---|
| `lib.js` | Courbes et springs du Motion System, caméra look-at, fond « route + traînées » |
| `theme01.html` | Scène du thème 1 (score IA), 18,6 s, vertical 1080×1920, 30 i/s. Modèle pour les autres thèmes |
| `audio_theme01.py` | Bande son synthétisée (numpy/scipy), calée sur les temps de `theme01.html` |
| `render.py` | Capture + encodage. Planche de contrôle ou MP4 complet |

## Utilisation
```bash
cd engine && npm install                 # gsap + polices (Archivo, Inter, JetBrains Mono)
cd ..
# 1. planche de frames clés pour contrôle
python3 engine/render.py --html engine/theme01.html --frames 1.8,3.5,6,9,12.5,14,18 --sheet /tmp/sheet.jpg
# 2. son
python3 engine/audio_theme01.py /tmp/theme01.wav
# 3. rendu complet
python3 engine/render.py --html engine/theme01.html --audio /tmp/theme01.wav --out outputs/THEME-01-score-ia-AAAA-MM-JJ.mp4
```
Prérequis : Chrome (`/opt/google/chrome/chrome` ou chromium), Playwright (Python), ffmpeg, Node. Rendu complet : environ 1 à 2 minutes sur 2 cœurs.

## Créer la scène d'un nouveau thème
1. Copier `theme01.html` en `themeNN.html` et `audio_theme01.py` en `audio_themeNN.py`.
2. Garder : `lib.js`, les tokens, le fond, la structure en 7 temps, les overlays de champs et la carte score si utile.
3. Changer : les keyframes de caméra (`KF`), les écrans utilisés (`assets/screens/`), les légendes (`CAPS`), le moment héroïque (un seul).
4. Mettre à jour les temps du script audio pour qu'ils restent alignés avec la scène.
5. Contrôler une planche de frames, puis rendre.

## Règles
- Coordonnées des écrans : les captures sont posées à l'échelle 1:1 dans le « monde » ; la caméra se règle avec `cx, cy, z, rx, ry`.
- Une seule vitesse de caméra élevée (le « whip ») à la fois, avec flou de mouvement automatique.
- Pas de fondu entre écrans ; pas d'emoji ; chiffres illustratifs signalés dans `outputs/LOG.md`.
