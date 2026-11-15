/**
 * Défis du jour (V6) : une question, deux réponses. Chaque réponse pousse un peu les jauges du minimoa,
 * en plus de l'effet de base du défi (`challenge_done`). L'API choisit le défi du jour de façon déterministe.
 * Les effets sont des données (`CHALLENGE_DATA`) ; les mots, par langue (`challengeText`).
 * Une réponse qui suit « tu… » continue la phrase (minuscule) ; une réponse autonome prend la majuscule.
 */
import type { Gauges, Locale } from '@blowy/domain';
import { defineMessages } from './i18n/core';

export interface ChallengeChoice {
  label: string;
  delta: Partial<Gauges>;
}

export interface Challenge {
  id: string;
  question: string;
  choices: readonly [ChallengeChoice, ChallengeChoice];
}

interface ChallengeData {
  id: string;
  deltas: readonly [Partial<Gauges>, Partial<Gauges>];
}

/** Ordre stable : le choix du jour se fait par indice. */
export const CHALLENGE_DATA: readonly ChallengeData[] = [
  { id: 'soiree', deltas: [{ social: -3 }, { social: 3 }] },
  { id: 'message', deltas: [{ talk: 3 }, { talk: -3 }] },
  { id: 'dispute', deltas: [{ tender: -3 }, { tender: 3 }] },
  { id: 'weekend', deltas: [{ play: -3 }, { play: 3 }] },
  { id: 'fete', deltas: [{ social: -3 }, { social: 3 }] },
  { id: 'vocal', deltas: [{ talk: 3 }, { talk: -2 }] },
  { id: 'compliment', deltas: [{ tender: 3 }, { tender: -2, play: 2 }] },
  { id: 'jeu', deltas: [{ play: 3, tender: -1 }, { play: 2, tender: 1 }] },
  { id: 'voyage', deltas: [{ play: -3 }, { play: 3 }] },
  { id: 'nouveau', deltas: [{ social: 3 }, { social: -3 }] },
  { id: 'secret', deltas: [{ talk: -3 }, { talk: 2, tender: 1 }] },
  { id: 'matin', deltas: [{ play: -2, talk: -1 }, { play: 2, talk: 1 }] },
  { id: 'cadeau', deltas: [{ tender: -2 }, { tender: 3 }] },
  { id: 'pluie', deltas: [{ social: -2 }, { play: 3 }] },
  { id: 'groupe', deltas: [{ talk: -3 }, { talk: 3 }] },
  { id: 'film', deltas: [{ play: 2 }, { tender: 2 }] },
  { id: 'retard', deltas: [{ play: 2, tender: -1 }, { tender: 2 }] },
  { id: 'cuisine', deltas: [{ play: -2 }, { play: 3 }] },
  { id: 'anniv', deltas: [{ social: -2, tender: 1 }, { social: 3 }] },
  { id: 'appel', deltas: [{ talk: 2, social: 1 }, { talk: -3 }] },
  { id: 'sport', deltas: [{ social: -2 }, { social: 2, play: 1 }] },
  { id: 'critique', deltas: [{ tender: -3 }, { play: 2 }] },
  { id: 'musique', deltas: [{ social: 2, talk: 1 }, { social: -1, tender: 1 }] },
  { id: 'dimanche', deltas: [{ play: -2 }, { play: 3 }] },
  { id: 'animaux', deltas: [{ tender: 3 }, { talk: 3 }] },
  { id: 'photo', deltas: [{ social: -3 }, { social: 2, play: 2 }] },
  { id: 'defi', deltas: [{ play: -2 }, { play: 3 }] },
  { id: 'mots', deltas: [{ tender: 2, talk: 2 }, { tender: 2, talk: -2 }] },
  { id: 'nuit', deltas: [{ social: -2 }, { talk: 3 }] },
  { id: 'vacances', deltas: [{ social: -3 }, { social: 3 }] },
  { id: 'blague', deltas: [{ play: 3 }, { talk: -2 }] },
  { id: 'dessert', deltas: [{ tender: 2 }, { tender: -2, play: 1 }] },
];

type ChallengeWords = { question: string; choices: readonly [string, string] };

export const challengeText = defineMessages({
  fr: {
    soiree: { question: 'Ce soir, plutôt…', choices: ['Canapé et plaid', 'Sortie improvisée'] },
    message: { question: 'Un message important, tu…', choices: ['écris un roman', 'réponds en un mot'] },
    dispute: { question: 'Un pote te vanne, tu…', choices: ['renvoies la balle', 'fais un câlin'] },
    weekend: { question: 'Le week-end idéal…', choices: ['Rien de prévu', 'Trois plans par jour'] },
    fete: { question: 'À une fête, tu es…', choices: ['près du buffet, tranquille', 'au milieu de la piste'] },
    vocal: { question: 'Les vocaux de 4 minutes…', choices: ['J’adore en envoyer', 'Je les écoute en x2'] },
    compliment: { question: 'On te fait un compliment, tu…', choices: ['en fais un en retour', 'fais une blague'] },
    jeu: { question: 'Un jeu de société, tu…', choices: ['joues pour gagner', 'joues pour rigoler'] },
    voyage: { question: 'En voyage, plutôt…', choices: ['Tout planifier', 'Se perdre exprès'] },
    nouveau: { question: 'Quelqu’un de nouveau arrive, tu…', choices: ['vas lui parler', 'attends qu’il vienne'] },
    secret: { question: 'Un secret, tu le…', choices: ['gardes pour toujours', 'racontes à ton minimoa'] },
    matin: { question: 'Le matin, tu es…', choices: ['en mode zombie', 'déjà en train de chanter'] },
    cadeau: { question: 'Un cadeau réussi, c’est…', choices: ['un truc utile', 'un truc qui fait pleurer'] },
    pluie: { question: 'Il pleut, tu…', choices: ['restes au chaud', 'sautes dans les flaques'] },
    groupe: { question: 'Dans un groupe de discussion, tu…', choices: ['lis sans écrire', 'lances les sujets'] },
    film: { question: 'Ce soir, film…', choices: ['qui fait rire', 'qui fait pleurer'] },
    retard: { question: 'Ton pote a 20 minutes de retard, tu…', choices: ['lui envoies un mème', 'lui dis de prendre son temps'] },
    cuisine: { question: 'En cuisine, tu…', choices: ['suis la recette', 'improvises tout'] },
    anniv: { question: 'Pour ton anniversaire…', choices: ['Un petit dîner à deux', 'Une grosse fête'] },
    appel: { question: 'Un appel inattendu, tu…', choices: ['décroches direct', 'laisses sonner'] },
    sport: { question: 'Le sport, c’est…', choices: ['en solo, avec mes écouteurs', 'en équipe, en criant'] },
    critique: { question: 'On critique ton look, tu…', choices: ['réponds cash', 'en ris avec eux'] },
    musique: { question: 'En soirée, la musique…', choices: ['C’est moi qui choisis', 'Je laisse faire'] },
    dimanche: { question: 'Dimanche, tu…', choices: ['ranges ta vie', 'pars à l’aventure'] },
    animaux: { question: 'Un chien croise ta route, tu…', choices: ['le caresses', 'lui parles comme à un humain'] },
    photo: { question: 'Sur les photos de groupe, tu…', choices: ['te caches derrière', 'fais une grimace devant'] },
    defi: { question: 'Un défi idiot entre potes, tu…', choices: ['regardes', 'relèves'] },
    mots: { question: 'Pour dire je t’aime bien, tu…', choices: ['le dis avec des mots', 'le montres sans rien dire'] },
    nuit: { question: 'À 2 h du matin, tu…', choices: ['dors depuis longtemps', 'refais le monde'] },
    vacances: { question: 'Les vacances idéales…', choices: ['Une cabane perdue', 'Un festival'] },
    blague: { question: 'Ta blague tombe à plat, tu…', choices: ['en refais une pire', 'changes de sujet'] },
    dessert: { question: 'Au restaurant, le dessert…', choices: ['Je partage', 'Personne n’y touche'] },
  } as Record<string, ChallengeWords>,
  en: {
    soiree: { question: 'Tonight, you’d rather…', choices: ['Couch and blanket', 'Going out on a whim'] },
    message: { question: 'An important message? You…', choices: ['write a novel', 'reply in one word'] },
    dispute: { question: 'A friend teases you. You…', choices: ['fire right back', 'give them a hug'] },
    weekend: { question: 'The ideal weekend…', choices: ['Nothing planned', 'Three plans a day'] },
    fete: { question: 'At a party, you’re…', choices: ['by the snacks, chilling', 'on the dance floor'] },
    vocal: { question: '4-minute voice notes…', choices: ['I love sending them', 'I play them at 2x'] },
    compliment: { question: 'Someone pays you a compliment. You…', choices: ['pay one back', 'crack a joke'] },
    jeu: { question: 'A board game? You…', choices: ['play to win', 'play for laughs'] },
    voyage: { question: 'On a trip, you’d rather…', choices: ['Plan everything', 'Get lost on purpose'] },
    nouveau: { question: 'Someone new shows up. You…', choices: ['go talk to them', 'wait for them to come over'] },
    secret: { question: 'A secret? You…', choices: ['keep it forever', 'tell your minimoa'] },
    matin: { question: 'In the morning, you’re…', choices: ['in zombie mode', 'already singing'] },
    cadeau: { question: 'A great gift is…', choices: ['something useful', 'something that makes you cry'] },
    pluie: { question: 'It’s raining. You…', choices: ['stay cozy inside', 'jump in the puddles'] },
    groupe: { question: 'In a group chat, you…', choices: ['read without writing', 'start the topics'] },
    film: { question: 'Tonight, a movie…', choices: ['that makes you laugh', 'that makes you cry'] },
    retard: { question: 'A friend is 20 minutes late. You…', choices: ['send them a meme', 'tell them to take their time'] },
    cuisine: { question: 'In the kitchen, you…', choices: ['follow the recipe', 'improvise everything'] },
    anniv: { question: 'For your birthday…', choices: ['A quiet dinner for two', 'A huge party'] },
    appel: { question: 'An unexpected call? You…', choices: ['pick up right away', 'let it ring'] },
    sport: { question: 'Working out is…', choices: ['solo, with my earbuds', 'in a team, yelling'] },
    critique: { question: 'Someone mocks your look. You…', choices: ['clap back', 'laugh along with them'] },
    musique: { question: 'At a party, the music…', choices: ['I’m the one picking it', 'I go with the flow'] },
    dimanche: { question: 'On Sunday, you…', choices: ['sort out your life', 'go on an adventure'] },
    animaux: { question: 'A dog crosses your path. You…', choices: ['give it a pat', 'talk to it like a person'] },
    photo: { question: 'In group photos, you…', choices: ['hide at the back', 'pull a face up front'] },
    defi: { question: 'A silly dare among friends? You…', choices: ['watch', 'take it on'] },
    mots: { question: 'To say you like someone, you…', choices: ['say it with words', 'show it without a word'] },
    nuit: { question: 'At 2 a.m., you…', choices: ['have been asleep for hours', 'are fixing the world'] },
    vacances: { question: 'The ideal vacation…', choices: ['A remote cabin', 'A festival'] },
    blague: { question: 'Your joke falls flat. You…', choices: ['tell an even worse one', 'change the subject'] },
    dessert: { question: 'At a restaurant, dessert…', choices: ['I share', 'Nobody touches mine'] },
  },
  es: {
    soiree: { question: 'Esta noche, mejor…', choices: ['Sofá y manta', 'Salida improvisada'] },
    message: { question: '¿Un mensaje importante? Tú…', choices: ['escribes una novela', 'respondes con una palabra'] },
    dispute: { question: 'Te toman el pelo. Tú…', choices: ['devuelves la pelota', 'das un abrazo'] },
    weekend: { question: 'El fin de semana ideal…', choices: ['Nada previsto', 'Tres planes al día'] },
    fete: { question: 'En una fiesta, estás…', choices: ['cerca de la comida, tranqui', 'en medio de la pista'] },
    vocal: { question: 'Los audios de 4 minutos…', choices: ['Me encanta mandarlos', 'Los escucho a x2'] },
    compliment: { question: 'Te hacen un cumplido. Tú…', choices: ['devuelves otro', 'haces una broma'] },
    jeu: { question: '¿Un juego de mesa? Tú…', choices: ['juegas para ganar', 'juegas para reírte'] },
    voyage: { question: 'De viaje, mejor…', choices: ['Planearlo todo', 'Perderse a propósito'] },
    nouveau: { question: 'Llega una persona nueva. Tú…', choices: ['vas a hablarle', 'esperas a que se acerque'] },
    secret: { question: '¿Un secreto? Tú…', choices: ['lo guardas para siempre', 'se lo cuentas a tu minimoa'] },
    matin: { question: 'Por la mañana, estás…', choices: ['en modo zombi', 'ya cantando'] },
    cadeau: { question: 'Un buen regalo es…', choices: ['algo útil', 'algo que hace llorar'] },
    pluie: { question: 'Llueve. Tú…', choices: ['te quedas a cubierto', 'saltas en los charcos'] },
    groupe: { question: 'En un chat de grupo, tú…', choices: ['lees sin escribir', 'sacas los temas'] },
    film: { question: 'Esta noche, una peli…', choices: ['que haga reír', 'que haga llorar'] },
    retard: { question: 'Te hacen esperar 20 minutos. Tú…', choices: ['mandas un meme', 'dices que no hay prisa'] },
    cuisine: { question: 'En la cocina, tú…', choices: ['sigues la receta', 'lo improvisas todo'] },
    anniv: { question: 'Para tu cumpleaños…', choices: ['Una cenita para dos', 'Una fiesta enorme'] },
    appel: { question: '¿Una llamada inesperada? Tú…', choices: ['contestas al momento', 'dejas que suene'] },
    sport: { question: 'El deporte…', choices: ['a solas, con auriculares', 'en equipo, a gritos'] },
    critique: { question: 'Critican tu look. Tú…', choices: ['respondes sin filtro', 'te lo tomas a risa'] },
    musique: { question: 'En una fiesta, la música…', choices: ['La elijo yo', 'Me dejo llevar'] },
    dimanche: { question: 'El domingo, tú…', choices: ['ordenas tu vida', 'te vas a la aventura'] },
    animaux: { question: 'Te cruzas con un perro. Tú…', choices: ['lo acaricias', 'le hablas como a una persona'] },
    photo: { question: 'En las fotos de grupo, tú…', choices: ['te escondes detrás', 'pones caras delante'] },
    defi: { question: '¿Un reto absurdo con tu gente? Tú…', choices: ['miras', 'te apuntas'] },
    mots: { question: 'Para decir que alguien te cae bien, tú…', choices: ['lo dices con palabras', 'lo demuestras sin decir nada'] },
    nuit: { question: 'A las 2 de la madrugada, tú…', choices: ['llevas horas durmiendo', 'arreglas el mundo'] },
    vacances: { question: 'Las vacaciones ideales…', choices: ['Una cabaña perdida', 'Un festival'] },
    blague: { question: 'Tu chiste no hace gracia. Tú…', choices: ['cuentas uno peor', 'cambias de tema'] },
    dessert: { question: 'En el restaurante, el postre…', choices: ['Lo comparto', 'Que nadie lo toque'] },
  },
  pt: {
    soiree: { question: 'Hoje à noite, melhor…', choices: ['Sofá e cobertor', 'Um rolê improvisado'] },
    message: { question: 'Uma mensagem importante? Você…', choices: ['escreve um livro', 'responde com uma palavra'] },
    dispute: { question: 'Alguém da galera te zoa. Você…', choices: ['devolve na mesma moeda', 'dá um abraço'] },
    weekend: { question: 'O fim de semana ideal…', choices: ['Nada planejado', 'Três programas por dia'] },
    fete: { question: 'Numa festa, você fica…', choices: ['perto da comida, de boa', 'no meio da pista'] },
    vocal: { question: 'Áudios de 4 minutos…', choices: ['Adoro mandar', 'Escuto em 2x'] },
    compliment: { question: 'Alguém te elogia. Você…', choices: ['elogia de volta', 'faz uma piada'] },
    jeu: { question: 'Um jogo de tabuleiro? Você…', choices: ['joga para ganhar', 'joga para dar risada'] },
    voyage: { question: 'Viajando, melhor…', choices: ['Planejar tudo', 'Se perder de propósito'] },
    nouveau: { question: 'Chega uma pessoa nova. Você…', choices: ['vai falar com ela', 'espera ela vir até você'] },
    secret: { question: 'Um segredo? Você…', choices: ['guarda para sempre', 'conta para o seu minimoa'] },
    matin: { question: 'De manhã, você está…', choices: ['no modo zumbi', 'já cantando'] },
    cadeau: { question: 'Um bom presente é…', choices: ['algo útil', 'algo que faz chorar'] },
    pluie: { question: 'Está chovendo. Você…', choices: ['fica no quentinho', 'pula nas poças'] },
    groupe: { question: 'Num grupo de mensagens, você…', choices: ['lê sem escrever', 'puxa os assuntos'] },
    film: { question: 'Hoje à noite, um filme…', choices: ['que faz rir', 'que faz chorar'] },
    retard: { question: 'Te deixam esperando 20 minutos. Você…', choices: ['manda um meme', 'diz para não ter pressa'] },
    cuisine: { question: 'Na cozinha, você…', choices: ['segue a receita', 'improvisa tudo'] },
    anniv: { question: 'No seu aniversário…', choices: ['Um jantarzinho a dois', 'Uma festa enorme'] },
    appel: { question: 'Uma ligação inesperada? Você…', choices: ['atende na hora', 'deixa tocar'] },
    sport: { question: 'Esporte é…', choices: ['solo, de fone de ouvido', 'em equipe, gritando'] },
    critique: { question: 'Criticam seu visual. Você…', choices: ['responde na lata', 'ri junto'] },
    musique: { question: 'Na festa, a música…', choices: ['Eu que escolho', 'Deixo rolar'] },
    dimanche: { question: 'No domingo, você…', choices: ['arruma a vida', 'parte para a aventura'] },
    animaux: { question: 'Um cachorro cruza seu caminho. Você…', choices: ['faz carinho', 'fala com ele como se fosse gente'] },
    photo: { question: 'Nas fotos em grupo, você…', choices: ['se esconde atrás', 'faz careta na frente'] },
    defi: { question: 'Um desafio bobo com a galera? Você…', choices: ['assiste', 'topa'] },
    mots: { question: 'Para dizer que gosta de alguém, você…', choices: ['diz com palavras', 'mostra sem dizer nada'] },
    nuit: { question: 'Às 2 da manhã, você…', choices: ['já está dormindo há horas', 'está resolvendo o mundo'] },
    vacances: { question: 'As férias ideais…', choices: ['Uma cabana isolada', 'Um festival'] },
    blague: { question: 'Sua piada não pegou. Você…', choices: ['conta uma pior', 'muda de assunto'] },
    dessert: { question: 'No restaurante, a sobremesa…', choices: ['Eu divido', 'Ninguém toca na minha'] },
  },
  nl: {
    soiree: { question: 'Vanavond liever…', choices: ['Bank en dekentje', 'Spontaan op stap'] },
    message: { question: 'Een belangrijk bericht? Je…', choices: ['schrijft een roman', 'antwoordt in één woord'] },
    dispute: { question: 'Een vriend plaagt je. Je…', choices: ['kaatst de bal terug', 'geeft een knuffel'] },
    weekend: { question: 'Het ideale weekend…', choices: ['Niets gepland', 'Drie plannen per dag'] },
    fete: { question: 'Op een feestje sta je…', choices: ['rustig bij het buffet', 'midden op de dansvloer'] },
    vocal: { question: 'Spraakberichten van 4 minuten…', choices: ['Ik stuur ze dolgraag', 'Ik luister ze op 2x'] },
    compliment: { question: 'Je krijgt een compliment. Je…', choices: ['geeft er een terug', 'maakt een grapje'] },
    jeu: { question: 'Een bordspel? Je…', choices: ['speelt om te winnen', 'speelt voor de lol'] },
    voyage: { question: 'Op reis liever…', choices: ['Alles plannen', 'Expres verdwalen'] },
    nouveau: { question: 'Er komt iemand nieuw bij. Je…', choices: ['gaat een praatje maken', 'wacht tot die naar jou komt'] },
    secret: { question: 'Een geheim? Je…', choices: ['houdt het voor altijd voor je', 'vertelt het aan je minimoa'] },
    matin: { question: '’s Ochtends ben je…', choices: ['een zombie', 'al aan het zingen'] },
    cadeau: { question: 'Een geslaagd cadeau is…', choices: ['iets handigs', 'iets waar je van moet huilen'] },
    pluie: { question: 'Het regent. Je…', choices: ['blijft lekker binnen', 'springt in de plassen'] },
    groupe: { question: 'In een groepsapp…', choices: ['lees je alleen mee', 'begin je de gesprekken'] },
    film: { question: 'Vanavond een film…', choices: ['om te lachen', 'om bij te huilen'] },
    retard: { question: 'Een vriend is 20 minuten te laat. Je…', choices: ['stuurt een meme', 'zegt: doe maar rustig aan'] },
    cuisine: { question: 'In de keuken…', choices: ['volg je het recept', 'improviseer je alles'] },
    anniv: { question: 'Voor je verjaardag…', choices: ['Een etentje met z’n tweeën', 'Een groot feest'] },
    appel: { question: 'Een onverwacht telefoontje? Je…', choices: ['neemt meteen op', 'laat hem overgaan'] },
    sport: { question: 'Sporten doe je…', choices: ['alleen, met oortjes', 'in een team, met veel geschreeuw'] },
    critique: { question: 'Iemand kraakt je look af. Je…', choices: ['zegt waar het op staat', 'lacht mee'] },
    musique: { question: 'Op een feestje, de muziek…', choices: ['Die kies ik', 'Ik laat het gebeuren'] },
    dimanche: { question: 'Op zondag…', choices: ['ruim je je leven op', 'ga je op avontuur'] },
    animaux: { question: 'Je komt een hond tegen. Je…', choices: ['aait hem', 'praat tegen hem als tegen een mens'] },
    photo: { question: 'Op groepsfoto’s…', choices: ['verstop je je achteraan', 'trek je vooraan een gek gezicht'] },
    defi: { question: 'Een flauwe uitdaging onder vrienden? Je…', choices: ['kijkt toe', 'doet mee'] },
    mots: { question: 'Je vindt iemand leuk. Je…', choices: ['zegt het met woorden', 'laat het zien zonder woorden'] },
    nuit: { question: 'Om 2 uur ’s nachts…', choices: ['slaap je al lang', 'verbeter je de wereld'] },
    vacances: { question: 'De ideale vakantie…', choices: ['Een afgelegen hutje', 'Een festival'] },
    blague: { question: 'Niemand lacht om je grap. Je…', choices: ['maakt een nog slechtere', 'begint over iets anders'] },
    dessert: { question: 'In een restaurant, het toetje…', choices: ['Ik deel', 'Niemand komt aan het mijne'] },
  },
});

const cache = new Map<Locale, readonly Challenge[]>();

/** Les défis avec leurs mots dans une langue (français pour ce qui manque). */
export function challengesIn(locale: Locale): readonly Challenge[] {
  let list = cache.get(locale);
  if (!list) {
    const words = challengeText.in(locale);
    list = CHALLENGE_DATA.map((d) => {
      const w = words[d.id] ?? { question: d.id, choices: [d.id, d.id] };
      return { id: d.id, question: w.question, choices: [{ label: w.choices[0], delta: d.deltas[0] }, { label: w.choices[1], delta: d.deltas[1] }] as const };
    });
    cache.set(locale, list);
  }
  return list;
}
