import type { VenueRosterView, VenueTable } from '@blowy/api-contract';
import { VenueAvatar, VenueChip, VenueColumns, VenueGroup, VenueHeader, VenueLabel, VenueRow, VenueSideCard, VenueText, VenueValue } from '@blowy/ui-web';
import { venueGet } from '../../../../lib/api';
import { ACTIVITY_LABEL, clock, dayLabel, ROW_ART } from '../../../../lib/venue-format';

export const dynamic = 'force-dynamic';

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Un créneau = toutes les tables Blowy commençant à la même heure (une sortie = une table). */
function slotsOf(tables: VenueTable[]) {
  const by = new Map<string, VenueTable[]>();
  for (const t of tables.filter((x) => x.status !== 'CANCELLED' && x.status !== 'DONE')) by.set(t.startsAt, [...(by.get(t.startsAt) ?? []), t]);
  return [...by.values()];
}

function Slot({ tables, tz, first }: { tables: VenueTable[]; tz: string; first: boolean }) {
  const t0 = tables[0]!;
  const confirmed = tables.every((t) => t.status === 'CONFIRMED');
  const count = tables.reduce((s, t) => s + t.confirmedCount, 0);
  const names = tables.flatMap((t) => t.firstNames);
  const codes = [...new Set(tables.map((t) => t.code).filter((c): c is string => !!c))];
  const lock = `${dayLabel(t0.lockAt, tz, false)}, ${clock(t0.lockAt, tz)}`;
  return (
    <>
      <div className="bw-v-card bw-v-summary" aria-label={first ? 'Prochaine table' : undefined}>
        <div className="bw-v-summary__main">
          <VenueLabel>{`${dayLabel(t0.startsAt, tz)} · ${clock(t0.startsAt, tz)} – ${clock(t0.endsAt, tz)}`}</VenueLabel>
          <span className="bw-v-d bw-v-summary__count">{confirmed ? plural(count, 'confirmé', 'confirmés') : plural(count, 'inscrit', 'inscrits')}</span>
          <span className="bw-v-soft">
            {confirmed ? <>Effectif arrêté le {lock}. Annuler n’est plus gratuit pour eux.</> : <>Effectif envoyé le {lock} : prénoms et nombre définitifs à ce moment-là.</>}
          </span>
        </div>
        <div className="bw-v-summary__side">
          <VenueChip>{plural(tables.length, 'table', 'tables')} · chevalet orange</VenueChip>
          <span className="bw-v-summary__note">{ACTIVITY_LABEL[t0.activity] ?? 'Sortie'} · aucune animation</span>
        </div>
      </div>
      <VenueGroup label="Table Blowy">
        <VenueRow kind="head">
          <VenueLabel>Table Blowy · prénoms seulement</VenueLabel>
          {codes.length ? <VenueValue>code du chevalet : {codes.join(' · ')}</VenueValue> : null}
        </VenueRow>
        {names.length ? (
          names.map((n, i) => (
            <VenueRow kind="person" key={`${n}-${i}`}>
              <VenueAvatar {...ROW_ART[i % ROW_ART.length]!} />
              <span>{n}</span>
              <VenueValue tone="ok">confirmé</VenueValue>
            </VenueRow>
          ))
        ) : (
          <VenueRow kind="person">
            <span>Les prénoms arrivent le {lock}.</span>
          </VenueRow>
        )}
      </VenueGroup>
    </>
  );
}

export default async function EffectifPage() {
  const r = await venueGet<VenueRosterView>('/v1/venue/roster');
  if (!r.ok) {
    return (
      <>
        <VenueHeader title="EFFECTIF DE LA SEMAINE">Ce que vous recevez la veille à 18 h : nombre, table, prénoms. Aucune autre donnée.</VenueHeader>
        <div className="bw-v-card bw-v-form">{r.kind === 'refused' ? 'Accès refusé.' : `Effectif indisponible : ${r.message}`}</div>
      </>
    );
  }
  const tz = r.data.venue.timezone;
  const slots = slotsOf(r.data.tables);
  return (
    <>
      <VenueHeader title="EFFECTIF DE LA SEMAINE">Ce que vous recevez la veille à 18 h : nombre, table, prénoms. Aucune autre donnée.</VenueHeader>
      <VenueColumns
        main={
          slots.length ? (
            slots.map((s, i) => <Slot key={s[0]!.startsAt} tables={s} tz={tz} first={i === 0} />)
          ) : (
            <div className="bw-v-card bw-v-summary">
              <div className="bw-v-summary__main">
                <VenueLabel>Cette semaine</VenueLabel>
                <span className="bw-v-d bw-v-summary__count">Aucune table</span>
                <span className="bw-v-soft">Aucun groupe n’est composé sur vos créneaux pour l’instant.</span>
              </div>
            </div>
          )
        }
        aside={
          <>
            <VenueSideCard title="Si une place reste vide" href="/lieu/releve">
              <VenueText relaxed>Après la confirmation, une place non honorée vous est reversée : 4,99 € si elle était payée, 3 € si elle était offerte. Virement le lundi.</VenueText>
            </VenueSideCard>
            <VenueSideCard title="Signaler un participant" href="/lieu/signaler" gap="sm">
              <VenueText>Comportement, refus de payer : l’équipe rappelle sous 1 h.</VenueText>
            </VenueSideCard>
            <VenueSideCard title="Votre photo, la veille" href="/lieu/photo" gap="sm">
              <VenueText>C’est elle que voient les participants à 18 h. Changer la photo ›</VenueText>
            </VenueSideCard>
          </>
        }
      />
    </>
  );
}
