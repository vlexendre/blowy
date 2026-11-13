/**
 * Caractère (V6-Caractere) : le pet pose 4 questions, une par écran (choisir une réponse passe à la suivante), puis
 * le temps fort : il sort du bas de l'écran, le verdict s'écrit mot à mot et ses deux traits reviennent en puces.
 */
import { gaugeLabel } from '@blowy/content';
import { addGauges, type GaugeKey, type Gauges, ZERO_GAUGES } from '@blowy/domain';
import { OnboardingTemplate, PetRise, QuizStep, StageEcho, StageLine, StageTemplate } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { type FlowStep, hasDraftPet, progressAt, QUIZ, strongestTraits, useDraft } from '@/features/onboarding';
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
const poleOfGauge = (k: GaugeKey, quiz: Gauges): string => (quiz[k] < 0 ? gaugeLabel[k].low : gaugeLabel[k].high);
const total = (picks: readonly Pick[]): Gauges =>
  picks.reduce<Gauges>((g, p, i) => {
    const delta = QUIZ[i]?.choices[p].delta;
    return delta ? addGauges(g, delta) : g;
  }, ZERO_GAUGES);
const STEPS: readonly FlowStep[] = ['q1', 'q2', 'q3', 'q4'];

export default function Caractere() {
  // Rechargé en plein milieu (web) : plus de brouillon, on repart de l'aiguillage.
  const [ok] = useState(hasDraftPet);
  return ok ? <Quiz /> : <Redirect href="/" />;
}

function Quiz() {
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName) || common.speciesNames[species];
  const quiz = useDraft((d) => d.quiz);
  const set = useDraft((d) => d.set);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selected, setSelected] = useState<Pick | null>(null);
  const [reactKey, setReactKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    useDraft.getState().set({ quiz: ZERO_GAUGES });
    return () => void (timer.current && clearTimeout(timer.current));
  }, []);

  const index = picks.length;
  const question = QUIZ[index];

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
    setReactKey((n) => n + 1);
    set({ quiz: total([...picks, p]) });
    // La carte choisie s'incline et part ; la question suivante arrive juste après (rien n'attend la fin).
    timer.current = setTimeout(() => commit([...picks, p]), 420);
  };

  const back = () => {
    if (timer.current) clearTimeout(timer.current);
    if (index === 0) goBack('/(onboarding)/craft');
    else commit(picks.slice(0, -1));
  };

  if (!question) {
    const [first, second] = strongestTraits(quiz);
    const next = () => router.push('/(onboarding)/prenom');
    return (
      <ScreenMotion>
        <StageTemplate
          onBack={back}
          backLabel={t.previous}
          {...progressAt('traits')}
          onTap={next}
          tapLabel={t.tap}
          tapHintDelay={1500}
          stage={<PetRise species={species} up reach={0.3} mood="joie" gesture="look" gestureDelay={1300} celebrate="stars" accessibilityLabel={petName} />}
        >
          <StageLine text={t.resultTitle(petName)} size={50} wordByWord />
          <StageEcho chips={[t.trait(poleOfGauge(first, quiz)), t.trait(poleOfGauge(second, quiz))]} text={t.resultText} delay={700} />
        </StageTemplate>
      </ScreenMotion>
    );
  }

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt(STEPS[index] ?? 'q1')}
        onBack={back}
        backLabel={index ? t.previous : common.back}
        gap={0}
        host={{ species, line: t.host[index] ?? t.host[0], note: t.note, reactKey, seed: petName, name: petName }}
      >
        <QuizStep
          step={index}
          choices={question.choices.map((c, i) => ({ key: String(i), title: c.label, caption: t.caption(poleOf(c.delta)), emoji: c.emoji }))}
          selectedKey={selected === null ? null : String(selected)}
          onChoose={choose}
        />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
