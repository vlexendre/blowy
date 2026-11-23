/**
 * La séance du jour (V6-GSeance, docs/CHEMIN.md) : 5 questions posées par le minimoa, en cartes illustrées ou en
 * curseur ; sa réaction à chaque réponse (texte et animation du serveur) ; « Valider », « Passer cette question »
 * (elle revient à la fin : le serveur veut une réponse à chacune). À la fin, toutes les réponses partent en une fois
 * (idempotent), puis la fin de séance (`/chemin/fin`, un seul écran). Tout le contenu vient du serveur.
 */
import { ApiError } from '@blowy/api-client';
import { Banner, Button, EmptyState, type MascotMoment, mascotMomentFor, namedMotion, type PetActorReaction, ScreenTemplate, SeanceBar, SeanceQuestion, Skeleton, Stack } from '@blowy/ui';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ScreenMotion } from '@/core';
import { trackChemin } from '@/features/analytics';
import {
  type AnswerPick,
  answeredCount,
  answerQuestion,
  answersBody,
  canSkip,
  currentQuestionId,
  reactionFor,
  type SeanceProgress,
  seanceDone,
  skipQuestion,
  startSeance,
  useAnswerSeance,
  useCheminSession,
} from '@/features/chemin';
import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { useUnlocks } from '@/features/pet';
import { goBack } from '@/features/session';
import { chemin } from '@/locales/chemin';
import { common } from '@/locales/common';

const t = chemin.seance;

export default function Seance() {
  const query = useCheminSession();
  const pet = usePet();
  const answer = useAnswerSeance();
  const [progress, setProgress] = useState<SeanceProgress | null>(null);
  const [draft, setDraft] = useState<AnswerPick | null>(null);
  const [reactKey, setReactKey] = useState(0);
  const [reactWith, setReactWith] = useState<PetActorReaction | null>(null);
  const started = useRef<string | null>(null);
  const startedAt = useRef<number>(Date.now());
  // Minimoa animé (réglé par l'API) : il réfléchit à chaque question, réagit à chaque réponse.
  const [mascotMoment, setMascotMoment] = useState<MascotMoment | null>(null);
  const [mascotKey, setMascotKey] = useState(0);
  const session = query.data?.session ?? null;
  const mascot = query.data?.mascot ?? null;
  const asked = progress ? currentQuestionId(progress) : null;
  useEffect(() => {
    if (!asked) return;
    setMascotMoment('think');
    setMascotKey((k) => k + 1);
  }, [asked]);
  const close = () => goBack('/(tabs)/pet');

  // Une nouvelle séance : la file des questions, et « Seance Started » une fois.
  useEffect(() => {
    if (!session || started.current === session.id) return;
    started.current = session.id;
    startedAt.current = Date.now();
    setProgress(startSeance(session));
    setDraft(null);
    if (!session.done) trackChemin('Seance Started', { unit: session.step?.unitTitle ?? null, slot: session.slot, review: session.kind === 'review' });
  }, [session]);

  const send = (p: SeanceProgress) => {
    if (!session) return;
    answer.mutate(
      { body: answersBody(session, p), day: session.day, slot: session.slot, unitTitle: session.step?.unitTitle ?? null, endScene: session.endScene.animation, mascot, seconds: Math.round((Date.now() - startedAt.current) / 1000) },
      {
        onSuccess: (res) => {
          if (!res.alreadyRecorded && res.newItems.length > 0) useUnlocks.getState().push(res.newItems);
          // Séance finie : un seul écran, la personne du jour d'abord (la fête d'un palier s'y joue).
          router.replace({ pathname: '/chemin/fin', params: { id: res.sessionId } });
        },
      },
    );
  };

  // Séance déjà finie (rouverte) : le serveur rend le même résultat sans regarder les réponses.
  useEffect(() => {
    if (!session?.done || answer.isPending || answer.isSuccess) return;
    const q = session.questions[0];
    const o = q?.options[0];
    if (!q || !o) return;
    answer.mutate(
      { body: { sessionId: session.id, answers: [{ questionId: q.id, optionId: o.id }] }, day: session.day, slot: session.slot, unitTitle: session.step?.unitTitle ?? null, endScene: session.endScene.animation, mascot },
      { onSuccess: (res) => router.replace({ pathname: '/chemin/fin', params: { id: res.sessionId } }) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.done, session?.id]);

  // ── Chargement, erreur, rien à faire ────────────────────────────────────────
  if (!query.data || !pet.data || (session && !progress)) {
    return (
      <ScreenMotion>
        <ScreenTemplate header={<SeanceBar step={0} total={5} onClose={close} closeLabel={t.close} accessibilityLabel={t.progress(0, 5)} />}>
          {query.isError ? (
            <EmptyState peek species={pet.data?.pet.species ?? 'nino'} mood="triste" title={t.loadErrorTitle} text={t.loadErrorText} actionLabel={t.retry} onAction={() => void query.refetch()} />
          ) : (
            <Stack top={16} gap={12}>
              <Skeleton height={90} radius="lg" />
              <Skeleton height={76} radius="lg" />
              <Skeleton height={76} radius="lg" />
              <Skeleton height={76} radius="lg" />
            </Stack>
          )}
        </ScreenTemplate>
      </ScreenMotion>
    );
  }
  const p = pet.data.pet;
  if (!session || !progress) {
    return (
      <ScreenMotion>
        <ScreenTemplate header={<SeanceBar step={0} total={5} onClose={close} closeLabel={t.close} accessibilityLabel={t.progress(0, 5)} />}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              peek
              species={p.species}
              mood="dodo"
              title={query.data.reason === 'nothing_left' ? t.nothingTitle : t.quotaTitle}
              text={query.data.message ?? query.data.quota.bonusHint ?? ''}
              actionLabel={t.backHome}
              onAction={close}
            />
          </View>
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const total = session.questions.length;
  const done = answeredCount(progress);
  const id = currentQuestionId(progress);
  const q = session.questions.find((x) => x.id === id) ?? session.questions[session.questions.length - 1];
  if (!q) return null;
  const reaction = reactionFor(q, draft ?? undefined);
  const last = done + 1 >= total;

  const pick = (next: AnswerPick) => {
    setDraft(next);
    setReactKey((k) => k + 1);
    const animation = reactionFor(q, next)?.animation;
    setReactWith(namedMotion(animation).reaction ?? 'joy');
    setMascotMoment(mascotMomentFor(animation));
    setMascotKey((k) => k + 1);
  };
  const validate = () => {
    if (!draft || answer.isPending) return;
    const next = answerQuestion(progress, q.id, draft);
    setProgress(next);
    setDraft(null);
    if (seanceDone(next)) send(next);
    else {
      // Transition entre deux questions (nommée par le serveur) : le minimoa la joue, rien n'attend.
      const move = namedMotion(session.transition.animation).reaction;
      if (move) {
        setReactWith(move);
        setReactKey((k) => k + 1);
      }
    }
  };
  const skip = () => {
    setProgress(skipQuestion(progress));
    setDraft(null);
  };
  const sliderValue = draft && 'value' in draft ? draft.value : null;
  const sendFailed = answer.isError && !(answer.error instanceof ApiError && answer.error.code === 'not_found');

  return (
    <ScreenMotion>
      <ScreenTemplate
        header={<SeanceBar step={done} total={total} onClose={close} closeLabel={t.close} accessibilityLabel={t.progress(Math.min(done + 1, total), total)} />}
        footer={
          <Stack gap={4}>
            {sendFailed ? <Banner tone="error" text={errorText(answer.error, t.sendError)} actionLabel={t.retry} onAction={() => send(progress)} /> : null}
            <Button
              label={last ? t.finish : t.validate}
              variant={draft ? 'accent' : 'ghost'}
              disabled={!draft && !seanceDone(progress)}
              loading={answer.isPending}
              accessibilityLabel={answer.isPending ? t.sending : undefined}
              onPress={seanceDone(progress) ? () => send(progress) : validate}
            />
            {canSkip(progress) && !answer.isPending ? <Button label={t.skip} variant="link" accessibilityHint={t.skipNote} onPress={skip} /> : null}
          </Stack>
        }
      >
        <SeanceQuestion
          text={q.text}
          questionKey={q.id}
          pet={{ species: p.species, outfit: p.outfit, name: p.name, id: p.id }}
          format={q.format === 'slider' && q.slider ? 'slider' : 'choice'}
          options={q.options}
          picked={draft && 'optionId' in draft ? draft.optionId : null}
          onPick={(optionId) => pick({ optionId })}
          slider={
            q.slider
              ? {
                  value: sliderValue,
                  start: q.slider.start,
                  onChange: (value) => pick({ value }),
                  accessibilityLabel: t.sliderA11y(q.text),
                  valueText: t.sliderValue,
                }
              : null
          }
          reaction={reaction?.text || null}
          reactKey={reactKey}
          reactWith={reactWith}
          note={done === 0 && !draft ? session.intro : null}
          mascot={mascot}
          mascotMoment={mascotMoment}
          mascotKey={mascotKey}
        />
        {answer.isError && answer.error instanceof ApiError && answer.error.code === 'not_found' ? (
          <Banner tone="info" text={common.errorTitle} actionLabel={t.backHome} onAction={close} />
        ) : null}
      </ScreenTemplate>
    </ScreenMotion>
  );
}
