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

// ============================================================================ V5.6 (E16, spec §2.17) : liens de partage
/** Cartes de partage : chaque lien est unique (une carte, une personne), jamais réutilisé, traçable. */
export const SHARE_CARD_KINDS = ['INVITE', 'CONFIRMED', 'TEASER', 'HERE', 'EVENING', 'BAND', 'HELP_CITY', 'TEAM'] as const;
export const ShareCardKindSchema = z.enum(SHARE_CARD_KINDS);
export type ShareCardKind = z.infer<typeof ShareCardKindSchema>;
/** Slug public d'un lien de partage (`/s/<slug>`) : aléatoire, sans identifiant interne. */
export const ShareSlugSchema = z.string().regex(/^s[a-z2-7]{15}$/);

/** `POST /v1/share-links` — un NOUVEAU lien à chaque appel. `TEAM` exige `teamCode` (lien `/team/<code>`). */
export const CreateShareLinkRequestSchema = z
  .object({ cardKind: ShareCardKindSchema, teamCode: z.string().regex(/^[A-Za-z0-9_-]{4,64}$/).optional() })
  .strict()
  .refine((b) => b.cardKind !== 'TEAM' || !!b.teamCode, { message: 'teamCode requis pour TEAM', path: ['teamCode'] });
export const ShareLinkViewSchema = z
  .object({ slug: ShareSlugSchema, url: z.string(), cardKind: ShareCardKindSchema, expiresAt: z.string(), clickCount: z.number().int().nonnegative(), attributedSignups: z.number().int().nonnegative(), attributedFirstOutings: z.number().int().nonnegative() })
  .strict();
export type ShareLinkView = z.infer<typeof ShareLinkViewSchema>;
export const ShareLinkListSchema = z.object({ items: z.array(ShareLinkViewSchema) }).strict();

/**
 * `GET /v1/public/s/:slug` (page web publique) : ce que la carte permet, rien d'autre — jamais un prénom, l'espèce
 * réelle d'un pet tiers, un lieu ou une heure. `inviteRef` (INVITE) se réclame ensuite via `POST /v1/referrals/claim`.
 */
export const PublicShareViewSchema = z
  .object({
    valid: z.boolean(),
    cardKind: ShareCardKindSchema.nullable(),
    inviteRef: z.string().optional(),
    teamCode: z.string().optional(),
  })
  .strict();
export type PublicShareView = z.infer<typeof PublicShareViewSchema>;
