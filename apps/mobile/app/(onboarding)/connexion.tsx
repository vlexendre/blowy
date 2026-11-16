/**
 * Connexion (V6-GConnexion) : « On garde Nino ? » puis « Continuer avec Apple » sur iPhone, « Continuer avec Google » sur
 * Android et le web (jeton du fournisseur → Supabase). Annuler la feuille du fournisseur ne montre rien d'alarmant ; un
 * échec, un message et on peut réessayer. `mode=login` (« J'ai déjà un compte ») : mêmes boutons, panneau « content de
 * te revoir », sans barre. Ensuite `useAfterSignIn` décide : préparation (inscription), l'app (compte existant).
 * « Connexion par e-mail », repliée sous les boutons : pour les comptes qui ont reçu un code (le compte de revue
 * d'Apple : adresse et code configurés sur le serveur, `POST /v1/review/session`). Toute autre adresse reçoit
 * « Adresse ou code incorrect. ». En mode local, le code de développement (000000) marche aussi.
 */
import { Appear, AuthButton, Banner, Button, LegalNote, OnboardingPanel, OnboardingTemplate, OptionalField, Stack, Text, TextField } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';

import { config, LOCAL_CODE, ScreenMotion } from '@/core';
import { progressAt, useDraft, useStep } from '@/features/onboarding';
import { AppleButton, errorMessage, goBack, useAfterSignIn, useEmailCodeSignIn, useProviders, useSignInWith } from '@/features/session';
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
            <EmailSignIn devHint={providers.includes('email')} />
          </Stack>
        }
      >
        <OnboardingPanel
          compact
          gradient="accent"
          title={login ? t.loginTitle : t.title(petName)}
          titleSize={58}
          text={login ? t.loginText : t.text}
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

/**
 * Connexion par e-mail et code, repliée : visible de tous (rien de caché à la revue), utile seulement aux comptes qui
 * ont reçu un code (compte de revue d'Apple). En mode local, rappel du code de développement.
 */
function EmailSignIn({ devHint }: { devHint: boolean }) {
  const email = useDraft((d) => d.email);
  const set = useDraft((d) => d.set);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const signIn = useEmailCodeSignIn();
  const afterSignIn = useAfterSignIn();
  const e = t.email;
  const submit = () => signIn.mutate({ email, code }, { onSuccess: async () => router.replace(await afterSignIn()) });
  return (
    <OptionalField toggleLabel={e.toggle} open={open} onOpen={() => setOpen(true)}>
      <Text size={13} muted>
        {e.lead}
      </Text>
      <TextField inset label={e.emailLabel} value={email} onChangeText={(v) => set({ email: v })} placeholder={e.emailPlaceholder} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <TextField
        inset
        label={e.codeLabel}
        value={code}
        onChangeText={setCode}
        placeholder={devHint ? LOCAL_CODE : e.codePlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!devHint}
        maxLength={64}
        hint={devHint ? t.dev.hint(LOCAL_CODE) : undefined}
      />
      {signIn.error ? <Banner tone="error" text={errorMessage(signIn.error)} /> : null}
      <Button label={e.submit} variant="glass" size="sm" onPress={submit} loading={signIn.isPending} disabled={!email.trim() || code.trim().length < 4} />
    </OptionalField>
  );
}
