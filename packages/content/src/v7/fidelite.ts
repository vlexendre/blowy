/**
 * E-mails de fidélisation (docs/FIDELISATION.md), par langue : bienvenue dans Minimoa+, paiement refusé, au revoir,
 * relance unique un mois après, longue absence (avec ce qui s'est passé). Les notifications push de ces moments sont
 * dans `v7/notifications.ts` (types `plus_account`, `minimoa_news`, `first_steps`).
 *
 * Ton : chaleureux, sans pression ni fausse urgence, rien de culpabilisant (le minimoa attend, il ne souffre pas),
 * aucune allusion amoureuse (spéc §27). Les dates et les montants arrivent déjà mis en forme.
 */
import type { Locale } from '@blowy/domain';
import { type Email, renderEmail } from '../emails';
import { type Translation, defineMessages } from '../i18n/core';
import { brand } from '../labels';
import { APPLE_SUBSCRIPTIONS_URL } from './audit';

interface Person {
  displayName: string;
  petName: string;
}
interface PlusWelcomeInput extends Person {
  /** Avantages de Minimoa+ (phrases de `plusPerkTextIn`, dans l'ordre du paywall). */
  perks: readonly string[];
  /** Fin de l'essai gratuit, mise en forme ; null sans essai. */
  trialEndsOn: string | null;
}
interface PlusBillingInput extends Person {
  /** Fin du délai de grâce, mise en forme ; null : l'accès est en pause. */
  graceUntil: string | null;
}
interface PlusGoodbyeInput extends Person {
  /** Habitudes suivies en même temps sans Minimoa+. */
  freeHabits: number;
}
interface AbsenceInput extends Person {
  /** Messages pas encore lus dans ses liens. */
  unread: number;
  /** Personnes qui lui ont fait signe (rencontres en attente). */
  waves: number;
}

const fr = {
  /** Où couper ces e-mails (le même interrupteur que les notifications). */
  footer: {
    news: 'Tu reçois cet e-mail parce que tu as un compte Minimoa. Pour ne plus en recevoir, coupe « Nouvelles de ton minimoa » dans Moi › Réglages › Notifications.',
    plus: 'Tu reçois cet e-mail parce que tu as eu Minimoa+. Pour ne plus en recevoir, coupe « Ton abonnement Minimoa+ » dans Moi › Réglages › Notifications.',
    service: 'Cet e-mail concerne ton abonnement : on te l’envoie même si tu as coupé les notifications.',
  },
  plusWelcome: {
    subject: 'Bienvenue dans Minimoa+',
    title: (i: PlusWelcomeInput) => `${i.petName} a sorti ses objets premium.`,
    paragraphs: (i: PlusWelcomeInput) => [
      `Salut ${i.displayName}, merci d’avoir rejoint Minimoa+. Voilà ce qui s’ouvre dès maintenant :`,
      ...i.perks.map((p) => `· ${p}`),
      ...(i.trialEndsOn ? [`Ton essai gratuit court jusqu’au ${i.trialEndsOn}. On t’envoie un rappel deux jours avant le premier paiement.`] : []),
      'Tu peux gérer ou annuler ton abonnement à tout moment : sur ton iPhone, Réglages, ton nom, puis Abonnements.',
    ],
    cta: (i: PlusWelcomeInput) => `Voir ${i.petName}`,
  },
  plusBilling: {
    subject: 'Le paiement de Minimoa+ n’est pas passé',
    title: 'Ton paiement n’est pas passé.',
    paragraphs: (i: PlusBillingInput) => [
      `Salut ${i.displayName},`,
      'Apple n’a pas pu prélever ton abonnement Minimoa+. Ça arrive : une carte expirée, un plafond atteint.',
      i.graceUntil
        ? `Minimoa+ reste ouvert jusqu’au ${i.graceUntil}, le temps qu’Apple réessaie.`
        : 'Minimoa+ est en pause le temps qu’Apple réessaie. Tout le reste de Minimoa continue normalement.',
      'Pour régler ça, mets à jour ton moyen de paiement dans ton compte Apple (le bouton ci-dessous, ou dans l’app : Moi › Minimoa+ › Gérer mon abonnement).',
      'Tu préfères arrêter ? Annule depuis la même page, ou ne fais rien : l’abonnement s’arrêtera de lui-même si le paiement ne passe pas.',
    ],
    cta: 'Gérer mon abonnement',
  },
  plusGoodbye: {
    subject: 'Minimoa+ s’arrête ici',
    title: 'Merci pour ce bout de chemin.',
    paragraphs: (i: PlusGoodbyeInput) => [
      `Salut ${i.displayName}, ton abonnement Minimoa+ est terminé. Rien d’important ne se perd, tout ceci reste gratuit :`,
      `· ${i.petName} et sa garde-robe (les objets premium sont rangés : ils ressortent si tu reprends Minimoa+)`,
      '· tes liens et toutes vos conversations',
      `· le défi du jour, ta série et ${i.freeHabits} habitudes suivies en même temps`,
      '· les rencontres de chaque jour, la carte de ta zone et le bilan du dimanche',
      `Si tu as deux minutes, dis-nous ce qui t’a manqué en écrivant à ${brand.supportEmail}. C’est facultatif, et ça nous aide vraiment.`,
    ],
    cta: (i: PlusGoodbyeInput) => `Voir ${i.petName}`,
  },
  plusWinback: {
    subject: (i: Person) => `${i.petName} pense à toi`,
    title: 'Ça fait un mois.',
    paragraphs: (i: Person) => [
      `Salut ${i.displayName},`,
      `Ça fait un mois que Minimoa+ s’est arrêté. ${i.petName}, tes liens et tes habitudes sont toujours là, gratuitement.`,
      'Si l’envie revient, Minimoa+ se reprend en un instant dans l’app (Moi › Minimoa+), et les objets premium ressortent aussitôt.',
      'Sinon, aucun souci : c’est le seul message qu’on t’envoie à ce sujet.',
    ],
    cta: 'Ouvrir Minimoa',
  },
  longAbsence: {
    subject: (i: Person) => `${i.petName} te garde ta place`,
    title: 'Deux semaines sans nouvelles.',
    paragraphs: (i: AbsenceInput) => [
      `Salut ${i.displayName}, deux semaines sans nouvelles de toi sur Minimoa. Rien de grave : la vie, ça occupe.`,
      ...(i.unread > 0 || i.waves > 0
        ? [
            'Pendant ce temps :',
            ...(i.unread > 0 ? [`· ${i.unread} ${i.unread > 1 ? 'messages t’attendent' : 'message t’attend'} dans tes chats`] : []),
            ...(i.waves > 0 ? [`· ${i.waves} ${i.waves > 1 ? 'personnes t’ont fait signe' : 'personne t’a fait signe'}`] : []),
          ]
        : ['Rien ne presse : tout est là où tu l’as laissé.']),
      `Quand tu reviens, ${i.petName} sera content de te voir. Et si tu préfères faire une pause, c’est très bien aussi.`,
    ],
    cta: (i: Person) => `Voir ${i.petName}`,
  },
};

const en: Translation<typeof fr> = {
  footer: {
    news: 'You’re receiving this email because you have a Minimoa account. To stop receiving them, turn off “News from your minimoa” in Me › Settings › Notifications.',
    plus: 'You’re receiving this email because you had Minimoa+. To stop receiving them, turn off “Your Minimoa+ subscription” in Me › Settings › Notifications.',
    service: 'This email is about your subscription: we send it even if you’ve turned notifications off.',
  },
  plusWelcome: {
    subject: 'Welcome to Minimoa+',
    title: (i: PlusWelcomeInput) => `${i.petName} got the premium items out.`,
    paragraphs: (i: PlusWelcomeInput) => [
      `Hi ${i.displayName}, thanks for joining Minimoa+. Here’s what opens up right now:`,
      ...i.perks.map((p) => `· ${p}`),
      ...(i.trialEndsOn ? [`Your free trial runs until ${i.trialEndsOn}. We’ll send you a reminder two days before the first payment.`] : []),
      'You can manage or cancel your subscription at any time: on your iPhone, Settings, your name, then Subscriptions.',
    ],
    cta: (i: PlusWelcomeInput) => `See ${i.petName}`,
  },
  plusBilling: {
    subject: 'Your Minimoa+ payment didn’t go through',
    title: 'Your payment didn’t go through.',
    paragraphs: (i: PlusBillingInput) => [
      `Hi ${i.displayName},`,
      'Apple couldn’t charge your Minimoa+ subscription. It happens: an expired card, a limit reached.',
      i.graceUntil
        ? `Minimoa+ stays open until ${i.graceUntil} while Apple tries again.`
        : 'Minimoa+ is paused while Apple tries again. Everything else in Minimoa carries on as usual.',
      'To fix it, update your payment method in your Apple account (the button below, or in the app: Me › Minimoa+ › Manage my subscription).',
      'Would you rather stop? Cancel from the same page, or do nothing: the subscription will end on its own if the payment doesn’t go through.',
    ],
    cta: 'Manage my subscription',
  },
  plusGoodbye: {
    subject: 'Minimoa+ stops here',
    title: 'Thanks for coming along.',
    paragraphs: (i: PlusGoodbyeInput) => [
      `Hi ${i.displayName}, your Minimoa+ subscription has ended. Nothing important is lost, all of this stays free:`,
      `· ${i.petName} and its wardrobe (the premium items are put away: they come back out if you take Minimoa+ again)`,
      '· your links and all your conversations',
      `· the daily challenge, your streak and ${i.freeHabits} habits at a time`,
      '· daily encounters, the map of your area and the Sunday review',
      `If you have two minutes, tell us what you missed by writing to ${brand.supportEmail}. It’s optional, and it really helps.`,
    ],
    cta: (i: PlusGoodbyeInput) => `See ${i.petName}`,
  },
  plusWinback: {
    subject: (i: Person) => `${i.petName} is thinking of you`,
    title: 'It’s been a month.',
    paragraphs: (i: Person) => [
      `Hi ${i.displayName},`,
      `It’s been a month since Minimoa+ stopped. ${i.petName}, your links and your habits are all still here, for free.`,
      'If you feel like it again, Minimoa+ takes a moment to restart in the app (Me › Minimoa+), and the premium items come straight back out.',
      'If not, no problem: this is the only message we’ll send you about it.',
    ],
    cta: 'Open Minimoa',
  },
  longAbsence: {
    subject: (i: Person) => `${i.petName} is saving your spot`,
    title: 'Two weeks without news.',
    paragraphs: (i: AbsenceInput) => [
      `Hi ${i.displayName}, we haven’t seen you on Minimoa for two weeks. No big deal: life keeps you busy.`,
      ...(i.unread > 0 || i.waves > 0
        ? [
            'In the meantime:',
            ...(i.unread > 0 ? [`· ${i.unread} ${i.unread > 1 ? 'messages are' : 'message is'} waiting in your chats`] : []),
            ...(i.waves > 0 ? [`· ${i.waves} ${i.waves > 1 ? 'people waved' : 'person waved'} at you`] : []),
          ]
        : ['No rush: everything is where you left it.']),
      `When you come back, ${i.petName} will be glad to see you. And if you’d rather take a break, that’s fine too.`,
    ],
    cta: (i: Person) => `See ${i.petName}`,
  },
};

const es: Translation<typeof fr> = {
  footer: {
    news: 'Recibes este correo porque tienes una cuenta de Minimoa. Para dejar de recibirlos, desactiva «Noticias de tu minimoa» en Yo › Ajustes › Notificaciones.',
    plus: 'Recibes este correo porque tuviste Minimoa+. Para dejar de recibirlos, desactiva «Tu suscripción a Minimoa+» en Yo › Ajustes › Notificaciones.',
    service: 'Este correo trata de tu suscripción: te lo enviamos aunque hayas desactivado las notificaciones.',
  },
  plusWelcome: {
    subject: 'Te damos la bienvenida a Minimoa+',
    title: (i: PlusWelcomeInput) => `${i.petName} ha sacado sus objetos premium.`,
    paragraphs: (i: PlusWelcomeInput) => [
      `Hola, ${i.displayName}: gracias por unirte a Minimoa+. Esto es lo que se abre desde ahora:`,
      ...i.perks.map((p) => `· ${p}`),
      ...(i.trialEndsOn ? [`Tu prueba gratuita dura hasta el ${i.trialEndsOn}. Te enviaremos un recordatorio dos días antes del primer pago.`] : []),
      'Puedes gestionar o cancelar tu suscripción cuando quieras: en tu iPhone, Ajustes, tu nombre y luego Suscripciones.',
    ],
    cta: (i: PlusWelcomeInput) => `Ver a ${i.petName}`,
  },
  plusBilling: {
    subject: 'El pago de Minimoa+ no se ha realizado',
    title: 'Tu pago no se ha realizado.',
    paragraphs: (i: PlusBillingInput) => [
      `Hola, ${i.displayName}:`,
      'Apple no ha podido cobrar tu suscripción a Minimoa+. Pasa: una tarjeta caducada, un límite alcanzado.',
      i.graceUntil
        ? `Minimoa+ sigue abierto hasta el ${i.graceUntil} mientras Apple lo vuelve a intentar.`
        : 'Minimoa+ está en pausa mientras Apple lo vuelve a intentar. Todo lo demás de Minimoa sigue igual.',
      'Para solucionarlo, actualiza tu método de pago en tu cuenta de Apple (el botón de abajo, o en la app: Yo › Minimoa+ › Gestionar mi suscripción).',
      '¿Prefieres dejarlo? Cancela desde la misma página o no hagas nada: la suscripción terminará sola si el pago no se realiza.',
    ],
    cta: 'Gestionar mi suscripción',
  },
  plusGoodbye: {
    subject: 'Minimoa+ termina aquí',
    title: 'Gracias por este tramo del camino.',
    paragraphs: (i: PlusGoodbyeInput) => [
      `Hola, ${i.displayName}: tu suscripción a Minimoa+ ha terminado. No se pierde nada importante, todo esto sigue siendo gratis:`,
      `· ${i.petName} y su armario (los objetos premium se guardan: vuelven a salir si retomas Minimoa+)`,
      '· tus vínculos y todas vuestras conversaciones',
      `· el reto del día, tu racha y ${i.freeHabits} hábitos a la vez`,
      '· los encuentros de cada día, el mapa de tu zona y el resumen del domingo',
      `Si tienes dos minutos, cuéntanos qué echaste en falta escribiendo a ${brand.supportEmail}. Es opcional, y nos ayuda de verdad.`,
    ],
    cta: (i: PlusGoodbyeInput) => `Ver a ${i.petName}`,
  },
  plusWinback: {
    subject: (i: Person) => `${i.petName} piensa en ti`,
    title: 'Ya ha pasado un mes.',
    paragraphs: (i: Person) => [
      `Hola, ${i.displayName}:`,
      `Hace un mes que Minimoa+ terminó. ${i.petName}, tus vínculos y tus hábitos siguen aquí, gratis.`,
      'Si te apetece volver, Minimoa+ se retoma en un momento desde la app (Yo › Minimoa+), y los objetos premium vuelven a salir enseguida.',
      'Si no, ningún problema: es el único mensaje que te enviaremos sobre esto.',
    ],
    cta: 'Abrir Minimoa',
  },
  longAbsence: {
    subject: (i: Person) => `${i.petName} te guarda el sitio`,
    title: 'Dos semanas sin noticias.',
    paragraphs: (i: AbsenceInput) => [
      `Hola, ${i.displayName}: hace dos semanas que no te vemos por Minimoa. No pasa nada: la vida tiene sus cosas.`,
      ...(i.unread > 0 || i.waves > 0
        ? [
            'Mientras tanto:',
            ...(i.unread > 0 ? [`· ${i.unread} ${i.unread > 1 ? 'mensajes te esperan' : 'mensaje te espera'} en tus chats`] : []),
            ...(i.waves > 0 ? [`· ${i.waves} ${i.waves > 1 ? 'personas te han saludado' : 'persona te ha saludado'}`] : []),
          ]
        : ['Sin prisa: todo está donde lo dejaste.']),
      `Cuando vuelvas, ${i.petName} se alegrará de verte. Y si prefieres tomarte un descanso, también está bien.`,
    ],
    cta: (i: Person) => `Ver a ${i.petName}`,
  },
};

const pt: Translation<typeof fr> = {
  footer: {
    news: 'Você recebe este e-mail porque tem uma conta no Minimoa. Para não receber mais, desative “Notícias do seu minimoa” em Eu › Ajustes › Notificações.',
    plus: 'Você recebe este e-mail porque já teve o Minimoa+. Para não receber mais, desative “Sua assinatura do Minimoa+” em Eu › Ajustes › Notificações.',
    service: 'Este e-mail é sobre a sua assinatura: enviamos mesmo que você tenha desativado as notificações.',
  },
  plusWelcome: {
    subject: 'Boas-vindas ao Minimoa+',
    title: (i: PlusWelcomeInput) => `${i.petName} tirou os itens premium do armário.`,
    paragraphs: (i: PlusWelcomeInput) => [
      `Oi, ${i.displayName}! Obrigado por entrar no Minimoa+. Veja o que já está liberado:`,
      ...i.perks.map((p) => `· ${p}`),
      ...(i.trialEndsOn ? [`Seu teste gratuito vai até ${i.trialEndsOn}. Vamos enviar um lembrete dois dias antes da primeira cobrança.`] : []),
      'Você pode gerenciar ou cancelar sua assinatura a qualquer momento: no iPhone, Ajustes, seu nome e depois Assinaturas.',
    ],
    cta: (i: PlusWelcomeInput) => `Ver ${i.petName}`,
  },
  plusBilling: {
    subject: 'O pagamento do Minimoa+ não foi aprovado',
    title: 'Seu pagamento não foi aprovado.',
    paragraphs: (i: PlusBillingInput) => [
      `Oi, ${i.displayName}!`,
      'A Apple não conseguiu cobrar sua assinatura do Minimoa+. Acontece: um cartão vencido, um limite atingido.',
      i.graceUntil
        ? `O Minimoa+ continua aberto até ${i.graceUntil} enquanto a Apple tenta de novo.`
        : 'O Minimoa+ está pausado enquanto a Apple tenta de novo. Todo o resto do Minimoa continua normalmente.',
      'Para resolver, atualize sua forma de pagamento na sua conta Apple (o botão abaixo, ou no app: Eu › Minimoa+ › Gerenciar minha assinatura).',
      'Prefere parar? Cancele na mesma página, ou não faça nada: a assinatura termina sozinha se o pagamento não for aprovado.',
    ],
    cta: 'Gerenciar minha assinatura',
  },
  plusGoodbye: {
    subject: 'O Minimoa+ termina aqui',
    title: 'Obrigado por esse pedaço do caminho.',
    paragraphs: (i: PlusGoodbyeInput) => [
      `Oi, ${i.displayName}! Sua assinatura do Minimoa+ terminou. Nada importante se perde, tudo isto continua de graça:`,
      `· ${i.petName} e o armário dele (os itens premium ficam guardados: voltam se você assinar o Minimoa+ de novo)`,
      '· seus vínculos e todas as conversas',
      `· o desafio do dia, sua sequência e ${i.freeHabits} hábitos ao mesmo tempo`,
      '· os encontros de cada dia, o mapa da sua região e o resumo de domingo',
      `Se tiver dois minutos, conte para a gente o que faltou escrevendo para ${brand.supportEmail}. É opcional, e ajuda muito.`,
    ],
    cta: (i: PlusGoodbyeInput) => `Ver ${i.petName}`,
  },
  plusWinback: {
    subject: (i: Person) => `${i.petName} está pensando em você`,
    title: 'Já faz um mês.',
    paragraphs: (i: Person) => [
      `Oi, ${i.displayName}!`,
      `Faz um mês que o Minimoa+ terminou. ${i.petName}, seus vínculos e seus hábitos continuam aqui, de graça.`,
      'Se der vontade de voltar, o Minimoa+ é retomado num instante pelo app (Eu › Minimoa+), e os itens premium voltam na hora.',
      'Se não, tudo bem: esta é a única mensagem que vamos enviar sobre isso.',
    ],
    cta: 'Abrir o Minimoa',
  },
  longAbsence: {
    subject: (i: Person) => `${i.petName} está guardando o seu lugar`,
    title: 'Duas semanas sem notícias.',
    paragraphs: (i: AbsenceInput) => [
      `Oi, ${i.displayName}! Faz duas semanas que a gente não te vê no Minimoa. Tudo bem: a vida ocupa.`,
      ...(i.unread > 0 || i.waves > 0
        ? [
            'Enquanto isso:',
            ...(i.unread > 0 ? [`· ${i.unread} ${i.unread > 1 ? 'mensagens esperam' : 'mensagem espera'} por você nos chats`] : []),
            ...(i.waves > 0 ? [`· ${i.waves} ${i.waves > 1 ? 'pessoas acenaram' : 'pessoa acenou'} para você`] : []),
          ]
        : ['Sem pressa: está tudo onde você deixou.']),
      `Quando você voltar, ${i.petName} vai ficar feliz em te ver. E se preferir dar uma pausa, tudo bem também.`,
    ],
    cta: (i: Person) => `Ver ${i.petName}`,
  },
};

const nl: Translation<typeof fr> = {
  footer: {
    news: 'Je krijgt deze e-mail omdat je een Minimoa-account hebt. Wil je ze niet meer ontvangen, zet dan “Nieuws van je minimoa” uit in Ik › Instellingen › Meldingen.',
    plus: 'Je krijgt deze e-mail omdat je Minimoa+ had. Wil je ze niet meer ontvangen, zet dan “Je Minimoa+-abonnement” uit in Ik › Instellingen › Meldingen.',
    service: 'Deze e-mail gaat over je abonnement: we sturen hem ook als je meldingen hebt uitgezet.',
  },
  plusWelcome: {
    subject: 'Welkom bij Minimoa+',
    title: (i: PlusWelcomeInput) => `${i.petName} heeft de premium items tevoorschijn gehaald.`,
    paragraphs: (i: PlusWelcomeInput) => [
      `Hoi ${i.displayName}, bedankt dat je Minimoa+ hebt genomen. Dit gaat vanaf nu open:`,
      ...i.perks.map((p) => `· ${p}`),
      ...(i.trialEndsOn ? [`Je gratis proefperiode loopt tot ${i.trialEndsOn}. We sturen je twee dagen voor de eerste betaling een herinnering.`] : []),
      'Je kunt je abonnement altijd beheren of opzeggen: op je iPhone via Instellingen, je naam en dan Abonnementen.',
    ],
    cta: (i: PlusWelcomeInput) => `Bekijk ${i.petName}`,
  },
  plusBilling: {
    subject: 'De betaling voor Minimoa+ is niet gelukt',
    title: 'Je betaling is niet gelukt.',
    paragraphs: (i: PlusBillingInput) => [
      `Hoi ${i.displayName},`,
      'Apple kon je Minimoa+-abonnement niet afschrijven. Dat gebeurt: een verlopen kaart, een bereikt limiet.',
      i.graceUntil
        ? `Minimoa+ blijft open tot ${i.graceUntil} terwijl Apple het opnieuw probeert.`
        : 'Minimoa+ is gepauzeerd terwijl Apple het opnieuw probeert. De rest van Minimoa werkt gewoon door.',
      'Werk je betaalmethode bij in je Apple-account om het op te lossen (de knop hieronder, of in de app: Ik › Minimoa+ › Mijn abonnement beheren).',
      'Wil je liever stoppen? Zeg op via dezelfde pagina, of doe niets: het abonnement stopt vanzelf als de betaling niet lukt.',
    ],
    cta: 'Mijn abonnement beheren',
  },
  plusGoodbye: {
    subject: 'Minimoa+ stopt hier',
    title: 'Bedankt voor dit stukje van de weg.',
    paragraphs: (i: PlusGoodbyeInput) => [
      `Hoi ${i.displayName}, je Minimoa+-abonnement is afgelopen. Er gaat niets belangrijks verloren, dit blijft allemaal gratis:`,
      `· ${i.petName} en zijn kledingkast (de premium items worden opgeborgen: ze komen terug als je Minimoa+ weer neemt)`,
      '· je banden en al jullie gesprekken',
      `· de uitdaging van de dag, je reeks en ${i.freeHabits} gewoonten tegelijk`,
      '· de dagelijkse ontmoetingen, de kaart van je buurt en het zondagsoverzicht',
      `Heb je twee minuten? Vertel ons wat je miste via ${brand.supportEmail}. Het hoeft niet, maar het helpt ons echt.`,
    ],
    cta: (i: PlusGoodbyeInput) => `Bekijk ${i.petName}`,
  },
  plusWinback: {
    subject: (i: Person) => `${i.petName} denkt aan je`,
    title: 'Het is een maand geleden.',
    paragraphs: (i: Person) => [
      `Hoi ${i.displayName},`,
      `Minimoa+ is een maand geleden gestopt. ${i.petName}, je banden en je gewoonten zijn er allemaal nog, gratis.`,
      'Heb je er weer zin in, dan zet je Minimoa+ in een handomdraai weer aan in de app (Ik › Minimoa+), en de premium items komen meteen terug.',
      'Zo niet, geen probleem: dit is het enige bericht dat we je hierover sturen.',
    ],
    cta: 'Open Minimoa',
  },
  longAbsence: {
    subject: (i: Person) => `${i.petName} houdt je plekje vrij`,
    title: 'Twee weken niets gehoord.',
    paragraphs: (i: AbsenceInput) => [
      `Hoi ${i.displayName}, we hebben je al twee weken niet gezien op Minimoa. Geen punt: het leven houdt je bezig.`,
      ...(i.unread > 0 || i.waves > 0
        ? [
            'In de tussentijd:',
            ...(i.unread > 0 ? [`· ${i.unread} ${i.unread > 1 ? 'berichten wachten' : 'bericht wacht'} op je in je chats`] : []),
            ...(i.waves > 0 ? [`· ${i.waves} ${i.waves > 1 ? 'mensen zwaaiden' : 'iemand zwaaide'} naar je`] : []),
          ]
        : ['Geen haast: alles staat waar je het liet.']),
      `Als je terugkomt, is ${i.petName} blij je te zien. En wil je liever even pauze, dan is dat ook prima.`,
    ],
    cta: (i: Person) => `Bekijk ${i.petName}`,
  },
};

export const fideliteText = defineMessages({ fr, en, es, pt, nl });

/** Bienvenue dans Minimoa+ (service : part même si les notifications de l'abonnement sont coupées). */
export function plusWelcomeEmail(locale: Locale, input: PlusWelcomeInput & { appUrl: string }): Email {
  const t = fideliteText.in(locale);
  return renderEmail(locale, t.plusWelcome.subject, {
    title: t.plusWelcome.title(input),
    paragraphs: t.plusWelcome.paragraphs(input),
    cta: { label: t.plusWelcome.cta(input), url: input.appUrl },
    footer: t.footer.service,
  });
}

/** Paiement refusé (service) : délai de grâce ou pause, et où mettre à jour son moyen de paiement. */
export function plusBillingEmail(locale: Locale, input: PlusBillingInput): Email {
  const t = fideliteText.in(locale);
  return renderEmail(locale, t.plusBilling.subject, {
    title: t.plusBilling.title,
    paragraphs: t.plusBilling.paragraphs(input),
    cta: { label: t.plusBilling.cta, url: APPLE_SUBSCRIPTIONS_URL },
    footer: t.footer.service,
  });
}

/** Au revoir (service) : ce qu'on garde gratuitement, sans rien demander. */
export function plusGoodbyeEmail(locale: Locale, input: PlusGoodbyeInput & { appUrl: string }): Email {
  const t = fideliteText.in(locale);
  return renderEmail(locale, t.plusGoodbye.subject, {
    title: t.plusGoodbye.title,
    paragraphs: t.plusGoodbye.paragraphs(input),
    cta: { label: t.plusGoodbye.cta(input), url: input.appUrl },
    footer: t.footer.service,
  });
}

/** Relance unique, un mois après la fin (sans offre : il n'y en a pas dans App Store Connect aujourd'hui). */
export function plusWinbackEmail(locale: Locale, input: Person & { appUrl: string }): Email {
  const t = fideliteText.in(locale);
  return renderEmail(locale, t.plusWinback.subject(input), {
    title: t.plusWinback.title,
    paragraphs: t.plusWinback.paragraphs(input),
    cta: { label: t.plusWinback.cta, url: input.appUrl },
    footer: t.footer.plus,
  });
}

/** Longue absence (14 jours) : ce qui s'est passé pendant ce temps, sans reproche. */
export function longAbsenceEmail(locale: Locale, input: AbsenceInput & { appUrl: string }): Email {
  const t = fideliteText.in(locale);
  return renderEmail(locale, t.longAbsence.subject(input), {
    title: t.longAbsence.title,
    paragraphs: t.longAbsence.paragraphs(input),
    cta: { label: t.longAbsence.cta(input), url: input.appUrl },
    footer: t.footer.news,
  });
}
