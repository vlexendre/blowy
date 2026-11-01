# E2E web (Playwright)
Prérequis : API démarrée (ex. `node apps/api/dist/main.js` sur une base seedée, port 3998) et `WEB_API_URL=http://localhost:3998 pnpm --filter @blowy/web start`.
`cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test` (`E2E_BASE_URL`, `E2E_SLUG` optionnels ; navigateur : `npx playwright install chromium`).
Specs : `e2e/describe.spec.ts` (12 mots, ≤ 3, aucun texte libre, une réponse par visiteur, routes réservées, pages légales, AASA, invitation invalide, CSP) ; `e2e/perf.spec.ts` (protocole `performance.md`).
Note : la spec « 3 mots » écrit une vraie réponse dans la base visée.
