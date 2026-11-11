/** Compte (V6-Compte) : e-mail → code à 6 chiffres. Après la connexion, l'aiguillage décide de la suite. */
import { color, space } from '@blowy/tokens';
import { Banner, Button, OnboardingTemplate, OtpInput, Panel, PetImage, SpeechBubble, Text, TextField, Title } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { config, LOCAL_CODE } from '@/core';
import { useDraft } from '@/features/onboarding';
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
  const petName = useDraft((d) => d.petName) || common.speciesNames[species];
  const email = useDraft((d) => d.email);
  const set = useDraft((d) => d.set);
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
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
    verify.mutate({ email, code: value }, { onSuccess: async () => router.replace(await afterSignIn()) });
  };

  if (phase === 'code') {
    return (
      <OnboardingTemplate
        step={login ? undefined : 3}
        total={login ? undefined : onboarding.total}
        onBack={() => setPhase('email')}
        backLabel={common.back}
        title={t.codeTitle}
        text={t.codeText(email.trim().toLowerCase())}
        primaryLabel={t.verify}
        primaryDisabled={code.length !== 6}
        primaryLoading={verify.isPending}
        onPrimary={() => submitCode()}
        secondaryLabel={t.changeEmail}
        onSecondary={() => setPhase('email')}
        footnote={devHint}
      >
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (verify.isError) verify.reset();
          }}
          onComplete={submitCode}
          autoFocus
          disabled={verify.isPending}
          error={verify.isError ? errorMessage(verify.error) : null}
          accessibilityLabel={t.codeLabel}
        />
        {resent && !send.isError ? <Banner tone="success" text={t.resent} /> : null}
        {send.isError ? <Banner tone="error" text={errorMessage(send.error)} /> : null}
        <Button
          label={countdown.left > 0 ? t.resendIn(countdown.left) : t.resend}
          variant="ghost"
          size="sm"
          disabled={countdown.left > 0 || send.isPending}
          loading={send.isPending}
          onPress={() => sendCode(true)}
        />
      </OnboardingTemplate>
    );
  }

  return (
    <OnboardingTemplate
      step={login ? undefined : 3}
      total={login ? undefined : onboarding.total}
      onBack={() => goBack(login ? '/(onboarding)/welcome' : '/(onboarding)/caractere')}
      backLabel={common.back}
      primaryLabel={t.sendCode}
      primaryLoading={send.isPending}
      primaryDisabled={!email.trim()}
      onPrimary={() => sendCode()}
      footnote={
        <View style={{ gap: space.xs }}>
          <Text variant="small" muted center>
            {t.legal}
          </Text>
          {devHint}
        </View>
      }
    >
      <Panel gradient="coral" padding="lg" style={{ minHeight: 280 }}>
        <Title text={login ? t.loginTitle : t.titleWaiting(petName)} size={52} />
        <View style={{ flexGrow: 1, minHeight: space.lg }} />
        <View style={{ maxWidth: '62%' }}>
          <SpeechBubble text={t.speech} tail="left" />
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', right: -36, bottom: -36 }}>
          <PetImage species={species} mood="surpris" size={170} outline animation="bob" accessibilityLabel={petName} />
        </View>
      </Panel>
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
      {send.isError ? <Banner tone="error" text={errorMessage(send.error)} /> : null}
    </OnboardingTemplate>
  );
}
