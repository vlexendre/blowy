/**
 * Repository compte (pattern Repository) : seul point d'accès HTTP de la feature.
 * Routes livrées par C : /v1/auth/sessions, /v1/me, /v1/preferences/*, /v1/consents,
 * /v1/verifications, /v1/pauses, /v1/me/onboarding/complete.
 */
import {
  ConsentStateSchema,
  DeviceSessionListSchema,
  SelfProfileSchema,
  SessionSchema,
  VerificationViewSchema,
  type MatchPreferences,
  type PrivacySettings,
  type RecordConsentsRequest,
  type UpdateProfileRequest,
} from '@blowy/api-contract';
import { Platform } from 'react-native';
import { z } from 'zod';
import type { Http } from '../../../core/api/http';
import { routes } from '../../../core/api/routes';
import type { AuthCredential } from '../../../core/ports/auth';

const CommandAck = z.unknown();

export function createAccountRepository(http: Http) {
  return {
    signIn: (c: AuthCredential, appVersion: string) =>
      http.request(
        { method: 'POST', path: routes.auth.sessions, body: { provider: c.provider, credential: c.credential, device: { platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'other', appVersion } } },
        SessionSchema,
      ),
    signOut: () => http.raw({ method: 'DELETE', path: routes.auth.current }),
    sessions: () => http.request({ method: 'GET', path: routes.auth.sessions }, DeviceSessionListSchema),
    me: () => http.request({ method: 'GET', path: routes.me.self }, SelfProfileSchema),
    updateProfile: (commandId: string, body: UpdateProfileRequest) => http.request({ method: 'PATCH', path: routes.me.self, body, commandId }, SelfProfileSchema),
    putPreferences: (commandId: string, body: MatchPreferences) => http.request({ method: 'PUT', path: routes.me.preferences, body, commandId }, SelfProfileSchema),
    putPrivacy: (commandId: string, body: PrivacySettings) => http.request({ method: 'PUT', path: routes.me.privacy, body, commandId }, SelfProfileSchema),
    consents: () => http.request({ method: 'GET', path: routes.me.consents }, ConsentStateSchema),
    recordConsents: (commandId: string, body: RecordConsentsRequest) => http.request({ method: 'POST', path: routes.me.consents, body, commandId }, ConsentStateSchema),
    startVerification: (commandId: string) => http.request({ method: 'POST', path: routes.me.verifications, body: { kind: 'SELFIE_QUALITY' }, commandId }, VerificationViewSchema),
    completeOnboarding: (commandId: string) => http.request({ method: 'POST', path: routes.me.completeOnboarding, commandId }, SelfProfileSchema),
    startPause: (commandId: string, days: number) => http.request({ method: 'POST', path: routes.me.pauses, body: { days }, commandId }, CommandAck),
    endPause: (commandId: string, id: string) => http.request({ method: 'DELETE', path: routes.me.pause(id), commandId }, CommandAck),
    /** Contrat non publié (§13 /devices, /exports, /deletion-requests) : corps minimal, demande à C. */
    registerDevice: (commandId: string, pushToken: string) => http.request({ method: 'POST', path: routes.me.devices, body: { pushToken, platform: Platform.OS }, commandId }, CommandAck),
    requestExport: (commandId: string) => http.request({ method: 'POST', path: routes.me.exports, commandId }, CommandAck),
    requestDeletion: (commandId: string) => http.request({ method: 'POST', path: routes.me.deletionRequests, commandId }, CommandAck),
  };
}
export type AccountRepository = ReturnType<typeof createAccountRepository>;
