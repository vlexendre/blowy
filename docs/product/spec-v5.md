# Spécification technique V5 — « Ton pet te trouve une bande »

Statut : **référence de construction V5** (architecte domaine, 2026-11-06). Source produit : `docs/product/concept-v5.md` (loi produit, validée). Décisions : `docs/decisions.md` D-010 à D-034.
Ce document ne contient aucun code de production : il fixe les noms, états, invariants, contrats et découpages pour que plusieurs agents construisent en parallèle. Tout chiffre marqué `[T]` est un paramètre de `@blowy/tuning` (valeur initiale = hypothèse, P-5.20) ; aucun chiffre ne doit être codé en dur ailleurs.

Sommaire : 1 Glossaire · 2 Modèle de domaine · 3 Visibilité (qui voit quoi) · 4 Composition des groupes · 5 Le pet en V5 · 6 Économie V5 · 7 API /v1 et WS · 8 Schéma · 9 Notifications · 10 Admin · 11 Découpage en tranches et parcours · 12 Questions tranchées

---

## 1. Glossaire et conventions

| Terme | Définition |
|---|---|
| Semaine (`weekKey`) | Semaine ISO dans le fuseau du quartier, format `2026-W46`. Toutes les règles « une par semaine » utilisent cette clé. |
| Sortie (`Outing`) | Rencontre de 4 à 6 personnes, dans un quartier, à un lieu partenaire, sur un créneau. |
| Place (`OutingSeat`) | Participation d'une personne à une sortie (invitation → confirmation → présence). |
| Bande | Ensemble des liens « ami » persistants d'une personne (vue égocentrée, pas un groupe fermé). Un lien = `BandLink` (table `Friendship` réutilisée). |
| Duo | Relation à deux ouverte par un accord « plus » ou par la voie Duo. |
| Présent·e (`attendee`) | Place au statut `ATTENDED` (check-in validé ou correction staff). Seuls les présents votent et sont votés. |
| Absence sans prévenir (`no-show`) | Place `CONFIRMED` au verrouillage, ni annulée ni check-in à la fermeture du check-in. |
| Verrouillage (`lockAt`) | Veille de la sortie, `[T] outings.cycle.lockHourLocal` (18 h) : lieu révélé, effectif figé. |
| Révélation photos (`photoRevealAt`) | `min(jour J à [T] photoRevealHourLocal (9 h), startsAt − 3 h)`. |

Conventions héritées (AGENTS.md, architecture.md) : UUID v7 côté application ; UTC en base + fuseau IANA du quartier ; Zod aux frontières ; commandes via `CommandBus` (idempotence `(actorId, operation, commandId)`, transaction, verrous ordonnés, outbox) ; erreurs `{code,message,detailsSafe,requestId,retryable}` avec le motif métier dans `detailsSafe.reason` (ex. `412 PRECONDITION_FAILED {reason:"RELIABILITY_PAUSED"}`) ; `NOT_FOUND` pour tout objet d'autrui (anti-IDOR).

**Ordre global des verrous V5** (extension de l'ordre existant) : `users → pets → relationships → neighborhoods → outings → outing_seats (par id croissant) → duos → friendships → wallets → outing_credit_balances`. Aucun appel réseau (Stripe, RevenueCat, push) sous verrou : effets planifiés via outbox après commit.

---

## 2. Modèle de domaine

Chaque agrégat indique son **module propriétaire** (seul écrivain de ses tables, cf. §11).

### 2.1 Neighborhood (quartier) — module `neighborhoods`
| Champ | Type | Notes |
|---|---|---|
| id, slug (`paris-11`, `lyon-croix-rousse`), name | | slug unique |
| cityZoneId | FK `Zone` | zone existante (ville) ; `Zone` reste le référentiel de fuseau |
| timezone | IANA | fuseau stable du quartier (cycles, weekKey) |
| status | `WAITLIST \| LIVE \| PAUSED \| CLOSED` | |
| densityThreshold | int | défaut `[T] neighborhoods.defaultDensityThreshold` (120 personnes vérifiées en attente) ; surcharge admin |
| launchedAt, pausedAt | | |
| slotTemplates | `NeighborhoodSlotTemplate[]` | créneaux types hebdo (ex. jeu 19 h 30, sam 15 h, dim 11 h) |

Transitions : `WAITLIST → LIVE` (action staff `ops`, autorisée seulement si `verifiedWaitlisted ≥ densityThreshold` sauf step-up admin « lancement forcé ») ; `LIVE ⇄ PAUSED` (staff ; les sorties déjà `CONFIRMED` sont maintenues, les cycles suivants ne s'ouvrent pas) ; `* → CLOSED` (staff, sorties futures annulées et remboursées).
Invariants : un utilisateur a au plus un quartier (`User.neighborhoodId`) ; changement de quartier au plus une fois par `[T] neighborhoods.changeCooldownDays` (7 j) et jamais avec une place active ; `verifiedWaitlisted` = utilisateurs du quartier, onboardés, selfie vérifié, non supprimés (compté, jamais gonflé — esprit P-5.10).

### 2.2 Waitlist — module `neighborhoods`
`WaitlistEntry(userId, neighborhoodId, joinedAt, verifiedAt?, notifiedLaunchAt?)`, unique `(userId)` (une seule entrée active). Créée à `me.set_neighborhood` quand le quartier n'est pas `LIVE`.
Deux usages, deux écrans (concept §11, écran 27) :
1. **Quartier non lancé** : la personne voit `verifiedWaitlisted / densityThreshold` (vrais nombres) + CTA inviter. **Aucune position individuelle** : inviter fait progresser le quartier, pas la personne (pas de vente ni de gain de visibilité).
2. **Quartier lancé, pas placé·e cette semaine** : `OutingRequest.status = UNPLACED` ; la personne voit « prioritaire la semaine prochaine » (`missedWeeks` +1, utilisé par la composition §4.4).

### 2.3 Venue (lieu partenaire) — module `neighborhoods`
| Champ | Notes |
|---|---|
| id, neighborhoodId, name, addressLine, postalCode, city | adresse exacte = révélée aux seuls confirmés au verrouillage |
| lat, lng | servent au check-in uniquement ; jamais envoyées au client avant verrouillage ; jamais une distance affichée |
| offerKey | clé de contenu « conso incluse » (texte externalisé) |
| status | `ACTIVE \| PAUSED \| ARCHIVED` |
| accessibilityTags | ex. `STEP_FREE`, `QUIET` |
| checkinCodeSecret | secret HMAC servant à dériver le code de repli affiché sur place (§2.8) ; jamais exposé |
| staffContact | visible staff `ops` uniquement |

`VenueSlot(venueId, startsAt, capacityOutings, reservedOutings)` : capacité en nombre de tables-sorties simultanées ; CHECK `0 ≤ reservedOutings ≤ capacityOutings`. Générés depuis les `slotTemplates` par le job `neighborhoods.generate_slots` (hebdo, idempotent par `(venueId, startsAt)` unique).

### 2.4 OutingRequest (demande hebdo) — module `outings`
`OutingRequest(userId, neighborhoodId, weekKey, slotStartsAt[] (créneaux choisis), companionUserId?, status, missedWeeks, createdAt)`, unique `(userId, weekKey)`.
Statuts : `OPEN → PLACED | UNPLACED | WITHDRAWN`. Ouverte de `requestOpensAt` à `requestClosesAt` (`[T] outings.cycle` : lundi 9 h → mardi 12 h, heure du quartier).
Préconditions de création : quartier `LIVE` ; onboarding V5 complet (§2.15) ; selfie vérifié valide (`VERIFIED`, non expiré ; `LOCAL_DEMO` hors production seulement) ; photo de profil publiée (D-026) ; pas de pause de fiabilité ; pas de place active cette semaine (quota 1/semaine, **non achetable**).

### 2.5 Outing (sortie) — module `outings`
| Champ | Notes |
|---|---|
| id, neighborhoodId, weekKey, venueSlotId, venueId, startsAt, endsAt (`startsAt + [T] outings.durationMinutes` 120) | |
| status | `PROPOSED → FORMING → CONFIRMED → CHECKIN_OPEN → DONE`, ou `CANCELLED` |
| capacity | 6 (`[T] outings.maxSize`) ; CHECK `4 ≤ capacity ≤ 6` |
| compositionRunId | lot qui l'a créée (diagnostic) |
| acceptDeadline | `composedAt + [T] outings.cycle.inviteTtlHours` (24 h) |
| lockAt, photoRevealAt, checkinOpensAt (`startsAt − 30 min`), checkinClosesAt (`startsAt + 90 min`), votesCloseAt (`checkinClosesAt + 72 h`) | tous `[T]`, figés à la création (versions tuning tracées) |
| cancelReason | `UNDERSIZED \| VENUE_UNAVAILABLE \| STAFF \| NEIGHBORHOOD_CLOSED \| SAFETY` |
| conversationId | chat de groupe (créé au passage `FORMING`) |
| tuningVersion, algoVersion | |

**Machine d'états** (toutes les transitions temporelles sont faites par le job `outings.lifecycle` toutes les 5 min, clé `(outingId, targetStatus)` ; chaque transition revalide sous verrou `FOR UPDATE` de la sortie) :

| De → À | Déclencheur | Garde | Effets |
|---|---|---|---|
| — → `PROPOSED` | composition (§4) | groupe valide 4–6, `VenueSlot` réservé | places `INVITED` ; notification d'invitation |
| `PROPOSED → FORMING` | commande `seat.accept` | `confirmed ≥ [T] minSizeToForm` (4) | conversation `OUTING` ouverte aux confirmés ; message brise-glace du pet |
| `PROPOSED/FORMING` (relance) | invitation déclinée/expirée | `now < lockAt` et place libre | backfill (§4.6) : nouvelle place `INVITED` |
| `FORMING → CONFIRMED` | job à `lockAt` | `confirmed ≥ [T] minSizeToLock` (4) | effectif figé (plus de backfill), lieu révélé, invitations restantes `EXPIRED` |
| `PROPOSED/FORMING → CANCELLED` | job à `lockAt` | `confirmed < minSizeToLock` | `UNDERSIZED` ; remboursements automatiques (§6.4) ; confirmés `missedWeeks+1` |
| `CONFIRMED → CANCELLED` | départs | `confirmed < [T] minSizeToHold` (3) avant `startsAt − 3 h` | idem, remboursement des restants |
| `CONFIRMED → CHECKIN_OPEN` | job à `checkinOpensAt` | — | check-in possible ; statut « arrivé·e » visible au groupe |
| `CHECKIN_OPEN → DONE` | job à `checkinClosesAt` | — | `CHECKED_IN → ATTENDED`, `CONFIRMED → NO_SHOW` ; votes ouverts aux présents si `attended ≥ 2` ; souvenirs ; fiabilité |
| `* → CANCELLED` | staff `ops` (step-up) | statut ≠ `DONE` | motif obligatoire, remboursements, notification |

Invariants :
- I-O1 `count(seats in {HELD, CONFIRMED, CHECKED_IN, ATTENDED, NO_SHOW}) ≤ capacity` (vérifié sous verrou ; une invitation réserve une place : `count(INVITED ∪ actives) ≤ capacity`, donc **pas de surréservation**).
- I-O2 Une personne a au plus une place active par `weekKey` (index unique partiel).
- I-O3 Deux personnes liées par un blocage (dans un sens ou l'autre) ne sont jamais dans la même sortie avec des places actives ; un blocage pendant la sortie déclenche §2.6 « retrait de sécurité ».
- I-O4 Le lieu exact et `photoRevealAt` ne sont jamais projetés vers une place non `CONFIRMED`.
- I-O5 Une sortie `CANCELLED` ne produit ni vote, ni souvenir, ni absence.

### 2.6 OutingSeat (place) — module `outings`
| Champ | Notes |
|---|---|
| id, outingId, userId, weekKey | unique `(outingId, userId)` |
| status | voir ci-dessous |
| funding | `FREE_FIRST \| PLUS_INCLUDED \| CREDIT \| PAID \| STAFF_COMP` (fixé à la confirmation) |
| creditEntryId? / paymentId? | source du financement (exactement un selon `funding`, CHECK) |
| holdExpiresAt | `HELD` : `now + [T] outings.paymentHoldMinutes` (15) |
| companionSeatId? | +1 (§4.5) |
| invitedAt, confirmedAt, cancelledAt, checkedInAt | |
| cancelKind | `EARLY \| LATE \| SAFETY_EXIT \| SYSTEM_REMOVAL \| ACCOUNT_DELETED` |
| refundState | `NONE \| PENDING \| REFUNDED \| RECREDITED \| NOT_ELIGIBLE` |
| refundRef | id Stripe refund ou entrée de crédit |

Statuts et transitions :
```
INVITED ──accept──► HELD ──paiement/crédit──► CONFIRMED ──check-in──► CHECKED_IN ──DONE──► ATTENDED
   │                 │ (hold expiré → INVITED si avant acceptDeadline, sinon EXPIRED)
   ├─decline──► DECLINED          CONFIRMED ──DONE sans check-in──► NO_SHOW
   └─deadline/lock──► EXPIRED     CONFIRMED/HELD ──cancel──► CANCELLED (cancelKind)
                                  * ──sortie annulée──► CANCELLED (SYSTEM) + remboursement
```
- `accept` sur crédit disponible (`FREE_FIRST` d'abord, puis `PLUS_INCLUDED` à échéance la plus proche, puis `CREDIT`) : `INVITED → CONFIRMED` dans la même transaction (débit du crédit).
- `accept` sans crédit : `INVITED → HELD` + `PaymentIntent` créé après commit (§6.3) ; webhook `succeeded` → `CONFIRMED`. Paiement réussi après expiration du hold ou sur sortie annulée → **remboursement automatique** (`refundState=PENDING→REFUNDED`), place `CANCELLED/SYSTEM`.
- Annulation par l'utilisateur : `EARLY` si `now ≤ startsAt − [T] outings.lateCancelHours` (24 h) → recrédit (§6.4) ; `LATE` sinon → aucun remboursement, **pas une absence**.
- **Retrait de sécurité** (`SAFETY_EXIT`) : la personne qui se sent en danger part à tout moment, remboursée intégralement, aucun effet de fiabilité.
- **Retrait système** (`SYSTEM_REMOVAL`, D-025) : quand A bloque B (avec ou sans signalement) alors qu'ils partagent une sortie active, **B** est retiré·e : remboursé·e intégralement, prioritaire la semaine suivante, message neutre identique à toute recomposition opérationnelle (« La composition de ta sortie a changé. Ta place est remboursée et tu es prioritaire la semaine prochaine. »). A ne fait rien. Le groupe voit « X ne pourra pas venir ». Signal staff si une personne déclenche ≥ `[T] safety.removalAbuseThreshold` (3) retraits en 30 j.

### 2.7 GroupChat pré-sortie — module `conversations` (nouveau type), piloté par `outings`
- `Conversation.kind = OUTING`, `outingId` unique. Créée au passage `FORMING` ; membres = places `CONFIRMED` (ajoutés à la confirmation, révoqués à l'annulation/au retrait : `access.revoked`).
- Contenu : texte uniquement (pas de média ni de vocal avant la sortie), modération existante (`PENDING_MODERATION → PUBLISHED…`), 20 msg/min.
- **Brise-glace du pet** : messages `SYSTEM` signés par le pet de chacun, gabarits `@blowy/content` (`icebreaker.*`) : à l'ouverture, à `lockAt`, à `photoRevealAt`. Une « question soufflée » porte un `promptId` ; les réponses « 3 mots » sont des messages `TEXT` de ≤ 3 mots (`metadata.promptId`), validés serveur (≤ 3 tokens, ≤ 40 caractères), modérés comme tout message. Aucun XP.
- Écriture possible jusqu'à `votesCloseAt`, puis conversation `closedAt` (lecture seule 7 j pour les présents, puis inaccessible ; purge §8.5). Les liens persistants passent par la bande et les duos.

### 2.8 CheckIn — module `outings` (règles partagées avec `duos`)
`OutingCheckIn(seatId unique, method GEO|VENUE_CODE|STAFF, result ACCEPTED|TOO_FAR|LOW_ACCURACY|CODE_INVALID, accuracyBucket ≤50|≤150|>150 m, createdAt)`.
- Fenêtre `[checkinOpensAt, checkinClosesAt]`.
- `GEO` : le client envoie **une** position ponctuelle (lat, lng, précision) au moment du tap ; le serveur calcule la distance au lieu, accepte si `≤ [T] safety.checkinRadiusMeters` (150) et précision ≤ `[T] safety.checkinMaxAccuracyMeters` (200). **La position n'est jamais stockée** ni journalisée (seuls `result` et `accuracyBucket`) ; aucune distance n'est renvoyée (motif `TOO_FAR` seulement).
- `VENUE_CODE` (repli GPS) : code à 4 chiffres affiché au lieu (chevalet), `HOTP(checkinCodeSecret, startsAt)` ; 5 essais max par place (`[T] safety.venueCodeMaxAttempts`), puis 429.
- `STAFF` : correction admin (§10), auditée.
- Effet : place `CHECKED_IN` ; événement `outing.checkin_updated {userId, arrived:true}` aux membres. Jamais d'étiquette « absent·e » visible par le groupe.

### 2.9 GuardianLink (ange gardien par lien web) — module `safety`
| Champ | Notes |
|---|---|
| id, ownerUserId, subjectKind `OUTING \| DUO_DATE`, subjectId | |
| tokenHash | SHA-256 d'un jeton aléatoire 32 octets (base64url) ; le jeton n'est rendu qu'**une fois** à la création |
| label | « Maman », « Coloc » (privé, ≤ 30 car.) |
| activeFrom, expiresAt | création possible dès que la place est `CONFIRMED` (ou RDV duo `CONFIRMED`) ; page « active » de `startsAt − 2 h` à `endsAt + 3 h` ; expiration dure `endsAt + [T] safety.guardianLinkGraceHours` (3 h) ; avant `activeFrom` la page affiche seulement « Rendez-vous prévu le … » |
| revokedAt | révocation par le propriétaire, blocage du sujet, suppression du compte, annulation de la sortie |
| lastViewedAt, viewCount | pas d'IP ni d'empreinte stockées |
| pushSubscription? | Web Push optionnel souscrit **depuis la page** du proche ; purgé à `expiresAt + 24 h` |

Max `[T] safety.maxGuardianLinksPerSubject` (3) liens actifs par sujet. Partage par la feuille de partage native (SMS, WhatsApp…) : **Blowy ne stocke jamais le numéro ni l'email du proche**.
Ce que voit le proche (`GET /v1/public/guardian/:token`, `Cache-Control: no-store`, `noindex`, rate limit) : prénom du propriétaire, type (« sortie de groupe » / « rendez-vous à deux »), date et heure, **nom et adresse du lieu à partir du verrouillage** (avant : « lieu communiqué la veille »), chronologie (« arrivé·e à 19 h 34 », « tout va bien à 20 h 15 », « alerte à 21 h 02 », « terminé »), numéros d'urgence (112/17). Jamais : autres participants (ni nombre, ni prénoms, ni photos), chat, position (sauf alerte, ci-dessous), statut Blowy+, fiabilité.
**Alerte** (`SafetyAlert`) : bouton dans l'app → statut `ALERT` sur la page du proche + Web Push s'il est abonné + dossier `ModerationCase` catégorie `SAFETY` priorité haute (trust_lead) + écran d'urgence (112). Position optionnelle jointe **par choix explicite** à l'alerte : visible du proche et du trust_lead, conservée `[T] safety.alertPositionRetentionHours` (72 h) sauf dossier ouvert. « Tout va bien » : commande dédiée, pousse au proche.

### 2.10 PostOutingVote (vote d'après) — module `outings`
`OutingVote(outingId, voterUserId, targetUserId, choice FRIEND|PLUS|NO, createdAt, updatedAt, revealedAt?)`, unique `(outingId, voterUserId, targetUserId)`, CHECK `voter ≠ target`. Table séparée, jamais jointe dans une projection d'autrui (héritage P-5.8).
- Ouverts à `DONE` si la personne est `ATTENDED` ; cibles = autres `ATTENDED` (hors +1 de soi, déjà lié). Fenêtre `votesCloseAt = checkinClosesAt + [T] votes.windowHours` (72 h). Correction staff d'une présence : la personne peut voter jusqu'à `max(votesCloseAt, correctionAt + 24 h)`.
- **Choix proposés** : `FRIEND` et `NO` toujours ; `PLUS` proposé si le votant a lui-même `seeksRomance` (dépend uniquement de soi : aucune fuite sur la cible).
- **Résolution par paire** (ordre `NO < FRIEND < PLUS`) : `r = min(choix A→B, choix B→A)` ; si `r = PLUS` mais compatibilité romance réciproque fausse (§4.2) → `r = FRIEND`. `r = PLUS` → Duo (origine `OUTING_VOTE`) ; `r = FRIEND` → BandLink ; `NO`/absent → rien. Le libellé de l'option PLUS dit « plus (et ami·e si ce n'est pas réciproque) ».
- **Révélation** : job `votes.reveal` à cadence fixe `[T] votes.revealCadenceMinutes` (60, aux heures pleines du quartier) puis à `votesCloseAt` : les paires mutuelles déjà complètes sont révélées en lot (le moment exact du vote de l'autre n'est jamais exposé). Un vote est **modifiable** jusqu'à la révélation de la paire ; une paire révélée est définitive (on la défait par « partir proprement »).
- Jamais exposés : votes d'autrui, nombre de votes reçus, progression du vote des autres, « non », « plus » unilatéral. Le récapitulatif de clôture ne donne que des accords mutuels (« 2 nouvelles personnes dans ta bande ») ou un texte neutre identique.
- Purge des bulletins `[T] votes.ballotRetentionDays` (7 j) après `votesCloseAt` ; seuls les résultats mutuels (BandLink, Duo) restent.

### 2.11 Band (bande) — module `connections`
`BandLink` = table `Friendship` réutilisée (paire canonique `userLowId < userHighId`, déjà contrainte) avec colonnes ajoutées `origin OUTING_VOTE|DUO_VOTE|PLUS_ONE|LEGACY_V4`, `sourceOutingId?`, `sourceDuoId?`, `endedReason?` ; statut `ACTIVE` à la création (accord déjà mutuel), `WITHDRAWN` à « partir proprement ».
- Chaque lien ouvre une conversation `BAND` 1:1 (texte + vocal + photo selon la politique média existante).
- « Ta bande » = liste de mes liens `ACTIVE` (prénom, pet, photo, fiabilité, accès au chat). On ne voit **jamais** la bande de quelqu'un d'autre (pas de graphe exposé).
- « Partir proprement » : `band.leave` → lien `WITHDRAWN`, conversation fermée avec message système neutre, aucune pénalité, aucun motif communiqué.
- Une paire liée est exclue des compositions futures (« déjà vus »).

### 2.12 Duo — module `connections`
| Champ | Notes |
|---|---|
| id, userLowId, userHighId (canonique), origin `LANE \| OUTING_VOTE` | |
| status | `EXCHANGE → UNLOCKED → DATE_PROPOSED → DATE_CONFIRMED → AFTER_VOTE → TOGETHER`, ou `EXPIRED`, `CLOSED`, `LEFT` |
| exchangeEndsAt | `createdAt + [T] duo.exchangeHours` (48 h) — LANE seulement |
| dateDeadline | `createdAt + [T] duo.dateDeadlineDays` (7 j) — LANE seulement |
| messagesBySide | compteur de messages humains publiés par côté pendant `EXCHANGE` |
| datesAttended | nombre de RDV où les deux ont fait le check-in |
| conversationId | `Conversation.kind = DUO` |

Voie Duo (concept §5) :
- Opt-in `duoLaneEnabled` (réglage). Propositions quotidiennes par le module `matching` existant (lot 21 h, `selectBatch` réutilisé, filtres §4.2 en mode `DUO`), `MatchProposal.kind = DUO_LANE`, expiration 48 h existante. **Max `[T] duo.maxActive` (3)** éléments actifs par personne = propositions `OPEN` + duos LANE non terminaux.
- Proposition acceptée par les deux (`matching.accept_proposal` existant, branche DUO_LANE) → `Duo(EXCHANGE)` + conversation `DUO` en mode « pets » (texte seul, pas de photo ni de vocal, avatars des pets).
- `EXCHANGE → UNLOCKED` dès que chaque côté a publié ≥ `[T] duo.minMessagesEachToUnlock` (2) messages humains avant `exchangeEndsAt` : photos (dérivés de la photo de profil) et vocaux débloqués pour les deux simultanément.
- `EXCHANGE → EXPIRED` à `exchangeEndsAt` sinon (message neutre identique des deux côtés « Vos pets se sont dit au revoir »).
- `UNLOCKED → DATE_PROPOSED` : `duos.date.propose {venueId, startsAt}` (lieu partenaire du quartier, créneau dans ses horaires, `startsAt ≤ dateDeadline + 7 j`). `DATE_PROPOSED → DATE_CONFIRMED` : l'autre accepte (ou contre-propose : nouvelle `DuoDate`, l'ancienne `SUPERSEDED`).
- LANE : si aucun RDV `CONFIRMED` à `dateDeadline` → `EXPIRED` (conversation en lecture seule 7 j puis close).
- RDV (`DuoDate`) : check-in identique §2.8 (fenêtre `[startsAt − 30 min, startsAt + 90 min]`), ange gardien §2.9, absence comptée en fiabilité. Gratuit (pas de place payante).
- Après RDV (les deux présents) : `AFTER_VOTE` 72 h, `DuoVote(duoDateId, voter, choice)` même résolution que §2.10 : `PLUS` → `TOGETHER` (chat continue, RDV suivants possibles) ; `FRIEND` → BandLink `DUO_VOTE` + duo `CLOSED` ; sinon `CLOSED`. Dans tous les cas non mutuels, **le même message neutre** aux deux (« Ce duo s'arrête ici, merci d'être venu·e »).
- Un seul présent : RDV `DONE` sans vote, l'absent·e reçoit une absence ; le duo revient à `UNLOCKED` (LANE : `dateDeadline` inchangée).
- Origine `OUTING_VOTE` : démarre `UNLOCKED`, pas d'`exchangeEndsAt` ni de `dateDeadline` (relances douces seulement, §9).
- `duos.leave` (« partir proprement ») à tout moment → `LEFT`, message neutre, aucune pénalité. Blocage → `CLOSED` silencieux + révocation.
- Œuf / bébé (concept §8, tranche optionnelle T9) : proposable seulement si `status = TOGETHER` et `datesAttended ≥ [T] egg.minDuoDates` (2), accord des deux, jamais présenté comme objectif ; pas d'exclusivité.

### 2.13 Memory (souvenirs du pet) — module `pets`
`PetMemory(id, petId, kind, refType, refId, dedupKey unique, data (JSON minimal), createdAt)`.
| kind | Quand | data (jamais de donnée d'autrui non déjà visible) |
|---|---|---|
| `HATCHED` | éclosion onboarding | espèce |
| `OUTING_LIVED` | place `ATTENDED` à `DONE` | weekKey, nom du lieu, nombre de pets présents, espèces présentes (sans noms) |
| `DUO_DATE_LIVED` | RDV duo où les deux étaient présents | nom du lieu |
| `BAND_NEW_MEMBER` | BandLink créé (vote, duo, +1) | nom et espèce du pet de l'autre |
| `PROMISE_KEPT` | paliers de présences cumulées `[T] memories.promiseMilestones` (1, 3, 5, 10, 20) | N |
| `EGG` | naissance (optionnel) | |
Non punitif : un souvenir ne se perd jamais ; une absence ne retire rien. `dedupKey` = `<kind>:<refId>:<petId>`.

### 2.14 Reliability (fiabilité) — module `outings` (projection)
`ReliabilityStat(userId PK, attended, noShows, lateCancels, pausedUntil?, pauseEpisode, updatedAt)` alimentée **uniquement** par les événements `outing.attendance_recorded` et `duo.date_attendance_recorded` (consommateur idempotent `ConsumerDeduplication`), plus `ReliabilityEvent` (audit, raisons ajoutées `OUTING_ATTENDED`, `OUTING_NO_SHOW`, `DUO_NO_SHOW`, `RELIABILITY_PAUSE`, `STAFF_CORRECTION` existant).
- Affichage : « venu·e à N sorties sur M » avec `N = attended`, `M = attended + noShows` (annulations tardives exclues, comptées à part pour le staff). Si `M = 0` : « Nouvelle·au ».
- Pause : à la 2ᵉ absence sans prévenir dans une fenêtre glissante `[T] reliability.noShowWindowDays` (90 j) depuis le dernier épisode → `pausedUntil = now + [T] reliability.pauseDays` (7 j) ; bloque `outings.request`, propositions duo et nouveaux RDV ; les duos/bande restent accessibles. Après la pause le compteur d'épisode repart à zéro.
- Jamais d'effet : blocage, signalement, retrait de sécurité/système, annulation par Blowy, suppression de compte (P-5.15).
- Contestation : `attendance.dispute` dans les 7 j ; correction staff = `ReliabilityEvent STAFF_CORRECTION` + rejeu de la projection + souvenir manquant.
- `User.reliability` (0–100, V4) devient mort (§8.4). Le filtre `LIMIT_GHOSTER` utilise désormais le ratio `N/M` (`[T] matching.ghosterLimitMinAttendancePermille`, 700) quand `M ≥ 3`.

### 2.15 Profil & intentions V5 — module `users`
Nouveaux champs de `MatchPreferences` (D-014) : `seeksFriends: bool`, `seeksRomance: bool` (au moins un vrai), `meetGenders: Gender[]` (« qui je veux rencontrer » en groupe ; vide = tout le monde), `romanceGenders: Gender[]` (obligatoire non vide si `seeksRomance`), `duoLaneEnabled: bool`. Le genre déclaré reste sur `Profile.gender`.
- **L'orientation n'est pas stockée** : l'écran 05 la demande pour pré-remplir `romanceGenders`, puis l'oublie. `romanceGenders` (donnée révélant l'orientation, art. 9 RGPD) exige le consentement explicite `ProcessingConsent(purpose='SENSITIVE_PREFERENCES')` ; retrait = `seeksRomance=false`.
- Intentions, `meetGenders`, `romanceGenders` : **jamais** exposées à quiconque (ni autres utilisateurs, ni staff, ni WS) — seulement l'export RGPD de la personne.
- Mapping de l'ancien `intention` : `FRIENDS_ONE|FRIENDS_GROUP → friends` ; `OPEN_TO_MORE|LET_IT_HAPPEN → friends+romance` (romance seulement si `seekingGenders` non vide → copié dans `romanceGenders`, sinon `seeksRomance=false` et la personne est invitée à compléter).
- Mode discret : `PrivacySettings.discreetMode` (§9.3).
- Onboarding V5 complet = date de naissance 18+, pet, vision, intentions V5, genre, quartier, consentements sociaux. Selfie vérifié et photo publiée ne sont **pas** requis pour finir l'onboarding (pas de mur) mais pour la 1ʳᵉ sortie ou le 1ᵉʳ duo.

---

## 3. Visibilité — qui voit quoi (sécurité)

Règle d'implémentation : chaque module expose un **projecteur par acteur** (`projectOutingFor(viewer, outing)`, `projectDuoFor`, `projectGuardianPage`) testé unitairement par tableau ; les gateways WS diffusent la projection du destinataire, jamais l'événement brut. Tout ce qui n'est pas ✓ est **absent du JSON** (pas `null` révélateur, pas de compteur).

### 3.1 Sortie — vu par un·e co-participant·e, selon l'état de la sortie et de sa propre place
| Donnée sur une autre personne | PROPOSED (je suis invité·e) | FORMING (je suis confirmé·e) | CONFIRMED avant `photoRevealAt` | après `photoRevealAt` / CHECKIN_OPEN | DONE, je suis présent·e (fenêtre votes) | après `votesCloseAt` | ma place n'est pas active (déclinée, expirée, annulée, retirée) |
|---|---|---|---|---|---|---|---|
| Pet (espèce, nom, accessoires, 3 traits de vision, mots « 3 mots ») | ✓ (places invitées+confirmées) | ✓ | ✓ | ✓ | ✓ présents | liens seulement | ✗ |
| Nombre de places confirmées / capacité | ✓ | ✓ | ✓ | ✓ | — | — | ✗ |
| Prénom, tranche d'âge | ✗ | ✓ confirmés | ✓ | ✓ | ✓ présents | liens seulement | ✗ |
| Photo de profil | ✗ | ✗ | ✗ | ✓ confirmés (révélation simultanée) | ✓ présents | liens seulement | ✗ |
| Fiabilité « N sur M » | ✗ | ✓ | ✓ | ✓ | ✓ | liens seulement | ✗ |
| Quartier, jour et heure | ✓ | ✓ | ✓ | ✓ | ✓ | historique | ✗ |
| Lieu (nom, adresse, offre) | ✗ | ✗ | ✓ dès `lockAt` | ✓ | ✓ nom | historique (nom) | ✗ |
| Chat de groupe | ✗ | ✓ lecture/écriture | ✓ | ✓ | ✓ jusqu'à `votesCloseAt` | lecture 7 j | ✗ (révoqué) |
| « X ne pourra pas venir » | ✗ | ✓ (sans motif) | ✓ | ✓ | — | — | ✗ |
| « X est arrivé·e » | ✗ | ✗ | ✗ | ✓ pendant CHECKIN_OPEN | ✗ | ✗ | ✗ |
| « X absent·e », motif d'annulation, retrait | jamais | jamais | jamais | jamais | jamais | jamais | jamais |
| Position de check-in | jamais (pas stockée) | | | | | | |
| Votes de X (sur moi ou autrui), « non », « plus » unilatéral, nombre de votes | jamais | | | | | | |
| Accord mutuel avec X | ✗ | ✗ | ✗ | ✗ | ✓ à la révélation (moi et X seuls) | ✓ | ✗ |
| Financement de la place, Blowy+, crédits | jamais | | | | | | |
| Intentions, « qui je veux rencontrer », genres romance, genre déclaré en étiquette | jamais | | | | | | |
| Signalements, blocages | jamais | | | | | | |

Personne bloquée (dans un sens ou l'autre) : ne figure jamais dans la même sortie active (I-O3) ; dans l'historique, ses données sont retirées pour le bloqueur (pet générique « un pet »), conversation masquée.

### 3.2 Autres acteurs
| Donnée | Moi | Membre de ma bande | Duo EXCHANGE | Duo UNLOCKED+ | Ange gardien (page web) | Public web | staff support | staff ops | trust_lead | finance | analyst |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Prénom | ✓ | ✓ | ✓ | ✓ | ✓ (le propriétaire seul) | page « 3 mots » si activée | ✓ | ✓ | ✓ | ✓ fiche | ✗ |
| Pet, vision, 3 mots | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ page publique | ✓ | ✓ | ✓ | ✗ | agrégats |
| Photo | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ (modération) | ✗ | ✓ | ✗ | ✗ |
| Vocaux | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | sur dossier | ✗ | ✗ |
| Fiabilité N/M | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ (+ annul. tardives) | ✓ | ✓ | ✗ | agrégats |
| Mes sorties (lieu, date) | ✓ | ✗ | ✗ | ✗ | la sortie liée seulement | ✗ | ✓ | ✓ | ✓ | ✓ | agrégats |
| Check-in (résultat) | ✓ | ✗ | ✗ | ✗ | ✓ « arrivé·e à HH:MM » | ✗ | ✓ | ✓ | ✓ | ✗ | agrégats |
| Alerte + position jointe | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Mes votes (bulletins) | ✓ (les miens) | ✗ | ✗ | ✗ | ✗ | ✗ | **jamais** | **jamais** | **jamais** | **jamais** | **jamais** (pas même agrégés par personne) |
| Intentions, genres recherchés | ✓ | jamais | jamais | jamais | jamais | jamais | jamais | jamais | jamais | jamais | agrégats anonymes ≥ 20 |
| Chats (groupe, bande, duo) | ✓ membres | sa conversation | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | extrait signalé seulement | ✗ | ✗ |
| Paiements, crédits, Blowy+ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | statut seulement | ✗ | ✗ | ✓ | agrégats |
| Bande d'autrui | — | ✗ | ✗ | ✗ | ✗ | ✗ | nombre | ✗ | ✓ sur dossier | ✗ | agrégats |
Toute lecture staff d'une fiche est auditée (`AuditLog`, existant). Les diagnostics de composition montrent des **codes** (`MEET_GENDER`, `BLOCKED`) sur des identifiants, jamais les préférences elles-mêmes.

### 3.3 WS : projection et curseurs
- Salles : `user:<id>` (privée), `outing:<id>` (places confirmées, jointure revalidée), `duo:<id>`, `conversation:<id>` (existant). `WsJoinSchema` étendu (§7.6).
- Aucun événement n'est émis à la saisie d'un vote ; `outing.votes_closed` part à heure fixe à tous les présents ; `connection.revealed` part aux deux seuls intéressés au palier de révélation. Le `projectionCursor` d'un destinataire n'avance que sur ses événements visibles (pas de trou révélateur).

---

## 4. Algorithme de composition des groupes

Emplacement : `packages/matching/src/groups/` (propriétaire B). Pur, déterministe, sans horloge ni aléa : `seed`, `tuning` passés en paramètre. Le backend (`outings`) collecte les entrées, exécute, persiste (`CompositionRun`).

### 4.1 Entrées / sorties
```ts
interface OutingCandidate {
  profile: MatchProfile;                     // type existant (vision, âge, genre, espèce, activité, réputation, éligibilité)
  seeks: { friends: boolean; romance: boolean };
  meetGenders: Gender[];                     // [] = tout le monde
  romanceGenders: Gender[];                  // [] si !romance
  groupAge: { min: number; max: number };    // = MatchPreferences.ageMin/ageMax
  slotStartsAtMs: number[];                  // créneaux choisis
  companionUserId: string | null;            // +1 (réciproque)
  attendance: { attended: number; noShows: number };
  priority: { missedWeeks: number; firstOuting: boolean; requestedAtMs: number };
}
interface CompositionFacts { blockedPairs: ReadonlySet<string>; metPairs: ReadonlySet<string> } // clé "min|max"
interface SlotOffer { venueSlotId: string; venueId: string; startsAtMs: number; remainingOutings: number }
function composeOutings(i: { candidates; facts; slots; seed: string; tuning: Tuning }): CompositionResult
interface CompositionResult {
  groups: Array<{ venueSlotId; memberUserIds: string[]; objectiveMilli: number; pairMinScore: number }>;
  unplaced: Array<{ userId; reason: 'POOL_TOO_SMALL' | 'NO_COMPATIBLE_GROUP' | 'NO_SLOT_CAPACITY' }>;
  stats: { candidates; placed; groups; meanPairScore; romanceCoverage; iterations };
}
function backfillCandidate(i: { outingMembers; pool; facts; seed; tuning }): string | null   // §4.6
```
`seed = "outings|<neighborhoodId>|<weekKey>|<tuningVersion>"` ; `algoVersion = "groups-2026.12.0"`.

### 4.2 Contraintes dures par paire (`PAIR_FILTERS`, réciproques)
B refactore `filters.ts` en filtres **nommés** (`FILTER_BY_REASON: Record<ExclusionReason, CandidateFilter>`) pour composer des listes sans dupliquer : `FILTERS` (duo/V4) et `PAIR_FILTERS` (groupe) en sont des sélections.
| Raison | Règle |
|---|---|
| `SELF`, `NOT_ADULT`, `NOT_VERIFIED`, `INACTIVE_ACCOUNT` | réutilisés tels quels |
| `AGE_PREFERENCE` | réutilisé avec `groupAge` |
| `MEET_GENDER` (nouveau) | `s.meetGenders` non vide et `o.gender ∉ s.meetGenders` → exclu ; `UNDISCLOSED` ne satisfait pas une liste restrictive (règle existante) |
| `BLOCKED_OR_REPORTED` | blocage dans un sens ou l'autre, ou signalement non clos |
| `MET_BEFORE` | déjà co-présents à une sortie (jamais de limite de temps), BandLink existant (même retiré), duo existant ou passé, proposition DUO_LANE refusée/expirée < 90 j ; **sauf** la paire +1 |
| `LIMIT_GHOSTER` | limite GHOSTER d'un côté et `M ≥ 3` et `N/M < 700‰` de l'autre |
Exclus du vivier avant tout (pas par paire) : pause de fiabilité, place active cette semaine, compte non éligible.

Compatibilité romance (non éliminatoire en groupe) : `rom(a,b) = a.seeks.romance ∧ b.seeks.romance ∧ b.gender ∈ a.romanceGenders ∧ a.gender ∈ b.romanceGenders`.
Mode `DUO` (voie Duo, module matching existant) : `FILTERS` + `(rom(a,b)) ∨ (a.seeks.friends ∧ b.seeks.friends ∧ MEET_GENDER ok)`.

### 4.3 Score de paire et objectif de groupe (entiers)
- `w(a,b) = round((scoreVision(a,b,0,t*).score + scoreVision(b,a,0,t*).score) / 2)` ∈ [0,100], avec `t*` = tuning dont `matching.weights` est remplacé par `outings.composition.visionWeights` (G = 0, autres poids renormalisés : C .33, P .28, D .11, E .06, R .11, S .05, M .06 `[T]`). Distance 0 : tout le monde est dans le quartier ; **aucune distance n'est jamais calculée ni affichée**.
- Contrainte : `w(a,b) ≥ [T] composition.minPairScore` (35) pour toute paire du groupe.
- Objectif en milli-points : `J(G) = 1000·mean(w) + λr·romCov(G) + λf·friendFit(G) − λg·genderImb(G) − λs·(6 − |G|)` avec `[T]` λr = 8000, λf = 3000, λg = 10000, λs = 1500 :
  - `romCov` = part (‰) des membres `seeks.romance` ayant ≥ 1 `rom`-compatible dans G (0 si aucun chercheur romance) ;
  - `friendFit` = part (‰) des paires où les deux `seeks.friends` ;
  - `genderImb` = `max(0, partMaxD'UnGenre‰ − [T] composition.maxGenderSharePermille (670))` appliqué seulement si G contient un chercheur romance **ou** si tous les `meetGenders` de G sont vides (groupes « mixtes » par préférence) ; un groupe dont tous les membres restreignent `meetGenders` au même genre n'est pas pénalisé.
- Contraintes de groupe : `4 ≤ |G| ≤ 6` ; créneau commun ; +1 ensemble ; tout membre `seeks.romance ∧ ¬seeks.friends` doit avoir ≥ 1 `rom`-compatible dans G.

### 4.4 Procédure (déterministe)
1. **Unités** : chaque candidat est une unité ; une paire +1 réciproque fusionne en une unité de 2 (contraintes vérifiées pour les deux membres). +1 non réciproque ou non éligible → ignoré (la personne est composée seule).
2. **Ordre de priorité** (tri total) : `missedWeeks` desc, `firstOuting` desc, `requestedAtMs` asc, `fnv1a(seed|userId)` asc. (Équité : être reporté·e une semaine donne la priorité la suivante ; payer ou Blowy+ ne change **rien**.)
3. **Construction gloutonne** : pour chaque unité-graine non placée dans cet ordre, pour chacun de ses créneaux ayant de la capacité (tri `startsAtMs` asc, puis `venueSlotId`), construire `G = {graine}` puis ajouter itérativement l'unité compatible maximisant `J(G ∪ u)` (départage `fnv1a(seed|g|u)`) jusqu'à `[T] composition.targetSize` (6) ou épuisement. Garder le meilleur créneau (J max). Si `|G| ≥ 4` et contraintes OK : groupe accepté, capacité décrémentée, unités placées. Sinon la graine reste disponible (elle peut être absorbée par une graine suivante).
4. **Réparation** : chaque unité non placée (même ordre) est insérée dans le groupe de même créneau (`|G| < 6`) maximisant `ΔJ`, si contraintes OK et `ΔJ ≥ −[T] composition.repairToleranceMilli` (2000).
5. **Amélioration locale** : jusqu'à `[T] composition.maxSwapIterations` (200) passes ; à chaque passe, parcourir les couples de groupes du même créneau (tri par id) et les échanges de deux unités de même taille, appliquer le meilleur `ΔJ > 0` ; arrêt si aucun gain. Entiers seulement → pas de dérive flottante.
6. **Non placés** : `POOL_TOO_SMALL` si le vivier du créneau < 4, `NO_SLOT_CAPACITY` si la capacité manquait, sinon `NO_COMPATIBLE_GROUP`. Ce motif n'est **pas** montré tel quel à l'utilisateur (écran « pas de sortie cette semaine » unique).
Complexité : O(n² + passes·g·6²) ; cible ≤ 2 s pour 600 candidats sur 2 vCPU (test de performance).

### 4.5 Le « +1 » (inviter un ami à sa sortie)
`outings.request {companion: {inviteRef}}` : lien d'invitation `social` existant de type `OUTING_PLUS_ONE`. L'invité·e doit avoir fini l'onboarding, vérifié son selfie, être dans le même quartier et faire sa propre demande avec le même `weekKey` avant `requestClosesAt` (le lien pré-remplit). Les deux ne votent pas l'un pour l'autre ; s'ils sont tous deux `ATTENDED`, BandLink `PLUS_ONE`. Chacun paie/consomme sa propre place.

### 4.6 Backfill (places libérées avant verrouillage)
Sur `DECLINED`/`EXPIRED`/`CANCELLED` avant `lockAt` : `backfillCandidate` choisit, parmi les demandes `UNPLACED` de la semaine disponibles sur ce créneau, l'unité de taille 1 maximisant `J(G ∪ u)` sous les mêmes contraintes (membres = places invitées + confirmées). Invitation avec `acceptDeadline = min(now + 12 h, lockAt)`. Job `outings.backfill` (15 min), idempotent par `(outingId, seatsFreedVersion)`.

### 4.7 Tests exigés (B)
Propriétés (fast-check, seeds fixes) : même entrée → même sortie ; permutation de l'entrée → même sortie ; aucune paire bloquée/déjà vue réunie ; tailles 4–6 ; +1 ensemble ; capacité respectée ; chercheur romance-seul toujours couvert ; `meetGenders` respecté pour chaque paire ; un candidat `missedWeeks = 1` est placé avant un candidat `0` à profils égaux ; aucune influence du financement (le champ n'existe pas en entrée). Simulateur `pnpm simulate:outings` (seed `blowy-outings-2026`, 300/600 candidats, 3 créneaux) rapportant taux de placement, score moyen, couverture romance, déséquilibre de genre → documenté dans `docs/engine-rules.md` §12.

---

## 5. Le pet en V5 (`packages/pet-engine`)

### 5.1 Ce qui reste, ce qui disparaît
| Élément V4 | V5 | Raison |
|---|---|---|
| `reduce` dispatcher + registre `ActionHandler` (pattern) | **gardé** : nouveau registre `HANDLERS_V5` | architecture validée |
| `random/prng`, `time/zone`, `shared/units`, `shared/clone`, `shared/daily` | gardés | utilitaires purs |
| `progression/pet-xp` (stades BABY → YOUNG → ADULT) | gardé, alimenté par les souvenirs | le pet grandit avec les souvenirs |
| `egg/heredity`, `egg/egg` | gardés, re-portés sur le Duo (T9 optionnel) | clin d'œil |
| `notify/planNotifications` | gardé, catégories V5 (§9) | plafonds, heures calmes |
| `gauges/*` (faim, énergie, humeur, santé), poses SICK/HUNGRY/SAD | **retiré du runtime** | concept §6 : pas de faim/santé |
| `random/refusal` (appel/refus) | retiré | plus d'appel du pet |
| `relationship/*` (gain du Lien, k, m, contributions, attente, absence, silence) | retiré | plus de Lien XP V4 |
| `progression/levels`, `capabilities`, `unlock` (N1–N7) | retiré | remplacé par états de sortie/duo |
| `world/accumulators` (inactivité, absence, fiabilité 72 h) | retiré | fiabilité = présence réelle (§2.14) |
| `group/cohesion` (bande 3–5) | retiré | bande = liens |
| `simulate/` (N3@J14, maladie) | gelé (admin `tuning-simulator.ts` continue de l'importer jusqu'à T6) | remplacé par `simulate:outings` |
| séries, ligues, missions, pièces | retirés | concept §6, §10 |

Le code V4 **n'est pas supprimé** dans cette version : il est marqué `@deprecated`, exporté sous `@blowy/pet-engine/v4` pour le rejeu des journaux existants, et plus appelé par l'API. Suppression planifiée quand plus aucun import (vérification `rg "@blowy/pet-engine/v4"` vide).

### 5.2 Moteur V5 (`packages/pet-engine/src/v5/`)
`reduceV5(state: PetStateV5, event: PetEventV5, ctx: {now, seed, engineVersion: 'engine-2026.12.0', tuning}) → {state, effects}`.
```
PetStateV5 = { id, species, stage, xpMilli, memoryCount, attendedCount,
               unlockedAccessories: string[], equipped: string[] (≤ [T] accessories.maxEquipped 3),
               reaction: {pose, untilMs} | null, recentEventIds: string[] }
PetEventV5 =
  | MEMORY_RECORDED { petId, memoryKind, refId, attended?: boolean }
  | ACCESSORY_GRANTED { petId, accessoryId, source: 'MEMORY' | 'PLUS_MONTHLY' | 'REFERRAL' | 'STAFF' }
  | ACCESSORY_EQUIP { petId, accessoryIds: string[] }
  | REACT { petId, pose: ReactionPose }        // brise-glace, check-in, révélation
EffectV5 =
  | MEMORY_ADDED { petId, memoryKind } | PET_XP_GAINED { petId, milli } | STAGE_GROWN { petId, stage }
  | ACCESSORY_UNLOCKED { petId, accessoryId } | REACTION { petId, pose, untilMs }
  | MILESTONE_REACHED { petId, kind: 'PROMISE_KEPT', n } | ACTION_REJECTED { reason }
```
Règles (`[T] memories`) : XP par souvenir (`OUTING_LIVED` 40, `DUO_DATE_LIVED` 30, `BAND_NEW_MEMBER` 20, `PROMISE_KEPT` 25, `HATCHED` 0) ; seuils de stade existants (300 / 1500, à recalibrer par le simulateur : cible « jeune » après 2 sorties, « adulte » après ~10) ; `accessoryUnlocks: [{ atMemoryCount, accessoryId }]` et `kindUnlocks: [{ memoryKind, nth, accessoryId }]` ; `MEMORY_RECORDED` avec `attended` incrémente `attendedCount` et émet `MILESTONE_REACHED` aux paliers `promiseMilestones` (le backend crée alors le souvenir `PROMISE_KEPT`). Aucune perte, aucun gel, aucune décroissance, pas de multiplicateur payant. Pose V5 : réaction TTL > nuit locale (`ASLEEP`, cosmétique) > `JOYFUL` ; `SICK`, `HUNGRY`, `SAD` ne sont jamais produites.

### 5.3 Migration des handlers
| Handler V4 | Devenir |
|---|---|
| `CALL_PET`, `HUG`, `PLAY`, `FEED_PET`, `HEAL_PET`, `FEED_FRIEND`, `GIFT`, `MESSAGE_PUBLISHED`, `MISSION_VALIDATED`, `GATES_UPDATED`, `PAUSE_SET`, `MOVE_IN`, `RELATIONSHIP_ENDED` | retirés de `HANDLERS_V5` (restent dans `v4`) |
| `ADVANCE` | absent en V5 (aucune dynamique temporelle) |
| `EGG_*` | réexposés en V5 avec `duoId` au lieu de `relationshipId` (T9) |
| — | nouveaux : `MEMORY_RECORDED`, `ACCESSORY_GRANTED`, `ACCESSORY_EQUIP`, `REACT` |

Backend : `ProvisionalEngineGateway` remplacé par `PetEngineV5Gateway` (`apps/api/src/shared/infrastructure/engine/`, propriétaire C) ; état persisté dans `PetState.engineStateV5` (JSON, nouvelle colonne) + `Pet.engineVersion`. Consommateurs outbox du module `pets` : `outing.attendance_recorded` → `MEMORY_RECORDED(OUTING_LIVED, attended)` ; `connection.revealed{kind:FRIEND}` et `band.linked` → `BAND_NEW_MEMBER` ; `duo.date_done` → `DUO_DATE_LIVED` ; `economy.plus_monthly_granted` → `ACCESSORY_GRANTED(PLUS_MONTHLY)` ; `referral.first_outing_lived` → `ACCESSORY_GRANTED(REFERRAL)`. Migration des pets existants : état V5 initial = stade conservé, `xpMilli` conservé, aucun souvenir rétroactif sauf `HATCHED`.

---

## 6. Économie V5

### 6.1 Ce qui reste de `apps/api/src/modules/economy`
| Élément | Devenir |
|---|---|
| Ledger pièces (`Wallet`, `LedgerEntry`, append-only, contre-écritures) | **gelé** : plus aucun crédit/débit produit ; lecture + corrections staff seulement. Le *patron* (append-only, clé d'idempotence, contre-écriture, `LedgerKeys`) est réutilisé pour le ledger de crédits de sortie. |
| RevenueCat (webhook auth, réconciliation, `Subscription`, `EntitlementGrant`, `EntitlementStateService`, états, sandbox/prod) | **gardé** : autorité des droits Blowy+, avec Stripe comme store (intégration Stripe de RevenueCat) — voir 6.2 |
| `LOCAL_DEMO` (fournisseur de démo, refusé en production) | gardé, étendu au port `PaymentProvider` |
| `ProviderWebhookEvent` (idempotence) | gardé, `provider` + valeur `STRIPE` |
| `purchase-catalog-item`, `use-streak-freeze`, boost, gels, `grant-monthly-benefits` (pièces + gels), `DERIVED_PARTNER`, espèces premium, XP×2 week-end | **retirés** (routes 410, cf. §7.7) ; code conservé mais non câblé |
| `StoreCreditService` (consommables pièces) | retiré |

### 6.2 Produits V5
| Produit | Nature | Fournisseur | Notes |
|---|---|---|---|
| **Place de sortie** | paiement unique d'un service réel (conso incluse au lieu) | **Stripe PaymentIntent** (Apple Pay / Google Pay / carte via PaymentSheet) ; `LOCAL_DEMO` hors prod | prix `[T] pricing.seat.amountCents` (placeholder 1200, EUR) — le serveur fixe le montant ; TVA hors périmètre de cette spec |
| **Blowy+ mensuel** | abonnement : `[T] plus.includedOutingsPerMonth` (2) crédits de sortie + 1 accessoire cosmétique mensuel | **Stripe Billing**, synchronisé dans RevenueCat (entitlement `blowy_plus`) ; `LOCAL_DEMO` | prix défini dans Stripe (placeholder 19,99 €), affiché depuis le fournisseur ; aucun essai à compte à rebours |
| **1ʳᵉ sortie offerte** | crédit `FREE_FIRST` unique | interne | accordé à la 1ʳᵉ vérification selfie réussie (`dedupKey first_free:<userId>`) |
| **Accessoires** | cosmétiques **non achetables à l'unité** | interne | gagnés par souvenirs, parrainage, ou l'accessoire mensuel Blowy+ ; la boutique les montre |
Pourquoi pas d'achat intégré (IAP) : la place et Blowy+ achètent un service consommé hors de l'app (App Store Review Guideline 3.1.5(a), politique Paiements Google Play : biens et services physiques) — à reconfirmer à la soumission ; si la revue exige l'IAP pour la part numérique de Blowy+ (accessoire), drapeau `[T] plus.includesMonthlyAccessory=false` sur iOS. Dépendance mobile à demander : `@stripe/stripe-react-native` (lockfile = A).
Interdits vérifiés par tests de contrat : aucun produit ne modifie la composition, la visibilité, le quota hebdo, l'ordre de priorité, le score ou les votes ; pas de paywall dans l'onboarding, pas d'offre limitée dans le temps, pas d'offre hebdo.

### 6.3 Crédits de sortie et paiements
- `OutingCreditEntry` (append-only, trigger anti UPDATE/DELETE) : `userId, delta (±1, CHECK ≠ 0), kind FREE_FIRST|PLUS_INCLUDED|REFUND_CREDIT|STAFF_GRANT, reason GRANT|CONSUME|EXPIRE|REVERSAL, expiresAt?, sourceRef, idempotencyKey UNIQUE, reversesEntryId UNIQUE?`. Solde par lots (`OutingCreditBalance(userId, kind, expiresAt)` ou calcul FIFO) avec CHECK ≥ 0, verrou `FOR UPDATE`.
- Expirations : `PLUS_INCLUDED` à la fin de la période payée (pas de report — affiché honnêtement) ; `REFUND_CREDIT` `[T] credits.refundCreditValidityDays` (90 j) ; `FREE_FIRST` sans expiration ; job `economy.expire_credits` (horaire).
- `Payment(id, userId, provider STRIPE|LOCAL_DEMO, environment, providerPaymentId UNIQUE(provider, environment, id), purpose SEAT, seatId UNIQUE, amountCents, currency, status REQUIRES_PAYMENT|SUCCEEDED|FAILED|CANCELLED|REFUND_PENDING|REFUNDED, refundProviderId?, createdAt, succeededAt?, refundedAt?)`.
- Flux place payante : `seat.accept` (tx : place `HELD`) → après commit, `PaymentProvider.createIntent({amount, idempotencyKey:"seat:<seatId>"})` → `clientSecret` renvoyé (ou WS `outing.seat_updated {payment}` si la création est asynchrone) → PaymentSheet → webhook `payment_intent.succeeded` (authentifié par signature Stripe, idempotent par `event.id`) → tx : place `CONFIRMED` si `HELD` et non expirée, sinon remboursement planifié. `payment_intent.payment_failed` → place reste `HELD` jusqu'à expiration.
- Blowy+ : à chaque début de période payée (événement RevenueCat `INITIAL_PURCHASE`/`RENEWAL` ou réconciliation), use case `grant-plus-period` : `includedOutingsPerMonth` entrées `PLUS_INCLUDED` (`idempotencyKey plus:<subscriptionId>:<periodStart>:<n>`) + `economy.plus_monthly_granted` (accessoire). Remboursement/révocation de l'abonnement : crédits `PLUS_INCLUDED` non consommés contre-passés ; places déjà confirmées conservées.

### 6.4 Remboursements automatiques
| Cas | Place payée (`PAID`) | Place sur crédit (`FREE_FIRST`, `PLUS_INCLUDED`, `CREDIT`) |
|---|---|---|
| Sortie annulée par Blowy (sous-effectif, lieu, staff, quartier fermé) | **remboursement carte intégral** (Stripe refund, `Idempotency-Key refund:<seatId>`) | crédit recrédité du même type ; `PLUS_INCLUDED` expiré entre-temps → `REFUND_CREDIT` 90 j |
| Retrait système (personne bloquée) ou retrait de sécurité | remboursement carte intégral | recrédit |
| Annulation par l'utilisateur ≥ 24 h avant | `REFUND_CREDIT` 90 j (remboursement carte sur demande au support, `finance`) | recrédit du même type |
| Annulation < 24 h, absence sans prévenir | aucun | aucun |
| Paiement réussi après expiration du hold / sortie déjà pleine ou annulée | remboursement carte intégral | — |
| Suppression de compte avec place active | remboursement carte intégral | perdu (compte supprimé) |
| Litige lieu (conso non servie…) | remboursement manuel `finance` (step-up), audité | recrédit manuel |
Traitement : outbox `outing.seat_refund_due {seatId, mode}` → consommateur `economy` (hors verrou) → `Payment.REFUND_PENDING → REFUNDED` ou entrée de crédit ; échec fournisseur = retry exponentiel + file admin. Une place ne peut produire **qu'un** remboursement (`refundState` + unicités). Notification `outing.refund_done`.

---

## 7. API /v1 — commandes, requêtes, événements

Toutes les commandes : en-tête `Idempotency-Key` obligatoire, CommandBus. Les listes : `?cursor&limit` (curseur opaque keyset `(createdAt desc, id desc)` sauf mention). Les contrats Zod vivent dans `packages/api-contract/src/{neighborhoods,outings,connections,safety,payments}.ts` (propriétaires §11) et sont publiés **avant** l'implémentation.

### 7.1 Quartiers et profil (`neighborhoods`, `users`)
| Opération | Route | Payload / réponse (champs) | Échecs |
|---|---|---|---|
| (requête) | `GET /v1/neighborhoods` | `items[{id, slug, name, status, city}]` (LIVE + WAITLIST) | — |
| `me.set_neighborhood` | `PUT /v1/me/neighborhood` | `{neighborhoodId}` → `NeighborhoodStatusView` | 404 ; 412 `NEIGHBORHOOD_CHANGE_TOO_SOON {availableAt}`, `ACTIVE_SEAT_EXISTS` |
| (requête) | `GET /v1/me/neighborhood` | `{neighborhood{id,name,status}, waitlist?{verifiedCount, threshold}, isVerified, hasPhoto}` | — |
| `me.update_preferences` (modifié) | `PUT /v1/preferences/matching` | + `seeksFriends, seeksRomance, meetGenders[], romanceGenders[], duoLaneEnabled` ; `intention` accepté mais ignoré (déprécié) | 400 ; 403 `CONSENT_REQUIRED {purpose:"SENSITIVE_PREFERENCES"}` si `romanceGenders` sans consentement |
| `me.update_privacy` (modifié) | `PUT /v1/preferences/privacy` | + `discreetMode` ; `mapVisible` ignoré ; `photoPreference=NEVER` accepté mais bloque sorties/duos (`PHOTO_REQUIRED`) | 400 |
| `me.complete_onboarding` (modifié) | `POST /v1/me/onboarding/complete` | missing ajoute `SEEKS`, `NEIGHBORHOOD` | 412 `ONBOARDING_INCOMPLETE {missing}` |

### 7.2 Sorties (`outings`)
| Opération | Route | Payload → réponse | Échecs spécifiques |
|---|---|---|---|
| (requête) | `GET /v1/outings/week` | `{weekKey, phase: NOT_LAUNCHED\|REQUEST_OPEN\|COMPOSING\|INVITED\|IN_OUTING\|UNPLACED\|PAUSED\|QUOTA_USED, requestWindow{opensAt, closesAt}, slots[{startsAt, label}], myRequest?, myOutingId?, priorityNextWeek, pausedUntil?}` | — |
| `outings.request` | `PUT /v1/outings/requests/:weekKey` | `{slotStartsAt[] (1–3), companion?{inviteRef}}` → `OutingRequestView` | 412 `NEIGHBORHOOD_NOT_LIVE`, `VERIFICATION_REQUIRED`, `PHOTO_REQUIRED`, `RELIABILITY_PAUSED {until}`, `REQUEST_WINDOW_CLOSED`, `ONBOARDING_INCOMPLETE` ; 409 `WEEKLY_QUOTA_USED` |
| `outings.withdraw_request` | `DELETE /v1/outings/requests/:weekKey` | — | 412 `ALREADY_PLACED` |
| (requête) | `GET /v1/outings/:id` | `OutingView` (§7.5), projeté par acteur | 404 |
| `outings.seat.accept` | `POST /v1/outings/:id/seat/accept` | `{funding: AUTO\|PAY}` → `{seat{status, funding?, holdExpiresAt?}, payment?{provider, clientSecret, amountCents, currency}}` | 404 ; 412 `INVITATION_EXPIRED`, `SEAT_NOT_INVITED`, `OUTING_NOT_OPEN` ; 409 `WEEKLY_QUOTA_USED` ; 503 `PROVIDER_UNAVAILABLE` (place reste `INVITED`) |
| `outings.seat.decline` | `POST /v1/outings/:id/seat/decline` | — | 412 `SEAT_NOT_INVITED` |
| `outings.seat.cancel` | `POST /v1/outings/:id/seat/cancel` | `{kind: CANT_MAKE_IT\|SAFETY}` → `{cancelKind: EARLY\|LATE\|SAFETY_EXIT, refund: CARD\|CREDIT\|NONE}` ; aperçu sans effet : `GET /v1/outings/:id/seat/cancel-preview` | 412 `SEAT_NOT_ACTIVE`, `OUTING_STARTED` |
| `outings.check_in` | `POST /v1/outings/:id/check-in` | `{method: GEO, lat, lng, accuracyM}` ou `{method: VENUE_CODE, code}` → `{result: ACCEPTED}` | 412 `CHECKIN_NOT_OPEN`, `CHECKIN_TOO_FAR`, `CHECKIN_LOW_ACCURACY`, `CHECKIN_CODE_INVALID {attemptsLeft}` ; 429 |
| (requête) | `GET /v1/outings/:id/votes` | `{closesAt, targets[{userId, firstName, photo, pet, myChoice?, revealed: bool, mutual?: FRIEND\|PLUS}], plusAvailable}` (présents seulement) | 404 si non présent |
| `outings.vote.cast` | `PUT /v1/outings/:id/votes/:targetUserId` | `{choice: FRIEND\|PLUS\|NO}` → `{myChoice}` (aucune info sur l'autre) | 404 (cible non présente) ; 412 `VOTE_WINDOW_CLOSED`, `PLUS_NOT_AVAILABLE` ; 409 `VOTE_LOCKED` (paire déjà révélée) |
| `attendance.dispute` | `POST /v1/outings/:id/attendance/dispute` | `{note (≤ 500)}` | 412 `DISPUTE_WINDOW_CLOSED`, `NOT_NO_SHOW` ; 409 `DISPUTE_EXISTS` |
| (requête) | `GET /v1/outings/history` | page `{id, weekKey, startsAt, venueName, attended, memoryId?}` | — |
| (requête) | `GET /v1/me/reliability` | `{attended, total, pausedUntil?, newcomer}` | — |
Le chat de groupe utilise les routes `conversations` existantes (`/v1/conversations/:id/messages`, `read`) ; `POST /v1/conversations/:id/messages` accepte `promptId?` (réponse « 3 mots ») et refuse les médias pour `kind=OUTING` (412 `MEDIA_NOT_ALLOWED`).

### 7.3 Bande et duos (`connections`)
| Opération | Route | Payload → réponse | Échecs |
|---|---|---|---|
| (requête) | `GET /v1/band` | page `{linkId, user{id, firstName, photo}, pet, reliability, conversationId, origin, since}` | — |
| `band.leave` | `POST /v1/band/:linkId/leave` | — | 404 ; 412 `ALREADY_LEFT` |
| (requête) | `GET /v1/duos` · `GET /v1/duos/:id` | `DuoView {id, status, origin, other{firstName, pet, photo?, reliability}, exchange{endsAt, mineCount, unlockProgress: 0..1 (de moi seulement)}, dateDeadline?, currentDate?, conversationId}` | 404 |
| (requête) | `GET /v1/matches` (modifié) | propositions `DUO_LANE` ouvertes (≤ 3 actives) `{proposalId, pet, visionScore, expiresAt}` | — |
| `matching.accept_proposal` (modifié) | `POST /v1/match-proposals/:id/accept` | au 2ᵉ accord : `Duo(EXCHANGE)` au lieu d'une relation DATE | 412 `PROPOSAL_NOT_OPEN`, `VERIFICATION_REQUIRED`, `PHOTO_REQUIRED`, `RELIABILITY_PAUSED` ; 409 `DUO_LIMIT_REACHED` |
| `matching.pass_proposal` (nouveau) | `POST /v1/match-proposals/:id/pass` | silencieux pour l'autre (expire normalement de son côté) | 412 `PROPOSAL_NOT_OPEN` |
| `duos.date.propose` | `POST /v1/duos/:id/dates` | `{venueId, startsAt}` → `DuoDateView` | 412 `DUO_NOT_UNLOCKED`, `DATE_ALREADY_PROPOSED`, `VENUE_NOT_IN_NEIGHBORHOOD`, `DATE_OUT_OF_RANGE` |
| `duos.date.respond` | `POST /v1/duos/:id/dates/:dateId/respond` | `{decision: ACCEPT\|DECLINE}` (contre-proposition = `propose`) | 412 `DATE_NOT_PROPOSED`, `OWN_PROPOSAL` |
| `duos.date.cancel` | `POST /v1/duos/:id/dates/:dateId/cancel` | `{kind: CANT_MAKE_IT\|SAFETY}` (≥ 24 h : neutre ; < 24 h : compté `lateCancel`) | 412 `DATE_NOT_CONFIRMED` |
| `duos.date.check_in` | `POST /v1/duos/:id/dates/:dateId/check-in` | idem §7.2 | idem |
| `duos.vote.cast` | `PUT /v1/duos/:id/dates/:dateId/vote` | `{choice}` | 412 `VOTE_WINDOW_CLOSED` ; 404 si absent·e |
| `duos.leave` | `POST /v1/duos/:id/leave` | — | 412 `ALREADY_CLOSED` |
| `duos.egg.*` (T9) | `POST /v1/duos/:id/egg/...` | reprend les commandes œuf existantes sur `duoId` | 412 `EGG_NOT_ELIGIBLE` |

### 7.4 Sécurité (`safety`) et paiements (`economy`)
| Opération | Route | Payload → réponse | Échecs |
|---|---|---|---|
| `safety.guardian_link.create` | `POST /v1/safety/guardian-links` | `{subject{kind: OUTING\|DUO_DATE, id}, label?}` → `{id, url (une fois), activeFrom, expiresAt}` | 404 ; 412 `SUBJECT_NOT_CONFIRMED` ; 409 `GUARDIAN_LINK_LIMIT` |
| (requête) | `GET /v1/safety/guardian-links?subjectKind&subjectId` | `items[{id, label, createdAt, lastViewedAt, revoked}]` (sans URL) | — |
| `safety.guardian_link.revoke` | `DELETE /v1/safety/guardian-links/:id` | — | 404 |
| `safety.ok` | `POST /v1/safety/ok` | `{subject}` | 412 `SUBJECT_NOT_ACTIVE` |
| `safety.alert.raise` | `POST /v1/safety/alerts` | `{subject, position?{lat, lng, accuracyM}}` → `{alertId, emergencyNumbers}` ; **jamais bloqué** par un rate limit global (limite dédiée 10/h) | 404 |
| `safety.alert.resolve` | `POST /v1/safety/alerts/:id/resolve` | `{status: SAFE}` | 404 |
| (public) | `GET /v1/public/guardian/:token` | `GuardianPageView {ownerFirstName, kind, startsAt, endsAt, venue?{name, address}, timeline[{type: CHECKED_IN\|OK\|ALERT\|ENDED, at}], alert?{at, position?}, active, emergencyNumbers}` | 404 (jeton inconnu, expiré ou révoqué : **même réponse**) ; 429 |
| (public) | `POST /v1/public/guardian/:token/push` | `{subscription (Web Push)}` | 404 |
| (requête) | `GET /v1/outing-credits` | `{available[{kind, count, expiresAt?}]}` | — |
| (requête) | `GET /v1/purchases/products` (modifié) | `{seat{amountCents, currency}, plus{priceLabel, includedOutingsPerMonth}, provider: STRIPE\|LOCAL_DEMO}` | — |
| `economy.plus.checkout` | `POST /v1/subscriptions/plus/checkout` | → `{provider, clientSecret\|checkoutUrl}` | 501 `NOT_CONFIGURED` |
| (public) | `POST /v1/webhooks/stripe` | signature `Stripe-Signature` vérifiée sur corps brut, idempotent par `event.id` | 400/401 sans enregistrement |
| `GET /v1/subscriptions/me` (modifié) | | `entitlements` V5 : `PLUS_INCLUDED_OUTINGS`, `PLUS_MONTHLY_ACCESSORY` | — |

Pets : `GET /v1/pets/mine` (modifié : `{id, name, species, stage, pose, equipped[], unlockedAccessories[], memoryCount, nextStageAt}` ; plus de jauges) · `GET /v1/pets/mine/memories` (page) · `PUT /v1/pets/mine/accessories` `pets.equip {equipped[] ≤ 3}` (412 `ACCESSORY_NOT_UNLOCKED`) · `pets.create_primary` : les 4 espèces gratuites (plus de 402).

### 7.5 `OutingView` (forme, champs optionnels selon §3.1)
```
{ id, status, weekKey, neighborhood{name}, startsAt, endsAt, capacity, confirmedCount,
  mySeat{status, funding?, holdExpiresAt?, acceptDeadline?, cancelPreview?},
  timeline{acceptDeadline, lockAt, photoRevealAt, checkinOpensAt, checkinClosesAt, votesCloseAt},
  venue?{name, address, offerLabel, lat, lng},            // CONFIRMED+ et ma place CONFIRMED
  members[{ userId, pet{name, species, equipped, traits[3]}, threeWords[],
            firstName?, ageRange?, reliability?{attended,total}|'NEWCOMER', photo?{mediaId, url},
            arrived?: true, notComing?: true }],          // jamais moi en double, jamais bloqué·e
  conversationId?, votes?{open, closesAt}, cancelled?{reason: 'UNDERSIZED'|'VENUE'|'OTHER', refund} }
```
Les URL de photo sont des jetons média à durée courte émis par `media` sur preuve d'ACL `OUTING_REVEAL` (place confirmée, `now ≥ photoRevealAt`, `now < votesCloseAt`) ou `DUO_UNLOCKED` / `BAND`.

### 7.6 Événements WS (enveloppe `WsEnvelope` existante, `schemaVersion: 1`)
| Type | Salle / destinataires | payload |
|---|---|---|
| `outing.invited` | `user:` invité·e | `{outingId, acceptDeadline}` |
| `outing.updated` | `outing:` membres actifs (projection) | `{outingId, status, confirmedCount, changed: STATUS\|MEMBERS\|VENUE\|PHOTOS}` (le client relit `GET /outings/:id`) |
| `outing.seat_updated` | `user:` propriétaire | `{outingId, seat{status, refundState}, payment?}` |
| `outing.checkin_updated` | `outing:` présents pendant CHECKIN_OPEN | `{outingId, userId, arrived: true}` |
| `outing.votes_opened` / `outing.votes_closed` | `user:` chaque présent·e (heure fixe) | `{outingId, closesAt}` / `{outingId, newBandCount, newDuoCount}` (ses accords seulement) |
| `connection.revealed` | `user:` les deux seuls | `{kind: FRIEND\|PLUS, other{userId, firstName, pet}, linkId?\|duoId?, source: OUTING\|DUO}` |
| `band.updated` | `user:` | `{linkId, status}` |
| `duo.updated` | `duo:` + `user:` | `{duoId, status, changed}` |
| `reliability.updated` | `user:` | `{attended, total, pausedUntil?}` |
| `pet.updated` (modifié) | `user:` | `{petId, stage, memoryAdded?{kind}, accessoryUnlocked?}` |
| `safety.alert_ack` | `user:` | `{alertId}` |
| `access.revoked` (existant) | `user:` | + `{scope: OUTING\|DUO\|BAND, id}` |
Demandes à A (propriétaire `api-contract/src/core`) : `WsJoinSchema.room` accepte `outing:<uuid>` et `duo:<uuid>` ; `WS_EVENT_TYPES` étendu ; code d'erreur générique `GONE` (410).

### 7.7 Déprécié (V4)
Réponse `410 GONE {reason:"RETIRED_IN_V5"}` à partir de T2 : `POST /v1/pets/:id/actions`, `POST /v1/pets/:id/move`, `POST /v1/relationships/:id/{move-in,consents/respond,branch/ballot,branch/downgrade,pause}`, `GET|POST /v1/relationships/:id/photo-reveal`, `POST /v1/streak-freezes/use`, `POST /v1/catalog/:itemId/purchase` (gel, boost, œuf rare), `GET /v1/me/anonymous-responses/:id/hints`, routes missions, ligues, carte, Quartier (feed). Conservés en lecture seule : `GET /v1/relationships`, `GET /v1/relationships/:id`, `GET /v1/wallet` (solde historique), `GET /v1/catalog` (accessoires). Conservés tels quels : auth, me, consents, verifications, media, trust (blocks, reports, appeals), exports, suppression, referrals/invites, pages publiques « 3 mots », conversations.

### 7.8 Jobs (worker, clé d'unicité)
| Job | Cadence | Clé | Effet |
|---|---|---|---|
| `neighborhoods.generate_slots` | quotidien | `(venueId, startsAt)` | créneaux S+1 |
| `neighborhoods.density` | horaire | — | `verifiedWaitlisted` ; alerte admin au seuil |
| `outings.compose` | 5 min, s'exécute à `requestClosesAt` | `CompositionRun(neighborhoodId, weekKey, kind=WEEKLY)` unique | §4 |
| `outings.backfill` | 15 min | `(outingId, freedVersion)` | §4.6 |
| `outings.lifecycle` | 5 min | `(outingId, targetStatus)` | transitions §2.5, holds expirés |
| `votes.reveal` | horaire | `(outingId\|duoDateId, cadenceSlot)` | §2.10 |
| `duos.lifecycle` | 15 min | `(duoId, targetStatus)` | `exchangeEndsAt`, `dateDeadline`, RDV |
| `outings.purge` | horaire | `JobExecution` | bulletins, chats, positions d'alerte, push gardien |
| `economy.expire_credits`, `economy.refunds` | horaire / 1 min | idempotence par entrée | §6 |
| `notifications.plan` | 5 min | `Notification(userId, dedupKey)` existant | §9 |

---

## 8. Schéma — migration additive proposée (propriétaire C)

Ne jamais réécrire `20261031233029_init`, `20261031233100_constraints`, `20261101013448_trust_media_ai`. Deux nouvelles migrations : **(1) `…_v5_enums`** (PostgreSQL : une valeur ajoutée par `ALTER TYPE … ADD VALUE` n'est utilisable qu'après commit — d'où un fichier séparé), **(2) `…_v5_outings`** (tables, colonnes, contraintes SQL brutes).

### 8.1 Enums (ajouts de valeurs)
`ConversationKind += OUTING, DUO, BAND` · `MatchProposalKind += DUO_LANE` · `ReliabilityReason += OUTING_ATTENDED, OUTING_NO_SHOW, DUO_NO_SHOW, RELIABILITY_PAUSE` · `NotificationCategory += OUTING, VOTE, CONNECTION, DUO, RELIABILITY` · `StaffRole += ops` · `BillingProviderKind += STRIPE` · `BillingEnvironment` inchangé · `ConsentScope` inchangé.
Nouveaux enums : `NeighborhoodStatus`, `VenueStatus`, `OutingStatus`, `OutingCancelReason`, `SeatStatus`, `SeatFunding`, `SeatCancelKind`, `RefundState`, `OutingRequestStatus`, `CheckInMethod`, `CheckInResult`, `VoteChoice (FRIEND, PLUS, NO)`, `DuoStatus`, `DuoOrigin`, `DuoDateStatus (PROPOSED, CONFIRMED, DECLINED, SUPERSEDED, CANCELLED, DONE)`, `BandOrigin`, `GuardianSubjectKind`, `SafetyAlertStatus (OPEN, SAFE, HANDLED)`, `PetMemoryKind`, `CreditKind`, `CreditReason`, `PaymentStatus`, `CompositionRunStatus`.

### 8.2 Nouvelles tables (colonnes clés ; toutes `id uuid v7`, `createdAt timestamptz(3)`)
| Table | Colonnes / contraintes / index |
|---|---|
| `Neighborhood` | slug UNIQUE, name, cityZoneId FK Zone, timezone, status, densityThreshold CHECK > 0, launchedAt |
| `NeighborhoodSlotTemplate` | neighborhoodId, isoWeekday CHECK 1–7, localTime, active ; UNIQUE (neighborhoodId, isoWeekday, localTime) |
| `Venue` | neighborhoodId, name, address…, lat, lng, offerKey, status, accessibilityTags text[], checkinCodeSecretRef (référence secret, pas le secret en clair), staffContact ; INDEX (neighborhoodId, status) |
| `VenueSlot` | venueId, startsAt, capacityOutings, reservedOutings ; UNIQUE (venueId, startsAt) ; CHECK 0 ≤ reserved ≤ capacity |
| `WaitlistEntry` | userId UNIQUE, neighborhoodId, joinedAt, notifiedLaunchAt ; INDEX (neighborhoodId) |
| `OutingRequest` | userId, neighborhoodId, weekKey, slotStartsAt timestamptz[], companionUserId, status, missedWeeks ; UNIQUE (userId, weekKey) ; INDEX (neighborhoodId, weekKey, status) |
| `CompositionRun` | neighborhoodId, weekKey, kind, status, algoVersion, tuningVersion, seed, stats jsonb (agrégats, aucun identifiant de préférence) ; UNIQUE (neighborhoodId, weekKey, kind) |
| `Outing` | neighborhoodId, weekKey, venueSlotId, venueId, startsAt, endsAt, status, capacity CHECK 4–6, acceptDeadline, lockAt, photoRevealAt, checkinOpensAt, checkinClosesAt, votesCloseAt, cancelReason, compositionRunId, tuningVersion, version ; CHECK ordre des instants ; INDEX (status, lockAt), (neighborhoodId, weekKey) |
| `OutingSeat` | outingId, userId, weekKey, status, funding, creditEntryId UNIQUE?, paymentId UNIQUE?, holdExpiresAt, companionSeatId, cancelKind, refundState, refundRef, horodatages ; UNIQUE (outingId, userId) ; **UNIQUE partiel (userId, weekKey) WHERE status IN ('INVITED','HELD','CONFIRMED','CHECKED_IN','ATTENDED','NO_SHOW')** ; CHECK cohérence funding/source ; INDEX (outingId, status), (status, holdExpiresAt) |
| `OutingCheckIn` | seatId UNIQUE (dernier essai accepté) ; `OutingCheckInAttempt(seatId, method, result, accuracyBucket, createdAt)` pour le comptage d'essais — **aucune colonne lat/lng** |
| `OutingVote` | outingId, voterUserId, targetUserId, choice, revealedAt ; UNIQUE (outingId, voterUserId, targetUserId) ; CHECK voter ≠ target ; INDEX (outingId) ; **aucune FK vers une projection, aucune vue SQL l'exposant** |
| `ConnectionReveal` | sourceKind OUTING\|DUO_DATE, sourceId, userLowId, userHighId, result FRIEND\|PLUS, revealedAt, friendshipId?, duoId? ; UNIQUE (sourceKind, sourceId, userLowId, userHighId) ; CHECK low < high |
| `Duo` | userLowId, userHighId, origin, status, exchangeEndsAt, dateDeadline, messagesLow, messagesHigh, datesAttended, conversationId UNIQUE, proposalId UNIQUE?, sourceRevealId?, version ; CHECK low < high ; **UNIQUE partiel (userLowId, userHighId) WHERE status NOT IN ('EXPIRED','CLOSED','LEFT')** ; INDEX (status, exchangeEndsAt), (status, dateDeadline) |
| `DuoDate` | duoId, proposedByUserId, venueId, startsAt, status, checkinLow, checkinHigh, votesCloseAt ; UNIQUE partiel (duoId) WHERE status IN ('PROPOSED','CONFIRMED') |
| `DuoVote` | duoDateId, voterUserId, choice, revealedAt ; UNIQUE (duoDateId, voterUserId) |
| `ReliabilityStat` | userId PK, attended, noShows, lateCancels, pausedUntil, pauseEpisode, updatedAt ; CHECK ≥ 0 |
| `AttendanceDispute` | seatId\|duoDateId, userId, note (privée), status OPEN\|ACCEPTED\|REJECTED, resolvedById ; UNIQUE (seatId) |
| `GuardianLink` | ownerUserId, subjectKind, subjectId, tokenHash UNIQUE, label, activeFrom, expiresAt, revokedAt, lastViewedAt, viewCount ; CHECK expiresAt − activeFrom ≤ interval '18 hours' ; INDEX (subjectKind, subjectId) |
| `GuardianPushSubscription` | guardianLinkId UNIQUE, endpoint, keys (chiffrés), createdAt, purgeAfter |
| `SafetyAlert` | userId, subjectKind, subjectId, status, lat?, lng?, accuracyM?, positionPurgeAfter, moderationCaseId, createdAt, resolvedAt ; INDEX (status, createdAt) |
| `SafetyOkSignal` | userId, subjectKind, subjectId, createdAt (chronologie du gardien) |
| `PetMemory` | petId, kind, refType, refId, dedupKey UNIQUE, data jsonb ; INDEX (petId, createdAt desc, id desc) |
| `PetAccessory` | petId, accessoryId (clé `@blowy/content`), source, unlockedAt, equipped bool ; UNIQUE (petId, accessoryId) |
| `OutingCreditEntry` | userId, delta CHECK (delta IN (−1, 1)), kind, reason, expiresAt, sourceRef, idempotencyKey UNIQUE, reversesEntryId UNIQUE ; trigger append-only (même fonction que `LedgerEntry`) |
| `OutingCreditLot` | userId, kind, expiresAt, remaining CHECK ≥ 0, version ; INDEX (userId, kind, expiresAt) |
| `Payment` | userId, provider, environment, providerPaymentId, purpose, seatId UNIQUE, amountCents CHECK > 0, currency, status, refundProviderId UNIQUE?, horodatages ; UNIQUE (provider, environment, providerPaymentId) |

### 8.3 Colonnes ajoutées
`User.neighborhoodId` (FK, SetNull, INDEX) · `MatchPreferences.seeksFriends bool default true, seeksRomance bool default false, meetGenders Gender[] default '{}', romanceGenders Gender[] default '{}', duoLaneEnabled bool default false` (+ CHECK `seeksFriends OR seeksRomance`, CHECK `NOT seeksRomance OR cardinality(romanceGenders) > 0`) · `PrivacySettings.discreetMode bool default false` · `Conversation.outingId, duoId, friendshipId` (UUID nullable UNIQUE chacun, CHECK au plus un de `contextId, groupId, outingId, duoId, friendshipId`) · `Friendship.origin, sourceOutingId, sourceDuoId, endedReason` · `MatchProposal.duoId UNIQUE?` · `PetState.engineStateV5 jsonb` · `Report.outingId?, duoId?` (contexte de signalement V5) · `ReferralLink.kind default 'GENERIC'` (+ `OUTING_PLUS_ONE`).

### 8.4 Devient mort (conservé, plus écrit, jamais supprimé dans cette version)
`PetState` jauges/`starvedMs`, `PetCareEvent`, `VirtualLocation`, `PetPair`/`RelationshipContext`/`RelationshipSide` pour `DATE`/`NEIGHBORHOOD`/`GROUP` (lecture seule historique), `ConsentSession` MOVE_IN/BRANCH_VOTE/PHOTO_*, `BranchRound`, `BranchBallot`, `RelationshipEvent` (append-only, gardé), `Memory` (relationnelle V4), `ContributionEvent`, `RelationshipDailyCounter`, `MissionDefinition`, `DailyMission`, `MissionSubmission`, `MissionParticipant`, `MissionRewardContext`, `MissionAward`, `MissionProofAssessment`, `Group`, `GroupMember`, `GroupPairState`, `Streak`, `StreakFreeze`, `LeagueSeason`, `LeagueMembership`, `LeagueScore`, `LeagueReward`, `MonthlyBenefitGrant` (pièces+gels), `CatalogItem` `STREAK_FREEZE`/`VISIBILITY_BOOST`/`RARE_EGG_COSMETIC` (`active=false` par migration de données), `InventoryItem` (historique), `Wallet`/`LedgerEntry` (gelés), `StoreProduct` `CONSUMABLE_COINS`, `EntitlementGrant` `DERIVED_PARTNER` (révoqués par job), `SafetyDate`, `GuardianInvitation`, `LocationShare`, `SafetyLocationPoint`, `SafetyCheckIn` (remplacés par §2.8–2.9), `User.reliability`, `MatchPreferences.intention`/`seekingGenders`/`maxDistanceKm`/`areaCell*`/`widenConsented`, `PrivacySettings.mapVisible`/`photoPreference`. Suppression physique = décision ultérieure, après export d'archive et zéro lecture applicative.
Données existantes : aucune production lancée (seed fictif) → script de données : relations V4 du seed fermées `ENDED` (sans message), intentions mappées (§2.15), seed V5 réécrit par C (Paris 11e `LIVE` avec 3 lieux, Lyon Croix-Rousse `WAITLIST`, ~30 personnes fictives `isFictional=true` couvrant genres/préférences/+1).

### 8.5 Rétention RGPD (ajouts à `docs/privacy/retention.md`, à faire par E)
| Donnée | Durée | Purge |
|---|---|---|
| Position de check-in | **jamais stockée** | — (test : aucune colonne, aucun log) |
| Position jointe à une alerte | 72 h (`positionPurgeAfter`) | sauf dossier SAFETY ouvert → clôture du dossier |
| Bulletins de vote (`OutingVote`, `DuoVote`) | 7 j après clôture | `outings.purge` ; résultats mutuels gardés (lien/duo) |
| Chat de groupe (corps) | lecture 7 j après clôture, purge 90 j après clôture | sauf message signalé (dossier) |
| Chats bande/duo | vie du lien + compte (règle messages existante) | à `band.leave`/`duos.leave` : fermeture, purge 90 j |
| `GuardianLink` | métadonnées 30 j après expiration ; jeton haché uniquement | push gardien purgé à expiration + 24 h |
| `OutingRequest`, `CompositionRun.stats` | 13 mois | agrégats seulement |
| Places / présences (`OutingSeat`, `ReliabilityStat`) | vie du compte (exclusion « déjà vus », fiabilité) | à la suppression : places pseudonymisées (userId conservé pour l'unicité « déjà vus » des autres, sans profil) |
| Paiements | durée comptable (10 ans, Code de commerce L123-22 — à valider juridiquement), pseudonymisés | exception justifiée |
| `romanceGenders`, `seeks*`, `meetGenders` | vie du compte, consentement explicite | effacés au retrait du consentement / à la suppression |
| Contestations d'absence (note) | 1 an après résolution | |
Export RGPD (art. 15) : inclut ses propres demandes, places, présences, bulletins non purgés, liens, duos, souvenirs, liens gardien (sans jeton), paiements.

---

## 9. Notifications V5

### 9.1 Liste
| Clé (`templateKey`) | Catégorie | Quand | Destinataire | Notes |
|---|---|---|---|---|
| `outing.request_open` | OUTING | ouverture du cycle (lundi 9 h) | quartier LIVE, non en pause | désactivable ; 1/semaine |
| `outing.request_last_call` | OUTING | 3 h avant `requestClosesAt` | sans demande, ayant fait ≥ 1 sortie | 1/semaine, désactivable |
| `outing.invited` | OUTING | composition / backfill | invité·e | « Ton pet t'a trouvé une bande pour jeudi » |
| `outing.invite_reminder` | OUTING | `acceptDeadline − 4 h` | invité·e non répondu | une fois, sans compte à rebours ni urgence |
| `outing.unplaced` | OUTING | fin de composition | `UNPLACED` | « Pas de sortie cette semaine, tu es prioritaire la prochaine » |
| `outing.formed` | OUTING | `FORMING` | confirmés | chat ouvert |
| `outing.venue_revealed` | OUTING | `lockAt` (J-1) | confirmés | = rappel J-1 |
| `outing.today` | OUTING | `photoRevealAt` | confirmés | « C'est aujourd'hui, les visages sont révélés » |
| `outing.checkin_open` | OUTING | `checkinOpensAt` | confirmés | transactionnel |
| `outing.cancelled` / `outing.composition_changed` | OUTING | annulation / retrait système | concernés | avec mode de remboursement |
| `outing.refund_done` | OUTING | remboursement effectué | concerné | transactionnel |
| `votes.opened` | VOTE | `DONE` | présents | |
| `votes.reminder` | VOTE | `votesCloseAt − 12 h` | présents ayant des cibles sans bulletin | **ne dit pas** qui a voté |
| `connection.friend` / `connection.plus` | CONNECTION | palier de révélation | les deux | regroupées par palier |
| `votes.closed` | VOTE | `votesCloseAt` | présents | récapitulatif de ses accords ou texte neutre identique |
| `duo.proposal` | DUO | lot quotidien | voie Duo active | ≤ 1/jour |
| `duo.matched` / `duo.unlocked` | DUO | 2ᵉ accord / déblocage | les deux | |
| `duo.exchange_ending` | DUO | `exchangeEndsAt − 12 h` | côté sous le seuil | sans révéler l'autre côté |
| `duo.date_proposed` / `duo.date_confirmed` / `duo.date_reminder` (J-1) / `duo.checkin_open` | DUO | | | |
| `duo.deadline_soon` | DUO | `dateDeadline − 24 h` (LANE) | les deux | |
| `duo.after_vote` / `duo.closed` | DUO | | les deux | texte neutre identique |
| `message.human` | HUMAN_MESSAGE | message publié (groupe, bande, duo) | membres | regroupés par conversation (existant) |
| `reliability.paused` | RELIABILITY | 2ᵉ absence | concerné | ton non culpabilisant, date de fin |
| `safety.alert_sent` | SAFETY | alerte | auteur | jamais supprimée |
| `neighborhood.launched` | SYSTEM | quartier LIVE | liste d'attente | 1 fois |
| `pet.memory` | — | souvenir | — | **in-app seulement**, pas de push |
| Retirées | STREAK, REAL_WAIT, NEIGHBORHOOD, MISSION, MATCH (lot V4) | | | plus émises |

### 9.2 Rythme
`[T] notifications.v5` : `maxPerDay` 3 (hors SAFETY et transactionnels de la sortie du jour : `outing.checkin_open`, `outing.cancelled`, `outing.refund_done`, `duo.checkin_open`), `outingDayMax` 4 tout compris, heures calmes 23 h–8 h locales (sauf SAFETY ; les rappels tombant dedans sont avancés à 22 h 30 ou reportés à 8 h), regroupement `(conversation | outing, catégorie)`, priorité `SAFETY > OUTING(transactionnel) > HUMAN_MESSAGE > CONNECTION > VOTE > DUO > OUTING(marketing) > SYSTEM`. Aucune notification n'est émise en mode pause de fiabilité sauf transactionnelles. Pas de notification « quelqu'un a voté », « X a vu ton profil », ni d'urgence commerciale.

### 9.3 Mode discret
`PrivacySettings.discreetMode = true` : icône alternative (expo alternate icons, propriétaire D) ; push avec titre « Rappel » et corps neutre (« Tu as du nouveau »), sans prénom, pet, lieu, ni mot « sortie »/« duo » ; contenu de la notification masqué sur l'écran verrouillé ; page ange gardien inchangée (le proche n'est pas concerné). Le planificateur choisit la variante `<key>.discreet` dans `@blowy/content` ; test : aucune variante discrète ne contient de variable autre que l'heure.

---

## 10. Admin (réutilise `apps/admin` + `/v1/admin`)

Nouveau rôle `ops` (opérations terrain). Toute mutation : CSRF + audit ; marquées (SU) = step-up TOTP.
| Section | UI | API | Rôles | Contenu |
|---|---|---|---|---|
| Quartiers | `/neighborhoods`, `/neighborhoods/:id` | `GET/POST/PUT neighborhoods`, `POST :id/launch` (SU si sous le seuil), `pause`, `close` (SU) | ops, admin (lecture analyst) | statut, seuil, densité réelle (vérifiés en attente, répartition **agrégée** genres/âge, jamais individuelle), créneaux types |
| Lieux | `/venues`, `/venues/:id` | CRUD, `slots`, `pause`, `rotate-checkin-secret` | ops, admin | capacité, créneaux, offre, contact, historique d'annulations, export présences mensuel (facturation lieu) |
| Sorties | `/outings?week&neighborhood&status`, `/outings/:id` | `GET outings`, `GET :id` (lecture auditée), `POST :id/cancel {reason}` (SU), `POST :id/seats/:seatId/remove {reason}` (SU), `POST compositions/:neighborhoodId/:weekKey/rerun` (SU, seulement si aucune invitation acceptée) | ops (support lecture) | effectif, statuts de places (pas le financement sauf finance), check-ins, chronologie ; rapport de composition (placés/non placés par motif **codé**, score moyen) ; **jamais** les votes ni les préférences |
| Présences et litiges | `/attendance` | `GET disputes`, `POST disputes/:id/resolve {accept, note}` (SU), `POST seats/:id/attendance {attended}` (SU) | support, ops, trust_lead | contestations d'absence, corrections → `ReliabilityEvent STAFF_CORRECTION`, rejeu projection, souvenir |
| Paiements | `/economy` (étendu) | `GET payments?user`, `POST payments/:id/refund` (SU), `POST users/:id/outing-credits {kind, reason}` (SU), files d'échecs de remboursement, redrive webhooks Stripe | finance | places payées, remboursements, crédits, Blowy+ ; jamais le chat |
| Sécurité | `/safety` | `GET alerts?status`, `POST alerts/:id/handle {note}` | trust_lead | file temps réel, position jointe (si fournie, purge visible), lien vers le dossier, SLA d'accusé |
| Modération | `/moderation` (existant) | + contexte `OUTING`/`DUO`/`BAND` | moderator, trust_lead | extrait du chat signalé seulement |
| Tuning | `/tuning` (existant) | sections V5 validées par `TuningSchema` ; `simulate` → `simulate:outings` | admin (publication), lecture analyst | |
| Dashboard | `/` (existant) | indicateurs V5 : demandes/semaine, taux de placement, taux de confirmation, présence, absences, % accords mutuels (agrégé ≥ 20 sorties), remboursements, NPS lieu (si instrumenté, sinon `NOT_INSTRUMENTED`) | analyst | |
Pages V4 retirées du menu (lecture conservée) : missions, social/ligues, relations (réparation de niveau).

---

## 11. Découpage en tranches

### 11.1 Ownership V5 (complète `AGENTS.md`)
| Ressource | Propriétaire |
|---|---|
| `packages/domain/src/{outing,connection,safety}.ts`, `api-contract/src/core/**` (rooms, events, `GONE`) | A (orchestrateur) |
| `packages/matching/src/groups/**`, refactor filtres nommés, `packages/tuning` (sections V5), `packages/pet-engine/src/v5/**`, `packages/content` (brise-glace, accessoires, notifications V5 + variantes discrètes), `docs/engine-rules.md` §12–13 | B |
| `packages/database/prisma/**` (2 migrations V5 + seed V5), `apps/api/src/modules/{neighborhoods,outings}/**`, `conversations` (types OUTING/DUO/BAND), `pets` (V5 gateway, souvenirs, accessoires), `users` (préférences V5), `shared/infrastructure/engine/**`, `api-contract/src/{neighborhoods,outings}.ts`, `api-client` | C |
| `apps/api/src/modules/connections/**` (bande, duos, branche DUO_LANE de `matching`), `api-contract/src/connections.ts` | C2 (nouvel agent backend « liens ») — `matching` reste à C : C2 livre la branche DUO_LANE par une demande à C ou par délégation explicite |
| `apps/api/src/modules/economy/**` (paiements Stripe, crédits, Blowy+ V5, remboursements), `notifications` (planificateur V5), `api-contract/src/{payments,economy}.ts`, `apps/mobile/src/features/purchases/**` | G |
| `apps/api/src/modules/safety/**` (nouveau), `trust` (blocage → retrait système, signalements V5), `media` (ACL `OUTING_REVEAL`/`DUO_UNLOCKED`/`BAND`, photo obligatoire), `api-contract/src/safety.ts`, `docs/privacy/*` | E |
| `apps/admin/**`, `apps/api/src/modules/admin/**`, `apps/web` (page gardien `/g/[token]`, invitation +1) | F |
| `apps/mobile/**`, `packages/ui-mobile`, `packages/sprites` (d'après `design/v5`, propriété du designer) | D |
| `apps/api/test/journeys/**`, `docs/qa/**` | H (QA) — personne d'autre n'y écrit |

### 11.2 Ordre et dépendances
```
T0 (A) contrats domaine/core ─┬─► T1 (B) composition + tuning + pet v5 + contenus
                              └─► T2 (C) schéma V5 + seed + neighborhoods + outings (sans paiement : crédits FREE_FIRST/LOCAL_DEMO)
T1 + T2 ─► T3 (G) paiements/crédits/remboursements/Blowy+ ─┐
T2 ─────► T4 (E) safety + retrait système + ACL photos ────┼─► T6 (F) admin + page gardien web
T2 ─────► T5 (C2) bande + duos + voie Duo ─────────────────┘
T0 (contrats publiés) ─► T7 (D) mobile, écran par écran, branché au fil de T2–T5
T2..T6 ─► T8 (G) notifications V5   ·   T5 ─► T9 (C2+B) œuf duo (optionnel, en dernier)
```
Règle : chaque propriétaire publie son fichier `api-contract` **le premier jour** de sa tranche (schémas Zod complets, même si l'endpoint renvoie 501) ; D code contre ces schémas, jamais contre une forme inventée. Les échanges inter-modules passent par l'outbox (événements listés §7.6 et ci-dessous) ; aucun module n'écrit les tables d'un autre.
Événements outbox inter-modules : `outing.seat_confirmed`, `outing.seat_cancelled {cancelKind}`, `outing.seat_refund_due`, `outing.attendance_recorded {seatId, userId, attended}`, `outing.done`, `connection.revealed {kind, users, source}` (outings → connections), `band.linked`, `duo.date_done`, `duo.date_attendance_recorded`, `trust.block_created {blockerId, blockedId}` (→ outings, connections, safety), `safety.alert_raised`, `economy.payment_succeeded {seatId}`, `economy.plus_period_started`, `economy.plus_monthly_granted`, `user.account_deleted` (existant).

### 11.3 Tranches, livrables et parcours multi-utilisateurs à tester
Parcours = fichiers `*.journey.ts` à écrire **par H** dans `apps/api/test/journeys/` (style des histoires existantes : chaque étape vérifie ce que voit chacun en HTTP + WS). Les noms ci-dessous sont des propositions ; les parcours V4 existants deviennent obsolètes et sont à réécrire par H.

| Tranche | Livrables | Parcours (multi-utilisateurs) |
|---|---|---|
| **T0** A | types domaine V5, `core` (rooms, events, `GONE`), décisions | — (tests de schéma Zod) |
| **T1** B | `composeOutings`, `backfillCandidate`, filtres nommés, tuning V5 (`outings`, `composition`, `duo`, `votes`, `reliability` V5, `memories`, `accessories`, `pricing`, `plus`, `credits`, `safety`, `neighborhoods`, `notifications.v5`), `reduceV5`, contenus, `simulate:outings` | tests de propriétés §4.7 ; simulateur documenté |
| **T2** C | migrations, seed V5, `neighborhoods`, `outings` (demande, composition, invitations, crédits `FREE_FIRST` via port, cycle de vie, chat de groupe, check-in, votes, révélation, fiabilité, souvenirs), `pets` V5, 410 V4 | **J1 `camille-attend-son-quartier`** (Lyon non lancé : progression vraie, aucune position individuelle, lancement staff → notification, demande ouverte) · **J2 `six-inconnus-un-jeudi`** (8 personnes Paris 11e : composition, projections PROPOSED sans prénom/photo/lieu, acceptations, FORMING + chat + brise-glace, J-1 lieu révélé aux seuls confirmés, 9 h photos simultanées, check-in GEO et code, DONE, votes : FRIEND/FRIEND → bande, PLUS/PLUS → duo, PLUS/FRIEND → bande, PLUS/NO → rien des deux côtés, NO jamais visible ; WS sans fuite, curseurs sans trou) · **J3 `trois-sur-six-annulee`** (sous-effectif au verrouillage → CANCELLED, recrédits, priorité semaine suivante) · **J4 `victor-oublie-deux-fois`** (2 absences → pause 7 j, « venu à 1 sur 3 », demande refusée `RELIABILITY_PAUSED`, contestation, correction staff) · **J5 `course-a-la-derniere-place`** (backfill concurrent, double tap `accept` idempotent, annulation pendant le job de verrouillage, quota 1/semaine sous concurrence) · **J6 `alex-vient-avec-son-ami`** (+1 composé ensemble, pas de vote entre eux, BandLink PLUS_ONE après présence) |
| **T3** G | `PaymentProvider` Stripe + LOCAL_DEMO, webhook Stripe, crédits, `grant-plus-period`, remboursements §6.4, produits V5, retrait boost/gel/pièces | **J7 `ines-paie-sa-place`** (hold 15 min, paiement démo, webhook rejoué ×3 → une confirmation ; paiement après expiration → remboursement auto ; annulation ≥ 24 h → crédit 90 j ; < 24 h → rien) · **J8 `sarah-prend-blowy-plus`** (2 crédits inclus, quota hebdo inchangé, aucun effet sur composition/priorité, expiration sans report, remboursement d'abonnement → crédits contre-passés, routes boost/gel 410) |
| **T4** E | module `safety`, page gardien API, alertes → dossier SAFETY, `trust.block_created` → retrait système, ACL photos V5, photo obligatoire, rétention | **J9 `nora-se-protege-en-sortie`** (Nora bloque+signale Victor en FORMING : Victor retiré avec message neutre et remboursé, Nora inchangée, groupe voit « ne pourra pas venir », jamais recomposés ensemble, Victor ne voit plus rien de Nora) · **J10 `lea-et-son-ange-gardien`** (lien créé, proche sans compte : avant J-1 pas de lieu, après lock lieu, check-in, « tout va bien », alerte + position optionnelle, trust_lead voit l'alerte, révocation et expiration → 404 identique, jamais d'autres participants) |
| **T5** C2 | `connections` : bande, `band.leave`, duos (états §2.12), voie Duo via `matching` (DUO_LANE, ≤ 3), RDV duo, votes duo | **J11 `yanis-prend-la-voie-duo`** (3 propositions max, 48 h, déblocage photos+voix seulement si les deux ont échangé, RDV avant J+7, check-in, vote PLUS/PLUS → TOGETHER) · **J12 `duo-qui-s-arrete`** (vote non mutuel → message neutre identique des deux côtés ; expiration J+7 ; EXCHANGE expiré) · **J13 `hugo-part-proprement`** (quitter la bande et un duo : aucune pénalité, accès révoqué, WS `access.revoked`) |
| **T6** F | sections admin §10, page web `/g/[token]` (sans app, noindex, no-store), invitation +1 web | **J14 `ops-annule-un-jeudi`** (annulation staff step-up → remboursements carte et crédits, notifications ; staff ne voit jamais votes ni préférences ; audit) · e2e Playwright admin (H/F) |
| **T7** D | écrans V5 (`design/v5`) : accueil, sortie de la semaine, fiche de sortie, chat de groupe, check-in, après la sortie, bande, duos, ange gardien, boutique honnête, mode discret | vérif visuelle + persona (boucle `plan-v3.md`) sur J2, J9, J10, J11 |
| **T8** G | planificateur V5, plafonds, mode discret | **J15 `camille-en-mode-discret`** (aucun prénom/lieu/pet dans les push, plafonds et heures calmes, SAFETY passe toujours) |
| **T9** C2+B (optionnel) | œuf duo (≥ 2 RDV vécus), bébé sans exclusivité | **J16 `oeuf-clin-d-oeil`** (non proposable avant 2 RDV, accord des deux, jamais présenté comme récompense) |
| transverse H | **J17 `suppression-en-pleine-semaine`** (suppression avec place CONFIRMED : remboursement carte, « ne viendra pas » pour le groupe, liens gardien révoqués, bulletins purgés, duos fermés) · **J18 `fuite-zero`** (balayage de toutes les projections HTTP/WS de 6 acteurs à chaque état : aucun champ interdit par §3) |

### 11.4 Définition de « tranche terminée »
Build + typecheck + lint ; tests unitaires et d'intégration ×2 sur base fraîche ; `migrate deploy` + seed sur base vierge, diff schéma nul ; parcours de la tranche verts ×2 ; handoff `docs/agents/handoffs/<agent>.md` (fichiers, commandes réelles, décisions, demandes aux autres propriétaires) ; ligne ajoutée par A dans `docs/agents/integration-status.md`.

---

## 12. Questions ouvertes — tranchées

| # | Question | Décision (réf.) |
|---|---|---|
| 1 | Paiement par IAP ou hors IAP ? | Hors IAP (Stripe) pour la place et Blowy+ ; RevenueCat reste l'autorité de droits (D-018) |
| 2 | Remboursement en argent ou en crédit ? | Annulation par Blowy → argent (ou recrédit si payé en crédit) ; annulation perso ≥ 24 h → crédit 90 j ; < 24 h et absence → rien (D-019) |
| 3 | « plus » face à « ami » ? | `min()` : PLUS/FRIEND → bande ; PLUS exige la compatibilité romance réciproque sinon FRIEND (D-015) |
| 4 | Quand révéler les accords ? | Par paliers horaires fixes + clôture, jamais à l'instant du vote (D-015) |
| 5 | Qui quitte la sortie en cas de blocage ? | La personne bloquée, avec message neutre et remboursement (D-025) |
| 6 | Photo obligatoire ? | Oui pour sortie et duo, révélée selon l'ACL ; « jamais » incompatible avec l'IRL (D-026) |
| 7 | Orientation stockée ? | Non ; seuls `romanceGenders` sous consentement explicite (D-014) |
| 8 | Accessoires « non achetables » vs boutique ? | Pas d'achat à l'unité ; souvenirs, parrainage, 1 accessoire/mois Blowy+ (D-020) |
| 9 | Pièces existantes ? | Gelées, lisibles, plus de gains ni dépenses (D-020) |
| 10 | Seuil de lancement d'un quartier ? | 120 vérifiés en attente, surcharge admin, lancement forcé sous step-up (D-030) |
| 11 | La position dans la liste d'attente avance-t-elle en invitant ? | Non : l'invitation fait avancer le quartier (D-030) |
| 12 | Que compte « N sur M » ? | Présences / (présences + absences) ; annulations tardives exclues (D-022) |
| 13 | Le chat de groupe survit-il ? | Fermé à la clôture des votes ; la suite passe par la bande et les duos (D-016) |
| 14 | Les duos issus d'un vote expirent-ils à J+7 ? | Non, seule la voie Duo a les horloges 48 h / J+7 (D-017) |
| 15 | Parrainage ? | Plus de pièces : accessoire unique quand le filleul vit sa 1ʳᵉ sortie (D-031) |
| 16 | Moteur V4 supprimé ? | Non : déprécié, isolé dans `v4`, plus appelé (D-021) |
| 17 | Suivi de position continu pour l'ange gardien ? | Non : chronologie + position seulement si jointe à une alerte (D-024) |
| 18 | Taille minimale si des gens se désistent après le verrouillage ? | La sortie tient à 3, annulée en dessous (D-012) |
