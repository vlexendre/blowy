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

## Construire et déployer (hébergement statique)

```
VITE_API_URL=https://api.blowy.app \
VITE_SUPABASE_URL=https://<projet>.supabase.co \
VITE_SUPABASE_ANON_KEY=<clé publique anon> \
pnpm build:admin          # → apps/admin/dist
```

Servir `apps/admin/dist` tel quel (Cloudflare Pages, Netlify, un bucket statique…) : aucune réécriture d'URL
nécessaire (navigation par `#/…`). Conseillé : un sous-domaine dédié (ex. `admin.blowy.app`) et, si l'hébergeur le
permet, une protection d'accès supplémentaire (Cloudflare Access…). Les variables `VITE_*` sont publiques : n'y mettre
aucun secret (jamais la clé service de Supabase).

Côté API : ajouter l'origine de l'admin à `CORS_ORIGINS` (ex. `https://admin.blowy.app`).

## Donner l'accès à quelqu'un

1. Supabase → Authentication → Users → « Add user » (ou « Invite ») avec son adresse : l'admin ne crée pas de compte.
2. Ajouter l'adresse à `ADMIN_EMAILS` dans l'environnement de l'API (séparées par des virgules), puis redémarrer l'API.
3. La personne se connecte avec le code reçu par e-mail.

Retirer l'accès : enlever l'adresse de `ADMIN_EMAILS` et redémarrer l'API (l'effet est immédiat sur chaque requête).

## Chiffres

Les tableaux de bord lisent la table `admin_daily_stats`, remplie chaque nuit par la tâche `admin-stats` du minuteur
(`POST /internal/tick`) : ils affichent la veille et la comparent à la période précédente. Avant le premier passage,
les écrans disent « Pas encore de chiffres ».
