// Audit WCAG 2.2 AA des maquettes V5 : contraste du texte (calculé sur le fond réel, dégradés compris) et cibles tactiles ≥ 44 pt.
// + mise en page, mesurée sur le DOM rendu (boîtes englobantes) : texte qui touche l'ombre d'un bouton, texte rogné par un conteneur,
//   texte collé au bord de son fond coloré, date ou heure coupée en fin de ligne.
// + contrôles repris de tooling/qa/layout/overflow.mjs (outil du jury) : texte hors du cadre (droite ; bas pour un écran fixe), plages « 26–29 ans » / « 3 hommes » coupées.
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
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
let totalText = 0, totalTargets = 0, fails = 0, worst = 99, totalLayout = 0;
for (const f of files) {
  const page = await (f.startsWith('L-') ? ctxD : ctxM).newPage();
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
    // --- Mise en page
    out.layout = []; out.nLayout = 0;
    const visibleText = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) { const n = tw.currentNode; if (n.textContent.trim() && n.parentElement && n.parentElement.closest('x-dc, body')) visibleText.push(n); }
    const textRect = (n) => { const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()].filter((q) => q.width > 0.5); };
    const hiddenEl = (el) => { if (el.closest && el.closest('details:not([open])') && !el.closest('summary')) return true; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return true; } return false; };
    // a) texte qui touche l'ombre portée d'un bouton (ombre « 0 Npx 0 »)
    const btns = [...document.querySelectorAll('.btn')].filter((b) => !hiddenEl(b));
    for (const b of btns) {
      const m = getComputedStyle(b).boxShadow.match(/(-?\d+(?:\.\d+)?)px (-?\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px/);
      const off = m ? Math.max(0, parseFloat(m[2])) + parseFloat(m[3]) : 0;
      const br = b.getBoundingClientRect(); const bottom = br.bottom + off;
      for (const n of visibleText) {
        const el = n.parentElement; if (b.contains(el) || hiddenEl(el) || el.closest('[aria-hidden="true"]')) continue;
        for (const q of textRect(n)) {
          if (q.right <= br.left + 2 || q.left >= br.right - 2) continue;
          if (q.top < bottom + 4 && q.bottom > br.top + 1) { out.layout.push(`texte contre l'ombre d'un bouton (${Math.round(q.top - bottom)} px) « ${n.textContent.trim().slice(0, 40)} »`); break; }
        }
      }
    }
    // b) texte rogné par un ancêtre qui masque son débordement ; c) texte collé au bord d'un fond coloré
    const pageBg = getComputedStyle(document.querySelector('x-dc > div, body > div') || document.body).backgroundColor;
    for (const n of visibleText) {
      const el = n.parentElement; if (hiddenEl(el) || el.closest('[aria-hidden="true"], .gnav, input, svg')) continue;
      out.nLayout++;
      const rects = textRect(n); if (!rects.length) continue;
      const tr = { left: Math.min(...rects.map((q) => q.left)), right: Math.max(...rects.map((q) => q.right)), top: Math.min(...rects.map((q) => q.top)), bottom: Math.max(...rects.map((q) => q.bottom)) };
      const cs0 = getComputedStyle(el);
      if (cs0.textOverflow === 'ellipsis') continue;
      let clipped = false, edge = false;
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        if (!clipped && (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden') && r.width < innerWidth - 1 && r.height < 840) {
          if (tr.left < r.left - 1 || tr.right > r.right + 1 || tr.top < r.top - 1 || tr.bottom > r.bottom + 1) { clipped = true; out.layout.push(`texte rogné « ${n.textContent.trim().slice(0, 40)} »`); }
        }
        const bg = cs.backgroundColor; const hasBg = (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg) && bg !== pageBg) || /gradient/.test(cs.backgroundImage);
        if (!edge && hasBg && e !== el.closest('x-dc > div') && r.width < innerWidth - 2) {
          const gapL = tr.left - r.left, gapR = r.right - tr.right;
          if ((gapL < 6 || gapR < 4) && r.width > 60 && tr.right - tr.left > 20) { edge = true; out.layout.push(`texte collé au bord de son fond (${Math.round(Math.min(gapL, gapR))} px) « ${n.textContent.trim().slice(0, 40)} »`); }
          break;
        }
      }
    }
    // e) (repris de tooling/qa/layout/overflow.mjs) texte hors du cadre de l'artboard : à droite partout ; en bas pour un écran fixe (non défilant)
    const fixed = document.documentElement.scrollHeight <= innerHeight + 1;
    const H = innerHeight, Wd = document.documentElement.clientWidth;
    for (const n of visibleText) {
      if (hiddenEl(n.parentElement) || n.parentElement.closest('details:not([open]) > :not(summary)')) continue;
      const rs = textRect(n); if (!rs.length) continue;
      const bot = Math.max(...rs.map((q) => q.bottom)), right = Math.max(...rs.map((q) => q.right));
      if (fixed && bot > H + 1) out.layout.push(`hors cadre (bas ${Math.round(bot)} > ${Math.round(H)}) « ${n.textContent.trim().slice(0, 40)} »`);
      if (right > Wd + 1) out.layout.push(`hors cadre (droite ${Math.round(right)}) « ${n.textContent.trim().slice(0, 40)} »`);
    }
    // d) date ou heure coupée en fin de ligne
    const reCut = /\d+\s?[–-]\u2060?\s?\d+ ?ans|\d+ (?:femmes|hommes|personnes|souvenirs|places?)|(?:lun|mar|mer|jeu|ven|sam|dim)\.\s\d{1,2}\s(?:nov|déc)\.|\d{1,2}\sh\s\d{2}|\d{1,2}\s(?:h|min)\b|\d{1,2}\s(?:novembre|décembre)/g;
    for (const n of visibleText) {
      if (hiddenEl(n.parentElement)) continue;
      for (const m of n.textContent.matchAll(reCut)) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const tops = new Set([...r.getClientRects()].filter((q) => q.width > 0.5).map((q) => Math.round(q.top)));
        if (tops.size > 1) out.layout.push(`date coupée « ${m[0]} »`);
      }
    }
    return out;
  });
  totalText += r.nText; totalTargets += r.nTargets; worst = Math.min(worst, r.minRatio);
  const n = r.text.length + r.targets.length + r.layout.length; fails += n; totalLayout += r.nLayout;
  console.log(`${f} : ${r.nText} textes (min ${r.minRatio.toFixed(2)}:1), ${r.nTargets} cibles${n ? ' — ' + n + ' problème(s)' : ' — ok'}`);
  for (const t of r.text) console.log('   contraste ' + t);
  for (const t of r.targets) console.log('   cible ' + t);
  for (const t of r.layout) console.log('   mise en page ' + t);
  await page.close();
}
console.log(`\nTOTAL : ${files.length} écrans, ${totalText} textes, ${totalTargets} cibles, ${totalLayout} blocs de texte mesurés, ${fails} problème(s), contraste minimum ${worst.toFixed(2)}:1`);
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
