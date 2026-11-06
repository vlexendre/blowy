import { randomUUID } from 'node:crypto';
import type { VenueWelcomeView } from '@blowy/api-contract';
import { VenueColumns, VenueHeader, VenueSideCard, VenueText } from '@blowy/ui-web';
import { venueGet } from '../../../../lib/api';
import { VenueForm } from '../venue-form';

export const dynamic = 'force-dynamic';

/**
 * V5.7 (E30, D-080) : message d'accueil du lieu — prérempli depuis le modèle, texte seul (sans lien ni numéro), modéré.
 * Montré aux seules personnes confirmées, à partir de la veille 18 h, sur la fiche de confirmation et dans le chat.
 */
export default async function AccueilPage() {
  const r = await venueGet<VenueWelcomeView>('/v1/venue/welcome-message');
  const header = <VenueHeader title="MESSAGE D’ACCUEIL">Ce que lisent les participants confirmés la veille à 18 h.</VenueHeader>;
  if (!r.ok) return <>{header}<div className="bw-v-card bw-v-form">Message indisponible : {r.message}</div></>;
  const w = r.data;
  return (
    <>
      {header}
      <VenueColumns
        main={
          <VenueForm endpoint="/v1/venue/welcome-message" method="PUT" revalidate="/lieu/accueil" ok="Message enregistré." submit="Enregistrer le message" cid={randomUUID()}>
            <label className="bw-v-field" htmlFor="text">
              Votre message ({w.maxChars} caractères au plus)
              <textarea id="text" name="f.text:nullable" className="bw-v-input bw-v-input--area" maxLength={w.maxChars} defaultValue={w.text ?? w.template} />
            </label>
          </VenueForm>
        }
        aside={
          <VenueSideCard title="Qui le voit, et quand ?">
            <VenueText relaxed>Seules les personnes dont la place est confirmée, à partir de la veille 18 h : sur leur fiche et dans le chat du groupe. Texte seul : pas de lien, pas de numéro de téléphone. Laissez vide pour ne rien afficher.</VenueText>
          </VenueSideCard>
        }
      />
    </>
  );
}
