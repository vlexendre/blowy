/**
 * Repository des sorties (spec-v5 §7.2) : chaque réponse est validée par le contrat
 * `@blowy/api-contract/outings` (vues projetées par acteur, `.strict()`).
 */
import {
  CheckInResponseSchema,
  CreateTeamResponseSchema,
  KnowsSomeoneResponseSchema,
  LeaveTeamResponseSchema,
  OutingHistoryPageSchema,
  OutingViewSchema,
  OutingVotesViewSchema,
  OutingWeekViewSchema,
  ReliabilityViewSchema,
  SeatAcceptResponseSchema,
  SeatCancelPreviewSchema,
  SeatCancelResponseSchema,
  SubmitOutingVotesResponseSchema,
  type CheckInRequest,
  type PutOutingRequest,
} from '@blowy/api-contract';
import type { VoteChoice } from '@blowy/domain';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';

export function createOutingsRepository(api: Api) {
  return {
    week: () => api.request('GET', routes.week, OutingWeekViewSchema),
    outing: (id: string) => api.request('GET', routes.outing(id), OutingViewSchema),
    request: (weekKey: string, body: PutOutingRequest, cid: string) =>
      api.send('PUT', routes.outingRequest(weekKey), body, { commandId: cid }),
    accept: (id: string, cid: string, funding: 'AUTO' | 'PAY' = 'AUTO') =>
      api.request(
        'POST',
        routes.seatAccept(id),
        SeatAcceptResponseSchema,
        { funding },
        { commandId: cid },
      ),
    decline: (id: string, cid: string) =>
      api.send('POST', routes.seatDecline(id), {}, { commandId: cid }),
    cancelPreview: (id: string) =>
      api.request('GET', routes.seatCancelPreview(id), SeatCancelPreviewSchema),
    cancel: (id: string, kind: 'CANT_MAKE_IT' | 'SAFETY' | 'EMERGENCY', cid: string) =>
      api.request(
        'POST',
        routes.seatCancel(id),
        SeatCancelResponseSchema,
        { kind },
        { commandId: cid },
      ),
    knowsSomeone: (id: string, userId: string, cid: string) =>
      api.request(
        'POST',
        routes.knowsSomeone(id),
        KnowsSomeoneResponseSchema,
        { userId },
        { commandId: cid },
      ),
    checkIn: (id: string, body: CheckInRequest, cid: string) =>
      api.request('POST', routes.checkIn(id), CheckInResponseSchema, body, { commandId: cid }),
    votes: (id: string) => api.request('GET', routes.votes(id), OutingVotesViewSchema),
    submitVotes: (id: string, choices: Record<string, VoteChoice>, cid: string) =>
      api.request(
        'PUT',
        routes.votes(id),
        SubmitOutingVotesResponseSchema,
        { choices },
        { commandId: cid },
      ),
    history: () => api.request('GET', routes.history, OutingHistoryPageSchema),
    reliability: () => api.request('GET', routes.reliability, ReliabilityViewSchema),
    /** `GET /v1/teams/mine` : ma team + lien d'invitation (404 si aucune). */
    team: () => api.request('GET', routes.teamsMine, CreateTeamResponseSchema),
    createTeam: (cid: string) =>
      api.request('POST', routes.teams, CreateTeamResponseSchema, {}, { commandId: cid }),
    joinTeam: (inviteRef: string, cid: string) =>
      api.request(
        'POST',
        routes.teamJoin,
        CreateTeamResponseSchema,
        { inviteRef },
        { commandId: cid },
      ),
    leaveTeam: (id: string, cid: string) =>
      api.request('POST', routes.teamLeave(id), LeaveTeamResponseSchema, {}, { commandId: cid }),
  };
}
export type OutingsRepository = ReturnType<typeof createOutingsRepository>;
