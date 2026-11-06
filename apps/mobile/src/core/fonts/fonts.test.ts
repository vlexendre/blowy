import { opticalSizes } from '@blowy/design-tokens';
import { ALL_FONT_FAMILIES } from '@blowy/ui-mobile/pure';
import { describe, expect, it } from 'vitest';

// L'app n'embarque pas les types Node : accès fichiers typés localement (test Node uniquement).
interface NodeFs {
  existsSync(p: string): boolean;
  readFileSync(p: string, enc?: 'utf8'): string & { includes(b: unknown): boolean };
}
const fsMod = 'node:fs';
const fs = (await import(/* @vite-ignore */ fsMod)) as NodeFs;
const here = new URL('.', import.meta.url).pathname;
const join = (...p: string[]) => p.join('/').replace(/\/+/g, '/');
const { existsSync, readFileSync } = fs;
const root = join(here, '../../..');
const generated = readFileSync(join(here, 'font-files.generated.ts'), 'utf8');
const script = readFileSync(join(root, 'scripts/fonts/build-fonts.py'), 'utf8');

describe('polices', () => {
  it('chaque famille attendue par ui-mobile est générée et chargée', () => {
    for (const f of ALL_FONT_FAMILIES) {
      expect(existsSync(join(root, 'assets/fonts', `${f}.ttf`)), f).toBe(true);
      expect(generated).toContain(`'${f}': require('../../../assets/fonts/${f}.ttf')`);
    }
  });
  it('le script de génération utilise les mêmes tailles optiques que les jetons', () => {
    expect(script).toContain(`DISPLAY_SIZES = [${opticalSizes.display.join(', ')}]`);
    expect(script).toContain(`STRONG_SIZES = [${opticalSizes.strong.join(', ')}]`);
  });
  it('les instances sont mono-graisse (aucun gras synthétique) et nommées comme la famille', () => {
    const bin = readFileSync(
      join(root, 'assets/fonts/BricolageGrotesque-D56.ttf'),
      'latin1' as 'utf8',
    );
    expect(bin.includes('BricolageGrotesque-D56')).toBe(true);
    expect(bin.includes('fvar')).toBe(false);
  });
});
