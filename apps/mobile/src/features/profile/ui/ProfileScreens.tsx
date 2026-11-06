/**
 * 45 · Profil (V5-Profil) · 46 · Fiche du pet (V5-Fiche : souvenirs, fiabilité privée, accessoires
 * gagnés — rien ne se vend). Souvenirs : `GET /v1/pets/mine/memories` (contrat publié, route non
 * servie par l'API au 2026-11-06 → « indisponible »).
 */
import type { PetMemoryView } from '@blowy/api-contract';
import { ageBracketOf } from '@blowy/domain';
import { BackButton, BodyText, CardV5, DisplayText, Glyph, IconAction, PopIn, Portrait, Sprite, TabScreen, Tap, Frame, v5, v5Alpha, v5Gradient } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { View } from 'react-native';
import { civil } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { useTabs } from '../../../core/navigation/tabs';
import { t } from '../../../i18n';
import { useMe, useMyNeighborhood } from '../../account';
import { useBand } from '../../band';
import { bracketLabel, useReliability } from '../../outings';
import { petSprite, useMemories, useMyPet } from '../../pets';
import { UnavailableNote } from '../../system';

const PRONOUN: Record<string, string> = { MAN: 'il', WOMAN: 'elle', NON_BINARY: 'iel', UNDISCLOSED: '' };

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <CardV5 style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 4 }}>
      <DisplayText size={26} heading={false}>
        {value}
      </DisplayText>
      <BodyText size={12} weight={700} lh={1.25} color={v5.inkSoft} align="center">
        {label}
      </BodyText>
    </CardV5>
  );
}

export function ProfileScreen() {
  const nav = useTabs('profile');
  const me = useMe();
  const hood = useMyNeighborhood();
  const rel = useReliability();
  const band = useBand();
  const pet = useMyPet();
  const memories = useMemories();
  const m = me.data;
  const sub = [m ? PRONOUN[m.gender] : '', m?.age ? bracketLabel(ageBracketOf(m.age)) : '', hood.data?.neighborhood?.name ?? '', m?.verification.status === 'VERIFIED' ? t('profile.verified') : ''].filter(Boolean).join(' · ');
  const memCount = memories.data?.items.length;
  return (
    <TabScreen nav={nav} pad={[0, 16, 26]} testID="profile">
      <PopIn style={{ marginHorizontal: -16, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: v5.ink, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.black }] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <DisplayText size={26} color={v5.white}>
            {t('brand.name')}
            <DisplayText size={26} color={v5.coralBright} heading={false}>
              .
            </DisplayText>
          </DisplayText>
          <IconAction glyph="gear" glyphSize={20} label={t('profile.settings')} background={v5Alpha.white16} glyphColor={v5.white} onPress={() => router.push(paths.settings)} />
        </View>
        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View accessible accessibilityRole="image" accessibilityLabel={t('profile.faceA11y')} style={{ width: 80, height: 80 }}>
            <Portrait who="alex" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 26 }} />
            {m?.verification.status === 'VERIFIED' ? (
              <View style={{ position: 'absolute', right: -6, bottom: -6, width: 28, height: 28, borderRadius: 14, backgroundColor: v5.lime, borderWidth: 3, borderColor: v5.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Glyph name="check" size={14} color={v5.ink} />
              </View>
            ) : null}
          </View>
          <View style={{ gap: 4, flexShrink: 1 }}>
            <DisplayText size={38} color={v5.white}>
              {m?.displayName ?? ''}
            </DisplayText>
            <BodyText size={13} weight={600} color={v5.mist}>
              {sub}
            </BodyText>
            {m && PRONOUN[m.gender] ? (
              <Tap onPress={() => router.push(paths.onboarding('gender'))} accessibilityRole="link" pressDepth={0} style={{ minHeight: 44, justifyContent: 'center' }}>
                <BodyText size={12} weight={800} color={v5.lime}>
                  {t('profile.pronoun', { p: PRONOUN[m.gender] ?? '' })}
                </BodyText>
              </Tap>
            ) : null}
          </View>
        </View>
        <BodyText size={12} weight={600} color={v5.mist} style={{ marginTop: 10 }}>
          {t('profile.groupSees')}
        </BodyText>
      </PopIn>
      <PopIn delayMs={40} style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
        <Stat value={rel.data ? t('profile.reliability', { a: rel.data.attended, b: rel.data.total }) : '–'} label={t('profile.reliabilityLabel')} />
        <Stat value={String(band.data?.items.length ?? 0)} label={t('profile.bandLabel')} />
        <Stat value={memCount === undefined ? '–' : String(memCount)} label={t('profile.memoriesLabel', { pet: pet.data?.name ?? '' })} />
      </PopIn>
      <CardV5 onPress={() => router.push(paths.pet)} style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Sprite path={petSprite(pet.data?.species ?? 'NINO')} size={54} />
        <View style={{ flex: 1, gap: 2 }}>
          <DisplayText size={22} heading={false}>
            {pet.data?.name ?? ''}
          </DisplayText>
          <BodyText size={12} weight={600} color={v5.inkSoft}>
            {memCount === undefined ? t('profile.petSubNoMemories') : t('profile.petSub', { n: memCount })}
          </BodyText>
        </View>
        <Glyph name="chevron" size={14} />
      </CardV5>
      <CardV5 onPress={() => router.push(paths.refine)} style={{ marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: v5.lime, alignItems: 'center', justifyContent: 'center' }}>
          <Sprite path={petSprite(pet.data?.species ?? 'NINO', 'dance')} size={44} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <DisplayText size={22} heading={false}>
            {t('profile.refine')}
          </DisplayText>
          <BodyText size={12} weight={600} color={v5.inkSoft}>
            {t('profile.refineSub')}
          </BodyText>
        </View>
        <Glyph name="chevron" size={14} />
      </CardV5>
      <CardV5 onPress={() => router.push(paths.plus)} style={{ marginTop: 10, paddingHorizontal: 14, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BodyText size={15} weight={800}>
          {t('profile.plus')}
        </BodyText>
        <BodyText size={12} weight={600} color={v5.grey} style={{ marginLeft: 'auto' }}>
          {t('profile.plusValue')}
        </BodyText>
        <Glyph name="chevron" size={14} />
      </CardV5>
      <CardV5 onPress={() => router.push(paths.cards)} style={{ marginTop: 10, paddingHorizontal: 14, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Glyph name="share" size={18} />
        <BodyText size={15} weight={800}>
          {t('profile.cards')}
        </BodyText>
        <BodyText size={12} weight={600} color={v5.grey} style={{ marginLeft: 'auto' }}>
          {t('profile.cardsValue')}
        </BodyText>
        <Glyph name="chevron" size={14} />
      </CardV5>
    </TabScreen>
  );
}

const MEMORY_SPRITE: Record<string, string> = { OUTING_LIVED: 'accessories/ball.webp', HATCHED: 'eggs/egg-nino.webp', DUO_DATE_LIVED: 'effects/hearts.webp', PROMISE_KEPT: 'effects/spark.webp', EGG: 'eggs/egg-shared.webp' };
const MEMORY_TILE = [v5.peach, v5.lime, v5.greenPale] as const;

function memoryLabel(m: PetMemoryView): string {
  if (m.kind === 'BAND_NEW_MEMBER') return t('pet.memory.band', { pet: m.data.otherPetName ?? '' });
  if (m.kind === 'OUTING_LIVED') return t('pet.memory.outing', { venue: m.data.venueName ?? '' });
  return t(`pet.memory.${m.kind}` as never);
}

export function PetSheetScreen() {
  const pet = useMyPet();
  const memories = useMemories();
  const rel = useReliability();
  const items = [...(memories.data?.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-3);
  return (
    <Frame pad={[0, 16, 24]} testID="pet-sheet">
      <PopIn style={{ marginHorizontal: -16, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, backgroundImage: v5Gradient.mango, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.rust }] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.profile))} label={t('common.back')} />
          <Tap onPress={() => router.push(paths.story)} accessibilityRole="link" pressDepth={0} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: v5.ink }}>
            <Glyph name="share" size={14} color={v5.white} />
            <BodyText size={12} weight={800} color={v5.white}>
              {t('pet.share', { pet: pet.data?.name ?? '' })}
            </BodyText>
          </Tap>
        </View>
        <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Sprite path="nino/baby/presentation.webp" size={120} />
          <View style={{ gap: 6, flexShrink: 1 }}>
            <DisplayText size={50}>{pet.data?.name ?? ''}</DisplayText>
            <BodyText size={14} weight={700}>
              {t('pet.wears')}
            </BodyText>
          </View>
        </View>
      </PopIn>
      <PopIn delayMs={60} style={{ marginTop: 14 }}>
        <CardV5 style={{ padding: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <DisplayText size={24} heading={false}>
              {memories.data ? t('pet.memories', { n: memories.data.items.length }) : t('pet.memoriesTitle')}
            </DisplayText>
            <BodyText size={12} weight={700} color={v5.grey}>
              {t('pet.earned')}
            </BodyText>
          </View>
          {memories.data ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {items.map((m, i) => {
                const c = civil(m.createdAt);
                return (
                  <View key={m.id} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: MEMORY_TILE[i % 3], borderWidth: 3, borderStyle: 'dashed', borderColor: v5Alpha.ink25, alignItems: 'center', justifyContent: 'center' }}>
                      <Sprite path={m.data.otherPetSpecies ? petSprite(m.data.otherPetSpecies) : (MEMORY_SPRITE[m.kind] ?? null)} size={46} />
                    </View>
                    <BodyText size={12} weight={800} lh={1.2} align="center">
                      {memoryLabel(m)}
                    </BodyText>
                    <BodyText size={12} weight={600} color={v5.grey}>
                      {`${c.day} ${['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][c.month - 1]}`}
                    </BodyText>
                  </View>
                );
              })}
            </View>
          ) : (
            <UnavailableNote what={t('pet.memoriesTitle')} />
          )}
        </CardV5>
      </PopIn>
      <CardV5 style={{ marginTop: 12, padding: 14, gap: 8 }}>
        <DisplayText size={24} heading={false}>
          {t('pet.reliability')}
        </DisplayText>
        <BodyText size={16} weight={800}>
          {rel.data ? t('pet.came', { a: rel.data.attended, b: rel.data.total }) : '–'}
        </BodyText>
        <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft}>
          {t('pet.reliabilityNote')}
        </BodyText>
      </CardV5>
      <CardV5 style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <DisplayText size={20} heading={false}>
          {t('pet.accessories')}
        </DisplayText>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 6 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: v5.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Sprite path="accessories/sunglasses.webp" size={34} />
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: v5.sand, alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
            <Glyph name="lock" size={20} color={v5.inkSoft} color2={v5.sand} />
          </View>
        </View>
      </CardV5>
      <BodyText size={12} weight={600} color={v5.inkSoft} style={{ marginTop: 6 }}>
        {t('pet.next', { n: (memories.data?.items.length ?? 0) + 1 })}
      </BodyText>
    </Frame>
  );
}
