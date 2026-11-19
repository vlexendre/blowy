import { useState } from 'react';
import type { AdminChemin } from '@blowy/contract';
import { errorText, useApi, useLoad } from '../data';
import { fmtInt } from '../format';
import { ErrorBox, TableSkeleton } from '../ui';

type Status = 'draft' | 'reviewed' | 'live';
const LABEL: Record<Status, string> = { draft: 'Brouillon', reviewed: 'Relue', live: 'En ligne' };
const NEXT: Record<Status, Status[]> = { draft: ['reviewed'], reviewed: ['live', 'draft'], live: ['draft'] };

/**
 * Ton chemin (docs/CHEMIN.md) : séances faites aujourd'hui, unités et questions avec leur statut (brouillon → relue →
 * en ligne) et les alertes du garde-fou. Créer ou modifier une question passe par l'API (`/admin/chemin/questions`).
 */
export function Chemin() {
  const api = useApi();
  const { data, error, loading, reload } = useLoad((a) => a.chemin(), 'chemin');
  const [local, setLocal] = useState<AdminChemin | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const view = local ?? data;

  const setQuestion = async (id: string, status: Status) => {
    setActionError(null);
    try {
      await api.setCheminQuestionStatus(id, status);
      setLocal(await api.chemin());
    } catch (err) {
      setActionError(errorText(err));
    }
  };
  const setUnit = async (id: string, status: Status) => {
    setActionError(null);
    try {
      await api.setCheminUnitStatus(id, status);
      setLocal(await api.chemin());
    } catch (err) {
      setActionError(errorText(err));
    }
  };

  return (
    <>
      <div className="head">
        <h1 tabIndex={-1}>Ton chemin</h1>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {actionError && (
        <p className="muted" role="alert">
          {actionError}
        </p>
      )}
      {loading && !view ? <TableSkeleton cols={6} /> : null}
      {view ? (
        <>
          <div className="card section">
            <p>
              Aujourd’hui ({view.stats.day}) : <strong>{fmtInt(view.stats.sessionsToday)}</strong> séances faites par {fmtInt(view.stats.peopleToday)} personnes, dont{' '}
              {fmtInt(view.stats.bonusToday)} bonus.
            </p>
          </div>
          <h2>Unités</h2>
          <div className="table-wrap section">
            <table>
              <thead>
                <tr>
                  <th>Unité</th>
                  <th>Étapes</th>
                  <th className="num">Build min.</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {view.units.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.icon} {u.texts.fr.title} <span className="muted">({u.id})</span>
                    </td>
                    <td>{u.steps.map((s) => s.texts.fr.title).join(' · ')}</td>
                    <td className="num">{u.minBuild}</td>
                    <td>{LABEL[u.status]}</td>
                    <td>
                      {NEXT[u.status].map((s) => (
                        <button key={s} type="button" className="btn" onClick={() => setUnit(u.id, s)}>
                          {LABEL[s]}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>Questions ({view.questions.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Étape</th>
                  <th>Question</th>
                  <th>Format</th>
                  <th>Axe</th>
                  <th>Alertes</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {view.questions.map((q) => (
                  <tr key={q.id}>
                    <td>{q.stepId ?? '—'}</td>
                    <td>
                      {q.texts.fr.text}
                      <div className="muted">{q.options.map((o) => `${o.icon} ${o.texts.fr.label}`).join(' · ')}</div>
                    </td>
                    <td>{q.format}</td>
                    <td>
                      {q.axis} ({q.direction > 0 ? '+' : '−'})
                    </td>
                    <td className="muted">{q.warnings.join(' ') || '—'}</td>
                    <td>{LABEL[q.status]}</td>
                    <td>
                      {NEXT[q.status].map((s) => (
                        <button key={s} type="button" className="btn" onClick={() => setQuestion(q.id, s)}>
                          {LABEL[s]}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  );
}
