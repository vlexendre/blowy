/** Jetons de design Blowy V6 : nuit, panneaux de couleur, jaune d'accent. Partagés par l'app et le site. */
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
  violet: ['#6D3DF0', '#A98BFF'],
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
export const radius = { sm: 12, md: 18, lg: 28, xl: 36, pill: 999 } as const;

/** Noms de polices chargées par l'app (expo-google-fonts) ; le site utilise les mêmes familles. */
export const font = {
  display: 'Anton_400Regular',
  body: 'BricolageGrotesque_500Medium',
  bodyBold: 'BricolageGrotesque_700Bold',
  /** Graisse 800 : la plus employée des maquettes (boutons, puces, libellés, noms). */
  bodyHeavy: 'BricolageGrotesque_800ExtraBold',
  web: { display: "'Anton', sans-serif", body: "'Bricolage Grotesque', sans-serif" },
} as const;

export const type = {
  hero: { fontFamily: font.display, fontSize: 56, lineHeight: 58, textTransform: 'uppercase' },
  h1: { fontFamily: font.display, fontSize: 40, lineHeight: 42, textTransform: 'uppercase' },
  h2: { fontFamily: font.display, fontSize: 28, lineHeight: 31, textTransform: 'uppercase' },
  h3: { fontFamily: font.display, fontSize: 20, lineHeight: 23, textTransform: 'uppercase' },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 22 },
  bodyBold: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 22 },
  bodyHeavy: { fontFamily: font.bodyHeavy, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bodyHeavy, fontSize: 12, lineHeight: 15, letterSpacing: 0.6, textTransform: 'uppercase' },
} as const;
export type TypeName = keyof typeof type;
