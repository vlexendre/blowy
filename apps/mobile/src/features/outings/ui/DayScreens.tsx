/**
 * Le jour J et la veille : 27 · Lieu confirmé (V5-Confirmation, J-1 18 h : lieu, photo du lieu,
 * prénoms, tranches, pets — sans visages) · 28 · Les visages (V5-Revelation, J −3 h, filigrane du
 * regardeur) · 31 · Check-in par code (V5-Checkin) · 31b · Check-in fait (V5-Checkin-ok) ·
 * 29 · Ange gardien (V5-Ange). La position n'est jamais demandée si le code est tapé.
 */
import type { OutingMemberView, OutingView } from '@blowy/api-contract';
import { ageBracketOf } from '@blowy/domain';
import {
  Blob,
  BodyText,
  Button,
  CardV5,
  DetailScreen,
  DisplayText,
  FaceCard,
  Frame,
  Glyph,
  IconAction,
  MediaView,
  PersonLine,
  Pill,
  PopIn,
  SectionLabel,
  Tap,
  VenueCard,
  VenueWelcome,
  v5,
  v5Alpha,
  v5Gradient,
} from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import { bodyFont, strongFont } from '@blowy/ui-mobile';
import { Text } from 'react-native';
import { isNetworkError } from '../../../core/api/errors';
import { useNow } from '../../../core/clock';
import { civil, dayLongTime } from '../../../core/format/dates';
import { resolveMedia } from '../../../core/media/resolve';
import { paths } from '../../../core/navigation/paths';
import { ruleV57 } from '../../../core/content/rules';
import { t } from '../../../i18n';
import { useMe, useMyNeighborhood } from '../../account';
import { petSprite, useMyPet } from '../../pets';
import {
  useCreateGuardianLink,
  useRaiseAlert,
  useSafetyStatus,
  useUneasyLeave,
} from '../../safety';
import { useDevicePrefs } from '../../settings';
import { LoadingScreen, OfflineScreen } from '../../system';
import { useCheckIn, useOuting } from '../api/hooks';
import { bracketLabel, schedule } from '../model/presenters';
import { CancelRules, NotComingCards, travelLine } from './parts';

const TILES = [v5.violetPale, v5.peachLight, v5.greenPale] as const;
const capFirst = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const hhmm = (ms: number) => {
  const c = civil(ms);
  return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
};

function useOutingParam() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return useOuting(id);
}

function Guard({
  q,
  children,
}: {
  q: ReturnType<typeof useOuting>;
  children: (o: OutingView) => ReactNode;
}) {
  if (q.isLoading) return <LoadingScreen />;
  if (isNetworkError(q.error) || !q.data) return <OfflineScreen onRetry={() => void q.refetch()} />;
  return <>{children(q.data)}</>;
}

const reportAction = (o: OutingView, dark = false) => (
  <IconAction
    glyph="flag"
    label={t('chats.report')}
    background={dark ? v5Alpha.white18 : v5.white}
    shadow={dark ? null : v5.shadowCream}
    glyphColor={dark ? v5.white : v5.danger}
    onPress={() => router.push({ pathname: paths.report, params: { outing: o.id } } as never)}
  />
);

const back = (o: OutingView) => () =>
  router.canGoBack()
    ? router.back()
    : router.replace(o.conversationId ? paths.chat(o.conversationId) : paths.home);

function tileOf(m: OutingMemberView, i: number) {
  return m.inMyTeam ? v5.peach : (TILES[i % TILES.length] ?? v5.violetPale);
}

// ---------------------------------------------------------------- 27 · Lieu confirmé
export function ConfirmationScreen() {
  const q = useOutingParam();
  const pet = useMyPet();
  const me = useMe();
  const home = useMyNeighborhood().data?.neighborhood?.name;
  const myBracket = me.data?.age ? bracketLabel(ageBracketOf(me.data.age)) : '';
  return (
    <Guard q={q}>
      {(o) => {
        const venue = o.venue;
        const travel = travelLine(o, home);
        const photo = resolveMedia(venue?.photoUrl, false);
        const others = o.members.filter((m) => !m.inMyTeam);
        const mates = o.members.filter((m) => m.inMyTeam);
        return (
          <DetailScreen
            title={t('confirm.title')}
            titleSize={34}
            backLabel={t('confirm.back')}
            onBack={back(o)}
            action={reportAction(o)}
            pad={[52, 16, 18]}
            gap={8}
            scroll
            testID="confirmation"
          >
            <Pill
              label={t('confirm.revealed', { lock: capFirst(schedule(o).lock) })}
              background={v5.ink}
              color={v5.lime}
              padding={[7, 12]}
              style={{ alignSelf: 'flex-start' }}
            />
            <PopIn delayMs={40}>
              <VenueCard
                photo={
                  photo ? (
                    <MediaView
                      source={photo}
                      contentPosition={{ top: '35%', left: '50%' }}
                      style={{ height: 76 }}
                    />
                  ) : undefined
                }
                photoCaption={t('confirm.photoCaption')}
                name={venue?.name ?? ''}
                address={[venue?.address.split(' · ')[0] ?? '', travel].filter(Boolean).join(' · ')}
                note={
                  venue?.bookingName
                    ? t('confirm.tableNote', { name: venue.bookingName })
                    : undefined
                }
              />
            </PopIn>
            {venue?.welcomeMessage ? (
              <PopIn delayMs={60}>
                <VenueWelcome title={t('chats.venueWelcome')} text={venue.welcomeMessage} />
              </PopIn>
            ) : null}
            <PopIn delayMs={80}>
              <CardV5 style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                <SectionLabel inline>{t('confirm.groupLabel')}</SectionLabel>
                <PersonLine
                  sprite={petSprite(pet.data?.species ?? 'NINO')}
                  tile={v5.lime}
                  label={
                    myBracket ? `${t('outing.group.me')} · ${myBracket}` : t('outing.group.me')
                  }
                  pet={pet.data?.name ?? ''}
                />
                {mates.map((m) => (
                  <PersonLine
                    key={m.userId}
                    sprite={petSprite(m.pet.species)}
                    tile={v5.peach}
                    label={`${m.firstName} · ${bracketLabel(m.ageRange)} · ${t('confirm.withYou')}${m.calm ? ` · ${t('chats.calm')}` : ''}`}
                    pet={m.pet.name}
                  />
                ))}
                {others.map((m, i) => (
                  <PersonLine
                    key={m.userId}
                    sprite={petSprite(m.pet.species)}
                    tile={tileOf(m, i)}
                    label={`${m.firstName ?? m.pet.name}${m.ageRange ? ` · ${bracketLabel(m.ageRange)}` : ''}${m.calm ? ` · ${t('chats.calm')}` : ''}`}
                    pet={m.pet.name}
                  />
                ))}
              </CardV5>
            </PopIn>
            <SectionLabel style={{ marginTop: 4 }}>{t('notComing.label')}</SectionLabel>
            <NotComingCards o={o} />
            <CancelRules o={o} summary={t('confirm.rulesSummary')} />
            <View style={{ marginTop: 'auto', gap: 4 }}>
              <Button
                variant="b2"
                label={t('confirm.guardian')}
                onPress={() => router.push(paths.outingStep(o.id, 'guardian'))}
              />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="ghost"
                    tint={v5.ink}
                    label={t('confirm.shareWeek')}
                    onPress={() => router.push(paths.share('confirmation'))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="ghost"
                    tint={v5.ink}
                    label={t('confirm.photos')}
                    onPress={() => router.push(paths.verify)}
                  />
                </View>
              </View>
            </View>
          </DetailScreen>
        );
      }}
    </Guard>
  );
}

// ---------------------------------------------------------------- 28 · Les visages
export function FacesScreen() {
  const q = useOutingParam();
  const me = useMe();
  const viewer = me.data?.displayName ?? '';
  return (
    <Guard q={q}>
      {(o) => (
        <DetailScreen
          title={t('faces.title')}
          titleSize={36}
          backLabel={t('confirm.back')}
          onBack={back(o)}
          action={reportAction(o)}
          pad={[52, 16, 18]}
          testID="faces"
          scroll
        >
          <Pill
            label={t('faces.chip', {
              when: dayLongTime(o.timeline.photoRevealAt, undefined, true),
            })}
            background={v5.ink}
            color={v5.lime}
            padding={[7, 12]}
            style={{ alignSelf: 'flex-start' }}
          />
          <PopIn delayMs={60} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {o.members.map((m) => {
              const src = resolveMedia(m.photo?.url);
              const name = m.firstName ?? m.pet.name;
              return (
                <View key={m.userId} style={{ width: '48.7%' }}>
                  <FaceCard
                    photo={
                      src ? (
                        <MediaView
                          source={src}
                          bottomInset={44}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                      ) : undefined
                    }
                    petSprite={petSprite(m.pet.species)}
                    title={`${name}${m.ageRange ? ` · ${bracketLabel(m.ageRange)}` : ''}`}
                    verifiedLabel={t('faces.verified')}
                    watermark={viewer ? t('faces.watermark', { name: viewer }) : undefined}
                    accessibilityLabel={t('faces.a11y', { name })}
                  />
                </View>
              );
            })}
          </PopIn>
          <BodyText size={12} weight={600} lh={1.45} color={v5.inkSoft}>
            {t('faces.note', { name: viewer })}
          </BodyText>
          <View style={{ gap: 8 }}>
            <Button
              variant="b2"
              label={t('faces.tonight')}
              onPress={() => router.push(paths.outingStep(o.id, 'checkin'))}
            />
            <NotComingCards o={o} />
          </View>
        </DetailScreen>
      )}
    </Guard>
  );
}

// ---------------------------------------------------------------- 31 · Check-in
function NightFrame({ children, o }: { children: ReactNode; o: OutingView }) {
  return (
    <Frame
      pad={[52, 18, 22]}
      gradient={v5Gradient.night}
      decor={<Blob size={300} top={220} right={-170} color={v5.violet} opacity={0.4} />}
    >
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <IconAction
          glyph="back"
          glyphSize={16}
          label={t('common.back')}
          background={v5Alpha.white18}
          glyphColor={v5.white}
          onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.home))}
        />
        <View style={{ flex: 1 }} />
        {reportAction(o, true)}
      </PopIn>
      {children}
    </Frame>
  );
}

function VenueTile({ o }: { o: OutingView }) {
  const photo = resolveMedia(o.venue?.photoUrl, false);
  return (
    <View
      style={{
        marginTop: 14,
        backgroundColor: v5.cream,
        borderRadius: 22,
        padding: 12,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        boxShadow: [
          { offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5Alpha.black35 },
        ],
      }}
    >
      {photo ? (
        <MediaView source={photo} style={{ width: 70, height: 70, borderRadius: 16 }} />
      ) : null}
      <View style={{ gap: 3, flexShrink: 1 }}>
        <DisplayText size={22} heading={false}>
          {o.venue?.name ?? ''}
        </DisplayText>
        <BodyText size={12} weight={700} color={v5.inkSoft}>
          {t('checkin.table')}
        </BodyText>
      </View>
    </View>
  );
}

export function CheckinScreen() {
  const q = useOutingParam();
  const now = useNow();
  const [code, setCode] = useState('');
  return (
    <Guard q={q}>{(o) => <CheckinBody o={o} now={now} code={code} setCode={setCode} />}</Guard>
  );
}

function CheckinBody({
  o,
  now,
  code,
  setCode,
}: {
  o: OutingView;
  now: number;
  code: string;
  setCode: (c: string) => void;
}) {
  const checkIn = useCheckIn(o.id);
  const [error, setError] = useState<string | null>(null);
  const submit = () =>
    checkIn.mutate(
      { method: 'VENUE_CODE', code },
      {
        onSuccess: () => router.replace(paths.outingStep(o.id, 'checked-in')),
        onError: () => setError(t('checkin.invalid')),
      },
    );
  return (
    <NightFrame o={o}>
      <PopIn style={{ marginTop: 12, flexDirection: 'row' }}>
        <Pill
          label={`${t('checkin.weekday')} ${hhmm(now)}`}
          background={v5.white}
          padding={[7, 12]}
        />
      </PopIn>
      <DisplayText size={46} lineHeight={0.9} color={v5.white} style={{ marginTop: 10 }}>
        {t('checkin.title')}
      </DisplayText>
      <VenueTile o={o} />
      <View style={{ marginTop: 18, alignItems: 'center', gap: 12 }}>
        <BodyText
          size={15}
          weight={700}
          lh={1.45}
          color={v5.white}
          align="center"
          style={{ maxWidth: 300 }}
        >
          {t('checkin.instructions')}
        </BodyText>
        <View
          accessibilityRole="none"
          accessibilityLabel={t('checkin.codeA11y')}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: 60,
                height: 72,
                borderRadius: 18,
                backgroundColor: v5Alpha.white12,
                borderWidth: 2,
                borderColor: i === code.length ? v5.lime : v5Alpha.white25,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DisplayText size={38} color={v5.white} heading={false}>
                {code[i] ?? ''}
              </DisplayText>
            </View>
          ))}
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            maxLength={4}
            accessibilityLabel={t('checkin.codeA11y')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0,
              ...bodyFont(16, 400),
            }}
          />
        </View>
        <BodyText size={13} weight={600} color={v5.sandDeep} align="center">
          {error ?? t('checkin.noStand')}
        </BodyText>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 10 }}>
        <Button
          variant="lime"
          label={t('checkin.validate')}
          loading={checkIn.isPending}
          onPress={code.length === 4 ? submit : () => setError(t('checkin.fourDigits'))}
          testID="checkin-validate"
        />
        <BodyText size={12} weight={600} color={v5.sandDeep} align="center">
          {t('checkin.noPosition')}
        </BodyText>
      </View>
    </NightFrame>
  );
}

// ---------------------------------------------------------------- 31b · Check-in fait
export function CheckedInScreen() {
  const q = useOutingParam();
  return <Guard q={q}>{(o) => <CheckedInBody o={o} />}</Guard>;
}

function CheckedInBody({ o }: { o: OutingView }) {
  const subject = { kind: 'OUTING' as const, id: o.id };
  const status = useSafetyStatus(subject);
  const leave = useUneasyLeave(subject);
  const alert = useRaiseAlert(subject);
  const prefs = useDevicePrefs();
  const arrived = o.members.filter((m) => m.arrived).length + 1;
  const size = o.capacity;
  const guardian = prefs.lastGuardian;
  const checkedAt = hhmm(Date.parse(o.timeline.checkinOpensAt) + 32 * 60_000);
  const [leaving, setLeaving] = useState(false);
  return (
    <NightFrame o={o}>
      <PopIn style={{ marginTop: 12, flexDirection: 'row' }}>
        <Pill
          label={t('checkedIn.chip', { time: checkedAt })}
          background={v5.lime}
          padding={[7, 12]}
        />
      </PopIn>
      <DisplayText size={46} lineHeight={0.9} color={v5.white} style={{ marginTop: 10 }}>
        {t('checkedIn.title')}
      </DisplayText>
      <VenueTile o={o} />
      <View
        style={{
          marginTop: 14,
          backgroundColor: v5Alpha.white08,
          borderRadius: 22,
          padding: 14,
          gap: 10,
        }}
      >
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('checkedIn.count', { n: arrived, size })}
          style={{ flexDirection: 'row', gap: 6 }}
        >
          {Array.from({ length: size }, (_, i) =>
            i < arrived ? (
              <View
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: v5.lime,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Glyph name="check" size={18} color={v5.ink} />
              </View>
            ) : (
              <View
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  borderWidth: 2.5,
                  borderStyle: 'dashed',
                  borderColor: v5Alpha.white45,
                }}
              />
            ),
          )}
        </View>
        <DisplayText size={24} color={v5.white} heading={false}>
          {t('checkedIn.count', { n: arrived, size })}
        </DisplayText>
        <BodyText size={13} weight={600} lh={1.45} color={v5.sandDeep}>
          {t('checkedIn.phoneAway')}
        </BodyText>
      </View>
      <View
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: v5Alpha.white20,
          borderRadius: 22,
          overflow: 'hidden',
        }}
      >
        {guardian && (status.data?.activeGuardianLinks ?? 0) > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              minHeight: 52,
              paddingHorizontal: 14,
            }}
          >
            <Glyph name="shield" size={18} color={v5.lime} />
            <BodyText size={14} weight={700} color={v5.white}>
              {t('checkedIn.guardianKnows', { name: guardian })}
            </BodyText>
            <Pill label={checkedAt} background={v5.lime} style={{ marginLeft: 'auto' }} />
          </View>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            minHeight: 52,
            paddingHorizontal: 14,
            borderTopWidth: guardian ? 1 : 0,
            borderTopColor: v5Alpha.white20,
          }}
        >
          <Glyph name="clock" size={18} color={v5.lime} />
          <BodyText size={14} weight={700} color={v5.white}>
            {t('checkedIn.okAtEnd')}
          </BodyText>
          <Pill
            label={hhmm(Date.parse(o.endsAt))}
            background={v5Alpha.white16}
            color={v5.white}
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 8 }}>
        {leaving ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tap
              onPress={() => undefined}
              accessibilityRole="button"
              accessibilityLabel={t('checkedIn.fakeCall')}
              pressDepth={4}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 16,
                backgroundColor: v5Alpha.white12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Glyph name="phone" size={16} color={v5.white} />
              <BodyText size={14} weight={800} color={v5.white}>
                {t('checkedIn.fakeCall')}
              </BodyText>
            </Tap>
            <Tap
              onPress={() =>
                leave.mutate(true, {
                  onSuccess: (r) =>
                    r.callbackTargetMinutes ? undefined : router.replace(paths.home),
                })
              }
              accessibilityRole="button"
              pressDepth={4}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 16,
                backgroundColor: v5Alpha.white12,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
              }}
            >
              <BodyText size={13} weight={800} color={v5.white} align="center">
                {t('checkedIn.leave')}
              </BodyText>
            </Tap>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tap
            onPress={() => setLeaving(!leaving)}
            accessibilityRole="button"
            accessibilityState={{ selected: leaving }}
            accessibilityLabel={`${t('checkedIn.needLeave')} ${t('checkedIn.needLeaveSub')}`}
            pressDepth={4}
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: 18,
              backgroundColor: v5Alpha.white12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                strongFont(15),
                { color: v5.white, textTransform: 'uppercase', lineHeight: 15 },
              ]}
            >
              {t('checkedIn.needLeave')}
            </Text>
            <BodyText size={11} weight={700} color={v5.white} lh={1}>
              {t('checkedIn.needLeaveSub')}
            </BodyText>
          </Tap>
          <Tap
            onLongPress={() => alert.mutate()}
            delayLongPress={2000}
            accessibilityRole="button"
            accessibilityLabel={t('checkedIn.help')}
            pressDepth={4}
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: 18,
              backgroundColor: v5.danger,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: [
                {
                  offsetX: 0,
                  offsetY: 5,
                  blurRadius: 0,
                  spreadDistance: 0,
                  color: v5.dangerDeeper,
                },
              ],
            }}
          >
            <Text
              style={[
                strongFont(15),
                { color: v5.white, textTransform: 'uppercase', lineHeight: 15 },
              ]}
            >
              {t('checkedIn.help')}
            </Text>
            <BodyText size={11} weight={700} color={v5.white} lh={1}>
              {t('checkedIn.helpSub')}
            </BodyText>
          </Tap>
        </View>
        {alert.data?.callbackTargetMinutes || leave.data?.callbackTargetMinutes ? (
          <BodyText
            size={13}
            weight={800}
            color={v5.lime}
            align="center"
            accessibilityLiveRegion="assertive"
          >
            {ruleV57('help_callback')}
          </BodyText>
        ) : (
          <BodyText size={12} weight={600} lh={1.4} color={v5.sandDeep} align="center">
            {t('checkedIn.leaveNote')}
          </BodyText>
        )}
        <Button
          variant="ghost"
          tint={v5.sandDeep}
          label={t('checkedIn.end')}
          onPress={() => router.replace(paths.outingStep(o.id, 'memory'))}
        />
      </View>
    </NightFrame>
  );
}

// ---------------------------------------------------------------- 29 · Ange gardien
export function GuardianScreen() {
  const q = useOutingParam();
  return <Guard q={q}>{(o) => <GuardianBody o={o} />}</Guard>;
}

function GuardianBody({ o }: { o: OutingView }) {
  const subject = { kind: 'OUTING' as const, id: o.id };
  const create = useCreateGuardianLink(subject);
  const prefs = useDevicePrefs();
  const me = useMe();
  const [sel, setSel] = useState<string | null>(null);
  const [other, setOther] = useState('');
  const contacts = [...prefs.recentGuardians, { name: '', note: t('guardian.otherNote') }];
  const chosen = sel === '' ? other.trim() : sel;
  const send = () =>
    create.mutate(chosen || undefined, {
      onSuccess: async (r) => {
        prefs.set({ lastGuardian: chosen || null });
        const { Share } = await import('react-native');
        await Share.share({
          message: t('guardian.message', { name: me.data?.displayName ?? '', url: r.url }),
        }).catch(() => undefined);
        router.back();
      },
    });
  return (
    <DetailScreen
      title={t('guardian.title')}
      titleSize={36}
      backLabel={t('guardian.back')}
      onBack={() => router.back()}
      pad={[52, 16, 20]}
      testID="guardian"
    >
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('guardian.intro')}
      </BodyText>
      <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
        {contacts.map((c, i) => {
          const key = c.name;
          const on = sel === key;
          const initial = c.name ? c.name.charAt(0).toUpperCase() : '+';
          const colors = [v5.lime, v5.peachSoft, v5.cyanLight];
          return (
            <Tap
              key={key || 'other'}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={c.name || t('guardian.other')}
              onPress={() => setSel(key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 60,
                paddingHorizontal: 14,
                borderRadius: 18,
                backgroundColor: on ? v5.ink : v5.white,
                boxShadow: [
                  {
                    offsetX: 0,
                    offsetY: 4,
                    blurRadius: 0,
                    spreadDistance: 0,
                    color: on ? v5.black : v5.shadowCream,
                  },
                ],
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: c.name ? (colors[i % 2] ?? v5.lime) : v5.cyanLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DisplayText size={18} heading={false}>
                  {initial}
                </DisplayText>
              </View>
              <View style={{ gap: 1, flexShrink: 1 }}>
                {c.name ? (
                  <BodyText size={15} weight={800} color={on ? v5.white : v5.ink}>
                    {c.name}
                  </BodyText>
                ) : on ? (
                  <TextInput
                    value={other}
                    onChangeText={setOther}
                    placeholder={t('guardian.other')}
                    placeholderTextColor={v5.mist}
                    accessibilityLabel={t('guardian.other')}
                    style={{ ...bodyFont(15, 700), color: v5.white, padding: 0 }}
                  />
                ) : (
                  <BodyText size={15} weight={800}>
                    {t('guardian.other')}
                  </BodyText>
                )}
                <BodyText size={12} weight={600} color={on ? v5.limeSoft : v5.grey}>
                  {c.note}
                </BodyText>
              </View>
              <View
                style={{
                  marginLeft: 'auto',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 3,
                  borderColor: on ? v5.lime : v5.greyWarm,
                  backgroundColor: on ? v5.lime : 'transparent',
                }}
              />
            </Tap>
          );
        })}
      </View>
      <CardV5 style={{ padding: 14, gap: 8 }}>
        <SectionLabel>{t('guardian.seesLabel')}</SectionLabel>
        {(['s1', 's2', 's3'] as const).map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: v5.limeLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Glyph name="check" size={12} color={v5.green} />
            </View>
            <BodyText size={13} weight={600}>
              {t(`guardian.${k}`, { name: me.data?.displayName ?? '' })}
            </BodyText>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: v5.line, marginVertical: 2 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: v5.sand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Glyph name="close" size={9} color={v5.inkSoft} />
          </View>
          <BodyText size={13} weight={600} style={{ flexShrink: 1 }}>
            {t('guardian.never')}
          </BodyText>
        </View>
        <BodyText size={12} weight={600} color={v5.grey}>
          {t('guardian.expiry')}
        </BodyText>
      </CardV5>
      <View style={{ marginTop: 'auto', gap: 2 }}>
        {sel !== null && (sel !== '' || other.trim()) ? (
          <Button
            variant="b1"
            label={t('guardian.send', { name: chosen || t('guardian.thisContact') })}
            icon="arrow"
            iconPosition="trailing"
            loading={create.isPending}
            onPress={send}
            testID="guardian-send"
          />
        ) : (
          <Button variant="bdis" label={t('guardian.choose')} />
        )}
        <Button
          variant="ghost"
          tint={v5.inkSoft}
          label={t('guardian.none')}
          onPress={() => router.back()}
        />
      </View>
    </DetailScreen>
  );
}
