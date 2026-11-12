/** Supprimer mon compte (V6-Supprimer) : ce qui est effacé, confirmation en écrivant « supprimer ». */
import { Appear, Banner, Button, InlineField, PetTip, type PetActorHandle, SettingsSection, SettingsTemplate, Stagger } from '@blowy/ui';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { useLinks } from '@/features/links';
import { useDeleteAccount, useMe } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.supprimer;

export default function Supprimer() {
  const me = useMe();
  const links = useLinks();
  const remove = useDeleteAccount();
  const [word, setWord] = useState('');
  const ok = word.trim().toLowerCase() === t.confirmWord;
  const pet = me.data?.pet;
  const petName = pet?.name ?? common.speciesNames.nino;
  const back = () => goBack('/moi/reglages');
  // Le pet fait non de la tête quand le mot est écrit, et encore quand on confirme (la suppression part d'abord).
  const actor = useRef<PetActorHandle>(null);
  useEffect(() => {
    if (ok) actor.current?.react('no');
  }, [ok]);
  const confirm = () => {
    remove.mutate(undefined, { onSuccess: () => router.replace('/(onboarding)/welcome') });
    actor.current?.react('no');
  };

  return (
    <ScreenMotion>
    <SettingsTemplate
      title={t.title}
      onBack={back}
      backLabel={common.back}
      gap={12}
      footer={
        <>
          <Button
            label={t.cta}
            variant="danger"
            disabled={!ok}
            loading={remove.isPending}
            onPress={confirm}
          />
          <Button label={t.cancel} variant="ghost" onPress={back} />
        </>
      }
    >
      <Stagger step={50}>
      <PetTip key="tip" tone="wine" title={t.heading(petName)} text={t.text} species={pet?.species ?? 'nino'} actor={actor} seed={pet?.id} />
      <SettingsSection key="erased" title={t.erasedTitle} rows={t.items(links.data ? links.data.length : null)} />
      <InlineField
        key="confirm"
        label={t.confirmLabel}
        value={word}
        onChangeText={setWord}
        placeholder={t.confirmWord}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      </Stagger>
      {remove.isError ? (
        <Appear key="error">
          <Banner tone="error" text={t.error} actionLabel={common.retry} onAction={() => remove.mutate()} />
        </Appear>
      ) : null}
    </SettingsTemplate>
    </ScreenMotion>
  );
}
