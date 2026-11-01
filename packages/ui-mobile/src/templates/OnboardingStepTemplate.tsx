import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { Header } from '../molecules/Header';
import { ProgressDots } from '../molecules/ProgressDots';
import { ScreenFrame } from './ScreenFrame';

export interface OnboardingStepTemplateProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  illustration?: ReactNode;
  children?: ReactNode;
  cta: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; testID?: string };
  secondary?: { label: string; onPress: () => void; testID?: string };
  step?: { index: number; count: number; label: string };
  onBack?: () => void;
  backLabel?: string;
  banner?: ReactNode;
  testID?: string;
}

/** Étape d'onboarding : sur-titre + titre display + illustration + contenu + CTA collant. */
export function OnboardingStepTemplate({ eyebrow, title, lead, illustration, children, cta, secondary, step, onBack, backLabel, banner, testID }: OnboardingStepTemplateProps) {
  return (
    <ScreenFrame
      testID={testID}
      banner={banner}
      footer={
        <>
          <Button label={cta.label} onPress={cta.onPress} disabled={cta.disabled} loading={cta.loading} testID={cta.testID ?? 'onboarding-next'} />
          {secondary ? <Button label={secondary.label} variant="ghost" onPress={secondary.onPress} testID={secondary.testID} /> : null}
        </>
      }
    >
      <View style={styles.top}>
        {onBack && backLabel ? <Header onBack={onBack} backLabel={backLabel} /> : null}
        {step ? <ProgressDots index={step.index} count={step.count} label={step.label} /> : null}
      </View>
      {eyebrow ? (
        <Text variant="label" tone="coral">
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="displayL">{title}</Text>
      {lead ? (
        <Text variant="body" tone="inkSoft">
          {lead}
        </Text>
      ) : null}
      {illustration ? <View style={styles.illu}>{illustration}</View> : null}
      {children}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  top: { gap: space.sm },
  illu: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.sm },
});
