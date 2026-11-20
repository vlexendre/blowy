/**
 * Séance réussie (maquette V7 « Célébration ») : le minimoa rit, trois tuiles (étincelles, série, temps), « Récupérer ».
 * Si la série vient de monter, on passe par le palier de série ; sinon directement à la suite (`/chemin/fin`).
 */
import { SPARKS } from '@blowy/domain';
import { ScreenTemplate, SessionCelebration } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { ScreenMotion } from '@/core';
import { useCheminResults } from '@/features/chemin';
import { usePet } from '@/features/pet';
import { celebration as t } from '@/locales/celebration';

export default function Bravo() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const entry = useCheminResults((s) => (id ? s.results[id] : undefined));
  const pet = usePet();
  const next = () => {
    const rose = !!entry && entry.result.streak.current > entry.streakBefore;
    router.replace({ pathname: rose ? '/chemin/palier' : '/chemin/fin', params: { id: id ?? '' } });
  };
  // Résultat perdu (app relancée) : on passe à la suite.
  useEffect(() => {
    if (!entry) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);
  if (!entry) return null;
  const answers = entry.answers;
  const seed = [...(id ?? '')].reduce((n, c) => n + c.charCodeAt(0), 0);
  // Étincelles du serveur (vitesse et cohérence) ; une réponse d'un serveur plus ancien : 10, sans détail.
  const sp = entry.result.sparks;
  const seconds = sp?.seconds ?? entry.seconds;
  const tiles = [
    { key: 'sparks', label: t.tiles.sparks, value: t.sparks(sp?.total ?? SPARKS.session), tone: 'accent' as const },
    sp && sp.checked > 0
      ? { key: 'coherence', label: t.tiles.coherence, value: t.coherence(sp.coherent, sp.checked), tone: 'lime' as const }
      : { key: 'streak', label: t.tiles.streak, value: String(entry.result.streak.current), tone: 'lime' as const },
    ...(seconds !== null ? [{ key: 'time', label: t.tiles.time, value: t.time(seconds), tone: 'sky' as const }] : []),
  ];
  return (
    <ScreenMotion>
      <ScreenTemplate>
        <SessionCelebration
          species={pet.data?.pet.species ?? 'nino'}
          title={t.titles[seed % t.titles.length] ?? ''}
          text={t.text(pet.data?.pet.name ?? '', answers)}
          tiles={tiles}
          ctaLabel={t.cta}
          onCta={next}
        />
      </ScreenTemplate>
    </ScreenMotion>
  );
}
