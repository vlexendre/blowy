import type { AdminRelationshipView } from '@blowy/api-contract';
import { Badge, Card, DataTable, Heading, KeyValueList, Notice, PageHeader, StatusBadge, Text, Timeline } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Mutation, Show, when } from '../../../../components/admin';
import { ReasonField } from '../../../../components/fields';

export default async function RelationshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<AdminRelationshipView>(`/v1/admin/relationships/${id}`);
  return (
    <Show result={r}>
      {(x) => (
        <div className="bw-stack">
          <PageHeader title={`Relation ${x.type}`} eyebrow="18.3">Votes privés et événements « acteur seul » jamais affichés.</PageHeader>
          <Card>
            <KeyValueList items={[
              ['Statut', <StatusBadge key="s" value={x.status} />],
              ['Branche', x.branch],
              ['XP (milli)', x.xpMilli],
              ['Niveau éligible / atteint', `${x.eligibleLevel} / ${x.reachedLevel}`],
              ['Moteur / tuning', `${x.engineVersion} · ${x.tuningVersion}`],
              ['Héritée (LEGACY)', x.legacy ? 'oui' : 'non'],
              ['Période', `${when(x.startedAt)} → ${when(x.endedAt)}`],
            ]} />
          </Card>
          <Card>
            <Heading level={2}>Diagnostics</Heading>
            {x.diagnostics.eligibleMismatch ? <Notice tone="warn">Niveau éligible incohérent avec le moteur (calculé : {x.diagnostics.computedEligibleLevel}).</Notice> : <Badge tone="ok">Cohérent avec le moteur</Badge>}
            {x.diagnostics.notes.map((n) => <Text key={n} small muted>{n}</Text>)}
            <Text small muted>La réparation recalcule uniquement le niveau éligible par le moteur ; XP, niveau atteint, branche et consentements ne sont jamais modifiés. Step-up requis.</Text>
            <Mutation endpoint={`/v1/admin/relationships/${x.id}/repair`} label="Recalculer le niveau éligible" ok="Commande corrective appliquée." revalidate={`/relationships/${x.id}`} variant="secondary">
              <input type="hidden" name="f.kind" value="RECOMPUTE_ELIGIBLE_LEVEL" />
              <ReasonField />
            </Mutation>
          </Card>
          <Heading level={2}>Participants</Heading>
          <DataTable caption="Côtés" rows={x.sides} rowKey={(s) => s.userId} columns={[
            { key: 'u', header: 'Utilisateur', render: (s) => <a href={`/users/${s.userId}`}>{s.userId.slice(0, 8)}</a> },
            { key: 'p', header: 'Pet', render: (s) => <a href={`/pets/${s.petId}`}>{s.petId.slice(0, 8)}</a> },
            { key: 'a', header: 'Actif', render: (s) => (s.active ? 'oui' : 'non') },
            { key: 'e', header: 'Exclusif', render: (s) => (s.exclusive ? 'oui' : 'non') },
          ]} />
          <Heading level={2}>Timeline (replay en lecture)</Heading>
          <Timeline items={x.timeline.map((e) => ({ key: String(e.seq), at: e.at, title: `#${e.seq} ${e.type}`, detail: `${e.visibility} · ${e.engineVersion ?? '—'} / ${e.tuningVersion ?? '—'}` }))} />
        </div>
      )}
    </Show>
  );
}
