import { color } from '@blowy/tokens';
import { BottomTabBar, type BottomTabItem } from '@blowy/ui';
import { Redirect, Tabs } from 'expo-router';

import { useEncounters } from '@/features/encounters';
import { totalUnread, useLinks } from '@/features/links';
import { useGate } from '@/features/session';
import { tabs } from '@/locales/chats';

type TabKey = 'chats' | 'pet' | 'rencontres' | 'moi';
const KEYS: readonly TabKey[] = ['chats', 'pet', 'rencontres', 'moi'];
const isTab = (name: string | undefined): name is TabKey => KEYS.includes(name as TabKey);

/** Onglets principaux : Chats · Mon pet · Rencontres · Moi, sur la barre flottante du design system. */
export default function TabsLayout() {
  const gate = useGate();
  const links = useLinks();
  const encounters = useEncounters();
  const items: BottomTabItem<TabKey>[] = [
    { key: 'chats', label: tabs.chats, glyph: 'chat', badge: totalUnread(links.data) },
    { key: 'pet', label: tabs.pet, glyph: 'heart' },
    { key: 'rencontres', label: tabs.rencontres, glyph: 'people', badge: encounters.data?.incoming.length ?? 0 },
    { key: 'moi', label: tabs.moi, glyph: 'person' },
  ];
  // Session expirée ou fermée pendant qu'on est dans les onglets : retour à l'accueil.
  if (gate === 'signedOut') return <Redirect href="/(onboarding)/welcome" />;
  if (gate === 'needsOnboarding') return <Redirect href="/" />;
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.night } }}
      tabBar={({ state, navigateToTab }) => {
        const current = state.routes[state.index]?.name;
        return (
          <BottomTabBar
            items={items}
            activeKey={isTab(current) ? current : 'chats'}
            accessibilityLabel={tabs.a11y}
            onPress={(key) => {
              const route = state.routes.find((r) => r.name === key);
              if (route && current !== key) navigateToTab(route.key);
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="chats" options={{ title: tabs.chats }} />
      <Tabs.Screen name="pet" options={{ title: tabs.pet }} />
      <Tabs.Screen name="rencontres" options={{ title: tabs.rencontres }} />
      <Tabs.Screen name="moi" options={{ title: tabs.moi }} />
    </Tabs>
  );
}
