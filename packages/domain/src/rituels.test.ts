import { describe, expect, it } from 'vitest';
import { START_NEEDS, decayNeeds, needsOut, raiseSociability, shapeOf, wellbeing, careLevel, ENCOUNTER_QUOTA, SOCIABILITY_DECAY_PER_HOUR, NEED_DECAY_PER_HOUR } from './care';
import { dayOf } from './days';
import { ITEMS, ZERO_STATS, earnedItems } from './items';
import {
  DAILY_KINDS,
  type DailyCandidate,
  EVOLUTION_THRESHOLDS,
  OUTING_GAIN,
  STREAK_MILESTONES,
  type StreakState,
  ZERO_STREAK,
  advanceDaily,
  canAddHabit,
  completeStreakDay,
  evolutionOf,
  habitDay,
  habitStreak,
  isActiveWeek,
  isKindText,
  jokersLeft,
  linkNote,
  nextStreakMilestone,
  noticedMove,
  outingVerdict,
  parisHourOf,
  pickDailyChallenge,
  presentDailyCard,
  proofCounts,
  reviewDue,
  reviewWeekDue,
  reviewHighlights,
  reviewTip,
  seedOf,
  settleStreak,
  shouldAskProof,
  streakAtRisk,
  streakReward,
  streakWeek,
  weekDaysOf,
  weekStartOf,
  weekdayOf,
} from './rituels';
import { leastConfidentAxis, EMPTY_VISION } from './vision';

describe('sociabilité et forme', () => {
  it('forme = 60 % sociabilité + 40 % des trois petits besoins', () => {
    expect(wellbeing({ sociability: 100, hunger: 0, energy: 0, mood: 0 })).toBe(60);
    expect(wellbeing({ sociability: 0, hunger: 100, energy: 100, mood: 100 })).toBe(40);
    expect(wellbeing({ sociability: 50, hunger: 100, energy: 100, mood: 100 })).toBe(70);
    // Le plus bas des petits besoins pèse double dans leur part.
    expect(careLevel({ hunger: 20, energy: 100, mood: 100 })).toBe(60);
    expect(wellbeing({ sociability: 50, hunger: 20, energy: 100, mood: 100 })).toBe(54);
  });
  it('sans sortir, un minimoa bien nourri finit « bof » mais jamais en forme ; le quota suit la forme', () => {
    const fed = { sociability: 0, hunger: 100, energy: 100, mood: 100 };
    expect(shapeOf(fed)).toBe('bof');
    expect(ENCOUNTER_QUOTA[shapeOf(fed)]).toBe(6);
    expect(shapeOf({ ...fed, sociability: 34 })).toBe('en_forme');
    expect(shapeOf({ sociability: 0, hunger: 50, energy: 50, mood: 50 })).toBe('boude');
    expect(ENCOUNTER_QUOTA.boude).toBe(0);
  });
  it("la sociabilité baisse seule (36 points par jour), par pas entiers de 2 h", () => {
    expect(SOCIABILITY_DECAY_PER_HOUR * 24).toBe(36);
    expect(decayNeeds(START_NEEDS, 24).sociability).toBe(44);
    expect(decayNeeds(START_NEEDS, 2).sociability).toBe(77);
    expect(decayNeeds(START_NEEDS, 0)).toBe(START_NEEDS);
    for (const rate of [SOCIABILITY_DECAY_PER_HOUR, ...Object.values(NEED_DECAY_PER_HOUR)]) expect(Number.isInteger(rate * 2)).toBe(true);
  });
  it('elle monte, bornée à 100 et à 0', () => {
    expect(raiseSociability(START_NEEDS, 40).sociability).toBe(100);
    expect(raiseSociability({ ...START_NEEDS, sociability: 10 }, -30).sociability).toBe(0);
    expect(raiseSociability(START_NEEDS, 0)).toBe(START_NEEDS);
  });
  it('besoin de sortir sous 35', () => {
    expect(needsOut({ sociability: 34 })).toBe(true);
    expect(needsOut({ sociability: 35 })).toBe(false);
  });
  it('« Tu es sorti aujourd’hui ? » : déclaratif, la position confirme sans changer les points', () => {
    expect(outingVerdict('saw_people', null)).toEqual({ out: true, confirmed: false, gain: OUTING_GAIN.saw_people });
    expect(outingVerdict('saw_people', true)).toEqual({ out: true, confirmed: true, gain: 40 });
    expect(outingVerdict('walk', false)).toEqual({ out: true, confirmed: false, gain: 20 });
    expect(outingVerdict('not_yet', true)).toEqual({ out: false, confirmed: false, gain: 0 });
  });
});

describe('semaines (Paris)', () => {
  it('lundi → dimanche, à travers les mois et les années', () => {
    expect(weekdayOf('2026-11-16')).toBe(0); // lundi
    expect(weekdayOf('2026-11-15')).toBe(6); // dimanche
    expect(weekStartOf('2026-11-15')).toBe('2026-11-09');
    expect(weekStartOf('2027-01-01')).toBe('2026-12-28');
    expect(weekDaysOf('2028-02-29')).toEqual(['2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02', '2028-03-03', '2028-03-04', '2028-03-05']);
  });
  it('heure et jour de Paris, changement d’heure compris', () => {
    // Été (UTC+2) : 21 h 59 UTC = 23 h 59 à Paris, 22 h UTC = minuit le lendemain.
    expect(dayOf(new Date('2026-07-05T21:59:00Z'))).toBe('2026-07-05');
    expect(dayOf(new Date('2026-07-05T22:00:00Z'))).toBe('2026-07-06');
    expect(parisHourOf(new Date('2026-07-05T22:00:00Z'))).toBe(0);
    // Hiver (UTC+1).
    expect(dayOf(new Date('2026-11-15T22:59:00Z'))).toBe('2026-11-15');
    expect(parisHourOf(new Date('2026-11-15T18:00:00Z'))).toBe(19);
    // Nuit du passage à l'heure d'hiver (25 octobre 2026) : un jour de 25 h.
    expect(dayOf(new Date('2026-10-25T22:30:00Z'))).toBe('2026-10-25');
    expect(dayOf(new Date('2026-10-25T23:00:00Z'))).toBe('2026-10-26');
  });
  it('graine stable', () => {
    expect(seedOf('a', 'b')).toBe(seedOf('a', 'b'));
    expect(seedOf('a', 'b')).not.toBe(seedOf('a', 'c'));
  });
});

/** Fait le défi chacun de ces jours (dans l'ordre), avec `perWeek` jokers. */
const run = (days: string[], perWeek = 1, from: StreakState = ZERO_STREAK): StreakState =>
  days.reduce((s, d) => completeStreakDay(s, d, perWeek).state, from);

describe('série', () => {
  it('+1 par jour, une seule fois par jour, record gardé', () => {
    const s = run(['2026-11-09', '2026-11-10', '2026-11-10', '2026-11-11']);
    expect(s).toMatchObject({ current: 3, best: 3, lastDoneOn: '2026-11-11', jokerDays: [] });
    expect(completeStreakDay(s, '2026-11-11', 1).state).toEqual(s);
  });
  it('jour manqué sans joker : retour à 0, le record reste', () => {
    const s = run(['2026-11-09', '2026-11-10'], 0);
    const settled = settleStreak(s, '2026-11-12', 0);
    expect(settled).toMatchObject({ current: 0, best: 2 });
    const again = completeStreakDay(s, '2026-11-12', 0).state;
    expect(again).toMatchObject({ current: 1, best: 2, lastDoneOn: '2026-11-12' });
  });
  it('aujourd’hui n’est pas encore manqué', () => {
    const s = run(['2026-11-09']);
    expect(settleStreak(s, '2026-11-10', 0)).toBe(s);
    expect(streakAtRisk(settleStreak(s, '2026-11-10', 0), '2026-11-10')).toBe(true);
    expect(streakAtRisk(s, '2026-11-09')).toBe(false);
    expect(streakAtRisk(ZERO_STREAK, '2026-11-09')).toBe(false);
  });
  it('un joker par semaine protège un jour manqué ; le deuxième de la semaine remet à zéro', () => {
    const s = run(['2026-11-09', '2026-11-10']); // lundi, mardi
    const afterJoker = completeStreakDay(s, '2026-11-12', 1).state; // mercredi manqué → joker
    expect(afterJoker).toMatchObject({ current: 3, jokerDays: ['2026-11-11'] });
    expect(jokersLeft(afterJoker, '2026-11-12', 1)).toBe(0);
    // vendredi manqué, même semaine : plus de joker.
    expect(settleStreak(afterJoker, '2026-11-14', 1)).toMatchObject({ current: 0, best: 3 });
  });
  it('les jokers repartent le lundi (semaines de Paris) ; un trou à cheval sur deux semaines prend un joker dans chacune', () => {
    const s = run(['2026-11-13', '2026-11-14']); // vendredi, samedi
    // dimanche 15 et lundi 16 manqués : un joker de chaque semaine.
    const after = completeStreakDay(s, '2026-11-17', 1).state;
    expect(after).toMatchObject({ current: 3, jokerDays: ['2026-11-15', '2026-11-16'] });
    expect(jokersLeft(after, '2026-11-17', 1)).toBe(0);
    expect(jokersLeft(after, '2026-11-23', 1)).toBe(1);
  });
  it('Blowy+ : trois jokers par semaine, puis remise à zéro', () => {
    const s = run(['2026-11-09']);
    expect(settleStreak(s, '2026-11-13', 3)).toMatchObject({ current: 1, jokerDays: ['2026-11-10', '2026-11-11', '2026-11-12'] });
    expect(settleStreak(s, '2026-11-14', 3)).toMatchObject({ current: 0 });
  });
  it('rattrapage idempotent : relire ne dépense pas de joker en plus', () => {
    const s = run(['2026-11-09', '2026-11-10']);
    const once = settleStreak(s, '2026-11-12', 3);
    expect(settleStreak(once, '2026-11-12', 3)).toEqual(once);
    expect(settleStreak(once, '2026-11-13', 3).jokerDays).toEqual(['2026-11-11', '2026-11-12']);
  });
  it('un long silence finit toujours à zéro, même avec trois jokers', () => {
    const s = run(['2026-01-05', '2026-01-06']);
    expect(settleStreak(s, '2026-11-15', 3)).toMatchObject({ current: 0, best: 2 });
  });
  it('les vieux jokers sont oubliés', () => {
    const s = completeStreakDay(run(['2026-11-02']), '2026-11-04', 1).state;
    expect(s.jokerDays).toEqual(['2026-11-03']);
    const later = run(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17'], 1, s);
    expect(later.jokerDays).toEqual([]);
    expect(later.current).toBe(15);
  });
  it('paliers : 3, 7, 14, 30, 60, 100, chacun avec un objet ; fêtés une seule fois', () => {
    expect(STREAK_MILESTONES).toEqual([3, 7, 14, 30, 60, 100]);
    for (const m of STREAK_MILESTONES) expect(streakReward(m)).not.toBeNull();
    expect(new Set(STREAK_MILESTONES.map(streakReward)).size).toBe(6);
    expect(nextStreakMilestone(0)).toEqual({ days: 3, itemId: 'fleurs' });
    expect(nextStreakMilestone(3)).toEqual({ days: 7, itemId: 'lunettes_etoile' });
    expect(nextStreakMilestone(100)).toBeNull();
    const two = run(['2026-11-09', '2026-11-10']);
    expect(completeStreakDay(two, '2026-11-11', 1).milestone).toBe(3);
    // Record déjà à 3 : refaire 3 ne refête rien.
    const restarted = { ...two, current: 2, best: 5, lastDoneOn: '2026-11-10' };
    expect(completeStreakDay(restarted, '2026-11-11', 1).milestone).toBeNull();
    // Les objets suivent le record (statistique ritualStreak).
    expect(earnedItems({ ...ZERO_STATS, ritualStreak: 7 })).toEqual(expect.arrayContaining(['fleurs', 'lunettes_etoile']));
  });
  it('les sept jours de la semaine', () => {
    const s = completeStreakDay(run(['2026-11-09', '2026-11-10']), '2026-11-12', 1).state; // mercredi : joker
    const done = new Set(['2026-11-09', '2026-11-10', '2026-11-12']);
    expect(streakWeek(s, '2026-11-13', done).map((d) => d.status)).toEqual(['done', 'done', 'joker', 'done', 'today', 'future', 'future']);
    expect(streakWeek(s, '2026-11-15', done).map((d) => d.status)).toEqual(['done', 'done', 'joker', 'done', 'missed', 'missed', 'today']);
    expect(streakWeek(ZERO_STREAK, '2026-11-16', new Set(['2026-11-16']))[0]).toEqual({ day: '2026-11-16', status: 'done' });
  });
});

describe('habitudes', () => {
  it('limites : 2 sans Blowy+, 6 avec', () => {
    expect(canAddHabit(1, 2)).toBe(true);
    expect(canAddHabit(2, 2)).toBe(false);
    expect(canAddHabit(5, 6)).toBe(true);
  });
  it('« pas sûr » compte, « non » ne compte pas', () => {
    expect(proofCounts('yes')).toBe(true);
    expect(proofCounts('unsure')).toBe(true);
    expect(proofCounts('no')).toBe(false);
  });
  it('à faire aujourd’hui : tous les jours, ou tant que les 3 de la semaine ne sont pas faits', () => {
    expect(habitDay('daily', [], '2026-11-12')).toEqual({ doneToday: false, doneThisWeek: 0, target: 7, due: true });
    expect(habitDay('daily', ['2026-11-12'], '2026-11-12').due).toBe(false);
    const three = ['2026-11-09', '2026-11-10', '2026-11-11'];
    expect(habitDay('three_per_week', three, '2026-11-12')).toEqual({ doneToday: false, doneThisWeek: 3, target: 3, due: false });
    // La semaine d'avant ne compte pas.
    expect(habitDay('three_per_week', ['2026-11-06', '2026-11-07', '2026-11-08'], '2026-11-09').due).toBe(true);
  });
  it('preuve demandée au bon moment', () => {
    const day = habitDay('daily', [], '2026-11-12');
    expect(shouldAskProof(day, 17, 18)).toBe(false);
    expect(shouldAskProof(day, 18, 18)).toBe(true);
    expect(shouldAskProof(habitDay('daily', ['2026-11-12'], '2026-11-12'), 20, 18)).toBe(false);
  });
  it('séries d’habitude', () => {
    expect(habitStreak('daily', ['2026-11-10', '2026-11-11'], '2026-11-12')).toBe(2);
    expect(habitStreak('daily', ['2026-11-10', '2026-11-11', '2026-11-12'], '2026-11-12')).toBe(3);
    expect(habitStreak('daily', ['2026-11-09', '2026-11-11'], '2026-11-12')).toBe(1);
    expect(habitStreak('daily', ['2026-11-09'], '2026-11-12')).toBe(0);
    const weeks = ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-10', '2026-11-11'];
    expect(habitStreak('three_per_week', weeks, '2026-11-12')).toBe(2);
    expect(habitStreak('three_per_week', weeks.slice(0, 5), '2026-11-12')).toBe(1);
  });
  it('évolution du minimoa avec les habitudes et la série', () => {
    expect(evolutionOf({ habitsKept: 0, ritualStreak: 0 })).toEqual({ stage: 0, points: 0, next: 5 });
    expect(evolutionOf({ habitsKept: 3, ritualStreak: 3 })).toEqual({ stage: 1, points: 6, next: 20 });
    expect(evolutionOf({ habitsKept: 500, ritualStreak: 0 }).next).toBeNull();
    expect(EVOLUTION_THRESHOLDS[0]).toBe(0);
  });
  it('objets liés aux habitudes tenues', () => {
    const habitItems = ITEMS.filter((i) => i.unlock.kind === 'stat' && i.unlock.stat === 'habitsKept').map((i) => i.id);
    expect(habitItems.length).toBeGreaterThanOrEqual(4);
    expect(earnedItems({ ...ZERO_STATS, habitsKept: 1 })).toContain('tasse');
  });
});

describe('défi du jour', () => {
  const catalogue: DailyCandidate[] = [
    { id: 'q_foyer', kind: 'question', axis: 'foyer' },
    { id: 'q_cap', kind: 'question', axis: 'cap' },
    { id: 'q_cap2', kind: 'question', axis: 'cap' },
    { id: 'p1', kind: 'photo', axis: null },
    { id: 'w1', kind: 'write', axis: null },
    { id: 'o1', kind: 'go_out', axis: null },
  ];
  const days = Array.from({ length: 60 }, (_, n) => `2026-${String(10 + Math.floor(n / 30)).padStart(2, '0')}-${String((n % 30) + 1).padStart(2, '0')}`);
  it('déterministe : même personne, même jour, même défi', () => {
    for (const day of days.slice(0, 10)) {
      const a = pickDailyChallenge({ userId: 'u1', day, catalogue, weakestAxis: 'cap', hasLinks: true });
      const b = pickDailyChallenge({ userId: 'u1', day, catalogue: [...catalogue], weakestAxis: 'cap', hasLinks: true });
      expect(a).toEqual(b);
    }
  });
  it('varie selon le jour et la personne, tous les types sortent', () => {
    const picked = days.map((day) => pickDailyChallenge({ userId: 'u1', day, catalogue, weakestAxis: null, hasLinks: true }));
    expect(new Set(picked.map((p) => p.kind))).toEqual(new Set(DAILY_KINDS));
    const others = days.map((day) => pickDailyChallenge({ userId: 'u2', day, catalogue, weakestAxis: null, hasLinks: true }));
    expect(others.map((p) => p.id)).not.toEqual(picked.map((p) => p.id));
  });
  it('une question vise l’axe le moins sûr ; sans lien, jamais « écrire »', () => {
    for (const day of days) {
      const c = pickDailyChallenge({ userId: 'u3', day, catalogue, weakestAxis: 'cap', hasLinks: false });
      if (c.kind === 'question') expect(c.axis).toBe('cap');
      expect(c.kind).not.toBe('write');
    }
    const profile = { ...EMPTY_VISION, foyer: { value: 0, confidence: 50 }, ancrage: { value: 0, confidence: 50 }, elan: { value: 0, confidence: 50 }, rythme: { value: 0, confidence: 50 }, cap: { value: 0, confidence: 10 } };
    expect(leastConfidentAxis(profile)).toBe('cap');
  });
  it('états : offert → vu → accepté → fait, sans retour en arrière ; la carte monte tant qu’elle n’a pas été vue', () => {
    expect(advanceDaily('offered', 'seen')).toBe('seen');
    expect(advanceDaily('seen', 'accepted')).toBe('accepted');
    expect(advanceDaily('offered', 'done')).toBe('done');
    expect(advanceDaily('done', 'seen')).toBe('done');
    expect(advanceDaily('accepted', 'seen')).toBe('accepted');
    expect(presentDailyCard('offered')).toBe(true);
    expect(presentDailyCard('seen')).toBe(false);
  });
});

describe('bilan de la semaine', () => {
  const facts = { outings: 3, habitsKept: 4, challengesDone: 5, streak: 5, bestStreak: 9, jokersUsed: 0 };
  it('semaine due : dimanche soir, rattrapage le lundi', () => {
    expect(reviewWeekDue('2026-11-15', 19)).toBe('2026-11-09');
    expect(reviewWeekDue('2026-11-15', 12)).toBeNull();
    expect(reviewWeekDue('2026-11-16', 8)).toBe('2026-11-09');
    expect(reviewWeekDue('2026-11-17', 20)).toBeNull();
  });
  it('dimanche à partir de 19 h', () => {
    expect(reviewDue('2026-11-15', 19)).toBe(true);
    expect(reviewDue('2026-11-15', 18)).toBe(false);
    expect(reviewDue('2026-11-16', 20)).toBe(false);
  });
  it('nomme ce qui a marché ; une semaine vide est « calme »', () => {
    expect(reviewHighlights(facts)).toEqual(['outings', 'habits', 'challenges', 'streak']);
    const none = { outings: 0, habitsKept: 0, challengesDone: 0, streak: 0, bestStreak: 0, jokersUsed: 0 };
    expect(reviewHighlights(none)).toEqual(['calm']);
    expect(isActiveWeek(none)).toBe(false);
    expect(isActiveWeek({ ...none, outings: 1, challengesDone: 1 })).toBe(true);
  });
  it('un conseil, sur ce qui a le plus de place pour grandir', () => {
    expect(reviewTip({ ...facts, outings: 1 }, 2)).toBe('go_out');
    expect(reviewTip({ ...facts, habitsKept: 0 }, 2)).toBe('habit');
    expect(reviewTip({ ...facts, challengesDone: 2 }, 2)).toBe('challenge');
    expect(reviewTip(facts, 2)).toBe('write');
    expect(reviewTip(facts, 0)).toBe('keep_going');
  });
  it('ce que le minimoa a remarqué : le plus grand mouvement d’un axe', () => {
    expect(noticedMove({ foyer: 3, cap: -12, elan: 8 })).toEqual({ axis: 'cap', direction: 'down' });
    expect(noticedMove({ foyer: 4 })).toBeNull();
    expect(noticedMove(null)).toBeNull();
  });
  it('un mot par lien, toujours sur ce qui va bien', () => {
    expect(linkNote({ streak: 4, level: 1, lives: 2 })).toBe('streak');
    expect(linkNote({ streak: 0, level: 5, lives: 2 })).toBe('close');
    expect(linkNote({ streak: 0, level: 1, lives: 7 })).toBe('steady');
    expect(linkNote({ streak: 0, level: 1, lives: 3 })).toBe('growing');
  });
  it('garde-fou : refuse les reproches, y compris avec des accents', () => {
    expect(isKindText('Tu es sorti trois fois. Belle semaine.', 'fr')).toBe(true);
    expect(isKindText('Tu n’as pas assez bougé.', 'fr')).toBe(false);
    expect(isKindText("Tu n'as pas tenu ta série.", 'fr')).toBe(false);
    expect(isKindText('Encore un échec.', 'fr')).toBe(false);
    expect(isKindText('Tu as manqué deux jours.', 'fr')).toBe(false);
    expect(isKindText('Il faut sortir plus.', 'fr')).toBe(false);
    expect(isKindText('C’est dommage.', 'fr')).toBe(false);
    expect(isKindText('Ne néglige pas ton minimoa.', 'fr')).toBe(false);
    expect(isKindText('', 'fr')).toBe(false);
    expect(isKindText('a'.repeat(800), 'fr')).toBe(false);
    // Pas de faux positif sur des mots proches.
    expect(isKindText('Un dîner prévu, une balade improvisée : tu sais doser.', 'fr')).toBe(true);
    expect(isKindText('Ton manteau t’attend.', 'fr')).toBe(true);
  });
  it('garde-fou : une liste par langue (anglais, espagnol, portugais, néerlandais)', () => {
    expect(isKindText('Three outings this week. Nice rhythm.', 'en')).toBe(true);
    expect(isKindText('You didn’t go out enough.', 'en')).toBe(false);
    expect(isKindText("You didn't keep your streak.", 'en')).toBe(false);
    expect(isKindText('You should write more.', 'en')).toBe(false);
    expect(isKindText('Another failure.', 'en')).toBe(false);
    expect(isKindText('An unforgettable week.', 'en')).toBe(true);
    expect(isKindText('Tres salidas esta semana. Buen ritmo.', 'es')).toBe(true);
    expect(isKindText('No has salido lo suficiente.', 'es')).toBe(false);
    expect(isKindText('Hay que salir más.', 'es')).toBe(false);
    expect(isKindText('Una semana inolvidable.', 'es')).toBe(true);
    expect(isKindText('Três saídas esta semana. Bom ritmo.', 'pt')).toBe(true);
    expect(isKindText('Você não saiu nenhuma vez.', 'pt')).toBe(false);
    expect(isKindText('Que pena, mais um fracasso.', 'pt')).toBe(false);
    expect(isKindText('Vale a pena continuar assim.', 'pt')).toBe(true);
    expect(isKindText('Drie uitjes deze week. Mooi ritme.', 'nl')).toBe(true);
    expect(isKindText('Je hebt niet genoeg gedaan.', 'nl')).toBe(false);
    expect(isKindText('Jammer, weer mislukt.', 'nl')).toBe(false);
    // Le garde-fou lit la langue indiquée : un reproche dans une autre langue n'est pas de son ressort.
    expect(isKindText('Encore un échec.', 'en')).toBe(true);
  });
});
