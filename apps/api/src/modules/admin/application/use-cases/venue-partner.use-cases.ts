/**
 * Espace lieu partenaire (spec-v5 §10.2, D-046, T6) — rôle `venue_partner`.
 *
 * Authentification DISTINCTE du staff et du mobile :
 *   1. login : preuve d'identité (Firebase en production, clé locale hors production) ; le compte doit
 *      avoir un accès lieu actif (accordé par ops/admin, step-up) → jeton d'attente MFA (clé dédiée) ;
 *   2. MFA TOTP identique au staff (secret dérivé distinct, anti-rejeu propre) → session COURTE
 *      (TTL 2 h, inactivité 15 min par défaut) + CSRF lié à la session ;
 *   3. aucune session staff ni bearer mobile n'est accepté ici, et inversement.
 *
 * Données : l'effectif ne contient que nombre, statut, prénoms (dès la confirmation, veille 18 h) et
 * code du chevalet — validé par un schéma `.strict()` à la sortie. Mutations : CommandBus (idempotence,
 * transaction) + AuditLog dans la même transaction (acteur `venue_partner`).
 */
import { createHmac } from 'node:crypto';
import { VenueRosterViewSchema, type VenueContractView, type VenueMe, type VenueRosterView, type VenueScheduleView, type VenueStatementView } from '@blowy/api-contract';
import { localDayKey, mondayOfWeek, wallToUtc, weekKeyOf } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../../shared/application/clock.js';
import type { OutingAdminPort } from '../../../../shared/application/ports/outing-admin.port.js';
import type { TxScope, UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../../shared/domain/errors.js';
import { csrfFor, hashStaffSessionToken, issuePendingToken, verifyCsrf, verifyPendingToken } from '../../domain/staff-tokens.js';
import { base32Encode, deriveTotpSecret, otpauthUri, verifyTotp } from '../../domain/totp.js';
import {
  nextCapacity,
  periodOf,
  projectVenueTable,
  reduceVenuePartner,
  targetCapacity,
  VENUE_CAP_MAX,
  VENUE_CONTRACT_CLAUSES,
  VENUE_CONTRACT_VERSION,
  VENUE_NOTICE_HOURS,
  VENUE_POLICY_WEEKS,
  weeklySchedule,
  welcomeMessageIssue,
  type VenuePartnerEvent,
  type VenuePartnerState,
} from '../../domain/venue-partner.js';
import type { AuditLog } from '../ports/admin.ports.js';
import type { OpsConfigWriter, OpsReadModel, VenueCompensationLedger, VenueFacts, VenuePartnerStore, VenueSessionRepository, VenueTextModeration } from '../ports/ops.ports.js';
import { VENUE_WELCOME_TEMPLATE } from '@blowy/content';

export const VENUE_PARTNER_ROLE = 'venue_partner';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BLOCKED = new Set(['BANNED', 'SUSPENDED', 'DELETED']);
const DAY = 86_400_000;
const refused = () => new AppError('UNAUTHENTICATED', 'Identifiants refusés');

export interface VenueIdentityVerifier {
  verify(provider: 'firebase' | 'local', credential: string): Promise<{ provider: 'FIREBASE' | 'LOCAL'; subject: string }>;
}

export interface VenueAuthConfig {
  /** Secret staff (≥ 32) dont on dérive une clé DÉDIÉE au lieu (séparation de domaine). */
  staffSessionSecret: string;
  staffMfaKey: string;
  sessionTtlMs: number;
  idleTimeoutMs: number;
  onCallPhone: string | null;
  onCallHours: string;
}

export interface VenuePartnerContext {
  userId: string;
  sessionId: string;
  displayName: string;
  venueIds: string[];
  sessionExpiresAt: Date;
  requestId: string | null;
}

/** Clé HMAC propre à l'espace lieu : un jeton staff n'y est jamais valide (et inversement). */
export const venueKeyOf = (staffSessionSecret: string) => createHmac('sha256', staffSessionSecret).update('blowy:venue-partner:v1').digest('hex');
/** Identifiant de dérivation TOTP du lieu (distinct de celui du staff pour un même compte). */
export const venueTotpSubject = (userId: string) => `venue:${userId}`;

export class VenuePartnerAuthService {
  private readonly key: string;
  constructor(
    private readonly verifier: VenueIdentityVerifier,
    private readonly reads: OpsReadModel,
    private readonly store: VenuePartnerStore,
    private readonly sessions: VenueSessionRepository,
    private readonly audit: AuditLog,
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly cfg: VenueAuthConfig,
  ) {
    this.key = venueKeyOf(cfg.staffSessionSecret);
  }

  private async account(userId: string) {
    const u = await this.reads.userStatus(userId);
    if (!u || BLOCKED.has(u.status)) return null;
    const venueIds = await this.store.venuesOf(userId);
    return venueIds.length ? { ...u, venueIds } : null;
  }

  async login(provider: 'firebase' | 'local', credential: string, requestId: string | null) {
    let ident: { provider: 'FIREBASE' | 'LOCAL'; subject: string };
    try {
      ident = await this.verifier.verify(provider, credential);
    } catch {
      throw refused();
    }
    const userId = await this.reads.userIdByIdentity(ident.provider, ident.subject);
    const acc = userId ? await this.account(userId) : null;
    if (!userId || !acc) {
      await this.audit.recordNow({ actorUserId: null, actorRole: null, action: 'venue.login_refused', targetType: 'VenueLogin', targetId: null, reason: 'NOT_PARTNER', requestId });
      throw refused();
    }
    const mfa = await this.store.partnerMfa(userId);
    const { token, expiresAt } = issuePendingToken(this.key, userId, this.random.hex(12), this.clock.now());
    return { pendingToken: token, mfaEnrolled: mfa.enrolled, expiresAt: expiresAt.toISOString() };
  }

  private pendingUser(token: string | undefined): string {
    const p = token ? verifyPendingToken(this.key, token, this.clock.now()) : null;
    if (!p) throw new AppError('UNAUTHENTICATED', 'Étape d’identification expirée : reconnectez-vous');
    return p.userId;
  }

  async startEnrollment(pendingToken: string | undefined, requestId: string | null) {
    const userId = this.pendingUser(pendingToken);
    const acc = await this.account(userId);
    if (!acc) throw refused();
    if ((await this.store.partnerMfa(userId)).enrolled) throw new AppError('CONFLICT', 'MFA déjà enrôlée : réinitialisation par Blowy uniquement');
    const generation = await this.uow.run(async (scope) => {
      const g = await this.store.startPartnerEnrollment(scope, userId);
      await this.audit.record(scope, { actorUserId: userId, actorRole: VENUE_PARTNER_ROLE, action: 'venue.mfa.enrollment_started', targetType: 'VenuePartner', targetId: userId, reason: null, requestId });
      return g;
    });
    const secret = deriveTotpSecret(this.cfg.staffMfaKey, venueTotpSubject(userId), generation);
    return { secret: base32Encode(secret), otpauthUri: otpauthUri(secret, acc.displayName, 'Blowy Lieu') };
  }

  async completeMfa(pendingToken: string | undefined, code: string, requestId: string | null) {
    const userId = this.pendingUser(pendingToken);
    const acc = await this.account(userId);
    if (!acc) throw refused();
    const mfa = await this.store.partnerMfa(userId);
    if (mfa.generation === 0) throw new AppError('PRECONDITION_FAILED', 'Enrôlement MFA requis', { detailsSafe: { reason: 'MFA_ENROLLMENT_REQUIRED' } });
    const now = this.clock.now();
    const step = verifyTotp(deriveTotpSecret(this.cfg.staffMfaKey, venueTotpSubject(userId), mfa.generation), code, now);
    if (step === null) {
      await this.audit.recordNow({ actorUserId: userId, actorRole: VENUE_PARTNER_ROLE, action: 'venue.mfa_failed', targetType: 'VenuePartner', targetId: userId, reason: null, requestId });
      throw new AppError('UNAUTHENTICATED', 'Code invalide');
    }
    const sessionId = this.random.uuid();
    const sessionToken = `${sessionId}.${this.random.hex(32)}`;
    const expiresAt = new Date(now.getTime() + this.cfg.sessionTtlMs);
    await this.uow.run(async (scope) => {
      if (!(await this.sessions.consumeTotpStep(scope, userId, step))) throw new AppError('UNAUTHENTICATED', 'Code déjà utilisé');
      if (!mfa.enrolled) {
        await this.store.confirmPartnerEnrollment(scope, userId);
        await this.audit.record(scope, { actorUserId: userId, actorRole: VENUE_PARTNER_ROLE, action: 'venue.mfa.enrolled', targetType: 'VenuePartner', targetId: userId, reason: null, requestId });
      }
      await this.sessions.create(scope, { id: sessionId, userId, tokenHash: hashStaffSessionToken(this.key, sessionToken), expiresAt });
      await this.audit.record(scope, { actorUserId: userId, actorRole: VENUE_PARTNER_ROLE, action: 'venue.session_opened', targetType: 'VenueSession', targetId: sessionId, reason: null, requestId });
    });
    return { sessionToken, csrfToken: csrfFor(this.key, sessionId), expiresAt: expiresAt.toISOString(), idleTimeoutSeconds: Math.round(this.cfg.idleTimeoutMs / 1000) };
  }

  /** Résout une session lieu ; null si invalide, expirée, inactive, révoquée ou accès retiré. */
  async resolve(token: string | undefined): Promise<Omit<VenuePartnerContext, 'requestId'> | null> {
    if (!token) return null;
    const sessionId = token.split('.')[0] ?? '';
    if (!UUID_RE.test(sessionId)) return null;
    const s = await this.sessions.find(sessionId);
    const now = this.clock.now();
    if (!s || s.revokedAt || s.expiresAt <= now) return null;
    if (now.getTime() - s.lastUsedAt.getTime() > this.cfg.idleTimeoutMs) return null;
    if (s.tokenHash !== hashStaffSessionToken(this.key, token)) return null;
    const acc = await this.account(s.userId);
    if (!acc || !(await this.store.partnerMfa(s.userId)).enrolled) return null;
    if (now.getTime() - s.lastUsedAt.getTime() > 30_000) await this.sessions.touch(s.id, now);
    return { userId: s.userId, sessionId: s.id, displayName: acc.displayName, venueIds: acc.venueIds, sessionExpiresAt: s.expiresAt };
  }

  verifyCsrf(sessionId: string, given: string | undefined) {
    return verifyCsrf(this.key, sessionId, given);
  }

  async logout(ctx: VenuePartnerContext) {
    await this.uow.run(async (scope) => {
      await this.sessions.revoke(scope, ctx.userId, ctx.sessionId, scope.now);
      await this.audit.record(scope, { actorUserId: ctx.userId, actorRole: VENUE_PARTNER_ROLE, action: 'venue.session_revoked', targetType: 'VenueSession', targetId: ctx.sessionId, reason: null, requestId: ctx.requestId });
    });
  }

  onCall() {
    return { phone: this.cfg.onCallPhone, hours: this.cfg.onCallHours };
  }
}

/** Applique la politique de créneaux d'un lieu (jours, plafond, fermetures) sur l'horizon. */
export async function applyVenuePolicy(writer: OpsConfigWriter, scope: TxScope, venueId: string, state: VenuePartnerState, cap: number, exceptionalDate: string | null = null) {
  const from = scope.now;
  const to = new Date(scope.now.getTime() + VENUE_POLICY_WEEKS * 7 * DAY);
  return writer.applySlotPolicy(scope, venueId, from, to, (slot) => {
    const target = targetCapacity(state, slot.isoWeekday, slot.localDate, cap);
    if (!slot.exists) return target > 0 ? target : 0;
    return nextCapacity({ startsAt: slot.startsAt, capacity: slot.capacity, reserved: slot.reserved }, target, scope.now, { exceptional: exceptionalDate === slot.localDate });
  });
}

export class VenuePartnerUseCases {
  constructor(
    private readonly auth: VenuePartnerAuthService,
    private readonly reads: OpsReadModel,
    private readonly store: VenuePartnerStore,
    private readonly writer: OpsConfigWriter,
    private readonly ledger: VenueCompensationLedger | null,
    private readonly outings: OutingAdminPort | null,
    private readonly bus: CommandBus,
    private readonly audit: AuditLog,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly tuning: Tuning,
    private readonly moderation: VenueTextModeration | null = null,
  ) {}

  /** V5.7 (E30, D-080) : message d'accueil — lu par le lieu avec son modèle prérempli. */
  async welcome(ctx: VenuePartnerContext, venueId?: string) {
    const v = await this.venueOf(ctx, venueId);
    const w = await this.writer.welcomeOf(v.id);
    return { text: w.text, updatedAt: w.updatedAt?.toISOString() ?? null, template: VENUE_WELCOME_TEMPLATE.fr, maxChars: this.tuning.venues.welcomeMessageMaxChars, visibleFrom: 'CONFIRMATION' as const };
  }

  /**
   * V5.7 (E30) : écrit (ou retire, `text: null`) le message d'accueil. Règles déterministes (longueur, lien, téléphone)
   * puis modération comme un message ; refus → 412 `WELCOME_MESSAGE_REJECTED {issue}`. Montré aux seules places
   * confirmées à partir de la confirmation (fiche Confirmation + message système du lieu dans le chat).
   */
  async setWelcome(ctx: VenuePartnerContext, venueId: string | undefined, b: { text: string | null }, commandId: string) {
    const text = b.text?.trim() ? b.text.trim() : null;
    const v = await this.venueOf(ctx, venueId);
    if (text) {
      const issue = welcomeMessageIssue(text, this.tuning.venues.welcomeMessageMaxChars);
      if (issue) throw Errors.precondition('WELCOME_MESSAGE_REJECTED', { issue });
      if (!this.moderation) throw new AppError('PROVIDER_UNAVAILABLE', 'Modération indisponible', { retryable: true, detailsSafe: { reason: 'MODERATION_UNAVAILABLE' } });
      const verdict = await this.moderation.moderate({ text, venueId: v.id, authorId: ctx.userId });
      if (verdict !== 'ALLOW') throw Errors.precondition('WELCOME_MESSAGE_REJECTED', { issue: 'MODERATION' });
    }
    return this.mutate(ctx, v.id, 'welcome_message_set', commandId, { length: text?.length ?? 0 }, async (scope) => {
      await this.writer.setWelcome(scope, v.id, text);
      return { text };
    });
  }

  /** Lieu du partenaire (sinon 404 identique : jamais d'information sur un lieu d'autrui). */
  private async venueOf(ctx: VenuePartnerContext, venueId: string | undefined): Promise<VenueFacts> {
    const id = venueId ?? ctx.venueIds[0];
    if (!id || !ctx.venueIds.includes(id)) throw Errors.notFound('Lieu');
    const v = await this.reads.venue(id);
    if (!v) throw Errors.notFound('Lieu');
    return v;
  }

  private venueRef(v: VenueFacts) {
    return { id: v.id, name: v.name, neighborhood: v.neighborhoodName };
  }

  async me(ctx: VenuePartnerContext): Promise<VenueMe> {
    const venues = await Promise.all(ctx.venueIds.map((id) => this.reads.venue(id)));
    return { userId: ctx.userId, displayName: ctx.displayName, venues: venues.filter((v): v is VenueFacts => !!v).map((v) => this.venueRef(v)), sessionExpiresAt: ctx.sessionExpiresAt.toISOString() };
  }

  /** Effectif de la semaine : tables Blowy des 8 prochains jours (et la soirée en cours). */
  async roster(ctx: VenuePartnerContext, venueId?: string): Promise<VenueRosterView> {
    const v = await this.venueOf(ctx, venueId);
    const now = this.clock.now();
    // V5.7 (E29) : semaine civile en cours + suivante (fuseau du lieu), tous les jours de créneaux — « aucune table » compris.
    const monday = mondayOfWeek(weekKeyOf(now.getTime(), v.timezone));
    const from = new Date(wallToUtc(monday, 0, v.timezone));
    const to = new Date(wallToUtc(monday + 14, 0, v.timezone));
    const outings = await this.reads.venueOutings(v.id, from, to);
    const code = (startsAt: Date) => (this.outings ? this.outings.venueCode(v.checkinSecretRef, startsAt) : '0000');
    const tables = outings.map((o) => projectVenueTable(o, now, code));
    const slotDays = new Set((await this.reads.templatesOf(v.neighborhoodId)).filter((t) => t.active).map((t) => t.isoWeekday));
    const dayOf = (iso: string) => localDayKey(new Date(iso).getTime(), v.timezone);
    const days = Array.from({ length: 14 }, (_, i) => monday + i)
      .map((d) => ({ date: new Date(d * 86_400_000).toISOString().slice(0, 10), isoWeekday: ((((d + 3) % 7) + 7) % 7) + 1 }))
      .filter((d) => slotDays.has(d.isoWeekday) || tables.some((t) => dayOf(t.startsAt) === d.date))
      .map((d) => ({ ...d, tables: tables.filter((t) => t.status !== 'CANCELLED' && dayOf(t.startsAt) === d.date).length }));
    const view = {
      venue: { ...this.venueRef(v), timezone: v.timezone },
      onCall: this.auth.onCall(),
      tablesPerSlot: v.tablesPerSlot,
      tables,
      days,
    };
    // Frontière stricte : un champ imprévu (âge, pet, identifiant…) fait échouer la réponse.
    return VenueRosterViewSchema.parse(view);
  }

  async schedule(ctx: VenuePartnerContext, venueId?: string): Promise<VenueScheduleView> {
    const v = await this.venueOf(ctx, venueId);
    const state = reduceVenuePartner(await this.store.load(null, v.id));
    const templates = await this.reads.templatesOf(v.neighborhoodId);
    const now = this.clock.now();
    return {
      venue: this.venueRef(v),
      onCall: this.auth.onCall(),
      cap: v.tablesPerSlot,
      capMax: VENUE_CAP_MAX,
      noticeHours: VENUE_NOTICE_HOURS,
      days: weeklySchedule(templates, v.activities, state, v.tablesPerSlot, this.tuning.outings.durationMinutes),
      closures: state.closures.filter((c) => c.date >= now.toISOString().slice(0, 10)).map((c) => ({ date: c.date, note: c.note })),
    };
  }

  private async mutate<P extends Record<string, unknown>, R>(ctx: VenuePartnerContext, venueId: string | undefined, operation: string, commandId: string, payload: P, handle: (scope: TxScope, v: VenueFacts, state: VenuePartnerState) => Promise<R>) {
    const v = await this.venueOf(ctx, venueId);
    const out = await this.bus.execute({
      actorId: ctx.userId,
      operation: `venue.${operation}`,
      commandId,
      payload: { venueId: v.id, ...payload },
      handle: async (scope) => {
        const state = reduceVenuePartner(await this.store.load(scope, v.id));
        const result = await handle(scope, v, state);
        await this.audit.record(scope, { actorUserId: ctx.userId, actorRole: VENUE_PARTNER_ROLE, action: `venue.${operation}`, targetType: 'Venue', targetId: v.id, reason: null, data: { commandId, ...payload }, requestId: ctx.requestId });
        return result;
      },
    });
    return { replayed: out.replayed, result: out.result };
  }

  setDay(ctx: VenuePartnerContext, venueId: string | undefined, b: { isoWeekday: number; open: boolean; tables?: number; note?: string | null }, commandId: string) {
    return this.mutate(ctx, venueId, 'day_set', commandId, { ...b }, async (scope, v, state) => {
      const tables = b.tables === undefined ? (state.days.get(b.isoWeekday)?.tables ?? null) : Math.min(b.tables, v.tablesPerSlot);
      const event: VenuePartnerEvent = { type: 'DAY_SET', isoWeekday: b.isoWeekday, open: b.open, tables, note: b.note === undefined ? (state.days.get(b.isoWeekday)?.note ?? null) : b.note };
      await this.store.append(scope, v.id, event, ctx.userId);
      const next = reduceVenuePartner(await this.store.load(scope, v.id));
      return applyVenuePolicy(this.writer, scope, v.id, next, v.tablesPerSlot);
    });
  }

  setCap(ctx: VenuePartnerContext, venueId: string | undefined, tables: number, commandId: string) {
    return this.mutate(ctx, venueId, 'cap_set', commandId, { tables }, async (scope, v, state) => {
      const cap = Math.max(1, Math.min(VENUE_CAP_MAX, tables));
      await this.writer.updateVenue(scope, v.id, { tablesPerSlot: cap });
      return { cap, ...(await applyVenuePolicy(this.writer, scope, v.id, state, cap)) };
    });
  }

  /**
   * Fermeture exceptionnelle d'un jour : les créneaux du jour passent à 0 ; une sortie déjà composée
   * ce jour-là est annulée `VENUE_UNAVAILABLE` (remboursée, signalée à ops dans l'audit).
   */
  addClosure(ctx: VenuePartnerContext, venueId: string | undefined, b: { date: string; note: string }, commandId: string) {
    return this.mutate(ctx, venueId, 'closure_added', commandId, { ...b }, async (scope, v, state) => {
      if (b.date < scope.now.toISOString().slice(0, 10)) throw Errors.precondition('CLOSURE_IN_PAST');
      const cancelled: string[] = [];
      for (const o of await this.writer.activeOutingsOn(scope, v.id, b.date)) {
        if (!this.outings) throw new AppError('NOT_CONFIGURED', 'Sorties : service non branché');
        if (await this.outings.cancelOuting(scope, { outingId: o.id, reason: 'VENUE_UNAVAILABLE' })) cancelled.push(o.id);
      }
      await this.store.append(scope, v.id, { type: 'CLOSURE_ADDED', date: b.date, note: b.note }, ctx.userId);
      const next = reduceVenuePartner(await this.store.load(scope, v.id));
      void state;
      await applyVenuePolicy(this.writer, scope, v.id, next, v.tablesPerSlot, b.date);
      if (cancelled.length) {
        await this.audit.record(scope, { actorUserId: ctx.userId, actorRole: VENUE_PARTNER_ROLE, action: 'venue.closure_cancelled_outings', targetType: 'Venue', targetId: v.id, reason: b.note, data: { date: b.date, outingIds: cancelled, opsAttention: true }, requestId: ctx.requestId });
      }
      return { cancelledOutings: cancelled.length };
    });
  }

  async contract(ctx: VenuePartnerContext, venueId?: string): Promise<VenueContractView> {
    const v = await this.venueOf(ctx, venueId);
    const state = reduceVenuePartner(await this.store.load(null, v.id));
    const c = await this.store.contractOf(v.id);
    return {
      venue: { ...this.venueRef(v), address: `${v.addressLine}, ${v.venueCity} ${v.postalCode.startsWith('75') ? `${Number(v.postalCode.slice(3))}e` : ''}`.trim().replace(/,\s*$/, '') },
      onCall: this.auth.onCall(),
      version: VENUE_CONTRACT_VERSION,
      clauses: [...VENUE_CONTRACT_CLAUSES],
      signed: state.contract ? { at: state.contract.signedAt.toISOString(), signerName: state.contract.signerName, version: state.contract.version } : null,
      // V5.6 (E15) : contrat bilatéral — en vigueur quand le lieu ET Blowy ont signé la version courante.
      countersigned: c?.blowySignedAt ? { at: c.blowySignedAt.toISOString(), signerName: c.blowySignerName ?? 'Blowy' } : null,
      inForce: !!(c?.blowySignedAt && c.contractVersion === VENUE_CONTRACT_VERSION && state.contract?.version === VENUE_CONTRACT_VERSION),
    };
  }

  sign(ctx: VenuePartnerContext, venueId: string | undefined, b: { version: string; signerName: string }, commandId: string) {
    return this.mutate(ctx, venueId, 'contract_signed', commandId, { ...b }, async (scope, v) => {
      if (b.version !== VENUE_CONTRACT_VERSION) throw Errors.precondition('CONTRACT_VERSION_OUTDATED', { current: VENUE_CONTRACT_VERSION });
      await this.store.append(scope, v.id, { type: 'CONTRACT_SIGNED', version: b.version, signerName: b.signerName, userId: ctx.userId }, ctx.userId);
      return { version: b.version };
    });
  }

  /** Relevé mensuel : agrégé par sortie, sans prénom ni financement individuel. */
  async statement(ctx: VenuePartnerContext, venueId: string | undefined, period: string | undefined): Promise<VenueStatementView> {
    const v = await this.venueOf(ctx, venueId);
    // V5.7 (E28) : mois civil du fuseau du lieu.
    const p = period ?? periodOf(this.clock.now(), v.timezone);
    const rows = this.ledger ? (await this.ledger.forVenue(v.id)).filter((r) => periodOf(r.at, v.timezone) === p) : [];
    const byOuting = new Map<string, { seats: Set<string>; amountCents: number; blowy: boolean; absences: Set<string>; emergencies: Set<string>; safety: Set<string> }>();
    for (const r of rows) {
      const cur = byOuting.get(r.outingId) ?? { seats: new Set<string>(), amountCents: 0, blowy: false, absences: new Set<string>(), emergencies: new Set<string>(), safety: new Set<string>() };
      cur.amountCents += r.amountCents;
      if (r.cause === 'BLOWY_CANCELLED') cur.blowy = true;
      if (r.cause === 'NO_SHOW' || r.cause === 'LATE_CANCEL') cur.absences.add(r.seatId);
      if (r.cause === 'EMERGENCY') cur.emergencies.add(r.seatId);
      if (r.cause === 'SAFETY') cur.safety.add(r.seatId);
      if (r.cause === 'REVERSAL') {
        cur.absences.delete(r.seatId);
        cur.emergencies.delete(r.seatId);
        cur.safety.delete(r.seatId);
      }
      if (r.cause !== 'REVERSAL') cur.seats.add(r.seatId);
      else cur.seats.delete(r.seatId);
      byOuting.set(r.outingId, cur);
    }
    // V5.10 (jury tour 11) : ligne « activités » — activité prépayée reversée pour chaque place confirmée, honorée ou non.
    const acts = this.ledger?.activitiesForVenue ? (await this.ledger.activitiesForVenue(v.id)).filter((r) => periodOf(r.at, v.timezone) === p) : [];
    const actsByOuting = new Map<string, { seats: number; cents: number }>();
    for (const r of acts) {
      const cur = actsByOuting.get(r.outingId) ?? { seats: 0, cents: 0 };
      actsByOuting.set(r.outingId, { seats: cur.seats + 1, cents: cur.cents + r.amountCents });
      if (!byOuting.has(r.outingId)) byOuting.set(r.outingId, { seats: new Set(), amountCents: 0, blowy: false, absences: new Set(), emergencies: new Set(), safety: new Set() });
    }
    // V5.5 (D-067) : une ligne par soirée — y compris les soirées sans compensation du mois (places, présences).
    const summaries = await this.reads.outingSummaries(v.id, p, v.timezone);
    // Une sortie annulée n'apparaît que si Blowy l'a annulée après la confirmation (ligne de compensation).
    for (const [id, sm] of summaries) if (!byOuting.has(id) && !sm.cancelled) byOuting.set(id, { seats: new Set(), amountCents: 0, blowy: false, absences: new Set(), emergencies: new Set(), safety: new Set() });
    const lines = [...byOuting]
      .map(([outingId, l]) => {
        const sm = summaries.get(outingId);
        return { outingId, startsAt: sm?.startsAt.toISOString() ?? null, reservedSeats: sm?.reserved ?? l.seats.size, attended: sm?.attended ?? 0, absences: l.absences.size, emergencies: l.emergencies.size, safetyExits: l.safety.size, seats: l.seats.size, amountCents: l.amountCents, ...(l.blowy ? { cancelledByBlowy: true as const } : {}), ...(sm?.duoTable ? { duoTable: true as const } : {}), ...(actsByOuting.has(outingId) ? { activities: actsByOuting.get(outingId)!.seats, activitiesCents: actsByOuting.get(outingId)!.cents } : {}) };
      })
      .sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? ''));
    // Régime : celui figé sur les reversements du mois, sinon le régime actuel du lieu (TTC par défaut).
    const activitiesTaxBasis = acts[0]?.taxBasis ?? v.activityTaxBasis ?? 'TTC';
    return { venue: this.venueRef(v), onCall: this.auth.onCall(), period: p, taxBasis: 'HT' as const, totalCents: lines.reduce((s, l) => s + l.amountCents, 0), lines, activitiesTotalCents: acts.reduce((s, r) => s + r.amountCents, 0), activitiesTaxBasis };
  }

  /**
   * « Signaler un participant » (V5.4 C.12) depuis l'espace lieu : droits `venue_partner` sur CE lieu (garde
   * dédiée + `venueOf`), sortie du lieu, à partir de la confirmation seulement, désignation par le PRÉNOM
   * (seule donnée que le lieu possède) ; 404 identique sinon. Le dossier part à l'équipe (file ops/trust) par
   * l'outbox `venue.participant_reported` (identifiants seulement, ni prénom ni note).
   */
  reportIncident(ctx: VenuePartnerContext, venueId: string | undefined, b: { outingId: string; firstName: string; motive: 'BEHAVIOR' | 'REFUSED_TO_PAY' | 'OTHER'; note: string }, commandId: string) {
    return this.mutate(ctx, venueId, 'incident_reported', commandId, { ...b }, async (scope, v) => {
      const seat = await this.reads.seatOfFirstName(v.id, b.outingId, b.firstName, scope.now);
      if (!seat) throw Errors.notFound('Participant');
      const id = this.random.uuid();
      await this.store.append(scope, v.id, { type: 'INCIDENT_REPORTED', id, outingId: b.outingId, firstName: b.firstName.trim(), motive: b.motive, note: b.note, seatId: seat.seatId, userId: seat.userId }, ctx.userId);
      await scope.outbox.emit({ topic: 'venue.participant_reported', aggregateType: 'Venue', aggregateId: v.id, payload: { incidentId: id, venueId: v.id, outingId: b.outingId, seatId: seat.seatId, motive: b.motive } });
      return { id };
    });
  }

  requestPhoto(ctx: VenuePartnerContext, venueId: string | undefined, note: string, commandId: string) {
    return this.mutate(ctx, venueId, 'photo_change_requested', commandId, { note }, async (scope, v) => {
      await this.store.append(scope, v.id, { type: 'PHOTO_CHANGE_REQUESTED', note }, ctx.userId);
      return { requested: true };
    });
  }
}
