import type { AdminAttendanceView } from '@blowy/api-contract';
import { Badge, DataTable, Heading, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { ReasonField, SelectField } from '../../../components/fields';

export default async function AttendancePage() {
  const r = await apiGet<AdminAttendanceView>('/v1/admin/attendance');
  return (
    <div className="bw-stack">
      <PageHeader title="Présences, absences et pauses" eyebrow="V5 · §2.15">Absence = no-show ou annulation après la confirmation. Deux absences en 90 j → pause 7 j. Correction et levée de pause sous step-up, motivées et auditées.</PageHeader>
      <Show result={r}>
        {(v) => (
          <>
            <Heading level={2}>Absences (90 derniers jours)</Heading>
            <DataTable caption="Absences" rows={v.absences} rowKey={(a) => a.seatId} empty="Aucune absence" columns={[
              { key: 'p', header: 'Prénom', render: (a) => a.firstName },
              { key: 's', header: 'Sortie', render: (a) => <a href={`/outings/${a.outingId}`}>{when(a.startsAt)}</a> },
              { key: 'k', header: 'Type', render: (a) => (a.kind === 'NO_SHOW' ? 'Absence' : 'Annulation tardive') },
              { key: 'd', header: 'Contestation', render: (a) => (a.dispute ? <><StatusBadge value={a.dispute.status} /> <span className="bw-small">{a.dispute.note}</span></> : '—') },
              { key: 'x', header: 'Décision', render: (a) => (a.dispute?.status === 'OPEN' ? (
                <Mutation endpoint={`/v1/admin/attendance/disputes/${a.dispute.id}/decision`} label="Trancher (step-up)" ok="Contestation tranchée." revalidate="/attendance" inline>
                  <SelectField id={`a-${a.dispute.id}`} name="f.accept:bool" label="Décision" options={[['true', 'Accepter : absence retirée'], ['false', 'Refuser']]} />
                  <ReasonField id={`r-${a.dispute.id}`} label="Motif" />
                </Mutation>
              ) : '') },
            ]} />
            <Heading level={2}>Pauses de fiabilité en cours</Heading>
            <DataTable caption="Pauses" rows={v.pauses} rowKey={(p) => p.userId} empty="Aucune pause en cours" columns={[
              { key: 'p', header: 'Prénom', render: (p) => p.firstName },
              { key: 'u', header: 'Jusqu’au', render: (p) => <Badge tone="warn">{when(p.pausedUntil)}</Badge> },
              { key: 'f', header: 'Fiabilité', render: (p) => `venu·e à ${p.attended} sur ${p.attended + p.absences}` },
              { key: 'x', header: 'Lever', render: (p) => (
                <Mutation endpoint={`/v1/admin/reliability/${p.userId}/lift-pause`} label="Lever la pause (step-up)" ok="Pause levée." revalidate="/attendance" inline>
                  <ReasonField id={`l-${p.userId}`} label="Motif" />
                </Mutation>
              ) },
            ]} />
          </>
        )}
      </Show>
    </div>
  );
}
