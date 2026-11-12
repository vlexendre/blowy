import { gaugeLabel } from '@blowy/content';
import { cleanPetName, type GaugeKey, PET_NAME_MAX } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { Banner, Button, Card, ChallengeCard, GaugePanel, PetHero, PetSummary, type PetSummaryItem, Skeleton, TabTemplate, TextField } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { errorText } from '@/features/links';
import { useAnswerChallenge, usePet, useRenamePet, weekSummary } from '@/features/pet';
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
      <TabTemplate gutter={12} gap={10} top={6} refreshControl={refreshControl}>
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
    rename.mutate(clean, { onSuccess: () => setEditing(false) });
  };

  return (
    <TabTemplate gutter={12} gap={10} top={6} refreshControl={refreshControl}>
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
        secondary={{ label: t.wardrobe, plus: t.plus, accessibilityLabel: t.wardrobeA11y, onPress: () => router.push('/moi/blowy-plus') }}
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
    </TabTemplate>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  fill: { flex: 1 },
});
