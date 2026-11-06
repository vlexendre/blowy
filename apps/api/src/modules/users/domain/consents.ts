/** Versions courantes des textes de consentement (à remplacer par ConfigVersion CONTENT). */
export const CURRENT_CONSENT_VERSIONS = {
  TERMS: '2026-11',
  PRIVACY: '2026-11',
  AI_MODERATION: '2026-11',
  AI_SUGGESTIONS: '2026-11',
  AI_NARRATION: '2026-11',
  /** V5 : genres recherchés (orientation, art. 9) ; retrait = intentions romance effacées. */
  SENSITIVE_PREFERENCES: '2026-11',
} as const;
export type ProcessingPurpose = keyof typeof CURRENT_CONSENT_VERSIONS;
export const REQUIRED_SOCIAL: readonly ProcessingPurpose[] = ['TERMS', 'PRIVACY', 'AI_MODERATION'];

export interface ConsentFact {
  purpose: string;
  version: string;
  granted: boolean;
  createdAt: Date;
}

/** Dernière décision par finalité (append-only : la plus récente fait foi). */
export function latestByPurpose(facts: readonly ConsentFact[]): Map<string, ConsentFact> {
  const m = new Map<string, ConsentFact>();
  for (const f of [...facts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) m.set(f.purpose, f);
  return m;
}

/** Le flux social exige les finalités nécessaires accordées dans la version courante. */
export function socialAllowed(facts: readonly ConsentFact[]): boolean {
  const latest = latestByPurpose(facts);
  return REQUIRED_SOCIAL.every((p) => {
    const f = latest.get(p);
    return !!f && f.granted && f.version === CURRENT_CONSENT_VERSIONS[p];
  });
}

/** Consentement explicite courant à une finalité (ex. SENSITIVE_PREFERENCES). */
export function consentGranted(facts: readonly ConsentFact[], purpose: ProcessingPurpose): boolean {
  const f = latestByPurpose(facts).get(purpose);
  return !!f && f.granted && f.version === CURRENT_CONSENT_VERSIONS[purpose];
}
