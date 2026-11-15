# Connexion : Apple sur iPhone, Google sur Android

Blowy n'a plus de code par e-mail pour les vrais comptes (spéc. V7 §11). L'app ouvre la session Supabase avec le
fournisseur du téléphone, puis l'API lit le jeton Supabase comme avant (rien ne change côté API).

| Où | Bouton | Comment |
|---|---|---|
| iPhone | « Continuer avec Apple » (bouton officiel d'Apple) | `expo-apple-authentication` → jeton d'identité → `supabase.auth.signInWithIdToken({ provider: 'apple' })` |
| Android, web | « Continuer avec Google » | page de Google dans le navigateur du système (`expo-web-browser`), flux PKCE de Supabase → `exchangeCodeForSession` |
| Mode local (`EXPO_PUBLIC_AUTH=local`) | les deux boutons (simulés) + « Mode dev : e-mail et code » (`000000`) | aucun service externe ; un même fournisseur rouvre le même compte (tester « J'ai déjà un compte ») |

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
- **À faire côté serveur** : pour un compte créé avec Apple, Apple demande de **révoquer les jetons** à la suppression du
  compte (`https://appleid.apple.com/auth/revoke`). Supabase ne le fait pas seul : il faut une clé « Sign in with Apple »
  (Keys → +, Sign in with Apple), son identifiant et l'identifiant d'équipe dans `apps/api/.env`, et un appel dans la
  suppression du compte. Non branché à ce jour (voir le rapport de l'inscription V7).

## Tester
- En local : `EXPO_PUBLIC_AUTH=local` ; boutons simulés. Banc d'essai : `globalThis.__BLOWY_AUTH_SIM__ = 'cancel' | 'fail'`
  dans la console simule une annulation ou un échec.
- Sur un iPhone (build de développement ou TestFlight) : la feuille Apple, l'annulation, l'adresse masquée.
- Sur Android : l'onglet Google, l'annulation (bouton retour), le retour dans l'app.
