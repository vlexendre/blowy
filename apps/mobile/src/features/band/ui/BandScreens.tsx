/**
 * 35 · Ta bande (V5-Bande) · 36 · Ta rue (V5-Rue) · 42 · Partir proprement (V5-Rupture).
 * Ta rue : pets de ma bande + mes souvenirs en décor ; rien à entretenir, aucune jauge, aucune
 * notification ; une action facultative (offrir un accessoire GAGNÉ).
 */
import type { BandMemberView } from '@blowy/api-contract';
import { BackButton, BodyText, CardV5, DisplayText, Glyph, IconAction, Pill, PopIn, Sprite, TabScreen, Tap, v5, v5Alpha, v5Gradient } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { dayShort } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { useTabs } from '../../../core/navigation/tabs';
import { t, tDynamic } from '../../../i18n';
import { petSprite, useMyPet } from '../../pets';
import { LoadingScreen } from '../../system';
import { useBand, useGiftAccessory, useStreet } from '../api/hooks';

const TILE: Record<string, string> = { PLUS_ONE: v5.peach, OUTING_VOTE: v5.greenPale, DUO_VOTE: v5.rosePale, LEGACY_V4: v5.sand };

function originLine(m: BandMemberView): { text: string; color: string } {
  if (m.origin === 'OUTING_VOTE') return { text: t('band.metAt', { day: dayShort(m.since) }), color: v5.green };
  if (m.origin === 'PLUS_ONE') return { text: t('band.cameWith'), color: v5.inkSoft };
  return { text: tDynamic(`chats.origin.${m.origin}`), color: v5.inkSoft };
}

export function BandScreen() {
  const nav = useTabs('band');
  const band = useBand();
  const pet = useMyPet();
  if (band.isLoading) return <LoadingScreen tab="band" />;
  const items = [...(band.data?.items ?? [])].sort((a, b) => b.since.localeCompare(a.since));
  return (
    <TabScreen nav={nav} pad={[0, 16, 26]} testID="band">
      <PopIn style={{ height: 230, marginHorizontal: -16, overflow: 'hidden', backgroundColor: v5.sky, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.steel }] }}>
        <Sprite path="scenes/park.webp" size={390} height={230} contentFit="cover" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} />
        <DisplayText size={44} style={{ position: 'absolute', left: 16, top: 52 }}>
          {t('band.title')}
        </DisplayText>
        <Pill label={t('band.count', { n: items.length })} background={v5.ink} color={v5.lime} padding={[7, 12]} style={{ position: 'absolute', right: 16, top: 58 }} />
        {[pet.data?.species ?? 'NINO', ...items.slice(0, 2).map((m) => m.pet.species)].map((sp, i) => (
          <Sprite key={i} path={i === 0 ? petSprite(sp) : petSprite(sp, 'joyful')} size={80} style={{ position: 'absolute', left: 60 + i * 95, bottom: 18 }} />
        ))}
      </PopIn>
      <PopIn delayMs={60} style={{ marginTop: 14, gap: 8 }}>
        {items.map((m) => {
          const o = originLine(m);
          return (
            <View key={m.linkId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: v5.white, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
              <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: TILE[m.origin] ?? v5.sand, alignItems: 'center', justifyContent: 'center' }}>
                <Sprite path={petSprite(m.pet.species)} size={41} />
              </View>
              <Tap onPress={() => router.push(paths.chat(m.conversationId))} accessibilityRole="link" accessibilityLabel={`${m.user.firstName}, ${o.text}`} pressDepth={0} style={{ flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center', gap: 2 }}>
                <BodyText size={16} weight={800}>
                  {m.user.firstName}
                  <BodyText size={16} weight={600} color={v5.grey}>
                    {` · ${m.pet.name}`}
                  </BodyText>
                </BodyText>
                <BodyText size={12} weight={600} color={o.color}>
                  {o.text}
                </BodyText>
              </Tap>
              <IconAction glyph="dots" label={t('band.options', { name: m.user.firstName })} background="transparent" glyphColor={v5.inkSoft} onPress={() => router.push({ pathname: paths.leave, params: { link: m.linkId } } as never)} />
            </View>
          );
        })}
      </PopIn>
      {items.length ? (
        <CardV5 onPress={() => router.push(paths.found)} style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Sprite path="lutin/young/network.png" size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <BodyText size={15} weight={800}>
              {t('band.outing')}
            </BodyText>
            <BodyText size={12} weight={600} color={v5.inkSoft}>
              {t('band.outingSub', { names: items.map((m) => m.user.firstName).join(' et ') })}
            </BodyText>
          </View>
          <Glyph name="chevron" size={14} />
        </CardV5>
      ) : (
        <CardV5 style={{ marginTop: 12, padding: 14 }}>
          <BodyText size={14} weight={700} lh={1.45} color={v5.inkSoft}>
            {t('band.empty')}
          </BodyText>
        </CardV5>
      )}
      <Tap onPress={() => router.push(paths.street)} accessibilityRole="link" pressDepth={0} style={{ marginTop: 8, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 }}>
        <BodyText size={14} weight={800}>
          {t('band.street')}
        </BodyText>
        <Glyph name="chevron" size={14} />
      </Tap>
    </TabScreen>
  );
}

const ROOFS = [v5.coralText, v5.violet, v5.green, v5.rose] as const;
const WALLS = [v5.lime, v5.peach, v5.greenPale, v5.rosePale] as const;
const DECOR: Record<string, string> = { OUTING_LIVED: 'scenes/cafe.webp', BAND_NEW_MEMBER: 'effects/confetti.webp', HATCHED: 'accessories/ball.webp', DUO_DATE_LIVED: 'effects/hearts.webp', PROMISE_KEPT: 'effects/spark.webp', EGG: 'eggs/egg-shared.webp' };
const DECOR_POS = [
  { left: 112, bottom: 30, size: 46 },
  { left: 236, top: 34, size: 58 },
  { right: 22, bottom: 34, size: 40 },
] as const;

export function StreetScreen() {
  const nav = useTabs('band');
  const street = useStreet();
  const gift = useGiftAccessory();
  const [given, setGiven] = useState(false);
  if (street.isLoading) return <LoadingScreen tab="band" />;
  const s = street.data;
  const houses = [...(s?.myPet ? [{ key: 'me', name: s.myPet.name, species: s.myPet.species }] : []), ...(s?.residents ?? []).map((r) => ({ key: r.linkId, name: r.pet.name, species: r.pet.species }))].slice(0, 3);
  const decor = (s?.decor ?? []).slice(0, 3);
  const firstResident = s?.residents[0];
  return (
    <TabScreen nav={nav} pad={[52, 16, 26]} testID="street">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.band))} label={t('street.back')} />
      </View>
      <DisplayText size={46} style={{ marginTop: 12 }}>
        {t('street.title')}
      </DisplayText>
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 6 }}>
        {t('street.intro', { n: decor.length })}
      </BodyText>
      <View accessible accessibilityRole="image" accessibilityLabel={t('street.a11y', { names: houses.map((h) => h.name).join(', '), n: decor.length })} style={{ height: 360, marginTop: 14, marginHorizontal: -16, overflow: 'hidden', backgroundImage: v5Gradient.street }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 56, height: 30, backgroundColor: v5.beigeLine }} />
        <View style={{ position: 'absolute', right: 36, top: 26, width: 46, height: 46, borderRadius: 23, backgroundColor: v5.sun }} />
        {houses.map((h, i) => (
          <View key={h.key} style={{ position: 'absolute', left: 18 + i * 122, bottom: 96, width: 110, alignItems: 'center' }}>
            <View style={{ width: 0, height: 0, borderLeftWidth: 55, borderRightWidth: 55, borderBottomWidth: 34, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: ROOFS[i % ROOFS.length] }} />
            <View style={{ width: 96, height: 78, backgroundColor: WALLS[i % WALLS.length], borderBottomLeftRadius: 10, borderBottomRightRadius: 10, alignItems: 'center', justifyContent: 'flex-end', boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5Alpha.ink18 }] }}>
              <Sprite path={petSprite(h.species)} size={66} />
            </View>
            <View style={{ marginTop: 6, backgroundColor: v5.white, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 }}>
              <BodyText size={13} weight={800}>
                {h.name}
              </BodyText>
            </View>
          </View>
        ))}
        {decor.map((d, i) => {
          const pos = DECOR_POS[i] ?? DECOR_POS[0];
          return <Sprite key={d.id} path={DECOR[d.kind] ?? null} size={pos.size} style={{ position: 'absolute', ...pos }} />;
        })}
      </View>
      {firstResident ? (
        <CardV5 style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, gap: 8 }}>
          <BodyText size={12} weight={800} color={v5.inkSoft}>
            {t('street.optional')}
          </BodyText>
          {given ? (
            <BodyText size={14} weight={700}>
              {t('street.given', { pet: firstResident.pet.name, name: firstResident.firstName })}
            </BodyText>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Sprite path="accessories/sunglasses.webp" size={40} />
              <BodyText size={14} weight={700} lh={1.35} style={{ flex: 1 }}>
                {t('street.give', { pet: firstResident.pet.name })}
              </BodyText>
              <Tap onPress={() => gift.mutate({ linkId: firstResident.linkId, accessoryId: 'sunglasses' }, { onSuccess: () => setGiven(true) })} accessibilityLabel={t('street.giveCta')} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: v5.ink, justifyContent: 'center' }}>
                <BodyText size={13} weight={800} color={v5.white}>
                  {t('street.giveCta')}
                </BodyText>
              </Tap>
            </View>
          )}
        </CardV5>
      ) : null}
    </TabScreen>
  );
}
