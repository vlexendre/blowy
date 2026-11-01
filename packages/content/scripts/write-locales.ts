/** Génère locales/fr.json depuis les référentiels (exécuté après la compilation). */
import { writeFileSync } from 'node:fs';
import { buildFrLocale } from '../dist/locales.js';

const target = new URL('../locales/fr.json', import.meta.url);
writeFileSync(target, `${JSON.stringify(buildFrLocale(), null, 2)}\n`);
