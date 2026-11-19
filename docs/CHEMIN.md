# Ton chemin (V1, serveur)

« Chaque jour, ton minimoa te pose 5 questions, puis te présente une personne près de chez toi qui a répondu comme
toi, avec de quoi lui dire bonjour. »

Le parcours est fait d'**unités** thématiques, chacune d'**étapes** ; une étape = une **séance** de 5 questions.
Tout le contenu (questions, options, réactions du minimoa, unités, étapes, habillages) vit **dans la base** et se
modifie dans l'administration : ajouter une question ou une unité ne demande pas de nouvelle version de l'app.

| Pièce | Où |
|---|---|
| Règles pures (carte, séance, quota, révélation, type, personne du jour) | `packages/domain/src/chemin/` (tests : `chemin.test.ts`) |
| Série unique (gels, paliers) | `packages/domain/src/rituels/streak.ts`, `cheminStreakRules` dans `entitlements.ts` |
| Contrat (app) | `packages/contract/src/v7/chemin.ts`, `CheminResultZ` / `CheminPersonZ` dans `index.ts` |
| Contrat (administration) | `packages/contract/src/v7/chemin-admin.ts` (exporté par `admin.ts`, hors instantané) |
| Textes partagés (révélation, types, profil, personne du jour, traits) | `packages/content/src/v7/chemin.ts` (`cheminText`, 5 langues) |
| API | `apps/api/src/modules/chemin/` (ports, adaptateurs mémoire et Supabase, cas d'usage, contrôleurs) |
| Contenu de départ | `apps/api/src/modules/chemin/seed/` (forme : `catalogue.ts` ; textes : `texts.<langue>.ts`) |
| Migration | `supabase/migrations/20261121100000_chemin.sql` |
| Tests e2e (mémoire) | `apps/api/test/chemin.e2e.test.ts` |
| Administration | `apps/admin/src/views/Chemin.tsx` (statuts, compteur) ; routes `/admin/chemin/*` |

## Modèle

- **Question** : un axe de vision (`foyer`, `ancrage`, `elan`, `rythme`, `cap`), un **sens** (`direction` : 1 ou −1),
  un format, des options. Chaque option a un **poids** (−100 à 100, sa place sur l'axe avant le sens), une icône
  (emoji ou nom d'illustration), un **trait** facultatif (`tag`, pour « Vous deux : »), et une **réaction** du minimoa
  (texte, plus une animation facultative avec son `reactionMinBuild`).
- **Formats** : `choice` (choix illustré, 2 à 4 options) et `slider` (curseur, 2 options = les deux bouts ; réaction
  bas / milieu / haut) en V1. `this_or_that`, `ranking`, `photo_choice` existent dans le modèle : une question n'est
  servie telle quelle qu'à un build ≥ son `minBuild` (et qui déclare le format s'il envoie `?formats=`), sinon **repli**
  en `choice` (2 à 4 options) ; un curseur sans repli possible n'est pas servi (la séance est complétée par des
  révisions).
- **Habillages** (`chemin_scenes`) : transition entre deux questions et scène de fin, chacun avec un `minBuild`. L'API
  choisit le plus récent que le build sait jouer, sinon le repli (`default` : `fade` / `confetti`).
- **Unités et étapes** ont un `minBuild` (unité) et un statut. Seul ce qui est **en ligne** part dans l'app.
- **Statuts** : `draft` (brouillon) → `reviewed` (relue) → `live` (en ligne). Le garde-fou (`questionWarnings`) refuse
  de passer en relue ou en ligne une question qui touche à la santé mentale, la religion, la politique ou l'orientation
  sexuelle (liste de mots, 5 langues), ou dont les options ne vont pas avec le format.

### La séance du jour (`pickSession`)

1. L'étape courante = la première étape en ligne non faite, dans l'ordre (unité, puis étape). Une étape est faite
   quand une séance l'a terminée, ou (unité 1) quand toutes ses questions reprennent le test de vision déjà passé.
2. Ses questions affichables (dans l'ordre), puis des **révisions** jusqu'à 5 : questions déjà répondues un autre jour,
   l'axe le moins sûr d'abord, puis la réponse la plus ancienne, puis un ordre stable (personne + jour).
3. Tout le parcours fait : une séance de révision. Rien d'affichable : `reason: 'nothing_left'`.
4. La séance est enregistrée à la première lecture (`chemin_sessions`, une par personne, jour et créneau) : la même
   revient tant qu'elle n'est pas finie.

### Quota

1 séance par jour, avec ou sans Minimoa+ (créneau 0). **Bonus** (créneau 1, au plus un par jour) gagné par un geste
social, constaté à la lecture (aucune écriture dans les autres modules) :
- `wave_answered` : la personne a répondu oui aujourd'hui à un bonjour reçu (rencontre acceptée) ;
- `invite_signup` : une personne arrivée grâce à elle (`acquisitions.referred_by`) depuis sa dernière visite.
Le jour est le jour de Paris, comme la série et le reste de l'app (`dayOf`).

### Série (une seule)

Choix : **faire évoluer la série des rituels** plutôt qu'en créer une autre. Plusieurs séries existent déjà (rituels,
conversations, groupes…) ; Ton chemin réutilise `ritual_states` (série, record, jours protégés) :
- un jour est validé par le défi du jour (app installée avant Ton chemin) **ou** par une séance terminée : même
  compteur, même record, mêmes objets de garde-robe (`ritualStreak`), aucune migration de données ;
- à la première ouverture de Ton chemin, `ritual_states.streak_rules` passe de `weekly` à `chemin` : gels **1 par mois**
  (gratuit) ou **1 par semaine** (Minimoa+) au lieu de 1 / 3 jokers par semaine, paliers fêtés **7, 30, 100, 365**.
  Les objets de 3, 14 et 60 jours restent gagnés dans la garde-robe (statistique `ritualStreak`), sans annonce.
  **365 n'a pas encore d'objet** (`itemId: null`) : un nouvel objet est une valeur d'enum en plus dans les réponses
  (`ItemIdZ`), à ajouter quand tous les builds servis tolèrent l'inconnu (`tolerantSinceBuild`, docs/VERSIONING.md).
- Toutes les lectures de la série (accueil, widget, bilans, série en danger, administration) passent par
  `streakRuleFor(plus, state)` : l'ancienne app voit la même série (`jokersPerWeek` = gels de la période).

### Vision et appariement

Chaque réponse devient une observation de vision (`VisionSignals.record`, source `daily`, comme la question du jour) :
valeur = poids × sens (curseur : interpolation entre les deux bouts). Le profil (valeur + confiance des 5 axes) que
l'appariement lit déjà s'affine ; **rien ne change** dans `match`, `MATCH_THRESHOLD` ni les présentations, et l'app
installée n'est pas touchée.

### Fin de séance

- **Révélation** : l'axe où la moyenne des réponses du jour penche le plus, et son côté → une phrase de
  `cheminText.revelation.axes` (« Toi, tu laisses de la place à l'imprévu. »).
- **Ta personne du jour** : parmi les présentations du jour (`ListEncounters`, donc appariement, quota de rencontres,
  `Audience`, blocages… inchangés ; pas encore saluées d'abord), celle qui a le plus de réponses **en commun** avec la
  séance (même option, ou curseurs à moins de 20) ; à égalité, la plus compatible. Rendue sous la forme d'une
  présentation des rencontres (`SuggestionZ` : faire signe marche comme d'habitude), avec :
  - « Vous deux : » 2 ou 3 points : traits partagés de la séance (`tags` des options choisies par les deux), complétés
    par les points communs de la vision ;
  - une amorce (`opener`) : la question d'une réponse commune, sinon d'une réponse différente, sinon la première de
    la séance (« Demande-lui comment elle ou il recharge ses batteries. »).
  **Jamais** les réponses de l'autre une à une : seulement des traits partagés et une question.
- Personne : un état honnête (`empty.reason`) : `not_ready` (profil pas assez connu), `no_location` (pas de zone),
  `first_here` (« Tu es parmi les premiers ici »).

### Profil (`GET /v1/profil`)

Type de minimoa (8 types, `minimoaTypeOf`, d'après rythme × cap × élan : le phare, le cocon, l'atelier, le hamac, la
locomotive, l'hôte, la comète, la fanfare ; annoncé quand la confiance moyenne de ces trois axes atteint 20), « il te
connaît : un peu / bien / très bien » (confiance moyenne des 5 axes : < 30, < 60, ≥ 60), les 5 jauges (mêmes que
`GET /v1/vision`), le nombre de réponses ; rapport détaillé avec Minimoa+ (`detailedProfile`).

Minimoa+ ne vend **pas** de questions : il vend les gens (voir qui t'a dit bonjour, plus de présentations, autres
villes : déjà en place) et le rapport détaillé, plus un gel par semaine.

## Routes

| Méthode | Route | Réponse |
|---|---|---|
| GET | `/v1/chemin` | `CheminMapZ` : titre, unités (titre, sous-titre, icône, état `done/current/locked`, étapes), étape courante, `today` (état `todo/done/bonus/all_done`, quota, phrase), série (`CheminStreakZ` : gels, paliers), « il te connaît », `plus` |
| GET | `/v1/chemin/seance?formats=choice,slider` | `CheminSessionResponseZ` : `session` (id, créneau `daily/bonus`, étape, intro, 5 questions `{ id, format, text, review, options[{ id, label, icon, reaction{ text, animation } }], slider }`, transition, scène de fin) ou `null` avec `reason` (`quota_used`, `nothing_left`) et un message ; `quota` |
| POST | `/v1/chemin/reponses` `{ sessionId, answers[{ questionId, optionId? , value? }] }` | `CheminResultZ` : `revelation`, `progress` (étape faite, unité faite, suivante), `streak`, `newItems`, `milestone`, `quota`, `knows`, `person` (`suggestion`, `title`, `line`, `together{ title, points }`, `opener{ text, questionId }`) ou `empty`. Idempotent : renvoyer la même séance rend le même résultat avec `alreadyRecorded: true`. Toutes les questions de la séance, une fois chacune, sinon `invalid` |
| GET | `/v1/profil` | `ProfilZ` |
| GET | `/admin/chemin` · `/admin/chemin/stats` | contenu complet (tous statuts, alertes) · séances du jour (nombre, personnes, bonus) |
| POST / PUT | `/admin/chemin/questions` · `/admin/chemin/questions/:id` | créer (brouillon) · modifier (une question relue repasse en brouillon ; une question en ligne le reste) |
| POST | `/admin/chemin/questions/:id/status` · `/admin/chemin/units/:id/status` | `{ status }` |
| POST / PUT | `/admin/chemin/units` · `/admin/chemin/units/:id` | unité et ses étapes |

Client typé : `api.chemin.map()`, `.session(formats?)`, `.answer(body)`, `.profil()` ; administration :
`admin.chemin()`, `createCheminQuestion`, `updateCheminQuestion`, `setCheminQuestionStatus`, `createCheminUnit`,
`updateCheminUnit`, `setCheminUnitStatus`, `cheminStats`. Le contenu en ligne est gardé une minute en cache par
instance de l'API (vidé tout de suite sur l'instance qui reçoit la modification).

## Contenu de départ

6 unités × 2 étapes × 5 questions = 60 questions, 5 langues (fr source ; en américain, es d'Espagne, pt-BR, nl) :
`vision` (Ta vision de la vie : 10 des 12 situations du test, textes repris de `visionText`), `energie`, `habitudes`,
`valeurs`, `autres`, `gouts`. Inspirations : items libres de l'IPIP (Big Five), valeurs de Schwartz, styles
d'attachement grand public, réécrits en scènes du quotidien ; 12 curseurs, 48 choix ; 24 traits partagés.
Le test de vision complet vaut l'unité 1 : l'inscription peut devenir « Étape 1 ».

- Base réelle : `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpm --filter @blowy/api chemin:seed` (idempotent :
  n'insère que ce qui manque ; `--update` réécrit textes et options des contenus de départ, statut gardé ;
  `--dry-run` compte).
- Mémoire (tests, `BLOWY_ADAPTERS=memory`) : semé au premier accès (`MemoryCheminContentRepository`).

### Ajouter une question

1. Administration (ou `POST /admin/chemin/questions`) : identifiant `a-z0-9_`, étape, position, format, axe, sens,
   `minBuild` (0 pour `choice` et `slider`), textes `fr` (question, amorce « Demande-lui… », `mid` pour un curseur),
   options (icône, poids, trait, libellé et réaction). Elle naît en brouillon.
2. Traduire (en, es, pt, nl) ; sans traduction, le français s'affiche (l'alerte le rappelle).
3. Relue, puis en ligne : visible dans l'app au plus une minute après.
4. Un nouveau trait (`tag`) : ajouter son libellé dans `cheminText.tags` (5 langues) ; sans libellé, il est ignoré.
5. Pour la garder dans le contenu de départ : `seed/catalogue.ts` + `texts.<langue>.ts` (le test e2e vérifie que chaque
   langue a chaque question, avec autant d'options).

Règles d'écriture : tutoiement, jamais genrée pour la personne (« elle ou il »), réactions courtes, drôles, jamais
jugeantes ; ni santé mentale, ni religion, ni politique, ni orientation sexuelle ; rien qui suppose un couple ou des
enfants.

## Notifications et minuteur

- **Rappel du matin** : la plateforme envoie `daily_challenge` à l'heure choisie (port `DAILY_PUSH_SOURCE`, fourni
  maintenant par `CheminDailyPush`). Si la dernière app vue sur Ton chemin a un build ≥ `APP_<PLATEFORME>_CHEMIN_BUILD`
  : variante `step: 'chemin'`, « Ta séance du jour t'attend » / « Nino a 5 questions pour toi. 2 minutes. », vers
  `blowy://chemin` ; rien si la séance du jour est faite, si la personne est inactive (14 jours) ou le jour de
  l'inscription. Sinon le défi du jour, comme avant. Plafonds, heures calmes, décroissance et regroupements :
  inchangés (docs/NOTIFICATIONS.md).
- **Série en danger** (le soir) : pour une série aux règles de Ton chemin, « Ta séance du jour est encore possible ce
  soir. » (même type `streak_in_danger`, variante `step: 'chemin'`, même lien).
- Premier pas J1 « Nino a quelqu'un pour toi » : inchangé. Aucun nouveau travail du minuteur.

## Ce qui sort de l'interface V1

Défi du jour, habitudes avec preuve photo, groupes : **rien n'est supprimé côté serveur** (l'app installée s'en sert).
Pour une app dont le build atteint `APP_IOS_CHEMIN_BUILD` : `GET /v1/rituals/today` rend `challengeRetired: true` et
`challenge.present: false` (la carte ne monte plus) ; le rappel du matin parle de la séance.

## Réglages (API, Railway)

| Variable | Rôle | Défaut |
|---|---|---|
| `APP_IOS_CHEMIN_BUILD` | premier build iOS avec Ton chemin : défi du jour retiré, rappel du matin de la séance | `999999999` (inactif) |
| `APP_ANDROID_CHEMIN_BUILD` | idem Android | `999999999` |

À poser quand le build de Ton chemin part en vente (comme `APP_IOS_LATEST_BUILD`). Les routes `/v1/chemin*` et
`/v1/profil` répondent à tout le monde, sans ce réglage.

## Mise en production

1. `supabase db push` (migration `20261121100000_chemin.sql` : nouvelles tables vides, `ritual_states.streak_rules`
   à défaut constant, contrainte `not valid`), puis avancer `supabase/production-baseline.json`.
2. Plus tard (facultatif) : `alter table public.ritual_states validate constraint ritual_states_streak_rules_check;`.
3. Déployer l'API, puis `pnpm --filter @blowy/api chemin:seed` (production : contenu, pas de personnes).
4. À la sortie du build : `APP_IOS_CHEMIN_BUILD=<build>`, `pnpm contract:snapshot`.

## Ce qui reste pour l'app

Carte (unités, étapes, état), écran de séance (choix illustré, curseur, réactions, transition, scène de fin),
révélation, « Ta personne du jour » (réutiliser la carte des rencontres et « Faire signe »), profil, lien profond
`blowy://chemin`, inscription en « Étape 1 » (ou garder le test : il vaut l'unité 1), illustrations des icônes et des
animations nommées (`hop`, `confetti`), envoi de `?formats=choice,slider`.
