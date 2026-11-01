// Copie les sprites légers (webp ~15 Ko) depuis @blowy/sprites vers public/sprites (source unique,
// aucune image dupliquée dans le dépôt). Repli : pose « young » si le stade n'existe pas.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const assets = dirname(require.resolve('@blowy/sprites/assets/icons/coin.webp')).replace(/\/icons$/, '');
const out = new URL('../public/sprites/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
for (const species of ['nino', 'gaston', 'pia', 'suzie']) {
  for (const stage of ['baby', 'young', 'adult']) {
    const src = [join(assets, species, stage, 'presentation.webp'), join(assets, species, 'young', 'presentation.webp')].find(existsSync);
    if (src) copyFileSync(src, join(out, `${species}-${stage}.webp`));
  }
}
console.warn(`sprites copiés dans ${out}`);
