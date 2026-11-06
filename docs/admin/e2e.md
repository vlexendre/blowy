# E2E admin (Playwright)
Prérequis : API (port 3998) et `ADMIN_API_URL=http://localhost:3998 pnpm --filter @blowy/admin start` ; base seedée avec `staff.admin` et `staff.analyst`.
`cd apps/admin && E2E_DATABASE_URL=<url de la base de l'API> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test`.
Le code TOTP est lu via la CLI de dev `staff:totp` (local/test uniquement) ; chaque connexion attend un nouveau pas de 30 s (anti-rejeu), d'où ~30 s par test.
Specs : `e2e/admin.spec.ts` (MFA → tableau de bord réel → tuning → modération ; analyst sans accès « Utilisateurs »).

## V5 (T6)
- `e2e/admin-v5.spec.ts` : compte `staff.ops` (créé + rôle `ops` par la CLI), quartiers, lieux, sortie (prénoms seulement, aucun montant), annulation qui exige le step-up (code non saisi : rien n'est annulé), `/users` refusé.
- `e2e/lieu.spec.ts` : accès lieu par la CLI `venue:partners`, « Je viens » d'Alex et Tom (API mobile), **fixture SQL** de la confirmation de la veille 18 h (`lockAt` passé, statut `CONFIRMED`, ce que fait le job) et des activités du lieu de démo (brunch, bloc : créneaux samedi/dimanche de la maquette) ; connexion lieu + MFA (`venue:partners -- totp`), réglages faits par l'interface, PDF du contrat, puis captures 1280 × 800 comparées par pixelmatch (dépendance de `tooling/qa`) à `design/v5/renders/L-*.png`, zones dynamiques masquées (dates, code du chevalet, date de signature). Seuil : < 3 %. Rapports : `apps/admin/test-results/lieu-visual/{L-*.json,*.diff.png,summary.json}`.
- Les rendus de référence viennent de Chromium 1243 (Playwright 1.63) : la capture utilise ce binaire s'il existe (`E2E_VISUAL_CHROMIUM`, défaut `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`), sinon le Chromium de Playwright (écart mesuré alors 1,1–2,8 %, identique au re-rendu de la maquette elle-même).
- Lancer : base seedée neuve (`prisma migrate deploy` + seed), API sur 3998, `ADMIN_API_URL=http://localhost:3998 pnpm --filter @blowy/admin start`, puis `cd apps/admin && E2E_DATABASE_URL=… E2E_API_URL=http://localhost:3998 PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test`.
