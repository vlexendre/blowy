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
  danger: '#FF4D4D',
  ok: '#3DDC97',
} as const;
export type ColorName = keyof typeof color;

/** Dégradés verticaux des grands panneaux. */
export const gradient = {
  accent: ['#FFD23F', '#FFB000'],
  orange: ['#FF7A2E', '#FFA24D'],
  coral: ['#FF5A3C', '#FF8A6B'],
  violet: ['#6D3DF0', '#A98BFF'],
  rose: ['#FF6FB5', '#FFA9D6'],
  wine: ['#3A1030', '#6B1D4F'],
  night: ['#17142A', '#0B0A14'],
} as const;
export type GradientName = keyof typeof gradient;

export const speciesColor = { nino: color.coral, suzie: color.violet, gaston: color.rose, pia: color.orange } as const;
export const speciesGradient = { nino: 'coral', suzie: 'violet', gaston: 'rose', pia: 'orange' } as const satisfies Record<string, GradientName>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 12, md: 18, lg: 28, xl: 36, pill: 999 } as const;

/** Noms de polices chargées par l'app (expo-google-fonts) ; le site utilise les mêmes familles. */
export const font = {
  display: 'Anton_400Regular',
  body: 'BricolageGrotesque_500Medium',
  bodyBold: 'BricolageGrotesque_700Bold',
  web: { display: "'Anton', sans-serif", body: "'Bricolage Grotesque', sans-serif" },
} as const;

export const type = {
  hero: { fontFamily: font.display, fontSize: 56, lineHeight: 58, textTransform: 'uppercase' },
  h1: { fontFamily: font.display, fontSize: 40, lineHeight: 42, textTransform: 'uppercase' },
  h2: { fontFamily: font.display, fontSize: 28, lineHeight: 31, textTransform: 'uppercase' },
  h3: { fontFamily: font.display, fontSize: 20, lineHeight: 23, textTransform: 'uppercase' },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 22 },
  bodyBold: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bodyBold, fontSize: 12, lineHeight: 15, letterSpacing: 0.6, textTransform: 'uppercase' },
} as const;
export type TypeName = keyof typeof type;
