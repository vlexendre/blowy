/**
 * Présentation PURE d'une sortie (`OutingView`, §7.5) pour les écrans V5 : libellés de dates,
 * composition anonyme, calendrier (lieu/prénoms à J-1 18 h, visages à J −3 h), règle
 * d'annulation, vignettes du groupe. Aucune donnée inventée : un champ absent du contrat donne
 * un libellé absent. Testé (presenters.test.ts).
 */
import type { OutingMemberView, OutingView } from '@blowy/api-contract';
import type { ActivityKind, Species } from '@blowy/domain';
import {
  dayLong,
  dayShortTime,
  DEFAULT_TZ,
  NBSP,
  timeRange,
  weekdayName,
} from '../../../core/format/dates';

export type OutingPhase =
  | 'invited'
  | 'going'
  | 'confirmed'
  | 'faces'
  | 'checkin'
  | 'checkedIn'
  | 'done'
  | 'cancelled'
  | 'declined';

/** Phase vue par MOI (état de la sortie + de ma place + horloge). */
export function outingPhase(
  o: Pick<OutingView, 'status' | 'mySeat' | 'timeline'>,
  now: number,
): OutingPhase {
  const seat = o.mySeat.status;
  if (o.status === 'CANCELLED') return 'cancelled';
  if (seat === 'DECLINED' || seat === 'EXPIRED' || seat === 'CANCELLED') return 'declined';
  if (seat === 'INVITED' || seat === 'HELD') return 'invited';
  if (o.status === 'DONE' || seat === 'ATTENDED' || seat === 'NO_SHOW') return 'done';
  if (seat === 'CHECKED_IN') return 'checkedIn';
  if (o.status === 'CHECKIN_OPEN') return 'checkin';
  if (now >= Date.parse(o.timeline.photoRevealAt)) return 'faces';
  if (o.status === 'CONFIRMED' || now >= Date.parse(o.timeline.lockAt)) return 'confirmed';
  return 'going';
}

const ACTIVITY_PLACE: Record<ActivityKind, string> = {
  DRINK_COFFEE: 'un bar',
  BRUNCH: 'un brunch',
  CLIMBING: 'une salle de bloc',
  WORKSHOP: 'un atelier',
  GAMES: 'un bar à jeux',
  EXHIBITION: 'une expo',
};

/** « du 11e » / « de la Croix-Rousse » / « de Lille-Wazemmes » à partir du nom de quartier. */
export function neighborhoodSuffix(name: string): string {
  const afterDot = name.includes('·') ? name.split('·').pop()!.trim() : name;
  const arr = /(\d+)(e|er)$/.exec(afterDot);
  if (arr) return `du ${arr[1]}${arr[2]}`;
  if (/^(la|le|les) /i.test(afterDot))
    return `de ${afterDot.replace(/^La /, 'la ').replace(/^Le /, 'le ')}`;
  if (/^Croix-Rousse$/i.test(afterDot)) return 'de la Croix-Rousse';
  return `de ${afterDot}`;
}

/** « un bar à jeux du 11e » (type de lieu, sans le nom : le lieu n'est connu qu'à J-1 18 h). */
export const placeHint = (o: Pick<OutingView, 'activity' | 'neighborhood'>): string =>
  `${ACTIVITY_PLACE[o.activity]} ${neighborhoodSuffix(o.neighborhood.name)}`;

export interface OutingHeadline {
  day: string; // « Jeudi 12 novembre »
  hours: string; // « 19 h 30 – 21 h 30 »
  line: string; // « Jeux de société · un bar à jeux du 11e »
}

export function headline(
  o: Pick<OutingView, 'startsAt' | 'endsAt' | 'activity' | 'neighborhood'>,
  activityLabel: string,
  tz = DEFAULT_TZ,
): OutingHeadline {
  return {
    day: dayLong(o.startsAt, tz, true),
    hours: timeRange(o.startsAt, o.endsAt, tz),
    line: `${activityLabel} · ${placeHint(o)}`,
  };
}

export interface Schedule {
  lock: string; // « mer. 11 nov. 18 h »
  faces: string; // « jeu. 12 nov. 16 h 30 »
  votesClose: string;
}

export const schedule = (o: Pick<OutingView, 'timeline'>, tz = DEFAULT_TZ): Schedule => ({
  lock: dayShortTime(o.timeline.lockAt, tz),
  faces: dayShortTime(o.timeline.photoRevealAt, tz),
  votesClose: dayShortTime(o.timeline.votesCloseAt, tz),
});

/** « 26–34 ans » (union des tranches de l'aperçu, jamais un âge exact). */
export const ageSpan = (min: number, max: number): string => `${min}–${max}${NBSP}ans`;

/** « 2 femmes, 3 hommes » (+ « 1 personne non-binaire », « 1 autre »), dans l'ordre de la maquette. */
export function gendersLine(
  g: Partial<Record<'WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED', number>>,
): string {
  const parts: string[] = [];
  const n = (k: keyof typeof g) => g[k] ?? 0;
  if (n('WOMAN')) parts.push(`${n('WOMAN')} ${n('WOMAN') > 1 ? 'femmes' : 'femme'}`);
  if (n('MAN')) parts.push(`${n('MAN')} ${n('MAN') > 1 ? 'hommes' : 'homme'}`);
  if (n('NON_BINARY'))
    parts.push(
      `${n('NON_BINARY')} ${n('NON_BINARY') > 1 ? 'personnes non-binaires' : 'personne non-binaire'}`,
    );
  if (n('UNDISCLOSED'))
    parts.push(`${n('UNDISCLOSED')} ${n('UNDISCLOSED') > 1 ? 'autres' : 'autre'}`);
  return parts.join(', ');
}

export const teamMates = (o: Pick<OutingView, 'members'>): OutingMemberView[] =>
  o.members.filter((m) => m.inMyTeam);

/** Ligne de composition : Trouvée (« …, toi compris ») ou fiche (« · toi et Tom ensemble, 3 nouvelles personnes »). */
export function compositionLine(
  o: Pick<OutingView, 'preview' | 'members' | 'capacity'>,
  variant: 'found' | 'detail',
): string | null {
  const p = o.preview;
  if (!p) return null;
  const head = `${p.size} personnes · ${ageSpan(p.ageMin, p.ageMax)} · ${gendersLine(p.genders)}`;
  const team = teamMates(o)
    .map((m) => m.firstName)
    .filter((x): x is string => !!x);
  const fresh = Math.max(0, p.size - 1 - team.length);
  // V5.5 (test des 5 s) : « …, toi compris · 4 personnes à découvrir la veille » /
  // « … · Tom vient avec toi · 3 nouvelles personnes, à découvrir la veille ».
  if (variant === 'found' || !team.length)
    return `${head}, toi compris · ${fresh} ${fresh > 1 ? 'personnes' : 'personne'} à découvrir la veille`;
  return `${head}, toi compris · ${team.join(' et ')} ${team.length > 1 ? 'viennent' : 'vient'} avec toi · ${fresh} ${fresh > 1 ? 'nouvelles personnes' : 'nouvelle personne'}, à découvrir la veille`;
}

/** Frise des 3 jalons (Sortie, Tu y vas) : « Mer. 11 nov. 18 h » · lieu et prénoms ; visages ; la sortie. */
export function milestones(
  o: Pick<OutingView, 'startsAt' | 'timeline'>,
  labels: { lock: string; faces: string; outing: string },
  tz = DEFAULT_TZ,
): { when: string; what: string }[] {
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  return [
    { when: cap(dayShortTime(o.timeline.lockAt, tz)), what: labels.lock },
    { when: cap(dayShortTime(o.timeline.photoRevealAt, tz)), what: labels.faces },
    { when: cap(dayShortTime(o.startsAt, tz)), what: labels.outing },
  ];
}

export interface GroupSlotModel {
  key: string;
  kind: 'me' | 'known' | 'unknown';
  species?: Species;
  label: string;
}

/**
 * Vignettes du groupe : moi, puis les personnes que je connais (ma team, prénom visible), puis
 * les places « à découvrir » jusqu'à la taille du groupe (aucun pet d'inconnu avant la confirmation).
 */
export function groupSlots(
  o: Pick<OutingView, 'members' | 'preview' | 'capacity'>,
  mySpecies: Species,
  labels: { me: string; unknown: string },
): GroupSlotModel[] {
  const size = o.preview?.size ?? o.capacity;
  const known = teamMates(o);
  const slots: GroupSlotModel[] = [{ key: 'me', kind: 'me', species: mySpecies, label: labels.me }];
  for (const m of known)
    slots.push({
      key: m.userId,
      kind: 'known',
      species: m.pet.species,
      label: m.firstName ?? m.pet.name,
    });
  while (slots.length < size)
    slots.push({ key: `u${slots.length}`, kind: 'unknown', label: labels.unknown });
  return slots.slice(0, size);
}

/** Libellé de financement de MA place (jamais celui des autres). */
export function fundingKind(
  o: Pick<OutingView, 'mySeat'>,
  firstOutingFree: boolean | undefined,
): 'free' | 'plus' | 'credit' | 'paid' | 'unknown' {
  const f = o.mySeat.funding;
  if (f === 'FREE_FIRST' || (!f && firstOutingFree)) return 'free';
  if (f === 'PLUS_INCLUDED') return 'plus';
  if (f === 'CREDIT') return 'credit';
  if (f === 'PAID') return 'paid';
  return firstOutingFree === false ? 'paid' : 'unknown';
}

/** « 4,99 € » depuis des centimes entiers. */
export function euros(cents: number): string {
  const s = (cents / 100).toFixed(2).replace('.', ',');
  return `${s}${NBSP}€`;
}

/** « Jeudi » (jour de la sortie, capitalisé). */
export const weekdayLabel = (iso: string, tz = DEFAULT_TZ): string => weekdayName(iso, tz, true);

/** « 26–29 ans » depuis la tranche du contrat (`26_29`, `50_PLUS`). */
export function bracketLabel(r: string | undefined): string {
  if (!r) return '';
  if (r.endsWith('_PLUS')) return `${r.split('_')[0]}${NBSP}ans et plus`;
  const [a, b] = r.split('_');
  return `${a}–${b}${NBSP}ans`;
}
