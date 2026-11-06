/**
 * E2E back-office V5 (§10.1) : rôle `ops` (attribué par la CLI), sections quartiers / lieux / sorties,
 * prénoms seulement dans l'effectif, annulation soumise au step-up (le code n'est pas saisi : aucune
 * sortie du seed n'est annulée), refus des sections hors rôle.
 */
import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

const DB = process.env.E2E_DATABASE_URL ?? 'postgresql://blowy:blowy@localhost:5432/blowy_verify';
const API = process.env.E2E_API_URL ?? 'http://localhost:3998';
const sh = (cmd: string) => execFileSync('sh', ['-c', cmd], { env: { ...process.env, DATABASE_URL: DB, BLOWY_ENV: 'local' }, encoding: 'utf8' });

function codeFor(key: string): string {
  const m = /code=(\d{6})/.exec(sh(`pnpm --silent --filter @blowy/api staff:totp -- ${key} 2>&1`));
  if (!m) throw new Error('code TOTP introuvable');
  return m[1]!;
}

async function login(page: Page, key: string) {
  await page.goto('/login');
  await page.getByLabel('Identifiant ou jeton d’identité').fill(key);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Code MFA' })).toBeVisible();
  await page.waitForTimeout(31_000 - (Date.now() % 30_000));
  await page.getByLabel('Code à 6 chiffres').fill(codeFor(key));
  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();
}

test('ops : quartiers, lieux, sorties (prénoms seulement), annulation sous step-up, utilisateurs refusés', async ({ page }) => {
  test.setTimeout(150_000);
  await fetch(`${API}/v1/auth/sessions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'local', credential: 'staff.ops', device: { platform: 'web', label: 'e2e' } }) });
  sh('pnpm --silent --filter @blowy/api staff:roles -- grant --provider local --subject staff.ops --role ops --operator e2e --reason "e2e rôle ops" 2>&1');
  await login(page, 'staff.ops');
  await expect(page.getByRole('link', { name: 'Utilisateurs' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Besoin d’aide' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Villes et quartiers' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Villes et quartiers' })).toBeVisible();
  await expect(page.getByText('Paris · Paris 11e')).toBeVisible();

  await page.getByRole('link', { name: 'Lieux', exact: true }).click();
  await page.getByRole('link', { name: 'Café des Oiseaux' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Planning du lieu' })).toBeVisible();

  await page.getByRole('link', { name: 'Sorties', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sorties' })).toBeVisible();
  await page.locator('table a').first().click();
  await expect(page.getByRole('heading', { level: 2, name: 'Effectif' })).toBeVisible();
  const html = await page.content();
  for (const k of ['refundState', 'funding', 'lookingFor', 'friendsOnly', 'birthDate']) expect(html).not.toContain(k);

  const cancel = page.locator('form').filter({ has: page.getByRole('button', { name: 'Annuler la sortie' }) });
  if (await cancel.count()) {
    page.once('dialog', (d) => d.accept());
    await cancel.getByLabel('Motif (obligatoire, audité)').fill('e2e : vérification du step-up');
    await cancel.getByRole('button', { name: 'Annuler la sortie' }).click();
    await expect(cancel.getByText('Action sensible : réauthentification MFA requise.')).toBeVisible();
    await expect(cancel.getByLabel('Code MFA (réauthentification)')).toBeVisible();
  }

  await page.goto('/users');
  await expect(page.getByText('Accès refusé pour ton rôle')).toBeVisible();
});
