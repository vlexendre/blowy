import { describe, expect, it } from 'vitest';
import {
  TODO,
  countOf,
  defineMessages,
  formatDate,
  formatPrice,
  localeFromAcceptLanguage,
  pickLocale,
  plural,
  shapeMismatches,
  untranslatedPaths,
} from './core';

const demo = defineMessages({
  fr: {
    back: 'Retour',
    title: [{ text: 'PERDU\n' }, { text: 'DANS LA NUIT.', dim: true }],
    days: (n: number) => `${n} jours`,
    nested: { a: 'A', b: 'B' },
  } as const,
  en: { back: 'Back', title: TODO, days: (n: number) => `${n} days`, nested: { a: 'A (en)', b: TODO } },
  es: TODO,
  pt: TODO,
  nl: { back: TODO, title: [{ text: 'VERLOREN\n' }, { text: 'IN DE NACHT.', dim: true }], days: TODO, nested: TODO },
});

describe('dictionnaires', () => {
  it('résout une langue, français pour ce qui manque', () => {
    expect(demo.in('en').back).toBe('Back');
    expect(demo.in('en').title[0].text).toBe('PERDU\n');
    expect(demo.in('en').days(3)).toBe('3 days');
    expect(demo.in('en').nested).toEqual({ a: 'A (en)', b: 'B' });
    expect(demo.in('es')).toBe(demo.in('fr'));
    expect(demo.in('nl').title[1].text).toBe('IN DE NACHT.');
  });

  it('liste ce qui reste à traduire', () => {
    expect(untranslatedPaths(demo.dictionaries.fr, demo.dictionaries.en)).toEqual(['title', 'nested.b']);
    expect(untranslatedPaths(demo.dictionaries.fr, demo.dictionaries.es)).toHaveLength(5);
    expect(shapeMismatches(demo.dictionaries.fr, demo.dictionaries.en)).toEqual([]);
  });

  it('refuse une clé manquante ou en trop (à la compilation)', () => {
    defineMessages({
      fr: { a: 'A', b: 'B' },
      // @ts-expect-error clé « b » manquante
      en: { a: 'A' },
      es: TODO,
      pt: TODO,
      // @ts-expect-error clé « c » inconnue du français
      nl: { a: 'A', b: 'B', c: 'C' },
    });
    defineMessages({
      fr: { f: (n: number) => `${n}` },
      // @ts-expect-error mauvaise signature
      en: { f: (n: string) => n },
      es: TODO,
      pt: TODO,
      nl: TODO,
    });
    expect(true).toBe(true);
  });
});

describe('langue du téléphone', () => {
  it('français si le téléphone est en français, la langue proposée sinon, anglais en repli', () => {
    expect(pickLocale(['fr-CA'])).toBe('fr');
    expect(pickLocale(['de-DE', 'nl-BE'])).toBe('nl');
    expect(pickLocale(['pt_BR'])).toBe('pt');
    expect(pickLocale(['de-DE', 'it'])).toBe('en');
    expect(pickLocale([])).toBe('en');
  });

  it('lit Accept-Language (qualité comprise)', () => {
    expect(localeFromAcceptLanguage('es-ES,es;q=0.9,en;q=0.8')).toBe('es');
    expect(localeFromAcceptLanguage('de;q=0.9, nl;q=0.8')).toBe('nl');
    expect(localeFromAcceptLanguage('en;q=0.2, pt;q=0.9')).toBe('pt');
    expect(localeFromAcceptLanguage('de')).toBe('en');
    expect(localeFromAcceptLanguage(undefined)).toBe('fr');
  });
});

describe('formats', () => {
  it('pluriels', () => {
    expect(plural('fr', 0, { one: 'jour', other: 'jours' })).toBe('jour');
    expect(plural('en', 0, { one: 'day', other: 'days' })).toBe('days');
    expect(countOf('fr', 2, { one: 'jour', other: 'jours' })).toBe('2 jours');
  });

  it('prix et dates', () => {
    expect(formatPrice('fr', 499, 'EUR').replace(/\s/g, ' ')).toBe('4,99 €');
    expect(formatPrice('en', 499, 'EUR')).toBe('€4.99');
    expect(formatDate('fr', '2026-11-22T12:00:00Z')).toBe('22 novembre');
    // Anglais américain (orthographe US) : dates à l'américaine, même sur un téléphone britannique.
    expect(formatDate('en', '2026-11-22T12:00:00Z')).toBe('November 22');
    expect(formatDate('en', '2026-11-22T12:00:00Z', undefined, 'en-GB')).toBe('November 22');
    expect(formatDate('en', '2026-11-22T12:00:00Z', { weekday: 'long', day: 'numeric', month: 'long' })).toBe('Sunday, November 22');
    expect(formatDate('en', '2026-11-22T16:19:00Z', { hour: '2-digit', minute: '2-digit' })).toBe('5:19 PM');
    expect(formatDate('fr', '2026-11-22T16:19:00Z', { hour: '2-digit', minute: '2-digit' })).toBe('17:19');
    // Les autres langues ne changent pas.
    expect(formatDate('es', '2026-11-22T12:00:00Z')).toBe('22 de noviembre');
    expect(formatDate('pt', '2026-11-22T12:00:00Z', undefined, 'pt-BR')).toBe('22 de novembro');
    expect(formatDate('nl', '2026-11-22T12:00:00Z')).toBe('22 november');
  });
});
