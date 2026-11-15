import { useState } from 'react';
import type { AdminSeries } from '@blowy/contract';
import { TrendChart } from '../charts';
import { useLoad } from '../data';
import { FEATURES, fmtInt, fmtUsd } from '../format';
import { Empty, ErrorBox, Segmented, TableSkeleton, TileSkeletons } from '../ui';

export function Costs() {
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const { data, error, loading, reload } = useLoad((api) => api.aiCosts(Number(days)), `ai-${days}`);
  const totals = new Map<string, number>();
  for (const d of data?.days ?? []) totals.set(d.day, (totals.get(d.day) ?? 0) + d.costUsd);
  const series: AdminSeries = { key: 'spend', label: 'Dépense IA par jour', points: [...totals.entries()].sort().map(([day, value]) => ({ day, value: Math.round(value * 100) / 100 })) };
  const ratio = data?.dailyCeilingUsd ? (data.todaySpendUsd ?? 0) / data.dailyCeilingUsd : 0;

  return (
    <>
      <div className="head">
        <h1>Coûts de l’IA</h1>
        <Segmented
          label="Période"
          value={days}
          onChange={setDays}
          options={[
            ['7', '7 jours'],
            ['30', '30 jours'],
            ['90', '90 jours'],
          ]}
        />
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <TileSkeletons n={3} />}
      {data && !data.available && <Empty title="Pas encore branché">Le compteur d’usage de l’IA (chantier « plateforme ») n’est pas fourni par l’API.</Empty>}
      {data?.available && (
        <>
          <div className="grid">
            <div className={`card tile${data.killSwitch === 'on' ? ' accent' : ''}`}>
              <span className="label">Interrupteur général</span>
              <span className="value">{data.killSwitch === 'on' ? 'IA coupée' : 'IA active'}</span>
              <span className="period">{data.killSwitch === 'on' ? 'AI_KILL_SWITCH=1 : règles et modèles de phrases seulement' : 'AI_KILL_SWITCH=0, se change dans la configuration de l’API'}</span>
            </div>
            <div className="card tile">
              <span className="label">Dépense aujourd’hui</span>
              <span className="value">{fmtUsd(data.todaySpendUsd)}</span>
              <span className="period">plafond global : {fmtUsd(data.dailyCeilingUsd)} par jour</span>
              <div className={`progress${ratio >= 1 ? ' over' : ''}`} role="progressbar" aria-label="Part du plafond du jour" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
                <div style={{ width: `${Math.min(100, ratio * 100)}%` }} />
              </div>
              <span className="period">{Math.round(ratio * 100)} % du plafond</span>
            </div>
            <div className="card tile">
              <span className="label">Sur la période</span>
              <span className="value">{fmtUsd(data.byFeature.reduce((s, f) => s + f.costUsd, 0))}</span>
              <span className="period">{fmtInt(data.byFeature.reduce((s, f) => s + f.calls, 0))} appels · {days} derniers jours</span>
            </div>
          </div>
          <section className="section card" aria-labelledby="spend">
            <h2 id="spend">Dépense par jour (toutes fonctions)</h2>
            <TrendChart series={series} title="Dépense en dollars" format={fmtUsd} />
          </section>
          <section className="section" aria-labelledby="feat">
            <h2 id="feat">Par fonction</h2>
            {data.byFeature.length === 0 ? (
              <Empty title="Aucun appel sur la période" />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fonction</th>
                      <th className="num">Appels</th>
                      <th className="num">Dépense</th>
                      <th className="num">Par appel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byFeature.map((f) => (
                      <tr key={f.feature}>
                        <td>{FEATURES[f.feature] ?? f.feature}</td>
                        <td className="num">{fmtInt(f.calls)}</td>
                        <td className="num">{fmtUsd(f.costUsd)}</td>
                        <td className="num">{f.calls > 0 ? `${(f.costUsd / f.calls).toFixed(4)} $` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {loading && !data && <TableSkeleton rows={4} cols={4} />}
    </>
  );
}
