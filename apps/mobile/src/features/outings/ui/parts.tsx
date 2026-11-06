/**
 * Gabarit unique V5.5 de la sortie (comme côté maquette : Trouvée, Sortie et Confirmation sont
 * générées par les mêmes fonctions pour Paris, Lyon et Saint-Denis). Chaque bloc est un organisme
 * de @blowy/ui-mobile alimenté par les présentateurs de `model/presenters`.
 */
import type { OutingView } from '@blowy/api-contract';
import type { Species } from '@blowy/domain';
import {
  ActionCards,
  CardV5,
  GroupBlock,
  OutingHero,
  PopIn,
  RulesDisclosure,
  TimelineLine,
  DisplayText,
  type GroupSlot,
} from '@blowy/ui-mobile';
import { t, tDynamic } from '../../../i18n';
import { router } from 'expo-router';
import { paths } from '../../../core/navigation/paths';
import { useMyNeighborhood } from '../../account';
import { useCancelSeat } from '../api/hooks';
import { petSprite } from '../../pets';
import {
  compositionLine,
  groupSlots,
  headline,
  milestones,
  schedule,
  type GroupSlotModel,
} from '../model/presenters';
import { v5 } from '@blowy/ui-mobile';

export function toStripSlots(
  slots: readonly GroupSlotModel[],
  tileFor: (s: GroupSlotModel) => string,
): GroupSlot[] {
  return slots.map((s) => ({
    key: s.key,
    sprite: s.kind === 'unknown' || !s.species ? null : petSprite(s.species),
    label: s.label,
    strong: s.kind !== 'unknown',
    background: tileFor(s),
    accessibilityLabel: s.kind === 'unknown' ? t('outing.group.unknownA11y') : s.label,
  }));
}

export const slotTile = (s: GroupSlotModel): string => (s.kind === 'me' ? v5.lime : v5.peach);

/** Trajet « ≈ 8 min depuis Paris 11e » (V5.6 E11) : seulement si l'API connaît le trajet — jamais inventé. */
export const travelLine = (o: OutingView, home?: string): string | null => {
  const minutes = o.venue?.travelMinutes;
  if (!minutes) return null;
  return home
    ? t('outing.travelFrom', { minutes: String(minutes), home: home.replace('-', '\u2011') })
    : t('outing.travel', { minutes: String(minutes) });
};

/** Même ligne, avec MON quartier (jamais celui de la sortie). */
export function useTravelLine(o: OutingView): string | null {
  const hood = useMyNeighborhood();
  return travelLine(o, hood.data?.neighborhood?.name);
}

/** Bloc « Ton groupe » (cases 46 px, composition V5.5, règle d'équilibre). */
export function OutingGroup({
  o,
  species,
  variant,
  bare,
}: {
  o: OutingView;
  species: Species;
  variant: 'found' | 'detail';
  bare?: boolean;
}) {
  const slots = toStripSlots(
    groupSlots(variant === 'found' ? { ...o, members: [] } : o, species, {
      me: t('outing.group.me'),
      unknown: t('outing.group.unknown'),
    }),
    slotTile,
  );
  const block = (
    <GroupBlock
      label={t('outing.group.label')}
      slots={slots}
      composition={compositionLine(o, variant)}
      rule={t('outing.group.rule')}
      tile={46}
      sprite={39}
      radius={14}
    />
  );
  return bare ? block : <CardV5 style={{ padding: 14 }}>{block}</CardV5>;
}

/** Carte encre : jour, heures, activité · lieu, trajet, frise des 3 jalons. */
export function OutingHeroV55({ o, delayMs = 40 }: { o: OutingView; delayMs?: number }) {
  const h = headline(o, tDynamic(`activity.${o.activity}`));
  const travel = useTravelLine(o);
  return (
    <PopIn delayMs={delayMs}>
      <OutingHero
        day={h.day}
        hours={h.hours}
        line={h.line}
        note={o.activityChosenBy === 'VENUE_AND_GROUP' ? t('outing.chosenByVenue') : undefined}
        travel={travel}
        milestones={milestones(o, {
          lock: t('outing.ms.lock'),
          faces: t('outing.ms.faces'),
          outing: t('outing.ms.outing'),
        })}
      />
    </PopIn>
  );
}

/** « Comment ça se passe » (arrivée, pendant, départ). */
export function HowItGoes({ o }: { o: OutingView }) {
  return (
    <CardV5 style={{ padding: 14, gap: 10 }}>
      <DisplayText size={20} heading={false}>
        {t('outing.how.title')}
      </DisplayText>
      <TimelineLine
        when={headline(o, '').hours.split(' – ')[0] ?? ''}
        text={t('outing.how.arrive')}
      />
      <TimelineLine when={t('outing.how.duringWhen')} text={t('outing.how.during')} />
      <TimelineLine when={t('outing.how.leaveWhen')} text={t('outing.how.leave')} />
    </CardV5>
  );
}

/** Règle d'annulation unique (V5.5 : imprévu 1 fois par mois), repliée derrière un lien. */
export function CancelRules({
  o,
  summary = t('outing.rulesSummary'),
}: {
  o: OutingView;
  summary?: string;
}) {
  return <RulesDisclosure summary={summary} text={t('outing.rules', { lock: schedule(o).lock })} />;
}

/**
 * « Si tu ne viens plus » (tour 9) : sécurité (toujours, remboursée), « je connais quelqu'un ici »
 * (si disponible), imprévu (1 fois par mois ; repli CANT_MAKE_IT quand il n'en reste plus).
 */
export function NotComingCards({ o }: { o: OutingView }) {
  const cancel = useCancelSeat(o.id);
  const home = () => router.replace(paths.home);
  const emergencyLeft = o.mySeat.cancelPreview?.emergencyAvailable !== false;
  return (
    <ActionCards
      label={t('notComing.label')}
      items={[
        {
          key: 'safety',
          danger: true,
          title: t('notComing.safety'),
          sub: t('notComing.safetySub'),
          onPress: () => cancel.mutate('SAFETY', { onSuccess: home }),
        },
        ...(o.knowsSomeoneAvailable
          ? [
              {
                key: 'knows',
                title: t('notComing.knows'),
                sub: t('notComing.knowsSub'),
                onPress: () =>
                  router.push({
                    pathname: paths.report,
                    params: { outing: o.id, knows: '1' },
                  } as never),
              },
            ]
          : []),
        {
          key: 'emergency',
          title: t('notComing.emergency'),
          sub: t('notComing.emergencySub'),
          onPress: () =>
            cancel.mutate(emergencyLeft ? 'EMERGENCY' : 'CANT_MAKE_IT', { onSuccess: home }),
        },
      ]}
    />
  );
}
