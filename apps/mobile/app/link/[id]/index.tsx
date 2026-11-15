import { levelLabel } from '@/locales/content';
import type { Link } from '@blowy/contract';
import { LEVEL_KEYS, MAX_LEVEL, MAX_LIVES, levelProgress } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Avatar,
  Banner,
  ChatThread,
  Composer,
  type ComposerTone,
  CountTitle,
  EmptyState,
  FeatureRow,
  GhostPanel,
  Header,
  LinkTemplate,
  LivesPanel,
  MemoriesPanel,
  MemoryGrid,
  MinimoaConsent,
  MinimoaSwitch,
  PetImage,
  ScreenTemplate,
  SheetTemplate,
  Skeleton,
  Stagger,
  Text,
  TodayCard,
  TodoRow,
  Button,
} from '@blowy/ui';
import type { Message } from '@blowy/contract';
import { ApiError } from '@blowy/api-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/core';
import {
  chatDayLabel,
  chronological,
  errorText,
  PhotoSourceSheet,
  shortDay,
  useArchiveLink,
  useLevelUps,
  useLink,
  useLinkMinimoas,
  useMarkRead,
  useMinimoaGuide,
  useMemories,
  useMessages,
  useRevive,
  useSendMessage,
  useSendPhoto,
  useUpdateLinkMinimoas,
  weekStrip,
} from '@/features/links';
import { chat as chatText, ghost as ghostText, link as t, memories as memText, minimoas as minimoaText, today as todayText } from '@/locales/chats';

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
  // Les minimoas de ce chat : accord de lecture (demandé à la première ouverture), coupure, explication des rôles.
  const minimoas = useLinkMinimoas(id);
  const updateMinimoas = useUpdateLinkMinimoas(id);
  const guide = useMinimoaGuide();
  const [consentLater, setConsentLater] = useState(false);
  const [defaultNoticeClosed, setDefaultNoticeClosed] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [reporting, setReporting] = useState<Message | null>(null);
  // Ranimé à l'instant : les cœurs reviennent un à un dans l'en-tête.
  const [revived, setRevived] = useState(false);
  const levelUps = useLevelUps(id, l?.level);
  const goChats = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/chats')), [router]);

  // Lien quitté, ou disparu (blocage) : retour à la liste.
  const gone = l?.status === 'archived' || (link.error instanceof ApiError && (link.error.code === 'not_found' || link.error.code === 'forbidden'));
  useEffect(() => {
    if (l?.status === 'archived') router.replace('/(tabs)/chats');
  }, [l?.status, router]);

  if (!l) {
    return (
      <ScreenMotion>
      <ScreenTemplate header={<Header onBack={goChats} backLabel={t.back} />}>
        {link.isPending ? (
          <View style={styles.gap}>
            <Skeleton height={44} radius="pill" />
            <Skeleton height={320} radius="xl" />
            <Skeleton height={140} radius="lg" />
          </View>
        ) : gone ? (
          <EmptyState peek mood="triste" title={t.gone} actionLabel={t.backToChats} onAction={() => router.replace('/(tabs)/chats')} />
        ) : (
          <Banner tone="error" title={t.loadError} text={link.error?.message ?? ''} actionLabel={t.retry} onAction={() => void link.refetch()} />
        )}
      </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const ghost = l.status === 'ghost';
  // Par défaut : le chat (maquettes : une ligne de la liste ouvre V6-Chat) ; un lien fantôme ouvre son état (V6-Fantome).
  const active: Tab = tab ?? (ghost ? 'today' : 'chat');

  // Lien fantôme : écran plein, sans onglets (V6-Fantome).
  if (ghost) {
    return (
      <ScreenMotion>
        <GhostBody link={l} onBack={goChats} onLeft={() => router.replace('/(tabs)/chats')} onRevived={() => setRevived(true)} />
      </ScreenMotion>
    );
  }

  const nudge = () => {
    setDraft(todayText.nudgeDraft);
    setTab('chat');
  };

  const mm = minimoas.data;
  const muted = mm?.muted ?? false;
  const askConsent = !!mm && mm.consent.mine === null && !consentLater;
  const toggleMuted = () =>
    updateMinimoas.mutate(
      { muted: !muted },
      {
        onSuccess: (next) => setNotice({ tone: 'success', text: next.muted ? chatText.mutedNotice : chatText.unmutedNotice }),
        onError: () => setNotice({ tone: 'error', text: chatText.muteError }),
      },
    );
  const answerConsent = (consent: boolean) =>
    updateMinimoas.mutate({ consent }, { onError: () => setNotice({ tone: 'error', text: minimoaText.error }) });

  return (
    <ScreenMotion>
      <LinkTemplate
        other={l.other}
        myPet={l.myPet}
        lives={l.lives}
        ghost={ghost}
        levelLabel={minimoas.data ? t.levelShort(l.level) : t.level(l.level)}
        onLevelPress={() => router.push(`/link/${l.id}/niveaux`)}
        onBack={goChats}
        backLabel={t.back}
        livesLabel={t.lives(l.lives)}
        livesFrom={revived ? 0 : undefined}
        levelUp={levelUps}
        onOptions={() => router.push(`/link/${l.id}/options`)}
        optionsLabel={t.options}
        headerAction={
          mm ? (
            <MinimoaSwitch pet={l.myPet} on={!muted} onToggle={toggleMuted} accessibilityLabel={muted ? chatText.switchOff : chatText.switchOn} disabled={updateMinimoas.isPending} />
          ) : undefined
        }
        notice={
          // Accord venu du réglage par défaut : la question n'est pas posée, mais l'état reste visible, en une ligne.
          active === 'chat' && mm && mm.consent.byDefault && mm.consent.mine !== null && !defaultNoticeClosed ? (
            <Banner
              tone="info"
              text={minimoaText.byDefault(mm.consent.mine)}
              actionLabel={minimoaText.byDefaultChange}
              onAction={() => router.push(`/link/${l.id}/options`)}
              onClose={() => setDefaultNoticeClosed(true)}
              closeLabel={minimoaText.guideClose}
            />
          ) : active === 'chat' && mm && mm.consent.mine !== null && guide.seen === false ? (
            <Banner tone="info" title={minimoaText.guideTitle} text={minimoaText.guideText} actionLabel={minimoaText.guideMore} onAction={() => setRolesOpen(true)} onClose={guide.dismiss} closeLabel={minimoaText.guideClose} actionBelow />
          ) : undefined
        }
        tabs={TABS}
        activeTab={active}
        onTabChange={setTab}
        scroll={active !== 'chat'}
        refreshControl={<Refresh linkId={l.id} />}
        footer={
          active === 'chat' ? (
            <ChatComposer
              link={l}
              draft={draft}
              setDraft={setDraft}
              tone={tone}
              setTone={setTone}
              onAttach={() => setPicking(true)}
              notice={notice}
              onNotice={setNotice}
              rhythm={mm ? (mm.muted ? chatText.rhythmMuted : mm.consent.reading ? chatText.rhythm(mm.maxPerDay) : chatText.rhythmNoReading(mm.maxPerDay)) : null}
            />
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
          <ChatBody link={l} onReport={setReporting} />
        ) : (
          <MemoriesBody link={l} />
        )}
      </LinkTemplate>
      <PhotoSender link={l} visible={picking} onClose={() => setPicking(false)} onNotice={setNotice} />

      {/* Accord de lecture : à la première ouverture du chat, la phrase de l'API telle quelle et les deux choix. */}
      <SheetTemplate
        visible={askConsent && active === 'chat'}
        onClose={() => setConsentLater(true)}
        header={<View />}
        scroll
        closeLabel={minimoaText.later}
        footer={
          <>
            <Button label={minimoaText.accept} onPress={() => answerConsent(true)} loading={updateMinimoas.isPending && updateMinimoas.variables?.consent === true} />
            <Button label={minimoaText.decline} variant="ghost" onPress={() => answerConsent(false)} loading={updateMinimoas.isPending && updateMinimoas.variables?.consent === false} />
          </>
        }
      >
        {mm ? (
          <MinimoaConsent
            title={minimoaText.consentTitle}
            subtitle={minimoaText.consentSubtitle}
            mine={l.myPet}
            theirs={l.other.pet}
            text={mm.consent.text}
            notes={[
              { key: 'refuse', icon: 'gel', text: minimoaText.ifRefused(l.myPet.name, l.other.pet.name) },
              {
                key: 'other',
                icon: 'eclair',
                text: mm.consent.reading
                  ? minimoaText.bothYes(l.other.displayName)
                  : mm.consent.theirs === 'agreed'
                    ? minimoaText.otherAgreed(l.other.displayName)
                    : minimoaText.otherWaiting(l.other.displayName),
              },
            ]}
          />
        ) : null}
      </SheetTemplate>

      {/* Les rôles des minimoas, une fois, en lisant à son rythme. */}
      <SheetTemplate
        visible={rolesOpen}
        onClose={() => setRolesOpen(false)}
        title={minimoaText.rolesTitle}
        scroll
        closeLabel={minimoaText.guideClose}
        footer={
          <Button
            label={minimoaText.guideClose}
            onPress={() => {
              setRolesOpen(false);
              guide.dismiss();
            }}
          />
        }
      >
        {minimoaText.roles.map((r) => (
          <FeatureRow key={r.key} icon={r.icon} title={r.title} text={r.text} />
        ))}
        <Text size={15} muted>
          {minimoaText.rolesNote}
        </Text>
      </SheetTemplate>

      {/* Appui long sur un message de l'autre : le signaler (la modération ne voit que lui et son contexte immédiat). */}
      <SheetTemplate
        visible={!!reporting}
        onClose={() => setReporting(null)}
        title={chatText.reportTitle}
        closeLabel={chatText.cancel}
        footer={
          <>
            <Button
              label={chatText.reportAction}
              variant="danger"
              onPress={() => {
                const m = reporting;
                setReporting(null);
                if (m) router.push({ pathname: '/link/[id]/signaler', params: { id: l.id, messageId: m.id } });
              }}
            />
            <Button label={chatText.cancel} variant="ghost" onPress={() => setReporting(null)} />
          </>
        }
      >
        {reporting?.body ? (
          <Text variant="bodyBold" size={17}>
            {chatText.quote(reporting.body)}
          </Text>
        ) : null}
        <Text size={15} muted>
          {chatText.reportText}
        </Text>
      </SheetTemplate>
    </ScreenMotion>
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

  const key = `${link.id}:${today.day}`;
  return (
    <View style={styles.body}>
      <Stagger onceKey={`today:${link.id}`} step={70}>
      <TodayCard
        key="card"
        motionKey={key}
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
        key="week"
        animateKey={memories.data ? key : undefined}
        lives={link.lives}
        max={MAX_LIVES}
        count={todayText.livesCount(link.lives)}
        weekTitle={todayText.weekTitle}
        week={weekStrip(memories.data, today.day, today)}
        accessibilityLabel={t.lives(link.lives)}
      />
      <Text key="todoTitle" variant="label" size={11} muted style={styles.todoTitle}>
        {todayText.todoTitle}
      </Text>
      <TodoRow
        key="todo"
        tile={atMax ? <PetImage art="oeuf" size={38} /> : <Avatar size={34} pet={other.pet} hidden />}
        tileGradient={atMax ? 'rose' : 'violet'}
        title={atMax ? levelLabel.oeuf.title : todayText.nextTodo(link.level + 1, levelLabel[nextKey].title)}
        subtitle={atMax ? todayText.maxText : levelLabel[nextKey].text}
        chip={atMax ? undefined : todayText.nextChip(Math.max(0, progress.span - progress.into))}
        onPress={onLevels}
        accessibilityLabel={todayText.nextA11y}
      />
      </Stagger>
    </View>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────
function ChatBody({ link, onReport }: { link: Link; onReport: (m: Message) => void }) {
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
      typingLabel={chatText.typing}
      roleLabel={chatText.role}
      onMessageLongPress={(m) => {
        const found = thread.messages.find((x) => x.id === m.id);
        if (found) onReport(found);
      }}
      longPressHint={chatText.longPressHint}
      empty={
        <EmptyState peek seed={link.id} species={link.myPet.species} mood="salut" title={chatText.emptyTitle} text={chatText.emptyText(link.myPet.name, link.other.pet.name)} />
      }
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
  rhythm,
}: {
  link: Link;
  rhythm: string | null;
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
      {rhythm ? (
        <Text size={13} muted center>
          {rhythm}
        </Text>
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
      <CountTitle title={memText.photosTitle} count={stats.photos} hint={blurred && days.length > 0 ? memText.blurredHint : undefined} />
      <MemoryGrid days={days} dayLabel={shortDay} blurred={blurred} emptyText={memText.empty} animateKey={link.id} />
    </View>
  );
}

// ── Lien fantôme ────────────────────────────────────────────────────────────
function GhostBody({ link, onBack, onLeft, onRevived }: { link: Link; onBack: () => void; onLeft: () => void; onRevived: () => void }) {
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
        onRevive={() => revive.mutate(undefined, { onSuccess: onRevived })}
        onLeave={() => archive.mutate(link.id, { onSuccess: onLeft })}
        reviving={revive.isPending}
        leaving={archive.isPending}
        error={error}
        revealKey={link.id}
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
});
