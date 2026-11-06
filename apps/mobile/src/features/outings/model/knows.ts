/**
 * « Je connais quelqu'un ici » (V5.6 A.1, E18, E23) : issue PRIVÉE renvoyée par
 * `POST /v1/outings/:id/seat/knows-someone`. Jamais montrée à la personne visée.
 */
import type { KnowsSomeoneResponseSchema } from '@blowy/api-contract';
import type { z } from 'zod';

export type KnowsSomeoneResponse = z.infer<typeof KnowsSomeoneResponseSchema>;

export type KnowsOutcome =
  | { kind: 'moved'; newOutingId: string }
  | { kind: 'removed' }
  | { kind: 'review' }
  | { kind: 'safety' };

export function knowsOutcome(r: KnowsSomeoneResponse): KnowsOutcome {
  switch (r.status) {
    case 'MOVED':
      return r.newOutingId ? { kind: 'moved', newOutingId: r.newOutingId } : { kind: 'removed' };
    case 'IN_REVIEW':
      return { kind: 'review' };
    // `COUNTED_AS_CANCEL` n'est plus renvoyé (V5.6) ; un ancien serveur le lirait comme un départ pour sécurité examiné.
    case 'SAFETY_REVIEW':
    case 'COUNTED_AS_CANCEL':
      return { kind: 'safety' };
  }
}
