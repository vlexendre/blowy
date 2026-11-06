#!/usr/bin/env node
/* global process, console, Buffer, fetch, AbortSignal, setTimeout, document, localStorage */
// Banc QA visuel Blowy : capture chaque route de l'app (Expo web, react-native-web) dans
// Chromium 390×844 @2x, la compare au rendu de référence de la maquette et écrit
// .local/qa/visual/{index.html,results.json,ref/,app/,diff/}.
//
// Usage : pnpm qa:visual [-- options]
//   --only=V4-Nid,V4-Chat   ne traiter que ces écrans
//   --rebuild               forcer l'export Expo web (sinon reconstruit si les sources ont changé)
//   --no-build              ne jamais reconstruire (utilise l'export existant)
//   --threshold=0.1         seuil pixelmatch (voir lib/compare.mjs)
//   --insets=47,34          safe areas haut,bas émulées (iPhone 390×844) ; 0,0 pour les couper
//   --route /(dev)/kitchen-sink   avec --only <un écran> : capture cette route à la place (groupes
//                           expo-router « (x) » retirés de l'URL) ; --account <clé|none> idem pour le compte
//   --max-diff=0.25         code de sortie 1 si un écran mesuré dépasse ce ratio
//   --ref <dir>             jeu de références (défaut design/v4-reference/renders ; ex. design/v5/renders)
//   --routes <fichier>      correspondance écran → route (défaut : routes.v4.json, ou routes.v5.json si --ref contient « v5 »)
// Prérequis : Postgres + Redis + base seedée (pnpm db:migrate && pnpm db:seed). L'API locale
// (apps/api/dist) et le site web (apps/web/.next) sont démarrés s'ils ne répondent pas.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, stat, writeFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { compareImages, decodePng, DEFAULT_THRESHOLD, encodePng } from './lib/compare.mjs';
import { applyOverrides, parseArgs } from './lib/args.mjs';
import { renderHtml, summarize } from './lib/report.mjs';
import { startStaticServer } from './lib/static-server.mjs';
import { loadRoutes, routesFileFor } from './screens.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const OUT = join(ROOT, '.local/qa/visual');
const DIST = join(OUT, 'web-dist');
const MOBILE = join(ROOT, 'apps/mobile');
const API_URL = 'http://localhost:3000';
const WEB_URL = 'http://localhost:3002';
/** Port 8081 : origine déjà autorisée par CORS_ORIGINS de l'API locale (apps/api/.env.example). */
const APP_PORT = 8081;
/** Horloge figée côté navigateur (libellés relatifs, heures de messages). */
const FIXED_NOW = '2026-11-06T10:00:00+01:00';
/** Polices de l'app (app/_layout.tsx → @expo-google-fonts, TTF statiques). */
// Familles chargées par l'app : lues dans le fichier généré par la fondation UI (source unique).
const APP_FONTS = [...readFileSync(resolve(ROOT, 'apps/mobile/src/core/fonts/font-files.generated.ts'), 'utf8').matchAll(/^\s*'([^']+)':\s*require\(/gm)].map((m) => m[1]);

const args = parseArgs(process.argv.slice(2));
const threshold = args.threshold ? Number(args.threshold) : DEFAULT_THRESHOLD;
const [insetTop, insetBottom] = String(args.insets ?? '47,34').split(',').map(Number);
const ROUTES = loadRoutes(routesFileFor(args.ref ?? args.refs, args.routes && resolve(ROOT, args.routes)));
const refsDir = resolve(ROOT, args.ref ?? args.refs ?? ROUTES.refs ?? 'design/v4-reference/renders');
const DEMO_DRAFT = ROUTES.demoDraft;
const only = args.only ? new Set(String(args.only).split(',')) : null;
const children = [];
// eslint-disable-next-line no-console -- sortie CLI
const log = (...m) => console.log('[qa:visual]', ...m);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ping(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return r.status < 500;
  } catch {
    return false;
  }
}
async function waitFor(url, label, timeoutMs = 60_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await ping(url)) return;
    await sleep(500);
  }
  throw new Error(`${label} ne répond pas sur ${url}`);
}
function startChild(label, cmd, argv, opts) {
  const child = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  const logFile = join(OUT, `${label}.log`);
  const chunks = [];
  child.stdout.on('data', (d) => chunks.push(d));
  child.stderr.on('data', (d) => chunks.push(d));
  child.on('exit', () => void writeFile(logFile, Buffer.concat(chunks)).catch(() => {}));
  children.push(child);
  return child;
}
function run(cmd, argv, opts) {
  return new Promise((res, rej) => {
    const c = spawn(cmd, argv, { stdio: 'inherit', ...opts });
    c.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} ${argv.join(' ')} → code ${code}`))));
  });
}

async function ensureApi() {
  if (await ping(`${API_URL}/v1/readyz`)) return log('API déjà démarrée');
  const api = join(ROOT, 'apps/api');
  if (!existsSync(join(api, 'dist/main.js'))) throw new Error('apps/api/dist absent : pnpm --filter @blowy/api build');
  const envFile = existsSync(join(api, '.env')) ? '.env' : '.env.example';
  log(`démarrage de l'API (dist, ${envFile})`);
  startChild('api', process.execPath, [`--env-file=${envFile}`, 'dist/main.js'], { cwd: api });
  await waitFor(`${API_URL}/v1/readyz`, 'API (Postgres/Redis démarrés ? base seedée ?)');
}

async function ensureWeb() {
  if (await ping(WEB_URL)) return true;
  const web = join(ROOT, 'apps/web');
  if (!existsSync(join(web, '.next/BUILD_ID'))) {
    log('apps/web/.next absent : écran web ignoré (pnpm --filter @blowy/web build)');
    return false;
  }
  log('démarrage du site web (next start :3002)');
  startChild('web', join(web, 'node_modules/.bin/next'), ['start', '--port', '3002'], { cwd: web, env: { ...process.env, WEB_API_URL: API_URL, BLOWY_ENV: 'local' } });
  await waitFor(WEB_URL, 'site web');
  return true;
}

async function newestMtime(dir) {
  let max = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    max = Math.max(max, e.isDirectory() ? await newestMtime(p) : (await stat(p)).mtimeMs);
  }
  return max;
}

async function ensureWebBuild() {
  const stamp = join(DIST, 'index.html');
  if (args['no-build']) {
    if (!existsSync(stamp)) throw new Error('export Expo web absent et --no-build');
    return;
  }
  if (!args.rebuild && existsSync(stamp)) {
    const built = (await stat(stamp)).mtimeMs;
    const srcs = ['apps/mobile/app', 'apps/mobile/src', 'apps/mobile/assets', 'packages/ui-mobile/src', 'packages/sprites', 'packages/design-tokens/src', 'tooling/qa/visual/capture'];
    let newest = 0;
    for (const s of srcs) if (existsSync(join(ROOT, s))) newest = Math.max(newest, await newestMtime(join(ROOT, s)));
    if (newest <= built) return log('export Expo web à jour');
  }
  log('export Expo web (BLOWY_QA_CAPTURE=1)…');
  await rm(DIST, { recursive: true, force: true });
  await run('npx', ['expo', 'export', '--platform', 'web', '--output-dir', DIST], {
    cwd: MOBILE,
    env: {
      ...process.env,
      CI: '1',
      BLOWY_QA_CAPTURE: '1',
      EXPO_PUBLIC_API_URL: API_URL,
      EXPO_PUBLIC_WS_URL: API_URL,
      EXPO_PUBLIC_BLOWY_ENV: 'local',
      // Parcours d'auth de production (boutons Apple/Google) : pas de lien « comptes de démo »
      // dans les captures. La session de démo est injectée directement (voir capture()).
      EXPO_PUBLIC_AUTH_MODE: 'firebase',
    },
  });
}

async function login(key) {
  const r = await fetch(`${API_URL}/v1/auth/sessions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'local', credential: key }) });
  if (!r.ok) throw new Error(`connexion démo « ${key} » : HTTP ${r.status}`);
  return r.json();
}
async function apiGet(token, path) {
  const r = await fetch(`${API_URL}${path}`, { headers: { authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}

async function resolvePlaceholders(sessions) {
  const alex = sessions.alex;
  const rels = alex ? await apiGet(alex.accessToken, '/v1/relationships') : null;
  const date = rels?.items?.find((r) => r.type === 'DATE' && r.status !== 'ENDED');
  return {
    relationshipId: date?.id ?? '00000000-0000-0000-0000-000000000000',
    conversationId: date?.conversationId ?? '00000000-0000-0000-0000-000000000000',
    inviteCode: 'demo-alex',
    publicSlug: 'demo-alex',
  };
}

async function capture(browser, screen, url, session) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce', locale: 'fr-FR', timezoneId: 'Europe/Paris' });
  const errors = [];
  try {
    const seed = {
      secure: session ? { 'blowy.session.token': session.accessToken, 'blowy.session.meta': JSON.stringify({ userId: session.userId, expiresAt: session.expiresAt }) } : {},
      draft: screen.draft ? DEMO_DRAFT : session ? { ...DEMO_DRAFT, step: 'notifications', petCreated: true, hatched: true, completed: true } : null,
    };
    if (screen.target === 'mobile') {
      await ctx.addInitScript((s) => {
        try {
          localStorage.clear();
          for (const [k, v] of Object.entries(s.secure)) localStorage.setItem(`blowy.qa.secure.${k}`, v);
          if (s.draft) localStorage.setItem('blowy.onboarding.draft.v1', JSON.stringify(s.draft));
        } catch {
          /* stockage indisponible : capture déconnectée */
        }
      }, seed);
    }
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    if (session && screen.target === 'mobile') {
      // Ouverture à froid sur une route profonde : les requêtes partent avant la restauration
      // de la session (jeton null) → 401 → session effacée (constaté, voir docs/qa/visual-baseline.md).
      // Le banc complète l'en-tête manquant au niveau réseau pour capturer l'écran nominal.
      await page.route(`${API_URL}/**`, (route) => {
        const h = route.request().headers();
        if (h.authorization || route.request().method() === 'OPTIONS') return route.continue();
        return route.continue({ headers: { ...h, authorization: `Bearer ${session.accessToken}` } });
      });
    }
    await page.clock.setFixedTime(new Date(FIXED_NOW));
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: insetTop, bottom: insetBottom, left: 0, right: 0 } }).catch((e) => errors.push(`safe areas: ${e.message}`));
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    const fonts = await page.evaluate(async (fams) => {
      await Promise.all(fams.map((f) => document.fonts.load(`16px "${f}"`).catch(() => null)));
      await document.fonts.ready;
      const seen = new Map();
      for (const f of document.fonts) seen.set(f.family.replace(/"/g, ''), f.status);
      return [...seen].map(([family, status]) => ({ family, status }));
    }, screen.target === 'mobile' ? APP_FONTS : []);
    await page.addStyleTag({ content: '*,*::before,*::after{caret-color:transparent!important;transition:none!important;animation-play-state:paused!important}' }).catch(() => {});
    await page.waitForTimeout(1200);
    const textMasks = [];
    for (const src of screen.maskText ?? []) {
      const re = new RegExp(src, 'i');
      for (const loc of await page.getByText(re).all()) {
        const b = await loc.boundingBox().catch(() => null);
        if (b && b.width > 0) textMasks.push([Math.floor(b.x) - 2, Math.floor(b.y) - 2, Math.ceil(b.width) + 4, Math.ceil(b.height) + 4]);
      }
    }
    const png = await page.screenshot({ type: 'png' });
    return { png, fonts, errors, textMasks, finalUrl: page.url() };
  } finally {
    await ctx.close();
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const d of ['ref', 'app', 'diff']) {
    await rm(join(OUT, d), { recursive: true, force: true });
    await mkdir(join(OUT, d), { recursive: true });
  }
  const screens = applyOverrides(ROUTES.screens.filter((s) => !only || only.has(s.ref)), args);
  if (!screens.length) log(`aucun écran dans ${ROUTES.file} (filtre compris) : rapport vide`);
  await writeReport(screens.length ? await prepareAndCapture(screens) : []);
}

async function prepareAndCapture(screens) {
  await ensureApi();
  if (screens.some((s) => s.target === 'mobile')) await ensureWebBuild();
  const webOk = screens.some((s) => s.target === 'web') ? await ensureWeb() : false;
  const server = await startStaticServer(DIST, APP_PORT);
  const accounts = [...new Set(screens.map((s) => s.account).filter(Boolean)), 'alex'];
  const sessions = {};
  for (const k of accounts) sessions[k] = await login(k);
  const ph = await resolvePlaceholders(sessions);
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const s of screens) {
      const r = { ref: s.ref, title: s.title, target: s.target, route: s.route, account: s.account, note: s.note ?? null, masks: s.masks ?? [], images: {}, diffRatio: null, lowresDelta: null };
      results.push(r);
      const refPath = join(refsDir, `${s.ref}.png`);
      if (!existsSync(refPath)) {
        r.status = 'error';
        r.error = `référence absente : ${refPath}`;
        continue;
      }
      await copyFile(refPath, join(OUT, 'ref', `${s.ref}.png`));
      r.images.ref = `ref/${s.ref}.png`;
      if (!s.target) {
        r.status = 'absent';
        log(`${s.ref} : absent (aucune route)`);
        continue;
      }
      if (s.target === 'web' && !webOk) {
        r.status = 'error';
        r.error = 'site web indisponible';
        continue;
      }
      r.resolvedRoute = s.route.replace(/\{(\w+)\}/g, (_, k) => ph[k] ?? `{${k}}`);
      const base = s.target === 'web' ? WEB_URL : `http://localhost:${APP_PORT}`;
      try {
        const cap = await capture(browser, s, base + r.resolvedRoute, s.account ? sessions[s.account] : null);
        r.fonts = cap.fonts;
        r.pageErrors = cap.errors;
        r.finalUrl = cap.finalUrl;
        await writeFile(join(OUT, 'app', `${s.ref}.png`), cap.png);
        r.images.app = `app/${s.ref}.png`;
        r.masks = [...(s.masks ?? []), ...cap.textMasks];
        const cmp = compareImages(decodePng(await readFile(refPath)), decodePng(cap.png), { threshold, masks: r.masks, scale: 2 });
        await writeFile(join(OUT, 'diff', `${s.ref}.png`), encodePng(cmp.diff));
        r.images.diff = `diff/${s.ref}.png`;
        Object.assign(r, { status: 'captured', diffRatio: cmp.diffRatio, lowresDelta: cmp.lowresDelta, diffPixels: cmp.diffPixels, comparedPixels: cmp.comparedPixels, maskedPixels: cmp.maskedPixels, sizeMismatch: cmp.sizeMismatch });
        log(`${s.ref.padEnd(20)} ${(cmp.diffRatio * 100).toFixed(1).padStart(5)} %  basse rés. ${(cmp.lowresDelta * 100).toFixed(1)} %${cap.errors.length ? `  (${cap.errors.length} erreur(s) page)` : ''}`);
      } catch (e) {
        r.status = 'error';
        r.error = e.message;
        log(`${s.ref} : ERREUR ${e.message}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
    for (const c of children) c.kill('SIGTERM');
  }
  return results;
}

async function writeReport(results) {
  const summary = summarize(results);
  const meta = {
    generatedAt: new Date().toISOString(),
    threshold,
    viewport: '390×844 @2x',
    insets: `${insetTop}/${insetBottom}`,
    fixedNow: FIXED_NOW,
    refs: refsDir.replace(ROOT + '/', ''),
    routes: ROUTES.file.replace(ROOT + '/', ''),
    appFonts: APP_FONTS,
    note: 'app = Expo web (react-native-web) + API locale seedée ; référence = maquettes .dc.html (Google Fonts variables)',
  };
  await writeFile(join(OUT, 'results.json'), JSON.stringify({ meta, summary, results }, null, 2));
  await writeFile(join(OUT, 'index.html'), renderHtml({ results, summary, meta }));
  log(`écart moyen ${summary.meanDiffRatio == null ? '—' : (summary.meanDiffRatio * 100).toFixed(1) + ' %'} sur ${summary.measured}/${summary.screens} écrans → ${join(OUT, 'index.html')}`);
  const max = args['max-diff'] ? Number(args['max-diff']) : null;
  if (max != null && results.some((r) => r.status !== 'captured' || r.diffRatio > max)) process.exitCode = 1;
}


main().catch((e) => {
  console.error('[qa:visual]', e);
  for (const c of children) c.kill('SIGTERM');
  process.exit(2);
});
