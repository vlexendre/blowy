# Minimoa — guide pour Claude Code

App sociale française : chacun élève un minimoa (le code l’appelle encore `pet`), les minimoas présentent du monde. Monorepo pnpm, TypeScript strict.
Lire d'abord `docs/ARCHITECTURE.md` (règles) et `docs/SCREENS.md` (écrans). Textes en français (langue source), tutoiement, majuscule en début de phrase, jamais « pet » à l’écran : guide `docs/I18N.md`.

## Commandes
- Installer : `pnpm install` (Node 22, pnpm 10)
- Vérifier : `pnpm typecheck` · `pnpm test` (lance aussi `pnpm i18n:check`) · `pnpm build`
- Langues : `pnpm i18n:check` (clés, « pet », textes en dur dans `packages/ui`) · `pnpm i18n:list` (ce qui reste à traduire)
- API locale sans service externe : `cd apps/api && BLOWY_ENV=local BLOWY_ADAPTERS=memory BLOWY_DEMO=1 CORS_ORIGINS=http://localhost:8081 pnpm dev` (port 3000)
- App : `cd apps/mobile && EXPO_PUBLIC_AUTH=local EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start` (`w` web, `i` simulateur iOS). Code de connexion local : `000000`.
- Site : `pnpm dev:web` (port 4321)
- Administration : `VITE_AUTH=local VITE_API_URL=http://localhost:3000 pnpm dev:admin` (port 8464 ; `admin@blowy.local`, code `000000`)
- Minuteur en local : `INTERNAL_TICK_SECRET=<24 caractères>` puis `curl -X POST -H "x-tick-secret: …" localhost:3000/internal/tick`
- Schéma après une migration : `PGHOST=… PGPORT=… PGUSER=postgres pnpm --filter @blowy/api check:schema` (PostgreSQL local seulement)
- Semis d'un environnement de test (jamais la production) : `docs/SEED-TEST.md`
- Environnements (production `main`, dev `dev` : dev.minimoa.app, api-dev, admin-dev) : `docs/ENVIRONNEMENTS.md`
- Mise en production V7 : `docs/DEPLOIEMENT-V7.md`
- TestFlight : `docs/TESTFLIGHT.md`

## Règles à respecter
- L'API est le seul écrivain de la base. L'app ne lit Supabase que pour la session et le temps réel.
- Toute requête ou réponse passe par `packages/contract` (Zod). Ne jamais dupliquer un type du contrat.
- Les règles du jeu vivent dans `packages/domain` : pur, sans horloge ni aléa.
- Chaque dépendance externe est un port avec un adaptateur réel et un adaptateur mémoire ; tester en mémoire.
- App : design atomique dans `packages/ui` (atoms → molecules → organisms → templates). Pas de style de présentation dans `apps/mobile/app/**`. Couleurs uniquement depuis `packages/tokens`.
- API : injection explicite `@Inject(JETON)` (pas de `emitDecoratorMetadata`).
- Après une migration SQL : mettre à jour `apps/api/src/persistence/database.types.ts`, puis lancer `check:schema`. Une migration doit passer sur une base peuplée (défaut constant pour une colonne non nulle, contraintes `not valid` puis `validate` sur les grosses tables, index `if not exists` à créer avant en `concurrently`).
- « Qui est montré à qui » (supprimé, suspendu, bloqué, discret) : seulement par `Audience` (`modules/safety/application/audience.ts`).
- Travail planifié : un `XxxJobs.runDue(now)` idempotent, une ligne dans `apps/api/src/modules/tick/jobs.ts`.
- Production : rétro-compatibilité obligatoire (`docs/VERSIONING.md`). Contrat seulement par ajout (sinon `/v2/…` ou adaptation par build via `clientApp()`), migrations seulement par ajout (expand → migrate → contract, `-- destructive-ok: <raison>` pour la dernière phase) ; `pnpm contract:check` et `pnpm migrations:check` (dans `pnpm test`) ; `pnpm contract:snapshot` à chaque sortie de l'app.
- Ne jamais mettre la clé secrète Supabase ni la clé Resend ailleurs que dans `apps/api/.env` (non versionné).

## Textes (deux minutes, détail dans `docs/I18N.md`)
- Écran : ajouter la clé dans le bloc `fr` de `apps/mobile/src/locales/<zone>.ts` (`messages({ fr, en, es, pt, nl })`) ; si le bloc `en` liste ses clés, y ajouter `clé: TODO` (sinon erreur de type). Nouveau fichier : `en: TODO, es: TODO, pt: TODO, nl: TODO`. L’écran importe comme avant (`import { moi } from '@/locales/moi'`).
- Nombres, prix, dates : `plural`, `formatPrice`, `formatDate` de `@/locales/runtime` ; jamais un prix écrit dans une phrase.
- `packages/ui` : aucun texte en dur ; libellés en props, ou `useUiStrings()` (fourni par `src/locales/ui.ts`).
- API : un texte vu par les gens va dans `packages/content` (`defineMessages`) et se lit avec `.in(locale)` : langue de la requête (`@ReqLocale()`, `requestLocale()`) pour une réponse, `profiles.locale` pour une notification, un e-mail ou une réplique de minimoa ; erreurs avec `errorText('clé')`.

## Avant de dire que c'est fini
`pnpm typecheck && pnpm test` (dont `pnpm i18n:check`), et pour l'app `cd apps/mobile && CI=1 npx expo export --platform ios --output-dir /tmp/blowy-ios`.
