/**
 * Phrases en plusieurs morceaux (titre à partie estompée, mot en couleur dans une bulle, lien dans une mention,
 * révélation mot à mot) : règles d'espacement communes, pures et testées.
 *
 * Un morceau (« run ») devient un `<Text>` imbriqué dans un seul `<Text>` parent. Les espaces aux jointures se perdaient
 * ou se déplaçaient : espace ou `\n` en fin de morceau stylé, nœud fait seulement d'espaces entre deux morceaux,
 * double espace quand les deux côtés en apportaient un, espace normale coupée avant « ? ». Ici :
 * - l'espace d'une jointure passe au début du morceau suivant (jamais en fin d'un morceau stylé, jamais seule) ;
 * - deux espaces qui se rejoignent n'en font qu'une (`\n` l'emporte, puis l'espace insécable) ;
 * - une espace normale avant `? ! : ; » € %` (ou après `«`) devient insécable, comme le veut le français.
 */

/** Espaces où une ligne peut se couper (l'insécable U+00A0 et la fine U+202F n'en font pas partie). */
const BREAKING = /[ \t\n\r]/;
const NBSP = ' ';
const NNBSP = ' ';
const isSpace = (c: string): boolean => BREAKING.test(c) || c === NBSP || c === NNBSP;

/** Espace normale avant `? ! : ; » € %` ou après `«` → insécable (la ponctuation ou l'unité ne part plus seule à la ligne). */
export function frenchSpaces(text: string): string {
  if (!text.includes(' ')) return text;
  // Même longueur qu'avant (une insécable par espace) : les morceaux se découpent aux mêmes positions.
  return text.replace(/ +(?=[?!:;»€%])/g, (m) => NBSP.repeat(m.length)).replace(/«( +)/g, (_m, sp: string) => `«${NBSP.repeat(sp.length)}`);
}

/** Plusieurs espaces qui se rejoignent → une seule : `\n` gardés tels quels, sinon insécable si l'un l'est, sinon ` `. */
function collapse(space: string): string {
  if (space.includes('\n')) return space.replace(/[^\n]/g, '');
  if (space.includes(NNBSP)) return NNBSP;
  if (space.includes(NBSP)) return NBSP;
  return ' ';
}

const leading = (s: string): number => {
  let i = 0;
  while (i < s.length && isSpace(s[i] as string)) i += 1;
  return i;
};
const trailing = (s: string): number => {
  let i = s.length;
  while (i > 0 && isSpace(s[i - 1] as string)) i -= 1;
  return s.length - i;
};

export interface RunLike {
  text: string;
}

/**
 * Morceaux prêts à imbriquer : espaces des jointures déplacées au début du morceau suivant et fusionnées,
 * espaces françaises, morceaux vides retirés. `noLeadingSpace(run)` : morceau qui ne doit pas commencer par une espace
 * (lien souligné : on ne souligne pas l'espace) ; elle reste alors à la fin du morceau précédent.
 */
export function normalizeRuns<T extends RunLike>(runs: readonly T[], opts: { noLeadingSpace?: (run: T) => boolean } = {}): T[] {
  // Les espaces françaises se décident sur la phrase entière (« Tom » + « ! » de deux morceaux différents).
  const joined = frenchSpaces(runs.map((r) => r.text).join(''));
  let at = 0;
  const texts = runs.map((r) => {
    const t = joined.slice(at, at + r.text.length);
    at += r.text.length;
    return t;
  });

  const out: T[] = [];
  let carry = '';
  texts.forEach((text, i) => {
    const run = runs[i] as T;
    let t = text;
    const lead = leading(t);
    // Un lien souligné ne commence pas par une espace : elle reste à la fin du morceau précédent.
    if ((carry || lead) && opts.noLeadingSpace?.(run)) {
      const prev = out[out.length - 1];
      if (prev) out[out.length - 1] = { ...prev, text: prev.text + collapse(carry + t.slice(0, lead)) };
      t = t.slice(lead);
      carry = '';
    } else if (carry || lead) {
      t = collapse(carry + t.slice(0, lead)) + t.slice(lead);
      carry = '';
    }
    const last = i === texts.length - 1;
    const tail = last ? 0 : trailing(t);
    if (tail && tail < t.length) {
      carry = t.slice(t.length - tail);
      t = t.slice(0, t.length - tail);
    } else if (tail && tail === t.length) {
      // Morceau fait seulement d'espaces : il rejoint le suivant.
      carry = t;
      t = '';
    }
    if (t) out.push({ ...run, text: t });
  });
  if (carry) {
    const prev = out[out.length - 1];
    if (prev) out[out.length - 1] = { ...prev, text: prev.text + collapse(carry) };
  }
  return out;
}

/** Un mot à révéler, avec l'espace qui le précède (jamais un mot fait seulement d'espaces). */
export interface RevealToken<T extends RunLike> {
  run: T;
  /** Espace (sécable) qui précède le mot, puis le mot (insécables compris : « naissance ? » reste un mot). */
  text: string;
  /** Rang du mot (0, 1, 2…) ; -1 pour des espaces seules en fin de phrase. */
  word: number;
}

/** Découpe des morceaux (déjà normalisés) en mots pour une révélation mot à mot. */
export function revealTokens<T extends RunLike>(runs: readonly T[]): RevealToken<T>[] {
  const out: RevealToken<T>[] = [];
  let word = 0;
  for (const run of runs) {
    const parts = run.text.match(/[ \t\n\r]*[^ \t\n\r]+|[ \t\n\r]+$/g) ?? [];
    for (const text of parts) {
      const isWord = /[^ \t\n\r]/.test(text);
      out.push({ run, text, word: isWord ? word++ : -1 });
    }
  }
  return out;
}

/** Nombre de mots montrés par une révélation mot à mot (même découpe que `revealTokens`). */
export function countRunWords(runs: readonly RunLike[]): number {
  return revealTokens(normalizeRuns(runs)).filter((t) => t.word >= 0).length;
}

/** Morceaux d'une phrase avec un mot mis en avant (le dernier qui correspond : « salut, moi c'est m » → pas « moi »). */
export function highlightRuns(text: string, highlight?: string): { text: string; hot?: boolean }[] {
  const at = highlight ? text.lastIndexOf(highlight) : -1;
  if (!highlight || at < 0) return [{ text }];
  return [{ text: text.slice(0, at) }, { text: highlight, hot: true }, { text: text.slice(at + highlight.length) }].filter((r) => r.text);
}

/** Applique `frenchSpaces` aux chaînes d'un `children` React (les éléments sont laissés tels quels). */
export function frenchChildren<C>(children: C): C {
  if (typeof children === 'string') return frenchSpaces(children) as C;
  if (Array.isArray(children)) return children.map((c) => (typeof c === 'string' ? frenchSpaces(c) : c)) as C;
  return children;
}
