/**
 * Notifications : enregistrement de l'appareil à l'ouverture (si l'accord est déjà donné), retrait à la déconnexion,
 * réglages par type, et ouverture du bon écran quand on touche une notification (même app fermée).
 * Sur le web : rien n'est enregistré (`push.web.ts`), l'écran des réglages reste utilisable.
 */
import type { ApiClient } from '@blowy/api-client';
import { type NotificationSettings, type NotificationSettingsBody, PushDataZ } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useApi } from '@/core';
import type { Gate } from '@/features/session';

import {
  forgetPushToken,
  getPermission,
  getPushToken,
  onTap,
  type PushPermission,
  pushPlatform,
  requestPermission,
  setForegroundHandler,
  storedPushToken,
  takeLaunchTap,
} from './push';
import { useDeepLink } from './deeplink';
import { pathFromPushUrl } from './url';

export type { PushPermission } from './push';
export { appPathFromUrl, pathFromPushUrl } from './url';
export { useDeepLink } from './deeplink';

export const notificationKeys = { settings: ['notifications', 'settings'] as const };

/** Fuseau IANA du téléphone (« Europe/Paris »). */
export const deviceTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  } catch {
    return 'Europe/Paris';
  }
};

/** Envoie le jeton et le fuseau à l'API, si l'accord est déjà donné. Rend les réglages à jour, ou null. */
export async function registerDevice(api: ApiClient): Promise<NotificationSettings | null> {
  const platform = pushPlatform();
  if (!platform) return null;
  if ((await getPermission()) !== 'granted') return null;
  const token = await getPushToken();
  if (!token) return null;
  try {
    return await api.notifications.registerDevice({ token, platform, timeZone: deviceTimeZone() });
  } catch {
    return null;
  }
}

/** À la déconnexion ou à la suppression du compte : le téléphone ne reçoit plus rien pour ce compte. */
export async function unregisterDevice(api: ApiClient): Promise<void> {
  // Le jeton envoyé par cet écran, sinon celui du téléphone (le même tant que l'app est installée).
  const token = (await storedPushToken()) ?? (pushPlatform() ? await getPushToken() : null);
  if (!token) return;
  try {
    await api.notifications.removeDevice(token);
  } catch {
    // Le jeton sera remplacé ou expirera : on ne bloque pas la déconnexion.
  }
  await forgetPushToken();
}

/**
 * Pont des notifications, monté avec les onglets (personne connectée) :
 * - au retour au premier plan : enregistre l'appareil si l'accord est déjà donné (met aussi le fuseau à jour) ;
 * - une notification touchée (même app fermée) ouvre son écran.
 */
export function useNotificationsBridge(gate: Gate): void {
  const api = useApi();
  const qc = useQueryClient();
  const ready = gate === 'ready';

  useEffect(() => {
    setForegroundHandler();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const sync = () =>
      void registerDevice(api).then((settings) => {
        if (settings) qc.setQueryData(notificationKeys.settings, settings);
      });
    // L'ouverture elle-même est couverte par `SessionBridges` (features/session, une fois par session) : ici, chaque
    // retour au premier plan (nouveau fuseau en voyage, accord donné entre-temps dans les Réglages).
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') sync();
    });
    return () => sub.remove();
  }, [ready, api, qc]);

  const handled = useRef(new Set<string>());
  useEffect(() => {
    if (!ready) return;
    const open = (tap: { data: unknown; id: string }) => {
      if (handled.current.has(tap.id)) return;
      handled.current.add(tap.id);
      const parsed = PushDataZ.safeParse(tap.data);
      if (!parsed.success) return;
      const path = pathFromPushUrl(parsed.data.url);
      if (path) router.push(path);
    };
    // Démarrage à froid : la notification qui a ouvert l'app, une fois les onglets prêts.
    void takeLaunchTap().then((tap) => tap && open(tap));
    return onTap(open);
  }, [ready]);

  // Liens universels et schémas de l'app reçus avant que le compte soit prêt (`app/+native-intent.ts`) : ouverts ici.
  useEffect(() => {
    const deepLink = useDeepLink.getState();
    deepLink.setReady(ready);
    if (!ready) return;
    const path = deepLink.take();
    if (path) router.push(path as Href);
    return () => useDeepLink.getState().setReady(false);
  }, [ready]);
}

/** Réglages des notifications (types, heure du défi, heures calmes). */
export function useNotificationSettings() {
  const api = useApi();
  return useQuery({ queryKey: notificationKeys.settings, queryFn: api.notifications.settings });
}

/** Modifier un réglage : l'interrupteur bouge tout de suite, et revient si l'API refuse. */
export function useUpdateNotificationSettings() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationSettingsBody) => api.notifications.updateSettings(body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: notificationKeys.settings });
      const before = qc.getQueryData<NotificationSettings>(notificationKeys.settings);
      if (before) {
        const kinds = { ...before.kinds };
        for (const [k, v] of Object.entries(body.kinds ?? {})) if (typeof v === 'boolean') kinds[k as keyof typeof kinds] = v;
        qc.setQueryData<NotificationSettings>(notificationKeys.settings, { ...before, kinds, morningHour: body.morningHour ?? before.morningHour });
      }
      return { before };
    },
    onError: (_e, _b, ctx) => {
      if (ctx?.before) qc.setQueryData(notificationKeys.settings, ctx.before);
    },
    onSuccess: (s) => qc.setQueryData(notificationKeys.settings, s),
  });
}

/** Accord du téléphone pour les notifications, relu au retour dans l'app (après un passage par les Réglages). */
export function usePushPermission() {
  const api = useApi();
  const qc = useQueryClient();
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const refresh = useCallback(() => void getPermission().then(setPermission), []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  const ask = useCallback(async () => {
    const next = await requestPermission();
    setPermission(next);
    if (next === 'granted') {
      const settings = await registerDevice(api);
      if (settings) qc.setQueryData(notificationKeys.settings, settings);
    }
    return next;
  }, [api, qc]);
  return { permission, ask };
}

/**
 * Écran d'avant-demande (`/pet/notifications`) : montré une seule fois par installation (App Review 4.5.4 : jamais
 * obligatoire, jamais en échange de quoi que ce soit). Ensuite, la demande ne revient que si la personne la fait
 * elle-même dans Moi › Réglages › Notifications (ou « Ouvrir les Réglages » après un refus).
 */
export const usePushIntro = create<{ seenAt: number | null; markSeen: () => void }>()(
  persist((set) => ({ seenAt: null, markSeen: () => set({ seenAt: Date.now() }) }), {
    name: 'blowy.push.intro',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

/** Délai avant l'écran d'avant-demande : l'accueil s'affiche et son minimoa arrive d'abord. */
const PUSH_INTRO_DELAY_MS = 1600;

/**
 * Ouvre l'écran d'avant-demande une fois, au premier bon moment sur l'accueil : `when` vrai (accueil affiché, rien
 * d'autre en cours : fête, défi du jour qui monte, demande de position), accord du téléphone jamais demandé.
 */
export function usePushIntroOnce(permission: PushPermission | null, when: boolean): void {
  const seen = usePushIntro((s) => s.seenAt !== null);
  const [hydrated, setHydrated] = useState(() => usePushIntro.persist.hasHydrated());
  useEffect(() => (hydrated ? undefined : usePushIntro.persist.onFinishHydration(() => setHydrated(true))), [hydrated]);
  useEffect(() => {
    if (!hydrated || seen || !when || permission !== 'undetermined') return;
    const id = setTimeout(() => {
      usePushIntro.getState().markSeen();
      router.push('/pet/notifications');
    }, PUSH_INTRO_DELAY_MS);
    return () => clearTimeout(id);
  }, [hydrated, seen, when, permission]);
}
