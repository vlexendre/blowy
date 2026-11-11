# Architecture Blowy V6

```
apps/mobile  Expo SDK 58 (React Native 0.88, expo-router)  ─┐
apps/web     Astro 7 (site marketing, pages publiques)      ├─ @blowy/api-client ─ REST /v1 ─► apps/api (NestJS 12)
                                                             │                                   │ clé service
apps/mobile ── supabase-js : session (code e-mail) + temps réel (lecture RLS) ──────────────► Supabase (Postgres, Auth, Storage)
                                                                                 apps/api ──► Resend (e-mails)
```

## Règles
1. **Un seul écrivain** : l'API. L'app ne parle à Supabase que pour la session (auth par code e-mail) et pour
   s'abonner en temps réel aux tables `messages` et `links` (politiques RLS en lecture seule). Toute donnée affichée
   vient de l'API (`@blowy/api-client`), le temps réel ne sert qu'à déclencher un rafraîchissement.
2. **Le contrat d'abord** : `packages/contract` (Zod) décrit chaque requête et réponse. L'API valide les entrées avec,
   le client valide les sorties avec. On ne duplique jamais un type du contrat.
3. **Moteur pur** : `packages/domain` contient les règles (jauges, vies, niveaux, jours). Pas d'horloge, pas d'aléa,
   pas d'entrée-sortie ; le jour courant est un paramètre. Les vies et l'usure des jauges sont rattrapées à la lecture
   (`tickLink`, `decayGauges`), donc aucune tâche planifiée n'est nécessaire.
4. **Ports et adaptateurs** côté API et côté app : chaque dépendance externe (base, stockage, e-mail, auth, achats) est
   une interface avec un adaptateur réel et un adaptateur local en mémoire. La production refuse les adaptateurs locaux.
5. **Design atomique** côté app : `packages/ui/src/{atoms,molecules,organisms,templates}` ; un niveau n'importe que les
   niveaux inférieurs ; aucun `StyleSheet` de présentation dans un écran. Les écrans (`apps/mobile/app/**`) sont fins :
   un template, des organismes, un hook de feature.
6. Textes en français, tutoiement, externalisés (`packages/content`, `apps/mobile/src/locales/fr.ts`).
7. TypeScript strict. Paquets internes consommés en source (`main: src/index.ts`), imports sans extension
   (`moduleResolution: Bundler`). Pas de `any`.

## Paquets
| Paquet | Rôle | Peut dépendre de |
|---|---|---|
| `@blowy/domain` | règles pures | rien |
| `@blowy/contract` | schémas Zod + table des routes | domain, zod |
| `@blowy/api-client` | client HTTP typé | contract |
| `@blowy/content` | libellés, voix des pets, défis, e-mails | domain |
| `@blowy/tokens` | couleurs, dégradés, typo, espacements | rien |
| `@blowy/ui` | composants React Native (atomique) | tokens, domain |

## API (`apps/api/src`)
```
main.ts · app.module.ts
config/env.ts                 variables validées par Zod au démarrage
shared/                       garde d'auth, décorateur @CurrentUser, pipe Zod, filtre d'erreurs, horloge, jetons d'injection
integrations/                 supabase (client service), storage, mailer (Resend), auth-verifier — port + adaptateur réel + adaptateur mémoire
modules/<module>/
  application/*.usecase.ts    un cas d'usage par commande ou requête ; dépend seulement de ports et du domaine
  ports.ts                    interfaces des dépôts du module
  infrastructure/             supabase-*.repository.ts et memory-*.repository.ts
  interface/*.controller.ts   REST : valide (contrat), appelle un cas d'usage, mappe vers le DTO
  <module>.module.ts          racine de composition
```
Modules : `me`, `pets`, `links` (messages, photo du jour, souvenirs), `encounters`, `invites`, `words`, `safety`, `health`.
Injection explicite partout (`@Inject(JETON)`) : pas de `emitDecoratorMetadata`, ce qui permet `tsx` en dev et `tsup` en build.

## App (`apps/mobile`)
```
app/                          routes expo-router (écrans fins)
src/core/                     config, ports (Auth, Api, Realtime, Media, Purchases) + adaptateurs, providers
src/features/<f>/             hooks react-query + logique d'écran ; index public
src/locales/fr.ts             textes de l'interface
assets/pets/*.webp            images des pets (registre typé dans packages/ui)
```

## Base (`supabase/migrations`)
Tables : `profiles`, `pets`, `pet_events`, `links`, `messages`, `link_reads`, `daily_photos`, `encounters`,
`word_votes`, `blocks`, `reports`. Compartiment de stockage privé `media` (URL signées émises par l'API).

## Produit (V6)
- Un pet par personne. 4 jauges à deux pôles (casanier↔sociable, posé↔joueur, piquant↔tendre, discret↔bavard) qui
  bougent avec l'activité et retombent vers 0.
- Un lien = deux personnes et leurs pets. 7 vies (un jour entier de silence en coûte une ; la photo du jour faite par
  les deux en rend une), lien fantôme à 0 (ranimable une fois), 7 niveaux (rendez-vous → l'œuf). Visages cachés avant
  le niveau 4, flous au 4, nets au 5.
- Dans chaque lien : aujourd'hui · chat · souvenirs. Les pets parlent dans le chat.
- Rencontres : ton pet croise d'autres pets (amis d'amis d'abord). Rien ne se passe sans ton tap : tu salues,
  l'autre accepte, le lien se crée.
- « 3 mots » : un lien web où tes potes choisissent 3 mots sur toi ; ils font bouger les jauges.
- 18 ans minimum. Signalement, blocage et suppression du compte dans l'app.
