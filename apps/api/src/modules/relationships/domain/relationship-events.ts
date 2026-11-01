/** Types d'événements du journal relationnel et clés des messages système pré-écrits. */
export const REL_EVENTS = {
  CREATED: 'relationship.created',
  PAUSED: 'relationship.paused',
  LEFT: 'relationship.left',
  ENDED: 'relationship.ended',
  MOVE_IN_PROPOSED: 'relationship.move_in_proposed',
  MOVE_IN_ACCEPTED: 'relationship.move_in_accepted',
  MOVED_IN: 'relationship.moved_in',
  BRANCH_ROUND_OPENED: 'relationship.branch_round_opened',
  BRANCH_RESOLVED: 'relationship.branch_resolved',
  BRANCH_DOWNGRADED: 'relationship.branch_downgraded',
  XP_GAINED: 'relationship.xp_gained',
  LEVEL_REACHED: 'relationship.level_reached',
} as const;

/** Message système pré-écrit, présenté comme tel (jamais la voix de l'utilisateur). */
export const SYSTEM_TEMPLATES = {
  CLEAN_LEAVE: 'system.leave.clean',
  MOVED_IN_ELSEWHERE: 'system.leave.moved_in_elsewhere',
  SILENCE_14D: 'system.leave.silence',
  MATCHED: 'system.match.created',
  MOVED_IN: 'system.moved_in',
} as const;
