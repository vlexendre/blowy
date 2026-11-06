// Audit WCAG 2.2 AA des maquettes V5 : contraste du texte (calculé sur le fond réel, dégradés compris) et cibles tactiles ≥ 44 pt.
// Usage : NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js [filtre]
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = dirname(fileURLToPath(import.meta.url));
const [runtime, filter] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
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
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const files = (await readdir(join(root, 'project'))).filter((f) => f.endsWith('.dc.html') && (!filter || f.includes(filter)));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
let totalText = 0, totalTargets = 0, fails = 0, worst = 99;
for (const f of files) {
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/${f}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const all = (s) => [...s.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0]));
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
    // Fond(s) candidats sous un élément : on remonte jusqu'au premier fond opaque ; un dégradé donne plusieurs candidats.
    const backgrounds = (el) => {
      let layers = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) { const cols = all(cs.backgroundImage); return { cands: cols.map((c) => layers.reduceRight((acc, l) => blend(l, acc), c.a < 1 ? blend(c, { r: 255, g: 247, b: 236, a: 1 }) : c)), grad: true }; }
        if (cs.backgroundImage && cs.backgroundImage.includes('url(')) return { cands: [], img: true };
        const bg = parse(cs.backgroundColor);
        if (bg && bg.a > 0) { if (bg.a >= 1) return { cands: [layers.reduceRight((acc, l) => blend(l, acc), bg)] }; layers.push(bg); }
      }
      return { cands: [layers.reduceRight((acc, l) => blend(l, acc), { r: 255, g: 255, b: 255, a: 1 })] };
    };
    const out = { text: [], targets: [], nText: 0, nTargets: 0, minRatio: 99 };
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode; const el = n.parentElement;
      if (!el || !n.textContent.trim() || seen.has(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el); const rect = el.getBoundingClientRect();
      if (cs.visibility === 'hidden' || cs.display === 'none' || rect.width === 0 || rect.height === 0) continue;
      let hidden = false; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || parseFloat(s.opacity) === 0 || e.getAttribute('aria-hidden') === 'true' || e.getAttribute('role') === 'img') { hidden = true; break; } }
      if (hidden || rect.left < -100) continue;
      const fg = parse(cs.color); const { cands, img } = backgrounds(el);
      if (img || !cands.length) continue;
      const size = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight, 10);
      const large = size >= 24 || (size >= 18.66 && w >= 700);
      const need = large ? 3 : 4.5;
      const rmin = Math.min(...cands.map((b) => ratio(fg.a < 1 ? blend(fg, b) : fg, b)));
      out.nText++; out.minRatio = Math.min(out.minRatio, rmin);
      if (rmin < need) out.text.push(`${rmin.toFixed(2)}:1 < ${need} « ${n.textContent.trim().slice(0, 50)} » (${size}px/${w})`);
    }
    for (const el of document.querySelectorAll('a[href], button, input, [role=switch], [role=radio], [role=checkbox]')) {
      const lab = el.tagName === 'INPUT' ? el.closest('label') : null;
      const rect = (lab || el).getBoundingClientRect(); const cs = getComputedStyle(el);
      if (rect.width === 0 || cs.display === 'none' || el.closest('[style*="display: none"]')) continue;
      let hidden = false; for (let e = el; e; e = e.parentElement) if (getComputedStyle(e).display === 'none') { hidden = true; break; }
      if (hidden) continue;
      out.nTargets++;
      const inline = el.tagName === 'A' && el.closest('p, span') && cs.display === 'inline';
      if (!inline && (rect.height < 43.5 || rect.width < 43.5)) out.targets.push(`${Math.round(rect.width)}×${Math.round(rect.height)} « ${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40)} »`);
    }
    return out;
  });
  totalText += r.nText; totalTargets += r.nTargets; worst = Math.min(worst, r.minRatio);
  const n = r.text.length + r.targets.length; fails += n;
  console.log(`${f} : ${r.nText} textes (min ${r.minRatio.toFixed(2)}:1), ${r.nTargets} cibles${n ? ' — ' + n + ' problème(s)' : ' — ok'}`);
  for (const t of r.text) console.log('   contraste ' + t);
  for (const t of r.targets) console.log('   cible ' + t);
  await page.close();
}
console.log(`\nTOTAL : ${files.length} écrans, ${totalText} textes, ${totalTargets} cibles, ${fails} problème(s), contraste minimum ${worst.toFixed(2)}:1`);
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
