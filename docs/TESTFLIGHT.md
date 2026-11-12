# Envoyer Blowy sur TestFlight

Il faut : un compte Apple Developer (99 $/an), un compte Expo (gratuit), et l'API en ligne.
Compter 30 à 45 minutes la première fois, dont 15 à 20 de build chez Expo.

## 0. Avant le build

1. **Mettre l'API en ligne** (voir `apps/api/README.md`) avec `BLOWY_ENV=production`, `BLOWY_ADAPTERS=supabase`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `WEB_URL`, `CORS_ORIGINS=https://blowy.app`.
   Vérifier : `curl https://<ton-api>/health` répond `{"ok":true}`.
2. **Indiquer son adresse à l'app** : dans `apps/mobile/eas.json`, remplacer `https://api.blowy.app` par l'URL réelle
   (profils `preview` et `production`).
3. **Codes de connexion** : dans Supabase → Authentication → Emails, coller `supabase/templates/code.html`
   (le code à 6 chiffres, `{{ .Token }}`) dans les modèles « Confirm signup » **et** « Magic Link » : le premier part
   à la création du compte, le second aux connexions suivantes. Sans SMTP personnalisé, Supabase limite l'envoi à quelques e-mails par heure :
   suffisant pour un premier test, pas pour des testeurs. Brancher Resend en SMTP règle ça (`supabase/README.md`).

## 1. Relier le projet à Expo (une seule fois)

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas init            # crée le projet « blowy » chez Expo et affiche son identifiant
```

Coller l'identifiant affiché dans `apps/mobile/app.config.ts` (constante `EAS_PROJECT_ID`), et ton nom de compte
Expo dans `EXPO_OWNER` si le projet appartient à une organisation.

## 2. Construire et envoyer

```bash
cd apps/mobile
eas build --platform ios --profile production --auto-submit
```

- EAS demande de se connecter au compte Apple, puis crée seul l'identifiant d'app `app.blowy`, le certificat et le
  profil de distribution. Répondre oui aux propositions.
- Au premier envoi, EAS propose de créer la fiche de l'app dans App Store Connect : accepter.
- `--auto-submit` envoie le build à App Store Connect dès qu'il est prêt. Sans cette option :
  `eas submit --platform ios --latest`.

Si l'identifiant `app.blowy` est déjà pris sur un autre compte Apple : lancer avec
`BLOWY_BUNDLE_ID=fr.tonnom.blowy eas build …` (et garder la même valeur ensuite).

## 3. Dans App Store Connect

1. Onglet **TestFlight** : le build apparaît après 5 à 15 minutes de traitement par Apple.
2. La question sur le chiffrement est déjà réglée (`ITSAppUsesNonExemptEncryption = false`).
3. **Testeurs internes** (jusqu'à 100 membres de l'équipe) : disponibles tout de suite, sans validation.
4. **Testeurs externes** : Apple relit le build (souvent moins de 24 h). Prévoir un compte de démonstration et
   l'adresse de la politique de confidentialité (`https://blowy.app/confidentialite`).

## Versions suivantes

Le numéro de build augmente tout seul (`autoIncrement`). Pour une nouvelle version, changer `version` dans
`app.config.ts`, puis relancer la commande de l'étape 2.

## Ce qui n'est pas dans cette version

- Achats Blowy+ : l'écran présente l'offre mais ne vend rien (il faudra RevenueCat ou StoreKit et des produits
  créés dans App Store Connect).
- Notifications push.
- Connexion avec Apple : la connexion se fait par code reçu par e-mail.
- Liens universels `https://blowy.app/i/…` : remplacer `TEAMID` dans
  `apps/web/public/.well-known/apple-app-site-association` par l'identifiant d'équipe Apple.
