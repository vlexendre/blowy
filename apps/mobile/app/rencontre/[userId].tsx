import type { Person } from '@blowy/contract';
import {
  Banner,
  Button,
  Chip,
  EmptyState,
  Header,
  MessageBubble,
  PetImage,
  ScreenTemplate,
  SettingsSection,
  SheetTemplate,
  Skeleton,
  Sticker,
  Text,
  Title,
} from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAcceptEncounter, useDeclineEncounter, useEncounter, useWave } from '@/features/encounters';
import { ConfirmSheet, errorText, ReportSheet } from '@/features/links';
import { usePet } from '@/features/pet';
import { useBlock } from '@/features/safety';
import { chats as chatsText, options as optionsText } from '@/locales/chats';
import { rencontre as t, rencontres as listText } from '@/locales/rencontres';

type Sheet = 'menu' | 'report' | 'block' | null;

export default function RencontreScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const encounter = useEncounter(userId);
  const pet = usePet();
  const wave = useWave();
  const accept = useAcceptEncounter();
  const decline = useDeclineEncounter();
  const block = useBlock();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [reported, setReported] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/rencontres'));
  const { incoming, suggestion } = encounter;
  const person: Person | null = incoming?.from ?? suggestion?.user ?? null;
  const compat = incoming?.compatibility ?? suggestion?.compatibility ?? 0;
  const via = suggestion ? (suggestion.via === 'friend_of_friend' ? listText.via.friend_of_friend(suggestion.mutualName) : listText.via[suggestion.via]()) : null;
  const myPet = pet.data?.pet;
  const myPetName = myPet?.name ?? chatsText.yourPet;
  const error = wave.error ?? accept.error ?? decline.error;

  const header = (
    <Header
      onBack={back}
      backLabel={t.back}
      center={via ? <Chip label={via} tone="glass" size="sm" /> : undefined}
      right={person ? <Chip label={`${compat} %`} tone="accent" size="sm" accessibilityLabel={t.compatA11y(compat)} /> : undefined}
    />
  );

  if (!person) {
    return (
      <ScreenTemplate header={header} background="violet">
        {encounter.isPending ? (
          <View style={styles.body}>
            <Skeleton height={240} radius="xl" />
            <Skeleton height={120} radius="lg" />
          </View>
        ) : encounter.isError ? (
          <Banner tone="error" title={listText.loadError} text={encounter.error.message} actionLabel={listText.retry} onAction={() => void encounter.refetch()} />
        ) : (
          <EmptyState mood="triste" title={t.goneTitle} text={t.goneText} actionLabel={t.goneAction} onAction={() => router.replace('/rencontres')} />
        )}
      </ScreenTemplate>
    );
  }

  const footer = incoming ? (
    <>
      <Button
        label={t.accept(person.displayName)}
        onPress={() => accept.mutate(incoming.id, { onSuccess: (link) => router.replace(`/link/${link.id}`) })}
        loading={accept.isPending}
        disabled={decline.isPending}
      />
      <Button label={t.decline} variant="ghost" onPress={() => decline.mutate(incoming.id, { onSuccess: back })} loading={decline.isPending} disabled={accept.isPending} />
    </>
  ) : suggestion?.waved ? (
    <Button label={t.waved} variant="ghost" icon="check" disabled />
  ) : (
    <Button label={t.wave(person.pet.name)} onPress={() => wave.mutate(person.id)} loading={wave.isPending} />
  );

  return (
    <ScreenTemplate header={header} background="violet" footer={footer}>
      <View style={styles.body}>
        <View style={styles.stage}>
          <View style={styles.side}>
            {myPet ? <PetImage species={myPet.species} form={myPet.form} size={140} animation="breathe" outline /> : null}
            <Sticker label={t.me(myPetName)} rotate={-5} size="sm" style={styles.tagLeft} />
          </View>
          <View style={styles.side}>
            <PetImage species={person.pet.species} mood="salut" size={140} animation="bob" delay={300} outline />
            <Sticker label={t.them(person.pet.name, person.displayName)} tone="white" rotate={4} size="sm" style={styles.tagRight} />
          </View>
        </View>

        <Text variant="label">{incoming ? t.theySay(person.pet.name) : t.saysTitle(myPetName)}</Text>
        <MessageBubble
          message={{ author: incoming ? 'other_pet' : 'my_pet', kind: 'text', body: incoming?.intro ?? suggestion?.intro ?? '', mediaUrl: null }}
          name={(incoming ? person.pet.name : myPetName).toLowerCase()}
          pet={incoming ? person.pet : myPet ? { name: myPet.name, species: myPet.species, form: myPet.form } : undefined}
        />

        <Title text={t.title} variant="hero" />
        <Text variant="bodyBold">{suggestion?.waved ? t.waitingText(person.displayName) : t.text(person.displayName)}</Text>

        {error ? <Banner tone="error" text={errorText(error, listText.actionError)} /> : null}
        {reported ? <Banner tone="success" text={optionsText.reportDone} onClose={() => setReported(false)} closeLabel={optionsText.close} /> : null}

        <Button label={t.safety} variant="ghost" size="sm" onPress={() => setSheet('menu')} style={styles.safety} />
      </View>

      <SheetTemplate visible={sheet === 'menu'} onClose={() => setSheet(null)} title={t.safetyTitle} closeLabel={optionsText.close}>
        <SettingsSection
          rows={[
            { key: 'report', title: optionsText.report(person.displayName), subtitle: optionsText.reportSub, onPress: () => setSheet('report'), chevron: true },
            { key: 'block', title: optionsText.block(person.displayName), subtitle: optionsText.blockSub, onPress: () => setSheet('block'), destructive: true },
          ]}
        />
      </SheetTemplate>
      <ReportSheet
        visible={sheet === 'report'}
        onClose={() => setSheet(null)}
        userId={person.id}
        name={person.displayName}
        onDone={() => {
          setSheet(null);
          setReported(true);
        }}
      />
      <ConfirmSheet
        visible={sheet === 'block'}
        onClose={() => setSheet(null)}
        title={optionsText.blockTitle(person.displayName)}
        text={optionsText.blockText(person.displayName)}
        confirmLabel={optionsText.blockConfirm}
        loading={block.isPending}
        error={block.isError ? errorText(block.error, optionsText.error) : null}
        onConfirm={() =>
          block.mutate(person.id, {
            onSuccess: () => {
              setSheet(null);
              router.replace('/rencontres');
            },
          })
        }
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14, paddingTop: 4 },
  stage: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8 },
  side: { alignItems: 'center', flex: 1 },
  tagLeft: { marginTop: -10 },
  tagRight: { marginTop: -10 },
  safety: { alignSelf: 'center', marginTop: 8 },
});
