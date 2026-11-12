import { levelLabel } from '@blowy/content';
import type { Link } from '@blowy/contract';
import { LEVEL_KEYS, MAX_LEVEL, MAX_LIVES, levelProgress } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Avatar,
  Banner,
  ChatThread,
  Composer,
  type ComposerTone,
  EmptyState,
  GhostPanel,
  Header,
  LinkTemplate,
  LivesPanel,
  MemoriesPanel,
  MemoryGrid,
  PetImage,
  ScreenTemplate,
  Skeleton,
  Text,
  Title,
  TodayCard,
  TodoRow,
} from '@blowy/ui';
import { ApiError } from '@blowy/api-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import {
  chatDayLabel,
  chronological,
  errorText,
  PhotoSourceSheet,
  shortDay,
  useArchiveLink,
  useLink,
  useMarkRead,
  useMemories,
  useMessages,
  useRevive,
  useSendMessage,
  useSendPhoto,
  weekStrip,
} from '@/features/links';
import { chat as chatText, ghost as ghostText, link as t, memories as memText, today as todayText } from '@/locales/chats';

type Tab = 'today' | 'chat' | 'memories';
const TABS = [
  { key: 'today', label: t.tabs.today },
  { key: 'chat', label: t.tabs.chat },
  { key: 'memories', label: t.tabs.memories },
] as const;
const isTab = (v: unknown): v is Tab => v === 'today' || v === 'chat' || v === 'memories';

export default function LinkScreen() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const id = params.id;
  const router = useRouter();
  const link = useLink(id);
  const [tab, setTab] = useState<Tab | null>(isTab(params.tab) ? params.tab : null);
  // Un lien profond (`?tab=today`) vers un écran déjà ouvert change d'onglet.
  useEffect(() => {
    if (isTab(params.tab)) setTab(params.tab);
  }, [params.tab]);
  const [draft, setDraft] = useState('');
  const [tone, setTone] = useState<ComposerTone | null>(null);
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const l = link.data;
  const goChats = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/chats')), [router]);

  // Lien quitté, ou disparu (blocage) : retour à la liste.
  const gone = l?.status === 'archived' || (link.error instanceof ApiError && (link.error.code === 'not_found' || link.error.code === 'forbidden'));
  useEffect(() => {
    if (l?.status === 'archived') router.replace('/(tabs)/chats');
  }, [l?.status, router]);

  if (!l) {
    return (
      <ScreenTemplate header={<Header onBack={goChats} backLabel={t.back} />}>
        {link.isPending ? (
          <View style={styles.gap}>
            <Skeleton height={44} radius="pill" />
            <Skeleton height={320} radius="xl" />
            <Skeleton height={140} radius="lg" />
          </View>
        ) : gone ? (
          <EmptyState mood="triste" title={t.gone} actionLabel={t.backToChats} onAction={() => router.replace('/(tabs)/chats')} />
        ) : (
          <Banner tone="error" title={t.loadError} text={link.error?.message ?? ''} actionLabel={t.retry} onAction={() => void link.refetch()} />
        )}
      </ScreenTemplate>
    );
  }

  const ghost = l.status === 'ghost';
  // Par défaut : le chat (maquettes : une ligne de la liste ouvre V6-Chat) ; un lien fantôme ouvre son état (V6-Fantome).
  const active: Tab = tab ?? (ghost ? 'today' : 'chat');

  // Lien fantôme : écran plein, sans onglets (V6-Fantome).
  if (ghost) return <GhostBody link={l} onBack={goChats} onLeft={() => router.replace('/(tabs)/chats')} />;

  const nudge = () => {
    setDraft(todayText.nudgeDraft);
    setTab('chat');
  };

  return (
    <>
      <LinkTemplate
        other={l.other}
        myPet={l.myPet}
        lives={l.lives}
        ghost={ghost}
        levelLabel={t.level(l.level)}
        onLevelPress={() => router.push(`/link/${l.id}/niveaux`)}
        onBack={goChats}
        backLabel={t.back}
        livesLabel={t.lives(l.lives)}
        onOptions={() => router.push(`/link/${l.id}/options`)}
        optionsLabel={t.options}
        tabs={TABS}
        activeTab={active}
        onTabChange={setTab}
        scroll={active !== 'chat'}
        refreshControl={<Refresh linkId={l.id} />}
        footer={
          active === 'chat' ? (
            <ChatComposer link={l} draft={draft} setDraft={setDraft} tone={tone} setTone={setTone} onAttach={() => setPicking(true)} notice={notice} onNotice={setNotice} />
          ) : undefined
        }
      >
        {notice && active !== 'chat' ? (
          <View style={styles.notice}>
            <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
          </View>
        ) : null}
        {active === 'today' ? (
          <TodayBody link={l} onPick={() => setPicking(true)} onNudge={nudge} onLevels={() => router.push(`/link/${l.id}/niveaux`)} />
        ) : active === 'chat' ? (
          <ChatBody link={l} />
        ) : (
          <MemoriesBody link={l} />
        )}
      </LinkTemplate>
      <PhotoSender link={l} visible={picking} onClose={() => setPicking(false)} onNotice={setNotice} />
    </>
  );
}

/** Tirer pour rafraîchir le lien et ses souvenirs. */
function Refresh({ linkId, ...rest }: { linkId: string }) {
  const link = useLink(linkId);
  const memories = useMemories(linkId);
  const [refreshing, setRefreshing] = useState(false);
  return (
    <RefreshControl
      {...rest}
      refreshing={refreshing}
      tintColor={color.mute}
      onRefresh={async () => {
        setRefreshing(true);
        await Promise.all([link.refetch(), memories.refetch()]);
        setRefreshing(false);
      }}
    />
  );
}

// ── Photo du jour : choix de la source puis envoi ────────────────────────────
type Notice = { tone: 'success' | 'error' | 'info'; text: string };

function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  return <Banner tone={notice.tone} text={notice.text} onClose={notice.tone === 'info' ? undefined : onClose} closeLabel={todayText.dismiss} />;
}

function PhotoSender({ link, visible, onClose, onNotice }: { link: Link; visible: boolean; onClose: () => void; onNotice: (n: Notice | null) => void }) {
  const send = useSendPhoto(link.id);
  const linkQuery = useLink(link.id);

  const pick = (source: 'camera' | 'library') => {
    onClose();
    onNotice(null);
    send.mutate(source, {
      onSuccess: (sent) => onNotice(sent ? { tone: 'success', text: todayText.sent } : null),
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'already_done') void linkQuery.refetch();
        onNotice({ tone: 'error', text: errorText(e, todayText.failed, { already_done: todayText.alreadyDone, link_not_active: todayText.notActive }) });
      },
    });
  };
  useEffect(() => {
    if (send.isPending) onNotice({ tone: 'info', text: todayText.sending });
  }, [send.isPending, onNotice]);

  return <PhotoSourceSheet visible={visible} onClose={onClose} onPick={pick} />;
}

// ── Aujourd'hui ─────────────────────────────────────────────────────────────
function TodayBody({ link, onPick, onNudge, onLevels }: { link: Link; onPick: () => void; onNudge: () => void; onLevels: () => void }) {
  const memories = useMemories(link.id);
  const { today, other } = link;
  const name = other.displayName;
  const progress = levelProgress(link.xp);
  const nextKey = LEVEL_KEYS[link.level];
  const atMax = link.level >= MAX_LEVEL || !nextKey;

  return (
    <View style={styles.body}>
      <TodayCard
        today={today}
        otherPet={other.pet}
        streak={link.streak}
        labels={{
          title: todayText.title,
          streakUnit: todayText.streakUnit(link.streak),
          hint: todayText.hint,
          mine: { label: todayText.mineLabel, badge: todayText.mineBadge, emptyTitle: todayText.mineEmpty, emptyCaption: todayText.mineEmptyCaption },
          theirs: {
            waitingTitle: todayText.theirsWaiting(name),
            waitingCaption: todayText.theirsWaitingCaption,
            lockedTitle: todayText.theirsLocked(name),
            lockedCaption: todayText.theirsLockedCaption,
            label: todayText.theirsLabel(name),
          },
          cta: today.mine ? todayText.ctaNudge(name) : todayText.ctaTake,
        }}
        onCta={today.mine && today.theirs ? undefined : today.mine ? onNudge : onPick}
        onMinePress={today.mine ? undefined : onPick}
      />
      <LivesPanel
        lives={link.lives}
        max={MAX_LIVES}
        count={todayText.livesCount(link.lives)}
        weekTitle={todayText.weekTitle}
        week={weekStrip(memories.data, today.day, today)}
        accessibilityLabel={t.lives(link.lives)}
      />
      <Text variant="label" size={11} muted style={styles.todoTitle}>
        {todayText.todoTitle}
      </Text>
      <TodoRow
        tile={atMax ? <PetImage art="oeuf" size={38} /> : <Avatar size={34} pet={other.pet} hidden />}
        tileGradient={atMax ? 'rose' : 'violet'}
        title={atMax ? levelLabel.oeuf.title : todayText.nextTodo(link.level + 1, levelLabel[nextKey].title)}
        subtitle={atMax ? todayText.maxText : levelLabel[nextKey].text}
        chip={atMax ? undefined : todayText.nextChip(Math.max(0, progress.span - progress.into))}
        onPress={onLevels}
        accessibilityLabel={todayText.nextA11y}
      />
    </View>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────
function ChatBody({ link }: { link: Link }) {
  const thread = useMessages(link.id);
  useMarkRead(link.id, thread.messages[0]?.id);
  const dayLabel = useCallback((day: string) => chatDayLabel(day), []);

  if (thread.isPending) {
    return (
      <View style={[styles.body, styles.padded]}>
        <Skeleton width="60%" height={52} radius="lg" />
        <Skeleton width="50%" height={44} radius="lg" style={styles.right} />
        <Skeleton width="70%" height={64} radius="lg" />
      </View>
    );
  }
  if (thread.isError && thread.messages.length === 0) {
    return (
      <View style={styles.padded}>
        <Banner tone="error" title={chatText.loadError} text={thread.error.message} actionLabel={chatText.retry} onAction={() => void thread.refetch()} />
      </View>
    );
  }
  return (
    <ChatThread
      messages={chronological(thread.messages)}
      myPet={link.myPet}
      other={link.other}
      dayLabel={dayLabel}
      onEndReached={() => {
        if (thread.hasNextPage && !thread.isFetchingNextPage) void thread.fetchNextPage();
      }}
      loadingOlder={thread.isFetchingNextPage}
      lockedPhotoLabel={chatText.lockedPhoto}
      empty={<EmptyState species={link.myPet.species} mood="salut" title={chatText.emptyTitle} text={chatText.emptyText(link.myPet.name, link.other.pet.name)} />}
    />
  );
}

function ChatComposer({
  link,
  draft,
  setDraft,
  tone,
  setTone,
  onAttach,
  notice,
  onNotice,
}: {
  link: Link;
  notice: Notice | null;
  onNotice: (n: Notice | null) => void;
  draft: string;
  setDraft: (v: string) => void;
  tone: ComposerTone | null;
  setTone: (v: ComposerTone | null) => void;
  onAttach: () => void;
}) {
  const send = useSendMessage(link.id);
  const ghost = link.status !== 'active';
  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(
      { body, tone: tone ?? undefined },
      {
        onSuccess: () => {
          setDraft('');
          setTone(null);
        },
      },
    );
  };
  return (
    <View style={styles.composer}>
      {notice ? <NoticeBanner notice={notice} onClose={() => onNotice(null)} /> : null}
      {send.isError ? (
        <Banner tone="error" text={errorText(send.error, chatText.sendError, { link_not_active: chatText.ghostDisabled })} onClose={() => send.reset()} closeLabel={todayText.dismiss} />
      ) : null}
      <Composer
        value={draft}
        onChangeText={setDraft}
        onSend={submit}
        placeholder={chatText.placeholder(link.other.displayName, link.myPet.name)}
        disabled={ghost}
        disabledText={chatText.ghostDisabled}
        sending={send.isPending}
        tone={tone}
        onToneChange={setTone}
        toneLabels={chatText.tones}
        onAttach={link.today.mine ? undefined : onAttach}
        attachLabel={chatText.attach}
        sendLabel={chatText.send}
      />
    </View>
  );
}

// ── Souvenirs ───────────────────────────────────────────────────────────────
function MemoriesBody({ link }: { link: Link }) {
  const memories = useMemories(link.id);
  const blurred = link.level < 5;
  if (memories.isPending) {
    return (
      <View style={styles.body}>
        <Skeleton height={200} radius="xl" />
        <Skeleton height={120} radius="lg" />
      </View>
    );
  }
  if (memories.isError) {
    return <Banner tone="error" title={memText.loadError} text={memories.error.message} actionLabel={memText.retry} onAction={() => void memories.refetch()} />;
  }
  const { days, stats } = memories.data;
  return (
    <View style={styles.body}>
      <MemoriesPanel
        kicker={memText.kicker(link.myPet.name, link.other.pet.name)}
        title={memText.title}
        text={memText.subtitle(stats.daysTogether, stats.bestStreak)}
        pets={[link.myPet.species, link.other.pet.species]}
      />
      <View style={styles.sectionHead}>
        <Title text={memText.photosTitle(stats.photos)} size={24} />
        {blurred && days.length > 0 ? (
          <Text variant="bodyBold" size={12} muted>
            {memText.blurredHint}
          </Text>
        ) : null}
      </View>
      <MemoryGrid days={days} dayLabel={shortDay} blurred={blurred} emptyText={memText.empty} />
    </View>
  );
}

// ── Lien fantôme ────────────────────────────────────────────────────────────
function GhostBody({ link, onBack, onLeft }: { link: Link; onBack: () => void; onLeft: () => void }) {
  const revive = useRevive(link.id);
  const archive = useArchiveLink();
  const error = revive.isError
    ? errorText(revive.error, ghostText.reviveError, { cannot_revive: ghostText.cannotRevive })
    : archive.isError
      ? errorText(archive.error, ghostText.reviveError)
      : null;
  return (
    <>
      <GhostPanel
        onBack={onBack}
        backLabel={t.back}
        badge={ghostText.badge(link.other.displayName)}
        livesLabel={t.lives(0)}
        pet={link.myPet}
        title={ghostText.title}
        text={ghostText.text(link.other.displayName)}
        speech={ghostText.speech(link.other.displayName)}
        speakerLabel={ghostText.speaker(link.myPet.name)}
        canRevive={link.canRevive}
        reviveLabel={ghostText.revive}
        reviveHint={ghostText.reviveHint}
        alreadyRevivedLabel={ghostText.already}
        leaveLabel={ghostText.leave}
        onRevive={() => revive.mutate()}
        onLeave={() => archive.mutate(link.id, { onSuccess: onLeft })}
        reviving={revive.isPending}
        leaving={archive.isPending}
        error={error}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 16, paddingTop: 8 },
  // Maquettes du lien : blocs séparés de 10, 12 sous les onglets (dont 8 posés par l'en-tête du gabarit).
  body: { gap: 10, paddingTop: 4 },
  todoTitle: { letterSpacing: 1.32, marginTop: 4, marginLeft: 4 },
  padded: { paddingHorizontal: 16 },
  right: { alignSelf: 'flex-end' },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progress: { gap: 6, marginTop: 12 },
  composer: { gap: 8 },
  notice: { paddingTop: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 4 },
});
