/**
 * @blowy/content — référentiels validés, versionnés et traduisibles (clés i18n + fr).
 * `locales/fr.json` est généré depuis ces sources (`pnpm --filter @blowy/content build`)
 * et vérifié identique par les tests.
 */
export * from './catalog/index.js';
export { buildFrLocale } from './locales.js';
