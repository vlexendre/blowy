import type { AdminNeighborhoodRow, AdminVenueRow } from '@blowy/api-contract';
import { Badge, DataTable, Heading, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { ReasonField, SelectField, TextField } from '../../../components/fields';

export default async function VenuesPage() {
  const [r, n] = await Promise.all([apiGet<AdminVenueRow[]>('/v1/admin/venues'), apiGet<AdminNeighborhoodRow[]>('/v1/admin/neighborhoods')]);
  return (
    <div className="bw-stack">
      <PageHeader title="Lieux partenaires" eyebrow="V5 · §10.1">Fiche, activités, plafond de tables, créneaux, contrat signé, accès partenaires (espace lieu).</PageHeader>
      <Show result={r}>
        {(rows) => (
          <DataTable caption="Lieux" rows={rows} rowKey={(v) => v.id} empty="Aucun lieu" columns={[
            { key: 'n', header: 'Lieu', render: (v) => <a href={`/venues/${v.id}`}>{v.name}</a> },
            { key: 'q', header: 'Quartier', render: (v) => `${v.neighborhood.city} · ${v.neighborhood.name}` },
            { key: 's', header: 'Statut', render: (v) => <StatusBadge value={v.status} /> },
            { key: 't', header: 'Plafond', render: (v) => `${v.tablesPerSlot} table(s)` },
            { key: 'c', header: 'Contrat', render: (v) => (v.contract ? <Badge tone="ok">signé {when(v.contract.signedAt)}</Badge> : <Badge tone="warn">non signé</Badge>) },
            { key: 'p', header: 'Partenaires', render: (v) => v.partners },
          ]} />
        )}
      </Show>
      <Heading level={2}>Nouveau lieu</Heading>
      <Show result={n}>
        {(nbs) => (
          <Mutation endpoint="/v1/admin/venues" label="Créer le lieu" ok="Lieu créé." revalidate="/venues">
            <SelectField id="nb" name="f.neighborhoodId" label="Quartier" options={nbs.map((x) => [x.id, `${x.city} · ${x.name}`])} />
            <TextField id="vn" name="f.name" label="Nom" required />
            <TextField id="va" name="f.addressLine" label="Adresse" required />
            <TextField id="vp" name="f.postalCode" label="Code postal" required />
            <TextField id="vc" name="f.city" label="Ville" required />
            <TextField id="vlat" name="f.lat:json" label="Latitude (check-in seulement, jamais affichée)" required />
            <TextField id="vlng" name="f.lng:json" label="Longitude" required />
            <TextField id="vact" name="f.activities:json" label="Activités (JSON)" defaultValue='["DRINK_COFFEE"]' required />
            <TextField id="vt" name="f.tablesPerSlot:int" label="Plafond de tables" type="number" defaultValue={1} />
            <ReasonField id="vr" />
          </Mutation>
        )}
      </Show>
    </div>
  );
}
