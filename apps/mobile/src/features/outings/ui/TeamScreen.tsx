/**
 * 13 · « Viens avec quelqu'un » (V5-Team) : moi + proches (team 1–3, `GET /v1/teams/mine`),
 * case « Si quelqu'un veut venir » → invitation personnelle (lien unique, message seulement).
 */
import { BackButton, BodyText, Button, CardV5, CheckLine, DisplayText, Frame, Glyph, Sprite, Tap, v5 } from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { petSprite, useMyPet } from '../../pets';
import { useTeam } from '../api/hooks';

function MemberCard({ sprite, name, verified, tile }: { sprite: string; name: string; verified: boolean; tile: string }) {
  return (
    <CardV5 style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 60, height: 60, borderRadius: 19, backgroundColor: tile, alignItems: 'center', justifyContent: 'center' }}>
        <Sprite path={sprite} size={51} />
      </View>
      <BodyText size={14} weight={800}>
        {name}
      </BodyText>
      {verified ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Glyph name="check" size={12} color={v5.green} />
          <BodyText size={12} weight={700} color={v5.green}>
            {t('team.verified')}
          </BodyText>
        </View>
      ) : (
        <BodyText size={12} weight={700} color={v5.grey}>
          {t('team.notVerified')}
        </BodyText>
      )}
    </CardV5>
  );
}

export function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const team = useTeam();
  const pet = useMyPet();
  const members = team.data?.team.members ?? [];
  const others = members.filter((m) => !m.me);
  const meVerified = members.find((m) => m.me)?.verified ?? false;
  const count = 1 + others.length;
  return (
    <Frame pad={[52, 20, 22]} testID="team">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.found))} label={t('common.back')} />
      </View>
      <DisplayText size={44} lineHeight={0.92} style={{ marginTop: 16 }}>
        {t('team.title')}
      </DisplayText>
      <BodyText size={15} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('team.intro')}
      </BodyText>
      <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
        <MemberCard sprite={petSprite(pet.data?.species ?? 'NINO')} name={t('outing.group.me')} verified={meVerified} tile={v5.lime} />
        {others.slice(0, 2).map((m) => (
          <MemberCard key={m.userId} sprite={petSprite(m.pet.species)} name={m.firstName} verified={m.verified} tile={v5.peach} />
        ))}
        {others.length < 2 ? (
          <Tap accessibilityLabel={t('team.addA11y')} onPress={() => router.push(paths.share('invitation'))} testID="team-add" style={{ flex: 1, borderRadius: 22, borderWidth: 2.5, borderStyle: 'dashed', borderColor: v5.greyWarm, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 120 }}>
            <Glyph name="plus" size={26} color={v5.coralText} />
            <BodyText size={13} weight={800} color={v5.coralText} align="center">
              {t('team.add')}
            </BodyText>
          </Tap>
        ) : null}
      </View>
      <View style={{ marginTop: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: v5.white, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
        <Glyph name="lock" size={22} color={v5.ink} color2={v5.white} />
        <View style={{ flex: 1, gap: 5 }}>
          <CheckLine text={t('team.l1')} />
          <CheckLine text={t('team.l2')} />
          <CheckLine text={t('team.l3')} />
        </View>
      </View>
      <View style={{ marginTop: 'auto', gap: 2 }}>
        <Button variant="b2" label={count > 1 ? t('team.done', { n: count }) : t('team.solo')} onPress={() => (id ? router.replace(paths.outing(id)) : router.back())} />
        <Button variant="ghost" tint={v5.inkSoft} label={t('team.inviteOther')} onPress={() => router.push(paths.share('invitation'))} />
      </View>
    </Frame>
  );
}
