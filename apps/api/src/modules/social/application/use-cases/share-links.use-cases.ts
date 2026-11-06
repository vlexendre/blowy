/**
 * V5.6 (E16, spec §2.17) : liens de partage UNIQUES — un lien par carte et par personne, jamais réutilisé,
 * traçable (clics, inscriptions attribuées, 1ʳᵉ sorties attribuées), conservé 13 mois. La page publique
 * `/s/<slug>` ne dit que ce que la carte permet : jamais un prénom, un lieu, une heure ni l'espèce d'un pet tiers.
 * Carte INVITE : le lien porte le code de parrainage du titulaire (réclamé ensuite par `POST /v1/referrals/claim`).
 */
import type { PublicShareView, ShareCardKind, ShareLinkView } from '@blowy/api-contract';
import type { CommandBus } from '../../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../../shared/application/clock.js';
import { AppError, Errors } from '../../../../shared/domain/errors.js';
import type { ShareLinkRepository, ShareLinkRow, SocialConfig } from '../ports/social.ports.js';
import type { ReferralUseCases } from './referral.use-cases.js';

export const SHARE_LINK_RETENTION_DAYS = 396; // 13 mois
const B32 = 'abcdefghijklmnopqrstuvwxyz234567';

export function newSlug(hex: string): string {
  let out = 's';
  for (let i = 0; i < 15; i++) out += B32[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % 32];
  return out;
}

export class ShareLinksUseCases {
  constructor(
    private readonly repo: ShareLinkRepository,
    private readonly referrals: ReferralUseCases,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly cfg: SocialConfig,
  ) {}

  private view(l: ShareLinkRow): ShareLinkView {
    return { slug: l.slug, url: `${this.cfg.publicWebOrigin}/s/${l.slug}`, cardKind: l.cardKind, expiresAt: l.expiresAt.toISOString(), clickCount: l.clickCount, attributedSignups: l.attributedSignups, attributedFirstOutings: l.attributedFirstOutings };
  }

  async create(userId: string, b: { cardKind: ShareCardKind; teamCode?: string | undefined }, commandId: string): Promise<ShareLinkView> {
    // INVITE : le code de parrainage du titulaire (créé au besoin, hors de cette commande).
    const subjectRef = b.cardKind === 'INVITE' ? (await this.referrals.myLink(userId, this.random.uuid())).code : b.cardKind === 'TEAM' ? (b.teamCode ?? null) : null;
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'social.share_link.create',
      commandId,
      payload: { cardKind: b.cardKind, teamCode: b.teamCode ?? null },
      handle: async (scope) => {
        for (let i = 0; i < 5; i++) {
          const row = { id: this.random.uuid(), slug: newSlug(this.random.hex(15)), ownerUserId: userId, cardKind: b.cardKind, subjectRef, createdAt: scope.now, expiresAt: new Date(scope.now.getTime() + SHARE_LINK_RETENTION_DAYS * 86_400_000) };
          if (await this.repo.create(scope, row)) return { slug: row.slug };
        }
        throw new AppError('CONFLICT', 'Génération de lien impossible, réessaie', { retryable: true });
      },
    });
    const l = await this.repo.bySlug(result.slug);
    if (!l) throw Errors.notFound('Lien');
    return this.view(l);
  }

  async mine(userId: string): Promise<{ items: ShareLinkView[] }> {
    return { items: (await this.repo.ofOwner(userId, 100)).map((l) => this.view(l)) };
  }

  /** Page publique : compte le clic (sans rien garder du visiteur) ; lien inconnu ou expiré → `valid: false`. */
  async resolve(slug: string): Promise<PublicShareView> {
    const l = await this.repo.bySlug(slug);
    if (!l || l.expiresAt <= this.clock.now()) return { valid: false, cardKind: null };
    await this.repo.click(slug);
    return { valid: true, cardKind: l.cardKind, ...(l.cardKind === 'INVITE' && l.subjectRef ? { inviteRef: l.subjectRef } : {}), ...(l.cardKind === 'TEAM' && l.subjectRef ? { teamCode: l.subjectRef } : {}) };
  }

  /** Inscription arrivée par un lien (`ref = slug`) : attribution unique ; INVITE → renvoie le code de parrainage. */
  async attributeSignup(userId: string, slug: string): Promise<string | null> {
    const l = await this.repo.bySlug(slug);
    if (!l || l.expiresAt <= this.clock.now() || l.ownerUserId === userId) return null;
    await this.repo.attribute(userId, l.id, this.clock.now());
    return l.cardKind === 'INVITE' ? l.subjectRef : null;
  }

  onFirstOuting(userId: string): Promise<boolean> {
    return this.repo.firstOuting(userId, this.clock.now());
  }

  purge(): Promise<number> {
    return this.repo.purgeExpired(this.clock.now());
  }
}
