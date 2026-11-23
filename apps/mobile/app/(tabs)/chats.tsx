/**
 * Onglet Chats (V6-Chats) : les conversations, et « Déjà croisés » replié tout en bas (rencontres passées, ADA 2027).
 * Les bonjours reçus vivent dans Quartier (un évènement,
 * un seul endroit). En tête, les séries en jeu, puis les liens (vies, séries, niveaux).
 */

import { color, speciesColor } from '@blowy/tokens';
import {
  Appear,
  Banner,
  Button,
  EmptyState,
  LinkList,
  LinkListEmpty,
  LinkListSkeleton,
  EncounterHistory,
  IconButton,
  LinkRow,
  NudgeBanner,
  staggerDelay,
  TabTemplate,
} from '@blowy/ui';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

import { ScreenMotion } from '@/core';
import { historyEntry, useEncounterHistory, useEncounters, useShareInvite } from '@/features/encounters';
import {
  isMyTurn,
  isNewLink,
  sortLinks,
  streaksWaitingOnMe,
  timeLabel,
  useLinks,
  usePrefetchLink,
} from '@/features/links';
import { usePet } from '@/features/pet';
import { chats as t } from '@/locales/chats';
import { rencontres as rencontresText } from '@/locales/rencontres';
import { voisins } from '@/locales/voisins';

export default function ChatsScreen() {
  const router = useRouter();
  const links = useLinks();
  const encounters = useEncounters();
  // « Déjà croisés » : relu à chaque retour sur l'onglet (une rencontre acceptée ailleurs y apparaît).
  const history = useEncounterHistory();
  const refetchHistory = history.refetch;
  useFocusEffect(
    useCallback(() => {
      void refetchHistory();
    }, [refetchHistory]),
  );
  const pet = usePet();
  const invite = useShareInvite(t.shareMessage);
  const [refreshing, setRefreshing] = useState(false);

  const list = sortLinks(links.data ?? []);
  // Séries en jeu où l'autre a déjà écrit aujourd'hui : c'est à toi (la plus longue d'abord).
  const waiting = streaksWaitingOnMe(list);
  const petName = pet.data?.pet.name ?? '';
  const now = new Date();
  // Les chats qu'on a le plus de chances d'ouvrir (non lus, puis les premiers de la liste) : leurs messages sont lus
  // d'avance, le chat s'ouvre déjà rempli. Au plus 3, et pas plus d'une fois par 15 s (cache).
  const prefetch = usePrefetchLink();
  const likely = list
    .filter((l) => l.status === 'active')
    .sort((a, b) => b.unread - a.unread)
    .slice(0, 3)
    .map((l) => l.id)
    .join(',');
  useEffect(() => {
    if (likely) for (const id of likely.split(',')) prefetch(id);
  }, [likely, prefetch]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([links.refetch(), encounters.refetch(), history.refetch()]);
    setRefreshing(false);
  };

  // Les bonjours reçus se traitent dans Quartier (un évènement, un seul endroit) : ici, les séries en jeu.
  const waitingFirst = waiting[0];

  return (
    <ScreenMotion>
      <TabTemplate
        brand={t.brand}
        title={t.title(list.length)}
        right={
          <IconButton
            glyph="plus"
            label={t.newChat}
            variant="accent"
            onPress={() => router.navigate('/(tabs)/quartier')}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />}
      >
        {waitingFirst ? (
          <Appear once={`chats:turn:${waitingFirst.id}:${waitingFirst.today.day}`}>
            <NudgeBanner
              gradient="orange"
              icon="flamme"
              kicker={t.turnKicker}
              title={t.turnTitle(waiting.length)}
              text={t.turnText(waiting.map((l) => l.other.displayName))}
              species={pet.data?.pet.species ?? waitingFirst.myPet.species}
              mood="joie"
              onPress={() => router.push(`/link/${waitingFirst.id}`)}
              accessibilityLabel={t.turnA11y}
            />
          </Appear>
        ) : null}

        {links.isError && !links.data ? (
          <Banner
            tone="error"
            title={t.errorTitle}
            text={links.error.message}
            actionLabel={t.retry}
            onAction={() => void links.refetch()}
          />
        ) : null}

        {links.isPending ? (
          <LinkListSkeleton />
        ) : list.length === 0 && !links.isError ? (
          <LinkListEmpty>
            <EmptyState
              peek
              seed={pet.data?.pet.id}
              species={pet.data?.pet.species ?? 'nino'}
              mood="neutre"
              title={t.emptyTitle}
              text={t.emptyText(petName || t.yourPet)}
              actionLabel={t.emptyAction}
              onAction={() => router.navigate('/(tabs)/quartier')}
            />
            <Button
              label={invite.copied ? t.copied : t.shareInvite}
              variant="ghost"
              icon="share"
              onPress={() => void invite.share()}
              disabled={!invite.ready}
            />
          </LinkListEmpty>
        ) : (
          <LinkList>
            {list.map((l, i) => (
              <Appear key={l.id} once={`chats:${l.id}`} delay={(waitingFirst ? 140 : 0) + staggerDelay(i)}>
                <LinkRow
                  link={l}
                  timeLabel={l.lastMessage ? timeLabel(l.lastMessage.at, now) : undefined}
                  levelLabel={t.level(l.level)}
                  emptyPreview={t.emptyPreview}
                  ghostLabel={t.ghost}
                  newLabel={isNewLink(l, now) ? t.isNew : undefined}
                  noteLabel={isNewLink(l, now) ? t.introducedBy(l.myPet.name) : undefined}
                  previewAuthor={
                    l.lastMessage?.author === 'my_pet'
                      ? `${l.myPet.name} :`
                      : l.lastMessage?.author === 'other_pet'
                        ? `${l.other.pet.name} :`
                        : undefined
                  }
                  previewAuthorColor={
                    l.lastMessage?.author === 'other_pet' ? speciesColor[l.other.pet.species] : undefined
                  }
                  streak={l.status === 'active' ? l.streak : 0}
                  streakUnit={t.streakUnit}
                  turnLabel={isMyTurn(l) ? t.turn : undefined}
                  onPress={() => {
                    prefetch(l.id);
                    router.push(`/link/${l.id}`);
                  }}
                />
              </Appear>
            ))}
          </LinkList>
        )}
        {/* Rencontres passées (liés, rangés, pas cette fois, en attente), repliées en bas : jamais une personne bloquée. */}
        <EncounterHistory
          title={voisins.history}
          collapsible
          entries={history.items.map((item) => historyEntry(item, (linkId) => router.push(`/link/${linkId}`)))}
          moreLabel={rencontresText.history.more}
          onMore={history.hasNextPage ? () => void history.fetchNextPage() : undefined}
          loadingMore={history.isFetchingNextPage}
        />
      </TabTemplate>
    </ScreenMotion>
  );
}
