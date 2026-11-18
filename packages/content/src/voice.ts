/**
 * Voix des minimoas dans les liens (événements de jeu) et dans les rencontres, par langue.
 * Fonctions pures : la variante est choisie par `seed` (entier stable fourni par l'appelant), jamais par un tirage.
 * Ton : phrases courtes, humour sec, pas d'emoji. Les interventions dans la conversation sont dans `v7/chat`.
 */
import type { Locale } from '@blowy/domain';
import { defineMessages } from './i18n/core';

/** Les deux minimoas d'un lien, vus depuis celui qui parle. */
export interface PetPair {
  /** Nom du minimoa qui parle. */
  self: string;
  /** Nom de l'autre minimoa. */
  other: string;
}

export type EncounterVia = 'friend_of_friend' | 'nearby' | 'new';

type Line<A extends unknown[]> = readonly ((...args: A) => string)[];

const fr = {
  lifeLost: [
    (other: string, lives: string) => `Hier, silence radio. Il nous reste ${lives}.`,
    (other: string, lives: string) => `${other} et moi, on a attendu toute la journée. Plus que ${lives}.`,
    (other: string, lives: string) => `Un mot suffit à nous garder en forme. ${lives} au compteur.`,
    (other: string, lives: string) => `On s’ennuie un peu. On en est à ${lives}.`,
  ] as Line<[string, string]>,
  /** « 3 vies », « une seule vie ». */
  lives: (n: number) => (n > 1 ? `${n} vies` : 'une seule vie'),
  lifeGained: [
    (other: string, lives: number) => `Une vie de plus. On remonte à ${lives}.`,
    (other: string, lives: number) => `${other} et moi, on revit. ${lives} vies.`,
    (other: string, lives: number) => `Ça, c’est de l’entretien de lien. ${lives} vies.`,
  ] as Line<[string, number]>,
  levelUp: [
    (other: string, title: string) => `Nouveau niveau : « ${title} ». ${other}, on a grandi.`,
    (other: string, title: string) => `${title}. Je n’en attendais pas moins.`,
    (other: string, title: string) => `On passe à « ${title} ». Je fais la danse de la victoire. Discrètement.`,
    (other: string, title: string) => `Niveau suivant : « ${title} ». ${other} fait semblant de ne pas être fier.`,
  ] as Line<[string, string]>,
  ghost: [
    (other: string) => `Plus de vies. ${other} et moi, on devient transparents.`,
    (other: string) => `Le lien s’est endormi. On peut encore le réveiller, une fois.`,
    (other: string) => `On est des fantômes, maintenant. Il fait un peu froid.`,
  ] as Line<[string]>,
  revived: [
    (other: string) => `On est revenus. ${other}, on ne refait plus jamais ça.`,
    (other: string) => `Deuxième chance. Je la garde précieusement.`,
    (other: string) => `Ranimés. Je respire. Merci.`,
  ] as Line<[string]>,
  /** Palier de série d'un lien (3, 7, 14… jours d'affilée où les deux se sont écrit). */
  streakMilestone: [
    (other: string, days: number) => `${days} jours d’affilée à vous écrire. ${other} et moi, on le note quelque part.`,
    (other: string, days: number) => `${days} jours sans un trou dans la conversation. Joli duo.`,
    (other: string, days: number) => `Série de ${days} jours. Je fais semblant de ne pas compter. Je compte.`,
  ] as Line<[string, number]>,
  encounterWhere: {
    friend: [(mutual: string) => `Je l’ai rencontré chez ${mutual}.`, (mutual: string) => `C’est un pote du minimoa de ${mutual}.`] as Line<[string]>,
    nearby: ['On n’habite pas loin l’un de l’autre.', 'Il traîne dans ton quartier.'] as readonly string[],
    other: ['Je l’ai rencontré en balade.', 'Tout nouveau dans le coin.'] as readonly string[],
  },
  encounterVibe: {
    high: ['On a tout de suite accroché.', 'On se ressemble beaucoup.'] as readonly string[],
    mid: ['On s’est bien amusés.', 'On a des trucs en commun.'] as readonly string[],
    low: ['On est très différents. C’est ce qui me plaît.', 'Sacrée surprise, cette rencontre.'] as readonly string[],
  },
  wavedAtYou: [
    (other: string) => `${other} m’a fait signe. On répond ?`,
    (other: string) => `${other} est passé dire bonjour. Ça a l’air sympa.`,
    (other: string) => `${other} tourne autour de moi. Ça sent l’envie de jouer.`,
  ] as Line<[string]>,
  /** Bandeaux du système dans un lien. */
  system: {
    revived: 'Le lien est ranimé. Il ne pourra pas l’être une deuxième fois.',
    levelUp: (title: string, text: string) => `Niveau atteint : « ${title} ». ${text}`,
  },
};

export const voiceText = defineMessages({
  fr,
  en: {
    lifeLost: [
      (other: string, lives: string) => `Yesterday, radio silence. We’re down to ${lives}.`,
      (other: string, lives: string) => `${other} and I waited all day. Only ${lives} left.`,
      (other: string, lives: string) => `One word is all it takes to keep us going. Counter says ${lives}.`,
      (other: string, lives: string) => `We’re getting a little bored. We’re at ${lives}.`,
    ],
    lives: (n: number) => (n > 1 ? `${n} lives` : 'just one life'),
    lifeGained: [
      (other: string, lives: number) => `One more life. Back up to ${lives}.`,
      (other: string, lives: number) => `${other} and I are alive again. ${lives} lives.`,
      (other: string, lives: number) => `Now that’s link maintenance. ${lives} lives.`,
    ],
    levelUp: [
      (other: string, title: string) => `New level: “${title}”. ${other}, we’ve grown up.`,
      (other: string, title: string) => `${title}. I expected nothing less.`,
      (other: string, title: string) => `On to “${title}”. I’m doing a victory dance. Discreetly.`,
      (other: string, title: string) => `Next level: “${title}”. ${other} is pretending not to be proud.`,
    ],
    ghost: [
      (other: string) => `No lives left. ${other} and I are turning see-through.`,
      (other: string) => `The link has fallen asleep. We can still wake it up, once.`,
      (other: string) => `We’re ghosts now. It’s a little chilly.`,
    ],
    revived: [
      (other: string) => `We’re back. ${other}, let’s never do that again.`,
      (other: string) => `Second chance. I’m keeping this one safe.`,
      (other: string) => `Revived. I can breathe. Thank you.`,
    ],
    streakMilestone: [
      (other: string, days: number) => `${days} days in a row writing to each other. ${other} and I are making a note of it.`,
      (other: string, days: number) => `${days} days without a gap in the conversation. Nice pair.`,
      (other: string, days: number) => `${days}-day streak. I’m pretending not to count. I’m counting.`,
    ],
    encounterWhere: {
      friend: [(mutual: string) => `I ran into them at ${mutual}’s.`, (mutual: string) => `They’re a friend of ${mutual}’s minimoa.`],
      nearby: ['We don’t live far from each other.', 'We crossed paths in the neighborhood.'],
      other: ['We crossed paths on a walk.', 'Brand new around here.'],
    },
    encounterVibe: {
      high: ['We hit it off right away.', 'We’re a lot alike.'],
      mid: ['We had fun.', 'We’ve got things in common.'],
      low: ['We’re very different. That’s what I like.', 'Quite the surprise, this one.'],
    },
    wavedAtYou: [
      (other: string) => `${other} waved at me. Shall we wave back?`,
      (other: string) => `${other} stopped by to say hi. Seems nice.`,
      (other: string) => `${other} keeps circling me. Smells like someone wants to play.`,
    ],
    system: {
      revived: 'The link is revived. It can’t be revived a second time.',
      levelUp: (title: string, text: string) => `Level reached: “${title}”. ${text}`,
    },
  },
  es: {
    lifeLost: [
      (other: string, lives: string) => `Ayer, silencio total. Nos quedamos con ${lives}.`,
      (other: string, lives: string) => `${other} y yo esperamos todo el día. Ya solo tenemos ${lives}.`,
      (other: string, lives: string) => `Basta una palabra para mantenernos en forma. En el marcador: ${lives}.`,
      (other: string, lives: string) => `Nos aburrimos un poco. Seguimos con ${lives}.`,
    ],
    lives: (n: number) => (n > 1 ? `${n} vidas` : 'una sola vida'),
    lifeGained: [
      (other: string, lives: number) => `Una vida más. Subimos a ${lives}.`,
      (other: string, lives: number) => `${other} y yo revivimos. ${lives} vidas.`,
      (other: string, lives: number) => `Eso es cuidar un vínculo. ${lives} vidas.`,
    ],
    levelUp: [
      (other: string, title: string) => `Nuevo nivel: «${title}». ${other}, hemos crecido.`,
      (other: string, title: string) => `${title}. No esperaba menos.`,
      (other: string, title: string) => `Pasamos a «${title}». Hago el baile de la victoria. Con discreción.`,
      (other: string, title: string) => `Siguiente nivel: «${title}». ${other} finge que no está orgulloso.`,
    ],
    ghost: [
      (other: string) => `Sin vidas. ${other} y yo nos volvemos transparentes.`,
      (other: string) => `El vínculo se ha dormido. Todavía podemos despertarlo, una vez.`,
      (other: string) => `Ahora somos fantasmas. Hace un poco de frío.`,
    ],
    revived: [
      (other: string) => `Hemos vuelto. ${other}, esto no se repite nunca más.`,
      (other: string) => `Segunda oportunidad. La guardo como oro en paño.`,
      (other: string) => `Reanimados. Respiro. Gracias.`,
    ],
    streakMilestone: [
      (other: string, days: number) => `${days} días seguidos escribiéndose. ${other} y yo lo apuntamos en algún sitio.`,
      (other: string, days: number) => `${days} días sin un hueco en la conversación. Buen dúo.`,
      (other: string, days: number) => `Racha de ${days} días. Finjo que no cuento. Cuento.`,
    ],
    encounterWhere: {
      friend: [(mutual: string) => `Me lo crucé en casa de ${mutual}.`, (mutual: string) => `Es amigo del minimoa de ${mutual}.`],
      nearby: ['No vivimos lejos el uno del otro.', 'Nos cruzamos por el barrio.'],
      other: ['Nos cruzamos de paseo.', 'Recién llegado a la zona.'],
    },
    encounterVibe: {
      high: ['Conectamos al instante.', 'Nos parecemos mucho.'],
      mid: ['Lo pasamos bien.', 'Tenemos cosas en común.'],
      low: ['Somos muy distintos. Eso es lo que me gusta.', 'Qué sorpresa, este encuentro.'],
    },
    wavedAtYou: [
      (other: string) => `${other} me ha saludado. ¿Le respondemos?`,
      (other: string) => `${other} pasó a saludar. Parece simpático.`,
      (other: string) => `${other} no para de rondarme. Huele a ganas de jugar.`,
    ],
    system: {
      revived: 'El vínculo ha sido reanimado. No podrá reanimarse una segunda vez.',
      levelUp: (title: string, text: string) => `Nivel alcanzado: «${title}». ${text}`,
    },
  },
  pt: {
    lifeLost: [
      (other: string, lives: string) => `Ontem, silêncio total. Ficamos com ${lives}.`,
      (other: string, lives: string) => `${other} e eu esperamos o dia inteiro. Agora só temos ${lives}.`,
      (other: string, lives: string) => `Uma palavra basta para manter a gente em forma. No placar: ${lives}.`,
      (other: string, lives: string) => `A gente está meio entediado. Seguimos com ${lives}.`,
    ],
    lives: (n: number) => (n > 1 ? `${n} vidas` : 'uma vida só'),
    lifeGained: [
      (other: string, lives: number) => `Uma vida a mais. Voltamos para ${lives}.`,
      (other: string, lives: number) => `${other} e eu revivemos. ${lives} vidas.`,
      (other: string, lives: number) => `Isso é que é cuidar de um vínculo. ${lives} vidas.`,
    ],
    levelUp: [
      (other: string, title: string) => `Novo nível: “${title}”. ${other}, a gente cresceu.`,
      (other: string, title: string) => `${title}. Eu não esperava menos.`,
      (other: string, title: string) => `Passamos para “${title}”. Estou fazendo a dança da vitória. Discretamente.`,
      (other: string, title: string) => `Próximo nível: “${title}”. ${other} finge que não está orgulhoso.`,
    ],
    ghost: [
      (other: string) => `Acabaram as vidas. ${other} e eu estamos ficando transparentes.`,
      (other: string) => `O vínculo adormeceu. Ainda dá para acordá-lo, uma vez.`,
      (other: string) => `Agora somos fantasmas. Está meio frio.`,
    ],
    revived: [
      (other: string) => `Voltamos. ${other}, isso nunca mais se repete.`,
      (other: string) => `Segunda chance. Vou guardar com carinho.`,
      (other: string) => `Reanimados. Respiro. Obrigado.`,
    ],
    streakMilestone: [
      (other: string, days: number) => `${days} dias seguidos de conversa. ${other} e eu anotamos isso em algum lugar.`,
      (other: string, days: number) => `${days} dias sem nenhum buraco na conversa. Que dupla.`,
      (other: string, days: number) => `Sequência de ${days} dias. Finjo que não estou contando. Estou contando.`,
    ],
    encounterWhere: {
      friend: [(mutual: string) => `Cruzei com ele na casa de ${mutual}.`, (mutual: string) => `É amigo do minimoa de ${mutual}.`],
      nearby: ['A gente não mora longe um do outro.', 'A gente se cruzou no bairro.'],
      other: ['A gente se cruzou num passeio.', 'Acabou de chegar por aqui.'],
    },
    encounterVibe: {
      high: ['A gente se deu bem na hora.', 'A gente se parece muito.'],
      mid: ['A gente se divertiu.', 'Temos coisas em comum.'],
      low: ['Somos muito diferentes. É isso que me agrada.', 'Que surpresa, esse encontro.'],
    },
    wavedAtYou: [
      (other: string) => `${other} acenou para mim. Vamos responder?`,
      (other: string) => `${other} passou para dar um oi. Parece legal.`,
      (other: string) => `${other} está rondando por aqui. Tem cara de quem quer brincar.`,
    ],
    system: {
      revived: 'O vínculo foi reanimado. Ele não poderá ser reanimado uma segunda vez.',
      levelUp: (title: string, text: string) => `Nível alcançado: “${title}”. ${text}`,
    },
  },
  nl: {
    lifeLost: [
      (other: string, lives: string) => `Gisteren: radiostilte. We hebben nog ${lives}.`,
      (other: string, lives: string) => `${other} en ik hebben de hele dag gewacht. Nog maar ${lives}.`,
      (other: string, lives: string) => `Eén woord houdt ons fit. De teller staat op ${lives}.`,
      (other: string, lives: string) => `We vervelen ons een beetje. Stand: ${lives}.`,
    ],
    lives: (n: number) => (n > 1 ? `${n} levens` : 'één leven'),
    lifeGained: [
      (other: string, lives: number) => `Eén leven erbij. We zitten weer op ${lives}.`,
      (other: string, lives: number) => `${other} en ik leven weer op. ${lives} levens.`,
      (other: string, lives: number) => `Dat noem ik een band onderhouden. ${lives} levens.`,
    ],
    levelUp: [
      (other: string, title: string) => `Nieuw niveau: „${title}”. ${other}, we zijn gegroeid.`,
      (other: string, title: string) => `${title}. Ik had niet minder verwacht.`,
      (other: string, title: string) => `Door naar „${title}”. Ik doe een overwinningsdansje. Onopvallend.`,
      (other: string, title: string) => `Volgend niveau: „${title}”. ${other} doet alsof hij niet trots is.`,
    ],
    ghost: [
      (other: string) => `Geen levens meer. ${other} en ik worden doorzichtig.`,
      (other: string) => `De band is in slaap gevallen. We kunnen hem nog één keer wekken.`,
      (other: string) => `We zijn nu spoken. Het is een beetje koud.`,
    ],
    revived: [
      (other: string) => `We zijn terug. ${other}, dit doen we nooit meer.`,
      (other: string) => `Tweede kans. Die koester ik.`,
      (other: string) => `Gereanimeerd. Ik adem weer. Dank je.`,
    ],
    streakMilestone: [
      (other: string, days: number) => `${days} dagen op rij contact. ${other} en ik schrijven het ergens op.`,
      (other: string, days: number) => `${days} dagen zonder gat in het gesprek. Mooi duo.`,
      (other: string, days: number) => `Reeks van ${days} dagen. Ik doe alsof ik niet tel. Ik tel.`,
    ],
    encounterWhere: {
      friend: [(mutual: string) => `Ik kwam hem tegen bij ${mutual}.`, (mutual: string) => `Hij is bevriend met de minimoa van ${mutual}.`],
      nearby: ['We wonen niet ver van elkaar.', 'We kwamen elkaar tegen in de buurt.'],
      other: ['Ontmoet tijdens een wandeling.', 'Helemaal nieuw hier.'],
    },
    encounterVibe: {
      high: ['Het klikte meteen.', 'We lijken erg op elkaar.'],
      mid: ['We hebben lol gehad.', 'We hebben dingen gemeen.'],
      low: ['We zijn heel verschillend. Dat vind ik juist leuk.', 'Wat een verrassing, deze ontmoeting.'],
    },
    wavedAtYou: [
      (other: string) => `${other} zwaaide naar me. Zwaaien we terug?`,
      (other: string) => `${other} kwam even hallo zeggen. Lijkt me leuk.`,
      (other: string) => `${other} draait om me heen. Volgens mij wil hij spelen.`,
    ],
    system: {
      revived: 'De band is gereanimeerd. Een tweede keer kan niet.',
      levelUp: (title: string, text: string) => `Niveau bereikt: „${title}”. ${text}`,
    },
  },
});

const pick = <T>(variants: readonly T[], seed: number): T => {
  const n = variants.length;
  return (variants[((Math.trunc(seed) % n) + n) % n] ?? variants[0]) as T;
};

export const lifeLostLine = (locale: Locale, p: PetPair, livesLeft: number, seed: number): string => {
  const t = voiceText.in(locale);
  return pick(t.lifeLost, seed)(p.other, t.lives(livesLeft));
};

export const lifeGainedLine = (locale: Locale, p: PetPair, lives: number, seed: number): string => pick(voiceText.in(locale).lifeGained, seed)(p.other, lives);

export const levelUpLine = (locale: Locale, p: PetPair, levelTitle: string, seed: number): string => pick(voiceText.in(locale).levelUp, seed)(p.other, levelTitle);

export const ghostLine = (locale: Locale, p: PetPair, seed: number): string => pick(voiceText.in(locale).ghost, seed)(p.other);

export const revivedLine = (locale: Locale, p: PetPair, seed: number): string => pick(voiceText.in(locale).revived, seed)(p.other);

/** Palier de série d'un lien atteint (`LINK_STREAK_MILESTONES`). */
export const streakMilestoneLine = (locale: Locale, p: PetPair, streak: number, seed: number): string =>
  pick(voiceText.in(locale).streakMilestone, seed)(p.other, streak);

export interface EncounterIntroInput {
  /** Nom du minimoa croisé. */
  other: string;
  via: EncounterVia;
  compatibility: number;
  /** Ami commun, quand il y en a un. */
  mutualName: string | null;
}

export function encounterIntroLine(locale: Locale, input: EncounterIntroInput, seed: number): string {
  const { other, via, compatibility, mutualName } = input;
  const t = voiceText.in(locale);
  const where =
    via === 'friend_of_friend' && mutualName
      ? pick(t.encounterWhere.friend, seed)(mutualName)
      : via === 'nearby'
        ? pick(t.encounterWhere.nearby, seed)
        : pick(t.encounterWhere.other, seed);
  const vibe = pick(compatibility >= 75 ? t.encounterVibe.high : compatibility >= 45 ? t.encounterVibe.mid : t.encounterVibe.low, seed >> 1);
  return `${other}. ${where} ${vibe}`;
}

export const wavedAtYouLine = (locale: Locale, other: string, seed: number): string => pick(voiceText.in(locale).wavedAtYou, seed)(other);

/** Bandeaux du système dans un lien. */
export const systemText = (locale: Locale) => voiceText.in(locale).system;
