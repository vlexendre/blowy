# Handoff — H-parcours (QA parcours multi-utilisateurs) — 2026-11-06

## Résumé
Suite de 7 histoires multi-acteurs de bout en bout (93 étapes) contre l'API réelle (graphe Nest complet, HTTP + Socket.IO /v1/ws, worker en processus, horloge contrôlable), sur base dédiée `blowy_journeys` recréée à chaque exécution. Rapport : `docs/qa/journeys-report.md`. Aucun code produit modifié.
Ajustement V5 (message orchestrateur) : priorité donnée à l'infrastructure réutilisable (`support/`) et aux parcours qui survivent (sécurité, concurrence, économie de base, export/suppression, invitation + « 3 mots ») ; Léa & Hugo (partie Lien/emménagement) et Triangle marqués **V4 — à remplacer** ; section « Ce que l'API offre déjà pour la V5 » dans le rapport.

## Fichiers créés / modifiés
- `apps/api/test/journeys/vitest.config.ts` — config Vitest séparée (séquentielle, globalSetup).
- `apps/api/test/journeys/support/{global-setup,world,actor,observers,story,media,fixtures}.ts`.
- `apps/api/test/journeys/*.journey.ts` (7) : `lea-et-hugo-de-la-rencontre-a-la-rupture`, `ines-proposee-a-deux-hommes-en-meme-temps`, `alex-invite-son-quartier`, `nora-se-protege-de-victor`, `maya-achete-puis-se-fait-rembourser`, `jade-et-ses-deux-telephones`, `lucie-exporte-puis-supprime-son-compte`.
- `apps/api/package.json` : scripts `test:journeys`, `pretest:journeys` ; devDependency `@blowy/api-client: workspace:*` (ajoutée via `flock .local/pnpm.lock pnpm --filter @blowy/api add -D`).
- `docs/qa/journeys-report.md`, ce fichier.
- Sorties générées : `apps/api/test/journeys/.out/*.json` (notes par histoire ; à ignorer en VCS).

## Tests exécutés
- `pnpm --filter @blowy/api test:journeys` ×2 enchaînés (base fraîche chaque fois) : **74 ✅ / 10 ❌ / 9 ⛔** puis **73 ✅ / 11 ❌ / 9 ⛔** (~65 s chacun) ; 3e passage JSON : 73/11/9. Seule différence : Léa 23 (course WS réelle, bug B6).
- `npx tsc -p apps/api/tsconfig.json --noEmit` : 0 erreur dans `test/journeys` ; `npx eslint test/journeys` : 0.
- Les ❌ sont des bugs produit (la suite échoue volontairement) — voir rapport §3.

## Décisions
- In-process plutôt que serveur externe : seul moyen d'injecter l'horloge (`CoreOverrides.clock`) ; même `buildApp`/`attachRealtime`/`buildWorkerGraph` que la prod. Relais RT en mémoire (même `RealtimeRelayEffect`) au lieu de Redis.
- Horloge démarrée à l'heure réelle (B11 : `new Date()` dans accept-proposal etc.).
- Une zone de matching par histoire (isolation sans TRUNCATE).
- Raccourcis base limités et nommés (`support/fixtures.ts`) : niveau forcé (V4), slug public (bug B2).

## Limites
Redis pub/sub multi-processus non couvert ; jobs appelés explicitement (pas BullMQ) ; pas d'admin humain simulé ; remboursement non jouable en LOCAL_DEMO.

## Demandes aux propriétaires
- **G (économie)** : B1 (dépenses concurrentes → 500 après ~20 s), B7 (idempotence local-demo), action REFUND démo ; jobs `run(now)`.
- **C (socle/matching/relations/WS)** : B1bis (couper la socket à la révocation de session), B3 (INVALIDATED annulé par le rollback), B5/B6 (projeter vers `user:<id>` : match, fin de relation), B8 (`CLIENT_MESSAGE_ID_REUSED`), B10, B12, I1 (lecture seule de l'historique après fin).
- **E (confiance)** : B4 (signaler depuis une proposition ; restriction conservatoire MINOR).
- **F (social/web)** : B2 (attribution du slug public), B9 (page désactivée → 404).
- **Orchestrateur** : ignorer `apps/api/test/journeys/.out/` ; brancher `test:journeys` en CI non bloquant tant que les ❌ connus existent.
