import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { BAN_KEEP_DAYS, banSubjectKey } from '@blowy/domain';
import type { AuthAdmin } from '../../../integrations/auth/ports';
import type { Clock } from '../../../shared/clock';
import { AUTH_ADMIN, CLOCK } from '../../../shared/tokens';
import { RETENTION, type RetentionRepository } from '../ports';

/**
 * Exclusion définitive (politique de confidentialité, « Exclusion définitive ») : quand la modération supprime un
 * compte pour un manquement grave, l'empreinte non réversible (SHA-256) de chaque identifiant du fournisseur de
 * connexion (Apple, Google ; l'e-mail en local) est gardée 3 ans. L'inscription la vérifie avant de créer quoi que ce
 * soit. Rien n'est gardé en clair.
 */
@Injectable()
export class Bans {
  constructor(
    @Inject(AUTH_ADMIN) private readonly auth: AuthAdmin,
    @Inject(RETENTION) private readonly repo: RetentionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Empreintes des identifiants de connexion d'un compte (à lire AVANT sa suppression). */
  async hashesOf(userId: string): Promise<string[]> {
    const subjects = await this.auth.subjectsOf(userId);
    return [...new Set(subjects.map((s) => createHash('sha256').update(banSubjectKey(s.provider, s.subject)).digest('hex')))];
  }

  async ban(userId: string): Promise<number> {
    const hashes = await this.hashesOf(userId);
    const now = this.clock.now();
    await this.repo.addBans(hashes, now.toISOString(), new Date(now.getTime() + BAN_KEEP_DAYS * 86_400_000).toISOString());
    return hashes.length;
  }

  async isBanned(userId: string): Promise<boolean> {
    return this.repo.isBanned(await this.hashesOf(userId), this.clock.now().toISOString());
  }
}
