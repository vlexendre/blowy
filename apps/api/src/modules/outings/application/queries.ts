/**
 * Lectures projetées par acteur (spec-v5 §3, §7.2, §7.5) : vue de sortie, écran de vote, historique,
 * fiabilité, bande. Les photos ne sont émises (jeton média court) que pour les personnes que le
 * projecteur autorise ; l'ACL est revérifiée par `media` à chaque lecture.
 */
import { reliabilityDisplay, type VoteChoice } from '@blowy/domain';
import type { BandMemberView, OutingView, OutingVotesView, ReliabilityView } from '@blowy/api-contract';
import type { Clock } from '../../../shared/application/clock.js';
import type { PhotoTokenIssuer } from '../../../shared/application/ports/outing-photos.port.js';
import { Errors } from '../../../shared/domain/errors.js';
import { isPaused } from '../domain/reliability.js';
import { cancelPreview, emergencyAvailable, emergencyWindowStart } from '../domain/seat-policy.js';
import type { Tuning } from '@blowy/tuning';
import { photoEligible, projectOutingFor } from '../domain/visibility.js';
import { voteTargets } from '../domain/votes.js';
import type { OutingsRepository } from './ports/outings.repository.js';

export class OutingQueries {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly photos: PhotoTokenIssuer,
    private readonly clock: Clock,
    private readonly tuning: Tuning,
  ) {}

  private async issuePhotos(viewerId: string, userIds: string[]) {
    const out = new Map<string, { mediaId: string; url: string }>();
    for (const u of userIds) {
      const mediaId = await this.photos.currentProfilePhotoId(u);
      if (!mediaId) continue;
      const url = await this.photos.issue(viewerId, mediaId);
      if (url) out.set(u, { mediaId, url });
    }
    return out;
  }

  async outing(viewerId: string, outingId: string): Promise<OutingView> {
    const now = this.clock.now();
    const facts = await this.repo.outingFacts(null, outingId, now);
    const mine = facts?.seats.find((s) => s.userId === viewerId);
    if (!facts || !mine) throw Errors.notFound('Sortie');
    const others = facts.seats.map((s) => s.userId).filter((u) => u !== viewerId);
    const [blocked, linked] = await Promise.all([this.repo.blockedAmong(viewerId, others), this.repo.linkedAmong(viewerId, others)]);
    const eligible = photoEligible(viewerId, facts, now, linked).filter((u) => !blocked.has(u));
    const photos = await this.issuePhotos(viewerId, eligible);
    // V5.4 (B.8) : après la confirmation, l'aperçu dit au lecteur seul s'il lui reste son « imprévu » du mois (30 j glissants).
    const afterLock = now >= facts.lockAt;
    const emergency = afterLock && mine.status === 'CONFIRMED' ? await this.emergencyLeft(viewerId, facts.timezone, now) : undefined;
    const preview = mine.status === 'CONFIRMED' || mine.status === 'HELD' ? cancelPreview({ funding: mine.funding, now, revealAt: facts.lockAt, kind: 'CANT_MAKE_IT', ...(emergency !== undefined ? { emergencyAvailable: emergency } : {}) }) : undefined;
    // V5.4 (A.1) : plus aucun signal de compatibilité dans la vue (ni `storyMatch`, ni « sortie entre amis pour
    // toi ») ; la garantie « histoire possible » reste appliquée en silence par la composition.
    const view = projectOutingFor(viewerId, facts, { now, blocked, linked, photos, ...(preview ? { cancelPreview: preview } : {}) });
    if (!view) throw Errors.notFound('Sortie');
    return this.withExtras(view, outingId, viewerId);
  }

  /**
   * V5.6 (§7.5, E11) : activité choisie par moi ou « selon le lieu et vos envies », astreinte (toujours couverte),
   * et — seulement avec le lieu (dès la confirmation) — l'ambiance du lieu et le trajet typique depuis mon quartier.
   */
  private async withExtras(view: OutingView, outingId: string, viewerId: string): Promise<OutingView> {
    const x = await this.repo.outingViewExtras(outingId, viewerId);
    if (!x) return view;
    const out: OutingView = { ...view, activityChosenBy: x.viewerActivities.includes(x.activity) ? 'YOU' : 'VENUE_AND_GROUP', oncall: { covered: true } };
    if (out.venue) {
      const t = x.viewerHome && x.viewerHome !== x.neighborhoodId ? await this.repo.travelEstimate(x.viewerHome, x.neighborhoodId) : null;
      const minutes = t?.minutes ?? null;
      // V5.7 (E30) : `venue` n'existe que pour une place confirmée à partir de la confirmation — même règle pour l'accueil.
      const welcome = await this.repo.venueWelcomeMessage(x.venueId);
      out.venue = { ...out.venue, ...(minutes ? { travelMinutes: minutes, ...(t?.estimated ? { travelEstimated: true as const } : {}) } : {}), ...(x.venueAmbiance ? { ambiance: x.venueAmbiance } : {}), ...(welcome ? { welcomeMessage: welcome } : {}) };
    }
    return out;
  }

  private async emergencyLeft(userId: string, timezone: string, now: Date): Promise<boolean> {
    // V5.5 (D-056) : 1 « imprévu » par 30 j glissants (le fuseau ne compte plus).
    void timezone;
    const per = this.tuning.outings.emergencyCancelsPerMonth;
    if (per <= 0) return false;
    return emergencyAvailable(await this.repo.emergencyCancelsSince(null, userId, emergencyWindowStart(now, this.tuning.outings.emergencyWindowDays)), per);
  }

  /** Écran « après la sortie » : présents seulement ; mes bulletins ; mes accords à la clôture. */
  async votes(viewerId: string, outingId: string): Promise<OutingVotesView> {
    const now = this.clock.now();
    const outing = await this.repo.outing(null, outingId);
    const seat = await this.repo.seat(null, outingId, viewerId);
    if (!outing || !seat || seat.status !== 'ATTENDED' || outing.status !== 'DONE') throw Errors.notFound('Sortie');
    const attendees = await this.repo.attendees(null, outingId, now);
    const me = attendees.find((a) => a.userId === viewerId);
    if (!me) throw Errors.notFound('Sortie');
    const blocked = await this.repo.blockedAmong(viewerId, attendees.map((a) => a.userId));
    const targets = voteTargets(me, attendees).filter((t) => !blocked.has(t));
    const facts = (await this.repo.outingFacts(null, outingId, now))!;
    const closed = !!outing.votesClosedAt;
    const [ballots, reveals, linked] = await Promise.all([this.repo.myBallots(null, outingId, viewerId), closed ? this.repo.myReveals(outingId, viewerId) : Promise.resolve(new Map()), this.repo.linkedAmong(viewerId, targets)]);
    const photos = await this.issuePhotos(viewerId, closed ? targets.filter((t) => linked.has(t)) : now < outing.votesCloseAt ? targets : []);
    return {
      closesAt: outing.votesCloseAt.toISOString(),
      closed,
      targets: targets.map((t) => {
        const p = facts.seats.find((s) => s.userId === t)!.person;
        const mutual = reveals.get(t);
        const photo = photos.get(t);
        return { userId: t, firstName: p.firstName, ...(photo ? { photo } : {}), pet: p.pet, myChoice: (ballots.get(t) ?? 'NO') as VoteChoice, ...(mutual ? { mutual } : {}) };
      }),
    };
  }

  async history(viewerId: string, cursor: string | undefined, limit: number) {
    const before = decodeCursor(cursor);
    const rows = await this.repo.history(viewerId, before, limit + 1);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((r) => ({ id: r.id, weekKey: r.weekKey, startsAt: r.startsAt.toISOString(), venueName: r.venueName, attended: r.attended, ...(r.memoryId ? { memoryId: r.memoryId } : {}) })),
      nextCursor: rows.length > limit && last ? encodeCursor(last.startsAt, last.id) : null,
    };
  }

  async reliability(userId: string): Promise<ReliabilityView> {
    const now = this.clock.now();
    const s = await this.repo.reliability(null, userId);
    const d = reliabilityDisplay(s?.attended ?? 0, s?.noShows ?? 0, s?.lateCancels ?? 0);
    return {
      attended: d === 'NEWCOMER' ? 0 : d.attended,
      total: d === 'NEWCOMER' ? 0 : d.total,
      ...(s && isPaused(s, now) ? { pausedUntil: s.pausedUntil!.toISOString() } : {}),
      newcomer: d === 'NEWCOMER',
    };
  }

  /** Ma bande (jamais celle d'autrui). */
  async band(userId: string): Promise<{ items: BandMemberView[]; nextCursor: null }> {
    const now = this.clock.now();
    const rows = (await this.repo.band(userId, now)).filter((r) => r.conversationId);
    const blocked = await this.repo.blockedAmong(userId, rows.map((r) => r.otherUserId));
    const visible = rows.filter((r) => !blocked.has(r.otherUserId));
    const photos = await this.issuePhotos(userId, visible.map((r) => r.otherUserId));
    return {
      items: visible.map((r) => {
        const photo = photos.get(r.otherUserId);
        return { linkId: r.linkId, user: { id: r.otherUserId, firstName: r.person.firstName, ...(photo ? { photo } : {}) }, pet: r.person.pet, conversationId: r.conversationId!, origin: r.origin, since: r.since.toISOString() };
      }),
      nextCursor: null,
    };
  }
}

function encodeCursor(at: Date, id: string) {
  return Buffer.from(`h1:${at.toISOString()}|${id}`).toString('base64url');
}
function decodeCursor(c: string | undefined): { startsAt: Date; id: string } | null {
  if (!c) return null;
  const m = /^h1:([^|]+)\|([0-9a-f-]{36})$/.exec(Buffer.from(c, 'base64url').toString('utf8'));
  return m ? { startsAt: new Date(m[1]!), id: m[2]! } : null;
}
