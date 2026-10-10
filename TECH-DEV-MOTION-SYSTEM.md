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

---

# Variante « SIGNATURE » (TD04) — film de marque
Référence : `engine/theme-td04.html` + `engine/audio_theme_td04.py`. À utiliser quand le but est l'**image de marque** (pub sponsorisée, vidéo épinglée), pas la conversion directe.

- **Logo au début et à la fin** : révélé par un scan lumineux, légère profondeur 3D (rotation + extrusion), reflet métallique masqué par la forme du logo. `assets/td/mark.png` tel quel, jamais redessiné.
- **Palette stricte** : fond `#030508`, bleu du logo en dégradé `#6FD6FF → #2E8CFF → #1F63F0` (signature, jamais en aplat plein cadre), blanc `#F4F6FA`, gris métal `#8E97A8`. Pas de violet, pas d'orange.
- **Typo** : Inter Display 800 (titres, −0,034 em, ajustés pour tenir dans 760 px), Inter 500/600 (secondaire), Space Grotesk 700 (mot-symbole TECH&DEV), JetBrains Mono (index 01/06).
- **Entrée de texte** : montée masquée avec flou → net, sortie vers le haut. Aberration chromatique uniquement sur un mot d'impact (PROTÉGER.), 0,07 s.
- **Services** : un univers graphique de 1,5 s par service, même mise en page (visuel au centre, index + titre + barre de progression dessous), raccords par zoom ou morphing.
- **Accélération** : fragments des 6 services en profondeur, aspirés vers un point → implosion (point, éclat, onde) → logo.
- **Rendu** : `render.py --sub 4` pour un flou de bougé réel (4 sous-images, obturateur 180°), `--crf 20 --x264 aq-mode=3`.

## SIGNATURE V2 (TD05) — remplace TD04
Référence : `engine/theme-td05.html` + `engine/audio_theme_td05.py`. Retour client sur TD04 : « pas assez travaillé, bleu répétitif ».
- **Couleur** : noir, blanc, chrome. Le bleu est réservé à cinq moments (D du logo, « PROS. », cœur IA / chemin réseau, verrou, « PARLONS-EN. »). Jamais de brume bleue, jamais de lignes bleues.
- **3D temps réel** (three.js, studio noir à bandes lumineuses) : logo extrudé depuis `assets/td/mark-outline.json`, face = `assets/td/mark-face.png` (logo exact), révélé en silhouette puis par un scan.
- **Une composition par service**, objet 3D + titre plein cadre placé différemment à chaque fois ; une scène claire (design) pour casser le rythme.
- **Rendu** : `render.py --sub 3 --crf 19 --x264 aq-mode=3 --vf "noise=alls=5:allf=t"` (WebGL via SwiftShader, environ 30 min).

---

# Variante « DÉCRYPTAGE » (TD06) — actualité expliquée
Référence : `engine/theme-td06.html` + `engine/audio_theme_td06.py` + `engine/mix_td06.sh`. Pour un sujet d'actualité expliqué en 25-30 s, avec Tech&Dev seulement à la fin.

- **Voix off** ElevenLabs « Max - Narration » (`eleven_v4`). La transcription Scribe de la prise donne les temps au mot près, recopiés dans `RAW` ; la voix est accélérée au mixage (`SPD`) et décalée (`OFF`), la scène calcule `T(mot) = OFF + brut / SPD`. Changer de prise = remplacer la table `RAW`.
- **Pas de musique** : bruitages synthétisés (impacts, souffles, clics d'interface, notifications), mixés environ 11 dB sous la voix, puis −14 LUFS en deux passes.
- **Typo** : Archivo 800 condensé 72 % pour les titres (plus haut, plus « info »), Archivo 900 étendu 125 % pour les chiffres seuls (400, 10 %, 2024-2025), JetBrains Mono pour tout ce qui est « système ».
- **Couleur** : celles de la marque. Bleu pour les faits et la marque, rouge réservé au problème (fermé, bloqué, 10 %, « ne saute pas »).
- **HUD** : « ● SUJET » en haut à gauche, « DÉCRYPTAGE » à droite, ligne de sources datée dessous. Disparaît avant le mur final.
- **Humour visuel** par objets d'interface : interrupteur, fenêtre « accès refusé », erreur 404, notification de rappel. Une blague par plan, jamais aux dépens des personnes.
- **Fin** : mur de mots-clés de la vidéo qui se monte (« on bloque rien ») puis s'effondre (« on débloque »), cadenas qui s'ouvre, pastilles de services, logo `assets/td/mark.png` + Space Grotesk + les deux pseudos.
- **Rendu** : `render.py --cpu --sub 3 --crf 20 --x264 aq-mode=3 --vf "noise=alls=5:allf=t"` puis `mix_td06.sh`. Les canvas « mid » et « fx » utilisent `willReadFrequently` et ne sont jamais laissés vides : sinon une image figée peut rester affichée d'une capture à l'autre.

