/** Réglages (V6-Reglages) : compte, confidentialité (position, bloqués), langue, aide et pages légales (en feuille), déconnexion. */
import { Banner, Button, SettingsSection, SettingsTemplate, SheetTemplate, Stagger, Text } from '@blowy/ui';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { ScreenMotion, useApi } from '@/core';
import { openLegal, useMe, useUpdateMe } from '@/features/me';
import { openPlus } from '@/features/plus';
import { unregisterDevice } from '@/features/notifications';
import { useBlocks } from '@/features/safety';
import { confirmAction, goBack, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { groupes } from '@/locales/groupes';
import { croissance } from '@/locales/croissance';
import { useMoments } from '@/features/moments';
import { moi } from '@/locales/moi';
import { getLocale } from '@/locales/runtime';

const t = moi.reglages;

export default function Reglages() {
  const api = useApi();
  const me = useMe();
  const blocks = useBlocks();
  const signOut = useSignOut();
  const updateMe = useUpdateMe();
  const qc = useQueryClient();
  const [languageSheet, setLanguageSheet] = useState(false);
  const [helpSheet, setHelpSheet] = useState(false);
  /** Une page d'aide ou légale : la feuille se range d'abord. */
  const legal = (page: Parameters<typeof openLegal>[0]) => {
    const open = openLegal(page);
    return () => {
      setHelpSheet(false);
      open();
    };
  };
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

  const languageName = t.languageNames[getLocale()] ?? getLocale();

  const momentsOn = useMoments((x) => x.enabled);
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
          { key: 'identity', title: t.rows.identity.title, subtitle: m ? moi.identite.gender[m.identity.gender] : undefined, onPress: () => router.push('/moi/identite') },
          { key: 'plus', title: t.rows.plus.title, subtitle: t.rows.plus.subtitle(!!m?.plus), onPress: () => openPlus('generic') },
          { key: 'notifications', ...t.rows.notifications, onPress: () => router.push('/moi/notifications') },
          // Moments à partager (séries, groupes) : une carte proposée une fois ; coupé, plus rien n'est proposé.
          {
            key: 'moments',
            title: croissance.settings.title,
            subtitle: momentsOn ? croissance.settings.on : croissance.settings.off,
            switchValue: momentsOn,
            onSwitchChange: (on: boolean) => useMoments.getState().setEnabled(on),
          },
        ]}
      />
      {/* Le mode discret et l'IA sont sur l'onglet Moi : pas deux fois ici. */}
      <SettingsSection
        key="privacy"
        title={t.sections.privacy}
        rows={[
          {
            key: 'location',
            title: t.rows.location.title,
            subtitle: t.rows.location.subtitle(!!m?.identity.location.consentAt),
            onPress: () => router.push('/moi/position'),
          },
          // « Montrer mes habitudes » (spéc. §25), activé par défaut ; coupé : rien n'est montré, aucune suggestion « ensemble ».
          {
            key: 'habits',
            title: groupes.settings.showHabits,
            subtitle: groupes.settings.showHabitsText,
            switchValue: m?.showHabits !== false,
            onSwitchChange: (on: boolean) =>
              updateMe.mutate(
                { showHabits: on },
                {
                  onSuccess: () => {
                    void qc.invalidateQueries({ queryKey: ['together'] });
                    void qc.invalidateQueries({ queryKey: ['rituals', 'habits'] });
                  },
                },
              ),
            disabled: !m || updateMe.isPending,
          },
          {
            key: 'blocked',
            title: t.rows.blocked.title,
            subtitle: t.rows.blocked.subtitle(blocks.data ? blocks.data.length : null),
            onPress: () => router.push('/moi/bloques'),
          },
        ]}
      />
      {updateMe.isError ? <Banner key="habitsError" tone="error" text={groupes.settings.saveError} onClose={() => updateMe.reset()} closeLabel={common.close} /> : null}
      <SettingsSection
        key="app"
        title={t.sections.app}
        rows={[
          { key: 'language', title: t.rows.language.title, subtitle: t.rows.language.subtitle(languageName), onPress: () => setLanguageSheet(true) },
          // Aide et pages légales : une ligne, les sept liens dans une feuille.
          { key: 'help', title: t.sections.help, onPress: () => setHelpSheet(true) },
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

      <SheetTemplate visible={helpSheet} onClose={() => setHelpSheet(false)} title={t.sections.help} closeLabel={common.close}>
        <SettingsSection
          rows={[
            { key: 'help', ...t.rows.help, onPress: legal('assistance'), chevron: true },
            { key: 'rules', ...t.rows.rules, onPress: legal('regles'), chevron: true },
            { key: 'safety', ...t.rows.safety, onPress: legal('securite'), chevron: true },
            { key: 'terms', ...t.rows.terms, onPress: legal('conditions'), chevron: true },
            { key: 'privacy', ...t.rows.privacy, onPress: legal('confidentialite'), chevron: true },
            { key: 'subscription', ...t.rows.subscription, onPress: legal('abonnement'), chevron: true },
            { key: 'legal', ...t.rows.legal, onPress: legal('mentions-legales'), chevron: true },
          ]}
        />
      </SheetTemplate>

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
