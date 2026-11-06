/**
 * 18 · Accueil (V5-Accueil) : prochaine sortie, « vient avec toi », bande et duo, scène du pet
 * (réductible). Variantes : mode discret (V5-Accueil-discret : « Agenda », aucun pet) et format
 * à deux (V5-Accueil-duo, mode de rencontre « DUO »). Pause en 1 tap toujours présente.
 */
import type { DuoView, OutingView } from '@blowy/api-contract';
import type { Species } from '@blowy/domain';
import { BodyText, CardV5, DisplayText, Glyph, Pill, PopIn, Sprite, TabScreen, Tap, v5, v5Alpha, InlineLink } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useNow } from '../../../core/clock';
import { dayShortCap, timeLabel, weekdayName, weekdayShortTime } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { useTabs } from '../../../core/navigation/tabs';
import { t, tDynamic } from '../../../i18n';
import { useIntentions } from '../../account';
import { useBand } from '../../band';
import { useConversations } from '../../conversations';
import { useDuos } from '../../duos';
import { headline, outingPhase, schedule, teamMates, useMyOuting } from '../../outings';
import { petSprite, useMyPet } from '../../pets';
import { useDevicePrefs } from '../../settings';
import { LoadingScreen, OfflineScreen } from '../../system';
import { isNetworkError } from '../../../core/api/errors';

function PauseButton() {
  return (
    <Tap onPress={() => router.push(paths.pause)} accessibilityLabel={t('home.pause')} testID="home-pause" style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: v5.white, flexDirection: 'row', alignItems: 'center', gap: 8, boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
      <Glyph name="pause" size={14} />
      <BodyText size={14} weight={800}>
        {t('home.pause')}
      </BodyText>
    </Tap>
  );
}

function PetChip({ name, species }: { name: string; species: Species }) {
  return (
    <Tap onPress={() => router.push(paths.pet)} accessibilityLabel={t('home.petA11y', { name })} pressDepth={0} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: v5.ink, paddingVertical: 4, paddingLeft: 6, paddingRight: 14, minHeight: 36 }}>
      <Sprite path={petSprite(species)} size={30} />
      <DisplayText size={18} color={v5.lime} heading={false} letterSpacingEm={0} lineHeight={1.2}>
        {name}
      </DisplayText>
    </Tap>
  );
}

export function HomeScreen() {
  const nav = useTabs('home');
  const { week, outing } = useMyOuting();
  const pet = useMyPet();
  const prefs = useDevicePrefs();
  const intentions = useIntentions();
  const duos = useDuos();
  const now = useNow();
  if (week.isLoading || pet.isLoading) return <LoadingScreen />;
  if (isNetworkError(week.error) || isNetworkError(pet.error)) return <OfflineScreen onRetry={() => void week.refetch()} />;
  const species: Species = pet.data?.species ?? 'NINO';
  const o = outing.data;
  const duo = duos.data?.items.find((d) => !['EXPIRED', 'CLOSED', 'LEFT'].includes(d.status));
  if (prefs.discreet) return <DiscreetHome o={o} nav={nav} />;
  if (intentions.data?.meetingMode === 'DUO' && duo) return <DuoHome duo={duo} o={o} nav={nav} species={species} petName={pet.data?.name ?? ''} now={now} />;
  return (
    <TabScreen nav={nav} testID="home">
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PetChip name={pet.data?.name ?? ''} species={species} />
        <PauseButton />
      </PopIn>
      <PopIn delayMs={40} style={{ marginTop: 14 }}>
        <OutingCard o={o} now={now} />
      </PopIn>
      {o && teamMates(o).length ? (
        <PopIn delayMs={80} style={{ marginTop: 8 }}>
          <InlineLink
            label={t('home.teamComes', { names: teamMates(o).map((m) => m.firstName).join(' et ') })}
            leading={
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: v5.peach, alignItems: 'center', justifyContent: 'center' }}>
                <Sprite path={petSprite(teamMates(o)[0]!.pet.species)} size={24} />
              </View>
            }
            onPress={() => router.push(paths.outingStep(o.id, 'team'))}
          />
        </PopIn>
      ) : null}
      <PopIn delayMs={120} style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
        <BandTile />
        <DuoTile duo={duo} />
      </PopIn>
      {prefs.petSize === 'large' ? (
        <PopIn delayMs={160} style={{ marginTop: 12, height: 150, borderRadius: 24, overflow: 'hidden' }}>
          <Sprite path="scenes/home-room.webp" size={358} height={150} contentFit="cover" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} />
          <Sprite path={petSprite(species, 'dance')} size={110} accessibilityLabel={pet.data?.name} style={{ position: 'absolute', left: 20, bottom: 0 }} />
          {o ? (
            <View style={{ position: 'absolute', left: 130, top: 54, backgroundColor: v5.ink, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 4, paddingVertical: 9, paddingHorizontal: 13 }}>
              <BodyText size={13} weight={600} color={v5.white}>
                {tDynamic(`home.petLine.${o.activity}`, { day: weekdayName(o.startsAt, undefined, true) })}
              </BodyText>
            </View>
          ) : null}
          <Tap onPress={() => prefs.set({ petSize: 'small' })} accessibilityLabel={t('home.shrinkPet')} pressDepth={0} style={{ position: 'absolute', right: 10, bottom: 10, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: v5Alpha.white90, justifyContent: 'center' }}>
            <BodyText size={12} weight={800}>
              {t('home.shrinkPet')}
            </BodyText>
          </Tap>
        </PopIn>
      ) : null}
    </TabScreen>
  );
}

function OutingCard({ o, now }: { o: OutingView | undefined; now: number }) {
  const convs = useConversations();
  if (!o) {
    return (
      <Tap onPress={() => router.push(paths.waitlist)} accessibilityRole="link" style={{ backgroundColor: v5.ink, borderRadius: 26, padding: 16, gap: 10, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.black }] }}>
        <BodyText size={13} weight={800} color={v5.lime}>
          {t('home.noOuting')}
        </BodyText>
        <DisplayText size={30} color={v5.white} heading={false}>
          {t('home.noOutingTitle')}
        </DisplayText>
      </Tap>
    );
  }
  const phase = outingPhase(o, now);
  const h = headline(o, tDynamic(`activity.${o.activity}`));
  const s = schedule(o);
  const conv = convs.data?.items.find((c) => c.id === o.conversationId);
  const unread = conv ? Math.max(0, conv.lastSeq - conv.lastReadSeq) : 0;
  const label = phase === 'invited' ? t('home.labelInvited') : t('home.labelGoing');
  const target = phase === 'invited' ? paths.found : paths.outing(o.id);
  const note = phase === 'going' ? t('home.venueAt', { lock: s.lock }) : phase === 'confirmed' ? t('home.facesAt', { faces: s.faces }) : phase === 'invited' ? t('home.answerBefore') : t('home.seeOuting');
  return (
    <Tap onPress={() => router.push(target as never)} accessibilityRole="link" accessibilityLabel={`${label}, ${h.day}, ${h.line}`} testID="home-outing" style={{ backgroundColor: v5.ink, borderRadius: 26, padding: 16, gap: 10, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.black }] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <BodyText size={13} weight={800} color={v5.lime}>
          {label}
        </BodyText>
        {unread ? <Pill label={t('outing.messages', { n: unread })} background={v5.rose} color={v5.white} /> : null}
      </View>
      <DisplayText size={34} color={v5.white} heading={false}>
        {h.day}
      </DisplayText>
      <BodyText size={15} weight={700} color={v5.white}>
        {`${timeLabel(o.startsAt)} · ${h.line}`}
      </BodyText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Glyph name="clock" size={14} color={v5.lime} />
        <BodyText size={13} weight={600} color={v5.mist}>
          {note}
        </BodyText>
        <View style={{ marginLeft: 'auto' }}>
          <Glyph name="chevron" size={14} color={v5.white} />
        </View>
      </View>
    </Tap>
  );
}

function BandTile() {
  const band = useBand();
  const names = (band.data?.items ?? []).map((b) => b.user.firstName);
  return (
    <CardV5 onPress={() => router.push(paths.band)} accessibilityLabel={t('home.band')} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
      <DisplayText size={22} heading={false}>
        {t('home.band')}
      </DisplayText>
      <BodyText size={13} weight={700} color={v5.inkSoft} numberOfLines={1}>
        {names.length ? names.join(', ') : t('home.bandEmpty')}
      </BodyText>
    </CardV5>
  );
}

function duoLine(d: DuoView): string {
  if (d.status === 'EXCHANGE' && d.exchange) return t('home.duoFaces', { name: `${d.other.firstName.charAt(0)}.`, when: weekdayShortTime(d.exchange.endsAt) });
  return d.other.firstName;
}

function DuoTile({ duo }: { duo: DuoView | undefined }) {
  return (
    <CardV5 onPress={() => router.push(duo ? paths.duo(duo.id) : paths.duoLane)} accessibilityLabel={t('home.duo')} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
      <DisplayText size={22} heading={false}>
        {t('home.duo')}
      </DisplayText>
      <BodyText size={13} weight={700} color={v5.inkSoft}>
        {duo ? duoLine(duo) : t('home.duoEmpty')}
      </BodyText>
    </CardV5>
  );
}

function DiscreetHome({ o, nav }: { o: OutingView | undefined; nav: ReturnType<typeof useTabs> }) {
  return (
    <TabScreen nav={nav} testID="home-discreet">
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill label={t('home.discreet.agenda')} background={v5.ink} color={v5.white} fontSize={14} padding={[8, 14]} leading={<Glyph name="calendar" size={16} color={v5.white} />} />
        <PauseButton />
      </PopIn>
      {o ? (
        <PopIn delayMs={40} style={{ marginTop: 16 }}>
          <Tap onPress={() => router.push(paths.outing(o.id))} accessibilityRole="link" style={{ backgroundColor: v5.ink, borderRadius: 24, padding: 16, gap: 8, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.black }] }}>
            <BodyText size={13} weight={800} color={v5.lime}>
              {t('home.discreet.next')}
            </BodyText>
            <DisplayText size={30} color={v5.white} heading={false}>
              {`${dayShortCap(o.startsAt)} · ${timeLabel(o.startsAt)}`}
            </DisplayText>
            <BodyText size={13} weight={600} color={v5.mist}>
              {t('home.discreet.details', { lock: schedule(o).lock })}
            </BodyText>
          </Tap>
        </PopIn>
      ) : null}
      <PopIn delayMs={80} style={{ marginTop: 12 }}>
        <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
          <BodyText size={14} weight={800}>
            {t('home.discreet.on')}
          </BodyText>
          <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft}>
            {t('home.discreet.body')}
          </BodyText>
          <Tap onPress={() => router.push(paths.privacy)} accessibilityRole="link" pressDepth={0} style={{ minHeight: 44, justifyContent: 'center' }}>
            <BodyText size={14} weight={800} color={v5.coralText}>
              {t('home.discreet.off')}
            </BodyText>
          </Tap>
        </CardV5>
      </PopIn>
    </TabScreen>
  );
}

function DuoHome({ duo, o, nav, species, petName, now }: { duo: DuoView; o: OutingView | undefined; nav: ReturnType<typeof useTabs>; species: Species; petName: string; now: number }) {
  const sub = duo.exchange ? t('home.duoHome.sub', { when: `${weekdayShortTime(duo.exchange.endsAt).split('\u00A0')[0]} ${dayShortCap(duo.exchange.endsAt).split('\u00A0').slice(1).join('\u00A0')}\u00A0${timeLabel(duo.exchange.endsAt)}` }) : '';
  void now;
  return (
    <TabScreen nav={nav} testID="home-duo">
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PetChip name={petName} species={species} />
        <PauseButton />
      </PopIn>
      {o ? (
        <CardV5 onPress={() => router.push(paths.found)} style={{ marginTop: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <BodyText size={15} weight={800}>
              {t('home.duoHome.group')}
            </BodyText>
            <BodyText size={12} weight={600} color={v5.inkSoft}>
              {t('home.duoHome.groupSub', { day: headline(o, '').day })}
            </BodyText>
          </View>
          <Glyph name="chevron" size={14} />
        </CardV5>
      ) : null}
      <PopIn style={{ marginTop: 12 }}>
        <Tap onPress={() => router.push(paths.duo(duo.id))} accessibilityRole="link" style={{ backgroundColor: v5.ink, borderRadius: 26, padding: 16, gap: 10, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.black }] }}>
          <BodyText size={13} weight={800} color={v5.lime}>
            {t('home.duoHome.label')}
          </BodyText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 17, backgroundColor: v5.rosePale, alignItems: 'center', justifyContent: 'center' }}>
              <Sprite path="hybrid/baby-nino-suzie.webp" size={48} />
            </View>
            <View style={{ gap: 2, flexShrink: 1 }}>
              <DisplayText size={26} color={v5.white} heading={false}>
                {`${duo.status === 'EXCHANGE' ? `${duo.other.firstName.charAt(0)}.` : duo.other.firstName} · ${duo.other.pet.name}`}
              </DisplayText>
              <BodyText size={13} weight={600} color={v5.mist}>
                {sub}
              </BodyText>
            </View>
          </View>
        </Tap>
      </PopIn>
      <CardV5 onPress={() => router.push(paths.duoLane)} style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <BodyText size={15} weight={800}>
            {t('home.duoHome.lane')}
          </BodyText>
          <BodyText size={12} weight={600} color={v5.inkSoft}>
            {t('home.duoHome.laneSub')}
          </BodyText>
        </View>
        <Glyph name="chevron" size={14} />
      </CardV5>
    </TabScreen>
  );
}
