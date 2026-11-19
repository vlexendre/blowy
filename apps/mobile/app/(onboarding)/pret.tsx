/**
 * Tout est prêt (après la préparation) : le minimoa, vivant, saute de joie dans des confettis (le premier « waouh ») ;
 * la promesse en une phrase ; un seul bouton, puis l'accueil. Ton chemin (V1, V6-Pret, V6-GApercu) : s'il a déjà
 * quelqu'un à présenter aujourd'hui, l'écran devient « Nino a quelqu'un pour toi » : la personne (« Vous deux : »,
 * « Dire bonjour », le même geste que les rencontres), et les autres présentés du jour en aperçu flouté, avec un point
 * commun. Personne : l'écran d'avant. Minimoa+ n'est plus proposé ici (docs/DESIR.md).
 */
import { color } from '@blowy/tokens';
import { Button, PersonOfDayCard, PreviewPeople, ReadyHero, ScreenTemplate, Stack, StageTemplate, Text } from '@blowy/ui';
import { Redirect, router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { useEncounters, useWave, useWaveBlock } from '@/features/encounters';
import { useMe } from '@/features/me';
import { chemin } from '@/locales/chemin';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.pret;
const c = chemin.onboarding;

export default function Pret() {
  const me = useMe();
  const encounters = useEncounters();
  const wave = useWave();
  const waveBlock = useWaveBlock(wave.error);
  const pet = me.data?.pet ?? { name: 'nino', species: 'nino' as const };
  const name = me.data?.displayName ?? '';
  const home = () => router.replace('/(tabs)/pet');
  // Ouvert sans compte prêt (lien direct, rechargement déconnecté) : l'aiguillage décide.
  if (me.isError) return <Redirect href="/" />;

  const suggestions = encounters.data?.suggestions ?? [];
  const first = suggestions[0];
  if (me.data && first) {
    const others = suggestions.slice(1, 3);
    return (
      <ScreenMotion>
        <ScreenTemplate footer={<Button label={first.waved ? t.cta : c.later} variant={first.waved ? 'accent' : 'ghost'} onPress={home} />}>
          <Stack top={24} gap={14}>
            <Text variant="label" color={color.accent} center>
              {c.personKicker}
            </Text>
            <Text variant="h1" size={44} center>
              {c.personTitleFor(pet.name)}
            </Text>
            <PersonOfDayCard
              kicker={pet.name}
              person={{ name: first.user.displayName, pet: first.user.pet, face: first.user.face, avatarUrl: first.user.avatarUrl }}
              line={first.intro}
              togetherTitle={chemin.carte.together}
              points={first.explanation.common.map((x) => x.name)}
              helloLabel={first.waved ? chemin.fin.helloDone : chemin.fin.hello}
              helloDone={first.waved}
              helloLoading={wave.isPending}
              helloDisabled={!!waveBlock && !first.waved}
              helloNote={waveBlock}
              onHello={() => wave.mutate(first.user.id)}
            />
            {others.length > 0 ? (
              <PreviewPeople
                people={others.map((s) => ({
                  key: s.user.id,
                  pet: s.user.pet,
                  face: 'hidden' as const,
                  common: c.together(s.explanation.common[0]?.name ?? ''),
                  accessibilityLabel: c.together(s.explanation.common[0]?.name ?? ''),
                }))}
                note={c.previewNote}
              />
            ) : null}
          </Stack>
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  return (
    <ScreenMotion>
      <StageTemplate align="center" footer={<Button label={t.cta} iconRight="arrow" onPress={home} />}>
        {me.data ? <ReadyHero species={pet.species} title={t.title(name)} text={t.text(pet.name)} seed={me.data.pet.id} petLabel={pet.name} /> : null}
      </StageTemplate>
    </ScreenMotion>
  );
}
