/** Ligue de la semaine et trophées (maquette V7, « Moi › Ligue » et « Moi › Trophées »). */
import { TODO } from '@blowy/content';
import type { TrophyFamily } from '@blowy/domain';
import { messages, plural } from './runtime';

export const progression = messages({
  fr: {
    rows: {
      league: 'Ligue du quartier',
      leagueSub: (sparks: number, rank: number | null) =>
        `${sparks} ${plural(sparks, { one: 'étincelle', other: 'étincelles' })} cette semaine${rank ? ` · ${rank}${rank === 1 ? 'er' : 'e'}` : ''}`,
      trophies: 'Trophées',
      trophiesSub: (won: number, total: number) => `${won} sur ${total}`,
    },
    league: {
      title: 'Ligue',
      intro: 'Tes voisins, cette semaine. La séance, un bonjour, un message : chaque geste donne des étincelles.',
      endsOn: (date: string) => `Fin de la semaine : ${date}`,
      you: 'Toi',
      sparks: (n: number) => `${n}`,
      rowA11y: (rank: number, name: string, n: number) => `${rank}. ${name}, ${n} ${plural(n, { one: 'étincelle', other: 'étincelles' })}`,
      alone: 'Active ta position pour retrouver tes voisins dans la ligue.',
      error: 'Impossible de charger la ligue.',
    },
    trophies: {
      title: 'Trophées',
      count: (won: number, total: number) => `${won} sur ${total}`,
      names: {
        bonjour: 'Premier pas',
        serie: 'Série en feu',
        bavard: 'Bavard',
        communs: 'Âmes sœurs',
        introspection: 'Introspectif',
        explorateur: 'Explorateur',
      } satisfies Record<TrophyFamily, string>,
      goal: (family: TrophyFamily, value: number, next: number) => {
        const unit: Record<TrophyFamily, { one: string; other: string }> = {
          bonjour: { one: 'bonjour', other: 'bonjours' },
          serie: { one: 'jour d’affilée', other: 'jours d’affilée' },
          bavard: { one: 'message', other: 'messages' },
          communs: { one: 'lien', other: 'liens' },
          introspection: { one: 'séance', other: 'séances' },
          explorateur: { one: 'quartier', other: 'quartiers' },
        };
        return `${Math.min(value, next)}/${next} ${plural(next, unit[family])}`;
      },
      done: 'Or gagné',
      error: 'Impossible de charger tes trophées.',
    },
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
