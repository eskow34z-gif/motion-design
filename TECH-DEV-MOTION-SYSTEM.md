# Tech&Dev Motion System V1.0 — « KINÉTIQUE »

Système propre à Tech&Dev, issu de SILLAGE (Flux Master) mais **conçu pour les réseaux**, pas pour une démo produit.
Référence : `engine/theme-td02.html` + `engine/audio_theme_td02.py`.

## Pourquoi un nouveau système
SILLAGE fait visiter une interface : caméra lente, UI qui flotte, texte lointain. Pour une agence, personne ne regarde le site d'un inconnu défiler. KINÉTIQUE inverse tout : **la typo est le sujet**, l'interface a disparu.

## 1. Verrouillé (ADN)

### 1.1 Les trois secondes
- Aucun logo au début. Il est **uniquement** à la fin. Le premier mot tombe avant 0,3 s.
- La première phrase est un problème du spectateur, jamais une présentation de l'agence.

### 1.2 Typographie plein cadre
- Archivo 800, stretch 125 %, capitales, interlettrage −0,035 em, interligne 0,94.
- Corps de base 80 px sur 1080 de large, 150 px pour un mot isolé (« NON. »).
- Une ligne tient toujours sur une seule ligne (`white-space:nowrap`). Au-delà de 15 caractères, on coupe la phrase en deux lignes.
- Deux lignes maximum par plan. Un plan dure 0,8 à 1,5 s.

### 1.3 Grille rythmique
- 120 BPM, une noire = 0,5 s. **Tout** tombe sur la grille : mots, chips, kick, charleston.
- Coupes franches : le plan sortant disparaît en 0,2 s, 0,2 s avant l'entrée du suivant. Aucun fondu croisé.

### 1.4 Les quatre entrées de texte
| Nom | Geste | Usage |
|---|---|---|
| `slam` | arrive de loin (translateZ −520), ressort `reward`, flou 26 → 0, aberration 26 px | impacts, punchlines |
| `rise` | monte de 130 px en basculant (rotateX 34°) | mise en place d'une phrase |
| `swipe` | balayage latéral avec cisaillement, courbe `whip` | ruptures |
| `pop` | ressort `snap` | éléments secondaires |

### 1.5 Matière (ce qui distingue du rendu synthétique)
- **Grain argentique** composé dans le canvas du fond (`overlay`, alpha 0,17), décalé à chaque image. Jamais en `mix-blend-mode` CSS : la fusion peut rater sur une capture isolée et blanchir l'image.
- **Aberration chromatique** proportionnelle à l'impact : `text-shadow` rouge/cyan décalé, qui retombe en 0,14 s.
- **Flou de bougé** sur l'entrée de chaque mot.
- **Lumière volumétrique** : quatre nappes colorées qui dérivent et pulsent sur chaque temps.
- **Éclat d'impact** dessiné dans le canvas, derrière le texte — jamais un voile blanc par-dessus.
- **Fuite de lumière** chaude qui traverse le cadre au moment du prix.
- **Verre dépoli** : `backdrop-filter: blur(30px) saturate(1.5)`, liseré clair en haut, ombre portée profonde.

### 1.6 Couleurs
Fond `#07070B`. Violet `#8B7CFF`, cyan `#4FD4FF`, chaud `#FF7A4D` (réservé au problème et au refus), gris `#78839A`.
Une seule couleur accentuée par plan.

### 1.7 Son
120 BPM synthétisé de zéro, aucune voix. Kick + sub sur les noires, charleston sur les croches, une note par élément de liste (gamme montante), impact grave sur chaque slam, **la grille se tait 0,65 s avant le prix**, puis repart plus fort. Signature en accord sur le logo.

## 2. Libre
- Les punchlines, leur ordre, le nombre de plans.
- Les positions des chips et la chorégraphie des listes.
- La durée totale : viser 20 à 30 s.

## 3. Règles d'usage
- Aucune statistique inventée. Si un chiffre n'est pas vérifiable, on écrit une phrase, pas un pourcentage.
- Aucun emoji : icônes de style Lucide uniquement.
- Les tarifs affichés doivent correspondre au site le jour de la publication.
- Toute entorse est consignée dans `outputs/LOG.md` avant le rendu.
- Export : 1080×1920, 30 i/s, H.264 CRF 22 avec `aq-mode=3` (le grain fait exploser le débit à CRF 17 : 77 Mo contre 16 Mo).
