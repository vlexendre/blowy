/** Règles ajoutées pour combler les manques signalés par l'app (positions, recherche commune, accords, série, bilan). */
import { describe, expect, it } from 'vitest';
import {
  CHAT_READING_DEFAULTS,
  type ChatConsent,
  chatReadingAllowed,
  consentFromDefault,
  theirConsentOf,
} from './plateforme';
import { type StreakState, ZERO_STREAK, axisMoves, completeStreakDay, nextStreakMilestone, streakRunDays, streakWeek } from './rituels';
import { type AxisReading, EMPTY_VISION, type VisionProfile, axisLean, compatibilityOf } from './vision';

const at = (value: number, confidence = 80): AxisReading => ({ value, confidence });
const profile = (p: Partial<VisionProfile>): VisionProfile => ({ ...EMPTY_VISION, ...p });

describe('où penche chacun sur un axe (repères de l’explication)', () => {
  it('trois crans, jamais la valeur ; entre les deux et peu sûr restent légers', () => {
    expect(axisLean(at(0))).toEqual({ side: 'mid', strength: 'light' });
    expect(axisLean(at(19))).toEqual({ side: 'mid', strength: 'light' });
    expect(axisLean(at(-30))).toEqual({ side: 'low', strength: 'light' });
    expect(axisLean(at(55))).toEqual({ side: 'high', strength: 'clear' });
    expect(axisLean(at(-80))).toEqual({ side: 'low', strength: 'strong' });
    // Peu sûr : le côté seulement, sans affirmer de force.
    expect(axisLean(at(90, 10))).toEqual({ side: 'high', strength: 'light' });
  });
  it('l’explication porte les deux repères sur les 3 points communs et la différence, cohérents avec les côtés', () => {
    const me = profile({ foyer: at(80), ancrage: at(-60), elan: at(40), rythme: at(70), cap: at(-75) });
    const other = profile({ foyer: at(70), ancrage: at(-55), elan: at(35), rythme: at(65), cap: at(70) });
    const c = compatibilityOf(me, other);
    for (const p of c.common) {
      expect(p.leans.mine).toEqual(axisLean(me[p.axis]));
      expect(p.leans.theirs).toEqual(axisLean(other[p.axis]));
    }
    expect(c.explore.axis).toBe('cap');
    expect(c.explore.leans).toEqual({ mine: { side: 'low', strength: 'clear' }, theirs: { side: 'high', strength: 'clear' } });
    expect(c.explore.leans.mine.side).toBe(c.explore.mine);
    expect(c.explore.leans.theirs.side).toBe(c.explore.theirs);
    // Rien d'autre que le côté et le cran : pas de valeur ni de confiance.
    expect(Object.keys(c.common[0].leans.theirs).sort()).toEqual(['side', 'strength']);
  });
});

describe('accord de l’autre et réglage par défaut', () => {
  it('un refus et une question pas posée se disent pareil : « pas encore »', () => {
    expect(theirConsentOf(true)).toBe('agreed');
    expect(theirConsentOf(false)).toBe('not_yet');
    expect(theirConsentOf(null)).toBe('not_yet');
  });
  it('le réglage par défaut donne l’accord de départ d’un nouveau lien', () => {
    expect(CHAT_READING_DEFAULTS).toEqual(['ask', 'on', 'off']);
    const start: ChatConsent[] = CHAT_READING_DEFAULTS.map(consentFromDefault);
    expect(start).toEqual([null, true, false]);
    expect(chatReadingAllowed(consentFromDefault('on'), consentFromDefault('on'))).toBe(true);
    expect(chatReadingAllowed(consentFromDefault('on'), consentFromDefault('ask'))).toBe(false);
  });
});

describe('série : semaine et prochain palier', () => {
  it('les jours d’avant le premier jour de la personne ne sont pas « manqués »', () => {
    // Compte créé le jeudi 12 ; on est le samedi 14, défi fait le 12, pas le 13.
    const s = completeStreakDay(ZERO_STREAK, '2026-11-12', 1).state;
    const week = streakWeek(s, '2026-11-14', new Set(['2026-11-12']), '2026-11-12').map((d) => d.status);
    expect(week).toEqual(['not_yet', 'not_yet', 'not_yet', 'done', 'missed', 'today', 'future']);
    // Sans premier jour connu : comme avant.
    expect(streakWeek(s, '2026-11-14', new Set(['2026-11-12']))[0]?.status).toBe('missed');
  });
  it('les jours comptés par la série sont « faits », même sans enregistrement (série de 12 jours)', () => {
    const s: StreakState = { current: 12, best: 12, lastDoneOn: '2026-11-13', jokerDays: [] };
    expect(streakRunDays(s).size).toBe(12);
    const week = streakWeek(s, '2026-11-14', new Set(), '2026-11-14').map((d) => d.status);
    expect(week).toEqual(['done', 'done', 'done', 'done', 'done', 'today', 'future']);
    // Un joker dans la série : sauté, la série remonte un jour plus loin.
    const j: StreakState = { current: 3, best: 3, lastDoneOn: '2026-11-13', jokerDays: ['2026-11-12'] };
    expect([...streakRunDays(j)].sort()).toEqual(['2026-11-10', '2026-11-11', '2026-11-13']);
  });
  it('le prochain palier est le premier dont l’objet n’est pas gagné (au-delà du record)', () => {
    expect(nextStreakMilestone(0, 0)).toEqual({ days: 3, itemId: 'fleurs' });
    // Série retombée à 1 après un record de 9 : 3 et 7 sont gagnés, on vise 14.
    expect(nextStreakMilestone(1, 9)?.days).toBe(14);
    expect(nextStreakMilestone(2, 100)).toBeNull();
    expect(nextStreakMilestone(5)).toEqual({ days: 7, itemId: 'lunettes_etoile' });
  });
});

describe('bilan : mouvement de chaque axe', () => {
  it('direction et taille en crans, jamais de chiffre', () => {
    expect(axisMoves(null)).toEqual([]);
    expect(axisMoves({ foyer: 3, ancrage: -7, elan: 12, cap: -25 })).toEqual([
      { axis: 'foyer', direction: 'steady', size: null },
      { axis: 'ancrage', direction: 'down', size: 'small' },
      { axis: 'elan', direction: 'up', size: 'medium' },
      { axis: 'cap', direction: 'down', size: 'large' },
    ]);
  });
});
