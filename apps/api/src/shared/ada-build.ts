/**
 * Version simplifiée de l'app (docs/ADA-2027.md) : ligue, défi du jour, habitudes avec photo, bilans et groupes en sont
 * supprimés. L'API garde leurs routes pour les anciennes versions, mais n'envoie plus leurs notifications aux comptes
 * dont la dernière app vue (build retenu par Ton chemin, comme le rappel du matin) atteint
 * `APP_<PLATEFORME>_ADA_BUILD` : une notification qui mène à un écran disparu serait une fonction cachée.
 * Les anciennes versions continuent de les recevoir. À retirer quand `minSupportedBuild` atteint ce build.
 */
import type { NotificationKindKey } from '@blowy/domain';
import type { AppVersionsEnv } from '../config/app-versions.env';

/** Le build retenu est-il de la version simplifiée ? Inconnu (jamais vu, site, outils) : non. */
export function buildIsAda(versions: AppVersionsEnv, platform: string | null, build: number | null): boolean {
  if ((platform !== 'ios' && platform !== 'android') || build === null) return false;
  return build >= versions[platform].adaBuild;
}

/** Types dont l'écran n'existe plus dans la version simplifiée. */
export const RETIRED_NOTIFICATION_KINDS: ReadonlySet<NotificationKindKey> = new Set<NotificationKindKey>([
  'league',
  'habit_proof',
  'weekly_review',
  'group_invite',
  'together_proposal',
  'group_message',
  'group_life_lost',
  'group_asleep',
  'group_joined',
]);

/**
 * Une notification sans écran dans la version simplifiée : les types retirés, et le défi du jour hors Ton chemin
 * (seul le rappel de la séance, `step: 'chemin'`, reste).
 */
export function isRetiredNotification(kind: NotificationKindKey, vars: Readonly<Record<string, string>>): boolean {
  if (RETIRED_NOTIFICATION_KINDS.has(kind)) return true;
  return kind === 'daily_challenge' && vars.step !== 'chemin';
}
