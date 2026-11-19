/**
 * Mise à jour de l'app (docs/VERSIONING.md) :
 * - `GET /v1/app/config` donne le build minimum servi et le dernier publié ; avec le build de ce binaire, le domaine en
 *   tire le statut (`appUpdateStatus`) ;
 * - sous le minimum (ou dès qu'une requête reçoit `426 app_update_required`) : écran « Mets à jour Minimoa »
 *   (`app/mise-a-jour.tsx`), dont on ne sort qu'après la mise à jour ;
 * - entre le minimum et le dernier : bandeau discret, masqué jusqu'à la version suivante quand on le ferme.
 */
import { type AppUpdateStatus, appUpdateStatus } from '@blowy/domain';
import { UpdateBanner } from '@blowy/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, usePathname } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appBuild, appPlatform, config, useApi, useUpdateRequired } from '@/core';
import { versions as t } from '@/locales/versions';

export const UPDATE_PATH = '/mise-a-jour';
const appConfigKey = ['app', 'config'] as const;

interface DismissedState {
  /** Dernier build publié pour lequel le bandeau a été fermé (0 : jamais). */
  latestBuild: number;
  dismiss: (latestBuild: number) => void;
}

const useDismissed = create<DismissedState>()(
  persist((set) => ({ latestBuild: 0, dismiss: (latestBuild) => set({ latestBuild }) }), {
    name: 'blowy.update.dismissed',
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
    partialize: ({ latestBuild }) => ({ latestBuild }),
  }),
);

function useAppConfig() {
  const api = useApi();
  // Rien à demander sans build connu (web, Expo Go) : jamais de bandeau ni d'écran.
  return useQuery({ queryKey: appConfigKey, queryFn: api.app.config, enabled: appPlatform !== null && appBuild !== null, staleTime: 60 * 60_000 });
}

export function useAppUpdate(): { status: AppUpdateStatus; latestBuild: number; openStore: () => void } {
  const required = useUpdateRequired((s) => s.required);
  const cfg = useAppConfig();
  const fromConfig = cfg.data ? appUpdateStatus(appBuild, cfg.data) : 'none';
  const storeUrl = cfg.data?.storeUrl ?? config.appStoreUrl;
  const openStore = useCallback(() => void Linking.openURL(storeUrl).catch(() => undefined), [storeUrl]);
  return { status: required ? 'required' : fromConfig, latestBuild: cfg.data?.latestBuild ?? 0, openStore };
}

/** Après une mise à jour (ou si l'API sert de nouveau ce build) : on relit tout ; un nouveau 426 ramène l'écran. */
export function useRetryAfterUpdate(): { retry: () => void; retrying: boolean } {
  const qc = useQueryClient();
  const api = useApi();
  const cfg = useAppConfig();
  const retry = useCallback(() => {
    void (async () => {
      const fresh = await qc.fetchQuery({ queryKey: appConfigKey, queryFn: api.app.config, staleTime: 0 }).catch(() => null);
      if (fresh && appUpdateStatus(appBuild, fresh) === 'required') return;
      useUpdateRequired.getState().set(false);
      await qc.invalidateQueries();
      router.replace('/');
    })();
  }, [qc, api]);
  return { retry, retrying: cfg.isFetching };
}

/**
 * Monté une fois à la racine (`app/_layout.tsx`) : envoie vers l'écran de mise à jour quand ce build n'est plus servi,
 * et pose le bandeau quand une version plus récente est publiée.
 */
export function AppUpdateBridge() {
  const { status, latestBuild, openStore } = useAppUpdate();
  const dismissedFor = useDismissed((s) => s.latestBuild);
  const dismiss = useDismissed((s) => s.dismiss);
  const path = usePathname();
  const onUpdateScreen = path === UPDATE_PATH;

  useEffect(() => {
    if (status === 'required' && !onUpdateScreen) {
      useUpdateRequired.getState().set(true);
      router.replace(UPDATE_PATH);
    }
  }, [status, onUpdateScreen]);

  if (status !== 'available' || onUpdateScreen || dismissedFor >= latestBuild) return null;
  return (
    <UpdateBanner
      title={t.banner.title}
      text={t.banner.text}
      actionLabel={t.banner.action}
      onAction={openStore}
      onClose={() => dismiss(latestBuild)}
      closeLabel={t.banner.close}
    />
  );
}
