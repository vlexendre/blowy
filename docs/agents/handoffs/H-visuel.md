# Handoff — Agent H-visuel (banc QA visuel)

Date : 2026-11-06. Aucun commit, push, checkout ni reset. Aucune migration. Aucun écran corrigé.
`packages/database`, `apps/api` et les maquettes non modifiés.

## Fichiers modifiés / créés
- `tooling/qa/package.json` (nouveau paquet `@blowy/qa` : pixelmatch 7.2, pngjs 7, playwright 1.64.1, vitest), `tooling/qa/vitest.config.mjs`.
- `tooling/qa/visual/` : `run.mjs` (orchestration), `screens.mjs` (chargeur + format), `routes.v4.json` (39 écrans), `routes.v5.json` (vide), `lib/{compare,report,static-server,args}.mjs`, `compare.test.mjs`, `README.md` (usage, demandé pour l'agent UI-fondation).
- `tooling/qa/visual/capture/metro-capture.cjs` + `capture/shims/{expo-secure-store.web.js,react-native.web.js}` : shims **web de capture uniquement**.
- `apps/mobile/metro.config.js` : une ligne — applique `metro-capture.cjs` seulement si `BLOWY_QA_CAPTURE=1` (vérifié : sans la variable, la config exportée est inchangée).
- `apps/mobile/package.json` + `pnpm-lock.yaml` : `react-native-web ~0.21.4`, `@expo/metro-runtime ~58.0.16` (versions de `expo/bundledNativeModules.json`), via `flock .local/pnpm.lock pnpm --filter @blowy/mobile add …`. `react-dom 19.3.0` était déjà là.
- `package.json` racine : script `qa:visual`.
- `docs/qa/screen-inventory.md`, `docs/qa/visual-baseline.md`, ce fichier.

## Tests et commandes exécutés (réellement)
- `pg_ctlcluster 16 main start`, `redis-server --daemonize yes` (ils étaient arrêtés) → `pg_isready` OK, `PONG`. Base `blowy` déjà seedée (20 users).
- `npx expo export --platform web` (sans shims) → export OK mais page blanche : `isReduceTransparencyEnabled is not a function`, `getValueWithKeyAsync is not a function` → shims ajoutés ; avec `BLOWY_QA_CAPTURE=1` : rendu OK, 0 erreur de page sur les 38 captures.
- `pnpm qa:visual` (complet, 2 fois) → 38/39 mesurés, écart moyen **47,3 %**, chiffres identiques entre les deux passages.
- `pnpm qa:visual -- --only V4-Welcome --route '/(onboarding)/welcome'` → 48,3 % (surcharge de route OK) ; `pnpm qa:visual -- --ref design/v5/renders` → rapport vide (routes.v5.json vide).
- `cd tooling/qa && npx vitest run` → 11 tests passés (image identique → 0 %, carré → surface exacte, masques, seuil, taille différente, tri/moyennes, options, choix v4/v5, `--route`).
- `npx eslint tooling/qa` → 0 problème. `pnpm --filter @blowy/mobile typecheck` → 0 erreur ; `pnpm --filter @blowy/mobile test` → 15 fichiers, 63 tests passés.

## Décisions
- Capture = Expo web (export statique servi sur :8081, origine déjà autorisée par CORS) ; pas de dev server.
- Build de capture en `EXPO_PUBLIC_AUTH_MODE=firebase`, `EXPO_PUBLIC_BLOWY_ENV=local` : UI d'auth de production, achats via l'adaptateur LOCAL_DEMO existant (web → aucun shim RevenueCat nécessaire). Widgets, caméra, notifications : se chargent sur web sans shim (avertissements expo-notifications seulement).
- Session de démo : `POST /v1/auth/sessions` local puis injection dans le localStorage du shim SecureStore ; brouillon d'onboarding « Nino » injecté pour les écrans pré-compte.
- Contournement capture : en-tête `Authorization` complété au niveau réseau (bug d'ouverture à froid, voir baseline).
- Safe areas émulées par CDP (`Emulation.setSafeAreaInsetsOverride`, 47/34) ; horloge figée ; `reducedMotion`.
- Seuil pixelmatch 0,1, anticrénelage exclu ; masques rectangles + masques par texte (`maskText`).
- Export Expo refait automatiquement si les sources mobile/ui/sprites/tokens/shims ont changé.

## Limites
- Le % est dominé par la couleur de fond : à lire avec la colonne basse résolution et les images.
- Seul l'état par défaut de chaque route est capturé (pas de feuilles, modales, états « envoyé »).
- react-native-web ≠ rendu natif iOS (ombres, polices, flou) : le banc mesure la structure et les jetons, pas le rendu natif.
- Références rendues avec Chromium de playwright 1.63 (global), captures avec 1.64.1 : écarts d'anticrénelage possibles (exclus du score).
- Les données de démo vieillissent (jauges) : scores du Nid/Profil/Fiche dépendants de la date du seed.

## Demandes à d'autres propriétaires
- **D (mobile)** : ouverture à froid sur route profonde → 401 → session effacée (attendre la restauration avant les requêtes, ou ne pas effacer sur 401 sans jeton) ; clé i18n `chat.system.system.match.created` ; barre d'onglets sur les écrans de pile (recouvre le compositeur du chat sur web).
- **UI-fondation** : Bricolage variable `wdth 85` (instance condensée) ; fonds par écran dans les gabarits. Usage du banc en tête de `tooling/qa/visual/README.md` (`--only … --route '/(dev)/kitchen-sink'`).
- **C (seed)** : jeu « vitrine » optionnel (Alex : 340 pièces, série 8, gauges fraîches) pour des captures stables.
- **C/E** : endpoints `GET /v1/referrals/:code`, `/conversations/:id/suggestions` (404), mission, ligue, œuf, social.
- **A** : `tooling/` et lockfile touchés dans le cadre de cette mission (délégation explicite).
