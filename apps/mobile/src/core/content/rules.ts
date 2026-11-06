/**
 * Textes de règles V5.6/V5.7 servis par `@blowy/content` (source unique, partagée avec l'API et l'espace lieu) :
 * l'app ne recopie pas ces phrases, elle les lit ici.
 */
import { RULES_V57, answerAtFromInstants } from '@blowy/content';

export type RuleV57Id =
  | 'safety_exit'
  | 'knows_someone'
  | 'emergency'
  | 'emergency_label'
  | 'cancel'
  | 'help_callback'
  | 'reliability_self'
  | 'plus_pricing'
  | 'calm_badge'
  | 'oncall_duo';

export function ruleV57(id: RuleV57Id): string {
  const entry = RULES_V57.find((r) => r.id === id);
  if (!entry) throw new Error(`règle V5.7 inconnue : ${id}`);
  return entry.fr;
}

export { answerAtFromInstants };
