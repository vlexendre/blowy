import { Module } from '@nestjs/common';
import { AdminGuard } from '../admin/interface/admin.guard';
import { RituelsModule } from '../rituels/rituels.module';
import { VisionModule } from '../vision/vision.module';
import { GroupChat } from './application/group-chat';
import { GroupCore } from './application/group-core';
import { GroupJobs } from './application/group.jobs';
import { GroupsUseCases } from './application/groups.usecases';
import { TogetherUseCases } from './application/together';
import { GroupPresenter } from './interface/group.presenter';
import { AdminGroupsController, GroupCodesController, GroupsController, TogetherController } from './interface/groups.controller';
import { HabitSharingModule } from './sharing/habit-sharing.module';

/**
 * Groupes et « la tenir ensemble » (spéc §26). Dépôts globaux (CoreModule, `groupsRepositories`) ; ce module fournit
 * les cas d'usage, le minuteur (`GroupJobs`, listé dans tick/jobs.ts) et la fermeture d'un groupe par la modération.
 */
@Module({
  imports: [RituelsModule, VisionModule, HabitSharingModule],
  controllers: [GroupCodesController, GroupsController, TogetherController, AdminGroupsController],
  providers: [GroupCore, GroupPresenter, GroupsUseCases, GroupChat, TogetherUseCases, GroupJobs, AdminGuard],
  exports: [GroupJobs, GroupsUseCases, GroupCore],
})
export class GroupsModule {}
