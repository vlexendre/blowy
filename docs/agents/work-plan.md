# Plan de travail multi-agents

Environnement d'exécution réel (vérifié 2026-11-01) : hôte Linux cloud, 2 vCPU, 8 Go RAM, Node 22.23, pnpm 10.28, PostgreSQL 16 et Redis 7 natifs (démarrés), **pas de démon Docker**, **pas de Xcode/Android SDK**, Java présent. Conséquence : builds natifs iOS/Android et tests appareil impossibles ici → code + config livrés, statut « nécessite appareil/signature ».

Sous-agents : outil natif `Agent` (agents distincts, contexte propre). Concurrence de référence : 1 orchestrateur + 3 spécialistes. Pas de worktrees (un seul `node_modules` pnpm, RAM limitée) → **ownership strict par répertoire**.

## Règle d'installation de dépendances
Toujours sérialiser : `flock /home/claude/blowy/.local/pnpm.lock pnpm --filter <ton-package> add <dep>` (créer `.local/` si absent). Jamais de `pnpm install` global, jamais de modification des versions communes (react, expo, nest, prisma, zod, typescript) — demander à l'orchestrateur.

## Vagues
| Vague | Agent | Lot | Répertoires possédés |
|---|---|---|---|
| V0 | A orchestrateur | socle | racine, domain, api-contract/core, design-tokens, docs (sauf handoffs d'autrui) |
| V1 | B domaine/jeu | tuning, pet-engine, matching, simulateur, content (référentiels) | packages/{tuning,pet-engine,matching,content}, docs/engine-rules.md |
| V1 | C backend/données | schéma Prisma complet, migrations, seed, socle Nest (config, auth Firebase+émulateur+dev local, users/me, pets, matching runner, relations+commandes, conversations+messages pipeline, outbox+worker, WS) | packages/database, apps/api, packages/api-contract/src/{auth,me,pets,matching,relationships,conversations}.ts, packages/api-client |
| V1 | D mobile | app Expo Router, navigation 5 onglets, design system natif à partir de design/v4-reference, PetRenderer + manifest sprites, onboarding complet, Nid, Chats (sur contrats C) | apps/mobile, packages/{ui-mobile,sprites} |
| V2 | E IA/confiance | packages/ai (OpenAI réel + local), modération, vision mission, suggestions, signaux, transcription, médias (upload/ACL/dérivés), vérification Veriff, blocages/signalements | packages/ai, apps/api/src/modules/{media,trust}, api-contract/{media,trust}.ts |
| V2 | F admin/web | apps/admin (Next, MFA, rôles, toutes sections), apps/web (réponse 3 mots, invitation, légal), ui-web | apps/{admin,web}, packages/ui-web, api/src/modules/admin |
| V2 | A | intégration mobile↔API, relations avancées (emménager, votes, révélation) |
| V3 | G économie/social | economy (ledger, RevenueCat, abonnements, droits), notifications, missions, social (quartier, bandes, ligues, parrainage), œuf/bébé/garde, widgets | modules {economy,notifications,missions,social}, api-contract correspondants |
| V3 | H QA | audit indépendant IDOR, concurrence, contrats, scénarios §21 | tests/** + rapports |
| V4 | A + propriétaires | correctifs, intégration finale, matrice | |

## Contrats inter-agents (V1)
- B publie `@blowy/tuning` (schéma Zod + `DEFAULT_TUNING` versionné) et `@blowy/pet-engine` (`reduce`, `advanceTime`, `computeLinkGain`, `resolveCall`, `poseFor`) **avant** que C n'intègre le moteur ; C consomme via imports, jamais en recopiant les règles.
- C publie les DTO dans `packages/api-contract/src/*.ts` dès que l'endpoint existe ; D consomme `@blowy/api-client`. En attendant, D code contre les schémas déjà publiés ; aucune forme inventée.
- Schéma Prisma : propriétaire unique C. Besoins des autres → section « Demandes schéma » de leur handoff.
