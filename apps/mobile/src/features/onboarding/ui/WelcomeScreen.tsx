/** 01 · Bienvenue (V5-Welcome) : promesse, 5 pets, « Commencer » / « J'ai déjà un compte ». */
import {
  Blob,
  BodyText,
  Button,
  DisplayText,
  Frame,
  Glyph,
  Pill,
  PopIn,
  TableOfFiveInkArt,
  v5,
} from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { View } from 'react-native';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useOnboarding } from '../model/store';

export function WelcomeScreen() {
  const patch = useOnboarding((s) => s.patch);
  return (
    <Frame
      pad={[56, 22, 22]}
      testID="welcome"
      decor={<Blob size={300} top={-60} right={-110} color={v5.mango} opacity={0.6} />}
    >
      <PopIn
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <DisplayText size={32}>
          {t('brand.name')}
          <DisplayText size={32} color={v5.coralBright} heading={false}>
            .
          </DisplayText>
        </DisplayText>
        <Pill
          label={t('onb.welcome.badge')}
          background={v5.ink}
          color={v5.white}
          padding={[7, 12]}
          leading={<Glyph name="check" size={12} color={v5.lime} />}
        />
      </PopIn>
      <PopIn delayMs={80} style={{ marginTop: 22 }}>
        <DisplayText size={56} lineHeight={0.9}>
          {t('onb.welcome.title1')}
          <DisplayText size={56} lineHeight={0.9} color={v5.coralText} heading={false}>
            {t('onb.welcome.title2')}
          </DisplayText>
        </DisplayText>
      </PopIn>
      <PopIn delayMs={160} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
        <View
          style={{
            backgroundColor: v5.lime,
            borderRadius: 14,
            paddingTop: 2,
            paddingHorizontal: 12,
            paddingBottom: 6,
            transform: [{ rotate: '-2deg' }],
            boxShadow: [
              { offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.ink },
            ],
          }}
        >
          <DisplayText size={30} heading={false} numberOfLines={1}>
            {t('onb.welcome.stamp')}
          </DisplayText>
        </View>
      </PopIn>
      <BodyText size={16} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 16 }}>
        {t('onb.welcome.body')}
      </BodyText>
      <BodyText size={13} weight={700} lh={1.45} style={{ marginTop: 10 }}>
        {t('onb.welcome.everywhere')}
      </BodyText>
      <PopIn
        delayMs={280}
        style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <TableOfFiveInkArt
          petPath="nino/young/presentation.webp"
          a11yLabel={t('onb.welcome.tableA11y')}
        />
      </PopIn>
      <PopIn delayMs={360} style={{ gap: 4 }}>
        <Button
          variant="b1"
          label={t('onb.welcome.start')}
          icon="arrow"
          iconPosition="trailing"
          onPress={() => {
            patch({ step: 'city' });
            router.push(paths.onboarding('city'));
          }}
          testID="welcome-start"
        />
        <Button
          variant="ghost"
          tint={v5.inkSoft}
          label={t('onb.welcome.haveAccount')}
          onPress={() => router.push(paths.account)}
        />
      </PopIn>
    </Frame>
  );
}
