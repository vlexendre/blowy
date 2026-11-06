import { randomUUID } from 'node:crypto';
import type { VenueRosterView } from '@blowy/api-contract';
import { VenueColumns, VenueHeader, VenueSideCard, VenueText } from '@blowy/ui-web';
import { venueGet } from '../../../../lib/api';
import { clock, dayLabel } from '../../../../lib/venue-format';
import { VenueForm } from '../venue-form';

export const dynamic = 'force-dynamic';

export default async function SignalerPage() {
  const r = await venueGet<VenueRosterView>('/v1/venue/roster');
  const header = <VenueHeader title="SIGNALER UN PARTICIPANT">Comportement, refus de payer : l’équipe rappelle sous 1 h.</VenueHeader>;
  const tables = r.ok ? r.data.tables.filter((t) => t.firstNames.length > 0) : [];
  const tz = r.ok ? r.data.venue.timezone : 'Europe/Paris';
  return (
    <>
      {header}
      <VenueColumns
        main={
          tables.length ? (
            <VenueForm endpoint="/v1/venue/incidents" revalidate="/lieu/signaler" ok="Signalement transmis : l’équipe vous rappelle sous 1 h." submit="Envoyer le signalement" cid={randomUUID()}>
              <label className="bw-v-field" htmlFor="outing">
                Table
                <select id="outing" name="f.outingId" className="bw-v-input" required>
                  {tables.map((t) => (
                    <option key={t.outingId} value={t.outingId}>{`${dayLabel(t.startsAt, tz)} · ${clock(t.startsAt, tz)}`}</option>
                  ))}
                </select>
              </label>
              <label className="bw-v-field" htmlFor="first">
                Prénom
                <select id="first" name="f.firstName" className="bw-v-input" required>
                  {[...new Set(tables.flatMap((t) => t.firstNames))].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="bw-v-field" htmlFor="motive">
                Motif
                <select id="motive" name="f.motive" className="bw-v-input" required>
                  <option value="BEHAVIOR">Comportement</option>
                  <option value="REFUSED_TO_PAY">Refus de payer</option>
                  <option value="OTHER">Autre</option>
                </select>
              </label>
              <label className="bw-v-field" htmlFor="note">
                Ce qui s’est passé
                <textarea id="note" name="f.note" className="bw-v-input bw-v-input--area" required minLength={5} maxLength={500} />
              </label>
            </VenueForm>
          ) : (
            <div className="bw-v-card bw-v-form">Aucune table confirmée à signaler pour l’instant.</div>
          )
        }
        aside={
          <VenueSideCard title="Urgence">
            <VenueText relaxed>En cas de danger : 17 ou 112, puis l’astreinte Blowy. Le personnel n’intervient pas à la place de Blowy.</VenueText>
          </VenueSideCard>
        }
      />
    </>
  );
}
