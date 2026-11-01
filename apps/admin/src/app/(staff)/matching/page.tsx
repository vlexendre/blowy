import type { MatchingDiagnostics } from '@blowy/api-contract';
import { Card, DataTable, Heading, KeyValueList, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Show, when } from '../../../components/admin';

export default async function MatchingPage() {
  const r = await apiGet<MatchingDiagnostics>('/v1/admin/matching');
  return (
    <div className="bw-stack">
      <PageHeader title="Matching" eyebrow="18.9">Zones, densité, candidats admissibles, exposition et lots. Aucune préférence secrète n’est affichée et aucun bouton ne crée de relation sans accords.</PageHeader>
      <Show result={r}>
        {(d) => (
          <>
            {d.zones.map((z) => (
              <Card key={z.code}>
                <Heading level={2}>{z.name} <code className="bw-code">{z.code}</code></Heading>
                <KeyValueList items={[
                  ['Active', z.active ? 'oui' : 'non'],
                  ['Comptes actifs', z.users],
                  ['Candidats admissibles', z.eligible],
                  ['Causes d’exclusion (non exclusives)', Object.entries(z.exclusions).map(([k, v]) => `${k}: ${v}`).join(' · ')],
                  ['Exposition 14 j', z.exposureHistogram.map((b) => `${b.bucket}: ${b.users}`).join(' · ') || '—'],
                ]} />
                <DataTable caption={`Lots ${z.code}`} rows={z.lastBatches} rowKey={(b) => b.id} empty="Aucun lot" columns={[
                  { key: 'd', header: 'Date locale', render: (b) => `${b.localDate} · ${b.kind}` },
                  { key: 's', header: 'Statut', render: (b) => <StatusBadge value={b.status} /> },
                  { key: 'p', header: 'Propositions', render: (b) => b.proposals },
                  { key: 'v', header: 'Versions', render: (b) => `${b.algoVersion} / ${b.tuningVersion}` },
                  { key: 't', header: 'Fin', render: (b) => when(b.finishedAt) },
                ]} />
              </Card>
            ))}
          </>
        )}
      </Show>
    </div>
  );
}
