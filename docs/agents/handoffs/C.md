# Handoff — agent C (backend/données) — 2026-11-01

## Résumé
Schéma Prisma complet §12 + 2 migrations, seed déterministe §20, socle NestJS en clean architecture (shared/ une fois), modules auth, users/me, pets, matching, relationships, conversations, WS Socket.IO, worker outbox + jobs BullMQ, api-client typé. Module economy (agent G) branché. **Moteur : adapter provisoire** derrière `EngineGateway` (B n'a pas encore publié l'index de `@blowy/pet-engine` / `@blowy/matching`, `index.ts` = `export {}`).

## Fichiers (propriété C)
- `packages/database/` : `prisma/schema.prisma`, `prisma/migrations/20261031233029_init`, `prisma/migrations/20261031233100_constraints` (CHECK, index partiels, triggers append-only), `prisma.config.ts`, `src/{client,tx,uuid,reset,index}.ts`, `src/seed/{index,ids}.ts`, `tsconfig.seed.json`.
- `apps/api/src/` : `main.ts`, `worker.ts`, `bootstrap.ts`, `app.module.ts`, `config/env.ts`, `shared/**`, `realtime/**`, `jobs/**`, `modules/{auth,users,pets,matching,relationships,conversations,health}/**`, `modules/feature-modules.ts` ; `apps/api/test/{unit,integration}/**`, `vitest.config.ts`, `tsconfig*.json`, `.env.example`.
- `packages/api-client/` (nouveau) : `src/{http,client,realtime,index}.ts`, test.
- `packages/api-contract/src/{auth,me,consents,pets,matching,relationships,conversations}.ts` + lignes d'export dans `index.ts`.
- `docs/api/{architecture,commands}.md`, ce fichier.
- Dépendance ajoutée : `@types/express@^5` (dev, apps/api) via flock.

## Migrations
1. `20261031233029_init` — toutes les tables §12 (compte, pets, relations, matching, messages, médias/IA, missions, social, économie (spéc. G), progression, famille, confiance, exploitation) + `CommandRecord`, `DomainEvent`, `ProjectionEntry/Cursor`, `ProviderWebhookEvent`, `Zone`, `StaffRoleAssignment`, `RelationshipDailyCounter`, `MissionRewardContext`.
2. `20261031233100_constraints` — CHECK paire canonique (PetPair, MatchProposal, Friendship), un OPEN par paire, un contexte vivant par (paire,type), **exclusivité unique partielle** `RelationshipSide(userId) WHERE exclusive AND active`, bornes jauges/axes/niveaux/fiabilité, pause ≤14 j, partage gardien ≤3 h, pas d'auto-parrainage/auto-blocage, économie (solde ≥0, amount≠0, prix>0, droit dérivé cohérent, unique partiel EntitlementGrant actif, StreakFreeze jour protégé), triggers append-only (LedgerEntry, RelationshipEvent, DomainEvent, ModerationDecision, AuditLog).
Uniques notables : `Pet.primaryOwnerId` (un pet principal), `Egg.childPetId` (une naissance), `MissionAward.rewardKey`, `CommandRecord(actorId,operation,commandId)`, `ProviderWebhookEvent(provider,providerEventId)`, `Message(authorUserId,clientMessageId)`, `ReliabilityEvent(userId,reason,episodeKey)`, `MatchBatch(zone,localDate,kind)`. Votes (`BranchBallot`), réponses d'œuf, corps de messages (`MessageContent`), positions de sécurité : tables séparées.

## Endpoints /v1
Public : `GET healthz`, `GET readyz`, `POST auth/sessions`.
Auth : `GET auth/sessions`, `DELETE auth/sessions/current`, `DELETE auth/sessions/:id`.
Me : `GET me`, `PATCH me`, `PUT preferences/matching`, `PUT preferences/privacy`, `GET|POST consents`, `POST pauses`, `DELETE pauses/:id`, `POST verifications`, `POST me/onboarding/complete`.
Pets : `POST pets`, `GET pets/mine`, `GET pets/:id`, `POST pets/:id/actions`, `POST pets/:id/move`.
Matching : `GET matches`, `POST matches/onboarding-batch`, `POST match-proposals/:id/accept`.
Relations : `GET relationships`, `GET relationships/:id`, `POST relationships/:id/{leave,pause,move-in,consents/respond,branch/ballot,branch/downgrade}`.
Conversations : `GET conversations`, `GET|POST conversations/:id/messages`, `POST conversations/:id/read`, `POST messages/:id/reveal`.
WS : Socket.IO `path=/v1/ws`, `auth: {token}` ; événements client `heartbeat`, `join {room}`, `leave`, `resync {room, sinceCursor}` (ack) ; serveur `authenticated`, `sync`, `access.revoked`. Rooms `user:<id>`, `conversation:<id>`, `relationship:<id>`.
Economy (G) monté : voir `apps/api/src/modules/economy`.
Détail commande par commande : `docs/api/commands.md`.

## Connexion locale (app mobile)
`POST /v1/auth/sessions {"provider":"local","credential":"alex"}` → `accessToken` (Bearer, stocker en SecureStore). Comptes seed : `alex, l, m, s, ines, tom, maya, test.a, test.b (non vérifié), test.c, test.d, solo (zone vide), staff.<role>`. Clé inconnue = nouveau compte (onboarding). Toutes commandes : en-tête `Idempotency-Key: <uuid>` (le client `@blowy/api-client` le génère ; réutiliser `commandId` pour un renvoi hors ligne). Depuis un appareil : `EXPO_PUBLIC_API_URL=http://<ip-du-mac>:3000`.

## Tests exécutés (résultats réels)
- `pnpm --filter @blowy/api test` → 5 fichiers, **42 tests OK** (unit : domaine, config prod, architecture en couches, + tests unitaires economy de G).
- `cd apps/api && npx vitest run --project integration` → **9 fichiers, 33 tests OK** sur Postgres `blowy_test` réel (journey n°1, idempotence n°2, concurrence n°3, votes n°7, modération n°9, ghosting n°12, IDOR, sessions, 18+, premium, WS ; + intégration economy de G).
- `pnpm --filter @blowy/api-client test` → 3 OK. Typecheck/build : database, api-contract, api-client, api ✔. ESLint sur mes dossiers : 0 erreur.
- `pnpm db:migrate`, `pnpm db:seed` ✔ depuis la racine ; `pnpm --filter @blowy/api dev` répond `/v1/healthz` `{"status":"ok"}`, `/v1/readyz` postgres+redis ok ; `node dist/main.js` et `node dist/worker.js` démarrent ; parcours curl seedé alex→l : message pending → publié par le worker → visible chez L.

## Correctifs demandés par l'orchestrateur (avant merge V1)
1. **Tests instables (« profile 400 zoneCode »)** : cause = exécutions concurrentes de la suite (plusieurs agents) sur la même base `blowy_test` ; le `TRUNCATE` de l'une supprimait la zone de l'autre. Correctif : `test/integration/global-setup.ts` prend un **verrou consultatif PostgreSQL** (`pg_advisory_lock`) pendant toute la suite (les exécutions sont sérialisées) ; `reset()` fait un `upsert` de la zone. Vérifié : base `blowy_test` supprimée puis recréée, **2 passages consécutifs, 33/33** chacun.
2. **Webhooks** : `/v1/webhooks/*` exclus du limiteur par IP (l'authentification par en-tête reste obligatoire côté G).
3. **Seed économie** : plus d'abonnement ni de droit ni de pièces fabriqués en base (le fournisseur LOCAL_DEMO de G fait autorité). Démo : `POST /v1/purchases/local-demo {"action":"SUBSCRIBE","productId":"blowy_plus_monthly"}` puis `{"action":"BUY_COINS","productId":"coins_500"}`. Reste seulement une StoreTransaction LOCAL_DEMO `RECORDED` étiquetée (historique). Aucun nouveau LedgerReason nécessaire.
4. **Clone propre** : `pnpm install` (le postinstall génère le client Prisma) → `pnpm db:migrate` → `pnpm db:seed` → `pnpm --filter @blowy/api dev` vérifiés dans une copie sans node_modules/dist/generated et sur une base vierge (`/v1/healthz` ok, `/v1/readyz` postgres+redis ok, sign-in local ok). Le seed et `predev` construisent d'abord domain/tuning/api-contract/database (turbo). **Attention : `pnpm dev` à la racine échoue** (`turbo run dev --filter=@blowy/admin --filter=@blowy/web` : ces packages n'existent pas encore) — à l'orchestrateur (racine) : retirer ces filtres ou créer les apps. `pnpm --filter @blowy/api dev` fonctionne. Le build de `@blowy/pet-engine` (B) échoue actuellement (TS4023, `rollDaily`), d'où le pré-build limité aux paquets réellement importés par l'API.

## Décisions
- Jeton de session opaque `<sessionId>.<secret>` (empreinte HMAC en base), séparé du token Firebase ; révocable par appareil.
- Modules métier `@Global` exportant des jetons de ports (évite les cycles Nest), aucun accès direct à l'infra d'un autre module.
- Modération hors transaction (`OutboxEffect`), application sous verrou avec revalidation : résultat tardif après départ → HUMAN_REVIEW, jamais publié.
- Version de vue `viewVersion` = tête de projection du lecteur (n'avance pas sur un vote d'autrui).
- Pause : quota 14 j par **trimestre UTC** (hypothèse, à confirmer produit).
- Échéance de vote et TTL d'offre 72 h (hypothèses C, à verser au tuning par B).
- `loadConfig` : défauts locaux (DATABASE_URL, SESSION_SECRET) uniquement en local/test pour qu'un clone neuf démarre sans `.env`.

## Limites / restant
- **Moteur** : `ProvisionalEngineGateway` (formules §6/§7 minimales paramétrées par `@blowy/tuning`) — à remplacer par `PetEngineGateway` délégant à `@blowy/pet-engine` (`advanceTime`, `reduce`, `resolveCall`, `poseFor`, gains) et `@blowy/matching` (score) dès que B exporte son index. Seul fichier à changer : `shared/infrastructure/engine/engine.factory.ts` (+ nouvel adapter).
- Non implémentés ici (autres agents / vagues) : médias, missions (tables prêtes), social, œuf/garde (tables prêtes), notifications, admin, Veriff/OpenAI réels.
- `@blowy/content` vide : le seed n'utilise pas encore de référentiels de contenu (clés `spot.*`, `system.*` à traduire dans `fr.json`).
- Avertissement pg « client.query() when the client is already executing » émis par Prisma adapter-pg en transaction : bénin, à suivre lors de la montée pg 9.
- Pas de test e2e Redis pub/sub WS multi-processus (le relais est testé via `handleRt` en processus).

## Demandes aux autres propriétaires
- **B** : exporter depuis `@blowy/pet-engine` l'API listée dans work-plan (et la forme d'état sérialisable) ; ajouter au tuning `relationship.branchVoteDeadlineHours`, `consent.offerTtlHours`, `relationship.moveInMinLevel` ; `@blowy/matching.visionScore(a,b,ctx)`.
- **A (domain/core)** : `MessageStatus` du domain sans `WITHDRAWN` (ajouté côté contrat/DB pour le retrait) — l'ajouter à `MESSAGE_STATUSES` ; `LedgerReason` : ajouter `BOOST_NOT_CONSUMED_REFUND` (demande G).
- **E** : brancher `ModerationGateway` (OpenAI) et `VerificationGateway` (Veriff) via les jetons `MODERATION_GATEWAY` / `VERIFICATION_GATEWAY`.
- **D** : consommer `@blowy/api-client` (`BlowyClient`, `RealtimeSync`).
