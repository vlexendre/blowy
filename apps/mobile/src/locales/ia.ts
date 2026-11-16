/**
 * Textes de l’IA tierce (App Review 5.1.2(i), audit B5) : l’accord avant la première preuve vérifiée par une IA, la
 * preuve sans IA, et l’écran Moi › L’IA et toi qui montre et retire chaque accord. Le prestataire (nom, pays) vient de
 * l’API (`GET /v1/me/ai`) : il n’est jamais écrit en dur ici.
 */
import type { TitleSegment } from '@blowy/ui';

import { formatDate, messages } from './runtime';

export const ia = messages({
  fr: {
    /** Feuille d’accord, une seule fois, avant la première preuve envoyée à l’IA. */
    consent: {
      title: [{ text: 'UNE IA POUR\n' }, { text: 'TES PREUVES ?', dim: true }] as TitleSegment[],
      subtitle: (provider: string): string => `Avant ta première photo : ce qui part chez ${provider}, et pourquoi.`,
      sent: { label: 'Ce qui part', text: 'Ta photo, réduite, et le nom de l’habitude. Ni ton prénom, ni ta position.' },
      to: {
        label: 'À qui',
        text: (provider: string, country: string): string => `${provider} (${country}), notre prestataire d’IA, la vérifie pour nous. Aucun humain ne la regarde.`,
      },
      why: { label: 'Pourquoi', text: 'Vérifier qu’elle montre bien ton habitude, pour que ta série avance.' },
      kept: { label: 'Combien de temps', text: 'Chez Minimoa, la photo est supprimée sous 24 h, sauf si tu la gardes dans tes souvenirs privés.' },
      without: {
        label: 'Sans IA',
        text: 'Tu valides toi-même, sans photo, et ta série avance pareil. Tu peux changer d’avis dans Moi › L’IA et toi.',
      },
      accept: 'Oui, vérifier par une IA',
      refuse: 'Sans vérification par IA',
      policy: 'Politique de confidentialité',
      error: 'Ton choix n’est pas enregistré. Réessaie.',
      loadError: 'Impossible de charger cette page.',
    },
    /** Preuve sans IA : la personne dit que c’est fait, sans photo. */
    noAi: {
      title: [{ text: 'SUR\n' }, { text: 'PAROLE.', dim: true }] as TitleSegment[],
      text: 'Sans vérification par IA : pas de photo, tu dis que c’est fait. Ton minimoa te croit.',
      privacy: 'Rien n’est envoyé à une IA. Tu peux l’activer dans Moi › L’IA et toi.',
      done: 'C’est fait',
      enable: 'Vérifier par une IA plutôt',
      doneTitle: 'COMPTÉ !',
    },
    /** Moi › L’IA et toi : chaque usage de l’IA tierce, et l’accord qu’on peut retirer. */
    screen: {
      title: [{ text: 'L’IA\n' }, { text: 'ET TOI', dim: true }] as TitleSegment[],
      back: 'Retour',
      lead: (provider: string, country: string): string =>
        `Certaines fonctions passent par une IA de ${provider} (${country}), notre prestataire.`,
      proofs: {
        title: 'Vérifier mes preuves par une IA',
        on: (date: string): string => `Activé le ${date}. Ta photo réduite et le nom de l’habitude lui sont envoyés.`,
        off: 'Désactivé. Tu valides tes habitudes toi-même, sans photo.',
        never: 'Pas encore choisi. On te demandera avant ta première preuve.',
        footer: 'Retirer ton accord est immédiat : les preuves suivantes ne partent plus. Supprimées sous 24 h chez Minimoa, sauf celles que tu gardes.',
      },
      chats: {
        title: 'Minimoas dans tes chats',
        footer: 'Une IA lit vos derniers messages seulement si vous l’avez activé l’un et l’autre. Tu le retires chat par chat ou partout d’un coup.',
      },
      /** Vérifications de sécurité : photo de profil (toujours) et message qui laisse un doute (si vous avez accepté la lecture tous les deux). */
      safety: {
        title: 'Photo de profil et messages douteux',
        subtitle: 'Toujours active',
        footer: (provider: string): string =>
          `Chaque photo de profil est vérifiée par ${provider} avant d’être montrée (nudité, personne qui semble mineure, violence, haine, pub) ; une photo refusée est effacée. Dans un chat où vous avez accepté tous les deux la lecture par une IA, un message qui laisse un doute (un lien, par exemple) peut aussi lui être envoyé, après l’envoi, pour vérifier qu’il respecte les règles. Ça ne se coupe pas, parce que ça protège tout le monde. Sans photo de profil, aucune photo ne part.`,
      },
      review: {
        title: 'Bilan reformulé par une IA',
        footer: 'Pour les semaines actives, une IA réécrit ton bilan. Elle ne reçoit que des chiffres et des phrases générales : jamais le prénom de tes liens ni le nom de ton minimoa. Rien à accepter.',
      },
      policy: 'Politique de confidentialité',
      error: 'Ton choix n’est pas enregistré. Réessaie.',
      loadError: 'Impossible de charger tes accords.',
      retry: 'Réessayer',
    },
    /** Date d’un accord (« 15 novembre 2026 »). */
    date: (iso: string): string => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' }),
  },
  en: {
    consent: {
      title: [{ text: 'AN AI FOR\n' }, { text: 'YOUR PROOFS?', dim: true }] as TitleSegment[],
      subtitle: (provider: string): string => `Before your first photo: what goes to ${provider}, and why.`,
      sent: { label: 'What is sent', text: 'Your photo, downsized, and the name of the habit. Not your first name, not your location.' },
      to: {
        label: 'To whom',
        text: (provider: string, country: string): string => `${provider} (${country}), our AI provider, checks it for us. No human looks at it.`,
      },
      why: { label: 'Why', text: 'To check that it really shows your habit, so your streak moves forward.' },
      kept: { label: 'How long', text: 'At Minimoa, the photo is deleted within 24 hours, unless you keep it in your private memories.' },
      without: {
        label: 'Without AI',
        text: 'You confirm it yourself, without a photo, and your streak moves forward just the same. You can change your mind in Me › AI and you.',
      },
      accept: 'Yes, check with AI',
      refuse: 'No AI check',
      policy: 'Privacy policy',
      error: 'Your choice wasn’t saved. Try again.',
      loadError: 'Couldn’t load this page.',
    },
    noAi: {
      title: [{ text: 'ON YOUR\n' }, { text: 'WORD.', dim: true }] as TitleSegment[],
      text: 'No AI check: no photo, you say it’s done. Your minimoa believes you.',
      privacy: 'Nothing is sent to an AI. You can turn it on in Me › AI and you.',
      done: 'Done',
      enable: 'Check with AI instead',
      doneTitle: 'COUNTED!',
    },
    screen: {
      title: [{ text: 'AI\n' }, { text: 'AND YOU', dim: true }] as TitleSegment[],
      back: 'Back',
      lead: (provider: string, country: string): string =>
        `Some features use an AI from ${provider} (${country}), our provider.`,
      proofs: {
        title: 'Check my proofs with AI',
        on: (date: string): string => `On since ${date}. Your downsized photo and the name of the habit are sent to it.`,
        off: 'Off. You confirm your habits yourself, without a photo.',
        never: 'Not chosen yet. We’ll ask you before your first proof.',
        footer: 'Withdrawing your consent takes effect immediately: later proofs are no longer sent. Deleted within 24 hours at Minimoa, except the ones you keep.',
      },
      chats: {
        title: 'Minimoas in your chats',
        footer: 'An AI reads your latest messages only if both of you have turned it on. You can withdraw it chat by chat or everywhere at once.',
      },
      safety: {
        title: 'Profile photo and doubtful messages',
        subtitle: 'Always on',
        footer: (provider: string): string =>
          `Every profile photo is checked by ${provider} before it is shown (nudity, someone who looks underage, violence, hate, ads); a rejected photo is deleted. In a chat where you have both agreed to AI reading, a message that raises a doubt (a link, for example) may also be sent to it, after it is sent, to check that it follows the rules. This can’t be turned off, because it protects everyone. Without a profile photo, no photo is sent.`,
      },
      review: {
        title: 'Weekly review rewritten by AI',
        footer: 'For active weeks, an AI rewrites your review. It only receives numbers and general sentences: never the first names of your links or the name of your minimoa. Nothing to accept.',
      },
      policy: 'Privacy policy',
      error: 'Your choice wasn’t saved. Try again.',
      loadError: 'Couldn’t load your consents.',
      retry: 'Try again',
    },
    date: (iso: string): string => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' }),
  },
  es: {
    consent: {
      title: [{ text: '¿UNA IA PARA\n' }, { text: 'TUS PRUEBAS?', dim: true }] as TitleSegment[],
      subtitle: (provider: string): string => `Antes de tu primera foto: qué se envía a ${provider}, y por qué.`,
      sent: { label: 'Qué se envía', text: 'Tu foto, reducida, y el nombre del hábito. Ni tu nombre ni tu ubicación.' },
      to: {
        label: 'A quién',
        text: (provider: string, country: string): string => `${provider} (${country}), nuestro proveedor de IA, la revisa por nosotros. Ningún humano la mira.`,
      },
      why: { label: 'Por qué', text: 'Comprobar que muestra de verdad tu hábito, para que tu racha avance.' },
      kept: { label: 'Cuánto tiempo', text: 'En Minimoa, la foto se elimina en menos de 24 h, salvo que la guardes en tus recuerdos privados.' },
      without: {
        label: 'Sin IA',
        text: 'Lo validas tú, sin foto, y tu racha avanza igual. Puedes cambiar de opinión en Yo › La IA y tú.',
      },
      accept: 'Sí, revisar con IA',
      refuse: 'Sin revisión por IA',
      policy: 'Política de privacidad',
      error: 'Tu elección no se ha guardado. Inténtalo de nuevo.',
      loadError: 'No se pudo cargar esta página.',
    },
    noAi: {
      title: [{ text: 'PALABRA\n' }, { text: 'DE HONOR.', dim: true }] as TitleSegment[],
      text: 'Sin revisión por IA: sin foto, dices que está hecho. Tu minimoa te cree.',
      privacy: 'No se envía nada a una IA. Puedes activarla en Yo › La IA y tú.',
      done: 'Hecho',
      enable: 'Mejor revisar con IA',
      doneTitle: '¡CONTADO!',
    },
    screen: {
      title: [{ text: 'LA IA\n' }, { text: 'Y TÚ', dim: true }] as TitleSegment[],
      back: 'Atrás',
      lead: (provider: string, country: string): string =>
        `Algunas funciones pasan por una IA de ${provider} (${country}), nuestro proveedor.`,
      proofs: {
        title: 'Revisar mis pruebas con IA',
        on: (date: string): string => `Activado el ${date}. Se le envían tu foto reducida y el nombre del hábito.`,
        off: 'Desactivado. Validas tus hábitos tú, sin foto.',
        never: 'Aún sin elegir. Te preguntaremos antes de tu primera prueba.',
        footer: 'Retirar tu consentimiento es inmediato: las pruebas siguientes ya no se envían. Se eliminan en menos de 24 h en Minimoa, salvo las que guardes.',
      },
      chats: {
        title: 'Minimoas en tus chats',
        footer: 'Una IA lee sus últimos mensajes solo si ambas partes lo han activado. Puedes retirarlo chat por chat o en todos a la vez.',
      },
      safety: {
        title: 'Foto de perfil y mensajes dudosos',
        subtitle: 'Siempre activo',
        footer: (provider: string): string =>
          `Cada foto de perfil la revisa ${provider} antes de mostrarse (desnudos, personas que parezcan menores, violencia, odio, publicidad); una foto rechazada se borra. En un chat en el que ambas partes han aceptado la lectura por una IA, un mensaje que genere dudas (un enlace, por ejemplo) también puede enviársele, después de enviarse, para comprobar que respeta las normas. No se puede desactivar, porque protege a todo el mundo. Sin foto de perfil, no se envía ninguna foto.`,
      },
      review: {
        title: 'Resumen reescrito por una IA',
        footer: 'En las semanas con actividad, una IA reescribe tu resumen. Solo recibe cifras y frases generales: nunca el nombre de las personas de tus vínculos ni el de tu minimoa. Nada que aceptar.',
      },
      policy: 'Política de privacidad',
      error: 'Tu elección no se ha guardado. Inténtalo de nuevo.',
      loadError: 'No se pudieron cargar tus consentimientos.',
      retry: 'Reintentar',
    },
    date: (iso: string): string => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' }),
  },
  pt: {
    consent: {
      title: [{ text: 'UMA IA PARA\n' }, { text: 'SUAS PROVAS?', dim: true }] as TitleSegment[],
      subtitle: (provider: string): string => `Antes da sua primeira foto: o que vai para ${provider}, e por quê.`,
      sent: { label: 'O que é enviado', text: 'Sua foto, reduzida, e o nome do hábito. Nem seu nome, nem sua localização.' },
      to: {
        label: 'Para quem',
        text: (provider: string, country: string): string => `${provider} (${country}), nosso fornecedor de IA, faz a verificação para nós. Nenhum humano olha a foto.`,
      },
      why: { label: 'Por quê', text: 'Verificar se ela mostra mesmo o seu hábito, para sua sequência avançar.' },
      kept: { label: 'Por quanto tempo', text: 'No Minimoa, a foto é excluída em até 24 h, a não ser que você a guarde nas suas lembranças privadas.' },
      without: {
        label: 'Sem IA',
        text: 'Você confirma por conta própria, sem foto, e sua sequência avança do mesmo jeito. Você pode mudar de ideia em Eu › A IA e você.',
      },
      accept: 'Sim, verificar com IA',
      refuse: 'Sem verificação por IA',
      policy: 'Política de privacidade',
      error: 'Sua escolha não foi salva. Tente de novo.',
      loadError: 'Não foi possível carregar esta página.',
    },
    noAi: {
      title: [{ text: 'PALAVRA\n' }, { text: 'DADA.', dim: true }] as TitleSegment[],
      text: 'Sem verificação por IA: sem foto, você diz que fez. Seu minimoa acredita em você.',
      privacy: 'Nada é enviado a uma IA. Você pode ativar em Eu › A IA e você.',
      done: 'Feito',
      enable: 'Prefiro verificar com IA',
      doneTitle: 'CONTOU!',
    },
    screen: {
      title: [{ text: 'A IA\n' }, { text: 'E VOCÊ', dim: true }] as TitleSegment[],
      back: 'Voltar',
      lead: (provider: string, country: string): string =>
        `Algumas funções passam por uma IA da ${provider} (${country}), nosso fornecedor.`,
      proofs: {
        title: 'Verificar minhas provas com IA',
        on: (date: string): string => `Ativado em ${date}. Sua foto reduzida e o nome do hábito são enviados a ela.`,
        off: 'Desativado. Você confirma seus hábitos por conta própria, sem foto.',
        never: 'Ainda não escolhido. Vamos perguntar antes da sua primeira prova.',
        footer: 'Retirar seu consentimento vale na hora: as próximas provas não são mais enviadas. Excluídas em até 24 h no Minimoa, exceto as que você guardar.',
      },
      chats: {
        title: 'Minimoas nos seus chats',
        footer: 'Uma IA lê as últimas mensagens de vocês só se as duas partes tiverem ativado. Você pode retirar chat por chat ou em todos de uma vez.',
      },
      safety: {
        title: 'Foto de perfil e mensagens suspeitas',
        subtitle: 'Sempre ativa',
        footer: (provider: string): string =>
          `Cada foto de perfil é verificada por ${provider} antes de ser exibida (nudez, pessoa que pareça menor de idade, violência, ódio, propaganda); uma foto recusada é apagada. Num chat em que as duas partes aceitaram a leitura por uma IA, uma mensagem que levante dúvida (um link, por exemplo) também pode ser enviada a ela, depois do envio, para verificar se respeita as regras. Isso não pode ser desativado, porque protege todo mundo. Sem foto de perfil, nenhuma foto é enviada.`,
      },
      review: {
        title: 'Resumo reescrito por uma IA',
        footer: 'Nas semanas com atividade, uma IA reescreve seu resumo. Ela só recebe números e frases gerais: nunca o nome das pessoas dos seus vínculos nem o do seu minimoa. Nada para aceitar.',
      },
      policy: 'Política de privacidade',
      error: 'Sua escolha não foi salva. Tente de novo.',
      loadError: 'Não foi possível carregar seus consentimentos.',
      retry: 'Tentar de novo',
    },
    date: (iso: string): string => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' }),
  },
  nl: {
    consent: {
      title: [{ text: 'EEN AI VOOR\n' }, { text: 'JE BEWIJZEN?', dim: true }] as TitleSegment[],
      subtitle: (provider: string): string => `Voor je eerste foto: wat er naar ${provider} gaat, en waarom.`,
      sent: { label: 'Wat er wordt verstuurd', text: 'Je foto, verkleind, en de naam van de gewoonte. Niet je voornaam, niet je locatie.' },
      to: {
        label: 'Naar wie',
        text: (provider: string, country: string): string => `${provider} (${country}), onze AI-leverancier, controleert hem voor ons. Geen mens kijkt ernaar.`,
      },
      why: { label: 'Waarom', text: 'Om te controleren of hij echt je gewoonte laat zien, zodat je reeks doorloopt.' },
      kept: { label: 'Hoelang', text: 'Bij Minimoa wordt de foto binnen 24 uur verwijderd, tenzij je hem bewaart in je privéherinneringen.' },
      without: {
        label: 'Zonder AI',
        text: 'Je bevestigt het zelf, zonder foto, en je reeks loopt net zo goed door. Je kunt van gedachten veranderen onder Ik › AI en jij.',
      },
      accept: 'Ja, laat AI controleren',
      refuse: 'Zonder AI-controle',
      policy: 'Privacybeleid',
      error: 'Je keuze is niet opgeslagen. Probeer het opnieuw.',
      loadError: 'Deze pagina kon niet worden geladen.',
    },
    noAi: {
      title: [{ text: 'OP JE\n' }, { text: 'WOORD.', dim: true }] as TitleSegment[],
      text: 'Zonder AI-controle: geen foto, je zegt dat het gedaan is. Je minimoa gelooft je.',
      privacy: 'Er wordt niets naar een AI gestuurd. Je kunt het aanzetten onder Ik › AI en jij.',
      done: 'Gedaan',
      enable: 'Toch liever AI laten controleren',
      doneTitle: 'GETELD!',
    },
    screen: {
      title: [{ text: 'AI\n' }, { text: 'EN JIJ', dim: true }] as TitleSegment[],
      back: 'Terug',
      lead: (provider: string, country: string): string =>
        `Sommige functies gebruiken een AI van ${provider} (${country}), onze leverancier.`,
      proofs: {
        title: 'Mijn bewijzen door AI laten controleren',
        on: (date: string): string => `Aangezet op ${date}. Je verkleinde foto en de naam van de gewoonte worden ernaartoe gestuurd.`,
        off: 'Uit. Je bevestigt je gewoontes zelf, zonder foto.',
        never: 'Nog niet gekozen. We vragen het je voor je eerste bewijs.',
        footer: 'Je toestemming intrekken werkt meteen: volgende bewijzen worden niet meer verstuurd. Binnen 24 uur verwijderd bij Minimoa, behalve de bewijzen die je bewaart.',
      },
      chats: {
        title: 'Minimoas in je chats',
        footer: 'Een AI leest jullie laatste berichten alleen als jullie het allebei hebben aangezet. Je trekt het in per chat of overal tegelijk.',
      },
      safety: {
        title: 'Profielfoto en twijfelachtige berichten',
        subtitle: 'Altijd aan',
        footer: (provider: string): string =>
          `Elke profielfoto wordt door ${provider} gecontroleerd voordat hij wordt getoond (naakt, iemand die minderjarig lijkt, geweld, haat, reclame); een geweigerde foto wordt gewist. In een chat waarin jullie allebei akkoord zijn gegaan met meelezen door een AI, kan een bericht dat twijfel oproept (een link, bijvoorbeeld) na verzending ook naar die AI worden gestuurd, om te controleren of het de regels naleeft. Dit kan niet uit, omdat het iedereen beschermt. Zonder profielfoto wordt er geen foto verstuurd.`,
      },
      review: {
        title: 'Weekoverzicht herschreven door een AI',
        footer: 'In actieve weken herschrijft een AI je overzicht. Die krijgt alleen cijfers en algemene zinnen: nooit de voornamen van je banden of de naam van je minimoa. Niets om mee akkoord te gaan.',
      },
      policy: 'Privacybeleid',
      error: 'Je keuze is niet opgeslagen. Probeer het opnieuw.',
      loadError: 'Je toestemmingen konden niet worden geladen.',
      retry: 'Opnieuw',
    },
    date: (iso: string): string => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' }),
  },
});
