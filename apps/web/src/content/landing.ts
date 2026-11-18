/**
 * Landing : tout ce qui n'est pas du texte (ancres, couleurs des halos, images, valeurs des démos). Les textes, dans les
 * cinq langues, sont dans `landing-text/<langue>.ts` (le français fait la forme, `landing-text/index.ts`).
 * Minimoa crée des relations (spéc. V7 §27) : jamais de vocabulaire de site de rencontre, ni cœurs entre deux personnes.
 * Prix : `OFFERS` du domaine (docs/BLOWY-PLUS.md), mis en forme dans la langue ; le montant facturé toujours en premier.
 * Exemples d'écran (prénoms, séries) : des exemples, jamais des chiffres d'utilisateurs ni des avis.
 */

/** Une ligne de gros titre ; `dim` = ligne atténuée. */
export interface TitleLine {
  text: string;
  dim?: boolean;
}

export type Avatar = { img: string } | { letter: string; bg: string };

export interface BubbleCopy {
  who: string;
  whoColor?: string;
  text: string;
  avatar: Avatar;
  /** bulle sombre */
  dark?: boolean;
  /** bulle alignée à droite */
  me?: boolean;
}

export interface SectionMeta {
  id: string;
  /** couleurs du halo de fond quand la section est active */
  glow: [string, string, string];
}

export type Species = 'nino' | 'suzie' | 'gaston' | 'pia';

/** Dossier des images du pack (générées par scripts/site-images/build.py). */
export const IMG = '/img/m';

export const sections = {
  top: { id: 'top', glow: ['#FFB800', '#6D3DF0', '#FF8FC6'] },
  comment: { id: 'comment', glow: ['#6D3DF0', '#FFB800', '#FF8FC6'] },
  pet: { id: 'pet', glow: ['#6D3DF0', '#FFB800', '#FF5A3C'] },
  garde: { id: 'garde-robe', glow: ['#FF9A3D', '#FF5A3C', '#FFB800'] },
  caractere: { id: 'caractere', glow: ['#A98BFF', '#6D3DF0', '#FF8FC6'] },
  habitudes: { id: 'habitudes', glow: ['#FFB800', '#FF9A3D', '#6D3DF0'] },
  groupes: { id: 'groupes', glow: ['#6D3DF0', '#A98BFF', '#FFB800'] },
  chats: { id: 'chats', glow: ['#FF8FC6', '#6D3DF0', '#FF9A3D'] },
  vies: { id: 'vies', glow: ['#8C1D4F', '#FF5A3C', '#6D3DF0'] },
  rencontres: { id: 'rencontres', glow: ['#FF5A3C', '#A98BFF', '#FF9A3D'] },
  sorties: { id: 'sorties', glow: ['#6D3DF0', '#FF5A3C', '#FFB800'] },
  mots: { id: 'mots', glow: ['#FF8FC6', '#FFB800', '#A98BFF'] },
  ecrans: { id: 'ecrans', glow: ['#FFB800', '#6D3DF0', '#FF8FC6'] },
  plus: { id: 'plus', glow: ['#6D3DF0', '#FFB800', '#8C1D4F'] },
  faq: { id: 'faq', glow: ['#6D3DF0', '#A98BFF', '#FF8FC6'] },
  go: { id: 'go', glow: ['#FFB800', '#FF8FC6', '#6D3DF0'] },
} as const satisfies Record<string, SectionMeta>;
export type SectionId = keyof typeof sections;
/** Ordre des sections (la galerie « ecrans » n'apparaît que si des captures sont présentes : voir LandingPage.astro). */
export const sectionOrder: SectionId[] = ['top', 'comment', 'pet', 'garde', 'caractere', 'habitudes', 'groupes', 'chats', 'vies', 'rencontres', 'sorties', 'mots', 'ecrans', 'plus', 'faq', 'go'];

/** Liens de la barre (ancre de section), dans l'ordre. */
export const NAV_LINKS = ['pet', 'habitudes', 'groupes', 'rencontres', 'plus'] as const;
export type NavLink = (typeof NAV_LINKS)[number];
/** Section active → lien de la barre allumé. */
export const NAV_ACTIVE: Record<string, NavLink> = {
  pet: 'pet',
  'garde-robe': 'pet',
  caractere: 'pet',
  habitudes: 'habitudes',
  groupes: 'groupes',
  chats: 'groupes',
  vies: 'groupes',
  rencontres: 'rencontres',
  sorties: 'rencontres',
  mots: 'rencontres',
  plus: 'plus',
};

/**
 * La boucle du hero (scripts/site-images/build.py `--boucle`) : Nino qui mange (tu prends soin de lui), puis Nino qui
 * fait un check à Suzie, le minimoa de Léa (il te présente quelqu'un). Même échelle, même hauteur (550 × 760, 1177 × 760).
 * La rencontre est l'image principale de la page (préchargée).
 */
export const HERO_PET = `${IMG}/hero_rencontre.webp`;
export const HERO_CARE = `${IMG}/hero_soin.webp`;
/** Largeur affichée des deux images (leur hauteur suit l'écran) : `sizes` des images et du préchargement. */
export const HERO_SIZES = '(min-width: 900px) 52vh, 62vw';
export const HERO_CARE_SIZES = '(min-width: 900px) 25vh, 30vw';
export const HOW_PETS = ['nino_mange', 'suzie_joie', 'pia_check'] as const;

/** « Il est vivant » : les quatre minimoas, et un geste par soin (chaque geste a sa pose en pied). */
export const ALIVE = {
  initial: 'nino' as Species,
  species: ['nino', 'suzie', 'gaston', 'pia'] as Species[],
  restPose: 'neutre',
  actions: [
    { key: 'nourrir', icon: 'obj_pomme', pose: 'mange' },
    { key: 'jouer', icon: 'obj_balle', pose: 'joue' },
    { key: 'sieste', icon: 'obj_coussin', pose: 'dodo' },
    { key: 'calin', icon: 'obj_peluche', pose: 'rit' },
    { key: 'bain', icon: 'obj_canard', pose: 'bain' },
    { key: 'danse', icon: 'obj_medaille', pose: 'danse' },
  ],
} as const;
export type CareKey = (typeof ALIVE.actions)[number]['key'];
export const SPECIES_NAME: Record<Species, string> = { nino: 'Nino', suzie: 'Suzie', gaston: 'Gaston', pia: 'Pia' };

export const LOOKS = [
  { name: 'nino_bob', who: 'nino' },
  { name: 'gaston_casque', who: 'gaston' },
  { name: 'suzie_couronne', who: 'suzie' },
  { name: 'pia_hiver', who: 'pia', plus: true },
] as const;
export type LookName = (typeof LOOKS)[number]['name'];
export const STREAK_STEPS = ['3', '7', '14', '30', '60', '100'];

export type MoodKey = 'casanier' | 'equilibre' | 'sociable' | 'tendre' | 'piquant' | 'joueur';
export const MOODS: MoodKey[] = ['casanier', 'equilibre', 'sociable', 'tendre', 'piquant', 'joueur'];
export const MOOD_INITIAL: MoodKey = 'sociable';
/** valeurs des 4 jauges (social, jeu, tendresse, parole) pour chaque forme */
export const MOOD_PRESETS: Record<MoodKey, [number, number, number, number]> = {
  casanier: [-70, -20, 10, -35],
  equilibre: [5, 5, 5, 5],
  sociable: [75, 30, 5, 40],
  tendre: [10, -15, 80, 10],
  piquant: [0, 20, -75, 30],
  joueur: [30, 85, -10, 25],
};

/** Habitudes de démonstration (série et régularité : des exemples). */
export const HABIT_CARDS = [
  { emoji: '🚶', streak: 12, rigour: 86 as number | null },
  { emoji: '📖', streak: 4, rigour: null as number | null },
];
export const WEEK_STATES: ('done' | 'joker' | 'today' | undefined)[] = ['done', 'done', 'joker', 'done', 'today', undefined, undefined];
export const HABITS_PET = `${IMG}/nino_fier.webp`;

export const GROUP_CARD = {
  emoji: '🚶',
  lives: 4,
  livesMax: 5,
  streak: 9,
  members: [
    { pet: 'suzie', tone: 'ok' },
    { pet: 'gaston', tone: 'joker' },
    { pet: 'nino', tone: 'wait' },
  ] as { pet: Species; tone: 'ok' | 'joker' | 'wait' }[],
};

export const CHAT_MESSAGES: { kind: 'other' | 'me' | 'pet'; pet?: Species; color?: string; border?: string }[] = [
  { kind: 'other' },
  { kind: 'me' },
  { kind: 'other' },
  { kind: 'me' },
  { kind: 'pet', pet: 'nino', color: 'var(--lime)' },
  { kind: 'pet', pet: 'suzie', color: 'var(--rose)', border: 'rgba(255,143,198,.4)' },
];
export const CHAT_APP_ICONS = ['ic_etoiles', 'ic_eclair', 'ic_gel'] as const;

export const LIVES = { start: 5, total: 7 } as const;

export const DUO = { src: `${IMG}/duo_check.webp`, width: 700, height: 456 } as const;

export const MAP_PINS: { pet: Species; x: number; y: number }[] = [
  { pet: 'suzie', x: 30, y: 34 },
  { pet: 'gaston', x: 66, y: 28 },
  { pet: 'pia', x: 62, y: 66 },
];
export const OUTINGS_PET = `${IMG}/nino_marche.webp`;

/** « 3 mots » : la jauge que chaque mot fait bouger (clé des pôles de `@blowy/content`), 2 choisis au départ. */
export const WORD_DEMO: { gauge: string; on?: boolean; short?: boolean }[] = [
  { gauge: 'joueur', on: true },
  { gauge: 'tendre', on: true },
  { gauge: 'sociable' },
  { gauge: 'piquant' },
  { gauge: 'bavard' },
  { gauge: 'pose' },
  { gauge: 'joueur', short: true },
  { gauge: 'discret', short: true },
];
export const WORDS_MAX = 3;
export const WORDS_PET = `${IMG}/nino_timide.webp`;

export const PLUS_PET = `${IMG}/tenue_pia_hiver.webp`;
export const FINAL_BAND = { src: `${IMG}/bande_fete.webp`, width: 1200, height: 421 } as const;
