/**
 * Accueil (V6-GAccueil, docs/ADA-2027.md item 6) : une seule action, l'étape du jour. En haut, le panneau du minimoa
 * (`HomePanel` : nom, puce d'humeur, « Garde-robe », 4 soins, « Le réveiller » quand il dort), la puce de série et la
 * bulle du minimoa (`StreakLine`), puis la carte de l'état du moment (`homeState` : séance, faite, membre, repos,
 * bonjour, sieste) et le chemin (`homeSteps`), dans une seule liste virtualisée (`HomeTemplate`). Rien d'autre n'y
 * vend ni n'y relance ; un objet gagné s'y fête (`UnlockCelebration`, une feuille à la fois). `blowy://chemin` ouvre
 * la séance s'il y en a une à faire (`?chemin=1`).
 */
import { ApiError } from '@blowy/api-client';
import { SESSION_SIZE, currentUnitTitle, hasSessionToDo, useCheminMap, useCheminResults } from '@/features/chemin';
import { Banner, type CheminStep, HomeTemplate, PetHomeSkeleton, PetRefresh, Skeleton, StreakLine } from '@blowy/ui';
import { useFocusEffect, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { HomeNowCard, HomePanel, homeState, homeSteps, useHomeHello, usePetPlay } from '@/features/home';
import { errorText } from '@/features/links';
import { usePushIntroOnce, usePushPermission } from '@/features/notifications';
import { useLivePet, usePetSleep, useUnlocks } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { accueil as t } from '@/locales/accueil';

export default function PetHome() {
  const router = useRouter();
  const pet = useLivePet();
  const chemin = useCheminMap();
  const last = useCheminResults((x) => (x.last ? x.results[x.last] : undefined));
  const lastId = useCheminResults((x) => x.last);
  const params = useLocalSearchParams<{ chemin?: string }>();
  const focused = useIsFocused();
  const p = pet.data?.pet;
  // Sommeil : jamais les premières 24 h ni la nuit ; le jour, il s'endort au repos (état `sieste`).
  const sleep = usePetSleep(p?.bornAt);
  const [asleep, setAsleep] = useState(false);
  const hello = useHomeHello();
  const play = usePetPlay({ petId: p?.id, needs: p?.needs, night: sleep.night && !sleep.firstDay, focused, hello: t.hello });
  const unlocksWaiting = useUnlocks((s) => s.queue.length > 0);
  const push = usePushPermission();
  const [refreshing, setRefreshing] = useState(false);

  // Relue à chaque retour sur l'accueil (une séance vient peut-être de finir ailleurs).
  const { refetch: refetchChemin } = chemin;
  useFocusEffect(
    useCallback(() => {
      void refetchChemin();
    }, [refetchChemin]),
  );

  // `blowy://chemin` (rappel du matin) : l'accueil, puis la séance du jour s'il y en a une à faire (une fois).
  const opened = useRef(false);
  useEffect(() => {
    if (!params.chemin || opened.current || !chemin.data) return;
    opened.current = true;
    router.setParams({ chemin: undefined });
    if (hasSessionToDo(chemin.data)) router.push('/chemin/seance');
  }, [params.chemin, chemin.data, router]);

  // Notifications : l'écran d'avant-demande monte une fois, au premier passage calme (aucune fête en cours).
  usePushIntroOnce(push.permission, focused && !!p && !!chemin.data && !unlocksWaiting);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([pet.refetch(), chemin.refetch()]);
    setRefreshing(false);
  };

  if (!p) {
    return (
      <ScreenMotion>
        <HomeTemplate
          header={
            pet.isPending ? (
              <PetHomeSkeleton />
            ) : (
              <Banner tone="error" title={t.loadError} text={pet.error?.message ?? ''} actionLabel={t.retry} onAction={() => void pet.refetch()} />
            )
          }
          steps={[]}
          startLabel={t.start}
        />
      </ScreenMotion>
    );
  }

  const cm = chemin.data;
  const state = homeState({ today: cm?.today.state ?? null, plus: !!cm?.plus, asleep, hello: !!hello, shape: p.shape });
  const progress = last?.result.progress;
  const path = cm ? homeSteps(cm, progress?.stepDone ? progress.stepId : undefined) : { firstIndex: 0, steps: [] };
  const steps: CheminStep[] = path.steps.map((s) => ({ key: s.key, kind: s.kind, accessibilityLabel: t.step[s.kind](s.number) }));
  const streak = cm && cm.streak.current > 0 ? cm.streak.current : null;
  const bubble = play.said ?? (state.bubble === 'sleep' ? t.sleepLine : state.bubble === 'rest' ? t.restLine : null);
  const openSeance = () => router.push('/chemin/seance');
  const toQuartier = () => router.navigate('/(tabs)/quartier');
  const careError = play.care.isError && !(play.care.error instanceof ApiError && play.care.error.code === 'already_done');

  return (
    <ScreenMotion>
      <PetRefresh species={p.species} refreshing={refreshing} onRefresh={() => void refresh()}>
        {(scroll) => (
          <HomeTemplate
            {...scroll}
            header={
              <>
                <HomePanel
                  pet={p}
                  mood={state.mood}
                  play={play}
                  sleepAfter={sleep.sleepAfter}
                  onSleepChange={setAsleep}
                  onWardrobe={() => router.push('/pet/garde-robe')}
                />
                <StreakLine
                  streak={streak ? { label: t.streak(streak), accessibilityLabel: t.streakA11y(streak), onPress: () => router.push('/pet/serie') } : null}
                  bubble={bubble}
                />
                <HomeNowCard
                  card={state.card}
                  unitTitle={cm ? currentUnitTitle(cm) : ''}
                  questions={SESSION_SIZE}
                  hello={hello}
                  // La fin de séance gardée en mémoire ; après un redémarrage, les présentés du jour sont dans Quartier.
                  onReview={() => (lastId ? router.push({ pathname: '/chemin/fin', params: { id: lastId } }) : toQuartier())}
                  onNext={openSeance}
                  onHello={toQuartier}
                />
                {careError ? <Banner tone="error" text={errorText(play.care.error, t.careError)} onClose={() => play.care.reset()} /> : null}
              </>
            }
            steps={steps}
            firstIndex={path.firstIndex}
            startLabel={t.start}
            onStart={state.now === 'seance' ? openSeance : undefined}
            footer={
              cm ? undefined : chemin.isError ? (
                <Banner tone="info" text={t.pathError} actionLabel={t.retry} onAction={() => void chemin.refetch()} />
              ) : (
                <Skeleton height={220} radius="lg" />
              )
            }
          />
        )}
      </PetRefresh>
      {/* Un objet gagné se fête ici, une feuille à la fois (V6-Debloque). */}
      <UnlockCelebration />
    </ScreenMotion>
  );
}
