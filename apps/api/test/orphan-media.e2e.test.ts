/**
 * Ménage des photos de profil orphelines (`OrphanMediaJobs`, docs/ADA-2027.md, RGPD) :
 * - `MEDIA_SWEEP=dry` (défaut) compte sans rien effacer ;
 * - `on` efface les dossiers sans profil et les restes des autres, garde la photo courante, sa vignette et les fichiers
 *   de moins de deux heures ; par lots bornés (curseur), puis repos ; une seconde passe n'efface plus rien ;
 * - `off` ne fait rien.
 */
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import type { MemoryStorage } from '../src/integrations/storage/memory-storage';
import { blurPathOf } from '../src/modules/me/application/avatar-blurs';
import { OrphanMediaJobs } from '../src/modules/me/application/orphan-media.jobs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB, STORAGE } from '../src/shared/tokens';
import { type TestWorld, onboardBody, startWorld, upload } from './helpers';

/** Plus que les 50 dossiers d'un passage : la passe en demande deux. */
const ORPHANS = 30;

describe('ménage des photos de profil orphelines', () => {
  let world: TestWorld;
  afterEach(() => world.close());

  const bytes = { bytes: Buffer.from([1]), contentType: 'image/jpeg' };
  const all = async (): Promise<string[]> => {
    const storage = world.app.get<MemoryStorage>(STORAGE);
    const out: string[] = [];
    for (const root of ['avatars', 'blurred']) for (const f of await storage.listFolders(root)) out.push(...(await storage.list(f)).map((x) => x.path));
    return out.sort();
  };

  /**
   * Bob (photo courante et sa vignette, une vieille photo, une vieille vignette, un envoi récent), Cléo (profil sans
   * photo, un vieil envoi) et ORPHANS comptes supprimés (une photo et une vignette chacun).
   */
  const scene = async (env: Record<string, string>) => {
    world = await startWorld(env);
    const storage = world.app.get<MemoryStorage>(STORAGE);
    const bob = world.client();
    await bob.api.me.onboard(onboardBody({ displayName: 'Bob' }));
    const ticket = await bob.api.me.avatarTicket('image/jpeg');
    await upload(ticket.uploadUrl);
    await bob.api.me.setAvatar(ticket.path);
    const cleo = world.client();
    await cleo.api.me.onboard(onboardBody({ displayName: 'Cléo' }));
    const old = [`avatars/${bob.id}/${randomUUID()}.jpg`, `blurred/${bob.id}/${randomUUID()}.jpg`, `avatars/${cleo.id}/${randomUUID()}.jpg`];
    for (const p of old) await storage.write(p, bytes);
    const orphans: string[] = [];
    for (let i = 0; i < ORPHANS; i += 1) {
      const id = randomUUID();
      orphans.push(`avatars/${id}/${randomUUID()}.jpg`, `blurred/${id}/${randomUUID()}.jpg`);
    }
    for (const p of orphans) await storage.write(p, bytes);
    world.clock.advanceHours(3);
    const recent = await bob.api.me.avatarTicket('image/jpeg');
    await upload(recent.uploadUrl);
    const kept = [ticket.path, blurPathOf(ticket.path), recent.path].sort();
    expect(world.app.get<MemoryDb>(MEMORY_DB).profiles.get(bob.id)?.avatarPath).toBe(ticket.path);
    return { kept, old, orphans, recent: recent.path, job: world.app.get(OrphanMediaJobs) };
  };

  /** Passages du minuteur jusqu'à la fin de la passe ; rend leur nombre. */
  const runPass = async (job: OrphanMediaJobs): Promise<number> => {
    const before = job.lastPass;
    for (let ticks = 1; ticks <= 10; ticks += 1) {
      await job.runDue(world.clock.now());
      if (job.lastPass !== before) return ticks;
    }
    throw new Error('passe jamais finie');
  };

  it('à blanc (défaut) : compte les orphelins et les fichiers, n’efface rien', async () => {
    const { kept, old, orphans, job } = await scene({});
    const before = await all();
    expect(await runPass(job)).toBe(2);
    expect(job.lastPass).toMatchObject({ mode: 'dry', orphanFolders: 2 * ORPHANS, files: old.length + orphans.length });
    expect(await all()).toEqual(before);
    expect(before).toEqual(expect.arrayContaining(kept));
  });

  it('on : efface orphelins et restes, garde la photo courante, sa vignette et l’envoi récent ; idempotent', async () => {
    const { kept, old, orphans, recent, job } = await scene({ MEDIA_SWEEP: 'on' });
    expect(await runPass(job)).toBe(2);
    expect(job.lastPass).toMatchObject({ mode: 'on', orphanFolders: 2 * ORPHANS, files: old.length + orphans.length });
    expect(await all()).toEqual(kept);

    // Juste après : au repos, rien ne bouge.
    expect(await job.runDue(world.clock.now())).toBe(0);
    // Une semaine plus tard : l'envoi jamais confirmé est devenu un reste, il part ; la photo courante reste.
    world.clock.advanceDays(8);
    await runPass(job);
    expect(job.lastPass).toMatchObject({ mode: 'on', orphanFolders: 0, files: 1 });
    const current = kept.filter((p) => p !== recent);
    expect(await all()).toEqual(current);
    // Passe suivante : plus rien à effacer.
    world.clock.advanceDays(8);
    await runPass(job);
    expect(job.lastPass).toMatchObject({ mode: 'on', orphanFolders: 0, files: 0 });
    expect(await all()).toEqual(current);
  });

  it('off : ne fait rien', async () => {
    const { job } = await scene({ MEDIA_SWEEP: 'off' });
    const before = await all();
    expect(await job.runDue(world.clock.now())).toBe(0);
    expect(job.lastPass).toBeNull();
    expect(await all()).toEqual(before);
  });
});
