/**
 * Avancement paresseux du temps d'un pet (lecture/commande) — délègue au moteur.
 * Utilisé par les use cases et le tick worker (une seule implémentation).
 */
import type { EngineGateway, PetTimeContext } from '../../../shared/application/ports/engine.gateway.js';
import type { PetAggregate, PetRepository } from './ports/pet.repository.js';

export class PetTimeService {
  constructor(
    private readonly engine: EngineGateway,
    private readonly repo: PetRepository,
  ) {}

  async contextFor(p: PetAggregate, to: Date): Promise<PetTimeContext> {
    const pauses = p.primaryOwnerId ? await this.repo.globalPauses(p.primaryOwnerId, p.snapshot.asOf, to) : [];
    return { timezone: p.ownerTimezone, pauses };
  }

  /** Renvoie l'agrégat avancé à `to` (sans persister). Idempotent : avancer deux fois à `to` = une fois. */
  async advance(p: PetAggregate, to: Date): Promise<{ pet: PetAggregate; ctx: PetTimeContext }> {
    const ctx = await this.contextFor(p, to);
    if (to <= p.snapshot.asOf) return { pet: p, ctx };
    return { pet: { ...p, snapshot: this.engine.advancePet(p.snapshot, to, p.species, ctx) }, ctx };
  }
}
