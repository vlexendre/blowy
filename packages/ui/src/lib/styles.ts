import { StyleSheet } from 'react-native';

import { radius, size, space, veil } from '../theme';

/** Styles de mise en page partagés par les composants (évite de dupliquer les mêmes objets). */
export const layout = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 },
  shrink: { flexShrink: 1, minWidth: 0 },
  grow: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  absoluteFill: StyleSheet.absoluteFill,
  gapXs: { gap: space.xs },
  gapSm: { gap: space.sm },
  gapMd: { gap: space.md },
  gapLg: { gap: space.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});

export const surface = StyleSheet.create({
  pill: { borderRadius: radius.pill },
  glass: { backgroundColor: veil.glass },
  round: { width: size.touch, height: size.touch, borderRadius: size.touch / 2, alignItems: 'center', justifyContent: 'center' },
});

/** Zone de toucher étendue pour atteindre 44 pt quand le visuel est plus petit. */
export function hitSlopFor(visual: number): { top: number; bottom: number; left: number; right: number } | undefined {
  const pad = Math.max(0, Math.ceil((size.touch - visual) / 2));
  return pad > 0 ? { top: pad, bottom: pad, left: pad, right: pad } : undefined;
}
