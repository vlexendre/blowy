# Plan V3 — app complète, pixel-perfect, vérifiée parcours par parcours

Date : 2026-11-06. Demande : app complète fidèle aux maquettes V4, agents de vérification sur chaque flow/écran, parcours logiques multi-utilisateurs, et remise en question du concept par des personas (marché 2026).

## Phase 0 — Remettre le concept à l'épreuve (en cours)
- Brief marché : `docs/research/brief-marche-2026.md` (Tinder Events, Bumble Bee/Plans, Hinge, Amata).
- Panel de 6 personas indépendants (Léa 25 F, Hugo 25 M, Inès 21, Camille 31, Yanis 28 gay, Sarah 27 ex-utilisatrice) qui parcourent les 39 écrans rendus : `docs/research/personas/`.
- Synthèse de l'orchestrateur → **proposition de concept repensé** (ce qu'on garde, ce qu'on change, ce qu'on coupe) + impact sur les maquettes.
- **Point de décision utilisateur** avant la phase 2 : on construit la V4 telle quelle, ou la version repensée (qui demande de nouvelles maquettes sur les écrans touchés).

## Phase 1 — Bancs de vérification (en cours, indépendants du choix de concept)
- H-visuel : rendu des maquettes (`tooling/design-render`), capture de l'app en web (390×844 @2x), diff pixel par écran, rapport HTML, inventaire écran ↔ route ↔ états (`docs/qa/screen-inventory.md`, `docs/qa/visual-baseline.md`).
- H-parcours : parcours multi-utilisateurs bout en bout contre l'API réelle + WebSocket (Léa & Hugo, triangle, Quartier, sécurité, économie, concurrence, suppression) → `docs/qa/journeys-report.md`.

## Phase 2 — Construction par tranches verticales (après décision)
Une tranche = un parcours complet (écrans + API + moteur + données de démo), jamais un écran isolé :
1. Onboarding → éclosion → compte → vérif → paywall (01–09)
2. Rendez-vous de pets → nid → missions → série (10–15)
3. Chats → lien → révélation → RDV IRL + ange gardien (18–23)
4. Engagement long : emménager → œuf → bébé → garde ; rupture (21, 24–27)
5. Social : Quartier, ami, réponses web, story, ligues, carte (28–33)
6. Compte : profil, réglages, abonnement, confidentialité, signaler, supprimer (34–39)
Prérequis transverses : brancher `@blowy/pet-engine` (fin du moteur provisoire), tuning publié lu par le moteur, notifications, missions.

## La boucle de vérification (pour chaque tranche)
1. Agent constructeur livre la tranche + données de démo.
2. **Vérif visuelle** (agent distinct) : diff ≤ seuil par écran et par état ; captures jointes.
3. **Vérif parcours** (agent distinct) : le parcours multi-utilisateurs de la tranche passe, deux fois, base fraîche ; ce que voit chaque acteur est vérifié.
4. **Vérif persona** (agent distinct, n'a pas vu le code) : refait le parcours en captures d'écran et note friction / compréhension.
5. Orchestrateur : rejoue build, typecheck, tests, intégration ×2, migrate+seed base vierge ; merge sur main seulement si tout est vert. Sinon retour au constructeur avec les preuves.
Limite assumée : la vérif visuelle se fait en rendu web (react-native-web) dans ce conteneur ; le rendu natif iOS reste à confirmer sur ton Mac (Xcode ≥ 26.4).
