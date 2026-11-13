/**
 * Compte (V6-Compte) : e-mail → code à 6 chiffres. À l'inscription, c'est le pet qui demande (hôte, barre continue) ;
 * en connexion (« j'ai déjà un compte »), le panneau « content de te revoir ». Après la connexion, `useAfterSignIn`
 * décide de la suite (préparation si le brouillon est complet, création du pet sinon, ou l'app).
 */
import { color } from '@blowy/tokens';
import { Appear, Banner, Button, LegalNote, OnboardingPanel, OnboardingTemplate, OtpInput, Shake, Text, TextField } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';

import { config, LOCAL_CODE, ScreenMotion } from '@/core';
import { progressAt, useDraft } from '@/features/onboarding';
import { errorMessage, goBack, useAfterSignIn, useCountdown, useSendCode, useVerifyCode } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.compte;
const RESEND_AFTER = 30;
const looksLikeEmail = (v: string): boolean => /^\S+@\S+\.\S+$/.test(v.trim());

export default function Compte() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const login = mode === 'login';
  const species = useDraft((d) => d.species);
  const draftPet = useDraft((d) => d.petName);
  const petName = draftPet || common.speciesNames[species];
  // L'hôte et la barre continue : seulement en pleine inscription (un pet dans le brouillon).
  const signup = !login && !!draftPet.trim();
  const email = useDraft((d) => d.email);
  const set = useDraft((d) => d.set);
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailShake, setEmailShake] = useState(0);
  const send = useSendCode();
  const verify = useVerifyCode();
  const afterSignIn = useAfterSignIn();
  const countdown = useCountdown(RESEND_AFTER);

  const devHint =
    config.auth === 'local' ? (
      <Text variant="small" center color={color.ok}>
        {t.devHint(LOCAL_CODE)}
      </Text>
    ) : null;

  const sendCode = (again = false) => {
    if (!looksLikeEmail(email)) {
      setEmailError(t.invalidEmail);
      setEmailShake((n) => n + 1);
      return;
    }
    setEmailError(null);
    send.mutate(email, {
      onSuccess: () => {
        setPhase('code');
        setCode('');
        setResent(again);
        verify.reset();
        countdown.start();
      },
    });
  };

  const submitCode = (value = code) => {
    if (value.length !== 6 || verify.isPending) return;
    // La coche se dessine pendant que l'aiguillage cherche la suite (rien n'attend l'animation).
    verify.mutate({ email, code: value }, { onSuccess: async () => router.replace(await afterSignIn()) });
  };

  if (phase === 'code') {
    return (
      <ScreenMotion>
      <OnboardingTemplate
        key="code"
        {...(signup ? progressAt('code') : {})}
        onBack={() => setPhase('email')}
        backLabel={common.back}
        host={signup ? { species, line: t.hostCode, note: t.codeText(email.trim().toLowerCase()), seed: petName, name: petName } : undefined}
        title={signup ? undefined : t.codeTitle}
        text={signup ? undefined : t.codeText(email.trim().toLowerCase())}
        primaryLabel={t.verify}
        primaryDisabled={code.length !== 6}
        primaryLoading={verify.isPending}
        onPrimary={() => submitCode()}
        secondaryLabel={t.changeEmail}
        onSecondary={() => setPhase('email')}
        footnote={devHint}
        keyboardPeek={signup ? undefined : { species }}
      >
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (verify.isError) verify.reset();
          }}
          onComplete={submitCode}
          autoFocus
          disabled={verify.isPending || verify.isSuccess}
          error={verify.isError ? errorMessage(verify.error) : null}
          success={verify.isSuccess}
          accessibilityLabel={t.codeLabel}
        />
        {resent && !send.isError ? (
          <Appear key="resent">
            <Banner tone="success" text={t.resent} />
          </Appear>
        ) : null}
        {send.isError ? (
          <Appear key="send-error">
            <Banner tone="error" text={errorMessage(send.error)} />
          </Appear>
        ) : null}
        <Button
          label={countdown.left > 0 ? t.resendIn(countdown.left) : t.resend}
          variant="ghost"
          size="sm"
          disabled={countdown.left > 0 || send.isPending}
          loading={send.isPending}
          onPress={() => sendCode(true)}
        />
      </OnboardingTemplate>
      </ScreenMotion>
    );
  }

  return (
    <ScreenMotion>
    <OnboardingTemplate
      key="email"
      {...(signup ? progressAt('email') : {})}
      onBack={() => goBack(login ? '/(onboarding)/welcome' : '/(onboarding)/promesse')}
      host={signup ? { species, line: t.hostEmail, note: t.speech, seed: petName, name: petName } : undefined}
      backLabel={common.back}
      gap={16}
      primaryLabel={t.sendCode}
      primaryLoading={send.isPending}
      primaryDisabled={!email.trim()}
      onPrimary={() => sendCode()}
      footnote={
        <>
          <LegalNote
            segments={[
              { text: t.legalLead, strong: true },
              { text: t.legalBefore },
              { text: t.legalTerms, onPress: () => void Linking.openURL(`${config.webUrl}/conditions`) },
              { text: t.legalAnd },
              { text: t.legalPrivacy, onPress: () => void Linking.openURL(`${config.webUrl}/confidentialite`) },
              { text: '.' },
            ]}
          />
          {devHint}
        </>
      }
    >
      {signup ? null : <OnboardingPanel title={t.loginTitle} pet={{ name: petName, species }} speech={t.speech} />}
      <Shake trigger={emailShake}>
      <TextField
        label={t.emailLabel}
        hint={t.emailHint}
        error={emailError}
        value={email}
        onChangeText={(v) => {
          set({ email: v });
          if (emailError) setEmailError(null);
          if (send.isError) send.reset();
        }}
        placeholder={t.emailPlaceholder}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => sendCode()}
      />
      </Shake>
      {send.isError ? (
        <Appear key="send-error">
          <Banner tone="error" text={errorMessage(send.error)} />
        </Appear>
      ) : null}
    </OnboardingTemplate>
    </ScreenMotion>
  );
}
