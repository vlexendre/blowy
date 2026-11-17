/** « Tu es… » : une carte par réponse (pastille ronde : on en choisit une), toucher choisit et passe à la suite. */
import type { Gender } from '@blowy/contract';
import { GENDERS } from '@blowy/domain';
import { Appear, ChoiceCard, OnboardingTemplate, Text } from '@blowy/ui';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { progressAt, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.sexe;

export default function Sexe() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <SexeStep />;
}

function SexeStep() {
  useStep('sexe');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const name = useDraft((d) => d.displayName.trim());
  const gender = useDraft((d) => d.gender);
  const [reactKey, setReactKey] = useState(0);
  const leaving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  useFocusEffect(useCallback(() => void (leaving.current = false), []));

  const choose = (g: Gender) => {
    if (leaving.current) return;
    leaving.current = true;
    useDraft.getState().set({ gender: g });
    setReactKey((n) => n + 1);
    // La carte s'incline, le minimoa réagit, puis la question suivante (rien n'attend la fin de l'animation).
    timer.current = setTimeout(() => router.push('/(onboarding)/habitudes'), 360);
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('sexe')}
        onBack={() => goBack('/(onboarding)/prenom')}
        backLabel={common.back}
        host={{ species, line: t.host(name), highlight: name, reactKey, seed: petName, name: petName }}
        gap={12}
      >
        {GENDERS.map((g, i) => (
          <Appear key={g} delay={60 + i * 60} distance={18} from="right">
            <ChoiceCard
              title={t.options[g]}
              compact
              plain
              marker
              selected={gender === g}
              tilt={i % 2 ? 2 : -2}
              onPress={() => choose(g)}
            />
          </Appear>
        ))}
        <Text size={13} muted center>
          {t.note}
        </Text>
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
