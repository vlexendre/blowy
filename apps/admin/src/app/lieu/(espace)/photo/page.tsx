import { randomUUID } from 'node:crypto';
import { VenueColumns, VenueHeader, VenueSideCard, VenueText } from '@blowy/ui-web';
import { VenueForm } from '../venue-form';

export const dynamic = 'force-dynamic';

export default function PhotoPage() {
  return (
    <>
      <VenueHeader title="VOTRE PHOTO, LA VEILLE">C’est elle que voient les participants à 18 h.</VenueHeader>
      <VenueColumns
        main={
          <VenueForm endpoint="/v1/venue/photo-requests" revalidate="/lieu/photo" ok="Demande transmise à l’équipe Blowy." submit="Demander un changement" cid={randomUUID()}>
            <label className="bw-v-field" htmlFor="note">
              Ce que vous souhaitez changer
              <textarea id="note" name="f.note" className="bw-v-input bw-v-input--area" required minLength={5} maxLength={300} />
            </label>
          </VenueForm>
        }
        aside={
          <VenueSideCard title="Pourquoi une demande ?">
            <VenueText relaxed>La photo est vérifiée par l’équipe avant d’être montrée aux participants (pas de visage, pas de texte).</VenueText>
          </VenueSideCard>
        }
      />
    </>
  );
}
