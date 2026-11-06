/** V5.6 (E11) : estimation documentée d'un temps de trajet entre centres de quartier (jamais une position de personne). */
import { describe, expect, it } from 'vitest';
import { centerOf, estimateTravelMinutes, haversineKm } from '../domain/travel.js';

describe('temps de trajet estimé', () => {
  const bastille = { lat: 48.8532, lng: 2.3692 };
  const belleville = { lat: 48.8718, lng: 2.3767 };
  const saintDenis = { lat: 48.9362, lng: 2.3574 };
  it('distance à vol d’oiseau, détour, vitesse de porte à porte, arrondi à 5 min', () => {
    expect(haversineKm(bastille, belleville)).toBeCloseTo(2.1, 1);
    expect(estimateTravelMinutes(bastille, belleville)).toBe(15);
    expect(estimateTravelMinutes(bastille, saintDenis)).toBe(45);
    expect(estimateTravelMinutes(bastille, bastille)).toBe(5);
  });
  it('centre : saisi par ops, sinon moyenne des lieux, sinon inconnu', () => {
    expect(centerOf({ centerLat: 1, centerLng: 2 }, [bastille])).toEqual({ lat: 1, lng: 2 });
    expect(centerOf({ centerLat: null, centerLng: null }, [{ lat: 0, lng: 0 }, { lat: 2, lng: 4 }])).toEqual({ lat: 1, lng: 2 });
    expect(centerOf({ centerLat: null, centerLng: null }, [])).toBeNull();
  });
});
