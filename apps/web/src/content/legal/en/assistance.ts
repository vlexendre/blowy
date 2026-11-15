import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Help and contact — Blowy',
  heading: 'Help',
  description: 'A question, a bug, a problem with someone, your subscription or your data? The most common answers, and how to write to us.',
  intro: 'The questions we get asked most. Not found it? Write to us: a human answers, not a minimoa.',
  body: [
    { h2: 'Write to us', id: 'contact' },
    {
      table: {
        head: ['For', 'Write to'],
        rows: [
          ['A question, a bug, an idea', '{{email.support}}'],
          ['Your personal data', '{{email.privacy}}'],
          ['A safety problem, illegal content, a minor', '{{email.safety}}, and also report the person in the app'],
        ],
      },
    },
    {
      p: 'For a bug, tell us your phone model, the app version (at the bottom of **Me → Settings**) and what you were doing. We answer in French or English.',
    },
    { note: '**In immediate danger?** Do not wait for our reply: call **112** (or **17** in France). See [safety and reporting](@securite).' },

    { h2: 'Frequently asked questions', id: 'faq' },
    {
      faq: [
        {
          q: 'What is a minimoa?',
          a: [
            'Your minimoa is a small version of you: it carries your vision of life and your habits. It introduces you to people whose vision is compatible with yours, as friends or more. The more you look after it (by going out, keeping your habits), the more people it introduces you to. It never dies.',
          ],
        },
        {
          q: 'How does my minimoa choose whom to introduce me to?',
          a: [
            'It compares your vision (5 axes: home, roots, drive, pace, course) with other people’s, and only introduces people above 70% compatibility. Every encounter explains why: 3 things in common and 1 difference. Details are in the [privacy policy](@confidentialite#compatibilite).',
          ],
        },
        {
          q: 'Why does Blowy ask for my location?',
          a: [
            'For the map and nearby encounters, only while the app is open. Your position is rounded and shifted for others, and discreet mode removes you from the map. Without location, the rest of the app works.',
          ],
        },
        {
          q: 'Who reads my messages?',
          a: [
            'No human reads your conversations. If you both switch it on, an AI reads your messages so your minimoas can react; nothing is kept afterwards. You can turn it off in the connection’s options or in Me. The only exception: if a message is reported, a moderator reads that message and its immediate context.',
          ],
        },
        {
          q: 'What happens to my proof photos?',
          a: ['An AI checks the photo, no human sees it, and it is deleted within 24 hours, unless you keep it in your private memories.'],
        },
        {
          q: 'I can no longer sign in. What should I do?',
          a: [
            'Sign-in goes through Apple (iPhone) or Google (Android). Use the same Apple ID or Google account as when you signed up. If it still does not work, write to us at {{email.support}}.',
          ],
        },
        {
          q: 'How do I cancel Blowy+?',
          a: [
            'In your store settings, not in Blowy. iPhone: Settings → your name → Subscriptions. Android: Google Play → profile → Payments & subscriptions → Subscriptions. Details in the [Blowy+ terms](@abonnement#annuler).',
          ],
        },
        {
          q: 'How do I get a refund?',
          a: ['Payments go through Apple or Google: they issue refunds, under their terms. The links are in the [Blowy+ terms](@abonnement#remboursements).'],
        },
        {
          q: 'How do I report or block someone?',
          a: ['From the chat or the encounter, menu at the top right, then Report or Block. See [safety and reporting](@securite).'],
        },
        {
          q: 'How do I delete my account?',
          a: ['Me → Settings → Delete my account. Everything is explained on the [delete my account](@supprimer-mon-compte) page.'],
        },
        {
          q: 'How do I get a copy of my data?',
          a: ['Write to {{email.privacy}}. We answer within one month. Your rights are detailed in the [privacy policy](@confidentialite#droits).'],
        },
      ],
    },

    { h2: 'See also', id: 'documents' },
    { p: '[Terms of use](@conditions) · [Privacy](@confidentialite) · [Community rules](@regles) · [Legal notice](@mentions-legales)' },
  ],
};
