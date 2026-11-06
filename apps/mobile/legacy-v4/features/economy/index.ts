/**
 * Lecture du portefeuille et du catalogue pour le Nid/la Boutique, utilisable même sans
 * PurchasesProvider (achats store indisponibles) : réutilise le client REST de la feature
 * achats (agent G) — aucune seconde implémentation des routes /v1/wallet et /v1/catalog.
 * Clés de cache identiques à celles de G (['economy','wallet']) pour partager l'invalidation.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../core/providers/services';
import { useSession } from '../../core/session/session-store';
import { createPurchasesApi } from '../purchases';

function useEconomyApi() {
  const { api } = useServices();
  return useMemo(() => createPurchasesApi((req) => api.raw(req)), [api]);
}

export function useWalletBalance() {
  const api = useEconomyApi();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: ['economy', 'wallet'], queryFn: () => api.wallet(), enabled: signedIn, retry: false });
}

export function useCatalog() {
  const api = useEconomyApi();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: ['economy', 'catalog'], queryFn: () => api.catalog(), enabled: signedIn, retry: false, staleTime: 10 * 60_000 });
}

/** Achat catalogue / gel : réseau requis (dépense de pièces jamais en file), commandId par appel. */
export function useEconomyCommands() {
  const api = useEconomyApi();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  const done = () => void qc.invalidateQueries({ queryKey: ['economy', 'wallet'] });
  return {
    buy: useMutation({ mutationFn: (itemId: string) => api.purchaseItem(newCommandId(), itemId), onSuccess: done }),
    freeze: useMutation({ mutationFn: () => api.useStreakFreeze(newCommandId()), onSuccess: done }),
  };
}
