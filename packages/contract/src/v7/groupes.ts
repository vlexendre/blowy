/**
 * Contrat « habitudes partagées, rigueur et groupes » (spéc V7 §25 et §26).
 *
 * - Rigueur et habitudes partagées : `RigourZ`, `SharedHabitsZ` dans `v7/rituels.ts` (montrées sur la fiche d'une
 *   rencontre et dans un lien, champ `sharedHabits`).
 * - Groupes : libre (un chat) ou d'habitude (série, 5 vies, état du jour de chacun, jokers). Chacun voit des autres ce
 *   qu'un lien voit (prénom, minimoa), rien de plus : ni position, ni âge, ni vision.
 * - « La tenir ensemble » : un nombre seulement (jamais d'identité ni de position) ; dire oui envoie une proposition,
 *   le groupe démarre quand 3 personnes ont dit oui.
 *
 * Jours au format AAAA-MM-JJ, jours de Paris. Ce fichier ne dépend que de zod, du domaine et, sans l'évaluer au
 * chargement (`z.lazy`), de `PersonZ` et `REPORT_REASONS` de `../index` : l'import est circulaire, donc rien de
 * `../index` n'est lu au chargement, et `../index` n'utilise rien d'ici.
 */
import {
  GROUP_DAY_OUTCOMES,
  GROUP_KINDS,
  GROUP_MAX_INVITES,
  GROUP_MAX_LIVES,
  GROUP_NAME_MAX,
  GROUP_STATUSES,
  MEMBER_DAY_STATUSES,
} from '@blowy/domain';
import { z } from 'zod';
import { PersonZ, REPORT_REASONS } from '../index';

const Iso = z.string();
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Id = z.string().uuid();
/** Personne vue par un membre du groupe ou une rencontre : comme dans un lien (prénom, minimoa ; visage caché). */
const PersonRef = z.lazy(() => PersonZ);

// ── Groupes ────────────────────────────────────────────────────────────────
export const GroupKindZ = z.enum(GROUP_KINDS);
export const GroupStatusZ = z.enum(GROUP_STATUSES);
/** kept · joker · missed (jour jugé) · pending (pas encore jugé : aujourd'hui, ou hier avant midi) · not_due. */
export const MemberDayStatusZ = z.enum(MEMBER_DAY_STATUSES);
export type MemberDayStatusDto = z.infer<typeof MemberDayStatusZ>;

/** La série et les vies d'un groupe d'habitude (null pour un groupe libre). */
export const GroupHabitZ = z.object({
  habitId: z.string(),
  label: z.string(),
  lives: z.number().int().min(0).max(GROUP_MAX_LIVES),
  maxLives: z.number().int(),
  streak: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  /** Aujourd'hui : membres à jour (tenu ou joker) sur les membres dus. */
  today: z.object({ day: Day, upToDate: z.number().int(), due: z.number().int(), mine: MemberDayStatusZ }),
});
export type GroupHabit = z.infer<typeof GroupHabitZ>;

/** Un groupe dans la liste (onglet Chats). */
export const GroupSummaryZ = z.object({
  id: Id,
  name: z.string(),
  kind: GroupKindZ,
  /** forming : en attente de 3 membres · active · asleep : plus de vies (chat lisible, réveil possible) · closed : fermé par la modération. */
  status: GroupStatusZ,
  memberCount: z.number().int(),
  habit: GroupHabitZ.nullable(),
  unread: z.number().int(),
  lastMessage: z.object({ preview: z.string(), at: Iso }).nullable(),
  createdAt: Iso,
});
export type GroupSummary = z.infer<typeof GroupSummaryZ>;

/** Invitation reçue, à accepter ou refuser. Les autres invités ne sont jamais nommés. */
export const GroupInvitationZ = z.object({
  groupId: Id,
  name: z.string(),
  kind: GroupKindZ,
  habitId: z.string().nullable(),
  habitLabel: z.string().nullable(),
  invitedBy: PersonRef,
  /** Membres qui ont déjà accepté. */
  memberCount: z.number().int(),
  /** Tu ne suis pas encore cette habitude : l'accepter l'ajoute à tes habitudes (dans ta limite). */
  addsHabit: z.boolean(),
  /** Dit avant de rejoindre un groupe d'habitude (état du jour de chacun) ; null pour un groupe libre. */
  transparency: z.string().nullable(),
  at: Iso,
});
export type GroupInvitation = z.infer<typeof GroupInvitationZ>;

export const GroupsZ = z.object({
  groups: z.array(GroupSummaryZ),
  invitations: z.array(GroupInvitationZ),
  /** Groupes à la fois (membre ou en formation) : 2 sans Minimoa+, 10 avec. */
  limit: z.number().int(),
  used: z.number().int(),
  canCreate: z.boolean(),
});
export type Groups = z.infer<typeof GroupsZ>;

/** Un membre vu par les autres : ce qu'un lien voit, et son état du jour dans un groupe d'habitude. */
export const GroupMemberZ = z.object({
  person: PersonRef,
  me: z.boolean(),
  creator: z.boolean(),
  /** Groupe d'habitude : aujourd'hui, et hier tant qu'hier n'est pas jugé (avant midi) ; null pour un groupe libre. */
  today: MemberDayStatusZ.nullable(),
  yesterday: MemberDayStatusZ.nullable(),
});
export type GroupMember = z.infer<typeof GroupMemberZ>;

/** Un jour de la semaine d'un groupe d'habitude (lundi → dimanche). */
export const GroupWeekDayZ = z.object({
  day: Day,
  /** kept · missed · skipped (personne n'avait rien à faire) · pending (pas encore jugé) · future · before (avant le groupe ou pendant son sommeil). */
  outcome: z.enum([...GROUP_DAY_OUTCOMES, 'pending', 'future', 'before']),
});

export const GroupDetailZ = GroupSummaryZ.extend({
  members: z.array(GroupMemberZ),
  /** Invitations en attente (nombre seulement). */
  invited: z.number().int(),
  /** Places encore libres (8 au plus, invitations comprises). */
  seatsLeft: z.number().int(),
  /** Semaine du groupe d'habitude ; vide pour un groupe libre. */
  week: z.array(GroupWeekDayZ),
  /** Tes jokers (les mêmes que ceux de la série du défi) ; null pour un groupe libre. */
  jokers: z
    .object({
      left: z.number().int(),
      perWeek: z.number().int(),
      /** Jour pour lequel tu peux poser un joker maintenant (aujourd'hui, ou hier avant midi s'il te manque), sinon null. */
      canPlaceFor: Day.nullable(),
    })
    .nullable(),
  canWake: z.boolean(),
  /** Phrase de transparence (groupe d'habitude) ; null pour un groupe libre. */
  transparency: z.string().nullable(),
  /** Même engagement que dans les liens, sans IA. */
  privacy: z.string(),
});
export type GroupDetail = z.infer<typeof GroupDetailZ>;

/** Message de groupe vu par toi. Les minimoas ne parlent que pour des événements (aucune IA ne lit le groupe). */
export const GroupMessageZ = z.object({
  id: Id,
  groupId: Id,
  /** me · member (`authorId`, `authorName`) · minimoa (événement dit par le minimoa de `authorId`) · system. */
  author: z.enum(['me', 'member', 'minimoa', 'system']),
  authorId: Id.nullable(),
  /** Prénom du membre ou nom du minimoa ; null pour le système ou un compte supprimé. */
  authorName: z.string().nullable(),
  kind: z.enum(['text', 'event']),
  body: z.string(),
  at: Iso,
});
export type GroupMessage = z.infer<typeof GroupMessageZ>;
export const GroupMessagesPageZ = z.object({ messages: z.array(GroupMessageZ), nextBefore: Iso.nullable() });
export type GroupMessagesPage = z.infer<typeof GroupMessagesPageZ>;

/** Réponse d'une action dans un groupe : le groupe à jour et les nouveaux messages. */
export const GroupActionZ = z.object({ group: GroupDetailZ, messages: z.array(GroupMessageZ) });
export type GroupAction = z.infer<typeof GroupActionZ>;

export const CreateGroupBody = z
  .object({
    name: z.string().trim().min(1).max(GROUP_NAME_MAX),
    kind: GroupKindZ,
    /** Habitude du catalogue (groupe d'habitude seulement). */
    habitId: z.string().min(1).max(40).optional(),
    /**
     * Jusqu'à 7 personnes parmi tes liens vivants ; chacune reçoit une invitation. Peut être vide : le groupe se remplit
     * avec son lien d'invitation (`minimoa.app/g/<code>`). Les anciennes apps en envoient au moins 2.
     */
    memberIds: z.array(Id).max(GROUP_MAX_INVITES),
  })
  .refine((b) => (b.kind === 'habit') === (b.habitId !== undefined), {
    message: 'habitId requis pour un groupe d’habitude, interdit sinon',
    path: ['habitId'],
  });
export type CreateGroupBody = z.infer<typeof CreateGroupBody>;
export const InviteToGroupBody = z.object({ memberIds: z.array(Id).min(1).max(GROUP_MAX_INVITES) });
export const RenameGroupBody = z.object({ name: z.string().trim().min(1).max(GROUP_NAME_MAX) });
export const SendGroupMessageBody = z.object({ body: z.string().trim().min(1).max(2000) });
export type SendGroupMessageBody = z.infer<typeof SendGroupMessageBody>;
/** Poser un joker pour le jour du groupe : aujourd'hui, ou hier jusqu'à midi. */
export const GroupJokerBody = z.object({ day: Day });
/** Signaler un message, un membre ou le groupe (sans `messageId` ni `userId`). */
export const GroupReportBody = z.object({
  reason: z.lazy(() => z.enum(REPORT_REASONS)),
  messageId: Id.optional(),
  userId: Id.optional(),
  details: z.string().trim().max(1000).optional(),
});
export type GroupReportBody = z.infer<typeof GroupReportBody>;

// ── « La tenir ensemble » ──────────────────────────────────────────────────
/** Une suggestion par habitude suivie : le nombre de personnes seulement (au moins 2). */
export const TogetherSuggestionZ = z.object({
  habitId: z.string(),
  label: z.string(),
  count: z.number().int().min(2),
  /** « 3 personnes près de toi tiennent la même habitude : Sport. La tenir ensemble ? » */
  text: z.string(),
  /** Tu as déjà dit oui : on attend que d'autres le disent. */
  proposed: z.boolean(),
});
export type TogetherSuggestion = z.infer<typeof TogetherSuggestionZ>;
export const TogetherZ = z.object({ suggestions: z.array(TogetherSuggestionZ) });
export type Together = z.infer<typeof TogetherZ>;
export const TogetherBody = z.object({ habitId: z.string().min(1).max(40) });
/** waiting : ta proposition attend · started : le groupe a démarré (`groupId`). */
export const TogetherResultZ = z.object({
  status: z.enum(['waiting', 'started']),
  groupId: Id.nullable(),
  line: z.string(),
});
export type TogetherResult = z.infer<typeof TogetherResultZ>;

// ── Administration ─────────────────────────────────────────────────────────
export const AdminGroupZ = z.object({
  id: Id,
  name: z.string(),
  kind: GroupKindZ,
  status: GroupStatusZ,
  memberCount: z.number().int(),
  createdAt: Iso,
  closedAt: Iso.nullable(),
  closedReason: z.string().nullable(),
});
export type AdminGroup = z.infer<typeof AdminGroupZ>;
export const AdminCloseGroupBody = z.object({ reason: z.string().trim().min(3).max(500) });

// ── Routes ─────────────────────────────────────────────────────────────────
const API = '/v1/groups';
export const groupRoutes = {
  /** `GET` : tes groupes, tes invitations, ta limite · `POST` (`CreateGroupBody`) : créer. */
  groups: () => API,
  /** `GET` : le détail · `PATCH` (`RenameGroupBody`) : renommer. */
  group: (id: string) => `${API}/${id}`,
  invite: (id: string) => `${API}/${id}/invite`,
  accept: (id: string) => `${API}/${id}/accept`,
  decline: (id: string) => `${API}/${id}/decline`,
  leave: (id: string) => `${API}/${id}/leave`,
  wake: (id: string) => `${API}/${id}/wake`,
  /** `GET ?before=` : les messages · `POST` (`SendGroupMessageBody`) : écrire. */
  messages: (id: string) => `${API}/${id}/messages`,
  read: (id: string) => `${API}/${id}/read`,
  joker: (id: string) => `${API}/${id}/joker`,
  report: (id: string) => `${API}/${id}/report`,
  /** `GET` : suggestions « la tenir ensemble » (nombres seulement) · `POST` (`TogetherBody`) : dire oui. */
  together: () => '/v1/together',
  /** `DELETE` : retirer sa proposition pour cette habitude. */
  togetherHabit: (habitId: string) => `/v1/together/${encodeURIComponent(habitId)}`,
  adminGroup: (id: string) => `/admin/groups/${id}`,
  adminGroupClose: (id: string) => `/admin/groups/${id}/close`,
} as const;
