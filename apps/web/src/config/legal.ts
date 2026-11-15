/**
 * Informations légales affichées sur les pages /legal/** (toutes langues).
 *
 * Chaque champ encore inconnu vaut TODO : il s'affiche en surligné « À COMPLÉTER » sur le site.
 * Ne jamais inventer un identifiant, une adresse ou un prestataire : remplacer TODO par la valeur réelle.
 * Le contenu des pages (src/content/legal/<langue>/<page>.ts) lit ces champs par leur clé, ex. {{publisher.siren}}.
 */

/** Valeur à compléter par le propriétaire avant la mise en ligne. */
export const TODO = 'À COMPLÉTER';

/** Date de dernière mise à jour des pages légales (affichée dans chaque langue). */
export const LEGAL_UPDATED_ISO = '2026-11-15';

/** Éditeur du site et de l'application. */
export const PUBLISHER = {
  /** Dénomination sociale. */
  name: 'Avec Trois E',
  /** Forme juridique (SAS, SARL…). */
  legalForm: TODO,
  /** Capital social, ex. « 1 000 € ». */
  shareCapital: TODO,
  /** Numéro SIREN et ville du RCS, ex. « 123 456 789 RCS Paris ». */
  registration: TODO,
  /** Numéro de TVA intracommunautaire. */
  vatNumber: TODO,
  /** Adresse du siège social. */
  address: TODO,
  /** Téléphone (exigé par l'article 6 III de la LCEN). */
  phone: TODO,
  /** Directeur ou directrice de la publication (nom et qualité). */
  publicationDirector: TODO,
} as const;

/** Adresses de contact. Une adresse peut servir à plusieurs usages. */
export const CONTACT = {
  /** Assistance générale, point de contact unique (DSA). */
  support: TODO,
  /** Exercice des droits sur les données personnelles. */
  privacy: TODO,
  /** Signalements urgents et sécurité des enfants. */
  safety: TODO,
} as const;

/** Délégué à la protection des données (nom ou « non désigné »). */
export const DPO = { name: TODO } as const;

/** Hébergeur du site blowy.app (article 6 III de la LCEN). */
export const SITE_HOST = { name: TODO, address: TODO, phone: TODO } as const;

/** Hébergeur des données de l'application (base, authentification, fichiers). */
export const DATA_HOST = { name: TODO, address: TODO, phone: TODO, region: TODO } as const;

/** Médiateur de la consommation (article L612-1 du Code de la consommation). */
export const MEDIATOR = { name: TODO, address: TODO, website: TODO } as const;

/**
 * Sous-traitants (article 28 du RGPD). Le rôle de chacun est décrit dans le contenu de chaque langue
 * (clé identique). Renseigner le prestataire, le pays où les données sont traitées, et la garantie
 * de transfert si ce pays est hors de l'Union européenne.
 */
export const SUBPROCESSORS = {
  database: { provider: TODO, location: TODO, safeguard: TODO },
  api: { provider: TODO, location: TODO, safeguard: TODO },
  ai: { provider: TODO, location: TODO, safeguard: TODO },
  email: { provider: TODO, location: TODO, safeguard: TODO },
  push: { provider: TODO, location: TODO, safeguard: TODO },
  maps: { provider: TODO, location: TODO, safeguard: TODO },
  site: { provider: TODO, location: TODO, safeguard: TODO },
} as const;

export type SubprocessorKey = keyof typeof SUBPROCESSORS;

/**
 * Table plate des champs lisibles depuis le contenu ({{clé}}). Les clés « email.* » s'affichent en lien mailto.
 */
export const LEGAL_FIELDS: Record<string, string> = {
  'publisher.name': PUBLISHER.name,
  'publisher.legalForm': PUBLISHER.legalForm,
  'publisher.shareCapital': PUBLISHER.shareCapital,
  'publisher.registration': PUBLISHER.registration,
  'publisher.vatNumber': PUBLISHER.vatNumber,
  'publisher.address': PUBLISHER.address,
  'publisher.phone': PUBLISHER.phone,
  'publisher.publicationDirector': PUBLISHER.publicationDirector,
  'email.support': CONTACT.support,
  'email.privacy': CONTACT.privacy,
  'email.safety': CONTACT.safety,
  'dpo.name': DPO.name,
  'siteHost.name': SITE_HOST.name,
  'siteHost.address': SITE_HOST.address,
  'siteHost.phone': SITE_HOST.phone,
  'dataHost.name': DATA_HOST.name,
  'dataHost.address': DATA_HOST.address,
  'dataHost.phone': DATA_HOST.phone,
  'dataHost.region': DATA_HOST.region,
  'mediator.name': MEDIATOR.name,
  'mediator.address': MEDIATOR.address,
  'mediator.website': MEDIATOR.website,
  ...Object.fromEntries(
    Object.entries(SUBPROCESSORS).flatMap(([k, v]) => [
      [`sub.${k}.provider`, v.provider],
      [`sub.${k}.location`, v.location],
      [`sub.${k}.safeguard`, v.safeguard],
    ]),
  ),
};
