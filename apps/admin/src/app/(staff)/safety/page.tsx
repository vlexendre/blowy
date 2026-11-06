import type { AdminSafetyAlertRow } from '@blowy/api-contract';
import { Badge, DataTable, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, qs, Show, when } from '../../../components/admin';
import { ReasonField } from '../../../components/fields';

export default async function SafetyPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const r = await apiGet<{ items: AdminSafetyAlertRow[] }>(`/v1/admin/safety/alerts${qs({ status })}`);
  return (
    <div className="bw-stack">
      <PageHeader title="Besoin d’aide" eyebrow="V5 · priorité 1 · échéance 1 h">File temps réel. La position éventuellement jointe n’est lisible que par trust_lead, avec une justification écrite, auditée ; elle est purgée 72 h après la prise en charge.</PageHeader>
      <Show result={r}>
        {(p) => (
          <DataTable caption="Alertes" rows={p.items} rowKey={(a) => a.id} empty="Aucune alerte" columns={[
            { key: 'w', header: 'Reçue', render: (a) => when(a.createdAt) },
            { key: 's', header: 'Statut', render: (a) => <StatusBadge value={a.status} /> },
            { key: 'd', header: 'Échéance', render: (a) => (a.overdue && a.status === 'OPEN' ? <Badge tone="danger">dépassée</Badge> : when(a.slaDueAt)) },
            { key: 'k', header: 'Sujet', render: (a) => (a.subjectKind === 'OUTING' ? <a href={`/outings/${a.subjectId}`}>sortie</a> : 'rendez-vous à deux') },
            { key: 'p', header: 'Position jointe', render: (a) => (a.positionAttached ? <a href={`/safety/${a.id}`}>oui — lecture motivée</a> : 'non') },
            { key: 'h', header: 'Prise en charge', render: (a) => (a.status !== 'HANDLED' ? (
              <Mutation endpoint={`/v1/admin/safety/alerts/${a.id}/handle`} label="Prendre en charge" ok="Alerte prise en charge." revalidate="/safety" inline>
                <ReasonField id={`h-${a.id}`} label="Motif" />
              </Mutation>
            ) : '') },
          ]} />
        )}
      </Show>
    </div>
  );
}
