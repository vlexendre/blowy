// Rapport HTML statique : référence | app | diff | % d'écart, trié du pire au meilleur.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const pct = (r) => (r == null ? '—' : `${(r * 100).toFixed(1)} %`);

/** Tri : écrans absents/en erreur d'abord (écart non mesurable = 100 %), puis écart décroissant. */
export function sortResults(results) {
  const key = (r) => (r.diffRatio == null ? 2 : r.diffRatio);
  return [...results].sort((x, y) => key(y) - key(x) || x.ref.localeCompare(y.ref));
}

export function summarize(results) {
  const measured = results.filter((r) => r.diffRatio != null);
  const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  return {
    screens: results.length,
    measured: measured.length,
    notMeasured: results.length - measured.length,
    meanDiffRatio: mean(measured.map((r) => r.diffRatio)),
    meanDiffRatioCountingAbsentAs100: mean(results.map((r) => r.diffRatio ?? 1)),
    meanLowresDelta: mean(measured.map((r) => r.lowresDelta)),
  };
}

export function renderHtml({ results, summary, meta }) {
  const rows = sortResults(results)
    .map((r) => {
      const img = (kind) => (r.images?.[kind] ? `<a href="${esc(r.images[kind])}"><img loading="lazy" src="${esc(r.images[kind])}" alt="${esc(kind)} ${esc(r.ref)}"></a>` : `<div class="none">${kind === 'app' ? esc(r.status) : '—'}</div>`);
      const bar = r.diffRatio == null ? 100 : Math.min(100, r.diffRatio * 100);
      return `<section class="row" id="${esc(r.ref)}">
  <header><h2>${esc(r.title)}</h2><code>${esc(r.ref)}</code> <span class="st st-${esc(r.status)}">${esc(r.status)}</span>
    <span class="route">${esc(r.target ?? '')} ${esc(r.resolvedRoute ?? r.route ?? '')}</span>
    <strong class="score">${pct(r.diffRatio)}</strong><span class="lr">basse rés. ${pct(r.lowresDelta)}</span>
    <div class="bar"><i style="width:${bar.toFixed(1)}%"></i></div>
    ${r.note ? `<p class="note">${esc(r.note)}</p>` : ''}${r.error ? `<p class="err">${esc(r.error)}</p>` : ''}
    ${r.fonts ? `<p class="fonts">polices : ${esc(r.fonts.map((f) => `${f.family}=${f.status}`).join(' · '))}</p>` : ''}</header>
  <div class="imgs"><figure>${img('ref')}<figcaption>référence</figcaption></figure><figure>${img('app')}<figcaption>app</figcaption></figure><figure>${img('diff')}<figcaption>diff</figcaption></figure></div>
</section>`;
    })
    .join('\n');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QA visuel Blowy</title>
<style>
:root{--bg:#FFF7EC;--fg:#16110D;--mut:#6b5f55;--card:#fff;--acc:#FF5A3C;--line:#eadfce}
@media (prefers-color-scheme:dark){:root{--bg:#16110D;--fg:#f5ede3;--mut:#b3a698;--card:#231c16;--line:#3a3028}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif;padding:16px}
h1{margin:0 0 4px;font-size:22px}.meta{color:var(--mut);margin:0 0 16px}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}.sum div{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
.sum b{display:block;font-size:20px}
.row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:16px}
.row header{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}.row h2{font-size:16px;margin:0}
.score{margin-left:auto;font-size:18px}.lr,.route,.note,.fonts{color:var(--mut);font-size:12px}.note,.err,.fonts{flex-basis:100%;margin:2px 0}.err{color:#c4341b}
.bar{flex-basis:100%;height:6px;background:var(--line);border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;background:var(--acc)}
.st{font-size:11px;padding:2px 8px;border-radius:99px;background:var(--line)}.st-absent,.st-error{background:#c4341b;color:#fff}
.imgs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
figure{margin:0}img{width:100%;height:auto;display:block;border-radius:10px;border:1px solid var(--line)}figcaption{text-align:center;color:var(--mut);font-size:12px}
.none{aspect-ratio:390/844;display:grid;place-items:center;border:1px dashed var(--line);border-radius:10px;color:var(--mut)}
</style></head><body>
<h1>QA visuel — maquettes V4 ↔ app</h1>
<p class="meta">${esc(meta.refs ?? "")} · ${esc(meta.routes ?? "")} · ${esc(meta.generatedAt)} · seuil pixelmatch ${meta.threshold} · viewport ${meta.viewport} · safe areas ${esc(meta.insets)} · ${esc(meta.note ?? '')}</p>
<div class="sum"><div>écart moyen (mesurés)<b>${pct(summary.meanDiffRatio)}</b></div><div>écart moyen (absents = 100 %)<b>${pct(summary.meanDiffRatioCountingAbsentAs100)}</b></div><div>écrans mesurés<b>${summary.measured} / ${summary.screens}</b></div><div>basse rés. moyenne<b>${pct(summary.meanLowresDelta)}</b></div></div>
${rows}
</body></html>`;
}
