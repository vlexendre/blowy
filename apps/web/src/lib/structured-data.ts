/**
 * Données structurées (JSON-LD, schema.org) du site. Chaque page porte l'éditeur (`Organization`) et le site
 * (`WebSite`) ; la landing y ajoute l'app (`MobileApplication`) et sa FAQ (`FAQPage`, mêmes questions et réponses que
 * la section affichée) ; le quiz et le quartier une `WebPage` avec fil d'Ariane ; les pages légales un `BreadcrumbList`.
 * Rien d'inventé : pas de note ni d'avis (aggregateRating, review), `sameAs` vide tant qu'aucun compte public n'existe.
 * Contrôlé après le build par scripts/check-structured-data.mjs.
 */
import { APP_STORE_ID, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from '../config/site';
import { PUBLISHER } from '../config/legal';

type Node = Record<string, unknown>;

const abs = (path: string) => new URL(path, SITE_URL).href;
export const ORG_ID = abs('/#organization');
export const WEBSITE_ID = abs('/#website');
export const APP_ID = abs('/#app');
/** Fiche App Store (même identifiant que la bannière `apple-itunes-app`). */
export const APP_STORE_PAGE = `https://apps.apple.com/app/id${APP_STORE_ID}`;
/** Comptes publics de la marque (réseaux sociaux…) : aucun pour l'instant. */
const SAME_AS: string[] = [];
/** Langues des pages du site (attribut lang). */
const SITE_LANGUAGES = ['fr', 'en', 'es', 'pt-BR', 'nl'];

export function organization(): Node {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: PUBLISHER.name,
    url: abs('/'),
    logo: { '@type': 'ImageObject', url: abs('/icon-512.png'), width: 512, height: 512 },
    email: SUPPORT_EMAIL,
    brand: { '@type': 'Brand', name: SITE_NAME },
    sameAs: SAME_AS,
  };
}

export function website(): Node {
  return { '@type': 'WebSite', '@id': WEBSITE_ID, url: abs('/'), name: SITE_NAME, inLanguage: SITE_LANGUAGES, publisher: { '@id': ORG_ID } };
}

/** L'app iOS, gratuite (Minimoa+ est un abonnement facultatif, dans l'app). */
export function mobileApplication(o: { description: string; inLanguage: string }): Node {
  return {
    '@type': 'MobileApplication',
    '@id': APP_ID,
    name: SITE_NAME,
    description: o.description,
    url: APP_STORE_PAGE,
    installUrl: APP_STORE_PAGE,
    image: abs('/icon-512.png'),
    operatingSystem: 'iOS',
    applicationCategory: 'SocialNetworkingApplication',
    inLanguage: o.inLanguage,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR', category: 'free' },
    publisher: { '@id': ORG_ID },
  };
}

/** FAQ : `answer` est le texte brut de la réponse affichée (voir plainText). */
export function faqPage(o: { url: string; inLanguage: string; items: { question: string; answer: string }[] }): Node {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(o.url)}#faq`,
    url: abs(o.url),
    inLanguage: o.inLanguage,
    mainEntity: o.items.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
  };
}

/** Fil d'Ariane : du plus général (l'accueil) à la page elle-même. */
export function breadcrumb(items: { name: string; path: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function webPage(o: { path: string; name: string; description: string; inLanguage: string; crumbs: { name: string; path: string }[] }): Node {
  return {
    '@type': 'WebPage',
    '@id': abs(o.path),
    url: abs(o.path),
    name: o.name,
    description: o.description,
    inLanguage: o.inLanguage,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    breadcrumb: breadcrumb(o.crumbs),
  };
}

/** Nom d'une page tiré de son <title> (« Quel minimoa es-tu ? — Minimoa » → « Quel minimoa es-tu ? »). */
export const pageName = (title: string): string => title.replace(/\s+[—–-]\s+Minimoa$/, '').trim();

/** Texte brut d'un HTML simple (balises retirées, entités courantes décodées, espaces normalisés). */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Graphe JSON-LD complet d'une page, sérialisé sans risque dans un <script> (« < » échappé). */
export function jsonLd(nodes: Node[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization(), website(), ...nodes] }).replace(/</g, '\\u003c');
}
