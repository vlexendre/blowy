/**
 * Graphiques simples, seulement là où une tendance compte : une série par graphique (pas de double axe,
 * pas de légende à décoder, le titre nomme la série), trait de 2 px à la couleur d'accent, grille discrète,
 * survol au clavier et à la souris, et le tableau des valeurs pour qui ne lit pas le graphique.
 */
import type { AdminSeries } from '@blowy/contract';
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { fmtDay, fmtDayShort, fmtInt } from './format';

const H = 200;
const PAD = { top: 12, right: 12, bottom: 26, left: 48 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  if (v < 1) return Math.ceil(v * 10) / 10;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function TrendChart({ series, title, format = fmtInt }: { series: AdminSeries; title: string; format?: (n: number | null) => string }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  // Largeur réelle du conteneur : le texte garde sa taille quelle que soit la largeur du graphique.
  const box = useRef<HTMLElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pts = series.points;
  const values = pts.map((p) => p.value).filter((v): v is number => v !== null);
  const max = niceMax(Math.max(0, ...values));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (pts.length <= 1 ? iw / 2 : (i / (pts.length - 1)) * iw);
  const y = (v: number) => PAD.top + ih - (v / max) * ih;
  const path = useMemo(() => {
    let d = '';
    let pen = false;
    pts.forEach((p, i) => {
      if (p.value === null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, max, W]);
  const area = path ? `${path} L${x(lastIndex(pts)).toFixed(1)},${PAD.top + ih} L${x(firstIndex(pts)).toFixed(1)},${PAD.top + ih} Z` : '';
  const ticks = [0, max / 2, max];
  const h = hover !== null ? pts[hover] : undefined;

  if (values.length === 0) return <p className="muted small">Pas encore de données pour « {title} ».</p>;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setHover((i) => Math.min(pts.length - 1, (i ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setHover((i) => Math.max(0, (i ?? pts.length) - 1));
    else if (e.key === 'Escape') setHover(null);
  };

  return (
    <figure className="chart" style={{ margin: 0 }} ref={box}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={`${id}-t`}
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - PAD.left) / iw) * (pts.length - 1));
          setHover(Math.max(0, Math.min(pts.length - 1, i)));
        }}
      >
        <title id={`${id}-t`}>{`${title}, ${pts.length} jours. Flèches gauche et droite pour lire chaque jour.`}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--mute)">
              {format(t)}
            </text>
          </g>
        ))}
        {[0, Math.floor((pts.length - 1) / 2), pts.length - 1].map((i) => {
          const p = pts[i];
          return p ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'} fontSize={11} fill="var(--mute)">
              {fmtDayShort(p.day)}
            </text>
          ) : null;
        })}
        <path d={area} fill="var(--accent)" opacity={0.1} />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {h && h.value !== null && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih} stroke="var(--mute)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.value)} r={5} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${((h.value !== null ? y(h.value) : PAD.top) / H) * 100}%` }} role="status">
          <strong>{format(h.value)}</strong>
          {fmtDay(h.day, { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      )}
      <details className="data">
        <summary>Voir les valeurs</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Jour</th>
                <th className="num">{title}</th>
              </tr>
            </thead>
            <tbody>
              {pts.map((p) => (
                <tr key={p.day}>
                  <td>{fmtDay(p.day)}</td>
                  <td className="num">{format(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

const firstIndex = (pts: AdminSeries['points']): number => Math.max(0, pts.findIndex((p) => p.value !== null));
function lastIndex(pts: AdminSeries['points']): number {
  for (let i = pts.length - 1; i >= 0; i--) if (pts[i]?.value !== null) return i;
  return 0;
}

/** Barres horizontales étiquetées (une seule teinte : la valeur et la part sont écrites). */
export function BarList({ rows, label }: { rows: { label: string; value: number }[]; label: string }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bars" role="list" aria-label={label}>
      {rows.map((r) => (
        <div className="bar-row" role="listitem" key={r.label}>
          <span>{r.label}</span>
          <div className="bar-track" aria-hidden="true">
            <div className="bar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="num">
            {fmtInt(r.value)}
            {total > 0 ? ` · ${Math.round((r.value / total) * 100)} %` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
