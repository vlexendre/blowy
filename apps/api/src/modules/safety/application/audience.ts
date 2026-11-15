import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/clock';
import { BLOCKS, CLOCK, PROFILES } from '../../../shared/tokens';
import { AccountGate } from '../../admin/application/account-gate';
import type { SuspensionsRepository } from '../../admin/ports';
import { SUSPENSIONS } from '../../admin/tokens';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { BlocksRepository } from '../ports';

/**
 * Pour quoi une personne est montrée :
 * - `suggest` : proposée en rencontre, coucou reçu, page d'invitation ou « 3 mots », compteur du paywall ;
 * - `map` : épingle sur la carte (en plus : pas en mode discret, position consentie).
 */
export type AudiencePurpose = 'suggest' | 'map';

/**
 * Seul endroit qui décide si une personne est « utilisable » pour une autre (docs/ARCHITECTURE.md) :
 * - supprimée : son profil n'existe plus ;
 * - suspendue par la modération : jamais proposée, jamais sur la carte, ne reçoit aucun push ;
 * - bloquée dans un sens ou dans l'autre : invisible pour l'autre ;
 * - mode discret : absente de la carte seulement (elle reste proposée en rencontre).
 * Relu à chaque requête (les caches des suggestions et de la carte ne gardent que la compatibilité).
 */
@Injectable()
export class Audience {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(SUSPENSIONS) private readonly suspensions: SuspensionsRepository,
    @Inject(AccountGate) private readonly gate: AccountGate,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Profils de `ids` que `viewerId` peut voir pour cet usage (l'ordre de `ids` est gardé). */
  async visible(viewerId: string, ids: readonly string[], purpose: AudiencePurpose): Promise<Profile[]> {
    const wanted = [...new Set(ids.filter((id) => id !== viewerId))];
    if (wanted.length === 0) return [];
    const [profiles, blocked, suspended] = await Promise.all([
      this.profiles.findByIds(wanted),
      this.blocks.blockedEitherWay(viewerId),
      this.suspensions.activeAmong(wanted, this.clock.now().toISOString()),
    ]);
    const byId = new Map(profiles.map((p) => [p.id, p]));
    return wanted.flatMap((id) => {
      const p = byId.get(id);
      if (!p || blocked.has(id) || suspended.has(id)) return [];
      if (purpose === 'map' && (p.discreet || !p.locationConsentAt)) return [];
      return [p];
    });
  }

  /** Identifiants seulement (même règle que `visible`). */
  async visibleIds(viewerId: string, ids: readonly string[], purpose: AudiencePurpose): Promise<Set<string>> {
    return new Set((await this.visible(viewerId, ids, purpose)).map((p) => p.id));
  }

  /** `targetId` peut-il être joint par `viewerId` (coucou, invitation) ? */
  async reachable(viewerId: string, targetId: string): Promise<Profile | null> {
    return (await this.visible(viewerId, [targetId], 'suggest'))[0] ?? null;
  }

  /** Personne joignable par une page publique (invitation, « 3 mots ») : existe et n'est pas suspendue. */
  async publiclyVisible(profile: Profile | null): Promise<Profile | null> {
    if (!profile) return null;
    return (await this.gate.isSuspended(profile.id)) ? null : profile;
  }

  /** Compte suspendu en ce moment (cache de 30 s de la garde de compte). */
  async isSuspended(userId: string): Promise<boolean> {
    return this.gate.isSuspended(userId);
  }

  /** Peut-on lui envoyer un push ? (non : compte suspendu). */
  async canNotify(userId: string): Promise<boolean> {
    return !(await this.gate.isSuspended(userId));
  }
}
