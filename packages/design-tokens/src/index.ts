/**
 * Jetons de design Blowy — relevé exhaustif des maquettes V4 (design/v4-reference/project/*.dc.html),
 * langage visuel repris tel quel par la V5. Documentation valeur par valeur (CSS source →
 * équivalent React Native) : docs/design/design-language.md.
 * Source unique pour mobile (ui-mobile), web et admin (ui-web). Contrastes : contrast.test.ts.
 *
 * Règle : ajouts uniquement compatibles (ui-web génère tokens.css depuis `color`/`space`/`radius`).
 */
export const color = {
  // Fonds
  cream: '#FFF7EC', // fond d'écran (div racine 390×844)
  creamDeep: '#F4EADC', // séparateurs `.row` (border-top 1px), pistes de jauge `.g`, segments inactifs
  creamShadow: '#EEDFCB', // ombre dure des cartes `.card` / `.back` / `.grp`
  creamShadowAlt: '#E8D9C4', // ombre du bouton blanc `.b3`
  sunLight: '#FFF1C9', // pastilles « attente » (fond)
  coralLight: '#FFE3D9', // pastilles corail pâle
  pinkLight: '#FFE3EC', // pastilles rose pâle
  cyanLight: '#DDF8FC', // pastilles cyan pâle (« jamais vu »)
  greenLight: '#DDF8E8',
  limeLight: '#E8F9C8',
  violetMist: '#E3DBFF', // texte secondaire sur fond nuit/violet
  // Encres
  ink: '#16110D', // texte principal, `.b2`, `.cap`
  inkWarm: '#2E2620', // pastille « lien »
  inkSoft: '#5A5047', // texte secondaire
  sig: '#6B6259', // `.sig`, textes tertiaires
  navInk: '#5E544A', // onglets inactifs `.gnav a`
  muted: '#8A7E70', // `.lbl` gris, « pets & potes »
  mutedNav: '#9A8E80', // ancienne barre `.nav a`
  mutedLight: '#A79C90',
  faint: '#BDB2A6', // icônes désactivées
  white: '#FFFFFF',
  black: '#000000', // ombre dure de `.b2`
  // Accents
  coral: '#FF5A3C', // `.b1`, point du logo, accent principal
  coralShadow: '#C4341B',
  pink: '#FF3D7F', // badges `.bdg`, blobs
  pinkShadow: '#B81F55',
  rose: '#FF7A9C',
  mango: '#FFB347', // blobs, pièces
  sun: '#FFE36E',
  sunShadow: '#C97A12',
  lime: '#C8F542', // `.bl`, onglet actif, tampon « DE NOUVELLES PERSONNES. »
  limeShadow: '#7DA11A',
  violet: '#7C3AED', // « PLUS »
  violetDeep: '#4C1D95',
  violetShadow: '#2E1065',
  violetLight: '#EDE4FF',
  lilac: '#A78BFA',
  night: '#2E1B3D', // dégradés nuit
  cyan: '#22D3EE',
  cyanDeep: '#0E7490',
  online: '#2EAD6A', // pastille « en ligne »
  danger: '#D92D2D',
  success: '#2E9E4F',
} as const;

export type ColorToken = keyof typeof color;

/** Couleurs translucides relevées (rgba exacts). */
export const alpha = {
  orbitDash: 'rgba(22,17,13,0.15)', // cercle pointillé `.orb`
  chipDrop: 'rgba(0,0,0,0.07)', // `box-shadow:0 2px 0 rgba(0,0,0,.07)` (puce blanche)
  chipDropStrong: 'rgba(0,0,0,0.08)',
  pinDrop: 'rgba(22,17,13,0.18)',
  stampDrop: 'rgba(22,17,13,0.25)',
  onlinePulse: 'rgba(46,173,106,0.5)', // @keyframes pulse (Welcome)
  limePulse: 'rgba(200,245,66,0.7)', // @keyframes pulse (Chats, Campus)
  coralPulse: 'rgba(255,90,60,0.55)', // @keyframes pulse (Nid)
  navShadow: 'rgba(22,17,13,0.24)',
  navShadowNear: 'rgba(22,17,13,0.08)',
  glassTop: 'rgba(255,255,255,0.66)',
  glassBottom: 'rgba(255,255,255,0.34)',
  glassBorder: 'rgba(255,255,255,0.8)',
  badgeRing: 'rgba(255,255,255,0.9)',
  tabOnTop: 'rgba(214,250,110,0.95)',
  tabOnBottom: 'rgba(200,245,66,0.85)',
  tabOnGlow: 'rgba(125,161,26,0.35)',
} as const;

export const space = { xxs: 4, xs: 6, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 } as const;
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 30, pill: 999 } as const;

/** Rayons nommés relevés dans les maquettes (px). */
export const radii = {
  button: 18, // `.btn`
  buttonCompact: 16, // `.btn` 52 px
  card: 22, // `.card`
  group: 20, // `.grp`
  caption: 12, // `.cap`
  back: 14, // `.back` 44 px (12 pour la variante 40 px)
  stampPet: 16, // « PET. »
  stampLime: 14, // « DE NOUVELLES PERSONNES. »
  icon: 10, // `.ico`
  nav: 34, // `.gnav`
  navItem: 28, // `.gnav a`
  pill: 999,
} as const;

/** Mise en page d'écran (div racine des maquettes). */
export const layout = {
  frameWidth: 390,
  frameHeight: 844,
  padTop: 56,
  padX: 22,
  padBottom: 26,
  /** `.gnav` : left/right 14, bottom 18, padding 6, hauteur d'onglet 54. */
  navInset: 14,
  navBottom: 18,
  navPad: 6,
  navItemHeight: 54,
  /** Réserve de bas d'écran sous la barre flottante (`flex:0 0 96px`). */
  navReserve: 96,
} as const;

/** Ombre « bouton 3D » : décalage vertical dur, aucune diffusion. */
export const hardShadow = {
  button: { offsetY: 5, colorFor: { coral: color.coralShadow, ink: '#000000', lime: color.ink, white: color.creamShadowAlt } },
  card: { offsetY: 4, color: color.creamShadow },
} as const;

/** Ombres dures nommées : `box-shadow: 0 <y>px 0 <color>`. */
export const shadow3d = {
  b1: { y: 5, color: color.coralShadow },
  b2: { y: 5, color: color.black },
  b3: { y: 5, color: color.creamShadowAlt },
  bl: { y: 5, color: color.ink },
  card: { y: 4, color: color.creamShadow },
  cardSm: { y: 3, color: color.creamShadow },
  chip: { y: 2, color: alpha.chipDrop },
  chipStrong: { y: 2, color: alpha.chipDropStrong },
  stampPet: { y: 5, color: color.coral },
  stampLime: { y: 4, color: color.ink },
} as const;
/** `.btn:active{transform:translateY(4px);box-shadow:none}` ; `.row/.act/.opt:active` : 3 px. */
export const press = { depth: 4, depthSmall: 3 } as const;

export const font = {
  display: 'Bricolage Grotesque',
  displayFallback: 'System',
  body: 'Inter',
  bodyFallback: 'System',
} as const;

/**
 * Style `.d` : `font-family:'Bricolage Grotesque';font-weight:800;font-stretch:85%;
 * letter-spacing:-.03em;line-height:.95` + `font-optical-sizing:auto` (opsz = taille px, 12–96).
 */
export const displayFace = { weight: 800, stretch: 85, letterSpacingEm: -0.03, lineHeight: 0.95 } as const;
/** Bricolage hors `.d` (boutons, `.act`, `.seg`, `.mini`) : 800, largeur 100 %. */
export const strongFace = { weight: 800, stretch: 100 } as const;

/**
 * Tailles pour lesquelles une instance statique Bricolage existe (opsz figé = taille).
 * Doit rester synchronisé avec apps/mobile/scripts/fonts/build-fonts.py (test d'app).
 */
export const opticalSizes = {
  display: [13, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 29, 30, 32, 34, 36, 38, 40, 44, 46, 48, 50, 52, 54, 56, 64, 96],
  strong: [13, 14, 15, 16, 17, 18, 19, 24, 40],
} as const;

/** Graisses Inter chargées par les maquettes (Google Fonts 400;500;600;700) : 800 est rendu en 700. */
export const bodyWeights = [400, 500, 600, 700] as const;

export const type = {
  displayXL: { family: font.display, size: 48, weight: '800', letterSpacing: -1.44, lineHeight: 45.6 },
  displayL: { family: font.display, size: 36, weight: '800', letterSpacing: -1.08, lineHeight: 34.2 },
  displayM: { family: font.display, size: 24, weight: '800', letterSpacing: -0.72, lineHeight: 22.8 },
  button: { family: font.display, size: 18, weight: '800', letterSpacing: 0.18, lineHeight: 22 },
  body: { family: font.body, size: 14, weight: '600', letterSpacing: 0, lineHeight: 20 },
  small: { family: font.body, size: 12, weight: '600', letterSpacing: 0, lineHeight: 16 },
  label: { family: font.body, size: 11, weight: '700', letterSpacing: 1.54, lineHeight: 14 },
} as const;

/** Styles de texte nommés relevés (taille px, graisse, interlettrage en em). */
export const textSpec = {
  lbl: { size: 11, weight: 700, letterSpacingEm: 0.14, uppercase: true }, // `.lbl` (800 → rendu 700)
  tagline: { size: 11, weight: 700, letterSpacingEm: 0.12, uppercase: true }, // « pets & potes »
  chip: { size: 12, weight: 700, letterSpacingEm: 0 }, // `.chip` Welcome/Craft
  chipSmall: { size: 11, weight: 700, letterSpacingEm: 0 }, // `.chip` majoritaire (5px 10px, 800 → 700)
  cap: { size: 13, weight: 600, letterSpacingEm: 0 }, // `.cap`
  button: { size: 18, weight: 800, letterSpacingEm: 0.01, uppercase: true }, // `.btn` (Bricolage largeur 100)
  link: { size: 13, weight: 700, letterSpacingEm: 0.01 }, // `.bl` (hérite letter-spacing de `.btn`)
  ghost: { size: 14, weight: 700, letterSpacingEm: 0 }, // `.ghost`
  nav: { size: 9.5, weight: 700, letterSpacingEm: 0.05, uppercase: true }, // `.gnav a`
  badge: { size: 9, weight: 700, letterSpacingEm: 0 }, // `.gnav .bdg`
  plus: { size: 8, weight: 700, letterSpacingEm: 0.04 }, // `.gnav .pls`
  body: { size: 14, weight: 600, letterSpacingEm: 0 },
  row: { size: 14, weight: 700, letterSpacingEm: 0 }, // `.row`
} as const;

/** Halos flous `.blob` : `position:absolute;border-radius:50%;filter:blur(70px)` (60/80 selon écran). */
export const blob = { blur: 70, blurTight: 60, blurWide: 80 } as const;

export const touch = { minTarget: 44 } as const;
export const motion = { pop: 650, reaction: 3000 } as const;

/** Courbes cubic-bezier relevées. */
export const easing = {
  pop: [0.2, 1.2, 0.3, 1], // `.pop`, `.sheet`, `.msg`, `.rise`
  spring: [0.2, 1.4, 0.4, 1], // `.bounce`, `.chk`, `.ok`, `.bubble`
  slam: [0.2, 1.3, 0.3, 1], // `.slam`, `.num`, `.hatch`, `.swap`, `.menu`
  squash: [0.3, 0, 0.2, 1], // `.sq`, `.jump`
  grow: [0.2, 0.8, 0.2, 1], // jauges `.g i`
  ease: [0.25, 0.1, 0.25, 1], // `ease` (pulse sans courbe explicite)
  easeInOut: [0.42, 0, 0.58, 1],
  easeOut: [0, 0, 0.58, 1],
  linear: [0, 0, 1, 1],
} as const;
export type EasingName = keyof typeof easing;

/**
 * Image clé : `at` ∈ [0,1] et propriétés COMPLÈTES (une transformation CSS omise vaut l'identité).
 * ty/tx en px, s/sx/sy facteurs, r en degrés, o opacité, spread/a pour l'anneau de `pulse`.
 */
export interface KeyframeStop {
  at: number;
  tx?: number;
  ty?: number;
  s?: number;
  sx?: number;
  sy?: number;
  r?: number;
  o?: number;
  spread?: number;
  a?: number;
}
export interface KeyframeSpec {
  durationMs: number;
  easing: EasingName;
  stops: readonly KeyframeStop[];
  /** `infinite` en CSS. */
  loop: boolean;
  /** `transform-origin` (fractions de la boîte). */
  origin?: readonly [number, number];
}

/** Animations des maquettes (durées et courbes exactes, Welcome/Craft/Chat/Match). */
export const keyframes = {
  /** `.pop{animation:pop .65s cubic-bezier(.2,1.2,.3,1) both}` (0,45–0,65 s selon écran ; Welcome : 0,65 s). */
  pop: {
    durationMs: 650,
    easing: 'pop',
    loop: false,
    stops: [
      { at: 0, ty: 18, s: 0.94, o: 0 },
      { at: 0.6, ty: -3, s: 1.02, o: 1 },
      { at: 1, ty: 0, s: 1, o: 1 },
    ],
  },
  /** `.sq{animation:sq 2.4s cubic-bezier(.3,0,.2,1) infinite;transform-origin:50% 100%}`. */
  sq: {
    durationMs: 2400,
    easing: 'squash',
    loop: true,
    origin: [0.5, 1],
    stops: [
      { at: 0, ty: 0, sx: 1, sy: 1 },
      { at: 0.3, ty: -12, sx: 0.96, sy: 1.05 },
      { at: 0.52, ty: 0, sx: 1.05, sy: 0.95 },
      { at: 0.7, ty: -3, sx: 1, sy: 1 },
      { at: 1, ty: 0, sx: 1, sy: 1 },
    ],
  },
  /** `.dr1{animation:drift 10s ease-in-out infinite}` ; `.dr2` : 12 s, délai −5 s, `reverse`. */
  drift: {
    durationMs: 10000,
    easing: 'easeInOut',
    loop: true,
    stops: [
      { at: 0, tx: 0, ty: 0, s: 1 },
      { at: 0.5, tx: 24, ty: -30, s: 1.15 },
      { at: 1, tx: 0, ty: 0, s: 1 },
    ],
  },
  /** `.pulse{animation:pulse 1.8s infinite}` : anneau `box-shadow:0 0 0 <spread> rgba(...)`. */
  pulse: {
    durationMs: 1800,
    easing: 'ease',
    loop: true,
    stops: [
      { at: 0, spread: 0, a: 1 },
      { at: 0.7, spread: 7, a: 0 },
      { at: 1, spread: 0, a: 1 },
    ],
  },
  /** `.orb{animation:orbit 24s linear infinite}` ; `.cnt` = même animation en `reverse`. */
  orbit: {
    durationMs: 24000,
    easing: 'linear',
    loop: true,
    stops: [
      { at: 0, r: 0 },
      { at: 1, r: 360 },
    ],
  },
  /** `.peek{animation:peek 2.2s ease-in-out infinite}` (V4-Chat). */
  peek: {
    durationMs: 2200,
    easing: 'easeInOut',
    loop: true,
    stops: [
      { at: 0, ty: 0, r: -5 },
      { at: 0.5, ty: -6, r: 5 },
      { at: 1, ty: 0, r: -5 },
    ],
  },
  /** `.beat{animation:beat 1.4s ease-in-out infinite}` (V4-Match). */
  beat: {
    durationMs: 1400,
    easing: 'easeInOut',
    loop: true,
    stops: [
      { at: 0, s: 1 },
      { at: 0.2, s: 1.2 },
      { at: 0.4, s: 1 },
      { at: 1, s: 1 },
    ],
  },
  /** `.bounce{animation:bounce .55s cubic-bezier(.2,1.4,.4,1) both}`. */
  bounce: {
    durationMs: 550,
    easing: 'spring',
    loop: false,
    stops: [
      { at: 0, s: 0.5, o: 0 },
      { at: 0.6, s: 1.12, o: 1 },
      { at: 1, s: 1, o: 1 },
    ],
  },
  /** `.wob{animation:wob 2.2s ease-in-out infinite;transform-origin:50% 90%}` (V3). */
  wob: {
    durationMs: 2200,
    easing: 'easeInOut',
    loop: true,
    origin: [0.5, 0.9],
    stops: [
      { at: 0, r: 0 },
      { at: 0.15, r: -8 },
      { at: 0.3, r: 7 },
      { at: 0.45, r: -3 },
      { at: 0.6, r: 0 },
      { at: 1, r: 0 },
    ],
  },
  /** `.bob{animation:bob 2s ease-in-out infinite}`. */
  bob: {
    durationMs: 2000,
    easing: 'easeInOut',
    loop: true,
    stops: [
      { at: 0, ty: 0 },
      { at: 0.5, ty: -5 },
      { at: 1, ty: 0 },
    ],
  },
} as const satisfies Record<string, KeyframeSpec>;
export type KeyframeName = keyof typeof keyframes;

/** Chrome UI translucide (barre d'onglets) avec repli opaque accessible. */
export const glass = { tint: 'rgba(255,247,236,0.72)', opaqueFallback: color.cream } as const;

export * from './contrast.js';
export * from './v5.js';
