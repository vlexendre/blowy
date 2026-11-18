#!/usr/bin/env node
/**
 * Tenues de la garde-robe du site, rendues par l'app elle-même (`DressedPet`, route de développement /dev/look) :
 * une capture PNG transparente par tenue, à poser ensuite sur la toile commune avec
 * `python3 -I apps/web/scripts/site-images/build.py --looks <dossier>` (→ public/img/m/tenue_<nom>.webp, 500 × 600),
 * puis `python3 -I apps/web/scripts/site-images/variants.py` (versions 240 et 320).
 *
 * Usage : lancer l'app en web (`cd apps/mobile && EXPO_PUBLIC_AUTH=local npx expo start --web`), puis
 *   node apps/web/scripts/site-images/looks.mjs http://localhost:8081 /tmp/minimoa-looks
 * Playwright : le paquet `playwright` résolu depuis ce dossier, ou son chemin dans PLAYWRIGHT.
 * Les tenues et leurs textes (`wardrobe.looks`, cinq langues) vont ensemble : src/content/landing.ts `LOOKS`.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** Nom (fichier tenue_<nom>.webp), espèce, pose en pied et objets portés (identifiants du catalogue, packages/domain). */
export const LOOKS = [
  { name: 'nino_bob', species: 'nino', pose: 'coucou', outfit: { head: 'bob', face: 'lunettes_rondes', body: 'echarpe' } },
  { name: 'gaston_casque', species: 'gaston', pose: 'joie', outfit: { head: 'casquette_envers', body: 'sac_a_dos', toy: 'ballon' } },
  { name: 'suzie_couronne', species: 'suzie', pose: 'fier', outfit: { head: 'couronne', body: 'collier_perles', toy: 'fleur' } },
  { name: 'pia_hiver', species: 'pia', pose: 'neutre', outfit: { head: 'hiver_bonnet', body: 'hiver_echarpe', toy: 'hiver_aura' } },
];

const [base = 'http://localhost:8081', out = '/tmp/minimoa-looks'] = process.argv.slice(2);
const pw = await import(process.env.PLAYWRIGHT ?? 'playwright');
const { chromium } = pw.chromium ? pw : pw.default;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
// Toile de 900 points (celle du pack) en ×2 : 1800 px de large avant réduction.
const page = await browser.newPage({ viewport: { width: 1600, height: 1800 }, deviceScaleFactor: 2 });
for (const look of LOOKS) {
  const q = new URLSearchParams({ species: look.species, pose: look.pose, size: '900', ...look.outfit });
  await page.goto(`${base}/dev/look?${q}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html,body,#root,#root *{background:transparent!important;background-color:transparent!important}' });
  const el = await page.waitForSelector('[data-testid="look"]', { timeout: 240_000 });
  await page.waitForTimeout(2500); // images et masques SVG chargés
  await el.screenshot({ path: join(out, `${look.name}.png`), omitBackground: true });
  console.log(`${look.name} → ${join(out, `${look.name}.png`)}`);
}
await browser.close();
