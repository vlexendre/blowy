# Mettre la V7 en production

Ordre des opérations pour passer la base et l'API de la V6 à la V7, sur une base qui a déjà des comptes. Rien ici
n'est automatique : chaque étape se fait à la main, dans cet ordre. Durée : une heure, dont quelques minutes où
l'ancienne API et la nouvelle base ne vont pas ensemble (étape 4).

## 0. Ce qui change pour les données

- Sept migrations V7 (`20261115130000` à `20261115170000`), toutes sûres sur une base peuplée : colonnes nouvelles
  avec une valeur par défaut constante (instantané, pas de réécriture), contraintes sur `messages` et `reports` posées
  `not valid` puis validées dans la dernière migration (verrou qui laisse passer lectures et écritures), index des
  tables existantes en `if not exists` (à créer avant, sans bloquer, étape 3).
- **Seule perte voulue** : `profiles.city` est supprimée (la ville n'est plus demandée ; la zone vient de la position).
- Les comptes existants n'ont ni test de vision, ni position : `Me.visionTestDone = false`, l'app les envoie au test ;
  pas de carte ni de rencontres proches tant qu'ils n'ont pas donné leur position. Leur dernier jour d'activité part du
  jour de la migration (2 ans pleins avant toute suppression pour inactivité).
- Les politiques « soi : lire son profil » et « soi : lire son pet » sont supprimées : l'app ne lit en direct que les
  liens et les messages (règle 1 de `docs/ARCHITECTURE.md`).
- L'ancienne app (V6) n'est pas compatible avec l'API V7 (contrat de l'inscription, défi du jour). Publier la nouvelle
  app dans TestFlight en même temps.

Mesuré sur une copie locale avec 3 millions de messages (PostgreSQL 16) : sans l'étape 3, la migration
« plateforme » bloque les écritures sur `messages` ~1,4 s (construction d'index) ; avec l'étape 3, chaque migration V7
prend moins de 0,1 s, sauf l'intégration (~0,8 s, surtout la validation des contraintes, qui ne bloque pas les
écritures, et l'index `messages_visible_to_idx`, ~0,4 s de blocage, qui ne peut pas être créé avant car sa colonne
naît dans la migration « plateforme »).

## 1. Avant le jour J : consoles

**Apple** (developer.apple.com et App Store Connect) :
1. Identifiant `app.blowy` : capacités *Sign in with Apple*, *Push Notifications*, *App Groups* (`group.app.blowy`) ;
   extension `app.blowy.widget` : *App Groups* (`docs/WIDGETS.md`).
2. Keys › `+` › *Apple Push Notifications service (APNs)* : télécharger le `.p8` (une seule fois), noter son Key ID
   et le Team ID (Membership). Pour les activités en direct.
3. Abonnements Blowy+ : groupe « Blowy+ », `app.blowy.plus.yearly` (59,88 €, essai de 7 jours) et
   `app.blowy.plus.monthly` (14,99 €), accord « Apps payantes » signé (`docs/BLOWY-PLUS.md` §1).
4. Notifications serveur App Store **V2**, production et bac à sable :
   `https://<domaine de l'API>/v1/plus/apple/notifications` ; noter l'Apple ID numérique de l'app.
5. URL des conditions, de la confidentialité et des conditions de l'abonnement sur la fiche (`/legal/...`).

**Supabase** (tableau de bord du projet) :
1. Authentication › Providers : activer **Apple** (Services ID, Team ID, Key ID et clé de *Sign in with Apple*) et
   **Google** (identifiants OAuth) ; garder le code par e-mail seulement pour le mode local.
2. Faire une **sauvegarde** (Database › Backups) ou vérifier la sauvegarde du jour (point de retour, étape 7).
3. Noter la chaîne de connexion directe (pas le pooler en mode transaction) pour les étapes 3 et 4.

**Expo / EAS** : profil de production avec `EXPO_PUBLIC_API_URL` de la nouvelle API ; ne pas activer encore
`EXPO_PUBLIC_LIVE_ACTIVITY_PUSH` (étape 6).

## 2. Variables de l'API (hébergeur, jamais dans le dépôt)

Requises en production :

| Variable | Valeur |
|---|---|
| `BLOWY_ENV` | `production` |
| `BLOWY_ADAPTERS` | `supabase` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | projet ; la clé service est secrète |
| `APPLE_APP_APPLE_ID` | Apple ID numérique de l'app (l'API refuse de démarrer sans lui en production) |
| `INTERNAL_TICK_SECRET` | 24 caractères au moins (sans lui, la route du minuteur n'existe pas) |
| `ADMIN_EMAILS` | adresses de l'équipe (vide : personne n'entre dans l'administration) |
| `CORS_ORIGINS` | site et administration |

Conseillées : `RESEND_API_KEY`, `MAIL_FROM` (sinon aucun e-mail : ni bienvenue, ni avertissement, ni prévenance
d'inactivité) ; `ANTHROPIC_API_KEY` (sinon l'IA est coupée et les règles prennent le relais) ;
`APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID` (ensemble ; sinon pas d'activités en direct par push) ;
`APNS_ENVIRONMENT=production` (TestFlight et App Store utilisent la production APNs).

Facultatives (valeurs par défaut correctes) : `AI_PROVIDER`, `AI_MODEL_SMALL`, `AI_MODEL_MEDIUM`,
`AI_KILL_SWITCH` (0), `AI_DAILY_CEILING_USD` (3), `AI_USER_BUDGETS`, `AI_PRICES_SMALL`, `AI_PRICES_MEDIUM`,
`AI_EUR_PER_USD`, `PUSH_PROVIDER` (`expo`), `EXPO_ACCESS_TOKEN`, `TICK_BUDGET_MS` (20000), `APPLE_BUNDLE_ID`
(`app.blowy`), `APPLE_ACCEPT_SANDBOX` (1, nécessaire pour TestFlight), `PLUS_PRODUCT_YEARLY`, `PLUS_PRODUCT_MONTHLY`,
`MAIL_FROM`, `WEB_URL`, `API_URL`, `PORT`. La liste commentée est dans `.env.example`.

## 3. Jour J, sans coupure : index des grosses tables

Depuis un poste avec `psql`, sur la connexion directe (chaque ligne hors transaction ; `concurrently` ne bloque pas
les écritures, peut prendre plusieurs minutes) :

```sql
create index concurrently if not exists messages_link_user_idx on public.messages (link_id, created_at desc) where author_kind = 'user';
create index concurrently if not exists messages_pet_created_idx on public.messages (created_at) where author_kind = 'pet';
create index concurrently if not exists links_due_tick_idx on public.links (last_tick_on) where status = 'active';
create index concurrently if not exists profiles_created_idx on public.profiles (created_at);
create index concurrently if not exists encounters_created_idx on public.encounters (created_at);
create index concurrently if not exists encounters_accepted_idx on public.encounters (status_at) where status = 'accepted';
```

Vérifier qu'aucun n'est resté invalide (`select indexrelid::regclass from pg_index where not indisvalid;` doit être
vide ; sinon `drop index` puis recommencer). Les migrations trouveront ces index et ne feront rien.

## 4. Migrations, puis la nouvelle API tout de suite

1. Vérifier en local que la chaîne passe : `pnpm --filter @blowy/api check:schema` (PostgreSQL local, voir
   `apps/api/README.md`).
2. `supabase db push` (ou les fichiers dans l'ordre depuis le tableau de bord). Chaque fichier est appliqué dans sa
   propre transaction. Très grosse table `messages` (dizaines de millions de lignes) : appliquer jusqu'à
   `20261115160000_facturation_admin.sql`, créer
   `create index concurrently if not exists messages_visible_to_idx on public.messages (visible_to) where visible_to is not null;`,
   puis appliquer `20261115170000_integration.sql`.
3. **Aussitôt**, déployer l'API V7 (Railway : déploiement du service ; healthcheck `/health`). Entre la fin des
   migrations et le démarrage de l'API V7, l'API V6 échoue sur l'inscription et la modification du profil (colonne
   `city` supprimée) ; le reste répond.
4. Contrôles : `GET /health` ; `GET /v1/vision/test` (12 situations) ; avec un compte de test : `GET /v1/me`
   (`visionTestDone: false` pour un ancien compte), `GET /v1/rituals/today`, `GET /v1/plus/paywall` ; App Store
   Connect › « Envoyer une notification de test » → `{"ok":true,"outcome":"test"}`.

## 5. Le minuteur

`POST /internal/tick` toutes les 5 minutes avec l'en-tête `x-tick-secret` (même valeur que `INTERNAL_TICK_SECRET`).
Au choix : un service cron Railway (`*/5 * * * *`, `curl -fsS -X POST -H "x-tick-secret: $INTERNAL_TICK_SECRET"
https://<api>/internal/tick`) ou `pg_cron` + `pg_net` dans Supabase (requête complète dans `apps/api/README.md`, secret
dans Vault). Le premier tick calcule les statistiques des jours passés, envoie les reports du matin et vérifie les
comptes inactifs ; un tick manqué est rattrapé au suivant. Contrôle : la réponse liste les travaux (`links`,
`notifications`, `rituels`, `billing`, `admin-stats`, `retention`) avec `error: null`.

## 6. L'app et l'administration

1. Build EAS de production, TestFlight, puis revue (prévoir un compte de démonstration).
2. Une fois l'API déployée **avec** la clé APNs : `EXPO_PUBLIC_LIVE_ACTIVITY_PUSH=1` dans les profils de
   `apps/mobile/eas.json`, nouveau build (les jetons d'activité en direct sont alors envoyés à l'API).
3. Administration (`apps/admin`) : build statique (`pnpm build:admin`), hébergé avec `VITE_API_URL` de l'API ; les
   adresses autorisées sont celles d'`ADMIN_EMAILS`.

## 7. Revenir en arrière

- **API** : redéployer l'image précédente ne suffit pas (la V6 a besoin de `profiles.city`). Tant qu'aucune donnée
  V7 importante n'existe (les premières heures), le retour se fait par la **restauration de la sauvegarde** faite à
  l'étape 1 (Supabase › Backups, ou point dans le temps avec le module PITR), puis l'image V6.
- **Plus tard** (comptes V7 créés, achats reçus) : ne pas restaurer ; corriger en avant. Pour une API V6 temporaire, il
  suffit de recréer la colonne : `alter table public.profiles add column if not exists city text;` (les tables V7 sont
  ignorées par la V6). Couper ce qui pose problème sans redéployer : `AI_KILL_SWITCH=1` (IA), retirer
  `APNS_KEY_P8` (activités en direct), arrêter le cron (minuteur ; tout est rattrapé au redémarrage).
- Les index créés à l'étape 3 peuvent rester (inoffensifs pour la V6).

## 8. Ce qui n'a pas été vérifié avant la mise en ligne

Tout a été testé en mémoire (tests de l'API) et les migrations sur un PostgreSQL 16 local qui imite Supabase. Jamais
contre : un vrai projet Supabase (Auth Apple et Google, temps réel, stockage), Apple (achats signés, notifications
serveur, APNs), Anthropic, Expo push. Les premiers essais réels se font sur TestFlight avec un compte bac à sable.

## 9. Plus de photo du jour (spéc §24) sur une base V7 en service

Les sept migrations V7 sont en production et l'API V7 se déploie seule à chaque poussée sur `main`. Ce changement
ajoute `20261115190000_no_daily_photo.sql` (structure) et `20261115190100_no_daily_photo_backfill.sql` (reprise).

**Ordre : les migrations d'abord, le code ensuite.** Le nouveau code lit et écrit des colonnes qui n'existent pas
encore (`links.recent_days`, `best_streak`…) : déployé avant, chaque lecture d'un lien échouerait. À l'inverse, les
migrations ne gênent pas l'API qui tourne : colonnes nouvelles à valeur par défaut, aucune colonne retirée,
`activity = 'photo'` et le réglage `daily_photo` encore acceptés, `admin_daily_metrics` garde son nom et sa signature.
Donc :

1. Hors transaction, sans bloquer les écritures (comme l'étape 3) :
   `create index concurrently if not exists links_write_reminder_idx on public.links (last_active_on, id) where status = 'active';`
2. Appliquer `20261115190000_no_daily_photo.sql` puis `20261115190100_no_daily_photo_backfill.sql` (deux transactions ;
   `lock_timeout` de 5 s : si un verrou n'arrive pas, la migration échoue sans rien appliquer, la relancer).
   Répétition locale avec écritures concurrentes de l'ancienne API (30 000 liens, 600 000 messages, 160 000 photos) :
   structure 0,06 s, reprise 3,3 s (verrous de ligne sur `links` seulement : une écriture de lien attend la fin),
   aucune écriture perdue. Un seul fichier gardait `links` verrouillé pendant toute la reprise et s'interbloquait avec
   l'API : d'où les deux fichiers.
3. Pousser le code sur `main` (déploiement automatique de l'API) et publier l'app qui va avec (contrat changé : plus de
   photo du jour, nouvel écran du lien). L'ancienne app reste utilisable pour écrire ; ses écrans de photo du jour
   échouent (routes retirées, 404).
4. Juste après le déploiement, la reprise du jour (rejouable, sans effet la deuxième fois) : elle recompte qui a écrit
   aujourd'hui entre la migration et le code (l'ancienne API ne tenait pas `recent_days`) et fait avancer les séries
   des liens où les deux ont écrit dans cet intervalle.

```sql
-- Reprise du jour (spéc §24), juste après le déploiement du code : rejouable, sans effet la deuxième fois.
-- 1. Photos à deux faites par l'API d'avant entre la migration et le code.
update public.links set last_duo_day_on = last_duo_photo_on
where last_duo_photo_on is not null and (last_duo_day_on is null or last_duo_photo_on > last_duo_day_on);
-- 2. Qui a écrit aujourd'hui (messages des personnes et photos du jour), fusionné dans `recent_days`.
with t as (select (now() at time zone 'Europe/Paris')::date as d),
writes as (
  select m.link_id, m.author_id as user_id from public.messages m, t
  where m.author_kind = 'user' and m.kind = 'text' and m.created_at >= (t.d::timestamp at time zone 'Europe/Paris')
  union
  select p.link_id, p.user_id from public.daily_photos p, t where p.day = t.d
),
per_link as (
  select w.link_id, bool_or(w.user_id = l.user_a) as a, bool_or(w.user_id = l.user_b) as b
  from writes w join public.links l on l.id = w.link_id group by w.link_id
)
update public.links l set
  recent_days = (
    select coalesce(jsonb_agg(e order by e ->> 'day'), '[]'::jsonb) from jsonb_array_elements(l.recent_days) as e where e ->> 'day' <> to_char(t.d, 'YYYY-MM-DD')
  ) || jsonb_build_array(jsonb_build_object(
    'day', to_char(t.d, 'YYYY-MM-DD'),
    'a', p.a or exists (select 1 from jsonb_array_elements(l.recent_days) e where e ->> 'day' = to_char(t.d, 'YYYY-MM-DD') and (e ->> 'a')::boolean),
    'b', p.b or exists (select 1 from jsonb_array_elements(l.recent_days) e where e ->> 'day' = to_char(t.d, 'YYYY-MM-DD') and (e ->> 'b')::boolean)
  )),
  last_active_on = greatest(l.last_active_on, t.d)
from per_link p, t
where p.link_id = l.id;
-- 3. Jour à deux pas encore compté : la série avance (règle du domaine, `applyLinkMessage`).
with t as (select (now() at time zone 'Europe/Paris')::date as d)
update public.links l set
  streak = case when l.last_duo_day_on = t.d - 1 then l.streak + 1 else 1 end,
  best_streak = greatest(l.best_streak, case when l.last_duo_day_on = t.d - 1 then l.streak + 1 else 1 end),
  duo_days = l.duo_days + 1,
  last_duo_day_on = t.d
from t
where l.status = 'active' and (l.last_duo_day_on is null or l.last_duo_day_on < t.d)
  and exists (select 1 from jsonb_array_elements(l.recent_days) e where e ->> 'day' = to_char(t.d, 'YYYY-MM-DD') and (e ->> 'a')::boolean and (e ->> 'b')::boolean);
```

5. Plus tard, une fois l'ancienne API éteinte pour de bon : retirer `photo` de `live_activity_tokens_activity_check`,
   `daily_photo` des `notification_settings.disabled_kinds`, et la colonne `links.last_duo_photo_on`. La table
   `daily_photos` et ses fichiers restent tant que les liens existent : ce sont les souvenirs des personnes (montrés
   dans « Le lien »), effacés avec le lien ou le compte comme avant.

Revenir en arrière : redéployer le code précédent suffit (les colonnes ajoutées sont ignorées) ; les photos du jour
n'ont pas été touchées.
