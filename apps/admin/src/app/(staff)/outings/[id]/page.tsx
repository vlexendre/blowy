import type { AdminOutingDetail } from '@blowy/api-contract';
import { Badge, Card, DataTable, Heading, KeyValueList, PageHeader, StatusBadge, Timeline } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Mutation, Show, when } from '../../../../components/admin';
import { ReasonField, SelectField } from '../../../../components/fields';

const ACTIVE = new Set(['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN']);

export default async function OutingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<AdminOutingDetail>(`/v1/admin/outings/${id}`);
  return (
    <div className="bw-stack">
      <Show result={r}>
        {(o) => (
          <>
            <PageHeader title={`Sortie du ${when(o.startsAt)}`} eyebrow={`${o.venue.name} · ${o.neighborhood} · ${o.weekKey}`}>
              <StatusBadge value={o.status} /> {o.confirmed} confirmé(s) sur {o.capacity}{o.cancelReason ? ` · annulée (${o.cancelReason})` : ''}
            </PageHeader>
            <Heading level={2}>Effectif</Heading>
            <DataTable caption="Places" rows={o.seats} rowKey={(s) => s.seatId} columns={[
              { key: 'p', header: 'Prénom', render: (s) => s.firstName },
              { key: 's', header: 'Place', render: (s) => <StatusBadge value={s.status} /> },
              { key: 'c', header: 'Check-in', render: (s) => (s.checkedIn ? <Badge tone="ok">arrivé·e</Badge> : '—') },
              { key: 'f', header: 'Fiabilité', render: (s) => s.reliability },
              { key: 'k', header: 'Je connais / contestation', render: (s) => [s.knowsSomeone, s.dispute].filter(Boolean).join(' · ') || '—' },
              ...(o.seats.some((s) => s.refundState !== undefined) ? [{ key: 'r', header: 'Remboursement', render: (s: (typeof o.seats)[number]) => s.refundState ?? '—' }] : []),
              { key: 'x', header: 'Retrait', render: (s) => (ACTIVE.has(s.status) && o.status !== 'DONE' && o.status !== 'CANCELLED' ? (
                <Mutation endpoint={`/v1/admin/seats/${s.seatId}/remove`} label="Retirer (step-up)" ok="Place retirée et remboursée." revalidate={`/outings/${o.id}`} variant="danger" inline confirm="Retirer cette place ? Elle est remboursée, sans effet de fiabilité.">
                  <ReasonField id={`rm-${s.seatId}`} label="Motif" />
                </Mutation>
              ) : '') },
            ]} />
            <Card>
              <Heading level={3}>Chronologie</Heading>
              <Timeline items={o.timeline.map((t) => ({ key: t.key, at: when(t.at), title: t.label }))} />
            </Card>
            {o.composition ? (
              <Card>
                <Heading level={3}>Rapport de composition (agrégats)</Heading>
                <KeyValueList items={[['Exécution', `${o.composition.kind} · ${o.composition.algoVersion} · ${o.composition.tuningVersion}`], ...Object.entries(o.composition.aggregates).map(([k, v]): [string, string] => [k, String(v)])]} />
              </Card>
            ) : null}
            {o.status !== 'DONE' && o.status !== 'CANCELLED' ? (
              <Card>
                <Heading level={3}>Annuler la sortie (step-up)</Heading>
                <p className="bw-small">Places actives remboursées (carte, ou 1ʳᵉ sortie qui reste offerte), aucun effet de fiabilité, chat fermé.</p>
                <Mutation endpoint={`/v1/admin/outings/${o.id}/cancel`} label="Annuler la sortie" ok="Sortie annulée, remboursements lancés." revalidate={`/outings/${o.id}`} variant="danger" confirm="Annuler cette sortie pour tout le groupe ?">
                  <SelectField id="kind" name="f.kind" label="Motif d’annulation" options={[['STAFF', 'Décision Blowy'], ['VENUE_UNAVAILABLE', 'Lieu indisponible']]} />
                  <ReasonField id="cr" />
                </Mutation>
              </Card>
            ) : null}
          </>
        )}
      </Show>
    </div>
  );
}
