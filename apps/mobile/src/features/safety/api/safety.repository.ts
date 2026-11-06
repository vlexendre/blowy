/** Sécurité (spec-v5 §7.4, contrats `safety`/`trust` de E) : ange gardien, besoin d'aide, départ, signalement. */
import {
  CreateGuardianLinkResponseSchema,
  GuardianLinkListSchema,
  RaiseAlertResponseSchema,
  ReportViewSchema,
  ResolveAlertResponseSchema,
  SafetyOkResponseSchema,
  SafetyStatusViewSchema,
  UneasyLeaveResponseSchema,
  type CreateReportRequest,
  type SafetySubject,
} from '@blowy/api-contract';
import { z } from 'zod';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';

export function createSafetyRepository(api: Api) {
  return {
    status: (s: SafetySubject) =>
      api.request('GET', routes.safetyStatus(s.kind, s.id), SafetyStatusViewSchema),
    links: (s: SafetySubject) =>
      api.request(
        'GET',
        `${routes.guardianLinks}?subjectKind=${encodeURIComponent(s.kind)}&subjectId=${encodeURIComponent(s.id)}`,
        GuardianLinkListSchema,
      ),
    createLink: (s: SafetySubject, label: string | undefined, cid: string) =>
      api.request(
        'POST',
        routes.guardianLinks,
        CreateGuardianLinkResponseSchema,
        { subject: s, ...(label ? { label } : null) },
        { commandId: cid },
      ),
    revokeLink: (id: string, cid: string) =>
      api.send('DELETE', routes.guardianLink(id), undefined, { commandId: cid }),
    ok: (s: SafetySubject, cid: string) =>
      api.request(
        'POST',
        routes.safetyOk,
        SafetyOkResponseSchema,
        { subject: s },
        { commandId: cid },
      ),
    /** « Besoin d'aide » : jamais de position (V5.3 A.4). */
    alert: (s: SafetySubject, cid: string) =>
      api.request(
        'POST',
        routes.safetyAlerts,
        RaiseAlertResponseSchema,
        { subject: s },
        { commandId: cid },
      ),
    resolve: (alertId: string, cid: string) =>
      api.request(
        'POST',
        routes.safetyResolve(alertId),
        ResolveAlertResponseSchema,
        { status: 'SAFE' },
        { commandId: cid },
      ),
    leave: (s: SafetySubject, notifyGuardian: boolean, cid: string) =>
      api.request(
        'POST',
        routes.safetyLeave,
        UneasyLeaveResponseSchema,
        { subject: s, notifyGuardian },
        { commandId: cid },
      ),
    report: (body: CreateReportRequest, cid: string) =>
      api.request('POST', routes.reports, ReportViewSchema, body, { commandId: cid }),
    block: (target: CreateReportRequest['target'], cid: string) =>
      api.request('POST', routes.blocks, z.unknown(), { target }, { commandId: cid }),
  };
}
