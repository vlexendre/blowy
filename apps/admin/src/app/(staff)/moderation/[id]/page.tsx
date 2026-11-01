import type { AdminCaseContext, AdminCaseView, StaffMe } from '@blowy/api-contract';
import { Badge, Button, Card, Field, Heading, Input, KeyValueList, Notice, PageHeader, StatusBadge, Text, Timeline } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Mutation, qs, Show, when } from '../../../../components/admin';
import { ReasonField, SelectField } from '../../../../components/fields';

export default async function CasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ justification?: string }> }) {
  const { id } = await params;
  const { justification } = await searchParams;
  const r = await apiGet<AdminCaseView & { context: AdminCaseContext }>(`/v1/admin/moderation/cases/${id}${qs({ justification })}`);
  const me = await apiGet<StaffMe>('/v1/admin/auth/me');
  const needsJustification = !r.ok && r.reason === 'JUSTIFICATION_REQUIRED';
  return (
    <div className="bw-stack">
      <PageHeader title="Dossier de modération" eyebrow="18.4">Contexte strictement utile ; chaque consultation est auditée.</PageHeader>
      {needsJustification ? (
        <Card>
          <Notice tone="warn">Preuve privée : une justification (10 caractères minimum) est exigée et sera auditée.</Notice>
          <form method="get" className="bw-form">
            <Field label="Justification d’accès" htmlFor="justification"><Input id="justification" name="justification" minLength={10} required /></Field>
            <Button type="submit" variant="ink">Accéder au contexte</Button>
          </form>
        </Card>
      ) : (
        <Show result={r}>
          {(c) => (
            <>
              <Card>
                <KeyValueList items={[
                  ['Sujet', `${c.subjectType} · ${c.subjectId.slice(0, 8)}`],
                  ['Statut', <StatusBadge key="s" value={c.status} />],
                  ['Priorité / échéance', <span key="d">P{c.priority} · {when(c.dueAt)} {c.overdue ? <Badge tone="danger">hors SLA</Badge> : null}</span>],
                  ['Motif', c.reasonCode],
                  ['Catégorie signalée', c.reportCategory],
                  ['Signaux automatiques', Object.entries(c.automaticSignals).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'],
                ]} />
              </Card>
              <Card>
                <Heading level={2}>Contexte</Heading>
                {c.context.restricted ? (
                  <Notice tone="error">Dossier à accès spécialisé : aucun contenu dans les outils ordinaires.</Notice>
                ) : (
                  <>
                    <Text>{c.context.subject?.text ?? '(contenu non textuel ou purgé)'}</Text>
                    <Timeline items={c.context.neighbours.map((n, i) => ({ key: String(i), at: n.createdAt, title: n.author, detail: n.text ?? '' }))} />
                  </>
                )}
              </Card>
              <Card>
                <Heading level={2}>Décision humaine</Heading>
                <Text small muted>Les catégories automatiques ci-dessus sont distinctes de la décision humaine. Correction append-only.</Text>
                <Mutation endpoint={`/v1/admin/moderation/cases/${c.id}/decisions`} label="Décider" ok="Décision enregistrée." revalidate={`/moderation/${c.id}`}>
                  <SelectField id="action" name="f.action" label="Décision" options={[['ALLOW', 'Autoriser'], ['WARN', 'Avertissement'], ['QUARANTINE', 'Quarantaine'], ['REJECT', 'Rejeter'], ['WITHDRAW', 'Retirer un contenu publié']]} />
                  <ReasonField />
                </Mutation>
                <Mutation endpoint={`/v1/admin/moderation/cases/${c.id}/assign`} label={c.assignedToId ? 'Libérer le dossier' : 'M’assigner'} ok="Assignation mise à jour." revalidate={`/moderation/${c.id}`} variant="secondary" inline>
                  <input type="hidden" name="f.assigneeId:nullable" value={c.assignedToId ? '' : me.ok ? me.data.userId : ''} />
                </Mutation>
              </Card>
              <Heading level={2}>Historique des décisions</Heading>
              <Timeline items={c.decisions.map((d) => ({ key: d.id, at: d.createdAt, title: `${d.action} (${d.source})`, detail: `${d.reasonCode} · ${d.policyVersion}${d.supersedesId ? ' · corrige une décision' : ''}` }))} />
            </>
          )}
        </Show>
      )}
    </div>
  );
}
