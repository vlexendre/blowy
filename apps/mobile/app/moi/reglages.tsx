/** Réglages (V6-Reglages) : compte, confidentialité, aide, déconnexion et suppression. */
import { SettingsSection, SettingsTemplate } from '@blowy/ui';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';

import { config } from '@/core';
import { useMe } from '@/features/me';
import { useBlocks } from '@/features/safety';
import { confirmAction, goBack, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.reglages;
const open = (path: string) => () => void Linking.openURL(`${config.webUrl}/${path}`);

export default function Reglages() {
  const me = useMe();
  const blocks = useBlocks();
  const signOut = useSignOut();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const m = me.data;
  const petName = m?.pet.name ?? common.speciesNames.nino;

  const askSignOut = () =>
    confirmAction({
      title: t.signOutConfirmTitle,
      message: t.signOutConfirmText,
      confirm: t.signOutConfirm,
      cancel: common.cancel,
      onConfirm: () => signOut.mutate(undefined, { onSuccess: () => router.replace('/(onboarding)/welcome') }),
    });

  return (
    <SettingsTemplate title={t.title} onBack={() => goBack('/(tabs)/moi')} backLabel={common.back} note={t.version(version)}>
      <SettingsSection
        title={t.sections.account}
        rows={[
          {
            key: 'account',
            title: t.rows.account.title,
            subtitle: m ? t.rows.account.subtitle(m.displayName, m.city) : undefined,
            onPress: () => router.push('/moi/compte'),
          },
          { key: 'plus', title: t.rows.plus.title, subtitle: t.rows.plus.subtitle(!!m?.plus), onPress: () => router.push('/moi/blowy-plus') },
          { key: 'notifications', ...t.rows.notifications, onPress: () => router.push('/moi/notifications') },
        ]}
      />
      <SettingsSection
        title={t.sections.privacy}
        rows={[
          {
            key: 'pause',
            title: t.rows.pause.title,
            subtitle: t.rows.pause.subtitle(petName),
            switchValue: false,
            onSwitchChange: () => Alert.alert(moi.tab.pauseSoonTitle, moi.tab.pauseSoonText(petName), [{ text: moi.tab.ok }]),
          },
          {
            key: 'blocked',
            title: t.rows.blocked.title,
            subtitle: t.rows.blocked.subtitle(blocks.data ? blocks.data.length : null),
            onPress: () => router.push('/moi/bloques'),
          },
        ]}
      />
      <SettingsSection
        title={t.sections.help}
        rows={[
          { key: 'rules', ...t.rows.rules, onPress: open('regles'), chevron: true },
          { key: 'privacy', ...t.rows.privacy, onPress: open('confidentialite'), chevron: true },
          { key: 'help', ...t.rows.help, onPress: open('support'), chevron: true },
        ]}
      />
      <SettingsSection
        rows={[
          { key: 'signout', ...t.rows.signOut, onPress: askSignOut, chevron: false, disabled: signOut.isPending },
          { key: 'delete', ...t.rows.delete, destructive: true, chevron: true, onPress: () => router.push('/moi/supprimer') },
        ]}
      />
    </SettingsTemplate>
  );
}
