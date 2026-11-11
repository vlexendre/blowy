# Blowy

> élève ton pet. il te présente du monde.

Monorepo TypeScript (pnpm) : une API NestJS, une app Expo (React Native), un site Astro, une base Supabase.

```
apps/api      API REST NestJS — seul écrivain de la base, e-mails via Resend
apps/mobile   App iOS / Android (Expo SDK 58, expo-router)
apps/web      Site marketing Astro + pages publiques (« 3 mots », invitation, légal)
packages/     domain (règles pures) · contract (Zod) · api-client · content (textes) · tokens · ui (design atomique)
supabase/     migrations SQL
docs/         ARCHITECTURE.md · SCREENS.md · TESTFLIGHT.md
```

## Démarrer en local (sans aucun service externe)

```bash
pnpm install
# 1. API en mémoire, avec un petit monde de démo
BLOWY_ADAPTERS=memory BLOWY_DEMO=1 CORS_ORIGINS=http://localhost:8081 pnpm dev:api
# 2. App (simulateur iOS, Android ou web) avec la connexion locale : le code est 000000
cd apps/mobile && EXPO_PUBLIC_AUTH=local EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start
# 3. Site
pnpm dev:web
```

## Brancher les vrais services

Copier `.env.example` vers `apps/api/.env`, `apps/mobile/.env` et `apps/web/.env`, puis :

| Service | Où | Quoi |
|---|---|---|
| Supabase | `apps/api/.env` | `BLOWY_ADAPTERS=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (clé secrète, jamais dans l'app) |
| Supabase | `apps/mobile/.env` et `eas.json` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (clé publique, déjà renseignées) |
| Resend | `apps/api/.env` | `RESEND_API_KEY`, `MAIL_FROM` (domaine vérifié chez Resend) |
| Resend | Supabase → Authentication → Emails → SMTP | pour que les codes de connexion partent de ton domaine (voir `supabase/README.md`) |

## Vérifier

```bash
pnpm typecheck   # tous les paquets
pnpm test        # règles du domaine + parcours de l'API (en mémoire, horloge simulée)
pnpm build       # API (dist/main.js) et site (apps/web/dist)
```

## Mettre en ligne

- **API** : `docker build -f apps/api/Dockerfile -t blowy-api .` puis n'importe quel hébergeur de conteneurs (voir `apps/api/README.md`).
- **Site** : Cloudflare Pages, commande `pnpm --filter @blowy/web build`, dossier `apps/web/dist`.
- **App** : voir `docs/TESTFLIGHT.md`.

Architecture et règles : `docs/ARCHITECTURE.md`.
