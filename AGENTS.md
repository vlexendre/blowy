# AGENTS.md — règles pour tout agent travaillant sur Blowy

Lis d'abord `docs/architecture.md`, `docs/decisions.md` et ta mission dans `docs/agents/work-plan.md`.

## Ownership (un seul écrivain à la fois)
| Ressource | Propriétaire |
|---|---|
| `package.json` racine, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.github/`, `tooling/` | Orchestrateur (A) |
| `packages/database/prisma/**` (schéma + migrations) | Backend (C) — les autres livrent une proposition dans leur handoff |
| `packages/domain/**`, `packages/api-contract/src/core/**` | Orchestrateur (A) |
| `packages/api-contract/src/<module>.ts` | Agent nommé dans work-plan.md |
| `packages/pet-engine`, `matching`, `tuning`, `content` | Domaine/jeu (B) |
| `apps/api/src/modules/<m>` | Agent nommé par module |
| `apps/mobile`, `packages/ui-mobile`, `packages/sprites` | Mobile (D) |

V5 : l'ownership détaillé par tranche (T0–T9) est dans `docs/product/spec-v5.md` §11.1 et complète ce tableau. Nouveau rôle staff `ops` (quartiers, lieux, sorties, absences, litiges).

## Interdits
- `pnpm install` / ajout de dépendance : seulement par le propriétaire du lockfile. Les autres demandent l'ajout dans leur handoff (ou l'orchestrateur leur délègue explicitement le lockfile pour la durée de la mission).
- `git reset --hard`, `git checkout` concurrent, suppression du travail d'autrui, réécriture d'une migration appliquée.
- Contrat fictif divergent derrière un mock. Un mock implémente l'interface finale.
- Adaptateur factice actif en production (auth, achats, vérification, modération) ; `DEV_AUTH_BYPASS` refusé si `BLOWY_ENV=production`.
- Secrets dans `EXPO_PUBLIC_*`, `NEXT_PUBLIC_*`, logs, fixtures.
- Messages intimes, photos, votes secrets, position exacte dans les logs.

## Conventions
- TypeScript strict, ESM (`"type": "module"`, imports relatifs suffixés `.js`), Zod aux frontières.
- Moteur pur : `now`, `seed`, `engineVersion`, `tuning` passés en paramètres ; pas de `Date.now`/`Math.random`.
- XP en milli-points entiers ; pièces en entiers ; UTC en base, timezone IANA à part.
- Textes UI externalisés (`packages/content/locales/fr.json` ou `apps/*/locales`).
- Tests : Vitest. Exécuter réellement et rapporter les commandes lancées.

## Compte rendu (fichier `docs/agents/handoffs/<agent>.md`)
Fichiers modifiés · tests exécutés (commande + résultat) · décisions · migrations · limites · besoins externes · demandes à d'autres propriétaires.
