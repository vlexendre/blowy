import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: "Conditions de l'abonnement Minimoa+ — Minimoa",
  heading: "Conditions de l'abonnement Minimoa+",
  description:
    'Minimoa+ : ce qu’il contient, ses offres et leurs prix, le renouvellement automatique, la facturation par Apple, comment annuler, les remboursements.',
  intro: 'Ce que Minimoa+ contient, ce qu’il coûte, comment il se renouvelle, et comment l’arrêter. Sans petites lignes.',
  summary: {
    title: 'En bref',
    items: [
      '**59,99 € par an**, avec **7 jours gratuits** au début, **14,99 € par mois** ou **2,99 € par semaine**, sans essai.',
      'L’abonnement **se renouvelle automatiquement** tant que tu ne l’annules pas.',
      'Minimoa+ s’achète sur iPhone : c’est **Apple** qui te facture, et c’est dans les réglages de ton iPhone que tu l’annules.',
      'Au 5e jour de l’essai, on te prévient **par notification et par e-mail**.',
      'Supprimer l’app ou ton compte **n’annule pas** l’abonnement.',
      'Minimoa reste gratuit sans Minimoa+.',
    ],
  },
  body: [
    { h2: 'Ce que Minimoa+ ajoute', id: 'contenu' },
    {
      ul: [
        '**Toute la carte**, et **changer de ville quand tu veux**, sans bouger. Sans Minimoa+, tu vois ta zone (environ 1,5 km autour de toi) ; sans localisation, tu choisis ta ville à la main, au plus une fois tous les 30 jours.',
        '**Une rencontre de plus chaque jour.**',
        '**3 jokers de série par semaine** pour protéger ta série (sans Minimoa+ : un par semaine).',
        '**Jusqu’à 6 habitudes** suivies en même temps (sans Minimoa+ : 2).',
        'Le **bilan détaillé du dimanche** : l’évolution de ta vision sur 4 semaines et l’audit de chaque lien.',
        '**Renommer ton minimoa quand tu veux** (sans Minimoa+ : une fois tous les 60 jours).',
        '**Tous les objets premium de la garde-robe** : ils sont à ton minimoa et se portent tout de suite, tant que l’abonnement dure.',
      ],
    },
    {
      p: 'Le contenu exact peut évoluer avec l’app. Si on retire une fonction importante de Minimoa+, on te prévient avant, et tu peux annuler.',
    },

    { h2: 'Les offres et les prix', id: 'offres' },
    {
      table: {
        head: ['Offre', 'Prix', 'Essai gratuit'],
        rows: [
          ['Annuelle', '59,99 € par an, soit 4,99 € par mois', '7 jours, puis 59,99 € par an'],
          ['Mensuelle', '14,99 € par mois', 'Pas d’essai'],
          ['Hebdomadaire', '2,99 € par semaine', 'Pas d’essai'],
        ],
      },
    },
    {
      p: 'Les prix sont indiqués toutes taxes comprises, pour la France. Dans d’autres pays, l’App Store affiche le prix dans ta devise, qui peut être différent. Le prix qui fait foi est celui affiché par l’App Store au moment où tu confirmes l’achat.',
    },

    { h2: "L'essai gratuit", id: 'essai' },
    {
      ul: [
        'L’essai de 7 jours concerne seulement l’offre annuelle, et seulement un nouvel abonnement, dans les conditions d’Apple (en général, un essai par compte Apple).',
        'Pendant l’essai, tout Minimoa+ est ouvert, et tu ne paies rien.',
        'Au 5e jour, on t’envoie un rappel : il reste 2 jours. Il part par notification (si tu les as autorisées) et par e-mail, à l’adresse liée à ton compte Apple.',
        'Si tu n’annules pas **au moins 24 heures avant la fin de l’essai**, le premier paiement de 59,99 € est prélevé le 7e jour, et l’abonnement annuel commence.',
        'Si tu annules pendant l’essai, tu gardes Minimoa+ jusqu’à la fin des 7 jours, et tu ne paies rien.',
      ],
    },

    { h2: 'Paiement et renouvellement automatique', id: 'renouvellement' },
    {
      ul: [
        'L’achat se fait dans l’app, sur iPhone, par l’**App Store**. Le paiement est débité sur le moyen de paiement de ton compte Apple, à la confirmation de l’achat ou à la fin de l’essai. Sur Android et sur le web, Minimoa+ n’est pas en vente ; un abonnement pris sur iPhone suit ton compte Minimoa partout.',
        'L’abonnement **se renouvelle automatiquement** pour la même durée (un an ou un mois), au même prix, sauf si tu l’annules **au moins 24 heures avant la fin de la période en cours**.',
        'Si le prix change, Apple te prévient avant, selon ses règles, et te demande ton accord quand elles l’exigent.',
        'On ne reçoit jamais tes coordonnées bancaires. Apple nous confirme seulement l’achat, que notre serveur vérifie auprès de lui.',
        'Tu as changé de téléphone ? Utilise **Restaurer mes achats** dans l’app, avec le même compte Apple.',
      ],
    },

    { h2: 'Annuler', id: 'annuler' },
    { p: 'Tu annules dans les réglages de ton iPhone, pas dans Minimoa (dans l’app, **Moi → Minimoa+ → Gérer mon abonnement** y mène) :' },
    {
      ul: ['**iPhone :** Réglages → ton nom → Abonnements → Minimoa → Annuler l’abonnement.'],
    },
    {
      p: 'Après l’annulation, Minimoa+ reste ouvert jusqu’à la fin de la période déjà payée, puis ton compte repasse en version gratuite. Ton minimoa, tes liens et tes données restent là.',
    },
    {
      note: '**Supprimer l’app ou ton compte Minimoa n’annule pas l’abonnement.** Annule-le d’abord dans les réglages de ton iPhone, sinon il continue à être facturé.',
    },

    { h2: 'Quand Minimoa+ s’arrête', id: 'fin' },
    {
      ul: [
        'La carte revient à ta zone (ou à ta ville choisie à la main) ; la ville choisie avec Minimoa+ reste notée et revient avec un nouvel abonnement.',
        'Une rencontre de moins par jour, un joker par semaine, le bilan du dimanche simple, le renommage une fois tous les 60 jours.',
        'Tes habitudes déjà suivies restent ; tu ne peux en ajouter qu’en dessous de 2.',
        'Ton minimoa **range les objets premium** : ils redeviennent verrouillés, et reviennent avec un nouvel abonnement.',
        'Rien d’autre n’est effacé : ton minimoa, tes liens, tes séries et tes objets gagnés restent.',
      ],
    },

    { h2: 'Droit de rétractation', id: 'retractation' },
    {
      p: 'En tant que consommateur dans l’Union européenne, tu disposes en principe d’un délai de 14 jours pour te rétracter d’un contrat conclu à distance. Minimoa+ est un service numérique fourni immédiatement : en t’abonnant, tu demandes que l’accès commence tout de suite. Si tu te rétractes dans ce délai, un montant proportionnel au service déjà fourni peut être retenu, dans les conditions prévues par la loi.',
    },
    {
      p: 'L’achat étant conclu avec Apple, la rétractation se demande auprès d’Apple :',
    },
    {
      ul: [
        '**Apple :** [reportaproblem.apple.com](https://reportaproblem.apple.com), ou depuis l’historique d’achats de ton compte.',
      ],
    },
    { p: 'Pendant l’essai gratuit, il n’y a rien à rétracter : il suffit d’annuler avant la fin pour ne rien payer.' },

    { h2: 'Remboursements', id: 'remboursements' },
    {
      p: 'Les paiements étant encaissés par Apple, **seul Apple peut rembourser**, selon ses propres conditions. On ne peut pas le faire à leur place. Si Minimoa+ n’a pas fonctionné comme prévu, écris-nous aussi à {{email.support}} : on t’aidera, et tes droits de consommateur (notamment la garantie légale de conformité) restent pleinement applicables.',
    },

    { h2: 'Si ton compte est suspendu ou fermé', id: 'sanctions' },
    {
      p: 'Si ton compte est fermé pour un manquement grave aux [conditions d’utilisation](@conditions), l’accès à Minimoa+ s’arrête aussi. Pense à annuler l’abonnement dans les réglages de ton iPhone. Si on arrête le service, on te prévient au moins 30 jours avant, et on t’indique comment obtenir un remboursement de la période non utilisée.',
    },

    { h2: 'Le reste', id: 'reste' },
    {
      p: 'Ces conditions complètent les [conditions d’utilisation](@conditions), qui s’appliquent aussi à Minimoa+ (notamment le droit applicable et la médiation). Les conditions d’Apple s’appliquent à l’achat lui-même. Une question : {{email.support}}.',
    },
  ],
};
