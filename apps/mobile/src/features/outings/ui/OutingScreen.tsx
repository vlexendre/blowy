/**
 * 12 · Fiche de sortie (V5-Sortie, avant « Je viens ») et 17 · « Tu y vas » (V5-Sortie-inscrit,
 * place confirmée avant la veille 18 h). La route `/outing/:id` aiguille ensuite selon la phase :
 * confirmation (J-1 18 h), visages (J −3 h), check-in, souvenir, annulée.
 */
import type { OutingView } from '@blowy/api-contract';
import type { Species } from '@blowy/domain';
import { BodyText, Button, IconAction, IconBadge, PopIn, Row, RowGroup, Sprite, StatusBanner, v5 } from '@blowy/ui-mobile';
import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { isNetworkError } from '../../../core/api/errors';
import { useNow } from '../../../core/clock';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useMe } from '../../account';
import { useConversations } from '../../conversations';
import { setPendingPayment, useAllowances, useProducts } from '../../payments';
import { seatPaymentRequest } from './PayScreens';
import { petSprite, useMyPet } from '../../pets';
import { LoadingScreen, OfflineScreen } from '../../system';
import { useAcceptSeat, useCancelSeat, useDeclineSeat, useOuting } from '../api/hooks';
import { euros, fundingKind, outingPhase, schedule, teamMates } from '../model/presenters';
import { CancelRules, HowItGoes, OutingGroup, OutingHeroV55 } from './parts';
import { timeLabel } from '../../../core/format/dates';
import { DetailScreen } from '@blowy/ui-mobile';

const ACCESSORY: Record<string, string> = { GAMES: 'accessories/ball.webp', CLIMBING: 'accessories/backpack.webp', WORKSHOP: 'accessories/mug.webp', BRUNCH: 'accessories/mug.webp', DRINK_COFFEE: 'accessories/mug.webp', EXHIBITION: 'accessories/book.webp' };
export const activityAccessory = (a: string): string | null => ACCESSORY[a] ?? null;

export function OutingScreen({ id }: { id: string }) {
  const q = useOuting(id);
  const pet = useMyPet();
  const now = useNow();
  if (q.isLoading) return <LoadingScreen />;
  if (isNetworkError(q.error) || !q.data) return <OfflineScreen onRetry={() => void q.refetch()} />;
  const o = q.data;
  const phase = outingPhase(o, now);
  const species: Species = pet.data?.species ?? 'NINO';
  switch (phase) {
    case 'invited':
      return <ProposalView o={o} species={species} />;
    case 'going':
      return <GoingView o={o} />;
    case 'confirmed':
      return <Redirect href={paths.outingStep(o.id, 'confirmation')} />;
    case 'faces':
      return <Redirect href={paths.outingStep(o.id, 'faces')} />;
    case 'checkin':
      return <Redirect href={paths.outingStep(o.id, 'checkin')} />;
    case 'checkedIn':
      return <Redirect href={paths.outingStep(o.id, 'checked-in')} />;
    case 'done':
      return <Redirect href={paths.outingStep(o.id, 'memory')} />;
    case 'cancelled':
      return <Redirect href={paths.outingStep(o.id, 'cancelled')} />;
    case 'declined':
      return <Redirect href={paths.home} />;
  }
}

function headerProps(o: OutingView) {
  return {
    title: t('outing.title'),
    titleSize: 38,
    backLabel: t('common.back'),
    onBack: () => (router.canGoBack() ? router.back() : router.replace(paths.home)),
    action: <IconAction glyph="dots" label={t('outing.menuA11y')} shadow={v5.shadowCream} onPress={() => router.push({ pathname: paths.report, params: { outing: o.id } } as never)} />,
  };
}

function TeamRow({ o }: { o: OutingView }) {
  const mates = teamMates(o);
  const first = mates[0];
  return (
    <Row
      wrap
      label={first ? t('outing.teamComesV55', { name: mates.map((m) => m.firstName).join(' et ') }) : t('outing.teamInvite')}
      value={first && o.preview ? t('outing.teamFresh', { n: Math.max(0, o.preview.size - 1 - mates.length) }) : undefined}
      leading={
        first ? (
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: v5.peach, alignItems: 'center', justifyContent: 'center' }}>
            <Sprite path={petSprite(first.pet.species)} size={22} />
          </View>
        ) : (
          <IconBadge glyph="plus" background={v5.peach} color={v5.coralText} glyphSize={16} />
        )
      }
      chevron
      onPress={() => router.push(paths.outingStep(o.id, 'team'))}
    />
  );
}

function ProposalView({ o, species }: { o: OutingView; species: Species }) {
  const allowances = useAllowances();
  const products = useProducts();
  const accept = useAcceptSeat(o.id);
  const decline = useDeclineSeat(o.id);
  const me = useMe();
  const price = products.data ? euros(products.data.seat.amountCents) : null;
  const free = fundingKind(o, allowances.data?.firstOutingFree) === 'free';
  const onAccept = () =>
    accept.mutate(free ? 'AUTO' : 'PAY', {
      onSuccess: (r) => {
        if (r.payment) {
          setPendingPayment(o.id, seatPaymentRequest(o, r.payment));
          return router.push(paths.pay(o.id));
        }
        const verified = me.data?.verification.status === 'VERIFIED';
        router.replace(verified ? paths.outing(o.id) : paths.verify);
      },
    });
  return (
    <DetailScreen {...headerProps(o)} pad={[52, 16, 22]} testID="outing-proposal" scroll>
      <OutingHeroV55 o={o} />
      <PopIn delayMs={80}>
        <OutingGroup o={o} species={species} variant="detail" />
      </PopIn>
      <PopIn delayMs={100}>
        <HowItGoes o={o} />
      </PopIn>
      {teamMates(o).length ? (
        <PopIn delayMs={120}>
          <RowGroup>
            <TeamRow o={o} />
          </RowGroup>
        </PopIn>
      ) : null}
      <CancelRules o={o} />
      <View style={{ marginTop: 4, gap: 12 }}>
        <Button variant="b1" label={t('outing.acceptV55')} icon="arrow" iconPosition="trailing" loading={accept.isPending} onPress={onAccept} testID="outing-accept" />
        <BodyText size={13} weight={800} align="center">
          {free ? t('outing.priceFree', { price: price ?? '' }) : t('outing.pricePaid', { price: price ?? '' })}
        </BodyText>
        <Button variant="ghost" tint={v5.inkSoft} label={t('outing.decline')} onPress={() => decline.mutate(undefined, { onSuccess: () => router.replace(paths.home) })} />
      </View>
    </DetailScreen>
  );
}

function GoingView({ o }: { o: OutingView }) {
  const s = schedule(o);
  const cancel = useCancelSeat(o.id);
  const convs = useConversations();
  const conv = convs.data?.items.find((c) => c.id === o.conversationId);
  const unread = conv ? Math.max(0, conv.lastSeq - conv.lastReadSeq) : 0;
  return (
    <DetailScreen {...headerProps(o)} pad={[52, 16, 22]} testID="outing-going">
      <PopIn>
        <StatusBanner title={t('outing.going.title')} sub={t('outing.going.sub', { lock: s.lock })} />
      </PopIn>
      <OutingHeroV55 o={o} />
      <PopIn delayMs={80}>
        <RowGroup>
          <Row first label={t('outing.guardian')} value={t('outing.optional')} valueColor={v5.coralText} valueWeight={800} leading={<IconBadge glyph="shield" background={v5.violetLight} color={v5.violet} glyphSize={16} />} chevron onPress={() => router.push(paths.outingStep(o.id, 'guardian'))} />
          <TeamRow o={o} />
          <Row
            label={t('outing.groupChat')}
            value={unread ? t('outing.messages', { n: unread }) : undefined}
            leading={<IconBadge glyph="chatSolid" background={v5.violetLight} color={v5.violet} glyphSize={16} />}
            chevron
            onPress={() => o.conversationId && router.push(paths.chat(o.conversationId))}
          />
        </RowGroup>
      </PopIn>
      <View style={{ marginTop: 'auto', gap: 10 }}>
        <Button variant="b2" label={t('outing.addCalendar')} onPress={() => router.replace(paths.home)} />
        <BodyText size={12} weight={600} color={v5.inkSoft} align="center">
          {t('outing.calendarTitle', { time: timeLabel(o.startsAt) })}
        </BodyText>
        <Button variant="ghost" tint={v5.inkSoft} label={t('outing.cancelFreeV55', { lock: s.lock })} loading={cancel.isPending} onPress={() => cancel.mutate('CANT_MAKE_IT', { onSuccess: () => router.replace(paths.home) })} />
      </View>
    </DetailScreen>
  );
}
