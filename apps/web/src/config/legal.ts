/**
 * Informations légales affichées sur les pages /legal/** (toutes langues).
 *
 * Chaque champ encore inconnu vaut TODO : il n'apparaît jamais sur le site. La ligne, le paragraphe ou la ligne de
 * tableau qui le cite est omis (voir `known` et src/lib/legal-render.ts), et le build échoue si « À COMPLÉTER » reste
 * dans dist (scripts/check-no-todo.mjs, sauf ALLOW_TODO=1).
 * Ne jamais inventer un identifiant, une adresse ou un prestataire : remplacer TODO par la valeur réelle, avec sa source.
 * Le contenu des pages (src/content/legal/<langue>/<page>.ts) lit ces champs par leur clé, ex. {{publisher.siren}}.
 * Un champ peut valoir un texte unique (nom, adresse) ou un texte par langue (`L(fr, en, es, pt, nl)`).
 */
import type { Locale } from '../i18n/legal';

/** Valeur à compléter par le propriétaire avant la mise en ligne. */
export const TODO = 'À COMPLÉTER';

/** Un texte par langue. */
export type Localized = Readonly<Record<Locale, string>>;
/** Valeur d'un champ légal : la même dans toutes les langues, ou traduite. */
export type LegalValue = string | Localized;

/** Texte traduit, dans l'ordre des langues du site. */
export const L = (fr: string, en: string, es: string, pt: string, nl: string): Localized => ({ fr, en, es, pt, nl });

/** Vrai si la valeur est connue (pas TODO) : seules les valeurs connues s'affichent. */
export const known = (v: LegalValue | undefined): v is LegalValue => v !== undefined && v !== TODO;

/** La valeur dans une langue. */
export const inLocale = (v: LegalValue, locale: Locale): string => (typeof v === 'string' ? v : v[locale]);

/** Date de dernière mise à jour des pages légales (affichée dans chaque langue). */
export const LEGAL_UPDATED_ISO = '2026-11-21';

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
  support: 'support@minimoa.app',
  /** Exercice des droits sur les données personnelles. */
  privacy: 'privacy@minimoa.app',
  /** Signalements urgents et sécurité des enfants. */
  safety: 'safety@minimoa.app',
} as const;

/**
 * Délégué à la protection des données : aucun n'est désigné (pas obligatoire ici, article 37 du RGPD). Chaque langue
 * le dit en toutes lettres dans confidentialite.ts (« Responsable »), et renvoie les demandes à `CONTACT.privacy`.
 * Si un DPO est désigné un jour : ajouter son nom ici et changer cette phrase dans les cinq langues.
 */
export const DPO = { designated: false } as const;

/**
 * Hébergeur du site minimoa.app (article 6 III de la LCEN) : Cloudflare Pages.
 * Raison sociale, adresse et téléphone : politique de confidentialité de Cloudflare, https://www.cloudflare.com/privacypolicy/
 * (lue le 18 novembre 2026).
 */
export const SITE_HOST = {
  name: 'Cloudflare, Inc.',
  address: '101 Townsend St, San Francisco, CA 94107, USA',
  phone: '+1 (650) 319-8930',
} as const;

/**
 * Hébergeur des données de l'application (base, authentification, fichiers) : Supabase, projet en région eu-west-3
 * (Paris), sur l'infrastructure d'Amazon Web Services. `backupRetention` : combien de temps ses sauvegardes gardent une
 * donnée effacée (offre Pro).
 * - Entité contractante et adresse : conditions de Supabase, section 1(j), https://supabase.com/terms (« Supabase Pte.
 *   Ltd., a Singapore corporate entity […] 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513 »).
 * - Pas de téléphone publié : on donne la page de contact officielle, https://supabase.com/contact-us.
 * - Région : projet « blowy » en eu-west-3 (Supabase, liste des projets, 18 novembre 2026).
 * - Sauvegardes : https://supabase.com/docs/guides/platform/backups (« Pro Plan projects can access the last 7 days of
 *   daily backups »).
 */
export const DATA_HOST = {
  name: 'Supabase Pte. Ltd.',
  address: '65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513',
  contact: 'https://supabase.com/contact-us',
  region: L(
    'Union européenne (Paris, France)',
    'European Union (Paris, France)',
    'Unión Europea (París, Francia)',
    'União Europeia (Paris, França)',
    'Europese Unie (Parijs, Frankrijk)',
  ),
  backupRetention: L('au plus 7 jours', 'at most 7 days', '7 días como máximo', '7 dias no máximo', 'hoogstens 7 dagen'),
} as const;

/**
 * Médiateur de la consommation (article L612-1 du Code de la consommation). Tant que le nom vaut TODO, la page des
 * conditions n'en parle pas du tout (paragraphe d'annonce compris, voir `requires` dans conditions.ts).
 */
export const MEDIATOR = { name: TODO, address: TODO, website: TODO } as const;

// Garanties de transfert, réutilisées par plusieurs prestataires.
const SCC = L(
  'Clauses contractuelles types de la Commission européenne',
  'European Commission standard contractual clauses',
  'Cláusulas contractuales tipo de la Comisión Europea',
  'Cláusulas contratuais-tipo da Comissão Europeia',
  'Modelcontractbepalingen van de Europese Commissie',
);
const DPF_AND_SCC = L(
  'Certification EU-U.S. Data Privacy Framework, et clauses contractuelles types',
  'EU-U.S. Data Privacy Framework certification, and standard contractual clauses',
  'Certificación EU-U.S. Data Privacy Framework y cláusulas contractuales tipo',
  'Certificação EU-U.S. Data Privacy Framework e cláusulas contratuais-tipo',
  'Certificering onder het EU-U.S. Data Privacy Framework, en modelcontractbepalingen',
);
const US = L('États-Unis', 'United States', 'Estados Unidos', 'Estados Unidos', 'Verenigde Staten');

/**
 * Sous-traitants (article 28 du RGPD). Le rôle de chacun est décrit dans le contenu de chaque langue
 * (clé identique). Renseigner le prestataire, le pays où les données sont traitées, et la garantie
 * de transfert si ce pays est hors de l'Union européenne. Sources lues le 18 novembre 2026 :
 */
export const SUBPROCESSORS = {
  /**
   * Données à Paris (projet eu-west-3), mais Supabase Pte. Ltd. est à Singapour et son équipe peut y accéder de hors UE :
   * son DPA incorpore les clauses contractuelles types, modules 2 et 3 (https://supabase.com/legal/dpa, clause 12 et
   * annexe 2 ; pas de mention du Data Privacy Framework).
   */
  database: {
    provider: 'Supabase',
    location: L('France (Paris)', 'France (Paris)', 'Francia (París)', 'França (Paris)', 'Frankrijk (Parijs)'),
    safeguard: L(
      'Données dans l’UE ; clauses contractuelles types pour l’accès depuis l’extérieur de l’UE',
      'Data in the EU; standard contractual clauses for access from outside the EU',
      'Datos en la UE; cláusulas contractuales tipo para el acceso desde fuera de la UE',
      'Dados na UE; cláusulas contratuais-tipo para o acesso de fora da UE',
      'Gegevens in de EU; modelcontractbepalingen voor toegang van buiten de EU',
    ),
  },
  /**
   * Service « api » du projet Railway « blowy » : région europe-west4-drams3a (configuration du service, 18 novembre
   * 2026) = « EU West Metal: Amsterdam, Netherlands » (https://docs.railway.com/reference/deployment-regions).
   * Railway Corporation (États-Unis) : DPA avec clauses contractuelles types, modules 1 à 3 (https://railway.com/legal/dpa).
   */
  api: {
    provider: 'Railway',
    location: L('Pays-Bas (Amsterdam)', 'Netherlands (Amsterdam)', 'Países Bajos (Ámsterdam)', 'Países Baixos (Amsterdã)', 'Nederland (Amsterdam)'),
    safeguard: L(
      'Données dans l’UE ; clauses contractuelles types pour l’accès depuis l’extérieur de l’UE',
      'Data in the EU; standard contractual clauses for access from outside the EU',
      'Datos en la UE; cláusulas contractuales tipo para el acceso desde fuera de la UE',
      'Dados na UE; cláusulas contratuais-tipo para o acesso de fora da UE',
      'Gegevens in de EU; modelcontractbepalingen voor toegang van buiten de EU',
    ),
  },
  /**
   * Anthropic : DPA avec clauses contractuelles types, modules 2 et 3, sans mention du Data Privacy Framework
   * (https://www.anthropic.com/legal/data-processing-addendum, section I.1).
   */
  ai: { provider: 'Anthropic', location: US, safeguard: SCC },
  /**
   * Resend (Plus Five Five, Inc.) : « primary processing operations take place in the United States » (section 6.1),
   * clauses contractuelles types (6.2) et « complies with the EU-U.S. Data Privacy Framework » (11.1),
   * https://resend.com/legal/dpa.
   */
  email: { provider: 'Resend', location: US, safeguard: DPF_AND_SCC },
  /**
   * Expo (650 Industries, Inc.) : auto-certifié au Data Privacy Framework (https://expo.dev/changelog/2024-12-17-dpf-replaces-privacy-shield).
   * Apple (APNs) : transferts hors EEE encadrés par les clauses contractuelles types (https://www.apple.com/legal/privacy/en-ww/).
   */
  push: {
    provider: L(
      'Expo et Apple (service de notifications)',
      'Expo and Apple (notification service)',
      'Expo y Apple (servicio de notificaciones)',
      'Expo e Apple (serviço de notificações)',
      'Expo en Apple (meldingsdienst)',
    ),
    location: US,
    safeguard: L(
      'Expo : certification EU-U.S. Data Privacy Framework ; Apple : clauses contractuelles types',
      'Expo: EU-U.S. Data Privacy Framework certification; Apple: standard contractual clauses',
      'Expo: certificación EU-U.S. Data Privacy Framework; Apple: cláusulas contractuales tipo',
      'Expo: certificação EU-U.S. Data Privacy Framework; Apple: cláusulas contratuais-tipo',
      'Expo: certificering onder het EU-U.S. Data Privacy Framework; Apple: modelcontractbepalingen',
    ),
  },
  /** Apple : « international transfer of personal data collected in the European Economic Area […] is governed by » des clauses contractuelles types (https://www.apple.com/legal/privacy/en-ww/). */
  maps: {
    provider: L('Apple (Plans)', 'Apple (Maps)', 'Apple (Mapas)', 'Apple (Mapas)', 'Apple (Kaarten)'),
    location: US,
    safeguard: SCC,
  },
  /**
   * Amplitude, Inc. (San Francisco, États-Unis), statistiques d'usage de l'app, seulement avec l'accord de la personne :
   * « Amplitude is self-certified under the EU-US Data Privacy Framework (DPF) » et « Amplitude's Data Processing
   * Agreements (DPAs) incorporate the EU Standard Contractual Clauses (SCCs) » (https://amplitude.com/security-and-privacy,
   * lu le 18 novembre 2026). Projet en région US (`serverZone: 'US'`).
   */
  analytics: { provider: 'Amplitude', location: US, safeguard: DPF_AND_SCC },
  /**
   * Cloudflare, Inc. : certifié au Data Privacy Framework (https://www.cloudflare.com/privacypolicy/) ; son DPA prévoit les
   * clauses contractuelles types si la certification tombe (https://www.cloudflare.com/en-us/dpa/, clauses 6.2 et 6.4).
   * Pages servies depuis le réseau mondial de Cloudflare, au plus près du visiteur.
   */
  site: {
    provider: 'Cloudflare (Pages)',
    location: L(
      'États-Unis et réseau mondial de Cloudflare',
      'United States and Cloudflare’s global network',
      'Estados Unidos y red mundial de Cloudflare',
      'Estados Unidos e rede mundial da Cloudflare',
      'Verenigde Staten en het wereldwijde netwerk van Cloudflare',
    ),
    safeguard: DPF_AND_SCC,
  },
} as const;

export type SubprocessorKey = keyof typeof SUBPROCESSORS;

/**
 * Ce que le prestataire d'IA (`SUBPROCESSORS.ai`) garde de son côté et combien de temps. Le nom et le pays doivent
 * rester ceux de `AI_PROVIDER_NAME` et `AI_PROVIDER_COUNTRY` côté API (phrase d'accord servie dans l'app).
 * Source : offre commerciale (API) d'Anthropic, lue le 18 novembre 2026 :
 * - https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-commercial-api-data (« we automatically delete
 *   inputs and outputs on our backend within 30 days » ; contenu signalé comme contraire à ses règles d'usage : jusqu'à
 *   2 ans, scores de sécurité jusqu'à 7 ans) ;
 * - https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training (« By default, we will not use
 *   your inputs or outputs from our commercial products »).
 * À relire si un accord particulier (rétention zéro, par exemple) est signé avec Anthropic.
 */
export const AI_TERMS = {
  retention: L(
    'effacé de ses serveurs sous 30 jours, sauf un contenu repéré comme contraire à ses règles d’usage (gardé jusqu’à 2 ans) ; jamais utilisé pour entraîner ses modèles',
    'deleted from its servers within 30 days, except content flagged as breaching its usage policy (kept for up to 2 years); never used to train its models',
    'se borra de sus servidores en un plazo de 30 días, salvo un contenido detectado como contrario a sus normas de uso (conservado hasta 2 años); nunca se usa para entrenar sus modelos',
    'apagado dos servidores do fornecedor em até 30 dias, exceto conteúdo identificado como contrário às regras de uso dele (guardado por até 2 anos); nunca usado para treinar os modelos dele',
    'binnen 30 dagen van zijn servers gewist, behalve inhoud die als in strijd met zijn gebruiksregels is aangemerkt (tot 2 jaar bewaard); nooit gebruikt om zijn modellen te trainen',
  ),
} as const;

/**
 * Table plate des champs lisibles depuis le contenu ({{clé}}). Les clés « email.* » s'affichent en lien mailto, une
 * valeur en https:// en lien.
 */
export const LEGAL_FIELDS: Record<string, LegalValue> = {
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
  'siteHost.name': SITE_HOST.name,
  'siteHost.address': SITE_HOST.address,
  'siteHost.phone': SITE_HOST.phone,
  'dataHost.name': DATA_HOST.name,
  'dataHost.address': DATA_HOST.address,
  'dataHost.contact': DATA_HOST.contact,
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
