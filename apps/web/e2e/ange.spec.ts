import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Page ange gardien `/ange/<jeton>` (agent E, T4). Le jeton est créé via l'API locale (compte seedé
 * confirmé sur la sortie de la semaine, `E2E_GUARDIAN_USER`, défaut `lea`) ; sinon `E2E_GUARDIAN_TOKEN`.
 */
const API = process.env.E2E_API_URL ?? 'http://localhost:3998';
const WEB_ORIGIN = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3002').origin;
const OTHERS = ['Alex', 'Tom', 'Malo', 'Sarah', 'Inès', 'Maya'];

async function guardianToken(request: APIRequestContext): Promise<{ token: string; owner: string } | null> {
  if (process.env.E2E_GUARDIAN_TOKEN) return { token: process.env.E2E_GUARDIAN_TOKEN, owner: process.env.E2E_GUARDIAN_OWNER ?? '' };
  const key = process.env.E2E_GUARDIAN_USER ?? 'lea';
  const s = await request.post(`${API}/v1/auth/sessions`, { data: { provider: 'local', credential: key, device: { platform: 'web', label: 'e2e-ange' } } });
  if (!s.ok()) return null;
  const { accessToken } = (await s.json()) as { accessToken: string };
  const auth = { authorization: `Bearer ${accessToken}` };
  const week = await request.get(`${API}/v1/outings/week`, { headers: auth });
  const outingId = week.ok() ? ((await week.json()) as { myOutingId?: string }).myOutingId : undefined;
  if (!outingId) return null;
  const r = await request.post(`${API}/v1/safety/guardian-links`, { headers: { ...auth, 'idempotency-key': crypto.randomUUID() }, data: { subject: { kind: 'OUTING', id: outingId }, label: 'E2E' } });
  if (!r.ok()) return null;
  const me = await request.get(`${API}/v1/me`, { headers: auth });
  const owner = me.ok() ? (((await me.json()) as { profile?: { displayName?: string } }).profile?.displayName ?? '') : '';
  return { token: ((await r.json()) as { url: string }).url.split('/ange/')[1]!, owner };
}

test('jeton inconnu ou mal formé : même page neutre (404), sans cookie, no-store, noindex, no-referrer', async ({ page }) => {
  for (const t of ['A'.repeat(43), 'pas-un-jeton']) {
    const res = await page.goto(`/ange/${t}`);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ce lien n’est plus valable.');
    const h = res!.headers();
    expect(h['cache-control']).toContain('no-store');
    expect(h['x-robots-tag']).toContain('noindex');
    expect(h['referrer-policy']).toBe('no-referrer');
    expect(h['set-cookie']).toBeUndefined();
  }
  await expect(page.getByRole('link', { name: 'Appeler le 17' })).toHaveAttribute('href', 'tel:17');
});

test('page du proche : prénom, rendez-vous, aucun autre participant, CSP stricte, aucun traceur', async ({ page, request }) => {
  const g = await guardianToken(request);
  test.skip(!g, 'API locale seedée indisponible (ou compte sans place confirmée) : définir E2E_GUARDIAN_TOKEN');
  const thirdParty: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('data:') && new URL(r.url()).origin !== WEB_ORIGIN) thirdParty.push(r.url());
  });
  const res = await page.goto(`/ange/${g!.token}`);
  expect(res?.status()).toBe(200);
  const h = res!.headers();
  expect(h['content-security-policy']).toMatch(/script-src 'self' 'nonce-/);
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['cache-control']).toContain('no-store');
  expect(h['set-cookie']).toBeUndefined();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Tu veilles sur/i);
  if (g!.owner) await expect(page.getByRole('heading', { level: 1 })).toContainText(g!.owner);
  await expect(page.getByRole('link', { name: 'Appeler le 17' })).toBeVisible();
  const text = await page.locator('main').innerText();
  for (const n of OTHERS.filter((x) => x !== g!.owner)) expect(text).not.toContain(n);
  expect(text).not.toMatch(/latitude|longitude|position/i);
  const scripts = await page.locator('script[src]').evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src));
  expect(scripts.every((s) => new URL(s).origin === new URL(page.url()).origin)).toBe(true);
  expect(thirdParty).toEqual([]);
  expect(await page.context().cookies()).toEqual([]);
  // Le jeton ne fuit pas dans les liens sortants (meta referrer + en-tête).
  expect(await page.locator('meta[name="referrer"]').getAttribute('content')).toBe('no-referrer');
});
