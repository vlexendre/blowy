/**
 * Sur iPhone : le bouton officiel d'Apple (`AppleAuthenticationButton`), comme le demandent ses règles d'interface
 * (libellé « Continuer avec Apple » traduit par le système, logo, proportions). Blanc sur la nuit, arrondi comme les
 * boutons de l'app. Pendant la connexion, il s'estompe et ne répond plus.
 */
import { AuthButton } from '@blowy/ui';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { AppleButtonProps } from './AppleButton';

export function AppleButton({ label, onPress, loading }: AppleButtonProps) {
  const [native, setNative] = useState<boolean | null>(null);
  useEffect(() => {
    void AppleAuthentication.isAvailableAsync().then(setNative, () => setNative(false));
  }, []);
  if (native === false) return <AuthButton provider="apple" label={label} onPress={onPress} loading={loading} />;
  if (native === null) return <View style={{ height: 56 }} />;
  return (
    <View pointerEvents={loading ? 'none' : 'auto'} style={{ opacity: loading ? 0.6 : 1 }} accessibilityState={{ busy: !!loading }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={28}
        style={{ height: 56, width: '100%' }}
        onPress={onPress}
      />
    </View>
  );
}
