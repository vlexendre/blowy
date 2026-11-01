import type { DeadOutboxRow, OpsStatus } from '@blowy/api-contract';
import { Badge, Card, DataTable, Heading, KeyValueList, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { ReasonField } from '../../../components/fields';

export default async function OpsPage() {
  const [st, dead, exportsR, deletions] = await Promise.all([
    apiGet<OpsStatus>('/v1/admin/ops'),
    apiGet<DeadOutboxRow[]>('/v1/admin/ops/outbox/dead'),
    apiGet<{ items: { id: string; userId: string; status: string; requestedAt: string; readyAt: string | null }[] }>('/v1/admin/exports'),
    apiGet<{ items: { id: string; userId: string; status: string; requestedAt: string; completedAt: string | null }[] }>('/v1/admin/deletions'),
  ]);
  return (
    <div className="bw-stack">
      <PageHeader title="Exploitation" eyebrow="18.13">État API/DB/Redis/outbox, jobs, DLQ, versions et flags (lecture seule), suivi exports/suppressions. Le redrive revérifie l’état actuel.</PageHeader>
      <Show result={st}>
        {(s) => (
          <Card>
            <KeyValueList items={[
              ['API', `${s.api.version} · ${s.api.env} · ${s.api.node} · uptime ${s.api.uptimeSeconds} s`],
              ['Moteur / tuning', `${s.api.engineVersion} · ${s.api.tuningVersion}`],
              ['Base', s.database.ok ? <Badge key="d" tone="ok">ok · {s.database.latencyMs} ms</Badge> : <Badge key="d" tone="danger">indisponible</Badge>],
              ['Redis', s.redis.configured ? (s.redis.ok ? <Badge key="r" tone="ok">prêt</Badge> : <Badge key="r" tone="warn">non prêt</Badge>) : 'non configuré'],
              ['Outbox', `${s.outbox.pending} en attente · ${s.outbox.dead} en DLQ (≥ ${s.outbox.maxAttempts} essais) · plus ancien ${s.outbox.oldestPendingAgeSeconds ?? 0} s`],
            ]} />
            <Heading level={3}>Jobs</Heading>
            <DataTable caption="Jobs" rows={s.jobs} rowKey={(j) => j.name} empty="Aucune exécution enregistrée" columns={[
              { key: 'n', header: 'Job', render: (j) => j.name },
              { key: 's', header: 'Dernier statut', render: (j) => <StatusBadge value={j.lastStatus} /> },
              { key: 'd', header: 'Dernier départ', render: (j) => when(j.lastStartedAt) },
              { key: 'f', header: 'Échecs 24 h', render: (j) => j.failed24h },
            ]} />
            <Heading level={3}>Flags et sélection d’adaptateurs (lecture seule)</Heading>
            <DataTable caption="Flags" rows={s.featureFlags} rowKey={(f) => f.key} columns={[
              { key: 'k', header: 'Clé', render: (f) => <code className="bw-code">{f.key}</code> },
              { key: 'v', header: 'Valeur', render: (f) => String(f.value) },
              { key: 'n', header: 'Note', render: (f) => f.note },
            ]} />
          </Card>
        )}
      </Show>
      <Heading level={2}>DLQ outbox</Heading>
      <Show result={dead}>
        {(rows) => (
          <DataTable caption="Événements en DLQ" rows={rows} rowKey={(r) => r.id} empty="DLQ vide" columns={[
            { key: 't', header: 'Topic', render: (r) => r.topic },
            { key: 'a', header: 'Essais', render: (r) => r.attempts },
            { key: 'e', header: 'Erreur', render: (r) => r.lastError ?? '' },
            { key: 'd', header: 'Créé', render: (r) => when(r.createdAt) },
            { key: 'x', header: 'Redrive', render: (r) => (r.redrivable ? (
              <Mutation endpoint={`/v1/admin/ops/outbox/${r.id}/redrive`} label="Relancer" ok="Remis en file." revalidate="/ops" inline><ReasonField id={`r-${r.id}`} label="Motif" /></Mutation>
            ) : <Badge tone="warn">bloqué : {r.blockedReason}</Badge>) },
          ]} />
        )}
      </Show>
      <Heading level={2}>Exports et suppressions</Heading>
      <Show result={exportsR}>
        {(p) => (
          <DataTable caption="Exports" rows={p.items} rowKey={(e) => e.id} empty="Aucun export" columns={[
            { key: 'u', header: 'Utilisateur', render: (e) => <a href={`/users/${e.userId}`}>{e.userId.slice(0, 8)}</a> },
            { key: 's', header: 'Statut', render: (e) => <StatusBadge value={e.status} /> },
            { key: 'd', header: 'Demandé / prêt', render: (e) => `${when(e.requestedAt)} / ${when(e.readyAt)}` },
          ]} />
        )}
      </Show>
      <Show result={deletions}>
        {(p) => (
          <DataTable caption="Suppressions" rows={p.items} rowKey={(e) => e.id} empty="Aucune demande de suppression" columns={[
            { key: 'u', header: 'Utilisateur', render: (e) => e.userId.slice(0, 8) },
            { key: 's', header: 'Statut', render: (e) => <StatusBadge value={e.status} /> },
            { key: 'd', header: 'Demandé / terminé', render: (e) => `${when(e.requestedAt)} / ${when(e.completedAt)}` },
          ]} />
        )}
      </Show>
    </div>
  );
}
