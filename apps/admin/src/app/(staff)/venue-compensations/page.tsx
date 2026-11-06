import type { AdminVenueCompensationView } from '@blowy/api-contract';
import { Badge, DataTable, Heading, PageHeader } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, qs, Show, when } from '../../../components/admin';
import { ReasonField } from '../../../components/fields';

const eur = (c: number) => `${(c / 100).toFixed(2).replace('.', ',')} €`;

export default async function CompensationsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const r = await apiGet<AdminVenueCompensationView>(`/v1/admin/venue-compensations${qs({ period })}`);
  return (
    <div className="bw-stack">
      <PageHeader title="Compensations des lieux" eyebrow="V5 · §6.5">Place non honorée après la confirmation : 4,99 € si payée, 3 € si offerte. Relevé mensuel ; contre-passation sous step-up (finance).</PageHeader>
      <form method="get" className="bw-row">
        <input name="period" defaultValue={period ?? ''} placeholder="2026-11" className="bw-input" aria-label="Période" />
        <button type="submit" className="bw-btn bw-btn--secondary bw-btn--sm">Afficher</button>
      </form>
      <Show result={r}>
        {(v) => (
          <>
            <Heading level={2}>Relevé {v.period}</Heading>
            <DataTable caption="Totaux par lieu" rows={v.totals} rowKey={(t) => t.venueId} empty="Aucune compensation ce mois-ci" columns={[
              { key: 'l', header: 'Lieu', render: (t) => <a href={`/venues/${t.venueId}`}>{t.venueName}</a> },
              { key: 'n', header: 'Écritures', render: (t) => t.entries },
              { key: 't', header: 'Total', render: (t) => eur(t.totalCents) },
            ]} />
            <DataTable caption="Écritures" rows={v.entries} rowKey={(e) => `${e.seatId}-${e.cause}`} columns={[
              { key: 'w', header: 'Date', render: (e) => when(e.at) },
              { key: 'l', header: 'Lieu', render: (e) => e.venueName },
              { key: 'c', header: 'Cause', render: (e) => e.cause },
              { key: 'b', header: 'Base', render: (e) => (e.basis === 'SEAT_PRICE' ? 'place payée' : 'place offerte') },
              { key: 'a', header: 'Montant', render: (e) => eur(e.amountCents) },
              { key: 'x', header: '', render: (e) => (e.cause !== 'REVERSAL' && !e.reversed ? (
                <Mutation endpoint={`/v1/admin/venue-compensations/${e.seatId}/reverse`} label="Contre-passer (step-up)" ok="Compensation contre-passée." revalidate="/venue-compensations" inline>
                  <ReasonField id={`r-${e.seatId}`} label="Motif" />
                </Mutation>
              ) : e.reversed ? <Badge>contre-passée</Badge> : '') },
            ]} />
          </>
        )}
      </Show>
    </div>
  );
}
