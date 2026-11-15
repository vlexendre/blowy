/**
 * Textes de la vision (test, profil, explication des rencontres, carte). Dictionnaires à clés, en français ;
 * une passe de traduction suivra. Les clés des questions et des axes viennent de `@blowy/domain` (vision.ts).
 * Espaces insécables ( ) avant : ; ? !
 */
import type { AxisSide, VisionAxis } from '@blowy/domain';

export interface VisionQuestionText {
  situation: string;
  choices: readonly [string, string];
}

/** Les 12 situations du test : concrètes, adultes, sans bonne réponse. Ni religion, ni politique, ni santé. */
export const visionQuestionText: Readonly<Record<string, VisionQuestionText>> = {
  dimanche: { situation: 'Dimanche, rien de prévu.', choices: ['Je reste chez moi, plaid et série.', 'Je sors : marché, expo, apéro.'] },
  enfants: { situation: 'Dans dix ans, autour de ta table…', choices: ['Des enfants qui renversent leur verre.', 'Des amis, et de la place pour l’imprévu.'] },
  mutation: { situation: 'On te propose un poste à l’autre bout du monde.', choices: ['Je fais mes cartons.', 'Je reste, ma vie est ici.'] },
  heritage: { situation: 'Tu reçois 10 000 € d’un coup.', choices: ['Je les mets de côté, ça servira.', 'Je m’offre un beau souvenir.'] },
  promotion: { situation: 'Une grosse promotion, avec des soirs en plus au travail.', choices: ['J’y vais, c’est le moment.', 'Je garde mes soirées.'] },
  vacances: { situation: 'Les vacances d’été.', choices: ['Un billet aller, on verra sur place.', 'Tout est réservé depuis mars.'] },
  appartement: { situation: 'Signer un crédit sur 25 ans pour un appartement à deux.', choices: ['Ça me fait rêver.', 'Ça me donne des sueurs.'] },
  vendredi: { situation: 'Vendredi soir, 23 h.', choices: ['Encore dehors, la soirée commence.', 'Au lit, demain j’ai des choses à faire.'] },
  cinq_ans: { situation: 'Dans cinq ans, tu habites…', choices: ['Dans le même coin, près des miens.', 'Ailleurs, peut-être dans un autre pays.'] },
  projet: { situation: 'Un projet perso te tient à cœur (une boîte, un album, une asso).', choices: ['J’y mets mes soirs et mes week-ends.', 'Il attendra, je profite d’abord.'] },
  soirees: { situation: 'Ta soirée idéale, en semaine.', choices: ['Dîner à la maison avec la personne qui partage ma vie.', 'Ce qui se présente, je décide sur le moment.'] },
  quartier: { situation: 'Ton quartier idéal.', choices: ['Calme, des arbres, on connaît le boulanger.', 'Animé, des bars, ça bouge tard.'] },
};

export const visionTestText = {
  title: 'Ta vision',
  intro: '12 situations, une par écran. Il n’y a pas de bonne réponse.',
} as const;

export interface VisionAxisText {
  name: string;
  /** Pôle −. */
  low: string;
  /** Pôle +. */
  high: string;
  /** Ce que l'axe mesure, en une ligne. */
  about: string;
}

export const visionAxisText: Readonly<Record<VisionAxis, VisionAxisText>> = {
  foyer: { name: 'Foyer', low: 'Libre, en solo', high: 'Fonder un foyer', about: 'Couple durable, enfants, vie de famille.' },
  ancrage: { name: 'Ancrage', low: 'Rester ici', high: 'Partir', about: 'Où vivre : ici, ailleurs, à l’étranger.' },
  elan: { name: 'Élan', low: 'Du temps pour soi', high: 'De grands projets', about: 'La place du travail et de l’ambition.' },
  rythme: { name: 'Rythme', low: 'Calme, chez soi', high: 'Intense, dehors', about: 'Le quotidien que tu veux.' },
  cap: { name: 'Cap', low: 'Au jour le jour', high: 'Tout prévoir', about: 'Long terme, argent, organisation.' },
};

/** Où la personne penche sur un axe, pour son propre profil. */
export function visionSideLine(axis: VisionAxis, side: AxisSide): string {
  const t = visionAxisText[axis];
  if (side === 'mid') return `Entre les deux : ${t.low.toLowerCase()} ou ${t.high.toLowerCase()}.`;
  return `Plutôt ${(side === 'low' ? t.low : t.high).toLowerCase()}.`;
}

export const visionProfileText = {
  title: 'Ta vision, pour l’instant',
  /** Mention visible sur l'écran du profil (spéc. §3). */
  note: 'Indicatif, il s’affine avec toi.',
  empty: 'Passe le test de vision pour que ton minimoa sache qui te présenter.',
} as const;

/** Un point commun, par axe et par côté partagé. */
export const visionCommonText: Readonly<Record<VisionAxis, Record<AxisSide, string>>> = {
  foyer: { high: 'Vous voulez tous les deux fonder un foyer.', low: 'Vous tenez tous les deux à votre liberté.', mid: 'Le foyer : ni pressés, ni fermés, tous les deux.' },
  ancrage: { high: 'Vous avez tous les deux envie d’ailleurs.', low: 'Vous êtes tous les deux attachés à votre coin.', mid: 'Partir ou rester : vous hésitez pareil.' },
  elan: { high: 'Vous avez tous les deux de grands projets.', low: 'Vous gardez tous les deux du temps pour vous.', mid: 'Travail et vie perso : le même équilibre.' },
  rythme: { high: 'Vous aimez tous les deux quand ça bouge.', low: 'Vous aimez tous les deux le calme.', mid: 'Ni trop calme, ni trop intense : pareil pour vous deux.' },
  cap: { high: 'Vous aimez tous les deux prévoir.', low: 'Vous vivez tous les deux au jour le jour.', mid: 'Un peu de plan, un peu d’imprévu : comme vous deux.' },
};

const sideWord = (axis: VisionAxis, side: AxisSide): string => {
  const t = visionAxisText[axis];
  return side === 'low' ? t.low.toLowerCase() : side === 'high' ? t.high.toLowerCase() : 'entre les deux';
};

/** La différence à explorer. `otherName` : le prénom de l'autre personne. */
export function visionExploreLine(axis: VisionAxis, mine: AxisSide, theirs: AxisSide, otherName: string): string {
  const name = visionAxisText[axis].name;
  if (mine === theirs) return `${name} : c’est là que vous vous ressemblez le moins. À explorer ensemble.`;
  return `${name} : toi, ${sideWord(axis, mine)} ; ${otherName}, ${sideWord(axis, theirs)}. À explorer ensemble.`;
}

export const visionMatchText = {
  commonTitle: '3 points communs',
  exploreTitle: '1 différence à explorer',
} as const;

export type VisionVia = 'friend_of_friend' | 'nearby' | 'new';

const pick = (variants: readonly string[], seed: number): string => variants[((Math.trunc(seed) % variants.length) + variants.length) % variants.length] ?? '';

/** Ce que ton minimoa dit d'une rencontre : d'où il la connaît, puis le premier point commun. */
export function visionIntroLine(input: { other: string; via: VisionVia; mutualName: string | null; firstCommon: string }, seed: number): string {
  const { other, via, mutualName, firstCommon } = input;
  const where =
    via === 'friend_of_friend' && mutualName
      ? pick([`Je l’ai croisé chez ${mutualName}.`, `C’est un pote du minimoa de ${mutualName}.`], seed)
      : via === 'nearby'
        ? pick(['Il traîne dans ton quartier.', 'On s’est croisés pas loin de chez toi.'], seed)
        : pick(['Tout nouveau dans le coin.', 'On s’est croisés en balade.'], seed);
  return `${other}. ${where} ${firstCommon}`;
}

export const visionMapText = {
  /** Silhouettes floues au-delà de la zone. */
  beyond: (n: number): string => (n === 1 ? '1 minimoa plus loin' : `${n} minimoas plus loin`),
  noLocation: 'Sans ta position, pas de carte ni de rencontres près de toi.',
  discreet: 'Mode discret : tu n’apparais sur la carte de personne.',
  plusHint: 'Avec Blowy+, toute la carte et changer de ville.',
} as const;

/** Messages d'erreur de la vision (renvoyés par l'API). */
export const visionErrorText = {
  unknownQuestion: 'Cette situation n’existe pas.',
  whomRequired: 'Dis-nous qui tu veux rencontrer.',
  whomOnlyForMore: '« Qui tu veux rencontrer » ne sert que si tu cherches plus que des potes.',
  sensitiveConsent: 'Il faut ton accord pour enregistrer ce choix.',
  locationConsent: 'Il faut ton accord pour utiliser ta position.',
  changeCityPlus: 'Changer de ville fait partie de Blowy+.',
  mapEverywherePlus: 'Toute la carte fait partie de Blowy+.',
} as const;
