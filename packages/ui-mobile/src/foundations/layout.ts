/**
 * Marges d'écran des maquettes (`padding:56px 22px 26px`) adaptées aux zones sûres, pures.
 * La maquette suppose barre d'état 47 pt / indicateur d'accueil 34 pt : on garde 9 pt sous la barre
 * d'état et on n'empiète que de 8 pt sur l'indicateur, comme la maquette.
 */
import { layout } from '@blowy/design-tokens';

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function screenPadding(insets: Insets) {
  return {
    paddingTop: Math.max(layout.padTop, insets.top + (layout.padTop - 47)),
    paddingBottom: Math.max(layout.padBottom, insets.bottom - (34 - layout.padBottom)),
    paddingLeft: Math.max(layout.padX, insets.left),
    paddingRight: Math.max(layout.padX, insets.right),
  };
}

/** Distance au bas de l'écran : 18 dans la maquette (indicateur d'accueil 34 inclus). */
export const tabBarBottom = (bottomInset: number): number => Math.max(layout.navBottom, bottomInset - 16);

/**
 * Tracé du reflet `::before` (`border-radius:30px 30px 60% 60%`), avec la réduction CSS des rayons
 * quand leur somme dépasse un côté.
 */
export function sheenPath(w: number, h: number): string {
  const tl = 30;
  const bx = 0.6 * w;
  const by = 0.6 * h;
  const f = Math.min(1, w / (tl + tl), w / (bx + bx), h / (tl + by));
  const t = tl * f;
  const rx = bx * f;
  const ry = by * f;
  return `M${t},0 H${w - t} A${t},${t} 0 0 1 ${w},${t} V${h - ry} A${rx},${ry} 0 0 1 ${w - rx},${h} H${rx} A${rx},${ry} 0 0 1 0,${h - ry} V${t} A${t},${t} 0 0 1 ${t},0 Z`;
}

