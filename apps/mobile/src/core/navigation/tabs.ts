/** Les 4 onglets V5 (`.gnav`) : Accueil, Chats, Bande, Profil — compteur de non-lus sur Chats. */
import type { GlassNavItem } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useConversations } from '../../features/conversations';
import { t } from '../../i18n';
import { paths } from './paths';

export type TabKey = 'home' | 'chats' | 'band' | 'profile';

const HREF: Record<TabKey, string> = { home: paths.home, chats: paths.chats, band: paths.band, profile: paths.profile };

export function useTabs(active: TabKey) {
  const convs = useConversations();
  const unread = (convs.data?.items ?? []).reduce((n, c) => n + Math.max(0, c.lastSeq - c.lastReadSeq), 0);
  return useMemo(() => {
    const items: GlassNavItem[] = [
      { key: 'home', label: t('tabs5.home'), glyph: 'home', glyphOn: 'homeFilled' },
      { key: 'chats', label: t('tabs5.chats'), glyph: 'chat', glyphOn: 'chatFilled', badge: unread > 0 ? String(unread) : null, badgeLabel: unread > 0 ? t('tabs5.unread', { n: unread }) : undefined },
      { key: 'band', label: t('tabs5.band'), glyph: 'band', glyphOn: 'bandFilled' },
      { key: 'profile', label: t('tabs5.profile'), glyph: 'profile', glyphOn: 'profileFilled' },
    ];
    return { items, activeKey: active, onSelect: (k: string) => k !== active && router.replace(HREF[k as TabKey] as never) };
  }, [active, unread]);
}
