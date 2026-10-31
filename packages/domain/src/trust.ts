export const MESSAGE_STATUSES = [
  'DRAFT_LOCAL',
  'PENDING_MODERATION',
  'PUBLISHED',
  'WARNED',
  'QUARANTINED',
  'REJECTED',
  'HUMAN_REVIEW',
  'PROCESSING_FAILED',
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

/** Statuts qui ne livrent JAMAIS le corps au destinataire. */
export const HIDDEN_FROM_RECIPIENT: readonly MessageStatus[] = [
  'DRAFT_LOCAL',
  'PENDING_MODERATION',
  'QUARANTINED',
  'REJECTED',
  'HUMAN_REVIEW',
  'PROCESSING_FAILED',
];

export type ModerationAction = 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'HUMAN_REVIEW';

export const VERIFICATION_STATUSES = [
  'NOT_STARTED',
  'PENDING',
  'NEEDS_RETRY',
  'HUMAN_REVIEW',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Type exact et provenance : un « selfie contrôlé » n'est pas une « majorité vérifiée ». */
export type VerificationKind = 'SELFIE_QUALITY' | 'SELFIE_HUMAN_REVIEW' | 'LIVENESS' | 'IDENTITY_AGE';
export type VerificationProvenance = 'PROVIDER' | 'STAFF' | 'LOCAL_DEMO';

export type ReportCategory = 'FAKE_PROFILE' | 'INAPPROPRIATE' | 'HARASSMENT' | 'MONEY_REQUEST' | 'MINOR' | 'SAFETY' | 'OTHER';

export const STAFF_ROLES = ['support', 'moderator', 'trust_lead', 'content_manager', 'finance', 'analyst', 'admin'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const RELIABILITY_START = 100;
