/**
 * Un groupe (spéc. §26) : deux onglets comme un lien. « Chat » : les messages, la phrase de confidentialité de l'API en
 * tête du fil, le signalement d'un message par appui long, les événements des minimoas en lignes centrées. « Le
 * groupe » : l'état du jour de chacun (tenu, joker, pas encore), la semaine, les jokers, le réveil d'un groupe endormi,
 * la phrase de transparence, les membres, et renommer / signaler / quitter.
 * Lien profond : `blowy://groupe/<id>` (invitation, message, vie perdue, groupe endormi, groupe « ensemble » démarré).
 */
import { ApiError } from '@blowy/api-client';
import type { GroupDetail, GroupMember, GroupMessage, MemberDayStatusDto } from '@blowy/contract';
import { GROUP_NAME_MAX } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Avatar,
  Banner,
  Button,
  ChatThread,
  Chip,
  type ChipTone,
  Composer,
  EmptyState,
  GroupTemplate,
  Header,
  Icon,
  type MessageLook,
  ScreenTemplate,
  SettingsSection,
  SheetTemplate,
  Skeleton,
  Stagger,
  type StreakDayStatus,
  StreakWeek,
  Text,
  TextField,
} from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/core';
import {
  GroupReportSheet,
  type GroupReportTarget,
  useGroup,
  useGroupJoker,
  useGroupMessages,
  useLeaveGroup,
  useMarkGroupRead,
  useRenameGroup,
  useSendGroupMessage,
  useWakeGroup,
} from '@/features/groups';
import { chatDayLabel, ConfirmSheet, errorText } from '@/features/links';
import { useMe } from '@/features/me';
import { openPlus } from '@/features/plus';
import { chat as chatText, chats as chatsText, today as todayText } from '@/locales/chats';
import { groupes } from '@/locales/groupes';

const t = groupes.group;
type Tab = 'chat' | 'groupe';
const TABS = [
  { key: 'chat', label: t.tabs.chat },
  { key: 'groupe', label: t.tabs.group },
] as const;

export default function GroupScreen() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const id = params.id;
  const router = useRouter();
  const group = useGroup(id);
  const [tab, setTab] = useState<Tab>(params.tab === 'groupe' ? 'groupe' : 'chat');
  const [report, setReport] = useState<GroupReportTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const goChats = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/chats')), [router]);

  const g = group.data;
  if (!g) {
    const gone = group.error instanceof ApiError && (group.error.code === 'not_found' || group.error.code === 'forbidden');
    return (
      <ScreenMotion>
        <ScreenTemplate header={<Header onBack={goChats} backLabel={t.back} />}>
          {group.isPending ? (
            <View style={styles.gap}>
              <Skeleton height={44} radius="pill" />
              <Skeleton height={120} radius="lg" />
              <Skeleton height={220} radius="lg" />
            </View>
          ) : gone ? (
            <EmptyState peek mood="triste" title={t.gone} actionLabel={t.backToChats} onAction={() => router.replace('/(tabs)/chats')} />
          ) : (
            <Banner tone="error" title={t.loadError} text={group.error?.message ?? ''} actionLabel={t.retry} onAction={() => void group.refetch()} />
          )}
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const others = g.members.filter((m) => !m.me);
  const caption =
    g.status === 'forming' ? t.forming(g.memberCount) : g.status === 'asleep' ? t.asleep : g.status === 'closed' ? t.closed : g.habit ? undefined : groupes.list.members(g.memberCount);

  return (
    <ScreenMotion>
      <GroupTemplate
        name={g.name}
        pets={[...others, ...g.members.filter((m) => m.me)].map((m) => m.person.pet)}
        habit={
          g.habit
            ? { lives: g.habit.lives, maxLives: g.habit.maxLives, streak: g.habit.streak, streakUnit: chatsText.streakUnit, livesLabel: t.lives(g.habit.lives, g.habit.maxLives) }
            : null
        }
        caption={caption}
        onBack={goChats}
        backLabel={t.back}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        scroll={tab === 'groupe'}
        refreshControl={<Refresh id={g.id} />}
        notice={notice ? <Banner tone="success" text={notice} onClose={() => setNotice(null)} closeLabel={t.cancel} /> : undefined}
        footer={tab === 'chat' ? <GroupComposer group={g} /> : undefined}
      >
        {tab === 'chat' ? (
          <ChatBody group={g} onReport={(m) => setReport({ kind: 'message', messageId: m.id, quote: m.body })} />
        ) : (
          <GroupBody group={g} onReport={setReport} onLeft={() => router.replace('/(tabs)/chats')} />
        )}
      </GroupTemplate>
      <GroupReportSheet
        groupId={g.id}
        target={report}
        onClose={() => setReport(null)}
        onDone={() => {
          setReport(null);
          setNotice(groupes.report.done);
        }}
      />
    </ScreenMotion>
  );
}

function Refresh({ id, ...rest }: { id: string }) {
  const group = useGroup(id);
  const [refreshing, setRefreshing] = useState(false);
  return (
    <RefreshControl
      {...rest}
      refreshing={refreshing}
      tintColor={color.mute}
      onRefresh={async () => {
        setRefreshing(true);
        await group.refetch();
        setRefreshing(false);
      }}
    />
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────
const toLook = (m: GroupMessage): MessageLook => ({
  id: m.id,
  // Les minimoas ne parlent que d'événements : une ligne centrée, comme les annonces du système.
  author: m.author === 'me' ? 'me' : m.author === 'member' ? 'other' : 'system',
  kind: m.kind === 'event' || m.author === 'minimoa' || m.author === 'system' ? 'event' : 'text',
  body: m.body,
  mediaUrl: null,
  at: m.at,
});

function ChatBody({ group, onReport }: { group: GroupDetail; onReport: (m: GroupMessage) => void }) {
  const thread = useGroupMessages(group.id);
  useMarkGroupRead(group.id, thread.messages.at(-1)?.id);
  const dayLabel = useCallback((day: string) => chatDayLabel(day), []);
  const me = group.members.find((m) => m.me);
  const first = group.members.find((m) => !m.me) ?? me;
  const byId = useMemo(() => new Map(thread.messages.map((m) => [m.id, m])), [thread.messages]);
  const people = useMemo(() => new Map(group.members.map((m) => [m.person.id, m.person])), [group.members]);
  const whoIs = useCallback(
    (look: MessageLook) => {
      const m = byId.get(look.id);
      if (!m?.authorId) return undefined;
      const person = people.get(m.authorId);
      // Ancien membre : son prénom tel que le message le garde, sans visage.
      return person ? { key: m.authorId, name: person.displayName, person } : first ? { key: m.authorId, name: m.authorName ?? '', person: first.person } : undefined;
    },
    [byId, people, first],
  );
  const looks = useMemo(() => thread.messages.map(toLook), [thread.messages]);

  if (thread.isPending) {
    return (
      <View style={[styles.gap, styles.padded]}>
        <Skeleton width="60%" height={52} radius="lg" />
        <Skeleton width="50%" height={44} radius="lg" style={styles.right} />
        <Skeleton width="70%" height={64} radius="lg" />
      </View>
    );
  }
  if (thread.isError && thread.messages.length === 0) {
    return (
      <View style={styles.padded}>
        <Banner tone="error" title={chatText.loadError} text={thread.error.message} actionLabel={t.retry} onAction={() => void thread.refetch()} />
      </View>
    );
  }
  if (!me || !first) return null;
  // La même phrase de confidentialité que les liens (servie par l'API), au début du fil.
  const privacy = (
    <Text size={13} muted center style={styles.privacy}>
      {group.privacy}
    </Text>
  );
  return (
    <ChatThread
      messages={looks}
      myPet={me.person.pet}
      other={first.person}
      whoIs={whoIs}
      dayLabel={dayLabel}
      header={privacy}
      onEndReached={() => {
        if (thread.hasNextPage && !thread.isFetchingNextPage) void thread.fetchNextPage();
      }}
      loadingOlder={thread.isFetchingNextPage}
      onMessageLongPress={(m) => {
        const found = byId.get(m.id);
        if (found) onReport(found);
      }}
      longPressHint={chatText.longPressHint}
      empty={
        <View style={styles.gap}>
          <EmptyState peek seed={group.id} species={me.person.pet.species} mood="salut" title={t.emptyTitle} text={t.emptyText} />
          {privacy}
        </View>
      }
    />
  );
}

function GroupComposer({ group }: { group: GroupDetail }) {
  const send = useSendGroupMessage(group.id);
  const [draft, setDraft] = useState('');
  const closed = group.status === 'closed';
  const refused = send.error instanceof ApiError && send.error.code === 'content_refused' ? send.error.message : null;
  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body, { onSuccess: () => setDraft('') });
  };
  return (
    <View style={styles.composer}>
      {refused ? (
        <Banner tone="error" title={refused} text={chatText.refusedKeep} onClose={() => send.reset()} closeLabel={todayText.dismiss} />
      ) : send.isError ? (
        <Banner tone="error" title={chatText.notSent} text={errorText(send.error, chatText.sendError)} onClose={() => send.reset()} closeLabel={todayText.dismiss} />
      ) : null}
      <Composer
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          if (send.isError) send.reset();
        }}
        onSend={submit}
        placeholder={t.placeholder}
        disabled={closed}
        disabledText={t.closedComposer}
        sending={send.isPending}
        sendLabel={chatText.send}
        maxLength={2000}
      />
    </View>
  );
}

// ── Le groupe ──────────────────────────────────────────────────────────────────
const STATUS_TONE: Record<MemberDayStatusDto, ChipTone> = { kept: 'accent', joker: 'violet', missed: 'coral', pending: 'glass', not_due: 'glass' };
const WEEK_STATUS: Record<GroupDetail['week'][number]['outcome'], StreakDayStatus> = {
  kept: 'done',
  missed: 'missed',
  skipped: 'not_yet',
  pending: 'today',
  future: 'future',
  before: 'not_yet',
};
const weekdayOf = (day: string): number => new Date(`${day}T12:00:00Z`).getUTCDay();

function GroupBody({ group, onReport, onLeft }: { group: GroupDetail; onReport: (t: GroupReportTarget) => void; onLeft: () => void }) {
  const me = useMe();
  const joker = useGroupJoker(group.id);
  const wake = useWakeGroup(group.id);
  const rename = useRenameGroup(group.id);
  const leave = useLeaveGroup();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);
  const [leaving, setLeaving] = useState(false);
  const h = group.habit;
  const asleep = group.status === 'asleep';
  const today = h?.today.day;
  const plus = me.data?.plus ?? false;

  const memberRow = (m: GroupMember) => {
    const label = m.me ? t.you : m.person.displayName;
    const status = h && m.today ? m.today : null;
    // Hier, tant qu'il n'est pas jugé (avant midi) et qu'il manque : dit sous le prénom.
    const yesterday = h && m.yesterday === 'pending' ? t.yesterday(t.status.pending) : m.creator && !h ? t.creator : undefined;
    return {
      key: m.person.id,
      title: label,
      subtitle: yesterday,
      left: <Avatar size={34} pet={m.person.pet} hidden />,
      right: status && !asleep ? <Chip label={t.status[status]} tone={STATUS_TONE[status]} size="sm" /> : undefined,
      chevron: false,
      // Toucher un autre membre : le signaler (la modération voit le groupe et ses messages autour).
      onPress: m.me ? undefined : () => onReport({ kind: 'member', userId: m.person.id, name: m.person.displayName }),
      accessibilityLabel: [label, status ? t.status[status] : null, yesterday].filter(Boolean).join(', '),
    };
  };
  const members = [...group.members].sort((a, b) => Number(b.me) - Number(a.me));

  const jokers = group.jokers;
  const jokerRow =
    h && jokers && !asleep && group.status === 'active'
      ? jokers.canPlaceFor
        ? {
            key: 'joker',
            title: jokers.canPlaceFor === today ? t.jokerToday : t.jokerYesterday,
            subtitle: t.jokersLeft(jokers.left),
            left: <Icon name="etoiles" size={26} />,
            onPress: () => {
              if (jokers.canPlaceFor) joker.mutate(jokers.canPlaceFor);
            },
            disabled: joker.isPending,
          }
        : jokers.left === 0 && h.today.mine === 'pending'
          ? { key: 'joker', title: t.noJoker, left: <Icon name="etoiles" size={26} />, onPress: plus ? undefined : () => openPlus('jokers'), chevron: !plus }
          : null
      : null;

  const week = group.week.map((d) => ({
    letter: todayText.weekDays[weekdayOf(d.day)] ?? '',
    status: WEEK_STATUS[d.outcome],
    label: `${chatDayLabel(d.day)} : ${t.week[d.outcome]}`,
  }));

  return (
    <View style={styles.body}>
      <Stagger onceKey={`groupe:${group.id}`} step={60}>
        {asleep ? (
          <Banner
            key="asleep"
            tone="info"
            title={t.asleepTitle}
            text={t.asleepText}
            actionLabel={group.canWake ? t.wake : undefined}
            onAction={group.canWake ? () => wake.mutate() : undefined}
            actionBelow
          />
        ) : null}
        {wake.isError ? <Banner key="wakeError" tone="error" text={errorText(wake.error, t.wakeError)} /> : null}
        {group.status === 'forming' ? (
          <Banner key="forming" tone="info" text={[t.formingText, group.invited > 0 ? t.invited(group.invited) : null].filter(Boolean).join(' ')} />
        ) : null}

        {h ? (
          <SettingsSection
            key="today"
            title={asleep ? `${t.membersTitle} · ${group.memberCount}` : `${t.todayTitle} · ${t.todayCount(h.today.upToDate, h.today.due)}`}
            rows={[...members.map(memberRow), ...(jokerRow ? [jokerRow] : [])]}
            footer={group.transparency ?? undefined}
          />
        ) : (
          <SettingsSection key="members" title={`${t.membersTitle} · ${group.memberCount}`} rows={members.map(memberRow)} />
        )}
        {joker.isError ? <Banner key="jokerError" tone="error" text={errorText(joker.error, t.jokerError)} onClose={() => joker.reset()} closeLabel={t.cancel} /> : null}

        {h && week.length ? (
          <View key="week" style={styles.week}>
            <Text variant="label" size={13} muted style={styles.label}>
              {t.weekTitle}
            </Text>
            <StreakWeek days={week} animateKey={`${group.id}:${week[0]?.letter ?? ''}:${group.week[0]?.day ?? ''}`} />
          </View>
        ) : null}

        <SettingsSection
          key="settings"
          title={t.settingsTitle}
          rows={[
            ...(group.status !== 'closed'
              ? [
                  {
                    key: 'rename',
                    title: t.rename,
                    onPress: () => {
                      rename.reset();
                      setName(group.name);
                      setRenaming(true);
                    },
                  },
                ]
              : []),
            { key: 'report', title: t.report, onPress: () => onReport({ kind: 'group' }) },
            { key: 'leave', title: t.leave, destructive: true, onPress: () => setLeaving(true) },
          ]}
        />
      </Stagger>

      <SheetTemplate
        visible={renaming}
        onClose={() => setRenaming(false)}
        title={t.renameTitle}
        closeLabel={t.cancel}
        footer={
          <Button
            label={t.renameSave}
            loading={rename.isPending}
            disabled={!name.trim() || name.trim() === group.name}
            onPress={() => rename.mutate(name.trim(), { onSuccess: () => setRenaming(false) })}
          />
        }
      >
        <TextField label={groupes.create.nameLabel} value={name} onChangeText={setName} maxLength={GROUP_NAME_MAX} autoFocus />
        {rename.isError ? <Banner tone="error" text={errorText(rename.error, t.renameError)} /> : null}
      </SheetTemplate>

      <ConfirmSheet
        visible={leaving}
        onClose={() => setLeaving(false)}
        title={t.leaveTitle(group.name)}
        text={t.leaveText}
        confirmLabel={t.leave}
        onConfirm={() => leave.mutate(group.id, { onSuccess: onLeft })}
        loading={leave.isPending}
        error={leave.isError ? errorText(leave.error, t.leaveError) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12, paddingTop: 8 },
  padded: { paddingHorizontal: 16 },
  right: { alignSelf: 'flex-end' },
  body: { gap: 8, paddingTop: 4, paddingBottom: 24 },
  composer: { gap: 8 },
  privacy: { paddingHorizontal: 24, paddingVertical: 8 },
  week: { gap: 6 },
  label: { letterSpacing: 1.2, marginLeft: 4 },
});
