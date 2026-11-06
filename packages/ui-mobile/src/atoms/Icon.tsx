/**
 * Icônes vectorielles (tracés repris de la maquette V4). Décoratives par défaut : le sens
 * est toujours porté par un libellé texte voisin ou l'accessibilityLabel du parent.
 */
import Svg, { Circle, Path } from 'react-native-svg';
import { color } from '../foundations/theme';

export const ICON_NAMES = [
  'nest',
  'chats',
  'map',
  'neighborhood',
  'profile',
  'back',
  'close',
  'plus',
  'check',
  'chevron',
  'trophy',
  'lock',
  'flag',
  'shield',
  'phone',
  'send',
  'mic',
  'camera',
  'bell',
  'gear',
  'pause',
  'heart',
  'star',
  'pin',
  'warning',
  'wifiOff',
  'more',
  'share',
  'arrow',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

const PATHS: Record<IconName, { d: string; fill?: boolean }[]> = {
  nest: [{ d: 'M4 11l8-7 8 7v9H4z' }],
  chats: [{ d: 'M4 5h16v11H9l-5 4z' }],
  map: [{ d: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z' }],
  neighborhood: [{ d: 'M3 21V11l5-4 5 4v10M13 21V8l4-3 4 3v13M3 21h18' }],
  profile: [{ d: 'M4 21c1-4 4.5-6 8-6s7 2 8 6' }],
  back: [{ d: 'M15 5l-7 7 7 7' }],
  close: [{ d: 'M6 6l12 12M18 6L6 18' }],
  plus: [{ d: 'M12 5v14M5 12h14' }],
  check: [{ d: 'M5 12.5l4.5 4.5L19 7.5' }],
  chevron: [{ d: 'M9 5l7 7-7 7' }],
  trophy: [{ d: 'M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6v4H9z' }],
  lock: [{ d: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3' }],
  flag: [{ d: 'M5 21V4M5 4h11l-2 4 2 4H5' }],
  shield: [{ d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' }],
  phone: [{ d: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' }],
  send: [{ d: 'M4 12l16-8-6 16-3-6z' }],
  mic: [{ d: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3' }],
  camera: [{ d: 'M4 7h4l2-3h4l2 3h4v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' }],
  bell: [{ d: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0' }],
  gear: [{ d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 7.5 4 7 3 10l2 1v2l-2 1 1 3 2-.5 1.5 1.5-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z' }],
  pause: [{ d: 'M8 5v14M16 5v14' }],
  heart: [{ d: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z', fill: true }],
  star: [{ d: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z', fill: true }],
  pin: [{ d: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z' }],
  warning: [{ d: 'M12 3l10 18H2zM12 10v5M12 18v.5' }],
  wifiOff: [{ d: 'M3 3l18 18M5 9a12 12 0 0 1 5-2.6M19 9a12 12 0 0 0-3.5-2M8.5 12.5a6 6 0 0 1 7 0M12 17v.5' }],
  more: [{ d: 'M5 12h.5M12 12h.5M19 12h.5' }],
  share: [{ d: 'M12 15V4M7 9l5-5 5 5M5 14v6h14v-6' }],
  /** Flèche du CTA « Commencer » (V4-Welcome : stroke 2.8, 22 px). */
  arrow: [{ d: 'M5 12h14M13 6l6 6-6 6' }],
};

const EXTRA_CIRCLES: Partial<Record<IconName, { cx: number; cy: number; r: number; fill?: boolean }[]>> = {
  map: [{ cx: 12, cy: 9.5, r: 2.4, fill: true }],
  pin: [{ cx: 12, cy: 9.5, r: 2.4, fill: true }],
  profile: [{ cx: 12, cy: 8, r: 4 }],
};

export interface IconProps {
  name: IconName;
  size?: number;
  tint?: string;
  strokeWidth?: number;
  /** Variante pleine (onglet actif de `.gnav` : tracés remplis, rond intérieur de la carte en `holeColor`). */
  filled?: boolean;
  holeColor?: string;
}

export function Icon({ name, size = 22, tint = color.ink, strokeWidth = 2.2, filled = false, holeColor = color.lime }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {PATHS[name].map((p, i) => (
        <Path key={i} d={p.d} stroke={tint} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={p.fill || filled ? tint : 'none'} />
      ))}
      {EXTRA_CIRCLES[name]?.map((c, i) => (
        <Circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} stroke={c.fill ? 'none' : tint} strokeWidth={strokeWidth} fill={filled ? (c.fill ? holeColor : tint) : c.fill ? tint : 'none'} />
      ))}
    </Svg>
  );
}
