/**
 * Test de vision (V6-GVision) : 12 situations servies par l'API, une par écran, posées par le minimoa. Deux grandes cartes
 * (on en touche une : elle s'incline et part, la suivante arrive), le minimoa qui regarde les réponses, et sous les cartes
 * la barre de l'axe visé, qui bouge dès le toucher. Les réponses sont gardées dans le brouillon (retour, reprise).
 */
import type { VisionAxis } from '@blowy/domain';
import { EmptyState, OnboardingTemplate, PetImage, QuizStep, ScreenTemplate, Skeleton, VisionMeter } from '@blowy/ui';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { ScreenMotion } from '@/core';
import {
  axisOfQuestion,
  choiceDirection,
  lowerFirst,
  progressAt,
  useDraft,
  useDraftGate,
  useStep,
  useVisionTest,
  VISION_EMOJI,
  visionNow,
} from '@/features/onboarding';
import { goBack } from '@/features/session';
import { chemin } from '@/locales/chemin';
import { common } from '@/locales/common';
import { onboarding, visionLabels } from '@/locales/onboarding';

const t = onboarding.vision;
type Pick = 0 | 1;

export default function Vision() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <VisionTest />;
}

function VisionTest() {
  useStep('vision');
  const test = useVisionTest();
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName) || common.speciesNames[species];
  const answers = useDraft((d) => d.visionAnswers);
  const questions = test.data?.questions ?? [];
  // Reprise : la première situation sans réponse (toutes répondues : la dernière).
  const [index, setIndex] = useState(() => {
    const done = new Set(useDraft.getState().visionAnswers.map((a) => a.questionId));
    return done.size;
  });
  const [selected, setSelected] = useState<Pick | null>(null);
  const [reactKey, setReactKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { height } = useWindowDimensions();
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  // Revenu de « ta vision » : la dernière carte n'est plus choisie, on peut changer d'avis.
  useFocusEffect(useCallback(() => setSelected(null), []));

  if (test.isError) {
    return (
      <ScreenMotion>
        <ScreenTemplate scroll={false}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState peek species={species} mood="triste" title={t.loadErrorTitle} text={t.loadErrorText} actionLabel={common.retry} onAction={() => void test.refetch()} />
          </View>
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const total = questions.length || 12;
  const i = Math.min(index, total - 1);
  const q = questions[i];
  const axis: VisionAxis = q ? axisOfQuestion(q.id) : 'foyer';
  const axisText = visionLabels.axes[axis];
  const value = visionNow(answers)[axis].value;
  const picked = selected !== null && q ? choiceDirection(q.id, selected) : null;
  const pole = picked === null ? null : lowerFirst(picked > 0 ? axisText.high : axisText.low);

  const choose = (key: string) => {
    if (selected !== null || !q) return;
    const p: Pick = key === '1' ? 1 : 0;
    setSelected(p);
    setReactKey((n) => n + 1);
    // La barre bouge tout de suite : la réponse est gardée dès le toucher.
    useDraft.getState().answer({ questionId: q.id, choice: p });
    timer.current = setTimeout(() => {
      if (i + 1 < total) {
        setIndex(i + 1);
        setSelected(null);
      } else {
        router.push('/(onboarding)/ta-vision');
      }
    }, 420);
  };

  const back = () => {
    if (timer.current) clearTimeout(timer.current);
    setSelected(null);
    if (i === 0) goBack('/(onboarding)/craft');
    else setIndex(i - 1);
  };

  const emoji = q ? VISION_EMOJI[q.id] : undefined;
  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('vision', i)}
        onBack={back}
        backLabel={i ? t.previous : common.back}
        gap={0}
        // Le test, présenté comme la première étape de Ton chemin (il vaut l'unité 1 côté serveur, docs/CHEMIN.md).
        kicker={chemin.onboarding.visionKicker(total)}
        host={{ species, line: q?.situation ?? '…', reactKey, seed: petName, name: petName }}
      >
        {q ? (
          <QuizStep
            step={i}
            look="plain"
            choices={q.choices.map((c, k) => ({ key: String(k), title: c, emoji: emoji?.[k] }))}
            selectedKey={selected === null ? null : String(selected)}
            onChoose={choose}
            hint={i === 0 ? t.hint : undefined}
            nudgeKey={i === 0 ? 'onboarding:vision' : undefined}
            peek={height >= 760 ? <PetImage species={species} mood={selected === null ? 'surpris' : 'joie'} size={132} animation="breathe" /> : undefined}
            below={
              <VisionMeter
                title={t.meterTitle(axisText.name)}
                value={value}
                low={axisText.low}
                high={axisText.high}
                sticker={pole ? t.sticker(pole) : null}
                stickerKey={reactKey}
                accessibilityLabel={t.meterA11y(axisText.name, value < -19 ? axisText.low : value > 19 ? axisText.high : onboarding.taVision.between)}
              />
            }
          />
        ) : (
          <View style={{ marginTop: 'auto', gap: 12 }} accessibilityLabel={common.loading}>
            <Skeleton height={104} radius="lg" />
            <Skeleton height={104} radius="lg" />
            <Skeleton height={96} radius="lg" />
          </View>
        )}
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
