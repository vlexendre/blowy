/**
 * Habillage des e-mails, par langue : textes alternatifs des images, pied de page, et la « voix » de chaque e-mail
 * (étiquette, texte d'aperçu dans la boîte de réception, bulle du minimoa qui l'accompagne).
 *
 * Les minimoas de la bulle sont ceux de l'image (Nino, Suzie, Gaston, Pia : les hôtes de l'univers) ; ils parlent du
 * minimoa de la personne par son nom. Ton du site : court, sec, jamais culpabilisant, aucune fausse urgence.
 * Les dates et les montants arrivent déjà mis en forme.
 */
import { type Translation, defineMessages } from '../i18n/core';
import type { EmailScene } from './art';

interface Pet {
  petName: string;
}
interface Wave extends Pet {
  fromPetName: string;
}
interface Linked extends Pet {
  otherPetName: string;
}
interface Trial {
  endsOn: string;
  price: string;
}

const fr = {
  /** Séparateur entre un libellé et sa valeur (« Ouvrir : https://… »). */
  ctaSeparator: ' : ',
  /** Citation de la bulle dans la version texte. */
  quote: (s: string) => `« ${s} »`,
  /** Texte alternatif de chaque image (lu quand les images sont coupées). */
  art: {
    'nino-coucou': 'Nino, le minimoa vert à houppette orange, te fait coucou',
    'nino-pense': 'Nino, le minimoa vert, pense à toi',
    'nino-check': 'Nino, le minimoa vert, lève le pouce',
    'nino-accueil': 'Nino, le minimoa vert, t’ouvre grand les bras',
    'suzie-coucou': 'Suzie, le minimoa rose, te fait signe',
    'suzie-dodo': 'Suzie, le minimoa rose, fait la sieste',
    'suzie-timide': 'Suzie, le minimoa rose, un peu ému',
    'gaston-joie': 'Gaston, le minimoa orange, saute de joie',
    'gaston-neutre': 'Gaston, le minimoa orange, l’air sérieux mais bienveillant',
    'gaston-pense': 'Gaston, le minimoa orange, réfléchit',
    'gaston-assis': 'Gaston, le minimoa orange, assis, t’attend tranquillement',
    'pia-assis': 'Pia, le minimoa violet, assis bien tranquille',
    'pia-fete': 'Pia, le minimoa violet, fait la fête',
    'pia-check': 'Pia, le minimoa violet, lève le pouce',
    'duo-rencontre': 'Nino et Suzie, deux minimoas, se tapent dans la main',
    'bande-fete': 'Nino, Suzie, Gaston et Pia font la fête ensemble',
  } as Record<EmailScene, string>,
  /** Qui parle quand l'image montre plusieurs minimoas. */
  speakers: { duo: 'Nino et Suzie', band: 'La bande' },
  faces: 'Nino, Suzie, Gaston et Pia',
  contact: 'Une question ? Écris-nous à',
  welcome: {
    eyebrow: 'Bienvenue',
    preheader: (i: Pet) => `${i.petName} vient d’ouvrir les yeux. Il a déjà envie de sortir.`,
    bubble: (i: Pet) => `Coucou ! Moi, c’est Nino. Je garde un œil sur ${i.petName} pendant ses premiers pas.`,
  },
  wave: {
    eyebrow: 'On te fait signe',
    preheader: (i: Wave) => `${i.fromPetName} est passé voir ${i.petName}. À toi de répondre.`,
    bubble: (i: Wave) => `Psst ! ${i.fromPetName} attend devant chez ${i.petName}. Je lui dis quoi ?`,
  },
  linkCreated: {
    eyebrow: 'Nouveau lien',
    preheader: (i: Linked) => `${i.petName} et ${i.otherPetName} se sont trouvés. Le premier message, c’est toi.`,
    bubble: 'Top là ! La suite, c’est à vous deux de l’écrire.',
  },
  quartierConfirm: {
    eyebrow: 'Ouvre ton quartier',
    preheader: (zone: string) => `Un clic, et tu comptes pour ${zone}.`,
    bubble: (zone: string) => `Un clic et je file prévenir tout ${zone} !`,
  },
  quartierOpen: {
    preheader: (zone: string) => `${zone} est ouvert sur Minimoa. Ton code est dedans.`,
    bubble: 'On t’attendait. Tout le quartier est là !',
    codeLabel: 'Ton code',
  },
  trialReminder: {
    eyebrow: 'Minimoa+ · rappel',
    preheader: (i: Trial) => `Ton essai se termine le ${i.endsOn}. Ensuite : ${i.price} par an. Pour annuler, c’est dans les réglages de ton iPhone.`,
    bubble: 'Petit rappel, comme promis. Pas de surprise sur ta facture.',
    facts: {
      endsOn: 'Fin de l’essai',
      price: 'Premier paiement, puis chaque année',
      cancel: 'Pour annuler (24 h avant)',
      cancelPath: 'Réglages › ton nom › Abonnements',
    },
  },
  moderationWarning: {
    eyebrow: 'Modération',
    preheader: 'On a regardé un signalement qui te concerne. Voilà ce qu’il faut savoir.',
    bubble: 'Rien de dramatique. On préfère juste te le dire franchement.',
  },
  inactivity: {
    eyebrow: 'Ton compte',
    preheader: (deleteOn: string) => `Sans connexion d’ici le ${deleteOn}, ton compte Minimoa sera supprimé.`,
    bubble: 'Zzz… Une seule visite dans l’app suffit à tout garder.',
  },
  plusWelcome: {
    eyebrow: 'Minimoa+',
    preheader: 'Tout Minimoa+ est ouvert. Voilà ce qui change.',
    bubble: (i: Pet) => `${i.petName} a déjà vidé le coffre des objets premium.`,
  },
  plusBilling: {
    eyebrow: 'Minimoa+ · paiement',
    preheader: 'Apple n’a pas pu prélever ton abonnement. Ça se règle en deux minutes.',
    bubble: 'Une carte expirée, sûrement. Ça arrive aux meilleurs.',
  },
  plusGoodbye: {
    eyebrow: 'Minimoa+',
    preheader: (i: Pet) => `${i.petName}, tes liens et vos conversations restent là, gratuitement.`,
    bubble: 'Merci pour tout. Nous, on ne bouge pas.',
  },
  plusWinback: {
    eyebrow: 'Des nouvelles',
    preheader: (i: Pet) => `${i.petName} et tes liens sont toujours là. C’est le seul message à ce sujet.`,
    bubble: (i: Pet) => `Je me demandais ce que tu devenais. ${i.petName} aussi.`,
  },
  longAbsence: {
    eyebrow: 'Des nouvelles de ton minimoa',
    preheader: (i: Pet) => `${i.petName} te garde ta place. Rien ne presse.`,
    bubble: (i: Pet) => `Je tiens compagnie à ${i.petName} en attendant. On ne bouge pas d’ici.`,
  },
};

const en: Translation<typeof fr> = {
  ctaSeparator: ': ',
  /** Citation de la bulle dans la version texte. */
  quote: (s: string) => `“${s}”`,
  art: {
    'nino-coucou': 'Nino, the green minimoa with an orange tuft, waving at you',
    'nino-pense': 'Nino, the green minimoa, thinking of you',
    'nino-check': 'Nino, the green minimoa, giving a thumbs-up',
    'nino-accueil': 'Nino, the green minimoa, with open arms',
    'suzie-coucou': 'Suzie, the pink minimoa, waving at you',
    'suzie-dodo': 'Suzie, the pink minimoa, taking a nap',
    'suzie-timide': 'Suzie, the pink minimoa, a little moved',
    'gaston-joie': 'Gaston, the orange minimoa, jumping for joy',
    'gaston-neutre': 'Gaston, the orange minimoa, looking serious but kind',
    'gaston-pense': 'Gaston, the orange minimoa, thinking',
    'gaston-assis': 'Gaston, the orange minimoa, sitting and waiting calmly',
    'pia-assis': 'Pia, the purple minimoa, sitting calmly',
    'pia-fete': 'Pia, the purple minimoa, celebrating',
    'pia-check': 'Pia, the purple minimoa, giving a thumbs-up',
    'duo-rencontre': 'Nino and Suzie, two minimoas, high-fiving',
    'bande-fete': 'Nino, Suzie, Gaston and Pia celebrating together',
  },
  speakers: { duo: 'Nino and Suzie', band: 'The gang' },
  faces: 'Nino, Suzie, Gaston and Pia',
  contact: 'Any questions? Write to us at',
  welcome: {
    eyebrow: 'Welcome',
    preheader: (i: Pet) => `${i.petName} just opened its eyes. It already wants to go out.`,
    bubble: (i: Pet) => `Hi! I’m Nino. I’ll keep an eye on ${i.petName} while it finds its feet.`,
  },
  wave: {
    eyebrow: 'Someone’s waving',
    preheader: (i: Wave) => `${i.fromPetName} came to see ${i.petName}. Your move.`,
    bubble: (i: Wave) => `Psst! ${i.fromPetName} is waiting outside ${i.petName}’s place. What do I tell them?`,
  },
  linkCreated: {
    eyebrow: 'New link',
    preheader: (i: Linked) => `${i.petName} and ${i.otherPetName} found each other. The first message is yours.`,
    bubble: 'High five! The rest is up to you two.',
  },
  quartierConfirm: {
    eyebrow: 'Open your neighbourhood',
    preheader: (zone: string) => `One click, and you count for ${zone}.`,
    bubble: (zone: string) => `One click and I’ll go tell all of ${zone}!`,
  },
  quartierOpen: {
    preheader: (zone: string) => `${zone} is open on Minimoa. Your code is inside.`,
    bubble: 'We were waiting for you. The whole neighbourhood is here!',
    codeLabel: 'Your code',
  },
  trialReminder: {
    eyebrow: 'Minimoa+ · reminder',
    preheader: (i: Trial) => `Your trial ends on ${i.endsOn}. After that: ${i.price} a year. To cancel, go to your iPhone settings.`,
    bubble: 'A little reminder, as promised. No surprises on your bill.',
    facts: {
      endsOn: 'Trial ends',
      price: 'First payment, then every year',
      cancel: 'To cancel (24 hours before)',
      cancelPath: 'Settings › your name › Subscriptions',
    },
  },
  moderationWarning: {
    eyebrow: 'Moderation',
    preheader: 'We looked into a report about you. Here’s what you need to know.',
    bubble: 'Nothing dramatic. We’d just rather tell you straight.',
  },
  inactivity: {
    eyebrow: 'Your account',
    preheader: (deleteOn: string) => `If you don’t sign in by ${deleteOn}, your Minimoa account will be deleted.`,
    bubble: 'Zzz… One visit to the app is enough to keep everything.',
  },
  plusWelcome: {
    eyebrow: 'Minimoa+',
    preheader: 'All of Minimoa+ is open. Here’s what changes.',
    bubble: (i: Pet) => `${i.petName} has already emptied the premium item chest.`,
  },
  plusBilling: {
    eyebrow: 'Minimoa+ · payment',
    preheader: 'Apple couldn’t charge your subscription. It takes two minutes to fix.',
    bubble: 'An expired card, probably. It happens to the best of us.',
  },
  plusGoodbye: {
    eyebrow: 'Minimoa+',
    preheader: (i: Pet) => `${i.petName}, your links and your conversations stay, for free.`,
    bubble: 'Thanks for everything. We’re not going anywhere.',
  },
  plusWinback: {
    eyebrow: 'News',
    preheader: (i: Pet) => `${i.petName} and your links are still here. This is the only message about it.`,
    bubble: (i: Pet) => `I was wondering how you were doing. So was ${i.petName}.`,
  },
  longAbsence: {
    eyebrow: 'News from your minimoa',
    preheader: (i: Pet) => `${i.petName} is keeping your spot. No rush.`,
    bubble: (i: Pet) => `I’m keeping ${i.petName} company in the meantime. We’re not going anywhere.`,
  },
};

const es: Translation<typeof fr> = {
  ctaSeparator: ': ',
  /** Citation de la bulle dans la version texte. */
  quote: (s: string) => `«${s}»`,
  art: {
    'nino-coucou': 'Nino, el minimoa verde con tupé naranja, te saluda',
    'nino-pense': 'Nino, el minimoa verde, piensa en ti',
    'nino-check': 'Nino, el minimoa verde, levanta el pulgar',
    'nino-accueil': 'Nino, el minimoa verde, te abre los brazos',
    'suzie-coucou': 'Suzie, el minimoa rosa, te saluda',
    'suzie-dodo': 'Suzie, el minimoa rosa, echa la siesta',
    'suzie-timide': 'Suzie, el minimoa rosa, un poco emocionado',
    'gaston-joie': 'Gaston, el minimoa naranja, salta de alegría',
    'gaston-neutre': 'Gaston, el minimoa naranja, serio pero amable',
    'gaston-pense': 'Gaston, el minimoa naranja, pensando',
    'gaston-assis': 'Gaston, el minimoa naranja, sentado, te espera tranquilo',
    'pia-assis': 'Pia, el minimoa morado, sentado muy tranquilo',
    'pia-fete': 'Pia, el minimoa morado, de fiesta',
    'pia-check': 'Pia, el minimoa morado, levanta el pulgar',
    'duo-rencontre': 'Nino y Suzie, dos minimoas, chocan los cinco',
    'bande-fete': 'Nino, Suzie, Gaston y Pia de fiesta juntos',
  },
  speakers: { duo: 'Nino y Suzie', band: 'La pandilla' },
  faces: 'Nino, Suzie, Gaston y Pia',
  contact: '¿Alguna pregunta? Escríbenos a',
  welcome: {
    eyebrow: 'Bienvenida',
    preheader: (i: Pet) => `${i.petName} acaba de abrir los ojos. Ya tiene ganas de salir.`,
    bubble: (i: Pet) => `¡Hola! Soy Nino. Le echo un ojo a ${i.petName} en sus primeros pasos.`,
  },
  wave: {
    eyebrow: 'Alguien te saluda',
    preheader: (i: Wave) => `${i.fromPetName} vino a ver a ${i.petName}. Te toca.`,
    bubble: (i: Wave) => `¡Psst! ${i.fromPetName} espera en la puerta de ${i.petName}. ¿Qué le digo?`,
  },
  linkCreated: {
    eyebrow: 'Nuevo vínculo',
    preheader: (i: Linked) => `${i.petName} y ${i.otherPetName} se han encontrado. El primer mensaje es tuyo.`,
    bubble: '¡Choca esos cinco! Lo que sigue lo escribís vosotros.',
  },
  quartierConfirm: {
    eyebrow: 'Abre tu barrio',
    preheader: (zone: string) => `Un clic y cuentas para ${zone}.`,
    bubble: (zone: string) => `¡Un clic y voy a avisar a todo ${zone}!`,
  },
  quartierOpen: {
    preheader: (zone: string) => `${zone} ya está abierto en Minimoa. Tu código va dentro.`,
    bubble: 'Te estábamos esperando. ¡Está todo el barrio!',
    codeLabel: 'Tu código',
  },
  trialReminder: {
    eyebrow: 'Minimoa+ · recordatorio',
    preheader: (i: Trial) => `Tu prueba termina el ${i.endsOn}. Después: ${i.price} al año. Para cancelar, ve a los ajustes de tu iPhone.`,
    bubble: 'Un pequeño recordatorio, como prometimos. Sin sorpresas en tu factura.',
    facts: {
      endsOn: 'Fin de la prueba',
      price: 'Primer pago, y luego cada año',
      cancel: 'Para cancelar (24 horas antes)',
      cancelPath: 'Ajustes › tu nombre › Suscripciones',
    },
  },
  moderationWarning: {
    eyebrow: 'Moderación',
    preheader: 'Hemos revisado un reporte sobre ti. Esto es lo que debes saber.',
    bubble: 'Nada dramático. Solo preferimos decírtelo claro.',
  },
  inactivity: {
    eyebrow: 'Tu cuenta',
    preheader: (deleteOn: string) => `Si no inicias sesión antes del ${deleteOn}, tu cuenta de Minimoa se eliminará.`,
    bubble: 'Zzz… Con una sola visita a la app se guarda todo.',
  },
  plusWelcome: {
    eyebrow: 'Minimoa+',
    preheader: 'Todo Minimoa+ está abierto. Esto es lo que cambia.',
    bubble: (i: Pet) => `${i.petName} ya ha vaciado el cofre de objetos premium.`,
  },
  plusBilling: {
    eyebrow: 'Minimoa+ · pago',
    preheader: 'Apple no ha podido cobrar tu suscripción. Se arregla en dos minutos.',
    bubble: 'Una tarjeta caducada, seguro. Le pasa a cualquiera.',
  },
  plusGoodbye: {
    eyebrow: 'Minimoa+',
    preheader: (i: Pet) => `${i.petName}, tus vínculos y vuestras conversaciones siguen aquí, gratis.`,
    bubble: 'Gracias por todo. Nosotros no nos movemos.',
  },
  plusWinback: {
    eyebrow: 'Noticias',
    preheader: (i: Pet) => `${i.petName} y tus vínculos siguen aquí. Es el único mensaje sobre esto.`,
    bubble: (i: Pet) => `Me preguntaba qué tal te iba. ${i.petName} también.`,
  },
  longAbsence: {
    eyebrow: 'Noticias de tu minimoa',
    preheader: (i: Pet) => `${i.petName} te guarda el sitio. Sin prisa.`,
    bubble: (i: Pet) => `Le hago compañía a ${i.petName} mientras tanto. No nos movemos de aquí.`,
  },
};

const pt: Translation<typeof fr> = {
  ctaSeparator: ': ',
  /** Citation de la bulle dans la version texte. */
  quote: (s: string) => `“${s}”`,
  art: {
    'nino-coucou': 'Nino, o minimoa verde de topete laranja, acenando para você',
    'nino-pense': 'Nino, o minimoa verde, pensando em você',
    'nino-check': 'Nino, o minimoa verde, fazendo joinha',
    'nino-accueil': 'Nino, o minimoa verde, de braços abertos',
    'suzie-coucou': 'Suzie, o minimoa rosa, acenando para você',
    'suzie-dodo': 'Suzie, o minimoa rosa, tirando um cochilo',
    'suzie-timide': 'Suzie, o minimoa rosa, um pouco emocionado',
    'gaston-joie': 'Gaston, o minimoa laranja, pulando de alegria',
    'gaston-neutre': 'Gaston, o minimoa laranja, sério mas gentil',
    'gaston-pense': 'Gaston, o minimoa laranja, pensando',
    'gaston-assis': 'Gaston, o minimoa laranja, sentado, esperando com calma',
    'pia-assis': 'Pia, o minimoa roxo, sentado bem tranquilo',
    'pia-fete': 'Pia, o minimoa roxo, comemorando',
    'pia-check': 'Pia, o minimoa roxo, fazendo joinha',
    'duo-rencontre': 'Nino e Suzie, dois minimoas, batendo as mãos',
    'bande-fete': 'Nino, Suzie, Gaston e Pia comemorando juntos',
  },
  speakers: { duo: 'Nino e Suzie', band: 'A turma' },
  faces: 'Nino, Suzie, Gaston e Pia',
  contact: 'Alguma dúvida? Escreva para',
  welcome: {
    eyebrow: 'Boas-vindas',
    preheader: (i: Pet) => `${i.petName} acabou de abrir os olhos. Já está com vontade de sair.`,
    bubble: (i: Pet) => `Oi! Eu sou o Nino. Vou ficar de olho no ${i.petName} nos primeiros passos.`,
  },
  wave: {
    eyebrow: 'Alguém está acenando',
    preheader: (i: Wave) => `${i.fromPetName} veio ver ${i.petName}. Sua vez.`,
    bubble: (i: Wave) => `Psiu! ${i.fromPetName} está esperando na porta do ${i.petName}. O que eu digo?`,
  },
  linkCreated: {
    eyebrow: 'Novo vínculo',
    preheader: (i: Linked) => `${i.petName} e ${i.otherPetName} se encontraram. A primeira mensagem é sua.`,
    bubble: 'Bate aqui! O resto vocês dois escrevem.',
  },
  quartierConfirm: {
    eyebrow: 'Abra seu bairro',
    preheader: (zone: string) => `Um clique e você conta para ${zone}.`,
    bubble: (zone: string) => `Um clique e eu vou avisar ${zone} inteiro!`,
  },
  quartierOpen: {
    preheader: (zone: string) => `${zone} está aberto no Minimoa. Seu código está aqui dentro.`,
    bubble: 'A gente estava esperando você. O bairro todo está aqui!',
    codeLabel: 'Seu código',
  },
  trialReminder: {
    eyebrow: 'Minimoa+ · lembrete',
    preheader: (i: Trial) => `Seu teste termina em ${i.endsOn}. Depois: ${i.price} por ano. Para cancelar, vá aos ajustes do seu iPhone.`,
    bubble: 'Um lembrete, como prometido. Nada de surpresa na sua fatura.',
    facts: {
      endsOn: 'Fim do teste',
      price: 'Primeiro pagamento, depois todo ano',
      cancel: 'Para cancelar (24 horas antes)',
      cancelPath: 'Ajustes › seu nome › Assinaturas',
    },
  },
  moderationWarning: {
    eyebrow: 'Moderação',
    preheader: 'Analisamos uma denúncia sobre você. Veja o que você precisa saber.',
    bubble: 'Nada dramático. A gente só prefere falar com franqueza.',
  },
  inactivity: {
    eyebrow: 'Sua conta',
    preheader: (deleteOn: string) => `Se você não entrar até ${deleteOn}, sua conta do Minimoa será excluída.`,
    bubble: 'Zzz… Uma única visita ao app basta para guardar tudo.',
  },
  plusWelcome: {
    eyebrow: 'Minimoa+',
    preheader: 'Todo o Minimoa+ está liberado. Veja o que muda.',
    bubble: (i: Pet) => `${i.petName} já esvaziou o baú de itens premium.`,
  },
  plusBilling: {
    eyebrow: 'Minimoa+ · pagamento',
    preheader: 'A Apple não conseguiu cobrar sua assinatura. Resolve em dois minutos.',
    bubble: 'Um cartão vencido, com certeza. Acontece com todo mundo.',
  },
  plusGoodbye: {
    eyebrow: 'Minimoa+',
    preheader: (i: Pet) => `${i.petName}, seus vínculos e suas conversas continuam aqui, de graça.`,
    bubble: 'Obrigado por tudo. A gente continua aqui.',
  },
  plusWinback: {
    eyebrow: 'Novidades',
    preheader: (i: Pet) => `${i.petName} e seus vínculos continuam aqui. É a única mensagem sobre isso.`,
    bubble: (i: Pet) => `Eu estava pensando em como você está. O ${i.petName} também.`,
  },
  longAbsence: {
    eyebrow: 'Notícias do seu minimoa',
    preheader: (i: Pet) => `${i.petName} está guardando seu lugar. Sem pressa.`,
    bubble: (i: Pet) => `Estou fazendo companhia para o ${i.petName} enquanto isso. A gente não sai daqui.`,
  },
};

const nl: Translation<typeof fr> = {
  ctaSeparator: ': ',
  /** Citation de la bulle dans la version texte. */
  quote: (s: string) => `‘${s}’`,
  art: {
    'nino-coucou': 'Nino, de groene minimoa met een oranje kuif, zwaait naar je',
    'nino-pense': 'Nino, de groene minimoa, denkt aan je',
    'nino-check': 'Nino, de groene minimoa, steekt zijn duim op',
    'nino-accueil': 'Nino, de groene minimoa, met open armen',
    'suzie-coucou': 'Suzie, de roze minimoa, zwaait naar je',
    'suzie-dodo': 'Suzie, de roze minimoa, doet een dutje',
    'suzie-timide': 'Suzie, de roze minimoa, een beetje ontroerd',
    'gaston-joie': 'Gaston, de oranje minimoa, springt van blijdschap',
    'gaston-neutre': 'Gaston, de oranje minimoa, serieus maar vriendelijk',
    'gaston-pense': 'Gaston, de oranje minimoa, denkt na',
    'gaston-assis': 'Gaston, de oranje minimoa, zit rustig op je te wachten',
    'pia-assis': 'Pia, de paarse minimoa, zit heel rustig',
    'pia-fete': 'Pia, de paarse minimoa, viert feest',
    'pia-check': 'Pia, de paarse minimoa, steekt zijn duim op',
    'duo-rencontre': 'Nino en Suzie, twee minimoas, geven elkaar een high five',
    'bande-fete': 'Nino, Suzie, Gaston en Pia vieren samen feest',
  },
  speakers: { duo: 'Nino en Suzie', band: 'De bende' },
  faces: 'Nino, Suzie, Gaston en Pia',
  contact: 'Vragen? Mail ons op',
  welcome: {
    eyebrow: 'Welkom',
    preheader: (i: Pet) => `${i.petName} heeft net zijn ogen geopend. Hij wil al naar buiten.`,
    bubble: (i: Pet) => `Hoi! Ik ben Nino. Ik houd ${i.petName} in de gaten tijdens zijn eerste stapjes.`,
  },
  wave: {
    eyebrow: 'Iemand zwaait',
    preheader: (i: Wave) => `${i.fromPetName} kwam bij ${i.petName} langs. Jij bent aan zet.`,
    bubble: (i: Wave) => `Psst! ${i.fromPetName} staat bij ${i.petName} voor de deur. Wat zeg ik?`,
  },
  linkCreated: {
    eyebrow: 'Nieuwe band',
    preheader: (i: Linked) => `${i.petName} en ${i.otherPetName} hebben elkaar gevonden. Het eerste bericht is aan jou.`,
    bubble: 'High five! De rest schrijven jullie samen.',
  },
  quartierConfirm: {
    eyebrow: 'Open je buurt',
    preheader: (zone: string) => `Eén klik, en je telt mee voor ${zone}.`,
    bubble: (zone: string) => `Eén klik en ik ga heel ${zone} inlichten!`,
  },
  quartierOpen: {
    preheader: (zone: string) => `${zone} is open op Minimoa. Je code zit erin.`,
    bubble: 'We wachtten op je. De hele buurt is er!',
    codeLabel: 'Je code',
  },
  trialReminder: {
    eyebrow: 'Minimoa+ · herinnering',
    preheader: (i: Trial) => `Je proefperiode eindigt op ${i.endsOn}. Daarna: ${i.price} per jaar. Opzeggen doe je in de instellingen van je iPhone.`,
    bubble: 'Een kleine herinnering, zoals beloofd. Geen verrassingen op je rekening.',
    facts: {
      endsOn: 'Einde proefperiode',
      price: 'Eerste betaling, daarna elk jaar',
      cancel: 'Opzeggen (24 uur ervoor)',
      cancelPath: 'Instellingen › je naam › Abonnementen',
    },
  },
  moderationWarning: {
    eyebrow: 'Moderatie',
    preheader: 'We hebben een melding over jou bekeken. Dit moet je weten.',
    bubble: 'Niets dramatisch. We zeggen het je gewoon liever eerlijk.',
  },
  inactivity: {
    eyebrow: 'Je account',
    preheader: (deleteOn: string) => `Log je uiterlijk ${deleteOn} niet in, dan wordt je Minimoa-account verwijderd.`,
    bubble: 'Zzz… Eén bezoekje aan de app is genoeg om alles te houden.',
  },
  plusWelcome: {
    eyebrow: 'Minimoa+',
    preheader: 'Heel Minimoa+ staat open. Dit verandert er.',
    bubble: (i: Pet) => `${i.petName} heeft de kist met premium items al leeggehaald.`,
  },
  plusBilling: {
    eyebrow: 'Minimoa+ · betaling',
    preheader: 'Apple kon je abonnement niet afschrijven. Dat los je in twee minuten op.',
    bubble: 'Een verlopen kaart, vast. Overkomt de besten.',
  },
  plusGoodbye: {
    eyebrow: 'Minimoa+',
    preheader: (i: Pet) => `${i.petName}, je banden en jullie gesprekken blijven, gratis.`,
    bubble: 'Bedankt voor alles. Wij blijven gewoon hier.',
  },
  plusWinback: {
    eyebrow: 'Nieuws',
    preheader: (i: Pet) => `${i.petName} en je banden zijn er nog. Dit is het enige bericht hierover.`,
    bubble: (i: Pet) => `Ik vroeg me af hoe het met je ging. ${i.petName} ook.`,
  },
  longAbsence: {
    eyebrow: 'Nieuws van je minimoa',
    preheader: (i: Pet) => `${i.petName} houdt je plekje vrij. Geen haast.`,
    bubble: (i: Pet) => `Ik houd ${i.petName} intussen gezelschap. We gaan nergens heen.`,
  },
};

export const emailChromeText = defineMessages({ fr, en, es, pt, nl });
