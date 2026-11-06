import type { AdminKnowsSomeoneRow } from '@blowy/api-contract';
import { Badge, DataTable, PageHeader } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { ReasonField, SelectField } from '../../../components/fields';

export default async function KnowsSomeonePage() {
  const r = await apiGet<AdminKnowsSomeoneRow[]>('/v1/admin/knows-someone');
  return (
    <div className="bw-stack">
      <PageHeader title="« Je connais quelqu’un ici »" eyebrow="V5 · §2.7">Demandes en examen (réponse sous 1 h). Accepté : la personne est retirée sans pénalité, remboursée, prioritaire. Refusé : la place reste.</PageHeader>
      <Show result={r}>
        {(rows) => (
          <DataTable caption="Demandes" rows={rows} rowKey={(x) => x.seatId} empty="Aucune demande en examen" columns={[
            { key: 'w', header: 'Reçue', render: (x) => when(x.createdAt) },
            { key: 'd', header: 'Échéance', render: (x) => (x.overdue ? <Badge tone="danger">dépassée</Badge> : when(x.dueAt)) },
            { key: 's', header: 'Sortie', render: (x) => <a href={`/outings/${x.outingId}`}>{when(x.startsAt)}</a> },
            { key: 'p', header: 'Demande de', render: (x) => x.firstName },
            { key: 't', header: 'Connaît', render: (x) => x.targetFirstName },
            { key: 'a', header: 'Décision', render: (x) => (
              <Mutation endpoint={`/v1/admin/knows-someone/${x.seatId}/decision`} label="Décider" ok="Décision enregistrée." revalidate="/knows-someone" inline>
                <SelectField id={`a-${x.seatId}`} name="f.accept:bool" label="Décision" options={[['true', 'Accepter (retrait sans pénalité)'], ['false', 'Refuser (place gardée)']]} />
                <ReasonField id={`r-${x.seatId}`} label="Motif" />
              </Mutation>
            ) },
          ]} />
        )}
      </Show>
    </div>
  );
}
