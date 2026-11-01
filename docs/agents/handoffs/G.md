# Handoff — Agent G (Économie / RevenueCat)

Date : 2026-11-01. Aucun commit, checkout ni reset effectué. Aucune migration créée (schéma = agent C).

## Fichiers livrés
- `apps/api/src/modules/economy/**` (clean architecture) :
  - `domain/` : `ledger.ts` (écritures entières, contre-écritures bornées, fabrique unique de clés d'idempotence `LedgerKeys`), `catalog.ts` (Strategy par type d'objet, achat déterministe, seed), `streak-freeze.ts` (1 jour protégé, jour calendaire serveur/timezone), `subscription.ts` (8 états, dérivation depuis le snapshot fournisseur, ordre des indices), `entitlements.ts` (clés par grant, dérivé non transitif, mensuel, XP pet week-end), `errors.ts` (fabriques sur l'`AppError` partagé), `params.ts`.
  - `application/` : ports `BillingProvider`, `WebhookAuthenticator`, `ReconcileScheduler`, `LedgerRepository`, `EntitlementRepository`, `CatalogRepository`, `BillingRecordRepository`, `EconomyParamsProvider`, `UserDirectory` ; services `EntitlementStateService` (point unique d'écriture des états/droits), `StoreCreditService` (crédit/remboursement consommables) ; Strategy webhook `webhook/webhook-strategies.ts` ; un use case par commande (`purchase-catalog-item`, `use-streak-freeze`, `reconcile-customer`, `process-webhook` (réception + traitement), `sync-purchases`, `grant-monthly-benefits`, `entitlement-jobs` (relations, dérivés échus, boosts non consommés, consommation boost, réconciliation périodique), `admin-economy.use-cases` (port `ADMIN_ECONOMY`), `local-demo-purchase`, `queries` (+ `EconomyEntitlementsReader`).
  - `infrastructure/` : RevenueCat réel (`revenuecat-billing.provider.ts` GET /v1/subscribers, `revenuecat-webhook.ts` auth header + parsing), `local-demo/` (interdit en production), repositories Prisma, `config/` (env Zod, paramètres depuis `@blowy/tuning`), `reconcile-scheduler.ts`.
  - `interface/` : `http/economy.controller.ts` (+ webhook public), mappers, consommateur outbox, jobs.
  - `economy.composition.ts` (composition root pure, réutilisée par module/worker/tests), `economy.module.ts` (@Global, fournit `ENTITLEMENTS_READER`, `ADMIN_ECONOMY`, `ECONOMY_OUTBOX_CONSUMERS`, `ECONOMY_JOBS`).
  - Tests `__tests__/` : `domain.test.ts`, `revenuecat-adapter.test.ts`, `economy.int.test.ts`, `economy.http.int.test.ts`.
- `packages/api-contract/src/economy.ts` + ligne d'export dans `src/index.ts` (dist reconstruit).
- `apps/mobile/src/features/purchases/**` : port `model/purchases.port.ts`, adapters RevenueCat (10.16.0) et LOCAL_DEMO, sélection d'adapter, client API, Provider + hooks `usePurchases/useOfferings/useEntitlements/useWallet`, sélection paywall pure + test.
- `docs/economy/revenuecat.md`.

## Endpoints `/v1`
GET /catalog · GET /wallet · POST /catalog/:itemId/purchase (Idempotency-Key) · POST /streak-freezes/use (Idempotency-Key) · GET /subscriptions/me · GET /purchases/products · POST /purchases/sync (corps ignoré) · POST /purchases/local-demo (démo seulement, sinon 501) · POST /webhooks/revenuecat (public, header Authorization). Admin : port `ADMIN_ECONOMY` (correction motivée, ledger, webhooks, redrive, réconciliation).

## Tests exécutés (réellement)
- `cd apps/api && npx vitest run src/modules/economy` → **4 fichiers, 45 tests passés** (2 exécutions consécutives stables pour les 43 premiers). Dont intégration PostgreSQL `blowy_test` : 3 dépenses concurrentes → 1 seule réussit, solde 100, jamais négatif (§21-3) ; double tap / même commandId → un seul débit, `IDEMPOTENCY_CONFLICT` si contenu différent ; UPDATE/DELETE ledger refusés par la base ; œuf cosmétique unique ; boost non consommé remboursé une fois ; 2 gels concurrents → 1 seul jour protégé ; mauvais header / header absent → 401 sans enregistrement (§21-15) ; même webhook ×4 (dont 2 concurrents) + autre événement même transaction → un seul crédit (§21-2) ; remboursement consommable borné au solde, une seule fois ; EXPIRATION ancien ignoré après RENEWAL puis réconciliation → REFUNDED + `economy.plus_capacity_reduced` ; sandbox refusé en production ; payload client falsifié ignoré ; dérivés non transitifs (A→B oui, B→C non), mensuel au titulaire seul une fois malgré 3 exécutions, révocation à perte du droit et à `relationship.ended` ; fumée HTTP Nest (guard, filtre d'erreurs, idempotence, webhook 401/200/DUPLICATE, démo LOCAL_DEMO).
- `cd apps/mobile && npx vitest run src/features/purchases` → 4 tests passés.
- `npx eslint apps/api/src/modules/economy apps/mobile/src/features/purchases packages/api-contract/src/economy.ts` → 0 erreur.
- `apps/api: npx tsc -p tsconfig.json --noEmit` → 0 erreur dans economy (1 erreur restante hors périmètre : `shared/core.module.ts` importe `infrastructure/engine/engine.factory.js` encore absent — socle C en cours).
- Mobile : typecheck de la feature avec un tsconfig temporaire (scratchpad, `apps/mobile/tsconfig.json` absent) → 0 erreur contre react-native-purchases 10.16.0.
- `pnpm --filter @blowy/api test` → **échoue avant mes tests** : « No projects matched the filter unit » (pas de `vitest.config.ts`, propriété C). Demandé à C.
- Préparation : `prisma migrate deploy` sur `blowy_test` (migrations de C, aucune nouvelle).

## Décisions
- Webhook : authentification par header Authorization (doc officielle), comparaison temps constant ; HMAC optionnel non activé (extension = second `WebhookAuthenticator`).
- Réconciliation réseau jamais sous verrou ni dans la réponse webhook : planifiée après commit (`InProcessReconcileScheduler`) ; filet = job périodique qui reprend tout abonnement `lastProviderEventAt > lastReconciledAt`, échu ou non réconcilié depuis 24 h.
- Consommables : clé = `transaction_id` store. Crédit par réconciliation seulement si `non_subscriptions[].store_transaction_id` est renvoyé (absent de l'exemple de doc) → sinon webhook seul ; jamais de double crédit.
- Remboursement pièces : contre-écriture bornée au solde (jamais négatif), manque tracé en métadonnée, pas de dette.
- STAFF_GRANT n'ouvre pas les bénéfices mensuels ; dérivé : ni mensuel ni espèces premium (P-5.11/5.12).
- Boost : validité 7 j, remboursé intégralement s'il n'est pas consommé ; ajustement = `matching.exposure.boostAdjustment`.
- Mensuel : période UTC 'YYYY-MM' ; gels mensuels plafonnés au maximum disponible.
- Mobile : port écrit dans la feature (fichier de D absent) ; SDK 10.16.0 conformément à l'orchestrateur ; enums lus en membres statiques de `Purchases`.

## Limites / nécessite fournisseur
- Appels réels RevenueCat (clé secrète), vrais webhooks, achats/essai/restauration store : **nécessitent clé/compte + appareil/signature** — non testés.
- État de la démo locale en mémoire du processus API.
- Expiration des gels mensuels non définie (aucune échéance) ; « 2 gels/mois » = versement mensuel, pas un quota.
- Consommation du boost par le matching : `ConsumeBoostUseCase` exposé dans le graphe, à brancher par le propriétaire du matching.

## Demandes à d'autres propriétaires
- **C** (message envoyé) : ajouter `EconomyModule` à `feature-modules.ts` et retirer le `DbEntitlementsReader` du CoreModule ; enregistrer `ECONOMY_OUTBOX_CONSUMERS` et `ECONOMY_JOBS` dans worker.ts ; fournir `RELATIONSHIP_READER` globalement ; créer `vitest.config.ts` (projet integration : `**/*.int.test.ts`) ; seed `StoreProduct`/`CatalogItem` ; le module relations consomme `economy.plus_capacity_reduced` → LEGACY ; corriger l'import `engine.factory.js` manquant.
- **B** (tuning) : publier dans `@blowy/tuning` les valeurs encore lues de `PENDING_TUNING_VALUES` (`economy-params.ts`) : `freeDateSlots=1`, `plusDateSlots=3`, `visibilityBoostValidityDays=7`, `maxAvailableStreakFreezes=5` (lues automatiquement depuis `tuning.economy.<clé>` dès qu'elles existent).
- **A** (domain) : ajouter `'BOOST_NOT_CONSUMED_REFUND'` à `LedgerReason` dans `packages/domain/src/economy.ts` (déjà dans l'enum Prisma ; élargi localement dans `domain/ledger.ts` en attendant).
- **D** (mobile) : ré-exporter `apps/mobile/src/features/purchases/model/purchases.port.ts` depuis `src/core/ports/purchases.ts` (pas de seconde interface) ; monter `PurchasesProvider` avec `selectPurchasesAdapter({ platform, iosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY, androidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY, blowyEnv }, createPurchasesApi(transport), uuid)` ; textes UI (« Démo locale », essai, offre) dans les locales.
- **F** (admin) : brancher `ADMIN_ECONOMY` derrière rôle + step-up ; aucune action « rembourser ».

## Mise à jour après intégration par C
- C a branché `EconomyModule` (seul fournisseur de `ENTITLEMENTS_READER`), les consommateurs outbox et jobs dans le worker, `vitest.config.ts` (unit/integration) et le seed.
- Vérifié par G : `pnpm --filter @blowy/api test` → 5 fichiers, 42 tests passés ; `pnpm --filter @blowy/api test:integration` → 9 fichiers, 33 tests passés (au 1er lancement, 4 fichiers hors economy avaient échoué, « profile: 400 zoneCode » : instabilité possible côté C) ; `tsc --noEmit` API sans erreur.
- Remarques envoyées à C : (1) le seed Subscription/Grant LOCAL_DEMO d'Alex sera révoqué au premier `/purchases/sync`, car l'état du fournisseur de démo vit en mémoire (deux options proposées) ; (2) l'écriture de bienvenue du seed utilise STAFF_CORRECTION sans acteur ; (3) le rate-limit par IP s'applique aussi au webhook RevenueCat, risque de 429 → exclure la route ou relever sa limite.
- Réponse de C (vérifiée par G) : le seed ne crée plus d'abonnement, de droit ni d'écriture ledger pour Alex (la démo passe par `/v1/purchases/local-demo`) ; `/v1/webhooks/*` est exclu du limiteur par IP ; l'instabilité « zoneCode » venait de deux exécutions concurrentes sur `blowy_test`, désormais sérialisées par `pg_advisory_lock`. Relance : `test:integration` → 9 fichiers, 33 tests passés.
