/**
 * Social (Quartier, bandes, ligues, parrainage) et missions/œufs : contrats non publiés au
 * 2026-11-01 (agent G, V3). Les hooks appellent les routes prévues §13 ; tant qu'elles
 * n'existent pas, la requête échoue en NOT_IMPLEMENTED et l'écran affiche « indisponible ».
 * Aucun schéma inventé : la réponse est gardée `unknown` et n'est jamais rendue comme donnée.
 */
import { useQuery } from '@tanstack/react-query';
import { rawRoutes as routes } from '../../../core/api/routes';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';

/** Sonde d'endpoint : seul l'état (disponible ou non) est exploité tant que le DTO n'est pas publié. */
function useEndpointProbe(key: string, path: string) {
  const { api } = useServices();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: ['probe', key], queryFn: () => api.raw({ method: 'GET', path }), enabled: signedIn, retry: false, staleTime: 5 * 60_000 });
}

export const useFriends = () => useEndpointProbe('friends', routes.social.friends);
export const useGroups = () => useEndpointProbe('groups', routes.social.groups);
export const useLeague = () => useEndpointProbe('league', routes.social.league);
export const useTodayMission = () => useEndpointProbe('mission', routes.missions.today);
export const useCurrentEgg = () => useEndpointProbe('egg', routes.eggs.current);
export const useChildren = () => useEndpointProbe('children', routes.eggs.children);
export const useSafetyDates = () => useEndpointProbe('safety-dates', routes.trust.safetyDates);

/** Invitation : code du lien conservé localement jusqu'au claim post-activation (P-5.9). */
export const INVITE_STORAGE_KEY = 'blowy.invite.code';
export const parseInviteCode = (raw: string | string[] | undefined): string | null => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v && /^[A-Za-z0-9_-]{4,64}$/.test(v) ? v : null;
};
