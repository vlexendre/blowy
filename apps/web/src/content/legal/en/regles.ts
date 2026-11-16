import type { LegalPage } from '../types';

export const regles: LegalPage = {
  title: 'Community rules — Minimoa',
  heading: 'Community rules',
  description: 'Minimoa’s rules: respect, consent, no harassment, no minors, no sexual content. What happens if they are not followed.',
  intro: 'Minimoas, with real humans behind them. To keep this a place people want to come back to, a few simple rules.',
  body: [
    { h2: 'Respect people', id: 'respect' },
    { p: 'Behind every minimoa there is a real person. Humour, yes; humiliation, no. You can disagree without being hurtful.' },

    { h2: 'No means no', id: 'consentement' },
    {
      p: 'If someone does not reply, does not wave back, leaves a connection or blocks you, that is their choice. Do not keep chasing, do not create another account to get around a refusal, and do not look for the person elsewhere.',
    },

    { h2: 'No harassment or hate', id: 'harcelement' },
    {
      p: 'Forbidden: insults, threats, blackmail, repeated unwanted messages, mocking someone’s body, origin, religion, gender, sexual orientation or disability, calls for hatred or violence.',
    },

    { h2: '18 and over, no exceptions', id: 'majeurs' },
    {
      p: 'Minimoa is for adults only. Any account belonging to a minor is deleted. Any content that sexualises a minor is removed, its author is banned, and we report it to the authorities. If you think you are talking to a minor, report them with the reason “Minor”.',
    },

    { h2: 'No nudity or sexual content', id: 'contenus' },
    {
      p: 'Not in messages, not as a profile photo, not as a proof photo. No violent, shocking or illegal content either. A proof photo is your trainers, your book, your plate: not you in your underwear.',
    },

    { h2: 'Be yourself', id: 'authenticite' },
    { p: 'One account per person, for a real person. No fake profiles, no impersonation. And no cheating: no fake proof photos, no spoofed location.' },

    { h2: 'No scams or selling', id: 'arnaques' },
    {
      p: 'Do not ask for money, gifts or codes. No advertising, no spam, no dodgy links, no paid sexual services. Someone asking you for money? Report them.',
    },

    { h2: 'Protect other people’s privacy', id: 'vie-privee' },
    { p: 'Do not share someone’s address, number, photos or messages without their consent. What is said in a connection stays in the connection.' },

    { h2: 'What happens when a rule is broken', id: 'sanctions' },
    {
      p: 'First names, minimoa names, messages and profile photos go through an **automatic filter**: what clearly breaks these rules is not published, and the app says why; a borderline message (an insult, for example) is sent, but reported to the moderation team. Every report, from a person or from the filter, alerts the team, which reviews it aiming to respond within 24 hours. A moderator may read the reported message and its immediate context, nothing more. Depending on how serious it is:',
    },
    {
      ol: [
        'the content is removed;',
        'the person gets a warning;',
        'some features are restricted, or the account is suspended;',
        'the account is closed permanently, the very first time for serious cases (minors, threats, violence, scams).',
      ],
    },
    {
      p: 'Two cases suspend an account automatically, for 72 hours at most, while a moderator looks at it: explicit child-abuse vocabulary in a message, or an account reported as a minor by two different people. Anything illegal may be reported to the authorities. The person concerned receives the reasons for the decision and can challenge it, whether it was automatic or not ([terms of use](@conditions#moderation)).',
    },

    { h2: 'Report and block', id: 'signaler' },
    {
      p: 'From a chat or an encounter, open the menu and choose **Report** or **Block**; in a chat, a long press on a message also lets you report it. The person does not know who reported them, and is not notified of a block. Everything is explained in [safety and reporting](@securite).',
    },
    { p: 'These rules are part of the [terms of use](@conditions). A question or a doubt: {{email.support}}. A human answers, not a minimoa.' },
  ],
};
