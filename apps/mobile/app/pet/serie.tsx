/**
 * La série (V6-GSerie) : le chiffre, la mèche du minimoa qui brûle à sa taille, la semaine, les paliers et leurs objets,
 * les jokers et le record. Un jour manqué est dit simplement, sans reproche.
 */
import { itemLabel } from '@/locales/content';
import { entitlements, STREAK_MILESTONES, streakReward } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Banner,
  Button,
  Icon,
  type Milestone,
  MilestoneTrack,
  ScreenTemplate,
  Skeleton,
  Stack,
  StreakHero,
  StreakWeek,
  TipRow,
  type TextRun,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl } from 'react-native';

import { ScreenMotion } from '@/core';
import { useMe } from '@/features/me';
import { usePet } from '@/features/pet';
import { nextStreakItem, useRitualsToday, useStreak } from '@/features/rituals';
import { openPlus } from '@/features/plus';
import { goBack } from '@/features/session';
import { rituels } from '@/locales/rituels';
import { upperFirst } from '@/locales/runtime';

const t = rituels.streak;

export default function StreakScreen() {
  const router = useRouter();
  const pet = usePet();
  const streak = useStreak();
  const today = useRitualsToday();
  const me = useMe();
  const [refreshing, setRefreshing] = useState(false);
  const back = () => goBack('/(tabs)/pet');
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([streak.refetch(), today.refetch()]);
    setRefreshing(false);
  };
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />;

  const s = streak.data ?? today.data?.streak;
  const p = pet.data?.pet;
  if (!s || !p) {
    const failed = streak.isError || pet.isError;
    return (
      <ScreenTemplate refreshControl={refreshControl}>
        <Stack top={6}>
          {failed ? (
            <Banner tone="error" title={t.loadError} text="" actionLabel={t.retry} onAction={() => void Promise.all([streak.refetch(), pet.refetch()])} />
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

  const c = today.data?.challenge;
  const days = s.week.map((d, i) => {
    const name = t.weekday(d.day);
    return { letter: t.letters[i] ?? '', status: d.status, label: t.dayA11y[d.status](name) };
  });
  const runs: TextRun[] | undefined = c
    ? [
        { text: t.todayLead, color: color.mute },
        { text: c.kindLabel, variant: 'bodyHeavy', color: color.white },
        { text: s.doneToday ? t.todayDone(s.current) : t.todayTodo, color: color.mute },
      ]
    : undefined;

  // Paliers : les six, gagnés (un palier se gagne une fois, quand le record le franchit), le prochain à gagner
  // (`nextMilestone` du serveur), puis les autres.
  const next = nextStreakItem(s);
  const milestones: Milestone[] = STREAK_MILESTONES.map((m) => {
    const itemId = streakReward(m);
    const has = s.best >= m;
    const state: Milestone['state'] = has ? 'owned' : m === next?.days ? 'next' : 'locked';
    const name = itemId ? (itemLabel[itemId] ?? itemId) : '';
    return { days: m, itemId, state, label: t.milestoneLabel(m), accessibilityLabel: t.milestoneA11y(name, m, state) };
  });
  const hint = next ? t.milestoneHint(upperFirst(itemLabel[next.itemId] ?? next.itemId), next.left) : t.milestoneAll;
  const plus = me.data?.plus ?? false;
  const plusJokers = entitlements(true).jokersPerWeek;
  const isRecord = s.current > 0 && s.current >= s.best;

  return (
    <ScreenMotion>
      <ScreenTemplate refreshControl={refreshControl} footer={c && !s.doneToday ? <Button label={t.cta} onPress={() => router.push('/pet/defi')} /> : undefined}>
        <Stack top={6} gap={10}>
          <StreakHero
            pet={{ species: p.species, outfit: p.outfit, name: p.name, id: p.id }}
            count={s.current}
            title={t.title(s.current)}
            line={s.current > 0 ? t.lineLit : t.lineOff}
            badge={isRecord && s.current > 1 ? t.record : s.best > s.current ? t.best(s.best) : null}
            record={isRecord && s.current > 1}
            low={!s.doneToday}
            onBack={back}
            backLabel={t.back}
            petLabel={p.name}
          />
          <StreakWeek days={days} runs={runs} animateKey={s.week[0]?.day} />
          {s.current === 0 && s.best > 0 ? <TipRow icon={<Icon name="flamme" size={26} />} text={t.reset(s.best)} /> : null}
          <MilestoneTrack title={t.milestones} hint={hint} milestones={milestones} onceKey="streak:milestones" />
          <TipRow icon={<Icon name="etoiles" size={26} />} disc={color.violet} lead={t.jokers(s.jokersLeft)} text={t.jokersText} />
          {/* Sans Blowy+ : ce qu'il change ici, en un lien discret (le seul bouton coloré reste « Voir le défi du jour »). */}
          {!plus ? <Button label={t.jokersPlus(plusJokers)} variant="ghost" size="md" onPress={() => openPlus('jokers')} /> : null}
        </Stack>
      </ScreenTemplate>
    </ScreenMotion>
  );
}
