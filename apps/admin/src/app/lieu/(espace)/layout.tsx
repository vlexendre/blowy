import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { VenueMe, VenueScheduleView } from '@blowy/api-contract';
import { VenueShell } from '@blowy/ui-web';
import { venueGet } from '../../../lib/api';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/lieu/effectif', label: 'Effectif de la semaine' },
  { href: '/lieu/creneaux', label: 'Créneaux et tables' },
  { href: '/lieu/contrat', label: 'Contrat' },
  { href: '/lieu/accueil', label: 'Message d’accueil' },
];

/** Gabarit de l'espace lieu : session lieu exigée (sinon reconnexion), astreinte affichée. */
export default async function VenueSpaceLayout({ children }: { children: ReactNode }) {
  const [me, sched] = await Promise.all([venueGet<VenueMe>('/v1/venue/me'), venueGet<VenueScheduleView>('/v1/venue/schedule')]);
  if (!me.ok) redirect('/lieu/login');
  const v = me.data.venues[0];
  const current = (await headers()).get('x-pathname') ?? '/lieu/effectif';
  const onCall = sched.ok ? sched.data.onCall : { phone: null, hours: 'pendant toute la sortie ou le rendez-vous' };
  return (
    <VenueShell venueLabel={v ? `${v.name} · ${v.neighborhood}` : me.data.displayName} nav={NAV} current={current === '/lieu/releve' || current === '/lieu/signaler' || current === '/lieu/photo' ? '/lieu/effectif' : current === '/lieu/reglages' ? '/lieu/creneaux' : current} onCall={onCall}>
      {children}
    </VenueShell>
  );
}
