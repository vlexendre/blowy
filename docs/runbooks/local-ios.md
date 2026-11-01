# Tester Blowy en local sur simulateur iOS

> **État au 2026-11-01 (intégration V1)** : app Expo, API et worker intégrés. Le parcours « connexion alex → Nid → action → conversation → message modéré » est vérifié contre l'API locale par `pnpm --filter @blowy/mobile test:api` (12 tests réels). Le build natif iOS n'a pas été compilé dans l'environnement de CI de l'agent (pas de Xcode) : `expo prebuild` et le bundling JS iOS passent.

## Prérequis (Mac)
- macOS récent + **Xcode** (version supportée par Expo SDK 58) avec un simulateur iOS installé (Xcode › Settings › Components).
- Outils en ligne de commande Xcode : `xcode-select --install`.
- **CocoaPods** : `brew install cocoapods`.
- **Node 22** (`nvm install 22` ; le dépôt contient `.nvmrc`) et **pnpm 10** via `corepack enable`.
- **Docker Desktop** (Postgres, Redis, MinIO, émulateur Firebase Auth).
- Watchman conseillé : `brew install watchman`.

**Expo Go ne suffit pas** : l'app utilise des modules natifs (achats, widgets, SecureStore, localisation). Il faut un *development build*, généré par `expo run:ios`.

## 1. Récupérer le code et installer
```bash
git clone https://github.com/vlexendre/blowy.git && cd blowy
corepack enable
pnpm install
pnpm setup:local        # crée les .env locaux à partir des .env.example, sans rien écraser
```

## 2. Lancer les services et la base
```bash
pnpm infra:up           # Postgres 5432, Redis 6379, S3 (MinIO Chainguard) 9100/9101 ; émulateur Firebase : --profile firebase
pnpm db:migrate         # applique les migrations Prisma
pnpm db:seed            # données fictives : Alex/Nino, L./Suzie, M./Gaston, S./Pia, Quartier…
```

## 3. Lancer le backend
```bash
pnpm --filter @blowy/api dev        # API HTTP/WS sur http://localhost:3000 (AUTH_PROVIDER=local par défaut)
curl http://localhost:3000/v1/readyz
# Worker (modération des messages, ticks, lots) dans un autre terminal :
cd apps/api && pnpm build && node dist/worker.js
```
Sans worker, les messages restent « En vérification » (PENDING_MODERATION) : c'est voulu, rien n'est distribué avant modération.

## 4. Lancer l'app sur le simulateur
Dans `apps/mobile/.env` (copie de `.env.example`) :
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=http://localhost:3000
EXPO_PUBLIC_BLOWY_ENV=local
EXPO_PUBLIC_AUTH_MODE=local
```
Le simulateur iOS partage le réseau du Mac : `localhost` fonctionne. Sur un iPhone physique, mets l'IP locale du Mac à la place.

```bash
pnpm --filter @blowy/mobile ios
```
Cette commande lance `expo run:ios`. Elle génère le projet natif (`ios/`), installe les pods, compile le *dev client*, ouvre le simulateur et démarre Metro. La première compilation prend plusieurs minutes ; les suivantes peuvent se faire avec `pnpm dev:mobile`, qui démarre seulement Metro.

En local, la connexion passe par le fournisseur d'authentification local de l'API (pas besoin de compte Apple).

## 4 bis. Comptes de démo
Sur l'écran d'accueil, touche **« Connexion de développement (comptes de démo) »** (affiché seulement si `EXPO_PUBLIC_AUTH_MODE=local` et jamais quand `EXPO_PUBLIC_BLOWY_ENV=production`), puis choisis un compte :

| Clé | Contenu du seed |
|---|---|
| `alex` | Alex, 28 ans, pet **Nino** ; rendez-vous avec Suzie (L.) au niveau 2, conversation, mission en analyse |
| `l` | L., pet **Suzie** ; l'autre côté du rendez-vous d'Alex |
| `m`, `s` | M. (Gaston), S. (Pia) |
| `ines`, `tom`, `maya` | Quartier et bande d'Alex |
| `test.a`, `test.c`, `test.d` | comptes de test vérifiés |
| `test.b` | compte **non vérifié** (pas de propositions) |
| `solo` | zone sans autres pets (attente honnête) |

Une autre clé (champ « Autre clé locale ») crée un **nouveau compte** et lance l'onboarding complet. Les mêmes clés fonctionnent en `curl` : `POST /v1/auth/sessions {"provider":"local","credential":"alex"}`.

Vérification automatisée du parcours mobile ↔ API (API + worker démarrés, base seedée) :
```bash
BLOWY_API_URL=http://localhost:3000 pnpm --filter @blowy/mobile test:api
```

## 5. Tester une rencontre à deux
1. Liste les simulateurs avec `xcrun simctl list devices`, puis démarre un deuxième appareil, par exemple `xcrun simctl boot "iPhone 17"`.
2. Lance l'app sur cet appareil : `cd apps/mobile && npx expo run:ios --device "iPhone 17"`.
3. Connecte-toi avec deux comptes de démo différents, un par simulateur (par exemple `alex` et `l` : ils partagent déjà un rendez-vous et une conversation).
4. Suis le parcours : onboarding → vérification démo → proposition → double acceptation → chat → mission.

## Ce qui fonctionne en local et ce qui ne fonctionne pas
| Fonction | En local |
|---|---|
| Achats / Blowy+ (RevenueCat) | Mode **LOCAL_DEMO** étiqueté. Un vrai achat sandbox exige les clés RevenueCat, un compte Apple Developer et un appareil ou un simulateur connecté à un compte sandbox. |
| Vérification d'identité (Veriff) | Badge de démo distinct, jamais « vérifié ». |
| Modération / IA (OpenAI) | Adaptateur local déterministe sans `OPENAI_API_KEY`. |
| Notifications push | Le simulateur reçoit les push locaux et les fichiers `.apns` déposés dessus. Les vrais push APNs nécessitent un appareil et des identifiants. |
| Widgets iOS | Compilés avec `expo run:ios`. Ajoute-les depuis l'écran d'accueil du simulateur (appui long › +). |
| Connexion Apple réelle | Appareil ou simulateur connecté à un identifiant Apple, plus la capability configurée. En local, utilise le compte de démo. |

## Réinitialiser les données de test
```bash
pnpm infra:down && docker volume rm blowy-local_pg   # base locale uniquement (préfère `docker compose -f infra/compose.yaml down -v` pour tout effacer)
pnpm infra:up && pnpm db:migrate && pnpm db:seed
```
