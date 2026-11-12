import type { Suggestion } from '@blowy/contract';
import { color } from '@blowy/tokens';
import {
  Banner,
  DotNote,
  EmptyState,
  EncountersHero,
  IncomingCard,
  Skeleton,
  SuggestionCard,
  TabTemplate,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl } from 'react-native';

import {
  useAcceptEncounter,
  useDeclineEncounter,
  useEncounters,
  useShareInvite,
  useWave,
} from '@/features/encounters';
import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { rencontres as t } from '@/locales/rencontres';

const viaLabel = (s: Suggestion): string =>
  s.via === 'friend_of_friend' ? t.via.friend_of_friend(s.mutualName) : t.via[s.via]();

export default function RencontresScreen() {
  const router = useRouter();
  const encounters = useEncounters();
  const pet = usePet();
  const wave = useWave();
  const accept = useAcceptEncounter();
  const decline = useDeclineEncounter();
  const invite = useShareInvite(t.shareMessage);
  const [refreshing, setRefreshing] = useState(false);

  const myPet = pet.data?.pet;
  const petName = myPet?.name ?? chatsText.yourPet;
  const incoming = encounters.data?.incoming ?? [];
  const suggestions = encounters.data?.suggestions ?? [];
  const actionError = wave.error ?? accept.error ?? decline.error;

  const refresh = async () => {
    setRefreshing(true);
    await encounters.refetch();
    setRefreshing(false);
  };

  return (
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

      {incoming.map((i) => (
        <IncomingCard
          key={i.id}
          incoming={i}
          title={t.incomingCard(i.from.displayName)}
          ownerLabel={t.incomingOwner(i.from.pet.name, i.from.displayName)}
          compatLabel={t.compat}
          acceptLabel={t.accept}
          declineLabel={t.decline}
          openLabel={t.open}
          onOpen={() => router.push(`/rencontre/${i.from.id}`)}
          accepting={accept.isPending && accept.variables === i.id}
          declining={decline.isPending && decline.variables === i.id}
          onAccept={() => accept.mutate(i.id, { onSuccess: (link) => router.push(`/link/${link.id}`) })}
          onDecline={() => decline.mutate(i.id)}
        />
      ))}

      {suggestions.map((s) => (
        <SuggestionCard
          key={s.user.id}
          suggestion={s}
          ownerLabel={t.owner(s.user.displayName)}
          viaLabel={viaLabel(s)}
          badgeLabel={s.via === 'new' ? t.badgeNew : undefined}
          compatLabel={t.compat}
          introLabel={t.introLabel(petName)}
          waveLabel={t.wave(s.user.pet.name)}
          wavedLabel={t.waved}
          onWave={() => wave.mutate(s.user.id)}
          waving={wave.isPending && wave.variables === s.user.id}
          openLabel={t.openTalk}
          onOpen={() => router.push(`/rencontre/${s.user.id}`)}
        />
      ))}

      {encounters.data && incoming.length + suggestions.length === 0 ? (
        <EmptyState
          species={myPet?.species ?? 'nino'}
          mood="dodo"
          title={t.emptyTitle}
          text={t.emptyText(petName)}
          actionLabel={invite.copied ? chatsText.copied : t.emptyAction}
          onAction={() => void invite.share()}
        />
      ) : null}

      {encounters.data ? <DotNote text={t.reminderShort} /> : null}
    </TabTemplate>
  );
}
