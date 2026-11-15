/**
 * Son caractère, rééquilibré (V6-GCaractere, spéc §15) : le minimoa et sa forme · sa vision (5 axes, « pour
 * l'instant », c'est elle qui choisit qui il présente) · son style (4 jauges, en petit, ne filtre personne) · ses
 * habitudes et leur série · son évolution · son nom (une fois tous les 60 jours, libre avec Blowy+).
 */
import { gaugeLabel } from '@/locales/content';
import { cleanPetName, dayOf, GAUGE_KEYS, nextRenameOn, PET_NAME_MAX, RENAME_COOLDOWN_DAYS } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Appear,
  Banner,
  Glyph,
  EntryCard,
  Header,
  Icon,
  KeyboardPeek,
  PetHero,
  RenameCard,
  ScreenTemplate,
  Shake,
  Skeleton,
  Stack,
  StylePanel,
  VisionPanel,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl } from 'react-native';

import { ScreenMotion } from '@/core';
import { errorText, shortDay } from '@/features/links';
import { usePet, useRenamePet } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { useHabits, useStreak, useVision } from '@/features/rituals';
import { goBack } from '@/features/session';
import { pet as t } from '@/locales/pet';
import { rituels } from '@/locales/rituels';
import { upperFirst } from '@/locales/runtime';

const c = rituels.character;
/** « Fonder un foyer » → « fonder un foyer » (après le nom de l'axe). */
const lowerFirst = (s: string): string => (s ? s.charAt(0).toLocaleLowerCase() + s.slice(1) : s);

export default function CharacterScreen() {
  const router = useRouter();
  const pet = usePet();
  const vision = useVision();
  const habits = useHabits();
  const streak = useStreak();
  const rename = useRenamePet();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [renameFailed, setRenameFailed] = useState(0);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([pet.refetch(), vision.refetch(), habits.refetch(), streak.refetch()]);
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
              <Skeleton height={226} radius="xl" />
              <Skeleton height={300} radius="lg" />
            </>
          ) : (
            <Banner tone="error" title={t.loadError} text={pet.error?.message ?? ''} actionLabel={t.retry} onAction={() => void pet.refetch()} />
          )}
        </Stack>
      </ScreenTemplate>
    );
  }

  const { pet: p, rename: renameRule } = pet.data;
  // Nom changé il y a moins de 60 jours (sans Blowy+) : champ en lecture seule, date et raccourci vers Blowy+.
  const renameLocked = !renameRule.allowed;
  const renameNotice = renameLocked
    ? renameRule.availableOn
      ? t.renameLocked(shortDay(renameRule.availableOn))
      : null
    : renameRule.unlimited
      ? null
      : t.renameNext(RENAME_COOLDOWN_DAYS, shortDay(nextRenameOn(dayOf(new Date()))));
  const look = { name: p.name, species: p.species, form: p.form, mood: 'joie' as const, outfit: p.outfit };

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

  const v = vision.data;
  const hs = habits.data?.habits ?? [];
  const bestHabit = hs.reduce((m, h) => Math.max(m, h.streak), 0);
  const s = streak.data;

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
              <RenameCard
                label={t.renameLabel}
                hint={t.renameHint}
                value={renameLocked ? p.name : name}
                onChangeText={setName}
                maxLength={PET_NAME_MAX}
                locked={renameLocked}
                notice={renameNotice}
                noticeAction={renameLocked ? { label: t.renamePlus, onPress: () => router.push('/moi/blowy-plus') } : null}
                error={rename.isError ? errorText(rename.error, t.renameError) : null}
                cancelLabel={renameLocked ? t.renameClose : t.renameCancel}
                saveLabel={t.renameSave}
                onCancel={() => setEditing(false)}
                onSave={saveName}
                saving={rename.isPending}
                canSave={!!cleanPetName(name)}
              />
            </Shake>
          ) : null}

          {/* Sa vision : ce qui choisit qui il présente. */}
          {v ? (
            <Appear once="character:vision" delay={80}>
              <VisionPanel
                title={c.vision}
                hint={c.visionHint}
                axes={v.axes.map((a) => ({
                  name: a.name,
                  value: a.value,
                  confidence: a.confidence,
                  lean: a.side === 'mid' ? c.between : lowerFirst(a.side === 'high' ? a.highLabel : a.lowLabel),
                  accessibilityLabel: c.axisA11y(a.name, a.line),
                }))}
                footer={c.visionFooter(v.note)}
              />
            </Appear>
          ) : vision.isPending ? (
            <Skeleton height={330} radius="lg" />
          ) : (
            <Banner tone="error" text={c.visionError} actionLabel={t.retry} onAction={() => void vision.refetch()} />
          )}

          {/* Son style : sa personnalité, ne filtre personne. */}
          <Appear once="character:style" delay={140}>
            <StylePanel
              title={c.style}
              hint={c.styleHint}
              gauges={GAUGE_KEYS.map((k) => ({ name: upperFirst(gaugeLabel[k].high), value: p.gauges[k], accessibilityLabel: c.styleA11y(`${t.gaugeNames[k]}, ${gaugeLabel[k].low} ↔ ${gaugeLabel[k].high}`, p.gauges[k]) }))}
            />
          </Appear>

          <Appear once="character:habits" delay={200}>
            <EntryCard
              left={<Glyph name="camera" size={26} color={color.accent} />}
              title={c.habits}
              text={c.habitsText(hs.length, bestHabit)}
              chevron
              onPress={() => router.push('/pet/habitudes')}
            />
          </Appear>
          <Appear once="character:streak" delay={230}>
            <EntryCard
              left={<Icon name="flamme" size={34} />}
              title={c.streak}
              text={s ? c.streakText(s.current, s.best) : undefined}
              chevron
              onPress={() => router.push('/pet/serie')}
            />
          </Appear>
          <Appear once="character:evolution" delay={260}>
            <EntryCard left={<Icon name="etoiles" size={34} />} title={c.evolution} text={c.evolutionText} chevron onPress={() => router.push('/pet/evolution')} />
          </Appear>
          <Appear once="character:reviews" delay={290}>
            <EntryCard left={<Icon name="cadeau" size={34} />} title={c.reviews} text={c.reviewsText} chevron onPress={() => router.push('/pet/bilans')} />
          </Appear>
          <Appear once="character:memories" delay={320}>
            <EntryCard left={<Icon name="coeurs" size={34} />} title={c.memories} text={c.memoriesText} chevron onPress={() => router.push('/pet/souvenirs')} />
          </Appear>
        </Stack>
        <UnlockCelebration />
        {/* En renommant : le pet regarde par-dessus le clavier (iOS / Android). */}
        {editing && !renameLocked ? <KeyboardPeek species={p.species} seed={p.id} /> : null}
      </ScreenTemplate>
    </ScreenMotion>
  );
}
