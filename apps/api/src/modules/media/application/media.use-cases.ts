/**
 * Use cases médias (§10, P-5.4, P-5.5, §9.2, §9.3).
 *
 * Flux : CreateUpload (session liée à un usage, TTL 15 min) → PUT octets (quarantaine privée,
 * taille bornée) → Finalize (type RÉEL par signature, SVG/actifs refusés, décodage borné,
 * rotation, retrait EXIF/GPS, dérivés distincts) → traitement asynchrone (modération image,
 * vision mission) → READY | REJECTED | revue. Accès : ACL à CHAQUE lecture, jeton court
 * révocable, no-store. Aucun téléchargement d'URL fournie par l'utilisateur.
 */
import type { OutingRevealReader } from '../../../shared/application/ports/outing-photos.port.js';
import { createHash } from 'node:crypto';
import { MISSIONS } from '@blowy/content';
import type { ModerationPipeline } from '@blowy/ai';
import { MissionAssessmentSchema, sha256, type MissionAssessment } from '@blowy/ai';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import type { AiServices, AiTaskQueue } from '../../../shared/application/ports/ai.port.js';
import type { ObjectStorage } from '../../../shared/application/ports/object-storage.port.js';
import type { TxScope, UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { LoggerPort } from '../../../shared/application/logger.port.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { relationshipDay } from '../../relationships/domain/relationship-day.js';
import { capabilitiesOf } from '../../relationships/domain/capabilities.js';
import { LIMITS, RETENTION_DAYS, RETENTION_VERSION, decideAccess, kindOf, purgeAfterFor, sniff, type MediaPurpose, type MediaVariant } from '../domain/media-policy.js';
import type { AudioProbe, ImageProcessor, MediaRepository, MediaRow, RelationFacts } from './ports/media.ports.js';

export const MEDIA_TASKS = { PROCESS_IMAGE: 'media.process_image', ASSESS_PROOF: 'media.assess_proof' } as const;

const VARIANT_KIND: Record<Exclude<MediaVariant, 'audio'>, MediaRow['derivatives'][number]['kind']> = { thumbnail: 'THUMBNAIL', normalized: 'NORMALIZED', blurred: 'BLURRED', blurred_medium: 'BLURRED_MEDIUM' };

export function toMediaView(a: MediaRow, proof: Awaited<ReturnType<MediaRepository['proofByMedia']>>) {
  const variants: MediaVariant[] = a.purpose === 'VOICE_MESSAGE' ? (a.status === 'READY' ? ['audio'] : []) : a.derivatives.map((d) => (Object.entries(VARIANT_KIND).find(([, k]) => k === d.kind)?.[0] as MediaVariant | undefined)).filter((v): v is MediaVariant => !!v);
  const asmt = proof?.assessment as Partial<MissionAssessment> | null | undefined;
  return {
    id: a.id,
    purpose: a.purpose,
    status: a.status,
    reasonCode: a.rejectReason,
    visibility: a.visibility,
    width: a.width,
    height: a.height,
    durationMs: a.durationMs,
    variants,
    createdAt: a.createdAt.toISOString(),
    purgeAfter: a.purgeAfter?.toISOString() ?? null,
    missionProof: proof
      ? { missionKey: proof.missionKey, status: proof.status, visibleEvidence: asmt?.visibleEvidence ?? [], missingEvidence: asmt?.missingEvidence ?? [], canRetry: proof.status === 'UNCERTAIN' || proof.status === 'INCONSISTENT' }
      : null,
  };
}

export class CreateUploadUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: MediaRepository,
    private readonly random: RandomSource,
    private readonly publicUrl: string,
    private readonly clock: Clock,
  ) {}
  async execute(userId: string, commandId: string, req: { purpose: MediaPurpose; mimeType: string; bytes: number; relationshipId?: string | undefined; missionKey?: string | undefined }) {
    const kind = kindOf(req.purpose);
    if (kind === 'image' && !req.mimeType.startsWith('image/')) throw Errors.validation({ reason: 'MIME_PURPOSE_MISMATCH' });
    if (kind === 'voice' && !req.mimeType.startsWith('audio/')) throw Errors.validation({ reason: 'MIME_PURPOSE_MISMATCH' });
    const max = kind === 'voice' ? LIMITS.voice.maxBytes : LIMITS.image.maxBytes;
    if (req.bytes > max) throw Errors.precondition('TOO_LARGE', { maxBytes: max });
    if (req.purpose === 'MISSION_PROOF' && !MISSIONS.some((m) => m.id === req.missionKey)) throw Errors.validation({ reason: 'UNKNOWN_MISSION' });
    let contextId: string | null = null;
    if (req.relationshipId) {
      const f = await this.repo.relationFacts(null, req.relationshipId, this.clock.now());
      if (!f || !f.activeParticipants.includes(userId) || f.status === 'ENDED') throw Errors.notFound('Relation');
      contextId = f.id;
    }
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'media.create_upload',
      commandId,
      payload: req,
      handle: async (scope) => {
        const id = this.random.uuid();
        const expiresAt = new Date(scope.now.getTime() + LIMITS.uploadSessionTtlMs);
        await this.repo.create(scope, { id, ownerUserId: userId, purpose: req.purpose, storageKey: `quarantine/${userId}/${id}`, declaredMime: req.mimeType, maxBytes: Math.min(max, req.bytes), contextId, retentionClass: req.purpose, retentionVersion: RETENTION_VERSION, uploadExpiresAt: expiresAt });
        if (req.purpose === 'MISSION_PROOF') {
          // Horodatage SERVEUR d'acceptation du dépôt (jour de relation figé, même si l'analyse finit demain).
          const tz = contextId ? ((await this.repo.relationFacts(scope, contextId, scope.now))?.timezone ?? 'UTC') : 'UTC';
          await this.repo.createProof(scope, { id: this.random.uuid(), mediaId: id, userId, contextId, missionKey: req.missionKey!, submittedAt: scope.now, serverDay: relationshipDay(scope.now, tz) });
        }
        return { mediaId: id, uploadUrl: `${this.publicUrl}/v1/media/uploads/${id}`, method: 'PUT' as const, maxBytes: Math.min(max, req.bytes), expiresAt: expiresAt.toISOString() };
      },
    });
    return result;
  }
}

export class ReceiveUploadUseCase {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: ObjectStorage,
    private readonly clock: Clock,
  ) {}
  async execute(userId: string, mediaId: string, body: Buffer) {
    const a = await this.repo.load(null, mediaId);
    if (!a || a.ownerUserId !== userId) throw Errors.notFound('Média');
    if (a.status !== 'UPLOAD_PENDING') throw Errors.precondition('UPLOAD_CLOSED');
    if (!a.uploadExpiresAt || a.uploadExpiresAt <= this.clock.now()) throw Errors.precondition('UPLOAD_EXPIRED');
    if (body.length === 0) throw Errors.validation({ reason: 'EMPTY' });
    if (body.length > (a.maxBytes ?? 0)) throw Errors.precondition('TOO_LARGE', { maxBytes: a.maxBytes });
    // Quarantaine privée : jamais servie telle quelle à un tiers.
    await this.storage.put(a.storageKey, new Uint8Array(body), 'application/octet-stream');
    await this.repo.update(null, mediaId, { bytes: body.length, status: 'QUARANTINE' });
    return { ok: true };
  }
}

export class FinalizeMediaUseCase {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: ObjectStorage,
    private readonly images: ImageProcessor,
    private readonly audio: AudioProbe,
    private readonly queue: AiTaskQueue,
    private readonly clock: Clock,
    private readonly logger: LoggerPort,
  ) {}

  private async reject(a: MediaRow, reason: string) {
    await this.storage.delete(a.storageKey);
    await this.repo.update(null, a.id, { status: 'REJECTED', rejectReason: reason, purgeAfter: new Date(this.clock.now().getTime() + RETENTION_DAYS.REJECTED * 86_400_000) });
  }

  async execute(userId: string, mediaId: string) {
    const a = await this.repo.load(null, mediaId);
    if (!a || a.ownerUserId !== userId) throw Errors.notFound('Média');
    if (a.status !== 'QUARANTINE') return this.view(mediaId);
    const obj = await this.storage.get(a.storageKey);
    if (!obj) throw Errors.precondition('NO_CONTENT');
    const real = sniff(obj.bytes);
    const kind = kindOf(a.purpose);
    if (real === 'image/svg+xml') {
      await this.reject(a, 'ACTIVE_FORMAT_REFUSED');
      return this.view(mediaId);
    }
    if (kind === 'image') {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heif'].includes(real)) {
        await this.reject(a, 'UNSUPPORTED_TYPE');
        return this.view(mediaId);
      }
      let p;
      try {
        p = await this.images.process(obj.bytes);
      } catch (err) {
        this.logger.warn({ mediaId, err: (err as Error).message }, 'media_decode_failed');
        await this.reject(a, (err as Error).message === 'IMAGE_TOO_LARGE' ? 'TOO_LARGE' : 'UNDECODABLE');
        return this.view(mediaId);
      }
      const base = `media/${a.ownerUserId}/${a.id}`;
      for (const [variant, d] of [['normalized', p.normalized], ['thumbnail', p.thumbnail], ['blurred', p.blurred], ['blurred_medium', p.blurredMedium]] as const) {
        const key = `${base}/${variant}.jpg`;
        await this.storage.put(key, d.bytes, 'image/jpeg');
        await this.repo.addDerivative(a.id, { kind: VARIANT_KIND[variant], storageKey: key, width: d.width, height: d.height });
      }
      // L'original brut (EXIF/GPS) n'est pas conservé : seuls les dérivés nettoyés restent.
      await this.storage.delete(a.storageKey);
      await this.repo.update(null, a.id, { status: 'PROCESSING', mimeType: 'image/jpeg', width: p.normalized.width, height: p.normalized.height, sha256: p.sha256, finalizedAt: this.clock.now() });
      await this.queue.enqueue(MEDIA_TASKS.PROCESS_IMAGE, a.id, { mediaId: a.id });
      return this.view(mediaId);
    }
    // Voix : type réel + durée réelle.
    if (real !== 'audio/wav' && real !== 'audio/mp4') {
      await this.reject(a, 'UNSUPPORTED_TYPE');
      return this.view(mediaId);
    }
    const probe = await this.audio.probe(obj.bytes, real);
    if (!probe || probe.durationMs > LIMITS.voice.maxDurationMs || probe.durationMs < LIMITS.voice.minDurationMs) {
      await this.reject(a, probe ? 'DURATION_OUT_OF_RANGE' : 'UNDECODABLE');
      return this.view(mediaId);
    }
    const key = `media/${a.ownerUserId}/${a.id}/audio`;
    await this.storage.put(key, obj.bytes, real);
    await this.storage.delete(a.storageKey);
    // Le vocal reste privé tant que son message n'est pas publié (ACL voiceDeliverable).
    await this.repo.update(null, a.id, { status: 'READY', mimeType: real, durationMs: probe.durationMs, sha256: sha256(obj.bytes), finalizedAt: this.clock.now(), purgeAfter: purgeAfterFor('VOICE_MESSAGE', this.clock.now()) });
    await this.repo.addDerivative(a.id, { kind: 'NORMALIZED', storageKey: key, width: null, height: null });
    return this.view(mediaId);
  }

  async view(mediaId: string) {
    const a = (await this.repo.load(null, mediaId))!;
    return toMediaView(a, await this.repo.proofByMedia(null, mediaId));
  }
}

/** Traitement asynchrone (file IA) : modération image puis vision mission. */
export class ProcessImageUseCase {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: ObjectStorage,
    private readonly ai: AiServices,
    private readonly pipeline: ModerationPipeline | null,
    private readonly queue: AiTaskQueue,
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly cases: { open(c: { subjectType: 'MEDIA' | 'MISSION_SUBMISSION'; subjectId: string; subjectUserId: string; reasonCode: string; priority: 1 | 2 | 3; restricted: boolean }): Promise<void> },
  ) {}

  async execute(mediaId: string) {
    const a = await this.repo.load(null, mediaId);
    if (!a || a.status !== 'PROCESSING') return;
    const norm = a.derivatives.find((d) => d.kind === 'NORMALIZED');
    const obj = norm ? await this.storage.get(norm.storageKey) : null;
    if (!obj) return;
    const purpose = a.purpose === 'VOICE_MESSAGE' ? 'CHAT_IMAGE' : a.purpose;
    // Selfie de vérification : jamais envoyé à l'IA généraliste (fournisseur spécialisé seulement).
    const outcome = a.purpose === 'VERIFICATION_SELFIE' || !this.pipeline ? null : await this.pipeline.moderateImage({ mediaId, ownerId: a.ownerUserId, contextId: a.contextId, bytes: obj.bytes, mime: 'image/jpeg', sha256: a.sha256 ?? sha256(obj.bytes), purpose });
    const now = this.clock.now();
    if (a.purpose !== 'VERIFICATION_SELFIE' && (!outcome || outcome.outcome === 'UNAVAILABLE')) {
      // Panne IA : jamais d'approbation implicite ; le média reste non publié, revue.
      await this.repo.update(null, mediaId, { rejectReason: 'PENDING_REVIEW' });
      await this.cases.open({ subjectType: 'MEDIA', subjectId: mediaId, subjectUserId: a.ownerUserId, reasonCode: 'CLASSIFICATION_UNAVAILABLE', priority: 3, restricted: false });
      return;
    }
    const decision = outcome?.outcome === 'DECIDED' ? outcome.decision : null;
    if (decision && decision.action !== 'ALLOW') {
      if (decision.action === 'REJECT') {
        for (const k of await this.repo.deleteDerivatives(mediaId)) await this.storage.delete(k);
        await this.repo.update(null, mediaId, { status: 'REJECTED', rejectReason: 'MODERATION', restricted: decision.restricted, purgeAfter: new Date(now.getTime() + RETENTION_DAYS.REJECTED * 86_400_000) });
      } else {
        await this.repo.update(null, mediaId, { rejectReason: 'PENDING_REVIEW', restricted: decision.restricted });
      }
      if (decision.caseRequired || decision.action !== 'REJECT') await this.cases.open({ subjectType: 'MEDIA', subjectId: mediaId, subjectUserId: a.ownerUserId, reasonCode: decision.reasonCode, priority: decision.priority, restricted: decision.restricted });
      return;
    }
    await this.repo.update(null, mediaId, { status: 'READY', rejectReason: null, purgeAfter: purgeAfterFor(a.purpose, now) });
    if (a.purpose === 'PROFILE_PHOTO') await this.repo.supersedeProfilePhotos(a.ownerUserId, a.id, new Date(now.getTime() + RETENTION_DAYS.PROFILE_PHOTO * 86_400_000));
    if (a.purpose === 'MISSION_PROOF') await this.queue.enqueue(MEDIA_TASKS.ASSESS_PROOF, a.id, { mediaId: a.id });
    void this.uow;
  }
}

/**
 * Vision preuve de mission (§9.3) : adéquation VISIBLE, distincte de la modération et de la
 * récompense. uncertain → refaire / revue. Validation → ÉVÉNEMENT UNIQUE `mission.proof_validated`
 * (clé d'unicité) via outbox ; aucune écriture d'XP ici. Revalidation de la relation au moment
 * de l'émission : relation terminée/bloquée → jamais réactivée pour un ancien gain.
 */
export class AssessMissionProofUseCase {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: ObjectStorage,
    private readonly ai: AiServices,
    private readonly uow: UnitOfWork,
    private readonly cases: { open(c: { subjectType: 'MEDIA' | 'MISSION_SUBMISSION'; subjectId: string; subjectUserId: string; reasonCode: string; priority: 1 | 2 | 3; restricted: boolean }): Promise<void> },
  ) {}

  async execute(mediaId: string) {
    const a = await this.repo.load(null, mediaId);
    const proof = await this.repo.proofByMedia(null, mediaId);
    if (!a || !proof || a.status !== 'READY' || proof.status !== 'PENDING') return;
    const mission = MISSIONS.find((m) => m.id === proof.missionKey);
    const norm = a.derivatives.find((d) => d.kind === 'NORMALIZED');
    const obj = norm ? await this.storage.get(norm.storageKey) : null;
    if (!mission || !obj) return;
    // Réutilisation exacte d'une ancienne preuve : revue (jamais une sanction automatique).
    const reused = a.sha256 ? (await this.repo.sameHashCount(a.ownerUserId, a.sha256, a.id)) > 0 : false;
    let asmt: MissionAssessment | null = null;
    if (this.ai.providers && !reused) {
      try {
        asmt = (
          await this.ai.runner.run({
            kind: 'vision.mission',
            provider: this.ai.providers.vision.name,
            promptVersion: 'mission-vision-2026.11.0',
            subject: { type: 'MISSION_SUBMISSION', id: proof.id },
            userId: a.ownerUserId,
            contextId: proof.contextId,
            contentHash: a.sha256 ?? sha256(obj.bytes),
            accessScope: `mission:${mission.id}`,
            cacheTtlMs: 0,
            call: (o) => this.ai.providers!.vision.assess({ missionKey: mission.id, criteria: mission.criteria, image: { bytes: obj.bytes, mime: 'image/jpeg', width: a.width ?? 1, height: a.height ?? 1 } }, o),
            validate: (v) => MissionAssessmentSchema.parse(v),
          })
        ).value;
      } catch {
        asmt = null;
      }
    }
    const status = reused ? 'HUMAN_REVIEW' : !asmt ? 'HUMAN_REVIEW' : asmt.status === 'consistent' && !asmt.requiresReview && asmt.confidenceSignal >= 0.7 ? 'CONSISTENT' : asmt.status === 'inconsistent' ? 'INCONSISTENT' : 'UNCERTAIN';
    await this.uow.run(async (scope) => {
      await this.repo.updateProof(scope, proof.id, { status, assessment: asmt ? (asmt as unknown as Record<string, unknown>) : { reasonCode: reused ? 'REUSED_PROOF' : 'ANALYSIS_UNAVAILABLE' }, promptVersion: 'mission-vision-2026.11.0', decidedAt: scope.now });
      if (status === 'CONSISTENT') await emitProofValidated(this.repo, scope, proof.id);
    });
    if (status === 'HUMAN_REVIEW') await this.cases.open({ subjectType: 'MISSION_SUBMISSION', subjectId: proof.id, subjectUserId: a.ownerUserId, reasonCode: reused ? 'REUSED_PROOF' : 'ANALYSIS_UNAVAILABLE', priority: 3, restricted: false });
  }
}

/** Émission UNIQUE de l'événement de récompense (consommé par le module missions). */
export async function emitProofValidated(repo: MediaRepository, scope: TxScope, proofId: string) {
  const p = (await repo.loadProof(scope, proofId))!;
  const rewardKey = `mission-proof:${p.userId}:${p.missionKey}:${p.serverDay}`;
  if (!(await repo.claimReward(scope, proofId, rewardKey))) return false;
  // Autorisation au moment de l'émission : relation encore ouverte, sinon gain personnel seulement.
  let contextId = p.contextId;
  if (contextId) {
    const f = await repo.relationFacts(scope, contextId, scope.now);
    if (!f || f.status === 'ENDED' || !f.activeParticipants.includes(p.userId)) contextId = null;
  }
  await scope.outbox.emit({
    topic: 'mission.proof_validated',
    aggregateType: 'MissionProofAssessment',
    aggregateId: proofId,
    payload: { proofId, rewardKey, userId: p.userId, contextId, missionKey: p.missionKey, submittedAt: p.submittedAt.toISOString(), serverDay: p.serverDay },
  });
  return true;
}

export class MediaAccessService {
  constructor(
    private readonly repo: MediaRepository,
    private readonly clock: Clock,
    private readonly outingReveal: OutingRevealReader | null = null,
  ) {}

  private relationInput(f: RelationFacts) {
    const prefs = [...f.photoPrefs.values()];
    return { id: f.id, status: f.status, branch: f.branch, reachedLevel: f.reachedLevel, paused: f.paused, photosAllowedByBoth: prefs.length >= 2 && prefs.every((p) => p !== 'NEVER'), movedIn: f.movedIn, participants: f.activeParticipants };
  }

  /** Décision d'accès complète à partir de la base (jamais mise en cache). */
  async decide(viewerId: string, a: MediaRow, variant: MediaVariant, relationshipId: string | undefined) {
    const isOwner = a.ownerUserId === viewerId;
    const ctxId = relationshipId ?? (a.purpose === 'MISSION_PROOF' ? a.contextId ?? undefined : undefined);
    const rel = !isOwner && ctxId ? await this.repo.relationFacts(null, ctxId, this.clock.now()) : null;
    const relationOk = rel && rel.status !== 'ENDED' && rel.activeParticipants.includes(viewerId) ? rel : null;
    const current = a.purpose === 'PROFILE_PHOTO' ? await this.repo.currentProfilePhoto(a.ownerUserId) : null;
    return decideAccess({
      viewerId,
      asset: { ownerUserId: a.ownerUserId, purpose: a.purpose, status: a.status, restricted: a.restricted, visibility: a.visibility, contextId: a.contextId },
      variant,
      relation: relationOk ? this.relationInput(relationOk) : null,
      blocked: isOwner ? false : await this.repo.isBlockedBetween(viewerId, a.ownerUserId),
      ownerPhotoPreference: isOwner ? 'FROM_LEVEL_4_WITH_CONSENT' : await this.repo.photoPreference(a.ownerUserId),
      revealAccepted: relationOk ? await this.repo.acceptedConsent(relationOk.id, 'PHOTO_REVEAL') : false,
      originalAccepted: relationOk ? await this.repo.acceptedConsent(relationOk.id, 'PHOTO_ORIGINAL') : false,
      voiceDeliverable: a.purpose === 'VOICE_MESSAGE' && !isOwner ? await this.repo.voiceDeliverableTo(a.id, viewerId) : false,
      isCurrentProfilePhoto: current?.id === a.id,
      outingReveal: !isOwner && current?.id === a.id && this.outingReveal ? await this.outingReveal.canSeeProfilePhoto(viewerId, a.ownerUserId, this.clock.now()) : false,
    });
  }
}

export class GetMediaContentQuery {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: ObjectStorage,
    private readonly access: MediaAccessService,
    private readonly clock: Clock,
  ) {}

  async byToken(token: string) {
    const t = await this.repo.findToken(createHash('sha256').update(token).digest('hex'));
    if (!t || t.revokedAt || t.expiresAt <= this.clock.now()) throw Errors.notFound('Média');
    // Le jeton n'est qu'un raccourci : l'ACL est revérifiée à l'usage (blocage, consentement…).
    const [variant, relationshipId] = t.variant.split('|');
    return this.execute(t.viewerId, t.assetId, variant as MediaVariant, relationshipId || undefined);
  }

  async execute(viewerId: string, mediaId: string, variant: MediaVariant, relationshipId: string | undefined) {
    const a = await this.repo.load(null, mediaId);
    // Même réponse 404 pour « inexistant » et « interdit » (anti-énumération).
    if (!a) throw Errors.notFound('Média');
    const d = await this.access.decide(viewerId, a, variant, relationshipId);
    if (!d.allow) throw Errors.notFound('Média');
    const key = d.variant === 'audio' ? a.derivatives.find((x) => x.kind === 'NORMALIZED')?.storageKey : a.derivatives.find((x) => x.kind === VARIANT_KIND[d.variant as Exclude<MediaVariant, 'audio'>])?.storageKey;
    if (!key) throw Errors.notFound('Média');
    const obj = await this.storage.get(key);
    if (!obj) throw Errors.notFound('Média');
    return { bytes: obj.bytes, contentType: obj.contentType, variant: d.variant };
  }
}

export class CreateAccessTokenUseCase {
  constructor(
    private readonly repo: MediaRepository,
    private readonly access: MediaAccessService,
    private readonly random: RandomSource,
    private readonly clock: Clock,
    private readonly publicUrl: string,
  ) {}
  async execute(viewerId: string, mediaId: string, variant: MediaVariant, relationshipId: string | undefined) {
    const a = await this.repo.load(null, mediaId);
    if (!a) throw Errors.notFound('Média');
    const d = await this.access.decide(viewerId, a, variant, relationshipId);
    if (!d.allow) throw Errors.notFound('Média');
    const token = this.random.hex(32);
    const expiresAt = new Date(this.clock.now().getTime() + LIMITS.accessTokenTtlMs);
    // Le contexte d'accès (relation) est lié au jeton : jamais élargi à l'usage.
    await this.repo.createToken({ id: this.random.uuid(), assetId: a.id, viewerId, variant: relationshipId ? `${d.variant}|${relationshipId}` : d.variant, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt });
    return { url: `${this.publicUrl}/v1/media/content/${token}`, expiresAt: expiresAt.toISOString() };
  }
}

/** Partage volontaire d'une preuve de mission (P-5.5) dans une relation. */
export class ShareMediaUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: MediaRepository,
    private readonly clock: Clock,
  ) {}
  async execute(userId: string, mediaId: string, commandId: string, req: { relationshipId: string; shared: boolean }) {
    const a = await this.repo.load(null, mediaId);
    if (!a || a.ownerUserId !== userId) throw Errors.notFound('Média');
    if (a.purpose !== 'MISSION_PROOF') throw Errors.precondition('NOT_SHAREABLE');
    const f = await this.repo.relationFacts(null, req.relationshipId, this.clock.now());
    if (!f || f.status === 'ENDED' || !f.activeParticipants.includes(userId)) throw Errors.notFound('Relation');
    await this.bus.execute({
      actorId: userId,
      operation: 'media.share',
      commandId,
      payload: { mediaId, ...req },
      handle: async (scope) => {
        await this.repo.update(scope, mediaId, { visibility: req.shared ? 'SHARED_WITH_CONTEXT' : 'PRIVATE', contextId: req.relationshipId });
        return { ok: true };
      },
    });
    if (!req.shared) await this.repo.revokeTokensFor(mediaId);
    return toMediaView((await this.repo.load(null, mediaId))!, await this.repo.proofByMedia(null, mediaId));
  }
}

/**
 * Révélation photo (P-5.4) : offre versionnée PHOTO_REVEAL (N4) / PHOTO_ORIGINAL (Plus N5) ;
 * l'effet est SIMULTANÉ et atomique au second accord (même transaction, verrou relation).
 * Ne fabrique aucun consentement : préférence « jamais » et capacité de niveau revérifiées.
 */
export class PhotoRevealUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: MediaRepository,
    private readonly random: RandomSource,
    private readonly clock: Clock,
  ) {}

  async state(viewerId: string, contextId: string, scopeName: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL') {
    const f = await this.repo.relationFacts(null, contextId, this.clock.now());
    if (!f || !f.participants.includes(viewerId)) throw Errors.notFound('Relation');
    const s = await this.repo.revealState(contextId, scopeName, viewerId, this.clock.now());
    const other = f.participants.find((p) => p !== viewerId)!;
    const photo = await this.repo.currentProfilePhoto(other);
    const prefs = [...f.photoPrefs.values()];
    const caps = capabilitiesOf({ status: f.status, branch: f.branch, reachedLevel: f.reachedLevel, paused: f.paused, photosAllowedByBoth: prefs.every((p) => p !== 'NEVER'), movedIn: f.movedIn });
    let otherVariant: MediaVariant | null = null;
    if (photo && s?.status === 'ACCEPTED' && f.status !== 'ENDED' && !(await this.repo.isBlockedBetween(viewerId, other))) {
      const original = await this.repo.acceptedConsent(contextId, 'PHOTO_ORIGINAL');
      otherVariant = caps.includes('PHOTO_ORIGINAL') && original ? 'normalized' : caps.includes('PHOTO_CLEAR') ? 'normalized' : caps.includes('PHOTO_BLURRED') ? 'blurred' : null;
    }
    return { scope: scopeName, status: (s?.status ?? 'CANCELLED') as 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'SUPERSEDED' | 'CANCELLED', version: s?.version ?? 0, myDecision: s?.myDecision ?? null, otherVariant };
  }

  async respond(actorId: string, contextId: string, commandId: string, req: { scope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL'; decision: 'ACCEPT' | 'DECLINE' }) {
    const f0 = await this.repo.relationFacts(null, contextId, this.clock.now());
    if (!f0 || !f0.activeParticipants.includes(actorId) || f0.status === 'ENDED') throw Errors.notFound('Relation');
    await this.bus.execute({
      actorId,
      operation: 'media.photo_reveal',
      commandId,
      payload: { contextId, ...req },
      handle: async (scope) => {
        await scope.lock.users(f0.participants);
        await scope.lock.relationships([contextId]);
        const f = (await this.repo.relationFacts(scope, contextId, scope.now))!;
        if (f.status === 'ENDED' || !f.activeParticipants.includes(actorId)) throw Errors.notFound('Relation');
        const prefs = [...f.photoPrefs.values()];
        const both = prefs.length >= 2 && prefs.every((p) => p !== 'NEVER');
        const caps = capabilitiesOf({ status: f.status, branch: f.branch, reachedLevel: f.reachedLevel, paused: f.paused, photosAllowedByBoth: both, movedIn: f.movedIn });
        const needed = req.scope === 'PHOTO_ORIGINAL' ? 'PHOTO_ORIGINAL' : caps.includes('PHOTO_CLEAR') ? 'PHOTO_CLEAR' : 'PHOTO_BLURRED';
        if (req.decision === 'ACCEPT' && !caps.includes(needed)) throw Errors.precondition(both ? 'LEVEL_TOO_LOW' : 'PHOTO_DISABLED');
        let offer = await this.repo.lockedOpenOffer(scope, contextId, req.scope, scope.now);
        if (!offer) {
          if (req.decision === 'DECLINE') return { ok: true };
          const o = await this.repo.openRevealOffer(scope, { id: this.random.uuid(), contextId, scope: req.scope, proposedBy: actorId, expiresAt: new Date(scope.now.getTime() + 72 * 3_600_000) });
          offer = { ...o, responses: [] };
        }
        await this.repo.respondReveal(scope, offer.id, actorId, req.decision);
        const responses = [...offer.responses.filter((r) => r.userId !== actorId), { userId: actorId, decision: req.decision }];
        if (req.decision === 'DECLINE') await this.repo.setOfferStatus(scope, offer.id, 'DECLINED');
        else if (f.participants.every((u) => responses.some((r) => r.userId === u && r.decision === 'ACCEPT'))) {
          // Second accord : révélation simultanée pour les deux (même transaction).
          await this.repo.setOfferStatus(scope, offer.id, 'ACCEPTED');
          await scope.outbox.emit({ topic: 'media.photo_revealed', aggregateType: 'RelationshipContext', aggregateId: contextId, payload: { relationshipId: contextId, scope: req.scope, userIds: f.participants } });
        }
        return { ok: true };
      },
    });
    return this.state(actorId, contextId, req.scope);
  }
}

/** Porte d'envoi d'un vocal (implémente VoiceMessageGate de conversations). */
export class VoiceGateService {
  constructor(
    private readonly repo: MediaRepository,
    private readonly db: { conversationContext(conversationId: string): Promise<string | null> },
    private readonly clock: Clock,
  ) {}
  async assertCanSend(actorId: string, conversationId: string, mediaId: string) {
    const a = await this.repo.load(null, mediaId);
    if (!a || a.ownerUserId !== actorId || a.purpose !== 'VOICE_MESSAGE') throw Errors.notFound('Média');
    if (a.status !== 'READY') throw Errors.precondition('MEDIA_NOT_READY');
    if (await this.repo.voiceAlreadyUsed(mediaId)) throw Errors.conflict('MEDIA_ALREADY_SENT');
    const ctxId = await this.db.conversationContext(conversationId);
    if (!ctxId || (a.contextId && a.contextId !== ctxId)) throw Errors.notFound('Conversation');
    const f = await this.repo.relationFacts(null, ctxId, this.clock.now());
    if (!f) throw Errors.notFound('Conversation');
    const prefs = [...f.photoPrefs.values()];
    const caps = capabilitiesOf({ status: f.status, branch: f.branch, reachedLevel: f.reachedLevel, paused: f.paused, photosAllowedByBoth: prefs.every((p) => p !== 'NEVER'), movedIn: f.movedIn });
    // Voix : niveau 3 + droits actifs (matrice de capacités).
    if (!caps.includes('VOICE')) throw new AppError('PRECONDITION_FAILED', 'Messages vocaux non débloqués', { detailsSafe: { reason: 'VOICE_LOCKED' } });
  }
}

/** Transcription serveur d'un vocal (§9.2) pour la modération ; jamais publiée telle quelle. */
export class VoiceTranscriptionService {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: ObjectStorage,
    private readonly ai: AiServices,
  ) {}
  async transcribe(mediaId: string, ownerId: string, contextId: string | null) {
    const a = await this.repo.load(null, mediaId);
    if (!a || a.ownerUserId !== ownerId || a.status !== 'READY' || !this.ai.providers) throw new Error('voice_unavailable');
    const key = a.derivatives.find((d) => d.kind === 'NORMALIZED')?.storageKey;
    const obj = key ? await this.storage.get(key) : null;
    if (!obj) throw new Error('voice_unavailable');
    const tr = this.ai.providers.transcription;
    const r = await this.ai.runner.run({
      kind: 'transcription.voice',
      provider: tr.name,
      promptVersion: 'transcription',
      subject: { type: 'MEDIA', id: mediaId },
      userId: ownerId,
      contextId,
      contentHash: a.sha256 ?? sha256(obj.bytes),
      accessScope: 'voice',
      cacheTtlMs: 0,
      call: (o) => tr.transcribe({ bytes: obj.bytes, mime: obj.contentType, durationMs: a.durationMs ?? 0 }, o),
      validate: (v) => v as { text: string; quality: 'OK' | 'SILENCE' | 'UNCERTAIN' | 'UNSUPPORTED_LANGUAGE' | 'NON_VERBAL' },
    });
    return { text: r.value.text, quality: r.value.quality };
  }
}

/** Job de purge médias (rétention versionnée) + uploads abandonnés. */
export class PurgeMediaJob {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: ObjectStorage,
  ) {}
  async run(now: Date) {
    let n = 0;
    for (const a of [...(await this.repo.duePurges(now, 100)), ...(await this.repo.abandonedUploads(now, 100))]) {
      await this.storage.delete(a.storageKey);
      for (const k of await this.repo.deleteDerivatives(a.id)) await this.storage.delete(k);
      await this.repo.revokeTokensFor(a.id);
      await this.repo.update(null, a.id, { status: 'PURGED', purgedAt: now });
      n++;
    }
    return { purged: n };
  }
}

export class GetMediaQuery {
  constructor(private readonly repo: MediaRepository) {}
  async execute(userId: string, mediaId: string) {
    const a = await this.repo.load(null, mediaId);
    if (!a || a.ownerUserId !== userId) throw Errors.notFound('Média');
    return toMediaView(a, await this.repo.proofByMedia(null, mediaId));
  }
}
