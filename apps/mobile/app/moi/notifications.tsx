/**
 * Notifications (V6-GNotifs) : l'heure du défi, les heures calmes, un interrupteur par type (regroupés comme sur la
 * maquette), et l'accord du téléphone (pas encore demandé → le demander ; refusé → passer par les Réglages).
 * Les réglages vivent sur le serveur (`api.notifications`) : ils valent pour tous tes appareils.
 */
import type { NotificationKindDto, NotificationSettings } from '@blowy/contract';
import { MORNING_HOUR_MAX, MORNING_HOUR_MIN } from '@blowy/domain';
import { Appear, Banner, Button, ChoiceGrid, DotNote, PetTip, SettingsSection, SettingsTemplate, SheetTemplate, Skeleton, Stack, Stagger, Text } from '@blowy/ui';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { ScreenMotion } from '@/core';
import { useMe } from '@/features/me';
import { useNotificationSettings, usePushPermission, useUpdateNotificationSettings } from '@/features/notifications';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.notifications;

/** Une ligne de la maquette peut porter plusieurs types (« Nouvelle rencontre, on te fait signe ») : allumée si tous le sont. */
type Row = { key: string; kinds: readonly NotificationKindDto[]; title: string; subtitle: string };

const HOURS = Array.from({ length: MORNING_HOUR_MAX - MORNING_HOUR_MIN + 1 }, (_, i) => MORNING_HOUR_MIN + i);

export default function Notifications() {
  const me = useMe();
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const { permission, ask } = usePushPermission();
  const [hourSheet, setHourSheet] = useState(false);
  const [quietSheet, setQuietSheet] = useState(false);
  const pet = me.data?.pet;
  const petName = pet?.name ?? common.speciesNames.nino;
  const back = () => goBack('/moi/reglages');

  const petRows: Row[] = [
    { key: 'challenge', kinds: ['daily_challenge'], ...t.rows.daily_challenge },
    { key: 'out', kinds: ['needs_out'], title: t.rows.needs_out.title(petName), subtitle: t.rows.needs_out.subtitle },
    { key: 'streak', kinds: ['streak_in_danger'], ...t.rows.streak_in_danger },
    { key: 'proof', kinds: ['habit_proof'], ...t.rows.habit_proof },
    { key: 'review', kinds: ['weekly_review'], ...t.rows.weekly_review },
    { key: 'unlocked', kinds: ['item_unlocked', 'words_received'], ...t.rows.unlocked },
  ];
  const linkRows: Row[] = [
    { key: 'encounters', kinds: ['new_encounter', 'waved'], ...t.rows.encounters },
    { key: 'messages', kinds: ['message'], ...t.rows.messages },
    { key: 'turn', kinds: ['your_turn'], ...t.rows.your_turn },
    { key: 'danger', kinds: ['link_in_danger'], ...t.rows.link_in_danger },
  ];
  const plusRows: Row[] = [{ key: 'trial', kinds: ['trial_reminder'], ...t.rows.trial_reminder }];

  const toRows = (s: NotificationSettings, rows: Row[]) =>
    rows.map((r) => ({
      key: r.key,
      title: r.title,
      subtitle: r.subtitle,
      switchValue: r.kinds.every((k) => s.kinds[k] !== false),
      onSwitchChange: (on: boolean) => update.mutate({ kinds: Object.fromEntries(r.kinds.map((k) => [k, on])) }),
    }));

  const s = settings.data;

  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} onBack={back} backLabel={common.back}>
        {!s ? (
          settings.isError ? (
            <Banner tone="error" title={t.loadError} text={settings.error.message} actionLabel={common.retry} onAction={() => void settings.refetch()} />
          ) : (
            <Stack>
              <Skeleton height={96} radius="lg" />
              <Skeleton height={112} radius="lg" />
              <Skeleton height={320} radius="lg" />
            </Stack>
          )
        ) : (
          <Stagger onceKey="notifications" step={50}>
            <PetTip key="tip" text={t.banner(petName, s.dailyCap)} species={pet?.species ?? 'nino'} />
            {Platform.OS === 'web' ? (
              <DotNote key="web" text={t.permission.web} />
            ) : permission === 'undetermined' ? (
              <Banner key="perm" tone="info" title={t.permission.undetermined.title} text={t.permission.undetermined.text} actionLabel={t.permission.undetermined.action} onAction={() => void ask()} />
            ) : permission === 'denied' ? (
              <Banner key="perm" tone="info" title={t.permission.denied.title} text={t.permission.denied.text} actionLabel={t.permission.denied.action} onAction={() => void Linking.openSettings()} />
            ) : null}
            <SettingsSection
              key="times"
              rows={[
                { key: 'morning', title: t.morning.title, right: <Value text={t.morning.value(s.morningHour)} />, onPress: () => setHourSheet(true), chevron: true },
                { key: 'quiet', title: t.quiet.title, right: <Value text={t.quiet.value(s.quietHours.start, s.quietHours.end)} />, onPress: () => setQuietSheet(true), chevron: true },
              ]}
            />
            <SettingsSection key="pet" title={t.sections.pet} rows={toRows(s, petRows)} />
            <SettingsSection key="links" title={t.sections.links} rows={toRows(s, linkRows)} />
            <SettingsSection key="plus" title={t.sections.plus} rows={toRows(s, plusRows)} />
          </Stagger>
        )}
        {update.isError ? (
          <Appear key="error">
            <Banner tone="error" text={t.saveError} onClose={() => update.reset()} closeLabel={common.close} />
          </Appear>
        ) : null}

        <SheetTemplate visible={hourSheet} onClose={() => setHourSheet(false)} title={t.morningTitle} closeLabel={common.close}>
          <Text size={15} muted>
            {t.morningText}
          </Text>
          <ChoiceGrid
            items={HOURS.map((h) => ({ key: h, label: t.hour(h) }))}
            selected={s?.morningHour ?? null}
            onSelect={(h) => {
              update.mutate({ morningHour: h });
              setHourSheet(false);
            }}
          />
        </SheetTemplate>
        <SheetTemplate visible={quietSheet} onClose={() => setQuietSheet(false)} title={t.quiet.title} closeLabel={common.close} footer={<Button label={common.close} variant="ghost" onPress={() => setQuietSheet(false)} />}>
          <Text size={17}>{s ? t.quiet.text(s.quietHours.start, s.quietHours.end) : ''}</Text>
        </SheetTemplate>
      </SettingsTemplate>
    </ScreenMotion>
  );
}

function Value({ text }: { text: string }) {
  return (
    <Text size={15} muted>
      {text}
    </Text>
  );
}
