/**
 * Ses habitudes (V6-GHabitudes) : celles suivies (rythme, série, preuve du jour), les objets qu'elles font gagner,
 * et le catalogue. La limite (2 sans Blowy+, 6 avec) est dite telle quelle ; une ligne verrouillée ouvre Blowy+.
 */
import type { HabitDef } from '@blowy/contract';
import { itemLabel } from '@/locales/content';
import { color } from '@blowy/tokens';
import {
  Appear,
  Banner,
  Button,
  Chip,
  EmptyState,
  Glyph,
  HabitCard,
  ListRow,
  type Milestone,
  MilestoneTrack,
  SettingsTemplate,
  SheetTemplate,
  Skeleton,
  staggerDelay,
  Text,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { errorText } from '@/features/links';
import { useMe } from '@/features/me';
import { usePet, useWardrobe } from '@/features/pet';
import { useAddHabit, useHabitCatalogue, useHabits, useOpenPlus, useRemoveHabit, useUpdateHabit, useVision } from '@/features/rituals';
import { goBack } from '@/features/session';
import { rituels } from '@/locales/rituels';
import { upperFirst } from '@/locales/runtime';
import { entitlements } from '@blowy/domain';

const t = rituels.habits;
const GRADIENTS = ['accent', 'violet', 'orange', 'coral', 'rose', 'wine'] as const;

export default function HabitsScreen() {
  const router = useRouter();
  const habits = useHabits();
  const catalogue = useHabitCatalogue();
  const vision = useVision();
  const wardrobe = useWardrobe();
  const pet = usePet();
  const me = useMe();
  const add = useAddHabit();
  const update = useUpdateHabit();
  const remove = useRemoveHabit();
  const openPlus = useOpenPlus();
  const [adding, setAdding] = useState<HabitDef | null>(null);
  const [rhythm, setRhythm] = useState<HabitDef['rhythm']>('daily');
  const [removing, setRemoving] = useState<{ ref: string; label: string } | null>(null);
  const back = () => goBack('/(tabs)/pet');

  const h = habits.data;
  const cat = catalogue.data;
  if (!h || !cat) {
    const failed = habits.isError || catalogue.isError;
    return (
      <SettingsTemplate title={t.title} titleSize={40} onBack={back} backLabel={t.back}>
        {failed ? (
          <Banner tone="error" title={t.loadError} text="" actionLabel={t.retry} onAction={() => void Promise.all([habits.refetch(), catalogue.refetch()])} />
        ) : (
          <>
            <Skeleton height={210} radius="xl" />
            <Skeleton height={120} radius="lg" />
            <Skeleton height={260} radius="lg" />
          </>
        )}
      </SettingsTemplate>
    );
  }

  const plus = me.data?.plus ?? false;
  const axisName = (axis: HabitDef['axis']): string => vision.data?.axes.find((a) => a.axis === axis)?.name ?? t.axis[axis];
  const followed = new Set(h.habits.map((x) => x.habitId));
  const available = cat.habits.filter((x) => !followed.has(x.id));
  const full = !h.canAdd;
  const name = pet.data?.pet.name ?? '';

  // Objets que les habitudes tenues font gagner (toutes habitudes confondues), avec leur avancement.
  const habitItems = (wardrobe.data?.items ?? []).filter((i) => i.goal?.stat === 'habitsKept').sort((a, b) => (a.goal?.need ?? 0) - (b.goal?.need ?? 0));
  const nextHabitItem = habitItems.find((i) => i.state === 'locked');
  const milestones: Milestone[] = habitItems.map((i) => {
    const need = i.goal?.need ?? 0;
    const state: Milestone['state'] = i.state !== 'locked' ? 'owned' : i.id === nextHabitItem?.id ? 'next' : 'locked';
    return {
      days: need,
      itemId: i.id,
      state,
      label: t.itemsLabel(need),
      accessibilityLabel: `${itemLabel[i.id] ?? i.id}, ${t.progress(itemLabel[i.id] ?? i.id, need)}`,
    };
  });

  const startAdd = (def: HabitDef) => {
    if (full) {
      if (!plus) openPlus('habits');
      return;
    }
    add.reset();
    setRhythm(def.rhythm);
    setAdding(def);
  };

  return (
    <ScreenMotion>
      <SettingsTemplate
        title={t.title}
        titleSize={40}
        onBack={back}
        backLabel={t.back}
        intro={t.intro(name)}
        right={<Chip label={t.count(h.habits.length, h.limit)} tone="accent" accessibilityLabel={t.countA11y(h.habits.length, h.limit)} />}
        footer={full && !plus ? <Button label={t.plusCta} variant="glass" onPress={() => openPlus('habits')} /> : undefined}
      >
        {h.habits.length === 0 ? <EmptyState species={pet.data?.pet.species} mood="neutre" title={t.emptyTitle} text={t.empty} /> : null}
        {h.habits.map((x, i) => {
          const weekly = x.rhythm === 'three_per_week';
          const askNow = x.today.askNow && !x.today.doneToday;
          return (
            <Appear key={x.ref} once={`habits:${x.ref}`} delay={staggerDelay(i)}>
              <HabitCard
                title={x.label}
                emoji={t.emoji[x.habitId]}
                meta={t.meta(axisName(cat.habits.find((d) => d.id === x.habitId)?.axis ?? 'rythme'), x.streak, weekly, x.proofHour)}
                gradient={GRADIENTS[i % GRADIENTS.length]}
                progress={{
                  value: x.today.target > 0 ? x.today.doneThisWeek / x.today.target : 0,
                  label: x.today.doneToday ? t.doneToday : t.week(x.today.doneThisWeek, x.today.target),
                  itemId: nextHabitItem?.id ?? null,
                }}
                rhythms={cat.rhythms}
                rhythm={x.rhythm}
                rhythmBusy={update.isPending && update.variables?.ref === x.ref}
                onRhythm={(r) => update.mutate({ ref: x.ref, rhythm: r })}
                line={x.today.line}
                action={x.today.due || askNow ? { label: t.prove, onPress: () => router.push({ pathname: '/pet/preuve', params: { ref: x.ref } }) } : null}
                remove={{ label: t.remove, accessibilityLabel: t.removeA11y(x.label), onPress: () => setRemoving({ ref: x.ref, label: x.label }) }}
              />
            </Appear>
          );
        })}
        {update.isError ? <Banner tone="error" text={errorText(update.error, t.error)} onClose={() => update.reset()} /> : null}

        {milestones.length ? (
          <MilestoneTrack
            title={t.itemsTitle}
            hint={nextHabitItem?.goal ? t.progress(upperFirst(itemLabel[nextHabitItem.id] ?? nextHabitItem.id), nextHabitItem.goal.need) : t.progressAll}
            milestones={milestones}
            onceKey="habits:items"
          />
        ) : null}

        <Text variant="bodyHeavy" size={20} accessibilityRole="header">
          {t.catalogue}
        </Text>
        <Text size={15} muted>
          {plus ? t.limitPlus(h.limit) : t.limitFree(entitlements(false).habits, entitlements(true).habits)}
        </Text>
        {available.map((def, i) => {
          const locked = full && !plus;
          return (
            <Appear key={def.id} once={`catalogue:${def.id}`} delay={staggerDelay(i)}>
              <ListRow
                title={def.label}
                subtitle={def.social ? `${axisName(def.axis)} · ${t.social}` : axisName(def.axis)}
                left={<Text size={26}>{t.emoji[def.id] ?? '✨'}</Text>}
                right={
                  locked ? (
                    <Chip label={t.locked} tone="violet" left={<Glyph name="lock" size={12} color={color.white} />} />
                  ) : full ? (
                    <Chip label={t.full} tone="glass" />
                  ) : (
                    <Glyph name="plus" size={22} color={color.accent} />
                  )
                }
                onPress={() => startAdd(def)}
                disabled={full && plus}
                accessibilityLabel={locked ? t.lockedA11y(def.label) : t.addA11y(def.label)}
                divider={i < available.length - 1}
              />
            </Appear>
          );
        })}
      </SettingsTemplate>

      <SheetTemplate
        visible={!!adding}
        onClose={() => setAdding(null)}
        title={adding ? t.addTitle(adding.label) : undefined}
        footer={
          <Button
            label={t.addConfirm}
            loading={add.isPending}
            onPress={() => adding && add.mutate({ habitId: adding.id, rhythm }, { onSuccess: () => setAdding(null) })}
          />
        }
      >
        {adding ? (
          <>
            <Text size={17}>{t.addAsk(adding.ask)}</Text>
            <Text size={15} muted>
              {t.addHour(adding.proofHour)}
            </Text>
            {cat.rhythms.map((r) => (
              <ListRow
                key={r.id}
                title={r.label}
                onPress={() => setRhythm(r.id)}
                right={rhythm === r.id ? <Glyph name="check" size={18} color={color.accent} /> : undefined}
                chevron={false}
                accessibilityLabel={r.label}
              />
            ))}
            {add.isError ? <Banner tone="error" text={errorText(add.error, t.error)} /> : null}
          </>
        ) : null}
      </SheetTemplate>

      <SheetTemplate
        visible={!!removing}
        onClose={() => setRemoving(null)}
        title={removing ? t.removeTitle(removing.label) : undefined}
        footer={
          <>
            <Button
              label={t.removeConfirm}
              variant="danger"
              loading={remove.isPending}
              onPress={() => removing && remove.mutate(removing.ref, { onSuccess: () => setRemoving(null) })}
            />
            <Button label={t.removeCancel} variant="ghost" onPress={() => setRemoving(null)} />
          </>
        }
      >
        <Text size={17}>{t.removeText}</Text>
        {remove.isError ? <Banner tone="error" text={errorText(remove.error, t.error)} /> : null}
      </SheetTemplate>
    </ScreenMotion>
  );
}
