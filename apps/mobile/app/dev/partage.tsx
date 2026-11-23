/** Les cartes à partager au format story (docs/VIRALITE.md), en grand, pour les vérifier à l'œil (dev seulement). */
import { ScreenTemplate, ShareCard, Stack } from '@blowy/ui';

import { croissance as t } from '@/locales/croissance';

const pet = { name: 'Nino', species: 'nino' as const, outfit: { head: 'bonnet', toy: 'parrain' } };

export default function SharePreview() {
  return (
    <ScreenTemplate>
      <Stack direction="row" gap={16}>
        <ShareCard
          brand={t.brand}
          kicker={t.words.card.kicker}
          title={t.words.card.title}
          words={['DRÔLE', 'SOLAIRE', 'CURIEUX']}
          pet={pet}
          callout={t.words.card.callout}
          url="minimoa.app/m/K7P2XQ9M"
        />
        <ShareCard
          brand={t.brand}
          title={t.moments.streak.title}
          big={{ value: '30', unit: t.moments.streak.unit(30) }}
          pet={{ ...pet, outfit: { head: 'couronne' } }}
          callout={t.moments.streak.callout}
          url="minimoa.app/i/LEA7K2PQ"
          gradient="orange"
        />
        <ShareCard
          brand={t.brand}
          kicker={t.moments.vision.kicker}
          title="SPONTANÉ ET VOYAGEUR"
          pet={{ name: 'Suzie', species: 'suzie' }}
          callout={t.moments.vision.callout}
          url="minimoa.app"
          gradient="rose"
        />
      </Stack>
    </ScreenTemplate>
  );
}
