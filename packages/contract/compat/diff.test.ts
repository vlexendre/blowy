import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { type JsonSchema, compareSchemas } from './diff';
import { type Snapshot, buildSnapshot, compareSnapshots, readClientCalls } from './snapshot';
// Le code du client de l'app, tel quel (Vite `?raw`).
import source from '../../api-client/src/index.ts?raw';

const json = (s: z.ZodType): JsonSchema => z.toJSONSchema(s, { io: 'input', unrepresentable: 'any' }) as JsonSchema;
const response = (before: z.ZodType, after: z.ZodType) => compareSchemas(json(before), json(after), 'response');
const request = (before: z.ZodType, after: z.ZodType) => compareSchemas(json(before), json(after), 'request');
const messages = (problems: { path: string; message: string; tolerable?: boolean }[]) => problems.map((p) => `${p.path} : ${p.message}${p.tolerable ? ' (toléré)' : ''}`);

const Kind = z.enum(['a', 'b']);
const KindPlus = z.enum(['a', 'b', 'c']);

describe('réponses (l’API écrit, l’ancienne app lit)', () => {
  const Old = z.object({ id: z.string(), count: z.number().int(), note: z.string().optional(), kind: Kind, tags: z.array(z.object({ kind: Kind })) });

  it('ajouter un champ, facultatif ou non, n’est pas cassant', () => {
    expect(response(Old, Old.extend({ extra: z.string() }))).toEqual([]);
    expect(response(Old, Old.extend({ extra: z.string().optional() }))).toEqual([]);
  });

  it('retirer un champ ou le rendre facultatif est cassant ; retirer un champ facultatif ne l’est pas', () => {
    expect(messages(response(Old, Old.omit({ count: true })))).toEqual(['count : champ de réponse retiré']);
    expect(messages(response(Old, Old.extend({ count: z.number().int().optional() })))).toEqual(['count : champ de réponse devenu facultatif']);
    expect(response(Old, Old.omit({ note: true }))).toEqual([]);
  });

  it('changer un type, ou rendre un champ nullable, est cassant', () => {
    expect(messages(response(Old, Old.extend({ count: z.string() })))).toEqual(['count : type changé : integer → string']);
    expect(response(Old, Old.extend({ id: z.string().nullable() })).length).toBeGreaterThan(0);
  });

  it('une valeur d’enum ajoutée : tolérable dans une liste, cassante dans un champ obligatoire', () => {
    expect(messages(response(Old, Old.extend({ kind: KindPlus })))).toEqual(['kind : valeur d\'enum ajoutée : "c"']);
    expect(messages(response(Old, Old.extend({ tags: z.array(z.object({ kind: KindPlus })) })))).toEqual(['tags.[].kind : valeur d\'enum ajoutée : "c" (toléré)']);
    expect(response(z.object({ k: Kind.optional() }), z.object({ k: KindPlus.optional() }))[0]?.tolerable).toBe(true);
    expect(response(z.object({ k: Kind.nullable() }), z.object({ k: KindPlus.nullable() }))[0]?.tolerable).toBe(true);
  });

  it('retirer une valeur d’enum d’une réponse n’est pas cassant', () => {
    expect(response(z.object({ k: KindPlus }), z.object({ k: Kind }))).toEqual([]);
  });

  it('une contrainte relâchée est cassante (l’app refuserait la valeur)', () => {
    expect(messages(response(z.object({ n: z.number().max(10) }), z.object({ n: z.number().max(20) })))).toEqual(['n : contrainte maximum changée : 10 → 20']);
  });

  it('tableau indexé par un enum : une clé ajoutée est tolérable', () => {
    const p = response(z.object({ r: z.record(Kind, z.number()) }), z.object({ r: z.record(KindPlus, z.number()) }));
    expect(p.every((x) => x.tolerable)).toBe(true);
  });
});

describe('requêtes (l’ancienne app écrit, l’API lit)', () => {
  const Old = z.object({ name: z.string().max(14), kind: KindPlus, note: z.string().optional() });

  it('un champ facultatif en plus n’est pas cassant ; un champ obligatoire en plus l’est', () => {
    expect(request(Old, Old.extend({ extra: z.string().optional() }))).toEqual([]);
    expect(messages(request(Old, Old.extend({ extra: z.string() })))).toEqual(['extra : champ de requête devenu obligatoire']);
  });

  it('une valeur d’enum retirée est cassante ; ajoutée, non', () => {
    expect(messages(request(Old, Old.extend({ kind: Kind })))).toEqual(['kind : valeur d\'enum retirée : "c"']);
    expect(request(Old.extend({ kind: Kind }), Old)).toEqual([]);
  });

  it('une contrainte resserrée est cassante', () => {
    expect(messages(request(Old, Old.extend({ name: z.string().max(10) })))).toEqual(['name : contrainte maxLength changée : 14 → 10']);
  });

  it('un champ facultatif devenu obligatoire est cassant', () => {
    expect(messages(request(Old, Old.extend({ note: z.string() })))).toEqual(['note : champ de requête devenu obligatoire']);
  });
});

describe('instantané', () => {
  it('lit les appels du client de l’app : méthode, route, schéma de réponse', () => {
    const { calls, locals } = readClientCalls(source);
    expect(calls).toContainEqual({ method: 'GET', table: 'routes', route: 'me', schema: 'MeZ' });
    expect(calls).toContainEqual({ method: 'GET', table: 'routes', route: 'links', schema: 'Links' });
    expect(locals.Links).toBe('LinkZ');
    expect(calls.length).toBeGreaterThan(100);
  });

  it('le contrat actuel est compatible avec lui-même ; une route ou un appel retiré est cassant', () => {
    const now = buildSnapshot(source);
    const policy = { minSupportedBuild: 0, tolerantSinceBuild: null };
    expect(compareSnapshots(now, now, policy).breaking).toEqual([]);
    const fewer: Snapshot = { ...now, routes: { ...now.routes }, endpoints: { ...now.endpoints } };
    delete fewer.routes['routes.me'];
    delete fewer.endpoints['GET routes.me'];
    expect(compareSnapshots(now, fewer, policy).breaking).toEqual([
      'route retirée : routes.me (/v1/me)',
      "appel retiré du client : GET routes.me (/v1/me) — l'ancienne app l'appelle toujours, l'API doit le servir",
    ]);
  });

  it('une valeur d’enum ajoutée dans une liste reste cassante tant que des builds sans tolérance sont servis', () => {
    const now = buildSnapshot(source);
    const ids = (s: Snapshot): string[] => {
      const items = (s.responses.WardrobeZ as { properties: { items: { items: { properties: { id: { enum: string[] } } } } } }).properties.items.items.properties.id;
      return items.enum;
    };
    const next = JSON.parse(JSON.stringify(now)) as Snapshot;
    ids(next).push('objet_de_demain');
    const old = compareSnapshots(now, next, { minSupportedBuild: 5, tolerantSinceBuild: 7 });
    expect(old.breaking.some((b) => b.includes('objet_de_demain') && b.includes('sans tolérance'))).toBe(true);
    const tolerant = compareSnapshots(now, next, { minSupportedBuild: 7, tolerantSinceBuild: 7 });
    expect(tolerant.breaking.filter((b) => b.includes('WardrobeZ') || b.includes('petWardrobe'))).toEqual([]);
    expect(tolerant.tolerable.some((t) => t.includes('objet_de_demain'))).toBe(true);
  });
});
