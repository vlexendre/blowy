import { formLabel, gaugeLabel } from '@blowy/content';
import { cleanPetName, type GaugeKey, PET_NAME_MAX } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { Banner, Button, Card, ChallengeCard, Chip, GaugePanel, PetHero, Skeleton, TabTemplate, Text, TextField } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { errorText } from '@/features/links';
import { useAnswerChallenge, usePet, useRenamePet } from '@/features/pet';
import { pet as t } from '@/locales/pet';

export default function PetScreen() {
  const router = useRouter();
  const pet = usePet();
  const rename = useRenamePet();
  const challenge = useAnswerChallenge();
  const [selected, setSelected] = useState<GaugeKey | null>('social');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await pet.refetch();
    setRefreshing(false);
  };
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />;

  if (!pet.data) {
    return (
      <TabTemplate refreshControl={refreshControl}>
        {pet.isPending ? (
          <>
            <Skeleton height={280} radius="xl" />
            <Skeleton height={300} radius="lg" />
          </>
        ) : (
          <Banner tone="error" title={t.loadError} text={pet.error?.message ?? ''} actionLabel={t.retry} onAction={() => void pet.refetch()} />
        )}
      </TabTemplate>
    );
  }

  const { pet: p, challenge: c, wordsCount } = pet.data;
  const look = { name: p.name, species: p.species, form: p.form, mood: 'joie' as const };

  const startRename = () => {
    setName(p.name);
    rename.reset();
    setEditing(true);
  };
  const saveName = () => {
    const clean = cleanPetName(name);
    if (!clean || clean === p.name) {
      setEditing(false);
      return;
    }
    rename.mutate(clean, { onSuccess: () => setEditing(false) });
  };

  return (
    <TabTemplate refreshControl={refreshControl}>
      <PetHero
        pet={look}
        title={t.title(p.name, p.form)}
        moodLabel={t.mood(p.form)}
        formLabel={formLabel[p.form]}
        showForm
        speech={t.speech[p.form]}
        onPetPress={startRename}
        petLabel={t.petA11y(p.name)}
      />

      {editing ? (
        <Card padding="lg">
          <TextField
            label={t.renameLabel}
            hint={t.renameHint}
            value={name}
            onChangeText={setName}
            maxLength={PET_NAME_MAX}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveName}
            error={rename.isError ? errorText(rename.error, t.renameError) : null}
          />
          <View style={styles.row}>
            <Button label={t.renameCancel} variant="ghost" size="md" onPress={() => setEditing(false)} style={styles.fill} />
            <Button label={t.renameSave} size="md" onPress={saveName} loading={rename.isPending} disabled={!cleanPetName(name)} style={styles.fill} />
          </View>
        </Card>
      ) : (
        <View style={styles.row}>
          <Chip label={t.rename} tone="dark" onPress={startRename} accessibilityLabel={t.petA11y(p.name)} />
        </View>
      )}

      <GaugePanel
        gauges={p.gauges}
        labels={gaugeLabel}
        names={t.gaugeNames}
        title={t.gaugesTitle}
        hint={t.gaugesHint}
        selected={selected}
        onSelect={(k) => setSelected(selected === k ? null : k)}
        footer={selected ? gaugeLabel[selected].hint : t.gaugesFooter}
      />

      <ChallengeCard
        label={t.challengeLabel}
        question={c.question}
        choices={c.choices}
        done={c.doneToday}
        picked={c.doneToday ? picked : null}
        doneLabel={t.challengeDone}
        onChoose={(choice) => {
          setPicked(choice);
          challenge.mutate(choice);
        }}
        loading={challenge.isPending}
      />
      {challenge.isError ? <Banner tone="error" text={errorText(challenge.error, t.challengeError)} onClose={() => challenge.reset()} /> : null}

      <Card padding="lg">
        <Text variant="bodyBold">{t.words(wordsCount)}</Text>
        <Text variant="small" muted>
          {t.wordsText}
        </Text>
      </Card>

      <Button label={t.evolution} iconRight="arrow" size="lg" onPress={() => router.push('/pet/evolution')} />
    </TabTemplate>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  fill: { flex: 1 },
});
