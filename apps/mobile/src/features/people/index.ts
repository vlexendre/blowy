/**
 * « Les gens d'abord » (accueil) : ce que ton minimoa a pour toi aujourd'hui, en un seul état, le plus important
 * d'abord. Un signe reçu, puis un message d'un lien, puis la demande de position (tant qu'elle n'a pas été refusée :
 * tout nouveau compte la voit dès l'accueil), puis les personnes à présenter ; sinon ce
 * qui lui manque (test de vision, position refusée : réglages ou ville à la main), sinon personne pour l'instant
 * (inviter). Tout vient des requêtes déjà en cache (rencontres, liens, profil) : aucune requête de plus.
 */
import type { Me, PublicPet } from '@blowy/contract';

import { useEncounters } from '@/features/encounters';
import { useLinks } from '@/features/links';

export type PeopleToday =
  | { kind: 'loading' }
  | { kind: 'waved'; name: string; pet: PublicPet; more: number }
  | { kind: 'wrote'; linkId: string; name: string; pet: PublicPet; preview: string | null }
  | { kind: 'present'; count: number; people: PublicPet[]; mutual: string | null }
  | { kind: 'vision' }
  | { kind: 'location' }
  | { kind: 'empty' };

export function usePeopleToday(me: Me | undefined, opts: { locationRefused?: boolean } = {}): PeopleToday {
  const encounters = useEncounters();
  const links = useLinks();
  if (!me || (encounters.isPending && links.isPending)) return { kind: 'loading' };
  const e = encounters.data;
  const waved = e?.incoming ?? [];
  const first = waved[0];
  if (first) return { kind: 'waved', name: first.from.displayName, pet: first.from.pet, more: waved.length - 1 };
  const unread = (links.data ?? []).filter((l) => l.status !== 'archived' && l.unread > 0).sort((a, b) => (b.lastMessage?.at ?? '').localeCompare(a.lastMessage?.at ?? ''))[0];
  if (unread) return { kind: 'wrote', linkId: unread.id, name: unread.other.displayName, pet: unread.other.pet, preview: unread.lastMessage?.preview ?? null };
  const loc = me.identity.location;
  const noPlace = !loc.consentAt && !loc.zone && !loc.chosenCityActive;
  if (noPlace && me.visionTestDone && !opts.locationRefused) return { kind: 'location' };
  const fresh = (e?.suggestions ?? []).filter((s) => !s.waved);
  if (fresh.length) return { kind: 'present', count: fresh.length, people: fresh.slice(0, 3).map((s) => s.user.pet), mutual: fresh.find((s) => s.mutualName)?.mutualName ?? null };
  if (!me.visionTestDone) return { kind: 'vision' };
  if (noPlace) return { kind: 'location' };
  return { kind: 'empty' };
}
