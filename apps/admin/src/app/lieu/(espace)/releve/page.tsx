import type { VenueStatementView } from '@blowy/api-contract';
import { VenueColumns, VenueHeader, VenueSideCard, VenueText } from '@blowy/ui-web';
import { venueGet } from '../../../../lib/api';
import { dayLabel, euros } from '../../../../lib/venue-format';

export const dynamic = 'force-dynamic';

/** Relevé mensuel des compensations : agrégé par sortie, sans prénom ni financement individuel. */
export default async function RelevePage({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const { mois } = await searchParams;
  const period = mois && /^\d{4}-\d{2}$/.test(mois) ? mois : undefined;
  const r = await venueGet<VenueStatementView>(`/v1/venue/statement${period ? `?period=${period}` : ''}`);
  const header = <VenueHeader title="RELEVÉ DU MOIS">Places non honorées après la confirmation, reversées au lieu. Virement le lundi.</VenueHeader>;
  if (!r.ok) return <>{header}<div className="bw-v-card bw-v-form">Relevé indisponible : {r.message}</div></>;
  const s = r.data;
  const [y, m] = s.period.split('-').map(Number) as [number, number];
  const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
  return (
    <>
      {header}
      <VenueColumns
        main={
          <div className="bw-v-grp">
            <table className="bw-v-table">
              <caption className="bw-sr">Compensations {s.period}</caption>
              <thead>
                <tr>
                  <th scope="col">Sortie</th>
                  <th scope="col">Places non honorées</th>
                  <th scope="col">Montant</th>
                </tr>
              </thead>
              <tbody>
                {s.lines.length ? (
                  s.lines.map((l) => (
                    <tr key={l.outingId}>
                      <td>{l.startsAt ? dayLabel(l.startsAt) : 'Sortie'}</td>
                      <td>{l.seats}</td>
                      <td>{euros(l.amountCents)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>Aucune place non honorée ce mois-ci.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        }
        aside={
          <>
            <VenueSideCard title={`Total ${s.period} : ${euros(s.totalCents)}`}>
              <VenueText relaxed>4,99 € par place payée non honorée, 3 € par place offerte. Une absence corrigée par Blowy est contre-passée.</VenueText>
            </VenueSideCard>
            <VenueSideCard title="Mois précédent" href={`/lieu/releve?mois=${prev}`} gap="sm">
              <VenueText>Voir le relevé de {prev} ›</VenueText>
            </VenueSideCard>
          </>
        }
      />
    </>
  );
}
