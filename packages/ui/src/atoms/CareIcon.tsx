import Svg, { Circle, Path } from 'react-native-svg';

import { useInk } from '../lib/ink';

/** Pictos des soins et de l'accueil du pet. */
export const CARE_ICONS = ['feed', 'play', 'nap', 'cuddle', 'door'] as const;
export type CareIconName = (typeof CARE_ICONS)[number];

export interface CareIconProps {
  name: CareIconName;
  /** Côté en points. Défaut 28. */
  size?: number;
  /** Encre ; défaut l'encre du conteneur. */
  color?: string;
}

const SW = 2.2;

/**
 * Pictos SVG des soins, dans la famille de ceux de la barre d'onglets (viewBox 24, trait 2,2, bouts ronds) :
 * nourrir (fraise), jouer (ballon), sieste (lune), câlin (deux cœurs serrés), et la porte (« il ne sort plus »).
 */
export function CareIcon({ name, size = 28, color }: CareIconProps) {
  const ink = useInk();
  const c = color ?? ink;
  const line = { stroke: c, strokeWidth: SW, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let body;
  switch (name) {
    case 'feed':
      body = (
        <>
          <Path d="M12 21.4c-3.8-1.5-7.2-5.4-7.2-9.4 0-2.7 2.4-4.2 7.2-4.2s7.2 1.5 7.2 4.2c0 4-3.4 7.9-7.2 9.4z" {...line} />
          <Path d="M7.6 8.1 9.4 5.6l2.6 1.9 2.6-1.9 1.8 2.5M12 7.5V2.9" {...line} />
          <Circle cx={9.3} cy={11.6} r={0.95} fill={c} />
          <Circle cx={14.7} cy={11.6} r={0.95} fill={c} />
          <Circle cx={12} cy={13.9} r={0.95} fill={c} />
          <Circle cx={10.1} cy={16.4} r={0.85} fill={c} />
          <Circle cx={13.9} cy={16.4} r={0.85} fill={c} />
        </>
      );
      break;
    case 'play':
      body = (
        <>
          <Circle cx={12} cy={12} r={9.4} {...line} />
          <Path d="M12 8.6l3.23 2.35-1.23 3.8h-4l-1.23-3.8z" fill={c} stroke={c} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M12 8.6V5.6M15.23 10.95l2.86-.93M14 14.75l1.76 2.43M10 14.75l-1.76 2.43M8.77 10.95l-2.86-.93" {...line} strokeWidth={1.6} />
          <Path
            d="M12 5.6 8.48 3.28A9.4 9.4 0 0 1 15.52 3.28zM18.09 10.02l1.11-4.06a9.4 9.4 0 0 1 2.18 6.7zM15.76 17.18l4.21-.2a9.4 9.4 0 0 1-5.7 4.14zM8.24 17.18l1.49 3.94a9.4 9.4 0 0 1-5.7-4.14zM5.91 10.02l-3.29 2.64a9.4 9.4 0 0 1 2.18-6.7z"
            fill={c}
          />
        </>
      );
      break;
    case 'nap':
      body = (
        <>
          <Path d="M19.8 14.6A8.3 8.3 0 1 1 9.4 4.2a6.6 6.6 0 0 0 10.4 10.4z" {...line} />
          <Path d="M16.6 3v3.6M14.8 4.8h3.6" {...line} strokeWidth={1.8} />
        </>
      );
      break;
    case 'cuddle':
      // Deux cœurs serrés l'un contre l'autre.
      body = (
        <>
          <Path d="M9.4 20.2S2.6 15.9 2.6 10.9A3.9 3.9 0 0 1 9.4 8.3a3.9 3.9 0 0 1 6.8 2.6c0 5-6.8 9.3-6.8 9.3z" {...line} />
          <Path
            d="M16.6 13.4s-3.6-2.3-3.6-5A2.1 2.1 0 0 1 16.6 7a2.1 2.1 0 0 1 3.6 1.4c0 2.7-3.6 5-3.6 5z"
            fill={c}
            stroke={c}
            strokeWidth={1.4}
            strokeLinejoin="round"
            transform="translate(0 -3)"
          />
        </>
      );
      break;
    case 'door':
      body = (
        <>
          <Path d="M6 21V4.6A1.6 1.6 0 0 1 7.6 3h8.8A1.6 1.6 0 0 1 18 4.6V21M3.5 21h17" {...line} />
          <Circle cx={14.6} cy={12.4} r={1.2} fill={c} />
        </>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
      {body}
    </Svg>
  );
}
