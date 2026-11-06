/**
 * Registre PUR des pictogrammes V5 : chaque tracé est recopié des SVG en ligne des maquettes
 * (design/v5/project, 37 formes distinctes inventoriées). `c` = couleur principale, `c2` =
 * couleur secondaire (détail intérieur), `w` = épaisseur de trait par défaut de la maquette.
 * Aucune dépendance React Native : testable sous Node.
 */
export type GlyphShape =
  | {
      k: 'path';
      d: string;
      stroke?: 'c' | 'c2';
      fill?: 'c' | 'c2';
      w?: number;
      cap?: 'round';
      join?: 'round';
    }
  | {
      k: 'circle';
      cx: number;
      cy: number;
      r: number;
      stroke?: 'c' | 'c2';
      fill?: 'c' | 'c2';
      w?: number;
    }
  | {
      k: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx: number;
      stroke?: 'c' | 'c2';
      fill?: 'c' | 'c2';
      w?: number;
    };

export interface GlyphDef {
  viewBox: number;
  shapes: readonly GlyphShape[];
}

const line = (d: string, w: number, join = true): GlyphShape => ({
  k: 'path',
  d,
  stroke: 'c',
  w,
  cap: 'round',
  ...(join ? { join: 'round' as const } : {}),
});

export const GLYPHS = {
  /** Coche `0 0 16 16`, trait 2,6 (puces « vérifié », listes). */
  check: { viewBox: 16, shapes: [line('M3 8.5l3.2 3L13 4.5', 2.6)] },
  /** Chevron de retour `.back` `0 0 20 20`. */
  back: { viewBox: 20, shapes: [line('M12 4l-6 6 6 6', 2.6)] },
  /** Chevron de ligne (›), trait 3. */
  chevron: { viewBox: 24, shapes: [line('M9 6l6 6-6 6', 3)] },
  /** Flèche des boutons, trait 2,8. */
  arrow: { viewBox: 24, shapes: [line('M5 12h14M13 6l6 6-6 6', 2.8)] },
  /** Cadenas « secret » (corps plein + anse + trou en c2). */
  lock: {
    viewBox: 24,
    shapes: [
      { k: 'rect', x: 5, y: 10, width: 14, height: 10, rx: 3, fill: 'c' },
      { k: 'path', d: 'M8 10V8a4 4 0 0 1 8 0v2', stroke: 'c', w: 2.2 },
      { k: 'circle', cx: 12, cy: 15, r: 1.6, fill: 'c2' },
    ],
  },
  chat: {
    viewBox: 24,
    shapes: [{ k: 'path', d: 'M4 5h16v11H9l-5 4z', stroke: 'c', w: 2.2, join: 'round' }],
  },
  chatFilled: {
    viewBox: 24,
    shapes: [{ k: 'path', d: 'M4 5h16v11H9l-5 4z', stroke: 'c', fill: 'c', w: 2.2, join: 'round' }],
  },
  chatSolid: { viewBox: 24, shapes: [{ k: 'path', d: 'M4 5h16v11H9l-5 4z', fill: 'c' }] },
  home: {
    viewBox: 24,
    shapes: [{ k: 'path', d: 'M4 11l8-7 8 7v9H4z', stroke: 'c', w: 2.2, join: 'round' }],
  },
  homeFilled: {
    viewBox: 24,
    shapes: [{ k: 'path', d: 'M4 11l8-7 8 7v9H4z', stroke: 'c', fill: 'c', w: 2.2, join: 'round' }],
  },
  band: {
    viewBox: 24,
    shapes: [
      { k: 'circle', cx: 8, cy: 9, r: 3.2, stroke: 'c', w: 2.2 },
      { k: 'circle', cx: 16.5, cy: 9, r: 3.2, stroke: 'c', w: 2.2 },
      {
        k: 'path',
        d: 'M2.5 20c.6-3.4 3-5.2 5.5-5.2s4.9 1.8 5.5 5.2M12 16c1-.8 2.5-1.2 4.5-1.2 2.5 0 4.9 1.8 5.5 5.2',
        stroke: 'c',
        w: 2.2,
        cap: 'round',
      },
    ],
  },
  bandFilled: {
    viewBox: 24,
    shapes: [
      { k: 'circle', cx: 8, cy: 9, r: 3.2, stroke: 'c', fill: 'c', w: 2.2 },
      { k: 'circle', cx: 16.5, cy: 9, r: 3.2, stroke: 'c', fill: 'c', w: 2.2 },
      {
        k: 'path',
        d: 'M2.5 20c.6-3.4 3-5.2 5.5-5.2s4.9 1.8 5.5 5.2M12 16c1-.8 2.5-1.2 4.5-1.2 2.5 0 4.9 1.8 5.5 5.2',
        stroke: 'c',
        w: 2.2,
        cap: 'round',
      },
    ],
  },
  profile: {
    viewBox: 24,
    shapes: [
      { k: 'circle', cx: 12, cy: 8, r: 4, stroke: 'c', w: 2.2 },
      { k: 'path', d: 'M4 21c1-4 4.5-6 8-6s7 2 8 6', stroke: 'c', w: 2.2, cap: 'round' },
    ],
  },
  profileFilled: {
    viewBox: 24,
    shapes: [
      { k: 'circle', cx: 12, cy: 8, r: 4, stroke: 'c', fill: 'c', w: 2.2 },
      { k: 'path', d: 'M4 21c1-4 4.5-6 8-6s7 2 8 6', stroke: 'c', fill: 'c', w: 2.2, cap: 'round' },
    ],
  },
  /** Drapeau « Signaler » (hampe + fanion plein). */
  flag: {
    viewBox: 24,
    shapes: [
      { k: 'path', d: 'M5 21V3', stroke: 'c', w: 2.4, cap: 'round' },
      { k: 'path', d: 'M5 4h13l-3.5 4.5L18 13H5z', fill: 'c' },
    ],
  },
  link: {
    viewBox: 24,
    shapes: [
      {
        k: 'path',
        d: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
        stroke: 'c',
        w: 2.2,
        cap: 'round',
      },
    ],
  },
  pin: {
    viewBox: 24,
    shapes: [
      { k: 'path', d: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', fill: 'c' },
      { k: 'circle', cx: 12, cy: 9.5, r: 2.6, fill: 'c2' },
    ],
  },
  dots: {
    viewBox: 24,
    shapes: [
      { k: 'circle', cx: 5, cy: 12, r: 2.2, fill: 'c' },
      { k: 'circle', cx: 12, cy: 12, r: 2.2, fill: 'c' },
      { k: 'circle', cx: 19, cy: 12, r: 2.2, fill: 'c' },
    ],
  },
  share: { viewBox: 24, shapes: [line('M12 15V3M7 8l5-5 5 5M5 13v7h14v-7', 2.4)] },
  phoneStory: {
    viewBox: 24,
    shapes: [
      { k: 'rect', x: 6, y: 2.5, width: 12, height: 19, rx: 3, stroke: 'c', w: 2.2 },
      { k: 'circle', cx: 12, cy: 12, r: 3, stroke: 'c', w: 2.2 },
    ],
  },
  download: { viewBox: 24, shapes: [line('M12 3v12M7 10l5 5 5-5M5 20h14', 2.2)] },
  calendar: {
    viewBox: 24,
    shapes: [
      { k: 'rect', x: 3.5, y: 5, width: 17, height: 15, rx: 3, stroke: 'c', w: 2.2 },
      { k: 'path', d: 'M3.5 10h17M8 3v4M16 3v4', stroke: 'c', w: 2.2, cap: 'round' },
    ],
  },
  pause: {
    viewBox: 24,
    shapes: [
      { k: 'rect', x: 6, y: 5, width: 4, height: 14, rx: 1.5, fill: 'c' },
      { k: 'rect', x: 14, y: 5, width: 4, height: 14, rx: 1.5, fill: 'c' },
    ],
  },
  shield: {
    viewBox: 24,
    shapes: [{ k: 'path', d: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z', fill: 'c' }],
  },
  send: { viewBox: 24, shapes: [{ k: 'path', d: 'M4 12l16-8-6 16-2-7z', fill: 'c' }] },
  plus: {
    viewBox: 24,
    shapes: [{ k: 'path', d: 'M12 5v14M5 12h14', stroke: 'c', w: 3, cap: 'round' }],
  },
  clock: {
    viewBox: 24,
    shapes: [
      { k: 'circle', cx: 12, cy: 12, r: 9, stroke: 'c', w: 2.4 },
      { k: 'path', d: 'M12 7v5l3 2', stroke: 'c', w: 2.4, cap: 'round' },
    ],
  },
  close: {
    viewBox: 10,
    shapes: [{ k: 'path', d: 'M2 2l6 6M8 2l-6 6', stroke: 'c', w: 2, cap: 'round' }],
  },
  gear: {
    viewBox: 24,
    shapes: [
      { k: 'path', d: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z', stroke: 'c', w: 2.2 },
      {
        k: 'path',
        d: 'M10.3 3h3.4l.5 2.4 1.8 1 2.3-.8 1.7 2.9-1.8 1.6v2l1.8 1.6-1.7 2.9-2.3-.8-1.8 1-.5 2.4h-3.4l-.5-2.4-1.8-1-2.3.8-1.7-2.9 1.8-1.6v-2L3.9 8.5l1.7-2.9 2.3.8 1.8-1z',
        stroke: 'c',
        w: 2,
        join: 'round',
      },
    ],
  },
  wifiOff: {
    viewBox: 24,
    shapes: [
      {
        k: 'path',
        d: 'M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0',
        stroke: 'c',
        w: 2.2,
        cap: 'round',
      },
      { k: 'circle', cx: 12, cy: 19, r: 1.6, fill: 'c' },
      { k: 'path', d: 'M3 3l18 18', stroke: 'c2', w: 2.4, cap: 'round' },
    ],
  },
  phone: {
    viewBox: 24,
    shapes: [
      {
        k: 'path',
        d: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
        fill: 'c',
      },
    ],
  },
  pencil: {
    viewBox: 24,
    shapes: [{ k: 'path', d: 'M4 20h4L19 9l-4-4L4 16z', stroke: 'c', w: 2.2, join: 'round' }],
  },
  play: { viewBox: 24, shapes: [{ k: 'path', d: 'M7 4l13 8-13 8z', fill: 'c' }] },
  warning: {
    viewBox: 24,
    shapes: [
      { k: 'path', d: 'M12 3l10 18H2z', fill: 'c' },
      { k: 'path', d: 'M12 10v5M12 18h.01', stroke: 'c2', w: 2.4, cap: 'round' },
    ],
  },
} as const satisfies Record<string, GlyphDef>;

export type GlyphName = keyof typeof GLYPHS;
export const GLYPH_NAMES = Object.keys(GLYPHS) as GlyphName[];
