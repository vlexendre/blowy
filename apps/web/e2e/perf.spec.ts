/**
 * Mesure de performance (protocole docs/web/performance.md) : Chromium, profil Pixel 7,
 * réseau bridé via CDP (RTT 150 ms, 1,6 Mbit/s descendant, 750 kbit/s montant ≈ « Slow 4G »
 * de Lighthouse), CPU ×4, cache vide. LCP via PerformanceObserver ; JS transféré via Resource Timing.
 * Le résultat est imprimé (et écrit si PERF_OUT est défini) ; il n'est PAS présenté comme garanti.
 */
import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const SLUG = process.env.E2E_SLUG ?? 'demo-alex';

test('LCP de la page « 3 mots » sous profil réseau bridé', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const runs: { lcpMs: number; jsKb: number; totalKb: number }[] = [];
  for (let i = 0; i < 3; i++) {
    await cdp.send('Network.clearBrowserCache');
    await page.goto(`/${SLUG}`, { waitUntil: 'load' });
    const m = await page.evaluate(
      () =>
        new Promise<{ lcpMs: number; jsKb: number; totalKb: number }>((resolve) => {
          let lcp = 0;
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) lcp = e.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => {
            const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const js = res.filter((r) => r.initiatorType === 'script' || r.name.endsWith('.js')).reduce((a, r) => a + r.transferSize, 0);
            const total = res.reduce((a, r) => a + r.transferSize, 0) + (nav?.transferSize ?? 0);
            resolve({ lcpMs: Math.round(lcp), jsKb: Math.round(js / 1024), totalKb: Math.round(total / 1024) });
          }, 1500);
        }),
    );
    runs.push(m);
  }
  const sorted = [...runs].sort((a, b) => a.lcpMs - b.lcpMs);
  const median = sorted[1]!;
  const report = { profile: 'Pixel 7 · RTT 150 ms · 1,6 Mbit/s · CPU ×4 · cache vide', runs, median };
  console.warn(`PERF ${JSON.stringify(report)}`);
  if (process.env.PERF_OUT) writeFileSync(process.env.PERF_OUT, JSON.stringify(report, null, 2));
  expect(median.lcpMs).toBeGreaterThan(0);
});
