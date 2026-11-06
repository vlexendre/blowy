# Architecture mobile (apps/mobile, packages/ui-mobile, packages/sprites)

## Couches

```
app/**                    Routes Expo Router FINES : une ligne qui exporte l'écran d'une feature.
src/features/<feature>/   api/ (Repository + hooks TanStack Query) · model/ (Zustand, logique pure)
                          · ui/ (écrans composés de templates/organismes de ui-mobile)
                          index.ts = seule API publique (aucun import croisé interne).
src/core/                 ports/ (interfaces) · adapters/ (réel + local) · providers/ (DI, composition)
                          api/ (transport HTTP, routes, Query) · offline/ (file + réducteurs purs)
                          realtime/ (Socket.IO + curseurs) · session/ · navigation/ · config/
src/i18n/                 fr.json + t() typé (clés dérivées du JSON)
src/widgets/              widgets iOS/Android (expo-widgets) + instantané pur
packages/ui-mobile        Design system natif, atomic design (ci-dessous)
packages/sprites          Manifest typé des sprites, repli de pose, inventaire, sources Metro
```

## Atomic design (packages/ui-mobile/src)

`foundations` (jetons → thème RN, a11y, moteur de respiration, injection des sources d'images,
typographie fidèle `typography.ts`, moteur de keyframes CSS `keyframes.ts` + horloge
`motion-clock.tsx` live/rest/frozen, halos `blur.ts`, marges d'écran `layout.ts`)
→ `atoms` (Text, DisplayText, Label, Caption, Stamp, Card, Blob, PopIn, Icon, Pressable3D, Button,
Surface, Chip, Badge, ProgressBar, Sprite, IconButton, Slider, TextField, Toggle, Dot ; résolveurs
de style purs `atoms/styles.ts`) → `molecules` (Gauge, ListRow, ActionTile, StatChip, ProgressDots,
MessageBubble, OptionCard, Banner, Header, SectionTitle, KeyValue, LabeledSlider, StatusPill,
NumberStepper, PetSprite, OrbitRing) → `organisms` (PetRenderer, PetScene, TabBar, ActionGrid, GaugePanel, LinkCard,
Sheet, ChatThread, Composer, LinkTree, MissionCard, PaywallOffer, VisionCard, StateViews,
PetCarousel, RelationSwitcher) → `templates` (OnboardingStep, TabScreen, DetailScreen,
ModalSheet, Celebration, EmptyState, ChatScreen, ScreenTemplate).

Langage visuel relevé valeur par valeur (CSS maquette → RN) : `docs/design/design-language.md`.
Polices : instances statiques Bricolage (opsz/wdth figés) + Inter générées par
`apps/mobile/scripts/fonts/build-fonts.py` → `assets/fonts/`, chargées par `app/_layout.tsx`.
Route interne `/(dev)/kitchen-sink` (`EXPO_PUBLIC_BLOWY_ENV=local` seulement) : V4-Welcome
reproduit avec les seuls composants (`?t=2550` fige les animations, `?view=catalog`).

Règle : un niveau n'importe jamais un niveau supérieur — `packages/ui-mobile/eslint.config.mjs`
(`no-restricted-imports` par dossier ; vérifié par une sonde). Barrel `index.ts` par niveau.
`@blowy/ui-mobile/pure` expose la logique sans React Native (tests Node).

Aucune couleur en dur hors `foundations/theme.ts` (dérivé de `@blowy/design-tokens`) ; les
écrans n'ont aucun `StyleSheet.create` (audit grep). Exception documentée : le corps des widgets
(`'widget'` interdit tout import) recopie 4 valeurs de jetons.

## Patterns

- **Port/Adapter** (`src/core/ports`) : AuthPort (LocalAuthAdapter → LocalAuthProvider de l'API ;
  FirebaseAuthAdapter Apple/Google, pont Firebase à brancher), StoragePort/SecretStoragePort
  (AsyncStorage / SecureStore / mémoire), NotificationsPort, LocationPort (floutage 500 m dans
  l'adaptateur), HapticsPort, CameraPermissionPort, **PurchasesPort = ré-export de la feature
  achats de l'agent G** (aucune seconde interface).
- **Conteneur DI** : `ServicesProvider` (`core/providers/services.tsx`) choisit les adaptateurs
  selon `EXPO_PUBLIC_BLOWY_ENV` ; `useServices()` est le seul accès des features.
- **Repository** : chaque feature a `createXRepository(http)` ; les hooks ne parlent qu'au repository.
- **Command + file** : commandes hors ligne (`PET_ACTION` soins, `SEND_MESSAGE`, `BLOCK`,
  `REPORT`) envoyées par des *senders* enregistrés par feature (`registerSender`) ; le runner ne
  connaît pas les routes. commandId = Idempotency-Key, conservé à chaque retry.
- **Strategy** : sélection d'adaptateur achats (G), auth, rendu de pose (repli déclaré).

## Données et hors ligne

TanStack Query (serveur) · Zustand (UI : session, file, onboarding, réseau, temps réel) ·
SecureStore (jeton). Réducteurs purs testés : `core/offline/queue.ts` (priorité sécurité, masquage
local, annulation des envois sur blocage, backoff), `core/offline/optimistic.ts` (pending →
confirmé/corrigé, réponses périmées ignorées), `core/realtime/cursor.ts` (dédup, curseur par room).
Le pet reste figé au dernier état serveur (`stateAsOf` affiché) ; aucune jauge n'est inventée.

Transport : `@blowy/api-client` via `core/api/client.ts` (`BlowyClient` + `raw`) — Bearer, Idempotency-Key,
erreurs structurées (`core/api/errors.ts`) ; une route absente côté API → état « indisponible ».
