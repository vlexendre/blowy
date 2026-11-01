/**
 * Commande pets.action (FEED, HEAL, PLAY, HUG, CALL). Le moteur décide des effets ;
 * les soins vitaux ne sont jamais refusés ; PLAY/HUG exigent une relation (même lieu)
 * et passent par le port SharedActionPort (le module relationships écrit ses tables).
 * CALL : déplacement ou refus selon la règle moteur, graine serveur persistée.
 */
import type { PetActionRequest, PetActionResult } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { EngineGateway } from '../../../shared/application/ports/engine.gateway.js';
import type { ParticipationReader } from '../../../shared/application/ports/participation.reader.js';
import type { SharedActionPort } from '../../../shared/application/ports/shared-action.port.js';
import { Errors } from '../../../shared/domain/errors.js';
import { storedToVision } from '../domain/pet.js';
import { toOwnPetView } from './pet.serializer.js';
import type { PetTimeService } from './pet-time.service.js';
import type { PetRepository } from './ports/pet.repository.js';

export class PetActionUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: PetRepository,
    private readonly time: PetTimeService,
    private readonly engine: EngineGateway,
    private readonly participation: ParticipationReader,
    private readonly shared: SharedActionPort,
  ) {}

  async execute(actorId: string, petId: string, commandId: string, req: PetActionRequest): Promise<PetActionResult> {
    const needsRel = req.action === 'PLAY' || req.action === 'HUG' || req.action === 'CALL';
    let otherPetId: string | null = null;
    if (needsRel) {
      if (!req.relationshipId) throw Errors.validation({ field: 'relationshipId' });
      const part = await this.participation.get(actorId, req.relationshipId);
      if (!part || part.myPetId !== petId || part.status === 'ENDED') throw Errors.notFound('Relation');
      otherPetId = part.otherPetId;
    }
    const { result } = await this.bus.execute({
      actorId,
      operation: 'pets.action',
      commandId,
      payload: { petId, ...req },
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        await scope.lock.pets(otherPetId ? [petId, otherPetId] : [petId]);
        if (req.relationshipId) await scope.lock.relationships([req.relationshipId]);
        const loaded = await this.repo.load(scope, petId);
        if (!loaded || !loaded.ownerIds.includes(actorId)) throw Errors.notFound('Pet');
        const { pet, ctx } = await this.time.advance(loaded, scope.now);
        let snapshot = pet.snapshot;
        let outcome: PetActionResult['outcome'] = 'APPLIED';
        let petXp = 0;
        let linkXp = 0;
        let reaction: PetActionResult['reaction'];
        const extra: { rngCounter?: number; lastCallRefused?: boolean; petXpMilli?: number } = {};

        if (req.action === 'FEED' || req.action === 'HEAL') {
          const r = this.engine.care(snapshot, req.action, pet.species, scope.now, ctx);
          snapshot = r.snapshot;
          petXp = r.petXpGainMilli;
          reaction = r.reaction;
        } else if (req.action === 'CALL') {
          if (!pet.vision) throw Errors.precondition('NO_VISION');
          const r = this.engine.resolveCall({
            species: pet.species,
            vision: storedToVision(pet.vision),
            desire: 40,
            waitingHours: 0,
            lastCallRefused: pet.lastCallRefused,
            petSick: this.engine.isSick(snapshot),
            seed: pet.rngSeed,
            counter: pet.rngCounter,
          });
          extra.rngCounter = pet.rngCounter + 1;
          extra.lastCallRefused = r.refused;
          if (r.refused) {
            outcome = 'REFUSED';
            reaction = 'POUTING';
          } else {
            await this.repo.moveTo(scope, petId, 'DATE_SPOT', req.relationshipId!);
            outcome = 'MOVED';
            reaction = 'LEAP';
          }
        } else {
          if (pet.location.contextId !== req.relationshipId) throw Errors.precondition('NOT_SAME_PLACE');
          const r = await this.shared.apply(scope, { actorId, petId, contextId: req.relationshipId!, action: req.action });
          outcome = r.outcome;
          linkXp = r.linkXpMilli;
          petXp = r.petXpMilli;
          reaction = req.action === 'HUG' ? 'AFFECTIONATE' : 'DANCE';
        }
        await this.repo.saveState(scope, petId, snapshot, extra);
        await this.repo.recordCare(scope, {
          petId,
          actorUserId: actorId,
          action: req.action,
          contextId: req.relationshipId ?? null,
          commandId,
          effects: { outcome, petXpMilli: petXp, linkXpMilli: linkXp },
          engineVersion: this.engine.engineVersion,
          tuningVersion: this.engine.tuningVersion,
        });
        await scope.outbox.emit({ topic: 'pet.updated', aggregateType: 'Pet', aggregateId: petId, payload: { ownerIds: pet.ownerIds, action: req.action, contextId: req.relationshipId ?? null } });
        const fresh = (await this.repo.load(scope, petId))!;
        return {
          pet: toOwnPetView(fresh, reaction ?? this.engine.poseFor(fresh.snapshot, scope.now, ctx)),
          outcome,
          gains: { petXp: Math.floor(petXp / 1000), linkXp: linkXp / 1000 },
          reaction,
        } satisfies PetActionResult;
      },
    });
    return result;
  }
}
