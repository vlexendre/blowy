import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  // Les paquets internes sont consommés en source TypeScript : on les embarque dans le bundle.
  noExternal: [/^@blowy\//],
});
