/**
 * Strategy de sélection du moteur. Tant que @blowy/pet-engine n'expose pas son API publique,
 * l'adapter provisoire (paramétré par @blowy/tuning) est utilisé. Dès publication, ajouter ici
 * `PetEngineGateway` (délégation pure aux packages de B) — aucun use case ne change.
 */
import { DEFAULT_TUNING } from '@blowy/tuning';
import type { EngineGateway } from '../../application/ports/engine.gateway.js';
import { ProvisionalEngineGateway } from './provisional-engine.gateway.js';

export function createEngineGateway(): EngineGateway {
  return new ProvisionalEngineGateway(DEFAULT_TUNING);
}
