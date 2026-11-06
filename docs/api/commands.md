# Commandes acteur — API /v1 (agent C)

Règles communes à **toutes** les commandes (implémentées une fois dans `shared/application/command-bus.ts`) :
- **Acteur** : issu de la session (`Authorization: Bearer <jeton opaque>`), jamais du JSON.
- **Idempotence** : en-tête `Idempotency-Key` (UUID) obligatoire. Unicité `(actorId, operation, commandId)` (`CommandRecord`). Même clé + même payload → résultat rejoué ; même clé + payload différent → `409 IDEMPOTENCY_CONFLICT` ; clé en cours → `409 CONFLICT retryable`.
- **Transaction** : une transaction PostgreSQL (READ COMMITTED) ; verrous `SELECT … FOR NO KEY UPDATE` dans l'ordre users → pets → relations → wallets (compatibles avec le `FOR KEY SHARE` des INSERT à clé étrangère) ; `lock_timeout` 4 s ; retry borné (4) sur deadlock/sérialisation ; contention persistante → `409 CONFLICT {reason: CONTENTION}` retryable (jamais 500). Aucun appel réseau sous verrou.
- **Événements** : journal (`RelationshipEvent` / `PetCareEvent`) + `OutboxEvent` dans la même transaction ; diffusion via projection par destinataire.
- **Erreurs** : `{code,message,detailsSafe,requestId,retryable}`. Codes communs : `UNAUTHENTICATED 401`, `VALIDATION_FAILED 400`, `NOT_FOUND 404` (aussi pour un objet d'autrui — anti-IDOR), `RATE_LIMITED 429`.

| Opération (`operation`) | Route | Permissions | Préconditions | Effets | Événements outbox | Échecs spécifiques |
|---|---|---|---|---|---|---|
| `auth.sign_in` (hors bus, pas d'Idempotency-Key) | `POST /v1/auth/sessions` (public) | — | preuve fournisseur valide (Firebase ID token vérifié, ou clé locale hors prod) | crée User+AuthIdentity si inconnu (pas de fusion sur email), DeviceSession (empreinte HMAC) | `auth.session_opened` | 401 jeton invalide, 403 compte suspendu/banni, 501 fournisseur non configuré |
| `auth.revoke_session` | `DELETE /v1/auth/sessions/current` · `/:id` | propriétaire | session active | `revokedAt` ; sockets WS de CETTE session fermées (`access.revoked` + disconnect) | `auth.session_revoked`, `realtime.disconnect {sessionIds}` | 404 |
| `me.update_profile` | `PATCH /v1/me` | soi | birthDate modifiable avant onboarding ; âge ≥ 18 calculé serveur (timezone) ; zone active ; timezone IANA | profil, date de naissance, zone | — | 403 `AGE_RESTRICTED`, 412 `BIRTHDATE_LOCKED`, 400 |
| `me.update_preferences` | `PUT /v1/preferences/matching` | soi | ageMin ≤ ageMax, 18+ | MatchPreferences (remplacement complet) | `user.preferences_changed` | 400 |
| `me.update_privacy` | `PUT /v1/preferences/privacy` | soi | — | PrivacySettings (photo FROM_LEVEL_4_WITH_CONSENT / NEVER) | `user.privacy_changed` | 400 |
| `me.record_consents` | `POST /v1/consents` | soi | accord seulement sur la version courante | ProcessingConsent append-only | `user.consent_withdrawn` (retrait) | 412 `CONSENT_VERSION_OUTDATED` |
| `me.start_pause` | `POST /v1/pauses` | soi ; participant si relationId | ≤ 14 j cumulés par trimestre ; pas de pause active sur la même cible | PausePeriod | `user.pause_started`, `user.pause_due` (différé à l'échéance) | 409 `PAUSE_ALREADY_ACTIVE`, 412 `PAUSE_QUOTA_EXCEEDED` |
| `me.end_pause` | `DELETE /v1/pauses/:id` | propriétaire | pause ouverte | `endedAt` | `user.pause_ended` | 404 |
| `me.start_verification` | `POST /v1/verifications` | soi | fournisseur configuré | VerificationSession (LOCAL_DEMO en local : badge distinct) | `user.verification_changed` | 501 `NOT_CONFIGURED` |
| `me.complete_onboarding` | `POST /v1/me/onboarding/complete` | soi | birthDate, pet principal, préférences, zone, consentements sociaux | `onboardedAt` | `user.onboarded` | 412 `ONBOARDING_INCOMPLETE {missing}` |
| `pets.create_primary` | `POST /v1/pets` | soi | aucun pet principal (unique DB) ; espèce premium ⇒ droit `PLUS_PREMIUM_SPECIES` (port EntitlementsReader) | Pet+Vision+State initial (moteur)+Location HOME, graine serveur | `pet.created` | 409 `PRIMARY_PET_EXISTS`, 402 `ENTITLEMENT_REQUIRED {fallback}` |
| `pets.action` | `POST /v1/pets/:id/actions` | propriétaire (et participant de la relation pour PLAY/HUG/CALL) | FEED/HEAL : toujours (soins vitaux jamais refusés) ; PLAY/HUG : même lieu des deux pets, précondition moteur (HUG ≥ N2 et complicité) ; CALL : graine serveur, jamais deux refus consécutifs | avance paresseuse du temps, effets moteur, XP Lien plafonnée (compteurs journaliers), contribution k, PetCareEvent | `pet.updated` (+ `relationship.updated` si niveau) | 404, 412 `NOT_SAME_PLACE` / `ACTION_NOT_AVAILABLE` ; `outcome=NO_GAIN` si plafond/pause |
| `pets.move` | `POST /v1/pets/:id/move` | propriétaire ; participant de la relation | lieu unique ; après emménagement `SHARED_HOME` (pas de retour HOME) ; lire une conversation ne déplace jamais | VirtualLocation (dédupliqué) | `pet.moved` | 404, 412 `LIVES_IN_SHARED_HOME` |
| `matching.accept_proposal` | `POST /v1/match-proposals/:id/accept` | participant de la proposition | OPEN et non expirée ; pas de blocage ; vérification valide ; capacité (slots du droit actuel, hors LEGACY) et pas d'exclusivité — **revalidés sous verrou à la seconde acceptation** | MatchAcceptance ; au 2e accord : PetPair canonique, RelationshipContext DATE, sides, Conversation + message système `system.match.created` ; **les pets ne bougent pas** | `match.created` (projeté dans `user:<id>` des deux : `{relationshipId, conversationId}`) | 412 `PROPOSAL_NOT_OPEN`, 409 `CAPACITY_EXCEEDED {reason}`, 404 (bloqué) |
| `relationships.leave` | `POST /v1/relationships/:id/leave` | participant actif | non terminée | ENDED, message système pré-écrit `system.leave.clean` (jamais en sécurité), côtés inactifs, dette de réponse annulée, pets ramenés HOME, membres de conversation révoqués | `relationship.ended` (projeté dans `user:<id>` de chacun), `realtime.revoke` | 412 `ALREADY_ENDED` |
| `me.start_pause` (alias) | `POST /v1/relationships/:id/pause` | participant | idem pause | pause par relation : XP/relances/pénalités suspendues | idem | idem |
| `relationships.move_in.propose` | `POST /v1/relationships/:id/move-in` | participant | DATE ACTIVE/PAUSED, niveau atteint ≥ 3, aucun des deux exclusif ailleurs, aucune offre ouverte | ConsentSession MOVE_IN version n+1 (TTL 72 h), réponse ACCEPT du proposant | `relationship.updated` | 412 `LEVEL_TOO_LOW` / `EXCLUSIVE_ELSEWHERE`, 409 `OFFER_ALREADY_OPEN` |
| `relationships.offer.respond` | `POST /v1/relationships/:id/consents/respond` | participant | offre OPEN, **même version** ; second accord : verrous de tout le voisinage DATE des deux personnes ; revalidation exclusivité | MOVED_IN, exclusivité (index unique partiel), pets → SHARED_HOME, clôture des autres rendez-vous des deux (`system.leave.moved_in_elsewhere`), ouverture ronde de vote | `relationship.moved_in`, `relationship.ended` (autres), `relationship.updated` | 412 `OFFER_VERSION_CHANGED` / `EXCLUSIVE_ELSEWHERE` (perdant d'une course : état recalculé), 409 `ALREADY_RESPONDED` |
| `relationships.branch.cast` | `POST /v1/relationships/:id/branch/ballot` | participant | ronde OPEN non échue ; un vote par personne | BranchBallot (table séparée). **Aucun événement visible** tant que non résolu. Résolution dès deux votes : PLUS seulement si les deux ; publication de la seule branche | `relationship.updated {change: branch_resolved}` (à la résolution seulement) | 412 `NO_OPEN_ROUND`, 409 `ALREADY_VOTED` |
| `relationships.branch.downgrade` | `POST /v1/relationships/:id/branch/downgrade` | participant | branche PLUS | FRIEND immédiat | `relationship.updated` | 412 `NOT_PLUS` |
| `conversations.send_message` | `POST /v1/conversations/:id/messages` | membre non révoqué | conversation ouverte ; pas de blocage ; consentements sociaux (AI_MODERATION) ; ≤ 20 msg/min ; `clientMessageId` dédupliqué | Message PENDING_MODERATION + MessageContent séparé ; **rien chez le destinataire** | `message.submitted` → effet modération (worker) | 403 `BLOCKED` / `CONSENT_REQUIRED`, 412 `CONVERSATION_CLOSED`, 409 `IDEMPOTENCY_CONFLICT {reason: CLIENT_MESSAGE_ID_REUSED}` (même clientMessageId, autre conversation/texte/média), 429 |
| (worker) moderation | effet `message.submitted` | système | message encore PENDING ; relation ouverte et auteur non révoqué au moment de l'application | ModerationDecision ; PUBLISHED / WARNED / QUARANTINED / REJECTED / HUMAN_REVIEW / PROCESSING_FAILED (panne ≠ approbation) ; séquence visible attribuée à la publication ; aller-retour XP via moteur (PUBLISHED seulement) | projection `message.published` / `message.warned` (destinataires), `message.status` (auteur seul) | — |
| `conversations.reveal_warned` | `POST /v1/messages/:id/reveal` | destinataire membre | message WARNED | MessageReceipt.revealedAt ; corps délivré ; **aucun XP** | — | 404, 412 `NOT_WARNED` |
| `conversations.mark_read` | `POST /v1/conversations/:id/read` | membre | — | lastReadSeq | — | 404 |

## Jobs (worker, clé métier d'unicité)
| Job | Cadence | Clé | Effet |
|---|---|---|---|
| `pets.tick` | 15 min | `pets.tick:<quart d'heure>` | avance les pets actifs < 7 j ; inactifs rattrapés à la lecture |
| `matching.daily` | 15 min | `MatchBatch(zone, date locale, DAILY)` unique | lot 21 h locale par zone |
| `matching.expire` | 15 min | — | propositions > 48 h → EXPIRED (sans notification de rejet) |
| `relationships.reliability` | 1 h | `…:<heure>` ; `ReliabilityEvent(user, reason, episode)` unique | −8 une fois par épisode après 72 h ; clôture silence 14 j |
| `relationships.branch_deadlines` | 15 min | ronde RESOLVED | échéance commune → Ami si deux PLUS non réunis |
| `economy.*` (agent G) | voir module economy | — | — |

## V5 (T2) — quartiers, sorties, teams (agent C, 2026-11-06 ; concept-v5.2 intégré)
Ordre des verrous étendu : users → pets → relationships → neighborhoods → teams → outings → friendships → duos → wallets (`packages/database/src/tx.ts`).

| Opération | Route | Effets / événements | Échecs spécifiques |
|---|---|---|---|
| (requête) | `GET /v1/neighborhoods?q=` | LIVE + WAITLIST | — |
| `me.set_neighborhood` | `PUT /v1/me/neighborhood` | quartier, liste d'attente (si non LIVE), quartiers acceptables | 412 `NEIGHBORHOOD_CHANGE_TOO_SOON {availableAt}`, `ACTIVE_SEAT_EXISTS`, `NEIGHBORHOOD_CLOSED` |
| (requête) | `GET /v1/me/neighborhood` | `waitlist {verifiedCount, nextOutingGap{missing,startsAt}}` (V5.2) | — |
| `me.update_intentions` | `PUT/GET /v1/preferences/intentions` | intentions secrètes (lecture : soi seul) | 403 `CONSENT_REQUIRED {purpose: SENSITIVE_PREFERENCES}` |
| `me.update_outing_preferences` | `PUT/GET /v1/preferences/outings` | âges, créneaux, semaines off, activités, quartiers | 412 `NEIGHBORHOOD_NOT_FOUND`, `SLOT_TEMPLATE_NOT_FOUND` |
| (requête) | `GET /v1/outings/week` | semaine pertinente (place à venir, sinon fenêtre ouverte, sinon suivante) | — |
| `outings.request` / `withdraw_request` | `PUT/DELETE /v1/outings/requests/:weekKey` | demande (team auto) | 412 `NEIGHBORHOOD_NOT_LIVE` (pause/fermé seulement, V5.2), `VERIFICATION_REQUIRED`, `PHOTO_REQUIRED`, `RELIABILITY_PAUSED`, `REQUEST_WINDOW_CLOSED`, `WEEK_OFF`, `ONBOARDING_INCOMPLETE`, `ALREADY_PLACED` ; 409 `WEEKLY_QUOTA_USED` |
| (requête) | `GET /v1/outings/:id` | `OutingView` projeté par acteur (§3.1 + V5.1/V5.2) | 404 |
| `outings.seat.accept` | `POST /v1/outings/:id/seat/accept` | FREE_FIRST → PLUS_INCLUDED → LOCAL_DEMO (hors prod) ; FORMING + chat à 4 ; `outing.seat_updated`, `outing.updated` | 412 `SEAT_NOT_INVITED`, `OUTING_NOT_OPEN`, `INVITATION_EXPIRED`, `PHOTO_REQUIRED`… ; 503 `PROVIDER_UNAVAILABLE` |
| `outings.seat.decline` / `cancel` (+ `GET …/cancel-preview`) | `POST /v1/outings/:id/seat/{decline,cancel}` | avant les visages : recrédit ; après : absence (V5.2 C.8) ; sécurité : remboursée | 412 `SEAT_NOT_ACTIVE`, `OUTING_STARTED` |
| `outings.seat.knows_someone` | `POST /v1/outings/:id/seat/knows-someone {userId}` | lien connu → `MOVED` sans pénalité ; sinon `IN_REVIEW` ; 2ᵉ fois / 30 j → `COUNTED_AS_CANCEL` | 412 `KNOWS_SOMEONE_NOT_AVAILABLE` |
| `outings.check_in` | `POST /v1/outings/:id/check-in` | position jamais stockée ; `outing.checkin_updated` | 412 `CHECKIN_NOT_OPEN`, `CHECKIN_TOO_FAR`, `CHECKIN_LOW_ACCURACY`, `CHECKIN_CODE_INVALID {attemptsLeft}` ; 429 |
| `outings.vote.submit` | `PUT /v1/outings/:id/votes {choices}` | bulletins (aucun événement) | 404, 412 `VOTE_WINDOW_CLOSED`, `VOTE_TARGET_NOT_ATTENDEE` |
| `attendance.dispute` | `POST /v1/outings/:id/attendance/dispute` | contestation | 412 `NOT_NO_SHOW`, `DISPUTE_WINDOW_CLOSED` ; 409 `DISPUTE_EXISTS` |
| `teams.create` / `join` / `leave` | `POST /v1/teams`, `/v1/teams/join`, `/v1/teams/:id/leave` ; `GET /v1/teams/mine` | team 1–3, lien d'invitation | 409 `ALREADY_IN_TEAM`, `TEAM_FULL` ; 412 `TEAM_INVITE_INVALID`, `NOT_SAME_CITY`, `TEAM_LOCKED_IN_OUTING` |
| (requêtes) | `GET /v1/outings/:id/votes`, `/v1/outings/history`, `/v1/me/reliability`, `/v1/band` | projections du lecteur | 404 |

Jobs V5 : `outings.compose` (5 min, `CompositionRun(zone, weekKey, WEEKLY)` unique), `outings.seeding` (15 min), `outings.lifecycle` (5 min : invitations échues, backfill, verrou J-1 18 h, check-in, clôture, dépouillement), `outings.purge` (horaire : bulletins 7 j, lecture chat 7 j, corps 90 j), `neighborhoods.generate_slots` (quotidien). Salles WS : `outing:<id>` (place confirmée / présente pendant les votes), `duo:<id>`.
