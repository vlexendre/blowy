/**
 * Connexion (V6-GConnexion) : « On garde Nino ? » puis « Continuer avec Apple » sur iPhone, « Continuer avec Google » sur
 * Android et le web (jeton du fournisseur → Supabase). Annuler la feuille du fournisseur ne montre rien d'alarmant ; un
 * échec, un message et on peut réessayer. `mode=login` (« J'ai déjà un compte ») : mêmes boutons, panneau « content de
 * te revoir », sans barre. Ensuite `useAfterSignIn` décide : préparation (inscription), l'app (compte existant).
 * Le code par e-mail n'existe plus qu'en mode local (développement), replié sous les boutons.
 */
import { Appear, AuthButton, Banner, Button, LegalNote, OnboardingPanel, OnboardingTemplate, OptionalField, Stack, Text, TextField } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';

import { config, LOCAL_CODE, ScreenMotion } from '@/core';
import { progressAt, useDraft, useStep } from '@/features/onboarding';
import { AppleButton, errorMessage, goBack, useAfterSignIn, useProviders, useSendCode, useSignInWith, useVerifyCode } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.connexion;

export default function Connexion() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const login = mode === 'login';
  const species = useDraft((d) => d.species);
  const draftPet = useDraft((d) => d.petName);
  const petName = draftPet.trim() || common.speciesNames[species];
  // La barre continue : seulement en pleine inscription (un minimoa dans le brouillon).
  const signup = !login && !!draftPet.trim();
  useStep(signup ? 'connexion' : null);
  const providers = useProviders();
  const signIn = useSignInWith();
  const afterSignIn = useAfterSignIn();
  const [cancelled, setCancelled] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<'apple' | 'google' | null>(null);

  const go = (provider: 'apple' | 'google') => {
    setCancelled(false);
    setPendingProvider(provider);
    signIn.mutate(provider, {
      onSuccess: async (session) => {
        if (!session) {
          setCancelled(true);
          setPendingProvider(null);
          return;
        }
        router.replace(await afterSignIn());
      },
      onError: () => setPendingProvider(null),
    });
  };

  const busy = signIn.isPending || (signIn.isSuccess && !!signIn.data);
  const note = providers.includes('apple') && !providers.includes('google') ? t.appleNote : t.googleNote;
  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...(signup ? progressAt('connexion') : {})}
        onBack={() => goBack(login ? '/(onboarding)/welcome' : '/(onboarding)/promesse')}
        backLabel={common.back}
        gap={14}
        actions={
          <Stack gap={10}>
            {providers.includes('apple') ? <AppleButton label={t.apple} onPress={() => go('apple')} loading={busy && pendingProvider === 'apple'} /> : null}
            {providers.includes('google') ? <AuthButton provider="google" label={t.google} onPress={() => go('google')} loading={busy && pendingProvider === 'google'} disabled={busy && pendingProvider !== 'google'} /> : null}
            <Text variant="bodyBold" size={15} center>
              {note}
            </Text>
            <LegalNote
              segments={[
                { text: t.legalLead, strong: true },
                { text: t.legalBefore },
                { text: t.legalTerms, onPress: () => void Linking.openURL(`${config.webUrl}/legal/conditions`) },
                { text: t.legalAnd },
                { text: t.legalPrivacy, onPress: () => void Linking.openURL(`${config.webUrl}/legal/confidentialite`) },
                { text: '.' },
              ]}
            />
            {providers.includes('email') ? <DevEmail /> : null}
          </Stack>
        }
      >
        <OnboardingPanel
          compact
          gradient="accent"
          title={login ? t.loginTitle : t.title(petName)}
          titleSize={58}
          text={login ? t.loginText : t.text}
          chips={login ? undefined : t.chips}
          pet={{ name: petName, species }}
          pose="joie"
        />
        {signIn.isError ? (
          <Appear key="error">
            <Banner tone="error" text={errorMessage(signIn.error, t.errors.failed)} actionLabel={common.retry} onAction={() => pendingProvider && go(pendingProvider)} />
          </Appear>
        ) : cancelled ? (
          <Appear key="cancelled">
            <Banner tone="info" text={t.cancelled} />
          </Appear>
        ) : null}
      </OnboardingTemplate>
    </ScreenMotion>
  );
}

/** Mode local seulement : l'ancien code par e-mail (000000), replié. */
function DevEmail() {
  const email = useDraft((d) => d.email);
  const set = useDraft((d) => d.set);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const send = useSendCode();
  const verify = useVerifyCode();
  const afterSignIn = useAfterSignIn();
  const d = t.dev;
  const submit = () =>
    send.mutate(email, {
      onSuccess: () => verify.mutate({ email, code }, { onSuccess: async () => router.replace(await afterSignIn()) }),
    });
  const error = send.error ?? verify.error;
  return (
    <OptionalField toggleLabel={d.toggle} open={open} onOpen={() => setOpen(true)}>
      <TextField inset label={d.emailLabel} value={email} onChangeText={(v) => set({ email: v })} placeholder={d.emailPlaceholder} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <TextField inset label={d.codeLabel} value={code} onChangeText={setCode} placeholder={LOCAL_CODE} keyboardType="number-pad" maxLength={6} hint={d.hint(LOCAL_CODE)} />
      {error ? <Banner tone="error" text={errorMessage(error)} /> : null}
      <Button label={d.verify} variant="glass" size="sm" onPress={submit} loading={send.isPending || verify.isPending} disabled={!email.trim() || code.length !== 6} />
    </OptionalField>
  );
}
