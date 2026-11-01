import type { AdminAiSummary } from '@blowy/api-contract';
import { Card, DataTable, Heading, KeyValueList, Notice, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';

interface Job { id: string; kind: string; status: string; provider: string; model: string | null; promptVersion: string | null; attempts: number; lastErrorCode: string | null; durationMs: number | null; costMicros: number | null; createdAt: string }

export default async function AiPage() {
  const [sum, jobs] = await Promise.all([apiGet<AdminAiSummary>('/v1/admin/ai'), apiGet<{ items: Job[] }>('/v1/admin/ai/jobs?status=FAILED')]);
  return (
    <div className="bw-stack">
      <PageHeader title="IA" eyebrow="18.12">Modèles et versions de prompt observés, latence, erreurs, coûts estimés. Aucun contenu privé ni secret affiché. Le réessai revérifie l’autorisation actuelle.</PageHeader>
      <Show result={sum}>
        {(s) => (
          <Card>
            <KeyValueList items={[['Fenêtre', `${s.windowHours} h`], ['Par statut', Object.entries(s.byStatus).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'aucune tâche'], ['Erreurs', s.errors.map((e) => `${e.code}: ${e.count}`).join(' · ') || '—']]} />
            {!s.budgets.configured ? <Notice tone="info">{s.budgets.note}</Notice> : null}
            <Heading level={3}>Par type</Heading>
            <DataTable caption="Tâches par type" rows={s.byKind} rowKey={(k) => k.kind} empty="Aucune tâche IA dans la fenêtre" columns={[
              { key: 'k', header: 'Type', render: (k) => k.kind },
              { key: 'n', header: 'Tâches / échecs', render: (k) => `${k.count} / ${k.failed}` },
              { key: 'l', header: 'Latence moy.', render: (k) => (k.avgDurationMs === null ? '—' : `${k.avgDurationMs} ms`) },
              { key: 'c', header: 'Coût estimé (µ$)', render: (k) => k.costMicros },
            ]} />
            <Heading level={3}>Versions de prompt</Heading>
            <DataTable caption="Versions" rows={s.promptVersions} rowKey={(v) => `${v.kind}${v.provider}${v.model}${v.promptVersion}`} empty="—" columns={[
              { key: 'k', header: 'Type', render: (v) => v.kind },
              { key: 'p', header: 'Fournisseur / modèle', render: (v) => `${v.provider} · ${v.model ?? '—'}` },
              { key: 'v', header: 'Prompt', render: (v) => v.promptVersion ?? '—' },
              { key: 'n', header: 'Tâches', render: (v) => v.jobs },
            ]} />
          </Card>
        )}
      </Show>
      <Heading level={2}>Tâches en échec</Heading>
      <Show result={jobs}>
        {(p) => (
          <DataTable caption="Tâches en échec" rows={p.items} rowKey={(j) => j.id} empty="Aucune tâche en échec" columns={[
            { key: 'k', header: 'Type', render: (j) => j.kind },
            { key: 's', header: 'Statut', render: (j) => <StatusBadge value={j.status} /> },
            { key: 'e', header: 'Erreur', render: (j) => `${j.lastErrorCode ?? '—'} (${j.attempts} essais)` },
            { key: 'd', header: 'Créée', render: (j) => when(j.createdAt) },
            { key: 'a', header: '', render: (j) => (
              <div className="bw-row">
                <Mutation endpoint={`/v1/admin/ai/jobs/${j.id}/retry`} label="Réessayer" ok="Réessai planifié." revalidate="/ai" inline />
                <Mutation endpoint={`/v1/admin/ai/jobs/${j.id}/cancel`} label="Annuler" ok="Tâche annulée." revalidate="/ai" variant="secondary" inline />
              </div>
            ) },
          ]} />
        )}
      </Show>
    </div>
  );
}
