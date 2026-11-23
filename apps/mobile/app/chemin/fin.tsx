/**
 * Fin de séance, un seul écran (V6-GFin, docs/ADA-2027.md item 1) : la série en une ligne, puis « Ta personne du jour »
 * en premier bloc (son minimoa, « Vous deux : », une amorce) avec un seul bouton jaune, « Dire bonjour » (le même geste
 * que dans les rencontres, optimiste) ; « Ce que Nino a appris » dessous. Sans personne : un message calme, sans vente,
 * et l'action utile s'il y en a une. Aux paliers 7, 30, 100, 365 jours seulement : la fête plein écran (`StreakTier`,
 * moins de 3 s, coupée d'un tap), une fois par séance. Les objets gagnés attendent l'accueil.
 */
import { Button, CheminEmptyCard, EmptyState, PersonOfDayCard, RevelationCard, ScreenTemplate, Stack, StreakRise, StreakTier } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { trackChemin } from '@/features/analytics';
import { milestoneToCelebrate, useCheminResults, useHelloFromChemin } from '@/features/chemin';
import { isWaveLimit, useShareInvite, useWaveBlock } from '@/features/encounters';
import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { celebration } from '@/locales/celebration';
import { chemin } from '@/locales/chemin';
import { chats } from '@/locales/chats';
import { rencontres } from '@/locales/rencontres';

const t = chemin.fin;
const tier = celebration.tier;

export default function Fin() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const entry = useCheminResults((s) => (id ? s.results[id] : undefined));
  const pet = usePet();
  const hello = useHelloFromChemin(id ?? null);
  const waveBlock = useWaveBlock(hello.wave.error);
  const invite = useShareInvite(rencontres.shareMessage);
  // Palier à fêter : décidé une fois à l'arrivée (revenir sur cet écran ne rejoue pas la fête).
  const [milestone, setMilestone] = useState(() => (entry && !entry.celebrated ? milestoneToCelebrate(entry.result) : null));
  // Minimoa animé : il applaudit à l'arrivée.
  const [cheerKey, setCheerKey] = useState(0);
  const shown = useRef(false);
  const home = () => router.dismissTo('/(tabs)/pet');

  const result = entry?.result;
  const person = result?.person ?? null;
  useEffect(() => {
    if (!result || shown.current) return;
    shown.current = true;
    if (person) trackChemin('Person Of Day Shown', { unit: entry?.unitTitle ?? null });
    setCheerKey((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);
  const endTier = () => {
    if (id) useCheminResults.getState().markCelebrated(id);
    setMilestone(null);
  };

  const species = pet.data?.pet.species ?? 'nino';
  if (!result) {
    // Résultat perdu (app relancée) : la séance est enregistrée côté serveur ; l'accueil montre la suite.
    return (
      <ScreenMotion>
        <ScreenTemplate>
          <Stack top={48}>
            <EmptyState peek species={species} mood="joie" title={chemin.home.doneKicker} text={t.missing} actionLabel={chemin.seance.backHome} onAction={home} />
          </Stack>
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
  const celebrating = milestone !== null;

  return (
    <ScreenMotion>
      <ScreenTemplate
        footer={
          <Stack gap={4}>
            <Button label={t.tomorrow} variant="glass" onPress={home} />
            {bonusLeft ? <Button label={t.bonusNow} variant="link" onPress={() => router.replace('/chemin/seance')} /> : null}
          </Stack>
        }
      >
        <Stack top={8} gap={14}>
          <StreakRise count={s.current} from={entry.streakBefore} unit={t.streakUnit(s.current)} accessibilityLabel={t.streakA11y(s.current)} />

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
              onHello={() => hello.send(person.suggestion.user.id, entry.unitTitle)}
              focusTitle={!celebrating}
            />
          ) : (
            <CheminEmptyCard
              title={t.emptyTitle}
              text={empty?.text ?? ''}
              species={species}
              actionLabel={emptyAction?.label ?? null}
              onAction={emptyAction?.run}
              focusTitle={!celebrating}
            />
          )}

          <RevelationCard
            tone="quiet"
            kicker={result.revelation.title}
            title={result.revelation.text}
            species={species}
            mascot={entry.mascot}
            mascotMoment="cheer"
            mascotKey={cheerKey}
            name={pet.data?.pet.name}
          />
        </Stack>
      </ScreenTemplate>
      <StreakTier
        visible={celebrating}
        species={species}
        count={milestone ?? s.current}
        unit={tier.unit(milestone ?? s.current)}
        line={tier.lines[(milestone ?? 0) % tier.lines.length] ?? null}
        tapLabel={t.tap}
        accessibilityLabel={tier.a11y(milestone ?? s.current)}
        onDone={endTier}
      />
    </ScreenMotion>
  );
}
