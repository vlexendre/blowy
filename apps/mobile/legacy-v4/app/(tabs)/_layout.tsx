/** 5 onglets flottants (Nid, Chats, Carte, Quartier, Profil), chacun avec sa propre pile. */
import { TabBar, type TabItem } from '@blowy/ui-mobile';
import { Tabs } from 'expo-router';
import { useConversations } from '../../src/features/conversations';
import { t } from '../../src/i18n';

const TABS = [
  { key: 'nest', icon: 'nest' },
  { key: 'chats', icon: 'chats' },
  { key: 'map', icon: 'map' },
  { key: 'neighborhood', icon: 'neighborhood' },
  { key: 'profile', icon: 'profile' },
] as const;

export default function TabsLayout() {
  const convs = useConversations();
  const unread = (convs.data?.items ?? []).reduce((n, c) => n + Math.max(0, c.lastSeq - c.lastReadSeq), 0);
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab, insets }) => {
        const items: TabItem[] = TABS.map((tb) => ({
          key: tb.key,
          icon: tb.icon,
          label: t(`tabs.${tb.key}`),
          badge: tb.key === 'chats' && unread > 0 ? String(unread) : null,
          tag: tb.key === 'map' ? t('tabs.plus') : null,
        }));
        const active = state.routes[state.index]?.name ?? 'nest';
        return <TabBar items={items} activeKey={active} bottomInset={insets.bottom} onSelect={(key) => { const r = state.routes.find((x) => x.name === key); if (r) navigateToTab(r.key); }} />;
      }}
    >
      {TABS.map((tb) => (
        <Tabs.Screen key={tb.key} name={tb.key} />
      ))}
    </Tabs>
  );
}
