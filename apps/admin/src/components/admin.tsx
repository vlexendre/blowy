/**
 * Composition admin réutilisée par toutes les pages (aucune page ne recompose ces blocs) :
 *  - <Show> : rend une ApiResult en contenu ou en état explicite (refus, service non branché,
 *    session expirée, erreur) — jamais de donnée inventée ;
 *  - <Mutation> : formulaire de mutation (Idempotency-Key fixé au rendu, feedback, step-up).
 */
import { randomUUID } from 'node:crypto';
import type { ReactNode } from 'react';
import { ActionForm, ButtonLink, StatusState } from '@blowy/ui-web';
import type { ApiResult } from '../lib/api';
import { mutate } from '../lib/actions';

export function Show<T>({ result, children }: { result: ApiResult<T>; children: (data: T) => ReactNode }) {
  if (result.ok) return <>{children(result.data)}</>;
  switch (result.kind) {
    case 'refused':
      return <StatusState kind="refused" detail={result.message} requestId={result.requestId} />;
    case 'unwired':
      return <StatusState kind="unwired" detail={`${result.message}. Aucune donnée n’est affichée tant que le service n’est pas branché.`} requestId={result.requestId} />;
    case 'unauthenticated':
      return <StatusState kind="unauthenticated" detail="Reconnecte-toi pour continuer." action={<ButtonLink href="/login" size="sm">Se connecter</ButtonLink>} />;
    case 'notFound':
      return <StatusState kind="error" detail="Élément introuvable." requestId={result.requestId} />;
    default:
      return <StatusState kind="error" detail={result.message} requestId={result.requestId} />;
  }
}

export function Mutation({
  endpoint,
  method = 'POST',
  label,
  ok,
  revalidate,
  variant,
  inline,
  confirm,
  children,
}: {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'DELETE';
  label: string;
  ok: string;
  revalidate?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ink' | 'lime';
  inline?: boolean;
  confirm?: string;
  children?: ReactNode;
}) {
  return (
    <ActionForm action={mutate} submitLabel={label} variant={variant} inline={inline} confirm={confirm}>
      <input type="hidden" name="_endpoint" value={endpoint} />
      <input type="hidden" name="_method" value={method} />
      <input type="hidden" name="_cid" value={randomUUID()} />
      <input type="hidden" name="_ok" value={ok} />
      {revalidate ? <input type="hidden" name="_revalidate" value={revalidate} /> : null}
      {children}
    </ActionForm>
  );
}

export const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : '—');
export const qs = (params: Record<string, string | undefined>) => {
  const p = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
  const s = p.toString();
  return s ? `?${s}` : '';
};
