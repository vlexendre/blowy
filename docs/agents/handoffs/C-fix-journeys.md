# Handoff — C-fix-journeys (correctifs backend des parcours multi-utilisateurs) — 2026-11-06

Source : `docs/qa/journeys-report.md` (bugs B1…B12) et `docs/agents/handoffs/H-parcours.md`. Seuls les bugs qui **survivent à la V5** (`docs/product/concept-v5.md`) sont corrigés, chacun avec un test de non-régression.

## Résultat

| Suite | Avant | Après |
|---|---|---|
| `pnpm --filter @blowy/api test:journeys` | 73 ✅ / 11 ❌ / 9 ⛔ (~65 s) | **82 ✅ / 2 ❌ / 9 ⛔** (~50 s), identique sur 2 passages |
| `test:integration` | 59 tests | **68/68** sur 2 passages (13 fichiers) |
| `test` (unit) | 58 | **59/59** |

Les 2 ❌ restants sont V4 (Triangle 04 = B3, Triangle 10 = B10) : volontairement non corrigés.

## Bugs corrigés

| # | Cause racine | Correctif | Test |
|---|---|---|---|
| **B1** dépenses simultanées → 500 après ~20 s | `OrderedLocker` prenait `SELECT … FOR UPDATE` sur `User`. Or l'INSERT de `CommandRecord` (FK `actorId → User`), fait par le CommandBus **avant** le verrou, pose un `FOR KEY SHARE` sur cette ligne. Deux commandes du même utilisateur s'interbloquaient donc à chaque fois (`40P01` détecté après `deadlock_timeout`, puis 4 retries et 500). | `packages/database/src/tx.ts` : verrous en `FOR NO KEY UPDATE` (toujours exclusifs entre commandes, compatibles avec KEY SHARE). `SET LOCAL lock_timeout = 4 s`, `maxWait` 5 s, `isContentionError()` exporté. `PrismaUnitOfWork.run` convertit toute contention persistante (55P03, P2024/P2028, deadlock après retries) en `409 CONFLICT {reason: CONTENTION}` réessayable. Verrou `CatalogItem` aussi en NO KEY UPDATE. | `journey-fixes` « B1 » : 7 achats parallèles, exactement 4 réussis, refus `INSUFFICIENT_FUNDS` (409), solde exact, < 8 s. **Vérifié en mutation** : avec `FOR UPDATE`, le test échoue (2/4, 18 s). |
| **B1bis** session révoquée, socket vivante | Aucun ordre de coupure à la révocation d'un appareil, et la gateway ne connaissait que `userId`. | `RevokeSessionUseCase` émet `realtime.disconnect {sessionIds}`. Le relais transmet `sessions` et la gateway ne ferme que les sockets de ces sessions (`socket.data.sessionId`). Expiration : minuterie à `expiresAt`, réarmée au-delà de 24,8 j. Contrôle de l'échéance (horloge injectée) à chaque `join`/`resync`, et revalidation en base au plus toutes les 30 s (relais perdu). Session invalide → `access.revoked` + disconnect, rien n'est livré. `AuthenticatedUser.expiresAt` est ajouté (optionnel). | 3 tests : révocation (iPad fermé, iPhone vivant, reconnexion refusée), révocation sans outbox puis +31 s (coupée au resync), expiration +400 j. |
| **B2** aucun slug public | Aucune écriture de `Profile.publicSlug` hors seed. | `PUT /v1/me/public-page {enabled:true}` attribue, à la première activation, `<prénom-normalisé>-<6 car. base36 aléatoires>` (unique, 5 essais, sous verrou User). `GET /v1/me/public-page` (lecture seule). Réponse `{slug, enabled, url}`, avec `url = SOCIAL publicWebOrigin/<slug>`. | « B2/B9 » : slug `elodie-marie-xxxxxx`, aucun id interne, réactivation = même slug. |
| **B9** page désactivée servie (200) | `publicProfile` ne testait pas `enabled`. | Page désactivée → même 404 neutre que slug inconnu. | idem (404 sans prénom). |
| **B4** signaler un profil proposé → 404 | `targetFromPet` n'acceptait que les pets d'une relation partagée. | `targetFromPet` couvre maintenant toute personne **vue** : relation (même terminée), proposition de matching faite à l'acteur (tout statut), conversation commune (prépare le chat de groupe V5). Un pet jamais vu → 404 (anti-IDOR). Bloquer fonctionne aussi depuis une proposition (même résolveur). **Restriction conservatoire** : `pool()` du matching exclut toute personne visée par un dossier `REPORT_MINOR` restreint non `RESOLVED`. | « B4 » : 201, dossier restreint priorité ≤ 1, retiré du lot d'un tiers, blocage OK, inconnu → 404, rien chez Paul. |
| **B5** pas d'événement au match | `match.created` n'existait qu'en outbox ; `relationship.updated {created}` partait dans une room inconnue des deux. | `EventPublisher` accepte `room` comme fonction par destinataire (`userRoom`). `RelationshipLifecycle.created()` projette `match.created {relationshipId, conversationId}` dans `user:<id>` des deux (remplace `relationship.updated {change: relationship.created}`). | « B5/B6 » (les deux reçoivent `match.created` dans `user:`). |
| **B6** `relationship.ended` perdu | Entrée projetée dans `relationship:<id>`, puis la room est révoquée dans la même vague (ordre deliver/revoke aléatoire : uuidv7 de même milliseconde). | `relationship.ended` est projeté dans `user:<id>` (room jamais révoquée). Le curseur de projection garantit la livraison même après révocation, quel que soit l'ordre du relais. Le payload `{relationshipId, conversationId}` ne contient pas de motif. | idem : `relationship:` révoquée, puis resync `user:` qui contient `relationship.ended`, sans `reason`. |
| **B7** local-demo, conflit de payload exécuté | Le use case n'utilisait pas le CommandBus. | `LocalDemoPurchaseUseCase` réserve la commande (`economy.local_demo_purchase`) dans le bus sous verrou User. L'action démo (état mémoire, sans réseau) ne s'applique qu'une fois par clé. Même clé avec un autre payload → `409 IDEMPOTENCY_CONFLICT`, sans rien exécuter. | « B7 » : double tap → crédité une fois ; SUBSCRIBE avec la même clé → 409, aucun abonnement. |
| **B8** `clientMessageId` + autre texte → 200 | La déduplication ne comparait que la conversation. | Comparaison conversation + texte (ou média pour la voix) : sinon `409 IDEMPOTENCY_CONFLICT {detailsSafe.reason: CLIENT_MESSAGE_ID_REUSED}`, sans réécriture ni doublon. Verrou User de l'auteur avant la déduplication : deux envois simultanés du même id (deux appareils) donnent un seul message, sans erreur d'unicité. | « B8 » (envoi parallèle, puis conflit, 1 seule ligne en base). |
| **B11** horloge contournée | 29 lectures de l'heure système. | Toutes remplacées (liste ci-dessous). Seul `SystemClock` lit l'heure système. | `test/unit/clock-usage.test.ts` (scan de `src/`). |

### B11 : occurrences remplacées (29)
- `matching/application/accept-proposal.use-case.ts:30` → `this.clock.now()` (Clock injecté ; c'est la cause du « Blowy+ ignoré » des parcours)
- `media/application/media.use-cases.ts:67,407` → Clock injecté (`CreateUploadUseCase`, `ShareMediaUseCase`)
- `trust/interface/trust.controller.ts:79,98` → `@Inject(CLOCK)`
- `trust/infrastructure/prisma-trust.repository.ts` ×7 (`PrismaAiInvalidation`) → `scope.now` si transactionnel, sinon Clock injecté
- `media/infrastructure/prisma-media.repository.ts:40,61` → Clock injecté
- `admin/infrastructure/prisma-admin.repositories.ts:54` (`recordNow`) → Clock injecté (`PrismaAuditLog(db, clock)`, CLI comprise)
- `admin/infrastructure/prisma-read-models.ts:215,222` → `performance.now()` (mesure de durée, pas une date)
- `admin/admin.module.ts:81,136` → `process.uptime()`
- `admin/interface/cli/staff-totp-dev.cli.ts:30` → `new SystemClock().now()`
- `economy/infrastructure/revenuecat/revenuecat-billing.provider.ts:109` → paramètre `now` obligatoire (plus de défaut système)
- `shared/interface/rate-limit.ts:19,33` → Clock injecté (`MemoryRateLimiter`/`RedisRateLimiter`, bootstrap et quotas sociaux)
- `realtime/realtime.gateway.ts:117` (heartbeat) → Clock injecté (obligatoire dans les deps, fourni par `attachRealtime`)
- `worker.ts:40,52` → `CLOCK` du contexte Nest ; `jobs/scheduler.ts:35,38` → `runOnce(db, job, clock)`

Les jobs économie et social exposent toujours `run()` sans `now` : leurs use cases lisent le **même** Clock injecté (`composeEconomy(clock)`, `ReferralUseCases(clock)`), donc aucune heure système. Passer `now` explicitement reste possible plus tard sans urgence.

## Non corrigés (propres à la V4, vont disparaître)
- **B3** : proposition `INVALIDATED` annulée par le rollback / `CAPACITY_EXCEEDED` du triangle (`accept-proposal`). Disparaît avec les créneaux payants et le slot « date » V4.
- **B10** : `emptyReason=EXCLUSIVE` pour une personne emménagée. L'emménagement est coupé en V5.
- Niveaux du Lien / emménagement (I3, raccourcis `forceLevel`) : non touchés.
- Hors périmètre, non traités : **B12** (`BIRTHDATE_LOCKED` en `detailsSafe.reason` et non en code ; le code d'erreur est dans `api-contract/src/core`, interdit ici), **I1** (relire l'historique après la fin), **I7** (notification des « 3 mots »).

## Fichiers modifiés
- `packages/database/src/tx.ts`, `packages/database/src/index.ts` : FOR NO KEY UPDATE, lock_timeout, `isContentionError`.
- `packages/api-contract/src/public.ts` (fichier module, pas `core`) : `url` optionnel/nullable dans `PublicPageStateSchema` et dans `OwnAnonymousResponsesSchema.page` (rétrocompatible).
- `apps/api/src/shared/` : `application/event-publisher.ts` (`userRoom`, room par destinataire), `application/session.port.ts` (`expiresAt?`), `infrastructure/prisma/prisma-unit-of-work.ts` (contention → 409), `interface/rate-limit.ts`.
- `apps/api/src/realtime/realtime.gateway.ts`, `realtime/redis-realtime.publisher.ts`, `bootstrap.ts`, `worker.ts`, `jobs/scheduler.ts`.
- `modules/auth/application/{manage-sessions,resolve-session}.use-case.ts`.
- `modules/economy/` : `application/use-cases/local-demo-purchase.use-case.ts`, `economy.composition.ts`, `infrastructure/prisma/prisma-catalog.repository.ts`, `infrastructure/revenuecat/revenuecat-billing.provider.ts`.
- `modules/conversations/application/send-message.use-case.ts`.
- `modules/trust/` : `infrastructure/prisma-trust.repository.ts`, `interface/trust.controller.ts`, `trust.module.ts`.
- `modules/matching/` : `application/accept-proposal.use-case.ts`, `infrastructure/prisma-matching.repository.ts`, `matching.module.ts`.
- `modules/media/` : `application/media.use-cases.ts`, `infrastructure/prisma-media.repository.ts`, `media.module.ts`.
- `modules/admin/` : `admin.module.ts`, `infrastructure/prisma-admin.repositories.ts`, `infrastructure/prisma-read-models.ts`, `interface/cli/staff-roles.cli.ts`, `interface/cli/staff-totp-dev.cli.ts`.
- `modules/relationships/application/{relationship-lifecycle,relationship-creator}.service.ts`.
- `modules/social/` : `domain/anonymous.ts` (`publicSlugCandidate`), `application/ports/social.ports.ts`, `application/use-cases/anonymous.use-cases.ts`, `infrastructure/prisma-social.repositories.ts`, `interface/social.controllers.ts` (`GET /me/public-page`), `social.module.ts`.
- Tests ajoutés : `apps/api/test/integration/journey-fixes.test.ts` (9 tests), `apps/api/test/unit/clock-usage.test.ts`.
- Docs : `docs/api/commands.md` (verrous, révocation de session, rooms `user:`, code B8), `docs/api/architecture.md` (verrous).

## Tests exécutés
- `pnpm --filter @blowy/api typecheck` → 0 erreur.
- `pnpm --filter @blowy/api test` → 59/59.
- `pnpm --filter @blowy/api test:integration` ×2 → 13 fichiers, 68/68 les deux fois.
- `pnpm --filter @blowy/api test:journeys` ×2 → 82 ✅ / 2 ❌ (Triangle 04, 10 : V4) / 9 ⛔, les deux fois.
- `npx eslint` sur les dossiers touchés d'apps/api, sur `packages/database/src/{tx,index}.ts` et sur `packages/api-contract/src/public.ts` → 0.
- Mutation B1 : `FOR UPDATE` remis temporairement → le test B1 échoue (2/4 réussis, 18 s), puis correctif restauré et database reconstruit.

## Décisions
- **Pas de migration Prisma** : aucun changement de schéma.
- `FOR NO KEY UPDATE` plutôt que de déplacer la réservation d'idempotence après les verrous : la correction est globale (tout INSERT à FK vers une ligne verrouillée), et le bus reste ignorant des verrous.
- `relationship.ended` et `match.created` vont **uniquement** dans `user:<id>`. Une projection n'admet qu'une entrée par `(destinataire, événement)`, et la room `relationship:` est révoquée de toute façon. Les clients doivent rejoindre `user:<id>` via `RealtimeSync.join` (fait par les parcours ; `api-client` ne le fait pas automatiquement). Le changement est rétrocompatible pour le mobile, qui n'écoutait pas ces types.
- Restriction conservatoire MINOR : appliquée **dès le premier signalement**, jusqu'à résolution du dossier. Risque d'abus (signalement malveillant) : un modérateur lève la restriction en résolvant le dossier. Seuil ou pondération du signaleur à arbitrer par E (confiance).
- Web (`apps/web/src/app/[slug]/page.tsx`) : **aucun ajustement nécessaire**, la page transforme déjà un 404 en `notFound()`. La branche « a mis cette page en pause » (`acceptingResponses=false`) n'est plus atteignable, et F peut la retirer à sa convenance.

## Limites
- Coupure WS multi-processus : l'ordre `disconnect {sessions}` passe par le même relais Redis `blowy:rt` (non couvert en test, transport mémoire). En cas de perte, la revalidation périodique (≤ 30 s) coupe la socket au premier `join`/`resync`. Un `sync` vide (sans donnée) peut encore être émis vers la room `user:` pendant ce délai.
- La minuterie d'expiration suit le temps réel (`setTimeout`) ; en test avec `FixedClock`, c'est le contrôle au resync qui coupe.
- `message.published` reste projeté dans `conversation:<id>` : seuls `match.created` et `relationship.ended` sont dans `user:`. Les nouveaux événements V5 (sortie composée, vote révélé, bande) devraient utiliser `room: userRoom`.

## Demandes à d'autres propriétaires
- **H (QA)** : mettre à jour `docs/qa/journeys-report.md` (B1, B1bis, B2, B4, B5, B6, B7, B8, B9, B11 corrigés). `support/fixtures.ts::forcePublicSlug` n'est plus nécessaire.
- **A (orchestrateur)** : B12 demande un code `BIRTHDATE_LOCKED` dans `api-contract/src/core/errors.ts` (ou d'aligner la doc sur `PRECONDITION_FAILED {reason}`). `test:journeys` peut passer bloquant en CI, hors les 2 étapes V4 à retirer.
- **D (mobile)** / **F (web)** : écouter `match.created` / `relationship.ended` sur `user:<id>`. Pour le partage « 3 mots », utiliser `PUT/GET /v1/me/public-page` → `url`.
- **E (confiance)** : valider la politique de restriction conservatoire MINOR (dès le premier signalement).
