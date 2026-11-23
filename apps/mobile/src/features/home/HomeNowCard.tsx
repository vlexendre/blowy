import type { FaceVisibility } from '@blowy/domain';
import { HelloRow, type PetLook, RestCard, SessionBanner, SessionDoneCard } from '@blowy/ui';

import { accueil as t } from '@/locales/accueil';

import type { HomeCard } from './logic';

/**
 * La carte de l'état du moment (V6-GAccueil, sous la ligne de série, au-dessus du chemin) : le bandeau de la séance,
 * la carte « Séance du jour faite » (membre : « Continuer avec l’étape suivante »), « À demain », ou un bonjour reçu.
 * Une seule à la fois ; aucune ne vend rien.
 */
export function HomeNowCard({
  card,
  unitTitle,
  questions,
  hello,
  onReview,
  onNext,
  onHello,
}: {
  card: HomeCard | null;
  /** Le titre réel de l'univers du jour (« Ta façon de vivre »). */
  unitTitle: string;
  questions: number;
  hello: { name: string; pet: PetLook; face: FaceVisibility; avatarUrl: string | null; more: number } | null;
  onReview: () => void;
  onNext: () => void;
  onHello: () => void;
}) {
  switch (card) {
    case 'seance':
      return <SessionBanner kicker={t.sessionKicker(questions)} title={unitTitle} note={t.sessionNote} />;
    case 'faite':
    case 'membre':
      return (
        <SessionDoneCard
          status={t.done.status}
          title={t.done.title}
          text={t.done.text}
          links={[
            { label: t.done.review, onPress: onReview },
            ...(card === 'membre' ? [{ label: t.done.next, onPress: onNext }] : []),
          ]}
        />
      );
    case 'repos':
      return <RestCard title={t.restTitle} />;
    case 'bonjour': {
      if (!hello) return null;
      const text = t.helloFrom(hello.name, hello.more);
      return <HelloRow text={text} person={hello} onPress={onHello} accessibilityLabel={t.helloA11y(text)} />;
    }
    default:
      return null;
  }
}
