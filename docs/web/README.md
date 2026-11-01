# Web public (apps/web) — blowy.app

`pnpm --filter @blowy/web dev` → http://localhost:3002 (`WEB_API_URL`, défaut http://localhost:3000). Page de démo : `/demo-alex` (seed).

## Routes
| Route | Rôle |
|---|---|
| `/` | accueil + liens stores |
| `/<slug>` | « Décris-moi en 3 mots » (server-rendered, formulaire HTML + server action : fonctionne sans JS) |
| `/<slug>/envoye` | confirmation (mots relus depuis un cookie HttpOnly de 5 min, pas d'URL) |
| `/invite/<token>` | invitation : jeton signé OU code court ; « Ouvrir dans l'app », stores, code de repli |
| `/support`, `/confidentialite`, `/conditions` | textes de préparation **à valider juridiquement** |
| `/.well-known/apple-app-site-association`, `/apple-app-site-association`, `/.well-known/assetlinks.json` | associations Universal Links / App Links (`APPLE_TEAM_ID`, `IOS_BUNDLE_IDS`, `ANDROID_PACKAGE`, `ANDROID_SHA256_FINGERPRINTS` ; 404 en production si absents) |
| `/robots.txt` | pages personnelles non indexées |
Segments réservés : `RESERVED_PUBLIC_SLUGS` (`@blowy/api-contract/public`) — routes statiques prioritaires et slug réservé refusé (404).

## « Décris-moi en 3 mots » (§15, P-5.18)
- API publique : `GET /v1/public/profiles/:slug` (prénom + pet public, 12 mots validés, jeton de formulaire signé 30 min), `POST /v1/public/profiles/:slug/responses {words, formToken, visitorToken}`.
- 1–3 mots distincts parmi les 12 (Zod + domaine), aucun texte libre (champ inconnu ignoré), ordre canonique.
- Anti-rejeu : nonce du jeton consommé une seule fois ; une réponse par visiteur et par cible (`UNIQUE(target, HMAC(visiteur, cible))`) ; rechargement → « Déjà envoyé ».
- Quotas (paramètres initiaux, P-5.20) : 50/cible/jour, 10/visiteur/jour, 30 jetons/visiteur/h ; throttling IP 60 lectures et 30 envois/min (compteur Redis éphémère, IP jamais stockée).
- Identifiant visiteur : cookie aléatoire HttpOnly 30 j (`blowy_v`) posé par le proxy ; l'API ne garde qu'un HMAC par cible.
- Réputation non farmable : agrégat recalculé depuis les réponses visibles (1 visiteur = 1 répondant).
- Propriétaire (mobile) : `GET /v1/me/anonymous-responses`, `PUT /v1/me/public-page {enabled}`, `POST …/:id/hide`, `POST …/:id/report` (émet `social.anonymous_response_reported` → dossier de modération par E), `GET …/:id/hints` → toujours « aucun indice » (aucune donnée consentie n'est collectée sur le répondant).
- Challenge anti-bot : non implémenté (aucun fournisseur choisi) ; les quotas ci-dessus sont la protection actuelle.

## Parrainage (§5.9, P-5.9)
`POST /v1/referrals/link` (lien signé HMAC + TTL 30 j + code court), `GET /v1/public/invites/:ref`, `POST /v1/referrals/claim {ref}` (compte authentifié), `GET /v1/referrals/me`.
Claim refusé : auto-parrainage, second claim, compte déjà onboardé avant le lien, lien expiré/révoqué/falsifié. Activation admissible = compte actif 18+, pet principal, vérification `VERIFIED` (PROVIDER/STAFF ; LOCAL_DEMO admis hors production seulement), première action valide (soin/jeu, contribution ou message publié). Alors `referral.activated` (outbox) → consommateur economy `economy.referral_reward` : +100 `REFERRAL_REFERRER` / +100 `REFERRAL_REFEREE` (tuning `coins.referral`), clés ledger `referral:<claimId>:<side>` uniques → un seul crédit même rejoué ; puis `economy.referral_rewarded`. Réévaluation sur `pet.created|pet.updated|user.verification_changed|user.onboarded` + job `social.referral_activation` (15 min). Rien n'est versé au clic, à l'installation ni au claim.
Conservation du référent après installation : pas de deferred deep link (aucun fournisseur retenu) ; repli explicite = code court à saisir dans l'app.

## Sécurité / perf
CSP à nonce par requête (proxy.ts), `script-src 'self' 'nonce-…' 'strict-dynamic'`, `frame-ancestors 'none'`, aucun script tiers ni traceur, polices système, sprites webp ~15 Ko servis avec cache public. Mesure : `docs/web/performance.md`.
