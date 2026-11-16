import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Delete my account and data — Minimoa',
  heading: 'Delete my account',
  description: 'How to delete your Minimoa account and data, what is erased and when, what is kept and why.',
  intro: 'You can delete your account and data whenever you want, right in the app. Here is how, and what it erases.',
  body: [
    { h2: 'In the app', id: 'app' },
    { ol: ['Open the **Me** tab.', 'Tap **Settings**.', 'Tap **Delete my account**.', 'Type the confirmation word shown on screen.'] },
    { p: 'It is immediate and permanent: nothing can be recovered afterwards.' },
    {
      note: '**Have Minimoa+?** Deleting your account does not cancel the subscription. Cancel it first in your iPhone settings ([how](@abonnement#annuler)).',
    },

    { h2: 'Without the app', id: 'sans-app' },
    {
      p: 'No longer have access to the app? Write to {{email.privacy}}, if possible from the email address linked to your Apple or Google account, asking for your account to be deleted. We may ask you to confirm the account is yours. We handle it within one month at most, and confirm when it is done.',
    },

    { h2: 'What is erased straight away', id: 'efface' },
    {
      ul: [
        'your account, first name, date of birth, gender, what you are looking for, your profile photo;',
        'your Apple sign-in token, after Minimoa’s access to your Apple ID has been revoked with Apple;',
        'your minimoa, its vision, style and items, your habits, your streak;',
        'your rounded position, your approximate home area or the city you picked;',
        'your connections, with their messages, old daily photos and milestones. **They also disappear for the other people**;',
        'your proof and challenge photos, kept as memories or not yet erased;',
        'the “3 words” you received, your invitations;',
        'your settings and the permission to send you notifications.',
      ],
    },

    { h2: 'What is kept, and why', id: 'garde' },
    {
      table: {
        head: ['What', 'Why', 'How long'],
        rows: [
          ['Technical backups', 'Being able to restore the service after a failure', 'Overwritten as they rotate: {{dataHost.backupRetention}}'],
          ['Reports and moderation decisions', 'Other people’s safety and legal obligations. They are no longer linked to any account; the decision log keeps the first name concerned.', '1 year after the case is closed (a report still open: until it is handled, then 1 year), longer only if the law requires it'],
          ['In case of a permanent ban: a non-reversible fingerprint of your Apple or Google identifier', 'Preventing re-registration', '3 years'],
          ['Minimoa+ purchase references', 'Accounting obligations. They are no longer linked to any account.', 'Up to 10 years'],
          ['Activity days and internal ranking (statistics)', 'Calculating the service’s figures', '40 days at most'],
          ['Aggregated statistics', 'Running the service. They cannot identify you.', 'No limit'],
        ],
      },
    },
    {
      p: 'The “3 words” you chose for other people stay on their account: they are anonymous. Apple or Google keep their own purchase and sign-in data, under their policies. With Apple, deletion also removes Minimoa from the apps using your Apple ID; with Google, you can do it from your Google account. What has already been sent to our AI provider follows what it keeps on its side ([privacy policy](@confidentialite#ia)).',
    },

    { h2: 'A question', id: 'question' },
    { p: 'Write to {{email.privacy}}. Details of what we keep and why are in the [privacy policy](@confidentialite#durees).' },
  ],
};
