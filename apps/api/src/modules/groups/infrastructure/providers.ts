import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import type {
  GroupDaysRepository,
  GroupMembersRepository,
  GroupMessagesRepository,
  GroupsRepository,
  HabitJokersRepository,
  TogetherRepository,
} from '../ports';
import { GROUP_DAYS, GROUP_MEMBERS, GROUP_MESSAGES, GROUPS, HABIT_JOKERS, TOGETHER } from '../tokens';
import {
  MemoryGroupDaysRepository,
  MemoryGroupMembersRepository,
  MemoryGroupMessagesRepository,
  MemoryGroupsRepository,
  MemoryHabitJokersRepository,
  MemoryTogetherRepository,
} from './memory-groups.repositories';
import {
  SupabaseGroupDaysRepository,
  SupabaseGroupMembersRepository,
  SupabaseGroupMessagesRepository,
  SupabaseGroupsRepository,
  SupabaseHabitJokersRepository,
  SupabaseTogetherRepository,
} from './supabase-groups.repositories';

/** Dépôts des groupes (globaux : la sécurité, la modération et les rituels en lisent aussi). */
export function groupsRepositories(adapters: Adapters): Provider[] {
  return [
    repository<GroupsRepository>(
      GROUPS,
      adapters,
      (db) => new MemoryGroupsRepository(db),
      (c) => new SupabaseGroupsRepository(c),
    ),
    repository<GroupMembersRepository>(
      GROUP_MEMBERS,
      adapters,
      (db) => new MemoryGroupMembersRepository(db),
      (c) => new SupabaseGroupMembersRepository(c),
    ),
    repository<GroupMessagesRepository>(
      GROUP_MESSAGES,
      adapters,
      (db) => new MemoryGroupMessagesRepository(db),
      (c) => new SupabaseGroupMessagesRepository(c),
    ),
    repository<GroupDaysRepository>(
      GROUP_DAYS,
      adapters,
      (db) => new MemoryGroupDaysRepository(db),
      (c) => new SupabaseGroupDaysRepository(c),
    ),
    repository<HabitJokersRepository>(
      HABIT_JOKERS,
      adapters,
      (db) => new MemoryHabitJokersRepository(db),
      (c) => new SupabaseHabitJokersRepository(c),
    ),
    repository<TogetherRepository>(
      TOGETHER,
      adapters,
      (db) => new MemoryTogetherRepository(db),
      (c) => new SupabaseTogetherRepository(c),
    ),
  ];
}
