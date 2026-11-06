import { describe, expect, it } from 'vitest';
import {
  ACTIVE_SEAT_STATUSES,
  DUO_STATUSES,
  DUO_TERMINAL_STATUSES,
  OUTING_STATUSES,
  PET_POSES_V5,
  SEAT_STATUSES,
  STAFF_ROLES_V5,
  VOTE_CHOICES,
  availableVoteChoices,
  canTransitionDuo,
  canTransitionOuting,
  formatWeekKey,
  intentionsIssues,
  isWeekKey,
  mapLegacyIntention,
  memoryDedupKey,
  pairKey,
  projectCompatible,
  seeksOf,
  publicCancelReason,
  reliabilityDisplay,
  resolvePairVotes,
  type VoteChoice,
} from './index.js';

describe('domaine V5', () => {
  it('résolution des votes : min, bulletin manquant = rien, PLUS sans compatibilité → FRIEND', () => {
    const table: Array<[VoteChoice | null, VoteChoice | null, boolean, string | null]> = [
      ['FRIEND', 'FRIEND', false, 'FRIEND'],
      ['PLUS', 'PLUS', true, 'PLUS'],
      ['PLUS', 'PLUS', false, 'FRIEND'],
      ['PLUS', 'FRIEND', true, 'FRIEND'],
      ['PLUS', 'NO', true, null],
      ['NO', 'NO', true, null],
      ['FRIEND', null, true, null],
    ];
    for (const [a, b, rom, r] of table) {
      expect(resolvePairVotes(a, b, rom)).toBe(r);
      expect(resolvePairVotes(b, a, rom)).toBe(r);
    }
  });
  it('V5.1 : Ami·e / Plus / Non toujours proposés à tous', () => {
    expect(availableVoteChoices()).toEqual([...VOTE_CHOICES]);
  });
  it('machines d’états : DONE et CANCELLED terminaux ; duo terminal sans sortie', () => {
    for (const s of OUTING_STATUSES) expect(canTransitionOuting('DONE', s)).toBe(false);
    for (const s of OUTING_STATUSES.filter((x) => x !== 'DONE' && x !== 'CANCELLED')) expect(canTransitionOuting(s, 'CANCELLED')).toBe(true);
    expect(canTransitionOuting('PROPOSED', 'CONFIRMED')).toBe(false);
    for (const t of DUO_TERMINAL_STATUSES) for (const s of DUO_STATUSES) expect(canTransitionDuo(t, s)).toBe(false);
    expect(ACTIVE_SEAT_STATUSES.every((s) => SEAT_STATUSES.includes(s))).toBe(true);
  });
  it('semaine ISO, paire canonique, dédup souvenir', () => {
    expect(formatWeekKey(2026, 6)).toBe('2026-W06');
    expect(isWeekKey('2026-W46')).toBe(true);
    expect(isWeekKey('2026-W54')).toBe(false);
    expect(pairKey('b', 'a')).toBe('a|b');
    expect(memoryDedupKey('OUTING_LIVED', 'o1', 'p1')).toBe('OUTING_LIVED:o1:p1');
  });
  it('fiabilité « N sur M » et motif public', () => {
    expect(reliabilityDisplay(0, 0)).toBe('NEWCOMER');
    expect(reliabilityDisplay(1, 2)).toEqual({ attended: 1, total: 3 });
    expect(reliabilityDisplay(1, 0, 1)).toEqual({ attended: 1, total: 2 });
    expect(publicCancelReason('SAFETY')).toBe('OTHER');
  });
  it('intentions V5.1 : mapping V4, invariants, projet compatible', () => {
    expect(mapLegacyIntention('FRIENDS_GROUP', ['MAN']).intentions.lookingFor).toBe('FRIENDS');
    expect(mapLegacyIntention('OPEN_TO_MORE', ['MAN']).intentions).toMatchObject({ lookingFor: 'BOTH', romanceGenders: ['MAN'], meetingMode: 'GROUP' });
    expect(mapLegacyIntention('LET_IT_HAPPEN', []).needsCompletion).toBe(true);
    expect(seeksOf('STORY')).toEqual({ friends: false, romance: true });
    expect(seeksOf('BOTH')).toEqual({ friends: true, romance: true });
    expect(intentionsIssues({ lookingFor: 'STORY', romanceGenders: [], storySeriousness: null, kidsSomeday: null })).toEqual(['ROMANCE_GENDERS_REQUIRED']);
    expect(intentionsIssues({ lookingFor: 'FRIENDS', romanceGenders: [], storySeriousness: 'SERIOUS', kidsSomeday: null })).toEqual(['STORY_SUBCHOICE_ONLY_WITH_STORY']);
    const a = { lookingFor: 'STORY' as const, storySeriousness: 'SERIOUS' as const, kidsSomeday: 'YES' as const };
    expect(projectCompatible(a, { ...a, kidsSomeday: 'DONT_KNOW' })).toBe(true);
    expect(projectCompatible(a, { ...a, kidsSomeday: 'NO' })).toBe(false);
    expect(projectCompatible(a, { ...a, storySeriousness: 'SEE_HOW_IT_GOES' })).toBe(false);
    expect(projectCompatible(a, { ...a, lookingFor: 'FRIENDS' })).toBe(false);
  });
  it('poses V5 sans faim/santé, rôle ops', () => {
    expect(PET_POSES_V5).not.toContain('SICK');
    expect(STAFF_ROLES_V5).toContain('ops');
  });
});
