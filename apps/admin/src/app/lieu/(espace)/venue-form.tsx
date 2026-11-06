'use client';
/** Formulaire de mutation de l'espace lieu (retour affiché, Idempotency-Key fixé au rendu). */
import { useActionState, type ReactNode } from 'react';
import { IDLE, VenueNotice } from '@blowy/ui-web';
import { venueFormAction } from '../../../lib/venue-actions';

export function VenueForm({ endpoint, method = 'POST', revalidate, ok, submit, cid, hidden = {}, children }: { endpoint: string; method?: 'POST' | 'PUT'; revalidate: string; ok: string; submit: string; cid: string; hidden?: Record<string, string>; children: ReactNode }) {
  const [state, action, pending] = useActionState(venueFormAction, IDLE);
  return (
    <form action={action} className="bw-v-card bw-v-form">
      <input type="hidden" name="_endpoint" value={endpoint} />
      <input type="hidden" name="_method" value={method} />
      <input type="hidden" name="_cid" value={cid} />
      <input type="hidden" name="_ok" value={ok} />
      <input type="hidden" name="_revalidate" value={revalidate} />
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
      <button type="submit" className="bw-v-btn bw-v-btn--lime" disabled={pending} aria-busy={pending}>
        {pending ? 'En cours…' : submit}
      </button>
      <div aria-live="polite">
        {state.status === 'ok' ? <VenueNotice tone="ok">{state.message}</VenueNotice> : null}
        {state.status === 'error' ? <VenueNotice tone="error">{state.message}</VenueNotice> : null}
      </div>
    </form>
  );
}
