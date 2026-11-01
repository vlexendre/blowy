# Architecture backend (apps/api) — clean architecture modulaire

## Couches par module `src/modules/<m>/`
| Couche | Contenu | Peut importer |
|---|---|---|
| `domain/` | règles pures (âge, pause, machine d'états de modération, vote, capacités, éligibilité matching) | `@blowy/domain`, autres `domain/` |
| `application/` | un fichier par commande/requête (`*.use-case.ts`, `*.query.ts`), ports `*.repository.ts` / `*.gateway.ts`, sérialiseurs | domain, `shared/application`, `@blowy/api-contract` |
| `infrastructure/` | adapters Prisma (implémentent les ports), adapters externes (Firebase, modération locale…) | tout ce qui précède + `@blowy/database` |
| `interface/` | controllers REST, mappers DTO ↔ contrat (Zod) | application |
| `<m>.module.ts` | composition root : lie jetons de ports → adapters (Strategy selon config) | tout |

Vérifié par `test/unit/architecture.test.ts` (aucun import Nest/Prisma/infra depuis `domain/` ou `application/`).

## Briques transverses `src/shared/` (écrites une seule fois)
- `application/command-bus.ts` — **Command** : idempotence (actorId, operation, commandId) via `CommandRecord`, IDEMPOTENCY_CONFLICT si payload différent, transaction (UnitOfWork), résultat mémorisé.
- `application/unit-of-work.ts` + `infrastructure/prisma/prisma-unit-of-work.ts` — **Unit of Work** : `TxScope { now, lock, outbox }`, verrous ordonnés `users → pets → relationships → wallets` (`OrderedLocker`, `SELECT … FOR UPDATE`, ordre violé = erreur), retry deadlock/sérialisation borné (`@blowy/database` `runInTransaction`).
- `application/outbox-consumer.ts` + `infrastructure/outbox/outbox-dispatcher.ts` — **Outbox/Observer** : `OutboxConsumer` (effet transactionnel, dédupliqué par `ConsumerDeduplication`) et `OutboxEffect` (effet externe hors transaction : modération, relais WS).
- `application/event-publisher.ts` + `projection.ts` — projection **par destinataire** (`ProjectionEntry`, séquence propre au lecteur, curseur opaque `p1:<seq>` base64url) : un événement privé omis ne crée jamais de trou.
- `application/clock.ts` — `Clock` / `RandomSource` injectables (aucun `Date.now` dans les use cases ; tests avec `FixedClock`).
- `application/ports/*` — ports interdomaines : `EngineGateway` (moteur pur B), `EntitlementsReader` (fourni par economy/G), `RelationshipReader`, `ParticipationReader`, `BlockReader`, `PetProfileReader`, `RelationshipCreator`, `LinkProgressPort`, `SharedActionPort`, `SessionResolver`, `RealtimePublisher`.
- `interface/` — `AuthGuard` global (+ `@Public()`), `ZodPipe`, `@CurrentUser()`, `@CommandId()` (en-tête `Idempotency-Key`), `ApiErrorFilter` (`{code,message,detailsSafe,requestId,retryable}`), requestId, rate limiting (Strategy Redis/mémoire).
- `core.module.ts` — module global : config, logger pino expurgé, DB, Clock, UoW, CommandBus, projections, moteur.

## Ports & Adapters / Strategy par environnement
| Port | Local/test | Production |
|---|---|---|
| IdentityProvider (auth) | `LocalAuthProvider` (clé déterministe) ; Firebase émulateur optionnel | `FirebaseAuthProvider` (verifyIdToken + checkRevoked) |
| ModerationGateway | `LocalModerationGateway` (marqueurs synthétiques) | adapter OpenAI (agent E) ; absent → `Unavailable` (PROCESSING_FAILED, jamais publié) |
| VerificationGateway | `LocalDemoVerificationGateway` (badge LOCAL_DEMO) | Veriff (agent E) ; absent → NOT_CONFIGURED |
| EntitlementsReader | economy (G) `local_demo` | economy (G) RevenueCat |
| EngineGateway | `ProvisionalEngineGateway` (tuning) → `PetEngineGateway` dès que B publie | idem |
`loadConfig` refuse au démarrage en production : DEV_AUTH_BYPASS, AUTH_PROVIDER=local, émulateur, modération/vérification locales.

## Entrypoints
- `src/main.ts` : HTTP `/v1` + Socket.IO (`path /v1/ws`), relais WS reçu via Redis pub/sub `blowy:rt`.
- `src/worker.ts` : relais outbox (`FOR UPDATE SKIP LOCKED`, rejouable), jobs BullMQ (`upsertJobScheduler`) avec clé métier `JobExecution.jobKey`.
- `src/jobs/worker-runtime.ts` : graphe worker partagé (worker.ts et tests).

## Transactions inter-modules
Les modules métier sont `@Global` et n'exportent que des jetons de ports ; un module consomme un port, jamais une classe d'infrastructure d'un autre module. Un module écrit ses propres tables ; exceptions documentées : `PrismaPetPlacement` (relations → `VirtualLocation` lors d'emménagement/fin, dans la même transaction, sous verrou pets).
