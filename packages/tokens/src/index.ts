/** Jetons de design Minimoa V6 : nuit, panneaux de couleur, jaune d'accent. Partagés par l'app et le site. */
export const color = {
  night: '#0B0A14',
  panel: '#17142A',
  card: '#221E3C',
  line: '#2E2950',
  mute: '#A9A3C4',
  dark: '#14101F',
  white: '#FFFFFF',
  accent: '#FFB800',
  accentSoft: '#FFD23F',
  coral: '#FF5A3C',
  violet: '#8D5CF6',
  rose: '#FF8FC6',
  orange: '#FF9A3D',
  lime: '#A8D52A',
  danger: '#FF4D4D',
  ok: '#3DDC97',
} as const;
export type ColorName = keyof typeof color;

/** Dégradés verticaux des grands panneaux. */
export const gradient = {
  accent: ['#FFD23F', '#FFB000'],
  orange: ['#FF7A2E', '#FFA24D'],
  coral: ['#FF5A3C', '#FF8F6B'],
  // Bas du dégradé assez foncé pour du texte blanc lisible partout (AA, 4,5:1), même en petit.
  violet: ['#6D3DF0', '#8253F4'],
  rose: ['#FF8FC6', '#FFC4DF'],
  wine: ['#2A0F2E', '#8C1D4F'],
  night: ['#17142A', '#0B0A14'],
} as const;
export type GradientName = keyof typeof gradient;

/** Couleur du pelage de chaque espèce (Nino vert, Suzie rose, Gaston orange, Pia violette). */
export const speciesColor = { nino: color.lime, suzie: color.rose, gaston: color.orange, pia: color.violet } as const;
/** Panneau placé derrière chaque espèce : choisi pour contraster avec son pelage. */
export const speciesGradient = { nino: 'coral', suzie: 'wine', gaston: 'violet', pia: 'accent' } as const satisfies Record<string, GradientName>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
/** `card` : carte ordinaire de l'app (passe « densité » : 22 au lieu de 28) ; `lg` reste celui du site et de la barre d'onglets. */
export const radius = { sm: 12, md: 18, card: 22, lg: 28, xl: 36, pill: 999 } as const;

/**
 * Polices de l'app : Allo partout (Josh Puckett, SIL OFL 1.1, fichiers statiques à l'arrondi 50 :
 * `apps/mobile/assets/fonts/allo`), titres compris (Allo ExtraBold en capitales). Le site garde sa propre famille de
 * titres (`web.display`).
 */
export const font = {
  /** Titres : Allo ExtraBold, en capitales, chasse un peu resserrée (`displayTracking`). */
  display: 'Allo_800ExtraBold',
  body: 'Allo_500Medium',
  bodyBold: 'Allo_700Bold',
  /** Graisse 800 : la plus employée des maquettes (boutons, puces, libellés, noms). */
  bodyHeavy: 'Allo_800ExtraBold',
  web: { display: "'Anton', sans-serif", body: "'Allo', sans-serif" },
} as const;

/**
 * Les tailles de titre des maquettes ont été dessinées pour une police étroite ; Allo ExtraBold est environ 1,4 fois
 * plus large. Toute taille de titre écrite dans le code (`size={40}`) est une taille « de maquette » : elle est rendue à
 * `DISPLAY_SCALE` près (`displaySize`), pour que les lignes gardent la même longueur.
 */
export const DISPLAY_SCALE = 0.74;
/** Taille réellement rendue d'un titre écrit à la taille de maquette `n`. */
export const displaySize = (n: number): number => Math.round(n * DISPLAY_SCALE);
/** Approche des titres (em) : légèrement resserrée, pour garder l'impact des capitales. */
export const displayTracking = -0.02;
/** Interlignage des titres (proportion du corps rendu). */
export const displayLeading = 1.02;

const display = (n: number) => {
  const px = displaySize(n);
  return { fontFamily: font.display, fontSize: px, lineHeight: Math.round(px * displayLeading), letterSpacing: px * displayTracking, textTransform: 'uppercase' } as const;
};

export const type = {
  hero: display(56),
  h1: display(40),
  h2: display(28),
  h3: display(20),
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 22 },
  bodyBold: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 22 },
  bodyHeavy: { fontFamily: font.bodyHeavy, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bodyHeavy, fontSize: 12, lineHeight: 15, letterSpacing: 0.6, textTransform: 'uppercase' },
} as const;
export type TypeName = keyof typeof type;
