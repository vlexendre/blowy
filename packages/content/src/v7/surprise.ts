/**
 * Questions surprises du chat (maquette V7) : deux choix, des mots-clés pour reconnaître la réponse, et les lignes du
 * minimoa quand les deux ont répondu. Français et anglais écrits ; les autres langues reprennent le français pour
 * l'instant. Le compte des points communs est écrit dans la ligne (« point commun n°3 ») : il se relit sans état.
 */
import type { Locale } from '@blowy/domain';

export interface SurpriseChoice {
  label: string;
  words: readonly string[];
}
export interface SurpriseQuestion {
  id: string;
  text: string;
  a: SurpriseChoice;
  b: SurpriseChoice;
}
interface SurpriseLines {
  /** Préfixe de toutes les questions (pour les reconnaître dans le fil). */
  prefix: string;
  questions: readonly SurpriseQuestion[];
  common: (label: string, n: number) => string;
  /** Repère du compte dans la ligne « point commun » (le nombre suit). */
  countMark: string;
  different: (a: string, b: string) => string;
  /** Fin de la ligne « pas pareil » (pour la reconnaître). */
  differentMark: string;
}

const q = (id: string, a: [string, ...string[]], b: [string, ...string[]], text: string): SurpriseQuestion => ({
  id,
  text,
  a: { label: a[0], words: a },
  b: { label: b[0], words: b },
});

const FR: SurpriseLines = {
  prefix: 'Question surprise',
  questions: [
    q('mer', ['mer', 'plage', 'ocean'], ['montagne', 'montagnes', 'rando'], 'Question surprise : mer ou montagne ?'),
    q('cafe', ['café', 'cafe'], ['thé', 'the'], 'Question surprise : café ou thé ?'),
    q('soir', ['soirée', 'soir', 'sortir', 'dehors'], ['canapé', 'canape', 'maison', 'chez moi'], 'Question surprise : soirée dehors ou canapé ?'),
    q('matin', ['matin', 'lève-tôt', 'leve tot', 'tôt', 'tot'], ['soir', 'couche-tard', 'couche tard', 'tard', 'nuit'], 'Question surprise : plutôt du matin ou du soir ?'),
    q('ville', ['ville', 'city'], ['campagne', 'nature'], 'Question surprise : ville ou campagne ?'),
    q('chat', ['chat', 'chats'], ['chien', 'chiens'], 'Question surprise : chat ou chien ?'),
    q('sale', ['salé', 'sale'], ['sucré', 'sucre'], 'Question surprise : salé ou sucré ?'),
    q('film', ['film', 'films', 'cinéma', 'cinema'], ['série', 'serie', 'séries', 'series'], 'Question surprise : film ou série ?'),
  ],
  common: (label, n) => `Vous avez dit « ${label} » tous les deux. Point commun n°${n} !`,
  countMark: 'Point commun n°',
  different: (a, b) => `${a} d’un côté, ${b} de l’autre. Ça fera de quoi discuter.`,
  differentMark: 'Ça fera de quoi discuter.',
};

const EN: SurpriseLines = {
  prefix: 'Surprise question',
  questions: [
    q('mer', ['sea', 'beach', 'ocean'], ['mountains', 'mountain', 'hiking'], 'Surprise question: sea or mountains?'),
    q('cafe', ['coffee'], ['tea'], 'Surprise question: coffee or tea?'),
    q('soir', ['out', 'going out', 'party'], ['couch', 'sofa', 'home', 'in'], 'Surprise question: night out or couch?'),
    q('matin', ['morning', 'early'], ['night', 'evening', 'late', 'owl'], 'Surprise question: morning person or night owl?'),
    q('ville', ['city', 'town'], ['countryside', 'country', 'nature'], 'Surprise question: city or countryside?'),
    q('chat', ['cat', 'cats'], ['dog', 'dogs'], 'Surprise question: cat or dog?'),
    q('sale', ['savory', 'savoury', 'salty'], ['sweet'], 'Surprise question: savory or sweet?'),
    q('film', ['movie', 'movies', 'film'], ['series', 'show', 'shows'], 'Surprise question: movie or series?'),
  ],
  common: (label, n) => `You both said “${label}”. Common ground #${n}!`,
  countMark: 'Common ground #',
  different: (a, b) => `${a} on one side, ${b} on the other. Something to talk about.`,
  differentMark: 'Something to talk about.',
};

const BY_LOCALE: Record<Locale, SurpriseLines> = { fr: FR, en: EN, es: FR, pt: FR, nl: FR };
export const surpriseLines = { in: (locale: Locale): SurpriseLines => BY_LOCALE[locale] ?? FR, all: [FR, EN] as const };

/** La question surprise d'un texte du fil (dans n'importe quelle langue écrite), ou null. */
export function surpriseOf(body: string): { lines: SurpriseLines; question: SurpriseQuestion } | null {
  for (const lines of surpriseLines.all) {
    const question = lines.questions.find((x) => x.text === body);
    if (question) return { lines, question };
  }
  return null;
}

/** Le numéro de point commun écrit dans une ligne du minimoa, ou null. */
export function commonCountOf(body: string): number | null {
  for (const lines of surpriseLines.all) {
    const i = body.indexOf(lines.countMark);
    if (i >= 0) {
      const n = Number.parseInt(body.slice(i + lines.countMark.length), 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/** Une ligne de verdict (point commun ou pas pareil) : la question d'avant a déjà sa réponse. */
export const isSurpriseVerdict = (body: string): boolean => commonCountOf(body) !== null || surpriseLines.all.some((l) => body.endsWith(l.differentMark));
