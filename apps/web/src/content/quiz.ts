/**
 * Pages « Quel minimoa es-tu ? » (/quiz) et « Ouvre ton quartier » (/quartier) : textes de l'interface, cinq langues.
 * Le français est rendu au build, le navigateur choisit la langue du téléphone (même mécanisme que les pages de
 * partage). Les situations, les caractères et les noms des quartiers viennent de `@blowy/content` (`quizText`).
 * `{x}` : rempli par le script de la page.
 */
import type { Locale } from '../i18n/site';

export interface QuizPageCopy {
  meta: { title: string; description: string; ogAlt: string };
  intro: { kicker: string; title: readonly string[]; text: string; start: string; facts: string };
  progress: string;
  back: string;
  computing: string;
  result: {
    kicker: string;
    /** « C’est {name}. » */
    species: string;
    story: string;
    copy: string;
    copied: string;
    challenge: string;
    /** Texte partagé avec le lien du défi. */
    challengeText: string;
    /** Texte partagé avec le lien du résultat. */
    shareText: string;
    saved: string;
    cardAlt: string;
    keepTitle: string;
    keepText: string;
    open: string;
    codeLabel: string;
    again: string;
    /** Sur la carte story. */
    cardKicker: string;
    cardCallout: string;
  };
  shared: { kicker: string; title: readonly string[]; text: string; cta: string };
  error: string;
  notFound: string;
}

export interface QuartierCopy {
  meta: { title: string; description: string; ogAlt: string };
  label: string;
  /** « Ton quartier ouvre à {n}. » */
  title: string;
  text: string;
  city: string;
  cityPick: string;
  zone: string;
  postal: string;
  postalHint: string;
  or: string;
  email: string;
  emailPlaceholder: string;
  consent: string;
  privacy: string;
  submit: string;
  sending: string;
  /** « {count} / {threshold} pour ouvrir {zone} » */
  counter: string;
  counterOpen: string;
  sentTitle: string;
  sentText: string;
  inviteTitle: string;
  inviteText: string;
  inviteShare: string;
  /** Texte partagé avec le lien d'invitation (« Il manque {missing} personnes pour ouvrir {zone}. »). */
  inviteMessage: string;
  copy: string;
  copied: string;
  openTitle: string;
  openText: string;
  openApp: string;
  codeHelp: string;
  confirmTitle: string;
  confirmText: string;
  confirmFail: string;
  unsubTitle: string;
  unsubText: string;
  errors: { zone: string; email: string; consent: string; generic: string; busy: string };
}

export interface QuizLang {
  quiz: QuizPageCopy;
  quartier: QuartierCopy;
}

export const quizCopy: Record<Locale, QuizLang> = {
  fr: {
    quiz: {
      meta: {
        title: 'Quel minimoa es-tu ? — Minimoa',
        description: '7 situations, 60 secondes, sans compte. Découvre ton minimoa et défie tes potes.', ogAlt: 'Les quatre minimoas à côté du titre « Quel minimoa es-tu ? »',
      },
      intro: {
        kicker: 'Le quiz',
        title: ['QUEL', 'MINIMOA', 'ES-TU ?'],
        text: 'Sept situations du quotidien, entre potes. Réponds sans réfléchir : ton minimoa sort à la fin.',
        start: 'C’est parti',
        facts: '60 secondes · sans compte · rien sur toi n’est gardé',
      },
      progress: '{n} / {total}',
      back: 'Retour',
      computing: 'Ton minimoa arrive…',
      result: {
        kicker: 'Ton minimoa',
        species: 'C’est {name}.',
        story: 'Partager en story',
        copy: 'Copier le lien',
        copied: 'Lien copié ✓',
        challenge: 'Défie tes potes',
        challengeText: 'Mon minimoa est {word}. Et toi, quel minimoa es-tu ?',
        shareText: 'Mon minimoa est {word}.',
        saved: 'Image enregistrée : publie-la en story.',
        cardAlt: 'Ta carte story : {name}, {word}',
        keepTitle: 'Garde ton minimoa',
        keepText: 'Installe Minimoa et tape ce code dans « Un code ? » : ton minimoa t’attend, déjà réglé.',
        open: 'J’ai déjà Minimoa',
        codeLabel: 'Ton code',
        again: 'Refaire le quiz',
        cardKicker: 'Quel minimoa es-tu ?',
        cardCallout: 'Et toi ? Fais le quiz :',
      },
      shared: {
        kicker: 'Le quiz',
        title: ['ET TOI,', 'QUEL MINIMOA', 'ES-TU ?'],
        text: 'Quelqu’un t’a envoyé son résultat. 60 secondes pour connaître le tien.',
        cta: 'Faire le quiz',
      },
      error: 'Impossible de joindre Minimoa. Vérifie ta connexion et réessaie.',
      notFound: 'Ce résultat n’existe pas, ou plus. Fais le quiz !',
    },
    quartier: {
      meta: {
        title: 'Ouvre ton quartier — Minimoa',
        description: 'Minimoa ouvre quartier par quartier. Inscris-toi, invite tes voisins : à 50, ton quartier ouvre.', ogAlt: 'Trois minimoas sur une colline, à côté du titre « Ton quartier ouvre à 50. »',
      },
      label: 'Ouvre ton quartier',
      title: 'Ton quartier ouvre à {n}.',
      text: 'Minimoa ouvre quartier par quartier, pour que ton minimoa ait vraiment du monde à te présenter. Inscris-toi : on te prévient à l’ouverture.',
      city: 'Ville',
      cityPick: 'Choisis ta ville',
      zone: 'Quartier',
      postal: 'Code postal',
      postalHint: 'Ta ville n’est pas dans la liste ? Tape ton code postal.',
      or: 'ou',
      email: 'Ton e-mail',
      emailPlaceholder: 'toi@exemple.fr',
      consent: 'J’accepte que Minimoa garde mon e-mail et mon quartier pour me prévenir de l’ouverture (deux e-mails au plus). Désinscription en un clic.',
      privacy: 'Politique de confidentialité',
      submit: 'Préviens-moi',
      sending: 'Envoi…',
      counter: '{count} / {threshold} pour ouvrir {zone}',
      counterOpen: '{zone} est ouvert',
      sentTitle: 'Regarde tes e-mails.',
      sentText: 'Un lien de confirmation vient de partir. Tu comptes dans le quartier une fois confirmé.',
      inviteTitle: 'Invite tes voisins',
      inviteText: 'Chaque personne qui s’inscrit avec ton lien fait avancer ton quartier. Les 3 premiers à inviter reçoivent la médaille de fondateur à l’ouverture.',
      inviteShare: 'Inviter',
      inviteMessage: 'Il manque {missing} personnes pour ouvrir Minimoa à {zone}. Inscris-toi :',
      copy: 'Copier le lien',
      copied: 'Lien copié ✓',
      openTitle: 'C’est ouvert !',
      openText: 'Installe Minimoa : ton minimoa te présente des gens près de chez toi.',
      openApp: 'J’ai déjà Minimoa',
      codeHelp: 'Tape ce code dans « Un code ? » à l’inscription : il garde ton quartier.',
      confirmTitle: 'C’est confirmé.',
      confirmText: 'Tu comptes dans ton quartier. Invite tes voisins pour qu’il ouvre plus vite.',
      confirmFail: 'Ce lien ne marche plus. Inscris-toi à nouveau, ça prend dix secondes.',
      unsubTitle: 'C’est fait.',
      unsubText: 'Ton adresse est effacée. Tu ne recevras plus rien de cette liste.',
      errors: {
        zone: 'Choisis ton quartier, ou tape un code postal à 5 chiffres.',
        email: 'Cette adresse e-mail ne semble pas valide.',
        consent: 'Coche la case pour qu’on puisse te prévenir.',
        generic: 'Quelque chose s’est mal passé. Réessaie dans un instant.',
        busy: 'Trop de demandes d’un coup. Attends une minute et réessaie.',
      },
    },
  },
  en: {
    quiz: {
      meta: { title: 'Which minimoa are you? — Minimoa', description: '7 situations, 60 seconds, no account. Find your minimoa and challenge your friends.', ogAlt: 'The four minimoas next to the title “Which minimoa are you?”' },
      intro: {
        kicker: 'The quiz',
        title: ['WHICH', 'MINIMOA', 'ARE YOU?'],
        text: 'Seven everyday situations with friends. Answer without thinking: your minimoa comes out at the end.',
        start: 'Let’s go',
        facts: '60 seconds · no account · nothing about you is kept',
      },
      progress: '{n} / {total}',
      back: 'Back',
      computing: 'Your minimoa is coming…',
      result: {
        kicker: 'Your minimoa',
        species: 'It’s {name}.',
        story: 'Share to story',
        copy: 'Copy link',
        copied: 'Link copied ✓',
        challenge: 'Challenge your friends',
        challengeText: 'My minimoa is {word}. Which minimoa are you?',
        shareText: 'My minimoa is {word}.',
        saved: 'Image saved: post it to your story.',
        cardAlt: 'Your story card: {name}, {word}',
        keepTitle: 'Keep your minimoa',
        keepText: 'Install Minimoa and type this code in “Got a code?”: your minimoa is waiting, already set up.',
        open: 'I already have Minimoa',
        codeLabel: 'Your code',
        again: 'Take the quiz again',
        cardKicker: 'Which minimoa are you?',
        cardCallout: 'And you? Take the quiz:',
      },
      shared: { kicker: 'The quiz', title: ['AND YOU,', 'WHICH MINIMOA', 'ARE YOU?'], text: 'Someone sent you their result. 60 seconds to find yours.', cta: 'Take the quiz' },
      error: 'Can’t reach Minimoa. Check your connection and try again.',
      notFound: 'This result doesn’t exist, or no longer does. Take the quiz!',
    },
    quartier: {
      meta: { title: 'Open your neighborhood — Minimoa', description: 'Minimoa opens neighborhood by neighborhood. Sign up, invite your neighbors: at 50, yours opens.', ogAlt: 'Three minimoas on a hill, next to the title “Your neighborhood opens at 50.”' },
      label: 'Open your neighborhood',
      title: 'Your neighborhood opens at {n}.',
      text: 'Minimoa opens neighborhood by neighborhood, so your minimoa really has people to introduce you to. Sign up: we’ll tell you when it opens.',
      city: 'City',
      cityPick: 'Pick your city',
      zone: 'Neighborhood',
      postal: 'Postal code',
      postalHint: 'City not in the list? Type your French postal code.',
      or: 'or',
      email: 'Your email',
      emailPlaceholder: 'you@example.com',
      consent: 'I agree that Minimoa keeps my email and neighborhood to tell me when it opens (two emails at most). One-click unsubscribe.',
      privacy: 'Privacy policy',
      submit: 'Let me know',
      sending: 'Sending…',
      counter: '{count} / {threshold} to open {zone}',
      counterOpen: '{zone} is open',
      sentTitle: 'Check your inbox.',
      sentText: 'A confirmation link is on its way. You count in the neighborhood once confirmed.',
      inviteTitle: 'Invite your neighbors',
      inviteText: 'Everyone who signs up with your link moves your neighborhood forward. The first 3 to invite get the founder medal when it opens.',
      inviteShare: 'Invite',
      inviteMessage: '{missing} more people needed to open Minimoa in {zone}. Sign up:',
      copy: 'Copy link',
      copied: 'Link copied ✓',
      openTitle: 'It’s open!',
      openText: 'Install Minimoa: your minimoa introduces you to people near you.',
      openApp: 'I already have Minimoa',
      codeHelp: 'Type this code in “Got a code?” when you sign up: it keeps your neighborhood.',
      confirmTitle: 'Confirmed.',
      confirmText: 'You count in your neighborhood. Invite your neighbors so it opens sooner.',
      confirmFail: 'This link no longer works. Sign up again, it takes ten seconds.',
      unsubTitle: 'Done.',
      unsubText: 'Your address is erased. You won’t receive anything more from this list.',
      errors: {
        zone: 'Pick your neighborhood, or type a 5-digit postal code.',
        email: 'This email address doesn’t look valid.',
        consent: 'Tick the box so we can let you know.',
        generic: 'Something went wrong. Try again in a moment.',
        busy: 'Too many requests at once. Wait a minute and try again.',
      },
    },
  },
  es: {
    quiz: {
      meta: { title: '¿Qué minimoa eres? — Minimoa', description: '7 situaciones, 60 segundos, sin cuenta. Descubre tu minimoa y reta a tus amigos.', ogAlt: 'Los cuatro minimoas junto al título «¿Qué minimoa eres?»' },
      intro: {
        kicker: 'El test',
        title: ['¿QUÉ', 'MINIMOA', 'ERES?'],
        text: 'Siete situaciones cotidianas entre amigos. Responde sin pensar: tu minimoa sale al final.',
        start: 'Empezar',
        facts: '60 segundos · sin cuenta · no se guarda nada sobre ti',
      },
      progress: '{n} / {total}',
      back: 'Atrás',
      computing: 'Tu minimoa está llegando…',
      result: {
        kicker: 'Tu minimoa',
        species: 'Es {name}.',
        story: 'Compartir en historia',
        copy: 'Copiar enlace',
        copied: 'Enlace copiado ✓',
        challenge: 'Reta a tus amigos',
        challengeText: 'Mi minimoa es {word}. ¿Y tú, qué minimoa eres?',
        shareText: 'Mi minimoa es {word}.',
        saved: 'Imagen guardada: publícala en tu historia.',
        cardAlt: 'Tu tarjeta para historias: {name}, {word}',
        keepTitle: 'Guarda tu minimoa',
        keepText: 'Instala Minimoa y escribe este código en «¿Tienes un código?»: tu minimoa te espera, ya configurado.',
        open: 'Ya tengo Minimoa',
        codeLabel: 'Tu código',
        again: 'Repetir el test',
        cardKicker: '¿Qué minimoa eres?',
        cardCallout: '¿Y tú? Haz el test:',
      },
      shared: { kicker: 'El test', title: ['¿Y TÚ,', 'QUÉ MINIMOA', 'ERES?'], text: 'Alguien te ha enviado su resultado. 60 segundos para conocer el tuyo.', cta: 'Hacer el test' },
      error: 'No se puede conectar con Minimoa. Revisa tu conexión y vuelve a intentarlo.',
      notFound: 'Este resultado no existe o ya no está. ¡Haz el test!',
    },
    quartier: {
      meta: { title: 'Abre tu barrio — Minimoa', description: 'Minimoa abre barrio a barrio. Apúntate, invita a tus vecinos: con 50, tu barrio abre.', ogAlt: 'Tres minimoas en una colina, junto al título «Tu barrio abre con 50.»' },
      label: 'Abre tu barrio',
      title: 'Tu barrio abre con {n}.',
      text: 'Minimoa abre barrio a barrio, para que tu minimoa tenga de verdad gente que presentarte. Apúntate: te avisamos cuando abra.',
      city: 'Ciudad',
      cityPick: 'Elige tu ciudad',
      zone: 'Barrio',
      postal: 'Código postal',
      postalHint: '¿Tu ciudad no está en la lista? Escribe tu código postal francés.',
      or: 'o',
      email: 'Tu correo',
      emailPlaceholder: 'tu@ejemplo.com',
      consent: 'Acepto que Minimoa guarde mi correo y mi barrio para avisarme de la apertura (dos correos como máximo). Baja con un clic.',
      privacy: 'Política de privacidad',
      submit: 'Avísame',
      sending: 'Enviando…',
      counter: '{count} / {threshold} para abrir {zone}',
      counterOpen: '{zone} ya está abierto',
      sentTitle: 'Mira tu correo.',
      sentText: 'Te acabamos de enviar un enlace de confirmación. Cuentas en el barrio una vez confirmado.',
      inviteTitle: 'Invita a tus vecinos',
      inviteText: 'Cada persona que se apunta con tu enlace hace avanzar tu barrio. Las 3 primeras personas que inviten reciben la medalla de fundador en la apertura.',
      inviteShare: 'Invitar',
      inviteMessage: 'Faltan {missing} personas para abrir Minimoa en {zone}. Apúntate:',
      copy: 'Copiar enlace',
      copied: 'Enlace copiado ✓',
      openTitle: '¡Ya está abierto!',
      openText: 'Instala Minimoa: tu minimoa te presenta a gente cerca de ti.',
      openApp: 'Ya tengo Minimoa',
      codeHelp: 'Escribe este código en «¿Tienes un código?» al registrarte: guarda tu barrio.',
      confirmTitle: 'Confirmado.',
      confirmText: 'Ya cuentas en tu barrio. Invita a tus vecinos para que abra antes.',
      confirmFail: 'Este enlace ya no funciona. Apúntate de nuevo, son diez segundos.',
      unsubTitle: 'Hecho.',
      unsubText: 'Tu dirección se ha borrado. No recibirás nada más de esta lista.',
      errors: {
        zone: 'Elige tu barrio o escribe un código postal de 5 cifras.',
        email: 'Esta dirección de correo no parece válida.',
        consent: 'Marca la casilla para que podamos avisarte.',
        generic: 'Algo ha fallado. Vuelve a intentarlo en un momento.',
        busy: 'Demasiadas solicitudes a la vez. Espera un minuto y vuelve a intentarlo.',
      },
    },
  },
  pt: {
    quiz: {
      meta: { title: 'Qual minimoa é você? — Minimoa', description: '7 situações, 60 segundos, sem conta. Descubra seu minimoa e desafie seus amigos.', ogAlt: 'Os quatro minimoas ao lado do título “Qual minimoa é você?”' },
      intro: {
        kicker: 'O quiz',
        title: ['QUAL', 'MINIMOA', 'É VOCÊ?'],
        text: 'Sete situações do dia a dia entre amigos. Responda sem pensar: seu minimoa aparece no final.',
        start: 'Bora',
        facts: '60 segundos · sem conta · nada sobre você é guardado',
      },
      progress: '{n} / {total}',
      back: 'Voltar',
      computing: 'Seu minimoa está chegando…',
      result: {
        kicker: 'Seu minimoa',
        species: 'É {name}.',
        story: 'Compartilhar nos stories',
        copy: 'Copiar link',
        copied: 'Link copiado ✓',
        challenge: 'Desafie seus amigos',
        challengeText: 'Meu minimoa é {word}. E você, qual minimoa é?',
        shareText: 'Meu minimoa é {word}.',
        saved: 'Imagem salva: poste nos seus stories.',
        cardAlt: 'Seu card para stories: {name}, {word}',
        keepTitle: 'Guarde seu minimoa',
        keepText: 'Instale o Minimoa e digite este código em “Tem um código?”: seu minimoa te espera, já configurado.',
        open: 'Já tenho o Minimoa',
        codeLabel: 'Seu código',
        again: 'Refazer o quiz',
        cardKicker: 'Qual minimoa é você?',
        cardCallout: 'E você? Faça o quiz:',
      },
      shared: { kicker: 'O quiz', title: ['E VOCÊ,', 'QUAL MINIMOA', 'É?'], text: 'Alguém te mandou o resultado. 60 segundos para descobrir o seu.', cta: 'Fazer o quiz' },
      error: 'Não foi possível conectar ao Minimoa. Confira sua conexão e tente de novo.',
      notFound: 'Este resultado não existe ou não existe mais. Faça o quiz!',
    },
    quartier: {
      meta: { title: 'Abra seu bairro — Minimoa', description: 'O Minimoa abre bairro por bairro. Inscreva-se, convide seus vizinhos: com 50, seu bairro abre.', ogAlt: 'Três minimoas numa colina, ao lado do título “Seu bairro abre com 50.”' },
      label: 'Abra seu bairro',
      title: 'Seu bairro abre com {n}.',
      text: 'O Minimoa abre bairro por bairro, para que seu minimoa tenha mesmo gente para te apresentar. Inscreva-se: avisamos na abertura.',
      city: 'Cidade',
      cityPick: 'Escolha sua cidade',
      zone: 'Bairro',
      postal: 'Código postal',
      postalHint: 'Sua cidade não está na lista? Digite seu código postal francês.',
      or: 'ou',
      email: 'Seu e-mail',
      emailPlaceholder: 'voce@exemplo.com',
      consent: 'Aceito que o Minimoa guarde meu e-mail e meu bairro para me avisar da abertura (dois e-mails no máximo). Descadastro com um clique.',
      privacy: 'Política de privacidade',
      submit: 'Me avise',
      sending: 'Enviando…',
      counter: '{count} / {threshold} para abrir {zone}',
      counterOpen: '{zone} está aberto',
      sentTitle: 'Confira seu e-mail.',
      sentText: 'Um link de confirmação acabou de sair. Você conta no bairro depois de confirmar.',
      inviteTitle: 'Convide seus vizinhos',
      inviteText: 'Cada pessoa que se inscreve com seu link faz seu bairro avançar. As 3 primeiras pessoas a convidar ganham a medalha de fundador na abertura.',
      inviteShare: 'Convidar',
      inviteMessage: 'Faltam {missing} pessoas para abrir o Minimoa em {zone}. Inscreva-se:',
      copy: 'Copiar link',
      copied: 'Link copiado ✓',
      openTitle: 'Está aberto!',
      openText: 'Instale o Minimoa: seu minimoa te apresenta pessoas perto de você.',
      openApp: 'Já tenho o Minimoa',
      codeHelp: 'Digite este código em “Tem um código?” no cadastro: ele guarda seu bairro.',
      confirmTitle: 'Confirmado.',
      confirmText: 'Você já conta no seu bairro. Convide seus vizinhos para ele abrir mais rápido.',
      confirmFail: 'Este link não funciona mais. Inscreva-se de novo, leva dez segundos.',
      unsubTitle: 'Pronto.',
      unsubText: 'Seu endereço foi apagado. Você não receberá mais nada desta lista.',
      errors: {
        zone: 'Escolha seu bairro ou digite um código postal de 5 dígitos.',
        email: 'Este endereço de e-mail não parece válido.',
        consent: 'Marque a caixa para podermos te avisar.',
        generic: 'Algo deu errado. Tente de novo em instantes.',
        busy: 'Pedidos demais ao mesmo tempo. Espere um minuto e tente de novo.',
      },
    },
  },
  nl: {
    quiz: {
      meta: { title: 'Welke minimoa ben jij? — Minimoa', description: '7 situaties, 60 seconden, geen account. Ontdek je minimoa en daag je vrienden uit.', ogAlt: 'De vier minimoa’s naast de titel „Welke minimoa ben jij?”' },
      intro: {
        kicker: 'De quiz',
        title: ['WELKE', 'MINIMOA', 'BEN JIJ?'],
        text: 'Zeven situaties uit het dagelijks leven, met vrienden. Antwoord zonder na te denken: je minimoa komt aan het eind.',
        start: 'Starten',
        facts: '60 seconden · geen account · er wordt niets over jou bewaard',
      },
      progress: '{n} / {total}',
      back: 'Terug',
      computing: 'Je minimoa komt eraan…',
      result: {
        kicker: 'Je minimoa',
        species: 'Het is {name}.',
        story: 'Delen in je story',
        copy: 'Link kopiëren',
        copied: 'Link gekopieerd ✓',
        challenge: 'Daag je vrienden uit',
        challengeText: 'Mijn minimoa is {word}. Welke minimoa ben jij?',
        shareText: 'Mijn minimoa is {word}.',
        saved: 'Afbeelding opgeslagen: zet hem in je story.',
        cardAlt: 'Je storykaart: {name}, {word}',
        keepTitle: 'Bewaar je minimoa',
        keepText: 'Installeer Minimoa en typ deze code in „Heb je een code?”: je minimoa wacht op je, al ingesteld.',
        open: 'Ik heb Minimoa al',
        codeLabel: 'Je code',
        again: 'Quiz opnieuw doen',
        cardKicker: 'Welke minimoa ben jij?',
        cardCallout: 'En jij? Doe de quiz:',
      },
      shared: { kicker: 'De quiz', title: ['EN JIJ,', 'WELKE MINIMOA', 'BEN JIJ?'], text: 'Iemand stuurde je zijn resultaat. 60 seconden om het jouwe te kennen.', cta: 'Doe de quiz' },
      error: 'Minimoa is niet bereikbaar. Controleer je verbinding en probeer opnieuw.',
      notFound: 'Dit resultaat bestaat niet (meer). Doe de quiz!',
    },
    quartier: {
      meta: { title: 'Open je buurt — Minimoa', description: 'Minimoa gaat buurt per buurt open. Meld je aan, nodig je buren uit: bij 50 gaat je buurt open.', ogAlt: 'Drie minimoa’s op een heuvel, naast de titel „Je buurt gaat open bij 50.”' },
      label: 'Open je buurt',
      title: 'Je buurt gaat open bij {n}.',
      text: 'Minimoa gaat buurt per buurt open, zodat je minimoa echt mensen heeft om je aan voor te stellen. Meld je aan: we laten het je weten bij de opening.',
      city: 'Stad',
      cityPick: 'Kies je stad',
      zone: 'Buurt',
      postal: 'Postal code',
      postalHint: 'Staat je stad er niet bij? Typ je Franse postcode.',
      or: 'of',
      email: 'Je e-mail',
      emailPlaceholder: 'jij@voorbeeld.nl',
      consent: 'Ik ga ermee akkoord dat Minimoa mijn e-mail en buurt bewaart om me te laten weten wanneer die opengaat (hooguit twee e-mails). Met één klik afmelden.',
      privacy: 'Privacybeleid',
      submit: 'Laat het me weten',
      sending: 'Versturen…',
      counter: '{count} / {threshold} om {zone} te openen',
      counterOpen: '{zone} is open',
      sentTitle: 'Check je inbox.',
      sentText: 'Er is een bevestigingslink onderweg. Je telt mee in de buurt zodra je hebt bevestigd.',
      inviteTitle: 'Nodig je buren uit',
      inviteText: 'Iedereen die zich aanmeldt met jouw link brengt je buurt verder. De eerste 3 die uitnodigen krijgen de oprichtersmedaille bij de opening.',
      inviteShare: 'Uitnodigen',
      inviteMessage: 'Nog {missing} mensen nodig om Minimoa te openen in {zone}. Meld je aan:',
      copy: 'Link kopiëren',
      copied: 'Link gekopieerd ✓',
      openTitle: 'Het is open!',
      openText: 'Installeer Minimoa: je minimoa stelt je voor aan mensen bij jou in de buurt.',
      openApp: 'Ik heb Minimoa al',
      codeHelp: 'Typ deze code in „Heb je een code?” bij het aanmelden: hij bewaart je buurt.',
      confirmTitle: 'Bevestigd.',
      confirmText: 'Je telt mee in je buurt. Nodig je buren uit zodat hij sneller opengaat.',
      confirmFail: 'Deze link werkt niet meer. Meld je opnieuw aan, het duurt tien seconden.',
      unsubTitle: 'Klaar.',
      unsubText: 'Je adres is gewist. Je ontvangt niets meer van deze lijst.',
      errors: {
        zone: 'Kies je buurt, of typ een postcode van 5 cijfers.',
        email: 'Dit e-mailadres lijkt niet geldig.',
        consent: 'Vink het vakje aan zodat we je kunnen laten weten.',
        generic: 'Er ging iets mis. Probeer het zo opnieuw.',
        busy: 'Te veel verzoeken tegelijk. Wacht een minuut en probeer opnieuw.',
      },
    },
  },
};


/** Nom des espèces (les mêmes dans toutes les langues). */
export const SPECIES_NAMES = { nino: 'Nino', suzie: 'Suzie', gaston: 'Gaston', pia: 'Pia' } as const;
