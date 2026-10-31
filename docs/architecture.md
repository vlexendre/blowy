# Architecture Blowy

## Vue d'ensemble
```
apps/mobile  (Expo SDK 58, RN 0.88)  ─┐
apps/web     (Next 16, pages publiques) ├─ @blowy/api-client ── REST /v1 + Socket.IO ──► apps/api main.ts (Nest HTTP/WS)
apps/admin   (Next 16, back-office)   ─┘                                              │
                                                                                     PostgreSQL (vérité) ◄── outbox ──► apps/api worker.ts (BullMQ/Redis)
                                                                                     S3 privé (MinIO local)        OpenAI / RevenueCat / Firebase / Veriff / Expo Push
```

## Principes
- **Monolithe modulaire NestJS** : `apps/api/src/modules/{auth,users,pets,relationships,matching,conversations,media,missions,social,economy,notifications,trust,admin}`. Un domaine écrit ses propres tables ; interactions par services applicatifs et événements outbox.
- **Deux entrypoints** : `main.ts` (HTTP+WS) et `worker.ts` (consommateurs BullMQ, ticks, jobs planifiés), déployables séparément.
- **Commandes** : REST porte les écritures ; chaque commande = idempotence (acteur, opération, commandId), transaction, verrouillage ordonné (users → pets → relations → wallets), moteur pur, événement séquencé + outbox, commit. Aucun appel réseau sous verrou.
- **Moteur pur** `@blowy/pet-engine` : `reduce(state, event, ctx{now, seed, engineVersion, tuning}) → {state, effects}`. Exécuté côté serveur (autorité) et côté mobile pour l'affichage optimiste sur données autorisées uniquement.
- **Journal + projections** : événements métier append-only, contenus personnels référencés (purgeables), snapshots versionnés moteur/tuning pour replay.
- **Temps** : UTC en base, timezone IANA par utilisateur et timezone stable par relation/œuf/saison.
- **Adaptateurs** (`packages/ai`, `apps/api/src/integrations`) : interface + implémentation production réelle + implémentation locale déterministe ; sélection par configuration validée au démarrage ; production refuse les adaptateurs locaux.

## Clean architecture & patterns (consigne utilisateur du 2026-11-01)
**Backend — par module** `apps/api/src/modules/<m>/` :
`domain/` (entités, règles, erreurs ; délègue au moteur pur ; aucune dépendance Nest/Prisma) → `application/` (un use case par commande/requête + ports en interfaces) → `infrastructure/` (adapters Prisma/fournisseurs) → `interface/` (controllers REST, gateways WS, mappers DTO). Dépendances uniquement vers l'intérieur ; `<m>.module.ts` = composition root.
Briques transverses écrites une seule fois dans `src/shared/` : CommandBus (idempotence, transaction, verrous ordonnés, outbox), UnitOfWork, Clock/RandomSource injectables, guard d'auth, pipe Zod, mapper d'erreurs, pagination.
Patterns : Command, Repository + Unit of Work, Ports & Adapters, Strategy (politiques, choix d'adaptateur par environnement), Outbox/Observer (interdomaine).

**Mobile — atomic design + features** :
`packages/ui-mobile/src/{atoms,molecules,organisms,templates}` (un niveau n'importe que les niveaux inférieurs) ; écrans `apps/mobile/app/**` fins = template + organismes + hook ; aucun composant de présentation ni StyleSheet dupliqué dans un écran.
`apps/mobile/src/features/<f>/{api,model,ui}` avec index public ; `src/core/ports/*` (Auth, Purchases, Notifications, Location, Storage) + adapters réel/local injectés par Provider.

**Moteur** : `reduce` = dispatcher vers un registre de `ActionHandler` (Command/Strategy) ; aucune constante hors `@blowy/tuning`.

## Frontières de packages
| Package | Peut dépendre de | Interdit |
|---|---|---|
| domain | — | tout |
| tuning | domain, zod | runtime serveur |
| pet-engine | domain, tuning | DB, réseau, horloge, Math.random |
| matching | domain, tuning | DB, données privées brutes |
| api-contract | domain, zod | serveur |
| api-client | api-contract | database, ai |
| database, ai | serveur uniquement | bundles mobile/web |

## Environnements
local (adaptateurs déterministes, émulateurs) · test · staging · production (adaptateurs réels obligatoires ; démarrage refusé sinon).
