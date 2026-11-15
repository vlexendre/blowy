import type { LegalUi } from '../types';

export const ui: LegalUi = {
  skip: 'skip to content',
  download: 'download',
  updated: 'Last updated:',
  translationNotice: 'This is a translation. If it differs from the French version, the French version prevails.',
  frenchVersion: 'Read the French version',
  languageLabel: 'Language',
  tocLabel: 'Contents',
  otherDocs: 'Other documents',
  footerLabel: 'legal links',
  footerLinks: [
    { slug: 'assistance', label: 'help' },
    { slug: 'mentions-legales', label: 'legal notice' },
    { slug: 'conditions', label: 'terms' },
    { slug: 'confidentialite', label: 'privacy' },
    { slug: 'index', label: 'all legal' },
  ],
  index: {
    title: 'Legal information — Blowy',
    heading: 'Legal information',
    description: 'All of Blowy’s legal documents: legal notice, terms, privacy, Blowy+, community rules, cookies, safety, account deletion, help.',
    intro: 'Everything that governs Blowy, in one place. The French version prevails.',
    publisherTitle: 'Who publishes Blowy',
    publisherText:
      'Blowy is published by **{{publisher.name}}**. The details (legal form, registration, address, hosting providers) are in the [legal notice](@mentions-legales). To write to us: {{email.support}}.',
  },
  short: {
    'mentions-legales': 'Legal notice',
    conditions: 'Terms of use',
    confidentialite: 'Privacy',
    abonnement: 'Blowy+ subscription',
    regles: 'Community rules',
    cookies: 'Cookies',
    securite: 'Safety and reporting',
    'supprimer-mon-compte': 'Delete my account',
    assistance: 'Help',
  },
};
