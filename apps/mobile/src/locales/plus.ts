/**
 * Textes de la feuille Blowy+ (paywall de l'inscription, « Moi › Blowy+ », points d'entrée `openPlus`). Les faits (offres,
 * avantages, frise de l'essai, mentions, nombre de personnes compatibles) viennent de l'API dans la langue de l'app ;
 * ici, seulement ce que l'app compose elle-même. Un prix n'est jamais écrit dans une phrase : il arrive mis en forme.
 */
import { TODO } from '@blowy/content';
import { messages } from './runtime';

const up = (s: string): string => s.toUpperCase();

export const plus = messages({
  fr: {
    brand: 'blowy',
    /** Ligne estompée sous « BLOWY+ » : ce que la personne vient d'essayer de faire. */
    headline: {
      generic: (pet: string) => `${up(pet)} EN VEUT PLUS.`,
      onboarding: (pet: string) => `${up(pet)} EN VEUT PLUS.`,
      premium_item: (item: string) => `${up(item)}, ÇA LUI IRAIT BIEN.`,
      map: 'TOUTE LA CARTE, PAS QUE TA ZONE.',
      change_city: 'CHANGE DE VILLE SANS BOUGER.',
      habits_limit: 'JUSQU’À 6 HABITUDES.',
      rename: (pet: string) => `RENOMME ${up(pet)} QUAND TU VEUX.`,
      detailed_review: 'TON BILAN, EN DÉTAIL.',
      jokers: 'PLUS DE JOKERS POUR TA SÉRIE.',
      encounters: 'PLUS DE RENCONTRES.',
    },
    plan: { yearly: 'Annuel', monthly: 'Mensuel' },
    lead: {
      trial: (plan: string, days: number) => `${plan} · ${days} jours gratuits, puis`,
      noTrial: (plan: string) => `${plan}, sans essai`,
    },
    /** Montant facturé à partir du prix du magasin (« 59,88 € »). */
    price: { year: (p: string) => `${p} par an`, month: (p: string) => `${p} par mois` },
    perMonth: (p: string) => `soit ${p} par mois`,
    badge: (percent: number) => `−${percent} %`,
    offersLabel: 'Choisis ton abonnement',
    cta: {
      trial: (days: number) => `Commencer mes ${days} jours gratuits`,
      subscribe: (price: string) => `M’abonner : ${price}`,
      unavailable: 'Disponible sur iPhone',
    },
    status: {
      pending: 'Achat en attente de validation (contrôle parental ou paiement à confirmer). Blowy+ s’ouvrira tout seul.',
      welcome: (pet: string) => `Bienvenue dans Blowy+. ${pet} est ravi.`,
      failed: 'L’achat n’a pas abouti. Rien n’a été facturé. Réessaie dans un instant.',
      activation: 'Ton achat est passé chez Apple, mais on n’a pas pu l’activer. Touche « Restaurer mes achats » dans un instant.',
      restored: 'Achats restaurés : Blowy+ est ouvert.',
      restoreNone: 'Aucun abonnement à restaurer sur ce compte Apple.',
      restoreError: 'La restauration n’a pas abouti. Réessaie.',
      loadError: 'Impossible de charger l’offre. Vérifie ta connexion.',
      unavailable: 'L’abonnement se prend pour l’instant sur iPhone, dans l’app.',
      simulated: 'Mode dev : achat simulé, rien n’est facturé.',
    },
    member: {
      title: 'Tu as Blowy+',
      fallback: 'Ton abonnement est actif.',
      manage: 'Gérer mon abonnement',
    },
    continueFree: 'Continuer gratuitement',
    restore: 'Restaurer mes achats',
    links: { terms: 'Conditions', privacy: 'Confidentialité', plusTerms: 'Conditions Blowy+' },
    /** Avantages si l'API n'a pas répondu (la feuille montre alors une erreur). */
    perksFallback: ['Toute la carte', 'Changer de ville', 'Plus de rencontres', 'Jokers de série', '6 habitudes', 'Bilan détaillé', 'Renommer librement', 'Objets premium'],
  } as const,
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
