import type { NavItem } from '@blowy/ui-web';

/** Sections du back-office ; affichées selon les permissions serveur (l'API refuse de toute façon). */
export const NAV: (NavItem & { perm: string })[] = [
  { href: '/', label: 'Tableau de bord', perm: 'dashboard.read' },
  { href: '/users', label: 'Utilisateurs', perm: 'users.read' },
  { href: '/moderation', label: 'Modération', perm: 'moderation.read' },
  { href: '/verification', label: 'Vérification', perm: 'verification.read' },
  { href: '/missions', label: 'Missions', perm: 'missions.read' },
  { href: '/content', label: 'Contenus', perm: 'content.read' },
  { href: '/tuning', label: 'Tuning', perm: 'tuning.read' },
  { href: '/matching', label: 'Matching', perm: 'matching.read' },
  { href: '/economy', label: 'Économie', perm: 'economy.read' },
  { href: '/social', label: 'Social', perm: 'social.read' },
  { href: '/ai', label: 'IA', perm: 'ai.read' },
  { href: '/ops', label: 'Exploitation', perm: 'ops.read' },
  { href: '/audit', label: 'Audit', perm: 'audit.read' },
  { href: '/account', label: 'Mon compte', perm: 'dashboard.read' },
];
