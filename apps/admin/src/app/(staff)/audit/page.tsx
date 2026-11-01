import type { AdminAuditRow, PageOf } from '@blowy/api-contract';
import { Button, DataTable, Field, Input, PageHeader, Pagination } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { qs, Show, when } from '../../../components/admin';

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; targetId?: string; cursor?: string }> }) {
  const sp = await searchParams;
  const r = await apiGet<PageOf<AdminAuditRow>>(`/v1/admin/audit${qs({ action: sp.action, targetId: sp.targetId, cursor: sp.cursor })}`);
  return (
    <div className="bw-stack">
      <PageHeader title="Audit" eyebrow="Journal append-only">Toute mutation et lecture sensible du back-office.</PageHeader>
      <form method="get" className="bw-form bw-form--inline" role="search">
        <Field label="Action (préfixe)" htmlFor="action"><Input id="action" name="action" defaultValue={sp.action} /></Field>
        <Field label="Cible (id)" htmlFor="targetId"><Input id="targetId" name="targetId" defaultValue={sp.targetId} /></Field>
        <Button type="submit" variant="secondary">Filtrer</Button>
      </form>
      <Show result={r}>
        {(p) => (
          <>
            <DataTable caption="Entrées d’audit" rows={p.items} rowKey={(a) => a.id} empty="Aucune entrée" columns={[
              { key: 'd', header: 'Date', render: (a) => when(a.at) },
              { key: 'a', header: 'Action', render: (a) => <code className="bw-code">{a.action}</code> },
              { key: 'r', header: 'Acteur', render: (a) => `${a.actorRole ?? 'système'} ${a.actorUserId ? a.actorUserId.slice(0, 8) : ''}` },
              { key: 't', header: 'Cible', render: (a) => `${a.targetType} ${a.targetId ? a.targetId.slice(0, 8) : ''}` },
              { key: 'm', header: 'Motif', render: (a) => a.reason ?? '' },
            ]} />
            <Pagination nextHref={p.nextCursor ? `/audit${qs({ action: sp.action, targetId: sp.targetId, cursor: p.nextCursor })}` : null} />
          </>
        )}
      </Show>
    </div>
  );
}
