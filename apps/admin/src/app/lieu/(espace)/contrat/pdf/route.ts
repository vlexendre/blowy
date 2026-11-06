/** Contrat d'une page du lieu en PDF (généré à la demande depuis l'API, session lieu exigée). */
import type { VenueContractView } from '@blowy/api-contract';
import { venueGet } from '../../../../../lib/api';
import { onePagePdf } from '../../../../../lib/pdf';
import { longDate } from '../../../../../lib/venue-format';

export const dynamic = 'force-dynamic';

export async function GET() {
  const r = await venueGet<VenueContractView>('/v1/venue/contract');
  if (!r.ok) return new Response('Contrat indisponible', { status: r.status === 401 ? 401 : 502, headers: { 'cache-control': 'no-store' } });
  const c = r.data;
  const pdf = onePagePdf(`Contrat d’une page — ${c.venue.name}`, [
    { text: 'blowy. lieu — Contrat d’une page', size: 20, bold: true },
    { text: `${c.venue.name} · ${c.venue.address}`, size: 11, gapBefore: 6 },
    { text: `Version ${c.version}${c.signed ? ` · signé le ${longDate(c.signed.at)} par ${c.signed.signerName}` : ' · non signé'}`, size: 10, gapBefore: 2 },
    ...c.clauses.flatMap((k) => [
      { text: `${k.n}. ${k.title}`, size: 13, bold: true, gapBefore: 14 },
      { text: k.body, size: 11, gapBefore: 2 },
    ]),
    { text: `Astreinte Blowy : ${c.onCall.phone ?? 'numéro communiqué à la signature'} (${c.onCall.hours}).`, size: 10, gapBefore: 18 },
  ]);
  return new Response(pdf, { headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="contrat-blowy-lieu.pdf"', 'cache-control': 'no-store' } });
}
