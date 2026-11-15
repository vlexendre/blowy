/**
 * Variables nées de l'audit App Store : compte de revue d'Apple et alertes de modération. Seulement dans
 * `apps/api/.env` ou les variables de l'hébergeur ; jamais journalisées.
 */
import { z } from 'zod';

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const Schema = z.object({
  /** Adresse du compte de revue d'Apple (une seule). Sans elle, la connexion par e-mail est fermée. */
  REVIEW_EMAIL: z.preprocess(emptyToUndefined, z.string().trim().toLowerCase().email().optional()),
  /** Code fixe du compte de revue (10 caractères au moins en production). Va avec REVIEW_EMAIL. */
  REVIEW_CODE: z.preprocess(emptyToUndefined, z.string().trim().min(4).max(64).optional()),
  /** Adresse de l'administration (liens des alertes de modération). Défaut : WEB_URL + /admin. */
  ADMIN_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

export interface AuditEnv {
  /** Compte de revue : null quand il n'est pas configuré (connexion par e-mail fermée, aucun monde d'exemple). */
  review: { email: string; code: string } | null;
  adminUrl: string;
}

export function loadAuditEnv(source: Record<string, string | undefined>, mode: { env: 'local' | 'production'; webUrl: string }): AuditEnv {
  const parsed = Schema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  if ((e.REVIEW_EMAIL === undefined) !== (e.REVIEW_CODE === undefined)) throw new Error('configuration invalide — REVIEW_EMAIL et REVIEW_CODE vont ensemble');
  if (mode.env === 'production' && e.REVIEW_CODE !== undefined && e.REVIEW_CODE.length < 10) {
    throw new Error('configuration invalide — REVIEW_CODE doit faire 10 caractères au moins en production');
  }
  return {
    review: e.REVIEW_EMAIL && e.REVIEW_CODE ? { email: e.REVIEW_EMAIL, code: e.REVIEW_CODE } : null,
    adminUrl: (e.ADMIN_URL ?? `${mode.webUrl}/admin`).replace(/\/$/, ''),
  };
}
