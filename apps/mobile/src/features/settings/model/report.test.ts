import { CreateReportRequestSchema } from '@blowy/api-contract';
import { describe, expect, it } from 'vitest';
import { REPORT_REASONS, reportRequest } from './report';

const O = '00000000-0000-4000-8000-000000000101';
const U = '00000000-0000-4000-8000-000000000002';

describe('reportRequest', () => {
  it('chaque motif produit une requête valide pour sortie + personne', () => {
    for (const r of REPORT_REASONS) {
      const req = reportRequest(r.key, { outingId: O, userId: U }, true);
      expect(CreateReportRequestSchema.safeParse(req).success).toBe(true);
    }
  });
  it('incident sur place : sortie seule acceptée, sans blocage', () => {
    expect(reportRequest('onSite', { outingId: O }, true)).toMatchObject({ target: { outing: { id: O } }, alsoBlock: false });
    expect(reportRequest('harassment', { outingId: O }, true)).toBeNull();
  });
  it('sans contexte : aucune cible inventée', () => {
    expect(reportRequest('other', {}, false)).toBeNull();
  });
  it('sécurité : sortie de sécurité immédiate', () => {
    expect(reportRequest('sexualPressure', { outingId: O, userId: U }, false)?.safetyExit).toBe(true);
  });
});
