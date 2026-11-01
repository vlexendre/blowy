/** Validation Zod des référentiels (unicité des clés, variables allowlistées, règles éditoriales). */
import { z } from 'zod';
import { TEMPLATE_VARIABLES } from './types.js';

const VARIABLE_RE = /\{([a-zA-Z]+)\}/g;

export function templateVariables(text: string): string[] {
  return [...text.matchAll(VARIABLE_RE)].map((m) => m[1]!);
}

const allowedText = z.string().min(1).refine((s) => templateVariables(s).every((v) => (TEMPLATE_VARIABLES as readonly string[]).includes(v)), { message: 'variable de template non allowlistée' });

/** Termes interdits : physique, ou parole/sentiment attribués à l'humain. */
export const FORBIDDEN_LINE_PATTERNS: readonly RegExp[] = [
  /\b(beau|belle|mignon|sexy|physique|corps|visage|poids|taille|yeux|sourire de)\b/i,
  /\b(ton|ta|tes|son|sa|ses) (humain|humaine|maître|maîtresse|propriétaire)\b/i,
  /\b(il|elle) (pense|t'aime|t’aime|veut te|ressent)\b/i,
];

export const LineTextSchema = allowedText.refine((s) => FORBIDDEN_LINE_PATTERNS.every((re) => !re.test(s)), { message: 'réplique interdite (physique ou parole humaine)' });

export const EntrySchema = z.object({ key: z.string().regex(/^[a-z0-9_.]+$/), fr: allowedText });

export function assertUniqueKeys(keys: readonly string[]): void {
  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) throw new Error(`clé i18n dupliquée : ${k}`);
    seen.add(k);
  }
}
