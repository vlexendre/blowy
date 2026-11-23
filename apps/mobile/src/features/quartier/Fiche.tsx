/**
 * La fiche d'une personne du quartier : la même pour une épingle de la carte et pour une ligne de la liste. Qui,
 * pourquoi (jamais un pourcentage seul), où vous en êtes, et une action (« Saluer », « En attente », « Répondre »).
 */
import { MapPinCard, MatchWhy } from '@blowy/ui';
import { useRouter } from 'expo-router';

import { useWave, whyA11y } from '@/features/encounters';
import { useMarkWaved } from '@/features/map';
import { openPlus } from '@/features/plus';
import { common } from '@/locales/common';
import { carte as t, rencontres as listText } from '@/locales/rencontres';
import { ui } from '@/locales/ui';

import { canWave, type Neighbor } from './people';

export function NeighborFiche({
  person,
  plus,
  wave,
  waveBlock,
  onClose,
}: {
  person: Neighbor;
  plus: boolean;
  wave: ReturnType<typeof useWave>;
  /** Trop de coucous aujourd'hui : « Saluer » désactivé, la fiche dit pourquoi. */
  waveBlock: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const markWaved = useMarkWaved();
  const p = person;
  const allowed = canWave(p, plus);
  return (
    <MapPinCard
      motionKey={p.id}
      pet={p.user.pet}
      owner={t.owner(p.user.displayName)}
      compat={ui.closeness(p.compatibility)}
      compatLabel={t.compat}
      why={
        <MatchWhy
          commonTitle={p.explanation.commonTitle}
          common={p.explanation.common.map((c) => c.name)}
          exploreTitle={p.explanation.exploreTitle}
          explore={p.explanation.explore.name}
          accessibilityLabel={whyA11y(p.explanation, listText.whyJoin)}
        />
      }
      actionLabel={p.relation === 'waved' ? t.waved : p.relation === 'waved_you' ? t.wavedYou(p.user.displayName) : t.wave(p.user.pet.name)}
      actionLoading={wave.isPending && wave.variables === p.id}
      actionDone={p.relation === 'waved'}
      actionDisabled={allowed && p.relation === 'none' && !!waveBlock}
      actionNote={allowed && p.relation === 'none' ? (waveBlock ?? undefined) : undefined}
      onClose={onClose}
      closeLabel={common.close}
      onAction={() => {
        if (p.relation === 'waved') return;
        if (p.relation === 'waved_you') return router.push(`/rencontre/${p.id}`);
        // Une épingle qui n'est pas présentée aujourd'hui : saluer depuis la carte, c'est Minimoa+.
        if (!allowed) return openPlus('map');
        wave.mutate(p.id, { onSuccess: () => markWaved(p.id) });
      }}
      secondaryLabel={p.presented || p.relation === 'waved_you' ? t.open : undefined}
      onSecondary={() => router.push(`/rencontre/${p.id}`)}
    />
  );
}
