import { color } from '@blowy/tokens';
import { BottomTabBar, type BottomTabItem } from '@blowy/ui';
import { Redirect, Tabs, useIsFocused } from 'expo-router';

import { useEncounters } from '@/features/encounters';
import { GROUPS_IN_V1, useGroups } from '@/features/groups';
import { totalUnread, useLinks } from '@/features/links';
import { usePet } from '@/features/pet';
import { useGate } from '@/features/session';
import { useWidgetSync } from '@/features/widgets';
import { useNotificationsBridge } from '@/features/notifications';
import { tabs } from '@/locales/chats';

/** Onglet de départ quand on arrive directement sur un autre (lien profond, rechargement web). */
export const unstable_settings = { initialRouteName: 'pet' };

type TabKey = 'chats' | 'pet' | 'carte' | 'rencontres' | 'moi';
const KEYS: readonly TabKey[] = ['pet', 'carte', 'rencontres', 'chats', 'moi'];
const isTab = (name: string | undefined): name is TabKey => KEYS.includes(name as TabKey);

/**
 * Onglets principaux (maquette V7) : Mon minimoa · Carte · Rencontres · Chats · Moi, pictogrammes seuls sur la barre
 * flottante du design system. La carte est un onglet : elle se voit, et ses limites (ta zone) donnent envie de Minimoa+.
 */
export default function TabsLayout() {
  const gate = useGate();
  // Widgets iOS et activités en direct (no-op ailleurs).
  useWidgetSync(gate);
  // Notification touchée (même app fermée) → son écran ; appareil réenregistré au retour au premier plan.
  useNotificationsBridge(gate);
  const links = useLinks();
  const groups = useGroups();
  const encounters = useEncounters();
  const pet = usePet().data?.pet;
  // Faux quand un écran est poussé par-dessus les onglets (lien, garde-robe…) : aucun pet décoratif alors.
  const focused = useIsFocused();
  const items: BottomTabItem<TabKey>[] = [
    { key: 'pet', label: tabs.pet, glyph: 'heart' },
    { key: 'carte', label: tabs.carte, glyph: 'pin' },
    { key: 'rencontres', label: tabs.rencontres, glyph: 'people', badge: encounters.data?.incoming.length ?? 0 },
    // Groupes hors de l'interface V1 (Ton chemin) : leurs non-lus ne comptent plus dans la pastille (rien à ouvrir).
    { key: 'chats', label: tabs.chats, glyph: 'chat', badge: totalUnread(links.data) + (GROUPS_IN_V1 ? (groups.data?.groups.reduce((n, g) => n + g.unread, 0) ?? 0) + (groups.data?.invitations.length ?? 0) : 0) },
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
              iconOnly
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
        <Tabs.Screen name="chats" options={{ title: tabs.chats }} />
        <Tabs.Screen name="rencontres" options={{ title: tabs.rencontres }} />
        <Tabs.Screen name="moi" options={{ title: tabs.moi }} />
      </Tabs>
      {/* Retour dans l'app : le salut est joué par le minimoa de l'accueil lui-même (`useHelloWave`), rien par-dessus le contenu. */}
    </>
  );
}
