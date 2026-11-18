/**
 * Aperçus de lien des pages villes et guides : lignes du titre et fond, lus dans content/editorial, pour build.py.
 * Usage (depuis la racine du dépôt) :
 *   pnpm exec tsx apps/web/scripts/site-images/editorial-og.mts > /tmp/minimoa-og-pages.json
 *   python3 -I apps/web/scripts/site-images/build.py --og-pages /tmp/minimoa-og-pages.json
 */
import { CITY_LIST } from '../../src/content/editorial/villes';
import { GUIDE_LIST } from '../../src/content/editorial/guides';
import { editorialUi } from '../../src/content/editorial/ui';

const host = 'minimoa.app';
const specs = [
  { out: 'villes', ...editorialUi.cities.og, tag: host, art: 'groupe' },
  ...CITY_LIST.map((c, i) => ({ out: `villes/${c.slug}`, ...c.og, tag: host, art: ['trio', 'groupe', 'duo'][i % 3] })),
  { out: 'guides', ...editorialUi.guides.og, tag: host, art: 'quatre' },
  ...GUIDE_LIST.map((g, i) => ({ out: `guides/${g.slug}`, ...g.og, tag: host, art: ['duo', 'timide', 'marche', 'pense', 'quatre'][i % 5] })),
];
console.log(JSON.stringify(specs, null, 1));
