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
| `assets/` | Fichiers sources (à compléter, voir ci-dessous) |
| `outputs/` | Vidéos produites + `LOG.md` |

## Limite connue

Le script de rendu de la V1 et les assets extraits (logo détouré, photos, écrans reconstruits) n'ont pas été sauvegardés. Il faut les remettre dans `assets/` (voir `assets/README.md`). Sans eux, la première exécution sert de **test** : elle reconstruit ce qu'elle peut et le signale dans `outputs/LOG.md`.
