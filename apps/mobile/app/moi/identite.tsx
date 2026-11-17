/**
 * Qui tu es (spéc §11, §27) : ton sexe, modifiable, vu par toi seul. Il sert aux accords des phrases et ne filtre
 * personne. On ne demande plus ce que les gens cherchent.
 */
import type { Gender } from '@blowy/contract';
import { GENDERS } from '@blowy/domain';
import { Appear, Banner, Button, Radio, SettingsSection, SettingsTemplate, Skeleton, Stack, Stagger, Text } from '@blowy/ui';
import { useEffect, useState } from 'react';

import { ScreenMotion } from '@/core';
import { useMe, useUpdateMe } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.identite;

export default function Identite() {
  const me = useMe();
  const update = useUpdateMe();
  const [gender, setGender] = useState<Gender>('non_dit');
  const [saved, setSaved] = useState(false);
  const back = () => goBack('/moi/reglages');

  const id = me.data?.identity;
  useEffect(() => {
    if (id) setGender(id.gender);
  }, [id?.gender]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!id) {
    return (
      <ScreenMotion>
        <SettingsTemplate title={t.title} onBack={back} backLabel={common.back}>
          {me.isError ? (
            <Banner tone="error" title={common.errorTitle} text={me.error.message} actionLabel={common.retry} onAction={() => void me.refetch()} />
          ) : (
            <Stack>
              <Skeleton height={60} radius="md" />
              <Skeleton height={220} radius="lg" />
            </Stack>
          )}
        </SettingsTemplate>
      </ScreenMotion>
    );
  }

  const dirty = gender !== id.gender;
  const save = () => {
    setSaved(false);
    update.mutate({ gender }, { onSuccess: () => setSaved(true) });
  };

  const rows = GENDERS.map((k) => {
    const label = t.gender[k] ?? k;
    return {
      key: k,
      title: label,
      right: <Radio selected={gender === k} />,
      chevron: false,
      onPress: () => {
        setGender(k);
        setSaved(false);
      },
      accessibilityLabel: gender === k ? t.selectedA11y(label) : label,
    };
  });

  return (
    <ScreenMotion>
      <SettingsTemplate
        title={t.title}
        onBack={back}
        backLabel={common.back}
        footer={<Button label={t.save} onPress={save} loading={update.isPending} disabled={!dirty} />}
      >
        <Stagger onceKey="identite" step={50}>
          <Text key="intro" size={15} muted>
            {t.intro}
          </Text>
          <SettingsSection key="gender" title={t.genderTitle} rows={rows} />
        </Stagger>
        {update.isError ? <Banner tone="error" text={t.error} actionLabel={common.retry} onAction={save} /> : null}
        {saved && !update.isPending ? (
          <Appear key="saved">
            <Banner tone="success" text={t.saved} />
          </Appear>
        ) : null}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
