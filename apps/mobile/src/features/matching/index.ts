/**
 * Feature matching : propositions (GET /v1/matches) et acceptation
 * (POST /v1/match-proposals/:id/accept, réseau obligatoire). Contrats C.
 */
import { AcceptProposalResultSchema, MatchFeedSchema } from '@blowy/api-contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
export { ProposalCard } from './ui/ProposalCard';
import type { Http } from '../../core/api/http';
import { routes } from '../../core/api/routes';
import { useServices } from '../../core/providers/services';
import { useSession } from '../../core/session/session-store';

export function createMatchingRepository(http: Http) {
  return {
    feed: () => http.request({ method: 'GET', path: routes.matching.feed }, MatchFeedSchema),
    accept: (commandId: string, id: string) => http.request({ method: 'POST', path: routes.matching.accept(id), commandId }, AcceptProposalResultSchema),
  };
}

export const matchKeys = { feed: ['matches'] as const };

export function useMatchFeed() {
  const { http } = useServices();
  const repo = useMemo(() => createMatchingRepository(http), [http]);
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: matchKeys.feed, queryFn: repo.feed, enabled: signedIn });
}

export function useAcceptProposal() {
  const { http, newCommandId } = useServices();
  const repo = useMemo(() => createMatchingRepository(http), [http]);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => repo.accept(newCommandId(), proposalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: matchKeys.feed }),
  });
}

export { paywallHeadline, unlockedIndexes } from './model/proposals';
