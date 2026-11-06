# Handoff V5.4 + V5.5 + V5.6 + V5.7 — backend (agent C, délégation B/C2/F/G) — 2026-11-06

> La section **V5.6** (fin du document) complète et remplace, pour les écarts E11–E26, les « limites » V5.5 ci-dessous.

Base : `concept-v5.4.md`, puis **`concept-v5.5.md`** et `spec-v5.md` révision 5 (§11.4, 21 écarts) arrivés en cours de mission (extension de l'orchestrateur). Aucune commande git, aucune dépendance ajoutée ; rien touché dans `apps/mobile`, `design/**`, `packages/ui-*`, `business-model.md`. La spec a été réécrite par l'orchestrateur pendant la mission (révision 5) : mes premières retouches de spec V5.4 ont été remplacées ; j'ai reporté ensuite les statuts dans **§11.4 (colonne « Statut serveur »)**, §4.5 (protocole) et §8.1 (migrations).

## Résultat (commandes réellement lancées)
- `pnpm -s turbo run build typecheck test lint --concurrency=4 --continue --filter='!@blowy/mobile' --filter='!@blowy/ui-mobile' --filter='!@blowy/qa'` → **59/59 tâches** (après correction de 2 restes : test de contrat check-in GEO, variable inutilisée).
- `pnpm --filter @blowy/api test:integration` ×2 → **21 fichiers, 122/122** à chaque passe (dont `v5-4.test.ts`, `v5-5.test.ts` avec `ONCALL_COVERAGE=enforce`).
- `flock .local/journeys.lock pnpm --filter @blowy/api test:journeys` → **16 fichiers, 160 passés, 4 todo, 0 ❌** (parcours `alex-invite-son-quartier` → récompense « prochaine sortie offerte », 1/mois ; `ines-proposee-a-deux-hommes` → la personne non placée jeudi reste `OPEN`, candidate samedi).
- Base vierge `blowy_c56` : `prisma migrate deploy` OK, `migrate diff --from-config-datasource --to-schema` → « No difference detected », `BLOWY_ENV=local tsx src/seed/index.ts` → Seed V5 OK (12 personnes, 7 staff, tours d'astreinte).

## Ce qui est livré

### Confidentialité (V5.4 A.1, A.3, A.5, A.6 ; V5.5 E3, E6, E17)
- **Aucun signal de compatibilité** : `storyMatch` retiré du contrat `OutingView` (`.strict()`), du projecteur (`visibility.ts`) et des requêtes (`queries.ts`) ; la garantie reste dans `@blowy/matching` (objectif `storyCov`, `friendsOnly` interne). Tests : domaine (toutes phases, regex de signal), intégration `test/integration/v5-4.test.ts` (5 vues HTTP × 5 personnes × 4 phases), parcours `cinq-inconnus-un-jeudi` et `fuite-intention-impossible` (regex étendue).
- **Carte de proposition Duo = espèce + initiale** (V5.5 D-068, remplace « pet sans traits » de V5.4) : `DuoLaneProposalView = {proposalId, species, otherInitial, expiresAt, acceptedByMe}` ; jamais le nom du pet, ni score, tranche, intention. `quota = {maxActive:3, active, freeMaxActive:3, unlimited:false}`.
- **Mode discret explicite** : `PrivacySettings.discreetModeChosenAt` ; `PUT /v1/preferences/privacy` V5 partiel (corps V4 accepté) ; `me.complete_onboarding` → `412 {missing:['discreetMode']}` tant que non choisi ; `/v1/me` expose `privacy.discreetMode/discreetModeChosen` ; le réglage notifications compte comme choix ; `ONBOARDING_STEPS_V5 += DISCREET_MODE`.
- **« Éviter les personnes que je connais »** — protocole `oprf-p256-v1` (spec §4.5) : l'appareil hache (P-256, essai-incrément) et **aveugle avec un sel aléatoire propre à la personne et au lot** ; l'API évalue `x(k·B)` puis reçoit des jetons `x(k·H2C(e164))` qu'elle compare via `HMAC(clé, T)` aux numéros VÉRIFIÉS (`PhoneIdentity.tokenDigest`) ; seules des `AvoidPair` symétriques restent ; rien d'autre stocké (ni numéro, ni condensé de contact, ni dans le registre d'idempotence, ni dans les logs) ; réponse identique quel que soit le nombre de correspondances. Routes `GET|POST|DELETE /v1/me/contact-avoidance`, `POST …/decline`, `…/evaluate`, `…/contacts` ; `askBeforeFirstOuting` (proposé avant la 1ʳᵉ composition). Effets : filtre dur `KNOWN_CONTACT` (`@blowy/matching`, hors team) en composition, backfill et voie Duo ; « je connais quelqu'un » auto-accepté. Implémentation de référence appareil (`blind`/`unblind`) dans `users/domain/contact-avoidance.ts` pour D.

### Calendrier, imprévus, préférences (V5.4 B.8, B.9 ; V5.5 E1, E9, E11 en partie)
- **Composition glissante à J − 3 21 h par (ville, jour)** (`OutingJobs.composeRolling`, job `outings.compose` toutes les 5 min) : un run `ROLLING` unique par `zone:<id>@<jour>` (`CompositionRun.slotDate`), tous les créneaux du jour ; une personne disponible mardi et jeudi est d'abord candidate le mardi et n'est marquée « non placée » qu'après son dernier jour. `requestWindow` : ouverture **vendredi 21 h de W−1**, fermeture = composition du dimanche ; un créneau n'est demandable que jusqu'à sa composition (`REQUEST_WINDOW_CLOSED` sinon) ; créneaux mardi → dimanche. Garde vérifiée par test pur pour chaque jour : composition < fin d'invitation < confirmation. `composeWeekly` reste un alias.
- **Imprévu** : `cancelKind EMERGENCY` (migration), **1 par 30 jours glissants** (V5.5 ; V5.4 disait 1/trimestre), aucune absence, place non remboursée (`NOT_ELIGIBLE`), lieu compensé comme une absence (`cause EMERGENCY`) ; hors quota → **412 `EMERGENCY_QUOTA`** (spec §7.2) ; `emergencyAvailable` dans l'aperçu et `mySeat.cancelPreview` (lecteur seul).
- **« Une semaine sur deux »** : `everyOtherWeekOffFrom` (`OutingPreferences.alternateWeeksOffFrom`, CHECK de format), `isWeekOff` pur.
- **Ambiance** : préférence `ambiance CALM|LIVELY|ANY` (défaut ANY), `Venue.ambiance` ; contrainte DURE au lieu (`ambianceAccepts`, classes de créneau distinguées par ambiance).
- **État honnête « histoire »** : `GET /v1/outings/week` → `storyFeasibility: 'NOT_ENOUGH_ON_SLOTS'` (moi seul·e, avant composition, vivier `storyCompatible` de la ville sur MES créneaux < 2) et `composeAt` ; `PUT …/requests/:week {mode:'FRIENDS_THIS_WEEK'}` → composé·e en amitié cette semaine.
- **Indicateurs de ville** : `approxCount` pur (≥ 10, arrondis), `CityInsightSnapshot` (photographie quotidienne, condensés d'identifiants seulement, purge 30 j), job `neighborhoods.city_insights`, `GET /v1/me/city-insights` (`storyCompatible` pour qui cherche une histoire, d'après SA ligne de la photographie ; tranches de la grille).

### Sécurité (V5.5 E2, E12)
- **Check-in par code uniquement** : `CheckInRequestSchema = {code}` `.strict()` — toute position → 400 ; chemins GEO retirés (sorties et RDV duo) ; `venue.lat/lng` retirés de `OutingView`.
- **Astreinte** : `SafetyOnCallShift` (par fuseau) ; port `ONCALL_COVERAGE` (`enforce` en production ; `dev_open` = tout couvert, local/test, **refusé en production**) ; composition et amorçage ne gardent que les créneaux couverts du début du check-in à la fin ; RDV duo hors couverture → 412 `OUTSIDE_ONCALL_HOURS` ; `GET /v1/safety/oncall?at=` → `{covered, responseMinutes?}`. Seed : tours de démo 9 h → 2 h.

### Argent (V5.4 C.10–C.12 ; V5.5 E5, E7, E8, E10, E15 en partie)
- **Blowy+ = abonnement aux sorties via Stripe Billing** : `POST /v1/subscriptions/plus/checkout` → abonnement `default_incomplete` (clé `plus-sub:<userId>:<commandId>`, client `cus_…` dans `Subscription.providerCustomerRef`) → `{provider:'STRIPE', clientSecret, subscriptionId}` ; **droit accordé seulement par le webhook signé** `customer.subscription.*` (`metadata.purpose=PLUS`, ordre par `lastProviderEventAt` ; `past_due` → grâce 7 j) ; `POST /v1/subscriptions/plus/cancel` (résiliation en app, à l'échéance) ; `ENTITLEMENT_KEYS_V5 = [PLUS_INCLUDED_OUTINGS]`. **RevenueCat désactivé pour Blowy+** (`[T] plus.billing = STRIPE_BILLING`) : plus de produit store, `/v1/purchases/sync` ne contacte plus RevenueCat (démo locale exceptée) ; le code et les webhooks restent. Variable : `STRIPE_PLUS_PRICE_ID` (absente → 503 `PLUS_UNAVAILABLE`).
- **Duo gratuit pour tous, 3 actifs** (`[T] duo.maxActiveFree = 3`, Blowy+ sans effet ; `DUO_ALLOWANCE` gardé).
- **Compensations lieu HT** : place payée = 4,16 € HT, sinon 3 € HT ; **« Blowy annule » une sortie confirmée** (sous-effectif après confirmation, staff, quartier, sécurité — jamais `VENUE_UNAVAILABLE`) → 3 € par place réservée (effectif de la confirmation, annulations tardives comprises), outbox `outing.venue_cancel_compensation_due`, une écriture par place.
- **Relevé mensuel détaillé par soirée** (`GET /v1/venue/statement`) : places réservées, présences, absences, imprévus, `cancelledByBlowy`, compensation HT, `taxBasis:'HT'`. Page `/lieu/releve` et textes lieu (« Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée », plus de « virement le lundi ») ; contrat `contrat-lieu-2026.12` (à re-signer).
- **« Signaler un participant »** : `POST /v1/venue/outings/:outingId/participant-reports {firstName, motive, note}` (garde `venue_partner`, sortie du lieu, après la confirmation, prénom seulement, 404 identique) + outbox `venue.participant_reported` (identifiants seulement).
- **Parrainage = prochaine sortie offerte** : `ReferralReward` (≤ 1 par mois, jamais deux en attente), financement `REFERRAL_FREE` (après la 1ʳᵉ offerte, avant Blowy+ ; consommé une fois ; « reste offerte » à l'annulation gratuite), `GET /v1/me/referral-reward` ; plus de pièces versées (code V4 gardé, inactif).

## Tuning (B) — `tuning-2026.12.5`
`outings.emergencyCancelsPerMonth = 1`, `emergencyWindowDays = 30`, `cycle.composeDaysBefore = 3`, `composeHourLocal = 21`, `requestOpensIsoWeekday = 5`, `requestOpensHourLocal = 21`, `requestOpensWeeksBefore = 1`, `slotIsoWeekdays = [2..7]`, `duo.maxActiveFree = 3`, `plus.duoUnlimited = false` (déprécié), `plus.billing = STRIPE_BILLING`, `venues.compensationBlowyCancelSeatCents = 300`, `referral.maxFreePerMonth = 1`, `cityInsights.{minCount:10, snapshotRetentionDays:30}` — tous avec `.default()` (les versions publiées restent lisibles, testé).

## Migrations (C)
- `20261107090000_v5_4` : `SeatCancelKind += EMERGENCY`, `PrivacySettings.discreetModeChosenAt`, `OutingPreferences.alternateWeeksOffFrom` (+ CHECK), `Subscription.providerCustomerRef`, `PhoneIdentity`, `AvoidPair` (CHECK low < high).
- `20261107100000_v5_5_enums` : `CompositionRunKind += ROLLING`, `SeatFunding += REFERRAL_FREE`, enums `Ambiance`, `OutingRequestMode`.
- `20261107100100_v5_5` : `CompositionRun.slotDate`, `Venue.ambiance` (+ CHECK ≠ ANY), `OutingPreferences.ambiance`, `OutingRequest.mode`, `SafetyOnCallShift`, `CityInsightSnapshot`, `ReferralReward`.
Écarts assumés vs §8.2 : « une semaine sur deux » sur `OutingPreferences` (pas de table `UserWeekOffPattern`) ; le jour du run est aussi encodé dans `scopeKey` (unicité existante).

## Fichiers principaux
- **Domaine/contrats (A, ajouts)** : `packages/domain/src/{outing,intentions,economy}.ts` ; `packages/api-contract/src/{outings,me,connections,payments,venue,admin-v5,neighborhoods}.ts` ; `packages/api-client/src/client.ts`.
- **B** : `packages/tuning/src/{schema-v5,defaults-v5,schema,defaults,tuning.test}.ts` ; `packages/matching/src/{types.ts,filters/filters.ts,groups/{types,pairs,compose,index,groups.test}.ts,insights/*}` ; `packages/pet-engine/src/{v5/calendar.ts,test/v5.test.ts}`.
- **C** : `outings/{domain/{seat-policy,visibility,week}.ts, application/{jobs,seats.use-cases,queries,requests.use-cases,lifecycle.service}.ts, application/ports/outings.repository.ts, infrastructure/{prisma-outings.repository,candidates,city-insights}.ts, interface/{outings.controller,oncall.controller,city-insights.controller}.ts, outings.module.ts, __tests__/outings-domain.test.ts}` ; `users/{application/{contact-avoidance.use-cases,update-settings.use-case,complete-onboarding.use-case,preferences-v5.use-cases}.ts, domain/contact-avoidance.ts, infrastructure/{prisma-contact-avoidance.repository,phone-verifiers,prisma-user-profile.repository,prisma-preferences-v5.repository}.ts, interface/{me.controller,contact-avoidance.controller}.ts, users.module.ts, __tests__/contact-avoidance.test.ts}` ; `shared/application/ports/oncall-coverage.port.ts`, `shared/infrastructure/oncall/prisma-oncall-coverage.ts` ; `config/env.ts` (`CONTACT_AVOIDANCE_SECRET`, `PHONE_VERIFICATION_PROVIDER`, `ONCALL_COVERAGE`) ; `packages/database/prisma/{schema.prisma,migrations/*}`, `src/seed/{index,v5}.ts`.
- **C2** : `connections/{application/{queries,duos.use-cases,deps}.ts, domain/duo-policy.ts, infrastructure/prisma-connections.repository.ts, connections.module.ts, __tests__/connections-domain.test.ts}`.
- **G** : `economy/{domain/{payments,plus-billing,subscription,index}.ts, application/{entitlement-state.service.ts, payments/{plus-billing.use-cases,payments.use-cases,seat-funding.service,stripe-webhook.use-case,ports}.ts, use-cases/{queries,sync-purchases.use-case}.ts}, infrastructure/{stripe/stripe-payment.provider.ts, config/{payments-config,payments-params}.ts, prisma/{prisma-plus-billing.store,prisma-referral-free.store}.ts}, interface/{http/economy.controller.ts, economy-outbox.consumer.ts}, economy.composition.ts, __tests__/{stripe-mock,payments.test,payments.int.test,economy.int.test}.ts}` ; `notifications/infrastructure/prisma-notifications.repository.ts` (choix discret).
- **F** : `admin/{domain/venue-partner.ts, application/{ports/ops.ports.ts, use-cases/venue-partner.use-cases.ts}, infrastructure/prisma-ops.repositories.ts, interface/http/venue-partner.controller.ts, __tests__/ops-v5.int.test.ts}` ; `apps/admin/src/app/lieu/(espace)/{releve,effectif}/page.tsx` ; `social/__tests__/social.int.test.ts`.
- **Tests (H, adaptations)** : `test/integration/{v5-4,v5-5}.test.ts` (nouveaux), `harness.ts` (choix discret, `venueCodeOf`), `outings-v5`, `safety-v5`, `connections-v5` ; parcours `support/{actor,v5}.ts` (choix discret, `venueCodeOf`, `duoCodeOf`, check-in par code), `cinq-inconnus-un-jeudi`, `fuite-intention-impossible`, `annulation-apres-verrou`, `ines-paie-sa-place` (Blowy+ Stripe Billing, compensation HT), `maya-achete-puis-se-fait-rembourser`, `lea-et-hugo-…`, `thomas-prend-la-voie-duo`.

## Limites / reste à faire (voir §11.4)
- **E11** : `storyAgeBrackets`, `kidsHorizon`, temps de trajet (`NeighborhoodTravelTime`), pénalité douce d'ambiance au groupe, `ambiance`/`travelMinutes`/`activityChosenBy`/`oncall` dans `OutingView`. **E12** : `neighborhoods.generate_slots` ne filtre pas encore la couverture (la composition le fait) ; planning admin et alerte « couverture perdue » (F, E). **E13** (table de 2 Duo dans l'effectif/compensation), **E14** (alerte : position refusée en 400, E), **E15** (contrat bilatéral), **E16**, **E18**, **E19**, **E20** non traités. `cityVerifiedApprox` (arrondi de `GET /v1/me/neighborhood`) non fait.
- Parrainage : mois calendaire en UTC (pas le fuseau du parrain). Indicateurs : photographie par jour UTC.
- `GET /v1/preferences/outings` sans préférences enregistrées renvoie encore 400 (défaut `neighborhoodIds: []` refusé par le schéma) — défaut antérieur, non corrigé.
- Stripe Billing : aucun appel réel (HTTP simulé) ; Apple Pay / PaymentSheet pour l'abonnement à vérifier sur appareil ; `invoice.payment_failed` non traité (l'état vient de `customer.subscription.updated`).
- OPRF : le serveur détient `k` (il pourrait tester un numéro donné au prix d'une multiplication de courbe) ; une paire n'est trouvée que si le contact est inscrit au moment de l'envoi.
- Visuels espace lieu : textes du relevé, de l'effectif et du contrat modifiés → les comparaisons pixel `L-*` de F divergeront jusqu'à la mise à jour des maquettes.

## Besoins externes
`STRIPE_PLUS_PRICE_ID` (prix Stripe Billing 9,99 €/mois), `CONTACT_AVOIDANCE_SECRET` (≥ 32 caractères), `PHONE_VERIFICATION_PROVIDER=firebase` (connexion SMS Firebase), tours d'astreinte `SafetyOnCallShift` en production (`ONCALL_COVERAGE=enforce`).

## Demandes à d'autres propriétaires
- **A** : valider `OUTING_CANCEL_REQUEST_KINDS`, `SEAT_CANCEL_KINDS += EMERGENCY`, `SEAT_FUNDINGS += REFERRAL_FREE`, `AMBIANCES`, `OUTING_REQUEST_MODES`, `ONBOARDING_STEPS_V5 += DISCREET_MODE`, `ENTITLEMENT_KEYS_V5 = [PLUS_INCLUDED_OUTINGS]` ; décisions D-053…D-068 telles qu'implémentées.
- **D (mobile)** : `storyMatch` supprimé ; carte Duo `{species, otherInitial}` ; choix discret obligatoire (`PUT /v1/preferences/privacy {discreetMode}` avant `onboarding/complete`) ; écran « éviter les personnes que je connais » (protocole §4.5, référence `blind`/`unblind`) ; check-in `{code}` seul ; annulation `EMERGENCY` + 412 `EMERGENCY_QUOTA` ; `everyOtherWeekOffFrom`, `ambiance` ; `storyFeasibility` + `mode FRIENDS_THIS_WEEK` ; `GET /v1/me/city-insights` ; Blowy+ via PaymentSheet (`clientSecret` de facture) et résiliation `POST /v1/subscriptions/plus/cancel` (plus de SDK RevenueCat pour Blowy+) ; `GET /v1/me/referral-reward` ; `GET /v1/safety/oncall`. Le typecheck mobile cassera sur `storyMatch`, `visionScore`/`pet` de la carte Duo, `PLUS_UNLIMITED_DUOS`, `lat/lng` du lieu et le check-in GEO.
- **E** : consommer `venue.participant_reported` (dossier `ON_SITE_INCIDENT`) ; planning d'astreinte (`SafetyOnCallShift`) ; E14 ; export RGPD : `PhoneIdentity`/`AvoidPair` (existence seulement), `ReferralReward`.
- **F** : planning d'astreinte et ambiance des lieux dans l'admin ; contrat bilatéral ; maquettes lieu ; liens de partage.
- **G (notifications)** : `referral.next_outing_free`, `outing.cancelled` peut annoncer la compensation lieu (aucune pour la personne) ; textes de règle d'annulation « imprévu 1 fois par mois ».
- **H** : parcours V5.5 de §11.2 (les briques serveur existent pour `mardi-soir-a-paris`, `claire-a-un-imprevu`, `yanis-a-marseille`, `check-in-sans-position`, `alex-parraine-sarah`, `blowy-annule-jeudi`, `blowy-plus-stripe`).
- **Designer** : `facts.json` (imprévu 1/mois, composition J − 3 21 h), maquettes du relevé par soirée.


---

# V5.6 (concept-v5.6 §A, spec révision 6 §11.4 : E22–E26 + restes E11–E21)

## Résultat (commandes réellement lancées)
- `pnpm -s turbo run build typecheck test lint --concurrency=4 --continue` (hors mobile/ui-mobile/qa) → **59/59 tâches** (après V5.6 + V5.7).
- `pnpm --filter @blowy/api test:integration` ×2 → **22 fichiers, 132/132** à chaque passe (dont `v5-6.test.ts` : 10 cas V5.6 + V5.7).
- Base vierge `blowy_c57` : `prisma migrate deploy` (toutes les migrations dont `v5_6_enums`, `v5_6`, `v5_7`) OK, `migrate diff` → aucune différence, seed local OK.
- **Parcours (`flock .local/journeys.lock … test:journeys`) : NON EXÉCUTÉS** — le verrou est tenu par un serveur de test resté actif (PID 23794, hors de mon contrôle, non arrêté sur consigne du coordinateur). Dernier passage vert : avant V5.6 (160/160, 0 ❌). Parcours modifiés sans exécution : `lea-et-son-ange-gardien` (alerte avec position → 400), `la-semaine-de-lea-en-notifications` (texte `outing.confirmed`), `nora-se-protege-en-sortie` (`callbackTargetMinutes`), `thomas-prend-la-voie-duo` et `lea-et-hugo-…` (RDV Duo déplacé au vendredi : la table de 2 se confirme au plus tard la veille 18 h). À relancer dès que le verrou est libre.

## Ce qui est livré
- **E22 — lieu compensé pour une sortie de sécurité** : `venueCompensationCause` → `SAFETY` pour toute `SAFETY_EXIT` annulée après `lockAt` (y compris après check-in) ; 3 € HT versés par Blowy (`venueCompensationFreeSeatCents`, base `SAFETY`) ; relevé : colonne `safetyExits` (page lieu « Sorties pour sécurité ») ; ces places comptent aussi dans « Blowy annule ». Contrat `VENUE_COMPENSATION_CAUSES += SAFETY`, bases `+= SAFETY`.
- **E23 / E18 — « je connais quelqu'un »** (`seats.use-cases.ts`) : `[T] outings.knowsSomeoneMovesPerMonth = 1` / `knowsSomeoneWindowDays = 30`.
  - dans le quota, lien connu (bande, duo, blocage, contacts évités) → **déplacement** vers un autre groupe CONFIRMÉ du même créneau et de la même ville (≤ 6 places, la table s'agrandit d'une place ; ≤ 3 du même genre ; aucun lien connu avec ses membres) en gardant financement et références de paiement/crédit (`relocateSeat`) → `{status:'MOVED', newOutingId}` ; faute de place : retrait `SAFETY_EXIT` remboursé (`{status:'MOVED'}`) ; même chemin quand le staff accepte un examen ;
  - dans le quota, lien inconnu → `IN_REVIEW` (inchangé) ;
  - **au-delà** → sortie pour raison de sécurité immédiate (remboursée, aucune absence) + `KnowsSomeoneRequest.status = SAFETY_REVIEW` dans la file staff (`outing.knows_someone_review`) → `{status:'SAFETY_REVIEW'}` ; la décision staff ne change plus rien pour la personne (`REVIEWED`). Plus jamais `COUNTED_AS_CANCEL` (valeur gardée dans l'enum et le contrat pour les anciens clients). Un 2ᵉ signalement sur la même place renvoie l'état enregistré.
  - Déplacement vers une autre table du MÊME lieu : aucune compensation ; vers un autre lieu : 3 € HT (E22).
- **E24 — fiabilité visible par soi seulement** : retirée de `OutingMemberViewSchema`, `BandMemberViewSchema`, `DuoViewSchema.other` (contrats `.strict()`) et des projections (`visibility.ts`, `outings/queries.ts` bande, `connections/queries.ts`) ; `GET /v1/me/reliability` inchangé ; `MemberReliabilitySchema` gardé exporté (`@deprecated`).
- **E25** : libellés « 1 par mois » ; `quarterStart` supprimé.
- **E26** (`@blowy/content`) : `RULES_V56` (une formulation par règle : sortie pour raison de sécurité, imprévu, annulation après la confirmation, « je connais quelqu'un », fiabilité, astreinte « pendant toute ta sortie ou ton rendez-vous », « Blowy+ est rentable dès la 3ᵉ sortie du mois ») ; `answerAtFr` / `answerAtFromInstants` (délai calculé depuis la composition : « Nino cherche ta sortie de samedi : réponse mercredi soir. ») ; variable `{moment}` ; gabarits in-app `outing.request_answer_at`, `referral.next_outing_free` ; `outing.confirmed` réécrit (« … sauf ton imprévu du mois ou une raison de sécurité ; l'équipe Blowy est joignable pendant toute ta sortie ») ; `locales/fr.json` régénéré. Test : aucun « trimestre », « 2ᵉ sortie », « soirs de sortie », « position en continu », « lundi 21 h ».
- **E11** : `PUT /v1/preferences/intentions` + `storyAgeBrackets` (tranches de la grille) et `kidsHorizon` (`IN_1_2_YEARS | IN_3_5_YEARS | NO_PLAN | DONT_KNOW | HAS_ALREADY`), optionnels (absents = inchangés), réservés à « une histoire » ; `storyCompatible` (fonction et `PairTable.story`) utilise `storyAgeBrackets` quand renseigné (repli `groupAge`) ; `projectCompatible` lit l'horizon (repli `kidsSomeday`) ; « un week-end sur deux » `everyOtherWeekendOffFrom` (retire les créneaux ven./sam./dim. de la semaine, `[T] cycle.weekendIsoWeekdays`) ; **temps de trajet** `NeighborhoodTravelTime` : à la demande et à la composition, les lieux d'un quartier atteignable en ≤ `maxTravelMinutes` sont acceptés (les quartiers saisis restent acceptés) ; staff `GET /v1/admin/neighborhoods/:id/travel-times`, `POST /v1/admin/travel-times {from,to,minutes,symmetric}` ; **ambiance** : pénalité douce `[T] composition.lambdaAmbiance` (membre minoritaire calme/animé), filtre dur du lieu inchangé, ambiance du lieu modifiable par le staff ; `OutingView` + `activityChosenBy` (`YOU` / `VENUE_AND_GROUP`), `oncall {covered:true}`, `venue.ambiance`, `venue.travelMinutes`.
- **Bug `GET /v1/preferences/outings`** : sans rien d'enregistré → 200 avec les défauts (`neighborhoodIds = [mon quartier]` ou `[]`) ; vue `OutingPreferencesV5ViewSchema` (le `PUT` garde `min(1)`).
- **E12** : `neighborhoods.generate_slots` ne crée que les créneaux couverts (check-in → fin prévue) ; job horaire `neighborhoods.oncall_watch` (14 j) : créneau découvert sans sortie supprimé, sinon outbox `ops.oncall_coverage_lost` (une fois par créneau) ; staff `GET /v1/admin/oncall/shifts?timezone&from&days` (tours + créneaux publiés non couverts), `POST /v1/admin/oncall/shifts`, `POST /v1/admin/oncall/shifts/:id/delete` (permissions `oncall.read/write` : trust_lead, ops, admin ; `phoneRef` jamais renvoyé, seulement `hasPhoneRef`).
- **E13 — Duo = table de 2** : `DuoDate.venueSlotId`, `reservationLockedAt` ; `[T] duo.dateLockHourLocal = 18` : proposition ou acceptation après la veille 18 h (heure du lieu) → 412 `DUO_DATE_TOO_LATE` ; `duos.lifecycle` fige la réservation à la veille 18 h ; effectif du lieu : table `kind: 'DUO'` (prénoms, code du chevalet = code de check-in du RDV) ; libellé « Table de 2 (Duo) » dans l'espace lieu ; **0 € pour le lieu, sans garantie** (V5.7, E27 : la compensation d'abord livrée a été retirée).
- **E14** : `RaiseAlertRequestSchema` `.strict()` — une position jointe → 400 explicite (le mobile V5.3+ n'en envoie pas ; un client antérieur ne peut plus lever d'alerte tant qu'il n'est pas mis à jour : à arbitrer par E si des clients < V5.3 restent en circulation).
- **E15** : contrat `contrat-lieu-2026.12.2` (clause « Responsabilités », table de 2, 3 € HT sécurité, astreinte « pendant toute la sortie ou le rendez-vous », en vigueur à la double signature) — **à re-signer** ; `Venue.contractVersion/contractSignedAt/contractSignerName` (projection) et `blowySignedAt/blowySignerName` ; `POST /v1/admin/venues/:id/contract/countersign {signerName, reason}` (permission `venues.contract_countersign`, admin, step-up ; 412 `CONTRACT_NOT_SIGNED_BY_VENUE` / `CONTRACT_VERSION_OUTDATED`) ; vue contrat + `countersigned`, `inForce` ; page et PDF lieu l'affichent.
- **E16 — liens de partage** : `ShareLink` (slug `s` + 15 caractères base32, 13 mois, compteurs) et `ShareAttribution` ; `POST /v1/share-links {cardKind, teamCode?}` (un nouveau lien à chaque appel ; INVITE porte le code de parrainage du titulaire, TEAM le code de team) ; `GET /v1/me/share-links` ; `GET /v1/public/s/:slug` → `{valid, cardKind, inviteRef?, teamCode?}` (clic compté, rien du visiteur, aucun prénom/lieu/heure) ; `POST /v1/referrals/claim {ref: <slug>}` attribue l'inscription puis réclame le parrainage ; la 1ʳᵉ sortie vécue incrémente `attributedFirstOutings` (consommateur `social.share_first_outing`) ; purge quotidienne `social.share_links_purge`.
- **E19** : `VenuePartnerEvent` (journal append-only, unique `(venueId, seq)`) + projections écrites dans la même transaction : `VenuePartnerAccess`, `VenuePartnerMfa`, `VenueWeekday`, `VenueClosure`, `VenueIncident`, contrat sur `Venue` ; la migration recopie les événements `DomainEvent` `venue.partner*` (non effacés).
- **E21** : champs morts optionnels et absents des défauts (`duo.maxActiveFree`, `plus.includedOutingsPerMonth`, `plus.includesMonthlyAccessory`, `accessories.plusMonthlyAccessoryIds`, `neighborhoods.defaultDensityThreshold`) ; le code lit `duo.maxActive`.

## Tuning — `tuning-2026.12.6`
`outings.knowsSomeoneMovesPerMonth = 1`, `outings.knowsSomeoneWindowDays = 30`, `outings.cycle.weekendIsoWeekdays = [5,6,7]`, `outings.composition.lambdaAmbiance = 200` (HYPOTHÈSE de calibrage), `duo.dateLockHourLocal = 18` — tous avec `.default()` ; champs E21 `.optional()`. Testé : une version `2026.12.5` qui porte les champs morts et pas les nouveaux reste lisible.

## Migrations
- `20261107120000_v5_6_enums` : `KnowsSomeoneStatus += SAFETY_REVIEW`, `KidsHorizon`, `ShareCardKind`.
- `20261107120100_v5_6` : `MatchPreferences.storyAgeBrackets` / `kidsHorizon`, `OutingPreferences.alternateWeekendsOffFrom` (CHECK), `NeighborhoodTravelTime` (CHECK 1–240, unique from/to), `Venue` contrat bilatéral, `DuoDate.venueSlotId` / `reservationLockedAt`, `ShareLink` (CHECK compteurs ≥ 0), `ShareAttribution`, `VenuePartnerEvent`, `VenuePartnerAccess`, `VenuePartnerMfa`, `VenueWeekday` (CHECK), `VenueClosure`, `VenueIncident` + reprise des données `DomainEvent`.
Aucune migration appliquée réécrite. Pas de clé étrangère sur les nouvelles tables (même choix qu'en V5.5).

## Fichiers principaux (V5.6)
- Contrats : `packages/api-contract/src/{outings,connections,me,payments,venue,admin-v5,safety,referrals}.ts`.
- Domaine / tuning / contenus / composition : `packages/domain/src/intentions.ts` (+ test), `packages/tuning/src/{schema-v5,defaults-v5,defaults,schema,tuning.test}.ts`, `packages/content/src/{catalog/v5.ts,catalog/types.ts,locales.ts,content.test.ts}`, `packages/content/locales/fr.json`, `packages/matching/src/groups/{types,pairs,objective,groups.test}.ts`.
- Base : `packages/database/prisma/schema.prisma`, `migrations/20261107120000_v5_6_enums`, `migrations/20261107120100_v5_6`.
- API : `outings/{application/{seats.use-cases,queries,requests.use-cases,lifecycle.service,safety-port.service}.ts, application/ports/outings.repository.ts, domain/{visibility,seat-policy,week}.ts, infrastructure/{prisma-outings.repository,candidates}.ts}` ; `connections/{application/{duos.use-cases,duo-lifecycle,queries}.ts, domain/duo-policy.ts, infrastructure/prisma-connections.repository.ts}` ; `economy/{domain/payments.ts, application/payments/{payments.use-cases,ports}.ts, infrastructure/{prisma/prisma-economy-journal.ts,config/payments-params.ts}}` ; `users/{application/preferences-v5.use-cases.ts, application/ports/preferences-v5.repository.ts, infrastructure/prisma-preferences-v5.repository.ts, interface/me.controller.ts}` ; `admin/{domain/{venue-partner,permissions}.ts, application/{ports/ops.ports.ts, use-cases/{ops,venue-partner}.use-cases.ts}, infrastructure/prisma-ops.repositories.ts, interface/http/ops.controller.ts, admin.module.ts}` ; `neighborhoods/{neighborhoods.module.ts, application/ports/neighborhoods.repository.ts, infrastructure/prisma-neighborhoods.repository.ts}` ; `social/{social.module.ts, application/{ports/social.ports.ts, use-cases/share-links.use-cases.ts}, infrastructure/prisma-social.repositories.ts, interface/{social.controllers,social.consumers}.ts}` ; `safety/application/safety.use-cases.ts` ; `shared/application/ports/{admin-trust,outing-safety,safety-staff}.port.ts`.
- Espace lieu (admin) : `apps/admin/src/app/lieu/(espace)/{releve,effectif,contrat}/…`, `apps/admin/src/lib/venue-format.ts`.
- Tests : `test/integration/v5-6.test.ts` (nouveau, 7 cas), `outings-v5`, `safety-v5`, `notifications-v5` ; `connections-domain.test.ts`, `outings-domain.test.ts`, `api-contract/contracts-v5.test.ts`, `tuning.test.ts`, `content.test.ts`, `domain.test.ts`, `groups.test.ts` ; parcours `lea-et-son-ange-gardien`, `la-semaine-de-lea-en-notifications`, `nora-se-protege-en-sortie`, `thomas-prend-la-voie-duo`, `lea-et-hugo-de-la-rencontre-a-la-rupture` (non exécutés, voir Résultat).

## Limites (V5.6)
- **E20 ouvert** : le mobile n'appelle plus `/v1/matches`, mais les fixtures d'intégration V4 (`fixtures.ts`, `journey*.test.ts`, `idempotency`, `concurrency`) créent leurs relations par ce flux ; le retrait (`retired.ts`) demande de les réécrire (A).
- Backfill : n'applique pas encore les temps de trajet (seulement les quartiers saisis / le quartier de la personne).
- Déplacement « je connais quelqu'un » : verrou de la sortie d'arrivée pris après celui de la sortie de départ (ordre par appel, pas trié globalement) — risque théorique d'interblocage entre deux déplacements croisés simultanés au même créneau (la transaction échoue et se rejoue).
- `ops.oncall_coverage_lost` et `venue.participant_reported` : aucun consommateur encore (E).
- Pages staff (planning d'astreinte, trajets, contre-signature, ambiance des lieux) : API seulement (F).
- `lambdaAmbiance = 200` non calibré au simulateur (B).
- E14 : refus 400 d'une alerte avec position — voir ci-dessus.

## Ce que le mobile (D) doit adapter — liste exacte
1. `OutingView.members[].reliability`, `BandMemberView.reliability`, `DuoView.other.reliability` **supprimés** (contrats `.strict()`) : retirer leur affichage et des données de démo (`core/demo/world.ts`) ; la fiabilité vient seulement de `GET /v1/me/reliability`.
2. `POST /v1/outings/:id/seat/knows-someone` : `status` peut valoir `SAFETY_REVIEW` (au-delà d'1 déplacement par mois : « tu es parti·e pour raison de sécurité, remboursé·e, une personne de l'équipe regarde ») ; `MOVED` peut porter `newOutingId` (ouvrir la nouvelle sortie) ; `COUNTED_AS_CANCEL` n'arrive plus.
3. `POST /v1/safety/alerts` : n'envoyer que `{subject}` (toute position → 400).
4. Duo : proposition/acceptation d'un RDV après la veille 18 h → 412 `DUO_DATE_TOO_LATE` (« Choisis un jour à partir de demain soir : le lieu reçoit sa table la veille à 18 h »).
5. `PUT /v1/preferences/intentions` : nouveaux champs optionnels `storyAgeBrackets[]`, `kidsHorizon` (dont `HAS_ALREADY`) ; `kidsSomeday` déprécié (envoyer `null`) ; refusés hors « une histoire ».
6. `PUT/GET /v1/preferences/outings` : `everyOtherWeekendOffFrom` ; le `GET` répond toujours 200 (défauts) — ne plus traiter le 400.
7. `OutingView` : nouveaux champs optionnels `activityChosenBy`, `oncall`, `venue.ambiance` (« lieu calme »), `venue.travelMinutes` (« ≈ 20 min »).
8. Textes : utiliser `RULES_V56` et `answerAtFromInstants(pet, slotStartsAt, composeAt, tz)` (`composeAt` est déjà dans `GET /v1/outings/week`) au lieu de délais codés en dur ; « Blowy+ rentable dès la 3ᵉ sortie du mois ».
9. Partage : `POST /v1/share-links {cardKind}` à chaque partage (plus de lien réutilisé), « Mes cartes » peut lister `GET /v1/me/share-links` ; une invitation reçue en `/s/<slug>` se réclame avec `POST /v1/referrals/claim {ref: slug}`.
10. Aucun champ existant renommé ; les autres changements sont additifs.

## Demandes (V5.6)
- **A** : valider `KIDS_HORIZONS`, `kidsHorizonOf`, `projectCompatible` étendu ; E20.
- **B** : calibrer `lambdaAmbiance` ; `facts.json` / contenus avec `RULES_V56`.
- **E** : file de revue `SAFETY_REVIEW` (le dossier `outing.knows_someone_review` est ouvert comme avant), consommateur `ops.oncall_coverage_lost`, décision sur E14 pour les très anciens clients.
- **F** : pages staff (astreinte, trajets, contre-signature, ambiance) ; page web `/s/<slug>` ; maquettes lieu (colonne « Sorties pour sécurité », table de 2, contrat bilatéral).
- **H** : parcours V5.6 (déplacement vers l'autre groupe, `SAFETY_REVIEW`, table de 2 la veille 18 h), balayage « aucune fiabilité d'autrui » dans `fuite-intention-impossible`.


---

# V5.7 (concept-v5.7, spec révision 7 §11.4 : E27–E33)

## Livré
- **E27** : table Duo **0 € pour le lieu, sans garantie** — le consommateur `economy.venue_compensation` n'écoute plus `duo.*` (aucune écriture) ; contrat et textes lieu le disent.
- **D-079 / §6.5** : « Blowy annule » compensé à toute heure après la confirmation **quel que soit le motif interne** (seule exception `VENUE_UNAVAILABLE`) ; un retrait système (`SYSTEM_REMOVAL`) après la confirmation est compensé 3 € HT comme une raison de sécurité.
- **E28** : `civilMonthOf(at, tz)` (`@blowy/domain`) ; relevé du lieu (période, filtre et bornes des soirées) dans le fuseau du lieu ; vue staff des compensations idem ; parrainage « 1 sortie offerte par mois » sur le mois civil du parrain.
- **E29** : effectif = semaine civile en cours + suivante (fuseau du lieu) ; `days[]` (chaque jour de créneau, nombre de tables, 0 = « Aucune table », affiché dans `/lieu/effectif`).
- **E30** : message d'accueil — `Venue.welcomeMessage` (≤ `[T] venues.welcomeMessageMaxChars` 280, CHECK), modèle `venue.welcome.template`, `GET|PUT /v1/venue/welcome-message` (412 `WELCOME_MESSAGE_REJECTED {issue: TOO_LONG|CONTAINS_LINK|CONTAINS_PHONE|MODERATION}` ; modération par la passerelle des conversations, panne = refus 503 `PROVIDER_UNAVAILABLE`) ; `OutingView.venue.welcomeMessage` (places confirmées, à partir de la confirmation — même règle que `venue`) ; message système `system.venue_welcome` (texte du lieu) publié au chat à `lockAt` ; absent → rien.
- **E31** : `[T] safety.helpCallbackTargetMinutes = 5` ; `callbackTargetMinutes` dans `POST /v1/safety/alerts` et « je pars, mal à l'aise » ; SLA dossier 60 inchangée.
- **E32** : `OutingPreferences.showCalmBadge` (défaut false) dans `PUT/GET /v1/preferences/outings` ; `members[].calm: true` à partir de `FORMING` ; `MessageView.author.calm`.
- **E33** : `RULES_V57` (phrases canoniques mot pour mot : trois sorties, « Je ne le sens pas », règle d'annulation, « Quelqu'un de l'équipe te rappelle en quelques minutes. », astreinte Duo / page ange à la 3ᵉ personne, « Visible par toi seulement. », Tarifs, « personnes vérifiées », table Duo 0 €, badge calme, « Si un groupe se forme, réponse {moment}. ») ; test de contenu ; `locales/fr.json` régénéré.
- Contrat lieu `contrat-lieu-2026.12.3` (quatre cas nommés) — à re-signer.

## Tuning `tuning-2026.12.7` · Migration `20261107130000_v5_7`
`safety.helpCallbackTargetMinutes = 5`, `venues.welcomeMessageMaxChars = 280` (`.default()`, version antérieure relisible, testé). Migration : `Venue.welcomeMessage` (+ CHECK 1–280), `welcomeMessageUpdatedAt`, `OutingPreferences.showCalmBadge`.

## Ce que le mobile (D) doit adapter en plus (V5.7)
1. Afficher `OutingView.venue.welcomeMessage` sur la Confirmation et rendre le message système `system.venue_welcome` (seul message système avec `body`).
2. Préférence `showCalmBadge` (« Montrer au groupe : je préfère le calme ») ; afficher le badge `members[].calm` / `author.calm`.
3. Après « besoin d'aide » / « je pars, mal à l'aise » : `callbackTargetMinutes` + phrase `rule.v57.help_callback`.
4. Textes : clés `RULES_V57` (trois sorties distinctes, règle d'annulation, Tarifs).

## Fichiers (V5.7)
`packages/database/prisma/{schema.prisma, migrations/20261107130000_v5_7}` ; `packages/tuning/src/{schema-v5,defaults-v5,defaults,tuning.test}.ts` ; `packages/domain/src/economy.ts` ; `packages/content/src/{catalog/v5.ts,catalog/types.ts,locales.ts,content.test.ts}`, `locales/fr.json` ; `packages/api-contract/src/{venue,outings,me,safety,conversations}.ts` ; API : `economy/{domain/payments.ts, application/payments/{payments.use-cases,ports}.ts, infrastructure/prisma/{prisma-economy-journal,prisma-referral-free.store}.ts, interface/economy-outbox.consumer.ts}`, `admin/{domain/venue-partner.ts, application/{ports/ops.ports.ts, use-cases/{venue-partner,ops}.use-cases.ts}, infrastructure/prisma-ops.repositories.ts, interface/http/venue-partner.controller.ts, admin.module.ts}`, `outings/{application/{lifecycle.service,queries}.ts, domain/{facts,visibility}.ts, infrastructure/{person-facts,message-authors,prisma-outings.repository}.ts}`, `conversations/{application/message.serializer.ts, application/ports/conversation.repository.ts, infrastructure/{prisma-conversation.repository,prisma-group-chat}.ts}`, `shared/application/ports/{group-chat,message-author}.port.ts`, `safety/{domain/guardian.ts, application/safety.use-cases.ts}`, `users/…preferences-v5*` ; espace lieu `apps/admin/src/app/lieu/(espace)/{effectif,releve}/page.tsx` ; tests `test/integration/v5-6.test.ts` (+3 cas V5.7), `safety-v5.test.ts`.

## Limites (V5.7)
- Éditeur du message d'accueil dans l'espace lieu (page) : API seulement (F).
- `entitlements.monthlyPeriod` (Blowy+) reste en mois UTC (hors E28).
- Parcours : voir « Résultat » — non exécutés (verrou tenu par un autre processus).


---

# Suite (révision 7, restes E11–E21 + consommateurs + pages)

## Livré
- **E11 — temps de trajet estimés** : sans ligne `NeighborhoodTravelTime`, estimation à partir des centres de quartier en base (`Neighborhood.centerLat/centerLng` saisis par ops, sinon moyenne des lieux actifs du quartier) : vol d'oiseau × 1,3, 18 km/h de porte à porte, + 6 min, arrondi à 5 min (`outings/domain/travel.ts`, testé) ; la valeur ops prime ; jamais la position d'une personne (seul son quartier choisi). Appliqué à la demande, à la composition, au **backfill** et à la vue (`venue.travelMinutes` + `travelEstimated`). Staff : `PUT /v1/admin/neighborhoods/:id/center`.
- **E12** : consommateur `safety.oncall_coverage_lost` → dossier ops priorité 1 par sortie du créneau découvert (l'événement porte désormais `outingIds`).
- **`venue.participant_reported`** : consommateur `safety.venue_incident` → dossier « incident sur place » (`ON_SITE_INCIDENT`, priorité 2, 60 min).
- **E20** : `GET /v1/matches` et `POST /v1/matches/onboarding-batch` → 410 `RETIRED_IN_V5` (`RETIRED_V4_ROUTES`, méthodes retirées du contrôleur) ; fixtures V4 (`fixtures.ts`, `journey`, `journey-fixes`, `idempotency`, `concurrency`) passent par les cas d'usage (`v4Batch`, `v4Feed`) ; `journey.test.ts` vérifie le 410.
- **E16** : pages publiques `apps/web` `/s/[slug]` (une phrase par carte, aucun prénom / lieu / heure, code de repli pour INVITE) et `/team/[code]`.
- **Pages** : staff `/oncall` (tours, trous de couverture, ajout, retrait), `/travel-times` (trajets saisis, ajout symétrique, centre du quartier), fiche lieu (contre-signature, ambiance, message d'accueil en lecture) ; espace lieu `/lieu/accueil` (éditeur prérempli du modèle, refus lien/téléphone). Libellé d'astreinte par défaut « pendant toute la sortie ou le rendez-vous » (plus « chaque soir de sortie »). Champ `:num` pour les formulaires staff.
- Migration `20261107140000_v5_8` : `Neighborhood.centerLat/centerLng` (CHECK).

## Résultat
- turbo build/typecheck/test/lint (hors mobile/ui-mobile/qa) : 59/59 (seul échec du premier passage : un `any` dans `fixtures.ts`, corrigé, lint de `@blowy/api` repassé vert).
- `test:integration` ×2 : 22 fichiers, **133/133** à chaque passe.
- Base vierge `blowy_c58` : `migrate deploy` (jusqu'à `v5_8`) OK, aucune différence de schéma, seed OK.
- **Parcours : toujours NON EXÉCUTÉS** — `.local/journeys.lock` tenu par le PID 23794 (non arrêté, sur consigne). À relancer avec l'accord de l'utilisateur.

---

# V5.8 (concept-v5.8 §1–3)
- **§2 — groupe incomplet à la confirmation = « Blowy annule »** : `lifecycle.lock` → `cancelOuting(…, 'UNDERSIZED', {atConfirmation: true})` : places confirmées remboursées (carte, crédit, « reste offerte », rien pour Blowy+) et `outing.venue_cancel_compensation_due` → 3 € HT par place réservée (« Je viens »). Spec §2.6 alignée. Test d'intégration (3 places → 3 écritures `BLOWY_CANCELLED`).
- **§3 — numéros masqués avant les visages** : `conversations/domain/phone-mask.ts` (8 à 15 chiffres, `+`/`00`, espaces, points, tirets, barres, parenthèses, espaces insécables, chiffres espacés un à un ; jamais une date ni un horaire). Masquage serveur pour les destinataires, à la lecture, à la diffusion WS et à « afficher quand même » ; l'auteur voit son texte ; texte stocké inchangé ; servi tel quel après les visages (sortie : `photoRevealAt` ; duo : déblocage, jamais pour un duo terminé sans déblocage). Tests unitaires (18 formats) + intégration (avant / après les visages). Spec §2.8.
- **§1 — prénom du duo au double oui** : vérifié (le duo n'existe qu'au double oui ; carte de proposition `{species, otherInitial}`, sans prénom ; test `connections-v5`).
- Vérifications : turbo 59/59 · `test:integration` ×2 : 22 fichiers, 135/135 · migrations inchangées (base vierge `blowy_c58` déjà vérifiée) · **parcours non exécutés** (verrou tenu par le PID 23794).
