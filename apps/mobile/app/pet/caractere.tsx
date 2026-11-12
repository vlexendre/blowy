import { gaugeLabel } from '@blowy/content';
import { cleanPetName, type GaugeKey, PET_NAME_MAX } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Banner,
  Button,
  Card,
  ChallengeCard,
  GaugePanel,
  Header,
  KeyboardPeek,
  PetHero,
  PetSummary,
  type PetSummaryItem,
  ScreenTemplate,
  Shake,
  Skeleton,
  Stack,
  TextField,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/core';
import { errorText } from '@/features/links';
import { useAnswerChallenge, usePet, useRenamePet, weekSummary } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { goBack } from '@/features/session';
import { pet as t } from '@/locales/pet';

/** Son caractère (V6-Pet) : jauges, défi du jour, nom, bilan de la semaine ; ouvert depuis l'accueil du pet. */
export default function CharacterScreen() {
  const router = useRouter();
  const pet = usePet();
  const rename = useRenamePet();
  const challenge = useAnswerChallenge();
  const [selected, setSelected] = useState<GaugeKey | null>('social');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [renameFailed, setRenameFailed] = useState(0);

  const refresh = async () => {
    setRefreshing(true);
    await pet.refetch();
    setRefreshing(false);
  };
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />;
  const header = <Header onBack={() => goBack('/(tabs)/pet')} backLabel={t.back} />;

  if (!pet.data) {
    return (
      <ScreenTemplate header={header} gutter={12} refreshControl={refreshControl}>
        <Stack top={6}>
          {pet.isPending ? (
            <>
              <Skeleton height={280} radius="xl" />
              <Skeleton height={300} radius="lg" />
            </>
          ) : (
            <Banner tone="error" title={t.loadError} text={pet.error?.message ?? ''} actionLabel={t.retry} onAction={() => void pet.refetch()} />
          )}
        </Stack>
      </ScreenTemplate>
    );
  }

  const { pet: p, challenge: c, wordsCount, events } = pet.data;
  const look = { name: p.name, species: p.species, form: p.form, mood: 'joie' as const };
  const week = weekSummary(events, Date.now());
  const weekItems: PetSummaryItem[] = week.deltas.slice(0, 3).map((d, i) => ({
    text: i === 0 && week.met > 0 ? `${t.weekDelta(d.value, gaugeLabel[d.gauge].high)} · ${t.weekMet(week.met)}` : t.weekDelta(d.value, gaugeLabel[d.gauge].high),
    tone: d.value > 0 ? 'up' : 'down',
  }));
  if (wordsCount > 0) weekItems.push({ text: t.words(wordsCount), tone: 'neutral' });
  if (!weekItems.length) weekItems.push({ text: t.weekQuiet, tone: 'neutral' });

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
    rename.mutate(clean, { onSuccess: () => setEditing(false), onError: () => setRenameFailed((n) => n + 1) });
  };

  return (
    <ScreenMotion>
    <ScreenTemplate header={header} gutter={12} refreshControl={refreshControl}>
      <Stack top={6}>
        <PetHero
          pet={look}
          title={t.title(p.name, p.form)}
          moodLabel={t.mood(p.form)}
          gradient="accent"
          showForm
          speech={t.speech[p.form]}
          onPetPress={startRename}
          petLabel={t.petA11y(p.name)}
          onEdit={startRename}
          editLabel={t.renameA11y(p.name)}
        />

        {editing ? (
          <Shake trigger={renameFailed}>
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
          </Shake>
        ) : null}

        <GaugePanel
          gauges={p.gauges}
          labels={gaugeLabel}
          names={t.gaugeNames}
          title={t.gaugesTitle}
          hint={t.gaugesHint}
          selected={selected}
          onSelect={(k) => setSelected(selected === k ? null : k)}
          detail={selected ? t.gaugeDetail[selected] : null}
          footer={t.gaugesFooter}
        />

        <PetSummary
          label={t.week}
          items={weekItems}
          primary={{ label: t.evolution, onPress: () => router.push('/pet/evolution') }}
          secondary={{ label: t.wardrobe, accessibilityLabel: t.wardrobeA11y, onPress: () => router.push('/pet/garde-robe') }}
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
      </Stack>
      <UnlockCelebration />
      {/* En renommant : le pet regarde par-dessus le clavier (iOS / Android). */}
      {editing ? <KeyboardPeek species={p.species} seed={p.id} /> : null}
    </ScreenTemplate>
    </ScreenMotion>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  fill: { flex: 1 },
});
