/**
 * Confiance (V5) : signaler / bloquer passent par la file hors ligne prioritaire (masquage local
 * immédiat, arrêt des envois en attente) puis `POST /v1/reports` / `POST /v1/blocks` (contrat
 * `trust.ts` de E : cible `outing {id, userId}`, `petId`, `messageId` ; motifs V5.2). Numéro
 * d'urgence natif, indépendant du backend.
 */
import { CreateReportRequestSchema, type CreateReportRequest } from '@blowy/api-contract';
import { useCallback, useEffect, useMemo } from 'react';
import { Linking } from 'react-native';
import type { Api } from '../../core/api/client';
import { routes } from '../../core/api/routes';
import { isOnlineNow } from '../../core/network/network';
import { drainQueue, registerSender } from '../../core/offline/runner';
import { useOfflineQueue } from '../../core/offline/store';
import { useServices } from '../../core/providers/services';

export type ReportTarget = CreateReportRequest['target'];

export function createTrustRepository(api: Api) {
  return {
    report: (cid: string, body: CreateReportRequest) => api.send('POST', routes.reports, CreateReportRequestSchema.parse(body), { commandId: cid }),
    block: (cid: string, target: ReportTarget) => api.send('POST', routes.blocks, { target }, { commandId: cid }),
  };
}

/** Enregistre les senders BLOCK/REPORT (montés une fois au niveau racine). */
export function useTrustSenders() {
  const { api } = useServices();
  const repo = useMemo(() => createTrustRepository(api), [api]);
  useEffect(() => {
    const a = registerSender('BLOCK', (c) => repo.block(c.commandId, (c.payload as { target: ReportTarget }).target));
    const b = registerSender('REPORT', (c) => repo.report(c.commandId, c.payload as CreateReportRequest));
    return () => {
      a();
      b();
    };
  }, [repo]);
}

const scopeOf = (t: ReportTarget): string | null => t.outing?.id ?? t.relationshipId ?? t.petId ?? t.messageId ?? null;

/** Signaler / bloquer : TOUJOURS par la file (même en ligne), drain immédiat si réseau. */
export function useSafetyActions() {
  const { newCommandId, haptics, clock } = useServices();
  const dispatch = useOfflineQueue((s) => s.dispatch);

  const block = useCallback(
    (target: ReportTarget) => {
      dispatch({ type: 'enqueue', command: { commandId: newCommandId(), kind: 'BLOCK', payload: { target }, scope: scopeOf(target), createdAt: clock.now() } });
      haptics.warning();
      void drainQueue(isOnlineNow);
    },
    [dispatch, newCommandId, haptics, clock],
  );

  const report = useCallback(
    (r: CreateReportRequest) => {
      const now = clock.now();
      dispatch({ type: 'enqueue', command: { commandId: newCommandId(), kind: 'REPORT', payload: r, scope: scopeOf(r.target), createdAt: now } });
      void drainQueue(isOnlineNow);
    },
    [dispatch, newCommandId, clock],
  );

  return { block, report };
}

/** Numéro d'urgence (France) ; appel natif direct, aucune dépendance au backend. */
export const EMERGENCY_NUMBER = '17';
export const callEmergency = (n: string = EMERGENCY_NUMBER): Promise<void> => Linking.openURL(`tel:${n}`);
