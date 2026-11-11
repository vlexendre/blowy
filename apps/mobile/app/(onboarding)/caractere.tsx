/** Caractère de départ (V6-Caractere) : 4 questions une à une, puis les jauges du pet. */
import { gaugeLabel } from '@blowy/content';
import { addGauges, type GaugeKey, type Gauges, ZERO_GAUGES } from '@blowy/domain';
import { space } from '@blowy/tokens';
import { GaugePanel, Header, OnboardingTemplate, PetImage, QuizStep, ScreenTemplate, StepProgress } from '@blowy/ui';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/core';
import { QUIZ, useDraft } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.caractere;
type Pick = 0 | 1;

const gaugeOf = (delta: Partial<Gauges>): GaugeKey => (Object.keys(delta)[0] as GaugeKey | undefined) ?? 'social';
const poleOf = (delta: Partial<Gauges>): string => {
  const k = gaugeOf(delta);
  return (delta[k] ?? 0) < 0 ? gaugeLabel[k].low : gaugeLabel[k].high;
};
const total = (picks: readonly Pick[]): Gauges =>
  picks.reduce<Gauges>((g, p, i) => {
    const delta = QUIZ[i]?.choices[p].delta;
    return delta ? addGauges(g, delta) : g;
  }, ZERO_GAUGES);

export default function Caractere() {
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName) || common.speciesNames[species];
  const quiz = useDraft((d) => d.quiz);
  const set = useDraft((d) => d.set);
  // Déjà connecté (compte sans pet) : pas besoin de repasser par l'e-mail.
  const session = useSession();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selected, setSelected] = useState<Pick | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    useDraft.getState().set({ quiz: ZERO_GAUGES });
    return () => void (timer.current && clearTimeout(timer.current));
  }, []);

  const index = picks.length;
  const question = QUIZ[index];
  const pet = { name: petName, species };

  // Le brouillon suit les réponses : revenir en arrière annule l'effet de la dernière.
  const commit = (next: Pick[]) => {
    setPicks(next);
    set({ quiz: total(next) });
    setSelected(null);
  };

  const choose = (key: string) => {
    if (selected !== null) return;
    const p: Pick = key === '1' ? 1 : 0;
    setSelected(p);
    set({ quiz: total([...picks, p]) });
    timer.current = setTimeout(() => commit([...picks, p]), 420);
  };

  const back = () => {
    if (timer.current) clearTimeout(timer.current);
    if (index === 0) goBack('/(onboarding)/craft');
    else commit(picks.slice(0, -1));
  };

  if (!question) {
    return (
      <OnboardingTemplate
        step={2}
        total={onboarding.total}
        onBack={back}
        backLabel={common.back}
        title={t.resultTitle(petName)}
        text={t.resultText}
        primaryLabel={t.resultCta}
        onPrimary={() => router.push(session ? '/(onboarding)/profil' : '/(onboarding)/compte')}
      >
        <View style={{ alignItems: 'center' }}>
          <PetImage species={species} mood="joie" size={170} animation="breathe" outline accessibilityLabel={petName} />
        </View>
        <GaugePanel gauges={quiz} labels={gaugeLabel} names={t.gaugeNames} title={t.resultPanel} footer={t.resultHint} />
      </OnboardingTemplate>
    );
  }

  const key = gaugeOf(question.choices[0].delta);
  const icons: readonly (typeof t.icons)[number][number][] = t.icons[index] ?? t.icons[0] ?? [];
  return (
    <ScreenTemplate header={<Header onBack={back} backLabel={common.back} center={<StepProgress step={2} total={onboarding.total} />} />}>
      <View style={{ flexGrow: 1, paddingTop: space.sm }}>
        <QuizStep
          key={index}
          kicker={`${t.kicker[key]} · ${index + 1}/${QUIZ.length}`}
          title={(t.titles[index] ?? t.titles[0])(petName)}
          text={t.text}
          choices={question.choices.map((c, i) => ({ key: String(i), title: c.label, caption: t.caption(poleOf(c.delta)), icon: icons[i] }))}
          selectedKey={selected === null ? null : String(selected)}
          onChoose={choose}
          preview={{ pet, gauges: quiz, labels: gaugeLabel }}
        />
      </View>
    </ScreenTemplate>
  );
}
