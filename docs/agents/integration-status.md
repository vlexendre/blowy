# État d'intégration

| Date | Tranche | État | Preuve |
|---|---|---|---|
| 2026-11-01 | V0 socle | ✅ commit ba8bb8a | `pnpm install`, build domain/api-contract/design-tokens, 8 tests contraste OK |
| 2026-11-01 | V1 lancée (B, C, D) | en cours | — |
| 2026-11-01 | G économie/RevenueCat | ✅ intégré 766145b | vérifié par A (voir ligne suivante) |
| 2026-11-01 | C backend + D mobile + G | ✅ intégré 766145b | A : api build/typecheck OK ; api test 42/42 ; integration 33/33 ×2 ; migrate deploy + seed base vierge ; API+worker démarrés, readyz, login alex, /me, /pets/mine, /relationships, /subscriptions/me ; mobile typecheck, 63/63 ; sprites 14/14 ; eslint 0 |
| 2026-11-01 | B moteur/matching/tuning/content | ✅ intégré c68b416 | A : tests 6+9+8+62, simulateur 12 s, eslint 0, api typecheck + 42/42 |
| 2026-11-01 | V2 lancée : E (IA/médias/confiance), F (admin/web), D (branchement mobile↔API réelle) | en cours | — |
| 2026-11-01 | E IA/médias/confiance/vérification/RGPD + F admin/web/ui-web/social | ✅ intégré sur main | A : build+typecheck 30/30 tâches (api, admin, web, ui-web, ai…) ; mobile typecheck (fixture `mediaId` corrigée) ; tests unitaires 28/28 tâches (api 58, ai 48, mobile 63, pet-engine 62…) ; vitest admin/web exclut e2e ; integration 59/59 ×2 ; migrate deploy + seed base vierge, diff schéma nul ; API démarrée : readyz, login alex, /me, /pets/mine, /relationships, /subscriptions/me 200, /admin sans session 401 ; eslint 17/17. Non vérifié : Docker, Firebase staff, OpenAI/Veriff réels, MinIO |

## V5 — bugs et points relevés par les bancs
- [ ] Mobile : ouverture directe sur une route profonde → requêtes avant restauration du jeton → 401 → jeton effacé (constaté en web par H-visuel).
- [ ] Mobile : barre d'onglets visible sur les écrans de pile ; Bricolage chargée en largeur normale au lieu de font-stretch 85 % (UI-fondation).
- [ ] Seed : Alex à 0 pièce (maquette 340), pet qui paraît malade — à refaire pour la V5.

## Suites V2 (E/F)
- [ ] G : consommer `mission.proof_validated` ; job de suggestions IA automatiques (notifications).
- [ ] B : exporter `simulate` de `@blowy/pet-engine` (simulateur admin) ; moteur lisant le tuning publié au lieu de `DEFAULT_TUNING`.
- [ ] C : tables propres pour sessions staff / anti-rejeu TOTP / statut ConfigVersion (contournements F) ; port `RelationshipCorrections` ; relecture des ajouts E dans env/bootstrap/realtime/worker.
- [ ] Web : challenge anti-bot, deferred deep link (repli actuel : code d'invitation).

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
