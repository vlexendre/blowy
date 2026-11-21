/** Ligue de la semaine et trophées (maquette V7, « Moi › Ligue » et « Moi › Trophées »). */
import type { TrophyFamily } from '@blowy/domain';
import { messages, plural } from './runtime';

/** Rangs : 1st, 1.º, 1º, 1e. */
const ordEn = (n: number): string => {
  const t = n % 100;
  const u = n % 10;
  return `${n}${t >= 11 && t <= 13 ? 'th' : u === 1 ? 'st' : u === 2 ? 'nd' : u === 3 ? 'rd' : 'th'}`;
};
const ordEs = (n: number): string => `${n}.º`;
const ordPt = (n: number): string => `${n}º`;
const ordNl = (n: number): string => `${n}e`;

export const progression = messages({
  fr: {
    rows: {
      league: 'Ligue du quartier',
      leagueSub: (sparks: number, rank: number | null) =>
        `${sparks} ${plural(sparks, { one: 'étincelle', other: 'étincelles' })} cette semaine${rank ? ` · ${rank}${rank === 1 ? 'er' : 'e'}` : ''}`,
      leagueRank: (rank: number) => `${rank}${rank === 1 ? 'er' : 'e'} de ton quartier cette semaine`,
      leagueEmpty: 'Gagne des étincelles cette semaine',
      trophies: 'Trophées',
      trophiesSub: (won: number, total: number) => `${won} sur ${total}`,
    },
    league: {
      title: 'Ligue',
      intro:
        'Tes voisins, cette semaine. Les premiers montent de ligue dimanche soir, les derniers redescendent. La séance, un bonjour, un message : chaque geste donne des étincelles.',
      endsOn: (date: string) => `Fin de la semaine : ${date}`,
      you: 'Toi',
      sparks: (n: number) => `${n}`,
      rowA11y: (rank: number, name: string, n: number) =>
        `${rank}. ${name}, ${n} ${plural(n, { one: 'étincelle', other: 'étincelles' })}`,
      alone: 'Active ta position pour retrouver tes voisins dans la ligue.',
      tiers: {
        plume: 'Plume',
        pompon: 'Pompon',
        houppette: 'Houppette',
        couronne: 'Couronne',
        etoile: 'Étoile',
      },
      tierTitle: (name: string) => `Ligue ${name}`,
      goal: (left: number, next: string) =>
        left > 0
          ? `Encore ${left} ${plural(left, { one: 'étincelle', other: 'étincelles' })} cette semaine pour passer en ${next}`
          : `${next} la semaine prochaine, bravo !`,
      top: 'Tu es au sommet. Garde ta place la semaine prochaine.',
      goalZone: (left: number, next: string) =>
        left > 0
          ? `Encore ${left} ${plural(left, { one: 'étincelle', other: 'étincelles' })} pour entrer dans la zone de montée vers ${next}`
          : `Tu es dans la zone de montée : garde ta place jusqu’à dimanche pour passer en ${next} !`,
      zoneUp: (next: string) => `${next} la semaine prochaine`,
      goalShort: (left: number, next: string, days: number) =>
        `${left > 0 ? `Encore ${left} ${plural(left, { one: 'étincelle', other: 'étincelles' })} pour ${next}` : `Dans la zone de montée vers ${next}`} · ${days} ${plural(days, { one: 'jour', other: 'jours' })}`,
      topShort: (days: number) => `Tu es au sommet · ${days} ${plural(days, { one: 'jour', other: 'jours' })}`,
      sparksShort: (n: number) => `${n} ét.`,
      howRows: [
        { key: 'seance', label: 'Ta séance · vitesse + cohérence', value: '10 à 25' },
        { key: 'link', label: 'Un nouveau lien', value: '+20' },
        { key: 'wave', label: 'Un bonjour', value: '+5' },
        { key: 'message', label: 'Un message · 100 max', value: '+1' },
      ],
      zoneDown: (prev: string) => `Zone de descente vers ${prev}`,
      resultUp: (tier: string) => `Bravo ! Tu montes en Ligue ${tier}.`,
      resultDown: (tier: string) => `Tu redescends en Ligue ${tier}. Remonte dès cette semaine !`,
      resultStay: (tier: string, rank: number) =>
        `${rank}${rank === 1 ? 'er' : 'e'} la semaine dernière : tu restes en Ligue ${tier}.`,
      pill: (tier: string, rank: number) => `${tier} · ${rank}${rank === 1 ? 'er' : 'e'}`,
      pillA11y: (tier: string, rank: number) =>
        `Ligue ${tier}, ${rank}${rank === 1 ? 'er' : 'e'} cette semaine. Voir le classement`,
      howTitle: 'Gagner des étincelles',
      how: [
        {
          key: 'seance',
          title: 'Ta séance du jour',
          text: '10, plus la vitesse (jusqu’à 5) et la cohérence avec tes réponses d’avant (jusqu’à 10)',
          value: '10 à 25',
        },
        { key: 'link', title: 'Un nouveau lien', text: 'Quelqu’un a répondu à ton bonjour', value: '+20' },
        { key: 'wave', title: 'Un bonjour', text: 'À quelqu’un que ton minimoa te présente', value: '+5' },
        { key: 'message', title: 'Un message', text: '100 par semaine au plus', value: '+1' },
      ],
      howNote:
        'Répondre vite rapporte, mais au hasard, tu perds la cohérence. Ta ligue de la semaine dépend de tes étincelles de la semaine d’avant.',
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
  en: {
    rows: {
      league: 'Neighbourhood league',
      leagueSub: (sparks: number, rank: number | null) =>
        `${sparks} ${plural(sparks, { one: 'spark', other: 'sparks' })} this week${rank ? ` · ${ordEn(rank)}` : ''}`,
      leagueRank: (rank: number) => `${ordEn(rank)} in your neighbourhood this week`,
      leagueEmpty: 'Earn sparks this week',
      trophies: 'Trophies',
      trophiesSub: (won: number, total: number) => `${won} of ${total}`,
    },
    league: {
      title: 'League',
      intro:
        'Your neighbours, this week. The top ones move up on Sunday evening, the bottom ones move down. Your session, a hello, a message: every move earns sparks.',
      endsOn: (date: string) => `Week ends: ${date}`,
      you: 'You',
      sparks: (n: number) => `${n}`,
      rowA11y: (rank: number, name: string, n: number) =>
        `${rank}. ${name}, ${n} ${plural(n, { one: 'spark', other: 'sparks' })}`,
      alone: 'Turn on your location to find your neighbours in the league.',
      tiers: {
        plume: 'Plume',
        pompon: 'Pompon',
        houppette: 'Houppette',
        couronne: 'Couronne',
        etoile: 'Étoile',
      },
      tierTitle: (name: string) => `${name} League`,
      goal: (left: number, next: string) =>
        left > 0
          ? `${left} more ${plural(left, { one: 'spark', other: 'sparks' })} this week to reach ${next}`
          : `${next} next week, well done!`,
      top: 'You’re at the top. Hold your place next week.',
      goalZone: (left: number, next: string) =>
        left > 0
          ? `${left} more ${plural(left, { one: 'spark', other: 'sparks' })} to enter the promotion zone to ${next}`
          : `You’re in the promotion zone: hold your place until Sunday to reach ${next}!`,
      zoneUp: (next: string) => `${next} next week`,
      goalShort: (left: number, next: string, days: number) =>
        `${left > 0 ? `${left} more ${plural(left, { one: 'spark', other: 'sparks' })} for ${next}` : `In the promotion zone to ${next}`} · ${days} ${plural(days, { one: 'day', other: 'days' })}`,
      topShort: (days: number) => `You’re at the top · ${days} ${plural(days, { one: 'day', other: 'days' })}`,
      sparksShort: (n: number) => `${n} sp.`,
      howRows: [
        { key: 'seance', label: 'Your session · speed + consistency', value: '10 to 25' },
        { key: 'link', label: 'A new link', value: '+20' },
        { key: 'wave', label: 'A hello', value: '+5' },
        { key: 'message', label: 'A message · 100 max', value: '+1' },
      ],
      zoneDown: (prev: string) => `Demotion zone to ${prev}`,
      resultUp: (tier: string) => `Well done! You move up to the ${tier} League.`,
      resultDown: (tier: string) => `You move down to the ${tier} League. Climb back this week!`,
      resultStay: (tier: string, rank: number) =>
        `${ordEn(rank)} last week: you stay in the ${tier} League.`,
      pill: (tier: string, rank: number) => `${tier} · ${ordEn(rank)}`,
      pillA11y: (tier: string, rank: number) =>
        `${tier} League, ${ordEn(rank)} this week. See the ranking`,
      howTitle: 'Earn sparks',
      how: [
        {
          key: 'seance',
          title: 'Today’s session',
          text: '10, plus speed (up to 5) and consistency with your earlier answers (up to 10)',
          value: '10 to 25',
        },
        { key: 'link', title: 'A new link', text: 'Someone answered your hello', value: '+20' },
        { key: 'wave', title: 'A hello', text: 'To someone your minimoa introduces', value: '+5' },
        { key: 'message', title: 'A message', text: '100 per week at most', value: '+1' },
      ],
      howNote:
        'Answering fast pays, but answer at random and you lose consistency. This week’s league depends on your sparks from the week before.',
      error: 'Couldn’t load the league.',
    },
    trophies: {
      title: 'Trophies',
      count: (won: number, total: number) => `${won} of ${total}`,
      names: {
        bonjour: 'First step',
        serie: 'On fire',
        bavard: 'Chatterbox',
        communs: 'Soulmates',
        introspection: 'Introspective',
        explorateur: 'Explorer',
      } satisfies Record<TrophyFamily, string>,
      goal: (family: TrophyFamily, value: number, next: number) => {
        const unit: Record<TrophyFamily, { one: string; other: string }> = {
          bonjour: { one: 'hello', other: 'hellos' },
          serie: { one: 'day in a row', other: 'days in a row' },
          bavard: { one: 'message', other: 'messages' },
          communs: { one: 'link', other: 'links' },
          introspection: { one: 'session', other: 'sessions' },
          explorateur: { one: 'neighbourhood', other: 'neighbourhoods' },
        };
        return `${Math.min(value, next)}/${next} ${plural(next, unit[family])}`;
      },
      done: 'Gold won',
      error: 'Couldn’t load your trophies.',
    },
  },
  es: {
    rows: {
      league: 'Liga del barrio',
      leagueSub: (sparks: number, rank: number | null) =>
        `${sparks} ${plural(sparks, { one: 'chispa', other: 'chispas' })} esta semana${rank ? ` · ${ordEs(rank)}` : ''}`,
      leagueRank: (rank: number) => `${ordEs(rank)} de tu barrio esta semana`,
      leagueEmpty: 'Gana chispas esta semana',
      trophies: 'Trofeos',
      trophiesSub: (won: number, total: number) => `${won} de ${total}`,
    },
    league: {
      title: 'Liga',
      intro:
        'Tus vecinos, esta semana. Los primeros suben de liga el domingo por la noche, los últimos bajan. La sesión, un hola, un mensaje: cada gesto da chispas.',
      endsOn: (date: string) => `Fin de la semana: ${date}`,
      you: 'Tú',
      sparks: (n: number) => `${n}`,
      rowA11y: (rank: number, name: string, n: number) =>
        `${rank}. ${name}, ${n} ${plural(n, { one: 'chispa', other: 'chispas' })}`,
      alone: 'Activa tu ubicación para encontrar a tus vecinos en la liga.',
      tiers: {
        plume: 'Plume',
        pompon: 'Pompon',
        houppette: 'Houppette',
        couronne: 'Couronne',
        etoile: 'Étoile',
      },
      tierTitle: (name: string) => `Liga ${name}`,
      goal: (left: number, next: string) =>
        left > 0
          ? `Te ${plural(left, { one: 'falta', other: 'faltan' })} ${left} ${plural(left, { one: 'chispa', other: 'chispas' })} esta semana para pasar a ${next}`
          : `¡${next} la semana que viene, bravo!`,
      top: 'Estás en la cima. Mantén tu puesto la semana que viene.',
      goalZone: (left: number, next: string) =>
        left > 0
          ? `Te ${plural(left, { one: 'falta', other: 'faltan' })} ${left} ${plural(left, { one: 'chispa', other: 'chispas' })} para entrar en la zona de ascenso a ${next}`
          : `Estás en la zona de ascenso: ¡mantén tu puesto hasta el domingo para pasar a ${next}!`,
      zoneUp: (next: string) => `${next} la semana que viene`,
      goalShort: (left: number, next: string, days: number) =>
        `${left > 0 ? `${left} ${plural(left, { one: 'chispa', other: 'chispas' })} más para ${next}` : `En la zona de ascenso a ${next}`} · ${days} ${plural(days, { one: 'día', other: 'días' })}`,
      topShort: (days: number) => `Estás en la cima · ${days} ${plural(days, { one: 'día', other: 'días' })}`,
      sparksShort: (n: number) => `${n} ch.`,
      howRows: [
        { key: 'seance', label: 'Tu sesión · rapidez + coherencia', value: '10 a 25' },
        { key: 'link', label: 'Un nuevo vínculo', value: '+20' },
        { key: 'wave', label: 'Un hola', value: '+5' },
        { key: 'message', label: 'Un mensaje · 100 máx.', value: '+1' },
      ],
      zoneDown: (prev: string) => `Zona de descenso a ${prev}`,
      resultUp: (tier: string) => `¡Bravo! Subes a la Liga ${tier}.`,
      resultDown: (tier: string) => `Bajas a la Liga ${tier}. ¡Vuelve a subir esta semana!`,
      resultStay: (tier: string, rank: number) =>
        `${ordEs(rank)} la semana pasada: te quedas en la Liga ${tier}.`,
      pill: (tier: string, rank: number) => `${tier} · ${ordEs(rank)}`,
      pillA11y: (tier: string, rank: number) =>
        `Liga ${tier}, ${ordEs(rank)} esta semana. Ver la clasificación`,
      howTitle: 'Ganar chispas',
      how: [
        {
          key: 'seance',
          title: 'Tu sesión del día',
          text: '10, más la rapidez (hasta 5) y la coherencia con tus respuestas anteriores (hasta 10)',
          value: '10 a 25',
        },
        { key: 'link', title: 'Un nuevo vínculo', text: 'Alguien respondió a tu hola', value: '+20' },
        { key: 'wave', title: 'Un hola', text: 'A alguien que tu minimoa te presenta', value: '+5' },
        { key: 'message', title: 'Un mensaje', text: '100 por semana como máximo', value: '+1' },
      ],
      howNote:
        'Responder rápido da puntos, pero si respondes al azar pierdes coherencia. Tu liga de la semana depende de tus chispas de la semana anterior.',
      error: 'No se pudo cargar la liga.',
    },
    trophies: {
      title: 'Trofeos',
      count: (won: number, total: number) => `${won} de ${total}`,
      names: {
        bonjour: 'Primer paso',
        serie: 'Racha en llamas',
        bavard: 'Charlatán',
        communs: 'Almas gemelas',
        introspection: 'Introspectivo',
        explorateur: 'Explorador',
      } satisfies Record<TrophyFamily, string>,
      goal: (family: TrophyFamily, value: number, next: number) => {
        const unit: Record<TrophyFamily, { one: string; other: string }> = {
          bonjour: { one: 'hola', other: 'holas' },
          serie: { one: 'día seguido', other: 'días seguidos' },
          bavard: { one: 'mensaje', other: 'mensajes' },
          communs: { one: 'vínculo', other: 'vínculos' },
          introspection: { one: 'sesión', other: 'sesiones' },
          explorateur: { one: 'barrio', other: 'barrios' },
        };
        return `${Math.min(value, next)}/${next} ${plural(next, unit[family])}`;
      },
      done: 'Oro ganado',
      error: 'No se pudieron cargar tus trofeos.',
    },
  },
  pt: {
    rows: {
      league: 'Liga do bairro',
      leagueSub: (sparks: number, rank: number | null) =>
        `${sparks} ${plural(sparks, { one: 'faísca', other: 'faíscas' })} esta semana${rank ? ` · ${ordPt(rank)}` : ''}`,
      leagueRank: (rank: number) => `${ordPt(rank)} do seu bairro esta semana`,
      leagueEmpty: 'Ganhe faíscas esta semana',
      trophies: 'Troféus',
      trophiesSub: (won: number, total: number) => `${won} de ${total}`,
    },
    league: {
      title: 'Liga',
      intro:
        'Seus vizinhos, esta semana. Os primeiros sobem de liga no domingo à noite, os últimos descem. A sessão, um oi, uma mensagem: cada gesto dá faíscas.',
      endsOn: (date: string) => `Fim da semana: ${date}`,
      you: 'Você',
      sparks: (n: number) => `${n}`,
      rowA11y: (rank: number, name: string, n: number) =>
        `${rank}. ${name}, ${n} ${plural(n, { one: 'faísca', other: 'faíscas' })}`,
      alone: 'Ative sua localização para encontrar seus vizinhos na liga.',
      tiers: {
        plume: 'Plume',
        pompon: 'Pompon',
        houppette: 'Houppette',
        couronne: 'Couronne',
        etoile: 'Étoile',
      },
      tierTitle: (name: string) => `Liga ${name}`,
      goal: (left: number, next: string) =>
        left > 0
          ? `Faltam ${left} ${plural(left, { one: 'faísca', other: 'faíscas' })} esta semana para passar para ${next}`
          : `${next} na semana que vem, parabéns!`,
      top: 'Você está no topo. Mantenha seu lugar na semana que vem.',
      goalZone: (left: number, next: string) =>
        left > 0
          ? `Faltam ${left} ${plural(left, { one: 'faísca', other: 'faíscas' })} para entrar na zona de subida para ${next}`
          : `Você está na zona de subida: mantenha seu lugar até domingo para passar para ${next}!`,
      zoneUp: (next: string) => `${next} na semana que vem`,
      goalShort: (left: number, next: string, days: number) =>
        `${left > 0 ? `Mais ${left} ${plural(left, { one: 'faísca', other: 'faíscas' })} para ${next}` : `Na zona de subida para ${next}`} · ${days} ${plural(days, { one: 'dia', other: 'dias' })}`,
      topShort: (days: number) => `Você está no topo · ${days} ${plural(days, { one: 'dia', other: 'dias' })}`,
      sparksShort: (n: number) => `${n} fa.`,
      howRows: [
        { key: 'seance', label: 'Sua sessão · rapidez + coerência', value: '10 a 25' },
        { key: 'link', label: 'Um novo vínculo', value: '+20' },
        { key: 'wave', label: 'Um oi', value: '+5' },
        { key: 'message', label: 'Uma mensagem · 100 máx.', value: '+1' },
      ],
      zoneDown: (prev: string) => `Zona de descida para ${prev}`,
      resultUp: (tier: string) => `Parabéns! Você sobe para a Liga ${tier}.`,
      resultDown: (tier: string) => `Você desce para a Liga ${tier}. Suba de novo esta semana!`,
      resultStay: (tier: string, rank: number) =>
        `${ordPt(rank)} na semana passada: você fica na Liga ${tier}.`,
      pill: (tier: string, rank: number) => `${tier} · ${ordPt(rank)}`,
      pillA11y: (tier: string, rank: number) =>
        `Liga ${tier}, ${ordPt(rank)} esta semana. Ver a classificação`,
      howTitle: 'Ganhar faíscas',
      how: [
        {
          key: 'seance',
          title: 'Sua sessão do dia',
          text: '10, mais a rapidez (até 5) e a coerência com suas respostas anteriores (até 10)',
          value: '10 a 25',
        },
        { key: 'link', title: 'Um novo vínculo', text: 'Alguém respondeu ao seu oi', value: '+20' },
        { key: 'wave', title: 'Um oi', text: 'Para alguém que seu minimoa te apresenta', value: '+5' },
        { key: 'message', title: 'Uma mensagem', text: 'No máximo 100 por semana', value: '+1' },
      ],
      howNote:
        'Responder rápido rende, mas no chute você perde coerência. Sua liga da semana depende das suas faíscas da semana anterior.',
      error: 'Não foi possível carregar a liga.',
    },
    trophies: {
      title: 'Troféus',
      count: (won: number, total: number) => `${won} de ${total}`,
      names: {
        bonjour: 'Primeiro passo',
        serie: 'Sequência em chamas',
        bavard: 'Tagarela',
        communs: 'Almas gêmeas',
        introspection: 'Introspectivo',
        explorateur: 'Explorador',
      } satisfies Record<TrophyFamily, string>,
      goal: (family: TrophyFamily, value: number, next: number) => {
        const unit: Record<TrophyFamily, { one: string; other: string }> = {
          bonjour: { one: 'oi', other: 'ois' },
          serie: { one: 'dia seguido', other: 'dias seguidos' },
          bavard: { one: 'mensagem', other: 'mensagens' },
          communs: { one: 'vínculo', other: 'vínculos' },
          introspection: { one: 'sessão', other: 'sessões' },
          explorateur: { one: 'bairro', other: 'bairros' },
        };
        return `${Math.min(value, next)}/${next} ${plural(next, unit[family])}`;
      },
      done: 'Ouro conquistado',
      error: 'Não foi possível carregar seus troféus.',
    },
  },
  nl: {
    rows: {
      league: 'Buurtcompetitie',
      leagueSub: (sparks: number, rank: number | null) =>
        `${sparks} ${plural(sparks, { one: 'vonk', other: 'vonken' })} deze week${rank ? ` · ${ordNl(rank)}` : ''}`,
      leagueRank: (rank: number) => `${ordNl(rank)} in je buurt deze week`,
      leagueEmpty: 'Verdien deze week vonken',
      trophies: 'Trofeeën',
      trophiesSub: (won: number, total: number) => `${won} van ${total}`,
    },
    league: {
      title: 'Competitie',
      intro:
        'Je buren, deze week. De bovensten promoveren zondagavond, de onderste degraderen. Je sessie, een hallo, een bericht: elk gebaar levert vonken op.',
      endsOn: (date: string) => `Einde van de week: ${date}`,
      you: 'Jij',
      sparks: (n: number) => `${n}`,
      rowA11y: (rank: number, name: string, n: number) =>
        `${rank}. ${name}, ${n} ${plural(n, { one: 'vonk', other: 'vonken' })}`,
      alone: 'Zet je locatie aan om je buren in de competitie te vinden.',
      tiers: {
        plume: 'Plume',
        pompon: 'Pompon',
        houppette: 'Houppette',
        couronne: 'Couronne',
        etoile: 'Étoile',
      },
      tierTitle: (name: string) => `${name}-competitie`,
      goal: (left: number, next: string) =>
        left > 0
          ? `Nog ${left} ${plural(left, { one: 'vonk', other: 'vonken' })} deze week om naar ${next} te gaan`
          : `Volgende week ${next}, goed zo!`,
      top: 'Je staat bovenaan. Houd je plek volgende week vast.',
      goalZone: (left: number, next: string) =>
        left > 0
          ? `Nog ${left} ${plural(left, { one: 'vonk', other: 'vonken' })} om de promotiezone naar ${next} in te gaan`
          : `Je zit in de promotiezone: houd je plek vast tot zondag om naar ${next} te gaan!`,
      zoneUp: (next: string) => `Volgende week ${next}`,
      goalShort: (left: number, next: string, days: number) =>
        `${left > 0 ? `Nog ${left} ${plural(left, { one: 'vonk', other: 'vonken' })} voor ${next}` : `In de promotiezone naar ${next}`} · ${days} ${plural(days, { one: 'dag', other: 'dagen' })}`,
      topShort: (days: number) => `Je staat bovenaan · ${days} ${plural(days, { one: 'dag', other: 'dagen' })}`,
      sparksShort: (n: number) => `${n} vk.`,
      howRows: [
        { key: 'seance', label: 'Je sessie · snelheid + samenhang', value: '10 tot 25' },
        { key: 'link', label: 'Een nieuwe band', value: '+20' },
        { key: 'wave', label: 'Een hallo', value: '+5' },
        { key: 'message', label: 'Een bericht · max. 100', value: '+1' },
      ],
      zoneDown: (prev: string) => `Degradatiezone naar ${prev}`,
      resultUp: (tier: string) => `Goed zo! Je promoveert naar de ${tier}-competitie.`,
      resultDown: (tier: string) => `Je degradeert naar de ${tier}-competitie. Klim deze week weer omhoog!`,
      resultStay: (tier: string, rank: number) =>
        `${ordNl(rank)} vorige week: je blijft in de ${tier}-competitie.`,
      pill: (tier: string, rank: number) => `${tier} · ${ordNl(rank)}`,
      pillA11y: (tier: string, rank: number) =>
        `${tier}-competitie, ${ordNl(rank)} deze week. Bekijk de stand`,
      howTitle: 'Vonken verdienen',
      how: [
        {
          key: 'seance',
          title: 'Je sessie van vandaag',
          text: '10, plus snelheid (tot 5) en samenhang met je eerdere antwoorden (tot 10)',
          value: '10 tot 25',
        },
        { key: 'link', title: 'Een nieuwe band', text: 'Iemand heeft op je hallo gereageerd', value: '+20' },
        { key: 'wave', title: 'Een hallo', text: 'Aan iemand die je minimoa aan je voorstelt', value: '+5' },
        { key: 'message', title: 'Een bericht', text: 'Hoogstens 100 per week', value: '+1' },
      ],
      howNote:
        'Snel antwoorden loont, maar op de gok verlies je samenhang. Je competitie van deze week hangt af van je vonken van de week ervoor.',
      error: 'De competitie kan niet worden geladen.',
    },
    trophies: {
      title: 'Trofeeën',
      count: (won: number, total: number) => `${won} van ${total}`,
      names: {
        bonjour: 'Eerste stap',
        serie: 'Reeks in vuur',
        bavard: 'Kletskous',
        communs: 'Zielsverwanten',
        introspection: 'Introspectief',
        explorateur: 'Ontdekker',
      } satisfies Record<TrophyFamily, string>,
      goal: (family: TrophyFamily, value: number, next: number) => {
        const unit: Record<TrophyFamily, { one: string; other: string }> = {
          bonjour: { one: 'hallo', other: 'hallo’s' },
          serie: { one: 'dag op rij', other: 'dagen op rij' },
          bavard: { one: 'bericht', other: 'berichten' },
          communs: { one: 'band', other: 'banden' },
          introspection: { one: 'sessie', other: 'sessies' },
          explorateur: { one: 'buurt', other: 'buurten' },
        };
        return `${Math.min(value, next)}/${next} ${plural(next, unit[family])}`;
      },
      done: 'Goud gewonnen',
      error: 'Je trofeeën kunnen niet worden geladen.',
    },
  },
});
