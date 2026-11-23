import { levelLabel } from '@/locales/content';
import type { Link } from '@blowy/contract';
import { LEVEL_KEYS } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Avatar,
  Banner,
  ChatThread,
  Composer,
  CountTitle,
  EmptyState,
  FeatureRow,
  Glyph,
  Header,
  LinkTemplate,
  LevelLadder,
  MemoryRecap,
  ShareCard,
  LinkTodayHero,
  LinkMoodCard,
  MemoryGrid,
  MinimoaSwitch,
  PetImage,
  Pressable,
  ScreenTemplate,
  SleepPanel,
  SheetTemplate,
  Skeleton,
  Stagger,
  Text,
  TodoRow,
  Button,
  type MessageLook,
} from '@blowy/ui';
import type { Message } from '@blowy/contract';
import { ApiError } from '@blowy/api-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { inviteUrl, ScreenMotion } from '@/core';
import { useDraft, useRefusal } from '@/features/chat';
import { displayUrl, useMe, useStoryShare } from '@/features/me';
import { MEET_LEVEL, useMeetReminders } from '@/features/safety';
import { confirmAction } from '@/features/session';
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
  useLinkChat,
  useLinkMinimoas,
  useMarkRead,
  useMinimoaGuide,
  useMemories,
  useUpdateLinkMinimoas,
  useWake,
} from '@/features/links';
import { croissance } from '@/locales/croissance';
import {
  chat as chatText,
  levels as levelsText,
  link as t,
  memories as memText,
  minimoas as minimoaText,
  options as optionsText,
  sleep as sleepText,
  today as todayText,
  warmth as warmthText,
} from '@/locales/chats';

/**
 * Deux onglets : le chat (par défaut) et « Le lien » (son état en une phrase, les niveaux, les étapes). Un lien
 * endormi (`warmth` « endormi », ADA-2027 item 27) s'ouvre sur son écran de sieste : « Le réveiller » ou « Le laisser
 * partir » ; rien n'est bloqué, réveillé il rouvre le chat.
 * Sans photo du jour, il n'y a plus rien à faire ailleurs que dans le chat : la journée et les souvenirs tiennent sur
 * une seule page. Les anciens liens profonds (`?tab=today`, `?tab=memories`) ouvrent « Le lien ».
 */

type Tab = 'chat' | 'lien';
const TABS = [
  { key: 'chat', label: t.tabs.chat },
  { key: 'lien', label: t.tabs.souvenirs },
] as const;
const tabOf = (v: unknown): Tab | null =>
  v === 'chat' ? 'chat' : v === 'lien' || v === 'today' || v === 'memories' ? 'lien' : null;

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
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const l = link.data;
  // Souvenirs : « Partager en story » (la carte est montée hors écran pour la capture).
  const story = useStoryShare();
  const me = useMe();
  const shareUrl = me.data ? inviteUrl(me.data.inviteCode) : '';
  // Les minimoas de ce chat : accord de lecture (demandé une fois la conversation lancée), coupure, explication des rôles.
  const minimoas = useLinkMinimoas(id);
  const updateMinimoas = useUpdateLinkMinimoas(id);
  const guide = useMinimoaGuide();
  // Le fil (envoi optimiste compris) : lu une fois ici, passé au fil et au champ. Le texte tapé vit dans le champ seul
  // (une frappe ne redessine ni l'écran ni le fil).
  const chat = useLinkChat(id);
  const thread = chat.thread;
  const onReport = useCallback(
    (m: MessageLook) => {
      const found = thread.messages.find((x) => x.id === m.id);
      if (found) setReporting(found);
    },
    [thread.messages],
  );
  const [defaultNoticeClosed, setDefaultNoticeClosed] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [reporting, setReporting] = useState<Message | null>(null);
  // Lien endormi passé (« Le réveiller », ou « Retour » puis le chat) : on reste dans le chat pour cette visite.
  const [awake, setAwake] = useState(false);
  const levelUps = useLevelUps(id, l?.level);
  const goChats = useCallback(
    () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/chats')),
    [router],
  );

  // Lien quitté, ou disparu (blocage) : retour à la liste.
  const gone =
    l?.status === 'archived' ||
    (link.error instanceof ApiError && (link.error.code === 'not_found' || link.error.code === 'forbidden'));
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
            <EmptyState
              peek
              mood="triste"
              title={t.gone}
              actionLabel={t.backToChats}
              onAction={() => router.replace('/(tabs)/chats')}
            />
          ) : (
            <Banner
              tone="error"
              title={t.loadError}
              text={link.error?.message ?? ''}
              actionLabel={t.retry}
              onAction={() => void link.refetch()}
            />
          )}
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  // Par défaut : le chat (maquettes : une ligne de la liste ouvre V6-Chat) ; un lien endormi s'ouvre sur sa sieste.
  const active: Tab = tab ?? 'chat';
  const shareStory = () => void story.share(memText.storyMessage(shareUrl), shareUrl);

  // Lien endormi : écran plein, sans onglets (ancien V6-Fantome, adouci).
  if (l.warmth === 'endormi' && !awake) {
    return (
      <ScreenMotion>
        <SleepBody
          link={l}
          onBack={goChats}
          onLeft={() => router.replace('/(tabs)/chats')}
          onWoken={() => setAwake(true)}
        />
      </ScreenMotion>
    );
  }

  const mm = minimoas.data;
  const muted = mm?.muted ?? false;
  // Pas de demande d'accord dans le chat (maquette V7) : sans réponse, les minimoas parlent sans lire
  // (`consent.mine` null) ; l'accord reste dans Options à tout moment.
  const toggleMuted = () =>
    updateMinimoas.mutate(
      { muted: !muted },
      {
        onSuccess: (next) =>
          setNotice({ tone: 'success', text: next.muted ? chatText.mutedNotice : chatText.unmutedNotice }),
        onError: () => setNotice({ tone: 'error', text: chatText.muteError }),
      },
    );

  return (
    <ScreenMotion>
      <LinkTemplate
        other={l.other}
        myPet={l.myPet}
        levelLabel={t.level(l.level)}
        onLevelPress={() => setTab('lien')}
        onBack={goChats}
        backLabel={t.back}
        levelUp={levelUps}
        onOptions={() => router.push(`/link/${l.id}/options`)}
        optionsLabel={t.options}
        notice={
          // Accord venu du réglage par défaut : la question n'est pas posée, mais l'état reste visible, en une ligne.
          active === 'chat' &&
          mm &&
          mm.consent.byDefault &&
          mm.consent.mine !== null &&
          !defaultNoticeClosed ? (
            <Banner
              tone="info"
              text={minimoaText.byDefault(mm.consent.mine)}
              actionLabel={minimoaText.byDefaultChange}
              onAction={() => router.push(`/link/${l.id}/options`)}
              onClose={() => setDefaultNoticeClosed(true)}
              closeLabel={minimoaText.guideClose}
            />
          ) : active === 'chat' && mm && mm.consent.mine !== null && guide.seen === false ? (
            <Banner
              tone="info"
              title={minimoaText.guideTitle}
              actionLabel={minimoaText.guideMore}
              onAction={() => setRolesOpen(true)}
              onClose={guide.dismiss}
              closeLabel={minimoaText.guideClose}
            />
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
              autoFocus={awake}
              send={chat.send}
              notice={notice}
              onNotice={setNotice}
              onRhythm={() => setRolesOpen(true)}
              rhythm={
                mm
                  ? mm.muted
                    ? chatText.rhythmMuted
                    : mm.consent.reading
                      ? chatText.rhythm(mm.maxPerDay)
                      : chatText.rhythmNoReading(mm.maxPerDay)
                  : null
              }
            />
          ) : (
            <Button label={memText.share} icon="share" loading={story.busy} onPress={shareStory} />
          )
        }
      >
        {notice && active !== 'chat' ? (
          <View style={styles.notice}>
            <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
          </View>
        ) : null}
        {active === 'lien' ? (
          <SouvenirsBody link={l} />
        ) : (
          <ChatBody link={l} chat={chat} onReport={onReport} />
        )}
      </LinkTemplate>
      {active === 'lien' && me.data ? (
        <ShareCard
          ref={story.card}
          brand={croissance.brand}
          kicker={memText.storyKicker}
          title={[
            { text: `${me.data.displayName.toUpperCase()} & ` },
            { text: l.other.displayName.toUpperCase(), dim: true },
          ]}
          big={{
            value: String(Math.max(l.bestStreak, l.streak)),
            unit: memText.storyUnit(Math.max(l.bestStreak, l.streak)),
          }}
          pet={l.myPet}
          callout={memText.storyCallout}
          url={displayUrl(shareUrl)}
          gradient="coral"
          offscreen
        />
      ) : null}


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
                if (m)
                  router.push({ pathname: '/link/[id]/signaler', params: { id: l.id, messageId: m.id } });
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
  return (
    <Banner
      tone={notice.tone}
      text={notice.text}
      onClose={notice.tone === 'info' ? undefined : onClose}
      closeLabel={todayText.dismiss}
    />
  );
}

// ── Le lien : la journée, la semaine, le prochain niveau, les étapes ───────────
// Encre sombre sur jaune, orange et rose ; blanc sur violet (docs/DESIGN.md : jamais de petit texte blanc sur corail).
const HERO_GRADIENT = {
  both: 'accent',
  yourTurn: 'orange',
  atStake: 'orange',
  theirTurn: 'rose',
  fresh: 'violet',
} as const;

/**
 * Souvenirs (V6-Souvenirs) : l'état du lien en une phrase (ADA-2027 item 27), le lien en bref (meilleure série,
 * messages), puis ses étapes et ses photos d'avant.
 */
function SouvenirsBody({ link }: { link: Link }) {
  const memories = useMemories(link.id);
  const stats = memories.data?.stats;
  return (
    <View style={styles.body}>
      {link.warmth ? <LinkMoodCard warmth={link.warmth} text={warmthText[link.warmth]} help={todayText.help} /> : null}
      <MemoryRecap
        title={memText.recapTitle}
        line={
          stats
            ? stats.bestStreak > 0
              ? memText.recapStreak(stats.bestStreak)
              : memText.recapMessages(stats.messages)
            : undefined
        }
        pets={[link.myPet, link.other.pet]}
      />
      {/* Les 7 niveaux du lien (l'ancien écran « niveaux » est fondu ici). */}
      <LevelLadder level={link.level} labels={LADDER} currentLabel={levelsText.current} animateKey={link.id} />
      <Milestones link={link} />
    </View>
  );
}

/** Les niveaux, titres seuls. */
const LADDER = Object.fromEntries(
  Object.entries(levelLabel).map(([k, v]) => [k, { title: v.title, text: '' }]),
) as typeof levelLabel;

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
    return (
      <Banner
        tone="error"
        title={memText.loadError}
        text={memories.error.message}
        actionLabel={memText.retry}
        onAction={() => void memories.refetch()}
      />
    );
  }
  const { milestones, photos, stats } = memories.data;
  const title = (m: (typeof milestones)[number]): string =>
    m.kind === 'met'
      ? memText.met
      : m.kind === 'streak'
        ? memText.streak(m.value)
        : memText.level(m.value, levelLabel[LEVEL_KEYS[m.value - 1] ?? 'rendezvous'].title);
  return (
    <View style={styles.steps}>
      <CountTitle title={memText.title} count={milestones.length} />
      <Text size={13} muted>
        {memText.stats(stats)}
        {stats.bestStreak > 0 ? ` · ${memText.bestStreak(stats.bestStreak)}` : ''}
      </Text>
      {milestones.map((m) => (
        <FeatureRow
          key={`${m.kind}:${m.value}`}
          icon={MILESTONE_ICON[m.kind]}
          title={title(m)}
          text={m.on ? shortDay(m.on) : memText.earlier}
        />
      ))}
      {photos.length > 0 ? (
        <>
          <CountTitle
            title={memText.photosTitle}
            count={photos.length}
            hint={link.level < 5 ? memText.blurredHint : undefined}
          />
          <MemoryGrid days={photos} dayLabel={shortDay} blurred={link.level < 5} animateKey={link.id} />
        </>
      ) : null}
    </View>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────
type LinkChat = ReturnType<typeof useLinkChat>;

const ChatBody = memo(function ChatBody({
  link,
  chat,
  onReport,
}: {
  link: Link;
  chat: LinkChat;
  onReport: (m: MessageLook) => void;
}) {
  const { thread, looks, retry } = chat;
  useMarkRead(link.id, thread.messages[0]?.id);
  const dayLabel = useCallback((day: string) => chatDayLabel(day), []);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = thread;
  const older = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (thread.isPending && looks.length === 0) {
    return (
      <View style={[styles.body, styles.padded]}>
        <Skeleton width="60%" height={52} radius="lg" />
        <Skeleton width="50%" height={44} radius="lg" style={styles.right} />
        <Skeleton width="70%" height={64} radius="lg" />
      </View>
    );
  }
  if (thread.isError && looks.length === 0) {
    return (
      <View style={styles.padded}>
        <Banner
          tone="error"
          title={chatText.loadError}
          text={thread.error.message}
          actionLabel={chatText.retry}
          onAction={() => void thread.refetch()}
        />
      </View>
    );
  }
  return (
    <ChatThread
      messages={looks}
      myPet={link.myPet}
      other={link.other}
      dayLabel={dayLabel}
      onEndReached={older}
      loadingOlder={isFetchingNextPage}
      lockedPhotoLabel={chatText.lockedPhoto}
      typingLabel={chatText.typing}
      roleLabel={chatText.role}
      onMessageLongPress={onReport}
      longPressHint={chatText.longPressHint}
      sendingLabel={chatText.sending}
      failedLabel={chatText.failed}
      onRetry={retry}
      empty={
        <EmptyState
          peek
          seed={link.id}
          species={link.myPet.species}
          mood="salut"
          title={chatText.emptyTitle}
          text={chatText.emptyText(link.myPet.name, link.other.pet.name)}
        />
      }
    />
  );
});

/**
 * Le champ : son texte vit ici (et dans la mémoire du fil : changer d'onglet ou revenir plus tard le retrouve).
 * Envoyer vide le champ tout de suite ; le message est déjà dans le fil.
 */
function ChatComposer({
  link,
  send,
  notice,
  onNotice,
  rhythm,
  onRhythm,
  autoFocus,
}: {
  link: Link;
  /** Juste réveillé : le clavier s'ouvre, le premier mot est à un geste. */
  autoFocus?: boolean;
  send: (body: string) => void;
  rhythm: string | null;
  /** La ligne du rythme ouvre les rôles des minimoas (l'explication reste à un tap, jamais affichée en continu). */
  onRhythm: () => void;
  notice: Notice | null;
  onNotice: (n: Notice | null) => void;
}) {
  const [draft, setDraft] = useDraft(`link:${link.id}`);
  const { refusal, clear } = useRefusal(`link:${link.id}`);
  const closed = link.status !== 'active';
  const edit = (v: string) => {
    setDraft(v);
    if (refusal) clear();
  };
  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    send(body);
  };
  return (
    <View style={styles.composer}>
      {notice ? <NoticeBanner notice={notice} onClose={() => onNotice(null)} /> : null}
      {refusal?.code === 'content_refused' ? (
        <Banner
          tone="error"
          title={refusal.message || chatText.notSent}
          text={chatText.refusedKeep}
          onClose={clear}
          closeLabel={todayText.dismiss}
        />
      ) : refusal ? (
        <Banner
          tone="error"
          title={chatText.notSent}
          text={errorText(refusal, chatText.sendError, { link_not_active: chatText.closedDisabled })}
          onClose={clear}
          closeLabel={todayText.dismiss}
        />
      ) : null}
      {rhythm ? (
        <Pressable
          onPress={onRhythm}
          accessibilityRole="button"
          accessibilityLabel={`${rhythm} ${chatText.rhythmA11y}`}
          hitSlop={12}
          dimTo={0.6}
          scaleTo={1}
          haptic={false}
          style={styles.rhythm}
        >
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
        disabled={closed}
        disabledText={chatText.closedDisabled}
        sendLabel={chatText.send}
        autoFocus={autoFocus}
      />
    </View>
  );
}

// ── Lien endormi ────────────────────────────────────────────────────────────
/** Titre d'alerte en casse de phrase (« QUITTER CE LIEN ? » → « Quitter ce lien ? », « ¿Salir de este vínculo? »). */
const sentence = (text: string): string => {
  const lower = text.toLocaleLowerCase();
  const first = lower.search(/\p{L}/u);
  return first < 0 ? lower : lower.slice(0, first) + lower.charAt(first).toLocaleUpperCase() + lower.slice(first + 1);
};

function SleepBody({
  link,
  onBack,
  onLeft,
  onWoken,
}: {
  link: Link;
  onBack: () => void;
  onLeft: () => void;
  onWoken: () => void;
}) {
  const wake = useWake(link.id);
  const archive = useArchiveLink();
  const error = wake.isError
    ? errorText(wake.error, sleepText.wakeError)
    : archive.isError
      ? errorText(archive.error, sleepText.wakeError)
      : null;
  return (
    <SleepPanel
      onBack={onBack}
      backLabel={t.back}
      badge={sleepText.badge(link.other.displayName)}
      pet={link.myPet}
      title={sleepText.title}
      text={sleepText.text(link.other.displayName)}
      speech={sleepText.speech(link.other.displayName)}
      speakerLabel={sleepText.speaker(link.myPet.name)}
      wakeLabel={sleepText.wake}
      leaveLabel={sleepText.leave}
      onWake={() => wake.mutate(undefined, { onSuccess: onWoken })}
      onLeave={() =>
        // Geste destructif : alerte du système d'abord (comme Options › Quitter le lien), rien ne part avant.
        confirmAction({
          title: sentence(optionsText.leaveTitle.map((seg) => seg.text).join('')),
          message: optionsText.leaveText(link.other.displayName),
          confirm: optionsText.leaveConfirm,
          cancel: optionsText.cancel,
          destructive: true,
          onConfirm: () => archive.mutate(link.id, { onSuccess: onLeft }),
        })
      }
      waking={wake.isPending}
      leaving={archive.isPending}
      error={error}
    />
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
  rhythm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 20,
  },
  shrink: { flexShrink: 1 },
  notice: { paddingTop: 12 },
});
