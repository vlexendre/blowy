/**
 * « Cette semaine, pas encore » (V5-Pas-encore, V5.5 D-061) : état honnête calculé pour la VILLE et
 * MES créneaux, avant toute composition (`OutingWeekView.storyFeasibility`). Ne désigne personne.
 * L'indicateur de ville (`GET /v1/me/city-insights`) n'est affiché qu'arrondi et ≥ 10.
 */
import { BodyText, Button, CardV5, DisplayText, Frame, Glyph, Pill, v5 } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { View } from 'react-native';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useCityInsights, useMyNeighborhood } from '../../account';
import { useFriendsThisWeek, useWeek } from '../api/hooks';

export function NotYetScreen() {
  const week = useWeek();
  const hood = useMyNeighborhood();
  const insights = useCityInsights();
  const friends = useFriendsThisWeek();
  const city = (hood.data?.neighborhood?.name ?? '').split(/[ ·]/)[0] ?? '';
  const story = insights.data?.storyCompatible;
  const line = !insights.data
    ? t('notYet.unavailable')
    : !story || 'notEnough' in story
      ? t('notYet.notEnough')
      : story.label;
  return (
    <Frame pad={[56, 18, 22]} gap={10} testID="not-yet">
      <View style={{ flexDirection: 'row' }}>
        <Pill
          label={t('notYet.chip', { city })}
          background={v5.white}
          shadow={v5.shadowCream}
          padding={[7, 12]}
          leading={<Glyph name="pin" size={12} />}
        />
      </View>
      <DisplayText size={36} lineHeight={0.92} style={{ marginTop: 16 }}>
        {t('notYet.title')}
      </DisplayText>
      <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft}>
        {t('notYet.body')}
      </BodyText>
      <BodyText size={12} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('notYet.how')}
      </BodyText>
      <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
        <BodyText size={14} weight={800}>
          {t('notYet.inCity', { city })}
        </BodyText>
        <BodyText size={13} weight={600} color={v5.inkSoft}>
          {line}
        </BodyText>
      </CardV5>
      <View style={{ marginTop: 'auto', gap: 4 }}>
        <Button
          variant="b2"
          label={t('notYet.friends')}
          loading={friends.isPending}
          onPress={() =>
            week.data &&
            friends.mutate(week.data.weekKey, { onSuccess: () => router.replace(paths.home) })
          }
          testID="not-yet-friends"
        />
        <Button
          variant="ghost"
          tint={v5.ink}
          label={t('notYet.wait')}
          onPress={() => router.replace(paths.home)}
        />
      </View>
    </Frame>
  );
}
