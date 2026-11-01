/**
 * Confiance & sécurité : signaler / bloquer (prioritaires hors ligne, masquage local immédiat),
 * bouton d'aide 17 indépendant de l'API. Routes attendues (agent E) : POST /v1/reports,
 * POST /v1/blocks — corps proposés ci-dessous, à confirmer dans api-contract/trust.ts.
 */
import type { ReportCategory } from '@blowy/domain';
import { useCallback, useEffect, useMemo } from 'react';
import { Linking } from 'react-native';
import { z } from 'zod';
import type { Http } from '../../core/api/http';
import { routes } from '../../core/api/routes';
import { registerSender } from '../../core/offline/runner';
import { drainQueue } from '../../core/offline/runner';
import { useOfflineQueue } from '../../core/offline/store';
import { isOnlineNow } from '../../core/network/network';
import { useServices } from '../../core/providers/services';

export interface ReportInput {
  relationshipId: string | null;
  conversationId: string | null;
  category: ReportCategory;
  alsoBlock: boolean;
}

export function createTrustRepository(http: Http) {
  const ack = z.unknown();
  return {
    report: (cid: string, body: { relationshipId: string | null; conversationId: string | null; category: ReportCategory }) => http.request({ method: 'POST', path: routes.trust.reports, body, commandId: cid }, ack),
    block: (cid: string, body: { relationshipId: string | null; conversationId: string | null }) => http.request({ method: 'POST', path: routes.trust.blocks, body, commandId: cid }, ack),
  };
}

/** Enregistre les senders BLOCK/REPORT (montés une fois au niveau racine). */
export function useTrustSenders() {
  const { http } = useServices();
  const repo = useMemo(() => createTrustRepository(http), [http]);
  useEffect(() => {
    const a = registerSender('BLOCK', (c) => repo.block(c.commandId, c.payload as { relationshipId: string | null; conversationId: string | null }).then(() => undefined));
    const b = registerSender('REPORT', (c) => repo.report(c.commandId, c.payload as { relationshipId: string | null; conversationId: string | null; category: ReportCategory }).then(() => undefined));
    return () => {
      a();
      b();
    };
  }, [repo]);
}

/**
 * Signaler / bloquer passent TOUJOURS par la file (même en ligne) : masquage local immédiat,
 * arrêt des envois en attente, priorité de synchronisation, puis drain immédiat si réseau.
 */
export function useSafetyActions() {
  const { newCommandId, haptics } = useServices();
  const dispatch = useOfflineQueue((s) => s.dispatch);
  const scopeOf = (i: { conversationId: string | null; relationshipId: string | null }) => i.conversationId ?? i.relationshipId;

  const block = useCallback(
    (i: { conversationId: string | null; relationshipId: string | null }) => {
      dispatch({ type: 'enqueue', command: { commandId: newCommandId(), kind: 'BLOCK', payload: i, scope: scopeOf(i), createdAt: Date.now() } });
      haptics.warning();
      void drainQueue(isOnlineNow);
    },
    [dispatch, newCommandId, haptics],
  );

  const report = useCallback(
    (i: ReportInput) => {
      const now = Date.now();
      dispatch({ type: 'enqueue', command: { commandId: newCommandId(), kind: 'REPORT', payload: { relationshipId: i.relationshipId, conversationId: i.conversationId, category: i.category }, scope: scopeOf(i), createdAt: now } });
      if (i.alsoBlock) dispatch({ type: 'enqueue', command: { commandId: newCommandId(), kind: 'BLOCK', payload: { relationshipId: i.relationshipId, conversationId: i.conversationId }, scope: scopeOf(i), createdAt: now + 1 } });
      void drainQueue(isOnlineNow);
    },
    [dispatch, newCommandId],
  );

  return { block, report };
}

/** Numéro d'urgence (France) ; appel natif direct, aucune dépendance au backend. */
export const EMERGENCY_NUMBER = '17';
export const callEmergency = (): Promise<void> => Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
