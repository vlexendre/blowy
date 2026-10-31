export const GROUP_MIN = 3;
export const GROUP_MAX = 5;

export type GroupStatus = 'FORMING' | 'ACTIVE' | 'UNDERSIZED' | 'ARCHIVED';

export type LeagueKind = 'PETS' | 'FRIENDS' | 'NEIGHBORHOODS' | 'GROUPS';

export type MissionSubmissionStatus =
  | 'UPLOADED'
  | 'PENDING_ANALYSIS'
  | 'CONSISTENT'
  | 'INCONSISTENT'
  | 'UNCERTAIN'
  | 'HUMAN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type EggStatus = 'INCUBATING' | 'READY_TO_HATCH' | 'HATCHED';
