import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: "Conditions de l'abonnement Blowy+ — Blowy",
  heading: "Conditions de l'abonnement Blowy+",
  description:
    'Blowy+ : les offres (59,88 € par an avec 7 jours gratuits, ou 14,99 € par mois), le renouvellement automatique, la facturation par Apple ou Google, comment annuler, la rétractation et les remboursements.',
  intro: 'Ce que Blowy+ contient, ce qu’il coûte, comment il se renouvelle, et comment l’arrêter. Sans petites lignes.',
  summary: {
    title: 'En bref',
    items: [
      '**59,88 € par an**, avec **7 jours gratuits** au début, ou **14,99 € par mois**, sans essai.',
      'L’abonnement **se renouvelle automatiquement** tant que tu ne l’annules pas.',
      'C’est **Apple ou Google** qui te facture, et c’est dans les réglages de ton store que tu l’annules.',
      'Supprimer l’app ou ton compte **n’annule pas** l’abonnement.',
      'Blowy reste gratuit sans Blowy+.',
    ],
  },
  body: [
    { h2: 'Ce que Blowy+ ajoute', id: 'contenu' },
    {
      ul: [
        '**Toute la carte**, et la possibilité de **changer de ville** sans bouger (sans Blowy+, tu vois ta zone, environ 1,5 km autour de toi).',
        '**Plus de rencontres.**',
        '**Plus de jokers** pour protéger ta série (sans Blowy+ : un joker offert par semaine).',
        '**6 habitudes** au lieu de 2.',
        'Un **bilan de la semaine détaillé** : l’évolution de ta vision sur 4 semaines et l’audit de chaque lien.',
        '**Renommer ton minimoa** librement (sans Blowy+ : une fois tous les 60 jours).',
        'Des **objets premium**.',
      ],
    },
    {
      p: 'Le contenu exact peut évoluer avec l’app. Si on retire une fonction importante de Blowy+, on te prévient avant, et tu peux annuler.',
    },

    { h2: 'Les offres et les prix', id: 'offres' },
    {
      table: {
        head: ['Offre', 'Prix', 'Essai gratuit'],
        rows: [
          ['Annuelle', '59,88 € par an, soit 4,99 € par mois', '7 jours, puis 59,88 € par an'],
          ['Mensuelle', '14,99 € par mois', 'Pas d’essai'],
        ],
      },
    },
    {
      p: 'Les prix sont indiqués toutes taxes comprises, pour la France. Dans d’autres pays, le store affiche le prix dans ta devise, qui peut être différent. Le prix qui fait foi est celui affiché par l’App Store ou Google Play au moment où tu confirmes l’achat.',
    },

    { h2: "L'essai gratuit", id: 'essai' },
    {
      ul: [
        'L’essai de 7 jours concerne seulement l’offre annuelle, et seulement un nouvel abonnement, dans les conditions du store (en général, un essai par compte Apple ou Google).',
        'Pendant l’essai, tout Blowy+ est ouvert, et tu ne paies rien.',
        'Au 5e jour, on t’envoie un rappel : il reste 2 jours.',
        'Si tu n’annules pas **au moins 24 heures avant la fin de l’essai**, le premier paiement de 59,88 € est prélevé le 7e jour, et l’abonnement annuel commence.',
        'Si tu annules pendant l’essai, tu gardes Blowy+ jusqu’à la fin des 7 jours, et tu ne paies rien.',
      ],
    },

    { h2: 'Paiement et renouvellement automatique', id: 'renouvellement' },
    {
      ul: [
        'L’achat se fait dans l’app, par l’**App Store** (iPhone) ou **Google Play** (Android). Le paiement est débité sur le moyen de paiement de ton compte Apple ou Google, à la confirmation de l’achat ou à la fin de l’essai.',
        'L’abonnement **se renouvelle automatiquement** pour la même durée (un an ou un mois), au même prix, sauf si tu l’annules **au moins 24 heures avant la fin de la période en cours**.',
        'Si le prix change, le store te prévient avant, selon ses règles, et te demande ton accord quand elles l’exigent.',
        'On ne reçoit jamais tes coordonnées bancaires. Le store nous confirme seulement l’achat, que notre serveur vérifie auprès de lui.',
        'Tu as changé de téléphone ? Utilise **Restaurer mes achats** dans l’app, avec le même compte Apple ou Google.',
      ],
    },

    { h2: 'Annuler', id: 'annuler' },
    { p: 'Tu annules dans les réglages de ton store, pas dans Blowy :' },
    {
      ul: [
        '**iPhone :** Réglages → ton nom → Abonnements → Blowy → Annuler l’abonnement.',
        '**Android :** Google Play → ton profil → Paiements et abonnements → Abonnements → Blowy → Annuler l’abonnement.',
      ],
    },
    {
      p: 'Après l’annulation, Blowy+ reste ouvert jusqu’à la fin de la période déjà payée, puis ton compte repasse en version gratuite. Ton minimoa, tes liens et tes données restent là.',
    },
    {
      note: '**Supprimer l’app ou ton compte Blowy n’annule pas l’abonnement.** Annule-le d’abord dans ton store, sinon il continue à être facturé.',
    },

    { h2: 'Droit de rétractation', id: 'retractation' },
    {
      p: 'En tant que consommateur dans l’Union européenne, tu disposes en principe d’un délai de 14 jours pour te rétracter d’un contrat conclu à distance. Blowy+ est un service numérique fourni immédiatement : en t’abonnant, tu demandes que l’accès commence tout de suite. Si tu te rétractes dans ce délai, un montant proportionnel au service déjà fourni peut être retenu, dans les conditions prévues par la loi.',
    },
    {
      p: 'L’achat étant conclu avec Apple ou Google, la rétractation se demande auprès d’eux :',
    },
    {
      ul: [
        '**Apple :** [reportaproblem.apple.com](https://reportaproblem.apple.com), ou depuis l’historique d’achats de ton compte.',
        '**Google :** depuis ton historique de commandes Google Play ([aide Google Play](https://support.google.com/googleplay/answer/2479637)).',
      ],
    },
    { p: 'Pendant l’essai gratuit, il n’y a rien à rétracter : il suffit d’annuler avant la fin pour ne rien payer.' },

    { h2: 'Remboursements', id: 'remboursements' },
    {
      p: 'Les paiements étant encaissés par Apple ou Google, **seuls eux peuvent rembourser**, selon leurs propres conditions. On ne peut pas le faire à leur place. Si Blowy+ n’a pas fonctionné comme prévu, écris-nous aussi à {{email.support}} : on t’aidera, et tes droits de consommateur (notamment la garantie légale de conformité) restent pleinement applicables.',
    },

    { h2: 'Si ton compte est suspendu ou fermé', id: 'sanctions' },
    {
      p: 'Si ton compte est fermé pour un manquement grave aux [conditions d’utilisation](@conditions), l’accès à Blowy+ s’arrête aussi. Pense à annuler l’abonnement dans ton store. Si on arrête le service, on te prévient au moins 30 jours avant, et on t’indique comment obtenir un remboursement de la période non utilisée.',
    },

    { h2: 'Le reste', id: 'reste' },
    {
      p: 'Ces conditions complètent les [conditions d’utilisation](@conditions), qui s’appliquent aussi à Blowy+ (notamment le droit applicable et la médiation). Les conditions d’Apple ou de Google s’appliquent à l’achat lui-même. Une question : {{email.support}}.',
    },
  ],
};
