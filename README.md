# Minimoa

> Élève ton minimoa. Il te présente du monde.

Monorepo TypeScript (pnpm) : une API NestJS, une app Expo (React Native), un site Astro, une base Supabase.

```
apps/api      API REST NestJS — seul écrivain de la base, e-mails via Resend
apps/mobile   App iOS / Android (Expo SDK 58, expo-router)
apps/web      Site marketing Astro + pages publiques (« 3 mots », invitation, légal)
apps/admin    Administration web (Vite + React) : tableaux, modération, coûts de l'IA
packages/     domain (règles pures) · contract (Zod) · api-client · content (textes) · tokens · ui (design atomique)
supabase/     migrations SQL
docs/         ARCHITECTURE.md · SCREENS.md · TESTFLIGHT.md · V7-SPEC.md · DEPLOIEMENT-V7.md · COUTS.md · MINIMOA-PLUS.md · WIDGETS.md
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
# 4. Administration (adresse admin@blowy.local, code 000000 avec l'API de démo)
VITE_AUTH=local VITE_API_URL=http://localhost:3000 pnpm dev:admin
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
pnpm build       # API (dist/main.js), site (apps/web/dist), administration (apps/admin/dist)
# Après une migration SQL : schéma, types et RLS sur un PostgreSQL local jetable
PGHOST=/chemin/du/socket PGPORT=5432 PGUSER=postgres pnpm --filter @blowy/api check:schema
```

## Mettre en ligne

- **API** : `docker build -f apps/api/Dockerfile -t blowy-api .` puis n'importe quel hébergeur de conteneurs (voir `apps/api/README.md`), plus le minuteur (`POST /internal/tick` toutes les 5 min). V7 : ordre complet dans `docs/DEPLOIEMENT-V7.md`.
- **Site** : Cloudflare Pages, commande `pnpm --filter @blowy/web build`, dossier `apps/web/dist`.
- **Administration** : https://admin.minimoa.app, projet Cloudflare Pages à part, commande `pnpm --filter @blowy/admin build`, dossier `apps/admin/dist` (variables : `apps/admin/README.md`).
- **App** : voir `docs/TESTFLIGHT.md`.

Architecture et règles : `docs/ARCHITECTURE.md`.
