/**
 * Voix des minimoas dans la conversation (chantier « plateforme », spéc §9).
 * Dictionnaires à clés par langue (seul le français est écrit ; repli sur le français), par rôle et par voix.
 * Fonctions pures : la variante est choisie par `seed`, jamais par un tirage. Jamais le mot « pet ».
 */
import type { LinkHealthKey, Locale, MinimoaVoice, VisionAxis } from '@blowy/domain';
import { defineMessages, fillTemplate } from '../i18n/core';
import { type AiProcessor, DEFAULT_AI_PROCESSOR, aiProcessorView } from '../ai-provider';

export { fillTemplate };

/** Langue d'un texte de l'API. */
type Lang = Locale;

type VoiceLines = Readonly<Record<MinimoaVoice, readonly string[]>>;

interface ChatLines {
  /** Accord de lecture : nomme le prestataire d'IA et son pays (configuration de l'API, jamais écrits en dur). */
  confidentiality: (provider: string, country: string) => string;
  system: { linkCreated: string };
  /** Brise-glace par axe de vision partagé ({other} = minimoa de l'autre). */
  icebreaker: Readonly<Record<VisionAxis, readonly string[]>>;
  /** Brise-glace sans point commun connu. */
  icebreakerGeneric: readonly string[];
  /** Relance au rythme seulement ({days}, {other}). */
  nudge: VoiceLines;
  /** Remarque au rythme seulement. */
  remark: VoiceLines;
  /** Premier message du jour dans le lien. */
  firstOfDay: VoiceLines;
  /** Réaction à un mot doux / à une vanne ({other}). */
  sweet: VoiceLines;
  tease: VoiceLines;
  /** Garde-fou, vu par la seule personne concernée. */
  guard: VoiceLines;
  /** Une ligne par lien dans le bilan de la semaine ({name} = prénom de l'autre). */
  health: Readonly<Record<LinkHealthKey, string>>;
}

const FR: ChatLines = {
  /** Texte de la spéc (§9), servi avec l'état de l'accord pour que l'app montre partout les mêmes mots. */
  // App Review 5.1.2(i) : dire que l'IA est un tiers, lequel et où (audit B5). Pas de « aucun humain » : un message
  // signalé (par une personne ou par le filtre) et son contexte immédiat sont lus par la modération.
  confidentiality: (provider: string, country: string): string =>
    `Personne chez Blowy ne lit tes conversations, sauf un message signalé et les quelques messages autour, pour la modération. Si vous l’activez l’un et l’autre, une IA lit vos derniers messages pour que vos minimoas puissent y réagir. Cette IA est fournie par ${provider} (${country}), notre prestataire, qui reçoit ces messages pour nous. Tu peux retirer ton accord quand tu veux.`,
  /** Bandeaux du système dans le chat. */
  system: { linkCreated: 'Vos minimoas se sont trouvés. Vous pouvez vous écrire.' },

  icebreaker: {
    foyer: [
      'Vous voyez le foyer un peu pareil, vous deux. Question : le dîner du dimanche idéal, il ressemble à quoi ?',
      'Point commun repéré côté foyer. Alors : grande tablée ou tête-à-tête ?',
    ],
    ancrage: [
      'Vous avez la même idée de l’endroit où vivre. Question : la ville où vous vous voyez dans cinq ans ?',
      'Ici ou ailleurs, vous êtes d’accord. Le dernier endroit qui vous a donné envie de rester ?',
    ],
    elan: [
      'Côté projets, vous allez dans le même sens. Le truc qui vous occupe la tête en ce moment ?',
      'Même rapport au travail, vous deux. Un projet perso que vous n’avez encore dit à personne ?',
    ],
    rythme: [
      'Même rythme de vie, ça se voit. Votre soirée parfaite en semaine ?',
      'Vous vivez à la même vitesse. Dernière sortie qui valait le coup ?',
    ],
    cap: [
      'Vous prévoyez à peu près pareil, vous deux. Les prochaines vacances : réservées ou au feeling ?',
      'Même façon de voir loin. Le dernier achat que vous avez préparé des mois ?',
    ],
  },
  icebreakerGeneric: [
    'Bon. {other} et moi, on a fait les présentations. À vous : le meilleur moment de votre semaine ?',
    'On vous a trouvés compatibles, on ne se trompe pas souvent. Première question : café ou apéro ?',
  ],
  nudge: {
    doux: ['Ça fait {days} jours. {other} et moi, on se demandait comment vous alliez.', 'Petit silence de {days} jours. Un mot suffit, vous savez.'],
    sec: ['{days} jours sans un mot. Je dis ça, je dis rien.', '{days} jours. {other} commence à bâiller.'],
    joueur: ['{days} jours de silence. Je propose un jeu : le premier qui écrit a gagné.', 'Allô ? {days} jours ! {other} et moi, on s’ennuie.'],
    pose: ['Ça fait {days} jours. Vous en étiez où ?', '{days} jours de calme. On reprend quand vous voulez.'],
  },
  remark: {
    doux: ['Vous vous répondez vite. Je note.', 'J’aime bien quand vous parlez comme ça.'],
    sec: ['Ça papote. Je prends des notes.', 'Vous êtes d’accord sur plus de choses que vous ne croyez.'],
    joueur: ['Ça va vite ici. {other}, tu suis ?', 'Je compte les points. Égalité, pour l’instant.'],
    pose: ['Vous êtes d’accord sur plus de choses que vous ne croyez.', 'Belle conversation. Je me fais discret.'],
  },
  firstOfDay: {
    doux: ['Premier message du jour. {other} et moi, on est contents.', 'Bonjour vous deux. Ça commence bien.'],
    sec: ['Premier message du jour. Enfin.', 'Ah, ça se réveille.'],
    joueur: ['Premier message du jour ! {other}, t’as vu ?', 'C’est parti pour aujourd’hui.'],
    pose: ['Premier message du jour. Le lien respire.', 'Bonjour. Je m’installe et j’écoute.'],
  },
  sweet: {
    doux: ['Oh. C’était doux, ça. {other} fait semblant de ne pas rougir.', 'Mot doux noté. On garde.'],
    sec: ['C’était presque gentil. Je note.', 'Tout mignon. Je fais semblant de ne rien voir.'],
    joueur: ['Oh. {other}, tu as vu ça ?', 'Mot doux détecté. Je danse, intérieurement.'],
    pose: ['C’était doux. {other} ronronne, je crois.', 'Joli. Je ne dis rien de plus.'],
  },
  tease: {
    doux: ['Aïe. Gentiment, hein.', 'Ça pique un peu. {other} prépare sa réponse.'],
    sec: ['Piqué. J’adore.', 'Bien envoyé.'],
    joueur: ['La vanne ! {other} prépare sa revanche.', 'Ça chambre sec ici. Je m’installe.'],
    pose: ['Je n’ai rien vu, rien entendu. Mais c’était drôle.', 'Vanne notée. Match retour attendu.'],
  },
  guard: {
    doux: ['Ça chauffe un peu, non ? Une pause de dix minutes, et on reprend plus doucement.', 'Ça a l’air tendu. Tu veux souffler avant de répondre ?'],
    sec: ['Le ton monte. Pause, et tu relis avant d’envoyer ?', 'On respire. Dix minutes, puis tu réponds.'],
    joueur: ['Temps mort ! Je siffle une pause de dix minutes.', 'Ça s’échauffe. Pause goûter, et on reprend ?'],
    pose: ['Le ton monte un peu. Une pause, peut-être ?', 'Tu veux qu’on fasse une pause avant de répondre ?'],
  },
  health: {
    new: 'Avec {name} : ça vient de commencer, tout est possible.',
    quiet: 'Avec {name} : une semaine calme, un mot suffira pour relancer.',
    together: 'Avec {name} : vous vous écrivez presque tous les jours. Ça se voit.',
    lively: 'Avec {name} : vous vous parlez beaucoup, et ça se sent.',
    one_sided: 'Avec {name} : tu donnes le rythme, c’est précieux.',
    balanced: 'Avec {name} : vous vous répondez bien, l’un comme l’autre.',
  },
};

const EN: ChatLines = {
  confidentiality: (provider: string, country: string): string =>
    `No one at Blowy reads your conversations, except a reported message and the few messages around it, for moderation. If you both turn it on, an AI reads your latest messages so your minimoas can react to them. This AI is provided by ${provider} (${country}), our provider, which receives these messages on our behalf. You can withdraw your consent whenever you want.`,
  system: { linkCreated: 'Your minimoas found each other. You can write to each other now.' },
  icebreaker: {
    foyer: [
      'You two see family life in much the same way. Question: what does your ideal Sunday dinner look like?',
      'Common ground spotted on the family front. So: a big table or just the two of you?',
    ],
    ancrage: [
      'You have the same idea of where to live. Question: which city do you see yourselves in five years from now?',
      'Here or elsewhere, you agree. The last place that made you want to stay?',
    ],
    elan: [
      'When it comes to projects, you’re heading the same way. What’s on your mind these days?',
      'You two see work the same way. A personal project you haven’t told anyone about yet?',
    ],
    rythme: [
      'Same pace of life, and it shows. Your perfect weeknight?',
      'You live at the same speed. The last night out that was worth it?',
    ],
    cap: [
      'You two plan ahead in much the same way. Next vacation: booked or played by ear?',
      'Same way of looking ahead. The last purchase you planned for months?',
    ],
  },
  icebreakerGeneric: [
    'Right. {other} and I made the introductions. Your turn: the best moment of your week?',
    'We found you compatible, and we’re rarely wrong. First question: coffee or drinks?',
  ],
  nudge: {
    doux: ['It’s been {days} days. {other} and I were wondering how you were doing.', 'A little {days}-day silence. One word is enough, you know.'],
    sec: ['{days} days without a word. Just saying.', '{days} days. {other} is starting to yawn.'],
    joueur: ['{days} days of silence. Let’s play a game: first one to write wins.', 'Hello? {days} days! {other} and I are bored.'],
    pose: ['It’s been {days} days. Where did you leave off?', '{days} quiet days. Pick it up whenever you like.'],
  },
  remark: {
    doux: ['You two reply fast. Noted.', 'I like it when you talk like this.'],
    sec: ['Lots of chatter. I’m taking notes.', 'You agree on more than you think.'],
    joueur: ['Things are moving fast here. {other}, keeping up?', 'I’m keeping score. A tie, for now.'],
    pose: ['You agree on more than you think.', 'Nice conversation. I’ll keep out of the way.'],
  },
  firstOfDay: {
    doux: ['First message of the day. {other} and I are happy.', 'Morning, you two. Off to a good start.'],
    sec: ['First message of the day. Finally.', 'Ah, signs of life.'],
    joueur: ['First message of the day! {other}, did you see?', 'And we’re off for today.'],
    pose: ['First message of the day. The link is breathing.', 'Morning. I’ll settle in and listen.'],
  },
  sweet: {
    doux: ['Oh. That was sweet. {other} is pretending not to blush.', 'Sweet note logged. We’re keeping that one.'],
    sec: ['That was almost nice. Noted.', 'How cute. I’ll pretend I didn’t see.'],
    joueur: ['Oh. {other}, did you see that?', 'Sweet note detected. I’m dancing, on the inside.'],
    pose: ['That was sweet. I think {other} is purring.', 'Lovely. I’ll say no more.'],
  },
  tease: {
    doux: ['Ouch. Gently, okay?', 'That stings a little. {other} is working on a comeback.'],
    sec: ['Burn. Love it.', 'Nice shot.'],
    joueur: ['What a tease! {other} is plotting revenge.', 'Serious teasing in here. Pulling up a chair.'],
    pose: ['I saw nothing, heard nothing. But that was funny.', 'Tease noted. Rematch expected.'],
  },
  guard: {
    doux: ['Getting a bit heated, isn’t it? A ten-minute break, then we pick it up more gently.', 'Seems tense. Want to take a breath before you reply?'],
    sec: ['Tempers are rising. Take a break, and reread before sending?', 'Breathe. Ten minutes, then reply.'],
    joueur: ['Time out! I’m calling a ten-minute break.', 'Things are heating up. Snack break, then we carry on?'],
    pose: ['Things are getting a little tense. A break, maybe?', 'Want to take a break before you reply?'],
  },
  health: {
    new: 'With {name}: it’s just getting started, anything’s possible.',
    quiet: 'With {name}: a quiet week, one message will get it going again.',
    together: 'With {name}: you write to each other almost every day. It shows.',
    lively: 'With {name}: you talk a lot, and you can feel it.',
    one_sided: 'With {name}: you set the pace, and that’s precious.',
    balanced: 'With {name}: you both keep the conversation going.',
  },
};

const ES: ChatLines = {
  confidentiality: (provider: string, country: string): string =>
    `Nadie en Blowy lee tus conversaciones, salvo un mensaje reportado y los pocos mensajes que lo rodean, para la moderación. Si lo activan las dos personas, una IA lee sus últimos mensajes para que sus minimoas puedan reaccionar a ellos. Esta IA la proporciona ${provider} (${country}), nuestro proveedor, que recibe estos mensajes en nuestro nombre. Puedes retirar tu consentimiento cuando quieras.`,
  system: { linkCreated: 'Sus minimoas se encontraron. Ya pueden escribirse.' },
  icebreaker: {
    foyer: [
      'Ven el hogar de forma parecida. Pregunta: ¿cómo sería su cena de domingo ideal?',
      'Punto en común detectado en lo del hogar. Entonces: ¿mesa grande o cena para dos?',
    ],
    ancrage: [
      'Tienen la misma idea de dónde vivir. Pregunta: ¿en qué ciudad se ven dentro de cinco años?',
      'Aquí o en otro lugar, están de acuerdo. ¿El último sitio que les dio ganas de quedarse?',
    ],
    elan: [
      'En proyectos, van en la misma dirección. ¿Qué les ronda la cabeza estos días?',
      'Misma relación con el trabajo. ¿Un proyecto personal que todavía no le han contado a nadie?',
    ],
    rythme: [
      'Mismo ritmo de vida, se nota. ¿Su noche perfecta entre semana?',
      'Viven a la misma velocidad. ¿La última salida que valió la pena?',
    ],
    cap: [
      'Planean más o menos igual. Las próximas vacaciones: ¿reservadas o improvisadas?',
      'Misma forma de mirar a lo lejos. ¿La última compra que prepararon durante meses?',
    ],
  },
  icebreakerGeneric: [
    'Bueno. {other} y yo ya hicimos las presentaciones. Les toca: ¿el mejor momento de su semana?',
    'Vimos que son compatibles, y no solemos equivocarnos. Primera pregunta: ¿café o una copa?',
  ],
  nudge: {
    doux: ['Ya van {days} días. {other} y yo nos preguntábamos cómo estaban.', 'Un pequeño silencio de {days} días. Basta una palabra, ¿saben?'],
    sec: ['{days} días sin una palabra. Ahí lo dejo.', '{days} días. {other} empieza a bostezar.'],
    joueur: ['{days} días de silencio. Propongo un juego: quien escriba primero gana.', '¿Hola? ¡{days} días! {other} y yo nos aburrimos.'],
    pose: ['Ya van {days} días. ¿En qué se habían quedado?', '{days} días de calma. Seguimos cuando quieran.'],
  },
  remark: {
    doux: ['Se responden rápido. Tomo nota.', 'Me gusta cuando hablan así.'],
    sec: ['Cuánta charla. Tomo apuntes.', 'Están de acuerdo en más cosas de las que creen.'],
    joueur: ['Esto va rápido. {other}, ¿me sigues?', 'Llevo la cuenta. Empate, por ahora.'],
    pose: ['Están de acuerdo en más cosas de las que creen.', 'Bonita conversación. Me hago a un lado.'],
  },
  firstOfDay: {
    doux: ['Primer mensaje del día. {other} y yo estamos contentos.', 'Buenos días por aquí. Empezamos bien.'],
    sec: ['Primer mensaje del día. Por fin.', 'Vaya, esto se despierta.'],
    joueur: ['¡Primer mensaje del día! {other}, ¿lo viste?', '¡Arrancamos el día!'],
    pose: ['Primer mensaje del día. El vínculo respira.', 'Buenos días. Me acomodo y escucho.'],
  },
  sweet: {
    doux: ['Oh. Eso fue tierno. {other} finge que no se sonroja.', 'Cariño anotado. Nos lo quedamos.'],
    sec: ['Eso fue casi amable. Tomo nota.', 'Qué tierno. Hago como que no vi nada.'],
    joueur: ['Oh. {other}, ¿viste eso?', 'Cariño detectado. Estoy bailando por dentro.'],
    pose: ['Eso fue tierno. Creo que {other} está ronroneando.', 'Bonito. No digo nada más.'],
  },
  tease: {
    doux: ['Ay. Con cariño, ¿eh?', 'Eso pica un poco. {other} prepara su respuesta.'],
    sec: ['Zas. Me encanta.', 'Buena esa.'],
    joueur: ['¡Qué broma! {other} prepara su revancha.', 'Aquí se pican fuerte. Me pongo cómodo.'],
    pose: ['No vi nada, no oí nada. Pero tuvo gracia.', 'Broma anotada. Se espera la revancha.'],
  },
  guard: {
    doux: ['Esto se está calentando, ¿no? Una pausa de diez minutos y seguimos con más calma.', 'Parece tenso. ¿Quieres respirar antes de responder?'],
    sec: ['El tono sube. ¿Pausa, y relees antes de enviar?', 'Respira. Diez minutos y luego respondes.'],
    joueur: ['¡Tiempo muerto! Toca pausa de diez minutos.', 'Esto se calienta. ¿Pausa para merendar y seguimos?'],
    pose: ['El tono sube un poco. ¿Una pausa, quizá?', '¿Quieres que hagamos una pausa antes de responder?'],
  },
  health: {
    new: 'Con {name}: acaba de empezar, todo es posible.',
    quiet: 'Con {name}: una semana tranquila, basta un mensaje para retomar.',
    together: 'Con {name}: se escriben casi todos los días. Se nota.',
    lively: 'Con {name}: hablan mucho, y se siente.',
    one_sided: 'Con {name}: tú marcas el ritmo, y eso vale mucho.',
    balanced: 'Con {name}: se responden bien, por ambas partes.',
  },
};

const PT: ChatLines = {
  confidentiality: (provider: string, country: string): string =>
    `Ninguém no Blowy lê suas conversas, exceto uma mensagem denunciada e as poucas mensagens em volta dela, para a moderação. Se as duas pessoas ativarem, uma IA lê as últimas mensagens de vocês para que os minimoas de vocês possam reagir a elas. Essa IA é fornecida por ${provider} (${country}), nosso fornecedor, que recebe essas mensagens em nosso nome. Você pode retirar seu consentimento quando quiser.`,
  system: { linkCreated: 'Os minimoas de vocês se encontraram. Agora vocês podem trocar mensagens.' },
  icebreaker: {
    foyer: [
      'Vocês veem a vida em família de um jeito parecido. Pergunta: como seria o jantar de domingo ideal?',
      'Ponto em comum encontrado no assunto família. Então: mesa cheia ou a dois?',
    ],
    ancrage: [
      'Vocês têm a mesma ideia de onde morar. Pergunta: em que cidade vocês se veem daqui a cinco anos?',
      'Aqui ou em outro lugar, vocês concordam. Qual foi o último lugar que deu vontade de ficar?',
    ],
    elan: [
      'Em projetos, vocês vão na mesma direção. O que anda ocupando a cabeça de vocês agora?',
      'Mesma relação com o trabalho. Um projeto pessoal que vocês ainda não contaram para ninguém?',
    ],
    rythme: [
      'Mesmo ritmo de vida, dá para ver. A noite perfeita de vocês durante a semana?',
      'Vocês vivem na mesma velocidade. Qual foi o último rolê que valeu a pena?',
    ],
    cap: [
      'Vocês planejam mais ou menos do mesmo jeito. As próximas férias: reservadas ou no improviso?',
      'Mesmo jeito de olhar longe. A última compra que vocês planejaram por meses?',
    ],
  },
  icebreakerGeneric: [
    'Bom. Eu e {other} já fizemos as apresentações. Agora é com vocês: o melhor momento da semana?',
    'A gente achou vocês compatíveis, e raramente erramos. Primeira pergunta: café ou um drink?',
  ],
  nudge: {
    doux: ['Já faz {days} dias. Eu e {other} estávamos pensando em como vocês estão.', 'Um silenciozinho de {days} dias. Uma palavra basta, sabiam?'],
    sec: ['{days} dias sem uma palavra. Só comentando.', '{days} dias. {other} começou a bocejar.'],
    joueur: ['{days} dias de silêncio. Proponho um jogo: quem escrever primeiro ganha.', 'Alô? {days} dias! Eu e {other} estamos entediados.'],
    pose: ['Já faz {days} dias. Onde vocês tinham parado?', '{days} dias de calma. A gente retoma quando vocês quiserem.'],
  },
  remark: {
    doux: ['Vocês se respondem rápido. Anotado.', 'Gosto quando vocês conversam assim.'],
    sec: ['Quanto papo. Estou anotando.', 'Vocês concordam em mais coisas do que imaginam.'],
    joueur: ['Aqui está rápido. {other}, está acompanhando?', 'Estou contando os pontos. Empate, por enquanto.'],
    pose: ['Vocês concordam em mais coisas do que imaginam.', 'Bela conversa. Vou ficar na minha.'],
  },
  firstOfDay: {
    doux: ['Primeira mensagem do dia. Eu e {other} estamos felizes.', 'Bom dia por aqui. Começou bem.'],
    sec: ['Primeira mensagem do dia. Finalmente.', 'Ah, acordaram.'],
    joueur: ['Primeira mensagem do dia! {other}, viu só?', 'Bora, o dia começou.'],
    pose: ['Primeira mensagem do dia. O vínculo respira.', 'Bom dia. Vou me ajeitar e ouvir.'],
  },
  sweet: {
    doux: ['Ah. Isso foi fofo. {other} está fingindo que não ficou vermelho.', 'Carinho anotado. Esse a gente guarda.'],
    sec: ['Isso foi quase gentil. Anotado.', 'Que fofo. Vou fingir que não vi.'],
    joueur: ['Oh. {other}, você viu isso?', 'Carinho detectado. Estou dançando por dentro.'],
    pose: ['Isso foi fofo. Acho que {other} está ronronando.', 'Bonito. Não digo mais nada.'],
  },
  tease: {
    doux: ['Ai. Com carinho, hein.', 'Essa doeu um pouco. {other} está preparando a resposta.'],
    sec: ['Toma. Adorei.', 'Mandou bem.'],
    joueur: ['Que provocação! {other} está preparando a revanche.', 'Aqui a provocação está solta. Vou me acomodar.'],
    pose: ['Não vi nada, não ouvi nada. Mas foi engraçado.', 'Provocação anotada. Aguardando a revanche.'],
  },
  guard: {
    doux: ['Está esquentando um pouco, né? Uma pausa de dez minutos, e a gente volta com mais calma.', 'Parece tenso. Quer respirar antes de responder?'],
    sec: ['O tom está subindo. Pausa, e você relê antes de enviar?', 'Respira. Dez minutos, depois você responde.'],
    joueur: ['Tempo! Vou apitar uma pausa de dez minutos.', 'Está esquentando. Pausa para o lanche e a gente continua?'],
    pose: ['O tom está subindo um pouco. Uma pausa, talvez?', 'Quer fazer uma pausa antes de responder?'],
  },
  health: {
    new: 'Com {name}: acabou de começar, tudo é possível.',
    quiet: 'Com {name}: uma semana calma, uma mensagem basta para retomar.',
    together: 'Com {name}: vocês trocam mensagens quase todo dia. Dá para ver.',
    lively: 'Com {name}: vocês conversam muito, e dá para sentir.',
    one_sided: 'Com {name}: você dá o ritmo, e isso é precioso.',
    balanced: 'Com {name}: vocês se respondem bem, dos dois lados.',
  },
};

const NL: ChatLines = {
  confidentiality: (provider: string, country: string): string =>
    `Niemand bij Blowy leest je gesprekken, behalve een gemeld bericht en de paar berichten eromheen, voor de moderatie. Als jullie het allebei aanzetten, leest een AI jullie laatste berichten zodat jullie minimoas erop kunnen reageren. Deze AI wordt geleverd door ${provider} (${country}), onze leverancier, die deze berichten namens ons ontvangt. Je kunt je toestemming intrekken wanneer je wilt.`,
  system: { linkCreated: 'Jullie minimoas hebben elkaar gevonden. Jullie kunnen elkaar nu schrijven.' },
  icebreaker: {
    foyer: [
      'Jullie kijken ongeveer hetzelfde naar een gezin. Vraag: hoe ziet jullie ideale zondagse diner eruit?',
      'Overeenkomst gevonden op het vlak van gezin. Dus: grote tafel of met z’n tweeën?',
    ],
    ancrage: [
      'Jullie hebben hetzelfde idee over waar je wilt wonen. Vraag: in welke stad zien jullie jezelf over vijf jaar?',
      'Hier of ergens anders: jullie zijn het eens. De laatste plek waar jullie wilden blijven?',
    ],
    elan: [
      'Qua plannen gaan jullie dezelfde kant op. Wat spookt er nu door jullie hoofd?',
      'Jullie kijken hetzelfde naar werk. Een eigen project waar jullie nog niemand over verteld hebben?',
    ],
    rythme: [
      'Hetzelfde levenstempo, dat zie je. Jullie perfecte doordeweekse avond?',
      'Jullie leven op dezelfde snelheid. Het laatste avondje uit dat de moeite waard was?',
    ],
    cap: [
      'Jullie plannen ongeveer even ver vooruit. De volgende vakantie: geboekt of op goed geluk?',
      'Dezelfde blik op de lange termijn. De laatste aankoop die jullie maanden hebben voorbereid?',
    ],
  },
  icebreakerGeneric: [
    'Goed. {other} en ik hebben jullie aan elkaar voorgesteld. Nu jullie: het beste moment van jullie week?',
    'We vonden jullie een goede match, en we zitten er zelden naast. Eerste vraag: koffie of borrel?',
  ],
  nudge: {
    doux: ['Het is {days} dagen geleden. {other} en ik vroegen ons af hoe het met jullie gaat.', 'Even {days} dagen stil. Eén woordje is genoeg, hoor.'],
    sec: ['{days} dagen geen woord. Ik zeg het maar even.', '{days} dagen. {other} begint te gapen.'],
    joueur: ['{days} dagen stilte. Ik stel een spelletje voor: wie het eerst schrijft, wint.', 'Hallo? {days} dagen! {other} en ik vervelen ons.'],
    pose: ['Het is {days} dagen geleden. Waar waren jullie gebleven?', '{days} dagen rust. We pakken het weer op wanneer jullie willen.'],
  },
  remark: {
    doux: ['Jullie reageren snel op elkaar. Genoteerd.', 'Ik vind het fijn als jullie zo praten.'],
    sec: ['Er wordt flink gekletst. Ik maak aantekeningen.', 'Jullie zijn het over meer eens dan jullie denken.'],
    joueur: ['Het gaat hard hier. {other}, kun je het bijhouden?', 'Ik houd de score bij. Gelijkspel, voorlopig.'],
    pose: ['Jullie zijn het over meer eens dan jullie denken.', 'Mooi gesprek. Ik houd me even gedeisd.'],
  },
  firstOfDay: {
    doux: ['Eerste bericht van de dag. {other} en ik zijn blij.', 'Goeiemorgen, jullie twee. Goed begin.'],
    sec: ['Eerste bericht van de dag. Eindelijk.', 'Ah, er komt leven in.'],
    joueur: ['Eerste bericht van de dag! {other}, zag je dat?', 'Daar gaan we weer vandaag.'],
    pose: ['Eerste bericht van de dag. De band ademt.', 'Goeiemorgen. Ik ga zitten en luister.'],
  },
  sweet: {
    doux: ['O. Dat was lief. {other} doet alsof hij niet bloost.', 'Lief woordje genoteerd. Die bewaren we.'],
    sec: ['Dat was bijna aardig. Genoteerd.', 'Schattig hoor. Ik doe alsof ik niks zie.'],
    joueur: ['O. {other}, zag je dat?', 'Lief woordje gedetecteerd. Ik dans, vanbinnen.'],
    pose: ['Dat was lief. {other} spint, geloof ik.', 'Mooi. Ik zeg verder niks.'],
  },
  tease: {
    doux: ['Au. Wel lief blijven, hè.', 'Dat prikt een beetje. {other} bedenkt al een antwoord.'],
    sec: ['Raak. Heerlijk.', 'Goed gemikt.'],
    joueur: ['Wat een plagerij! {other} zint op wraak.', 'Er wordt hier flink geplaagd. Ik ga er even voor zitten.'],
    pose: ['Ik heb niks gezien, niks gehoord. Maar het was grappig.', 'Plagerij genoteerd. Ik wacht op de return.'],
  },
  guard: {
    doux: ['Het wordt een beetje verhit, toch? Tien minuten pauze, en dan rustiger verder.', 'Klinkt gespannen. Wil je even ademhalen voor je antwoordt?'],
    sec: ['De toon wordt scherper. Even pauze, en lees je het nog eens na voor je verstuurt?', 'Even ademhalen. Tien minuten, dan antwoord je.'],
    joueur: ['Time-out! Ik fluit voor tien minuten pauze.', 'Het loopt op. Even snackpauze, en dan verder?'],
    pose: ['De toon wordt wat scherper. Misschien even pauze?', 'Zullen we even pauzeren voor je antwoordt?'],
  },
  health: {
    new: 'Met {name}: het is net begonnen, alles kan.',
    quiet: 'Met {name}: een rustige week, één berichtje is genoeg om het weer op gang te brengen.',
    together: 'Met {name}: jullie schrijven elkaar bijna elke dag. Dat zie je.',
    lively: 'Met {name}: jullie praten veel, en dat merk je.',
    one_sided: 'Met {name}: jij geeft het tempo aan, en dat is waardevol.',
    balanced: 'Met {name}: jullie reageren goed op elkaar, allebei.',
  },
};

export const chatText = defineMessages({ fr: FR, en: EN, es: ES, pt: PT, nl: NL });
const linesFor = (lang: Lang): ChatLines => chatText.in(lang);

/** Phrase de l'accord de lecture, avec le prestataire d'IA de la configuration (`AiProcessor`). */
export const chatConfidentialityText = (lang: Lang, processor: AiProcessor = DEFAULT_AI_PROCESSOR): string => {
  const p = aiProcessorView(lang, processor);
  return chatText.in(lang).confidentiality(p.name, p.country);
};

const pick = (variants: readonly string[], seed: number): string => {
  const n = variants.length;
  return variants[((Math.trunc(seed) % n) + n) % n] ?? variants[0] ?? '';
};


export interface ChatLineContext {
  lang: Lang;
  voice: MinimoaVoice;
  seed: number;
  /** Nom du minimoa de l'autre. */
  other: string;
}

export const chatLines = {
  icebreaker(lang: Lang, axis: VisionAxis | null, other: string, seed: number): string {
    const l = linesFor(lang);
    return fillTemplate(pick(axis ? l.icebreaker[axis] : l.icebreakerGeneric, seed), { other });
  },
  nudge: (c: ChatLineContext, days: number): string => fillTemplate(pick(linesFor(c.lang).nudge[c.voice], c.seed), { other: c.other, days }),
  remark: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).remark[c.voice], c.seed), { other: c.other }),
  firstOfDay: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).firstOfDay[c.voice], c.seed), { other: c.other }),
  sweet: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).sweet[c.voice], c.seed), { other: c.other }),
  tease: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).tease[c.voice], c.seed), { other: c.other }),
  guard: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).guard[c.voice], c.seed), { other: c.other }),
  health: (lang: Lang, key: LinkHealthKey, name: string): string => fillTemplate(linesFor(lang).health[key], { name }),
};

// ── Consignes de l'IA (stables : mises en cache côté fournisseur) ─────────

/** Description de chaque voix, insérée dans la demande (pas dans la consigne, qui reste identique pour tous). */
export const MINIMOA_VOICE_PROMPT: Readonly<Record<MinimoaVoice, string>> = {
  doux: 'tendre et bienveillant',
  sec: 'pince-sans-rire, humour sec, jamais méchant',
  joueur: 'joueur et taquin',
  pose: 'posé, calme, peu de mots',
};

const LANGUAGE_NAMES: Readonly<Record<Locale, string>> = { fr: 'français', en: 'anglais', es: 'espagnol', pt: 'portugais', nl: 'néerlandais' };
export const languageName = (lang: Lang): string => LANGUAGE_NAMES[lang];

/**
 * Consigne système du chat. Elle ne change jamais d'un appel à l'autre (cache du fournisseur).
 * Le modèle reçoit une fenêtre courte de messages anonymisés (A / B) et rend une réplique ou RIEN.
 */
export const CHAT_AI_SYSTEM = [
  'Tu es un minimoa : une petite créature qui accompagne une personne dans une appli de rencontres amicales ou amoureuses entre adultes.',
  'Deux personnes, A et B, discutent. Ton humain est indiqué dans la demande. Tu parles dans leur conversation, au plus une phrase courte (moins de 120 caractères).',
  'Rôles possibles : « relance » (après un silence, rappelle avec légèreté le dernier sujet), « remarque » (observation drôle ou bienveillante sur la conversation), « garde-fou » (le ton monte : propose une pause à ton humain, sans juger ni prendre parti).',
  'Règles : tutoiement, pas d’emoji, pas de conseil de séduction, pas de jugement, jamais de reproche, pas de question intrusive, ne cite pas de message mot pour mot, ne révèle rien de privé, ne parle jamais de toi comme d’une IA.',
  'Si tu n’as rien d’utile ou de drôle à dire, ou si le sujet est sensible (santé, deuil, violence, sexualité, argent), réponds exactement : RIEN.',
  'Réponds uniquement par la phrase, ou par RIEN.',
].join('\n');

export interface ChatAiPromptInput {
  role: 'relance' | 'remarque' | 'garde-fou';
  lang: Lang;
  voice: MinimoaVoice;
  /** Lettre de l'humain du minimoa qui parle. */
  owner: 'A' | 'B';
  /** Fenêtre courte, du plus ancien au plus récent. */
  window: readonly { who: 'A' | 'B'; text: string }[];
  silenceDays?: number;
}

export function chatAiPrompt(i: ChatAiPromptInput): string {
  const lines = i.window.map((m) => `${m.who} : ${m.text}`).join('\n');
  return [
    `Rôle : ${i.role}. Ton humain : ${i.owner}. Ta voix : ${MINIMOA_VOICE_PROMPT[i.voice]}. Langue : ${languageName(i.lang)}.`,
    i.silenceDays !== undefined ? `Silence depuis ${i.silenceDays} jours.` : '',
    'Derniers messages :',
    lines,
  ]
    .filter((l) => l.length > 0)
    .join('\n');
}

/** Bandeaux du système dans le chat. */
export const chatSystemText = (lang: Lang): { linkCreated: string } => chatText.in(lang).system;
