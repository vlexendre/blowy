import type { AdminNeighborhoodRow } from '@blowy/api-contract';
import { Badge, Card, DataTable, Heading, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { ReasonField, SelectField, TextField } from '../../../components/fields';

const DAYS = ['', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const hm = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;

export default async function NeighborhoodsPage() {
  const r = await apiGet<AdminNeighborhoodRow[]>('/v1/admin/neighborhoods');
  return (
    <div className="bw-stack">
      <PageHeader title="Villes et quartiers" eyebrow="V5 · §10.1">Statut, créneaux types par activité, personnes vérifiées par ville (agrégat) et écart « il manque N » par créneau. Plus de seuil de lancement.</PageHeader>
      <Show result={r}>
        {(rows) => (
          <>
            {rows.map((n) => (
              <Card key={n.id}>
                <Heading level={2}>{n.city} · {n.name} <StatusBadge value={n.status} /></Heading>
                <p className="bw-small">{n.verifiedInCity} personnes vérifiées dans la ville · {n.venues} lieu(x) · fuseau {n.timezone}{n.estimatedLaunchAt ? ` · ouverture estimée ${when(n.estimatedLaunchAt)}` : ''}</p>
                <DataTable caption={`Créneaux types ${n.name}`} rows={n.slotTemplates} rowKey={(t) => t.id} empty="Aucun créneau type" columns={[
                  { key: 'd', header: 'Jour', render: (t) => `${DAYS[t.isoWeekday]} ${hm(t.localMinute)}` },
                  { key: 'a', header: 'Activité', render: (t) => t.activity },
                  { key: 's', header: 'Actif', render: (t) => (t.active ? <Badge tone="ok">actif</Badge> : <Badge>inactif</Badge>) },
                  { key: 'v', header: 'Vérifiés dispo.', render: (t) => t.available },
                  { key: 'm', header: 'Il manque', render: (t) => (t.missing ? <Badge tone="warn">{t.missing}</Badge> : <Badge tone="ok">0</Badge>) },
                ]} />
                <div className="bw-row">
                  <Mutation endpoint={`/v1/admin/neighborhoods/${n.id}/status`} method="PUT" label="Changer le statut" ok="Statut enregistré." revalidate="/neighborhoods">
                    <SelectField id={`st-${n.id}`} name="f.status" label="Statut" options={[['LIVE', 'LIVE'], ['WAITLIST', 'WAITLIST (pas encore ouvert)'], ['PAUSED', 'PAUSED'], ['CLOSED', 'CLOSED']]} />
                    <ReasonField id={`r-${n.id}`} />
                  </Mutation>
                  <Mutation endpoint={`/v1/admin/neighborhoods/${n.id}/slot-templates`} label="Ajouter / modifier un créneau type" ok="Créneau type enregistré." revalidate="/neighborhoods">
                    <SelectField id={`wd-${n.id}`} name="f.isoWeekday:int" label="Jour" options={[1, 2, 3, 4, 5, 6, 7].map((d) => [String(d), DAYS[d]!])} />
                    <TextField id={`mn-${n.id}`} name="f.localMinute:int" label="Minute du jour (19 h 30 = 1170)" type="number" defaultValue={1170} />
                    <SelectField id={`ac-${n.id}`} name="f.activity" label="Activité" options={['DRINK_COFFEE', 'BRUNCH', 'CLIMBING', 'WORKSHOP', 'GAMES', 'EXHIBITION'].map((a) => [a, a])} />
                    <SelectField id={`on-${n.id}`} name="f.active:bool" label="Actif" options={[['true', 'oui'], ['false', 'non']]} />
                    <ReasonField id={`rt-${n.id}`} />
                  </Mutation>
                </div>
              </Card>
            ))}
          </>
        )}
      </Show>
    </div>
  );
}
