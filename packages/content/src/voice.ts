/**
 * Voix des minimoas dans les liens (événements de jeu) et dans les rencontres, par langue.
 * Fonctions pures : la variante est choisie par `seed` (entier stable fourni par l'appelant), jamais par un tirage.
 * Ton : phrases courtes, humour sec, pas d'emoji. Les interventions dans la conversation sont dans `v7/chat`.
 */
import type { Locale } from '@blowy/domain';
import { TODO, defineMessages } from './i18n/core';

/** Les deux minimoas d'un lien, vus depuis celui qui parle. */
export interface PetPair {
  /** Nom du minimoa qui parle. */
  self: string;
  /** Nom de l'autre minimoa. */
  other: string;
}

export type EncounterVia = 'friend_of_friend' | 'nearby' | 'new';

type Line<A extends unknown[]> = readonly ((...args: A) => string)[];

const fr = {
  lifeLost: [
    (other: string, lives: string) => `Hier, silence radio. Il nous reste ${lives}.`,
    (other: string, lives: string) => `${other} et moi, on a attendu toute la journée. Plus que ${lives}.`,
    (other: string, lives: string) => `Un mot suffit à nous garder en forme. ${lives} au compteur.`,
    (other: string, lives: string) => `On s’ennuie un peu. On en est à ${lives}.`,
  ] as Line<[string, string]>,
  /** « 3 vies », « une seule vie ». */
  lives: (n: number) => (n > 1 ? `${n} vies` : 'une seule vie'),
  lifeGained: [
    (other: string, lives: number) => `Une vie de plus. On remonte à ${lives}.`,
    (other: string, lives: number) => `${other} et moi, on revit. ${lives} vies.`,
    (other: string, lives: number) => `Ça, c’est de l’entretien de lien. ${lives} vies.`,
  ] as Line<[string, number]>,
  levelUp: [
    (other: string, title: string) => `Nouveau niveau : « ${title} ». ${other}, on a grandi.`,
    (other: string, title: string) => `${title}. Je n’en attendais pas moins.`,
    (other: string, title: string) => `On passe à « ${title} ». Je fais la danse de la victoire. Discrètement.`,
    (other: string, title: string) => `Niveau suivant : « ${title} ». ${other} fait semblant de ne pas être fier.`,
  ] as Line<[string, string]>,
  ghost: [
    (other: string) => `Plus de vies. ${other} et moi, on devient transparents.`,
    (other: string) => `Le lien s’est endormi. On peut encore le réveiller, une fois.`,
    (other: string) => `On est des fantômes, maintenant. Il fait un peu froid.`,
  ] as Line<[string]>,
  revived: [
    (other: string) => `On est revenus. ${other}, on ne refait plus jamais ça.`,
    (other: string) => `Deuxième chance. Je la garde précieusement.`,
    (other: string) => `Ranimés. Je respire. Merci.`,
  ] as Line<[string]>,
  duoPhoto: [
    (other: string) => `Photo du jour, des deux côtés. ${other} et moi, on l’accroche au mur.`,
    (other: string) => `Les deux photos sont là. Joli duo.`,
    (other: string) => `Vous vous êtes montré votre journée. J’aime bien ce rituel.`,
  ] as Line<[string]>,
  /** Ajouté après la photo à deux quand la série dépasse un jour. */
  duoStreak: (n: number) => ` ${n} jours d’affilée.`,
  encounterWhere: {
    friend: [(mutual: string) => `Je l’ai croisé chez ${mutual}.`, (mutual: string) => `C’est un pote du minimoa de ${mutual}.`] as Line<[string]>,
    nearby: ['On n’habite pas loin l’un de l’autre.', 'On s’est croisés dans le quartier.'] as readonly string[],
    other: ['On s’est croisés en balade.', 'Tout nouveau dans le coin.'] as readonly string[],
  },
  encounterVibe: {
    high: ['On a tout de suite accroché.', 'On se ressemble beaucoup.'] as readonly string[],
    mid: ['On s’est bien amusés.', 'On a des trucs en commun.'] as readonly string[],
    low: ['On est très différents. C’est ce qui me plaît.', 'Sacrée surprise, cette rencontre.'] as readonly string[],
  },
  wavedAtYou: [
    (other: string) => `${other} m’a fait signe. On répond ?`,
    (other: string) => `${other} est passé dire bonjour. Ça a l’air sympa.`,
    (other: string) => `${other} tourne autour de moi. Ça sent l’envie de jouer.`,
  ] as Line<[string]>,
  /** Bandeaux du système dans un lien. */
  system: {
    revived: 'Le lien est ranimé. Il ne pourra pas l’être une deuxième fois.',
    levelUp: (title: string, text: string) => `Niveau atteint : « ${title} ». ${text}`,
  },
};

export const voiceText = defineMessages({ fr, en: TODO, es: TODO, pt: TODO, nl: TODO });

const pick = <T>(variants: readonly T[], seed: number): T => {
  const n = variants.length;
  return (variants[((Math.trunc(seed) % n) + n) % n] ?? variants[0]) as T;
};

export const lifeLostLine = (locale: Locale, p: PetPair, livesLeft: number, seed: number): string => {
  const t = voiceText.in(locale);
  return pick(t.lifeLost, seed)(p.other, t.lives(livesLeft));
};

export const lifeGainedLine = (locale: Locale, p: PetPair, lives: number, seed: number): string => pick(voiceText.in(locale).lifeGained, seed)(p.other, lives);

export const levelUpLine = (locale: Locale, p: PetPair, levelTitle: string, seed: number): string => pick(voiceText.in(locale).levelUp, seed)(p.other, levelTitle);

export const ghostLine = (locale: Locale, p: PetPair, seed: number): string => pick(voiceText.in(locale).ghost, seed)(p.other);

export const revivedLine = (locale: Locale, p: PetPair, seed: number): string => pick(voiceText.in(locale).revived, seed)(p.other);

export const duoPhotoLine = (locale: Locale, p: PetPair, streak: number, seed: number): string => {
  const t = voiceText.in(locale);
  return pick(t.duoPhoto, seed)(p.other) + (streak > 1 ? t.duoStreak(streak) : '');
};

export interface EncounterIntroInput {
  /** Nom du minimoa croisé. */
  other: string;
  via: EncounterVia;
  compatibility: number;
  /** Ami commun, quand il y en a un. */
  mutualName: string | null;
}

export function encounterIntroLine(locale: Locale, input: EncounterIntroInput, seed: number): string {
  const { other, via, compatibility, mutualName } = input;
  const t = voiceText.in(locale);
  const where =
    via === 'friend_of_friend' && mutualName
      ? pick(t.encounterWhere.friend, seed)(mutualName)
      : via === 'nearby'
        ? pick(t.encounterWhere.nearby, seed)
        : pick(t.encounterWhere.other, seed);
  const vibe = pick(compatibility >= 75 ? t.encounterVibe.high : compatibility >= 45 ? t.encounterVibe.mid : t.encounterVibe.low, seed >> 1);
  return `${other}. ${where} ${vibe}`;
}

export const wavedAtYouLine = (locale: Locale, other: string, seed: number): string => pick(voiceText.in(locale).wavedAtYou, seed)(other);

/** Bandeaux du système dans un lien. */
export const systemText = (locale: Locale) => voiceText.in(locale).system;
