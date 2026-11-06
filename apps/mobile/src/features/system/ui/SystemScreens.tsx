/**
 * États transverses V5 : Chargement (V5-Chargement, squelettes + « Nino compose… »), Pas de
 * connexion (V5-Erreur-reseau), erreur générique et « indisponible » honnête (route absente).
 */
import {
  BodyText,
  Button,
  CardV5,
  DisplayText,
  Frame,
  Glyph,
  Skeleton,
  Sprite,
  TabScreen,
  v5,
} from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { View } from 'react-native';
import { paths } from '../../../core/navigation/paths';
import { useTabs, type TabKey } from '../../../core/navigation/tabs';
import { t } from '../../../i18n';

export function LoadingScreen({ tab = 'home' }: { tab?: TabKey }) {
  const nav = useTabs(tab);
  return (
    <TabScreen nav={nav} testID="loading">
      <View
        accessibilityLabel={t('common.loading')}
        accessible
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Skeleton width={110} height={36} radius={999} />
        <Skeleton width={90} height={44} />
      </View>
      <View
        style={{
          marginTop: 14,
          borderRadius: 26,
          backgroundColor: v5.ink,
          padding: 16,
          gap: 10,
          alignItems: 'center',
        }}
      >
        <Sprite path="nino/young/phone.webp" size={110} />
        <DisplayText size={26} color={v5.white} heading={false} style={{ textAlign: 'center' }}>
          {t('system.loading.title')}
        </DisplayText>
        <BodyText size={13} weight={600} color={v5.mist} align="center">
          {t('system.loading.body')}
        </BodyText>
      </View>
      <View style={{ marginTop: 12, gap: 10 }}>
        <Skeleton height={70} radius={22} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton height={80} radius={22} style={{ flex: 1 }} width="auto" />
          <Skeleton height={80} radius={22} style={{ flex: 1 }} width="auto" />
        </View>
      </View>
    </TabScreen>
  );
}

export function OfflineScreen({ body, onRetry }: { body?: string; onRetry?: () => void }) {
  return (
    <Frame pad={[56, 20, 26]} testID="offline">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 30,
            backgroundColor: v5.white,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: [
              { offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream },
            ],
          }}
        >
          <Glyph name="wifiOff" size={46} color={v5.ink} color2={v5.danger} />
        </View>
        <DisplayText size={40} style={{ marginTop: 6, textAlign: 'center' }}>
          {t('system.offline.title')}
        </DisplayText>
        <BodyText
          size={15}
          weight={600}
          lh={1.5}
          color={v5.inkSoft}
          align="center"
          style={{ maxWidth: 300 }}
        >
          {body ?? t('system.offline.body')}
        </BodyText>
        <CardV5
          style={{ marginTop: 6, paddingVertical: 12, paddingHorizontal: 14, alignSelf: 'stretch' }}
        >
          <BodyText size={13} weight={700} lh={1.45}>
            {t('system.offline.tip')}
          </BodyText>
        </CardV5>
      </View>
      <Button
        variant="b2"
        label={t('system.offline.retry')}
        onPress={onRetry ?? (() => router.replace(paths.home))}
      />
    </Frame>
  );
}

/** État « indisponible » : la route API n'existe pas encore (jamais de donnée inventée). */
export function UnavailableNote({ what }: { what: string }) {
  return (
    <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
      <BodyText size={13} weight={700} lh={1.45} color={v5.inkSoft}>
        {t('system.unavailable', { what })}
      </BodyText>
    </CardV5>
  );
}

export function ErrorScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <Frame pad={[56, 20, 26]} testID="error">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Sprite path="nino/young/sad.webp" size={120} />
        <DisplayText size={36} style={{ textAlign: 'center' }}>
          {t('system.error.title')}
        </DisplayText>
        <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft} align="center">
          {t('system.error.body')}
        </BodyText>
      </View>
      <Button
        variant="b2"
        label={t('system.offline.retry')}
        onPress={onRetry ?? (() => router.replace(paths.home))}
      />
    </Frame>
  );
}
