# Tester Blowy en local sur simulateur iOS

> **État au 2026-11-01 00:35** : l'agent mobile construit encore l'app. Le dossier `apps/mobile/app` n'existe pas encore ; la configuration Expo (`app.config.ts`) et le fichier `.env.example` non plus. L'API n'est pas encore démarrable. Cette procédure deviendra exécutable à l'intégration de la vague V1 ; ce document sera mis à jour avec les identifiants de démo réels du seed.

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
pnpm infra:up           # Postgres 5432, Redis 6379, MinIO 9000/9001, émulateur Firebase Auth 9099
pnpm db:migrate         # applique les migrations Prisma
pnpm db:seed            # données fictives : Alex/Nino, L./Suzie, M./Gaston, S./Pia, Quartier…
```

## 3. Lancer le backend
```bash
pnpm dev                # API HTTP/WS sur http://localhost:3000 (+ admin et web)
curl http://localhost:3000/v1/healthz/ready
```

## 4. Lancer l'app sur le simulateur
Dans `apps/mobile/.env` :
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
```
Le simulateur iOS partage le réseau du Mac : `localhost` fonctionne. Sur un iPhone physique, mets l'IP locale du Mac à la place.

```bash
pnpm --filter @blowy/mobile ios
```
Cette commande lance `expo run:ios`. Elle génère le projet natif (`ios/`), installe les pods, compile le *dev client*, ouvre le simulateur et démarre Metro. La première compilation prend plusieurs minutes ; les suivantes peuvent se faire avec `pnpm dev:mobile`, qui démarre seulement Metro.

En local, la connexion passe par le fournisseur d'authentification local ou l'émulateur Firebase. Pas besoin de compte Apple.

## 5. Tester une rencontre à deux
1. Liste les simulateurs avec `xcrun simctl list devices`, puis démarre un deuxième appareil, par exemple `xcrun simctl boot "iPhone 17"`.
2. Lance l'app sur cet appareil : `cd apps/mobile && npx expo run:ios --device "iPhone 17"`.
3. Connecte-toi avec deux comptes de démo différents, un par simulateur.
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
pnpm infra:down && docker volume rm blowy-local_pg   # base locale uniquement
pnpm infra:up && pnpm db:migrate && pnpm db:seed
```
