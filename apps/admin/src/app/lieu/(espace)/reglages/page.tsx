import { randomUUID } from 'node:crypto';
import type { VenueScheduleView } from '@blowy/api-contract';
import { VenueColumns, VenueHeader, VenueSideCard, VenueText } from '@blowy/ui-web';
import { venueGet } from '../../../../lib/api';
import { VenueForm } from '../venue-form';

export const dynamic = 'force-dynamic';

/** Fermetures exceptionnelles, mentions et tables par jour (préavis 72 h, dans les deux sens). */
export default async function ReglagesPage() {
  const r = await venueGet<VenueScheduleView>('/v1/venue/schedule');
  const header = <VenueHeader title="PRÉAVIS ET FERMETURES">Pour fermer un créneau, ou pour que Blowy en annule un. Dans les deux sens.</VenueHeader>;
  if (!r.ok) return <>{header}<div className="bw-v-card bw-v-form">Indisponible : {r.message}</div></>;
  const s = r.data;
  return (
    <>
      {header}
      <VenueColumns
        main={
          <>
            <VenueForm endpoint="/v1/venue/schedule/closures" revalidate="/lieu/reglages" ok="Fermeture enregistrée." submit="Fermer ce jour-là" cid={randomUUID()}>
              <label className="bw-v-field" htmlFor="date">
                Fermeture exceptionnelle (date)
                <input id="date" type="date" name="f.date" className="bw-v-input" required />
              </label>
              <label className="bw-v-field" htmlFor="cnote">
                Motif
                <input id="cnote" name="f.note" className="bw-v-input" required minLength={3} maxLength={200} />
              </label>
              <VenueText relaxed>Moins de 72 h avant, ou après la confirmation (veille 18 h) : la sortie est annulée et remboursée aux participants, et l’équipe Blowy est prévenue.</VenueText>
            </VenueForm>
            <VenueForm endpoint="/v1/venue/schedule/days" method="PUT" revalidate="/lieu/reglages" ok="Jour mis à jour." submit="Enregistrer le jour" cid={randomUUID()}>
              <label className="bw-v-field" htmlFor="day">
                Jour
                <select id="day" name="f.isoWeekday:int" className="bw-v-input">
                  {s.days.map((d) => (
                    <option key={d.isoWeekday} value={d.isoWeekday}>{d.label}</option>
                  ))}
                </select>
              </label>
              <label className="bw-v-field" htmlFor="open">
                Ouvert aux sorties
                <select id="open" name="f.open:bool" className="bw-v-input">
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </label>
              <label className="bw-v-field" htmlFor="tables">
                Tables ce jour-là (au plus {s.cap})
                <input id="tables" type="number" name="f.tables:int" min={1} max={s.cap} defaultValue={1} className="bw-v-input" />
              </label>
              <label className="bw-v-field" htmlFor="dnote">
                Mention (ex. « coup de feu, fermé »)
                <input id="dnote" name="f.note:nullable" maxLength={60} className="bw-v-input" />
              </label>
            </VenueForm>
          </>
        }
        aside={
          <VenueSideCard title="Fermetures à venir">
            <VenueText relaxed>{s.closures.length ? s.closures.map((c) => `${c.date} : ${c.note}`).join(' · ') : 'Aucune.'}</VenueText>
          </VenueSideCard>
        }
      />
    </>
  );
}
