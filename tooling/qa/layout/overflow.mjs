// Contrôles que a11y-audit ne fait pas : texte hors du cadre de l'artboard, et plages « 26–29 » / « 19 h 30 » coupées.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = '/home/claude/blowy/design/v5';
const runtime = '/home/claude/blowy/.local/dc-runtime.js';
const canvas = JSON.parse(await readFile(join(root, 'project/canvas.json'), 'utf8'));
const assets = await readdir(join(root, 'assets'));
const server = createServer(async (req, res) => {
  try { const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); let file;
    if (p.endsWith('/support.js')) file = runtime;
    else if (p.startsWith('/_blob/')) { const id = p.slice(7); const a = assets.find((x) => x.startsWith(id)); file = a && join(root, 'assets', a); }
    else file = join(root, 'project', p.replace(/^\/+/, ''));
    const body = await readFile(file); res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript' }[extname(file)] ?? 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); } });
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch();
for (const [f, b] of Object.entries(canvas.boards)) {
  const ctx = await browser.newContext({ viewport: { width: b.w, height: b.h } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/${f}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(700);
  const r = await page.evaluate((H) => {
    const out = [];
    const W = document.documentElement.clientWidth;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode; const el = n.parentElement; const t = n.textContent.trim();
      if (!el || !t) continue;
      let hid = false; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) { hid = true; break; } }
      if (hid) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter((x) => x.width > 0);
      if (!rects.length) continue;
      const bot = Math.max(...rects.map((x) => x.bottom)), right = Math.max(...rects.map((x) => x.right));
      if (bot > H + 1) out.push(`HORS CADRE (bas ${Math.round(bot)} > ${H}) « ${t.slice(0, 60)} »`);
      if (right > W + 1) out.push(`HORS CADRE (droite ${Math.round(right)}) « ${t.slice(0, 60)} »`);
      // plages numériques coupées
      const re = /\d+\s?[–-]\s?\d+ ?ans|\d+ h \d+|\d+ (?:femmes|hommes|min|personnes|souvenirs|places?)/g; let m;
      const txt = n.textContent;
      while ((m = re.exec(txt))) {
        const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        const tops = new Set([...rg.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
        if (tops.size > 1) out.push(`COUPÉ « ${m[0]} » dans « ${t.slice(0, 70)} »`);
      }
    }
    return out;
  }, b.h);
  if (r.length) console.log(`${f}\n  ${[...new Set(r)].join('\n  ')}`);
  await ctx.close();
}
await browser.close(); server.close();
