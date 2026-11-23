/**
 * Textes de l’IA tierce (App Review 5.1.2(i), audit B5) : l’écran Moi › L’IA et toi (lecture des chats, vérifications de sécurité). Le prestataire (nom, pays) vient de
 * l’API (`GET /v1/me/ai`) : il n’est jamais écrit en dur ici.
 */
import type { TitleSegment } from '@blowy/ui';

import { messages } from './runtime';

export const ia = messages({
  fr: {
    /** Moi › L’IA et toi : chaque usage de l’IA tierce, et l’accord qu’on peut retirer. */
    screen: {
      title: [{ text: 'L’IA\n' }, { text: 'ET TOI', dim: true }] as TitleSegment[],
      back: 'Retour',
      lead: (provider: string, country: string): string =>
        `Certaines fonctions passent par une IA de ${provider} (${country}), notre prestataire.`,
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
      policy: 'Politique de confidentialité',
      loadError: 'Impossible de charger tes accords.',
      retry: 'Réessayer',
    },
      },
  en: {
    screen: {
      title: [{ text: 'AI\n' }, { text: 'AND YOU', dim: true }] as TitleSegment[],
      back: 'Back',
      lead: (provider: string, country: string): string =>
        `Some features use an AI from ${provider} (${country}), our provider.`,
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
      policy: 'Privacy policy',
      loadError: 'Couldn’t load your consents.',
      retry: 'Try again',
    },
  },
  es: {
    screen: {
      title: [{ text: 'LA IA\n' }, { text: 'Y TÚ', dim: true }] as TitleSegment[],
      back: 'Atrás',
      lead: (provider: string, country: string): string =>
        `Algunas funciones pasan por una IA de ${provider} (${country}), nuestro proveedor.`,
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
      policy: 'Política de privacidad',
      loadError: 'No se pudieron cargar tus consentimientos.',
      retry: 'Reintentar',
    },
  },
  pt: {
    screen: {
      title: [{ text: 'A IA\n' }, { text: 'E VOCÊ', dim: true }] as TitleSegment[],
      back: 'Voltar',
      lead: (provider: string, country: string): string =>
        `Algumas funções passam por uma IA da ${provider} (${country}), nosso fornecedor.`,
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
      policy: 'Política de privacidade',
      loadError: 'Não foi possível carregar seus consentimentos.',
      retry: 'Tentar de novo',
    },
  },
  nl: {
    screen: {
      title: [{ text: 'AI\n' }, { text: 'EN JIJ', dim: true }] as TitleSegment[],
      back: 'Terug',
      lead: (provider: string, country: string): string =>
        `Sommige functies gebruiken een AI van ${provider} (${country}), onze leverancier.`,
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
      policy: 'Privacybeleid',
      loadError: 'Je toestemmingen konden niet worden geladen.',
      retry: 'Opnieuw',
    },
  },
});
