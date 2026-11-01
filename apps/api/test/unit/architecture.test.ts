/**
 * Test d'architecture : dépendances uniquement vers l'intérieur.
 *  - domain/ n'importe ni Nest, ni Prisma, ni @blowy/database, ni application/infrastructure/interface ;
 *  - application/ n'importe ni Nest, ni Prisma/@blowy/database, ni infrastructure/interface.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
  });
}
const files = walk(root);
const importsOf = (f: string) => [...readFileSync(f, 'utf8').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!);
const FRAMEWORK = [/^@nestjs\//, /^@prisma\//, /^@blowy\/database/, /^express$/, /^ioredis$/, /^bullmq$/, /^socket\.io/];

describe('architecture en couches', () => {
  it('domain/ est pur', () => {
    const bad = files
      .filter((f) => f.includes(`${path.sep}domain${path.sep}`))
      .flatMap((f) => importsOf(f).filter((i) => FRAMEWORK.some((r) => r.test(i)) || /\/(application|infrastructure|interface)\//.test(i)).map((i) => `${path.relative(root, f)} → ${i}`));
    expect(bad).toEqual([]);
  });
  it('application/ ne dépend ni du framework ni de l’infrastructure', () => {
    const bad = files
      .filter((f) => f.includes(`${path.sep}application${path.sep}`))
      .flatMap((f) => importsOf(f).filter((i) => FRAMEWORK.some((r) => r.test(i)) || /\/(infrastructure|interface)\//.test(i)).map((i) => `${path.relative(root, f)} → ${i}`));
    expect(bad).toEqual([]);
  });
});
