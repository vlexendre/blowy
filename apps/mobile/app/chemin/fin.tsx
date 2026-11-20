/**
 * Fin de séance (V6-GFin, docs/CHEMIN.md) : la série qui monte (flamme), « Ce que Nino a appris », puis « Ta personne
 * du jour » (son minimoa, « Vous deux : », une amorce) avec « Dire bonjour » (le même geste que dans les rencontres,
 * optimiste) et « Voir sur la carte » ; sinon l'état vide honnête du serveur et l'action utile. Objets gagnés et
 * palier : fêtés brièvement (`UnlockCelebration`, confettis), coupés d'un tap.
 */
import { Banner, Button, CheminEmptyCard, EmptyState, namedMotion, PersonOfDayCard, RevelationCard, ScreenTemplate, Stack, StreakRise } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ScreenMotion } from '@/core';
import { trackChemin } from '@/features/analytics';
import { useCheminResults, useHelloFromChemin } from '@/features/chemin';
import { isWaveLimit, useShareInvite, useWaveBlock } from '@/features/encounters';
import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { chemin } from '@/locales/chemin';
import { chats } from '@/locales/chats';
import { rencontres } from '@/locales/rencontres';

const t = chemin.fin;

export default function Fin() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const entry = useCheminResults((s) => (id ? s.results[id] : undefined));
  const pet = usePet();
  const hello = useHelloFromChemin(id ?? null);
  const waveBlock = useWaveBlock(hello.wave.error);
  const invite = useShareInvite(rencontres.shareMessage);
  const [party, setParty] = useState(0);
  // Minimoa animé : il applaudit à l'arrivée.
  const [cheerKey, setCheerKey] = useState(0);
  const [milestoneShown, setMilestoneShown] = useState(true);
  const shown = useRef(false);
  const home = () => router.dismissTo('/(tabs)/pet');

  const result = entry?.result;
  const person = result?.person ?? null;
  useEffect(() => {
    if (!result || shown.current) return;
    shown.current = true;
    if (person) trackChemin('Person Of Day Shown', { unit: entry?.unitTitle ?? null });
    setCheerKey((n) => n + 1);
    // Scène de fin nommée par le serveur (confettis…) ; un nom inconnu : rien (repli neutre).
    if (namedMotion(entry?.endScene).burst && !result.alreadyRecorded) setParty((n) => n + 1);
    // Palier de série : confettis brefs (moins de 3 s), coupés d'un tap.
    if (result.milestone) {
      setParty((n) => n + 1);
      const timer = setTimeout(() => setMilestoneShown(false), 2600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const species = pet.data?.pet.species ?? 'nino';
  if (!result) {
    // Résultat perdu (app relancée) : la séance est enregistrée côté serveur ; l'accueil montre la suite.
    return (
      <ScreenMotion>
        <ScreenTemplate>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState peek species={species} mood="joie" title={chemin.home.doneKicker} text={t.missing} actionLabel={chemin.seance.backHome} onAction={home} />
          </View>
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const s = result.streak;
  const bonusLeft = result.quota.nextSlot === 1;
  const waved = person?.suggestion.waved ?? false;
  const empty = result.empty;
  const emptyAction =
    empty?.reason === 'first_here'
      ? { label: invite.copied ? chats.copied : t.invite, run: () => void invite.share() }
      : empty?.reason === 'no_location'
        ? { label: t.location, run: () => router.push('/moi/position') }
        : null;

  return (
    <ScreenMotion>
      <ScreenTemplate
        footer={
          <Stack gap={8}>
            {result.quota.bonusHint && !bonusLeft ? <Banner tone="info" text={result.quota.bonusHint} /> : null}
            {bonusLeft ? <Button label={t.bonusNow} onPress={() => router.replace('/chemin/seance')} /> : null}
            <Button label={t.tomorrow} variant={bonusLeft ? 'ghost' : 'glass'} onPress={home} />
          </Stack>
        }
      >
        <Stack top={8} gap={14}>
          <StreakRise
            count={s.current}
            from={s.current}
            unit={t.streakUnit(s.current)}
            accessibilityLabel={t.streakA11y(s.current)}
            celebrate={party}
            badge={result.milestone && milestoneShown ? { label: t.milestone(result.milestone), onPress: () => setMilestoneShown(false), accessibilityLabel: t.tap } : null}
          />

          <RevelationCard
            kicker={result.revelation.title}
            title={result.revelation.text}
            species={species}
            mascot={entry?.mascot ?? null}
            mascotMoment="cheer"
            mascotKey={cheerKey}
            name={pet.data?.pet.name}
          />

          {person ? (
            <PersonOfDayCard
              kicker={person.title}
              person={{ name: person.suggestion.user.displayName, pet: person.suggestion.user.pet, face: person.suggestion.user.face, avatarUrl: person.suggestion.user.avatarUrl }}
              line={person.line}
              togetherTitle={person.together.title}
              points={person.together.points}
              opener={person.opener.text ? t.opener(person.opener.text) : null}
              helloLabel={waved ? t.helloDone : t.hello}
              helloDone={waved}
              helloLoading={hello.wave.isPending}
              helloDisabled={!!waveBlock && !waved}
              helloNote={waveBlock ?? (hello.wave.isError && !isWaveLimit(hello.wave.error) ? errorText(hello.wave.error, rencontres.actionError) : null)}
              onHello={() => hello.send(person.suggestion.user.id, entry?.unitTitle ?? null)}
              secondaryLabel={t.seeMap}
              onSecondary={() => router.push('/carte')}
            />
          ) : empty ? (
            <CheminEmptyCard
              title={empty.title}
              text={empty.text}
              species={species}
              actionLabel={emptyAction?.label ?? null}
              onAction={emptyAction?.run}
            />
          ) : null}
        </Stack>
      </ScreenTemplate>
      <UnlockCelebration />
    </ScreenMotion>
  );
}
