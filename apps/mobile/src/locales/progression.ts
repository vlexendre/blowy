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
      tiers: { plume: 'Plume', pompon: 'Pompon', houppette: 'Houppette', couronne: 'Couronne', etoile: 'Étoile' },
      tierTitle: (name: string) => `Ligue ${name}`,
      goal: (left: number, next: string) =>
        left > 0 ? `Encore ${left} ${plural(left, { one: 'étincelle', other: 'étincelles' })} cette semaine pour passer en ${next}` : `${next} la semaine prochaine, bravo !`,
      top: 'Tu es au sommet. Garde ta place la semaine prochaine.',
      howTitle: 'Gagner des étincelles',
      how: [
        { key: 'seance', title: 'Ta séance du jour', text: '10, plus la vitesse (jusqu’à 5) et la cohérence avec tes réponses d’avant (jusqu’à 10)', value: '10 à 25' },
        { key: 'link', title: 'Un nouveau lien', text: 'Quelqu’un a répondu à ton bonjour', value: '+20' },
        { key: 'wave', title: 'Un bonjour', text: 'À quelqu’un que ton minimoa te présente', value: '+5' },
        { key: 'message', title: 'Un message', text: '100 par semaine au plus', value: '+1' },
      ],
      howNote: 'Répondre vite rapporte, mais au hasard, tu perds la cohérence. Ta ligue de la semaine dépend de tes étincelles de la semaine d’avant.',
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
