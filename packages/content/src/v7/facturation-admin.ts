/**
 * Textes de Blowy+ (paywall, état de l'abonnement) et de la modération vus par les personnes (suspension,
 * avertissement), par langue. Les montants et les dates arrivent déjà mis en forme (`formatPrice`, `formatDate`).
 * L'interface d'administration (apps/admin) est interne : elle reste en français et n'est pas ici.
 */
import type { Locale, PlusPerk } from '@blowy/domain';
import { TODO, defineMessages, formatDate, formatPrice } from '../i18n/core';
import { brand } from '../labels';

/** « 59,88 € » à partir de centimes (français). Préférer `formatPrice(locale, …)`. */
export const euros = (amountMinor: number): string => formatPrice('fr', amountMinor, 'EUR');

/** « 22 novembre » (fuseau Europe/Paris, français). Préférer `formatDate(locale, …)`. */
export const frenchDate = (iso: string): string => formatDate('fr', iso);

interface WarningInput {
  displayName: string;
  reason: string;
}

const fr = {
  perks: {
    map_everywhere: 'Toute la carte, et changer de ville sans bouger',
    more_encounters: 'Plus de rencontres chaque jour',
    streak_jokers: '3 jokers de série par semaine',
    more_habits: 'Jusqu’à 6 habitudes',
    detailed_review: 'Le bilan détaillé du dimanche',
    free_rename: 'Renommer ton minimoa quand tu veux',
    premium_items: 'Tous les objets premium de la garde-robe',
  } as Record<PlusPerk, string>,
  plus: {
    name: { yearly: 'Abonnement annuel Blowy+', monthly: 'Abonnement mensuel Blowy+' },
    price: { year: (amount: string) => `${amount} par an`, month: (amount: string) => `${amount} par mois` },
    perMonth: (amount: string) => `soit ${amount} par mois`,
    trial: (days: number, price: string) => `${days} jours gratuits, puis ${price}`,
    timeline: (reminderDay: number, days: number) => [
      { day: 0, title: 'Aujourd’hui', text: 'Tout Blowy+ est ouvert.' },
      { day: reminderDay, title: `Jour ${reminderDay}`, text: 'On t’envoie un rappel avant la fin de l’essai.' },
      { day: days, title: `Jour ${days}`, text: 'Premier paiement, sauf si tu annules avant.' },
    ],
    teaser: (n: number) => (n === 1 ? '1 personne compatible près de chez toi' : `${n} personnes compatibles près de chez toi`),
    renewalNotice:
      'L’abonnement se renouvelle automatiquement à la fin de chaque période, au même prix, sauf si tu l’annules au moins 24 h avant. Tu peux l’annuler à tout moment dans les réglages de ton identifiant Apple (Abonnements). Le paiement est prélevé sur ton compte Apple.',
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
      invalidPurchase: 'On n’a pas pu vérifier cet achat. Réessaie, ou utilise « Restaurer mes achats ».',
      unknownProduct: 'Ce produit n’est pas un abonnement Blowy+.',
      otherAccount: 'Cet achat appartient à un autre compte Blowy.',
      notificationRejected: 'Notification refusée.',
    },
  },
  moderation: {
    suspendedUntil: (until: string) => `Ton compte est suspendu jusqu’au ${until}, après des signalements. Une question ? Écris-nous à ${brand.supportEmail}.`,
    suspended: `Ton compte est suspendu, après des signalements. Une question ? Écris-nous à ${brand.supportEmail}.`,
    warningSubject: 'Un avertissement de l’équipe Blowy',
    warningLines: (i: WarningInput) => [
      `Salut ${i.displayName},`,
      'Une personne t’a signalé et on a regardé. Cette fois, c’est un avertissement :',
      i.reason,
      'Blowy marche parce que chacun s’y sent bien. Si ça se reproduit, ton compte pourra être suspendu.',
      `Tu penses qu’on se trompe ? Réponds à ce message ou écris à ${brand.supportEmail}.`,
    ],
    /** Inscription refusée : ce compte Apple ou Google a été exclu définitivement (identifiant gardé 3 ans). */
    banned: `Ce compte a été exclu de Blowy après des manquements aux règles. Une question ? Écris-nous à ${brand.supportEmail}.`,
    /** Compte sans connexion depuis bientôt 2 ans : message de prévenance, un mois avant la suppression. */
    inactivitySubject: 'Ton compte Blowy va être supprimé',
    inactivityLines: (i: { displayName: string; deleteOn: string }) => [
      `Salut ${i.displayName},`,
      'Ça fait presque deux ans que tu n’as pas ouvert Blowy. Comme promis dans notre politique de confidentialité, on ne garde pas les comptes inactifs.',
      `Sans connexion d’ici le ${i.deleteOn}, ton compte et tout ce qui va avec (ton minimoa, tes liens, tes messages) seront supprimés.`,
      'Pour le garder, il suffit d’ouvrir l’app une fois. Sinon, tu n’as rien à faire.',
    ],
  },
};

export const facturationText = defineMessages({ fr, en: TODO, es: TODO, pt: TODO, nl: TODO });

/** Avantages de Blowy+ dans une langue. */
export const plusPerkTextIn = (locale: Locale): Readonly<Record<PlusPerk, string>> => facturationText.in(locale).perks;
/** Textes du paywall et de l'abonnement dans une langue. */
export const plusTextIn = (locale: Locale) => facturationText.in(locale).plus;

/** Textes de la modération vus par la personne concernée. */
export const moderationTextIn = (locale: Locale) => {
  const t = facturationText.in(locale).moderation;
  return {
    suspended: (until: string | null): string => (until ? t.suspendedUntil(formatDate(locale, until)) : t.suspended),
    warningEmail: (input: WarningInput) => {
      const lines = t.warningLines(input);
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const html = `<!doctype html><html lang="${locale}"><body style="margin:0;padding:32px 16px;background:#0B0A14;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#F4F2FF">${lines
        .map((l) => `<p style="max-width:520px;margin:0 auto 16px;font-size:16px;line-height:1.5">${esc(l)}</p>`)
        .join('')}</body></html>`;
      return { subject: t.warningSubject, html, text: lines.join('\n\n') };
    },
    banned: t.banned,
    inactivityEmail: (input: { displayName: string; deleteOn: string }) => {
      const lines = t.inactivityLines({ displayName: input.displayName, deleteOn: formatDate(locale, input.deleteOn) });
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const html = `<!doctype html><html lang="${locale}"><body style="margin:0;padding:32px 16px;background:#0B0A14;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#F4F2FF">${lines
        .map((l) => `<p style="max-width:520px;margin:0 auto 16px;font-size:16px;line-height:1.5">${esc(l)}</p>`)
        .join('')}</body></html>`;
      return { subject: t.inactivitySubject, html, text: lines.join('\n\n') };
    },
  };
};
