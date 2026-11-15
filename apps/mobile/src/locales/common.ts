/** Textes partagés par plusieurs écrans. */
import { TODO } from '@blowy/content';
import type { Species } from '@blowy/domain';
import { messages } from './runtime';

export const common = messages({
  fr: {
    back: 'Retour',
    close: 'Fermer',
    retry: 'Réessayer',
    cancel: 'Annuler',
    loading: 'Chargement…',
    errorTitle: 'Oups',
    genericError: 'Quelque chose a coincé. Réessaie dans un instant.',
    offlineTitle: 'Pas de réseau',
    offlineText: 'Impossible de joindre Blowy. Vérifie ta connexion : ton minimoa t’attend.',
    copied: 'Copié ✓',
    speciesNames: { nino: 'Nino', suzie: 'Suzie', gaston: 'Gaston', pia: 'Pia' } satisfies Record<Species, string>,
    gate: {
      sleeping: 'Ton minimoa se réveille…',
    },
    notFound: {
      title: [{ text: 'PERDU\n' }, { text: 'DANS LA NUIT.', dim: true }],
      text: 'Cette page n’existe pas. Ton minimoa non plus ne sait pas où on est.',
      action: 'Rentrer à la maison',
    },
    invite: {
      kicker: 'Invitation',
      title: (name: string, pet: string) => [{ text: `${name.toUpperCase()} ET ${pet.toUpperCase()}\n` }, { text: 'T’INVITENT.', dim: true }],
      text: (pet: string) => `${pet} veut rencontrer ton minimoa. Si tu acceptes, vous avez un lien : 7 vies, une série à tenir en vous écrivant chaque jour, et deux minimoas qui papotent.`,
      speech: (pet: string) => `On s’est déjà croisés, non ? Moi, c’est ${pet}.`,
      accept: 'Accepter',
      later: 'Pas maintenant',
      notFoundTitle: [{ text: 'INVITATION\n' }, { text: 'INTROUVABLE.', dim: true }],
      notFoundText: 'Ce lien d’invitation n’existe pas, ou plus. Demande-lui de te renvoyer le sien.',
      ownTitle: [{ text: 'C’EST\n' }, { text: 'TON CODE.', dim: true }],
      ownText: 'Tu ne peux pas t’inviter toi-même. Partage-le plutôt à tes potes.',
      blocked: 'Impossible de créer ce lien.',
      home: 'Retour à l’accueil',
      already: 'Si vous êtes déjà liés, on t’ouvre votre lien.',
    },
    /** Erreurs de connexion et de réseau (adaptateurs d'auth et client de l'API). */
    errors: {
      network: 'Connexion impossible. Vérifie ton réseau.',
      unknown: 'Une erreur est survenue. Réessaie.',
      internal: 'Une erreur est survenue.',
      rateLimited: 'Trop de tentatives. Réessaie dans une minute.',
      invalidCode: 'Ce code n’est pas le bon, ou il a expiré.',
      invalidEmail: 'Cette adresse e-mail ne semble pas valide.',
    },
  } as const,
  en: {
    back: 'Back',
    close: 'Close',
    retry: 'Try again',
    cancel: 'Cancel',
    loading: 'Loading…',
    errorTitle: 'Oops',
    genericError: 'Something got stuck. Try again in a moment.',
    offlineTitle: 'No connection',
    offlineText: 'Can’t reach Blowy. Check your connection: your minimoa is waiting.',
    copied: 'Copied ✓',
    speciesNames: TODO,
    gate: { sleeping: 'Your minimoa is waking up…' },
    notFound: {
      title: [{ text: 'LOST\n' }, { text: 'IN THE NIGHT.', dim: true }],
      text: 'This page doesn’t exist. Your minimoa has no idea where we are either.',
      action: 'Go home',
    },
    invite: TODO,
    errors: {
      network: 'Can’t connect. Check your network.',
      unknown: 'Something went wrong. Try again.',
      internal: 'Something went wrong.',
      rateLimited: 'Too many attempts. Try again in a minute.',
      invalidCode: 'That code is wrong, or it has expired.',
      invalidEmail: 'That e-mail address doesn’t look right.',
    },
  },
  es: TODO,
  pt: TODO,
  nl: TODO,
});
