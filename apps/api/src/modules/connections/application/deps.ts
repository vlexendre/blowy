/** Dépendances partagées des services `connections` (ports seulement ; composition dans le module). */
import type { Tuning } from '@blowy/tuning';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { BlockReader } from '../../../shared/application/ports/block-reader.port.js';
import type { EntitlementsReader } from '../../../shared/application/ports/entitlements-reader.port.js';
import type { GroupChatPort } from '../../../shared/application/ports/group-chat.port.js';
import type { PhotoTokenIssuer } from '../../../shared/application/ports/outing-photos.port.js';
import type { PetMemoryPort } from '../../../shared/application/ports/pet-memory.port.js';
import type { ReliabilityPort } from '../../../shared/application/ports/reliability.port.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { DuoEnding } from './duo-ending.js';
import type { DuoEvents } from './duo-events.js';
import type { ConnectionsRepository } from './ports/connections.repository.js';

export interface ConnectionsDeps {
  repo: ConnectionsRepository;
  bus: CommandBus;
  uow: UnitOfWork;
  chat: GroupChatPort;
  memories: PetMemoryPort;
  reliability: ReliabilityPort;
  photos: PhotoTokenIssuer;
  /** Port économie (G) : Blowy+ = duos illimités. Absent → gratuit. */
  entitlements: EntitlementsReader | null;
  blocks: BlockReader;
  events: DuoEvents;
  ending: DuoEnding;
  random: RandomSource;
  clock: Clock;
  tuning: Tuning;
  /** Secret HMAC d'un lieu (code de repli du check-in), dérivé côté serveur. */
  secretOf(ref: string): string;
}
