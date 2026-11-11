/** Route inconnue. */
import { EmptyState, ScreenTemplate } from '@blowy/ui';
import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { common } from '@/locales/common';

const t = common.notFound;

export default function NotFound() {
  return (
    <ScreenTemplate scroll={false}>
      <Stack.Screen options={{ title: 'blowy' }} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState species="gaston" mood="surpris" title={t.title} text={t.text} actionLabel={t.action} onAction={() => router.replace('/')} />
      </View>
    </ScreenTemplate>
  );
}
