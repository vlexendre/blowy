// Monorepo pnpm : expo/metro-config détecte le workspace tout seul (watchFolders, nodeModulesPaths).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
