import { type RenameRule, dayOf, renameRule } from '@blowy/domain';
import { hasPlus } from '../../me/application/plus';
import type { Profile } from '../../me/ports';
import type { PetRecord } from '../ports';
import { type Locale, formatDate } from '@blowy/content';

/** Règle du changement de nom appliquée à un pet et à sa personne, à l'instant `now` (jours de Paris). */
export const renameStateOf = (pet: Pick<PetRecord, 'renamedAt'>, profile: Pick<Profile, 'plusUntil'> | null, now: Date): RenameRule =>
  renameRule({
    lastRenamedOn: pet.renamedAt ? dayOf(new Date(pet.renamedAt)) : null,
    today: dayOf(now),
    plus: hasPlus(profile, now),
  });

/** « 14 janvier » (l'année seulement si elle change), pour les messages d'erreur. */
export function frenchDay(day: string, today: string, locale: Locale = 'fr'): string {
  const date = new Date(`${day}T12:00:00Z`);
  const withYear = day.slice(0, 4) !== today.slice(0, 4);
  return formatDate(locale, date, { timeZone: 'UTC', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });
}
