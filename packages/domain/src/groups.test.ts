import { describe, expect, it } from 'vitest';
import { addDays } from './days';
import { entitlements } from './entitlements';
import {
  GROUP_MAX_LIVES,
  type GroupHabitState,
  type MemberHabitState,
  NEW_GROUP_HABIT_STATE,
  type TogetherCandidate,
  applyGroupDay,
  canJoinAnotherGroup,
  canPlaceJokerFor,
  groupDayOutcome,
  groupDaysToSettle,
  groupSeatsLeft,
  groupStatusAfter,
  habitDueOn,
  habitRigour,
  isDayClosed,
  jokerCost,
  lastClosedDay,
  memberDayStatus,
  personRigour,
  sharedHabitIds,
  togetherCount,
  wakeGroup,
} from './groups';

/** Mercredi 18 novembre 2026. */
const TODAY = '2026-11-18';
const days = (from: string, n: number): string[] => Array.from({ length: n }, (_, i) => addDays(from, i));

describe('rigueur', () => {
  it('moins de 7 jours dus : trop tôt pour le dire', () => {
    const r = habitRigour(
      { rhythm: 'daily', keptDays: days('2026-11-14', 4), jokerDays: [], since: '2026-11-14' },
      TODAY,
    );
    expect(r.value).toBeNull();
    expect(r.due).toBeLessThan(7);
  });
  it('tous les jours : part des jours tenus sur 28 jours, aujourd’hui seulement s’il est fait', () => {
    const since = addDays(TODAY, -40);
    const kept = days(addDays(TODAY, -27), 27).filter((_, i) => i % 3 !== 0); // 18 sur les 27 jours d'avant
    const r = habitRigour({ rhythm: 'daily', keptDays: kept, jokerDays: [], since }, TODAY);
    expect(r).toEqual({ value: Math.round((100 * 18) / 27), kept: 18, due: 27 });
    const withToday = habitRigour(
      { rhythm: 'daily', keptDays: [...kept, TODAY], jokerDays: [], since },
      TODAY,
    );
    expect(withToday.due).toBe(28);
    expect(withToday.kept).toBe(19);
  });
  it('un jour couvert par un joker ne compte ni pour ni contre', () => {
    const since = addDays(TODAY, -10);
    const kept = days(since, 10).filter((d) => d !== addDays(TODAY, -3));
    const base = habitRigour({ rhythm: 'daily', keptDays: kept, jokerDays: [], since }, TODAY);
    const joker = habitRigour(
      { rhythm: 'daily', keptDays: kept, jokerDays: [addDays(TODAY, -3)], since },
      TODAY,
    );
    expect(base).toEqual({ value: 90, kept: 9, due: 10 });
    expect(joker).toEqual({ value: 100, kept: 9, due: 9 });
  });
  it('3 fois par semaine : seuls les jours sans marge sont dus', () => {
    // Semaine du lundi 2 novembre : rien jusqu'à jeudi (marge), vendredi, samedi, dimanche dus et manqués.
    expect(habitDueOn('three_per_week', [], '2026-11-05', '2026-10-01')).toBe(false);
    expect(habitDueOn('three_per_week', [], '2026-11-06', '2026-10-01')).toBe(true);
    // Deux jours tenus : il reste de la marge jusqu'au dimanche.
    expect(habitDueOn('three_per_week', ['2026-11-02', '2026-11-03'], '2026-11-07', '2026-10-01')).toBe(
      false,
    );
    expect(habitDueOn('three_per_week', ['2026-11-02', '2026-11-03'], '2026-11-08', '2026-10-01')).toBe(true);
    // Objectif atteint : plus rien n'est dû.
    expect(
      habitDueOn('three_per_week', ['2026-11-02', '2026-11-03', '2026-11-04'], '2026-11-08', '2026-10-01'),
    ).toBe(false);
    // Semaine de départ au prorata : commencée samedi, une fois suffit.
    expect(habitDueOn('three_per_week', [], '2026-11-07', '2026-11-07')).toBe(false);
    expect(habitDueOn('three_per_week', [], '2026-11-08', '2026-11-07')).toBe(true);
  });
  it('3 fois par semaine tenu chaque semaine : 100 %', () => {
    const kept = [
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-26',
      '2026-10-28',
      '2026-10-30',
      '2026-11-02',
      '2026-11-04',
      '2026-11-06',
      '2026-11-09',
      '2026-11-11',
      '2026-11-13',
      '2026-11-16',
    ];
    const r = habitRigour(
      { rhythm: 'three_per_week', keptDays: kept, jokerDays: [], since: '2026-10-01' },
      TODAY,
    );
    expect(r.value).toBe(100);
  });
  it('rigueur d’une personne : pondérée par les jours dus', () => {
    const r = personRigour([
      { value: 100, kept: 20, due: 20 },
      { value: 0, kept: 0, due: 5 },
      { value: null, kept: 1, due: 2 },
    ]);
    expect(r).toEqual({ value: Math.round((100 * 21) / 27), kept: 21, due: 27 });
    expect(personRigour([]).value).toBeNull();
  });
  it('habitudes communes, dans l’ordre des siennes', () => {
    expect(sharedHabitIds(['sport', 'lire', 'marcher'], ['marcher', 'sport'])).toEqual(['sport', 'marcher']);
  });
});

describe('jour d’un groupe d’habitude', () => {
  const member = (over: Partial<MemberHabitState> = {}): MemberHabitState => ({
    rhythm: 'daily',
    keptDays: [],
    jokerDays: [],
    joinedOn: '2026-11-01',
    since: '2026-11-01',
    ...over,
  });
  it('à jour : tenu ou joker ; sinon manqué une fois le jour jugé, en attente avant', () => {
    const day = '2026-11-17';
    expect(memberDayStatus(member({ keptDays: [day] }), day, true)).toBe('kept');
    expect(memberDayStatus(member({ jokerDays: [day] }), day, true)).toBe('joker');
    expect(memberDayStatus(member(), day, true)).toBe('missed');
    expect(memberDayStatus(member(), day, false)).toBe('pending');
    // Arrivé ce jour-là : compte à partir du lendemain.
    expect(memberDayStatus(member({ joinedOn: day }), day, true)).toBe('not_due');
    // Ne tient plus l'habitude : due chaque jour.
    expect(memberDayStatus(member({ rhythm: null }), day, true)).toBe('missed');
  });
  it('jour jugé : skipped si personne n’avait rien à faire, missed au moindre membre en retard', () => {
    expect(groupDayOutcome(['not_due', 'not_due'])).toBe('skipped');
    expect(groupDayOutcome(['kept', 'joker', 'not_due'])).toBe('kept');
    expect(groupDayOutcome(['kept', 'missed', 'kept'])).toBe('missed');
  });
  it('vies : −1 un jour manqué (série à zéro), +1 après 7 jours sans faute, 5 au plus', () => {
    let s: GroupHabitState = { ...NEW_GROUP_HABIT_STATE, streak: 4, bestStreak: 4 };
    const miss = applyGroupDay(s, 'missed');
    expect(miss.state).toMatchObject({ lives: 4, streak: 0, bestStreak: 4, cleanDays: 0, asleep: false });
    expect(miss.lifeLost).toBe(true);
    s = miss.state;
    for (let i = 0; i < 6; i++) s = applyGroupDay(s, i === 2 ? 'skipped' : 'kept').state;
    expect(s.lives).toBe(4);
    expect(s.streak).toBe(5);
    const seventh = applyGroupDay(s, 'kept');
    expect(seventh.lifeGained).toBe(true);
    expect(seventh.state.lives).toBe(5);
    expect(seventh.state.cleanDays).toBe(0);
    // Déjà à 5 : rien de plus.
    let full: GroupHabitState = { ...NEW_GROUP_HABIT_STATE };
    for (let i = 0; i < 7; i++) full = applyGroupDay(full, 'kept').state;
    expect(full.lives).toBe(GROUP_MAX_LIVES);
  });
  it('paliers de série', () => {
    expect(applyGroupDay({ ...NEW_GROUP_HABIT_STATE, streak: 2 }, 'kept').milestone).toBe(3);
    expect(applyGroupDay({ ...NEW_GROUP_HABIT_STATE, streak: 3 }, 'kept').milestone).toBeNull();
  });
  it('à zéro vie le groupe s’endort, ne bouge plus, et se réveille avec 5 vies et une série à zéro', () => {
    const last = applyGroupDay({ ...NEW_GROUP_HABIT_STATE, lives: 1, streak: 9, bestStreak: 12 }, 'missed');
    expect(last.fellAsleep).toBe(true);
    expect(last.state.asleep).toBe(true);
    expect(applyGroupDay(last.state, 'kept').state).toBe(last.state);
    expect(wakeGroup(last.state)).toEqual({
      lives: 5,
      streak: 0,
      bestStreak: 12,
      cleanDays: 0,
      asleep: false,
    });
  });
});

describe('jokers et fenêtre de midi', () => {
  it('hier se juge à midi ; avant, c’est l’avant-veille', () => {
    expect(lastClosedDay(TODAY, 11)).toBe('2026-11-16');
    expect(lastClosedDay(TODAY, 12)).toBe('2026-11-17');
    expect(isDayClosed('2026-11-17', TODAY, 11)).toBe(false);
    expect(isDayClosed('2026-11-17', TODAY, 12)).toBe(true);
  });
  it('un joker se pose pour aujourd’hui, ou pour hier jusqu’au lendemain midi', () => {
    expect(canPlaceJokerFor(TODAY, TODAY, 20)).toBe(true);
    expect(canPlaceJokerFor('2026-11-17', TODAY, 11)).toBe(true);
    expect(canPlaceJokerFor('2026-11-17', TODAY, 12)).toBe(false);
    expect(canPlaceJokerFor('2026-11-16', TODAY, 8)).toBe(false);
  });
  it('même réserve que la série du défi : un jour déjà couvert est gratuit', () => {
    expect(jokerCost([], TODAY, 1)).toBe('one');
    expect(jokerCost(['2026-11-16'], TODAY, 1)).toBe('none_left');
    expect(jokerCost(['2026-11-16'], TODAY, 3)).toBe('one');
    expect(jokerCost([TODAY], TODAY, 1)).toBe('free');
    // La semaine d'avant ne compte pas.
    expect(jokerCost(['2026-11-15'], TODAY, 1)).toBe('one');
  });
  it('jours à juger : du lendemain du démarrage, rattrapage borné, idempotent', () => {
    expect(groupDaysToSettle('2026-11-14', null, '2026-11-17')).toEqual([
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
    ]);
    expect(groupDaysToSettle('2026-11-14', '2026-11-17', '2026-11-17')).toEqual([]);
    expect(groupDaysToSettle('2026-10-01', '2026-10-01', '2026-11-17', 5)).toHaveLength(5);
  });
});

describe('taille et limites', () => {
  it('gratuit : 2 groupes ; Minimoa+ : 10', () => {
    expect(canJoinAnotherGroup(1, entitlements(false).groups)).toBe(true);
    expect(canJoinAnotherGroup(2, entitlements(false).groups)).toBe(false);
    expect(canJoinAnotherGroup(9, entitlements(true).groups)).toBe(true);
    expect(canJoinAnotherGroup(10, entitlements(true).groups)).toBe(false);
  });
  it('3 à 8 membres : démarre à 3, 8 places en comptant les invitations', () => {
    expect(groupStatusAfter('forming', 2)).toBe('forming');
    expect(groupStatusAfter('forming', 3)).toBe('active');
    expect(groupStatusAfter('active', 2)).toBe('active');
    expect(groupStatusAfter('closed', 5)).toBe('closed');
    expect(groupSeatsLeft(5, 3)).toBe(0);
    expect(groupSeatsLeft(3, 1)).toBe(4);
  });
});

describe('suggestion « la tenir ensemble »', () => {
  const ok: TogetherCandidate = {
    holdsHabit: true,
    sharesHabits: true,
    discreet: false,
    hidden: false,
    inZone: true,
    compatibility: 80,
  };
  const viewer = { sharesHabits: true, discreet: false };
  it('au moins 2 personnes éligibles : seul le nombre', () => {
    expect(togetherCount(viewer, [ok])).toBeNull();
    expect(togetherCount(viewer, [ok, ok, ok])).toBe(3);
  });
  it('même habitude, réglage activé, pas discret, pas bloqué, même zone, vision ≥ 70', () => {
    const bad: TogetherCandidate[] = [
      { ...ok, holdsHabit: false },
      { ...ok, sharesHabits: false },
      { ...ok, discreet: true },
      { ...ok, hidden: true },
      { ...ok, inZone: false },
      { ...ok, compatibility: 69 },
      { ...ok, compatibility: null },
    ];
    expect(togetherCount(viewer, [ok, ...bad])).toBeNull();
    expect(togetherCount(viewer, [ok, { ...ok, compatibility: 70 }])).toBe(2);
  });
  it('rien pour qui cache ses habitudes ou est en mode discret', () => {
    expect(togetherCount({ sharesHabits: false, discreet: false }, [ok, ok])).toBeNull();
    expect(togetherCount({ sharesHabits: true, discreet: true }, [ok, ok])).toBeNull();
  });
});
