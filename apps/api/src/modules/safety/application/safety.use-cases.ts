/**
 * Commandes et requêtes du module `safety` (spec-v5 §2.9, §7.4 ; V5.1 G.19–21).
 *  - Liens ange gardien : création (jeton aléatoire 32 o rendu UNE fois, seule l'empreinte SHA-256
 *    est stockée — y compris dans la mémoire d'idempotence), liste sans URL, révocation.
 *  - « Tout va bien », alerte « besoin d'aide » (dossier SAFETY prioritaire, réponse humaine < 1 h
 *    pendant les créneaux, Web Push au proche abonné), résolution par la personne.
 *  - Page publique du proche : 404 IDENTIQUE pour inconnu / expiré / révoqué / sujet annulé.
 * Toutes les commandes passent par le CommandBus (idempotence, transaction, verrou `users`).
 */
import { createHash } from 'node:crypto';
import type { GuardianSubjectKind } from '@blowy/domain';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import { userRoom, type EventPublisher } from '../../../shared/application/event-publisher.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { HUMAN_RESPONSE_MINUTES, guardianWindow, inWindow, linkServable, normalizeLabel, projectGuardianPage, supportStaffed, type SafetyTuningSlice, type SubjectFacts } from '../domain/guardian.js';
import type { OutingSafetyPort } from '../../../shared/application/ports/outing-safety.port.js';
import type { GuardianPushSender, SafetyCaseSink, SafetyRateLimiter, SafetyRepository, SubjectReader } from './ports/safety.ports.js';

export interface Subject {
  kind: GuardianSubjectKind;
  id: string;
}

export const tokenHashOf = (token: string) => createHash('sha256').update(token).digest('hex');
const EMERGENCY = ['112', '17'] as const;

export class SafetyUseCases {
  constructor(
    private readonly repo: SafetyRepository,
    private readonly subjects: SubjectReader,
    private readonly cases: SafetyCaseSink,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly events: EventPublisher,
    private readonly tuning: SafetyTuningSlice,
    private readonly webOrigin: string,
    private readonly outings: OutingSafetyPort | null = null,
  ) {}

  /** Sujet du propriétaire, sinon 404 neutre (anti-IDOR : objet d'autrui = introuvable). */
  private async subjectOf(userId: string, s: Subject, scope?: TxScope | null): Promise<SubjectFacts> {
    const f = await this.subjects.subject(userId, s.kind, s.id, scope ?? null);
    if (!f || f.ownerUserId !== userId) throw Errors.notFound('Sortie');
    return f;
  }

  // ------------------------------------------------------------------ liens gardien
  async createLink(userId: string, commandId: string, req: { subject: Subject; label?: string | undefined }) {
    let token: string | null = null;
    const { result, replayed } = await this.bus.execute({
      actorId: userId,
      operation: 'safety.guardian_link.create',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const s = await this.subjectOf(userId, req.subject, scope);
        if (!s.confirmed || s.cancelled) throw Errors.precondition('SUBJECT_NOT_CONFIRMED');
        const w = guardianWindow(s, this.tuning);
        if (scope.now >= w.expiresAt) throw Errors.precondition('SUBJECT_NOT_ACTIVE');
        const active = await this.repo.countActiveLinks(scope, userId, s.kind, s.id, scope.now);
        if (active >= this.tuning.maxGuardianLinksPerSubject) throw new AppError('CONFLICT', 'Trop de liens actifs', { detailsSafe: { reason: 'GUARDIAN_LINK_LIMIT', max: this.tuning.maxGuardianLinksPerSubject } });
        // 32 octets d'aléa → base64url (43 car.) ; seule l'empreinte est persistée.
        token = Buffer.from(this.random.hex(32), 'hex').toString('base64url');
        const id = this.random.uuid();
        await this.repo.createLink(scope, { id, ownerUserId: userId, subjectKind: s.kind, subjectId: s.id, tokenHash: tokenHashOf(token), label: normalizeLabel(req.label), ...w });
        // Le résultat mémorisé (idempotence) ne contient JAMAIS le jeton.
        return { id, activeFrom: w.activeFrom.toISOString(), expiresAt: w.expiresAt.toISOString() };
      },
    });
    // Rejeu d'une même clé : le jeton n'existe plus nulle part en clair → on ne le recrée pas.
    if (replayed || !token) throw new AppError('CONFLICT', 'Lien déjà créé : révoque-le et crée-en un autre si tu as perdu l’URL', { detailsSafe: { reason: 'GUARDIAN_LINK_ALREADY_ISSUED', id: result.id } });
    return { ...result, url: `${this.webOrigin}/ange/${token}` };
  }

  async listLinks(userId: string, s: Subject) {
    await this.subjectOf(userId, s);
    const now = this.clock.now();
    const rows = await this.repo.listLinks(userId, s.kind, s.id);
    return { items: rows.map((l) => ({ id: l.id, label: l.label, createdAt: l.createdAt.toISOString(), lastViewedAt: l.lastViewedAt?.toISOString() ?? null, revoked: !!l.revokedAt || now >= l.expiresAt })) };
  }

  async revokeLink(userId: string, commandId: string, linkId: string) {
    await this.bus.execute({
      actorId: userId,
      operation: 'safety.guardian_link.revoke',
      commandId,
      payload: { linkId },
      handle: async (scope) => {
        const l = await this.repo.loadLink(scope, linkId);
        if (!l || l.ownerUserId !== userId) throw Errors.notFound('Lien');
        await this.repo.revokeLink(scope, linkId, 'OWNER');
        return { ok: true };
      },
    });
  }

  // ------------------------------------------------------------------ « tout va bien »
  async ok(userId: string, commandId: string, subject: Subject) {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'safety.ok',
      commandId,
      payload: { subject },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const s = await this.subjectOf(userId, subject, scope);
        if (!s.confirmed || s.cancelled || !inWindow(guardianWindow(s, this.tuning), scope.now)) throw Errors.precondition('SUBJECT_NOT_ACTIVE');
        await this.repo.addOk(scope, { id: this.random.uuid(), userId, subjectKind: s.kind, subjectId: s.id });
        await scope.outbox.emit({ topic: 'safety.ok_signaled', aggregateType: 'User', aggregateId: userId, payload: { subjectKind: s.kind, subjectId: s.id } });
        return { at: scope.now.toISOString() };
      },
    });
    return result;
  }

  // ------------------------------------------------------------------ alerte « besoin d'aide »
  /**
   * Jamais bloquée par le limiteur global (route exclue) ; limite dédiée `[T] safety.alertsPerHour`.
   * Fonctionne même hors fenêtre et même si la place a été retirée : on ne refuse JAMAIS une demande
   * d'aide d'une personne qui a (eu) une place confirmée dans ce sujet.
   */
  async raiseAlert(userId: string, commandId: string, req: { subject: Subject; position?: { lat: number; lng: number; accuracyM: number } | undefined }) {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'safety.alert.raise',
      commandId,
      // La position n'entre jamais dans l'empreinte mémorisée : seulement le fait qu'elle soit jointe.
      payload: { subject: req.subject, withPosition: !!req.position },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const s = await this.subjectOf(userId, req.subject, scope);
        if (!s.confirmed && !s.cancelled) throw Errors.notFound('Sortie');
        const recent = await this.repo.alertsCountSince(scope, userId, new Date(scope.now.getTime() - 3_600_000));
        if (recent >= this.tuning.alertsPerHour) throw new AppError('RATE_LIMITED', 'Trop d’alertes en une heure : appelle le 112', { detailsSafe: { reason: 'ALERT_RATE_LIMITED', emergencyNumbers: [...EMERGENCY] } });
        const id = this.random.uuid();
        const position = req.position ? { lat: req.position.lat, lng: req.position.lng, accuracyM: Math.round(req.position.accuracyM) } : null;
        await this.repo.createAlert(scope, { id, userId, subjectKind: s.kind, subjectId: s.id, position, positionPurgeAfter: position ? new Date(scope.now.getTime() + this.tuning.alertPositionRetentionHours * 3_600_000) : null });
        // File staff prioritaire : dossier SAFETY_ALERT, priorité 1, échéance = engagement affiché.
        const caseId = await this.cases.open(scope, { subjectType: 'SAFETY_ALERT', subjectId: id, subjectUserId: userId, reasonCode: 'SAFETY_ALERT', priority: 1, dueInMinutes: HUMAN_RESPONSE_MINUTES });
        await this.repo.setAlertCase(scope, id, caseId);
        // Effets hors transaction : Web Push au proche abonné, notification SAFETY (T8), accusé WS.
        await scope.outbox.emit({ topic: 'safety.alert_raised', aggregateType: 'SafetyAlert', aggregateId: id, payload: { alertId: id, userId, subjectKind: s.kind, subjectId: s.id } });
        return { alertId: id };
      },
    });
    return { alertId: result.alertId, emergencyNumbers: [...EMERGENCY], humanResponseMinutes: HUMAN_RESPONSE_MINUTES };
  }

  async resolveAlert(userId: string, commandId: string, alertId: string) {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'safety.alert.resolve',
      commandId,
      payload: { alertId, status: 'SAFE' },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const a = await this.repo.loadAlert(scope, alertId);
        if (!a || a.userId !== userId) throw Errors.notFound('Alerte');
        if (a.status === 'OPEN') {
          await this.repo.resolveAlert(scope, alertId, 'SAFE', null);
          // La chronologie du proche affiche « tout va bien » après l'alerte.
          await this.repo.addOk(scope, { id: this.random.uuid(), userId, subjectKind: a.subjectKind, subjectId: a.subjectId });
          // Le dossier reste ouvert pour le suivi staff (rappel « tout va bien ? ») : il n'est pas clos ici.
          await scope.outbox.emit({ topic: 'safety.alert_resolved', aggregateType: 'SafetyAlert', aggregateId: alertId, payload: { alertId, userId, status: 'SAFE' } });
        }
        return { alertId, status: a.status === 'OPEN' ? ('SAFE' as const) : a.status };
      },
    });
    return result;
  }

  // ------------------------------------------------------------------ statut (app)
  async status(userId: string, s: Subject) {
    const f = await this.subjectOf(userId, s);
    const now = this.clock.now();
    const w = guardianWindow(f, this.tuning);
    const [links, oks, alerts] = await Promise.all([this.repo.countActiveLinks(null, userId, f.kind, f.id, now), this.repo.oks(userId, f.kind, f.id), this.repo.alertsOf(userId, f.kind, f.id)]);
    const open = alerts.filter((a) => a.status === 'OPEN').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    const lastOk = oks.filter((d) => d <= now).sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      subject: { kind: f.kind, id: f.id },
      activeFrom: w.activeFrom.toISOString(),
      expiresAt: w.expiresAt.toISOString(),
      active: f.confirmed && !f.cancelled && inWindow(w, now),
      support: { humanResponseMinutes: HUMAN_RESPONSE_MINUTES, staffedNow: supportStaffed(w, now) },
      activeGuardianLinks: links,
      maxGuardianLinks: this.tuning.maxGuardianLinksPerSubject,
      ...(lastOk ? { lastOkAt: lastOk.toISOString() } : {}),
      ...(open ? { openAlert: { alertId: open.id, at: open.createdAt.toISOString(), acknowledged: !!open.ackAt } } : {}),
      emergencyNumbers: [...EMERGENCY],
    };
  }

  // ------------------------------------------------------------------ page publique du proche
  private async servable(token: string) {
    const link = await this.repo.linkByTokenHash(tokenHashOf(token));
    const now = this.clock.now();
    if (!link) return null;
    const subject = await this.subjects.subject(link.ownerUserId, link.subjectKind, link.subjectId);
    if (!linkServable(link, subject, now) || !subject) return null;
    return { link, subject, now };
  }

  /** `GET /v1/public/guardian/:token` — 404 identique pour tout jeton non servable. */
  async page(token: string, limiter: SafetyRateLimiter | null) {
    if (limiter && (await limiter.hit(`guardian:${tokenHashOf(token).slice(0, 16)}`, 60).catch(() => 0)) > 120) throw new AppError('RATE_LIMITED', 'Trop de requêtes');
    const r = await this.servable(token);
    if (!r) throw Errors.notFound('Lien');
    const [oks, alerts] = await Promise.all([this.repo.oks(r.link.ownerUserId, r.link.subjectKind, r.link.subjectId), this.repo.alertsOf(r.link.ownerUserId, r.link.subjectKind, r.link.subjectId)]);
    await this.repo.touchLink(r.link.id, r.now);
    return projectGuardianPage({ link: r.link, subject: r.subject, oks, alerts, now: r.now });
  }

  /** `POST /v1/public/guardian/:token/push` — seul l'endpoint est gardé (push sans contenu). */
  async subscribePush(token: string, endpoint: string, sender: GuardianPushSender) {
    const r = await this.servable(token);
    if (!r) throw Errors.notFound('Lien');
    if (!sender.configured) throw new AppError('NOT_CONFIGURED', 'Notifications indisponibles', { detailsSafe: { reason: 'WEB_PUSH_NOT_CONFIGURED' } });
    if (!/^https:\/\//.test(endpoint)) throw Errors.validation({ reason: 'ENDPOINT_NOT_HTTPS' });
    await this.repo.upsertPush(r.link.id, endpoint, new Date(r.link.expiresAt.getTime() + this.tuning.guardianPushRetentionHours * 3_600_000), r.now);
    return { ok: true };
  }

  // ------------------------------------------------------------------ « je pars, mal à l'aise » (V5.3 B.9)
  /**
   * Toujours possible (même après le début ou le check-in), sans pénalité, remboursé. Le staff est
   * prévenu (dossier) ; le gardien seulement si la personne le choisit ; 3 départs → recontact humain.
   */
  async leave(userId: string, commandId: string, req: { subject: Subject; notifyGuardian: boolean }) {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'safety.uneasy_leave',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const s = await this.subjectOf(userId, req.subject, scope);
        if (!this.outings || s.kind !== 'OUTING') throw Errors.notFound('Sortie');
        const r = await this.outings.leaveForSafety(scope, { userId, outingId: s.id });
        if (!r) throw Errors.precondition('SUBJECT_NOT_ACTIVE');
        await this.repo.upsertUneasyLeave(scope, { id: this.random.uuid(), userId, outingId: s.id, seatId: r.seatId, notifyGuardian: req.notifyGuardian });
        const notified = req.notifyGuardian && (await this.repo.countActiveLinks(scope, userId, s.kind, s.id, scope.now)) > 0;
        if (notified) await scope.outbox.emit({ topic: 'safety.guardian_notify', aggregateType: 'User', aggregateId: userId, payload: { userId, subjectKind: s.kind, subjectId: s.id, reason: 'LEFT' } });
        return { left: true as const, guardianNotified: notified, humanResponseMinutes: HUMAN_RESPONSE_MINUTES };
      },
    });
    return result;
  }

  /** Consommateur `outing.seat_cancelled` (SAFETY_EXIT) : trace + message staff ; 3ᵉ départ → recontact humain. */
  async onUneasyLeave(scope: TxScope, i: { userId: string; outingId: string; seatId: string }) {
    await this.repo.upsertUneasyLeave(scope, { id: this.random.uuid(), ...i, notifyGuardian: false });
    await this.cases.open(scope, { subjectType: 'OUTING', subjectId: i.seatId, subjectUserId: i.userId, reasonCode: 'UNEASY_LEAVE', priority: 2, dueInMinutes: HUMAN_RESPONSE_MINUTES });
    if ((await this.repo.uneasyLeaveCount(scope, i.userId)) >= 3) {
      await this.cases.open(scope, { subjectType: 'USER', subjectId: i.userId, subjectUserId: i.userId, reasonCode: 'UNEASY_LEAVE_RECONTACT', priority: 2, dueInMinutes: 24 * 60 });
    }
  }

  /** Effet outbox `safety.alert_raised` : Web Push sans contenu aux proches abonnés. */
  async notifyGuardians(alertId: string, sender: GuardianPushSender) {
    const a = await this.repo.loadAlert(null, alertId);
    if (!a) return 0;
    return this.notifyFor(a.userId, a.subjectKind, a.subjectId, sender);
  }

  /** Web Push sans contenu à tous les proches abonnés d'un sujet (alerte, départ choisi). */
  async notifyFor(userId: string, subjectKind: GuardianSubjectKind, subjectId: string, sender: GuardianPushSender) {
    if (!sender.configured) return 0;
    const subs = await this.repo.pushEndpointsFor(userId, subjectKind, subjectId, this.clock.now());
    let sent = 0;
    for (const s of subs) {
      const r = await sender.send(s.endpoint);
      if (r === 'GONE') await this.repo.deletePush(s.linkId);
      if (r === 'SENT') sent++;
    }
    return sent;
  }

  /** Consommateur `safety.alert_raised` (transactionnel) : accusé de réception WS à l'auteur. */
  async ack(scope: TxScope, alertId: string) {
    const a = await this.repo.loadAlert(scope, alertId);
    if (!a || a.ackAt) return;
    await this.repo.ackAlert(scope, alertId);
    await this.events.publish(scope, { sourceEventId: this.random.uuid(), type: 'safety.alert_ack', aggregateId: alertId, room: userRoom, recipients: [{ userId: a.userId, payload: { alertId } }] });
  }

  // ------------------------------------------------------------------ révocations (consommateurs)
  revokeForSeat(scope: TxScope, ownerUserId: string, outingId: string) {
    return this.repo.revokeLinksWhere(scope, { ownerUserId, subjectKind: 'OUTING', subjectId: outingId }, 'SEAT_ENDED');
  }
  revokeForOuting(scope: TxScope, outingId: string) {
    return this.repo.revokeLinksWhere(scope, { subjectKind: 'OUTING', subjectId: outingId }, 'SUBJECT_CANCELLED');
  }
  revokeForUser(scope: TxScope, userId: string) {
    return this.repo.revokeLinksWhere(scope, { ownerUserId: userId }, 'ACCOUNT_DELETED');
  }
}
