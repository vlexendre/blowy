# Handoff — UI-fondation (fondation visuelle pixel-perfect)

Date : 2026-11-06. Périmètre : `packages/design-tokens`, `packages/ui-mobile`, `apps/mobile`
(polices, route interne), docs. Aucun écran produit créé ; `apps/api`, `packages/database`,
`design/**`, `tooling/qa/**` non modifiés.

## Résultat
- **V4-Welcome reproduit uniquement avec les composants : 1,01 % de pixels différents**
  (`pnpm qa:visual -- --only V4-Welcome --route '/(dev)/kitchen-sink?t=2550'`, pixelmatch 0,1,
  AA exclu, compteur masqué ; basse rés. 1,10 % ; sans masque 1,21 %). Avant : 48,3 %.
  Contre la maquette re-rendue au même instant : 0,17 %. Plancher de la référence elle-même : 0,76 %.
- Cause systémique signalée par l'orchestrateur (titres trop larges) corrigée : instances
  Bricolage `wdth 85` avec **opsz = taille** ; largeurs mesurées identiques au pixel à la police
  variable des maquettes (Inter 13 px : 303/303 px ; `.d` 29 px : 314/314 px).

## Fichiers
- `docs/design/design-language.md` (nouveau) : relevé exhaustif CSS → RN (couleurs, typo, ombres,
  rayons, halos, barre d'onglets, 10 animations exactes + inventaire des autres), preuve pixel.
- `packages/design-tokens/src/index.ts` (ajouts compatibles : `alpha`, `radii`, `layout`,
  `shadow3d`, `press`, `displayFace`, `strongFace`, `opticalSizes`, `bodyWeights`, `textSpec`,
  `blob`, `easing`, `keyframes` ; couleurs ajoutées ; `type` aligné : interlignes .95, `.lbl` 700,
  `hardShadow` blanc = `#E8D9C4`, `motion.pop` 650), `tokens.test.ts` (nouveau), `contrast.test.ts`.
- `packages/ui-mobile/src/foundations/` : `typography.ts`, `keyframes.ts`, `motion-clock.tsx`,
  `blur.ts`, `layout.ts` (nouveaux) ; `theme.ts` (familles), `accessibility.tsx` (verre sur web),
  `index.ts` ; `fondation.test.ts`.
- `atoms/` : `DisplayText`, `Label`, `Caption`, `Stamp`, `Card`, `Blob`, `PopIn`, `styles.ts`
  (+ `styles.test.ts`) nouveaux ; `Button`, `Chip`, `Badge`, `Pressable3D`, `Icon` (`arrow`,
  `filled`) réécrits à API compatible (anciens noms de variantes conservés).
- `molecules/PetSprite.tsx`, `molecules/OrbitRing.tsx` ; `organisms/TabBar.tsx` (`.gnav` exact) ;
  `templates/ScreenTemplate.tsx` ; `pure.ts` ; `vitest.config.mts` (commentaire).
- `apps/mobile` : `scripts/fonts/build-fonts.py`, `assets/fonts/*.ttf` (40 instances, 1,8 Mio) +
  `OFL-*.txt`, `src/core/fonts/{index.ts,font-files.generated.ts,fonts.test.ts}`,
  `app/_layout.tsx` (useFonts), `app/(dev)/{_layout,kitchen-sink}.tsx`, `src/features/dev/**`,
  `src/i18n/fr.json` (clés `devKitchen.*`), `package.json` (+`@fontsource-variable/*` dev,
  −`@expo-google-fonts/*`), lockfile via `flock .local/pnpm.lock`.
- `packages/sprites/scripts/inventory.mjs`, `docs/mobile/assets-inventory.md`,
  `docs/mobile/architecture.md` : provenance des polices, nouveaux composants.

## Tests exécutés
- `pnpm --filter <p> run typecheck|lint|test` pour design-tokens (31 tests), ui-mobile (35),
  mobile (66), ui-web, sprites (14) : tous verts.
- `pnpm qa:visual -- --only V4-Welcome --route '/(dev)/kitchen-sink?t=2550'` → 1,0 %.
- `pnpm qa:visual` complet → 38/39 mesurés, moyenne 47,4 % (référence H-visuel 47,3 % : les écrans
  produit ne sont pas encore recomposés), aucune erreur de page.

## Décisions
- Instances statiques (pas de police variable) : RN natif ne règle ni `wdth` ni `opsz`. Une
  instance par taille `.d` relevée ; la table `prep` est conservée (sans elle Chrome rend +2,5 %
  plus large). Regénérer : `python3 -I apps/mobile/scripts/fonts/build-fonts.py` (fonttools+brotli).
- Inter 800 des maquettes rendu en 700 (Google n'y charge que 400–700) : `bodyFamily(800)` → 700.
- Halos : profil exact disque ⊛ gaussienne en dégradé radial SVG (aucun filtre natif portable).
- Animations : moteur de keyframes CSS pur (worklet) + horloge `live/rest/frozen` ;
  « Réduire les animations » = pose de repos ; `frozenAtMs` pour les captures.
- La référence Welcome est un instant d'animation : t = 2 550 ms retrouvé par recherche
  (`.local/ui-fondation/render-mock.mjs`, `diff.py`, `cmp.mjs`).
- Fidélité au rendu : tampon lime droit sur Welcome (la classe `pop` écrase `rotate(-2deg)`),
  puce pulsée sans ombre portée (l'animation `pulse` la remplace).

## Limites / écarts restants
- Corail sur crème 2,92:1 (< 3:1) dans la maquette : documenté, à trancher en V5.
- Mesure faite en web (react-native-web) ; sur iOS natif l'interligne < hauteur de police place
  le texte différemment de CSS (à vérifier sur appareil avec les écrans V5).
- Les écrans produit existants utilisent les nouveaux atomes (rendu plus proche), mais leur
  composition n'a pas été refaite (attente V5). `PetRenderer`/`Surface`/`OnboardingStepTemplate`
  inchangés.
- Avatars / visages masqués : pas de motif générique dans V4 ; à faire avec les écrans V5.

## Demandes à d'autres propriétaires
- QA (H-visuel, `tooling/qa/visual/run.mjs`) : `APP_FONTS` cite les anciennes familles
  `@expo-google-fonts` ; remplacer par `ALL_FONT_FAMILIES` de `@blowy/ui-mobile/pure` (ou
  `BricolageGrotesque-D*/B*`, `Inter-400…700`). Le rapport est correct (faces `loaded` listées).
  Suggestion : `routes.v4.json` peut pointer V4-Welcome vers `/(dev)/kitchen-sink?t=2550` comme
  écran-témoin de la fondation.
- ui-web : `src/tokens.css` est généré depuis `color` ; de nouvelles couleurs existent
  (`node packages/ui-web/scripts/write-tokens-css.mjs` pour les exposer).
