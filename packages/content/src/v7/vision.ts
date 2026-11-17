/**
 * Textes de la vision (test, profil, explication des rencontres, carte), par langue.
 * Les clés des questions et des axes viennent de `@blowy/domain` (vision.ts).
 */
import type { AxisSide, Locale, VisionAxis } from '@blowy/domain';
import { defineMessages } from '../i18n/core';

export interface VisionQuestionText {
  situation: string;
  choices: readonly [string, string];
}

export interface VisionAxisText {
  name: string;
  /** Pôle −. */
  low: string;
  /** Pôle +. */
  high: string;
  /** Ce que l'axe mesure, en une ligne. */
  about: string;
}

export type VisionVia = 'friend_of_friend' | 'nearby' | 'new';

const fr = {
  /**
   * Les 12 situations du test : concrètes, adultes, sans bonne réponse. Ni religion, ni politique, ni santé, et rien
   * qui suppose un couple ou des enfants : des situations d'amitié et de quotidien.
   */
  questions: {
    dimanche: { situation: 'Dimanche, rien de prévu.', choices: ['Je reste chez moi, plaid et série.', 'Je sors : marché, expo, apéro.'] },
    enfants: { situation: 'Dans dix ans, le dimanche midi…', choices: ['Grande tablée en famille, ça déborde.', 'Brunch entre amis, et de la place pour l’imprévu.'] },
    mutation: { situation: 'On te propose un poste à l’autre bout du monde.', choices: ['Je fais mes cartons.', 'Je reste, ma vie est ici.'] },
    heritage: { situation: 'Tu reçois 10 000 € d’un coup.', choices: ['Je les mets de côté, ça servira.', 'Je m’offre un beau souvenir.'] },
    promotion: { situation: 'Une grosse promotion, avec des soirs en plus au travail.', choices: ['J’y vais, c’est le moment.', 'Je garde mes soirées.'] },
    vacances: { situation: 'Les vacances d’été.', choices: ['Un billet aller, on verra sur place.', 'Tout est réservé depuis mars.'] },
    appartement: { situation: 'Ton chez-toi, dans quelques années.', choices: ['Un vrai nid, pour longtemps, où tout le monde se retrouve.', 'Léger : je peux tout plier en une semaine.'] },
    vendredi: { situation: 'Vendredi soir, 23 h.', choices: ['Encore dehors, la soirée commence.', 'Au lit, demain j’ai des choses à faire.'] },
    cinq_ans: { situation: 'Dans cinq ans, tu habites…', choices: ['Dans le même coin, près des miens.', 'Ailleurs, peut-être dans un autre pays.'] },
    projet: { situation: 'Un projet perso te tient à cœur (une boîte, un album, une asso).', choices: ['J’y mets mes soirs et mes week-ends.', 'Il attendra, je profite d’abord.'] },
    soirees: { situation: 'Ta soirée idéale, en semaine.', choices: ['Dîner à la maison avec les miens.', 'Ce qui se présente, je décide sur le moment.'] },
    quartier: { situation: 'Ton quartier idéal.', choices: ['Calme, des arbres, on connaît le boulanger.', 'Animé, des bars, ça bouge tard.'] },
  } as Record<string, VisionQuestionText>,
  test: {
    title: 'Ta vision',
    intro: '12 situations, une par écran. Il n’y a pas de bonne réponse.',
  },
  axes: {
    foyer: { name: 'Famille ou liberté', low: 'Libre, léger', high: 'La famille d’abord', about: 'La place de la famille et du chez-soi.' },
    ancrage: { name: 'Ici ou ailleurs', low: 'Rester ici', high: 'Partir', about: 'Où vivre : ici, ailleurs, à l’étranger.' },
    elan: { name: 'Projets ou temps libre', low: 'Du temps pour soi', high: 'De grands projets', about: 'La place du travail et de l’ambition.' },
    rythme: { name: 'Calme ou dehors', low: 'Calme, chez soi', high: 'Intense, dehors', about: 'Le quotidien que tu veux.' },
    cap: { name: 'Prévoir ou improviser', low: 'Au jour le jour', high: 'Tout prévoir', about: 'Long terme, argent, organisation.' },
  } as Record<VisionAxis, VisionAxisText>,
  /** Où la personne penche sur un axe (pôles en minuscules). */
  side: {
    mid: (low: string, high: string) => `Entre les deux : ${low} ou ${high}.`,
    lean: (pole: string) => `Plutôt ${pole}.`,
  },
  profile: {
    title: 'Ta vision, pour l’instant',
    /** Mention visible sur l'écran du profil (spéc. §3). */
    note: 'Indicatif. Il s’affine avec toi.',
    empty: 'Passe le test de vision pour que ton minimoa sache qui te présenter.',
  },
  /** Un point commun, par axe et par côté partagé. */
  common: {
    foyer: { high: 'Vous deux, la famille passe en premier.', low: 'Vous deux, vous tenez à votre liberté.', mid: 'Famille et liberté : le même équilibre pour vous deux.' },
    ancrage: { high: 'Vous deux, vous avez envie d’ailleurs.', low: 'Vous deux, vous tenez à votre coin.', mid: 'Partir ou rester : vous hésitez pareil.' },
    elan: { high: 'Vous deux, vous avez de grands projets.', low: 'Vous deux, vous gardez du temps pour vous.', mid: 'Travail et vie perso : le même équilibre.' },
    rythme: { high: 'Vous deux, vous aimez quand ça bouge.', low: 'Vous deux, vous aimez le calme.', mid: 'Ni trop calme, ni trop intense : pareil pour vous deux.' },
    cap: { high: 'Vous deux, vous aimez prévoir.', low: 'Vous deux, vous vivez au jour le jour.', mid: 'Un peu de plan, un peu d’imprévu : comme vous deux.' },
  } as Record<VisionAxis, Record<AxisSide, string>>,
  between: 'entre les deux',
  /** La différence à explorer. */
  explore: {
    same: (axis: string) => `${axis} : c’est là que vous vous ressemblez le moins. À explorer ensemble.`,
    differ: (axis: string, mine: string, otherName: string, theirs: string) => `${axis} : toi, ${mine} ; ${otherName}, ${theirs}. À explorer ensemble.`,
  },
  match: {
    commonTitle: '3 points communs',
    exploreTitle: '1 différence à explorer',
  },
  /** Ce que ton minimoa dit d'une rencontre : d'où il la connaît, puis le premier point commun. */
  intro: {
    friend: [(mutual: string) => `Je l’ai rencontré chez ${mutual}.`, (mutual: string) => `C’est un pote du minimoa de ${mutual}.`] as readonly ((mutual: string) => string)[],
    nearby: ['Il traîne dans ton quartier.', 'Il habite pas loin de chez toi.'] as readonly string[],
    other: ['Tout nouveau dans le coin.', 'Je l’ai rencontré en balade.'] as readonly string[],
  },
  map: {
    /** Silhouettes floues au-delà de la zone. */
    beyond: (n: number) => (n === 1 ? '1 minimoa plus loin' : `${n} minimoas plus loin`),
    noLocation: 'Sans ta position, pas de carte ni de rencontres près de toi.',
    discreet: 'Mode discret : tu n’apparais sur la carte de personne.',
    plusHint: 'Avec Minimoa+, toute la carte, et changer de ville.',
  },
  /** Messages d'erreur de la vision (renvoyés par l'API). */
  errors: {
    unknownQuestion: 'Cette situation n’existe pas.',
    incompleteTest: 'Réponds aux 12 situations du test, une fois chacune. Tu peux aussi le passer plus tard.',
    locationConsent: 'Il faut ton accord pour utiliser ta position.',
    changeCityPlus: 'Changer de ville fait partie de Minimoa+.',
    mapEverywherePlus: 'Toute la carte fait partie de Minimoa+.',
  },
};

export const visionText = defineMessages({
  fr,
  en: {
    questions: {
      dimanche: { situation: 'Sunday, nothing planned.', choices: ['I stay in: blanket and a series.', 'I go out: market, exhibition, drinks.'] },
      enfants: { situation: 'Ten years from now, Sunday lunch…', choices: ['A big family table, overflowing.', 'Brunch with friends, and room for the unexpected.'] },
      mutation: { situation: 'You’re offered a job on the other side of the world.', choices: ['I start packing.', 'I stay, my life is here.'] },
      heritage: { situation: 'You suddenly get €10,000.', choices: ['I put it aside, it’ll come in handy.', 'I treat myself to something to remember.'] },
      promotion: { situation: 'A big promotion, with more late evenings at work.', choices: ['I take it, now’s the time.', 'I keep my evenings.'] },
      vacances: { situation: 'Summer vacation.', choices: ['A one-way ticket, we’ll see when we get there.', 'Everything’s been booked since March.'] },
      appartement: { situation: 'Your place, a few years from now.', choices: ['A real nest, for the long run, where everyone gathers.', 'Light: I could pack it all up in a week.'] },
      vendredi: { situation: 'Friday night, 11 p.m.', choices: ['Still out, the night’s just getting started.', 'In bed, I’ve got things to do tomorrow.'] },
      cinq_ans: { situation: 'Five years from now, you live…', choices: ['In the same area, close to my people.', 'Somewhere else, maybe in another country.'] },
      projet: { situation: 'A personal project means a lot to you (a business, an album, a nonprofit).', choices: ['I put my evenings and weekends into it.', 'It can wait, I enjoy life first.'] },
      soirees: { situation: 'Your ideal weeknight.', choices: ['Dinner at home with my people.', 'Whatever comes up, I decide on the spot.'] },
      quartier: { situation: 'Your ideal neighborhood.', choices: ['Quiet, trees, you know the baker.', 'Lively, bars, things go on late.'] },
    },
    test: {
      title: 'Your vision',
      intro: '12 situations, one per screen. There’s no right answer.',
    },
    axes: {
      foyer: { name: 'Family or freedom', low: 'Free and light', high: 'Family first', about: 'How much room family and home take.' },
      ancrage: { name: 'Here or elsewhere', low: 'Staying here', high: 'Moving away', about: 'Where to live: here, elsewhere, abroad.' },
      elan: { name: 'Projects or free time', low: 'Personal time', high: 'Big ambitions', about: 'How much room work and ambition take.' },
      rythme: { name: 'Calm or out and about', low: 'Calm, at home', high: 'Intense, going out', about: 'The everyday life you want.' },
      cap: { name: 'Plan or improvise', low: 'Day by day', high: 'Planning it all', about: 'The long term, money, organization.' },
    },
    side: {
      mid: (low: string, high: string) => `In between: ${low} or ${high}.`,
      lean: (pole: string) => `Mostly ${pole}.`,
    },
    profile: {
      title: 'Your vision, for now',
      note: 'A rough guide. It sharpens as you go.',
      empty: 'Take the vision test so your minimoa knows who to introduce you to.',
    },
    common: {
      foyer: { high: 'You both put family first.', low: 'You both value your freedom.', mid: 'Family and freedom: the same balance for you both.' },
      ancrage: { high: 'You both feel the pull of elsewhere.', low: 'You both love where you are.', mid: 'Leave or stay: you’re torn the same way.' },
      elan: { high: 'You both have big ambitions.', low: 'You both keep time for yourselves.', mid: 'Work and personal life: the same balance.' },
      rythme: { high: 'You both like it when things are lively.', low: 'You both like it calm.', mid: 'Not too calm, not too intense: same for you both.' },
      cap: { high: 'You both like to plan ahead.', low: 'You both live day by day.', mid: 'A bit of planning, a bit of surprise: just like you two.' },
    },
    between: 'in between',
    explore: {
      same: (axis: string) => `${axis}: this is where you’re least alike. Worth exploring together.`,
      differ: (axis: string, mine: string, otherName: string, theirs: string) => `${axis}: you, ${mine}; ${otherName}, ${theirs}. Worth exploring together.`,
    },
    match: {
      commonTitle: '3 things in common',
      exploreTitle: '1 difference to explore',
    },
    intro: {
      friend: [(mutual: string) => `I ran into them at ${mutual}’s.`, (mutual: string) => `They’re a friend of ${mutual}’s minimoa.`],
      nearby: ['They hang out in your neighborhood.', 'We crossed paths near your place.'],
      other: ['Brand new around here.', 'We crossed paths on a walk.'],
    },
    map: {
      beyond: (n: number) => (n === 1 ? '1 minimoa farther away' : `${n} minimoas farther away`),
      noLocation: 'Without your location, no map and no encounters near you.',
      discreet: 'Discreet mode: you don’t appear on anyone’s map.',
      plusHint: 'With Minimoa+: the whole map, and switching cities.',
    },
    errors: {
      unknownQuestion: 'This situation doesn’t exist.',
      incompleteTest: 'Answer all 12 situations in the test, once each. You can also take it later.',
      locationConsent: 'We need your consent to use your location.',
      changeCityPlus: 'Switching cities is part of Minimoa+.',
      mapEverywherePlus: 'The whole map is part of Minimoa+.',
    },
  },
  es: {
    questions: {
      dimanche: { situation: 'Domingo, nada previsto.', choices: ['Me quedo en casa: manta y series.', 'Salgo: mercado, expo, tomar algo.'] },
      enfants: { situation: 'Dentro de diez años, el domingo a mediodía…', choices: ['Una gran mesa en familia, a rebosar.', 'Brunch con amistades, y sitio para lo imprevisto.'] },
      mutation: { situation: 'Te ofrecen un puesto al otro lado del mundo.', choices: ['Hago las maletas.', 'Me quedo, mi vida está aquí.'] },
      heritage: { situation: 'Recibes 10 000 € de golpe.', choices: ['Los ahorro, ya servirán.', 'Me doy un capricho inolvidable.'] },
      promotion: { situation: 'Un gran ascenso, pero saliendo más tarde del trabajo.', choices: ['Lo acepto, es el momento.', 'Prefiero mis noches libres.'] },
      vacances: { situation: 'Las vacaciones de verano.', choices: ['Solo ida, ya veremos allí.', 'Todo reservado desde marzo.'] },
      appartement: { situation: 'Tu casa, dentro de unos años.', choices: ['Un nido de verdad, para mucho tiempo, donde todos se reúnen.', 'Ligera: podría recogerlo todo en una semana.'] },
      vendredi: { situation: 'Viernes, 23:00.', choices: ['Todavía fuera, la noche empieza.', 'En la cama, mañana tengo cosas que hacer.'] },
      cinq_ans: { situation: 'Dentro de cinco años, vives…', choices: ['En la misma zona, cerca de los míos.', 'En otro sitio, quizá en otro país.'] },
      projet: { situation: 'Un proyecto personal te importa mucho (una empresa, un disco, una asociación).', choices: ['Le dedico mis noches y mis fines de semana.', 'Puede esperar, primero disfruto.'] },
      soirees: { situation: 'Tu noche ideal entre semana.', choices: ['Cenar en casa con los míos.', 'Lo que surja, decido en el momento.'] },
      quartier: { situation: 'Tu barrio ideal.', choices: ['Tranquilo, con árboles, te saludan en la panadería.', 'Animado, con bares, hay vida hasta tarde.'] },
    },
    test: {
      title: 'Tu visión',
      intro: '12 situaciones, una por pantalla. No hay respuestas correctas.',
    },
    axes: {
      foyer: { name: 'Familia o libertad', low: 'Libre, ligero', high: 'La familia primero', about: 'El lugar de la familia y del hogar.' },
      ancrage: { name: 'Aquí o en otro lugar', low: 'Quedarse aquí', high: 'Irse lejos', about: 'Dónde vivir: aquí, en otro lugar, en el extranjero.' },
      elan: { name: 'Proyectos o tiempo libre', low: 'Tiempo propio', high: 'Grandes proyectos', about: 'El lugar del trabajo y de la ambición.' },
      rythme: { name: 'Calma o salir', low: 'Calma, en casa', high: 'Vida intensa, fuera', about: 'El día a día que quieres.' },
      cap: { name: 'Planear o improvisar', low: 'Día a día', high: 'Planearlo todo', about: 'Largo plazo, dinero, organización.' },
    },
    side: {
      mid: (low: string, high: string) => `A medio camino: ${low} o ${high}.`,
      lean: (pole: string) => `Más bien ${pole}.`,
    },
    profile: {
      title: 'Tu visión, por ahora',
      note: 'Orientativa. Se afina contigo.',
      empty: 'Haz el test de visión para que tu minimoa sepa a quién presentarte.',
    },
    common: {
      foyer: { high: 'En común: la familia va primero.', low: 'En común: el apego a su libertad.', mid: 'Familia y libertad: el mismo equilibrio para los dos.' },
      ancrage: { high: 'En común: las ganas de irse lejos.', low: 'En común: el apego a su rincón.', mid: 'Irse o quedarse: dudan por igual.' },
      elan: { high: 'En común: los grandes proyectos.', low: 'En común: cuidar su tiempo libre.', mid: 'Trabajo y vida personal: el mismo equilibrio.' },
      rythme: { high: 'En común: el gusto por el movimiento.', low: 'En común: el gusto por la calma.', mid: 'Ni muy tranquilo ni muy intenso: coinciden.' },
      cap: { high: 'En común: el gusto por planear.', low: 'En común: vivir al día.', mid: 'Un poco de plan, un poco de imprevisto: coinciden.' },
    },
    between: 'a medio camino',
    explore: {
      same: (axis: string) => `${axis}: aquí es donde menos se parecen. Algo que explorar a dúo.`,
      differ: (axis: string, mine: string, otherName: string, theirs: string) => `${axis}: tú, ${mine}; ${otherName}, ${theirs}. Algo que explorar a dúo.`,
    },
    match: {
      commonTitle: '3 puntos en común',
      exploreTitle: '1 diferencia que explorar',
    },
    intro: {
      friend: [(mutual: string) => `Me lo crucé en casa de ${mutual}.`, (mutual: string) => `Es amigo del minimoa de ${mutual}.`],
      nearby: ['Anda por tu barrio.', 'Nos cruzamos cerca de tu casa.'],
      other: ['Recién llegado a la zona.', 'Nos cruzamos de paseo.'],
    },
    map: {
      beyond: (n: number) => (n === 1 ? '1 minimoa más lejos' : `${n} minimoas más lejos`),
      noLocation: 'Sin tu ubicación, no hay mapa ni encuentros cerca de ti.',
      discreet: 'Modo discreto: no apareces en el mapa de nadie.',
      plusHint: 'Con Minimoa+, todo el mapa y cambiar de ciudad.',
    },
    errors: {
      unknownQuestion: 'Esta situación no existe.',
      incompleteTest: 'Responde a las 12 situaciones del test, una vez cada una. También puedes hacerlo más tarde.',
      locationConsent: 'Necesitamos tu consentimiento para usar tu ubicación.',
      changeCityPlus: 'Cambiar de ciudad forma parte de Minimoa+.',
      mapEverywherePlus: 'Todo el mapa forma parte de Minimoa+.',
    },
  },
  pt: {
    questions: {
      dimanche: { situation: 'Domingo, nada planejado.', choices: ['Fico em casa: cobertor e série.', 'Saio: feira, exposição, um drink.'] },
      enfants: { situation: 'Daqui a dez anos, almoço de domingo…', choices: ['Uma mesa grande com a família, lotada.', 'Brunch com os amigos, e espaço para o imprevisto.'] },
      mutation: { situation: 'Te oferecem um emprego do outro lado do mundo.', choices: ['Faço as malas.', 'Fico, minha vida é aqui.'] },
      heritage: { situation: 'Você recebe 10 mil euros de uma vez.', choices: ['Guardo, vai ser útil.', 'Me dou algo inesquecível.'] },
      promotion: { situation: 'Uma grande promoção, com mais noites no trabalho.', choices: ['Aceito, é a hora.', 'Fico com as minhas noites.'] },
      vacances: { situation: 'As férias de verão.', choices: ['Passagem só de ida, lá a gente vê.', 'Tudo reservado desde março.'] },
      appartement: { situation: 'Sua casa, daqui a alguns anos.', choices: ['Um ninho de verdade, para durar, onde todo mundo se encontra.', 'Leve: dá para desmontar tudo em uma semana.'] },
      vendredi: { situation: 'Sexta à noite, 23h.', choices: ['Ainda na rua, a noite está só começando.', 'Na cama, amanhã tenho coisas para fazer.'] },
      cinq_ans: { situation: 'Daqui a cinco anos, você mora…', choices: ['Na mesma região, perto dos meus.', 'Em outro lugar, talvez em outro país.'] },
      projet: { situation: 'Um projeto pessoal é muito importante para você (uma empresa, um álbum, uma ONG).', choices: ['Dedico a ele minhas noites e fins de semana.', 'Pode esperar, primeiro eu aproveito.'] },
      soirees: { situation: 'Sua noite ideal, durante a semana.', choices: ['Jantar em casa com os meus.', 'O que aparecer, decido na hora.'] },
      quartier: { situation: 'Seu bairro ideal.', choices: ['Tranquilo, arborizado, todo mundo se conhece na padaria.', 'Agitado, cheio de bares, movimento até tarde.'] },
    },
    test: {
      title: 'Sua visão',
      intro: '12 situações, uma por tela. Não existe resposta certa.',
    },
    axes: {
      foyer: { name: 'Família ou liberdade', low: 'Livre, leve', high: 'A família primeiro', about: 'O lugar da família e do lar.' },
      ancrage: { name: 'Aqui ou em outro lugar', low: 'Ficar aqui', high: 'Ir embora', about: 'Onde viver: aqui, em outro lugar, no exterior.' },
      elan: { name: 'Projetos ou tempo livre', low: 'Tempo livre', high: 'Grandes projetos', about: 'O espaço do trabalho e da ambição.' },
      rythme: { name: 'Calma ou sair', low: 'Calma, em casa', high: 'Agito, na rua', about: 'O dia a dia que você quer.' },
      cap: { name: 'Planejar ou improvisar', low: 'Um dia de cada vez', high: 'Planejar tudo', about: 'Longo prazo, dinheiro, organização.' },
    },
    side: {
      mid: (low: string, high: string) => `No meio-termo: ${low} ou ${high}.`,
      lean: (pole: string) => `Mais para ${pole}.`,
    },
    profile: {
      title: 'Sua visão, por enquanto',
      note: 'Indicativa. Ela vai se ajustando com você.',
      empty: 'Faça o teste de visão para o seu minimoa saber quem te apresentar.',
    },
    common: {
      foyer: { high: 'Para vocês, a família vem primeiro.', low: 'Vocês prezam a liberdade.', mid: 'Família e liberdade: o mesmo equilíbrio para vocês.' },
      ancrage: { high: 'Vocês sonham com outros lugares.', low: 'Vocês gostam do seu canto.', mid: 'Ir ou ficar: vocês hesitam do mesmo jeito.' },
      elan: { high: 'Vocês têm grandes projetos.', low: 'Vocês guardam tempo para si.', mid: 'Trabalho e vida pessoal: o mesmo equilíbrio.' },
      rythme: { high: 'Vocês gostam de agito.', low: 'Vocês gostam de calma.', mid: 'Nem calmo demais, nem agitado demais: igual para vocês.' },
      cap: { high: 'Vocês gostam de planejar.', low: 'Vocês vivem um dia de cada vez.', mid: 'Um pouco de plano, um pouco de imprevisto: a cara de vocês.' },
    },
    between: 'no meio-termo',
    explore: {
      same: (axis: string) => `${axis}: é aqui que vocês menos se parecem. Algo para explorar a dois.`,
      differ: (axis: string, mine: string, otherName: string, theirs: string) => `${axis}: você, ${mine}; ${otherName}, ${theirs}. Algo para explorar a dois.`,
    },
    match: {
      commonTitle: '3 pontos em comum',
      exploreTitle: '1 diferença para explorar',
    },
    intro: {
      friend: [(mutual: string) => `Cruzei com ele na casa de ${mutual}.`, (mutual: string) => `É amigo do minimoa de ${mutual}.`],
      nearby: ['Ele anda pelo seu bairro.', 'A gente se cruzou perto da sua casa.'],
      other: ['Acabou de chegar por aqui.', 'A gente se cruzou num passeio.'],
    },
    map: {
      beyond: (n: number) => (n === 1 ? '1 minimoa mais longe' : `${n} minimoas mais longe`),
      noLocation: 'Sem a sua localização, não tem mapa nem encontros perto de você.',
      discreet: 'Modo discreto: você não aparece no mapa de ninguém.',
      plusHint: 'Com o Minimoa+, o mapa inteiro e a troca de cidade.',
    },
    errors: {
      unknownQuestion: 'Essa situação não existe.',
      incompleteTest: 'Responda às 12 situações do teste, uma vez cada. Você também pode fazer depois.',
      locationConsent: 'Precisamos do seu consentimento para usar sua localização.',
      changeCityPlus: 'Trocar de cidade faz parte do Minimoa+.',
      mapEverywherePlus: 'O mapa inteiro faz parte do Minimoa+.',
    },
  },
  nl: {
    questions: {
      dimanche: { situation: 'Zondag, niets gepland.', choices: ['Ik blijf thuis: dekentje en een serie.', 'Ik ga eropuit: markt, expo, borrel.'] },
      enfants: { situation: 'Over tien jaar, zondagmiddag…', choices: ['Een grote tafel met familie, propvol.', 'Brunchen met vrienden, en ruimte voor het onverwachte.'] },
      mutation: { situation: 'Je krijgt een baan aangeboden aan de andere kant van de wereld.', choices: ['Ik pak mijn dozen in.', 'Ik blijf, mijn leven is hier.'] },
      heritage: { situation: 'Je krijgt in één keer € 10.000.', choices: ['Ik zet het opzij, komt vast van pas.', 'Ik trakteer mezelf op iets onvergetelijks.'] },
      promotion: { situation: 'Een flinke promotie, met meer avonden op het werk.', choices: ['Ik ga ervoor, nu is het moment.', 'Ik houd mijn avonden vrij.'] },
      vacances: { situation: 'De zomervakantie.', choices: ['Een enkeltje, we zien daar wel.', 'Alles is al sinds maart geboekt.'] },
      appartement: { situation: 'Je huis, over een paar jaar.', choices: ['Een echt nest, voor lang, waar iedereen samenkomt.', 'Licht: ik kan alles in een week inpakken.'] },
      vendredi: { situation: 'Vrijdagavond, 23.00 uur.', choices: ['Nog op stap, de avond begint pas.', 'In bed, morgen heb ik dingen te doen.'] },
      cinq_ans: { situation: 'Over vijf jaar woon je…', choices: ['In dezelfde buurt, dicht bij mijn dierbaren.', 'Ergens anders, misschien in een ander land.'] },
      projet: { situation: 'Een eigen project ligt je na aan het hart (een bedrijf, een album, een vereniging).', choices: ['Ik steek er mijn avonden en weekenden in.', 'Dat kan wachten, eerst genieten.'] },
      soirees: { situation: 'Je ideale doordeweekse avond.', choices: ['Thuis eten met mijn mensen.', 'Wat er op mijn pad komt, ik beslis ter plekke.'] },
      quartier: { situation: 'Je ideale buurt.', choices: ['Rustig, bomen, je kent de bakker.', 'Levendig, kroegen, het gaat door tot laat.'] },
    },
    test: {
      title: 'Jouw visie',
      intro: '12 situaties, één per scherm. Er is geen goed antwoord.',
    },
    axes: {
      foyer: { name: 'Gezin of vrijheid', low: 'Vrij, licht', high: 'Familie eerst', about: 'De plek van familie en thuis.' },
      ancrage: { name: 'Hier of elders', low: 'Hier blijven', high: 'Vertrekken', about: 'Waar je woont: hier, elders, in het buitenland.' },
      elan: { name: 'Projecten of vrije tijd', low: 'Tijd voor jezelf', high: 'Grote projecten', about: 'De plek van werk en ambitie.' },
      rythme: { name: 'Rustig of erop uit', low: 'Rustig, thuis', high: 'Druk, buiten de deur', about: 'Het dagelijks leven dat je wilt.' },
      cap: { name: 'Plannen of improviseren', low: 'Van dag tot dag', high: 'Alles plannen', about: 'Lange termijn, geld, organisatie.' },
    },
    side: {
      mid: (low: string, high: string) => `Ertussenin: ${low} of ${high}.`,
      lean: (pole: string) => `Eerder ${pole}.`,
    },
    profile: {
      title: 'Jouw visie, voorlopig',
      note: 'Een indicatie. Die wordt scherper met jou.',
      empty: 'Doe de visietest, zodat je minimoa weet aan wie hij je moet voorstellen.',
    },
    common: {
      foyer: { high: 'Voor jullie allebei komt familie eerst.', low: 'Jullie hechten allebei aan jullie vrijheid.', mid: 'Familie en vrijheid: dezelfde balans voor jullie allebei.' },
      ancrage: { high: 'Jullie willen allebei de wijde wereld in.', low: 'Jullie zijn allebei gehecht aan jullie eigen plek.', mid: 'Vertrekken of blijven: jullie twijfelen allebei.' },
      elan: { high: 'Jullie hebben allebei grote ambities.', low: 'Jullie houden allebei tijd voor jezelf.', mid: 'Werk en privé: dezelfde balans.' },
      rythme: { high: 'Jullie houden allebei van drukte.', low: 'Jullie houden allebei van rust.', mid: 'Niet te rustig, niet te druk: voor jullie allebei hetzelfde.' },
      cap: { high: 'Jullie plannen allebei graag vooruit.', low: 'Jullie leven allebei van dag tot dag.', mid: 'Een beetje plan, een beetje verrassing: net als jullie.' },
    },
    between: 'ertussenin',
    explore: {
      same: (axis: string) => `${axis}: hier lijken jullie het minst op elkaar. Iets om samen te ontdekken.`,
      differ: (axis: string, mine: string, otherName: string, theirs: string) => `${axis}: jij, ${mine}; ${otherName}, ${theirs}. Iets om samen te ontdekken.`,
    },
    match: {
      commonTitle: '3 overeenkomsten',
      exploreTitle: '1 verschil om te ontdekken',
    },
    intro: {
      friend: [(mutual: string) => `Ik kwam hem tegen bij ${mutual}.`, (mutual: string) => `Hij is bevriend met de minimoa van ${mutual}.`],
      nearby: ['Hij hangt rond in jouw buurt.', 'We kwamen elkaar tegen vlak bij je huis.'],
      other: ['Helemaal nieuw hier.', 'Ontmoet tijdens een wandeling.'],
    },
    map: {
      beyond: (n: number) => (n === 1 ? '1 minimoa verderop' : `${n} minimoas verderop`),
      noLocation: 'Zonder je locatie geen kaart en geen ontmoetingen bij jou in de buurt.',
      discreet: 'Discrete modus: je staat op niemands kaart.',
      plusHint: 'Met Minimoa+ de hele kaart, en van stad wisselen.',
    },
    errors: {
      unknownQuestion: 'Deze situatie bestaat niet.',
      incompleteTest: 'Beantwoord alle 12 situaties van de test, elk één keer. Je kunt hem ook later doen.',
      locationConsent: 'We hebben je toestemming nodig om je locatie te gebruiken.',
      changeCityPlus: 'Van stad wisselen hoort bij Minimoa+.',
      mapEverywherePlus: 'De hele kaart hoort bij Minimoa+.',
    },
  },
});

/** Où la personne penche sur un axe, pour son propre profil. */
export function visionSideLine(locale: Locale, axis: VisionAxis, side: AxisSide): string {
  const t = visionText.in(locale);
  const a = t.axes[axis];
  if (side === 'mid') return t.side.mid(a.low.toLowerCase(), a.high.toLowerCase());
  return t.side.lean((side === 'low' ? a.low : a.high).toLowerCase());
}

const sideWord = (locale: Locale, axis: VisionAxis, side: AxisSide): string => {
  const t = visionText.in(locale);
  const a = t.axes[axis];
  return side === 'low' ? a.low.toLowerCase() : side === 'high' ? a.high.toLowerCase() : t.between;
};

/** La différence à explorer. `otherName` : le prénom de l'autre personne. */
export function visionExploreLine(locale: Locale, axis: VisionAxis, mine: AxisSide, theirs: AxisSide, otherName: string): string {
  const t = visionText.in(locale);
  const name = t.axes[axis].name;
  if (mine === theirs) return t.explore.same(name);
  return t.explore.differ(name, sideWord(locale, axis, mine), otherName, sideWord(locale, axis, theirs));
}

const pick = <T>(variants: readonly T[], seed: number): T => variants[((Math.trunc(seed) % variants.length) + variants.length) % variants.length] as T;

/** Ce que ton minimoa dit d'une rencontre : d'où il la connaît, puis le premier point commun. */
export function visionIntroLine(locale: Locale, input: { other: string; via: VisionVia; mutualName: string | null; firstCommon: string }, seed: number): string {
  const { other, via, mutualName, firstCommon } = input;
  const t = visionText.in(locale).intro;
  const where =
    via === 'friend_of_friend' && mutualName ? pick(t.friend, seed)(mutualName) : via === 'nearby' ? pick(t.nearby, seed) : pick(t.other, seed);
  return `${other}. ${where} ${firstCommon}`;
}
