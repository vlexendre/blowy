/** Onglet Moi (V6-Moi) : profil, lien « 3 mots », chiffres, Blowy+, liste courte menant aux réglages. */
import { color, space } from '@blowy/tokens';
import { Appear, Banner, PlusBanner, ProfileHero, SettingsSection, Skeleton, Stagger, StatTile, TabTemplate, WordsShareCard } from '@blowy/ui';
import { router } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { ScreenMotion, usePorts, wordsUrl } from '@/core';
import { useLinks } from '@/features/links';
import { displayUrl, useCopyShare, useMe } from '@/features/me';
import { openPlus, plusPerksLine, usePlusPerks, useSubscription } from '@/features/plus';
import { useDiscreet } from '@/features/map';
import { useLivePet } from '@/features/pet';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.tab;
const DAY_MS = 86_400_000;

export default function Moi() {
  const me = useMe();
  const pet = useLivePet();
  const links = useLinks();
  const words = useCopyShare();
  const { purchases } = usePorts();
  const discreet = useDiscreet();
  const subscription = useSubscription(!!me.data?.plus);
  // Les avantages viennent de la même source que la feuille Blowy+ (jamais une autre liste ici).
  const perks = usePlusPerks(me.data?.pet.name ?? '');

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
  const seeking = moi.identite.seekingShort[m.identity.seeking] ?? '';

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
        badge={t.wordsBadge}
        words={[]}
        received={wordsCount > 0}
        emptyText={t.wordsLead(petName)}
        steps={t.wordsSteps(petName)}
        receivedText={t.wordsReceived(petName)}
        moreLabel={t.wordsMore(petName)}
        onMore={() => router.push('/pet/caractere')}
        url={displayUrl(wordsLink)}
        copyLabel={t.copy}
        copiedLabel={t.copied}
        copied={words.copied}
        shareLabel={t.wordsShareCta}
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
        // Pas de prix ici : le montant facturé se lit sur la feuille Blowy+ (règle Apple 3.1.2, spéc §13).
        title={m.plus ? t.plusMemberTitle : purchases.available ? t.plusTitle : t.plusSoonTitle}
        // Membre : l'état de l'abonnement (essai jusqu'au…, se renouvelle le…) tel que l'API le formule.
        text={m.plus && subscription.data ? subscription.data.summary : plusPerksLine(perks)}
        ctaLabel={purchases.available && !m.plus ? t.plusCta : t.plusSoonCta}
        onPress={() => openPlus('generic')}
      />

      <SettingsSection
        key="rows"
        variant="plain"
        rows={[
          { key: 'seeking', title: t.rows.seeking.title, subtitle: t.rows.seeking.subtitle(seeking), onPress: () => router.push('/moi/identite') },
          {
            key: 'discreet',
            title: t.rows.discreet.title,
            subtitle: t.rows.discreet.subtitle(m.identity.discreet),
            switchValue: m.identity.discreet,
            onSwitchChange: (on: boolean) => discreet.mutate(on),
            disabled: discreet.isPending,
          },
          { key: 'ia', ...t.rows.ia, onPress: () => router.push('/moi/ia') },
          { key: 'settings', ...t.rows.settings, onPress: () => router.push('/moi/reglages') },
        ]}
      />
      </Stagger>
      {discreet.isError ? <Banner tone="error" text={t.discreetError} onClose={() => discreet.reset()} closeLabel={common.close} /> : null}
    </TabTemplate>
    </ScreenMotion>
  );
}
