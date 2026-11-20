/** Fin de séance fêtée (maquette V7 « Célébration ») et série qui monte (« Palier de série »). */
import { TODO } from '@blowy/content';
import { messages, plural } from './runtime';

export const celebration = messages({
  fr: {
    titles: ['Tu te connais par cœur !', 'Bien joué !', 'Séance bouclée !', 'Tu assures !', 'Et de cinq !'],
    text: (pet: string, answers: number) => `${answers} ${plural(answers, { one: 'réponse', other: 'réponses' })}. ${pet} prend des notes.`,
    tiles: { sparks: 'Étincelles', streak: 'Série', time: 'Vitesse', coherence: 'Cohérence' },
    coherence: (ok: number, of: number) => `${ok}/${of}`,
    sparks: (n: number) => `+${n}`,
    time: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
    cta: 'Récupérer',
    tier: {
      unit: (n: number) => plural(n, { one: 'jour d’affilée', other: 'jours d’affilée' }),
      a11y: (n: number) => `${n} ${plural(n, { one: 'jour', other: 'jours' })} d’affilée`,
      share: 'Partager',
      shareText: (n: number) => `${n} ${plural(n, { one: 'jour', other: 'jours' })} d’affilée sur Minimoa 🔥 https://minimoa.app`,
      continue: 'Continuer',
    },
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
