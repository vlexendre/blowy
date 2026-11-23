/** La fête d'un palier de série (7, 30, 100, 365 jours), plein écran avant la fin de séance (`StreakTier`). */
import { messages, plural } from './runtime';

export const celebration = messages({
  fr: {
    tier: {
      unit: (n: number) => plural(n, { one: 'jour d’affilée', other: 'jours d’affilée' }),
      a11y: (n: number) => `${n} ${plural(n, { one: 'jour', other: 'jours' })} d’affilée`,
      lines: ['Continue ! Je file raconter ta série à tout le quartier.', 'Encore un jour ! On ne nous arrête plus.', 'Ta flamme brille, je la garde au chaud.'],
    },
  },
  en: {
    tier: {
      unit: (n: number) => plural(n, { one: 'day in a row', other: 'days in a row' }),
      a11y: (n: number) => `${n} ${plural(n, { one: 'day in a row', other: 'days in a row' })}`,
      lines: ['Keep going! I’m off to tell the whole neighbourhood.', 'One more day! Nothing can stop us now.', 'Your flame is glowing, I’ll keep it warm.'],
    },
  },
  es: {
    tier: {
      unit: (n: number) => plural(n, { one: 'día seguido', other: 'días seguidos' }),
      a11y: (n: number) => `${n} ${plural(n, { one: 'día seguido', other: 'días seguidos' })}`,
      lines: ['¡Sigue así! Voy a contárselo a todo el barrio.', '¡Un día más! Ya nadie nos para.', 'Tu llama brilla, yo la mantengo calentita.'],
    },
  },
  pt: {
    tier: {
      unit: (n: number) => plural(n, { one: 'dia seguido', other: 'dias seguidos' }),
      a11y: (n: number) => `${n} ${plural(n, { one: 'dia seguido', other: 'dias seguidos' })}`,
      lines: ['Continue assim! Vou contar pro bairro inteiro.', 'Mais um dia! Ninguém segura a gente.', 'Sua chama brilha, eu mantenho ela quentinha.'],
    },
  },
  nl: {
    tier: {
      unit: (n: number) => plural(n, { one: 'dag op rij', other: 'dagen op rij' }),
      a11y: (n: number) => `${n} ${plural(n, { one: 'dag op rij', other: 'dagen op rij' })}`,
      lines: ['Ga zo door! Ik vertel het aan de hele buurt.', 'Weer een dag! Niemand houdt ons nog tegen.', 'Je vlam gloeit, ik houd hem warm.'],
    },
  },
});
