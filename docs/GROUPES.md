# Habitudes partagées, rigueur et groupes

Spéc : `docs/V7-SPEC.md` §25 et §26. Contrat : `packages/contract/src/v7/groupes.ts` (groupes, « ensemble »,
administration) et `v7/rituels.ts` (`RigourZ`, `SharedHabitsZ`, `OnboardHabitZ`). Règles pures :
`packages/domain/src/groups.ts`. API : `apps/api/src/modules/groups`. Migration : `20261117120000_groupes.sql`.

## Règles

- **Rigueur** d'une habitude : sur 28 jours, jours tenus / jours dus. Un jour couvert par un joker posé pour une
  habitude (`habit_jokers`) est neutre. Moins de 7 jours dus : `value: null`, `tooEarly: true`. Rigueur d'une personne :
  somme des jours tenus / somme des jours dus de ses habitudes actives. Calculée à la lecture depuis `habit_checks`.
- **Jour dû** : « tous les jours », chaque jour depuis la création ; « 3 fois par semaine », seulement le jour où le
  manquer rendrait l'objectif de la semaine impossible (semaine de départ au prorata).
- **Groupe** : libre (un chat) ou d'habitude. 3 à 8 membres ; il démarre (`forming` → `active`) au 3ᵉ membre actif.
  Limite de groupes à la fois : `entitlements(plus).groups` (2 gratuit, 10 avec Minimoa+). On n'invite que ses liens
  vivants (`links.status = 'active'`). Accepter un groupe d'habitude ajoute l'habitude si besoin (dans sa limite).
- **Jour d'un groupe d'habitude** : un membre est à jour s'il a tenu l'habitude ou posé un joker ; un jour où personne
  n'avait rien à faire ne compte pas (`skipped`). Tous à jour : série +1. Un membre en retard : −1 vie, série à 0.
  7 jours d'affilée sans faute : +1 vie (5 au plus). 0 vie : le groupe s'endort (chat lisible, plus jugé) ; n'importe
  quel membre le réveille (5 vies, série 0 ; les jours de sommeil ne sont pas jugés). Un membre compte à partir du
  lendemain de son arrivée.
- **Jugement** : un jour se juge le lendemain à midi (Paris), par `GroupJobs.runDue` (minuteur, ligne `groups` de
  `modules/tick/jobs.ts`). Idempotent : `evaluated_through` avance par écriture conditionnelle, puis `group_days`.
- **Joker** : pour aujourd'hui, ou pour hier jusqu'à midi. Même réserve que la série du défi (1 par semaine, 3 avec
  Minimoa+) : le jour est ajouté à `ritual_states.joker_days` et rangé dans `habit_jokers` ; un jour déjà couvert ne
  coûte rien. Il couvre la personne dans tous ses groupes ce jour-là. Un événement « X pose un joker » est écrit.
- **« La tenir ensemble »** : compte les personnes éligibles (même habitude active, « Montrer mes habitudes », pas en mode
  discret, position consentie, ni bloquées ni suspendues : `Audience` « together » ; compatibles ≥ 70) autour de la
  **zone du domicile gardée par le serveur** (rayon de la carte gratuite, 1,5 km), jamais d'un centre envoyé par l'app
  ni de la ville choisie avec Minimoa+. Au moins 2 : suggestion avec le nombre seulement. Dire oui range une
  proposition (14 jours) ; dès que 2 autres personnes éligibles (deux à deux non bloquées, avec de la place) ont dit
  oui, le groupe démarre avec tous (nom = l'habitude) et les identités n'apparaissent qu'entre eux.

## Vie privée

- Dans un groupe, chacun voit des autres ce qu'un lien voit (`PersonZ` : prénom, minimoa, visage caché) : ni position,
  ni âge, ni vision. Les membres passent par `Audience` (« group »).
- Deux personnes bloquées ne sont jamais ensemble : une invitation vers quelqu'un qui a un blocage avec un membre actif
  reste en attente mais n'arrive pas (invisible, impossible à accepter) ; bloquer un membre fait quitter les groupes
  partagés à celui qui bloque (départ ordinaire dans le chat). Le nombre d'invitations ne trahit donc aucun blocage.
- Habitudes de l'autre (`sharedHabits` sur `GET /v1/links/:id`, les suggestions et les coucous de `GET /v1/encounters`) :
  seulement pour ses liens, les coucous et les personnes présentées dans la même réponse ; `Audience` « habits » ;
  réciproque (rien si l'une des deux a coupé le réglage) ; absent quand il n'y a aucune habitude commune.
- Aucune IA ne lit un groupe : filtre des contenus par règles seulement (violation nette refusée et signalée, cas limite
  envoyé et signalé), minimoas seulement pour des événements (rangés en code + variables, écrits dans la langue de qui lit).
- Temps réel : `group_messages` publié ; politiques RLS « membres : lire leurs adhésions » (`group_members`, ses propres
  lignes) et « membres : lire les messages de leurs groupes » (membres actifs). Tout le reste : API seulement.

## Routes

| Méthode et route | Corps / réponse |
|---|---|
| `GET /v1/groups` | `GroupsZ` (groupes, invitations, limite) |
| `POST /v1/groups` | `CreateGroupBody` → `GroupDetailZ` |
| `GET /v1/groups/:id` · `PATCH` (renommer) | `GroupDetailZ` · `RenameGroupBody` → `GroupActionZ` |
| `POST /v1/groups/:id/invite` | `InviteToGroupBody` → `GroupDetailZ` |
| `POST /v1/groups/:id/accept` · `decline` · `leave` | `GroupDetailZ` · `OkZ` · `OkZ` |
| `POST /v1/groups/:id/wake` | `GroupActionZ` |
| `GET /v1/groups/:id/messages?before=` · `POST` | `GroupMessagesPageZ` · `SendGroupMessageBody` → `GroupActionZ` |
| `POST /v1/groups/:id/read` | `OkZ` |
| `POST /v1/groups/:id/joker` | `GroupJokerBody` → `GroupActionZ` |
| `POST /v1/groups/:id/report` | `GroupReportBody` (message, membre ou groupe) → `OkZ` |
| `GET /v1/together` · `POST` · `DELETE /v1/together/:habitId` | `TogetherZ` · `TogetherBody` → `TogetherResultZ` · `OkZ` |
| `GET /admin/groups/:id` · `POST /admin/groups/:id/close` | `AdminGroupZ` · `AdminCloseGroupBody` → `AdminGroupZ` |

Aussi : `habits` dans `POST /v1/me/onboard` (2 au plus), `showHabits` dans `PATCH /v1/me` et `Me`, `rigour` et
`shared` dans `GET /v1/rituals/habits`, `groupId` dans les signalements de l'administration (contexte du message).
Client : `api.groups.*`, `admin.group` / `admin.closeGroup`.

Notifications : `group_invite`, `together_proposal` (proposition, ou groupe démarré avec `groupId`), `group_message`
(un push tant que la personne n'a pas lu, dans le plafond du jour), `group_life_lost`, `group_asleep`. Lien profond
`blowy://groupe/<id>` (ou `blowy://pet/habitudes` pour une proposition).

## Démo (`BLOWY_DEMO=1`)

À chaque inscription locale (`apps/api/src/demo/groupes-demo.ts`) : « Marche du matin » (habitude Marcher, avec Léa et
Inès, 10 jours d'histoire, 4 vies), « Les potes du 11e » (libre, Malo et Yanis), une invitation de Sasha dans « Lecture
du soir » (Lire, en formation), la suggestion « ensemble » (Chloé, Yanis, Noé comptés dans la zone, `TOGETHER_FIXTURES`,
démo seulement), et des habitudes communes avec Malo (lien) et Léa (coucou).
