import { randomUUID } from 'node:crypto';
import type { VenueContractView } from '@blowy/api-contract';
import { VenueColumns, VenueHeader, VenueLabel, VenueSideCard, VenueText } from '@blowy/ui-web';
import { venueGet } from '../../../../lib/api';
import { longDate } from '../../../../lib/venue-format';
import { VenueForm } from '../venue-form';

export const dynamic = 'force-dynamic';

export default async function ContratPage() {
  const r = await venueGet<VenueContractView>('/v1/venue/contract');
  const header = <VenueHeader title="CONTRAT D’UNE PAGE">Ce que chacun s’engage à faire. Rien d’autre.</VenueHeader>;
  if (!r.ok) return <>{header}<div className="bw-v-card bw-v-form">Contrat indisponible : {r.message}</div></>;
  const c = r.data;
  return (
    <>
      {header}
      <VenueColumns
        main={
          <div className="bw-v-card bw-v-contract">
            {c.clauses.map((k) => (
              <div className="bw-v-clause" key={k.n}>
                <span className="bw-v-d bw-v-clause__n">{k.n}</span>
                <div className="bw-v-clause__body">
                  <span className="bw-v-d bw-v-clause__title">{k.title}</span>
                  <VenueText relaxed>{k.body}</VenueText>
                </div>
              </div>
            ))}
          </div>
        }
        aside={
          c.signed ? (
            <>
              <div className="bw-v-card bw-v-card--side bw-v-card--wide">
                <VenueLabel>Signé le {longDate(c.signed.at)}</VenueLabel>
                <span className="bw-v-d bw-v-card__title">{c.venue.name}</span>
                <VenueText>{c.venue.address}</VenueText>
              </div>
              <a href="/lieu/contrat/pdf" className="bw-v-btn" download>
                Télécharger le PDF
              </a>
            </>
          ) : (
            <>
              <VenueSideCard title={c.venue.name} gap="lg">
                <VenueLabel>Non signé · version {c.version}</VenueLabel>
                <VenueText>{c.venue.address}</VenueText>
              </VenueSideCard>
              <VenueForm endpoint="/v1/venue/contract/sign" revalidate="/lieu/contrat" ok="Contrat signé." submit="Signer le contrat" cid={randomUUID()} hidden={{ 'f.version': c.version }}>
                <label className="bw-v-field" htmlFor="signer">
                  Nom du signataire
                  <input id="signer" name="f.signerName" className="bw-v-input" required minLength={2} maxLength={80} autoComplete="name" />
                </label>
              </VenueForm>
              <a href="/lieu/contrat/pdf" className="bw-v-btn" download>
                Télécharger le PDF
              </a>
            </>
          )
        }
      />
    </>
  );
}
