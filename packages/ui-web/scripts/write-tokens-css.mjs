// Génère src/tokens.css depuis @blowy/design-tokens (source unique des couleurs/espacements/rayons).
import { writeFileSync } from 'node:fs';
import { color, space, radius, touch } from '@blowy/design-tokens';
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const lines = [
  ...Object.entries(color).map(([k, v]) => `  --c-${kebab(k)}: ${v};`),
  ...Object.entries(space).map(([k, v]) => `  --s-${k}: ${v}px;`),
  ...Object.entries(radius).map(([k, v]) => `  --r-${k}: ${v}px;`),
  `  --touch: ${touch.minTarget}px;`,
];
writeFileSync(new URL('../src/tokens.css', import.meta.url), `/* Généré par scripts/write-tokens-css.mjs depuis @blowy/design-tokens — ne pas éditer. */\n:root {\n${lines.join('\n')}\n}\n`);
