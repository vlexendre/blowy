/**
 * La série (V6-GSerie, docs/CHEMIN.md) : une seule série, que la séance du jour de Ton chemin fait grandir (le défi
 * du jour d'avant compte pareil). La flamme et le nombre de jours, la semaine en 7 pastilles, le gel de série
 * (1 par mois, 1 par semaine avec Minimoa+), les paliers 7 / 30 / 100 / 365 et leur objet de garde-robe, puis
 * « Faire ma séance du jour ». Tout vient de `GET /v1/chemin` (`streak`). Un jour manqué est dit simplement.
 */
import { itemLabel } from '@/locales/content';
import { color } from '@blowy/tokens';
import {
  Banner,
  Button,
  Chip,
  Header,
  Icon,
  type Milestone,
  MilestoneTrack,
  ScreenTemplate,
  Skeleton,
  Stack,
  StreakHeadline,
  StreakWeek,
  Text,
  TipRow,
  Title,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl } from 'react-native';

import { ScreenMotion } from '@/core';
import { hasSessionToDo, useCheminMap } from '@/features/chemin';
import { usePet } from '@/features/pet';
import { goBack } from '@/features/session';
import { chemin } from '@/locales/chemin';
import { rituels } from '@/locales/rituels';

const t = chemin.serie;
const days = rituels.streak;

export default function StreakScreen() {
  const router = useRouter();
  const pet = usePet();
  const map = useCheminMap();
  const [refreshing, setRefreshing] = useState(false);
  const back = () => goBack('/(tabs)/pet');
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([map.refetch(), pet.refetch()]);
    setRefreshing(false);
  };
  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />
  );

  const s = map.data?.streak;
  const p = pet.data?.pet;
  if (!s || !p) {
    const failed = map.isError || pet.isError;
    return (
      <ScreenTemplate refreshControl={refreshControl}>
        <Stack top={6}>
          {failed ? (
            <Banner
              tone="error"
              title={t.loadError}
              text=""
              actionLabel={t.retry}
              onAction={() => void Promise.all([map.refetch(), pet.refetch()])}
            />
          ) : (
            <>
              <Skeleton height={372} radius="xl" />
              <Skeleton height={110} radius="lg" />
              <Skeleton height={130} radius="lg" />
            </>
          )}
        </Stack>
      </ScreenTemplate>
    );
  }

  const week = s.week.map((d, i) => ({
    letter: days.letters[i] ?? '',
    status: d.status,
    label: days.dayA11y[d.status](days.weekday(d.day)),
  }));
  // Paliers de Ton chemin (7, 30, 100, 365) : gagnés, le prochain, puis les autres ; un palier sans objet : « Bientôt ».
  const next = s.nextMilestone;
  const milestones: Milestone[] = s.milestones.map((m) => {
    const state: Milestone['state'] = m.reached ? 'owned' : m.days === next?.days ? 'next' : 'locked';
    const name = m.itemId ? (itemLabel[m.itemId] ?? m.itemId) : t.milestoneSoon;
    return {
      days: m.days,
      itemId: m.itemId,
      state,
      label: t.milestoneLabel(m.days),
      accessibilityLabel: t.milestoneA11y(name, m.days, state),
    };
  });
  const isRecord = s.current > 0 && s.current >= s.best;
  const todo = hasSessionToDo(map.data) && !s.doneToday;

  return (
    <ScreenMotion>
      <ScreenTemplate
        refreshControl={refreshControl}
        footer={
          todo ? (
            <Button label={t.cta} icon="play" onPress={() => router.push('/chemin/seance')} />
          ) : undefined
        }
      >
        <Stack top={6} gap={10}>
          <Header
            onBack={back}
            backLabel={t.back}
            center={<Title text={t.title.toUpperCase()} size={32} />}
          />
          <StreakHeadline
            title={[
              { text: `${t.count(s.current).toUpperCase()} ` },
              { text: t.countDim.toUpperCase(), color: color.orange },
            ]}
            line={isRecord && s.current > 1 ? days.record : s.best > s.current ? t.record(s.best) : t.line}
            low={!s.doneToday}
            accessibilityLabel={`${t.count(s.current)} ${t.countDim}`}
          />
          <StreakWeek
            title={t.week}
            right={
              <Chip
                label={t.freezeChip(s.freezesLeft)}
                tone="sky"
                size="sm"
                accessibilityLabel={t.freezeA11y(s.freezesLeft)}
              />
            }
            days={week}
            animateKey={s.week[0]?.day}
          />
          {s.current === 0 && s.best > 0 ? (
            <TipRow icon={<Icon name="flamme" size={26} />} text={days.reset(s.best)} />
          ) : null}
          <MilestoneTrack
            title={t.milestones}
            hint={next ? t.milestoneLeft(Math.max(0, next.days - s.current)) : undefined}
            milestones={milestones}
            onceKey="chemin:milestones"
          />
          {!todo && !s.doneToday ? (
            <Text size={14} muted center>
              {map.data?.today.line ?? ''}
            </Text>
          ) : null}
        </Stack>
      </ScreenTemplate>
    </ScreenMotion>
  );
}
