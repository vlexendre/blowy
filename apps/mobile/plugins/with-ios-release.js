/**
 * Plugin Expo « sortie iOS » (audit App Store, docs/AUDIT-APPLE.md), appliqué après tous les autres au prebuild :
 *  - l'extension des widgets (cible BlowyWidget, créée par `@bacons/apple-targets`, qui la déclare toujours iPhone et
 *    iPad) suit les appareils de l'app : iPhone seulement tant que `ios.supportsTablet` est faux ;
 *  - l'extension garde la version de l'app (MARKETING_VERSION) : `@bacons/apple-targets` la recopie déjà ; ici, on le
 *    vérifie et on échoue sinon (avertissement ITMS-90473 à l'envoi). Le numéro de build suit `ios.buildNumber`, ou
 *    `EAS_BUILD_IOS_BUILD_NUMBER` sur EAS (le même que celui de l'app).
 * Le manifeste de confidentialité de l'extension est un fichier de `targets/widget/` (`PrivacyInfo.xcprivacy`), repris
 * par le groupe synchronisé de la cible ; celui de l'app vient de `ios.privacyManifests` (app.config.ts).
 */
const fs = require('fs');
const path = require('path');
const { withFinalizedMod } = require('expo/config-plugins');

const WIDGET_INFO_PLIST = '../targets/widget/Info.plist';

/**
 * Réécrit les réglages de build des configurations de l'extension (repérées par leur INFOPLIST_FILE). Pur : rend le
 * texte du projet modifié. Exporté pour les tests.
 */
function patchWidgetBuildSettings(pbxproj, { family, version }) {
  let found = 0;
  const out = pbxproj.replace(/buildSettings = \{([\s\S]*?)\n\t\t\t\};/g, (block, body) => {
    if (!body.includes(`INFOPLIST_FILE = ${WIDGET_INFO_PLIST};`)) return block;
    found += 1;
    let next = body.replace(/TARGETED_DEVICE_FAMILY = [^;]+;/, `TARGETED_DEVICE_FAMILY = ${family};`);
    if (!/TARGETED_DEVICE_FAMILY = /.test(next)) next += `\n\t\t\t\tTARGETED_DEVICE_FAMILY = ${family};`;
    const marketing = /MARKETING_VERSION = ([^;]+);/.exec(next)?.[1]?.replace(/"/g, '');
    if (marketing !== version) throw new Error(`[with-ios-release] l'extension a la version ${marketing}, l'app ${version}`);
    return block.replace(body, next);
  });
  if (found === 0) throw new Error("[with-ios-release] cible de l'extension des widgets introuvable dans le projet Xcode");
  return out;
}

/** `widget: false` : build sans l'extension (BLOWY_WIDGETS=off dans app.config.ts), rien à aligner. */
const withIosRelease = (config, { widget = true } = {}) =>
  !widget ? config : withFinalizedMod(config, [
    'ios',
    async (cfg) => {
      const iosDir = cfg.modRequest.platformProjectRoot;
      const project = fs.readdirSync(iosDir).find((f) => f.endsWith('.xcodeproj'));
      if (!project) throw new Error('[with-ios-release] projet Xcode introuvable');
      const file = path.join(iosDir, project, 'project.pbxproj');
      const family = cfg.ios?.isTabletOnly ? '2' : cfg.ios?.supportsTablet ? '"1,2"' : '1';
      const version = cfg.ios?.version || cfg.version || '1.0.0';
      fs.writeFileSync(file, patchWidgetBuildSettings(fs.readFileSync(file, 'utf8'), { family, version }));
      return cfg;
    },
  ]);

module.exports = withIosRelease;
module.exports.patchWidgetBuildSettings = patchWidgetBuildSettings;
