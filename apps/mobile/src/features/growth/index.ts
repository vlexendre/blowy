/**
 * Croissance (docs/VIRALITE.md) : d'où vient la personne, mesuré sans SDK tiers ni empreinte d'appareil.
 * - Le premier lien ouvert (`/c/<code>`, `?ref=`, `/m/`, `/g/`, `/i/`) est gardé sur le téléphone (la première source
 *   gagne) et envoyé avec l'inscription ; sinon, la personne peut taper un code (« Un code ? », écran du prénom).
 * - Premier lancement et inscription terminée : un appel chacun, une fois par installation (aucun identifiant).
 * - Chaque partage (invitation, « 3 mots », groupe, moment) est compté, sans contenu.
 */
import type { CodeLookup, ShareBody } from '@blowy/contract';
import { ApiError } from '@blowy/api-client';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import { keys, useApi, useSession } from '@/core';
import { captureUrl, currentAttribution, useAttribution } from './attribution';

export { captureUrl, currentAttribution, useAttribution } from './attribution';

/**
 * En fond (monté par `SessionBridges`) : premier lancement (une fois, après lecture du lien d'ouverture), puis
 * « inscription terminée » quand une session existe sans minimoa (une fois).
 */
export function useGrowthBridge(): void {
  const api = useApi();
  const session = useSession();
  const me = useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled: !!session });
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void (async () => {
      captureUrl(await Linking.getInitialURL().catch(() => null));
      // Attendre la relecture du téléphone avant de décider (une seule fois par installation).
      if (!useAttribution.persist.hasHydrated()) await new Promise<void>((done) => useAttribution.persist.onFinishHydration(() => done()));
      if (useAttribution.getState().firstOpenSent) return;
      await api.growth
        .firstOpen(currentAttribution())
        .then(() => useAttribution.getState().set({ firstOpenSent: true }))
        .catch(() => undefined);
    })();
  }, [api]);
  const needsOnboarding = me.error instanceof ApiError && me.error.code === 'not_onboarded';
  useEffect(() => {
    if (!needsOnboarding || useAttribution.getState().signupSent) return;
    void api.growth
      .signup(currentAttribution())
      .then(() => useAttribution.getState().set({ signupSent: true }))
      .catch(() => undefined);
  }, [needsOnboarding, api]);
}

/** Compte un partage (sans contenu) ; jamais bloquant. */
export function useTrackShare(): (kind: ShareBody['kind']) => void {
  const api = useApi();
  return (kind) => void api.growth.share(kind).catch(() => undefined);
}

/** Ce qu'est un code tapé (créateur, invitation, groupe, « 3 mots ») ; null s'il est inconnu. */
export function useCodeLookup(code: string) {
  const api = useApi();
  const clean = code.trim();
  return useQuery<CodeLookup | null>({
    queryKey: ['codes', clean.toUpperCase()],
    queryFn: async () => {
      try {
        return await api.growth.code(clean);
      } catch (e) {
        if (e instanceof ApiError && e.code === 'not_found') return null;
        throw e;
      }
    },
    enabled: /^[A-Za-z0-9_-]{3,32}$/.test(clean),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
