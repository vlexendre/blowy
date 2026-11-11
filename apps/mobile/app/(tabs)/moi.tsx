/** Onglet Moi (V6-Moi) : profil, lien « 3 mots », chiffres, Blowy+, réglages, liens légaux, déconnexion. */
import { color, space, speciesColor } from '@blowy/tokens';
import { Avatar, Banner, Button, Panel, Pressable, SettingsSection, Skeleton, StatTile, TabTemplate, Text, Title, WordsShareCard } from '@blowy/ui';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, RefreshControl, View } from 'react-native';

import { config, wordsUrl } from '@/core';
import { useLinks } from '@/features/links';
import { displayUrl, useCopyShare, useMe } from '@/features/me';
import { usePet } from '@/features/pet';
import { confirmAction, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.tab;
const open = (path: string) => () => void Linking.openURL(`${config.webUrl}/${path}`);

export default function Moi() {
  const me = useMe();
  const pet = usePet();
  const links = useLinks();
  const signOut = useSignOut();
  const words = useCopyShare();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const askSignOut = () =>
    confirmAction({
      title: t.signOutConfirmTitle,
      message: t.signOutConfirmText,
      confirm: t.signOutConfirm,
      cancel: common.cancel,
      onConfirm: () => signOut.mutate(undefined, { onSuccess: () => router.replace('/(onboarding)/welcome') }),
    });

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
      <TabTemplate brand="blowy">
        {me.isError ? (
          <Banner tone="error" title={common.errorTitle} text={t.errorText} actionLabel={common.retry} onAction={() => void me.refetch()} />
        ) : (
          <View style={{ gap: space.md }} accessibilityLabel={common.loading}>
            <Skeleton height={190} radius="xl" />
            <Skeleton height={150} radius="lg" />
            <Skeleton height={92} radius="lg" />
          </View>
        )}
      </TabTemplate>
    );
  }

  const m = me.data;
  const wordsLink = wordsUrl(m.wordsCode);
  const wordsCount = pet.data?.wordsCount ?? 0;
  const linkList = links.data ?? [];
  const bestStreak = linkList.reduce((best, l) => Math.max(best, l.streak), 0);

  return (
    <TabTemplate refreshControl={refresh}>
      <Panel gradient="rose" padding="lg">
        <View style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
          <Pressable onPress={() => router.push('/moi/compte')} accessibilityRole="button" accessibilityLabel={moi.compte.photoChange}>
            <Avatar size={104} uri={m.avatarUrl} name={m.displayName} face="clear" />
            <View style={{ position: 'absolute', right: -10, bottom: -10 }}>
              <Avatar size={46} pet={m.pet} hidden ring={speciesColor[m.pet.species]} accessibilityLabel={m.pet.name} />
            </View>
          </Pressable>
          <View style={{ flex: 1, gap: space.xs }}>
            <Title text={t.title(m.displayName, m.pet.name)} size={40} />
            {m.city ? (
              <Text variant="bodyBold" size={14}>
                {t.city(m.city)}
              </Text>
            ) : null}
          </View>
        </View>
        <Text variant="small" style={{ marginTop: space.md }}>
          {t.photoHint}
        </Text>
      </Panel>

      <WordsShareCard
        title={t.wordsTitle}
        countLabel={t.wordsCount(wordsCount)}
        words={[]}
        emptyText={wordsCount > 0 ? t.wordsReceived(m.pet.name) : t.wordsEmpty(m.pet.name)}
        url={displayUrl(wordsLink)}
        copyLabel={t.copy}
        copiedLabel={common.copied}
        copied={words.copied}
        shareLabel={t.share}
        onCopy={() => void words.copy(wordsLink)}
        onShare={() => void words.share(t.wordsMessage(wordsLink), wordsLink)}
      />

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile value={links.data ? String(linkList.length) : '–'} label={t.stats.links} />
        <StatTile value={t.streakValue(bestStreak)} label={t.stats.streak} color={color.orange} />
        <StatTile value={String(wordsCount)} label={t.stats.words} color={color.accent} />
      </View>

      <Panel gradient="wine" padding="lg">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, gap: space.xs }}>
            <Title text={m.plus ? t.plusMember.toUpperCase() : t.plusTitle} size={28} />
            <Text variant="small">{t.plusText}</Text>
          </View>
          <Button label={t.plusCta} variant="white" size="md" block={false} onPress={() => router.push('/moi/blowy-plus')} />
        </View>
      </Panel>

      <SettingsSection
        title={t.sections.account}
        rows={[
          { key: 'account', ...t.rows.account, onPress: () => router.push('/moi/compte') },
          { key: 'plus', ...t.rows.plus, onPress: () => router.push('/moi/blowy-plus') },
        ]}
      />
      <SettingsSection title={t.sections.safety} rows={[{ key: 'blocked', ...t.rows.blocked, onPress: () => router.push('/moi/bloques') }]} />
      <SettingsSection
        title={t.sections.about}
        rows={[
          { key: 'rules', ...t.rows.rules, onPress: open('regles') },
          { key: 'privacy', ...t.rows.privacy, onPress: open('confidentialite') },
          { key: 'terms', ...t.rows.terms, onPress: open('conditions') },
          { key: 'help', ...t.rows.help, onPress: open('support') },
        ]}
      />
      <SettingsSection
        rows={[
          { key: 'signout', ...t.rows.signOut, onPress: askSignOut, disabled: signOut.isPending },
          { key: 'delete', ...t.rows.delete, destructive: true, onPress: () => router.push('/moi/supprimer') },
        ]}
        footer={t.version(version)}
      />
    </TabTemplate>
  );
}
