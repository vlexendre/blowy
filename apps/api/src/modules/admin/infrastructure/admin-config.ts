/**
 * Configuration du module admin, validée au démarrage (fail-fast, même principe que economy).
 *  - STAFF_SESSION_SECRET : HMAC des sessions staff / CSRF / jetons d'attente MFA (≥ 32) ;
 *  - STAFF_MFA_KEY : clé maîtresse de dérivation des secrets TOTP (≥ 32) ;
 *  - PUBLIC_LINK_SECRET : signature des liens d'invitation et des jetons de formulaire public.
 * Valeurs par défaut UNIQUEMENT en local/test (documentées, jamais utilisables en production).
 */
import { z } from 'zod';

const LOCAL_DEFAULTS = {
  STAFF_SESSION_SECRET: 'local-only-staff-session-secret-not-for-production-01',
  STAFF_MFA_KEY: 'local-only-staff-mfa-master-key-not-for-production-0001',
  PUBLIC_LINK_SECRET: 'local-only-public-link-secret-not-for-production-00001',
} as const;

const Schema = z.object({
  BLOWY_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  STAFF_SESSION_SECRET: z.string().min(32),
  STAFF_MFA_KEY: z.string().min(32),
  PUBLIC_LINK_SECRET: z.string().min(32),
  STAFF_SESSION_TTL_MINUTES: z.coerce.number().int().min(15).max(12 * 60).default(8 * 60),
  STAFF_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  PUBLIC_WEB_ORIGIN: z.string().url().default('http://localhost:3002'),
  INVITE_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  // Espace lieu partenaire (V5 §10.2) : sessions COURTES, astreinte affichée.
  VENUE_SESSION_TTL_MINUTES: z.coerce.number().int().min(15).max(8 * 60).default(120),
  VENUE_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  VENUE_ONCALL_PHONE: z.string().trim().min(6).max(30).optional(),
  VENUE_ONCALL_HOURS: z.string().trim().min(3).max(80).default('18 h – 2 h, chaque soir de sortie'),
});

export interface AdminConfig {
  env: 'local' | 'test' | 'staging' | 'production';
  staffSessionSecret: string;
  staffMfaKey: string;
  publicLinkSecret: string;
  sessionTtlMs: number;
  idleTimeoutMs: number;
  publicWebOrigin: string;
  inviteTtlDays: number;
  /** Cookies `Secure` exigés (tout sauf local/test). */
  secureCookies: boolean;
  venueSessionTtlMs: number;
  venueIdleTimeoutMs: number;
  /** Numéro d'astreinte affiché aux lieux ; null en production s'il n'est pas configuré (jamais inventé). */
  venueOnCallPhone: string | null;
  venueOnCallHours: string;
}

/** Numéro d'astreinte de démonstration (local/test uniquement). */
const LOCAL_ONCALL_PHONE = '01 84 80 12 34';

export class AdminConfigError extends Error {}

export function loadAdminConfig(env: NodeJS.ProcessEnv = process.env): AdminConfig {
  const blowyEnv = env.BLOWY_ENV ?? 'local';
  const isLocal = blowyEnv === 'local' || blowyEnv === 'test';
  const raw = Object.fromEntries(Object.entries(env).filter(([, v]) => typeof v === 'string' && v !== ''));
  const parsed = Schema.safeParse(isLocal ? { ...LOCAL_DEFAULTS, ...raw } : raw);
  if (!parsed.success) throw new AdminConfigError(`Configuration admin invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  const c = parsed.data;
  if (!isLocal) {
    const reused = (Object.keys(LOCAL_DEFAULTS) as (keyof typeof LOCAL_DEFAULTS)[]).filter((k) => c[k] === LOCAL_DEFAULTS[k]);
    if (reused.length) throw new AdminConfigError(`Secrets locaux interdits hors local/test : ${reused.join(', ')}`);
    if (new Set([c.STAFF_SESSION_SECRET, c.STAFF_MFA_KEY, c.PUBLIC_LINK_SECRET]).size !== 3) throw new AdminConfigError('Les secrets admin doivent être distincts');
  }
  return {
    env: c.BLOWY_ENV,
    staffSessionSecret: c.STAFF_SESSION_SECRET,
    staffMfaKey: c.STAFF_MFA_KEY,
    publicLinkSecret: c.PUBLIC_LINK_SECRET,
    sessionTtlMs: c.STAFF_SESSION_TTL_MINUTES * 60_000,
    idleTimeoutMs: c.STAFF_IDLE_TIMEOUT_MINUTES * 60_000,
    publicWebOrigin: c.PUBLIC_WEB_ORIGIN,
    inviteTtlDays: c.INVITE_TTL_DAYS,
    secureCookies: !isLocal,
    venueSessionTtlMs: c.VENUE_SESSION_TTL_MINUTES * 60_000,
    venueIdleTimeoutMs: c.VENUE_IDLE_TIMEOUT_MINUTES * 60_000,
    venueOnCallPhone: c.VENUE_ONCALL_PHONE ?? (isLocal ? LOCAL_ONCALL_PHONE : null),
    venueOnCallHours: c.VENUE_ONCALL_HOURS,
  };
}

export const ADMIN_CONFIG = Symbol('AdminConfig');
