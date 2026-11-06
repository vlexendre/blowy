import type { AdminNeighborhoodRow, AdminTravelTimeRow } from '@blowy/api-contract';
import { Card, DataTable, Heading, PageHeader } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show } from '../../../components/admin';
import { ReasonField, SelectField, TextField } from '../../../components/fields';

/**
 * V5.6 (E11, §2.1) : temps de trajet typiques entre quartiers (transports en commun), saisis par ops. Sans valeur saisie,
 * l'API ESTIME à partir du centre du quartier (saisi ici, sinon moyenne de ses lieux) — jamais la position d'une personne.
 */
export default async function TravelTimesPage({ searchParams }: { searchParams: Promise<{ nb?: string }> }) {
  const { nb } = await searchParams;
  const list = await apiGet<AdminNeighborhoodRow[]>('/v1/admin/neighborhoods');
  const rows = nb ? await apiGet<AdminTravelTimeRow[]>(`/v1/admin/neighborhoods/${encodeURIComponent(nb)}/travel-times`) : null;
  return (
    <div className="bw-stack">
      <PageHeader title="Temps de trajet" eyebrow="V5.6 · §2.1">Valeurs typiques entre quartiers ; elles priment sur l’estimation (centres de quartier, détour 1,3, 18 km/h porte à porte, + 6 min).</PageHeader>
      <Show result={list}>
        {(nbs) => {
          const name = (id: string) => nbs.find((n) => n.id === id)?.name ?? id;
          const options = nbs.map((n) => [n.id, `${n.city} · ${n.name}`] as [string, string]);
          return (
            <>
              <Card>
                <Heading level={2}>Choisir un quartier</Heading>
                <div className="bw-row">
                  {nbs.map((n) => (
                    <a key={n.id} href={`/travel-times?nb=${n.id}`} className="bw-small">{n.city} · {n.name}</a>
                  ))}
                </div>
              </Card>
              {rows ? (
                <Show result={rows}>
                  {(t) => (
                    <DataTable caption="Trajets saisis" rows={t} rowKey={(x) => `${x.fromNeighborhoodId}-${x.toNeighborhoodId}`} empty="Aucune valeur saisie (estimation appliquée)" columns={[
                      { key: 'f', header: 'De', render: (x) => name(x.fromNeighborhoodId) },
                      { key: 't', header: 'Vers', render: (x) => name(x.toNeighborhoodId) },
                      { key: 'm', header: 'Minutes', render: (x) => `≈ ${x.minutes} min` },
                    ]} />
                  )}
                </Show>
              ) : null}
              <div className="bw-row">
                <Mutation endpoint="/v1/admin/travel-times" label="Enregistrer un trajet" ok="Trajet enregistré." revalidate="/travel-times">
                  <SelectField id="tf" name="f.fromNeighborhoodId" label="De" options={options} />
                  <SelectField id="tt" name="f.toNeighborhoodId" label="Vers" options={options} />
                  <TextField id="tm" name="f.minutes:int" label="Minutes (1–240)" type="number" required />
                  <SelectField id="ts" name="f.symmetric:bool" label="Dans les deux sens" options={[['true', 'oui'], ['false', 'non']]} />
                  <ReasonField id="tr" />
                </Mutation>
                {nb ? (
                  <Mutation endpoint={`/v1/admin/neighborhoods/${nb}/center`} method="PUT" label="Centre du quartier (estimation)" ok="Centre enregistré." revalidate="/travel-times">
                    <TextField id="cl" name="f.lat:num" label="Latitude" required />
                    <TextField id="cg" name="f.lng:num" label="Longitude" required />
                    <ReasonField id="cr" />
                  </Mutation>
                ) : null}
              </div>
            </>
          );
        }}
      </Show>
    </div>
  );
}
