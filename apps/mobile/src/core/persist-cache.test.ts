import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));

const { firstPageOnly, keepCache, keepQuery, restoreCache, snapshot } = await import('./persist-cache');

describe('cache gardé entre deux lancements', () => {
  it('ne garde que les premiers écrans', () => {
    expect(keepQuery(['me'])).toBe('whole');
    expect(keepQuery(['links'])).toBe('whole');
    expect(keepQuery(['links', 'abc'])).toBe('whole');
    expect(keepQuery(['links', 'abc', 'messages'])).toBe('thread');
    expect(keepQuery(['groups', 'g', 'messages'])).toBeNull();
    expect(keepQuery(['rituals', 'today'])).toBe('whole');
    expect(keepQuery(['links', 'abc', 'minimoas'])).toBeNull();
    expect(keepQuery(['invite', 'CODE'])).toBeNull();
    expect(keepQuery(['rituals', 'memories'])).toBeNull();
  });

  it('un fil : sa page la plus récente seulement', () => {
    expect(firstPageOnly({ pages: [1, 2, 3], pageParams: [undefined, 'a', 'b'] })).toEqual({ pages: [1], pageParams: [undefined] });
    expect(firstPageOnly({ x: 1 })).toEqual({ x: 1 });
  });

  it('au plus 8 fils, les plus récents', () => {
    const qc = new QueryClient();
    for (let i = 0; i < 10; i++) qc.setQueryData(['links', `l${i}`, 'messages'], { pages: [{ i }], pageParams: [undefined] }, { updatedAt: 1000 + i });
    qc.setQueryData(['links', 'l0', 'minimoas'], { muted: false });
    const kept = snapshot(qc).queries.map((q) => q.queryKey[1]);
    expect(kept).toHaveLength(8);
    expect(kept).not.toContain('l0');
    expect(kept).not.toContain('l1');
  });

  it('remis pour la même personne et le même build ; jamais pour une autre', async () => {
    vi.useFakeTimers();
    const a = new QueryClient();
    const stop = keepCache(a, 'alice', '1.0+42');
    a.setQueryData(['links'], [{ id: 'x' }]);
    await vi.advanceTimersByTimeAsync(2500);
    stop();
    vi.useRealTimers();

    const b = new QueryClient();
    await restoreCache(b, 'alice', '1.0+42');
    expect(b.getQueryData(['links'])).toEqual([{ id: 'x' }]);
    // Donnée remise mais datée : relue dès qu'un écran la lit.
    expect(b.getQueryState(['links'])?.dataUpdatedAt).toBeLessThanOrEqual(Date.now());

    const c = new QueryClient();
    await restoreCache(c, 'bob', '1.0+42');
    expect(c.getQueryData(['links'])).toBeUndefined();
    // Et c'est oublié : plus rien à remettre, même à Alice.
    const d = new QueryClient();
    await restoreCache(d, 'alice', '1.0+42');
    expect(d.getQueryData(['links'])).toBeUndefined();
  });
});
