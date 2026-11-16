import { describe, expect, it } from 'vitest';
import { encounterOutcome } from './encounters';
import { RENAME_COOLDOWN_DAYS, nextRenameOn, renameRule } from './rename';

describe('changement de nom du pet', () => {
  it('jamais renommé (le nom de la création ne compte pas) : possible', () => {
    expect(renameRule({ lastRenamedOn: null, today: '2026-11-15', plus: false })).toEqual({ allowed: true, availableOn: null, unlimited: false });
  });
  it('bloqué pendant 60 jours, possible le 60e jour', () => {
    expect(RENAME_COOLDOWN_DAYS).toBe(60);
    const last = '2026-11-15';
    expect(renameRule({ lastRenamedOn: last, today: last, plus: false })).toEqual({ allowed: false, availableOn: '2027-01-14', unlimited: false });
    expect(renameRule({ lastRenamedOn: last, today: '2027-01-13', plus: false })).toEqual({ allowed: false, availableOn: '2027-01-14', unlimited: false });
    expect(renameRule({ lastRenamedOn: last, today: '2027-01-14', plus: false })).toEqual({ allowed: true, availableOn: null, unlimited: false });
    expect(renameRule({ lastRenamedOn: last, today: '2027-03-01', plus: false }).allowed).toBe(true);
    expect(nextRenameOn(last)).toBe('2027-01-14');
  });
  it('traverse les fins de mois et les années bissextiles', () => {
    expect(renameRule({ lastRenamedOn: '2027-12-31', today: '2028-02-28', plus: false })).toEqual({ allowed: false, availableOn: '2028-02-29', unlimited: false });
    expect(renameRule({ lastRenamedOn: '2027-12-31', today: '2028-02-29', plus: false }).allowed).toBe(true);
  });
  it('Minimoa+ : aucune attente', () => {
    expect(renameRule({ lastRenamedOn: '2026-11-15', today: '2026-11-15', plus: true })).toEqual({ allowed: true, availableOn: null, unlimited: true });
  });
});

describe('historique des rencontres', () => {
  it('acceptée : lien ouvert ou terminé, des deux côtés', () => {
    expect(encounterOutcome({ status: 'accepted', sent: true, linkOpen: true })).toBe('linked');
    expect(encounterOutcome({ status: 'accepted', sent: false, linkOpen: true })).toBe('linked');
    expect(encounterOutcome({ status: 'accepted', sent: false, linkOpen: false })).toBe('ended');
  });
  it('refus : visible par qui a refusé, jamais par qui a salué', () => {
    expect(encounterOutcome({ status: 'declined', sent: false, linkOpen: false })).toBe('declined');
    expect(encounterOutcome({ status: 'declined', sent: true, linkOpen: false })).toBe('waiting');
    expect(encounterOutcome({ status: 'waved', sent: true, linkOpen: false })).toBe('waiting');
    expect(encounterOutcome({ status: 'waved', sent: true, linkOpen: true })).toBe('linked');
  });
  it('coucou reçu sans réponse : pas dans l’historique', () => {
    expect(encounterOutcome({ status: 'waved', sent: false, linkOpen: false })).toBeNull();
  });
});
