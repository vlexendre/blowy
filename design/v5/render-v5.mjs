// Rendu V5 : comme tooling/design-render/render.mjs (inchangé), mais chaque écran à sa taille : 390 × 844 @2x, et 1280 × 800 @1x pour le côté lieu (L-*).
// Usage : DESIGN_ROOT=design/v5 NODE_PATH=$(npm root -g) node design/v5/render-v5.mjs .local/dc-runtime.js design/v5/renders [filtre]
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // global (préinstallé) ou workspace

const root = process.env.DESIGN_ROOT ? new URL(process.env.DESIGN_ROOT.replace(/\/?$/, '/'), 'file://' + process.cwd() + '/').pathname : new URL('./', import.meta.url).pathname; // DESIGN_ROOT=design/v5 pour une autre version
const [runtime, outDir, filter] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
const assets = await readdir(join(root, 'assets'));
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file;
    if (p.endsWith('/support.js')) file = runtime;
    else if (p.startsWith('/_blob/')) { const id = p.slice(7); const a = assets.find((x) => x.startsWith(id)); file = a && join(root, 'assets', a); }
    else file = join(root, 'project', p.replace(/^\/+/, ''));
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
await mkdir(outDir, { recursive: true });
const files = (await readdir(join(root, 'project'))).filter((f) => f.endsWith('.dc.html') && (!filter || f.includes(filter)));
const browser = await chromium.launch();
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
for (const f of files) {
  const page = await (f.startsWith('L-') ? ctxD : ctxM).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://localhost:${port}/${f}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1800);
  const box = await page.evaluate(() => { const el = document.body; return { w: el.scrollWidth, h: el.scrollHeight }; });
  await page.screenshot({ path: join(outDir, f.replace('.dc.html', '.png')), fullPage: true });
  console.log(f, box.w + 'x' + box.h, errs.length ? 'ERR ' + errs[0] : 'ok');
  await page.close();
}
await browser.close(); server.close();
