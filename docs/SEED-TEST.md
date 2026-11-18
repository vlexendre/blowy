# Semis d’un environnement de test

Remplit une base **de test** (API locale en mémoire, Supabase local, projet Supabase de dev, docs/ENVIRONNEMENTS.md) avec des comptes de test réalistes dans les villes du site, et des inscriptions « Ouvre ton quartier ». Code : `apps/api/src/demo/seed/`.

## À ne jamais faire

Le semis ne sert **jamais** à faire paraître la production peuplée. Des comptes fictifs présentés comme de vraies personnes tromperaient les gens qui utilisent l’app : c’est déloyal envers eux, risqué juridiquement (pratique commerciale trompeuse, données inventées présentées comme réelles) et contraire aux règles de l’App Store (une app ne doit pas tromper sur ce qu’elle offre ni sur qui l’utilise ; risque de rejet ou de retrait). Le script est conçu pour ne pas pouvoir y toucher (voir les garde-fous), et il ne faut pas chercher à le contourner.

## Ce qui est semé

Par ville (`--per-city`, 40 par défaut ; Paris : trois fois plus, réparti sur ses 20 arrondissements) :

- des comptes inscrits **par le vrai cas d’usage** (`Onboard`) : prénom tiré de listes locales (France, Belgique, Suisse, Pays-Bas, Espagne, Portugal), date de naissance de 19 à 44 ans, langue selon le pays, minimoa d’une espèce existante, test de vision complet aux réponses variées (la compatibilité s’étale), position tirée dans le quartier (l’API l’arrondit à ~300 m, et le point reste dans le quartier), 0 à 2 habitudes ;
- trois semaines d’activité, rejouées jour par jour (l’horloge de l’API est reculée au moment de chaque geste, puis rendue) : liens (coucou puis « oui », sinon par invitation), conversations courtes et banales (`packages/content/src/v7/seed.ts`), séries de liens, groupes, soins, défis du jour, coucous en attente (seulement vers quelqu’un que l’app a vraiment proposé) ; tenue choisie parmi les objets vraiment gagnés ;
- Minimoa+ pour ~10 % des comptes **en mémoire seulement** (comme le monde de démo). Sur Supabase, aucun : il faudrait un faux reçu Apple, ce qu’on ne fait pas ;
- des inscriptions « Ouvre ton quartier », toutes confirmées : un quartier ouvert au seuil, un ouvert à la main, trois tout près du seuil, les autres plus bas.

Aucune photo : les avatars sont les minimoas. Aucun e-mail ne part (adresses `.invalid`, ignorées par l’envoi des e-mails et par le minuteur des quartiers).

## Comment les comptes sont marqués

- adresse `…@seed.minimoa.invalid` (domaine réservé, n’existe jamais) ; identifiant `5eed5eed-…` (y compris les inscriptions de quartier, reconnaissables même une fois l’adresse effacée) ;
- compte d’authentification banni, sans mot de passe, `app_metadata.blowy_seed = true` ;
- `profiles.review_world` = le monde du semis (`5eed5eed-0000-4000-8000-000000000000`), même mécanisme que les personnes fictives du compte de revue d’Apple : **`Audience` ne les montre qu’aux comptes du même monde**. Un vrai compte ne les voit jamais (rencontres, carte, coucous, invitations, « 3 mots »), et elles sont hors statistiques, hors alertes, hors e-mails de fidélisation.

Pour voir le monde du semis avec un compte de test : `--adopt toi@exemple.fr` (le compte doit exister). En local, `BLOWY_SEED_ADOPT=1` rattache chaque nouvelle inscription. La purge rend ces comptes à tout le monde.

## Utilisation

API locale en mémoire, semis au démarrage (après le monde de démo, ~25 s pour toutes les villes) :

```sh
cd apps/api && BLOWY_ENV=local BLOWY_ADAPTERS=memory BLOWY_DEMO=1 BLOWY_SEED_CITIES=paris,lyon \
  BLOWY_SEED_PER_CITY=20 BLOWY_SEED=1 BLOWY_SEED_ADOPT=1 CORS_ORIGINS=http://localhost:8081 pnpm dev
```

`BLOWY_SEED_CITIES=all` : toutes les villes. Ensuite `GET /v1/quartiers` et la page « Ouvre ton quartier » ont des données.

Supabase local (`supabase start`) ou projet de test, clés lues dans le shell (jamais écrites dans un fichier versionné, ni dans `apps/api/.env`, que le script ne lit pas) :

```sh
export BLOWY_ENV=staging BLOWY_ADAPTERS=supabase
export SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=…   # projet de TEST
pnpm --filter @blowy/api seed:test --dry-run                 # le plan, sans rien écrire
pnpm --filter @blowy/api seed:test --cities paris,lyon --per-city 20 --seed 1
pnpm --filter @blowy/api seed:test --adopt testeur@exemple.fr
pnpm --filter @blowy/api seed:test --purge
```

### Semer l'environnement de dev (dev.minimoa.app)

Depuis un poste, contre le projet Supabase **de dev** (jamais `sqxebllmatfflopqddaw`), clés lues dans le shell :

```sh
export BLOWY_ENV=staging BLOWY_ADAPTERS=supabase
export SUPABASE_URL=https://<ref-dev>.supabase.co SUPABASE_SERVICE_ROLE_KEY=…   # clé secrète du projet de DEV
export API_URL=https://api-dev.minimoa.app WEB_URL=https://dev.minimoa.app       # facultatif ; permis par les garde-fous
pnpm --filter @blowy/api seed:test --dry-run
pnpm --filter @blowy/api seed:test --cities paris,lyon --per-city 20 --seed 1
pnpm --filter @blowy/api seed:test --adopt testeur@exemple.fr   # le compte doit d'abord exister (inscrit dans « Minimoa Dev »)
```

Ou avec les variables de l'environnement Railway « dev » : `railway link` (choisir le projet, l'environnement `dev` et
le service de l'API), puis `railway run pnpm --filter @blowy/api seed:test --dry-run`. Elles y sont toutes vérifiées : si une
variable du dev désignait la production (copie d'un environnement dupliqué), le semis refuse.

Le semis écrit directement dans la base de dev par la clé secrète ; l'API de dev n'a pas besoin d'être arrêtée. Pour
repartir de zéro : `--purge`, puis semer de nouveau.

Options : `--cities` (défaut : toutes les villes du site, `ZONES` de `packages/domain/src/quartiers.ts`), `--per-city`, `--seed` (même graine, même plan), `--dry-run`, `--purge`, `--adopt`, `--help`. Sur Supabase, compter quelques minutes par centaine de comptes (chaque geste passe par l’API). L’IA, les push et les e-mails sont coupés pendant le semis.

## Garde-fous

Vérifiés par le script avant de démarrer, puis par `Seeder` à chaque semis, purge ou rattachement. Le moindre refus arrête tout (code de sortie 2, message en français). **Il n’existe pas d’option `--force`.**

1. `BLOWY_ENV` vaut `local`, `test` ou `staging` (obligatoire avec Supabase) ; l’API chargée ne doit pas être en production.
2. Aucune variable d’environnement ne désigne le projet Supabase de production (`sqxebllmatfflopqddaw`) : adresse, hôte ou utilisateur de base, ou clé au format JWT qui le nomme.
3. Aucune adresse configurée (`…_URL`, `…_HOST`, `…_ORIGIN(S)`) ne pointe vers un hôte de la production : `minimoa.app`, `www.minimoa.app`, `api.minimoa.app`, `admin.minimoa.app` (liste : `apps/api/src/config/production-targets.ts`). Les adresses du dev (`dev.minimoa.app`, `api-dev.minimoa.app`, `admin-dev.minimoa.app`) sont permises.
4. La base ne contient pas plus de 20 comptes qui ne sont ni du semis, ni des personnes fictives du compte de revue, ni le compte de revue configuré : au-delà, elle ressemble à une base réelle.

Un deuxième semis sur une base déjà semée est refusé : purger d’abord.

## Purge

`--purge` supprime tout ce que le semis a créé, et seulement cela : les comptes qui portent les deux marques (adresse et identifiant du semis) et, en cascade, leurs profils, minimoas, liens, messages, rencontres, habitudes… ; les groupes qu’ils ont créés ; les inscriptions de quartier du semis ; les quartiers créés par le semis restés vides. Les comptes rattachés (`--adopt`) sont d’abord rendus à tout le monde. Une purge de plus ne trouve plus rien.

## Tests

`apps/api/test/seed.e2e.test.ts` : chaque garde-fou refuse seul une configuration de production, les adresses du dev passent (et les autres garde-fous tiennent avec elles), aucune option ne les contourne, le plan est déterministe, le semis en mémoire pose les comptes prévus, `Audience` les cache à un vrai compte, et la purge rend la base exactement telle qu’avant.
