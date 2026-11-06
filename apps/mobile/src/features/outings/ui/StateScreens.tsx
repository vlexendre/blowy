/**
 * 22 · Il manque N personnes (V5-Attente, écart réel `nextOutingGap`) · 23 · Sortie d'amorçage
 * (V5-Amorcage, V5-Amorcage-solo) · 24 · Pas de place cette fois (V5-Sortie-complete)
 * · 25 · Sortie annulée (V5-Sortie-annulee). Jamais de seuil abstrait ni de position.
 */
import type { OutingView } from '@blowy/api-contract';
import { BodyText, Button, CardV5, CheckLine, DetailScreen, DisplayText, Glyph, Pill, PopIn, Row, RowGroup, SectionLabel, Sprite, TabScreen, Tap, v5 } from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { dayLong, dayShort, dayShortTime, timeLabel, timeRange, weekdayName } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { useTabs } from '../../../core/navigation/tabs';
import { t, tDynamic } from '../../../i18n';
import { useCityInsights, useMyNeighborhood, useOutingPreferences } from '../../account';
import { useAllowances } from '../../payments';
import { LoadingScreen } from '../../system';
import { useAcceptSeat, useDeclineSeat, useOuting, useWeek } from '../api/hooks';
import { ageSpan, gendersLine, headline, placeHint, schedule, teamMates } from '../model/presenters';
import { activityAccessory } from './OutingScreen';

function PauseLink() {
  return (
    <Tap onPress={() => router.push(paths.pause)} accessibilityLabel={t('home.pause')} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: v5.white, flexDirection: 'row', alignItems: 'center', gap: 8, boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
      <Glyph name="pause" size={14} />
      <BodyText size={14} weight={800}>
        {t('home.pause')}
      </BodyText>
    </Tap>
  );
}

function ActionCard({ icon, title, sub, onPress }: { icon: React.ReactNode; title: string; sub: string; onPress: () => void }) {
  return (
    <CardV5 onPress={onPress} accessibilityLabel={title} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <BodyText size={15} weight={800}>
          {title}
        </BodyText>
        <BodyText size={12} weight={600} color={v5.inkSoft}>
          {sub}
        </BodyText>
      </View>
      <Glyph name="chevron" size={14} />
    </CardV5>
  );
}

export function WaitlistScreen() {
  const nav = useTabs('home');
  const hood = useMyNeighborhood();
  const insights = useCityInsights();
  const prefs = useOutingPreferences();
  const week = useWeek();
  if (hood.isLoading) return <LoadingScreen />;
  const n = hood.data?.neighborhood;
  const w = hood.data?.waitlist;
  const gap = w?.nextOutingGap;
  const city = n?.name ?? '';
  const bracket = insights.data?.ageBrackets.find((b) => !('notEnough' in b));
  const [a, b] = bracket ? bracket.bracket.split('_') : [];
  const kicker = bracket && 'label' in bracket ? t('waitlist.insight', { city, label: bracket.label, a: a ?? '', b: b ?? '' }) : t('waitlist.verified', { city, n: w?.verifiedCount ?? 0 });
  const ages = prefs.data ? `${prefs.data.groupAge.min}–\u2060${prefs.data.groupAge.max}` : '';
  const body = gap
    ? [
        t('waitlist.slot', { weekday: weekdayName(gap.startsAt), hours: timeRange(gap.startsAt, new Date(Date.parse(gap.startsAt) + 2 * 3_600_000).toISOString()) }),
        week.data?.composeAt ? t('waitlist.ifArrive', { by: dayShort(week.data.composeAt), ages }) : '',
        t('waitlist.otherwise', { pet: t('petName.NINO'), day: dayShort(Date.parse(gap.startsAt) + 7 * 86_400_000) }),
      ]
        .filter(Boolean)
        .join(' ')
    : t('waitlist.bodyNoGap');
  return (
    <TabScreen nav={nav} testID="waitlist">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill label={city} background={v5.white} shadow={v5.shadowCream} padding={[7, 12]} leading={<Glyph name="pin" size={12} />} />
        <PauseLink />
      </View>
      <PopIn style={{ marginTop: 14, borderRadius: 26, backgroundColor: v5.ink, padding: 16, gap: 10, boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 0, spreadDistance: 0, color: v5.black }] }}>
        <BodyText size={13} weight={800} color={v5.lime}>
          {kicker}
        </BodyText>
        <DisplayText size={31} color={v5.white}>
          {gap ? t('waitlist.missing', { n: gap.missing, day: dayLong(gap.startsAt).toUpperCase() }) : t('waitlist.noGap')}
        </DisplayText>
        <BodyText size={14} weight={600} lh={1.45} color={v5.sandDeep}>
          {body}
        </BodyText>
      </PopIn>
      <SectionLabel style={{ marginTop: 16 }}>{t('waitlist.helpLabel')}</SectionLabel>
      <View style={{ marginTop: 8 }}>
        <ActionCard icon={<Glyph name="calendar" size={26} />} title={t('waitlist.addSlot')} sub={t('waitlist.addSlotSub')} onPress={() => router.push(paths.onboarding('slots'))} />
      </View>
      <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('waitlist.alsoA')}
        <BodyText size={13} weight={800} style={{ textDecorationLine: 'underline' }} onPress={() => router.push(paths.share('invitation'))} accessibilityRole="link">
          {t('waitlist.alsoInvite')}
        </BodyText>
        {t('waitlist.alsoOr')}
        <BodyText size={13} weight={800} style={{ textDecorationLine: 'underline' }} onPress={() => router.push(paths.share('ville'))} accessibilityRole="link">
          {t('waitlist.alsoShare', { city })}
        </BodyText>
        .
      </BodyText>
    </TabScreen>
  );
}

/** Sortie d'amorçage dans une ville sans quartier ouvert (team de 3 + 2, ou en solo). */
export function SeedingScreen() {
  const { solo } = useLocalSearchParams<{ solo?: string }>();
  const week = useWeek();
  const q = useOuting(week.data?.myOutingId);
  const allowances = useAllowances();
  const accept = useAcceptSeat(q.data?.id ?? '');
  const decline = useDeclineSeat(q.data?.id ?? '');
  if (week.isLoading || q.isLoading) return <LoadingScreen />;
  const o = q.data;
  if (!o) return <WaitlistScreen />;
  const team = teamMates(o);
  const isSolo = solo === '1' || team.length === 0;
  const p = o.preview;
  const city = o.neighborhood.name.split(/[ ·-]/)[0] ?? o.neighborhood.name;
  const free = allowances.data?.firstOutingFree ?? false;
  return (
    <DetailScreen title={isSolo ? t('seeding.soloTitle', { city: city.toUpperCase() }) : t('seeding.title', { city: city.toUpperCase() })} titleSize={34} backLabel={t('common.back')} onBack={() => (router.canGoBack() ? router.back() : router.replace(paths.home))} pad={[52, 16, 22]} testID="seeding">
      <Pill label={isSolo ? t('seeding.oneNotif') : t('seeding.happens')} background={v5.lime} padding={[7, 12]} leading={<Glyph name="check" size={18} color={v5.ink} />} style={{ alignSelf: 'flex-start' }} />
      <DisplayText size={30} style={{ marginTop: 4 }}>
        {isSolo ? t('seeding.soloHeadline') : t('seeding.headline', { n: team.length, city, others: (p?.size ?? 5) - 1 - team.length })}
      </DisplayText>
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft}>
        {isSolo ? t('seeding.soloBody', { weekday: weekdayName(o.startsAt) }) : t('seeding.body', { city })}
      </BodyText>
      <RowGroup>
        <Row first label={t('seeding.when')} value={`${dayShort(o.startsAt)} · ${timeRange(o.startsAt, o.endsAt)}`} valueColor={v5.ink} />
        <Row label={t('seeding.activity')} value={tDynamic(`activity.${o.activity}`)} valueColor={v5.ink} />
        <Row label={t('seeding.place')} value={t('seeding.placeValue', { place: placeHint(o), lock: dayShortTime(o.timeline.lockAt) })} valueColor={v5.ink} />
        {p ? <Row label={t('seeding.group')} value={`${p.size} personnes · ${ageSpan(p.ageMin, p.ageMax)} · ${gendersLine(p.genders)}`} valueColor={v5.ink} /> : null}
      </RowGroup>
      {isSolo ? (
        <BodyText size={12} weight={600} lh={1.45} color={v5.inkSoft} style={{ paddingHorizontal: 4 }}>
          {t('seeding.soloRule')}
        </BodyText>
      ) : (
        <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Glyph name="shield" size={22} color={v5.violet} />
          <BodyText size={13} weight={700} lh={1.4} style={{ flex: 1 }}>
            {t('seeding.teamRule', { others: (p?.size ?? 5) - 1 - team.length, team: team.length + 1 })}
          </BodyText>
        </CardV5>
      )}
      <View style={{ marginTop: 'auto', gap: 4 }}>
        <Button variant="b1" label={free ? t('outing.acceptFree') : t('outing.acceptPaid', { price: '4,99 €' })} icon="arrow" iconPosition="trailing" loading={accept.isPending} onPress={() => accept.mutate('AUTO', { onSuccess: () => router.replace(paths.outing(o.id)) })} />
        {isSolo ? (
          <Button variant="ghost" tint={v5.inkSoft} label={t('seeding.no')} onPress={() => decline.mutate(undefined, { onSuccess: () => router.replace(paths.home) })} />
        ) : (
          <Button variant="ghost" tint={v5.inkSoft} label={t('seeding.seeSolo')} onPress={() => router.push({ pathname: paths.seeding, params: { solo: '1' } } as never)} />
        )}
      </View>
    </DetailScreen>
  );
}

function NextProposal({ next }: { next: OutingView }) {
  const h = headline(next, tDynamic(`activity.${next.activity}`));
  return (
    <CardV5 style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Sprite path={activityAccessory(next.activity)} size={54} />
      <View style={{ gap: 3, flexShrink: 1 }}>
        <BodyText size={13} weight={800} color={v5.coralText}>
          {h.day}
        </BodyText>
        <DisplayText size={24} heading={false}>
          {`${timeLabel(next.startsAt)} · ${tDynamic(`activity.${next.activity}`)}`}
        </DisplayText>
        <BodyText size={12} weight={600} color={v5.inkSoft}>
          {t('later.nextSub', { place: placeHint(next), lock: schedule(next).lock })}
        </BodyText>
      </View>
    </CardV5>
  );
}

function YesNo({ next }: { next: OutingView | undefined }) {
  const accept = useAcceptSeat(next?.id ?? '');
  return (
    <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Button variant="b1" size="sm" label={next ? t('later.yes', { day: String(new Date(next.startsAt).getUTCDate()) }) : t('common.continue')} onPress={() => next && accept.mutate('AUTO', { onSuccess: () => router.replace(paths.outing(next.id)) })} />
      </View>
      <View style={{ flex: 1 }}>
        <Button variant="b3" size="sm" label={t('later.no')} onPress={() => router.replace(paths.home)} />
      </View>
    </View>
  );
}

/** Pas de place cette fois (réponse arrivée après la composition) / sortie annulée : proposition suivante. */
export function OutingLaterScreen({ kind }: { kind: 'full' | 'cancelled' }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const current = useOuting(id);
  const week = useWeek();
  const next = useOuting(week.data?.myOutingId && week.data.myOutingId !== id ? week.data.myOutingId : undefined);
  const allowances = useAllowances();
  if (current.isLoading) return <LoadingScreen />;
  const o = current.data;
  const mates = o ? teamMates(o) : [];
  return (
    <DetailScreen title={t('outing.title')} titleSize={38} backLabel={t('common.back')} onBack={() => router.replace(paths.home)} pad={[52, 18, 22]} testID={`outing-${kind}`}>
      {kind === 'cancelled' && o ? (
        <PopIn>
          <View accessibilityRole="summary" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: v5.rosePale, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Pill label={t('later.cancelledChip')} background={v5.rose} color={v5.white} />
            <BodyText size={13} weight={700}>
              {`${dayLong(o.startsAt, undefined, true)}, ${timeLabel(o.startsAt)}`}
            </BodyText>
          </View>
        </PopIn>
      ) : (
        <Sprite path="nino/young/presentation.webp" size={110} style={{ marginTop: 10 }} />
      )}
      <DisplayText size={kind === 'cancelled' ? 42 : 44} lineHeight={0.92} style={{ marginTop: kind === 'cancelled' ? 6 : 4 }}>
        {kind === 'cancelled' ? t('later.cancelledTitle', { weekday: o ? weekdayName(o.startsAt).toUpperCase() : '' }) : t('later.fullTitle')}
      </DisplayText>
      <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft}>
        {kind === 'cancelled' ? tDynamic(`later.reason.${o?.cancelled?.reason ?? 'OTHER'}`) : t('later.fullBody', { day: o ? dayShort(o.startsAt) : '' })}
      </BodyText>
      {kind === 'cancelled' ? (
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: v5.white, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
          <Glyph name="lock" size={22} color={v5.ink} color2={v5.white} />
          <View style={{ flex: 1, gap: 5 }}>
            <CheckLine text={o?.cancelled?.refund === 'CARD' ? t('later.refundCard') : allowances.data?.firstOutingFree ? t('later.firstStaysFree') : t('later.noCharge')} />
            <CheckLine text={t('later.reliability')} />
            {mates.length ? <CheckLine text={t('later.teamWarned', { name: mates.map((m) => m.firstName).join(' et ') })} /> : null}
          </View>
        </View>
      ) : null}
      <SectionLabel style={{ marginTop: kind === 'cancelled' ? 6 : 8 }}>{kind === 'cancelled' ? t('later.proposeLabel') : t('later.nextLabel')}</SectionLabel>
      {next.data ? <NextProposal next={next.data} /> : <BodyText size={13} weight={600} color={v5.inkSoft}>{t('later.noNext')}</BodyText>}
      {kind === 'full' ? (
        <BodyText size={13} weight={600} color={v5.inkSoft}>
          {t('later.fullNote')}
        </BodyText>
      ) : null}
      <YesNo next={next.data} />
    </DetailScreen>
  );
}
