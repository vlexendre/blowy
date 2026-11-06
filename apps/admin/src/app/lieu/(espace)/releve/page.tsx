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
  const header = <VenueHeader title="RELEVÉ DU MOIS">Relevé mensuel détaillé par soirée (montants HT).</VenueHeader>;
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
                  <th scope="col">Soirée</th>
                  <th scope="col">Places réservées</th>
                  <th scope="col">Présences</th>
                  <th scope="col">Absences</th>
                  <th scope="col">Imprévus</th>
                  <th scope="col">Sorties pour sécurité</th>
                  <th scope="col">Compensation HT</th>
                </tr>
              </thead>
              <tbody>
                {s.lines.length ? (
                  s.lines.map((l) => (
                    <tr key={l.outingId}>
                      <td>{l.startsAt ? dayLabel(l.startsAt) : 'Sortie'}{l.cancelledByBlowy ? ' · annulée par Blowy' : ''}</td>
                      <td>{l.reservedSeats ?? l.seats}</td>
                      <td>{l.attended ?? 0}</td>
                      <td>{l.absences ?? 0}</td>
                      <td>{l.emergencies ?? 0}</td>
                      <td>{l.safetyExits ?? 0}</td>
                      <td>{euros(l.amountCents)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>Aucune soirée ce mois-ci.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        }
        aside={
          <>
            <VenueSideCard title={`Total ${s.period} : ${euros(s.totalCents)}`}>
              <VenueText relaxed>Montants hors taxe : 4,16 € HT par place payée non honorée (absence ou imprévu), 3 € HT par place offerte, raison de sécurité : 3 € HT versés par Blowy. Blowy annule une sortie confirmée, à toute heure après la confirmation : 3 € HT par place réservée. Table Duo : 0 €, sans garantie. Mois civil. Une absence corrigée par Blowy est contre-passée.</VenueText>
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
