import type { LegalPage } from '../types';

export const mentionsLegales: LegalPage = {
  title: 'Mentions légales — Blowy',
  heading: 'Mentions légales',
  description: "Qui édite Blowy, qui l'héberge et comment nous joindre.",
  intro: "Qui édite l'application et le site Blowy, qui les héberge, et comment nous joindre.",
  body: [
    { h2: 'Éditeur', id: 'editeur' },
    { p: "Le site blowy.app et l'application Blowy sont édités par :" },
    {
      ul: [
        '**Dénomination :** {{publisher.name}}',
        '**Forme juridique :** {{publisher.legalForm}}',
        '**Capital social :** {{publisher.shareCapital}}',
        '**Immatriculation (SIREN, RCS) :** {{publisher.registration}}',
        '**TVA intracommunautaire :** {{publisher.vatNumber}}',
        '**Siège social :** {{publisher.address}}',
        '**Téléphone :** {{publisher.phone}}',
        '**E-mail :** {{email.support}}',
      ],
    },
    { h2: 'Directeur de la publication', id: 'publication' },
    { p: '{{publisher.publicationDirector}}' },
    { h2: 'Hébergement', id: 'hebergement' },
    { h3: 'Le site blowy.app' },
    { ul: ['**Hébergeur :** {{siteHost.name}}', '**Adresse :** {{siteHost.address}}', '**Téléphone :** {{siteHost.phone}}'] },
    { h3: "Les données de l'application" },
    {
      ul: [
        '**Hébergeur :** {{dataHost.name}}',
        '**Adresse :** {{dataHost.address}}',
        '**Téléphone :** {{dataHost.phone}}',
        '**Lieu des serveurs :** {{dataHost.region}}',
      ],
    },
    { p: 'La liste complète de nos prestataires est dans la [politique de confidentialité](@confidentialite#prestataires).' },
    { h2: 'Nous contacter', id: 'contact' },
    {
      ul: [
        'Assistance, questions, réclamations : {{email.support}}.',
        'Données personnelles : {{email.privacy}}.',
        'Sécurité et contenus illicites : {{email.safety}}, ou le signalement dans l’app.',
      ],
    },
    {
      p: "L'adresse {{email.support}} est aussi notre point de contact unique pour les autorités et pour les utilisateurs au sens du règlement européen sur les services numériques (DSA). On y répond en français ou en anglais.",
    },
    { h2: 'Signaler un contenu illicite', id: 'signaler' },
    {
      p: "Dans l'app, signale le message ou la personne : c'est le plus rapide (voir [sécurité et signalement](@securite)). Tu peux aussi écrire à {{email.safety}} en indiquant ce qui pose problème, où il se trouve, et pourquoi tu le juges illicite.",
    },
    { h2: 'Propriété intellectuelle', id: 'propriete' },
    {
      p: "La marque Blowy, les minimoas, les illustrations, les textes, les animations et le logiciel sont protégés par le droit de la propriété intellectuelle. Ils appartiennent à {{publisher.name}} ou à ses partenaires. Les reproduire ou les réutiliser sans autorisation est interdit, sauf ce que la loi permet (courte citation, copie privée).",
    },
    {
      p: 'Polices du site : Anton et Bricolage Grotesque, sous licence SIL Open Font License. Animations de la page d’accueil : bibliothèque GSAP.',
    },
  ],
};
