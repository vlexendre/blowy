import { type FormEvent, useState } from 'react';
import { errorText, useApi, useLoad } from '../data';
import { fmtDateTime, fmtInt } from '../format';
import { Empty, ErrorBox, TableSkeleton } from '../ui';

/**
 * Quartiers (« Ouvre ton quartier », docs/VIRALITE.md) : compteurs réels (adresses confirmées), seuil d'ouverture et
 * ouverture à la main. À l'ouverture, le minuteur pose les fondateurs et envoie « Ton quartier est ouvert » une fois.
 * Aucune adresse e-mail n'est montrée ici.
 */
export function Quartiers() {
  const api = useApi();
  const { data, error, loading, reload } = useLoad((a) => a.quartiers(), 'quartiers');
  const [items, setItems] = useState<typeof data | null>(null);
  const list = items ?? data;
  const [threshold, setThreshold] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<NonNullable<typeof data>>) => {
    setBusy(key);
    setFormError(null);
    try {
      setItems(await fn());
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(null);
    }
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(threshold);
    if (Number.isInteger(n) && n >= 1) void run('threshold', () => api.setQuartierThreshold(n));
  };
  const open = (zone: string, label: string) => {
    if (window.confirm(`Ouvrir ${label} maintenant ? Les inscrits confirmés recevront « Ton quartier est ouvert » au prochain passage du minuteur.`)) {
      void run(zone, () => api.openQuartier(zone));
    }
  };

  return (
    <>
      <div className="head">
        <h1 tabIndex={-1}>Quartiers</h1>
      </div>
      <form className="card section" onSubmit={save} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label className="field">
          Seuil d’ouverture (personnes confirmées)
          <input
            className="input"
            type="number"
            min={1}
            max={100000}
            value={threshold}
            placeholder={list ? String(list.threshold) : '50'}
            onChange={(e) => setThreshold(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn primary" disabled={busy !== null}>
          Enregistrer
        </button>
        <p className="muted small">Seuil actuel : {list ? fmtInt(list.threshold) : '…'}. Un quartier au-dessus s’ouvre au prochain passage du minuteur.</p>
        {formError && (
          <p className="muted" role="alert">
            {formError}
          </p>
        )}
      </form>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !list ? <TableSkeleton cols={7} /> : null}
      {list && list.items.length === 0 ? <Empty title="Aucune inscription pour l’instant" /> : null}
      {list && list.items.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quartier</th>
                <th className="num">Confirmées</th>
                <th className="num">Envoyées</th>
                <th className="num">Manque</th>
                <th className="num">Fondateurs</th>
                <th className="num">Prévenus</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((q) => (
                <tr key={q.zone}>
                  <td>
                    <strong>{q.label}</strong> <span className="muted small">{q.zone}</span>
                  </td>
                  <td className="num">
                    {fmtInt(q.count)} / {fmtInt(q.threshold)}
                  </td>
                  <td className="num">{fmtInt(q.pending)}</td>
                  <td className="num">{q.open ? '—' : fmtInt(q.missing)}</td>
                  <td className="num">{fmtInt(q.founders)}</td>
                  <td className="num">{fmtInt(q.notified)}</td>
                  <td>
                    {q.open ? (
                      <span className="badge ok">
                        Ouvert {q.openedBy === 'admin' ? 'à la main' : 'au seuil'}
                        {q.openedAt ? ` · ${fmtDateTime(q.openedAt)}` : ''}
                      </span>
                    ) : (
                      <button type="button" className="btn" disabled={busy !== null} onClick={() => open(q.zone, q.label)}>
                        Ouvrir maintenant
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
