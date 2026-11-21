import type { EncounterHistoryItem } from '@blowy/contract';
import { entitlements } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Banner,
  Button,
  EmptyState,
  EncounterHistory,
  type EncounterHistoryEntry,
  EncounterMore,
  EncounterNext,
  EncounterRow,
  EncounterSection,
  EncountersHeader,
  EncounterWaiting,
  FarAwayCard,
  FanIn,
  QuartierCard,
  Skeleton,
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
} from '@/features/encounters';
import { hasSessionToDo, useCheminMap } from '@/features/chemin';
import { useShareQuartier } from '@/features/growth';
import { errorText, timeLabel } from '@/features/links';
import { AreaSheet, useFreshPosition } from '@/features/map';
import { useMe } from '@/features/me';
import { openPlus } from '@/features/plus';
import { usePet, usePetSleep } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { quartier as quartierText } from '@/locales/quartier';
import { carte as carteText, rencontres as t } from '@/locales/rencontres';

/** Silhouettes du « vu de loin » : un décor, jamais les formes des vraies personnes. */
const FAR_SPECIES = ['suzie', 'gaston', 'pia', 'nino'] as const;

/** Une ligne de l'historique : qui, dans quel sens, quand ; une rencontre acceptée ouvre son lien. */
const historyEntry = (
  item: EncounterHistoryItem,
  openLink: (linkId: string) => void,
): EncounterHistoryEntry => {
  const when = timeLabel(item.at);
  const { linkId } = item;
  return {
    key: item.id,
    person: item.person,
    title: item.person.displayName,
    detail:
      item.direction === 'received'
        ? t.history.received(item.person.pet.name, when)
        : t.history.sent(item.person.pet.name, when),
    statusLabel: t.history.outcome[item.outcome],
    tone: item.outcome,
    onPress: linkId ? () => openLink(linkId) : undefined,
    accessibilityLabel: linkId
      ? `${t.history.openA11y(item.person.displayName)}, ${t.history.outcome[item.outcome]}, ${when}`
      : undefined,
  };
};

export default function RencontresScreen() {
  const router = useRouter();
  const encounters = useLiveEncounters();
  const pet = usePet();
  const me = useMe();
  const chemin = useCheminMap();
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
  // Premier jour : jamais endormi, même sur l'état vide (on y arrive depuis la bulle du soir de l'accueil).
  const firstDay = usePetSleep(myPet?.bornAt).firstDay;
  const petName = myPet?.name ?? chatsText.yourPet;
  const incoming = encounters.data?.incoming ?? [];
  const suggestions = encounters.data?.suggestions ?? [];
  // Trop de coucous (plafond du jour, coucous en attente) : pas une erreur, une explication et des boutons désactivés.
  const waveBlock = useWaveBlock(wave.error);
  const actionError = (isWaveLimit(wave.error) ? null : wave.error) ?? accept.error ?? decline.error;
  const shape = encounters.data?.petShape;
  const sulking = shape === 'boude';
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
      onAction={
        denied || location.result === 'denied' ? () => setAreaSheet(true) : () => void location.enable()
      }
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
        <EncountersHeader
          title={t.screen.title}
          actionLabel={t.map}
          actionA11y={t.mapA11y}
          onAction={() => router.navigate('/(tabs)/carte')}
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
        {actionError ? (
          <Banner
            tone="error"
            text={errorText(actionError, t.actionError)}
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

        {incoming.length > 0 ? <EncounterSection title={t.screen.waiting(incoming.length)} /> : null}
        {incoming.map((i, n) => (
          <FanIn key={i.id} index={n} once={`rencontres:in:${i.id}`} delay={120}>
            <EncounterWaiting
              person={i.from}
              title={t.screen.waitingTitle(i.from.displayName)}
              sub={t.screen.waitingSub(i.from.pet.name, petName, timeLabel(i.at))}
              reason={i.explanation?.common[0]?.text ?? null}
              declineLabel={t.decline}
              acceptLabel={t.screen.reply}
              openLabel={t.open}
              onOpen={() => router.push(`/rencontre/${i.from.id}`)}
              accepting={accept.isPending && accept.variables === i.id}
              declining={decline.isPending && decline.variables === i.id}
              onAccept={() =>
                accept.mutate(i.id, {
                  onSuccess: (link) => {
                    // Les deux minimoas se courent dessus au-dessus de l'écran pendant que le lien s'ouvre.
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

        {suggestions.length > 0 ? <EncounterSection title={t.screen.today(suggestions.length)} /> : null}
        {suggestions.map((s, n) => (
          <FanIn key={s.user.id} index={incoming.length + n} once={`rencontres:s:${s.user.id}`} delay={120}>
            <EncounterRow
              person={s.user}
              reason={s.explanation.common[0]?.text ?? s.intro}
              badge={s.via === 'new' && !s.waved ? t.badgeNew : undefined}
              status={s.waved ? t.waved : undefined}
              accessibilityLabel={`${t.open}, ${s.user.displayName}`}
              onPress={() => router.push(`/rencontre/${s.user.id}`)}
            />
          </FanIn>
        ))}
        {encounters.data && m && !m.plus && !noVision && !encounters.data.far && suggestions.length > 0 ? (
          <EncounterMore
            pets={FAR_SPECIES.slice(0, 2).map((species) => ({ name: '', species }))}
            title={t.screen.moreTitle}
            text={t.screen.moreText(entitlements(true).presentationsPerDay)}
            onPress={() => openPlus('encounters')}
          />
        ) : null}

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
            counter={
              zone.open
                ? quartierText.card.openCounter(zone.count)
                : quartierText.card.counter(zone.count, zone.threshold, zone.label)
            }
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
            mood={firstDay ? 'neutre' : 'dodo'}
            title={t.emptyTitle}
            text={t.emptyText(petName)}
            actionLabel={invite.copied ? chatsText.copied : t.emptyAction}
            onAction={() => void invite.share()}
          />
        ) : null}
        {encounters.data && !noVision && noPlace ? placeBanner : null}
        {encounters.data && !noVision && noPlace && !(denied || location.result === 'denied') ? (
          <Button
            label={carteText.area.choose}
            variant="glass"
            size="sm"
            onPress={() => setAreaSheet(true)}
          />
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
        <EncounterHistory
          title={t.history.title}
          entries={history.items.map((item) =>
            historyEntry(item, (linkId) => router.push(`/link/${linkId}`)),
          )}
          moreLabel={t.history.more}
          onMore={history.hasNextPage ? () => void history.fetchNextPage() : undefined}
          loadingMore={history.isFetchingNextPage}
        />

        {/* Demain, quelqu'un d'autre : la séance du jour aide le minimoa à mieux chercher. */}
        {myPet && chemin.data && !noVision ? (
          <EncounterNext
            pet={myPet}
            title={t.screen.nextTitle}
            text={hasSessionToDo(chemin.data) ? t.screen.nextTodo(petName) : t.screen.nextDone(petName)}
            onPress={() =>
              hasSessionToDo(chemin.data) ? router.push('/chemin/seance') : router.navigate('/(tabs)/pet')
            }
          />
        ) : null}
      </TabTemplate>
      <AreaSheet visible={areaSheet} onClose={() => setAreaSheet(false)} />
    </ScreenMotion>
  );
}
