# Blowy — guide pour Claude Code

App sociale française : chacun élève un pet, les pets présentent du monde. Monorepo pnpm, TypeScript strict.
Lire d'abord `docs/ARCHITECTURE.md` (règles) et `docs/SCREENS.md` (écrans). Textes en français, tutoiement.

## Commandes
- Installer : `pnpm install` (Node 22, pnpm 10)
- Vérifier : `pnpm typecheck` · `pnpm test` · `pnpm build`
- API locale sans service externe : `cd apps/api && BLOWY_ENV=local BLOWY_ADAPTERS=memory BLOWY_DEMO=1 CORS_ORIGINS=http://localhost:8081 pnpm dev` (port 3000)
- App : `cd apps/mobile && EXPO_PUBLIC_AUTH=local EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start` (`w` web, `i` simulateur iOS). Code de connexion local : `000000`.
- Site : `pnpm dev:web` (port 4321)
- TestFlight : `docs/TESTFLIGHT.md`

## Règles à respecter
- L'API est le seul écrivain de la base. L'app ne lit Supabase que pour la session et le temps réel.
- Toute requête ou réponse passe par `packages/contract` (Zod). Ne jamais dupliquer un type du contrat.
- Les règles du jeu vivent dans `packages/domain` : pur, sans horloge ni aléa.
- Chaque dépendance externe est un port avec un adaptateur réel et un adaptateur mémoire ; tester en mémoire.
- App : design atomique dans `packages/ui` (atoms → molecules → organisms → templates). Pas de style de présentation dans `apps/mobile/app/**`. Couleurs uniquement depuis `packages/tokens`.
- API : injection explicite `@Inject(JETON)` (pas de `emitDecoratorMetadata`).
- Après une migration SQL : mettre à jour `apps/api/src/persistence/database.types.ts`.
- Ne jamais mettre la clé secrète Supabase ni la clé Resend ailleurs que dans `apps/api/.env` (non versionné).

## Avant de dire que c'est fini
`pnpm typecheck && pnpm test`, et pour l'app `cd apps/mobile && CI=1 npx expo export --platform ios --output-dir /tmp/blowy-ios`.
