/**
 * Questions fréquentes de la landing dans une langue : la même liste pour la section affichée
 * (components/organisms/landing/FaqSection.astro) et pour le JSON-LD `FAQPage` (lib/structured-data.ts).
 * Les réponses sont en HTML simple (<b>).
 */
import { OFFERS, TRIAL_DAYS } from '@blowy/domain';
import { formatPrice } from '@blowy/content';
import { landingText } from '../content/landing-text';
import type { Locale } from '../i18n/site';

export function faqItems(locale: Locale): { q: string; a: string }[] {
  const c = landingText[locale].faq;
  const price = (minor: number) => formatPrice(locale, minor, 'EUR');
  return [...c.items, { q: c.price.q, a: c.price.a(price(OFFERS.yearly.amountMinor), TRIAL_DAYS, price(OFFERS.monthly.amountMinor), price(OFFERS.weekly.amountMinor)) }];
}
