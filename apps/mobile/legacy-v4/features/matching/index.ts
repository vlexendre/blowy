/**
 * Feature matching : propositions (GET /v1/matches) et acceptation
 * (POST /v1/match-proposals/:id/accept, réseau obligatoire). Contrats C.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
export { ProposalCard } from './ui/ProposalCard';
export { createMatchingRepository } from './api/matching.repository';
import { createMatchingRepository } from './api/matching.repository';
import { useServices } from '../../core/providers/services';
import { useSession } from '../../core/session/session-store';

export const matchKeys = { feed: ['matches'] as const };

export function useMatchFeed() {
  const { api } = useServices();
  const repo = useMemo(() => createMatchingRepository(api), [api]);
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: matchKeys.feed, queryFn: repo.feed, enabled: signedIn });
}

/** Premier lot d'onboarding (POST /v1/matches/onboarding-batch) : remplace le flux en cache. */
export function useOnboardingBatch() {
  const { api } = useServices();
  const repo = useMemo(() => createMatchingRepository(api), [api]);
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => repo.onboardingBatch(), onSuccess: (feed) => qc.setQueryData(matchKeys.feed, feed) });
}

export function useAcceptProposal() {
  const { api, newCommandId } = useServices();
  const repo = useMemo(() => createMatchingRepository(api), [api]);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => repo.accept(newCommandId(), proposalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: matchKeys.feed }),
  });
}

export { paywallHeadline, unlockedIndexes } from './model/proposals';
