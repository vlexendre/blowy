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

## V5 — état des tranches (alignement C, 2026-11-06, `docs/agents/handoffs/V5-alignement.md`)
| Tranche | État | Preuve |
|---|---|---|
| T0 contrats + T1 moteur | ✅ (+ `maxSameGender` dur, `tuning-2026.12.3`, `groups-2026.12.2`) | matching 35/35, tuning/domain/pet-engine verts |
| T2 sorties (C) | ✅ aligné V5.3 : prénoms à `lockAt`, annulation gratuite carte / reste offerte, `storyMatch` littéral, motifs renommés, demande auto, auteurs du chat par le pet, export RGPD V5 | api unit 148/148 ; intégration 109/109 ×2 |
| T3 paiements (G) | ✅ (D-042 appliqué : plus de crédit 90 j ; paramètres lus du tuning ; `v5Entitlements`) | parcours `ines-paie-sa-place`, `maya-achete…` (V5) |
| T4 sécurité (E) | ✅ (position d'alerte jamais stockée, seuils `[T]`) | `safety-v5`, parcours J9/J10 |
| T5 liens (C2) | ✅ (`DUO_ALLOWANCE`, `quota`, vocal facultatif en duo débloqué) | `connections-v5`, parcours `thomas…`, `lea-et-hugo…` (V5) |
| Retrait V4 (§7.7) | ✅ 410 `RETIRED_IN_V5` actifs (middleware avant auth) ; parcours V4 réécrits en V5 | `test/unit/retired-routes.test.ts` ; parcours **160 ✅ / 0 ❌ / 4 ⛔** |
| Schéma | ✅ migration additive `20261106180000_v5_align` (index journal `DomainEvent`) | migrate deploy + seed base vierge, diff vide |
| Turbo complet `--concurrency=4` | 62/66 ; échecs hors backend en cours : `mobile#lint`, `mobile#test`, `ui-mobile#test`, `qa#test` | `pnpm turbo run build typecheck test lint --concurrency=4 --continue` |

- [ ] D : `mobile#lint` (3 erreurs), `mobile#test` (`core/navigation/paths.test.ts`), `ui-mobile#test` (`atoms/styles.test.ts`) — travaux mobile en cours.
- [ ] A/H : `qa#test` (`tooling/qa/visual/compare.test.mjs`, route `/verify/failed`).
- [ ] Restes V5 : accessoire de parrainage (au lieu des pièces V4), « je connais quelqu'un » → déplacement vers un autre groupe, `KNOWN_CONTACT`, tables `Payment`/`VenueCompensation` quand la finance (F) en aura besoin.

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
