/**
 * Ce qui tourne en fond pendant toute la session (monté une fois dans `app/_layout.tsx`) :
 * - un compte suspendu par la modération (erreur `suspended` de l'API, n'importe où) → écran « compte suspendu » ;
 * - notifications permises → le jeton de l'appareil est envoyé à l'API à chaque ouverture (une fois par session) ;
 * - achats Minimoa+ arrivés hors d'un achat (renouvellement, achat en attente validé) → vérifiés par l'API ;
 * - premier lancement et inscription terminée → comptés une fois (docs/VIRALITE.md) ;
 * - sessions, erreurs et compte prêt → mémorisés pour la demande de note (features/review).
 */
import { ApiError } from '@blowy/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { keys, useApi, useSession } from '@/core';
import { registerDevice } from '@/features/notifications';
import { usePlusSync } from '@/features/plus';
import { useGrowthBridge } from '@/features/growth';
import { noteReviewSetback, setReviewReady, useReviewSessions } from '@/features/review';

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
    // Une action qui échoue (hors refus normal du jeu) : pas de demande de note juste après.
    const setback = (e: unknown) => {
      if (!(e instanceof ApiError && e.code === 'already_done')) noteReviewSetback();
    };
    const offQ = qc.getQueryCache().subscribe((ev) => {
      if (ev.type === 'updated' && ev.action.type === 'error') go(ev.action.error);
    });
    const offM = qc.getMutationCache().subscribe((ev) => {
      if (ev.type === 'updated' && ev.action.type === 'error') {
        go(ev.action.error);
        setback(ev.action.error);
      }
    });
    return () => {
      offQ();
      offM();
    };
  }, [qc]);
}

export function SessionBridges() {
  const api = useApi();
  const session = useSession();
  const me = useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled: !!session });
  const ready = !!session && me.isSuccess;
  useSuspendedWatch();
  usePlusSync(ready);
  // Premier lancement et inscription terminée (une fois chacun, sans identifiant d'appareil).
  useGrowthBridge();
  useReviewSessions();
  useEffect(() => setReviewReady(ready), [ready]);
  const registered = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !session || registered.current === session.userId) return;
    registered.current = session.userId;
    void registerDevice(api);
  }, [ready, session, api]);
  return null;
}
