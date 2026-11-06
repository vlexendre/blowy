import type { AdminOutingRow } from '@blowy/api-contract';
import { DataTable, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { qs, Show, when } from '../../../components/admin';

export default async function OutingsPage({ searchParams }: { searchParams: Promise<{ status?: string; weekKey?: string }> }) {
  const sp = await searchParams;
  const r = await apiGet<AdminOutingRow[]>(`/v1/admin/outings${qs({ status: sp.status, weekKey: sp.weekKey })}`);
  return (
    <div className="bw-stack">
      <PageHeader title="Sorties" eyebrow="V5 · §10.1">État, effectif et lieu. Jamais votes, préférences ni garantie individuelle.</PageHeader>
      <form className="bw-row" method="get">
        <select name="status" defaultValue={sp.status ?? ''} className="bw-select" aria-label="Statut">
          <option value="">Tous les statuts</option>
          {['PROPOSED', 'FORMING', 'CONFIRMED', 'CHECKIN_OPEN', 'DONE', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input name="weekKey" defaultValue={sp.weekKey ?? ''} placeholder="2026-W46" className="bw-input" aria-label="Semaine" />
        <button type="submit" className="bw-btn bw-btn--secondary bw-btn--sm">Filtrer</button>
      </form>
      <Show result={r}>
        {(rows) => (
          <DataTable caption="Sorties" rows={rows} rowKey={(o) => o.id} empty="Aucune sortie" columns={[
            { key: 'd', header: 'Début', render: (o) => <a href={`/outings/${o.id}`}>{when(o.startsAt)}</a> },
            { key: 'v', header: 'Lieu', render: (o) => `${o.venue.name} · ${o.neighborhood}` },
            { key: 'a', header: 'Activité', render: (o) => o.activity },
            { key: 's', header: 'Statut', render: (o) => <StatusBadge value={o.status} /> },
            { key: 'e', header: 'Effectif', render: (o) => `${o.confirmed} confirmé(s) · ${o.invited} invité(s) / ${o.capacity}` },
            { key: 'c', header: 'Annulation', render: (o) => o.cancelReason ?? '' },
          ]} />
        )}
      </Show>
    </div>
  );
}
