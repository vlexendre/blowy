/**
 * 49 · Paiement de la place (V5-Paiement) · 50 · payé · 51 · refusé. Le montant vient du serveur
 * (intention créée par `POST /v1/outings/:id/seat/accept { funding: PAY }`) ; l'app présente la
 * feuille Stripe (Apple Pay) ou, en local seulement, la feuille de démonstration.
 * Le secret client reste en mémoire (payments › pending), jamais dans l'URL.
 */
import type { OutingView } from '@blowy/api-contract';
import { BodyText, CardV5, DetailScreen, DisplayText, v5 } from '@blowy/ui-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { clock } from '../../../core/clock';
import { civil, dayLong, dayShort, dayShortTime, timeLabel } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { t, tDynamic } from '../../../i18n';
import {
  clearPendingPayment,
  DemoPaySheet,
  PaidView,
  PayFailedView,
  peekPendingPayment,
  setPendingPayment,
  usePaymentPort,
  useProducts,
  type PaymentRequest,
} from '../../payments';
import { LoadingScreen, UnavailableNote } from '../../system';
import { outingKeys, useAcceptSeat, useOuting } from '../api/hooks';
import { euros, placeHint, schedule, weekdayLabel } from '../model/presenters';

/** Ligne Apple Pay de la place : « jeu. 19 nov. 19 h 30 · Bloc d'escalade ». */
export const seatLine = (o: Pick<OutingView, 'startsAt' | 'activity'>) =>
  `${dayShortTime(o.startsAt)} · ${tDynamic(`activity.${o.activity}`)}`;

/** Requête de paiement à partir de la réponse d'acceptation (le serveur fixe le montant). */
export function seatPaymentRequest(
  o: Pick<OutingView, 'startsAt' | 'activity'>,
  p: {
    provider: 'STRIPE' | 'LOCAL_DEMO';
    clientSecret: string;
    amountCents: number;
    currency: string;
  },
): PaymentRequest {
  return { ...p, label: `${t('pay.seatTitle')} · ${seatLine(o)}`, recurring: false };
}

function useOutingId() {
  return useLocalSearchParams<{ id: string }>().id;
}

export function PayScreen() {
  const id = useOutingId();
  const outing = useOuting(id);
  const accept = useAcceptSeat(id);
  const port = usePaymentPort();
  const qc = useQueryClient();
  const [req, setReq] = useState<PaymentRequest | null>(() => peekPendingPayment(id) ?? null);
  const [busy, setBusy] = useState(false);
  const asked = useRef(false);
  const o = outing.data;

  useEffect(() => {
    if (!o || req || asked.current) return;
    asked.current = true;
    accept.mutate('PAY', {
      onSuccess: (r) => {
        if (!r.payment) return router.replace(paths.outingStep(id, 'pay-ok'));
        const next = seatPaymentRequest(o, r.payment);
        setPendingPayment(id, next);
        setReq(next);
      },
    });
  }, [o, req, accept, id]);

  const run = async (r: PaymentRequest) => {
    if (!port) return;
    setBusy(true);
    const out = await port.pay(r);
    setBusy(false);
    if (out.status === 'PAID') {
      clearPendingPayment(id);
      void qc.invalidateQueries({ queryKey: outingKeys.outing(id) });
      router.replace(paths.outingStep(id, 'pay-ok'));
    } else if (out.status === 'CANCELED') {
      if (router.canGoBack()) router.back();
      else router.replace(paths.outing(id));
    } else {
      router.replace({
        pathname: paths.outingStep(id, 'pay-failed'),
        params: { reason: out.reason },
      } as never);
    }
  };

  // Stripe : la feuille système s'ouvre dès que l'intention est prête.
  useEffect(() => {
    if (req && port?.kind === 'STRIPE' && req.provider === 'STRIPE' && !busy) void run(req);
  }, [req, port]);

  if (outing.isLoading || !o) return <LoadingScreen />;
  const demoSheet = req && req.provider === 'LOCAL_DEMO' && port?.kind === 'LOCAL_DEMO';
  return (
    <DetailScreen
      title={`${weekdayLabel(o.startsAt).toUpperCase()} ${civil(o.startsAt).day}`}
      titleSize={38}
      backLabel={t('common.back')}
      onBack={() => (router.canGoBack() ? router.back() : router.replace(paths.outing(id)))}
      pad={[52, 18, 22]}
      gap={10}
      testID="pay"
      overlay={
        demoSheet ? (
          <DemoPaySheet
            title={t('pay.seatTitle')}
            sub={seatLine(o)}
            total={euros(req.amountCents)}
            note={t('pay.seatNote')}
            busy={busy}
            onCancel={() => (router.canGoBack() ? router.back() : router.replace(paths.outing(id)))}
            onPay={() => void run(req)}
          />
        ) : undefined
      }
    >
      <CardV5 style={{ padding: 14, gap: 6 }}>
        <BodyText size={13} weight={800} color={v5.coralText}>
          {dayLong(o.startsAt, undefined, true)}
        </BodyText>
        <DisplayText size={28} heading={false}>
          {`${timeLabel(o.startsAt)} · ${tDynamic(`activity.${o.activity}`)}`}
        </DisplayText>
        <BodyText size={13} weight={600} color={v5.inkSoft}>
          {placeHint(o)}
        </BodyText>
      </CardV5>
      {!port ? <UnavailableNote what={t('pay.seatTitle')} /> : null}
      {accept.isError ? (
        <BodyText size={13} weight={700} color={v5.danger} accessibilityLiveRegion="polite">
          {t('pay.unavailable')}
        </BodyText>
      ) : null}
    </DetailScreen>
  );
}

export function PayOkScreen() {
  const id = useOutingId();
  const outing = useOuting(id);
  const products = useProducts();
  const port = usePaymentPort();
  const o = outing.data;
  if (!o) return <LoadingScreen />;
  const day = dayShort(o.startsAt);
  const price = products.data ? euros(products.data.seat.amountCents) : '–';
  return (
    <PaidView
      text={t('pay.okText', { day, lock: schedule(o).lock })}
      rows={[
        { label: t('pay.okSeat', { day }), value: price },
        { label: t('pay.okWith'), value: port?.applePay ? t('pay.applePay') : t('pay.cardWord') },
        { label: t('pay.okReceipt'), value: t('pay.okReceiptValue') },
        { label: t('pay.okIfNot'), value: t('pay.okIfNotValue') },
      ]}
      cta={t('pay.home')}
      onCta={() => router.replace(paths.home)}
    />
  );
}

export function PayFailedScreen() {
  const id = useOutingId();
  const outing = useOuting(id);
  const products = useProducts();
  const o = outing.data;
  if (!o) return <LoadingScreen />;
  const price = products.data ? euros(products.data.seat.amountCents) : '';
  const hold = o.mySeat.holdExpiresAt
    ? Math.max(0, Math.round((Date.parse(o.mySeat.holdExpiresAt) - clock.now()) / 60000))
    : null;
  const text = hold
    ? t('pay.failedText', { price, day: dayShort(o.startsAt), min: hold })
    : t('pay.failedTextNoHold', { price, day: dayShort(o.startsAt) });
  return (
    <PayFailedView
      text={text}
      onBack={() => router.replace(paths.pay(id))}
      onRetry={() => router.replace(paths.pay(id))}
      onOtherCard={() => router.replace(paths.pay(id))}
      onSkip={() => router.replace(paths.home)}
    />
  );
}
