/**
 * Semaines off (V5-Dispos-semaines, V5.4 §B9) : « une semaine sur deux, à partir de… ». Envoyé à
 * l'API (`everyOtherWeekOffFrom`) quand une session existe ; pendant l'onboarding, retenu sur
 * l'appareil puis envoyé avec les préférences.
 */
import {
  BodyText,
  Button,
  CardV5,
  ChoicePills,
  DetailScreen,
  Glyph,
  SectionLabel,
  Tap,
  v5,
} from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { clock } from '../../../core/clock';
import { civil, dayShort } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useOutingPreferences, useSaveOutingPreferences } from '../../account';
import { useDevicePrefs } from '../model/device-prefs';
import { alternateMondays, isoWeekKey, nextMondays } from '../model/weeks';

const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** « 16, 30 nov., 14, 28 déc.… » */
export function skippedLine(mondays: number[]): string {
  const parts: string[] = [];
  let month = -1;
  let days: number[] = [];
  const flush = () => days.length && parts.push(`${days.join(', ')} ${MONTHS[month]}`);
  for (const m of mondays) {
    const c = civil(m);
    if (c.month - 1 !== month) {
      flush();
      month = c.month - 1;
      days = [];
    }
    days.push(c.day);
  }
  flush();
  return `${parts.join(', ')}…`;
}

export function WeeksScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const onboarding = from === 'onboarding';
  const prefs = useOutingPreferences();
  const save = useSaveOutingPreferences();
  const setPrefs = useDevicePrefs((s) => s.set);
  const stored = useDevicePrefs((s) => s.weeksAlternate);
  const options = useMemo(() => nextMondays(clock.now()), []);
  const [on, setOn] = useState(true);
  const [start, setStart] = useState<string | null>(
    stored?.fromWeek ?? new Date(options[0]!).toISOString().slice(0, 10),
  );
  const startT = start ? Date.parse(`${start}T00:00:00Z`) : null;
  const leave = () =>
    router.canGoBack()
      ? router.back()
      : router.replace((onboarding ? paths.onboarding('slots') : paths.settings) as never);
  const onSave = () => {
    setPrefs({ weeksAlternate: on && start ? { fromWeek: start } : null });
    // V5.5 : le contrat porte l'alternance (`everyOtherWeekOffFrom`, semaine ISO de départ).
    if (prefs.data && startT !== null)
      save.mutate(
        { ...prefs.data, everyOtherWeekOffFrom: on ? isoWeekKey(startT) : null },
        { onSettled: leave },
      );
    else leave();
  };
  return (
    <DetailScreen
      title={t('weeks5.title')}
      titleSize={38}
      backLabel={t('common.back')}
      onBack={leave}
      pad={[52, 16, 22]}
      gap={10}
      testID="weeks"
    >
      <Tap
        onPress={() => setOn(!on)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        pressDepth={0}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minHeight: 52,
          paddingHorizontal: 14,
          borderRadius: 16,
          backgroundColor: v5.ink,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            backgroundColor: on ? v5.lime : v5.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {on ? <Glyph name="check" size={14} /> : null}
        </View>
        <BodyText size={15} weight={800} color={v5.white}>
          {t('weeks5.toggle')}
        </BodyText>
      </Tap>
      {on ? (
        <>
          <SectionLabel style={{ marginTop: 6 }}>{t('weeks5.from')}</SectionLabel>
          <ChoicePills
            label={t('weeks5.fromA11y')}
            options={options.map((m) => ({
              key: new Date(m).toISOString().slice(0, 10),
              label: t('weeks5.since', { day: dayShort(m) }),
            }))}
            value={start}
            onChange={setStart}
          />
          {startT !== null ? (
            <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
              <BodyText size={14} weight={800}>
                {t('weeks5.without', { list: skippedLine(alternateMondays(startT, 4)) })}
              </BodyText>
              <BodyText size={12} weight={600} color={v5.inkSoft}>
                {t('weeks5.note')}
              </BodyText>
            </CardV5>
          ) : null}
        </>
      ) : null}
      <Tap
        onPress={() => router.push(paths.pause)}
        accessibilityRole="link"
        pressDepth={0}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <BodyText size={13} weight={800}>
          {t('weeks5.oneByOne')}
        </BodyText>
      </Tap>
      <View style={{ marginTop: 'auto' }}>
        <Button
          variant="b2"
          label={t('weeks5.save')}
          loading={save.isPending}
          onPress={onSave}
          testID="weeks-save"
        />
      </View>
    </DetailScreen>
  );
}
