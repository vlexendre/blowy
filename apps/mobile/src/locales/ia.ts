/**
 * Textes de l’IA tierce (App Review 5.1.2(i), audit B5) : l’accord avant la première preuve vérifiée par une IA, la
 * preuve sans IA, et l’écran Moi › L’IA et toi qui montre et retire chaque accord. Le prestataire (nom, pays) vient de
 * l’API (`GET /v1/me/ai`) : il n’est jamais écrit en dur ici.
 */
import { TODO } from '@blowy/content';
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
      kept: { label: 'Combien de temps', text: 'Chez Blowy, la photo est supprimée sous 24 h, sauf si tu la gardes dans tes souvenirs privés.' },
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
        `Certaines fonctions passent par une IA fournie par ${provider} (${country}), notre prestataire. Voici ce qu’elle voit, et ce que tu as accepté.`,
      sections: { proofs: 'Preuves d’habitude', chats: 'Lecture des chats', safety: 'Vérifications de sécurité', review: 'Bilan de la semaine' },
      proofs: {
        title: 'Vérifier mes preuves par une IA',
        on: (date: string): string => `Activé le ${date}. Ta photo réduite et le nom de l’habitude lui sont envoyés.`,
        off: 'Désactivé. Tu valides tes habitudes toi-même, sans photo.',
        never: 'Pas encore choisi. On te demandera avant ta première preuve.',
        footer: 'Retirer ton accord est immédiat : les preuves suivantes ne partent plus. Supprimées sous 24 h chez Blowy, sauf celles que tu gardes.',
      },
      chats: {
        title: 'Minimoas dans tes chats',
        subtitle: 'Accord chat par chat, et pour les prochains',
        footer: 'Une IA lit vos derniers messages seulement si vous l’avez activé l’un et l’autre. Tu le retires chat par chat ou partout d’un coup.',
      },
      /** Vérifications de sécurité : photo de profil (toujours) et message qui laisse un doute (si vous avez accepté la lecture tous les deux). */
      safety: {
        title: 'Photo de profil et messages douteux',
        subtitle: 'Toujours active : elle protège tout le monde',
        footer: (provider: string): string =>
          `Chaque photo de profil est vérifiée par ${provider} avant d’être montrée (nudité, personne qui semble mineure, violence, haine, pub) ; une photo refusée est effacée. Dans un chat où vous avez accepté tous les deux la lecture par une IA, un message qui laisse un doute (un lien, par exemple) peut aussi lui être envoyé, après l’envoi, pour vérifier qu’il respecte les règles. Ça ne se coupe pas, parce que ça protège tout le monde. Sans photo de profil, aucune photo ne part.`,
      },
      review: {
        title: 'Reformulé par une IA',
        subtitle: 'Sans aucun prénom ni nom',
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
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
