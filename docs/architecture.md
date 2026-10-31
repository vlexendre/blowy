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
