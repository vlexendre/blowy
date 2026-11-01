/** Port de journalisation minimal (pino l'implémente) — jamais de contenu privé dans les champs. */
export interface LoggerPort {
  info(obj: Record<string, unknown>, msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
}
