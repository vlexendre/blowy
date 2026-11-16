# @blowy/api

API REST de Minimoa (NestJS 12, ESM). Seul écrivain de la base : l'app et le site passent par elle via
`@blowy/api-client`. Le contrat (routes et schémas Zod) vit dans `packages/contract`.

## Lancer en local

```bash
pnpm install
cp .env.example apps/api/.env      # puis garder BLOWY_ADAPTERS=memory
pnpm dev:api                       # tsx watch, http://localhost:3000/health
```

En mode `memory`, rien d'externe n'est nécessaire :

- **auth** : jeton `test:<uuid>` ou `test:<uuid>:<email>` dans `Authorization: Bearer …` (à utiliser avec
  `EXPO_PUBLIC_AUTH=local` côté app) ;
- **stockage** : les tickets d'envoi pointent vers `PUT /dev/uploads/<chemin>?token=…` et les URL de lecture
  vers `GET /dev/media/<chemin>?token=…` (expirent au bout d'une heure, comme sur Supabase) ;
- **e-mails** : sans `RESEND_API_KEY`, seuls le sujet et le domaine du destinataire sont écrits dans la console ;
- **démo** : `BLOWY_DEMO=1` crée Léa (Suzie), Malo (Gaston) et Sasha (Pia) au démarrage, habillés et avec des
  besoins variés (remis à niveau à chaque inscription, pour que Suzie puisse toujours saluer). À chaque inscription,
  Léa te salue et Malo se lie avec toi et t'écrit : tous les écrans ont des données. Identifiants fixes dans
  `src/demo/demo.ts`. Les données mémoire disparaissent à l'arrêt.

```bash
curl -H 'Authorization: Bearer test:11111111-1111-4111-8111-111111111111' localhost:3000/v1/me
```

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm --filter @blowy/api dev` | développement (tsx watch, lit `apps/api/.env`) |
| `pnpm --filter @blowy/api typecheck` | TypeScript strict |
| `pnpm --filter @blowy/api test` | tests de bout en bout (API réelle en mémoire, pilotée par `@blowy/api-client`, horloge simulée) |
| `pnpm --filter @blowy/api build` | bundle `dist/main.js` (tsup ; les paquets `@blowy/*` sont embarqués) |
| `pnpm --filter @blowy/api start` | `node dist/main.js` |
| `pnpm --filter @blowy/api check:schema` | migrations sur un PostgreSQL **local** jetable, puis comparaison avec `database.types.ts`, RLS, politiques, temps réel, droits des fonctions (voir plus bas) |

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `BLOWY_ENV` | `local` | `local` ou `production` |
| `BLOWY_ADAPTERS` | `memory` | `memory` ou `supabase` — **la production refuse `memory`** |
| `BLOWY_DEMO` | `0` | `1` = monde de démo (seulement en `local` + `memory`) |
| `PORT` | `3000` | port d'écoute |
| `API_URL` | `http://localhost:$PORT` | URL publique de l'API (liens d'envoi/lecture en mode mémoire) |
| `SUPABASE_URL` | — | requis avec `supabase` |
| `SUPABASE_SERVICE_ROLE_KEY` | — | clé secrète (service) ; requise avec `supabase`, jamais dans l'app |
| `RESEND_API_KEY` | vide | vide = e-mails dans la console |
| `MAIL_FROM` | `Minimoa <hello@blowy.app>` | expéditeur |
| `WEB_URL` | `https://blowy.app` | liens des e-mails |
| `CORS_ORIGINS` | vide | origines autorisées, séparées par des virgules |

L'API refuse de démarrer si la configuration est incohérente (production + mémoire, Supabase sans URL ou clé).

## Comment les adaptateurs basculent

Chaque dépendance externe est un port avec deux adaptateurs (`src/integrations/*`, `src/modules/*/infrastructure`) :
`CoreModule.forRoot(env)` (`src/core.module.ts`) choisit d'après `BLOWY_ADAPTERS`, pour l'auth (`AuthVerifier`,
`AuthAdmin`, `UserEmails`), le stockage (`Storage`), et chaque dépôt (`repository(TOKEN, adapters, memory, supabase)`).
L'e-mail bascule selon la présence de `RESEND_API_KEY`. Les adaptateurs mémoire partagent une base en mémoire
(`src/persistence/memory-db.ts`) qui reproduit les suppressions en cascade de la migration.

## Architecture

```
src/main.ts · app.ts · app.module.ts · core.module.ts
config/env.ts            variables validées par Zod
shared/                  garde d'auth (@Public, @CurrentUser), pipe Zod, filtre d'erreurs, horloge, ids, graine, limiteur
integrations/            auth, storage (+ contrôleur /dev en mémoire), mailer (Resend / console) + Notifier
persistence/             client Supabase (clé service), base mémoire, fabrique de dépôts
modules/<m>/             application (cas d'usage) · ports.ts · infrastructure · interface (contrôleurs, présentateurs)
demo/                    monde de démo local
```

## Soins et garde-robe

- **Besoins** (faim, énergie, humeur, 0–100) : usure rattrapée à la lecture (`decayNeeds`, heures réelles depuis
  `pets.needs_at`). On n'enregistre l'usure que par pas entiers de 2 h (`pet-catch-up.ts`) pour qu'une lecture
  fréquente ne fausse pas l'arrondi ; `PetsRepository.save` n'écrit jamais les besoins (`saveNeeds` s'en charge).
- `POST /v1/pet/care` : refusé (`already_done`) si le besoin est comblé ; sinon besoins, événement `care_*`
  (jauges) et un jour de soin par jour civil.
- **Objets** (`pet_items`) : le service `Wardrobe` calcule les compteurs (jours de soin, liens non archivés,
  meilleur niveau, meilleure série, défis, 3 mots) et attribue les objets gagnés à chaque vue du pet
  (`GetPetView`, donc aussi après soin, défi, renommage, tenue) : `PetView.newItems` = objets attribués par
  cette requête. Les étapes franchies ailleurs (lien, niveau, série d'un lien, 3 mots) sont fêtées à la vue suivante.
  Les objets de départ sont attribués à l'inscription (pas « nouveaux »). `pets.best_streak` monte avec la
  série des liens (jours d'affilée où les deux s'écrivent) et reste acquis quand la série retombe.
- `GET /v1/pet/wardrobe` (catalogue, état, étape) · `PUT /v1/pet/outfit` (`forbidden` si un objet n'est pas à toi).
- **Conséquences** : la tenue se voit partout (`PublicPet.outfit`) ; hors des liens, l'humeur montrée suit la
  forme ; les suggestions de rencontre sont limitées par `ENCOUNTER_QUOTA` (aucune si le pet boude) et un pet
  qui boude ne peut pas saluer (accepter un coucou reste possible).

Règles : injection explicite (`@Inject(JETON)`, pas d'`emitDecoratorMetadata`) ; pas de `Date.now()` ni d'aléa dans
les cas d'usage (horloge injectée, répliques des pets choisies par une graine stable) ; les vies des liens et l'usure
des jauges sont rattrapées à chaque lecture (`tickLink`, `decayGauges`) ; ce qui doit partir sans que personne n'ouvre
l'app (push programmés, bilans, conservation des données) passe par le minuteur (`POST /internal/tick`).

## Déployer avec Docker (Render, Fly.io, Railway)

L'image se construit depuis la **racine du dépôt** (elle a besoin du lockfile et des paquets internes) :

```bash
docker build -f apps/api/Dockerfile -t blowy-api .
docker run -p 3000:3000 --env-file apps/api/.env -e BLOWY_ENV=production -e BLOWY_ADAPTERS=supabase blowy-api
```

L'image finale ne contient que `dist/` et les dépendances de production (`pnpm deploy --prod`), tourne en
utilisateur `node` et expose `GET /health` pour la sonde de santé.

- **Render** : nouveau *Web Service* → Docker, *Dockerfile path* `apps/api/Dockerfile`, *Docker context* `.`,
  *Health check path* `/health`, variables d'environnement ci-dessus (secrets en *Secret Files* ou *Environment*).
- **Fly.io** : `fly launch --dockerfile apps/api/Dockerfile --no-deploy`, puis `fly secrets set SUPABASE_SERVICE_ROLE_KEY=… RESEND_API_KEY=…`,
  `internal_port = 3000` et un `[[http_service.checks]]` sur `/health`, puis `fly deploy`.
- **Railway** : service depuis le dépôt, variable `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`, variables d'environnement,
  *healthcheck path* `/health`.

Une seule instance suffit pour cette version : le cache des jetons (60 s) et le limiteur de la page « 3 mots » sont en
mémoire. Pour plusieurs instances, déporter le limiteur (Redis) ; le reste est sans état.

Conseil : ajouter un `.dockerignore` à la racine (`**/node_modules`, `**/dist`, `.git`, `apps/mobile`, `apps/web`)
pour alléger le contexte de build.

## Plateforme : IA, minimoas du chat, notifications, minuteur

Coûts et ordres de grandeur : `docs/COUTS.md`. Interfaces partagées : `docs/V7-INTERFACES.md`.

### Variables

| Variable | Défaut | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | vide | clé de l'API Anthropic (seulement dans `apps/api/.env` ou les secrets de l'hébergeur) |
| `AI_PROVIDER` | selon la clé | `anthropic` (clé requise) · `memory` (déterministe, refusé en production) · `off` ; défaut : `anthropic` si clé, sinon `memory` en mémoire, `off` avec Supabase |
| `AI_PROVIDER_NAME` / `AI_PROVIDER_COUNTRY` | `Anthropic` / `US` | prestataire d'IA nommé dans les textes vus par les gens (accord de lecture des chats, accord des preuves, Moi › L'IA et toi) ; code pays ISO à deux lettres. Doit rester celui de la politique de confidentialité (`apps/web/src/config/legal.ts`, `PROCESSORS.ai`) |
| `AI_MODEL_SMALL` / `AI_MODEL_MEDIUM` | `claude-haiku-5-5` / `claude-sonnet-5-5` | identifiants de modèle par palier |
| `AI_KILL_SWITCH` | `0` | `1` = plus aucun appel (tout passe par les règles) |
| `AI_DAILY_CEILING_USD` | `3` | plafond global de dépense estimée par jour (Europe/Paris) |
| `AI_USER_BUDGETS` | `chat_remark=4,habit_proof=6,weekly_review=1,moderation=4` | appels par personne, par jour et par fonction |
| `AI_PRICES_SMALL` / `AI_PRICES_MEDIUM` | prix publics | `entrée,sortie,écriture cache,lecture cache` en $ par million de jetons (coût estimé du compteur) |
| `AI_EUR_PER_USD` | `0.9` | conversion pour l'affichage en euros (approximative, à tenir à jour) |
| `PUSH_PROVIDER` | `memory` / `expo` | `expo` · `memory` (boîte d'envoi, refusé en production) · `off` |
| `EXPO_ACCESS_TOKEN` | vide | seulement si « enhanced push security » est activé chez Expo |
| `INTERNAL_TICK_SECRET` | vide | secret du minuteur (24 caractères au moins) ; vide = la route n'existe pas |
| `TICK_BUDGET_MS` | `20000` | temps maximal d'un tick ; le reste passe au suivant |

### IA (`src/integrations/ai`)
Une seule porte : `AI_GATEWAY` (`AiGateway.complete`). Avant tout appel : interrupteur → modèle configuré → plafond
global du jour → budget de la personne pour la fonction (atomique, `ai_take_user_call`). Puis appel (consigne système
mise en cache, `max_tokens` borné : 400 petit palier, 800 moyen), puis compteur `ai_usage_daily` (appels, refus,
erreurs, jetons, coût estimé). `ok: false` (`disabled` | `budget` | `error`) → l'appelant applique sa règle.
Lecture de l'usage : service `AiUsage.summary(days)` (injectable partout ; l'administration l'affiche).

### Minimoas du chat (`src/modules/links/minimoas`)
- Rôles (`messages.pet_role`) : `icebreaker` (création du lien, question tirée du premier point commun de vision,
  sans IA), `nudge` (silence des personnes de 72 h, minuteur), `remark` (premier message du jour, mot doux / vanne,
  puis tous les 12 messages), `guard` (le ton monte : visible par la seule personne, `messages.visible_to`),
  `event` (niveau, vies, palier de série ; ni plafonné ni coupé).
- Au plus 3 interventions par jour et par lien ; `PATCH /v1/links/:id/minimoas { muted }` coupe (un seul « coupé » suffit).
- Accord par personne et par lien (`{ consent }`) ; l'IA ne lit que si les deux ont dit oui. Sinon : lignes de règle
  au rythme. Avec accord : un appel au petit modèle par déclencheur (12 messages, 72 h de silence, heuristique de ton
  locale), fenêtre des 8 derniers messages (280 caractères chacun), personnes anonymisées en A / B, réponse « RIEN »
  possible ; rien n'est conservé de la fenêtre. Les appels partent après la réponse (`Background`).
- Santé du lien pour le bilan : `ChatMinimoas.linkHealth(userId)` (comptes par auteur, jours où les deux ont écrit, série, vies).

### Notifications (`src/modules/notifications`, `src/integrations/push`)
`NOTIFIER.notify(userId, kind, vars)` ne lève jamais : réglage par type → une fois par jour (défi, sortie, série,
lien en danger, bilan, essai) → heures calmes 22 h – 8 h dans le fuseau de la personne (reporté à 8 h : nouveau lien,
coucou, 3 mots, objet, lien en danger, essai ; abandonné : le reste) → 3 par jour hors messages → messages : un push par
lien toutes les 5 min, sans contenu. Textes : `@blowy/content` (`v7/notifications.ts`) selon `profiles.locale`.
`vars` reconnues : `name`, `minimoa`, `count`, `lives`, `item`, `linkId`, `path` (lien profond `blowy://…` imposé).
`data` de chaque push : `PushDataZ` (`kind`, `url`, `linkId`, `state` pour widgets et activités en direct).
Appareils : `POST /v1/devices` à chaque ouverture (jeton Expo + fuseau), `POST /v1/devices/remove` à la déconnexion.
Activités en direct : port `LIVE_ACTIVITIES` (`integrations/push/live-activity.ts`), sans envoi pour l'instant.

### Série d'un lien (spéc §24 : plus de photo du jour)
Règles dans `packages/domain/src/link.ts` (`applyLinkMessage`, `linkToday`, `lateSide`, `linkWeek`) : un jour compte
quand chacun a écrit au moins un message (jour de Paris) ; la série avance au premier message du deuxième, retombe à 0
au rattrapage d'un jour qui n'a pas été écrit par les deux ; le jour à deux rend une vie ; xp : 1 par message (plafond
20 / jour / lien), 8 au premier message du jour de chacun, 12 au jour à deux (les points de l'ancienne photo). État
tenu dans la ligne du lien (`recent_days` sur 14 jours, `milestones`, `best_streak`, `duo_days`, `last_duo_day_on`) :
la vue d'un lien (`Link.today` : `mine`, `theirs`, `atStake`, `week` ; `Link.next`, `bestStreak`) ne coûte aucune
requête de plus. `GET /v1/links/:id/memories` : étapes (rencontre, niveaux, paliers 3·7·14·30·60·100), chiffres et
anciennes photos (`daily_photos`, lecture seule). Les routes `POST /v1/links/:id/photo/ticket` et `/photo` n'existent
plus (404). Rappel du soir `your_turn` (`application/write-reminders.ts`, appelé par `LinkJobs` de 19 h à 22 h, Paris) :
une notification par personne et par jour, qui résume ses liens où l'autre a écrit et pas elle ; chaque lien lu est
marqué (`write_reminder_on`). Démo locale : `POST /dev/demo/links` ajoute à la dernière personne inscrite une série en
jeu (Sasha), un lien en danger (Inès) et un lien fantôme (Yanis).

### Minuteur : `POST /internal/tick`
Travaux listés dans `src/modules/tick/jobs.ts` (un par chantier, une ligne chacun), appelés dans l'ordre, chacun une
fois par créneau d'une minute (table `tick_runs`), en lots, dans `TICK_BUDGET_MS`. Ceux de la plateforme : rattrapage
des liens (vies, « lien en danger ») et relances, reports du matin, défi du jour à l'heure choisie, reçus Expo (jetons
morts), ménage.

```bash
curl -fsS -X POST -H "x-tick-secret: $INTERNAL_TICK_SECRET" https://api.blowy.app/internal/tick
```

Appeler toutes les 5 minutes, depuis un planificateur gratuit :

- **Railway** : un second service « cron » (même dépôt, image `curlimages/curl` ou Nixpacks) avec *Cron Schedule*
  `*/5 * * * *` et la commande ci-dessus (variable `INTERNAL_TICK_SECRET` partagée). Le service s'arrête après l'appel.
- **Supabase** (`pg_cron` + `pg_net`, sans service en plus) :

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
select vault.create_secret('<INTERNAL_TICK_SECRET>', 'tick_secret');
select cron.schedule(
  'blowy-tick',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://api.blowy.app/internal/tick',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-tick-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'tick_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Tick manqué** : rien n'est perdu, tout est rattrapé au suivant. Les vies sont de toute façon recalculées à la
lecture (`tickLink`) ; les reports, défis du matin et relances sont sélectionnés par « échéance dépassée »
(`send_after <= now`, `next_morning_at <= now`, silence ≥ 72 h), donc ils partent en retard, une seule fois. Garde-fous :
un report de plus de 24 h est abandonné, et un défi du matin qui tomberait pendant les heures calmes (panne longue)
est abandonné plutôt qu'envoyé la nuit. Un tick répété dans la même minute ne refait rien (`ran: false`).

## Minimoa+ et administration (chantier « facturation-admin »)

Mise en place côté App Store : `docs/BLOWY-PLUS.md`. Appli web d'administration : `apps/admin/README.md`.

### Variables

| Variable | Rôle |
|---|---|
| `ADMIN_EMAILS` | Adresses autorisées sur `/admin/*`, séparées par des virgules (casse ignorée). Vide = personne. En démo locale (mémoire + `BLOWY_DEMO=1`) sans liste : `admin@blowy.local`. |
| `APPLE_BUNDLE_ID` | Bundle iOS (défaut `app.blowy`), vérifié dans chaque transaction et notification. |
| `APPLE_APP_APPLE_ID` | Apple ID numérique de l'app (App Store Connect → Informations sur l'app). **Requis en production** : vérifié sur les notifications de production. |
| `APPLE_ACCEPT_SANDBOX` | `1` (défaut) : accepte les achats du bac à sable (TestFlight). `0` : les refuse. |
| `PLUS_PRODUCT_YEARLY`, `PLUS_PRODUCT_MONTHLY` | Identifiants produit (défauts `app.blowy.plus.yearly`, `app.blowy.plus.monthly`). |

Aucune clé secrète : les achats se vérifient avec le certificat public d'Apple, embarqué dans le code.

### Routes

| Route | Qui | Rôle |
|---|---|---|
| `GET /v1/plus/paywall` | l'app | offres (produits, montants facturés de repli, périodes), essai et frise, avantages (`entitlements`), nombre réel de personnes compatibles autour (0 = cacher le bloc), mentions et liens légaux, état de l'abonnement |
| `GET /v1/plus/subscription` | l'app | état : `none`, `trial` (jusqu'au…), `active`, `grace`, `billing_retry`, `expired`, `refunded`, `revoked` ; se renouvelle ou non ; lien « Gérer » |
| `POST /v1/plus/purchases` | l'app | après un achat ou « Restaurer » : `Transaction.jwsRepresentation` (+ `renewalInfo` signé si disponible) |
| `POST /v1/plus/apple/notifications` | Apple | App Store Server Notifications V2 (publique, authentifiée par la signature, idempotente) |
| `/admin/*` | l'équipe | voir `packages/contract/src/v7/admin.ts` ; lecture seule sauf `POST /admin/moderation/actions` |

### Vérification des achats (`src/modules/billing`)

- Port `Billing` (`ports.ts`) : `AppleBilling` (réel, `infrastructure/apple/app-store-verifier.ts`), `MemoryBilling` (tests et local, « JWS » non signés `memory.<base64url>`), `GooglePlayBilling` (emplacement réservé, refuse tout).
- `AppleBilling` vérifie localement chaque JWS comme la bibliothèque officielle d'Apple : `alg` ES256, chaîne `x5c` de 3 certificats, intermédiaire signé par **Apple Root CA - G3** (embarquée, empreinte SHA-256 `63:34:3A:…:91:79`) et portant l'extension 1.2.840.113635.100.6.2.1, feuille portant 1.2.840.113635.100.6.11.1, validité à la date de signature, signature ES256, puis bundle, Apple ID (production) et environnement. Pas de vérification OCSP en ligne (optionnelle chez Apple).
- Les événements sont ramenés à un `StoreEvent` du domaine ; l'état est calculé par `applyStoreEvent` (`packages/domain/src/billing.ts`, testé) et `profiles.plus_until` par `plusUntilOf` (accès gardé pendant l'essai, la période payée et le délai de grâce ; coupé à la date d'un remboursement ou d'un retrait du partage familial).
- Rattachement : `appAccountToken` (l'app doit passer `Me.id` à l'achat), sinon l'abonnement déjà connu, sinon la personne qui envoie la transaction. Une restauration depuis un autre compte Minimoa déplace l'abonnement.
- Idempotence : table `store_notifications` (clé `notificationUUID`) ; une notification déjà traitée rend `duplicate` (200). Signature refusée : 400. Erreur technique : 500, Apple renvoie (5 fois, à 1, 12, 24, 48 et 72 h).
- Tâche `BillingJobs` (minuteur) : rappel de fin d'essai à partir du jour 5 (`Notifier.notify(userId, 'trial_reminder', { endsOn, price })`), entre 10 h et 20 h (Paris) sauf dans les 12 dernières heures, une seule fois par essai ; pas de rappel si l'essai est annulé. Purge des notifications de plus de 30 jours (journal technique, politique de confidentialité).
- Non implémenté (et pas nécessaire pour démarrer) : appels à l'App Store Server API (Get All Subscription Statuses, Get Notification History) pour rattraper des notifications manquées après une panne longue ; ils demanderont une clé d'API In-App Purchase (`.p8`).

Pages Apple consultées (15 novembre 2026) :
- [notificationType](https://developer.apple.com/documentation/appstoreservernotifications/notificationtype) : types et sous-types par événement (essai, renouvellement, annulation, délai de grâce, nouvelle tentative, expiration, remboursement, retrait).
- [responseBodyV2DecodedPayload](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload) et [data](https://developer.apple.com/documentation/appstoreservernotifications/data) : enveloppe de la notification (`notificationUUID`, `signedDate`, `data.signedTransactionInfo`, `data.signedRenewalInfo`, `data.status`).
- [Transaction data types](https://developer.apple.com/documentation/appstoreservernotifications/transaction-data-types) et [Data types de l'App Store Server API](https://developer.apple.com/documentation/appstoreserverapi/data-types) : champs de `JWSTransactionDecodedPayload` et `JWSRenewalInfoDecodedPayload` (`offerType`, `offerDiscountType`, `expiresDate`, `revocationDate`, `appAccountToken`, `gracePeriodExpiresDate`, `isInBillingRetryPeriod`, `autoRenewStatus`).
- [JWSDecodedHeader](https://developer.apple.com/documentation/appstoreservernotifications/jwsdecodedheader) : chaîne `x5c` et extension de l'intermédiaire.
- [Responding to App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications) : codes de réponse et calendrier des renvois.
- [Apple PKI](https://www.apple.com/certificateauthority/) : Apple Root CA - G3.
- Bibliothèque officielle [app-store-server-library-python](https://apple.github.io/app-store-server-library-python/) : valeurs de `offerType` (1 à 4), `Status` (1 actif, 2 expiré, 3 nouvelle tentative, 4 délai de grâce, 5 révoqué), `OfferDiscountType`, et l'algorithme de `SignedDataVerifier` reproduit ici.

Tests : `test/apple-billing.e2e.test.ts` (adaptateur réel contre des charges conformes à la documentation, signées par une chaîne de test générée avec openssl dans `test/fixtures/apple` ; la route des notifications avec cet adaptateur) et `test/billing.e2e.test.ts` (parcours complet en mémoire). Aucune vraie transaction Apple n'a été vérifiée faute de clés et de compte de test.

### Administration et modération (`src/modules/admin`)

- `AdminGuard` : chaque route `/admin/*` exige un jeton valide (garde globale, 401 sinon) **et** une adresse de `ADMIN_EMAILS` (403 sinon).
- Suspension : la garde d'authentification appelle `AccountGate` après chaque jeton ; un compte suspendu reçoit `403 suspended` avec un message clair (jusqu'à quand, qui contacter), sauf `DELETE /v1/me` (il peut toujours supprimer son compte). Cache de 30 s par instance, vidé localement à chaque action.
- Supprimer réutilise `DeleteMe` (le même chemin que « Supprimer mon compte ») ; le journal (`admin_audit_log`) est écrit avant et garde le prénom.
- Contexte d'un signalement : seulement le message signalé (`messageId`, nouveau champ facultatif de `POST /v1/reports`) et deux messages avant et après, dans le lien du signalement. Jamais « qui quelqu'un veut rencontrer ».
- Chiffres : `AdminStatsJobs` (minuteur) calcule chaque jour terminé une seule fois (fonction SQL `admin_daily_metrics`, une requête par jour) et le range dans `admin_daily_stats` ; les écrans lisent au plus 60 lignes. Les jours d'activité (`user_activity_days`, une écriture par personne et par jour, gardés 40 jours) donnent actifs et rétention.
- Apports des autres chantiers : port `ADMIN_INSIGHTS` = `LiveAdminInsights` (`application/live-insights.ts`), lu une fois par jour terminé par `AdminStatsJobs` : rencontres proposées et compatibilité moyenne (table `encounter_proposals`, une ligne par personne et par jour, écrite par `ListEncounters` quand le nombre montré augmente ; total par la fonction SQL `encounter_proposals_summary`) ; série moyenne, formes et répartition des visions sur un échantillon de 5 000 comptes actifs du jour au plus (`user_activity_days`, lus par paquets de 1 000) ; forme et série des 100 du classement. Coûts IA lus dans `AiUsage` (« plateforme »).
- Supprimer (`action: 'delete'`) = **exclusion définitive** par défaut (`ban: false` pour une simple suppression) : voir « Conservation des données ».

## Intégration V7 : qui est « utilisable », un seul défi du jour, conservation, activités en direct

### Qui est montré à qui (`modules/safety/application/audience.ts`)
`Audience` est le seul endroit qui décide : supprimé (profil absent), **suspendu** (modération), bloqué dans un sens ou
dans l'autre, mode discret (carte seulement). Utilisé par les rencontres (suggestions, coucous reçus, amis communs),
le coucou, la création d'un lien (invitation, rencontre acceptée), la carte, le compteur du paywall, les pages
publiques (invitation, « 3 mots »), et le notifieur (aucun push vers un compte suspendu). Les caches (suggestions du
jour, carte) ne gardent que la compatibilité : la règle est relue à chaque requête. Sans test de vision, une personne
n'est ni proposée ni ne reçoit de suggestion (`Me.visionTestDone` le dit à l'app).

### Défi du jour : un seul système
L'ancien défi V6 (`POST /v1/pet/challenge`, `PetView.challenge`) n'existe plus : le défi du jour est celui des rituels
(`/v1/rituals/today`). Son push (`daily_challenge`) n'a qu'un chemin : `NotificationJobs` l'envoie à l'heure choisie
(fuseau de la personne) ; le texte et la décision (personne vue ces 14 derniers jours, défi pas encore fait) viennent
des rituels par le port `DAILY_PUSH_SOURCE` (`RitualsDailyPush`).

### Conservation des données (`modules/retention`, politique de confidentialité)
`RetentionJobs` (minuteur) : comptes sans connexion depuis 2 ans moins 30 jours → e-mail de prévenance ; 2 ans, et
prévenus depuis 30 jours → supprimés par `DeleteMe` ; exclusions de plus de 3 ans, signalements clos et journal de
modération de plus d'un an, rencontres proposées de plus de 30 jours → effacés. `profiles.last_active_on` est écrit par
la garde de compte au plus une fois par jour (une connexion efface la prévenance). Exclusion définitive (`Bans`) :
l'empreinte SHA-256 de chaque identifiant de connexion (Apple, Google ; l'e-mail en local) est gardée 3 ans dans
`banned_identities` ; l'inscription la vérifie avant de créer quoi que ce soit (`forbidden`). Journaux techniques :
30 jours au plus (`notification_log` 3 j, `push_receipts` 1 j, `tick_runs` 2 j, `store_notifications` 30 j).

### Activités en direct iOS (`integrations/push/*live-activit*`, `modules/notifications/live-activities.ts`)
Jetons APNs rangés à part (`live_activity_tokens`, jamais envoyés à Expo) : `POST /v1/devices` avec
`kind: 'apns_live_activity'` et `liveActivity: { use: 'start' | 'update', activity, activityId, linkId? }`. Un jeton
`update` remplace le précédent de la même activité ; il est oublié quand l'activité se termine ; un jeton refusé par APNs
(410, `BadDeviceToken`, `DeviceTokenNotForTopic`) est désactivé. Événements : la **série d'un lien** démarre par push avec le
rappel du soir `your_turn` (« Série avec Léa », alerte obligatoire, `input-push-token: 1` ; pas de seconde notification
iOS), se termine quand la personne écrit dans ce lien ou à minuit ; le **défi du jour** n'est jamais démarré par push (l'app le démarre quand il est accepté) :
`update` sur « série en danger », `end` quand il est relevé ou à minuit. Adaptateur APNs : HTTP/2, JWT ES256 refait
toutes les 40 min, `apns-push-type: liveactivity`, `apns-topic: <APPLE_BUNDLE_ID>.push-type.liveactivity`, priorité 10
pour démarrer, terminer ou une série en danger, 5 pour une fin de journée. Sans clé : aucun envoi ; en mémoire : boîte
d'envoi (`MemoryLiveActivities`).

| Variable | Rôle |
|---|---|
| `APNS_KEY_P8` | contenu de la clé `.p8` (PEM ; `\n` littéraux acceptés) — secret |
| `APNS_KEY_ID` | identifiant de la clé (10 caractères) |
| `APNS_TEAM_ID` | Team ID (10 caractères) |
| `APNS_ENVIRONMENT` | `production` (défaut : TestFlight et App Store) ou `sandbox` (builds de développement) |

Les trois premières vont ensemble (l'API refuse de démarrer avec une partie seulement). Une fois déployé avec la clé,
l'app peut activer `EXPO_PUBLIC_LIVE_ACTIVITY_PUSH=1` (profils de `apps/mobile/eas.json`).

### Vérification du schéma (`scripts/check-schema.mjs`)
À relancer après chaque migration, sur un PostgreSQL **local** (refuse un hôte distant) :

```bash
PGHOST=/chemin/du/socket PGPORT=5432 PGUSER=postgres pnpm --filter @blowy/api check:schema
```

Il recrée une base jetable (`SCHEMA_CHECK_DB`, défaut `blowy_schema_check`), y installe un socle qui imite Supabase
(rôles, `auth.uid()`, publication `supabase_realtime`, privilèges par défaut), applique toutes les migrations dans
l'ordre (une transaction par fichier), puis vérifie : chaque table et colonne contre `database.types.ts` (type, null,
facultative à l'insertion), les fonctions et leurs arguments, la RLS sur chaque table, les seules politiques permises
(lecture des liens et des messages par leurs membres), le temps réel limité à `links` et `messages`, aucune fonction
exécutable par `anon` ou `authenticated`, et un essai réel de la politique des messages (garde-fou visible par une seule
personne).
