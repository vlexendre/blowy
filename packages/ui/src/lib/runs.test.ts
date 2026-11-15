import { describe, expect, it } from 'vitest';

import { countRunWords, frenchSpaces, highlightRuns, normalizeRuns, revealTokens } from './runs';

const NB = ' ';
const texts = (runs: { text: string }[]) => runs.map((r) => r.text);
const joined = (runs: { text: string }[]) => texts(runs).join('');

describe('espaces des phrases en plusieurs morceaux', () => {
  it('le retour à la ligne d’un titre passe au début de la partie estompée', () => {
    const runs = normalizeRuns([{ text: 'TON PET,\n' }, { text: 'TON VIBE', dim: true }]);
    expect(texts(runs)).toEqual(['TON PET,', '\nTON VIBE']);
  });

  it('l’espace avant un mot en couleur ne reste pas en fin de morceau, et rien ne se perd', () => {
    const runs = normalizeRuns(highlightRuns(`enchanté, Tom${NB}! ta date de naissance${NB}?`, 'Tom'));
    expect(texts(runs)).toEqual(['enchanté,', ' Tom', `${NB}! ta date de naissance${NB}?`]);
    expect(runs[1]).toMatchObject({ hot: true });
  });

  it('jamais de double espace ni de morceau fait seulement d’espaces', () => {
    const runs = normalizeRuns([{ text: 'BLOWY+ ' }, { text: ' ' }, { text: ' 4,99 €/MOIS', dim: true }]);
    expect(texts(runs)).toEqual(['BLOWY+', ` 4,99${NB}€/MOIS`]);
    expect(normalizeRuns([{ text: 'A\n' }, { text: ' B' }]).map((r) => r.text)).toEqual(['A', '\nB']);
  });

  it('l’insécable l’emporte sur l’espace normale à une jointure', () => {
    expect(joined(normalizeRuns([{ text: 'Tom ' }, { text: `${NB}!` }]))).toBe(`Tom${NB}!`);
  });

  it('espace insécable avant ? ! : ; même à cheval sur deux morceaux', () => {
    expect(frenchSpaces('on sort ce soir ? oui : non ; « ok »')).toBe(`on sort ce soir${NB}? oui${NB}: non${NB}; «${NB}ok${NB}»`);
    expect(joined(normalizeRuns([{ text: 'salut ' }, { text: 'Tom' }, { text: ' !' }]))).toBe(`salut Tom${NB}!`);
    expect(frenchSpaces('https://blowy.app/x 10:30')).toBe('https://blowy.app/x 10:30');
    expect(frenchSpaces('14,99 €/mois · −67 %')).toBe(`14,99${NB}€/mois · −67${NB}%`);
  });

  it('un lien souligné ne commence pas par une espace', () => {
    const runs = normalizeRuns([{ text: 'tu acceptes les ' }, { text: 'conditions', link: true }, { text: ' et la ' }, { text: 'confidentialité', link: true }, { text: '.' }], {
      noLeadingSpace: (r) => 'link' in r,
    });
    expect(texts(runs)).toEqual(['tu acceptes les ', 'conditions', ' et la ', 'confidentialité', '.']);
  });

  it('mot à mot : chaque mot porte l’espace qui le précède, les insécables restent dans le mot', () => {
    const tokens = revealTokens(normalizeRuns([{ text: 'C’EST NINO.\n' }, { text: 'POUR\nL’INSTANT.', dim: true }]));
    expect(tokens.map((t) => t.text)).toEqual(['C’EST', ' NINO.', '\nPOUR', '\nL’INSTANT.']);
    expect(tokens.map((t) => t.word)).toEqual([0, 1, 2, 3]);
    expect(countRunWords([{ text: `ta date de naissance${NB}?` }])).toBe(4);
  });
});
