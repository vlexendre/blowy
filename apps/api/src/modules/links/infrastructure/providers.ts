import type { Provider } from '@nestjs/common';
import type { DailyPhotosRepository, LinkReadsRepository, LinksRepository, MessagesRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { DAILY_PHOTOS, LINKS, LINK_READS, MESSAGES } from '../../../shared/tokens';
import { MemoryDailyPhotosRepository } from './memory-daily-photos.repository';
import { MemoryLinkReadsRepository } from './memory-link-reads.repository';
import { MemoryLinksRepository } from './memory-links.repository';
import { MemoryMessagesRepository } from './memory-messages.repository';
import { SupabaseDailyPhotosRepository } from './supabase-daily-photos.repository';
import { SupabaseLinkReadsRepository } from './supabase-link-reads.repository';
import { SupabaseLinksRepository } from './supabase-links.repository';
import { SupabaseMessagesRepository } from './supabase-messages.repository';

export const linksRepositories = (adapters: Adapters): Provider[] => [
  repository<LinksRepository>(LINKS, adapters, (db) => new MemoryLinksRepository(db), (c) => new SupabaseLinksRepository(c)),
  repository<MessagesRepository>(MESSAGES, adapters, (db) => new MemoryMessagesRepository(db), (c) => new SupabaseMessagesRepository(c)),
  repository<LinkReadsRepository>(LINK_READS, adapters, (db) => new MemoryLinkReadsRepository(db), (c) => new SupabaseLinkReadsRepository(c)),
  repository<DailyPhotosRepository>(DAILY_PHOTOS, adapters, (db) => new MemoryDailyPhotosRepository(db), (c) => new SupabaseDailyPhotosRepository(c)),
];
