/** Modules métier montés dans l'application HTTP (liste unique, partagée par main, worker et tests). */
import type { Type } from '@nestjs/common';
import { ConversationsModule } from './conversations/conversations.module.js';
import { EconomyModule } from './economy/economy.module.js';
import { MatchingModule } from './matching/matching.module.js';
import { PetsModule } from './pets/pets.module.js';
import { RelationshipsModule } from './relationships/relationships.module.js';
import { MediaModule } from './media/media.module.js';
import { TrustModule } from './trust/trust.module.js';
import { SocialModule } from './social/social.module.js';
import { AdminModule } from './admin/admin.module.js';
import { NeighborhoodsModule } from './neighborhoods/neighborhoods.module.js';
import { OutingsModule } from './outings/outings.module.js';

export const FEATURE_MODULES: Type[] = [PetsModule, RelationshipsModule, ConversationsModule, MatchingModule, EconomyModule, TrustModule, MediaModule, SocialModule, AdminModule, NeighborhoodsModule, OutingsModule];
