# Handoff B — Domaine/jeu (tuning, pet-engine, matching, content)

## Fichiers
- `packages/tuning/src/` : `schema.ts` (Zod `TuningSchema` + raffinements : poids = 1, matrices symétriques, seuils croissants, lot strong+discovery=size, diviseur nocturne | 12, plafond action ≥ plafond gain), `defaults.ts` (`DEFAULT_TUNING` gelé, `tuning-2026.11.0`, `HYPOTHÈSE` marquées), `economy.ts` (vue pièces pour l'agent G), `math.ts` (clamp, mulDivFloor, PERMILLE : helpers partagés une seule fois), `freeze.ts`, `index.ts`, `tuning.test.ts`.
- `packages/pet-engine/src/` : `model/` (états, événements, effets, contexte), `shared/` (unités entières, compteurs journaliers, côtés, seuils), `time/` (calendrier, IANA via Intl, intervalles/pauses, jour/nuit, admissible), `random/` (PRNG cyrb128+sfc32, refus), `gauges/` (taux, intégration exacte, ajustements, pose), `relationship/` (lieu, pauses, contributions/k, gain k·m, interaction), `progression/` (niveaux et portes, matrice de capacités, XP pet), `actions/` (un handler par action + `registry.ts`, `together.ts` = template câlin/jeu), `world/` (accumulateurs Strategy + avanceur), `egg/`, `group/`, `notify/`, `factory.ts`, `reduce.ts` (dispatcher), `simulate/` (run, profils, CLI ; tsconfig propre car il utilise Node), `test/` (scénarios).
- `packages/matching/src/` : `types.ts` (DTO minimal), `score/` (un fichier par composante + `vision.ts`), `filters/` (`CandidateFilter[]` composables), `batch/` (équité d'exposition, sélection), `matching.test.ts`.
- `packages/content/src/catalog/` (vision, egg, missions, lines, templates, validate), `src/locales.ts`, `scripts/write-locales.ts`, `locales/fr.json` (généré au build, test d'égalité), `content.test.ts`.
- `docs/engine-rules.md`.
- package.json : pet-engine `+@types/node` (dev) et scripts `typecheck` ; content `+@blowy/tuning`, `+@types/node`, `+tsx` (dev), build `tsc && tsx scripts/write-locales.ts`, `files`/`exports` incluent `locales/fr.json`. Ajouts faits via `flock … pnpm --filter <pkg> add` (lockfile mis à jour).

## API publique (principales signatures)
```ts
// @blowy/tuning
TuningSchema; type Tuning; DEFAULT_TUNING: Readonly<Tuning>; DEFAULT_TUNING_VERSION
parseTuning(input: unknown): Readonly<Tuning>            // lève ZodError
safeParseTuning(input: unknown)
coinRewards(t): { missionDaily, streakMilestoneDays, streakMilestoneCoins, referralReferrer, referralReferee, neighborhoodFeed, plusMonthlyCoins, plusMonthlyStreakFreezes }
catalogPrices(t): { streakFreeze, visibilityBoost, giftBasic }
petXpWeekendMultiplier(t, hasWeekendEntitlement, isLocalWeekend): number
clamp, clamp01, mulDivFloor, PERMILLE; type NotificationCategory

// @blowy/pet-engine
reduce(world: World, event: EngineEvent, ctx: EngineContext): { state: World; effects: EngineEffect[] }
reduceMut(world, event, ctx): EngineEffect[]             // copie de travail possédée par l'appelant
advanceWorld(world, toMs, ctx): { state; effects }        // ticks 15 min / rattrapage
advanceTime(pet: PetState, fromMs, toMs, tz, pauses: Interval[], tuning): PetState
poseFor(pet, nowMs, tuning): PetPose ; displayGauges(pet) ; isSick ; needsVitalHelp
resolveCall(i: CallDecisionInput, t): { refused; probability; forcedAccept } ; refusalProbability(i, t)
rngFrom(seed: string, ...salt: string[]): () => number
balanceFactorPermille(a, b, t) ; kPermilleFor(rel, nowMs, t) ; affinityMultiplierPermille(aff, t)
computeLinkGain = linkGainMilli(basePoints, kPermille, mPermille): milli ; quoteLinkGain(rel, base, nowMs, t)
eligibleLevel(xpMilli, t) ; reachableLevel(rel, t) ; gateOpen(level, gates, t)
capabilitiesFor(rel, { paused, tuning }): Set<Capability> ; canTransferToNeighborhood(rel, t) ; CAPABILITY_RULES
inherit(HeredityInput, t): { axes; passion; seed } ; composeBabyName([a, b], t)
groupCohesion(members, edges) ; groupGainsActive(n, t) ; groupMissionValid(ids, t)
planNotifications(candidates, sentToday, nowMs, tz, t): { send; held }
createPet / createRelationship / createEgg / defaultGates / emptyWorld ; ENGINE_VERSION
localDayKey, isLocalWeekend, wallToUtc, splitDayNight, localParts, offsetAt
Types : World, PetState, RelationshipState, SideState, ProgressionGates, MissionRewardContext, EggState, EngineEvent, EventInput, EngineEffect, RejectReason, EngineContext

// @blowy/matching
scoreVision(viewer: MatchProfile, candidate: MatchProfile, distanceKm, t): ScoreBreakdown  // {C,P,D,E,R,G,S,M,score 0–100}
characterScore, passionScore, sundayScore, schoolScore, speciesScore, rhythmScore, geographyScore, reputationScore
FILTERS: CandidateFilter[] ; firstExclusion({a,b,facts,tuning}, filters?) ; allOf(...)
selectBatch(viewer, candidates: CandidateInput[], seed, t): { proposals; excluded; eligibleCount; state: 'OK'|'EMPTY_ZONE' }
exposureAdjustment({ recentImpressions, boostActive }, t)

// @blowy/content
SCHOOL_ENTRIES, SUNDAY_ENTRIES, PASSION_ENTRIES, LIMIT_ENTRIES, ANONYMOUS_WORD_ENTRIES, DATE_SPOT_BY_SUNDAY
EGG_QUESTIONS (12), MISSIONS (14), PET_LINES (85), candidateLines(species, trait, situation)
DEPARTURE_TEMPLATES, NOTIFICATION_TEMPLATES (system: true), TEMPLATE_VARIABLES, LineTextSchema, EntrySchema
buildFrLocale(): Record<string,string> ; fichier `@blowy/content/locales/fr.json`
```

### Intégration backend (C / G)
- Le backend charge sous verrou la tranche `World` concernée (pets + relations + œufs + paires Quartier), appelle `reduce` avec `now` serveur, `seed` = graine persistée de la relation ou du pet (jamais fournie par le client) et `eventId` serveur, persiste `state`, puis traduit `effects` en outbox. Correspondances : `COINS_CREDIT` → ledger (clé d'idempotence fournie), `NOTIFY` → planner (`planNotifications`), `RELIABILITY_PENALTY` et `RELIABILITY_RECOVERY_ELIGIBLE` → fiabilité, `RELATIONSHIP_SILENCE_CLOSE` → fin de relation + modèle `departure.silence_14d`, `LEVEL_REACHED` (3) → proposition d'emménagement.
- Messages : n'envoyer `MESSAGE_PUBLISHED{human:true}` que pour un message humain **publié** (après modération). Mission : `MISSION_VALIDATED` uniquement après APPROVED ; une revue répétée doit réutiliser le même `eventId`.
- Cadeau : débiter d'abord l'objet (ledger), puis `GIFT{itemDebited:true}`.
- Portes de consentement : la vérité est dans les tables de consentement ; publier la **branche effective** via `GATES_UPDATED` (jamais un vote individuel).
- Le moteur garde `missionContexts` 3 jours et `recentEventIds` 256 ; la contrainte unique DB reste l'autorité.

## Tests exécutés (2026-11-01)
```
pnpm --filter @blowy/tuning --filter @blowy/pet-engine --filter @blowy/matching --filter @blowy/content build   → OK
pnpm --filter @blowy/pet-engine --filter @blowy/matching --filter @blowy/tuning --filter @blowy/content test    → tuning 6/6 · matching 9/9 · content 8/8 · pet-engine 62/62
pnpm simulate:balance  → OK (≈ 12 s, 2000 relations × 60 j)
npx eslint packages/pet-engine/src packages/matching/src packages/tuning/src packages/content/src  → 0 erreur
```
Couverture §21 : n°4 (`scenario4-call.test.ts` : formule p exacte et bornée, le 2ᵉ appel cède, aide malade jamais refusée sur 200 graines, rejeu idempotent, l'identifiant client n'influence pas le tirage) ; n°5 (`scenario5-time.test.ts` : ticks == rattrapage en mars/octobre/ordinaire avec pauses chevauchantes, propriété fast-check de découpage arbitraire, double tick sans effet, nuit ÷4 et +6 net, nuits de 8 h et 10 h, santé après 12 h et borne 1, jauges ∈ [0,100]) ; n°6 (`scenario6-gains.test.ts` : k pour a=b / a=0,b>0 / a+b=0, snapshot avant l'événement, plafonds jeux/câlin/messages avant k·m, NO_GAIN vs ACTION_CAP, mission commune a→b == b→a, gel maladie) ; plus `progression.test.ts` (portes, matrice, Ami ≤ 6, week-end XP pet, sens des axes, œuf, nom, hérédité, bande, notifications), `thresholds.test.ts` (48 h unique, absence, −8 une fois à 72 h, clôture 14 j et pause), et `matching.test.ts` (C, P, G sans division par zéro, bornes en propriété, filtres réciproques, zone vide, lot 2+1).

## Résultats du simulateur (seed `blowy-balance-2026`)
Médiane N2 9 j · N3 23 j · N5 46 j · N7 57 j ; part à J60 : N2 42 %, N3 19,3 %, N5 6,5 %, N7 0,3 %. **N3 à J14 : 2,2 %** (hypothèse 20 %, seuil 500 non modifié ; paires assidues 64 %). Pièces : 8,4 créées par personne et par jour, 55 % dépensées. Maladie : 15 % du temps-pet actif. Sorties silencieuses : 32,7 %. Détail et lecture dans `docs/engine-rules.md` §11. → **Décision produit requise** (plafonds de messages, XP de mission, ou cible).

## Hypothèses (toutes dans `defaults.ts`)
Plafonds d'action câlin 10 / jeu 15 ; soin +40 santé et 0 XP ; nourrir +30, XP +5 ×3/j ; XP pet mission 20 ; stades 300/1500 ; tension refus +2, cadeau −5, mission commune −5, attente > 48 h +5 (une fois) ; envie +2 par action partagée ; plafond d'humeur d'inactivité 20/j ; plafonds de contributions 20/8/3 ; matrices dimanche/école/espèces ; R neutre sous 20 événements ; M neutre sous 3 mots, saturation à 30 ; découverte ≥ 40 ; quota de propositions 6 ; équité ±10, boost +8 ; delta d'hérédité ±0,3 ; réaction 4 s ; fenêtre de coalescence des notifications 60 min ; prix d'un cadeau simple 60. Profils du simulateur entièrement hypothétiques.

## Demandes à l'orchestrateur (domain)
1. Déplacer `clamp`, `clamp01` et `mulDivFloor` de `@blowy/tuning/math.ts` vers `@blowy/domain` (helpers purs ; placés provisoirement dans tuning, seule dépendance commune).
2. Ajouter à `domain` un type `TemplateVariable = 'autrePet'|'lieu'|'souvenir'|'pet'|'nombre'` si l'admin contenus doit valider les variables côté serveur (aujourd'hui dans `@blowy/content`).
3. Optionnel : `Capability` pourrait gagner `TRANSFER_TO_NEIGHBORHOOD` (exposé aujourd'hui par `canTransferToNeighborhood`).

## Demandes schéma (C)
Persister par relation : `engineState JSONB` (RelationshipState), `engineVersion`, `tuningVersion`, `seed` (serveur, non modifiable) ; par pet : `PetState` JSON + `seed`. Table `mission_reward_contexts` (relationId, missionId, dayKey) UNIQUE, avec kPermille, mPermille, versions et crédits par côté (le moteur l'embarque aussi dans l'état ; la table assure l'unicité DB). Table `egg_sessions` (eggId, night) UNIQUE ; naissance UNIQUE par œuf.

## Limites
- Conversion IANA dépendante des données ICU du runtime Node/Hermes (même version requise côté mobile pour un affichage optimiste identique).
- Garde alternée du bébé, ligues et défis Quartier : hors moteur (V3, agent G), seules les primitives sont fournies (cohésion, pet enfant `kind:'CHILD'`).
- Le simulateur modélise des comportements hypothétiques et approxime la série de 7 jours ; ce n'est pas une prédiction de rétention.
- Le plafond quotidien de récupération de fiabilité (+1/j) est émis comme effet ; le score de fiabilité lui-même vit côté backend (C).
