import type { AdminVerificationView } from '@blowy/api-contract';
import { DataTable, PageHeader, StatusBadge, Text } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, qs, Show, when } from '../../../components/admin';
import { ReasonField, SelectField } from '../../../components/fields';

export default async function VerificationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const r = await apiGet<{ items: AdminVerificationView[]; nextCursor: string | null }>(`/v1/admin/verifications${qs({ status })}`);
  return (
    <div className="bw-stack">
      <PageHeader title="Vérification" eyebrow="18.5">Sessions, provenance et type de contrôle. Aucune case « vérifié » : une revue humaine produit au plus « selfie contrôlé », jamais « majorité vérifiée ».</PageHeader>
      <Show result={r}>
        {(p) => (
          <DataTable caption="Sessions de vérification" rows={p.items} rowKey={(v) => v.id} empty="Aucune session" columns={[
            { key: 'u', header: 'Utilisateur', render: (v) => <a href={`/users/${v.userId}`}>{v.userId.slice(0, 8)}</a> },
            { key: 'k', header: 'Type', render: (v) => v.kind },
            { key: 'p', header: 'Provenance', render: (v) => v.provenance },
            { key: 's', header: 'Statut', render: (v) => <StatusBadge value={v.status} /> },
            { key: 'c', header: 'Code fournisseur', render: (v) => `${v.decisionCode ?? '—'} ${v.reasonCode ?? ''}` },
            { key: 'e', header: 'Expire', render: (v) => when(v.expiresAt) },
            { key: 'a', header: 'Revue', render: (v) => (v.status === 'HUMAN_REVIEW' || v.status === 'NEEDS_RETRY' || v.status === 'PENDING' ? (
              <Mutation endpoint={`/v1/admin/verifications/${v.id}/review`} label="Statuer" ok="Revue enregistrée." revalidate="/verification" inline>
                <SelectField id={`d-${v.id}`} name="f.decision" label="Décision" options={[['APPROVE_SELFIE_REVIEW', 'Selfie contrôlé'], ['REQUEST_RETRY', 'Demander une reprise'], ['REJECT', 'Rejeter']]} />
                <ReasonField id={`r-${v.id}`} />
              </Mutation>
            ) : <Text small muted>—</Text>) },
          ]} />
        )}
      </Show>
    </div>
  );
}
