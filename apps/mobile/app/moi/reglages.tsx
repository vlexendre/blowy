/** Réglages (V6-Reglages) : compte, confidentialité (minimoas, position, bloqués), langue, aide et pages légales, déconnexion. */
import { Button, SettingsSection, SettingsTemplate, SheetTemplate, Stagger, Text } from '@blowy/ui';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { ScreenMotion, useApi } from '@/core';
import { useDiscreet } from '@/features/map';
import { openLegal, openPlusFrom, useMe } from '@/features/me';
import { unregisterDevice } from '@/features/notifications';
import { useBlocks } from '@/features/safety';
import { confirmAction, goBack, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';
import { getLocale } from '@/locales/runtime';

const t = moi.reglages;

export default function Reglages() {
  const api = useApi();
  const me = useMe();
  const blocks = useBlocks();
  const signOut = useSignOut();
  const discreet = useDiscreet();
  const [languageSheet, setLanguageSheet] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const m = me.data;

  const askSignOut = () =>
    confirmAction({
      title: t.signOutConfirmTitle,
      message: t.signOutConfirmText,
      confirm: t.signOutConfirm,
      cancel: common.cancel,
      // Le téléphone ne reçoit plus les notifications de ce compte, puis la session se ferme.
      onConfirm: () =>
        void unregisterDevice(api).finally(() => signOut.mutate(undefined, { onSuccess: () => router.replace('/(onboarding)/welcome') })),
    });

  const identity = m ? moi.identite.seekingShort[m.identity.seeking] ?? '' : '';
  const languageName = t.languageNames[getLocale()] ?? getLocale();

  // Les sections arrivent en cascade (une fois) ; les lignes s'enfoncent au toucher, l'interrupteur file en ressort.
  return (
    <ScreenMotion>
    <SettingsTemplate title={t.title} onBack={() => goBack('/(tabs)/moi')} backLabel={common.back} note={t.version(version)}>
      <Stagger onceKey="reglages" step={50}>
      <SettingsSection
        key="account"
        title={t.sections.account}
        rows={[
          { key: 'account', title: t.rows.account.title, subtitle: m ? t.rows.account.subtitle(m.displayName) : undefined, onPress: () => router.push('/moi/compte') },
          { key: 'identity', title: t.rows.identity.title, subtitle: identity ? t.rows.identity.subtitle(identity) : undefined, onPress: () => router.push('/moi/identite') },
          { key: 'plus', title: t.rows.plus.title, subtitle: t.rows.plus.subtitle(!!m?.plus), onPress: () => openPlusFrom('generic') },
          { key: 'notifications', ...t.rows.notifications, onPress: () => router.push('/moi/notifications') },
        ]}
      />
      <SettingsSection
        key="privacy"
        title={t.sections.privacy}
        rows={[
          { key: 'minimoas', ...t.rows.minimoas, onPress: () => router.push('/moi/minimoas') },
          {
            key: 'location',
            title: t.rows.location.title,
            subtitle: t.rows.location.subtitle(!!m?.identity.location.consentAt),
            onPress: () => router.push('/moi/position'),
          },
          {
            key: 'discreet',
            ...t.rows.discreet,
            switchValue: !!m?.identity.discreet,
            onSwitchChange: (on: boolean) => discreet.mutate(on),
            disabled: !m || discreet.isPending,
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
        key="app"
        title={t.sections.app}
        rows={[{ key: 'language', title: t.rows.language.title, subtitle: t.rows.language.subtitle(languageName), onPress: () => setLanguageSheet(true) }]}
      />
      <SettingsSection
        key="help"
        title={t.sections.help}
        rows={[
          { key: 'help', ...t.rows.help, onPress: openLegal('assistance'), chevron: true },
          { key: 'rules', ...t.rows.rules, onPress: openLegal('regles'), chevron: true },
          { key: 'safety', ...t.rows.safety, onPress: openLegal('securite'), chevron: true },
          { key: 'terms', ...t.rows.terms, onPress: openLegal('conditions'), chevron: true },
          { key: 'privacy', ...t.rows.privacy, onPress: openLegal('confidentialite'), chevron: true },
          { key: 'subscription', ...t.rows.subscription, onPress: openLegal('abonnement'), chevron: true },
          { key: 'legal', ...t.rows.legal, onPress: openLegal('mentions-legales'), chevron: true },
        ]}
      />
      <SettingsSection
        key="end"
        rows={[
          { key: 'signout', ...t.rows.signOut, onPress: askSignOut, chevron: false, disabled: signOut.isPending },
          { key: 'delete', ...t.rows.delete, destructive: true, chevron: true, onPress: () => router.push('/moi/supprimer') },
        ]}
      />
      </Stagger>

      {/* La langue suit celle du téléphone : on dit laquelle, et où la changer. */}
      <SheetTemplate
        visible={languageSheet}
        onClose={() => setLanguageSheet(false)}
        title={t.languageTitle}
        closeLabel={common.close}
        footer={Platform.OS === 'web' ? undefined : <Button label={t.languageOpen} onPress={() => void Linking.openSettings()} />}
      >
        <Text variant="bodyBold" size={17}>
          {languageName}
        </Text>
        <Text size={15} muted>
          {Platform.OS === 'web' ? t.languageWeb : t.languageText}
        </Text>
      </SheetTemplate>
    </SettingsTemplate>
    </ScreenMotion>
  );
}
