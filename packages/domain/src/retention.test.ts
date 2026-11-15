import { describe, expect, it } from 'vitest';
import { addDays } from './days';
import { INACTIVE_ACCOUNT_DAYS, banSubjectKey, deletionCutoff, inactivityDeletionDay, inactivityStep, noticeCutoff } from './retention';

const LAST = '2024-01-10';

describe('comptes inactifs', () => {
  it('rien avant 2 ans moins 30 jours ; prévenance ensuite ; suppression à 2 ans, 30 jours au moins après la prévenance', () => {
    expect(inactivityStep(LAST, null, addDays(LAST, INACTIVE_ACCOUNT_DAYS - 31))).toBe('none');
    expect(inactivityStep(LAST, null, addDays(LAST, INACTIVE_ACCOUNT_DAYS - 30))).toBe('notice');
    const noticed = addDays(LAST, INACTIVE_ACCOUNT_DAYS - 30);
    expect(inactivityStep(LAST, noticed, addDays(LAST, INACTIVE_ACCOUNT_DAYS - 1))).toBe('none');
    expect(inactivityStep(LAST, noticed, addDays(LAST, INACTIVE_ACCOUNT_DAYS))).toBe('delete');
    expect(inactivityDeletionDay(LAST, noticed)).toBe(addDays(LAST, INACTIVE_ACCOUNT_DAYS));
  });

  it('prévenance tardive (panne) : la suppression attend 30 jours après elle', () => {
    const late = addDays(LAST, INACTIVE_ACCOUNT_DAYS + 5);
    expect(inactivityStep(LAST, null, late)).toBe('notice');
    expect(inactivityStep(LAST, late, addDays(late, 29))).toBe('none');
    expect(inactivityStep(LAST, late, addDays(late, 30))).toBe('delete');
    expect(inactivityDeletionDay(LAST, late)).toBe(addDays(late, 30));
  });

  it('une prévenance plus ancienne que la dernière connexion ne compte plus', () => {
    const back = addDays(LAST, 800);
    expect(inactivityStep(back, LAST, addDays(back, 10))).toBe('none');
    expect(inactivityStep(back, LAST, addDays(back, INACTIVE_ACCOUNT_DAYS - 30))).toBe('notice');
  });

  it('bornes des requêtes et clé d’exclusion stable (casse et espaces ignorés)', () => {
    expect(noticeCutoff('2026-11-15')).toBe(addDays('2026-11-15', -(INACTIVE_ACCOUNT_DAYS - 30)));
    expect(deletionCutoff('2026-11-15')).toBe(addDays('2026-11-15', -INACTIVE_ACCOUNT_DAYS));
    expect(banSubjectKey(' Apple ', 'ABC.123 ')).toBe(banSubjectKey('apple', 'abc.123'));
  });
});
