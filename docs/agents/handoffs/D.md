# Handoff D — Mobile (2026-11-01)

Périmètre : `apps/mobile`, `packages/ui-mobile`, `packages/sprites`, `docs/mobile/*`.
Architecture et patterns : `docs/mobile/architecture.md`. Widgets : `docs/mobile/widgets.md`.
Assets : `docs/mobile/assets-inventory.md` (généré).

## Fichiers principaux
- **Config Expo** : `apps/mobile/app.config.ts` (nom natif `Blowy`, slug `blowy`, `app.blowy` iOS/Android ;
  `BLOWY_SIDE_BY_SIDE=1` pour suffixer en dev/preview ; scheme `blowy` ; `applinks:blowy.app` + intent-filters
  autoVerify `/invite`, `/r` ; permissions FR caméra/photos/micro/localisation approximative + toujours (ange
  gardien)/notifications ; plugins expo-router, expo-font, expo-splash-screen, expo-secure-store,
  expo-apple-authentication, expo-notifications, expo-location, expo-camera, expo-image-picker, expo-audio,
  expo-build-properties, expo-widgets), `eas.json` (development/preview/production), `metro.config.js`
  (défaut `expo/metro-config` : détection monorepo auto depuis SDK 52, doc vérifiée), `babel.config.js`,
  `tsconfig.json`, `.env.example` (EXPO_PUBLIC_* publics uniquement), `assets/images/*` (icône/splash depuis la maquette).
- **packages/sprites** : `src/{types,catalog,resolve}.ts`, `src/data/asset-meta.ts` + `asset-sources.ts`
  (générés par `scripts/scan_assets.py`), `assets/**` (70 fichiers renommés), `scripts/inventory.mjs`, test.
  Export `@blowy/sprites/sources` (requires Metro) séparé de la logique pure.
- **packages/ui-mobile** : atomic design `src/{foundations,atoms,molecules,organisms,templates}`, règle
  ESLint locale `eslint.config.mjs`, entrée sans RN `@blowy/ui-mobile/pure`.
- **apps/mobile/src** : `core/` (ports, adapters, DI, http, routes, file hors ligne, temps réel, session,
  navigation), `features/{onboarding,account,pets,nest,matching,relationships,conversations,chats,trust,
  social,profile,subscription,economy}` (+ `purchases` = agent G, non modifié), `i18n/fr.json`, `widgets/`.
- **apps/mobile/app** : 40 routes fines (une ligne d'export par écran).
- **e2e** : `apps/mobile/e2e/maestro/{onboarding,nest,safety}.yaml` — **non exécutés : pas de simulateur**.

## Écrans → routes
| Écran (maquette) | Route |
|---|---|
| Aiguillage / reprise onboarding | `/` (app/index.tsx) |
| Accueil (V4-Welcome) / invitation (V4-Invite) | `/welcome`, `/invite/[code]` |
| Choix du pet + 4 curseurs (V4-Craft) | `/species` |
| Vision ×4 + carte (V4-Vie) | `/vision/[step]` (school, sunday, passions, limit) |
| Intention (V4-Intention) | `/intention` |
| Éclosion (V4-Eclosion) | `/hatch` |
| Compte + date de naissance + consentements (V4-Compte) | `/account` |
| Préférences de rencontre | `/preferences` |
| Selfie (V4-Verif) | `/verify` |
| Paywall (V4-Paywall) / modale | `/paywall-step`, `/paywall` (modal) |
| Ses rendez-vous (V4-Match) | `/matches` |
| Notifications (V4-Notifs) | `/notifications` |
| Nid (V4-Nid) + fiche, boutique, série, mission, ligue | `/nest`, `/nest/{fiche,shop,streak,mission,league}` |
| Chats (V4-Chats), conversation (V4-Chat), aucun RDV (V4-Vide) | `/chats`, `/chats/[id]`, `/chats/no-dates` |
| Arbre du Lien (V4-Lien) | `/chats/link/[id]` |
| Emménager, vote, révélation, RDV réel+gardien, œuf, naissance, garde, partir, pause | `/chats/relation/[id]/{move-in,vote,reveal,irl,egg,birth,custody,leave,pause}` |
| Carte (V4-Carte, consentement + zone floutée) | `/map` |
| Quartier, chez un ami, partager | `/neighborhood`, `/neighborhood/friend/[id]`, `/neighborhood/share` |
| Profil + compte, réglages, abonnement, confidentialité, notifications, signaler, supprimer, préférences | `/profile`, `/profile/[screen]` |

## Hooks → endpoints attendus
| Hook | Endpoint | État au 2026-11-01 |
|---|---|---|
| useSignIn / useSignOut / useDeviceSessions | `POST/DELETE/GET /v1/auth/sessions[/current]` | livré (C) |
| useMe, useUpdateProfile, useSavePreferences, useSavePrivacy | `GET/PATCH /v1/me`, `PUT /v1/preferences/{matching,privacy}` | livré |
| useConsents, useRecordConsents | `GET/POST /v1/consents` | livré |
| useStartVerification, useCompleteOnboarding, useGlobalPause | `POST /v1/verifications`, `/v1/me/onboarding/complete`, `/v1/pauses` | livré |
| useMyPet, useCreatePet, usePetActions | `GET /v1/pets/me`, `POST /v1/pets`, `POST /v1/pets/:id/actions` | contrat publié, contrôleur absent → « indisponible » |
| useMatchFeed, useAcceptProposal | `GET /v1/matches`, `POST /v1/match-proposals/:id/accept` | contrat publié, contrôleur absent |
| useRelationships, useRelationship, useRelationshipCommands | `GET /v1/relationships[/:id]`, `POST …/{move-in,consent,branch,reveal,leave,pause}` | contrat publié, routes de commandes à confirmer |
| useConversations, useConversation, useSuggestions | `GET /v1/conversations`, `GET/POST …/:id/messages`, `POST …/:id/read`, `POST /v1/messages/:id/reveal`, `GET …/:id/suggestions` | contrat partiel |
| useSafetyActions (file prioritaire) | `POST /v1/reports`, `POST /v1/blocks` | non publié (E) |
| useWalletBalance, useCatalog, useEconomyCommands, PaywallPanel | via client de G : `/v1/wallet`, `/v1/catalog`, `/v1/streak-freezes/use`, `/v1/subscriptions/me`, `/v1/purchases/*` | G |
| useFriends/useGroups/useLeague/useTodayMission/useCurrentEgg/useChildren/useSafetyDates | `/v1/friends`, `/v1/groups`, `/v1/league`, `/v1/missions/today`, `/v1/eggs/current`, `/v1/children`, `/v1/safety-dates` | non publiés → sonde d'état uniquement, aucune donnée rendue |
| registerDevice, requestExport, requestDeletion | `POST /v1/devices`, `/v1/exports`, `/v1/deletion-requests` | non publiés |
| Temps réel | Socket.IO `path /v1/ws`, auth.token, `join`, `sync` → `resync {room, sinceCursor}`, `access.revoked` | livré (gateway C) |

## Tests exécutés (commande → résultat)
- `pnpm --filter @blowy/mobile typecheck` → OK (0 erreur ; sonde d'erreur vérifiée).
- `pnpm --filter @blowy/mobile test` → **15 fichiers, 63 tests passés** (file hors ligne, réducteur
  pending/confirmé/corrigé, curseurs WS/backoff, transport HTTP + détection route absente, liens entrants,
  env, onboarding/reprise/18+/repli premium/consentements, messages avertis/pending, actions du Nid,
  libellés VoiceOver, jauges, Lien/portes, propositions honnêtes, paywall/prix store/démo, widget, i18n ; dont 4 tests de G).
- `pnpm --filter @blowy/sprites test` → **14 tests passés** (chemins existants ou repli déclaré, transparence,
  ligne de sol, 12 accessoires × espèces × stades, frames, bébé, inventaire à jour).
- `pnpm --filter @blowy/ui-mobile typecheck` / `test` → OK / **7 tests passés** (respiration, frames, caméra, labels).
- `npx eslint apps/mobile packages/ui-mobile packages/sprites` → **0 erreur, 0 avertissement**.
- `npx expo config --type public` → OK ; `npx expo install --check` → « Dependencies are up to date » ;
  `npx expo-doctor` → **20/20** (après ajout de `expo-asset`, pair requis par expo-audio).
- `npx expo export --platform ios` → **OK** (Hermes 7,6 Mo, 70 assets sprites) ; `--platform android` → **OK**.
- `npx expo prebuild --no-install --clean` → OK (cible widget iOS + App Group + manifest Android) ; `ios/` `android/` supprimés ensuite.
- Registre de layouts expo-widgets iOS et Android construit sans erreur.
- **Non exécutés** : builds Xcode/Gradle, appareil, Maestro (pas de simulateur).

## Dépendances ajoutées (via flock, versions SDK 58)
`@blowy/mobile` : `@expo/ui ~58.0.26` (déjà transitif via expo-widgets), `expo-asset ~58.0.19`.
`@blowy/ui-mobile` (dev) : react, react-native, reanimated, worklets, gesture-handler, expo-blur, expo-image,
safe-area-context, svg — mêmes spécificateurs que l'app (instances uniques vérifiées).
`react-native-purchases` laissé à 10.16.0.

## Limites natives / honnêteté
- Auth Apple/Google : `FirebaseAuthAdapter` écrit, mais **SDK Firebase non installé** → mode NOT_CONFIGURED
  affiché ; en local, `LocalAuthAdapter` → `LocalAuthProvider` de l'API (`local:<clé>`).
- Selfie : permission caméra + `POST /v1/verifications` ; la capture fournisseur (Veriff, agent E) reste à brancher.
- Widget Android : affichage OK, **pas d'ouverture au tap** (limite runtime expo-widgets 58, cf. widgets.md).
- Série, ligue, missions, Quartier, œuf/garde : écrans câblés sur sondes d'endpoint ; « indisponible »
  tant que les DTO ne sont pas publiés. Compteur de série affiché « — » (pas de lecture de série dans les contrats).
- Paywall : titre « N rencontres à découvrir » (N réel) — « N pets veulent le rencontrer » impossible tant que
  le contrat n'expose pas d'intérêts humains (P-5.10). Offre −60 % uniquement si G la trouve dans les offerings.
- Reanimated 4 / GH 3 : API hooks v3 (`usePanGesture`, `usePinchGesture`, `useSimultaneousGestures`) — vérifiées
  par tsc et bundling, pas sur appareil.

## Demandes
- **C** : (1) monter les contrôleurs pets, matching, relationships, conversations conformes aux contrats ;
  (2) confirmer les chemins de commandes relation (`/move-in`, `/consent`, `/branch`, `/reveal`, `/leave`, `/pause`)
  et conversation (`/read`, `/v1/messages/:id/reveal`) ; (3) renvoyer `detailsSafe.reason='ROUTE_NOT_FOUND'`
  pour les routes inconnues (aujourd'hui détecté via le message « Cannot GET ») ; (4) publier `@blowy/api-client`
  (le mobile basculera dans `core/providers/services.tsx`) ; (5) DTO `/v1/devices` (jeton push) ; (6) exposer la
  série (`streakLength`) dans une lecture (me ou wallet) ; (7) seed local avec relations de démo.
- **E** : `api-contract/trust.ts` pour `POST /v1/reports` `{relationshipId|null, conversationId|null, category}`
  et `POST /v1/blocks` `{relationshipId|null, conversationId|null}` (corps utilisés côté mobile, à confirmer),
  suggestions `{items:{text}[]}`, capture selfie Veriff.
- **G** : DTO streak/ligue/missions/Quartier/œufs ; rien d'autre côté achats (port ré-exporté, `PurchasesProvider`
  monté dans `core/providers/AppProviders.tsx`, hooks consommés par PaywallPanel/SubscriptionScreen/PlusGate ;
  `useWalletBalance` réutilise `createPurchasesApi` avec les mêmes clés de cache).
- **A** : reprendre éventuellement la règle atomique de `packages/ui-mobile/eslint.config.mjs` à la racine ;
  ajouter `"exports"` de `@blowy/sprites` (`./sources`) au contrôle de bundle si besoin.
