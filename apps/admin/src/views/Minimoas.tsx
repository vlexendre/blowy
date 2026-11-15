import { useMemo, useState } from 'react';
import { BarList, TrendChart } from '../charts';
import { useLoad } from '../data';
import { SHAPES, fmtInt } from '../format';
import { Empty, ErrorBox, Freshness, NoStats, Segmented, TableSkeleton, Tile, TileSkeletons } from '../ui';

const AXES: Record<string, [string, string, string]> = {
  foyer: ['Foyer', 'libre, en solo', 'fonder un foyer'],
  ancrage: ['Ancrage', 'rester ici', 'partir'],
  elan: ['Élan', 'du temps pour soi', 'de grands projets'],
  rythme: ['Rythme', 'calme, chez soi', 'intense, dehors'],
  cap: ['Cap', 'au jour le jour', 'tout prévoir'],
};
const BUCKETS = ['−100 à −60', '−60 à −20', '−20 à +20', '+20 à +60', '+60 à +100'];

export function Minimoas() {
  const { data, error, loading, reload } = useLoad((api) => api.minimoas(), 'minimoas');
  const [shape, setShape] = useState<'all' | 'en_forme' | 'bof' | 'boude'>('all');
  const [q, setQ] = useState('');
  const top = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.top ?? []).filter((t) => (shape === 'all' || t.shape === shape) && (!needle || `${t.petName} ${t.ownerName}`.toLowerCase().includes(needle)));
  }, [data, shape, q]);

  return (
    <>
      <div className="head">
        <h1>Minimoas</h1>
        {data && <Freshness asOf={data.asOf} computedAt={data.computedAt} />}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <TileSkeletons n={4} />}
      {data && !data.asOf && <NoStats />}
      {data?.asOf && (
        <>
          <section className="section" aria-labelledby="msg">
            <h2 id="msg">Ce que disent les minimoas dans les chats</h2>
            <div className="grid">
              <Tile label="Messages de minimoas" m={data.messages.day} period="sur le jour" compare="vs la veille" />
              <Tile label="Messages de minimoas" m={data.messages.week} period="7 derniers jours" compare="vs 7 jours d’avant" />
              <Tile label="Messages de minimoas" m={data.messages.month} period="30 derniers jours" compare="vs 30 jours d’avant" />
              <Tile label="Taux de réaction" m={data.reactionRate} period="suivis d’une réponse humaine sous 24 h, 7 jours" compare="vs 7 jours d’avant" kind="pct" accent />
            </div>
            {data.series[0] && (
              <div className="card" style={{ marginTop: 12 }}>
                <h3>{data.series[0].label}, par jour</h3>
                <TrendChart series={data.series[0]} title={data.series[0].label} />
              </div>
            )}
          </section>

          <div className="section" style={{ display: 'grid', gap: 12 }}>
            <section className="card" aria-labelledby="shapes">
              <h2 id="shapes">Forme des minimoas</h2>
              {data.shapes ? (
                <BarList label="Forme des minimoas" rows={(['en_forme', 'bof', 'boude'] as const).map((k) => ({ label: SHAPES[k] ?? k, value: data.shapes?.[k] ?? 0 }))} />
              ) : (
                <Empty title="Pas encore branché">La forme est calculée par le chantier « rituels ».</Empty>
              )}
            </section>
            <section className="card" aria-labelledby="visions">
              <h2 id="visions">Répartition des visions</h2>
              {data.visions ? (
                <div className="table-wrap vision">
                  <table>
                    <caption className="sr-only">Part des comptes par tranche, sur chaque axe de vision</caption>
                    <thead>
                      <tr>
                        <th>Axe</th>
                        {BUCKETS.map((b) => (
                          <th key={b} className="num">
                            {b}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.visions.map((v) => {
                        const [name, minus, plus] = AXES[v.axis] ?? [v.axis, '−', '+'];
                        const total = v.buckets.reduce((a, b) => a + b, 0) || 1;
                        const max = Math.max(1, ...v.buckets);
                        return (
                          <tr key={v.axis}>
                            <td>
                              <strong>{name}</strong>
                              <div className="muted small">
                                {minus} → {plus}
                              </div>
                            </td>
                            {v.buckets.map((b, i) => (
                              <td key={i} className="num cell" title={`${fmtInt(b)} comptes`}>
                                {Math.round((b / total) * 100)} %
                                <div className="cell-bar" aria-hidden="true">
                                  <div style={{ width: `${(b / max) * 100}%` }} />
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="Pas encore branché">La répartition vient du chantier « vision ».</Empty>
              )}
            </section>
          </div>

          <section className="section" aria-labelledby="top">
            <h2 id="top">
              Ceux qui vont le mieux <span className="hint">liens actifs, puis forme et série</span>
            </h2>
            <div className="toolbar">
              <Segmented
                label="Filtrer par forme"
                value={shape}
                onChange={setShape}
                options={[
                  ['all', 'Toutes les formes'],
                  ['en_forme', 'En forme'],
                  ['bof', 'Bof'],
                  ['boude', 'Boude'],
                ]}
              />
              <label className="sr-only" htmlFor="topq">
                Rechercher un minimoa ou une personne
              </label>
              <input id="topq" className="input" type="search" placeholder="Minimoa ou prénom" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {top.length === 0 ? (
              <Empty title="Aucun minimoa ne correspond" />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Minimoa</th>
                      <th>Humain</th>
                      <th>Forme</th>
                      <th className="num">Série</th>
                      <th className="num">Liens actifs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((t, i) => (
                      <tr key={`${t.petName}-${t.ownerName}-${i}`}>
                        <td className="muted">{i + 1}</td>
                        <td>
                          <strong>{t.petName}</strong> <span className="muted small">{t.species}</span>
                        </td>
                        <td>{t.ownerName}</td>
                        <td>{t.shape ? SHAPES[t.shape] : <span className="muted">—</span>}</td>
                        <td className="num">{t.streak === null ? '—' : `${fmtInt(t.streak)} j`}</td>
                        <td className="num">{fmtInt(t.activeLinks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {loading && !data && <TableSkeleton />}
    </>
  );
}
