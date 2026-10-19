# Motion System « AFFICHE » V1.0 — standard par défaut

**Décidé le 19/10/2026 par Exaucé : toutes les prochaines vidéos suivent ce système, sauf s'il demande autre chose — y compris les vidéos Flux Master et Tech&Dev** (qui remplacent SILLAGE et KINÉTIQUE ; logo et couleurs de la marque restent ceux de la marque).
Référence : MANIF01 « La rue a de la mémoire » (`engine/manif01/`, `outputs/MANIF01-*`). Le niveau d'effets par défaut est **« dosé »**, un cran en dessous de MANIF01 (voir § Intensité).

## 1. Format
- Vertical 1080×1920, 30 i/s, 25 à 35 s. Public 15–25 ans, ton direct, tutoiement.
- Voix off + bruitages. **Pas de musique** par défaut (Exaucé pose un son TikTok par-dessus).
- **Aucun texte dans les coins** : ni sur-titre, ni petite phrase en haut à gauche, ni logo de chaîne. Tout le texte fait partie de la composition.

## 2. Principe narratif
- Chaque scène est **une affiche collée au balai sur la précédente** (bord irrégulier, bande humide qui suit le balai, plis de colle qui sèchent).
- Un **fil rouge mécanique** relie les scènes quand il y a une chronologie ou des chiffres (compteur à rouleaux).
- Fin : **recul de caméra sur le mur** de toutes les affiches de la vidéo, puis question au public (tag bombé + sticker).
- Les transitions passent par la matière : collage, déchirure, broyeur, affiche arrachée qui révèle l'ancienne. Jamais de fondu.

## 3. Couleurs
| Rôle | Valeur |
|---|---|
| Papier | `#EEE7D7` |
| Encre (jamais de noir pur) | `#141210` |
| Rouge sérigraphie | `#E8291C` |
| Papier clair (bandes, tracts, pancartes) | `#F7F2E6` |
| Papier ancien (passé) | `#E2D0A0` |
| Mur | `#2A2622` |
| Kraft (manches, mèche) | `#C9A86A` |
| Fluo (**uniquement** la question finale) | `#E6FF3A` |
Accent ponctuel autorisé si le sujet l'impose (ex. bleu `#2B4C7E` pour le climat). Pas de dégradés décoratifs.

## 4. Typographies (npm `@fontsource`)
| Police | Usage |
|---|---|
| Big Shoulders Stencil Display 900 | Années, chiffres, compteurs, tampons |
| Anybody (variable, largeur animée 50–150 %) | Titres, mots-chocs |
| Special Elite | Contexte, tracts, machine à écrire |
| Permanent Marker | Pancartes, annotations au feutre |
| Rubik Spray Paint | Tags bombés — **2 maximum par vidéo** |
| Space Mono Bold | Sources, légendes, dates |
Interdit : Inter, Roboto, Arial et toute police système.

## 5. Matières et vocabulaire graphique
- Textures (`make_textures.py`) : papier frais et papier ancien (multiply), affiche noire avec poussières et rayures (screen), plis de colle (overlay), usure de tampon (masque). Grain ajouté à l'encodage.
- Motifs : trame de points (demi-ton), bords déchirés, scotch, tampons encreurs usés, pancartes sur manche, foules en silhouettes qui bougent (pancartes avec de vrais mots), compteur à rouleaux, machine à écrire avec curseur, bombe (révélation + brume + coulures), décalage de repérage rouge/encre.
- Chiffre contesté : les deux sources affichées côte à côte, chacune légendée (« selon l'Intérieur », « selon les organisateurs »).

## 6. Mouvement
- Courbes : collage `io2` ; entrées latérales `outExpo` ; compteurs `out5` ; pancartes, bandes, stickers en ressort (≈ 2 Hz, amortissement 0,45–0,5).
- **Slam** : le mot tombe de plus grand à 1 avec un petit rebond.
- Tremblé « fait main » à 12 i/s sur les lettres et éléments posés.
- Caméra : légère dérive continue ; secousse et coup de zoom uniquement sur les impacts.
- Flou de bougé réel au rendu (`render.py --sub 3`).
- Chaque information reste lisible **au moins 0,8 s** sans bouger.

## 7. Intensité « dosée » (défaut)
| Paramètre | Dosé (défaut) | MANIF01 (« max », sur demande) |
|---|---|---|
| Secousse caméra | ≤ 8 px ; 2 moments forts à 14 px max | jusqu'à 26 px, sur presque chaque impact |
| Flash plein cadre | aucun, ou 1 seul (≤ 0,08) | 6 |
| Coup de zoom | ≤ 2 % | jusqu'à 6,5 % |
| Échelle de départ du slam | 1,35 | 1,6 à 2,8 |
| Particules (brume, éclats) | environ la moitié | — |
| Effets signature par scène | 1 | 2 à 3 |

## 8. Son
- Voix : ElevenLabs. J'écris le texte (chiffres en lettres) ; si les crédits manquent, Exaucé génère la prise et me l'envoie.
- Calage : `voice.py` découpe la prise en morceaux de phrase, la resserre (≈ ×1,1) et écrit `warp.js` pour que chaque mot clé tombe sur son impact. L'animation n'est pas retouchée.
- Bruitages synthétisés (`audio.py`) calés sur `cues.js` ; environ 9 dB sous la voix.
- Master −14 LUFS, crête vraie ≤ −1 dBFS **après** l'encodage AAC (limiteur après la normalisation).

## 9. Vidéo réelle incrustée (format réaction) — référence : MANIF02 (`engine/manif02/`)
- La séquence est traitée comme **une photo imprimée collée sur le mur** : cadre papier déchiré, scotch, légère rotation, trame et grain par-dessus pour qu'elle appartienne au même monde.
- On réagit par **arrêts sur image** : la vidéo se fige, cercle ou flèche au feutre, légende tapée à la machine, tampon si besoin, puis elle repart.
- Images extraites à l'avance avec ffmpeg (une image par pas de temps) pour garder un rendu image par image exact. Le son d'origine passe sous la voix (−12 dB environ) si la vidéo en a.
- Réaction factuelle : ce qu'on voit, le contexte, les chiffres sourcés, la question au public. Pas de prise de position.
- Vidéo d'un autre compte : crédit sur le bord du tirage (« VIDÉO : @compte » ou « VIDÉO : TIKTOK »), jamais dans un coin de l'écran. La vidéo source n'est pas versionnée dans le dépôt (public).
- Floutage des visages proposé à chaque fois ; c'est Exaucé qui décide.
- Mise en page : vidéo en grand pendant la lecture ; à l'arrêt, le tirage se réduit en haut (×0,655) et la carte verdict se colle en dessous. La carte du clip et les arrêts absorbent les écarts de durée de la voix (`timing.py`), la vidéo n'est jamais accélérée ni ralentie.

## 10. Chaîne de production
1. Vérifier les faits (recherche du jour) et écrire le script.
2. Images clés dans Figma : planche couleurs/typos + 3 ou 4 images clés.
3. Scène HTML déterministe `renderAt(t)` en réutilisant `engine/manif01/core.js` (affiches, collage, compteur, foules, particules, trames, déchirures).
4. Planches de contrôle, puis rendu complet `--cpu --sub 3`.
5. Contrôle sur la vidéo finale (`check.py` : images clés + niveaux), entrée dans `outputs/LOG.md`, commit et push.
