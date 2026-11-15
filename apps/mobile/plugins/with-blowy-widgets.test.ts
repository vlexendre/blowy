/// <reference types="node" />
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { color, gradient, speciesGradient } from '@blowy/tokens';
import { describe, expect, it } from 'vitest';

const require = createRequire(__filename);
const plugin = require('./with-blowy-widgets.js') as { writeGenerated: (root: string) => string };
const mobile = path.resolve(__dirname, '..');

describe('plugin des widgets', () => {
  it('recopie le modèle partagé et écrit toutes les couleurs des tokens en Swift', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blowy-widgets-'));
    try {
      fs.mkdirSync(path.join(root, 'modules/blowy-widgets/ios'), { recursive: true });
      fs.copyFileSync(path.join(mobile, 'modules/blowy-widgets/ios/BlowyShared.swift'), path.join(root, 'modules/blowy-widgets/ios/BlowyShared.swift'));
      const dir = plugin.writeGenerated(root);

      const shared = fs.readFileSync(path.join(dir, 'BlowyShared.swift'), 'utf8');
      expect(shared.endsWith(fs.readFileSync(path.join(mobile, 'modules/blowy-widgets/ios/BlowyShared.swift'), 'utf8'))).toBe(true);

      const swift = fs.readFileSync(path.join(dir, 'BlowyTokens.swift'), 'utf8');
      for (const [name, value] of Object.entries(color)) expect(swift).toContain(`static let ${name} = Color(blowyHex: 0x${value.slice(1).toUpperCase()})`);
      for (const name of Object.keys(gradient)) expect(swift).toContain(`"${name}": [`);
      for (const [species, g] of Object.entries(speciesGradient)) expect(swift).toContain(`"${species}": "${g}"`);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('chaque image appelée par l’extension existe dans le catalogue', () => {
    const catalog = path.join(mobile, 'targets/widget/Pets.xcassets');
    for (const species of ['nino', 'suzie', 'gaston', 'pia']) {
      for (const pose of ['joie', 'neutre', 'triste', 'face', 'face_small']) {
        expect(fs.existsSync(path.join(catalog, `${species}_${pose}.imageset/${species}_${pose}.png`))).toBe(true);
      }
    }
  });

  it('chaque clé de texte de l’extension a sa traduction française', () => {
    const catalog = JSON.parse(fs.readFileSync(path.join(mobile, 'targets/widget/Localizable.xcstrings'), 'utf8')) as {
      sourceLanguage: string;
      strings: Record<string, { localizations: Record<string, unknown> }>;
    };
    expect(catalog.sourceLanguage).toBe('fr');
    const swift = fs
      .readdirSync(path.join(mobile, 'targets/widget'))
      .filter((f: string) => f.endsWith('.swift'))
      .map((f: string) => fs.readFileSync(path.join(mobile, 'targets/widget', f), 'utf8'))
      .join('\n');
    // Clés écrites en littéral dans les vues : Text("clé"), Text("clé \(x)"), LocalizedStringKey, configuration.
    const used = new Set<string>();
    for (const m of swift.matchAll(/"((?:widget|empty|streak|challenge|activity|a11y|shape)\.[a-zA-Z_.]+|sociability)( \\\((?:[^()]|\([^()]*\))*\))?"/g)) {
      const arg = m[2];
      // Les nombres passés sont des séries (Int → %lld) ; le reste, des noms ou des textes (String → %@).
      used.add(arg ? `${m[1]} ${/streak/.test(arg) ? '%lld' : '%@'}` : m[1]!);
    }
    for (const shape of ['en_forme', 'bof', 'boude']) used.add(`shape.${shape}`);
    for (const key of used) {
      expect(catalog.strings[key], key).toBeDefined();
      for (const lang of ['fr', 'en', 'es', 'pt', 'nl']) expect(catalog.strings[key]!.localizations[lang], `${key} ${lang}`).toBeDefined();
    }
    // Jamais « pet » dans les textes montrés.
    const values = [...JSON.stringify(catalog).matchAll(/"value":"([^"]*)"/g)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(30);
    for (const v of values) expect(v).not.toMatch(/\bpets?\b/i);
  });
});
