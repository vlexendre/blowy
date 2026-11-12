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

import { applyCare, canCare, decayNeeds, shapeOf, START_NEEDS, urgentNeed, wellbeing, ENCOUNTER_QUOTA } from './care';
import { cleanOutfit, earnedItems, itemById, itemProgress, ITEMS, ITEM_SLOTS, ZERO_STATS } from './items';

describe('soins', () => {
  it('les besoins baissent puis remontent', () => {
    const tired = decayNeeds(START_NEEDS, 20);
    expect(tired).toEqual({ hunger: 10, energy: 30, mood: 30 });
    expect(shapeOf(tired)).toBe('boude');
    expect(ENCOUNTER_QUOTA[shapeOf(tired)]).toBe(0);
    expect(urgentNeed(tired)).toBe('hunger');
    const fed = applyCare(applyCare(tired, 'feed'), 'feed');
    expect(fed.hunger).toBe(90);
    expect(decayNeeds(START_NEEDS, 1000)).toEqual({ hunger: 0, energy: 0, mood: 0 });
  });
  it('refuse un geste inutile ou impossible', () => {
    expect(canCare({ hunger: 95, energy: 50, mood: 50 }, 'feed')).toBe(false);
    expect(canCare({ hunger: 50, energy: 10, mood: 50 }, 'play')).toBe(false);
    expect(canCare(START_NEEDS, 'cuddle')).toBe(true);
    expect(wellbeing({ hunger: 100, energy: 100, mood: 100 })).toBe(100);
  });
});

describe('garde-robe', () => {
  it('64 objets uniques, 4 emplacements, au moins deux de départ par emplacement', () => {
    expect(ITEMS.length).toBe(64);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(64);
    for (const slot of ITEM_SLOTS) expect(ITEMS.filter((i) => i.slot === slot && i.unlock.kind === 'start').length).toBeGreaterThanOrEqual(2);
  });
  it('débloque par étapes', () => {
    expect(earnedItems(ZERO_STATS)).toHaveLength(8);
    const some = earnedItems({ ...ZERO_STATS, careDays: 5, links: 1 });
    expect(some).toContain('bonnet');
    expect(some).toContain('noeud');
    expect(some).not.toContain('toque');
    expect(some).not.toContain('aureole');
    expect(itemProgress(itemById('toque')!, { ...ZERO_STATS, careDays: 4 })).toEqual({ have: 4, need: 10 });
  });
  it('nettoie une tenue', () => {
    const owned = new Set(['bob', 'echarpe']);
    expect(cleanOutfit({ head: 'bob', face: 'bob', body: 'cape', toy: 'inconnu' }, owned)).toEqual({ head: 'bob' });
  });
});
