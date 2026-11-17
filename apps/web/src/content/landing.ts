/**
 * Textes de la landing (une seule source : les organismes et le script d'animation lisent ce fichier).
 * Tutoiement, majuscule en début de phrase, ton sec plutôt que mignon. Le personnage est un minimoa.
 * Minimoa crée des relations (spéc. V7 §27) : jamais de vocabulaire de site de rencontre, ni « ce que tu cherches »,
 * ni cœurs entre deux personnes. Prix : ceux de docs/BLOWY-PLUS.md, le montant facturé toujours en premier.
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
  /** libellé des points de navigation (aria-label) */
  dot: string;
  /** couleurs du halo de fond quand la section est active */
  glow: [string, string, string];
}

export type Species = 'nino' | 'suzie' | 'gaston' | 'pia';

/** Dossier des images du pack (générées par scripts/site-images/build.py). */
export const IMG = '/img/m';

export const meta = {
  title: 'Minimoa — Élève ton minimoa. Il te présente du monde.',
  description:
    'Élève ton minimoa, tiens tes habitudes, seul ou en groupe. Il te présente des gens dont la vision de la vie va avec la tienne. Gratuit, zéro swipe, 18 ans et plus.',
} as const;

export const sections = {
  top: { id: 'top', dot: 'Accueil', glow: ['#FFB800', '#6D3DF0', '#FF8FC6'] },
  pet: { id: 'pet', dot: 'Il est vivant', glow: ['#6D3DF0', '#FFB800', '#FF5A3C'] },
  garde: { id: 'garde-robe', dot: 'Garde-robe', glow: ['#FF9A3D', '#FF5A3C', '#FFB800'] },
  caractere: { id: 'caractere', dot: 'Caractère', glow: ['#A98BFF', '#6D3DF0', '#FF8FC6'] },
  habitudes: { id: 'habitudes', dot: 'Habitudes', glow: ['#FFB800', '#FF9A3D', '#6D3DF0'] },
  groupes: { id: 'groupes', dot: 'Groupes', glow: ['#6D3DF0', '#A98BFF', '#FFB800'] },
  chats: { id: 'chats', dot: 'Dans tes chats', glow: ['#FF8FC6', '#6D3DF0', '#FF9A3D'] },
  vies: { id: 'vies', dot: '7 vies', glow: ['#8C1D4F', '#FF5A3C', '#6D3DF0'] },
  rencontres: { id: 'rencontres', dot: 'Rencontres', glow: ['#FF5A3C', '#A98BFF', '#FF9A3D'] },
  sorties: { id: 'sorties', dot: 'Sorties', glow: ['#6D3DF0', '#FF5A3C', '#FFB800'] },
  mots: { id: 'mots', dot: '3 mots', glow: ['#FF8FC6', '#FFB800', '#A98BFF'] },
  ecrans: { id: 'ecrans', dot: 'L’app en images', glow: ['#FFB800', '#6D3DF0', '#FF8FC6'] },
  plus: { id: 'plus', dot: 'Minimoa+', glow: ['#6D3DF0', '#FFB800', '#8C1D4F'] },
  faq: { id: 'faq', dot: 'Questions', glow: ['#6D3DF0', '#A98BFF', '#FF8FC6'] },
  go: { id: 'go', dot: 'Télécharger', glow: ['#FFB800', '#FF8FC6', '#6D3DF0'] },
} as const satisfies Record<string, SectionMeta>;
export type SectionId = keyof typeof sections;
/** Ordre des sections (la galerie « ecrans » n'apparaît que si des captures sont présentes : voir index.astro). */
export const sectionOrder: SectionId[] = ['top', 'pet', 'garde', 'caractere', 'habitudes', 'groupes', 'chats', 'vies', 'rencontres', 'sorties', 'mots', 'ecrans', 'plus', 'faq', 'go'];

export const nav = {
  logoLabel: 'Minimoa, retour en haut',
  sectionsLabel: 'Sections',
  dotsLabel: 'Aller à la section',
  download: 'Télécharger',
  links: [
    { href: 'pet', label: 'Son minimoa' },
    { href: 'habitudes', label: 'Habitudes' },
    { href: 'groupes', label: 'Groupes' },
    { href: 'rencontres', label: 'Rencontres' },
    { href: 'plus', label: 'Minimoa+' },
  ],
  /** section active → lien de nav allumé */
  activeMap: {
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
  } as Record<string, string>,
} as const;

export const stores = {
  apple: { small: 'Télécharger sur', soon: 'Bientôt sur', name: 'App Store' },
  google: { small: 'Disponible sur', soon: 'Bientôt sur', name: 'Google Play' },
} as const;

export const hero = {
  title: [{ text: 'ÉLÈVE TON MINIMOA.' }, { text: 'IL TE PRÉSENTE', dim: true }, { text: 'DU MONDE.', dim: true }] as TitleLine[],
  bubbles: {
    b1: { who: 'Léa', whoColor: '#8C1D4F', text: 'On marche demain matin ?', avatar: { letter: 'L', bg: 'var(--rose)' } },
    b2: { who: 'Nino', whoColor: 'var(--ink)', text: 'Je lui ai déjà dit oui 😈', avatar: { img: '/img/nino_face.webp' }, dark: true },
    b3: { who: 'Malo', whoColor: 'var(--ink)', text: 'Attends. Il peut faire ça ?', avatar: { letter: 'M', bg: 'var(--orange)' } },
  } satisfies Record<string, BubbleCopy>,
  tag: 'Gratuit · zéro swipe · 18 ans et plus',
  pet: { src: `${IMG}/hero_nino.webp`, alt: 'Nino, un minimoa vert à mèche orange, qui te fait coucou' },
} as const;

/** « Il est vivant » : les quatre minimoas, et un geste par soin (chaque geste a sa pose en pied). */
export const alive = {
  title: [{ text: 'IL EST VIVANT.' }, { text: 'OCCUPE-TOI', dim: true }, { text: 'DE LUI.', dim: true }] as TitleLine[],
  lead: 'Il a faim, sommeil, envie de jouer et de voir du monde. Tu t’en occupes : il te le rend.',
  speciesLabel: 'Choisis ton minimoa',
  careLabel: 'Prends soin de lui',
  initial: 'nino' as Species,
  species: [
    { key: 'nino', name: 'Nino', alt: 'Nino, vert à mèche orange' },
    { key: 'suzie', name: 'Suzie', alt: 'Suzie, rose à antennes pompons' },
    { key: 'gaston', name: 'Gaston', alt: 'Gaston, orange, un seul grand œil' },
    { key: 'pia', name: 'Pia', alt: 'Pia, violette à petites cornes' },
  ] as { key: Species; name: string; alt: string }[],
  /** pose de départ, puis une pose par geste */
  rest: { pose: 'neutre', say: 'Alors, on fait quoi ?' },
  actions: [
    { key: 'nourrir', label: 'Nourrir', icon: 'obj_pomme', pose: 'mange', say: 'Miam. Encore une ?' },
    { key: 'jouer', label: 'Jouer', icon: 'obj_balle', pose: 'joue', say: 'Lance-la. Plus loin !' },
    { key: 'sieste', label: 'Sieste', icon: 'obj_coussin', pose: 'dodo', say: 'Zzz… cinq minutes.' },
    { key: 'calin', label: 'Câlin', icon: 'obj_peluche', pose: 'rit', say: 'Ça chatouille !' },
    { key: 'bain', label: 'Bain', icon: 'obj_canard', pose: 'bain', say: 'Pas dans les yeux, hein.' },
    { key: 'danse', label: 'Danser', icon: 'obj_medaille', pose: 'danse', say: 'Regarde-moi ça.' },
  ],
  poseAlt: (name: string, action: string) => `${name} : ${action.toLowerCase()}`,
} as const;

/** Garde-robe : des objets portés, gagnés en t'occupant de lui. */
export const wardrobe = {
  title: [{ text: 'IL S’HABILLE.' }, { text: 'TU GAGNES', dim: true }, { text: 'SES AFFAIRES.', dim: true }] as TitleLine[],
  lead: 'Bob, lunettes, écharpe, couronne : chaque objet se porte, sur chaque pose. Tu les gagnes avec ta série, tes habitudes et tes défis.',
  looks: [
    { name: 'nino_bob', who: 'Nino', items: 'Bob, lunettes rondes, écharpe', how: 'Dès le départ' },
    { name: 'gaston_casque', who: 'Gaston', items: 'Casquette, sac à dos, ballon', how: 'Avec tes liens' },
    { name: 'suzie_couronne', who: 'Suzie', items: 'Couronne, collier de perles, fleur', how: '100 jours de série' },
    { name: 'pia_hiver', who: 'Pia', items: 'Bonnet, écharpe, aura de flocons', how: 'Collection Hiver · Minimoa+', plus: true },
  ] as { name: string; who: string; items: string; how: string; plus?: boolean }[],
  alt: (who: string, items: string) => `${who} habillé : ${items.toLowerCase()}`,
  rewards: { label: 'Paliers de série', steps: ['3', '7', '14', '30', '60', '100'] },
} as const;

export type MoodKey = 'casanier' | 'equilibre' | 'sociable' | 'tendre' | 'piquant' | 'joueur';
export const character = {
  title: [{ text: 'IL A SON CARACTÈRE.' }, { text: 'ET IL CHANGE', dim: true }, { text: 'AVEC TOI', dim: true }] as TitleLine[],
  lead: 'Ce que tu fais, tes habitudes et les mots de tes potes le font pencher d’un côté ou de l’autre. Rien n’est définitif.',
  groupLabel: 'Fais évoluer Nino',
  initial: 'sociable' as MoodKey,
  moods: [
    { key: 'casanier', label: 'casanier', alt: 'Nino casanier, tout rond, paupières lourdes' },
    { key: 'equilibre', label: 'équilibré', alt: 'Nino équilibré, souriant et posé' },
    { key: 'sociable', label: 'sociable', alt: 'Nino sociable, entouré d’étincelles' },
    { key: 'tendre', label: 'tendre', alt: 'Nino tendre, poils longs et joues roses' },
    { key: 'piquant', label: 'piquant', alt: 'Nino piquant, poils dressés' },
    { key: 'joueur', label: 'joueur', alt: 'Nino joueur, sourire en coin' },
  ] as { key: MoodKey; label: string; alt: string }[],
  /** valeurs des 4 jauges (social, jeu, tendresse, parole) pour chaque forme */
  presets: {
    casanier: [-70, -20, 10, -35],
    equilibre: [5, 5, 5, 5],
    sociable: [75, 30, 5, 40],
    tendre: [10, -15, 80, 10],
    piquant: [0, 20, -75, 30],
    joueur: [30, 85, -10, 25],
  } as Record<MoodKey, [number, number, number, number]>,
  gauges: [
    { low: 'casanier', high: 'sociable', aria: 'Sociabilité' },
    { low: 'posé', high: 'joueur', aria: 'Jeu' },
    { low: 'piquant', high: 'tendre', aria: 'Tendresse' },
    { low: 'discret', high: 'bavard', aria: 'Parole' },
  ],
} as const;

/** Habitudes, rigueur, série de la semaine et défi du jour (spéc. V7 §6, §7, §25). */
export const habits = {
  title: [{ text: 'TIENS TES' }, { text: 'HABITUDES.' }, { text: 'IL TIENT LES COMPTES.', dim: true }] as TitleLine[],
  lead: 'Marcher, lire, te coucher tôt : choisis-en deux. Ton minimoa demande une preuve au bon moment et note ta rigueur, sans jamais te faire la morale.',
  cards: [
    { emoji: '🚶', name: 'Marcher', rhythm: 'Tous les jours', streak: 12, rigour: 86 },
    { emoji: '📖', name: 'Lire', rhythm: '3 fois par semaine', streak: 4, rigour: null },
  ] as { emoji: string; name: string; rhythm: string; streak: number; rigour: number | null }[],
  streakUnit: 'jours',
  rigourLabel: 'Rigueur sur 28 jours',
  tooEarly: 'Trop tôt pour le dire',
  week: {
    label: 'La série de la semaine',
    days: [
      { d: 'L', s: 'done' },
      { d: 'M', s: 'done' },
      { d: 'M', s: 'joker' },
      { d: 'J', s: 'done' },
      { d: 'V', s: 'today' },
      { d: 'S' },
      { d: 'D' },
    ] as { d: string; s?: 'done' | 'joker' | 'today' }[],
    legend: { done: 'fait', joker: 'joker', today: 'aujourd’hui' },
    note: 'Un jour manqué ? Un joker le couvre. Sinon la série repart, et ton record reste.',
  },
  challenge: {
    label: 'Le défi du jour',
    text: 'Écris à quelqu’un que tu n’as pas vu depuis un mois.',
    go: 'J’y vais',
    later: 'Plus tard',
  },
  pet: { src: `${IMG}/nino_fier.webp`, alt: 'Nino, fier, les poings sur les hanches' },
} as const;

/** Groupes libres et groupes d'habitude (spéc. V7 §26). */
export const groups = {
  title: [{ text: 'À PLUSIEURS,' }, { text: 'ON LÂCHE', dim: true }, { text: 'MOINS VITE.', dim: true }] as TitleLine[],
  lead: 'De 3 à 8 sur une même habitude : la série monte quand tout le monde est à jour, un oubli coûte une vie au groupe, un joker te couvre.',
  card: {
    emoji: '🚶',
    name: 'Marche du matin',
    lives: 4,
    livesMax: 5,
    streak: 9,
    streakUnit: 'jours ensemble',
    today: 'Aujourd’hui · 2/3 à jour',
    members: [
      { name: 'Léa', pet: 'suzie', state: 'Tenu', tone: 'ok' },
      { name: 'Inès', pet: 'gaston', state: 'Joker', tone: 'joker' },
      { name: 'Toi', pet: 'nino', state: 'Pas encore', tone: 'wait' },
    ] as { name: string; pet: Species; state: string; tone: 'ok' | 'joker' | 'wait' }[],
    note: 'Chacun voit l’état du jour des autres. C’est dit avant de rejoindre.',
  },
  together: {
    label: 'La tenir ensemble',
    text: '3 personnes près de toi tiennent aussi Lire. La tenir ensemble ?',
    note: 'Seul le nombre est montré. Les prénoms n’apparaissent qu’entre ceux qui disent oui.',
    yes: 'Oui, ensemble',
  },
  free: { name: 'Les potes du 11e', kind: 'Groupe libre', text: 'Un chat entre potes, sans vies ni série.' },
} as const;

export const chats = {
  title: [{ text: 'IL VIT' }, { text: 'DANS TES', dim: true }, { text: 'CHATS', dim: true }] as TitleLine[],
  lead: 'Vos minimoas brisent la glace, relancent après un silence et calment le jeu si le ton monte.',
  leadBold: 'Trois fois par jour au plus, et tu peux les couper.',
  phone: {
    name: 'Léa',
    status: '✦ 5 · niv. 3',
    tabs: ['Chat', 'Le lien'],
    activeTab: 0,
    messages: [
      { kind: 'other', who: 'Léa', text: 'J’ai vu 4 épisodes d’un coup 💀' },
      { kind: 'me', text: 'Encore ? Il est 1 h.' },
      { kind: 'other', who: 'Léa', text: 'Ce soir, je dors tôt. Promis.' },
      { kind: 'me', text: 'Tu dis ça tous les soirs.' },
      { kind: 'pet', who: 'Nino · relance', pet: 'nino', color: 'var(--lime)', text: 'Vous tenez tous les deux « Se coucher tôt ». Ça tombe bien.' },
      { kind: 'pet', who: 'Suzie · remarque', pet: 'suzie', color: 'var(--rose)', border: 'rgba(255,143,198,.4)', text: 'Léa a déjà perdu. Je la connais.' },
    ] as { kind: 'other' | 'me' | 'pet'; who?: string; pet?: string; color?: string; border?: string; text: string }[],
    mini: 'Série du lien · 12 jours',
    input: 'Écris à Léa',
  },
  apps: [
    { label: 'Brise-glace', title: 'Au début d’un lien', text: 'Une question tirée de vos points communs.', icon: 'ic_etoiles' },
    { label: 'Relance', title: 'Après un silence', text: '« Ça fait 3 jours. Vous en étiez à ce resto. »', icon: 'ic_eclair' },
    { label: 'Garde-fou', title: 'Si le ton monte', text: 'Il propose une pause, à toi seul.', icon: 'ic_gel', short: true },
  ] as { label: string; title: string; text: string; icon: string; short?: boolean }[],
  privacy: 'Aucun humain ne lit tes conversations. Si vous l’activez tous les deux, une IA lit vos derniers messages pour que vos minimoas y réagissent.',
} as const;

export const lives = {
  title: [{ text: '7 VIES.' }, { text: 'NE GHOSTE', dim: true }, { text: 'PERSONNE.', dim: true }] as TitleLine[],
  lead: 'Chaque lien a 7 vies, et un jour de silence en coûte une. Vous vous écrivez tous les deux ? La série du lien monte. À zéro vie, le lien devient fantôme 👻',
  start: 5,
  total: 7,
  /** texte sous les étincelles, de 5 vies à 0 */
  lines: ['vies avec Tom. Il ne répond plus trop…', '4 jours sans nouvelles…', 'Nino commence à s’inquiéter', 'Ça ne sent pas bon', 'Dernière vie. Écris-lui !', 'Lien fantôme 👻'],
  /** ce que dit nino, de 5 vies à 0 */
  says: ['Tom ? T’es là ?', 'Tom ?', 'Allô la Terre', 'Je deviens tout pâle', 'Dernière chance', 'Bouh. Ghosté.'],
  revived: 'Ranimé. Dernière fois, hein.',
  revivedSay: 'Je suis de retour 💚',
  chip: 'On peut le ranimer une fois. Une seule.',
  ghostAlt: 'Nino devenu fantôme, bleuté et transparent',
  bubbleWho: 'Nino',
} as const;

export const encounters = {
  title: [{ text: 'IL TE PRÉSENTE' }, { text: 'DU MONDE.', dim: true }] as TitleLine[],
  lead: 'Il ne te présente que des gens dont la vision de la vie va avec la tienne, et il dit pourquoi. Ce que vous en faites vous regarde.',
  duo: { src: `${IMG}/duo_check.webp`, alt: 'Nino et Pia qui se tapent dans la main', width: 700, height: 456 },
  m1: { who: 'Pia', text: 'T’es le minimoa de qui, toi ?', avatar: { img: '/img/pia_face.webp' } } satisfies BubbleCopy,
  m2: { who: 'Nino', text: 'D’Alex. Marche le matin, lit le soir.', avatar: { img: '/img/nino_face.webp' }, me: true } satisfies BubbleCopy,
  why: { label: 'Pourquoi Sasha', common: ['Même rythme', 'Rester ici', 'Tout prévoir'], diff: 'Une différence à explorer : l’élan' },
  ctaLabel: 'Rien ne se passe sans ton tap',
  yes: 'Saluer Sasha',
  no: 'Pas cette fois',
} as const;

/** Sorties, carte (position arrondie) et rendez-vous en vrai (spéc. V7 §5, §10). */
export const outings = {
  title: [{ text: 'SORS.' }, { text: 'IL ADORE ÇA.' }, { text: 'TOI AUSSI.', dim: true }] as TitleLine[],
  lead: 'Plus tu sors et vois du monde, plus il est en forme, et plus il te présente de gens près de chez toi.',
  question: { who: 'Nino', text: 'Tu es sorti aujourd’hui ?', answers: ['🙌 Vu du monde', '🚶 Un tour', '🛋️ Pas encore'] },
  map: {
    label: 'La carte',
    zone: 'Ta zone',
    more: '12 minimoas plus loin',
    pins: [
      { pet: 'suzie', x: 30, y: 34 },
      { pet: 'gaston', x: 66, y: 28 },
      { pet: 'pia', x: 62, y: 66 },
    ] as { pet: Species; x: number; y: number }[],
    facts: ['Position arrondie à 300 m environ, et décalée', 'Jamais en direct', 'Mode discret : tu disparais de la carte'],
  },
  meet: { title: 'Avant de voir Léa', text: 'Un lieu public, un proche prévenu, ton propre trajet. Et tu pars quand tu veux.' },
  pet: { src: `${IMG}/nino_marche.webp`, alt: 'Nino qui part en balade' },
} as const;

export const threeWords = {
  title: [{ text: 'DÉCRIS-MOI' }, { text: 'EN 3 MOTS.', dim: true }, { text: 'SOIS SYMPA.', dim: true }] as TitleLine[],
  leadBefore: 'Ton lien',
  leadLink: 'minimoa.app/m/…',
  leadAfter: 'en story. Tes potes votent en anonyme, et leurs mots font évoluer ton minimoa.',
  cardLabel: 'Anonyme · choisis-en 3',
  question: 'DÉCRIS ALEX',
  questionAccent: 'EN 3 MOTS',
  groupLabel: 'Mots pour Alex',
  words: [
    { label: 'drôle', gauge: 'joueur', on: true },
    { label: 'loyal·e', gauge: 'tendre', on: true },
    { label: 'solaire', gauge: 'sociable' },
    { label: 'têtu·e', gauge: 'piquant' },
    { label: 'bavard·e', gauge: 'bavard' },
    { label: 'chill', gauge: 'posé' },
    { label: 'chaotique', gauge: 'joueur', short: true },
    { label: 'mystérieux·se', gauge: 'discret', short: true },
  ] as { label: string; gauge: string; on?: boolean; short?: boolean }[],
  evoPrefix: 'Nino devient',
  evoEmpty: 'Choisis jusqu’à 3 mots',
  max: 3,
  pet: `${IMG}/nino_timide.webp`,
} as const;

/** Galerie des captures de l'App Store (public/img/store, voir scripts/store-images.mjs). */
export const screens = {
  title: [{ text: 'L’APP,' }, { text: 'EN VRAI.', dim: true }] as TitleLine[],
  lead: 'Les écrans de Minimoa, tels qu’ils sont dans l’app.',
  alt: (n: number, total: number) => `Écran de l’app Minimoa, ${n} sur ${total}`,
  listLabel: 'Écrans de l’app',
} as const;

/**
 * Minimoa+ : le montant facturé est toujours le plus visible (Apple 3.1.2), l'équivalent mensuel en petit.
 * Mêmes offres que l'app (docs/BLOWY-PLUS.md) ; dans l'app, les prix affichés sont ceux de l'App Store.
 */
export const plus = {
  title: [{ text: 'MINIMOA+.' }, { text: 'POUR ALLER', dim: true }, { text: 'PLUS LOIN.', dim: true }] as TitleLine[],
  lead: 'L’essentiel est gratuit, sans pub. Minimoa+ ouvre la carte, les jokers et la collection Hiver.',
  free: {
    name: 'Gratuit',
    note: '0 €, pour toujours',
    items: ['Ton minimoa, ses soins, sa garde-robe', '2 habitudes, 2 groupes', '1 joker par semaine', 'Ta zone sur la carte', 'Zéro pub. Jamais.'],
  },
  pro: {
    name: 'Minimoa+',
    note: '7 jours offerts sur l’annuel',
    items: ['Toute la carte, et changer de ville', 'Une rencontre de plus par jour', '3 jokers par semaine', '6 habitudes, 10 groupes', 'Le bilan détaillé du dimanche', 'La collection Hiver'],
    price: '59,88 € par an',
    priceNote: 'soit 4,99 € par mois · 7 jours offerts',
    others: 'Ou 14,99 € par mois, ou 2,99 € par semaine, sans essai.',
    renew: 'Renouvellement automatique, annulable à tout moment dans les réglages de ton téléphone.',
    terms: 'Conditions de Minimoa+',
    termsHref: '/legal/abonnement/',
    cta: 'Essayer dans l’app',
    ctaHref: '/plus',
  },
  pet: { src: `${IMG}/tenue_pia_hiver.webp`, alt: 'Pia en bonnet et écharpe de la collection Hiver' },
} as const;

export const faq = {
  title: [{ text: 'DES' }, { text: 'QUESTIONS ?' }, { text: 'NORMAL.', dim: true }] as TitleLine[],
  sideBefore: 'Une autre ?',
  sideLink: 'Écris-nous',
  sideAfter: '. Un humain répond. Pas un minimoa.',
  /** réponses en HTML simple (<b> autorisé) */
  items: [
    { q: 'C’est une app de rencontre ?', a: 'Non. Minimoa crée des relations : ton minimoa te présente des gens dont la vision de la vie va avec la tienne. <b>Ce que vous en faites vous regarde</b>, et rien ne se passe sans ton tap.' },
    { q: 'Mon minimoa peut mourir ?', a: 'Non, jamais. Il boude si tu le laisses tomber. C’est le <b>lien</b> qui devient fantôme après 7 jours de silence, et on peut le ranimer une fois.' },
    { q: 'Qui voit ma position ?', a: 'Personne ne la voit précise : sur la carte, elle est <b>arrondie à 300 m environ et décalée</b>, jamais en direct. Le mode discret te retire de la carte.' },
    { q: 'Qui voit mes habitudes ?', a: 'Tes liens et les personnes que ton minimoa te présente voient leur nom, ta série et ta rigueur. <b>Jamais tes photos de preuve.</b> Un réglage coupe tout.' },
    { q: 'À partir de quel âge ?', a: '<b>18 ans.</b> Ta date de naissance est demandée à l’inscription ; en dessous, rien n’est créé.' },
    { q: 'C’est payant ?', a: 'Non. Minimoa est gratuit et sans pub. <b>Minimoa+</b> coûte 59,88 € par an (7 jours offerts), 14,99 € par mois ou 2,99 € par semaine.' },
  ],
} as const;

export const final = {
  title: [{ text: 'TON MINIMOA' }, { text: "T'ATTEND." }, { text: "IL S'ENNUIE DÉJÀ.", dim: true }] as TitleLine[],
  band: { src: `${IMG}/bande_fete.webp`, alt: 'Nino, Suzie, Gaston et Pia qui font la fête', width: 1200, height: 421 },
} as const;

export const footer = {
  legalLabel: 'Liens légaux',
  links: [
    { href: '/legal/assistance/', label: 'Aide' },
    { href: '/legal/mentions-legales/', label: 'Mentions légales' },
    { href: '/legal/conditions/', label: 'Conditions' },
    { href: '/legal/confidentialite/', label: 'Confidentialité' },
    { href: '/legal/', label: 'Tout le légal' },
  ],
  copyright: '© 2026 Minimoa',
} as const;
