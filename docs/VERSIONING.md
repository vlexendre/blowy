# Versions et rétro-compatibilité

Minimoa est en production : une app installée peut rester des semaines sans mise à jour, et pendant un déploiement
l'ancienne API tourne déjà sur le nouveau schéma (les migrations passent avant le code). Deux règles en découlent :

1. **Toute version d'app encore servie marche contre l'API déployée.** Le contrat ne change que par ajout.
2. **Une migration n'ajoute que.** Ce qui retire ou réécrit vient plus tard, quand plus rien ne s'en sert.

## Ce qui est en place

| Pièce | Où |
|---|---|
| L'app envoie `x-app-version`, `x-app-build` (CFBundleVersion), `x-app-platform` sur chaque requête | `apps/mobile/src/core/app-identity.ts`, option `getClientInfo` de `@blowy/api-client` |
| L'API les lit, les journalise (une ligne par version vue) et les rend lisibles : `@ClientApp()` dans un contrôleur, `clientApp()` ailleurs | `apps/api/src/shared/client-app.ts` |
| Anciens builds sans en-têtes : reconnus, au mieux, à l'agent utilisateur d'iOS (`Minimoa/42 CFNetwork/…`, journalisé `user-agent`) | idem |
| `GET /v1/app/config` (public) : `minSupportedBuild`, `latestBuild`, `storeUrl` | `packages/contract/src/v7/app.ts`, `modules/app-config` |
| Sous le minimum : `426 app_update_required` → écran « Mets à jour Minimoa » ; entre le minimum et le dernier : bandeau discret | `shared/client-app.ts`, `features/app-update`, `app/mise-a-jour.tsx`, `UpdateTemplate`, `UpdateBanner` |
| L'app lit les réponses en tolérant l'inconnu : champ en plus ignoré, valeur d'enum inconnue retirée (élément de liste, champ facultatif ou nullable), code d'erreur inconnu lu comme `internal` | `packages/api-client/src/tolerant.ts` |
| Garde-fou du contrat : `pnpm contract:check` (dans `pnpm test`) | `packages/contract/compat`, `packages/contract/snapshot/` |
| Garde-fou des migrations : `pnpm migrations:check` (dans `pnpm test`) | `apps/api/scripts/migration-safety.ts`, `supabase/production-baseline.json` |

Toujours ouverts, même à un build trop ancien : `/health`, `/v1/app/config`, `DELETE /v1/me` (supprimer son compte),
`POST /v1/devices/remove`, le minuteur et les notifications d'Apple. Le site, l'administration et le web n'envoient
pas de build : jamais bloqués.

## Réglages (API, Railway)

| Variable | Rôle | Défaut |
|---|---|---|
| `APP_IOS_MIN_SUPPORTED_BUILD` | sous ce build : 426 et écran de mise à jour | `0` (aucun minimum) |
| `APP_IOS_LATEST_BUILD` | dernier build publié : au-dessous, bandeau | `0` (aucun bandeau) |
| `APP_IOS_STORE_URL` | fiche App Store | `https://apps.apple.com/fr/app/minimoa/id6833895780` |
| `APP_ANDROID_…` | les mêmes pour Android | `0`, `0`, aucune |

L'API refuse de démarrer si le minimum dépasse le dernier build. Le numéro de build est celui d'EAS
(`appVersionSource: remote`, `autoIncrement`) : il se lit dans App Store Connect › TestFlight.

## Quand monter `minSupportedBuild`

- **`APP_IOS_LATEST_BUILD`** : dès qu'un build est en vente sur l'App Store (pas avant : le bandeau enverrait vers une
  fiche qui ne l'a pas encore).
- **`APP_IOS_MIN_SUPPORTED_BUILD`** : rarement, seulement pour retirer une forme ancienne (phase « contract » ci-dessous),
  ou pour une faille. Regarder d'abord dans les journaux (« app vue : ios … ») combien de vieux builds appellent encore.
- Les builds publiés **avant** l'écran de mise à jour ne savent pas l'afficher : au-dessus d'eux, ils verront « Une
  erreur est survenue » partout. Ne pas les bloquer sans raison forte.
- Après avoir monté le minimum en production, reporter la valeur dans `packages/contract/snapshot/policy.json`
  (`minSupportedBuild`). Y noter aussi, une fois, `tolerantSinceBuild` : le premier build publié qui contient la lecture
  tolérante. Tant que `minSupportedBuild < tolerantSinceBuild`, une valeur d'enum ajoutée dans une réponse reste
  cassante partout.

## Le contrat (`packages/contract`)

**Permis sans précaution** : un champ de réponse en plus (facultatif ou non) ; un champ de requête facultatif en plus ;
une route en plus ; une valeur d'enum en plus dans une requête ; un code d'erreur en plus.

**Permis quand tous les builds servis tolèrent l'inconnu** : une valeur d'enum en plus dans une réponse, là où l'app peut
l'écarter (élément de liste, champ facultatif ou nullable). Une valeur nouvelle dans un champ obligatoire hors liste
(`pet.species`, `link.status`, `subscription.phase`…) rend toute la réponse illisible : passer par l'une des deux voies
ci-dessous.

**Cassant** (refusé par `pnpm contract:check`) : route ou appel retiré, chemin changé, champ de réponse retiré ou devenu
facultatif ou nullable, type changé, contrainte de réponse relâchée, champ de requête devenu obligatoire, valeur d'enum
retirée d'une requête, contrainte de requête resserrée.

### Ajouter un champ

1. Dans le schéma Zod, le champ en plus. Côté requête : `.optional()`. Côté réponse : obligatoire si l'API le donne
   toujours.
2. Si l'app le lit et qu'une vieille API (dev, retour arrière) peut ne pas l'envoyer : `.optional()` ou `.default(…)`
   côté réponse (exemple : `WardrobeZ.collection`).
3. `pnpm contract:check` le liste en « ajout ». Rien d'autre à faire.

### Casser un endpoint proprement

- **Nouvelle version de la route** : `GET /v2/pet` à côté de `GET /v1/pet`, nouveaux schémas (`PetViewV2Z`). L'app
  suivante appelle la v2 ; l'API sert les deux. La v1 part quand `minSupportedBuild` dépasse le dernier build qui
  l'appelle.
- **Adaptation par build**, pour un petit écart : la route reste, le présentateur lit `clientApp().build` et rend
  l'ancienne forme aux builds anciens (exemple : ne pas envoyer une espèce nouvelle à un build qui ne la connaît pas, ou
  la remplacer par une valeur connue). À retirer avec le même minimum.
- Dans les deux cas, l'ancienne forme reste dans l'instantané : le garde-fou continue de la protéger.

### L'instantané du contrat

`packages/contract/snapshot/contract.json` : la forme JSON (`z.toJSONSchema`) des réponses de chaque appel du client
de l'app (méthode, route, schéma, lus dans `packages/api-client/src/index.ts`), des requêtes (`…Body`, `…Query`), des
tables de routes et des messages lus hors du client (push, widgets, activités en direct, erreurs). L'administration en
est exclue (elle se déploie avec l'API).

- **À chaque sortie de l'app** (build envoyé à la revue) : `pnpm contract:snapshot`, puis commiter le fichier avec la
  sortie. Le script affiche les changements cassants qu'il fige : il ne doit y en avoir aucun, sauf une forme dont plus
  aucun build servi ne dépend.
- Une route ajoutée puis changée **avant** toute sortie n'est pas publiée : régénérer l'instantané est permis.

## Les migrations : expand → migrate → contract

Exemple : renommer `profiles.pseudo` en `display_name`, en trois sorties.

1. **Expand** (sortie N) : `alter table profiles add column display_name text;` puis recopie
   (`update profiles set display_name = pseudo where display_name is null;`). L'API écrit les deux colonnes et lit
   `coalesce(display_name, pseudo)`. Le contrat ne change pas (ou gagne un champ).
2. **Migrate** (sortie N+1) : l'API ne lit plus que `display_name` ; une dernière recopie pour les lignes écrites entre
   deux. Si la colonne doit devenir obligatoire : `add constraint profiles_display_name_nn check (display_name is not
   null) not valid;`, `validate constraint` dans une migration suivante, puis `set not null` (sans parcours de la table).
3. **Contract** (sortie N+2, quand plus aucune API déployée ni aucun build servi ne lit `pseudo`) :

   ```sql
   -- destructive-ok: pseudo remplacé par display_name depuis la sortie N (contract, build ≥ 40)
   alter table public.profiles drop column pseudo;
   ```

`pnpm migrations:check` analyse les migrations plus récentes que `supabase/production-baseline.json`
(`lastAppliedInProduction` : à avancer après chaque `supabase db push` en production) et refuse sans échappatoire :
`drop table`, `drop column`, `drop function / view / type / trigger…` (sauf recréé dans le même fichier ; les politiques
RLS sont libres), `rename`, `alter column … type`, `drop default`, `set not null` sans `check (col is not null)`
préalable, colonne `not null` sans `default` sur une table existante, contrainte `check` ou `foreign key` sans
`not valid`, `drop constraint` sans remplaçante du même nom dans le fichier, `create index` bloquant sur une table
existante (le créer d'abord en `concurrently`, puis `if not exists` dans la migration), `drop index` non concurrent,
`truncate`, `delete` ou `update` sans `where`. Les blocs `do $$ … $$` sont analysés ; les corps de fonctions, non.
L'échappatoire `-- destructive-ok: <raison>` (10 caractères au moins) se met juste au-dessus de l'instruction ; le
script l'affiche à chaque passage. `pnpm migrations:check --all` montre aussi ce que contiendraient les migrations déjà
appliquées (pour information).
