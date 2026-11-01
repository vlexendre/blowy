/**
 * Provider + hooks publics de la feature achats. Les écrans (agent D) consomment uniquement :
 * `PurchasesProvider`, `usePurchases()`, `useOfferings()`, `useEntitlements()`, `useWallet()`.
 * Les DROITS viennent du backend (GET /v1/subscriptions/me), jamais du CustomerInfo du SDK.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionMeResponse } from '@blowy/api-contract';
import type { PurchasesApi } from '../api/purchases.api';
import type { Offerings, PurchaseOutcome, PurchasesPort, StorePackage } from './purchases.port';
import { selectPaywall, type PaywallSelection } from './offer-selection';

interface PurchasesContextValue {
  port: PurchasesPort;
  api: PurchasesApi;
  userId: string | null;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

const KEYS = {
  offerings: ['purchases', 'offerings'] as const,
  subscription: ['purchases', 'subscription'] as const,
  wallet: ['economy', 'wallet'] as const,
};

/**
 * Monte le port choisi (RevenueCat réel ou LOCAL_DEMO) ; `userId` = identifiant Blowy de la
 * session (jamais l'email). `identify` est appelé après authentification, `reset` à la déconnexion.
 */
export function PurchasesProvider({ port, api, userId, children }: PurchasesContextValue & { children: ReactNode }) {
  const qc = useQueryClient();
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (userId) {
        await port.identify(userId);
        if (!cancelled) await qc.invalidateQueries({ queryKey: KEYS.offerings });
      } else {
        await port.reset();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [port, userId, qc]);

  // CustomerInfo modifié côté SDK (renouvellement, autre appareil) → réconciliation SERVEUR.
  useEffect(() => {
    if (!userId) return;
    return port.onCustomerInfoChanged(() => {
      void api.sync().then((r) => qc.setQueryData(KEYS.subscription, r.subscription));
    });
  }, [port, api, userId, qc]);

  const value = useMemo(() => ({ port, api, userId }), [port, api, userId]);
  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

function useCtx(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('PurchasesProvider manquant');
  return ctx;
}

/** Offerings du store (prix localisés réels) + sélection paywall (essai/−60 % seulement si réels). */
export function useOfferings(): { offerings: Offerings | undefined; paywall: PaywallSelection | null; isLoading: boolean; error: unknown } {
  const { port, userId } = useCtx();
  const q = useQuery({ queryKey: KEYS.offerings, queryFn: () => port.getOfferings(), enabled: !!userId, staleTime: 5 * 60_000 });
  return { offerings: q.data, paywall: q.data ? selectPaywall(q.data) : null, isLoading: q.isLoading, error: q.error };
}

/** État d'abonnement et droits tels que décidés par le SERVEUR (mode LIVE/SANDBOX/LOCAL_DEMO inclus). */
export function useEntitlements(): {
  subscription: SubscriptionMeResponse | undefined;
  has: (key: SubscriptionMeResponse['entitlements'][number]['key']) => boolean;
  isLoading: boolean;
  refresh: () => Promise<unknown>;
} {
  const { api, userId } = useCtx();
  const q = useQuery({ queryKey: KEYS.subscription, queryFn: () => api.subscription(), enabled: !!userId });
  const has = useCallback((key: SubscriptionMeResponse['entitlements'][number]['key']) => !!q.data?.entitlements.some((e) => e.key === key), [q.data]);
  return { subscription: q.data, has, isLoading: q.isLoading, refresh: q.refetch };
}

/** Actions d'achat : achat store → POST /purchases/sync → droits serveur ; restauration idem. */
export function usePurchases() {
  const { port, api } = useCtx();
  const qc = useQueryClient();
  const [lastOutcome, setLastOutcome] = useState<PurchaseOutcome | null>(null);

  const syncServer = useCallback(async () => {
    const r = await api.sync();
    qc.setQueryData(KEYS.subscription, r.subscription);
    if (r.consumablesCredited > 0) await qc.invalidateQueries({ queryKey: KEYS.wallet });
    return r;
  }, [api, qc]);

  const purchase = useMutation({
    mutationFn: async (pkg: StorePackage) => {
      const outcome = await port.purchase(pkg);
      setLastOutcome(outcome);
      // Même en PENDING, on resynchronise : le serveur reste l'autorité (webhook/réconciliation).
      if (outcome.status === 'PURCHASED' || outcome.status === 'PENDING') await syncServer();
      return outcome;
    },
  });

  const restore = useMutation({
    mutationFn: async () => {
      await port.restore();
      return syncServer();
    },
  });

  return {
    mode: port.mode,
    purchase: purchase.mutateAsync,
    isPurchasing: purchase.isPending,
    restore: restore.mutateAsync,
    isRestoring: restore.isPending,
    lastOutcome,
    syncServer,
  };
}

/** Portefeuille pièces + achat catalogue idempotent (commandId fourni par l'appelant, conservé au retry). */
export function useWallet(newCommandId: () => string) {
  const { api, userId } = useCtx();
  const qc = useQueryClient();
  const wallet = useQuery({ queryKey: KEYS.wallet, queryFn: () => api.wallet(), enabled: !!userId });
  const catalog = useQuery({ queryKey: ['economy', 'catalog'], queryFn: () => api.catalog(), enabled: !!userId, staleTime: 10 * 60_000 });
  const buy = useMutation({
    mutationFn: ({ itemId, commandId }: { itemId: string; commandId?: string }) => api.purchaseItem(commandId ?? newCommandId(), itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.wallet }),
  });
  const useFreeze = useMutation({
    mutationFn: (commandId?: string) => api.useStreakFreeze(commandId ?? newCommandId()),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.wallet }),
  });
  return { wallet: wallet.data, catalog: catalog.data, isLoading: wallet.isLoading, buyItem: buy.mutateAsync, useStreakFreeze: useFreeze.mutateAsync };
}
