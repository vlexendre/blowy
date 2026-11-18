import type { AdminGrowth } from '@blowy/contract';
import { useState } from 'react';
import { useLoad } from '../data';
import { fmtDayShort, fmtDec, fmtInt, fmtPct } from '../format';
import { Empty, ErrorBox, Segmented, TableSkeleton } from '../ui';

/** Étapes de l'entonnoir (`FUNNEL_STEPS` du domaine), dans l'ordre. */
const STEP_LABELS: Record<string, string> = {
  visit: 'Visites',
  first_open: 'Premiers lancements',
  signup: 'Inscriptions',
  onboarded: 'Minimoa créé',
  first_link: 'Premier lien',
  active_d1: 'Actif J1',
  active_d7: 'Actif J7',
  active_d30: 'Actif J30',
  trial: 'Essai',
  paid: 'Payant',
};
type Source = AdminGrowth['funnel'][number]['source'];
const SOURCES: readonly (readonly [Source, string])[] = [
  ['all', 'Toutes'],
  ['creator', 'Créateurs'],
  ['words', '3 mots'],
  ['group', 'Groupes'],
  ['invite', 'Invitations'],
  ['quiz', 'Quiz du site'],
  ['quartier', 'Quartiers'],
  ['store', 'App Store'],
];

/** Passage d'une étape à la suivante (« — » sans base). */
const rate = (n: number, base: number): string => (base > 0 ? fmtPct(n / base) : '—');

export function Growth() {
  const { data, error, loading, reload } = useLoad((api) => api.growth(), 'growth');
  const [source, setSource] = useState<Source>('all');
  return (
    <>
      <div className="head">
        <h1 tabIndex={-1}>Croissance</h1>
        <Segmented label="Source" value={source} options={SOURCES} onChange={setSource} />
      </div>
      <p className="muted">
        Sans SDK tiers : visites (pages de partage, sans IP), premiers lancements et inscriptions comptés par jour ; les étapes suivantes par semaine
        d’inscription. Chaque cellule : le nombre, et le passage depuis l’étape d’avant.
      </p>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <TableSkeleton cols={8} /> : null}
      {data && data.weeks.length === 0 ? <Empty title="Pas encore de chiffres" /> : null}
      {data && data.weeks.length > 0 ? (
        <>
          <section className="section" aria-labelledby="g-funnel">
            <h2 id="g-funnel">Entonnoir par semaine</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Étape</th>
                    {[...data.weeks].reverse().map((w) => (
                      <th className="num" key={w}>
                        {fmtDayShort(w)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.steps.map((step, i) => {
                    const prev = i > 0 ? data.steps[i - 1] : null;
                    return (
                      <tr key={step}>
                        <td>{STEP_LABELS[step] ?? step}</td>
                        {[...data.weeks].reverse().map((w) => {
                          const row = data.funnel.find((f) => f.week === w && f.source === source)?.counts;
                          const n = row?.[step] ?? 0;
                          return (
                            <td className="num" key={w}>
                              {fmtInt(n)}
                              {prev && row ? <div className="muted small">{rate(n, row[prev])}</div> : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section" aria-labelledby="g-k">
            <h2 id="g-k">
              Facteur K <span className="hint">invitations envoyées par personne active × part des invitations qui amènent un compte</span>
            </h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Semaine</th>
                    <th className="num">Partages</th>
                    <th className="num">Actifs (7 j)</th>
                    <th className="num">Par personne</th>
                    <th className="num">Comptes venus d’une personne</th>
                    <th className="num">Conversion</th>
                    <th className="num">K</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.k].reverse().map((k) => (
                    <tr key={k.week}>
                      <td>{fmtDayShort(k.week)}</td>
                      <td className="num">{fmtInt(k.shares)}</td>
                      <td className="num">{fmtInt(k.activeUsers)}</td>
                      <td className="num">{fmtDec(k.sharesPerUser)}</td>
                      <td className="num">{fmtInt(k.referred)}</td>
                      <td className="num">{fmtPct(k.conversion)}</td>
                      <td className="num">
                        <strong>{k.k === null ? '—' : k.k.toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid-2 section">
            <section className="card" aria-labelledby="g-words">
              <h2 id="g-words">
                Boucle « 3 mots » <span className="hint">comptes venus d’un lien / votes</span>
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Semaine</th>
                    <th className="num">Votes</th>
                    <th className="num">Liens créés</th>
                    <th className="num">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.words].reverse().map((r) => (
                    <tr key={r.week}>
                      <td>{fmtDayShort(r.week)}</td>
                      <td className="num">{fmtInt(r.votes)}</td>
                      <td className="num">{fmtInt(r.joined)}</td>
                      <td className="num">{fmtPct(r.loopRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card" aria-labelledby="g-groups">
              <h2 id="g-groups">
                Groupes viables <span className="hint">3 membres ou plus 7 jours après leur création</span>
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Semaine</th>
                    <th className="num">Créés</th>
                    <th className="num">Jugés (7 j)</th>
                    <th className="num">Viables</th>
                    <th className="num">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.groups].reverse().map((r) => (
                    <tr key={r.week}>
                      <td>{fmtDayShort(r.week)}</td>
                      <td className="num">{fmtInt(r.created)}</td>
                      <td className="num">{fmtInt(r.eligible)}</td>
                      <td className="num">{fmtInt(r.viable)}</td>
                      <td className="num">{fmtPct(r.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className="grid-2 section">
            <section className="card" aria-labelledby="g-quiz">
              <h2 id="g-quiz">
                Quiz « Quel minimoa es-tu ? » <span className="hint">K = partages / terminés × commencés depuis un défi / partages</span>
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Semaine</th>
                    <th className="num">Commencés</th>
                    <th className="num">dont défis</th>
                    <th className="num">Terminés</th>
                    <th className="num">Partagés</th>
                    <th className="num">Comptes</th>
                    <th className="num">K</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.quiz].reverse().map((r) => (
                    <tr key={r.week}>
                      <td>{fmtDayShort(r.week)}</td>
                      <td className="num">{fmtInt(r.started)}</td>
                      <td className="num">{fmtInt(r.challenged)}</td>
                      <td className="num">{fmtInt(r.done)}</td>
                      <td className="num">{fmtInt(r.shared)}</td>
                      <td className="num">{fmtInt(r.joined)}</td>
                      <td className="num">{r.k === null ? '—' : r.k.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card" aria-labelledby="g-quartiers">
              <h2 id="g-quartiers">
                Quartiers <span className="hint">inscriptions, confirmations, comptes venus d’une inscription</span>
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Semaine</th>
                    <th className="num">Inscriptions</th>
                    <th className="num">Confirmées</th>
                    <th className="num">Comptes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.quartiers].reverse().map((r) => (
                    <tr key={r.week}>
                      <td>{fmtDayShort(r.week)}</td>
                      <td className="num">{fmtInt(r.joins)}</td>
                      <td className="num">{fmtInt(r.confirmed)}</td>
                      <td className="num">{fmtInt(r.joined)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}
