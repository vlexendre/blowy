/**
 * Textes de Minimoa+ (paywall, état de l'abonnement) et de la modération vus par les personnes (suspension,
 * avertissement), par langue. Les montants et les dates arrivent déjà mis en forme (`formatPrice`, `formatDate`).
 * L'interface d'administration (apps/admin) est interne : elle reste en français et n'est pas ici.
 */
import type { Locale, PlusPerk } from '@blowy/domain';
import { type Translation, defineMessages, formatDate, formatPrice } from '../i18n/core';
import { emailChromeText } from '../email/chrome';
import { renderEmail } from '../email/layout';
import { brand } from '../labels';

/** « 59,99 € » à partir de centimes (français). Préférer `formatPrice(locale, …)`. */
export const euros = (amountMinor: number): string => formatPrice('fr', amountMinor, 'EUR');

/** « 22 novembre » (fuseau Europe/Paris, français). Préférer `formatDate(locale, …)`. */
export const frenchDate = (iso: string): string => formatDate('fr', iso);

interface WarningInput {
  displayName: string;
  reason: string;
}

const fr = {
  perks: {
    map_everywhere: 'Toute la carte, et changer de ville sans bouger',
    more_encounters: '10 personnes présentées par jour au lieu de 3',
    streak_jokers: '3 jokers de série par semaine',
    more_habits: 'Jusqu’à 6 habitudes',
    detailed_review: 'Le bilan détaillé du dimanche',
    free_rename: 'Renommer ton minimoa quand tu veux',
    premium_items: 'Tous les objets premium de la garde-robe',
  } as Record<PlusPerk, string>,
  plus: {
    name: { yearly: 'Abonnement annuel Minimoa+', monthly: 'Abonnement mensuel Minimoa+', weekly: 'Abonnement hebdomadaire Minimoa+' },
    price: { year: (amount: string) => `${amount} par an`, month: (amount: string) => `${amount} par mois`, week: (amount: string) => `${amount} par semaine` },
    perMonth: (amount: string) => `soit ${amount} par mois`,
    trial: (days: number, price: string) => `${days} jours gratuits, puis ${price}`,
    timeline: (reminderDay: number, days: number) => [
      { day: 0, title: 'Aujourd’hui', text: 'Tout Minimoa+ est ouvert.' },
      { day: reminderDay, title: `Jour ${reminderDay}`, text: 'On t’envoie un rappel avant la fin de l’essai.' },
      { day: days, title: `Jour ${days}`, text: 'Premier paiement, sauf si tu annules avant.' },
    ],
    teaser: (n: number) => (n === 1 ? '1 personne compatible près de chez toi' : `${n} personnes compatibles près de chez toi`),
    renewalNotice:
      'Le paiement est prélevé sur ton compte Apple à la confirmation de l’achat ou, avec l’essai gratuit, à la fin de l’essai. L’abonnement se renouvelle automatiquement pour la même durée et au même prix, sauf si tu l’annules au moins 24 h avant la fin de la période en cours. Annule à tout moment dans Réglages › ton nom › Abonnements.',
    continueFree: 'Continuer gratuitement',
    restore: 'Restaurer mes achats',
    summary: {
      none: 'Tu n’as pas Minimoa+.',
      trial: (end: string, renews: boolean) => (renews ? `Essai gratuit jusqu’au ${end}. Premier paiement ce jour-là.` : `Essai gratuit jusqu’au ${end}. Il ne sera pas renouvelé.`),
      active: (end: string, renews: boolean) => (renews ? `Minimoa+ se renouvelle le ${end}.` : `Minimoa+ jusqu’au ${end}, sans renouvellement.`),
      grace: 'Le paiement n’est pas passé. Minimoa+ reste ouvert le temps de mettre à jour ton moyen de paiement.',
      billing_retry: 'Le paiement n’est pas passé. Mets à jour ton moyen de paiement dans les réglages Apple pour retrouver Minimoa+.',
      expired: 'Ton abonnement Minimoa+ est terminé.',
      refunded: 'Ton abonnement a été remboursé.',
      revoked: 'Ton accès partagé à Minimoa+ a été retiré.',
    },
    errors: {
      invalidPurchase: 'On n’a pas pu vérifier cet achat. Réessaie, ou utilise « Restaurer mes achats ».',
      unknownProduct: 'Ce produit n’est pas un abonnement Minimoa+.',
      otherAccount: 'Cet achat appartient à un autre compte Minimoa.',
      notificationRejected: 'Notification refusée.',
    },
  },
  moderation: {
    suspendedUntil: (until: string) => `Ton compte est suspendu jusqu’au ${until}, après des signalements. Une question ? Écris-nous à ${brand.supportEmail}.`,
    suspended: `Ton compte est suspendu, après des signalements. Une question ? Écris-nous à ${brand.supportEmail}.`,
    warningSubject: 'Un avertissement de l’équipe Minimoa',
    warningLines: (i: WarningInput) => [
      `Salut ${i.displayName},`,
      'Une personne t’a signalé et on a regardé. Cette fois, c’est un avertissement :',
      i.reason,
      'Minimoa marche parce que chacun s’y sent bien. Si ça se reproduit, ton compte pourra être suspendu.',
      `Tu penses qu’on se trompe ? Réponds à ce message ou écris à ${brand.supportEmail}.`,
    ],
    /** Inscription refusée : ce compte Apple ou Google a été exclu définitivement (identifiant gardé 3 ans). */
    banned: `Ce compte a été exclu de Minimoa après des manquements aux règles. Une question ? Écris-nous à ${brand.supportEmail}.`,
    /** Compte sans connexion depuis bientôt 2 ans : message de prévenance, un mois avant la suppression. */
    inactivitySubject: 'Ton compte Minimoa va être supprimé',
    inactivityLines: (i: { displayName: string; deleteOn: string }) => [
      `Salut ${i.displayName},`,
      'Ça fait presque deux ans que tu n’as pas ouvert Minimoa. Comme promis dans notre politique de confidentialité, on ne garde pas les comptes inactifs.',
      `Sans connexion d’ici le ${i.deleteOn}, ton compte et tout ce qui va avec (ton minimoa, tes liens, tes messages) seront supprimés.`,
      'Pour le garder, il suffit d’ouvrir l’app une fois. Sinon, tu n’as rien à faire.',
    ],
  },
};

const en: Translation<typeof fr> = {
  perks: {
    map_everywhere: 'The whole map, and change cities without moving',
    more_encounters: '10 people introduced a day instead of 3',
    streak_jokers: '3 streak jokers a week',
    more_habits: 'Up to 6 habits',
    detailed_review: 'The detailed Sunday review',
    free_rename: 'Rename your minimoa whenever you like',
    premium_items: 'All the premium wardrobe items',
  },
  plus: {
    name: { yearly: 'Minimoa+ yearly subscription', monthly: 'Minimoa+ monthly subscription', weekly: 'Minimoa+ weekly subscription' },
    price: { year: (amount: string) => `${amount} per year`, month: (amount: string) => `${amount} per month`, week: (amount: string) => `${amount} per week` },
    perMonth: (amount: string) => `that’s ${amount} a month`,
    trial: (days: number, price: string) => `${days} days free, then ${price}`,
    timeline: (reminderDay: number, days: number) => [
      { day: 0, title: 'Today', text: 'All of Minimoa+ is unlocked.' },
      { day: reminderDay, title: `Day ${reminderDay}`, text: 'We send you a reminder before the trial ends.' },
      { day: days, title: `Day ${days}`, text: 'First payment, unless you cancel before then.' },
    ],
    teaser: (n: number) => (n === 1 ? '1 compatible person near you' : `${n} compatible people near you`),
    renewalNotice:
      'Payment is charged to your Apple Account when you confirm the purchase or, with the free trial, when the trial ends. The subscription renews automatically for the same length and at the same price unless you cancel it at least 24 hours before the end of the current period. Cancel anytime in Settings › your name › Subscriptions.',
    continueFree: 'Continue for free',
    restore: 'Restore purchases',
    summary: {
      none: 'You don’t have Minimoa+.',
      trial: (end: string, renews: boolean) => (renews ? `Free trial until ${end}. First payment on that day.` : `Free trial until ${end}. It won’t renew.`),
      active: (end: string, renews: boolean) => (renews ? `Minimoa+ renews on ${end}.` : `Minimoa+ until ${end}, no renewal.`),
      grace: 'Your payment didn’t go through. Minimoa+ stays open while you update your payment method.',
      billing_retry: 'Your payment didn’t go through. Update your payment method in your Apple settings to get Minimoa+ back.',
      expired: 'Your Minimoa+ subscription has ended.',
      refunded: 'Your subscription was refunded.',
      revoked: 'Your shared access to Minimoa+ has been removed.',
    },
    errors: {
      invalidPurchase: 'We couldn’t verify this purchase. Try again, or use “Restore purchases”.',
      unknownProduct: 'This product isn’t a Minimoa+ subscription.',
      otherAccount: 'This purchase belongs to another Minimoa account.',
      notificationRejected: 'Notification rejected.',
    },
  },
  moderation: {
    suspendedUntil: (until: string) => `Your account is suspended until ${until}, following reports. Any questions? Write to us at ${brand.supportEmail}.`,
    suspended: `Your account is suspended, following reports. Any questions? Write to us at ${brand.supportEmail}.`,
    warningSubject: 'A warning from the Minimoa team',
    warningLines: (i: WarningInput) => [
      `Hi ${i.displayName},`,
      'Someone reported you and we took a look. This time, it’s a warning:',
      i.reason,
      'Minimoa works because everyone feels good there. If it happens again, your account may be suspended.',
      `Think we got it wrong? Reply to this message or write to ${brand.supportEmail}.`,
    ],
    banned: `This account has been banned from Minimoa for breaking the rules. Any questions? Write to us at ${brand.supportEmail}.`,
    inactivitySubject: 'Your Minimoa account is going to be deleted',
    inactivityLines: (i: { displayName: string; deleteOn: string }) => [
      `Hi ${i.displayName},`,
      'It’s been almost two years since you last opened Minimoa. As promised in our privacy policy, we don’t keep inactive accounts.',
      `If you don’t sign in by ${i.deleteOn}, your account and everything that goes with it (your minimoa, your links, your messages) will be deleted.`,
      'To keep it, just open the app once. Otherwise, you don’t need to do anything.',
    ],
  },
};

const es: Translation<typeof fr> = {
  perks: {
    map_everywhere: 'Todo el mapa, y cambiar de ciudad sin moverte',
    more_encounters: 'Más encuentros cada día',
    streak_jokers: '3 comodines de racha por semana',
    more_habits: 'Hasta 6 hábitos',
    detailed_review: 'El resumen detallado del domingo',
    free_rename: 'Renombrar a tu minimoa cuando quieras',
    premium_items: 'Todos los objetos premium del armario',
  },
  plus: {
    name: { yearly: 'Suscripción anual de Minimoa+', monthly: 'Suscripción mensual de Minimoa+', weekly: 'Suscripción semanal de Minimoa+' },
    price: { year: (amount: string) => `${amount} al año`, month: (amount: string) => `${amount} al mes`, week: (amount: string) => `${amount} a la semana` },
    perMonth: (amount: string) => `o sea, ${amount} al mes`,
    trial: (days: number, price: string) => `${days} días gratis, luego ${price}`,
    timeline: (reminderDay: number, days: number) => [
      { day: 0, title: 'Hoy', text: 'Todo Minimoa+ está disponible.' },
      { day: reminderDay, title: `Día ${reminderDay}`, text: 'Te enviamos un recordatorio antes de que termine la prueba.' },
      { day: days, title: `Día ${days}`, text: 'Primer pago, salvo que canceles antes.' },
    ],
    teaser: (n: number) => (n === 1 ? '1 persona compatible cerca de ti' : `${n} personas compatibles cerca de ti`),
    renewalNotice:
      'El pago se carga en tu cuenta de Apple al confirmar la compra o, con la prueba gratis, al final de la prueba. La suscripción se renueva automáticamente por la misma duración y al mismo precio, salvo que la canceles al menos 24 horas antes del final del periodo en curso. Cancela cuando quieras en Ajustes › tu nombre › Suscripciones.',
    continueFree: 'Seguir gratis',
    restore: 'Restaurar compras',
    summary: {
      none: 'No tienes Minimoa+.',
      trial: (end: string, renews: boolean) => (renews ? `Prueba gratuita hasta el ${end}. Primer pago ese mismo día.` : `Prueba gratuita hasta el ${end}. No se renovará.`),
      active: (end: string, renews: boolean) => (renews ? `Minimoa+ se renueva el ${end}.` : `Minimoa+ hasta el ${end}, sin renovación.`),
      grace: 'El pago no se realizó. Minimoa+ sigue disponible mientras actualizas tu método de pago.',
      billing_retry: 'El pago no se realizó. Actualiza tu método de pago en los ajustes de Apple para recuperar Minimoa+.',
      expired: 'Tu suscripción a Minimoa+ ha terminado.',
      refunded: 'Tu suscripción ha sido reembolsada.',
      revoked: 'Se ha retirado tu acceso compartido a Minimoa+.',
    },
    errors: {
      invalidPurchase: 'No pudimos verificar esta compra. Inténtalo de nuevo o usa «Restaurar compras».',
      unknownProduct: 'Este producto no es una suscripción de Minimoa+.',
      otherAccount: 'Esta compra pertenece a otra cuenta de Minimoa.',
      notificationRejected: 'Notificación rechazada.',
    },
  },
  moderation: {
    suspendedUntil: (until: string) => `Tu cuenta está suspendida hasta el ${until}, tras recibir reportes. ¿Alguna pregunta? Escríbenos a ${brand.supportEmail}.`,
    suspended: `Tu cuenta está suspendida, tras recibir reportes. ¿Alguna pregunta? Escríbenos a ${brand.supportEmail}.`,
    warningSubject: 'Un aviso del equipo de Minimoa',
    warningLines: (i: WarningInput) => [
      `Hola, ${i.displayName}:`,
      'Una persona te reportó y lo revisamos. Esta vez es un aviso:',
      i.reason,
      'Minimoa funciona porque todo el mundo se siente bien aquí. Si vuelve a pasar, tu cuenta podrá ser suspendida.',
      `¿Crees que nos equivocamos? Responde a este mensaje o escribe a ${brand.supportEmail}.`,
    ],
    banned: `Esta cuenta ha sido excluida de Minimoa por incumplir las normas. ¿Alguna pregunta? Escríbenos a ${brand.supportEmail}.`,
    inactivitySubject: 'Vamos a eliminar tu cuenta de Minimoa',
    inactivityLines: (i: { displayName: string; deleteOn: string }) => [
      `Hola, ${i.displayName}:`,
      'Hace casi dos años que no abres Minimoa. Como prometimos en nuestra política de privacidad, no guardamos las cuentas inactivas.',
      `Si no inicias sesión a más tardar el ${i.deleteOn}, se eliminarán tu cuenta y todo lo que va con ella (tu minimoa, tus vínculos, tus mensajes).`,
      'Para conservarla, basta con abrir la app una vez. Si no, no tienes que hacer nada.',
    ],
  },
};

const pt: Translation<typeof fr> = {
  perks: {
    map_everywhere: 'O mapa inteiro, e mudar de cidade sem sair do lugar',
    more_encounters: 'Mais encontros todo dia',
    streak_jokers: '3 coringas de sequência por semana',
    more_habits: 'Até 6 hábitos',
    detailed_review: 'O resumo detalhado de domingo',
    free_rename: 'Renomear seu minimoa quando quiser',
    premium_items: 'Todos os itens premium do guarda-roupa',
  },
  plus: {
    name: { yearly: 'Assinatura anual do Minimoa+', monthly: 'Assinatura mensal do Minimoa+', weekly: 'Assinatura semanal do Minimoa+' },
    price: { year: (amount: string) => `${amount} por ano`, month: (amount: string) => `${amount} por mês`, week: (amount: string) => `${amount} por semana` },
    perMonth: (amount: string) => `ou seja, ${amount} por mês`,
    trial: (days: number, price: string) => `${days} dias grátis, depois ${price}`,
    timeline: (reminderDay: number, days: number) => [
      { day: 0, title: 'Hoje', text: 'Todo o Minimoa+ liberado.' },
      { day: reminderDay, title: `Dia ${reminderDay}`, text: 'A gente te manda um lembrete antes do fim do teste.' },
      { day: days, title: `Dia ${days}`, text: 'Primeira cobrança, a não ser que você cancele antes.' },
    ],
    teaser: (n: number) => (n === 1 ? '1 pessoa compatível perto de você' : `${n} pessoas compatíveis perto de você`),
    renewalNotice:
      'O pagamento é cobrado na sua Conta Apple na confirmação da compra ou, com o teste gratuito, no fim do teste. A assinatura é renovada automaticamente pela mesma duração e pelo mesmo preço, a não ser que você a cancele pelo menos 24 horas antes do fim do período atual. Cancele quando quiser em Ajustes › seu nome › Assinaturas.',
    continueFree: 'Continuar grátis',
    restore: 'Restaurar compras',
    summary: {
      none: 'Você não tem o Minimoa+.',
      trial: (end: string, renews: boolean) => (renews ? `Teste gratuito até ${end}. Primeira cobrança nesse dia.` : `Teste gratuito até ${end}. Não será renovado.`),
      active: (end: string, renews: boolean) => (renews ? `O Minimoa+ será renovado em ${end}.` : `Minimoa+ até ${end}, sem renovação.`),
      grace: 'O pagamento não foi aprovado. O Minimoa+ continua liberado enquanto você atualiza sua forma de pagamento.',
      billing_retry: 'O pagamento não foi aprovado. Atualize sua forma de pagamento nos ajustes da Apple para ter o Minimoa+ de volta.',
      expired: 'Sua assinatura do Minimoa+ terminou.',
      refunded: 'Sua assinatura foi reembolsada.',
      revoked: 'Seu acesso compartilhado ao Minimoa+ foi removido.',
    },
    errors: {
      invalidPurchase: 'Não conseguimos verificar essa compra. Tente de novo ou use “Restaurar compras”.',
      unknownProduct: 'Esse produto não é uma assinatura do Minimoa+.',
      otherAccount: 'Essa compra pertence a outra conta Minimoa.',
      notificationRejected: 'Notificação recusada.',
    },
  },
  moderation: {
    suspendedUntil: (until: string) => `Sua conta está suspensa até ${until}, após denúncias. Alguma dúvida? Escreva para ${brand.supportEmail}.`,
    suspended: `Sua conta está suspensa, após denúncias. Alguma dúvida? Escreva para ${brand.supportEmail}.`,
    warningSubject: 'Um aviso da equipe Minimoa',
    warningLines: (i: WarningInput) => [
      `Oi, ${i.displayName},`,
      'Uma pessoa denunciou você e nós analisamos. Desta vez, é um aviso:',
      i.reason,
      'O Minimoa funciona porque todo mundo se sente bem aqui. Se isso acontecer de novo, sua conta poderá ser suspensa.',
      `Acha que nos enganamos? Responda esta mensagem ou escreva para ${brand.supportEmail}.`,
    ],
    banned: `Esta conta foi banida do Minimoa por violar as regras. Alguma dúvida? Escreva para ${brand.supportEmail}.`,
    inactivitySubject: 'Sua conta Minimoa vai ser excluída',
    inactivityLines: (i: { displayName: string; deleteOn: string }) => [
      `Oi, ${i.displayName},`,
      'Faz quase dois anos que você não abre o Minimoa. Como prometemos na nossa política de privacidade, não guardamos contas inativas.',
      `Se você não entrar até ${i.deleteOn}, sua conta e tudo o que vem com ela (seu minimoa, seus vínculos, suas mensagens) serão excluídos.`,
      'Para mantê-la, basta abrir o app uma vez. Caso contrário, você não precisa fazer nada.',
    ],
  },
};

const nl: Translation<typeof fr> = {
  perks: {
    map_everywhere: 'De hele kaart, en van stad wisselen zonder te verhuizen',
    more_encounters: 'Meer ontmoetingen per dag',
    streak_jokers: '3 reeksjokers per week',
    more_habits: 'Tot 6 gewoontes',
    detailed_review: 'Het uitgebreide zondagsoverzicht',
    free_rename: 'Je minimoa hernoemen wanneer je wilt',
    premium_items: 'Alle premium items uit de garderobe',
  },
  plus: {
    name: { yearly: 'Minimoa+ jaarabonnement', monthly: 'Minimoa+ maandabonnement', weekly: 'Minimoa+ weekabonnement' },
    price: { year: (amount: string) => `${amount} per jaar`, month: (amount: string) => `${amount} per maand`, week: (amount: string) => `${amount} per week` },
    perMonth: (amount: string) => `dat is ${amount} per maand`,
    trial: (days: number, price: string) => `${days} dagen gratis, daarna ${price}`,
    timeline: (reminderDay: number, days: number) => [
      { day: 0, title: 'Vandaag', text: 'Heel Minimoa+ staat voor je open.' },
      { day: reminderDay, title: `Dag ${reminderDay}`, text: 'We sturen je een herinnering voordat de proefperiode afloopt.' },
      { day: days, title: `Dag ${days}`, text: 'Eerste betaling, tenzij je eerder opzegt.' },
    ],
    teaser: (n: number) => (n === 1 ? '1 compatibel persoon bij jou in de buurt' : `${n} compatibele mensen bij jou in de buurt`),
    renewalNotice:
      'De betaling wordt via je Apple-account in rekening gebracht bij het bevestigen van de aankoop of, met de gratis proefperiode, aan het einde daarvan. Het abonnement wordt automatisch verlengd voor dezelfde duur en tegen dezelfde prijs, tenzij je het minstens 24 uur voor het einde van de lopende periode opzegt. Altijd opzegbaar via Instellingen › je naam › Abonnementen.',
    continueFree: 'Gratis doorgaan',
    restore: 'Aankopen herstellen',
    summary: {
      none: 'Je hebt geen Minimoa+.',
      trial: (end: string, renews: boolean) => (renews ? `Gratis proefperiode tot ${end}. Eerste betaling op die dag.` : `Gratis proefperiode tot ${end}. Wordt niet verlengd.`),
      active: (end: string, renews: boolean) => (renews ? `Minimoa+ wordt verlengd op ${end}.` : `Minimoa+ tot ${end}, zonder verlenging.`),
      grace: 'De betaling is niet gelukt. Minimoa+ blijft open zolang je je betaalmethode bijwerkt.',
      billing_retry: 'De betaling is niet gelukt. Werk je betaalmethode bij in je Apple-instellingen om Minimoa+ terug te krijgen.',
      expired: 'Je Minimoa+-abonnement is afgelopen.',
      refunded: 'Je abonnement is terugbetaald.',
      revoked: 'Je gedeelde toegang tot Minimoa+ is ingetrokken.',
    },
    errors: {
      invalidPurchase: 'We konden deze aankoop niet controleren. Probeer het opnieuw, of gebruik “Aankopen herstellen”.',
      unknownProduct: 'Dit product is geen Minimoa+-abonnement.',
      otherAccount: 'Deze aankoop hoort bij een ander Minimoa-account.',
      notificationRejected: 'Melding geweigerd.',
    },
  },
  moderation: {
    suspendedUntil: (until: string) => `Je account is geschorst tot ${until}, na meldingen. Vragen? Mail ons op ${brand.supportEmail}.`,
    suspended: `Je account is geschorst, na meldingen. Vragen? Mail ons op ${brand.supportEmail}.`,
    warningSubject: 'Een waarschuwing van het Minimoa-team',
    warningLines: (i: WarningInput) => [
      `Hoi ${i.displayName},`,
      'Iemand heeft je gemeld en we hebben ernaar gekeken. Deze keer is het een waarschuwing:',
      i.reason,
      'Minimoa werkt omdat iedereen zich er prettig voelt. Gebeurt het nog eens, dan kan je account worden geschorst.',
      `Denk je dat we ons vergissen? Antwoord op dit bericht of mail naar ${brand.supportEmail}.`,
    ],
    banned: `Dit account is uitgesloten van Minimoa wegens overtreding van de regels. Vragen? Mail ons op ${brand.supportEmail}.`,
    inactivitySubject: 'Je Minimoa-account wordt verwijderd',
    inactivityLines: (i: { displayName: string; deleteOn: string }) => [
      `Hoi ${i.displayName},`,
      'Je hebt Minimoa al bijna twee jaar niet geopend. Zoals beloofd in ons privacybeleid bewaren we geen inactieve accounts.',
      `Log je uiterlijk ${i.deleteOn} niet in, dan worden je account en alles wat erbij hoort (je minimoa, je banden, je berichten) verwijderd.`,
      'Wil je het houden? Open de app dan één keer. Anders hoef je niets te doen.',
    ],
  },
};

export const facturationText = defineMessages({ fr, en, es, pt, nl });

/** Avantages de Minimoa+ dans une langue. */
export const plusPerkTextIn = (locale: Locale): Readonly<Record<PlusPerk, string>> => facturationText.in(locale).perks;
/** Textes du paywall et de l'abonnement dans une langue. */
export const plusTextIn = (locale: Locale) => facturationText.in(locale).plus;

/** Textes de la modération vus par la personne concernée. */
export const moderationTextIn = (locale: Locale) => {
  const t = facturationText.in(locale).moderation;
  return {
    suspended: (until: string | null): string => (until ? t.suspendedUntil(formatDate(locale, until)) : t.suspended),
    warningEmail: (input: WarningInput) => {
      const v = emailChromeText.in(locale).moderationWarning;
      const [hello = '', intro = '', reason = '', ...rest] = t.warningLines(input);
      return renderEmail(locale, t.warningSubject, {
        scene: 'gaston-neutre',
        eyebrow: v.eyebrow,
        preheader: v.preheader,
        bubble: v.bubble,
        title: t.warningSubject,
        paragraphs: [hello, intro, { kind: 'quote', text: reason }, ...rest],
      });
    },
    banned: t.banned,
    inactivityEmail: (input: { displayName: string; deleteOn: string }) => {
      const v = emailChromeText.in(locale).inactivity;
      const deleteOn = formatDate(locale, input.deleteOn);
      return renderEmail(locale, t.inactivitySubject, {
        scene: 'suzie-dodo',
        eyebrow: v.eyebrow,
        preheader: v.preheader(deleteOn),
        bubble: v.bubble,
        title: t.inactivitySubject,
        paragraphs: t.inactivityLines({ displayName: input.displayName, deleteOn }),
      });
    },
  };
};
