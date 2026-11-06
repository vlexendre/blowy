/**
 * Jetons V5.3 (« Ton pet te trouve une bande ») relevés valeur par valeur dans
 * design/v5/project/*.dc.html (CSS commun + styles en ligne). Le langage visuel reste celui de la
 * V4 ; la V5 fonce les accents pour l'AA (bouton #D93A1C, texte corail #C4341B, rose #C2185B,
 * gris #6F6458 / #5A5047, vert #1E7A47) et ajoute des teintes de fond.
 *
 * Règle : aucune couleur en dur dans ui-mobile ni apps/mobile ; une valeur de maquette absente
 * d'ici s'ajoute ici (nom = rôle, commentaire = où elle sert).
 */
export const v5 = {
  // Fonds et encres
  cream: '#FFF7EC',
  ink: '#16110D',
  white: '#FFFFFF',
  black: '#000000',
  inkSoft: '#5A5047', // texte secondaire (AA 7,0:1 sur crème)
  grey: '#6F6458', // `.lbl`, `.val`, horodatages
  greyWarm: '#8C7B66', // pointillés « à découvrir », interrupteur OFF
  greyLight: '#B9A88F', // pastilles inactives
  navInk: '#4E453C', // onglet inactif `.gnav a`
  mist: '#E3D9CF', // texte secondaire sur fond encre
  // Lignes et ombres crème
  line: '#F4EADC', // `.row` border-top
  shadowCream: '#EEDFCB', // `.card`, `.back`, `.grp`
  shadowCreamAlt: '#E8D9C4', // `.b3`
  disabledBg: '#E9DFD1', // `.bdis`
  sand: '#F2E6D6', // puces neutres, squelette
  sandLight: '#FBF3E8', // reflet du squelette
  sandDeep: '#EDE6DE', // pastilles et pistes
  beige: '#E3D3BE',
  beigeLine: '#EADBC4',
  // Accents
  coralBtn: '#D93A1C', // `.b1`
  coralBtnShadow: '#9E2510',
  coralText: '#C4341B', // texte corail AA
  coralDeepShadow: '#8E1B10', // ombre des cartes sur dégradé corail
  coralBright: '#FF5A3C', // point du logo
  coralPale: '#FFE3D9',
  rose: '#C2185B', // compteurs, duo
  roseDeep: '#8E1240',
  rosePale: '#FDE6EE',
  roseLight: '#FFE3EC',
  roseSoft: '#FFB3C7',
  pinkWarm: '#FF7AA2', // dégradé Trouvée
  orange: '#FF8A5A',
  orangeDeep: '#FF8A3C',
  apricot: '#FFC163',
  apricotSoft: '#FFAE5C',
  peach: '#FFE1C2', // fond de vignette « Tom »
  peachLight: '#FFF1D6',
  peachMid: '#FFD9A8',
  peachSoft: '#FFC48A',
  mango: '#FFB347',
  sun: '#FFE36E',
  sunLight: '#FFE08A',
  lime: '#C8F542',
  limeShadow: '#7DA11A',
  limeDark: '#3F5A0B', // texte sur lime pâle
  limePale: '#F1FBD9',
  limeSoft: '#E8FBB0',
  limeLight: '#E8F9C8',
  green: '#1E7A47', // succès texte AA
  greenPale: '#DDF5EA',
  switchOn: '#3F7A0B',
  danger: '#D92D2D',
  dangerDeep: '#9B1C1C',
  dangerDeeper: '#8F1B1B',
  dangerPale: '#FDE6E6',
  dangerLine: '#F0C9C9',
  violet: '#7C3AED',
  violetDeep: '#4C1D95',
  violetDark: '#2E1065',
  violetMid: '#6D28D9',
  violetPale: '#EEE6FF',
  violetPaler: '#EDE6FF',
  violetLight: '#EDE4FF',
  violetMist: '#E3DBFF',
  lilac: '#E6D3F7',
  plum: '#3B1F5C',
  plumDark: '#2A1B3D',
  night: '#1A0838',
  cyanLight: '#DDF8FC',
  sky: '#BFE8F7',
  skySoft: '#9FE3F5',
  mossLight: '#CFE9B8',
  moss: '#B9DE9C',
  oceanDeep: '#0E4C6E',
  ocean: '#1C7DB0',
  rust: '#C4651B',
  rustDeep: '#B5651D',
  rustDark: '#B3541C',
  amber: '#A65A0B',
  slate: '#3C3C43', // feuille Apple Pay (gris système)
  systemGrey: '#E5E5EA',
  systemBg: '#F2F2F7',
  steel: '#8FB9C9',
  // Portraits illustrés neutres (peaux, cheveux, fonds) — jamais de vraie personne
  skin1: '#F2C9A8',
  skin2: '#E9B48F',
  skin3: '#D8A27C',
  skin4: '#C99470',
  skin5: '#8D5B3E',
  skin6: '#F0CDB0',
  hair1: '#5B3A29',
  hair2: '#2E2018',
  hair3: '#3B2416',
  hair4: '#1E1612',
  hair5: '#6E5133',
  portraitRose1: '#F3C7B2',
  portraitRose2: '#B9705F',
  portraitLilac2: '#7B58B8',
  portraitBlue1: '#B9D3F0',
  portraitBlue2: '#5E77B0',
  portraitSand1: '#C9B38F',
  portraitPeach1: '#F2C9A0',
  portraitPeach2: '#A0663A',
  portraitRed1: '#F7D2C4',
  portraitRed2: '#B86A58',
  wood: '#3A3029',
} as const;
export type V5Color = keyof typeof v5;

/** Couleurs translucides relevées (rgba exacts). */
export const v5Alpha = {
  white08: 'rgba(255,255,255,0.08)',
  white12: 'rgba(255,255,255,0.12)',
  white14: 'rgba(255,255,255,0.14)',
  white16: 'rgba(255,255,255,0.16)',
  white18: 'rgba(255,255,255,0.18)',
  white20: 'rgba(255,255,255,0.2)',
  white25: 'rgba(255,255,255,0.25)',
  white45: 'rgba(255,255,255,0.45)',
  white60: 'rgba(255,255,255,0.6)',
  white75: 'rgba(255,255,255,0.75)',
  white80: 'rgba(255,255,255,0.8)',
  white85: 'rgba(255,255,255,0.85)',
  white90: 'rgba(255,255,255,0.9)',
  white92: 'rgba(255,255,255,0.92)',
  white95: 'rgba(255,255,255,0.95)',
  ink08: 'rgba(22,17,13,0.08)',
  ink10: 'rgba(22,17,13,0.1)',
  ink18: 'rgba(22,17,13,0.18)',
  ink24: 'rgba(22,17,13,0.24)',
  ink25: 'rgba(22,17,13,0.25)',
  ink28: 'rgba(22,17,13,0.28)',
  ink30: 'rgba(22,17,13,0.3)',
  ink45: 'rgba(22,17,13,0.45)',
  ink80: 'rgba(22,17,13,0.8)',
  ink82: 'rgba(22,17,13,0.82)',
  black07: 'rgba(0,0,0,0.07)',
  black08: 'rgba(0,0,0,0.08)',
  black15: 'rgba(0,0,0,0.15)',
  black22: 'rgba(0,0,0,0.22)',
  black35: 'rgba(0,0,0,0.35)',
  black40: 'rgba(0,0,0,0.4)',
  black45: 'rgba(0,0,0,0.45)',
  tabOnTop: 'rgba(214,250,110,0.95)',
  tabOnBottom: 'rgba(200,245,66,0.85)',
} as const;

/** Dégradés de fond (CSS `linear-gradient`, accepté tel quel par RN ≥ 0.80 `backgroundImage` et le web). */
export const v5Gradient = {
  found: `linear-gradient(170deg, ${v5.pinkWarm} 0%, ${v5.orange} 55%, ${v5.apricot} 120%)`,
  sunset: `linear-gradient(175deg, ${v5.sunLight} 0%, ${v5.apricot} 60%, ${v5.apricotSoft} 120%)`,
  peach: `linear-gradient(170deg, ${v5.peachLight}, ${v5.peachMid} 90%)`,
  mango: `linear-gradient(170deg, ${v5.mango}, ${v5.orange})`,
  night: `linear-gradient(175deg, ${v5.ink} 0%, ${v5.plumDark} 60%, ${v5.plum} 100%)`,
  plum: `linear-gradient(170deg, ${v5.plum}, ${v5.ink} 85%)`,
  forest: `linear-gradient(170deg, ${v5.green}, ${v5.limeDark} 80%)`,
  inkRose: `linear-gradient(170deg, ${v5.ink}, ${v5.violetDeep} 60%, ${v5.rose})`,
  inkViolet: `linear-gradient(170deg, ${v5.ink}, ${v5.violetDark} 60%, ${v5.violetDeep})`,
  ocean: `linear-gradient(170deg, ${v5.oceanDeep}, ${v5.ocean} 80%)`,
  roseCoral: `linear-gradient(170deg, ${v5.rose}, ${v5.coralText} 60%, ${v5.orangeDeep})`,
  violet: `linear-gradient(160deg, ${v5.violetDeep}, ${v5.violetMid})`,
  violetCard: `linear-gradient(135deg, ${v5.violetDark}, ${v5.violetDeep} 70%)`,
  bubbleMe: `linear-gradient(135deg, ${v5.rose}, ${v5.coralText})`,
  street: `linear-gradient(180deg, ${v5.sky} 0%, ${v5.greenPale} 62%, ${v5.mossLight} 62%, ${v5.moss} 100%)`,
  plumInk: `linear-gradient(160deg, ${v5.plumDark}, ${v5.ink})`,
  tabOn: 'linear-gradient(180deg, rgba(214,250,110,0.95), rgba(200,245,66,0.85))',
  glassNav: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.8))',
  skeleton: `linear-gradient(90deg, ${v5.sand} 0, ${v5.sandLight} 60px, ${v5.sand} 120px)`,
} as const;
export type V5Gradient = keyof typeof v5Gradient;

/** Portraits illustrés neutres (fond dégradé 160°, peau, cheveux) — maquettes Les visages / Lien / Profil. */
export const v5Portraits = {
  lea: { from: v5.portraitRose1, to: v5.portraitRose2, skin: v5.skin2, hair: v5.hair2, hairStyle: 'longer' },
  malo: { from: v5.portraitSand1, to: v5.hair5, skin: v5.skin4, hair: v5.hair4, hairStyle: 'curly' },
  sarah: { from: v5.portraitBlue1, to: v5.portraitBlue2, skin: v5.skin5, hair: v5.ink, hairStyle: 'bun' },
  tom: { from: v5.portraitPeach1, to: v5.portraitPeach2, skin: v5.skin6, hair: v5.rustDeep, hairStyle: 'bob' },
  jade: { from: v5.portraitRed1, to: v5.portraitRed2, skin: v5.skin3, hair: v5.hair3, hairStyle: 'long' },
  /** « ta photo ici » (Vérif, Profil, Les visages côté soi). */
  alex: { from: v5.lilac, to: v5.portraitLilac2, skin: v5.skin1, hair: v5.hair1, hairStyle: 'bob' },
} as const;
export type V5PortraitKey = keyof typeof v5Portraits;
