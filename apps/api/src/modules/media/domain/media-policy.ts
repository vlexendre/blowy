/**
 * Politique médias (§10, P-5.4, P-5.5). Pure : limites, détection du type réel, rétention
 * versionnée et décision d'accès (ACL) à partir de faits chargés par l'application.
 */
import { capabilitiesOf, type CapabilityInput } from '../../relationships/domain/capabilities.js';

export type MediaPurpose = 'PROFILE_PHOTO' | 'MISSION_PROOF' | 'VOICE_MESSAGE' | 'VERIFICATION_SELFIE';
export type MediaVariant = 'thumbnail' | 'normalized' | 'blurred' | 'blurred_medium' | 'audio';

export const LIMITS = {
  image: { maxBytes: 12 * 1024 * 1024, maxPixels: 40_000_000, maxSide: 8000, normalizedSide: 1600, thumbSide: 320, decodeTimeoutSec: 10 },
  voice: { maxBytes: 3 * 1024 * 1024, maxDurationMs: 60_000, minDurationMs: 300 },
  uploadSessionTtlMs: 15 * 60_000,
  accessTokenTtlMs: 5 * 60_000,
} as const;

export type SniffedType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heif' | 'audio/wav' | 'audio/mp4' | 'image/svg+xml' | 'unknown';

/** Type RÉEL par signature (magic bytes). SVG / HTML / XML = formats actifs refusés. */
export function sniff(b: Uint8Array): SniffedType {
  const at = (i: number) => b[i] ?? -1;
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'image/jpeg';
  if (at(0) === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return 'audio/wav';
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (/^(heic|heix|hevc|mif1|msf1|heim|heis)$/.test(brand)) return 'image/heif';
    if (/^(M4A |mp42|isom|mp41|M4B |dash|iso5|iso6)$/.test(brand)) return 'audio/mp4';
  }
  const head = ascii(0, Math.min(b.length, 256)).trimStart().toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg') || head.includes('<svg') || head.startsWith('<!doctype') || head.startsWith('<html')) return 'image/svg+xml';
  return 'unknown';
}

export function kindOf(purpose: MediaPurpose): 'image' | 'voice' {
  return purpose === 'VOICE_MESSAGE' ? 'voice' : 'image';
}

/** Rétention versionnée par catégorie (docs/privacy/retention.md). */
export const RETENTION_VERSION = 'retention-2026.11.0';
export const RETENTION_DAYS: Record<MediaPurpose | 'REJECTED' | 'UPLOAD_ABANDONED', number> = {
  PROFILE_PHOTO: 30, // après remplacement ou suppression du compte
  MISSION_PROOF: 90, // après dépôt
  VOICE_MESSAGE: 365, // après envoi ; purge anticipée à la fin de relation + 30 j
  VERIFICATION_SELFIE: 30, // après décision ; jamais réutilisé comme photo
  REJECTED: 30, // preuve de décision, sauf dossier ouvert
  UPLOAD_ABANDONED: 1,
};

export function purgeAfterFor(purpose: MediaPurpose, from: Date): Date | null {
  if (purpose === 'PROFILE_PHOTO') return null; // fixé au remplacement
  return new Date(from.getTime() + RETENTION_DAYS[purpose] * 86_400_000);
}

// ------------------------------------------------------------------ ACL
export interface AccessFacts {
  viewerId: string;
  asset: { ownerUserId: string; purpose: MediaPurpose; status: string; restricted: boolean; visibility: 'PRIVATE' | 'SHARED_WITH_CONTEXT'; contextId: string | null };
  variant: MediaVariant;
  /** Relation invoquée par le lecteur (vérifiée : participants actifs ou null). */
  relation: (CapabilityInput & { id: string; participants: string[] }) | null;
  blocked: boolean;
  /** Préférence photo du propriétaire. */
  ownerPhotoPreference: 'FROM_LEVEL_4_WITH_CONSENT' | 'NEVER';
  /** Consentements de révélation ACCEPTÉS par les deux, version courante. */
  revealAccepted: boolean;
  originalAccepted: boolean;
  /** Vocal : le lecteur est membre actif d'une conversation où ce média est livrable. */
  voiceDeliverable: boolean;
  /** Profil courant du propriétaire (seule la photo de profil active est révélable). */
  isCurrentProfilePhoto: boolean;
}

export type AccessDecision = { allow: true; variant: MediaVariant } | { allow: false; reason: string };

const deny = (reason: string): AccessDecision => ({ allow: false, reason });

/** Décision d'accès à CHAQUE lecture (jamais mise en cache). */
export function decideAccess(f: AccessFacts): AccessDecision {
  const a = f.asset;
  if (a.status === 'PURGED' || a.restricted) return deny('UNAVAILABLE');
  const isOwner = f.viewerId === a.ownerUserId;
  if (isOwner) return a.status === 'READY' || a.status === 'PROCESSING' || a.status === 'QUARANTINE' ? { allow: true, variant: f.variant } : deny('NOT_READY');
  if (a.status !== 'READY') return deny('NOT_READY');
  if (f.blocked) return deny('BLOCKED');
  switch (a.purpose) {
    case 'VERIFICATION_SELFIE':
      return deny('PRIVATE'); // jamais partagé, jamais réutilisé
    case 'VOICE_MESSAGE':
      return f.variant === 'audio' && f.voiceDeliverable ? { allow: true, variant: 'audio' } : deny('PRIVATE');
    case 'MISSION_PROOF': {
      // Privée par défaut ; partage volontaire dans une relation, selon ses droits photo.
      const r = f.relation;
      if (a.visibility !== 'SHARED_WITH_CONTEXT' || !r || r.id !== a.contextId || !r.participants.includes(f.viewerId)) return deny('PRIVATE');
      const caps = capabilitiesOf(r);
      const clear = caps.includes('PHOTO_CLEAR') || caps.includes('PHOTO_ORIGINAL');
      if (f.variant === 'blurred' || f.variant === 'blurred_medium') return { allow: true, variant: f.variant };
      return clear && f.revealAccepted && f.ownerPhotoPreference !== 'NEVER' ? { allow: true, variant: f.variant === 'audio' ? 'thumbnail' : f.variant } : { allow: true, variant: 'blurred_medium' };
    }
    case 'PROFILE_PHOTO': {
      const r = f.relation;
      if (!r || !r.participants.includes(f.viewerId) || !r.participants.includes(a.ownerUserId)) return deny('NO_RELATION');
      if (!f.isCurrentProfilePhoto) return deny('NOT_CURRENT');
      // « Jamais » l'emporte sur tous les niveaux ; aucun paiement ne contourne.
      if (f.ownerPhotoPreference === 'NEVER' || !r.photosAllowedByBoth) return deny('PHOTO_DISABLED');
      const caps = capabilitiesOf(r);
      if (caps.includes('PHOTO_ORIGINAL') && f.originalAccepted && f.revealAccepted) return { allow: true, variant: f.variant === 'audio' ? 'normalized' : f.variant };
      if (caps.includes('PHOTO_CLEAR') && f.revealAccepted) {
        // Ami N4 : révélation claire (thumbnail / normalized), sans mécanique de flou.
        return f.variant === 'audio' ? deny('VARIANT') : { allow: true, variant: f.variant };
      }
      if (caps.includes('PHOTO_BLURRED') && f.revealAccepted) {
        // Plus N4 : dérivés floutés seulement ; jamais l'original avant N5 + double accord.
        return f.variant === 'blurred' || f.variant === 'blurred_medium' ? { allow: true, variant: f.variant } : { allow: true, variant: 'blurred' };
      }
      return deny('NOT_UNLOCKED');
    }
  }
}

/** Variante de photo de l'autre accessible pour l'UI (ou null). */
export function bestProfileVariant(f: Omit<AccessFacts, 'variant'>): MediaVariant | null {
  const d = decideAccess({ ...f, variant: 'normalized' });
  return d.allow ? d.variant : null;
}
