# Architecture Minimoa V7

```
apps/mobile  Expo SDK 58 (React Native 0.88, expo-router)  ─┐
apps/web     Astro 7 (site marketing, pages publiques)      ├─ @blowy/api-client ─ REST /v1 ─► apps/api (NestJS 12)
apps/admin   Vite + React (admin.minimoa.app)              ─┘                                   │ clé service
apps/mobile ── supabase-js : session (Apple, Google ; code e-mail en local) + temps réel ────► Supabase (Postgres, Auth, Storage)
planificateur (Railway cron ou pg_cron) ── POST /internal/tick toutes les 5 min ──► apps/api ──► Resend (e-mails)
                                                                                    apps/api ──► Expo push · APNs (activités en direct)
                                                                                    apps/api ──► Anthropic (IA, via AiGateway) · Apple (achats) · RevenueCat (relais)
```

## Règles
1. **Un seul écrivain** : l'API. L'app ne parle à Supabase que pour la session et pour s'abonner en temps réel aux
   tables `messages`, `links` et `group_messages` : seules politiques RLS, lecture par les membres du lien (un garde-fou
   n'est livré qu'à la personne concernée) ou du groupe (`group_members` : ses propres lignes, pour la politique des
   messages ; docs/GROUPES.md). Toutes les autres tables ont la RLS sans politique (profil, vision, positions,
   « qui tu veux rencontrer », abonnements, administration, usage de l'IA). Toute donnée affichée vient de l'API, le temps
   réel ne sert qu'à déclencher un rafraîchissement. Vérifié par `pnpm --filter @blowy/api check:schema`.
2. **Le contrat d'abord** : `packages/contract` (Zod) décrit chaque requête et réponse. L'API valide les entrées avec,
   le client valide les sorties avec. On ne duplique jamais un type du contrat.
3. **Moteur pur** : `packages/domain` contient les règles (jauges, vies, vision et compatibilité, série, budgets d'IA,
   heures calmes, essai, conservation des données). Pas d'horloge, pas d'aléa, pas d'entrée-sortie ; le jour courant
   est un paramètre. Les vies, l'usure des besoins et la série sont rattrapées à la lecture ; ce qui doit partir sans
   que personne n'ouvre l'app passe par le **minuteur** (`POST /internal/tick`, secret `INTERNAL_TICK_SECRET`, toutes
   les 5 min) : chaque module expose un `XxxJobs.runDue(now)` idempotent, listé dans `modules/tick/jobs.ts`.
4. **Ports et adaptateurs** côté API et côté app : chaque dépendance externe (base, stockage, e-mail, auth, IA, push,
   activités en direct, achats, vérification des preuves, bilan) est une interface avec un adaptateur réel et un
   adaptateur en mémoire ; les tests tournent en mémoire. La production refuse les adaptateurs mémoire.
5. **Design atomique** côté app : `packages/ui/src/{atoms,molecules,organisms,templates}` ; un niveau n'importe que les
   niveaux inférieurs ; aucun `StyleSheet` de présentation dans un écran. Les écrans (`apps/mobile/app/**`) sont fins :
   un template, des organismes, un hook de feature.
6. Textes écrits en français (langue source), tutoiement, externalisés et traduits par clés dans cinq langues (fr, en, es, pt, nl) : `apps/mobile/src/locales/*.ts` (app), `packages/content` (partagés, API). Voir `docs/I18N.md`.
7. TypeScript strict. Paquets internes consommés en source (`main: src/index.ts`), imports sans extension
   (`moduleResolution: Bundler`). Pas de `any`.

## Paquets
| Paquet | Rôle | Peut dépendre de |
|---|---|---|
| `@blowy/domain` | règles pures | rien |
| `@blowy/contract` | schémas Zod + table des routes | domain, zod |
| `@blowy/api-client` | client HTTP typé | contract |
| `@blowy/content` | socle des langues (`i18n/core`), libellés, voix des minimoas, défis, e-mails (mise en page `email/`), erreurs de l'API, par langue | domain, tokens |
| `@blowy/tokens` | couleurs, dégradés, typo, espacements | rien |
| `@blowy/ui` | composants React Native (atomique) | tokens, domain |

## API (`apps/api/src`)
```
main.ts · app.module.ts
config/env.ts                 variables validées par Zod au démarrage
shared/                       garde d'auth, décorateur @CurrentUser, pipe Zod, filtre d'erreurs, horloge, jetons d'injection
integrations/                 supabase (client service), storage, mailer (Resend), auth-verifier — port + adaptateur réel + adaptateur mémoire
modules/<module>/
  application/*.usecase.ts    un cas d'usage par commande ou requête ; dépend seulement de ports et du domaine
  ports.ts                    interfaces des dépôts du module
  infrastructure/             supabase-*.repository.ts et memory-*.repository.ts
  interface/*.controller.ts   REST : valide (contrat), appelle un cas d'usage, mappe vers le DTO
  <module>.module.ts          racine de composition
```
Modules : `me`, `pets` (soins, garde-robe), `links` (messages, série de la conversation, étapes, rappel « à toi d'écrire » ; `links/minimoas` : les minimoas
dans le chat), `encounters` (`WaveGuard` : on ne salue que qui l'app a montré, plafonds de coucous par jour et en attente,
e-mails de signe plafonnés, repérage des envois en masse pour la modération ; règles `packages/domain/src/anti-spam.ts`), `invites`, `words`, `safety` (blocages, signalements ; `Audience` : qui est montré à qui),
`vision` (test, profil, appariement, carte), `rituels` (sortie, défi du jour, série, habitudes et preuves, bilan),
`notifications` (appareils, réglages, présence, envoi, activités en direct ; règles : `docs/NOTIFICATIONS.md`), `billing` (Minimoa+), `admin` (tableaux, modération),
`retention` (comptes inactifs, exclusions, purges), `fidelite` (premiers pas, nouvelles du minimoa pendant une absence,
anniversaires ; journal `lifecycle_messages` partagé avec Minimoa+, `docs/FIDELISATION.md`), `growth` (codes créateurs,
source d'arrivée, compteurs et étapes de l'entonnoir, tableau « Croissance » ; `Growth` et `Codes` globaux, docs/VIRALITE.md), `groups` (groupes, « la tenir ensemble », jours jugés ;
`groups/sharing` : habitudes partagées et rigueur, module sans dépendance importé par les liens, les rencontres et les
rituels ; docs/GROUPES.md), `tick` (minuteur), `health`, `app-config` (builds servis, `GET /v1/app/config` ; en-têtes `x-app-*` lus par `shared/client-app.ts`, 426 sous le minimum : docs/VERSIONING.md), `moderation` (filtre des contenus :
règles du domaine `moderation.ts` puis IA si permise ; `ReportDesk`, seul créateur des signalements : priorité, escalade,
suspension automatique, alertes de l'équipe), et `src/review` (compte de revue d'Apple et son monde d'exemple,
`docs/APP-REVIEW.md` ; « qui voit qui » reste dans `Audience`, par `profiles.review_world`).
`integrations/` : `ai` (`AiGateway` : interrupteur, plafond global, budget par personne, compteur), `push` (Expo,
APNs), `plateforme` (composition globale : cache, limites de débit, IA, push, minuteur).
Injection explicite partout (`@Inject(JETON)`) : pas de `emitDecoratorMetadata`, ce qui permet `tsx` en dev et `tsup` en build.

### Ports externes (réel · mémoire)
| Port | Réel | Mémoire |
|---|---|---|
| `AuthVerifier`, `AuthAdmin`, `UserEmails` | Supabase Auth | jetons `test:<uuid>[:<e-mail>]` |
| `AppleTokenClient`, `AppleTokenStore` (révocation de Sign in with Apple à la suppression, `docs/CONNEXION.md`) | `appleid.apple.com` (JWT ES256) · table `apple_tokens` ; désactivé sans clé | Apple imité · `MemoryDb` |
| `Storage` | Supabase Storage (URL signées) | `/dev/uploads`, `/dev/media` |
| `Mailer` | Resend | console (`outbox`) |
| `AiGateway` → `ModelClient` | Anthropic (Haiku, Sonnet) | `MemoryModel` déterministe |
| `Pusher` | Expo push | `MemoryPusher` (`outbox`) |
| `LiveActivityPusher` | APNs HTTP/2 (clé `.p8`) | `MemoryLiveActivities` |
| `Billing` | vérification locale des JWS d'Apple | `memoryJws` |
| `AppleNotificationRelay` (notifications Apple relayées à RevenueCat, `docs/BLOWY-PLUS.md` §6) | POST HTTP, 5 s, un nouvel essai ; désactivé sans `REVENUECAT_APPLE_NOTIFICATIONS_URL` | `MemoryAppleNotificationRelay` (`sent`) |
| `HabitVerifier`, `Coach` | IA via `AiGateway` (repli : « pas sûr », modèles de phrases) | déterministes |
| dépôts de chaque module | `supabase-*.repository.ts` | `memory-*` sur `MemoryDb` (cascades comprises) |

### Tâches du minuteur (`modules/tick/jobs.ts`, dans l'ordre)
`links` (vies rattrapées, « lien en danger », relances de 72 h, le soir « à toi d'écrire ») · `notifications` (reports des heures calmes, défi du
jour à l'heure choisie — seul chemin d'envoi de `daily_challenge` —, activités en direct finies, reçus Expo, ménage) ·
`rituels` (preuves demandées, besoin de sortir, série en danger, bilans du dimanche, photos privées de plus de 24 h) ·
`billing` (rappel du jour 5 de l'essai, par push et par e-mail ; au revoir et relance unique après la fin de Minimoa+ ;
journal des magasins > 30 j) · `admin-stats` (chiffres de chaque jour terminé,
apports `ADMIN_INSIGHTS`) · `retention` (prévenance puis suppression après 2 ans sans connexion, exclusions > 3 ans,
modération > 1 an) · `moderation` (récapitulatif des signalements à l'équipe, escalade après 24 h, photos de profil à
vérifier) · `wardrobe` · `groups` (jour des groupes d'habitude jugé le lendemain à midi : vies, série, sommeil) · `fidelite` (premiers pas,
absences, anniversaires, une passe par demi-heure). Chaque travail est réservé par créneau d'une minute (`tick_runs`) et borné par `TICK_BUDGET_MS`.

## App (`apps/mobile`)
```
app/                          routes expo-router (écrans fins)
src/core/                     config, ports (Auth, Api, Realtime, Media, Purchases) + adaptateurs, providers
src/features/<f>/             hooks react-query + logique d'écran ; index public
src/core/optimistic.ts        mises à jour optimistes (`optimistic` / `patch` / `rollback`) : l'écran change à l'appui, l'API
                              confirme ; jamais pour un achat, une suppression de compte ou un signalement
src/features/chat/            envoi optimiste des messages (liens, groupes) : file gardée sur l'appareil, clé d'idempotence
src/locales/*.ts              textes de l'interface, par langue (`messages({ fr, en, es, pt, nl })`)
(images des pets : packages/ui/assets/pets, registre typé dans packages/ui/src/assets/pets.ts)
```

## Base (`supabase/migrations`)
V6 : `profiles`, `pets`, `pet_events`, `pet_items`, `links`, `messages`, `link_reads`, `daily_photos`, `encounters`,
`word_votes`, `blocks`, `reports`. V7 : vision (`profile_places`, `vision_signals`, `vision_profiles`, `match_cache`),
rituels (`ritual_states`, `daily_challenges`, `habits`, `habit_checks`, `ritual_photos`, `weekly_reviews`), plateforme
(`ai_usage_daily`, `ai_user_calls`, `chat_link_settings`, `chat_pet_state`, `push_devices`, `live_activity_tokens`,
`notification_settings`, `notification_log`, `push_receipts`, `tick_runs`), Minimoa+ et administration (`subscriptions`,
`store_notifications`, `account_suspensions`, `admin_audit_log`, `user_activity_days`, `admin_daily_stats`,
`encounter_proposals`), conservation (`banned_identities`), manques (`apple_tokens`, `profiles.chat_reading_default`, `chat_link_settings.by_default`,
`weekly_reviews.axis_moves`), série de la conversation (`links.best_streak`, `duo_days`, `last_duo_day_on`,
`recent_days`, `milestones`, `write_reminder_on` ; `daily_photos` gardée en lecture seule pour les souvenirs), groupes
(`groups`, `group_members`, `group_messages`, `group_days`, `together_proposals`, `habit_jokers`, `profiles.show_habits`,
`reports.group_id`, `reports.group_message_id`), Minimoa+ hebdomadaire et fidélisation (`subscriptions.plan` accepte
`weekly`, `lifecycle_messages`), croissance (`groups.invite_code`, `creators`, `acquisitions`, `growth_events`,
`growth_counters`), désir de Minimoa+ (`growth_counters` : `plus_*` par déclencheur ; `pet_items.source` = `collection` ;
docs/DESIR.md). Compartiment privé `media` (URL signées émises par l'API).
Après une migration : `database.types.ts` à la main, puis `check:schema`. Mise en production : `docs/DEPLOIEMENT-V7.md`.

## Produit
La V7 (minimoa, vision, rituels, Minimoa+) est décrite dans `docs/V7-SPEC.md` ; ce qui suit reste vrai de la V6.

### Base V6
- Un pet par personne. 4 jauges à deux pôles (casanier↔sociable, posé↔joueur, piquant↔tendre, discret↔bavard) qui
  bougent avec l'activité et retombent vers 0.
- Un lien = deux personnes et leurs pets. 7 vies (un jour entier de silence en coûte une ; un jour où les deux
  s'écrivent en rend une — V7 §24 : plus de photo du jour, la série compte les jours d'affilée où les deux s'écrivent), lien fantôme à 0 (ranimable une fois), 7 niveaux (rendez-vous → l'œuf). Visages cachés avant
  le niveau 4, flous au 4, nets au 5.
- Dans chaque lien (V7) : chat · le lien (la journée, la semaine, les vies, le prochain niveau, les étapes). Les pets parlent dans le chat.
- Rencontres : ton pet croise d'autres pets (amis d'amis d'abord). Rien ne se passe sans ton tap : tu salues,
  l'autre accepte, le lien se crée.
- « 3 mots » : un lien web où tes potes choisissent 3 mots sur toi ; ils font bouger les jauges.
- 18 ans minimum. Signalement, blocage et suppression du compte dans l'app.
