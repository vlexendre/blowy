/**
 * Contrats /v1/auth (propriétaire : agent C).
 * Firebase : le client envoie un ID token Firebase. Local : `local:<clé>` déterministe (hors production).
 */
import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const AUTH_PROVIDERS = ['firebase', 'local'] as const;

export const SignInRequestSchema = z.object({
  provider: z.enum(AUTH_PROVIDERS),
  /** ID token Firebase, ou clé locale (`[a-z0-9._-]{1,64}`) pour LocalAuthProvider. */
  credential: z.string().min(1).max(4096),
  device: z
    .object({
      label: z.string().max(80).optional(),
      platform: z.enum(['ios', 'android', 'web', 'other']).optional(),
      appVersion: z.string().max(32).optional(),
    })
    .default({}),
});
export type SignInRequest = z.infer<typeof SignInRequestSchema>;

export const SessionSchema = z.object({
  /** Jeton de session opaque à présenter en `Authorization: Bearer`. Stocker dans SecureStore. */
  accessToken: z.string(),
  sessionId: UuidSchema,
  userId: UuidSchema,
  expiresAt: IsoDateTimeSchema,
  isNewUser: z.boolean(),
  onboardingRequired: z.boolean(),
});
export type Session = z.infer<typeof SessionSchema>;

export const DeviceSessionViewSchema = z.object({
  id: UuidSchema,
  deviceLabel: z.string().nullable(),
  platform: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  lastUsedAt: IsoDateTimeSchema,
  current: z.boolean(),
});
export type DeviceSessionView = z.infer<typeof DeviceSessionViewSchema>;

export const DeviceSessionListSchema = z.object({ items: z.array(DeviceSessionViewSchema) });
