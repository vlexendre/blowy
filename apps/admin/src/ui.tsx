import type { Metric, Rate } from '@blowy/contract';
import type { CSSProperties, ReactNode } from 'react';
import { change, fmtDateTime, fmtDay, fmtDec, fmtInt, fmtPct } from './format';

export function Skeleton({ h = 18, w = '100%', style }: { h?: number; w?: number | string; style?: CSSProperties }) {
  return <div className="sk" aria-hidden="true" style={{ height: h, width: w, ...style }} />;
}

export function TileSkeletons({ n = 4 }: { n?: number }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: n }, (_, i) => (
        <div className="card tile" key={i}>
          <Skeleton h={14} w="55%" />
          <Skeleton h={32} w="70%" style={{ marginTop: 6 }} />
          <Skeleton h={12} w="80%" style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap" aria-busy="true" aria-label="Chargement">
      <table>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c}>
                  <Skeleton h={14} w={c === 0 ? '60%' : '85%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty" role="status">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

type Kind = 'int' | 'pct' | 'dec';
const fmt = (v: number | null, kind: Kind): string => (kind === 'pct' ? fmtPct(v) : kind === 'dec' ? fmtDec(v) : fmtInt(v));

/** Écart avec la période précédente, en texte (flèche et signe : jamais la couleur seule). */
export function Delta({ m, compare, goodWhenUp = true, kind = 'int' }: { m: Metric | Rate; compare: string; goodWhenUp?: boolean; kind?: Kind }) {
  if (m.value === null || m.previous === null) return <span className="delta none">pas encore de comparaison</span>;
  if (kind === 'pct') {
    const pts = Math.round((m.value - m.previous) * 1000) / 10;
    const dir = pts > 0 ? 'up' : pts < 0 ? 'down' : 'flat';
    const cls = dir === 'flat' ? 'flat' : (dir === 'up') === goodWhenUp ? 'up' : 'down';
    return (
      <span className={`delta ${cls}`}>
        {dir === 'up' ? '▲ +' : dir === 'down' ? '▼ ' : '= '}
        {fmtDec(pts)} pt {compare}
      </span>
    );
  }
  const c = change(m.value, m.previous);
  if (c === null) return <span className="delta none">{fmt(m.previous, kind)} {compare}</span>;
  const dir = Math.abs(c) < 0.005 ? 'flat' : c > 0 ? 'up' : 'down';
  const cls = dir === 'flat' ? 'flat' : (dir === 'up') === goodWhenUp ? 'up' : 'down';
  return (
    <span className={`delta ${cls}`} title={`Période précédente : ${fmt(m.previous, kind)}`}>
      {dir === 'up' ? '▲ +' : dir === 'down' ? '▼ ' : '= '}
      {fmtPct(c)} {compare}
    </span>
  );
}

export function Tile(props: { label: string; m: Metric | Rate; period: string; compare: string; kind?: Kind; goodWhenUp?: boolean; accent?: boolean; note?: string }) {
  const { label, m, period, compare, kind = 'int', goodWhenUp, accent, note } = props;
  return (
    <div className={`card tile${accent ? ' accent' : ''}`}>
      <span className="label">{label}</span>
      <span className="value">{fmt(m.value, kind)}</span>
      <span className="period">
        {period}
        {'base' in m && m.base > 0 ? ` · sur ${fmtInt(m.base)}` : ''}
      </span>
      {m.value === null && note ? <span className="delta none">{note}</span> : <Delta m={m} compare={compare} goodWhenUp={goodWhenUp} kind={kind} />}
    </div>
  );
}

export function Freshness({ asOf, computedAt }: { asOf: string | null; computedAt: string | null }) {
  if (!asOf) return <span className="fresh">Pas encore de chiffres calculés</span>;
  return (
    <span className="fresh">
      Chiffres arrêtés au {fmtDay(asOf, { weekday: 'long', day: 'numeric', month: 'long' })}
      {computedAt ? ` · calculés le ${fmtDateTime(computedAt)}` : ''}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function NoStats() {
  return (
    <Empty title="Pas encore de chiffres">
      La tâche quotidienne calcule chaque nuit les chiffres de la veille. Ils apparaîtront ici après son premier passage.
    </Empty>
  );
}
