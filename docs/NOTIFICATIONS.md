# Notifications

Qui reçoit quoi, quand, par quel canal, et les règles qui décident. Les règles sont pures et testées dans
`packages/domain/src/plateforme/notifications.ts` (`decideNotification`, `notificationTierOf`, `mergeNotificationVars`,
`emailAllowed`, `NOTIFICATION_CATEGORIES`) ; le notifieur (`apps/api/src/modules/notifications/push-notifier.ts`) les
applique ; les textes sont dans `packages/content/src/v7/notifications.ts` (fr, en, es, pt-BR, nl). Tests :
`packages/domain/src/notifications.test.ts`, `apps/api/test/notifications.e2e.test.ts`, `apps/api/test/plateforme.e2e.test.ts`.

## Règles

Dans l'ordre où le notifieur les applique :

1. **Destinataire** : aucun appareil actif ou compte suspendu → rien (un report en attente est abandonné).
2. **Personne concernée** (`about`, jamais affichée) : bloquée dans un sens ou l'autre, suspendue ou supprimée → rien
   (`Audience`, usage `group`). Les émetteurs passent `about` : message, message de groupe, nouveau lien, invitation et
   arrivée dans un groupe.
3. **Réglage** : coupé → rien, sauf pour un type **obligatoire** (`trial_reminder`, promis par le paywall).
4. **Marketing** (relance Minimoa+ `plus_account`/`winback`) : seulement avec l'**accord explicite**
   (`notification_settings.marketing_opt_in_at`, interrupteur « Offres Minimoa+ », désactivé par défaut). App Review 4.5.4.
5. **Échéance passée** (`expiresAt`, fin d'essai) → rien.
6. **Premier plan** (l'app envoie sa présence, gardée 150 s) : rien pour la conversation ouverte, rien pour ce qui
   n'est ni direct ni urgent ; un message d'une autre conversation passe et l'app le montre en bandeau discret, sans son.
   L'app cache aussi tout push qui concerne l'écran ouvert.
7. **Fenêtre locale** : `your_turn` et `streak_in_danger` de 17 h à 22 h, `needs_out` de 10 h à 21 h, **heure de la
   personne** (le minuteur qui les prépare tourne à l'heure de Paris : hors fenêtre, rien plutôt qu'« avant minuit » à 13 h).
8. **Une fois par jour** (jour local) : `daily_challenge`, `needs_out`, `streak_in_danger`, `your_turn`,
   `weekly_review`, `trial_reminder`, `together_proposal`, `first_steps`, `minimoa_news`, `link_in_danger` (par lien).
9. **Regroupement** : un report du même type et de la même conversation attend déjà → on s'y ajoute (compteurs `n`,
   `others`, personnes distinctes) au lieu d'envoyer.
10. **Heures calmes** 22 h – 8 h locales : les types reportables partent à 8 h, regroupés (tous les messages de la nuit en
    un seul push) ; les autres sont abandonnés. **Paquet du matin** : tout ce qui part à la même heure pour une personne
    (messages, signes, nouveaux liens…) part en **un seul push**, le plus important en tête (priorité, puis le plus
    ancien) avec « Et 2 autres nouvelles t'attendent dans l'app. » (`pickDigestLead`, `PushNotifier.flushDigest`). Seule exception : une échéance (`urgent`) qui tombe avant 8 h part tout
    de suite.
11. **Rafales** (`waved`, `words_received`, `new_encounter`, `group_joined`, `item_unlocked`) : après un envoi, les
    suivants pendant 60 min attendent la fin de l'heure et partent en un seul push (« Léa et 4 autres t'ont fait signe »).
12. **Décroissance** (dernière ouverture : appareil revu ou `profiles.last_active_on`) : après 2 jours sans ouvrir l'app,
    un rappel de rituel par 24 h au plus ; après 3 jours, plus aucun rappel de rituel ni d'offre. Les nouvelles du minimoa
    (3, 7, 14 jours) et tout ce qui vient des gens continuent.
13. **Plafonds** (jour local) : 3 au total pour `social`, `ritual`, `news`, `marketing` ; par priorité : social 3,
    rituels 2, nouvelles 1, marketing 1 ; les rituels et le marketing ne prennent jamais la dernière place (gardée pour
    les gens). `direct` et `urgent` : hors plafond.
14. **Délai par conversation** : un push de message (lien ou groupe) toutes les 5 minutes au plus ; après 4 pushs de la
    même conversation dans la journée, toutes les 30 minutes au plus (`conversationCooldownMinutes`). Le premier message
    qui suit de moins de 5 minutes « Léa t'a répondu » (même lien) ne sonne pas une seconde fois.

Clé d'une ligne du journal : seulement `vars.key` (celle de la décision). Un nouveau lien a une clé nulle (regroupé tous
liens confondus) ; son lien (`link_id`) sert seulement au délai ci-dessus. Le journal est gardé 8 jours (relire une
semaine d'envois).

Puis : texte dans la langue du profil (`profiles.locale`, relue à l'envoi, y compris pour un report), lien profond,
état compact des widgets, catégorie `minimoa_mute` (action « Ne plus recevoir ce genre », sauf type obligatoire),
jetons refusés désactivés (ticket immédiat ou reçu 15 min après).

### Priorités

`direct` (message, message de groupe, réponse à ton signe / nouveau lien) > `urgent` (fin d'essai, paiement refusé) >
`social` (signe, 3 mots, invitation et arrivée dans un groupe, la tenir ensemble, lien en danger, à toi d'écrire) >
`ritual` (défi, série, preuve, besoin de sortir, objets, vie d'un groupe) > `news` (bilan de la semaine, premiers pas,
nouvelles du minimoa, vie de l'abonnement) > `marketing` (relance Minimoa+).

Il n'existe pas de sortie ni de rendez-vous planifiés dans l'app : pas de notification « rendez-vous imminent ».

### Canal : push d'abord

Une notification par événement et par personne. `emailAllowed` :
- **toujours** (transactionnel, compte rendu, échéance) : bienvenue, absence de 14 jours (compte rendu, coupé avec
  `minimoa_news`), fin d'essai, Minimoa+ (bienvenue, paiement, au revoir ; la relance par e-mail est coupée avec
  `plus_account`), avertissement de modération, prévenance avant suppression ;
- **en repli** : signe reçu (`wave_received` ↔ `waved`) et nouveau lien (`link_created` ↔ `new_encounter`) ne partent
  que si la personne n'a **aucun appareil** qui reçoit les push, et si elle n'a pas coupé ce type
  (`NotificationChannels.emailAllowed`). Le nouveau lien l'applique ; le signe reçu doit l'appliquer dans
  `wave.usecase.ts` (branche `anti-spam`, qui y plafonne déjà les e-mails).

### Désinscription en un geste

Chaque type appartient à une catégorie (`NOTIFICATION_CATEGORIES`), qui est aussi une ligne de Moi › Notifications.
Sur la notification (appui long), « Ne plus recevoir ce genre » coupe toute la catégorie et ouvre les réglages.

### Présence de l'app

`POST /v1/notifications/presence { foreground, linkId?, groupId? }` : au retour au premier plan, à chaque changement
d'écran, toutes les 2 minutes au premier plan, et `foreground: false` en partant. Gardée 150 s dans le cache du
processus (avec plusieurs instances de l'API, brancher un cache partagé sur `CACHE`).

## Tableau

Q = heures calmes (R : reporté à 8 h et regroupé ; A : abandonné). Plafond : voir priorités.

| Type | Déclencheur | Destinataire | Priorité | Q | Regroupé | Texte fr (exemple) | Lien | Catégorie | E-mail |
|---|---|---|---|---|---|---|---|---|---|
| `message` | message dans un lien | l'autre | direct | R (un paquet pour la nuit) | nuit | « Léa » / « Léa t'a écrit. » ; « Messages » / « Léa et 2 autres t'ont écrit. » | `link/<id>` ou `chats` | messages | non |
| `group_message` | message de groupe, une fois jusqu'à la lecture | membres | direct | R | — | « Run » / « Léa a écrit dans le groupe. » | `groupe/<id>` | group_message | non |
| `new_encounter` | réponse à ton signe, invitation acceptée | qui avait fait signe / invité | direct | R | 60 min | « Léa t'a répondu » / « Léa a accepté ton invitation » / « Vous pouvez vous écrire. Dis-lui bonjour. » | `link/<id>` ou `chats` | encounters | repli |
| `trial_reminder` | jour 5 de l'essai (J-2), en journée ou < 12 h de la fin | abonné à l'essai | urgent, **obligatoire** | R, ou tout de suite si l'essai finit avant 8 h | — | « Ton essai Minimoa+ se termine le 20 novembre » / « Ensuite, premier paiement de 59,99 €. Pour l'éviter… » | `moi/blowy-plus` | — | toujours |
| `plus_account` | achat, renouvellement, paiement refusé, retour, fin ; relance un mois après | abonné | urgent (paiement), news, marketing (relance, sur accord) | R | — | « Le paiement de Minimoa+ n'est pas passé » … | `moi/blowy-plus` ou `pet` | plus_account | toujours (sauf relance coupée) |
| `waved` | signe reçu | la personne saluée | social | R | 60 min | « Léa te fait signe » ; « Léa et 4 autres t'ont fait signe » / « Viens voir qui c'est et réponds quand tu veux. » | `rencontres` | encounters | repli (à brancher, voir plus haut) |
| `words_received` | vote « 3 mots » | la personne décrite | social | R | 60 min | « 3 mots pour toi » ; « 4 personnes t'ont décrit » | `mots` | unlocked | non |
| `group_invite` | invitation dans un groupe | invité joignable | social | R | — | « Léa t'invite dans « Run » » | `groupe/<id>` | group_invite | non |
| `group_joined` | arrivée par le lien | membres | social | R | 60 min par groupe | « « Run » : Léa et 2 autres arrivent » | `groupe/<id>` | group_joined | non |
| `together_proposal` | proposition « la tenir ensemble » / groupe démarré | éligibles / membres | social | R | — | « Course, à plusieurs ? » | `groupe/<id>` ou `pet/habitudes` | together | non |
| `link_in_danger` | lien à 2 vies | les deux | social | R | — | « Lien avec Léa » / « Votre lien s'essouffle un peu. Un petit mot suffit à le raviver. » | `link/<id>` | danger | non |
| `your_turn` | le soir, l'autre a écrit aujourd'hui, pas toi (un envoi pour tous tes liens) | qui doit écrire | social | A ; 17 – 22 h locales | — | « Série avec Léa » / « 4 jours d'affilée. À toi d'écrire avant minuit. » | `link/<id>` ou `chats` | turn | non ; démarre l'activité en direct |
| `daily_challenge` | heure choisie (8 – 21 h locales), défi pas fait, jamais le jour de la création du minimoa (`isSignupDay`) ; app avec Ton chemin (build ≥ `APP_IOS_CHEMIN_BUILD`) : séance du jour pas faite (`step: chemin`, docs/CHEMIN.md) | chacun | ritual | A | — | « Ton défi du jour » / « Nino a préparé quelque chose pour toi. » ; Ton chemin : « Ta séance du jour t’attend » / « Nino a 5 questions pour toi. 2 minutes. » | `pet/defi` ; `chemin` | challenge | non |
| `streak_in_danger` | le soir, jour pas validé, série en jeu | personne | ritual | A ; 17 – 22 h locales | — | « Ta série de 12 jours » / « Le défi du jour est encore possible ce soir. » (Ton chemin : « Ta séance du jour… ») | `pet/defi` ; `chemin` | streak | non ; met à jour l'activité |
| `habit_proof` | heure de l'habitude | personne | ritual | A | — | « Nino voudrait voir » / « C'est l'heure de ton habitude. Une photo ? » | `pet/habitudes` | proof | non |
| `needs_out` | sociabilité basse, 10 – 21 h locales | propriétaire | ritual | A | — | « Nino a envie de sortir » | `pet` | out | non |
| `item_unlocked` | palier de série ou d'habitudes | personne (souvent dans l'app : rien) | ritual | R | 60 min | « Nouvel objet » ; « Nouveaux objets » / « Nino a gagné : casquette, et 2 autres objets. » | `pet/garde-robe` | unlocked | non |
| `group_life_lost` / `group_asleep` | jour du groupe jugé | membres | ritual | R | — | « « Run » perd une vie » | `groupe/<id>` | group_lives | non |
| `weekly_review` | bilan du dimanche soir | personne | news | A | — | « Ton bilan de la semaine » | `pet/bilans` | review | non |
| `first_steps` | J1, J2, J3, J5, J7, 11 – 20 h locales | nouveaux | news | — | — | « Nino a quelqu’un pour toi » (ou « Nino cherche des gens pour toi ») … | `rencontres`, `mots`, `pet/habitudes`, `groupe/nouveau`, `pet` | first_steps | non |
| `minimoa_news` | 3, 7, 14 jours sans ouvrir ; un mois ; chaque année | absents, anciens | news | — | — | « Nino pense à toi » / « Rien ne presse. Il te garde ta place au chaud. » | `pet` | news | à 14 jours (compte rendu) |

Activités en direct : « série d'un lien » démarrée avec `your_turn` (pas de seconde alerte iOS), finie au premier
message du jour ou à minuit local ; « défi » démarrée par l'app, mise à jour par `streak_in_danger`. Textes de l'écran
verrouillé neutres. Pastille d'icône : aucune (jamais de compteur faux).

## Textes

Courts, concrets, à la voix du minimoa quand c'est lui qui parle, sans culpabiliser ni presser, avec le prénom de la
personne concernée ; jamais le contenu d'un message, jamais une position. Variables : voir l'en-tête de
`packages/content/src/v7/notifications.ts`.
