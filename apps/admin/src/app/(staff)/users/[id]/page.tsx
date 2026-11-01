import type { AdminUserDetail } from '@blowy/api-contract';
import { Card, DataTable, Heading, KeyValueList, PageHeader, StatusBadge, Text, Timeline } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Mutation, Show, when } from '../../../../components/admin';
import { ReasonField, SelectField } from '../../../../components/fields';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<AdminUserDetail>(`/v1/admin/users/${id}`);
  return (
    <Show result={r}>
      {(u) => (
        <div className="bw-stack">
          <PageHeader title={u.displayName ?? 'Utilisateur'} eyebrow="Fiche utilisateur">Consultation tracée dans l’audit. Aucun vote, message ni selfie n’est affiché ici.</PageHeader>
          <Card>
            <KeyValueList
              items={[
                ['Identifiant', <code key="i" className="bw-code">{u.id}</code>],
                ['Statut', <StatusBadge key="s" value={u.status} />],
                ['Email', u.emailMasked],
                ['Âge', u.ageYears],
                ['Zone / fuseau', `${u.zone ?? '—'} · ${u.timezone}`],
                ['Fiabilité', u.reliability],
                ['Intention (privée)', u.intention],
                ['Photos', u.photoPreference],
                ['Pet', u.pet ? <a key="p" href={`/pets/${u.pet.id}`}>{u.pet.name} ({u.pet.species})</a> : null],
                ['Créé / actif', `${when(u.createdAt)} / ${when(u.lastActiveAt)}`],
              ]}
            />
          </Card>
          <Card>
            <Heading level={2}>Actions sur le compte</Heading>
            <Text muted small>Avertir/restreindre : trust_lead ou admin. Suspendre/bannir/rétablir : step-up MFA. Motif obligatoire.</Text>
            <Mutation endpoint={`/v1/admin/users/${u.id}/actions`} label="Appliquer" ok="Action appliquée." revalidate={`/users/${u.id}`} variant="danger" confirm="Confirmer cette action sur le compte ?">
              <SelectField id="kind" name="f.kind" label="Action" options={[['WARN', 'Avertir'], ['RESTRICT', 'Restreindre'], ['SUSPEND', 'Suspendre'], ['BAN', 'Bannir'], ['RESTORE', 'Rétablir']]} />
              <ReasonField />
            </Mutation>
          </Card>
          <Heading level={2}>Relations</Heading>
          <DataTable caption="Relations" rows={u.relationships} rowKey={(x) => x.id} columns={[
            { key: 'i', header: 'Relation', render: (x) => <a href={`/relationships/${x.id}`}>{x.type}</a> },
            { key: 's', header: 'Statut', render: (x) => <StatusBadge value={x.status} /> },
            { key: 'b', header: 'Branche', render: (x) => x.branch },
            { key: 'l', header: 'Niveau atteint', render: (x) => x.reachedLevel },
          ]} />
          <Heading level={2}>Vérifications</Heading>
          <DataTable caption="Vérifications" rows={u.verifications} rowKey={(x) => x.id} columns={[
            { key: 'k', header: 'Type', render: (x) => x.kind },
            { key: 'p', header: 'Provenance', render: (x) => x.provenance },
            { key: 's', header: 'Statut', render: (x) => <StatusBadge value={x.status} /> },
            { key: 'e', header: 'Expire', render: (x) => when(x.expiresAt) },
          ]} />
          <Heading level={2}>Appareils, abonnements, pauses, demandes</Heading>
          <DataTable caption="Appareils" rows={u.devices} rowKey={(x) => x.id} empty="Aucun appareil" columns={[
            { key: 'p', header: 'Plateforme', render: (x) => `${x.platform ?? '—'} ${x.appVersion ?? ''}` },
            { key: 'u', header: 'Dernier usage', render: (x) => when(x.lastUsedAt) },
            { key: 'r', header: 'État', render: (x) => (x.revoked ? 'révoquée' : 'active') },
          ]} />
          <DataTable caption="Abonnements" rows={u.subscriptions} rowKey={(x) => x.id} empty="Aucun abonnement" columns={[
            { key: 'p', header: 'Fournisseur', render: (x) => `${x.provider} / ${x.environment}` },
            { key: 's', header: 'État', render: (x) => <StatusBadge value={x.state} /> },
            { key: 'e', header: 'Fin de période', render: (x) => when(x.currentPeriodEndsAt) },
          ]} />
          <DataTable caption="Pauses" rows={u.pauses} rowKey={(x) => x.id} empty="Aucune pause" columns={[
            { key: 's', header: 'Portée', render: (x) => x.scope },
            { key: 'd', header: 'Période', render: (x) => `${when(x.startsAt)} → ${when(x.endsAt)}` },
          ]} />
          <DataTable caption="Exports et suppressions" rows={[...u.exports.map((e) => ({ ...e, t: 'Export' })), ...u.deletions.map((e) => ({ ...e, t: 'Suppression' }))]} rowKey={(x) => x.id} empty="Aucune demande" columns={[
            { key: 't', header: 'Type', render: (x) => x.t },
            { key: 's', header: 'Statut', render: (x) => <StatusBadge value={x.status} /> },
            { key: 'd', header: 'Demandé', render: (x) => when(x.requestedAt) },
          ]} />
          <Heading level={2}>Journal des actions</Heading>
          <Timeline items={u.auditTrail.map((a) => ({ key: a.id, at: a.at, title: a.action, detail: `${a.actorRole ?? 'système'}${a.reason ? ` — ${a.reason}` : ''}` }))} />
        </div>
      )}
    </Show>
  );
}
