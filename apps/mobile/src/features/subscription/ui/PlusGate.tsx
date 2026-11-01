/**
 * Garde Blowy+ : affiche `children` si le SERVEUR accorde le droit, sinon `fallback`.
 * Sans adaptateur d'achat (production sans clé), rend `fallback` sans toucher aux hooks achats.
 */
import type { EntitlementKey } from '@blowy/domain';
import type { ReactNode } from 'react';
import { useEntitlements } from '../../purchases';
import { usePurchasesAvailable } from '../model/usePurchasesAvailable';

function Inner({ entitlement, children, fallback }: { entitlement: EntitlementKey; children: ReactNode; fallback: ReactNode }) {
  const { has } = useEntitlements();
  return <>{has(entitlement) ? children : fallback}</>;
}

export function PlusGate(props: { entitlement: EntitlementKey; children: ReactNode; fallback: ReactNode }) {
  return usePurchasesAvailable() ? <Inner {...props} /> : <>{props.fallback}</>;
}
