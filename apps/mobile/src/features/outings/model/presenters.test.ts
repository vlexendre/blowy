import { describe, expect, it } from 'vitest';
import * as W from '../../../core/demo/world';
import {
  bracketLabel,
  compositionLine,
  milestones,
  euros,
  fundingKind,
  groupSlots,
  headline,
  outingPhase,
  schedule,
  teamMates,
} from './presenters';

const n = (s: string | null) => (s ?? '').replace(/[\u00A0\u202F]/g, ' ');

describe('présentation des sorties V5', () => {
  const invited = W.outing1('invited');
  const team = W.outing1('invitedTeam');

  it('phase selon place et calendrier', () => {
    expect(outingPhase(invited, Date.parse(W.paris('2026-11-09T21:05')))).toBe('invited');
    expect(outingPhase(W.outing1('cancelled'), 0)).toBe('cancelled');
    expect(outingPhase(W.outing1('done'), Date.parse(W.paris('2026-11-13T09:00')))).toBe('done');
  });

  it('en-tête « Jeudi 12 novembre / 19 h 30 – 21 h 30 »', () => {
    const h = headline(invited, 'Jeux de société');
    expect(n(h.day)).toBe('Jeudi 12 novembre');
    expect(n(h.hours)).toBe('19 h 30 – 21 h 30');
    expect(n(h.line)).toBe('Jeux de société · un bar à jeux du 11e');
  });

  it('calendrier B : lieu la veille 18 h, visages J −3 h', () => {
    const s = schedule(invited);
    expect(n(s.lock)).toBe('mer. 11 nov. 18 h');
    expect(n(s.faces)).toBe('jeu. 12 nov. 16 h 30');
  });

  it('composition V5.4 : jamais de garantie, « à découvrir »', () => {
    expect(n(compositionLine(invited, 'found'))).toBe(
      '5 personnes · 26–34 ans · 2 femmes, 3 hommes, toi compris · 4 personnes à découvrir la veille',
    );
    expect(n(compositionLine(team, 'detail'))).toBe(
      '5 personnes · 26–34 ans · 2 femmes, 3 hommes, toi compris · Tom vient avec toi · 3 nouvelles personnes, à découvrir la veille',
    );
    expect(teamMates(team).map((m) => m.firstName)).toEqual(['Tom']);
  });

  it('frise des 3 jalons', () => {
    expect(
      milestones(invited, { lock: 'L', faces: 'V', outing: 'S' }).map((m) => n(m.when)),
    ).toEqual(['Mer. 11 nov. 18 h', 'Jeu. 12 nov. 16 h 30', 'Jeu. 12 nov. 19 h 30']);
  });

  it('cases du groupe : moi, proches, inconnus anonymes', () => {
    const slots = groupSlots(team, 'NINO', { me: 'Toi', unknown: '?' });
    expect(slots.map((s) => s.kind)).toEqual(['me', 'known', 'unknown', 'unknown', 'unknown']);
  });

  it('financement, prix et tranches', () => {
    expect(fundingKind(invited, true)).toBe('free');
    expect(fundingKind({ mySeat: { status: 'INVITED' } }, false)).toBe('paid');
    expect(n(euros(499))).toBe('4,99 €');
    expect(n(bracketLabel('26_29'))).toBe('26–29 ans');
    expect(n(bracketLabel('60_PLUS'))).toBe('60 ans et plus');
  });
});
