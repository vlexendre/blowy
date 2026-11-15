import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Delete my account and data — Blowy',
  heading: 'Delete my account',
  description: 'How to delete your Blowy account and data, what is erased and when, what is kept and why.',
  intro: 'You can delete your account and data whenever you want, right in the app. Here is how, and what it erases.',
  body: [
    { h2: 'In the app', id: 'app' },
    { ol: ['Open the **Me** tab.', 'Tap **Settings**.', 'Tap **Delete my account**.', 'Type the confirmation word shown on screen.'] },
    { p: 'It is immediate and permanent: nothing can be recovered afterwards.' },
    {
      note: '**Have Blowy+?** Deleting your account does not cancel the subscription. Cancel it first in your store settings ([how](@abonnement#annuler)).',
    },

    { h2: 'Without the app', id: 'sans-app' },
    {
      p: 'No longer have access to the app? Write to {{email.privacy}}, if possible from the email address linked to your Apple or Google account, asking for your account to be deleted. We may ask you to confirm the account is yours. We handle it within one month at most, and confirm when it is done.',
    },

    { h2: 'What is erased straight away', id: 'efface' },
    {
      ul: [
        'your account, first name, date of birth, gender, what you are looking for;',
        'your minimoa, its vision, style, items, your habits, your streak;',
        'your location and approximate home area;',
        'your connections, with their messages, photos and milestones. **They also disappear for the other people**;',
        'proof photos kept as memories;',
        'the “3 words” you received, your invitations;',
        'your settings and the permission to send you notifications.',
      ],
    },

    { h2: 'What is kept, and why', id: 'garde' },
    {
      table: {
        head: ['What', 'Why', 'How long'],
        rows: [
          ['Technical backups', 'Being able to restore the service after a failure', 'Overwritten as they rotate, at the latest 30 days later'],
          ['Reports and moderation decisions', 'Other people’s safety and legal obligations. They are no longer linked to your account.', '1 year after the case is closed, longer if legal proceedings require it'],
          ['In case of a permanent ban: a technical identifier of your Apple or Google account', 'Preventing re-registration', '3 years'],
          ['Blowy+ purchase references', 'Accounting obligations', 'Up to 10 years'],
          ['Connection data required by law', 'Responding to requests from the authorities', 'The period set by law, one year at most'],
          ['Aggregated statistics', 'Running the service. They cannot identify you.', 'No limit'],
        ],
      },
    },
    {
      p: 'The “3 words” you chose for other people stay on their account: they are anonymous. Apple or Google keep their own purchase and sign-in data, under their policies. You can also remove Blowy from the apps connected to your Apple ID or Google account.',
    },

    { h2: 'A question', id: 'question' },
    { p: 'Write to {{email.privacy}}. Details of what we keep and why are in the [privacy policy](@confidentialite#durees).' },
  ],
};
