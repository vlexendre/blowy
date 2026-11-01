/**
 * E2E admin : connexion staff locale + MFA TOTP, dashboard réel, refus par rôle.
 * Le code TOTP est obtenu par la CLI de dev (`staff:totp`, refusée hors local/test) sur la base
 * utilisée par l'API (E2E_DATABASE_URL).
 */
import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

const DB = process.env.E2E_DATABASE_URL ?? 'postgresql://blowy:blowy@localhost:5432/blowy_verify';

/** La CLI imprime sur stderr (console.warn) : on capture stderr. */
function codeFor(key: string): string {
  const res = execFileSync('sh', ['-c', `pnpm --silent --filter @blowy/api staff:totp -- ${key} 2>&1`], { env: { ...process.env, DATABASE_URL: DB, BLOWY_ENV: 'local' }, encoding: 'utf8' });
  const m = /code=(\d{6})/.exec(res);
  if (!m) throw new Error(`code TOTP introuvable : ${res}`);
  return m[1]!;
}

async function login(page: Page, key: string) {
  await page.goto('/login');
  await page.getByLabel('Identifiant ou jeton d’identité').fill(key);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Code MFA' })).toBeVisible();
  // Attendre un nouveau pas TOTP si un code vient d'être consommé (anti-rejeu).
  await page.waitForTimeout(31_000 - (Date.now() % 30_000));
  await page.getByLabel('Code à 6 chiffres').fill(codeFor(key));
  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();
}

test('admin : MFA puis tableau de bord avec métriques et dénominateurs', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, 'staff.admin');
  await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();
  await expect(page.locator('[data-metric="signups"]')).toBeVisible();
  await page.getByRole('link', { name: 'Tuning' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tuning' })).toBeVisible();
  await page.getByRole('link', { name: 'Modération' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Modération' })).toBeVisible();
});

test('analyst : section utilisateurs refusée (rôle interdit)', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, 'staff.analyst');
  await expect(page.getByRole('link', { name: 'Utilisateurs' })).toHaveCount(0);
  await page.goto('/users');
  await expect(page.getByText('Accès refusé pour ton rôle')).toBeVisible();
});
