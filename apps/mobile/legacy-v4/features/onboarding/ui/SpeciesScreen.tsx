import { SPECIES, VISION_AXES, type VisionAxis } from '@blowy/domain';
import { Banner, LabeledSlider, OnboardingStepTemplate, PetCarousel, PetRenderer, TextField, petAccessibilityLabel } from '@blowy/ui-mobile';
import { t, tDynamic } from '../../../i18n';
import { petLabelWords, speciesName } from '../../pets';
import { axisBucket, canContinue, isPremium } from '../model/flow';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

/** Choix du pet + preview premium honnête + 4 curseurs (V4-Craft). */
export function SpeciesScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('species');
  const name = d.petName.trim() || speciesName(d.species);
  const axisValue = (a: VisionAxis) => {
    const left = t(`vision.axis.${a}.left`);
    const right = t(`vision.axis.${a}.right`);
    return tDynamic(`vision.axisValue.${axisBucket(d.axes[a])}`, { left: left.toLowerCase(), right: right.toLowerCase() });
  };
  return (
    <OnboardingStepTemplate
      testID="screen-species"
      step={nav.step}
      onBack={nav.back}
      backLabel={nav.backLabel}
      eyebrow={t('onboarding.species.eyebrow')}
      title={t('onboarding.species.title')}
      lead={t('onboarding.species.lead')}
      illustration={<PetRenderer species={d.species} stage="YOUNG" pose="PRESENTATION" bodyHeight={150} accessibilityLabel={petAccessibilityLabel({ name, pose: 'PRESENTATION' }, petLabelWords)} />}
      cta={{ label: t('common.continue'), onPress: nav.next, disabled: !canContinue(d, 'species'), testID: 'species-continue' }}
    >
      <PetCarousel
        options={SPECIES.map((s) => ({
          species: s,
          name: speciesName(s),
          tag: isPremium(s) ? t('tabs.plus') : null,
          accessibilityLabel: isPremium(s) ? t('species.premiumA11y', { name: speciesName(s) }) : speciesName(s),
        }))}
        selected={d.species}
        onSelect={(species) => d.patch({ species, premiumDeclined: false })}
      />
      {isPremium(d.species) ? <Banner message={t('onboarding.species.premiumNote', { name: speciesName(d.species) })} tone="violet" icon="star" /> : null}
      <TextField
        label={t('onboarding.species.nameLabel')}
        placeholder={speciesName(d.species)}
        value={d.petName}
        onChangeText={(petName) => d.patch({ petName })}
        maxLength={24}
        autoCapitalize="words"
        error={d.petName.length > 0 && !canContinue(d, 'species') ? t('onboarding.species.nameError') : null}
        testID="pet-name"
      />
      {VISION_AXES.map((a) => (
        <LabeledSlider
          key={a}
          left={t(`vision.axis.${a}.left`)}
          right={t(`vision.axis.${a}.right`)}
          value={d.axes[a]}
          onChange={(v) => d.patch({ axes: { ...d.axes, [a]: v } })}
          accessibilityLabel={t('vision.axisA11y', { left: t(`vision.axis.${a}.left`), right: t(`vision.axis.${a}.right`) })}
          valueText={axisValue(a)}
          testID={`axis-${a}`}
        />
      ))}
    </OnboardingStepTemplate>
  );
}
