import { color } from '@blowy/tokens';
import { BottomTabBar, type BottomTabItem } from '@blowy/ui';
import { Redirect, Tabs, useIsFocused } from 'expo-router';

import { useEncounters } from '@/features/encounters';
import { totalUnread, useLinks } from '@/features/links';
import { usePet } from '@/features/pet';
import { useGate } from '@/features/session';
import { useWidgetSync } from '@/features/widgets';
import { useNotificationsBridge } from '@/features/notifications';
import { tabs } from '@/locales/chats';

/** Onglet de départ quand on arrive directement sur un autre (lien profond, rechargement web). */
export const unstable_settings = { initialRouteName: 'pet' };

type TabKey = 'pet' | 'quartier' | 'chats' | 'moi';
const KEYS: readonly TabKey[] = ['pet', 'quartier', 'chats', 'moi'];
const isTab = (name: string | undefined): name is TabKey => KEYS.includes(name as TabKey);

/**
 * Onglets principaux (ADA 2027, décision 8) : Minimoa · Quartier · Chats · Moi, chacun avec son libellé visible sous le
 * pictogramme, sur la barre flottante du design system. Quartier réunit la carte et les présentations du jour (les
 * anciens liens `/carte` et `/rencontres` y mènent, par `src/features/notifications/url.ts`). VoiceOver lit le rôle, l'état et la pastille (« Chats, 3 non lus »).
 */
export default function TabsLayout() {
  const gate = useGate();
  // Widgets iOS et activités en direct (no-op ailleurs).
  useWidgetSync(gate);
  // Notification touchée (même app fermée) → son écran ; appareil réenregistré au retour au premier plan.
  useNotificationsBridge(gate);
  const links = useLinks();
  const encounters = useEncounters();
  const pet = usePet().data?.pet;
  // Faux quand un écran est poussé par-dessus les onglets (lien, garde-robe…) : aucun pet décoratif alors.
  const focused = useIsFocused();
  const hellos = encounters.data?.incoming.length ?? 0;
  const unread = totalUnread(links.data);
  const items: BottomTabItem<TabKey>[] = [
    { key: 'pet', label: tabs.pet, glyph: 'heart' },
    {
      key: 'quartier',
      label: tabs.quartier,
      glyph: 'pin',
      badge: hellos,
      accessibilityLabel: hellos > 0 ? tabs.badgeA11y.quartier(tabs.quartier, hellos) : undefined,
    },
    {
      key: 'chats',
      label: tabs.chats,
      glyph: 'chat',
      badge: unread,
      accessibilityLabel: unread > 0 ? tabs.badgeA11y.chats(tabs.chats, unread) : undefined,
    },
    { key: 'moi', label: tabs.moi, glyph: 'person' },
  ];
  // Session expirée ou fermée pendant qu'on est dans les onglets : retour à l'accueil.
  if (gate === 'signedOut') return <Redirect href="/(onboarding)/welcome" />;
  if (gate === 'needsOnboarding') return <Redirect href="/" />;
  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.night } }}
        tabBar={({ state, navigateToTab }) => {
          const current = state.routes[state.index]?.name;
          return (
            <BottomTabBar
              items={items}
              activeKey={isTab(current) ? current : 'pet'}
              accessibilityLabel={tabs.a11y}
              // Rarement, le pet passe la tête au-dessus de l'onglet choisi (budget dans @blowy/ui : ~1 sur 10, 3 min de pause).
              peek={pet && focused ? { species: pet.species, mood: 'joie', seed: pet.id } : undefined}
              onPress={(key) => {
                const route = state.routes.find((r) => r.name === key);
                if (route && current !== key) navigateToTab(route.key);
              }}
            />
          );
        }}
      >
        <Tabs.Screen name="pet" options={{ title: tabs.pet }} />
        <Tabs.Screen name="quartier" options={{ title: tabs.quartier }} />
        <Tabs.Screen name="chats" options={{ title: tabs.chats }} />
        <Tabs.Screen name="moi" options={{ title: tabs.moi }} />
      </Tabs>
      {/* Retour dans l'app : le salut est joué par le minimoa de l'accueil lui-même (`useHelloWave`), rien par-dessus le contenu. */}
    </>
  );
}
