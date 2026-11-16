# Livraison du 15 novembre 2026 : de la production d'aujourd'hui à la version soumise

Pour le coordinateur. Rassemble `docs/DEPLOIEMENT-V7.md` §9 et §10 (plus de photo du jour ; audit App Store côté
serveur et côté app) et les notes des trois chantiers, dans un seul ordre à suivre. Rien ici n'est automatique ;
rien n'a été appliqué à une vraie base ni à Railway.

## 0. Où on part, où on arrive

- **Production aujourd'hui** : base au niveau de `20261115180000_gaps.sql` (les neuf premières migrations), API
  déployée depuis `main` (commit `9f3a855`). **Railway redéploie l'API à chaque poussée sur `main`.**
- **À livrer** : la branche `wip/soins-garde-robe` (code de l'API, de l'app, de l'administration et du site) et
  **cinq migrations**, dans cet ordre d'horodatage :

| # | Fichier | Ce qu'il fait | Verrou |
|---|---|---|---|
| 1 | `20261115190000_no_daily_photo.sql` | `links` : six colonnes (série par la conversation, étapes, rappel « à toi d'écrire ») ; contrainte `live_activity_tokens.activity` élargie à `link` ; réglage `daily_photo` recopié en `your_turn` ; `admin_daily_metrics` renommée en `_base` et remplacée par une enveloppe qui ajoute `linksWroteTogether` (même nom, même signature) | catalogue seulement, `lock_timeout` 5 s |
| 2 | `20261115190100_no_daily_photo_backfill.sql` | valide les contraintes `not valid` de 1 ; reprend séries, jours à deux, `recent_days` (14 jours) et étapes depuis les messages et les photos du jour | verrous de ligne sur `links` |
| 3 | `20261115200000_audit.sql` | `profiles.review_world`, `avatar_checked_at` ; `profile_places.source`, `manual_label`, `manual_set_on` ; `reports.source`, `priority`, `category`, `review`, `alerted_at`, `escalated_at` ; trois index partiels sur ces colonnes neuves ; `admin_daily_metrics_base` et `admin_daily_metrics` remplacées pour exclure le monde de revue | catalogue + index sur colonnes vides |
| 4 | `20261115200100_audit_backfill.sql` | arrondit à ~300 m les positions déjà gardées ; marque « déjà vus » les signalements de plus de 10 minutes | verrous de ligne |
| 5 | `20261115210000_audit_app.sql` | `profiles.ai_proofs_consent`, `ai_proofs_consent_at` (nullables) | catalogue seulement |

Aucune autre migration : la passe de clôture n'en a pas ajouté.

**Fonction de statistiques finale** (vérifié, point 6 de la demande) : après 3, `admin_daily_metrics(date)` =
`admin_daily_metrics_base(date)` (chiffres de `20261115160000`, **sans le monde de revue**) `||`
`linksWroteTogether` (liens où les deux ont écrit ce jour-là, **sans les liens du monde de revue**). Les deux
changements y sont. L'administration lit `wroteTogether` (entonnoir) et les clés du socle (vue d'ensemble) : toutes
existent (`apps/admin` compile contre `@blowy/contract`, et la répétition ci-dessous liste les 26 clés rendues).

## 1. Pourquoi les migrations passent AVANT le code (et sans arrêter l'API de `main`)

Le nouveau code lit et écrit des colonnes que seules ces migrations créent (`links.recent_days`, `best_streak`…,
`profiles.review_world`, `profile_places.source`, `reports.priority`, `profiles.ai_proofs_consent`) : déployé avant,
chaque lecture d'un lien ou d'un profil échouerait. À l'inverse, l'API de `main` supporte chaque migration — vérifié en
lisant ce qu'elle lit et écrit (`git show origin/main:…`) :

- **Lectures** : `select('*')` puis correspondance champ par champ (`supabase-links.repository.ts`,
  `supabase-vision.repositories.ts`, profils, signalements) : une colonne en plus est ignorée. La statistique passe par
  `rpc('admin_daily_metrics')`, qui garde nom et signature ; une clé en plus (`linksWroteTogether`) est ignorée.
- **Écritures** : `insert` sans les colonnes neuves → valeurs par défaut constantes (`source = 'gps'` / `'person'`,
  `priority = 0`, `review = false`, `recent_days = '[]'`…) ou `null` ; `update(stateRow(link))` et
  `upsert(placeToRow(place))` ne touchent que leurs propres colonnes. Les contraintes neuves acceptent tout ce que
  l'API de `main` écrit (`activity = 'photo'` reste permis ; `source` et `priority` ont leur défaut).
- **Seuls effets visibles pendant la fenêtre migrations → code** (minutes) : (a) les positions écrites par l'API de
  `main` sont exactes (rattrapage 1 ci-dessous) ; (b) `recent_days` n'est pas tenu (rattrapage 2) ; (c) une personne
  qui avait coupé « photo du jour » et qui modifie ses notifications dans cette fenêtre perd la coupure recopiée en
  `your_turn` (l'API de `main` filtre les types qu'elle ne connaît pas) — effet mineur, sans erreur.
- **Répétition locale** (PostgreSQL 16, base à l'état de `20261115180000` avec quelques lignes de chaque table
  touchée : profils, minimoas, liens, messages, photos du jour, positions exactes, signalements, réglages, jetons
  d'activité, abonnement, jours d'activité) : l'index concurrent puis les cinq fichiers, chacun dans sa transaction
  (`psql -1`), dans l'ordre : 0,03 à 0,05 s chacun, sans erreur ; ensuite, les écritures de l'API de `main` (profil,
  minimoa, lien avec `last_duo_photo_on`, photo du jour, message, signalement, jeton `photo`, position exacte en
  `upsert`, réglages `daily_photo`) passent toutes ; la statistique ne bouge pas quand on ajoute un monde de revue ;
  les rattrapages 1 et 2 tournent deux fois de suite, la deuxième sans effet. Scripts : `/home/claude/work/close/tools/prodcheck.sh`,
  `sql/seed180.sql`, `sql/post.sql`, `sql/catchup.sql`. Les mesures sur grosses bases (30 000 liens, 600 000 messages ;
  300 000 profils) sont dans `docs/DEPLOIEMENT-V7.md` §9 et §10.

## 2. Ordre exact, le jour J

**Avant** (la veille ou le matin)
1. Supabase › Database › Backups : vérifier la sauvegarde du jour (point de retour).
2. Chaîne de connexion **directe** (pas le pooler en mode transaction) pour `psql`.
3. Railway › service de l'API › Variables : ajouter (voir §3). Si Railway redéploie `main` au changement de
   variables, c'est sans effet : l'API de `main` ignore ces variables.
4. Préparer le build de l'app (EAS, profil `production`) depuis la branche : il sera publié dans TestFlight juste
   après le déploiement de l'API (l'ancienne app perd ses écrans de photo du jour, 404).

**Étape A — hors transaction, sans bloquer les écritures** (`psql`, connexion directe) :

```sql
create index concurrently if not exists links_write_reminder_idx on public.links (last_active_on, id) where status = 'active';
select indexrelid::regclass from pg_index where not indisvalid;  -- doit être vide ; sinon drop index et recommencer
```

**Étape B — les cinq migrations, dans l'ordre, une transaction chacune** (`supabase db push`, ou chaque fichier dans
l'ordre depuis le tableau de bord) : `20261115190000`, `20261115190100`, `20261115200000`, `20261115200100`,
`20261115210000`. Chacune a `lock_timeout = 5s` : si un verrou n'arrive pas, elle échoue sans rien appliquer ; la
relancer. Contrôle : `select max(version) from supabase_migrations.schema_migrations;` → `20261115210000`.

**Étape C — le code** : fusionner la branche dans `main` et pousser. Railway déploie l'API ; attendre le healthcheck
`/health` vert. Puis, dans la foulée :
- site (`apps/web`, Cloudflare Pages) : build et publication (pages légales du 15 novembre, voir §5) ;
- administration (`pnpm build:admin`) : republier ;
- app : publier le build EAS dans TestFlight.

**Étape D — juste après le déploiement de l'API : les deux rattrapages** (rejouables, sans effet la deuxième fois ;
à lancer dans les minutes qui suivent, avant minuit heure de Paris pour le rattrapage 2) :

1. Positions écrites exactes par l'API de `main` entre l'étape B et l'étape C (partie 1 de
   `20261115200100_audit_backfill.sql`) :

```sql
with grid as (
  select user_id, (floor(last_lat / (300 / 111320.0)) + 0.5) * (300 / 111320.0) as lat from public.profile_places
),
snapped as (
  select g.user_id, round(g.lat::numeric, 6)::double precision as lat,
         round(((floor(p.last_lng / (300 / (111320.0 * greatest(0.01, cos(radians(g.lat)))))) + 0.5)
                * (300 / (111320.0 * greatest(0.01, cos(radians(g.lat))))))::numeric, 6)::double precision as lng
  from grid g join public.profile_places p on p.user_id = g.user_id
)
update public.profile_places p set last_lat = s.lat, last_lng = s.lng
from snapped s where s.user_id = p.user_id and (p.last_lat <> s.lat or p.last_lng <> s.lng);
```

2. « Reprise du jour » des séries de liens (qui a écrit aujourd'hui entre l'étape B et l'étape C, et la série qui
   avance si les deux ont écrit) : le bloc SQL complet de `docs/DEPLOIEMENT-V7.md` §9, étape 4 (trois requêtes, à
   coller telles quelles).

**Étape E — contrôles** (§4).

**Plus tard, une fois l'ancienne app sortie de TestFlight** : retirer `photo` de
`live_activity_tokens_activity_check`, `daily_photo` des `notification_settings.disabled_kinds`, la colonne
`links.last_duo_photo_on` (nouvelle migration à écrire). La table `daily_photos` et ses fichiers restent : ce sont des
souvenirs, effacés avec le lien ou le compte.

## 3. Variables de l'API (Railway)

Aucune variable nouvelle n'est **requise pour démarrer**. Ce qui fait refuser le démarrage, à connaître :

| Règle (refus au démarrage) | Origine |
|---|---|
| `REVIEW_EMAIL` et `REVIEW_CODE` vont ensemble ; en production `REVIEW_CODE` fait 10 caractères au moins | `audit.env.ts` |
| `APPLE_APP_APPLE_ID` obligatoire en production (déjà posée) | `facturation-admin.env.ts` |
| `APPLE_SIGNIN_KEY_P8`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_TEAM_ID` vont ensemble | `apple-signin.env.ts` |
| `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID` vont ensemble ; `AI_PROVIDER=anthropic` demande `ANTHROPIC_API_KEY` | `plateforme.env.ts` |

À ajouter ou vérifier pour cette livraison :

| Variable | Pourquoi | Sans elle |
|---|---|---|
| `REVIEW_EMAIL`, `REVIEW_CODE` | compte de revue d'Apple (`docs/APP-REVIEW.md` §2) | connexion par e-mail fermée : l'examinateur ne voit ni rencontres ni chats (refus B1) |
| `ADMIN_EMAILS` | destinataires des alertes de signalement (et accès à l'administration) | aucune alerte, personne dans l'administration |
| `RESEND_API_KEY`, `MAIL_FROM` | alertes de modération, rappel de fin d'essai par e-mail, prévenance d'inactivité | aucun e-mail (la page Minimoa+ et la politique promettent le rappel par e-mail) |
| `ADMIN_URL` (facultatif) | liens des alertes | défaut `WEB_URL` + `/admin` |
| `ANTHROPIC_API_KEY` | lecture des chats, preuves, vérification des photos de profil, bilans | IA coupée : règles de repli, photos de profil publiées « à vérifier » |
| `AI_PROVIDER_NAME`, `AI_PROVIDER_COUNTRY` (facultatives) | prestataire nommé dans l'app | « Anthropic », « US » : à ne changer qu'**en même temps** que `SUBPROCESSORS.ai` de `apps/web/src/config/legal.ts` |
| `APPLE_SIGNIN_KEY_P8`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_TEAM_ID` | révocation du jeton Apple à la suppression du compte (`docs/CONNEXION.md`) | la révocation est ignorée (exigence d'Apple non tenue) |

Ne jamais passer `APPLE_ACCEPT_SANDBOX` à 0 (achats de l'examinateur en bac à sable).

Côté Apple : *Sign in with Apple for Email Communication* (domaine et adresse de `MAIL_FROM`), sinon le relais
`@privaterelay.appleid.com` refuse le rappel d'essai et les avertissements. Côté Supabase : fournisseur **Email**
activé (session du compte de revue par lien à usage unique).

## 4. Contrôles après déploiement

1. `GET /health` ; réponse du minuteur (`POST /internal/tick`) : `links`, `notifications`, `rituels`, `billing`,
   `admin-stats`, `retention`, `moderation`, `wardrobe`, tous `error: null`.
2. `POST /v1/review/session` avec un mauvais code → 401 « Adresse ou code incorrect. » ; avec le bon (TestFlight),
   le monde d'exemple apparaît (`docs/APP-REVIEW.md` §2, préparation du compte).
3. Un message « Je s@is où tu h4bites. » dans un chat de test → 422 `content_refused`, message non envoyé, texte gardé
   dans le champ ; un e-mail URGENT part à `ADMIN_EMAILS`.
4. Un prénom refusé à l'inscription (`S@l0pe`) → retour à l'écran du prénom, raison affichée.
5. `GET /v1/me/ai` → `provider: { name: "Anthropic", country: "États-Unis" }` ; Moi › L'IA et toi montre quatre
   sections (preuves, chats, vérifications de sécurité, bilan).
6. Une position envoyée (`/v1/me/location`) puis `select last_lat, last_lng from profile_places` : centre de
   maille (6 décimales, multiple de la maille), jamais le point envoyé.
7. Administration › Vue d'ensemble et Liens : chiffres présents au lendemain (le classement nominatif des jours de
   plus de 40 jours est vidé par la tâche).
8. App Store Connect › « Envoyer une notification de test » → `{"ok":true,"outcome":"test"}`.

## 5. Site, app, App Store Connect

- **Pages légales** (`apps/web`) : réécrites le 15 novembre d'après le code, en français (fait foi) et dans les quatre
  traductions (à faire relire). Champs encore « À COMPLÉTER » dans `apps/web/src/config/legal.ts`, à remplir avant la
  soumission : capital social, téléphone, e-mails d'assistance, de données personnelles et de sécurité, DPO,
  hébergeur du site (nom, adresse, téléphone), hébergeur des données (nom, adresse, téléphone, région, durée des
  sauvegardes), médiateur (nom, adresse, site), garanties de transfert de chaque sous-traitant, lieu de Resend, d'Apple
  Plans et de l'hébergement du site, prestataire du site, et `AI_TERMS.retention` (ce que le contrat avec Anthropic
  dit de la conservation ; rien d'autre ne doit être affirmé).
- **App** : manifeste de confidentialité en `CoarseLocation` ; réponses App Privacy : `docs/APP-STORE-CONNECT.md` §3 ;
  notes de revue : `docs/APP-REVIEW.md` §3 (source unique).
- **Ordre conseillé ensuite** : TestFlight complet sur iPhone (liste `docs/AUDIT-APPLE.md` §8, widgets et activités
  en direct compris : le Swift des vues n'a jamais été compilé), préparer le compte de revue, puis soumettre.

## 6. Revenir en arrière

- **Code** : redéployer le commit précédent de `main` suffit (colonnes neuves ignorées ; statistiques un peu moins
  filtrées). À éviter une fois l'app publiée : l'ancien code renverrait les photos de preuve à l'IA sans accord.
- **Migrations** : ne pas les défaire ; elles sont compatibles avec l'API de `main`. Les positions arrondies ne
  reviennent pas (voulu). Restaurer la sauvegarde seulement si rien n'a été écrit par la nouvelle API.
- Couper sans redéployer : `AI_KILL_SWITCH=1` (IA), retirer `REVIEW_EMAIL`/`REVIEW_CODE` ensemble (compte de revue),
  arrêter le cron (minuteur ; tout est rattrapé au redémarrage).
