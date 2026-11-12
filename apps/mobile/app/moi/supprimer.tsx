/** Supprimer mon compte (V6-Supprimer) : ce qui est effacé, confirmation en écrivant « supprimer ». */
import { Banner, Button, InlineField, PetTip, SettingsSection, SettingsTemplate } from '@blowy/ui';
import { router } from 'expo-router';
import { useState } from 'react';

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

  return (
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
            onPress={() => remove.mutate(undefined, { onSuccess: () => router.replace('/(onboarding)/welcome') })}
          />
          <Button label={t.cancel} variant="ghost" onPress={back} />
        </>
      }
    >
      <PetTip tone="wine" title={t.heading(petName)} text={t.text} species={pet?.species ?? 'nino'} />
      <SettingsSection title={t.erasedTitle} rows={t.items(links.data ? links.data.length : null)} />
      <InlineField
        label={t.confirmLabel}
        value={word}
        onChangeText={setWord}
        placeholder={t.confirmWord}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      {remove.isError ? <Banner tone="error" text={t.error} actionLabel={common.retry} onAction={() => remove.mutate()} /> : null}
    </SettingsTemplate>
  );
}
