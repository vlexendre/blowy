import { describe, expect, it } from 'vitest';
import { addGauges, compatibility, decayGauges, deltaFor, deltaForWords, dominantTrait, tierOf, ZERO_GAUGES } from './gauges';
import { applyLinkEvent, canRevive, levelForXp, newLink, reviveLink, tickLink, faceVisibility } from './link';
import { addDays, ageOn, dayOf, daysBetween } from './days';
import { formOf } from './pet';

describe('jauges', () => {
  it('bouge puis retombe vers 0', () => {
    let g = ZERO_GAUGES;
    for (let i = 0; i < 4; i++) g = addGauges(g, deltaFor('met_new_pet'));
    expect(g.social).toBe(48);
    expect(tierOf(g.social)).toBe(1);
    expect(formOf(g)).toBe('sociable');
    g = decayGauges(g, 10);
    expect(g.social).toBe(18);
    expect(decayGauges(g, 100).social).toBe(0);
    expect(dominantTrait(decayGauges(g, 100))).toBeNull();
  });
  it('reste bornée', () => {
    expect(addGauges({ ...ZERO_GAUGES, tender: -98 }, deltaFor('tease')).tender).toBe(-100);
  });
  it('3 mots', () => {
    expect(deltaForWords(['drole', 'taquin', 'inconnu'])).toEqual({ play: 9, tender: -3 });
  });
  it('compatibilité', () => {
    expect(compatibility(ZERO_GAUGES, ZERO_GAUGES)).toBe(100);
    expect(compatibility({ social: 100, play: 100, tender: 100, talk: 100 }, { social: -100, play: -100, tender: -100, talk: -100 })).toBe(0);
  });
});

describe('jours', () => {
  it('calcule en heure de Paris', () => {
    expect(dayOf(new Date('2026-11-11T23:30:00Z'))).toBe('2026-11-12');
    expect(daysBetween('2026-02-27', '2026-03-01')).toBe(2);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(ageOn('2008-11-12', '2026-11-11')).toBe(17);
    expect(ageOn('2008-11-11', '2026-11-11')).toBe(18);
  });
});

describe('lien', () => {
  const d0 = '2026-11-01';
  it('ne perd rien le lendemain d’un jour actif', () => {
    expect(tickLink(newLink(d0), addDays(d0, 1)).lives).toBe(7);
  });
  it('perd une vie par jour entier de silence', () => {
    expect(tickLink(newLink(d0), addDays(d0, 2)).lives).toBe(6);
    expect(tickLink(newLink(d0), addDays(d0, 4)).lives).toBe(4);
    // rattrapage en deux fois = même résultat qu'en une fois
    const step = tickLink(tickLink(newLink(d0), addDays(d0, 2)), addDays(d0, 4));
    expect(step.lives).toBe(4);
  });
  it('devient fantôme puis se ranime une seule fois', () => {
    const ghost = tickLink(newLink(d0), addDays(d0, 30));
    expect(ghost.status).toBe('ghost');
    expect(canRevive(ghost)).toBe(true);
    const back = reviveLink(ghost, addDays(d0, 30))!;
    expect(back.lives).toBe(3);
    const again = tickLink(back, addDays(d0, 60));
    expect(again.status).toBe('ghost');
    expect(reviveLink(again, addDays(d0, 60))).toBeNull();
  });
  it('un message garde le lien en vie et rapporte de l’expérience plafonnée', () => {
    let s = newLink(d0);
    for (let i = 0; i < 5; i++) s = applyLinkEvent(s, 'message', addDays(d0, i + 1)).state;
    expect(s.lives).toBe(7);
    expect(s.xp).toBe(5);
    expect(applyLinkEvent(s, 'message', addDays(d0, 6), 20).state.xp).toBe(5);
  });
  it('la photo à deux rend une vie et fait monter la série', () => {
    const hurt = tickLink(newLink(d0), addDays(d0, 3));
    expect(hurt.lives).toBe(5);
    const r = applyLinkEvent(hurt, 'duo_photo', addDays(d0, 3));
    expect(r.lifeGained).toBe(true);
    expect(r.state.lives).toBe(6);
    expect(r.state.streak).toBe(1);
    const next = applyLinkEvent(r.state, 'duo_photo', addDays(d0, 4));
    expect(next.state.streak).toBe(2);
    expect(tickLink(next.state, addDays(d0, 7)).streak).toBe(0);
  });
  it('niveaux', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(40)).toBe(2);
    expect(levelForXp(5000)).toBe(7);
    expect(faceVisibility(3)).toBe('hidden');
    expect(faceVisibility(4)).toBe('blurred');
    expect(faceVisibility(6)).toBe('clear');
  });
});
