/** Couleurs, rayons et espacements : uniquement depuis @blowy/tokens, exposés en variables CSS. */
import { color, font, radius, space } from '@blowy/tokens';

export function applyTheme(root: HTMLElement = document.documentElement): void {
  const vars: Record<string, string> = {
    '--night': color.night,
    '--panel': color.panel,
    '--card': color.card,
    '--line': color.line,
    '--mute': color.mute,
    '--white': color.white,
    '--accent': color.accent,
    '--accent-soft': color.accentSoft,
    '--danger': color.danger,
    '--ok': color.ok,
    '--violet': color.violet,
    '--coral': color.coral,
    '--font-display': font.web.display,
    '--font-body': font.web.body,
    '--r-sm': `${radius.sm}px`,
    '--r-md': `${radius.md}px`,
    '--s-xs': `${space.xs}px`,
    '--s-sm': `${space.sm}px`,
    '--s-md': `${space.md}px`,
    '--s-lg': `${space.lg}px`,
    '--s-xl': `${space.xl}px`,
    '--s-xxl': `${space.xxl}px`,
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}
