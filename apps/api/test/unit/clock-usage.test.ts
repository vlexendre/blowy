/**
 * Non-régression B11 (docs/qa/journeys-report.md) : l'heure métier vient UNIQUEMENT de l'horloge
 * injectée (`Clock`). Aucune lecture de l'heure système dans `src/` hors `SystemClock`.
 * Exceptions légitimes : aucune ; une durée se mesure avec `performance.now()`, un uptime avec
 * `process.uptime()`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const ALLOWED = new Set([path.join('shared', 'infrastructure', 'system-clock.ts')]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return f === '__tests__' ? [] : walk(p);
    return p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
  });
}

describe('horloge injectable', () => {
  it('aucun new Date() / Date.now() hors SystemClock', () => {
    const offenders = walk(root)
      .filter((f) => !ALLOWED.has(path.relative(root, f)))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .map((line, i) => ({ line, i }))
          .filter(({ line }) => /new Date\(\s*\)|Date\.now\b/.test(line) && !/^\s*(\/\/|\/?\*)/.test(line))
          .map(({ i }) => `${path.relative(root, f)}:${i + 1}`),
      );
    expect(offenders).toEqual([]);
  });
});
