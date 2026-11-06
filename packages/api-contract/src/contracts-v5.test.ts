/** Tests de forme des contrats V5 (T0) : salles WS, GONE, projections §3.1, absence de champs interdits. */
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  API_ERROR_CODES,
  BandMemberViewSchema,
  CheckInRequestSchema,
  ConnectionRevealedEventSchema,
  DuoViewSchema,
  ERROR_CODES,
  ERROR_HTTP_STATUS,
  EquipAccessoriesRequestSchema,
  GuardianPageViewSchema,
  IntentionsV5Schema,
  OutingCompositionPreviewSchema,
  OutingPreferencesV5Schema,
  SubmitOutingVotesRequestSchema,
  SubmitOutingVotesResponseSchema,
  TeamViewSchema,
  NeighborhoodStatusViewSchema,
  OutingMemberViewSchema,
  OutingViewSchema,
  OutingVotesViewSchema,
  OwnPetViewV5Schema,
  PutOutingRequestSchema,
  SendMessageRequestSchema,
  WS_EVENT_PAYLOAD_SCHEMAS_V5,
  WS_EVENT_TYPES,
  WS_EVENT_TYPES_V5,
  WsJoinSchema,
  parseWsRoom,
} from './index.js';

const U = (n: number) => `0190a3c4-0000-7000-8000-${String(n).padStart(12, '0')}`;
const T = (h: number) => new Date(Date.UTC(2026, 10, 19, h)).toISOString();
const pet = { name: 'Gaston', species: 'GASTON', equipped: [], traits: ['vision.trait.curious'] } as const;
const timeline = { acceptDeadline: T(1), lockAt: T(2), photoRevealAt: T(3), checkinOpensAt: T(4), checkinClosesAt: T(5), votesCloseAt: T(6) };
const base = {
  id: U(1),
  weekKey: '2026-W47',
  neighborhood: { name: 'Paris 11e' },
  startsAt: T(4),
  endsAt: T(6),
  capacity: 6,
  activity: 'DRINK_COFFEE',
  timeline,
};

/** Clés de toutes les formes d'objet d'un schéma Zod 4 (récursif, via `_zod.def`). */
function keysOf(schema: z.ZodType, seen = new Set<unknown>()): Set<string> {
  const out = new Set<string>();
  const walk = (s: unknown): void => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    const def = (s as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
    if (!def) return;
    if (def.shape) for (const [k, v] of Object.entries(def.shape as Record<string, unknown>)) {
      out.add(k);
      walk(v);
    }
    for (const key of ['innerType', 'element', 'in', 'out', 'schema']) walk(def[key]);
    if (Array.isArray(def.options)) def.options.forEach(walk);
  };
  walk(schema);
  return out;
}

describe('core V5', () => {
  it('salles WS outing: et duo: acceptées, autres refusées', () => {
    expect(WsJoinSchema.safeParse({ room: `outing:${U(1)}` }).success).toBe(true);
    expect(WsJoinSchema.safeParse({ room: `duo:${U(2)}` }).success).toBe(true);
    expect(WsJoinSchema.safeParse({ room: `band:${U(2)}` }).success).toBe(false);
    expect(WsJoinSchema.safeParse({ room: `outing:${U(1)}x` }).success).toBe(false);
    expect(parseWsRoom(`duo:${U(3)}`)).toEqual({ kind: 'duo', id: U(3) });
  });
  it('GONE = 410, liste V4 conservée comme sous-ensemble', () => {
    expect(ERROR_HTTP_STATUS.GONE).toBe(410);
    expect(API_ERROR_CODES).toContain('GONE');
    expect(ERROR_CODES as readonly string[]).not.toContain('GONE');
    for (const c of ERROR_CODES) expect(API_ERROR_CODES).toContain(c);
  });
  it('chaque événement WS V5 a un schéma de payload', () => {
    for (const t of WS_EVENT_TYPES_V5) {
      expect(WS_EVENT_TYPES).toContain(t);
      expect(WS_EVENT_PAYLOAD_SCHEMAS_V5[t]).toBeDefined();
    }
  });
});

describe('OutingView (§3.1, §7.5)', () => {
  it('PROPOSED : pets, compte et aperçu anonyme, sans prénom, photo, lieu', () => {
    const preview = { size: 5, ageMin: 26, ageMax: 31, genders: { WOMAN: 2, MAN: 3 }, teams: 1 };
    const v = { ...base, status: 'PROPOSED', confirmedCount: 2, preview, mySeat: { status: 'INVITED', acceptDeadline: T(1) }, members: [{ userId: U(2), pet, threeWords: ['DROLE'] }] };
    expect(OutingViewSchema.parse(v)).toEqual(v);
    expect(OutingCompositionPreviewSchema.safeParse({ ...preview, firstNames: ['Léa'] }).success).toBe(false);
  });
  it('après photoRevealAt : prénom, tranche d’âge, fiabilité, photo, arrivée, lieu', () => {
    const member = { userId: U(2), pet, threeWords: [], firstName: 'Léa', ageRange: '25_29', reliability: { attended: 3, total: 4 }, photo: { mediaId: U(9), url: 'https://media.blowy.test/t/abc' }, arrived: true };
    const v = { ...base, status: 'CHECKIN_OPEN', confirmedCount: 5, mySeat: { status: 'CHECKED_IN', funding: 'FREE_FIRST' }, venue: { name: 'Le Comptoir', address: '1 rue X', offerLabel: 'Une boisson', lat: 48.86, lng: 2.38 }, members: [member, { userId: U(3), pet, threeWords: [], firstName: 'Max', reliability: 'NEWCOMER', notComing: true }], conversationId: U(7) };
    expect(OutingViewSchema.safeParse(v).success).toBe(true);
  });
  it('aucun champ hors contrat : financement d’autrui, absence, intentions, genre refusés', () => {
    for (const leak of [{ funding: 'PAID' }, { noShow: true }, { seeksRomance: true }, { gender: 'WOMAN' }, { arrived: false }, { cancelReason: 'SAFETY' }]) {
      expect(OutingMemberViewSchema.safeParse({ userId: U(2), pet, threeWords: [], ...leak }).success, JSON.stringify(leak)).toBe(false);
    }
    expect(OutingViewSchema.safeParse({ ...base, status: 'DONE', mySeat: { status: 'ATTENDED' }, members: [], votesCount: 3 }).success).toBe(false);
  });
  it('les vues V5 ne déclarent jamais de clé interdite (§3, D-014)', () => {
    const forbidden = ['seeksFriends', 'seeksRomance', 'lookingFor', 'storySeriousness', 'kidsSomeday', 'meetingMode', 'meetGenders', 'romanceGenders', 'gender', 'orientation', 'votedCount', 'plusAvailable', 'distance', 'distanceKm', 'noShows', 'cancelReason', 'blocked', 'reported', 'votesReceived', 'theirChoice'];
    for (const s of [OutingViewSchema, OutingVotesViewSchema, DuoViewSchema, BandMemberViewSchema, GuardianPageViewSchema, ConnectionRevealedEventSchema, NeighborhoodStatusViewSchema]) {
      const keys = keysOf(s);
      expect(keys.size).toBeGreaterThan(3);
      for (const k of forbidden) expect(keys.has(k), k).toBe(false);
    }
    // la page du proche ne connaît ni participants, ni chat, ni fiabilité
    const guardian = keysOf(GuardianPageViewSchema);
    for (const k of ['members', 'participants', 'conversationId', 'reliability', 'photo']) expect(guardian.has(k), k).toBe(false);
  });
});

describe('commandes V5', () => {
  it('demande hebdo (V5.1) : créneaux facultatifs (disponibilités), distincts, team facultative', () => {
    expect(PutOutingRequestSchema.safeParse({}).success).toBe(true);
    expect(PutOutingRequestSchema.safeParse({ slotStartsAt: [T(1)], teamId: U(4) }).success).toBe(true);
    expect(PutOutingRequestSchema.safeParse({ slotStartsAt: [] }).success).toBe(false);
    expect(PutOutingRequestSchema.safeParse({ slotStartsAt: [T(1), T(1)] }).success).toBe(false);
  });
  it('check-in GEO ou code à 4 chiffres', () => {
    expect(CheckInRequestSchema.safeParse({ method: 'GEO', lat: 48.8, lng: 2.3, accuracyM: 20 }).success).toBe(true);
    expect(CheckInRequestSchema.safeParse({ method: 'VENUE_CODE', code: '0421' }).success).toBe(true);
    expect(CheckInRequestSchema.safeParse({ method: 'VENUE_CODE', code: '42' }).success).toBe(false);
    expect(CheckInRequestSchema.safeParse({ method: 'STAFF' }).success).toBe(false);
  });
  it('vote groupé (V5.1) : une soumission {personne → choix}, réponse sans rien sur les autres', () => {
    expect(SubmitOutingVotesRequestSchema.safeParse({ choices: { [U(2)]: 'PLUS', [U(3)]: 'NO' } }).success).toBe(true);
    expect(SubmitOutingVotesRequestSchema.safeParse({ choices: { [U(2)]: 'MAYBE' } }).success).toBe(false);
    expect(SubmitOutingVotesResponseSchema.safeParse({ myChoices: { [U(2)]: 'PLUS' } }).success).toBe(true);
    expect(SubmitOutingVotesResponseSchema.safeParse({ myChoices: {}, votedCount: 3 }).success).toBe(false);
    expect(OutingVotesViewSchema.safeParse({ closesAt: T(6), closed: false, targets: [{ userId: U(2), firstName: 'Léa', pet, myChoice: 'NO' }], plusAvailable: true }).success).toBe(false);
  });
  it('intentions V5.1 : histoire ⇒ genres ; sous-choix réservés à « une histoire »', () => {
    const p = { lookingFor: 'FRIENDS', storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: [] };
    expect(IntentionsV5Schema.safeParse(p).success).toBe(true);
    expect(IntentionsV5Schema.safeParse({ ...p, lookingFor: 'STORY' }).success).toBe(false);
    expect(IntentionsV5Schema.safeParse({ ...p, lookingFor: 'BOTH', romanceGenders: ['MAN'], storySeriousness: 'SERIOUS', kidsSomeday: 'DONT_KNOW' }).success).toBe(true);
    expect(IntentionsV5Schema.safeParse({ ...p, storySeriousness: 'SERIOUS' }).success).toBe(false);
  });
  it('préférences de sortie V5.1 : quartiers acceptables, trajet 20/30/45, semaines off', () => {
    const o = { groupAge: { min: 26, max: 34 }, availableSlotTemplateIds: [U(1)], weeksOff: ['2026-W48'], activities: ['BRUNCH'], neighborhoodIds: [U(2), U(3)], maxTravelMinutes: 30 };
    expect(OutingPreferencesV5Schema.safeParse(o).success).toBe(true);
    expect(OutingPreferencesV5Schema.safeParse({ ...o, maxTravelMinutes: 25 }).success).toBe(false);
    expect(OutingPreferencesV5Schema.safeParse({ ...o, neighborhoodIds: [] }).success).toBe(false);
    expect(OutingPreferencesV5Schema.safeParse({ ...o, groupAge: { min: 40, max: 30 } }).success).toBe(false);
  });
  it('team : 1 à 3 membres', () => {
    const m = (i: number) => ({ userId: U(i), firstName: `P${i}`, pet, verified: true, me: i === 1 });
    const t = { id: U(9), status: 'ACTIVE', members: [m(1), m(2), m(3)], seedingEligible: true, createdAt: T(1) };
    expect(TeamViewSchema.safeParse(t).success).toBe(true);
    expect(TeamViewSchema.safeParse({ ...t, members: [m(1), m(2), m(3), m(4)] }).success).toBe(false);
  });
  it('accessoires portés ≤ 3, pose V5 sans maladie', () => {
    expect(EquipAccessoriesRequestSchema.safeParse({ equipped: ['a', 'b', 'c', 'd'] }).success).toBe(false);
    expect(EquipAccessoriesRequestSchema.safeParse({ equipped: ['a', 'a'] }).success).toBe(false);
    const own = { id: U(1), name: 'Gaston', species: 'GASTON', stage: 'BABY', pose: 'JOYFUL', equipped: [], unlockedAccessories: [], memoryCount: 1, nextStageAt: { stage: 'YOUNG', progressPermille: 0 }, engineVersion: 'engine-2026.12.0', version: 1 };
    expect(OwnPetViewV5Schema.safeParse(own).success).toBe(true);
    expect(OwnPetViewV5Schema.safeParse({ ...own, pose: 'SICK' }).success).toBe(false);
  });
  it('révélation : FRIEND porte un lien, PLUS un duo', () => {
    const other = { userId: U(2), firstName: 'Léa', pet };
    expect(ConnectionRevealedEventSchema.safeParse({ kind: 'FRIEND', other, linkId: U(3), source: 'OUTING' }).success).toBe(true);
    expect(ConnectionRevealedEventSchema.safeParse({ kind: 'PLUS', other, linkId: U(3), source: 'OUTING' }).success).toBe(false);
  });
  it('message « 3 mots » : promptId optionnel', () => {
    expect(SendMessageRequestSchema.safeParse({ clientMessageId: 'abcdefgh', body: 'jazz, vélo, ramen', promptId: 'icebreaker.prompt.weekend' }).success).toBe(true);
    expect(SendMessageRequestSchema.safeParse({ clientMessageId: 'abcdefgh', body: 'salut' }).success).toBe(true);
  });
  it('vue duo : progression d’échange de moi seul (0..1)', () => {
    const d = { id: U(1), status: 'EXCHANGE', origin: 'LANE', other: { firstName: 'Léa', pet, reliability: 'NEWCOMER' }, exchange: { endsAt: T(5), mineCount: 1, unlockProgress: 0.5 }, conversationId: U(2) };
    expect(DuoViewSchema.safeParse(d).success).toBe(true);
    expect(DuoViewSchema.safeParse({ ...d, exchange: { ...d.exchange, theirCount: 2 } }).success).toBe(false);
  });
});
