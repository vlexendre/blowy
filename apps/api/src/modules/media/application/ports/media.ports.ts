/** Ports du module media (persistance, traitement d'image/son, jetons). */
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { MediaPurpose, MediaVariant } from '../../domain/media-policy.js';

export interface MediaRow {
  id: string;
  ownerUserId: string;
  purpose: MediaPurpose;
  status: 'UPLOAD_PENDING' | 'QUARANTINE' | 'PROCESSING' | 'READY' | 'REJECTED' | 'PURGED';
  storageKey: string;
  mimeType: string | null;
  declaredMime: string | null;
  bytes: number | null;
  maxBytes: number | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  sha256: string | null;
  contextId: string | null;
  visibility: 'PRIVATE' | 'SHARED_WITH_CONTEXT';
  restricted: boolean;
  rejectReason: string | null;
  uploadExpiresAt: Date | null;
  createdAt: Date;
  purgeAfter: Date | null;
  derivatives: { kind: 'NORMALIZED' | 'THUMBNAIL' | 'BLURRED' | 'BLURRED_MEDIUM' | 'TRANSCRIPT'; storageKey: string; width: number | null; height: number | null }[];
}

export interface ProofRow {
  id: string;
  mediaId: string;
  userId: string;
  contextId: string | null;
  missionKey: string;
  submittedAt: Date;
  serverDay: string;
  status: 'PENDING' | 'CONSISTENT' | 'INCONSISTENT' | 'UNCERTAIN' | 'HUMAN_REVIEW' | 'APPROVED' | 'REJECTED';
  assessment: Record<string, unknown> | null;
  rewardKey: string | null;
  rewardEmittedAt: Date | null;
}

export interface RelationFacts {
  id: string;
  status: 'ACTIVE' | 'MOVED_IN' | 'PAUSED' | 'LEGACY' | 'ENDED';
  branch: 'UNDECIDED' | 'FRIEND' | 'PLUS';
  reachedLevel: number;
  movedIn: boolean;
  paused: boolean;
  participants: string[];
  activeParticipants: string[];
  timezone: string;
  photoPrefs: Map<string, 'FROM_LEVEL_4_WITH_CONSENT' | 'NEVER'>;
  conversationId: string | null;
}

export interface MediaRepository {
  create(scope: TxScope, m: { id: string; ownerUserId: string; purpose: MediaPurpose; storageKey: string; declaredMime: string; maxBytes: number; contextId: string | null; retentionClass: string; retentionVersion: string; uploadExpiresAt: Date }): Promise<void>;
  load(scope: TxScope | null, id: string): Promise<MediaRow | null>;
  update(scope: TxScope | null, id: string, patch: Partial<Pick<MediaRow, 'status' | 'mimeType' | 'bytes' | 'width' | 'height' | 'durationMs' | 'sha256' | 'visibility' | 'restricted' | 'rejectReason' | 'purgeAfter' | 'contextId'>> & { finalizedAt?: Date; purgedAt?: Date }): Promise<void>;
  addDerivative(id: string, d: { kind: MediaRow['derivatives'][number]['kind']; storageKey: string; width: number | null; height: number | null }): Promise<void>;
  deleteDerivatives(id: string): Promise<string[]>;
  /** Photo de profil courante (dernière READY) de l'utilisateur. */
  currentProfilePhoto(userId: string): Promise<MediaRow | null>;
  /** Anciennes photos de profil à purger après remplacement. */
  supersedeProfilePhotos(userId: string, keepId: string, purgeAfter: Date): Promise<void>;
  sameHashCount(ownerUserId: string, sha256: string, excludeId: string): Promise<number>;
  duePurges(now: Date, limit: number): Promise<MediaRow[]>;
  abandonedUploads(now: Date, limit: number): Promise<MediaRow[]>;
  // ---- jetons
  createToken(t: { id: string; assetId: string; viewerId: string; variant: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findToken(tokenHash: string): Promise<{ id: string; assetId: string; viewerId: string; variant: string; expiresAt: Date; revokedAt: Date | null } | null>;
  revokeTokensFor(assetId: string): Promise<void>;
  // ---- preuves de mission
  createProof(scope: TxScope, p: { id: string; mediaId: string; userId: string; contextId: string | null; missionKey: string; submittedAt: Date; serverDay: string }): Promise<void>;
  proofByMedia(scope: TxScope | null, mediaId: string): Promise<ProofRow | null>;
  loadProof(scope: TxScope | null, id: string): Promise<ProofRow | null>;
  updateProof(scope: TxScope, id: string, patch: Partial<Pick<ProofRow, 'status' | 'assessment' | 'rewardKey'>> & { promptVersion?: string; rewardEmittedAt?: Date; decidedAt?: Date; decidedById?: string | null }): Promise<void>;
  /** Réclame la clé de récompense (unique) ; false si déjà émise. */
  claimReward(scope: TxScope, proofId: string, rewardKey: string): Promise<boolean>;
  // ---- faits d'autorisation
  relationFacts(scope: TxScope | null, contextId: string, at: Date): Promise<RelationFacts | null>;
  photoPreference(userId: string): Promise<'FROM_LEVEL_4_WITH_CONSENT' | 'NEVER'>;
  /** Consentements ACCEPTÉS par les deux (session la plus récente du scope). */
  acceptedConsent(contextId: string, scope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL'): Promise<boolean>;
  isBlockedBetween(a: string, b: string): Promise<boolean>;
  /** Prénom affiché de la personne qui regarde (filigrane V5.2 C.8). */
  viewerFirstName(userId: string): Promise<string>;
  /** Vocal livrable : message VOICE publié (ou warned révélé) dans une conversation où le lecteur est membre actif. */
  voiceDeliverableTo(mediaId: string, viewerId: string): Promise<boolean>;
  voiceAlreadyUsed(mediaId: string): Promise<boolean>;
  aiConsent(userId: string, purpose: string): Promise<boolean>;
  // ---- révélation photo
  revealState(contextId: string, scope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL', viewerId: string, at: Date): Promise<{ id: string; status: string; version: number; myDecision: 'ACCEPT' | 'DECLINE' | null; responses: { userId: string; decision: 'ACCEPT' | 'DECLINE' }[] } | null>;
  openRevealOffer(scope: TxScope, o: { id: string; contextId: string; scope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL'; proposedBy: string; expiresAt: Date }): Promise<{ id: string; version: number }>;
  respondReveal(scope: TxScope, offerId: string, userId: string, decision: 'ACCEPT' | 'DECLINE'): Promise<void>;
  setOfferStatus(scope: TxScope, offerId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<void>;
  lockedOpenOffer(scope: TxScope, contextId: string, offerScope: 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL', at: Date): Promise<{ id: string; version: number; responses: { userId: string; decision: 'ACCEPT' | 'DECLINE' }[] } | null>;
}
export const MEDIA_REPOSITORY = Symbol('MediaRepository');

export interface ProcessedImage {
  normalized: { bytes: Uint8Array; width: number; height: number };
  thumbnail: { bytes: Uint8Array; width: number; height: number };
  blurred: { bytes: Uint8Array; width: number; height: number };
  blurredMedium: { bytes: Uint8Array; width: number; height: number };
  sha256: string;
}

/** Traitement d'image serveur (sharp) : décodage borné, rotation, retrait EXIF/GPS, dérivés. */
export interface ImageProcessor {
  process(bytes: Uint8Array): Promise<ProcessedImage>;
}
export const IMAGE_PROCESSOR = Symbol('ImageProcessor');

/** Filigrane serveur (V5.2 C.8) : texte répété en diagonale, image ré-encodée (aucune métadonnée). */
export interface Watermarker {
  apply(bytes: Uint8Array, text: string): Promise<{ bytes: Uint8Array; contentType: string }>;
}
export const WATERMARKER = Symbol('Watermarker');

export interface AudioProbe {
  /** Durée réelle et format ; null si le conteneur n'est pas reconnu. */
  probe(bytes: Uint8Array, sniffed: 'audio/wav' | 'audio/mp4'): Promise<{ durationMs: number } | null>;
}
export const AUDIO_PROBE = Symbol('AudioProbe');

export type { MediaVariant };
