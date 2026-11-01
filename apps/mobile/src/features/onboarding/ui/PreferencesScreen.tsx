/**
 * Préférences minimales de rencontre : âge, distance, genres recherchés. Défauts affichés et
 * modifiables ; jamais déduits d'Apple/Google. PUT /v1/preferences/matching.
 * La création du pet principal (POST /v1/pets) se fait ici, une fois le compte prêt.
 */
import { GENDERS, type Gender } from '@blowy/domain';
import { Banner, Chip, NumberStepper, OnboardingStepTemplate, SectionTitle, Surface, space } from '@blowy/ui-mobile';
import { useState } from 'react';
import { View } from 'react-native';
import { isUnavailable } from '../../../core/api/http';
import { t, tDynamic } from '../../../i18n';
import { useMe, useSavePreferences } from '../../account';
import { useCreatePet } from '../../pets';
import { defaultPreferences } from '../model/flow';
import { petCreationRequest } from '../model/account-step';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

export function PreferencesScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('preferences');
  const me = useMe();
  const save = useSavePreferences();
  const createPet = useCreatePet();
  const [prefs, setPrefs] = useState(() => defaultPreferences(me.data?.age ?? null, d.intention ?? 'LET_IT_HAPPEN'));
  const [error, setError] = useState<string | null>(null);
  const toggle = (g: Gender) => setPrefs((p) => ({ ...p, seekingGenders: p.seekingGenders.includes(g) ? p.seekingGenders.filter((x) => x !== g) : [...p.seekingGenders, g] }));

  const submit = async () => {
    setError(null);
    try {
      await save.mutateAsync({ ...prefs, seekingGenders: prefs.seekingGenders.length ? prefs.seekingGenders : [...GENDERS] });
      if (!d.petCreated) {
        const body = petCreationRequest(d, false);
        if (body) {
          try {
            await createPet.mutateAsync(body);
            d.patch({ petCreated: true });
          } catch (e) {
            // Endpoint pets pas encore livré : le brouillon reste local, on réessaiera au Nid.
            if (!isUnavailable(e)) throw e;
          }
        }
      }
      nav.next();
    } catch {
      setError(t('common.errorBody'));
    }
  };

  return (
    <OnboardingStepTemplate
      testID="screen-preferences"
      step={nav.step}
      onBack={nav.back}
      backLabel={nav.backLabel}
      eyebrow={t('onboarding.preferences.eyebrow')}
      title={t('onboarding.preferences.title')}
      lead={t('onboarding.preferences.lead')}
      banner={error ? <Banner message={error} tone="danger" live /> : null}
      cta={{ label: t('common.continue'), onPress: submit, loading: save.isPending || createPet.isPending, testID: 'preferences-continue' }}
    >
      <Surface style={{ gap: space.sm }}>
        <NumberStepper decreaseLabel={t('onboarding.preferences.decrease')} increaseLabel={t('onboarding.preferences.increase')} label={t('onboarding.preferences.ageMin')} value={prefs.ageMin} min={18} max={prefs.ageMax} onChange={(ageMin) => setPrefs((p) => ({ ...p, ageMin }))} />
        <NumberStepper decreaseLabel={t('onboarding.preferences.decrease')} increaseLabel={t('onboarding.preferences.increase')} label={t('onboarding.preferences.ageMax')} value={prefs.ageMax} min={prefs.ageMin} max={99} onChange={(ageMax) => setPrefs((p) => ({ ...p, ageMax }))} />
        <NumberStepper decreaseLabel={t('onboarding.preferences.decrease')} increaseLabel={t('onboarding.preferences.increase')} label={t('onboarding.preferences.distance', { km: prefs.maxDistanceKm })} value={prefs.maxDistanceKm} min={1} max={200} onChange={(maxDistanceKm) => setPrefs((p) => ({ ...p, maxDistanceKm }))} />
      </Surface>
      <SectionTitle label={t('onboarding.preferences.genders')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
        <Chip label={t('onboarding.preferences.allGenders')} selected={prefs.seekingGenders.length === 0} onPress={() => setPrefs((p) => ({ ...p, seekingGenders: [] }))} />
        {GENDERS.filter((g) => g !== 'UNDISCLOSED').map((g) => (
          <Chip key={g} label={tDynamic(`onboarding.gender.${g}`)} selected={prefs.seekingGenders.includes(g)} onPress={() => toggle(g)} />
        ))}
      </View>
      <Banner message={t('onboarding.preferences.zoneHint')} tone="cream" icon="pin" />
    </OnboardingStepTemplate>
  );
}
