# État d'intégration

| Date | Tranche | État | Preuve |
|---|---|---|---|
| 2026-11-01 | V0 socle | ✅ commit ba8bb8a | `pnpm install`, build domain/api-contract/design-tokens, 8 tests contraste OK |
| 2026-11-01 | V1 lancée (B, C, D) | en cours | — |
| 2026-11-01 | G économie/RevenueCat | terminé, à re-vérifier par A à l'intégration | rapport G : api test 42 OK, integration 33 OK (2e passage) |

## Points à régler avant merge V1 → main
- [ ] Tests d'intégration instables au 1er passage (privacy, idor, journey, idempotency : « profile 400 zoneCode ») — C.
- [ ] Rate limit global appliqué à `POST /v1/webhooks/revenuecat` → exclure/relever (sinon 429 côté RevenueCat) — C.
- [ ] Seed : abonnement démo d'Alex à créer via le fournisseur LOCAL_DEMO (sinon perdu au 1er /purchases/sync) ; pièces de bienvenue avec motif dédié, pas STAFF_CORRECTION sans acteur — C.
- [ ] Tuning : créneaux 1/3, expiration boost 7 j, gels max 5 — B.
- [ ] Mobile : ré-export unique du PurchasesPort + PurchasesProvider monté — D.
- [ ] Reproduire moi-même : build, typecheck, lint, test, test:integration (2 passages), migrate+seed sur base vierge, API qui démarre.
- [ ] Mac utilisateur : Xcode 26 (Swift 6.2.4) → passage Xcode 27 requis pour SDK 58 (erreur expo-modules-jsi).
