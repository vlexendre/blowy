# @blowy/admin

Appli web d'administration (Vite + React, statique). Elle n'est qu'un client de l'API : chaque route `/admin/*`
vérifie elle-même que l'adresse connectée figure dans `ADMIN_EMAILS`. Lecture seule, sauf la modération.

Écrans : vue d'ensemble (comptes, actifs, rétention, Minimoa+, série) · minimoas · liens et rencontres · modération
(signalements, contexte limité au message signalé, avertir / suspendre / supprimer / classer, comptes suspendus) ·
journal · coûts de l'IA.

## Lancer en local (sans base, données de démonstration)

```
cd apps/api && PORT=3464 BLOWY_ENV=local BLOWY_ADAPTERS=memory BLOWY_DEMO=1 CORS_ORIGINS=http://localhost:8464 pnpm dev
VITE_AUTH=local VITE_API_URL=http://localhost:3464 pnpm dev:admin      # http://localhost:8464
```

Connexion : `admin@blowy.local`, code `000000` (en démo, c'est l'adresse autorisée par défaut).
Toute autre adresse montre « Cette adresse n'a pas accès à l'administration ».

## Mettre en ligne : https://admin.minimoa.app (projet Cloudflare Pages à part)

L'administration a son propre projet Cloudflare Pages, branché au même dépôt GitHub que le site, et son propre domaine.
Le site (`apps/web`) n'en sait rien. Réglages du projet (Workers & Pages › Créer › Pages › Connecter à Git) :

| Réglage | Valeur |
|---|---|
| Préréglage du framework | Aucun |
| Commande de build | `pnpm --filter @blowy/admin build` |
| Répertoire de sortie | `apps/admin/dist` |
| Répertoire racine | *(vide : la racine du dépôt, pour que pnpm voie l'espace de travail et `pnpm-lock.yaml`)* |
| Branche de production | `main` |

Cloudflare installe les dépendances tout seul (`pnpm install`, il voit `pnpm-lock.yaml`), comme pour le site.

Variables de build (Production ; toutes **publiques**, elles finissent dans le JavaScript servi) :

| Variable | Valeur |
|---|---|
| `VITE_API_URL` | `https://api.minimoa.app` |
| `VITE_SUPABASE_URL` | `https://sqxebllmatfflopqddaw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_tO2WBMeLyfZTxzMkC8-9xA_M_fG0DQM` (clé publiable, la même que l'app dans `apps/mobile/eas.json`) |
| `NODE_VERSION` | `22` (aussi dans `.nvmrc`) |
| `PNPM_VERSION` | `10.28.0` (celle de `packageManager`) |

Ne pas poser `VITE_AUTH` (défaut `supabase`) ni `VITE_APP_ENV` en production.

**Admin de dev (https://admin-dev.minimoa.app)** : même projet Pages, branche `dev` en prévisualisation, variables de
l'environnement Preview : `VITE_APP_ENV=dev` (bandeau « DEV » et titre « DEV · … »), `VITE_API_URL=https://api-dev.minimoa.app`,
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` du projet Supabase de dev (docs/ENVIRONNEMENTS.md). Jamais la clé service de Supabase ni aucun secret dans une variable
`VITE_*`. Puis Domaines personnalisés › `admin.minimoa.app` (Cloudflare crée l'enregistrement DNS si la zone
`minimoa.app` est chez lui). Conseillé en plus : Cloudflare Access (Zero Trust) devant `admin.minimoa.app`.

Ce que le build ajoute à `dist/` :
- `_headers`, **généré** depuis `_headers.template` par `vite.config.ts` : `X-Robots-Tag: noindex, nofollow, noarchive`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`,
  une CSP stricte (`default-src 'none'` ; scripts, styles et polices de l'admin seulement ; requêtes vers
  `https://api.minimoa.app` et le projet Supabase ; images de l'admin et de Supabase Storage, pour les photos
  signalées), `Cache-Control: no-store` sur la page, cache long sur `/assets/*` (noms à empreinte). Les origines de la
  CSP viennent de `VITE_API_URL` et `VITE_SUPABASE_URL` : la même source sert la production et le dev. Sur Cloudflare
  Pages (`CF_PAGES=1`), le build échoue si l'une manque ou n'est pas en https ;
- depuis `public/` (copié tel quel) :
  - `_redirects` : `/* /index.html 200` (la navigation est en `#/…`, mais toute adresse profonde rouvre l'admin) ;
  - `robots.txt` : `Disallow: /` ; et `<meta name="robots" content="noindex,nofollow">` dans `index.html` ;
  - les polices (Allo et Anton, licences OFL à côté), servies par l'admin elle-même : aucune origine tierce.

Côté API (Railway) : `CORS_ORIGINS` doit contenir `https://admin.minimoa.app` (en plus du site),
`ADMIN_URL=https://admin.minimoa.app` (liens des alertes de modération), `ADMIN_EMAILS` liste l'équipe.

Côté Supabase : la connexion est un code à 6 chiffres saisi dans la page (`signInWithOtp` puis `verifyOtp`), sans
redirection : **aucune** URL à ajouter dans Authentication › URL Configuration. Il faut en revanche le fournisseur
**Email** activé (il l'est déjà pour le compte de revue), le modèle « Magic Link » avec le code `{{ .Token }}`
(`supabase/templates/code.html`, docs/TESTFLIGHT.md §0) et, de préférence, un SMTP (Resend) : sans lui Supabase
n'envoie que quelques e-mails par heure.

Construire en local comme Cloudflare : `VITE_API_URL=… VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… pnpm build:admin`
(→ `apps/admin/dist`).

## Donner l'accès à quelqu'un

1. Supabase → Authentication → Users → « Add user » (ou « Invite ») avec son adresse : l'admin ne crée pas de compte.
2. Ajouter l'adresse à `ADMIN_EMAILS` dans l'environnement de l'API (séparées par des virgules), puis redémarrer l'API.
3. La personne se connecte avec le code reçu par e-mail.

Retirer l'accès : enlever l'adresse de `ADMIN_EMAILS` et redémarrer l'API (l'effet est immédiat sur chaque requête).

## Chiffres

Les tableaux de bord lisent la table `admin_daily_stats`, remplie chaque nuit par la tâche `admin-stats` du minuteur
(`POST /internal/tick`) : ils affichent la veille et la comparent à la période précédente. Avant le premier passage,
les écrans disent « Pas encore de chiffres ».
