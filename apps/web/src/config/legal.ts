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
  legalForm: 'SAS (société par actions simplifiée)',
  /** Capital social, ex. « 1 000 € ». */
  shareCapital: TODO,
  /** Numéro SIREN et ville du RCS, ex. « 123 456 789 RCS Paris ». */
  registration: '914 595 657 RCS Nanterre',
  /** Numéro de TVA intracommunautaire. */
  vatNumber: 'FR72914595657',
  /** Adresse du siège social. */
  address: '47 quai Carnot, 92210 Saint-Cloud',
  /** Téléphone (exigé par l'article 6 III de la LCEN). */
  phone: TODO,
  /** Directeur ou directrice de la publication (nom et qualité). */
  publicationDirector: 'Alexendre Obli, président',
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

/**
 * Hébergeur des données de l'application (base, authentification, fichiers). `backupRetention` : combien de temps ses
 * sauvegardes gardent une donnée effacée (selon l'offre souscrite, ex. « 7 jours »).
 */
export const DATA_HOST = { name: TODO, address: TODO, phone: TODO, region: TODO, backupRetention: TODO } as const;

/** Médiateur de la consommation (article L612-1 du Code de la consommation). */
export const MEDIATOR = { name: TODO, address: TODO, website: TODO } as const;

/**
 * Sous-traitants (article 28 du RGPD). Le rôle de chacun est décrit dans le contenu de chaque langue
 * (clé identique). Renseigner le prestataire, le pays où les données sont traitées, et la garantie
 * de transfert si ce pays est hors de l'Union européenne.
 */
export const SUBPROCESSORS = {
  database: { provider: 'Supabase', location: 'France (Paris)', safeguard: TODO },
  api: { provider: 'Railway', location: 'Pays-Bas', safeguard: TODO },
  ai: { provider: 'Anthropic', location: 'États-Unis', safeguard: TODO },
  email: { provider: 'Resend', location: TODO, safeguard: TODO },
  push: { provider: 'Expo et Apple (service de notifications)', location: 'États-Unis', safeguard: TODO },
  maps: { provider: 'Apple (Plans)', location: TODO, safeguard: TODO },
  site: { provider: TODO, location: TODO, safeguard: TODO },
} as const;

export type SubprocessorKey = keyof typeof SUBPROCESSORS;

/**
 * Ce que le prestataire d'IA (`SUBPROCESSORS.ai`) garde de son côté et combien de temps, tel que le dit le contrat
 * signé avec lui (ex. « au plus 30 jours, pour la sécurité ; jamais pour entraîner ses modèles »). Rien d'autre ne
 * doit être affirmé sur ce point dans les pages. Le nom et le pays doivent rester ceux de `AI_PROVIDER_NAME` et
 * `AI_PROVIDER_COUNTRY` côté API (phrase d'accord servie dans l'app).
 */
export const AI_TERMS = { retention: TODO } as const;

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
  'dataHost.backupRetention': DATA_HOST.backupRetention,
  'ai.retention': AI_TERMS.retention,
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
