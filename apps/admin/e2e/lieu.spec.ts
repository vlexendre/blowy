/**
 * E2E espace lieu partenaire (spec-v5 §10.2) + comparaison VISUELLE aux maquettes :
 *  - accès accordé par la CLI (`venue:partners`), connexion distincte (MFA, cookie `blowy_venue`) ;
 *  - Alex et Tom disent « Je viens » (API mobile) ; la confirmation de la veille 18 h est simulée
 *    en base (fixture : `lockAt` passé, statut CONFIRMED — ce que fait le job `outings.lifecycle`) ;
 *  - réglages faits PAR L'INTERFACE (plafond, jours, mentions, signature du contrat) ;
 *  - captures 1280 × 800 comparées par pixelmatch aux rendus de référence `design/v5/renders/L-*.png`,
 *    zones dynamiques (dates, code du chevalet, date de signature) masquées des deux côtés.
 * Fixture d'affichage : les activités du lieu de démonstration incluent brunch et bloc (créneaux
 * samedi/dimanche de la maquette) — mise à jour SQL documentée dans docs/admin/e2e.md.
 * Les rendus de référence ont été produits par Chromium 1243 (Playwright 1.63) : la capture utilise
 * le même binaire si présent (`E2E_VISUAL_CHROMIUM`), sinon le Chromium de Playwright.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect, test, type Page } from '@playwright/test';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DB = process.env.E2E_DATABASE_URL ?? 'postgresql://blowy:blowy@localhost:5432/blowy_verify';
const API = process.env.E2E_API_URL ?? 'http://localhost:3998';
const PARTNER = 'lieu.cafe-des-oiseaux';
const VISUAL_CHROMIUM = process.env.E2E_VISUAL_CHROMIUM ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const OUT = path.join(ROOT, 'apps/admin/test-results/lieu-visual');
/** Seuil demandé : < 3 % de pixels différents hors zones dynamiques. */
const MAX_DIFF_PCT = 3;

// pixelmatch + pngjs : dépendances du banc QA visuel (tooling/qa), réutilisées sans nouvelle dépendance.
const qaRequire = createRequire(path.join(ROOT, 'tooling/qa/package.json'));
interface Png { width: number; height: number; data: Uint8Array }
const { PNG } = qaRequire('pngjs') as { PNG: { new (o: { width: number; height: number }): Png; sync: { read(b: Buffer): Png; write(p: Png): Buffer } } };

const sh = (cmd: string) => execFileSync('sh', ['-c', cmd], { env: { ...process.env, DATABASE_URL: DB, BLOWY_ENV: 'local' }, encoding: 'utf8', cwd: ROOT });
const sql = (q: string) => execFileSync('psql', [DB, '-At', '-c', q], { encoding: 'utf8' }).trim();

async function mobile(key: string) {
  const r = await fetch(`${API}/v1/auth/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() }, body: JSON.stringify({ provider: 'local', credential: key, device: { platform: 'web', label: 'e2e' } }) });
  const b = (await r.json()) as { accessToken: string };
  return (method: string, p: string, body?: unknown) =>
    fetch(`${API}${p}`, { method, headers: { authorization: `Bearer ${b.accessToken}`, 'content-type': 'application/json', ...(method !== 'GET' ? { 'idempotency-key': crypto.randomUUID() } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
}

function totp(): string {
  const out = sh(`pnpm --silent --filter @blowy/api venue:partners -- totp --subject ${PARTNER} 2>&1`);
  const m = /code=(\d{6})/.exec(out);
  if (!m) throw new Error(`code TOTP introuvable : ${out}`);
  return m[1]!;
}

async function pixelDiff(name: string, actual: Buffer, zones: { x: number; y: number; width: number; height: number }[]) {
  const pixelmatch = (await import(qaRequire.resolve('pixelmatch'))).default as (a: Uint8Array, b: Uint8Array, o: Uint8Array, w: number, h: number, opt: object) => number;
  const ref = PNG.sync.read(readFileSync(path.join(ROOT, `design/v5/renders/${name}.png`)));
  const act = PNG.sync.read(actual);
  expect([act.width, act.height]).toEqual([ref.width, ref.height]);
  let masked = 0;
  for (const z of zones) {
    const x0 = Math.max(0, Math.floor(z.x) - 2), y0 = Math.max(0, Math.floor(z.y) - 2);
    const x1 = Math.min(ref.width, Math.ceil(z.x + z.width) + 2), y1 = Math.min(ref.height, Math.ceil(z.y + z.height) + 2);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const k = (y * ref.width + x) * 4;
      for (const img of [ref, act]) { img.data[k] = 255; img.data[k + 1] = 0; img.data[k + 2] = 255; img.data[k + 3] = 255; }
    }
    masked += (x1 - x0) * (y1 - y0);
  }
  const diff = new PNG({ width: ref.width, height: ref.height });
  const n = pixelmatch(ref.data, act.data, diff.data, ref.width, ref.height, { threshold: 0.1 });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, `${name}.actual.png`), actual);
  writeFileSync(path.join(OUT, `${name}.diff.png`), PNG.sync.write(diff));
  const pct = (100 * n) / (ref.width * ref.height - masked);
  const report = { screen: name, diffPixels: n, maskedPixels: masked, pctOutsideDynamicZones: Number(pct.toFixed(3)) };
  writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(report, null, 2));
  console.log(`[visuel] ${JSON.stringify(report)}`);
  return pct;
}

async function boxes(page: Page, selectors: string[]) {
  const out: { x: number; y: number; width: number; height: number }[] = [];
  for (const s of selectors) for (const l of await page.locator(s).all()) {
    const b = await l.boundingBox();
    if (b) out.push(b);
  }
  return out;
}

test.describe.configure({ mode: 'serial' });

test('lieu : accès, effectif en prénoms seulement, réglages par l’interface, puis comparaison aux maquettes', async ({ page, context }) => {
  test.setTimeout(240_000);
  // 1. Compte partenaire (première connexion) + accès accordé (CLI auditée).
  await mobile(PARTNER);
  sh(`pnpm --silent --filter @blowy/api venue:partners -- grant --venue "Café des Oiseaux" --provider local --subject ${PARTNER} --operator e2e --reason "e2e espace lieu" 2>&1`);
  // 2. Alex et Tom disent « Je viens » ; puis confirmation de la veille 18 h (fixture).
  const outingId = sql(`SELECT o.id FROM "Outing" o JOIN "Venue" v ON v.id = o."venueId" WHERE v.name = 'Café des Oiseaux' AND o.status IN ('PROPOSED','FORMING','CONFIRMED') ORDER BY o."startsAt" LIMIT 1`);
  for (const k of ['alex', 'tom']) {
    const m = await mobile(k);
    const r = await m('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'AUTO' });
    expect([200, 409, 412]).toContain(r.status);
  }
  sql(`UPDATE "Outing" SET "acceptDeadline" = LEAST("acceptDeadline", now() - interval '2 minutes'), "lockAt" = now() - interval '1 minute', status = 'CONFIRMED' WHERE id = '${outingId}'`);
  sql(`UPDATE "Venue" SET activities = ARRAY['GAMES','DRINK_COFFEE','BRUNCH','CLIMBING']::"ActivityKind"[] WHERE name = 'Café des Oiseaux'`);

  // 3. Le back-office staff n'ouvre pas l'espace lieu (et inversement) : redirection vers la connexion lieu.
  await page.goto('/lieu/effectif');
  await expect(page).toHaveURL(/\/lieu\/login$/);
  await page.getByLabel('Identifiant ou jeton d’identité').fill(PARTNER);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Code de connexion' })).toBeVisible();
  await page.waitForTimeout(31_000 - (Date.now() % 30_000));
  await page.getByLabel('Code à 6 chiffres').fill(totp());
  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'EFFECTIF DE LA SEMAINE' })).toBeVisible();
  // Prénoms seulement : aucun nom de famille, âge, pet ni identifiant.
  const rows = page.getByRole('group', { name: 'Table Blowy' });
  await expect(rows).toContainText('Alex');
  await expect(rows).toContainText('Sarah');
  const html = await page.content();
  for (const k of ['userId', 'birth', 'species', 'reliability', 'funding']) expect(html).not.toContain(k);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);

  // 4. Réglages par l'interface (plafond, jours, mention), puis signature du contrat.
  await page.goto('/lieu/creneaux');
  if ((await page.locator('.bw-v-cap__value').innerText()) === '1') await page.getByRole('button', { name: 'Une table de plus' }).click();
  await expect(page.locator('.bw-v-cap__value')).toHaveText('2');
  const days: [string, boolean, number, string][] = [['2', true, 1, ''], ['4', true, 2, ''], ['5', false, 1, 'coup de feu, fermé'], ['6', true, 1, ''], ['7', true, 1, '']];
  for (const [wd, open, tables, note] of days) {
    await page.goto('/lieu/reglages');
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Enregistrer le jour' }) });
    await form.locator('#day').selectOption(wd);
    await form.locator('#open').selectOption(String(open));
    await form.locator('#tables').fill(String(tables));
    await form.locator('#dnote').fill(note);
    await form.getByRole('button', { name: 'Enregistrer le jour' }).click();
    await expect(form.getByText('Jour mis à jour.')).toBeVisible();
  }
  await page.goto('/lieu/contrat');
  if (await page.getByLabel('Nom du signataire').count()) {
    await page.getByLabel('Nom du signataire').fill('Nadia');
    await page.getByRole('button', { name: 'Signer le contrat' }).click();
    await expect(page.getByText(/Signé le/)).toBeVisible();
  }
  const pdf = await page.request.get('/lieu/contrat/pdf');
  expect(pdf.headers()['content-type']).toBe('application/pdf');
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');

  // 5. Captures 1280 × 800 (même Chromium que les rendus de référence si disponible).
  const state = await context.storageState();
  const browser = await chromium.launch(existsSync(VISUAL_CHROMIUM) ? { executablePath: VISUAL_CHROMIUM } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce', storageState: state, baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001' });
  const v = await ctx.newPage();
  const results: Record<string, number> = {};
  const shoot = async (name: string, url: string, dynamic: string[]) => {
    await v.goto(url, { waitUntil: 'networkidle' });
    await v.evaluate(() => document.fonts.ready);
    await v.waitForTimeout(300);
    results[name] = await pixelDiff(name, await v.screenshot({ fullPage: false }), await boxes(v, dynamic));
  };
  // Zones dynamiques : date et heures du créneau, date de confirmation, code du chevalet, date de signature.
  await shoot('L-Effectif', '/lieu/effectif', ['.bw-v-summary__main .bw-v-lbl', '.bw-v-summary__main .bw-v-soft', '.bw-v-row--head .bw-v-val']);
  await shoot('L-Creneaux', '/lieu/creneaux', []);
  await shoot('L-Contrat', '/lieu/contrat', ['.bw-v-aside .bw-v-lbl']);
  await browser.close();
  writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ chromium: existsSync(VISUAL_CHROMIUM) ? VISUAL_CHROMIUM : 'playwright', results }, null, 2));
  for (const [name, pct] of Object.entries(results)) expect(pct, `${name} : ${pct.toFixed(3)} % hors zones dynamiques`).toBeLessThan(MAX_DIFF_PCT);
});
