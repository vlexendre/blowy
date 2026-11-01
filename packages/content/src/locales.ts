/** Construction du dictionnaire i18n plat {clé: texte fr} depuis les référentiels (source unique). */
import { SPECIES_LABEL_KEY } from '@blowy/domain';
import {
  ANONYMOUS_WORD_ENTRIES,
  DATE_SPOT_BY_SUNDAY,
  DEPARTURE_TEMPLATES,
  EGG_QUESTIONS,
  LIMIT_ENTRIES,
  MISSIONS,
  NOTIFICATION_TEMPLATES,
  PASSION_ENTRIES,
  PET_LINES,
  SCHOOL_ENTRIES,
  SUNDAY_ENTRIES,
  assertUniqueKeys,
} from './catalog/index.js';

const SPECIES_FR: Record<keyof typeof SPECIES_LABEL_KEY, string> = { GASTON: 'Gaston', PIA: 'Pia', NINO: 'Nino', SUZIE: 'Suzie' };

export function buildFrLocale(): Record<string, string> {
  const pairs: Array<[string, string]> = [
    ...Object.entries(SPECIES_LABEL_KEY).map(([id, key]) => [key, SPECIES_FR[id as keyof typeof SPECIES_FR]] as [string, string]),
    ...[...SCHOOL_ENTRIES, ...SUNDAY_ENTRIES, ...PASSION_ENTRIES, ...LIMIT_ENTRIES, ...ANONYMOUS_WORD_ENTRIES, ...Object.values(DATE_SPOT_BY_SUNDAY)].map((e) => [e.key, e.fr] as [string, string]),
    ...EGG_QUESTIONS.flatMap((q) => [[q.key, q.fr] as [string, string], ...q.options.map((o) => [o.key, o.fr] as [string, string])]),
    ...MISSIONS.flatMap((m) => [
      [m.key, m.title] as [string, string],
      [`${m.key}.criteria`, m.criteria.join(' ; ')] as [string, string],
      [`${m.key}.alternative`, m.accessibleAlternative] as [string, string],
    ]),
    ...PET_LINES.map((l) => [l.key, l.fr] as [string, string]),
    ...[...DEPARTURE_TEMPLATES, ...NOTIFICATION_TEMPLATES].map((t) => [t.key, t.fr] as [string, string]),
    ['memory.joint_mission', 'Mission à deux'],
    ['memory.gift', 'Un cadeau dans la maison'],
  ];
  assertUniqueKeys(pairs.map(([k]) => k));
  return Object.fromEntries(pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
