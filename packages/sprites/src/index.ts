/**
 * @blowy/sprites — manifest typé des sprites (logique pure, sans dépendance React Native).
 * Les `require()` d'images (Metro) vivent dans `src/sources.native.ts`, exposé par
 * `@blowy/sprites/sources` pour le mobile uniquement.
 */
export * from './types.js';
export * from './catalog.js';
export * from './resolve.js';
export { ASSET_META } from './data/asset-meta.js';
