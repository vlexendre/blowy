// Extension Metro du banc QA visuel. Activée UNIQUEMENT si BLOWY_QA_CAPTURE=1 (voir
// apps/mobile/metro.config.js) et n'agit que pour platform === 'web' : les builds iOS/Android
// et tout build sans cette variable sont strictement inchangés.
const path = require('node:path');

const SHIMS = {
  'expo-secure-store': path.join(__dirname, 'shims/expo-secure-store.web.js'),
  'react-native': path.join(__dirname, 'shims/react-native.web.js'),
};

module.exports = function withQaCapture(config) {
  const upstream = config.resolver.resolveRequest;
  config.watchFolders = [...(config.watchFolders ?? []), path.join(__dirname, 'shims')];
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const shim = platform === 'web' && SHIMS[moduleName];
    if (shim && context.originModulePath !== shim) return { type: 'sourceFile', filePath: shim };
    const res = (upstream ?? context.resolveRequest)(context, moduleName, platform);
    // Expo aliase 'react-native' → 'react-native-web' avant d'appeler ce résolveur : on
    // intercepte donc aussi le point d'entrée résolu de react-native-web.
    const rnw = SHIMS['react-native'];
    if (platform === 'web' && res?.type === 'sourceFile' && /react-native-web[\\/]dist[\\/](cjs[\\/])?index\.js$/.test(res.filePath) && context.originModulePath !== rnw) {
      return { type: 'sourceFile', filePath: rnw };
    }
    return res;
  };
  return config;
};
