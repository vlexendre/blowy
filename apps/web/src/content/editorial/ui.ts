/**
 * Textes communs des pages éditoriales (villes, guides), en français seulement : ces pages n'ont pas de version
 * traduite (voir ./types.ts).
 */
import type { Meta, OgSpec } from './types';

export const editorialUi = {
  home: 'Accueil',
  breadcrumbLabel: 'Fil d’Ariane',
  /** pied de page (français seulement) */
  footer: { label: 'Découvrir', cities: 'Villes', guides: 'Guides' },
  /** landing (français) : lien discret sous la FAQ */
  landing: { before: 'Tu viens d’arriver quelque part ?', cities: 'Se faire des amis dans ta ville', guides: 'nos guides' },
  cities: {
    path: '/se-faire-des-amis/',
    crumb: 'Se faire des amis',
    meta: {
      title: 'Se faire des amis dans ta ville : 11 villes',
      description: 'Paris, Lyon, Bordeaux, Toulouse, Nantes, Lille… Où rencontrer des gens dans ta ville, comment s’y prendre, et comment ouvrir ton quartier sur Minimoa.',
    } satisfies Meta,
    h1: 'Se faire des amis dans ta ville',
    lead: 'Chaque ville a ses quartiers, ses rituels et ses endroits où l’on se parle plus facilement. Choisis la tienne : on te dit où commencer, sans liste de bars sponsorisés.',
    listTitle: 'Les villes',
    cardMore: 'Lire',
    otherTitle: 'Ta ville n’est pas dans la liste ?',
    otherText: 'Minimoa ouvre quartier par quartier, partout en France. Tape ton code postal sur la page [Ouvre ton quartier](/quartier/) : à 50 inscrits, ton quartier ouvre.',
    og: { lines: ['SE FAIRE', 'DES AMIS', 'DANS TA VILLE.'], panel: 'accent' } satisfies OgSpec,
    ogAlt: 'Trois minimoas qui se tapent dans la main, à côté du titre « Se faire des amis dans ta ville. »',
  },
  city: {
    nearTitle: 'Villes proches',
    guidesTitle: 'Pour aller plus loin',
    faqTitle: 'Questions fréquentes',
    quizTitle: 'Quel minimoa es-tu ?',
    quizText: 'Le quiz prend deux minutes, sans compte. Il te dit quel minimoa te ressemble, et avec quel genre de personnes tu t’entendrais.',
    quizCta: 'Faire le quiz',
    updated: 'Mis à jour le',
  },
  quartier: {
    label: 'Ouvre ton quartier',
    title: 'Ton quartier ouvre à 50.',
    single: 'Ouvrir {zone}',
    pick: 'Choisis ton arrondissement',
    other: 'Autre quartier ou code postal',
    /** nom d'un arrondissement : « Paris 11e » */
    district: (city: string, n: number) => `${city} ${n}${n === 1 ? 'er' : 'e'}`,
  },
  guides: {
    path: '/guides/',
    crumb: 'Guides',
    meta: {
      title: 'Guides pour se faire des amis — Minimoa',
      description: 'Se faire des amis adulte, quand on est timide, dans une nouvelle ville, quand on est seul : des guides honnêtes et concrets, avec leurs sources.',
    } satisfies Meta,
    h1: 'Guides pour se faire des amis',
    lead: 'Des conseils concrets, des études sérieuses, zéro méthode miracle. Écrits pour les adultes qui veulent plus de monde autour d’eux, et qui ne savent pas trop par où commencer.',
    listTitle: 'Les guides',
    og: { lines: ['SE FAIRE', 'DES AMIS,', 'LE GUIDE.'], panel: 'violet' } satisfies OgSpec,
    ogAlt: 'Quatre minimoas côte à côte, à côté du titre « Se faire des amis, le guide. »',
  },
  guide: {
    by: 'Par',
    author: 'L’équipe Minimoa',
    published: 'Publié le',
    updated: 'mis à jour le',
    reading: (min: number) => `${min} min de lecture`,
    tocTitle: 'Au sommaire',
    faqTitle: 'Questions fréquentes',
    sourcesTitle: 'Sources',
    relatedTitle: 'D’autres guides',
    citiesTitle: 'Dans ta ville',
  },
  cta: {
    title: 'Et si ton minimoa te présentait du monde ?',
    text: 'Minimoa, c’est un petit compagnon à élever, qui te présente des gens près de chez toi qui voient la vie comme toi. Gratuit, zéro swipe, 18 ans et plus.',
    quiz: 'Quel minimoa es-tu ?',
    quartier: 'Ouvre ton quartier',
  },
} as const;

/** Date AAAA-MM-JJ en toutes lettres (« 18 novembre 2026 »). */
export function frDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
