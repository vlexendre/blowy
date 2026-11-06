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
  // V5 (§10.1) : exploitation des sorties.
  { href: '/neighborhoods', label: 'Villes et quartiers', perm: 'neighborhoods.read' },
  { href: '/venues', label: 'Lieux', perm: 'venues.read' },
  // V5.6 (E11, E12)
  { href: '/travel-times', label: 'Temps de trajet', perm: 'neighborhoods.read' },
  { href: '/oncall', label: 'Astreinte', perm: 'oncall.read' },
  { href: '/outings', label: 'Sorties', perm: 'outings.read' },
  { href: '/knows-someone', label: 'Je connais quelqu’un', perm: 'knows_someone.read' },
  { href: '/attendance', label: 'Présences et pauses', perm: 'attendance.read' },
  { href: '/safety', label: 'Besoin d’aide', perm: 'safety.read' },
  { href: '/reports-v5', label: 'Signalements V5', perm: 'reports_v5.read' },
  { href: '/venue-compensations', label: 'Compensations lieux', perm: 'venue_compensations.read' },
  { href: '/ops', label: 'Exploitation', perm: 'ops.read' },
  { href: '/audit', label: 'Audit', perm: 'audit.read' },
  { href: '/account', label: 'Mon compte', perm: 'dashboard.read' },
];
