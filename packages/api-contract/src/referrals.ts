/**
 * Parrainage (P-5.9) : lien signé avec TTL, claim après création de compte, récompense +100/+100
 * une seule fois via le ledger après activation admissible. Aucune récompense au clic.
 */
import { z } from 'zod';
import { SPECIES } from '@blowy/domain';

export const ReferralLinkSchema = z.object({
  /** Jeton signé à mettre dans l'URL /invite/<token>. */
  token: z.string(),
  /** Code court de repli (saisie manuelle si le lien est perdu pendant l'installation). */
  code: z.string(),
  url: z.string(),
  expiresAt: z.string(),
});
export type ReferralLink = z.infer<typeof ReferralLinkSchema>;

/** Accepte le jeton signé OU le code court (repli). */
export const InviteRefSchema = z.string().regex(/^[A-Za-z0-9_.-]{4,200}$/);

export const InvitePreviewSchema = z.object({
  valid: z.boolean(),
  reason: z.enum(['EXPIRED', 'REVOKED', 'UNKNOWN', 'INVALID_SIGNATURE']).nullable(),
  inviter: z.object({ displayName: z.string(), petName: z.string().nullable(), species: z.enum(SPECIES).nullable() }).nullable(),
  /** Code court à saisir dans l'app si le lien n'est pas conservé après installation. */
  code: z.string().nullable(),
  rewardCoins: z.object({ referrer: z.number().int(), referee: z.number().int() }),
  expiresAt: z.string().nullable(),
});
export type InvitePreview = z.infer<typeof InvitePreviewSchema>;

export const ClaimReferralRequestSchema = z.object({ ref: InviteRefSchema });
export type ClaimReferralRequest = z.infer<typeof ClaimReferralRequestSchema>;

export const ReferralClaimViewSchema = z.object({
  status: z.enum(['PENDING_ACTIVATION', 'REWARDED', 'REJECTED']),
  /** Conditions d'activation restantes (compte, pet, vérification réelle, première action). */
  missing: z.array(z.enum(['ACCOUNT_ELIGIBLE', 'PRIMARY_PET', 'VERIFICATION', 'FIRST_ACTION'])),
  claimedAt: z.string(),
  rewardedAt: z.string().nullable(),
});
export type ReferralClaimView = z.infer<typeof ReferralClaimViewSchema>;
