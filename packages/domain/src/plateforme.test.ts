import { describe, expect, it } from 'vitest';
import {
  CHAT_MAX_INTERVENTIONS_PER_DAY,
  DEFAULT_AI_PRICES,
  EMPTY_CHAT_PET_STATE,
  REMARK_EVERY_MESSAGES,
  aiCostMicros,
  aiGate,
  chatReadingAllowed,
  cleanMinimoaLine,
  countIntervention,
  decideNotification,
  guardDue,
  interventionsLeft,
  linkHealthOf,
  localTimeOf,
  minimoaVoiceOf,
  nextLocalHour,
  nudgeDue,
  parseAiBudgets,
  remarkDue,
  toneScore,
} from './plateforme';

describe('IA : coût et garde-barrières', () => {
  it('coût estimé en micro-dollars (Haiku 5.5 : 0,10 $ / 0,50 $ par million)', () => {
    expect(aiCostMicros({ input: 1000, output: 100, cacheWrite: 0, cacheRead: 0 }, DEFAULT_AI_PRICES.small)).toBe(150);
    expect(aiCostMicros({ input: 0, output: 0, cacheWrite: 0, cacheRead: 1000 }, DEFAULT_AI_PRICES.small)).toBe(10);
    expect(aiCostMicros({ input: 1000, output: 100, cacheWrite: 0, cacheRead: 0 }, DEFAULT_AI_PRICES.medium)).toBe(3000);
  });
  it('ordre des refus : interrupteur, absence de modèle, plafond global, budget personnel', () => {
    const base = { killSwitch: false, available: true, spentTodayMicros: 0, ceilingMicros: 1000, userCallsToday: 0, userBudget: 2 };
    expect(aiGate(base)).toBe('ok');
    expect(aiGate({ ...base, killSwitch: true })).toBe('disabled');
    expect(aiGate({ ...base, available: false })).toBe('disabled');
    expect(aiGate({ ...base, spentTodayMicros: 1000 })).toBe('budget');
    expect(aiGate({ ...base, userCallsToday: 2 })).toBe('budget');
    expect(aiGate({ ...base, killSwitch: true, userCallsToday: 9 })).toBe('disabled');
  });
  it('budgets lus depuis la configuration', () => {
    expect(parseAiBudgets('chat_remark=1, habit_proof=0,inconnu=4,moderation=-1')).toMatchObject({ chat_remark: 1, habit_proof: 0, moderation: 4, weekly_review: 1 });
  });
});

describe('minimoas dans le chat', () => {
  const today = '2026-11-15';
  it("lecture par l'IA seulement si les deux ont dit oui", () => {
    expect(chatReadingAllowed(null, null)).toBe(false);
    expect(chatReadingAllowed(true, null)).toBe(false);
    expect(chatReadingAllowed(true, false)).toBe(false);
    expect(chatReadingAllowed(true, true)).toBe(true);
  });
  it('3 interventions par jour et par lien, remises à zéro le lendemain', () => {
    let s = EMPTY_CHAT_PET_STATE;
    for (let i = 0; i < CHAT_MAX_INTERVENTIONS_PER_DAY; i++) s = countIntervention(s, today);
    expect(interventionsLeft(s, today)).toBe(0);
    expect(interventionsLeft(s, '2026-11-16')).toBe(3);
  });
  it('remarque tous les N messages, jamais si coupé ou plafond atteint', () => {
    const s = { ...EMPTY_CHAT_PET_STATE, messagesSinceRemark: REMARK_EVERY_MESSAGES };
    expect(remarkDue({ state: s, today, muted: false })).toBe(true);
    expect(remarkDue({ state: { ...s, messagesSinceRemark: REMARK_EVERY_MESSAGES - 1 }, today, muted: false })).toBe(false);
    expect(remarkDue({ state: s, today, muted: true })).toBe(false);
    expect(remarkDue({ state: { ...s, day: today, interventions: 3 }, today, muted: false })).toBe(false);
  });
  it('relance après 72 h de silence, une seule fois par silence', () => {
    const lastUserAt = '2026-11-12T10:00:00.000Z';
    const state = { ...EMPTY_CHAT_PET_STATE, lastUserAt };
    const input = { state, today, muted: false, active: true };
    expect(nudgeDue({ ...input, now: new Date('2026-11-15T09:59:00Z') })).toBe(false);
    expect(nudgeDue({ ...input, now: new Date('2026-11-15T10:00:00Z') })).toBe(true);
    expect(nudgeDue({ ...input, state: { ...state, lastNudgeFor: lastUserAt }, now: new Date('2026-11-16T10:00:00Z') })).toBe(false);
    expect(nudgeDue({ ...input, state: EMPTY_CHAT_PET_STATE, now: new Date('2026-11-16T10:00:00Z') })).toBe(false);
    expect(nudgeDue({ ...input, active: false, now: new Date('2026-11-16T10:00:00Z') })).toBe(false);
  });
  it('heuristique de ton locale et garde-fou espacé de 24 h', () => {
    expect(toneScore('on se voit demain ?')).toBe(0);
    expect(toneScore('t’es vraiment un connard')).toBeGreaterThanOrEqual(3);
    expect(toneScore("J'EN AI MARRE DE TOI !!!")).toBeGreaterThanOrEqual(5);
    const now = new Date('2026-11-15T12:00:00Z');
    expect(guardDue({ recentScores: [0, 3, 3], lastGuardAt: null, now })).toBe(true);
    expect(guardDue({ recentScores: [0, 0, 3], lastGuardAt: null, now })).toBe(false);
    expect(guardDue({ recentScores: [3, 3], lastGuardAt: '2026-11-15T00:00:00Z', now })).toBe(false);
    expect(guardDue({ recentScores: [3, 3], lastGuardAt: '2026-11-14T11:00:00Z', now })).toBe(true);
  });
  it('voix du minimoa tirée du style', () => {
    expect(minimoaVoiceOf({ social: 0, play: 0, tender: -40, talk: 0 })).toBe('sec');
    expect(minimoaVoiceOf({ social: 0, play: 40, tender: 0, talk: 0 })).toBe('joueur');
    expect(minimoaVoiceOf({ social: 0, play: 0, tender: 40, talk: 0 })).toBe('doux');
    expect(minimoaVoiceOf({ social: 0, play: 0, tender: 0, talk: 0 })).toBe('pose');
  });
  it('réponse du modèle : « rien » ou une ligne nettoyée', () => {
    expect(cleanMinimoaLine('RIEN')).toBeNull();
    expect(cleanMinimoaLine('  ')).toBeNull();
    expect(cleanMinimoaLine('« Vous parlez de ce resto depuis lundi. »\nautre')).toBe('Vous parlez de ce resto depuis lundi.');
    expect(cleanMinimoaLine('x'.repeat(300))?.length).toBe(160);
  });
  it('santé du lien', () => {
    expect(linkHealthOf({ mine: 0, theirs: 0, duoPhotoDays: 0, streak: 0, lives: 7, ageDays: 2 }).key).toBe('new');
    expect(linkHealthOf({ mine: 0, theirs: 0, duoPhotoDays: 0, streak: 0, lives: 3, ageDays: 20 }).key).toBe('quiet');
    expect(linkHealthOf({ mine: 10, theirs: 1, duoPhotoDays: 0, streak: 0, lives: 7, ageDays: 20 }).key).toBe('one_sided');
    expect(linkHealthOf({ mine: 20, theirs: 20, duoPhotoDays: 1, streak: 1, lives: 7, ageDays: 20 }).key).toBe('lively');
    expect(linkHealthOf({ mine: 2, theirs: 2, duoPhotoDays: 4, streak: 4, lives: 7, ageDays: 20 })).toMatchObject({ key: 'photos' });
    expect(linkHealthOf({ mine: 40, theirs: 40, duoPhotoDays: 7, streak: 9, lives: 7, ageDays: 20 }).score).toBe(100);
  });
});

describe('notifications', () => {
  const base = { kind: 'waved' as const, enabled: true, timeZone: 'Europe/Paris', sentTodayCounted: 0, alreadyToday: false, lastSameAt: null };
  it('heure locale dans le fuseau de la personne', () => {
    expect(localTimeOf(new Date('2026-11-15T21:30:00Z'), 'Europe/Paris')).toEqual({ day: '2026-11-15', hour: 22, minute: 30 });
    expect(localTimeOf(new Date('2026-11-15T21:30:00Z'), 'America/New_York')).toEqual({ day: '2026-11-15', hour: 16, minute: 30 });
    expect(localTimeOf(new Date('2026-11-15T21:30:00Z'), 'Pas/UnFuseau').hour).toBe(22);
  });
  it('prochain 8 h local, y compris autour du changement d’heure', () => {
    expect(nextLocalHour(new Date('2026-11-15T22:00:00Z'), 'Europe/Paris', 8).toISOString()).toBe('2026-11-16T07:00:00.000Z');
    expect(nextLocalHour(new Date('2026-07-15T22:00:00Z'), 'Europe/Paris', 8).toISOString()).toBe('2026-07-16T06:00:00.000Z');
    // Nuit du 28 au 29 mars 2027 : passage à l'heure d'été.
    expect(nextLocalHour(new Date('2027-03-28T00:30:00Z'), 'Europe/Paris', 8).toISOString()).toBe('2027-03-28T06:00:00.000Z');
    expect(nextLocalHour(new Date('2026-11-15T13:00:00Z'), 'America/New_York', 9).toISOString()).toBe('2026-11-15T14:00:00.000Z');
  });
  it('réglage coupé, heures calmes (report ou abandon), plafond hors messages, délai entre messages', () => {
    const day = new Date('2026-11-15T12:00:00Z');
    const night = new Date('2026-11-15T22:30:00Z');
    expect(decideNotification({ ...base, now: day })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, enabled: false, now: day })).toEqual({ action: 'skip', reason: 'disabled' });
    expect(decideNotification({ ...base, now: night })).toEqual({ action: 'defer', until: new Date('2026-11-16T07:00:00Z') });
    expect(decideNotification({ ...base, kind: 'message', now: night })).toEqual({ action: 'skip', reason: 'quiet' });
    expect(decideNotification({ ...base, now: night, fromQueue: true })).toEqual({ action: 'skip', reason: 'quiet' });
    expect(decideNotification({ ...base, sentTodayCounted: 3, now: day })).toEqual({ action: 'skip', reason: 'cap' });
    expect(decideNotification({ ...base, kind: 'message', sentTodayCounted: 9, now: day })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'message', lastSameAt: '2026-11-15T11:58:00Z', now: day })).toEqual({ action: 'skip', reason: 'cooldown' });
    expect(decideNotification({ ...base, kind: 'daily_challenge', alreadyToday: true, now: day })).toEqual({ action: 'skip', reason: 'once_a_day' });
  });
});
