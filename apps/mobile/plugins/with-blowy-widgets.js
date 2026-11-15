/**
 * Plugin Expo des widgets iOS (voir docs/WIDGETS.md). À chaque `expo prebuild`, il écrit dans
 * `targets/widget/Generated/` (non versionné) :
 *  - BlowyShared.swift : copie du modèle partagé `modules/blowy-widgets/ios/BlowyShared.swift` (une seule source
 *    pour l'app et l'extension) ;
 *  - BlowyTokens.swift : les couleurs de `@blowy/tokens` en Swift (aucune couleur écrite à la main dans l'extension).
 * Il déclare aussi le français comme langue de développement du projet Xcode, et les cinq langues de l'app
 * (le catalogue de textes de l'extension, `Localizable.xcstrings`, a le français pour langue source).
 * L'extension elle-même est créée par `@bacons/apple-targets` à partir de `targets/widget/expo-target.config.js`.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const GENERATED = 'targets/widget/Generated';
const SHARED = 'modules/blowy-widgets/ios/BlowyShared.swift';
const HEADER = '// Généré par plugins/with-blowy-widgets.js au prebuild : ne pas modifier.\n';

/** Les tokens sont en TypeScript : Node 22 les charge directement (types effacés). */
function loadTokens() {
  try {
    return require('@blowy/tokens');
  } catch (error) {
    throw new Error(`[with-blowy-widgets] impossible de lire @blowy/tokens (Node 22.12+ requis) : ${error.message}`);
  }
}

const hex = (value) => {
  const m = /^#([0-9a-f]{6})$/i.exec(value);
  if (!m) throw new Error(`[with-blowy-widgets] couleur inattendue : ${value}`);
  return `Color(blowyHex: 0x${m[1].toUpperCase()})`;
};

function tokensSwift(tokens) {
  const colors = Object.entries(tokens.color).map(([name, value]) => `  static let ${name} = ${hex(value)}`);
  const gradients = Object.entries(tokens.gradient).map(([name, stops]) => `    "${name}": [${stops.map(hex).join(', ')}],`);
  const species = Object.entries(tokens.speciesGradient).map(([name, gradient]) => `    "${name}": "${gradient}",`);
  return `${HEADER}// Source : packages/tokens/src/index.ts.

import SwiftUI

enum BlowyTokens {
${colors.join('\n')}

  /// Dégradés verticaux des grands panneaux (haut, bas).
  static let gradients: [String: [Color]] = [
${gradients.join('\n')}
  ]

  /// Panneau placé derrière chaque espèce.
  static let speciesGradient: [String: String] = [
${species.join('\n')}
  ]
}

extension Color {
  init(blowyHex hex: UInt32) {
    self.init(
      .sRGB,
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255,
      opacity: 1
    )
  }
}
`;
}

/** Écrit les fichiers générés ; exporté pour les tests. */
function writeGenerated(projectRoot) {
  const dir = path.join(projectRoot, GENERATED);
  fs.mkdirSync(dir, { recursive: true });
  const shared = fs.readFileSync(path.join(projectRoot, SHARED), 'utf8');
  fs.writeFileSync(path.join(dir, 'BlowyShared.swift'), `${HEADER}// Source : ${SHARED}.\n\n${shared}`);
  fs.writeFileSync(path.join(dir, 'BlowyTokens.swift'), tokensSwift(loadTokens()));
  return dir;
}

const REGIONS = ['fr', 'en', 'es', 'pt', 'nl', 'Base'];

const withBlowyWidgets = (config) => {
  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      writeGenerated(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults.getFirstProject().firstProject;
    project.developmentRegion = 'fr';
    project.knownRegions = REGIONS;
    return cfg;
  });
};

module.exports = withBlowyWidgets;
module.exports.writeGenerated = writeGenerated;
