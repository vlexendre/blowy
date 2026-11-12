# @blowy/api

API REST de Blowy (NestJS 12, ESM). Seul écrivain de la base : l'app et le site passent par elle via
`@blowy/api-client`. Le contrat (routes et schémas Zod) vit dans `packages/contract`.

## Lancer en local

```bash
pnpm install
cp .env.example apps/api/.env      # puis garder BLOWY_ADAPTERS=memory
pnpm dev:api                       # tsx watch, http://localhost:3000/health
```

En mode `memory`, rien d'externe n'est nécessaire :

- **auth** : jeton `test:<uuid>` ou `test:<uuid>:<email>` dans `Authorization: Bearer …` (à utiliser avec
  `EXPO_PUBLIC_AUTH=local` côté app) ;
- **stockage** : les tickets d'envoi pointent vers `PUT /dev/uploads/<chemin>?token=…` et les URL de lecture
  vers `GET /dev/media/<chemin>?token=…` (expirent au bout d'une heure, comme sur Supabase) ;
- **e-mails** : sans `RESEND_API_KEY`, seuls le sujet et le domaine du destinataire sont écrits dans la console ;
- **démo** : `BLOWY_DEMO=1` crée Léa (Suzie), Malo (Gaston) et Sasha (Pia) au démarrage, habillés et avec des
  besoins variés (remis à niveau à chaque inscription, pour que Suzie puisse toujours saluer). À chaque inscription,
  Léa te salue et Malo se lie avec toi et t'écrit : tous les écrans ont des données. Identifiants fixes dans
  `src/demo/demo.ts`. Les données mémoire disparaissent à l'arrêt.

```bash
curl -H 'Authorization: Bearer test:11111111-1111-4111-8111-111111111111' localhost:3000/v1/me
```

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm --filter @blowy/api dev` | développement (tsx watch, lit `apps/api/.env`) |
| `pnpm --filter @blowy/api typecheck` | TypeScript strict |
| `pnpm --filter @blowy/api test` | tests de bout en bout (API réelle en mémoire, pilotée par `@blowy/api-client`, horloge simulée) |
| `pnpm --filter @blowy/api build` | bundle `dist/main.js` (tsup ; les paquets `@blowy/*` sont embarqués) |
| `pnpm --filter @blowy/api start` | `node dist/main.js` |

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `BLOWY_ENV` | `local` | `local` ou `production` |
| `BLOWY_ADAPTERS` | `memory` | `memory` ou `supabase` — **la production refuse `memory`** |
| `BLOWY_DEMO` | `0` | `1` = monde de démo (seulement en `local` + `memory`) |
| `PORT` | `3000` | port d'écoute |
| `API_URL` | `http://localhost:$PORT` | URL publique de l'API (liens d'envoi/lecture en mode mémoire) |
| `SUPABASE_URL` | — | requis avec `supabase` |
| `SUPABASE_SERVICE_ROLE_KEY` | — | clé secrète (service) ; requise avec `supabase`, jamais dans l'app |
| `RESEND_API_KEY` | vide | vide = e-mails dans la console |
| `MAIL_FROM` | `Blowy <hello@blowy.app>` | expéditeur |
| `WEB_URL` | `https://blowy.app` | liens des e-mails |
| `CORS_ORIGINS` | vide | origines autorisées, séparées par des virgules |

L'API refuse de démarrer si la configuration est incohérente (production + mémoire, Supabase sans URL ou clé).

## Comment les adaptateurs basculent

Chaque dépendance externe est un port avec deux adaptateurs (`src/integrations/*`, `src/modules/*/infrastructure`) :
`CoreModule.forRoot(env)` (`src/core.module.ts`) choisit d'après `BLOWY_ADAPTERS`, pour l'auth (`AuthVerifier`,
`AuthAdmin`, `UserEmails`), le stockage (`Storage`), et chaque dépôt (`repository(TOKEN, adapters, memory, supabase)`).
L'e-mail bascule selon la présence de `RESEND_API_KEY`. Les adaptateurs mémoire partagent une base en mémoire
(`src/persistence/memory-db.ts`) qui reproduit les suppressions en cascade de la migration.

## Architecture

```
src/main.ts · app.ts · app.module.ts · core.module.ts
config/env.ts            variables validées par Zod
shared/                  garde d'auth (@Public, @CurrentUser), pipe Zod, filtre d'erreurs, horloge, ids, graine, limiteur
integrations/            auth, storage (+ contrôleur /dev en mémoire), mailer (Resend / console) + Notifier
persistence/             client Supabase (clé service), base mémoire, fabrique de dépôts
modules/<m>/             application (cas d'usage) · ports.ts · infrastructure · interface (contrôleurs, présentateurs)
demo/                    monde de démo local
```

## Soins et garde-robe

- **Besoins** (faim, énergie, humeur, 0–100) : usure rattrapée à la lecture (`decayNeeds`, heures réelles depuis
  `pets.needs_at`). On n'enregistre l'usure que par pas entiers de 2 h (`pet-catch-up.ts`) pour qu'une lecture
  fréquente ne fausse pas l'arrondi ; `PetsRepository.save` n'écrit jamais les besoins (`saveNeeds` s'en charge).
- `POST /v1/pet/care` : refusé (`already_done`) si le besoin est comblé ; sinon besoins, événement `care_*`
  (jauges) et un jour de soin par jour civil.
- **Objets** (`pet_items`) : le service `Wardrobe` calcule les compteurs (jours de soin, liens non archivés,
  meilleur niveau, meilleure série, défis, 3 mots) et attribue les objets gagnés à chaque vue du pet
  (`GetPetView`, donc aussi après soin, défi, renommage, tenue) : `PetView.newItems` = objets attribués par
  cette requête. Les étapes franchies ailleurs (lien, niveau, photo, 3 mots) sont fêtées à la vue suivante.
  Les objets de départ sont attribués à l'inscription (pas « nouveaux »). `pets.best_streak` monte avec les
  photos du jour à deux et reste acquis quand la série retombe.
- `GET /v1/pet/wardrobe` (catalogue, état, étape) · `PUT /v1/pet/outfit` (`forbidden` si un objet n'est pas à toi).
- **Conséquences** : la tenue se voit partout (`PublicPet.outfit`) ; hors des liens, l'humeur montrée suit la
  forme ; les suggestions de rencontre sont limitées par `ENCOUNTER_QUOTA` (aucune si le pet boude) et un pet
  qui boude ne peut pas saluer (accepter un coucou reste possible).

Règles : injection explicite (`@Inject(JETON)`, pas d'`emitDecoratorMetadata`) ; pas de `Date.now()` ni d'aléa dans
les cas d'usage (horloge injectée, répliques des pets choisies par une graine stable) ; les vies des liens et l'usure
des jauges sont rattrapées à chaque lecture (`tickLink`, `decayGauges`), sans tâche planifiée.

## Déployer avec Docker (Render, Fly.io, Railway)

L'image se construit depuis la **racine du dépôt** (elle a besoin du lockfile et des paquets internes) :

```bash
docker build -f apps/api/Dockerfile -t blowy-api .
docker run -p 3000:3000 --env-file apps/api/.env -e BLOWY_ENV=production -e BLOWY_ADAPTERS=supabase blowy-api
```

L'image finale ne contient que `dist/` et les dépendances de production (`pnpm deploy --prod`), tourne en
utilisateur `node` et expose `GET /health` pour la sonde de santé.

- **Render** : nouveau *Web Service* → Docker, *Dockerfile path* `apps/api/Dockerfile`, *Docker context* `.`,
  *Health check path* `/health`, variables d'environnement ci-dessus (secrets en *Secret Files* ou *Environment*).
- **Fly.io** : `fly launch --dockerfile apps/api/Dockerfile --no-deploy`, puis `fly secrets set SUPABASE_SERVICE_ROLE_KEY=… RESEND_API_KEY=…`,
  `internal_port = 3000` et un `[[http_service.checks]]` sur `/health`, puis `fly deploy`.
- **Railway** : service depuis le dépôt, variable `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`, variables d'environnement,
  *healthcheck path* `/health`.

Une seule instance suffit pour cette version : le cache des jetons (60 s) et le limiteur de la page « 3 mots » sont en
mémoire. Pour plusieurs instances, déporter le limiteur (Redis) ; le reste est sans état.

Conseil : ajouter un `.dockerignore` à la racine (`**/node_modules`, `**/dist`, `.git`, `apps/mobile`, `apps/web`)
pour alléger le contexte de build.
