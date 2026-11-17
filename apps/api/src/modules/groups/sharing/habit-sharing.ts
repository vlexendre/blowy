import { Inject, Injectable } from '@nestjs/common';
import { habitById } from '@blowy/content';
import type { Rigour as RigourDto, SharedHabits } from '@blowy/contract';
import {
  type Day,
  type Rigour,
  addDays,
  dayOf,
  habitRigour,
  habitStreak,
  personRigour,
  proofCounts,
  sharedHabitIds,
} from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { requestLocale } from '../../../shared/locale';
import { CLOCK, ENCOUNTERS, LINKS, PROFILES } from '../../../shared/tokens';
import type { EncountersRepository } from '../../encounters/ports';
import type { LinksRepository } from '../../links/ports';
import type { ProfilesRepository } from '../../me/ports';
import type {
  HabitCheckRecord,
  HabitChecksRepository,
  HabitRecord,
  HabitsRepository,
} from '../../rituels/ports';
import { HABIT_CHECKS, HABITS } from '../../rituels/tokens';
import { Audience } from '../../safety/application/audience';
import type { HabitJokersRepository } from '../ports';
import { HABIT_JOKERS } from '../tokens';

/** Historique relu : la série d'une habitude (au-delà, elle plafonne) et la rigueur sur 28 jours. */
export const SHARING_HISTORY_DAYS = 120;

export const toRigourDto = (r: Rigour): RigourDto => ({
  value: r.value,
  tooEarly: r.value === null,
  dueDays: r.due,
});

/** Ce qu'on sait des habitudes d'une personne aujourd'hui : par habitude, série et rigueur ; et sa rigueur. */
export interface HabitsPicture {
  habits: { record: HabitRecord; keptDays: Day[]; jokerDays: Day[]; streak: number; rigour: Rigour }[];
  rigour: Rigour;
}

export function pictureOf(
  habits: readonly HabitRecord[],
  checks: readonly HabitCheckRecord[],
  jokerDays: readonly Day[],
  today: Day,
): HabitsPicture {
  const items = habits.map((record) => {
    const keptDays = checks
      .filter((c) => c.habitRef === record.id && proofCounts(c.verdict))
      .map((c) => c.day);
    const since = dayOf(new Date(record.createdAt));
    return {
      record,
      keptDays,
      jokerDays: [...jokerDays],
      streak: habitStreak(record.rhythm, keptDays, today),
      rigour: habitRigour({ rhythm: record.rhythm, keptDays, jokerDays, since }, today),
    };
  });
  return { habits: items, rigour: personRigour(items.map((h) => h.rigour)) };
}

/**
 * Habitudes partagées et rigueur (spéc §25). Ce qu'on montre de l'autre passe par `Audience` (« habits ») : rien pour
 * une personne bloquée, suspendue, supprimée, ou qui a coupé « Montrer mes habitudes ». La carte est réciproque : rien
 * non plus si la personne qui regarde a coupé le réglage. Jamais de photo ni d'heure : séries et rigueurs seulement.
 */
@Injectable()
export class HabitSharing {
  constructor(
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(HABIT_CHECKS) private readonly checks: HabitChecksRepository,
    @Inject(HABIT_JOKERS) private readonly jokers: HabitJokersRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
  ) {}

  /**
   * Personnes dont on peut montrer les habitudes à `viewerId` : ses liens (pas archivés), celles qui l'ont salué ou
   * qu'il a saluées, et celles que son minimoa lui présente dans cette même réponse (`shown`, calculé par le serveur).
   * Jamais un identifiant quelconque.
   */
  private async related(
    viewerId: string,
    otherIds: readonly string[],
    shown: ReadonlySet<string>,
  ): Promise<string[]> {
    const [links, involved] = await Promise.all([
      this.links.listForUsers([viewerId]),
      this.encounters.listInvolving(viewerId),
    ]);
    const known = new Set<string>(shown);
    for (const l of links) if (l.status !== 'archived') known.add(l.userA === viewerId ? l.userB : l.userA);
    for (const e of involved)
      if (e.status !== 'declined') known.add(e.fromUser === viewerId ? e.toUser : e.fromUser);
    return otherIds.filter((id) => known.has(id));
  }

  /** Habitudes, séries et rigueurs de plusieurs personnes (aucun filtre : à l'appelant de passer par `Audience`). */
  async pictures(userIds: readonly string[]): Promise<Map<string, HabitsPicture>> {
    const today = dayOf(this.clock.now());
    const from = addDays(today, -SHARING_HISTORY_DAYS);
    const habitLists = await Promise.all(userIds.map((id) => this.habits.listActive(id)));
    const all = habitLists.flat();
    const [checks, jokers] = await Promise.all([
      all.length > 0
        ? this.checks.listSince(
            all.map((h) => h.id),
            from,
          )
        : Promise.resolve([]),
      this.jokers.listSince(userIds, addDays(today, -40)),
    ]);
    const out = new Map<string, HabitsPicture>();
    userIds.forEach((id, i) => {
      const mine = jokers.filter((j) => j.userId === id).map((j) => j.day);
      out.set(id, pictureOf(habitLists[i] ?? [], checks, mine, today));
    });
    return out;
  }

  /**
   * Habitudes communes entre `viewerId` et chacune de ces personnes. Une personne n'apparaît dans la réponse que s'il y
   * a au moins une habitude commune à montrer (sinon rien du tout, pas même sa rigueur).
   */
  async sharedWith(
    viewerId: string,
    otherIds: readonly string[],
    shown: ReadonlySet<string> = new Set(),
  ): Promise<Map<string, SharedHabits>> {
    const out = new Map<string, SharedHabits>();
    if (otherIds.length === 0) return out;
    const viewer = await this.profiles.findById(viewerId);
    if (!viewer || viewer.showHabits === false) return out;
    const allowed = await this.related(viewerId, otherIds, shown);
    if (allowed.length === 0) return out;
    const visible = await this.audience.visibleIds(viewerId, allowed, 'habits');
    if (visible.size === 0) return out;
    const pictures = await this.pictures([viewerId, ...visible]);
    const mine = pictures.get(viewerId);
    if (!mine) return out;
    const locale = requestLocale();
    for (const otherId of visible) {
      const theirs = pictures.get(otherId);
      if (!theirs) continue;
      const common = sharedHabitIds(
        mine.habits.map((h) => h.record.habitId),
        theirs.habits.map((h) => h.record.habitId),
      );
      const habits = common.flatMap((habitId) => {
        const a = mine.habits.find((h) => h.record.habitId === habitId);
        const b = theirs.habits.find((h) => h.record.habitId === habitId);
        if (!a || !b) return [];
        return [
          {
            habitId,
            label: habitById(habitId, locale)?.label ?? habitId,
            mine: { rhythm: a.record.rhythm, streak: a.streak, rigour: toRigourDto(a.rigour) },
            theirs: { rhythm: b.record.rhythm, streak: b.streak, rigour: toRigourDto(b.rigour) },
          },
        ];
      });
      if (habits.length > 0) out.set(otherId, { theirRigour: toRigourDto(theirs.rigour), habits });
    }
    return out;
  }
}
