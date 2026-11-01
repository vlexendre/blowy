/**
 * Connexion locale de développement : choix d'un compte de démo du seed ou clé libre
 * (nouveau compte → onboarding). Rendu uniquement si `localAuthEnabled(env)` ; sinon redirection.
 */
import { Banner, DetailScreenTemplate, ListRow, StatusPill, Surface, TextField, Button, space } from '@blowy/ui-mobile';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { env, localAuthEnabled } from '../../../core/config/env';
import { paths } from '../../../core/navigation/paths';
import { t, tDynamic } from '../../../i18n';
import { useSignIn } from '../api/hooks';
import { DEMO_ACCOUNTS, isValidLocalKey } from '../model/demo-accounts';

export interface DevLoginScreenProps {
  /** Après connexion : profil onboardé → Nid ; sinon reprise d'onboarding. */
  onSignedIn: (onboardingRequired: boolean) => void;
}

export function DevLoginScreen({ onSignedIn }: DevLoginScreenProps) {
  const signIn = useSignIn();
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!localAuthEnabled(env)) return <Redirect href={paths.root} />;

  const go = async (demoKey: string) => {
    setError(null);
    try {
      const r = await signIn.mutateAsync({ kind: 'local', demoKey });
      onSignedIn(r.session.onboardingRequired);
    } catch {
      setError(t('devLogin.failed', { url: env.apiUrl }));
    }
  };

  return (
    <DetailScreenTemplate title={t('devLogin.title')} lead={t('devLogin.lead')} onBack={() => router.back()} backLabel={t('common.back')} testID="screen-dev-login" banner={error ? <Banner message={error} tone="danger" live /> : null}>
      <StatusPill kind="demo" label={t('devLogin.badge', { url: env.apiUrl })} />
      <Surface padding="sm">
        {DEMO_ACCOUNTS.map((a) => (
          <ListRow key={a.key} icon="profile" title={a.key} subtitle={tDynamic(a.descKey)} onPress={() => void go(a.key)} testID={`dev-login-${a.key}`} />
        ))}
      </Surface>
      <View style={{ gap: space.sm }}>
        <TextField label={t('devLogin.custom')} hint={t('devLogin.customHint')} value={custom} onChangeText={setCustom} autoCapitalize="none" autoCorrect={false} testID="dev-login-custom" />
        <Button label={t('devLogin.connect')} variant="secondary" disabled={!isValidLocalKey(custom)} loading={signIn.isPending} onPress={() => void go(custom.trim().toLowerCase())} />
      </View>
    </DetailScreenTemplate>
  );
}
