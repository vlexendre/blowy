/**
 * Repository compte (pattern Repository) : délègue à BlowyClient (routes et DTO de C).
 * Routes hors client (devices, exports, suppression) via `api.raw` — contrats à publier.
 */
import type { MatchPreferences, PrivacySettings, RecordConsentsRequest, UpdateProfileRequest } from '@blowy/api-contract';
import type { Api } from '../../../core/api/client';
import { rawRoutes } from '../../../core/api/routes';
import type { AuthCredential } from '../../../core/ports/auth';

export type DevicePlatform = 'ios' | 'android' | 'web' | 'other';

/** `platform` injecté (Platform.OS côté app) : le repository reste pur et testable sous Node. */
export function createAccountRepository({ client, raw }: Api, platform: DevicePlatform) {
  return {
    signIn: (c: AuthCredential, appVersion: string) => client.auth.signIn({ provider: c.provider, credential: c.credential, device: { platform, appVersion } }),
    signOut: () => client.auth.logout(),
    sessions: () => client.auth.sessions(),
    me: () => client.me.get(),
    updateProfile: (commandId: string, body: UpdateProfileRequest) => client.me.update(body, { commandId }),
    putPreferences: (commandId: string, body: MatchPreferences) => client.me.setMatchPreferences(body, { commandId }),
    putPrivacy: (commandId: string, body: PrivacySettings) => client.me.setPrivacy(body, { commandId }),
    consents: () => client.me.consents(),
    recordConsents: (commandId: string, body: RecordConsentsRequest) => client.me.recordConsents(body, { commandId }),
    startVerification: (commandId: string) => client.me.startVerification('SELFIE_QUALITY', { commandId }),
    completeOnboarding: (commandId: string) => client.me.completeOnboarding({ commandId }),
    startPause: (commandId: string, days: number) => client.me.startPause({ days }, { commandId }),
    endPause: (commandId: string, id: string) => client.me.endPause(id, { commandId }),
    registerDevice: (commandId: string, pushToken: string) => raw({ method: 'POST', path: rawRoutes.me.devices, body: { pushToken, platform }, commandId }),
    requestExport: (commandId: string) => raw({ method: 'POST', path: rawRoutes.me.exports, commandId }),
    requestDeletion: (commandId: string) => raw({ method: 'POST', path: rawRoutes.me.deletionRequests, commandId }),
  };
}
export type AccountRepository = ReturnType<typeof createAccountRepository>;
