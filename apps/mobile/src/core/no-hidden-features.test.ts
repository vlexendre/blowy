/**
 * Règle App Store « pas de fonction cachée » (2.5.19, docs/ADA-2027.md) : une fonction retirée est supprimée de l'app,
 * jamais masquée par un drapeau. Ce test échoue si un drapeau de fonction réapparaît dans `src/` ou `app/` :
 * `XXX_IN_V1`, `FEATURE_…`, `isEnabled(…)`, `retiredUnless(…)`, ou une constante en capitales fixée à `false` qui
 * garde un écran ou un bloc (`const SHOW_X = false`). Les outils `app/dev/*` restent gardés par `__DEV__`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const self = fileURLToPath(import.meta.url);

const FLAGS: readonly [string, RegExp][] = [
  ['drapeau _IN_V1', /\b[A-Z][A-Z0-9_]*_IN_V\d+\b/],
  ['drapeau FEATURE_', /\bFEATURE_[A-Z0-9_]+\b/],
  ['isEnabled(', /\bisEnabled\s*\(/],
  ['retiredUnless(', /\bretiredUnless\s*\(/],
  ['constante qui masque', /\bconst\s+[A-Z][A-Z0-9_]*\s*(?::\s*boolean\s*)?=\s*false\b/],
];

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : files(full);
    return /\.(ts|tsx)$/.test(e.name) && full !== self ? [full] : [];
  });
}

describe('pas de fonction cachée (docs/ADA-2027.md)', () => {
  it('aucun drapeau de fonction masquée dans apps/mobile/src ni apps/mobile/app', () => {
    const found: string[] = [];
    for (const file of [...files(path.join(root, 'src')), ...files(path.join(root, 'app'))]) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const [name, re] of FLAGS) {
          if (re.test(line)) found.push(`${path.relative(root, file)}:${i + 1} (${name}) ${line.trim()}`);
        }
      });
    }
    expect(found, 'Supprimer la fonction au lieu de la masquer (docs/ADA-2027.md, « pas de fonction cachée »).').toEqual([]);
  });

  it('le test voit bien un drapeau', () => {
    const sample = ['export const GROUPS_IN_V1 = false;', 'if (FEATURE_LEAGUE) {}', 'flags.isEnabled("x")', 'retiredUnless(F, S, "/")', 'const SHOW_SHEET: boolean = false;'];
    for (const line of sample) expect(FLAGS.some(([, re]) => re.test(line)), line).toBe(true);
    expect(FLAGS.some(([, re]) => re.test('const MAX_LIVES = 3;'))).toBe(false);
  });
});
