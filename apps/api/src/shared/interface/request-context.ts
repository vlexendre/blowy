/** Contexte de requête (requestId, utilisateur authentifié). */
import type { Request } from 'express';
import type { AuthenticatedUser } from '../application/session.port.js';

export type { AuthenticatedUser };

export interface BlowyRequest extends Request {
  requestId?: string;
  user?: AuthenticatedUser;
  /** Corps brut (webhooks signés uniquement). */
  rawBody?: Buffer;
}
