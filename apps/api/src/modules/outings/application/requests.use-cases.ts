/**
 * Semaine et demande hebdo (spec-v5 §2.4, §7.2, V5.1 D.13) : la demande part des disponibilités
 * cochées dans les quartiers acceptables (semaines off exclues) ; une team est composée comme une
 * unité ; quota 1 place / semaine NON achetable (index unique partiel, 409 WEEKLY_QUOTA_USED).
 */
import { createHash } from 'node:crypto';
import { DAY_MS } from '@blowy/domain';
import type { OutingRequestView, OutingWeekView, PutOutingRequest } from '@blowy/api-contract';
import { slotLabelKey } from '@blowy/content';
import { composeAtOf, mondayOfWeek, requestWindow, weekKeyOf } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { isPaused } from '../domain/reliability.js';
import { isWeekendOff, isWeekOff, weekPhase } from '../domain/week.js';
import { storyCompatible, type OutingCandidate } from '@blowy/matching/groups';
import type { OutingsRepository, RequestRow, RequesterFacts, WeekSlot } from './ports/outings.repository.js';

const toView = (r: RequestRow): OutingRequestView => ({
  weekKey: r.weekKey,
  status: r.status,
  slotStartsAt: r.slotStartsAt.slice(0, 3).map((d) => d.toISOString()),
  ...(r.teamId ? { teamId: r.teamId } : {}),
  ...(r.mode === 'FRIENDS_THIS_WEEK' ? { mode: 'FRIENDS_THIS_WEEK' as const } : {}),
  createdAt: r.createdAt.toISOString(),
});

/** Identifiant de commande déterministe (UUID v8 dérivé) d'une demande automatique : rejouer ne crée rien. */
export function autoCommandId(weekKey: string, userId: string): string {
  const h = createHash('sha256').update(`outings.auto_request:${weekKey}:${userId}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

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
    const base = r.acceptableNeighborhoodIds.length ? r.acceptableNeighborhoodIds : [nb.id];
    // V5.6 (E11) : + quartiers dans le trajet max (temps de trajet maintenu par ops).
    const reach = await this.repo.reachableNeighborhoods(nb.id, r.maxTravelMinutes ?? 30);
    const ids = [...new Set([...base, ...(reach.length ? [nb.id, ...reach] : [])])];
    const all = await this.repo.weekSlots(ids, weekKey, nb.timezone);
    const chosen = r.availableSlotTemplateIds.length ? all.filter((s) => r.availableSlotTemplateIds.includes(s.templateId)) : all;
    // V5.5 (D-053) : créneaux du mardi au dimanche, demandables jusqu'à LEUR composition (J − 3 21 h).
    const cycle = this.tuning.outings.cycle;
    const days = cycle.slotIsoWeekdays;
    // V5.6 (B.13) : « un week-end sur deux » retire les créneaux du week-end de cette semaine-là.
    const weekendOff = isWeekendOff(weekKey, r.everyOtherWeekendOffFrom);
    return chosen.filter((s) => days.includes(s.isoWeekday) && !(weekendOff && cycle.weekendIsoWeekdays.includes(s.isoWeekday)) && composeAtOf(s.startsAt.getTime(), nb.timezone, this.tuning) > now.getTime());
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
      ...(await this.honestState(userId, r, weekKey, request, seat, now)),
    };
  }

  /**
   * V5.5 (D-061, D-053) : prochaine composition qui me concerne, et état honnête « histoire » — pour qui cherche
   * une histoire (demande NORMAL, OPEN, aucune place cette semaine) : vivier `storyCompatible` sur MES créneaux
   * de la semaine (demandes de la ville, avant toute composition) < `[T] storyGuarantee.minCompatible`. Le seul
   * résultat est un booléen sur moi ; rien sur un groupe, rien après composition, aucune personne désignée.
   */
  private async honestState(userId: string, r: RequesterFacts, weekKey: string, request: RequestRow | null, seat: { status: string } | null, now: Date) {
    const nb = r.neighborhood;
    if (!nb || !request || request.status !== 'OPEN') return {};
    const mine = request.slotStartsAt.map((d) => d.getTime()).filter((t) => composeAtOf(t, nb.timezone, this.tuning) > now.getTime());
    if (mine.length === 0) return {};
    const composeAt = new Date(Math.min(...mine.map((t) => composeAtOf(t, nb.timezone, this.tuning))));
    if (seat && ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN'].includes(seat.status)) return { composeAt: composeAt.toISOString() };
    if (request.mode === 'FRIENDS_THIS_WEEK') return { composeAt: composeAt.toISOString() };
    const scope = (await this.repo.liveScopes()).find((s) => s.neighborhoodIds.includes(nb.id));
    if (!scope) return { composeAt: composeAt.toISOString() };
    const { candidates } = await this.repo.weeklyCandidates(scope, weekKey, now);
    const me = candidates.find((c) => c.profile.userId === userId);
    if (!me || !me.seeks.romance) return { composeAt: composeAt.toISOString() };
    const slots = new Set(mine);
    const prof = (c: OutingCandidate) => ({ gender: c.profile.gender, seeks: c.seeks, meetGenders: c.meetGenders, romanceGenders: c.romanceGenders, age: c.profile.age, groupAge: c.groupAge });
    const pool = candidates.filter((c) => c.profile.userId !== userId && (!me.teamId || c.teamId !== me.teamId) && c.slotStartsAtMs.some((t) => slots.has(t)) && storyCompatible(prof(me), prof(c))).length;
    return { composeAt: composeAt.toISOString(), ...(pool < this.tuning.outings.composition.storyGuarantee.minCompatible ? { storyFeasibility: 'NOT_ENOUGH_ON_SLOTS' as const } : {}) };
  }

  async put(userId: string, weekKey: string, body: PutOutingRequest, commandId: string): Promise<OutingRequestView> {
    const now = this.clock.now();
    const r = await this.repo.requester(null, userId, now);
    if (!r) throw Errors.notFound('Utilisateur');
    const missing = missingSteps(r);
    if (missing.includes('NEIGHBORHOOD')) throw Errors.precondition('ONBOARDING_INCOMPLETE', { missing });
    const nb = r.neighborhood!;
    // V5.2 (A.1) : plus de quartier « fermé » — une sortie se forme partout dès 5 personnes compatibles.
    if (!openForOutings(nb.status)) throw Errors.precondition('NEIGHBORHOOD_UNAVAILABLE');
    if (missing.length) throw Errors.precondition('ONBOARDING_INCOMPLETE', { missing });
    if (!r.verified) throw Errors.precondition('AGE_VERIFICATION_REQUIRED');
    if (!r.hasPhoto) throw Errors.precondition('PHOTO_REQUIRED');
    if (isPaused(r.reliability, now)) throw Errors.precondition('RELIABILITY_PAUSED', { until: r.reliability!.pausedUntil!.toISOString() });
    const w = requestWindow(weekKey, nb.timezone, this.tuning);
    if (now.getTime() < w.opensAtMs || now.getTime() >= w.closesAtMs) throw Errors.precondition('REQUEST_WINDOW_CLOSED');
    // V5.4 (B.9) : semaines cochées ou « une semaine sur deux » (garde alternée).
    if (isWeekOff(weekKey, r.weeksOff, r.everyOtherWeekOffFrom)) throw Errors.precondition('WEEK_OFF');
    const offered = await this.slotsFor(r, weekKey, now);
    // V5.5 (D-053) : plus aucun créneau encore à composer cette semaine → la demande est close.
    if (offered.length === 0 && !body.slotStartsAt) throw Errors.precondition('REQUEST_WINDOW_CLOSED');
    const wanted = body.slotStartsAt ? body.slotStartsAt.map((s) => new Date(s)) : offered.map((s) => s.startsAt);
    if (wanted.length === 0 || wanted.some((d) => !offered.some((o) => o.startsAt.getTime() === d.getTime()))) throw Errors.validation({ field: 'slotStartsAt', reason: 'SLOT_NOT_OFFERED' });
    if (body.teamId && body.teamId !== r.activeTeamId) throw Errors.precondition('TEAM_INVALID');
    const slotStartsAt = [...new Set(wanted.map((d) => d.getTime()))].sort((a, b) => a - b).slice(0, 7).map((t) => new Date(t));
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.request',
      commandId,
      payload: { weekKey, slotStartsAt: slotStartsAt.map((d) => d.toISOString()), teamId: r.activeTeamId, mode: body.mode ?? null },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const seat = await this.repo.seatOfWeek(scope, userId, weekKey);
        if (seat && !['DECLINED', 'EXPIRED', 'CANCELLED'].includes(seat.status)) throw new AppError('CONFLICT', 'Une sortie par semaine', { detailsSafe: { reason: 'WEEKLY_QUOTA_USED' } });
        const prev = await this.repo.request(scope, userId, weekKey);
        if (prev?.status === 'PLACED') throw new AppError('CONFLICT', 'Une sortie par semaine', { detailsSafe: { reason: 'WEEKLY_QUOTA_USED' } });
        const missedWeeks = await this.repo.missedWeeksBefore(scope, userId, weekKey);
        const row = await this.repo.upsertRequest(scope, { id: prev?.id ?? this.random.uuid(), userId, neighborhoodId: nb.id, weekKey, slotStartsAt, teamId: r.activeTeamId, missedWeeks, ...(body.mode ? { mode: body.mode } : {}) });
        await scope.outbox.emit({ topic: 'outing.requested', aggregateType: 'User', aggregateId: userId, payload: { weekKey } });
        return toView(row);
      },
    });
    return result;
  }

  /**
   * D-052 (§2.4, job `outings.auto_requests`) : la demande hebdo est créée AUTOMATIQUEMENT depuis les créneaux
   * cochés, pendant la fenêtre de demande de la semaine — sauf semaine off, pause, place active, vérification
   * ou photo manquantes (mêmes préconditions que `PUT`, silencieusement ignorées). Idempotent : commande
   * dérivée de `(semaine, personne)`, et une demande existante (même retirée) n'est jamais recréée.
   */
  async autoRequests(now: Date, limit = 500): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    const weeks = new Set<string>();
    for (const scope of await this.repo.liveScopes()) {
      const wk = weekKeyOf(now.getTime(), scope.timezone);
      const w = requestWindow(wk, scope.timezone, this.tuning);
      if (now.getTime() >= w.opensAtMs && now.getTime() < w.closesAtMs) weeks.add(wk);
    }
    for (const weekKey of weeks) {
      for (const userId of await this.repo.autoRequestCandidates(weekKey, limit)) {
        const r = await this.repo.requester(null, userId, now);
        if (!r?.neighborhood || weekKeyOf(now.getTime(), r.neighborhood.timezone) !== weekKey) {
          skipped++;
          continue;
        }
        try {
          await this.put(userId, weekKey, {}, autoCommandId(weekKey, userId));
          created++;
        } catch {
          skipped++; // précondition non remplie (pause, semaine off, place active…) : rien à faire cette semaine
        }
      }
    }
    return { created, skipped };
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
