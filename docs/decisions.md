# Décisions (ADR courts)

Format : ID · décision · conséquence visible. Les arbitrages produit §5.x du prompt sont repris tels quels (P-5.x).

## Techniques
- **D-001 Versions (vérifiées sur npm le 2026-11-01)** : Node 22 LTS, pnpm 10.28, Turborepo 2.11, TypeScript ~6.0.3 (TS 7 écarté : typescript-eslint 8.72 limite `<6.1`, Expo 58 recommande ~6.0.3), Expo SDK 58 (React 19.3.0, RN 0.88.1, Reanimated 4.7, Gesture Handler 3.3, expo-router 58, expo-widgets 58), Next 16.4, NestJS 12.3, Prisma 7.10.1 (8.0 encore en RC — écarté), Zod 4, BullMQ 6, Vitest 5, Socket.IO 4.8.
- **D-002 Modules ESM** pour tous les packages (`NodeNext`), compilés vers `dist/`.
- **D-003 Prisma 7** : générateur `prisma-client` + adapter `@prisma/adapter-pg`, `prisma.config.ts`. SQL brut autorisé pour verrous/contraintes partielles.
- **D-004 Mobile pnpm** : Metro configuré pour le monorepo selon la doc Expo monorepos ; pas d'Expo Go pour les fonctions natives (development builds).
- **D-005 Exception « tout TypeScript »** : code Swift (extension WidgetKit via expo-widgets / config plugin) et Kotlin (widget Android) autorisés uniquement pour les widgets.
- **D-006 Stockage local** : MinIO en compose ; dans les environnements sans Docker (CI cloud de ce dépôt), adaptateur `FsObjectStorage` de test, interdit en production.
- **D-007 Design** : maquette de référence « V4 finale » importée dans `design/v4-reference` (pages + 81 assets). Les jetons (`packages/design-tokens`) en sont extraits ; la palette diffère légèrement des valeurs de départ du prompt (crème `#FFF7EC`, encre `#16110D`, citron `#C8F542`, violet `#7C3AED`) — la maquette fait foi, contrastes testés.
- **D-008 Prisma/IDs** : UUID v7 générés côté application.

## Arbitrages produit (P-5.x)
- P-5.1 Un pet principal par personne ; bébés = pets enfants non matchables, jamais supprimés.
- P-5.2 Gains unilatéraux possibles via k (plus lents) ; jalons à deux accords strictement mutuels.
- P-5.3 XP / niveau éligible / niveau atteint / droits actuels distincts ; matrice de capacités par transition (docs/engine-rules.md).
- P-5.4 Photos jamais avant N4 ; préférence globale « à partir de 4 avec mon accord » | « jamais » ; Ami = révélation claire N4 ; Plus = dérivés floutés N4, originaux N5 après double accord. L'option « niveau 3 » de l'annexe est supprimée.
- P-5.5 Preuves de mission privées par défaut ; selfie jamais réutilisé comme photo.
- P-5.6 Emménager N3 = exclusivité des rendez-vous dans les deux branches ; Ami N6 transférable au Quartier par accord mutuel.
- P-5.7 Intentions FRIENDS_ONE, FRIENDS_GROUP, OPEN_TO_MORE, LET_IT_HAPPEN ; pas de « Plus seulement » ; genre déclaré, jamais inféré.
- P-5.8 Votes secrets jamais exposés (stats, délais, WS, curseurs, notifications).
- P-5.9 Parrainage +100/+100 une fois après activation admissible (remplace +50 de l'annexe).
- P-5.10 « 3 pets veulent le rencontrer » seulement si 3 intérêts réels ; sinon « N rencontres à découvrir » avec N vrai.
- P-5.11 Prévisualisation premium avant paiement ; adoption après droit valide ; repli Gaston/Nino.
- P-5.12 Bonus week-end = XP pet seulement ; bénéfices mensuels au titulaire payant seulement.
- P-5.13 Expiration premium : relations au-delà de la capacité marquées LEGACY.
- P-5.14 Pause globale et par relation, ≤14 j/période, sans rattrapage punitif.
- P-5.15 Bloquer/signaler/supprimer ne pénalise jamais la fiabilité ; blocage prioritaire.
- P-5.16 Bande 3–5 ; Plus entre membres via le flux privé normal ; <3 = gains collectifs suspendus.
- P-5.17 Bébé par couches préfabriquées (corps d'un parent, détail de l'autre), repli variante d'un parent.
- P-5.18 Mots anonymes prédéfinis + anti-spam ; indices premium uniquement depuis données consenties.
- P-5.19 Couverture des parcours, pas du nombre « 39 écrans ».
- P-5.20 Prix/quotas/cibles = paramètres initiaux ; SLA modération 24 h / export 48 h = objectifs mesurés.

## Valeurs initialisées manquantes du brief (hypothèses, `packages/tuning`)
Voir `docs/engine-rules.md` (rédigé par l'agent B).
