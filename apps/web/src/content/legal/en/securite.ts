import type { LegalPage } from '../types';

export const securite: LegalPage = {
  title: 'Safety and reporting — Blowy',
  heading: 'Safety and reporting',
  description: 'How to report or block someone in Blowy, what happens next, our advice for a first meeting, emergency numbers, and our child-safety policy.',
  intro: 'How to report, block, protect yourself, and whom to call in an emergency.',
  body: [
    { note: '**In immediate danger?** Call **112** (emergency number anywhere in the European Union). In France: **17** (police), or text **114** if you cannot speak.' },

    { h2: 'Report someone', id: 'signaler' },
    {
      ol: [
        'Open the chat with the person, or their card in your encounters.',
        'Tap the menu at the top right, then **Report**.',
        'Choose the reason: harassment, inappropriate content, fake profile, minor, or other.',
        'Add a few words if you want (what happened, when). It helps us act fast.',
        'You can block the person at the same time.',
      ],
    },
    {
      p: 'The person does not know the report came from you. No access to the app? Write to {{email.safety}} with the person’s first name and what happened.',
    },

    { h2: 'What happens next', id: 'suite' },
    {
      ul: [
        '**Target: a response within 24 hours.** Serious reports (minors, threats, violence) come first.',
        'A Blowy moderator reads **the reported message and its immediate context**, and nothing else from your conversations.',
        'Depending on how serious it is: content removal, warning, restriction, suspension or closure of the account. Anything illegal may be passed on to the authorities.',
        'We confirm that your report has been handled. To protect everyone’s privacy, we do not always detail the sanction.',
      ],
    },

    { h2: 'Block someone', id: 'bloquer' },
    {
      p: 'In the same menu, choose **Block**. The person can no longer write to you, your connection disappears, and your minimoas will not cross paths again, neither in encounters nor on the map. They are not notified. You will find blocked people in **Me → Settings → Blocked people**, where you can unblock them.',
    },

    { h2: 'Your protections in the app', id: 'protections' },
    {
      ul: [
        'Your position is never exact on the map: rounded to about 300 m and shifted, never in real time.',
        '**Discreet mode** removes you from the map.',
        'Nothing happens without your agreement: you wave, the other person accepts, the connection is created.',
        'You can leave a connection at any time.',
      ],
    },

    { h2: 'Before meeting in person', id: 'rencontre' },
    {
      ul: [
        '**Take your time.** Chat in the app first. Someone rushing you is a warning sign.',
        '**A public place**, the first time: a café, a busy park. Not at your place, not at theirs.',
        '**Tell someone close**: where, when, with whom. Agree on a message to send during or after.',
        '**Stay independent**: get there and back on your own. Keep your phone charged.',
        '**Do not share too soon** your address, workplace or private information.',
        '**Never money.** No one has a good reason to ask you for it. Report it.',
        '**Watch your drink**, and what you consume.',
        '**Trust yourself**: if something feels off, you can leave, without explaining.',
      ],
    },
    { p: 'A compatibility score, however high, guarantees nothing about a person. Blowy does not verify users’ identity.' },

    { h2: 'Useful numbers', id: 'urgences' },
    {
      table: {
        head: ['Number', 'What for'],
        rows: [
          ['**112**', 'Emergencies, from any European Union country'],
          ['**17**', 'Police (France)'],
          ['**15**', 'Medical emergency, SAMU (France)'],
          ['**18**', 'Fire brigade (France)'],
          ['**114**', 'Emergencies by text message, for people who are deaf, hard of hearing, or cannot speak (France)'],
          ['**3919**', 'Violence against women, free and anonymous (France)'],
          ['**3018**', 'Cyberbullying and online violence, free and confidential (France)'],
          ['**119**', 'Children in danger (France)'],
        ],
      },
    },
    {
      p: 'Illegal online content can also be reported to the official French platform [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr). Outside France, call 112 or your country’s emergency numbers.',
    },

    { h2: 'Child safety', id: 'mineurs' },
    {
      p: 'Blowy is only for adults aged 18 and over. The date of birth is asked before sign-in; under 18, sign-up stops and nothing is created.',
    },
    {
      p: '**Zero tolerance** for any content or behaviour that sexualises or endangers a minor. As soon as we become aware of it: the content is removed, the account is closed permanently, and the facts are reported to the competent authorities.',
    },
    {
      ul: [
        'In the app: **Report**, reason “Minor”.',
        'By email: {{email.safety}}.',
        'In France, you can also report on [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr), or call **119** if a child is in danger.',
      ],
    },
    { p: 'To find out more: [community rules](@regles), [terms of use](@conditions#moderation).' },
  ],
};
