import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { zoneOfPoint } from '@blowy/domain';
import { parseSeedArgs } from '../src/demo/seed/args';
import {
  FOREIGN_ACCOUNT_LIMIT,
  SEED_WORLD_ID,
  SeedRefused,
  configRefusals,
  isSeedEmail,
  isSeedId,
} from '../src/demo/seed/guards';
import { SEED_CITIES, buildPlan } from '../src/demo/seed/plan';
import { Seeder } from '../src/demo/seed/seeder';
import { Audience } from '../src/modules/safety/application/audience';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, onboardBody, startWorld } from './helpers';

/** Configuration d'un environnement de test acceptée (point de départ de chaque garde-fou). */
const SAFE = { BLOWY_ENV: 'test', BLOWY_ADAPTERS: 'supabase', SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co', API_URL: 'http://localhost:3000' };
const LYON = { latitude: 45.7676, longitude: 4.8344 };
/** Clé au format JWT dont la charge désigne un projet (`ref`). */
const jwtFor = (ref: string): string => `xx.${Buffer.from(JSON.stringify({ ref, role: 'service_role' })).toString('base64url')}.yy`;

describe('semis de test : garde-fous de configuration', () => {
  it('une configuration de test passe', () => {
    expect(configRefusals(SAFE, 'supabase')).toEqual([]);
    expect(configRefusals({ ...SAFE, BLOWY_ENV: 'staging' }, 'supabase')).toEqual([]);
    expect(configRefusals({ ...SAFE, BLOWY_ENV: 'local' }, 'supabase')).toEqual([]);
    expect(configRefusals({}, 'memory')).toEqual([]);
  });

  it('1. BLOWY_ENV : production, inconnu, ou absent avec Supabase → refus', () => {
    expect(configRefusals({ ...SAFE, BLOWY_ENV: 'production' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, BLOWY_ENV: 'PRODUCTION' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, BLOWY_ENV: 'preprod' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, BLOWY_ENV: undefined }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ BLOWY_ENV: 'production' }, 'memory')[0]).toMatch(/jamais en production/);
  });

  it('2. projet Supabase de production (adresse, hôte de base, clé) → refus', () => {
    expect(configRefusals({ ...SAFE, SUPABASE_URL: 'https://sqxebllmatfflopqddaw.supabase.co' }, 'supabase')[0]).toMatch(/SUPABASE_URL désigne le projet Supabase de production/);
    expect(configRefusals({ ...SAFE, DATABASE_URL: 'postgres://postgres@db.sqxebllmatfflopqddaw.supabase.co:5432/postgres' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, PGHOST: 'aws-0-eu-west-3.pooler.supabase.com', PGUSER: 'postgres.sqxebllmatfflopqddaw' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, SUPABASE_SERVICE_ROLE_KEY: jwtFor('sqxebllmatfflopqddaw') }, 'supabase')[0]).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(configRefusals({ ...SAFE, SUPABASE_SERVICE_ROLE_KEY: jwtFor('abcdefghijklmnopqrst') }, 'supabase')).toEqual([]);
  });

  it('3. une adresse vers minimoa.app (ou un sous-domaine) → refus', () => {
    expect(configRefusals({ ...SAFE, API_URL: 'https://api.minimoa.app' }, 'supabase')[0]).toMatch(/API_URL pointe vers minimoa\.app/);
    expect(configRefusals({ ...SAFE, WEB_URL: 'https://minimoa.app/' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, EXPO_PUBLIC_API_URL: 'api.minimoa.app' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, CORS_ORIGINS: 'http://localhost:8081,https://admin.minimoa.app' }, 'supabase')).toHaveLength(1);
    expect(configRefusals({ ...SAFE, API_URL: 'https://notminimoa.app' }, 'supabase')).toEqual([]);
  });

  it('aucune option ne contourne les garde-fous', () => {
    expect(() => parseSeedArgs(['--force'])).toThrow(/option inconnue/);
    expect(() => parseSeedArgs(['--yes'])).toThrow(/option inconnue/);
    expect(parseSeedArgs(['--cities', 'paris,lyon', '--per-city=5', '--seed', '3', '--dry-run'])).toMatchObject({ cities: ['paris', 'lyon'], perCity: 5, seed: 3, dryRun: true });
  });

  it('le plan est déterministe, sur les villes du site, avec des adresses et identifiants du semis', () => {
    expect(SEED_CITIES).toEqual(expect.arrayContaining(['paris', 'lyon', 'marseille', 'bordeaux', 'bruxelles', 'amsterdam', 'lisbonne', 'madrid', 'barcelone']));
    const a = buildPlan({ cities: ['paris', 'lisbonne'], perCity: 6, seed: 9 }, '2026-11-11', 50);
    expect(buildPlan({ cities: ['paris', 'lisbonne'], perCity: 6, seed: 9 }, '2026-11-11', 50)).toEqual(a);
    expect(buildPlan({ cities: ['paris', 'lisbonne'], perCity: 6, seed: 10 }, '2026-11-11', 50)).not.toEqual(a);
    expect(a.people).toHaveLength(6 * 3 + 6);
    for (const p of a.people) {
      expect(isSeedEmail(p.email) && isSeedId(p.id)).toBe(true);
      expect(Number(p.birthdate.slice(0, 4))).toBeLessThanOrEqual(2026 - 19);
      expect(p.visionAnswers).toHaveLength(12);
      expect(p.habits.length).toBeLessThanOrEqual(2);
    }
    for (const z of a.zones) for (const s of z.signups) expect(isSeedEmail(s.email) && isSeedId(s.id)).toBe(true);
    expect(() => buildPlan({ cities: ['genève'], perCity: 1, seed: 1 }, '2026-11-11', 50)).toThrow(/ville inconnue/);
  });
});

/** Instantané des tables qu'un semis touche (pour vérifier que la purge rend la base telle qu'avant). */
const snapshot = (db: MemoryDb): string =>
  JSON.stringify({
    authEmails: [...db.authEmails].sort(),
    // `reviewWorld: null` (rendu à tout le monde) vaut l'absence de monde.
    profiles: [...db.profiles.values()].map(({ reviewWorld, ...p }) => ({ ...p, world: reviewWorld ?? null })).sort((a, b) => a.id.localeCompare(b.id)),
    pets: [...db.pets.values()].sort((a, b) => a.id.localeCompare(b.id)),
    petItems: db.petItems.length,
    petEvents: db.petEvents.length,
    links: [...db.links.values()].sort((a, b) => a.id.localeCompare(b.id)),
    messages: db.messages.length,
    encounters: [...db.encounters.values()].sort((a, b) => a.id.localeCompare(b.id)),
    places: [...db.profilePlaces.keys()].sort(),
    visionSignals: db.visionSignals.length,
    habits: [...db.habits.keys()].sort(),
    dailyChallenges: db.dailyChallenges.length,
    ritualStates: [...db.ritualStates.keys()].sort(),
    groups: [...db.groups.keys()].sort(),
    groupMembers: [...db.groupMembers.keys()].sort(),
    groupMessages: db.groupMessages.length,
    quartiers: [...db.quartiers.values()].sort((a, b) => a.zone.localeCompare(b.zone)),
    quartierSignups: [...db.quartierSignups.values()].sort((a, b) => a.id.localeCompare(b.id)),
    quartierFounders: db.quartierFounders,
    acquisitions: [...db.acquisitions.keys()].sort(),
    growthEvents: db.growthEvents.length,
    subscriptions: db.subscriptions.size,
    reports: db.reports.length,
  });

describe('semis de test en mémoire', () => {
  let w: TestWorld;
  let db: MemoryDb;
  let seeder: Seeder;
  const source = { BLOWY_ENV: 'local', BLOWY_ADAPTERS: 'memory' };
  const real = { id: '', email: 'camille@example.com' };
  const tester = { id: '', email: 'testeur@example.com' };
  let before = '';
  let seedIds: string[] = [];

  beforeAll(async () => {
    // Démo locale : le module du semis est chargé (BLOWY_SEED_CITIES absent : rien n'est semé au démarrage).
    w = await startWorld({ BLOWY_DEMO: '1' });
    db = w.app.get<MemoryDb>(MEMORY_DB);
    seeder = w.app.get(Seeder, { strict: false });
    for (const who of [real, tester]) {
      const c = w.client(undefined, who.email);
      who.id = c.id;
      await c.api.me.onboard(onboardBody({ displayName: 'Camille', location: LYON }));
      await c.api.encounters.list();
      await c.api.vision.map();
    }
    // Une vraie inscription de quartier, hors semis.
    await w.anonymous.quartiers.join({ zone: 'lyon-1', email: 'voisine@example.com', consent: true, locale: 'fr' });
    before = snapshot(db);
  }, 60_000);
  afterAll(() => w.close());

  it('pose les comptes prévus, inscrits par les vrais cas d’usage, tous marqués', async () => {
    const report = await seeder.run({ options: { cities: ['lyon', 'bruxelles'], perCity: 10, seed: 42 }, source });
    expect(report.done.accounts).toBe(20);
    expect(report.planned.accounts).toBe(20);
    const seeded = [...db.profiles.values()].filter((p) => p.reviewWorld === SEED_WORLD_ID);
    seedIds = seeded.map((p) => p.id);
    expect(seeded).toHaveLength(20);
    const plan = buildPlan({ cities: ['lyon', 'bruxelles'], perCity: 10, seed: 42 }, '2026-11-11', 50);
    for (const p of seeded) {
      expect(isSeedId(p.id)).toBe(true);
      expect(isSeedEmail(db.authEmails.get(p.id))).toBe(true);
      expect([...db.pets.values()].some((pet) => pet.ownerId === p.id)).toBe(true);
      expect(db.visionSignals.filter((s) => s.userId === p.id && s.source === 'test').length).toBeGreaterThan(0);
      const place = db.profilePlaces.get(p.id);
      const planned = plan.people.find((x) => x.id === p.id);
      expect(place && zoneOfPoint(place.home)?.id).toBe(planned?.zone);
      expect(Date.parse(p.createdAt)).toBeLessThanOrEqual(w.clock.now().getTime());
    }
    // Activité sur trois semaines, horloge rendue à l'identique.
    expect(w.clock.now().toISOString()).toBe('2026-11-11T10:00:00.000Z');
    // Liens prévus, plus ceux nés d'un coucou rendu (deux signes croisés font un lien).
    const links = [...db.links.values()].filter((l) => seedIds.includes(l.userA));
    expect(links.length).toBeGreaterThanOrEqual(report.done.links ?? 0);
    expect(links.every((l) => seedIds.includes(l.userB))).toBe(true);
    expect(links.some((l) => l.createdAt < '2026-11-05')).toBe(true);
    expect(report.done.messages).toBeGreaterThan(20);
    expect(report.done.careActions).toBeGreaterThan(20);
    expect(report.done.wavesPending).toBeGreaterThan(0);
    expect(report.done.groups).toBeGreaterThan(0);
    expect(report.done.plus).toBeGreaterThan(0);
    expect([...db.encounters.values()].some((e) => e.status === 'waved' && seedIds.includes(e.toUser))).toBe(true);
    // Aucun e-mail, aucune statistique d'arrivée pour les comptes du semis.
    expect(w.outbox.some((m) => /\.invalid$/.test(m.to))).toBe(false);
    expect(seedIds.some((id) => db.acquisitions.has(id))).toBe(false);
    // Quartiers : inscriptions du semis, confirmées ; un quartier ouvert ; le classement public a des données.
    const signups = [...db.quartierSignups.values()].filter((s) => isSeedId(s.id));
    expect(signups.length).toBe(report.done.signups);
    expect(signups.every((s) => isSeedEmail(s.email) && s.confirmedAt !== null)).toBe(true);
    expect([...db.quartiers.values()].filter((z) => z.openedAt).length).toBeGreaterThanOrEqual(1);
    const board = await w.anonymous.quartiers.board();
    expect(board.total).toBeGreaterThan(50);
    expect(board.items.some((i) => !i.open && i.missing > 0 && i.missing <= 6)).toBe(true);
  }, 60_000);

  it('un deuxième semis sur la même base est refusé', async () => {
    await expect(seeder.run({ options: { cities: ['lyon'], perCity: 2, seed: 1 }, source })).rejects.toBeInstanceOf(SeedRefused);
  });

  it('Audience garde les comptes du semis loin d’un vrai compte (rencontres, carte, coucou)', async () => {
    const audience = w.app.get(Audience);
    expect(await audience.visible(real.id, seedIds, 'suggest')).toEqual([]);
    expect(await audience.visible(real.id, seedIds, 'map')).toEqual([]);
    expect(await audience.reachable(seedIds[0] as string, real.id)).toBeNull();
    const c = w.client(real.id, real.email);
    const enc = await c.api.encounters.list();
    expect([...enc.suggestions.map((s) => s.user.id), ...enc.incoming.map((i) => i.from.id)].some(isSeedId)).toBe(false);
    expect((await c.api.vision.map()).pins.some((p) => isSeedId(p.user.id))).toBe(false);
  });

  it('un compte de test rattaché (--adopt) voit le monde du semis ; le vrai compte toujours pas', async () => {
    expect(await seeder.adopt([tester.email, 'inconnu@example.com'], source)).toEqual({ adopted: [tester.email], missing: ['inconnu@example.com'] });
    const audience = w.app.get(Audience);
    expect((await audience.visible(tester.id, seedIds, 'suggest')).length).toBe(seedIds.length);
    expect(await audience.visible(real.id, [tester.id], 'suggest')).toEqual([]);
  });

  it('la purge supprime tout le semis, et seulement lui', async () => {
    const report = await seeder.purge(source);
    expect(report).toMatchObject({ accounts: 20, detached: 1 });
    expect(report.groups).toBeGreaterThan(0);
    expect(report.signups).toBeGreaterThan(0);
    expect([...db.authEmails.values()].some((e) => isSeedEmail(e))).toBe(false);
    expect([...db.profiles.keys()].some(isSeedId)).toBe(false);
    expect(snapshot(db)).toBe(before);
    expect(db.profiles.get(real.id)).toBeDefined();
    expect(db.profiles.get(tester.id)?.reviewWorld ?? null).toBeNull();
    // Rejouable : une purge de plus ne trouve plus rien.
    expect(await seeder.purge(source)).toEqual({ accounts: 0, groups: 0, signups: 0, zones: 0, detached: 0 });
  });

  it('les garde-fous valent aussi à l’exécution (semis, purge, rattachement)', async () => {
    await expect(seeder.run({ options: { cities: ['lyon'], perCity: 1, seed: 1 }, source: { ...source, BLOWY_ENV: 'production' } })).rejects.toBeInstanceOf(SeedRefused);
    await expect(seeder.purge({ ...source, SUPABASE_URL: 'https://sqxebllmatfflopqddaw.supabase.co' })).rejects.toBeInstanceOf(SeedRefused);
    await expect(seeder.adopt([tester.email], { ...source, API_URL: 'https://api.minimoa.app' })).rejects.toBeInstanceOf(SeedRefused);
  });
});

describe('semis de test : garde-fou 4 (la base ressemble à une base réelle)', () => {
  let w: TestWorld;
  beforeAll(async () => {
    w = await startWorld({ BLOWY_DEMO: '1' });
  });
  afterAll(() => w.close());

  it(`plus de ${FOREIGN_ACCOUNT_LIMIT} comptes hors semis → refus, rien n'est écrit`, async () => {
    const db = w.app.get<MemoryDb>(MEMORY_DB);
    const seeder = w.app.get(Seeder, { strict: false });
    const source = { BLOWY_ENV: 'test' };
    for (let i = 0; i < FOREIGN_ACCOUNT_LIMIT + 1; i++) db.authEmails.set(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, `personne${i}@example.com`);
    const refused = await seeder.run({ options: { cities: ['nice'], perCity: 2, seed: 1 }, source }).catch((e: unknown) => e);
    expect(refused).toBeInstanceOf(SeedRefused);
    expect((refused as SeedRefused).reasons[0]).toMatch(/ressemble à une base réelle/);
    await expect(seeder.purge(source)).rejects.toBeInstanceOf(SeedRefused);
    await expect(seeder.run({ options: { cities: ['nice'], perCity: 2, seed: 1 }, dryRun: true, source })).rejects.toBeInstanceOf(SeedRefused);
    expect([...db.authEmails.values()].some((e) => isSeedEmail(e))).toBe(false);
  });
});
