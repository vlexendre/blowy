/**
 * Client typé de l'administration (`/admin/*`), utilisé par `apps/admin`. Même gestion d'erreurs que
 * `createApiClient` ; chaque réponse est validée avec le contrat.
 */
import {
  AdminAiCostsZ,
  AdminAuditZ,
  type AdminAuditQuery,
  AdminFunnelZ,
  AdminMeZ,
  AdminMinimoasZ,
  AdminOverviewZ,
  AdminReportDetailZ,
  AdminReportsZ,
  type AdminReportsQuery,
  AdminSuspensionsZ,
  ApiErrorZ,
  type ModerationActionBody,
  ModerationResultZ,
  adminRoutes,
} from '@blowy/contract';
import { AdminGroupZ, groupRoutes } from '@blowy/contract';
import { AdminCreatorsZ, AdminGrowthZ, AdminQuartiersZ, growthRoutes, quizRoutes } from '@blowy/contract';
import type { z } from 'zod';
import { ApiError } from './index';

export interface AdminClientOptions {
  baseUrl: string;
  getToken: () => Promise<string | null> | string | null;
  fetch?: typeof fetch;
}

type Query = Record<string, string | number | undefined>;
const qs = (q: Query): string => {
  const parts = Object.entries(q).flatMap(([k, v]) => (v === undefined || v === '' ? [] : [`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`]));
  return parts.length > 0 ? `?${parts.join('&')}` : '';
};

export function createAdminClient(opts: AdminClientOptions) {
  const doFetch = opts.fetch ?? fetch;
  const base = opts.baseUrl.replace(/\/$/, '');

  async function call<S extends z.ZodType>(method: 'GET' | 'POST', path: string, schema: S, body?: unknown): Promise<z.infer<S>> {
    const token = await opts.getToken();
    let res: Response;
    try {
      res = await doFetch(base + path, {
        method,
        headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('network', 'Connexion impossible. Vérifie ton réseau.', 0);
    }
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const parsed = ApiErrorZ.safeParse(json);
      if (parsed.success) throw new ApiError(parsed.data.error.code, parsed.data.error.message, res.status);
      throw new ApiError('internal', 'Une erreur est survenue.', res.status);
    }
    return schema.parse(json);
  }

  return {
    me: () => call('GET', adminRoutes.me(), AdminMeZ),
    overview: () => call('GET', adminRoutes.overview(), AdminOverviewZ),
    minimoas: () => call('GET', adminRoutes.minimoas(), AdminMinimoasZ),
    funnel: () => call('GET', adminRoutes.funnel(), AdminFunnelZ),
    reports: (q: Partial<AdminReportsQuery> = {}) => call('GET', adminRoutes.reports() + qs(q), AdminReportsZ),
    report: (id: string) => call('GET', adminRoutes.report(id), AdminReportDetailZ),
    act: (body: ModerationActionBody) => call('POST', adminRoutes.actions(), ModerationResultZ, body),
    audit: (q: Partial<AdminAuditQuery> = {}) => call('GET', adminRoutes.audit() + qs(q), AdminAuditZ),
    suspensions: (cursor?: string) => call('GET', adminRoutes.suspensions() + qs({ cursor }), AdminSuspensionsZ),
    aiCosts: (days = 30) => call('GET', adminRoutes.aiCosts() + qs({ days }), AdminAiCostsZ),
    /** Groupe signalé (`AdminReportItem.groupId`) : nom, état, membres ; aucune lecture des messages ici. */
    group: (id: string) => call('GET', groupRoutes.adminGroup(id), AdminGroupZ),
    /** Fermer un groupe (modération) : plus personne n'y écrit, le chat reste lisible par ses membres. */
    closeGroup: (id: string, reason: string) => call('POST', groupRoutes.adminGroupClose(id), AdminGroupZ, { reason }),
    /** Croissance : entonnoir par source et par semaine, facteur K, boucle « 3 mots », groupes viables. */
    growth: () => call('GET', growthRoutes.adminGrowth(), AdminGrowthZ),
    creators: () => call('GET', growthRoutes.adminCreators(), AdminCreatorsZ),
    createCreator: (code: string, name: string) => call('POST', growthRoutes.adminCreators(), AdminCreatorsZ, { code, name }),
    updateCreator: (code: string, patch: { name?: string; active?: boolean }) => call('POST', growthRoutes.adminCreator(code), AdminCreatorsZ, patch),
    /** Quartiers : compteurs réels, seuil d'ouverture, ouverture à la main. */
    quartiers: () => call('GET', quizRoutes.adminList(), AdminQuartiersZ),
    setQuartierThreshold: (threshold: number) => call('POST', quizRoutes.adminSettings(), AdminQuartiersZ, { threshold }),
    openQuartier: (zone: string) => call('POST', quizRoutes.adminOpen(zone), AdminQuartiersZ),
  };
}
export type AdminClient = ReturnType<typeof createAdminClient>;
