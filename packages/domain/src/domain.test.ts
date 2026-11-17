import { describe, expect, it } from 'vitest';
import { addGauges, compatibility, decayGauges, deltaFor, deltaForWords, dominantTrait, tierOf, ZERO_GAUGES } from './gauges';
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


import { applyCare, canCare, decayNeeds, shapeOf, START_NEEDS, urgentNeed, wellbeing, ENCOUNTER_QUOTA } from './care';
import { cleanOutfit, earnedItems, itemById, itemProgress, ITEMS, ITEM_SLOTS, ZERO_STATS } from './items';

describe('soins', () => {
  it('les besoins baissent puis remontent', () => {
    const tired = decayNeeds(START_NEEDS, 20);
    expect(tired).toEqual({ sociability: 50, hunger: 10, energy: 30, mood: 30 });
    // 60 % sociabilité (50) + 40 % petits besoins (20) : le minimoa est « bof », pas encore boudeur.
    expect(wellbeing(tired)).toBe(38);
    expect(shapeOf(tired)).toBe('bof');
    const flat = decayNeeds(START_NEEDS, 30);
    expect(shapeOf(flat)).toBe('boude');
    expect(ENCOUNTER_QUOTA[shapeOf(flat)]).toBe(0);
    expect(urgentNeed(tired)).toBe('hunger');
    const fed = applyCare(applyCare(tired, 'feed'), 'feed');
    expect(fed.hunger).toBe(90);
    expect(fed.sociability).toBe(50);
    expect(decayNeeds(START_NEEDS, 1000)).toEqual({ sociability: 0, hunger: 0, energy: 0, mood: 0 });
  });
  it('refuse un geste inutile ou impossible', () => {
    expect(canCare({ hunger: 95, energy: 50, mood: 50 }, 'feed')).toBe(false);
    expect(canCare({ hunger: 50, energy: 10, mood: 50 }, 'play')).toBe(false);
    expect(canCare(START_NEEDS, 'cuddle')).toBe(true);
    expect(wellbeing({ sociability: 100, hunger: 100, energy: 100, mood: 100 })).toBe(100);
  });
});

describe('garde-robe', () => {
  it('77 objets uniques (dont les 12 de la collection Hiver et le « Parrain »), 4 emplacements, au moins deux de départ par emplacement', () => {
    expect(ITEMS.length).toBe(77);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(77);
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
