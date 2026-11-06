import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { createPaymentsRepository } from './payments.repository';

export const paymentKeys = { products: ['payments', 'products'] as const, allowances: ['payments', 'allowances'] as const };

function useRepo() {
  const { api } = useServices();
  return useMemo(() => createPaymentsRepository(api), [api]);
}
export function useProducts() {
  const repo = useRepo();
  return useQuery({ queryKey: paymentKeys.products, queryFn: repo.products, enabled: useSession((s) => s.status === 'signedIn') });
}
export function useAllowances() {
  const repo = useRepo();
  return useQuery({ queryKey: paymentKeys.allowances, queryFn: repo.allowances, enabled: useSession((s) => s.status === 'signedIn') });
}

export function usePlusCheckout() {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => repo.plusCheckout(newCommandId()), onSettled: () => void qc.invalidateQueries({ queryKey: paymentKeys.allowances }) });
}

/** Résiliation EN APP de Blowy+ (fin à l'échéance ; places confirmées incluses). */
export function usePlusCancel() {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => repo.plusCancel(newCommandId()), onSettled: () => void qc.invalidateQueries({ queryKey: paymentKeys.allowances }) });
}
