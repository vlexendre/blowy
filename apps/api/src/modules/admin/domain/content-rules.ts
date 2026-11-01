/**
 * Règles des contenus éditables (§18.7) : seules les clés EXISTANTES du référentiel peuvent être
 * surchargées ; variables de template allowlistées ; aucun HTML, script ni expression.
 */
export const ALLOWED_TEMPLATE_VARIABLES = ['pet', 'autrePet', 'lieu', 'nombre', 'prenom', 'jours', 'mot'] as const;

const VAR_RE = /\{([A-Za-z]+)\}/g;
const FORBIDDEN = [/</, />/, /\{\{/, /\$\{/, /javascript:/i, /\bon[a-z]+\s*=/i];

export function variablesOf(text: string): string[] {
  return [...new Set([...text.matchAll(VAR_RE)].map((m) => m[1]!))];
}

/** Valide une surcharge ; renvoie la liste des problèmes (vide = valide). */
export function validateContentEntry(key: string, base: string | undefined, draft: string): string[] {
  const issues: string[] = [];
  if (base === undefined) issues.push(`${key} : clé inconnue du référentiel (création de clé interdite)`);
  if (FORBIDDEN.some((r) => r.test(draft))) issues.push(`${key} : balisage ou expression interdits`);
  const vars = variablesOf(draft);
  const allowed = new Set<string>(ALLOWED_TEMPLATE_VARIABLES);
  for (const v of vars) if (!allowed.has(v)) issues.push(`${key} : variable {${v}} non autorisée`);
  if (base !== undefined) {
    const baseVars = new Set(variablesOf(base));
    for (const v of vars) if (!baseVars.has(v)) issues.push(`${key} : variable {${v}} absente du texte de référence`);
  }
  // Accolade isolée non reconnue = probablement une faute de syntaxe.
  if (draft.replace(VAR_RE, '').match(/[{}]/)) issues.push(`${key} : accolade isolée`);
  return issues;
}

/** Rendu de prévisualisation : variables remplacées par des exemples fixes. */
export const PREVIEW_SAMPLES: Record<(typeof ALLOWED_TEMPLATE_VARIABLES)[number], string> = {
  pet: 'Nino',
  autrePet: 'Suzie',
  lieu: 'au café',
  nombre: '3',
  prenom: 'Alex',
  jours: '7',
  mot: 'solaire',
};

export function renderPreview(text: string): string {
  return text.replace(VAR_RE, (m, v: string) => (v in PREVIEW_SAMPLES ? PREVIEW_SAMPLES[v as keyof typeof PREVIEW_SAMPLES] : m));
}

/** Différences profondes entre deux objets JSON (chemins pointés), bornées. */
export function jsonDiff(before: unknown, after: unknown, path = '', out: { path: string; before: unknown; after: unknown }[] = [], max = 500) {
  if (out.length >= max) return out;
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  if (isObj(before) && isObj(after)) {
    for (const k of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) jsonDiff(before[k], after[k], path ? `${path}.${k}` : k, out, max);
    return out;
  }
  if (JSON.stringify(before) !== JSON.stringify(after)) out.push({ path: path || '(racine)', before, after });
  return out;
}
