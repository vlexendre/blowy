# Banc QA visuel (`pnpm qa:visual`)

Propriétaire : agent H-visuel. Compare chaque écran de l'app, rendu par Expo web dans Chromium
(390×844 @2x, safe areas 47/34 émulées), au rendu PNG de sa maquette.

## Usage rapide

```bash
pnpm qa:visual                                        # 39 écrans V4 → .local/qa/visual/index.html + results.json
pnpm qa:visual -- --only V4-Welcome,V4-Nid            # sous-ensemble
pnpm qa:visual -- --only V4-Welcome --route '/(dev)/kitchen-sink'   # une route de travail contre une maquette
pnpm qa:visual -- --only V4-Nid --route /nest --account alex        # compte de démo (ou --account none)
pnpm qa:visual -- --ref design/v5/renders             # jeu de références V5 (→ routes.v5.json)
pnpm qa:visual -- --rebuild | --no-build | --threshold 0.1 | --insets 0,0 | --max-diff 0.25
```

- Mettre la route entre guillemets (parenthèses du groupe expo-router) ; les groupes `(x)` sont
  retirés de l'URL web automatiquement.
- L'export Expo web est refait automatiquement si `apps/mobile/{app,src,assets}`,
  `packages/{ui-mobile,sprites,design-tokens}` ou `capture/` ont changé (sinon réutilisé).
- Prérequis : Postgres + Redis lancés, base migrée et seedée. L'API (`apps/api/dist`, port 3000)
  et le site web (`apps/web/.next`, port 3002) sont démarrés par le banc s'ils ne répondent pas.
- Sortie : `.local/qa/visual/{index.html,results.json,ref/,app/,diff/}`. Code 1 avec
  `--max-diff` si un écran dépasse le seuil ou n'est pas mesurable.
- Test du comparateur : `pnpm --filter @blowy/qa test`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `run.mjs` | orchestration (export, API, connexion démo, capture, comparaison, rapport) |
| `routes.v4.json` / `routes.v5.json` | correspondance écran de maquette → route, compte, brouillon, masques (format dans `screens.mjs`) |
| `lib/compare.mjs` | pixelmatch (seuil 0,1, anticrénelage exclu) + masques + score basse résolution 1/8 |
| `lib/report.mjs` | rapport HTML statique (pire → meilleur) et résumé |
| `capture/metro-capture.cjs` + `capture/shims/` | shims **web de capture uniquement**, activés par `BLOWY_QA_CAPTURE=1` dans `apps/mobile/metro.config.js` |

Les shims ne changent rien au natif ni à un build web normal : `expo-secure-store` (absent du web
→ localStorage préfixé, pour injecter la session de démo) et `react-native` → react-native-web
complété de `AccessibilityInfo.isReduceTransparencyEnabled` (absent du web, plantait le rendu).

Documentation et état initial : `docs/qa/screen-inventory.md`, `docs/qa/visual-baseline.md`.
