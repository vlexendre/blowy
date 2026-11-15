/**
 * Ce qui tourne en fond pendant toute la session (monté une fois dans `app/_layout.tsx`) :
 * - un compte suspendu par la modération (erreur `suspended` de l'API, n'importe où) → écran « compte suspendu » ;
 * - notifications permises → le jeton de l'appareil est envoyé à l'API à chaque ouverture (une fois par session) ;
 * - achats Blowy+ arrivés hors d'un achat (renouvellement, achat en attente validé) → vérifiés par l'API.
 */
import { ApiError } from '@blowy/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { keys, useApi, useSession } from '@/core';
import { pushToken } from '@/features/onboarding';
import { usePlusSync } from '@/features/plus';

const SUSPENDED = '/suspendu';

function useSuspendedWatch() {
  const qc = useQueryClient();
  const path = usePathname();
  const here = useRef(path);
  here.current = path;
  useEffect(() => {
    const go = (e: unknown) => {
      if (e instanceof ApiError && e.code === 'suspended' && here.current !== SUSPENDED) router.replace('/(onboarding)/suspendu');
    };
    const offQ = qc.getQueryCache().subscribe((ev) => {
      if (ev.type === 'updated' && ev.action.type === 'error') go(ev.action.error);
    });
    const offM = qc.getMutationCache().subscribe((ev) => {
      if (ev.type === 'updated' && ev.action.type === 'error') go(ev.action.error);
    });
    return () => {
      offQ();
      offM();
    };
  }, [qc]);
}

/** Envoie le jeton Expo de l'appareil et son fuseau à l'API (si les notifications sont permises). */
export async function registerPush(api: ReturnType<typeof useApi>): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  const token = await pushToken();
  if (!token) return false;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Paris';
  await api.notifications.registerDevice({ token, platform: Platform.OS, timeZone }).catch(() => undefined);
  return true;
}

export function SessionBridges() {
  const api = useApi();
  const session = useSession();
  const me = useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled: !!session });
  const ready = !!session && me.isSuccess;
  useSuspendedWatch();
  usePlusSync(ready);
  const registered = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !session || registered.current === session.userId) return;
    registered.current = session.userId;
    void registerPush(api);
  }, [ready, session, api]);
  return null;
}
