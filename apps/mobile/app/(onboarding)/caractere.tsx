/** Caractère de départ (V6-Caractere) : 4 questions une à une, puis le caractère obtenu. */
import { gaugeLabel } from '@blowy/content';
import { addGauges, type GaugeKey, type Gauges, ZERO_GAUGES } from '@blowy/domain';
import { OnboardingTemplate, QuizPreview, QuizResult, QuizResultActions, QuizStep } from '@blowy/ui';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/core';
import { QUIZ, strongestTraits, useDraft } from '@/features/onboarding';
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
  const preview = { pet, gauges: quiz, labels: gaugeLabel };

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
    const [first, second] = strongestTraits(quiz);
    return (
      <OnboardingTemplate
        step={QUIZ.length}
        total={QUIZ.length}
        onBack={back}
        backLabel={t.previous}
        gap={16}
        actions={
          <QuizResultActions
            redoLabel={t.redo}
            onRedo={() => commit([])}
            ctaLabel={t.resultCta}
            onCta={() => router.push(session ? '/(onboarding)/profil' : '/(onboarding)/compte')}
          />
        }
      >
        <QuizPreview {...preview} step={QUIZ.length - 1} />
        <QuizResult
          kicker={t.resultKicker}
          title={t.resultTitle(petName)}
          text={t.resultText(petName, poleOfGauge(first, quiz), poleOfGauge(second, quiz))}
          species={species}
          petLabel={petName}
        />
      </OnboardingTemplate>
    );
  }

  const key = gaugeOf(question.choices[0].delta);
  return (
    <OnboardingTemplate step={index + 1} total={QUIZ.length} stepPending onBack={back} backLabel={index ? t.previous : common.back} scroll={false}>
      <QuizStep
        key={index}
        step={index}
        kicker={t.kicker[key]}
        title={(t.titles[index] ?? t.titles[0])(petName)}
        text={t.text}
        choices={question.choices.map((c, i) => ({ key: String(i), title: c.label, caption: t.caption(poleOf(c.delta)), emoji: c.emoji }))}
        selectedKey={selected === null ? null : String(selected)}
        onChoose={choose}
        preview={preview}
      />
    </OnboardingTemplate>
  );
}
