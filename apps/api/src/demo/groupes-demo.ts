import { Inject, Injectable } from '@nestjs/common';
import { type Day, addDays, dayOf, lastClosedDay, parisHourOf } from '@blowy/domain';
import type {
  GroupDayRecord,
  GroupMemberRecord,
  GroupMessageRecord,
  GroupRecord,
} from '../modules/groups/ports';
import { GroupCore } from '../modules/groups/application/group-core';
import { GROUP_DAYS, type TogetherFixtures } from '../modules/groups/tokens';
import type { GroupDaysRepository } from '../modules/groups/ports';
import type { HabitChecksRepository, HabitRecord, HabitsRepository } from '../modules/rituels/ports';
import { HABIT_CHECKS, HABITS } from '../modules/rituels/tokens';
import type { Clock } from '../shared/clock';
import type { Ids } from '../shared/ids';
import { CLOCK, IDS } from '../shared/tokens';
import {
  DEMO_CHLOE,
  DEMO_INES,
  DEMO_LEA,
  DEMO_MALO,
  DEMO_NOE,
  DEMO_PEOPLE,
  DEMO_SASHA,
  DEMO_YANIS,
} from './demo';

/** Habitudes des personnes de démo (celles des rituels reçoivent leur historique), suivies depuis 30 jours, tenues presque chaque jour. */
const DEMO_EXTRA_HABITS: readonly { id: string; habits: readonly string[] }[] = [
  { id: DEMO_LEA, habits: ['voir_un_ami'] },
  { id: DEMO_MALO, habits: ['marcher', 'sport'] },
  { id: DEMO_SASHA, habits: ['lire', 'plantes'] },
  { id: DEMO_INES, habits: ['marcher'] },
  { id: DEMO_YANIS, habits: ['marcher', 'sport'] },
  { id: DEMO_CHLOE, habits: ['marcher', 'sport', 'lire'] },
  { id: DEMO_NOE, habits: ['marcher', 'lire'] },
];

/** Personnes comptées « dans ta zone » pour la suggestion « la tenir ensemble » en démo (Audience s'applique toujours). */
export const DEMO_TOGETHER: readonly string[] = [DEMO_CHLOE, DEMO_YANIS, DEMO_NOE];

export const demoTogetherFixtures: TogetherFixtures = {
  candidatesFor: async (userId) => (DEMO_PEOPLE.some((p) => p.id === userId) ? [] : [...DEMO_TOGETHER]),
};

/**
 * Groupes du monde de démo (docs/GROUPES.md, « Démo ») : à chaque inscription locale, la personne trouve
 * - « Marche du matin » : groupe d'habitude (marcher) avec Léa et Inès, 10 jours d'histoire, 4 vies, série de 3 ;
 *   aujourd'hui Léa a marché, Inès et toi pas encore ;
 * - « Les potes du 11e » : groupe libre avec Malo et Yanis, quelques messages ;
 * - une invitation de Sasha dans « Lecture du soir » (lire, avec Noé : il manque une personne pour démarrer) ;
 * - la suggestion « la tenir ensemble » (Chloé, Yanis, Noé comptés dans ta zone pour tes habitudes et Marcher) ;
 * - des habitudes communes avec Malo (le lien) et Léa (son coucou) : Marcher, séries et rigueurs sur 30 jours.
 */
@Injectable()
export class GroupesDemo {
  constructor(
    @Inject(GroupCore) private readonly core: GroupCore,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(HABIT_CHECKS) private readonly checks: HabitChecksRepository,
    @Inject(GROUP_DAYS) private readonly days: GroupDaysRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  private today(): Day {
    return dayOf(this.clock.now());
  }

  /** Une habitude suivie depuis `sinceDays` jours ; `keep` : jours tenus (relatifs à aujourd'hui, 0 = aujourd'hui). */
  private async habit(
    userId: string,
    habitId: string,
    sinceDays: number,
    keep: (offset: number) => boolean,
  ): Promise<void> {
    const today = this.today();
    let record: HabitRecord | undefined = (await this.habits.listActive(userId)).find(
      (h) => h.habitId === habitId,
    );
    if (!record) {
      record = {
        id: this.ids.uuid(),
        userId,
        habitId,
        rhythm: 'daily',
        proofHour: 18,
        createdAt: `${addDays(today, -sinceDays)}T07:00:00.000Z`,
        archivedAt: null,
        askedOn: null,
      };
      await this.habits.create(record);
    }
    for (let offset = sinceDays - 1; offset >= 0; offset--) {
      if (!keep(offset)) continue;
      const day = addDays(today, -offset);
      await this.checks.upsert({
        id: this.ids.uuid(),
        habitRef: record.id,
        userId,
        day,
        verdict: 'yes',
        line: '',
        photoId: null,
        createdAt: `${day}T17:00:00.000Z`,
      });
    }
  }

  /** Au démarrage : habitudes et historiques des personnes de démo. */
  async seed(): Promise<void> {
    for (const p of DEMO_EXTRA_HABITS)
      for (const h of p.habits) await this.habit(p.id, h, 30, (o) => o > 0 && o % 6 !== 0);
    // Léa : Marcher tenu presque tous les jours, et aujourd'hui.
    await this.habit(DEMO_LEA, 'marcher', 30, (o) => o % 9 !== 4);
  }

  private member(
    groupId: string,
    userId: string,
    status: GroupMemberRecord['status'],
    at: string,
    invitedBy: string | null = null,
  ): GroupMemberRecord {
    return {
      groupId,
      userId,
      status,
      invitedBy,
      joinedAt: status === 'active' ? at : null,
      leftAt: null,
      lastReadAt: status === 'active' ? at : null,
      notifiedAt: null,
      createdAt: at,
    };
  }

  private group(over: Partial<GroupRecord> & Pick<GroupRecord, 'name' | 'kind'>): GroupRecord {
    const at = this.clock.now().toISOString();
    return {
      id: this.ids.uuid(),
      habitId: null,
      status: 'active',
      createdBy: null,
      lives: 5,
      streak: 0,
      bestStreak: 0,
      cleanDays: 0,
      startedOn: null,
      evaluatedThrough: null,
      fromTogether: false,
      closedAt: null,
      closedReason: null,
      createdAt: at,
      updatedAt: at,
      ...over,
    };
  }

  private async text(groupId: string, authorId: string, body: string, at: string): Promise<void> {
    const m: GroupMessageRecord = {
      id: this.ids.uuid(),
      groupId,
      authorKind: 'user',
      authorId,
      kind: 'text',
      body,
      event: null,
      eventVars: {},
      createdAt: at,
    };
    await this.core.messages.add([m]);
  }

  async welcome(userId: string): Promise<void> {
    const now = this.clock.now();
    const today = this.today();
    const ago = (days: number, hour = 9): string =>
      `${addDays(today, -days)}T${String(hour).padStart(2, '0')}:00:00.000Z`;
    await this.habit(userId, 'marcher', 1, () => false);

    // 1. Groupe d'habitude avec histoire.
    const started = addDays(today, -10);
    const through = lastClosedDay(today, parisHourOf(now));
    const walk = this.group({
      name: 'Marche du matin',
      kind: 'habit',
      habitId: 'marcher',
      createdBy: DEMO_LEA,
      startedOn: started,
      evaluatedThrough: through,
      createdAt: ago(10, 7),
      lives: 4,
      streak: 0,
      bestStreak: 5,
    });
    await this.core.groups.create(walk);
    for (const id of [DEMO_LEA, DEMO_INES, userId])
      await this.core.members.put(this.member(walk.id, id, 'active', ago(10, 7)));
    let streak = 0;
    let best = 0;
    let lives = 5;
    for (let d = addDays(started, 1); d <= through; d = addDays(d, 1)) {
      const missed = d === addDays(today, -4);
      const day: GroupDayRecord = {
        groupId: walk.id,
        day: d,
        outcome: missed ? 'missed' : 'kept',
        members: { [DEMO_LEA]: 'kept', [DEMO_INES]: missed ? 'missed' : 'kept', [userId]: 'kept' },
        livesAfter: missed ? (lives -= 1) : lives,
        streakAfter: missed ? (streak = 0) : (streak += 1),
        createdAt: `${d}T11:00:00.000Z`,
      };
      best = Math.max(best, streak);
      await this.days.insertIfAbsent(day);
    }
    await this.core.groups.update(walk.id, { lives, streak, bestStreak: Math.max(best, 5) });
    await this.core.event(walk.id, 'started', { count: 3 }, null, ago(10, 8));
    await this.text(walk.id, DEMO_LEA, 'Petit tour au canal ce matin. Qui vient demain ?', ago(1, 8));
    await this.text(walk.id, DEMO_INES, 'Moi ! 8 h ?', ago(1, 9));
    await this.core.event(walk.id, 'life_lost', { count: 4 }, null, ago(3, 11));
    await this.text(walk.id, DEMO_LEA, 'Fait pour aujourd’hui.', ago(0, 7));

    // 2. Groupe libre.
    const potes = this.group({
      name: 'Les potes du 11e',
      kind: 'free',
      createdBy: DEMO_MALO,
      startedOn: addDays(today, -3),
      createdAt: ago(3),
    });
    await this.core.groups.create(potes);
    for (const id of [DEMO_MALO, DEMO_YANIS, userId])
      await this.core.members.put(this.member(potes.id, id, 'active', ago(3)));
    await this.core.event(potes.id, 'started', { count: 3 }, null, ago(3, 10));
    await this.text(potes.id, DEMO_MALO, 'Apéro jeudi ?', ago(1, 17));
    await this.text(potes.id, DEMO_YANIS, 'Partant. Je ramène des chips.', ago(0, 8));

    // 3. Invitation en attente (groupe en formation, 2 membres).
    const read = this.group({
      name: 'Lecture du soir',
      kind: 'habit',
      habitId: 'lire',
      status: 'forming',
      createdBy: DEMO_SASHA,
      createdAt: ago(1),
    });
    await this.core.groups.create(read);
    for (const id of [DEMO_SASHA, DEMO_NOE])
      await this.core.members.put(this.member(read.id, id, 'active', ago(1)));
    await this.core.members.put(this.member(read.id, userId, 'invited', ago(0, 8), DEMO_SASHA));

    // 4. Suggestion « ensemble » : les personnes comptées tiennent aussi les habitudes de la personne.
    for (const h of await this.habits.listActive(userId))
      for (const id of DEMO_TOGETHER) await this.habit(id, h.habitId, 30, (o) => o > 0 && o % 5 !== 0);
  }
}
