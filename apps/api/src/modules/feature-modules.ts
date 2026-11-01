/** Modules métier montés dans l'application HTTP (liste unique, partagée par main, worker et tests). */
import type { Type } from '@nestjs/common';
import { ConversationsModule } from './conversations/conversations.module.js';
import { EconomyModule } from './economy/economy.module.js';
import { MatchingModule } from './matching/matching.module.js';
import { PetsModule } from './pets/pets.module.js';
import { RelationshipsModule } from './relationships/relationships.module.js';

export const FEATURE_MODULES: Type[] = [PetsModule, RelationshipsModule, ConversationsModule, MatchingModule, EconomyModule];
