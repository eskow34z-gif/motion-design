# Prompt de la tâche automatisée

Tu produis UNE vidéo motion design Flux Master. Le numéro de thème t'est donné dans la demande (THEME-0X). Cette tâche démarre sans mémoire de conversation : tout ce dont tu as besoin est dans ce dépôt.

## Étapes
1. Lis `README.md`, `MOTION_SYSTEM.md`, `tokens/motion-tokens.json`, `storyboard/V1-sillage.md`, `brand/flux-master-brand.md`, puis le brief `themes/THEME-0X-*.md`.
2. Vérifie `assets/`. Si le logo ou les écrans nécessaires au thème manquent, ARRÊTE-TOI : écris le détail dans `outputs/LOG.md` (date, thème, assets manquants) et ne produis rien d'approximatif.
3. Applique le Motion System V1.0 sans nouveau style. Tu peux inventer chorégraphies et transitions, dans les limites de `MOTION_SYSTEM.md` (un seul moment héroïque, un seul mouvement de caméra primaire à la fois, pas de fondu, pas d'emoji).
4. Construis la vidéo : timeline GSAP seekable, capture frame par frame (Chrome headless), son synthétisé, encodage ffmpeg. Format vertical 1080×1920.
5. Contrôle : rends des frames clés, compare-les aux écrans de référence, corrige. Vérifie que les chiffres affichés respectent `brand/flux-master-brand.md` (valeurs illustratives si non confirmées).
6. Livre : `outputs/THEME-0X-<slug>-<date>.mp4`, plus une ligne dans `outputs/LOG.md` (succès, durée, entorses au système éventuelles, points à vérifier).
7. Si un quota ou un outil manque en cours de route, consigne l'état dans `outputs/LOG.md` pour qu'une tâche de rattrapage reprenne.

## Rattrapage
La tâche de rattrapage lit `outputs/LOG.md`, repère les thèmes sans vidéo livrée (échec ou non démarrés) et produit le premier manquant, un seul par exécution.
