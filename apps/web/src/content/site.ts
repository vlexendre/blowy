/**
 * Textes communs à toutes les pages du site (barre du haut, pied de page, stores, sélecteur de langue, bannière
 * « Available in English »), dans les cinq langues. Les liens légaux pointent vers les pages légales de la même langue.
 */
import { siteMessages } from '../i18n/site';

const fr = {
  skip: 'aller au contenu',
  homeLabel: 'Minimoa, accueil',
  download: 'Télécharger',
  stores: {
    apple: { small: 'Télécharger sur', soon: 'Bientôt sur' },
    google: { small: 'Disponible sur', soon: 'Bientôt sur' },
  },
  footer: {
    label: 'Liens légaux',
    links: { assistance: 'Aide', 'mentions-legales': 'Mentions légales', conditions: 'Conditions', confidentialite: 'Confidentialité', index: 'Tout le légal' },
  },
  /** Sélecteur de langue (nom de la liste, et « Français » en tête du menu). */
  language: 'Langue',
  /** Bannière proposée à un navigateur dans cette langue, sur une page d'une autre langue. */
  banner: { text: 'Disponible en français', go: 'Voir la page', close: 'Fermer' },
};

export type SiteText = typeof fr;

export const siteText = siteMessages<SiteText>({
  fr,
  en: {
    skip: 'skip to content',
    homeLabel: 'Minimoa, home',
    download: 'Download',
    stores: {
      apple: { small: 'Download on the', soon: 'Coming soon to' },
      google: { small: 'Get it on', soon: 'Coming soon to' },
    },
    footer: {
      label: 'Legal links',
      links: { assistance: 'Help', 'mentions-legales': 'Legal notice', conditions: 'Terms', confidentialite: 'Privacy', index: 'All legal' },
    },
    language: 'Language',
    banner: { text: 'Available in English', go: 'Open', close: 'Close' },
  },
  es: {
    skip: 'ir al contenido',
    homeLabel: 'Minimoa, inicio',
    download: 'Descargar',
    stores: {
      apple: { small: 'Descárgalo en', soon: 'Muy pronto en' },
      google: { small: 'Disponible en', soon: 'Muy pronto en' },
    },
    footer: {
      label: 'Enlaces legales',
      links: { assistance: 'Ayuda', 'mentions-legales': 'Aviso legal', conditions: 'Condiciones', confidentialite: 'Privacidad', index: 'Todo lo legal' },
    },
    language: 'Idioma',
    banner: { text: 'Disponible en español', go: 'Ver la página', close: 'Cerrar' },
  },
  pt: {
    skip: 'ir para o conteúdo',
    homeLabel: 'Minimoa, início',
    download: 'Baixar',
    stores: {
      apple: { small: 'Baixar na', soon: 'Em breve na' },
      google: { small: 'Disponível no', soon: 'Em breve no' },
    },
    footer: {
      label: 'Links legais',
      links: { assistance: 'Ajuda', 'mentions-legales': 'Informação legal', conditions: 'Termos', confidentialite: 'Privacidade', index: 'Tudo o que é legal' },
    },
    language: 'Idioma',
    banner: { text: 'Disponível em português', go: 'Ver a página', close: 'Fechar' },
  },
  nl: {
    skip: 'naar de inhoud',
    homeLabel: 'Minimoa, home',
    download: 'Downloaden',
    stores: {
      apple: { small: 'Download in de', soon: 'Binnenkort in de' },
      google: { small: 'Ontdek het op', soon: 'Binnenkort op' },
    },
    footer: {
      label: 'Juridische links',
      links: { assistance: 'Hulp', 'mentions-legales': 'Colofon', conditions: 'Voorwaarden', confidentialite: 'Privacy', index: 'Alles juridisch' },
    },
    language: 'Taal',
    banner: { text: 'Beschikbaar in het Nederlands', go: 'Bekijk de pagina', close: 'Sluiten' },
  },
});
