/**
 * Lien « 3 mots » d'un ou une amie (https://minimoa.app/m/CODE, minimoa://m/CODE) ouvert dans l'app : on vote sur le
 * site, ouvert ici dans le navigateur de l'app (`?web=1` : jamais renvoyé vers l'app). Son propre lien : l'onglet Moi.
 */
import { Loader, ScreenTemplate } from '@blowy/ui';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { wordsUrl } from '@/core';
import { useMe } from '@/features/me';
import { useGate } from '@/features/session';
import { common } from '@/locales/common';

export default function WordsLink() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? '').trim();
  const gate = useGate();
  const me = useMe(gate === 'ready');
  const done = useRef(false);
  const waiting = gate === 'loading' || (gate === 'ready' && me.isPending);

  useEffect(() => {
    if (done.current || waiting) return;
    done.current = true;
    if (!code) return void router.replace('/');
    if (me.data?.wordsCode === code) return void router.replace('/(tabs)/moi');
    void WebBrowser.openBrowserAsync(`${wordsUrl(encodeURIComponent(code))}?web=1`)
      .catch(() => undefined)
      .finally(() => router.replace('/'));
  }, [waiting, code, me.data]);

  return (
    <ScreenTemplate scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Loader color="accent" accessibilityLabel={common.loading} />
      </View>
    </ScreenTemplate>
  );
}
