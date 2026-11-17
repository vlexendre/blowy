import { levelLabel } from '@/locales/content';
import type { Link } from '@blowy/contract';
import { LEVEL_KEYS, MAX_LIVES } from '@blowy/domain';
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
  Glyph,
  GhostPanel,
  Header,
  LinkTemplate,
  LinkTodayHero,
  LivesPanel,
  MemoryGrid,
  MinimoaConsent,
  MinimoaSwitch,
  PetImage,
  Pressable,
  ScreenTemplate,
  SharedHabitsCard,
  SheetTemplate,
  Skeleton,
  Stagger,
  Text,
  TodoRow,
  Button,
} from '@blowy/ui';
import type { Message } from '@blowy/contract';
import { ApiError } from '@blowy/api-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/core';
import { sharedHabitsView } from '@/features/groups';
import { openLegal } from '@/features/me';
import { MEET_LEVEL, useMeetReminders } from '@/features/safety';
import { home as homeText } from '@/locales/pet';
import {
  chatDayLabel,
  chronological,
  errorText,
  linkDayState,
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
  useUpdateLinkMinimoas,
  weekStrip,
} from '@/features/links';
import { chat as chatText, ghost as ghostText, link as t, memories as memText, minimoas as minimoaText, today as todayText } from '@/locales/chats';

/**
 * Deux onglets : le chat (par défaut) et « Le lien » (la journée, la semaine, les vies, le prochain niveau, les étapes).
 * Sans photo du jour, il n'y a plus rien à faire ailleurs que dans le chat : la journée et les souvenirs tiennent sur
 * une seule page. Les anciens liens profonds (`?tab=today`, `?tab=memories`) ouvrent « Le lien ».
 */
type Tab = 'chat' | 'lien';
const TABS = [
  { key: 'chat', label: t.tabs.chat },
  { key: 'lien', label: t.tabs.lien },
] as const;
const tabOf = (v: unknown): Tab | null => (v === 'chat' ? 'chat' : v === 'lien' || v === 'today' || v === 'memories' ? 'lien' : null);

export default function LinkScreen() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const id = params.id;
  const router = useRouter();
  const link = useLink(id);
  const [tab, setTab] = useState<Tab | null>(tabOf(params.tab));
  // Un lien profond (`?tab=lien`) vers un écran déjà ouvert change d'onglet.
  useEffect(() => {
    const next = tabOf(params.tab);
    if (next) setTab(next);
  }, [params.tab]);
  const [draft, setDraft] = useState('');
  const [tone, setTone] = useState<ComposerTone | null>(null);
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
  // Par défaut : le chat (maquettes : une ligne de la liste ouvre V6-Chat) ; un lien fantôme a son propre écran (V6-Fantome).
  const active: Tab = tab ?? 'chat';

  // Lien fantôme : écran plein, sans onglets (V6-Fantome).
  if (ghost) {
    return (
      <ScreenMotion>
        <GhostBody link={l} onBack={goChats} onLeft={() => router.replace('/(tabs)/chats')} onRevived={() => setRevived(true)} />
      </ScreenMotion>
    );
  }

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
        livesShort={todayText.livesCount(l.lives)}
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
            <Banner tone="info" title={minimoaText.guideTitle} actionLabel={minimoaText.guideMore} onAction={() => setRolesOpen(true)} onClose={guide.dismiss} closeLabel={minimoaText.guideClose} />
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
              notice={notice}
              onNotice={setNotice}
              onRhythm={() => setRolesOpen(true)}
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
        {active === 'lien' ? (
          <LienBody link={l} onWrite={() => setTab('chat')} onLevels={() => router.push(`/link/${l.id}/niveaux`)} />
        ) : (
          <ChatBody link={l} onReport={setReporting} />
        )}
      </LinkTemplate>

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
            policy={{ label: minimoaText.policy, onPress: openLegal('confidentialite') }}
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

/** Tirer pour rafraîchir le lien et ses étapes. */
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

type Notice = { tone: 'success' | 'error' | 'info'; text: string };

function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  return <Banner tone={notice.tone} text={notice.text} onClose={notice.tone === 'info' ? undefined : onClose} closeLabel={todayText.dismiss} />;
}

// ── Le lien : la journée, la semaine, le prochain niveau, les étapes ───────────
// Encre sombre sur jaune, orange et rose ; blanc sur violet (docs/DESIGN.md : jamais de petit texte blanc sur corail).
const HERO_GRADIENT = { both: 'accent', yourTurn: 'orange', atStake: 'orange', theirTurn: 'rose', fresh: 'violet' } as const;

function LienBody({ link, onWrite, onLevels }: { link: Link; onWrite: () => void; onLevels: () => void }) {
  const { today, other, streak } = link;
  const name = other.displayName;
  const state = linkDayState(link);
  const copy =
    state === 'both'
      ? { title: todayText.both.title, text: todayText.both.text(streak) }
      : state === 'yourTurn'
        ? { title: todayText.yourTurn.title, text: todayText.yourTurn.text(name, streak + 1) }
        : state === 'theirTurn'
          ? { title: todayText.theirTurn.title(name), text: todayText.theirTurn.text(name, streak + 1) }
          : state === 'atStake'
            ? { title: todayText.atStake.title, text: todayText.atStake.text(streak) }
            : { title: todayText.fresh.title, text: todayText.fresh.text };
  const next = link.next;
  const key = `${link.id}:${today.day}`;
  // Niveau « se voir » atteint : le même rappel de sécurité que l'accueil, lu une seule fois (où qu'il soit lu).
  const meetSeen = useMeetReminders((s) => s.seen);
  const dismissMeet = useMeetReminders((s) => s.dismiss);
  const meet = link.status === 'active' && link.level >= MEET_LEVEL && !meetSeen.includes(link.id);
  // Habitudes tenues tous les deux (spéc. §25) : absentes sans habitude commune ou si l'un des deux a coupé le réglage.
  const shared = sharedHabitsView(link.sharedHabits, name);
  return (
    <View style={styles.body}>
      <Stagger onceKey={`lien:${link.id}`} step={70}>
        <LinkTodayHero
          key="hero"
          motionKey={link.id}
          streak={streak}
          streakUnit={todayText.streakUnit(streak)}
          streakA11y={todayText.streakA11y(streak)}
          title={copy.title}
          text={copy.text}
          myPet={link.myPet}
          other={other}
          me={{ label: todayText.me, wrote: today.mine }}
          them={{ label: name, wrote: today.theirs }}
          wroteLabel={todayText.wrote}
          waitingLabel={todayText.waiting}
          cta={today.mine ? todayText.ctaBack : todayText.ctaWrite(name)}
          onCta={onWrite}
          gradient={HERO_GRADIENT[state]}
        />
        {meet ? (
          <Banner
            key="meet"
            tone="info"
            title={homeText.meetTitle(name)}
            text={homeText.meetText}
            actionLabel={homeText.meetAction}
            onAction={openLegal('securite')}
            actionBelow
            onClose={() => dismissMeet(link.id)}
            closeLabel={homeText.meetClose}
          />
        ) : null}
        <LivesPanel
          key="week"
          animateKey={key}
          lives={link.lives}
          max={MAX_LIVES}
          count={todayText.livesCount(link.lives)}
          weekTitle={todayText.weekTitle}
          week={weekStrip(today)}
          text={todayText.livesText}
          accessibilityLabel={t.lives(link.lives)}
          danger={link.lives > 0 && link.lives <= 2 ? link.myPet : null}
        />
        {shared ? <SharedHabitsCard key="shared" {...shared} /> : null}
        <Text key="todoTitle" variant="label" size={11} muted style={styles.todoTitle}>
          {todayText.todoTitle}
        </Text>
        <TodoRow
          key="todo"
          tile={next ? <Avatar size={34} pet={other.pet} hidden /> : <PetImage art="oeuf" size={38} />}
          tileGradient={next ? 'violet' : 'rose'}
          title={next ? todayText.nextTodo(next.level, levelLabel[next.key].title) : levelLabel.oeuf.title}
          subtitle={next ? levelLabel[next.key].text : todayText.maxText}
          chip={next ? todayText.nextChip(next.xpLeft) : undefined}
          onPress={onLevels}
          accessibilityLabel={todayText.nextA11y}
        />
        <Milestones key="steps" link={link} />
      </Stagger>
    </View>
  );
}

const MILESTONE_ICON = { met: 'confettis', level: 'etoiles', streak: 'flamme' } as const;

/** Les étapes du lien (rencontre, niveaux passés, paliers de série), puis ses photos d'avant s'il y en a. */
function Milestones({ link }: { link: Link }) {
  const memories = useMemories(link.id);
  if (memories.isPending) {
    return (
      <View style={styles.steps}>
        <Skeleton height={24} width="40%" />
        <Skeleton height={56} radius="lg" />
        <Skeleton height={56} radius="lg" />
      </View>
    );
  }
  if (memories.isError) {
    return <Banner tone="error" title={memText.loadError} text={memories.error.message} actionLabel={memText.retry} onAction={() => void memories.refetch()} />;
  }
  const { milestones, photos, stats } = memories.data;
  const title = (m: (typeof milestones)[number]): string =>
    m.kind === 'met' ? memText.met : m.kind === 'streak' ? memText.streak(m.value) : memText.level(m.value, levelLabel[LEVEL_KEYS[m.value - 1] ?? 'rendezvous'].title);
  return (
    <View style={styles.steps}>
      <CountTitle title={memText.title} count={milestones.length} />
      <Text size={13} muted>
        {memText.stats(stats)}
        {stats.bestStreak > 0 ? ` · ${memText.bestStreak(stats.bestStreak)}` : ''}
      </Text>
      {milestones.map((m) => (
        <FeatureRow key={`${m.kind}:${m.value}`} icon={MILESTONE_ICON[m.kind]} title={title(m)} text={m.on ? shortDay(m.on) : memText.earlier} />
      ))}
      {photos.length > 0 ? (
        <>
          <CountTitle title={memText.photosTitle} count={photos.length} hint={link.level < 5 ? memText.blurredHint : undefined} />
          <MemoryGrid days={photos} dayLabel={shortDay} blurred={link.level < 5} animateKey={link.id} />
        </>
      ) : null}
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
  notice,
  onNotice,
  rhythm,
  onRhythm,
}: {
  link: Link;
  rhythm: string | null;
  /** La ligne du rythme ouvre les rôles des minimoas (l'explication reste à un tap, jamais affichée en continu). */
  onRhythm: () => void;
  notice: Notice | null;
  onNotice: (n: Notice | null) => void;
  draft: string;
  setDraft: (v: string) => void;
  tone: ComposerTone | null;
  setTone: (v: ComposerTone | null) => void;
}) {
  const send = useSendMessage(link.id);
  const ghost = link.status !== 'active';
  // Refusé par le filtre : le message n'est pas parti, la raison vient de l'API, le texte reste dans le champ.
  const refused = send.error instanceof ApiError && send.error.code === 'content_refused' ? send.error.message : null;
  const edit = (v: string) => {
    setDraft(v);
    if (send.isError) send.reset();
  };
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
      {refused ? (
        <Banner tone="error" title={refused} text={chatText.refusedKeep} onClose={() => send.reset()} closeLabel={todayText.dismiss} />
      ) : send.isError ? (
        <Banner tone="error" title={chatText.notSent} text={errorText(send.error, chatText.sendError, { link_not_active: chatText.ghostDisabled })} onClose={() => send.reset()} closeLabel={todayText.dismiss} />
      ) : null}
      {rhythm ? (
        <Pressable onPress={onRhythm} accessibilityRole="button" accessibilityLabel={`${rhythm} ${chatText.rhythmA11y}`} hitSlop={12} dimTo={0.6} scaleTo={1} haptic={false} style={styles.rhythm}>
          <Text size={13} muted numberOfLines={1} style={styles.shrink}>
            {rhythm}
          </Text>
          <Glyph name="chevron" size={12} color={color.mute} />
        </Pressable>
      ) : null}
      <Composer
        value={draft}
        onChangeText={edit}
        onSend={submit}
        placeholder={chatText.placeholder(link.other.displayName, link.myPet.name)}
        disabled={ghost}
        disabledText={chatText.ghostDisabled}
        sending={send.isPending}
        tone={tone}
        onToneChange={setTone}
        toneLabels={chatText.tones}
        sendLabel={chatText.send}
      />
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
  steps: { gap: 10, marginTop: 14 },
  padded: { paddingHorizontal: 16 },
  right: { alignSelf: 'flex-end' },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progress: { gap: 6, marginTop: 12 },
  composer: { gap: 8 },
  rhythm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 20 },
  shrink: { flexShrink: 1 },
  notice: { paddingTop: 12 },
});
