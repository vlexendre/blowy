/** La série qui monte (maquette V7 « Palier de série ») : le grand nombre, la semaine cochée, « Partager », « Continuer ». */
import { ScreenTemplate, StreakTier } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Share } from 'react-native';

import { ScreenMotion } from '@/core';
import { useCheminResults } from '@/features/chemin';
import { usePet } from '@/features/pet';
import { celebration } from '@/locales/celebration';
import { rituels } from '@/locales/rituels';

const t = celebration.tier;
const days = rituels.streak;

export default function Palier() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const entry = useCheminResults((s) => (id ? s.results[id] : undefined));
  const pet = usePet();
  const next = () => router.replace({ pathname: '/chemin/fin', params: { id: id ?? '' } });
  // Résultat perdu (app relancée) : on passe à la suite.
  useEffect(() => {
    if (!entry) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);
  if (!entry) return null;
  const s = entry.result.streak;
  const week = s.week.map((d, i) => ({
    letter: days.letters[i] ?? '',
    done: d.status === 'done' || d.status === 'joker' || (d.status === 'today' && s.doneToday),
    today: d.status === 'today',
    label: days.dayA11y[d.status](days.weekday(d.day)),
  }));
  return (
    <ScreenMotion>
      <ScreenTemplate background="orange">
        <StreakTier
          species={pet.data?.pet.species ?? 'nino'}
          count={s.current}
          from={entry.streakBefore}
          unit={t.unit(s.current)}
          days={week}
          shareLabel={t.share}
          onShare={() => void Share.share({ message: t.shareText(s.current) })}
          continueLabel={t.continue}
          onContinue={next}
          accessibilityLabel={t.a11y(s.current)}
        />
      </ScreenTemplate>
    </ScreenMotion>
  );
}
