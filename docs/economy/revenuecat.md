# Économie, abonnements Blowy+ et RevenueCat

Propriétaire : agent G. Doc officielle vérifiée le 2026-11-01 :
[Webhooks](https://www.revenuecat.com/docs/integrations/webhooks), [Event Types and Fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields),
[API v1 Customers](https://www.revenuecat.com/docs/api-v1/customers), [Customer Info Model](https://www.revenuecat.com/docs/api-v1/customer-info-model),
types du SDK `react-native-purchases` **10.16.0** (épinglé : la 11.0.0 casse `pod install`, PurchasesHybridCommon 20.1.0 absent de CocoaPods).

## Principes
- **Autorité = RevenueCat (GET /v1/subscribers/{appUserID})**. Les webhooks sont des *indices* ordonnés par `event_timestamp_ms` ; un indice plus ancien que le dernier appliqué est ignoré, puis une réconciliation est **toujours** planifiée après commit (recommandation officielle : répondre vite, puis appeler GET /subscribers).
- **appUserID = `User.id` (UUID v7 stable)**, jamais l'email. Le mobile appelle `Purchases.configure({ apiKey, appUserID })` puis `logIn(userId)` si l'identifiant change.
- **Le client n'accorde jamais Blowy+** : `POST /v1/purchases/sync` ignore tout corps et réconcilie l'utilisateur de session ; les droits sont lus via `GET /v1/subscriptions/me`.
- **Pièces** : ledger append-only en entiers (trigger SQL anti UPDATE/DELETE, CHECK `balance >= 0`, garde SQL `balance + amount >= 0`). Débit sous `SELECT … FOR UPDATE` du wallet (ordre global users → … → wallets). Corrections/remboursements = contre-écritures (`reversesEntryId` UNIQUE).
- **Consommable crédité une seule fois** : clé = transaction **store** (`transaction_id` du webhook) — UNIQUE `StoreTransaction(provider, environment, storeTransactionId)` + clé ledger `store:<provider>:<env>:<txId>`. Rejeu, retry RevenueCat, second événement, restauration : aucun double crédit.
- **Sandbox / production séparés** : `environment` de l'événement (`SANDBOX` ou production) et `is_sandbox` du subscriber → un enregistrement `Subscription` par environnement. En production, un achat sandbox n'ouvre **aucun** droit (sauf `REVENUECAT_ACCEPT_SANDBOX=true`, ex. revue App Store).

## Authentification du webhook (réelle, documentée)
RevenueCat envoie la valeur du **header `Authorization` configurée dans le dashboard** à chaque requête. Le serveur compare cette valeur en **temps constant** (digests SHA-256 + `timingSafeEqual`) à `REVENUECAT_WEBHOOK_AUTH`. Mauvais header ou header absent → 401 `UNAUTHENTICATED`, rien n'est enregistré. Sans secret configuré, tout webhook est refusé.
> La doc mentionne aussi une signature HMAC **optionnelle** (`X-RevenueCat-Webhook-Signature: t=…,v1=…`). Elle n'est **pas** activée dans cette version ; l'ajouter = un second `WebhookAuthenticator` (Strategy) lisant le corps brut.

Idempotence : `ProviderWebhookEvent` UNIQUE `(provider, providerEventId=event.id)`. Un doublon déjà traité répond 200 `DUPLICATE` sans effet. Un événement en échec (`FAILED`) est repris par le job `economy.retry_webhooks`.

## Traitement par type (Strategy `application/webhook/webhook-strategies.ts`)
| Type | Effet local (indice) |
|---|---|
| INITIAL_PURCHASE, RENEWAL, UNCANCELLATION, PRODUCT_CHANGE, SUBSCRIPTION_EXTENDED, TEMPORARY_ENTITLEMENT_GRANT | ACTIVE (TRIAL si `period_type=TRIAL`) ; expiré si l'échéance est déjà passée |
| CANCELLATION | `cancel_reason=CUSTOMER_SUPPORT` = remboursement → REFUNDED (abonnement) ou contre-écriture pièces (consommable, bornée au solde, manque tracé) ; sinon CANCELLED_PENDING_EXPIRY |
| BILLING_ISSUE | GRACE_PERIOD si `grace_period_expiration_at_ms` futur |
| EXPIRATION | EXPIRED |
| NON_RENEWING_PURCHASE | crédit unique des pièces du produit (`StoreProduct.coinsAmount`) |
| REFUND_REVERSED | re-crédit du montant repris (consommable) ; abonnement : réconciliation |
| TRANSFER, SUBSCRIPTION_PAUSED, TEST, autres/inconnus | aucun effet local, réconciliation seule |

## États d'abonnement
`NONE, TRIAL, ACTIVE, GRACE_PERIOD, CANCELLED_PENDING_EXPIRY, EXPIRED, REFUNDED, REVOKED` dérivés du snapshot (`domain/subscription.ts::deriveStateFromSnapshot`) : `refunded_at` → REFUNDED ; abonnement vivant sans entitlement (transfert) → REVOKED ; vivant + `TRIAL` → TRIAL ; vivant + `unsubscribe_detected_at` → CANCELLED_PENDING_EXPIRY ; échu mais `grace_period_expires_date` futur → GRACE_PERIOD ; sinon EXPIRED. Un abonnement local absent du snapshot devient REVOKED.

## Droits Blowy+
- Titulaire (grant `STORE_SUBSCRIPTION`) : 3 rendez-vous, carte, indices, Pia/Suzie, XP **pet** ×2 le week-end, bénéfices mensuels.
- **Bénéfices mensuels** : 200 pièces + 2 gels (tuning `coins.plusMonthly`) au **titulaire payant** (ACTIVE / GRACE / CANCELLED_PENDING_EXPIRY ; pas en essai, pas de grant staff), une fois par `(user, 'YYYY-MM' UTC)` — UNIQUE `MonthlyBenefitGrant` + clé ledger. Gels plafonnés à `maxAvailableStreakFreezes`.
- **Partenaire emménagé** : grant `DERIVED_PARTNER` (3 rendez-vous, carte, indices, XP week-end ; **ni** bénéfices mensuels **ni** espèces premium), échéance = celle de la source, **non transitif** (un dérivé ne peut pas en produire un autre), révoqué à la rupture (`relationship.ended`) ou à la perte du droit payant.
- **Expiration** : si la capacité de rendez-vous baisse, outbox `economy.plus_capacity_reduced {userId, newDateSlots, occurredAt}` → le module relations marque LEGACY les relations au-delà (P-5.13). Economy n'écrit jamais ses tables.
- Les droits sont exposés aux autres modules par le port partagé `EntitlementsReader` (implémentation `EconomyEntitlementsReader`).

## Catalogue pièces
Gel de série 200, boost de visibilité 300 (tuning `coins.catalog`), œufs rares **cosmétiques déterministes** (variante fixée dans `metadata.variant`, `perUserLimit` 1, jamais de bébé relationnel ni de contournement du niveau 7), accessoires/décorations. Aucune loterie.
- **Gel** : consommé atomiquement (verrou des gels AVAILABLE + série, UNIQUE partiel `(userId, protectedDay)`), protège **un** jour manqué (jour calendaire serveur, timezone de la série), n'ajoute pas de jour à la série, jamais consommé automatiquement.
- **Boost** : ajustement d'exposition borné (`matching.exposure.boostAdjustment`) du **prochain lot éligible** uniquement ; n'affecte ni score de vision, ni filtres, ni accord humain, ni XP. Validité 7 j (hypothèse) ; **non consommé à expiration → remboursé intégralement** (`BOOST_NOT_CONSUMED_REFUND`, une fois). Consommation par le matching : `ConsumeBoostUseCase` (transition ACTIVE→CONSUMED idempotente). Pas de garantie de rendez-vous.

## Endpoints `/v1` (contrats `packages/api-contract/src/economy.ts`)
| Méthode | Route | Notes |
|---|---|---|
| GET | /catalog | objets actifs |
| GET | /wallet | solde + historique paginé (curseur) + inventaire (1ʳᵉ page) + gels disponibles |
| POST | /catalog/:itemId/purchase | `Idempotency-Key` requis ; `replayed` dans la réponse |
| POST | /streak-freezes/use | `Idempotency-Key` requis |
| GET | /subscriptions/me | état, droits (clé, source, échéance), `mode` LIVE/SANDBOX/LOCAL_DEMO |
| GET | /purchases/products | ids store + pièces, sans prix |
| POST | /purchases/sync | réconciliation serveur, corps ignoré |
| POST | /purchases/local-demo | démo locale seulement (sinon 501 NOT_CONFIGURED) |
| POST | /webhooks/revenuecat | public, header Authorization |
Admin (port `ADMIN_ECONOMY`, branché par l'agent F) : correction motivée (STAFF_CORRECTION, ±100 000 max, motif ≥ 5 caractères, idempotente), lecture ledger, liste des webhooks, redrive, réconciliation d'un utilisateur. Aucune action « rembourser » côté admin : seul le store rembourse.

## Configuration du dashboard RevenueCat (à faire avec le compte réel)
1. Projet « Blowy », apps App Store + Play Store ; clés **publiques** SDK → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
2. **Entitlement** `blowy_plus`.
3. **Produits** (créés d'abord dans App Store Connect / Play Console, prix fixés par pays dans les stores) :
   - abonnements `blowy_plus_annual` (cible 59,88 €/an ≈ 4,99 €/mois), `blowy_plus_monthly` (14,99 €), `blowy_plus_weekly` (6,99 €) — même groupe d'abonnement, rattachés à `blowy_plus` ;
   - **essai 3 jours** = offre introductive « free trial » configurée dans chaque store (l'éligibilité est calculée par le store/SDK) ;
   - consommables `coins_<n>` (ex. `coins_500`).
   Les prix ci-dessus sont des hypothèses produit (P-5.20) : **aucun n'est codé** dans l'app ni le serveur.
4. **Offerings** : `default` (current) avec packages `$rc_annual`, `$rc_monthly`, `$rc_weekly` + packs de pièces. Offre « Plus tard » (−60 % 1ʳᵉ année) **uniquement si** une offre introductive réelle existe : offering dédiée avec `metadata.placement = "onboarding_later"` contenant le package annuel avec prix introductif. Le pourcentage affiché est calculé depuis les prix store.
5. **Webhook** : URL `https://<api>/v1/webhooks/revenuecat`, header Authorization = valeur aléatoire ≥ 24 caractères (ex. `Bearer <32 octets base64>`) copiée dans `REVENUECAT_WEBHOOK_AUTH` ; choisir les environnements envoyés (production + sandbox en staging).
6. **Clé secrète API v1** (Project settings → API keys, secret) → `REVENUECAT_SECRET_API_KEY` (serveur uniquement, jamais dans `EXPO_PUBLIC_*`).
7. Base serveur : lignes `StoreProduct` (id store, kind, `coinsAmount`, `entitlementId='blowy_plus'`) — via seed.

## Variables d'environnement
| Variable | Où | Rôle |
|---|---|---|
| `BILLING_PROVIDER` | API | `revenuecat` \| `local_demo` (défaut : revenuecat si clé, sinon local_demo hors production) |
| `REVENUECAT_SECRET_API_KEY` | API (secret) | GET /v1/subscribers |
| `REVENUECAT_WEBHOOK_AUTH` | API (secret) | valeur exacte du header Authorization |
| `REVENUECAT_API_BASE_URL` | API | défaut `https://api.revenuecat.com/v1` |
| `REVENUECAT_ACCEPT_SANDBOX` | API | production : accepter les droits sandbox (défaut false) ; hors production toujours acceptés |
| `REVENUECAT_TIMEOUT_MS` | API | défaut 8000 |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` | mobile | clés publiques SDK |
| `EXPO_PUBLIC_BLOWY_ENV` | mobile | `production` → mode LIVE ; sans clé en production → achats indisponibles (aucune démo) |
Démarrage refusé si `BLOWY_ENV=production` et `BILLING_PROVIDER=local_demo`, ou si la clé secrète / le secret webhook manquent.

## Mode LOCAL_DEMO
`LocalDemoBillingProvider` (serveur) + `LocalDemoPurchasesAdapter` (mobile) : aucun store, aucun prix affiché (étiquette « Démo locale »), aucun essai fabriqué. `POST /v1/purchases/local-demo` modifie l'état « fournisseur » simulé puis passe par **la même réconciliation** que la production. Toutes les réponses portent `mode: "LOCAL_DEMO"` ; les droits LOCAL_DEMO n'ont aucun effet dans un environnement qui ne l'accepte pas. L'état démo vit en mémoire du processus API (perdu au redémarrage ; les droits accordés restent en base jusqu'à la prochaine réconciliation).

## Mobile (`apps/mobile/src/features/purchases`)
`PurchasesProvider` (port + api + userId) ; `useOfferings()` (packages et prix localisés du store, sélection paywall : essai seulement si éligible, offre « plus tard » seulement si réelle) ; `usePurchases()` (`purchase` → `purchasePackage` puis `POST /purchases/sync` ; `restore` → `restorePurchases` puis sync) ; `useEntitlements()` (droits du **serveur**) ; `useWallet()`. Le listener CustomerInfo déclenche une synchronisation serveur. iOS : éligibilité via `checkTrialOrIntroductoryPriceEligibility` (inconnu → pas d'essai affiché) ; Android : phase gratuite/intro de `defaultOption` (présente seulement si éligible).

## Statut
| Élément | Statut |
|---|---|
| Domaine (ledger, catalogue, gels, états, droits dérivés, mensuel) | testé localement (unitaires) |
| Concurrence dépenses / gels, append-only, rejeu webhook, désordre, remboursement, sandbox refusé, payload client ignoré, mauvais header, dérivés non transitifs, mensuel unique, rupture | testé localement (intégration PostgreSQL `blowy_test`, réseau RevenueCat simulé au format documenté) |
| Appel réel GET /v1/subscribers, réception de vrais webhooks | **nécessite clé/compte fournisseur** |
| Achat store, essai, restauration, offre introductive | **nécessite appareil/signature + produits store** |
| Adapter mobile RevenueCat | codé, typé contre 10.16.0, non exécuté sur appareil |
| Consommables crédités par réconciliation | uniquement si RevenueCat renvoie `store_transaction_id` dans `non_subscriptions` (absent de l'exemple de doc) ; sinon crédit par le webhook NON_RENEWING_PURCHASE seul — à vérifier en sandbox |
