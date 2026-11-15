import type { LegalUi } from '../types';

export const ui: LegalUi = {
  skip: 'aller au contenu',
  download: 'télécharger',
  updated: 'Dernière mise à jour :',
  languageLabel: 'Langue',
  tocLabel: 'Sommaire',
  otherDocs: 'Les autres documents',
  footerLabel: 'liens légaux',
  footerLinks: [
    { slug: 'assistance', label: 'aide' },
    { slug: 'mentions-legales', label: 'mentions légales' },
    { slug: 'conditions', label: 'conditions' },
    { slug: 'confidentialite', label: 'confidentialité' },
    { slug: 'index', label: 'tout le légal' },
  ],
  index: {
    title: 'Informations légales — Blowy',
    heading: 'Informations légales',
    description: 'Tous les documents légaux de Blowy : mentions légales, conditions, confidentialité, Blowy+, règles, cookies, sécurité, suppression du compte, assistance.',
    intro: 'Tout ce qui encadre Blowy, au même endroit. La version française fait foi.',
    publisherTitle: 'Qui édite Blowy',
    publisherText:
      'Blowy est édité par **{{publisher.name}}**. Les détails (forme, immatriculation, adresse, hébergeurs) sont dans les [mentions légales](@mentions-legales). Pour nous écrire : {{email.support}}.',
  },
  short: {
    'mentions-legales': 'Mentions légales',
    conditions: "Conditions d'utilisation",
    confidentialite: 'Confidentialité',
    abonnement: 'Abonnement Blowy+',
    regles: 'Règles de la communauté',
    cookies: 'Cookies',
    securite: 'Sécurité et signalement',
    'supprimer-mon-compte': 'Supprimer mon compte',
    assistance: 'Assistance',
  },
};
