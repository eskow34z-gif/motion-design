# SOURCE01 — « La Source · Tout est dispo »

Motion design 9:16 pour TikTok et Reels, 21,4 s (v2), 30 i/s. Promotion du canal Telegram « La Source - Tout Est Dispo » : véhicules à bon prix, commandes en gros, plans revente, fiches immo, demandes en privé.

Standard **AFFICHE** (`AFFICHE-MOTION-SYSTEM.md`), intensité **dosée** : 2 secousses fortes (4,50 s et 16,85 s), 1 seul flash (0,08), coups de zoom ≤ 2 %, slams depuis 1,35, un effet signature par affiche. **Bruitages seuls** : ni musique ni voix (un son TikTok peut être posé par-dessus). Aucun texte dans les coins.

Images clés et planche couleurs/typos dans Figma : *SOURCE01 — Tout est dispo (styleframes)*.

## Chorégraphie
| Temps | Affiche | Effet signature |
|---|---|---|
| 0–2,9 s | T'AS CHERCHÉ PARTOUT ? — trois petites annonces | tampons ÉPUISÉ / VENDU / RUPTURE |
| 2,9–5,4 s | LA SOURCE — TOUT EST DISPO — CANAL TELEGRAM | grand tampon DISPO (moment fort, flash) |
| 5,4–8 s | VÉHICULES — À BON PRIX | voiture tramée qui entre avec traînées |
| 8–10,6 s | COMMANDES EN GROS | trois cartons qui tombent et s'empilent |
| 10,6–13,2 s | PLANS REVENTE + FICHES IMMO | annonce à languettes, une languette arrachée |
| 13,2–15,3 s | UNE DEMANDE ? ÉCRIS-MOI EN PRIVÉ | avion en papier et sa traînée |
| 15,3–17,35 s | le mur — REJOINS LA SOURCE | recul sur le mur, tag bombé fluo |
| 17,35–21,4 s | le flyer (`flyer.html`) collé sur le mur, puis plein cadre | collage au balai + avancée de caméra, tenue 2,5 s |

## Fluidité (v2)
- Chaque affiche se pose et respire (échelle 1,04 → 1 sur 2,8 s).
- L'affiche recouverte s'enfonce légèrement et passe dans l'ombre sous la nouvelle.
- La caméra accompagne chaque coup de balai (léger déplacement dans le sens du collage, retour amorti).

## Fichiers
| Fichier | Rôle |
|---|---|
| `scene.html`, `scenes.js` | Scène déterministe `renderAt(t)` ; réutilise `../manif01/core.js` et les textures `../manif01/tex/` |
| `cues.js` | Repères communs : sons, secousses, flash |
| `shoot_tiles.py` | Capture des 6 affiches finies pour le mur (`tiles/`, non versionné) |
| `audio.py` | Bruitages synthétisés + ambiance de rue très basse |
| `flyer.html`, `flyer.js` | Flyer 1080×1920 (aussi image de fin de la vidéo, `tiles/flyer.png`) |
| `build.sh` | Chaîne complète → MP4 à −14 LUFS |

## Rendu
```bash
engine/source01/build.sh outputs/SOURCE01-tout-est-dispo-AAAA-MM-JJ.mp4
```

## Textes affichés
Aucun prix ni chiffre. Les annonces de l'accroche (sneakers taille 42, citadine faible km, lot de 10 écouteurs) sont illustratives. Aucune marque citée. Lien Telegram (avec le r, confirmé) : `t.me/lasourcetoutestdisponibleoff` ; Snapchat `la.source206` ; WhatsApp 06 35 09 74 66. La v1 affichait l'ancien lien sans r.
