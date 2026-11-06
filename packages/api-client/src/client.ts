/** Client typé Blowy /v1 — une méthode par endpoint, DTO = schémas @blowy/api-contract. */
import {
  AcceptProposalResultSchema,
  ConsentStateSchema,
  ConversationListSchema,
  DeviceSessionListSchema,
  MatchFeedSchema,
  MessagePageSchema,
  MessageViewSchema,
  MoveInResultSchema,
  OwnPetViewSchema,
  PetActionResultSchema,
  PublicPetProfileSchema,
  RelationshipListSchema,
  RelationshipViewSchema,
  SelfProfileSchema,
  SessionSchema,
  VerificationViewSchema,
  type CreatePrimaryPetRequest,
  type MatchPreferences,
  type MovePetRequest,
  type PetActionRequest,
  type PrivacySettings,
  type UpdatePrivacyV5Request,
  type RecordConsentsRequest,
  type SendMessageRequest,
  type SignInRequest,
  type StartPauseRequest,
  type UpdateProfileRequest,
} from '@blowy/api-contract';
import { z } from 'zod';
import { HttpTransport, type ClientOptions, type CommandOptions } from './http.js';

const PauseResultSchema = z.object({ pauseId: z.string(), endsAt: z.string() });
const OkSchema = z.object({ ok: z.boolean() });
const HealthSchema = z.object({ status: z.string() });

export class BlowyClient {
  private readonly http: HttpTransport;
  constructor(opts: ClientOptions) {
    this.http = new HttpTransport(opts);
  }
  newCommandId() {
    return this.http.newCommandId();
  }

  readonly health = () => this.http.request('GET', '/v1/healthz', HealthSchema);

  readonly auth = {
    signIn: (req: SignInRequest) => this.http.request('POST', '/v1/auth/sessions', SessionSchema, req),
    sessions: () => this.http.request('GET', '/v1/auth/sessions', DeviceSessionListSchema),
    logout: () => this.http.request('DELETE', '/v1/auth/sessions/current', null),
    revoke: (sessionId: string) => this.http.request('DELETE', `/v1/auth/sessions/${sessionId}`, null),
  };

  readonly me = {
    get: () => this.http.request('GET', '/v1/me', SelfProfileSchema),
    update: (req: UpdateProfileRequest, c?: CommandOptions) => this.http.request('PATCH', '/v1/me', SelfProfileSchema, req, c),
    setMatchPreferences: (req: MatchPreferences, c?: CommandOptions) => this.http.request('PUT', '/v1/preferences/matching', SelfProfileSchema, req, c),
    setPrivacy: (req: PrivacySettings | UpdatePrivacyV5Request, c?: CommandOptions) => this.http.request('PUT', '/v1/preferences/privacy', SelfProfileSchema, req, c),
    consents: () => this.http.request('GET', '/v1/consents', ConsentStateSchema),
    recordConsents: (req: RecordConsentsRequest, c?: CommandOptions) => this.http.request('POST', '/v1/consents', ConsentStateSchema, req, c),
    startPause: (req: StartPauseRequest, c?: CommandOptions) => this.http.request('POST', '/v1/pauses', PauseResultSchema, req, c),
    endPause: (pauseId: string, c?: CommandOptions) => this.http.request('DELETE', `/v1/pauses/${pauseId}`, OkSchema, undefined, c),
    startVerification: (kind: 'SELFIE_QUALITY' | 'LIVENESS' | 'IDENTITY_AGE' = 'SELFIE_QUALITY', c?: CommandOptions) => this.http.request('POST', '/v1/verifications', VerificationViewSchema, { kind }, c),
    completeOnboarding: (c?: CommandOptions) => this.http.request('POST', '/v1/me/onboarding/complete', SelfProfileSchema, {}, c),
  };

  readonly pets = {
    create: (req: CreatePrimaryPetRequest, c?: CommandOptions) => this.http.request('POST', '/v1/pets', OwnPetViewSchema, req, c),
    mine: () => this.http.request('GET', '/v1/pets/mine', OwnPetViewSchema),
    /** Profil public d'un pet (relation partagée) ; vue complète si c'est le sien. */
    get: (petId: string) => this.http.request('GET', `/v1/pets/${petId}`, z.union([OwnPetViewSchema, PublicPetProfileSchema])),
    act: (petId: string, req: PetActionRequest, c?: CommandOptions) => this.http.request('POST', `/v1/pets/${petId}/actions`, PetActionResultSchema, req, c),
    move: (petId: string, req: MovePetRequest, c?: CommandOptions) => this.http.request('POST', `/v1/pets/${petId}/move`, OwnPetViewSchema, req, c),
  };

  readonly matching = {
    feed: () => this.http.request('GET', '/v1/matches', MatchFeedSchema),
    requestOnboardingBatch: () => this.http.request('POST', '/v1/matches/onboarding-batch', MatchFeedSchema, {}),
    accept: (proposalId: string, c?: CommandOptions) => this.http.request('POST', `/v1/match-proposals/${proposalId}/accept`, AcceptProposalResultSchema, {}, c),
  };

  readonly relationships = {
    list: (includeEnded = false) => this.http.request('GET', `/v1/relationships${includeEnded ? '?includeEnded=true' : ''}`, RelationshipListSchema),
    get: (id: string) => this.http.request('GET', `/v1/relationships/${id}`, RelationshipViewSchema),
    leave: (id: string, reason: 'CLEAN_LEAVE' | 'REPORT_SAFETY_EXIT' = 'CLEAN_LEAVE', c?: CommandOptions) => this.http.request('POST', `/v1/relationships/${id}/leave`, RelationshipViewSchema, { reason }, c),
    pause: (id: string, days: number, c?: CommandOptions) => this.http.request('POST', `/v1/relationships/${id}/pause`, RelationshipViewSchema, { days }, c),
    proposeMoveIn: (id: string, c?: CommandOptions) => this.http.request('POST', `/v1/relationships/${id}/move-in`, MoveInResultSchema, {}, c),
    respondOffer: (id: string, req: { offerId: string; decision: 'ACCEPT' | 'DECLINE'; version: number }, c?: CommandOptions) => this.http.request('POST', `/v1/relationships/${id}/consents/respond`, MoveInResultSchema, req, c),
    castBallot: (id: string, choice: 'FRIEND' | 'PLUS', c?: CommandOptions) => this.http.request('POST', `/v1/relationships/${id}/branch/ballot`, RelationshipViewSchema, { choice }, c),
    downgradeToFriend: (id: string, c?: CommandOptions) => this.http.request('POST', `/v1/relationships/${id}/branch/downgrade`, RelationshipViewSchema, {}, c),
  };

  readonly conversations = {
    list: () => this.http.request('GET', '/v1/conversations', ConversationListSchema),
    messages: (id: string, q: { cursor?: string; limit?: number } = {}) => {
      const p = new URLSearchParams();
      if (q.cursor) p.set('cursor', q.cursor);
      if (q.limit) p.set('limit', String(q.limit));
      const qs = p.toString();
      return this.http.request('GET', `/v1/conversations/${id}/messages${qs ? `?${qs}` : ''}`, MessagePageSchema);
    },
    send: (id: string, req: SendMessageRequest, c?: CommandOptions) => this.http.request('POST', `/v1/conversations/${id}/messages`, MessageViewSchema, req, c),
    markRead: (id: string, seq: number, c?: CommandOptions) => this.http.request('POST', `/v1/conversations/${id}/read`, OkSchema, { seq }, c),
    revealWarned: (messageId: string, c?: CommandOptions) => this.http.request('POST', `/v1/messages/${messageId}/reveal`, MessageViewSchema, {}, c),
  };
}
