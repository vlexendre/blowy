# @blowy/web — site minimoa.app

Site statique Astro : la landing, les pages publiques reliées à l'API (« 3 mots » et invitation), les pages légales et l'aide.

## Pages

| URL | Rôle |
|---|---|
| `/` | Landing : 15 sections plein écran aimantées (minimoa vivant, garde-robe, caractère, habitudes, groupes, chats, vies, rencontres, sorties, 3 mots, captures de l'app, Minimoa+, questions), animations GSAP |
| `/m/CODE` (ou `/m/?c=CODE`) | « 3 mots » : choisir 3 mots pour quelqu'un (`GET`/`POST /v1/words/:code`) |
| `/i/CODE` (ou `/i/?c=CODE`) | Invitation : ouvrir dans l'app (`minimoa://i/CODE`) ou installer (`GET /v1/invites/:code`) |
| `/g/ID`, `/r/ID`, `/l/ID`, `/plus`, `/defi`, `/habitudes`, `/carte` | « Ouvre Minimoa » : lien de l'app ouvert sans l'app (bouton `minimoa://…` et stores), cinq langues selon le navigateur (docs/DEEPLINKS.md) |
| `/confidentialite`, `/conditions`, `/regles`, `/support` | Pages de texte |
| `/404` | Page introuvable |
| `/sitemap.xml`, `/robots.txt`, `/.well-known/apple-app-site-association` | Référencement et liens universels iOS |

## Développement

```sh
pnpm install                       # à la racine du monorepo
cp apps/web/.env.example apps/web/.env   # facultatif : PUBLIC_API_URL
pnpm --filter @blowy/web dev       # http://localhost:4321
```

En dev, `/m/CODE` n'est pas réécrit (c'est Cloudflare qui le fait) : utilise `/m/?c=CODE` et `/i/?c=CODE`.
L'API doit autoriser l'origine du site (CORS) pour les routes publiques `invites` et `words`.

## Vérifier et construire

```sh
pnpm --filter @blowy/web typecheck   # astro check
pnpm --filter @blowy/web build       # sortie : apps/web/dist
pnpm --filter @blowy/web preview
```

## Variables d'environnement

| Nom | Défaut | Rôle |
|---|---|---|
| `PUBLIC_API_URL` | `http://localhost:3000` | URL de base de l'API (sans `/v1`). Injectée **au build** dans le code client. |
| `PUBLIC_APP_STORE_URL` | (aucun) | Fiche App Store (`https://apps.apple.com/fr/app/minimoa/id…`). Absente : les boutons disent « Bientôt sur App Store », sans lien. |
| `PUBLIC_PLAY_STORE_URL` | (aucun) | Fiche Google Play. Absente : « Bientôt sur Google Play », sans lien. |
| `APPLE_TEAM_ID` | (aucun) | Identifiant d'équipe Apple (10 caractères) pour `/.well-known/apple-app-site-association`. Absent : le fichier ne déclare aucune app (liens universels désactivés) et le build l'écrit en avertissement. **Obligatoire en production.** |
| `BLOWY_BUNDLE_ID` | `app.blowy` | Identifiant de l'app iOS et Android, le même que `apps/mobile/app.config.ts` (ne change pas avec le nom Minimoa). |
| `ANDROID_SHA256` | (aucun) | Empreintes SHA-256 du certificat de signature Android (`AA:BB:…`, séparées par des virgules) pour `/.well-known/assetlinks.json`. Absent : liste vide (liens d'app Android non vérifiés). |

## Déploiement sur Cloudflare Pages

1. Créer un projet Pages relié au dépôt.
2. Réglages de build :
   - Commande : `pnpm --filter @blowy/web build`
   - Répertoire de sortie : `apps/web/dist`
   - Répertoire racine : la racine du dépôt (pour que pnpm voie l'espace de travail)
   - Variables : `PUBLIC_API_URL=https://api.minimoa.app` (par exemple), `APPLE_TEAM_ID=<identifiant d'équipe>` et `NODE_VERSION=22`
3. Domaines personnalisés : `minimoa.app` et `www.minimoa.app` (la redirection de `www` vers le domaine nu doit
   épargner `/.well-known/*` et `/apple-app-site-association` : Apple ne suit pas les redirections, docs/DEEPLINKS.md).

`public/_redirects` sert `/m/*`, `/i/*`, `/g/*`, `/r/*` et `/l/*` avec la page statique correspondante (statut 200, l'URL reste intacte).
`public/_headers` sert `apple-app-site-association` (aux deux adresses) et `assetlinks.json` en `application/json` et pose des en-têtes de cache et de sécurité.

## À compléter avant la mise en ligne

- `src/config/legal.ts` : `LEGAL.entity` (raison sociale, utilisée par toutes les pages légales).
- `PUBLIC_APP_STORE_URL` (et plus tard `PUBLIC_PLAY_STORE_URL`) dans les variables du build, dès que la fiche est publiée (lues par `src/config/site.ts`).
- `APPLE_TEAM_ID` dans les variables du build : `/.well-known/apple-app-site-association` est généré par `src/pages/.well-known/apple-app-site-association.ts` (`src/config/apple.ts`) ; sans lui, aucune app n'y est déclarée (avertissement au build).

## Images

- **Minimoas, aperçus de liens, icônes, titres des images en Allo** : générés depuis le pack (`packages/ui/assets`) par
  `scripts/site-images/` et versionnés dans `public/` (`img/m/`, `og/`, `apple-touch-icon.png`, `icon-*.png`,
  `favicon-32.png`). Les tenues portées reprennent les placements de l'app (`outfitLayers`).
  ```sh
  pnpm exec tsx apps/web/scripts/site-images/placements.mts > /tmp/minimoa-placements.json
  python3 -I apps/web/scripts/site-images/build.py /tmp/minimoa-placements.json   # Pillow, fontTools, brotli
  ```
  Aperçus 1200 × 630 : `og/accueil.jpg` (landing et défaut), `og/{i,m,g,r,l,plus,defi,habitudes,carte}.jpg` (pages
  de partage, en français).
- **Captures de l'App Store** (section « L'app, en vrai ») : `node apps/web/scripts/store-images.mjs [dossier]`
  (défaut `/home/claude/work/store/out/fr/6.9`) → `public/img/store/*-{360,720}.webp` + `manifest.json` (textes
  alternatifs tirés du README des captures). Sans `manifest.json`, la section et son point de navigation disparaissent.

## Organisation

```
src/
  config/site.ts              constantes : stores, contact, entité légale, URL de l'API
  content/landing.ts          textes de la landing (lus par les organismes et par le script d'animation)
  content/public.ts           textes des pages /m/, /i/ et 404
  layouts/Base.astro          <head>, méta, Open Graph, polices auto-hébergées, variables CSS issues de @blowy/tokens, lien d'évitement
  layouts/Public.astro        gabarit des pages /m/, /i/, 404
  layouts/Prose.astro         gabarit des pages de texte
  components/atoms/           Logo, Button, StoreBadge, Sticker, PetImage, LifeSpark, Chip, Avatar
  components/molecules/       StoreButtons, SectionTitle, ChatBubble, PhoneFrame, FaqItem, SnapSection, StateBlock
  components/organisms/       landing/* (une section = un organisme), public/*, TopBar, SiteFooter
  scripts/landing.ts          animations GSAP (GSAP 3.12.5 chargé depuis cdnjs)
  scripts/words-page.ts       logique de /m/
  scripts/invite-page.ts      logique de /i/
  lib/                        client API, lecture du code dans l'URL, image du pet
  styles/global.css           base + styles partagés (atomes, molécules, nav, fond)
```

Les styles propres à une section sont dans son organisme (`<style is:global>`, pour que les classes ajoutées par
le script d'animation soient stylées). Les images sont dans `public/img/` (copiées depuis `packages/ui/assets/pets`).
