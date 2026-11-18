/**
 * « Quel minimoa es-tu ? » et « Ouvre ton quartier » (docs/VIRALITE.md) : textes partagés par le site (quiz, carte
 * story, page quartier), l'app (code repris à l'inscription, Rencontres vide) et l'API (e-mails). Cinq langues.
 * Situations neutres : amitié, quotidien, sorties. Jamais de couple, jamais de donnée sensible.
 */
import type { Locale, QuizTrait, Zone } from '@blowy/domain';
import { defineMessages } from '../i18n/core';
import { emailChromeText } from '../email/chrome';
import { type Email, renderEmail } from '../email/layout';

interface Question {
  prompt: string;
  a: string;
  b: string;
  c: string;
}
interface Trait {
  /** Le caractère en un mot, accordé avec « ton minimoa » (masculin). */
  word: string;
  /** Titre du résultat (« TU ES UN NINO SOCIABLE. » : la carte met en capitales). */
  headline: string;
  /** La phrase de profil. */
  sentence: string;
}

const fr = {
  questions: {
    plan: {
      prompt: 'Vendredi, 19 h. Un pote propose un plan de dernière minute.',
      a: 'J’arrive, et j’amène deux personnes.',
      b: 'Ça dépend qui vient.',
      c: 'Plaid, série. Je te rappelle demain.',
    },
    sale_journee: {
      prompt: 'Un pote a passé une sale journée.',
      a: 'Je l’appelle. On en parle une heure.',
      b: 'Je débarque avec de quoi manger.',
      c: 'Je le fais rire avec une vanne bien sentie.',
    },
    dimanche: {
      prompt: 'Dimanche, rien de prévu.',
      a: 'Je teste un truc que je n’ai jamais fait.',
      b: 'Marché, rangement, tranquille.',
      c: 'Je passe la journée chez des potes.',
    },
    groupe: {
      prompt: 'Dans la conversation de groupe des potes…',
      a: 'C’est moi qui lance les sujets.',
      b: 'Je lis tout, je réponds par un pouce.',
      c: 'J’envoie des mèmes à 2 h du matin.',
    },
    jeu: {
      prompt: 'Soirée jeux. La boîte s’ouvre.',
      a: 'Je lis les règles à voix haute.',
      b: 'Je veux gagner. Point.',
      c: 'Je mets l’ambiance, peu importe qui gagne.',
    },
    voisin: {
      prompt: 'Le voisin que tu croises tous les jours…',
      a: 'Bonjour, bonsoir. Ça me va très bien.',
      b: 'Je connais déjà sa vie.',
      c: 'Je lui ai déjà monté un colis.',
    },
    coupe: {
      prompt: 'Ton pote te montre sa nouvelle coupe. Elle est ratée.',
      a: 'Je lui dis. Cash.',
      b: 'Je trouve le détail qui marche.',
      c: 'Je change de sujet.',
    },
  } as Record<string, Question>,
  traits: {
    sociable: {
      word: 'sociable',
      headline: 'Ton minimoa est sociable.',
      sentence: 'Tu dis oui avant de savoir où on va, et tu ramènes toujours quelqu’un en plus.',
    },
    joueur: {
      word: 'joueur',
      headline: 'Ton minimoa est joueur.',
      sentence: 'Avec toi, un dimanche vide devient une idée. Et une idée devient un défi.',
    },
    tendre: {
      word: 'tendre',
      headline: 'Ton minimoa est tendre.',
      sentence: 'Tu remarques quand quelqu’un ne va pas, et tu viens avec de quoi manger.',
    },
    bavard: {
      word: 'bavard',
      headline: 'Ton minimoa est bavard.',
      sentence: 'Tu lances les sujets, tu connais la vie du quartier, et personne ne s’ennuie à côté de toi.',
    },
    pose: {
      word: 'posé',
      headline: 'Ton minimoa est posé.',
      sentence: 'Tu lis les règles, tu prends ton temps, et c’est toi qu’on appelle quand il faut un plan qui tient.',
    },
    casanier: {
      word: 'casanier',
      headline: 'Ton minimoa est casanier.',
      sentence: 'Ton chez-toi est le meilleur endroit du monde. Ceux qui y sont invités le savent.',
    },
    piquant: {
      word: 'piquant',
      headline: 'Ton minimoa est piquant.',
      sentence: 'Tu dis les choses comme elles sont. Tes potes savent qu’avec toi, un compliment est sincère.',
    },
    discret: {
      word: 'discret',
      headline: 'Ton minimoa est discret.',
      sentence: 'Tu parles peu, mais juste. Les gens finissent toujours par te confier des choses.',
    },
  } as Record<QuizTrait, Trait>,
  /** « Avec une pointe de tendre. » */
  second: (word: string) => `Avec une pointe de ${word}.`,
  /** « Paris 11e », « Paris 1er », « Lyon 3e ». */
  district: (city: string, n: number) => `${city} ${n}${n === 1 ? 'er' : 'e'}`,
  postal: (cp: string) => cp,
  emails: {
    confirm: {
      subject: 'Confirme ton inscription à Minimoa',
      title: (zone: string) => `Encore un clic pour ${zone}.`,
      paragraphs: (zone: string, threshold: number) => [
        `Tu as demandé à être prévenu quand Minimoa ouvre ${zone}. Confirme ton adresse : tu ne comptes dans le compteur du quartier qu’une fois confirmé.`,
        `Le quartier ouvre à ${threshold} personnes. Ton lien pour inviter arrive juste après.`,
        'Pas toi ? Ignore cet e-mail : rien ne sera gardé.',
      ],
      cta: 'Confirmer mon adresse',
      footer: 'Un seul e-mail de plus : celui de l’ouverture. Désinscription en un clic dans chaque e-mail.',
    },
    open: {
      subject: (zone: string) => `${zone} est ouvert sur Minimoa`,
      title: (_zone: string) => 'Ton quartier est ouvert.',
      paragraphs: (zone: string) => [
        `Vous êtes assez nombreux : Minimoa ouvre ${zone}. Crée ton minimoa, il te présente des gens près de chez toi.`,
        'Ton code se tape à l’inscription, dans « Un code ? ». Il garde ton quartier et, si tu as invité parmi les premiers, ton objet de fondateur.',
      ],
      founder: (zone: string) => `Tu es parmi les 3 premiers à avoir invité du monde : ton minimoa reçoit la médaille de fondateur de ${zone}.`,
      code: (code: string) => `Ton code : ${code}`,
      cta: 'Ouvrir Minimoa',
      footer: 'C’était le dernier e-mail de cette liste. Ton adresse est effacée sous 30 jours.',
    },
    unsubscribe: 'Ne plus recevoir d’e-mail',
  },
};

type Dict = typeof fr;

export const quizText = defineMessages<Dict>({
  fr,
  en: {
    questions: {
      plan: { prompt: 'Friday, 7 pm. A friend suggests a last-minute plan.', a: 'I’m in, and I’m bringing two people.', b: 'Depends who’s coming.', c: 'Blanket, series. I’ll call you tomorrow.' },
      sale_journee: { prompt: 'A friend had a rough day.', a: 'I call. We talk for an hour.', b: 'I turn up with something to eat.', c: 'I make them laugh with a well-aimed joke.' },
      dimanche: { prompt: 'Sunday, nothing planned.', a: 'I try something I’ve never done.', b: 'Market, tidying up, slow.', c: 'I spend the day at friends’.' },
      groupe: { prompt: 'In the friends’ group chat…', a: 'I’m the one who starts topics.', b: 'I read everything, I reply with a thumbs-up.', c: 'I send memes at 2 am.' },
      jeu: { prompt: 'Game night. The box opens.', a: 'I read the rules out loud.', b: 'I want to win. Period.', c: 'I bring the vibe, whoever wins.' },
      voisin: { prompt: 'The neighbour you pass every day…', a: 'Hello, goodbye. Suits me fine.', b: 'I already know their life story.', c: 'I’ve already carried a parcel up for them.' },
      coupe: { prompt: 'Your friend shows you their new haircut. It’s a miss.', a: 'I tell them. Straight.', b: 'I find the one detail that works.', c: 'I change the subject.' },
    },
    traits: {
      sociable: { word: 'sociable', headline: 'Your minimoa is sociable.', sentence: 'You say yes before knowing where you’re going, and you always bring someone extra.' },
      joueur: { word: 'playful', headline: 'Your minimoa is playful.', sentence: 'With you, an empty Sunday becomes an idea. And an idea becomes a challenge.' },
      tendre: { word: 'caring', headline: 'Your minimoa is caring.', sentence: 'You notice when someone’s not okay, and you show up with something to eat.' },
      bavard: { word: 'chatty', headline: 'Your minimoa is chatty.', sentence: 'You start the topics, you know the neighbourhood news, and nobody gets bored next to you.' },
      pose: { word: 'calm', headline: 'Your minimoa is calm.', sentence: 'You read the rules, you take your time, and you’re the one people call for a plan that holds.' },
      casanier: { word: 'homebody', headline: 'Your minimoa is a homebody.', sentence: 'Your place is the best place in the world. Those who get invited know it.' },
      piquant: { word: 'sharp', headline: 'Your minimoa is sharp.', sentence: 'You say things as they are. Your friends know a compliment from you is real.' },
      discret: { word: 'quiet', headline: 'Your minimoa is quiet.', sentence: 'You speak little, but right. People always end up confiding in you.' },
    },
    second: (word: string) => `With a touch of ${word}.`,
    district: (city: string, n: number) => `${city} ${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`,
    postal: (cp: string) => cp,
    emails: {
      confirm: {
        subject: 'Confirm your Minimoa sign-up',
        title: (zone: string) => `One more click for ${zone}.`,
        paragraphs: (zone: string, threshold: number) => [
          `You asked to hear when Minimoa opens ${zone}. Confirm your address: you only count towards the neighbourhood once confirmed.`,
          `The neighbourhood opens at ${threshold} people. Your invite link comes right after.`,
          'Not you? Ignore this email: nothing will be kept.',
        ],
        cta: 'Confirm my address',
        footer: 'Just one more email: the opening one. One-click unsubscribe in every email.',
      },
      open: {
        subject: (zone: string) => `${zone} is open on Minimoa`,
        title: () => 'Your neighbourhood is open.',
        paragraphs: (zone: string) => [
          `There are enough of you: Minimoa opens ${zone}. Create your minimoa, it introduces you to people near you.`,
          'Type your code when you sign up, in “Got a code?”. It keeps your neighbourhood and, if you were among the first to invite, your founder item.',
        ],
        founder: (zone: string) => `You’re among the first 3 who invited people: your minimoa gets the ${zone} founder medal.`,
        code: (code: string) => `Your code: ${code}`,
        cta: 'Open Minimoa',
        footer: 'That was the last email from this list. Your address is erased within 30 days.',
      },
      unsubscribe: 'Unsubscribe',
    },
  },
  es: {
    questions: {
      plan: { prompt: 'Viernes, 19:00. Alguien propone un plan de última hora.', a: 'Voy, y llevo a dos personas.', b: 'Depende de quién vaya.', c: 'Manta y serie. Te llamo mañana.' },
      sale_journee: { prompt: 'Alguien cercano ha tenido un día horrible.', a: 'Le llamo. Hablamos una hora.', b: 'Me presento con algo de comer.', c: 'Le hago reír con una broma bien puesta.' },
      dimanche: { prompt: 'Domingo, nada previsto.', a: 'Pruebo algo que nunca he hecho.', b: 'Mercado, ordenar, tranquilidad.', c: 'Paso el día en casa de amigos.' },
      groupe: { prompt: 'En el grupo de chat de amigos…', a: 'Soy quien saca los temas.', b: 'Lo leo todo, respondo con un pulgar.', c: 'Mando memes a las 2 de la mañana.' },
      jeu: { prompt: 'Noche de juegos. Se abre la caja.', a: 'Leo las reglas en voz alta.', b: 'Quiero ganar. Punto.', c: 'Pongo el ambiente, gane quien gane.' },
      voisin: { prompt: 'Esa vecina o ese vecino con quien te cruzas a diario…', a: 'Hola y adiós. Me va bien así.', b: 'Ya conozco su vida entera.', c: 'Ya le he subido un paquete.' },
      coupe: { prompt: 'Te enseñan un corte de pelo nuevo. No ha salido bien.', a: 'Lo digo. Sin rodeos.', b: 'Busco el detalle que sí funciona.', c: 'Cambio de tema.' },
    },
    traits: {
      sociable: { word: 'sociable', headline: 'Tu minimoa es sociable.', sentence: 'Dices que sí antes de saber adónde se va, y siempre traes a alguien más.' },
      joueur: { word: 'juguetón', headline: 'Tu minimoa es juguetón.', sentence: 'Contigo, un domingo vacío se vuelve una idea. Y una idea, un reto.' },
      tendre: { word: 'tierno', headline: 'Tu minimoa es tierno.', sentence: 'Notas cuando alguien no está bien, y llegas con algo de comer.' },
      bavard: { word: 'charlatán', headline: 'Tu minimoa es charlatán.', sentence: 'Sacas los temas, conoces la vida del barrio y nadie se aburre a tu lado.' },
      pose: { word: 'tranquilo', headline: 'Tu minimoa es tranquilo.', sentence: 'Lees las reglas, te tomas tu tiempo y te llaman cuando hace falta un plan que funcione.' },
      casanier: { word: 'casero', headline: 'Tu minimoa es casero.', sentence: 'Tu casa es el mejor sitio del mundo. Quien recibe una invitación lo sabe.' },
      piquant: { word: 'directo', headline: 'Tu minimoa es directo.', sentence: 'Dices las cosas como son. Tus amigos saben que tus cumplidos son sinceros.' },
      discret: { word: 'discreto', headline: 'Tu minimoa es discreto.', sentence: 'Hablas poco, pero bien. La gente siempre acaba contándote cosas.' },
    },
    second: (word: string) => `Con un toque de ${word}.`,
    district: (city: string, n: number) => `${city} (distrito ${n})`,
    postal: (cp: string) => cp,
    emails: {
      confirm: {
        subject: 'Confirma tu inscripción en Minimoa',
        title: (zone: string) => `Un clic más para ${zone}.`,
        paragraphs: (zone: string, threshold: number) => [
          `Pediste que te avisáramos cuando Minimoa abra en ${zone}. Confirma tu dirección: solo cuentas en el contador del barrio una vez confirmada.`,
          `El barrio abre con ${threshold} personas. Tu enlace para invitar llega justo después.`,
          '¿No has sido tú? Ignora este correo: no se guardará nada.',
        ],
        cta: 'Confirmar mi dirección',
        footer: 'Solo un correo más: el de la apertura. Baja con un clic en cada correo.',
      },
      open: {
        subject: (zone: string) => `${zone} ya está abierto en Minimoa`,
        title: () => 'Tu barrio está abierto.',
        paragraphs: (zone: string) => [
          `Ya sois suficientes: Minimoa abre en ${zone}. Crea tu minimoa, te presentará a gente cerca de ti.`,
          'Escribe tu código al registrarte, en «¿Tienes un código?». Guarda tu barrio y, si invitaste entre los primeros, tu objeto de fundador.',
        ],
        founder: (zone: string) => `Estás entre las 3 primeras personas que invitaron: tu minimoa recibe la medalla de fundador de ${zone}.`,
        code: (code: string) => `Tu código: ${code}`,
        cta: 'Abrir Minimoa',
        footer: 'Este era el último correo de esta lista. Tu dirección se borra en 30 días.',
      },
      unsubscribe: 'Darme de baja',
    },
  },
  pt: {
    questions: {
      plan: { prompt: 'Sexta, 19h. Alguém propõe um plano de última hora.', a: 'Tô dentro, e levo mais duas pessoas.', b: 'Depende de quem vai.', c: 'Manta e série. Te ligo amanhã.' },
      sale_journee: { prompt: 'Alguém próximo teve um dia péssimo.', a: 'Eu ligo. A gente conversa uma hora.', b: 'Apareço com algo para comer.', c: 'Faço rir com uma piada certeira.' },
      dimanche: { prompt: 'Domingo, nada planejado.', a: 'Testo algo que nunca fiz.', b: 'Feira, arrumação, com calma.', c: 'Passo o dia na casa de amigos.' },
      groupe: { prompt: 'No grupo de conversa dos amigos…', a: 'Sou quem puxa os assuntos.', b: 'Leio tudo, respondo com um joinha.', c: 'Mando memes às 2 da manhã.' },
      jeu: { prompt: 'Noite de jogos. A caixa se abre.', a: 'Leio as regras em voz alta.', b: 'Quero ganhar. Ponto.', c: 'Animo a mesa, ganhe quem ganhar.' },
      voisin: { prompt: 'A pessoa vizinha que você cruza todo dia…', a: 'Oi, tchau. Está ótimo assim.', b: 'Já sei a vida inteira dela.', c: 'Já subi uma encomenda para ela.' },
      coupe: { prompt: 'Te mostram um corte de cabelo novo. Não ficou bom.', a: 'Eu falo. Direto.', b: 'Acho o detalhe que funciona.', c: 'Mudo de assunto.' },
    },
    traits: {
      sociable: { word: 'sociável', headline: 'Seu minimoa é sociável.', sentence: 'Você diz sim antes de saber aonde vai, e sempre leva mais alguém.' },
      joueur: { word: 'brincalhão', headline: 'Seu minimoa é brincalhão.', sentence: 'Com você, um domingo vazio vira uma ideia. E uma ideia vira um desafio.' },
      tendre: { word: 'carinhoso', headline: 'Seu minimoa é carinhoso.', sentence: 'Você percebe quando alguém não está bem, e aparece com algo para comer.' },
      bavard: { word: 'falante', headline: 'Seu minimoa é falante.', sentence: 'Você puxa os assuntos, sabe as novidades do bairro e ninguém se entedia ao seu lado.' },
      pose: { word: 'tranquilo', headline: 'Seu minimoa é tranquilo.', sentence: 'Você lê as regras, vai no seu ritmo e é quem chamam quando precisa de um plano que funcione.' },
      casanier: { word: 'caseiro', headline: 'Seu minimoa é caseiro.', sentence: 'Sua casa é o melhor lugar do mundo. Quem é convidado sabe disso.' },
      piquant: { word: 'direto', headline: 'Seu minimoa é direto.', sentence: 'Você diz as coisas como são. Seus amigos sabem que seus elogios são sinceros.' },
      discret: { word: 'discreto', headline: 'Seu minimoa é discreto.', sentence: 'Você fala pouco, mas certo. As pessoas sempre acabam te contando coisas.' },
    },
    second: (word: string) => `Com um toque de ${word}.`,
    district: (city: string, n: number) => `${city} (${n}º distrito)`,
    postal: (cp: string) => cp,
    emails: {
      confirm: {
        subject: 'Confirme sua inscrição no Minimoa',
        title: (zone: string) => `Só mais um clique para ${zone}.`,
        paragraphs: (zone: string, threshold: number) => [
          `Você pediu para ser avisado quando o Minimoa abrir em ${zone}. Confirme seu endereço: você só conta no contador do bairro depois de confirmar.`,
          `O bairro abre com ${threshold} pessoas. Seu link para convidar chega logo depois.`,
          'Não foi você? Ignore este e-mail: nada será guardado.',
        ],
        cta: 'Confirmar meu endereço',
        footer: 'Só mais um e-mail: o da abertura. Descadastro com um clique em cada e-mail.',
      },
      open: {
        subject: (zone: string) => `${zone} está aberto no Minimoa`,
        title: () => 'Seu bairro está aberto.',
        paragraphs: (zone: string) => [
          `Vocês já são bastante: o Minimoa abre em ${zone}. Crie seu minimoa, ele te apresenta pessoas perto de você.`,
          'Digite seu código no cadastro, em “Tem um código?”. Ele guarda seu bairro e, se você convidou entre os primeiros, seu objeto de fundador.',
        ],
        founder: (zone: string) => `Você está entre as 3 primeiras pessoas que convidaram: seu minimoa ganha a medalha de fundador de ${zone}.`,
        code: (code: string) => `Seu código: ${code}`,
        cta: 'Abrir o Minimoa',
        footer: 'Este foi o último e-mail desta lista. Seu endereço é apagado em até 30 dias.',
      },
      unsubscribe: 'Cancelar inscrição',
    },
  },
  nl: {
    questions: {
      plan: { prompt: 'Vrijdag, 19 uur. Een vriend stelt last minute iets voor.', a: 'Ik kom, en ik neem twee mensen mee.', b: 'Hangt ervan af wie er komt.', c: 'Plaid, serie. Ik bel je morgen.' },
      sale_journee: { prompt: 'Een vriend heeft een rotdag gehad.', a: 'Ik bel. We praten een uur.', b: 'Ik sta voor de deur met iets te eten.', c: 'Ik laat hem lachen met een rake grap.' },
      dimanche: { prompt: 'Zondag, niks gepland.', a: 'Ik probeer iets wat ik nog nooit deed.', b: 'Markt, opruimen, rustig aan.', c: 'Ik breng de dag door bij vrienden.' },
      groupe: { prompt: 'In de groepschat met vrienden…', a: 'Ik begin de onderwerpen.', b: 'Ik lees alles, ik antwoord met een duimpje.', c: 'Ik stuur memes om 2 uur ’s nachts.' },
      jeu: { prompt: 'Spelletjesavond. De doos gaat open.', a: 'Ik lees de regels hardop voor.', b: 'Ik wil winnen. Punt.', c: 'Ik zorg voor sfeer, wie er ook wint.' },
      voisin: { prompt: 'De buur die je elke dag tegenkomt…', a: 'Goeiedag, tot ziens. Prima zo.', b: 'Ik ken zijn hele leven al.', c: 'Ik heb al eens een pakketje voor hem naar boven gebracht.' },
      coupe: { prompt: 'Een vriend laat zijn nieuwe kapsel zien. Het is mislukt.', a: 'Ik zeg het. Recht voor z’n raap.', b: 'Ik vind het detail dat wél werkt.', c: 'Ik begin over iets anders.' },
    },
    traits: {
      sociable: { word: 'sociaal', headline: 'Je minimoa is sociaal.', sentence: 'Je zegt ja voordat je weet waarheen, en je neemt altijd iemand extra mee.' },
      joueur: { word: 'speels', headline: 'Je minimoa is speels.', sentence: 'Met jou wordt een lege zondag een idee. En een idee een uitdaging.' },
      tendre: { word: 'zorgzaam', headline: 'Je minimoa is zorgzaam.', sentence: 'Je ziet het als iemand niet lekker zit, en je komt langs met iets te eten.' },
      bavard: { word: 'spraakzaam', headline: 'Je minimoa is spraakzaam.', sentence: 'Jij begint de gesprekken, je kent het buurtnieuws en naast jou verveelt niemand zich.' },
      pose: { word: 'rustig', headline: 'Je minimoa is rustig.', sentence: 'Je leest de regels, je neemt je tijd, en jij wordt gebeld als er een plan nodig is dat klopt.' },
      casanier: { word: 'huiselijk', headline: 'Je minimoa is huiselijk.', sentence: 'Jouw huis is de beste plek ter wereld. Wie wordt uitgenodigd, weet dat.' },
      piquant: { word: 'eerlijk', headline: 'Je minimoa is eerlijk.', sentence: 'Je zegt het zoals het is. Je vrienden weten dat een compliment van jou gemeend is.' },
      discret: { word: 'stil', headline: 'Je minimoa is stil.', sentence: 'Je praat weinig, maar raak. Mensen vertellen jou uiteindelijk altijd dingen.' },
    },
    second: (word: string) => `Met een vleugje ${word}.`,
    district: (city: string, n: number) => `${city} (${n}e arr.)`,
    postal: (cp: string) => cp,
    emails: {
      confirm: {
        subject: 'Bevestig je aanmelding bij Minimoa',
        title: (zone: string) => `Nog één klik voor ${zone}.`,
        paragraphs: (zone: string, threshold: number) => [
          `Je vroeg om een bericht als Minimoa opengaat in ${zone}. Bevestig je adres: je telt pas mee in de buurtteller als je bevestigd hebt.`,
          `De buurt gaat open bij ${threshold} mensen. Je uitnodigingslink komt direct daarna.`,
          'Was jij dit niet? Negeer deze e-mail: er wordt niets bewaard.',
        ],
        cta: 'Mijn adres bevestigen',
        footer: 'Nog maar één e-mail: die van de opening. Met één klik afmelden in elke e-mail.',
      },
      open: {
        subject: (zone: string) => `${zone} is open op Minimoa`,
        title: () => 'Je buurt is open.',
        paragraphs: (zone: string) => [
          `Jullie zijn met genoeg: Minimoa gaat open in ${zone}. Maak je minimoa, hij stelt je voor aan mensen bij jou in de buurt.`,
          'Typ je code bij het aanmelden, in „Heb je een code?”. Die bewaart je buurt en, als je bij de eersten was die uitnodigden, je oprichtersvoorwerp.',
        ],
        founder: (zone: string) => `Je hoort bij de eerste 3 die mensen uitnodigden: je minimoa krijgt de oprichtersmedaille van ${zone}.`,
        code: (code: string) => `Je code: ${code}`,
        cta: 'Minimoa openen',
        footer: 'Dit was de laatste e-mail van deze lijst. Je adres wordt binnen 30 dagen gewist.',
      },
      unsubscribe: 'Afmelden',
    },
  },
});

/** Noms des villes de la liste qui changent selon la langue (nom français en clé). */
const CITY_NAMES: Record<Locale, Record<string, string>> = {
  fr: {},
  en: { Bruxelles: 'Brussels', Lisbonne: 'Lisbon', Barcelone: 'Barcelona' },
  es: { Bruxelles: 'Bruselas', Lisbonne: 'Lisboa', Barcelone: 'Barcelona', Marseille: 'Marsella', Lyon: 'Lyon', Nice: 'Niza', Strasbourg: 'Estrasburgo', Toulouse: 'Toulouse', Paris: 'París', Amsterdam: 'Ámsterdam' },
  pt: { Bruxelles: 'Bruxelas', Lisbonne: 'Lisboa', Barcelone: 'Barcelona', Marseille: 'Marselha', Nice: 'Nice', Strasbourg: 'Estrasburgo', Amsterdam: 'Amsterdã' },
  nl: { Bruxelles: 'Brussel', Lisbonne: 'Lissabon', Barcelone: 'Barcelona', Marseille: 'Marseille' },
};

/** Nom d'un quartier dans une langue : « Paris 11e », « Bordeaux », « 38000 ». */
export function zoneLabel(zone: Pick<Zone, 'city' | 'district' | 'postalCode'>, locale: Locale): string {
  const t = quizText.in(locale);
  if (zone.postalCode) return t.postal(zone.postalCode);
  const name = CITY_NAMES[locale][zone.city] ?? zone.city;
  return zone.district ? t.district(name, zone.district) : name;
}

export function quartierConfirmEmail(locale: Locale, i: { zone: string; threshold: number; confirmUrl: string; unsubscribeUrl: string }): Email {
  const t = quizText.in(locale).emails;
  const v = emailChromeText.in(locale).quartierConfirm;
  return renderEmail(locale, t.confirm.subject, {
    scene: 'gaston-joie',
    eyebrow: v.eyebrow,
    preheader: v.preheader(i.zone),
    bubble: v.bubble(i.zone),
    title: t.confirm.title(i.zone),
    paragraphs: t.confirm.paragraphs(i.zone, i.threshold),
    cta: { label: t.confirm.cta, url: i.confirmUrl },
    footer: t.confirm.footer,
    unsubscribe: { label: t.unsubscribe, url: i.unsubscribeUrl },
  });
}

export function quartierOpenEmail(locale: Locale, i: { zone: string; code: string; founder: boolean; appUrl: string; unsubscribeUrl: string }): Email {
  const t = quizText.in(locale).emails.open;
  const v = emailChromeText.in(locale).quartierOpen;
  return renderEmail(locale, t.subject(i.zone), {
    scene: 'bande-fete',
    eyebrow: i.zone,
    preheader: v.preheader(i.zone),
    bubble: v.bubble,
    title: t.title(i.zone),
    paragraphs: [...t.paragraphs(i.zone), ...(i.founder ? [t.founder(i.zone)] : []), { kind: 'code', label: v.codeLabel, value: i.code, text: t.code(i.code) }],
    cta: { label: t.cta, url: i.appUrl },
    footer: t.footer,
    unsubscribe: { label: quizText.in(locale).emails.unsubscribe, url: i.unsubscribeUrl },
  });
}

export const cityName = (city: string, locale: Locale): string => CITY_NAMES[locale][city] ?? city;
