// Monorepo pnpm : depuis le SDK 52, expo/metro-config détecte le workspace (watchFolders,
// nodeModulesPaths) automatiquement — voir https://docs.expo.dev/guides/monorepos/.
// Ne PAS ajouter watchFolders / disableHierarchicalLookup manuels.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Les sprites sont en WebP/PNG (déjà dans assetExts par défaut) ; .riv/.lottie non utilisés.
module.exports = config;
