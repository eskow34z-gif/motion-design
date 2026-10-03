# TD01 — Tech&Dev — « L'agence complète »

Première vidéo de la marque **Tech&Dev**, construite sur le Flux Master Motion System V1.0 (« SILLAGE »).
Format réseaux : 1080×1920, 30 i/s, **27,0 s**, son synthétisé, aucune voix off.

## Fichiers
| Fichier | Rôle |
|---|---|
| `engine/theme-td01.html` | Scène (`renderAt(t)`, déterministe) |
| `engine/audio_theme_td01.py` | Bande son synthétisée, calée sur les temps ci-dessous |
| `assets/td/mark.png` | Monogramme TD détouré, haute définition |
| `outputs/TD01-tech-and-dev-2026-10-04.mp4` | Rendu livré |

## Charte appliquée
- Accent sillage : `#38BDF8` (bleu du « D » du logo). Accent interface : `#6C63FF` (violet des boutons du site).
- Fond : `#04070c`, motif propriétaire **grille en perspective + traînées + nœuds** (variante du motif « route » de Flux Master, même géométrie de point de fuite).
- Typo : Archivo (titres), Inter (interface), JetBrains Mono (surtitres).
- Icônes de style Lucide uniquement, aucun emoji.

## Structure en 7 temps
| Temps | Séquence |
|---|---|
| 0,0 – 3,3 | Reveal du logo : flou → net, reflet qui balaye le métal, wordmark, puis le monogramme **vole dans la barre de nav** du site |
| 2,4 – 4,8 | Réveil de l'accueil par faisceau, titre en trois lignes, sous-titre, deux boutons |
| 7,0 – 11,9 | Services : les onglets Informatique / Création Web / Design Graphique font **rouler** le contenu des trois cartes (aucun fondu) |
| 11,9 – 12,8 | Comète : transition par immersion vers les tarifs |
| 13,5 – 16,9 | **Moment héroïque unique** : la liste du pack se coche, montée, court silence (14,58–14,92), puis le prix bascule **650 € → 350 €** avec overshoot `reward`, impact grave, badge −46 % |
| 17,3 – 19,1 | Cascade secondaire : les trois colonnes de tarifs, ligne par ligne |
| 19,5 – 23,0 | Contact : saisie du formulaire, validations, envoi, badges « Réponse sous 24h » / « Maquette offerte » |
| 23,5 – 27,0 | Assemblage : recul de caméra, les quatre panneaux se relient, extinction, outro logo + site + @td.agence |

## Entorses déclarées au Motion System
1. **Couleur d'accent** : bleu/indigo Tech&Dev au lieu du vert Flux Master — changement de marque, pas de style.
2. **Motif de fond** : grille au lieu de la route — même construction en perspective, sujet adapté à une agence.
3. **Zoom final 0,34** (plancher des tokens : 0,62), nécessaire au plan d'assemblage des quatre panneaux.

## À vérifier avant publication
- Tarifs affichés (350 € barré 650 €, colonnes) : repris des captures du site, à confirmer s'ils ont bougé.
- Le formulaire montre un nom et un e-mail **fictifs** (Marie Lefèvre / contact@salon-marie.fr).
- « Réponse sous 24h » et « maquette offerte » sont des promesses affichées sur le site : à tenir.
