/** Textes partagés par plusieurs écrans (tutoiement, minuscules, ton joueur). */
import type { Species } from '@blowy/domain';

export const common = {
  back: 'retour',
  close: 'fermer',
  retry: 'réessayer',
  cancel: 'annuler',
  loading: 'chargement…',
  errorTitle: 'oups',
  genericError: 'quelque chose a coincé. réessaie dans un instant.',
  offlineTitle: 'pas de réseau',
  offlineText: 'on n’arrive pas à joindre blowy. vérifie ta connexion, ton pet t’attend.',
  copied: 'copié ✓',
  speciesNames: { nino: 'Nino', suzie: 'Suzie', gaston: 'Gaston', pia: 'Pia' } satisfies Record<Species, string>,
  gate: {
    sleeping: 'ton pet se réveille…',
  },
  notFound: {
    title: [{ text: 'PERDU\n' }, { text: 'DANS LA NUIT.', dim: true }],
    text: 'cette page n’existe pas. ton pet non plus ne sait pas où on est.',
    action: 'rentrer à la maison',
  },
  invite: {
    kicker: 'invitation',
    title: (name: string, pet: string) => [{ text: `${name.toUpperCase()} ET ${pet.toUpperCase()}\n` }, { text: 'T’INVITENT.', dim: true }],
    text: (pet: string) => `${pet.toLowerCase()} veut rencontrer ton pet. si tu acceptes, vous avez un lien : 7 vies, des photos du jour et deux pets qui papotent.`,
    speech: (pet: string) => `on s’est déjà croisés, non ? moi c’est ${pet.toLowerCase()}`,
    accept: 'accepter',
    later: 'pas maintenant',
    notFoundTitle: [{ text: 'INVITATION\n' }, { text: 'INTROUVABLE.', dim: true }],
    notFoundText: 'ce lien d’invitation n’existe pas ou plus. demande-lui de te renvoyer le sien.',
    ownTitle: [{ text: 'C’EST\n' }, { text: 'TON CODE.', dim: true }],
    ownText: 'tu ne peux pas t’inviter toi-même. partage-le plutôt à tes potes.',
    blocked: 'impossible de créer ce lien.',
    home: 'retour à l’accueil',
    already: 'si vous êtes déjà liés, on t’ouvre votre lien.',
  },
} as const;
