# Flux Master — Motion System

Dépôt de référence pour produire les vidéos motion design de **Flux Master** (SK Flux Master).
Toute vidéo doit être une évolution du template **Flux Master Motion System V1.0** (nom de code « SILLAGE »). On ne recrée jamais un nouveau style.

## Ordre de lecture pour une tâche automatisée

1. `CLOUD_TASK_PROMPT.md` : le prompt à suivre, de bout en bout.
2. `MOTION_SYSTEM.md` : l'ADN verrouillé et ce qui est libre.
3. `tokens/motion-tokens.json` : durées, courbes, springs, staggers, caméra.
4. `storyboard/V1-sillage.md` : la timeline de référence (V1, 23 s).
5. `brand/flux-master-brand.md` : couleurs, typographies, structure de l'UI, chiffres produit.
6. `themes/THEME-0X-*.md` : le brief de la vidéo à produire.
7. `assets/` : logo, écrans, photos (voir `assets/README.md`).

## Contenu

| Dossier / fichier | Rôle |
|---|---|
| `MOTION_SYSTEM.md` | Cahier des charges du template maître |
| `tokens/` | Valeurs de mouvement exploitables par le code |
| `storyboard/` | Chorégraphie de référence de la V1 |
| `brand/` | Identité, UI, chiffres produit (à revérifier avant publication) |
| `themes/` | 5 briefs de vidéos réseaux sociaux |
| `schedule.json` | Cadence de production et règles de reprise |
| `assets/` | Logo détouré, écrans, photos (voir `assets/README.md`) |
| `engine/` | Moteur de rendu : scène du thème 1, bibliothèque de mouvement, son, rendu MP4 |
| `outputs/` | Vidéos produites + `LOG.md` |

## État

- Thème 1 (score IA) : rendu de test livré, voir `outputs/LOG.md`.
- Le moteur actuel est une réécriture : les sources de la vidéo V1 d'origine n'ont pas été conservées. Il applique le même Motion System (tokens, caméra, transitions, structure en 7 temps).
- Thème 2 (Sniper) : livré, `engine/theme02.html`.
- Thème 3 (anti-arnaque) : livré, `engine/theme03.html`.
- Thèmes 4 à 5 : briefs prêts dans `themes/`.
