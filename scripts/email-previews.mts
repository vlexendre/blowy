/**
 * Aperçus des e-mails de Minimoa : chaque e-mail rendu avec des données réalistes, en HTML et en texte, plus les modèles
 * de Supabase Auth (`supabase/templates`, régénérés ici pour garder la même mise en page).
 *
 * Usage (depuis la racine) :
 *   pnpm emails:preview                       # fr et en → /tmp/minimoa-emails (images lues dans apps/web/public/email)
 *   pnpm emails:preview --out <dossier> --locales fr,en,es,pt,nl
 *   pnpm emails:preview --remote              # garde les adresses https://minimoa.app/email/ (après déploiement du site)
 *   pnpm emails:preview --shots               # + captures 375 et 600 px, clair et sombre, images coupées, planche
 *   pnpm emails:preview --supabase            # réécrit supabase/templates/*.html
 * Captures : Playwright (`playwright` résolu depuis ce dossier, ou son chemin dans PLAYWRIGHT).
 * Aucun e-mail n'est envoyé.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { EMAIL_ASSETS_URL, type Email, type Locale, renderEmail } from '../packages/content/src/index';
import { emailSamples, supabaseTemplates } from '../packages/content/src/email/samples';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const OUT = resolve(arg('--out') ?? '/tmp/minimoa-emails');
const LOCALES = (arg('--locales') ?? 'fr,en').split(',') as Locale[];
const REMOTE = process.argv.includes('--remote');
const SHOTS = process.argv.includes('--shots');
const SUPABASE = process.argv.includes('--supabase');

const catalogue = emailSamples;

const local = (html: string): string => (REMOTE ? html : html.split(`${EMAIL_ASSETS_URL}/`).join(pathToFileURL(join(ROOT, 'apps/web/public/email')).href + '/'));

mkdirSync(OUT, { recursive: true });
const pages: { name: string; file: string; bytes: number }[] = [];
for (const locale of LOCALES) {
  for (const [name, mail] of Object.entries(catalogue(locale))) {
    const base = `${name}.${locale}`;
    writeFileSync(join(OUT, `${base}.html`), local(mail.html));
    writeFileSync(join(OUT, `${base}.txt`), `Objet : ${mail.subject}\n\n${mail.text}\n`);
    pages.push({ name: base, file: join(OUT, `${base}.html`), bytes: Buffer.byteLength(mail.html) });
  }
}
const sb = supabaseTemplates();
for (const [name, mail] of Object.entries(sb)) {
  // Aperçu avec des valeurs d'exemple ; le fichier de supabase/templates garde les variables de Supabase.
  const sample = mail.html.split('{{ .Token }}').join('482913').split('{{ .ConfirmationURL }}').join('https://minimoa.app/');
  writeFileSync(join(OUT, `supabase-${name}.html`), local(sample));
  pages.push({ name: `supabase-${name}`, file: join(OUT, `supabase-${name}.html`), bytes: Buffer.byteLength(mail.html) });
  if (SUPABASE) writeFileSync(join(ROOT, 'supabase/templates', `${name}.html`), mail.html);
}
console.log(`${pages.length} aperçus dans ${OUT}${SUPABASE ? ' ; supabase/templates réécrits' : ''}.`);
for (const p of pages) if (p.bytes > 90_000) console.warn(`  ${p.name} : ${Math.round(p.bytes / 1024)} Ko de HTML (Gmail coupe au-delà de 102 Ko)`);

if (SHOTS) {
  const pw = await import(process.env.PLAYWRIGHT ?? 'playwright');
  const { chromium } = pw.chromium ? pw : pw.default;
  const shots = join(OUT, 'shots');
  mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  const sheet: { label: string; src: string }[] = [];
  const offline = new Set(['bienvenue.fr', 'essai-rappel.fr', 'quartier-ouverture.en']);
  for (const p of pages) {
    const variants: { width: number; scheme: 'light' | 'dark'; images: boolean }[] = [
      { width: 375, scheme: 'light', images: true },
      { width: 375, scheme: 'dark', images: true },
      { width: 600, scheme: 'light', images: true },
      { width: 600, scheme: 'dark', images: true },
      ...(offline.has(p.name) ? [{ width: 375, scheme: 'light' as const, images: false }] : []),
    ];
    for (const v of variants) {
      const context = await browser.newContext({ viewport: { width: v.width, height: 800 }, deviceScaleFactor: 2, colorScheme: v.scheme });
      const page = await context.newPage();
      if (!v.images) await page.route('**/*.png', (route: { abort: () => Promise<void> }) => route.abort());
      await page.goto(pathToFileURL(p.file).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const file = join(shots, `${p.name}.${v.width}.${v.scheme}${v.images ? '' : '.sans-images'}.png`);
      await page.screenshot({ path: file, fullPage: true });
      if (v.width === 375 && v.scheme === 'dark' && v.images) sheet.push({ label: p.name, src: pathToFileURL(file).href });
      if (!v.images) sheet.push({ label: `${p.name} · images coupées`, src: pathToFileURL(file).href });
      await context.close();
    }
  }
  // Planche contact : toutes les captures 375 px côte à côte.
  const cols = 8;
  const html = `<!doctype html><html><body style="margin:0;background:#222;font:600 13px system-ui;color:#fff"><div style="display:grid;grid-template-columns:repeat(${cols},260px);gap:16px;padding:16px">${sheet
    .map((s) => `<figure style="margin:0"><figcaption style="padding:0 0 6px">${s.label}</figcaption><img src="${s.src}" style="width:260px;display:block;border-radius:6px"></figure>`)
    .join('')}</div></body></html>`;
  const sheetHtml = join(shots, 'planche.html');
  writeFileSync(sheetHtml, html);
  const page = await browser.newPage({ viewport: { width: cols * 276 + 16, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(sheetHtml).href, { waitUntil: 'load' });
  await page.screenshot({ path: join(OUT, 'planche.png'), fullPage: true });
  await browser.close();
  console.log(`Captures dans ${shots}, planche : ${join(OUT, 'planche.png')}`);
}
