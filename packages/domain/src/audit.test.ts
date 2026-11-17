import { describe, expect, it } from 'vitest';
import {
  MANUAL_AREA_CHANGE_DAYS,
  REVIEW_DEFAULT_CENTER,
  autoSuspensionHours,
  classifyText,
  decideModeration,
  distanceKm,
  fixtureVision,
  manualAreaChange,
  offsetPoint,
  parseAiModeration,
  reportAlertDue,
  reportPriority,
  reviewFixtureId,
  reviewWorldPlan,
  snapToGrid,
  storedPoint,
  wordsOf,
} from './index';

const decide = (surface: Parameters<typeof decideModeration>[0], text: string, locale: 'fr' | 'en' | 'es' | 'pt' | 'nl' = 'fr') =>
  decideModeration(surface, classifyText(text, locale));

describe('filtre des contenus : normalisation', () => {
  it('défait les contournements simples', () => {
    expect(wordsOf('C0NNNNARD')).toEqual(['conard']);
    expect(wordsOf('c.o.n.n.a.r.d')).toEqual(['conard']);
    expect(wordsOf('s e x e')).toEqual(['sexe']);
    expect(wordsOf('Ѕаlоре')).toEqual(['salope']); // homoglyphes cyrilliques
    expect(wordsOf('sa​lope')).toEqual(['salope']); // caractère invisible
    expect(wordsOf('Pédé')).toEqual(['pede']);
  });
});

describe('filtre des contenus : messages', () => {
  it('laisse passer une conversation ordinaire, en français comme en anglais', () => {
    for (const [text, locale] of [
      ['Salut ! Tu fais quoi ce week-end ?', 'fr'],
      ['Désolé pour le retard, le métro était bloqué.', 'fr'],
      ['Mes enfants sont chez leur père, on peut se voir samedi.', 'fr'],
      ['J’ai trop ri, je suis crevée.', 'fr'],
      ['Tu m’envoies ton numéro ? 06 12 34 56 78 sinon', 'fr'],
      ['Ajoute-moi sur insta si tu veux', 'fr'],
      ['I grabbed a bite at the café, what kind of music do you like?', 'en'],
      ['My kids loved the movie, see you Saturday?', 'en'],
      ['Vamos con mis amigos al cine.', 'es'],
    ] as const) {
      expect(decide('message', text, locale).outcome, text).toBe('allow');
    }
  });

  it('bloque les violations nettes, même déguisées', () => {
    expect(decide('message', 'Je vais te tuer')).toEqual({ outcome: 'block', category: 'threat' });
    expect(decide('message', 'I know where you live', 'en')).toEqual({ outcome: 'block', category: 'threat' });
    expect(decide('message', 'je s@is où tu h4bites')).toEqual({ outcome: 'block', category: 'threat' });
    expect(decide('message', 'sale b0ugnoule').category).toBe('hate');
    expect(decide('message', 'f@ggot', 'en').category).toBe('hate');
    expect(decide('message', 'Gagne de l’argent facile en crypto : https://get-rich.xyz').category).toBe('scam');
    expect(decide('message', 'Escort, mes tarifs sur whatsapp').category).toBe('commercial_sex');
    expect(decide('message', 'envoie des nudes, j’ai 15 ans').category).toBe('minor_sexual');
    expect(decide('message', 'send me nudes of your kids', 'en').category).toBe('minor_sexual');
  });

  it('distingue le vocabulaire pédocriminel explicite (seul cas de suspension automatique)', () => {
    const v = classifyText('t’as des liens p3d0p0rn ?');
    expect(v.category).toBe('minor_sexual');
    expect(v.explicitMinor).toBe(true);
    expect(classifyText('envoie des nudes, j’ai 15 ans').explicitMinor).toBe(false);
  });

  it('livre mais signale les insultes et le sexe explicite', () => {
    expect(decide('message', 'T’es vraiment un connard')).toEqual({ outcome: 'flag', category: 'insult' });
    expect(decide('message', 'c o n n a s s e')).toEqual({ outcome: 'flag', category: 'insult' });
    expect(decide('message', 'You are such a bitch', 'en')).toEqual({ outcome: 'flag', category: 'insult' });
    expect(decide('message', 'send nudes', 'en')).toEqual({ outcome: 'flag', category: 'sexual' });
    expect(decide('message', 'plan cul ce soir ?')).toEqual({ outcome: 'flag', category: 'sexual' });
  });

  it('ne confond pas les mots ambigus d’une langue à l’autre', () => {
    expect(decide('message', 'con', 'fr').outcome).toBe('flag');
    expect(decide('message', 'Voy con ella', 'es').outcome).toBe('allow');
    expect(decide('message', 'sorry for the retard joke', 'fr').outcome).toBe('allow');
  });

  it('hésite sur un lien nu (IA si permise, sinon livré)', () => {
    expect(decide('message', 'regarde ça www.example.com')).toEqual({ outcome: 'review', category: null });
  });
});

describe('filtre des contenus : noms et notes', () => {
  it('refuse un nom grossier, déguisé, ou qui contient un contact', () => {
    expect(decide('display_name', 'Salope').outcome).toBe('block');
    expect(decide('display_name', 'P.u.t.e').outcome).toBe('block');
    expect(decide('pet_name', 'snap: lea93').outcome).toBe('block');
    expect(decide('display_name', 'lea@mail.com').outcome).toBe('block');
    expect(decide('display_name', 'Bitch', 'en').outcome).toBe('block');
  });

  it('accepte les prénoms et noms ordinaires', () => {
    for (const name of ['Léa', 'Jean-Luc', 'Chloé', 'Noé', 'Malo', 'Conrad', 'Pascal', 'Nino', 'Gaston', 'Sasha', 'Suzie', 'Mona']) {
      expect(decide('display_name', name).outcome, name).toBe('allow');
    }
  });

  it('ne refuse jamais une note de signalement, mais la priorise', () => {
    expect(decide('report_note', 'Il m’a dit je vais te tuer')).toEqual({ outcome: 'allow', category: 'threat' });
    expect(decide('report_note', 'il insulte')).toEqual({ outcome: 'allow', category: null });
  });
});

describe('IA de modération', () => {
  it('lit un seul mot connu, sinon rien', () => {
    expect(parseAiModeration('OK')).toEqual({ label: 'OK', category: null });
    expect(parseAiModeration('minor.')).toEqual({ label: 'MINOR', category: 'minor_sexual' });
    expect(parseAiModeration('Je ne sais pas')).toBeNull();
  });
});

describe('signalements : priorité, escalade, alerte', () => {
  const base = { reason: 'harcelement', category: null, distinctReporters: 1, distinctMinorReporters: 0 } as const;
  it('urgent pour un mineur ou une menace, haut pour plusieurs personnes', () => {
    expect(reportPriority(base)).toBe('normal');
    expect(reportPriority({ ...base, reason: 'mineur' })).toBe('urgent');
    expect(reportPriority({ ...base, category: 'threat' })).toBe('urgent');
    expect(reportPriority({ ...base, distinctReporters: 3 })).toBe('high');
    expect(reportPriority({ ...base, category: 'hate' })).toBe('high');
  });
  it('suspend automatiquement seulement dans deux cas', () => {
    expect(autoSuspensionHours({ explicitMinor: false, distinctMinorReporters: 1 })).toBeNull();
    expect(autoSuspensionHours({ explicitMinor: false, distinctMinorReporters: 2 })).toBe(72);
    expect(autoSuspensionHours({ explicitMinor: true, distinctMinorReporters: 0 })).toBe(72);
  });
  it('regroupe les alertes, sauf l’urgent', () => {
    const now = new Date('2026-11-15T12:00:00Z');
    expect(reportAlertDue({ lastAlertAt: null, now, urgent: false })).toBe(true);
    expect(reportAlertDue({ lastAlertAt: '2026-11-15T11:50:00Z', now, urgent: false })).toBe(false);
    expect(reportAlertDue({ lastAlertAt: '2026-11-15T11:50:00Z', now, urgent: true })).toBe(true);
    expect(reportAlertDue({ lastAlertAt: '2026-11-15T11:40:00Z', now, urgent: false })).toBe(true);
  });
});

describe('zone choisie sans localisation', () => {
  it('gratuit : une fois tous les 30 jours ; Minimoa+ : quand on veut', () => {
    expect(manualAreaChange({ setOn: null, today: '2026-11-15', anytime: false })).toEqual({ allowed: true, nextOn: null });
    expect(manualAreaChange({ setOn: '2026-11-10', today: '2026-11-15', anytime: false })).toEqual({ allowed: false, nextOn: '2026-12-10' });
    expect(manualAreaChange({ setOn: '2026-10-01', today: '2026-11-15', anytime: false }).allowed).toBe(true);
    expect(manualAreaChange({ setOn: '2026-11-14', today: '2026-11-15', anytime: true }).allowed).toBe(true);
    expect(MANUAL_AREA_CHANGE_DAYS).toBe(30);
  });
  it('n’enregistre jamais un point plus précis que la maille de 300 m', () => {
    const exact = { lat: 48.867412, lng: 2.363611 };
    const stored = storedPoint(exact);
    expect(stored).toEqual(snapToGrid(exact, 300));
    expect(distanceKm(exact, stored)).toBeLessThan(0.25);
    // Deux points de la même maille donnent la même valeur : la position exacte ne se déduit pas.
    expect(storedPoint({ lat: 48.86745, lng: 2.36359 })).toEqual(stored);
  });
});

describe('monde du compte de revue', () => {
  it('rend 8 personnes fictives variées, sans rien sur ce que chacun cherche', () => {
    const plan = reviewWorldPlan();
    expect(plan).toHaveLength(8);
    expect(new Set(plan.map((f) => f.gender)).size).toBeGreaterThan(1);
    for (const f of plan) expect(Object.keys(f)).not.toContain('seeking');
  });
  it('identifiants stables par monde, distincts entre mondes', () => {
    const a = reviewFixtureId('11111111-1111-4111-8111-111111111111', 0);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(reviewFixtureId('11111111-1111-4111-8111-111111111111', 0)).toBe(a);
    expect(reviewFixtureId('11111111-1111-4111-8111-111111111111', 1)).not.toBe(a);
    expect(reviewFixtureId('22222222-2222-4222-8222-222222222222', 0)).not.toBe(a);
  });
  it('place les personnes à la bonne distance et garde un écart de vision réel', () => {
    const p = offsetPoint(REVIEW_DEFAULT_CENTER, 4, 80);
    expect(distanceKm(REVIEW_DEFAULT_CENTER, p)).toBeCloseTo(4, 1);
    const v = fixtureVision({ foyer: 100, ancrage: 0, elan: -100, rythme: 10, cap: 0 }, { foyer: 20, ancrage: 5, elan: -30, rythme: 0, cap: 0 });
    expect(v.foyer).toBe(80);
    expect(v.elan).toBe(-70);
  });
});
