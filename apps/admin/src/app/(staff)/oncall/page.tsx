import type { AdminOnCallPlanning } from '@blowy/api-contract';
import { Badge, Card, DataTable, Heading, PageHeader } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { ReasonField, TextField } from '../../../components/fields';

/**
 * V5.6 (E12, §10.1) : planning d'astreinte par fuseau (trust_lead + ops). Aucun créneau n'est généré hors couverture ;
 * un créneau publié qui perd sa couverture est retiré s'il est vide, sinon escaladé (dossier ops prioritaire).
 */
export default async function OnCallPage({ searchParams }: { searchParams: Promise<{ tz?: string }> }) {
  const { tz } = await searchParams;
  const r = await apiGet<AdminOnCallPlanning>(`/v1/admin/oncall/shifts?days=14${tz ? `&timezone=${encodeURIComponent(tz)}` : ''}`);
  return (
    <div className="bw-stack">
      <PageHeader title="Astreinte" eyebrow="V5.6 · §10.1">Tours d’astreinte par fuseau, sur 14 jours. Une équipe humaine joignable pendant toute la sortie ou le rendez-vous ; rappel visé en quelques minutes.</PageHeader>
      <Show result={r}>
        {(p) => (
          <>
            <Card>
              <Heading level={2}>Créneaux publiés sans couverture</Heading>
              {p.uncoveredSlots.length ? <Badge tone="danger">{p.uncoveredSlots.length} créneau(x) non couvert(s)</Badge> : <Badge tone="ok">Tous les créneaux publiés sont couverts</Badge>}
              <DataTable caption="Créneaux non couverts" rows={p.uncoveredSlots} rowKey={(s) => s.venueSlotId} empty="Aucun" columns={[
                { key: 's', header: 'Début', render: (s) => when(s.startsAt) },
                { key: 'z', header: 'Fuseau', render: (s) => s.timezone },
              ]} />
            </Card>
            <DataTable caption="Tours d’astreinte" rows={p.shifts} rowKey={(s) => s.id} empty="Aucun tour planifié" columns={[
              { key: 'z', header: 'Fuseau', render: (s) => s.timezone },
              { key: 'a', header: 'Début', render: (s) => when(s.startsAt) },
              { key: 'b', header: 'Fin', render: (s) => when(s.endsAt) },
              { key: 't', header: 'Équipe', render: (s) => s.teamLabel },
              { key: 'p', header: 'Numéro', render: (s) => (s.hasPhoneRef ? <Badge tone="ok">référencé</Badge> : <Badge>—</Badge>) },
              {
                key: 'x',
                header: 'Retirer',
                render: (s) => (
                  <Mutation endpoint={`/v1/admin/oncall/shifts/${s.id}/delete`} label="Retirer" ok="Tour retiré." revalidate="/oncall" variant="danger" confirm="Les créneaux qui perdent leur couverture seront retirés ou escaladés. Continuer ?">
                    <ReasonField id={`r-${s.id}`} />
                  </Mutation>
                ),
              },
            ]} />
            <Heading level={2}>Ajouter un tour</Heading>
            <Mutation endpoint="/v1/admin/oncall/shifts" label="Ajouter le tour" ok="Tour ajouté." revalidate="/oncall">
              <TextField id="tz" name="f.timezone" label="Fuseau IANA" defaultValue={tz ?? 'Europe/Paris'} required />
              <TextField id="sa" name="f.startsAt" label="Début (ISO 8601, ex. 2026-11-20T08:00:00+01:00)" required />
              <TextField id="ea" name="f.endsAt" label="Fin (ISO 8601, ≤ 24 h après le début)" required />
              <TextField id="tl" name="f.teamLabel" label="Équipe" required />
              <TextField id="pr" name="f.phoneRef:nullable" label="Référence du numéro (jamais le numéro)" />
              <ReasonField id="rs" />
            </Mutation>
          </>
        )}
      </Show>
    </div>
  );
}
