# Matrice de couverture des exigences

Statuts : `—` non commencé · `codé` · `testé local` · `testé fournisseur` · `clé/config requise` · `appareil/signature requis`.
Chaque ligne est mise à jour par l'orchestrateur après vérification d'intégration (pas sur la seule foi d'un rapport).

| # | Exigence (source) | Propriétaire | Écrans | Endpoints / jobs | Fichiers | Tests | Statut |
|---|---|---|---|---|---|---|---|
| R01 | Monorepo, versions, CI (§2, §4, §20) | A | — | — | racine, .github | build+tests tokens | testé local |
| R02 | Jetons design depuis maquette V4 (§14) | A | toutes | — | packages/design-tokens | contrast.test.ts | testé local |
| R03 | Moteur pur jauges/ticks/rattrapage/DST (§6) | B | Nid | worker tick | packages/pet-engine | §21-5 | — |
| R04 | Refus d'appel, lieu unique (§6) | B, C | Nid | /pets/:id/actions | pet-engine, api/pets | §21-4 | — |
| R05 | XP Lien, k, affinité, caps, mission commune (§6) | B | Nid, Lien | — | pet-engine | §21-6 | — |
| R06 | Matrice de capacités / portes (§5.3) | B, C | Lien | /relationships | pet-engine, api/relationships | §21-7 | — |
| R07 | Simulateur 60 j (§6) | B | — | simulate:balance | pet-engine/simulate | run | — |
| R08 | Score vision + filtres + lot (§7) | B, C | Match | job 21 h, /matches | matching, api/matching | §21-3 | — |
| R09 | Propositions 48 h, double acceptation transactionnelle (§7) | C | Match | /match-proposals/:id/accept | api/matching | §21-3 | — |
| R10 | Emménagement exclusif (§5.6, §7) | C | Emmenager | /relationships/:id/move-in | api/relationships | §21-3 | — |
| R11 | Votes secrets de branche (§5.8) | C | Vote | /relationships/:id/branch | api/relationships | §21-7 | — |
| R12 | Photos / révélation simultanée / flou serveur (§5.4, §10) | E, C | Revelation | /media, /reveal | api/media | §21-8 | — |
| R13 | Fiabilité, ghosting, silence 14 j (§7) | C | Profil | job horaire | api/trust | §21-12 | — |
| R14 | Pause globale/relation (§5.14) | C | Reglages | /pause | api/users | — | — |
| R15 | Auth Apple/Google Firebase + 18+ (§10) | C, D | Compte | /auth | api/auth | — | — |
| R16 | Vérification identité Veriff + états (§10) | E | Verif | /verifications, webhook | api/trust | — | — |
| R17 | Chat + modération machine d'états (§9.1) | C, E | Chat | /messages | api/conversations, packages/ai | §21-9,10 | — |
| R18 | Voix N3 + transcription (§9.2) | E | Chat | /media | packages/ai | — | — |
| R19 | Missions + vision preuve (§9.3) | E, G | Mission, Preuve, Bravo | /missions | api/missions | §21-6,11 | — |
| R20 | Suggestions de messages (§9.4) | E | Chat | /suggestions | packages/ai | §21-10 | — |
| R21 | Signaux conversationnels → réactions (§9.5) | E, B | Nid | worker | packages/ai | — | — |
| R22 | Consentement IA + évals (§9.6) | E | Confidentialite | /consents | packages/ai/evals | — | — |
| R23 | Carte approximative (§11) | G | Carte | /map | api/social | §21-17 | — |
| R24 | Rendez-vous réel + ange gardien + check-in (§11) | G | RdvIRL | /safety-dates, /guardian-invitations | api/trust | §21-17 | — |
| R25 | Œuf, couvaison, naissance, hérédité (§8) | B, G | Oeuf, Bebe | /eggs, /incubation | api/social | §21-14 | — |
| R26 | Garde alternée + transitions blocage (§8, §19) | G | Garde | job lundi | api/social | §21-14 | — |
| R27 | Quartier, ami, nourrir (§8) | G | Quartier, Ami | /friends | api/social | — | — |
| R28 | Bandes 3–5 (§5.16, §8) | G | Bande | /groups | api/social | §21-13 | — |
| R29 | Ligues hebdo (§8) | G | Classement | job dimanche | api/social | — | — |
| R30 | Économie ledger, catalogue, gels (§16) | G | Boutique, Serie | /wallet, /catalog | api/economy | §21-3,15 | — |
| R31 | RevenueCat abonnements + droits dérivés (§16) | G | Paywall, Abonnement | /purchases, webhook | api/economy | §21-15 | — |
| R32 | Notifications plafonds/plages/priorités (§17) | G | Notifs | worker | api/notifications | §21-18 | — |
| R33 | Widgets iOS/Android (§14) | D | Widget | — | apps/mobile/widgets | — | — |
| R34 | Onboarding complet (§14) | D | Welcome→Notifs | — | apps/mobile/app/(onboarding) | maestro | — |
| R35 | Nid, scène, PetRenderer (§14) | D | Nid, Fiche | — | ui-mobile | — | — |
| R36 | Hors ligne, file d'actions (§13) | D | toutes | — | apps/mobile/src/offline | §21-21 | — |
| R37 | Web public 3 mots + invitation + légal (§15) | F | W-Repondre | /anonymous-responses | apps/web | §21-16,22 | — |
| R38 | Parrainage (§5.9, §15) | G, F | Invite | /referrals | api/social | §21-16 | — |
| R39 | Admin complet (§18) | F | — | /admin/* | apps/admin | §21-19 | — |
| R40 | Export / suppression (§19) | C, F | Supprimer | /exports, /deletion-requests | api/users | §21-20 | — |
| R41 | Blocage atomique + projection bébé indépendante (§19) | C, G | Signaler | /blocks | api/trust | §21-14 | — |
| R42 | Observabilité, logs expurgés (§4) | C | — | — | packages/observability | — | — |
| R43 | Config versionnée tuning/content + rollback (§12) | C, F | admin Tuning | /admin/config | api/admin | §21-21 | — |
| R44 | Dockerfiles, runbooks, sauvegardes (§20) | A | — | — | infra/ | — | — |
