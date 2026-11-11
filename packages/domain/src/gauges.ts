/**
 * Caractère du pet : 4 jauges à deux pôles, de -100 à +100.
 * Elles bougent avec ce que fait la personne et retombent vers 0 sans activité :
 * le pet évolue dans un sens, puis dans l'autre.
 * Moteur pur : aucune horloge, aucun aléa — le jour courant est passé en paramètre.
 */
export const GAUGE_KEYS = ['social', 'play', 'tender', 'talk'] as const;
export type GaugeKey = (typeof GAUGE_KEYS)[number];
export type Gauges = Record<GaugeKey, number>;

export const GAUGE_MIN = -100;
export const GAUGE_MAX = 100;

/** Pôle négatif / positif de chaque jauge (clés de contenu, traduites dans @blowy/content). */
export const GAUGE_POLES: Record<GaugeKey, { low: string; high: string }> = {
  social: { low: 'casanier', high: 'sociable' },
  play: { low: 'pose', high: 'joueur' },
  tender: { low: 'piquant', high: 'tendre' },
  talk: { low: 'discret', high: 'bavard' },
};

export const ZERO_GAUGES: Gauges = { social: 0, play: 0, tender: 0, talk: 0 };

/** Ce qui fait bouger le caractère. */
export const PET_EVENT_KINDS = [
  'met_new_pet', // rencontre acceptée
  'waved', // a salué un pet croisé
  'challenge_done', // défi / jeu du jour terminé
  'photo_sent', // photo du jour envoyée
  'sweet_word', // mot doux
  'tease', // vanne
  'message_sent', // message texte
  'three_words', // des potes ont donné 3 mots
  'quiz', // quiz de caractère à la création
] as const;
export type PetEventKind = (typeof PET_EVENT_KINDS)[number];

const DELTAS: Record<Exclude<PetEventKind, 'three_words' | 'quiz'>, Partial<Gauges>> = {
  met_new_pet: { social: 12 },
  waved: { social: 4 },
  challenge_done: { play: 10 },
  photo_sent: { tender: 6, play: 2 },
  sweet_word: { tender: 8 },
  tease: { tender: -8, play: 3 },
  message_sent: { talk: 2 },
};

/** Points perdus par jour et par jauge quand il ne se passe rien. */
export const DECAY_PER_DAY = 3;

export const clampGauge = (v: number): number => Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, Math.round(v)));

export function addGauges(g: Gauges, delta: Partial<Gauges>): Gauges {
  const out = { ...g };
  for (const k of GAUGE_KEYS) out[k] = clampGauge(g[k] + (delta[k] ?? 0));
  return out;
}

/** Delta d'un événement ; `custom` porte les deltas calculés ailleurs (3 mots, quiz). */
export function deltaFor(kind: PetEventKind, custom?: Partial<Gauges>): Partial<Gauges> {
  if (kind === 'three_words' || kind === 'quiz') return custom ?? {};
  return DELTAS[kind];
}

/** Retour vers 0 : `days` jours sans activité. */
export function decayGauges(g: Gauges, days: number): Gauges {
  if (days <= 0) return g;
  const out = { ...g };
  for (const k of GAUGE_KEYS) {
    const step = Math.min(Math.abs(g[k]), DECAY_PER_DAY * days);
    out[k] = g[k] - Math.sign(g[k]) * step;
  }
  return out;
}

/** 0 = équilibré, 1 = marqué, 2 = très marqué. */
export type Tier = 0 | 1 | 2;
export const tierOf = (v: number): Tier => (Math.abs(v) < 34 ? 0 : Math.abs(v) < 67 ? 1 : 2);

export interface Trait {
  gauge: GaugeKey;
  /** Clé du pôle dominant (ex. « sociable ») ou null si équilibré. */
  pole: string | null;
  tier: Tier;
  value: number;
}

export function traitsOf(g: Gauges): Trait[] {
  return GAUGE_KEYS.map((gauge) => {
    const value = g[gauge];
    const tier = tierOf(value);
    const pole = tier === 0 ? null : value > 0 ? GAUGE_POLES[gauge].high : GAUGE_POLES[gauge].low;
    return { gauge, pole, tier, value };
  });
}

/** Trait le plus marqué, ou null si tout est équilibré : il pilote la forme du pet. */
export function dominantTrait(g: Gauges): Trait | null {
  const marked = traitsOf(g).filter((t) => t.tier > 0);
  if (marked.length === 0) return null;
  return marked.reduce((a, b) => (Math.abs(b.value) > Math.abs(a.value) ? b : a));
}

/** Mots proposés sur la page « 3 mots » et leur effet sur les jauges. */
export const WORDS: Record<string, Partial<Gauges>> = {
  drole: { play: 6 },
  calme: { play: -6 },
  fetard: { social: 6 },
  casanier: { social: -6 },
  doux: { tender: 6 },
  cash: { tender: -6 },
  bavard: { talk: 6 },
  mysterieux: { talk: -6 },
  curieux: { social: 3, play: 3 },
  reveur: { social: -3, tender: 3 },
  taquin: { tender: -3, play: 3 },
  attentionne: { tender: 4, talk: 2 },
};
export const WORD_KEYS = Object.keys(WORDS);

export function deltaForWords(words: readonly string[]): Partial<Gauges> {
  const out: Partial<Gauges> = {};
  for (const w of words) {
    const d = WORDS[w];
    if (!d) continue;
    for (const k of GAUGE_KEYS) if (d[k]) out[k] = (out[k] ?? 0) + (d[k] ?? 0);
  }
  return out;
}

/** Compatibilité de deux caractères, de 0 à 100 (proches = plus haut, sans exclure les opposés). */
export function compatibility(a: Gauges, b: Gauges): number {
  let dist = 0;
  for (const k of GAUGE_KEYS) dist += Math.abs(a[k] - b[k]);
  return Math.round(100 - (dist / (GAUGE_KEYS.length * 200)) * 100);
}
