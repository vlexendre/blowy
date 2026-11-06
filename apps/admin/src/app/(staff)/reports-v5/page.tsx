import type { AdminReportsV5View } from '@blowy/api-contract';
import { Badge, DataTable, Heading, Notice, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Show, when } from '../../../components/admin';

export default async function ReportsV5Page() {
  const r = await apiGet<AdminReportsV5View>('/v1/admin/reports-v5');
  return (
    <div className="bw-stack">
      <PageHeader title="Signalements V5" eyebrow="Sorties">Motifs « menace d’outing », comportement pendant la sortie, incident sur place, absences répétées — et signalements des lieux (rappel sous 1 h). Jamais l’identité du signaleur.</PageHeader>
      <Show result={r}>
        {(v) => (
          <>
            <Heading level={2}>Membres</Heading>
            {v.membersAvailable ? (
              <DataTable caption="Signalements membres" rows={v.members} rowKey={(m) => m.id} empty="Aucun signalement V5" columns={[
                { key: 'w', header: 'Reçu', render: (m) => when(m.createdAt) },
                { key: 'c', header: 'Motif', render: (m) => m.category },
                { key: 's', header: 'Statut', render: (m) => <StatusBadge value={m.status} /> },
                { key: 'x', header: 'Sortie de sécurité', render: (m) => (m.safetyExit ? <Badge tone="warn">oui</Badge> : 'non') },
              ]} />
            ) : <Notice tone="warn">Service de signalements non branché.</Notice>}
            <Heading level={2}>Lieux</Heading>
            <DataTable caption="Signalements des lieux" rows={v.venues} rowKey={(i) => i.id} empty="Aucun signalement de lieu" columns={[
              { key: 'w', header: 'Reçu', render: (i) => when(i.createdAt) },
              { key: 'l', header: 'Lieu', render: (i) => <a href={`/venues/${i.venueId}`}>{i.venueName}</a> },
              { key: 'p', header: 'Prénom', render: (i) => <a href={`/outings/${i.outingId}`}>{i.firstName}</a> },
              { key: 'm', header: 'Motif', render: (i) => i.motive },
              { key: 'n', header: 'Note', render: (i) => i.note },
              { key: 'd', header: 'Échéance', render: (i) => (i.overdue ? <Badge tone="danger">dépassée</Badge> : when(i.dueAt)) },
            ]} />
          </>
        )}
      </Show>
    </div>
  );
}
