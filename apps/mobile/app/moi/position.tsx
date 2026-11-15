/**
 * Ma position (spéc §10) : à quoi elle sert, l'accord, la zone, la ville choisie (Blowy+), et « l'oublier »
 * (`DELETE /v1/me/location` : position et accord effacés). Sans localisation : choisir sa ville à la main, gratuit
 * (`PUT /v1/me/area`, App Review 5.1.1(iv)).
 */
import { Appear, Banner, Button, DotNote, SettingsSection, SettingsTemplate, Skeleton, Stack, Stagger, Text } from '@blowy/ui';
import { useState } from 'react';
import { Platform } from 'react-native';

import { ScreenMotion } from '@/core';
import { ConfirmSheet } from '@/features/links';
import { AreaSheet, useLocation } from '@/features/map';
import { useMe } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';
import { carte } from '@/locales/rencontres';
import { formatDate, formatNumber } from '@/locales/runtime';

const t = moi.position;

export default function Position() {
  const me = useMe();
  const location = useLocation(me.data);
  const [forgetting, setForgetting] = useState(false);
  const [areaSheet, setAreaSheet] = useState(false);
  const back = () => goBack('/moi/reglages');
  const place = me.data?.identity.location;

  if (!place) {
    return (
      <ScreenMotion>
        <SettingsTemplate title={t.title} onBack={back} backLabel={common.back}>
          {me.isError ? (
            <Banner tone="error" title={common.errorTitle} text={me.error.message} actionLabel={common.retry} onAction={() => void me.refetch()} />
          ) : (
            <Stack>
              <Skeleton height={80} radius="md" />
              <Skeleton height={140} radius="lg" />
            </Stack>
          )}
        </SettingsTemplate>
      </ScreenMotion>
    );
  }

  const manual = place.source === 'manual' ? place.manualArea : null;
  const on = !!place.consentAt && !manual;
  const denied = location.permission?.status === 'denied' && !location.permission.canAskAgain;
  const blocked = denied || location.result === 'denied';
  const when = place.locatedAt ? formatDate(place.locatedAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <ScreenMotion>
      <SettingsTemplate
        title={t.title}
        onBack={back}
        backLabel={common.back}
        footer={
          on ? (
            <Button label={t.forget} variant="danger" onPress={() => setForgetting(true)} />
          ) : (
            <Stack gap={8}>
              {blocked && Platform.OS !== 'web' ? (
                <Button label={carte.noLocation.settings} onPress={location.openSettings} />
              ) : (
                <Button label={t.enable} onPress={() => void location.enable()} loading={location.sending} />
              )}
              <Button label={manual ? carte.area.change : carte.area.choose} variant="glass" onPress={() => setAreaSheet(true)} />
              {manual ? <Button label={carte.area.forget} variant="ghost" onPress={() => setForgetting(true)} /> : null}
            </Stack>
          )
        }
      >
        <Stagger onceKey="moi:position" step={50}>
          <Text key="lead" size={15} muted>
            {t.lead}
          </Text>
          <SettingsSection
            key="state"
            rows={[
              { key: 'state', title: on ? t.on : t.off, subtitle: on ? t.onSub(when) : manual ? carte.area.offSub : t.offSub, chevron: false },
              ...(manual
                ? [{ key: 'area', title: carte.area.current(manual.label), subtitle: manual.nextChangeOn && manual.nextChangeOn > today() ? carte.area.nextChange(formatDate(manual.nextChangeOn, { day: 'numeric', month: 'long' })) : undefined, chevron: false }]
                : []),
              ...(on && place.zone ? [{ key: 'zone', title: t.zone(formatNumber(place.zone.radiusKm, { maximumFractionDigits: 1 })), chevron: false }] : []),
              ...(place.chosenCity ? [{ key: 'city', title: t.city(place.chosenCity.label, place.chosenCityActive), chevron: false }] : []),
            ]}
          />
        </Stagger>
        {!on && blocked ? <DotNote text={Platform.OS === 'web' ? carte.noLocation.deniedWeb : carte.noLocation.denied} /> : null}
        {location.result === 'unavailable' ? <Banner tone="info" text={carte.noLocation.unavailable} /> : null}
        {location.forget.isSuccess && !on ? (
          <Appear key="forgotten">
            <Banner tone="success" text={t.forgotten} />
          </Appear>
        ) : null}
        <AreaSheet visible={areaSheet} onClose={() => setAreaSheet(false)} current={manual?.label ?? null} />
        <ConfirmSheet
          visible={forgetting}
          onClose={() => setForgetting(false)}
          title={t.forgetTitle}
          text={t.forgetText}
          confirmLabel={t.forgetConfirm}
          loading={location.forget.isPending}
          error={location.forget.isError ? t.error : null}
          onConfirm={() => location.forget.mutate(undefined, { onSuccess: () => setForgetting(false) })}
        />
      </SettingsTemplate>
    </ScreenMotion>
  );
}

/** Jour d'aujourd'hui (AAAA-MM-JJ, heure locale du téléphone). */
const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
