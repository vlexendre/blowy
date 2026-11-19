import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { optimistic, patch, rollback } from './optimistic';

describe('mises à jour optimistes du cache', () => {
  it('applique tout de suite, puis revient à l’état d’avant si l’API refuse', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['groups'], { invitations: [{ groupId: 'a' }, { groupId: 'b' }] });
    const snap = await optimistic(qc, [patch<{ invitations: { groupId: string }[] }>(['groups'], (g) => ({ invitations: g.invitations.filter((i) => i.groupId !== 'a') }))]);
    expect(qc.getQueryData(['groups'])).toEqual({ invitations: [{ groupId: 'b' }] });
    rollback(qc, snap);
    expect(qc.getQueryData(['groups'])).toEqual({ invitations: [{ groupId: 'a' }, { groupId: 'b' }] });
  });

  it('une clé absente du cache est laissée telle quelle (rien d’inventé)', async () => {
    const qc = new QueryClient();
    const snap = await optimistic(qc, [patch<number>(['absent'], (n) => n + 1)]);
    expect(qc.getQueryData(['absent'])).toBeUndefined();
    expect(snap.before).toEqual([]);
    rollback(qc, undefined);
  });

  it('annule une lecture en vol : sa réponse plus ancienne n’écrase pas le changement', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['me'], { on: false });
    let resolve: (v: { on: boolean }) => void = () => undefined;
    const fetching = qc.fetchQuery({ queryKey: ['me'], queryFn: () => new Promise<{ on: boolean }>((r) => (resolve = r)), staleTime: 0 }).catch(() => 'annulée');
    await optimistic(qc, [patch<{ on: boolean }>(['me'], () => ({ on: true }))]);
    resolve({ on: false });
    await fetching;
    expect(qc.getQueryData(['me'])).toEqual({ on: true });
  });
});
