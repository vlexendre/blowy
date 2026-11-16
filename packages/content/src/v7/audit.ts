/**
 * Textes nés de l'audit App Store (15 nov. 2026) : refus du filtre de contenus, rappel de fin d'essai par e-mail,
 * alertes de l'équipe de modération (en français seulement, comme l'administration), texte neutre de l'activité en
 * direct d'un lien sur l'écran verrouillé, et le monde d'exemple du compte de revue d'Apple.
 * Les consignes des modèles d'IA (`moderationSystem`, `photoModerationSystem`) sont stables (cache) et jamais montrées.
 */
import type { Locale, ModerationCategory } from '@blowy/domain';
import { type Translation, defineMessages, formatDate, formatPrice } from '../i18n/core';
import { brand } from '../labels';

const fr = {
  /** Contenu refusé (code `content_refused`). On ne répète jamais le contenu refusé. */
  refused: {
    displayName: 'Ce prénom ne peut pas être utilisé sur Minimoa. Choisis-en un autre.',
    petName: 'Ce nom ne peut pas être donné à un minimoa. Choisis-en un autre.',
    /** Un nom qui contient un lien, une adresse, un numéro ou un pseudo d’un autre réseau. */
    nameContact: 'Pas de lien, d’adresse, de numéro ni de pseudo dans un nom.',
    message: 'Message non envoyé : il ne respecte pas les règles de la communauté de Minimoa.',
    messageScam: 'Message non envoyé : pas de liens vers de l’argent, de la crypto ou des plateformes payantes sur Minimoa.',
    photo: 'Cette photo ne peut pas être ta photo de profil. Choisis-en une autre : toi, reconnaissable, sans nudité.',
  },
  /** Connexion du compte de revue : même message pour une mauvaise adresse et un mauvais code. */
  reviewSignIn: {
    wrong: 'Adresse ou code incorrect.',
  },
  /** Zone choisie à la main, sans localisation (gratuit). */
  area: {
    changeLocked: (day: string) => `Tu pourras changer de zone à partir du ${day}. Avec Minimoa+, quand tu veux.`,
    fromPhone: 'Ta zone vient déjà de ta position. Pour en choisir une à la main, oublie d’abord ta position (Moi › Réglages › Ma position).',
  },
  /** E-mail du rappel de fin d’essai (jour 5), envoyé en plus de la notification. */
  trialEmail: {
    subject: 'Ton essai Minimoa+ se termine bientôt',
    title: 'Ton essai gratuit se termine bientôt.',
    lines: (i: { displayName: string; endsOn: string; price: string }) => [
      `Salut ${i.displayName},`,
      `Ton essai gratuit de Minimoa+ se termine le ${i.endsOn}. Ensuite, le premier paiement de ${i.price} est prélevé par Apple, puis chaque année.`,
      'Tu veux garder Minimoa+ ? Tu n’as rien à faire.',
      'Tu préfères arrêter ? Annule au moins 24 heures avant la fin de l’essai : sur ton iPhone, Réglages, ton nom, puis Abonnements. Tu gardes Minimoa+ jusqu’à la fin de l’essai.',
    ],
    cta: 'Gérer mon abonnement',
  },
  /** Activité en direct d’un lien sur l’écran verrouillé : jamais de prénom (visible de tous). */
  lockScreen: {
    linkTitle: 'Un lien t’attend',
    linkBody: 'À toi d’écrire avant minuit.',
  },
  /** Monde d’exemple du compte de revue (lignes de la conversation et du lien en danger). `{other}` : prénom fictif. */
  review: {
    activeLines: [
      { who: 'them', text: 'Salut ! Ton minimoa a l’air aussi têtu que le mien.' },
      { who: 'me', text: 'Il l’est. Tu fais quoi ce week-end ?' },
      { who: 'them', text: 'Une expo photo samedi. Tu connais le quartier ?' },
      { who: 'me', text: 'Un peu. J’y vais souvent le dimanche matin.' },
    ],
    remark: 'Vous aimez tous les deux les dimanches calmes. Ça fait déjà un point commun.',
    nudge: 'Ça fait 3 jours. Vous en étiez à l’expo photo.',
    afterNudge: ['Pardon, j’étais sous l’eau. Ça tient toujours, l’expo ?', 'Carrément. Samedi 15 h ?'],
    heated: 'Tu annules encore ? Franchement, ça m’énerve.',
    guard: 'On souffle un coup ? Une pause de deux minutes, et ça repart mieux. (Ce message n’est visible que par toi.)',
    apology: 'Pardon, tu as raison. J’ai eu une semaine de fou.',
    after: [
      { who: 'them', text: 'Pardon pour samedi. On remet ça la semaine prochaine ?' },
    ],
    today: 'Mardi, c’est noté 👍',
    dangerLines: ['On se refait un café la semaine pro ?', 'Carrément, je te dis.'],
    /** Réponses automatiques des personnes fictives quand le compte de revue leur écrit. */
    replies: [
      'Haha, carrément.',
      'Bonne idée ! Tu proposes quand ?',
      'Je te dis ce soir.',
      'Mon minimoa vient de faire une sieste, il est en forme.',
      'J’adore cet endroit.',
    ],
    /** Répliques courtes du lien ouvert (un café proposé, un oui, mardi confirmé). */
    short: { coffee: '☕️ ?', yes: 'Oui !', tuesday: 'Oui, mardi ?' },
  },
  /**
   * Monde de démo (local, `BLOWY_DEMO=1`) : messages de Malo à la personne qui arrive, et dernier échange de chaque lien
   * d'avant (`POST /dev/demo/links`), écrits dans la langue de la personne.
   */
  demo: {
    maloMessages: [
      'Salut ! Gaston n’arrêtait pas de parler de ton minimoa.',
      'Il paraît que ton minimoa est très bien élevé. J’ai des doutes.',
      'Écris-moi quand tu peux : Gaston veut lancer notre série.',
    ],
    pastLines: {
      sasha: ['Bonne nuit ! Pia ronfle déjà.', 'Bonne nuit, à demain.'],
      ines: ['On se refait un café la semaine pro ?', 'Carrément, je te dis.'],
      yanis: ['Tu es dispo samedi ?', 'Je regarde et je te dis.'],
    },
  },
};

type AuditText = typeof fr;

const en: Translation<AuditText> = {
  refused: {
    displayName: 'This first name can’t be used on Minimoa. Pick another one.',
    petName: 'A minimoa can’t be given this name. Pick another one.',
    nameContact: 'No links, addresses, numbers or usernames in a name.',
    message: 'Message not sent: it doesn’t follow Minimoa’s community rules.',
    messageScam: 'Message not sent: no links to money, crypto or paid platforms on Minimoa.',
    photo: 'This photo can’t be your profile photo. Pick another one: you, recognizable, no nudity.',
  },
  trialEmail: {
    subject: 'Your Minimoa+ trial ends soon',
    title: 'Your free trial ends soon.',
    lines: (i: { displayName: string; endsOn: string; price: string }) => [
      `Hi ${i.displayName},`,
      `Your free Minimoa+ trial ends on ${i.endsOn}. After that, the first payment of ${i.price} is charged by Apple, then every year.`,
      'Want to keep Minimoa+? You don’t need to do anything.',
      'Prefer to stop? Cancel at least 24 hours before the trial ends: on your iPhone, Settings, your name, then Subscriptions. You keep Minimoa+ until the trial ends.',
    ],
    cta: 'Manage my subscription',
  },
  reviewSignIn: { wrong: 'Wrong address or code.' },
  area: {
    changeLocked: (day: string) => `You can change your area from ${day}. With Minimoa+, whenever you like.`,
    fromPhone: 'Your area already comes from your location. To pick one by hand, forget your location first (Me › Settings › My location).',
  },
  lockScreen: { linkTitle: 'A link is waiting', linkBody: 'Your turn to write before midnight.' },
  review: {
    activeLines: [
      { who: 'them', text: 'Hi! Your minimoa looks as stubborn as mine.' },
      { who: 'me', text: 'It is. What are you up to this weekend?' },
      { who: 'them', text: 'A photo exhibition on Saturday. Do you know the area?' },
      { who: 'me', text: 'A bit. I often go there on Sunday mornings.' },
    ],
    remark: 'You both love quiet Sundays. That’s already something in common.',
    nudge: 'It’s been 3 days. You were talking about the photo exhibition.',
    afterNudge: ['Sorry, I was swamped. Is the exhibition still on?', 'Absolutely. Saturday at 3 p.m.?'],
    heated: 'Canceling again? Honestly, that annoys me.',
    guard: 'Take a breath? A two-minute break, and things will go better. (Only you can see this message.)',
    apology: 'Sorry, you’re right. I’ve had a crazy week.',
    after: [{ who: 'them', text: 'Sorry about Saturday. Shall we try again next week?' }],
    today: 'Tuesday, noted 👍',
    dangerLines: ['Coffee again next week?', 'Definitely, I’ll let you know.'],
    replies: ['Haha, totally.', 'Good idea! When works for you?', 'I’ll let you know tonight.', 'My minimoa just had a nap, it’s full of energy.', 'I love that place.'],
    short: { coffee: '☕️?', yes: 'Yes!', tuesday: 'Yes, Tuesday?' },
  },
  demo: {
    maloMessages: [
      'Hi! Gaston wouldn’t stop talking about your minimoa.',
      'Word is your minimoa is very well behaved. I have my doubts.',
      'Write to me when you can: Gaston wants to start our streak.',
    ],
    pastLines: {
      sasha: ['Good night! Pia is already snoring.', 'Good night, talk tomorrow.'],
      ines: ['Coffee again next week?', 'Definitely, I’ll let you know.'],
      yanis: ['Are you free Saturday?', 'I’ll check and let you know.'],
    },
  },
};

const es: Translation<AuditText> = {
  refused: {
    displayName: 'Este nombre no se puede usar en Minimoa. Elige otro.',
    petName: 'Este nombre no se le puede dar a un minimoa. Elige otro.',
    nameContact: 'Nada de enlaces, direcciones, números ni nombres de usuario en un nombre.',
    message: 'Mensaje no enviado: no respeta las normas de la comunidad de Minimoa.',
    messageScam: 'Mensaje no enviado: en Minimoa no se permiten enlaces a dinero, cripto ni plataformas de pago.',
    photo: 'Esta foto no puede ser tu foto de perfil. Elige otra: tú, reconocible, sin desnudos.',
  },
  trialEmail: {
    subject: 'Tu prueba de Minimoa+ termina pronto',
    title: 'Tu prueba gratuita termina pronto.',
    lines: (i: { displayName: string; endsOn: string; price: string }) => [
      `Hola, ${i.displayName}:`,
      `Tu prueba gratuita de Minimoa+ termina el ${i.endsOn}. Después, Apple cobrará el primer pago de ${i.price}, y luego cada año.`,
      '¿Quieres seguir con Minimoa+? No tienes que hacer nada.',
      '¿Prefieres dejarlo? Cancela al menos 24 horas antes de que termine la prueba: en tu iPhone, Ajustes, tu nombre y luego Suscripciones. Conservas Minimoa+ hasta el final de la prueba.',
    ],
    cta: 'Gestionar mi suscripción',
  },
  reviewSignIn: { wrong: 'Dirección o código incorrectos.' },
  area: {
    changeLocked: (day: string) => `Podrás cambiar de zona a partir del ${day}. Con Minimoa+, cuando quieras.`,
    fromPhone: 'Tu zona ya viene de tu ubicación. Para elegir una a mano, primero olvida tu ubicación (Yo › Ajustes › Mi ubicación).',
  },
  lockScreen: { linkTitle: 'Un vínculo te espera', linkBody: 'Te toca escribir antes de medianoche.' },
  review: {
    activeLines: [
      { who: 'them', text: '¡Hola! Tu minimoa parece tan testarudo como el mío.' },
      { who: 'me', text: 'Lo es. ¿Qué haces este fin de semana?' },
      { who: 'them', text: 'Una expo de fotos el sábado. ¿Conoces el barrio?' },
      { who: 'me', text: 'Un poco. Voy a menudo los domingos por la mañana.' },
    ],
    remark: 'A ustedes dos les gustan los domingos tranquilos. Ya es un punto en común.',
    nudge: 'Ya van 3 días. Estaban hablando de la expo de fotos.',
    afterNudge: ['Perdona, tuve mucho lío. ¿Sigue en pie lo de la expo?', 'Claro. ¿Sábado a las 15 h?'],
    heated: '¿Cancelas otra vez? La verdad, me molesta.',
    guard: '¿Respiramos un momento? Una pausa de dos minutos y todo irá mejor. (Solo tú puedes ver este mensaje.)',
    apology: 'Perdona, tienes razón. He tenido una semana de locos.',
    after: [{ who: 'them', text: 'Perdona lo del sábado. ¿Lo dejamos para la semana que viene?' }],
    today: 'El martes, apuntado 👍',
    dangerLines: ['¿Otro café la semana que viene?', 'Claro, te digo.'],
    replies: ['Jaja, totalmente.', '¡Buena idea! ¿Cuándo te viene bien?', 'Te digo esta noche.', 'Mi minimoa acaba de echarse una siesta, está lleno de energía.', 'Me encanta ese sitio.'],
    short: { coffee: '¿☕️?', yes: '¡Sí!', tuesday: 'Sí, ¿el martes?' },
  },
  demo: {
    maloMessages: [
      '¡Hola! Gaston no paraba de hablar de tu minimoa.',
      'Dicen que tu minimoa es muy educado. Tengo mis dudas.',
      'Escríbeme cuando puedas: Gaston quiere empezar nuestra racha.',
    ],
    pastLines: {
      sasha: ['¡Buenas noches! Pia ya está roncando.', 'Buenas noches, hasta mañana.'],
      ines: ['¿Otro café la semana que viene?', 'Claro, te digo.'],
      yanis: ['¿Estás libre el sábado?', 'Lo miro y te digo.'],
    },
  },
};

const pt: Translation<AuditText> = {
  refused: {
    displayName: 'Esse nome não pode ser usado no Minimoa. Escolha outro.',
    petName: 'Esse nome não pode ser dado a um minimoa. Escolha outro.',
    nameContact: 'Nada de links, endereços, números ou nomes de usuário em um nome.',
    message: 'Mensagem não enviada: ela não respeita as regras da comunidade do Minimoa.',
    messageScam: 'Mensagem não enviada: no Minimoa, nada de links para dinheiro, cripto ou plataformas pagas.',
    photo: 'Essa foto não pode ser sua foto de perfil. Escolha outra: você, reconhecível, sem nudez.',
  },
  trialEmail: {
    subject: 'Seu teste do Minimoa+ está acabando',
    title: 'Seu teste gratuito está acabando.',
    lines: (i: { displayName: string; endsOn: string; price: string }) => [
      `Oi, ${i.displayName},`,
      `Seu teste gratuito do Minimoa+ termina em ${i.endsOn}. Depois, a Apple cobra o primeiro pagamento de ${i.price} e, em seguida, a cada ano.`,
      'Quer continuar com o Minimoa+? Você não precisa fazer nada.',
      'Prefere parar? Cancele pelo menos 24 horas antes do fim do teste: no seu iPhone, em Ajustes, no seu nome e depois em Assinaturas. Você continua com o Minimoa+ até o fim do teste.',
    ],
    cta: 'Gerenciar minha assinatura',
  },
  reviewSignIn: { wrong: 'E-mail ou código incorreto.' },
  area: {
    changeLocked: (day: string) => `Você poderá mudar de área a partir de ${day}. Com o Minimoa+, quando quiser.`,
    fromPhone: 'Sua área já vem da sua localização. Para escolher uma manualmente, primeiro esqueça sua localização (Eu › Ajustes › Minha localização).',
  },
  lockScreen: { linkTitle: 'Um vínculo te espera', linkBody: 'Sua vez de escrever antes da meia-noite.' },
  review: {
    activeLines: [
      { who: 'them', text: 'Oi! Seu minimoa parece tão teimoso quanto o meu.' },
      { who: 'me', text: 'É mesmo. O que você vai fazer no fim de semana?' },
      { who: 'them', text: 'Uma exposição de fotos no sábado. Você conhece o bairro?' },
      { who: 'me', text: 'Um pouco. Vou bastante lá no domingo de manhã.' },
    ],
    remark: 'Vocês gostam de domingos tranquilos. Já é um ponto em comum.',
    nudge: 'Já faz 3 dias. Vocês estavam falando da exposição de fotos.',
    afterNudge: ['Desculpa, a semana foi corrida. A exposição ainda está de pé?', 'Com certeza. Sábado às 15h?'],
    heated: 'Vai cancelar de novo? Sinceramente, isso me irrita.',
    guard: 'Vamos respirar um pouco? Uma pausa de dois minutos, e tudo flui melhor. (Só você vê esta mensagem.)',
    apology: 'Desculpa, você tem razão. Tive uma semana de louco.',
    after: [{ who: 'them', text: 'Desculpa pelo sábado. Vamos remarcar para a semana que vem?' }],
    today: 'Terça, combinado 👍',
    dangerLines: ['Bora tomar outro café semana que vem?', 'Bora, te aviso.'],
    replies: ['Haha, com certeza.', 'Boa ideia! Quando você pode?', 'Te falo hoje à noite.', 'Meu minimoa acabou de tirar uma soneca, está cheio de energia.', 'Adoro esse lugar.'],
    short: { coffee: '☕️?', yes: 'Sim!', tuesday: 'Sim, terça?' },
  },
  demo: {
    maloMessages: [
      'Oi! O Gaston não parava de falar do seu minimoa.',
      'Dizem que o seu minimoa é muito educado. Tenho minhas dúvidas.',
      'Me escreve quando puder: o Gaston quer começar a nossa sequência.',
    ],
    pastLines: {
      sasha: ['Boa noite! A Pia já está roncando.', 'Boa noite, até amanhã.'],
      ines: ['Mais um café semana que vem?', 'Com certeza, te aviso.'],
      yanis: ['Está livre no sábado?', 'Vou ver e te falo.'],
    },
  },
};

const nl: Translation<AuditText> = {
  refused: {
    displayName: 'Deze voornaam kan niet worden gebruikt op Minimoa. Kies een andere.',
    petName: 'Deze naam kan niet aan een minimoa worden gegeven. Kies een andere.',
    nameContact: 'Geen links, adressen, nummers of gebruikersnamen in een naam.',
    message: 'Bericht niet verstuurd: het houdt zich niet aan de communityregels van Minimoa.',
    messageScam: 'Bericht niet verstuurd: geen links naar geld, crypto of betaalde platforms op Minimoa.',
    photo: 'Deze foto kan niet je profielfoto zijn. Kies een andere: jij, herkenbaar, zonder naakt.',
  },
  trialEmail: {
    subject: 'Je Minimoa+-proefperiode eindigt bijna',
    title: 'Je gratis proefperiode eindigt bijna.',
    lines: (i: { displayName: string; endsOn: string; price: string }) => [
      `Hoi ${i.displayName},`,
      `Je gratis proefperiode van Minimoa+ eindigt op ${i.endsOn}. Daarna schrijft Apple de eerste betaling van ${i.price} af, en vervolgens elk jaar.`,
      'Wil je Minimoa+ houden? Dan hoef je niets te doen.',
      'Wil je liever stoppen? Zeg minstens 24 uur voor het einde van de proefperiode op: op je iPhone via Instellingen, je naam en dan Abonnementen. Je houdt Minimoa+ tot het einde van de proefperiode.',
    ],
    cta: 'Mijn abonnement beheren',
  },
  reviewSignIn: { wrong: 'Onjuist adres of onjuiste code.' },
  area: {
    changeLocked: (day: string) => `Je kunt vanaf ${day} van gebied wisselen. Met Minimoa+ wanneer je wilt.`,
    fromPhone: 'Je gebied komt al van je locatie. Wil je er zelf een kiezen, vergeet dan eerst je locatie (Ik › Instellingen › Mijn locatie).',
  },
  lockScreen: { linkTitle: 'Een band wacht op je', linkBody: 'Jouw beurt om te schrijven, vóór middernacht.' },
  review: {
    activeLines: [
      { who: 'them', text: 'Hoi! Jouw minimoa lijkt net zo koppig als de mijne.' },
      { who: 'me', text: 'Klopt. Wat doe jij dit weekend?' },
      { who: 'them', text: 'Zaterdag een fototentoonstelling. Ken je de buurt?' },
      { who: 'me', text: 'Een beetje. Ik kom er vaak op zondagochtend.' },
    ],
    remark: 'Jullie houden allebei van rustige zondagen. Dat is al één overeenkomst.',
    nudge: 'Het is 3 dagen geleden. Jullie hadden het over de fototentoonstelling.',
    afterNudge: ['Sorry, ik zat tot over mijn oren in het werk. Gaat de tentoonstelling nog door?', 'Zeker. Zaterdag om 15.00 uur?'],
    heated: 'Zeg je weer af? Eerlijk gezegd irriteert me dat.',
    guard: 'Even ademhalen? Twee minuten pauze, en dan gaat het beter. (Alleen jij ziet dit bericht.)',
    apology: 'Sorry, je hebt gelijk. Ik heb een gekke week gehad.',
    after: [{ who: 'them', text: 'Sorry van zaterdag. Volgende week nog een keer?' }],
    today: 'Dinsdag, genoteerd 👍',
    dangerLines: ['Volgende week weer koffie?', 'Zeker, ik laat het je weten.'],
    replies: ['Haha, zeker.', 'Goed idee! Wanneer kun jij?', 'Ik laat het je vanavond weten.', 'Mijn minimoa heeft net een dutje gedaan, hij zit vol energie.', 'Ik ben dol op die plek.'],
    short: { coffee: '☕️?', yes: 'Ja!', tuesday: 'Ja, dinsdag?' },
  },
  demo: {
    maloMessages: [
      'Hoi! Gaston hield maar niet op over jouw minimoa.',
      'Ik hoor dat jouw minimoa heel goed is opgevoed. Ik heb mijn twijfels.',
      'Schrijf me als je kunt: Gaston wil onze reeks beginnen.',
    ],
    pastLines: {
      sasha: ['Welterusten! Pia snurkt al.', 'Welterusten, tot morgen.'],
      ines: ['Volgende week weer een koffie?', 'Zeker, ik laat het je weten.'],
      yanis: ['Ben je zaterdag vrij?', 'Ik kijk even en laat het je weten.'],
    },
  },
};

export const auditText = defineMessages({ fr, en, es, pt, nl });

/** Message du refus d'un texte, selon la surface et la catégorie trouvée. */
export function refusedText(locale: Locale, surface: 'display_name' | 'pet_name' | 'message' | 'photo', category: ModerationCategory | null): string {
  const t = auditText.in(locale).refused;
  if (surface === 'photo') return t.photo;
  if (surface === 'message') return category === 'scam' || category === 'commercial_sex' ? t.messageScam : t.message;
  if (category === 'contact') return t.nameContact;
  return surface === 'pet_name' ? t.petName : t.displayName;
}

/** Adresse où gérer ses abonnements Apple (ouvre Réglages › Abonnements sur iPhone). */
export const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** E-mail du rappel de fin d'essai, dans la langue de la personne (date et prix mis en forme). */
export function trialReminderEmail(locale: Locale, input: { displayName: string; endsOn: string; amountMinor: number; currency: string }): { subject: string; html: string; text: string } {
  const t = auditText.in(locale).trialEmail;
  const lines = t.lines({ displayName: input.displayName, endsOn: formatDate(locale, input.endsOn, { day: 'numeric', month: 'long' }), price: formatPrice(locale, input.amountMinor, input.currency) });
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${esc(t.subject)}</title></head><body style="margin:0;padding:32px 16px;background:#0B0A14;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#F4F2FF">
<h1 style="max-width:520px;margin:0 auto 20px;font-size:22px">${esc(t.title)}</h1>
${lines.map((l) => `<p style="max-width:520px;margin:0 auto 16px;font-size:16px;line-height:1.5">${esc(l)}</p>`).join('')}
<p style="max-width:520px;margin:24px auto 0"><a href="${APPLE_SUBSCRIPTIONS_URL}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#FFB800;color:#0B0A14;font-weight:700;text-decoration:none">${esc(t.cta)}</a></p>
<p style="max-width:520px;margin:24px auto 0;font-size:12px;color:#A9A4C7">${esc(brand.name)} · ${esc(brand.supportEmail)}</p>
</body></html>`;
  const text = [t.title, '', ...lines, '', `${t.cta} : ${APPLE_SUBSCRIPTIONS_URL}`, '', `${brand.name} · ${brand.supportEmail}`].join('\n');
  return { subject: t.subject, html, text };
}

// ── Équipe de modération (français seulement, comme l'administration) ────────

export interface TeamReportLine {
  id: string;
  priority: 'normal' | 'high' | 'urgent';
  reason: string;
  source: 'person' | 'filter';
  category: string | null;
  ageHours: number;
}

const PRIORITY_FR = { urgent: 'URGENT', high: 'prioritaire', normal: 'normal' } as const;

/**
 * Récapitulatif envoyé à `ADMIN_EMAILS` : jamais le contenu signalé ni les prénoms (un e-mail sort du système),
 * seulement le motif, la priorité, l'âge et le lien vers l'administration.
 */
export function moderationAlertEmail(input: { kind: 'new' | 'overdue'; reports: readonly TeamReportLine[]; adminUrl: string; targetHours: number }): { subject: string; html: string; text: string } {
  const urgent = input.reports.filter((r) => r.priority === 'urgent').length;
  const n = input.reports.length;
  const plural = n > 1 ? 's' : '';
  const subject =
    input.kind === 'new'
      ? `[Minimoa] ${urgent > 0 ? `URGENT · ` : ''}${n} signalement${plural} à traiter`
      : `[Minimoa] ${n} signalement${plural} au-delà de ${input.targetHours} h`;
  const lead =
    input.kind === 'new'
      ? `${n} nouveau${n > 1 ? 'x' : ''} signalement${plural}${urgent > 0 ? `, dont ${urgent} urgent${urgent > 1 ? 's' : ''} (mineur, menace) : à regarder maintenant` : ''}. Délai cible : ${input.targetHours} h.`
      : `${n} signalement${plural} ouvert${plural} depuis plus de ${input.targetHours} h. Ils sont remontés en tête de la file.`;
  const line = (r: TeamReportLine): string =>
    `#${r.id} · ${PRIORITY_FR[r.priority]} · ${r.source === 'filter' ? `filtre (${r.category ?? '?'})` : `motif : ${r.reason}`}${r.source === 'person' && r.category ? ` · note : ${r.category}` : ''} · il y a ${Math.round(r.ageHours)} h`;
  const lines = input.reports.slice(0, 50).map(line);
  const more = n > 50 ? [`… et ${n - 50} autre(s).`] : [];
  const url = `${input.adminUrl.replace(/\/$/, '')}/moderation`;
  const text = [lead, '', ...lines, ...more, '', `Ouvrir la file : ${url}`, '', 'Aucun contenu ni prénom dans cet e-mail : tout est dans l’administration.'].join('\n');
  const html = `<!doctype html><html lang="fr"><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px">
<p style="font-size:16px"><strong>${esc(lead)}</strong></p>
<ul>${[...lines, ...more].map((l) => `<li style="margin:4px 0">${esc(l)}</li>`).join('')}</ul>
<p><a href="${esc(url)}">Ouvrir la file de modération</a></p>
<p style="color:#666;font-size:12px">Aucun contenu ni prénom dans cet e-mail : tout est dans l’administration.</p>
</body></html>`;
  return { subject, html, text };
}

// ── Consignes de l'IA de modération (stables, en français ; réponse d'un mot) ─

/** Confirmation d'un message que la règle n'a pas su trancher (lien nu). */
export const moderationSystem = `Tu modères les messages privés d'une app de rencontre entre adultes (18+), en plusieurs langues.
Réponds par UN SEUL mot, sans rien d'autre :
OK si le message est acceptable entre adultes (flirt, désaccord, grossièreté légère comprise) ;
INSULT pour une insulte ou du harcèlement visant la personne ;
SEXUAL pour du contenu sexuel explicite ou une sollicitation sexuelle insistante ;
MINOR pour tout contenu sexuel qui implique ou vise une personne mineure ;
THREAT pour une menace de violence, de viol, ou une incitation au suicide ;
HATE pour de la haine envers un groupe (origine, religion, orientation, genre, handicap) ;
SPAM pour une arnaque, de la crypto, un lien commercial ou de la prostitution.
Dans le doute, réponds OK.`;

/** Photo de profil : une personne adulte habillée, ou rien de choquant. */
export const photoModerationSystem = `Tu vérifies les photos de profil d'une app de rencontre entre adultes (18+).
Réponds par UN SEUL mot, sans rien d'autre :
OK si la photo est acceptable (une personne habillée, un paysage, un animal, un dessin…) ;
SEXUAL pour de la nudité, des sous-vêtements suggestifs, un contenu sexuel ;
MINOR si la personne principale semble avoir moins de 18 ans, ou pour toute nudité impliquant un enfant ;
THREAT pour de la violence, du sang, une arme pointée ;
HATE pour un symbole ou un geste haineux ;
SPAM pour un texte publicitaire, un numéro, un pseudo, un code QR ou une capture d'écran de contact.
Dans le doute, réponds OK.`;

/** Message envoyé au modèle : le texte à juger, sans rien d'autre de la conversation. */
export const moderationPrompt = (text: string): string => `Message :\n"""\n${text.slice(0, 1000)}\n"""`;
export const photoModerationPrompt = 'Photo de profil à vérifier.';
