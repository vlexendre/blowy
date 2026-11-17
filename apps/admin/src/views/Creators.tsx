import { type FormEvent, useState } from 'react';
import { errorText, useApi, useLoad } from '../data';
import { fmtDateTime, fmtInt } from '../format';
import { Empty, ErrorBox, TableSkeleton } from '../ui';

/**
 * Codes des créateurs (`minimoa.app/c/<code>`, `?ref=<code>`) : créer, renommer, désactiver. Visites de la page et
 * comptes arrivés avec le code sur 12 semaines. Aucune récompense contre un avis ; rien qui dépende d'un achat.
 */
export function Creators() {
  const api = useApi();
  const { data, error, loading, reload } = useLoad((a) => a.creators(), 'creators');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [items, setItems] = useState<typeof data | null>(null);
  const list = items ?? data;

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      setItems(await api.createCreator(code.trim().toUpperCase(), name.trim()));
      setCode('');
      setName('');
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (c: string, active: boolean) => {
    try {
      setItems(await api.updateCreator(c, { active }));
    } catch (err) {
      setFormError(errorText(err));
    }
  };

  return (
    <>
      <div className="head">
        <h1 tabIndex={-1}>Créateurs</h1>
      </div>
      <form className="card section" onSubmit={create} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label className="field">
          Code (3 à 20 lettres ou chiffres)
          <input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} pattern="[A-Za-z0-9]{3,20}" required placeholder="NINO10" />
        </label>
        <label className="field">
          Nom
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required placeholder="Nino (TikTok)" />
        </label>
        <button type="submit" className="btn primary" disabled={busy}>
          Ajouter
        </button>
        {formError && <p className="muted" role="alert">{formError}</p>}
      </form>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !list ? <TableSkeleton cols={6} /> : null}
      {list && list.items.length === 0 ? <Empty title="Aucun code pour l’instant" /> : null}
      {list && list.items.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Lien</th>
                <th className="num">Visites (12 sem.)</th>
                <th className="num">Comptes (12 sem.)</th>
                <th>Créé</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((c) => (
                <tr key={c.code}>
                  <td>
                    <strong>{c.code}</strong>
                  </td>
                  <td>{c.name}</td>
                  <td className="muted small">minimoa.app/c/{c.code}</td>
                  <td className="num">{fmtInt(c.visits)}</td>
                  <td className="num">{fmtInt(c.onboarded)}</td>
                  <td>{fmtDateTime(c.createdAt)}</td>
                  <td>
                    <button type="button" className="btn" onClick={() => void toggle(c.code, !c.active)}>
                      {c.active ? 'Désactiver' : 'Réactiver'}
                    </button>{' '}
                    <span className={`badge${c.active ? ' ok' : ''}`}>{c.active ? 'Actif' : 'Inactif'}</span>
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
