import { describe, expect, it } from 'vitest';
import {
  collectionItemsToKeep,
  currentCollection,
  farSummary,
  itemAvailable,
  plusMomentDue,
  plusMomentKey,
  plusStrongKey,
  plusTriggerReport,
  withoutUnavailable,
  type PlusMomentFacts,
} from './desir';

describe('vu de loin', () => {
  it('compte sans rien inventer', () => {
    expect(farSummary([])).toEqual({ count: 0, strong: 0, best: null });
    expect(farSummary([71, 86, 85, 90, 84])).toEqual({ count: 5, strong: 3, best: 90 });
  });
});

describe('collections saisonnières', () => {
  it('la collection Hiver a une vraie fin', () => {
    expect(currentCollection('2026-11-18')).toMatchObject({ collection: { id: 'hiver_2026', until: '2027-01-31' }, daysLeft: 75 });
    expect(currentCollection('2027-01-31')?.daysLeft).toBe(1);
    expect(currentCollection('2027-02-01')).toBeNull();
  });
  it("après la fin, seuls ceux qui l'ont eue gardent ses objets", () => {
    const kept = new Set(['hiver_bonnet']);
    expect(itemAvailable('hiver_echarpe', '2027-01-31', new Set())).toBe(true);
    expect(itemAvailable('hiver_echarpe', '2027-02-01', new Set())).toBe(false);
    expect(itemAvailable('hiver_bonnet', '2027-02-01', kept)).toBe(true);
    expect(itemAvailable('aureole', '2027-02-01', new Set())).toBe(true);
    expect(withoutUnavailable({ head: 'hiver_bonnet', body: 'hiver_echarpe' }, '2027-02-01', kept)).toEqual({ head: 'hiver_bonnet' });
    const same = { head: 'aureole' };
    expect(withoutUnavailable(same, '2027-02-01', kept)).toBe(same);
  });
  it('Minimoa+ pendant la collection : ses objets sont gardés', () => {
    expect(collectionItemsToKeep(false, '2026-12-01', new Set())).toEqual([]);
    expect(collectionItemsToKeep(true, '2026-12-01', new Set(['hiver_bonnet']))).toHaveLength(11);
    expect(collectionItemsToKeep(true, '2027-02-01', new Set())).toEqual([]);
  });
});

describe('moments clés', () => {
  const base: PlusMomentFacts = { today: '2026-11-20', plus: false, createdOn: '2026-11-10', keys: new Set(), firstLinkOn: null, links: 0, streak: 0, streakDay: null };
  it('première rencontre réussie, une fois, juste après', () => {
    expect(plusMomentDue({ ...base, links: 1, firstLinkOn: '2026-11-19' })).toBe('first_link');
    expect(plusMomentDue({ ...base, links: 1, firstLinkOn: '2026-11-15' })).toBeNull();
    expect(plusMomentDue({ ...base, links: 2, firstLinkOn: '2026-11-19' })).toBeNull();
    expect(plusMomentDue({ ...base, links: 1, firstLinkOn: '2026-11-19', keys: new Set([plusMomentKey('first_link')]) })).toBeNull();
  });
  it('7 jours de série', () => {
    expect(plusMomentDue({ ...base, streak: 7, streakDay: '2026-11-20' })).toBe('streak_7');
    expect(plusMomentDue({ ...base, streak: 30, streakDay: '2026-11-20' })).toBeNull();
    expect(plusMomentDue({ ...base, streak: 7, streakDay: '2026-11-10' })).toBeNull();
  });
  it('plafond : jamais avec Minimoa+, ni le jour de l’inscription, ni moins de 3 jours après une autre', () => {
    const due = { ...base, streak: 7, streakDay: '2026-11-20' };
    expect(plusMomentDue({ ...due, plus: true })).toBeNull();
    expect(plusMomentDue({ ...due, createdOn: '2026-11-20' })).toBeNull();
    expect(plusMomentDue({ ...due, keys: new Set([plusStrongKey('2026-11-18')]) })).toBeNull();
    expect(plusMomentDue({ ...due, keys: new Set([plusStrongKey('2026-11-17')]) })).toBe('streak_7');
  });
  it('deuxième jour : seulement pour une app qui sait l’ouvrir, du jour 2 au jour 4, une fois', () => {
    const young = { ...base, createdOn: '2026-11-18', accepts: ['first_link', 'streak_7', 'second_day'] as const };
    // App installée qui ne dit rien : jamais ce moment (sa réponse ne se lirait pas).
    expect(plusMomentDue({ ...young, accepts: undefined })).toBeNull();
    expect(plusMomentDue({ ...young, today: '2026-11-18' })).toBeNull();
    expect(plusMomentDue({ ...young, today: '2026-11-19' })).toBeNull();
    expect(plusMomentDue({ ...young, today: '2026-11-20' })).toBe('second_day');
    expect(plusMomentDue({ ...young, today: '2026-11-22' })).toBe('second_day');
    expect(plusMomentDue({ ...young, today: '2026-11-23' })).toBeNull();
    expect(plusMomentDue({ ...young, keys: new Set([plusMomentKey('second_day')]) })).toBeNull();
    expect(plusMomentDue({ ...young, plus: true })).toBeNull();
    // Un premier lien tout frais passe avant.
    expect(plusMomentDue({ ...young, links: 1, firstLinkOn: '2026-11-20' })).toBe('first_link');
  });
});

describe('mesure par déclencheur', () => {
  it('ouvertures, essais, paiements et taux', () => {
    const row = (metric: string, source: string, count: number) => ({ day: '2026-11-18', metric, source, ref: '', count });
    const r = plusTriggerReport([row('plus_open', 'far_away', 10), row('plus_open', 'far_away', 10), row('plus_trial', 'far_away', 2), row('plus_paid', 'map', 1), row('signup', '', 5)]);
    expect(r).toEqual([
      { trigger: 'far_away', opens: 20, trials: 2, paid: 0, rate: 0.1 },
      { trigger: 'map', opens: 0, trials: 0, paid: 1, rate: null },
    ]);
  });
});
