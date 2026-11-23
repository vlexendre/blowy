/**
 * Textes de la série qui restent des rituels (V7) : le cadre de l'écran de la série
 * (lettres des jours, libellés lus, record). Défi, habitudes, preuves, souvenirs et bilans sont supprimés de l'app.
 */
import { formatDate, messages, plural } from './runtime';

const days = (n: number): string => `${n} ${plural(n, { one: 'jour', other: 'jours' })}`;
const daysEn = (n: number): string => `${n} ${plural(n, { one: 'day', other: 'days' })}`;
const daysEs = (n: number): string => `${n} ${plural(n, { one: 'día', other: 'días' })}`;
const daysPt = (n: number): string => `${n} ${plural(n, { one: 'dia', other: 'dias' })}`;
const daysNl = (n: number): string => `${n} ${plural(n, { one: 'dag', other: 'dagen' })}`;

export const rituels = messages({
  fr: {
    /** Écran de la série (V6-GSerie). */
    streak: {
      record: 'C’est son record',
      letters: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as readonly string[],
      dayA11y: {
        done: (d: string): string => `${d} : séance faite`,
        joker: (d: string): string => `${d} : protégé par un joker`,
        missed: (d: string): string => `${d} : pas de séance`,
        today: (d: string): string => `${d} : aujourd’hui, à faire`,
        future: (d: string): string => `${d} : à venir`,
        not_yet: (d: string): string => `${d} : avant ton arrivée`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      /** Jour manqué, dit simplement. */
      reset: (best: number): string => `On repart quand tu veux. Ton record reste : ${days(best)}.`,
    },
  },
  en: {
    streak: {
      record: 'That’s its record',
      letters: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      dayA11y: {
        done: (d: string): string => `${d}: session done`,
        joker: (d: string): string => `${d}: protected by a joker`,
        missed: (d: string): string => `${d}: no session`,
        today: (d: string): string => `${d}: today, still to do`,
        future: (d: string): string => `${d}: coming up`,
        not_yet: (d: string): string => `${d}: before you joined`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `We start again whenever you like. Your record stays: ${daysEn(best)}.`,
    },
  },
  es: {
    streak: {
      record: 'Es su récord',
      letters: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      dayA11y: {
        done: (d: string): string => `${d}: sesión hecha`,
        joker: (d: string): string => `${d}: protegido por un comodín`,
        missed: (d: string): string => `${d}: sin sesión`,
        today: (d: string): string => `${d}: hoy, pendiente`,
        future: (d: string): string => `${d}: por llegar`,
        not_yet: (d: string): string => `${d}: antes de tu llegada`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `Retomamos cuando quieras. Tu récord se queda: ${daysEs(best)}.`,
    },
  },
  pt: {
    streak: {
      record: 'É o recorde dele',
      letters: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
      dayA11y: {
        done: (d: string): string => `${d}: sessão feita`,
        joker: (d: string): string => `${d}: protegido por um coringa`,
        missed: (d: string): string => `${d}: sem sessão`,
        today: (d: string): string => `${d}: hoje, a fazer`,
        future: (d: string): string => `${d}: ainda vai chegar`,
        not_yet: (d: string): string => `${d}: antes de você chegar`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `Recomeçamos quando você quiser. Seu recorde continua: ${daysPt(best)}.`,
    },
  },
  nl: {
    streak: {
      record: 'Dat is zijn record',
      letters: ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'],
      dayA11y: {
        done: (d: string): string => `${d}: sessie gedaan`,
        joker: (d: string): string => `${d}: beschermd door een joker`,
        missed: (d: string): string => `${d}: geen sessie`,
        today: (d: string): string => `${d}: vandaag, nog te doen`,
        future: (d: string): string => `${d}: komt nog`,
        not_yet: (d: string): string => `${d}: voor je erbij kwam`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `We beginnen opnieuw wanneer je wilt. Je record blijft: ${daysNl(best)}.`,
    },
  },
});
