/**
 * Extension iOS « BlowyWidget » (@bacons/apple-targets) : widgets d'accueil et d'écran verrouillé, activités en
 * direct. Générée par `npx expo prebuild` ; voir docs/WIDGETS.md. Les fichiers de `Generated/` sont recréés
 * par plugins/with-blowy-widgets.js à chaque prebuild (modèle partagé, couleurs des tokens).
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'widget',
  name: 'BlowyWidget',
  displayName: 'Minimoa',
  bundleIdentifier: '.widget',
  // containerBackground et les widgets de l'écran verrouillé tels qu'écrits ici demandent iOS 17.
  deploymentTarget: '17.0',
  entitlements: {
    // Même groupe que l'app (défini dans app.config.ts) : c'est par lui que passe l'état des widgets.
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
