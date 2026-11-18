import type { LegalPage } from '../types';

export const mentionsLegales: LegalPage = {
  title: 'Legal notice — Minimoa',
  heading: 'Legal notice',
  description: 'Who publishes Minimoa, who hosts it and how to reach us.',
  intro: 'Who publishes the Minimoa app and website, who hosts them, and how to reach us.',
  body: [
    { h2: 'Publisher', id: 'editeur' },
    { p: 'The minimoa.app website and the Minimoa app are published by:' },
    {
      ul: [
        '**Company name:** {{publisher.name}}',
        '**Legal form:** {{publisher.legalForm}}',
        '**Share capital:** {{publisher.shareCapital}}',
        '**Registration (SIREN, RCS):** {{publisher.registration}}',
        '**EU VAT number:** {{publisher.vatNumber}}',
        '**Registered office:** {{publisher.address}}',
        '**Phone:** {{publisher.phone}}',
        '**Email:** {{email.support}}',
      ],
    },
    { h2: 'Publication director', id: 'publication' },
    { p: '{{publisher.publicationDirector}}' },
    { h2: 'Hosting', id: 'hebergement' },
    { h3: 'The minimoa.app website' },
    { ul: ['**Host:** {{siteHost.name}}', '**Address:** {{siteHost.address}}', '**Phone:** {{siteHost.phone}}'] },
    { h3: 'App data' },
    {
      ul: [
        '**Host:** {{dataHost.name}}',
        '**Address:** {{dataHost.address}}',
        '**Contact:** {{dataHost.contact}}',
        '**Server location:** {{dataHost.region}}',
      ],
    },
    { p: 'The full list of our service providers is in the [privacy policy](@confidentialite#prestataires).' },
    { h2: 'Contact us', id: 'contact' },
    {
      ul: [
        'Help, questions, complaints: {{email.support}}.',
        'Personal data: {{email.privacy}}.',
        'Safety and illegal content: {{email.safety}}, or the report button in the app.',
      ],
    },
    {
      p: '{{email.support}} is also our single point of contact for authorities and users under the EU Digital Services Act (DSA). We answer in French or English.',
    },
    { h2: 'Report illegal content', id: 'signaler' },
    {
      p: 'In the app, report the message or the person: it is the fastest way (see [safety and reporting](@securite)). You can also write to {{email.safety}}, saying what the problem is, where it is, and why you think it is illegal.',
    },
    { h2: 'Intellectual property', id: 'propriete' },
    {
      p: 'The Minimoa brand, the minimoas, illustrations, texts, animations and software are protected by intellectual property law. They belong to {{publisher.name}} or its partners. Copying or reusing them without permission is forbidden, except where the law allows it (short quotation, private copy).',
    },
    { p: 'Website font, also used in its images: Allo (Josh Puckett), under the SIL Open Font License. Home page animations: the GSAP library.' },
  ],
};
