/**
 * Textes de la landing (une seule source : les organismes et le script d'animation lisent ce fichier).
 * Tutoiement, majuscule en début de phrase, ton sec plutôt que mignon. Le personnage est un minimoa.
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

export const meta = {
  title: 'Minimoa — Élève ton minimoa. Il te présente du monde.',
  description: 'Élève ton minimoa. Il te présente du monde. Gratuit, zéro swipe, 18 ans et plus.',
} as const;

export const sections = {
  top: { id: 'top', dot: 'Accueil', glow: ['#FFB800', '#6D3DF0', '#FF8FC6'] },
  pet: { id: 'pet', dot: 'Chacun son minimoa', glow: ['#6D3DF0', '#FFB800', '#FF5A3C'] },
  caractere: { id: 'caractere', dot: 'Caractère', glow: ['#A98BFF', '#6D3DF0', '#FF8FC6'] },
  chats: { id: 'chats', dot: 'Dans tes chats', glow: ['#FF8FC6', '#6D3DF0', '#FF9A3D'] },
  vies: { id: 'vies', dot: '7 vies', glow: ['#8C1D4F', '#FF5A3C', '#6D3DF0'] },
  photo: { id: 'photo', dot: 'La série', glow: ['#FF9A3D', '#FF5A3C', '#FFB800'] },
  rencontres: { id: 'rencontres', dot: 'Rencontres', glow: ['#FF5A3C', '#A98BFF', '#FF9A3D'] },
  mots: { id: 'mots', dot: '3 mots', glow: ['#FF8FC6', '#FFB800', '#A98BFF'] },
  plus: { id: 'plus', dot: 'Minimoa+', glow: ['#6D3DF0', '#FFB800', '#8C1D4F'] },
  faq: { id: 'faq', dot: 'Questions', glow: ['#6D3DF0', '#A98BFF', '#FF8FC6'] },
  go: { id: 'go', dot: 'Télécharger', glow: ['#FFB800', '#FF8FC6', '#6D3DF0'] },
} as const satisfies Record<string, SectionMeta>;
export type SectionId = keyof typeof sections;
export const sectionOrder: SectionId[] = ['top', 'pet', 'caractere', 'chats', 'vies', 'photo', 'rencontres', 'mots', 'plus', 'faq', 'go'];

export const nav = {
  logoLabel: 'Minimoa, retour en haut',
  sectionsLabel: 'Sections',
  dotsLabel: 'Aller à la section',
  download: 'Télécharger',
  links: [
    { href: 'pet', label: 'Son minimoa' },
    { href: 'caractere', label: 'Caractère' },
    { href: 'chats', label: 'Chats' },
    { href: 'rencontres', label: 'Rencontres' },
    { href: 'plus', label: 'Minimoa+' },
  ],
  /** section active → lien de nav allumé */
  activeMap: { pet: 'pet', caractere: 'caractere', chats: 'chats', vies: 'chats', photo: 'chats', rencontres: 'rencontres', mots: 'rencontres', plus: 'plus' } as Record<string, string>,
} as const;

export const stores = {
  apple: { small: 'Télécharger sur', name: 'App Store' },
  google: { small: 'Disponible sur', name: 'Google Play' },
} as const;

export const hero = {
  title: [{ text: 'ÉLÈVE TON MINIMOA.' }, { text: 'IL TE PRÉSENTE', dim: true }, { text: 'DU MONDE.', dim: true }] as TitleLine[],
  bubbles: {
    b1: { who: 'Léa', whoColor: '#8C1D4F', text: 'T’es dispo samedi ?', avatar: { letter: 'L', bg: 'var(--rose)' } },
    b2: { who: 'Nino', whoColor: 'var(--ink)', text: 'Je lui ai déjà dit oui 😈', avatar: { img: '/img/nino_face.webp' }, dark: true },
    b3: { who: 'Malo', whoColor: 'var(--ink)', text: 'Attends. Il peut faire ça ?', avatar: { letter: 'M', bg: 'var(--orange)' } },
  } satisfies Record<string, BubbleCopy>,
  tag: 'Gratuit · zéro swipe · 18 ans et plus',
  pet: { src: '/img/nino_salut.webp', alt: 'Nino, un minimoa vert lime avec une mèche corail, qui te fait signe' },
} as const;

export const petSection = {
  title: [{ text: 'CHACUN' }, { text: 'SON MINIMOA.' }, { text: 'AUCUN PAREIL.', dim: true }] as TitleLine[],
  lead: 'Un minimoa unique, fait en 30 secondes. Et dans tes chats, il parle.',
  pickLabel: 'Choisis sa couleur',
  petName: 'Nino',
  colors: [
    { key: 'lime', label: 'Lime', swatch: '#B9E53A' },
    { key: 'rose', label: 'Rose', swatch: '#FF8FC6' },
    { key: 'orange', label: 'Orange', swatch: '#FF9A3D' },
    { key: 'violet', label: 'Violet', swatch: '#8D5CF6' },
    { key: 'menthe', label: 'Menthe', swatch: '#6FE3C1' },
    { key: 'corail', label: 'Corail', swatch: '#FF5A3C' },
  ],
  chatsTitle: 'CHATS',
  rows: [
    { avatars: ['nino', 'suzie'], name: 'Léa', pet: 'nino', petColor: 'var(--lime)', text: '🔥 12 jours. Ne casse pas la série.', lives: 5 },
    { avatars: ['nino', 'gaston'], name: 'Malo', pet: 'gaston', petColor: 'var(--orange)', text: 'Quiz dispo. Le perdant paie le kebab.', lives: 6 },
    { avatars: ['nino', 'pia'], name: 'Sasha', isNew: true, pet: 'pia', petColor: 'var(--violet)', text: 'On s’est croisés rue Oberkampf 👀', lives: 7 },
    { avatars: ['gaston', 'suzie', 'pia'], name: 'La bande du 11e', pet: 'pia', petColor: 'var(--violet)', text: 'Qui a le lien du Airbnb ?', lives: 4, short: true },
    { avatars: ['nino'], name: 'Tom 👻', text: 'Lien fantôme. 7 jours de silence.', lives: 0, gone: true },
  ] as { avatars: string[]; name: string; isNew?: boolean; pet?: string; petColor?: string; text: string; lives: number; short?: boolean; gone?: boolean }[],
  newBadge: 'Nouveau',
} as const;

export type MoodKey = 'casanier' | 'sociable' | 'tendre' | 'piquant' | 'joueur';
export const character = {
  title: [{ text: 'IL A SON CARACTÈRE.' }, { text: 'ET IL CHANGE', dim: true }, { text: 'AVEC TOI', dim: true }] as TitleLine[],
  lead: 'Il penche d’un côté, puis de l’autre, selon ce que tu fais. Rien n’est définitif.',
  groupLabel: 'Fais évoluer Nino',
  initial: 'sociable' as MoodKey,
  moods: [
    { key: 'casanier', alt: 'Nino casanier, tout rond, paupières lourdes' },
    { key: 'sociable', alt: 'Nino sociable, des antennes lui ont poussé' },
    { key: 'tendre', alt: 'Nino tendre, poils longs et joues roses' },
    { key: 'piquant', alt: 'Nino piquant, poils dressés et crête' },
    { key: 'joueur', alt: 'Nino joueur, sourire en coin et une dent' },
  ] as { key: MoodKey; alt: string }[],
  /** valeurs des 4 jauges (social, jeu, tendresse, parole) pour chaque humeur */
  presets: {
    casanier: [-70, -20, 10, -35],
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

export const chats = {
  title: [{ text: 'IL VIT' }, { text: 'DANS TES', dim: true }, { text: 'CHATS', dim: true }] as TitleLine[],
  lead: 'Une messagerie où vos minimoas causent, relancent et lancent des défis.',
  leadBold: 'Sans rien télécharger de plus.',
  phone: {
    name: 'Léa',
    status: '✦ 5 · niv. 3',
    tabs: ['Aujourd’hui', 'Chat', 'Souvenirs'],
    activeTab: 1,
    messages: [
      { kind: 'other', who: 'Léa', text: 'J’ai vu 4 épisodes d’un coup 💀' },
      { kind: 'me', text: 'Encore ? Il est 1 h.' },
      { kind: 'other', who: 'Léa', text: 'Ce soir, je dors tôt. Promis.' },
      { kind: 'me', text: 'Tu dis ça tous les soirs.' },
      { kind: 'pet', who: 'Nino', pet: 'nino', color: 'var(--lime)', text: 'Un défi ? 7 soirs au lit avant minuit. Le perdant paie le brunch 😈' },
      { kind: 'pet', who: 'Suzie', pet: 'suzie', color: 'var(--rose)', border: 'rgba(255,143,198,.4)', text: 'Léa a déjà perdu. Je la connais.' },
    ] as { kind: 'other' | 'me' | 'pet'; who?: string; pet?: string; color?: string; border?: string; text: string }[],
    mini: 'DÉFI · avant minuit · série 3',
    input: 'Message…',
  },
  apps: [
    { label: 'Défi', title: 'Avant minuit', big: '3', text: 'jours de série · toi 3/3 · Léa 2/3', icon: 'ic_flamme' },
    { label: 'Cagnotte', title: 'Week-end à Lisbonne', big: '240 €', bar: true, text: 'sur 400 € · Malo doit 40 €', icon: 'ic_piece' },
    { label: 'Quiz', title: 'Qui connaît le mieux l’autre', text: 'Léa mène 4 à 3. Revanche ?', icon: 'ic_etoiles', short: true },
  ] as { label: string; title: string; big?: string; bar?: boolean; text: string; icon: string; short?: boolean }[],
} as const;

export const lives = {
  title: [{ text: '7 VIES.' }, { text: 'NE GHOSTE', dim: true }, { text: 'PERSONNE.', dim: true }] as TitleLine[],
  lead: 'Chaque lien a 7 vies, et un jour de silence en coûte une. À zéro, le lien devient fantôme 👻',
  start: 5,
  total: 7,
  /** texte sous les étincelles, de 5 vies à 0 */
  lines: ['vies avec Tom. Il ne répond plus trop…', '4 jours sans nouvelles…', 'Nino commence à s’inquiéter', 'Ça ne sent pas bon', 'Dernière vie. Écris-lui !', 'Lien fantôme 👻'],
  /** ce que dit nino, de 5 vies à 0 */
  says: ['Tom ? T’es là ?', 'Tom ?', 'Allô la Terre', 'Je deviens tout pâle', 'Dernière chance', 'Bouh. Ghosté.'],
  revived: 'Ranimé. Dernière fois, hein.',
  revivedSay: 'Je suis de retour 💚',
  chip: 'On peut le ranimer une fois. Une seule.',
  ghostAlt: 'Nino devenu fantôme, tout blanc et transparent',
  bubbleWho: 'Nino',
} as const;

/** La série d'un lien (section d'ancre `photo`, gardée pour les liens déjà partagés) : un mot de chacun par jour. */
export const photo = {
  title: [{ text: 'UN MOT' }, { text: 'CHACUN.', dim: true }, { text: 'CHAQUE JOUR.', dim: true }] as TitleLine[],
  lead: 'Vous vous écrivez tous les deux dans la journée : la série du lien monte. Tu laisses passer minuit ? Elle repart de zéro 💀',
  mine: { status: '✓ a écrit', label: 'Toi : « Ciné ce soir ? »' },
  theirs: { waiting: 'Pas encore…', posted: '✓ a écrit', label: 'Léa : « Grave ! »' },
  streakBefore: '11',
  streakAfter: '12',
  streakSr: 'jours de série',
  plusOne: 'Série +1',
  weekLabel: 'La semaine : 5 jours à vous écrire',
  week: [
    { d: 'L', state: 'd' },
    { d: 'M', state: 'd' },
    { d: 'M', state: 'd' },
    { d: 'J', state: 'd' },
    { d: 'V', state: 't' },
    { d: 'S' },
    { d: 'D' },
  ] as { d: string; state?: 'd' | 't' }[],
  weekText: '12 jours d’affilée',
} as const;

export const encounters = {
  title: [{ text: 'IL TE' }, { text: 'PRÉSENTE' }, { text: 'DU MONDE', dim: true }] as TitleLine[],
  lead: 'Ton minimoa croise d’abord les minimoas des potes de tes potes. Quand ça colle, ils discutent entre eux avant toi.',
  pia: { src: '/img/pia_salut.webp', alt: 'Pia, un minimoa violet avec deux petites cornes, qui salue' },
  nino: { src: '/img/nino_cote.webp', alt: 'Nino, de profil, qui regarde Pia' },
  m1: { who: 'Pia', text: 'T’es le minimoa de qui, toi ?', avatar: { img: '/img/pia_face.webp' } } satisfies BubbleCopy,
  m2: { who: 'Nino', text: 'D’Alex. Quiz à 2 h du mat, tous les soirs.', avatar: { img: '/img/nino_face.webp' }, me: true } satisfies BubbleCopy,
  match: 'Par Malo · pote de pote · 91 %',
  ctaLabel: 'Rien sans ton tap',
  yes: 'Dire salut à Sasha',
  no: 'Pas cette fois',
} as const;

export const threeWords = {
  title: [{ text: 'DÉCRIS-MOI' }, { text: 'EN 3 MOTS.', dim: true }, { text: 'SOIS SYMPA.', dim: true }] as TitleLine[],
  leadBefore: 'Ton lien',
  leadLink: 'blowy.app/alex',
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
  evoEmpty: 'Choisis jusqu’à 3 mots',
  max: 3,
} as const;

export const plus = {
  title: [{ text: 'MINIMOA+.' }, { text: 'POUR ALLER', dim: true }, { text: 'PLUS VITE.', dim: true }] as TitleLine[],
  lead: 'L’essentiel est gratuit, sans pub. Le plus, c’est pour aller plus vite.',
  free: { name: 'Gratuit', note: '0 €, pour toujours', items: ['1 rencontre par semaine', 'Chats et défis illimités', 'Séries et 7 vies', 'Zéro pub. Jamais.'] },
  pro: {
    name: 'Minimoa+',
    note: 'Essai 3 jours',
    items: ['3 rencontres à la fois', 'La carte des minimoas autour de toi', 'La garde-robe de ton minimoa', '2 gels de série par mois'],
    price: '4,99 €/mois',
    priceNote: 'Facturé 59,88 €/an · ou 14,99 € au mois',
    cta: 'Essayer 3 jours',
  },
} as const;

export const faq = {
  title: [{ text: 'DES' }, { text: 'QUESTIONS ?' }, { text: 'NORMAL.', dim: true }] as TitleLine[],
  sideBefore: 'Une autre ?',
  sideLink: 'Écris-nous',
  sideAfter: '. Un humain répond. Pas un minimoa.',
  /** réponses en HTML simple (<b> autorisé) */
  items: [
    { q: 'C’est une app de rencontre ?', a: 'Pas vraiment. C’est une messagerie avec des minimoas dedans. Les rencontres arrivent en bonus, par les potes de tes potes, et <b>rien ne se fait sans ton tap.</b>' },
    { q: 'Mon minimoa peut mourir ?', a: 'Non, jamais. C’est le <b>lien</b> qui devient fantôme après 7 jours de silence. Et on peut le ranimer une fois.' },
    { q: 'C’est anonyme, les 3 mots ?', a: 'Oui. Tu vois les mots, pas qui les a choisis. Et on ne propose que des mots gentils.' },
    { q: 'À partir de quel âge ?', a: '<b>18 ans.</b> Tout le monde passe une vérification par selfie à l’inscription. Chaque minimoa a un vrai humain derrière.' },
    { q: 'C’est payant ?', a: 'Non. Minimoa est gratuit et sans pub. <b>Minimoa+</b> (dès 4,99 €/mois) ajoute des rencontres, la carte et la garde-robe.' },
  ],
} as const;

export const final = {
  title: [{ text: 'TON MINIMOA' }, { text: "T'ATTEND." }, { text: "IL S'ENNUIE DÉJÀ.", dim: true }] as TitleLine[],
  band: { src: '/img/bande.webp', alt: 'Nino, Suzie, Gaston et Pia, côte à côte' },
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
