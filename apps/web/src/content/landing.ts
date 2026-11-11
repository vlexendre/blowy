/**
 * Textes de la landing (une seule source : les organismes et le script d'animation lisent ce fichier).
 * Tutoiement, minuscules, ton de la marque.
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
  title: 'Blowy — élève ton pet. il te présente du monde.',
  description: 'élève ton pet. il te présente du monde. gratuit, zéro swipe, 18 ans et plus.',
} as const;

export const sections = {
  top: { id: 'top', dot: 'accueil', glow: ['#FFB800', '#6D3DF0', '#FF8FC6'] },
  pet: { id: 'pet', dot: 'chacun son pet', glow: ['#6D3DF0', '#FFB800', '#FF5A3C'] },
  caractere: { id: 'caractere', dot: 'caractère', glow: ['#A98BFF', '#6D3DF0', '#FF8FC6'] },
  chats: { id: 'chats', dot: 'dans tes chats', glow: ['#FF8FC6', '#6D3DF0', '#FF9A3D'] },
  vies: { id: 'vies', dot: '7 vies', glow: ['#8C1D4F', '#FF5A3C', '#6D3DF0'] },
  photo: { id: 'photo', dot: 'photo du jour', glow: ['#FF9A3D', '#FF5A3C', '#FFB800'] },
  rencontres: { id: 'rencontres', dot: 'rencontres', glow: ['#FF5A3C', '#A98BFF', '#FF9A3D'] },
  mots: { id: 'mots', dot: '3 mots', glow: ['#FF8FC6', '#FFB800', '#A98BFF'] },
  plus: { id: 'plus', dot: 'blowy+', glow: ['#6D3DF0', '#FFB800', '#8C1D4F'] },
  faq: { id: 'faq', dot: 'questions', glow: ['#6D3DF0', '#A98BFF', '#FF8FC6'] },
  go: { id: 'go', dot: 'télécharger', glow: ['#FFB800', '#FF8FC6', '#6D3DF0'] },
} as const satisfies Record<string, SectionMeta>;
export type SectionId = keyof typeof sections;
export const sectionOrder: SectionId[] = ['top', 'pet', 'caractere', 'chats', 'vies', 'photo', 'rencontres', 'mots', 'plus', 'faq', 'go'];

export const nav = {
  logoLabel: 'blowy, retour en haut',
  sectionsLabel: 'sections',
  dotsLabel: 'aller à la section',
  download: 'télécharger',
  links: [
    { href: 'pet', label: 'son pet' },
    { href: 'caractere', label: 'caractère' },
    { href: 'chats', label: 'chats' },
    { href: 'rencontres', label: 'rencontres' },
    { href: 'plus', label: 'blowy+' },
  ],
  /** section active → lien de nav allumé */
  activeMap: { pet: 'pet', caractere: 'caractere', chats: 'chats', vies: 'chats', photo: 'chats', rencontres: 'rencontres', mots: 'rencontres', plus: 'plus' } as Record<string, string>,
} as const;

export const stores = {
  apple: { small: 'télécharger sur', name: 'App Store' },
  google: { small: 'disponible sur', name: 'Google Play' },
} as const;

export const hero = {
  title: [{ text: 'ÉLÈVE TON PET.' }, { text: 'IL TE PRÉSENTE', dim: true }, { text: 'DU MONDE.', dim: true }] as TitleLine[],
  bubbles: {
    b1: { who: 'léa', whoColor: '#8C1D4F', text: "t'es dispo samedi ?", avatar: { letter: 'L', bg: 'var(--rose)' } },
    b2: { who: 'nino', whoColor: 'var(--ink)', text: 'je lui ai déjà dit oui 😈', avatar: { img: '/img/nino_face.webp' }, dark: true },
    b3: { who: 'malo', whoColor: 'var(--ink)', text: 'ATTENDS il peut faire ça ??', avatar: { letter: 'M', bg: 'var(--orange)' } },
  } satisfies Record<string, BubbleCopy>,
  tag: 'gratuit · zéro swipe · 18 ans et plus',
  pet: { src: '/img/nino_salut.webp', alt: 'nino, une boule de poils vert lime avec une mèche corail, qui te fait coucou' },
} as const;

export const petSection = {
  title: [{ text: 'CHACUN' }, { text: 'SON PET.' }, { text: 'AUCUN PAREIL.', dim: true }] as TitleLine[],
  lead: 'une boule de poils unique, faite en 30 secondes. et dans tes chats, il parle.',
  pickLabel: 'choisis sa couleur',
  petName: 'nino',
  colors: [
    { key: 'lime', label: 'lime', swatch: '#B9E53A' },
    { key: 'rose', label: 'rose', swatch: '#FF8FC6' },
    { key: 'orange', label: 'orange', swatch: '#FF9A3D' },
    { key: 'violet', label: 'violet', swatch: '#8D5CF6' },
    { key: 'menthe', label: 'menthe', swatch: '#6FE3C1' },
    { key: 'corail', label: 'corail', swatch: '#FF5A3C' },
  ],
  chatsTitle: 'CHATS',
  rows: [
    { avatars: ['nino', 'suzie'], name: 'léa', pet: 'nino', petColor: 'var(--lime)', text: '🔥 12 jours. ne casse pas la série', lives: 5 },
    { avatars: ['nino', 'gaston'], name: 'malo', pet: 'gaston', petColor: 'var(--orange)', text: 'quiz dispo. le perdant paie le kebab', lives: 6 },
    { avatars: ['nino', 'pia'], name: 'sasha', isNew: true, pet: 'pia', petColor: 'var(--violet)', text: "on s'est croisés rue oberkampf 👀", lives: 7 },
    { avatars: ['gaston', 'suzie', 'pia'], name: 'la bande du 11e', pet: 'pia', petColor: 'var(--violet)', text: 'qui a le lien du airbnb ?', lives: 4, short: true },
    { avatars: ['nino'], name: 'tom 👻', text: 'lien fantôme. 7 jours de silence', lives: 0, gone: true },
  ] as { avatars: string[]; name: string; isNew?: boolean; pet?: string; petColor?: string; text: string; lives: number; short?: boolean; gone?: boolean }[],
  newBadge: 'nouveau',
} as const;

export type MoodKey = 'casanier' | 'sociable' | 'tendre' | 'piquant' | 'joueur';
export const character = {
  title: [{ text: 'IL A SON CARACTÈRE.' }, { text: 'ET IL CHANGE', dim: true }, { text: 'AVEC TOI', dim: true }] as TitleLine[],
  lead: "il penche d'un côté, puis de l'autre, selon ce que tu fais. rien n'est définitif.",
  groupLabel: 'fais évoluer nino',
  initial: 'sociable' as MoodKey,
  moods: [
    { key: 'casanier', alt: 'nino casanier, tout rond, paupières lourdes' },
    { key: 'sociable', alt: 'nino sociable, des antennes lui ont poussé' },
    { key: 'tendre', alt: 'nino tendre, poils longs et joues roses' },
    { key: 'piquant', alt: 'nino piquant, poils dressés et crête' },
    { key: 'joueur', alt: 'nino joueur, sourire en coin et une dent' },
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
    { low: 'casanier', high: 'sociable', aria: 'sociabilité' },
    { low: 'posé', high: 'joueur', aria: 'jeu' },
    { low: 'piquant', high: 'tendre', aria: 'tendresse' },
    { low: 'discret', high: 'bavard', aria: 'parole' },
  ],
} as const;

export const chats = {
  title: [{ text: 'IL VIT' }, { text: 'DANS TES', dim: true }, { text: 'CHATS', dim: true }] as TitleLine[],
  lead: 'une messagerie où vos pets causent, relancent et lancent des défis.',
  leadBold: 'sans rien télécharger de plus.',
  phone: {
    name: 'léa',
    status: '♥ 5 · niv. 3',
    tabs: ["aujourd'hui", 'chat', 'souvenirs'],
    activeTab: 1,
    messages: [
      { kind: 'other', who: 'léa', text: "j'ai vu 4 épisodes d'un coup 💀" },
      { kind: 'me', text: 'encore ?? il est 1h' },
      { kind: 'other', who: 'léa', text: 'ce soir je dors tôt. promis' },
      { kind: 'me', text: 'tu dis ça tous les soirs' },
      { kind: 'pet', who: 'nino', pet: 'nino', color: 'var(--lime)', text: 'je vous fais un défi ? 7 soirs couchés avant minuit. le perdant paie le brunch 😈' },
      { kind: 'pet', who: 'suzie', pet: 'suzie', color: 'var(--rose)', border: 'rgba(255,143,198,.4)', text: 'léa a déjà perdu. je la connais' },
    ] as { kind: 'other' | 'me' | 'pet'; who?: string; pet?: string; color?: string; border?: string; text: string }[],
    mini: 'DÉFI · avant minuit · série 3',
    input: 'message…',
  },
  apps: [
    { label: 'défi', title: 'avant minuit', big: '3', text: 'jours de série · toi 3/3 · léa 2/3', icon: 'ic_flamme' },
    { label: 'cagnotte', title: 'week-end à lisbonne', big: '240 €', bar: true, text: 'sur 400 € · malo doit 40 €', icon: 'ic_piece' },
    { label: 'quiz', title: "qui connaît mieux l'autre", text: 'léa mène 4 à 3. revanche ?', icon: 'ic_etoiles', short: true },
  ] as { label: string; title: string; big?: string; bar?: boolean; text: string; icon: string; short?: boolean }[],
} as const;

export const lives = {
  title: [{ text: '7 VIES.' }, { text: 'NE GHOSTE', dim: true }, { text: 'PERSONNE.', dim: true }] as TitleLine[],
  lead: 'chaque lien a 7 vies, et un jour de silence en coûte une. à zéro, le lien devient fantôme 👻',
  start: 5,
  total: 7,
  /** texte sous les cœurs, de 5 vies à 0 */
  lines: ['vies avec tom. il répond plus trop…', '4 jours sans nouvelles…', 'nino commence à s’inquiéter', 'ça sent pas bon', 'dernière vie. écris-lui !', 'lien fantôme 👻'],
  /** ce que dit nino, de 5 vies à 0 */
  says: ['tom ? t’es là ?', 'tom ??', 'allô la terre', 'je deviens tout pâle', 'dernière chance', 'bouh. tu m’as ghosté'],
  revived: 'ranimé. dernière fois, hein',
  revivedSay: 'je suis de retour 💚',
  chip: 'on peut le ranimer une fois. une seule.',
  ghostAlt: 'nino devenu fantôme, tout blanc et transparent',
  bubbleWho: 'nino',
} as const;

export const photo = {
  title: [{ text: 'UNE PHOTO' }, { text: 'PAR JOUR.', dim: true }, { text: 'SINON RIEN.', dim: true }] as TitleLine[],
  lead: 'vous postez tous les deux : la série monte et le lien gagne une vie. tu sautes ton tour ? tout le monde le saura 💀',
  mine: { status: '✓ postée', label: 'photo de toi' },
  theirs: { waiting: 'en attente…', posted: '✓ postée', label: 'photo de léa' },
  streakBefore: '11',
  streakAfter: '12',
  streakSr: 'jours de série',
  plusOne: '+1 vie',
  weekLabel: 'la semaine : 5 jours postés',
  week: [
    { d: 'L', state: 'd' },
    { d: 'M', state: 'd' },
    { d: 'M', state: 'd' },
    { d: 'J', state: 'd' },
    { d: 'V', state: 't' },
    { d: 'S' },
    { d: 'D' },
  ] as { d: string; state?: 'd' | 't' }[],
  weekText: "12 jours d'affilée",
} as const;

export const encounters = {
  title: [{ text: 'IL TE' }, { text: 'PRÉSENTE' }, { text: 'DU MONDE', dim: true }] as TitleLine[],
  lead: "ton pet croise d'abord les pets des potes de tes potes. quand ça colle, ils discutent entre eux avant toi.",
  pia: { src: '/img/pia_salut.webp', alt: 'pia, une boule de poils violette avec deux petites cornes, qui salue' },
  nino: { src: '/img/nino_cote.webp', alt: 'nino, de profil, qui regarde pia' },
  m1: { who: 'pia', text: "t'es le pet de qui toi ?", avatar: { img: '/img/pia_face.webp' } } satisfies BubbleCopy,
  m2: { who: 'nino', text: "d'alex. il fait des quiz à 2h du mat", avatar: { img: '/img/nino_face.webp' }, me: true } satisfies BubbleCopy,
  match: 'par malo · pote de pote · 91 %',
  ctaLabel: 'rien sans ton tap',
  yes: 'dire salut à sasha',
  no: 'pas cette fois',
} as const;

export const threeWords = {
  title: [{ text: 'DÉCRIS-MOI' }, { text: 'EN 3 MOTS.', dim: true }, { text: 'SOIS SYMPA.', dim: true }] as TitleLine[],
  leadBefore: 'ton lien',
  leadLink: 'blowy.app/alex',
  leadAfter: 'en story. tes potes votent en anonyme, et les mots de tes potes font évoluer ton pet.',
  cardLabel: 'anonyme · choisis-en 3',
  question: 'DÉCRIS ALEX',
  questionAccent: 'EN 3 MOTS',
  groupLabel: 'mots pour alex',
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
  evoPrefix: 'nino devient',
  evoEmpty: 'choisis jusqu’à 3 mots',
  max: 3,
} as const;

export const plus = {
  title: [{ text: 'BLOWY+.' }, { text: 'POUR LES', dim: true }, { text: 'IMPATIENTS.', dim: true }] as TitleLine[],
  lead: "l'essentiel est gratuit, sans pub. le plus, c'est pour aller plus vite.",
  free: { name: 'gratuit', note: '0 €, pour toujours', items: ['1 rencontre par semaine', 'chats et défis illimités', 'photo du jour, 7 vies', 'zéro pub. jamais.'] },
  pro: {
    name: 'blowy+',
    note: 'essai 3 jours',
    items: ['3 rencontres à la fois', 'la carte des pets autour de toi', 'la garde-robe de ton pet', '2 gels de série par mois'],
    price: '4,99 €/mois',
    priceNote: 'facturé 59,88 €/an · ou 14,99 € au mois',
    cta: 'essayer 3 jours',
  },
} as const;

export const faq = {
  title: [{ text: 'DES' }, { text: 'QUESTIONS ?' }, { text: 'NORMAL.', dim: true }] as TitleLine[],
  sideBefore: 'une autre ?',
  sideLink: 'écris-nous',
  sideAfter: ', un humain répond. pas un pet.',
  /** réponses en HTML simple (<b> autorisé) */
  items: [
    { q: "c'est une app de rencontre ?", a: 'pas vraiment. c\'est une messagerie avec des pets dedans. les rencontres arrivent en bonus, par les potes de tes potes, et <b>rien ne se fait sans ton tap.</b>' },
    { q: 'mon pet peut mourir ?', a: "non, jamais. c'est le <b>lien</b> qui devient fantôme après 7 jours de silence. et on peut le ranimer une fois." },
    { q: "c'est anonyme, les 3 mots ?", a: 'oui. tu vois les mots, pas qui les a choisis. et on ne propose que des mots gentils.' },
    { q: 'à partir de quel âge ?', a: '<b>18 ans.</b> tout le monde passe une vérification par selfie à l\'inscription. chaque pet a un vrai humain derrière.' },
    { q: "c'est payant ?", a: 'non. blowy est gratuit et sans pub. <b>blowy+</b> (dès 4,99 €/mois) ajoute des rencontres, la carte et la garde-robe.' },
  ],
} as const;

export const final = {
  title: [{ text: 'TON PET' }, { text: "T'ATTEND." }, { text: "IL S'ENNUIE DÉJÀ.", dim: true }] as TitleLine[],
  band: { src: '/img/bande.webp', alt: 'nino, suzie, gaston et pia, côte à côte' },
} as const;

export const footer = {
  legalLabel: 'liens légaux',
  links: [
    { href: '/support', label: 'aide' },
    { href: '/confidentialite', label: 'confidentialité' },
    { href: '/conditions', label: 'conditions' },
  ],
  copyright: '© 2026 Blowy',
} as const;
