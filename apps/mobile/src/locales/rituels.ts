/**
 * Textes de la série qui restent des rituels (V7) : la fête d'une série sur l'accueil et le cadre de l'écran de la série
 * (lettres des jours, libellés lus, record). Défi, habitudes, preuves, souvenirs et bilans sont supprimés de l'app.
 */
import type { TitleSegment } from '@blowy/ui';

import { formatDate, messages, plural } from './runtime';

const days = (n: number): string => `${n} ${plural(n, { one: 'jour', other: 'jours' })}`;
const daysEn = (n: number): string => `${n} ${plural(n, { one: 'day', other: 'days' })}`;
const daysEs = (n: number): string => `${n} ${plural(n, { one: 'día', other: 'días' })}`;
const daysPt = (n: number): string => `${n} ${plural(n, { one: 'dia', other: 'dias' })}`;
const daysNl = (n: number): string => `${n} ${plural(n, { one: 'dag', other: 'dagen' })}`;

export const rituels = messages({
  fr: {
    /** Fête d'un défi relevé. */
    celebrate: {
      kicker: 'Défi relevé',
      title: (n: number): TitleSegment[] => [{ text: n > 1 ? 'JOURS\n' : 'JOUR\n' }, { text: 'DE SÉRIE.', dim: true }],
      record: 'C’est son record',
      tap: 'Touche pour continuer',
      fallback: 'Sa mèche brûle un peu plus fort.',
    },
    /** Écran de la série (V6-GSerie). */
    streak: {
      record: 'C’est son record',
      letters: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as readonly string[],
      dayA11y: {
        done: (d: string): string => `${d} : défi relevé`,
        joker: (d: string): string => `${d} : protégé par un joker`,
        missed: (d: string): string => `${d} : pas de défi`,
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
    celebrate: {
      kicker: 'Challenge done',
      title: (n: number): TitleSegment[] => [{ text: n === 1 ? 'DAY\n' : 'DAYS\n' }, { text: 'IN A ROW.', dim: true }],
      record: 'That’s its record',
      tap: 'Tap to continue',
      fallback: 'Its flame burns a little brighter.',
    },
    streak: {
      record: 'That’s its record',
      letters: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      dayA11y: {
        done: (d: string): string => `${d}: challenge done`,
        joker: (d: string): string => `${d}: protected by a joker`,
        missed: (d: string): string => `${d}: no challenge`,
        today: (d: string): string => `${d}: today, still to do`,
        future: (d: string): string => `${d}: coming up`,
        not_yet: (d: string): string => `${d}: before you joined`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `We start again whenever you like. Your record stays: ${daysEn(best)}.`,
    },
  },
  es: {
    celebrate: {
      kicker: 'Reto superado',
      title: (n: number): TitleSegment[] => [{ text: n === 1 ? 'DÍA\n' : 'DÍAS\n' }, { text: 'DE RACHA.', dim: true }],
      record: 'Es su récord',
      tap: 'Toca para continuar',
      fallback: 'Su llama arde un poco más fuerte.',
    },
    streak: {
      record: 'Es su récord',
      letters: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      dayA11y: {
        done: (d: string): string => `${d}: reto superado`,
        joker: (d: string): string => `${d}: protegido por un comodín`,
        missed: (d: string): string => `${d}: sin reto`,
        today: (d: string): string => `${d}: hoy, pendiente`,
        future: (d: string): string => `${d}: por llegar`,
        not_yet: (d: string): string => `${d}: antes de tu llegada`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `Retomamos cuando quieras. Tu récord se queda: ${daysEs(best)}.`,
    },
  },
  pt: {
    celebrate: {
      kicker: 'Desafio cumprido',
      title: (n: number): TitleSegment[] => [{ text: n === 1 ? 'DIA\n' : 'DIAS\n' }, { text: n === 1 ? 'SEGUIDO.' : 'SEGUIDOS.', dim: true }],
      record: 'É o recorde dele',
      tap: 'Toque para continuar',
      fallback: 'A chama dele brilha um pouco mais forte.',
    },
    streak: {
      record: 'É o recorde dele',
      letters: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
      dayA11y: {
        done: (d: string): string => `${d}: desafio cumprido`,
        joker: (d: string): string => `${d}: protegido por um coringa`,
        missed: (d: string): string => `${d}: sem desafio`,
        today: (d: string): string => `${d}: hoje, a fazer`,
        future: (d: string): string => `${d}: ainda vai chegar`,
        not_yet: (d: string): string => `${d}: antes de você chegar`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `Recomeçamos quando você quiser. Seu recorde continua: ${daysPt(best)}.`,
    },
  },
  nl: {
    celebrate: {
      kicker: 'Uitdaging gehaald',
      title: (n: number): TitleSegment[] => [{ text: n === 1 ? 'DAG\n' : 'DAGEN\n' }, { text: 'OP RIJ.', dim: true }],
      record: 'Dat is zijn record',
      tap: 'Tik om verder te gaan',
      fallback: 'Zijn vlammetje brandt wat feller.',
    },
    streak: {
      record: 'Dat is zijn record',
      letters: ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'],
      dayA11y: {
        done: (d: string): string => `${d}: uitdaging gehaald`,
        joker: (d: string): string => `${d}: beschermd door een joker`,
        missed: (d: string): string => `${d}: geen uitdaging`,
        today: (d: string): string => `${d}: vandaag, nog te doen`,
        future: (d: string): string => `${d}: komt nog`,
        not_yet: (d: string): string => `${d}: voor je erbij kwam`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      reset: (best: number): string => `We beginnen opnieuw wanneer je wilt. Je record blijft: ${daysNl(best)}.`,
    },
  },
});
