/**
 * Minimoas animés (docs/MOTION.md, « Minimoa animé » ; docs/CHEMIN.md) : quel personnage Masko joue l'app pour chaque
 * espèce. L'app ne code aucun personnage en dur : elle reçoit ce réglage avec la séance (`mascot`).
 * - `MASKO_APP_KEY` : clé d'application Masko (`masko_app_…`), publique par conception (elle ne lit que les releases
 *   du personnage) ; jamais une clé de compte Masko ici.
 * - `MASKO_<ESPÈCE>_URL` : adresse de livraison du personnage (`https://api.masko.ai/v1/canvases/<id>/delivery`) ;
 *   absente : pas de minimoa animé pour cette espèce (image habituelle). `off` : coupé.
 * - `MASKO_ENABLED=0` : tout coupé (retour à l'image habituelle partout, sans nouvelle version de l'app).
 * Nino a une release : ses valeurs (publiques) sont le défaut, pour que ça marche sans réglage.
 */
import { SPECIES, type Species } from '@blowy/domain';
import { z } from 'zod';

export const DEFAULT_MASKO_APP_KEY = 'masko_app_2c83318a41ca18ea21939344bd1e8b7a17ec76eff291bb04a98bae5e255605e2';
export const DEFAULT_MASKO_URLS: Readonly<Partial<Record<Species, string>>> = {
  nino: 'https://api.masko.ai/v1/canvases/b273f425-5fd3-49cf-9ac0-36c4944af31a/delivery',
};
/** Événements de la machine à états (les mêmes pour chaque release : docs/MOTION.md). */
export const MASKO_EVENTS = { happy: 'action::happy', think: 'action::think', cheer: 'action::cheer' } as const;

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const url = z.preprocess(emptyToUndefined, z.union([z.literal('off'), z.string().url().startsWith('https://')]).optional());

const Schema = z.object({
  MASKO_ENABLED: z.preprocess(emptyToUndefined, z.enum(['0', '1']).default('1')),
  MASKO_APP_KEY: z.preprocess(emptyToUndefined, z.string().startsWith('masko_app_').optional()),
  MASKO_NINO_URL: url,
  MASKO_SUZIE_URL: url,
  MASKO_GASTON_URL: url,
  MASKO_PIA_URL: url,
});

export interface MascotSetting {
  provider: 'masko';
  url: string;
  appKey: string;
  events: { happy: string; think: string; cheer: string };
}
/** Par espèce : le personnage animé, ou rien. */
export type MascotsEnv = Readonly<Record<Species, MascotSetting | null>>;

export function loadMascotsEnv(source: Record<string, string | undefined>): MascotsEnv {
  const parsed = Schema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  const appKey = e.MASKO_APP_KEY ?? DEFAULT_MASKO_APP_KEY;
  const given: Record<Species, string | undefined> = { nino: e.MASKO_NINO_URL, suzie: e.MASKO_SUZIE_URL, gaston: e.MASKO_GASTON_URL, pia: e.MASKO_PIA_URL };
  const out = {} as Record<Species, MascotSetting | null>;
  for (const species of SPECIES) {
    const chosen = given[species] ?? DEFAULT_MASKO_URLS[species];
    out[species] = e.MASKO_ENABLED === '1' && chosen && chosen !== 'off' ? { provider: 'masko', url: chosen, appKey, events: { ...MASKO_EVENTS } } : null;
  }
  return out;
}
