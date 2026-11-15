import { ApiError } from '@blowy/api-client';
import { shapeLabel } from '@/locales/content';
import type { EncounterHistoryItem, MatchExplanation, Suggestion } from '@blowy/contract';
import { color } from '@blowy/tokens';
import {
  Banner,
  DotNote,
  EmptyState,
  EncounterHistory,
  type EncounterHistoryEntry,
  EncountersHero,
  FanIn,
  IncomingCard,
  MapPlusStrip,
  MatchWhy,
  Skeleton,
  SuggestionCard,
  TabTemplate,
  usePetBump,
} from '@blowy/ui';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, RefreshControl } from 'react-native';

import { ScreenMotion } from '@/core';
import {
  useAcceptEncounter,
  useDeclineEncounter,
  useEncounterHistory,
  useLiveEncounters,
  useShareInvite,
  useWave,
  lookingForLine,
  VISION_TEST_ROUTE,
  whyA11y,
} from '@/features/encounters';
import { errorText, timeLabel } from '@/features/links';
import { useFreshPosition } from '@/features/map';
import { useMe } from '@/features/me';
import { openPlus, usePlusPerks } from '@/features/plus';
import { usePet } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { rencontres as t } from '@/locales/rencontres';

const viaLabel = (s: Suggestion): string =>
  s.via === 'friend_of_friend' ? t.via.friend_of_friend(s.mutualName) : t.via[s.via]();

/** Pourquoi, en une ligne (les phrases et les repères sont sur l'écran de la rencontre). */
const why = (e: MatchExplanation) => (
  <MatchWhy commonTitle={e.commonTitle} common={e.common.map((c) => c.name)} exploreTitle={e.exploreTitle} explore={e.explore.name} accessibilityLabel={whyA11y(e, t.whyJoin)} />
);

/** Une ligne de l'historique : qui, dans quel sens, quand ; une rencontre acceptée ouvre son lien. */
const historyEntry = (item: EncounterHistoryItem, openLink: (linkId: string) => void): EncounterHistoryEntry => {
  const when = timeLabel(item.at);
  const { linkId } = item;
  return {
    key: item.id,
    person: item.person,
    title: item.person.displayName,
    detail: item.direction === 'received' ? t.history.received(item.person.pet.name, when) : t.history.sent(item.person.pet.name, when),
    statusLabel: t.history.outcome[item.outcome],
    tone: item.outcome,
    onPress: linkId ? () => openLink(linkId) : undefined,
    accessibilityLabel: linkId ? `${t.history.openA11y(item.person.displayName)}, ${t.history.outcome[item.outcome]}, ${when}` : undefined,
  };
};

export default function RencontresScreen() {
  const router = useRouter();
  const encounters = useLiveEncounters();
  const pet = usePet();
  const me = useMe();
  const morePerk = usePlusPerks(me.data?.pet.name ?? '').find((p) => p.key === 'more_encounters');
  const location = useFreshPosition(me.data);
  const wave = useWave();
  const accept = useAcceptEncounter();
  const decline = useDeclineEncounter();
  const invite = useShareInvite(t.shareMessage);
  const history = useEncounterHistory();
  const refetchHistory = history.refetch;
  useFocusEffect(
    useCallback(() => {
      void refetchHistory();
    }, [refetchHistory]),
  );
  const [refreshing, setRefreshing] = useState(false);
  const bump = usePetBump();

  const myPet = pet.data?.pet;
  const petName = myPet?.name ?? chatsText.yourPet;
  const incoming = encounters.data?.incoming ?? [];
  const suggestions = encounters.data?.suggestions ?? [];
  const actionError = wave.error ?? accept.error ?? decline.error;
  const shape = encounters.data?.petShape;
  const sulking = shape === 'boude';
  const sulkWave = wave.error instanceof ApiError && wave.error.code === 'forbidden';
  const toPet = () => router.navigate('/(tabs)/pet');
  const m = me.data;
  const noVision = m ? !m.visionTestDone : false;
  const noPlace = m ? !m.identity.location.consentAt || !m.identity.location.zone : false;
  const empty = !!encounters.data && !sulking && incoming.length + suggestions.length === 0;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([encounters.refetch(), history.refetch(), me.refetch()]);
    setRefreshing(false);
  };

  // Pas de position : ce qui manque, et comment l'activer (ou, refusée, comment l'autoriser dans les Réglages).
  const denied = location.permission?.status === 'denied' && !location.permission.canAskAgain;
  const placeBanner = (
    <Banner
      tone="info"
      title={t.noLocation.title}
      text={
        location.result === 'unavailable'
          ? t.noLocation.unavailable
          : denied || location.result === 'denied'
            ? Platform.OS === 'web'
              ? t.noLocation.deniedWeb
              : t.noLocation.denied
            : t.noLocation.text(petName)
      }
      actionLabel={denied && Platform.OS !== 'web' ? t.noLocation.settings : denied ? undefined : t.noLocation.action}
      onAction={denied ? location.openSettings : () => void location.enable()}
      actionBelow
    />
  );

  return (
    <ScreenMotion>
    <TabTemplate
      gutter={12}
      gap={10}
      top={6}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />}
    >
      <EncountersHero
        kicker={t.kicker}
        title={t.title(petName, encounters.data ? incoming.length + suggestions.length : null)}
        text={t.text}
        species={myPet?.species}
        action={{
          label: t.map,
          plus: t.plus,
          onPress: () => router.push('/carte'),
          accessibilityLabel: t.mapA11y,
        }}
      />

      {encounters.isError && !encounters.data ? (
        <Banner
          tone="error"
          title={t.loadError}
          text={encounters.error.message}
          actionLabel={t.retry}
          onAction={() => void encounters.refetch()}
        />
      ) : null}
      {shape === 'bof' ? <Banner tone="info" title={t.bofTitle(petName)} text={shapeLabel.bof?.text ?? ''} actionLabel={t.sulkAction} onAction={toPet} /> : null}
      {actionError ? (
        <Banner
          tone="error"
          text={sulkWave ? t.waveSulk(petName) : errorText(actionError, t.actionError)}
          actionLabel={sulkWave ? t.sulkAction : undefined}
          onAction={sulkWave ? toPet : undefined}
          onClose={() => {
            wave.reset();
            accept.reset();
            decline.reset();
          }}
        />
      ) : null}

      {sulking ? (
        <EmptyState
          species={myPet?.species ?? 'nino'}
          mood="colere"
          title={t.sulkTitle(petName)}
          text={shapeLabel.boude?.text}
          actionLabel={t.sulkAction}
          onAction={toPet}
        />
      ) : null}

      {encounters.isPending ? (
        <>
          <Skeleton height={260} radius="lg" />
          <Skeleton height={260} radius="lg" />
        </>
      ) : null}

      {incoming.map((i, n) => (
        <FanIn key={i.id} index={n} once={`rencontres:in:${i.id}`} delay={120}>
        <IncomingCard
          incoming={i}
          title={t.incomingCard(i.from.displayName)}
          ownerLabel={t.incomingOwner(i.from.pet.name, i.from.displayName)}
          compatLabel={t.compat}
          // Sans explication (visions pas assez connues) : jamais de pourcentage seul.
          hideCompat={!i.explanation}
          why={i.explanation ? why(i.explanation) : undefined}
          acceptLabel={t.accept}
          declineLabel={t.decline}
          openLabel={t.open}
          onOpen={() => router.push(`/rencontre/${i.from.id}`)}
          accepting={accept.isPending && accept.variables === i.id}
          declining={decline.isPending && decline.variables === i.id}
          onAccept={() =>
            accept.mutate(i.id, {
              onSuccess: (link) => {
                // Les deux pets se courent dessus au-dessus de l'écran pendant que le lien s'ouvre.
                if (myPet) bump({ left: myPet.species, right: i.from.pet.species });
                router.push(`/link/${link.id}`);
              },
            })
          }
          onDecline={() => decline.mutate(i.id)}
        />
        </FanIn>
      ))}

      {suggestions.map((s, n) => (
        <FanIn key={s.user.id} index={incoming.length + n} once={`rencontres:s:${s.user.id}`} delay={120}>
        <SuggestionCard
          suggestion={s}
          ownerLabel={t.owner(s.user.displayName)}
          viaLabel={viaLabel(s)}
          badgeLabel={s.via === 'new' ? t.badgeNew : undefined}
          compatLabel={t.compat}
          tagline={lookingForLine(s.lookingFor, t.lookingFor) ?? undefined}
          why={why(s.explanation)}
          introLabel={t.introLabel(petName)}
          waveLabel={t.wave(s.user.pet.name)}
          wavedLabel={t.waved}
          onWave={() => wave.mutate(s.user.id)}
          waving={wave.isPending && wave.variables === s.user.id}
          openLabel={t.openTalk}
          onOpen={() => router.push(`/rencontre/${s.user.id}`)}
        />
        </FanIn>
      ))}

      {/* Personne : on dit pourquoi, et ce qui aide (test de vision, localisation, inviter). */}
      {encounters.data && !sulking && noVision ? (
        <EmptyState
          peek
          seed={myPet?.id}
          species={myPet?.species ?? 'nino'}
          mood="surpris"
          title={t.noVision.title}
          text={t.noVision.text(petName)}
          actionLabel={t.noVision.action}
          onAction={() => router.push(VISION_TEST_ROUTE)}
        />
      ) : null}
      {empty && !noVision ? (
        <EmptyState
          peek
          seed={myPet?.id}
          species={myPet?.species ?? 'nino'}
          mood="dodo"
          title={t.emptyTitle}
          text={t.emptyText(petName)}
          actionLabel={invite.copied ? chatsText.copied : t.emptyAction}
          onAction={() => void invite.share()}
        />
      ) : null}
      {encounters.data && !sulking && !noVision && noPlace ? placeBanner : null}

      {encounters.data && !sulking && !noVision ? <DotNote text={t.filterNote(petName)} /> : null}
      {encounters.data ? <DotNote text={t.reminderShort} dot={color.mute} /> : null}
      {encounters.data && m && !m.plus && !sulking && !noVision ? (
        <MapPlusStrip title={t.morePlus.title} text={morePerk?.label ?? morePerk?.short[0] ?? ''} ctaLabel={t.morePlus.cta} onPress={() => openPlus('encounters')} />
      ) : null}

      <EncounterHistory
        title={t.history.title}
        entries={history.items.map((item) => historyEntry(item, (linkId) => router.push(`/link/${linkId}`)))}
        moreLabel={t.history.more}
        onMore={history.hasNextPage ? () => void history.fetchNextPage() : undefined}
        loadingMore={history.isFetchingNextPage}
      />
    </TabTemplate>
    </ScreenMotion>
  );
}
