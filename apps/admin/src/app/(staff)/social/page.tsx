import type { AdminSocialOverview } from '@blowy/api-contract';
import { Badge, DataTable, Heading, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { ReasonField } from '../../../components/fields';

export default async function SocialPage() {
  const r = await apiGet<AdminSocialOverview>('/v1/admin/social');
  return (
    <div className="bw-stack">
      <PageHeader title="Social" eyebrow="18.11">Bandes, parrainages (fraudes), réponses anonymes signalées, ligues. L’auteur d’une réponse anonyme n’est jamais révélé, même sur demande d’un compte premium.</PageHeader>
      <Show result={r}>
        {(s) => (
          <>
            <Heading level={2}>Réponses anonymes signalées</Heading>
            <DataTable caption="Réponses signalées" rows={s.reportedAnonymous} rowKey={(x) => x.id} empty="Aucune réponse signalée" columns={[
              { key: 'w', header: 'Mots', render: (x) => x.words.join(', ') },
              { key: 't', header: 'Cible', render: (x) => <a href={`/users/${x.targetUserId}`}>{x.targetDisplayName ?? x.targetUserId.slice(0, 8)}</a> },
              { key: 'd', header: 'Signalée', render: (x) => when(x.reportedAt) },
              { key: 'h', header: 'Masquée', render: (x) => (x.hidden ? 'oui' : (
                <Mutation endpoint={`/v1/admin/social/anonymous/${x.id}/hide`} label="Masquer" ok="Réponse masquée." revalidate="/social" inline><ReasonField id={`h-${x.id}`} label="Motif" /></Mutation>
              )) },
            ]} />
            <Heading level={2}>Parrainages</Heading>
            <DataTable caption="Parrainages" rows={s.referrals} rowKey={(x) => x.id} empty="Aucun parrainage" columns={[
              { key: 's', header: 'Statut', render: (x) => <StatusBadge value={x.status} /> },
              { key: 'r', header: 'Parrain', render: (x) => <a href={`/users/${x.referrerUserId}`}>{x.referrerUserId.slice(0, 8)}</a> },
              { key: 'e', header: 'Filleul', render: (x) => <a href={`/users/${x.refereeUserId}`}>{x.refereeUserId.slice(0, 8)}</a> },
              { key: 'n', header: 'Claims 24 h (parrain)', render: (x) => (x.suspicious ? <Badge tone="danger">{x.referrerClaims24h} — suspect</Badge> : x.referrerClaims24h) },
              { key: 'd', header: 'Réclamé / récompensé', render: (x) => `${when(x.claimedAt)} / ${when(x.rewardedAt)}` },
            ]} />
            <Heading level={2}>Bandes</Heading>
            <DataTable caption="Bandes" rows={s.groups} rowKey={(x) => x.id} empty="Aucune bande" columns={[
              { key: 'n', header: 'Nom', render: (x) => x.name },
              { key: 's', header: 'Statut', render: (x) => <StatusBadge value={x.status} /> },
              { key: 'm', header: 'Membres actifs', render: (x) => x.activeMembers },
            ]} />
            <Heading level={2}>Saisons et ligues</Heading>
            <DataTable caption="Ligues" rows={s.leagues} rowKey={(x) => x.id} empty="Aucune saison" columns={[
              { key: 'k', header: 'Ligue', render: (x) => `${x.kind} · palier ${x.tier} · ${x.weekKey}` },
              { key: 's', header: 'Statut', render: (x) => <StatusBadge value={x.status} /> },
              { key: 'e', header: 'Fin', render: (x) => when(x.endsAt) },
            ]} />
          </>
        )}
      </Show>
    </div>
  );
}
