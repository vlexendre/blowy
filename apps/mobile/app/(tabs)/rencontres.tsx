import { ApiError } from '@blowy/api-client';
import type { EncounterHistoryItem, MatchExplanation } from '@blowy/contract';
import { color } from '@blowy/tokens';
import {
  Banner,
  Button,
  EmptyState,
  EncounterHistory,
  type EncounterHistoryEntry,
  EncountersHero,
  FarAwayCard,
  FanIn,
  IncomingCard,
  MapPlusStrip,
  MatchWhy,
  QuartierCard,
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
  isWaveLimit,
  useEncounterHistory,
  useLiveEncounters,
  useShareInvite,
  useWave,
  useWaveBlock,
  VISION_TEST_ROUTE,
  whyA11y,
} from '@/features/encounters';
import { useShareQuartier } from '@/features/growth';
import { errorText, timeLabel } from '@/features/links';
import { AreaSheet, useFreshPosition } from '@/features/map';
import { useMe } from '@/features/me';
import { openPlus, usePlusPerks } from '@/features/plus';
import { usePet } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { quartier as quartierText } from '@/locales/quartier';
import { carte as carteText, rencontres as t } from '@/locales/rencontres';

/** Silhouettes du « vu de loin » : un décor, jamais les formes des vraies personnes. */
const FAR_SPECIES = ['suzie', 'gaston', 'pia', 'nino'] as const;

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
  // « Ouvre ton quartier » : le compteur réel de ta zone quand personne n'est à te présenter (docs/VIRALITE.md).
  const quartier = useShareQuartier(quartierText.card.message);
  const zone = quartier.quartier.data?.status ?? null;
  const history = useEncounterHistory();
  const refetchHistory = history.refetch;
  useFocusEffect(
    useCallback(() => {
      void refetchHistory();
    }, [refetchHistory]),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [areaSheet, setAreaSheet] = useState(false);
  const bump = usePetBump();

  const myPet = pet.data?.pet;
  const petName = myPet?.name ?? chatsText.yourPet;
  const incoming = encounters.data?.incoming ?? [];
  const suggestions = encounters.data?.suggestions ?? [];
  // Trop de coucous (plafond du jour, coucous en attente) : pas une erreur, une explication et des boutons désactivés.
  const waveBlock = useWaveBlock(wave.error);
  const actionError = (isWaveLimit(wave.error) ? null : wave.error) ?? accept.error ?? decline.error;
  const shape = encounters.data?.petShape;
  const sulking = shape === 'boude';
  const sulkWave = wave.error instanceof ApiError && wave.error.code === 'forbidden';
  const toPet = () => router.navigate('/(tabs)/pet');
  const m = me.data;
  const noVision = m ? !m.visionTestDone : false;
  const noPlace = m ? !m.identity.location.consentAt || !m.identity.location.zone : false;
  const empty = !!encounters.data && incoming.length + suggestions.length === 0;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([encounters.refetch(), history.refetch(), me.refetch()]);
    setRefreshing(false);
  };

  // Pas de position : ce qui manque, et comment l'activer (ou, refusée, comment l'autoriser dans les Réglages).
  const denied = location.permission?.status === 'denied' && !location.permission.canAskAgain;
  // Refusée : choisir sa ville à la main (gratuit, App Review 5.1.1(iv)) ; sinon, activer la localisation.
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
      actionLabel={denied || location.result === 'denied' ? t.noLocation.chooseCity : t.noLocation.action}
      onAction={denied || location.result === 'denied' ? () => setAreaSheet(true) : () => void location.enable()}
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
      {shape === 'bof' || sulking ? <Banner tone="info" title={t.bofTitle(petName)} actionLabel={t.sulkAction} onAction={toPet} /> : null}
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

      {waveBlock && suggestions.some((s) => !s.waved) ? <Banner tone="info" text={waveBlock} /> : null}

      {suggestions.map((s, n) => (
        <FanIn key={s.user.id} index={incoming.length + n} once={`rencontres:s:${s.user.id}`} delay={120}>
        <SuggestionCard
          suggestion={s}
          ownerLabel={t.owner(s.user.displayName)}
          badgeLabel={s.via === 'new' ? t.badgeNew : undefined}
          compatLabel={t.compat}
          why={why(s.explanation)}
          waveLabel={t.wave(s.user.pet.name)}
          wavedLabel={t.waved}
          onWave={() => wave.mutate(s.user.id)}
          waving={wave.isPending && wave.variables === s.user.id}
          waveDisabled={!!waveBlock}
          openLabel={t.open}
          onOpen={() => router.push(`/rencontre/${s.user.id}`)}
        />
        </FanIn>
      ))}

      {/* Personne : on dit pourquoi, et ce qui aide (test de vision, localisation, inviter). */}
      {encounters.data && noVision ? (
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
      {empty && !noVision && zone ? (
        <QuartierCard
          kicker={quartierText.card.kicker}
          title={zone.open ? quartierText.card.openTitle(zone.label) : quartierText.card.title(zone.label)}
          counter={zone.open ? quartierText.card.openCounter(zone.count) : quartierText.card.counter(zone.count, zone.threshold, zone.label)}
          progress={zone.open ? 1 : zone.count / Math.max(1, zone.threshold)}
          text={zone.open ? quartierText.card.openText(petName) : quartierText.card.text(petName)}
          actionLabel={quartier.copied ? quartierText.card.copied : quartierText.card.action}
          onAction={() => void quartier.share()}
          species={myPet?.species ?? 'nino'}
        />
      ) : null}
      {empty && !noVision && !zone ? (
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
      {encounters.data && !noVision && noPlace ? placeBanner : null}
      {encounters.data && !noVision && noPlace && !(denied || location.result === 'denied') ? (
        <Button label={carteText.area.choose} variant="glass" size="sm" onPress={() => setAreaSheet(true)} />
      ) : null}

      {/* Vu de loin : de vraies personnes compatibles hors de ta zone, comptées par le serveur (docs/DESIR.md). */}
      {encounters.data?.far && m && !m.plus ? (
        <FarAwayCard
          kicker={t.far.kicker}
          title={encounters.data.far.label}
          text={t.far.text(petName)}
          ctaLabel={t.far.cta}
          onPress={() => openPlus('far_away')}
          species={FAR_SPECIES}
          count={encounters.data.far.count}
        />
      ) : null}
      {encounters.data && m && !m.plus && !noVision && !encounters.data.far ? (
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
    <AreaSheet visible={areaSheet} onClose={() => setAreaSheet(false)} />
    </ScreenMotion>
  );
}
