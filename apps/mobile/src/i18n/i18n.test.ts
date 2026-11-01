import { describe, expect, it } from 'vitest';
import fr from './fr.json';
import { hasKey, interpolate, t, tDynamic } from './index';

const leaves = (o: unknown, p = ''): string[] => (typeof o === 'string' ? [p] : Object.entries(o as object).flatMap(([k, v]) => leaves(v, p ? `${p}.${k}` : k)));

describe('i18n', () => {
  it('interpolation', () => {
    expect(t('pet.withOther', { name: 'Suzie' })).toBe('avec Suzie');
    expect(interpolate('{a} et {b}', { a: 1 })).toBe('1 et {b}');
  });
  it('clé dynamique inconnue renvoie la clé (jamais de crash)', () => {
    expect(tDynamic('pose.NOPE')).toBe('pose.NOPE');
    expect(hasKey('pose.JOYFUL')).toBe(true);
  });
  it('couvre toutes les poses, espèces, intentions, catégories de signalement', () => {
    for (const p of ['PRESENTATION', 'JOYFUL', 'SAD', 'SICK', 'ASLEEP', 'HUNGRY', 'POUTING', 'PROUD', 'SURPRISED', 'AFFECTIONATE', 'LEAP', 'DANCE']) expect(hasKey(`pose.${p}`)).toBe(true);
    for (const s of ['GASTON', 'PIA', 'NINO', 'SUZIE']) expect(hasKey(`species.${s}`)).toBe(true);
    for (const i of ['FRIENDS_ONE', 'FRIENDS_GROUP', 'OPEN_TO_MORE', 'LET_IT_HAPPEN']) expect(hasKey(`onboarding.intention.${i}.title`)).toBe(true);
    for (const c of ['FAKE_PROFILE', 'INAPPROPRIATE', 'HARASSMENT', 'MONEY_REQUEST', 'MINOR', 'SAFETY', 'OTHER']) expect(hasKey(`report.category.${c}`)).toBe(true);
  });
  it('aucune valeur vide', () => {
    for (const k of leaves(fr)) expect(tDynamic(k).length, k).toBeGreaterThan(0);
  });
});
