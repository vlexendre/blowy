/**
 * Textes de la vision (test, profil, explication des rencontres, carte), par langue.
 * Les clés des questions et des axes viennent de `@blowy/domain` (vision.ts).
 */
import type { AxisSide, Locale, VisionAxis } from '@blowy/domain';
import { TODO, defineMessages } from '../i18n/core';

export interface VisionQuestionText {
  situation: string;
  choices: readonly [string, string];
}

export interface VisionAxisText {
  name: string;
  /** Pôle −. */
  low: string;
  /** Pôle +. */
  high: string;
  /** Ce que l'axe mesure, en une ligne. */
  about: string;
}

export type VisionVia = 'friend_of_friend' | 'nearby' | 'new';

const fr = {
  /** Les 12 situations du test : concrètes, adultes, sans bonne réponse. Ni religion, ni politique, ni santé. */
  questions: {
    dimanche: { situation: 'Dimanche, rien de prévu.', choices: ['Je reste chez moi, plaid et série.', 'Je sors : marché, expo, apéro.'] },
    enfants: { situation: 'Dans dix ans, autour de ta table…', choices: ['Des enfants qui renversent leur verre.', 'Des amis, et de la place pour l’imprévu.'] },
    mutation: { situation: 'On te propose un poste à l’autre bout du monde.', choices: ['Je fais mes cartons.', 'Je reste, ma vie est ici.'] },
    heritage: { situation: 'Tu reçois 10 000 € d’un coup.', choices: ['Je les mets de côté, ça servira.', 'Je m’offre un beau souvenir.'] },
    promotion: { situation: 'Une grosse promotion, avec des soirs en plus au travail.', choices: ['J’y vais, c’est le moment.', 'Je garde mes soirées.'] },
    vacances: { situation: 'Les vacances d’été.', choices: ['Un billet aller, on verra sur place.', 'Tout est réservé depuis mars.'] },
    appartement: { situation: 'Signer un crédit sur 25 ans pour un appartement à deux.', choices: ['Ça me fait rêver.', 'Ça me donne des sueurs.'] },
    vendredi: { situation: 'Vendredi soir, 23 h.', choices: ['Encore dehors, la soirée commence.', 'Au lit, demain j’ai des choses à faire.'] },
    cinq_ans: { situation: 'Dans cinq ans, tu habites…', choices: ['Dans le même coin, près des miens.', 'Ailleurs, peut-être dans un autre pays.'] },
    projet: { situation: 'Un projet perso te tient à cœur (une boîte, un album, une asso).', choices: ['J’y mets mes soirs et mes week-ends.', 'Il attendra, je profite d’abord.'] },
    soirees: { situation: 'Ta soirée idéale, en semaine.', choices: ['Dîner à la maison avec la personne qui partage ma vie.', 'Ce qui se présente, je décide sur le moment.'] },
    quartier: { situation: 'Ton quartier idéal.', choices: ['Calme, des arbres, on connaît le boulanger.', 'Animé, des bars, ça bouge tard.'] },
  } as Record<string, VisionQuestionText>,
  test: {
    title: 'Ta vision',
    intro: '12 situations, une par écran. Il n’y a pas de bonne réponse.',
  },
  axes: {
    foyer: { name: 'Foyer', low: 'Libre, en solo', high: 'Fonder un foyer', about: 'Couple durable, enfants, vie de famille.' },
    ancrage: { name: 'Ancrage', low: 'Rester ici', high: 'Partir', about: 'Où vivre : ici, ailleurs, à l’étranger.' },
    elan: { name: 'Élan', low: 'Du temps pour soi', high: 'De grands projets', about: 'La place du travail et de l’ambition.' },
    rythme: { name: 'Rythme', low: 'Calme, chez soi', high: 'Intense, dehors', about: 'Le quotidien que tu veux.' },
    cap: { name: 'Cap', low: 'Au jour le jour', high: 'Tout prévoir', about: 'Long terme, argent, organisation.' },
  } as Record<VisionAxis, VisionAxisText>,
  /** Où la personne penche sur un axe (pôles en minuscules). */
  side: {
    mid: (low: string, high: string) => `Entre les deux : ${low} ou ${high}.`,
    lean: (pole: string) => `Plutôt ${pole}.`,
  },
  profile: {
    title: 'Ta vision, pour l’instant',
    /** Mention visible sur l'écran du profil (spéc. §3). */
    note: 'Indicatif. Il s’affine avec toi.',
    empty: 'Passe le test de vision pour que ton minimoa sache qui te présenter.',
  },
  /** Un point commun, par axe et par côté partagé. */
  common: {
    foyer: { high: 'Vous deux, vous voulez fonder un foyer.', low: 'Vous deux, vous tenez à votre liberté.', mid: 'Le foyer : ni pressés, ni fermés, l’un comme l’autre.' },
    ancrage: { high: 'Vous deux, vous avez envie d’ailleurs.', low: 'Vous deux, vous tenez à votre coin.', mid: 'Partir ou rester : vous hésitez pareil.' },
    elan: { high: 'Vous deux, vous avez de grands projets.', low: 'Vous deux, vous gardez du temps pour vous.', mid: 'Travail et vie perso : le même équilibre.' },
    rythme: { high: 'Vous deux, vous aimez quand ça bouge.', low: 'Vous deux, vous aimez le calme.', mid: 'Ni trop calme, ni trop intense : pareil pour vous deux.' },
    cap: { high: 'Vous deux, vous aimez prévoir.', low: 'Vous deux, vous vivez au jour le jour.', mid: 'Un peu de plan, un peu d’imprévu : comme vous deux.' },
  } as Record<VisionAxis, Record<AxisSide, string>>,
  between: 'entre les deux',
  /** La différence à explorer. */
  explore: {
    same: (axis: string) => `${axis} : c’est là que vous vous ressemblez le moins. À explorer ensemble.`,
    differ: (axis: string, mine: string, otherName: string, theirs: string) => `${axis} : toi, ${mine} ; ${otherName}, ${theirs}. À explorer ensemble.`,
  },
  match: {
    commonTitle: '3 points communs',
    exploreTitle: '1 différence à explorer',
  },
  /** Ce que ton minimoa dit d'une rencontre : d'où il la connaît, puis le premier point commun. */
  intro: {
    friend: [(mutual: string) => `Je l’ai croisé chez ${mutual}.`, (mutual: string) => `C’est un pote du minimoa de ${mutual}.`] as readonly ((mutual: string) => string)[],
    nearby: ['Il traîne dans ton quartier.', 'On s’est croisés pas loin de chez toi.'] as readonly string[],
    other: ['Tout nouveau dans le coin.', 'On s’est croisés en balade.'] as readonly string[],
  },
  map: {
    /** Silhouettes floues au-delà de la zone. */
    beyond: (n: number) => (n === 1 ? '1 minimoa plus loin' : `${n} minimoas plus loin`),
    noLocation: 'Sans ta position, pas de carte ni de rencontres près de toi.',
    discreet: 'Mode discret : tu n’apparais sur la carte de personne.',
    plusHint: 'Avec Blowy+, toute la carte, et changer de ville.',
  },
  /** Messages d'erreur de la vision (renvoyés par l'API). */
  errors: {
    unknownQuestion: 'Cette situation n’existe pas.',
    incompleteTest: 'Réponds aux 12 situations du test, une fois chacune. Tu peux aussi le passer plus tard.',
    whomRequired: 'Dis-nous qui tu veux rencontrer.',
    whomOnlyForMore: '« Qui tu veux rencontrer » ne sert que si tu cherches plus que des potes.',
    sensitiveConsent: 'Il faut ton accord pour enregistrer ce choix.',
    locationConsent: 'Il faut ton accord pour utiliser ta position.',
    changeCityPlus: 'Changer de ville fait partie de Blowy+.',
    mapEverywherePlus: 'Toute la carte fait partie de Blowy+.',
  },
};

export const visionText = defineMessages({ fr, en: TODO, es: TODO, pt: TODO, nl: TODO });

/** Où la personne penche sur un axe, pour son propre profil. */
export function visionSideLine(locale: Locale, axis: VisionAxis, side: AxisSide): string {
  const t = visionText.in(locale);
  const a = t.axes[axis];
  if (side === 'mid') return t.side.mid(a.low.toLowerCase(), a.high.toLowerCase());
  return t.side.lean((side === 'low' ? a.low : a.high).toLowerCase());
}

const sideWord = (locale: Locale, axis: VisionAxis, side: AxisSide): string => {
  const t = visionText.in(locale);
  const a = t.axes[axis];
  return side === 'low' ? a.low.toLowerCase() : side === 'high' ? a.high.toLowerCase() : t.between;
};

/** La différence à explorer. `otherName` : le prénom de l'autre personne. */
export function visionExploreLine(locale: Locale, axis: VisionAxis, mine: AxisSide, theirs: AxisSide, otherName: string): string {
  const t = visionText.in(locale);
  const name = t.axes[axis].name;
  if (mine === theirs) return t.explore.same(name);
  return t.explore.differ(name, sideWord(locale, axis, mine), otherName, sideWord(locale, axis, theirs));
}

const pick = <T>(variants: readonly T[], seed: number): T => variants[((Math.trunc(seed) % variants.length) + variants.length) % variants.length] as T;

/** Ce que ton minimoa dit d'une rencontre : d'où il la connaît, puis le premier point commun. */
export function visionIntroLine(locale: Locale, input: { other: string; via: VisionVia; mutualName: string | null; firstCommon: string }, seed: number): string {
  const { other, via, mutualName, firstCommon } = input;
  const t = visionText.in(locale).intro;
  const where =
    via === 'friend_of_friend' && mutualName ? pick(t.friend, seed)(mutualName) : via === 'nearby' ? pick(t.nearby, seed) : pick(t.other, seed);
  return `${other}. ${where} ${firstCommon}`;
}
