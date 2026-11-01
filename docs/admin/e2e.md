# E2E admin (Playwright)
Prérequis : API (port 3998) et `ADMIN_API_URL=http://localhost:3998 pnpm --filter @blowy/admin start` ; base seedée avec `staff.admin` et `staff.analyst`.
`cd apps/admin && E2E_DATABASE_URL=<url de la base de l'API> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test`.
Le code TOTP est lu via la CLI de dev `staff:totp` (local/test uniquement) ; chaque connexion attend un nouveau pas de 30 s (anti-rejeu), d'où ~30 s par test.
Specs : `e2e/admin.spec.ts` (MFA → tableau de bord réel → tuning → modération ; analyst sans accès « Utilisateurs »).
