/**
 * Éclosion (V4-Eclosion) : l'œuf couve, bouge (3 touches), éclot. Réduire les animations :
 * pas de tremblement en boucle, transitions instantanées, annonce vocale à chaque phase.
 */
import { EGGS } from '@blowy/sprites';
import { CelebrationTemplate, PetRenderer, Pressable3D, Sprite, color, petAccessibilityLabel, useA11yPrefs } from '@blowy/ui-mobile';
import { useEffect, useState } from 'react';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { t } from '../../../i18n';
import { petLabelWords, speciesName } from '../../pets';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

export function HatchScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('hatch');
  const { reduceMotion } = useA11yPrefs();
  const [taps, setTaps] = useState(d.hatched ? 3 : 0);
  const born = taps >= 3;
  const name = d.petName.trim() || speciesName(d.species);
  const wobble = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || born) {
      cancelAnimation(wobble);
      wobble.value = 0;
      return;
    }
    const amp = taps === 0 ? 3 : 8;
    wobble.value = withRepeat(withSequence(withTiming(-amp, { duration: 120 }), withTiming(amp, { duration: 120 }), withTiming(0, { duration: 120 })), -1, false);
    return () => cancelAnimation(wobble);
  }, [reduceMotion, born, taps, wobble]);

  useEffect(() => {
    if (born && !d.hatched) d.patch({ hatched: true });
  }, [born, d]);

  const shake = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));
  const egg = EGGS[d.species] ?? EGGS.SHARED;

  const title = born ? t('onboarding.hatch.born', { species: speciesName(d.species).toUpperCase() }) : taps === 0 ? t('onboarding.hatch.incubating') : t('onboarding.hatch.moving');
  return (
    <CelebrationTemplate
      testID="screen-hatch"
      eyebrow={born ? undefined : t('onboarding.hatch.tapEgg')}
      title={title}
      lead={born ? t('onboarding.hatch.bornLead') : t('onboarding.hatch.incubatingLead')}
      confetti={born}
      hero={
        born ? (
          <PetRenderer species={d.species} stage="BABY" pose="JOYFUL" bodyHeight={200} accessibilityLabel={petAccessibilityLabel({ name, pose: 'JOYFUL' }, petLabelWords)} />
        ) : (
          <Pressable3D background={color.ink} shadowColor={color.ink} depth={0} radius={120} onPress={() => setTaps((n) => n + 1)} accessibilityLabel={t('onboarding.hatch.eggA11y', { name, taps })} accessibilityHint={t('onboarding.hatch.tapEgg')} testID="hatch-egg">
            <Animated.View style={shake}>
              <Sprite path={taps >= 2 ? EGGS.CRACKING : egg} size={220} />
            </Animated.View>
          </Pressable3D>
        )
      }
      cta={born ? { label: t('onboarding.hatch.cta', { name }), onPress: nav.next, testID: 'hatch-continue' } : { label: t('onboarding.hatch.tapEgg'), onPress: () => setTaps((n) => n + 1), testID: 'hatch-tap' }}
    />
  );
}

