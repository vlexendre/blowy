// Monorepo pnpm : depuis le SDK 52, expo/metro-config détecte le workspace (watchFolders,
// nodeModulesPaths) automatiquement — voir https://docs.expo.dev/guides/monorepos/.
// Ne PAS ajouter watchFolders / disableHierarchicalLookup manuels.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Les sprites sont en WebP/PNG (déjà dans assetExts par défaut) ; .riv/.lottie non utilisés.

// Banc QA visuel (tooling/qa/visual) : shims web de capture, jamais actifs hors BLOWY_QA_CAPTURE=1.
module.exports = process.env.BLOWY_QA_CAPTURE === '1' ? require('../../tooling/qa/visual/capture/metro-capture.cjs')(config) : config;
