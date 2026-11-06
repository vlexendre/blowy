import { describe, expect, it } from 'vitest';
import { ruleV57 } from './rules';

describe('règles V5.7 (@blowy/content)', () => {
  it('lit les phrases du catalogue partagé', () => {
    expect(ruleV57('help_callback')).toBe('Quelqu’un de l’équipe te rappelle en quelques minutes.');
    expect(ruleV57('emergency_label')).toBe('Je ne le sens pas');
    expect(ruleV57('reliability_self')).toBe('Visible par toi seulement.');
  });
});
