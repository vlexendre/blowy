/** Route inconnue. */
import { EmptyState, ScreenTemplate } from '@blowy/ui';
import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { ScreenMotion } from '@/core';
import { common } from '@/locales/common';

const t = common.notFound;

export default function NotFound() {
  // Le pet, surpris, passe la tête au-dessus du titre (cache-cache : touché, il se cache et ressort).
  return (
    <ScreenMotion>
    <ScreenTemplate scroll={false}>
      <Stack.Screen options={{ title: 'blowy' }} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState peek species="gaston" mood="surpris" seed="not-found" title={t.title} text={t.text} actionLabel={t.action} onAction={() => router.replace('/')} />
      </View>
    </ScreenTemplate>
    </ScreenMotion>
  );
}
