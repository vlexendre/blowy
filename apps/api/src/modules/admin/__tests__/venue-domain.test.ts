/** Domaine V5 T6 (pur) : rôle ops, step-up, lecture de position, planning du lieu, effectif « prénoms seulement ». */
import { describe, expect, it } from 'vitest';
import { VenueTableSchema } from '@blowy/api-contract';
import { can, ROLE_PERMISSIONS, STEP_UP_PERMISSIONS } from '../domain/permissions.js';
import { compositionAggregates } from '../application/use-cases/ops.use-cases.js';
import { correctAbsence } from '../../outings/application/admin-port.service.js';
import { EMPTY_VENUE_PARTNER, firstNameOnly, frRange, nextCapacity, projectVenueTable, reduceVenuePartner, targetCapacity, weeklySchedule, type StoredVenueEvent } from '../domain/venue-partner.js';

const at = (iso: string) => new Date(iso);
const ev = (seq: number, event: StoredVenueEvent['event']): StoredVenueEvent => ({ seq, at: at('2026-11-02T10:00:00Z'), event });

describe('permissions V5', () => {
  it('ops gère quartiers, lieux, sorties et présences, jamais utilisateurs, votes, sécurité ni argent', () => {
    for (const p of ['neighborhoods.write', 'venues.write', 'outings.cancel', 'outings.seat_remove', 'knows_someone.decide', 'attendance.correct', 'reliability.pause_lift'] as const) expect(can(['ops'], p)).toBe(true);
    for (const p of ['users.read', 'safety.read', 'safety.position', 'economy.read', 'venue_compensations.reverse', 'moderation.context', 'tuning.write'] as const) expect(can(['ops'], p)).toBe(false);
  });
  it('position « besoin d’aide » réservée à trust_lead (pas même admin)', () => {
    const holders = Object.entries(ROLE_PERMISSIONS).filter(([, ps]) => ps.includes('safety.position')).map(([r]) => r);
    expect(holders).toEqual(['trust_lead']);
  });
  it('actions sensibles V5 sous step-up ; support lit et décide « je connais quelqu’un » sans corriger', () => {
    for (const p of ['outings.cancel', 'outings.seat_remove', 'attendance.correct', 'reliability.pause_lift', 'venues.secret_rotate', 'venues.partner_access', 'venue_compensations.reverse'] as const) expect(STEP_UP_PERMISSIONS.has(p)).toBe(true);
    expect(can(['support'], 'knows_someone.decide')).toBe(true);
    expect(can(['support'], 'attendance.correct')).toBe(false);
    expect(can(['support'], 'outings.cancel')).toBe(false);
    expect(can(['finance'], 'venue_compensations.reverse')).toBe(true);
  });
});

describe('lieu partenaire (domaine)', () => {
  it('rejoue accès, contrat, jours et fermetures', () => {
    const s = reduceVenuePartner([
      ev(1, { type: 'ACCESS_GRANTED', userId: 'u1' }),
      ev(2, { type: 'ACCESS_GRANTED', userId: 'u2' }),
      ev(3, { type: 'ACCESS_REVOKED', userId: 'u1' }),
      ev(4, { type: 'CONTRACT_SIGNED', version: 'v1', signerName: 'Nadia', userId: 'u2' }),
      ev(5, { type: 'DAY_SET', isoWeekday: 5, open: false, tables: null, note: 'coup de feu, fermé' }),
      ev(6, { type: 'DAY_SET', isoWeekday: 4, open: true, tables: 2, note: null }),
      ev(7, { type: 'CLOSURE_ADDED', date: '2026-12-24', note: 'réveillon' }),
    ]);
    expect([...s.partners]).toEqual(['u2']);
    expect(s.contract?.signerName).toBe('Nadia');
    expect(targetCapacity(s, 5, '2026-11-13', 2)).toBe(0);
    expect(targetCapacity(s, 4, '2026-11-12', 2)).toBe(2);
    expect(targetCapacity(s, 4, '2026-12-24', 2)).toBe(0);
    expect(targetCapacity(s, 2, '2026-11-10', 1)).toBe(1);
  });

  it('planning mardi → dimanche (lundi seulement s’il a un créneau), heures en français', () => {
    expect(frRange(19 * 60 + 30, 120)).toBe('19 h 30 – 21 h 30');
    expect(frRange(15 * 60, 120)).toBe('15 h – 17 h');
    const tpl = [
      { isoWeekday: 2, localMinute: 1170, activity: 'DRINK_COFFEE', active: true },
      { isoWeekday: 4, localMinute: 1170, activity: 'GAMES', active: true },
      { isoWeekday: 6, localMinute: 900, activity: 'CLIMBING', active: true },
      { isoWeekday: 7, localMinute: 660, activity: 'BRUNCH', active: true },
    ];
    const s = reduceVenuePartner([ev(1, { type: 'DAY_SET', isoWeekday: 4, open: true, tables: 2, note: null }), ev(2, { type: 'DAY_SET', isoWeekday: 5, open: false, tables: null, note: 'coup de feu, fermé' })]);
    const days = weeklySchedule(tpl, ['GAMES', 'DRINK_COFFEE', 'CLIMBING', 'BRUNCH'], s, 2, 120);
    expect(days.map((d) => d.label)).toEqual(['Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']);
    expect(days.map((d) => [d.times, d.open, d.tables, d.note])).toEqual([
      ['19 h 30 – 21 h 30', true, 2, null],
      [null, false, 2, null],
      ['19 h 30 – 21 h 30', true, 2, null],
      [null, false, 2, 'coup de feu, fermé'],
      ['15 h – 17 h', true, 2, null],
      ['11 h – 13 h', true, 2, null],
    ]);
  });

  it('préavis 72 h : une baisse ne touche pas un créneau proche, jamais sous les tables réservées', () => {
    const now = at('2026-11-10T10:00:00Z');
    expect(nextCapacity({ startsAt: at('2026-11-12T18:30:00Z'), capacity: 2, reserved: 0 }, 0, now)).toBe(2);
    expect(nextCapacity({ startsAt: at('2026-11-12T18:30:00Z'), capacity: 2, reserved: 1 }, 0, now, { exceptional: true })).toBe(1);
    expect(nextCapacity({ startsAt: at('2026-11-19T18:30:00Z'), capacity: 2, reserved: 0 }, 0, now)).toBe(0);
    expect(nextCapacity({ startsAt: at('2026-11-11T18:30:00Z'), capacity: 1, reserved: 0 }, 2, now)).toBe(2);
  });

  it('effectif : prénoms seulement, à partir de la confirmation ; schéma strict', () => {
    const o = { outingId: '0190c3a2-0000-7000-8000-000000000001', status: 'CONFIRMED', startsAt: at('2026-11-12T18:30:00Z'), endsAt: at('2026-11-12T20:30:00Z'), lockAt: at('2026-11-11T17:00:00Z'), activity: 'GAMES', seats: [{ status: 'CONFIRMED', firstName: 'Léa' }, { status: 'DECLINED', firstName: 'Zoé' }, { status: 'CHECKED_IN', firstName: 'Tom', teamKey: 't1' }, { status: 'CONFIRMED', firstName: 'Alex Martin', teamKey: 't1' }] };
    const before = projectVenueTable(o, at('2026-11-11T16:59:00Z'), () => '4827');
    expect(before.firstNames).toEqual([]);
    expect(before.code).toBeNull();
    const after = projectVenueTable(o, at('2026-11-11T17:00:00Z'), () => '4827');
    expect(after).toMatchObject({ confirmedCount: 3, firstNames: ['Alex', 'Tom', 'Léa'], code: '4827' });
    expect(() => VenueTableSchema.parse(after)).not.toThrow();
    expect(() => VenueTableSchema.parse({ ...after, userId: 'x' })).toThrow();
    expect(projectVenueTable({ ...o, status: 'CANCELLED' }, at('2026-11-11T18:00:00Z'), () => '1').confirmedCount).toBe(0);
    expect(firstNameOnly('  Jean-Éric D. ')).toBe('Jean-Éric');
    expect(EMPTY_VENUE_PARTNER.partners.size).toBe(0);
  });

  it('rapport de composition : agrégats numériques seulement', () => {
    expect(compositionAggregates({ placed: 10, friendsOnly: { u1: true }, storyCoverage: 0.55, seeded: true, note: 'x' })).toEqual({ placed: 10, storyCoverage: 0.55, seeded: 1 });
  });

  it('contestation acceptée : absence retirée, pause levée', () => {
    const now = at('2026-11-05T10:00:00Z');
    const s = correctAbsence({ attended: 0, noShows: 2, lateCancels: 0, episodeAbsences: 0, lastAbsenceAt: now, pausedUntil: at('2026-11-10T00:00:00Z'), pauseEpisode: 1 }, 'NO_SHOW', now);
    expect(s).toMatchObject({ attended: 1, noShows: 1, pausedUntil: null });
  });
});
