# Marque et produit — Flux Master

## Produit
- Agrégateur d'annonces de véhicules d'occasion : eBay, AutoScout24 (plusieurs pays), ParuVendu, L'Argus, etc.
- Fonctions : scoring IA du prix, détection de risque d'arnaque, agent de recherche « Sniper », alertes (Telegram), import Europe.
- Site : sk-flux-master-v-16.vercel.app
- Stack : React/Vite, Supabase, n8n, Groq, Resend.

## Chiffres vus dans les captures et les données (À REVÉRIFIER avant toute publication)
- Captures UI : 55/100, +3 814 €, 19 859 annonces, 7 026, taux 35 %, 8 sources, 60 opportunités, marge estimée ~11 273 €, seuil Sniper 75+.
- Base de données (28 sept. 2026) : 13 928 annonces, 7 sources, 124 marques, mise à jour toutes les 2 h.
- Ces chiffres évoluent. Ne les afficher que s'ils sont confirmés le jour du rendu, sinon utiliser des valeurs clairement illustratives.
- Les badges de score des écrans sont des exemples, pas des scores calculés en direct. Confirmer quelles fonctions sont réellement en ligne (scoring, détection d'arnaque, Sniper) avant de les promettre.

## Couleurs
| Usage | Valeur |
|---|---|
| Sidebar | `#0D141E` → `#101925` (navy), largeur 77 px |
| Accent / Véhicules | `#00C96B` (vert) |
| Sniper | rouge (bordure gauche de la carte héro) |
| Analytics | violet (bordure gauche de la carte héro) |
| Fond UI | bleu glacier ; topbar blanche ; bandeau de stats menthe |
| Fond vidéo | noir cinématique |
| Logo | hexagone « FM » en métal brossé, wordmark FLUX MASTER espacé, arc bleu |

## Typographies
- Titres (héro) : grotesque très large (Archivo variable).
- Chiffres et labels de données : monospace (JetBrains Mono).
- Les polices doivent être embarquées localement (npm `@fontsource-variable/archivo`, `@fontsource-variable/jetbrains-mono`) pour un rendu headless identique.

## Structure de l'UI
- Sidebar : tuile logo FM, 8 icônes, item actif = tuile vert sombre + barre verte à gauche ; en bas tag / alerte / réglages / déconnexion rouge.
- Topbar : tuile FM + fil d'Ariane `FLUX › Page › sous-titre`, pastille verte « Pontault-Combault » + point live.
- Carte héro : bordure gauche qui code la section.
- Écrans : Véhicules (onglets Bons Plans / Occasion / Import EU, 4 cartes avec photo, badge AUTOSCOUT24 ES/IT/DE, PÉPITE, specs, prix mono, BONNE AFFAIRE, ANALYSER IA), Analyse lien (formulaire Prix → KM → Année → Énergie → Prix marché, « Score en attente », « Mes dernières analyses »), Sniper (Radar / Négociation, EXCEPTIONNEL, TRÈS RÉCENTE), Analytics (répartition par source, barres).
- Pas d'emoji : icônes Lucide.

## Écrans supplémentaires vus dans les captures du 3 octobre 2026
- Analyse lien : bandeau « Sources 6 · APIs NHTSA · IGN · Public Gratuit », champs Lien, VIN (bouton Décoder), Source, Prix, Marque/Modèle, Année, KM, Prix marché, Énergie, Vendeur, Profil, Objectif, Ville vendeur, bloc « APIs gratuites » (SIREN, n° TVA intra, bouton Enrichir automatiquement).
- Analytics : bandeau « Annonces 19859 · Deals HOT 5835 · Sources 8 », « Bonnes affaires 7026 (score ≥ 70) », répartition par source (AutoScout24 3 479 (18 %), L'Argus 2 794 (14 %), ParuVendu 249 (1 %), etc.).
- Sniper : bandeau « Opportunités 5835 · Seuil score 75+ · Négo IA Oui », onglets Radar / Négociation, boutons « Préparer la négo » et « Voir l'annonce ».
- Détail annonce : galerie photos, prix, Flux Score en jauge (100/100 sur l'exemple), bloc marge estimée.
- Bandeau défilant de prix en haut de certaines pages (annonces avec étiquette HOT).
- Chat IA : bordure orange. La capture fournie affiche une erreur (« Groq: the model llama-3.1-8b-instant does not exist or you do not have access to it »). À corriger côté produit avant toute vidéo qui montre ce module.
