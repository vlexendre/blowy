/** Supprimer mon compte : ce qui part, irréversible, confirmation en tapant « supprimer ». */
import { space } from '@blowy/tokens';
import { Banner, Button, Card, FeatureRow, Header, PetImage, ScreenTemplate, Text, TextField, Title } from '@blowy/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDeleteAccount, useMe } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.supprimer;

export default function Supprimer() {
  const me = useMe();
  const remove = useDeleteAccount();
  const [word, setWord] = useState('');
  const ok = word.trim().toLowerCase() === t.confirmWord;
  const pet = me.data?.pet;

  return (
    <ScreenTemplate
      header={<Header onBack={() => goBack('/(tabs)/moi')} backLabel={common.back} title={t.title} />}
      footer={
        <>
          <Button
            label={t.cta}
            variant="danger"
            disabled={!ok}
            loading={remove.isPending}
            onPress={() => remove.mutate(undefined, { onSuccess: () => router.replace('/(onboarding)/welcome') })}
          />
          <Button label={t.cancel} variant="ghost" onPress={() => goBack('/(tabs)/moi')} />
        </>
      }
    >
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Title text={t.heading} size={48} />
          </View>
          {pet ? <PetImage species={pet.species} mood="triste" size={110} animation="breathe" accessibilityLabel={pet.name} /> : null}
        </View>
        <Text muted>{t.text(pet?.name ?? common.speciesNames.nino)}</Text>
        <Card padding="md" style={{ gap: space.md }}>
          {t.items.map((i) => (
            <FeatureRow key={i.title} icon={i.icon} title={i.title} text={i.text} />
          ))}
        </Card>
        <Banner tone="error" text={t.irreversible} />
        <TextField
          label={t.confirmLabel}
          value={word}
          onChangeText={setWord}
          placeholder={t.confirmWord}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {remove.isError ? <Banner tone="error" text={t.error} actionLabel={common.retry} onAction={() => remove.mutate()} /> : null}
      </View>
    </ScreenTemplate>
  );
}
