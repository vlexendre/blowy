/**
 * Test de vision après l'inscription (comptes sans test : `Me.visionTestDone` faux, dont tous les comptes V6) ou pour
 * le repasser : les 12 situations de l'API, une par écran, comme dans l'inscription (mêmes composants, mêmes règles
 * sur le téléphone pour la barre de l'axe), puis `api.vision.retakeTest` et « Ta vision », lue cette fois sur le
 * serveur. Les réponses restent dans l'écran jusqu'à l'envoi : rien n'est gardé si on ferme avant la fin.
 */
import type { VisionAnswer, VisionProfileDto } from '@blowy/contract';
import type { Species, VisionAxis } from '@blowy/domain';
import { Banner, Button, EmptyState, OnboardingTemplate, PetImage, QuizStep, ScreenTemplate, Skeleton, Stack, Text, VisionHero, VisionMeter, VisionReading } from '@blowy/ui';
import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { ScreenMotion } from '@/core';
import { useRetakeVisionTest } from '@/features/encounters';
import { useMe } from '@/features/me';
import { axisOfQuestion, choiceDirection, lowerFirst, surenessOf, useVisionTest, VISION_EMOJI, visionNow } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding, visionLabels } from '@/locales/onboarding';
import { visionTest as vt } from '@/locales/vision-test';

const t = onboarding.vision;
type Pick = 0 | 1;

export default function VisionTestScreen() {
  const me = useMe();
  const test = useVisionTest();
  const retake = useRetakeVisionTest();
  const species = me.data?.pet.species ?? 'nino';
  const petName = me.data?.pet.name ?? common.speciesNames[species];
  const questions = test.data?.questions ?? [];
  const [answers, setAnswers] = useState<VisionAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Pick | null>(null);
  const [reactKey, setReactKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { height } = useWindowDimensions();
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const close = () => goBack('/(tabs)/pet');

  if (retake.data) return <Result profile={retake.data} species={species} petName={petName} count={answers.length} onDone={close} />;

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
  const finished = answers.length >= total && questions.length > 0;

  const choose = (key: string) => {
    if (selected !== null || !q || retake.isPending) return;
    const p: Pick = key === '1' ? 1 : 0;
    setSelected(p);
    setReactKey((n) => n + 1);
    const next = [...answers.filter((a) => a.questionId !== q.id), { questionId: q.id, choice: p }];
    setAnswers(next);
    timer.current = setTimeout(() => {
      if (i + 1 < total) {
        setIndex(i + 1);
        setSelected(null);
      } else {
        retake.mutate(next);
      }
    }, 420);
  };

  const back = () => {
    if (timer.current) clearTimeout(timer.current);
    setSelected(null);
    retake.reset();
    if (i === 0) close();
    else setIndex(i - 1);
  };

  const emoji = q ? VISION_EMOJI[q.id] : undefined;
  return (
    <ScreenMotion>
      <OnboardingTemplate
        progress={(i + 1) / total}
        progressFrom={i / total}
        onBack={back}
        backLabel={i ? t.previous : vt.close}
        gap={0}
        host={{ species, line: retake.isPending ? vt.saving : (q?.situation ?? '…'), note: i === 0 ? t.note : undefined, reactKey, seed: petName, name: petName }}
      >
        {retake.isError && finished ? (
          <Banner tone="error" text={vt.saveError} actionLabel={vt.retry} onAction={() => retake.mutate(answers)} />
        ) : null}
        {q ? (
          <QuizStep
            step={i}
            look="plain"
            choices={q.choices.map((c, k) => ({ key: String(k), title: c, emoji: emoji?.[k] }))}
            selectedKey={selected === null ? null : String(selected)}
            onChoose={choose}
            hint={t.hint}
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

/** « Ta vision, pour l'instant », telle que le serveur l'a enregistrée (barres simples, jamais de chiffre). */
function Result({ profile, species, petName, count, onDone }: { profile: VisionProfileDto; species: Species; petName: string; count: number; onDone: () => void }) {
  const ta = onboarding.taVision;
  const axes = profile.axes.map((a) => {
    const sureness = ta.sureness[surenessOf(a.confidence)];
    return { key: a.axis, name: a.name, sureness, value: a.value, confidence: a.confidence, low: lowerFirst(a.lowLabel), high: lowerFirst(a.highLabel), accessibilityLabel: ta.axisA11y(a.name, a.line, sureness) };
  });
  return (
    <ScreenMotion>
      <OnboardingTemplate
        progress={1}
        progressFrom={1}
        onBack={onDone}
        backLabel={vt.close}
        gap={16}
        actions={
          <Stack gap={14}>
            <Text variant="bodyHeavy" size={18}>
              {ta.promise(petName)}
            </Text>
            <Button label={vt.done} iconRight="arrow" onPress={onDone} />
          </Stack>
        }
      >
        <VisionHero title={vt.resultTitle} chips={ta.chips(count)} species={species} petLabel={petName} />
        <VisionReading axes={axes} note={profile.note} />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
