/**
 * Les 4 écrans de vision (école, dimanche, passions ≤4, limite) partagent une seule
 * structure : options + carte de vision qui se remplit en direct (V4-Vie).
 */
import { LIMITS, MAX_PASSIONS, PASSIONS, SCHOOLS, SUNDAYS, type Limit, type Passion, type School, type Sunday } from '@blowy/domain';
import { resolveSprite } from '@blowy/sprites';
import { OnboardingStepTemplate, OptionCard, VisionCard, space } from '@blowy/ui-mobile';
import { View } from 'react-native';
import { t, tDynamic } from '../../../i18n';
import { speciesName } from '../../pets';
import { canContinue, togglePassion, type OnboardingDraft } from '../model/flow';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

export type VisionStep = 'school' | 'sunday' | 'passions' | 'limit';

interface StepSpec {
  options: readonly string[];
  labelKey: (v: string) => string;
  selected: (d: OnboardingDraft) => readonly string[];
  apply: (d: OnboardingDraft, v: string) => Partial<OnboardingDraft>;
  multi?: boolean;
}

const SPECS: Record<VisionStep, StepSpec> = {
  school: { options: SCHOOLS, labelKey: (v) => `vision.school.${v}`, selected: (d) => (d.school ? [d.school] : []), apply: (_d, v) => ({ school: v as School }) },
  sunday: { options: SUNDAYS, labelKey: (v) => `vision.sunday.${v}`, selected: (d) => (d.sunday ? [d.sunday] : []), apply: (_d, v) => ({ sunday: v as Sunday }) },
  passions: { options: PASSIONS, labelKey: (v) => `vision.passion.${v}`, selected: (d) => d.passions, apply: (d, v) => ({ passions: togglePassion(d.passions, v as Passion) }), multi: true },
  limit: { options: LIMITS, labelKey: (v) => `vision.limit.${v}`, selected: (d) => (d.limit ? [d.limit] : []), apply: (_d, v) => ({ limit: v as Limit }) },
};

export function VisionStepScreen({ step }: { step: VisionStep }) {
  const d = useOnboarding();
  const nav = useOnboardingNav(step);
  const spec = SPECS[step];
  const chosen = spec.selected(d);
  const full = spec.multi && chosen.length >= MAX_PASSIONS;
  return (
    <OnboardingStepTemplate
      testID={`screen-vision-${step}`}
      step={nav.step}
      onBack={nav.back}
      backLabel={nav.backLabel}
      eyebrow={step === 'passions' ? t('onboarding.vision.passions.count', { count: chosen.length }) : undefined}
      title={tDynamic(`onboarding.vision.${step}.title`)}
      lead={tDynamic(`onboarding.vision.${step}.lead`)}
      cta={{ label: t('common.continue'), onPress: nav.next, disabled: !canContinue(d, step), testID: 'vision-continue' }}
    >
      <View style={{ gap: space.sm }} accessibilityRole={spec.multi ? undefined : 'radiogroup'}>
        {spec.options.map((o) => {
          const on = chosen.includes(o);
          return (
            <OptionCard
              key={o}
              title={tDynamic(spec.labelKey(o))}
              selected={on}
              mode={spec.multi ? 'checkbox' : 'radio'}
              disabled={!on && full}
              onPress={() => d.patch(spec.apply(d, o))}
              testID={`option-${o}`}
            />
          );
        })}
      </View>
      <VisionCard
        petName={d.petName.trim() || speciesName(d.species)}
        speciesLabel={tDynamic(`species.kind.${d.species}`)}
        spritePath={resolveSprite(d.species, 'YOUNG', 'PRESENTATION').path}
        pendingLabel={t('vision.card.pending')}
        rows={[
          { key: 'school', label: t('vision.card.school'), value: d.school ? tDynamic(`vision.school.${d.school}`) : null },
          { key: 'sunday', label: t('vision.card.sunday'), value: d.sunday ? tDynamic(`vision.sunday.${d.sunday}`) : null },
          { key: 'passions', label: t('vision.card.passions'), value: d.passions.length ? d.passions.map((p) => tDynamic(`vision.passion.${p}`)).join(', ') : null },
          { key: 'limit', label: t('vision.card.limit'), value: d.limit ? tDynamic(`vision.limit.${d.limit}`) : null },
        ]}
      />
    </OnboardingStepTemplate>
  );
}
