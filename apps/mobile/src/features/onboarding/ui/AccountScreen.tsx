/**
 * Compte (V4-Compte) : fournisseur (Apple/Google via Firebase, ou LocalAuthProvider en dev),
 * date de naissance (pré-contrôle 18+, serveur fait foi), genre déclaré, consentements requis.
 */
import { GENDERS, type Gender } from '@blowy/domain';
import { Banner, Button, Chip, OnboardingStepTemplate, OptionCard, StatusPill, TextField, space } from '@blowy/ui-mobile';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthNotConfiguredError } from '../../../core/adapters/auth';
import { ApiCallError } from '../../../core/api/http';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { t, tDynamic } from '../../../i18n';
import { useConsents, useRecordConsents, useSignIn, useUpdateProfile } from '../../account';
import { speciesName } from '../../pets';
import { ageAt, parseFrenchDate } from '../model/flow';
import { consentsRequest } from '../model/account-step';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

export function AccountScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('account');
  const { auth } = useServices();
  const signedIn = useSession((s) => s.status === 'signedIn');
  const providers = useQuery({ queryKey: ['auth', 'providers'], queryFn: () => auth.available() });
  const signIn = useSignIn();
  const consents = useConsents();
  const record = useRecordConsents();
  const update = useUpdateProfile();
  const [birth, setBirth] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [granted, setGranted] = useState({ terms: false, privacy: false, moderation: false });
  const [error, setError] = useState<string | null>(null);

  const iso = parseFrenchDate(birth);
  const age = iso ? ageAt(iso, new Date()) : null;
  const underage = age !== null && age < 18;
  const ready = signedIn && iso && !underage && gender && granted.terms && granted.privacy;
  const name = d.petName.trim() || speciesName(d.species);

  const doSignIn = async (kind: 'apple' | 'google' | 'local') => {
    setError(null);
    try {
      await signIn.mutateAsync(kind);
    } catch (e) {
      setError(e instanceof AuthNotConfiguredError ? t('onboarding.account.providerUnavailable', { provider: kind === 'apple' ? 'Apple' : 'Google' }) : t('onboarding.account.failed'));
    }
  };

  const submit = async () => {
    if (!iso || !gender) return;
    setError(null);
    try {
      await update.mutateAsync({ birthDate: iso, gender, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const req = consentsRequest(consents.data, granted);
      if (req) await record.mutateAsync(req);
      nav.next();
    } catch (e) {
      setError(e instanceof ApiCallError && e.code === 'AGE_RESTRICTED' ? t('onboarding.account.underage') : t('onboarding.account.failed'));
    }
  };

  return (
    <OnboardingStepTemplate
      testID="screen-account"
      step={nav.step}
      onBack={nav.back}
      backLabel={nav.backLabel}
      eyebrow={t('onboarding.account.eyebrow')}
      title={t('onboarding.account.title', { name })}
      lead={t('onboarding.account.lead')}
      banner={error ? <Banner message={error} tone="danger" live /> : null}
      cta={{ label: t('common.continue'), onPress: submit, disabled: !ready, loading: update.isPending || record.isPending, testID: 'account-continue' }}
    >
      {!signedIn ? (
        <View style={{ gap: space.sm }}>
          {providers.data?.includes('apple') ? <Button label={t('onboarding.account.apple')} variant="dark" icon="lock" onPress={() => doSignIn('apple')} loading={signIn.isPending} /> : null}
          {providers.data?.includes('google') ? <Button label={t('onboarding.account.google')} variant="secondary" onPress={() => doSignIn('google')} loading={signIn.isPending} /> : null}
          {providers.data?.includes('local') ? (
            <>
              <Button label={t('onboarding.account.local')} variant="secondary" onPress={() => doSignIn('local')} loading={signIn.isPending} testID="account-local" />
              <StatusPill kind="demo" label={t('onboarding.account.localNote')} />
            </>
          ) : null}
        </View>
      ) : (
        <StatusPill kind="confirmed" label={t('common.confirmed')} />
      )}
      <TextField
        label={t('onboarding.account.birthLabel')}
        hint={t('onboarding.account.birthLead')}
        value={birth}
        onChangeText={setBirth}
        keyboardType="numbers-and-punctuation"
        placeholder="14/03/1998"
        error={birth.length >= 8 && !iso ? t('onboarding.account.birthInvalid') : underage ? t('onboarding.account.underage') : null}
        testID="birthdate"
      />
      <View style={{ gap: space.xs }}>
        <Chip label={t('onboarding.account.genderLabel')} tone="cream" size="sm" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          {GENDERS.map((g) => (
            <Chip key={g} label={tDynamic(`onboarding.gender.${g}`)} selected={gender === g} onPress={() => setGender(g)} testID={`gender-${g}`} />
          ))}
        </View>
      </View>
      <OptionCard mode="checkbox" title={t('onboarding.account.consentTerms')} selected={granted.terms} onPress={() => setGranted((g) => ({ ...g, terms: !g.terms }))} testID="consent-terms" />
      <OptionCard mode="checkbox" title={t('onboarding.account.consentPrivacy')} selected={granted.privacy} onPress={() => setGranted((g) => ({ ...g, privacy: !g.privacy }))} testID="consent-privacy" />
      <OptionCard mode="checkbox" title={t('onboarding.account.consentModeration')} selected={granted.moderation} onPress={() => setGranted((g) => ({ ...g, moderation: !g.moderation }))} testID="consent-moderation" />
      {!granted.moderation ? <Banner message={t('onboarding.account.consentRequired')} tone="cream" icon="lock" /> : null}
      <Chip label={t('onboarding.account.terms')} tone="cream" size="sm" />
    </OnboardingStepTemplate>
  );
}
