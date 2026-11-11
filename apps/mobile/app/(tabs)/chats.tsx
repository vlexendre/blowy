import { color } from '@blowy/tokens';
import { Banner, Button, EmptyState, IconButton, LinkRow, Panel, PetImage, Pressable, Skeleton, TabTemplate, Text, Title } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useEncounters, useShareInvite } from '@/features/encounters';
import { isNewLink, sortLinks, timeLabel, useLinks, waitingForMyPhoto } from '@/features/links';
import { usePet } from '@/features/pet';
import { chats as t } from '@/locales/chats';

export default function ChatsScreen() {
  const router = useRouter();
  const links = useLinks();
  const encounters = useEncounters();
  const pet = usePet();
  const invite = useShareInvite(t.shareMessage);
  const [refreshing, setRefreshing] = useState(false);

  const list = sortLinks(links.data ?? []);
  const incoming = encounters.data?.incoming ?? [];
  const waiting = waitingForMyPhoto(list);
  const petName = pet.data?.pet.name ?? '';
  const now = new Date();

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([links.refetch(), encounters.refetch()]);
    setRefreshing(false);
  };

  const first = incoming[0];
  const waitingFirst = waiting[0];

  return (
    <TabTemplate
      brand={t.brand}
      title={t.title(list.length)}
      right={<IconButton glyph="plus" label={t.newChat} variant="accent" onPress={() => router.push('/rencontres')} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />}
    >
      {first ? (
        <Pressable onPress={() => router.push('/rencontres')} accessibilityRole="button" accessibilityLabel={t.wavesA11y(incoming.length)} scaleTo={0.98}>
          <Panel gradient="violet" padding="lg">
            <View style={styles.bannerRow}>
              <View style={styles.grow}>
                <Text variant="label">
                  {t.wavesKicker}
                </Text>
                <Title text={t.wavesTitle(petName || first.from.pet.name)} size={26} />
                <Text variant="bodyBold" size={13}>
                  {t.wavesText(incoming.map((i) => i.from.displayName))}
                </Text>
              </View>
              <PetImage species={first.from.pet.species} mood="salut" size={88} animation="bob" outline />
            </View>
          </Panel>
        </Pressable>
      ) : null}

      {waitingFirst ? (
        <Pressable onPress={() => router.push(`/link/${waitingFirst.id}?tab=today`)} accessibilityRole="button" accessibilityLabel={t.photoA11y} scaleTo={0.98}>
          <Panel gradient="orange" padding="lg">
            <View style={styles.bannerRow}>
              <View style={styles.grow}>
                <Text variant="label" dim>
                  {t.photoKicker}
                </Text>
                <Title text={t.photoTitle(waiting.length)} size={26} />
                <Text variant="bodyBold" size={13}>
                  {t.photoText(waiting.map((l) => l.other.displayName))}
                </Text>
              </View>
              <PetImage species={waitingFirst.other.pet.species} mood="surpris" size={88} outline />
            </View>
          </Panel>
        </Pressable>
      ) : null}

      {links.isError && !links.data ? <Banner tone="error" title={t.errorTitle} text={links.error.message} actionLabel={t.retry} onAction={() => void links.refetch()} /> : null}

      {links.isPending ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={72} height={44} radius="pill" />
              <View style={styles.grow}>
                <Skeleton width="50%" height={16} />
                <Skeleton width="85%" height={12} style={styles.skeletonLine} />
              </View>
            </View>
          ))}
        </View>
      ) : list.length === 0 && !links.isError ? (
        <View style={styles.empty}>
          <EmptyState
            species={pet.data?.pet.species ?? 'nino'}
            mood="triste"
            title={t.emptyTitle}
            text={t.emptyText(petName || t.yourPet)}
            actionLabel={t.emptyAction}
            onAction={() => router.push('/rencontres')}
          />
          <Button label={invite.copied ? t.copied : t.shareInvite} variant="ghost" icon="share" onPress={() => void invite.share()} disabled={!invite.ready} />
        </View>
      ) : (
        <View style={styles.list}>
          {list.map((l) => (
            <LinkRow
              key={l.id}
              link={l}
              timeLabel={l.lastMessage ? timeLabel(l.lastMessage.at, now) : undefined}
              levelLabel={t.level(l.level)}
              emptyPreview={t.emptyPreview}
              ghostLabel={t.ghost}
              newLabel={isNewLink(l, now) ? t.isNew : undefined}
              onPress={() => router.push(`/link/${l.id}`)}
            />
          ))}
        </View>
      )}
    </TabTemplate>
  );
}

const styles = StyleSheet.create({
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  list: { gap: 4 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  skeletonLine: { marginTop: 8 },
  empty: { gap: 12, paddingTop: 24 },
});
