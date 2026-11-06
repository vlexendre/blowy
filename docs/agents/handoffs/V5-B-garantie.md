# Handoff V5 — B : garantie « pour toi » (concept-v5.2 §B) — 2026-11-06

Propriétaire B (`packages/matching`, `packages/tuning`) + branchement minimal dans `apps/api/src/modules/outings`.
**Décision orchestrateur en cours de mission (jury tour 3, Yanis + Thomas)** intégrée : la garantie est appliquée par la composition mais **jamais exposée** ; seul le cas négatif « cette semaine, sortie potes uniquement pour toi » sort, sans chiffre, dans la seule vue de l'intéressé·e.

## Fichiers modifiés
- `packages/tuning/src/schema-v5.ts` : `StoryGuaranteeTuningSchema` (`enabled`, `minCompatible` 1–5, `lambdaGuarantee`), `STORY_GUARANTEE_DEFAULTS`, champ `composition.storyGuarantee` avec `.default()` (payload antérieur lisible).
- `packages/tuning/src/defaults-v5.ts` : `storyGuarantee: { enabled: true, minCompatible: 2, lambdaGuarantee: 16000 }`, `algoVersion: groups-2026.12.1`.
- `packages/tuning/src/defaults.ts` : `tuning-2026.12.2` ; `tuning.test.ts` (+1 test).
- `packages/matching/src/groups/pairs.ts` : `storyCompatible` (romance des deux, genres réciproques, tranches FIXES `ageBracketOf` recoupant la tranche souhaitée de l'autre), `StoryMember`, `storyFriendsOnly(members, tuning)` (booléen par personne, hors team) ; `PairTable.story(i,j)` (même règle, précalculée).
- `packages/matching/src/groups/objective.ts` : `GroupEvaluation.storyGuaranteed`, terme `+λ·storyCov‰/1000` dans J si `enabled`, `friendsOnlyFlags`.
- `packages/matching/src/groups/compose.ts` / `types.ts` / `index.ts` : `ComposedGroup.friendsOnly: Record<userId, boolean>` (toutes les clés), stats `storyGuaranteeCoverage`, `friendsOnlyMembers` ; exports.
- `packages/matching/src/groups/groups.test.ts` : invariants étendus + bloc « garantie pour toi » (5 tests) ; perf réécrite (médiane de 3, budgets 5 s / 20 s).
- `packages/matching/src/simulate/outings-cli.ts` : chaque taille en garantie désactivée puis activée ; colonnes `garantieHistoire`, `potesUniquement`.
- `apps/api/src/modules/outings/application/queries.ts` : `storyMatch` = `storyFriendsOnly` de `@blowy/matching/groups` sur le groupe actuel (places actives, bloqué·es retiré·es) ; `OutingQueries` reçoit le tuning.
- `apps/api/src/modules/outings/outings.module.ts` : injection `OUTINGS_TUNING` dans `OutingQueries`.
- `apps/api/src/modules/outings/domain/visibility.ts` : `storyMatchFor(viewer, friendsOnly)` → `'FRIENDS_ONLY' | undefined` (plus jamais `AT_LEAST_TWO`).
- `apps/api/src/modules/outings/__tests__/outings-domain.test.ts` : tests adaptés + règle (team, tranche).
- `apps/api/test/journeys/fuite-intention-impossible.journey.ts` : balayage `GUARANTEE` (`AT_LEAST_TWO|guarantee|garantie|friendsOnly|storyCompatible`) de **toutes** les vues HTTP (données entières) et de tous les événements WS à chaque état ; Alice (garantie) n'a plus de `storyMatch`.
- `docs/engine-rules.md` §12.1.

## Tests exécutés
- `pnpm turbo run build typecheck test lint --filter=@blowy/matching... --filter=@blowy/api` → 20/22 OK ; tests domain/tuning (11)/matching (29)/api unit (9 fichiers) verts. **Échec `@blowy/api#typecheck` hors périmètre** : `src/modules/connections/domain/duo-policy.ts(87)` (`t.outings.checkinOpensBeforeMinutes` inexistant), fichier modifié pendant ma mission par un autre agent (C2). `tsc --noEmit` de l'API filtré hors `connections` : 0 erreur ; `eslint src/modules/outings` + parcours modifié : 0 erreur. 1er essai : `@blowy/database#build` a échoué par course `prisma generate` (build ∥ typecheck), vert au 2ᵉ.
- `pnpm --filter @blowy/api test:integration` → 14 fichiers, 72/72.
- `flock .local/journeys.lock pnpm --filter @blowy/api test:journeys` → 110 ✅ / 2 ❌ / 9 ⛔ (les 2 ❌ = Triangle 04 et 10, V4 connus, inchangés).
- `pnpm simulate:outings` (+ `2000`) → tableau ci-dessous.

## Taux de placement et garantie (seed `blowy-outings-2026`, désactivée → activée)
| Candidats | Placés | Garantie (≥ 2) | « Potes uniquement » | Score moyen |
|---|---|---|---|---|
| 300 | 77,3 % → 80,3 % | 10,4 → 54 % | 86 → 46 | 57 → 55 |
| 600 | 82,2 % → 82,2 % | 10,2 → 58,2 % | 183 → 86 | 60 → 58 |
| 2 000 | 85,3 % → 85,5 % | 13,2 → 54,3 % | 643 → 343 | 63 → 62 |
2 000 candidats ≈ 1,7 s.

## Décisions
- **Garantie = objectif + marquage, pas contrainte dure** : une contrainte « ≥ 2 » ferait chuter le placement (groupes de 5) ; V5.2 B.6 prévoit le cas « potes uniquement ». La contrainte dure existante (« histoire seulement » ⇒ ≥ 1 rom-compatible) est conservée.
- **Marquage toujours honnête** : `enabled=false` coupe seulement l'optimisation, jamais le calcul du booléen.
- **Tranches fixes** pour l'âge (jamais l'âge exact dans cette règle) ; la team ne compte pas (ce sont des potes venus ensemble) ; une personne bloquée est retirée côté API.
- **Booléen seul** : `friendsOnly` a une clé par membre ; `false` ne distingue pas « garanti » de « ne cherche pas d'histoire » ; ni qui ni combien. Testé (structure exacte du groupe, aucune occurrence de genre/intention, invariance quand on change *lesquels* sont compatibles).
- **API recalcule à la lecture** avec la même fonction pure que la composition (pas de colonne : schéma = C). Le groupe peut changer après composition (backfill, annulation, blocage) : la lecture reflète le groupe actuel. Les agrégats `storyGuaranteeCoverage`/`friendsOnlyMembers` arrivent dans `CompositionRun.stats` via `result.stats` (aucun identifiant).
- **Exposition** (jury tour 3) : jamais `AT_LEAST_TWO` ; `storyMatch: 'FRIENDS_ONLY'` seulement pour l'intéressé·e, phases INVITED→CHECKIN (inchangé).

## Migrations
Aucune.

## Limites
- Plafond structurel ≈ 55–60 % de garantis sur la population synthétique (45 % de chercheurs d'histoire, 80 % hétéro, groupes de 5). Pistes : proposer un autre créneau / le Duo aux « potes uniquement » (B.6), λ par quartier.
- Les échanges locaux ne portent que sur des groupes voisins d'une même classe (inchangé).

## Demandes aux autres propriétaires
- **C** (`packages/api-contract/src/outings.ts`) : réduire `OutingView.storyMatch` à `z.literal('FRIENDS_ONLY')` et mettre à jour la doc (l'API n'émet plus `AT_LEAST_TWO`) ; option : persister `friendsOnly` à la composition si l'on veut figer la proposition (aujourd'hui recalcul à la lecture).
- **C2** : `connections/domain/duo-policy.ts` ne compile pas (`t.outings.checkinOpensBeforeMinutes` → `t.outings.cycle.…` ?).
- **D** (mobile) : n'afficher que « Cette semaine, sortie potes uniquement pour toi » (+ autre créneau / Duo) quand `storyMatch === 'FRIENDS_ONLY'` ; supprimer tout libellé « Au moins 2 personnes… ».
- **A** : décision formelle (garantie non exposée, jury tour 3) dans `decisions.md` ; amender concept-v5.2 B.5 (phrase affichée supprimée) ; valider `tuning-2026.12.2` / `groups-2026.12.1`.
