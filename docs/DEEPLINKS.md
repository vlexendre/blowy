# Liens profonds (Minimoa)

Un lien partagé est toujours `https://minimoa.app/…`. App installée : il ouvre l'app (lien universel iOS, lien d'app
Android). Sinon : une page du site. Les schémas `minimoa://…` (actuel) et `blowy://…` (liens déjà envoyés, widgets,
notifications, anciens retours de connexion) ouvrent les mêmes écrans.

## Chemins

| Adresse | Écran de l'app | Sans compte prêt | Page du site sans l'app |
|---|---|---|---|
| `/i/<code>` | `app/i/[code]` : invitation | code gardé, repris par l'inscription | `/i` (qui t'invite, code à taper) |
| `/m/<code>` | `app/m/[code]` : ouvre le vote sur le site dans l'app (`?web=1`) ; son propre lien → Moi | idem | `/m` (vote « 3 mots ») |
| `/g/<id>` | `app/groupe/[id]` (membres seulement) | gardé, ouvert après l'inscription | `/g` « Ouvre Minimoa » |
| `/r/<id>` | `app/rencontre/[userId]` | gardé | `/r` |
| `/l/<id>` | `app/link/[id]` | gardé | `/l` |
| `/plus` | `app/moi/blowy-plus` (feuille Minimoa+) | gardé | `/plus` |
| `/defi` | `app/pet/defi` | gardé | `/defi` |
| `/habitudes` | `app/pet/habitudes` | gardé | `/habitudes` |
| `/carte` | `app/carte` | gardé | `/carte` |

Jamais ouverts dans l'app : `/legal/*`, `/_astro/*`, `/img/*`, `/m/*?web=1`, l'accueil.
Les chemins internes (`minimoa://link/<id>`, `blowy://pet/garde-robe`, `blowy://groupe/<id>`…) passent tels quels.
Pas de code d'invitation de groupe dans l'API : `/g/<id>` ouvre un groupe dont on est membre (sinon « introuvable »).

Où c'est écrit (une liste par endroit, à garder identiques) :
- lecteur unique (notifications + liens) : `apps/mobile/src/features/notifications/url.ts` (+ tests) ;
- arrivée des liens : `apps/mobile/app/+native-intent.ts` ; lien gardé : `features/notifications/deeplink.ts`, ouvert
  par `useNotificationsBridge` quand les onglets sont montés (démarrage à froid, fin de l'inscription) ;
- domaines, schémas, filtres Android : `apps/mobile/app.config.ts` ;
- fichiers du site : `apps/web/src/config/apple.ts` (AASA et `assetlinks.json`), pages `apps/web/src/pages/{g,r,l}`,
  `plus`, `defi`, `habitudes`, `carte`, réécritures `apps/web/public/_redirects`.

## Tester

Simulateur iOS (build de développement installé) :

```sh
xcrun simctl openurl booted "minimoa://g/<id-de-groupe>"
xcrun simctl openurl booted "blowy://defi"
xcrun simctl openurl booted "https://minimoa.app/i/ABCD1234"   # lien universel : AASA en ligne + build signé
```

Android : `adb shell am start -a android.intent.action.VIEW -d "https://minimoa.app/carte"` ; vérification :
`adb shell pm get-app-links app.blowy`.

Fichiers servis (après déploiement) :
- `https://minimoa.app/.well-known/apple-app-site-association` (et `/apple-app-site-association`) : `appIDs` contient
  `<équipe>.app.blowy` ; CDN d'Apple : `https://app-site-association.cdn-apple.com/a/v1/minimoa.app` ;
- `https://www.minimoa.app/.well-known/apple-app-site-association` : doit répondre 200 **sans redirection** ;
- `https://minimoa.app/.well-known/assetlinks.json`.

En local : `APPLE_TEAM_ID=TEST123456 pnpm --filter @blowy/web build`, puis lire `apps/web/dist/.well-known/`.

## À faire par le propriétaire

1. **Cloudflare Pages** (build du site) : `APPLE_TEAM_ID=<10 caractères>` ; plus tard `ANDROID_SHA256=<empreinte>`
   (Play Console › Intégrité de l'app › certificat de signature, plusieurs séparées par des virgules).
2. **www** : `www.minimoa.app` ajouté au projet Pages, ou une redirection vers `minimoa.app` qui épargne
   `/.well-known/*` et `/apple-app-site-association` (Apple ne suit pas les redirections pour ce fichier).
3. **Supabase** › Authentication › URL Configuration › Redirect URLs : ajouter `minimoa://auth-callback` (garder
   `blowy://auth-callback` et `https://minimoa.app/auth-callback`) ; Site URL `https://minimoa.app` (docs/CONNEXION.md).
4. Nouveau build iOS (EAS) : le domaine associé a changé (`applinks:minimoa.app`, `applinks:www.minimoa.app`) ; EAS
   met à jour la capacité « Associated Domains » de l'identifiant `app.blowy`.

À garder : l'identifiant `app.blowy`, les achats `app.blowy.plus.*`, les clés `blowy.*` rangées sur le téléphone
(session, brouillon) et le schéma `blowy` : les changer déconnecterait les gens ou casserait les liens déjà envoyés.
