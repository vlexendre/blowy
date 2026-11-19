/**
 * Base en mémoire partagée par les dépôts « memory » : mêmes tables que la migration Supabase,
 * y compris les suppressions en cascade (suppression de compte).
 */
import type { EncounterRecord } from '../modules/encounters/ports';
import type { DailyPhotoRecord, LinkRecord, MessageRecord } from '../modules/links/ports';
import type { Profile } from '../modules/me/ports';
import type { ItemSource, PetEventRecord, PetRecord } from '../modules/pets/ports';
import type { BlockRecord, ReportRecord } from '../modules/safety/ports';
import type { StoreNotificationRecord, SubscriptionRecord } from '../modules/billing/ports';
import type { AuditRecord, DailyStatsRow, SuspensionRecord } from '../modules/admin/ports';
import type { ModerationActionKind } from '@blowy/contract';
import type { MatchCacheEntry, PlaceRecord, VisionSnapshot } from '../modules/vision/ports';
import type { VisionSignal } from '@blowy/domain';
import type { DailyChallengeRecord, HabitCheckRecord, HabitRecord, RitualPhotoRecord, RitualStateRecord, WeeklyReviewRecord } from '../modules/rituels/ports';
import type { ChatPetState, ChatReadingDefault } from '@blowy/domain';
import type { AiUsageRecord } from '../integrations/ai/usage-store';
import type { ChatLinkSettingRecord } from '../modules/links/minimoas/ports';
import type { GroupDayRecord, GroupMemberRecord, GroupMessageRecord, GroupRecord, TogetherProposalRecord } from '../modules/groups/ports';
import type { AcquisitionRecord, CreatorRecord, GrowthEventRecord } from '../modules/growth/ports';
import type { FounderRecord, QuizRecord, SignupRecord, ZoneRecord } from '../modules/quartiers/ports';
import type { CheminAnswerRecord, CheminContent, CheminProgressRecord, CheminSessionRecord } from '../modules/chemin/ports';
import type { LiveActivityTokenRecord, NotificationLogRecord, NotificationSettingsRecord, PushDeviceRecord } from '../modules/notifications/ports';

export interface WordVoteRow {
  targetUser: string;
  words: readonly string[];
  voterHash: string;
  createdAt: string;
}

export interface PetItemRow {
  petId: string;
  itemId: string;
  source: ItemSource;
  acquiredAt: string;
}

export class MemoryDb {
  /** auth.users : e-mails connus et comptes supprimés. */
  readonly authEmails = new Map<string, string>();
  readonly deletedUsers = new Set<string>();

  readonly profiles = new Map<string, Profile>();
  readonly pets = new Map<string, PetRecord>();
  readonly petEvents: PetEventRecord[] = [];
  readonly petItems: PetItemRow[] = [];
  readonly wordVotes: WordVoteRow[] = [];
  readonly links = new Map<string, LinkRecord>();
  /** links.write_reminder_on : dernier jour où le lien est passé au rappel « à toi d'écrire ». */
  readonly linkWriteReminders = new Map<string, string>();
  readonly messages: MessageRecord[] = [];
  /** clé `${linkId}:${userId}` → last_read_at */
  readonly linkReads = new Map<string, string>();
  /** Anciennes photos du jour (lecture seule depuis la spéc §24 ; remplies par les tests et la démo seulement). */
  readonly dailyPhotos: DailyPhotoRecord[] = [];
  readonly encounters = new Map<string, EncounterRecord>();
  /** Rencontres proposées, clé `${day}:${userId}`. */
  readonly encounterProposals = new Map<string, { proposed: number; scoreSum: number }>();
  /** clé `${blocker}:${blocked}` */
  readonly blocks = new Map<string, BlockRecord>();
  readonly reports: ReportRecord[] = [];
  /** Vision : positions, observations, profils calculés, cache des personnes compatibles. */
  readonly profilePlaces = new Map<string, PlaceRecord>();
  readonly visionSignals: (VisionSignal & { userId: string })[] = [];
  readonly visionProfiles = new Map<string, VisionSnapshot>();
  readonly matchCache = new Map<string, MatchCacheEntry>();

  /** Rituels : état (série, sortie), défis du jour, habitudes et preuves, photos privées, bilans. */
  readonly ritualStates = new Map<string, RitualStateRecord>();
  readonly dailyChallenges: DailyChallengeRecord[] = [];
  readonly habits = new Map<string, HabitRecord>();
  readonly habitChecks: HabitCheckRecord[] = [];
  readonly ritualPhotos = new Map<string, RitualPhotoRecord>();
  readonly weeklyReviews = new Map<string, WeeklyReviewRecord>();

  /** Plateforme : compteur IA, réglages et compteurs des minimoas du chat, notifications, minuteur. */
  readonly aiUsageDaily = new Map<string, AiUsageRecord>();
  /** clé `${userId}|${day}|${feature}` → appels */
  readonly aiUserCalls = new Map<string, number>();
  /** clé `${linkId}:${userId}` */
  readonly chatLinkSettings = new Map<string, ChatLinkSettingRecord>();
  /** `profiles.chat_reading_default` (absent : « ask »). */
  readonly chatReadingDefaults = new Map<string, ChatReadingDefault>();
  /** `profiles.ai_proofs_consent` et `ai_proofs_consent_at` (absent : jamais demandé). */
  readonly aiProofsConsents = new Map<string, { consent: boolean; at: string }>();
  /** `apple_tokens` : jeton de rafraîchissement d'Apple, par personne (révocation à la suppression). */
  readonly appleTokens = new Map<string, { refreshToken: string; clientId: string; createdAt: string }>();
  /** clé linkId */
  readonly chatPetStates = new Map<string, ChatPetState>();
  /** clé token */
  readonly pushDevices = new Map<string, PushDeviceRecord>();
  /** Jetons APNs des activités en direct, clé token. */
  readonly liveActivityTokens = new Map<string, { record: LiveActivityTokenRecord; disabledAt: string | null }>();
  readonly notificationSettings = new Map<string, NotificationSettingsRecord>();
  readonly notificationLog: NotificationLogRecord[] = [];
  /** clé ticket → jeton et date */
  readonly pushReceipts = new Map<string, { token: string; createdAt: string }>();
  /** clé `${job}|${slot}` */
  readonly tickRuns = new Set<string>();

  /** Minimoa+ : abonnements (clé `${store}:${originalTransactionId}`) et notifications reçues des magasins. */
  readonly subscriptions = new Map<string, SubscriptionRecord>();
  readonly storeNotifications = new Map<string, StoreNotificationRecord>();
  /** Administration : traitement des signalements (clé : identifiant du signalement = rang dans `reports` + 1). */
  readonly reportReviews = new Map<string, { handledAt: string; handledBy: string; resolution: ModerationActionKind }>();
  readonly suspensions = new Map<string, SuspensionRecord>();
  readonly auditLog: AuditRecord[] = [];
  /** Jours d'activité, clé `${day}:${userId}`. */
  readonly activityDays = new Set<string>();
  readonly dailyStats = new Map<string, DailyStatsRow>();
  /** Conservation : dernier jour d'activité et prévenance (colonnes de `profiles`), exclusions, signalements purgés. */
  readonly accountActivity = new Map<string, { lastActiveOn: string; noticedOn: string | null }>();
  readonly bannedIdentities = new Map<string, { bannedAt: string; until: string }>();
  readonly purgedReports = new Set<string>();

  /** Groupes (spéc §26) : groupes, membres (clé `${groupId}:${userId}`), messages, jours jugés, propositions « ensemble ». */
  readonly groups = new Map<string, GroupRecord>();
  /** `groups.invite_code`, clé groupId. */
  readonly groupInviteCodes = new Map<string, string>();
  readonly groupMembers = new Map<string, GroupMemberRecord>();
  readonly groupMessages: GroupMessageRecord[] = [];
  readonly groupDays = new Map<string, GroupDayRecord>();
  readonly togetherProposals = new Map<string, TogetherProposalRecord>();
  /** `habit_jokers`, clé `${userId}:${day}`. */
  readonly habitJokers = new Map<string, string>();
  /** `lifecycle_messages` (messages de fidélisation déjà partis), clé `${userId}|${key}` → `sent_at`. */
  readonly lifecycleMessages = new Map<string, string>();
  /** `profiles.show_habits` vit sur le profil (`Profile.showHabits`). */

  /** Croissance (docs/VIRALITE.md) : créateurs (clé code), sources d'arrivée (clé personne), étapes, compteurs du jour. */
  readonly creators = new Map<string, CreatorRecord>();
  readonly acquisitions = new Map<string, AcquisitionRecord>();
  readonly growthEvents: GrowthEventRecord[] = [];
  /** clé `${day}|${metric}|${source}|${ref}` */
  readonly growthCounters = new Map<string, number>();
  /** Quiz du site (clé code) et quartiers (docs/VIRALITE.md). */
  readonly quizResults = new Map<string, QuizRecord>();
  readonly quartierSettings = { threshold: 50, updatedAt: '' };
  readonly quartiers = new Map<string, ZoneRecord>();
  readonly quartierSignups = new Map<string, SignupRecord>();
  readonly quartierFounders: FounderRecord[] = [];

  /** Ton chemin (docs/CHEMIN.md) : contenu (semé au premier accès par l'adaptateur mémoire), avancement, séances, réponses. */
  cheminContent: CheminContent | null = null;
  readonly cheminProgress = new Map<string, CheminProgressRecord>();
  readonly cheminSessions = new Map<string, CheminSessionRecord>();
  readonly cheminAnswers: CheminAnswerRecord[] = [];

  private sequence = 0;
  nextId(): string {
    this.sequence += 1;
    return String(this.sequence);
  }

  /** Équivalent de `delete from auth.users` et des `on delete cascade / set null` de la migration. */
  deleteUser(userId: string): void {
    this.deletedUsers.add(userId);
    this.authEmails.delete(userId);
    // Les personnes fictives d'un compte de revue partent avec lui (`profiles.review_world`, on delete cascade).
    for (const p of [...this.profiles.values()]) if (p.reviewWorld === userId && p.id !== userId) this.deleteProfile(p.id);
    this.deleteProfile(userId);
  }

  /** Équivalent de `delete from public.profiles` (le compte d'authentification reste) et de ses cascades. */
  deleteProfile(userId: string): void {
    this.profiles.delete(userId);

    const petIds = new Set([...this.pets.values()].filter((p) => p.ownerId === userId).map((p) => p.id));
    for (const id of petIds) this.pets.delete(id);
    removeWhere(this.petEvents, (e) => petIds.has(e.petId));
    removeWhere(this.petItems, (i) => petIds.has(i.petId));
    removeWhere(this.wordVotes, (v) => v.targetUser === userId);

    const linkIds = new Set([...this.links.values()].filter((l) => l.userA === userId || l.userB === userId).map((l) => l.id));
    for (const id of linkIds) {
      this.links.delete(id);
      this.linkWriteReminders.delete(id);
    }
    removeWhere(this.messages, (m) => linkIds.has(m.linkId));
    for (const m of this.messages) if (m.authorId === userId) m.authorId = null;
    for (const key of [...this.linkReads.keys()]) {
      const [linkId, uid] = key.split(':');
      if (uid === userId || (linkId !== undefined && linkIds.has(linkId))) this.linkReads.delete(key);
    }
    removeWhere(this.dailyPhotos, (p) => p.userId === userId || linkIds.has(p.linkId));
    this.ritualStates.delete(userId);
    this.cheminProgress.delete(userId);
    for (const [id, c] of this.cheminSessions) if (c.userId === userId) this.cheminSessions.delete(id);
    removeWhere(this.cheminAnswers, (a) => a.userId === userId);
    removeWhere(this.dailyChallenges, (c) => c.userId === userId);
    for (const [id, h] of this.habits) if (h.userId === userId) this.habits.delete(id);
    removeWhere(this.habitChecks, (c) => c.userId === userId);
    for (const [id, p] of this.ritualPhotos) if (p.userId === userId) this.ritualPhotos.delete(id);
    for (const [id, r] of this.weeklyReviews) if (r.userId === userId) this.weeklyReviews.delete(id);
    this.profilePlaces.delete(userId);
    removeWhere(this.visionSignals, (s) => s.userId === userId);
    this.visionProfiles.delete(userId);
    this.matchCache.delete(userId);
    for (const key of [...this.aiUserCalls.keys()]) if (key.startsWith(`${userId}|`)) this.aiUserCalls.delete(key);
    for (const [key, c] of this.chatLinkSettings) if (c.userId === userId || linkIds.has(c.linkId)) this.chatLinkSettings.delete(key);
    this.chatReadingDefaults.delete(userId);
    this.aiProofsConsents.delete(userId);
    this.appleTokens.delete(userId);
    for (const id of linkIds) this.chatPetStates.delete(id);
    removeWhere(this.messages, (m) => m.visibleTo === userId);
    for (const [token, d] of this.pushDevices) if (d.userId === userId) this.pushDevices.delete(token);
    for (const [token, t] of this.liveActivityTokens) if (t.record.userId === userId || (t.record.linkId !== null && linkIds.has(t.record.linkId))) this.liveActivityTokens.delete(token);
    this.notificationSettings.delete(userId);
    removeWhere(this.notificationLog, (l) => l.userId === userId || (l.linkId !== null && linkIds.has(l.linkId)));

    for (const [id, e] of this.encounters) if (e.fromUser === userId || e.toUser === userId) this.encounters.delete(id);
    for (const key of [...this.encounterProposals.keys()]) if (key.endsWith(`:${userId}`)) this.encounterProposals.delete(key);
    for (const [key, b] of this.blocks) if (b.blocker === userId || b.blocked === userId) this.blocks.delete(key);
    for (const [key, m] of this.groupMembers) {
      if (m.userId === userId) this.groupMembers.delete(key);
      else if (m.invitedBy === userId) m.invitedBy = null;
    }
    for (const g of this.groups.values()) if (g.createdBy === userId) g.createdBy = null;
    for (const m of this.groupMessages) if (m.authorId === userId) m.authorId = null;
    for (const [key, p] of this.togetherProposals) if (p.userId === userId) this.togetherProposals.delete(key);
    for (const key of [...this.habitJokers.keys()]) if (key.startsWith(`${userId}:`)) this.habitJokers.delete(key);
    for (const key of [...this.lifecycleMessages.keys()]) if (key.startsWith(`${userId}|`)) this.lifecycleMessages.delete(key);
    this.acquisitions.delete(userId);
    for (const a of this.acquisitions.values()) if (a.referredBy === userId) a.referredBy = null;
    for (const e of this.growthEvents) if (e.userId === userId) e.userId = null;
    for (const q of this.quartierSignups.values()) {
      if (q.userId === userId) q.userId = null;
      if (q.invitedByUser === userId) q.invitedByUser = null;
    }
    removeWhere(this.quartierFounders, (f) => f.userId === userId);
    for (const s of this.subscriptions.values()) if (s.userId === userId) s.userId = null;
    this.suspensions.delete(userId);
    this.accountActivity.delete(userId);
    for (const key of [...this.activityDays]) if (key.endsWith(`:${userId}`)) this.activityDays.delete(key);
    const messageIds = new Set(this.messages.map((m) => m.id));
    for (const r of this.reports) {
      if (r.messageId && !messageIds.has(r.messageId)) r.messageId = null;
      if (r.reporter === userId) r.reporter = null;
      if (r.targetUser === userId) r.targetUser = null;
      if (r.linkId !== null && linkIds.has(r.linkId)) r.linkId = null;
    }
  }
}

function removeWhere<T>(rows: T[], predicate: (row: T) => boolean): void {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row !== undefined && predicate(row)) rows.splice(i, 1);
  }
}
