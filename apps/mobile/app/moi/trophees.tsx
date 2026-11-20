/** Trophées (maquette V7 « Trophées ») : 6 familles × bronze, argent, or. */
import { Appear, Banner, Skeleton, SettingsTemplate, TrophyCard, staggerDelay } from '@blowy/ui';

import { ScreenMotion } from '@/core';
import { useProgression } from '@/features/progression';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { progression } from '@/locales/progression';

const t = progression.trophies;

export default function Trophees() {
  const q = useProgression();
  const d = q.data;
  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} onBack={() => goBack('/moi')} backLabel={common.back} intro={d ? t.count(d.trophiesWon, d.trophiesTotal) : undefined}>
        {q.isError ? (
          <Banner tone="error" title={t.error} text={errorMessage(q.error)} actionLabel={common.retry} onAction={() => void q.refetch()} />
        ) : !d ? (
          <Skeleton height={320} radius="lg" />
        ) : (
          d.trophies.map((tr, i) => (
            <Appear key={tr.family} once={`trophees:${tr.family}`} delay={staggerDelay(i)}>
              <TrophyCard
                family={tr.family}
                title={t.names[tr.family]}
                won={tr.won}
                goal={tr.next === null ? t.done : t.goal(tr.family, tr.value, tr.next)}
                progress={tr.next === null ? 1 : Math.min(1, tr.value / tr.next)}
              />
            </Appear>
          ))
        )}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
