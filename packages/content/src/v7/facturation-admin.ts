/**
 * Textes de Blowy+ (paywall, état de l'abonnement) et de la modération vus par les personnes (suspension,
 * avertissement). Dictionnaires à clés, en français ; une passe de traduction suivra.
 * Espaces insécables ( ) avant : ; ? ! et dans les montants (« 59,88 € »).
 */
import type { PlusPerk } from '@blowy/domain';
import { brand } from '../labels';

/** « 59,88 € » à partir de centimes. */
export function euros(amountMinor: number): string {
  const units = Math.floor(amountMinor / 100);
  const cents = String(amountMinor % 100).padStart(2, '0');
  return `${units},${cents} €`;
}

/** « 22 novembre » (fuseau Europe/Paris). */
export function frenchDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(new Date(iso));
}

export const plusPerkText: Readonly<Record<PlusPerk, string>> = {
  map_everywhere: 'Toute la carte, et changer de ville sans bouger',
  more_encounters: 'Plus de rencontres chaque jour',
  streak_jokers: '3 jokers de série par semaine',
  more_habits: 'Jusqu’à 6 habitudes',
  detailed_review: 'Le bilan détaillé du dimanche',
  free_rename: 'Renommer ton minimoa quand tu veux',
  premium_items: 'Les objets premium',
};

export const plusText = {
  name: { yearly: 'Abonnement annuel Blowy+', monthly: 'Abonnement mensuel Blowy+' },
  price: { year: (amount: string) => `${amount} par an`, month: (amount: string) => `${amount} par mois` },
  perMonth: (amount: string) => `soit ${amount} par mois`,
  trial: (days: number, price: string) => `${days} jours gratuits, puis ${price}`,
  timeline: (reminderDay: number, days: number) => [
    { day: 0, title: 'Aujourd’hui', text: 'Tout Blowy+ est ouvert.' },
    { day: reminderDay, title: `Jour ${reminderDay}`, text: 'On t’envoie un rappel avant la fin de l’essai.' },
    { day: days, title: `Jour ${days}`, text: 'Premier paiement, sauf si tu annules avant.' },
  ],
  teaser: (n: number) => (n === 1 ? '1 personne compatible près de chez toi' : `${n} personnes compatibles près de chez toi`),
  renewalNotice:
    'L’abonnement se renouvelle automatiquement à la fin de chaque période, au même prix, sauf si tu l’annules au moins 24 h avant. Tu peux l’annuler à tout moment dans les réglages de ton identifiant Apple (Abonnements). Le paiement est prélevé sur ton compte Apple.',
  continueFree: 'Continuer gratuitement',
  restore: 'Restaurer mes achats',
  summary: {
    none: 'Tu n’as pas Blowy+.',
    trial: (end: string, renews: boolean) => (renews ? `Essai gratuit jusqu’au ${end}. Premier paiement ce jour-là.` : `Essai gratuit jusqu’au ${end}. Il ne sera pas renouvelé.`),
    active: (end: string, renews: boolean) => (renews ? `Blowy+ se renouvelle le ${end}.` : `Blowy+ jusqu’au ${end}, sans renouvellement.`),
    grace: 'Le paiement n’est pas passé. Blowy+ reste ouvert le temps de mettre à jour ton moyen de paiement.',
    billing_retry: 'Le paiement n’est pas passé. Mets à jour ton moyen de paiement dans les réglages Apple pour retrouver Blowy+.',
    expired: 'Ton abonnement Blowy+ est terminé.',
    refunded: 'Ton abonnement a été remboursé.',
    revoked: 'Ton accès partagé à Blowy+ a été retiré.',
  },
  errors: {
    invalidPurchase: 'On n’a pas pu vérifier cet achat. Réessaie, ou utilise « Restaurer mes achats ».',
    unknownProduct: 'Ce produit n’est pas un abonnement Blowy+.',
    otherAccount: 'Cet achat appartient à un autre compte Blowy.',
  },
} as const;

/** Textes de la modération vus par la personne concernée. */
export const moderationText = {
  suspended: (until: string | null) =>
    until
      ? `Ton compte est suspendu jusqu’au ${frenchDate(until)}, après des signalements. Une question ? Écris-nous à ${brand.supportEmail}.`
      : `Ton compte est suspendu, après des signalements. Une question ? Écris-nous à ${brand.supportEmail}.`,
  warningEmail: (input: { displayName: string; reason: string }) => {
    const subject = 'Un avertissement de l’équipe Blowy';
    const lines = [
      `Salut ${input.displayName},`,
      'Quelqu’un t’a signalé·e et on a regardé. Cette fois, c’est un avertissement :',
      input.reason,
      'Blowy marche parce que chacun s’y sent bien. Si ça se reproduit, ton compte pourra être suspendu.',
      `Tu penses qu’on se trompe ? Réponds à ce message ou écris à ${brand.supportEmail}.`,
    ];
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:32px 16px;background:#0B0A14;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#F4F2FF">${lines
      .map((l) => `<p style="max-width:520px;margin:0 auto 16px;font-size:16px;line-height:1.5">${esc(l)}</p>`)
      .join('')}</body></html>`;
    return { subject, html, text: lines.join('\n\n') };
  },
} as const;
