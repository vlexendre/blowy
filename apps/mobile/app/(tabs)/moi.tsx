/** Onglet Moi (V6-Moi) : qui tu es (en-tête), lien « 3 mots », chiffres non nuls, Minimoa+ en une rangée, liste courte menant aux réglages. */
import { color, space } from '@blowy/tokens';
import { Appear, Banner, PlusBanner, ProfileHero, SettingsSection, Skeleton, Stagger, StatLine, TabTemplate, WordsShareCard } from '@blowy/ui';
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
import { croissance } from '@/locales/croissance';
import { useTrackShare } from '@/features/growth';

const t = moi.tab;
const DAY_MS = 86_400_000;

export default function Moi() {
  const me = useMe();
  const pet = useLivePet();
  const links = useLinks();
  const words = useCopyShare();
  const track = useTrackShare();
  const { purchases } = usePorts();
  const discreet = useDiscreet();
  const subscription = useSubscription(!!me.data?.plus);
  // Les avantages viennent de la même source que la feuille Minimoa+ (jamais une autre liste ici).
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
      <TabTemplate gutter={12} gap={8} top={6}>
        {me.isError ? (
          <Appear key="error">
            <Banner tone="error" title={common.errorTitle} text={t.errorText} actionLabel={common.retry} onAction={() => void me.refetch()} />
          </Appear>
        ) : (
          <View style={{ gap: space.md }} accessibilityLabel={common.loading}>
            <Skeleton height={100} radius="lg" />
            <Skeleton height={124} radius="lg" />
            <Skeleton height={56} radius="lg" />
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
  // Seuls les chiffres non nuls : pour un nouveau compte, la rangée n'apparaît pas.
  const stats = [
    { key: 'links', value: linkList.length, label: t.stats.links(linkList.length) },
    { key: 'streak', value: bestStreak, label: t.stats.streak(bestStreak), color: color.orange },
  ].filter((s) => s.value > 0);
  const member = m.plus;

  // Les blocs arrivent en cascade à la première visite seulement (l'onglet reste monté) ; les chiffres défilent.
  return (
    <ScreenMotion>
    <TabTemplate refreshControl={refresh} gutter={12} gap={8} top={6}>
      <Stagger onceKey="moi" step={55}>
      <ProfileHero
        key="hero"
        title={t.title(m.displayName, petName)}
        caption={t.together(days)}
        // Ta photo est toujours nette pour toi ; le flou pour les autres s'explique sur Mon compte, à côté de la photo.
        photoUri={m.avatarUrl}
        pet={m.pet}
        accessibilityLabel={t.heroLabel(m.displayName, petName)}
        onPress={() => router.push('/moi/compte')}
      />

      <WordsShareCard
        key="words"
        title={t.wordsTitle}
        badge={wordsCount > 0 ? t.wordsCount(wordsCount) : t.wordsBadge}
        badgeOn={wordsCount > 0}
        text={t.wordsLead(petName)}
        // Des mots sont arrivés : ton résultat et la carte à partager en story (dès 3 votes).
        moreLabel={wordsCount > 0 ? croissance.words.more : undefined}
        onMore={() => router.push('/mots')}
        shareLabel={t.wordsShareCta}
        onShare={() => {
          track('words');
          void words.share(t.wordsMessage(wordsLink), wordsLink);
        }}
        copyLabel={`${t.copy} ${displayUrl(wordsLink)}`}
        copiedLabel={t.copied}
        copied={words.copied}
        onCopy={() => void words.copy(wordsLink)}
      />

      {stats.length ? <StatLine key="stats" items={stats} /> : null}

      <PlusBanner
        key="plus"
        // Pas de prix ici : le montant facturé se lit sur la feuille Minimoa+ (règle Apple 3.1.2, spéc §13).
        title={t.plusTitle}
        // Membre : l'état de l'abonnement (essai jusqu'au…, se renouvelle le…) tel que l'API le formule ; sinon deux avantages.
        text={member && subscription.data ? subscription.data.summary : plusPerksLine(perks, 2)}
        ctaLabel={member ? undefined : purchases.available ? t.plusCta : t.plusSoonCta}
        onPress={() => openPlus('generic')}
      />

      <SettingsSection
        key="rows"
        variant="plain"
        rows={[
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
