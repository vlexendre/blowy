// Configuration ESLint unique du monorepo (flat config).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const serverOnly = ['@blowy/database', '@blowy/ai', '@prisma/client', 'openai', 'firebase-admin'];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/generated/**',
      '**/node_modules/**',
      'design/**',
      '**/*.config.{js,cjs,mjs}',
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Frontières : code client interdit d'importer du code serveur.
  {
    files: ['apps/mobile/**/*.{ts,tsx}', 'apps/web/**/*.{ts,tsx}', 'apps/admin/**/*.{ts,tsx}', 'packages/ui-*/**/*.{ts,tsx}', 'packages/api-client/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { paths: serverOnly.map((name) => ({ name, message: 'Module serveur interdit côté client.' })), patterns: ['@blowy/database/*', '@blowy/ai/*'] }],
    },
  },
  // pet-engine : pur, sans horloge ni aléa global.
  {
    files: ['packages/pet-engine/src/**/*.ts', 'packages/matching/src/**/*.ts'],
    ignores: ['**/*.test.ts', '**/simulate/**'],
    rules: {
      'no-restricted-globals': ['error', { name: 'Date', message: "Passer l'heure via le contexte (now)." }],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Utiliser le PRNG seedé.' }, { object: 'Date', property: 'now', message: 'Passer now en paramètre.' }],
      'no-restricted-imports': ['error', { patterns: ['@blowy/database*', '@blowy/ai*', '@blowy/api-*', 'node:*'] }],
    },
  },
);
