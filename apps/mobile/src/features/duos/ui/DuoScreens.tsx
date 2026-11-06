/**
 * Voie Duo : 37 · propositions (V5-Duo ; V5.4 §A3 : pet + initiale seulement avant le double oui) · 37b · un 2e duo ?
 * (V5-Duo-choix, 1 duo actif gratuit) · 38 · vous écrivez (V5-Lien) · 38b · les visages à 48 h
 * (V5-Lien-debloque, vocal facultatif) · 39/40b · rendez-vous à deux (V5-RdvDuo, V5-RdvDuo-lea)
 * · 41 · clin d'œil (V5-Oeuf, seulement si les deux) · 42 · partir proprement (V5-Rupture).
 */
import type { DuoLaneProposalView, DuoView } from '@blowy/api-contract';
import { ageBracketOf } from '@blowy/domain';
import {
  BodyText,
  Bubble,
  Button,
  CardV5,
  CheckLine,
  DetailScreen,
  DisplayText,
  FaceCard,
  Glyph,
  IconAction,
  MediaView,
  Pill,
  PopIn,
  SectionLabel,
  Sprite,
  SwitchCard,
  Tap,
  v5,
} from '@blowy/ui-mobile';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { dayLongTime, dayShortTime } from '../../../core/format/dates';
import { resolveMedia } from '../../../core/media/resolve';
import { paths } from '../../../core/navigation/paths';
import { errorCode } from '../../../core/api/errors';
import { t, tDynamic } from '../../../i18n';
import { useCityInsights, useMe, useMyNeighborhood } from '../../account';
import { useLeaveBand } from '../../band';
import { useConversation } from '../../conversations';
import { petSprite, useMyPet } from '../../pets';
import { useDevicePrefs } from '../../settings';
import { LoadingScreen } from '../../system';
import { bracketLabel } from '../../outings';
import { useAllowances } from '../../payments';
import {
  useAnswerProposal,
  useDuo,
  useDuoEgg,
  useDuos,
  useDuoLane,
  useDuoVenues,
  useLeaveDuo,
  useProposeDate,
} from '../api/hooks';

const isLive = (d: DuoView) => !['EXPIRED', 'CLOSED', 'LEFT'].includes(d.status);
const nameOf = (d: DuoView) =>
  d.status === 'EXCHANGE' ? `${d.other.firstName.charAt(0)}.` : d.other.firstName;
const back = (fallback: string) => () =>
  router.canGoBack() ? router.back() : router.replace(fallback as never);

function Steps() {
  const items = [
    { k: 'write', sprite: 'nino/young/phone.webp', bg: v5.lime },
    { k: 'faces', sprite: 'nino/young/affectionate.webp', bg: v5.roseLight },
    { k: 'date', sprite: 'accessories/mug.webp', bg: v5.peachLight },
  ] as const;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        alignItems: 'flex-start',
        backgroundColor: v5.white,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 8,
        boxShadow: [
          { offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream },
        ],
      }}
    >
      {items.map((s, i) => (
        <View key={s.k} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              backgroundColor: s.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sprite path={s.sprite} size={26} />
          </View>
          <BodyText size={12} weight={800} lh={1.2} align="center">
            {t(`duo.steps.${s.k}`, { n: i + 1 })}
          </BodyText>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- 37 · Voie Duo
export function DuoLaneScreen() {
  const lane = useDuoLane();
  const duos = useDuos();
  const allowances = useAllowances();
  const insights = useCityInsights();
  const hood = useMyNeighborhood();
  if (lane.isLoading || duos.isLoading) return <LoadingScreen />;
  const active = (duos.data?.items ?? []).filter(isLive);
  const limit = allowances.data?.duos.maxActive ?? 3; // V5.4 §C11 : 3 duos actifs gratuits
  const full = limit !== null && active.length >= limit;
  const insight = insights.data?.storyCompatible;
  const insightLine =
    insight && 'label' in insight
      ? t('duo.insight', { city: hood.data?.neighborhood?.name ?? '', label: insight.label })
      : '';
  return (
    <DetailScreen
      title={t('duo.laneTitle')}
      titleSize={40}
      backLabel={t('common.back')}
      onBack={back(paths.home)}
      pad={[52, 16, 22]}
      testID="duo-lane"
    >
      <PopIn delayMs={40}>
        <Steps />
      </PopIn>
      <PopIn delayMs={80} style={{ gap: 10 }}>
        {active.map((d) => (
          <CardV5
            key={d.id}
            onPress={() => router.push(paths.duo(d.id))}
            style={{ padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 19,
                backgroundColor: v5.rosePale,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sprite path="hybrid/baby-nino-suzie.webp" size={51} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <DisplayText
                size={22}
                heading={false}
              >{`${d.other.pet.name} · ${nameOf(d)}`}</DisplayText>
              <BodyText size={12} weight={800} color={v5.rose}>
                {t('duo.openBoth')}
              </BodyText>
              {d.exchange ? (
                <BodyText size={12} weight={700} color={v5.inkSoft}>
                  {t('duo.facesWhen', { when: dayShortTime(d.exchange.endsAt) })}
                </BodyText>
              ) : null}
            </View>
            <Glyph name="chevron" size={14} />
          </CardV5>
        ))}
        {(lane.data?.items ?? []).map((p) => (
          <ProposalCard key={p.proposalId} p={p} full={full} />
        ))}
      </PopIn>
      <View
        style={{
          marginTop: 'auto',
          backgroundColor: v5.ink,
          borderRadius: 18,
          paddingVertical: 12,
          paddingHorizontal: 14,
          gap: 6,
        }}
      >
        <BodyText size={14} weight={800} color={v5.white}>
          {[insightLine, t('duo.limitV55')].filter(Boolean).join(' ')}
        </BodyText>
        <Tap
          onPress={() => router.push(paths.found)}
          accessibilityRole="link"
          pressDepth={0}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <BodyText size={13} weight={800} color={v5.lime}>
            {t('duo.orGroup')}
          </BodyText>
        </Tap>
      </View>
    </DetailScreen>
  );
}

/** Tuile d'espèce (proposition avant le double oui : espèce + initiale seulement). */
const SPECIES_TILE: Record<string, string> = {
  NINO: v5.limePale,
  SUZIE: v5.rosePale,
  GASTON: v5.peachLight,
  PIA: v5.greenPale,
};

/** Carte « Un capybara · N. » : dire oui / pas cette fois (V5.5 D-068). */
function ProposalCard({
  p,
  full,
  large = false,
}: {
  p: DuoLaneProposalView;
  full: boolean;
  large?: boolean;
}) {
  const answer = useAnswerProposal();
  const myPet = useMyPet();
  const tile = large ? 64 : 60;
  return (
    <CardV5 style={{ padding: large ? 14 : 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View
          style={{
            width: tile,
            height: tile,
            borderRadius: 19,
            backgroundColor: large ? (SPECIES_TILE[p.species] ?? v5.peachLight) : v5.peachLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sprite path={petSprite(p.species)} size={Math.round(tile * 0.85)} />
        </View>
        <View style={{ minWidth: 0, gap: 2 }}>
          <DisplayText size={22} heading={false}>
            {t('duo.proposalTitle', {
              species: tDynamic(`duo.speciesIndef.${p.species}`),
              initial: p.otherInitial.replace(/\.$/, ''),
            })}
          </DisplayText>
          <BodyText size={12} weight={700} color={v5.inkSoft}>
            {t('duo.proposalSubV58', {
              pet: myPet.data?.name ?? '',
              initial: p.otherInitial.replace(/\.$/, ''),
            })}
          </BodyText>
        </View>
      </View>
      <BodyText size={12} weight={600} lh={1.4} color={v5.inkSoft}>
        {t('duo.beforeYesV55')}
      </BodyText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            variant="b2"
            size="md"
            label={t('duo.sayYesV55')}
            onPress={() =>
              full
                ? router.push({
                    pathname: paths.duoChoice,
                    params: { proposal: p.proposalId },
                  } as never)
                : answer.mutate({ id: p.proposalId, yes: true })
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="b3"
            size="md"
            label={t('duo.notNow')}
            onPress={() => answer.mutate({ id: p.proposalId, yes: false })}
          />
        </View>
      </View>
    </CardV5>
  );
}

// ---------------------------------------------------------------- 37a · Une proposition (notification « une proposition pour vous deux »)
export function DuoProposalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const lane = useDuoLane();
  const duos = useDuos();
  const allowances = useAllowances();
  const hood = useMyNeighborhood();
  if (lane.isLoading || duos.isLoading) return <LoadingScreen />;
  const items = lane.data?.items ?? [];
  const p = items.find((x) => x.proposalId === id) ?? items[0];
  if (!p) return <Redirect href={paths.duoLane} />;
  const limit = allowances.data?.duos.maxActive ?? 3;
  const full = limit !== null && (duos.data?.items ?? []).filter(isLive).length >= limit;
  const city = hood.data?.neighborhood?.name;
  return (
    <DetailScreen
      title={t('duo.proposalScreenTitle')}
      titleSize={40}
      backLabel={t('common.back')}
      onBack={back(paths.duoLane)}
      pad={[52, 16, 22]}
      gap={10}
      testID="duo-proposal"
    >
      <BodyText size={13} weight={700} color={v5.inkSoft}>
        {[city, t('duo.proposalScreenSub')].filter(Boolean).join(' · ')}
      </BodyText>
      <PopIn delayMs={60}>
        <ProposalCard p={p} full={full} large />
      </PopIn>
      <BodyText size={12} weight={700} color={v5.inkSoft}>
        {t('duo.limitV55')}
      </BodyText>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 37b · Plafond de duos actifs (V5.4 §C11 : 3, gratuit ; plus d'option payante)
export function DuoChoiceScreen() {
  const duos = useDuos();
  const lane = useDuoLane();
  const active = (duos.data?.items ?? []).find(isLive);
  const proposal = lane.data?.items[0];
  const a = active ? nameOf(active) : '';
  const n = proposal?.otherInitial ?? '';
  const option = (title: string, sub: string, onPress: () => void) => (
    <CardV5 onPress={onPress} style={{ padding: 14, gap: 4 }}>
      <BodyText size={16} weight={800}>
        {title}
      </BodyText>
      <BodyText size={13} weight={600} color={v5.inkSoft}>
        {sub}
      </BodyText>
    </CardV5>
  );
  return (
    <DetailScreen
      title={t('duo.choiceTitle')}
      titleSize={38}
      backLabel={t('common.back')}
      onBack={back(paths.duoLane)}
      pad={[52, 16, 22]}
      testID="duo-choice"
    >
      <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft}>
        {t('duo.choiceIntro', { a, n })}
      </BodyText>
      {option(t('duo.closeWith', { a }), t('duo.closeWithSub'), () => router.push(paths.leave))}
      {option(t('duo.keepLater', { n }), t('duo.keepLaterSub', { n }), () => router.back())}
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 38 · Duo (vous écrivez / les visages)
export function DuoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useDuo(id);
  if (q.isLoading || !q.data) return <LoadingScreen />;
  return q.data.status === 'EXCHANGE' ? <DuoExchange d={q.data} /> : <DuoFaces d={q.data} />;
}

function TimelineStep({
  sprite,
  title,
  text,
  active,
  chip,
}: {
  sprite: string;
  title: string;
  text: string;
  active?: boolean;
  chip?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          backgroundColor: active ? v5.rose : v5.white,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 4,
              blurRadius: 0,
              spreadDistance: 0,
              color: active ? v5.roseDeep : v5.shadowCream,
            },
          ],
        }}
      >
        <Sprite path={sprite} size={38} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <DisplayText size={21} heading={false}>
          {title}
        </DisplayText>
        <BodyText size={13} weight={600} lh={1.35} color={v5.inkSoft}>
          {text}
        </BodyText>
      </View>
      {chip ? <Pill label={chip} background={v5.rose} color={v5.white} /> : null}
    </View>
  );
}

function DuoExchange({ d }: { d: DuoView }) {
  const conv = useConversation(d.conversationId);
  const pet = useMyPet();
  const last = conv.messages.filter((m) => m.body).slice(-2);
  const pair = `${pet.data?.name ?? ''} et ${d.other.pet.name}`;
  return (
    <DetailScreen
      title={t('duo.withTitle', { name: nameOf(d).toUpperCase() })}
      titleSize={36}
      backLabel={t('duo.backLane')}
      onBack={back(paths.duoLane)}
      action={
        <IconAction
          glyph="flag"
          label={t('chats.report')}
          shadow={v5.shadowCream}
          glyphColor={v5.danger}
          onPress={() => router.push(paths.report)}
        />
      }
      pad={[52, 16, 20]}
      gap={12}
      testID="duo-exchange"
    >
      <PopIn delayMs={60} style={{ gap: 12, paddingVertical: 4 }}>
        <View
          style={{
            position: 'absolute',
            left: 26,
            top: 30,
            bottom: 30,
            width: 3,
            backgroundColor: v5.shadowCream,
          }}
        />
        <TimelineStep
          sprite="nino/young/phone.webp"
          title={t('duo.t1')}
          text={
            t('duo.t1Text', {
              since: d.exchange ? dayLongTime(Date.parse(d.exchange.endsAt) - 48 * 3_600_000) : '',
            }) + (d.projectCompatible ? ` ${t('duo.t1Compatible')}` : '')
          }
          active
          chip={t('duo.ongoing')}
        />
        <TimelineStep
          sprite="nino/young/affectionate.webp"
          title={t('duo.t2')}
          text={t('duo.t2Text', {
            when: d.exchange ? dayLongTime(d.exchange.endsAt, undefined, true) : '',
          })}
        />
        <TimelineStep
          sprite="accessories/mug.webp"
          title={t('duo.t3')}
          text={t('duo.t3Text', { pet: pet.data?.name ?? '' })}
        />
      </PopIn>
      <PopIn delayMs={120}>
        <CardV5 style={{ padding: 12, gap: 8 }}>
          <SectionLabel>{t('duo.between', { pair })}</SectionLabel>
          {last.map((m) =>
            m.mine ? (
              <Bubble key={m.key} text={m.body ?? ''} mine />
            ) : (
              <View key={m.key} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: v5.rosePale,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sprite path="hybrid/baby-nino-suzie.webp" size={29} />
                </View>
                <View
                  style={{
                    flexShrink: 1,
                    backgroundColor: v5.cream,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderBottomRightRadius: 20,
                    borderBottomLeftRadius: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                  }}
                >
                  <BodyText size={13} weight={400} lh={1.4}>
                    {m.body ?? ''}
                  </BodyText>
                </View>
              </View>
            ),
          )}
        </CardV5>
      </PopIn>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <Glyph name="shield" size={16} color={v5.green} />
        <BodyText size={12} weight={600} lh={1.4} color={v5.inkSoft} style={{ flex: 1 }}>
          {t('duo.filtered')}
        </BodyText>
      </View>
      <View style={{ marginTop: 'auto', gap: 2 }}>
        <Button
          variant="b1"
          label={t('duo.answer', { name: nameOf(d) })}
          icon="arrow"
          iconPosition="trailing"
          onPress={() => router.push(paths.chat(d.conversationId))}
        />
        <Button
          variant="ghost"
          tint={v5.inkSoft}
          label={t('duo.leaveClean')}
          onPress={() => router.push({ pathname: paths.leave, params: { duo: d.id } } as never)}
        />
      </View>
    </DetailScreen>
  );
}

function DuoFaces({ d }: { d: DuoView }) {
  const me = useMe();
  const pet = useMyPet();
  const photo = resolveMedia(d.other.photo?.url);
  const unlockedAt = d.dateDeadline ? Date.parse(d.dateDeadline) - 7 * 24 * 3_600_000 : null;
  return (
    <DetailScreen
      title={t('faces.title')}
      titleSize={36}
      backLabel={t('common.back')}
      onBack={back(paths.duoLane)}
      action={
        <IconAction
          glyph="flag"
          label={t('chats.report')}
          shadow={v5.shadowCream}
          glyphColor={v5.danger}
          onPress={() => router.push(paths.report)}
        />
      }
      pad={[52, 16, 20]}
      testID="duo-faces"
    >
      {unlockedAt ? (
        <Pill
          label={t('duo.facesChip', { when: dayLongTime(unlockedAt, undefined, true) })}
          background={v5.ink}
          color={v5.lime}
          padding={[7, 12]}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      <PopIn delayMs={60} style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <FaceCard
            height={200}
            photo={
              photo ? (
                <MediaView
                  source={photo}
                  bottomInset={50}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              ) : undefined
            }
            petSprite={petSprite(d.other.pet.species)}
            title={d.other.firstName}
            verifiedLabel={t('faces.verified')}
            watermark={
              me.data?.displayName ? t('faces.watermark', { name: me.data.displayName }) : undefined
            }
            accessibilityLabel={t('faces.a11y', { name: d.other.firstName })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FaceCard
            height={200}
            portrait="alex"
            petSprite={petSprite(pet.data?.species ?? 'NINO')}
            title={
              me.data?.age
                ? `${t('outing.group.me')} · ${bracketLabel(ageBracketOf(me.data.age))}`
                : t('outing.group.me')
            }
            verifiedLabel={t('faces.verified')}
            accessibilityLabel={t('duo.yourFace')}
          />
        </View>
      </PopIn>
      <CardV5 style={{ padding: 12, gap: 8 }}>
        <BodyText size={13} weight={600} lh={1.4} color={v5.inkSoft}>
          {t('duo.voiceOptional', { name: d.other.firstName })}
        </BodyText>
      </CardV5>
      <View style={{ marginTop: 'auto', gap: 2 }}>
        <Button
          variant="b2"
          label={t('duo.proposeDate')}
          icon="arrow"
          iconPosition="trailing"
          onPress={() => router.push(paths.duoDate(d.id))}
        />
        <Button
          variant="ghost"
          tint={v5.inkSoft}
          label={t('duo.leaveClean')}
          onPress={() => router.push({ pathname: paths.leave, params: { duo: d.id } } as never)}
        />
      </View>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 39 · Rendez-vous à deux
export function DuoDateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useDuo(id);
  const venues = useDuoVenues(id);
  const propose = useProposeDate(id);
  const prefs = useDevicePrefs();
  const [guardian, setGuardian] = useState<string | null>(null);
  if (q.isLoading || !q.data) return <LoadingScreen />;
  const d = q.data;
  const current = d.currentDate;
  const venue = current?.venue ?? venues.data?.items[0];
  const fromOuting = d.origin === 'OUTING_VOTE';
  const choices = [...prefs.recentGuardians.slice(0, 2).map((g) => g.name), ''];
  /** Aucun ange déjà choisi sur cet appareil : rien à proposer ici, l'ange se choisit plus tard (facultatif). */
  const noGuardians = prefs.recentGuardians.length === 0;
  return (
    <DetailScreen
      title={t('duo.dateTitle')}
      titleSize={36}
      backLabel={t('common.back')}
      onBack={back(paths.duo(d.id))}
      action={
        <Pill
          label={fromOuting ? t('duo.afterOuting') : t('duo.step3')}
          background={v5.ink}
          color={v5.lime}
          padding={[7, 10]}
        />
      }
      pad={[52, 16, 20]}
      testID="duo-date"
    >
      <PopIn delayMs={60}>
        <CardV5 style={{ padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <MediaView
            source={{ kind: 'sprite', path: fromOuting ? 'scenes/park.webp' : 'scenes/cafe.webp' }}
            style={{ width: 80, height: 80, borderRadius: 18 }}
          />
          <View style={{ gap: 3, minWidth: 0, flexShrink: 1 }}>
            <BodyText size={12} weight={800} color={v5.coralText}>
              {fromOuting ? t('duo.publicPlace') : t('duo.partner', { name: venue?.name ?? '' })}
            </BodyText>
            <DisplayText size={22} heading={false}>
              {venue?.name ?? t('duo.noVenue')}
            </DisplayText>
            {current ? (
              <BodyText size={13} weight={700} color={v5.inkSoft}>
                {`${dayShortTime(current.startsAt)}${venue && 'address' in venue && venue.address ? ` · ${venue.address}` : ''}`}
              </BodyText>
            ) : null}
          </View>
        </CardV5>
      </PopIn>
      <Button variant="ghost" tint={v5.ink} label={t('duo.otherPlace')} />
      {noGuardians ? null : (
        <>
          <SectionLabel>{t('duo.guardian')}</SectionLabel>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
            {choices.map((g, i) => {
              const on = guardian === g;
              return (
                <Tap
                  key={g || 'none'}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={g || t('duo.nobody')}
                  onPress={() => setGuardian(g)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    minHeight: 88,
                    borderRadius: 18,
                    backgroundColor: on ? v5.ink : v5.white,
                    boxShadow: [
                      {
                        offsetX: 0,
                        offsetY: 3,
                        blurRadius: 0,
                        spreadDistance: 0,
                        color: v5.shadowCream,
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: g ? [v5.lime, v5.mango][i % 2] : v5.sand,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DisplayText size={18} heading={false}>
                      {g ? g.charAt(0) : '–'}
                    </DisplayText>
                  </View>
                  <BodyText size={13} weight={800} color={on ? v5.white : v5.ink}>
                    {g || t('duo.nobody')}
                  </BodyText>
                </Tap>
              );
            })}
          </View>
        </>
      )}
      <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 6 }}>
        <CheckLine
          text={t('duo.dateL1')}
          size={13}
          color={v5.ink}
          checkColor={v5.lime}
          checkSize={18}
        />
        <CheckLine
          text={noGuardians ? t('duo.guardianLater') : t('duo.dateL2')}
          size={13}
          color={v5.ink}
          checkColor={v5.lime}
          checkSize={18}
        />
        <CheckLine
          text={
            noGuardians
              ? t('duo.mustAccept', { name: d.other.firstName })
              : t('duo.dateL3', { name: d.other.firstName })
          }
          size={13}
          color={v5.ink}
          checkColor={v5.lime}
          checkSize={18}
        />
      </CardV5>
      {propose.isError ? (
        <BodyText size={13} weight={700} color={v5.danger} accessibilityLiveRegion="polite">
          {errorCode(propose.error) === 'DUO_DATE_TOO_LATE'
            ? t('duo.dateTooLate')
            : t('duo.proposeFailed')}
        </BodyText>
      ) : null}
      <View style={{ marginTop: 'auto' }}>
        <Button
          variant="b1"
          label={t('duo.proposeTo', { name: d.other.firstName })}
          icon="arrow"
          iconPosition="trailing"
          loading={propose.isPending}
          onPress={() =>
            venue &&
            current &&
            propose.mutate(
              { venueId: venue.id, startsAt: current.startsAt },
              { onSuccess: () => router.replace(paths.home) },
            )
          }
        />
      </View>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 41 · Clin d'œil
export function EggScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useDuo(id);
  const egg = useDuoEgg(id);
  const [never, setNever] = useState(false);
  if (q.isLoading || !q.data) return <LoadingScreen />;
  const d = q.data;
  const on = d.egg?.myOptIn ?? false;
  return (
    <DetailScreen
      title={t('egg.title')}
      titleSize={36}
      backLabel={t('common.back')}
      onBack={back(paths.chat(d.conversationId))}
      pad={[52, 20, 22]}
      gap={0}
      testID="egg"
    >
      <View style={{ marginTop: 6, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Sprite path="eggs/egg-shared.webp" size={130} />
        <Sprite
          path="nino/young/affectionate.webp"
          size={100}
          style={{ position: 'absolute', left: 20, bottom: 0 }}
        />
        <Sprite
          path={petSprite(d.other.pet.species, 'affectionate')}
          size={90}
          style={{ position: 'absolute', right: 24, bottom: 0 }}
        />
      </View>
      <DisplayText size={34} style={{ marginTop: 6 }}>
        {t('egg.headline')}
      </DisplayText>
      <BodyText size={14} weight={600} lh={1.5} color={v5.inkSoft} style={{ marginTop: 8 }}>
        {t('egg.body')}
      </BodyText>
      <View style={{ marginTop: 14 }}>
        <SwitchCard
          titleSize={15}
          title={t('egg.want', { name: d.other.firstName })}
          sub={t('egg.wantSub')}
          value={on}
          onChange={(v) => egg.mutate(v)}
          a11y={t('egg.wantA11y', { name: d.other.firstName })}
        />
      </View>
      <View style={{ marginTop: 10 }}>
        <SwitchCard
          titleSize={15}
          title={t('egg.never')}
          sub={t('egg.neverSub')}
          value={never}
          onChange={setNever}
          a11y={t('egg.never')}
        />
      </View>
      <View style={{ marginTop: 'auto' }}>
        <Button
          variant="b3"
          label={t('egg.back')}
          onPress={() => router.replace(paths.chat(d.conversationId))}
        />
      </View>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 42 · Partir proprement
const LAST_WORDS = ['w1', 'w2', 'w3', 'own'] as const;

export function LeaveScreen() {
  const { duo, link } = useLocalSearchParams<{ duo?: string; link?: string }>();
  const duos = useDuos();
  const d = duo
    ? duos.data?.items.find((x) => x.id === duo)
    : (duos.data?.items.find((x) => x.origin === 'OUTING_VOTE' && isLive(x)) ??
      duos.data?.items.find(isLive));
  const leaveDuo = useLeaveDuo();
  const leaveBand = useLeaveBand();
  const [choice, setChoice] = useState<number>(-1);
  const [sent, setSent] = useState(false);
  const name = d?.other.firstName ?? '';
  if (sent) {
    return (
      <DetailScreen
        title=""
        backLabel={t('common.back')}
        onBack={() => router.replace(paths.home)}
        pad={[52, 18, 22]}
        testID="leave-done"
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Sprite path="nino/young/suitcase.webp" size={160} />
          <DisplayText size={40} style={{ textAlign: 'center' }}>
            {t('leave.doneTitle')}
          </DisplayText>
          <BodyText
            size={14}
            weight={600}
            lh={1.5}
            color={v5.inkSoft}
            align="center"
            style={{ maxWidth: 300 }}
          >
            {t('leave.doneBody', { name })}
          </BodyText>
        </View>
        <Button
          variant="b1"
          label={t('results.home')}
          icon="arrow"
          iconPosition="trailing"
          onPress={() => router.replace(paths.home)}
        />
      </DetailScreen>
    );
  }
  const send = () => {
    const done = () => setSent(true);
    if (link) leaveBand.mutate(link, { onSuccess: done });
    else if (d) leaveDuo.mutate(d.id, { onSuccess: done });
  };
  return (
    <DetailScreen
      title={t('leave.title')}
      titleSize={32}
      backLabel={t('leave.back')}
      onBack={back(paths.chats)}
      pad={[52, 18, 22]}
      gap={0}
      testID="leave"
    >
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('leave.intro', { name })}
      </BodyText>
      <SectionLabel style={{ marginTop: 14 }}>{t('leave.lastWord', { name })}</SectionLabel>
      <View accessibilityRole="radiogroup" style={{ marginTop: 8, gap: 8 }}>
        {LAST_WORDS.map((k, i) => {
          const on = choice === i;
          return (
            <Tap
              key={k}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setChoice(i)}
              style={{
                minHeight: 48,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: on ? v5.ink : v5.white,
                boxShadow: [
                  {
                    offsetX: 0,
                    offsetY: 3,
                    blurRadius: 0,
                    spreadDistance: 0,
                    color: on ? v5.black : v5.shadowCream,
                  },
                ],
              }}
            >
              <BodyText size={14} weight={600} lh={1.4} color={on ? v5.white : v5.ink}>
                {t(`leave.${k}`)}
              </BodyText>
            </Tap>
          );
        })}
      </View>
      <View style={{ marginTop: 'auto', gap: 2 }}>
        {choice >= 0 ? (
          <Button
            variant="b2"
            label={t('leave.send')}
            loading={leaveDuo.isPending || leaveBand.isPending}
            onPress={send}
          />
        ) : (
          <Button variant="bdis" label={t('leave.choose')} />
        )}
        <Tap
          onPress={() => router.push(paths.report)}
          accessibilityRole="link"
          pressDepth={0}
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: v5.inkSoft }}>
            <BodyText size={13} weight={700} color={v5.inkSoft}>
              {t('leave.unsafe')}
            </BodyText>
          </Text>
        </Tap>
      </View>
    </DetailScreen>
  );
}
