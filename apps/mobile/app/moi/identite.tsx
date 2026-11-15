/**
 * Qui tu es, ce que tu cherches (spéc §4, §11) : modifiable, vu par toi seul. « Qui tu veux rencontrer » est une
 * donnée sensible : enregistrée seulement avec un accord explicite (case à cocher), retirable à tout moment
 * (`sensitiveConsent: false` efface le choix et repasse à « des potes »).
 */
import type { Gender, Seeking, Whom } from '@blowy/contract';
import { GENDERS, SEEKINGS, WHOMS } from '@blowy/domain';
import { Appear, Banner, Button, Radio, SettingsSection, SettingsTemplate, Skeleton, Stack, Stagger, Text } from '@blowy/ui';
import { useEffect, useState } from 'react';

import { ScreenMotion } from '@/core';
import { ConfirmSheet } from '@/features/links';
import { useMe, useUpdateMe } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';
import { formatDate } from '@/locales/runtime';

const t = moi.identite;

export default function Identite() {
  const me = useMe();
  const update = useUpdateMe();
  const [gender, setGender] = useState<Gender>('non_dit');
  const [seeking, setSeeking] = useState<Seeking>('potes');
  const [whom, setWhom] = useState<Whom | null>(null);
  const [consent, setConsent] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tried, setTried] = useState(false);
  const back = () => goBack('/moi/reglages');

  const id = me.data?.identity;
  useEffect(() => {
    if (!id) return;
    setGender(id.gender);
    setSeeking(id.seeking);
    setWhom(id.whom);
    setConsent(false);
  }, [id?.gender, id?.seeking, id?.whom, id?.sensitiveConsentAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!id) {
    return (
      <ScreenMotion>
        <SettingsTemplate title={t.title} onBack={back} backLabel={common.back}>
          {me.isError ? (
            <Banner tone="error" title={common.errorTitle} text={me.error.message} actionLabel={common.retry} onAction={() => void me.refetch()} />
          ) : (
            <Stack>
              <Skeleton height={60} radius="md" />
              <Skeleton height={170} radius="lg" />
              <Skeleton height={220} radius="lg" />
            </Stack>
          )}
        </SettingsTemplate>
      </ScreenMotion>
    );
  }

  const wantsMore = seeking !== 'potes';
  const hasConsent = !!id.sensitiveConsentAt;
  const consentOk = !wantsMore || hasConsent || consent;
  const whomOk = !wantsMore || !!whom;
  const dirty = gender !== id.gender || seeking !== id.seeking || (wantsMore && whom !== id.whom);

  const save = () => {
    setTried(true);
    if (!consentOk || !whomOk) return;
    setSaved(false);
    update.mutate(
      {
        gender,
        seeking,
        whom: wantsMore ? whom : null,
        ...(wantsMore && !hasConsent ? { sensitiveConsent: true } : {}),
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  const radio = <K extends string>(keys: readonly K[], labels: Record<string, string>, value: K | null, set: (k: K) => void) =>
    keys.map((k) => ({
      key: k,
      title: labels[k] ?? k,
      right: <Radio selected={value === k} />,
      chevron: false,
      onPress: () => {
        set(k);
        setSaved(false);
      },
      accessibilityLabel: value === k ? t.selectedA11y(labels[k] ?? k) : labels[k] ?? k,
    }));

  return (
    <ScreenMotion>
      <SettingsTemplate
        title={t.title}
        onBack={back}
        backLabel={common.back}
        footer={<Button label={t.save} onPress={save} loading={update.isPending} disabled={!dirty && !(wantsMore && consent)} />}
      >
        <Stagger onceKey="identite" step={50}>
          <Text key="intro" size={15} muted>
            {t.intro}
          </Text>
          <SettingsSection key="seeking" title={t.seekingTitle} rows={radio(SEEKINGS, t.seeking, seeking, setSeeking)} />
          {wantsMore ? (
            <SettingsSection key="whom" title={t.whomTitle} rows={radio(WHOMS, t.whom, whom, (k) => setWhom(k))} />
          ) : null}
          {wantsMore ? (
            <SettingsSection
              key="consent"
              title={t.consentTitle}
              footer={t.consentText}
              rows={
                hasConsent
                  ? [
                      { key: 'given', title: t.consentGiven(formatDate(id.sensitiveConsentAt ?? '', { day: 'numeric', month: 'long', year: 'numeric' })), chevron: false },
                      { key: 'withdraw', title: t.withdraw, destructive: true, onPress: () => setWithdrawing(true) },
                    ]
                  : [{ key: 'accept', title: t.consentRow, switchValue: consent, onSwitchChange: setConsent }]
              }
            />
          ) : hasConsent ? (
            <SettingsSection key="consent" title={t.consentTitle} footer={t.consentText} rows={[{ key: 'withdraw', title: t.withdraw, destructive: true, onPress: () => setWithdrawing(true) }]} />
          ) : null}
          <SettingsSection key="gender" title={t.genderTitle} rows={radio(GENDERS, t.gender, gender, setGender)} />
        </Stagger>
        {tried && !consentOk ? <Banner tone="error" text={t.needConsent} /> : null}
        {tried && consentOk && !whomOk ? <Banner tone="error" text={t.needWhom} /> : null}
        {update.isError ? <Banner tone="error" text={t.error} actionLabel={common.retry} onAction={save} /> : null}
        {saved && !update.isPending ? (
          <Appear key="saved">
            <Banner tone="success" text={t.saved} />
          </Appear>
        ) : null}

        <ConfirmSheet
          visible={withdrawing}
          onClose={() => setWithdrawing(false)}
          title={t.withdrawTitle}
          text={t.withdrawText}
          confirmLabel={t.withdrawConfirm}
          loading={update.isPending}
          error={update.isError ? t.error : null}
          onConfirm={() => update.mutate({ sensitiveConsent: false }, { onSuccess: () => setWithdrawing(false) })}
        />
      </SettingsTemplate>
    </ScreenMotion>
  );
}
