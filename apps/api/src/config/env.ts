/** Variables d'environnement validées au démarrage : l'API refuse de démarrer si elles sont incohérentes. */
import { z } from 'zod';
import { type PlateformeEnv, loadPlateformeEnv } from './plateforme.env';
import { type FacturationAdminEnv, loadFacturationAdminEnv } from './facturation-admin.env';
import { type AppleSignInEnv, loadAppleSignInEnv } from './apple-signin.env';
import { type AuditEnv, loadAuditEnv } from './audit.env';
import { type AppVersionsEnv, loadAppVersionsEnv } from './app-versions.env';
import { type MascotsEnv, loadMascotsEnv } from './mascots.env';
import { hostsOf, isProductionHost, namesProductionSupabase } from './production-targets';

/**
 * Environnement de l'API (docs/ENVIRONNEMENTS.md) :
 * - `local` : poste de travail (démo et outils de développement possibles) ;
 * - `staging` : le dev déployé (https://api-dev.minimoa.app, branche `dev`), avec son propre projet Supabase ; ne doit
 *   jamais pointer vers la production, n'accepte que les achats du bac à sable, n'envoie d'e-mails qu'à MAIL_ALLOWLIST ;
 * - `production` : https://api.minimoa.app.
 */
export type BlowyEnv = 'local' | 'staging' | 'production';

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const EnvSchema = z
  .object({
    BLOWY_ENV: z.enum(['local', 'staging', 'production']).default('local'),
    BLOWY_ADAPTERS: z.enum(['memory', 'supabase']).default('memory'),
    BLOWY_DEMO: z.preprocess(emptyToUndefined, z.enum(['0', '1']).default('0')),
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    /** URL publique de l'API (sert aux liens d'envoi et de lecture des photos en mode mémoire). */
    API_URL: optionalString,
    SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    RESEND_API_KEY: optionalString,
    MAIL_FROM: z.string().default('Minimoa <hello@minimoa.app>'),
    /**
     * Hors production : seuls ces destinataires reçoivent les e-mails de l'API (adresses ou domaines `@exemple.fr`,
     * séparés par des virgules) ; les autres sont journalisés (domaine seulement) puis écartés. Ignorée en production.
     */
    MAIL_ALLOWLIST: optionalString,
    WEB_URL: z.string().url().default('https://minimoa.app'),
    CORS_ORIGINS: z.string().default(''),
    /** Semis d'un environnement de test au démarrage de la démo locale (docs/SEED-TEST.md) : villes (`all` : toutes). */
    BLOWY_SEED_CITIES: optionalString,
    BLOWY_SEED_PER_CITY: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(500).optional()),
    BLOWY_SEED: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
    /** `1` : chaque nouvelle inscription locale rejoint le monde du semis (elle voit ses comptes). */
    BLOWY_SEED_ADOPT: z.preprocess(emptyToUndefined, z.enum(['0', '1']).default('0')),
    /**
     * Ménage des photos de profil orphelines (`OrphanMediaJobs`, docs/ADA-2027.md) : `dry` (défaut) compte et journalise
     * sans rien effacer, `on` efface, `off` ne fait rien.
     */
    MEDIA_SWEEP: z.preprocess(emptyToUndefined, z.enum(['dry', 'on', 'off']).default('dry')),
  })
  .superRefine((env, ctx) => {
    if (env.BLOWY_ENV === 'production' && env.BLOWY_ADAPTERS === 'memory') {
      ctx.addIssue({ code: 'custom', message: 'la production refuse les adaptateurs mémoire (BLOWY_ADAPTERS=supabase)' });
    }
    if (env.BLOWY_ADAPTERS === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
      ctx.addIssue({ code: 'custom', message: 'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis avec BLOWY_ADAPTERS=supabase' });
    }
    if (env.BLOWY_ENV === 'staging') {
      // Un environnement Railway dupliqué depuis la production garde ses variables : refuser de démarrer plutôt que
      // d'écrire dans la base de production ou d'envoyer vers ses adresses.
      for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const) {
        const v = env[key];
        if (v && namesProductionSupabase(v)) ctx.addIssue({ code: 'custom', message: `BLOWY_ENV=staging : ${key} désigne le projet Supabase de production` });
      }
      for (const key of ['API_URL', 'WEB_URL'] as const) {
        const v = env[key];
        if (v && hostsOf(v).some(isProductionHost)) {
          // WEB_URL a pour défaut https://minimoa.app : en staging, il faut la poser (https://dev.minimoa.app).
          ctx.addIssue({ code: 'custom', message: `BLOWY_ENV=staging : ${key} pointe vers la production${key === 'WEB_URL' ? ' (à poser : https://dev.minimoa.app)' : ''}` });
        }
      }
    }
  });

/** Liste d'envoi des e-mails hors production : adresses exactes et domaines (`@exemple.fr`), en minuscules. */
export interface MailAllowList {
  emails: string[];
  domains: string[];
}

function parseMailAllowList(raw: string | undefined): MailAllowList | null {
  if (!raw) return null;
  const items = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  if (items.length === 0) return null;
  const bad = items.filter((s) => !/^[^@\s]*@[^@\s]+\.[^@\s]+$/.test(s));
  if (bad.length > 0) throw new Error(`configuration invalide — MAIL_ALLOWLIST : « ${bad.join(', ')} » n'est ni une adresse ni un domaine @exemple.fr`);
  return { emails: items.filter((s) => !s.startsWith('@')), domains: items.filter((s) => s.startsWith('@')).map((s) => s.slice(1)) };
}

export interface Env {
  env: BlowyEnv;
  adapters: 'memory' | 'supabase';
  demo: boolean;
  port: number;
  apiUrl: string;
  supabase: { url: string; serviceRoleKey: string } | null;
  resendApiKey: string | null;
  mailFrom: string;
  /** Destinataires permis hors production (null : pas de filtre ; toujours null en production). */
  mailAllowList: MailAllowList | null;
  webUrl: string;
  corsOrigins: string[];
  /** IA, push et minuteur (chantier « plateforme »). */
  plateforme: PlateformeEnv;
  /** Minimoa+ et administration (chantier « facturation-admin »). */
  facturationAdmin: FacturationAdminEnv;
  /** Révocation des jetons de Sign in with Apple à la suppression d'un compte. */
  appleSignIn: AppleSignInEnv;
  /** Compte de revue d'Apple et alertes de modération (audit App Store). */
  audit: AuditEnv;
  /** Versions de l'app servies (minimum, dernier build publié, fiche du magasin) : docs/VERSIONING.md. */
  appVersions: AppVersionsEnv;
  /** Minimoas animés (Masko) par espèce : docs/MOTION.md. */
  mascots: MascotsEnv;
  /** Semis au démarrage (démo locale en mémoire seulement) ; null sinon. */
  seed: SeedBootEnv | null;
  /** Ménage des photos de profil orphelines : `dry` (compte seulement), `on` (efface), `off`. */
  mediaSweep: MediaSweepMode;
}

export type MediaSweepMode = 'dry' | 'on' | 'off';

export interface SeedBootEnv {
  cities: string[];
  perCity: number | null;
  seed: number;
  adoptNewcomers: boolean;
  /** La configuration reçue, relue par les garde-fous du semis. */
  source: Readonly<Record<string, string | undefined>>;
}

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  const demo = e.BLOWY_DEMO === '1' && e.BLOWY_ENV === 'local' && e.BLOWY_ADAPTERS === 'memory';
  const facturationAdmin = loadFacturationAdminEnv(source, {
    env: e.BLOWY_ENV,
    demo: e.BLOWY_DEMO === '1' && e.BLOWY_ENV === 'local' && e.BLOWY_ADAPTERS === 'memory',
  });
  return {
    env: e.BLOWY_ENV,
    adapters: e.BLOWY_ADAPTERS,
    demo,
    port: e.PORT,
    apiUrl: (e.API_URL ?? `http://localhost:${e.PORT}`).replace(/\/$/, ''),
    supabase: e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY ? { url: e.SUPABASE_URL, serviceRoleKey: e.SUPABASE_SERVICE_ROLE_KEY } : null,
    resendApiKey: e.RESEND_API_KEY ?? null,
    mailFrom: e.MAIL_FROM,
    mailAllowList: e.BLOWY_ENV === 'production' ? null : parseMailAllowList(e.MAIL_ALLOWLIST),
    webUrl: e.WEB_URL.replace(/\/$/, ''),
    corsOrigins: e.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0),
    plateforme: loadPlateformeEnv(source, e.BLOWY_ENV, e.BLOWY_ADAPTERS),
    facturationAdmin,
    appleSignIn: loadAppleSignInEnv(source, e.BLOWY_ADAPTERS, facturationAdmin.apple.bundleId),
    audit: loadAuditEnv(source, { env: e.BLOWY_ENV, webUrl: e.WEB_URL.replace(/\/$/, '') }),
    appVersions: loadAppVersionsEnv(source),
    mascots: loadMascotsEnv(source),
    seed:
      demo && e.BLOWY_SEED_CITIES
        ? { cities: e.BLOWY_SEED_CITIES.split(','), perCity: e.BLOWY_SEED_PER_CITY ?? null, seed: e.BLOWY_SEED ?? 1, adoptNewcomers: e.BLOWY_SEED_ADOPT === '1', source }
        : null,
    mediaSweep: e.MEDIA_SWEEP,
  };
}
