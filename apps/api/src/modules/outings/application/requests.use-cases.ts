/**
 * Semaine et demande hebdo (spec-v5 §2.4, §7.2, V5.1 D.13) : la demande part des disponibilités
 * cochées dans les quartiers acceptables (semaines off exclues) ; une team est composée comme une
 * unité ; quota 1 place / semaine NON achetable (index unique partiel, 409 WEEKLY_QUOTA_USED).
 */
import { DAY_MS } from '@blowy/domain';
import type { OutingRequestView, OutingWeekView, PutOutingRequest } from '@blowy/api-contract';
import { slotLabelKey } from '@blowy/content';
import { mondayOfWeek, outingInstants, requestWindow, weekKeyOf } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { isPaused } from '../domain/reliability.js';
import { weekPhase } from '../domain/week.js';
import type { OutingsRepository, RequestRow, RequesterFacts, WeekSlot } from './ports/outings.repository.js';

const toView = (r: RequestRow): OutingRequestView => ({
  weekKey: r.weekKey,
  status: r.status,
  slotStartsAt: r.slotStartsAt.slice(0, 3).map((d) => d.toISOString()),
  ...(r.teamId ? { teamId: r.teamId } : {}),
  createdAt: r.createdAt.toISOString(),
});

export const previousWeekKey = (weekKey: string, tz: string) => weekKeyOf(mondayOfWeek(weekKey) * DAY_MS - 3 * DAY_MS, tz);

/** V5.2 (A.1) : demandes et compositions partout, sauf quartier en pause ou fermé par ops. */
export const openForOutings = (status: string) => status === 'LIVE' || status === 'WAITLIST';

/** Motifs `ONBOARDING_INCOMPLETE {missing}` côté sortie. */
function missingSteps(r: RequesterFacts): string[] {
  const out: string[] = [];
  if (!r.neighborhood) out.push('NEIGHBORHOOD');
  if (!r.onboarded) out.push('PET');
  if (!r.intentionsSet) out.push('SEEKS');
  return out;
}

export class OutingRequestsUseCases {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly tuning: Tuning,
  ) {}

  /** Créneaux de la semaine : disponibilités cochées (toutes si rien n'est coché), futurs avant verrouillage. */
  async slotsFor(r: RequesterFacts, weekKey: string, now: Date): Promise<WeekSlot[]> {
    const nb = r.neighborhood;
    if (!nb) return [];
    const ids = r.acceptableNeighborhoodIds.length ? r.acceptableNeighborhoodIds : [nb.id];
    const all = await this.repo.weekSlots(ids, weekKey, nb.timezone);
    const chosen = r.availableSlotTemplateIds.length ? all.filter((s) => r.availableSlotTemplateIds.includes(s.templateId)) : all;
    return chosen.filter((s) => outingInstants({ startsAtMs: s.startsAt.getTime(), composedAtMs: now.getTime(), tz: nb.timezone, tuning: this.tuning }).lockAtMs > now.getTime());
  }

  /**
   * Semaine pertinente : celle d'une place encore à venir (cette semaine ou la suivante) ; sinon la
   * semaine courante tant que sa fenêtre de demande n'est pas fermée ; sinon la suivante.
   */
  async relevantWeek(userId: string, tz: string, now: Date): Promise<string> {
    const current = weekKeyOf(now.getTime(), tz);
    const next = weekKeyOf(now.getTime() + 7 * DAY_MS, tz);
    for (const wk of [current, next]) {
      const seat = await this.repo.seatOfWeek(null, userId, wk);
      if (seat && ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN'].includes(seat.status)) return wk;
    }
    const prevSeat = await this.repo.seatOfWeek(null, userId, current);
    const outing = prevSeat ? await this.repo.outing(null, prevSeat.outingId) : null;
    // Une sortie de la semaine encore en votes reste visible ; sinon on regarde la semaine suivante.
    if (outing && outing.status === 'DONE' && !outing.votesClosedAt) return current;
    return now.getTime() < requestWindow(current, tz, this.tuning).closesAtMs ? current : next;
  }

  async week(userId: string): Promise<OutingWeekView> {
    const now = this.clock.now();
    const r = await this.repo.requester(null, userId, now);
    if (!r) throw Errors.notFound('Utilisateur');
    const tz = r.neighborhood?.timezone ?? 'Europe/Paris';
    const weekKey = await this.relevantWeek(userId, tz, now);
    const w = requestWindow(weekKey, tz, this.tuning);
    const window = { opensAt: new Date(w.opensAtMs), closesAt: new Date(w.closesAtMs) };
    const [request, seat, slots] = await Promise.all([this.repo.request(null, userId, weekKey), this.repo.seatOfWeek(null, userId, weekKey), this.slotsFor(r, weekKey, now)]);
    const paused = isPaused(r.reliability, now);
    const phase = weekPhase({ neighborhoodLive: !!r.neighborhood && openForOutings(r.neighborhood.status), paused, now, window, request, seat });
    const systemCancelled = seat?.status === 'CANCELLED' && seat.cancelKind === 'SYSTEM_REMOVAL';
    return {
      weekKey,
      phase,
      requestWindow: { opensAt: window.opensAt.toISOString(), closesAt: window.closesAt.toISOString() },
      slots: slots.map((s) => ({ startsAt: s.startsAt.toISOString(), label: slotLabelKey(s.isoWeekday, Math.floor(s.localMinute / 60)) })),
      ...(request ? { myRequest: toView(request) } : {}),
      ...(seat && seat.status !== 'DECLINED' && seat.status !== 'EXPIRED' ? { myOutingId: seat.outingId } : {}),
      priorityNextWeek: request?.status === 'UNPLACED' || systemCancelled,
      ...(paused && r.reliability?.pausedUntil ? { pausedUntil: r.reliability.pausedUntil.toISOString() } : {}),
    };
  }

  async put(userId: string, weekKey: string, body: PutOutingRequest, commandId: string): Promise<OutingRequestView> {
    const now = this.clock.now();
    const r = await this.repo.requester(null, userId, now);
    if (!r) throw Errors.notFound('Utilisateur');
    const missing = missingSteps(r);
    if (missing.includes('NEIGHBORHOOD')) throw Errors.precondition('ONBOARDING_INCOMPLETE', { missing });
    const nb = r.neighborhood!;
    // V5.2 (A.1) : plus de quartier « fermé » — une sortie se forme partout dès 5 personnes compatibles.
    if (!openForOutings(nb.status)) throw Errors.precondition('NEIGHBORHOOD_NOT_LIVE');
    if (missing.length) throw Errors.precondition('ONBOARDING_INCOMPLETE', { missing });
    if (!r.verified) throw Errors.precondition('VERIFICATION_REQUIRED');
    if (!r.hasPhoto) throw Errors.precondition('PHOTO_REQUIRED');
    if (isPaused(r.reliability, now)) throw Errors.precondition('RELIABILITY_PAUSED', { until: r.reliability!.pausedUntil!.toISOString() });
    const w = requestWindow(weekKey, nb.timezone, this.tuning);
    if (now.getTime() < w.opensAtMs || now.getTime() >= w.closesAtMs) throw Errors.precondition('REQUEST_WINDOW_CLOSED');
    if (r.weeksOff.includes(weekKey)) throw Errors.precondition('WEEK_OFF');
    const offered = await this.slotsFor(r, weekKey, now);
    const wanted = body.slotStartsAt ? body.slotStartsAt.map((s) => new Date(s)) : offered.map((s) => s.startsAt);
    if (wanted.length === 0 || wanted.some((d) => !offered.some((o) => o.startsAt.getTime() === d.getTime()))) throw Errors.validation({ field: 'slotStartsAt', reason: 'SLOT_NOT_OFFERED' });
    if (body.teamId && body.teamId !== r.activeTeamId) throw Errors.precondition('TEAM_INVALID');
    const slotStartsAt = [...new Set(wanted.map((d) => d.getTime()))].sort((a, b) => a - b).slice(0, 7).map((t) => new Date(t));
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.request',
      commandId,
      payload: { weekKey, slotStartsAt: slotStartsAt.map((d) => d.toISOString()), teamId: r.activeTeamId },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const seat = await this.repo.seatOfWeek(scope, userId, weekKey);
        if (seat && !['DECLINED', 'EXPIRED', 'CANCELLED'].includes(seat.status)) throw new AppError('CONFLICT', 'Une sortie par semaine', { detailsSafe: { reason: 'WEEKLY_QUOTA_USED' } });
        const prev = await this.repo.request(scope, userId, weekKey);
        if (prev?.status === 'PLACED') throw new AppError('CONFLICT', 'Une sortie par semaine', { detailsSafe: { reason: 'WEEKLY_QUOTA_USED' } });
        const missedWeeks = await this.repo.missedWeeksBefore(scope, userId, weekKey);
        const row = await this.repo.upsertRequest(scope, { id: prev?.id ?? this.random.uuid(), userId, neighborhoodId: nb.id, weekKey, slotStartsAt, teamId: r.activeTeamId, missedWeeks });
        await scope.outbox.emit({ topic: 'outing.requested', aggregateType: 'User', aggregateId: userId, payload: { weekKey } });
        return toView(row);
      },
    });
    return result;
  }

  async withdraw(userId: string, weekKey: string, commandId: string): Promise<{ withdrawn: true }> {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.withdraw_request',
      commandId,
      payload: { weekKey },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const req = await this.repo.request(scope, userId, weekKey);
        if (!req || req.status === 'WITHDRAWN') throw Errors.notFound('Demande');
        if (req.status !== 'OPEN') throw Errors.precondition('ALREADY_PLACED');
        await this.repo.setRequestStatus(scope, req.id, 'WITHDRAWN');
        return { withdrawn: true as const };
      },
    });
    return result;
  }
}
