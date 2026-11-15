import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Blowy+ subscription terms — Blowy',
  heading: 'Blowy+ subscription terms',
  description:
    'Blowy+: what it includes, the plans (€59.88 per year with 7 days free, or €14.99 per month), automatic renewal, billing by Apple, how to cancel, what happens at the end, withdrawal and refunds.',
  intro: 'What Blowy+ includes, what it costs, how it renews, and how to stop it. No small print.',
  summary: {
    title: 'In short',
    items: [
      '**€59.88 per year**, with **7 days free** at the start, or **€14.99 per month**, without a trial.',
      'The subscription **renews automatically** until you cancel it.',
      'Blowy+ is bought on iPhone: **Apple** bills you, and you cancel in your iPhone settings.',
      'On day 5 of the trial, we let you know **by notification and by email**.',
      'Deleting the app or your account **does not cancel** the subscription.',
      'Blowy stays free without Blowy+.',
    ],
  },
  body: [
    { h2: 'What Blowy+ adds', id: 'contenu' },
    {
      ul: [
        '**The whole map**, and **change city whenever you like**, without moving. Without Blowy+, you see your area (about 1.5 km around you); without location, you pick your city by hand, at most once every 30 days.',
        '**One more encounter every day.**',
        '**3 streak jokers per week** to protect your streak (without Blowy+: one per week).',
        '**Up to 6 habits** followed at the same time (without Blowy+: 2).',
        'The **detailed Sunday review**: how your vision has changed over 4 weeks and a check-up of each connection.',
        '**Rename your minimoa whenever you like** (without Blowy+: once every 60 days).',
        '**All the premium wardrobe items**: they belong to your minimoa and can be worn straight away, as long as the subscription lasts.',
      ],
    },
    { p: 'The exact content may change with the app. If we remove a major Blowy+ feature, we tell you beforehand, and you can cancel.' },

    { h2: 'Plans and prices', id: 'offres' },
    {
      table: {
        head: ['Plan', 'Price', 'Free trial'],
        rows: [
          ['Annual', '€59.88 per year, i.e. €4.99 per month', '7 days, then €59.88 per year'],
          ['Monthly', '€14.99 per month', 'No trial'],
        ],
      },
    },
    {
      p: 'Prices include all taxes, for France. In other countries, the App Store shows the price in your currency, which may differ. The price that applies is the one shown by the App Store when you confirm the purchase.',
    },

    { h2: 'The free trial', id: 'essai' },
    {
      ul: [
        'The 7-day trial only applies to the annual plan, and only to a new subscription, under Apple’s conditions (usually one trial per Apple account).',
        'During the trial, all of Blowy+ is unlocked and you pay nothing.',
        'On day 5, we send you a reminder: 2 days left. It goes out by notification (if you allowed them) and by email, to the address linked to your Apple account.',
        'If you do not cancel **at least 24 hours before the trial ends**, the first payment of €59.88 is taken on day 7 and the annual subscription begins.',
        'If you cancel during the trial, you keep Blowy+ until the end of the 7 days and pay nothing.',
      ],
    },

    { h2: 'Payment and automatic renewal', id: 'renouvellement' },
    {
      ul: [
        'You buy in the app, on iPhone, through the **App Store**. Payment is charged to the payment method of your Apple account, when you confirm the purchase or at the end of the trial. On Android and on the web, Blowy+ is not for sale; a subscription taken on iPhone follows your Blowy account everywhere.',
        'The subscription **renews automatically** for the same period (one year or one month), at the same price, unless you cancel it **at least 24 hours before the end of the current period**.',
        'If the price changes, Apple tells you in advance, under its rules, and asks for your agreement where they require it.',
        'We never receive your bank details. Apple only confirms the purchase to us, which our server verifies with it.',
        'New phone? Use **Restore purchases** in the app, with the same Apple account.',
      ],
    },

    { h2: 'Cancelling', id: 'annuler' },
    { p: 'You cancel in your iPhone settings, not in Blowy (in the app, **Me → Blowy+ → Manage my subscription** takes you there):' },
    { ul: ['**iPhone:** Settings → your name → Subscriptions → Blowy → Cancel subscription.'] },
    {
      p: 'After cancelling, Blowy+ stays unlocked until the end of the period already paid, then your account goes back to the free version. Your minimoa, connections and data stay.',
    },
    { note: '**Deleting the app or your Blowy account does not cancel the subscription.** Cancel it in your iPhone settings first, or you will keep being billed.' },

    { h2: 'When Blowy+ ends', id: 'fin' },
    {
      ul: [
        'The map goes back to your area (or to the city you picked by hand); the city chosen with Blowy+ stays saved and comes back with a new subscription.',
        'One encounter fewer per day, one joker per week, the simple Sunday review, renaming once every 60 days.',
        'Habits you already follow stay; you can only add one when you have fewer than 2.',
        'Your minimoa **puts the premium items away**: they are locked again, and come back with a new subscription.',
        'Nothing else is erased: your minimoa, connections, streaks and earned items stay.',
      ],
    },

    { h2: 'Right of withdrawal', id: 'retractation' },
    {
      p: 'As a consumer in the European Union, you normally have 14 days to withdraw from a contract concluded at a distance. Blowy+ is a digital service provided immediately: by subscribing, you ask for access to start right away. If you withdraw within that period, an amount in proportion to the service already provided may be retained, under the conditions set by law.',
    },
    { p: 'As the purchase is made with Apple, you request withdrawal from Apple:' },
    { ul: ['**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), or from your account’s purchase history.'] },
    { p: 'During the free trial, there is nothing to withdraw from: just cancel before the end to pay nothing.' },

    { h2: 'Refunds', id: 'remboursements' },
    {
      p: 'Since payments are collected by Apple, **only Apple can issue refunds**, under its own terms. We cannot do it for Apple. If Blowy+ did not work as expected, write to us too at {{email.support}}: we will help, and your consumer rights (in particular the legal guarantee of conformity) remain fully applicable.',
    },

    { h2: 'If your account is suspended or closed', id: 'sanctions' },
    {
      p: 'If your account is closed for a serious breach of the [terms of use](@conditions), access to Blowy+ stops too. Remember to cancel the subscription in your iPhone settings. If we shut down the service, we tell you at least 30 days in advance and explain how to get a refund for the unused period.',
    },

    { h2: 'Everything else', id: 'reste' },
    {
      p: 'These terms complement the [terms of use](@conditions), which also apply to Blowy+ (in particular applicable law and mediation). Apple’s terms apply to the purchase itself. Any question: {{email.support}}.',
    },
  ],
};
