/**
 * Voix des pets dans le chat et dans les rencontres.
 * Fonctions pures : la variante est choisie par `seed` (entier stable fourni par l'appelant),
 * jamais par un tirage aléatoire. Ton : minuscules, court, joueur, pas d'emoji.
 */

/** Les deux pets d'un lien, vus depuis celui qui parle. */
export interface PetPair {
  /** Nom du pet qui parle. */
  self: string;
  /** Nom de l'autre pet. */
  other: string;
}

export type EncounterVia = 'friend_of_friend' | 'nearby' | 'new';

const pick = (variants: readonly string[], seed: number): string => {
  const n = variants.length;
  return variants[((Math.trunc(seed) % n) + n) % n] ?? variants[0] ?? '';
};

export function linkCreatedLine(p: PetPair, seed: number): string {
  return pick(
    [
      `coucou ${p.other}. je crois qu'on va bien s'entendre.`,
      `${p.other} sent bon les nouvelles aventures. je reste dans le coin.`,
      `bon. ${p.other}, toi et moi, on surveille ces deux-là.`,
      `je viens de rencontrer ${p.other}. on se renifle encore un peu.`,
      `salut ${p.other}. j'ai apporté ma meilleure tête.`,
    ],
    seed,
  );
}

export function firstMessageOfDayLine(p: PetPair, seed: number): string {
  return pick(
    [
      `premier message du jour. ${p.other}, t'as vu ? on est réveillés.`,
      `ah, ça papote déjà. je prends des notes.`,
      `bonjour ${p.other}. ils recommencent, c'est bon signe.`,
      `le lien respire. je m'étire et j'écoute.`,
      `on démarre la journée ensemble. j'aime bien.`,
    ],
    seed,
  );
}

export function sweetReactionLine(p: PetPair, seed: number): string {
  return pick(
    [
      `oh. c'était doux, ça. ${p.other} rougit un peu.`,
      `je note : mot doux reçu. on garde.`,
      `tout mignon. je fais semblant de ne pas avoir vu.`,
      `${p.other} ronronne. enfin je crois.`,
    ],
    seed,
  );
}

export function teaseReactionLine(p: PetPair, seed: number): string {
  return pick(
    [
      `ouh, la vanne. ${p.other} prépare sa revanche.`,
      `piqué. j'adore.`,
      `je n'ai rien vu, rien entendu. mais c'était drôle.`,
      `ça chambre sec ici. je m'installe.`,
    ],
    seed,
  );
}

export function lifeLostLine(p: PetPair, livesLeft: number, seed: number): string {
  const lives = livesLeft > 1 ? `${livesLeft} vies` : 'une seule vie';
  return pick(
    [
      `hier c'était calme. trop calme. il nous reste ${lives}.`,
      `${p.other} et moi on a attendu toute la journée. plus que ${lives}.`,
      `un petit mot suffit à nous garder en forme. ${lives} au compteur.`,
      `je m'ennuie un peu. on est à ${lives}.`,
    ],
    seed,
  );
}

export function lifeGainedLine(p: PetPair, lives: number, seed: number): string {
  return pick(
    [
      `une vie de plus. on remonte à ${lives}.`,
      `${p.other} et moi, on se sent revivre. ${lives} vies.`,
      `ça, c'est de l'entretien de lien. ${lives} vies.`,
    ],
    seed,
  );
}

export function levelUpLine(p: PetPair, levelTitle: string, seed: number): string {
  const title = levelTitle.toLowerCase();
  return pick(
    [
      `nouveau niveau : ${title}. ${p.other}, on a grandi.`,
      `${title}. je savais que vous en étiez capables.`,
      `on passe à « ${title} ». je fais la danse de la victoire.`,
      `niveau suivant : ${title}. ${p.other} est tout fier.`,
    ],
    seed,
  );
}

export function ghostLine(p: PetPair, seed: number): string {
  return pick(
    [
      `plus de vies. ${p.other} et moi, on devient tout transparents.`,
      `le lien s'est endormi. on peut encore le réveiller, une fois.`,
      `on est des fantômes maintenant. ça fait un peu froid.`,
    ],
    seed,
  );
}

export function revivedLine(p: PetPair, seed: number): string {
  return pick(
    [
      `on est revenus. ${p.other}, on ne refait plus jamais ça.`,
      `deuxième chance. je la garde précieusement.`,
      `ranimés. je respire à nouveau. merci.`,
    ],
    seed,
  );
}

export function duoPhotoLine(p: PetPair, streak: number, seed: number): string {
  const serie = streak > 1 ? ` ${streak} jours d'affilée.` : '';
  return pick(
    [
      `photo du jour, des deux côtés. ${p.other} et moi on l'accroche au mur.${serie}`,
      `les deux photos sont là. joli duo.${serie}`,
      `vous vous êtes montré votre journée. j'adore ce rituel.${serie}`,
    ],
    seed,
  );
}

export interface EncounterIntroInput {
  /** Nom du pet croisé. */
  other: string;
  via: EncounterVia;
  compatibility: number;
  /** Ami commun, quand il y en a un. */
  mutualName: string | null;
}

export function encounterIntroLine(input: EncounterIntroInput, seed: number): string {
  const { other, via, compatibility, mutualName } = input;
  const where =
    via === 'friend_of_friend' && mutualName
      ? pick([`je l'ai croisé chez ${mutualName}.`, `c'est un pote du pet de ${mutualName}.`], seed)
      : via === 'nearby'
        ? pick([`on habite pas loin l'un de l'autre.`, `on s'est croisés dans le quartier.`], seed)
        : pick([`on s'est croisés en balade.`, `tout nouveau dans le coin.`], seed);
  const vibe =
    compatibility >= 75
      ? pick([`on a tout de suite accroché.`, `on se ressemble beaucoup.`], seed >> 1)
      : compatibility >= 45
        ? pick([`on s'est bien amusés.`, `on a des trucs en commun.`], seed >> 1)
        : pick([`on est très différents, c'est ce qui me plaît.`, `sacrée surprise, cette rencontre.`], seed >> 1);
  return `${other}. ${where} ${vibe}`;
}

export function wavedAtYouLine(other: string, seed: number): string {
  return pick(
    [`${other} m'a fait coucou. on lui répond ?`, `${other} m'a fait signe. ça a l'air sympa.`, `${other} tourne autour de moi. ça sent l'envie de jouer.`],
    seed,
  );
}

/** Messages du système (bandeaux d'événement dans le chat). */
export const systemText = {
  linkCreated: 'vos pets se sont trouvés. vous pouvez vous écrire.',
  revived: 'le lien est ranimé. il ne pourra plus l’être une deuxième fois.',
  levelUp: (title: string, text: string): string => `niveau atteint : ${title.toLowerCase()}. ${text.toLowerCase()}`,
} as const;
