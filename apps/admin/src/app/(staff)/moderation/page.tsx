import { Badge, Card, DataTable, Field, Heading, PageHeader, Select, Button, StatusBadge, KeyValueList } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { qs, Show, when } from '../../../components/admin';
import { Mutation } from '../../../components/admin';
import { ReasonField, SelectField } from '../../../components/fields';

interface CaseRow { id: string; subjectType: string; status: string; priority: number; reasonCode: string; dueAt: string; overdue: boolean; assignedToId: string | null; createdAt: string; reportCategory: string | null; restricted: boolean }
interface Page<T> { items: T[]; nextCursor: string | null }

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string; subjectType?: string }> }) {
  const sp = await searchParams;
  const [stats, cases, appeals, reports] = await Promise.all([
    apiGet<{ open: number; overdue: number; byPriority: Record<string, number>; providerErrors24h: number }>('/v1/admin/moderation/stats'),
    apiGet<Page<CaseRow>>(`/v1/admin/moderation/cases${qs({ status: sp.status ?? 'OPEN', subjectType: sp.subjectType })}`),
    apiGet<Page<{ id: string; caseId: string; status: string; createdAt: string }>>('/v1/admin/moderation/appeals?status=OPEN'),
    apiGet<Page<{ id: string; reportedUserId: string; category: string; safetyExit: boolean; status: string; createdAt: string }>>('/v1/admin/reports?status=OPEN'),
  ]);
  return (
    <div className="bw-stack">
      <PageHeader title="Modération" eyebrow="18.4">File par priorité et ancienneté, SLA cible 24 h. L’identité du signaleur n’est jamais affichée.</PageHeader>
      <Show result={stats}>
        {(s) => (
          <Card>
            <KeyValueList items={[['Ouverts', s.open], ['Hors SLA', <Badge key="o" tone={s.overdue ? 'danger' : 'ok'}>{s.overdue}</Badge>], ['Par priorité', Object.entries(s.byPriority).map(([k, v]) => `P${k}: ${v}`).join(' · ') || '—'], ['Erreurs fournisseur 24 h', s.providerErrors24h]]} />
          </Card>
        )}
      </Show>
      <form className="bw-form bw-form--inline" method="get" aria-label="Filtrer la file">
        <Field label="Statut" htmlFor="status">
          <Select id="status" name="status" defaultValue={sp.status ?? 'OPEN'}>{['OPEN', 'ASSIGNED', 'ESCALATED', 'RESOLVED'].map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        <Field label="Type" htmlFor="subjectType">
          <Select id="subjectType" name="subjectType" defaultValue={sp.subjectType ?? ''}><option value="">Tous</option>{['MESSAGE', 'MEDIA', 'MISSION_SUBMISSION', 'BIRTH_NAME', 'PROFILE', 'ANONYMOUS_RESPONSE', 'USER'].map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        <Button type="submit" variant="secondary">Filtrer</Button>
      </form>
      <Show result={cases}>
        {(p) => (
          <DataTable caption="Dossiers" rows={p.items} rowKey={(c) => c.id} empty="File vide" columns={[
            { key: 'p', header: 'Prio.', render: (c) => `P${c.priority}` },
            { key: 't', header: 'Type', render: (c) => <a href={`/moderation/${c.id}`}>{c.subjectType}</a> },
            { key: 'r', header: 'Motif', render: (c) => `${c.reasonCode}${c.reportCategory ? ` · ${c.reportCategory}` : ''}` },
            { key: 's', header: 'Statut', render: (c) => <StatusBadge value={c.status} /> },
            { key: 'd', header: 'Échéance', render: (c) => (c.overdue ? <Badge tone="danger">dépassée · {when(c.dueAt)}</Badge> : when(c.dueAt)) },
            { key: 'x', header: 'Accès', render: (c) => (c.restricted ? <Badge tone="danger">restreint</Badge> : '') },
          ]} />
        )}
      </Show>
      <Heading level={2}>Recours ouverts</Heading>
      <Show result={appeals}>
        {(p) => (
          <DataTable caption="Recours" rows={p.items} rowKey={(a) => a.id} empty="Aucun recours ouvert" columns={[
            { key: 'c', header: 'Dossier', render: (a) => <a href={`/moderation/${a.caseId}`}>{a.caseId.slice(0, 8)}</a> },
            { key: 'd', header: 'Déposé', render: (a) => when(a.createdAt) },
            { key: 'a', header: 'Décision', render: (a) => (
              <Mutation endpoint={`/v1/admin/moderation/appeals/${a.id}/resolve`} label="Résoudre" ok="Recours résolu." revalidate="/moderation" inline>
                <SelectField id={`o-${a.id}`} name="f.outcome" label="Issue" options={[['UPHELD', 'Décision maintenue'], ['OVERTURNED', 'Décision annulée']]} />
                <ReasonField id={`r-${a.id}`} />
              </Mutation>
            ) },
          ]} />
        )}
      </Show>
      <Heading level={2}>Signalements</Heading>
      <Show result={reports}>
        {(p) => (
          <DataTable caption="Signalements" rows={p.items} rowKey={(r) => r.id} empty="Aucun signalement ouvert" columns={[
            { key: 'u', header: 'Personne signalée', render: (r) => <a href={`/users/${r.reportedUserId}`}>{r.reportedUserId.slice(0, 8)}</a> },
            { key: 'c', header: 'Catégorie', render: (r) => r.category },
            { key: 's', header: 'Sortie de sécurité', render: (r) => (r.safetyExit ? 'oui' : 'non') },
            { key: 'd', header: 'Reçu', render: (r) => when(r.createdAt) },
          ]} />
        )}
      </Show>
    </div>
  );
}
