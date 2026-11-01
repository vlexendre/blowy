# Performance du web public — protocole et résultat

## Protocole (reproductible)
1. `pnpm --filter @blowy/web build` puis `WEB_API_URL=<api> pnpm --filter @blowy/web start` (build de production, port 3002) ; API locale démarrée sur une base seedée.
2. `cd apps/web && PLAYWRIGHT_BROWSERS_PATH=<navigateurs> npx playwright test e2e/perf.spec.ts` (optionnel `PERF_OUT=perf.json`).
3. Profil : Chromium (Playwright 1.64, Chrome 156), émulation Pixel 7, réseau bridé par CDP (RTT 150 ms, 1,6 Mbit/s descendant, 750 kbit/s montant ≈ « Slow 4G » Lighthouse), CPU ×4, cache vidé avant chacune des 3 navigations ; LCP = dernière entrée `largest-contentful-paint` ; poids via Resource Timing. Résultat = médiane des 3.

## Résultat mesuré (2026-11-01, hôte cloud Linux 2 vCPU, serveur et navigateur sur la même machine)
| Exécution | LCP | JS transféré | Total transféré |
|---|---|---|---|
| 1 | 524 ms | 134 Ko | 157 Ko |
| 2 | 400 ms | 134 Ko | 157 Ko |
| 3 | 388 ms | 134 Ko | 157 Ko |
| **Médiane** | **400 ms** | 134 Ko | 157 Ko |

Limites : mesure en boucle locale (pas de latence réseau réelle au-delà du bridage CDP, pas de TLS, pas de CDN) ; le JS est essentiellement le runtime React/Next (le seul composant client est le sélecteur de mots). **Non mesuré** : navigateur intégré Instagram/TikTok/Snap sur appareil réel, Lighthouse complet, conditions réseau mobiles réelles. La cible « LCP < 1 s » n'est donc atteinte que dans ce profil documenté.
