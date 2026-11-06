/**
 * Affiner (V5.5 §B5, §C8) : « Ambiance » (`OutingPreferencesV5.ambiance`) et « Âge pour une
 * histoire » (`IntentionsV5.storyAgeBrackets`, V5.6). Secrets : jamais montrés au groupe.
 */
import { AMBIANCES, type Ambiance } from '@blowy/domain';
import {
  BodyText,
  Button,
  ChoicePills,
  DetailScreen,
  NoteCard,
  Row,
  RowGroup,
  Switch,
  Tap,
  v5,
} from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import {
  useIntentions,
  useOutingPreferences,
  useSaveIntentions,
  useSaveOutingPreferences,
} from '../../account';

const back = () => (router.canGoBack() ? router.back() : router.replace(paths.refine));

export function AmbianceScreen() {
  const prefs = useOutingPreferences();
  const save = useSaveOutingPreferences();
  const [pick, setPick] = useState<Ambiance | null>(null);
  const cur = pick ?? prefs.data?.ambiance ?? 'ANY';
  const [badgePick, setBadge] = useState<boolean | null>(null);
  const badge = badgePick ?? prefs.data?.showCalmBadge ?? false;
  return (
    <DetailScreen
      title={t('ambiance.title')}
      titleSize={36}
      backLabel={t('common.back')}
      onBack={back}
      pad={[52, 20, 22]}
      gap={10}
      testID="ambiance"
    >
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('ambiance.intro')}
      </BodyText>
      <ChoicePills
        label={t('ambiance.title')}
        minHeight={52}
        shadow={v5.shadowCream}
        options={AMBIANCES.map((k) => ({ key: k, label: t(`ambiance.opt.${k}`) }))}
        value={cur}
        onChange={setPick}
      />
      <NoteCard lines={[t('ambiance.note')]} />
      {cur === 'CALM' ? (
        <RowGroup>
          <Row
            first
            wrap
            label={t('ambiance.calmBadge')}
            sub={t('ambiance.calmBadgeSub')}
            trailing={
              <Switch
                value={badge}
                onValueChange={setBadge}
                accessibilityLabel={t('ambiance.calmBadge')}
              />
            }
          />
        </RowGroup>
      ) : null}
      <View style={{ marginTop: 'auto' }}>
        <Button
          variant="b2"
          label={t('ambiance.save')}
          disabled={!prefs.data}
          loading={save.isPending}
          onPress={() =>
            prefs.data &&
            save.mutate(
              { ...prefs.data, ambiance: cur, showCalmBadge: cur === 'CALM' && badge },
              { onSuccess: back },
            )
          }
        />
      </View>
    </DetailScreen>
  );
}

const BRACKETS = [
  '18_21',
  '22_25',
  '26_29',
  '30_34',
  '35_39',
  '40_44',
  '45_49',
  '50_PLUS',
] as const;
type Bracket = (typeof BRACKETS)[number];

export function StoryAgeScreen() {
  const intentions = useIntentions();
  const put = useSaveIntentions();
  const i = intentions.data;
  const [mine, setPicked] = useState<Bracket[] | null>(null);
  const picked = mine ?? i?.storyAgeBrackets ?? [];
  /** Hors « une histoire », le serveur refuse les tranches : on le dit au lieu d'échouer. */
  const story = !!i && i.lookingFor !== 'FRIENDS';
  const toggle = (k: Bracket) =>
    setPicked(
      picked.includes(k)
        ? picked.filter((x) => x !== k)
        : BRACKETS.filter((b) => b === k || picked.includes(b)),
    );
  const rows: Bracket[][] = [];
  BRACKETS.forEach((k, i) => (i % 2 === 0 ? rows.push([k]) : rows[rows.length - 1]!.push(k)));
  return (
    <DetailScreen
      title={t('storyAge.title')}
      titleSize={36}
      backLabel={t('common.back')}
      onBack={back}
      pad={[52, 20, 22]}
      gap={10}
      testID="story-age"
    >
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('storyAge.introV55')}
      </BodyText>
      <View
        accessibilityRole="none"
        accessibilityLabel={t('storyAge.groupA11y')}
        style={{ gap: 8 }}
      >
        {rows.map((row) => (
          <View key={row[0]} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((k) => {
              const on = picked.includes(k);
              return (
                <Tap
                  key={k}
                  onPress={() => toggle(k)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  pressDepth={0}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? v5.ink : v5.white,
                    boxShadow: [
                      {
                        offsetX: 0,
                        offsetY: 3,
                        blurRadius: 0,
                        spreadDistance: 0,
                        color: v5.shadowCream,
                      },
                    ],
                  }}
                >
                  <BodyText size={13} weight={800} color={on ? v5.white : v5.ink}>
                    {t(`storyAge.opt.${k}`)}
                  </BodyText>
                </Tap>
              );
            })}
          </View>
        ))}
      </View>
      {picked.length ? (
        <BodyText size={13} weight={800}>
          {t('storyAge.checked', { list: picked.map((k) => t(`storyAge.opt.${k}`)).join(', ') })}
        </BodyText>
      ) : null}
      <NoteCard lines={[t('storyAge.noteV55')]} />
      {i && !story ? (
        <BodyText size={13} weight={700} color={v5.inkSoft} accessibilityLiveRegion="polite">
          {t('storyAge.friendsOnly')}
        </BodyText>
      ) : null}
      {put.isError ? (
        <BodyText size={13} weight={700} color={v5.danger} accessibilityLiveRegion="polite">
          {t('storyAge.failed')}
        </BodyText>
      ) : null}
      <View style={{ marginTop: 'auto' }}>
        <Button
          variant="b2"
          label={t('storyAge.save')}
          disabled={!story}
          loading={put.isPending}
          onPress={() =>
            i &&
            put.mutate({ ...i, kidsSomeday: null, storyAgeBrackets: picked }, { onSuccess: back })
          }
        />
      </View>
    </DetailScreen>
  );
}
