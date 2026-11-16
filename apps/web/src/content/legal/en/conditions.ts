import type { LegalPage } from '../types';

export const conditions: LegalPage = {
  title: 'Terms of use — Minimoa',
  heading: 'Terms of use',
  description: 'The agreement between you and Minimoa: 18 and over, your account, what is allowed, your content, moderation, ending the agreement, applicable law.',
  intro: 'The agreement between you and Minimoa. By creating an account, you accept it. Take five minutes to read it.',
  summary: {
    title: 'In short',
    items: [
      'Minimoa is for **adults aged 18 and over** only. One account per person, for a real person.',
      'Your **minimoa** carries your vision of life and introduces you to compatible people, as friends or more. Its messages are automatic: it is not a person.',
      'Respect others and the [community rules](@regles). No harassment, no sexual content, nothing involving a minor.',
      'Your messages and photos remain yours. You only give us the right to process them to make Minimoa work.',
      'Minimoa is free. **Minimoa+** is an optional subscription, paid through the App Store, on iPhone ([Minimoa+ terms](@abonnement)).',
      'You can leave whenever you want: [deleting your account](@supprimer-mon-compte) is done in the app.',
      'French law applies. If there is a problem, write to us first; you can also go to a mediator, free of charge.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Who we are', id: 'editeur' },
    {
      p: 'The Minimoa app and the blowy.app website are published by **{{publisher.name}}** (“Minimoa”, “we”). Full details are in the [legal notice](@mentions-legales). To write to us: {{email.support}}.',
    },
    {
      p: 'These terms apply to any use of the app. The [community rules](@regles), the [Minimoa+ subscription terms](@abonnement) and the [privacy policy](@confidentialite) are part of them.',
    },

    { h2: '2. What Minimoa is', id: 'service' },
    {
      p: 'On Minimoa, everyone raises a **minimoa**, a small creature that carries their vision of life: what the person plans for their life (home and family, where to live, the place of work, the pace of daily life, the long term). The minimoa introduces its person to people whose vision is compatible, as friends or more, and looks after each connection.',
    },
    {
      ul: [
        '**Your vision** is built from a test at sign-up, one question a day, your habits and the way you look after your minimoa. It is indicative and gets more accurate over time.',
        '**Encounters**: your minimoa only introduces you to people whose compatibility is above a threshold. Nothing happens without your agreement: you wave, the other person accepts, the connection is created. How it works is explained in the [privacy policy](@confidentialite#compatibilite).',
        '**Connections**: a chat, a streak that grows every day you both write, memories, and lives that go down when the connection stays silent.',
        '**Your minimoa** has gauges (sociability, hunger, energy, mood), habits to keep, a streak, items. It never dies.',
        '**The map** shows compatible minimoas around you (or around the city you picked, if you do not turn on location), at a deliberately imprecise position.',
      ],
    },
    {
      p: '**Minimoas are not people.** Their messages, comments and the weekly review are produced automatically, from sentence templates or by artificial intelligence. They can be wrong. They are not professional advice, not medical advice, and not a guarantee about anyone.',
    },
    { p: 'A compatibility score, however high, says nothing about someone’s honesty or intentions. Minimoa does not verify people’s identity and does not run checks on them.' },

    { h2: '3. Who can use Minimoa', id: 'age' },
    {
      ul: [
        '**You must be 18 or over.** We ask for your date of birth before you sign in. Under 18, sign-up stops and nothing is created. Lying about your age leads to the account being closed.',
        '**One account per person**, for a real person: you. No shared accounts, no accounts in someone else’s name.',
        'You must not have been banned from Minimoa, or be barred by law from using this kind of service.',
      ],
    },

    { h2: '4. Your account', id: 'compte' },
    {
      p: 'You sign in with **Apple** (on iPhone) or **Google** (on Android). These services confirm your identity to us; we never know your password. Keep access to that Apple or Google account to yourself: what happens on your Minimoa account is your responsibility. If you think someone has accessed it, write to us straight away.',
    },
    { p: 'The information you give (first name, date of birth, what you are looking for) must be true and up to date. You can change it in the app.' },

    { h2: '5. What is allowed, and what is not', id: 'usage' },
    { p: 'You use Minimoa in a way that respects the law, other people and the [community rules](@regles). In particular, you must not:' },
    {
      ul: [
        'harass, threaten, insult, humiliate, blackmail, or incite hatred or violence;',
        'send nudity or sexual content, including as a profile photo or a proof photo;',
        'involve a minor in any way;',
        'post illegal, violent or shocking content;',
        'pretend to be someone else, create a fake profile or several accounts;',
        'scam people, ask for money, advertise or spam;',
        'offer or request paid sexual services;',
        'share someone else’s private information or photos without their consent;',
        'to cheat the checks (fake proof photo, faked location) or get around the automatic content filter;',
        'automate use of the service (bots, scraping), get around its limits, blocks or protections, or disrupt how it works.',
      ],
    },

    { h2: '6. Your content', id: 'contenus' },
    {
      p: 'Your messages, photos and answers remain yours. To run Minimoa, you grant us a **free, non-exclusive, worldwide licence**, limited to what is needed to: store them, deliver them to the people you send them to, display them in the app, process them technically (resizing a photo, for example) and, where planned, filter them automatically and, where planned, have them analysed by an AI (proof photos, if you accepted; messages, if you have both switched it on; profile photo and messages that raise doubts, for safety; see the [privacy policy](@confidentialite#ia)). This licence lasts as long as the content is online and ends when it is deleted, except for what we must keep under the [privacy policy](@confidentialite#durees).',
    },
    { p: 'We do not use your content for advertising and we do not sell it.' },
    { p: 'You confirm that you have the right to post what you post, and that it does not infringe anyone else’s rights (image, privacy, copyright).' },

    { h2: '7. Reporting, moderation and sanctions', id: 'moderation' },
    {
      p: 'You can report or block a person at any time from the app ([how](@securite)). Every report alerts the moderation team, which reviews it aiming to respond within 24 hours. To do so, a Minimoa moderator may read the reported message and its immediate context (the messages around it). Outside this case, no one at Minimoa reads your conversations; an AI only reads them if you have both switched it on.',
    },
    {
      p: 'First names, minimoa names, messages and profile photos go through an **automatic filter** before being published: content that clearly breaks the rules is refused, and the app tells you why; a borderline message is sent but reported to moderation. In two cases only, the account is **suspended automatically** for 72 hours at most, while a moderator looks at it: explicit child-abuse vocabulary in a message, or an account reported as a minor by two different people. The moderator lifts or confirms the suspension.',
    },
    { p: 'Depending on how serious it is, we may:' },
    {
      ul: [
        'remove content;',
        'send a warning;',
        'restrict some features (encounters, map, photos);',
        'suspend the account for a limited period;',
        'close the account permanently, for a serious or repeated breach.',
      ],
    },
    {
      p: 'What is serious and illegal (content involving a minor, a serious threat, for example) is reported to the authorities. When we take a decision that concerns you, we give you the reasons, unless the law forbids it or doing so would put someone at risk. You can challenge it, whether it was automatic or not, by writing to {{email.support}} within six months; a person reviews the decision.',
    },

    { h2: '8. Artificial intelligence in Minimoa', id: 'ia' },
    {
      ul: [
        '**Reading messages**: only if you both switch it on, so your minimoas can react. You can turn it off whenever you want.',
        '**Proof photos**: only if you accept, an AI says whether the photo matches the habit; if in doubt, we trust you. Without consent, you confirm on your word, without a photo.',
        '**Safety checks**: every profile photo, and a message that raises doubts in a chat where you have both accepted reading.',
        '**Weekly review**: rephrased by an AI, without any first name or name. The minimoas’ other comments come from sentence templates.',
      ],
    },
    {
      p: 'This AI is that of {{sub.ai.provider}} ({{sub.ai.location}}), our provider. These features serve the game, the conversation and safety. None of them takes a decision that has legal effects on you. Details, and what the provider receives, are in the [privacy policy](@confidentialite#ia); your consents can be seen and withdrawn in the app, **Me → AI and you**.',
    },

    { h2: '9. Free, with Minimoa+ as an option', id: 'blowy-plus' },
    {
      p: 'Minimoa is free and has no ads. **Minimoa+** is an optional subscription that unlocks extra features. It is sold and billed by Apple, on iPhone (a subscription taken on iPhone follows your account on your other devices). What it includes, its prices, free trial, renewal and how to cancel are in the [Minimoa+ subscription terms](@abonnement).',
    },
    {
      p: 'Items, jokers, streaks, lives and other game elements have no monetary value. They cannot be exchanged, resold or refunded, except where the law requires it.',
    },

    { h2: '10. Ending the agreement', id: 'fin' },
    {
      ul: [
        '**On your side**, you can leave whenever you want: in the app, **Me → Settings → Delete my account** ([what is deleted](@supprimer-mon-compte)). Deleting your account does not cancel a Minimoa+ subscription: cancel it in your iPhone settings too.',
        '**On our side**, we may suspend or close your account if you do not follow these terms, if the law requires it, or if someone’s safety is at stake. Except in an emergency or for a serious breach, we warn you first and explain why.',
        'If we shut down the service, we will tell you at least 30 days in advance.',
      ],
    },

    { h2: '11. Availability and liability', id: 'responsabilite' },
    {
      p: 'We do our best to keep Minimoa working well, all the time. We cannot guarantee there will be no outage, bug or interruption, especially during an update. We may change the app’s features.',
    },
    {
      p: 'Everyone is responsible for what they post and how they behave. Meeting in person is your own responsibility: read our [safety advice](@securite#rencontre). We are not liable for another user’s behaviour, or for indirect damage, to the extent permitted by law.',
    },
    {
      p: 'Nothing in these terms limits our liability for gross negligence or wilful misconduct, or for personal injury, nor the rights the law gives you as a consumer, in particular the legal guarantee of conformity for digital content and services.',
    },

    { h2: '12. Intellectual property', id: 'propriete' },
    {
      p: 'The Minimoa brand, the minimoas, illustrations, texts and software belong to {{publisher.name}} or its partners. We give you a personal, non-exclusive, non-transferable right to use the app for your private use, for as long as your account exists. You may share screenshots of your own conversations, without exposing other people.',
    },

    { h2: '13. Changes', id: 'changements' },
    {
      p: 'These terms may change, for example when a new feature arrives. For a significant change, we tell you in the app at least 30 days before it applies, unless the law or safety requires faster action. If you do not agree, you can delete your account before that date.',
    },

    { h2: '14. Applicable law, disputes and mediation', id: 'litiges' },
    { p: 'These terms are governed by **French law**. If you live in another EU country, you keep the protection of the mandatory rules of your country.' },
    { p: 'If there is a problem, write to us first at {{email.support}}: we will look for an amicable solution.' },
    { p: 'If your written complaint does not resolve things, you can go to our consumer mediator free of charge, within one year of your complaint:' },
    { ul: ['**Mediator:** {{mediator.name}}', '**Address:** {{mediator.address}}', '**Website:** {{mediator.website}}'] },
    {
      p: 'Failing agreement, the dispute goes before the competent French courts. If you are a consumer, you can also go to the court of the place where you lived when you signed up or when the event occurred.',
    },
  ],
};
