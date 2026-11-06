import { randomUUID } from 'node:crypto';
import type { VenueScheduleView } from '@blowy/api-contract';
import { VenueColumns, VenueGroup, VenueHeader, VenuePill, VenueRow, VenueSideCard, VenueSwitch, VenueText, VenueValue } from '@blowy/ui-web';
import { venueGet } from '../../../../lib/api';
import { venueQuickAction } from '../../../../lib/venue-actions';

export const dynamic = 'force-dynamic';

/** Champs cachés d'une mutation lieu (Idempotency-Key fixé au rendu : double clic = rejoué). */
function Hidden({ endpoint, method, fields }: { endpoint: string; method: 'PUT' | 'POST'; fields: Record<string, string> }) {
  return (
    <>
      <input type="hidden" name="_endpoint" value={endpoint} />
      <input type="hidden" name="_method" value={method} />
      <input type="hidden" name="_cid" value={randomUUID()} />
      <input type="hidden" name="_revalidate" value="/lieu/creneaux" />
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

export default async function CreneauxPage() {
  const r = await venueGet<VenueScheduleView>('/v1/venue/schedule');
  const header = <VenueHeader title="CRÉNEAUX ET TABLES">Vous choisissez vos créneaux, hors coup de feu. Blowy ne remplit jamais plus que votre plafond.</VenueHeader>;
  if (!r.ok) return <>{header}<div className="bw-v-card bw-v-form">Créneaux indisponibles : {r.message}</div></>;
  const s = r.data;
  return (
    <>
      {header}
      <VenueColumns
        main={
          <>
            <VenueGroup label="Créneaux de la semaine">
              {s.days.map((d) => {
                return (
                  <VenueRow kind="day" key={d.isoWeekday}>
                    <span className="bw-v-day">{d.label}</span>
                    <span className="bw-v-times">{d.open && d.times ? d.times : '—'}</span>
                    <span className="bw-v-tables">{d.open ? `${d.tables} ${d.tables > 1 ? 'tables' : 'table'}` : (d.note ?? '—')}</span>
                    <VenueValue nowrap>{d.open ? 'ouvert aux sorties' : 'aucune sortie'}</VenueValue>
                    <form action={venueQuickAction}>
                      <Hidden endpoint="/v1/venue/schedule/days" method="PUT" fields={{ 'f.isoWeekday:int': String(d.isoWeekday), 'f.open:bool': String(!d.open) }} />
                      <VenueSwitch on={d.open} label={`${d.label}, ${d.open ? 'ouvert' : 'fermé'}${d.bookable ? '' : ' (aucun créneau Blowy ce jour-là)'}`} disabled={!d.bookable} />
                    </form>
                  </VenueRow>
                );
              })}
            </VenueGroup>
            <span className="bw-v-foot">Une table = 5 personnes. Les tables à deux (duos) suivent la même règle de compensation.</span>
          </>
        }
        aside={
          <>
            <VenueSideCard title="Plafond de tables" gap="lg">
              <div className="bw-v-cap">
                <form action={venueQuickAction}>
                  <Hidden endpoint="/v1/venue/schedule/cap" method="PUT" fields={{ 'f.tables:int': String(s.cap - 1) }} />
                  <VenuePill label="Une table de moins" disabled={s.cap <= 1}>−</VenuePill>
                </form>
                <span className="bw-v-d bw-v-cap__value">{s.cap}</span>
                <form action={venueQuickAction}>
                  <Hidden endpoint="/v1/venue/schedule/cap" method="PUT" fields={{ 'f.tables:int': String(s.cap + 1) }} />
                  <VenuePill label="Une table de plus" disabled={s.cap >= s.capMax}>+</VenuePill>
                </form>
                <VenueText>tables Blowy au plus, par créneau</VenueText>
              </div>
            </VenueSideCard>
            <VenueSideCard title={`Préavis : ${s.noticeHours} h`} href="/lieu/reglages" gap="sm">
              <VenueText relaxed>Pour fermer un créneau, ou pour que Blowy en annule un. Dans les deux sens.</VenueText>
            </VenueSideCard>
          </>
        }
      />
    </>
  );
}
