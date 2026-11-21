import { levelLabel } from '@/locales/content';
import type { Link } from '@blowy/contract';
import { LEVEL_KEYS, MAX_LIVES } from '@blowy/domain';
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
  GhostPanel,
  Header,
  LinkTemplate,
  MemoryRecap,
  ShareCard,
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
  type MessageLook,
} from '@blowy/ui';
import type { Message } from '@blowy/contract';
import { ApiError } from '@blowy/api-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { inviteUrl, ScreenMotion } from '@/core';
import { useDraft, useRefusal } from '@/features/chat';
import { sharedHabitsView } from '@/features/groups';
import { displayUrl, openLegal, useMe, useStoryShare } from '@/features/me';
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
  useLinkChat,
  useLinkMinimoas,
  useMarkRead,
  useMinimoaGuide,
  useMemories,
  useRevive,
  useUpdateLinkMinimoas,
  weekStrip,
} from '@/features/links';
import { croissance } from '@/locales/croissance';
import {
  chat as chatText,
  ghost as ghostText,
  link as t,
  memories as memText,
  minimoas as minimoaText,
  today as todayText,
} from '@/locales/chats';

/**
 * Deux onglets : le chat (par défaut) et « Le lien » (la journée, la semaine, les vies, le prochain niveau, les étapes).
 * Sans photo du jour, il n'y a plus rien à faire ailleurs que dans le chat : la journée et les souvenirs tiennent sur
 * une seule page. Les anciens liens profonds (`?tab=today`, `?tab=memories`) ouvrent « Le lien ».
 */
/** Messages échangés (les deux personnes, sans les minimoas) avant de proposer l'accord de lecture par l'IA. */
const CONSENT_AFTER_MESSAGES = 6;
/** Maquette V7 : la feuille d’accord ne s’ouvre plus d’elle-même dans le chat (l’accord reste dans Options). */
const SHOW_CONSENT_SHEET: boolean = false;

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
  const exchanged = thread.messages.filter((m) => m.author === 'me' || m.author === 'other').length;
  const onReport = useCallback(
    (m: MessageLook) => {
      const found = thread.messages.find((x) => x.id === m.id);
      if (found) setReporting(found);
    },
    [thread.messages],
  );
  const [consentLater, setConsentLater] = useState(false);
  const [defaultNoticeClosed, setDefaultNoticeClosed] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [reporting, setReporting] = useState<Message | null>(null);
  // Ranimé à l'instant : les cœurs reviennent un à un dans l'en-tête.
  const [revived, setRevived] = useState(false);
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

  const ghost = l.status === 'ghost';
  // Par défaut : le chat (maquettes : une ligne de la liste ouvre V6-Chat) ; un lien fantôme a son propre écran (V6-Fantome).
  const active: Tab = tab ?? 'chat';
  const shareStory = () => void story.share(memText.storyMessage(shareUrl), shareUrl);

  // Lien fantôme : écran plein, sans onglets (V6-Fantome).
  if (ghost) {
    return (
      <ScreenMotion>
        <GhostBody
          link={l}
          onBack={goChats}
          onLeft={() => router.replace('/(tabs)/chats')}
          onRevived={() => setRevived(true)}
        />
      </ScreenMotion>
    );
  }

  const mm = minimoas.data;
  const muted = mm?.muted ?? false;
  // Maquette V7 : plus de demande d'accord dans le chat (trop de friction ; se parler suffit). Sans réponse, les
  // minimoas parlent sans lire (`consent.mine` null) ; l'accord reste dans Options à tout moment.
  const askConsent =
    SHOW_CONSENT_SHEET &&
    !!mm &&
    mm.consent.mine === null &&
    !consentLater &&
    exchanged >= CONSENT_AFTER_MESSAGES;
  const toggleMuted = () =>
    updateMinimoas.mutate(
      { muted: !muted },
      {
        onSuccess: (next) =>
          setNotice({ tone: 'success', text: next.muted ? chatText.mutedNotice : chatText.unmutedNotice }),
        onError: () => setNotice({ tone: 'error', text: chatText.muteError }),
      },
    );
  const answerConsent = (consent: boolean) =>
    updateMinimoas.mutate(
      { consent },
      { onError: () => setNotice({ tone: 'error', text: minimoaText.error }) },
    );

  return (
    <ScreenMotion>
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
        livesShort={todayText.livesCount(l.lives)}
        livesFrom={revived ? 0 : undefined}
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

      {/* Accord de lecture : après quelques messages échangés, la phrase de l'API telle quelle et les deux choix. */}
      <SheetTemplate
        visible={askConsent && active === 'chat'}
        onClose={() => setConsentLater(true)}
        header={<View />}
        scroll
        closeLabel={minimoaText.later}
        footer={
          <>
            <Button
              label={minimoaText.accept}
              onPress={() => answerConsent(true)}
              loading={updateMinimoas.isPending && updateMinimoas.variables?.consent === true}
            />
            <Button
              label={minimoaText.decline}
              variant="ghost"
              onPress={() => answerConsent(false)}
              loading={updateMinimoas.isPending && updateMinimoas.variables?.consent === false}
            />
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

/** Souvenirs (V6-Souvenirs) : le lien en bref (meilleure série, messages), puis ses étapes et ses photos d'avant. */
function SouvenirsBody({ link }: { link: Link }) {
  const memories = useMemories(link.id);
  const stats = memories.data?.stats;
  // Vos habitudes en commun (série, régularité, moments), quand les deux ont choisi de les montrer.
  const shared = sharedHabitsView(link.sharedHabits, link.other.displayName);
  return (
    <View style={styles.body}>
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
      {shared ? <SharedHabitsCard {...shared} /> : null}
      <Milestones link={link} />
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
}: {
  link: Link;
  send: (body: string) => void;
  rhythm: string | null;
  /** La ligne du rythme ouvre les rôles des minimoas (l'explication reste à un tap, jamais affichée en continu). */
  onRhythm: () => void;
  notice: Notice | null;
  onNotice: (n: Notice | null) => void;
}) {
  const [draft, setDraft] = useDraft(`link:${link.id}`);
  const { refusal, clear } = useRefusal(`link:${link.id}`);
  const ghost = link.status !== 'active';
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
          text={errorText(refusal, chatText.sendError, { link_not_active: chatText.ghostDisabled })}
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
        disabled={ghost}
        disabledText={chatText.ghostDisabled}
        sendLabel={chatText.send}
      />
    </View>
  );
}

// ── Lien fantôme ────────────────────────────────────────────────────────────
function GhostBody({
  link,
  onBack,
  onLeft,
  onRevived,
}: {
  link: Link;
  onBack: () => void;
  onLeft: () => void;
  onRevived: () => void;
}) {
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
