import { describe, expect, it } from 'vitest';

import { decideHelloPeek, decideTabPeek, newPeekBudget, PEEK_RULES, type PeekBudget } from './peekBudget';

const T0 = Date.UTC(2026, 10, 15, 9, 0, 0);

/** Simule une session : un changement d'onglet toutes les `every` ms pendant `ms`. */
function simulate(seed: string, ms: number, every: number) {
  let b: PeekBudget = newPeekBudget(T0);
  const shows: number[] = [];
  for (let t = every; t <= ms; t += every) {
    const r = decideTabPeek(b, seed, T0 + t);
    b = r.budget;
    if (r.show) shows.push(t);
  }
  return shows;
}

describe('pet qui passe la tête au-dessus des onglets : rare', () => {
  it('rien dans les 20 premières secondes', () => {
    const shows = simulate('pet-a', 19_000, 500);
    expect(shows).toEqual([]);
  });

  it('jamais deux fois en moins de 3 minutes', () => {
    for (const seed of ['pet-a', 'pet-b', 'pet-c', 'pet-d']) {
      const shows = simulate(seed, 3_600_000, 4_000);
      for (let i = 1; i < shows.length; i++) expect(shows[i]! - shows[i - 1]!).toBeGreaterThanOrEqual(PEEK_RULES.cooldown);
    }
  });

  it('environ un changement sur dix quand on ne change pas trop vite', () => {
    // Un changement toutes les 4 minutes (la pause est toujours respectée) : seule la chance décide.
    let total = 0;
    let shown = 0;
    for (const seed of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']) {
      const shows = simulate(seed, 4 * 60_000 * 100, 4 * 60_000);
      total += 100;
      shown += shows.length;
    }
    expect(shown / total).toBeGreaterThan(0.05);
    expect(shown / total).toBeLessThan(0.16);
  });

  it('déterministe : même pet, même moment, même réponse', () => {
    expect(simulate('pet-a', 1_800_000, 3_000)).toEqual(simulate('pet-a', 1_800_000, 3_000));
  });

  it('beaucoup de changements rapides : au plus une apparition toutes les 3 minutes', () => {
    const shows = simulate('pet-x', 600_000, 1_500);
    expect(shows.length).toBeLessThanOrEqual(Math.ceil(600_000 / PEEK_RULES.cooldown));
  });
});

describe('salut au retour dans l’app', () => {
  it('au plus une fois par session, après une vraie absence', () => {
    let b = newPeekBudget(T0);
    expect(decideHelloPeek(b, 'pet-a', 120_000, T0 + 5_000).show).toBe(false); // début de session
    expect(decideHelloPeek(b, 'pet-a', 10_000, T0 + 600_000).show).toBe(false); // absence trop courte
    const first = decideHelloPeek(b, 'pet-a', 120_000, T0 + 600_000);
    b = first.budget;
    expect(b.helloDone).toBe(true);
    expect(decideHelloPeek(b, 'pet-a', 120_000, T0 + 6_000_000).show).toBe(false);
  });

  it('partage la pause de 3 minutes avec les onglets', () => {
    let b = newPeekBudget(T0);
    b = { ...b, last: T0 + 590_000 };
    expect(decideHelloPeek(b, 'pet-a', 120_000, T0 + 600_000).show).toBe(false);
  });
});
