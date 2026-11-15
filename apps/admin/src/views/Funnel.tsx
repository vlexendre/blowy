import type { Metric } from '@blowy/contract';
import { BarList, TrendChart } from '../charts';
import { useLoad } from '../data';
import { fmtInt, fmtPct } from '../format';
import { Delta, ErrorBox, Freshness, NoStats, Tile, TileSkeletons } from '../ui';

function Step({ label, m, from }: { label: string; m: Metric; from: { label: string; m: Metric } | null }) {
  const conv = from && m.value !== null && from.m.value ? m.value / from.m.value : null;
  return (
    <div className="card tile step">
      <span className="label">{label}</span>
      <span className="value">{fmtInt(m.value)}</span>
      <span className="period">7 derniers jours</span>
      {m.value === null ? <span className="delta none">Pas encore compté par « vision »</span> : <Delta m={m} compare="vs 7 jours d’avant" />}
      {from && <span className="conv">{conv === null ? '—' : `${fmtPct(conv)} des ${from.label.toLowerCase()}`}</span>}
    </div>
  );
}

export function Funnel() {
  const { data, error, loading, reload } = useLoad((api) => api.funnel(), 'funnel');
  return (
    <>
      <div className="head">
        <h1>Liens et rencontres</h1>
        {data && <Freshness asOf={data.asOf} computedAt={data.computedAt} />}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <TileSkeletons n={3} />}
      {data && !data.asOf && <NoStats />}
      {data?.asOf && (
        <>
          <section className="section" aria-labelledby="fun">
            <h2 id="fun">
              Des rencontres aux liens <span className="hint">proposées par les minimoas → saluées → acceptées</span>
            </h2>
            <div className="funnel">
              <Step label="Proposées" m={data.encounters.proposed} from={null} />
              <Step label="Saluées" m={data.encounters.waved} from={{ label: 'Proposées', m: data.encounters.proposed }} />
              <Step label="Acceptées" m={data.encounters.accepted} from={{ label: 'Saluées', m: data.encounters.waved }} />
            </div>
          </section>
          <div className="grid-2 section">
            <section className="card" aria-labelledby="links">
              <h2 id="links">État des liens</h2>
              <BarList
                label="État des liens"
                rows={[
                  { label: 'Vivants', value: data.links.active },
                  { label: 'Fantômes', value: data.links.ghost },
                  { label: 'Archivés', value: data.links.archived },
                ]}
              />
            </section>
            <Tile
              label="Compatibilité moyenne des rencontres proposées"
              m={data.averageCompatibility}
              period="sur 100, le jour"
              compare="sur 7 jours"
              note="Pas encore fournie par « vision »"
            />
          </div>
          <section className="section" aria-labelledby="tr">
            <h2 id="tr">
              Par jour <span className="hint">30 derniers jours, un graphique par étape</span>
            </h2>
            <div className="grid-3">
              {data.series.map((s) => (
                <div className="card" key={s.key}>
                  <h3>{s.label}</h3>
                  <TrendChart series={s} title={`Rencontres ${s.label.toLowerCase()}`} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
