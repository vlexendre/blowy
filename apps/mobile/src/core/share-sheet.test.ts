import { describe, expect, it, vi } from 'vitest';

import { presentShare } from './share-sheet';

describe('presentShare', () => {
  it('ouverte puis fermée normalement : true', async () => {
    expect(await presentShare(() => Promise.resolve({ action: 'sharedAction' }), undefined, 50)).toBe(true);
  });

  it('rejet ou exception : false (l’appelant se replie sur le lien)', async () => {
    expect(await presentShare(() => Promise.reject(new Error('activityError')), undefined, 50)).toBe(false);
    expect(
      await presentShare(
        () => {
          throw new Error('module absent');
        },
        undefined,
        50,
      ),
    ).toBe(false);
  });

  it('feuille toujours à l’écran : true au bout du délai, sans attendre sa fermeture', async () => {
    const start = Date.now();
    expect(await presentShare(() => new Promise(() => undefined), undefined, 30)).toBe(true);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('erreur arrivée après le délai : onLateFailure', async () => {
    const late = vi.fn();
    let fail: (e: Error) => void = () => undefined;
    const ok = await presentShare(() => new Promise((_, reject) => (fail = reject)), late, 20);
    expect(ok).toBe(true);
    fail(new Error('tard'));
    await new Promise((r) => setTimeout(r, 0));
    expect(late).toHaveBeenCalledOnce();
  });
});
