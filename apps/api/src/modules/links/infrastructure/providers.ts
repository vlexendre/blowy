import type { Provider } from '@nestjs/common';
import type { LinkReadsRepository, LinksRepository, MessagesRepository, PastPhotosRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { LINKS, LINK_READS, MESSAGES, PAST_PHOTOS } from '../../../shared/tokens';
import { MemoryLinkReadsRepository } from './memory-link-reads.repository';
import { MemoryLinksRepository } from './memory-links.repository';
import { MemoryMessagesRepository } from './memory-messages.repository';
import { MemoryPastPhotosRepository } from './memory-past-photos.repository';
import { SupabaseLinkReadsRepository } from './supabase-link-reads.repository';
import { SupabaseLinksRepository } from './supabase-links.repository';
import { SupabaseMessagesRepository } from './supabase-messages.repository';
import { SupabasePastPhotosRepository } from './supabase-past-photos.repository';

export const linksRepositories = (adapters: Adapters): Provider[] => [
  repository<LinksRepository>(LINKS, adapters, (db) => new MemoryLinksRepository(db), (c) => new SupabaseLinksRepository(c)),
  repository<MessagesRepository>(MESSAGES, adapters, (db) => new MemoryMessagesRepository(db), (c) => new SupabaseMessagesRepository(c)),
  repository<LinkReadsRepository>(LINK_READS, adapters, (db) => new MemoryLinkReadsRepository(db), (c) => new SupabaseLinkReadsRepository(c)),
  repository<PastPhotosRepository>(PAST_PHOTOS, adapters, (db) => new MemoryPastPhotosRepository(db), (c) => new SupabasePastPhotosRepository(c)),
];
