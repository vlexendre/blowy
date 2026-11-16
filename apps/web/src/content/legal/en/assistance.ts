import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Help and contact — Minimoa',
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
          q: 'Why does Minimoa ask for my location?',
          a: [
            'For the map and nearby encounters, only while the app is open. Your exact position is never stored: we only keep a point rounded to about 300 m. Others see a rounded and shifted position, and discreet mode removes you from the map. Without location, you pick your city by hand (Encounters, or Me → Settings → My location) and still get encounters.',
          ],
        },
        {
          q: 'Who reads my messages?',
          a: [
            'No one at Minimoa reads your conversations, except a reported message (reported by someone or by our automatic filter): a moderator then reads that message and its immediate context. If you both switch it on, an AI, that of our provider {{sub.ai.provider}}, reads your latest messages so your minimoas can react; Minimoa keeps nothing of that reading. You can turn it off in the connection’s options or in Me → AI and you.',
          ],
        },
        {
          q: 'What happens to my proof photos?',
          a: [
            'Before your first proof, the app asks whether an AI ({{sub.ai.provider}}) may check your photos. If you accept, the downsized photo is sent to it; otherwise, you confirm your habits on your word, without a photo. No human sees your proof photos, and they are deleted within 24 hours, unless you keep them in your private memories. You can change your mind in Me → AI and you.',
          ],
        },
        {
          q: 'Why was my message, first name or photo refused?',
          a: [
            'First names, minimoa names, messages and profile photos go through an automatic filter, which blocks what clearly breaks the [community rules](@regles). The app tells you why, and your text stays there so you can edit it. Think it is a mistake? Write to {{email.support}}: a person will look at it.',
          ],
        },
        {
          q: 'I can no longer sign in. What should I do?',
          a: [
            'Sign-in goes through Apple (iPhone) or Google (Android). Use the same Apple ID or Google account as when you signed up. Is your account suspended? The screen tells you until when, and lets you write to support to challenge it. If it still does not work, write to us at {{email.support}}.',
          ],
        },
        {
          q: 'How do I cancel Minimoa+?',
          a: [
            'In your iPhone settings, not in Minimoa: Settings → your name → Subscriptions (in the app, Me → Minimoa+ → Manage my subscription takes you there). Details in the [Minimoa+ terms](@abonnement#annuler).',
          ],
        },
        {
          q: 'How do I get a refund?',
          a: [
            'Payments go through Apple: Apple issues refunds, under its terms. The link is in the [Minimoa+ terms](@abonnement#remboursements).',
          ],
        },
        {
          q: 'How do I report or block someone?',
          a: [
            'From the chat or the encounter, “…” menu at the top right, then Report or Block; in a chat, a long press on a message lets you report it. See [safety and reporting](@securite).',
          ],
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
