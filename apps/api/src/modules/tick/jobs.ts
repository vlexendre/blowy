/**
 * Liste des travaux planifiés appelés à chaque tick, dans l'ordre.
 * Un chantier qui a un travail planifié ajoute UNE ligne ici (son service `XxxJobs`, injectable, avec `runDue(now)`).
 * Le service doit être fourni par un module chargé par l'application : le minuteur le retrouve où qu'il soit.
 */
import { LinkJobs } from '../links/minimoas/link-jobs';
import { NotificationJobs } from '../notifications/notification-jobs';
import { RituelsJobs } from '../rituels/application/rituels.jobs';
import { BillingJobs } from '../billing/application/billing.jobs';
import { AdminStatsJobs } from '../admin/application/stats.jobs';
import { RetentionJobs } from '../retention/application/retention.jobs';
import { WardrobeJobs } from '../pets/application/wardrobe.jobs';
import { ModerationJobs } from '../moderation/moderation.jobs';
import { GroupJobs } from '../groups/application/group.jobs';
import type { TickJobClass } from './tick-job';

export const TICK_JOBS: ReadonlyArray<{ name: string; job: TickJobClass }> = [
  { name: 'links', job: LinkJobs },
  { name: 'notifications', job: NotificationJobs },
  { name: 'rituels', job: RituelsJobs },
  { name: 'billing', job: BillingJobs },
  { name: 'admin-stats', job: AdminStatsJobs },
  { name: 'retention', job: RetentionJobs },
  { name: 'moderation', job: ModerationJobs },
  { name: 'wardrobe', job: WardrobeJobs },
  { name: 'groups', job: GroupJobs },
];
