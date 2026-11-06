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
- **D-009 Stockage S3 local** : `minio/minio` n'est plus publié sur Docker Hub (constaté le 2026-11-01 : « pull access denied »). Le compose utilise `cgr.dev/chainguard/minio` (même serveur, même API S3). En production, n'importe quel S3 privé ; l'adaptateur ne dépend que de l'API S3. L'émulateur Firebase passe en profil optionnel `firebase` (il exige Java).
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

## V5 — « Ton pet te trouve une bande » (2026-11-06)
Source : `docs/product/concept-v5.md` (validé par l'utilisateur) ; spécification : `docs/product/spec-v5.md` (§ entre parenthèses). L'historique ci-dessus est conservé ; les arbitrages contraires sont marqués « remplacé ».
- **D-010 Loi produit V5** : le concept V5 remplace les règles V4 contraires. Remplacés : P-5.2, P-5.3 (Lien XP, niveaux N1–N7), P-5.4 (photos à N4 → révélation par sortie/duo), P-5.6 (emménager supprimé), P-5.9 (parrainage en pièces), P-5.11 (espèces premium : les 4 sont gratuites), P-5.12 (XP×2 week-end), P-5.13 (LEGACY par capacité), P-5.16 (bande 3–5 → liens persistants), P-5.17 (bébé seulement en clin d'œil duo). Maintenus : P-5.1, P-5.5, P-5.8 (étendu aux votes d'après-sortie), P-5.10, P-5.14, P-5.15, P-5.18 (sans indices premium), P-5.19, P-5.20. P-5.7 remplacé par D-014.
- **D-011 Modules V5** : nouveaux modules backend `neighborhoods`, `outings`, `connections` (bande, duos), `safety` ; paiements dans `economy`. Un seul écrivain par table, échanges par outbox (§11).
- **D-012 Cycle hebdomadaire et états de sortie** : demande lundi 9 h → mardi 12 h, composition mardi 12 h, invitations 24 h, verrouillage J-1 18 h (lieu révélé), photos le jour J à 9 h, check-in −30/+90 min, votes 72 h. `PROPOSED → FORMING (≥ 4 confirmés) → CONFIRMED → CHECKIN_OPEN → DONE / CANCELLED` ; < 4 au verrouillage = annulée ; après verrouillage la sortie tient à 3. Toutes les valeurs dans `@blowy/tuning` (§2.5).
- **D-013 Composition déterministe** dans `@blowy/matching/groups` : réutilise `scoreVision` (G neutralisé, aucune distance), filtres réciproques nommés, glouton + réparation + échanges en entiers, priorité aux reportés de la semaine précédente ; le paiement n'entre jamais dans l'algorithme (§4).
- **D-014 Intentions V5** : `seeksFriends` / `seeksRomance` (cumulables, secrets), `meetGenders` (« qui je veux rencontrer »), `romanceGenders`. L'orientation n'est jamais stockée (donnée art. 9) ; `romanceGenders` exige un consentement explicite `SENSITIVE_PREFERENCES`. Jamais exposés, même au staff (§2.15).
- **D-015 Votes d'après** : FRIEND / PLUS / NO, résolution `min()` ; PLUS sans compatibilité romance réciproque → FRIEND ; révélation par paliers horaires fixes et à la clôture (jamais à l'instant du vote) ; modifiable jusqu'à la révélation de la paire ; bulletins purgés 7 j après clôture (§2.10).
- **D-016 Bande** = liens pairwise persistants (table `Friendship` réutilisée) + chat 1:1 ; on ne voit jamais la bande d'autrui ; chat de groupe de sortie fermé à la clôture des votes (§2.7, §2.11).
- **D-017 Duo** : voie Duo opt-in, ≤ 3 actifs, 48 h d'échange entre pets, déblocage visage + voix quand chacun a envoyé ≥ 2 messages, RDV confirmé avant J+7 sinon expiration ; les duos nés d'un vote PLUS n'ont pas ces horloges ; toute fin non mutuelle affiche le même message neutre aux deux (§2.12).
- **D-018 Paiement hors IAP** : place de sortie (Stripe PaymentIntent) et Blowy+ (Stripe Billing synchronisé dans RevenueCat, qui reste l'autorité des droits) car ils achètent un service consommé hors de l'app (App Store 3.1.5(a), Google Play biens/services physiques — à reconfirmer à la soumission). `LOCAL_DEMO` conservé hors production. Dépendance `@stripe/stripe-react-native` à ajouter par A (§6.2).
- **D-019 Remboursements automatiques** : annulation par Blowy, retrait système ou de sécurité, paiement arrivé trop tard → remboursement carte (ou recrédit si payé en crédit) ; annulation perso ≥ 24 h → crédit 90 j ; < 24 h et absence → rien. Un seul remboursement par place, idempotent (§6.4).
- **D-020 Fin des pièces et du pay-to-win** : ledger pièces gelé (lecture, corrections staff) ; boost, gels, XP×2, espèces premium, carte, indices, créneaux en plus retirés (410). Accessoires non achetables à l'unité : gagnés par souvenirs, parrainage, ou 1 par mois avec Blowy+ (§6.1, §6.2).
- **D-021 Pet V5** : `reduceV5` (`packages/pet-engine/src/v5`) sur souvenirs et accessoires, sans jauge ni perte ; moteur V4 déprécié, isolé dans `@blowy/pet-engine/v4` pour rejeu, plus appelé par l'API (§5).
- **D-022 Fiabilité V5** : « venu·e à N sorties sur M » (présences / présences + absences ; annulations tardives exclues) ; 2 absences sans prévenir sur 90 j → pause de 7 j ; blocage, signalement, retraits et annulations par Blowy sans effet ; contestation sous 7 j (§2.14).
- **D-023 Check-in** : position ponctuelle envoyée au tap, comparée au rayon du lieu (150 m) puis jetée, jamais stockée, jamais de distance renvoyée ; code à 4 chiffres affiché sur place en repli (§2.8).
- **D-024 Ange gardien par lien web** : jeton aléatoire haché, montré une fois, ≤ 3 par sujet, actif de −2 h à +3 h, page sans compte (prénom, heure, lieu après verrouillage, chronologie, alerte) ; jamais les autres participants ni de suivi continu ; aucun numéro du proche stocké ; Web Push optionnel ; alerte → dossier SAFETY (§2.9).
- **D-025 Blocage pendant une sortie** : la personne bloquée est retirée (remboursée, prioritaire, message neutre identique à toute recomposition) ; la personne qui bloque n'a rien à faire ; signal staff au-delà de 3 retraits déclenchés en 30 j (§2.6).
- **D-026 Photo obligatoire pour l'IRL** : une photo de profil modérée est requise avant la 1re sortie ou le 1er duo (le selfie de vérification n'est jamais réutilisé, P-5.5) ; ACL de révélation par sortie, duo et bande (§7.5).
- **D-027 Schéma V5 additif** : deux migrations (enums, puis tables/colonnes/contraintes) ; tables V4 conservées et listées « mortes » ; aucune migration appliquée réécrite (§8).
- **D-028 Notifications V5** : catalogue §9, 3/jour (4 le jour d'une sortie, sécurité illimitée), heures calmes 23 h–8 h, aucune notification révélant un vote ; mode discret (icône alternative, textes neutres sans prénom, pet ni lieu).
- **D-029 Rôle staff `ops`** pour quartiers, lieux, sorties, présences ; aucune permission ne lit un vote ou une préférence (§10).
- **D-030 Lancement par quartier** : seuil de densité par défaut 120 personnes vérifiées en attente (surcharge admin, lancement forcé sous step-up) ; inviter fait progresser le quartier, pas la position individuelle ; non placé·e = prioritaire la semaine suivante (§2.1, §2.2).
- **D-031 Parrainage V5** : plus de pièces ; un accessoire unique quand le filleul vit sa 1re sortie.
- **D-032 « +1 »** : un ami invité est composé avec toi comme une unité atomique ; pas de vote entre vous ; lien de bande `PLUS_ONE` si vous venez tous les deux (§4.5).
- **D-033 Œuf/bébé** : tranche optionnelle T9, réservée à un duo `TOGETHER` avec ≥ 2 RDV vécus ensemble, accord des deux, sans exclusivité.
- **D-034 Code d'erreur `GONE` (410)** pour les routes V4 retirées ; demande à A (`api-contract/src/core/errors.ts`), avec les nouvelles salles WS `outing:` et `duo:` (§7.6, §7.7).
