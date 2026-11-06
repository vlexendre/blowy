/**
 * Repository compte (pattern Repository) : délègue à BlowyClient (routes et DTO de C).
 * Routes hors client (devices, exports, suppression) via `api.raw` — contrats à publier.
 */
import {
  IntentionsV5Schema,
  NeighborhoodListSchema,
  CityInsightsViewSchema,
  NeighborhoodStatusViewSchema,
  OutingPreferencesV5ViewSchema,
  SelfProfileSchema,
  type IntentionsV5Dto,
  type MatchPreferences,
  type OutingPreferencesV5Dto,
  type PrivacySettings,
  type PrivacySettingsV5,
  type RecordConsentsRequest,
  type UpdateProfileRequest,
} from '@blowy/api-contract';
import { z } from 'zod';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';
import type { AuthCredential } from '../../../core/ports/auth';

export type DevicePlatform = 'ios' | 'android' | 'web' | 'other';

/** `platform` injecté (Platform.OS côté app) : le repository reste pur et testable sous Node. */
export function createAccountRepository({ client, raw, request }: Api, platform: DevicePlatform) {
  return {
    signIn: (c: AuthCredential, appVersion: string) =>
      client.auth.signIn({
        provider: c.provider,
        credential: c.credential,
        device: { platform, appVersion },
      }),
    signOut: () => client.auth.logout(),
    sessions: () => client.auth.sessions(),
    me: () => client.me.get(),
    updateProfile: (commandId: string, body: UpdateProfileRequest) =>
      client.me.update(body, { commandId }),
    putPreferences: (commandId: string, body: MatchPreferences) =>
      client.me.setMatchPreferences(body, { commandId }),
    putPrivacy: (commandId: string, body: PrivacySettings) =>
      client.me.setPrivacy(body, { commandId }),
    consents: () => client.me.consents(),
    recordConsents: (commandId: string, body: RecordConsentsRequest) =>
      client.me.recordConsents(body, { commandId }),
    startVerification: (commandId: string) =>
      client.me.startVerification('SELFIE_QUALITY', { commandId }),
    completeOnboarding: (commandId: string) => client.me.completeOnboarding({ commandId }),
    startPause: (commandId: string, days: number) => client.me.startPause({ days }, { commandId }),
    endPause: (commandId: string, id: string) => client.me.endPause(id, { commandId }),
    registerDevice: (commandId: string, pushToken: string) =>
      raw({ method: 'POST', path: '/v1/devices', body: { pushToken, platform }, commandId }),
    requestExport: (commandId: string) => raw({ method: 'POST', path: '/v1/exports', commandId }),
    requestDeletion: (commandId: string) =>
      raw({
        method: 'POST',
        path: routes.deletionRequests,
        body: { confirm: 'SUPPRIMER' },
        commandId,
      }),
    // ---- V5 (spec-v5 §7.1)
    intentions: () => request('GET', routes.intentions, IntentionsV5Schema),
    putIntentions: (commandId: string, body: IntentionsV5Dto) =>
      request('PUT', routes.intentions, z.unknown(), body, { commandId }),
    /** V5.6 : toujours 200 (défauts, `neighborhoodIds` possiblement vide). */
    outingPreferences: () => request('GET', routes.outingPrefs, OutingPreferencesV5ViewSchema),
    putOutingPreferences: (commandId: string, body: OutingPreferencesV5Dto) =>
      request('PUT', routes.outingPrefs, z.unknown(), body, { commandId }),
    putPrivacyV5: (commandId: string, body: Partial<PrivacySettingsV5>) =>
      request('PUT', routes.privacy, SelfProfileSchema.or(z.unknown()), body, { commandId }),
    neighborhoods: (q?: string) => request('GET', routes.neighborhoods(q), NeighborhoodListSchema),
    myNeighborhood: () => request('GET', routes.meNeighborhood, NeighborhoodStatusViewSchema),
    cityInsights: () => request('GET', routes.cityInsights, CityInsightsViewSchema),
    setNeighborhood: (commandId: string, neighborhoodId: string) =>
      request(
        'PUT',
        routes.meNeighborhood,
        NeighborhoodStatusViewSchema,
        { neighborhoodId },
        { commandId },
      ),
  };
}
export type AccountRepository = ReturnType<typeof createAccountRepository>;
