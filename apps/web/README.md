# @blowy/web — site minimoa.app

Site statique Astro : la landing, les pages publiques reliées à l'API (« 3 mots » et invitation), les pages légales et l'aide.
Cinq langues (fr, en, es, pt, nl) : voir « Langues » plus bas et `docs/I18N.md`.

## Pages

| URL | Rôle |
|---|---|
| `/`, `/en/`, `/es/`, `/pt/`, `/nl/` | Landing : 15 sections plein écran aimantées (minimoa vivant, garde-robe, caractère, habitudes, groupes, chats, vies, rencontres, sorties, 3 mots, captures de l'app, Minimoa+, questions), animations GSAP |
| `/m/CODE` (ou `/m/?c=CODE`) | « 3 mots » : choisir 3 mots pour quelqu'un (`GET`/`POST /v1/words/:code`) |
| `/i/CODE` (ou `/i/?c=CODE`) | Invitation : ouvrir dans l'app (`minimoa://i/CODE`) ou installer (`GET /v1/invites/:code`) |
| `/g/ID`, `/r/ID`, `/l/ID`, `/plus`, `/defi`, `/habitudes`, `/carte` | « Ouvre Minimoa » : lien de l'app ouvert sans l'app (bouton `minimoa://…` et stores), cinq langues selon le navigateur (docs/DEEPLINKS.md) |
| `/quiz/`, `/quartier/` (et `/<langue>/quiz/`, `/<langue>/quartier/`) | Quiz « Quel minimoa es-tu ? », « Ouvre ton quartier » |
| `/legal/…`, `/<langue>/legal/…` | Pages légales (le français fait foi) ; `/confidentialite`, `/conditions`, `/regles`, `/support` y redirigent |
| `/404` | Page introuvable |
| `/sitemap.xml`, `/robots.txt`, `/.well-known/apple-app-site-association` | Référencement et liens universels iOS |

## Langues

- Pages indexées (landing, quiz, quartier, légal) : une page statique par langue, français à la racine, les autres sous
  `/<langue>/` ; balises `hreflang` (+ `x-default`), canonique, `og:locale:alternate`, `sitemap.xml` avec les
  `xhtml:link`, sélecteur de langue dans la barre et le pied de page, bannière « Available in English » si le navigateur
  préfère une autre langue (jamais de redirection).
- Pages de partage (`/m/`, `/i/`, `/g/`, `/c/`, `/r/`, `/l/`, `/plus`, `/defi`, `/habitudes`, `/carte`, 404, `/quiz/<code>`,
  `/quartier/<zone>`) : une adresse, les cinq langues dans la page, celle du téléphone montrée (`layouts/Public.astro`,
  mode `shell`, `?lang=xx` pour forcer). Leur aperçu de lien reste français (les robots d'aperçu ne lancent pas de script).
- Textes : `src/content/landing-text/<langue>.ts` (landing), `src/content/{site,public,quiz,growth,open}.ts` ;
  `pnpm i18n:check` vérifie les cinq langues.

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
  `favicon-32.png`), puis `scripts/site-images/variants.py` pour les versions réduites (`img/v/`, `srcset`).
  ```sh
  python3 -I apps/web/scripts/site-images/build.py              # Pillow, fontTools, brotli
  python3 -I apps/web/scripts/site-images/build.py --boucle     # seulement le hero et l'aperçu de la landing
  python3 -I apps/web/scripts/site-images/variants.py
  ```
  Hero : la boucle en deux temps, `img/m/hero_soin.webp` (Nino qui mange : tu prends soin de lui) et
  `img/m/hero_rencontre.webp` (Nino et Suzie, le minimoa de Léa : il te présente quelqu'un), textes dans la page.
  Aperçus 1200 × 630 : `og/accueil.jpg` (landing et défaut : la même boucle, titre « Prends soin de ton minimoa. Il te
  présente des potes. »), `og/{i,m,g,r,l,plus,defi,habitudes,carte}.jpg` (pages de partage, en français),
  `og/<langue>/{accueil,quiz,quartier}.jpg` (pages indexées traduites ; seules : `build.py --og-locales`).
- **Tenues de la garde-robe** (`img/m/tenue_*.webp`, 500 × 600) : rendues par l'app elle-même (`DressedPet`, route de
  développement `/dev/look`), puis posées sur une toile commune. App lancée en web
  (`cd apps/mobile && EXPO_PUBLIC_AUTH=local npx expo start --web`), puis :
  ```sh
  node apps/web/scripts/site-images/looks.mjs http://localhost:8081 /tmp/minimoa-looks   # Playwright
  python3 -I apps/web/scripts/site-images/build.py --looks /tmp/minimoa-looks
  python3 -I apps/web/scripts/site-images/variants.py
  ```
  Les tenues (`LOOKS` de `looks.mjs`) vont avec `LOOKS` de `src/content/landing.ts` et `wardrobe.looks` (cinq langues).
- **Captures de l'App Store** (section « L'app, en vrai ») : `node apps/web/scripts/store-images.mjs [dossier]`
  (défaut `/home/claude/work/store/out4/fr/1320x2868`) → `public/img/store/*-{360,720}.webp` + `manifest.json` (textes
  alternatifs tirés du README des captures). Captures anglaises (pages /en/) : `node apps/web/scripts/store-images.mjs
  /home/claude/work/store/out4/en/1320x2868 en` → `public/img/store/en/`. Les autres langues montrent les captures
  françaises ; les textes alternatifs viennent des textes du site (`screens.shots`). Sans `manifest.json`, la section et
  son point de navigation disparaissent.

## Organisation

```
src/
  config/site.ts              constantes : stores, contact, entité légale, URL de l'API
  i18n/site.ts                langues, chemins (`localePath`), hreflang, `siteMessages`
  i18n/client.ts              langue de la page côté navigateur (scripts)
  content/landing.ts          données de la landing (ancres, images, valeurs des démos)
  content/landing-text/       textes de la landing, un fichier par langue (le script d'animation reçoit les siens en JSON)
  content/site.ts             barre, pied de page, stores, sélecteur et bannière de langue
  content/public.ts           textes des pages /m/, /i/ et 404 (cinq langues)
  components/templates/       LandingPage, QuizBody, QuartierBody (une langue en prop)
  layouts/Base.astro          <head>, méta, Open Graph, polices auto-hébergées, variables CSS issues de @blowy/tokens, lien d'évitement
  layouts/Public.astro        gabarit des pages publiques : une langue (pages indexées) ou les cinq (pages de partage)
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
