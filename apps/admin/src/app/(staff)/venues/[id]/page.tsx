import type { AdminVenueDetail } from '@blowy/api-contract';
import { Badge, Card, DataTable, Heading, KeyValueList, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Mutation, Show, when } from '../../../../components/admin';
import { ReasonField, SelectField, TextField } from '../../../../components/fields';

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<AdminVenueDetail>(`/v1/admin/venues/${id}`);
  return (
    <div className="bw-stack">
      <Show result={r}>
        {(v) => (
          <>
            <PageHeader title={v.name} eyebrow={`${v.neighborhood.city} · ${v.neighborhood.name}`}>{v.address}</PageHeader>
            <Card>
              <KeyValueList items={[
                ['Statut', <StatusBadge key="s" value={v.status} />],
                ['Activités', v.activities.join(', ')],
                ['Plafond', `${v.tablesPerSlot} table(s) par créneau`],
                ['Contrat', v.contract ? `${v.contract.version} · signé ${when(v.contract.signedAt)} par ${v.contract.signerName}` : 'non signé'],
                ['Contre-signature Blowy', v.contract?.countersignedAt ? `${when(v.contract.countersignedAt)} par ${v.contract.countersignerName ?? 'Blowy'}${v.contract.inForce ? ' · en vigueur' : ' · version à re-signer'}` : 'en attente'],
                ['Ambiance', v.ambiance === 'CALM' ? 'plutôt calme' : v.ambiance === 'LIVELY' ? 'plutôt animé' : 'convient à tous'],
                ['Message d’accueil', v.welcomeMessage ?? '—'],
                ['Photo', v.photoUrl ?? '—'],
                ['Contact (ops)', v.staffContact ?? '—'],
                ['Partenaires', v.partnerAccounts.map((p) => p.displayName).join(', ') || '—'],
              ]} />
            </Card>
            <Heading level={2}>Planning du lieu</Heading>
            <DataTable caption="Planning" rows={v.schedule} rowKey={(d) => String(d.isoWeekday)} columns={[
              { key: 'd', header: 'Jour', render: (d) => d.label },
              { key: 't', header: 'Horaire', render: (d) => d.times ?? '—' },
              { key: 'o', header: 'Ouvert', render: (d) => (d.open ? <Badge tone="ok">{d.tables} table(s)</Badge> : <Badge>{d.note ?? 'fermé'}</Badge>) },
            ]} />
            <DataTable caption="Créneaux à venir" rows={v.upcomingSlots} rowKey={(s) => s.id} empty="Aucun créneau généré" columns={[
              { key: 's', header: 'Début', render: (s) => when(s.startsAt) },
              { key: 'a', header: 'Activité', render: (s) => s.activity },
              { key: 'c', header: 'Tables réservées / capacité', render: (s) => `${s.reserved} / ${s.capacity}` },
            ]} />
            <Heading level={2}>Signalements du lieu (rappel sous 1 h)</Heading>
            <DataTable caption="Signalements" rows={v.incidents} rowKey={(i) => i.id} empty="Aucun signalement" columns={[
              { key: 'w', header: 'Reçu', render: (i) => when(i.createdAt) },
              { key: 'p', header: 'Prénom', render: (i) => i.firstName },
              { key: 'm', header: 'Motif', render: (i) => i.motive },
              { key: 'n', header: 'Note', render: (i) => i.note },
              { key: 'd', header: 'Échéance', render: (i) => (i.overdue ? <Badge tone="danger">dépassée</Badge> : when(i.dueAt)) },
            ]} />
            {v.closures.length || v.photoRequests.length ? (
              <Card>
                <KeyValueList items={[
                  ['Fermetures', v.closures.map((c) => `${c.date} (${c.note})`).join(' · ') || '—'],
                  ['Demandes de photo', v.photoRequests.map((p) => `${when(p.at)} : ${p.note}`).join(' · ') || '—'],
                ]} />
              </Card>
            ) : null}
            <Heading level={2}>Actions</Heading>
            <div className="bw-row">
              <Mutation endpoint={`/v1/admin/venues/${v.id}`} method="PUT" label="Mettre à jour la fiche" ok="Fiche mise à jour." revalidate={`/venues/${v.id}`}>
                <TextField id="t" name="f.tablesPerSlot:int" label="Plafond de tables" type="number" defaultValue={v.tablesPerSlot} />
                <SelectField id="s" name="f.status" label="Statut" options={[['ACTIVE', 'ACTIVE'], ['PAUSED', 'PAUSED'], ['ARCHIVED', 'ARCHIVED']]} />
                <TextField id="p" name="f.photoUrl:nullable" label="URL de la photo (vérifiée)" defaultValue={v.photoUrl ?? ''} />
                <SelectField id="am" name="f.ambiance:nullable" label="Ambiance" options={[['', 'convient à tous'], ['CALM', 'plutôt calme'], ['LIVELY', 'plutôt animé']]} />
                <ReasonField id="r1" />
              </Mutation>
              <Mutation endpoint={`/v1/admin/venues/${v.id}/rotate-secret`} label="Renouveler le secret du code (step-up)" ok="Secret renouvelé : nouveau code du chevalet." revalidate={`/venues/${v.id}`} variant="danger" confirm="L’ancien code du chevalet ne fonctionnera plus. Continuer ?">
                <ReasonField id="r2" />
              </Mutation>
              {v.contract && !v.contract.countersignedAt ? (
                <Mutation endpoint={`/v1/admin/venues/${v.id}/contract/countersign`} label="Contre-signer le contrat (step-up)" ok="Contrat contre-signé : en vigueur." revalidate={`/venues/${v.id}`}>
                  <TextField id="cs" name="f.signerName" label="Nom du signataire Blowy" required />
                  <ReasonField id="r4" />
                </Mutation>
              ) : null}
              <Mutation endpoint={`/v1/admin/venues/${v.id}/partners`} label="Accès partenaire (step-up)" ok="Accès mis à jour." revalidate={`/venues/${v.id}`}>
                <SelectField id="pp" name="f.provider" label="Fournisseur" options={[['firebase', 'Firebase'], ['local', 'Local (dev)']]} />
                <TextField id="ps" name="f.subject" label="Identifiant (uid)" required />
                <SelectField id="pg" name="f.grant:bool" label="Action" options={[['true', 'Accorder'], ['false', 'Retirer']]} />
                <ReasonField id="r3" />
              </Mutation>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
