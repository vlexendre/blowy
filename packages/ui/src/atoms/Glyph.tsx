import type { ReactElement } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useInk } from '../lib/ink';

/** Pictogrammes d'interface dessinés en vues (aucune dépendance SVG). */
export const GLYPHS = [
  'back',
  'chevron',
  'down',
  'plus',
  'close',
  'check',
  'send',
  'arrow',
  'lock',
  'heart',
  'chat',
  'person',
  'people',
  'play',
  'share',
  'camera',
  'dot',
] as const;
export type GlyphName = (typeof GLYPHS)[number];

export interface GlyphProps {
  name: GlyphName;
  /** Côté de la boîte, en points. Défaut 20. */
  size?: number;
  color?: string;
  /** Version pleine (onglet actif) pour chat / person / people. */
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Glyph({ name, size = 20, color, filled = false, style }: GlyphProps) {
  const ink = useInk();
  const c = color ?? ink;
  const sw = Math.max(2, Math.round(size * 0.12));
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size }, styles.box, style]}>
      {draw(name, size, c, sw, filled)}
    </View>
  );
}

function chevron(s: number, c: string, sw: number, dir: 'left' | 'right' | 'down' | 'up'): ReactElement {
  const a = s * 0.42;
  const nudge = s * 0.1;
  const spec: Record<typeof dir, { borders: ViewStyle; transform: ViewStyle['transform'] }> = {
    left: { borders: { borderLeftWidth: sw, borderBottomWidth: sw }, transform: [{ translateX: nudge }, { rotate: '45deg' }] },
    right: { borders: { borderTopWidth: sw, borderRightWidth: sw }, transform: [{ translateX: -nudge }, { rotate: '45deg' }] },
    down: { borders: { borderLeftWidth: sw, borderBottomWidth: sw }, transform: [{ translateY: -nudge }, { rotate: '-45deg' }] },
    up: { borders: { borderLeftWidth: sw, borderTopWidth: sw }, transform: [{ translateY: nudge }, { rotate: '45deg' }] },
  };
  const { borders, transform } = spec[dir];
  return <View style={[{ width: a, height: a, borderColor: c, borderRadius: sw / 3, transform }, borders]} />;
}

function bar(w: number, h: number, c: string, rotate = '0deg'): ViewStyle {
  return { position: 'absolute', width: w, height: h, borderRadius: h / 2, backgroundColor: c, transform: [{ rotate }] };
}

function triangle(w: number, h: number, c: string, rotate: string): ReactElement {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: w / 2,
        borderRightWidth: w / 2,
        borderBottomWidth: h,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: c,
        transform: [{ rotate }],
      }}
    />
  );
}

function heart(s: number, c: string): ReactElement {
  const w = s * 0.52;
  const h = s * 0.8;
  const lobe: ViewStyle = { position: 'absolute', top: 0, width: w, height: h, backgroundColor: c, borderTopLeftRadius: w, borderTopRightRadius: w };
  return (
    <View style={{ width: s, height: s * 0.9, marginTop: s * 0.1 }}>
      <View style={[lobe, { left: s * 0.5, transform: [{ rotate: '-45deg' }], transformOrigin: '0% 100%' }]} />
      <View style={[lobe, { left: s * 0.5 - w, transform: [{ rotate: '45deg' }], transformOrigin: '100% 100%' }]} />
    </View>
  );
}

function person(s: number, c: string, sw: number, filled: boolean, scale = 1): ReactElement {
  const head = s * 0.36 * scale;
  const bodyW = s * 0.74 * scale;
  const bodyH = s * 0.32 * scale;
  return (
    <View style={styles.center}>
      <View style={{ width: head, height: head, borderRadius: head, borderWidth: sw, borderColor: c, backgroundColor: filled ? c : 'transparent' }} />
      <View
        style={{
          marginTop: s * 0.06 * scale,
          width: bodyW,
          height: bodyH,
          borderTopLeftRadius: bodyW,
          borderTopRightRadius: bodyW,
          borderWidth: sw,
          borderBottomWidth: 0,
          borderColor: c,
          backgroundColor: filled ? c : 'transparent',
        }}
      />
    </View>
  );
}

function draw(name: GlyphName, s: number, c: string, sw: number, filled: boolean): ReactElement {
  switch (name) {
    case 'back':
      return chevron(s, c, sw, 'left');
    case 'chevron':
      return chevron(s, c, sw, 'right');
    case 'down':
      return chevron(s, c, sw, 'down');
    case 'plus':
      return (
        <>
          <View style={bar(s * 0.7, sw, c)} />
          <View style={bar(sw, s * 0.7, c)} />
        </>
      );
    case 'close':
      return (
        <>
          <View style={bar(s * 0.72, sw, c, '45deg')} />
          <View style={bar(s * 0.72, sw, c, '-45deg')} />
        </>
      );
    case 'check':
      return (
        <View
          style={{
            width: s * 0.3,
            height: s * 0.56,
            borderRightWidth: sw,
            borderBottomWidth: sw,
            borderColor: c,
            transform: [{ translateY: -s * 0.06 }, { rotate: '45deg' }],
          }}
        />
      );
    case 'send':
      return (
        <View style={{ transform: [{ rotate: '45deg' }, { translateY: s * 0.04 }] }}>
          {triangle(s * 0.62, s * 0.74, c, '0deg')}
        </View>
      );
    case 'arrow':
      return (
        <>
          <View style={bar(s * 0.7, sw, c)} />
          <View style={{ position: 'absolute', right: s * 0.12 }}>{chevron(s * 0.9, c, sw, 'right')}</View>
        </>
      );
    case 'lock':
      return (
        <View style={styles.center}>
          <View style={{ width: s * 0.42, height: s * 0.36, borderWidth: sw, borderBottomWidth: 0, borderColor: c, borderTopLeftRadius: s, borderTopRightRadius: s }} />
          <View style={{ width: s * 0.66, height: s * 0.46, borderRadius: s * 0.1, backgroundColor: c }} />
        </View>
      );
    case 'heart':
      return heart(s, c);
    case 'chat':
      return (
        <View style={{ width: s * 0.86, height: s * 0.8 }}>
          <View style={{ width: s * 0.86, height: s * 0.62, borderRadius: s * 0.16, borderWidth: sw, borderColor: c, backgroundColor: filled ? c : 'transparent' }} />
          <View style={{ position: 'absolute', left: s * 0.12, top: s * 0.5 }}>{triangle(s * 0.28, s * 0.28, c, '180deg')}</View>
        </View>
      );
    case 'person':
      return person(s, c, sw, filled);
    case 'people':
      return (
        <View style={styles.row}>
          {person(s, c, sw, filled, 0.62)}
          <View style={{ marginLeft: s * 0.02 }}>{person(s, c, sw, filled, 0.62)}</View>
        </View>
      );
    case 'play':
      return <View style={{ marginLeft: s * 0.1 }}>{triangle(s * 0.66, s * 0.6, c, '90deg')}</View>;
    case 'share':
      return (
        <View style={[styles.center, { width: s, height: s }]}>
          <View style={{ position: 'absolute', bottom: s * 0.08, width: s * 0.72, height: s * 0.4, borderWidth: sw, borderTopWidth: 0, borderColor: c, borderBottomLeftRadius: s * 0.12, borderBottomRightRadius: s * 0.12 }} />
          <View style={[bar(sw, s * 0.6, c), { top: s * 0.08 }]} />
          <View style={{ position: 'absolute', top: s * 0.08 }}>{chevron(s * 0.7, c, sw, 'up')}</View>
        </View>
      );
    case 'camera':
      return (
        <View style={[styles.center, { width: s * 0.9, height: s * 0.66, borderRadius: s * 0.16, borderWidth: sw, borderColor: c }]}>
          <View style={{ width: s * 0.3, height: s * 0.3, borderRadius: s, borderWidth: sw, borderColor: c }} />
        </View>
      );
    case 'dot':
      return <View style={{ width: s * 0.45, height: s * 0.45, borderRadius: s, backgroundColor: c }} />;
  }
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
});
