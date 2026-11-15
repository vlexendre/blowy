# Connexion : Apple sur iPhone, Google sur Android

Blowy n'a plus de code par e-mail pour les vrais comptes (spéc. V7 §11). L'app ouvre la session Supabase avec le
fournisseur du téléphone, puis l'API lit le jeton Supabase comme avant (rien ne change côté API).

| Où | Bouton | Comment |
|---|---|---|
| iPhone | « Continuer avec Apple » (bouton officiel d'Apple) | `expo-apple-authentication` → jeton d'identité → `supabase.auth.signInWithIdToken({ provider: 'apple' })` |
| Android, web | « Continuer avec Google » | page de Google dans le navigateur du système (`expo-web-browser`), flux PKCE de Supabase → `exchangeCodeForSession` |
| Partout, replié sous les boutons | « Connexion par e-mail » (adresse et code) | seulement pour le compte de revue d'Apple (`REVIEW_EMAIL`, `REVIEW_CODE` côté API) : `POST /v1/review/session` ouvre une session Supabase, l'app la pose avec `setSession` ; toute autre adresse : « Adresse ou code incorrect. » (docs/APP-REVIEW.md) |
| Mode local (`EXPO_PUBLIC_AUTH=local`) | les deux boutons (simulés) ; « Connexion par e-mail » accepte aussi le code de développement (`000000`) pour toute adresse | aucun service externe ; un même fournisseur rouvre le même compte (tester « J'ai déjà un compte ») |

Code : `apps/mobile/src/core/adapters/supabase.ts` (`signInWith`), `apple-sign-in.ios.ts`, `local.ts` ; écran
`app/(onboarding)/connexion.tsx` ; retour de Google `app/(onboarding)/auth-callback.tsx`.

- Apple : seule l'**adresse e-mail** est demandée (l'API s'en sert pour les e-mails transactionnels). Le nom n'est pas
  demandé : l'inscription pose « On t'appelle comment ? ». La personne peut masquer son adresse (relais d'Apple).
- Annuler la feuille du fournisseur : rien d'alarmant, une ligne « Connexion annulée ». Échec : message et « Réessayer ».
- Google n'utilise aucun module natif : pas d'empreinte SHA-1 ni d'identifiant Google dans l'app, tout se règle dans
  Supabase. (Le module natif `@react-native-google-signin` imposerait un schéma d'URL iOS alors que Google n'est pas
  proposé sur iPhone, et sa version gratuite repose sur l'ancienne pile de Google.)

## Ce que le propriétaire doit régler

### 1. Apple Developer
1. Certificates, Identifiers & Profiles → Identifiers → l'App ID `app.blowy` → cocher **Sign in with Apple**
   (« Enable as a primary App ID »). EAS le fait aussi au premier build grâce à `ios.usesAppleSignIn` (`app.config.ts`).
2. Rien d'autre pour la connexion native (pas de Services ID ni de clé, tant qu'il n'y a pas de connexion Apple sur le web).

### 2. Supabase (Authentication → Providers)
1. **Apple** : activer. « Client IDs » : l'identifiant de l'app `app.blowy` (ajouter `host.exp.Exponent` pour Expo Go,
   et les variantes de développement s'il y en a, séparées par des virgules). Pas de clé secrète pour le natif.
2. **Google** : activer, coller le **Client ID** et le **Client secret** d'un identifiant OAuth « Application Web » créé
   dans Google Cloud Console (APIs & Services → Credentials). Dans Google Cloud, « Authorized redirect URIs » :
   `https://<projet>.supabase.co/auth/v1/callback`.
3. Authentication → URL Configuration → **Redirect URLs** : ajouter `blowy://auth-callback` (Android) et
   `https://blowy.app/auth-callback` (web ; plus l'adresse de recette si elle diffère).
4. Écran de consentement OAuth de Google : nom « Blowy », logo, liens vers `/legal/confidentialite` et
   `/legal/conditions`, domaine `blowy.app` vérifié.

### 3. Réglages de l'app (publics, `EXPO_PUBLIC_*`)
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (clé publique « anon/publishable »), `EXPO_PUBLIC_API_URL`,
`EXPO_PUBLIC_WEB_URL`. Aucun identifiant Google ni Apple n'est nécessaire dans l'app. Jamais de clé secrète.

## Règles d'Apple à garder en tête
- Le bouton est le bouton officiel (`AppleAuthenticationButton`, style blanc, « Continuer ») : libellé, logo et
  proportions viennent du système.
- La suppression du compte existe dans Moi (et reste possible pour un compte suspendu).
- **Révocation des jetons à la suppression du compte** : branchée, voir la section suivante.

## Révocation des jetons d'Apple à la suppression du compte

Apple demande aux apps qui proposent Sign in with Apple de **révoquer les jetons** de la personne quand son compte est
supprimé (App Review 5.1.1(v) ; [TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple)).
Supabase ne le fait pas : il ne garde pas les jetons des fournisseurs (« Provider tokens are intentionally not stored
in your project's database ») et, en connexion native (`signInWithIdToken`), il ne reçoit que le jeton d'identité,
qui ne sert pas à révoquer. Blowy suit donc le flux décrit par Apple :

1. **À la connexion (iPhone)** : `expo-apple-authentication` rend aussi `authorizationCode` (valable 5 minutes, une
   seule fois). Juste après l'ouverture de la session Supabase, l'app l'envoie à `POST /v1/me/apple-authorization`
   (`apps/mobile/src/core/adapters/apple-sign-in.ios.ts`, `supabase.ts`, `features/session` › `useSignInWith`). Un
   échec n'empêche pas la connexion ; le code suivant (prochaine connexion avec Apple) remplacera le jeton.
2. **L'API échange le code** : `POST https://appleid.apple.com/auth/token`, formulaire
   `client_id`, `client_secret`, `code`, `grant_type=authorization_code` (pas de `redirect_uri` : la connexion native
   n'en donne pas). Le `refresh_token` reçu est gardé dans `apple_tokens` (une ligne par compte, rattachée à
   `auth.users`, RLS sans politique : jamais lisible par l'app ; jamais journalisé).
3. **À la suppression** (« Supprimer mon compte », suppression par la modération, comptes inactifs supprimés par la
   conservation des données : tous passent par `DeleteMe`) : l'API appelle
   `POST https://appleid.apple.com/auth/revoke` avec `client_id`, `client_secret`, `token=<refresh_token>`,
   `token_type_hint=refresh_token`, **puis** supprime le compte. Apple répond 200 (aussi pour un jeton déjà révoqué).
   Un échec (Apple injoignable, jeton refusé) est journalisé sans le jeton et **ne bloque jamais** la suppression.

`client_secret` : un JWT signé **ES256** avec la clé « Sign in with Apple » (`.p8`), refait à chaque appel (5 minutes) :
en-tête `{ "alg": "ES256", "kid": <Key ID> }`, revendications `{ "iss": <Team ID>, "iat", "exp" (6 mois au plus),
"aud": "https://appleid.apple.com", "sub": <client_id> }`. Le `client_id` est l'identifiant de l'app qui a reçu le
code : en natif, le bundle iOS (`app.blowy`).

Code : `apps/api/src/integrations/auth/apple-revocation.ts` (port `AppleTokenClient` : réel `AppleIdTokenClient`,
mémoire `MemoryAppleTokenClient`, désactivé `DisabledAppleTokenClient` ; dépôt `AppleTokenStore` Supabase ou mémoire ;
cas d'usage `AppleRevocation`), appel dans `modules/me/application/delete-me.usecase.ts`, route dans
`me.controller.ts`, variables dans `config/apple-signin.env.ts`, table dans `20261115180000_gaps.sql`.

### Variables (`apps/api/.env` seulement, jamais dans l'app ni dans le dépôt)
| Variable | Contenu |
|---|---|
| `APPLE_SIGNIN_KEY_P8` | contenu PEM de la clé `.p8` « Sign in with Apple » (les `\n` littéraux sont acceptés) |
| `APPLE_SIGNIN_KEY_ID` | identifiant de la clé (10 caractères) |
| `APPLE_SIGNIN_TEAM_ID` | identifiant de l'équipe Apple Developer (10 caractères) |
| `APPLE_SIGNIN_CLIENT_ID` | facultatif ; défaut : `APPLE_BUNDLE_ID` (`app.blowy`) |

Les trois premières vont ensemble (sinon l'API refuse de démarrer). Sans elles : révocation désactivée, l'API répond
`{ "status": "skipped" }` au code envoyé par l'app et la suppression du compte se fait sans appel à Apple (comportement
d'avant). Avec les adaptateurs mémoire (local, tests), un Apple imité garde et « révoque » les jetons.

### Console Apple
1. Certificates, Identifiers & Profiles → **Keys** → « + » → nom (« Blowy Sign in with Apple »), cocher
   **Sign in with Apple** → Configure → Primary App ID : `app.blowy` → Save → Continue → Register.
2. **Télécharger la clé `.p8`** (une seule fois possible) et noter son **Key ID** ; le **Team ID** est en haut à droite
   du compte (Membership details).
3. Mettre les trois valeurs dans les variables de l'hébergeur de l'API (ou `apps/api/.env` en local). Rien à changer
   dans Supabase ni dans l'app.
4. La clé n'expire pas ; si elle est révoquée dans la console, en créer une autre et remplacer les variables (les jetons
   déjà gardés restent utilisables : ils sont liés à l'app, pas à la clé).

### Ce qui n'a pas pu être vérifié sans compte Apple
- Les appels réels à `appleid.apple.com` (échange du code, révocation) : seule la forme des requêtes (formulaire,
  JWT ES256, champs) suit la documentation d'Apple ; aucun échange n'a été fait avec une vraie clé ni un vrai code.
- Que `credential.authorizationCode` soit bien renvoyé par `expo-apple-authentication` sur un iPhone réel pour une
  connexion répétée (Apple le renvoie à chaque autorisation d'après sa documentation ; à vérifier sur TestFlight).
- Les comptes Apple créés **avant** cette version n'ont pas de jeton gardé : ils seront couverts à leur prochaine
  connexion avec Apple. D'ici là, leur suppression ne révoque rien (TN3194 : la suppression reste faite, la personne
  peut retirer l'accès dans Réglages › Identifiant Apple).

## Tester
- En local : `EXPO_PUBLIC_AUTH=local` ; boutons simulés. Banc d'essai : `globalThis.__BLOWY_AUTH_SIM__ = 'cancel' | 'fail'`
  dans la console simule une annulation ou un échec.
- Sur un iPhone (build de développement ou TestFlight) : la feuille Apple, l'annulation, l'adresse masquée.
- Sur Android : l'onglet Google, l'annulation (bouton retour), le retour dans l'app.
