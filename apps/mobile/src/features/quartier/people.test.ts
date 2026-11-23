import type { Encounters, MapPin, Person } from '@blowy/contract';
import { describe, expect, it } from 'vitest';

import { canWave, quartierPeople } from './people';

const person = (id: string): Person => ({
  id,
  displayName: id,
  pet: { name: `pet-${id}`, species: 'nino' } as Person['pet'],
  face: 'blurred',
  avatarUrl: null,
});
const explanation = { commonTitle: 'Vous deux', common: [{ name: 'Dehors', text: 'Comme toi, dehors.' }], exploreTitle: 'À explorer', explore: { name: 'Calme', text: '' } } as unknown as MapPin['explanation'];
const home = { latitude: 48.85, longitude: 2.35 };
const pin = (id: string, dLat: number, relation?: MapPin['relation']): MapPin => ({
  user: person(id),
  position: { latitude: home.latitude + dLat, longitude: home.longitude },
  compatibility: 80,
  explanation,
  relation,
});
const suggestion = (id: string, waved = false) =>
  ({ user: person(id), compatibility: 82, explanation, via: 'nearby', mutualName: null, intro: 'Salut', waved }) as Encounters['suggestions'][number];

describe('quartierPeople', () => {
  it('réunit présentés du jour et épingles, la personne du jour d’abord, sans doublon', () => {
    const r = quartierPeople({
      encounters: { suggestions: [suggestion('a'), suggestion('b', true)], incoming: [] },
      pins: [pin('b', 0.005), pin('c', 0.1)],
      from: home,
      dayPerson: 'b',
    });
    expect(r.today.map((n) => n.id)).toEqual(['b', 'a']);
    expect(r.around.map((n) => n.id)).toEqual(['c']);
    expect(r.byId.size).toBe(3);
    expect(r.today[0]?.relation).toBe('waved');
  });
  it('distance toujours en bandes, jamais au mètre ; inconnue sans épingle', () => {
    const r = quartierPeople({ encounters: { suggestions: [suggestion('a')], incoming: [] }, pins: [pin('b', 0.005), pin('c', 0.03), pin('d', 0.2)], from: home });
    expect(r.byId.get('a')?.band).toBeNull();
    expect(r.byId.get('b')?.band).toBe('neighborhood');
    expect(r.byId.get('c')?.band).toBe('near');
    expect(r.byId.get('d')?.band).toBe('around');
  });
  it('un bonjour reçu se lit sur la fiche ; saluer une épingle non présentée demande Minimoa+', () => {
    const r = quartierPeople({
      encounters: { suggestions: [], incoming: [{ id: 'e1', from: person('c'), compatibility: 80, explanation: null, intro: '', at: '2026-11-23T10:00:00Z' }] },
      pins: [pin('c', 0.01)],
      from: home,
    });
    const c = r.byId.get('c');
    expect(c?.relation).toBe('waved_you');
    expect(c && canWave(c, false)).toBe(false);
    expect(c && canWave(c, true)).toBe(true);
  });
});
