/**
 * Sources des guides, vérifiées une à une (novembre 2026) : DOI contrôlés sur Crossref, chiffres relus dans le
 * document cité. Un chiffre d'un guide renvoie toujours à l'une d'elles.
 */
import type { Source } from '../types';

export const SOURCES = {
  fdf2024: {
    label: 'Fondation de France, « Solitudes 2024 », 14e édition de l’étude annuelle sur les solitudes en France (janvier 2025)',
    url: 'https://www.fondationdefrance.org/images/pdf/2025/etude-solitudes-2024_fdf.pdf',
  },
  fdf2025: {
    label: 'Fondation de France, « Solitudes 2025 : les liens de proximité, pivots de la sociabilité », communiqué (janvier 2026)',
    url: 'https://www.fondationdefrance.org/images/pdf/2026/CP_Solitudes_2025.pdf',
  },
  oms2025: {
    label: 'Organisation mondiale de la santé, « Le lien social est associé à un meilleur état de santé et à un risque réduit de décès prématuré », 30 juin 2025',
    url: 'https://www.who.int/fr/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death',
  },
  holtLunstad2010: {
    label: 'J. Holt-Lunstad, T. B. Smith, J. B. Layton, « Social Relationships and Mortality Risk: A Meta-analytic Review », PLoS Medicine, 2010',
    url: 'https://doi.org/10.1371/journal.pmed.1000316',
  },
  hall2018: {
    label: 'J. A. Hall, « How many hours does it take to make a friend? », Journal of Social and Personal Relationships, 2018',
    url: 'https://doi.org/10.1177/0265407518761225',
  },
  boothby2018: {
    label: 'E. J. Boothby, G. Cooney, G. M. Sandstrom, M. S. Clark, « The Liking Gap in Conversations: Do People Like Us More Than We Think? », Psychological Science, 2018',
    url: 'https://doi.org/10.1177/0956797618783714',
  },
  epley2014: {
    label: 'N. Epley, J. Schroeder, « Mistakenly seeking solitude », Journal of Experimental Psychology: General, 2014',
    url: 'https://doi.org/10.1037/a0037323',
  },
  liu2023: {
    label: 'P. J. Liu, S. Rim, L. Min, K. E. Min, « The surprise of reaching out: Appreciated more than we think », Journal of Personality and Social Psychology, 2023 (en ligne en 2022)',
    url: 'https://doi.org/10.1037/pspi0000402',
  },
  sandstrom2014: {
    label: 'G. M. Sandstrom, E. W. Dunn, « Social Interactions and Well-Being: The Surprising Power of Weak Ties », Personality and Social Psychology Bulletin, 2014',
    url: 'https://doi.org/10.1177/0146167214529799',
  },
  psycom: {
    label: 'Psycom, « Troubles anxieux et phobiques », brochure d’information en santé mentale',
    url: 'https://www.psycom.org/wp-content/uploads/2024/04/PSYCOM_Brochures-A5_TP_Troubles-anxieux-et-phobiques_WEB.pdf',
  },
  santeFrEcoute: {
    label: 'Santé.fr, « Les lignes d’écoute » (SOS Amitié, Croix-Rouge écoute, 3114…)',
    url: 'https://www.sante.fr/trouver-aide-sante-mentale/selon-votre-profil/lignes-ecoute',
  },
  jeVeuxAider: {
    label: 'JeVeuxAider.gouv.fr, la plateforme publique du bénévolat',
    url: 'https://www.jeveuxaider.gouv.fr/',
  },
  servicePublicAsso: {
    label: 'Service-public.fr, « Comment se renseigner sur une association ? »',
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F12104',
  },
  meetupFree: {
    label: 'Meetup, centre d’aide, « As a member, can I still use Meetup without subscribing to Meetup+? »',
    url: 'https://help.meetup.com/hc/en-us/articles/43968489202061-As-a-member-can-I-still-use-Meetup-without-subscribing-to-Meetup',
  },
  timeleftHow: {
    label: 'Timeleft, centre d’aide, « Comment fonctionne Timeleft ? »',
    url: 'https://help.timeleft.com/hc/fr/articles/21421681409436-Comment-fonctionne-Timeleft',
  },
  timeleftStore: {
    label: 'Timeleft, fiche de l’App Store (France), consultée en novembre 2026',
    url: 'https://apps.apple.com/fr/app/timeleft/id6466442949',
  },
  bumbleBff: {
    label: 'Bumble, centre d’aide, « Changes to Bumble For Friends and Bumble BFF Mode »',
    url: 'https://support.bumble.com/hc/en-us/articles/30781191036317-Changes-to-Bumble-For-Friends-and-Bumble-BFF-Mode',
  },
  fdfSolitudesPage: {
    label: 'Fondation de France, « Isolement rural et solitude urbaine, un Français sur 4 se sent seul », étude Solitudes (15e édition, Crédoc), 20 janvier 2026',
    url: 'https://www.fondationdefrance.org/fr/les-solitudes-en-france/etude-solitudes-2026',
  },
  lyonFdl2026: {
    label: 'Ville de Lyon, « Fête des Lumières 2026 », du 5 au 8 décembre 2026',
    url: 'https://www.lyon.fr/evenement/festival/fete-des-lumieres-2026',
  },
  franceFdl2026: {
    label: 'France.fr, « Fête des Lumières à Lyon » (horaires et lieux), mis à jour le 5 novembre 2026',
    url: 'https://www.france.fr/fr/evenement/fete-des-lumieres-lyon/',
  },
} as const satisfies Record<string, Source>;
