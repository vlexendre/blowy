// Règle d'architecture atomique de @blowy/ui-mobile : un niveau n'importe jamais un niveau supérieur.
// Fusionnée à la configuration racine (eslint.config.mjs) — l'orchestrateur peut la reprendre à la racine.
import root from '../../eslint.config.mjs';

const up = (levels) => ({
  'no-restricted-imports': [
    'error',
    { patterns: levels.map((l) => ({ group: [`../${l}`, `../${l}/*`, `./${l}`, `./${l}/*`], message: `Atomic design : import vers un niveau supérieur (${l}) interdit.` })) },
  ],
});

export default [
  ...root,
  { files: ['src/foundations/**/*.{ts,tsx}'], rules: up(['atoms', 'molecules', 'organisms', 'templates']) },
  { files: ['src/atoms/**/*.{ts,tsx}'], rules: up(['molecules', 'organisms', 'templates']) },
  { files: ['src/molecules/**/*.{ts,tsx}'], rules: up(['organisms', 'templates']) },
  { files: ['src/organisms/**/*.{ts,tsx}'], rules: up(['templates']) },
];
