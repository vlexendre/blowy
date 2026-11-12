/**
 * Garde-robe : 64 objets dans 4 emplacements. Un objet se gagne par une étape (soins, liens, séries…)
 * ou s'achète (objets « premium »). Un seul objet porté par emplacement.
 */
export const ITEM_SLOTS = ['head', 'face', 'body', 'toy'] as const;
export type ItemSlot = (typeof ITEM_SLOTS)[number];
export type Outfit = Partial<Record<ItemSlot, string>>;

/** Compteurs du pet qui débloquent des objets. */
export interface PetStats {
  /** Jours où la personne s'est occupée de son pet. */
  careDays: number;
  /** Liens créés. */
  links: number;
  /** Plus haut niveau atteint dans un lien. */
  bestLevel: number;
  /** Plus longue série de photos du jour. */
  bestStreak: number;
  /** Défis du jour relevés. */
  challenges: number;
  /** Potes ayant donné leurs 3 mots. */
  words: number;
}
export const ZERO_STATS: PetStats = { careDays: 0, links: 0, bestLevel: 0, bestStreak: 0, challenges: 0, words: 0 };
export type StatKey = keyof PetStats;

export type Unlock = { kind: 'start' } | { kind: 'premium' } | { kind: 'stat'; stat: StatKey; n: number };

export interface Item {
  id: string;
  slot: ItemSlot;
  unlock: Unlock;
}

const start: Unlock = { kind: 'start' };
const premium: Unlock = { kind: 'premium' };
const at = (stat: StatKey, n: number): Unlock => ({ kind: 'stat', stat, n });
const item = (slot: ItemSlot, id: string, unlock: Unlock): Item => ({ id, slot, unlock });

export const ITEMS: readonly Item[] = [
  // Tête
  item('head', 'bob', start),
  item('head', 'casquette', start),
  item('head', 'bonnet', at('careDays', 2)),
  item('head', 'chapeau_fete', at('links', 1)),
  item('head', 'casquette_envers', at('challenges', 3)),
  item('head', 'noeud', at('careDays', 5)),
  item('head', 'antennes', at('links', 3)),
  item('head', 'toque', at('careDays', 10)),
  item('head', 'fleurs', at('bestStreak', 3)),
  item('head', 'chat', at('bestLevel', 2)),
  item('head', 'lapin', at('bestLevel', 3)),
  item('head', 'casque_audio', at('challenges', 10)),
  item('head', 'sorcier', at('bestStreak', 14)),
  item('head', 'couronne', at('bestLevel', 7)),
  item('head', 'aureole', premium),
  item('head', 'cornes', premium),
  item('head', 'pirate', premium),
  // Visage
  item('face', 'lunettes_rondes', start),
  item('face', 'joues_roses', start),
  item('face', 'taches_rousseur', at('careDays', 1)),
  item('face', 'pansement', at('challenges', 1)),
  item('face', 'nez_rouge', at('challenges', 5)),
  item('face', 'moustache', at('words', 1)),
  item('face', 'masque_nuit', at('careDays', 7)),
  item('face', 'lunettes_coeur', at('bestLevel', 4)),
  item('face', 'lunettes_etoile', at('bestStreak', 7)),
  item('face', 'tetine', at('links', 2)),
  item('face', 'monocle', at('words', 3)),
  item('face', 'etincelles', at('bestLevel', 5)),
  item('face', 'lunettes_pixel', premium),
  item('face', 'cache_oeil', premium),
  // Corps
  item('body', 'echarpe', start),
  item('body', 'bandana', start),
  item('body', 'noeud_violet', at('careDays', 3)),
  item('body', 'noeud_pap', at('links', 1)),
  item('body', 'sac_a_dos', at('links', 5)),
  item('body', 'salopette', at('careDays', 14)),
  item('body', 'sweat', at('challenges', 7)),
  item('body', 'bretelles', at('words', 2)),
  item('body', 'tablier', at('careDays', 21)),
  item('body', 'collier_perles', at('bestLevel', 3)),
  item('body', 'collier_coquillage', at('bestStreak', 5)),
  item('body', 'sac_main', at('bestLevel', 6)),
  item('body', 'cape', at('bestStreak', 21)),
  item('body', 'teddy', premium),
  item('body', 'tutu', premium),
  item('body', 'chaine_or', premium),
  item('body', 'ailes', premium),
  // Jouets et objets
  item('toy', 'ballon', start),
  item('toy', 'doudou', start),
  item('toy', 'coeur', at('careDays', 1)),
  item('toy', 'tasse', at('careDays', 4)),
  item('toy', 'livre', at('challenges', 2)),
  item('toy', 'bulle', at('links', 1)),
  item('toy', 'fleur', at('bestStreak', 2)),
  item('toy', 'ballons', at('links', 4)),
  item('toy', 'gateau', at('careDays', 30)),
  item('toy', 'cadeau', at('bestLevel', 2)),
  item('toy', 'pinceau', at('challenges', 15)),
  item('toy', 'micro', at('words', 5)),
  item('toy', 'manette', premium),
  item('toy', 'skate', premium),
  item('toy', 'baguette', premium),
  item('toy', 'potion', premium),
];

export const ITEM_IDS: readonly string[] = ITEMS.map((i) => i.id);
const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
export const itemById = (id: string): Item | undefined => BY_ID.get(id);

/** Objets gagnés avec ces compteurs (hors achats). */
export function earnedItems(stats: PetStats): string[] {
  return ITEMS.filter((i) => i.unlock.kind === 'start' || (i.unlock.kind === 'stat' && stats[i.unlock.stat] >= i.unlock.n)).map((i) => i.id);
}

/** Avancement vers un objet à étape ; null pour les objets de départ et premium. */
export function itemProgress(i: Item, stats: PetStats): { have: number; need: number } | null {
  if (i.unlock.kind !== 'stat') return null;
  return { have: Math.min(stats[i.unlock.stat], i.unlock.n), need: i.unlock.n };
}

/** Ne garde d'une tenue que les objets possédés et rangés dans le bon emplacement. */
export function cleanOutfit(outfit: Outfit, owned: ReadonlySet<string>): Outfit {
  const out: Outfit = {};
  for (const slot of ITEM_SLOTS) {
    const id = outfit[slot];
    if (id && owned.has(id) && BY_ID.get(id)?.slot === slot) out[slot] = id;
  }
  return out;
}
