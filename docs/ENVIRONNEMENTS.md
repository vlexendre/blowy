# Environnements : production et dev

Deux environnements, une seule base de code. La branche `main` est la production ; la branche `dev` est le dev. Le code
arrive en production en fusionnant `dev` dans `main`.

## Tableau

| | Production | Dev |
|---|---|---|
| Branche Git | `main` | `dev` |
| Site | https://minimoa.app (et www) | https://dev.minimoa.app (jamais indexé) |
| API | https://api.minimoa.app | https://api-dev.minimoa.app (`X-Robots-Tag: noindex, nofollow` sur chaque réponse) |
| Administration | https://admin.minimoa.app | https://admin-dev.minimoa.app (jamais indexée) |
| Supabase | projet `sqxebllmatfflopqddaw` | projet de dev, à part (sa référence : `<ref-dev>`) |
| Railway | environnement `production`, service de l'API, branche `main` | environnement `dev`, même service, branche `dev` |
| Cloudflare Pages, site | projet `minimoa`, déploiement de production (`main`) | projet `minimoa`, prévisualisation de la branche `dev` (alias `dev.minimoa.pages.dev`) |
| Cloudflare Pages, admin | projet `minimoa-admin`, production (`main`) | projet `minimoa-admin`, prévisualisation de `dev` (alias `dev.minimoa-admin.pages.dev`) |
| App iOS | « Minimoa », `app.blowy`, profil EAS `production` (App Store, TestFlight) | « Minimoa Dev », `app.blowy.dev`, profil EAS `dev` (TestFlight interne) |
| `GET /health` | `{"ok":true,"env":"production"}` | `{"ok":true,"env":"staging"}` |

## Variables par environnement (noms seulement)

Les valeurs secrètes ne vont que dans les tableaux de bord (Railway, Cloudflare, EAS), jamais dans le dépôt.

**API (Railway)**

| Variable | Production | Dev |
|---|---|---|
| `BLOWY_ENV` | (rien : l'image vaut `production`) | `staging` |
| `BLOWY_ADAPTERS` | (rien : l'image vaut `supabase`) | (rien, ou `supabase`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | projet de production | projet de dev |
| `API_URL`, `WEB_URL`, `ADMIN_URL` | adresses de production | adresses du dev (`WEB_URL` obligatoire : son défaut est la production) |
| `CORS_ORIGINS` | site et admin de production | `https://dev.minimoa.app,https://admin-dev.minimoa.app` |
| `RESEND_API_KEY`, `MAIL_FROM` | | même clé possible |
| `MAIL_ALLOWLIST` | (ignorée) | adresses et `@domaines` de l'équipe |
| `ADMIN_EMAILS` | | l'équipe |
| `INTERNAL_TICK_SECRET` | | **un autre secret** |
| `APPLE_BUNDLE_ID` | (défaut `app.blowy`) | `app.blowy.dev` |
| `APPLE_APP_APPLE_ID` | requis | facultatif (Apple ID de « Minimoa Dev ») |
| `APPLE_ACCEPT_SANDBOX` | | (défaut `1` ; `0` refusé en staging) |
| `PLUS_PRODUCT_YEARLY`, `PLUS_PRODUCT_MONTHLY`, `PLUS_PRODUCT_WEEKLY` | (défauts `app.blowy.plus.*`) | identifiants des produits de « Minimoa Dev » |
| `REVENUECAT_APPLE_NOTIFICATIONS_URL` | facultatif | **jamais** (refusée en staging) |
| `PUSH_PROVIDER`, `EXPO_ACCESS_TOKEN` | | `off` pour commencer (puis `expo`) |
| `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_ENVIRONMENT` | | rien (activités en direct coupées) |
| `ANTHROPIC_API_KEY`, `AI_PROVIDER`, `AI_DAILY_CEILING_USD`… | | `AI_PROVIDER=off`, ou une clé et un plafond bas |
| `APPLE_SIGNIN_KEY_P8`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_TEAM_ID`, `APPLE_SIGNIN_CLIENT_ID` | | rien (révocation coupée) |
| `REVIEW_EMAIL`, `REVIEW_CODE` | | facultatifs (code de 10 caractères au moins) |

En `staging`, l'API refuse de démarrer si une variable désigne la production (projet `sqxebllmatfflopqddaw`, adresses
minimoa.app, www, api, admin), si `REVENUECAT_APPLE_NOTIFICATIONS_URL` est posée ou si `REVIEW_CODE` est court. Elle
n'accepte que les achats du bac à sable d'Apple. Un environnement Railway **dupliqué** depuis la production copie ses
variables : l'API de dev s'arrête alors au démarrage tant qu'elles n'ont pas été remplacées, c'est voulu.

`BLOWY_ENV` : le Dockerfile pose `ENV BLOWY_ENV=production`, mais les variables du service Railway sont données au
conteneur au démarrage et l'emportent sur les `ENV` de l'image (comme `docker run -e`). Contrôle : `GET /health`.

**Site (Cloudflare Pages `minimoa`)**

| Variable | Production | Preview (branche `dev`) |
|---|---|---|
| `PUBLIC_SITE_ENV` | **absente** | `dev` |
| `PUBLIC_API_URL` | `https://api.minimoa.app` | `https://api-dev.minimoa.app` |
| `PUBLIC_APP_STORE_URL`, `PUBLIC_PLAY_STORE_URL` | fiches des stores | les mêmes |
| `APPLE_TEAM_ID` | identifiant d'équipe | le même |
| `BLOWY_BUNDLE_ID` | (défaut `app.blowy`) | `app.blowy.dev` (liens universels de dev.minimoa.app vers « Minimoa Dev ») |
| `NODE_VERSION` | `22` | `22` |

**Admin (Cloudflare Pages `minimoa-admin`)**

| Variable | Production | Preview (branche `dev`) |
|---|---|---|
| `VITE_APP_ENV` | **absente** | `dev` |
| `VITE_API_URL` | `https://api.minimoa.app` | `https://api-dev.minimoa.app` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | projet de production | projet de dev (clé publiable) |
| `NODE_VERSION`, `PNPM_VERSION` | `22`, `10.28.0` | les mêmes |

La CSP de l'admin (`_headers`) est fabriquée au build depuis `VITE_API_URL` et `VITE_SUPABASE_URL`.

**App (EAS, `apps/mobile/eas.json`)** : profil `dev` : `BLOWY_APP_ENV=dev`, `BLOWY_WIDGETS=off`,
`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (projet de dev ;
les valeurs `REMPLACER-…` arrêtent un build tant qu'elles ne sont pas remplies), `EXPO_PUBLIC_AUTH=supabase`,
`BLOWY_APS_ENVIRONMENT=production`.

## Le cycle

1. Travailler sur une branche (ou un worktree), comme aujourd'hui.
2. Fusionner dans `dev` et pousser : Railway (environnement `dev`) redéploie l'API ; Cloudflare Pages construit le site
   et l'admin de la branche `dev` ; au besoin, `eas build --profile dev --platform ios` puis TestFlight interne.
3. Tester sur dev.minimoa.app, admin-dev.minimoa.app et « Minimoa Dev ».
4. Fusionner `dev` dans `main` et pousser : la production se déploie.

Rien ne se fait à la main sur la production qui n'ait été fait d'abord sur le dev.

## Migrations

Toujours **le dev d'abord**, puis la production, avec les mêmes fichiers (`supabase/migrations/`) et dans le même ordre
(les migrations avant le code, docs/DEPLOIEMENT-V7.md) :

1. `supabase link --project-ref <ref-dev>` puis `supabase db push` (ou les fichiers dans l'ordre dans l'éditeur SQL du
   projet de dev) ; pousser le code sur `dev` ; vérifier.
2. Fusion dans `main` : `supabase link --project-ref sqxebllmatfflopqddaw`, `supabase db push`, puis pousser `main`.

Le projet de dev se crée en appliquant **toutes** les migrations sur une base vide. Il faut aussi y refaire ce qui ne
vit pas dans les migrations : fournisseur Apple (Authentication › Providers › Apple, « Client IDs » : `app.blowy.dev`),
envoi des e-mails d'authentification (SMTP Resend, ou celui de Supabase, limité) et le minuteur (`POST /internal/tick`
toutes les 5 minutes avec le secret du dev, cron Railway de l'environnement `dev` ou `pg_cron` du projet de dev).

## Semer le dev

Le dev peut être rempli de comptes de test réalistes : `docs/SEED-TEST.md` (« Semer l'environnement de dev »), avec
`BLOWY_ENV=staging` et les clés du projet **de dev**. Les garde-fous du semis acceptent les adresses du dev
(dev, api-dev, admin-dev.minimoa.app) et refusent toujours la production.

## Règle : jamais de semis en production

La production ne reçoit **jamais** de données de semis, ni de faux comptes d'aucune sorte : des comptes inventés
présentés comme de vraies personnes tromperaient les gens et enfreindraient les règles de l'App Store. Le script refuse
la production (projet `sqxebllmatfflopqddaw`, adresses minimoa.app, www, api, admin, `BLOWY_ENV=production`, base qui
contient de vrais comptes) et n'a pas d'option pour passer outre. Ne pas chercher à le contourner.

## Ce que le dev ne fait pas comme la production

- Site : `noindex,nofollow` sur chaque page, `X-Robots-Tag: noindex, nofollow`, `robots.txt` en `Disallow: /`, pas de
  plan du site, bandeau « DEV ». Canonique, hreflang, JSON-LD et og:url restent sur https://minimoa.app : le dev
  n'est jamais présenté comme l'adresse de référence d'une page. Les liens fabriqués pour être partagés (quiz, quartier)
  et les boutons « Ouvrir l'app » (`minimoa-dev://`) restent dans le dev.
- Admin : bandeau « DEV », titre « DEV · … ».
- API : `X-Robots-Tag: noindex, nofollow` sur chaque réponse ; e-mails seulement vers `MAIL_ALLOWLIST` (les autres sont journalisés, domaine seulement, puis écartés) ; achats du
  bac à sable seulement ; pas de relais RevenueCat.
- App « Minimoa Dev » : identifiant `app.blowy.dev`, icône marquée « DEV », schéma `minimoa-dev`, liens universels
  sur dev.minimoa.app seulement, sans widgets (un seul identifiant à créer chez Apple). Elle s'installe à côté de
  l'app publiée. Les achats intégrés n'existent que si des produits sont créés dans sa fiche App Store Connect, sous
  d'autres identifiants que ceux de la production (`PLUS_PRODUCT_*` de l'API de dev).

## Mise en place (une fois, par le propriétaire)

**Apple Developer** (Certificates, Identifiers & Profiles)
1. Identifiers › + › App IDs › App : « Minimoa Dev », Bundle ID explicite `app.blowy.dev` ; capacités : Sign in with
   Apple (« Enable as a primary App ID »), Push Notifications, Associated Domains. (EAS peut aussi les activer au premier
   build ; sans widgets, aucun groupe d'apps ni `app.blowy.dev.widget` à créer.)
2. Rien d'autre : `eas build --profile dev` crée le profil d'approvisionnement App Store et, si on accepte, la clé push.

**App Store Connect**
1. Apps › + › Nouvelle app : iOS, nom « Minimoa Dev » (nom unique sur l'App Store ; sinon « Minimoa (dev) »…), langue
   principale français, Bundle ID `app.blowy.dev`, SKU `minimoa-dev`. Elle ne sera **jamais soumise** à la revue.
2. Noter son Apple ID (Informations de l'app) : `submit.dev.ios.ascAppId` d'`apps/mobile/eas.json` et, si voulu,
   `APPLE_APP_APPLE_ID` de l'API de dev.
3. TestFlight › Tests internes : un groupe avec l'équipe (pas de revue Apple pour les testeurs internes).
4. Achats (facultatif) : abonnements dans un groupe, sous d'autres identifiants que la production (ex.
   `app.blowy.dev.plus.yearly`, `.monthly`, `.weekly` : un identifiant de produit ne sert qu'une fois par compte), puis
   les mêmes dans `PLUS_PRODUCT_*` de l'API de dev. « App Store Server Notifications » : URL de l'API de dev
   `https://api-dev.minimoa.app/v1/plus/apple/notifications` (champ « Sandbox » ; laisser « Production » vide), docs/BLOWY-PLUS.md.

**EAS** : remplir `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_KEY` (clé publiable du projet de dev) dans
`build.dev.env` d'`apps/mobile/eas.json`, puis `eas build --profile dev --platform ios` et
`eas submit --profile dev --platform ios`.

**Cloudflare**
1. Projet `minimoa` › Settings › Builds › Branch control : production `main` ; prévisualisations : « Custom branches »,
   inclure `dev` seulement (les variables Preview servent à toutes les branches prévisualisées).
2. Variables › Preview : celles du tableau « Site » ci-dessus. Production : ne rien ajouter.
3. Pousser une première fois `dev`, puis Custom domains › `dev.minimoa.app` ; dans le DNS de `minimoa.app`, changer la
   cible du CNAME `dev` de `minimoa.pages.dev` en `dev.minimoa.pages.dev` (enregistrement proxifié, sinon c'est la
   production qui répond).
4. Même chose pour `minimoa-admin` : branche `dev`, variables Preview du tableau « Admin », domaine `admin-dev.minimoa.app`,
   CNAME `admin-dev` → `dev.minimoa-admin.pages.dev`. Conseillé : Cloudflare Access devant `admin-dev` comme devant `admin`.

**Railway** : Project › Environments › New environment `dev` (vide, plutôt qu'une copie de la production) ; service de
l'API relié au même dépôt, branche `dev` ; variables du tableau « API » ; domaine personnalisé `api-dev.minimoa.app`
(CNAME donné par Railway). Puis vérifier `curl https://api-dev.minimoa.app/health` → `{"ok":true,"env":"staging"}`.
Minuteur : un service cron dans l'environnement `dev` avec le secret du dev.
