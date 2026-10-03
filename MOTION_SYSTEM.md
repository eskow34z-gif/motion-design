# Flux Master Motion System V1.0 — « SILLAGE »

La vidéo **Flux Master V1** (2 octobre 2026) est la référence officielle. Les prochaines vidéos sont des évolutions de ce template. Nouvelles chorégraphies et transitions permises, à condition de rester dans le même système.

## 1. Verrouillé (ADN)

### 1.1 Espace et lumière
- Fond noir cinématique. L'UI claire (bleu glacier, sidebar navy) flotte dans cet espace.
- 3 plans de profondeur : environnement, UI, overlays. Flou de profondeur ≤ 2 px.
- Motif propriétaire : route en perspective et traînées lumineuses.
- Accent vert `#00C96B`. Une couleur par section : vert Véhicules, rouge Sniper, violet Analytics.

### 1.2 Le fil conducteur : le « sillage »
- Une traînée verte réveille l'UI, scanne le véhicule, transporte la donnée jusqu'au score, puis pousse l'opportunité dans le radar.
- Le chrome (sidebar, topbar) ne bouge jamais d'un bloc : seul le contenu « coule ».

### 1.3 Caméra 2.5D
- Caméra look-at : point visé, zoom, rotation X/Y.
- Zoom de 0,62 à 1,78. Rotations ≤ 8°.
- Jamais deux mouvements primaires en même temps.
- La caméra suit toujours le sujet (le scan, la comète).

### 1.4 Transitions par immersion
- Aucun fondu : un élément devient l'élément suivant.
- Exemples V1 : la carte Audi A8 devient le champ LIEN ; le contenu s'ouvre en deux quand 87 dépasse le seuil 75 ; la carte héro se transforme (rouge → violet) ; le logo vole dans la tuile FM et la tuile FM redevient le logo en fin de vidéo.

### 1.5 Structure narrative en 7 temps
1. Reveal du logo : flou → net, reflet sur le métal, arc tracé.
2. Réveil de l'UI par masque derrière le sillage.
3. Stagger d'entrée des éléments.
4. Focus progressif sur la donnée.
5. **Un seul moment héroïque** par vidéo, avec un silence d'un instant avant la récompense.
6. Cascade des fonctionnalités secondaires.
7. Assemblage final, recul de caméra, extinction, outro sombre avec branding.

### 1.6 Tokens
Voir `tokens/motion-tokens.json`. L'overshoot de ~12 % (spring `reward`) est réservé aux moments de récompense.

### 1.7 Son
Synthétisé de zéro (aucune musique existante), calé sur chaque mouvement : nappe grave à l'intro, un bip par donnée validée, montée de tension puis impact sur le moment héroïque, ping sonar, signature sonore sur le logo. Pas de voix.

## 2. Libre
- Nouvelles chorégraphies et transitions, si elles respectent 1.3 et 1.4 et utilisent les tokens.
- Rythme, durée, cadrage (vertical 1080×1920 pour les réseaux).
- Ordre et choix des fonctionnalités mises en avant.

## 3. Règles d'usage
- Pas de nouveau style. Toute entorse est signalée dans `outputs/LOG.md` avant le rendu.
- Pas d'emoji : icônes de style Lucide uniquement.
- Aucun chiffre ou fonctionnalité affiché sans vérification (voir `brand/flux-master-brand.md`).
