/** Onglet Moi (V6-Moi) : profil, lien « 3 mots », chiffres, Blowy+, liste courte menant aux réglages. */
import { color, space } from '@blowy/tokens';
import { Appear, Banner, PlusBanner, ProfileHero, SettingsSection, Skeleton, Stagger, StatTile, TabTemplate, WordsShareCard } from '@blowy/ui';
import { router } from 'expo-router';
import { Alert, RefreshControl, View } from 'react-native';

import { ScreenMotion, usePorts, wordsUrl } from '@/core';
import { useLinks } from '@/features/links';
import { displayUrl, useCopyShare, useMe } from '@/features/me';
import { usePet } from '@/features/pet';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.tab;
const DAY_MS = 86_400_000;

export default function Moi() {
  const me = useMe();
  const pet = usePet();
  const links = useLinks();
  const words = useCopyShare();
  const { purchases } = usePorts();

  const refresh = (
    <RefreshControl
      refreshing={me.isRefetching}
      tintColor={color.white}
      onRefresh={() => {
        void me.refetch();
        void pet.refetch();
        void links.refetch();
      }}
    />
  );

  if (!me.data) {
    return (
      <ScreenMotion>
      <TabTemplate gutter={12} gap={10} top={6}>
        {me.isError ? (
          <Appear key="error">
            <Banner tone="error" title={common.errorTitle} text={t.errorText} actionLabel={common.retry} onAction={() => void me.refetch()} />
          </Appear>
        ) : (
          <View style={{ gap: space.md }} accessibilityLabel={common.loading}>
            <Skeleton height={160} radius="xl" />
            <Skeleton height={150} radius="lg" />
            <Skeleton height={72} radius="lg" />
          </View>
        )}
      </TabTemplate>
      </ScreenMotion>
    );
  }

  const m = me.data;
  const petName = m.pet.name;
  const wordsLink = wordsUrl(m.wordsCode);
  const wordsCount = pet.data?.wordsCount ?? 0;
  const linkList = links.data ?? [];
  const bestStreak = linkList.reduce((best, l) => Math.max(best, l.streak), 0);
  const days = Math.max(1, Math.floor((Date.now() - Date.parse(m.pet.bornAt)) / DAY_MS) + 1);
  const soon = (text: string) => Alert.alert(t.pauseSoonTitle, text, [{ text: t.ok }]);

  // Les blocs arrivent en cascade à la première visite seulement (l'onglet reste monté) ; les chiffres défilent.
  return (
    <ScreenMotion>
    <TabTemplate refreshControl={refresh} gutter={12} gap={10} top={6}>
      <Stagger onceKey="moi" step={55}>
      <ProfileHero
        key="hero"
        title={t.title(m.displayName, petName)}
        hint={t.photoHint}
        photoUri={m.avatarUrl}
        photoLabel={t.photoLabel}
        pet={m.pet}
        petColor={color.accent}
        onPhotoPress={() => router.push('/moi/compte')}
      />

      <WordsShareCard
        key="words"
        title={t.wordsTitle}
        countLabel={t.wordsCount(wordsCount)}
        words={[]}
        emptyText={wordsCount > 0 ? t.wordsReceived(petName) : t.wordsEmpty(petName)}
        url={displayUrl(wordsLink)}
        copyLabel={t.copy}
        copiedLabel={t.copied}
        copied={words.copied}
        shareLabel={t.share}
        onCopy={() => void words.copy(wordsLink)}
        onShare={() => void words.share(t.wordsMessage(wordsLink), wordsLink)}
      />

      <View key="stats" style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile value={links.data ? String(linkList.length) : '–'} count={links.data ? linkList.length : undefined} label={t.stats.links} />
        <StatTile value={t.streakValue(bestStreak)} count={links.data ? bestStreak : undefined} suffix={t.streakSuffix} label={t.stats.streak} color={color.orange} />
        <StatTile value={String(days)} count={days} label={t.stats.days(petName)} color={color.accent} />
      </View>

      <PlusBanner
        key="plus"
        title={m.plus ? t.plusMemberTitle : purchases.available ? t.plusTitle : t.plusSoonTitle}
        text={t.plusText}
        ctaLabel={purchases.available && !m.plus ? t.plusCta : t.plusSoonCta}
        onPress={() => router.push('/moi/blowy-plus')}
      />

      <SettingsSection
        key="rows"
        variant="plain"
        rows={[
          {
            key: 'pause',
            title: t.rows.pause.title,
            subtitle: t.rows.pause.subtitle(petName),
            switchValue: false,
            onSwitchChange: () => soon(t.pauseSoonText(petName)),
          },
          { key: 'reach', title: t.rows.reach.title(petName), subtitle: t.rows.reach.subtitle, onPress: () => soon(t.reachSoonText(petName)) },
          { key: 'settings', ...t.rows.settings, onPress: () => router.push('/moi/reglages') },
        ]}
      />
      </Stagger>
    </TabTemplate>
    </ScreenMotion>
  );
}
