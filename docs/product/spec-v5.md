# Spécification technique V5 — « Ton pet te trouve une bande »

Statut : **référence de construction V5, révision 3 (2026-11-06)**, alignée sur `docs/product/concept-v5.md` amendé par `concept-v5.1.md`, `concept-v5.2.md`, `concept-v5.3.md` (la plus récente gagne) et sur le code déjà livré (handoffs `V5-T0-T1.md`, `V5-T2.md`, `V5-B-garantie.md`). Décisions : `docs/decisions.md` D-010 à D-052. Historique : §13.
Ce document ne contient aucun code de production : il fixe les noms, états, invariants, contrats et découpages. Tout chiffre marqué `[T]` est un paramètre de `@blowy/tuning` (version courante `tuning-2026.12.2`) ; aucun chiffre ne doit être codé en dur ailleurs. Les écarts entre ce document et le code existant sont listés en §11.4 (« à aligner »).

Sommaire : 1 Glossaire · 2 Modèle de domaine · 3 Visibilité · 4 Composition · 5 Le pet · 6 Économie · 7 API /v1 et WS · 8 Schéma · 9 Notifications · 10 Admin et espace lieu · 11 Tranches · 12 Questions tranchées · 13 Historique des amendements

---

## 1. Glossaire et conventions

| Terme | Définition |
|---|---|
| Semaine (`weekKey`) | Semaine ISO dans le fuseau du quartier (`2026-W46`). « Une sortie par semaine » utilise cette clé. |
| Sortie (`Outing`) | Rencontre de **5 personnes** (dont toi ; 4 à 6 admis), dans une ville, à un lieu partenaire, sur un créneau, pour une activité. |
| Team (« venir avec quelqu'un ») | 1 à 3 personnes qui s'inscrivent ensemble et sont composées comme une unité indivisible. Libellés d'écran : « venir avec quelqu'un », « tes proches » ; « team » reste un terme d'interface secondaire. |
| Place (`OutingSeat`) | Participation d'une personne à une sortie. |
| Confirmation (`lockAt`) | **Veille de la sortie à 18 h** (`[T] outings.cycle.lockHourLocal`) : l'effectif est figé et envoyé au lieu ; lieu, prénoms, tranches d'âge et pets révélés aux confirmés ; fin de l'annulation gratuite. « Confirmée » = l'état, « confirmation » = ce moment. |
| Visages (`photoRevealAt`) | **Jour J, 3 h avant le début** (`startsAt − [T] cycle.photoRevealMinBeforeStartHours`), avec filigrane du prénom du regardeur. On dit « visages », jamais « photos », pour la révélation. |
| Présent·e (`ATTENDED`) | Check-in validé (ou correction staff). Seuls les présents votent et sont votés. |
| Absence | Place confirmée non honorée : pas de check-in **ou** annulation après la confirmation (hors motif sécurité). |
| Besoin d'aide | Le bouton d'alerte (vocabulaire unique, jamais « alerte » à l'écran). |
| Tranche d'âge | Grille fixe `18–21, 22–25, 26–29, 30–34, 35–39, 40–44, 45–49, 50+` (`AGE_BRACKETS_V52`). Jamais d'âge exact affiché. |

Conventions héritées : UUID v7 côté application ; UTC en base + fuseau IANA du quartier ; Zod aux frontières, vues V5 en `.strict()` (un champ imprévu = échec) ; commandes via `CommandBus` (idempotence `(actorId, operation, commandId)`, transaction, verrous ordonnés, outbox) ; erreurs `{code,message,detailsSafe,requestId,retryable}` avec le motif dans `detailsSafe.reason` (ex. `412 PRECONDITION_FAILED {reason:"RELIABILITY_PAUSED"}`) ; `NOT_FOUND` pour tout objet d'autrui ; code `GONE` (410) pour les routes retirées (`API_ERROR_CODES`).
**Ordre global des verrous V5** (implémenté dans `packages/database/src/tx.ts`) : `users → pets → relationships → neighborhoods → teams → outings → outing_seats (id croissant) → friendships → duos → wallets → outing_credit_lots`. Aucun appel réseau sous verrou.

**Calendrier d'une sortie (récapitulatif, valeurs `[T]`)**
| Moment | Ce qui se passe |
|---|---|
| Permanent | la personne coche ses créneaux disponibles, ses semaines off, ses activités, ses quartiers acceptables ; la demande hebdo est créée automatiquement (§2.4) |
| Mardi 12 h | composition de la semaine ; invitation (≤ 1 notification de proposition par semaine) avec **aperçu anonyme** |
| +24 h | fin de l'invitation ; places libérées → backfill jusqu'à la confirmation |
| ≥ 4 « Je viens » | sortie `FORMING`, chat de groupe ouvert, auteurs affichés **par leur pet** |
| **J-1 18 h — confirmation** | lieu (nom, photo, adresse), prénoms, tranches, pets ; effectif « table Blowy » envoyé au lieu ; « Je connais quelqu'un ici » disponible ; **après : annuler = absence** |
| **J − 3 h** | visages révélés en même temps à tout le groupe, filigranés |
| J − 30 min → J + 90 min | check-in sur place ; « Je pars, mal à l'aise » toujours possible |
| J + 90 min → + 72 h | vote d'après (un seul écran) ; résultats à la clôture uniquement |

---

## 2. Modèle de domaine

Chaque agrégat indique son module propriétaire (seul écrivain de ses tables, §11).

### 2.1 Neighborhood (quartier) et ville — module `neighborhoods` (livré T2)
| Champ | Notes |
|---|---|
| id, slug, name, cityZoneId (FK `Zone` = ville), timezone | |
| status | `LIVE \| WAITLIST \| PAUSED \| CLOSED` |
| slotTemplates | créneaux types de la ville par activité (ex. mar. soir verre, sam. après-midi bloc, dim. brunch) |

**Il n'y a plus de ville ni de quartier « fermé » (D-035).** Dans n'importe quelle ville, une sortie se forme dès que 5 personnes vérifiées compatibles partagent un créneau et qu'un lieu partenaire offre ce créneau. Le statut ne change que la fréquence et le choix des lieux : `LIVE` = cycle hebdo complet et plusieurs lieux ; `WAITLIST` (« pas encore ouvert ») = composition aussi active, souvent un seul lieu ; `PAUSED`/`CLOSED` = seuls statuts qui refusent les demandes (`NEIGHBORHOOD_UNAVAILABLE`). Le seuil de densité (`neighborhoods.defaultDensityThreshold` = 120) est **mort** : jamais affiché, jamais bloquant ; il ne sert qu'à un indicateur admin.
`me.set_neighborhood` : saisie libre ville + quartier avec suggestions, **jamais de géolocalisation**, changement au plus tous les `[T] changeCooldownDays` (7) et jamais avec une place active. Quartiers acceptables : jusqu'à `[T] preferences.maxNeighborhoods` (5) ; trajet max déclaratif 20 / 30 / 45 min (défaut 30, affiché) qui ne sert qu'à suggérer des quartiers (aucun calcul de position).

### 2.2 Écran d'attente — module `neighborhoods` / `outings`
Quand aucune sortie n'est possible cette semaine pour la personne : écran honnête et actionnable, alimenté par `nextOutingGap` (livré T2) calculé sur les **vraies** demandes vérifiées de ses créneaux :
« À Nantes : 87 personnes vérifiées. Sur tes créneaux, il manque 2 personnes pour la sortie du samedi 21 novembre. » + actions : venir avec quelqu'un (team), élargir créneaux / activités / quartiers, Duo si activé, carte de partage « Aide Nantes à sortir » (sans chiffre personnel). Jamais de seuil abstrait, jamais de position individuelle. Une personne non placée une semaine est **prioritaire** la suivante (`missedWeeks + 1`). `WaitlistEntry` reste utilisée pour le décompte « personnes vérifiées dans la ville ».

### 2.3 Venue (lieu partenaire) — module `neighborhoods`
| Champ | Notes |
|---|---|
| id, neighborhoodId, name, photoMediaId, addressLine, postalCode, city | nom + photo + adresse révélés aux confirmés **à la confirmation** |
| lat, lng | servent au check-in uniquement ; jamais envoyées avant confirmation ; jamais de distance affichée |
| activities | `DRINK_COFFEE \| BRUNCH \| CLIMBING \| WORKSHOP \| GAMES \| EXPO` (`ACTIVITY_ENTRIES`) |
| tableCap | plafond de tables Blowy simultanées (contrat) ; `VenueSlot.capacityOutings ≤ tableCap` |
| reservationName | toujours « Blowy » (on ne prononce jamais le nom d'un pet au bar) |
| status | `ACTIVE \| PAUSED \| ARCHIVED` |
| checkinSecretRef | référence du secret servant au code de repli (§2.8) |
| contractVersion, contractSignedAt | contrat d'une page (§10.2) |
**Consommation non incluse** : chacun paie ce qu'il consomme au lieu. Le lieu ne reçoit pas de paiement par place : il reçoit un groupe confirmé à J-1 18 h sur ses créneaux creux, sans animation, avec une astreinte Blowy, et une **compensation** pour chaque place non honorée après confirmation (§6.5).
`VenueSlot(venueId, startsAt, activity, capacityOutings, reservedOutings)`, unique `(venueId, startsAt)`, CHECK `0 ≤ reserved ≤ capacity`, générés par `neighborhoods.generate_slots`.

### 2.4 Préférences de sortie et demande hebdo — modules `users` / `outings` (livrés T2)
- Préférences permanentes : `UserSlotAvailability` (créneaux cochés de la ville), `UserWeekOff` (case « certaines semaines je ne suis pas dispo » → semaines off, ≤ `[T] preferences.maxWeeksOffAhead` 12), `OutingPreferences(groupAgeMin, groupAgeMax, activities[], maxTravelMinutes)`, `UserAcceptableNeighborhood`.
- `groupAge` : curseur, défaut ± `[T] preferences.groupAgeDefaultDelta` (4) ans autour de l'âge ; comparé aux **tranches fixes** (une personne est acceptable si sa tranche recoupe l'intervalle).
- `OutingRequest(userId, weekKey, slotStartsAt[], teamId?, status OPEN|PLACED|UNPLACED|WITHDRAWN, missedWeeks)`, unique `(userId, weekKey)`. **Créée automatiquement** chaque semaine depuis les disponibilités (sauf semaine off, pause, place active) ; `PUT /v1/outings/requests/:weekKey` reste pour ajuster/retirer.
- Préconditions pour être composé·e : onboarding complet (§2.15) ; **18+ vérifié** et selfie vérifié valides (`LOCAL_DEMO` hors production seulement) ; photo de profil publiée ; pas de pause (fiabilité ou volontaire) ; pas de place active cette semaine (quota 1/semaine identique pour tous, non achetable).
- **Pause en 1 tap** depuis l'Accueil : `POST /v1/pauses` existant (≤ 14 j cumulés par trimestre) suspend demandes, propositions et rappels.

### 2.5 Team — module `outings` (livré T2)
`Team(id, status FORMING|ACTIVE|DISSOLVED)`, `TeamMember(teamId, userId)` (une team active par personne, index partiel). 1 à `[T] composition.maxTeamSize` (3). Invitation par lien unique (`/team/<code>`, §2.16), l'invité·e fait son onboarding puis rejoint. Composée comme unité ; ses membres ne votent pas entre eux ; s'ils sont présents ensemble → BandLink `PLUS_ONE` (nom d'enum conservé, libellé « venu·e·s ensemble »).
**Amorçage** (D-036) : dans toute ville, une team `ACTIVE` de 3 personnes vérifiées + une autre team (≥ 2) ou des personnes en attente sur le même créneau = une sortie (`composeSeedingOutings`, `[T] seeding`, jusqu'à 6). L'écran montre cette sortie d'amorçage avec date et lieu.

### 2.6 Outing (sortie) — module `outings` (livré T2)
| Champ | Notes |
|---|---|
| id, neighborhoodId, weekKey, venueSlotId, venueId, activity, startsAt, endsAt (`+ [T] durationMinutes` 120) | |
| status | `PROPOSED → FORMING → CONFIRMED → CHECKIN_OPEN → DONE`, ou `CANCELLED` |
| capacity | taille du groupe composé (cible `[T] composition.targetSize` 5) ; CHECK 4–6 |
| acceptDeadline, lockAt, photoRevealAt, checkinOpensAt, checkinClosesAt, votesCloseAt | figés à la création |
| cancelReason | `UNDERSIZED \| VENUE_UNAVAILABLE \| STAFF \| NEIGHBORHOOD_CLOSED \| SAFETY` |
| compositionRunId, conversationId, tuningVersion, algoVersion | |

| De → À | Déclencheur | Garde | Effets |
|---|---|---|---|
| — → `PROPOSED` | composition / amorçage | groupe valide, `VenueSlot` réservé | places `INVITED` (une invitation réserve une place) ; notification d'invitation ; aperçu anonyme |
| `PROPOSED → FORMING` | « Je viens » | `confirmed ≥ [T] minSizeToForm` (4) | chat `OUTING` ouvert aux confirmés, **auteurs affichés par leur pet** ; brise-glace |
| relance | place déclinée/expirée | `now < lockAt` | backfill (§4.6) |
| `FORMING → CONFIRMED` | job à `lockAt` | `confirmed ≥ [T] minSizeToLock` (4) | effectif figé et transmis au lieu (« table Blowy », prénoms) ; lieu + prénoms + tranches + pets révélés ; « Je connais quelqu'un ici » ouvert ; invitations restantes `EXPIRED` |
| `PROPOSED/FORMING → CANCELLED` | job à `lockAt` | `confirmed < 4` | `UNDERSIZED`, remboursements (§6.4), confirmés prioritaires la semaine suivante |
| `CONFIRMED → CANCELLED` | départs | `confirmed < [T] minSizeToHold` (3) avant `startsAt − 3 h` | remboursement des restants |
| `CONFIRMED` (`photoRevealAt`) | job | — | visages révélés (flag, pas un statut) |
| `CONFIRMED → CHECKIN_OPEN` | `checkinOpensAt` | — | check-in ; « arrivé·e » visible au groupe |
| `CHECKIN_OPEN → DONE` | `checkinClosesAt` | — | `CHECKED_IN → ATTENDED`, `CONFIRMED → NO_SHOW` ; votes si `attended ≥ [T] votes.minAttendees` (2) ; souvenirs ; fiabilité ; compensations lieu |
| `* → CANCELLED` | staff `ops` (step-up) | ≠ `DONE` | motif, remboursements |
Invariants : I-O1 pas de surréservation ; I-O2 une place active par personne et par semaine (index partiel) ; I-O3 deux personnes liées par un blocage ou par « éviter les personnes que je connais » ne sont jamais dans la même sortie active ; I-O4 lieu, prénoms et tranches jamais projetés avant `lockAt`, visages jamais avant `photoRevealAt`, et seulement aux places `CONFIRMED` ; I-O5 une sortie `CANCELLED` ne produit ni vote ni souvenir ; l'annulation tardive qui l'a provoquée reste une absence (D-043).

### 2.7 OutingSeat (place) — module `outings` (livré T2, financement réel T3)
Champs : `status, funding (FREE_FIRST | PLUS_INCLUDED | PAID | STAFF_COMP ; CREDIT déprécié), creditEntryId? / paymentId?, holdExpiresAt, cancelKind, refundState, refundRef, horodatages`.
```
INVITED ──« Je viens »──► HELD ──paiement/droit──► CONFIRMED ──check-in──► CHECKED_IN ──DONE──► ATTENDED
   ├─decline──► DECLINED          CONFIRMED ──DONE sans check-in──► NO_SHOW (absence)
   └─deadline/confirmation──► EXPIRED   CONFIRMED/HELD ──annulation──► CANCELLED (cancelKind)
```
- Financement à « Je viens », dans l'ordre : 1ʳᵉ sortie offerte (`FREE_FIRST`, unique par personne) → Blowy+ actif (`PLUS_INCLUDED`, toutes les sorties) → `PAID` 4,99 € par Apple Pay / carte via Stripe (`HELD` pendant `[T] paymentHoldMinutes` 15, puis webhook → `CONFIRMED`). Paiement arrivé après expiration du hold ou sur sortie pleine/annulée → remboursement automatique.
- **Annulation** (`cancelKind`) :
  - `EARLY` : avant `lockAt` → **gratuite** : remboursement carte intégral (`PAID`), 1ʳᵉ sortie qui reste offerte (`FREE_FIRST` recrédité ; l'écran dit « ta 1ʳᵉ sortie reste offerte », jamais « remboursé·e »), `PLUS_INCLUDED` sans objet. Aucun effet de fiabilité.
  - `LATE` : après `lockAt` → **absence** : aucun remboursement, compte dans la fiabilité, compensation lieu (§6.5).
  - `SAFETY_EXIT` : motif sécurité à tout moment (avant ou pendant) → remboursé, aucun effet de fiabilité ; message au staff.
  - `SYSTEM_REMOVAL` : retrait par le système (blocage, « je connais quelqu'un » accepté) → remboursé ou recrédité, prioritaire, message neutre identique à toute recomposition.
  - `ACCOUNT_DELETED`.
- **Retrait système au blocage** (D-025, livré E) : si A bloque B alors qu'ils partagent une sortie active, B est retiré·e (message « La composition de ta sortie a changé… »), A n'a rien à faire ; le groupe voit « X ne pourra pas venir ».
- **« Je connais quelqu'un ici »** (livré T2) : disponible de `lockAt` à `startsAt`, privé, 1 fois par `[T]` 30 j ; examen automatique (lien connu dans l'app, blocage, évitement de contacts) sinon `IN_REVIEW` humain ; accepté → la personne qui demande est retirée sans pénalité, prioritaire, et déplacée vers un autre groupe du même créneau s'il existe une place compatible ; au-delà du quota = annulation tardive.
- **« Je pars, mal à l'aise »** (pendant la sortie, après check-in) : toujours possible, sans pénalité (la présence reste `ATTENDED`), message au staff (et au gardien si la personne le choisit) ; au 3ᵉ en `[T] safety.uncomfortableLeaveWindowDays` (90 j), un humain recontacte la personne.

### 2.8 GroupChat pré-sortie — `conversations` (livré T2)
`Conversation.kind = OUTING`, ouverte au passage `FORMING`, membres = places confirmées. Texte uniquement, modération existante. **Avant la confirmation, chaque message est signé par le pet de son auteur** (nom + avatar du pet) ; à `lockAt` les prénoms apparaissent. Brise-glace du pet (`icebreaker.*`), réponses « 3 mots » (`promptId`, ≤ 3 mots / 40 caractères). Pas de vocal obligatoire nulle part. En-tête : **Signaler / Quitter** (comme sur la fiche de sortie et le duo). Écriture jusqu'à `votesCloseAt`, puis lecture 7 j, purge 90 j.

### 2.9 CheckIn — `outings` (livré T2) et `connections` (RDV duo)
Fenêtre `[startsAt − 30 min, startsAt + 90 min]`. `GEO` : position ponctuelle au tap, comparée au rayon `[T] safety.checkinRadiusMeters` (150), **jamais stockée ni journalisée**, aucune distance renvoyée. `VENUE_CODE` : code à 4 chiffres sur place (dérivé HMAC), 5 essais. `STAFF` : correction auditée. Le groupe ne voit que « arrivé·e » (jamais « en route », jamais « absent·e »).

### 2.10 GuardianLink (ange gardien) — module `safety` (livré E)
Jeton aléatoire 32 octets, stocké haché, montré une fois ; ≤ 3 liens actifs par sujet ; page active de `startsAt − 2 h` à `endsAt + 3 h` ; partage par la feuille native (aucun numéro du proche stocké) ; Web Push optionnel souscrit depuis la page.
Ce que voit le proche (`GET /v1/public/guardian/:token`, no-store, noindex) : prénom du propriétaire, type (sortie / rendez-vous à deux), date et heure, **nom et adresse du lieu à partir de la confirmation**, chronologie (« arrivé·e à 19 h 34 », « tout va bien », « besoin d'aide à 21 h 02 », « parti·e, mal à l'aise » si la personne l'a choisi, « terminé »), numéros d'urgence, aperçu de Blowy et lien vers la ville. **Jamais de position**, même sur « besoin d'aide » (V5.3 A.4 : le lieu de la sortie et l'heure suffisent), jamais les autres participants, le chat, Blowy+, la fiabilité.
« Besoin d'aide » (`SafetyAlert`) → statut sur la page + Web Push + dossier `SAFETY` haute priorité (trust_lead) + écran d'urgence (112). Réponse humaine visée < 1 h pendant les créneaux de sortie ; la promesse n'est affichée que lorsqu'une astreinte est planifiée (§10.1).

### 2.11 Vote d'après — module `outings` (livré T2)
`OutingVote(outingId, voterUserId, targetUserId, choice FRIEND|PLUS|NO)`, table séparée, jamais jointe à une projection d'autrui.
- **Un seul écran** : la liste des présents, une ligne par prénom (et visage) avec 3 pastilles Ami·e / Plus / Non, **Non par défaut**. Soumission groupée `PUT /v1/outings/:id/votes {choices}`, modifiable jusqu'à la clôture.
- **Les trois choix sont affichés pour tout le monde** (aucune option masquée, donc aucune fuite sur soi ni sur l'autre). Sous les boutons : « Si l'autre dit ami·e, vous restez ami·es. »
- Dépouillement **unique à `votesCloseAt`** (`[T] votes.revealMode = AT_CLOSE`) : `r = min(A→B, B→A)` sur `NO < FRIEND < PLUS` ; un PLUS incompatible (genres recherchés non réciproques, tranches d'âge, intention) devient FRIEND **en silence**. `PLUS` → Duo (`OUTING_VOTE`, `UNLOCKED`) ; `FRIEND` → BandLink ; sinon rien. Pas de vote entre membres d'une même team.
- Jamais : « tout le monde a voté », compteur de votes, progression, qui a dit non. Phrase d'écran : « Tu ne sauras jamais qui a dit non ou n'a pas voté. » Chacun ne voit que **ses propres** accords, à la clôture.
- Bulletins purgés `[T] votes.ballotRetentionDays` (7 j) après clôture ; `ConnectionReveal` garde les résultats mutuels.

### 2.12 Bande et « Ta rue » — module `connections` (livré C2 ; lecture `GET /v1/band` servie par T2)
`BandLink` = `Friendship` (paire canonique) avec `origin OUTING_VOTE|DUO_VOTE|PLUS_ONE|LEGACY_V4`. Conversation `BAND` 1:1. On ne voit jamais la bande d'autrui. « Partir proprement » (`band.leave`) : fermeture neutre, sans pénalité. Une paire liée n'est plus composée ensemble.
**Ta rue** (`GET /v1/band/street`) : vue calme où vivent les pets de ta bande, décorée par tes souvenirs ; rien à entretenir, aucune jauge, aucune notification, aucune pastille. Actions facultatives : ranger ses souvenirs (ordre d'affichage), offrir un accessoire gagné au pet d'un membre de la bande (`pets.gift_accessory`, transfert de propriété, 1 fois par accessoire, visible dans l'app seulement).

### 2.13 Duo — module `connections` (livré C2)
Mode de rencontre à l'onboarding : **« Comment tu préfères rencontrer ? » En petit groupe / À deux, par écrit d'abord / Les deux** (`meetingMode` GROUP|DUO|BOTH). La voie Duo est active pour DUO et BOTH, désactivée pour GROUP, et **jamais proposée pendant l'onboarding** à qui a choisi GROUP.
- **Quota** : gratuit = **1 duo actif** (proposition ouverte ou duo voie Duo non terminal) ; Blowy+ = duos illimités (garde-fou qualitatif : ≤ `[T] duo.maxOpenProposals` 3 propositions ouvertes, ≤ 1 nouvelle par jour). Les duos nés d'un vote PLUS ne comptent pas dans le quota.
- Proposition (`MatchProposal.kind = DUO_LANE`, lot quotidien 21 h, 48 h) : **avant le double « oui », on ne voit que le pet et l'initiale de l'autre** (+ score de vision) ; après le double oui, prénom et carte complète (pet, tranche, fiabilité).
- `EXCHANGE` (48 h, texte d'abord, sans visage ni vocal) → à `exchangeEndsAt`, si chacun a écrit ≥ `[T] duo.minMessagesEachToUnlock` (2) messages → `UNLOCKED` : visages débloqués pour les deux en même temps, vocal **facultatif** (jamais une condition). Sinon `EXPIRED` (message neutre identique).
- Indice « projet compatible » (`projectCompatible`) seulement si les sous-choix secrets concordent (§2.15) ; jamais le détail.
- Rendez-vous à deux : jamais avant le déblocage des visages ; lieu partenaire, avant `dateDeadline` (J+7, voie Duo seulement) ; gratuit ; check-in, ange gardien et fiabilité comme une sortie. Après le RDV (les deux présents) : vote d'après (même règle, un seul écran, résultat à la clôture) : PLUS → `TOGETHER`, FRIEND → BandLink + `CLOSED`, sinon `CLOSED` ; **même message neutre** pour toute fin non mutuelle, textes centrés sur la personne (pas sur le pet).
- `duos.leave` à tout moment, sans pénalité. Blocage → fermeture silencieuse.
- Œuf : uniquement si **les deux l'activent** (`eggOptInLow/High`), duo `TOGETHER` avec ≥ `[T] egg.minDuoDates` (2) RDV vécus ; jamais envoyé par l'un, jamais présenté comme objectif.

### 2.14 Memory (souvenirs du pet) — module `pets` (livré T1/T2)
`PetMemory` (append-only) : `HATCHED`, `OUTING_LIVED`, `DUO_DATE_LIVED`, `BAND_NEW_MEMBER`, `PROMISE_KEPT` (paliers de présences 1, 3, 5, 10, 20), `EGG`. Jamais perdus. Accessoires débloqués par les souvenirs (§5).

### 2.15 Reliability (fiabilité) — module `outings` (livré T2)
« venu·e à N sorties sur M » : `N = attended`, `M = attended + absences`, où **absence = no-show ou annulation après la confirmation** (D-043). `M = 0` → « Nouvelle·au ». 2 absences en `[T] reliability.noShowWindowDays` (90 j) → pause `[T] pauseDays` (7 j) ; compteur d'épisode remis à zéro ensuite. Jamais d'effet : blocage, signalement, sécurité, « je pars mal à l'aise », « je connais quelqu'un » accepté, annulation par Blowy, suppression de compte. Contestation sous 7 j (`attendance.dispute`), correction staff. Motif de signalement `REPEATED_NO_SHOW` côté trust.

### 2.16 Profil, intentions, âge et confidentialité — module `users` (livré T0/T2)
- **Date de naissance à l'inscription** ; **18+ vérifié avant la 1ʳᵉ sortie ou le 1ᵉʳ duo** : estimation d'âge au selfie, document si doute (E, `VerificationKind` `IDENTITY_AGE` pour le document, jamais stocké au-delà du résultat). Écran < 18 ans : bouton principal « Compris », secondaire discret « Je me suis trompé·e ».
- Intentions secrètes (`lookingFor` FRIENDS|STORY|BOTH ; si STORY/BOTH : `storySeriousness` « sérieuse / on verra », `kidsSomeday` facultatif) — ne servent qu'au matching et à l'indice « projet compatible » ; jamais affichées. Aucune présélection de genre ni d'intention.
- **Consentement art. 9** (`SENSITIVE_PREFERENCES`), écran dédié, montré seulement si « une histoire », **avant** les genres recherchés (`romanceGenders`) ; retrait = effacement et retour à « nouveaux potes ». L'orientation n'est jamais stockée. `meetGenders` (« qui je veux rencontrer » en groupe).
- Sous-choix sensibles, activités, semaines off, trajet : « Affiner plus tard » depuis le Profil, jamais avant le consentement.
- Phrase de confidentialité exacte (tous écrans) : « Ton orientation et ce que tu cherches ne sont montrés à personne. Seule une personne avec qui tu as un duo sait que vous vous plaisez mutuellement. »
- **Mode discret** proposé à l'onboarding (ON par défaut si « je préfère la discrétion ») : icône et notifications neutres (§9.3). Réglage « taille du pet » sur l'Accueil (client).
- **Éviter les personnes que je connais** (D-049) : écran dédié qui explique la comparaison de numéros chiffrés ; **désactivé tant que la personne ne l'accepte pas** (aucun import silencieux). §4.2.
- Onboarding (≤ 9 écrans avant « Trouvée », une question par écran ; ordre fixé par le design) : Welcome → Tu sors où ? → date de naissance → pet → vision → comment tu préfères rencontrer → intention → (si histoire) consentement → genres recherchés → créneaux (+ semaines off, trajet) → compte → Trouvée. `me.complete_onboarding` exige : date de naissance, ville/quartier, pet + vision, `meetingMode`, `lookingFor`, (consentement + `romanceGenders` si histoire), ≥ 1 créneau. Vérification 18+, selfie et photo sont exigés à « Je viens », pas avant.

### 2.17 Liens de partage — module `social` (D-047)
`ShareLink(id, slug aléatoire base36 ≥ 8, ownerUserId, cardKind, subjectRef?, createdAt, clickCount, attributedSignups, attributedFirstOutings)` : **un lien unique par carte et par personne, jamais réutilisé**, traçable (quelle carte a amené qui) ; l'écran d'invitation dit la vérité sur cet usage. `cardKind` : `INVITE` (« viens avec moi »), `CONFIRMED` (« jeudi je sors avec 4 personnes que je ne connais pas · lieu secret »), `HERE` (« Je sors ce soir », sans quartier ni heure ; lieu seulement après la sortie), `EVENING` (« on était 5 »), `BAND_GROWS` (« Ma bande s'agrandit », sans chiffre), `HELP_CITY` (« Aide Nantes à sortir »), `TEAM` (lien d'invitation de team).
Règles des cartes (testées) : jamais le prénom d'un tiers, jamais l'espèce réelle du pet d'un autre (silhouettes génériques), jamais de lieu ni d'heure en direct, chiffres toujours justes (une team compte : « 3 nouvelles personnes »). La carte « accords » est supprimée. Page publique « 3 mots » : slug aléatoire `m` + 8 base36, jamais le prénom (livré T2).

---

## 3. Visibilité — qui voit quoi

Projecteurs purs par acteur (`projectOutingFor`, `projectDuoFor`, `projectGuardianPage`, livrés), vues `.strict()`, tout le non-autorisé est **absent** du JSON. Balayage `fuite-intention-impossible.journey.ts` (livré) étendu à chaque nouvel état.

### 3.1 Sortie — co-participant·e, selon l'état
| Donnée sur une autre personne | PROPOSED (invité·e) | FORMING (confirmé·e) | CONFIRMED (dès J-1 18 h) | dès J − 3 h / CHECKIN_OPEN | DONE, présent·e (votes) | après clôture | ma place inactive |
|---|---|---|---|---|---|---|---|
| **Aperçu anonyme** : taille, union des tranches (« 26–34 »), genres agrégés (« 2 femmes, 3 hommes »), nb venant avec quelqu'un | ✓ | ✓ | ✓ | ✓ | — | — | ✗ |
| Pet (espèce, nom, accessoires, 3 traits, « 3 mots ») | ✓ | ✓ (auteur des messages) | ✓ | ✓ | ✓ | liens seulement | ✗ |
| Prénom, tranche d'âge (grille fixe, toujours incluse dans l'aperçu) | ✗ | ✗ | ✓ | ✓ | ✓ | liens seulement | ✗ |
| Visage (filigrane du prénom du regardeur) | ✗ | ✗ | ✗ | ✓ | ✓ | liens seulement | ✗ |
| Fiabilité « N sur M » | ✗ | ✗ | ✓ | ✓ | ✓ | liens seulement | ✗ |
| Ville, quartier, activité, jour, heure | ✓ | ✓ | ✓ | ✓ | ✓ | historique | ✗ |
| Lieu (nom, photo, adresse) | ✗ | ✗ | ✓ | ✓ | ✓ nom | historique (nom) | ✗ |
| Chat de groupe | ✗ | ✓ | ✓ | ✓ | ✓ jusqu'à clôture | lecture 7 j | ✗ |
| « X ne pourra pas venir » | ✗ | ✓ (pet) | ✓ (prénom) | ✓ | — | — | ✗ |
| « X est arrivé·e » | ✗ | ✗ | ✗ | ✓ pendant le check-in | ✗ | ✗ | ✗ |
| « Cette semaine, sortie entre amis pour toi » | moi seul·e, si la garantie n'a pas pu être tenue (§4.3), sans chiffre | | | | | | |
| Absence, motif d'annulation, retrait, « je connais quelqu'un », « je pars mal à l'aise » | jamais | | | | | | |
| Position de check-in | jamais (non stockée) | | | | | | |
| Votes d'autrui, compteurs, « non », « plus » | jamais ; accords mutuels : moi et l'autre seuls, à la clôture | | | | | | |
| Garantie « ≥ 2 compatibles » (vraie ou fausse), qui est compatible | **jamais** (D-038) | | | | | | |
| Financement, Blowy+, intentions, genres recherchés, âge exact | jamais | | | | | | |
Règle générale affichable (pas un fait sur le groupe) : « Jamais plus de 3 personnes du même genre dans un groupe. » Personne bloquée ou évitée : jamais dans la même sortie active ; dans l'historique, données retirées pour le bloqueur.

### 3.2 Autres acteurs
| Donnée | Moi | Bande | Duo proposé (avant double oui) | Duo EXCHANGE | Duo UNLOCKED+ | Ange gardien | Lieu partenaire | Cartes / public | support | ops | trust_lead | finance | analyst |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Prénom | ✓ | ✓ | **initiale** | ✓ | ✓ | propriétaire seul | ✓ (liste « table Blowy », J-1 18 h) | jamais d'un tiers | ✓ | ✓ | ✓ | fiche | ✗ |
| Pet | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | silhouettes génériques | ✓ | ✓ | ✓ | ✗ | agrégats |
| Visage | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | jamais | modération | ✗ | ✓ | ✗ | ✗ |
| Tranche, fiabilité | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | agrégats |
| Sortie (lieu, heure) | ✓ | ✗ | ✗ | ✗ | ✗ | la sienne, lieu dès J-1 18 h | la sienne | jamais en direct | ✓ | ✓ | ✓ | ✓ | agrégats |
| Check-in, « tout va bien », besoin d'aide | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ (sans position) | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | agrégats |
| Bulletins de vote | les miens | jamais pour tous les autres acteurs, staff compris | | | | | | | | | | | |
| Intentions, genres recherchés, sous-choix | ✓ | jamais | jamais | jamais | « projet compatible » seulement | jamais | jamais | jamais | jamais | jamais | jamais | jamais | agrégats ≥ 20 |
| Chats | membre | sa conversation | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | extrait signalé | ✗ | ✗ |
| Paiements, Blowy+ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | compensations agrégées | ✗ | statut | ✗ | ✗ | ✓ | agrégats |
| Contacts évités | ✗ (seulement l'effet) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | jamais | jamais | jamais | jamais | jamais |
Lecture staff auditée. Diagnostics de composition = codes sur identifiants, jamais les préférences.

### 3.3 WS et curseurs
Salles `user:<id>`, `outing:<id>` (places confirmées, puis présents jusqu'à la clôture), `duo:<id>`, `conversation:<id>` (livrées T2). Aucun événement à la saisie d'un vote ; `outing.votes_closed` et `connection.revealed` partent une seule fois à la clôture. Le `projectionCursor` n'avance que sur les événements visibles du destinataire.

---

## 4. Composition des groupes (`packages/matching/src/groups`, livré T1 + garantie)

Pur, déterministe (`seed = "outings|<scope>|<weekKey>|<tuningVersion>"`, FNV-1a), entiers, `algoVersion = groups-2026.12.1`. Le backend collecte, exécute, persiste (`CompositionRun(scope, weekKey, kind WEEKLY|SEEDING)`).

### 4.1 Entrées
`OutingCandidate` : profil de matching existant, `lookingFor`, `meetGenders`, `romanceGenders`, tranche d'âge (`ageBracketOf`) et `groupAge`, créneaux disponibles, activités, quartiers acceptables, `teamId`, présences, priorité (`missedWeeks`, `firstOuting`, `requestedAtMs`). `CompositionFacts` : paires bloquées, déjà vues, **évitées** (§4.2). `SlotOffer` : `venueSlotId, neighborhoodId, activity, startsAtMs, remainingOutings`. **Le financement n'est pas une entrée.**
Périmètre : la ville (`Zone`), tous les quartiers `LIVE` ou `WAITLIST` (D-035) ; une personne ne peut être placée que sur un créneau coché, une activité choisie et un quartier acceptable.

### 4.2 Contraintes dures par paire (`PAIR_FILTERS`, filtres nommés)
`SELF`, `NOT_ADULT`, `NOT_VERIFIED`, `INACTIVE_ACCOUNT`, `AGE_PREFERENCE` (tranches fixes vs `groupAge`), `MEET_GENDER`, `BLOCKED_OR_REPORTED`, `MET_BEFORE` (déjà co-présents, lien de bande, duo, proposition duo refusée < 90 j ; sauf team), `KNOWN_CONTACT` (nouveau : paire issue de « éviter les personnes que je connais », symétrique, jamais révélée), `LIMIT_GHOSTER` (ratio de présence).
Compatibilité « histoire » `storyCompatible(a,b)` : les deux cherchent une histoire, genres recherchés réciproques, tranche de chacun dans le `groupAge` de l'autre.

### 4.3 Objectif et contraintes de groupe
- `w(a,b)` = moyenne symétrique de `scoreVision` avec `visionWeights` (G = 0, aucune distance) ; `w ≥ [T] minPairScore` (35).
- `J(G)` = `1000·mean(w) + λr·romCov + λf·friendFit + λg_story·storyCov − λg·genderImb − λs·|5 − |G||` ; **garantie silencieuse** : `storyCov` = part des chercheurs d'histoire ayant ≥ `[T] storyGuarantee.minCompatible` (2) personnes `storyCompatible` hors team (λ 16 000). C'est un **objectif**, pas une contrainte dure (une contrainte ferait chuter le placement) ; quand elle n'est pas tenue pour quelqu'un, `friendsOnly[userId] = true` et seule cette personne voit « Cette semaine, sortie entre amis pour toi » avec, sur la même fiche, un autre créneau ou le Duo si disponibles (D-038). Mesuré : 54–58 % des chercheurs d'histoire garantis sur la population synthétique (engine-rules §12.1).
- Contraintes dures : taille 4–6 (cible 5 ; amorçage ≤ 6) ; créneau, activité et quartier communs ; team ensemble ; un « histoire seulement » a ≥ 1 `storyCompatible` ; **jamais plus de 3 personnes du même genre** (`[T] composition.maxSameGender = 3`, D-039 — remplace la pénalité douce `maxGenderSharePermille`) ; exception : groupe dont **tous** les membres ont restreint `meetGenders` au même genre (groupe non mixte demandé) — l'écran de ces personnes dit « groupe non mixte, comme tu l'as demandé ».
- L'aperçu anonyme est calculé sur le groupe réel, team comprise.

### 4.4 Procédure
Unités (team = unité de 1–3) → ordre de priorité (`missedWeeks` desc, `firstOuting` desc, `requestedAtMs` asc, FNV) → glouton par graine et par créneau → réparation → échanges locaux (≤ 200 passes) → non placés `POOL_TOO_SMALL | NO_COMPATIBLE_GROUP | NO_SLOT_CAPACITY | TEAM_INCOMPATIBLE` (jamais montrés tels quels ; l'écran d'attente utilise `nextOutingGap`). Amorçage : `composeSeedingOutings` toutes les 15 min hors cycle hebdo. Performance mesurée : 2 000 candidats ≈ 1,7 s.

### 4.5 « Éviter les personnes que je connais » (E + B, D-049)
Opt-in sur écran dédié. La personne enregistre son propre numéro (vérifié par SMS via le fournisseur d'auth) → stocké seulement en `HMAC(pepper serveur, E.164)`. Ses contacts sont normalisés en E.164 et hachés **sur l'appareil** (SHA-256), envoyés en lot, transformés côté serveur en HMAC puis comparés aux numéros enregistrés ; seules les **paires à éviter** (`AvoidPair`, symétriques) sont gardées, les empreintes reçues sont jetées immédiatement (jamais stockées, jamais journalisées). Aucune des deux personnes n'est informée. Retrait du consentement = suppression des paires et du numéro.

### 4.6 Backfill
Places libérées avant la confirmation → `backfillCandidate` (même contraintes, invitation `min(now + 12 h, lockAt)`), job `outings.lifecycle`. Après la confirmation : pas de backfill (sauf déplacement « je connais quelqu'un » vers un autre groupe du créneau).

### 4.7 Tests exigés
Livrés : déterminisme, permutation, blocage, tailles, team, capacité, garantie (5 tests), perf. **À ajouter (B)** : `maxSameGender` dur (y compris amorçage 3 + 3), exception non mixte, `KNOWN_CONTACT`, invariance de `friendsOnly` à l'identité des compatibles.

---

## 5. Le pet en V5 (`packages/pet-engine`, livré T1)

`@blowy/pet-engine/v5` : `reduceV5` sur souvenirs et accessoires, sans jauge, sans perte, sans multiplicateur payant ; `migratePetV4ToV5`. V4 isolé dans `@blowy/pet-engine/v4` (déprécié, rejeu). Stades V5 : jeune 100, adulte 600 (`[T] memories.stageThresholds`). Événements `MEMORY_RECORDED`, `ACCESSORY_GRANTED` (sources `MEMORY | REFERRAL | STAFF | GIFT` ; `PLUS_MONTHLY` mort, D-041), `ACCESSORY_EQUIP` (≤ 3), `REACT`. Poses V5 : jamais `SICK`, `HUNGRY`, `SAD`.
Ajout (B) : événement `ACCESSORY_GIFTED {fromPetId, toPetId, accessoryId}` pour « Ta rue » (transfert, 1 fois par accessoire, bande uniquement).
Consommateurs du module `pets` : `outing.attendance_recorded` → `OUTING_LIVED` ; `connection.revealed{FRIEND}` / `band.linked` → `BAND_NEW_MEMBER` ; `duo.date_done` → `DUO_DATE_LIVED` ; `referral.first_outing_lived` → accessoire de parrainage. Le pet n'est jamais un argument de vente ni une corvée.

---

## 6. Économie V5

### 6.1 Ce qui reste de `apps/api/src/modules/economy`
| Élément | Devenir |
|---|---|
| RevenueCat (webhooks, réconciliation, `Subscription`, `EntitlementGrant`, états, sandbox/prod) | **gardé et central** : Blowy+ est un **achat intégré** (D-040) |
| `LOCAL_DEMO` | gardé (achats démo hors production) |
| Ledger pièces (`Wallet`, `LedgerEntry`) | gelé (lecture, corrections staff) ; patron réutilisé pour les crédits |
| Boost, gels, pièces mensuelles, `DERIVED_PARTNER`, espèces premium, XP×2, accessoires vendus | retirés (410) |
| `ProviderWebhookEvent` | gardé (+ `STRIPE`) |

### 6.2 Produits et prix (paramètres `[T] pricing`, `[T] plus` ; prix publics fixés par l'utilisateur)
| Produit | Prix | Fournisseur | Contenu |
|---|---|---|---|
| 1ʳᵉ sortie | **offerte** | interne (`FREE_FIRST`, unique par personne, accordé à la 1ʳᵉ vérification 18+) | — |
| Place de sortie | **4,99 €** (`pricing.seat.amountCents = 499`), consommation **non incluse** | **Stripe PaymentIntent, Apple Pay / Google Pay / carte** (service consommé hors de l'app) ; les écrans disent « Apple Pay », jamais « App Store » | une place, remboursée si la sortie n'a pas lieu ou si annulée avant la confirmation |
| Duo | **gratuit : 1 duo actif** | — | |
| **Blowy+** | **9,99 €/mois** (`plus.monthlyPriceCents = 999`) | **achat intégré via RevenueCat** (contient des fonctions numériques : duos illimités) | toutes tes sorties (1 par semaine, quota inchangé) + duos illimités ; rentable dès la 2ᵉ sortie du mois ; aucun accessoire, aucune réduction de rétention |
| Accessoires | non vendus | — | uniquement gagnés (souvenirs, parrainage, cadeau de la bande) |
Les deux choix de fournisseur sont **à revalider juridiquement avant soumission** (D-040). Interdits (tests de contrat) : aucun produit ne touche la composition, la priorité, la visibilité, le quota hebdo, le score ou les votes ; pas de paywall ni d'argument Blowy+ dans l'onboarding ; pas d'offre limitée, de compte à rebours, d'offre hebdo, d'offre de rétention ; on ne promet jamais de résilier un abonnement depuis l'app (renvoi vers les réglages Apple / Google).

### 6.3 Paiements, droits et crédits
- `Payment(provider STRIPE|LOCAL_DEMO, environment, providerPaymentId, purpose SEAT, seatId UNIQUE, amountCents, currency, status, refundProviderId?)`. Flux : « Je viens » → place `HELD` (tx) → `PaymentIntent` après commit (`Idempotency-Key seat:<seatId>`) → PaymentSheet → webhook `payment_intent.succeeded` (signature Stripe sur corps brut, idempotent par `event.id`) → `CONFIRMED`. Port `SeatFundingPort` (livré T2 avec `LocalSeatFunding`) ; adaptateur Stripe réel = T3.
- Blowy+ : droit `PLUS_INCLUDED_OUTINGS` + `PLUS_UNLIMITED_DUOS` (`EntitlementKeyV5`) dérivé de l'entitlement RevenueCat `blowy_plus` par `EntitlementStateService` ; une place financée `PLUS_INCLUDED` ne consomme rien. Expiration ou remboursement Apple : places déjà confirmées conservées ; duos au-delà de 1 restent ouverts mais aucune nouvelle proposition tant que le quota gratuit est dépassé (aucun duo n'est fermé de force).
- `OutingCreditEntry` (append-only) réduit à `FREE_FIRST` et `STAFF_GRANT` (+ recrédit de `FREE_FIRST`) ; `PLUS_INCLUDED` et `REFUND_CREDIT` ne sont plus émis (D-042).

### 6.4 Remboursements automatiques
| Cas | `PAID` | `FREE_FIRST` | `PLUS_INCLUDED` |
|---|---|---|---|
| Sortie annulée par Blowy (sous-effectif, lieu, staff) | remboursement carte intégral | reste offerte (recrédit) | — |
| Annulation par la personne **avant la confirmation** (J-1 18 h) | remboursement carte intégral | reste offerte | — |
| Retrait système (blocage, « je connais quelqu'un ») ou sécurité | remboursement carte intégral | reste offerte | — |
| Paiement arrivé trop tard / sortie pleine | remboursement carte intégral | — | — |
| Annulation après la confirmation, absence | **aucun** (le prix va au lieu, §6.5) | consommée | consommée |
| Suppression de compte avec place active | remboursement carte | perdue | — |
| Litige lieu | manuel `finance` (step-up) | recrédit manuel | — |
Outbox `outing.seat_refund_due {seatId, mode}` → `economy` (hors verrou) → Stripe refund (`Idempotency-Key refund:<seatId>`) ; une seule fois par place ; échecs en file admin ; notification `outing.refund_done` (jamais le mot « remboursé·e » pour une place offerte).

### 6.5 Compensation du lieu (D-045)
Pour chaque place **non honorée après la confirmation** (absence ou annulation tardive ; pas les retraits système, ni sécurité, ni « je connais quelqu'un » accepté) :
- place `PAID` → le **prix de la place (4,99 €)** est reversé au lieu ;
- place offerte ou incluse (`FREE_FIRST`, `PLUS_INCLUDED`, `STAFF_COMP`) → Blowy verse **3 €** (`[T] venues.compensationUnpaidSeatCents = 300`) ;
- annulation de sécurité après la confirmation → Blowy verse 3 € (le lieu n'est pas pénalisé, la personne est remboursée).
`VenueCompensation(venueId, seatId UNIQUE, amountCents, basis PAID_SEAT|UNPAID_SEAT|SAFETY, period 'YYYY-MM', status ACCRUED|STATEMENTED|PAID)` créée à `DONE` (ou à l'annulation tardive) par `outings` via outbox `outing.venue_compensation_due` → `economy`. Relevé mensuel par lieu (§10.2) ; virement hors périmètre (facturation). Le forfait 15 € de V5.2 est abandonné. Le P&L est dans `docs/product/business-model.md`.

---

## 7. API /v1 — commandes, requêtes, événements

Commandes : `Idempotency-Key` obligatoire. Listes : `?cursor&limit` (keyset). Contrats Zod : `packages/api-contract/src/{neighborhoods,outings,teams,connections,safety,payments,events-v5}.ts` (livrés T0, enrichis T2). « Livré » = route existante ; « à faire » = tranche indiquée.

### 7.1 Ville, profil, préférences
| Opération | Route | Payload / réponse | Échecs | État |
|---|---|---|---|---|
| (requête) | `GET /v1/neighborhoods?q=` | `items[{id, slug, name, city, status}]` (recherche sans accents) | — | livré |
| `me.set_neighborhood` | `PUT /v1/me/neighborhood` | `{neighborhoodId}` | 412 `NEIGHBORHOOD_CHANGE_TOO_SOON {availableAt}`, `ACTIVE_SEAT_EXISTS` | livré |
| (requête) | `GET /v1/me/neighborhood` | `{neighborhood, cityVerifiedCount, nextOutingGap?{missing, startsAt}, isVerified, hasPhoto}` (plus de `threshold`) | — | livré, à aligner (retirer `threshold` s'il est encore servi) |
| `me.update_intentions` | `PUT /v1/preferences/intentions` | `{lookingFor, storySeriousness?, kidsSomeday?, meetingMode, meetGenders[], romanceGenders[]}` | 403 `CONSENT_REQUIRED {purpose:"SENSITIVE_PREFERENCES"}` | livré |
| `me.update_outing_preferences` | `PUT /v1/preferences/outings` | `{slotTemplateIds[], weeksOff[], activities[], acceptableNeighborhoodIds[] (≤ 5), maxTravelMinutes 20\|30\|45, groupAge{min,max}}` | 400 | livré |
| `me.update_privacy` | `PUT /v1/preferences/privacy` | `+ discreetMode` | 400 | livré |
| `me.contacts_avoid.enable` | `POST /v1/me/contact-avoidance` | `{phoneVerificationToken}` puis `POST /v1/me/contact-avoidance/contacts {hashes[] (SHA-256 E.164, ≤ 2 000/lot)}` → `{accepted}` (aucun retour de correspondance) | 403 `CONSENT_REQUIRED {purpose:"CONTACT_AVOIDANCE"}` ; 429 | à faire (E) |
| `me.contacts_avoid.disable` | `DELETE /v1/me/contact-avoidance` | efface numéro et paires | — | à faire (E) |
| `me.complete_onboarding` | `POST /v1/me/onboarding/complete` | `missing` : `BIRTHDATE, CITY, PET, MEETING_MODE, LOOKING_FOR, SENSITIVE_CONSENT, ROMANCE_GENDERS, SLOTS` | 412 `ONBOARDING_INCOMPLETE` | livré, à aligner |
| `me.start_pause` / `me.end_pause` | `POST /v1/pauses` · `DELETE /v1/pauses/:id` | pause en 1 tap | 412 `PAUSE_QUOTA_EXCEEDED` | livré |

### 7.2 Sorties et teams
| Opération | Route | Payload → réponse | Échecs | État |
|---|---|---|---|---|
| (requête) | `GET /v1/outings/week` | `{weekKey, phase NOT_AVAILABLE\|COMPOSING\|INVITED\|IN_OUTING\|UNPLACED\|PAUSED\|QUOTA_USED\|WEEK_OFF, myOutingId?, nextOutingGap?, priorityNextWeek, pausedUntil?}` | — | livré |
| `outings.request` / `withdraw_request` | `PUT\|DELETE /v1/outings/requests/:weekKey` | ajustement de la demande auto | 412 `NEIGHBORHOOD_UNAVAILABLE`, `AGE_VERIFICATION_REQUIRED`, `VERIFICATION_REQUIRED`, `PHOTO_REQUIRED`, `RELIABILITY_PAUSED`, `REQUEST_WINDOW_CLOSED` ; 409 `WEEKLY_QUOTA_USED` | livré, à aligner (`NEIGHBORHOOD_NOT_LIVE` → `NEIGHBORHOOD_UNAVAILABLE`, ajout `AGE_VERIFICATION_REQUIRED`) |
| (requête) | `GET /v1/outings/:id` | `OutingView` (§7.5) | 404 | livré |
| `outings.seat.accept` (« Je viens ») | `POST /v1/outings/:id/seat/accept` | → `{seat{status, funding?, holdExpiresAt?}, payment?{provider, clientSecret, amountCents:499, currency}}` | 412 `INVITATION_EXPIRED`, `SEAT_NOT_INVITED`, `AGE_VERIFICATION_REQUIRED` ; 409 `WEEKLY_QUOTA_USED` ; 503 `PROVIDER_UNAVAILABLE` | livré (démo), Stripe T3 |
| `outings.seat.decline` | `POST …/seat/decline` | — | | livré |
| (requête) | `GET …/seat/cancel-preview` | `{cancelKind EARLY\|LATE, refund CARD\|STAYS_FREE\|NONE, countsAsAbsence}` | | livré, à aligner (`CREDIT` → `CARD`/`STAYS_FREE`) |
| `outings.seat.cancel` | `POST …/seat/cancel` | `{kind: CANT_MAKE_IT\|SAFETY}` | 412 `SEAT_NOT_ACTIVE`, `OUTING_STARTED` | livré |
| `outings.seat.knows_someone` | `POST …/seat/knows-someone` | `{relation: EX\|COLLEAGUE\|CONFLICT\|OTHER}` → `{status ACCEPTED\|IN_REVIEW}` | 412 `KNOWS_SOMEONE_NOT_AVAILABLE`, `KNOWS_SOMEONE_QUOTA` | livré |
| `outings.leave_uncomfortable` | `POST /v1/outings/:id/leave-uncomfortable` | `{notifyGuardian: bool}` → `{supportContacted:true}` | 412 `NOT_CHECKED_IN` | à faire (E, `safety`) |
| `outings.check_in` | `POST …/check-in` | `{method GEO, lat, lng, accuracyM}` \| `{method VENUE_CODE, code}` | 412 `CHECKIN_NOT_OPEN`, `CHECKIN_TOO_FAR`, `CHECKIN_LOW_ACCURACY`, `CHECKIN_CODE_INVALID` ; 429 | livré |
| (requête) | `GET /v1/outings/:id/votes` | `{closesAt, rows[{userId, firstName, face, pet, myChoice (défaut NO)}], results?[{userId, mutual FRIEND\|PLUS}] (après clôture)}` | 404 si non présent·e | livré |
| `outings.votes.submit` | `PUT /v1/outings/:id/votes` | `{choices[{targetUserId, choice}]}` → `{saved:true}` | 404 ; 412 `VOTE_WINDOW_CLOSED` | livré |
| `attendance.dispute` | `POST …/attendance/dispute` | `{note}` | 412 `DISPUTE_WINDOW_CLOSED`, `NOT_ABSENT` | livré |
| (requêtes) | `GET /v1/outings/history`, `GET /v1/me/reliability` | | | livré |
| teams | `GET /v1/teams/mine`, `POST /v1/teams/join {code}`, `POST /v1/teams/:id/leave`, `POST /v1/teams` (créer + lien `TEAM`) | | 409 `TEAM_FULL`, `ALREADY_IN_TEAM` | livré (création de lien unique : à aligner §2.17) |

### 7.3 Bande, Ta rue, duos
| Opération | Route | Notes | État |
|---|---|---|---|
| (requête) | `GET /v1/band`, `GET /v1/band/street` | Ta rue : pets de la bande + souvenirs rangés, sans compteur | livré |
| `band.leave` | `POST /v1/band/:linkId/leave` | | livré |
| `pets.gift_accessory` | `POST /v1/band/:linkId/gift {accessoryId}` | 412 `ACCESSORY_NOT_OWNED`, `ALREADY_GIFTED` | à faire (C2 + B) |
| `pets.arrange_memories` | `PUT /v1/pets/mine/memories/order {memoryIds[]}` | | à faire (C) |
| (requête) | `GET /v1/duo-lane` | `{enabled, freeQuota:1, unlimited:bool, proposals[{id, pet, initial, visionScore, expiresAt}]}` — initiale seulement | livré, à aligner (initiale, quota 1/illimité) |
| `duos.proposal.accept` / `pass` | `POST /v1/duo-lane/proposals/:id/accept\|pass` | 409 `DUO_LIMIT_REACHED {upgrade:false}` (aucun argument commercial dans l'erreur ; l'écran explique le quota) | livré, à aligner |
| (requêtes) | `GET /v1/duos`, `GET /v1/duos/:id`, `GET /v1/duos/:id/venues` | `DuoView` : `other{initial \| firstName, pet, face?}`, `exchange{endsAt, mineCount}`, `projectCompatible?` | livré |
| RDV | `POST /v1/duos/:id/dates`, `…/dates/:dateId/respond\|cancel\|check-in`, `PUT …/vote` | 412 `DUO_NOT_UNLOCKED` avant les visages | livré |
| `duos.leave` | `POST /v1/duos/:id/leave` | | livré |
| `duos.egg.opt_in` | `PUT /v1/duos/:id/egg {optIn}` | œuf seulement si les deux | livré |

### 7.4 Sécurité, paiements, partage
| Opération | Route | Notes | État |
|---|---|---|---|
| ange gardien | `POST\|GET /v1/safety/guardian-links`, `DELETE …/:id`, `POST /v1/safety/ok`, `GET /v1/safety/status` | | livré |
| besoin d'aide | `POST /v1/safety/alerts {subject}` (**sans position**), `POST …/:id/resolve` | limite dédiée 10/h, jamais le rate limit global | livré, à aligner (ignorer/refuser `position`) |
| page proche | `GET /v1/public/guardian/:token`, `POST …/push` | 404 identique pour inconnu/expiré/révoqué | livré, à aligner (aucune position) |
| signalement | `POST /v1/reports` (existant) | catégories V5 : `OUTING_THREAT` (menace d'outing), `IRL_BEHAVIOR`, `ON_SITE_INCIDENT`, `REPEATED_NO_SHOW` | livré |
| place | `GET /v1/purchases/products` | `{seat{amountCents:499, currency}, plus{storeProductId, priceLabel (du store)}, firstOutingFree}` | à aligner (T3) |
| Blowy+ | achat intégré mobile (RevenueCat SDK) → `POST /v1/purchases/sync` (existant) | `GET /v1/subscriptions/me` expose `PLUS_INCLUDED_OUTINGS`, `PLUS_UNLIMITED_DUOS` | à faire (G) |
| webhook Stripe | `POST /v1/webhooks/stripe` | signature, idempotent | à faire (G) |
| partage | `POST /v1/share-links {cardKind, subjectRef?}` → `{url}` (toujours un nouveau lien) · `GET /v1/public/s/:slug` (redirection + attribution) | 412 `CARD_NOT_AVAILABLE` (ex. `HERE` avant la sortie avec lieu) | à faire (F + social) |
| pets | `GET /v1/pets/mine`, `GET /v1/pets/mine/memories`, `PUT /v1/pets/mine/accessories` | | livré |

### 7.5 `OutingView` (champs selon §3.1 ; contrat `.strict()` livré)
```
{ id, status, weekKey, city, neighborhood{name}, activity, startsAt, endsAt, capacity, confirmedCount,
  preview{size, ageMin, ageMax, genders{WOMAN?,MAN?,NON_BINARY?,UNDISCLOSED?}, withSomeone},   // aperçu anonyme
  storyMatch?: 'FRIENDS_ONLY',                                // moi seul·e, sinon absent
  mySeat{status, funding?, holdExpiresAt?, acceptDeadline?},
  timeline{acceptDeadline, lockAt, photoRevealAt, checkinOpensAt, checkinClosesAt, votesCloseAt},
  venue?{name, photo, address, reservationName:'Blowy', lat, lng},   // dès lockAt
  members[{ userId, pet{name, species, equipped, traits[3]}, threeWords[],
            firstName?, ageRange?, reliability?, face?{url (filigrané)}, arrived?, notComing? }],
  knowsSomeoneAvailable?, conversationId?, votes?{open, closesAt}, cancelled?{reason, refund} }
```
Visages : jetons média courts émis par `media` sur ACL `OUTING_REVEAL` (place confirmée, `now ≥ photoRevealAt`, `< votesCloseAt`), dérivé **filigrané au prénom du regardeur, généré côté serveur** (dérivé `WATERMARKED_VIEWER`, cache ≤ 24 h) ; Android `FLAG_SECURE` ; iOS : détection de capture → avertissement au regardeur, signal trust si répété.
Écart à aligner (C) : `storyMatch` réduit au littéral `'FRIENDS_ONLY'` ; `preview` déjà servi.

### 7.6 Événements WS (livrés T0 dans `events-v5.ts`, ajouts marqués)
`outing.invited`, `outing.updated {changed: STATUS|MEMBERS|VENUE|FACES}`, `outing.seat_updated`, `outing.checkin_updated`, `outing.votes_opened`, `outing.votes_closed {newBandCount, newDuoCount}` (ses accords seulement), `connection.revealed` (aux deux, à la clôture), `band.updated`, `duo.updated`, `reliability.updated`, `pet.updated`, `team.member_joined`, `safety.alert_ack`, `access.revoked`. Ajout : `outing.knows_someone_resolved {status}` (soi seulement).

### 7.7 Déprécié (V4) — 410 `GONE {reason:"RETIRED_IN_V5"}`
Liste dans `api-contract/src/core/retired.ts` (livré) : actions/déplacement du pet, emménager, vote de branche, révélation photo V4, gels, achats catalogue (gel, boost, œuf rare), indices, missions, ligues, carte, Quartier. **Activation différée** jusqu'à la réécriture des parcours V4 par H (sinon ils cassent) — décision A.

### 7.8 Jobs
`neighborhoods.generate_slots` (quotidien) · `outings.auto_requests` (lundi 9 h : demandes depuis disponibilités — à aligner si T2 crée les demandes autrement) · `outings.compose` (mardi 12 h, `CompositionRun` unique) · `outings.seeding` (15 min) · `outings.lifecycle` (5 min : transitions, holds, backfill) · `outings.purge` · `duos.lifecycle` · `economy.refunds`, `economy.venue_compensations` (mensuel) · `notifications.plan` (5 min).

---

## 8. Schéma

### 8.1 Migrations appliquées (ne jamais réécrire)
`20261031233029_init`, `20261031233100_constraints`, `20261101013448_trust_media_ai`, **`20261106120000_v5_enums`**, **`20261106120100_v5_outings`** (quartiers, lieux, créneaux, préférences de sortie, team, demande, composition, sortie, place, check-in sans position, votes, révélations, duo, fiabilité, contestation, souvenirs, accessoires ; colonnes `User.neighborhoodId`, `MatchPreferences.lookingFor/storySeriousness/kidsSomeday/meetingMode/meetGenders/romanceGenders`, `PrivacySettings.discreetMode`, `PetState.engineStateV5`, `Conversation.outingId/duoId/friendshipId`, `Message.promptId`, `Friendship.origin…`), **`20261106130000_v5_2`** (`ON_SITE_INCIDENT`, `KnowsSomeoneRequest`), **`20261106140000_v5_safety`** (`GuardianLink`, `GuardianPushSubscription`, `SafetyAlert`, `SafetyOkSignal`, `SafetySystemRemoval`, `SafetyIncident`, `REPEATED_NO_SHOW`, `Report.outingId`), **`20261106170000_v5_connections`** (`DuoDate`, `DuoVote`, `DuoDateCheckInAttempt`, `DuoLanePass`, colonnes œuf du duo).

### 8.2 Prochaine migration proposée `…_v5_3` (additive, propriétaire C)
| Objet | Contenu |
|---|---|
| `Venue` | colonnes `photoMediaId`, `tableCap int CHECK > 0`, `reservationName default 'Blowy'`, `contractVersion`, `contractSignedAt` (si absentes) |
| `VenueCompensation` | `venueId, seatId UNIQUE, amountCents CHECK > 0, basis, period, status` ; INDEX (venueId, period) |
| `VenuePartnerAccess` | `userId, venueId, role 'venue_partner'`, UNIQUE (userId, venueId) ; enum `StaffRole += venue_partner` (dans une migration d'enum séparée) |
| `ShareLink` | `slug UNIQUE, ownerUserId, cardKind, subjectRef, clickCount, attributedSignups, attributedFirstOutings, createdAt` ; INDEX (ownerUserId, cardKind) |
| `ShareAttribution` | `shareLinkId, userId UNIQUE` (premier lien qui a amené la personne) |
| `PhoneIdentity` | `userId UNIQUE, phoneHmac UNIQUE, verifiedAt` |
| `AvoidPair` | `userLowId, userHighId, createdAt`, UNIQUE, CHECK low < high — **aucune colonne de numéro ni d'empreinte de contact** |
| `UncomfortableLeave` | `seatId\|duoDateId, userId, notifiedGuardian, createdAt` (ou réutiliser `SafetyIncident` avec un type `UNCOMFORTABLE_LEAVE` : à trancher par E selon sa table) |
| `PetMemory` | colonne `displayOrder int?` (Ta rue) |
| `PetAccessory` | colonnes `giftedFromPetId?`, `giftedAt?` |
| `MediaDerivativeKind` | `+= WATERMARKED_VIEWER` |
| `ProcessingConsent.purpose` | valeur `CONTACT_AVOIDANCE` (texte, pas d'enum) |

### 8.3 Devient mort (conservé, plus écrit)
Liste V4 inchangée (jauges, relations DATE/NEIGHBORHOOD/GROUP, consentements V4, votes de branche, missions, séries, ligues, gels, boost, pièces mensuelles, `SafetyDate`/`GuardianInvitation`/`LocationShare`/`SafetyLocationPoint`/`SafetyCheckIn`, `User.reliability`, `MatchPreferences.intention/seekingGenders/maxDistanceKm/areaCell*/widenConsented`, `PrivacySettings.mapVisible/photoPreference`). **Nouveaux morts V5.1–V5.3** : `Neighborhood.densityThreshold` (indicateur admin seulement), colonnes de position de `SafetyAlert` (plus jamais remplies ; purge des éventuelles valeurs), `OutingCreditEntry` kinds `PLUS_INCLUDED`/`REFUND_CREDIT`, `OutingSeat.funding = CREDIT`, `OutingRequest.companionUserId` (remplacé par `teamId`), `OutingVote.revealedAt` (dépouillement unique), `MonthlyBenefitGrant`, accessoire mensuel Blowy+.

### 8.4 Rétention (à reporter dans `docs/privacy/retention.md` par E)
Position de check-in : jamais stockée. Position de « besoin d'aide » : **jamais collectée**. Bulletins : 7 j après clôture. Chat de groupe : lecture 7 j, purge 90 j. `GuardianLink` : métadonnées 30 j après expiration, push purgé à + 24 h. Empreintes de contacts : jamais stockées ; `AvoidPair` et `PhoneIdentity` : jusqu'au retrait du consentement. `ShareLink` : 13 mois (attribution agrégée ensuite). Dérivés filigranés : ≤ 24 h. Paiements et compensations : durée comptable (à valider), pseudonymisés. Intentions et genres recherchés : vie du compte sous consentement ; effacés au retrait.

---

## 9. Notifications V5

### 9.1 Liste
| Clé | Quand | Destinataire |
|---|---|---|
| `outing.invited` | composition / amorçage / backfill | invité·e — **la seule notification de proposition, ≤ 1 par semaine** (`[T] maxOutingProposalsPerWeek`) |
| `outing.seeding_invited` | sortie d'amorçage | invité·e (compte dans la même limite) |
| `outing.invite_reminder` | `acceptDeadline − 4 h` | non répondu, une fois, sans urgence |
| `outing.unplaced` | fin de composition | non placé·e : « tu es prioritaire la semaine prochaine » |
| `outing.formed` | `FORMING` | confirmés |
| `outing.confirmed` | J-1 18 h | confirmés : lieu + groupe ; rappel que l'annulation compte désormais |
| `outing.faces` | J − 3 h | confirmés |
| `outing.checkin_open` | J − 30 min | confirmés (transactionnel) |
| `outing.cancelled`, `outing.composition_changed`, `outing.refund_done` | | concernés (transactionnels) |
| `votes.opened`, `votes.reminder` (clôture − 12 h, sans dire qui a voté), `votes.closed` (ses accords ou texte neutre) | | présents |
| `duo.matched`, `duo.unlocked`, `duo.date_*`, `duo.deadline_soon`, `duo.closed` | | concernés ; propositions duo **sans push** (visibles dans l'app) |
| `team.member_joined` | | team |
| `message.human` | message publié | regroupé par conversation — **seule pastille autorisée entre deux sorties** |
| `reliability.paused` | | concerné·e, ton non culpabilisant |
| `safety.*` | | jamais supprimées |
| Retirées | `outing.request_open`, `outing.request_last_call` (la demande est automatique), `neighborhood.launched` (plus de ville fermée), STREAK, MISSION, MATCH V4, `duo.proposal` en push | |

### 9.2 Rythme
3/jour max (4 le jour d'une sortie, transactionnels et sécurité compris dans 4 sauf sécurité illimitée), heures calmes 23 h–8 h (sauf sécurité ; avancé à 22 h 30 ou reporté), regroupement par conversation/sortie, aucune notification ni pastille entre deux sorties hors messages reçus et transactionnels, aucune pendant une pause (sauf transactionnels de places déjà confirmées et sécurité).

### 9.3 Mode discret
Icône alternative ; push « Rappel » / « Tu as du nouveau » sans prénom, pet, lieu, ni mot « sortie »/« duo » ; contenu masqué sur écran verrouillé ; variantes `<key>.discreet` limitées à `{heure}` (livré T1).

---

## 10. Admin et espace lieu

### 10.1 Staff (`apps/admin`, rôle `ops` livré en domaine)
| Section | Rôles | Contenu |
|---|---|---|
| Villes et quartiers | ops, admin | statut (`LIVE`/`WAITLIST`/`PAUSED`/`CLOSED`), créneaux types par activité, personnes vérifiées par ville (agrégats), écarts « il manque N » par créneau ; plus de bouton « lancer au seuil » |
| Lieux | ops, admin | fiche, photo, activités, plafond de tables, créneaux, contrat (version signée), rotation du secret de code, accès partenaires |
| Sorties | ops (support lecture) | effectif, statuts de places, check-ins, chronologie, rapport de composition (codes, couverture de la garantie agrégée), annulation (step-up), retrait d'une place (step-up) ; jamais votes, préférences, `friendsOnly` individuel |
| « Je connais quelqu'un » | support, ops | file `IN_REVIEW`, décision, déplacement vers un autre groupe |
| Présences et litiges | support, ops, trust_lead | contestations, corrections (step-up) |
| Sécurité | trust_lead | « besoin d'aide » en temps réel, « je pars mal à l'aise » (3ᵉ occurrence → tâche de recontact), dossiers, **astreinte** : planning des créneaux couverts (`SafetyOnCallShift`) qui conditionne l'affichage de la promesse « réponse < 1 h » |
| Paiements | finance | places, remboursements, échecs, **compensations lieux** (relevés mensuels), Blowy+ (RevenueCat), webhooks Stripe |
| Partage | analyst | attribution agrégée par type de carte (K-facteur), jamais par personne nommée |
| Tuning, contenus, modération, dashboard | existants | sections V5 ; dashboard : placement, présence, absences, accords mutuels (agrégés ≥ 20), compensations, K |

### 10.2 Espace lieu partenaire (web, `apps/admin`, rôle `venue_partner`, D-046)
Connexion distincte (MFA identique), accès limité à ses lieux (`VenuePartnerAccess`). Trois écrans :
1. **Contrat d'une page** : conditions (groupe confirmé J-1 18 h, créneaux creux, sans animation, astreinte Blowy, compensation 4,99 € / 3 €), version, signature.
2. **Créneaux et plafond de tables** : activer/désactiver des créneaux, plafond, fermetures exceptionnelles (une fermeture après confirmation = annulation `VENUE_UNAVAILABLE` remboursée, signalée à ops).
3. **Effectif de la veille 18 h** : liste « table Blowy » par créneau avec **prénoms seulement** (aucune autre donnée personnelle), nombre de personnes, contact d'astreinte ; relevé mensuel des compensations.

---

## 11. Découpage en tranches

### 11.1 Ownership (inchangé sauf ajouts)
A : `packages/domain`, `api-contract/core`, décisions · B : `matching`, `tuning`, `pet-engine`, `content` · C : `prisma`, `neighborhoods`, `outings`, `conversations`, `pets`, `users`, contrats associés, `api-client` · C2 : `connections` · G : `economy`, `notifications`, `payments` · E : `safety`, `trust`, `media`, `privacy` · F : `apps/admin`, `apps/web`, module `admin`, `social` (liens de partage) · D : `apps/mobile`, `ui-mobile`, `sprites` · H : `apps/api/test/journeys`, `docs/qa` · designer : `design/v5`.

### 11.2 État et suite
| Tranche | État (2026-11-06) | Reste à faire (V5.3) | Parcours (écrits par H, sauf mention) |
|---|---|---|---|
| T0 A contrats | livré | `AGE_BRACKETS_V52`, `REPORT_CATEGORIES_V5 += ON_SITE_INCIDENT, REPEATED_NO_SHOW` à valider ; `EntitlementKeyV5 += PLUS_UNLIMITED_DUOS` ; `StaffRoleV5 += venue_partner` | — |
| T1 B moteur/composition | livré + garantie silencieuse | `maxSameGender` dur + exception non mixte ; `KNOWN_CONTACT` ; tuning `duo.maxActiveFree=1`, `duo.maxOpenProposals`, `venues.compensationUnpaidSeatCents=300`, `safety.uncomfortableLeaveWindowDays`, retrait de `plus.includedOutingsPerMonth`/accessoire mensuel ; `ACCESSORY_GIFTED` | tests §4.7 |
| T2 C backend sorties | livré (V5.1 + V5.2) | **prénoms/tranches/fiabilité à `lockAt` (pas à FORMING)**, auteurs-pets avant `lockAt` ; annulation `EARLY` = remboursement carte / reste offerte (plus de recrédit 90 j) ; `storyMatch` littéral ; erreurs renommées ; demande auto ; `VenueCompensation` (outbox) ; migration `…_v5_3` ; ordre des souvenirs | livrés par C : `cinq-inconnus-un-jeudi`, `team-de-trois-ville-pas-ouverte`, `annulation-apres-verrou`, `fuite-intention-impossible` · H : **J-a `nantes-il-manque-deux`** (ville sans quartier ouvert, écart réel, amorçage Lille en solo) · **J-b `thomas-connait-quelqu-un`** (J-1 18 h prénoms, demande acceptée et déplacement, quota) · **J-c `camille-annule-a-temps`** (annulation avant 18 h → carte remboursée / 1ʳᵉ reste offerte ; après → absence, 4,99 € au lieu) · **J-d `jamais-plus-de-trois`** (composition, genres, non mixte) |
| T3 G paiements | à faire | Stripe places, RevenueCat Blowy+ (droits V5), remboursements §6.4, compensations §6.5, produits | **J-e `ines-paie-4-99`** (hold, webhook rejoué, paiement tardif → remboursé) · **J-f `sarah-prend-blowy-plus`** (toutes sorties incluses, quota hebdo inchangé, duos illimités, expiration sans fermeture de duo, aucun effet sur composition) |
| T4 E sécurité | livré (module `safety`, retrait système) | page gardien **sans position**, « besoin d'aide » sans position, « je pars mal à l'aise », évitement de contacts, filigrane serveur, vérification 18+ par estimation d'âge, astreinte | **J-g `lea-et-son-ange-gardien`** (aucune position, lieu à J-1 18 h, « mal à l'aise » relayé) · **J-h `nora-se-protege-en-sortie`** · **J-i `contacts-evites`** (deux collègues jamais composés, aucune information) |
| T5 C2 liens | livré | initiale avant double oui, déblocage **à 48 h** (pas avant), quota 1 / illimité, cadeau d'accessoire, Ta rue | **J-j `yanis-voie-duo-gratuite`** (1 duo gratuit, 2ᵉ refusé, Blowy+ illimité, visages à 48 h, vocal facultatif) · **J-k `duo-qui-s-arrete`** |
| T6 F admin/web | à faire | sections §10.1, espace lieu §10.2, page gardien web, liens de partage uniques et pages `/s/:slug`, `/team/<code>`, `/m/<slug>` | **J-l `le-bar-recoit-sa-table`** (lieu ne voit que prénoms, compensations du mois) · e2e admin |
| T7 D mobile | en cours (design V5.3) | coder contre les contrats ci-dessus ; vocabulaire §1 ; aucune mention de la garantie | vérif visuelle + persona |
| T8 G notifications | à faire | §9 | **J-m `camille-en-mode-discret`** (≤ 1 proposition/semaine, aucune pastille hors messages) |
| T9 œuf | livré côté opt-in | — | **J-n `oeuf-a-deux`** |
| transverse H | — | réécrire les parcours V4, puis activer les 410 | **J-o `fuite-zero-v53`** (balayage de toutes les vues à chaque état + cartes de partage + page gardien + espace lieu), **J-p `suppression-en-pleine-semaine`** |

### 11.3 Règles
Contrat publié avant implémentation ; échanges inter-modules par outbox (`outing.seat_refund_due`, `outing.venue_compensation_due`, `outing.attendance_recorded`, `connection.revealed`, `trust.block_created`, `safety.alert_raised`, `economy.payment_succeeded`, `economy.plus_state_changed`, `user.account_deleted`…). « Tranche terminée » : build, typecheck, lint, tests unitaires et d'intégration ×2, migrate + seed sur base vierge (diff nul), parcours de la tranche verts ×2, handoff, ligne dans `integration-status.md`.

### 11.4 Écarts connus code ↔ spec (à aligner par le propriétaire)
1. Prénoms, tranches et fiabilité visibles dès `FORMING` (T2) → à `lockAt` (V5.3 B.7) — C.
2. Annulation `EARLY` → recrédit 90 j et `FREE_FIRST` non recrédité (T2) → remboursement carte / 1ʳᵉ reste offerte — C + G.
3. `storyMatch` accepte encore `AT_LEAST_TWO` dans le contrat — C.
4. Pénalité de genre douce (`maxGenderSharePermille`) → contrainte dure ≤ 3 — B.
5. Quota duo `maxActive = 3` pour tous → 1 gratuit / illimité Blowy+ — B + C2.
6. Déblocage duo dès que les deux ont écrit → à 48 h — C2.
7. `SafetyAlert` accepte une position → refusée/ignorée, page sans position — E.
8. `plus.includedOutingsPerMonth`, accessoire mensuel, `PLUS_MONTHLY_BENEFITS` → droits V5 `PLUS_INCLUDED_OUTINGS` + `PLUS_UNLIMITED_DUOS` — G + B.
9. Codes `NEIGHBORHOOD_NOT_LIVE` → `NEIGHBORHOOD_UNAVAILABLE` ; `threshold` retiré des vues — C.
10. Routes 410 non activées — A (après H).
11. Blowy+ prévu sur Stripe dans la révision 1 → achat intégré RevenueCat — G.

---

## 12. Questions tranchées
| # | Question | Décision |
|---|---|---|
| 1 | Fournisseurs de paiement ? | Places : Stripe / Apple Pay ; Blowy+ : achat intégré RevenueCat ; à revalider juridiquement (D-040) |
| 2 | Prix ? | 1ʳᵉ offerte, place 4,99 € conso non incluse, Blowy+ 9,99 €/mois toutes sorties + duos illimités, 1 duo gratuit (D-041) |
| 3 | Jusqu'à quand annuler gratuitement ? | Jusqu'à la confirmation J-1 18 h ; après = absence (D-043) |
| 4 | Remboursement en argent ou en crédit ? | Toujours sur la carte pour une place payée ; une place offerte « reste offerte » (D-042) |
| 5 | Que voit-on à la confirmation ? | Lieu (nom, photo, adresse), prénoms, tranches, pets, fiabilité ; visages à J − 3 h, filigranés (D-044) |
| 6 | Compensation du lieu ? | Prix de la place (4,99 €) si payée, 3 € si offerte/incluse ou sécurité (D-045) |
| 7 | Ville fermée, seuil 120 ? | Supprimés ; sortie dès 5 compatibles ; écran « il manque N » (D-035) |
| 8 | Garantie « ≥ 2 compatibles » affichée ? | Jamais ; seul « sortie entre amis pour toi » pour l'intéressé·e (D-038) |
| 9 | Équilibre des genres ? | Contrainte dure ≤ 3 du même genre, exception non mixte demandée (D-039) |
| 10 | Grille d'âge ? | Fixe 18–21 … 50+ ; jamais centrée sur la personne (D-037) |
| 11 | Votes ? | Un écran, 3 choix pour tous, Non par défaut, résultat unique à la clôture, PLUS incompatible → ami·e en silence (D-048) |
| 12 | Liens de partage ? | Un lien unique par carte et par personne, traçable, sans tiers (D-047) |
| 13 | Position sur « besoin d'aide » ? | Jamais ; le lieu de la sortie et l'heure suffisent (D-050) |
| 14 | Duo : que voit-on avant le double oui ? | Le pet et l'initiale (D-051) |
| 15 | Espace lieu ? | Web, rôle `venue_partner`, 3 écrans, prénoms seulement (D-046) |
| 16 | Éviter ses contacts ? | Opt-in, empreintes jamais stockées, seules les paires gardées (D-049) |
| 17 | Demande hebdo ? | Automatique depuis les disponibilités ; plus de notification d'ouverture (D-052) |

---

## 13. Historique des amendements
| Rév. | Date | Source | Changements |
|---|---|---|---|
| 1 | 2026-11-06 | `concept-v5.md` | Rédaction initiale (D-010 → D-034) : modèle, visibilité, composition, pet V5, économie (Stripe pour tout, crédits 90 j), API, schéma, notifications, admin, tranches. |
| 2 | 2026-11-06 | `concept-v5.1.md` (jury tour 1) — intégré dans le code par T0/T1/T2 | Groupes de 5 ; team 1–3 et amorçage (remplace le +1) ; intentions `lookingFor` + sous-choix secrets + `meetingMode` ; préférences de sortie (créneaux, semaines off, activités, quartiers acceptables, trajet, `groupAge`) ; aperçu anonyme ; vote groupé sur un écran, 3 choix pour tous, Non par défaut, dépouillement à la clôture ; annulation après confirmation = absence ; prix 4,99 € conso non incluse et Blowy+ 9,99 € toutes sorties + duos illimités, accessoires jamais vendus ; motifs de signalement ; mode discret à l'onboarding. |
| 3 | 2026-11-06 | `concept-v5.2.md` (jury tour 2) — intégré par T2 et B | Plus de ville fermée ni de seuil ; écart « il manque N » ; garantie histoire ; lieu J-1 18 h, visages J − 3 h filigranés ; grille d'âge fixe ; « je connais quelqu'un ici » ; slug « 3 mots » aléatoire ; cartes sans tiers, carte « accords » supprimée ; Ta rue ; 1 duo gratuit ; `ON_SITE_INCIDENT`. |
| 4 | 2026-11-06 | `concept-v5.3.md` (jury tour 3) — **cette révision** | Garantie jamais affichée ; règle « jamais plus de 3 du même genre » ; duo à l'initiale avant double oui ; page gardien sans position ; carte « J'y suis » sans lieu ni heure ; annulation gratuite jusqu'à J-1 18 h ; prénoms + tranches + pets à la confirmation ; « je pars, mal à l'aise » ; Blowy+ par achat intégré, places Stripe ; compensation lieu 4,99 € / 3 € (fin du forfait 15 €) ; liens de partage uniques ; « éviter les personnes que je connais » opt-in ; espace lieu (3 écrans) ; demande hebdo automatique. Spec réécrite pour refléter l'état du code (§11.2) et lister les écarts (§11.4). Décisions D-035 → D-052. |
