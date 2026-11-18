/** Variables du chantier « facturation-admin » (Minimoa+ et administration), validées au démarrage. */
import { z } from 'zod';

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const Schema = z.object({
  /** Adresses e-mail autorisées sur `/admin/*`, séparées par des virgules. */
  ADMIN_EMAILS: z.string().default(''),
  /** Identifiant du bundle iOS, vérifié dans chaque transaction et notification Apple. */
  APPLE_BUNDLE_ID: z.preprocess(emptyToUndefined, z.string().default('app.blowy')),
  /** Identifiant numérique de l'app dans l'App Store (« Apple ID »), vérifié sur les notifications de production. */
  APPLE_APP_APPLE_ID: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  /** Accepter les achats du bac à sable (TestFlight, Xcode) : `1` par défaut, `0` pour les refuser. */
  APPLE_ACCEPT_SANDBOX: z.preprocess(emptyToUndefined, z.enum(['0', '1']).default('1')),
  PLUS_PRODUCT_YEARLY: z.preprocess(emptyToUndefined, z.string().default('app.blowy.plus.yearly')),
  PLUS_PRODUCT_MONTHLY: z.preprocess(emptyToUndefined, z.string().default('app.blowy.plus.monthly')),
  PLUS_PRODUCT_WEEKLY: z.preprocess(emptyToUndefined, z.string().default('app.blowy.plus.weekly')),
});

export interface FacturationAdminEnv {
  /** Adresses autorisées sur `/admin/*`, en minuscules. En démo locale sans liste : `admin@blowy.local`. */
  adminEmails: string[];
  apple: { bundleId: string; appAppleId: number | null; acceptSandbox: boolean };
  plusProducts: { yearly: string; monthly: string; weekly: string };
}

export function loadFacturationAdminEnv(source: Record<string, string | undefined>, mode: { env: 'local' | 'production'; demo: boolean }): FacturationAdminEnv {
  const parsed = Schema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  if (mode.env === 'production' && e.APPLE_APP_APPLE_ID === undefined) {
    throw new Error('configuration invalide — APPLE_APP_APPLE_ID est requis en production (vérification des notifications Apple)');
  }
  const emails = e.ADMIN_EMAILS.split(',')
    .map((m) => m.trim().toLowerCase())
    .filter((m) => m.length > 0);
  return {
    adminEmails: emails.length === 0 && mode.demo ? ['admin@blowy.local'] : emails,
    apple: { bundleId: e.APPLE_BUNDLE_ID, appAppleId: e.APPLE_APP_APPLE_ID ?? null, acceptSandbox: e.APPLE_ACCEPT_SANDBOX === '1' },
    plusProducts: { yearly: e.PLUS_PRODUCT_YEARLY, monthly: e.PLUS_PRODUCT_MONTHLY, weekly: e.PLUS_PRODUCT_WEEKLY },
  };
}
