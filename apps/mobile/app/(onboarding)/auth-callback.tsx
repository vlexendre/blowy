/**
 * Retour de la page de connexion de Google (`blowy://auth-callback`, ou `/auth-callback` sur le web). Le navigateur du
 * système rend l'adresse à l'écran de connexion, qui échange le code ; ici on ne fait que refermer la fenêtre (web) ou
 * revenir à l'écran d'avant (si le système a aussi ouvert ce lien dans l'app).
 */
import { ScreenTemplate, Loader } from '@blowy/ui';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { View } from 'react-native';

import { common } from '@/locales/common';

// Fenêtre ouverte par `openAuthSessionAsync` sur le web : rend l'adresse à la fenêtre d'origine et se ferme.
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
  return (
    <ScreenTemplate scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Loader color="accent" accessibilityLabel={common.loading} />
      </View>
    </ScreenTemplate>
  );
}
