import { expect, test } from '@playwright/test';

const SLUG = process.env.E2E_SLUG ?? 'demo-alex';

test('page « 3 mots » : 12 mots, au plus 3, envoi sans compte, une seule réponse par visiteur', async ({ page }) => {
  await page.goto(`/${SLUG}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('en 3 mots');
  const boxes = page.getByRole('checkbox');
  await expect(boxes).toHaveCount(12);
  await expect(page.locator('textarea, input[type="text"]')).toHaveCount(0); // aucun texte libre
  await page.getByText('drôle', { exact: true }).click();
  await page.getByText('solaire', { exact: true }).click();
  await page.getByText('fiable', { exact: true }).click();
  await expect(page.getByLabel('loyal·e')).toBeDisabled(); // 4e mot impossible
  await page.getByRole('button', { name: /Envoyer/ }).click();
  await expect(page).toHaveURL(new RegExp(`/${SLUG}/envoye$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Envoyé|Déjà envoyé/);
  // Rechargement + nouvel envoi : la première réponse est conservée.
  await page.goto(`/${SLUG}`);
  await page.getByText('loyal·e', { exact: true }).click();
  await page.getByRole('button', { name: /Envoyer/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Déjà envoyé.');
});

test('routes système réservées et pages légales', async ({ page }) => {
  for (const p of ['/support', '/confidentialite', '/conditions']) {
    await page.goto(p);
    await expect(page.getByRole('note')).toContainText('à valider juridiquement');
  }
  expect((await page.goto('/admin'))?.status()).toBe(404);
  expect((await page.goto('/slug-inexistant-123'))?.status()).toBe(404);
  const aasa = await page.request.get('/.well-known/apple-app-site-association');
  expect(aasa.ok()).toBe(true);
  expect((await aasa.json()).applinks.details[0].components[0]['/']).toBe('/invite/*');
});

test('invitation invalide : aucun indice, aucune récompense promise', async ({ page }) => {
  await page.goto('/invite/i1.ABCDEFGH.1999999999.forged');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Invitation non valable');
});

test('CSP stricte et aucun script tiers', async ({ page }) => {
  const res = await page.goto(`/${SLUG}`);
  const csp = res?.headers()['content-security-policy'] ?? '';
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toMatch(/script-src 'self' 'nonce-/);
  const scripts = await page.locator('script[src]').evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src));
  expect(scripts.every((s) => new URL(s).origin === new URL(page.url()).origin)).toBe(true);
});
