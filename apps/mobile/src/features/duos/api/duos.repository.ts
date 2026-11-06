/** Voie Duo et duos (spec-v5 §7.3, contrats `connections`). */
import {
  AcceptDuoProposalResultSchema,
  CastDuoVoteResponseSchema,
  CheckInResponseSchema,
  DuoEggResponseSchema,
  DuoLaneFeedSchema,
  DuoLeaveResponseSchema,
  DuoListSchema,
  DuoVenueListSchema,
  DuoViewSchema,
  PassDuoProposalResultSchema,
  type CheckInRequest,
} from '@blowy/api-contract';
import type { VoteChoice } from '@blowy/domain';
import { z } from 'zod';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';

export function createDuosRepository(api: Api) {
  return {
    lane: () => api.request('GET', routes.duoLane, DuoLaneFeedSchema),
    accept: (id: string, cid: string) => api.request('POST', routes.duoAccept(id), AcceptDuoProposalResultSchema, {}, { commandId: cid }),
    pass: (id: string, cid: string) => api.request('POST', routes.duoPass(id), PassDuoProposalResultSchema, {}, { commandId: cid }),
    list: () => api.request('GET', routes.duos, DuoListSchema),
    duo: (id: string) => api.request('GET', routes.duo(id), DuoViewSchema),
    venues: (id: string) => api.request('GET', routes.duoVenues(id), DuoVenueListSchema),
    proposeDate: (id: string, body: { venueId: string; startsAt: string }, cid: string) => api.request('POST', routes.duoDates(id), z.unknown(), body, { commandId: cid }),
    respondDate: (id: string, dateId: string, decision: 'ACCEPT' | 'DECLINE', cid: string) => api.request('POST', routes.duoDateAction(id, dateId, 'respond'), z.unknown(), { decision }, { commandId: cid }),
    checkIn: (id: string, dateId: string, body: CheckInRequest, cid: string) => api.request('POST', routes.duoDateAction(id, dateId, 'check-in'), CheckInResponseSchema, body, { commandId: cid }),
    vote: (id: string, dateId: string, choice: VoteChoice, cid: string) => api.request('PUT', routes.duoDateVote(id, dateId), CastDuoVoteResponseSchema, { choice }, { commandId: cid }),
    leave: (id: string, cid: string) => api.request('POST', routes.duoLeave(id), DuoLeaveResponseSchema, {}, { commandId: cid }),
    egg: (id: string, enabled: boolean, cid: string) => api.request('PUT', routes.duoEgg(id), DuoEggResponseSchema, { enabled }, { commandId: cid }),
  };
}
