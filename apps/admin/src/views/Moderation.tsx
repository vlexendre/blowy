import type { AdminReportItem, AdminReports, ModerationActionKind } from '@blowy/contract';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { errorText, useApi, useDebounced, useLoad } from '../data';
import { ACTIONS, REASONS, fmtAge, fmtDateTime } from '../format';
import { Empty, ErrorBox, Segmented, Skeleton, TableSkeleton } from '../ui';

type Status = 'open' | 'handled' | 'all';

export function Moderation({ onCountsChange }: { onCountsChange?: () => void }) {
  const api = useApi();
  const [status, setStatus] = useState<Status>('open');
  const [reason, setReason] = useState('');
  const [q, setQ] = useState('');
  const query = useDebounced(q);
  const [pages, setPages] = useState<AdminReports | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .reports({ status, reason: reason || undefined, q: query || undefined, limit: 25 })
      .then((r) => alive && setPages(r))
      .catch((e: unknown) => alive && setError(errorText(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [api, status, reason, query, nonce]);

  const loadMore = async () => {
    if (!pages?.nextCursor) return;
    setMore(true);
    try {
      const next = await api.reports({ status, reason: reason || undefined, q: query || undefined, limit: 25, cursor: pages.nextCursor });
      setPages({ ...next, items: [...pages.items, ...next.items] });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setMore(false);
    }
  };

  const refresh = () => {
    setNonce((n) => n + 1);
    onCountsChange?.();
  };

  return (
    <>
      <div className="head">
        <h1>Modération</h1>
        {pages && (
          <span className="fresh" role="status">
            <strong style={{ color: 'var(--white)' }}>{pages.open}</strong> à traiter
            {pages.overdue > 0 && (
              <>
                {' · '}
                <span className="badge late">{pages.overdue} au-delà de {pages.targetHours} h</span>
              </>
            )}
            {' · '}délai cible : {pages.targetHours} h
          </span>
        )}
      </div>

      <section aria-labelledby="rep">
        <h2 id="rep" className="sr-only">
          Signalements
        </h2>
        <div className="toolbar">
          <Segmented
            label="Statut"
            value={status}
            onChange={setStatus}
            options={[
              ['open', 'À traiter'],
              ['handled', 'Traités'],
              ['all', 'Tous'],
            ]}
          />
          <label className="sr-only" htmlFor="reason">
            Motif
          </label>
          <select id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Tous les motifs</option>
            {Object.entries(REASONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="q">
            Rechercher une personne signalée
          </label>
          <input id="q" className="input" type="search" placeholder="Personne signalée" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {error && <ErrorBox message={error} onRetry={refresh} />}
        {loading && !pages ? (
          <TableSkeleton cols={6} />
        ) : pages && pages.items.length === 0 ? (
          <Empty title={status === 'open' ? 'Rien à traiter' : 'Aucun signalement'}>{status === 'open' ? 'Tous les signalements ont été traités.' : 'Aucun signalement ne correspond à ces filtres.'}</Empty>
        ) : (
          pages && (
            <div className="table-wrap" aria-busy={loading}>
              <table>
                <thead>
                  <tr>
                    <th>{status === 'open' ? 'Attente' : 'Signalé'}</th>
                    <th>Motif</th>
                    <th>Personne signalée</th>
                    <th>Signalé par</th>
                    <th>Détails</th>
                    <th>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pages.items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.status === 'open' ? (
                          <>
                            <span className={`badge${r.overdue ? ' late' : ''}`} title={r.overdue ? 'Au-delà du délai cible de 24 h' : undefined}>
                              {r.overdue ? `⚠ ${fmtAge(r.ageHours)} · en retard` : fmtAge(r.ageHours)}
                            </span>
                            {r.priority !== 'normal' && (
                              <span className={`badge${r.priority === 'urgent' ? ' late' : ' warn'}`} style={{ marginLeft: 6 }}>
                                {r.priority === 'urgent' ? 'urgent' : 'prioritaire'}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="muted small">{fmtDateTime(r.createdAt)}</span>
                        )}
                      </td>
                      <td>
                        {REASONS[r.reason] ?? r.reason}
                        {r.source === 'filter' && (
                          <div className="muted small">
                            filtre automatique{r.category ? ` · ${r.category}` : ''}
                          </div>
                        )}
                        {r.review && <div className="muted small">compte de revue d’Apple (fictif)</div>}
                      </td>
                      <td>
                        {r.target ? (
                          <>
                            <strong>{r.target.displayName}</strong>
                            <div className="muted small">
                              {r.target.openReports} ouvert{r.target.openReports > 1 ? 's' : ''} · {r.target.totalReports} au total
                              {r.target.suspended && <span className="badge warn" style={{ marginLeft: 6 }}>suspendu</span>}
                            </div>
                          </>
                        ) : (
                          <span className="muted">Compte supprimé</span>
                        )}
                      </td>
                      <td>{r.reporter?.displayName ?? <span className="muted">{r.source === 'filter' ? 'Filtre' : 'Compte supprimé'}</span>}</td>
                      <td className="clip" title={r.details ?? ''}>
                        {r.hasMessage && <span className="badge" style={{ marginRight: 6 }}>message</span>}
                        {r.details ?? <span className="muted">—</span>}
                        {r.resolution && <div className="muted small">{ACTIONS[r.resolution.action]} · {r.resolution.by}</div>}
                      </td>
                      <td>
                        <button type="button" className="btn" onClick={() => setOpenId(r.id)} aria-label={`Ouvrir le signalement de ${r.target?.displayName ?? 'compte supprimé'}`}>
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pages.nextCursor && (
                <div className="more">
                  <button type="button" className="btn" onClick={loadMore} disabled={more}>
                    {more ? 'Chargement…' : 'Charger la suite'}
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </section>

      <Suspensions key={`s-${nonce}`} onChange={refresh} />
      {openId && <ReportDrawer id={openId} onClose={() => setOpenId(null)} onDone={refresh} />}
    </>
  );
}

function Suspensions({ onChange }: { onChange: () => void }) {
  const api = useApi();
  const { data, error, loading, reload } = useLoad((a) => a.suspensions(), 'suspensions');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const lift = async (userId: string, name: string) => {
    setBusy(userId);
    try {
      await api.act({ action: 'lift', targetUserId: userId, reason: 'Suspension levée depuis l’administration.' });
      setMsg(`Suspension de ${name} levée.`);
      reload();
      onChange();
    } catch (e) {
      setMsg(errorText(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="section" aria-labelledby="susp">
      <h2 id="susp">Comptes suspendus</h2>
      {msg && (
        <p className="notice ok" role="status">
          {msg}
        </p>
      )}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <TableSkeleton rows={2} cols={4} />}
      {data && data.items.length === 0 && <Empty title="Aucun compte suspendu" />}
      {data && data.items.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Personne</th>
                <th>Depuis</th>
                <th>Jusqu’au</th>
                <th>Motif</th>
                <th>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.userId}>
                  <td>
                    <strong>{s.displayName}</strong>
                  </td>
                  <td>{fmtDateTime(s.since)}</td>
                  <td>{s.until ? fmtDateTime(s.until) : 'sans fin'}</td>
                  <td className="clip" title={s.reason}>
                    {s.reason}
                  </td>
                  <td>
                    <button type="button" className="btn" disabled={busy === s.userId} onClick={() => lift(s.userId, s.displayName)}>
                      Lever
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const CHOICES: readonly [ModerationActionKind, string, string][] = [
  ['warn', 'Avertir', 'E-mail à la personne, rien d’autre ne change'],
  ['suspend', 'Suspendre', 'Plus d’accès à l’app, message clair'],
  ['dismiss', 'Classer sans suite', 'Le signalement ne justifie rien'],
  ['delete', 'Supprimer le compte', 'Définitif : données, liens, photos'],
];

function ReportDrawer({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const api = useApi();
  const { data, error, loading, reload } = useLoad((a) => a.report(id), `report-${id}`);
  const [action, setAction] = useState<ModerationActionKind>('warn');
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('7');
  const [confirmName, setConfirmName] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  const report: AdminReportItem | undefined = data?.report;
  const target = report?.target ?? null;
  const canSend = !!target && reason.trim().length >= 3 && (action !== 'delete' || confirmName.trim().toLowerCase() === target.displayName.toLowerCase());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!target || !report) return;
    setSending(true);
    setResult(null);
    try {
      await api.act({
        action,
        targetUserId: target.id,
        reportId: report.id,
        reason: reason.trim(),
        ...(action === 'suspend' && days !== 'none' ? { days: Number(days) } : {}),
        ...(action === 'delete' ? { confirmName } : {}),
      });
      setResult({ ok: true, text: `${ACTIONS[action]} enregistré${action === 'suspend' ? 'e' : ''} dans le journal.` });
      onDone();
      reload();
    } catch (err) {
      setResult({ ok: false, text: errorText(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" ref={panel} tabIndex={-1}>
        <div className="drawer-head">
          <div>
            <h2 id="dr-title" style={{ marginBottom: 4 }}>
              Signalement n° {id}
            </h2>
            {report && (
              <span className="muted small">
                {REASONS[report.reason] ?? report.reason} · {fmtDateTime(report.createdAt)} · {report.status === 'open' ? `en attente depuis ${fmtAge(report.ageHours)}` : 'traité'}
              </span>
            )}
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Fermer
          </button>
        </div>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton h={18} w="60%" />
            <Skeleton h={60} />
            <Skeleton h={120} />
          </div>
        )}
        {data && report && (
          <>
            <dl className="facts">
              <dt>Personne signalée</dt>
              <dd>
                {target ? `${target.displayName} (signalements : ${target.openReports} ouvert${target.openReports > 1 ? 's' : ''}, ${target.totalReports} au total)` : 'Compte supprimé'}
                {target?.suspended && ` · suspendue ${target.suspendedUntil ? `jusqu’au ${fmtDateTime(target.suspendedUntil)}` : 'sans fin'}`}
              </dd>
              <dt>Signalé par</dt>
              <dd>{report.reporter?.displayName ?? 'Compte supprimé'}</dd>
              <dt>Ce qu’elle dit</dt>
              <dd>{report.details ?? <span className="muted">rien de plus</span>}</dd>
            </dl>

            <section aria-labelledby="ctx">
              <h3 id="ctx">Contexte</h3>
              {data.context.length === 0 ? (
                <p className="muted small">Pas de message précis signalé : aucune conversation n’est montrée.</p>
              ) : (
                <>
                  <p className="muted small">Le message signalé et ses voisins immédiats, rien d’autre.</p>
                  <div className="thread">
                    {data.context.map((m) => (
                      <div key={m.id} className={`msg ${m.author}${m.reported ? ' reported' : ''}`}>
                        <span className="who">
                          {m.author === 'reporter' ? report.reporter?.displayName ?? 'Qui signale' : m.author === 'target' ? target?.displayName ?? 'Signalé' : m.author === 'minimoa' ? 'Minimoa' : 'Blowy'}
                          {' · '}
                          {fmtDateTime(m.at)}
                          {m.reported && ' · signalé'}
                        </span>
                        {m.photoUrl ? <img src={m.photoUrl} alt="Photo signalée" style={{ maxWidth: '100%', borderRadius: 8 }} /> : m.kind === 'photo' ? <em className="muted">photo</em> : m.body}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {data.history.length > 0 && (
              <section aria-labelledby="hist">
                <h3 id="hist">Déjà fait sur ce compte</h3>
                <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                  {data.history.map((h) => (
                    <li key={h.id}>
                      {fmtDateTime(h.at)} · {ACTIONS[h.action]} par {h.adminEmail} : {h.reason}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {target && (
              <form onSubmit={submit} aria-labelledby="act" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 id="act">Décider</h3>
                <div className="actions-grid" role="group" aria-label="Action">
                  {CHOICES.map(([k, title, hint]) => (
                    <button key={k} type="button" className="choice" aria-pressed={action === k} onClick={() => setAction(k)}>
                      <strong>{title}</strong>
                      <span>{hint}</span>
                    </button>
                  ))}
                </div>
                {action === 'suspend' && (
                  <label className="field">
                    Durée
                    <select className="input" value={days} onChange={(e) => setDays(e.target.value)}>
                      <option value="1">1 jour</option>
                      <option value="7">7 jours</option>
                      <option value="30">30 jours</option>
                      <option value="none">Jusqu’à levée</option>
                    </select>
                  </label>
                )}
                <label className="field">
                  {action === 'warn' ? 'Message envoyé à la personne (et écrit au journal)' : 'Motif écrit au journal'}
                  <textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={500} />
                </label>
                {action === 'delete' && (
                  <label className="field">
                    Recopie le prénom « {target.displayName} » pour confirmer
                    <input className="input" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" />
                  </label>
                )}
                {result && (
                  <p className={`notice ${result.ok ? 'ok' : 'bad'}`} role="status">
                    {result.text}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className={`btn ${action === 'delete' ? 'danger' : 'primary'}`} disabled={!canSend || sending}>
                    {sending ? 'Envoi…' : CHOICES.find((c) => c[0] === action)?.[1]}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
}
