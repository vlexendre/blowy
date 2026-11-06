# Handoff V5 — alignement (agent C, backend) — 2026-11-06

Base : `spec-v5.md` révision 4 (§11.4 « écarts code ↔ spec »), `concept-v5.3.md`, demandes inter-agents des handoffs `V5-T2`, `V5-T3`, `V5-T4`, `V5-T5`, `V5-B-garantie`. Aucune commande git, aucune dépendance ajoutée, rien touché dans `apps/mobile`, `apps/admin`, `apps/web`, `design/**`. D'autres agents (F : admin/ops T6 ; G : notifications T8 ; D : mobile) travaillaient en parallèle dans le dépôt : leurs fichiers en cours n'ont pas été modifiés, sauf une correction d'une ligne dans un parcours de G (voir « Hors périmètre »).

## Résultat (commandes réellement lancées)

| Commande | Résultat |
|---|---|
| `pnpm turbo run build typecheck test lint --concurrency=4 --continue` | **62/66 OK**. Les 4 échecs sont hors de mon périmètre et sans lien avec mes changements : `@blowy/mobile#lint` (3 erreurs dans des écrans D en cours), `@blowy/mobile#test` (`core/navigation/paths.test.ts`), `@blowy/ui-mobile#test` (`atoms/styles.test.ts`), `@blowy/qa#test` (`visual/compare.test.mjs`, route `/verify/failed`). `api`, `api-contract`, `domain`, `tuning`, `matching`, `database`, `pet-engine`, `content`, `admin`, `web` : build, typecheck, test, lint verts |
| `pnpm --filter @blowy/api test` (unit) | **15 fichiers, 148/148** (nouveau `test/unit/retired-routes.test.ts`) |
| `pnpm --filter @blowy/matching test` | **35/35** (6 nouveaux tests de genre + invariant global) ; `pnpm simulate:outings` relancé (chiffres ci-dessous) |
| `pnpm --filter @blowy/api test:integration` ×2 | **19 fichiers, 109/109 les deux fois** (avant : 17 fichiers, 96 ; dont 2 fichiers `admin` de F) |
| `flock .local/journeys.lock pnpm --filter @blowy/api test:journeys` | **160 ✅ / 0 ❌ / 4 ⛔** (16 fichiers, dont `la-semaine-de-lea-en-notifications` de G) — dernier passage complet après tous les changements |
| `prisma migrate deploy` sur base vierge `blowy_c_align` + `prisma migrate diff --from-config-datasource --to-schema` | 10 migrations appliquées (dont la nouvelle `20261106180000_v5_align`), **diff vide** |
| `tsx src/seed/index.ts` sur cette base | OK (`Seed V5 OK : comptes alex, tom, lea, …` ; 12 personnes, 7 staff) |

Avant la mission : parcours 147 ✅ / 9 ❌ / 9 ⛔ ; intégration 96 tests.

## §11.4 — écarts corrigés
1. **Prénoms, tranches, fiabilité à la confirmation** (`lockAt`), plus à `FORMING` : `outings/domain/visibility.ts` (phases `PRE_LOCK` = pets seulement, `LOCKED` = identité + lieu, `FACES` = + visages). « X ne pourra pas venir » montre le pet avant la confirmation, le prénom après.
2. **Annulation avant la confirmation** = gratuite : carte remboursée intégralement (`economy/domain/payments.ts` `refundOutcome(PAID)=CARD`, plus de crédit 90 j), 1ʳᵉ sortie qui « reste offerte » (`REFUND_MODES += STAYS_FREE` dans `@blowy/domain`, état `RECREDITED` → `usedFreeFirst` ne la compte plus), Blowy+ sans objet (`PLUS_INCLUDED → NONE`). `CREDIT` ne sort plus que pour une place payée par un ancien lot (déprécié).
3. **`storyMatch`** : `z.literal('FRIENDS_ONLY')` dans le contrat.
4. **« Jamais plus de 3 du même genre »** en contrainte dure dans `@blowy/matching` (`GroupEvaluation.genderCapOk`, `[T] composition.maxSameGender = 3`) : glouton, réparation, échanges, amorçage, backfill. `UNDISCLOSED` n'est pas un genre commun ; exception « groupe non mixte demandé » (tous les membres ont restreint « qui je veux rencontrer » au même genre). `algoVersion groups-2026.12.2`.
5. **Quota duo** : `connections` consomme le port `DUO_ALLOWANCE` d'economy (1 gratuit, illimité Blowy+) ; repli `[T] duo.maxActiveFree` ; le lot quotidien borne les propositions ouvertes par `[T] duo.maxOpenProposals` ; `409 DUO_LIMIT_REACHED {upgrade:false}` ; `GET /v1/duo-lane` expose `quota{freeMaxActive, unlimited}`.
6. Déblocage à 48 h : déjà conforme (C2), vérifié par parcours.
7. **Position d'alerte** : le champ `position` d'un ancien client est ignoré — rien n'est stocké ni mémorisé (D-050).
8. **Droits Blowy+ V5** : `ENTITLEMENT_KEYS_V5 = PLUS_INCLUDED_OUTINGS, PLUS_UNLIMITED_DUOS` ; `GET /v1/subscriptions/me` ajoute `v5Entitlements`.
9. `NEIGHBORHOOD_NOT_LIVE` → `NEIGHBORHOOD_UNAVAILABLE` ; `AGE_VERIFICATION_REQUIRED` (sortie et duo) ; `threshold` retiré du contrat et de la vue.
10. **410 activés** (ci-dessous). 11. Blowy+ en achat intégré : déjà fait par G.

Aussi (reste-à-faire T2 de la spec) : **demande hebdo automatique** (job `outings.auto_requests`, D-052) ; **auteurs du chat de sortie signés par leur pet** (`MessageView.author {pet, firstName?}`, prénom à la confirmation, HTTP et WS, port `MESSAGE_AUTHOR_RESOLVER`).

## Demandes inter-agents traitées
- **T3 → B** : `duo.maxActiveFree = 1`, `venues.compensationUnpaidSeatCents = 300` publiés dans le tuning (`tuning-2026.12.3`) ; economy les lit directement (`PENDING_PAYMENTS_TUNING` supprimé).
- **T3 → C** : modifications d'outings relues et gardées (financement par port, `HOLD`, `refundCredit`, `cancelIn`) ; la branche « place payée annulée → crédit » a été retirée (contraire à D-042). Journal comptable : **décision ci-dessous**. Spec §2.7/§6.4 déjà sur `lockAt`.
- **T3 → C2** : `DUO_ALLOWANCE` branché (point 5).
- **T4 → B** : `[T] safety.humanResponseMinutes = 60`, `uneasyLeaveRecontactThreshold = 3`, `uncomfortableLeaveWindowDays = 90` ; le use case sécurité les lit (fenêtre de comptage des départs « mal à l'aise » ajoutée au dépôt).
- **T4 → C** : `safety-port.service.ts`, `systemRemove`, les 3 méthodes de dépôt et les deux migrations relus : conformes (verrous users → outings, remboursement par le port, aucune fiabilité). V5.3 B.6 fait. `mySeat.removedBySystem` : non ajouté (le message neutre relève du planificateur T8).
- **T4 « limites »** : **tables sécurité dans l'export RGPD** (`trust/infrastructure/prisma-privacy.repository.ts`) : liens d'ange gardien (sans jeton ni empreinte), alertes (sans position), « tout va bien », départs « mal à l'aise », incidents signalés ; plus mes places de sortie, mes bulletins encore conservés (sans cible) et ma fiabilité V5.
- **T5 → E** : **vocal en duo** (facultatif, après le déblocage des visages) : `media` `VoiceGateService` accepte une conversation DUO dont le duo est `UNLOCKED…TOGETHER` (412 `VOICE_LOCKED` pendant l'échange) ; `CreateUploadRequest.conversationId` (alternative à `relationshipId`) ; testé en intégration (`connections-v5.test.ts`).
- **T5 → B** : `duo.freeActiveDuos` = `duo.maxActiveFree`. **T5 → C** : migration `…_v5_connections` validée (appliquée sur base vierge, diff vide) ; `/v1/matches` et `/v1/match-proposals/:id/accept` **non** basculés vers les duos (ils ne sont pas dans `retired.ts` et le mobile actuel les appelle encore) ; compteurs `messagesLow/High` du seed laissés (non lus).
- **B-garantie → C** : `storyMatch` littéral (point 3). **→ C2** : `duo-policy.ts` compilait déjà.

## Journal comptable sur `DomainEvent` — décision : **garder**
Le port `EconomyJournal` reste posé sur la table append-only `DomainEvent` (`aggregateType='economy.journal'`, UUID dérivé de la clé d'idempotence, unicité `(aggregateType, aggregateId, seq)`, trigger anti-UPDATE existant). Raisons : idempotence et immutabilité déjà garanties par la base, aucun lecteur relationnel aujourd'hui (pas d'écran finance livré), une table dédiée maintenant figerait un schéma sans consommateur. Migration additive `20261106180000_v5_align` : index `DomainEvent(aggregateType, actorUserId, type)` pour les lectures par titulaire. Les tables `Payment` / `VenueCompensation` (§8.2) seront créées quand F livrera la finance (relevés mensuels, jointures par lieu) : un nouvel adaptateur derrière le même port, sans toucher aux appelants. Consigné dans la spec §8.1.

## Retrait V4 (410 `GONE {reason:"RETIRED_IN_V5"}`)
- `apps/api/src/shared/interface/retired-routes.middleware.ts` (nouveau), monté dans `bootstrap.ts` après le `requestId`, **avant** l'authentification et le rate limit : même réponse quel que soit l'objet (aucun 404/401 révélateur). Liste lue de `@blowy/api-contract` (`RETIRED_V4_ROUTES`, préfixes missions/ligues/carte/fil du Quartier).
- Test `test/unit/retired-routes.test.ts` : chaque route listée → retirée ; méthode exacte ; **aucune route V5 déclarée par un contrôleur n'est couverte** (balayage des `@Get/@Post…`).
- Effet de bord V5 : le parrainage ne peut plus s'activer par un soin du pet ; la « 1ʳᵉ action » V5 est la **1ʳᵉ sortie vécue** (`social` : place `ATTENDED` dans `activationFacts`, consommateur `outing.attendance_recorded`). La récompense reste en pièces (V4) — voir limites.

### Parcours V4 remplacés par des équivalents V5 (même intention)
| Parcours | Avant (V4) | Maintenant (V5) |
|---|---|---|
| `ines-proposee-a-deux-hommes-en-meme-temps` (Triangle) | Inès proposée à Karim et Théo, emménagement concurrent | 11 personnes, 2 créneaux : Inès dans **un seul** groupe (I-O2), invisible pour l'autre ; double tap sur deux téléphones → une place, une 1ʳᵉ offerte ; 2ᵉ demande 409 ; 2ᵉ place forcée en base refusée par l'index ; backfill sans elle ; ≤ 3 du même genre par groupe |
| `maya-achete-puis-se-fait-rembourser` | pièces, gel, boost, bénéfices mensuels | produits V5, sync forgé sans effet, place payée 4,99 € (double tap → un paiement), annulation avant la confirmation → **carte remboursée une fois, aucun crédit**, 1ʳᵉ offerte intacte ; Blowy+ démo → `v5Entitlements`, quota hebdo inchangé ; webhook sans secret 401 ; V4 → 410 ; expiration |
| `lea-et-hugo-de-la-rencontre-a-la-rupture` | pets qui se rencontrent, XP de Lien, emménagement, vote de branche, révélation photo | voie Duo : pet + initiale, double oui silencieux, chat modéré (averti, rejeté, signalé sans effet), rien avant 48 h, visages simultanés, RDV + check-in, bulletins secrets → ensemble, départ propre sans pénalité |
| `alex-invite-son-quartier` | +100 au 1ᵉʳ soin du pet ; « Qui a écrit ? » | « Qui a écrit ? » → 410 ; Alex et ses filleul·es **sortent ensemble** : la 1ʳᵉ sortie vécue active chaque parrainage, une fois ; soin d'un pet d'ami → 410 |
| `jade-et-ses-deux-telephones` | rejeu d'un soin, déplacements simultanés | rejeu d'une commande V5 (intentions) : même résultat, payload différent → 409 ; déplacements → 410 des deux côtés |
| `nora-se-protege-de-victor` | IDOR sur gestes/branche/photo | IDOR inchangé sur les routes vivantes (404) ; gestes, photo, branche → 410 identique |
| V5 existants adaptés | `cinq-inconnus-un-jeudi`, `annulation-apres-verrou`, `ines-paie-sa-place` | prénoms à la confirmation, signature par le pet dans le chat, `STAYS_FREE`, comptage du journal scopé au paiement (la base des parcours est partagée et l'ordre des fichiers varie) |

Intégration adaptée (routes retirées) : `concurrency`, `idor`, `journey`, `privacy`, `reliability`, `trust-media`, `social.int` ; nouveaux tests : prénoms à `lockAt` (`outings-v5`), demande automatique (`outings-v5`), vocal en duo (`connections-v5`), position ignorée (`safety-v5`).

## Fichiers modifiés
- **API** : `bootstrap.ts` ; `shared/interface/retired-routes.middleware.ts` (nouveau) ; `shared/application/ports/message-author.port.ts` (nouveau) ; `modules/outings/{domain/visibility.ts, domain/seat-policy.ts, application/seats.use-cases.ts, application/lifecycle.service.ts, application/requests.use-cases.ts, application/ports/outings.repository.ts (+autoRequestCandidates), infrastructure/prisma-outings.repository.ts (+autoRequestCandidates), infrastructure/message-authors.ts (nouveau), outings.module.ts, __tests__/outings-domain.test.ts}` ; `modules/conversations/{application/message.serializer.ts, read-messages.query.ts, moderate-message.use-case.ts, conversations.module.ts}` ; `modules/connections/{application/deps.ts, duos.use-cases.ts, queries.ts, duo-lifecycle.ts, domain/duo-policy.ts, connections.module.ts}` ; `modules/economy/{domain/payments.ts, application/payments/seat-funding.service.ts, application/use-cases/queries.ts, infrastructure/config/payments-params.ts, __tests__/payments.test.ts, __tests__/payments.int.test.ts}` ; `modules/safety/{domain/guardian.ts, application/safety.use-cases.ts, application/ports/safety.ports.ts, infrastructure/prisma-safety.repository.ts}` ; `modules/media/{application/media.use-cases.ts, media.module.ts}` ; `modules/social/{infrastructure/prisma-social.repositories.ts, interface/social.consumers.ts, __tests__/social.int.test.ts}` ; `modules/trust/infrastructure/prisma-privacy.repository.ts` ; `modules/neighborhoods/application/neighborhoods.use-cases.ts`.
- **Tests** : `test/unit/retired-routes.test.ts` (nouveau) ; `test/integration/{concurrency, idor, journey, privacy, reliability, trust-media, outings-v5, connections-v5, safety-v5}.test.ts`, `e-helpers.ts` ; `test/journeys/{ines-proposee-a-deux-hommes-en-meme-temps, maya-achete-puis-se-fait-rembourser, lea-et-hugo-de-la-rencontre-a-la-rupture, alex-invite-son-quartier, jade-et-ses-deux-telephones, nora-se-protege-de-victor, cinq-inconnus-un-jeudi, annulation-apres-verrou, ines-paie-sa-place, lea-et-son-ange-gardien, la-semaine-de-lea-en-notifications}.journey.ts`, `support/v5.ts` (+`v5Setup`).
- **Contrats** (`packages/api-contract/src`) : `outings.ts` (`storyMatch`, motifs `NEIGHBORHOOD_UNAVAILABLE`, `AGE_VERIFICATION_REQUIRED`), `neighborhoods.ts` (`threshold` retiré), `connections.ts` (`quota`, `AGE_VERIFICATION_REQUIRED`), `conversations.ts` (`MessageView.author`), `economy.ts` (`v5Entitlements`), `media.ts` (`conversationId`).
- **Domaine (A, ajouts minimaux)** : `packages/domain/src/outing.ts` (`REFUND_MODES += STAYS_FREE`), `economy.ts` (`ENTITLEMENT_KEYS_V5`).
- **Tuning (B)** : `schema-v5.ts`, `defaults-v5.ts`, `schema.ts`, `defaults.ts`, `tuning.test.ts` → `tuning-2026.12.3`. **Matching (B)** : `groups/{objective, compose, backfill, pairs, groups.test}.ts`.
- **Schéma** : `schema.prisma` (index `DomainEvent`), migration `20261106180000_v5_align`.
- **Docs** : `docs/product/spec-v5.md` (révision 4 : §4, §7, §8.1, §11.2, §11.4), `docs/agents/integration-status.md` (section V5), ce fichier.

## Composition : coût de la contrainte de genre (`pnpm simulate:outings`, seed `blowy-outings-2026`, garantie activée)
| Candidats | Placés avant → après | Garantie histoire | Groupes |
|---|---|---|---|
| 300 | 80,3 % → **76,7 %** | 54,6 % | 47 |
| 600 | 82,2 % → **80,3 %** | 57 % | 98 |
La perte vient des groupes à 4 personnes du même genre qui ne se forment plus (le simulateur tire 47 % de femmes, 45 % d'hommes).

## Limites
- Parrainage V5 : l'activation passe bien par la 1ʳᵉ sortie vécue, mais la récompense est encore en **pièces V4** (ledger gelé) ; l'accessoire de parrainage (`referral.first_outing_lived` → `pets`, `[T] accessories.referralAccessoryId`) reste à faire (C + F).
- « Je connais quelqu'un » accepté : la personne est retirée et prioritaire, pas encore **déplacée** vers un autre groupe du même créneau.
- `KNOWN_CONTACT` / évitement de contacts : non fait (E + B, hors §11.4).
- Le tuning garde `plus.includedOutingsPerMonth`, `includesMonthlyAccessory` et `accessories.plusMonthlyAccessoryIds` (valeurs neutres) : les retirer du schéma est à B.
- `/v1/matches` (flux V4) toujours servi : pas dans la liste des routes retirées.
- `HUMAN_RESPONSE_MINUTES` reste une constante dans deux consommateurs sécurité (dossiers staff) ; la valeur exposée à l'utilisateur vient du tuning.
- `AGE_VERIFICATION_REQUIRED` est renvoyé quand aucune vérification valide n'existe (le selfie porte l'estimation d'âge) ; le cas « document exigé si doute » attend la vérification 18+ d'E.

## Hors périmètre touché (ajouts minimaux, à relire par le propriétaire)
- **E** : `safety` (position ignorée, seuils du tuning, fenêtre de comptage), `media` (vocal en duo), `trust` (export RGPD).
- **F** : `social` (activation du parrainage par la 1ʳᵉ sortie vécue ; test d'intégration adapté au 410).
- **G** : `economy` (D-042, paramètres du tuning, `v5Entitlements`) ; parcours `la-semaine-de-lea-en-notifications` : l'assertion « aucun texte d'alerte chez les autres » testait tout le JSON des pushs et échouait au hasard dès qu'un UUID contenait « 112 » → elle ne porte plus que sur les titres et corps (`\b112\b`).
- **C2** : `connections` (`DUO_ALLOWANCE`, `quota`, `{upgrade:false}`, `maxOpenProposals`).
- **B** : tuning + matching (ci-dessus). **A** : `@blowy/domain` (deux constantes).

## Demandes à d'autres propriétaires
- **A** : valider `REFUND_MODES += STAYS_FREE` et `ENTITLEMENT_KEYS_V5 = [PLUS_INCLUDED_OUTINGS, PLUS_UNLIMITED_DUOS]` ; décision formelle « journal économique sur `DomainEvent` » dans `decisions.md` si souhaité.
- **B** : relire `genderCapOk` (exception non mixte, `UNDISCLOSED`) et `tuning-2026.12.3` ; retirer les champs Blowy+ morts du schéma ; `KNOWN_CONTACT`.
- **D** : `refund` peut valoir `STAYS_FREE` (afficher « ta 1ʳᵉ sortie reste offerte », jamais « remboursé·e ») ; membres d'une sortie avant la confirmation = pets seulement ; `MessageView.author` pour signer les messages du chat de sortie ; `GET /v1/duo-lane` → `quota` ; vocal en duo (upload avec `conversationId`) ; motifs `NEIGHBORHOOD_UNAVAILABLE`, `AGE_VERIFICATION_REQUIRED` ; les routes V4 de `retired.ts` répondent 410.
- **F** : finance → tables dédiées `Payment`/`VenueCompensation` derrière le port `EconomyJournal` quand l'écran en aura besoin ; accessoire de parrainage V5.
- **G** : notifications : `outing.composition_changed` peut annoncer « ta 1ʳᵉ sortie reste offerte » (`refundState=RECREDITED` sur une place `FREE_FIRST`).
- **H** : relire les parcours réécrits (tableau ci-dessus).
