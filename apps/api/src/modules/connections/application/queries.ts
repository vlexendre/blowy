/**
 * Lectures projetées par acteur du module `connections` (spec-v5 §3.2, §7.3 ; V5.1 F.18 ; V5.2 F.17,
 * G.21) : mes duos, mes propositions voie Duo, les lieux d'un RDV, « Ta rue ». Jamais d'intention,
 * d'orientation, de sous-choix, de bulletin d'autrui, de progression de l'autre ni d'absence d'autrui :
 * la seule information sur l'autre est l'intérêt mutuel (le duo existe) et l'indice booléen
 * « projet compatible » quand les sous-choix secrets concordent.
 */
import { isDuoTerminal, PET_MEMORY_KINDS, projectCompatible, seeksOf, SPECIES, type PetMemoryKind } from '@blowy/domain';
import type { DuoDateView, DuoLaneProposalView, DuoView, PetMemoryView, StreetView } from '@blowy/api-contract';
import { romanceCompatible } from '@blowy/matching/groups';
import { Errors } from '../../../shared/domain/errors.js';
import type { OutingsRepository } from '../../outings/application/ports/outings.repository.js';
import { checkinWindow, EXPIRED_READ_ONLY_MS, eggActive, eggEligible, isUnlocked, localDateHour, unlockProgress, voteOptionsFor } from '../domain/duo-policy.js';
import { seeksProfileOf } from './duo-lifecycle.js';
import type { ConnectionsDeps } from './deps.js';
import type { DuoUseCases } from './duos.use-cases.js';
import { isMember, otherOf } from './duos.use-cases.js';
import type { DuoDateRow, DuoRow, MemoryRow } from './ports/connections.repository.js';

const HOUR = 3_600_000;
type Feed = { items: DuoLaneProposalView[]; emptyReason: 'NONE' | 'LANE_DISABLED' | 'NOT_VERIFIED' | 'PHOTO_REQUIRED' | 'PAUSED' | 'LIMIT_REACHED' | 'WAITING_NEXT_BATCH' | null; nextBatchAt: string | null; quota: { maxActive: number; active: number; freeMaxActive: number; unlimited: false } };

export class ConnectionQueries {
  constructor(
    private readonly x: ConnectionsDeps,
    private readonly duos: DuoUseCases,
    private readonly outings: OutingsRepository,
  ) {}

  private get repo() {
    return this.x.repo;
  }

  async list(userId: string): Promise<{ items: DuoView[] }> {
    const now = this.x.clock.now();
    const rows = await this.repo.duosOf(userId, new Date(now.getTime() - EXPIRED_READ_ONLY_MS));
    const blocked = await this.outings.blockedAmong(userId, rows.map((d) => otherOf(d, userId)));
    const items: DuoView[] = [];
    for (const d of rows) if (!blocked.has(otherOf(d, userId))) items.push(await this.view(userId, d, now));
    return { items };
  }

  async get(userId: string, duoId: string): Promise<DuoView> {
    const now = this.x.clock.now();
    const d = await this.repo.duo(null, duoId);
    // 404 identique pour un inconnu, un non-membre, un duo terminé (hors lecture seule d'une expiration) ou bloqué.
    if (!d || !isMember(d, userId)) throw Errors.notFound('Duo');
    const readOnly = d.status === 'EXPIRED' && d.endedAt && now.getTime() - d.endedAt.getTime() < EXPIRED_READ_ONLY_MS;
    if (isDuoTerminal(d.status) && !readOnly) throw Errors.notFound('Duo');
    if ((await this.outings.blockedAmong(userId, [otherOf(d, userId)])).size) throw Errors.notFound('Duo');
    return this.view(userId, d, now);
  }

  private async view(viewerId: string, d: DuoRow, now: Date): Promise<DuoView> {
    const other = otherOf(d, viewerId);
    const [persons, seeks] = await Promise.all([this.repo.persons([other], now), this.repo.seeks([viewerId, other], now)]);
    const p = persons.get(other);
    const live = !isDuoTerminal(d.status);
    let photo: { mediaId: string; url: string } | undefined;
    if (live && isUnlocked(d.status)) {
      const mediaId = await this.x.photos.currentProfilePhotoId(other);
      const url = mediaId ? await this.x.photos.issue(viewerId, mediaId) : null;
      if (mediaId && url) photo = { mediaId, url };
    }
    const conversationId = d.conversationId ?? (await this.repo.conversationOfDuo(null, d.id)) ?? d.id;
    let exchange: DuoView['exchange'];
    if (d.status === 'EXCHANGE' && d.exchangeEndsAt) {
      const counts = await this.repo.humanMessageCounts(null, conversationId, d.exchangeEndsAt);
      const mine = counts.get(viewerId) ?? 0;
      exchange = { endsAt: d.exchangeEndsAt.toISOString(), mineCount: mine, unlockProgress: unlockProgress(mine, this.x.tuning) };
    }
    const me = seeks.get(viewerId);
    const them = seeks.get(other);
    // Indice booléen seulement : romance réciproque ET sous-choix concordants ; jamais les sous-choix.
    const compatible = !!me && !!them && romanceCompatible(seeksProfileOf(me), seeksProfileOf(them)) && projectCompatible(me, them);
    const date = live ? await this.repo.currentDate(null, d.id) : null;
    const showDeadline = live && d.origin === 'LANE' && d.dateDeadline && d.datesAttended === 0 && !d.together;
    const eligible = eggEligible(d, this.x.tuning);
    const myOptIn = d.userLowId === viewerId ? d.eggOptInLow : d.eggOptInHigh;
    return {
      id: d.id,
      status: d.status,
      origin: d.origin,
      other: {
        firstName: p?.firstName ?? '',
        pet: p?.pet ?? { name: 'Un pet', species: 'NINO', equipped: [], traits: [] },
        ...(photo ? { photo } : {}),
        // V5.6 (D-076, E24) : jamais la fiabilité de l'autre.
      },
      ...(exchange ? { exchange } : {}),
      ...(showDeadline ? { dateDeadline: d.dateDeadline!.toISOString() } : {}),
      ...(date ? { currentDate: await this.dateView(viewerId, d, date, now, me ? seeksOf(me.lookingFor).romance : false) } : {}),
      ...(compatible && live ? { projectCompatible: true as const } : {}),
      conversationId,
      ...(live && (eligible || myOptIn || eggActive(d)) ? { egg: { myOptIn, active: eggActive(d), eligible } } : {}),
    };
  }

  async dateView(viewerId: string, d: DuoRow, date: DuoDateRow, now: Date, seeksRomance?: boolean): Promise<DuoDateView> {
    const venue = await this.repo.venue(date.venueId);
    const w = checkinWindow(date.startsAt, this.x.tuning);
    const mine = d.userLowId === viewerId ? date.checkinLowAt : date.checkinHighAt;
    const votesOpen = date.status === 'DONE' && !!date.votesCloseAt && !date.votesClosedAt && now < date.votesCloseAt && !!mine;
    let myVote: DuoDateView['myVote'];
    if (votesOpen) myVote = (await this.repo.ballots(null, date.id)).get(viewerId) ?? 'NO';
    const romance = seeksRomance ?? (await this.repo.seeks([viewerId], now).then((m) => (m.get(viewerId) ? seeksOf(m.get(viewerId)!.lookingFor).romance : false)));
    return {
      id: date.id,
      status: date.status,
      venue: { id: date.venueId, name: venue?.name ?? '', ...(venue ? { address: venue.address } : {}) },
      startsAt: date.startsAt.toISOString(),
      proposedByMe: date.proposedByUserId === viewerId,
      ...(date.status === 'CONFIRMED' || date.status === 'DONE' ? { myCheckedIn: !!mine } : {}),
      ...(votesOpen ? { votesCloseAt: date.votesCloseAt!.toISOString(), myVote, voteOptions: voteOptionsFor(!!romance) } : {}),
      endsAt: date.endsAt.toISOString(),
      checkinOpensAt: w.opensAt.toISOString(),
      checkinClosesAt: w.closesAt.toISOString(),
    };
  }

  async dateViewById(viewerId: string, duoId: string, dateId: string): Promise<DuoDateView> {
    const d = await this.repo.duo(null, duoId);
    const date = await this.repo.date(null, dateId);
    if (!d || !isMember(d, viewerId) || !date || date.duoId !== duoId) throw Errors.notFound('Rendez-vous');
    return this.dateView(viewerId, d, date, this.x.clock.now());
  }

  async venues(userId: string, duoId: string) {
    const d = await this.repo.duo(null, duoId);
    if (!d || !isMember(d, userId) || isDuoTerminal(d.status)) throw Errors.notFound('Duo');
    // Lieux visibles seulement une fois les visages débloqués (aucun RDV avant).
    if (!isUnlocked(d.status)) return { items: [] };
    return { items: (await this.repo.venuesFor([d.userLowId, d.userHighId])).map((v) => ({ id: v.id, name: v.name, address: v.address })) };
  }

  // ------------------------------------------------------------------ voie Duo
  async feed(userId: string): Promise<Feed> {
    const now = this.x.clock.now();
    const [rows, seeks, verified, photo, paused, active, capacity, tz] = await Promise.all([
      this.repo.laneProposalsFor(userId, now),
      this.repo.seeks([userId], now),
      this.repo.verified(null, userId, now),
      this.x.photos.currentProfilePhotoId(userId),
      this.x.reliability.isPaused(null, userId, now),
      this.repo.activeDuoCount(null, userId),
      this.duos.capacity(userId, now),
      this.repo.timezoneOf(userId),
    ]);
    const mine = rows.filter((r) => !r.passedBy.includes(userId));
    const others = mine.map((r) => (r.userLowId === userId ? r.userHighId : r.userLowId));
    const [persons, blocked] = await Promise.all([this.repo.persons(others, now), this.outings.blockedAmong(userId, others)]);
    const items = mine.flatMap((r) => {
      const o = r.userLowId === userId ? r.userHighId : r.userLowId;
      const p = persons.get(o);
      if (!p || blocked.has(o)) return [];
      // V5.4 (A.3) : pet (sans traits) + initiale UNIQUEMENT avant le double « oui » : ni tranche, ni pronom,
      // ni activités, ni intention, ni score.
      const initial = [...p.firstName.trim()][0]?.toLocaleUpperCase('fr-FR') ?? '·';
      // V5.5 (D-068) : espèce (illustration générique) + initiale, jamais le nom du pet.
      return [{ proposalId: r.id, species: p.pet.species, otherInitial: initial, expiresAt: r.expiresAt.toISOString(), acceptedByMe: r.acceptedBy.includes(userId) }];
    });
    const mode = seeks.get(userId)?.meetingMode ?? null;
    const enabled = mode === 'DUO' || mode === 'BOTH';
    let emptyReason: Feed['emptyReason'] = null;
    if (items.length === 0) emptyReason = !enabled ? 'LANE_DISABLED' : !verified ? 'NOT_VERIFIED' : !photo ? 'PHOTO_REQUIRED' : paused ? 'PAUSED' : active >= capacity ? 'LIMIT_REACHED' : 'WAITING_NEXT_BATCH';
    // V5.4 (C.11) : Duo gratuit pour tous, plafond commun ; aucun argument commercial.
    return { items, emptyReason, nextBatchAt: enabled ? this.nextRun(now, tz).toISOString() : null, quota: { maxActive: Number.isFinite(capacity) ? capacity : this.x.tuning.duo.maxActive, active, freeMaxActive: Number.isFinite(capacity) ? capacity : this.x.tuning.duo.maxActive, unlimited: false as const } };
  }

  private nextRun(now: Date, tz: string): Date {
    for (let i = 1; i <= 48; i++) {
      const t = new Date(Math.floor(now.getTime() / HOUR) * HOUR + i * HOUR);
      if (localDateHour(t, tz).hour === this.x.tuning.duo.dailyRunHour) return t;
    }
    return new Date(now.getTime() + 24 * HOUR);
  }

  // ------------------------------------------------------------------ Ta rue
  /** V5.2 G.21 : les pets de MA bande + MES souvenirs en décor. Aucune jauge, aucun compteur, aucune notification. */
  async street(userId: string): Promise<StreetView> {
    const now = this.x.clock.now();
    const rows = await this.outings.band(userId, now);
    const blocked = await this.outings.blockedAmong(userId, rows.map((r) => r.otherUserId));
    const me = (await this.repo.persons([userId], now)).get(userId);
    const [memories, order, gifts] = await Promise.all([this.repo.memories(userId, 500), this.repo.streetArrangement(userId), this.repo.receivedGifts(userId, 60)]);
    // « Ranger ses souvenirs » : d'abord l'ordre choisi, puis les plus récents.
    const rank = new Map(order.map((id, i) => [id, i]));
    const sorted = [...memories].sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9) || b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 30);
    const active = rows.filter((r) => !blocked.has(r.otherUserId));
    const byUser = new Map(active.map((r) => [r.otherUserId, r]));
    return {
      myPet: me ? me.pet : null,
      residents: active.map((r) => ({ linkId: r.linkId, firstName: r.person.firstName, pet: r.person.pet })),
      decor: sorted.flatMap((m) => memoryView(m)),
      // Cadeaux des seuls membres encore dans ma bande (lien retiré ou blocage : disparaissent).
      gifts: gifts.flatMap((g) => {
        const r = byUser.get(g.fromUserId);
        return r ? [{ fromLinkId: r.linkId, fromPetName: r.person.pet.name, accessoryId: g.accessoryId, at: g.createdAt.toISOString() }] : [];
      }).slice(0, 30),
    };
  }
}

const SPECIES_SET = new Set<string>(SPECIES);
const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined);
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : undefined);
const sp = (v: unknown) => (typeof v === 'string' && SPECIES_SET.has(v) ? (v as PetMemoryView['data']['species']) : undefined);

/** Souvenir → décor : données minimales déjà visibles (jamais un prénom d'autrui). */
export function memoryView(m: MemoryRow): PetMemoryView[] {
  if (!(PET_MEMORY_KINDS as readonly string[]).includes(m.kind)) return [];
  const d = m.data;
  const data: PetMemoryView['data'] = {};
  const kind: PetMemoryKind = m.kind;
  if (kind === 'HATCHED' && sp(d.species)) data.species = sp(d.species);
  if (kind === 'OUTING_LIVED') {
    if (str(d.weekKey)) data.weekKey = str(d.weekKey);
    if (str(d.venueName)) data.venueName = str(d.venueName);
    if (int(d.pets) !== undefined) data.petCount = int(d.pets);
    if (Array.isArray(d.species)) data.speciesPresent = d.species.map(sp).filter((x): x is NonNullable<typeof x> => !!x);
  }
  if (kind === 'DUO_DATE_LIVED' && str(d.venueName)) data.venueName = str(d.venueName);
  if (kind === 'BAND_NEW_MEMBER') {
    if (str(d.petName)) data.otherPetName = str(d.petName);
    if (sp(d.species)) data.otherPetSpecies = sp(d.species);
  }
  if (kind === 'PROMISE_KEPT' && typeof d.n === 'number' && d.n > 0) data.n = d.n;
  return [{ id: m.id, kind, labelKey: `memory.${kind.toLowerCase()}`, data, createdAt: m.createdAt.toISOString() }];
}
