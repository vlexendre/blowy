# État d'intégration

| Date | Tranche | État | Preuve |
|---|---|---|---|
| 2026-11-01 | V0 socle | ✅ commit ba8bb8a | `pnpm install`, build domain/api-contract/design-tokens, 8 tests contraste OK |
| 2026-11-01 | V1 lancée (B, C, D) | en cours | — |
| 2026-11-01 | G économie/RevenueCat | ✅ intégré 766145b | vérifié par A (voir ligne suivante) |
| 2026-11-01 | C backend + D mobile + G | ✅ intégré 766145b | A : api build/typecheck OK ; api test 42/42 ; integration 33/33 ×2 ; migrate deploy + seed base vierge ; API+worker démarrés, readyz, login alex, /me, /pets/mine, /relationships, /subscriptions/me ; mobile typecheck, 63/63 ; sprites 14/14 ; eslint 0 |
| 2026-11-01 | B moteur/matching/tuning/content | ✅ intégré c68b416 | A : tests 6+9+8+62, simulateur 12 s, eslint 0, api typecheck + 42/42 |
| 2026-11-01 | V2 lancée : E (IA/médias/confiance), F (admin/web), D (branchement mobile↔API réelle) | en cours | — |

## Points à régler avant merge V1 → main
- [x] Tests d'intégration instables au 1er passage (privacy, idor, journey, idempotency : « profile 400 zoneCode ») — C.
- [x] Rate limit global appliqué à `POST /v1/webhooks/revenuecat` → exclure/relever (sinon 429 côté RevenueCat) — C.
- [x] Seed : abonnement démo d'Alex à créer via le fournisseur LOCAL_DEMO (sinon perdu au 1er /purchases/sync) ; pièces de bienvenue avec motif dédié, pas STAFF_CORRECTION sans acteur — C.
- [ ] Tuning : créneaux 1/3, expiration boost 7 j, gels max 5 — B.
- [x] Mobile : ré-export unique du PurchasesPort + PurchasesProvider monté — D.
- [x] Reproduire moi-même : build, typecheck, lint, test, test:integration (2 passages), migrate+seed sur base vierge, API qui démarre.
- [ ] Mac utilisateur : Xcode 26 (Swift 6.2.4) → passage Xcode 27 requis pour SDK 58 (erreur expo-modules-jsi).

## Suite (V2/V3)
- [ ] Remplacer `ProvisionalEngineGateway` par un adaptateur `@blowy/pet-engine` (reduce + effets → ledger/notifications/fiabilité) ; schéma : engineState/versions/graine par pet et relation, `mission_reward_contexts`, `egg_sessions` — après la vague E (propriétaire du schéma en cours).
- [ ] Équilibrage : simulateur N3@J14 = 2,2 % vs hypothèse 20 % ; 15 % du temps-pet actif malade ; 32,7 % de sorties silencieuses — décision produit demandée à l'utilisateur.
- [ ] Domain : déplacer clamp/clamp01/mulDivFloor depuis tuning ; capacité TRANSFER_TO_NEIGHBORHOOD.
