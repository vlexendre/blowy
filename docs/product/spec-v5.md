# Spécification technique V5 — « Ton pet te trouve une bande »

Statut : **révision 7 (V5.7), 2026-11-06**. Sources produit, la plus récente gagne : `concept-v5.md` → `concept-v5.1.md` → `v5.2` → `v5.3` → `v5.4` → `v5.5` → `v5.6` §A → **`concept-v5.7.md`**. État du code : handoffs `V5-T0-T1`, `V5-T2`, `V5-B-garantie`, `V5-T3`, `V5-T4`, `V5-T5`, `V5-alignement`, `V5-T6`, `V5-T8`. Démo : `design/v5/facts.json`. Décisions : `docs/decisions.md` D-010 → D-086. Historique : §13.
Aucun code de production ici : noms, états, invariants, contrats, découpage. `[T]` = paramètre de `@blowy/tuning` (version courante `tuning-2026.12.6`), jamais codé en dur ailleurs. Les écarts entre ce document et le code sont listés **en §11.4 avec leur propriétaire** ; tant qu'un écart est ouvert, c'est ce document qui dit la cible.

Sommaire : 1 Glossaire et calendrier · 2 Modèle de domaine · 3 Visibilité · 4 Composition · 5 Pet · 6 Économie · 7 API et WS · 8 Schéma · 9 Notifications · 10 Admin, astreinte, espace lieu · 11 Tranches et écarts · 12 Questions tranchées · 13 Historique

---

## 1. Glossaire, conventions, calendrier

| Terme | Définition |
|---|---|
| Semaine (`weekKey`) | Semaine ISO dans le fuseau de la ville (`2026-W46`). Quota : une sortie par personne et par semaine, identique pour tous, non achetable. |
| Sortie | 5 personnes dont toi (4–6 admis ; amorçage ≤ 6), une ville, un lieu partenaire, un créneau, une activité, une ambiance. |
| Venir avec quelqu'un (team) | 1 à 3 personnes inscrites ensemble, unité indivisible. Libellé principal « venir avec quelqu'un » / « tes proches ». |
| Composition (`composeAt`) | **J − 3 à 21 h** (heure de la ville), glissante par jour de créneau (D-053, §1.1). |
| Confirmation (`lockAt`) | **Veille à 18 h** : effectif figé et envoyé au lieu ; lieu, prénoms, tranches, pets révélés ; fin de l'annulation gratuite. |
| Visages (`photoRevealAt`) | **J − 3 h**, filigranés au prénom du regardeur. |
| Absence | Place confirmée non honorée sans motif couvert : pas de check-in, ou annulation après la confirmation hors sortie pour raison de sécurité et hors « imprévu ». |
| Sortie pour raison de sécurité | Je pars mal à l'aise, je connais quelqu'un ici, menace, incident : **toujours possible, illimitée, sans pénalité, place remboursée** (carte ou crédit selon le financement), lieu compensé 3 € HT par Blowy ; jamais comptée dans l'imprévu (D-071). |
| Imprévu | Annulation après la confirmation pour une raison personnelle, **1 fois par mois**, sans pénalité de fiabilité, **place non remboursée**, lieu compensé comme une absence (D-056, D-072). |
| Besoin d'aide | Le bouton d'alerte (jamais « alerte » à l'écran). |
| Tranche d'âge | Grille fixe 18–21, 22–25, 26–29, 30–34, 35–39, 40–44, 45–49, 50+ (`AGE_BRACKETS_V52`). Jamais d'âge exact. |
| Astreinte | Équipe humaine joignable pendant **toutes** les heures de créneaux et de rendez-vous, mutualisée par fuseau (D-058). Formulation unique : « pendant toute ta sortie ou ton rendez-vous » — jamais « les soirs de sortie », jamais « ta position en continu » (D-074). |

Conventions : UUID v7 ; UTC en base + fuseau IANA de la ville ; Zod aux frontières, vues V5 `.strict()` ; `CommandBus` (idempotence `(actorId, operation, commandId)`, transaction, verrous ordonnés, outbox) ; erreurs `{code,message,detailsSafe,requestId,retryable}` avec le motif dans `detailsSafe.reason` ; `NOT_FOUND` pour l'objet d'autrui ; `410 GONE {reason:"RETIRED_IN_V5"}` pour les routes V4 (actif, middleware avant l'authentification). Ordre des verrous (`packages/database/src/tx.ts`) : `users → pets → relationships → neighborhoods → teams → outings → outing_seats → friendships → duos → wallets → crédits`. Aucun appel réseau sous verrou.
Montants : **prix affichés TTC** (4,99 €, 9,99 €) ; **compensations lieu exprimées HT** (TVA 20 % : 4,99 € TTC = 4,16 € HT) ; `amountCents` porte toujours le champ `taxBasis: TTC|HT`.

### 1.1 Calendrier d'une sortie (valeurs `[T] outings.cycle`)
| Moment | Ce qui se passe |
|---|---|
| Permanent | créneaux cochés, semaines off (dont « une semaine sur deux »), activités, ambiance, trajet max ; demande hebdo **automatique** |
| Vendredi 21 h de la semaine W−1 | création des demandes de la semaine W (`requestOpensAt`) ; état honnête « histoire » calculé (§2.4) |
| **J − 3, 21 h** | composition du jour J (tous les créneaux de ce jour, toute la ville) ; invitation (≤ 1 notification de proposition par semaine) avec aperçu anonyme |
| J − 2, 21 h | fin de l'invitation (`[T] inviteTtlHours` 24) ; places libérées → backfill jusqu'à la confirmation |
| dès 4 « Je viens » | `FORMING` ; chat de groupe signé par les pets |
| **J − 1, 18 h** | **confirmation** : lieu (nom, photo, adresse, trajet estimé), prénoms, tranches, pets ; effectif « table Blowy » envoyé au lieu ; « Je connais quelqu'un ici » ouvert ; ensuite annuler = absence (sauf sortie pour raison de sécurité, illimitée et remboursée, ou imprévu 1×/mois non remboursé) |
| **J − 3 h** | visages, filigranés |
| J − 30 min → J + 90 min | check-in **par code du chevalet uniquement** ; astreinte joignable ; « Je pars, mal à l'aise » |
| → + 72 h | vote d'après sur un écran ; résultats à la clôture ; action principale « Écrire à Léa » |
**Pourquoi J − 3 21 h** (D-053) : c'est l'heure des écrans (`facts.json` : composition « lundi 9 novembre, 21 h » pour le jeudi 12) ; elle garantit pour **chaque** jour de créneau (y compris le mardi soir des maquettes et du seed) : composition < fin d'invitation (J−2 21 h) < confirmation (J−1 18 h). Le code actuel (mardi 12 h pour toute la semaine) rend impossibles les sorties du mardi et du mercredi (confirmation antérieure à la composition) — écart E1 §11.4. Créneaux proposés du mardi au dimanche (`[T] cycle.slotIsoWeekdays = [2..7]`), jamais hors des heures d'astreinte.
**Délais à l'écran** (D-075) : chaque promesse de moment est calculée depuis la vraie règle pour le créneau concerné, jamais un « lundi 21 h » générique. Le serveur fournit les instants (`composeAt`, `acceptDeadline`, `lockAt`, `photoRevealAt`) et `@blowy/content` les formule : sortie du samedi → « Nino cherche ta sortie de samedi : réponse mercredi soir » (J − 3 21 h) ; « lieu et prénoms vendredi 18 h » ; « visages samedi 12 h » pour un créneau de 15 h. Test de contenu : aucun texte ne contient un jour codé en dur pour la composition.

---

## 2. Modèle de domaine

### 2.1 Ville, quartier, trajet — `neighborhoods` (livré)
`Neighborhood(slug, name, cityZoneId, timezone, status LIVE|WAITLIST|PAUSED|CLOSED, slotTemplates)`. **Aucune ville fermée** : une sortie se forme dès que 5 personnes vérifiées compatibles partagent un créneau couvert par l'astreinte et un lieu partenaire ; le statut ne change que la fréquence et le nombre de lieux ; seuls `PAUSED`/`CLOSED` refusent (`NEIGHBORHOOD_UNAVAILABLE`). Le seuil 120 est mort.
Ville et quartier saisis librement avec suggestions, **jamais de géolocalisation**. Trajet max déclaratif 20 / 30 / 45 min (défaut 30). **Temps de trajet** : table `NeighborhoodTravelTime(from, to, minutes)` maintenue par ops (transports en commun, valeur typique) ; sert à filtrer les lieux (`≤ maxTravelMinutes`) et à afficher « ≈ 25 min » sur Sortie et Confirmation (y compris banlieue → Paris). Les « quartiers acceptables » deviennent une dérivation de cette table (plus de saisie séparée, D-063).

### 2.2 Écran d'attente et indicateurs de ville — `neighborhoods` / `outings`
- `nextOutingGap` (livré) : « À Bordeaux : 64 personnes vérifiées. Sur tes créneaux, il manque 2 personnes pour la sortie du samedi 21 novembre. » + **une seule** invitation discrète, élargir créneaux/activités/trajet, Duo, carte « Aide Bordeaux à sortir » (sans chiffre personnel).
- **Indicateurs de ville** (D-059, à faire) : toujours au niveau **ville**, jamais du groupe ni du créneau ; calculés sur une **photographie quotidienne** des personnes vérifiées actives (un changement de mes préférences ne modifie les chiffres qu'au lendemain : pas d'attaque par différences) ; **affichés seulement si ≥ 10**, arrondis :
  | Vrai nombre | Affiché |
  |---|---|
  | < 10 | « pas encore assez de monde pour te le dire » |
  | 10–14 | « une dizaine » · 15–24 « une vingtaine » · 25–34 « une trentaine » · 35–94 « environ N » (N arrondi à la dizaine) · ≥ 95 « plus de 100 » puis « environ N » arrondi à 50 |
  Indicateurs : `storyCompatibleApprox` (seulement pour qui cherche une histoire : personnes de la ville qui cherchent aussi une histoire et sont réciproquement compatibles — genres recherchés, tranches pour une histoire) ; `ageBracketApprox` (personnes vérifiées par tranche de la grille). Vocabulaire unique : « **personnes vérifiées** », jamais « inscrits » (D-085). Jamais par quartier si la ville a < 3 quartiers actifs. Aucun indicateur ni promesse « histoire » avant l'écran d'intention de l'onboarding (l'étape « Tu sors où ? » ne montre que le nombre de personnes vérifiées de la ville).

### 2.3 Venue (lieu partenaire) — `neighborhoods` + espace lieu (`admin`, livré T6)
`name, photoMediaId, address, lat/lng (non transmis au client avant confirmation ; ne servent plus au check-in), activities, ambiance CALM|LIVELY, tableCap, reservationName 'Blowy', checkinSecretRef, status, contrat`. Consommation non incluse. Le lieu reçoit un groupe confirmé à J − 1 18 h sur ses créneaux, sans animation, avec astreinte Blowy, et des **compensations** (§6.5). Un **Duo au lieu partenaire = une table de 2** : réservation confirmée la veille 18 h, effectif, code ; **0 € pour le lieu, sans garantie** (aucune compensation d'absence, D-081).
**Message d'accueil du lieu** (D-080) : `Venue.welcomeMessage` (≤ `[T] venues.welcomeMessageMaxChars` 280 caractères, texte seul, sans lien ni numéro de téléphone, modéré comme un message), écrit dans l'espace lieu à partir d'un **modèle** prérempli (`venue.welcome.template` : « Bienvenue chez {lieu} ! Votre table Blowy vous attend {repère}. Demandez {prénom du responsable} si besoin. ») ; montré **seulement aux places confirmées, à partir de la confirmation** (J − 1 18 h) sur la fiche Confirmation et publié au même moment comme message système du lieu dans le chat du groupe ; jamais avant, jamais aux invité·e·s non confirmé·e·s ; absent → aucun message (pas de texte générique au nom du lieu). `VenueSlot(venueId, startsAt, activity, capacityOutings, reservedOutings)`, unique `(venueId, startsAt)`, générés seulement aux heures d'astreinte.

### 2.4 Préférences de sortie et demande hebdo — `users` / `outings` (livré, à compléter)
- `UserSlotAvailability`, `UserWeekOff` + **motif « une semaine sur deux à partir de la semaine W »** (`UserWeekOffPattern(userId, everyOtherFromWeekKey)`, D-057 ; l'écran Créneaux affiche le motif en clair, ex. « un week-end sur deux », et la composition propose les week-ends libres), `OutingPreferences(groupAgeMin/Max, activities[], maxTravelMinutes, ambiance CALM|LIVELY|ANY, showCalmBadge bool default false)` (ambiance D-055). **« Montrer au groupe : je préfère le calme »** (D-084) : option désactivée par défaut, indépendante de l'ambiance ; si activée, un badge discret « calme » s'affiche sur le pet de la personne dans le chat et la fiche du groupe, à partir de `FORMING` ; aucune autre préférence n'est jamais montrée.
- **Affiner « une histoire »** (secrets, D-060) : `storyAgeBrackets[]` (« Âge pour une histoire », tranches de la grille) et `kidsHorizon` (`IN_1_2_YEARS | IN_3_5_YEARS | NO_PLAN | DONT_KNOW`, remplace `kidsSomeday`) ; + `storySeriousness`. Servent à la composition et à l'indice « projet compatible » en Duo, rien d'autre.
- `OutingRequest(userId, weekKey, slotStartsAt[], teamId?, mode NORMAL|FRIENDS_THIS_WEEK, status, missedWeeks)` créée **automatiquement** à `requestOpensAt` (vendredi 21 h de W−1) depuis les disponibilités, sauf semaine off, pause, place active ; ajustable jusqu'à la composition du jour concerné.
- **État honnête « histoire »** (D-061, à faire) : pour qui cherche une histoire, calculé sur la **ville et ses créneaux, avant toute composition** : si le vivier `storyCompatible` sur ses créneaux de la semaine est < `[T] storyGuarantee.minCompatible` (2), la personne voit (et elle seule) : « Cette semaine, pas encore assez de personnes compatibles avec ce que tu cherches sur tes créneaux. Tu peux sortir quand même (en amitié) ou attendre la semaine prochaine. » → `mode = FRIENDS_THIS_WEEK` (composée comme « nouveaux potes » cette semaine) ou semaine off. Ne désigne personne : rien sur le groupe, rien après composition.
- Préconditions de composition : onboarding complet ; 18+ et selfie vérifiés ; photo publiée ; pas de pause ; pas de place active cette semaine.
- **Pause en 1 tap** (`POST /v1/pauses`).

### 2.5 Team et amorçage — `outings` (livré)
Team 1–3 indivisible, pas de vote interne, lien `PLUS_ONE` si présents ensemble. « Vérifié » n'est jamais affiché devant une personne qui n'a pas fait son selfie. Amorçage : team de 3 vérifiés + autre team ou personnes en attente, n'importe quelle ville (`composeSeedingOutings`), soumis à la même règle d'horaire (J − 3 21 h minimum avant le créneau).

### 2.6 Outing — `outings` (livré)
Champs : `neighborhoodId, weekKey, venueSlotId, venueId, activity, ambiance, startsAt, endsAt, status, capacity, composedAt, acceptDeadline, lockAt, photoRevealAt, checkinOpensAt, checkinClosesAt, votesCloseAt, cancelReason, compositionRunId, conversationId, tuningVersion, algoVersion`.
| De → À | Déclencheur | Garde | Effets |
|---|---|---|---|
| — → `PROPOSED` | composition J − 3 21 h / amorçage | groupe valide, créneau couvert par l'astreinte, `composedAt < acceptDeadline ≤ lockAt` | places `INVITED`, aperçu anonyme |
| → `FORMING` | « Je viens » | ≥ 4 confirmés | chat `OUTING` signé par les pets |
| backfill | place libérée | `now < lockAt` | §4.6 |
| → `CONFIRMED` | `lockAt` | ≥ 4 | effectif au lieu ; lieu + prénoms + tranches + pets + trajet ; « je connais quelqu'un » ouvert |
| → `CANCELLED` | `lockAt` | < 4 | `UNDERSIZED`, remboursements |
| `CONFIRMED → CANCELLED` | départs | < 3 avant `startsAt − 3 h` | remboursements ; « Blowy annule » : 3 € HT par place réservée |
| `CONFIRMED` (`photoRevealAt`) | | | visages |
| → `CHECKIN_OPEN` → `DONE` | horaires | | présences, absences, votes, souvenirs, fiabilité, compensations |
| `* → CANCELLED` | staff (step-up) | ≠ DONE | motif ; si déjà confirmée et motif interne : « Blowy annule » |
**« Blowy annule »** (D-079) : toute annulation par Blowy d'une sortie **déjà confirmée**, **à toute heure après la confirmation** (veille 18 h, nuit, jour J, y compris moins de 3 h avant ou après l'arrivée du groupe) et quel que soit le motif interne (sous-effectif, staff, quartier, sécurité, astreinte indisponible) → le lieu reçoit **3 € HT par place réservée** ; seule exception : le lieu est la cause (`VENUE_UNAVAILABLE`). Avant la confirmation : 0 €.
Invariants : pas de surréservation ; une place active par personne et par semaine ; jamais ensemble deux personnes liées par un blocage ou un évitement de contacts ; lieu/prénoms/tranches jamais avant `lockAt`, visages jamais avant `photoRevealAt`, et seulement aux confirmés ; **aucun créneau, aucune sortie hors des heures d'astreinte** (I-O6, D-058).

### 2.7 OutingSeat — `outings` / `economy` (livré)
Statuts `INVITED → HELD → CONFIRMED → CHECKED_IN → ATTENDED`, `NO_SHOW`, `DECLINED`, `EXPIRED`, `CANCELLED`. Financement à « Je viens », dans l'ordre : `FREE_FIRST` (1ʳᵉ sortie) → `REFERRAL_FREE` (parrainage, D-064) → `PLUS_INCLUDED` (Blowy+ actif) → `PAID` 4,99 € (Stripe / Apple Pay, hold 15 min).
| `cancelKind` | Quand | Remboursement | Fiabilité | Lieu |
|---|---|---|---|---|
| `EARLY` | avant `lockAt` | gratuite : carte remboursée ; offerte / parrainage « reste offerte » | — | rien |
| `LATE` | après `lockAt` | aucun | **absence** | compensé (§6.5) |
| `SAFETY_EXIT` — **Raison de sécurité** | à tout moment, illimitée (mal à l'aise avant ou après check-in, menace, incident) | **remboursée** : carte (`PAID`), crédit rendu (`CREDIT`), « reste offerte » (offerte, parrainage), sans objet (Blowy+) | aucun ; ne compte ni dans N ni dans M | 3 € HT par Blowy si après `lockAt` |
| **Je connais quelqu'un ici** (code : `SYSTEM_REMOVAL` ou `SAFETY_EXIT` + `KnowsSomeoneRequest.status`) | de `lockAt` à `startsAt` ; **1 fois par mois** (30 j) : déplacement vers un autre groupe du créneau si possible, sinon retrait ; au-delà : retrait remboursé, **examiné par l'équipe, jamais une absence** (`SAFETY_REVIEW`) | **remboursée** (mêmes modes) | aucun | 3 € HT par Blowy |
| `EMERGENCY` — **Imprévu** | après `lockAt`, **1 fois par mois** (`[T] outings.emergencyCancelsPerMonth = 1`, fenêtre 30 j) ; « Je ne le sens pas » = imprévu, libellé tel quel | **non remboursée** | aucun | compensé comme une absence (4,16 € HT si payée, sinon 3 € HT) |
| `SYSTEM_REMOVAL` | blocage par un autre membre | remboursée / reste offerte | aucun | 3 € HT par Blowy si après `lockAt` |
| `ACCOUNT_DELETED` | | carte remboursée | — | 3 € HT si après `lockAt` |
Au-delà du quota d'imprévu : `LATE` (absence). Il n'y a pas de quota sur la raison de sécurité. **Trois sorties distinctes** sur Les visages et la Confirmation (D-077), chacune avec **sa phrase canonique**, identique mot pour mot sur l'écran client, Tarifs et le contrat lieu (`@blowy/content` `RULES_V56`, à étendre en `RULES_V57` avec ces trois clés ; test de contenu) :
- **Raison de sécurité** — « Tu peux partir à tout moment pour ta sécurité : sans pénalité, ta place est remboursée. »
- **Je connais quelqu'un ici** — « Une fois par mois, on te change de groupe ou on te rembourse. Au-delà, l'équipe regarde avec toi : ce n'est jamais une absence. »
- **Imprévu** — « Une fois par mois, sans pénalité. Ta place n'est pas remboursée. »
Règle d'annulation générale (même texte partout) : « Annulation gratuite jusqu'à la veille 18 h. Ensuite, c'est une absence, sauf raison de sécurité, « je connais quelqu'un ici » ou imprévu. »
« Je pars, mal à l'aise » = raison de sécurité : relayé à l'astreinte (et au gardien si choisi), rappel humain visé en `[T] safety.helpCallbackTargetMinutes` (5) min, recontact au 3ᵉ en 90 j, jamais limité.

### 2.8 Chat de groupe — `conversations` (livré)
Ouvert à `FORMING`, signé par le pet de l'auteur avant `lockAt` (`MessageView.author {pet, firstName?}`), prénoms ensuite ; texte seul ; brise-glace ; « 3 mots » ; Signaler / Quitter en en-tête ; écriture jusqu'à la clôture des votes, lecture 7 j, purge 90 j.

### 2.9 Check-in — **par code uniquement** (D-062)
Fenêtre `[startsAt − 30 min, startsAt + 90 min]`. **Seule méthode : le code à 4 chiffres du chevalet** (`VENUE_CODE`, dérivé HMAC par sortie ou table duo), 5 essais puis 429 ; correction `STAFF` auditée. **Plus aucune géolocalisation, ni demandée ni acceptée** : la phrase « Position : jamais demandée » est vraie. Le groupe ne voit que « arrivé·e ». Même règle pour les RDV Duo (table de 2 au lieu partenaire).

### 2.10 Ange gardien — `safety` (livré)
Lien à jeton aléatoire haché, montré une fois, ≤ 3 par sujet, actif de −2 h à +3 h, sans compte, aucun numéro du proche stocké, Web Push optionnel. Page : prénom du propriétaire, type, date, heure, **lieu et adresse dès la confirmation**, chronologie (arrivé·e, tout va bien, besoin d'aide, parti·e mal à l'aise si choisi, terminé), numéros d'urgence, phrase à la 3ᵉ personne « Une personne de l'équipe est joignable pendant toute la sortie de {prénom} » (ou « tout le rendez-vous de {prénom} ») — jamais « ta sortie » sur une page qui n'est pas celle de la personne (D-083) ; jamais « position en continu » : seuls le lieu et l'heure sont partagés, aperçu de Blowy et ville **du contexte** (jamais une ville codée en dur). **Aucune position, jamais.** « Besoin d'aide » → page + Web Push + dossier SAFETY prioritaire + astreinte + écran 112. **Délai d'aide** (D-078) : objectif de rappel humain pendant une sortie ou un RDV `[T] safety.helpCallbackTargetMinutes = 5` ; l'écran dit « Quelqu'un de l'équipe te rappelle en quelques minutes. » ; la SLA de traitement d'un dossier reste `[T] safety.humanResponseMinutes = 60`. L'astreinte est dimensionnée pour tenir 5 min (`business-model.md`).

### 2.11 Vote d'après — `outings` (livré)
Un écran, une ligne par présent (prénom, visage), 3 pastilles Ami·e / Plus / Non pour tous, **Non par défaut**, modifiable jusqu'à la clôture ; dépouillement unique à la clôture ; `min()`, PLUS incompatible → ami·e en silence ; pas de vote dans une team ; jamais de compteur ; « Tu ne sauras jamais qui a dit non ou n'a pas voté. » **Non par défaut partout** (écran, contrat API : un présent sans choix enregistré vaut `NO`, D-082). Résultats : **action principale « Écrire à <prénom> »** (ouvre le chat bande ou duo), « Partager la soirée » en second. Souvenir : le vote d'abord, le partage n'apparaît qu'après le vote enregistré ; **aucun lien de partage sur Les visages**. Bulletins purgés 7 j après.

### 2.12 Bande et Ta rue — `connections` (livré)
`Friendship` + chat `BAND` ; « partir proprement » ; jamais la bande d'autrui. Ta rue (`GET /v1/band/street`) : pets de la bande, souvenirs rangés, offrir un accessoire gagné ; aucune jauge, notification ni pastille. « Partager Nino » (fiche du pet) : **jamais** les pets ni prénoms de la bande.

### 2.13 Duo — `connections` (livré, à aligner)
- `meetingMode` GROUP|DUO|BOTH ; jamais proposé dans l'onboarding à qui choisit « en petit groupe ».
- **Gratuit pour tous, plafond anti-spam de 3 duos actifs** (`[T] duo.maxActive = 3` ; propositions ouvertes + duos voie Duo non terminaux ; les duos nés d'un vote PLUS ne comptent pas). Blowy+ ne change rien au Duo (D-054).
- Carte de proposition avant le double oui : **espèce du pet en illustration générique + initiale** (`{species, initial}`), jamais le nom du pet, ni tranche, pronom, activités, intention, score.
- Libellé de la proposition : « Nino propose un duo avec N. » (initiale). **Le prénom apparaît au double oui, pas avant et pas plus tard** (D-082) : après le double oui : prénom, pet, tranche (jamais la fiabilité de l'autre, D-076) ; `EXCHANGE` 48 h texte ; à 48 h, si chacun a écrit ≥ 2 messages → `UNLOCKED` (visages simultanés, vocal facultatif) ; sinon `EXPIRED`. Indice « projet compatible » seulement (`storySeriousness`, `kidsHorizon` concordants).
- RDV : jamais avant les visages ; **au lieu partenaire comme table de 2**, confirmé au plus tard J − 1 18 h (`[T] duo.dateLockHourLocal = 18`) pour figurer dans l'effectif ; **jamais hors des heures d'astreinte** (412 `OUTSIDE_ONCALL_HOURS`) ; check-in par code ; ange gardien (choisi au moment de la proposition) ; « proposer un autre lieu ou une autre heure » (contre-proposition) ; absence = fiabilité, **0 € au lieu, sans garantie** (D-081). Astreinte : « pendant tout ton rendez-vous ». Après : vote, même règle.
- Phrase : « Seule une personne avec qui tu as un duo sait que vous avez dit oui tous les deux. »
- Duo homme-homme et toutes orientations traités à l'identique (Welcome : « Toutes orientations · en groupe ou à deux »).
- Œuf : seulement si les deux l'activent (interrupteurs liés), duo `TOGETHER` avec ≥ 2 RDV vécus.

### 2.14 Souvenirs — `pets` (livré)
`PetMemory` append-only ; accessoires gagnés, jamais vendus.

### 2.15 Fiabilité — `outings` (livré)
« venu·e à N sorties sur M », **visible par toi seulement** (Profil, `GET /v1/me/reliability`) ; jamais montrée aux autres participants, à la bande, aux duos, au lieu ni sur une carte (D-076). Absence = `NO_SHOW` ou `LATE` ; jamais : `EMERGENCY` (dans le quota), toute sortie pour raison de sécurité, « je connais quelqu'un » (dans ou hors quota), annulation par Blowy, blocage. La fiabilité continue d'agir en silence (pause après 2 absences, filtre `LIMIT_GHOSTER` de la composition) ; la pause n'est annoncée qu'à l'intéressé·e. 2 absences / 90 j → pause 7 j. Contestation 7 j.

### 2.16 Onboarding, confidentialité, âge — `users` (livré, à compléter)
- Une question par écran, ≤ 9 avant la Trouvée. Données requises avant composition : ville/quartier, date de naissance, pet + vision, `meetingMode`, `lookingFor`, (consentement art. 9 + genres recherchés si histoire), créneaux. **Mode discret : choix explicite « Discret » / « Normal », aucun présélectionné** (`discreetMode` nullable jusqu'au choix ; D-065). **« Éviter les personnes que je connais » proposé dans le parcours avant la 1ʳᵉ composition** (opt-in expliqué ; passer = désactivé).
- 18+ vérifié (estimation au selfie, pièce d'identité si doute, regardée par une personne puis supprimée) avant la 1ʳᵉ sortie ou le 1ᵉʳ duo.
- Intentions secrètes, consentement art. 9 avant les genres recherchés, orientation jamais stockée.
- Phrases exactes : « Si tu cherches une histoire, Blowy compose tes groupes pour qu'elle soit possible. Il ne te dira jamais avec qui. » ; « Ton orientation et ce que tu cherches ne sont montrés à personne. Seule une personne avec qui tu as un duo sait que vous avez dit oui tous les deux. » ; Confidentialité mentionne que **le lieu reçoit les prénoms la veille à 18 h**.
- **Une seule source « qui voit quoi »** : l'écran Confidentialité est généré depuis le tableau §3 (contenu `@blowy/content` `privacy.matrix.*`), **une ligne par sujet** : intentions et orientation, prénoms et visages en sortie, lieu (qui reçoit les prénoms la veille 18 h), fiabilité (toi seul·e), votes, **Duo** (initiale et espèce avant le double oui, puis prénom, visages à 48 h, « Seule une personne avec qui tu as un duo sait que vous avez dit oui tous les deux »), **Ange gardien** (prénom, heure, lieu dès la confirmation, chronologie, jamais de position ni les autres participants), contacts évités, cartes de partage. Chaque réglage n'existe qu'à un endroit, les autres écrans y renvoient.

### 2.17 Parrainage et liens de partage — `social` (à faire)
- **Parrainage** (D-064) : quand une personne arrivée par ton lien (`ShareAttribution`) vit sa **1ʳᵉ sortie** (`ATTENDED`), ta **prochaine sortie est offerte** : crédit `REFERRAL_FREE` (1 par mois calendaire de ton fuseau au plus, `[T] referral.maxFreePerMonth = 1`, non cumulable au-delà de 1 en attente). Pas de pièces, pas de tarif étudiant. Lieu compensé 3 € HT si absence.
- **Liens uniques** : `ShareLink(slug aléatoire, ownerUserId, cardKind, subjectRef, clickCount, attributedSignups, attributedFirstOutings)` — un lien par carte et par personne, jamais réutilisé, traçable ; l'écran Invite dit à quoi il sert. Cartes (`cardKind`) : `INVITE`, `CONFIRMED` (« Cette semaine je sors », sans lieu), `TEASER` (« Alors, jeudi ? », sans votes), `HERE` (« Je sors ce soir », sans quartier ni heure), `EVENING` (« On était 5 · 5 verres, 1 table »), `BAND` (« Ta bande », pets génériques), `HELP_CITY`, `TEAM`. Règles testées : jamais un prénom ni l'espèce réelle d'un pet tiers, jamais lieu ou heure en direct, chiffres justes, cartes visuellement distinctes. « Mes cartes » montre les aperçus réels ; export vidéo 5 s (pets génériques) côté client. Page « 3 mots » : slug aléatoire (livré).

---

## 3. Visibilité — qui voit quoi (source unique, reprise par l'écran Confidentialité)

**Principe V5.4–V5.5 : aucun signal sur la compatibilité du groupe**, ni positif ni négatif, ni bandeau, ni pour soi (D-066). La garantie « histoire » reste appliquée en silence. Les seuls signaux permis sont **au niveau de la ville et de mes créneaux, avant composition** (§2.2, §2.4).

### 3.1 Sortie — co-participant·e selon l'état
| Donnée sur une autre personne | PROPOSED | FORMING | CONFIRMED (J−1 18 h) | J − 3 h / check-in | DONE (votes) | après clôture | place inactive |
|---|---|---|---|---|---|---|---|
| Aperçu anonyme (taille, union des tranches, genres agrégés, nb venant avec quelqu'un) | ✓ | ✓ | ✓ | ✓ | — | — | ✗ |
| Pet (espèce, nom, accessoires, 3 traits, 3 mots) | ✓ | ✓ (auteur) | ✓ | ✓ | ✓ | liens | ✗ |
| Prénom, tranche | ✗ | ✗ | ✓ | ✓ | ✓ | liens | ✗ |
| Fiabilité « N sur M » d'autrui | **jamais** (visible par soi seulement, D-076) | | | | | | |
| Visage filigrané | ✗ | ✗ | ✗ | ✓ | ✓ | liens | ✗ |
| Ville, activité, ambiance, jour, heure | ✓ | ✓ | ✓ | ✓ | ✓ | historique | ✗ |
| Lieu (nom, photo, adresse), trajet estimé | ✗ | ✗ | ✓ | ✓ | ✓ | historique | ✗ |
| Chat | ✗ | ✓ | ✓ | ✓ | jusqu'à clôture | lecture 7 j | ✗ |
| « ne pourra pas venir » | ✗ | ✓ (pet) | ✓ (prénom) | ✓ | — | — | ✗ |
| « arrivé·e » | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Badge « je préfère le calme » (si la personne l'a activé) | ✗ | ✓ (sur le pet) | ✓ | ✓ | ✓ | ✗ | ✗ |
| Message d'accueil du lieu | ✗ | ✗ | ✓ (fiche + chat) | ✓ | ✓ | historique | ✗ |
| Tout signal de compatibilité du groupe (garantie, « sortie entre amis pour toi », `storyMatch`) | **jamais, pour personne** | | | | | | |
| Absence, imprévu, sortie pour raison de sécurité, motif, retrait, « je connais quelqu'un », « mal à l'aise » | jamais (seulement « ne pourra pas venir », identique pour tous les motifs) | | | | | | |
| Position | jamais (jamais demandée) | | | | | | |
| Votes, compteurs, « non » | jamais ; accords : les deux seuls, à la clôture | | | | | | |
| Financement, Blowy+, parrainage, intentions, genres recherchés, âge exact | jamais | | | | | | |
Règle générale affichable : « Jamais plus de 3 personnes du même genre dans un groupe. »

### 3.2 Autres acteurs
| Donnée | Moi | Bande | Duo proposé | Duo EXCHANGE | Duo UNLOCKED+ | Ange gardien | Lieu | Cartes/public | support | ops | trust_lead | finance | analyst |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Prénom | ✓ | ✓ | **initiale** | ✓ | ✓ | propriétaire | ✓ dès J−1 18 h (« table Blowy ») | jamais d'un tiers | ✓ | ✓ | ✓ | fiche | ✗ |
| Pet | ✓ | ✓ | **espèce générique** | ✓ | ✓ | ✗ | ✗ (illustrations décoratives) | génériques | ✓ | ✓ | ✓ | ✗ | agrégats |
| Visage | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | jamais | modération | ✗ | ✓ | ✗ | ✗ |
| Tranche | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | agrégats |
| Fiabilité | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | agrégats |
| Sortie (lieu, heure) | ✓ | ✗ | ✗ | ✗ | ✗ | la sienne | la sienne | jamais en direct | ✓ | ✓ | ✓ | ✓ | agrégats |
| Check-in, tout va bien, besoin d'aide, mal à l'aise | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ (sans position) | ✗ | ✗ | ✓ | ✓ | ✓ + astreinte | ✗ | agrégats |
| Bulletins | les miens | jamais pour tout autre acteur | | | | | | | | | | | |
| Intentions, genres, sous-choix | ✓ | jamais | jamais | jamais | « projet compatible » | jamais | jamais | jamais | jamais | jamais | jamais | jamais | indicateurs de ville ≥ 10 arrondis |
| Paiements, Blowy+, parrainage | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | relevé agrégé par soirée | ✗ | statut | ✗ | ✗ | ✓ | agrégats |
| Contacts évités | effet seul | jamais pour tout autre acteur | | | | | | | | | | | |

### 3.3 WS
Salles `user:`, `outing:`, `duo:`, `conversation:` (livrées). Aucun événement à la saisie d'un vote ; révélations à la clôture ; curseur par projection.

---

## 4. Composition (`packages/matching/src/groups`, livré ; `algoVersion groups-2026.12.2`)

### 4.1 Périmètre et entrées
**Une exécution par (ville, jour de créneau) à J − 3 21 h** (`CompositionRun(scope, slotDate, kind ROLLING|SEEDING)` unique — remplace `(scope, weekKey, WEEKLY)`). Candidats : demandes `OPEN` de la semaine disponibles ce jour-là, non placées. Une personne disponible mardi et jeudi est d'abord candidate le mardi ; si elle n'est pas placée, elle reste candidate le jeudi (priorité inchangée). Entrées : profil de matching, `lookingFor` (ou `FRIENDS_THIS_WEEK`), `meetGenders`, `romanceGenders`, `storyAgeBrackets`, tranche et `groupAge`, créneaux, activités, **ambiance**, temps de trajet vers chaque lieu (`NeighborhoodTravelTime`), team, présences, priorité. Le financement n'est pas une entrée.

### 4.2 Contraintes dures par paire
`SELF`, `NOT_ADULT`, `NOT_VERIFIED`, `INACTIVE_ACCOUNT`, `AGE_PREFERENCE`, `MEET_GENDER`, `BLOCKED_OR_REPORTED`, `MET_BEFORE`, `KNOWN_CONTACT` (évitement de contacts, à faire), `LIMIT_GHOSTER`. `storyCompatible(a,b)` : les deux cherchent une histoire (et pas `FRIENDS_THIS_WEEK`), genres réciproques, tranche de chacun dans les `storyAgeBrackets` de l'autre (repli `groupAge` si non renseigné).

### 4.3 Objectif et contraintes de groupe
`J = 1000·mean(w) + λr·romCov + λf·friendFit + λstory·storyCov − λamb·ambianceMismatch − λs·|5 − |G||` ; garantie silencieuse (≥ 2 `storyCompatible` visés, λ 16 000, objectif pas contrainte ; **aucune sortie d'information**, `friendsOnly` reste un diagnostic interne agrégé). Contraintes dures : 4–6 ; jour, créneau, activité communs ; **lieu dans le trajet max de chaque membre** ; **ambiance du lieu compatible** avec chaque membre (`CALM` jamais dans un lieu `LIVELY` et inversement ; `ANY` partout) ; team ensemble ; « histoire seulement » ≥ 1 `storyCompatible` ; **≤ 3 du même genre** (livré, exception groupe non mixte demandé). Mélange calme/animé dans un groupe : pénalité douce `[T] composition.lambdaAmbiance`.

### 4.4 Procédure
Glouton par graine et créneau → réparation → échanges (≤ 200 passes) → non placés (motifs internes). Amorçage : `outings.seeding` (15 min) mais une sortie d'amorçage ne peut être créée qu'au plus tard à J − 3 21 h de son créneau. Simulateur : placement 76,7 % (300) / 80,3 % (600) avec la contrainte de genre.

### 4.5 Éviter les personnes que je connais (livré par C, module `users`, protocole `oprf-p256-v1`)
Opt-in avant la 1ʳᵉ composition (`GET /v1/me/contact-avoidance` → `askBeforeFirstOuting`). **Aucun numéro ni condensé de numéro en clair côté serveur.**
1. Son numéro : `POST /v1/me/contact-avoidance {phoneVerificationToken}` (ID token Firebase d'une connexion SMS ; `local-phone:+33…` hors production) → le serveur calcule en mémoire `T = x(k·H2C(e164))` (P-256, clé `k` dérivée de `CONTACT_AVOIDANCE_SECRET`) et ne garde que `PhoneIdentity.tokenDigest = HMAC(clé, T)`. « Non merci » : `POST …/decline`.
2. Ses contacts, sur l'appareil : `H2C(e164)` (essai-incrément, x = SHA-256("blowy-contact-v1|" ‖ e164 ‖ "|" ‖ i)) ; sel aléatoire `r` propre à la personne et au lot → `B = r·H2C(e164)` → `POST …/evaluate {blinded[≤2000]}` → `x(k·B)` → l'appareil retire son sel : `T = x(r⁻¹·k·B)`.
3. `POST …/contacts {tokens[≤2000]}` → `{accepted}` (identique quel que soit le nombre de correspondances) ; comparaison `HMAC(clé, T)` ↔ `PhoneIdentity`, seules des `AvoidPair` symétriques restent ; jetons jetés, jamais journalisés (ni dans l'idempotence).
4. Effets : filtre dur `KNOWN_CONTACT` (composition, backfill, voie Duo ; jamais dans une team), examen auto de « je connais quelqu'un ». Retrait (`DELETE`) = numéro et paires effacés. Limite : une paire n'est trouvée que si le contact est déjà inscrit à l'envoi (l'appareil renvoie ses contacts périodiquement).

### 4.6 Backfill
Jusqu'à `lockAt`, invitation `min(now + 12 h, lockAt)`. Après : seulement le déplacement « je connais quelqu'un ».

### 4.7 Tests à ajouter (B)
Ambiance (dur au lieu, doux au groupe) ; trajet ; `KNOWN_CONTACT` ; composition glissante (une personne mardi+jeudi placée une seule fois ; même résultat quel que soit l'ordre des jours) ; `FRIENDS_THIS_WEEK`.

---

## 5. Pet (`@blowy/pet-engine/v5`, livré)
`reduceV5` (souvenirs, accessoires, sans jauge ni perte) ; V4 isolé dans `/v4`. Accessoires gagnés : souvenirs, cadeau de la bande ; **l'accessoire de parrainage disparaît** (le parrainage offre une sortie, D-064) et `ACCESSORY_GRANTED{source:REFERRAL}` devient mort. Taille du pet sur l'Accueil : réglage client. Le pet n'est jamais nommé au bar (réservation « Blowy »).

---

## 6. Économie V5

### 6.1 Fournisseurs (D-054)
| Élément | V5.5 |
|---|---|
| **Places** | **Stripe** (Apple Pay / Google Pay / carte), `PaymentIntent`, hold 15 min — service consommé hors de l'app |
| **Blowy+** | **Stripe Billing** (abonnement), payé par Apple Pay / carte — abonnement **aux sorties uniquement**, sans fonction numérique ; plus de commission Apple |
| RevenueCat | **désactivé pour Blowy+** (code conservé, `BILLING_PROVIDER_PLUS=STRIPE`) ; webhooks RevenueCat ignorés si non configurés |
| `LOCAL_DEMO` | gardé hors production pour places et abonnement |
| Ledger pièces | gelé |
| Journal économique | port `EconomyJournal` sur `DomainEvent` append-only (décision C, livré) ; tables `Payment` / `VenueCompensation` créées quand la finance en aura besoin (même port) |
À revalider juridiquement avant soumission (règles des stores pour un abonnement à un service physique).

### 6.2 Produits et prix (affichés TTC)
| Produit | Prix | Contenu |
|---|---|---|
| 1ʳᵉ sortie | offerte | `FREE_FIRST` à la 1ʳᵉ vérification 18+ |
| Sortie offerte par parrainage | offerte | `REFERRAL_FREE`, ≤ 1 par mois |
| Place | **4,99 € TTC** (4,16 € HT), consommation non incluse | une sortie |
| **Blowy+** | **9,99 € TTC/mois** | **toutes tes sorties** (1 par semaine, quota inchangé) ; **rentable dès la 3ᵉ sortie payée du mois** (2 × 4,99 € = 9,98 € < 9,99 €, D-074) ; rien d'autre |
| Duo | **gratuit pour tous**, ≤ 3 actifs | — |
| Accessoires | jamais vendus | — |
Interdits (tests de contrat) : aucun produit ne touche composition, priorité, visibilité, quota, score, votes ou Duo ; pas de paywall ni d'argument Blowy+ dans l'onboarding ; pas d'offre limitée, compte à rebours, offre hebdo, rétention, tarif étudiant. **Résiliation dans l'app** (Stripe : `POST /v1/subscriptions/plus/cancel`, effet en fin de période, sans écran de rétention).

### 6.3 Droits
`ENTITLEMENT_KEYS_V5 = [PLUS_INCLUDED_OUTINGS]` ; `PLUS_UNLIMITED_DUOS` **mort**. Source : `Subscription(provider STRIPE)` mise à jour par webhook Stripe (`customer.subscription.*`, `invoice.paid`, `invoice.payment_failed` → période de grâce), idempotent par `event.id`, réconciliation périodique. Expiration : places déjà confirmées conservées.

### 6.4 Remboursements
| Cas | `PAID` | offerte (`FREE_FIRST`, `REFERRAL_FREE`) | `PLUS_INCLUDED` |
|---|---|---|---|
| Blowy annule (avant ou après confirmation) | carte | reste offerte | — |
| Annulation avant J−1 18 h | carte | reste offerte | — |
| Retrait système ; **sortie pour raison de sécurité, à tout moment, illimitée** (y compris « je connais quelqu'un » hors quota) | carte (crédit rendu si `CREDIT`) | reste offerte | — |
| Paiement tardif / sortie pleine | carte | — | — |
| Après J−1 18 h : absence, imprévu | aucun | consommée | consommée |
| Suppression de compte | carte | perdue | — |
Une seule fois par place, `Idempotency-Key refund:<seatId>` ; jamais « remboursé·e » pour une place offerte.

### 6.5 Compensation du lieu (montants HT, D-067)
| Cause (après la confirmation, sortie ou table Duo) | Montant au lieu |
|---|---|
| Absence ou imprévu, place `PAID` | **4,16 € HT** (le prix de la place hors taxe) |
| Absence ou imprévu, place offerte / parrainage / Blowy+ | **3 € HT** versés par Blowy |
| **Table Duo** (absence, annulation tardive, sécurité) | **0 €, sans garantie** (D-081) |
| **Blowy annule** une sortie confirmée, **à toute heure après la confirmation**, quel que soit le motif interne | **3 € HT par place réservée** |
| **Raison de sécurité** (avant ou après check-in), **je connais quelqu'un ici** (dans ou hors quota), retrait système, suppression de compte | **3 € HT par Blowy** (jamais le prix de la place, puisqu'elle est remboursée) |
| Le lieu est la cause (`VENUE_UNAVAILABLE`) | 0 |
| Avant la confirmation | 0 |
Formulation identique côté client, contrat et relevé : « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée. » **Relevé sur le mois civil** (du 1ᵉʳ au dernier jour, fuseau du lieu, D-086), détaillé par soirée : places réservées, présences, absences, imprévus, annulations Blowy, compensation par ligne, total HT ; aucun prénom ni financement individuel ; contre-passation sur contestation acceptée. Paiement mensuel (aucun virement hebdo annoncé).

---

## 7. API /v1

Contrats : `packages/api-contract/src/{neighborhoods,outings,teams,connections,safety,payments,economy,notifications,venue,admin-v5,events-v5}.ts`. « livré » = existe ; « à aligner » / « à faire » → §11.4.

### 7.1 Ville, profil, préférences
| Opération | Route | Notes | État |
|---|---|---|---|
| (req.) | `GET /v1/neighborhoods?q=` | | livré |
| `me.set_neighborhood` | `PUT /v1/me/neighborhood` | | livré |
| (req.) | `GET /v1/me/neighborhood` | `{neighborhood, cityVerifiedApprox, nextOutingGap?}` | à aligner (arrondi) |
| (req.) | `GET /v1/me/city-insights` | `{storyCompatible?: {label} \| {notEnough:true}, ageBrackets[{bracket, label}]}` (≥ 10, arrondis, photographie quotidienne) | à faire |
| `me.update_intentions` | `PUT /v1/preferences/intentions` | `+ storyAgeBrackets[], kidsHorizon` (`kidsSomeday` déprécié) | à aligner |
| `me.update_outing_preferences` | `PUT /v1/preferences/outings` | `+ ambiance, weekOffPattern{everyOtherFromWeekKey}` ; `acceptableNeighborhoodIds` déprécié (dérivé du trajet) | à aligner |
| `me.update_privacy` | `PUT /v1/preferences/privacy` | `discreetMode: boolean` obligatoire au 1ᵉʳ passage (null = non choisi) | à aligner |
| `me.contacts_avoid.*` | `POST\|DELETE /v1/me/contact-avoidance`, `POST …/contacts` | | à faire |
| `me.complete_onboarding` | `POST /v1/me/onboarding/complete` | `missing += DISCREET_CHOICE` | à aligner |
| pause | `POST /v1/pauses`, `DELETE /v1/pauses/:id` | | livré |

### 7.2 Sorties et teams
| Opération | Route | Notes | État |
|---|---|---|---|
| (req.) | `GET /v1/outings/week` | `{phase, myOutingId?, nextOutingGap?, storyFeasibility?: 'NOT_ENOUGH_ON_SLOTS' (moi seul·e, avant composition), composeAt (prochaine composition qui me concerne)}` | à aligner |
| `outings.request` | `PUT\|DELETE /v1/outings/requests/:weekKey` | `+ mode: NORMAL\|FRIENDS_THIS_WEEK` | à aligner |
| (req.) | `GET /v1/outings/:id` | `OutingView` §7.5 | livré, à aligner (`storyMatch` retiré, `travelMinutes`, `ambiance`) |
| `seat.accept` / `decline` | `POST …/seat/accept\|decline` | financement + `REFERRAL_FREE` | livré, à aligner |
| `seat.cancel` | `POST …/seat/cancel {kind: CANT_MAKE_IT\|EMERGENCY\|SAFETY}` ; `GET …/seat/cancel-preview` → `{cancelKind, refund CARD\|STAYS_FREE\|NONE, countsAsAbsence, emergencyAvailable}` | `EMERGENCY` hors quota → 412 `EMERGENCY_QUOTA` | livré (EMERGENCY), à aligner (1/mois) |
| `seat.knows_someone` | `POST …/seat/knows-someone` | 1×/30 j | livré |
| `outings.leave_uncomfortable` | `POST /v1/outings/:id/leave-uncomfortable` | | livré (E) |
| `outings.check_in` | `POST …/check-in {code}` | **code seul** ; tout champ de position → 400 `VALIDATION_FAILED` | à aligner |
| votes | `GET\|PUT /v1/outings/:id/votes` | résultats → `writeTo{conversationId}` par accord | livré, à aligner (lien d'écriture) |
| autres | `attendance/dispute`, `history`, `me/reliability`, `/v1/teams/*` | | livré |

### 7.3 Bande, duos
| Opération | Route | Notes | État |
|---|---|---|---|
| bande | `GET /v1/band`, `GET /v1/band/street`, `POST /v1/band/:linkId/leave`, `POST /v1/band/:linkId/gift` | | livré / gift à faire |
| (req.) | `GET /v1/duo-lane` | `{enabled, quota{maxActive:3, active}, proposals[{id, species, initial, expiresAt}]}` | à aligner |
| propositions | `POST /v1/duo-lane/proposals/:id/accept\|pass` | 409 `DUO_LIMIT_REACHED` (3) | à aligner |
| duos | `GET /v1/duos`, `/:id`, `/:id/venues` | `/venues` : lieux partenaires + créneaux **dans les heures d'astreinte** | à aligner |
| RDV | `POST /v1/duos/:id/dates`, `…/respond\|cancel\|check-in`, `PUT …/vote` | 412 `OUTSIDE_ONCALL_HOURS`, `DATE_TOO_LATE_TO_RESERVE` (après J−1 18 h) ; check-in par code | à aligner |
| départ, œuf | `POST /v1/duos/:id/leave`, `PUT /v1/duos/:id/egg` | | livré |

### 7.4 Sécurité, argent, partage, notifications
| Opération | Route | Notes | État |
|---|---|---|---|
| gardien | `/v1/safety/guardian-links`, `/v1/safety/ok`, `/v1/safety/status`, `/v1/public/guardian/:token(/push)` | page sans position, ville du contexte | livré |
| besoin d'aide | `POST /v1/safety/alerts {subject}` | position refusée (400) plutôt qu'ignorée | à aligner |
| astreinte | `GET /v1/safety/oncall?at=` (public authentifié) → `{covered:true, responseMinutes:60}` | | à faire |
| produits | `GET /v1/purchases/products` | `{seat{amountCents:499, taxBasis:'TTC'}, plus{amountCents:999, provider:'STRIPE'}, firstOutingFree}` | à aligner |
| Blowy+ | `POST /v1/subscriptions/plus/checkout` → `{clientSecret}` · `POST /v1/subscriptions/plus/cancel` · `GET /v1/subscriptions/me` | | à faire |
| webhooks | `POST /v1/webhooks/stripe` (places + abonnement) | | livré (places), à étendre |
| partage | `POST /v1/share-links {cardKind}` → nouveau lien · `GET /v1/public/s/:slug` | | à faire |
| parrainage | `GET /v1/referrals/me` → `{nextOutingFree: bool, thisMonthUsed: bool}` | | à aligner |
| notifications | `PUT\|DELETE /v1/me/push-token`, `GET\|PUT /v1/me/notifications/settings` | | livré |

### 7.5 `OutingView`
```
{ id, status, weekKey, city, neighborhood{name}, activity, activityChosenBy: 'YOU'|'VENUE_AND_GROUP', ambiance,
  startsAt, endsAt, capacity, confirmedCount, preview{size, ageMin, ageMax, genders, withSomeone},
  mySeat{status, funding?, holdExpiresAt?, acceptDeadline?, emergencyAvailable?},
  timeline{composedAt, acceptDeadline, lockAt, photoRevealAt, checkinOpensAt, checkinClosesAt, votesCloseAt},
  venue?{name, photo, address, reservationName:'Blowy', travelMinutes},       // dès lockAt ; plus de lat/lng
  oncall{covered:true},
  members[{userId, pet, threeWords, firstName?, ageRange?, face?, arrived?, notComing?}],   // plus de reliability (D-076)
  knowsSomeoneAvailable?, conversationId?, votes?, cancelled? }
```
Supprimés : `storyMatch`, `venue.lat/lng` (inutiles sans géolocalisation), `members[].reliability`. Même retrait dans `DuoView.other` et les vues de bande (`connections.ts`). `activityChosenBy = VENUE_AND_GROUP` → « activité choisie selon le lieu et vos envies ».

### 7.6 WS
Livrés : `outing.*`, `connection.revealed`, `band.updated`, `duo.updated`, `reliability.updated`, `pet.updated`, `team.member_joined`, `safety.alert_ack`, `access.revoked`. Ajout : `referral.next_outing_free`.

### 7.7 Jobs
`outings.auto_requests` (vendredi 21 h W−1 ; aujourd'hui horaire pendant la fenêtre lundi–mardi → à aligner) · **`outings.compose`** (toutes les 5 min, exécute chaque (ville, jour) dont `composeAt = J − 3 21 h` est passé et sans run) · `outings.seeding` · `outings.lifecycle` · `outings.purge` · `neighborhoods.generate_slots` (seulement aux heures d'astreinte) · `neighborhoods.city_insights` (quotidien, photographie) · `duos.lifecycle` · `economy.*` · `notifications.plan` (60 s, livré).

---

## 8. Schéma

### 8.1 Migrations appliquées (ne jamais réécrire)
`…_init`, `…_constraints`, `…_trust_media_ai`, `20261106120000_v5_enums`, `20261106120100_v5_outings`, `20261106130000_v5_2`, `20261106140000_v5_safety`, `20261106170000_v5_connections`, `20261106180000_v5_align` (index `DomainEvent`), **`20261107090000_v5_4`** (`EMERGENCY`, `discreetModeChosenAt`, `alternateWeeksOffFrom`, `Subscription.providerCustomerRef`, `PhoneIdentity`, `AvoidPair`), **`20261107100000_v5_5_enums`** (`ROLLING`, `REFERRAL_FREE`, `Ambiance`, `OutingRequestMode`), **`20261107100100_v5_5`** (`CompositionRun.slotDate`, `Venue.ambiance`, `OutingPreferences.ambiance`, `OutingRequest.mode`, `SafetyOnCallShift`, `CityInsightSnapshot`, `ReferralReward`), **`20261107120000_v5_6_enums`** (`KnowsSomeoneStatus += SAFETY_REVIEW`, `KidsHorizon`, `ShareCardKind`), **`20261107120100_v5_6`** (`MatchPreferences.storyAgeBrackets/kidsHorizon`, `OutingPreferences.alternateWeekendsOffFrom`, `NeighborhoodTravelTime`, contrat bilatéral sur `Venue`, `DuoDate.venueSlotId/reservationLockedAt`, `ShareLink`, `ShareAttribution`, tables de l'espace lieu + reprise des événements).

### 8.2 Prochaine migration `…_v5_5` (additive, C ; enums dans un fichier séparé)
| Objet | Contenu |
|---|---|
| `NeighborhoodTravelTime` | `fromNeighborhoodId, toNeighborhoodId, minutes CHECK > 0`, UNIQUE (from, to) |
| `Venue` | `ambiance CALM\|LIVELY`, `photoMediaId`, `contractVersion`, `contractSignedAt`, `contractSignerName`, `blowySignedAt` (contrat bilatéral) |
| `OutingPreferences` | `ambiance CALM\|LIVELY\|ANY default ANY` |
| `UserWeekOffPattern` | `userId UNIQUE, everyOtherFromWeekKey` |
| `MatchPreferences` | `storyAgeBrackets text[]`, `kidsHorizon` ; `kidsSomeday` mort |
| `PrivacySettings.discreetMode` | rendre nullable « non choisi » : nouvelle colonne `discreetChosenAt timestamptz` (la colonne booléenne existante reste) |
| `OutingRequest` | `mode NORMAL\|FRIENDS_THIS_WEEK` |
| `CompositionRun` | `slotDate date` ; nouvel index unique `(scope, slotDate, kind)` ; l'ancien unique `(scope, weekKey, kind)` reste pour les runs historiques `WEEKLY` (les nouveaux runs `ROLLING` portent `weekKey` + `slotDate`) |
| `OutingSeat` | `funding += REFERRAL_FREE` (enum) ; `cancelKind` déjà `EMERGENCY` |
| `SafetyOnCallShift` | `timezone, startsAt, endsAt, teamLabel, phoneRef`, INDEX (timezone, startsAt) — mutualisé par fuseau, pas par ville |
| `ShareLink`, `ShareAttribution` | §2.17 |
| `ReferralReward` | `referrerUserId, refereeUserId UNIQUE, period 'YYYY-MM', creditEntryId`, UNIQUE (referrerUserId, period) |
| `PhoneIdentity`, `AvoidPair` | §4.5 |
| `VenuePartnerAccess`, `VenuePartnerMfa`, `VenueWeekday`, `VenueClosure`, `VenueIncident` | remplacent le stockage provisoire sur `DomainEvent` (T6) |
| `CityInsightSnapshot` | `cityZoneId, day, payload jsonb (comptes bruts, accès serveur seulement)`, UNIQUE (cityZoneId, day) ; purge 30 j |
| `DuoDate` | `venueSlotId?`, `reservationLockedAt` (table de 2 dans l'effectif) |

### 8.3 Devient mort
V4 (inchangé) + V5 : `Neighborhood.densityThreshold`, `UserAcceptableNeighborhood` (dérivé du trajet), `OutingCheckInAttempt.method = GEO` et le chemin GEO, `Venue.lat/lng` pour le check-in (gardés pour ops), `SafetyAlert` colonnes de position, `PLUS_UNLIMITED_DUOS`, Blowy+ RevenueCat (`Subscription.provider = REVENUECAT` pour Blowy+), `duo.maxActiveFree`, `MatchPreferences.kidsSomeday`, `accessories.referralAccessoryId`, `OutingView.storyMatch`, runs `WEEKLY`, tuning `cycle.requestClosesIsoWeekday/HourLocal`.

### 8.4 Rétention (E reporte dans `docs/privacy/retention.md`)
Position : jamais demandée ni stockée. Empreintes de contacts : jamais stockées. `CityInsightSnapshot` : 30 j, jamais exposé brut. `ShareLink` : 13 mois. Le reste inchangé (bulletins 7 j, chat 7/90 j, gardien 30 j, paiements durée comptable).

---

## 9. Notifications (livré T8)
Catalogue T8 conservé. Ajustements V5.5 : `outing.invited` part à J − 3 21 h (au plus une par semaine) ; `outing.confirmed` (J−1 18 h) rappelle la règle d'annulation unique et l'astreinte ; nouveau `referral.next_outing_free` ; supprimés : tout texte de compatibilité. Rythme : 3/jour (4 le jour d'une sortie ou d'un RDV), heures calmes 23 h–8 h, rien entre deux sorties hors messages et transactionnels, rien pendant une pause. Mode discret : titre « Rappel », corps `{heure}` seul.

---

## 10. Admin, astreinte, espace lieu

### 10.1 Staff (livré T6, compléments)
Villes (statut, créneaux types, **temps de trajet entre quartiers**), lieux (ambiance, contrat bilatéral), sorties, « je connais quelqu'un », présences, sécurité, finance (relevés par soirée), partage (attribution agrégée), tuning, dashboard. **Astreinte** (trust_lead + ops) : planning `SafetyOnCallShift` par fuseau ; la génération des créneaux et la proposition de RDV Duo refusent toute heure non couverte ; alerte ops si un créneau publié perd sa couverture (le créneau est retiré s'il n'a pas de sortie, sinon escalade). Rappel pendant une sortie visé ≤ `[T] safety.helpCallbackTargetMinutes` (5) ; traitement de dossier ≤ `[T] safety.humanResponseMinutes` (60). Le point mort de l'astreinte se calcule sur le volume national du soir (`business-model.md`).

### 10.2 Espace lieu (livré T6 : royaume distinct `/lieu`, sessions et MFA propres)
1. **Contrat bilatéral** d'une page, signé par le lieu **et** par Blowy (`contractSignedAt`, `blowySignedAt`), clause de responsabilité : Blowy = sélection, vérification, astreinte ; lieu = service et sécurité du lieu. Le contrat **nomme les quatre cas** avec les phrases canoniques : raison de sécurité (3 € HT), imprévu (place reversée : 4,16 € HT si payée, sinon 3 € HT), « Blowy annule » (3 € HT par place réservée, à toute heure après la confirmation), table Duo (0 €, sans garantie).
2. **Créneaux et plafond de tables** (créneaux limités aux heures d'astreinte).
3. **Effectif sur toute la semaine** (D-086) : la semaine civile en cours **et** la suivante, **tous les jours de créneaux** du lieu (y compris « aucune table ce jour-là ») ; par table : nombre de places dès la composition, puis « table Blowy », prénoms seulement et code du chevalet **à partir de la confirmation** (veille 18 h) ; tables de 2 (Duo) comprises.
4. **Message d'accueil** : éditeur à partir du modèle, aperçu tel que le groupe le verra, rappel « visible par le groupe à la confirmation, la veille à 18 h ».
5. **Relevé** sur le mois civil, détaillé par soirée (§6.5).
6. **Signaler un participant** (motif `ON_SITE_INCIDENT` côté trust, livré).

---

## 11. Tranches

### 11.1 Ownership
A domaine/core/décisions · B matching/tuning/pet-engine/content · C prisma, neighborhoods, outings, conversations, pets, users · C2 connections · G economy, notifications · E safety, trust, media, privacy · F admin, web, social (partage, parrainage) · D mobile · H parcours/QA · designer `design/v5`.

### 11.2 État
| Tranche | État | Reste (V5.5) |
|---|---|---|
| T0 A | livré | constantes V5.5 (§11.4) |
| T1 B | livré + garantie + genre | ambiance, trajet, composition glissante, `FRIENDS_THIS_WEEK`, `storyAgeBrackets`, `cityInsights` pur, `KNOWN_CONTACT`, tuning V5.5 |
| T2 C | livré + alignement V5.3 | calendrier J − 3 21 h, check-in par code, `storyMatch` retiré, imprévu 1/mois, préférences V5.5, migration `…_v5_5`, indicateurs, état honnête |
| T3 G | livré (places Stripe, Blowy+ RevenueCat) | Blowy+ Stripe Billing, résiliation dans l'app, compensations HT et « Blowy annule », parrainage `REFERRAL_FREE` |
| T4 E | livré | astreinte (planning, contrôle), alerte sans position (refus), évitement de contacts, filigrane serveur, 18+ |
| T5 C2 | livré + quota | 3 duos pour tous, carte espèce + initiale, RDV table de 2 (lieu, astreinte, J−1 18 h, code) |
| T6 F | livré (staff V5 + espace lieu) | contrat bilatéral, relevé par soirée, trajets, liens de partage, pages web ville du contexte |
| T8 G | livré | ajustements §9 |
| T7 D | en cours | coder contre §7 |
| H | parcours V4 réécrits en V5 (alignement) | parcours V5.5 ci-dessous |
Parcours V5.5 à écrire (H) : **`mardi-soir-a-paris`** (composition J − 3 21 h pour un mardi, confirmation après composition, invitation unique de la semaine) · **`claire-a-un-imprevu`** (imprévu après 18 h : pas de pénalité, pas de remboursement, lieu compensé ; 2ᵉ imprévu du mois = absence) · **`yanis-a-marseille`** (état honnête avant composition, « sortir en amitié », aucun signal ensuite ; indicateurs de ville < 10 masqués, ≥ 10 arrondis) · **`check-in-sans-position`** (code seul, position refusée partout, page gardien et alerte sans position) · **`duo-a-la-table-de-deux`** (3 duos gratuits, carte espèce + initiale, RDV hors astreinte refusé, table de 2 dans l'effectif, absence : 0 € au lieu, sans garantie) · **`alex-parraine-sarah`** (1ʳᵉ sortie vécue de Sarah → prochaine sortie d'Alex offerte, 1 par mois) · **`blowy-annule-jeudi`** (sortie confirmée annulée : remboursements carte, lieu 3 € HT par place, relevé par soirée) · **`blowy-plus-stripe`** (abonnement, toutes sorties, résiliation dans l'app sans rétention, Duo inchangé) · balayage **`fuite-zero-v55`** (aucun champ de compatibilité de groupe, aucune position, cartes sans tiers).

### 11.3 Règles
Contrat avant implémentation ; inter-modules par outbox ; « terminé » = build, typecheck, lint, unitaires, intégration ×2, migrate + seed base vierge (diff nul), parcours ×2, handoff, ligne d'intégration.

### 11.4 Écarts code ↔ spec (révision 7, propriétaire)
| # | Écart constaté dans le code | Cible V5.5 | Propriétaire | Statut serveur (C, `V5-4-backend.md`) |
|---|---|---|---|---|
| E1 | **Composition hebdo mardi 12 h** (`cycle.requestClosesIsoWeekday = 2`, `requestClosesHourLocal = 12`, `jobs.composeWeekly`) pour toute la semaine ; le seed a un créneau **mardi 19 h 30** (Paris) dont la confirmation (lundi 18 h) précède la composition → `acceptDeadline = lockAt` dans le passé, sortie impossible ; les écrans disent « lundi 21 h » pour le jeudi | **Composition glissante à J − 3 21 h par (ville, jour)** ; tuning `cycle.composeDaysBefore = 3`, `cycle.composeHourLocal = 21`, `cycle.slotIsoWeekdays = [2..7]`, `requestOpens = vendredi W−1 21 h` ; garde `composedAt < acceptDeadline ≤ lockAt` ; `CompositionRun(scope, slotDate)` | B (tuning, `calendar.ts`), C (jobs, run, migration), designer (vérifier facts.json : Lyon mardi 17 → composition samedi 14, 21 h) | **fait (C, B)** : `composeRolling` (job `outings.compose` 5 min), `CompositionRun(scope@jour, ROLLING, slotDate)`, `composeAtOf`, tuning `cycle.composeDaysBefore/composeHourLocal/requestOpensWeeksBefore/slotIsoWeekdays` (`tuning-2026.12.5`), demande ouverte ven. 21 h W−1, créneau demandable jusqu'à sa composition ; reste : facts.json (designer) |
| E2 | Check-in accepte `GEO` (position comparée au rayon) | code seul ; position refusée (400) ; plus de `lat/lng` dans `OutingView` | C (outings), C2 (RDV duo), D (retirer la demande de position) | **fait (C, C2)** : `CheckInRequestSchema` = `{code}` `.strict()` (position → 400), chemin GEO retiré (sorties et RDV duo), `venue.lat/lng` retirés de `OutingView` ; reste D |
| E3 | `storyMatch: 'FRIENDS_ONLY'` encore servi | champ supprimé du contrat et de la vue ; `friendsOnly` interne agrégé | C (contrat + `visibility.ts`), D | **fait (C)** : `storyMatch` retiré du contrat, du projecteur et des requêtes ; tests « aucune vue » ; reste D |
| E4 | État honnête et indicateurs de ville absents | `storyFeasibility`, `GET /v1/me/city-insights`, photographie quotidienne, seuil 10, arrondis | B (fonctions pures), C (requêtes, job), D | **fait (B, C)** : `approxCount` pur ; `CityInsightSnapshot` + job `neighborhoods.city_insights` ; `GET /v1/me/city-insights` ; `storyFeasibility` + `composeAt` dans `GET /v1/outings/week`, `mode FRIENDS_THIS_WEEK` ; reste D, `cityVerifiedApprox` (arrondi de `GET /v1/me/neighborhood`) |
| E5 | Quota duo : 1 gratuit / illimité Blowy+ (`DUO_ALLOWANCE`, `duo.maxActiveFree = 1`, `PLUS_UNLIMITED_DUOS`) | **3 actifs pour tous**, Blowy+ sans effet sur le Duo | C2 (connections), G (retirer le port d'economy), B (tuning `duo.maxActive = 3`), A (`ENTITLEMENT_KEYS_V5`) | **fait (C2, G, B, A)** : 3 actifs pour tous (`DUO_ALLOWANCE` gardé, sans effet Blowy+), `PLUS_UNLIMITED_DUOS` retiré |
| E6 | Carte de proposition duo : pet + initiale (nom du pet) | espèce générique + initiale, rien d'autre | C2 (vue), D | **fait (C2)** : `{proposalId, species, otherInitial, expiresAt, acceptedByMe}` ; reste D |
| E7 | Blowy+ en achat intégré RevenueCat | Stripe Billing + résiliation dans l'app ; RevenueCat désactivé pour Blowy+ | G, D (écran d'abonnement, plus de SDK RevenueCat pour Blowy+) | **fait (G)** : checkout/cancel Stripe Billing, webhook `customer.subscription.*`, RevenueCat désactivé (`[T] plus.billing`) ; reste D, vérification Apple Pay sur appareil |
| E8 | Compensation lieu = prix TTC 4,99 € ; libellés « V5.3 » | 4,16 € HT (place payée), 3 € HT (sinon, et « Blowy annule », retraits après confirmation) ; champ `taxBasis` | G (`payments.ts`), F (relevé) | **fait (G, F)** : `venueCompensationAmount` HT (4,16 €), `taxBasis` dans le journal et le relevé, produits `taxBasis:'TTC'` |
| E9 | Imprévu `EMERGENCY` limité 1/trimestre (V5.4) ; `facts.json` dit encore « 1 fois par trimestre » | **1 par mois** (fenêtre 30 j) | B (tuning), C (`seat-policy`), designer (facts.json, texte de règle) | **fait (B, C)** : `[T] outings.emergencyCancelsPerMonth = 1` / `emergencyWindowDays = 30`, 412 `EMERGENCY_QUOTA` hors quota ; reste designer (facts.json) |
| E10 | Parrainage récompensé en pièces V4 | `REFERRAL_FREE` : prochaine sortie offerte, ≤ 1/mois ; accessoire de parrainage mort | F (social), G (crédit), C (financement de place) | **fait (G, C, F)** : `ReferralReward` (≤ 1/mois, jamais deux en attente), financement `REFERRAL_FREE`, « reste offerte » à l'annulation gratuite, `GET /v1/me/referral-reward`, pièces de parrainage arrêtées |
| E11 | Ambiance, « une semaine sur deux », `storyAgeBrackets`, `kidsHorizon`, choix discret explicite, temps de trajet : absents | §2.4, §2.16, §2.1 | C (schéma, users), B (composition), A (domaine), F (trajets en admin), D | **fait (C, B)** : `storyAgeBrackets` et `kidsHorizon` (+ `HAS_ALREADY`) dans `PUT /v1/preferences/intentions` et `storyCompatible` ; « un week-end sur deux » (`everyOtherWeekendOffFrom`) ; `NeighborhoodTravelTime` (lieux dans le trajet max, à la demande et à la composition ; « ≈ N min » `venue.travelMinutes` ; saisie staff `POST /v1/admin/travel-times`) ; pénalité douce `[T] composition.lambdaAmbiance` ; `ambiance`, `activityChosenBy`, `oncall` dans `OutingView` ; reste D, F (écran trajets), backfill sans trajets |
| E12 | Astreinte : `VENUE_ONCALL_PHONE` seul ; créneaux et RDV non contrôlés | `SafetyOnCallShift` par fuseau ; génération et RDV refusés hors couverture ; `GET /v1/safety/oncall` | E (safety), C (generate_slots), C2 (RDV), F (planning admin) | **fait (C, F côté API)** : `neighborhoods.generate_slots` ne crée que des créneaux couverts ; job `neighborhoods.oncall_watch` (créneau découvert retiré s'il est vide, sinon `ops.oncall_coverage_lost`) ; planning staff `GET|POST /v1/admin/oncall/shifts`, `POST …/:id/delete` (trust_lead + ops) avec trous de couverture ; reste F (page admin), E (consommer l'alerte) |
| E13 | RDV Duo libres (pas de table réservée) | table de 2 au lieu, confirmée J−1 18 h, dans l'effectif, code, compensation | C2, F (effectif), G (compensation) | **fait (C2, F, G)** : `DuoDate.venueSlotId` / `reservationLockedAt` ; proposition et acceptation refusées après la veille 18 h (412 `DUO_DATE_TOO_LATE`, `[T] duo.dateLockHourLocal`) ; table de 2 dans l'effectif (`kind: 'DUO'`, prénoms, code) ; absence ou annulation après la veille 18 h → 3 € HT (`duoTable` au relevé) ; reste D |
| E14 | Alerte : position d'un ancien client ignorée silencieusement | refus explicite 400 (contrat sans champ) | E | **fait (C pour E)** : `RaiseAlertRequestSchema` `.strict()` → 400 si une position est jointe (le mobile courant n'en envoie plus) ; reste E (texte d'erreur côté client) |
| E15 | Contrat lieu signé par le lieu seul ; relevé mensuel agrégé par sortie | contrat bilatéral avec clause de responsabilité ; relevé par soirée avec absences/imprévus/annulations Blowy | F, C (migration `Venue`) | **fait (F, C)** : contrat `contrat-lieu-2026.12.2` (clause de responsabilité, table de 2, 3 € HT sécurité) ; `Venue.contractVersion/contractSignedAt/contractSignerName/blowySignedAt/blowySignerName` ; contre-signature `POST /v1/admin/venues/:id/contract/countersign` (admin, step-up) ; `countersigned` / `inForce` dans la vue contrat ; relevé par soirée ; reste F (page staff) |
| E16 | Liens de partage uniques, `/s/:slug`, `/team/<code>` non faits | §2.17 | F | **fait (C pour F, API)** : `ShareLink` / `ShareAttribution` ; `POST /v1/share-links {cardKind, teamCode?}` (nouveau lien à chaque fois, 13 mois), `GET /v1/me/share-links` (compteurs), `GET /v1/public/s/:slug` (rien de personnel), `POST /v1/referrals/claim {ref: slug}` (attribution) ; 1ʳᵉ sortie attribuée comptée ; reste D (cartes), F (page web `/s/`) |
| E17 | Évitement de contacts (`KNOWN_CONTACT`) non fait | §4.5, proposé avant la 1ʳᵉ composition | E, B, D | **fait (C, B)** : OPRF `oprf-p256-v1`, `PhoneIdentity`/`AvoidPair`, `KNOWN_CONTACT`, `askBeforeFirstOuting` ; reste D |
| E18 | « Je connais quelqu'un » accepté : retrait sans déplacement | déplacement vers un autre groupe du créneau si possible | C | **fait (C)** : lien connu dans le quota → déplacement vers un autre groupe CONFIRMÉ du même créneau (place libre jusqu'à 6, ≤ 3 du même genre, aucun lien connu), même financement (`newOutingId`) ; sinon retrait remboursé ; même chemin après décision staff |
| E19 | Données espace lieu sur `DomainEvent` (provisoire) | tables §8.2 | C (migration), F (adaptateur) | **fait (C, F)** : `VenuePartnerEvent` (journal) + `VenuePartnerAccess`, `VenuePartnerMfa`, `VenueWeekday`, `VenueClosure`, `VenueIncident`, contrat sur `Venue` ; reprise des événements `DomainEvent` par la migration `20261107120100_v5_6` |
| E20 | `/v1/matches` (flux V4) toujours servi | ajouté à `retired.ts` quand le mobile n'y fait plus appel | A, D | ouvert (A, D) : le mobile n'appelle plus `/v1/matches` ; le retirer exige de réécrire les fixtures d'intégration V4 qui créent des relations par ce flux |
| E21 | Tuning garde des champs morts (`plus.includedOutingsPerMonth`, `includesMonthlyAccessory`, `plusMonthlyAccessoryIds`, `duo.maxActiveFree`, `neighborhoods.defaultDensityThreshold`) | retirés (avec `.default()` pour relire les versions publiées) | B | **fait (B)** : `duo.maxActiveFree`, `plus.includedOutingsPerMonth`, `plus.includesMonthlyAccessory`, `accessories.plusMonthlyAccessoryIds`, `neighborhoods.defaultDensityThreshold` optionnels et absents des défauts `tuning-2026.12.6` (versions publiées relisibles, testé) ; code sur `duo.maxActive` |
| E22 | **Sortie pour raison de sécurité non compensée au lieu** : `venueCompensationCause` (`economy/domain/payments.ts`) renvoie `null` pour `SAFETY_EXIT` (et le consommateur `economy.venue_compensation` n'écrit donc rien) | 3 € HT par Blowy pour toute `SAFETY_EXIT` après `lockAt`, y compris après check-in ; base `SAFETY` dans le relevé | G | **fait (G)** : cause `SAFETY` pour toute `SAFETY_EXIT` après `lockAt` (y compris après check-in, « je connais quelqu'un » vers un autre lieu) → 3 € HT ; relevé `safetyExits` ; aussi comptée dans « Blowy annule » |
| E23 | **« Je connais quelqu'un » au-delà du quota = absence** : `seats.use-cases.ts` `knowsSomeone` → statut `COUNTED_AS_CANCEL` puis `cancelPreview(kind 'CANT_MAKE_IT')` → `LATE`, `countsAsAbsence: true`, aucun remboursement | au-delà d'1 déplacement / 30 j : `SAFETY_EXIT` remboursée, sans pénalité, `IN_REVIEW` humain (statut `SAFETY_REVIEW`) ; plus jamais `COUNTED_AS_CANCEL` | C (outings), E (file de revue), D (texte) | **fait (C)** : au-delà de `[T] outings.knowsSomeoneMovesPerMonth` (1 / 30 j) → `SAFETY_EXIT` remboursée, sans pénalité, `KnowsSomeoneRequest.status = SAFETY_REVIEW` dans la file staff ; plus jamais `COUNTED_AS_CANCEL` ; reste E (file de revue), D (texte) |
| E24 | **Fiabilité visible par les autres** : `outings/domain/visibility.ts` (`identity()` → `reliability`), `connections/application/queries.ts` (vues duo / bande), contrats `outings.ts` (`MemberReliabilitySchema` dans les membres) et `connections.ts` (`reliability` obligatoire) | visible par soi seulement ; champ retiré des vues d'autrui (contrats `.strict()` à mettre à jour) ; balayage J-o étendu | C (outings + contrat), C2 (connections + contrat), D, H | **fait (C, C2)** : `reliability` retiré des membres de sortie, de `BandMemberView` et de `DuoView.other` (contrats `.strict()`) ; `GET /v1/me/reliability` seul ; tests domaine + intégration ; reste D, H (balayage J-o) |
| E25 | Commentaires et texte de `seat-policy.ts` : « imprévu 1 par trimestre » (la règle de code est déjà en fenêtre 30 j, `emergencyCancelsPerMonth = 1`) | libellés « 1 par mois » ; `trimesterStart` déprécié retiré | C | **fait (C)** : libellés « 1 par mois » ; `quarterStart` retiré |
| E26 | Promesses de délai codées en dur dans les contenus et maquettes (« lundi 21 h ») ; « rentable dès la 2ᵉ sortie » | textes calculés depuis `composeAt` / `lockAt` / `photoRevealAt` (§1.1) ; « dès la 3ᵉ sortie » ; formulation d'astreinte unique | B (contenus), D, designer (`facts.json`) | **fait (B côté serveur)** : `@blowy/content` `RULES_V56` (formulations uniques : sécurité, imprévu, annulation après confirmation, « je connais quelqu'un », fiabilité, astreinte, « Blowy+ rentable dès la 3ᵉ sortie du mois »), `answerAtFr` / `answerAtFromInstants` (« Nino cherche ta sortie de samedi : réponse mercredi soir »), notification `outing.request_answer_at`, `outing.confirmed` réécrit ; reste D, designer (`facts.json`) |
| E27 | Table Duo compensée 3 € HT (`payments.use-cases.ts` `duoTable` → `venueCompensationFreeSeatCents`, base `FREE_SEAT`/`SAFETY`) | **0 €, sans garantie** : plus aucune écriture `VENUE_COMPENSATION` pour une table Duo ; contrat et relevé le disent | G, F | à faire — constaté en révision 7 |
| E28 | Relevé et périodes en mois **UTC** (`admin/domain/venue-partner.ts` `periodOf` = `toISOString().slice(0, 7)` ; idem `economy` pour le parrainage et `entitlements.monthlyPeriod`) | mois civil dans le fuseau du lieu (relevé) et de la personne (« 1 sortie offerte par mois ») | F (relevé), G (parrainage) | à faire — constaté en révision 7 |
| E29 | Effectif = fenêtre glissante « 8 prochains jours » (`venue-partner.use-cases.ts` `roster`), jours sans table non listés | semaine civile en cours + suivante, tous les jours de créneaux, « aucune table » affiché | F | à faire — constaté en révision 7 |
| E30 | **Message d'accueil du lieu** absent (aucun champ, ni éditeur, ni `OutingView.venue.welcomeMessage`, ni message système au chat à `lockAt`) | `Venue.welcomeMessage` + modèle + modération, visible des seuls confirmés à partir de la confirmation (fiche + chat) | F (espace lieu), C (vue, chat, migration), B (modèle, `[T] venues.welcomeMessageMaxChars`), E (modération) | à faire — constaté en révision 7 |
| E31 | `[T] safety.helpCallbackTargetMinutes` absent du tuning | paramètre = 5 ; « Quelqu'un de l'équipe te rappelle en quelques minutes. » ; SLA dossier 60 inchangée | B (tuning, contenus), E (consommateurs sécurité, file d'astreinte) | à faire — constaté en révision 7 |
| E32 | Option « Montrer au groupe : je préfère le calme » absente (`OutingPreferences`, contrats, projection) | `showCalmBadge` (défaut false), badge sur le pet dans le chat et la fiche à partir de `FORMING` | C (préférences, `visibility.ts`, `MessageView.author`), D | à faire — constaté en révision 7 |
| E33 | `RULES_V56` ne contient pas encore les trois phrases V5.7 (sécurité / je connais quelqu'un / imprévu « Je ne le sens pas »), ni la règle d'annulation V5.7, ni l'astreinte à la 3ᵉ personne (page ange) ; « inscrits » à proscrire | `RULES_V57` repris mot pour mot par l'app, Tarifs, contrat lieu et pages web ; « personnes vérifiées » | B (contenus + test), F (contrat, pages web), D, designer | à faire — constaté en révision 7 |

Vérifié conforme (2026-11-06) : une `SAFETY_EXIT` est **remboursée** (`cancelPreview` → `refundModeFor(funding)` ; `refundOutcome` : carte pour `PAID`, nouveau lot pour `CREDIT`, rien à écrire pour offerte / Blowy+), **jamais comptée** (`countsAsAbsence: false`, la place `CANCELLED` n'entre ni dans N ni dans M), **sans quota** (aucun compteur sur `kind = SAFETY`, y compris pour une place `CHECKED_IN` via `leave-uncomfortable`), et ne consomme pas l'imprévu (compteur `EMERGENCY` distinct).
Vérifié conforme en révision 7 : vote « Non par défaut » (`outings/application/queries.ts` : `myChoice = ballots.get(t) ?? 'NO'`) ; prénom du duo après le double oui seulement (proposition = `{species, otherInitial}`) ; « Blowy annule » compensé dès que la sortie était confirmée, sans condition d'heure (`blowyCancelCompensated` : `wasConfirmed` + motif interne, `VENUE_UNAVAILABLE` exclu) ; « je connais quelqu'un » hors quota → `SAFETY_REVIEW` remboursé, jamais une absence.

---

## 12. Questions tranchées (V5.7)
| # | Question | Décision |
|---|---|---|
| 1 | Quelle heure de composition ? | **J − 3 21 h, glissante par jour de créneau** (D-053) |
| 2 | Paiement de Blowy+ ? | Stripe Billing, comme les places ; RevenueCat désactivé (D-054) |
| 3 | Que comprend Blowy+ ? | Toutes les sorties, rien d'autre ; Duo gratuit pour tous, 3 actifs (D-054) |
| 4 | Signal de compatibilité ? | Aucun au niveau du groupe ; seulement ville + créneaux avant composition (D-061, D-066) |
| 5 | Indicateurs de ville ? | ≥ 10, arrondis, photographie quotidienne (D-059) |
| 6 | Imprévu ? | 1 par mois, sans pénalité, non remboursé, lieu compensé (D-056) |
| 7 | Check-in ? | Code du chevalet uniquement (D-062) |
| 8 | Astreinte ? | Toutes les heures de créneaux et RDV, mutualisée par fuseau ; aucun créneau hors couverture (D-058) |
| 9 | Carte Duo ? | Espèce générique + initiale (D-068) |
| 10 | Parrainage ? | Prochaine sortie offerte, 1/mois (D-064) |
| 11 | Compensation lieu ? | 4,16 € HT si payée, 3 € HT sinon et si Blowy annule ; relevé par soirée (D-067) |
| 12 | Contrat lieu ? | Bilatéral, clause de responsabilité (D-069) |
| 13 | Ambiance ? | Contrainte au lieu, pénalité douce au groupe (D-055) |
| 14 | Trajet ? | Table ops entre quartiers, affichée, filtre dur (D-063) |
| 15 | Mode discret ? | Choix explicite, aucun présélectionné (D-065) |
| 16 | Duo au lieu ? | Table de 2 (réservation, effectif, code), **0 € pour le lieu, sans garantie** (D-070 amendé par D-081) |
| 17 | Sortie pour raison de sécurité ? | Toujours possible, illimitée, sans pénalité, remboursée, lieu compensé 3 € HT ; jamais comptée dans l'imprévu (D-071) |
| 18 | Imprévu ? | 1 par mois, sans pénalité, non remboursé (D-072) |
| 19 | « Je connais quelqu'un » au-delà du quota ? | Sortie pour raison de sécurité examinée par un humain, sans pénalité (D-073) |
| 20 | Qui voit la fiabilité ? | Toi seul·e (D-076) |
| 21 | Seuil de rentabilité de Blowy+ ? | Dès la 3ᵉ sortie payée du mois (D-074) |
| 22 | Comment dire les délais ? | Calculés depuis la composition J − 3 21 h du créneau, jamais un jour générique (D-075) |
| 23 | Les trois sorties ? | Raison de sécurité (toujours, remboursée), je connais quelqu'un ici (1/mois, remboursée, au-delà examiné, jamais une absence), imprévu (1/mois, non remboursé) ; phrases canoniques uniques (D-077) |
| 24 | Délai d'aide ? | Rappel visé en 5 min pendant une sortie ; SLA dossier 60 min (D-078) |
| 25 | « Blowy annule » ? | 3 € HT par place réservée, à toute heure après la confirmation (D-079) |
| 26 | Message d'accueil du lieu ? | Écrit par le lieu sur modèle, visible des confirmés à la confirmation (fiche + chat) (D-080) |
| 27 | Table Duo ? | 0 € pour le lieu, sans garantie (D-081) |
| 28 | Effectif et relevé ? | Effectif sur toute la semaine ; relevé sur le mois civil (D-086) |
| 29 | Badge « je préfère le calme » ? | Option désactivée par défaut, badge sur le pet dès FORMING (D-084) |

---

## 13. Historique des amendements
| Rév. | Date | Source | Changements |
|---|---|---|---|
| 1 | 2026-11-06 | `concept-v5.md` | Rédaction initiale (D-010 → D-034). |
| 2 | 2026-11-06 | `concept-v5.1.md` | Groupes de 5, team, intentions V5.1, préférences de sortie, aperçu anonyme, vote groupé, annulation après confirmation = absence, prix 4,99 / 9,99. |
| 3 | 2026-11-06 | `concept-v5.2.md` | Plus de ville fermée, écart « il manque N », garantie histoire, lieu J−1 18 h, visages J−3 h, grille d'âge fixe, « je connais quelqu'un », cartes sans tiers, Ta rue. |
| 4 | 2026-11-06 | `concept-v5.3.md` | Garantie jamais affichée (sauf « sortie entre amis pour toi »), ≤ 3 même genre, duo à l'initiale, gardien sans position, annulation gratuite jusqu'à J−1 18 h, Blowy+ en achat intégré, compensation 4,99 / 3 €, liens uniques, évitement de contacts, espace lieu (D-035 → D-052). |
| 5 | 2026-11-06 | **`concept-v5.4.md` + `concept-v5.5.md`** + handoffs alignement / T6 / T8 | Plus aucun signal de compatibilité (bandeau supprimé) ; indicateurs de ville ≥ 10 arrondis ; état honnête ville/créneaux ; Blowy+ via Stripe (sorties uniquement), Duo gratuit 3 actifs ; imprévu 1/mois ; ambiance ; « une semaine sur deux » ; âge et horizon pour une histoire ; check-in par code sans position ; astreinte sur toutes les heures, mutualisée ; carte Duo espèce + initiale ; parrainage = prochaine sortie offerte ; compensations HT, « Blowy annule » 3 €/place, relevé par soirée, contrat bilatéral ; Duo à la table de 2 ; temps de trajet ; mode discret explicite ; **calendrier réel de composition J − 3 21 h** (écart du code mardi 12 h) ; §11.4 réécrit (E1–E21). Décisions D-053 → D-070. |
| 6 | 2026-11-06 | `concept-v5.6.md` §A + vérification du code (`safety`, `outings`, `economy`) | Sortie pour raison de sécurité illimitée, sans pénalité, remboursée, lieu compensé 3 € HT ; imprévu 1/mois non remboursé ; « je connais quelqu'un » hors quota = sortie pour raison de sécurité examinée ; fiabilité visible par soi seulement (§3, §7.5) ; Blowy+ rentable dès la 3ᵉ sortie ; astreinte « pendant toute ta sortie ou ton rendez-vous » ; délais calculés depuis J − 3 21 h ; Confidentialité une ligne par sujet (Duo, Ange gardien compris) ; écarts E22–E26. Décisions D-071 → D-076. |
| 7 | 2026-11-06 | `concept-v5.7.md` + vérification du code (`outings`, `connections`, `economy`, espace lieu) | Trois sorties distinctes avec phrases canoniques (§2.7) ; vote « Non par défaut » et prénom du duo au double oui confirmés ; « Blowy annule » 3 € HT à toute heure après la confirmation (§2.6) ; `[T] safety.helpCallbackTargetMinutes = 5` ; message d'accueil du lieu ; table Duo 0 € sans garantie ; effectif sur toute la semaine ; relevé sur le mois civil ; badge « je préfère le calme » ; « personnes vérifiées » ; astreinte à la 3ᵉ personne sur la page ange ; pas de partage sur Les visages ; nouveaux écarts E27–E33. Décisions D-077 → D-086. |
