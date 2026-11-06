/**
 * 52 · Tarifs (V5-Tarifs) · 53 · Blowy+ (V5-Abonnement). V5.4 §C10–C11 : Blowy+ = abonnement aux
 * sorties seulement (9,99 €/mois), payé par Apple Pay / Stripe comme les places ; Duo gratuit pour
 * tous (3 actifs). Le prix affiché vient de l'API (`GET /v1/purchases/products`), jamais du code.
 */
import {
  BodyText,
  Button,
  CardV5,
  CheckLine,
  DetailScreen,
  DisplayText,
  PopIn,
  Row,
  RowGroup,
  v5,
} from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { isUnavailable } from '../../../core/api/errors';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useAllowances, usePlusCancel, usePlusCheckout, useProducts } from '../api/hooks';
import { usePaymentPort } from '../model/use-payment';
import { DemoPaySheet } from './DemoPaySheet';
import { useOutingHistory } from '../../outings';
import { clock } from '../../../core/clock';
import { PaidView } from './ResultScreens';

const eur = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')}\u00A0€`;
const back = (fallback: string) => () =>
  router.canGoBack() ? router.back() : router.replace(fallback as never);

function PriceCard({ title, price, text }: { title: string; price: string; text: string }) {
  return (
    <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <DisplayText size={21} heading={false}>
          {title}
        </DisplayText>
        <DisplayText size={21} heading={false} color={v5.coralText}>
          {price}
        </DisplayText>
      </View>
      <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft}>
        {text}
      </BodyText>
    </CardV5>
  );
}

export function PricingScreen() {
  const products = useProducts();
  const allowances = useAllowances();
  const p = products.data;
  const seat = p ? eur(p.seat.amountCents) : '–';
  const plus = p?.plus.monthlyPriceCents
    ? eur(p.plus.monthlyPriceCents)
    : (p?.plus.priceLabel ?? '–');
  const maxDuos = allowances.data?.duos.maxActive ?? 3;
  return (
    <DetailScreen
      title={t('pricing.title')}
      titleSize={42}
      backLabel={t('common.back')}
      onBack={back(paths.profile)}
      pad={[52, 16, 22]}
      gap={10}
      testID="pricing"
    >
      <PopIn style={{ gap: 8 }}>
        <PriceCard
          title={t('pricing.first')}
          price={t('pricing.offered')}
          text={t('pricing.firstText')}
        />
        <PriceCard title={t('pricing.seat')} price={seat} text={t('pricing.seatText')} />
        <PriceCard
          title={t('pricing.duo')}
          price={t('pricing.free')}
          text={t('pricing.duoText', { n: maxDuos })}
        />
        <PriceCard
          title={t('pricing.plus')}
          price={t('pricing.perMonth', { price: plus })}
          text={t('pricing.plusText')}
        />
      </PopIn>
      <BodyText
        size={12}
        weight={600}
        lh={1.45}
        color={v5.inkSoft}
        style={{ paddingHorizontal: 4 }}
      >
        {t('pricing.venue')}
      </BodyText>
      <BodyText size={12} weight={700} style={{ paddingHorizontal: 4 }}>
        {t('pricing.never')}
      </BodyText>
      <View style={{ marginTop: 'auto' }}>
        <Button
          variant="b2"
          label={t('pricing.seePlus')}
          icon="arrow"
          iconPosition="trailing"
          onPress={() => router.push(paths.plus)}
        />
      </View>
    </DetailScreen>
  );
}

export function PlusScreen() {
  const products = useProducts();
  const allowances = useAllowances();
  const checkout = usePlusCheckout();
  const cancelPlus = usePlusCancel();
  const port = usePaymentPort();
  const [sheet, setSheet] = useState<{
    clientSecret: string;
    provider: 'STRIPE' | 'LOCAL_DEMO';
  } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const p = products.data;
  const cents = p?.plus.monthlyPriceCents;
  const price = cents ? eur(cents) : (p?.plus.priceLabel ?? '–');
  const active = allowances.data?.plus.active ?? false;
  const breakEven = cents && p ? Math.ceil(cents / p.seat.amountCents) : null;
  const label = t('pay.plusLine');
  const history = useOutingHistory();
  const thisMonth = (history.data?.items ?? []).filter(
    (h) => h.startsAt.slice(0, 7) === new Date(clock.now()).toISOString().slice(0, 7),
  ).length;
  const monthLine = history.data ? t('plus.monthValue', { n: thisMonth }) : '–';

  const finish = async (clientSecret: string, provider: 'STRIPE' | 'LOCAL_DEMO') => {
    if (!port || !cents) return setFailed(t('pay.unavailable'));
    const r = await port.pay({
      provider,
      clientSecret,
      amountCents: cents,
      currency: p?.plus.currency ?? 'EUR',
      label,
      recurring: true,
    });
    setSheet(null);
    if (r.status === 'PAID') router.replace(paths.plusOk);
    else if (r.status === 'FAILED')
      setFailed(r.reason === 'DECLINED' ? t('pay.declinedPlus') : t('pay.unavailable'));
  };
  const subscribe = () => {
    setFailed(null);
    checkout.mutate(undefined, {
      onSuccess: (r) => {
        if ('checkoutUrl' in r) return setFailed(t('pay.unavailable'));
        if (r.provider === 'LOCAL_DEMO')
          setSheet({ clientSecret: r.clientSecret, provider: r.provider });
        else void finish(r.clientSecret, r.provider);
      },
      onError: (e) => setFailed(isUnavailable(e) ? t('pay.plusNotYet') : t('pay.unavailable')),
    });
  };

  return (
    <DetailScreen
      title={t('plus.title')}
      titleSize={42}
      backLabel={t('common.back')}
      onBack={back(paths.settings)}
      pad={[52, 16, 22]}
      gap={12}
      testID="plus"
      overlay={
        sheet ? (
          <DemoPaySheet
            title={t('pay.plusTitle')}
            sub={t('pay.plusSub')}
            total={price}
            note={t('pay.plusNote')}
            busy={checkout.isPending}
            onCancel={() => setSheet(null)}
            onPay={() => void finish(sheet.clientSecret, sheet.provider)}
          />
        ) : undefined
      }
    >
      <PopIn
        style={{
          backgroundImage: 'linear-gradient(135deg, #2E1065, #4C1D95 70%)',
          borderRadius: 24,
          padding: 18,
          gap: 12,
          boxShadow: [
            { offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: '#1A0838' },
          ],
        }}
      >
        <DisplayText size={40} color={v5.white}>
          {`${price} `}
          <DisplayText size={20} color={v5.white} heading={false}>
            {t('plus.perMonth')}
          </DisplayText>
        </DisplayText>
        <CheckLine
          text={t('plus.allOutings')}
          color={v5.white}
          checkColor={v5.lime}
          size={16}
          checkSize={18}
          gap={10}
        />
        <BodyText size={13} weight={600} lh={1.45} color="#E3DBFF">
          {t('plus.noCommitment')}
        </BodyText>
      </PopIn>
      <RowGroup>
        <Row
          first
          label={t('plus.status')}
          value={active ? t('plus.active') : t('plus.free')}
          valueColor={v5.ink}
        />
        <Row label={t('plus.month')} value={monthLine} />
        {breakEven ? (
          <Row label={t('plus.breakEven')} value={t('plus.breakEvenValue', { n: breakEven })} />
        ) : null}
      </RowGroup>
      <BodyText size={12} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('plus.fair')}
      </BodyText>
      {failed ? (
        <BodyText
          size={13}
          weight={700}
          lh={1.45}
          color={v5.danger}
          accessibilityLiveRegion="polite"
        >
          {failed}
        </BodyText>
      ) : null}
      <View style={{ marginTop: 'auto', gap: 14 }}>
        {active ? (
          <Button
            variant="b3"
            label={cancelPlus.isSuccess ? t('plus.cancelled') : t('plus.cancel')}
            disabled={cancelPlus.isSuccess}
            loading={cancelPlus.isPending}
            onPress={() => cancelPlus.mutate()}
            testID="plus-cancel"
          />
        ) : (
          <Button
            variant="b1"
            disabled={!port}
            label={t('plus.subscribe')}
            loading={checkout.isPending}
            onPress={subscribe}
            testID="plus-subscribe"
          />
        )}
        <BodyText size={12} weight={600} color={v5.inkSoft} align="center">
          {port ? t('plus.footer', { price }) : t('pay.unavailable')}
        </BodyText>
      </View>
    </DetailScreen>
  );
}

export function PlusOkScreen() {
  const products = useProducts();
  const port = usePaymentPort();
  const cents = products.data?.plus.monthlyPriceCents;
  return (
    <PaidView
      title={t('plus.okTitle')}
      text={t('plus.okText')}
      rows={[
        {
          label: t('plus.okRow'),
          value: cents ? t('pricing.perMonth', { price: eur(cents) }) : '–',
        },
        { label: t('pay.okWith'), value: port?.applePay ? t('pay.applePay') : t('pay.cardWord') },
        { label: t('pay.okReceipt'), value: t('pay.okReceiptValue') },
        { label: t('plus.okCancel'), value: t('plus.okCancelValue') },
      ]}
      cta={t('pay.home')}
      onCta={() => router.replace(paths.home)}
    />
  );
}
