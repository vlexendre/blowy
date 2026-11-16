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
    title: 'Informations légales — Minimoa',
    heading: 'Informations légales',
    description: 'Tous les documents légaux de Minimoa : mentions légales, conditions, confidentialité, Minimoa+, règles, cookies, sécurité, suppression du compte, assistance.',
    intro: 'Tout ce qui encadre Minimoa, au même endroit. La version française fait foi.',
    publisherTitle: 'Qui édite Minimoa',
    publisherText:
      'Minimoa est édité par **{{publisher.name}}**. Les détails (forme, immatriculation, adresse, hébergeurs) sont dans les [mentions légales](@mentions-legales). Pour nous écrire : {{email.support}}.',
  },
  short: {
    'mentions-legales': 'Mentions légales',
    conditions: "Conditions d'utilisation",
    confidentialite: 'Confidentialité',
    abonnement: 'Abonnement Minimoa+',
    regles: 'Règles de la communauté',
    cookies: 'Cookies',
    securite: 'Sécurité et signalement',
    'supprimer-mon-compte': 'Supprimer mon compte',
    assistance: 'Assistance',
  },
};
