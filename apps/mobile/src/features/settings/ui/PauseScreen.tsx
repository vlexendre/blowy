/** 19 · Pause en 1 tap (V5-Pause) : 1 semaine, 2 semaines, ou jusqu'au retour (`POST /v1/pauses`). */
import { BodyText, Button, DetailScreen, DisplayText, Sprite, strongFont, Tap, v5 } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { dayShort } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useGlobalPause } from '../../account';
import { schedule, useMyOuting } from '../../outings';

/** Durées proposées ; « jusqu'à ce que je revienne » = 14 jours renouvelables (max du contrat). */
const DURATIONS = [
  { key: 'w1', days: 7 },
  { key: 'w2', days: 14 },
  { key: 'open', days: 14 },
] as const;

export function PauseScreen() {
  const [choice, setChoice] = useState<string | null>(null);
  const pause = useGlobalPause();
  const { outing } = useMyOuting();
  const o = outing.data;
  return (
    <DetailScreen title={t('pause.title')} backLabel={t('common.back')} onBack={() => (router.canGoBack() ? router.back() : router.replace(paths.home))} pad={[52, 20, 22]} gap={0} testID="pause">
      <Sprite path="nino/young/asleep.webp" size={120} style={{ marginTop: 10 }} />
      <DisplayText size={32} style={{ marginTop: 4 }}>
        {t('pause.subtitle')}
      </DisplayText>
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 8 }}>
        {o ? t('pause.bodyOuting', { day: dayShort(o.startsAt), lock: schedule(o).lock }) : t('pause.body')}
      </BodyText>
      <View accessibilityRole="radiogroup" style={{ marginTop: 14, gap: 8 }}>
        {DURATIONS.map((d) => {
          const on = choice === d.key;
          return (
            <Tap key={d.key} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={t(`pause.${d.key}`)} onPress={() => setChoice(d.key)} style={{ minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? v5.ink : v5.white, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
              <Text style={[strongFont(20, 0), { color: on ? v5.white : v5.ink }]}>{t(`pause.${d.key}`)}</Text>
            </Tap>
          );
        })}
      </View>
      <View style={{ marginTop: 'auto' }}>
        {choice ? (
          <Button variant="b2" label={t('pause.cta')} loading={pause.isPending} onPress={() => pause.mutate(DURATIONS.find((d) => d.key === choice)!.days, { onSuccess: () => router.replace(paths.home) })} />
        ) : (
          <Button variant="bdis" label={t('pause.idle')} />
        )}
      </View>
    </DetailScreen>
  );
}
