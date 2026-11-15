import type { AdminAudit, ModerationActionKind } from '@blowy/contract';
import { useEffect, useState } from 'react';
import { errorText, useApi, useDebounced } from '../data';
import { ACTIONS, fmtDateTime } from '../format';
import { Empty, ErrorBox, TableSkeleton } from '../ui';

export function Audit() {
  const api = useApi();
  const [action, setAction] = useState<'' | ModerationActionKind>('');
  const [q, setQ] = useState('');
  const query = useDebounced(q);
  const [data, setData] = useState<AdminAudit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .audit({ action: action || undefined, q: query || undefined, limit: 30 })
      .then((r) => alive && setData(r))
      .catch((e: unknown) => alive && setError(errorText(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [api, action, query, nonce]);

  const more = async () => {
    if (!data?.nextCursor) return;
    try {
      const next = await api.audit({ action: action || undefined, q: query || undefined, limit: 30, cursor: data.nextCursor });
      setData({ items: [...data.items, ...next.items], nextCursor: next.nextCursor });
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <div className="head">
        <h1>Journal de modération</h1>
        <span className="fresh">Chaque action, qui l’a prise et pourquoi. Rien ne s’y efface.</span>
      </div>
      <div className="toolbar">
        <label className="sr-only" htmlFor="act">
          Type d’action
        </label>
        <select id="act" className="input" value={action} onChange={(e) => setAction(e.target.value as '' | ModerationActionKind)}>
          <option value="">Toutes les actions</option>
          {Object.entries(ACTIONS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="aq">
          Rechercher
        </label>
        <input id="aq" className="input" type="search" placeholder="Prénom, adresse de l’équipe ou motif" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 280 }} />
      </div>
      {error && <ErrorBox message={error} onRetry={() => setNonce((n) => n + 1)} />}
      {loading && !data ? (
        <TableSkeleton cols={5} />
      ) : data && data.items.length === 0 ? (
        <Empty title="Aucune action ne correspond" />
      ) : (
        data && (
          <div className="table-wrap" aria-busy={loading}>
            <table>
              <thead>
                <tr>
                  <th>Quand</th>
                  <th>Action</th>
                  <th>Compte</th>
                  <th>Par</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(e.at)}</td>
                    <td>
                      <span className={`badge${e.action === 'delete' ? ' late' : e.action === 'suspend' ? ' warn' : ''}`}>{ACTIONS[e.action]}</span>
                      {e.until && <div className="muted small">jusqu’au {fmtDateTime(e.until)}</div>}
                    </td>
                    <td>
                      {e.targetName ?? '—'}
                      {e.reportId && <div className="muted small">signalement n° {e.reportId}</div>}
                    </td>
                    <td className="small">{e.adminEmail}</td>
                    <td>{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.nextCursor && (
              <div className="more">
                <button type="button" className="btn" onClick={more}>
                  Charger la suite
                </button>
              </div>
            )}
          </div>
        )
      )}
    </>
  );
}
