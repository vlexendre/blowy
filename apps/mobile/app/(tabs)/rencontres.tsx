import type { Suggestion } from '@blowy/contract';
import { color } from '@blowy/tokens';
import { Banner, Button, EmptyState, Glyph, IncomingCard, Panel, PetImage, Skeleton, SuggestionCard, TabTemplate, Text, Title } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useAcceptEncounter, useDeclineEncounter, useEncounters, useShareInvite, useWave } from '@/features/encounters';
import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { rencontres as t } from '@/locales/rencontres';

const viaLabel = (s: Suggestion): string => (s.via === 'friend_of_friend' ? t.via.friend_of_friend(s.mutualName) : t.via[s.via]());

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
    <TabTemplate refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />}>
      <Panel gradient="coral" padding="lg">
        <View style={styles.heroRow}>
          <View style={styles.grow}>
            <Text variant="label">
              {t.kicker}
            </Text>
            <Title text={t.title(petName, encounters.data ? incoming.length + suggestions.length : null)} size={34} />
            <Text variant="bodyBold" size={13}>
              {t.text}
            </Text>
          </View>
          {myPet ? <PetImage species={myPet.species} form={myPet.form} size={104} animation="bob" outline /> : null}
        </View>
        <Button label={t.map} variant="white" size="sm" iconRight="chevron" onPress={() => router.push('/carte')} accessibilityLabel={t.mapA11y} style={styles.mapButton} />
      </Panel>

      {encounters.isError && !encounters.data ? (
        <Banner tone="error" title={t.loadError} text={encounters.error.message} actionLabel={t.retry} onAction={() => void encounters.refetch()} />
      ) : null}
      {actionError ? <Banner tone="error" text={errorText(actionError, t.actionError)} onClose={() => {
            wave.reset();
            accept.reset();
            decline.reset();
          }} /> : null}

      {encounters.isPending ? (
        <>
          <Skeleton height={260} radius="lg" />
          <Skeleton height={260} radius="lg" />
        </>
      ) : null}

      {incoming.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label">{t.incomingTitle}</Text>
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
        </View>
      ) : null}

      {suggestions.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label">{t.suggestionsTitle}</Text>
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
              openLabel={t.open}
              onOpen={() => router.push(`/rencontre/${s.user.id}`)}
            />
          ))}
        </View>
      ) : null}

      {encounters.data && incoming.length + suggestions.length === 0 ? (
        <View style={styles.section}>
          <EmptyState
            species={myPet?.species ?? 'nino'}
            mood="dodo"
            title={t.emptyTitle}
            text={t.emptyText(petName)}
            actionLabel={invite.copied ? chatsText.copied : t.emptyAction}
            onAction={() => void invite.share()}
          />
        </View>
      ) : null}

      {encounters.data ? (
        <View style={styles.reminder}>
          <Glyph name="dot" size={14} color={color.accent} />
          <Text variant="small" muted style={styles.grow}>
            {t.reminderShort}
          </Text>
        </View>
      ) : null}
    </TabTemplate>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  mapButton: { alignSelf: 'flex-start', marginTop: 12 },
  section: { gap: 12 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
});
