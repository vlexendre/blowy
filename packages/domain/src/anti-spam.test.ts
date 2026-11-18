import { describe, expect, it } from 'vitest';
import {
  type SentWave,
  WAVE_DAILY_ABSOLUTE,
  WAVE_MAX_PENDING,
  dailyWaveCap,
  waveAbuse,
  waveAllowance,
  waveEmailAllowed,
  withinDaily,
} from './anti-spam';

/** 18 novembre 2026, 11 h à Paris. */
const NOW = new Date('2026-11-18T10:00:00Z');
const at = (daysAgo: number, hour = 10): string => new Date(Date.UTC(2026, 10, 18 - daysAgo, hour)).toISOString();
const waves = (n: number, w: Partial<SentWave> = {}): SentWave[] =>
  Array.from({ length: n }, (_, k) => ({ toUser: `u${k}`, status: 'waved', createdAt: at(0), ...w }));

describe('signes : plafond du jour', () => {
  it('10 sans Minimoa+, 20 avec, jamais plus que le plafond absolu', () => {
    expect(dailyWaveCap({ plus: false })).toBe(10);
    expect(dailyWaveCap({ plus: true })).toBe(20);
    expect(dailyWaveCap({ plus: true })).toBeLessThanOrEqual(WAVE_DAILY_ABSOLUTE);
  });

  it('bloque au plafond du jour, puis repart le lendemain (jour de Paris)', () => {
    const sent = waves(10, { status: 'declined' });
    expect(waveAllowance({ sent, now: NOW, plus: false })).toMatchObject({ sentToday: 10, dailyCap: 10, left: 0, blocked: 'daily' });
    expect(waveAllowance({ sent, now: NOW, plus: true })).toMatchObject({ sentToday: 10, dailyCap: 20, left: 10, blocked: null });
    const tomorrow = new Date('2026-11-18T23:30:00Z'); // 0 h 30 le 19 à Paris
    expect(waveAllowance({ sent, now: tomorrow, plus: false })).toMatchObject({ sentToday: 0, blocked: null, left: 10 });
  });

  it('bloque au-delà de 15 signes en attente ; les refusés, acceptés ou trop anciens ne comptent plus', () => {
    const old = waves(WAVE_MAX_PENDING, { createdAt: at(3) });
    expect(waveAllowance({ sent: old, now: NOW, plus: false })).toMatchObject({ pending: 15, left: 0, blocked: 'pending' });
    const answered = old.map((w, k) => (k < 2 ? { ...w, status: 'declined' as const } : w));
    expect(waveAllowance({ sent: answered, now: NOW, plus: false })).toMatchObject({ pending: 13, left: 2, blocked: null });
    // Minimoa+ : jusqu'à 25 en attente, assez pour ses 20 signes du jour.
    expect(waveAllowance({ sent: old, now: NOW, plus: true })).toMatchObject({ pending: 15, maxPending: 25, left: 10, blocked: null });
    const expired = waves(WAVE_MAX_PENDING, { createdAt: at(15) });
    expect(waveAllowance({ sent: expired, now: NOW, plus: false }).blocked).toBeNull();
  });
});

describe('e-mails de signe et plafonds simples', () => {
  it('trois e-mails de signe par jour et par destinataire', () => {
    expect(waveEmailAllowed(3)).toBe(true);
    expect(waveEmailAllowed(4)).toBe(false);
  });
  it('withinDaily ne compte que le jour courant', () => {
    expect(withinDaily([at(0), at(0)], NOW, 3)).toBe(true);
    expect(withinDaily([at(0), at(0), at(0)], NOW, 3)).toBe(false);
    expect(withinDaily([at(1), at(1), at(1)], NOW, 3)).toBe(true);
    expect(withinDaily([at(0)], NOW, 3, 3)).toBe(false);
  });
});

describe('repérage pour la modération', () => {
  it('trois jours de suite à 15 signes ou plus : envoi en masse', () => {
    const sent = [0, 1, 2].flatMap((d) => waves(15, { createdAt: at(d), status: 'accepted' }));
    expect(waveAbuse({ sent, blockedBy: new Set(), now: NOW })).toEqual({ kind: 'mass', days: 3 });
    const gap = [0, 2, 3].flatMap((d) => waves(15, { createdAt: at(d), status: 'accepted' }));
    expect(waveAbuse({ sent: gap, blockedBy: new Set(), now: NOW })).toBeNull();
  });
  it('beaucoup de refus ou de blocages après ses signes', () => {
    const declined = waves(6, { status: 'declined', createdAt: at(2) });
    const blockedAfter = waves(2, { createdAt: at(1) }).map((w, k) => ({ ...w, toUser: `b${k}` }));
    const accepted = waves(3, { status: 'accepted', createdAt: at(1) }).map((w, k) => ({ ...w, toUser: `a${k}` }));
    expect(waveAbuse({ sent: [...declined, ...blockedAfter, ...accepted], blockedBy: new Set(['b0', 'b1']), now: NOW })).toEqual({ kind: 'refusals', refused: 8, answered: 11 });
    expect(waveAbuse({ sent: [...declined, ...blockedAfter, ...accepted], blockedBy: new Set(), now: NOW })).toBeNull();
    const welcomed = [...declined, ...waves(10, { status: 'accepted', createdAt: at(1) })];
    expect(waveAbuse({ sent: [...welcomed, ...waves(2, { status: 'declined', createdAt: at(1) }).map((w, k) => ({ ...w, toUser: `d${k}` }))], blockedBy: new Set(), now: NOW })).toBeNull();
  });
});
