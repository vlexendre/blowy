/**
 * La carte du défi du jour (V6-GDefi) : modale transparente par-dessus l'accueil. Montée à la première ouverture du
 * jour (`challenge.present`), ou depuis la ligne du défi. « J'y vais » l'accepte puis mène au bon geste : deux réponses
 * (question), l'appareil photo (photo), les chats (écrire), ou dehors (sortir, avec l'activité « de sortie »).
 * Le défi fait, la fête a lieu sur l'accueil (le minimoa et sa mèche).
 */
import type { DailyChallenge } from '@blowy/contract';
import { itemLabel } from '@/locales/content';
import { color } from '@blowy/tokens';
import { Banner, Button, CareIcon, ChallengeStage, ChallengeStagePlaceholder, ChoiceCard, Icon, ItemImage, Loader, type ChallengeReward } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { nextStreakItem, useAcceptChallenge, useAnswerChallenge, useChallengeSeen, useRitualsToday, useVision } from '@/features/rituals';
import { startOuting } from '@/features/widgets';
import { visionLabels } from '@/locales/onboarding';
import { rituels } from '@/locales/rituels';
import { upperFirst } from '@/locales/runtime';

const t = rituels.card;

/** Ce que montre la zone d'action : la proposition, ou le geste du type une fois accepté. */
type Phase = 'offer' | 'act';

const phaseOf = (c: DailyChallenge): Phase => (c.status === 'accepted' ? 'act' : 'offer');

export default function DailyChallengeScreen() {
  const router = useRouter();
  const today = useRitualsToday();
  const pet = usePet();
  const vision = useVision();
  const seen = useChallengeSeen();
  const accept = useAcceptChallenge();
  const answer = useAnswerChallenge();
  const c = today.data?.challenge;
  const [phase, setPhase] = useState<Phase | null>(null);
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const marked = useRef(false);

  // Montrée : elle ne remontera plus aujourd'hui (acceptée ou rangée).
  useEffect(() => {
    if (!c || marked.current) return;
    marked.current = true;
    if (c.status === 'offered') seen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/pet'));
  const p = pet.data?.pet;

  if (!c || !p || !today.data) {
    const failed = today.isError || pet.isError;
    return (
      <ChallengeStagePlaceholder
        onDismiss={close}
        dismissLabel={t.dismissA11y}
        error={failed ? { title: t.loadError, actionLabel: t.retry, onAction: () => void Promise.all([today.refetch(), pet.refetch()]) } : null}
      />
    );
  }

  const streak = today.data.streak;
  const done = c.status === 'done';
  const current = phase ?? phaseOf(c);

  // Ce que le défi rapporte : la série, l'objet du prochain palier, et la vision (question) ou la sociabilité.
  const rewards: ChallengeReward[] = [];
  if (!done) {
    rewards.push({ icon: <Icon name="flamme" size={40} />, title: t.rewardStreak(streak.current + 1), text: t.rewardStreakText });
    const m = nextStreakItem(streak);
    if (m) rewards.push({ icon: <ItemImage id={m.itemId} size={44} />, title: upperFirst(itemLabel[m.itemId] ?? m.itemId), text: t.rewardItemText(m.left) });
    if (c.kind === 'question') {
      // L'axe que la question éclaire, dit par le serveur (`challenge.axis`).
      const axisName = c.axis ? (vision.data?.axes.find((a) => a.axis === c.axis)?.name ?? visionLabels.axes[c.axis].name) : null;
      rewards.push({ icon: <Icon name="etoiles" size={40} />, title: t.rewardVision, text: t.rewardVisionText(axisName) });
    } else {
      rewards.push({ icon: <CareIcon name="door" size={38} color={color.dark} />, title: t.rewardSocial, text: t.rewardSocialText });
    }
  }

  const onAccept = () => {
    accept.mutate(undefined, {
      onSuccess: () => {
        if (c.kind === 'photo') {
          router.replace({ pathname: '/pet/preuve', params: { daily: '1' } });
          return;
        }
        // Sortir : « Nino est de sortie » sur l'écran verrouillé (iOS), le temps de la sortie.
        if (c.kind === 'go_out') void startOuting(p);
        setPhase('act');
      },
    });
  };

  const onAnswer = (choice: 0 | 1) => {
    setPicked(choice);
    // La fête a lieu sur l'accueil : la carte se range dès la réponse enregistrée.
    answer.mutate(choice, { onSuccess: close });
  };

  const actions = (() => {
    if (done) return <Button label={t.close} variant="dark" size="lg" onPress={close} />;
    if (current === 'offer') {
      return (
        <>
          <Button label={t.accept} variant="dark" size="lg" onPress={c.kind === 'question' ? () => setPhase('act') : onAccept} loading={accept.isPending} />
        </>
      );
    }
    switch (c.kind) {
      case 'question':
        return (c.choices ?? []).map((choice, i) => (
          <ChoiceCard
            key={choice}
            title={choice}
            marker
            selected={picked === i}
            faded={picked !== null && picked !== i}
            tilt={i === 0 ? -2 : 2}
            disabled={answer.isPending}
            onPress={() => onAnswer(i === 0 ? 0 : 1)}
          />
        ));
      case 'photo':
        return <Button label={t.goPhoto} variant="dark" size="lg" icon="camera" onPress={() => router.replace({ pathname: '/pet/preuve', params: { daily: '1' } })} />;
      case 'write':
        return (
          <Button
            label={t.goWrite}
            variant="dark"
            size="lg"
            // Une seule action : fermer la modale et revenir sur l'onglet (jamais un second jeu d'onglets par-dessus).
            onPress={() => router.dismissTo('/(tabs)/chats')}
          />
        );
      default:
        return <Button label={t.goOut} variant="dark" size="lg" onPress={close} />;
    }
  })();

  const hint = done ? t.done : current === 'act' ? (c.kind === 'go_out' ? t.goOutHint : c.kind === 'write' ? t.writeHint : c.howTo) : t.note;
  const error = accept.error ?? answer.error;

  return (
    <ChallengeStage
      pet={{ species: p.species, outfit: p.outfit, name: p.name, id: p.id }}
      streak={streak.current}
      kicker={t.kicker(c.day, c.kind === 'question')}
      title={t.title(c.kindLabel)}
      text={c.text}
      rewards={rewards}
      secondary={!done && current === 'offer' ? { label: t.later, onPress: close, accessibilityLabel: t.dismissA11y } : null}
      note={hint}
      onDismiss={close}
      dismissLabel={t.dismissA11y}
      petLabel={p.name}
    >
      {actions}
      {error ? <Banner tone="error" text={errorText(error, t.error)} onClose={() => (accept.reset(), answer.reset())} /> : null}
      {answer.isPending ? <Loader color={color.dark} accessibilityLabel={t.accept} /> : null}
    </ChallengeStage>
  );
}
