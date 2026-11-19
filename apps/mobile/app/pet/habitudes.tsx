/**
 * Ses habitudes (V6-GHabitudes) : celles suivies (série, preuve du jour), les objets qu'elles font gagner. Le
 * catalogue est dans la feuille « Ajouter une habitude » (la limite, 2 sans Minimoa+, 6 avec, y est dite telle quelle ;
 * une ligne verrouillée ouvre Minimoa+) ; le rythme et « arrêter » dans la feuille « Régler » de chaque habitude.
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
  RigourGauge,
  SettingsTemplate,
  SheetTemplate,
  Skeleton,
  staggerDelay,
  Text,
  TogetherCard,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { errorText } from '@/features/links';
import { useMe } from '@/features/me';
import { usePet, useWardrobe } from '@/features/pet';
import { useAddHabit, useHabitCatalogue, useHabits, useRemoveHabit, useUpdateHabit, useVision } from '@/features/rituals';
import { openPlus } from '@/features/plus';
import { goBack } from '@/features/session';
import { rigourView, useProposeTogether, useTogether, useWithdrawTogether } from '@/features/groups';
import { groupes, groupesShared } from '@/locales/groupes';
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
  const [adding, setAdding] = useState<HabitDef | null>(null);
  const [rhythm, setRhythm] = useState<HabitDef['rhythm']>('daily');
  /** Catalogue ouvert (feuille « Ajouter une habitude »). */
  const [picking, setPicking] = useState(false);
  /** Feuille « Régler » d'une habitude : son rythme, puis « arrêter » (confirmation dans la même feuille). */
  const [editing, setEditing] = useState<{ ref: string; label: string } | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const back = () => goBack('/(tabs)/pet');
  // « La tenir ensemble » (spéc. §26) : un nombre par habitude ; rien si « Montrer mes habitudes » est coupé.
  const together = useTogether(habits.data?.shared !== false);
  const propose = useProposeTogether();
  const withdraw = useWithdrawTogether();
  /** Groupes « ensemble » démarrés pendant cette visite (habitude → groupe). */
  const [started, setStarted] = useState<Record<string, string>>({});

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
            <Skeleton height={160} radius="lg" />
            <Skeleton height={160} radius="lg" />
            <Skeleton height={110} radius="lg" />
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
      // Minimoa+ monte en feuille : on attend que le catalogue soit redescendu (iOS ne présente pas deux modales à la fois).
      setPicking(false);
      if (!plus) setTimeout(() => openPlus('habits_limit'), 320);
      return;
    }
    add.reset();
    setRhythm(def.rhythm);
    setPicking(false);
    setAdding(def);
  };
  const openEdit = (ref: string, label: string) => {
    update.reset();
    remove.reset();
    setConfirmStop(false);
    setEditing({ ref, label });
  };
  const edited = editing ? h.habits.find((x) => x.ref === editing.ref) : undefined;
  /** « Ajouter une habitude » : tant qu'il en reste à ajouter (complet sans Minimoa+ : les lignes ouvrent Minimoa+). */
  const canOpenCatalogue = available.length > 0 && !(full && plus);

  return (
    <ScreenMotion>
      <SettingsTemplate
        title={t.title}
        titleSize={40}
        onBack={back}
        backLabel={t.back}
        right={<Chip label={t.count(h.habits.length, h.limit)} tone="accent" accessibilityLabel={t.countA11y(h.habits.length, h.limit)} />}
        footer={
          canOpenCatalogue ? <Button label={t.add} icon="plus" variant={h.habits.length ? 'glass' : 'accent'} onPress={() => setPicking(true)} /> : undefined
        }
      >
        {h.habits.length > 0 && h.rigour ? (
          <RigourGauge
            value={h.rigour.value}
            label={groupes.rigour.mine}
            valueLabel={rigourView(h.rigour).valueLabel}
            accessibilityLabel={rigourView(h.rigour).accessibilityLabel}
          />
        ) : null}
        {h.habits.length === 0 ? <EmptyState species={pet.data?.pet.species} mood="neutre" title={t.emptyTitle} text={t.empty(name)} /> : null}
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
                line={x.today.line}
                rigour={x.rigour ? rigourView(x.rigour) : null}
                action={x.today.due || askNow ? { label: t.prove, onPress: () => router.push({ pathname: '/pet/preuve', params: { ref: x.ref } }) } : null}
                remove={{ label: t.settings, accessibilityLabel: t.settingsA11y(x.label), onPress: () => openEdit(x.ref, x.label) }}
              />
            </Appear>
          );
        })}

        {(together.data?.suggestions ?? []).map((sug) => {
          const groupId = started[sug.habitId];
          const state = groupId ? 'started' : sug.proposed ? 'waiting' : 'idle';
          return (
            <Appear key={`together:${sug.habitId}`} once={`habits:together:${sug.habitId}`}>
              <TogetherCard
                emoji={t.emoji[sug.habitId]}
                text={sug.text}
                state={state}
                stateLine={state === 'started' ? groupes.together.started : groupes.together.waiting}
                actionLabel={state === 'started' ? groupes.together.open : state === 'waiting' ? groupes.together.withdraw : groupes.together.propose}
                loading={(propose.isPending && propose.variables === sug.habitId) || (withdraw.isPending && withdraw.variables === sug.habitId)}
                onAction={() => {
                  if (groupId) return router.push(`/groupe/${groupId}`);
                  if (sug.proposed) return withdraw.mutate(sug.habitId);
                  propose.mutate(sug.habitId, {
                    onSuccess: (r) => {
                      if (r.status === 'started' && r.groupId) setStarted((m) => ({ ...m, [sug.habitId]: r.groupId as string }));
                    },
                  });
                }}
              />
            </Appear>
          );
        })}
        {propose.isError || withdraw.isError ? (
          <Banner tone="error" text={errorText(propose.error ?? withdraw.error, groupes.together.error)} onClose={() => (propose.reset(), withdraw.reset())} closeLabel={t.retry} />
        ) : null}

        {milestones.length ? (
          <MilestoneTrack
            title={t.itemsTitle}
            hint={nextHabitItem?.goal ? t.progress(upperFirst(itemLabel[nextHabitItem.id] ?? nextHabitItem.id), nextHabitItem.goal.need) : t.progressAll}
            milestones={milestones}
            onceKey="habits:items"
          />
        ) : null}

      </SettingsTemplate>

      {/* Le catalogue, puis l'habitude choisie : une seule feuille dont le contenu change. */}
      <SheetTemplate
        visible={picking || !!adding}
        onClose={() => {
          setPicking(false);
          setAdding(null);
        }}
        scroll={picking && !adding}
        title={adding ? t.addTitle(adding.label) : t.add}
        footer={
          adding ? (
            <Button
              label={t.addConfirm}
              loading={add.isPending}
              onPress={() => add.mutate({ habitId: adding.id, rhythm }, { onSuccess: () => setAdding(null) })}
            />
          ) : undefined
        }
      >
        {picking && !adding ? (
          <>
            <Text size={15} muted>
              {plus ? t.limitPlus(h.limit) : t.limitFree(entitlements(false).habits, entitlements(true).habits)}
            </Text>
            {/* Dit au moment de choisir (spéc. §25), sauf si « Montrer mes habitudes » est coupé. */}
            {h.shared !== false ? (
              <Text size={13} muted>
                {groupesShared.habitsVisibility}
              </Text>
            ) : null}
            {available.map((def, i) => {
              const locked = full && !plus;
              return (
                <ListRow
                  key={def.id}
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
              );
            })}
          </>
        ) : null}
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
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? (confirmStop ? t.removeTitle(editing.label) : editing.label) : undefined}
        footer={
          confirmStop ? (
            <>
              <Button
                label={t.removeConfirm}
                variant="danger"
                loading={remove.isPending}
                onPress={() => editing && remove.mutate(editing.ref, { onSuccess: () => setEditing(null) })}
              />
              <Button label={t.removeCancel} variant="ghost" onPress={() => setConfirmStop(false)} />
            </>
          ) : (
            <Button label={t.removeConfirm} variant="ghost" onPress={() => setConfirmStop(true)} />
          )
        }
      >
        {confirmStop ? (
          <Text size={17}>{t.removeText}</Text>
        ) : edited ? (
          <>
            <Text size={15} muted>
              {t.rhythm}
            </Text>
            {cat.rhythms.map((r) => (
              <ListRow
                key={r.id}
                title={r.label}
                onPress={() => r.id !== edited.rhythm && update.mutate({ ref: edited.ref, rhythm: r.id })}
                right={edited.rhythm === r.id ? <Glyph name="check" size={18} color={color.accent} /> : undefined}
                chevron={false}
                accessibilityLabel={edited.rhythm === r.id ? t.rhythmA11y(r.label) : r.label}
              />
            ))}
          </>
        ) : null}
        {update.isError ? <Banner tone="error" text={errorText(update.error, t.error)} /> : null}
        {remove.isError ? <Banner tone="error" text={errorText(remove.error, t.error)} /> : null}
      </SheetTemplate>
    </ScreenMotion>
  );
}

