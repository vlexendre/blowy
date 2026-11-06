/**
 * Activités prépayées (V5.10) : `activityDetail.priceCents` est payé dans l'app avec la place (Blowy+, 1re offerte
 * et parrainage couvrent la place, jamais l'activité), remboursé quand la place l'est, reversé au lieu.
 */
import type { OutingView } from '@blowy/api-contract';
import { hasKey, t, tDynamic } from '../../../i18n';
import { euros } from './presenters';

type WithDetail = Pick<OutingView, 'activityDetail'>;

/** Prix de l'activité à prépayer (null = rien à prépayer, consommation sur place). */
export const activityPriceCents = (o: WithDetail): number | null =>
  o.activityDetail?.priceCents ?? null;

/** Nom court dans les montants : « terrain », « atelier », « bloc » ; sinon « activité ». */
export const activityShort = (o: WithDetail): string => {
  const key = o.activityDetail?.key;
  return key && hasKey(`activityRows.${key}.short`)
    ? tDynamic(`activityRows.${key}.short`)
    : t('activityRows.defaultShort');
};

/** Nom dans les règles : « Foot à 5 », « Atelier », « Bloc ». */
export const activityRuleName = (o: WithDetail): string => {
  const key = o.activityDetail?.key;
  return key && hasKey(`activityRows.${key}.rule`)
    ? tDynamic(`activityRows.${key}.rule`)
    : (o.activityDetail?.label ?? '');
};

/** « Foot à 5 : 9 €, payé dans l'app avec ta place. » */
export function activityPrepaidLine(o: WithDetail): string | null {
  const cents = activityPriceCents(o);
  return cents
    ? t('activityRows.prepaid', { name: activityRuleName(o), price: euros(cents) })
    : null;
}

/** Sous « Je viens » : place (offerte ou payée) + activité. */
export function acceptPriceLine(o: WithDetail, seatCents: number | null, free: boolean): string {
  const act = activityPriceCents(o);
  const seat = seatCents !== null ? euros(seatCents) : '';
  if (!act)
    return free ? t('outing.priceFree', { price: seat }) : t('outing.pricePaid', { price: seat });
  const a = euros(act);
  const short = activityShort(o);
  return free
    ? t('outing.priceFreeActivity', { short, activity: a, price: seat })
    : t('outing.pricePaidActivity', { short, activity: a, price: seat });
}

/** Lignes du récapitulatif de paiement (place si due + activité), à partir des montants du serveur. */
export function paymentLines(
  o: WithDetail,
  amountCents: number,
  activityCents: number | undefined,
): { label: string; cents: number }[] {
  if (!activityCents) return [];
  const seat = amountCents - activityCents;
  return [
    ...(seat > 0 ? [{ label: t('pay.seatLine'), cents: seat }] : []),
    {
      label: t('pay.activityLine', { label: o.activityDetail?.label ?? activityShort(o) }),
      cents: activityCents,
    },
  ];
}
