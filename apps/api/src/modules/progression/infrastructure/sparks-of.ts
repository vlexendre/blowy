import { SPARKS } from '@blowy/domain';

/** Étincelles enregistrées dans le résultat d'une séance (`result.sparks.total`) ; une séance d'avant vaut `SPARKS.session`. */
export function sparksOf(result: unknown): number {
  const total = (result as { sparks?: { total?: unknown } } | null)?.sparks?.total;
  return typeof total === 'number' && Number.isFinite(total) && total >= 0 ? Math.min(25, Math.round(total)) : SPARKS.session;
}
