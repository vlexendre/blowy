import { describe, expect, it } from 'vitest';

import { speciesGradient } from '@blowy/tokens';

import { HELLO_AFTER_MS, WELCOME_AFTER_MS, homeEntrance, homePanelGradient, homePerson, homeState, homeSteps } from './logic';

const base = { today: 'todo' as const, plus: false, asleep: false, hello: false, shape: 'en_forme', person: null };

describe('homeState : les six états de V6-GAccueil', () => {
  it('seance : la séance du jour attend, bandeau violet, aucune bulle', () => {
    expect(homeState(base)).toEqual({ now: 'seance', card: 'seance', bubble: null, mood: 'great', person: false });
  });
  it('seance passe avant un bonjour reçu et avant la sieste (une seule action)', () => {
    expect(homeState({ ...base, hello: true }).now).toBe('seance');
    const s = homeState({ ...base, asleep: true });
    expect(s.now).toBe('seance');
    expect(s.card).toBe('seance');
    expect(s.mood).toBe('asleep');
    expect(s.bubble).toBe('sleep');
  });
  it('jamais de bouderie : une forme « boude » donne une humeur tranquille', () => {
    expect(homeState({ ...base, shape: 'boude' }).mood).toBe('calm');
    expect(homeState({ ...base, shape: 'bof' }).mood).toBe('calm');
  });
  it('faite : compte gratuit, même avec un bonus du serveur (rien de proposé)', () => {
    expect(homeState({ ...base, today: 'done' })).toEqual({ now: 'faite', card: 'faite', bubble: null, mood: 'content', person: true });
    expect(homeState({ ...base, today: 'bonus' }).now).toBe('faite');
  });
  it('membre : bonus et Minimoa+, « Continuer avec l’étape suivante »', () => {
    expect(homeState({ ...base, today: 'bonus', plus: true }).now).toBe('membre');
    expect(homeState({ ...base, today: 'done', plus: true }).now).toBe('faite');
  });
  it('repos : tout est fait, « À demain » et sa bulle', () => {
    expect(homeState({ ...base, today: 'all_done' })).toEqual({ now: 'repos', card: 'repos', bubble: 'rest', mood: 'content', person: false });
  });
  it('bonjour : une seule carte, au-dessus du chemin, à la place de la carte « faite »', () => {
    expect(homeState({ ...base, today: 'done', hello: true })).toEqual({ now: 'bonjour', card: 'bonjour', bubble: null, mood: 'thrilled', person: false });
  });
  it('sieste : « Zzz… », puce « Fait la sieste », la carte du jour reste en place', () => {
    expect(homeState({ ...base, today: 'done', asleep: true })).toEqual({ now: 'sieste', card: 'faite', bubble: 'sleep', mood: 'asleep', person: true });
    expect(homeState({ ...base, today: 'all_done', asleep: true }).bubble).toBe('sleep');
  });
  it('chemin pas encore lu : aucune carte, rien d’inventé', () => {
    expect(homeState({ ...base, today: null })).toEqual({ now: 'repos', card: null, bubble: null, mood: 'content', person: false });
    expect(homeState({ ...base, today: null, hello: true }).card).toBe('bonjour');
  });
  it('séance faite sans personne présentée, compte gratuit : repos, « À demain », sa bulle, aucun lien', () => {
    expect(homeState({ ...base, today: 'done', person: false })).toEqual({ now: 'repos', card: 'repos', bubble: 'rest', mood: 'content', person: false });
    expect(homeState({ ...base, today: 'bonus', person: false }).card).toBe('repos');
    expect(homeState({ ...base, today: 'done', person: false, asleep: true })).toMatchObject({ now: 'sieste', card: 'repos', bubble: 'sleep' });
  });
  it('séance faite sans personne présentée, membre : la carte sans la personne du jour (seulement l’étape suivante)', () => {
    expect(homeState({ ...base, today: 'bonus', plus: true, person: false })).toMatchObject({ now: 'membre', card: 'membre', person: false });
    expect(homeState({ ...base, today: 'bonus', plus: true, person: true }).person).toBe(true);
  });
  it('« Revoir ta personne du jour » seulement s’il y a quelqu’un', () => {
    for (const today of ['done', 'bonus', 'all_done', 'todo', null] as const)
      for (const plus of [false, true]) expect(homeState({ ...base, today, plus, person: false }).person).toBe(false);
  });
});

describe('homePerson : y a-t-il une personne du jour ?', () => {
  const day = '2026-11-23';
  it('la fin de séance du jour en mémoire le dit', () => {
    expect(homePerson({ done: { day, person: true }, today: day, suggestions: [] })).toBe(true);
    expect(homePerson({ done: { day, person: false }, today: day, suggestions: [{}] })).toBe(false);
  });
  it('une fin d’hier ne compte pas', () => {
    expect(homePerson({ done: { day: '2026-11-22', person: true }, today: day, suggestions: undefined })).toBeNull();
    expect(homePerson({ done: { day: '2026-11-22', person: true }, today: day, suggestions: [] })).toBe(false);
  });
  it('sans fin du jour : rencontres lues et vides → personne ; sinon on ne sait pas', () => {
    expect(homePerson({ done: null, today: day, suggestions: [] })).toBe(false);
    expect(homePerson({ done: null, today: day, suggestions: [{}] })).toBeNull();
    expect(homePerson({ done: null, today: null, suggestions: undefined })).toBeNull();
  });
});

describe('homePanelGradient : jamais de panneau jaune sur l’accueil', () => {
  it('aucune des 4 espèces n’a un panneau `accent` (le seul jaune est « Commencer »)', () => {
    for (const species of Object.keys(speciesGradient) as (keyof typeof speciesGradient)[]) expect(homePanelGradient(species)).not.toBe('accent');
    expect(Object.keys(speciesGradient)).toHaveLength(4);
    expect(homePanelGradient('pia')).toBe('wine');
    expect(homePanelGradient('nino')).toBe(speciesGradient.nino);
  });
});

const step = (id: string, state: 'done' | 'current' | 'locked') => ({ id, title: id, state });
const unit = (id: string, steps: ReturnType<typeof step>[]) => ({ id, title: `U ${id}`, subtitle: '', icon: '', state: 'current' as const, done: 0, total: steps.length, steps });
const units = [
  unit('a', [step('a1', 'done'), step('a2', 'done'), step('a3', 'done')]),
  unit('b', [step('b1', 'done'), step('b2', 'current'), step('b3', 'locked')]),
  unit('c', [step('c1', 'locked'), step('c2', 'locked')]),
];
const kinds = (r: ReturnType<typeof homeSteps>) => r.steps.map((s) => `${s.number}=${s.kind}`);

describe('homeSteps : le chemin de l’accueil', () => {
  it('séance à faire : deux faites, l’étape du jour (seul jaune), puis la suite jusqu’à la fin de l’univers', () => {
    const r = homeSteps({ units, currentStepId: 'b2', today: { state: 'todo' } });
    expect(r.firstIndex).toBe(2);
    expect(kinds(r)).toEqual(['3=done', '4=done', '5=current', '6=locked']);
    expect(r.more).toBe(true);
    expect(r.steps.filter((s) => s.kind === 'current')).toHaveLength(1);
  });
  it('séance faite, fin du jour en mémoire : plus de jaune, l’étape faite aujourd’hui, la suivante à venir', () => {
    const map = { units: units.map((u) => (u.id === 'b' ? { ...u, steps: [step('b1', 'done'), step('b2', 'done'), step('b3', 'current')] } : u)), currentStepId: 'b3' };
    const r = homeSteps({ ...map, today: { state: 'done' } }, 'b2');
    expect(kinds(r)).toEqual(['3=done', '4=done', '5=today', '6=locked']);
    expect(r.steps.some((s) => s.kind === 'current')).toBe(false);
  });
  it('séance faite sans fin du jour en mémoire : aucune étape marquée « faite aujourd’hui »', () => {
    const map = { units: units.map((u) => (u.id === 'b' ? { ...u, steps: [step('b1', 'done'), step('b2', 'done'), step('b3', 'current')] } : u)), currentStepId: 'b3' };
    const r = homeSteps({ ...map, today: { state: 'done' } });
    expect(kinds(r)).toEqual(['4=done', '5=done', '6=locked']);
    expect(r.steps.some((s) => s.kind === 'today' || s.kind === 'current')).toBe(false);
  });
  it('dernière étape d’un univers faite : on voit le début du suivant', () => {
    const map = { units: units.map((u) => (u.id === 'b' ? { ...u, steps: u.steps.map((s) => ({ ...s, state: 'done' as const })) } : u.id === 'c' ? { ...u, steps: [step('c1', 'current'), step('c2', 'locked')] } : u)), currentStepId: 'c1' };
    const r = homeSteps({ ...map, today: { state: 'done' } }, 'b3');
    expect(kinds(r)).toEqual(['4=done', '5=done', '6=today', '7=locked', '8=locked']);
    expect(r.more).toBe(false);
  });
  it('séance faite d’après la fin de séance gardée en mémoire', () => {
    const r = homeSteps({ units, currentStepId: 'b2', today: { state: 'all_done' } }, 'a2');
    expect(r.steps.find((s) => s.kind === 'today')?.number).toBe(2);
  });
  it('une séance de révision (aucune étape faite aujourd’hui) ne marque rien de faux', () => {
    const r = homeSteps({ units, currentStepId: 'b2', today: { state: 'done' } }, 'b2');
    expect(r.steps.some((s) => s.kind === 'today')).toBe(false);
  });
  it('petit écran : une seule étape faite au-dessus de celle du jour', () => {
    const r = homeSteps({ units, currentStepId: 'b2', today: { state: 'todo' } }, null, 1);
    expect(r.firstIndex).toBe(3);
    expect(kinds(r)).toEqual(['4=done', '5=current', '6=locked']);
  });
  it('tout au début : la première étape en haut, sans place vide', () => {
    const fresh = [unit('a', [step('a1', 'current'), step('a2', 'locked')])];
    const r = homeSteps({ units: fresh, currentStepId: 'a1', today: { state: 'todo' } });
    expect(r.firstIndex).toBe(0);
    expect(kinds(r)).toEqual(['1=current', '2=locked']);
    expect(r.more).toBe(false);
  });
  it('parcours fini : les dernières étapes ; une révision se lance depuis la dernière', () => {
    const done = units.map((u) => ({ ...u, steps: u.steps.map((s) => ({ ...s, state: 'done' as const })) }));
    expect(kinds(homeSteps({ units: done, currentStepId: null, today: { state: 'all_done' } }, 'c2'))).toEqual(['6=done', '7=done', '8=today']);
    expect(kinds(homeSteps({ units: done, currentStepId: null, today: { state: 'all_done' } }))).toEqual(['6=done', '7=done', '8=done']);
    expect(kinds(homeSteps({ units: done, currentStepId: null, today: { state: 'todo' } }))).toEqual(['6=done', '7=done', '8=current']);
  });
});

describe('homeEntrance : un moment par ouverture, jamais de reproche', () => {
  const now = 1_000_000_000_000;
  it('première ouverture : il arrive en marchant', () => {
    expect(homeEntrance({ last: null, now, night: false })).toBe('arrive');
  });
  it('après 12 h : coucou ; la nuit : il bâille ; après 3 jours : bras ouverts', () => {
    expect(homeEntrance({ last: now - HELLO_AFTER_MS - 1, now, night: false })).toBe('wave');
    expect(homeEntrance({ last: now - HELLO_AFTER_MS - 1, now, night: true })).toBe('yawn');
    expect(homeEntrance({ last: now - WELCOME_AFTER_MS - 1, now, night: true })).toBe('welcome');
  });
});
