import { describe, expect, it } from 'vitest';
import {
  activeMilestone,
  growthReport,
  lastWeeks,
  membersAt,
  missingMembers,
  momentToOffer,
  mondayOf,
  resolveAttribution,
  topWords,
  visionTraits,
} from './growth';
import { EMPTY_VISION, type VisionProfile } from './vision';
import { earnedItems, ZERO_STATS } from './items';

describe('croissance', () => {
  it('source d’arrivée : invitation d’abord, puis le lien ouvert s’il est valable, sinon store ; jamais soi-même', () => {
    const none = { claimed: null, inviterId: null, creatorCode: null, wordsOwnerId: null, groupId: null };
    expect(resolveAttribution(none, 'me')).toEqual({ source: 'store', ref: null, referredBy: null });
    expect(resolveAttribution({ ...none, inviterId: 'a', claimed: { source: 'creator', ref: 'LEA' }, creatorCode: 'LEA' }, 'me')).toEqual({ source: 'invite', ref: null, referredBy: 'a' });
    expect(resolveAttribution({ ...none, claimed: { source: 'creator', ref: 'LEA' }, creatorCode: 'LEA' }, 'me')).toEqual({ source: 'creator', ref: 'LEA', referredBy: null });
    expect(resolveAttribution({ ...none, claimed: { source: 'creator', ref: 'XX' } }, 'me').source).toBe('store');
    expect(resolveAttribution({ ...none, claimed: { source: 'words', ref: 'W' }, wordsOwnerId: 'me' }, 'me').source).toBe('store');
    expect(resolveAttribution({ ...none, claimed: { source: 'group', ref: 'G' }, groupId: 'g1' }, 'me')).toEqual({ source: 'group', ref: 'g1', referredBy: null });
  });

  it('J1, J7, J30 ; semaines du lundi', () => {
    expect(activeMilestone('2026-11-11', '2026-11-12')).toBe('active_d1');
    expect(activeMilestone('2026-11-11', '2026-11-18')).toBe('active_d7');
    expect(activeMilestone('2026-11-11', '2026-12-11')).toBe('active_d30');
    expect(activeMilestone('2026-11-11', '2026-11-13')).toBeNull();
    expect(mondayOf('2026-11-15')).toBe('2026-11-09');
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
    expect(lastWeeks('2026-11-18', 3)).toEqual(['2026-11-02', '2026-11-09', '2026-11-16']);
  });

  it('tableau : visites par page, étapes par semaine d’inscription, facteur K, boucle « 3 mots », groupes viables', () => {
    const r = growthReport({
      today: '2026-11-25',
      weeks: ['2026-11-09', '2026-11-16'],
      counters: [
        { day: '2026-11-10', metric: 'visit_m', source: '', ref: '', count: 10 },
        { day: '2026-11-10', metric: 'first_open', source: 'words', ref: '', count: 4 },
        { day: '2026-11-11', metric: 'words_vote', source: '', ref: '', count: 8 },
        { day: '2026-11-11', metric: 'share_words', source: '', ref: '', count: 5 },
        { day: '2026-11-12', metric: 'share_invite', source: '', ref: '', count: 5 },
      ],
      events: [
        { kind: 'onboarded', source: 'words', cohortOn: '2026-11-10' },
        { kind: 'onboarded', source: 'words', cohortOn: '2026-11-11' },
        { kind: 'onboarded', source: 'store', cohortOn: '2026-11-11' },
        { kind: 'active_d1', source: 'words', cohortOn: '2026-11-10' },
      ],
      activeUsers: new Map([['2026-11-09', 20]]),
      groups: [
        { createdOn: '2026-11-10', membersAtD7: 3 },
        { createdOn: '2026-11-11', membersAtD7: 2 },
        { createdOn: '2026-11-20', membersAtD7: 4 },
      ],
    });
    const words = r.funnel.find((f) => f.week === '2026-11-09' && f.source === 'words')?.counts;
    expect(words).toMatchObject({ visit: 10, first_open: 4, onboarded: 2, active_d1: 1 });
    expect(r.funnel.find((f) => f.week === '2026-11-09' && f.source === 'all')?.counts.onboarded).toBe(3);
    expect(r.k[0]).toEqual({ week: '2026-11-09', shares: 10, activeUsers: 20, referred: 2, sharesPerUser: 0.5, conversion: 0.2, k: 0.1 });
    expect(r.k[1]?.k).toBeNull();
    expect(r.words[0]).toEqual({ week: '2026-11-09', votes: 8, joined: 2, loopRate: 0.25 });
    expect(r.groups[0]).toEqual({ week: '2026-11-09', created: 2, eligible: 2, viable: 1, rate: 0.5 });
    // Créé il y a moins de 7 jours : pas encore jugé.
    expect(r.groups[1]).toEqual({ week: '2026-11-16', created: 1, eligible: 0, viable: 0, rate: null });
  });

  it('membres présents à un instant (arrivés avant, pas encore partis)', () => {
    const at = '2026-11-18T10:00:00.000Z';
    expect(
      membersAt(
        [
          { joinedAt: '2026-11-11T10:00:00.000Z', leftAt: null, status: 'active' },
          { joinedAt: '2026-11-12T10:00:00.000Z', leftAt: '2026-11-13T10:00:00.000Z', status: 'left' },
          { joinedAt: '2026-11-19T10:00:00.000Z', leftAt: null, status: 'active' },
          { joinedAt: null, leftAt: null, status: 'invited' },
        ],
        at,
      ),
    ).toBe(1);
    expect(missingMembers(1)).toBe(2);
    expect(missingMembers(4)).toBe(0);
  });

  it('moments : le plus haut palier atteint, une seule fois', () => {
    expect(momentToOffer(6, [7, 30, 100], new Set())).toBeNull();
    expect(momentToOffer(7, [7, 30, 100], new Set())).toBe(7);
    expect(momentToOffer(35, [7, 30, 100], new Set())).toBe(30);
    expect(momentToOffer(35, [7, 30, 100], new Set([7, 30]))).toBeNull();
  });

  it('résultat du test à partager : jamais l’axe « foyer », deux traits nets au plus', () => {
    const p: VisionProfile = {
      ...EMPTY_VISION,
      foyer: { value: 90, confidence: 1 },
      ancrage: { value: -60, confidence: 0.8 },
      rythme: { value: 10, confidence: 1 },
      cap: { value: 70, confidence: 0.9 },
    };
    expect(visionTraits(p)).toEqual([
      { axis: 'cap', side: 'high' },
      { axis: 'ancrage', side: 'low' },
    ]);
  });

  it('« 3 mots » : les plus choisis, égalité dans l’ordre de la liste, mots inconnus ignorés', () => {
    expect(topWords([['drole', 'doux', 'calme'], ['drole', 'taquin', 'calme'], ['inconnu', 'drole', 'doux']])).toEqual(['drole', 'calme', 'doux']);
  });

  it('objet « Parrain » : gagné au premier parrainage, sans achat', () => {
    expect(earnedItems(ZERO_STATS)).not.toContain('parrain');
    expect(earnedItems({ ...ZERO_STATS, referrals: 1 })).toContain('parrain');
  });
});
